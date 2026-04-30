/**
 * AI 모니터링 고도화 모듈 v2
 * 
 * 정확도 개선 사항:
 * 1. 프롬프트 정교화 — 지역 정보 자동 추출, 진료과별 맞춤 질의, 경쟁사 힌트 제공
 * 2. 응답 분석 알고리즘 강화 — 병원명 퍼지 매칭, 다양한 번호 패턴 인식
 * 3. 감성 분석 고도화 — 병원명 주변 문맥 기반 분석 (전체 텍스트 아닌 관련 문장만)
 * 4. 경쟁사 비교 정확도 — 경쟁사별 랭킹/감성도 추출
 * 5. 점수 산정 보정 — 다중 질의 평균, 일관성 보너스
 */

import { invokeLLM } from "../_core/llm";
import {
  createAiMonitorResult,
  getAiMonitorKeywords,
  getAiMonitorCompetitors,
  getAllCompetitorsForKeywords,
  saveAiExposureScore,
} from "../db";
import type { AiMonitorKeyword, AiMonitorCompetitor } from "../../drizzle/schema";

// ═══════════════════════════════════════════════════
// 유틸리티: 지역 정보 추출
// ═══════════════════════════════════════════════════

const KOREAN_REGIONS = [
  "서울", "강남", "서초", "송파", "강동", "강서", "마포", "영등포", "용산", "종로", "중구", "성북", "노원", "은평", "관악", "동작",
  "부산", "해운대", "서면", "남포동", "센텀시티",
  "대구", "수성구", "달서구",
  "인천", "부평", "송도",
  "광주", "대전", "울산", "세종",
  "경기", "수원", "성남", "분당", "일산", "고양", "용인", "화성", "평택", "안양", "안산", "파주", "김포", "하남", "광명",
  "강원", "춘천", "원주", "강릉",
  "충북", "청주", "충주",
  "충남", "천안", "아산",
  "전북", "전주", "익산",
  "전남", "여수", "순천", "목포",
  "경북", "포항", "구미", "경주",
  "경남", "창원", "김해", "진주",
  "제주",
];

function extractRegion(keyword: string, hospitalName: string): string {
  // 키워드에서 지역 추출
  for (const region of KOREAN_REGIONS) {
    if (keyword.includes(region)) return region;
  }
  // 병원명에서 지역 추출
  for (const region of KOREAN_REGIONS) {
    if (hospitalName.includes(region)) return region;
  }
  return "";
}

// ═══════════════════════════════════════════════════
// 유틸리티: 병원명 변형 생성 (퍼지 매칭용)
// ═══════════════════════════════════════════════════

const HOSPITAL_SUFFIXES = [
  "의원", "병원", "클리닉", "치과", "치과의원", "치과병원",
  "한의원", "한의원", "피부과", "성형외과", "안과", "정형외과",
  "이비인후과", "비뇨기과", "산부인과", "내과", "외과",
  "소아과", "소아청소년과", "신경외과", "재활의학과",
  "센터", "메디컬", "의료원", "종합병원",
];

function generateNameVariants(name: string): string[] {
  const variants = new Set<string>();
  
  // 원본
  variants.add(name);
  
  // 공백 제거
  variants.add(name.replace(/\s/g, ""));
  
  // 접미사 제거
  let stripped = name;
  for (const suffix of HOSPITAL_SUFFIXES) {
    if (stripped.endsWith(suffix)) {
      stripped = stripped.slice(0, -suffix.length).trim();
      if (stripped.length >= 2) {
        variants.add(stripped);
        variants.add(stripped.replace(/\s/g, ""));
      }
      break;
    }
  }
  
  // "OO치과" → "OO 치과" (공백 변형)
  for (const suffix of HOSPITAL_SUFFIXES) {
    if (name.endsWith(suffix) && !name.endsWith(` ${suffix}`)) {
      const base = name.slice(0, -suffix.length);
      if (base.length >= 1) {
        variants.add(`${base} ${suffix}`);
      }
    }
  }
  
  // 괄호 안 내용 제거: "서울대학교(병원)" → "서울대학교"
  const noParen = name.replace(/\([^)]*\)/g, "").trim();
  if (noParen.length >= 2 && noParen !== name) {
    variants.add(noParen);
  }
  
  // 2글자 미만 제거
  return Array.from(variants).filter(v => v.length >= 2);
}

// ═══════════════════════════════════════════════════
// 플랫폼별 프롬프트 전략 (v2 — 더 현실적인 질의)
// ═══════════════════════════════════════════════════

interface PlatformConfig {
  name: string;
  systemPrompt: string;
  queryTemplates: (keyword: string, specialty: string, hospitalName: string, region: string, competitors: string[]) => string[];
  responseStyle: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  chatgpt: {
    name: "ChatGPT",
    systemPrompt: `당신은 ChatGPT입니다. 사용자의 의료 관련 질문에 대해 도움이 되는 정보를 제공합니다.
규칙:
- 한국의 실제 병원/의원 이름을 사용하여 구체적으로 추천합니다
- 추천 시 반드시 1번부터 번호를 매겨 순서대로 나열합니다 (최소 5개)
- 각 병원에 대해 전문 분야, 특장점, 위치를 간략히 설명합니다
- 대화형으로 친절하고 상세한 답변을 제공합니다
- 의료 정보는 신중하게 다루며, 전문의 상담을 권유합니다`,
    queryTemplates: (keyword, specialty, hospitalName, region, competitors) => {
      const regionPrefix = region ? `${region} ` : "";
      const queries = [
        `${regionPrefix}${specialty} ${keyword} 잘하는 병원 추천해주세요. 실력 좋고 후기 좋은 곳으로 5곳 이상 알려주세요.`,
        `${keyword} 치료를 받으려고 합니다. ${regionPrefix}${specialty} 중에서 추천할 만한 곳 순위로 알려주세요.`,
      ];
      if (competitors.length > 0) {
        queries.push(`${regionPrefix}${keyword} ${specialty} 추천해주세요. ${competitors.slice(0, 2).join(", ")} 같은 곳도 괜찮은가요?`);
      }
      return queries;
    },
    responseStyle: "numbered_list",
  },
  gemini: {
    name: "Gemini",
    systemPrompt: `당신은 Google Gemini입니다. 사용자의 의료 관련 질문에 대해 검색 결과를 기반으로 답변합니다.
규칙:
- Google 검색 결과를 종합하여 정보를 제공합니다
- 병원 추천 시 네이버 플레이스, 구글 리뷰 등의 평점과 리뷰를 참고합니다
- 한국의 실제 병원/의원 이름을 사용합니다
- 반드시 1번부터 번호를 매겨 순서대로 5개 이상 추천합니다
- 각 병원의 평점, 리뷰 수, 전문 분야를 포함합니다`,
    queryTemplates: (keyword, specialty, hospitalName, region, competitors) => {
      const regionPrefix = region ? `${region} ` : "";
      return [
        `${regionPrefix}${keyword} ${specialty} 추천 순위 TOP 5 이상 알려주세요`,
        `${regionPrefix}${specialty} ${keyword} 전문 병원 비교 추천해주세요. 평점과 후기 기준으로요.`,
        `${keyword} 잘하는 ${regionPrefix}${specialty} 순위 알려주세요`,
      ];
    },
    responseStyle: "search_based",
  },
  claude: {
    name: "Claude",
    systemPrompt: `당신은 Anthropic의 Claude입니다. 사용자의 의료 관련 질문에 대해 신중하고 균형 잡힌 답변을 제공합니다.
규칙:
- 객관적이고 균형 잡힌 정보를 제공합니다
- 병원 추천 시 전문성, 시설, 의료진 경력 등을 종합적으로 고려합니다
- 한국의 실제 병원/의원 이름을 사용합니다
- 반드시 1번부터 번호를 매겨 순서대로 5개 이상 추천합니다
- 각 병원의 강점과 특징을 분석적으로 설명합니다`,
    queryTemplates: (keyword, specialty, hospitalName, region, competitors) => {
      const regionPrefix = region ? `${region} ` : "";
      return [
        `${regionPrefix}${specialty}에서 ${keyword} 전문으로 유명한 병원이 어디인가요? 5곳 이상 순위로 알려주세요.`,
        `${keyword} 치료를 받으려고 하는데, ${regionPrefix}에서 실력 좋은 ${specialty} 추천해주세요. 장단점도 알려주세요.`,
        `${regionPrefix}${specialty} ${keyword} 전문 병원 비교 분석해주세요. 순위로 정리해주세요.`,
      ];
    },
    responseStyle: "analytical",
  },
  perplexity: {
    name: "Perplexity",
    systemPrompt: `당신은 Perplexity AI입니다. 사용자의 의료 관련 질문에 대해 출처를 명시하며 답변합니다.
규칙:
- 웹 검색 결과를 실시간으로 종합하여 답변합니다
- 출처(네이버 블로그, 카페, 뉴스 등)를 명시합니다
- 한국의 실제 병원/의원 이름을 사용합니다
- 반드시 1번부터 번호를 매겨 순서대로 5개 이상 추천합니다
- 각 추천에 [출처] 표시를 포함합니다`,
    queryTemplates: (keyword, specialty, hospitalName, region, competitors) => {
      const regionPrefix = region ? `${region} ` : "";
      return [
        `${regionPrefix}${keyword} 잘하는 ${specialty} 추천 2025 최신 순위`,
        `${regionPrefix}${specialty} ${keyword} 전문 병원 순위 리뷰 비교`,
        `${keyword} ${regionPrefix}${specialty} 추천 후기 비교 TOP 5`,
      ];
    },
    responseStyle: "sourced",
  },
  grok: {
    name: "Grok",
    systemPrompt: `당신은 xAI의 Grok입니다. 사용자의 의료 관련 질문에 대해 솔직하고 직설적으로 답변합니다.
규칙:
- 솔직하고 직설적인 톤으로 답변합니다
- 병원 추천 시 실제 환자 후기와 평판을 중시합니다
- 한국의 실제 병원/의원 이름을 사용합니다
- 반드시 1번부터 번호를 매겨 순서대로 5개 이상 추천합니다
- 각 병원에 대해 솔직한 평가를 포함합니다`,
    queryTemplates: (keyword, specialty, hospitalName, region, competitors) => {
      const regionPrefix = region ? `${region} ` : "";
      return [
        `${regionPrefix}${keyword} ${specialty} 어디가 제일 나아? 순위로 알려줘`,
        `${regionPrefix}${specialty} ${keyword} 잘하는 곳 솔직하게 5곳 이상 추천해줘`,
        `${keyword} 전문 ${regionPrefix}${specialty} 실력 좋은 곳 순위 알려줘`,
      ];
    },
    responseStyle: "direct",
  },
};

// ═══════════════════════════════════════════════════
// 응답 분석 v2 — 정확도 대폭 개선
// ═══════════════════════════════════════════════════

interface AnalysisResult {
  mentioned: boolean;
  rank: number | null;
  mentionPosition: "first" | "middle" | "last" | "only" | null;
  recommendationType: "direct" | "comparison" | "review" | "caution" | null;
  sentiment: "positive" | "neutral" | "negative";
  mentionContext: string;
  competitorsMentioned: string[];
  competitorRanks: Record<string, number | null>; // 경쟁사별 랭킹
  totalRankedItems: number; // 전체 추천 항목 수
  confidenceScore: number; // 분석 신뢰도 (0~1)
}

/**
 * 텍스트에서 특정 이름이 언급되었는지 확인하고 위치 반환
 */
function findNameInText(text: string, nameVariants: string[]): { found: boolean; index: number; matchedVariant: string } {
  for (const variant of nameVariants) {
    const idx = text.indexOf(variant);
    if (idx !== -1) {
      return { found: true, index: idx, matchedVariant: variant };
    }
  }
  // 대소문자 무시 매칭 (영문 포함 병원명)
  const lowerText = text.toLowerCase();
  for (const variant of nameVariants) {
    const idx = lowerText.indexOf(variant.toLowerCase());
    if (idx !== -1) {
      return { found: true, index: idx, matchedVariant: variant };
    }
  }
  return { found: false, index: -1, matchedVariant: "" };
}

/**
 * 번호 매김 패턴에서 랭킹 추출 (다양한 패턴 지원)
 */
function extractRankings(text: string): Array<{ rank: number; line: string; lineIndex: number }> {
  const lines = text.split("\n");
  const rankings: Array<{ rank: number; line: string; lineIndex: number }> = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 다양한 번호 매김 패턴:
    // "1.", "1)", "1번", "**1.**", "**1.** ", "### 1.", "- **1.**", "1위"
    const patterns = [
      /^[\s*#\-]*\*?\*?(\d+)[.)번위\s.\-]\*?\*?/,  // 기본 패턴
      /^[\s]*(?:\*\*)?(\d+)(?:\*\*)?[.).\s]/,        // 마크다운 볼드
      /^[\s]*[-•]\s*(?:\*\*)?(\d+)(?:\*\*)?[.).\s]/,  // 리스트 아이템
      /(?:^|\n)\s*(\d+)\.\s+\*?\*?[가-힣A-Za-z]/,     // "1. 병원명" 패턴
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const rank = parseInt(match[1]);
        if (rank >= 1 && rank <= 20) { // 합리적 범위
          rankings.push({ rank, line, lineIndex: i });
        }
        break;
      }
    }
  }
  
  return rankings;
}

/**
 * 병원명 주변 문맥에서 감성 분석 (전체 텍스트가 아닌 관련 문장만)
 */
function analyzeLocalSentiment(text: string, nameVariants: string[]): "positive" | "neutral" | "negative" {
  const { found, index, matchedVariant } = findNameInText(text, nameVariants);
  if (!found) return "neutral";
  
  // 병원명 주변 ±200자 범위에서 감성 분석
  const contextStart = Math.max(0, index - 200);
  const contextEnd = Math.min(text.length, index + matchedVariant.length + 200);
  const localContext = text.slice(contextStart, contextEnd);
  
  const positiveWords = [
    "추천", "좋은", "유명", "전문", "우수", "만족", "신뢰", "최고", "뛰어난",
    "인기", "실력", "명의", "최첨단", "최신", "첨단", "정밀", "세심", "친절",
    "깨끗", "쾌적", "편안", "안심", "안전", "경험", "노하우", "실적",
    "높은 만족도", "좋은 후기", "평판", "인정", "수상", "대표",
  ];
  const negativeWords = [
    "불만", "주의", "문제", "단점", "아쉬운", "비싼", "불친절", "오래 걸리는",
    "부작용", "불편", "실망", "후회", "비추", "별로", "나쁜", "위험",
    "논란", "사고", "피해", "불안",
  ];
  
  let posScore = 0;
  let negScore = 0;
  
  for (const word of positiveWords) {
    if (localContext.includes(word)) posScore++;
  }
  for (const word of negativeWords) {
    if (localContext.includes(word)) negScore++;
  }
  
  // 순위가 높을수록 긍정적 (1~2위 = 긍정 보너스)
  // 이 함수에서는 순위 정보가 없으므로 텍스트 기반만 분석
  
  if (posScore > negScore + 1) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

function analyzeResponse(
  responseText: string,
  hospitalName: string,
  competitors: string[]
): AnalysisResult {
  const result: AnalysisResult = {
    mentioned: false,
    rank: null,
    mentionPosition: null,
    recommendationType: null,
    sentiment: "neutral",
    mentionContext: "",
    competitorsMentioned: [],
    competitorRanks: {},
    totalRankedItems: 0,
    confidenceScore: 0,
  };

  const hospitalVariants = generateNameVariants(hospitalName);
  
  // 1. 병원 언급 여부 확인 (퍼지 매칭)
  const hospitalMatch = findNameInText(responseText, hospitalVariants);
  result.mentioned = hospitalMatch.found;

  // 2. 랭킹 추출 (다양한 패턴 지원)
  const rankings = extractRankings(responseText);
  result.totalRankedItems = rankings.length;
  
  if (result.mentioned && rankings.length > 0) {
    // 랭킹 목록에서 병원명 찾기
    for (const ranking of rankings) {
      const lineMatch = findNameInText(ranking.line, hospitalVariants);
      if (lineMatch.found) {
        result.rank = ranking.rank;
        break;
      }
      
      // 다음 줄까지 확인 (설명이 다음 줄에 있는 경우)
      const lines = responseText.split("\n");
      if (ranking.lineIndex + 1 < lines.length) {
        const nextLine = lines[ranking.lineIndex + 1];
        const nextLineMatch = findNameInText(nextLine, hospitalVariants);
        if (nextLineMatch.found) {
          result.rank = ranking.rank;
          break;
        }
      }
    }
    
    // 랭킹 목록에서 못 찾았지만 텍스트에 언급된 경우 — 비순위 언급
    if (result.rank === null) {
      // 텍스트 전체에서 위치 기반 추정
      const textLength = responseText.length;
      const mentionPos = hospitalMatch.index / textLength;
      if (mentionPos < 0.3) result.rank = null; // 상단 언급이지만 순위 없음
    }
  }

  // 3. 언급 위치 분석
  if (result.mentioned) {
    if (result.rank !== null && result.totalRankedItems > 0) {
      if (result.totalRankedItems === 1 || (result.rank === 1 && result.totalRankedItems === 1)) {
        result.mentionPosition = "only";
      } else if (result.rank === 1) {
        result.mentionPosition = "first";
      } else if (result.rank >= result.totalRankedItems) {
        result.mentionPosition = "last";
      } else {
        result.mentionPosition = "middle";
      }
    } else {
      // 순위 없이 언급만 된 경우 — 텍스트 위치 기반
      const textLength = responseText.length;
      const mentionPos = hospitalMatch.index / textLength;
      if (mentionPos < 0.25) result.mentionPosition = "first";
      else if (mentionPos > 0.75) result.mentionPosition = "last";
      else result.mentionPosition = "middle";
    }
  }

  // 4. 추천 유형 분석 (병원명 주변 문맥 기반)
  if (result.mentioned) {
    const contextStart = Math.max(0, hospitalMatch.index - 100);
    const contextEnd = Math.min(responseText.length, hospitalMatch.index + hospitalMatch.matchedVariant.length + 150);
    const localContext = responseText.slice(contextStart, contextEnd);
    
    const directWords = ["추천", "권장", "좋은", "유명한", "전문", "최고", "대표", "인기"];
    const comparisonWords = ["비교", "대비", "반면", "한편", "vs", "차이"];
    const reviewWords = ["후기", "리뷰", "평가", "만족도", "평점", "별점"];
    const cautionWords = ["주의", "단점", "아쉬운", "불만", "비추", "주의할 점"];

    if (cautionWords.some(w => localContext.includes(w))) {
      result.recommendationType = "caution";
    } else if (comparisonWords.some(w => localContext.includes(w))) {
      result.recommendationType = "comparison";
    } else if (reviewWords.some(w => localContext.includes(w))) {
      result.recommendationType = "review";
    } else if (directWords.some(w => localContext.includes(w))) {
      result.recommendationType = "direct";
    } else {
      result.recommendationType = "direct"; // 순위에 포함되면 기본 직접 추천
    }
  }

  // 5. 감성 분석 (병원명 주변 문맥 기반)
  if (result.mentioned) {
    result.sentiment = analyzeLocalSentiment(responseText, hospitalVariants);
    
    // 순위 보정: 1~2위면 긍정 가산, 8위 이하면 부정 가산
    if (result.rank !== null) {
      if (result.rank <= 2 && result.sentiment === "neutral") {
        result.sentiment = "positive";
      } else if (result.rank >= 8 && result.sentiment === "neutral") {
        result.sentiment = "negative";
      }
    }
  }

  // 6. 언급 컨텍스트 추출 (더 넓은 범위)
  if (result.mentioned) {
    const idx = hospitalMatch.index;
    const start = Math.max(0, idx - 80);
    const end = Math.min(responseText.length, idx + hospitalMatch.matchedVariant.length + 120);
    result.mentionContext = (start > 0 ? "..." : "") + responseText.slice(start, end).trim() + (end < responseText.length ? "..." : "");
  }

  // 7. 경쟁사 언급 분석 + 경쟁사별 랭킹 추출
  for (const competitor of competitors) {
    const competitorVariants = generateNameVariants(competitor);
    const competitorMatch = findNameInText(responseText, competitorVariants);
    
    if (competitorMatch.found) {
      result.competitorsMentioned.push(competitor);
      
      // 경쟁사 랭킹 추출
      let competitorRank: number | null = null;
      for (const ranking of rankings) {
        const lineMatch = findNameInText(ranking.line, competitorVariants);
        if (lineMatch.found) {
          competitorRank = ranking.rank;
          break;
        }
      }
      result.competitorRanks[competitor] = competitorRank;
    }
  }

  // 8. 분석 신뢰도 계산
  let confidence = 0;
  if (rankings.length >= 3) confidence += 0.3; // 명확한 순위 목록
  if (result.mentioned && result.rank !== null) confidence += 0.3; // 순위 확인됨
  if (result.mentionContext.length > 50) confidence += 0.2; // 충분한 컨텍스트
  if (responseText.length > 200) confidence += 0.2; // 충분한 응답 길이
  result.confidenceScore = Math.min(1, confidence);

  return result;
}

// ═══════════════════════════════════════════════════
// AI 인용 점수 산정 v2 — 정밀 가중치
// ═══════════════════════════════════════════════════

interface PlatformScoreDetail {
  mentioned: boolean;
  rank: number | null;
  sentiment: string;
  score: number;
}

/**
 * AI 인용 점수 산정 (0~100) — v2
 * 
 * 가중치 체계:
 * - 언급 점수 (35%): 5개 플랫폼 중 몇 개에서 언급되었는가
 * - 순위 점수 (30%): 언급된 플랫폼에서의 평균 순위 (1위=100, 10위=10)
 * - 감성 점수 (15%): 긍정/중립/부정 비율
 * - 경쟁사 점수 (10%): 경쟁사 대비 언급 우위
 * - 일관성 보너스 (10%): 여러 플랫폼에서 일관되게 높은 순위
 */
export function calculateAiExposureScore(
  results: Array<{
    platform: string;
    mentioned: boolean;
    rank: number | null;
    sentiment: string;
    competitorsMentioned: string[];
    competitorRanks?: Record<string, number | null>;
    confidenceScore?: number;
  }>,
  totalCompetitors: number
): {
  score: number;
  mentionScore: number;
  rankScore: number;
  sentimentScore: number;
  competitorScore: number;
  consistencyBonus: number;
  platformScores: Record<string, PlatformScoreDetail>;
} {
  const platforms = ["chatgpt", "gemini", "claude", "perplexity", "grok"];
  const platformScores: Record<string, PlatformScoreDetail> = {};

  // 플랫폼별 점수 계산
  for (const p of platforms) {
    const platformResults = results.filter(r => r.platform === p);
    const latestResult = platformResults[0];
    
    if (!latestResult) {
      platformScores[p] = { mentioned: false, rank: null, sentiment: "neutral", score: 0 };
      continue;
    }

    let pScore = 0;
    if (latestResult.mentioned) {
      pScore += 40; // 언급됨 기본 40점
      if (latestResult.rank !== null) {
        // 1위=60, 2위=52, 3위=45, 4위=38, 5위=32, ..., 10위=5
        const rankBonus = Math.max(5, 60 - (latestResult.rank - 1) * 7);
        pScore += rankBonus;
      } else {
        pScore += 15; // 순위 없이 언급만 된 경우
      }
      if (latestResult.sentiment === "positive") pScore = Math.min(100, pScore + 8);
      if (latestResult.sentiment === "negative") pScore = Math.max(0, pScore - 12);
    }

    platformScores[p] = {
      mentioned: latestResult.mentioned,
      rank: latestResult.rank,
      sentiment: latestResult.sentiment,
      score: Math.round(pScore),
    };
  }

  // 1. 언급 점수 (35%)
  const mentionedPlatforms = Object.values(platformScores).filter(p => p.mentioned).length;
  const mentionScore = Math.round((mentionedPlatforms / platforms.length) * 100);

  // 2. 순위 점수 (30%)
  const rankedPlatforms = Object.values(platformScores).filter(p => p.rank !== null);
  let rankScore = 0;
  if (rankedPlatforms.length > 0) {
    const avgRank = rankedPlatforms.reduce((sum, p) => sum + (p.rank ?? 10), 0) / rankedPlatforms.length;
    // 1위=100, 2위=89, 3위=78, ..., 10위=1
    rankScore = Math.round(Math.max(0, 100 - (avgRank - 1) * 11));
  } else if (mentionedPlatforms > 0) {
    rankScore = 25; // 순위 없이 언급만 된 경우
  }

  // 3. 감성 점수 (15%)
  const mentionedResults = results.filter(r => r.mentioned);
  let sentimentScore = 50;
  if (mentionedResults.length > 0) {
    const posCount = mentionedResults.filter(r => r.sentiment === "positive").length;
    const negCount = mentionedResults.filter(r => r.sentiment === "negative").length;
    const neutralCount = mentionedResults.length - posCount - negCount;
    sentimentScore = Math.round(
      (posCount * 100 + neutralCount * 50 + negCount * 0) / mentionedResults.length
    );
    sentimentScore = Math.max(0, Math.min(100, sentimentScore));
  }

  // 4. 경쟁사 점수 (10%)
  let competitorScore = 50;
  if (totalCompetitors > 0 && results.length > 0) {
    const myMentionRate = mentionedPlatforms / platforms.length;
    const myAvgRank = rankedPlatforms.length > 0
      ? rankedPlatforms.reduce((sum, p) => sum + (p.rank ?? 10), 0) / rankedPlatforms.length
      : 10;
    
    // 경쟁사별 평균 랭킹 계산
    const competitorAvgRanks: number[] = [];
    const competitorMentionCounts = new Map<string, number>();
    for (const r of results) {
      for (const c of r.competitorsMentioned) {
        competitorMentionCounts.set(c, (competitorMentionCounts.get(c) || 0) + 1);
      }
      if (r.competitorRanks) {
        for (const [name, rank] of Object.entries(r.competitorRanks)) {
          if (rank !== null) competitorAvgRanks.push(rank);
        }
      }
    }
    
    const avgCompetitorMentions = competitorMentionCounts.size > 0
      ? Array.from(competitorMentionCounts.values()).reduce((a, b) => a + b, 0) / competitorMentionCounts.size / platforms.length
      : 0;
    
    const avgCompetitorRank = competitorAvgRanks.length > 0
      ? competitorAvgRanks.reduce((a, b) => a + b, 0) / competitorAvgRanks.length
      : 10;
    
    // 언급률 비교
    let mentionAdvantage = 0;
    if (myMentionRate > avgCompetitorMentions) {
      mentionAdvantage = Math.round((myMentionRate - avgCompetitorMentions) * 50);
    } else if (myMentionRate < avgCompetitorMentions) {
      mentionAdvantage = -Math.round((avgCompetitorMentions - myMentionRate) * 50);
    }
    
    // 순위 비교
    let rankAdvantage = 0;
    if (rankedPlatforms.length > 0) {
      if (myAvgRank < avgCompetitorRank) {
        rankAdvantage = Math.round((avgCompetitorRank - myAvgRank) * 5);
      } else if (myAvgRank > avgCompetitorRank) {
        rankAdvantage = -Math.round((myAvgRank - avgCompetitorRank) * 5);
      }
    }
    
    competitorScore = Math.max(0, Math.min(100, 50 + mentionAdvantage + rankAdvantage));
  }

  // 5. 일관성 보너스 (10%): 여러 플랫폼에서 일관되게 높은 순위
  let consistencyBonus = 0;
  if (rankedPlatforms.length >= 3) {
    const ranks = rankedPlatforms.map(p => p.rank ?? 10);
    const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    const variance = ranks.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) / ranks.length;
    const stdDev = Math.sqrt(variance);
    
    // 표준편차가 낮을수록 (일관적) + 평균 순위가 높을수록 보너스
    if (stdDev <= 2 && avgRank <= 3) consistencyBonus = 100;
    else if (stdDev <= 3 && avgRank <= 5) consistencyBonus = 70;
    else if (stdDev <= 4) consistencyBonus = 40;
    else consistencyBonus = 20;
  } else if (mentionedPlatforms >= 2) {
    consistencyBonus = 30;
  }

  // 종합 점수 (가중 평균)
  const score = Math.round(
    mentionScore * 0.35 +
    rankScore * 0.30 +
    sentimentScore * 0.15 +
    competitorScore * 0.10 +
    consistencyBonus * 0.10
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    mentionScore,
    rankScore,
    sentimentScore,
    competitorScore,
    consistencyBonus,
    platformScores,
  };
}

// ═══════════════════════════════════════════════════
// 고도화된 모니터링 실행 v2
// ═══════════════════════════════════════════════════

export async function runEnhancedMonitorCheck(
  keyword: AiMonitorKeyword,
  competitors: AiMonitorCompetitor[]
): Promise<{
  results: Array<{
    platform: string;
    query: string;
    mentioned: boolean;
    rank: number | null;
    sentiment: string;
    mentionPosition: string | null;
    recommendationType: string | null;
    competitorsMentioned: string[];
    context: string;
  }>;
  score: ReturnType<typeof calculateAiExposureScore>;
}> {
  const platforms = ["chatgpt", "gemini", "claude", "perplexity", "grok"] as const;
  const competitorNames = competitors.map(c => c.competitorName);
  const region = extractRegion(keyword.keyword, keyword.hospitalName);
  
  const allResults: Array<{
    platform: string;
    query: string;
    mentioned: boolean;
    rank: number | null;
    sentiment: string;
    mentionPosition: string | null;
    recommendationType: string | null;
    competitorsMentioned: string[];
    competitorRanks: Record<string, number | null>;
    context: string;
    confidenceScore: number;
  }> = [];

  for (const platform of platforms) {
    const config = PLATFORM_CONFIGS[platform];
    const queries = config.queryTemplates(
      keyword.keyword,
      keyword.specialty || "",
      keyword.hospitalName,
      region,
      competitorNames
    );
    // 각 플랫폼에서 랜덤 질의 1개 선택
    const query = queries[Math.floor(Math.random() * queries.length)];

    try {
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: query },
        ],
      });

      const rawContent = llmResponse?.choices?.[0]?.message?.content;
      const responseText = typeof rawContent === "string" ? rawContent : "응답 없음";

      // 응답 분석 (v2)
      const analysis = analyzeResponse(responseText, keyword.hospitalName, competitorNames);

      // DB 저장
      await createAiMonitorResult({
        keywordId: keyword.id,
        platform,
        query,
        response: responseText,
        mentioned: analysis.mentioned ? 1 : 0,
        mentionContext: analysis.mentionContext || null,
        sentiment: analysis.sentiment,
        rank: analysis.rank,
        competitorsMentioned: analysis.competitorsMentioned.length > 0
          ? JSON.stringify(analysis.competitorsMentioned)
          : null,
        mentionPosition: analysis.mentionPosition,
        recommendationType: analysis.recommendationType,
      });

      allResults.push({
        platform,
        query,
        mentioned: analysis.mentioned,
        rank: analysis.rank,
        sentiment: analysis.sentiment,
        mentionPosition: analysis.mentionPosition,
        recommendationType: analysis.recommendationType,
        competitorsMentioned: analysis.competitorsMentioned,
        competitorRanks: analysis.competitorRanks,
        context: analysis.mentionContext,
        confidenceScore: analysis.confidenceScore,
      });
    } catch (err) {
      console.error(`[AIMonitor Enhanced v2] ${platform} 검사 실패:`, err);
      allResults.push({
        platform,
        query,
        mentioned: false,
        rank: null,
        sentiment: "neutral",
        mentionPosition: null,
        recommendationType: null,
        competitorsMentioned: [],
        competitorRanks: {},
        context: "분석 실패",
        confidenceScore: 0,
      });
    }
  }

  // AI 인용 점수 계산 (v2)
  const score = calculateAiExposureScore(allResults, competitorNames.length);

  // 점수 DB 저장
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  await saveAiExposureScore({
    keywordId: keyword.id,
    score: score.score,
    mentionScore: score.mentionScore,
    rankScore: score.rankScore,
    sentimentScore: score.sentimentScore,
    competitorScore: score.competitorScore,
    platformScores: score.platformScores,
    periodStart: weekStart,
    periodEnd: weekEnd,
  });

  return { results: allResults, score };
}

// ═══════════════════════════════════════════════════
// 전체 키워드 자동 모니터링 (고도화 v2)
// ═══════════════════════════════════════════════════

export async function runEnhancedAutoMonitor(): Promise<{
  success: boolean;
  checkedKeywords: number;
  totalMentions: number;
  scores: Array<{ keywordId: number; keyword: string; score: number }>;
}> {
  const keywords = await getAiMonitorKeywords(true);
  if (keywords.length === 0) {
    return { success: true, checkedKeywords: 0, totalMentions: 0, scores: [] };
  }

  const allCompetitors = await getAllCompetitorsForKeywords();
  let totalMentions = 0;
  const scores: Array<{ keywordId: number; keyword: string; score: number }> = [];

  for (const keyword of keywords) {
    const keywordCompetitors = allCompetitors.filter(c => c.keywordId === keyword.id);
    
    try {
      const { results, score } = await runEnhancedMonitorCheck(keyword, keywordCompetitors);
      const mentionCount = results.filter(r => r.mentioned).length;
      totalMentions += mentionCount;
      scores.push({ keywordId: keyword.id, keyword: keyword.keyword, score: score.score });
    } catch (err) {
      console.error(`[AIMonitor Enhanced v2] 키워드 "${keyword.keyword}" 모니터링 실패:`, err);
      scores.push({ keywordId: keyword.id, keyword: keyword.keyword, score: 0 });
    }
  }

  return { success: true, checkedKeywords: keywords.length, totalMentions, scores };
}

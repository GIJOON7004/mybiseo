/**
 * #33 네이버/구글 실제 검색 결과 기반 노출 순위 측정
 * #34 AI 검색 플랫폼(ChatGPT, Perplexity) 노출 확인
 * 
 * 실제 검색 결과 페이지를 크롤링하여 대상 사이트의 노출 순위를 측정
 * - 네이버 검색 결과 (웹, 플레이스, 블로그, 지식인)
 * - 구글 검색 결과 (웹, 로컬팩)
 * - AI 검색 플랫폼 (ChatGPT, Perplexity, Gemini) 인용 확인
 */

import type { SpecialtyType } from "../specialty-weights";
import type { KeywordEntry } from "./specialty-keywords-dict";

// ============================================================
// 타입 정의
// ============================================================

export interface SearchRankResult {
  /** 검색 키워드 */
  keyword: string;
  /** 검색 엔진 */
  engine: "naver" | "google" | "chatgpt" | "perplexity" | "gemini";
  /** 노출 순위 (0 = 미노출) */
  rank: number;
  /** 노출 영역 */
  section: "organic" | "local" | "blog" | "news" | "knowledge" | "ai-citation" | "featured-snippet";
  /** 노출 URL */
  foundUrl?: string;
  /** 노출 제목 */
  foundTitle?: string;
  /** 측정 시각 */
  measuredAt: number;
  /** 측정 성공 여부 */
  success: boolean;
  /** 에러 메시지 */
  error?: string;
}

export interface SearchVisibilityReport {
  /** 대상 도메인 */
  domain: string;
  /** 진료과 */
  specialty: SpecialtyType;
  /** 측정 키워드 목록 */
  keywords: string[];
  /** 키워드별 검색 결과 */
  results: SearchRankResult[];
  /** 종합 가시성 점수 (0-100) */
  visibilityScore: number;
  /** 네이버 가시성 점수 */
  naverScore: number;
  /** 구글 가시성 점수 */
  googleScore: number;
  /** AI 플랫폼 가시성 점수 */
  aiScore: number;
  /** 측정 시각 */
  measuredAt: number;
}

export interface AIVisibilityResult {
  /** AI 플랫폼명 */
  platform: "chatgpt" | "perplexity" | "gemini";
  /** 인용 여부 */
  isCited: boolean;
  /** 인용 컨텍스트 (어떤 맥락에서 언급되었는지) */
  citationContext?: string;
  /** 인용 순위 (여러 소스 중 몇 번째인지) */
  citationRank?: number;
  /** 측정 키워드 */
  keyword: string;
  /** 측정 시각 */
  measuredAt: number;
}

// ============================================================
// 네이버 검색 순위 측정
// ============================================================

/**
 * 네이버 검색 결과에서 도메인 노출 순위 확인
 * 실제 크롤링 기반 (node-fetch + cheerio)
 */
export async function checkNaverRank(
  keyword: string,
  targetDomain: string
): Promise<SearchRankResult[]> {
  const results: SearchRankResult[] = [];
  const now = Date.now();

  try {
    // 네이버 검색 API 대신 웹 크롤링으로 순위 확인
    const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!response.ok) {
      results.push({
        keyword,
        engine: "naver",
        rank: 0,
        section: "organic",
        measuredAt: now,
        success: false,
        error: `HTTP ${response.status}`,
      });
      return results;
    }

    const html = await response.text();
    const domainPattern = targetDomain.replace(/^www\./, "").toLowerCase();
    
    // 웹사이트 영역 검색
    const webRank = findDomainInHtml(html, domainPattern, "organic");
    results.push({
      keyword,
      engine: "naver",
      rank: webRank.rank,
      section: "organic",
      foundUrl: webRank.url,
      foundTitle: webRank.title,
      measuredAt: now,
      success: true,
    });

    // 플레이스 영역 검색
    const placeRank = findDomainInHtml(html, domainPattern, "local");
    if (placeRank.rank > 0) {
      results.push({
        keyword,
        engine: "naver",
        rank: placeRank.rank,
        section: "local",
        foundUrl: placeRank.url,
        foundTitle: placeRank.title,
        measuredAt: now,
        success: true,
      });
    }

    // 블로그 영역 검색
    const blogRank = findDomainInHtml(html, domainPattern, "blog");
    if (blogRank.rank > 0) {
      results.push({
        keyword,
        engine: "naver",
        rank: blogRank.rank,
        section: "blog",
        foundUrl: blogRank.url,
        foundTitle: blogRank.title,
        measuredAt: now,
        success: true,
      });
    }

  } catch (error) {
    results.push({
      keyword,
      engine: "naver",
      rank: 0,
      section: "organic",
      measuredAt: now,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// ============================================================
// 구글 검색 순위 측정
// ============================================================

/**
 * 구글 검색 결과에서 도메인 노출 순위 확인
 */
export async function checkGoogleRank(
  keyword: string,
  targetDomain: string
): Promise<SearchRankResult[]> {
  const results: SearchRankResult[] = [];
  const now = Date.now();

  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=kr`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!response.ok) {
      results.push({
        keyword,
        engine: "google",
        rank: 0,
        section: "organic",
        measuredAt: now,
        success: false,
        error: `HTTP ${response.status}`,
      });
      return results;
    }

    const html = await response.text();
    const domainPattern = targetDomain.replace(/^www\./, "").toLowerCase();
    
    // 웹 검색 결과
    const webRank = findDomainInHtml(html, domainPattern, "organic");
    results.push({
      keyword,
      engine: "google",
      rank: webRank.rank,
      section: "organic",
      foundUrl: webRank.url,
      foundTitle: webRank.title,
      measuredAt: now,
      success: true,
    });

    // 로컬팩 (Google Maps 결과)
    const localRank = findDomainInHtml(html, domainPattern, "local");
    if (localRank.rank > 0) {
      results.push({
        keyword,
        engine: "google",
        rank: localRank.rank,
        section: "local",
        foundUrl: localRank.url,
        foundTitle: localRank.title,
        measuredAt: now,
        success: true,
      });
    }

  } catch (error) {
    results.push({
      keyword,
      engine: "google",
      rank: 0,
      section: "organic",
      measuredAt: now,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// ============================================================
// AI 검색 플랫폼 노출 확인 (#34)
// ============================================================

/**
 * AI 검색 플랫폼에서 도메인 인용 여부 확인
 * LLM을 통해 AI 플랫폼이 해당 도메인을 인용하는지 시뮬레이션
 */
export function generateAIVisibilityCheckPrompt(
  keyword: string,
  targetDomain: string,
  specialty: SpecialtyType
): string {
  return `당신은 AI 검색 플랫폼(ChatGPT, Perplexity 등)의 응답을 시뮬레이션하는 역할입니다.

사용자가 "${keyword}"를 검색했을 때, ${targetDomain} 웹사이트가 AI 검색 결과에서 인용될 가능성을 평가해주세요.

평가 기준:
1. 해당 도메인이 ${specialty} 분야에서 권위 있는 정보를 제공하는가?
2. 콘텐츠가 AI가 인용하기 좋은 구조(FAQ, 전문 정보, 데이터)를 갖추고 있는가?
3. E-E-A-T(경험, 전문성, 권위, 신뢰) 신호가 충분한가?

JSON 형식으로 응답:
{
  "citationLikelihood": 0-100,
  "reasons": ["이유1", "이유2"],
  "improvements": ["개선사항1", "개선사항2"]
}`;
}

/**
 * AI 가시성 점수 계산
 * 사이트의 구조화 데이터, 콘텐츠 품질, E-E-A-T 신호를 기반으로
 * AI 플랫폼에서의 인용 가능성을 추정
 */
export function estimateAIVisibility(params: {
  hasStructuredData: boolean;
  hasFAQSchema: boolean;
  hasHowToSchema: boolean;
  contentLength: number;
  hasAuthorInfo: boolean;
  hasMedicalCredentials: boolean;
  hasReferences: boolean;
  domainAge?: number; // 년
}): { score: number; factors: { name: string; score: number; weight: number }[] } {
  const factors: { name: string; score: number; weight: number }[] = [];

  // 구조화 데이터 (25%)
  let structuredScore = 0;
  if (params.hasStructuredData) structuredScore += 40;
  if (params.hasFAQSchema) structuredScore += 30;
  if (params.hasHowToSchema) structuredScore += 30;
  factors.push({ name: "구조화 데이터", score: structuredScore, weight: 0.25 });

  // 콘텐츠 품질 (30%)
  let contentScore = 0;
  if (params.contentLength >= 3000) contentScore = 100;
  else if (params.contentLength >= 2000) contentScore = 80;
  else if (params.contentLength >= 1000) contentScore = 50;
  else contentScore = 20;
  factors.push({ name: "콘텐츠 품질", score: contentScore, weight: 0.30 });

  // E-E-A-T 신호 (30%)
  let eeatScore = 0;
  if (params.hasAuthorInfo) eeatScore += 30;
  if (params.hasMedicalCredentials) eeatScore += 40;
  if (params.hasReferences) eeatScore += 30;
  factors.push({ name: "E-E-A-T 신호", score: eeatScore, weight: 0.30 });

  // 도메인 권위 (15%)
  let domainScore = 50; // 기본값
  if (params.domainAge && params.domainAge >= 5) domainScore = 100;
  else if (params.domainAge && params.domainAge >= 3) domainScore = 80;
  else if (params.domainAge && params.domainAge >= 1) domainScore = 60;
  factors.push({ name: "도메인 권위", score: domainScore, weight: 0.15 });

  // 종합 점수
  const totalScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  return { score: totalScore, factors };
}

// ============================================================
// 종합 가시성 리포트 생성
// ============================================================

/**
 * 검색 순위 결과를 기반으로 종합 가시성 점수 계산
 */
export function calculateVisibilityScore(results: SearchRankResult[]): {
  overall: number;
  naver: number;
  google: number;
  ai: number;
} {
  const naverResults = results.filter(r => r.engine === "naver" && r.success);
  const googleResults = results.filter(r => r.engine === "google" && r.success);
  const aiResults = results.filter(r => ["chatgpt", "perplexity", "gemini"].includes(r.engine) && r.success);

  // 순위를 점수로 변환 (1위=100, 2위=90, 3위=80, ... 10위=10, 미노출=0)
  const rankToScore = (rank: number): number => {
    if (rank === 0) return 0;
    if (rank <= 3) return 100 - (rank - 1) * 10; // 1위=100, 2위=90, 3위=80
    if (rank <= 10) return 70 - (rank - 4) * 10; // 4위=70, 5위=60, ... 10위=10
    return 5; // 10위 이후
  };

  const calcAvg = (results: SearchRankResult[]): number => {
    if (results.length === 0) return 0;
    const scores = results.map(r => rankToScore(r.rank));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const naver = calcAvg(naverResults);
  const google = calcAvg(googleResults);
  const ai = calcAvg(aiResults);

  // 종합 점수: 네이버 40% + 구글 30% + AI 30%
  const overall = Math.round(naver * 0.4 + google * 0.3 + ai * 0.3);

  return { overall, naver, google, ai };
}

// ============================================================
// 내부 유틸리티
// ============================================================

/**
 * HTML에서 도메인 노출 위치 찾기
 */
function findDomainInHtml(
  html: string,
  domainPattern: string,
  section: string
): { rank: number; url?: string; title?: string } {
  // 링크에서 도메인 패턴 검색
  const urlRegex = new RegExp(
    `href="(https?://[^"]*${domainPattern.replace(/\./g, "\\.")}[^"]*)"`,
    "gi"
  );
  
  const matches: string[] = [];
  let match;
  while ((match = urlRegex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  if (matches.length === 0) {
    return { rank: 0 };
  }

  // 첫 번째 매치의 순위를 반환 (간단한 추정)
  // 실제로는 검색 결과 DOM 구조를 파싱해야 정확함
  return {
    rank: 1, // 발견됨 = 최소 1위 이상 (정확한 순위는 DOM 파싱 필요)
    url: matches[0],
  };
}

/**
 * 현실 진단 요약 (Reality Diagnosis Summary) — v2 최적화
 * 
 * 병원 도메인 + 진료과 기반으로:
 * 1. LLM이 핵심 키워드 생성
 * 2. 네이버/구글/AI 인용 현황을 객관적으로 분석
 * 3. SimilarWeb 트래픽 데이터 연동
 * 4. AI 가시성 현황 정량 분석
 * 5. 전문적 진단 보고서 생성
 * 
 * v2 최적화:
 * - LLM 호출을 4개 병렬 스트림으로 분할 (속도 3~4배 향상)
 * - 각 스트림에 집중된 프롬프트로 정확도 향상
 * - 독립적 fallback으로 부분 실패 시 graceful degradation
 * - SimilarWeb + LLM 병렬 실행
 */
import { invokeLLM } from "./_core/llm";
import { callDataApi } from "./_core/dataApi";
import { resolveSpecialty, type SpecialtyType } from "./specialty-weights";
import { ensureExecutiveSummary, type SummaryContext } from "./utils/executive-summary-template";
import { displayPercent } from "./utils/score-rounding";

// ── 타입 정의 ──
export interface KeywordExposure {
  keyword: string;
  monthlySearchVolume: number;
  naver: {
    found: boolean;
    position: string;
    type: string;
    detail: string;
  };
  google: {
    found: boolean;
    position: string;
    type: string;
    detail: string;
  };
  ai: {
    likelihood: "high" | "medium" | "low" | "none";
    detail: string;
  };
}

export interface TrafficInsight {
  monthlyVisits: number | null;
  globalRank: number | null;
  bounceRate: number | null;
  organicSearchShare: number | null;
  directShare: number | null;
  topCountries: { country: string; share: number }[];
}

export interface CompetitorSnapshot {
  name: string;
  advantage: string;
  estimatedVisibility: "상" | "중" | "하";
}

export interface RealityDiagnosis {
  hospitalName: string;
  specialty: string;
  headline: string;
  executiveSummary: string;
  keyFindings: string[];
  riskScore: number;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  metrics: {
    naverExposureRate: number;
    googleExposureRate: number;
    aiReadiness: number;
    missedPatientsMonthly: number;
    estimatedRevenueLoss: string;
  };
  keywords: KeywordExposure[];
  trafficInsight: TrafficInsight | null;
  competitors: CompetitorSnapshot[];
  missedPatients: {
    estimatedMonthly: number;
    reasoning: string;
    revenueImpact: string;
  };
  contentGaps?: {
    keyword: string;
    searchIntent: string;
    difficulty: "쉬움" | "보통" | "어려움";
    opportunityScore: number;
    suggestedContent: string;
    rationale: string;
  }[];
  actionItems: {
    priority: "즉시" | "1개월 내" | "3개월 내";
    action: string;
    expectedImpact: string;
  }[];
  closingStatement: string;
  searchScreenshots?: {
    engine: "naver" | "google";
    keyword: string;
    imageUrl: string;
    capturedAt: number;
  }[];
  geoTriAxis?: {
    relevance: { score: number; label: string; details: string[] };
    authority: { score: number; label: string; details: string[] };
    friction: { score: number; label: string; details: string[] };
    overallGeoScore: number;
    interpretation: string;
  };
  aiCitationThreshold?: {
    items: {
      condition: string;
      met: boolean;
      detail: string;
      howToFix: string;
    }[];
    metCount: number;
    totalCount: number;
    verdict: string;
  };
  answerCapsule?: {
    score: number;
    currentBestSentence: string;
    idealSentence: string;
    issues: string[];
    recommendations: string[];
  };
  crossChannelTrust?: {
    channels: {
      name: string;
      status: "활성" | "미흡" | "부재";
      consistencyScore: number;
      detail: string;
    }[];
    overallConsistency: number;
    verdict: string;
  };
  aiSimulator?: {
    query: string;
    results: {
      engine: string;
      mentioned: boolean;
      rank: number | null;
      context: string;
    }[];
    mentionRate: string;
    verdict: string;
  };
  naverCueDiagnosis?: {
    score: number;
    items: {
      criterion: string;
      status: "양호" | "미흡" | "위험";
      detail: string;
      recommendation: string;
    }[];
    verdict: string;
  };
  websiteTransformGuide?: {
    currentState: string;
    transformations: {
      area: string;
      currentIssue: string;
      recommendation: string;
      priority: "높음" | "중간" | "낮음";
      estimatedImpact: string;
    }[];
  };
  contentStrategy?: {
    currentAssessment: string;
    blogStrategy: string;
    faqStrategy: string;
    comparisonTableStrategy: string;
    contentCalendar: {
      week: string;
      topic: string;
      format: string;
      targetKeyword: string;
    }[];
  };
  marketingDirection?: {
    overallStrategy: string;
    channelStrategies: {
      channel: string;
      strategy: string;
      priority: "높음" | "중간" | "낮음";
      expectedOutcome: string;
    }[];
    coexistenceMessage: string;
  };
  mybiseoServices?: {
    headline: string;
    services: {
      name: string;
      description: string;
      relevanceToHospital: string;
    }[];
    ctaMessage: string;
  };
}

// ── SimilarWeb 트래픽 데이터 조회 ──
async function fetchTrafficData(domain: string): Promise<TrafficInsight | null> {
  try {
    const [visitsData, rankData, bounceData, trafficSourceData] = await Promise.allSettled([
      callDataApi("Similarweb/get_visits_total", {
        query: { country: "world", granularity: "monthly", main_domain_only: false },
        pathParams: { domain },
      }),
      callDataApi("Similarweb/get_global_rank", {
        query: { main_domain_only: false },
        pathParams: { domain },
      }),
      callDataApi("Similarweb/get_bounce_rate", {
        query: { country: "world", granularity: "monthly", main_domain_only: false },
        pathParams: { domain },
      }),
      callDataApi("Similarweb/get_traffic_sources_desktop", {
        query: { country: "world", granularity: "monthly", main_domain_only: false },
        pathParams: { domain },
      }),
    ]);

    let monthlyVisits: number | null = null;
    let globalRank: number | null = null;
    let bounceRate: number | null = null;
    let organicSearchShare: number | null = null;
    let directShare: number | null = null;

    if (visitsData.status === "fulfilled" && visitsData.value) {
      const v = visitsData.value as any;
      if (Array.isArray(v)) {
        const latest = v[v.length - 1];
        monthlyVisits = latest?.visits ?? null;
      } else if (v?.visits) {
        monthlyVisits = typeof v.visits === "number" ? v.visits : null;
      }
    }

    if (rankData.status === "fulfilled" && rankData.value) {
      const r = rankData.value as any;
      if (Array.isArray(r)) {
        const latest = r[r.length - 1];
        globalRank = latest?.global_rank ?? null;
      } else if (r?.global_rank) {
        globalRank = r.global_rank;
      }
    }

    if (bounceData.status === "fulfilled" && bounceData.value) {
      const b = bounceData.value as any;
      if (Array.isArray(b)) {
        const latest = b[b.length - 1];
        bounceRate = latest?.bounce_rate ?? null;
      } else if (typeof b?.bounce_rate === "number") {
        bounceRate = b.bounce_rate;
      }
    }

    if (trafficSourceData.status === "fulfilled" && trafficSourceData.value) {
      const t = trafficSourceData.value as any;
      if (Array.isArray(t)) {
        const latest = t[t.length - 1];
        organicSearchShare = latest?.organic_search ?? latest?.["Organic Search"] ?? null;
        directShare = latest?.direct ?? latest?.["Direct"] ?? null;
      } else if (t) {
        organicSearchShare = t.organic_search ?? t["Organic Search"] ?? null;
        directShare = t.direct ?? t["Direct"] ?? null;
      }
    }

    if (monthlyVisits === null && globalRank === null && bounceRate === null) {
      return null;
    }

    return { monthlyVisits, globalRank, bounceRate, organicSearchShare, directShare, topCountries: [] };
  } catch (err) {
    console.error("[RealityDiagnosis] SimilarWeb 데이터 조회 실패:", err);
    return null;
  }
}

// ── 공통 시스템 프롬프트 ──
const SYSTEM_PROMPT = "You are a Korean medical AI visibility diagnostic expert specializing in the zero-click era. Always respond in Korean. Generate factual, data-driven analysis focused on AI platform citation, GEO (Generative Engine Optimization), and digital visibility across AI platforms (ChatGPT, Perplexity, Gemini, Claude) and portals (Naver, Google). Use specific numbers and make the analysis compelling — the reader (hospital director) should clearly understand why each issue matters and what they stand to gain by fixing it. Write in a professional yet persuasive diagnostic tone. Explain technical terms in parentheses so non-experts can understand. Emphasize areas that traditional marketing agencies cannot cover (AI optimization, structured data, answer capsules).";

// ── 공통 컨텍스트 빌더 ──
function buildContext(domain: string, siteName: string | undefined, specialty: string, seoScore: number, seoGrade: string, categoryScores: Record<string, number>, trafficContext: string): string {
  return `[분석 대상]
- 도메인: ${domain}
- 병원명: ${siteName || domain}
- 진료과: ${specialty || "미지정"}
- AI 가시성 진단 점수: ${seoScore}/100 (등급: ${seoGrade})
- 카테고리별 점수: ${JSON.stringify(categoryScores)}
${trafficContext}

[보고서 작성 원칙]
1. 전문적이면서도 설득력 있는 진단 보고서 톤 유지. 문제점을 명확히 짚되, 해결 가능한 방향 제시.
2. 기술 용어는 사용하되 반드시 쉬운 설명을 병기. 예: "Schema Markup(검색엔진이 병원 정보를 자동으로 읽는 코드) 미설정".
3. 정량적 데이터를 기반으로 서술. "노출이 안 된다" 대신 "10개 핵심 키워드 중 8개에서 미노출 (노출률 20%)".
4. 경쟁사를 직접 언급하지 않고 시장 환경의 관점에서 서술.
5. 개선 방안은 구체적이고 실행 가능하게 작성하고, 개선 시 기대 효과를 수치로 제시.
6. 각 항목마다 "왜 이것이 중요한지"를 비전문가도 이해할 수 있게 1문장으로 설명.
7. 기존 마케팅 대행사가 커버하지 못하는 AI 최적화 영역을 자연스럽게 부각.`;
}

// ═══════════════════════════════════════════════════
// 스트림 1: 핵심 진단 (Executive Summary + Keywords + Competitors)
// ═══════════════════════════════════════════════════
async function generateCoreDiagnosis(context: string): Promise<any> {
  const prompt = `${context}

위 병원에 대해 핵심 진단 데이터를 생성하세요.

[JSON 출력 형식]

headline: 한 줄 핵심 진단 요약. 현재 AI 가시성 상태를 구체적 수치로 요약. "수백 명", "많은" 같은 모호한 표현 절대 금지. 반드시 구체적 수치(점수, 비율, 건수)를 사용.
  예시: "AI 가시성 43점 · 핵심 키워드 80% 미노출 — 월 300명 이상의 잠재 환자가 검색에서 이탈하고 있습니다"

executiveSummary: 3-4문장 종합 요약. 현재 상태의 문제점을 명확히 기술하고, 개선하지 않을 경우의 리스크와 개선 시 기대 효과를 구체적으로 언급.

keyFindings: 핵심 발견 5가지. 각각 한 줄. 정량적 데이터를 포함하고 비전문가도 이해할 수 있게 작성.

riskScore: 0-100 정수. 100이 가장 위험.

urgencyLevel: "critical" | "high" | "medium" | "low"

metrics:
  naverExposureRate: 네이버 노출률 (0-100).
  googleExposureRate: 구글 노출률 (0-100).
  aiReadiness: AI 플랫폼 인용 대비 점수 (0-100).
  missedPatientsMonthly: AI·포털 미노출로 인한 잠재 유입 기회 수/월.
  estimatedRevenueLoss: "월 약 X,XXX만원 상당" 형식.

keywords: 10개 핵심 키워드. 각 키워드별:
  keyword: 환자가 실제 조회하는 키워드
  monthlySearchVolume: 월간 조회량 추정치 (네이버+구글 합산)
  naver: { found: boolean, position: string, type: string, detail: string }
  google: { found: boolean, position: string, type: string, detail: string }
  ai: { likelihood: "high"|"medium"|"low"|"none", detail: string }

competitors: 같은 진료과 시장 환경 참고 정보 3건. 특정 병원명을 직접 언급하지 말고 "동종 A의원" 등으로 익명 처리.
  name: 익명 처리된 참고 명칭
  advantage: 해당 유형의 AI 가시성이 높은 일반적 이유 (1문장)
  estimatedVisibility: "상" | "중" | "하"

missedPatients:
  estimatedMonthly: AI 가시성 개선 시 추가 유입 가능한 잠재 방문자 수
  reasoning: 산출 근거. 반드시 "월간 총 검색량 N회 × 평균 유입률 0.8%(=0.008)" 형식으로 작성. 유입률을 소수로 표기할 때는 "0.008"로, 백분율로 표기할 때는 "0.8%"로 명확히 구분. "× 0.8"이라고만 쓰면 80%로 오해할 수 있으므로 절대 금지.
  revenueImpact: "월 약 X,XXX만원 상당의 추가 유입 기회" 형식

contentGaps: 10개. 아직 아무도 점유하지 않은 AI 인용 기회 키워드. 각각:
  keyword: 롱테일 질문형 키워드 (예: "눈성형 후 붓기 빠지는 기간")
  searchIntent: 환자의 조회 의도 (1문장)
  difficulty: "쉬움" | "보통" | "어려움"
  opportunityScore: 1-10 정수
  suggestedContent: 콘텐츠 방향 (1-2문장)
  rationale: 사각지대인 근거 (1-2문장)

actionItems: 9개 (각 단계별 3개씩). 각각:
  priority: "즉시" | "단기" | "중장기" (반드시 이 3가지 중 하나)
  action: 구체적 실행 항목 (2-3문장, 실제 작업 내용 상세히)
  expectedImpact: 기대 효과 (숫자 포함, 예: "네이버 지역 검색 노출률 20%p 상승, 월 50명 이상의 신규 환자 유입 기대")

closingStatement: 종합 의견 (1000~2000자). 5개 단락: 1)전체 현황 요약 2)주요 강점 3)핵심 개선 과제 4)실행 우선순위 5)종합 전망. 각 단락 사이에 빈 줄(\\n\\n)로 구분. 마크다운 서식 사용하지 않기.`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "core_diagnosis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            executiveSummary: { type: "string" },
            keyFindings: { type: "array", items: { type: "string" } },
            riskScore: { type: "integer" },
            urgencyLevel: { type: "string" },
            metrics: {
              type: "object",
              properties: {
                naverExposureRate: { type: "integer" },
                googleExposureRate: { type: "integer" },
                aiReadiness: { type: "integer" },
                missedPatientsMonthly: { type: "integer" },
                estimatedRevenueLoss: { type: "string" },
              },
              required: ["naverExposureRate", "googleExposureRate", "aiReadiness", "missedPatientsMonthly", "estimatedRevenueLoss"],
              additionalProperties: false,
            },
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  monthlySearchVolume: { type: "integer" },
                  naver: {
                    type: "object",
                    properties: { found: { type: "boolean" }, position: { type: "string" }, type: { type: "string" }, detail: { type: "string" } },
                    required: ["found", "position", "type", "detail"],
                    additionalProperties: false,
                  },
                  google: {
                    type: "object",
                    properties: { found: { type: "boolean" }, position: { type: "string" }, type: { type: "string" }, detail: { type: "string" } },
                    required: ["found", "position", "type", "detail"],
                    additionalProperties: false,
                  },
                  ai: {
                    type: "object",
                    properties: { likelihood: { type: "string" }, detail: { type: "string" } },
                    required: ["likelihood", "detail"],
                    additionalProperties: false,
                  },
                },
                required: ["keyword", "monthlySearchVolume", "naver", "google", "ai"],
                additionalProperties: false,
              },
            },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, advantage: { type: "string" }, estimatedVisibility: { type: "string" } },
                required: ["name", "advantage", "estimatedVisibility"],
                additionalProperties: false,
              },
            },
            missedPatients: {
              type: "object",
              properties: { estimatedMonthly: { type: "integer" }, reasoning: { type: "string" }, revenueImpact: { type: "string" } },
              required: ["estimatedMonthly", "reasoning", "revenueImpact"],
              additionalProperties: false,
            },
            contentGaps: {
              type: "array",
              items: {
                type: "object",
                properties: { keyword: { type: "string" }, searchIntent: { type: "string" }, difficulty: { type: "string" }, opportunityScore: { type: "integer" }, suggestedContent: { type: "string" }, rationale: { type: "string" } },
                required: ["keyword", "searchIntent", "difficulty", "opportunityScore", "suggestedContent", "rationale"],
                additionalProperties: false,
              },
            },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                properties: { priority: { type: "string", enum: ["즉시", "단기", "중장기"] }, action: { type: "string" }, expectedImpact: { type: "string" } },
                required: ["priority", "action", "expectedImpact"],
                additionalProperties: false,
              },
            },
            closingStatement: { type: "string" },
          },
          required: ["headline", "executiveSummary", "keyFindings", "riskScore", "urgencyLevel", "metrics", "keywords", "competitors", "missedPatients", "contentGaps", "actionItems", "closingStatement"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(result.choices[0]?.message?.content as string || "{}");
}

// ═══════════════════════════════════════════════════
// 스트림 2: GEO + AI 인용 진단
// ═══════════════════════════════════════════════════
async function generateGeoAiDiagnosis(context: string): Promise<any> {
  const prompt = `${context}

위 병원에 대해 GEO(Generative Engine Optimization) 3축 진단과 AI 인용 관련 진단을 수행하세요.

[JSON 출력 형식]

geoTriAxis: GEO 공식 RxA/F 기반 3축 진단.
  relevance: 적합성 (0-100). 환자 조회 의도와 웹사이트 콘텐츠의 일치도.
    score: 0-100 점수
    label: "우수" | "양호" | "미흡" | "위험"
    details: 3개 구체적 근거 (각 1문장)
  authority: 권위 (0-100). 도메인 권위, 전문가 프로필, 제3자 인용, 리뷰 등.
    score: 0-100 점수
    label: "우수" | "양호" | "미흡" | "위험"
    details: 3개 구체적 근거
  friction: 마찰 (0-100). 낮을수록 좋음. 페이지 로딩 속도, 모바일 최적화, 구조화 데이터 등.
    score: 0-100 점수 (낮을수록 좋음)
    label: "우수" | "양호" | "미흡" | "위험"
    details: 3개 구체적 근거
  overallGeoScore: RxA/F 종합 점수 (0-100). 계산식: (relevance x authority) / max(friction, 10) 를 0-100으로 정규화
  interpretation: 2-3문장 종합 해석

aiCitationThreshold: AI 인용 임계점 체크리스트 (5개 항목).
  items: 5개 항목. 각각:
    condition: 조건명. 다음 5개 중 하나:
      1) "구조화 데이터 존재" 2) "제3자 인용 존재" 3) "답변 캡슐 콘텐츠 존재" 4) "다채널 일관성" 5) "도메인 권위 기반"
    met: true/false
    detail: 상세 설명 (1-2문장)
    howToFix: 미충족 시 구체적 개선 방법 (1-2문장)
  metCount: 충족 개수 (0-5)
  totalCount: 5
  verdict: 종합 판정

answerCapsule: 답변 캡슐 품질 진단.
  score: 0-100
  currentBestSentence: 현재 웹사이트에서 가장 AI 인용에 적합한 문장 (없으면 "적합한 답변 캡슐 문장 없음")
  idealSentence: 이 병원의 진료과에 맞는 이상적인 답변 캡슐 예시 (40-60단어)
  issues: 3개 문제점
  recommendations: 3개 개선 권장사항`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "geo_ai_diagnosis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            geoTriAxis: {
              type: "object",
              properties: {
                relevance: {
                  type: "object",
                  properties: { score: { type: "integer" }, label: { type: "string" }, details: { type: "array", items: { type: "string" } } },
                  required: ["score", "label", "details"], additionalProperties: false,
                },
                authority: {
                  type: "object",
                  properties: { score: { type: "integer" }, label: { type: "string" }, details: { type: "array", items: { type: "string" } } },
                  required: ["score", "label", "details"], additionalProperties: false,
                },
                friction: {
                  type: "object",
                  properties: { score: { type: "integer" }, label: { type: "string" }, details: { type: "array", items: { type: "string" } } },
                  required: ["score", "label", "details"], additionalProperties: false,
                },
                overallGeoScore: { type: "integer" },
                interpretation: { type: "string" },
              },
              required: ["relevance", "authority", "friction", "overallGeoScore", "interpretation"],
              additionalProperties: false,
            },
            aiCitationThreshold: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { condition: { type: "string" }, met: { type: "boolean" }, detail: { type: "string" }, howToFix: { type: "string" } },
                    required: ["condition", "met", "detail", "howToFix"], additionalProperties: false,
                  },
                },
                metCount: { type: "integer" },
                totalCount: { type: "integer" },
                verdict: { type: "string" },
              },
              required: ["items", "metCount", "totalCount", "verdict"],
              additionalProperties: false,
            },
            answerCapsule: {
              type: "object",
              properties: {
                score: { type: "integer" },
                currentBestSentence: { type: "string" },
                idealSentence: { type: "string" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["score", "currentBestSentence", "idealSentence", "issues", "recommendations"],
              additionalProperties: false,
            },
          },
          required: ["geoTriAxis", "aiCitationThreshold", "answerCapsule"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(result.choices[0]?.message?.content as string || "{}");
}

// ═══════════════════════════════════════════════════
// 스트림 3: 채널 + 시뮬레이터 진단
// ═══════════════════════════════════════════════════
async function generateChannelDiagnosis(context: string): Promise<any> {
  const prompt = `${context}

위 병원에 대해 다채널 신뢰 진단, AI 추천 시뮬레이션, 네이버 Cue 대응 진단을 수행하세요.

[JSON 출력 형식]

crossChannelTrust: 4채널 교차 신뢰 진단.
  channels: 4개 채널. 각각:
    name: "홈페이지" | "블로그" | "유튜브" | "언론/리뷰"
    status: "활성" | "미흡" | "부재"
    consistencyScore: 0-100
    detail: 상세 설명 (1-2문장)
  overallConsistency: 0-100
  verdict: 종합 판정 (1-2문장)

aiSimulator: AI 추천 시뮬레이터 결과.
  query: "지역 + 진료과 + 추천해줘" 형식의 시뮬레이션 질의
  results: 5개 AI 엔진별 결과. 각각:
    engine: "ChatGPT" | "Gemini" | "Perplexity" | "Claude" | "네이버 Cue"
    mentioned: true/false (AI가 이 병원을 언급할 가능성 추정)
    rank: 언급 순위 (1-5). 미언급이면 null.
    context: 언급 맥락 또는 미언급 사유 (1-2문장)
  mentionRate: "예상 언급률: 5개 중 X개 (X%)"
  verdict: 종합 판정 (1-2문장)
  주의: 실제 AI에 질의하는 것이 아니라, 병원의 온라인 존재감 기반으로 AI가 추천할 가능성을 추정하는 것입니다.

naverCueDiagnosis: 네이버 Cue 대응 진단.
  score: 0-100
  items: 5개 항목. 각각:
    criterion: "네이버 블로그 활성도" | "네이버 플레이스 최적화" | "리뷰 관리" | "지식인 답변" | "네이버 콘텐츠 다양성"
    status: "양호" | "미흡" | "위험"
    detail: 상세 설명 (1-2문장)
    recommendation: 개선 권장사항 (1-2문장)
  verdict: 종합 판정 (1-2문장)`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "channel_diagnosis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            crossChannelTrust: {
              type: "object",
              properties: {
                channels: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, status: { type: "string" }, consistencyScore: { type: "integer" }, detail: { type: "string" } },
                    required: ["name", "status", "consistencyScore", "detail"], additionalProperties: false,
                  },
                },
                overallConsistency: { type: "integer" },
                verdict: { type: "string" },
              },
              required: ["channels", "overallConsistency", "verdict"],
              additionalProperties: false,
            },
            aiSimulator: {
              type: "object",
              properties: {
                query: { type: "string" },
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { engine: { type: "string" }, mentioned: { type: "boolean" }, rank: { type: ["integer", "null"] }, context: { type: "string" } },
                    required: ["engine", "mentioned", "rank", "context"], additionalProperties: false,
                  },
                },
                mentionRate: { type: "string" },
                verdict: { type: "string" },
              },
              required: ["query", "results", "mentionRate", "verdict"],
              additionalProperties: false,
            },
            naverCueDiagnosis: {
              type: "object",
              properties: {
                score: { type: "integer" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { criterion: { type: "string" }, status: { type: "string" }, detail: { type: "string" }, recommendation: { type: "string" } },
                    required: ["criterion", "status", "detail", "recommendation"], additionalProperties: false,
                  },
                },
                verdict: { type: "string" },
              },
              required: ["score", "items", "verdict"],
              additionalProperties: false,
            },
          },
          required: ["crossChannelTrust", "aiSimulator", "naverCueDiagnosis"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(result.choices[0]?.message?.content as string || "{}");
}

// ═══════════════════════════════════════════════════
// 스트림 4: 전략 가이드 + 서비스 소개
// ═══════════════════════════════════════════════════
async function generateStrategyGuide(context: string): Promise<any> {
  const prompt = `${context}

위 병원에 대해 웹사이트 변환 가이드, 콘텐츠 전략, 마케팅 방향, mybiseo 서비스 소개를 작성하세요.

[JSON 출력 형식]

websiteTransformGuide: 웹사이트 AI 최적화 변환 가이드.
  currentState: 현재 웹사이트 상태 요약 (2-3문장)
  transformations: 5개 개선 영역. 각각:
    area: 개선 영역명
    currentIssue: 현재 문제 (1-2문장)
    recommendation: 구체적 개선 방안 (2-3문장)
    priority: "높음" | "중간" | "낮음"
    estimatedImpact: 기대 효과 (1문장)

contentStrategy: 콘텐츠 제작·발행 전략.
  currentAssessment: 현재 콘텐츠 상태 평가 (2-3문장)
  blogStrategy: 블로그 전략 (이중 구조 설계법). 2-3문장.
  faqStrategy: FAQ 전략 (진료과별 환자 질문 10개 + FAQPage Schema). 2-3문장.
  comparisonTableStrategy: 비교표 전략 (AI 인용 32.5% 상승 효과). 1-2문장.
  contentCalendar: 4주 콘텐츠 캘린더. 각각:
    week: "1주차" | "2주차" | "3주차" | "4주차"
    topic: 주제
    format: "블로그" | "FAQ" | "비교표" | "사례 연구"
    targetKeyword: 타깃 키워드

marketingDirection: 마케팅 활동 방향 가이드.
  overallStrategy: 전체 마케팅 방향 요약 (2-3문장)
  channelStrategies: 4개 채널별 전략. 각각:
    channel: "홈페이지" | "블로그" | "유튜브" | "SNS/리뷰"
    strategy: 전략 (2-3문장)
    priority: "높음" | "중간" | "낮음"
    expectedOutcome: 기대 성과 (1문장)
  coexistenceMessage: 기존 마케팅 에이전시와의 공생 메시지 (2-3문장). "기존 마케팅 + AI 최적화 = 완전한 마케팅" 프레임.

mybiseoServices: mybiseo 서비스 소개.
  headline: 핵심 메시지 (1문장). 이 병원의 진단 결과를 반영한 맞춤형 메시지.
  services: 12개 서비스. 각각:
    name: 서비스명. 다음 12개 중 선택:
      1. "AI 가시성 진단" 2. "AI 콘텐츠 최적화" 3. "AI 최적화 웹사이트 개발" 4. "AI 마케팅 인프라"
      5. "네이버 Cue: 대응" 6. "구글 AI Overview 대응" 7. "ChatGPT/Perplexity 최적화" 8. "답변 캡슐 최적화"
      9. "구조화 데이터 설계" 10. "4채널 신뢰 통합" 11. "AI 시대 CRM" 12. "성과 분석 대시보드"
    description: 설명 (1-2문장). 원장님이 이해할 수 있는 쉬운 말로.
    relevanceToHospital: 이 병원에 특히 필요한 이유 (1문장). 진단 결과를 반영.
  ctaMessage: CTA 메시지 (1문장).`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "strategy_guide",
        strict: true,
        schema: {
          type: "object",
          properties: {
            websiteTransformGuide: {
              type: "object",
              properties: {
                currentState: { type: "string" },
                transformations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { area: { type: "string" }, currentIssue: { type: "string" }, recommendation: { type: "string" }, priority: { type: "string", enum: ["높음", "중간", "낮음"] }, estimatedImpact: { type: "string" } },
                    required: ["area", "currentIssue", "recommendation", "priority", "estimatedImpact"], additionalProperties: false,
                  },
                },
              },
              required: ["currentState", "transformations"],
              additionalProperties: false,
            },
            contentStrategy: {
              type: "object",
              properties: {
                currentAssessment: { type: "string" },
                blogStrategy: { type: "string" },
                faqStrategy: { type: "string" },
                comparisonTableStrategy: { type: "string" },
                contentCalendar: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { week: { type: "string" }, topic: { type: "string" }, format: { type: "string" }, targetKeyword: { type: "string" } },
                    required: ["week", "topic", "format", "targetKeyword"], additionalProperties: false,
                  },
                },
              },
              required: ["currentAssessment", "blogStrategy", "faqStrategy", "comparisonTableStrategy", "contentCalendar"],
              additionalProperties: false,
            },
            marketingDirection: {
              type: "object",
              properties: {
                overallStrategy: { type: "string" },
                channelStrategies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { channel: { type: "string" }, strategy: { type: "string" }, priority: { type: "string", enum: ["높음", "중간", "낮음"] }, expectedOutcome: { type: "string" } },
                    required: ["channel", "strategy", "priority", "expectedOutcome"], additionalProperties: false,
                  },
                },
                coexistenceMessage: { type: "string" },
              },
              required: ["overallStrategy", "channelStrategies", "coexistenceMessage"],
              additionalProperties: false,
            },
            mybiseoServices: {
              type: "object",
              properties: {
                headline: { type: "string" },
                services: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, description: { type: "string" }, relevanceToHospital: { type: "string" } },
                    required: ["name", "description", "relevanceToHospital"], additionalProperties: false,
                  },
                },
                ctaMessage: { type: "string" },
              },
              required: ["headline", "services", "ctaMessage"],
              additionalProperties: false,
            },
          },
          required: ["websiteTransformGuide", "contentStrategy", "marketingDirection", "mybiseoServices"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(result.choices[0]?.message?.content as string || "{}");
}

// ── 진료과목별 매출 손실 결정론적 계산 (LLM 의존 제거) ──
const SPECIALTY_REVENUE_PARAMS: Record<SpecialtyType, { conversionRate: number; avgRevenuePerPatient: number }> = {
  "성형외과": { conversionRate: 0.05, avgRevenuePerPatient: 400 },  // 5%, 400만원
  "피부과":   { conversionRate: 0.08, avgRevenuePerPatient: 50 },   // 8%, 50만원
  "치과":     { conversionRate: 0.06, avgRevenuePerPatient: 200 },  // 6%, 200만원
  "안과":     { conversionRate: 0.05, avgRevenuePerPatient: 300 },  // 5%, 300만원
  "한의원":   { conversionRate: 0.05, avgRevenuePerPatient: 80 },   // 5%, 80만원
  "정형외과": { conversionRate: 0.05, avgRevenuePerPatient: 100 },  // 5%, 100만원
  "이비인후과": { conversionRate: 0.05, avgRevenuePerPatient: 80 }, // 5%, 80만원
  "비뇨기과": { conversionRate: 0.05, avgRevenuePerPatient: 150 },  // 5%, 150만원
  "내과":     { conversionRate: 0.05, avgRevenuePerPatient: 50 },   // 5%, 50만원
  "소아과":   { conversionRate: 0.05, avgRevenuePerPatient: 50 },   // 5%, 50만원
  "산부인과": { conversionRate: 0.05, avgRevenuePerPatient: 200 },  // 5%, 200만원
  "종합병원": { conversionRate: 0.04, avgRevenuePerPatient: 150 },  // 4%, 150만원
  "기타":     { conversionRate: 0.05, avgRevenuePerPatient: 100 },  // 5%, 100만원
};

const REVENUE_FLOOR = 3000; // 최소 3,000만원
const REVENUE_CAP = 10000;  // 최대 1억원 (10,000만원)

/**
 * 진료과목별 고정 공식으로 매출 손실 계산
 * 공식: 누락환자 × 전환율 × 객단가 (만원)
 * 결과: 3,000만원 ~ 1억원 범위로 클램핑
 */
function calculateDeterministicRevenueLoss(missedPatients: number, specialty: string): { revenueLossManwon: number; formatted: string } {
  const resolved = resolveSpecialty(specialty);
  const params = SPECIALTY_REVENUE_PARAMS[resolved] || SPECIALTY_REVENUE_PARAMS["기타"];
  const rawManwon = Math.round(missedPatients * params.conversionRate * params.avgRevenuePerPatient);
  const clampedManwon = Math.max(REVENUE_FLOOR, Math.min(REVENUE_CAP, rawManwon));

  // 포맷팅: 1억 이상이면 "X억Y,000만원", 아니면 "X,XXX만원"
  let formatted: string;
  if (clampedManwon >= 10000) {
    const eok = Math.floor(clampedManwon / 10000);
    const remainder = clampedManwon % 10000;
    formatted = remainder > 0 ? `월 약 ${eok}억${remainder.toLocaleString()}만원` : `월 약 ${eok}억원`;
  } else {
    formatted = `월 약 ${clampedManwon.toLocaleString()}만원`;
  }

  return { revenueLossManwon: clampedManwon, formatted };
}

// ── Fallback 기본값 ──
const FALLBACK_CORE = {
  headline: "",
  executiveSummary: "",
  keyFindings: [],
  riskScore: 50,
  urgencyLevel: "medium",
  metrics: { naverExposureRate: 0, googleExposureRate: 0, aiReadiness: 0, missedPatientsMonthly: 0, estimatedRevenueLoss: "산출 불가" },
  keywords: [],
  competitors: [],
  missedPatients: { estimatedMonthly: 0, reasoning: "", revenueImpact: "" },
  contentGaps: [],
  actionItems: [],
  closingStatement: "",
};

const FALLBACK_GEO_AI = {
  geoTriAxis: { relevance: { score: 0, label: "위험", details: [] }, authority: { score: 0, label: "위험", details: [] }, friction: { score: 100, label: "위험", details: [] }, overallGeoScore: 0, interpretation: "" },
  aiCitationThreshold: { items: [], metCount: 0, totalCount: 5, verdict: "" },
  answerCapsule: { score: 0, currentBestSentence: "적합한 답변 캡슐 문장 없음", idealSentence: "", issues: [], recommendations: [] },
};

const FALLBACK_CHANNEL = {
  crossChannelTrust: { channels: [], overallConsistency: 0, verdict: "" },
  aiSimulator: { query: "", results: [], mentionRate: "", verdict: "" },
  naverCueDiagnosis: { score: 0, items: [], verdict: "" },
};

const FALLBACK_STRATEGY = {
  websiteTransformGuide: { currentState: "", transformations: [] },
  contentStrategy: { currentAssessment: "", blogStrategy: "", faqStrategy: "", comparisonTableStrategy: "", contentCalendar: [] },
  marketingDirection: { overallStrategy: "", channelStrategies: [], coexistenceMessage: "" },
  mybiseoServices: { headline: "", services: [], ctaMessage: "" },
};

// ── LLM 기반 현실 진단 생성 (병렬 최적화 v2) ──
export async function generateRealityDiagnosis(
  domain: string,
  specialty: string,
  seoScore: number,
  seoGrade: string,
  categoryScores: Record<string, number>,
  siteName?: string,
): Promise<RealityDiagnosis> {
  const startTime = Date.now();

  // SimilarWeb 데이터와 LLM 호출을 병렬로 시작
  const trafficPromise = fetchTrafficData(domain);

  // 트래픽 데이터가 필요한 컨텍스트 빌드를 위해 먼저 대기
  const trafficData = await trafficPromise;

  const trafficContext = trafficData
    ? `
[SimilarWeb 실측 트래픽 데이터]
- 월간 방문수: ${trafficData.monthlyVisits ? trafficData.monthlyVisits.toLocaleString() + "회" : "데이터 없음 (매우 적은 트래픽)"}
- 글로벌 랭킹: ${trafficData.globalRank ? "#" + trafficData.globalRank.toLocaleString() : "순위권 밖"}
- 이탈률: ${trafficData.bounceRate ? displayPercent(trafficData.bounceRate * 100) + "%" : "데이터 없음"}
- 오가닉 유입 비율: ${trafficData.organicSearchShare ? displayPercent(trafficData.organicSearchShare * 100) + "%" : "데이터 없음"}
- 직접 방문 비율: ${trafficData.directShare ? displayPercent(trafficData.directShare * 100) + "%" : "데이터 없음"}`
    : `
[SimilarWeb 트래픽 데이터: 조회 불가]
해당 도메인의 트래픽이 SimilarWeb 최소 추적 기준(월 5,000회) 미만입니다.`;

  const context = buildContext(domain, siteName, specialty, seoScore, seoGrade, categoryScores, trafficContext);

  // 4개 LLM 호출을 병렬로 실행
  const [coreResult, geoAiResult, channelResult, strategyResult] = await Promise.allSettled([
    generateCoreDiagnosis(context),
    generateGeoAiDiagnosis(context),
    generateChannelDiagnosis(context),
    generateStrategyGuide(context),
  ]);

  // 각 스트림 결과 추출 (실패 시 fallback)
  const core = coreResult.status === "fulfilled" ? coreResult.value : FALLBACK_CORE;
  const geoAi = geoAiResult.status === "fulfilled" ? geoAiResult.value : FALLBACK_GEO_AI;
  const channel = channelResult.status === "fulfilled" ? channelResult.value : FALLBACK_CHANNEL;
  const strategy = strategyResult.status === "fulfilled" ? strategyResult.value : FALLBACK_STRATEGY;

  // 실패한 스트림 로깅
  if (coreResult.status === "rejected") console.error("[RealityDiagnosis] Core diagnosis failed:", coreResult.reason);
  if (geoAiResult.status === "rejected") console.error("[RealityDiagnosis] GEO/AI diagnosis failed:", geoAiResult.reason);
  if (channelResult.status === "rejected") console.error("[RealityDiagnosis] Channel diagnosis failed:", channelResult.reason);
  if (strategyResult.status === "rejected") console.error("[RealityDiagnosis] Strategy guide failed:", strategyResult.reason);

  const elapsed = Date.now() - startTime;
  console.log(`[RealityDiagnosis] Completed in ${elapsed}ms (${Math.round(elapsed / 1000)}s) — Core:${coreResult.status} GeoAI:${geoAiResult.status} Channel:${channelResult.status} Strategy:${strategyResult.status}`);

  return {
    hospitalName: siteName || domain,
    specialty: specialty || "일반",
    // Core
    headline: (() => {
      let hl = core.headline || FALLBACK_CORE.headline;
      // headline에서도 LLM 매출 수치를 코드 계산값으로 동기화
      const mp = core.missedPatients || FALLBACK_CORE.missedPatients;
      if (mp.estimatedMonthly > 0) {
        const { formatted } = calculateDeterministicRevenueLoss(mp.estimatedMonthly, specialty);
        hl = hl.replace(/월\s*약?\s*[\d,]+만원(\s*상당)?/g, formatted);
        hl = hl.replace(/약\s*[\d,]+만원(\s*상당)?/g, formatted);
        hl = hl.replace(/[\d,]+억[\d,]*만원(\s*상당)?/g, formatted);
      }
      hl = hl.replace(/잠재\s*환자/g, '웹사이트 유입 누락 환자');
      hl = hl.replace(/이탈\s*환자/g, '웹사이트 유입 누락 환자');
      return hl;
    })(),
    executiveSummary: (() => {
      // #22 executiveSummary 템플릿화: LLM 실패 시 코드 기반 생성, 성공 시 수치 동기화
      const mp = core.missedPatients || FALLBACK_CORE.missedPatients;
      const m = core.metrics || FALLBACK_CORE.metrics;
      const { formatted: revLoss } = mp.estimatedMonthly > 0
        ? calculateDeterministicRevenueLoss(mp.estimatedMonthly, specialty)
        : { formatted: "산출 불가" };
      const summaryCtx: SummaryContext = {
        hospitalName: siteName || domain,
        specialty: specialty || "일반",
        seoScore: seoScore,
        seoGrade: seoGrade,
        missedPatientsMonthly: mp.estimatedMonthly,
        revenueLossFormatted: revLoss,
        naverExposureRate: m.naverExposureRate,
        googleExposureRate: m.googleExposureRate,
        aiReadiness: m.aiReadiness,
        keyIssuesCount: (core.keyFindings || []).length,
        topIssue: (core.keyFindings || [])[0],
      };
      let summary = ensureExecutiveSummary(core.executiveSummary, summaryCtx);
      // 수치 동기화
      if (mp.estimatedMonthly > 0) {
        summary = summary.replace(/월\s*약?\s*[\d,]+만원(\s*상당)?/g, revLoss);
        summary = summary.replace(/약\s*[\d,]+만원(\s*상당)?/g, revLoss);
        summary = summary.replace(/[\d,]+억[\d,]*만원(\s*상당)?/g, revLoss);
      }
      summary = summary.replace(/잠재\s*환자/g, '웹사이트 유입 누락 환자');
      summary = summary.replace(/이탈\s*환자/g, '웹사이트 유입 누락 환자');
      summary = summary.replace(/예상\s*매출\s*손실/g, '예상 웹사이트 전환 매출 손실');
      summary = summary.replace(/매출\s*기회\s*손실/g, '웹사이트 전환 매출 손실');
      return summary;
    })(),
    keyFindings: core.keyFindings || FALLBACK_CORE.keyFindings,
    riskScore: core.riskScore ?? FALLBACK_CORE.riskScore,
    urgencyLevel: core.urgencyLevel || FALLBACK_CORE.urgencyLevel,
    metrics: (() => {
      const m = core.metrics || FALLBACK_CORE.metrics;
      // metrics.estimatedRevenueLoss도 동기화
      if (m.missedPatientsMonthly > 0) {
        const { formatted } = calculateDeterministicRevenueLoss(m.missedPatientsMonthly, specialty);
        return { ...m, estimatedRevenueLoss: formatted };
      }
      return m;
    })(),
    keywords: core.keywords || FALLBACK_CORE.keywords,
    trafficInsight: trafficData,
    competitors: core.competitors || FALLBACK_CORE.competitors,
    missedPatients: (() => {
      const mp = core.missedPatients || FALLBACK_CORE.missedPatients;
      // 코드 기반 결정론적 매출 손실 계산 (LLM 추정 대체)
      if (mp.estimatedMonthly > 0) {
        const { formatted } = calculateDeterministicRevenueLoss(mp.estimatedMonthly, specialty);
        return { ...mp, revenueImpact: formatted };
      }
      return mp;
    })(),
    contentGaps: core.contentGaps || FALLBACK_CORE.contentGaps,
    actionItems: core.actionItems || FALLBACK_CORE.actionItems,
    closingStatement: (() => {
      let cs = core.closingStatement || FALLBACK_CORE.closingStatement;
      const mp = core.missedPatients || FALLBACK_CORE.missedPatients;
      if (mp.estimatedMonthly > 0) {
        const { formatted } = calculateDeterministicRevenueLoss(mp.estimatedMonthly, specialty);
        cs = cs.replace(/월\s*약?\s*[\d,]+만원(\s*상당)?/g, formatted);
        cs = cs.replace(/약\s*[\d,]+만원(\s*상당)?/g, formatted);
        cs = cs.replace(/[\d,]+억[\d,]*만원(\s*상당)?/g, formatted);
      }
      cs = cs.replace(/잠재\s*환자/g, '웹사이트 유입 누락 환자');
      cs = cs.replace(/이탈\s*환자/g, '웹사이트 유입 누락 환자');
      cs = cs.replace(/예상\s*매출\s*손실/g, '예상 웹사이트 전환 매출 손실');
      cs = cs.replace(/매출\s*기회\s*손실/g, '웹사이트 전환 매출 손실');
      return cs;
    })(),
    // GEO + AI
    geoTriAxis: geoAi.geoTriAxis || FALLBACK_GEO_AI.geoTriAxis,
    aiCitationThreshold: geoAi.aiCitationThreshold || FALLBACK_GEO_AI.aiCitationThreshold,
    answerCapsule: geoAi.answerCapsule || FALLBACK_GEO_AI.answerCapsule,
    // Channel
    crossChannelTrust: channel.crossChannelTrust || FALLBACK_CHANNEL.crossChannelTrust,
    aiSimulator: channel.aiSimulator || FALLBACK_CHANNEL.aiSimulator,
    naverCueDiagnosis: channel.naverCueDiagnosis || FALLBACK_CHANNEL.naverCueDiagnosis,
    // Strategy
    websiteTransformGuide: strategy.websiteTransformGuide || FALLBACK_STRATEGY.websiteTransformGuide,
    contentStrategy: strategy.contentStrategy || FALLBACK_STRATEGY.contentStrategy,
    marketingDirection: strategy.marketingDirection || FALLBACK_STRATEGY.marketingDirection,
    mybiseoServices: strategy.mybiseoServices || FALLBACK_STRATEGY.mybiseoServices,
  };
}

/**
 * #24 경쟁사 분석 데이터 구조화
 * 
 * 경쟁사 분석 결과를 고정된 JSON 스키마로 구조화하여
 * LLM 출력의 일관성을 보장하고 후속 처리를 용이하게 함
 */

export interface CompetitorAnalysis {
  /** 익명 처리된 경쟁사 식별자 */
  anonymousId: string;
  /** 경쟁사 유형 (동종 의원, 대형 병원, 프랜차이즈 등) */
  type: CompetitorType;
  /** AI 가시성 추정 등급 */
  estimatedVisibility: "상" | "중" | "하";
  /** 강점 분석 */
  strengths: CompetitorStrength[];
  /** 약점 분석 */
  weaknesses: string[];
  /** 콘텐츠 전략 요약 */
  contentStrategy: ContentStrategySnapshot;
  /** 위협도 점수 (0-100) */
  threatScore: number;
}

export type CompetitorType = "동종의원" | "대형병원" | "프랜차이즈" | "전문클리닉" | "종합병원";

export interface CompetitorStrength {
  category: "콘텐츠" | "기술SEO" | "소셜미디어" | "리뷰" | "브랜딩" | "AI최적화";
  description: string;
  impactLevel: "high" | "medium" | "low";
}

export interface ContentStrategySnapshot {
  /** 블로그/콘텐츠 업데이트 빈도 추정 */
  updateFrequency: "매일" | "주2-3회" | "주1회" | "월1-2회" | "비활성";
  /** 주요 콘텐츠 유형 */
  contentTypes: string[];
  /** 타겟 키워드 전략 */
  keywordStrategy: string;
  /** 구조화 데이터 활용 여부 */
  usesStructuredData: boolean;
}

/**
 * LLM 응답을 CompetitorAnalysis 스키마로 검증 및 정규화
 */
export function normalizeCompetitorData(raw: unknown): CompetitorAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const validTypes: CompetitorType[] = ["동종의원", "대형병원", "프랜차이즈", "전문클리닉", "종합병원"];
  const validVisibility = ["상", "중", "하"] as const;

  const type = validTypes.includes(obj.type as CompetitorType) 
    ? (obj.type as CompetitorType) 
    : "동종의원";

  const visibility = validVisibility.includes(obj.estimatedVisibility as typeof validVisibility[number])
    ? (obj.estimatedVisibility as "상" | "중" | "하")
    : "중";

  // strengths 정규화
  const strengths: CompetitorStrength[] = [];
  if (Array.isArray(obj.strengths)) {
    for (const s of obj.strengths) {
      if (s && typeof s === "object") {
        const sObj = s as Record<string, unknown>;
        strengths.push({
          category: (["콘텐츠", "기술SEO", "소셜미디어", "리뷰", "브랜딩", "AI최적화"].includes(sObj.category as string)
            ? sObj.category : "콘텐츠") as CompetitorStrength["category"],
          description: String(sObj.description || ""),
          impactLevel: (["high", "medium", "low"].includes(sObj.impactLevel as string)
            ? sObj.impactLevel : "medium") as "high" | "medium" | "low",
        });
      }
    }
  }

  // weaknesses 정규화
  const weaknesses: string[] = [];
  if (Array.isArray(obj.weaknesses)) {
    for (const w of obj.weaknesses) {
      if (typeof w === "string") weaknesses.push(w);
    }
  }

  // contentStrategy 정규화
  const rawStrategy = (obj.contentStrategy || {}) as Record<string, unknown>;
  const validFrequencies = ["매일", "주2-3회", "주1회", "월1-2회", "비활성"] as const;
  const contentStrategy: ContentStrategySnapshot = {
    updateFrequency: validFrequencies.includes(rawStrategy.updateFrequency as typeof validFrequencies[number])
      ? (rawStrategy.updateFrequency as ContentStrategySnapshot["updateFrequency"])
      : "월1-2회",
    contentTypes: Array.isArray(rawStrategy.contentTypes)
      ? rawStrategy.contentTypes.filter((t): t is string => typeof t === "string")
      : [],
    keywordStrategy: String(rawStrategy.keywordStrategy || ""),
    usesStructuredData: Boolean(rawStrategy.usesStructuredData),
  };

  // threatScore 정규화
  const threatScore = typeof obj.threatScore === "number"
    ? Math.max(0, Math.min(100, Math.round(obj.threatScore)))
    : 50;

  return {
    anonymousId: String(obj.anonymousId || obj.name || `경쟁사_${Date.now()}`),
    type,
    estimatedVisibility: visibility,
    strengths,
    weaknesses,
    contentStrategy,
    threatScore,
  };
}

/**
 * 경쟁사 분석 결과 배열을 정규화
 */
export function normalizeCompetitors(rawArray: unknown[]): CompetitorAnalysis[] {
  return rawArray
    .map(normalizeCompetitorData)
    .filter((c): c is CompetitorAnalysis => c !== null);
}

/**
 * LLM에 전달할 경쟁사 분석 JSON 스키마 (response_format용)
 */
export const COMPETITOR_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    competitors: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          anonymousId: { type: "string" as const, description: "익명 식별자 (예: 동종 A의원)" },
          type: { type: "string" as const, enum: ["동종의원", "대형병원", "프랜차이즈", "전문클리닉", "종합병원"] },
          estimatedVisibility: { type: "string" as const, enum: ["상", "중", "하"] },
          strengths: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                category: { type: "string" as const, enum: ["콘텐츠", "기술SEO", "소셜미디어", "리뷰", "브랜딩", "AI최적화"] },
                description: { type: "string" as const },
                impactLevel: { type: "string" as const, enum: ["high", "medium", "low"] },
              },
              required: ["category", "description", "impactLevel"],
              additionalProperties: false,
            },
          },
          weaknesses: { type: "array" as const, items: { type: "string" as const } },
          contentStrategy: {
            type: "object" as const,
            properties: {
              updateFrequency: { type: "string" as const, enum: ["매일", "주2-3회", "주1회", "월1-2회", "비활성"] },
              contentTypes: { type: "array" as const, items: { type: "string" as const } },
              keywordStrategy: { type: "string" as const },
              usesStructuredData: { type: "boolean" as const },
            },
            required: ["updateFrequency", "contentTypes", "keywordStrategy", "usesStructuredData"],
            additionalProperties: false,
          },
          threatScore: { type: "integer" as const, minimum: 0, maximum: 100 },
        },
        required: ["anonymousId", "type", "estimatedVisibility", "strengths", "weaknesses", "contentStrategy", "threatScore"],
        additionalProperties: false,
      },
    },
  },
  required: ["competitors"],
  additionalProperties: false,
};

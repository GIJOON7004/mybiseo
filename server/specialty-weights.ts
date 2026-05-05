/**
 * 진료과별 가중치 매트릭스
 * 각 카테고리에 진료과별 가중치(0.5 ~ 2.0)를 적용
 * 기본값 1.0
 */

export type SpecialtyType =
  | "성형외과"
  | "치과"
  | "피부과"
  | "한의원"
  | "정형외과"
  | "안과"
  | "산부인과"
  | "종합병원"
  | "이비인후과"
  | "비뇨기과"
  | "내과"
  | "소아과"
  | "기타";

export const SPECIALTY_ALIASES: Record<string, SpecialtyType> = {
  "성형외과": "성형외과",
  "성형": "성형외과",
  "미용외과": "성형외과",
  "치과": "치과",
  "치과의원": "치과",
  "치과병원": "치과",
  "피부과": "피부과",
  "피부": "피부과",
  "피부클리닉": "피부과",
  "한의원": "한의원",
  "한의": "한의원",
  "한방": "한의원",
  "한방병원": "한의원",
  "정형외과": "정형외과",
  "정형": "정형외과",
  "안과": "안과",
  "산부인과": "산부인과",
  "산부": "산부인과",
  "여성의원": "산부인과",
  "종합병원": "종합병원",
  "대학병원": "종합병원",
  "병원": "종합병원",
  "이비인후과": "이비인후과",
  "비뇨기과": "비뇨기과",
  "내과": "내과",
  "소아과": "소아과",
  "소아청소년과": "소아과",
  "dental": "치과",
  "dermatology": "피부과",
  "plastic surgery": "성형외과",
  "orthopedic": "정형외과",
  "ophthalmology": "안과",
  "obstetrics": "산부인과",
  "general hospital": "종합병원",
  "ent": "이비인후과",
  "urology": "비뇨기과",
  "internal medicine": "내과",
  "pediatrics": "소아과",
  "oriental medicine": "한의원",
};

export function resolveSpecialty(input?: string): SpecialtyType {
  if (!input) return "기타";
  const trimmed = input.trim();
  return SPECIALTY_ALIASES[trimmed] || "기타";
}

// 카테고리별 가중치 매트릭스
// 키: 카테고리명, 값: { 진료과: 가중치 }
export const WEIGHT_MATRIX: Record<string, Record<SpecialtyType, number>> = {
  "메타 태그": {
    "성형외과": 1.0, "치과": 1.0, "피부과": 1.0, "한의원": 1.0,
    "정형외과": 1.0, "안과": 1.0, "산부인과": 1.0, "종합병원": 1.0,
    "이비인후과": 1.0, "비뇨기과": 1.0, "내과": 1.0, "소아과": 1.0, "기타": 1.0,
  },
  "콘텐츠 구조": {
    "성형외과": 1.2, "치과": 1.0, "피부과": 1.2, "한의원": 1.3,
    "정형외과": 1.0, "안과": 1.0, "산부인과": 1.0, "종합병원": 1.2,
    "이비인후과": 1.0, "비뇨기과": 1.0, "내과": 1.1, "소아과": 1.0, "기타": 1.0,
  },
  "홈페이지 기본 설정": {
    "성형외과": 1.0, "치과": 1.0, "피부과": 1.0, "한의원": 1.0,
    "정형외과": 1.0, "안과": 1.0, "산부인과": 1.0, "종합병원": 1.0,
    "이비인후과": 1.0, "비뇨기과": 1.0, "내과": 1.0, "소아과": 1.0, "기타": 1.0,
  },
  "소셜 미디어": {
    "성형외과": 1.3, "치과": 1.1, "피부과": 1.3, "한의원": 1.0,
    "정형외과": 0.8, "안과": 0.8, "산부인과": 1.0, "종합병원": 0.8,
    "이비인후과": 0.8, "비뇨기과": 0.8, "내과": 0.8, "소아과": 1.0, "기타": 1.0,
  },
  "검색 고급 설정": {
    "성형외과": 1.0, "치과": 1.0, "피부과": 1.0, "한의원": 1.0,
    "정형외과": 1.0, "안과": 1.0, "산부인과": 1.0, "종합병원": 1.2,
    "이비인후과": 1.0, "비뇨기과": 1.0, "내과": 1.0, "소아과": 1.0, "기타": 1.0,
  },
  "네이버 검색 최적화": {
    "성형외과": 1.4, "치과": 1.5, "피부과": 1.4, "한의원": 1.5,
    "정형외과": 1.5, "안과": 1.4, "산부인과": 1.4, "종합병원": 1.3,
    "이비인후과": 1.4, "비뇨기과": 1.4, "내과": 1.5, "소아과": 1.5, "기타": 1.0,
  },
  "병원 특화 SEO": {
    "성형외과": 1.6, "치과": 1.4, "피부과": 1.4, "한의원": 1.3,
    "정형외과": 1.3, "안과": 1.3, "산부인과": 1.4, "종합병원": 1.5,
    "이비인후과": 1.3, "비뇨기과": 1.3, "내과": 1.3, "소아과": 1.3, "기타": 1.0,
  },
  "AI 검색 노출": {
    "성형외과": 1.4, "치과": 1.3, "피부과": 1.4, "한의원": 1.2,
    "정형외과": 1.2, "안과": 1.3, "산부인과": 1.2, "종합병원": 1.3,
    "이비인후과": 1.2, "비뇨기과": 1.2, "내과": 1.2, "소아과": 1.2, "기타": 1.2,
  },
  "성능 최적화": {
    "성형외과": 1.2, "치과": 1.0, "피부과": 1.2, "한의원": 0.8,
    "정형외과": 1.0, "안과": 1.0, "산부인과": 1.0, "종합병원": 1.2,
    "이비인후과": 1.0, "비뇨기과": 1.0, "내과": 1.0, "소아과": 1.0, "기타": 1.0,
  },
  "모바일 최적화": {
    "성형외과": 1.5, "치과": 1.5, "피부과": 1.5, "한의원": 1.2,
    "정형외과": 1.3, "안과": 1.2, "산부인과": 1.3, "종합병원": 1.3,
    "이비인후과": 1.2, "비뇨기과": 1.2, "내과": 1.2, "소아과": 1.3, "기타": 1.0,
  },
  "접근성/UX": {
    "성형외과": 1.0, "치과": 1.0, "피부과": 1.0, "한의원": 1.0,
    "정형외과": 1.0, "안과": 1.0, "산부인과": 1.0, "종합병원": 1.2,
    "이비인후과": 1.0, "비뇨기과": 1.0, "내과": 1.0, "소아과": 1.0, "기타": 1.0,
  },
  "국제화/다국어": {
    "성형외과": 1.3, "치과": 0.8, "피부과": 1.0, "한의원": 0.5,
    "정형외과": 0.5, "안과": 0.8, "산부인과": 0.6, "종합병원": 1.0,
    "이비인후과": 0.5, "비뇨기과": 0.5, "내과": 0.5, "소아과": 0.5, "기타": 1.0,
  },
};

export function getCategoryWeight(categoryName: string, specialty: SpecialtyType): number {
  const catWeights = WEIGHT_MATRIX[categoryName];
  if (!catWeights) return 1.0;
  return catWeights[specialty] ?? 1.0;
}

/**
 * 진료과별 가중치를 적용하여 카테고리 점수를 재계산
 */
export function applySpecialtyWeights(
  categories: { name: string; score: number; maxScore: number; items: any[] }[],
  specialty: SpecialtyType
): { weightedCategories: typeof categories; totalScore: number; maxScore: number } {
  const weightedCategories = categories.map(cat => {
    const weight = getCategoryWeight(cat.name, specialty);
    const weightedMax = Math.round(cat.maxScore * weight);
    const weightedScore = Math.min(Math.round(cat.score * weight), weightedMax);
    return {
      ...cat,
      score: weightedScore,
      maxScore: weightedMax,
      weight,
    };
  });
  // (#13) 선택적 항목 가중치 정규화: 가중치 적용 후 비율 기반으로 정규화
  const rawTotalScore = weightedCategories.reduce((s, c) => s + c.score, 0);
  const rawMaxScore = weightedCategories.reduce((s, c) => s + c.maxScore, 0);
  const originalMaxScore = categories.reduce((s, c) => s + c.maxScore, 0);
  const normalizationFactor = originalMaxScore > 0 && rawMaxScore > 0 ? originalMaxScore / rawMaxScore : 1;
  const totalScore = Math.round(rawTotalScore * normalizationFactor);
  const maxScore = originalMaxScore;
  return { weightedCategories, totalScore, maxScore };
}

/**
 * #17 점수 구간 경계값의 명확한 정의 및 문서화
 * 
 * 모든 검사 항목의 pass/warning/fail 판정 기준을 중앙 관리
 * - 각 항목별 경계값을 명시적으로 정의
 * - 등급 판정 로직을 일원화하여 일관성 보장
 * - 점수 구간 변경 시 한 곳만 수정하면 됨
 */

/**
 * 점수 등급 정의
 */
export type ScoreGrade = "excellent" | "good" | "average" | "poor" | "critical";

export interface ScoreBoundary {
  /** 항목 ID */
  itemId: string;
  /** 항목명 */
  name: string;
  /** pass 기준 (이 값 이상이면 pass) */
  passThreshold: number;
  /** warning 기준 (이 값 이상이면 warning, 미만이면 fail) */
  warningThreshold: number;
  /** 측정 단위 */
  unit: string;
  /** 기준 설명 */
  description: string;
}

/**
 * 전체 점수 등급 경계값
 * 총점 기준 (0-100%)
 */
export const OVERALL_SCORE_BOUNDARIES = {
  excellent: { min: 90, label: "우수", color: "#10b981", description: "AI 검색 노출에 최적화된 상태" },
  good: { min: 70, label: "양호", color: "#3b82f6", description: "기본적인 최적화가 되어 있으나 개선 여지 있음" },
  average: { min: 50, label: "보통", color: "#f59e0b", description: "주요 항목에서 개선이 필요함" },
  poor: { min: 30, label: "미흡", color: "#ef4444", description: "다수 항목에서 문제가 발견됨" },
  critical: { min: 0, label: "위험", color: "#dc2626", description: "즉시 개선이 필요한 심각한 상태" },
} as const;

/**
 * 카테고리별 점수 등급 경계값
 */
export const CATEGORY_SCORE_BOUNDARIES = {
  excellent: 85,
  good: 65,
  average: 45,
  poor: 25,
  critical: 0,
} as const;

/**
 * 개별 검사 항목 경계값 정의
 * seo-analyzer.ts에서 사용하는 모든 pass/warning/fail 기준을 중앙 관리
 */
export const ITEM_SCORE_BOUNDARIES: ScoreBoundary[] = [
  // 메타 태그
  { itemId: "meta-title", name: "타이틀 태그", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "타이틀 태그 존재 및 30-60자 범위" },
  { itemId: "meta-description", name: "메타 디스크립션", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "메타 디스크립션 존재 및 80-160자 범위" },
  { itemId: "meta-keywords", name: "메타 키워드", passThreshold: 3, warningThreshold: 1, unit: "개수", description: "메타 키워드 3개 이상" },
  { itemId: "meta-canonical", name: "Canonical URL", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "canonical 태그 존재" },
  
  // 콘텐츠 구조
  { itemId: "content-h1", name: "H1 태그", passThreshold: 1, warningThreshold: 0, unit: "개수", description: "H1 태그 정확히 1개" },
  { itemId: "content-heading-hierarchy", name: "제목 계층 구조", passThreshold: 1, warningThreshold: 0, unit: "적합여부", description: "H1→H2→H3 계층적 구조" },
  { itemId: "content-img-alt", name: "이미지 Alt 태그", passThreshold: 100, warningThreshold: 70, unit: "%", description: "이미지 alt 태그 비율 100%" },
  { itemId: "content-text-length", name: "콘텐츠 텍스트 양", passThreshold: 2000, warningThreshold: 800, unit: "자", description: "본문 텍스트 2000자 이상" },
  
  // 홈페이지 기본 설정
  { itemId: "basic-favicon", name: "파비콘", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "파비콘 설정" },
  { itemId: "basic-viewport", name: "뷰포트 메타", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "모바일 뷰포트 설정" },
  { itemId: "basic-lang", name: "언어 속성", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "html lang 속성" },
  
  // 소셜 미디어
  { itemId: "social-og", name: "Open Graph 태그", passThreshold: 4, warningThreshold: 2, unit: "개수", description: "OG 태그 4개 이상 (title, description, image, url)" },
  { itemId: "social-twitter", name: "Twitter Card", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "Twitter Card 메타 태그" },
  
  // 검색 고급 설정
  { itemId: "advanced-sitemap", name: "Sitemap.xml", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "sitemap.xml 존재 및 유효" },
  { itemId: "advanced-robots", name: "Robots.txt", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "robots.txt 존재 및 적절한 설정" },
  { itemId: "advanced-schema", name: "구조화 데이터", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "Schema.org 구조화 데이터" },
  { itemId: "advanced-ssl", name: "SSL 인증서", passThreshold: 1, warningThreshold: 0, unit: "존재여부", description: "HTTPS 적용" },
  
  // 사이트 성능
  { itemId: "perf-lcp", name: "LCP", passThreshold: 2500, warningThreshold: 4000, unit: "ms", description: "Largest Contentful Paint 2.5초 이내 (낮을수록 좋음)" },
  { itemId: "perf-fid", name: "FID/INP", passThreshold: 100, warningThreshold: 300, unit: "ms", description: "First Input Delay 100ms 이내 (낮을수록 좋음)" },
  { itemId: "perf-cls", name: "CLS", passThreshold: 0.1, warningThreshold: 0.25, unit: "점수", description: "Cumulative Layout Shift 0.1 이내 (낮을수록 좋음)" },
  { itemId: "perf-ttfb", name: "TTFB", passThreshold: 800, warningThreshold: 1800, unit: "ms", description: "Time to First Byte 800ms 이내 (낮을수록 좋음)" },
  
  // AI 검색 노출
  { itemId: "ai-structured-data", name: "AI 친화 구조화 데이터", passThreshold: 3, warningThreshold: 1, unit: "개수", description: "FAQ, HowTo, Article 등 AI 인용 가능 스키마" },
  { itemId: "ai-content-quality", name: "AI 인용 가능 콘텐츠", passThreshold: 80, warningThreshold: 50, unit: "점수", description: "전문성, 구체성, 인용 가능성 종합 점수" },
];

/**
 * 총점 기준 등급 판정
 */
export function getOverallGrade(scorePercent: number): {
  grade: ScoreGrade;
  label: string;
  color: string;
  description: string;
} {
  if (scorePercent >= OVERALL_SCORE_BOUNDARIES.excellent.min) {
    return { grade: "excellent", ...OVERALL_SCORE_BOUNDARIES.excellent };
  } else if (scorePercent >= OVERALL_SCORE_BOUNDARIES.good.min) {
    return { grade: "good", ...OVERALL_SCORE_BOUNDARIES.good };
  } else if (scorePercent >= OVERALL_SCORE_BOUNDARIES.average.min) {
    return { grade: "average", ...OVERALL_SCORE_BOUNDARIES.average };
  } else if (scorePercent >= OVERALL_SCORE_BOUNDARIES.poor.min) {
    return { grade: "poor", ...OVERALL_SCORE_BOUNDARIES.poor };
  } else {
    return { grade: "critical", ...OVERALL_SCORE_BOUNDARIES.critical };
  }
}

/**
 * 카테고리 점수 기준 등급 판정
 */
export function getCategoryGrade(scorePercent: number): ScoreGrade {
  if (scorePercent >= CATEGORY_SCORE_BOUNDARIES.excellent) return "excellent";
  if (scorePercent >= CATEGORY_SCORE_BOUNDARIES.good) return "good";
  if (scorePercent >= CATEGORY_SCORE_BOUNDARIES.average) return "average";
  if (scorePercent >= CATEGORY_SCORE_BOUNDARIES.poor) return "poor";
  return "critical";
}

/**
 * 특정 항목의 경계값 조회
 */
export function getItemBoundary(itemId: string): ScoreBoundary | undefined {
  return ITEM_SCORE_BOUNDARIES.find(b => b.itemId === itemId);
}

/**
 * #21 점수 변동 허용 범위(tolerance) 설정
 * 동일 사이트 재검사 시 허용 가능한 점수 변동 범위
 */
export const SCORE_TOLERANCE = {
  /** 총점 변동 허용 범위 (±%) */
  overallTolerance: 3,
  /** 카테고리별 변동 허용 범위 (±%) */
  categoryTolerance: 5,
  /** 개별 항목 변동 허용 범위 (±점) */
  itemTolerance: 1,
  /** 변동이 tolerance를 초과하면 경고 */
  alertOnExceed: true,
} as const;

/**
 * 두 점수 간 변동이 tolerance 범위 내인지 확인
 */
export function isWithinTolerance(
  previousScore: number,
  currentScore: number,
  tolerancePercent: number = SCORE_TOLERANCE.overallTolerance
): { withinTolerance: boolean; deviation: number; direction: "up" | "down" | "stable" } {
  const deviation = Math.abs(currentScore - previousScore);
  const direction = currentScore > previousScore ? "up" : currentScore < previousScore ? "down" : "stable";
  return {
    withinTolerance: deviation <= tolerancePercent,
    deviation,
    direction,
  };
}

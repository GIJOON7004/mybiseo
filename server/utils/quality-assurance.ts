/**
 * #45 골든 테스트 세트(Golden Test Set) 구축
 * #46 동일 사이트 재검사 편차 모니터링
 * #47 진단 결과 이력 저장 및 변동 원인 추적
 * 
 * 진단 품질을 보증하기 위한 골든 테스트 세트, 편차 모니터링, 이력 추적 시스템
 */

import { SCORE_TOLERANCE, isWithinTolerance } from "./score-boundaries";

// ============================================================
// #45 골든 테스트 세트
// ============================================================

export interface GoldenTestCase {
  /** 테스트 케이스 ID */
  id: string;
  /** 테스트 대상 URL */
  url: string;
  /** 병원명 */
  hospitalName: string;
  /** 진료과 */
  specialty: string;
  /** 기대 점수 범위 (최소) */
  expectedScoreMin: number;
  /** 기대 점수 범위 (최대) */
  expectedScoreMax: number;
  /** 기대 카테고리별 점수 */
  expectedCategoryScores: Record<string, { min: number; max: number }>;
  /** 반드시 pass여야 하는 항목 */
  mustPassItems: string[];
  /** 반드시 fail이어야 하는 항목 */
  mustFailItems: string[];
  /** 마지막 검증 시각 */
  lastVerifiedAt?: number;
  /** 마지막 검증 결과 */
  lastVerificationResult?: "pass" | "fail";
  /** 설명 */
  description: string;
}

/**
 * 골든 테스트 세트 — 진단 정확도 검증용 기준 데이터
 * 실제 병원 사이트를 수동 검증하여 기대 결과를 정의
 */
export const GOLDEN_TEST_SET: GoldenTestCase[] = [
  {
    id: "GT-001",
    url: "https://www.example-dental.co.kr",
    hospitalName: "예시치과의원",
    specialty: "치과",
    expectedScoreMin: 55,
    expectedScoreMax: 75,
    expectedCategoryScores: {
      "메타 태그": { min: 60, max: 90 },
      "콘텐츠 구조": { min: 50, max: 80 },
      "검색 고급 설정": { min: 40, max: 70 },
    },
    mustPassItems: ["meta-title", "meta-description", "basic-viewport"],
    mustFailItems: [],
    description: "일반적인 치과 사이트 — 기본 SEO는 되어 있으나 고급 설정 미흡",
  },
  {
    id: "GT-002",
    url: "https://www.example-plastic.com",
    hospitalName: "예시성형외과",
    specialty: "성형외과",
    expectedScoreMin: 70,
    expectedScoreMax: 90,
    expectedCategoryScores: {
      "메타 태그": { min: 75, max: 95 },
      "콘텐츠 구조": { min: 65, max: 90 },
      "소셜 미디어": { min: 70, max: 95 },
    },
    mustPassItems: ["meta-title", "meta-description", "social-og", "advanced-ssl"],
    mustFailItems: [],
    description: "잘 최적화된 성형외과 사이트 — 소셜 미디어 연동 우수",
  },
  {
    id: "GT-003",
    url: "https://www.example-poor-seo.kr",
    hospitalName: "예시의원",
    specialty: "기타",
    expectedScoreMin: 20,
    expectedScoreMax: 40,
    expectedCategoryScores: {
      "메타 태그": { min: 10, max: 35 },
      "콘텐츠 구조": { min: 15, max: 40 },
      "검색 고급 설정": { min: 5, max: 25 },
    },
    mustPassItems: [],
    mustFailItems: ["advanced-sitemap", "advanced-schema", "social-og"],
    description: "SEO 미적용 사이트 — 대부분 항목 미달",
  },
];

/**
 * 골든 테스트 케이스 검증
 * 진단 결과가 기대 범위 내인지 확인
 */
export function verifyGoldenTest(
  testCase: GoldenTestCase,
  actualScore: number,
  actualCategoryScores: Record<string, number>,
  passedItems: string[],
  failedItems: string[]
): GoldenTestVerification {
  const issues: string[] = [];
  let passed = true;

  // 1. 총점 범위 확인
  if (actualScore < testCase.expectedScoreMin || actualScore > testCase.expectedScoreMax) {
    issues.push(
      `총점 ${actualScore}이 기대 범위 [${testCase.expectedScoreMin}, ${testCase.expectedScoreMax}]를 벗어남`
    );
    passed = false;
  }

  // 2. 카테고리별 점수 확인
  for (const [category, expected] of Object.entries(testCase.expectedCategoryScores)) {
    const actual = actualCategoryScores[category];
    if (actual !== undefined && (actual < expected.min || actual > expected.max)) {
      issues.push(
        `카테고리 "${category}" 점수 ${actual}이 기대 범위 [${expected.min}, ${expected.max}]를 벗어남`
      );
      passed = false;
    }
  }

  // 3. 필수 pass 항목 확인
  for (const item of testCase.mustPassItems) {
    if (!passedItems.includes(item)) {
      issues.push(`필수 pass 항목 "${item}"이 pass되지 않음`);
      passed = false;
    }
  }

  // 4. 필수 fail 항목 확인
  for (const item of testCase.mustFailItems) {
    if (!failedItems.includes(item)) {
      issues.push(`필수 fail 항목 "${item}"이 fail되지 않음`);
      passed = false;
    }
  }

  return {
    testCaseId: testCase.id,
    passed,
    issues,
    actualScore,
    verifiedAt: Date.now(),
  };
}

export interface GoldenTestVerification {
  testCaseId: string;
  passed: boolean;
  issues: string[];
  actualScore: number;
  verifiedAt: number;
}

// ============================================================
// #46 동일 사이트 재검사 편차 모니터링
// ============================================================

export interface DeviationReport {
  /** 도메인 */
  domain: string;
  /** 이전 점수 */
  previousScore: number;
  /** 현재 점수 */
  currentScore: number;
  /** 편차 */
  deviation: number;
  /** tolerance 범위 내 여부 */
  withinTolerance: boolean;
  /** 편차 원인 추정 */
  possibleCauses: string[];
  /** 카테고리별 편차 */
  categoryDeviations: { category: string; previous: number; current: number; deviation: number }[];
  /** 경고 수준 */
  alertLevel: "none" | "warning" | "critical";
}

/**
 * 재검사 편차 분석
 * 동일 사이트의 이전 결과와 현재 결과를 비교하여 편차를 분석
 */
export function analyzeDeviation(
  domain: string,
  previousResult: { score: number; categoryScores: Record<string, number>; timestamp: number },
  currentResult: { score: number; categoryScores: Record<string, number>; timestamp: number }
): DeviationReport {
  const { withinTolerance: overallWithin, deviation, direction } = isWithinTolerance(
    previousResult.score,
    currentResult.score,
    SCORE_TOLERANCE.overallTolerance
  );

  // 카테고리별 편차 계산
  const categoryDeviations: DeviationReport["categoryDeviations"] = [];
  for (const [category, prevScore] of Object.entries(previousResult.categoryScores)) {
    const currScore = currentResult.categoryScores[category];
    if (currScore !== undefined) {
      categoryDeviations.push({
        category,
        previous: prevScore,
        current: currScore,
        deviation: Math.abs(currScore - prevScore),
      });
    }
  }

  // 편차 원인 추정
  const possibleCauses: string[] = [];
  const timeDiff = currentResult.timestamp - previousResult.timestamp;
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff < 1 && deviation > SCORE_TOLERANCE.overallTolerance) {
    possibleCauses.push("단시간 내 큰 편차 — LLM 응답 불일치 가능성");
    possibleCauses.push("외부 API(PageSpeed 등) 측정값 변동 가능성");
  }

  if (deviation > 10) {
    possibleCauses.push("사이트 실제 변경 가능성 (콘텐츠 수정, 설정 변경)");
    possibleCauses.push("크롤링 실패 또는 타임아웃으로 인한 데이터 누락");
  }

  // 카테고리별 큰 편차 원인
  const bigDeviationCategories = categoryDeviations.filter(c => c.deviation > SCORE_TOLERANCE.categoryTolerance);
  for (const cat of bigDeviationCategories) {
    possibleCauses.push(`"${cat.category}" 카테고리에서 ${cat.deviation}점 변동`);
  }

  // 경고 수준 판정
  let alertLevel: "none" | "warning" | "critical";
  if (deviation > SCORE_TOLERANCE.overallTolerance * 3) alertLevel = "critical";
  else if (!overallWithin) alertLevel = "warning";
  else alertLevel = "none";

  return {
    domain,
    previousScore: previousResult.score,
    currentScore: currentResult.score,
    deviation,
    withinTolerance: overallWithin,
    possibleCauses,
    categoryDeviations,
    alertLevel,
  };
}

// ============================================================
// #47 진단 결과 이력 저장 및 변동 원인 추적
// ============================================================

export interface DiagnosisHistoryEntry {
  /** 진단 ID */
  diagnosisId: string;
  /** 도메인 */
  domain: string;
  /** 진단 시각 */
  timestamp: number;
  /** 총점 */
  overallScore: number;
  /** 카테고리별 점수 */
  categoryScores: Record<string, number>;
  /** 개별 항목 결과 요약 */
  itemResults: { itemId: string; passed: boolean; score: number }[];
  /** 진료과 */
  specialty: string;
  /** 이전 진단 대비 변동 */
  changeFromPrevious?: {
    scoreDelta: number;
    direction: "up" | "down" | "stable";
    changedItems: { itemId: string; previousResult: boolean; currentResult: boolean }[];
  };
}

export interface ChangeTracker {
  /** 도메인 */
  domain: string;
  /** 이력 항목 수 */
  historyCount: number;
  /** 최근 90일 평균 점수 */
  avg90DayScore: number;
  /** 최근 90일 점수 표준편차 */
  stdDev90Day: number;
  /** 점수 추세 */
  trend: "improving" | "declining" | "stable";
  /** 가장 많이 변동된 항목 */
  mostVolatileItems: { itemId: string; changeCount: number }[];
}

/**
 * 진단 이력에서 변동 원인 추적
 */
export function trackChanges(history: DiagnosisHistoryEntry[]): ChangeTracker | null {
  if (history.length === 0) return null;

  const domain = history[0].domain;
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // 최근 90일 데이터 필터링
  const recent = history.filter(h => h.timestamp >= ninetyDaysAgo);
  
  if (recent.length === 0) {
    return {
      domain,
      historyCount: history.length,
      avg90DayScore: 0,
      stdDev90Day: 0,
      trend: "stable",
      mostVolatileItems: [],
    };
  }

  // 평균 점수
  const scores = recent.map(h => h.overallScore);
  const avg90DayScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // 표준편차
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg90DayScore, 2), 0) / scores.length;
  const stdDev90Day = Math.round(Math.sqrt(variance) * 10) / 10;

  // 추세 판정 (최근 vs 이전)
  let trend: "improving" | "declining" | "stable" = "stable";
  if (recent.length >= 3) {
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((s, h) => s + h.overallScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, h) => s + h.overallScore, 0) / secondHalf.length;
    
    if (secondAvg - firstAvg > 3) trend = "improving";
    else if (firstAvg - secondAvg > 3) trend = "declining";
  }

  // 가장 많이 변동된 항목
  const itemChangeCount: Record<string, number> = {};
  for (const entry of recent) {
    if (entry.changeFromPrevious) {
      for (const changed of entry.changeFromPrevious.changedItems) {
        itemChangeCount[changed.itemId] = (itemChangeCount[changed.itemId] || 0) + 1;
      }
    }
  }

  const mostVolatileItems = Object.entries(itemChangeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([itemId, changeCount]) => ({ itemId, changeCount }));

  return {
    domain,
    historyCount: history.length,
    avg90DayScore,
    stdDev90Day,
    trend,
    mostVolatileItems,
  };
}

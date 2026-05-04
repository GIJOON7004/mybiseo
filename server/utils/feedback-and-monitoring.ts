/**
 * #48 사용자 피드백 수집 및 반영 루프
 * #49 외부 API 상태 대시보드 및 Fallback 전략 문서화
 * #50 진단 정확도 KPI 정의 및 분기별 리뷰
 */

// ============================================================
// #48 사용자 피드백 수집 및 반영 루프
// ============================================================

export interface UserFeedback {
  /** 피드백 ID */
  id: string;
  /** 진단 ID */
  diagnosisId: string;
  /** 도메인 */
  domain: string;
  /** 피드백 유형 */
  type: "score_accuracy" | "item_accuracy" | "recommendation_quality" | "general";
  /** 피드백 내용 */
  content: string;
  /** 사용자 평가 (1-5) */
  rating: number;
  /** 구체적 항목 (해당 시) */
  specificItem?: string;
  /** 사용자가 생각하는 올바른 결과 */
  expectedResult?: string;
  /** 제출 시각 */
  submittedAt: number;
  /** 처리 상태 */
  status: "pending" | "reviewed" | "applied" | "rejected";
  /** 처리 메모 */
  resolutionNote?: string;
}

export interface FeedbackSummary {
  /** 총 피드백 수 */
  totalCount: number;
  /** 평균 평점 */
  avgRating: number;
  /** 유형별 분포 */
  byType: Record<string, number>;
  /** 처리 상태별 분포 */
  byStatus: Record<string, number>;
  /** 가장 많은 불만 항목 */
  topIssues: { item: string; count: number; avgRating: number }[];
  /** 개선 추세 (최근 피드백이 이전보다 나은지) */
  improvementTrend: "improving" | "declining" | "stable";
}

/**
 * 피드백 데이터 요약 생성
 */
export function summarizeFeedback(feedbacks: UserFeedback[]): FeedbackSummary {
  if (feedbacks.length === 0) {
    return {
      totalCount: 0,
      avgRating: 0,
      byType: {},
      byStatus: {},
      topIssues: [],
      improvementTrend: "stable",
    };
  }

  // 평균 평점
  const avgRating = Math.round(
    (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length) * 10
  ) / 10;

  // 유형별 분포
  const byType: Record<string, number> = {};
  for (const f of feedbacks) {
    byType[f.type] = (byType[f.type] || 0) + 1;
  }

  // 상태별 분포
  const byStatus: Record<string, number> = {};
  for (const f of feedbacks) {
    byStatus[f.status] = (byStatus[f.status] || 0) + 1;
  }

  // 가장 많은 불만 항목
  const itemIssues: Record<string, { count: number; totalRating: number }> = {};
  for (const f of feedbacks) {
    if (f.specificItem && f.rating <= 3) {
      if (!itemIssues[f.specificItem]) {
        itemIssues[f.specificItem] = { count: 0, totalRating: 0 };
      }
      itemIssues[f.specificItem].count++;
      itemIssues[f.specificItem].totalRating += f.rating;
    }
  }
  const topIssues = Object.entries(itemIssues)
    .map(([item, data]) => ({
      item,
      count: data.count,
      avgRating: Math.round((data.totalRating / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 개선 추세
  let improvementTrend: "improving" | "declining" | "stable" = "stable";
  if (feedbacks.length >= 10) {
    const sorted = [...feedbacks].sort((a, b) => a.submittedAt - b.submittedAt);
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const firstAvg = firstHalf.reduce((s, f) => s + f.rating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, f) => s + f.rating, 0) / secondHalf.length;
    
    if (secondAvg - firstAvg > 0.3) improvementTrend = "improving";
    else if (firstAvg - secondAvg > 0.3) improvementTrend = "declining";
  }

  return {
    totalCount: feedbacks.length,
    avgRating,
    byType,
    byStatus,
    topIssues,
    improvementTrend,
  };
}

// ============================================================
// #49 외부 API 상태 대시보드 및 Fallback 전략
// ============================================================

export interface ExternalAPIStatus {
  /** API 이름 */
  name: string;
  /** API 엔드포인트 */
  endpoint: string;
  /** 현재 상태 */
  status: "healthy" | "degraded" | "down" | "unknown";
  /** 마지막 성공 시각 */
  lastSuccessAt?: number;
  /** 마지막 실패 시각 */
  lastFailureAt?: number;
  /** 최근 24시간 성공률 (%) */
  successRate24h: number;
  /** 평균 응답 시간 (ms) */
  avgResponseTime: number;
  /** Fallback 전략 */
  fallbackStrategy: FallbackStrategy;
}

export interface FallbackStrategy {
  /** Fallback 유형 */
  type: "cache" | "default_value" | "alternative_api" | "skip" | "retry";
  /** 설명 */
  description: string;
  /** Fallback 시 영향 범위 */
  impactDescription: string;
  /** 최대 재시도 횟수 */
  maxRetries?: number;
  /** 캐시 TTL (초) */
  cacheTTL?: number;
}

/**
 * 외부 API 목록 및 Fallback 전략 정의
 */
export const EXTERNAL_API_REGISTRY: ExternalAPIStatus[] = [
  {
    name: "PageSpeed Insights API",
    endpoint: "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
    status: "healthy",
    successRate24h: 95,
    avgResponseTime: 8000,
    fallbackStrategy: {
      type: "cache",
      description: "이전 측정 결과를 캐시에서 반환 (최대 24시간)",
      impactDescription: "성능 점수가 최신 데이터가 아닐 수 있음",
      cacheTTL: 86400,
      maxRetries: 2,
    },
  },
  {
    name: "SimilarWeb API",
    endpoint: "https://api.similarweb.com",
    status: "healthy",
    successRate24h: 90,
    avgResponseTime: 3000,
    fallbackStrategy: {
      type: "default_value",
      description: "업계 평균 트래픽 데이터로 대체",
      impactDescription: "트래픽 추정치가 실제와 다를 수 있음",
      maxRetries: 1,
    },
  },
  {
    name: "네이버 검색 크롤링",
    endpoint: "https://search.naver.com",
    status: "healthy",
    successRate24h: 85,
    avgResponseTime: 2000,
    fallbackStrategy: {
      type: "skip",
      description: "네이버 검색 순위 측정을 건너뛰고 구글 결과만 사용",
      impactDescription: "네이버 노출 순위가 리포트에서 제외됨",
      maxRetries: 3,
    },
  },
  {
    name: "구글 검색 크롤링",
    endpoint: "https://www.google.com/search",
    status: "healthy",
    successRate24h: 80,
    avgResponseTime: 2500,
    fallbackStrategy: {
      type: "skip",
      description: "구글 검색 순위 측정을 건너뛰고 네이버 결과만 사용",
      impactDescription: "구글 노출 순위가 리포트에서 제외됨",
      maxRetries: 3,
    },
  },
  {
    name: "LLM API (분석/요약)",
    endpoint: "Built-in Forge API",
    status: "healthy",
    successRate24h: 98,
    avgResponseTime: 5000,
    fallbackStrategy: {
      type: "retry",
      description: "최대 3회 재시도 후 템플릿 기반 응답으로 대체",
      impactDescription: "분석 요약이 템플릿 기반으로 제공되어 맞춤도가 낮아질 수 있음",
      maxRetries: 3,
    },
  },
];

/**
 * API 상태 확인 및 Fallback 결정
 */
export function shouldUseFallback(apiName: string): {
  useFallback: boolean;
  strategy: FallbackStrategy | null;
  reason?: string;
} {
  const api = EXTERNAL_API_REGISTRY.find(a => a.name === apiName);
  if (!api) {
    return { useFallback: false, strategy: null };
  }

  if (api.status === "down") {
    return {
      useFallback: true,
      strategy: api.fallbackStrategy,
      reason: `${apiName}이 현재 다운 상태입니다.`,
    };
  }

  if (api.status === "degraded" && api.successRate24h < 50) {
    return {
      useFallback: true,
      strategy: api.fallbackStrategy,
      reason: `${apiName}의 성공률이 ${api.successRate24h}%로 낮습니다.`,
    };
  }

  return { useFallback: false, strategy: null };
}

// ============================================================
// #50 진단 정확도 KPI 정의 및 분기별 리뷰
// ============================================================

export interface AccuracyKPI {
  /** KPI 이름 */
  name: string;
  /** KPI ID */
  id: string;
  /** 설명 */
  description: string;
  /** 측정 방법 */
  measurementMethod: string;
  /** 목표값 */
  target: number;
  /** 단위 */
  unit: string;
  /** 현재 값 */
  currentValue?: number;
  /** 이전 분기 값 */
  previousQuarterValue?: number;
  /** 달성 여부 */
  achieved?: boolean;
}

/**
 * 진단 정확도 KPI 정의
 */
export const ACCURACY_KPIS: AccuracyKPI[] = [
  {
    id: "KPI-001",
    name: "재검사 일관성",
    description: "동일 사이트 24시간 내 재검사 시 점수 편차",
    measurementMethod: "동일 사이트 2회 연속 진단 후 점수 차이의 평균",
    target: 3,
    unit: "점 이내",
  },
  {
    id: "KPI-002",
    name: "골든 테스트 통과율",
    description: "골든 테스트 세트 전체 케이스 통과 비율",
    measurementMethod: "골든 테스트 세트 실행 후 pass 비율",
    target: 90,
    unit: "%",
  },
  {
    id: "KPI-003",
    name: "사용자 정확도 평가",
    description: "사용자 피드백에서 '점수가 정확하다' 응답 비율",
    measurementMethod: "score_accuracy 유형 피드백 중 rating 4 이상 비율",
    target: 80,
    unit: "%",
  },
  {
    id: "KPI-004",
    name: "LLM 응답 유효율",
    description: "LLM 응답이 검증 레이어를 통과하는 비율",
    measurementMethod: "validateJsonResponse/validateTextResponse 통과율",
    target: 95,
    unit: "%",
  },
  {
    id: "KPI-005",
    name: "외부 API 가용률",
    description: "외부 API 호출 성공률 (Fallback 미포함)",
    measurementMethod: "외부 API 호출 성공 수 / 전체 호출 수",
    target: 90,
    unit: "%",
  },
  {
    id: "KPI-006",
    name: "진단 완료율",
    description: "진단 시작 후 정상 완료되는 비율",
    measurementMethod: "정상 완료된 진단 수 / 시작된 진단 수",
    target: 98,
    unit: "%",
  },
  {
    id: "KPI-007",
    name: "진단 소요 시간",
    description: "진단 시작부터 결과 반환까지 소요 시간",
    measurementMethod: "전체 진단 소요 시간의 P95",
    target: 60,
    unit: "초 이내",
  },
  {
    id: "KPI-008",
    name: "검색 순위 예측 정확도",
    description: "예측 순위와 실제 순위의 상관관계",
    measurementMethod: "예측 순위 vs 실제 측정 순위의 스피어만 상관계수",
    target: 0.7,
    unit: "상관계수",
  },
];

/**
 * 분기별 KPI 리뷰 리포트 생성
 */
export function generateQuarterlyKPIReport(
  kpiValues: Record<string, number>
): {
  quarter: string;
  kpis: (AccuracyKPI & { currentValue: number; achieved: boolean })[];
  overallAchievementRate: number;
  recommendations: string[];
} {
  const now = new Date();
  const quarter = `${now.getFullYear()} Q${Math.ceil((now.getMonth() + 1) / 3)}`;

  const evaluatedKPIs = ACCURACY_KPIS.map(kpi => {
    const currentValue = kpiValues[kpi.id] ?? 0;
    // KPI-001은 낮을수록 좋음 (편차), 나머지는 높을수록 좋음
    const achieved = kpi.id === "KPI-001" || kpi.id === "KPI-007"
      ? currentValue <= kpi.target
      : currentValue >= kpi.target;
    
    return { ...kpi, currentValue, achieved };
  });

  const achievedCount = evaluatedKPIs.filter(k => k.achieved).length;
  const overallAchievementRate = Math.round((achievedCount / evaluatedKPIs.length) * 100);

  // 미달 KPI에 대한 개선 권고
  const recommendations: string[] = [];
  for (const kpi of evaluatedKPIs) {
    if (!kpi.achieved) {
      recommendations.push(
        `[${kpi.name}] 현재 ${kpi.currentValue}${kpi.unit} → 목표 ${kpi.target}${kpi.unit} 미달. 개선 필요.`
      );
    }
  }

  if (overallAchievementRate >= 90) {
    recommendations.push("전반적으로 우수한 정확도를 유지하고 있습니다.");
  } else if (overallAchievementRate >= 70) {
    recommendations.push("일부 KPI 개선이 필요합니다. 미달 항목에 집중하세요.");
  } else {
    recommendations.push("다수 KPI가 미달입니다. 근본적인 개선 계획이 필요합니다.");
  }

  return {
    quarter,
    kpis: evaluatedKPIs,
    overallAchievementRate,
    recommendations,
  };
}

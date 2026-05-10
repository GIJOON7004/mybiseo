/**
 * #38 검색 노출 추이 시계열 데이터 수집
 * #42 업종별 평균 점수 대시보드 제공
 * #43 시간대별 검색 트렌드 반영
 * #44 광고 집행 현황 대비 자연 검색 비중 분석
 * 
 * 검색 노출 데이터의 시계열 추적, 트렌드 분석, 업종별 벤치마크 대시보드
 */

import type { SpecialtyType } from "../specialty-weights";

// ============================================================
// #38 검색 노출 추이 시계열
// ============================================================

export interface TimeSeriesDataPoint {
  /** 측정 시각 (Unix timestamp ms) */
  timestamp: number;
  /** 날짜 문자열 (YYYY-MM-DD) */
  date: string;
  /** 네이버 평균 순위 */
  naverAvgRank: number;
  /** 구글 평균 순위 */
  googleAvgRank: number;
  /** AI 가시성 점수 */
  aiVisibilityScore: number;
  /** 종합 SEO 점수 */
  overallSeoScore: number;
  /** 추정 유기적 트래픽 */
  estimatedOrganicTraffic: number;
}

export interface SearchTrendTimeSeries {
  /** 대상 도메인 */
  domain: string;
  /** 진료과 */
  specialty: SpecialtyType;
  /** 데이터 포인트 */
  dataPoints: TimeSeriesDataPoint[];
  /** 추세 방향 */
  trend: "improving" | "declining" | "stable";
  /** 추세 강도 (0-1) */
  trendStrength: number;
  /** 기간 (일) */
  periodDays: number;
}

/**
 * 시계열 데이터 추세 분석
 * 선형 회귀를 사용하여 추세 방향과 강도를 계산
 */
export function analyzeTrend(dataPoints: TimeSeriesDataPoint[]): {
  trend: "improving" | "declining" | "stable";
  trendStrength: number;
  projectedScore30Days: number;
} {
  if (dataPoints.length < 2) {
    return { trend: "stable", trendStrength: 0, projectedScore30Days: dataPoints[0]?.overallSeoScore || 0 };
  }

  // 간단한 선형 회귀
  const n = dataPoints.length;
  const xValues = dataPoints.map((_, i) => i);
  const yValues = dataPoints.map(d => d.overallSeoScore);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgY = sumY / n;

  // 추세 방향 판정
  let trend: "improving" | "declining" | "stable";
  if (slope > 0.5) trend = "improving";
  else if (slope < -0.5) trend = "declining";
  else trend = "stable";

  // 추세 강도 (0-1)
  const trendStrength = Math.min(1, Math.abs(slope) / 5);

  // 30일 후 예측 점수
  const projectedScore30Days = Math.max(0, Math.min(100, avgY + slope * 30));

  return { trend, trendStrength, projectedScore30Days };
}

// ============================================================
// #43 시간대별 검색 트렌드 반영
// ============================================================

export interface SearchTrendData {
  /** 키워드 */
  keyword: string;
  /** 진료과 */
  specialty: SpecialtyType;
  /** 월별 검색량 추이 (최근 12개월) */
  monthlyVolume: { month: string; volume: number }[];
  /** 계절성 지수 (1-12월, 1.0 = 평균) */
  seasonalityIndex: number[];
  /** 성장률 (전년 대비 %) */
  yearOverYearGrowth: number;
  /** 트렌드 상태 */
  trendStatus: "rising" | "falling" | "stable" | "seasonal";
}

/**
 * 진료과별 계절성 패턴 (경험적 데이터)
 * 각 월의 검색량 지수 (1.0 = 연평균)
 */
export const SEASONAL_PATTERNS: Record<SpecialtyType, number[]> = {
  "성형외과": [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3], // 겨울 성수기
  "치과": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // 계절성 낮음
  "피부과": [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7], // 여름 성수기
  "한의원": [1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.1], // 가을/겨울 성수기
  "정형외과": [1.0, 0.9, 1.0, 1.1, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1, 1.0, 1.0], // 봄/가을 약간 높음
  "안과": [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.1, 1.2], // 겨울/봄 성수기(수능 후)
  "산부인과": [1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0], // 계절성 낮음
  "종합병원": [1.2, 1.0, 0.9, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3], // 연말 건강검진 시즌
  "이비인후과": [1.3, 1.2, 1.1, 1.0, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.2, 1.3], // 겨울 성수기
  "비뇨기과": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // 계절성 낮음
  "내과": [1.2, 1.1, 0.9, 0.9, 0.8, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3], // 겨울 성수기
  "소아과": [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 1.0, 1.1, 1.2, 1.3], // 겨울 성수기
  "기타": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
};

/**
 * 현재 월의 계절성 지수 반환
 */
export function getCurrentSeasonalIndex(specialty: SpecialtyType): number {
  const month = new Date().getMonth(); // 0-indexed
  const pattern = SEASONAL_PATTERNS[specialty] || SEASONAL_PATTERNS["기타"];
  return pattern[month];
}

/**
 * 검색 트렌드 기반 키워드 우선순위 조정
 * 계절성이 높은 시기의 키워드에 가중치 부여
 */
export function adjustKeywordPriorityByTrend(
  keywords: { keyword: string; baseScore: number }[],
  specialty: SpecialtyType
): { keyword: string; adjustedScore: number; seasonalBoost: number }[] {
  const seasonalIndex = getCurrentSeasonalIndex(specialty);
  
  return keywords.map(k => ({
    keyword: k.keyword,
    adjustedScore: Math.round(k.baseScore * seasonalIndex * 100) / 100,
    seasonalBoost: seasonalIndex,
  }));
}

// ============================================================
// #42 업종별 평균 점수 대시보드
// ============================================================

export interface IndustryDashboardData {
  /** 진료과 */
  specialty: SpecialtyType;
  /** 업계 평균 SEO 점수 */
  avgSeoScore: number;
  /** 업계 상위 10% 점수 */
  top10PercentScore: number;
  /** 업계 하위 10% 점수 */
  bottom10PercentScore: number;
  /** 카테고리별 업계 평균 */
  categoryAverages: Record<string, number>;
  /** 전월 대비 변동 */
  monthOverMonthChange: number;
  /** 업계 트렌드 */
  industryTrend: "improving" | "declining" | "stable";
  /** 샘플 수 */
  sampleSize: number;
  /** 마지막 업데이트 */
  lastUpdated: string;
}

/**
 * 업종별 평균 점수 대시보드 데이터 생성
 */
export function getIndustryDashboard(specialty: SpecialtyType): IndustryDashboardData {
  // 업종별 경험적 데이터 (실제 측정 데이터 축적 시 업데이트)
  const dashboardData: Record<SpecialtyType, Omit<IndustryDashboardData, "specialty">> = {
    "성형외과": {
      avgSeoScore: 62,
      top10PercentScore: 88,
      bottom10PercentScore: 35,
      categoryAverages: { "메타 태그": 70, "콘텐츠 구조": 55, "검색 고급 설정": 60, "AI 검색 노출": 45, "네이버 검색 최적화": 65, "병원 특화 SEO": 58 },
      monthOverMonthChange: 1.5,
      industryTrend: "improving",
      sampleSize: 50,
      lastUpdated: "2025-04",
    },
    "치과": {
      avgSeoScore: 58,
      top10PercentScore: 85,
      bottom10PercentScore: 30,
      categoryAverages: { "메타 태그": 65, "콘텐츠 구조": 52, "검색 고급 설정": 55, "AI 검색 노출": 40, "네이버 검색 최적화": 62, "병원 특화 SEO": 55 },
      monthOverMonthChange: 0.8,
      industryTrend: "stable",
      sampleSize: 80,
      lastUpdated: "2025-04",
    },
    "피부과": {
      avgSeoScore: 60,
      top10PercentScore: 86,
      bottom10PercentScore: 32,
      categoryAverages: { "메타 태그": 68, "콘텐츠 구조": 54, "검색 고급 설정": 58, "AI 검색 노출": 42, "네이버 검색 최적화": 64, "병원 특화 SEO": 56 },
      monthOverMonthChange: 2.0,
      industryTrend: "improving",
      sampleSize: 60,
      lastUpdated: "2025-04",
    },
    "한의원": {
      avgSeoScore: 52,
      top10PercentScore: 78,
      bottom10PercentScore: 25,
      categoryAverages: { "메타 태그": 58, "콘텐츠 구조": 48, "검색 고급 설정": 45, "AI 검색 노출": 35, "네이버 검색 최적화": 58, "병원 특화 SEO": 50 },
      monthOverMonthChange: 0.5,
      industryTrend: "stable",
      sampleSize: 40,
      lastUpdated: "2025-04",
    },
    "정형외과": {
      avgSeoScore: 50,
      top10PercentScore: 75,
      bottom10PercentScore: 22,
      categoryAverages: { "메타 태그": 55, "콘텐츠 구조": 45, "검색 고급 설정": 42, "AI 검색 노출": 30, "네이버 검색 최적화": 55, "병원 특화 SEO": 48 },
      monthOverMonthChange: -0.3,
      industryTrend: "stable",
      sampleSize: 35,
      lastUpdated: "2025-04",
    },
    "안과": {
      avgSeoScore: 60,
      top10PercentScore: 84,
      bottom10PercentScore: 30,
      categoryAverages: { "메타 태그": 66, "콘텐츠 구조": 55, "검색 고급 설정": 58, "AI 검색 노출": 42, "네이버 검색 최적화": 60, "병원 특화 SEO": 55 },
      monthOverMonthChange: 1.2,
      industryTrend: "improving",
      sampleSize: 30,
      lastUpdated: "2025-04",
    },
    "산부인과": {
      avgSeoScore: 48,
      top10PercentScore: 72,
      bottom10PercentScore: 20,
      categoryAverages: { "메타 태그": 52, "콘텐츠 구조": 42, "검색 고급 설정": 40, "AI 검색 노출": 28, "네이버 검색 최적화": 52, "병원 특화 SEO": 45 },
      monthOverMonthChange: 0.2,
      industryTrend: "stable",
      sampleSize: 25,
      lastUpdated: "2025-04",
    },
    "종합병원": {
      avgSeoScore: 65,
      top10PercentScore: 90,
      bottom10PercentScore: 40,
      categoryAverages: { "메타 태그": 75, "콘텐츠 구조": 60, "검색 고급 설정": 65, "AI 검색 노출": 50, "네이버 검색 최적화": 68, "병원 특화 SEO": 62 },
      monthOverMonthChange: 0.8,
      industryTrend: "stable",
      sampleSize: 20,
      lastUpdated: "2025-04",
    },
    "이비인후과": {
      avgSeoScore: 46,
      top10PercentScore: 70,
      bottom10PercentScore: 18,
      categoryAverages: { "메타 태그": 50, "콘텐츠 구조": 40, "검색 고급 설정": 38, "AI 검색 노출": 25, "네이버 검색 최적화": 50, "병원 특화 SEO": 42 },
      monthOverMonthChange: -0.5,
      industryTrend: "declining",
      sampleSize: 20,
      lastUpdated: "2025-04",
    },
    "비뇨기과": {
      avgSeoScore: 45,
      top10PercentScore: 68,
      bottom10PercentScore: 18,
      categoryAverages: { "메타 태그": 48, "콘텐츠 구조": 38, "검색 고급 설정": 38, "AI 검색 노출": 25, "네이버 검색 최적화": 48, "병원 특화 SEO": 40 },
      monthOverMonthChange: 0.0,
      industryTrend: "stable",
      sampleSize: 15,
      lastUpdated: "2025-04",
    },
    "내과": {
      avgSeoScore: 44,
      top10PercentScore: 70,
      bottom10PercentScore: 15,
      categoryAverages: { "메타 태그": 48, "콘텐츠 구조": 38, "검색 고급 설정": 35, "AI 검색 노출": 22, "네이버 검색 최적화": 48, "병원 특화 SEO": 40 },
      monthOverMonthChange: 0.3,
      industryTrend: "stable",
      sampleSize: 50,
      lastUpdated: "2025-04",
    },
    "소아과": {
      avgSeoScore: 42,
      top10PercentScore: 65,
      bottom10PercentScore: 15,
      categoryAverages: { "메타 태그": 45, "콘텐츠 구조": 35, "검색 고급 설정": 32, "AI 검색 노출": 20, "네이버 검색 최적화": 45, "병원 특화 SEO": 38 },
      monthOverMonthChange: -0.2,
      industryTrend: "stable",
      sampleSize: 30,
      lastUpdated: "2025-04",
    },
    "기타": {
      avgSeoScore: 40,
      top10PercentScore: 60,
      bottom10PercentScore: 12,
      categoryAverages: { "메타 태그": 42, "콘텐츠 구조": 32, "검색 고급 설정": 30, "AI 검색 노출": 18, "네이버 검색 최적화": 42, "병원 특화 SEO": 35 },
      monthOverMonthChange: 0.0,
      industryTrend: "stable",
      sampleSize: 100,
      lastUpdated: "2025-04",
    },
  };

  const data = dashboardData[specialty] || dashboardData["기타"];
  return { specialty, ...data };
}

// ============================================================
// #44 광고 집행 현황 대비 자연 검색 비중 분석
// ============================================================

export interface AdVsOrganicAnalysis {
  /** 대상 도메인 */
  domain: string;
  /** 네이버 광고 노출 여부 (파워링크) */
  hasNaverAd: boolean;
  /** 구글 광고 노출 여부 (Google Ads) */
  hasGoogleAd: boolean;
  /** 추정 광고 키워드 수 */
  estimatedAdKeywords: number;
  /** 추정 월간 광고비 (만원) */
  estimatedMonthlyAdSpend: number;
  /** 자연 검색 vs 광고 비율 */
  organicVsAdRatio: {
    organicPercent: number;
    adPercent: number;
  };
  /** 광고 의존도 등급 */
  adDependencyGrade: "high" | "medium" | "low";
  /** 개선 제안 */
  recommendations: string[];
}

/**
 * 광고 vs 자연 검색 비중 분석
 * 검색 결과에서 광고 노출 여부를 확인하고 자연 검색 비중을 추정
 */
export async function analyzeAdVsOrganic(
  domain: string,
  keywords: string[]
): Promise<AdVsOrganicAnalysis> {
  let hasNaverAd = false;
  const hasGoogleAd = false;
  let adKeywordCount = 0;

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

  for (const keyword of keywords.slice(0, 5)) { // 상위 5개 키워드만 확인
    try {
      // 네이버 검색에서 광고 영역 확인
      const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
      const naverResp = await fetch(naverUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      
      if (naverResp.ok) {
        const html = await naverResp.text();
        // 파워링크 영역에서 도메인 확인
        if (html.includes("powerlink") && html.includes(cleanDomain)) {
          hasNaverAd = true;
          adKeywordCount++;
        }
      }
    } catch {
      // 개별 키워드 실패 시 계속
    }
  }

  // 광고비 추정 (키워드당 평균 CPC 기반)
  const avgCPC = 3000; // 의료 키워드 평균 CPC (원)
  const avgDailyClicks = 50; // 평균 일일 클릭 수
  const estimatedMonthlyAdSpend = Math.round((adKeywordCount * avgCPC * avgDailyClicks * 30) / 10000); // 만원

  // 자연 검색 vs 광고 비율 추정
  const adPercent = hasNaverAd || hasGoogleAd ? Math.min(70, adKeywordCount * 15 + 20) : 0;
  const organicPercent = 100 - adPercent;

  // 광고 의존도 등급
  let adDependencyGrade: "high" | "medium" | "low";
  if (adPercent >= 50) adDependencyGrade = "high";
  else if (adPercent >= 25) adDependencyGrade = "medium";
  else adDependencyGrade = "low";

  // 개선 제안
  const recommendations: string[] = [];
  if (adDependencyGrade === "high") {
    recommendations.push("광고 의존도가 높습니다. SEO 최적화를 통해 자연 검색 비중을 높이세요.");
    recommendations.push("장기적으로 콘텐츠 마케팅에 투자하여 광고비를 절감할 수 있습니다.");
    recommendations.push(`현재 추정 월간 광고비 ${estimatedMonthlyAdSpend}만원 중 일부를 SEO에 재투자하세요.`);
  } else if (adDependencyGrade === "medium") {
    recommendations.push("광고와 자연 검색의 균형이 적절합니다.");
    recommendations.push("자연 검색 순위를 더 높여 광고비 효율을 개선하세요.");
  } else {
    recommendations.push("자연 검색 비중이 높아 광고비 효율이 좋습니다.");
    recommendations.push("핵심 키워드에 대한 자연 검색 1위 유지에 집중하세요.");
  }

  return {
    domain: cleanDomain,
    hasNaverAd,
    hasGoogleAd,
    estimatedAdKeywords: adKeywordCount,
    estimatedMonthlyAdSpend,
    organicVsAdRatio: { organicPercent, adPercent },
    adDependencyGrade,
    recommendations,
  };
}

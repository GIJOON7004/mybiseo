/**
 * 4단계 개선사항 vitest 테스트
 * 
 * 테스트 대상:
 * - #35 진료과별 핵심 키워드 사전
 * - #30 객단가 데이터
 * - #17 점수 구간 경계값
 * - #25 LLM 응답 검증 레이어
 * - #33/#34 검색 노출 순위 측정 / AI 가시성
 * - #36/#37 비즈니스 프로필 / 백링크
 * - #39/#40/#41 경쟁사 식별 / 벤치마크
 * - #38/#42/#43/#44 시계열 / 대시보드 / 트렌드 / 광고
 * - #45/#46/#47 골든 테스트 / 편차 / 이력
 * - #48/#49/#50 피드백 / Fallback / KPI
 */

import { describe, it, expect } from "vitest";

// #35 진료과별 핵심 키워드 사전
import { SPECIALTY_KEYWORDS_DICT, getKeywordsForMeasurement } from "./utils/specialty-keywords-dict";

// #30 객단가 데이터
import { SPECIALTY_REVENUE_PROFILES, calculateMarketingValue } from "./utils/specialty-revenue-data";

// #17 점수 구간 경계값
import { OVERALL_SCORE_BOUNDARIES, SCORE_TOLERANCE, getOverallGrade, getCategoryGrade, isWithinTolerance, ITEM_SCORE_BOUNDARIES } from "./utils/score-boundaries";

// #25 LLM 응답 검증
import { validateJsonResponse, validateTextResponse, getCachedLLMResponse, cacheLLMResponse, clearLLMCache, recordLLMCall, getLLMCallStats, resetLLMCallStats } from "./utils/llm-validator";

// #33/#34 검색 노출 순위
import { calculateVisibilityScore, estimateAIVisibility } from "./utils/search-rank-checker";
import type { SearchRankResult } from "./utils/search-rank-checker";

// #36/#37 비즈니스 프로필 / 백링크
import type { BusinessProfileResult, BacklinkProfile } from "./utils/business-profile-checker";

// #39/#40/#41 경쟁사 식별 / 벤치마크
import { INDUSTRY_BENCHMARKS, calculateCompetitivePosition } from "./utils/competitor-identifier";

// #38/#42/#43/#44 시계열 / 대시보드 / 트렌드 / 광고
import { analyzeTrend, getCurrentSeasonalIndex, adjustKeywordPriorityByTrend, getIndustryDashboard, SEASONAL_PATTERNS } from "./utils/search-trends-tracker";
import type { TimeSeriesDataPoint } from "./utils/search-trends-tracker";

// #45/#46/#47 골든 테스트 / 편차 / 이력
import { GOLDEN_TEST_SET, verifyGoldenTest, analyzeDeviation, trackChanges } from "./utils/quality-assurance";
import type { DiagnosisHistoryEntry } from "./utils/quality-assurance";

// #48/#49/#50 피드백 / Fallback / KPI
import { summarizeFeedback, EXTERNAL_API_REGISTRY, shouldUseFallback, ACCURACY_KPIS, generateQuarterlyKPIReport } from "./utils/feedback-and-monitoring";
import type { UserFeedback } from "./utils/feedback-and-monitoring";


// ============================================================
// #35 진료과별 핵심 키워드 사전
// ============================================================
describe("#35 진료과별 핵심 키워드 사전", () => {
  it("모든 진료과에 키워드가 정의되어 있어야 함", () => {
    const specialties = Object.keys(SPECIALTY_KEYWORDS_DICT);
    expect(specialties.length).toBeGreaterThanOrEqual(10);
    for (const specialty of specialties) {
      expect(SPECIALTY_KEYWORDS_DICT[specialty as keyof typeof SPECIALTY_KEYWORDS_DICT].length).toBeGreaterThan(0);
    }
  });

  it("getKeywordsForMeasurement가 올바른 키워드를 반환해야 함", () => {
    const dentalKeywords = getKeywordsForMeasurement("치과");
    expect(dentalKeywords.length).toBeGreaterThan(0);
    expect(dentalKeywords[0]).toHaveProperty("keyword");
    expect(dentalKeywords[0]).toHaveProperty("estimatedVolume");
    expect(dentalKeywords[0]).toHaveProperty("intentStrength");
  });

  it("각 키워드에 estimatedVolume과 intentStrength가 있어야 함", () => {
    const keywords = getKeywordsForMeasurement("성형외과");
    for (const kw of keywords) {
      expect(kw.estimatedVolume).toBeGreaterThan(0);
      expect(kw.intentStrength).toBeGreaterThanOrEqual(0);
      expect(kw.intentStrength).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================
// #30 객단가 데이터
// ============================================================
describe("#30 객단가 데이터", () => {
  it("모든 진료과에 객단가 데이터가 있어야 함", () => {
    const specialties = Object.keys(SPECIALTY_REVENUE_PROFILES);
    expect(specialties.length).toBeGreaterThanOrEqual(10);
  });

  it("SPECIALTY_REVENUE_PROFILES가 유효한 데이터를 포함해야 함", () => {
    const data = SPECIALTY_REVENUE_PROFILES["치과"];
    expect(data).toHaveProperty("avgRevenuePerVisit");
    expect(data).toHaveProperty("avgNewPatientRevenue");
    expect(data).toHaveProperty("procedures");
    expect(data.avgRevenuePerVisit).toBeGreaterThan(0);
    expect(data.avgNewPatientRevenue).toBeGreaterThanOrEqual(data.avgRevenuePerVisit);
  });

  it("calculateMarketingValue가 유효한 값을 반환해야 함", () => {
    const value = calculateMarketingValue("치과");
    expect(value).toHaveProperty("monthlyValue");
    expect(value).toHaveProperty("seoInvestmentScore");
    expect(value).toHaveProperty("recommendation");
    expect(value.monthlyValue).toBeGreaterThan(0);
    expect(value.seoInvestmentScore).toBeGreaterThanOrEqual(0);
    expect(value.seoInvestmentScore).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// #17 점수 구간 경계값
// ============================================================
describe("#17 점수 구간 경계값", () => {
  it("OVERALL_SCORE_BOUNDARIES가 올바른 구간을 정의해야 함", () => {
    const grades = Object.keys(OVERALL_SCORE_BOUNDARIES);
    expect(grades.length).toBeGreaterThanOrEqual(4);
  });

  it("getOverallGrade가 올바른 등급을 반환해야 함", () => {
    const grade90 = getOverallGrade(90);
    expect(grade90.grade).toBeDefined();
    expect(grade90.label).toBeDefined();

    const grade30 = getOverallGrade(30);
    expect(grade30.grade).not.toBe(grade90.grade);
  });

  it("getCategoryGrade가 올바른 등급을 반환해야 함", () => {
    expect(getCategoryGrade(90)).toBe("excellent");
    expect(getCategoryGrade(30)).not.toBe("excellent");
  });

  it("ITEM_SCORE_BOUNDARIES가 정의되어 있어야 함", () => {
    expect(ITEM_SCORE_BOUNDARIES.length).toBeGreaterThan(0);
  });

  it("SCORE_TOLERANCE가 정의되어 있어야 함", () => {
    expect(SCORE_TOLERANCE.overallTolerance).toBeGreaterThan(0);
    expect(SCORE_TOLERANCE.categoryTolerance).toBeGreaterThan(0);
  });

  it("isWithinTolerance가 올바르게 판정해야 함", () => {
    const result1 = isWithinTolerance(80, 82, 5);
    expect(result1.withinTolerance).toBe(true);
    expect(result1.deviation).toBe(2);

    const result2 = isWithinTolerance(80, 90, 5);
    expect(result2.withinTolerance).toBe(false);
    expect(result2.deviation).toBe(10);
  });
});

// ============================================================
// #25 LLM 응답 검증 레이어
// ============================================================
describe("#25 LLM 응답 검증 레이어", () => {
  it("validateJsonResponse가 유효한 JSON을 통과시켜야 함", () => {
    const validJson = '{"score": 85, "items": ["a", "b"]}';
    const result = validateJsonResponse(validJson, ["score", "items"]);
    expect(result.valid).toBe(true);
  });

  it("validateJsonResponse가 잘못된 JSON을 거부해야 함", () => {
    const invalidJson = "not a json {";
    const result = validateJsonResponse(invalidJson, ["score"]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validateJsonResponse가 필수 필드 누락을 감지해야 함", () => {
    const missingField = '{"name": "test"}';
    const result = validateJsonResponse(missingField, ["score", "items"]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validateTextResponse가 빈 응답을 거부해야 함", () => {
    const result = validateTextResponse("", { minLength: 10 });
    expect(result.valid).toBe(false);
  });

  it("validateTextResponse가 충분한 길이의 응답을 통과시켜야 함", () => {
    const result = validateTextResponse("This is a valid response with enough content.", { minLength: 10 });
    expect(result.valid).toBe(true);
  });

  it("LLM 캐시가 올바르게 동작해야 함", () => {
    clearLLMCache();
    cacheLLMResponse("test-prompt", "test-response");
    const cached = getCachedLLMResponse("test-prompt");
    expect(cached).toBe("test-response");
  });

  it("존재하지 않는 캐시 키에 대해 null을 반환해야 함", () => {
    clearLLMCache();
    const notCached = getCachedLLMResponse("nonexistent-prompt");
    expect(notCached).toBeNull();
  });

  it("LLM 호출 통계가 올바르게 기록되어야 함", () => {
    resetLLMCallStats();
    recordLLMCall(1000, 500, false, false);
    recordLLMCall(500, 300, true, false);
    const stats = getLLMCallStats();
    expect(stats.totalCalls).toBe(2);
    expect(stats.cachedHits).toBe(1);
    expect(stats.failedCalls).toBe(0);
  });
});

// ============================================================
// #33/#34 검색 노출 순위 / AI 가시성
// ============================================================
describe("#33/#34 검색 노출 순위 및 AI 가시성", () => {
  it("calculateVisibilityScore가 올바른 점수를 계산해야 함", () => {
    const results: SearchRankResult[] = [
      { keyword: "치과", engine: "naver", rank: 1, section: "organic", measuredAt: Date.now(), success: true },
      { keyword: "치과", engine: "google", rank: 3, section: "organic", measuredAt: Date.now(), success: true },
    ];
    const scores = calculateVisibilityScore(results);
    expect(scores.overall).toBeGreaterThan(0);
    expect(scores.naver).toBe(100); // 1위 = 100점
    expect(scores.google).toBe(80); // 3위 = 80점
  });

  it("calculateVisibilityScore가 미노출 시 0점을 반환해야 함", () => {
    const results: SearchRankResult[] = [
      { keyword: "치과", engine: "naver", rank: 0, section: "organic", measuredAt: Date.now(), success: true },
    ];
    const scores = calculateVisibilityScore(results);
    expect(scores.naver).toBe(0);
  });

  it("estimateAIVisibility가 올바른 점수를 반환해야 함", () => {
    const result = estimateAIVisibility({
      hasStructuredData: true,
      hasFAQSchema: true,
      hasHowToSchema: false,
      contentLength: 3000,
      hasAuthorInfo: true,
      hasMedicalCredentials: true,
      hasReferences: true,
      domainAge: 5,
    });
    expect(result.score).toBeGreaterThan(50);
    expect(result.factors.length).toBe(4);
  });

  it("estimateAIVisibility가 낮은 품질 사이트에 낮은 점수를 줘야 함", () => {
    const result = estimateAIVisibility({
      hasStructuredData: false,
      hasFAQSchema: false,
      hasHowToSchema: false,
      contentLength: 200,
      hasAuthorInfo: false,
      hasMedicalCredentials: false,
      hasReferences: false,
    });
    expect(result.score).toBeLessThan(40);
  });
});

// ============================================================
// #39/#40/#41 경쟁사 식별 / 벤치마크
// ============================================================
describe("#39/#40/#41 경쟁사 식별 및 벤치마크", () => {
  it("INDUSTRY_BENCHMARKS에 모든 진료과가 정의되어 있어야 함", () => {
    const specialties = Object.keys(INDUSTRY_BENCHMARKS);
    expect(specialties.length).toBeGreaterThanOrEqual(10);
    expect(specialties).toContain("치과");
    expect(specialties).toContain("성형외과");
    expect(specialties).toContain("피부과");
  });

  it("벤치마크 데이터가 논리적이어야 함", () => {
    for (const [, data] of Object.entries(INDUSTRY_BENCHMARKS)) {
      expect(data.avgSeoScore).toBeGreaterThan(0);
      expect(data.avgSeoScore).toBeLessThanOrEqual(100);
      expect(data.topPerformerScore).toBeGreaterThanOrEqual(data.avgSeoScore);
      expect(data.sampleSize).toBeGreaterThan(0);
    }
  });

  it("calculateCompetitivePosition이 올바른 포지션을 계산해야 함", () => {
    const position = calculateCompetitivePosition(75, "치과", [80, 70, 60, 50]);
    expect(position.rank).toBeGreaterThan(0);
    expect(position.totalCompetitors).toBe(5); // 자신 포함
    expect(position.percentile).toBeGreaterThan(0);
    expect(position.percentile).toBeLessThanOrEqual(100);
  });

  it("calculateCompetitivePosition이 벤치마크 기반으로도 동작해야 함", () => {
    const position = calculateCompetitivePosition(60, "치과");
    expect(position.rank).toBeGreaterThan(0);
    expect(position.totalCompetitors).toBeGreaterThan(1);
    expect(position.strengths).toBeDefined();
    expect(position.weaknesses).toBeDefined();
    expect(position.opportunities).toBeDefined();
  });
});

// ============================================================
// #38/#42/#43/#44 시계열 / 대시보드 / 트렌드 / 광고
// ============================================================
describe("#38/#42/#43/#44 시계열, 대시보드, 트렌드", () => {
  it("analyzeTrend가 상승 추세를 감지해야 함", () => {
    const dataPoints: TimeSeriesDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (10 - i) * 86400000,
      date: `2025-04-${(i + 1).toString().padStart(2, "0")}`,
      naverAvgRank: 10 - i,
      googleAvgRank: 12 - i,
      aiVisibilityScore: 40 + i * 5,
      overallSeoScore: 50 + i * 4,
      estimatedOrganicTraffic: 1000 + i * 200,
    }));
    const result = analyzeTrend(dataPoints);
    expect(result.trend).toBe("improving");
    expect(result.trendStrength).toBeGreaterThan(0);
  });

  it("analyzeTrend가 안정 추세를 감지해야 함", () => {
    const dataPoints: TimeSeriesDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - (10 - i) * 86400000,
      date: `2025-04-${(i + 1).toString().padStart(2, "0")}`,
      naverAvgRank: 5,
      googleAvgRank: 8,
      aiVisibilityScore: 60,
      overallSeoScore: 70,
      estimatedOrganicTraffic: 5000,
    }));
    const result = analyzeTrend(dataPoints);
    expect(result.trend).toBe("stable");
  });

  it("getCurrentSeasonalIndex가 유효한 값을 반환해야 함", () => {
    const index = getCurrentSeasonalIndex("치과");
    expect(index).toBeGreaterThan(0);
    expect(index).toBeLessThanOrEqual(2);
  });

  it("SEASONAL_PATTERNS의 각 진료과 합이 약 12여야 함 (평균 1.0)", () => {
    for (const [specialty, pattern] of Object.entries(SEASONAL_PATTERNS)) {
      const sum = pattern.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(12, 0); // 약 12 (평균 1.0)
    }
  });

  it("adjustKeywordPriorityByTrend가 조정된 점수를 반환해야 함", () => {
    const keywords = [
      { keyword: "치과 임플란트", baseScore: 80 },
      { keyword: "치과 교정", baseScore: 70 },
    ];
    const adjusted = adjustKeywordPriorityByTrend(keywords, "치과");
    expect(adjusted.length).toBe(2);
    expect(adjusted[0]).toHaveProperty("adjustedScore");
    expect(adjusted[0]).toHaveProperty("seasonalBoost");
  });

  it("getIndustryDashboard가 유효한 데이터를 반환해야 함", () => {
    const dashboard = getIndustryDashboard("성형외과");
    expect(dashboard.specialty).toBe("성형외과");
    expect(dashboard.avgSeoScore).toBeGreaterThan(0);
    expect(dashboard.top10PercentScore).toBeGreaterThan(dashboard.avgSeoScore);
    expect(dashboard.sampleSize).toBeGreaterThan(0);
    expect(dashboard.categoryAverages).toBeDefined();
  });
});

// ============================================================
// #45/#46/#47 골든 테스트 / 편차 / 이력
// ============================================================
describe("#45/#46/#47 골든 테스트, 편차, 이력", () => {
  it("GOLDEN_TEST_SET이 정의되어 있어야 함", () => {
    expect(GOLDEN_TEST_SET.length).toBeGreaterThanOrEqual(3);
    for (const tc of GOLDEN_TEST_SET) {
      expect(tc.id).toBeDefined();
      expect(tc.url).toBeDefined();
      expect(tc.expectedScoreMin).toBeLessThan(tc.expectedScoreMax);
    }
  });

  it("verifyGoldenTest가 범위 내 점수를 pass해야 함", () => {
    const testCase = GOLDEN_TEST_SET[0];
    const midScore = Math.round((testCase.expectedScoreMin + testCase.expectedScoreMax) / 2);
    const result = verifyGoldenTest(
      testCase,
      midScore,
      { "메타 태그": 75, "콘텐츠 구조": 65, "검색 고급 설정": 55 },
      testCase.mustPassItems,
      testCase.mustFailItems
    );
    expect(result.passed).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it("verifyGoldenTest가 범위 밖 점수를 fail해야 함", () => {
    const testCase = GOLDEN_TEST_SET[0];
    const result = verifyGoldenTest(
      testCase,
      10, // 범위 밖
      {},
      [],
      []
    );
    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("analyzeDeviation이 tolerance 내 편차를 정상으로 판정해야 함", () => {
    const report = analyzeDeviation(
      "example.com",
      { score: 70, categoryScores: { "메타 태그": 80 }, timestamp: Date.now() - 3600000 },
      { score: 72, categoryScores: { "메타 태그": 81 }, timestamp: Date.now() }
    );
    expect(report.withinTolerance).toBe(true);
    expect(report.alertLevel).toBe("none");
  });

  it("analyzeDeviation이 큰 편차를 경고해야 함", () => {
    const report = analyzeDeviation(
      "example.com",
      { score: 70, categoryScores: { "메타 태그": 80 }, timestamp: Date.now() - 3600000 },
      { score: 40, categoryScores: { "메타 태그": 50 }, timestamp: Date.now() }
    );
    expect(report.withinTolerance).toBe(false);
    expect(["warning", "critical"]).toContain(report.alertLevel);
  });

  it("trackChanges가 이력에서 추세를 분석해야 함", () => {
    const history: DiagnosisHistoryEntry[] = Array.from({ length: 5 }, (_, i) => ({
      diagnosisId: `diag-${i}`,
      domain: "example.com",
      timestamp: Date.now() - (5 - i) * 86400000,
      overallScore: 60 + i * 3,
      categoryScores: { "메타 태그": 70 + i * 2 },
      itemResults: [],
      specialty: "치과",
    }));
    const tracker = trackChanges(history);
    expect(tracker).not.toBeNull();
    expect(tracker!.domain).toBe("example.com");
    expect(tracker!.historyCount).toBe(5);
    expect(tracker!.avg90DayScore).toBeGreaterThan(0);
  });
});

// ============================================================
// #48/#49/#50 피드백 / Fallback / KPI
// ============================================================
describe("#48/#49/#50 피드백, Fallback, KPI", () => {
  it("summarizeFeedback가 빈 배열을 처리해야 함", () => {
    const summary = summarizeFeedback([]);
    expect(summary.totalCount).toBe(0);
    expect(summary.avgRating).toBe(0);
  });

  it("summarizeFeedback가 올바른 요약을 생성해야 함", () => {
    const feedbacks: UserFeedback[] = [
      { id: "1", diagnosisId: "d1", domain: "a.com", type: "score_accuracy", content: "정확함", rating: 5, submittedAt: Date.now(), status: "pending" },
      { id: "2", diagnosisId: "d2", domain: "b.com", type: "item_accuracy", content: "부정확", rating: 2, specificItem: "meta-title", submittedAt: Date.now(), status: "pending" },
      { id: "3", diagnosisId: "d3", domain: "c.com", type: "score_accuracy", content: "괜찮음", rating: 4, submittedAt: Date.now(), status: "reviewed" },
    ];
    const summary = summarizeFeedback(feedbacks);
    expect(summary.totalCount).toBe(3);
    expect(summary.avgRating).toBeCloseTo(3.7, 1);
    expect(summary.byType["score_accuracy"]).toBe(2);
    expect(summary.byStatus["pending"]).toBe(2);
  });

  it("EXTERNAL_API_REGISTRY가 정의되어 있어야 함", () => {
    expect(EXTERNAL_API_REGISTRY.length).toBeGreaterThanOrEqual(3);
    for (const api of EXTERNAL_API_REGISTRY) {
      expect(api.name).toBeDefined();
      expect(api.fallbackStrategy).toBeDefined();
      expect(api.fallbackStrategy.type).toBeDefined();
    }
  });

  it("shouldUseFallback가 정상 API에 대해 false를 반환해야 함", () => {
    const result = shouldUseFallback("LLM API (분석/요약)");
    expect(result.useFallback).toBe(false);
  });

  it("shouldUseFallback가 존재하지 않는 API에 대해 false를 반환해야 함", () => {
    const result = shouldUseFallback("Nonexistent API");
    expect(result.useFallback).toBe(false);
    expect(result.strategy).toBeNull();
  });

  it("ACCURACY_KPIS가 정의되어 있어야 함", () => {
    expect(ACCURACY_KPIS.length).toBeGreaterThanOrEqual(5);
    for (const kpi of ACCURACY_KPIS) {
      expect(kpi.id).toBeDefined();
      expect(kpi.name).toBeDefined();
      expect(kpi.target).toBeGreaterThan(0);
    }
  });

  it("generateQuarterlyKPIReport가 올바른 리포트를 생성해야 함", () => {
    const kpiValues: Record<string, number> = {
      "KPI-001": 2, // 재검사 일관성 (낮을수록 좋음)
      "KPI-002": 95, // 골든 테스트 통과율
      "KPI-003": 85, // 사용자 정확도 평가
      "KPI-004": 97, // LLM 응답 유효율
      "KPI-005": 92, // 외부 API 가용률
      "KPI-006": 99, // 진단 완료율
      "KPI-007": 45, // 진단 소요 시간 (낮을수록 좋음)
      "KPI-008": 0.75, // 검색 순위 예측 정확도
    };
    const report = generateQuarterlyKPIReport(kpiValues);
    expect(report.quarter).toBeDefined();
    expect(report.overallAchievementRate).toBe(100); // 모든 KPI 달성
    expect(report.kpis.length).toBe(ACCURACY_KPIS.length);
  });

  it("generateQuarterlyKPIReport가 미달 KPI를 감지해야 함", () => {
    const kpiValues: Record<string, number> = {
      "KPI-001": 10, // 미달 (3 이내여야 함)
      "KPI-002": 50, // 미달 (90% 이상이어야 함)
    };
    const report = generateQuarterlyKPIReport(kpiValues);
    expect(report.overallAchievementRate).toBeLessThan(100);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});

/**
 * 33차: 시즌별 마케팅 캘린더 + 경쟁사 비교 대시보드 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
vi.mock("./db", () => ({
  getSeasonalKeywords: vi.fn().mockResolvedValue([
    { id: 1, specialty: "치과", month: 3, keyword: "봄 교정 상담", category: "시술", priority: "high", description: "신학기 시작 전 교정 상담 수요", tips: "학생 교정 할인" },
    { id: 2, specialty: "치과", month: 3, keyword: "어린이 치과검진", category: "건강정보", priority: "medium", description: "구강보건의 날 사전 홍보", tips: "불소도포 프로모션" },
  ]),
  getCurrentSeasonalRecommendations: vi.fn().mockResolvedValue({
    thisMonth: [
      { id: 1, specialty: "치과", month: 3, keyword: "봄 교정 상담", category: "시술", priority: "high", tips: "학생 교정 할인" },
    ],
    nextMonth: [
      { id: 3, specialty: "치과", month: 4, keyword: "어린이 치과검진", category: "건강정보", priority: "medium", tips: "불소도포 프로모션" },
    ],
  }),
  getSeasonalSpecialties: vi.fn().mockResolvedValue(["치과", "피부과", "성형외과", "안과", "정형외과", "내과", "한의원", "산부인과", "소아청소년과"]),
  addSeasonalKeyword: vi.fn().mockResolvedValue(undefined),
  deleteSeasonalKeyword: vi.fn().mockResolvedValue(undefined),
  getCompetitorComparison: vi.fn().mockResolvedValue({
    keywords: [
      { id: 1, keyword: "강남 치과 추천", hospitalName: "서울치과", specialty: "치과", isActive: 1 },
    ],
    comparison: [
      {
        keywordId: 1,
        keyword: "강남 치과 추천",
        hospitalName: "서울치과",
        specialty: "치과",
        totalChecks: 20,
        ourMentionRate: 60,
        ourMentions: 12,
        platformStats: {
          chatgpt: { total: 4, mentioned: 3, rate: 75 },
          gemini: { total: 4, mentioned: 2, rate: 50 },
        },
        competitorAnalysis: [
          { id: 1, name: "경쟁치과A", url: "https://a.com", mentionCount: 8, mentionRate: 40 },
          { id: 2, name: "경쟁치과B", url: "https://b.com", mentionCount: 5, mentionRate: 25 },
        ],
        sentimentCounts: { positive: 8, neutral: 3, negative: 1 },
      },
    ],
  }),
  getCompetitorTrend: vi.fn().mockResolvedValue([
    { week: "2026-03-02", ourMentionRate: 55, totalChecks: 10, competitorRates: { "경쟁치과A": 35 } },
    { week: "2026-03-09", ourMentionRate: 60, totalChecks: 10, competitorRates: { "경쟁치과A": 40 } },
    { week: "2026-03-16", ourMentionRate: 65, totalChecks: 10, competitorRates: { "경쟁치과A": 38 } },
  ]),
}));

// Mock tRPC context
const mockCtx = { user: { id: 1, openId: "test", role: "admin" as const, name: "Admin" } };

import {
  getSeasonalKeywords,
  getCurrentSeasonalRecommendations,
  getSeasonalSpecialties,
  addSeasonalKeyword,
  deleteSeasonalKeyword,
  getCompetitorComparison,
  getCompetitorTrend,
} from "./db";

describe("33차: 시즌별 마케팅 캘린더", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("특정 진료과/월의 시즌 키워드를 조회할 수 있다", async () => {
    const result = await getSeasonalKeywords("치과", 3);
    expect(result).toHaveLength(2);
    expect(result[0].keyword).toBe("봄 교정 상담");
    expect(result[0].specialty).toBe("치과");
    expect(result[0].month).toBe(3);
  });

  it("이번 달/다음 달 추천 키워드를 조회할 수 있다", async () => {
    const result = await getCurrentSeasonalRecommendations("치과");
    expect(result.thisMonth).toHaveLength(1);
    expect(result.nextMonth).toHaveLength(1);
    expect(result.thisMonth[0].keyword).toBe("봄 교정 상담");
  });

  it("등록된 진료과 목록을 조회할 수 있다", async () => {
    const result = await getSeasonalSpecialties();
    expect(result).toContain("치과");
    expect(result).toContain("피부과");
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it("시즌 키워드를 추가할 수 있다", async () => {
    await addSeasonalKeyword({
      specialty: "치과",
      month: 6,
      keyword: "여름 라미네이트",
      category: "시술",
      priority: "medium",
    });
    expect(addSeasonalKeyword).toHaveBeenCalledWith(expect.objectContaining({
      specialty: "치과",
      month: 6,
      keyword: "여름 라미네이트",
    }));
  });

  it("시즌 키워드를 삭제할 수 있다", async () => {
    await deleteSeasonalKeyword(1);
    expect(deleteSeasonalKeyword).toHaveBeenCalledWith(1);
  });
});

describe("33차: 경쟁사 비교 대시보드", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("경쟁사 비교 분석 데이터를 조회할 수 있다", async () => {
    const result = await getCompetitorComparison();
    expect(result.keywords).toHaveLength(1);
    expect(result.comparison).toHaveLength(1);
    
    const comp = result.comparison[0];
    expect(comp.ourMentionRate).toBe(60);
    expect(comp.competitorAnalysis).toHaveLength(2);
    expect(comp.competitorAnalysis[0].name).toBe("경쟁치과A");
    expect(comp.competitorAnalysis[0].mentionRate).toBe(40);
  });

  it("경쟁사 비교에서 플랫폼별 통계를 제공한다", async () => {
    const result = await getCompetitorComparison();
    const comp = result.comparison[0];
    expect(comp.platformStats.chatgpt).toBeDefined();
    expect(comp.platformStats.chatgpt.rate).toBe(75);
    expect(comp.platformStats.gemini.rate).toBe(50);
  });

  it("경쟁사 비교에서 감성 분석을 제공한다", async () => {
    const result = await getCompetitorComparison();
    const comp = result.comparison[0];
    expect(comp.sentimentCounts.positive).toBe(8);
    expect(comp.sentimentCounts.neutral).toBe(3);
    expect(comp.sentimentCounts.negative).toBe(1);
  });

  it("키워드별 경쟁사 비교 조회가 가능하다", async () => {
    await getCompetitorComparison(1);
    expect(getCompetitorComparison).toHaveBeenCalledWith(1);
  });

  it("경쟁사 vs 우리 병원 시계열 트렌드를 조회할 수 있다", async () => {
    const result = await getCompetitorTrend(1, 8);
    expect(result).toHaveLength(3);
    expect(result[0].ourMentionRate).toBe(55);
    expect(result[2].ourMentionRate).toBe(65);
    expect(result[0].competitorRates["경쟁치과A"]).toBe(35);
  });

  it("트렌드에서 우리 병원 언급률이 상승 추세인지 확인할 수 있다", async () => {
    const result = await getCompetitorTrend(1, 8);
    const rates = result.map(r => r.ourMentionRate);
    // 55 → 60 → 65 상승 추세
    expect(rates[2]).toBeGreaterThan(rates[0]);
  });
});

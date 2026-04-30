import { describe, it, expect, vi } from "vitest";

// Mock db functions
vi.mock("./db", () => ({
  getHospitalProfileByUserId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    hospitalName: "테스트치과",
    hospitalUrl: "https://test-dental.com",
    specialty: "치과",
    region: "서울 강남",
  }),
  getDiagnosisHistoryByUrl: vi.fn().mockResolvedValue([
    { totalScore: 72, grade: "C", diagnosedAt: new Date().toISOString() },
    { totalScore: 65, grade: "D", diagnosedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() },
  ]),
  getSpecialtyStats: vi.fn().mockResolvedValue([
    { specialty: "치과", count: 15, avgScore: 68, avgAiScore: 55 },
  ]),
  getCurrentSeasonalRecommendations: vi.fn().mockResolvedValue({
    thisMonth: [
      { keyword: "봄 치아미백", priority: "high", category: "시술" },
      { keyword: "입학 교정상담", priority: "medium", category: "이벤트" },
    ],
    nextMonth: [
      { keyword: "여름 구강관리", priority: "low", category: "건강정보" },
    ],
  }),
}));

// Test auto-optimizer module
describe("auto-optimizer: generateOptimizationPlan", () => {
  it("should generate optimization plan from analysis result", async () => {
    const { generateOptimizationPlan } = await import("./lib/auto-optimizer");
    
    const mockResult = {
      url: "https://test-dental.com",
      analyzedAt: new Date().toISOString(),
      totalScore: 55,
      maxScore: 100,
      grade: "D",
      categories: [
        {
          name: "메타태그",
          score: 5,
          maxScore: 15,
          items: [
            {
              id: "meta-title",
              category: "메타태그",
              name: "타이틀 태그",
              status: "fail" as const,
              score: 0,
              maxScore: 5,
              detail: "타이틀 태그가 없습니다",
              recommendation: "타이틀 태그를 추가하세요",
              impact: "high",
            },
            {
              id: "meta-desc",
              category: "메타태그",
              name: "메타 설명",
              status: "warning" as const,
              score: 2,
              maxScore: 5,
              detail: "메타 설명이 너무 짧습니다",
              recommendation: "150자 이상으로 작성하세요",
              impact: "medium",
            },
            {
              id: "meta-viewport",
              category: "메타태그",
              name: "뷰포트",
              status: "pass" as const,
              score: 5,
              maxScore: 5,
              detail: "뷰포트가 올바르게 설정되어 있습니다",
              recommendation: "",
              impact: "low",
            },
          ],
        },
      ],
      summary: { passed: 1, warnings: 1, failed: 1 },
    };

    const plan = generateOptimizationPlan(mockResult);
    
    expect(plan).toBeDefined();
    expect(plan.url).toBe("https://test-dental.com");
    expect(plan.currentScore).toBe(55);
    expect(plan.estimatedNewScore).toBeGreaterThan(55);
    expect(plan.totalFixes).toBeGreaterThan(0);
    expect(plan.fixes.length).toBeGreaterThan(0);
    expect(plan.generatedAt).toBeDefined();
    
    // 각 fix에 필요한 필드가 있는지 확인
    const fix = plan.fixes[0];
    expect(fix.itemName).toBeDefined();
    expect(fix.category).toBeDefined();
    expect(fix.priority).toBeDefined();
    expect(fix.currentIssue).toBeDefined();
    expect(fix.fixDescription).toBeDefined();
  });

  it("should return empty fixes for perfect score", async () => {
    const { generateOptimizationPlan } = await import("./lib/auto-optimizer");
    
    const perfectResult = {
      url: "https://perfect-site.com",
      analyzedAt: new Date().toISOString(),
      totalScore: 100,
      maxScore: 100,
      grade: "A+",
      categories: [
        {
          name: "메타태그",
          score: 15,
          maxScore: 15,
          items: [
            {
              id: "meta-title",
              category: "메타태그",
              name: "타이틀 태그",
              status: "pass" as const,
              score: 5,
              maxScore: 5,
              detail: "완벽합니다",
              recommendation: "",
              impact: "high",
            },
          ],
        },
      ],
      summary: { passed: 1, warnings: 0, failed: 0 },
    };

    const plan = generateOptimizationPlan(perfectResult);
    expect(plan.totalFixes).toBe(0);
    expect(plan.fixes.length).toBe(0);
  });
});

// Test tRPC procedures
describe("34차: myHospitalExtended procedures", () => {
  it("getCompetitorPosition should return position data", async () => {
    const db = await import("./db");
    const profile = await db.getHospitalProfileByUserId(1);
    expect(profile).toBeDefined();
    expect(profile?.specialty).toBe("치과");
    
    const stats = await db.getSpecialtyStats();
    expect(stats.length).toBeGreaterThan(0);
    const mySpecialty = stats.find((s: any) => s.specialty === "치과");
    expect(mySpecialty).toBeDefined();
    expect(mySpecialty?.avgScore).toBe(68);
  });

  it("getMySeasonalKeywords should return seasonal data", async () => {
    const db = await import("./db");
    const data = await db.getCurrentSeasonalRecommendations("치과");
    expect(data).toBeDefined();
    expect(data.thisMonth.length).toBeGreaterThan(0);
    expect(data.thisMonth[0].keyword).toBe("봄 치아미백");
  });

  it("getDiagnosisHistoryByUrl should return history for comparison", async () => {
    const db = await import("./db");
    const history = await db.getDiagnosisHistoryByUrl("https://test-dental.com", 50);
    expect(history.length).toBe(2);
    expect(history[0].totalScore).toBe(72);
    expect(history[1].totalScore).toBe(65);
  });
});

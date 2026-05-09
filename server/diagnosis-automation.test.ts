/**
 * 진단 자동화 품질 게이트 v2 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  getDiagnosisAutomationConfig: vi.fn().mockResolvedValue({
    dailyThreshold: 10,
    autoSendEnabled: true,
    qualityMinScore: 30,
    qualityRequiredSections: JSON.stringify(["AI Citation", "Content Structure"]),
  }),
  getDailyDiagnosisCount: vi.fn().mockResolvedValue(15),
}));

import { checkDiagnosisAutomation } from "./diagnosis-automation";
import { getDiagnosisAutomationConfig, getDailyDiagnosisCount } from "./db";

const mockConfig = getDiagnosisAutomationConfig as unknown as ReturnType<typeof vi.fn>;
const mockCount = getDailyDiagnosisCount as unknown as ReturnType<typeof vi.fn>;

describe("Diagnosis Automation Quality Gates v2", () => {
  beforeEach(() => {
    mockConfig.mockResolvedValue({
      dailyThreshold: 10,
      autoSendEnabled: true,
      qualityMinScore: 30,
      qualityRequiredSections: JSON.stringify(["AI Citation", "Content Structure"]),
    });
    mockCount.mockResolvedValue(15);
  });

  const validReport = {
    totalScore: 65,
    maxScore: 100,
    categories: [
      { name: "AI Citation", score: 20, maxScore: 30 },
      { name: "Content Structure", score: 15, maxScore: 25 },
      { name: "Meta Tags", score: 10, maxScore: 20 },
      { name: "Performance", score: 20, maxScore: 25 },
    ],
  };

  it("모든 게이트 통과 시 passed=true, autoSendAllowed=true", async () => {
    const result = await checkDiagnosisAutomation(validReport);
    expect(result.passed).toBe(true);
    expect(result.autoSendAllowed).toBe(true);
    expect(result.gateResults).toHaveLength(5);
    expect(result.gateResults.every(g => g.passed)).toBe(true);
  });

  it("Gate 1: 최소 점수 미달 시 차단", async () => {
    const result = await checkDiagnosisAutomation({ ...validReport, totalScore: 20 });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "minimum_score")?.passed).toBe(false);
    expect(result.reasons).toContain("총점(20)이 최소 기준(30) 미만");
  });

  it("Gate 2: 필수 섹션 누락 시 차단", async () => {
    const result = await checkDiagnosisAutomation({
      ...validReport,
      categories: [
        { name: "Meta Tags", score: 30, maxScore: 50 },
        { name: "Performance", score: 20, maxScore: 25 },
        { name: "Other", score: 15, maxScore: 25 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "required_sections")?.passed).toBe(false);
  });

  it("Gate 3: 전체 0점 (분석 실패) 시 차단", async () => {
    const result = await checkDiagnosisAutomation({
      totalScore: 0,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 0, maxScore: 0 },
        { name: "Content Structure", score: 0, maxScore: 0 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "analysis_validity")?.passed).toBe(false);
  });

  it("Gate 4: 카테고리 수 부족 시 차단", async () => {
    const result = await checkDiagnosisAutomation({
      totalScore: 50,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 25, maxScore: 50 },
        { name: "Content Structure", score: 25, maxScore: 50 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "minimum_categories")?.passed).toBe(false);
  });

  it("Gate 5: 만점 의심 시 차단", async () => {
    const result = await checkDiagnosisAutomation({
      totalScore: 100,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 30, maxScore: 30 },
        { name: "Content Structure", score: 25, maxScore: 25 },
        { name: "Meta Tags", score: 20, maxScore: 20 },
        { name: "Performance", score: 25, maxScore: 25 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "anomaly_detection")?.passed).toBe(false);
  });

  it("Gate 5: 극단적 저점 시 차단", async () => {
    const result = await checkDiagnosisAutomation({
      totalScore: 3,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 1, maxScore: 30 },
        { name: "Content Structure", score: 1, maxScore: 25 },
        { name: "Meta Tags", score: 1, maxScore: 20 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "anomaly_detection")?.passed).toBe(false);
  });

  it("threshold 미만이면 autoSendAllowed=false (수동 검토 모드)", async () => {
    mockCount.mockResolvedValue(5); // threshold(10) 미만
    const result = await checkDiagnosisAutomation(validReport);
    expect(result.passed).toBe(true);
    expect(result.autoSendAllowed).toBe(false); // 품질은 통과했지만 자동발송 불가
  });

  it("autoSendEnabled=false이면 항상 autoSendAllowed=false", async () => {
    mockConfig.mockResolvedValue({
      dailyThreshold: 10,
      autoSendEnabled: false,
      qualityMinScore: 30,
      qualityRequiredSections: "[]",
    });
    const result = await checkDiagnosisAutomation(validReport);
    expect(result.passed).toBe(true);
    expect(result.autoSendAllowed).toBe(false);
  });

  it("gateResults에 5개 게이트 모두 포함", async () => {
    const result = await checkDiagnosisAutomation(validReport);
    const gates = result.gateResults.map(g => g.gate);
    expect(gates).toContain("minimum_score");
    expect(gates).toContain("required_sections");
    expect(gates).toContain("analysis_validity");
    expect(gates).toContain("minimum_categories");
    expect(gates).toContain("anomaly_detection");
  });
});

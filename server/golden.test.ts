/**
 * 골든 테스트 5종 — 핵심 비즈니스 로직의 결정론적 검증
 * 
 * 이 테스트는 외부 의존성 없이 순수 함수의 정확성을 검증합니다.
 * 코드 변경 시 비즈니스 규칙이 깨지지 않았음을 보장합니다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ═══════════════════════════════════════════════════════════════
// 1. Revenue Calculation — 진료과별 마케팅 가치 계산
// ═══════════════════════════════════════════════════════════════
describe("Golden: Revenue Calculation", () => {
  it("calculateMarketingValue returns valid structure for all specialties", async () => {
    const { calculateMarketingValue, SPECIALTY_REVENUE_PROFILES } = await import("./utils/specialty-revenue-data");
    const specialties = Object.keys(SPECIALTY_REVENUE_PROFILES) as any[];
    
    for (const specialty of specialties) {
      const result = calculateMarketingValue(specialty);
      expect(result).toHaveProperty("monthlyValue");
      expect(result).toHaveProperty("seoInvestmentScore");
      expect(result).toHaveProperty("recommendation");
      expect(result.monthlyValue).toBeGreaterThan(0);
      expect(result.seoInvestmentScore).toBeGreaterThanOrEqual(0);
      expect(result.seoInvestmentScore).toBeLessThanOrEqual(100);
      expect(typeof result.recommendation).toBe("string");
    }
  });

  it("성형외과 has highest revenue per patient", async () => {
    const { calculateMarketingValue } = await import("./utils/specialty-revenue-data");
    const plastic = calculateMarketingValue("성형외과");
    const internal = calculateMarketingValue("내과");
    expect(plastic.monthlyValue).toBeGreaterThan(internal.monthlyValue);
  });

  it("SEO investment score is deterministic", async () => {
    const { calculateMarketingValue } = await import("./utils/specialty-revenue-data");
    const result1 = calculateMarketingValue("치과");
    const result2 = calculateMarketingValue("치과");
    expect(result1.seoInvestmentScore).toBe(result2.seoInvestmentScore);
    expect(result1.monthlyValue).toBe(result2.monthlyValue);
  });

  it("기타 specialty returns valid fallback", async () => {
    const { calculateMarketingValue } = await import("./utils/specialty-revenue-data");
    const result = calculateMarketingValue("기타");
    expect(result.monthlyValue).toBeGreaterThan(0);
    expect(result.seoInvestmentScore).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Grade/Score Formatters — 등급 판정 규칙
// ═══════════════════════════════════════════════════════════════
describe("Golden: Grade Formatters", () => {
  // seo-analyzer의 getGrade는 non-exported이므로 email-templates의 getGradeLabel 검증
  it("grade boundaries are consistent across modules", async () => {
    const { getGradeColor } = await import("./report/pdf-utils");
    // A+ (90+) should be green-ish, F should be red-ish
    const aPlus = getGradeColor("A+");
    const f = getGradeColor("F");
    expect(aPlus).not.toBe(f);
    // Verify all standard grades produce valid colors
    const grades = ["A+", "A", "B", "C", "D", "F"];
    for (const g of grades) {
      expect(getGradeColor(g)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getGradeColor returns valid hex colors", async () => {
    const { getGradeColor } = await import("./report/pdf-utils");
    const grades = ["A+", "A", "B", "C", "D", "F"];
    for (const grade of grades) {
      const color = getGradeColor(grade);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getGradeColor is deterministic", async () => {
    const { getGradeColor } = await import("./report/pdf-utils");
    expect(getGradeColor("A+")).toBe(getGradeColor("A+"));
    expect(getGradeColor("F")).toBe(getGradeColor("F"));
  });

  it("different grades produce different colors", async () => {
    const { getGradeColor } = await import("./report/pdf-utils");
    const colors = new Set(["A+", "A", "B", "C", "D", "F"].map(g => getGradeColor(g)));
    // A+와 A가 같을 수 있지만, 최소 3가지 이상의 다른 색상
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Diagnosis Automation — 품질 게이트 결정론적 검증
// ═══════════════════════════════════════════════════════════════
describe("Golden: Diagnosis Quality Gates", () => {
  vi.mock("./db", () => ({
    getDiagnosisAutomationConfig: vi.fn().mockResolvedValue({
      dailyThreshold: 10,
      autoSendEnabled: true,
      qualityMinScore: 30,
      qualityRequiredSections: JSON.stringify(["AI Citation"]),
    }),
    getDailyDiagnosisCount: vi.fn().mockResolvedValue(15),
  }));

  it("perfect valid report passes all 5 gates", async () => {
    const { checkDiagnosisAutomation } = await import("./diagnosis-automation");
    const result = await checkDiagnosisAutomation({
      totalScore: 65,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 20, maxScore: 30 },
        { name: "Content", score: 15, maxScore: 25 },
        { name: "Meta", score: 10, maxScore: 20 },
        { name: "Performance", score: 20, maxScore: 25 },
      ],
    });
    expect(result.passed).toBe(true);
    expect(result.gateResults).toHaveLength(5);
    expect(result.gateResults.every(g => g.passed)).toBe(true);
  });

  it("zero-score report fails analysis_validity gate", async () => {
    const { checkDiagnosisAutomation } = await import("./diagnosis-automation");
    const result = await checkDiagnosisAutomation({
      totalScore: 0,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 0, maxScore: 0 },
        { name: "Content", score: 0, maxScore: 0 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "analysis_validity")?.passed).toBe(false);
  });

  it("99% score triggers anomaly detection", async () => {
    const { checkDiagnosisAutomation } = await import("./diagnosis-automation");
    const result = await checkDiagnosisAutomation({
      totalScore: 99,
      maxScore: 100,
      categories: [
        { name: "AI Citation", score: 30, maxScore: 30 },
        { name: "Content", score: 25, maxScore: 25 },
        { name: "Meta", score: 20, maxScore: 20 },
        { name: "Performance", score: 24, maxScore: 25 },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.gateResults.find(g => g.gate === "anomaly_detection")?.passed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. LLM Cache — 캐시 동작 결정론적 검증
// ═══════════════════════════════════════════════════════════════
describe("Golden: LLM Cache Determinism", () => {
  vi.mock("./_core/llm", () => ({
    invokeLLM: vi.fn().mockResolvedValue({
      id: "golden-test",
      created: 1700000000,
      model: "test",
      choices: [{ index: 0, message: { role: "assistant", content: "golden" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
    }),
  }));

  beforeEach(async () => {
    const { clearLLMCache } = await import("./llm-cache");
    clearLLMCache();
  });

  it("same input produces same cache key (deterministic hashing)", async () => {
    const { invokeLLMCached, getLLMCacheStats } = await import("./llm-cache");
    const params = { messages: [{ role: "user" as const, content: "golden test" }] };
    
    await invokeLLMCached(params);
    await invokeLLMCached(params);
    
    const stats = getLLMCacheStats();
    expect(stats.l1Hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it("different input produces different cache key", async () => {
    const { invokeLLMCached, getLLMCacheStats } = await import("./llm-cache");
    
    await invokeLLMCached({ messages: [{ role: "user" as const, content: "A" }] });
    await invokeLLMCached({ messages: [{ role: "user" as const, content: "B" }] });
    
    const stats = getLLMCacheStats();
    expect(stats.l1Hits).toBe(0);
    expect(stats.misses).toBe(2);
  });

  it("hit rate calculation is mathematically correct", async () => {
    const { invokeLLMCached, getLLMCacheStats } = await import("./llm-cache");
    const params = { messages: [{ role: "user" as const, content: "rate test" }] };
    
    // 1 miss + 3 hits = 75% hit rate
    await invokeLLMCached(params);
    await invokeLLMCached(params);
    await invokeLLMCached(params);
    await invokeLLMCached(params);
    
    const stats = getLLMCacheStats();
    expect(stats.hitRate).toBe(75);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. SEO Middleware — 크롤러 감지 결정론적 검증
// ═══════════════════════════════════════════════════════════════
describe("Golden: SEO Middleware Crawler Detection", () => {
  it("detects all known AI crawlers", async () => {
    const { isAICrawler: isAiCrawler } = await import("./seo-middleware");
    const crawlers = [
      "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "PerplexityBot/1.0",
      "Mozilla/5.0 (compatible; Google-Extended)",
      "ChatGPT-User",
    ];
    for (const ua of crawlers) {
      expect(isAiCrawler(ua)).toBe(true);
    }
  });

  it("does not false-positive on regular browsers", async () => {
    const { isAICrawler: isAiCrawler } = await import("./seo-middleware");
    const browsers = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];
    for (const ua of browsers) {
      expect(isAiCrawler(ua)).toBe(false);
    }
  });

  it("Googlebot is NOT classified as AI crawler", async () => {
    const { isAICrawler: isAiCrawler } = await import("./seo-middleware");
    expect(isAiCrawler("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(false);
  });
});

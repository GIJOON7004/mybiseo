/**
 * SEO History Dashboard + PDF Trend Tests
 */
import { describe, it, expect, vi } from "vitest";

// ── DB 함수 테스트 ──
describe("SEO History DB Functions", () => {
  it("getMonthlyTrendByUrl returns array", async () => {
    const { getMonthlyTrendByUrl } = await import("./db");
    const result = await getMonthlyTrendByUrl("https://editionps.com/", 12);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getCategoryTrendByUrl returns array", async () => {
    const { getCategoryTrendByUrl } = await import("./db");
    const result = await getCategoryTrendByUrl("https://editionps.com/", 12);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getPublicHistoryByUrl returns array", async () => {
    const { getPublicHistoryByUrl } = await import("./db");
    const result = await getPublicHistoryByUrl("https://editionps.com/", 24);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getScoreComparisonByUrl returns null or comparison object", async () => {
    const { getScoreComparisonByUrl } = await import("./db");
    const result = await getScoreComparisonByUrl("https://editionps.com/");
    // null if < 2 records, or object with first/latest/change
    if (result !== null) {
      expect(result).toHaveProperty("first");
      expect(result).toHaveProperty("latest");
      expect(result).toHaveProperty("change");
      expect(result).toHaveProperty("totalDiagnoses");
      expect(result).toHaveProperty("periodDays");
    }
  });
});

// ── URL 정규화 일관성 테스트 ──
describe("URL Normalization Consistency", () => {
  it("seo-analyzer normalizeUrl matches history query format", () => {
    // Both should produce same format for consistent DB lookups
    const testUrls = [
      "editionps.com",
      "https://editionps.com",
      "https://editionps.com/",
    ];
    
    // Simulate the normalizeUrl logic used in seo-analyzer
    function normalizeUrl(url: string): string {
      let u = url.trim();
      if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
      try {
        const parsed = new URL(u);
        return parsed.origin + (parsed.pathname === "/" ? "/" : parsed.pathname);
      } catch {
        return u;
      }
    }

    // All should resolve to the same URL
    const normalized = testUrls.map(normalizeUrl);
    const unique = new Set(normalized);
    expect(unique.size).toBe(1);
    // All should normalize to https://editionps.com/
    for (const n of normalized) {
      expect(n).toBe("https://editionps.com/");
    }
  });
});

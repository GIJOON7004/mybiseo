/**
 * search-screenshot.test.ts
 * 검색 결과 스크린샷 캡처 안정성 + 이메일 연동 테스트
 *
 * 보고서 리디자인: PDF 스크린샷 페이지 제거, 차분한 진단 보고서 톤으로 전환
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ── 1. 스크린샷 모듈 기본 검증 ──
describe("SearchScreenshot module exports", () => {
  it("should export captureSearchScreenshots function", async () => {
    const mod = await import("./search-screenshot");
    expect(typeof mod.captureSearchScreenshots).toBe("function");
  });

  it("should export SearchScreenshot and SearchScreenshotResult types via function signature", async () => {
    const mod = await import("./search-screenshot");
    // Function accepts keywords, engines, maxKeywords
    expect(mod.captureSearchScreenshots.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 2. 빈 입력 처리 (graceful degradation) ──
describe("SearchScreenshot graceful degradation", () => {
  it("should handle empty keywords array gracefully", async () => {
    const mod = await import("./search-screenshot");
    const result = await mod.captureSearchScreenshots([], ["naver"], 2);
    expect(result.screenshots).toEqual([]);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("should handle whitespace-only keywords gracefully", async () => {
    const mod = await import("./search-screenshot");
    const result = await mod.captureSearchScreenshots(["  ", "   "], ["naver"], 2);
    expect(result.screenshots).toEqual([]);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("should respect maxKeywords limit", async () => {
    const mod = await import("./search-screenshot");
    // Even if we pass 10 keywords, maxKeywords=0 should return empty
    const result = await mod.captureSearchScreenshots(
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
      ["naver"],
      0,
    );
    expect(result.screenshots).toEqual([]);
  });
});

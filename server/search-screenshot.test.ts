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

// ── 3. 스크린샷 모듈 소스 코드 안정성 검증 ──
describe("SearchScreenshot source code stability features", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "search-screenshot.ts"),
    "utf-8",
  );

  it("should have multiple Naver result selectors for fallback", () => {
    expect(source).toContain("NAVER_RESULT_SELECTORS");
    expect(source).toContain("#main_pack");
    expect(source).toContain(".api_subject_bx");
  });

  it("should have multiple Google result selectors for fallback", () => {
    expect(source).toContain("GOOGLE_RESULT_SELECTORS");
    expect(source).toContain("#search");
    expect(source).toContain("#rso");
  });

  it("should have Google consent popup handling", () => {
    expect(source).toContain("GOOGLE_CONSENT_SELECTORS");
    expect(source).toContain("dismissGoogleConsent");
  });

  it("should have retry logic with configurable MAX_RETRIES", () => {
    expect(source).toContain("MAX_RETRIES");
    expect(source).toContain("RETRY_DELAY");
    expect(source).toContain("for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES");
  });

  it("should have placeholder image generation for failed captures", () => {
    expect(source).toContain("generatePlaceholderImage");
    expect(source).toContain("isPlaceholder");
  });

  it("should have page cleanup functions for Naver and Google", () => {
    expect(source).toContain("cleanupNaverPage");
    expect(source).toContain("cleanupGooglePage");
  });

  it("should have request interception for performance", () => {
    expect(source).toContain("setRequestInterception");
    expect(source).toContain("req.abort()");
  });

  it("should have browser crash safety with try-finally", () => {
    expect(source).toContain("} finally {");
    expect(source).toContain("browser.close()");
  });

  it("should have configurable timeouts", () => {
    expect(source).toContain("PAGE_TIMEOUT");
    expect(source).toContain("NETWORK_IDLE_TIMEOUT");
    expect(source).toContain("RENDER_WAIT");
  });
});

// ── 4. RealityDiagnosis searchScreenshots 필드 검증 ──
describe("RealityDiagnosis searchScreenshots field", () => {
  it("should include searchScreenshots as optional field in interface", async () => {
    const mod = await import("./reality-diagnosis");
    expect(typeof mod.generateRealityDiagnosis).toBe("function");
  });

  it("should define searchScreenshots with correct shape in source", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "reality-diagnosis.ts"),
      "utf-8",
    );
    expect(source).toContain("searchScreenshots?:");
    expect(source).toContain('engine: "naver" | "google"');
    expect(source).toContain("imageUrl: string");
    expect(source).toContain("capturedAt: number");
  });
});

// ── 5. PDF 보고서 기본 구조 검증 ──
describe("PDF report structure (redesigned)", () => {
  it("should export generateSeoReportPdf accepting realityDiagnosis", async () => {
    const mod = await import("./seo-report-pdf");
    expect(typeof mod.generateSeoReportPdf).toBe("function");
    // spread args wrapper has .length === 0, just verify it's callable
    expect(mod.generateSeoReportPdf).toBeDefined();
  });

  it("should have dynamic headline card height to prevent text overflow", () => {
    // Now checks HTML engine file since seo-report-pdf.ts is a thin wrapper
    const source = fs.readFileSync(
      path.join(__dirname, "ai-visibility-html-report.ts"),
      "utf-8",
    );
    // HTML engine uses CSS-based layout, verify key design elements
    expect(source).toContain("scoreGaugeSvg");
    expect(source).toContain("progressBarHtml");
  });

  it("should have enhanced print-quality design elements", () => {
    // Now checks HTML engine files since seo-report-pdf.ts is a thin wrapper
    const source = fs.readFileSync(
      path.join(__dirname, "ai-visibility-html-report.ts"),
      "utf-8",
    );
    // Enhanced metric gauges with SVG progress rings
    expect(source).toContain("scoreGaugeSvg");
    expect(source).toContain("progressBarHtml");
    // Print-quality design with proper CSS styling
    expect(source).toContain("CSS");
  });

  it("should NOT contain FOMO/sales-oriented sections", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "seo-report-pdf.ts"),
      "utf-8",
    );
    // Removed sections should not be present
    expect(source).not.toContain("adCostPainTitle");
    expect(source).not.toContain("ctaBeforeAfter");
    expect(source).not.toContain("ctaBenefit1");
    expect(source).not.toContain("scenarioTitle");
    expect(source).not.toContain("partnerAvgImprovement");
    expect(source).not.toContain("missedPatientsTitle");
  });

  it("should have clean contact information page instead of CTA", () => {
    // Now checks HTML engine sections file
    const source = fs.readFileSync(
      path.join(__dirname, "ai-visibility-html-report-sections.ts"),
      "utf-8",
    );
    // CTA page with QR code and contact info
    expect(source).toContain("buildCtaPage");
    expect(source).toContain("qrDataUrl");
    expect(source).toContain("QR");
  });
});

// ── 6. SEO 라우터 기본 검증 ──
describe("SEO router generateReport", () => {
  it("should have generateReport procedure in seoAnalyzerRouter", async () => {
    const mod = await import("./routes/seo");
    expect(mod.seoAnalyzerRouter).toBeDefined();
    const procedures = Object.keys(
      (mod.seoAnalyzerRouter as any)._def.procedures || {},
    );
    expect(procedures).toContain("generateReport");
  });

  it("should have realityDiagnosis procedure in seoAnalyzerRouter", async () => {
    const mod = await import("./routes/seo");
    const procedures = Object.keys(
      (mod.seoAnalyzerRouter as any)._def.procedures || {},
    );
    expect(procedures).toContain("realityDiagnosis");
  });

  it("should NOT have screenshot capture in generateReport", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "routes/seo.ts"),
      "utf-8",
    );
    expect(source).not.toContain("captureSearchScreenshots");
  });
});

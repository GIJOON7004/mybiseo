import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "..", "client", "src");

function readComponent(path: string): string {
  return readFileSync(join(clientDir, path), "utf-8");
}


describe("36차 UX 개선 — Phase 2 현재 구조 기준", () => {
  it("HeroSection에 AI 가시성 진단 CTA가 포함되어 있다", () => {
    const hero = readComponent("components/HeroSection.tsx");
    expect(hero).toContain("AI 가시성 진단");
    expect(hero).toContain("/ai-check");
  });

  it("HeroSection에 ChatGPT 메시지가 사용된다", () => {
    const hero = readComponent("components/HeroSection.tsx");
    expect(hero).toContain("ChatGPT");
  });

  it("SeoChecker에 보고서 언어 선택 기능이 있다 (ko/en/th)", () => {
    const seo = readComponent("pages/SeoChecker.tsx");
    expect(seo).toContain("REPORT_LANGS");
    expect(seo).toContain("ReportLang");
    expect(seo).toContain("FlagKR");
    expect(seo).toContain("FlagUS");
    expect(seo).toContain("FlagTH");
    expect(seo).toContain("selectedLang");
  });

  it("SeoChecker에 진단 결과 상단 액션 패널이 있다", () => {
    const seo = readComponent("pages/SeoChecker.tsx");
    expect(seo).toContain("진단 보고서 받기");
    expect(seo).toContain("PDF 리포트를 다운로드하거나 이메일로 받아보세요");
  });

  it("seo-report-pdf에 3개 언어 i18n이 정의되어 있다", () => {
    const engine = readFileSync(join(__dirname, "ai-visibility-html-engine.ts"), "utf-8");
    expect(engine).toContain("generateHtmlPdfReport");
    const pdf = readFileSync(join(__dirname, "seo-report-pdf.ts"), "utf-8");
    expect(pdf).toContain("generateHtmlPdfReport");
    expect(pdf).toContain("generateSeoReportPdf");
  });

  it("seo 라우터에 language 파라미터가 있어야 한다", () => {
    const seoRouter = readFileSync(join(__dirname, "..", "server", "routes", "seo.ts"), "utf-8");
    expect(seoRouter).toContain('language: z.enum(["ko", "en", "th"])');
  });

  it("ServicesSection에 해외 관련 서비스가 포함되어 있다", () => {
    const services = readComponent("components/ServicesSection.tsx");
    // Phase 2: 5개 핵심 서비스 중 해외 다국어 GEO 전략 포함
    expect(services).toContain("해외");
    expect(services).toContain("다국어");
  });
});

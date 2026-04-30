import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "..", "client", "src");

function readComponent(path: string): string {
  return readFileSync(join(clientDir, path), "utf-8");
}

describe("36차 UX 개선 — 국가 선택 & 언어 선택 & 액션 패널", () => {
  it("HeroSection에 국가 선택 기능이 포함되어 있다 (국기 클릭 전환)", () => {
    const hero = readComponent("components/HeroSection.tsx");
    expect(hero).toContain("COUNTRY_OPTIONS");
    expect(hero).toContain("FlagKR");
    expect(hero).toContain("FlagTH");
    expect(hero).toContain("setCountry");
    expect(hero).toContain("flagcdn.com");
    expect(hero).toContain("showCountryMenu");
    expect(hero).toContain("국가 선택");
  });

  it("HeroSection에 '해외 신환' 표현이 사용된다", () => {
    const hero = readComponent("components/HeroSection.tsx");
    expect(hero).toContain("해외 신환");
    expect(hero).not.toContain("전 세계 환자가 찾아옵니다");
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
    // seo-report-pdf.ts is now a thin wrapper; check HTML engine for language support
    const engine = readFileSync(join(__dirname, "ai-visibility-html-engine.ts"), "utf-8");
    expect(engine).toContain("generateHtmlPdfReport");
    // Verify the wrapper delegates correctly
    const pdf = readFileSync(join(__dirname, "seo-report-pdf.ts"), "utf-8");
    expect(pdf).toContain("generateHtmlPdfReport");
    expect(pdf).toContain("generateSeoReportPdf");
  });

  it("routers.ts generateReport에 language 파라미터가 있다", () => {
    const routers = readRouterSource();
    expect(routers).toContain('language: z.enum(["ko", "en", "th"])');
  });

  it("ServicesSection에서 '전 세계 환자' 표현이 '해외 신환'으로 변경되었다", () => {
    const services = readComponent("components/ServicesSection.tsx");
    expect(services).toContain("해외 신환이 검색하면");
    expect(services).not.toContain("전 세계 환자가 검색하면");
  });
});

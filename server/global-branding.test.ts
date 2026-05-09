import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "..", "client", "src");

function readComponent(path: string): string {
  return readFileSync(join(clientDir, path), "utf-8");
}

describe("글로벌 리브랜딩 — 메시징 일관성 (Phase 2)", () => {
  it("HeroSection에 AI 검색 관련 메시지가 포함되어 있다", () => {
    const hero = readComponent("components/HeroSection.tsx");
    expect(hero).toContain("ChatGPT");
    expect(hero).toContain("AI 가시성 진단");
  });

  it("GlobalOpportunitySection 레거시 파일이 존재한다", () => {
    expect(existsSync(join(clientDir, "components", "GlobalOpportunitySection.tsx"))).toBe(true);
  });

  it("ServicesSection에 AI 검색 메시지가 포함되어 있다", () => {
    const services = readComponent("components/ServicesSection.tsx");
    expect(services).toContain("AI");
  });

  it("TechSection에 기술 포지셔닝이 반영되어 있다", () => {
    const tech = readComponent("components/TechSection.tsx");
    expect(tech).toContain("AI");
  });

  it("WhyAINative 레거시 파일에 AI 검색 메시지가 포함되어 있다", () => {
    const why = readComponent("components/WhyAINative.tsx");
    expect(why).toContain("AI 검색");
    expect(why).toContain("Perplexity");
    expect(why).toContain("Grok");
  });

  it("Footer에 브랜드 포지셔닝이 반영되어 있다", () => {
    const footer = readComponent("components/Footer.tsx");
    expect(footer).toContain("AI");
    expect(footer).toContain("의료 마케팅");
  });

  it("ContactSection 레거시 파일에 AI 검색 노출이 포함되어 있다", () => {
    const contact = readComponent("components/ContactSection.tsx");
    expect(contact).toContain("AI 검색 노출");
  });

  it("PriceCompareSection에 AI 검색 최적화가 포함되어 있다", () => {
    const price = readComponent("components/PriceCompareSection.tsx");
    expect(price).toContain("AI 검색 최적화");
  });

  it("SeoChecker에 AI 포지셔닝이 반영되어 있다", () => {
    const seo = readComponent("pages/SeoChecker.tsx");
    expect(seo).toContain("AI");
  });

  it("SpecialtyLanding 파일이 삭제되었다 (성능 최적화로 제거)", () => {
    expect(existsSync(join(clientDir, "pages", "SpecialtyLanding.tsx"))).toBe(false);
  });

  it("index.html 메타태그에 의료 마케팅이 반영되어 있다", () => {
    const html = readFileSync(join(__dirname, "..", "client", "index.html"), "utf-8");
    expect(html).toContain("의료 마케팅");
  });
});

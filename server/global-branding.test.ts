import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "..", "client", "src");

function readComponent(path: string): string {
  return readFileSync(join(clientDir, path), "utf-8");
}

describe("글로벌 리브랜딩 — 메시징 일관성", () => {
  it("HeroSection에 글로벌 표준 메시지가 포함되어 있다", () => {
    const hero = readComponent("components/HeroSection.tsx");
    expect(hero).toContain("Global Standard Medical Marketing Platform");
    expect(hero).toContain("해외 신환");
  });

  it("GlobalOpportunitySection이 외국인 환자 데이터를 포함한다", () => {
    const section = readComponent("components/GlobalOpportunitySection.tsx");
    expect(section).toContain("117");
    expect(section).toContain("93.2");
    expect(section).toContain("640");
  });

  it("ServicesSection에 AI 검색 메시지가 포함되어 있다", () => {
    const services = readComponent("components/ServicesSection.tsx");
    expect(services).toContain("AI 검색");
  });

  it("TechSection에 기술 포지셔닝이 반영되어 있다", () => {
    const tech = readComponent("components/TechSection.tsx");
    expect(tech).toContain("AI");
  });

  it("WhyAINative에 AI 검색 메시지가 포함되어 있다", () => {
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

  it("ContactSection에 AI 검색 노출이 포함되어 있다", () => {
    const contact = readComponent("components/ContactSection.tsx");
    expect(contact).toContain("AI 검색 노출");
  });

  it("PriceCompareSection에 AI 검색과 의료관광이 포함되어 있다", () => {
    const price = readComponent("components/PriceCompareSection.tsx");
    expect(price).toContain("AI 검색");
    expect(price).toContain("의료관광");
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

  it("GlobalOpportunitySection 컴포넌트 파일이 존재한다", () => {
    const section = readComponent("components/GlobalOpportunitySection.tsx");
    expect(section).toContain("GlobalOpportunitySection");
  });
});

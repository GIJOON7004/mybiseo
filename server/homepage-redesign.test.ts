import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function readComponent(name: string): string {
  return readFileSync(resolve(__dirname, `../client/src/components/${name}`), "utf-8");
}

function readPage(name: string): string {
  return readFileSync(resolve(__dirname, `../client/src/pages/${name}`), "utf-8");
}

describe("메인 페이지 Phase 2 전면 개편 검증", () => {

  describe("ServicesSection — 5개 핵심 서비스 카드", () => {
    let code: string;
    beforeAll(() => { code = readComponent("ServicesSection.tsx"); });

    it("5개 핵심 서비스 키워드 포함", () => {
      expect(code).toContain("AI Visibility Engine");
      expect(code).toContain("Reputation Defense");
      expect(code).toContain("AI Learning Hub");
      expect(code).toContain("Smart Website");
      expect(code).toContain("Patient Communication");
    });

    it("서비스 카드에 href 또는 Link 연결 포함", () => {
      expect(code).toContain("href");
    });
  });

  describe("Home.tsx — Phase 2 섹션 배치 순서", () => {
    let code: string;
    beforeAll(() => { code = readPage("Home.tsx"); });

    it("불필요 섹션 삭제: WhyAINative, GlobalOpportunitySection, ReportSampleSection 제거", () => {
      expect(code).not.toContain("WhyAINative");
      expect(code).not.toContain("GlobalOpportunitySection");
      expect(code).not.toContain("ReportSampleSection");
    });

    it("불필요 섹션 삭제: ProcessSection, ROICalculator, RoadmapSection, ContactSection, EmpathySection 제거", () => {
      expect(code).not.toContain("ProcessSection");
      expect(code).not.toContain("ROICalculator");
      expect(code).not.toContain("RoadmapSection");
      expect(code).not.toContain("ContactSection");
      expect(code).not.toContain("EmpathySection");
    });

    it("핵심 섹션 포함: Stakes, Services, Timeline, PriceCompare, Tech, Results, Pricing, CEO, FAQ, FooterCTA", () => {
      expect(code).toContain("StakesSection");
      expect(code).toContain("ServicesSection");
      expect(code).toContain("TimelineSection");
      expect(code).toContain("PriceCompareSection");
      expect(code).toContain("TechSection");
      expect(code).toContain("ResultsSection");
      expect(code).toContain("PricingSection");
      expect(code).toContain("CEOSection");
      expect(code).toContain("FAQSection");
      expect(code).toContain("FooterCTASection");
    });
  });

  describe("PriceCompareSection — 3카테고리 비교표", () => {
    let code: string;
    beforeAll(() => { code = readComponent("PriceCompareSection.tsx"); });

    it("MY비서 vs 일반 에이전시 vs 일반 검색 도구 3카테고리 비교", () => {
      expect(code).toContain("MY비서");
      expect(code).toContain("일반 에이전시");
      expect(code).toContain("일반 검색 도구");
    });

    it("핵심 서비스 항목 포함", () => {
      expect(code).toContain("AI 검색 최적화");
      expect(code).toContain("24시간 AI 환자 상담");
      expect(code).toContain("의료법 컴플라이언스");
    });

    it("경쟁사 실명 없음", () => {
      expect(code).not.toContain("세마포어");
      expect(code).not.toContain("아이보스");
      expect(code).not.toContain("리얼클릭");
    });
  });

  describe("TimelineSection — 원장의 한 달", () => {
    let code: string;
    beforeAll(() => { code = readComponent("TimelineSection.tsx"); });

    it("매일/매주/매월/분기 4단계 타임라인", () => {
      expect(code).toContain("매일");
      expect(code).toContain("매주");
      expect(code).toContain("매월");
      expect(code).toContain("분기");
    });

    it("진료에만 집중 메시지 포함", () => {
      expect(code).toContain("진료에만 집중");
    });
  });

  describe("PricingSection — 맞춤 견적 CTA", () => {
    let code: string;
    beforeAll(() => { code = readComponent("PricingSection.tsx"); });

    it("가격 비공개 + 맞춤 견적 CTA 구조", () => {
      expect(code).toContain("맞춤 견적을 받아보세요");
    });

    it("3단계 프로세스: 진단 → 설계 → 확인", () => {
      expect(code).toContain("무료 AI 가시성 진단");
      expect(code).toContain("맞춤 전략 설계");
      expect(code).toContain("성과 확인 후 결정");
    });

    it("왜 가격을 안내하지 않는지 설명 포함", () => {
      expect(code).toContain("왜 가격을 바로 안내하지 않나요");
    });
  });

  describe("FooterCTASection — 마지막 전환 기회", () => {
    let code: string;
    beforeAll(() => { code = readComponent("FooterCTASection.tsx"); });

    it("무료 AI 가시성 진단 CTA 포함", () => {
      expect(code).toContain("무료 AI 가시성 진단 받기");
    });

    it("30초 소요 안내 포함", () => {
      expect(code).toContain("30초");
    });
  });

  describe("TechSection — 기술력/차별화 강조", () => {
    let code: string;
    beforeAll(() => { code = readComponent("TechSection.tsx"); });

    it("기술력 관련 키워드 포함", () => {
      const hasAI = code.includes("AI") || code.includes("인공지능");
      const hasTech = code.includes("기술") || code.includes("엔진") || code.includes("자동화");
      expect(hasAI && hasTech).toBe(true);
    });
  });

  describe("StakesSection — 위기/수혜 데이터", () => {
    let code: string;
    beforeAll(() => { code = readComponent("StakesSection.tsx"); });

    it("출처 명시 포함", () => {
      const hasSource = code.includes("WebFX") || code.includes("Seer Interactive") || code.includes("Gartner");
      expect(hasSource).toBe(true);
    });

    it("CTA 전환 메시지 포함", () => {
      expect(code).toContain("시작하면");
    });
  });

  describe("Navbar — AI 최적화 진단 텍스트", () => {
    let code: string;
    beforeAll(() => { code = readComponent("Navbar.tsx"); });

    it("AI 최적화 진단 텍스트 포함", () => {
      expect(code).toContain("AI 최적화 진단");
    });
  });
});

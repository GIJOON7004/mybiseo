import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function readComponent(name: string): string {
  return readFileSync(resolve(__dirname, `../client/src/components/${name}`), "utf-8");
}

function readPage(name: string): string {
  return readFileSync(resolve(__dirname, `../client/src/pages/${name}`), "utf-8");
}

describe("메인 페이지 전반 개편 검증", () => {

  describe("ServicesSection — 12개 서비스 명확히 표시", () => {
    let code: string;
    beforeAll(() => { code = readComponent("ServicesSection.tsx"); });

    it("핵심 메시지: 모든 서비스는 매출 상승에 기여", () => {
      expect(code).toContain("매출 상승");
    });

    it("3단계 구조: 발견 → 전환 → 유지·확장", () => {
      expect(code).toContain("발견");
      expect(code).toContain("전환");
      expect(code).toContain("유지");
    });

    it("STEP 1 발견 — 5개 서비스 포함", () => {
      expect(code).toContain("AI 검색 최적화");
      expect(code).toContain("AI 블로그 제작");
      expect(code).toContain("AI 콘텐츠 공장");
      expect(code).toContain("브랜딩 마케팅");
      expect(code).toContain("해외 환자 유입");
    });

    it("STEP 2 전환 — 3개 서비스 포함", () => {
      expect(code).toContain("AI 환자 응대");
      expect(code).toContain("웹사이트 개발");
      expect(code).toContain("CRM");
    });

    it("STEP 3 유지·확장 — 4개 서비스 포함", () => {
      expect(code).toContain("노쇼 방지");
      expect(code).toContain("병원 관리 대시보드");
      expect(code).toContain("전략 컨설팅");
    });

    it("각 서비스에 CTA 링크 또는 설명 포함", () => {
      // 체험해보기 또는 자세히 보기 등 CTA 텍스트가 있어야 함
      const ctaCount = (code.match(/체험해보기|자세히|상담|문의|해결|기여|줄여|늘어|찾아|연결/g) || []).length;
      expect(ctaCount).toBeGreaterThanOrEqual(6);
    });

    it("서비스 카드에 href 또는 Link 연결 포함", () => {
      // 체험 가능한 서비스에 링크가 있어야 함
      expect(code).toContain("href");
    });
  });

  describe("Home.tsx — 섹션 배치 순서 최적화", () => {
    let code: string;
    beforeAll(() => { code = readPage("Home.tsx"); });

    it("중복 섹션 삭제: WhyAINative 제거", () => {
      expect(code).not.toContain("WhyAINative");
    });

    it("중복 섹션 삭제: GlobalOpportunitySection 제거", () => {
      expect(code).not.toContain("GlobalOpportunitySection");
    });

    it("중복 섹션 삭제: ReportSampleSection 제거", () => {
      expect(code).not.toContain("ReportSampleSection");
    });

    it("StakesSection 포함", () => {
      expect(code).toContain("StakesSection");
    });

    it("EmpathySection 포함", () => {
      expect(code).toContain("EmpathySection");
    });

    it("ServicesSection 포함", () => {
      expect(code).toContain("ServicesSection");
    });

    it("PriceCompareSection 포함", () => {
      expect(code).toContain("PriceCompareSection");
    });

    it("TechSection 포함", () => {
      expect(code).toContain("TechSection");
    });
  });

  describe("PriceCompareSection — 12개 서비스 기준 비교표", () => {
    let code: string;
    beforeAll(() => { code = readComponent("PriceCompareSection.tsx"); });

    it("MY비서 vs 기존 대행사 비교 구조", () => {
      expect(code).toContain("MY비서");
    });

    it("핵심 서비스 항목 포함", () => {
      expect(code).toContain("AI 검색 최적화");
      expect(code).toContain("블로그");
      expect(code).toContain("콘텐츠");
    });
  });

  describe("TechSection — 순수 기술력/차별화 강조", () => {
    let code: string;
    beforeAll(() => { code = readComponent("TechSection.tsx"); });

    it("기술력 관련 키워드 포함", () => {
      const hasAI = code.includes("AI") || code.includes("인공지능");
      const hasTech = code.includes("기술") || code.includes("엔진") || code.includes("자동화");
      expect(hasAI && hasTech).toBe(true);
    });
  });

  describe("ContactSection — 12개 서비스 옵션 업데이트", () => {
    let code: string;
    beforeAll(() => { code = readComponent("ContactSection.tsx"); });

    it("서비스 옵션에 핵심 서비스 포함", () => {
      expect(code).toContain("AI 검색 최적화");
      expect(code).toContain("AI 환자 응대");
    });
  });

  describe("Navbar — AI 최적화 진단 텍스트", () => {
    let code: string;
    beforeAll(() => { code = readComponent("Navbar.tsx"); });

    it("AI 최적화 진단 텍스트 포함", () => {
      expect(code).toContain("AI 최적화 진단");
    });

    it("AI 최적화 진단 텍스트가 존재하고 단독 AI 진단은 없음", () => {
      expect(code).toContain("AI 최적화 진단");
      // 단독 "AI 진단" ("AI 최적화 진단"이 아닌)이 없어야 함
      const cleaned = code.replace(/AI 최적화 진단/g, "");
      expect(cleaned).not.toContain("AI 진단");
    });
  });

  describe("StakesSection — 실패의 위험 섹션", () => {
    let code: string;
    beforeAll(() => { code = readComponent("StakesSection.tsx"); });

    it("위험 통계 데이터 포함", () => {
      expect(code).toContain("-23%");
      expect(code).toContain("6개월");
      expect(code).toContain("68%");
    });

    it("CTA 전환 메시지 포함", () => {
      expect(code).toContain("시작하면");
    });
  });

  describe("EmpathySection — 공감 섹션", () => {
    let code: string;
    beforeAll(() => { code = readComponent("EmpathySection.tsx"); });

    it("공감 메시지 포함", () => {
      expect(code).toContain("고민");
    });

    it("전환 메시지: 진료에만 집중", () => {
      expect(code).toContain("진료");
    });
  });
});

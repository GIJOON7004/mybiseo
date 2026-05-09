/**
 * Homepage sections improvement tests — Phase 2 개편 후 버전
 * 현재 구조에 맞게 재작성
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function readComponent(name: string): string {
  return readFileSync(
    resolve(__dirname, `../client/src/components/${name}.tsx`),
    "utf-8"
  );
}

function readPage(name: string): string {
  return readFileSync(
    resolve(__dirname, `../client/src/pages/${name}.tsx`),
    "utf-8"
  );
}

describe("#1 PricingSection — 맞춤 견적 CTA 구조", () => {
  const code = readComponent("PricingSection");

  it("should have 3-step funnel process", () => {
    expect(code).toContain("STEP");
    expect(code).toContain("무료 AI 가시성 진단");
    expect(code).toContain("맞춤 전략 설계");
    expect(code).toContain("성과 확인 후 결정");
  });

  it("should have custom quote CTA", () => {
    expect(code).toContain("맞춤 견적을 받아보세요");
  });

  it("should explain why pricing is not public", () => {
    expect(code).toContain("왜 가격을 바로 안내하지 않나요");
  });

  it("should have kakao chat link", () => {
    expect(code).toContain("카카오톡 상담");
  });
});

describe("#3 ProcessSection 제거 확인", () => {
  it("Home.tsx에서 ProcessSection이 제거되어야 한다", () => {
    const code = readPage("Home");
    expect(code).not.toContain("ProcessSection");
  });
});

describe("#4 해지 자유 — GuaranteeSection 유지 확인", () => {
  it("should have cancel anytime card in GuaranteeSection", () => {
    const code = readComponent("GuaranteeSection");
    expect(code).toContain("중도 해지 가능, 위약금 0원");
    expect(code).toContain("해지 자유");
  });
});

describe("#5 도입사례 — ResultsSection", () => {
  const code = readComponent("ResultsSection");

  it("should have success metrics", () => {
    expect(code).toContain("신환");
  });

  it("should have success stories", () => {
    expect(code).toContain("원장님");
  });

  it("should have AI success factor analysis", () => {
    expect(code).toContain("AI 분석");
  });
});

describe("#7 다국어 기술 차별점 — ServicesSection", () => {
  const code = readComponent("ServicesSection");

  it("should have multilingual/global support", () => {
    const hasMultilingual = code.includes("다국어") || code.includes("해외") || code.includes("Global");
    expect(hasMultilingual).toBe(true);
  });

  it("should have AI service offerings", () => {
    expect(code).toContain("AI");
  });
});

describe("#9 서비스 제공 확인 — ServicesSection", () => {
  const code = readComponent("ServicesSection");

  it("should have 5 core services", () => {
    expect(code).toContain("AI Visibility Engine");
    expect(code).toContain("Reputation Defense");
    expect(code).toContain("AI Learning Hub");
    expect(code).toContain("Smart Website");
    expect(code).toContain("Patient Communication");
  });
});

describe("#10 TimelineSection — 원장의 한 달", () => {
  const code = readComponent("TimelineSection");

  it("should have 4 time periods", () => {
    expect(code).toContain("매일");
    expect(code).toContain("매주");
    expect(code).toContain("매월");
    expect(code).toContain("분기");
  });

  it("should describe deliverables for each period", () => {
    expect(code).toContain("deliverables");
  });

  it("should have focus-on-treatment message", () => {
    expect(code).toContain("진료에만 집중");
  });
});

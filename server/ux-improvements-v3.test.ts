/**
 * UX/UI 개선 사항 테스트 v3
 * - Stakes 섹션 복구 + 출처 보강
 * - PriceCompare 금액 제거
 * - 메인 페이지 개선 10개
 * - ContentFactoryLanding 개선 5개
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "..", "client", "src");

function readComponent(path: string): string {
  return readFileSync(join(clientDir, path), "utf-8");
}

describe("Stakes Section 복구 및 보강", () => {
  const src = readComponent("components/StakesSection.tsx");

  it("StakesSection 파일이 존재하고 충분한 내용이 있어야 함", () => {
    expect(src.length).toBeGreaterThan(100);
  });

  it("출처 정보가 포함되어야 함", () => {
    const hasSource = /출처|Source|McKinsey|Accenture|Google|WHO|OECD|Statista/i.test(src);
    expect(hasSource).toBe(true);
  });

  it("카운트업 애니메이션이 포함되어야 함", () => {
    const hasCountUp = /useCountUp|IntersectionObserver|requestAnimationFrame/i.test(src);
    expect(hasCountUp).toBe(true);
  });
});

describe("PriceCompareSection 금액 제거", () => {
  const src = readComponent("components/PriceCompareSection.tsx");

  it("금액 표시(만원, 천만원 등)가 없어야 함", () => {
    const hasPricePattern = /\d+~?\d*만원|\d+~?\d*천만원/g.test(src);
    expect(hasPricePattern).toBe(false);
  });

  it("서비스 품질 비교 내용이 있어야 함", () => {
    const hasQualityComparison = /포함|미포함|제공|미제공|통합|별도|자동|수동/i.test(src);
    expect(hasQualityComparison).toBe(true);
  });

  it("hover 효과가 적용되어야 함", () => {
    const hasHover = /hover:/i.test(src);
    expect(hasHover).toBe(true);
  });
});

describe("Home.tsx 섹션 구조", () => {
  const src = readComponent("pages/Home.tsx");

  it("StakesSection이 포함되어야 함", () => {
    expect(src).toContain("StakesSection");
  });

  it("섹션 간 디바이더가 5개 이상 포함되어야 함", () => {
    const dividerCount = (src.match(/bg-gradient-to-r from-transparent via-border/g) || []).length;
    expect(dividerCount).toBeGreaterThanOrEqual(5);
  });
});

describe("ROICalculator 프로그레스 바", () => {
  const src = readComponent("components/ROICalculator.tsx");

  it("프로그레스 바가 포함되어야 함", () => {
    const hasProgressBar = /bg-muted\/50 overflow-hidden/i.test(src);
    expect(hasProgressBar).toBe(true);
  });
});

describe("ContactSection 폼 강화", () => {
  const src = readComponent("components/ContactSection.tsx");

  it("향상된 포커스 효과가 적용되어야 함", () => {
    const hasEnhancedFocus = /focus:ring-2|focus:shadow/i.test(src);
    expect(hasEnhancedFocus).toBe(true);
  });

  it("버튼에 그라데이션이 적용되어야 함", () => {
    const hasGradientButton = /linear-gradient.*oklch/i.test(src);
    expect(hasGradientButton).toBe(true);
  });
});

describe("TechSection 수치 추가", () => {
  const src = readComponent("components/TechSection.tsx");

  it("구체적 수치(stat)가 카드에 포함되어야 함", () => {
    const hasStat = /stat:|item\.stat/i.test(src);
    expect(hasStat).toBe(true);
  });
});

describe("ContentFactoryLanding 개선", () => {
  const src = readComponent("pages/ContentFactoryLanding.tsx");

  it("소셜 프루프 카운터가 포함되어야 함 (CF개선1)", () => {
    expect(src).toContain("SocialProofCounter");
  });

  it("수량 배지가 카드에 포함되어야 함 (CF개선2)", () => {
    expect(src).toContain("f.count");
  });

  it("시간 절약 프로그레스 바가 포함되어야 함 (CF개선3)", () => {
    expect(src).toContain("시간 96% 절약");
  });

  it("모바일 연결선이 포함되어야 함 (CF개선4)", () => {
    expect(src).toContain("lg:hidden");
  });

  it("최종 CTA에 신뢰 배지가 포함되어야 함 (CF개선5)", () => {
    const hasTrustBadge = /의료법 준수|콘텐츠 소유권|위약금 0원/i.test(src);
    expect(hasTrustBadge).toBe(true);
  });
});

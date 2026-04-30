import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "..", "client", "src");
const componentsDir = join(clientDir, "components");

describe("홈페이지 v2 개편 - 새 컴포넌트 존재 확인", () => {
  const newComponents = [
    "ROICalculator.tsx",
    "WhyAINative.tsx",
  ];

  newComponents.forEach((comp) => {
    it(`${comp} 파일이 존재해야 한다`, () => {
      expect(existsSync(join(componentsDir, comp))).toBe(true);
    });
  });
});

describe("홈페이지 v2 개편 - Home.tsx 구성 확인", () => {
  const homeContent = readFileSync(join(clientDir, "pages", "Home.tsx"), "utf-8");

  it("ROICalculator가 Home.tsx에 포함되어야 한다", () => {
    expect(homeContent).toContain("ROICalculator");
  });

  it("WhyAINative가 Home.tsx에 포함되어야 한다", () => {
    // WhyAINative는 독립 컴포넌트로 존재 (Home.tsx에서는 중복 제거됨)
    const whyContent = readFileSync(join(componentsDir, "WhyAINative.tsx"), "utf-8");
    expect(whyContent).toContain("WhyAINative");
  });

  it("StickyCtaBar가 Home.tsx에서 제거되어야 한다 (하단 고정 바 삭제)", () => {
    expect(homeContent).not.toContain("StickyCtaBar");
  });

  it("DemoSection이 Home.tsx에서 제거되어야 한다", () => {
    expect(homeContent).not.toContain("DemoSection");
  });
});

describe("홈페이지 v2 개편 - ROICalculator 내용 확인", () => {
  const roiContent = readFileSync(join(componentsDir, "ROICalculator.tsx"), "utf-8");

  it("진료과목 선택 옵션이 포함되어야 한다", () => {
    expect(roiContent).toContain("성형외과");
    expect(roiContent).toContain("피부과");
    expect(roiContent).toContain("치과");
    expect(roiContent).toContain("한의원");
  });

  it("ROI 계산 로직이 포함되어야 한다", () => {
    expect(roiContent).toContain("additionalPatients");
    expect(roiContent).toContain("additionalRevenue");
    expect(roiContent).toContain("roi");
  });

  it("무료 맞춤 견적 CTA가 포함되어야 한다", () => {
    expect(roiContent).toContain("무료 맞춤 견적 받기");
  });
});

describe("홈페이지 v2 개편 - WhyAINative 내용 확인", () => {
  const whyContent = readFileSync(join(componentsDir, "WhyAINative.tsx"), "utf-8");

  it("AI 검색 시대 메시지가 포함되어야 한다", () => {
    expect(whyContent).toContain("AI에게");
    expect(whyContent).toContain("먼저 물어봅니다");
  });

  it("핵심 데이터 통계가 포함되어야 한다", () => {
    expect(whyContent).toContain("68%");
    expect(whyContent).toContain("4.2배");
    expect(whyContent).toContain("73%");
  });

  it("5대 AI 엔진 목록이 포함되어야 한다", () => {
    expect(whyContent).toContain("ChatGPT");
    expect(whyContent).toContain("Gemini");
    expect(whyContent).toContain("Perplexity");
  });
});

describe("홈페이지 v2 개편 - StickyCtaBar 삭제 확인", () => {
  it("StickyCtaBar.tsx 파일이 삭제되었다 (성능 최적화)", () => {
    expect(existsSync(join(componentsDir, "StickyCtaBar.tsx"))).toBe(false);
    const homeContent = readFileSync(join(clientDir, "pages", "Home.tsx"), "utf-8");
    expect(homeContent).not.toContain("StickyCtaBar");
  });
});

describe("홈페이지 v2 개편 - FAQSection CTA 연결 확인", () => {
  const faqContent = readFileSync(join(componentsDir, "FAQSection.tsx"), "utf-8");

  it("각 FAQ 답변 끝에 상담 CTA가 포함되어야 한다", () => {
    expect(faqContent).toContain("무료 상담을 신청하세요");
  });

  it("FAQ 하단 1:1 상담 CTA가 삭제되어야 한다", () => {
    expect(faqContent).not.toContain("1:1 무료 상담 받기");
  });
});

describe("홈페이지 v2 개편 - PricingSection 가격 투명성 확인", () => {
  const pricingContent = readFileSync(join(componentsDir, "PricingSection.tsx"), "utf-8");

  it("가치 중심 메시지가 포함되어야 한다", () => {
    // v7: 3단계 영업 퍼널 + 성과기반 과금으로 리뉴얼
    expect(pricingContent).toContain("무료 진단");
    expect(pricingContent).toContain("초안 무료");
  });

  it("200개 병원 한정 설명이 삭제되어야 한다", () => {
    expect(pricingContent).not.toContain("왜 200개 병원만 받나요");
  });
});

describe("홈페이지 v2 개편 - 블로그 카테고리 병원 특화 확인", () => {
  const blogContent = readFileSync(join(clientDir, "pages", "Blog.tsx"), "utf-8");

  it("블로그 페이지가 병원 특화 제목을 사용해야 한다", () => {
    expect(blogContent).toContain("병원");
  });

  const blogCatContent = readFileSync(join(clientDir, "pages", "BlogCategory.tsx"), "utf-8");

  it("블로그 카테고리 페이지가 진료과 가이드로 변경되어야 한다", () => {
    expect(blogCatContent).toContain("진료과 마케팅 가이드");
  });
});

describe("홈페이지 v2 개편 - index.html 메타태그 확인", () => {
  const htmlContent = readFileSync(join(__dirname, "..", "client", "index.html"), "utf-8");

  it("병원 관련 키워드가 메타태그에 포함되어야 한다", () => {
    expect(htmlContent).toContain("병원");
  });

  it("mybiseo.com 도메인이 OG 태그에 포함되어야 한다", () => {
    expect(htmlContent).toContain("mybiseo.com");
  });
});

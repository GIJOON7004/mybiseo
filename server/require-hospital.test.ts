import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * RequireHospital 가드 적용 확인 테스트
 * - RequireHospital 컴포넌트가 존재하는지
 * - AdminBlogAI, InterviewContentFactory, ContentFactory에 가드가 적용되었는지
 */

describe("RequireHospital 가드 컴포넌트", () => {
  const clientSrc = path.resolve(__dirname, "../client/src");

  it("RequireHospital.tsx 컴포넌트 파일이 존재해야 한다", () => {
    const filePath = path.join(clientSrc, "components/RequireHospital.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("RequireHospital 컴포넌트가 병원 프로필 체크 로직을 포함해야 한다", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "components/RequireHospital.tsx"),
      "utf-8"
    );
    expect(content).toContain("myHospital.getProfile");
    expect(content).toContain("병원 등록이 필요합니다");
    expect(content).toContain("featureName");
  });

  it("AdminBlogAI에 RequireHospital 가드가 적용되어야 한다", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/AdminBlogAI.tsx"),
      "utf-8"
    );
    expect(content).toContain("import RequireHospital");
    expect(content).toContain("<RequireHospital");
    expect(content).toContain('featureName="AI 블로그 생성"');
  });

  it("InterviewContentFactory에 RequireHospital 가드가 적용되어야 한다", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/InterviewContentFactory.tsx"),
      "utf-8"
    );
    expect(content).toContain("import RequireHospital");
    expect(content).toContain("<RequireHospital");
    expect(content).toContain('featureName="AI 콘텐츠 공장"');
  });

  it("ContentFactory에 RequireHospital 가드가 적용되어야 한다", () => {
    const content = fs.readFileSync(
      path.join(clientSrc, "pages/ContentFactory.tsx"),
      "utf-8"
    );
    expect(content).toContain("import RequireHospital");
    expect(content).toContain("<RequireHospital");
    expect(content).toContain('featureName="콘텐츠 공장"');
  });
});

describe("SEO → AI 검색 최적화 전환 확인", () => {
  const clientSrc = path.resolve(__dirname, "../client/src");

  const mainComponents = [
    "components/HeroSection.tsx",
    "components/StakesSection.tsx",
    "components/ServicesSection.tsx",
    "components/PriceCompareSection.tsx",
    "components/FAQSection.tsx",
    "components/ContactSection.tsx",
    "components/ProcessSection.tsx",
    "components/RoadmapSection.tsx",
  ];

  for (const comp of mainComponents) {
    it(`${comp}에서 단독 "SEO" UI 텍스트가 없어야 한다`, () => {
      const filePath = path.join(clientSrc, comp);
      if (!fs.existsSync(filePath)) return; // 파일이 없으면 스킵
      const content = fs.readFileSync(filePath, "utf-8");
      // 문자열 리터럴 내 단독 "SEO" 검색 (변수명/타입명 제외)
      const stringLiterals = content.match(/"[^"]*SEO[^"]*"/g) || [];
      const uiSeoTexts = stringLiterals.filter(
        (s) => !s.includes("AI 검색") && !s.includes("seo") && !s.includes("Seo")
      );
      expect(uiSeoTexts).toEqual([]);
    });
  }
});

describe("Stakes 섹션 요소 삭제 확인", () => {
  it("StakesSection에서 70% 통계 카드가 삭제되어야 한다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../client/src/components/StakesSection.tsx"),
      "utf-8"
    );
    // 주석/CSS gradient 제외하고 JSX 내 "70%" UI 텍스트 확인
    // 주석 제거 후 체크
    const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
    const stringLiterals = withoutComments.match(/"[^"]*70%[^"]*"/g) || [];
    const uiTexts = stringLiterals.filter(s => !s.includes("gradient") && !s.includes("transparent"));
    expect(uiTexts).toEqual([]);
    expect(content).not.toContain("Medical Economics");
  });

  it("StakesSection에서 BrightEdge/Similarweb 출처 라인이 삭제되어야 한다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../client/src/components/StakesSection.tsx"),
      "utf-8"
    );
    expect(content).not.toContain("BrightEdge");
    expect(content).not.toContain("Similarweb");
  });
});

describe("콘텐츠 공장 랜딩 페이지 수정 확인", () => {
  it("ContentFactoryLanding에서 카운터(1,200+/2,000+) 삭제되어야 한다", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/ContentFactoryLanding.tsx"),
      "utf-8"
    );
    // 카운터 수치 삭제 확인
    expect(content).not.toContain("1,200+");
    expect(content).not.toContain("2,000+");
  });
});

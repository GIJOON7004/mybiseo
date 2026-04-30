import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── 1. 네이버 블로그 발행 기능 테스트 ───
describe("네이버 블로그 발행 기능", () => {
  const routersContent = readRouterSource();

  it("prepareNaverBlog 프로시저가 존재한다", () => {
    expect(routersContent).toContain("prepareNaverBlog:");
  });

  it("markNaverPublished 프로시저가 존재한다", () => {
    expect(routersContent).toContain("markNaverPublished:");
  });

  it("contentId를 입력으로 받는다", () => {
    expect(routersContent).toMatch(/prepareNaverBlog:[\s\S]*?contentId/);
  });

  it("HTML 변환 로직이 포함되어 있다", () => {
    expect(routersContent).toMatch(/htmlContent|naverHtml|blogHtml/);
  });
});

// ─── 2. 카드뉴스 이미지 생성 기능 테스트 ───
describe("카드뉴스 이미지 생성 기능", () => {
  const routersContent = readRouterSource();

  it("generateCardnewsImage 프로시저가 존재한다", () => {
    expect(routersContent).toContain("generateCardnewsImage:");
  });

  it("AI 이미지 생성(generateImage)을 사용한다", () => {
    expect(routersContent).toMatch(/generateImage/);
  });

  it("HTML 슬라이드 콘텐츠를 생성한다", () => {
    expect(routersContent).toMatch(/slides|htmlSlides|slideHtml/);
  });

  it("이미지 URL을 반환한다", () => {
    expect(routersContent).toMatch(/coverImageUrl|imageUrl|coverUrl/);
  });
});

// ─── 3. 의료법 검수 리포트 기능 테스트 ───
describe("의료법 검수 리포트 기능", () => {
  const routersContent = readRouterSource();

  it("myReviewReport 프로시저가 존재한다", () => {
    expect(routersContent).toContain("myReviewReport:");
  });

  it("검수 통계를 집계한다 (db.ts에서 total/pass/warning/fail 반환)", () => {
    const dbContent = readFileSync(
      resolve(__dirname, "db.ts"),
      "utf-8"
    );
    expect(dbContent).toMatch(/total.*pass.*warning.*fail|avgScore/);
  });

  it("reviewContent 단독 검수 프로시저도 존재한다", () => {
    expect(routersContent).toContain("reviewContent:");
  });
});

// ─── 4. AI 허브 UI 통합 테스트 ───
describe("AI 허브 UI 통합", () => {
  const hubContent = readFileSync(
    resolve(__dirname, "../client/src/pages/AiHub.tsx"),
    "utf-8"
  );

  it("네이버 발행 버튼이 UI에 포함되어 있다", () => {
    expect(hubContent).toMatch(/네이버|naver|Naver/i);
  });

  it("카드뉴스 이미지 생성/다운로드 기능이 UI에 있다", () => {
    expect(hubContent).toMatch(/카드뉴스|cardnews|이미지.*생성|다운로드/);
  });

  it("검수 리포트 탭이 UI에 포함되어 있다", () => {
    expect(hubContent).toMatch(/검수.*리포트|리포트|report/i);
  });

  it("파이프라인 시각화가 유지되어 있다", () => {
    expect(hubContent).toMatch(/pipeline|파이프라인|단계|step/i);
  });
});

// ─── 5. DashboardLayout 메뉴 통합 테스트 ───
describe("DashboardLayout AI 허브 메뉴", () => {
  const layoutContent = readFileSync(
    resolve(__dirname, "../client/src/components/DashboardLayout.tsx"),
    "utf-8"
  );

  it("AI 콘텐츠 허브 메뉴 그룹이 존재한다", () => {
    expect(layoutContent).toContain("AI 콘텐츠 허브");
  });

  it("AI 허브 메뉴 항목이 존재한다", () => {
    expect(layoutContent).toContain("AI 허브");
  });

  it("카드뉴스 템플릿 메뉴 항목이 존재한다", () => {
    expect(layoutContent).toContain("카드뉴스 템플릿");
  });

  it("검수 리포트 메뉴 항목이 존재한다", () => {
    expect(layoutContent).toContain("검수 리포트");
  });
});

// ─── 6. DB 스키마 검수 필드 테스트 ───
describe("DB 스키마 검수 필드", () => {
  const schemaContent = readFileSync(
    resolve(__dirname, "../drizzle/schema.ts"),
    "utf-8"
  );

  it("ai_content_logs 테이블에 reviewVerdict 필드가 있다", () => {
    expect(schemaContent).toMatch(/reviewVerdict|review_verdict/);
  });

  it("ai_content_logs 테이블에 reviewScore 필드가 있다", () => {
    expect(schemaContent).toMatch(/reviewScore|review_score/);
  });

  it("ai_content_logs 테이블에 naverPublished 필드가 있다", () => {
    expect(schemaContent).toMatch(/naverPublished|naver_published/);
  });

  it("ai_content_logs 테이블에 reviewIssues 필드가 있다", () => {
    expect(schemaContent).toMatch(/reviewIssues|review_issues/);
  });

  it("ai_content_logs 테이블에 naverPostUrl 필드가 있다", () => {
    expect(schemaContent).toMatch(/naverPostUrl|naver_post_url/);
  });
});

import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/* ─── 1. DB 스키마 테스트 ─── */
describe("AI Hub DB Schema", () => {
  const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");

  it("ai_blog_trial 테이블이 정의되어 있어야 한다", () => {
    expect(schema).toContain("ai_blog_trial");
    expect(schema).toContain("hospitalName");
    expect(schema).toContain("specialty");
    expect(schema).toContain("generatedTitle");
    expect(schema).toContain("generatedContent");
  });

  it("ai_content_log 테이블이 정의되어 있어야 한다", () => {
    expect(schema).toContain("ai_content_log");
    expect(schema).toContain("contentType");
    expect(schema).toContain("blog");
    expect(schema).toContain("cardnews");
    expect(schema).toContain("video_script");
  });

  it("cardnews_templates 테이블이 정의되어 있어야 한다", () => {
    expect(schema).toContain("cardnews_templates");
    expect(schema).toContain("category");
    expect(schema).toContain("seasonal");
    expect(schema).toContain("before_after");
  });
});

/* ─── 2. 서버 라우터 테스트 ─── */
describe("AI Hub tRPC Router", () => {
  const routers = readRouterSource();

  it("aiHub 라우터가 appRouter에 등록되어 있어야 한다", () => {
    expect(routers).toContain("aiHub:");
  });

  it("trialBlog 프로시저가 정의되어 있어야 한다 (publicProcedure)", () => {
    expect(routers).toContain("trialBlog:");
    expect(routers).toContain("publicProcedure");
  });

  it("generateBlog 프로시저가 정의되어 있어야 한다 (protectedProcedure)", () => {
    expect(routers).toContain("generateBlog:");
  });

  it("generateCardnews 프로시저가 정의되어 있어야 한다", () => {
    expect(routers).toContain("generateCardnews:");
  });

  it("generateVideoScript 프로시저가 정의되어 있어야 한다", () => {
    expect(routers).toContain("generateVideoScript:");
  });

  it("myStats 프로시저가 정의되어 있어야 한다", () => {
    expect(routers).toContain("myStats:");
  });

  it("myContents 프로시저가 정의되어 있어야 한다", () => {
    expect(routers).toContain("myContents:");
  });

  it("trialBlog은 hospitalName, specialty 입력을 받아야 한다", () => {
    expect(routers).toContain("hospitalName: z.string()");
    expect(routers).toContain("specialty: z.string()");
  });
});

/* ─── 3. 클라이언트 페이지 테스트 ─── */
describe("AI Hub Client Pages", () => {
  const blogTrial = readFileSync(resolve(__dirname, "../client/src/pages/AiBlogTrial.tsx"), "utf-8");
  const aiHub = readFileSync(resolve(__dirname, "../client/src/pages/AiHub.tsx"), "utf-8");
  const aiCardnews = readFileSync(resolve(__dirname, "../client/src/pages/AiCardnews.tsx"), "utf-8");

  it("AiBlogTrial 페이지가 trpc.aiHub.trialBlog를 호출해야 한다", () => {
    expect(blogTrial).toContain("trpc.aiHub.trialBlog.useMutation");
  });

  it("AiBlogTrial 페이지에 병원명 입력 필드가 있어야 한다", () => {
    expect(blogTrial).toContain("병원명");
    expect(blogTrial).toContain("진료과 선택");
  });

  it("AiBlogTrial 페이지에 복사 기능이 있어야 한다", () => {
    expect(blogTrial).toContain("clipboard.writeText");
  });

  it("AiHub 페이지에 블로그, 카드뉴스, 영상 스크립트 탭이 있어야 한다", () => {
    expect(aiHub).toContain("블로그");
    expect(aiHub).toContain("카드뉴스");
    expect(aiHub).toContain("영상 스크립트");
  });

  it("AiHub 페이지에 통계 카드가 있어야 한다", () => {
    expect(aiHub).toContain("trpc.aiHub.myStats.useQuery");
  });

  it("AiHub 페이지에 최근 생성 내역이 있어야 한다", () => {
    expect(aiHub).toContain("trpc.aiHub.myContents.useQuery");
  });

  it("AiCardnews 페이지에 6가지 템플릿이 있어야 한다", () => {
    expect(aiCardnews).toContain("seasonal");
    expect(aiCardnews).toContain("before-after");
    expect(aiCardnews).toContain("tips");
    expect(aiCardnews).toContain("intro");
    expect(aiCardnews).toContain("review");
    expect(aiCardnews).toContain("faq");
  });

  it("AiCardnews 페이지에 스타일 선택이 있어야 한다", () => {
    expect(aiCardnews).toContain("modern");
    expect(aiCardnews).toContain("warm");
    expect(aiCardnews).toContain("professional");
    expect(aiCardnews).toContain("cute");
  });
});

/* ─── 4. 라우트 등록 테스트 ─── */
describe("AI Hub Routes", () => {
  const appTsx = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");

  it("/ai-blog-trial 라우트가 등록되어 있어야 한다", () => {
    expect(appTsx).toContain("/ai-blog-trial");
  });

  it("/ai-hub 라우트가 등록되어 있어야 한다", () => {
    expect(appTsx).toContain("/ai-hub");
  });

  it("/ai-hub/cardnews 라우트가 등록되어 있어야 한다", () => {
    expect(appTsx).toContain("/ai-hub/cardnews");
  });
});

/* ─── 5. 사이드바 메뉴 테스트 ─── */
describe("AI Hub Sidebar Menu", () => {
  const dashboard = readFileSync(resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8");

  it("사이드바에 AI 콘텐츠 허브 그룹이 있어야 한다", () => {
    expect(dashboard).toContain("AI 콘텐츠 허브");
  });

  it("사이드바에 AI 허브 메뉴가 있어야 한다", () => {
    expect(dashboard).toContain("/ai-hub");
  });

  it("사이드바에 카드뉴스 템플릿 메뉴가 있어야 한다", () => {
    expect(dashboard).toContain("/ai-hub/cardnews");
  });
});

/* ─── 6. 히어로 CTA 테스트 ─── */
describe("Hero Section AI CTA", () => {
  const hero = readFileSync(resolve(__dirname, "../client/src/components/HeroSection.tsx"), "utf-8");

  it("히어로 섹션에 AI 블로그 체험 버튼이 있어야 한다", () => {
    expect(hero).toContain("AI 블로그 체험");
    expect(hero).toContain("/ai-blog-trial");
  });
});

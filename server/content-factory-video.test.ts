import { readRouterSource } from "./test-helpers";
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");
const routers = readRouterSource();
const db = readFileSync(resolve(__dirname, "db.ts"), "utf-8");

// ─── 1. 콘텐츠 공장 시스템 - 스타일 가이드 ───
describe("콘텐츠 공장 - 스타일 가이드 DB", () => {
  it("content_style_guides 테이블이 정의되어 있다", () => {
    expect(schema).toContain("content_style_guides");
  });
  it("brandColor 컬럼이 있다", () => {
    expect(schema).toMatch(/brand_color/);
  });
  it("toneOfVoice 컬럼이 있다", () => {
    expect(schema).toMatch(/tone_of_voice/);
  });
  it("targetAudience 컬럼이 있다", () => {
    expect(schema).toMatch(/target_audience/);
  });
});

describe("콘텐츠 공장 - 스타일 가이드 서버", () => {
  it("getStyleGuide 프로시저가 있다", () => {
    expect(routers).toContain("getStyleGuide");
  });
  it("saveStyleGuide 프로시저가 있다", () => {
    expect(routers).toContain("saveStyleGuide");
  });
  it("getStyleGuide DB 헬퍼가 있다", () => {
    expect(db).toContain("getStyleGuide");
  });
  it("upsertStyleGuide DB 헬퍼가 있다", () => {
    expect(db).toContain("upsertStyleGuide");
  });
});

// ─── 2. 콘텐츠 공장 - 아이디어 수집방 ───
describe("콘텐츠 공장 - 아이디어 수집방 DB", () => {
  it("content_ideas 테이블이 정의되어 있다", () => {
    expect(schema).toContain("content_ideas");
  });
  it("sourceUrl 컬럼이 있다", () => {
    expect(schema).toMatch(/source_url/);
  });
  it("whyItWorks 컬럼이 있다", () => {
    expect(schema).toMatch(/why_it_works/);
  });
});

describe("콘텐츠 공장 - 아이디어 수집방 서버", () => {
  it("listIdeas 프로시저가 있다", () => {
    expect(routers).toContain("listIdeas");
  });
  it("addIdea 프로시저가 있다", () => {
    expect(routers).toContain("addIdea");
  });
  it("updateIdea 프로시저가 있다", () => {
    expect(routers).toContain("updateIdea");
  });
  it("deleteIdea 프로시저가 있다", () => {
    expect(routers).toContain("deleteIdea");
  });
  it("analyzeIdea AI 분석 프로시저가 있다", () => {
    expect(routers).toContain("analyzeIdea");
  });
  it("analyzeIdea에서 LLM을 사용한다", () => {
    // analyzeIdea 이후 invokeLLM 호출 확인
    const idx = routers.indexOf("analyzeIdea");
    const after = routers.slice(idx, idx + 1500);
    expect(after).toContain("invokeLLM");
  });
  it("getContentIdeas DB 헬퍼가 있다", () => {
    expect(db).toContain("getContentIdeas");
  });
  it("createContentIdea DB 헬퍼가 있다", () => {
    expect(db).toContain("createContentIdea");
  });
});

// ─── 3. 콘텐츠 공장 - 훅 라이브러리 ───
describe("콘텐츠 공장 - 훅 라이브러리 DB", () => {
  it("content_hooks 테이블이 정의되어 있다", () => {
    expect(schema).toContain("content_hooks");
  });
  it("hookText 컬럼이 있다", () => {
    expect(schema).toMatch(/hook_text/);
  });
  it("hookType 컬럼이 있다", () => {
    expect(schema).toMatch(/hook_type/);
  });
});

describe("콘텐츠 공장 - 훅 라이브러리 서버", () => {
  it("listHooks 프로시저가 있다", () => {
    expect(routers).toContain("listHooks");
  });
  it("addHook 프로시저가 있다", () => {
    expect(routers).toContain("addHook");
  });
  it("deleteHook 프로시저가 있다", () => {
    expect(routers).toContain("deleteHook");
  });
  it("generateHooks AI 생성 프로시저가 있다", () => {
    expect(routers).toContain("generateHooks");
  });
  it("generateHooks에서 LLM을 사용한다", () => {
    const idx = routers.indexOf("generateHooks");
    const after = routers.slice(idx, idx + 1500);
    expect(after).toContain("invokeLLM");
  });
  it("getContentHooks DB 헬퍼가 있다", () => {
    expect(db).toContain("getContentHooks");
  });
  it("createContentHook DB 헬퍼가 있다", () => {
    expect(db).toContain("createContentHook");
  });
});

// ─── 4. 콘텐츠 공장 - 대본 생성 ───
describe("콘텐츠 공장 - 대본 생성 DB", () => {
  it("content_scripts 테이블이 정의되어 있다", () => {
    expect(schema).toContain("content_scripts");
  });
  it("hookSection 컬럼이 있다", () => {
    expect(schema).toMatch(/hook_section/);
  });
  it("bodySection 컬럼이 있다", () => {
    expect(schema).toMatch(/body_section/);
  });
  it("ctaSection 컬럼이 있다", () => {
    expect(schema).toMatch(/cta_section/);
  });
  it("fullScript 컬럼이 있다", () => {
    expect(schema).toMatch(/full_script/);
  });
});

describe("콘텐츠 공장 - 대본 생성 서버", () => {
  it("listScripts 프로시저가 있다", () => {
    expect(routers).toContain("listScripts");
  });
  it("generateScript AI 생성 프로시저가 있다", () => {
    expect(routers).toContain("generateScript");
  });
  it("updateScript 프로시저가 있다", () => {
    expect(routers).toContain("updateScript");
  });
  it("generateScript에서 LLM을 사용한다", () => {
    const idx = routers.indexOf("generateScript");
    const after = routers.slice(idx, idx + 2000);
    expect(after).toContain("invokeLLM");
  });
  it("대본 구조에 훅/본문/CTA 섹션이 포함된다", () => {
    const idx = routers.indexOf("generateScript");
    const after = routers.slice(idx, idx + 2000);
    expect(after).toContain("hookSection");
    expect(after).toContain("bodySection");
    expect(after).toContain("ctaSection");
  });
  it("getContentScripts DB 헬퍼가 있다", () => {
    expect(db).toContain("getContentScripts");
  });
  it("createContentScript DB 헬퍼가 있다", () => {
    expect(db).toContain("createContentScript");
  });
});

// ─── 5. 콘텐츠 공장 - 콘텐츠 캘린더 ───
describe("콘텐츠 공장 - 콘텐츠 캘린더 DB", () => {
  it("content_calendar 테이블이 정의되어 있다", () => {
    expect(schema).toContain("content_calendar");
  });
  it("scheduledDate 컬럼이 있다", () => {
    expect(schema).toMatch(/scheduled_date/);
  });
  it("platform 컬럼이 있다 (발행 채널)", () => {
    // content_calendar 테이블 내에 platform이 있는지
    const idx = schema.indexOf("content_calendar");
    const after = schema.slice(idx, idx + 500);
    expect(after).toContain("platform");
  });
});

describe("콘텐츠 공장 - 콘텐츠 캘린더 서버", () => {
  it("listCalendar 프로시저가 있다", () => {
    expect(routers).toContain("listCalendar");
  });
  it("addCalendarItem 프로시저가 있다", () => {
    expect(routers).toContain("addCalendarItem");
  });
  it("updateCalendarItem 프로시저가 있다", () => {
    expect(routers).toContain("updateCalendarItem");
  });
  it("deleteCalendarItem 프로시저가 있다", () => {
    expect(routers).toContain("deleteCalendarItem");
  });
  it("getCalendarItems DB 헬퍼가 있다", () => {
    expect(db).toContain("getCalendarItems");
  });
  it("createCalendarItem DB 헬퍼가 있다", () => {
    expect(db).toContain("createCalendarItem");
  });
});

// ─── 6. AI 영상 마케팅 프롬프트 생성기 (Veo3) ───
describe("AI 영상 프롬프트 - DB 스키마", () => {
  it("video_prompts 테이블이 정의되어 있다", () => {
    expect(schema).toContain("video_prompts");
  });
  it("treatmentName 컬럼이 있다", () => {
    expect(schema).toMatch(/treatment_name/);
  });
  it("videoType 컬럼이 있다", () => {
    expect(schema).toMatch(/video_type/);
  });
  it("prompt 컬럼이 있다", () => {
    const idx = schema.indexOf("video_prompts");
    const after = schema.slice(idx, idx + 500);
    expect(after).toContain("prompt");
  });
  it("targetPlatform 컬럼이 있다", () => {
    expect(schema).toMatch(/target_platform/);
  });
});

describe("AI 영상 프롬프트 - 서버 라우터", () => {
  it("videoMarketing 라우터가 존재한다", () => {
    expect(routers).toContain("videoMarketing:");
  });
  it("list 프로시저가 있다", () => {
    const idx = routers.indexOf("videoMarketing:");
    const after = routers.slice(idx, idx + 500);
    expect(after).toContain("list:");
  });
  it("generate 프로시저가 있다 (AI 프롬프트 생성)", () => {
    const idx = routers.indexOf("videoMarketing:");
    const after = routers.slice(idx, idx + 2000);
    expect(after).toContain("generate:");
  });
  it("delete 프로시저가 있다", () => {
    const idx = routers.indexOf("videoMarketing:");
    const after = routers.slice(idx, idx + 6000);
    expect(after).toContain("deleteVideoPrompt");
  });
  it("LLM을 사용하여 영상 프롬프트를 생성한다", () => {
    const idx = routers.indexOf("videoMarketing:");
    const after = routers.slice(idx, idx + 6000);
    expect(after).toContain("invokeLLM");
  });
  it("Veo3 관련 프롬프트 가이드가 포함되어 있다", () => {
    const idx = routers.indexOf("videoMarketing:");
    const after = routers.slice(idx, idx + 3000);
    expect(after).toMatch(/Veo|veo|영상|카메라|장면/);
  });
});

describe("AI 영상 프롬프트 - DB 헬퍼", () => {
  it("getVideoPrompts 함수가 있다", () => {
    expect(db).toContain("getVideoPrompts");
  });
  it("createVideoPrompt 함수가 있다", () => {
    expect(db).toContain("createVideoPrompt");
  });
  it("deleteVideoPrompt 함수가 있다", () => {
    expect(db).toContain("deleteVideoPrompt");
  });
});

// ─── 7. 마케팅 통합 대시보드 ───
describe("마케팅 대시보드 - 서버 라우터", () => {
  it("marketingDashboard 라우터가 존재한다", () => {
    expect(routers).toContain("marketingDashboard:");
  });
  it("stats 프로시저가 있다", () => {
    const idx = routers.indexOf("marketingDashboard:");
    const after = routers.slice(idx, idx + 500);
    expect(after).toContain("stats:");
  });
  it("getMarketingDashboardStats DB 헬퍼가 있다", () => {
    expect(db).toContain("getMarketingDashboardStats");
  });
  it("통계에 ideas 카운트가 포함된다", () => {
    const idx = db.indexOf("getMarketingDashboardStats");
    const after = db.slice(idx, idx + 1000);
    expect(after).toContain("ideas");
  });
  it("통계에 videoPrompts 카운트가 포함된다", () => {
    const idx = db.indexOf("getMarketingDashboardStats");
    const after = db.slice(idx, idx + 1000);
    expect(after).toContain("videoPrompts");
  });
  it("통계에 treatmentPages 카운트가 포함된다", () => {
    const idx = db.indexOf("getMarketingDashboardStats");
    const after = db.slice(idx, idx + 1000);
    expect(after).toContain("treatmentPages");
  });
});

// ─── 8. contentFactory 라우터 통합 ───
describe("contentFactory 라우터 통합", () => {
  it("contentFactory 라우터가 존재한다", () => {
    expect(routers).toContain("contentFactory:");
  });
  it("5단계 파이프라인이 모두 포함된다 (스타일가이드/아이디어/훅/대본/캘린더)", () => {
    const idx = routers.indexOf("contentFactory:");
    const after = routers.slice(idx, idx + 15000);
    expect(after).toContain("getStyleGuide");
    expect(after).toContain("listIdeas");
    expect(after).toContain("listHooks");
    expect(after).toContain("listScripts");
    expect(after).toContain("listCalendar");
  });
});

// ─── 9. 프론트엔드 라우트 등록 ───
describe("프론트엔드 라우트 등록", () => {
  const appTsx = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");
  it("콘텐츠 공장 라우트가 등록되어 있다", () => {
    expect(appTsx).toContain("/admin/content-factory");
  });
  it("AI 영상 프롬프트 라우트가 등록되어 있다", () => {
    expect(appTsx).toContain("/admin/video-prompt");
  });
  it("마케팅 대시보드 라우트가 등록되어 있다", () => {
    expect(appTsx).toContain("/admin/marketing-dashboard");
  });
  it("ContentFactory 컴포넌트가 lazy 로딩된다", () => {
    expect(appTsx).toContain("ContentFactory");
  });
  it("VideoPromptGenerator 컴포넌트가 lazy 로딩된다", () => {
    expect(appTsx).toContain("VideoPromptGenerator");
  });
  it("MarketingDashboard 컴포넌트가 lazy 로딩된다", () => {
    expect(appTsx).toContain("MarketingDashboard");
  });
});

// ─── 10. 사이드바 메뉴 등록 ───
describe("사이드바 메뉴 등록", () => {
  const layout = readFileSync(resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8");
  it("콘텐츠 공장 메뉴가 사이드바에 있다", () => {
    expect(layout).toContain("콘텐츠 공장");
  });
  it("AI 영상 프롬프트 메뉴가 사이드바에 있다", () => {
    expect(layout).toContain("AI 영상 프롬프트");
  });
  it("마케팅 대시보드 메뉴가 사이드바에 있다", () => {
    expect(layout).toContain("마케팅 대시보드");
  });
});

// ─── 11. 의료광고법 준수 ───
describe("의료광고법 준수", () => {
  it("대본 생성 프롬프트에 의료광고법 가이드가 포함된다", () => {
    const idx = routers.indexOf("generateScript");
    const after = routers.slice(idx, idx + 2000);
    expect(after).toMatch(/의료광고법|의료법/);
  });
  it("영상 프롬프트에 의료광고법 준수 가이드가 포함된다", () => {
    const idx = routers.indexOf("videoMarketing:");
    const after = routers.slice(idx, idx + 3000);
    expect(after).toMatch(/의료광고법|의료법|부작용|과장/);
  });
});

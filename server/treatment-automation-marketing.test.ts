import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── 1. 시술 상세페이지 자동 생성 시스템 ───
describe("시술 상세페이지 - DB 스키마", () => {
  const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");
  it("treatment_pages 테이블이 정의되어 있다", () => {
    expect(schema).toContain("treatment_pages");
  });
  it("slug 컬럼이 있다 (퍼블릭 URL용)", () => {
    expect(schema).toMatch(/slug.*varchar|varchar.*slug/);
  });
  it("status 컨럼이 있다 (draft/published)", () => {
    expect(schema).toMatch(/status.*varchar|varchar.*status/);
  });
  it("sections 컨럼이 JSON 형태로 저장된다", () => {
    expect(schema).toMatch(/sections.*json|json.*sections/);
  });
});

describe("시술 상세페이지 - 서버 라우터", () => {
  const routers = readRouterSource();
  it("treatmentPage 라우터가 존재한다", () => {
    expect(routers).toContain("treatmentPage:");
  });
  it("generate 프로시저가 있다 (AI 기반 콘텐츠 생성)", () => {
    expect(routers).toMatch(/generate.*protectedProcedure/);
  });
  it("publish 프로시저가 있다", () => {
    expect(routers).toMatch(/publish.*protectedProcedure/);
  });
  it("getBySlug 퍼블릭 프로시저가 있다", () => {
    expect(routers).toContain("getBySlug");
  });
  it("LLM을 사용하여 시술 콘텐츠를 생성한다", () => {
    expect(routers).toMatch(/invokeLLM|invokellm/i);
  });
});

describe("시술 상세페이지 - DB 헬퍼", () => {
  const db = readFileSync(resolve(__dirname, "db.ts"), "utf-8");
  it("createTreatmentPage 함수가 있다", () => {
    expect(db).toContain("createTreatmentPage");
  });
  it("getTreatmentPagesByUser 함수가 있다", () => {
    expect(db).toContain("getTreatmentPagesByUser");
  });
  it("getTreatmentPageBySlug 함수가 있다", () => {
    expect(db).toContain("getTreatmentPageBySlug");
  });
});

describe("시술 상세페이지 - 프론트엔드 렌더러", () => {
  const publicPage = readFileSync(resolve(__dirname, "../client/src/pages/TreatmentPagePublic.tsx"), "utf-8");
  it("TreatmentPagePublic 컴포넌트가 존재한다", () => {
    expect(publicPage).toContain("TreatmentPagePublic");
  });
  it("slug 기반으로 페이지를 조회한다", () => {
    expect(publicPage).toContain("getBySlug");
  });
  it("SEO meta 태그를 설정한다", () => {
    expect(publicPage).toMatch(/document\.title|meta|title/i);
  });
});

describe("시술 상세페이지 - 빌더 UI", () => {
  const builder = readFileSync(resolve(__dirname, "../client/src/pages/TreatmentPageBuilder.tsx"), "utf-8");
  it("TreatmentPageBuilder 컴포넌트가 존재한다", () => {
    expect(builder).toContain("TreatmentPageBuilder");
  });
  it("시술명 입력 필드가 있다", () => {
    expect(builder).toContain("treatmentName");
  });
  it("언어 선택 기능이 있다", () => {
    expect(builder).toMatch(/language.*ko|한국어/);
  });
  it("퍼블리시 기능이 있다", () => {
    expect(builder).toContain("publish");
  });
  it("URL 복사 기능이 있다", () => {
    expect(builder).toContain("copyUrl");
  });
});

// ─── 2. 자동화 패키지 ───
describe("자동화 - DB 스키마", () => {
  const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");
  it("automation_rules 테이블이 정의되어 있다", () => {
    expect(schema).toContain("automation_rules");
  });
  it("automation_logs 테이블이 정의되어 있다", () => {
    expect(schema).toContain("automation_logs");
  });
  it("규칙 유형에 booking_confirm이 포함된다", () => {
    expect(schema).toContain("booking_confirm");
  });
  it("규칙 유형에 reminder_d1이 포함된다", () => {
    expect(schema).toContain("reminder_d1");
  });
  it("규칙 유형에 review_request_d3이 포함된다", () => {
    expect(schema).toContain("review_request_d3");
  });
});

describe("자동화 - 서버 라우터", () => {
  const routers = readRouterSource();
  it("automation 라우터가 존재한다", () => {
    expect(routers).toContain("automation:");
  });
  it("sendBookingConfirm 프로시저가 있다", () => {
    expect(routers).toContain("sendBookingConfirm");
  });
  it("sendReminder 프로시저가 있다", () => {
    expect(routers).toContain("sendReminder");
  });
  it("sendReviewRequest 프로시저가 있다", () => {
    expect(routers).toContain("sendReviewRequest");
  });
  it("이메일 발송 시 email_contacts에 자동 등록한다", () => {
    expect(routers).toMatch(/upsertEmailContact.*patient/);
  });
  it("발송 로그를 automation_logs에 기록한다", () => {
    expect(routers).toContain("createAutomationLog");
  });
});

describe("자동화 - UI", () => {
  const ui = readFileSync(resolve(__dirname, "../client/src/pages/AutomationManager.tsx"), "utf-8");
  it("AutomationManager 컴포넌트가 존재한다", () => {
    expect(ui).toContain("AutomationManager");
  });
  it("수동 발송 탭이 있다", () => {
    expect(ui).toContain("수동 발송");
  });
  it("자동화 규칙 탭이 있다", () => {
    expect(ui).toContain("자동화 규칙");
  });
  it("발송 로그 탭이 있다", () => {
    expect(ui).toContain("발송 로그");
  });
  it("예약 확인/리마인더/후기 요청 유형이 있다", () => {
    expect(ui).toContain("예약 확인");
    expect(ui).toContain("리마인더");
    expect(ui).toContain("후기 요청");
  });
});

// ─── 3. 통합 마케팅 채널 관리 ───
describe("마케팅 채널 - DB 스키마", () => {
  const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");
  it("marketing_content 테이블이 정의되어 있다", () => {
    expect(schema).toContain("marketing_content");
  });
  it("채널 유형에 blog/instagram/kakao가 포함된다", () => {
    expect(schema).toContain("blog");
    expect(schema).toContain("instagram");
    expect(schema).toContain("kakao");
  });
});

describe("마케팅 채널 - 서버 라우터", () => {
  const routers = readRouterSource();
  it("marketingChannel 라우터가 존재한다", () => {
    expect(routers).toContain("marketingChannel:");
  });
  it("generateOsmu 프로시저가 있다 (OSMU 콘텐츠 생성)", () => {
    expect(routers).toContain("generateOsmu");
  });
  it("LLM을 사용하여 채널별 콘텐츠를 변환한다", () => {
    expect(routers).toContain("invokeLLM");
    expect(routers).toContain("generateOsmu");
  });
});

describe("마케팅 채널 - UI", () => {
  const ui = readFileSync(resolve(__dirname, "../client/src/pages/MarketingChannel.tsx"), "utf-8");
  it("MarketingChannel 컴포넌트가 존재한다", () => {
    expect(ui).toContain("MarketingChannel");
  });
  it("OSMU 콘텐츠 생성 탭이 있다", () => {
    expect(ui).toContain("AI 콘텐츠 생성");
  });
  it("콘텐츠 라이브러리 탭이 있다", () => {
    expect(ui).toContain("콘텐츠 라이브러리");
  });
  it("채널 선택 기능이 있다 (블로그/인스타/카카오)", () => {
    expect(ui).toContain("네이버 블로그");
    expect(ui).toContain("인스타그램");
    expect(ui).toContain("카카오톡");
  });
  it("콘텐츠 복사 기능이 있다", () => {
    expect(ui).toContain("copyContent");
  });
});

// ─── 4. 사이드바 + 라우트 등록 ───
describe("사이드바 & 라우트 등록", () => {
  const layout = readFileSync(resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8");
  const app = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");

  it("사이드바에 시술페이지 빌더 메뉴가 있다", () => {
    expect(layout).toContain("시술페이지 빌더");
    expect(layout).toContain("/admin/treatment-builder");
  });
  it("사이드바에 자동화 관리 메뉴가 있다", () => {
    expect(layout).toContain("자동화 관리");
    expect(layout).toContain("/admin/automation");
  });
  it("사이드바에 OSMU 콘텐츠 메뉴가 있다", () => {
    expect(layout).toContain("OSMU 콘텐츠");
    expect(layout).toContain("/admin/marketing-channel");
  });
  it("App.tsx에 시술페이지 관련 라우트가 등록되어 있다", () => {
    expect(app).toContain("/admin/treatment-builder");
    expect(app).toContain("/p/:slug");
  });
  it("App.tsx에 자동화 라우트가 등록되어 있다", () => {
    expect(app).toContain("/admin/automation");
  });
  it("App.tsx에 마케팅 채널 라우트가 등록되어 있다", () => {
    expect(app).toContain("/admin/marketing-channel");
  });
});

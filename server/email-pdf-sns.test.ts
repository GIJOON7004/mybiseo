import { readRouterSource } from "./test-helpers";
import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── 1. 이메일 연락처 DB 스키마 검증 ───
describe("39차: email_contacts 테이블 스키마", () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../drizzle/schema.ts"), "utf-8");
  it("email_contacts 테이블 정의 존재", () => {
    expect(schema).toContain('export const emailContacts = mysqlTable("email_contacts"');
  });
  it("email_send_logs 테이블 정의 존재", () => {
    expect(schema).toContain('export const emailSendLogs = mysqlTable("email_send_logs"');
  });
  it("email_contacts에 source enum 포함", () => {
    expect(schema).toContain("seo_checker");
    expect(schema).toContain("benchmarking_report");
    expect(schema).toContain("newsletter");
    expect(schema).toContain("manual");
  });
  it("email_contacts에 tags JSON 필드 존재", () => {
    expect(schema).toContain('tags: json("tags")');
  });
  it("email_contacts에 마케팅 동의 필드 존재", () => {
    expect(schema).toContain("marketing_consent");
  });
  it("email_contacts에 발송 추적 필드 존재", () => {
    expect(schema).toContain("total_emails_sent");
    expect(schema).toContain("last_email_sent_at");
  });
});

// ─── 2. 이메일 연락처 DB 헬퍼 검증 ───
describe("39차: email_contacts DB 헬퍼", () => {
  const db = fs.readFileSync(path.resolve(__dirname, "./db.ts"), "utf-8");
  it("upsertEmailContact 함수 존재", () => {
    expect(db).toContain("export async function upsertEmailContact");
  });
  it("getEmailContacts 함수 존재", () => {
    expect(db).toContain("export async function getEmailContacts");
  });
  it("getEmailContactStats 함수 존재", () => {
    expect(db).toContain("export async function getEmailContactStats");
  });
  it("incrementEmailSentCount 함수 존재", () => {
    expect(db).toContain("export async function incrementEmailSentCount");
  });
  it("createEmailSendLog 함수 존재", () => {
    expect(db).toContain("export async function createEmailSendLog");
  });
});

// ─── 3. 이메일 연락처 라우터 검증 ───
describe("39차: emailContact 라우터", () => {
  const routers = readRouterSource();
  it("emailContact 라우터 존재", () => {
    expect(routers).toContain("emailContact: router({");
  });
  it("emailContact.list 프로시저 존재", () => {
    expect(routers).toContain("list: adminProcedure");
  });
  it("emailContact.stats 프로시저 존재", () => {
    expect(routers).toContain("stats: adminProcedure.query");
  });
  it("emailContact.addManual 프로시저 존재", () => {
    expect(routers).toContain("addManual: adminProcedure");
  });
  it("emailContact.sendLogs 프로시저 존재", () => {
    expect(routers).toContain("sendLogs: adminProcedure");
  });
});

// ─── 4. 벤치마킹 PDF 생성 모듈 검증 ───
describe("39차: benchmarking-pdf 모듈", () => {
  const pdfModule = fs.readFileSync(path.resolve(__dirname, "./benchmarking-pdf.ts"), "utf-8");
  it("generateBenchmarkingPdf export 존재", () => {
    expect(pdfModule).toContain("export async function generateBenchmarkingPdf");
  });
  it("PDF에 표지 생성 로직 포함", () => {
    expect(pdfModule).toContain("벤치마킹 리포트");
  });
  it("PDF에 경쟁사 비교 표 포함", () => {
    expect(pdfModule).toContain("경쟁사");
  });
  it("PDF에 Actionable Insights 섹션 포함", () => {
    expect(pdfModule).toContain("Actionable Insights");
  });
  it("benchmarkingPdf 라우터 존재", () => {
    const routers = readRouterSource();
    expect(routers).toContain("benchmarkingPdf: router({");
  });
});

// ─── 5. AI SNS 팁 고도화 검증 ───
describe("39차: AI SNS 팁 고도화", () => {
  const routers = readRouterSource();
  it("aiSnsTips 라우터 존재", () => {
    expect(routers).toContain("aiSnsTips: router({");
  });
  it("AI SNS 팁에 response_format JSON schema 사용", () => {
    expect(routers).toContain("sns_marketing_tips");
  });
  it("SnsMarketingTips 컴포넌트에 AI 버튼 존재", () => {
    const comp = fs.readFileSync(path.resolve(__dirname, "../client/src/components/SnsMarketingTips.tsx"), "utf-8");
    expect(comp).toContain("aiSnsTips.generate.useMutation");
    expect(comp).toContain("AI 맞춤 팁");
  });
});

// ─── 6. 벤치마킹 리포트 자동 이메일 발송 검증 ───
describe("39차: 벤치마킹 리포트 자동 이메일 발송", () => {
  const routers = readRouterSource();
  it("벤치마킹 생성 후 이메일 발송 로직 존재", () => {
    expect(routers).toContain("자동 이메일 발송");
    expect(routers).toContain("sendEmailViaNaver");
  });
  it("이메일 발송 후 email_contacts에 등록", () => {
    expect(routers).toContain("upsertEmailContact");
  });
  it("이메일 발송 로그 기록", () => {
    expect(routers).toContain("createEmailSendLog");
  });
  it("벤치마킹 이메일 템플릿 존재", () => {
    const tmpl = fs.readFileSync(path.resolve(__dirname, "./email-templates.ts"), "utf-8");
    expect(tmpl).toContain("buildBenchmarkingReportEmail");
  });
});

// ─── 7. UI 페이지 검증 ───
describe("39차: UI 페이지 검증", () => {
  it("EmailContacts 페이지 존재", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../client/src/pages/EmailContacts.tsx"))).toBe(true);
  });
  it("EmailContacts 페이지에 통계 카드 존재", () => {
    const page = fs.readFileSync(path.resolve(__dirname, "../client/src/pages/EmailContacts.tsx"), "utf-8");
    expect(page).toContain("전체 연락처");
    expect(page).toContain("활성 연락처");
  });
  it("App.tsx에 EmailContacts 라우트 등록", () => {
    const app = fs.readFileSync(path.resolve(__dirname, "../client/src/App.tsx"), "utf-8");
    expect(app).toContain("/admin/email-contacts");
  });
  it("사이드바에 이메일 연락처 메뉴 등록", () => {
    const layout = fs.readFileSync(path.resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8");
    expect(layout).toContain("이메일 연락처");
    expect(layout).toContain("/admin/email-contacts");
  });
  it("BenchmarkingReport에 PDF 다운로드 버튼 존재", () => {
    const page = fs.readFileSync(path.resolve(__dirname, "../client/src/pages/BenchmarkingReport.tsx"), "utf-8");
    expect(page).toContain("PDF 다운로드");
    expect(page).toContain("benchmarkingPdf.generate.useMutation");
  });
});

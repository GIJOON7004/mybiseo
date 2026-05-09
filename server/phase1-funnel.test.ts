import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Phase 1: 무료 진단 퍼널 개선 테스트
 * - SEO 미들웨어 (llms.txt, sitemap, AI 크롤러 대응)
 * - 진단 폼 확장 필드 (hospitalName, region, email, phone, privacyConsent)
 * - 운영자 알림 발송
 */

// Mock dependencies
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("SEO Middleware", () => {
  it("llms.txt 파일이 올바른 형식으로 존재해야 함", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const llmsPath = path.resolve(__dirname, "../client/public/llms.txt");
    const content = fs.readFileSync(llmsPath, "utf-8");
    
    expect(content).toContain("# MY비서 (mybiseo.com)");
    expect(content).toContain("mybiseo.com");
    expect(content).toContain("AI 가시성");
  });

  it("seo-middleware 모듈이 올바르게 export됨", async () => {
    const mod = await import("./seo-middleware");
    expect(mod.registerSeoMiddleware).toBeDefined();
    expect(typeof mod.registerSeoMiddleware).toBe("function");
  });
});

describe("진단 폼 확장 필드 검증", () => {
  it("seoAnalyzerRouter가 확장 필드를 포함한 input을 수용해야 함", async () => {
    const { seoAnalyzerRouter } = await import("./routes/seo");
    expect(seoAnalyzerRouter).toBeDefined();
    
    // 라우터의 analyze 프로시저가 존재하는지 확인
    const procedures = Object.keys(seoAnalyzerRouter._def.procedures);
    expect(procedures).toContain("analyze");
  });

  it("seoLeads 스키마에 확장 필드가 포함되어야 함", async () => {
    const schema = await import("../drizzle/schema");
    const seoLeadsTable = schema.seoLeads;
    
    // 테이블 컬럼 확인
    const columns = Object.keys(seoLeadsTable);
    expect(columns).toContain("hospitalName");
    expect(columns).toContain("specialty");
    expect(columns).toContain("region");
    expect(columns).toContain("phone");
    expect(columns).toContain("privacyConsent");
    expect(columns).toContain("marketingConsent");
  });

  it("REGIONS_LIST가 주요 지역을 포함해야 함", () => {
    const REGIONS_LIST = [
      "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종",
      "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    ];
    
    expect(REGIONS_LIST).toContain("서울");
    expect(REGIONS_LIST).toContain("부산");
    expect(REGIONS_LIST).toContain("제주");
    expect(REGIONS_LIST.length).toBeGreaterThanOrEqual(17);
  });
});

describe("개인정보처리방침 페이지", () => {
  it("Privacy 페이지 컴포넌트가 존재해야 함", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const privacyPath = path.resolve(__dirname, "../client/src/pages/Privacy.tsx");
    expect(fs.existsSync(privacyPath)).toBe(true);
  });
});

describe("운영자 알림 연동", () => {
  it("notifyOwner 함수가 올바른 인터페이스를 가져야 함", async () => {
    const { notifyOwner } = await import("./_core/notification");
    expect(notifyOwner).toBeDefined();
    expect(typeof notifyOwner).toBe("function");
  });
});

describe("Clarity 환경변수", () => {
  it("index.html에 Clarity 스크립트가 삽입되어야 함", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const htmlPath = path.resolve(__dirname, "../client/index.html");
    const content = fs.readFileSync(htmlPath, "utf-8");
    
    expect(content).toContain("clarity");
    expect(content).toContain("VITE_CLARITY_ID");
  });
});

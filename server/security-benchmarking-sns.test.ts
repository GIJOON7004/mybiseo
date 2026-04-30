import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── 1. 보안 강화 테스트 ───
describe("보안 강화 - 서버 헤더 은닉", () => {
  const serverIndexContent = readFileSync(
    resolve(__dirname, "_core/index.ts"),
    "utf-8"
  );

  it("X-Powered-By 헤더가 비활성화되어 있다", () => {
    expect(serverIndexContent).toMatch(/disable.*x-powered-by|app\.disable\s*\(\s*["']x-powered-by["']\s*\)/i);
  });

  it("X-Content-Type-Options 보안 헤더가 설정되어 있다", () => {
    expect(serverIndexContent).toContain("X-Content-Type-Options");
  });

  it("X-Frame-Options 보안 헤더가 설정되어 있다", () => {
    expect(serverIndexContent).toContain("X-Frame-Options");
  });

  it("Server 헤더가 제거되어 있다", () => {
    expect(serverIndexContent).toMatch(/removeHeader.*Server|Server.*removeHeader/i);
  });
});

describe("보안 강화 - 쿠키 이름 커스텀", () => {
  const constContent = readFileSync(
    resolve(__dirname, "../shared/const.ts"),
    "utf-8"
  );

  it("쿠키 이름이 기본값(app_session_id)이 아닌 커스텀 이름을 사용한다", () => {
    expect(constContent).toMatch(/COOKIE_NAME/);
    // 기본 이름이 아닌지 확인
    expect(constContent).not.toMatch(/COOKIE_NAME\s*=\s*["']app_session_id["']/);
  });

  it("쿠키 이름이 _mb_sid로 설정되어 있다", () => {
    expect(constContent).toMatch(/_mb_sid/);
  });
});

// ─── 2. 벤치마킹 리포트 테스트 ───
describe("프리미엄 벤치마킹 리포트 - DB 스키마", () => {
  const schemaContent = readFileSync(
    resolve(__dirname, "../drizzle/schema.ts"),
    "utf-8"
  );

  it("benchmarking_reports 테이블이 스키마에 정의되어 있다", () => {
    expect(schemaContent).toContain("benchmarking_reports");
  });

  it("hospitalName 컬럼이 존재한다", () => {
    expect(schemaContent).toMatch(/benchmarking_reports[\s\S]*?hospitalName|hospital_name/);
  });

  it("competitors 컬럼이 존재한다", () => {
    expect(schemaContent).toMatch(/benchmarking_reports[\s\S]*?competitors/);
  });

  it("actionableInsights 컬럼이 존재한다", () => {
    expect(schemaContent).toMatch(/benchmarking_reports[\s\S]*?actionable_insights|actionableInsights/);
  });

  it("snsMarketingTips 컬럼이 존재한다", () => {
    expect(schemaContent).toMatch(/benchmarking_reports[\s\S]*?sns_marketing_tips|snsMarketingTips/);
  });

  it("status 컬럼이 존재한다 (generating/completed/failed)", () => {
    expect(schemaContent).toMatch(/benchmarking_reports[\s\S]*?status/);
  });
});

describe("프리미엄 벤치마킹 리포트 - DB 헬퍼", () => {
  const dbContent = readFileSync(
    resolve(__dirname, "db.ts"),
    "utf-8"
  );

  it("createBenchmarkingReport 함수가 존재한다", () => {
    expect(dbContent).toContain("createBenchmarkingReport");
  });

  it("getBenchmarkingReportsByUser 함수가 존재한다", () => {
    expect(dbContent).toContain("getBenchmarkingReportsByUser");
  });

  it("getBenchmarkingReportById 함수가 존재한다", () => {
    expect(dbContent).toContain("getBenchmarkingReportById");
  });

  it("updateBenchmarkingReport 함수가 존재한다", () => {
    expect(dbContent).toContain("updateBenchmarkingReport");
  });
});

describe("프리미엄 벤치마킹 리포트 - tRPC 라우터", () => {
  const routersContent = readRouterSource();

  it("benchmarkingReport 라우터가 존재한다", () => {
    expect(routersContent).toMatch(/benchmarkingReport\s*:/);
  });

  it("generate 프로시저가 존재한다", () => {
    expect(routersContent).toMatch(/benchmarkingReport[\s\S]*?generate\s*:/);
  });

  it("list 프로시저가 존재한다", () => {
    expect(routersContent).toMatch(/benchmarkingReport[\s\S]*?list\s*:/);
  });

  it("getById 프로시저가 존재한다", () => {
    expect(routersContent).toMatch(/benchmarkingReport[\s\S]*?getById\s*:/);
  });

  it("hospitalUrl 입력을 받는다", () => {
    expect(routersContent).toMatch(/benchmarkingReport[\s\S]*?hospitalUrl/);
  });

  it("AI(invokeLLM)를 사용하여 Actionable Insights를 생성한다", () => {
    expect(routersContent).toMatch(/benchmarkingReport[\s\S]*?invokeLLM/);
  });

  it("경쟁사 SEO 분석(analyzeSeo)을 수행한다", () => {
    expect(routersContent).toMatch(/benchmarkingReport[\s\S]*?analyzeSeo/);
  });
});

describe("프리미엄 벤치마킹 리포트 - UI", () => {
  const benchmarkingPage = readFileSync(
    resolve(__dirname, "../client/src/pages/BenchmarkingReport.tsx"),
    "utf-8"
  );

  it("BenchmarkingReport 페이지가 존재한다", () => {
    expect(benchmarkingPage).toBeTruthy();
  });

  it("trpc.benchmarking을 사용한다", () => {
    expect(benchmarkingPage).toMatch(/trpc\.benchmarking/);
  });

  it("리포트 생성 폼이 존재한다", () => {
    expect(benchmarkingPage).toMatch(/hospitalUrl|병원 URL|hospitalName|병원명/);
  });

  it("경쟁사 비교 데이터를 표시한다", () => {
    expect(benchmarkingPage).toMatch(/categoryComparison|카테고리별|경쟁사/);
  });

  it("Actionable Insights를 표시한다", () => {
    expect(benchmarkingPage).toMatch(/actionableInsights|실행 지침|Actionable/);
  });
});

describe("프리미엄 벤치마킹 리포트 - 사이드바 메뉴", () => {
  const dashboardLayout = readFileSync(
    resolve(__dirname, "../client/src/components/DashboardLayout.tsx"),
    "utf-8"
  );

  it("벤치마킹 리포트 메뉴가 사이드바에 존재한다", () => {
    expect(dashboardLayout).toContain("벤치마킹 리포트");
  });

  it("벤치마킹 리포트 경로가 /admin/benchmarking이다", () => {
    expect(dashboardLayout).toContain("/admin/benchmarking");
  });
});

describe("프리미엄 벤치마킹 리포트 - App.tsx 라우트", () => {
  const appContent = readFileSync(
    resolve(__dirname, "../client/src/App.tsx"),
    "utf-8"
  );

  it("BenchmarkingReport 라우트가 등록되어 있다", () => {
    expect(appContent).toContain("BenchmarkingReport");
  });

  it("/admin/benchmarking 경로가 등록되어 있다", () => {
    expect(appContent).toContain("/admin/benchmarking");
  });
});

// ─── 3. SNS 마케팅 팁 테스트 ───
describe("진단서 SNS 마케팅 팁 - 컴포넌트", () => {
  const snsComponent = readFileSync(
    resolve(__dirname, "../client/src/components/SnsMarketingTips.tsx"),
    "utf-8"
  );

  it("SnsMarketingTips 컴포넌트가 존재한다", () => {
    expect(snsComponent).toBeTruthy();
  });

  it("네이버 블로그 팁이 포함되어 있다", () => {
    expect(snsComponent).toContain("네이버 블로그");
  });

  it("인스타그램 팁이 포함되어 있다", () => {
    expect(snsComponent).toContain("인스타그램");
  });

  it("카카오 톡채널 팁이 포함되어 있다", () => {
    expect(snsComponent).toContain("카카오 톡채널");
  });

  it("구글 비즈니스 프로필 팁이 조건부로 포함되어 있다", () => {
    expect(snsComponent).toContain("구글 비즈니스 프로필");
  });

  it("진료과 기반 키워드를 동적으로 생성한다", () => {
    expect(snsComponent).toMatch(/specialty/);
  });

  it("벤치마킹 리포트로의 CTA 링크가 있다", () => {
    expect(snsComponent).toContain("/admin/benchmarking");
  });
});

describe("진단서 SNS 마케팅 팁 - SeoChecker 통합", () => {
  const seoCheckerContent = readFileSync(
    resolve(__dirname, "../client/src/pages/SeoChecker.tsx"),
    "utf-8"
  );

  it("SnsMarketingTipsSection이 import되어 있다", () => {
    expect(seoCheckerContent).toContain("SnsMarketingTipsSection");
  });

  it("SnsMarketingTipsSection이 결과 섹션에서 렌더링된다", () => {
    expect(seoCheckerContent).toMatch(/<SnsMarketingTipsSection/);
  });

  it("자동 최적화 계획 이후에 배치되어 있다", () => {
    // import는 상단에 있으므로, JSX 렌더링 부분에서의 위치를 확인
    const autoOptJsxIdx = seoCheckerContent.indexOf("<AutoOptimizationPlan");
    const snsJsxIdx = seoCheckerContent.indexOf("<SnsMarketingTipsSection");
    expect(snsJsxIdx).toBeGreaterThan(autoOptJsxIdx);
  });
});

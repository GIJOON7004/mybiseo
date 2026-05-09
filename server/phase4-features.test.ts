import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const clientSrc = resolve(__dirname, "../client/src");
const serverDir = resolve(__dirname, "../server");

function readFile(path: string) {
  return readFileSync(path, "utf-8");
}

describe("Phase 4: A/B 테스트 인프라", () => {
  it("ab_experiments 테이블이 drizzle schema에 정의됨", () => {
    const schema = readFile(resolve(__dirname, "../drizzle/schema.ts"));
    expect(schema).toContain("abExperiments");
    expect(schema).toContain("targetElement");
  });

  it("ab_variants 테이블이 drizzle schema에 정의됨", () => {
    const schema = readFile(resolve(__dirname, "../drizzle/schema.ts"));
    expect(schema).toContain("abVariants");
    expect(schema).toContain("weight");
  });

  it("abEvents 테이블이 drizzle schema에 정의됨", () => {
    const schema = readFile(resolve(__dirname, "../drizzle/schema.ts"));
    expect(schema).toContain("abEvents");
    expect(schema).toContain("eventType");
  });

  it("A/B 테스트 라우터 파일이 존재함", () => {
    expect(existsSync(resolve(serverDir, "routes/abtest.ts"))).toBe(true);
  });

  it("A/B 테스트 라우터가 routers.ts에 등록됨", () => {
    const routers = readFile(resolve(serverDir, "routers.ts"));
    expect(routers).toContain("abtestRouter");
  });

  it("db.ts에 A/B 테스트 헬퍼 함수가 존재함", () => {
    const db = readFile(resolve(serverDir, "db.ts"));
    expect(db).toContain("getAbExperiments");
    expect(db).toContain("recordAbEvent");
  });
});

describe("Phase 4: 블로그 허브 개편", () => {
  it("Blog.tsx에 카테고리 필터가 존재함", () => {
    const blog = readFile(resolve(clientSrc, "pages/Blog.tsx"));
    expect(blog).toContain("category");
    expect(blog).toMatch(/카테고리|필터|filter/i);
  });

  it("Blog.tsx에 검색 기능이 존재함", () => {
    const blog = readFile(resolve(clientSrc, "pages/Blog.tsx"));
    expect(blog).toMatch(/search|검색/i);
  });

  it("Blog.tsx에 페이지네이션이 존재함", () => {
    const blog = readFile(resolve(clientSrc, "pages/Blog.tsx"));
    expect(blog).toMatch(/page|페이지|pagination/i);
  });

  it("Blog.tsx에 SEO 메타데이터가 적용됨", () => {
    const blog = readFile(resolve(clientSrc, "pages/Blog.tsx"));
    expect(blog).toContain("useSEO");
  });
});

describe("Phase 4: 진단 자동화 고도화", () => {
  it("diagnosis-automation.ts 모듈이 존재함", () => {
    expect(existsSync(resolve(serverDir, "diagnosis-automation.ts"))).toBe(true);
  });

  it("진단 자동화 설정 테이블이 schema에 정의됨", () => {
    const schema = readFile(resolve(__dirname, "../drizzle/schema.ts"));
    expect(schema).toContain("diagnosisAutomationConfig");
    expect(schema).toContain("dailyThreshold");
    expect(schema).toContain("autoSendEnabled");
  });

  it("품질 검증 로직이 포함됨", () => {
    const automation = readFile(resolve(serverDir, "diagnosis-automation.ts"));
    expect(automation).toContain("QualityCheckResult");
    expect(automation).toContain("qualityMinScore");
    expect(automation).toContain("passed");
  });

  it("일일 건수 기반 자동/수동 모드 전환 로직이 있음", () => {
    const automation = readFile(resolve(serverDir, "diagnosis-automation.ts"));
    expect(automation).toContain("dailyThreshold");
    expect(automation).toContain("isAboveThreshold");
    expect(automation).toMatch(/auto.*review|mode/);
  });

  it("db.ts에 진단 자동화 헬퍼가 존재함", () => {
    const db = readFile(resolve(serverDir, "db.ts"));
    expect(db).toContain("getDiagnosisAutomationConfig");
    expect(db).toContain("getDailyDiagnosisCount");
  });
});

describe("Phase 4: 치과 랜딩페이지 (/dental)", () => {
  const dental = readFile(resolve(clientSrc, "pages/LandingDental.tsx"));

  it("치과 전용 랜딩페이지 파일이 존재함", () => {
    expect(existsSync(resolve(clientSrc, "pages/LandingDental.tsx"))).toBe(true);
  });

  it("치과 관련 키워드가 포함됨", () => {
    expect(dental).toContain("임플란트");
    expect(dental).toContain("치과");
  });

  it("Pain Points 섹션이 있음", () => {
    expect(dental).toContain("painPoints");
    expect(dental).toContain("이런 고민");
  });

  it("솔루션 섹션이 있음", () => {
    expect(dental).toContain("solutions");
    expect(dental).toContain("MY비서가 해결");
  });

  it("케이스 스터디가 포함됨", () => {
    expect(dental).toContain("caseStudy");
    expect(dental).toContain("성공 사례");
  });

  it("FAQ 섹션이 있음", () => {
    expect(dental).toContain("faqs");
    expect(dental).toContain("자주 묻는 질문");
  });

  it("CTA가 AI 진단으로 연결됨", () => {
    expect(dental).toContain("/ai-check");
    expect(dental).toContain("무료 AI 노출 진단");
  });

  it("Service Schema JSON-LD가 적용됨", () => {
    expect(dental).toContain("useSEO");
    expect(dental).toContain("schema.org");
    expect(dental).toContain("치과 디지털 마케팅");
  });

  it("App.tsx에 /dental 라우트가 등록됨", () => {
    const app = readFile(resolve(clientSrc, "App.tsx"));
    expect(app).toContain('"/dental"');
    expect(app).toContain("LandingDental");
  });
});

describe("Phase 4: 피부과 랜딩페이지 (/dermatology)", () => {
  const derma = readFile(resolve(clientSrc, "pages/LandingDermatology.tsx"));

  it("피부과 전용 랜딩페이지 파일이 존재함", () => {
    expect(existsSync(resolve(clientSrc, "pages/LandingDermatology.tsx"))).toBe(true);
  });

  it("피부과 관련 키워드가 포함됨", () => {
    expect(derma).toContain("보톡스");
    expect(derma).toContain("피부과");
    expect(derma).toContain("레이저");
  });

  it("의료광고 컴플라이언스 관련 내용이 있음", () => {
    expect(derma).toContain("컴플라이언스");
    expect(derma).toContain("심의");
  });

  it("Pain Points 섹션이 있음", () => {
    expect(derma).toContain("painPoints");
    expect(derma).toContain("전후사진 광고 규제");
  });

  it("솔루션 섹션이 있음", () => {
    expect(derma).toContain("solutions");
    expect(derma).toContain("피부과 솔루션");
  });

  it("케이스 스터디가 포함됨", () => {
    expect(derma).toContain("caseStudy");
    expect(derma).toContain("성공 사례");
  });

  it("시술 분야 목록이 있음", () => {
    expect(derma).toContain("procedures");
    expect(derma).toContain("여드름 치료");
    expect(derma).toContain("안티에이징");
  });

  it("CTA가 AI 진단으로 연결됨", () => {
    expect(derma).toContain("/ai-check");
    expect(derma).toContain("무료 AI 노출 진단");
  });

  it("Service Schema JSON-LD가 적용됨", () => {
    expect(derma).toContain("useSEO");
    expect(derma).toContain("schema.org");
    expect(derma).toContain("피부과 디지털 마케팅");
  });

  it("App.tsx에 /dermatology 라우트가 등록됨", () => {
    const app = readFile(resolve(clientSrc, "App.tsx"));
    expect(app).toContain('"/dermatology"');
    expect(app).toContain("LandingDermatology");
  });
});

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const CLIENT_DIR = path.resolve(__dirname, "../client/src");
const DOCS_DIR = path.resolve(__dirname, "../docs");

describe("A-1: 릴스 체험 모드 바이럴 분석 강화", () => {
  it("서버 프롬프트에 hookType, storytellingStructure, format 필드가 포함되어야 한다", () => {
    const routerFile = fs.readFileSync(
      path.resolve(__dirname, "routes/interviewContent.ts"),
      "utf-8"
    );
    expect(routerFile).toContain("hookType");
    expect(routerFile).toContain("storytellingStructure");
    expect(routerFile).toContain("format");
  });

  it("프론트엔드 UI에 바이럴 분석 3가지 분리 표시가 있어야 한다", () => {
    const reelsSection = fs.readFileSync(
      path.resolve(CLIENT_DIR, "components/ReelsTrialSection.tsx"),
      "utf-8"
    );
    expect(reelsSection).toContain("hookType");
    expect(reelsSection).toContain("storytellingStructure");
    expect(reelsSection).toContain("format");
  });
});

describe("A-2: 의료법 준수 체크 단계", () => {
  it("서버 프롬프트에 의료법 준수 관련 필드가 포함되어야 한다", () => {
    const routerFile = fs.readFileSync(
      path.resolve(__dirname, "routes/interviewContent.ts"),
      "utf-8"
    );
    expect(routerFile).toContain("medicalLawCompliance");
  });

  it("프론트엔드 UI에 의료법 준수 카드가 있어야 한다", () => {
    const reelsSection = fs.readFileSync(
      path.resolve(CLIENT_DIR, "components/ReelsTrialSection.tsx"),
      "utf-8"
    );
    expect(reelsSection).toContain("의료광고법");
  });
});

describe("A-3: 경쟁사 트렌드 인사이트 카드", () => {
  it("서버 프롬프트에 경쟁사 트렌드 인사이트 필드가 포함되어야 한다", () => {
    const routerFile = fs.readFileSync(
      path.resolve(__dirname, "routes/interviewContent.ts"),
      "utf-8"
    );
    expect(routerFile).toContain("competitorTrendInsight");
  });

  it("프론트엔드 UI에 트렌드 인사이트 카드가 있어야 한다", () => {
    const reelsSection = fs.readFileSync(
      path.resolve(CLIENT_DIR, "components/ReelsTrialSection.tsx"),
      "utf-8"
    );
    expect(reelsSection).toContain("트렌드");
  });
});

describe("A-6: Stakes(실패의 위험) 섹션", () => {
  it("StakesSection.tsx 파일이 존재해야 한다", () => {
    const filePath = path.resolve(CLIENT_DIR, "components/StakesSection.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("StakesSection에 구체적 숫자가 포함되어야 한다", () => {
    const content = fs.readFileSync(
      path.resolve(CLIENT_DIR, "components/StakesSection.tsx"),
      "utf-8"
    );
    // 숫자 기반 긴박함 전달 확인
    expect(content).toMatch(/\d+%|\d+명|\d+억/);
  });

  it("Home.tsx에서 StakesSection이 import되어야 한다", () => {
    const homeContent = fs.readFileSync(
      path.resolve(CLIENT_DIR, "pages/Home.tsx"),
      "utf-8"
    );
    expect(homeContent).toContain("StakesSection");
  });
});

describe("A-7: 공감(Empathy) 섹션", () => {
  it("EmpathySection.tsx 파일이 존재해야 한다", () => {
    const filePath = path.resolve(CLIENT_DIR, "components/EmpathySection.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("EmpathySection에 공감 메시지가 포함되어야 한다", () => {
    const content = fs.readFileSync(
      path.resolve(CLIENT_DIR, "components/EmpathySection.tsx"),
      "utf-8"
    );
    // 원장님의 고민에 공감하는 메시지 확인
    expect(content).toMatch(/원장님|고민|불안|답답/);
  });

  it("EmpathySection.tsx 레거시 파일이 존재해야 한다 (Home에서는 Phase 2에서 제거됨)", () => {
    const filePath = path.resolve(CLIENT_DIR, "components/EmpathySection.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("C-2: 바이럴 공식 요약 카드", () => {
  it("ReelsTrialSection에 viralFormula 관련 UI가 있어야 한다", () => {
    const reelsSection = fs.readFileSync(
      path.resolve(CLIENT_DIR, "components/ReelsTrialSection.tsx"),
      "utf-8"
    );
    expect(reelsSection).toContain("viralFormula");
  });
});

describe("B 항목: 서비스 전략 문서", () => {
  it("B-1: 메디컬 숏폼 아웃라이어 DB 구축 전략 문서가 존재해야 한다", () => {
    const files = fs.readdirSync(DOCS_DIR);
    const hasB1 = files.some((f) => f.includes("B1") || f.includes("아웃라이어"));
    expect(hasB1).toBe(true);
  });

  it("B-2: 의료법 준수 프롬프트 엔지니어링 전략 문서가 존재해야 한다", () => {
    const files = fs.readdirSync(DOCS_DIR);
    const hasB2 = files.some((f) => f.includes("B2") || f.includes("의료법"));
    expect(hasB2).toBe(true);
  });

  it("B-6: BrandScript 메시징 통일 가이드 문서가 존재해야 한다", () => {
    const files = fs.readdirSync(DOCS_DIR);
    const hasB6 = files.some((f) => f.includes("B6") || f.includes("BrandScript"));
    expect(hasB6).toBe(true);
  });

  it("B-7: 성공 섹션 3가지 유형 전략 문서가 존재해야 한다", () => {
    const files = fs.readdirSync(DOCS_DIR);
    const hasB7 = files.some((f) => f.includes("B7") || f.includes("성공"));
    expect(hasB7).toBe(true);
  });
});

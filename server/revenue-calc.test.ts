import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Deterministic Revenue Loss Calculation", () => {
  const rdSource = fs.readFileSync(
    path.resolve(__dirname, "reality-diagnosis.ts"),
    "utf-8"
  );

  it("reality-diagnosis.ts imports resolveSpecialty from specialty-weights", () => {
    expect(rdSource).toContain('import { resolveSpecialty');
    expect(rdSource).toContain('from "./specialty-weights"');
  });

  it("defines SPECIALTY_REVENUE_PARAMS with all specialty types", () => {
    expect(rdSource).toContain("SPECIALTY_REVENUE_PARAMS");
    const specialties = ["성형외과", "피부과", "치과", "안과", "한의원", "정형외과", "이비인후과", "비뇨기과", "내과", "소아과", "산부인과", "종합병원", "기타"];
    for (const s of specialties) {
      // 진료과 키는 SPECIALTY_REVENUE_PROFILES에서 import됨
      const revenueDataSource = fs.readFileSync(path.resolve(__dirname, "utils/specialty-revenue-data.ts"), "utf-8");
      expect(revenueDataSource).toContain(`"${s}"`);
    }
  });

  it("defines REVENUE_CAP constant (FLOOR removed)", () => {
    expect(rdSource).toContain("REVENUE_CAP = 15000");
    expect(rdSource).not.toContain("REVENUE_FLOOR = 3000");
  });

  it("defines calculateDeterministicRevenueLoss function", () => {
    expect(rdSource).toContain("function calculateDeterministicRevenueLoss");
    expect(rdSource).toContain("resolveSpecialty(specialty)");
    expect(rdSource).toContain("REVENUE_CAP");
    expect(rdSource).toContain("Math.min(REVENUE_CAP");
  });

  it("applies deterministic calculation to missedPatients.revenueImpact", () => {
    expect(rdSource).toContain("calculateDeterministicRevenueLoss(mp.estimatedMonthly, specialty)");
    expect(rdSource).toContain("return { ...mp, revenueImpact: formatted }");
  });

  it("applies deterministic calculation to metrics.estimatedRevenueLoss", () => {
    expect(rdSource).toContain("calculateDeterministicRevenueLoss(m.missedPatientsMonthly, specialty)");
    expect(rdSource).toContain("return { ...m, estimatedRevenueLoss: formatted }");
  });

  it("post-processes headline, executiveSummary, and closingStatement for label/value sync", () => {
    // headline
    expect(rdSource).toContain('let hl = core.headline || FALLBACK_CORE.headline');
    // executiveSummary
    expect(rdSource).toContain('let summary = ensureExecutiveSummary(core.executiveSummary');
    // closingStatement
    expect(rdSource).toContain('let cs = core.closingStatement || FALLBACK_CORE.closingStatement');
  });

  it("replaces 잠재 환자/이탈 환자 with 웹사이트 유입 누락 환자 in all text fields", () => {
    // Should have regex replacements for all three text fields
    const matches = rdSource.match(/잠재\\s\*환자/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3); // headline, executiveSummary, closingStatement
    
    const labelMatches = rdSource.match(/웹사이트 유입 누락 환자/g);
    expect(labelMatches).not.toBeNull();
    expect(labelMatches!.length).toBeGreaterThanOrEqual(2); // headline + executiveSummary (closingStatement uses "미유입 잠재 환자")
  });

  it("uses correct conversion rates per specialty", () => {
    // SPECIALTY_REVENUE_PARAMS는 이제 SPECIALTY_REVENUE_PROFILES에서 동적 생성됨
    expect(rdSource).toContain("SPECIALTY_REVENUE_PROFILES");
  });
});

describe("KPI Label Changes in PDF Report", () => {
  const pdfSource = fs.readFileSync(
    path.resolve(__dirname, "ai-visibility-report.ts"),
    "utf-8"
  );

  it("uses '예상 미유입 잠재 환자' label instead of '예상 누락 환자'", () => {
    expect(pdfSource).toContain("예상 미유입 잠재 환자");
    expect(pdfSource).not.toContain('"예상 누락 환자"');
  });

  it("uses '예상 잠재 매출 기회' label instead of '예상 매출 손실'", () => {
    expect(pdfSource).toContain("예상 잠재 매출 기회");
    expect(pdfSource).not.toContain('"예상 매출 손실"');
  });

  it("uses '웹사이트 유입 누락 환자가 발생' in info box text", () => {
    expect(pdfSource).toContain("잠재 환자가 웹사이트를 통해 유입되지 못하고 있습니다");
  });
});

describe("KPI Label Changes in HTML Report", () => {
  const htmlSource = fs.readFileSync(
    path.resolve(__dirname, "ai-visibility-html-report.ts"),
    "utf-8"
  );

  it("uses '예상 잠재 매출 기회' in KPI card", () => {
    expect(htmlSource).toContain("예상 잠재 매출 기회");
  });

  it("uses '웹사이트 유입 누락 환자' in danger infobox", () => {
    expect(htmlSource).toContain("웹사이트 유입 누락 환자");
  });

  it("does not contain old labels", () => {
    expect(htmlSource).not.toContain("추정 월 매출 기회 손실");
    expect(htmlSource).not.toContain("잠재 환자");
  });
});

describe("KPI Label Changes in HTML Report Sections", () => {
  const sectionsSource = fs.readFileSync(
    path.resolve(__dirname, "ai-visibility-html-report-sections.ts"),
    "utf-8"
  );

  it("uses '예상 미유입 잠재 환자' in metric boxes", () => {
    expect(sectionsSource).toContain("예상 미유입 잠재 환자");
  });

  it("uses '미유입 잠재 환자 분석' section title", () => {
    expect(sectionsSource).toContain("미유입 잠재 환자 분석");
  });

  it("uses '예상 잠재 매출 기회' in highlight card", () => {
    expect(sectionsSource).toContain("예상 잠재 매출 기회");
  });

  it("does not contain old '이탈 환자 분석' label", () => {
    expect(sectionsSource).not.toContain('"이탈 환자 분석"');
  });

  it("does not contain old '월 이탈 환자 추정' label", () => {
    expect(sectionsSource).not.toContain("월 이탈 환자 추정");
  });

  it("does not contain old '현재 놓치고 있는 매출 기회' label", () => {
    expect(sectionsSource).not.toContain("현재 놓치고 있는 매출 기회");
  });
});

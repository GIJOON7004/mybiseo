/**
 * 1단계 개선사항 테스트
 * #1 필수 페이지 직접 탐색
 * #8 User-Agent 표준화
 * #14 검사 항목 ID 체계 표준화
 * #19 소수점 반올림 규칙 통일
 * #22 executiveSummary 템플릿화
 * #26 LLM temperature 최소화
 */
import { describe, expect, it } from "vitest";
import { displayScore, displayPercent, formatPercent, formatScoreDisplay } from "./utils/score-rounding";
import { toStandardId, enrichWithStandardIds, getCategoryCode } from "./utils/item-id-registry";
import { generateTemplatedSummary, ensureExecutiveSummary, type SummaryContext } from "./utils/executive-summary-template";

// ── #19 소수점 반올림 규칙 통일 ──
describe("#19 소수점 반올림 규칙 통일", () => {
  it("displayScore: 점수를 정수로 반올림", () => {
    expect(displayScore(73.6)).toBe(74);
    expect(displayScore(73.4)).toBe(73);
    expect(displayScore(50.5)).toBe(51);
    expect(displayScore(0)).toBe(0);
    expect(displayScore(100)).toBe(100);
  });

  it("displayPercent: 백분율을 소수점 1자리로 반올림", () => {
    expect(displayPercent(87.35)).toBe(87.4);
    expect(displayPercent(87.34)).toBe(87.3);
    expect(displayPercent(100.0)).toBe(100);
    expect(displayPercent(0.0)).toBe(0);
  });

  it("formatPercent: 비율을 백분율 문자열로 변환", () => {
    expect(formatPercent(0.873)).toBe("87.3%");
    expect(formatPercent(1.0)).toBe("100%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("formatScoreDisplay: X/Y 형태로 표시", () => {
    expect(formatScoreDisplay(73.6, 100)).toBe("74/100");
    expect(formatScoreDisplay(45.2, 50)).toBe("45/50");
  });
});

// ── #14 검사 항목 ID 체계 표준화 ──
describe("#14 검사 항목 ID 체계 표준화", () => {
  it("기존 ID를 표준 ID로 변환", () => {
    expect(toStandardId("meta-title")).toBe("A01");
    expect(toStandardId("content-h1")).toBe("B01");
    expect(toStandardId("tech-ssl")).toBe("C01");
    expect(toStandardId("social-og")).toBe("D01");
    expect(toStandardId("naver-verification")).toBe("F01");
  });

  it("매핑 없는 ID는 카테고리 기반 자동 생성", () => {
    const id = toStandardId("unknown-item", "메타 태그");
    expect(id).toMatch(/^A\d{2}$/);
  });

  it("getCategoryCode: 카테고리명으로 코드 조회", () => {
    expect(getCategoryCode("메타 태그")).toBe("A");
    expect(getCategoryCode("콘텐츠")).toBe("B");
    expect(getCategoryCode("기술적 SEO")).toBe("C");
    expect(getCategoryCode("알 수 없는 카테고리")).toBe("L");
  });

  it("enrichWithStandardIds: 배열에 standardId 부여", () => {
    const items = [
      { id: "meta-title", category: "메타 태그", status: "pass" as const },
      { id: "content-h1", category: "콘텐츠", status: "fail" as const },
      { id: "custom-item", category: "기술적 SEO", status: "warning" as const },
    ];
    const enriched = enrichWithStandardIds(items);
    expect(enriched[0].standardId).toBe("A01");
    expect(enriched[1].standardId).toBe("B01");
    expect(enriched[2].standardId).toMatch(/^C\d{2}$/);
    // 원본 필드 유지
    expect(enriched[0].id).toBe("meta-title");
    expect(enriched[0].status).toBe("pass");
  });
});

// ── #22 executiveSummary 템플릿화 ──
describe("#22 executiveSummary 템플릿화", () => {
  const mockCtx: SummaryContext = {
    hospitalName: "테스트 치과",
    specialty: "치과",
    seoScore: 43,
    seoGrade: "D",
    missedPatientsMonthly: 150,
    revenueLossFormatted: "월 약 4,500만원",
    naverExposureRate: 20,
    googleExposureRate: 15,
    aiReadiness: 10,
    keyIssuesCount: 5,
    topIssue: "Schema Markup 미설정",
  };

  it("generateTemplatedSummary: 코드 기반 요약 생성", () => {
    const summary = generateTemplatedSummary(mockCtx);
    expect(summary).toContain("테스트 치과");
    expect(summary).toContain("43점");
    expect(summary).toContain("D 등급");
    expect(summary).toContain("150명");
    expect(summary).toContain("월 약 4,500만원");
    expect(summary).toContain("5개의 개선 과제");
    expect(summary.length).toBeGreaterThan(50);
  });

  it("ensureExecutiveSummary: LLM 결과가 유효하면 그대로 반환", () => {
    const llmResult = "이것은 LLM이 생성한 충분히 긴 executive summary입니다. 여러 문장으로 구성됩니다.";
    const result = ensureExecutiveSummary(llmResult, mockCtx);
    expect(result).toBe(llmResult);
  });

  it("ensureExecutiveSummary: LLM 결과가 비어있으면 템플릿 사용", () => {
    const result = ensureExecutiveSummary("", mockCtx);
    expect(result).toContain("테스트 치과");
    expect(result).toContain("43점");
  });

  it("ensureExecutiveSummary: LLM 결과가 undefined면 템플릿 사용", () => {
    const result = ensureExecutiveSummary(undefined, mockCtx);
    expect(result).toContain("테스트 치과");
  });

  it("ensureExecutiveSummary: LLM 결과가 너무 짧으면 템플릿 사용", () => {
    const result = ensureExecutiveSummary("짧은 텍스트", mockCtx);
    expect(result).toContain("테스트 치과");
  });
});

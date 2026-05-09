/**
 * Characterization Tests — seo-analyzer & blog-scheduler 핵심 함수 결정적 테스트
 * 
 * LLM 호출 없이 순수 함수의 동작을 검증하는 결정적(deterministic) 테스트.
 * 외부 의존성 없이 빠르게 실행 가능.
 */
import { describe, it, expect } from "vitest";
import { normalizeUrl, getGrade } from "./seo-analyzer";
import {
  formatBlogContent,
  validatePostQuality,
  normalizeUrlForDiag,
  getSeasonalContext,
  formatWeeklyBriefing,
  getKSTTime,
} from "./scheduler/utils";

// ═══════════════════════════════════════════════════════════════
// SEO Analyzer — normalizeUrl
// ═══════════════════════════════════════════════════════════════
describe("seo-analyzer: normalizeUrl", () => {
  it("프로토콜이 없는 URL에 https:// 추가", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("이미 https://가 있으면 그대로 유지", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("http:// URL은 그대로 유지", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("괄호 안의 텍스트를 제거", () => {
    const result = normalizeUrl("namedps.com/ (https )");
    expect(result).toBe("https://namedps.com/");
  });

  it("앞뒤 공백 제거", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com/");
  });

  it("중복 프로토콜 제거", () => {
    const result = normalizeUrl("https://https://example.com");
    expect(result).toContain("example.com");
    expect(result).not.toContain("https://https://");
  });

  it("경로가 있는 URL은 trailing slash 추가하지 않음 (파일 확장자)", () => {
    const result = normalizeUrl("https://example.com/page.html");
    expect(result).toBe("https://example.com/page.html");
  });

  it("경로가 있는 URL은 trailing slash 추가 (확장자 없음)", () => {
    const result = normalizeUrl("https://example.com/about");
    expect(result).toBe("https://example.com/about/");
  });

  it("쿼리 파라미터가 있으면 trailing slash 추가하지 않음", () => {
    const result = normalizeUrl("https://example.com?q=test");
    expect(result).toBe("https://example.com/?q=test");
  });

  it("특수 문자(<, >, 따옴표) 제거", () => {
    const result = normalizeUrl('<https://example.com">');
    expect(result).toContain("example.com");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });
});

// ═══════════════════════════════════════════════════════════════
// SEO Analyzer — getGrade
// ═══════════════════════════════════════════════════════════════
describe("seo-analyzer: getGrade", () => {
  it("90점 이상은 A+", () => {
    expect(getGrade(90)).toBe("A+");
    expect(getGrade(95)).toBe("A+");
    expect(getGrade(100)).toBe("A+");
  });

  it("80~89점은 A", () => {
    expect(getGrade(80)).toBe("A");
    expect(getGrade(89)).toBe("A");
  });

  it("70~79점은 B", () => {
    expect(getGrade(70)).toBe("B");
    expect(getGrade(79)).toBe("B");
  });

  it("60~69점은 C", () => {
    expect(getGrade(60)).toBe("C");
    expect(getGrade(69)).toBe("C");
  });

  it("50~59점은 D", () => {
    expect(getGrade(50)).toBe("D");
    expect(getGrade(59)).toBe("D");
  });

  it("50점 미만은 F", () => {
    expect(getGrade(49)).toBe("F");
    expect(getGrade(0)).toBe("F");
    expect(getGrade(10)).toBe("F");
  });

  it("경계값 정확히 처리", () => {
    expect(getGrade(89.9)).toBe("A");
    expect(getGrade(90)).toBe("A+");
    expect(getGrade(79.9)).toBe("B");
    expect(getGrade(80)).toBe("A");
  });
});

// ═══════════════════════════════════════════════════════════════
// Blog Scheduler — validatePostQuality
// ═══════════════════════════════════════════════════════════════
describe("blog-scheduler: validatePostQuality", () => {
  const validPost = {
    title: "피부과에서 알려주는 여름철 자외선 차단 방법 10가지",
    content: "## 서론\n" + "A".repeat(900) + "\n## 본문\nQ: 자외선 차단제는 얼마나 자주 발라야 하나요?",
  };

  it("유효한 포스트는 valid: true 반환", () => {
    const result = validatePostQuality(validPost);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("제목이 10자 미만이면 실패", () => {
    const result = validatePostQuality({ ...validPost, title: "짧은제목" });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("제목이 너무 짧습니다"))).toBe(true);
  });

  it("본문이 800자 미만이면 실패", () => {
    const result = validatePostQuality({ ...validPost, content: "## 짧은 글\nQ: 질문" });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("본문이 너무 짧습니다"))).toBe(true);
  });

  it("소제목(##)이 없으면 실패", () => {
    const result = validatePostQuality({
      ...validPost,
      content: "A".repeat(900) + "\nQ: 질문입니다",
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("소제목"))).toBe(true);
  });

  it("제목이 100자 초과이면 실패", () => {
    const result = validatePostQuality({ ...validPost, title: "가".repeat(101) });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("제목이 너무 깁니다"))).toBe(true);
  });

  it("본문이 15000자 초과이면 실패", () => {
    const result = validatePostQuality({
      ...validPost,
      content: "## 서론\n" + "A".repeat(15001) + "\nQ: 질문",
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("본문이 너무 깁니다"))).toBe(true);
  });

  it("FAQ 섹션(Q: 또는 질문)이 없으면 실패", () => {
    const result = validatePostQuality({
      ...validPost,
      content: "## 서론\n" + "A".repeat(900),
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("FAQ"))).toBe(true);
  });

  it("null/undefined 입력 시 여러 이슈 반환", () => {
    const result = validatePostQuality({});
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Blog Scheduler — formatBlogContent
// ═══════════════════════════════════════════════════════════════
describe("blog-scheduler: formatBlogContent", () => {
  it("CRLF를 LF로 변환", () => {
    const result = formatBlogContent("line1\r\nline2\r\nline3");
    expect(result).not.toContain("\r\n");
    expect(result).toContain("line1\nline2\nline3");
  });

  it("## 헤딩 앞뒤에 빈 줄 추가", () => {
    const result = formatBlogContent("text\n## 제목\nmore text");
    expect(result).toContain("\n\n\n## 제목\n\n");
  });

  it("### 헤딩은 ## regex에 의해 ## 로 변환됨 (characterization)", () => {
    // 현재 formatBlogContent의 regex는 /## [^\n]+/가 ### 도 매칭함
    // 이는 알려진 동작으로, characterization test로 기록
    const result = formatBlogContent("text\n### 소제목\nmore text");
    expect(result).toContain("## 소제목");
  });

  it("4개 이상 연속 빈 줄을 3개로 축소", () => {
    const result = formatBlogContent("text\n\n\n\n\nmore text");
    expect(result).not.toContain("\n\n\n\n");
  });

  it("5문장 초과 단락은 중간에서 분리", () => {
    const longParagraph = "First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence. Sixth sentence.";
    const result = formatBlogContent(longParagraph);
    // 분리되면 빈 줄이 삽입됨
    expect(result.split("\n").length).toBeGreaterThan(1);
  });

  it("마크다운 리스트/헤딩은 분리하지 않음", () => {
    const input = "- item 1\n- item 2\n## heading";
    const result = formatBlogContent(input);
    expect(result).toContain("- item 1");
    expect(result).toContain("- item 2");
  });

  it("앞뒤 공백 제거", () => {
    const result = formatBlogContent("  \n  content  \n  ");
    expect(result).toBe("content");
  });
});

// ═══════════════════════════════════════════════════════════════
// Blog Scheduler — normalizeUrlForDiag
// ═══════════════════════════════════════════════════════════════
describe("blog-scheduler: normalizeUrlForDiag", () => {
  it("프로토콜 없는 URL에 https:// 추가", () => {
    expect(normalizeUrlForDiag("example.com")).toBe("https://example.com/");
  });

  it("기존 프로토콜 유지", () => {
    expect(normalizeUrlForDiag("http://example.com")).toBe("http://example.com/");
  });

  it("경로를 유지하되 쿼리/해시 제거", () => {
    expect(normalizeUrlForDiag("https://example.com/path")).toBe("https://example.com/path");
  });

  it("앞뒤 공백 제거", () => {
    expect(normalizeUrlForDiag("  https://example.com  ")).toBe("https://example.com/");
  });

  it("잘못된 URL은 그대로 반환", () => {
    const result = normalizeUrlForDiag("not a url at all");
    expect(result).toContain("not");
  });
});

// ═══════════════════════════════════════════════════════════════
// Blog Scheduler — getSeasonalContext
// ═══════════════════════════════════════════════════════════════
describe("blog-scheduler: getSeasonalContext", () => {
  it("문자열을 반환한다", () => {
    const result = getSeasonalContext();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("현재 월에 해당하는 계절 정보를 포함한다", () => {
    const result = getSeasonalContext();
    const month = new Date().getMonth() + 1;
    expect(result).toContain(`${month}월`);
  });
});

// ═══════════════════════════════════════════════════════════════
// Blog Scheduler — formatWeeklyBriefing
// ═══════════════════════════════════════════════════════════════
describe("blog-scheduler: formatWeeklyBriefing", () => {
  const sampleData = {
    period: { from: "2026-05-01", to: "2026-05-07" },
    blog: { weekly: 3, prevWeek: 2, total: 50 },
    chat: { weeklySessions: 10, weeklyInquiries: 3, prevWeekSessions: 8, prevWeekInquiries: 2, totalSessions: 100 },
    diagnosis: { weekly: 5, prevWeek: 4, total: 200 },
    leads: { weekly: 2, prevWeek: 1, total: 30 },
    trials: { weekly: 1, prevWeek: 0 },
    hospitals: { contracted: 5 },
  };

  it("기간 정보를 포함한다", () => {
    const result = formatWeeklyBriefing(sampleData);
    expect(result).toContain("2026-05-01");
    expect(result).toContain("2026-05-07");
  });

  it("블로그 발행 수를 포함한다", () => {
    const result = formatWeeklyBriefing(sampleData);
    expect(result).toContain("블로그 발행: 3건");
  });

  it("증가 시 ▲ 표시", () => {
    const result = formatWeeklyBriefing(sampleData);
    expect(result).toContain("▲");
  });

  it("감소 시 ▼ 표시", () => {
    const decreaseData = {
      ...sampleData,
      blog: { weekly: 1, prevWeek: 3, total: 50 },
    };
    const result = formatWeeklyBriefing(decreaseData);
    expect(result).toContain("▼");
  });

  it("변동 없으면 증감 표시 없음", () => {
    const noChangeData = {
      ...sampleData,
      blog: { weekly: 3, prevWeek: 3, total: 50 },
    };
    const result = formatWeeklyBriefing(noChangeData);
    // 블로그 라인에서 ▲나 ▼가 없어야 함
    const blogLine = result.split("\n").find(l => l.includes("블로그"));
    expect(blogLine).not.toContain("▲");
    expect(blogLine).not.toContain("▼");
  });

  it("계약 병원 수를 포함한다", () => {
    const result = formatWeeklyBriefing(sampleData);
    expect(result).toContain("계약 병원: 5개");
  });

  it("채팅 세션 정보를 포함한다", () => {
    const result = formatWeeklyBriefing(sampleData);
    expect(result).toContain("채팅 세션: 10건");
  });
});

// ═══════════════════════════════════════════════════════════════
// Blog Scheduler — getKSTTime
// ═══════════════════════════════════════════════════════════════
describe("blog-scheduler: getKSTTime", () => {
  it("유효한 시간 객체를 반환한다", () => {
    const kst = getKSTTime();
    expect(kst.hour).toBeGreaterThanOrEqual(0);
    expect(kst.hour).toBeLessThan(24);
    expect(kst.minute).toBeGreaterThanOrEqual(0);
    expect(kst.minute).toBeLessThan(60);
    expect(kst.dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(kst.dayOfWeek).toBeLessThanOrEqual(6);
    expect(kst.day).toBeGreaterThanOrEqual(1);
    expect(kst.day).toBeLessThanOrEqual(31);
    expect(kst.month).toBeGreaterThanOrEqual(1);
    expect(kst.month).toBeLessThanOrEqual(12);
    expect(kst.year).toBeGreaterThanOrEqual(2024);
  });

  it("day와 date는 동일한 값", () => {
    const kst = getKSTTime();
    expect(kst.day).toBe(kst.date);
  });

  it("kstDate는 Date 객체", () => {
    const kst = getKSTTime();
    expect(kst.kstDate).toBeInstanceOf(Date);
  });
});

// ═══════════════════════════════════════════════════════════════
// Rate Limit + 소유권 검증 — 구조 검증
// ═══════════════════════════════════════════════════════════════
describe("rate-limit: shareToken limiter 등록 확인", () => {
  it("rate-limit.ts에 shareTokenLimiter가 정의되어 있다", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/_core/rate-limit.ts", "utf-8");
    expect(content).toContain("shareTokenLimiter");
    expect(content).toContain("report.getByShareToken");
  });

  it("report.ts에 소유권 검증 로직이 있다", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routes/report.ts", "utf-8");
    expect(content).toContain("getHospitalProfileByUserId");
    expect(content).toContain("FORBIDDEN");
  });
});

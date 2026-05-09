/**
 * AI Visibility 모듈 — Characterization 테스트
 * 
 * 추출된 모듈(types, constants, text-utils, score-calculator)의
 * 현재 동작을 스냅샷으로 고정하여 리팩토링 시 회귀를 방지.
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeReportText,
  escapeHtml,
  stripMarkdown,
  sanitizeHospitalName,
  cleanDisplayUrl,
} from "./text-utils";
import {
  getGrade,
  displayScore,
  scoreRatio,
  getScoreTrend,
} from "./score-calculator";
import {
  CAT_NAMES_KO,
  getGradeColor as constantsGetGradeColor,
  getCategoryName,
} from "./constants";

// ═══════════════════════════════════════════════════════
// text-utils 테스트
// ═══════════════════════════════════════════════════════
describe("text-utils: sanitizeReportText", () => {
  it("마크다운 볼드 기호를 제거한다", () => {
    expect(sanitizeReportText("**중요한** 내용")).toBe("중요한 내용");
  });

  it("마크다운 헤더 기호를 제거한다", () => {
    expect(sanitizeReportText("### 제목")).toBe("제목");
  });

  it("마크다운 링크를 텍스트만 남긴다", () => {
    expect(sanitizeReportText("[링크](https://example.com)")).toBe("링크");
  });

  it("null/undefined 입력을 안전하게 처리한다", () => {
    expect(sanitizeReportText(null as any)).toBe("");
    expect(sanitizeReportText(undefined as any)).toBe("");
    expect(sanitizeReportText("")).toBe("");
  });

  it("코드 블록 백틱을 제거한다", () => {
    expect(sanitizeReportText("`코드`")).toBe("코드");
  });
});

describe("text-utils: stripMarkdown", () => {
  it("마크다운 헤더를 제거한다", () => {
    expect(stripMarkdown("### 제목")).toBe("제목");
  });

  it("마크다운 링크를 텍스트만 남긴다", () => {
    expect(stripMarkdown("[링크](https://example.com)")).toBe("링크");
  });

  it("HTML 태그 잔존물을 제거한다", () => {
    expect(stripMarkdown("<b>볼드</b>")).toBe("볼드");
  });
});

describe("text-utils: escapeHtml", () => {
  it("HTML 특수문자를 이스케이프한다", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;"
    );
  });

  it("&를 &amp;로 변환한다", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });
});

describe("text-utils: sanitizeHospitalName", () => {
  it("병원명을 추출한다", () => {
    expect(sanitizeHospitalName("아름다운 미소 | 서울성형외과")).toBe("서울성형외과");
  });

  it("빈 입력을 안전하게 처리한다", () => {
    expect(sanitizeHospitalName("")).toBe("");
  });
});

describe("text-utils: cleanDisplayUrl", () => {
  it("프로토콜과 trailing slash를 제거한다", () => {
    expect(cleanDisplayUrl("https://example.com/")).toBe("example.com");
  });

  it("http도 제거한다", () => {
    expect(cleanDisplayUrl("http://test.co.kr/path")).toBe("test.co.kr/path");
  });
});

// ═══════════════════════════════════════════════════════
// score-calculator 테스트
// ═══════════════════════════════════════════════════════
describe("score-calculator: getGrade", () => {
  it("90점 이상은 A+ 등급", () => {
    expect(getGrade(95)).toBe("A+");
    expect(getGrade(90)).toBe("A+");
  });

  it("80-89점은 A 등급", () => {
    expect(getGrade(85)).toBe("A");
    expect(getGrade(80)).toBe("A");
  });

  it("70-79점은 B 등급", () => {
    expect(getGrade(75)).toBe("B");
    expect(getGrade(70)).toBe("B");
  });

  it("60-69점은 C 등급", () => {
    expect(getGrade(65)).toBe("C");
    expect(getGrade(60)).toBe("C");
  });

  it("50-59점은 D 등급", () => {
    expect(getGrade(55)).toBe("D");
    expect(getGrade(50)).toBe("D");
  });

  it("50점 미만은 F 등급", () => {
    expect(getGrade(49)).toBe("F");
    expect(getGrade(0)).toBe("F");
  });
});

describe("constants: getGradeColor", () => {
  it("각 등급에 대해 색상 문자열을 반환한다", () => {
    expect(constantsGetGradeColor("A")).toBeTruthy();
    expect(constantsGetGradeColor("B")).toBeTruthy();
    expect(constantsGetGradeColor("C")).toBeTruthy();
    expect(constantsGetGradeColor("D")).toBeTruthy();
    expect(constantsGetGradeColor("F")).toBeTruthy();
  });

  it("알 수 없는 등급에 대해 기본 색상을 반환한다", () => {
    expect(constantsGetGradeColor("X")).toBeTruthy();
  });
});

describe("score-calculator: displayScore", () => {
  it("점수를 정수로 반올림한다", () => {
    expect(displayScore(85.7)).toBe(86);
    expect(displayScore(85.3)).toBe(85);
  });

  it("음수도 그대로 반올림한다 (Math.round 동작)", () => {
    expect(displayScore(-5)).toBe(-5);
    expect(displayScore(105)).toBe(105);
  });
});

describe("score-calculator: scoreRatio", () => {
  it("점수/최대점수 비율을 0~1로 반환한다", () => {
    expect(scoreRatio(80, 100)).toBe(0.8);
    expect(scoreRatio(50, 100)).toBe(0.5);
  });

  it("최대점수가 0이면 0을 반환한다", () => {
    expect(scoreRatio(50, 0)).toBe(0);
  });

  it("1을 초과하면 1로 클램핑한다", () => {
    expect(scoreRatio(120, 100)).toBe(1);
  });
});

describe("score-calculator: getScoreTrend", () => {
  it("3점 이상 상승은 up", () => {
    expect(getScoreTrend(80, 75)).toBe("up");
  });

  it("3점 이상 하락은 down", () => {
    expect(getScoreTrend(70, 75)).toBe("down");
  });

  it("변화가 2점 이하면 stable", () => {
    expect(getScoreTrend(76, 75)).toBe("stable");
  });
});

// ═══════════════════════════════════════════════════════
// constants 테스트
// ═══════════════════════════════════════════════════════
describe("constants: CAT_NAMES_KO", () => {
  it("주요 카테고리가 정의되어 있다", () => {
    expect(Object.keys(CAT_NAMES_KO).length).toBeGreaterThan(0);
    expect(CAT_NAMES_KO["AI Citation"]).toBe("AI 검색 노출");
  });
});

describe("constants: getCategoryName", () => {
  it("언어별로 카테고리명을 반환한다", () => {
    expect(getCategoryName("AI Citation", "ko")).toBe("AI 검색 노출");
    expect(getCategoryName("AI Citation", "en")).toBe("AI Citation");
    expect(getCategoryName("AI Citation", "th")).toBe("การอ้างอิง AI");
  });

  it("알 수 없는 카테고리는 원본 이름을 반환한다", () => {
    expect(getCategoryName("Unknown", "ko")).toBe("Unknown");
  });
});

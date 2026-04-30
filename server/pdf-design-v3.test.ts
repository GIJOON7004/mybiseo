
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const REPORT_FILE = path.resolve(__dirname, "ai-visibility-html-report.ts");
const SECTIONS_FILE = path.resolve(__dirname, "ai-visibility-html-report-sections.ts");
const ENGINE_FILE = path.resolve(__dirname, "ai-visibility-html-engine.ts");

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

describe("HTML PDF 엔진 파일 존재 확인", () => {
  it("ai-visibility-html-report.ts 파일이 존재해야 한다", () => {
    expect(fs.existsSync(REPORT_FILE)).toBe(true);
  });

  it("ai-visibility-html-report-sections.ts 파일이 존재해야 한다", () => {
    expect(fs.existsSync(SECTIONS_FILE)).toBe(true);
  });

  it("ai-visibility-html-engine.ts 파일이 존재해야 한다", () => {
    expect(fs.existsSync(ENGINE_FILE)).toBe(true);
  });
});

describe("클로드 스펙 #1: 컬러 토큰 시스템", () => {
  it("--primary, --accent, --highlight CSS 변수가 정의되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain("--primary");
    expect(css).toContain("--accent");
    expect(css).toContain("--highlight");
  });

  it("--success, --warning, --danger 상태 컬러가 정의되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain("--success");
    expect(css).toContain("--warning");
    expect(css).toContain("--danger");
  });

  it("--gray-1, --gray-2, --gray-3 중립 컬러가 정의되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain("--gray-1");
    expect(css).toContain("--gray-2");
    expect(css).toContain("--gray-3");
  });
});

describe("클로드 스펙 #2: Pretendard 폰트", () => {
  it("엔진에서 Pretendard 웹폰트를 로드해야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).toContain("pretendard");
  });
});

describe("클로드 스펙 #3: 타이포그래피 계층", () => {
  it("CSS에 H1/H2/Body/Caption 4단계 규칙이 정의되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain("--h1:");
    expect(css).toContain("--h2:");
    expect(css).toContain("--body:");
    expect(css).toContain("--caption:");
  });
});

describe("클로드 스펙 #4: 섹션 헤더 번호 형식", () => {
  it("sectionTitle 함수에 sectionNum 파라미터가 있어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toMatch(/sectionTitle.*sectionNum/s);
  });

  it("섹션 번호가 sec-num 클래스로 렌더링되어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("sec-num");
  });
});

describe("클로드 스펙 #5: 상태 배지", () => {
  it("badge-pass, badge-warn, badge-fail CSS 클래스가 정의되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain(".badge-pass");
    expect(css).toContain(".badge-warn");
    expect(css).toContain(".badge-fail");
  });
});

describe("클로드 스펙 #6: 테이블 스타일", () => {
  it("data-table CSS 클래스가 정의되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain(".data-table");
  });

  it("테이블 헤더에 primary 배경색이 적용되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toMatch(/data-table.*th.*primary|th.*background.*primary/s);
  });
});

describe("클로드 스펙 #7: 페이지 헤더", () => {
  it("page-header에 브랜드 마크가 포함되어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("page-header");
    expect(content).toMatch(/MY비서/);
  });

  it("page-header에 하단 보더라인이 있어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toMatch(/page-header[^}]*border-bottom/s);
  });
});

describe("클로드 스펙 #8: 페이지 푸터", () => {
  it("페이지 번호에 page-num 클래스가 사용되어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("page-num");
  });

  it("CONFIDENTIAL 표시가 푸터에 포함되어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("CONFIDENTIAL");
  });
});

describe("클로드 스펙 #9: 커버 페이지", () => {
  it("커버에 primary 배경이 적용되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toMatch(/cover.*primary|\.cover.*background/s);
  });

  it("커버에 80pt 점수 표시가 있어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("80pt");
  });

  it("커버에 등급 배지가 있어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toMatch(/grade.*badge|gradeBadgeColor/);
  });

  it("커버에 통과/주의/실패 pills가 있어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toMatch(/coverPassed.*coverWarnings.*coverFailed/s);
  });
});

describe("클로드 v2 스펙 #10: 목차 제거 (15p 이하)", () => {
  it("v2 스펙에서 목차 페이지가 제거되어야 한다 (15페이지 이하이므로 불필요)", () => {
    const engine = readFile(ENGINE_FILE);
    // v2 스펙: 15페이지 이하이므로 목차 불필요 → 제거
    // 엔진에 TOC 빌더 호출이 없어야 함
    expect(engine).not.toMatch(/buildTocPage/);
  });

  it("표지에 72pt 또는 80pt 점수가 표시되어야 한다", () => {
    const report = readFile(REPORT_FILE);
    expect(report).toMatch(/72pt|80pt/);
  });
});

describe("클로드 스펙 #11: 인포 박스", () => {
  it("info-box에 왼쪽 보더 스타일이 적용되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toMatch(/info-box|insight-box/);
    expect(css).toContain("border-left");
  });
});

describe("클로드 스펙 #12: 프로그레스 바", () => {
  it("progressBarHtml 함수가 정의되어야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("progressBarHtml");
  });
});

describe("클로드 스펙 #13: SVG 아이콘", () => {
  it("statusIcon 함수가 존재하고 SVG를 반환해야 한다", () => {
    const content = readFile(REPORT_FILE);
    expect(content).toContain("function statusIcon");
    expect(content).toContain("<svg");
  });
});

describe("클로드 스펙 #14: 개선 항목 좌측 세로바", () => {
  it("개선 항목에 좌측 3px 세로바가 적용되어야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    expect(sections).toMatch(/border-left.*3px|3px.*solid/);
  });
});

describe("클로드 스펙 #15: 단계별 개선 계획", () => {
  it("단계별 개선 계획에 타임라인 또는 스텝이 있어야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    expect(sections).toMatch(/즉시|1개월|3개월|phase-header/);
  });
});

describe("클로드 스펙 #16: 전략 가이드 우선순위 배지", () => {
  it("전략 가이드에 우선순위 배지가 적용되어야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    expect(sections).toMatch(/높음|중간|낮음|high|medium|low/i);
  });
});

describe("클로드 스펙 #17: 인쇄 안전", () => {
  it("print-color-adjust 또는 @media print 설정이 있어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toMatch(/print-color-adjust|@media print/);
  });

  it("page-break-inside: avoid가 적용되어야 한다", () => {
    const css = readFile(REPORT_FILE);
    expect(css).toContain("page-break-inside");
  });
});

describe("클로드 스펙 #18: GEO 3축 시각화", () => {
  it("GEO 3축 분석이 구현되어야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    expect(sections).toMatch(/geo.*axis|3축|geoTriAxis/i);
  });
});

describe("클로드 스펙 #19: 키워드 분석", () => {
  it("키워드 노출 현황에 배지 스타일이 적용되어야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    expect(sections).toMatch(/badge|dot|status-dot/);
  });
});

describe("클로드 스펙 #20: 콘텐츠 갭 난이도 태그", () => {
  it("콘텐츠 갭에 난이도 컬러 태그가 적용되어야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    expect(sections).toMatch(/difficulty|난이도|쉬움|보통|어려움|easy|medium|hard/i);
  });
});

describe("페이지 번호 교체 정규식", () => {
  it("엔진의 정규식이 nested span을 올바르게 매칭해야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).not.toMatch(/page-num">\.?\*\?<\\\/span>/);
  });
});


describe("v3 검증: 전략가이드/콘텐츠전략/마케팅방향 통합", () => {
  it("엔진에서 buildStrategyGuidePages를 호출하지 않아야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).not.toContain("buildStrategyGuidePages");
  });

  it("엔진에서 buildActionPlanPage만 호출해야 한다 (통합 로드맵)", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).toContain("buildActionPlanPage");
  });

  it("엔진 import에 buildStrategyGuidePages가 없어야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    const importBlock = engine.match(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\/ai-visibility-html-report-sections["']/);
    expect(importBlock).toBeTruthy();
    expect(importBlock![0]).not.toContain("buildStrategyGuidePages");
  });
});

describe("v3 검증: 인사말 페이지 제거", () => {
  it("엔진에서 buildGreetingPage를 호출하지 않아야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).not.toContain("buildGreetingPage");
  });

  it("엔진 import에 buildGreetingPage가 없어야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).not.toContain("buildGreetingPage");
  });
});

describe("v3 검증: 목차 제거", () => {
  it("엔진에서 TOC/목차 빌더를 호출하지 않아야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).not.toMatch(/buildToc/i);
    expect(engine).not.toMatch(/buildTableOfContents/i);
  });
});

describe("v3 검증: 핵심요약 페이지 fallback", () => {
  it("핵심요약에 findings 없을 때 카테고리별 진단 요약이 표시되어야 한다", () => {
    const report = readFile(REPORT_FILE);
    expect(report).toContain("카테고리별 진단 요약");
  });

  it("핵심요약에 findings 있을 때 핵심 발견사항이 표시되어야 한다", () => {
    const report = readFile(REPORT_FILE);
    expect(report).toContain("핵심 발견사항");
  });

  it("핵심요약 fallback에 카테고리 바 차트가 포함되어야 한다", () => {
    const report = readFile(REPORT_FILE);
    // fallback에 progress bar가 있어야 함
    expect(report).toMatch(/catScore.*catMax|catMax.*catScore/s);
  });
});

describe("v3 검증: 섹션 번호 동적 순차 부여", () => {
  it("엔진에서 sec-num 클래스를 순차적으로 치환해야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).toContain("sec-num");
    expect(engine).toMatch(/sectionCounter\+\+/);
  });

  it("섹션 번호가 padStart(2, '0')으로 포맷되어야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).toMatch(/padStart\(2,\s*'0'\)/);
  });
});

describe("v3 검증: 페이지 번호 정확성", () => {
  it("엔진에서 page-num 클래스를 순차적으로 치환해야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).toContain("page-num");
    expect(engine).toMatch(/pageCounter\+\+/);
  });

  it("totalNumberedPages가 정확히 계산되어야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    expect(engine).toContain("totalNumberedPages");
    expect(engine).toMatch(/rawHtml\.match\(PAGE_NUM_MARKER\)/);
  });
});

describe("v3 검증: 크리티컬아이템 상세 페이지 제거", () => {
  it("엔진에서 buildCriticalItemsDetailPage를 호출하지 않아야 한다", () => {
    const engine = readFile(ENGINE_FILE);
    // import는 있을 수 있지만 실제 호출은 없어야 함
    const callPattern = /buildCriticalItemsDetailPage\s*\(/;
    const importPattern = /import[\s\S]*?buildCriticalItemsDetailPage[\s\S]*?from/;
    // 호출 부분에서 import 제외하고 검사
    const withoutImports = engine.replace(/import[\s\S]*?from\s*["'][^"']*["'];?/g, "");
    expect(withoutImports).not.toMatch(callPattern);
  });
});

describe("v3 검증: 전체진단 fail/warning만 표시", () => {
  it("전체진단에서 pass 항목을 필터링해야 한다", () => {
    const sections = readFile(SECTIONS_FILE);
    // buildFullAuditPages에서 fail/warning만 표시하는 로직
    expect(sections).toMatch(/filter.*status.*!==.*pass|problemItems/);
  });
});

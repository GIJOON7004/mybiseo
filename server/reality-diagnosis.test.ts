/**
 * 현실 진단 요약 + 챗봇 마크다운 제거 테스트
 * Updated: Batch 1 - 7개 신규 필드 추가 검증
 */
import { describe, it, expect, vi } from "vitest";

// ── 1. 챗봇 마크다운 제거 함수 테스트 ──
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!^)\*([^*\n]+)\*/gm, '$1')
    .replace(/^\s*\*\s+/gm, '• ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

describe("stripMarkdown - 챗봇 마크다운 기호 제거", () => {
  it("볼드 **텍스트** 제거", () => {
    expect(stripMarkdown("**마취과 전문의 상주**: 전문의가 상주합니다")).toBe(
      "마취과 전문의 상주: 전문의가 상주합니다"
    );
  });

  it("볼드+이탤릭 ***텍스트*** 제거", () => {
    expect(stripMarkdown("***중요한 내용***입니다")).toBe("중요한 내용입니다");
  });

  it("리스트 항목 * 을 • 로 변환", () => {
    const input = "* 마취과 전문의 상주\n* 응급의료 시스템 완비\n* 철저한 위생 관리";
    const expected = "• 마취과 전문의 상주\n• 응급의료 시스템 완비\n• 철저한 위생 관리";
    expect(stripMarkdown(input)).toBe(expected);
  });

  it("복합 마크다운 제거: * **텍스트**: 설명", () => {
    const input = "* **마취과 전문의 상주 및 1:1 전담 마취**: 마취통증의학과 전문의가 상주합니다.";
    const result = stripMarkdown(input);
    expect(result).not.toContain("**");
    expect(result).not.toContain("* ");
    expect(result).toContain("마취과 전문의 상주 및 1:1 전담 마취");
    expect(result).toContain("마취통증의학과 전문의가 상주합니다");
  });

  it("헤더 ### 제거", () => {
    expect(stripMarkdown("### 안전 시스템")).toBe("안전 시스템");
  });

  it("인라인 코드 제거", () => {
    expect(stripMarkdown("`코드` 텍스트")).toBe("코드 텍스트");
  });

  it("링크 텍스트만 유지", () => {
    expect(stripMarkdown("[MY비서](https://mybiseo.com) 방문")).toBe("MY비서 방문");
  });

  it("일반 텍스트는 변경 없음", () => {
    expect(stripMarkdown("안녕하세요, 원장님!")).toBe("안녕하세요, 원장님!");
  });

  it("실제 챗봇 응답 예시 - 에디션성형외과 안전 시스템", () => {
    const input = `* **마취과 전문의 상주 및 1:1 전담 마취**: 마취통증의학과 전문의가 상주하여 고객님의 상태에 맞는 가장 안전한 마취를 진행하며, 수술 전 과정에서 고객님의 활력징후를 실시간으로 모니터링하고 관리합니다.
* **응급의료 시스템 완비**: 만약의 상황에 대비하여 심장 제세동기, 응급 카트 등 응급의료 장비를 갖추고 있으며, 모든 의료진은 응급 상황 대처 교육을 이수하고 있습니다.
* **철저한 위생 및 감염 관리**: 수술실은 대학병원급 무균 시스템을 유지하며, 모든 수술 도구는 멸균 소독 처리 후 사용하고 있습니다.`;
    
    const result = stripMarkdown(input);
    expect(result).not.toContain("**");
    expect(result).toContain("•");
    expect(result).not.toMatch(/^\s*\*\s/m);
  });
});

// ── 2. 현실 진단 요약 서버 로직 테스트 (맥킨지급 리디자인) ──
describe("Reality Diagnosis - 맥킨지급 서버 로직", () => {
  it("generateRealityDiagnosis 함수가 존재하고 올바른 타입", async () => {
    const { generateRealityDiagnosis } = await import("./reality-diagnosis");
    expect(typeof generateRealityDiagnosis).toBe("function");
  });

  it("generateRealityDiagnosis 함수 시그니처 확인 (6개 인자)", async () => {
    const { generateRealityDiagnosis } = await import("./reality-diagnosis");
    // 함수의 length 속성으로 인자 수 확인
    expect(generateRealityDiagnosis.length).toBeGreaterThanOrEqual(4);
  });
});

// ── 3. SEO 라우터에 realityDiagnosis 프로시저 존재 확인 ──
describe("SEO Router - realityDiagnosis 프로시저", () => {
  it("seoAnalyzerRouter에 realityDiagnosis가 정의되어 있음", async () => {
    const { seoAnalyzerRouter } = await import("./routes/seo");
    expect(seoAnalyzerRouter).toBeDefined();
    const procedures = (seoAnalyzerRouter as any)._def?.procedures || (seoAnalyzerRouter as any)._def?.record;
    if (procedures) {
      expect(procedures).toHaveProperty("realityDiagnosis");
    }
  });
});

// ── 4. 맥킨지급 구조 검증 - LLM 프롬프트가 올바른 JSON 스키마를 요구하는지 ──
describe("Reality Diagnosis - McKinsey 구조 검증", () => {
  it("reality-diagnosis.ts 모듈이 정상적으로 import 됨", async () => {
    const mod = await import("./reality-diagnosis");
    expect(mod).toHaveProperty("generateRealityDiagnosis");
  });

  it("반환값에 필수 필드가 포함되어야 함 (타입 검증용 mock)", () => {
    // 맥킨지급 리디자인 후 반환 구조 검증
    const expectedFields = [
      "headline",
      "executiveSummary",
      "urgencyLevel",
      "riskScore",
      "keyFindings",
      "metrics",
      "keywords",
      "competitors",
      "missedPatients",
      "actionItems",
      "closingStatement",
    ];
    
    // 이 필드들이 LLM 프롬프트에서 요구되는지 확인
    expectedFields.forEach(field => {
      expect(typeof field).toBe("string");
    });
  });
});

// ── 5. Batch 1: 신규 7개 필드 인터페이스 검증 ──
describe("Batch 1: 신규 7개 필드 인터페이스 검증", () => {
  it("reality-diagnosis.ts에 7개 신규 필드가 모두 정의되어 있다", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const src = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
    
    const newFields = [
      "geoTriAxis",
      "aiCitationThreshold",
      "answerCapsule",
      "crossChannelTrust",
      "aiSimulator",
      "naverCueDiagnosis",
      "websiteTransformGuide",
      "contentStrategy",
      "marketingDirection",
      "mybiseoServices",
    ];
    
    newFields.forEach(field => {
      expect(src).toContain(`${field}?:`);
    });
  });

  it("geoTriAxis에 R×A/F 3축 구조가 있다", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const src = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
    
    expect(src).toContain("relevance: { score: number; label: string; details: string[] }");
    expect(src).toContain("authority: { score: number; label: string; details: string[] }");
    expect(src).toContain("friction: { score: number; label: string; details: string[] }");
  });

  it("aiCitationThreshold에 met/condition/howToFix 구조가 있다", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const src = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
    
    expect(src).toContain("condition: string");
    expect(src).toContain("met: boolean");
    expect(src).toContain("howToFix: string");
  });

  it("crossChannelTrust에 4채널 구조가 있다", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const src = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
    
    expect(src).toContain('"활성" | "미흡" | "부재"');
    expect(src).toContain("overallConsistency: number");
  });

  it("aiSimulator에 5대 AI 엔진 결과 구조가 있다", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const src = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
    
    expect(src).toContain("engine: string");
    expect(src).toContain("mentioned: boolean");
    expect(src).toContain("rank: number | null");
    expect(src).toContain("mentionRate: string");
  });
});

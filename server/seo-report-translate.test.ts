/**
 * Tests for AI visibility report translation module
 * Updated: file references point to ai-visibility-*.ts (new canonical names)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("ai-visibility-translate module", () => {
  it("translateResultToEnglish 함수가 올바른 시그니처를 가진다", async () => {
    const mod = await import("./ai-visibility-translate");
    expect(typeof mod.translateResultToEnglish).toBe("function");
  });

  it("ai-visibility-translate.ts 파일이 invokeLLM을 import한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-translate.ts"), "utf-8");
    expect(src).toContain("invokeLLM");
    expect(src).toContain("translateCategoryName");
    expect(src).toContain("translateItemName");
  });

  it("ai-visibility-translate.ts가 batch 번역 로직을 포함한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-translate.ts"), "utf-8");
    expect(src).toContain("batchTranslate");
    expect(src).toContain("CHUNK_SIZE");
    expect(src).toContain("translateChunk");
  });

  it("ai-visibility-report.ts가 translateResultToEnglish를 import한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-report.ts"), "utf-8");
    expect(src).toContain("translateResultToEnglish");
    expect(src).toContain("ai-visibility-translate");
  });

  it("ai-visibility-report.ts가 영어 모드에서 LLM 번역을 호출한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-report.ts"), "utf-8");
    expect(src).toContain("useTranslation");
    expect(src).toContain("translateResultToEnglish(result)");
  });

  it("ai-visibility-report.ts가 AI 인용 카테고리를 영어명으로도 찾는다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-report.ts"), "utf-8");
    expect(src).toContain('"AI Search Visibility"');
    expect(src).toContain('"AI 검색 노출"');
  });

  // backward compatibility: re-export still works
  it("seo-report-translate.ts re-export가 동작한다", async () => {
    const mod = await import("./seo-report-translate");
    expect(typeof mod.translateResultToEnglish).toBe("function");
  });
});

describe("PDF 등급 뱃지 정중앙 배치 (54차)", () => {
  it("ai-visibility-report.ts가 실제 폰트 메트릭 상수를 사용한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-report.ts"), "utf-8");
    expect(src).toContain("UPM = 1000");
    expect(src).toContain("ASC = 1160");
    expect(src).toContain("CAP_H = 733");
  });

  it("등급 뱃지 Y 좌표가 capHeight 기반 공식을 사용한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-report.ts"), "utf-8");
    expect(src).toContain("badgeCenterY - (ASC - CAP_H / 2) * gradeFontSize / UPM");
  });

  it("점수 baseline이 실제 ascender 비율을 사용한다", () => {
    const src = readFileSync(join(__dirname, "ai-visibility-report.ts"), "utf-8");
    expect(src).toContain("ASC * scoreFontSize / UPM");
    expect(src).toContain("ASC * suffixFontSize / UPM");
  });
});

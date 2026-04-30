/**
 * 최적화 관련 테스트 — reality-diagnosis 병렬화, PageSpeed 캐시, 폰트 버퍼 등
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const realityDiagnosisSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
const pagespeedSrc = readFileSync(resolve(__dirname, "pagespeed-client.ts"), "utf-8");
const aiVisibilitySrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
const translateSrc = readFileSync(resolve(__dirname, "ai-visibility-translate.ts"), "utf-8");

describe("Reality Diagnosis 병렬 최적화", () => {
  it("4개 병렬 스트림 함수가 존재한다", () => {
    expect(realityDiagnosisSrc).toContain("generateCoreDiagnosis");
    expect(realityDiagnosisSrc).toContain("generateGeoAiDiagnosis");
    expect(realityDiagnosisSrc).toContain("generateChannelDiagnosis");
    expect(realityDiagnosisSrc).toContain("generateStrategyGuide");
  });

  it("Promise.allSettled로 4개 스트림을 병렬 실행한다", () => {
    expect(realityDiagnosisSrc).toContain("Promise.allSettled([");
    expect(realityDiagnosisSrc).toContain("generateCoreDiagnosis(context)");
    expect(realityDiagnosisSrc).toContain("generateGeoAiDiagnosis(context)");
    expect(realityDiagnosisSrc).toContain("generateChannelDiagnosis(context)");
    expect(realityDiagnosisSrc).toContain("generateStrategyGuide(context)");
  });

  it("각 스트림에 독립적 fallback이 있다", () => {
    expect(realityDiagnosisSrc).toContain("FALLBACK_CORE");
    expect(realityDiagnosisSrc).toContain("FALLBACK_GEO_AI");
    expect(realityDiagnosisSrc).toContain("FALLBACK_CHANNEL");
    expect(realityDiagnosisSrc).toContain("FALLBACK_STRATEGY");
  });

  it("각 스트림에 JSON schema가 정의되어 있다", () => {
    expect(realityDiagnosisSrc).toContain('name: "core_diagnosis"');
    expect(realityDiagnosisSrc).toContain('name: "geo_ai_diagnosis"');
    expect(realityDiagnosisSrc).toContain('name: "channel_diagnosis"');
    expect(realityDiagnosisSrc).toContain('name: "strategy_guide"');
  });

  it("실행 시간 로깅이 포함되어 있다", () => {
    expect(realityDiagnosisSrc).toContain("Date.now()");
    expect(realityDiagnosisSrc).toContain("Completed in");
  });

  it("SimilarWeb 데이터를 Promise.allSettled로 병렬 조회한다", () => {
    expect(realityDiagnosisSrc).toContain("Promise.allSettled([");
    expect(realityDiagnosisSrc).toContain("Similarweb/get_visits_total");
  });

  it("공통 시스템 프롬프트가 분리되어 있다", () => {
    expect(realityDiagnosisSrc).toContain("const SYSTEM_PROMPT");
    // 각 스트림 함수에서 SYSTEM_PROMPT를 사용
    const systemPromptUsages = realityDiagnosisSrc.match(/SYSTEM_PROMPT/g);
    expect(systemPromptUsages!.length).toBeGreaterThanOrEqual(5); // 정의 1 + 사용 4
  });

  it("RealityDiagnosis 타입이 올바르게 export된다", () => {
    expect(realityDiagnosisSrc).toContain("export interface RealityDiagnosis");
    expect(realityDiagnosisSrc).toContain("export async function generateRealityDiagnosis");
  });
});

describe("PageSpeed API 캐시 최적화", () => {
  it("인메모리 캐시가 구현되어 있다", () => {
    expect(pagespeedSrc).toContain("_psCache");
    expect(pagespeedSrc).toContain("PS_CACHE_TTL");
  });

  it("in-flight 중복 방지가 구현되어 있다", () => {
    expect(pagespeedSrc).toContain("_psInflight");
    expect(pagespeedSrc).toContain("Deduplicating in-flight request");
  });

  it("캐시 TTL이 10분으로 설정되어 있다", () => {
    expect(pagespeedSrc).toContain("10 * 60 * 1000");
  });

  it("캐시 히트 시 로깅한다", () => {
    expect(pagespeedSrc).toContain("Cache hit for");
  });
});

describe("PDF 렌더링 최적화", () => {
  it("폰트 버퍼가 lazy 캐싱으로 구현되어 있다", () => {
    expect(aiVisibilitySrc).toContain("getFontBuffers");
    expect(aiVisibilitySrc).toContain("_fontBuffers");
    expect(aiVisibilitySrc).toContain("Lazy font buffer cache");
  });

  it("QR 코드 캐시가 유지된다", () => {
    expect(aiVisibilitySrc).toContain("cachedQrBuffer");
  });

  it("폰트 등록 시 lazy cached 버퍼를 사용한다", () => {
    expect(aiVisibilitySrc).toContain("const fontBuffers = getFontBuffers()");
    expect(aiVisibilitySrc).toContain('doc.registerFont("KrRegular", fontBuffers.krRegular)');
  });
});

describe("번역 병렬화 최적화", () => {
  it("번역 청크가 병렬로 실행된다", () => {
    expect(translateSrc).toContain("Promise.allSettled(");
    expect(translateSrc).toContain("chunks.map(c => translateChunk(c.texts))");
  });

  it("병렬 실행 실패 시 원본 텍스트로 fallback한다", () => {
    expect(translateSrc).toContain('result.status === "fulfilled"');
    expect(translateSrc).toContain("chunk.texts");
  });
});

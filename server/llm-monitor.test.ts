/**
 * LLM 모니터링 통합 테스트
 * - llm-usage-logger: 배치 버퍼링 + flush 동작 검증
 * - llmMonitor 라우터: API 응답 구조 검증
 * - llm-cache: 캐시 통계 정확성 검증
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  logLLMUsage,
  resetLLMUsageBuffer,
  getLLMUsageBufferSize,
} from "./llm-usage-logger";
import { getLLMCacheStats, clearLLMCache } from "./llm-cache";

describe("LLM Usage Logger", () => {
  beforeEach(() => {
    resetLLMUsageBuffer();
  });

  it("버퍼에 사용량 엔트리를 추가한다", () => {
    logLLMUsage({
      caller: "test.module",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cached: false,
      durationMs: 1200,
    });
    expect(getLLMUsageBufferSize()).toBe(1);
  });

  it("여러 엔트리를 순차적으로 버퍼링한다", () => {
    for (let i = 0; i < 5; i++) {
      logLLMUsage({
        caller: `module-${i}`,
        promptTokens: 100 + i * 10,
        completionTokens: 50 + i * 5,
        totalTokens: 150 + i * 15,
        cached: i % 2 === 0,
        durationMs: 1000 + i * 100,
      });
    }
    expect(getLLMUsageBufferSize()).toBe(5);
  });

  it("reset 후 버퍼가 비어있다", () => {
    logLLMUsage({
      caller: "test",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cached: false,
      durationMs: 500,
    });
    expect(getLLMUsageBufferSize()).toBe(1);
    resetLLMUsageBuffer();
    expect(getLLMUsageBufferSize()).toBe(0);
  });

  it("BATCH_SIZE(20) 도달 시 자동 flush 트리거 (DB 없이 에러 무시)", () => {
    for (let i = 0; i < 20; i++) {
      logLLMUsage({
        caller: "batch-test",
        promptTokens: 50,
        completionTokens: 25,
        totalTokens: 75,
        cached: false,
        durationMs: 300,
      });
    }
    // flush가 호출되면 buffer가 비워짐 (DB 없어도 splice는 실행됨)
    expect(getLLMUsageBufferSize()).toBe(0);
  });
});

describe("LLM Cache Stats", () => {
  beforeEach(() => {
    clearLLMCache();
  });

  it("초기 상태에서 올바른 구조를 반환한다", () => {
    const stats = getLLMCacheStats();
    expect(stats).toHaveProperty("l1Size");
    expect(stats).toHaveProperty("l2Size");
    expect(stats).toHaveProperty("l1MaxSize");
    expect(stats).toHaveProperty("l2MaxSize");
    expect(stats).toHaveProperty("hitRate");
    expect(stats).toHaveProperty("l1Hits");
    expect(stats).toHaveProperty("l2Hits");
    expect(stats).toHaveProperty("misses");
    expect(stats).toHaveProperty("evictions");
    expect(stats).toHaveProperty("totalTokens");
    expect(stats).toHaveProperty("totalCalls");
  });

  it("초기 상태에서 모든 카운터가 0이다", () => {
    const stats = getLLMCacheStats();
    expect(stats.l1Size).toBe(0);
    expect(stats.l2Size).toBe(0);
    expect(stats.l1Hits).toBe(0);
    expect(stats.l2Hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.totalCalls).toBe(0);
  });

  it("hitRate는 0~1 범위이다", () => {
    const stats = getLLMCacheStats();
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeLessThanOrEqual(1);
  });

  it("maxSize는 양수이다", () => {
    const stats = getLLMCacheStats();
    expect(stats.l1MaxSize).toBeGreaterThan(0);
    expect(stats.l2MaxSize).toBeGreaterThan(0);
  });
});

describe("LLM Monitor Router API 구조", () => {
  it("llmMonitor 라우터가 올바르게 export된다", async () => {
    const { llmMonitorRouter } = await import("./routes/llmMonitor");
    expect(llmMonitorRouter).toBeDefined();
    // tRPC 라우터는 _def.procedures를 가짐
    const procedures = (llmMonitorRouter as any)._def?.procedures;
    expect(procedures).toBeDefined();
    expect(procedures).toHaveProperty("cacheStats");
    expect(procedures).toHaveProperty("dailyUsage");
    expect(procedures).toHaveProperty("usageByCaller");
    expect(procedures).toHaveProperty("recentLogs");
    expect(procedures).toHaveProperty("costEstimate");
  });
});

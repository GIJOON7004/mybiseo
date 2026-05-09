/**
 * LLM 캐싱 레이어 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "gemini-2.5-flash",
    choices: [{
      index: 0,
      message: { role: "assistant", content: "cached response" },
      finish_reason: "stop",
    }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  }),
}));

import { invokeLLMCached, getLLMCacheStats, clearLLMCache } from "./llm-cache";
import { invokeLLM } from "./_core/llm";

const mockInvokeLLM = invokeLLM as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  clearLLMCache();
  mockInvokeLLM.mockClear();
});

describe("LLM Cache", () => {
  const testParams = {
    messages: [
      { role: "system" as const, content: "You are helpful." },
      { role: "user" as const, content: "Hello" },
    ],
  };

  it("첫 번째 호출은 실제 LLM을 호출한다", async () => {
    await invokeLLMCached(testParams);
    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("동일 프롬프트 두 번째 호출은 캐시에서 반환한다", async () => {
    await invokeLLMCached(testParams);
    await invokeLLMCached(testParams);
    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("다른 프롬프트는 별도로 호출한다", async () => {
    await invokeLLMCached(testParams);
    await invokeLLMCached({
      messages: [{ role: "user" as const, content: "Different" }],
    });
    expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
  });

  it("캐시 통계가 정확하다", async () => {
    await invokeLLMCached(testParams);
    await invokeLLMCached(testParams);
    await invokeLLMCached(testParams);

    const stats = getLLMCacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
    expect(stats.hitRate).toBe(67); // 2/3 = 66.67% → 67%
  });

  it("clearLLMCache가 캐시와 통계를 초기화한다", async () => {
    await invokeLLMCached(testParams);
    clearLLMCache();

    const stats = getLLMCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.size).toBe(0);
  });

  it("TTL 만료 후에는 다시 호출한다", async () => {
    // TTL 1ms로 설정
    await invokeLLMCached(testParams, 1);
    // 약간 대기
    await new Promise(resolve => setTimeout(resolve, 5));
    await invokeLLMCached(testParams, 1);
    expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
  });

  it("response_format이 다르면 다른 캐시 키를 사용한다", async () => {
    await invokeLLMCached(testParams);
    await invokeLLMCached({
      ...testParams,
      response_format: { type: "json_object" },
    });
    expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
  });
});

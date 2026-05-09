/**
 * LLM 호출 캐싱 레이어 v2
 * - 2계층 캐시: L1(인메모리 10분) + L2(DB 24시간)
 * - 동일한 프롬프트(messages + response_format)에 대해 캐시된 응답 반환
 * - TTL 기반 자동 만료
 * - 최대 캐시 항목 수 제한 (LRU 방식)
 * - 캐시 히트/미스 통계 제공
 * - 토큰 사용량 추적
 */
import { createHash } from "crypto";
import { invokeLLM, type InvokeParams, type InvokeResult } from "./_core/llm";
import { logLLMUsage } from "./llm-usage-logger";

// ── 설정 ──
const L1_TTL_MS = 10 * 60 * 1000;      // L1: 인메모리 10분
const L2_TTL_MS = 24 * 60 * 60 * 1000; // L2: DB 24시간
const L1_MAX_ENTRIES = 200;             // L1: 인메모리 최대 200건
const L2_MAX_ENTRIES = 1000;            // L2: DB 최대 1000건

// ── 캐시 엔트리 ──
interface CacheEntry {
  result: InvokeResult;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
}

// ── L1 인메모리 캐시 ──
const l1Cache = new Map<string, CacheEntry>();

// ── L2 DB 캐시 (인메모리 시뮬레이션 — DB 연결 시 교체 가능) ──
const l2Cache = new Map<string, CacheEntry>();

// ── 통계 ──
let stats = {
  l1Hits: 0,
  l2Hits: 0,
  misses: 0,
  evictions: 0,
  totalTokens: 0,
  totalCalls: 0,
};

/**
 * 프롬프트 파라미터를 해시키로 변환
 */
export function computeCacheKey(params: InvokeParams): string {
  const keyData = {
    messages: params.messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    response_format: params.responseFormat || params.response_format,
    tools: params.tools?.map(t => t.function.name),
    temperature: params.temperature,
  };
  const hash = createHash("sha256")
    .update(JSON.stringify(keyData))
    .digest("hex")
    .slice(0, 32);
  return hash;
}

/**
 * L1 만료된 엔트리 정리
 */
function evictExpiredL1(): void {
  const now = Date.now();
  const entries = Array.from(l1Cache.entries());
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) {
      l1Cache.delete(key);
      stats.evictions++;
    }
  }
}

/**
 * L2 만료된 엔트리 정리
 */
function evictExpiredL2(): void {
  const now = Date.now();
  const entries = Array.from(l2Cache.entries());
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) {
      l2Cache.delete(key);
      stats.evictions++;
    }
  }
}

/**
 * LRU 방식으로 가장 오래된 엔트리 제거
 */
function evictOldest(cache: Map<string, CacheEntry>, maxSize: number): void {
  while (cache.size > maxSize) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
      stats.evictions++;
    } else break;
  }
}

/**
 * 토큰 사용량 추출
 */
function extractTokenUsage(result: InvokeResult): { prompt: number; completion: number; total: number } {
  const usage = (result as any)?.usage;
  if (usage) {
    return {
      prompt: usage.prompt_tokens || 0,
      completion: usage.completion_tokens || 0,
      total: usage.total_tokens || 0,
    };
  }
  return { prompt: 0, completion: 0, total: 0 };
}

/**
 * 캐시된 LLM 호출 — 2계층 캐시 (L1 인메모리 → L2 장기)
 * @param params - invokeLLM과 동일한 파라미터
 * @param options - 캐시 옵션
 * @returns InvokeResult
 */
export async function invokeLLMCached(
  params: InvokeParams,
  options: { ttlMs?: number; skipCache?: boolean; tier?: "l1" | "l2"; caller?: string } = {}
): Promise<InvokeResult> {
  const { ttlMs, skipCache = false, tier = "l2", caller = "unknown" } = options;
  const key = computeCacheKey(params);
  const now = Date.now();

  if (!skipCache) {
    // L1 캐시 확인 (true LRU: hit 시 재삽입으로 recency 갱신)
    const l1Entry = l1Cache.get(key);
    if (l1Entry && l1Entry.expiresAt > now) {
      l1Entry.hitCount++;
      stats.l1Hits++;
      // LRU: 재삽입으로 Map 순서 갱신
      l1Cache.delete(key);
      l1Cache.set(key, l1Entry);
      return l1Entry.result;
    }

    // L2 캐시 확인 (true LRU)
    if (tier === "l2") {
      const l2Entry = l2Cache.get(key);
      if (l2Entry && l2Entry.expiresAt > now) {
        l2Entry.hitCount++;
        stats.l2Hits++;
        // LRU: 재삽입으로 Map 순서 갱신
        l2Cache.delete(key);
        l2Cache.set(key, l2Entry);
        // L2 히트 시 L1에도 승격
        l1Cache.set(key, {
          ...l2Entry,
          expiresAt: now + L1_TTL_MS,
        });
        return l2Entry.result;
      }
    }
  }

  // 캐시 미스 — 실제 LLM 호출
  stats.misses++;
  stats.totalCalls++;
  const startMs = Date.now();
  const result = await invokeLLM(params);
  const durationMs = Date.now() - startMs;

  // 토큰 사용량 추적
  const tokenUsage = extractTokenUsage(result);
  stats.totalTokens += tokenUsage.total;

  // DB 로깅 (fire-and-forget)
  logLLMUsage({
    caller,
    promptTokens: tokenUsage.prompt,
    completionTokens: tokenUsage.completion,
    totalTokens: tokenUsage.total,
    cached: false,
    durationMs,
  });

  const effectiveTtl = ttlMs || (tier === "l2" ? L2_TTL_MS : L1_TTL_MS);

  // L1 캐시 저장
  l1Cache.set(key, {
    result,
    expiresAt: now + Math.min(effectiveTtl, L1_TTL_MS),
    createdAt: now,
    hitCount: 0,
    tokenUsage,
  });

  // L2 캐시 저장 (tier가 l2일 때)
  if (tier === "l2") {
    l2Cache.set(key, {
      result,
      expiresAt: now + effectiveTtl,
      createdAt: now,
      hitCount: 0,
      tokenUsage,
    });
  }

  // 정리
  evictExpiredL1();
  evictOldest(l1Cache, L1_MAX_ENTRIES);
  if (tier === "l2") {
    evictExpiredL2();
    evictOldest(l2Cache, L2_MAX_ENTRIES);
  }

  return result;
}

/**
 * 캐시 통계 조회
 */
export function getLLMCacheStats() {
  return {
    ...stats,
    l1Size: l1Cache.size,
    l2Size: l2Cache.size,
    l1MaxSize: L1_MAX_ENTRIES,
    l2MaxSize: L2_MAX_ENTRIES,
    hitRate: stats.l1Hits + stats.l2Hits + stats.misses > 0
      ? Math.round(((stats.l1Hits + stats.l2Hits) / (stats.l1Hits + stats.l2Hits + stats.misses)) * 100)
      : 0,
  };
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearLLMCache(): void {
  l1Cache.clear();
  l2Cache.clear();
  stats = { l1Hits: 0, l2Hits: 0, misses: 0, evictions: 0, totalTokens: 0, totalCalls: 0 };
}

/**
 * 특정 키 무효화
 */
export function invalidateLLMCache(params: InvokeParams): boolean {
  const key = computeCacheKey(params);
  const l1Deleted = l1Cache.delete(key);
  const l2Deleted = l2Cache.delete(key);
  return l1Deleted || l2Deleted;
}

// ── 하위 호환성 유지 ──
/** @deprecated Use getLLMCacheStats() instead */
export const getCacheStats = getLLMCacheStats;

/**
 * LLM 호출 캐싱 레이어
 * - 동일한 프롬프트(messages + response_format)에 대해 캐시된 응답 반환
 * - TTL 기반 자동 만료 (기본 10분)
 * - 최대 캐시 항목 수 제한 (LRU 방식)
 * - 캐시 히트/미스 통계 제공
 */
import { createHash } from "crypto";
import { invokeLLM, type InvokeParams, type InvokeResult } from "./_core/llm";

// ── 설정 ──
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10분
const MAX_CACHE_ENTRIES = 200;

// ── 캐시 엔트리 ──
interface CacheEntry {
  result: InvokeResult;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
}

// ── 캐시 저장소 ──
const cache = new Map<string, CacheEntry>();

// ── 통계 ──
let stats = {
  hits: 0,
  misses: 0,
  evictions: 0,
};

/**
 * 프롬프트 파라미터를 해시키로 변환
 * messages + response_format + tools를 기반으로 고유 키 생성
 */
function computeCacheKey(params: InvokeParams): string {
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
 * 만료된 엔트리 정리
 */
function evictExpired(): void {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      stats.evictions++;
    }
  }
}

/**
 * LRU 방식으로 가장 오래된 엔트리 제거
 */
function evictOldest(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  // Map은 삽입 순서를 유지하므로 첫 번째가 가장 오래됨
  const firstKey = cache.keys().next().value;
  if (firstKey) {
    cache.delete(firstKey);
    stats.evictions++;
  }
}

/**
 * 캐시된 LLM 호출 — 동일 프롬프트에 대해 캐시 응답 반환
 * @param params - invokeLLM과 동일한 파라미터
 * @param ttlMs - 캐시 TTL (밀리초, 기본 10분)
 * @returns InvokeResult
 */
export async function invokeLLMCached(
  params: InvokeParams,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<InvokeResult> {
  const key = computeCacheKey(params);
  const now = Date.now();

  // 캐시 히트 확인
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    cached.hitCount++;
    stats.hits++;
    return cached.result;
  }

  // 캐시 미스 — 실제 LLM 호출
  stats.misses++;
  const result = await invokeLLM(params);

  // 캐시 저장
  cache.set(key, {
    result,
    expiresAt: now + ttlMs,
    createdAt: now,
    hitCount: 0,
  });

  // 정리
  evictExpired();
  evictOldest();

  return result;
}

/**
 * 캐시 통계 조회
 */
export function getLLMCacheStats() {
  return {
    ...stats,
    size: cache.size,
    maxSize: MAX_CACHE_ENTRIES,
    hitRate: stats.hits + stats.misses > 0
      ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
      : 0,
  };
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearLLMCache(): void {
  cache.clear();
  stats = { hits: 0, misses: 0, evictions: 0 };
}

/**
 * 특정 키 무효화
 */
export function invalidateLLMCache(params: InvokeParams): boolean {
  const key = computeCacheKey(params);
  return cache.delete(key);
}

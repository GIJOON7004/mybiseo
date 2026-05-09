/**
 * LLM 사용량 DB 로거
 * - 비동기 fire-and-forget 패턴 (메인 로직 블로킹 없음)
 * - 배치 삽입으로 DB 부하 최소화 (5초 또는 20건 단위)
 */
import { getDb } from "./db";
import { llmUsageLogs } from "../drizzle/schema";

interface UsageEntry {
  caller: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cached: boolean;
  durationMs: number;
}

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;

let buffer: UsageEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(llmUsageLogs).values(batch);
  } catch (err) {
    // 로깅 실패는 무시 — 메인 로직에 영향 없음
    console.error("[LLM Usage Logger] flush error:", (err as Error).message);
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

/**
 * LLM 사용량 기록 (fire-and-forget)
 */
export function logLLMUsage(entry: UsageEntry): void {
  buffer.push(entry);
  if (buffer.length >= BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * 버퍼 강제 플러시 (서버 종료 시)
 */
export async function flushLLMUsageBuffer(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flush();
}

/**
 * 테스트용 — 버퍼 초기화
 */
export function resetLLMUsageBuffer(): void {
  buffer = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

/**
 * 테스트용 — 현재 버퍼 크기 반환
 */
export function getLLMUsageBufferSize(): number {
  return buffer.length;
}

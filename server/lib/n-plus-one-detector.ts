/**
 * N+1 Query Detector (Development Only)
 * 
 * 동일 패턴의 쿼리가 짧은 시간 내에 반복 실행되면 경고를 출력합니다.
 * Production에서는 자동으로 비활성화됩니다.
 * 
 * 사용법:
 *   import { trackQuery, resetTracker } from "../lib/n-plus-one-detector";
 *   trackQuery("SELECT * FROM users WHERE id = ?", [userId]);
 */
import { createLogger } from "./logger";
const logger = createLogger("n-plus-one");

const IS_DEV = process.env.NODE_ENV !== "production";

interface QueryRecord {
  pattern: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

const WINDOW_MS = 2000; // 2초 윈도우
const THRESHOLD = 5; // 5회 이상이면 N+1 의심
const queryMap = new Map<string, QueryRecord>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 쿼리 패턴을 추적합니다.
 * @param sql SQL 문자열 (파라미터 제거된 패턴)
 * @param context 호출 컨텍스트 (선택)
 */
export function trackQuery(sql: string, context?: string): void {
  if (!IS_DEV) return;

  // 파라미터 값을 ? 로 정규화하여 패턴 추출
  const pattern = sql
    .replace(/= ?\d+/g, "= ?")
    .replace(/'[^']*'/g, "?")
    .replace(/IN \([^)]+\)/gi, "IN (?)")
    .trim();

  const now = Date.now();
  const existing = queryMap.get(pattern);

  if (existing && (now - existing.firstSeen) < WINDOW_MS) {
    existing.count++;
    existing.lastSeen = now;

    if (existing.count === THRESHOLD) {
      logger.warn(
        `\n⚠️  [N+1 DETECTED] ${existing.count}회 반복 쿼리 (${WINDOW_MS}ms 내)\n` +
        `   Pattern: ${pattern.slice(0, 100)}\n` +
        (context ? `   Context: ${context}\n` : "") +
        `   → 배치 쿼리 또는 JOIN으로 최적화를 고려하세요.\n`
      );
    }
  } else {
    queryMap.set(pattern, {
      pattern,
      count: 1,
      firstSeen: now,
      lastSeen: now,
    });
  }
}

/**
 * 추적 상태를 초기화합니다 (테스트용).
 */
export function resetTracker(): void {
  queryMap.clear();
}

/**
 * 오래된 엔트리를 정리합니다.
 */
function cleanup(): void {
  const now = Date.now();
  const keys = Array.from(queryMap.keys());
  for (const key of keys) {
    const record = queryMap.get(key);
    if (record && now - record.lastSeen > WINDOW_MS * 2) {
      queryMap.delete(key);
    }
  }
}

// Dev 환경에서만 주기적 정리 실행
if (IS_DEV) {
  cleanupInterval = setInterval(cleanup, 10_000);
  // unref로 프로세스 종료를 방해하지 않음
  if (cleanupInterval.unref) cleanupInterval.unref();
}

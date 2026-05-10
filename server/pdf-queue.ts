/**
 * PDF 생성 비동기 큐
 * - 동시 PDF 생성을 최대 2개로 제한 (메모리 보호)
 * - 큐 대기 시간 모니터링
 * - 타임아웃 보호 (60초)
 */
import PQueue from "p-queue";

// PDF 생성은 메모리 집약적 (폰트 4.5MB + 렌더링)
// 동시 2개로 제한하여 OOM 방지
const pdfQueue = new PQueue({
  concurrency: 2,
  timeout: 60_000, // 60초 타임아웃
});

// 큐 통계
const queueStats = {
  totalProcessed: 0,
  totalFailed: 0,
  totalTimeMs: 0,
  peakPending: 0,
};

pdfQueue.on("active", () => {
  const pending = pdfQueue.pending + pdfQueue.size;
  if (pending > queueStats.peakPending) {
    queueStats.peakPending = pending;
  }
});

/**
 * PDF 생성 작업을 큐에 추가
 * @param fn - PDF 생성 함수 (Buffer 반환)
 * @param label - 디버그용 라벨
 * @returns PDF Buffer
 */
export async function enqueuePdfGeneration<T>(
  fn: () => Promise<T>,
  label = "pdf"
): Promise<T> {
  const start = Date.now();
  try {
    const result = await pdfQueue.add(fn) as T;
    queueStats.totalProcessed++;
    queueStats.totalTimeMs += Date.now() - start;
    return result;
  } catch (err) {
    queueStats.totalFailed++;
    throw err;
  }
}

/**
 * 큐 상태 조회
 */
export function getPdfQueueStats() {
  return {
    ...queueStats,
    pending: pdfQueue.pending,
    size: pdfQueue.size,
    concurrency: pdfQueue.concurrency,
    avgTimeMs: queueStats.totalProcessed > 0
      ? Math.round(queueStats.totalTimeMs / queueStats.totalProcessed)
      : 0,
  };
}

export { pdfQueue };

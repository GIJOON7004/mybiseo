/**
 * Browser Pool 싱글톤 + 동시성 제어
 *
 * Puppeteer 브라우저 인스턴스를 재사용하여 cold-start 비용(~5초)을 제거합니다.
 * 동시 페이지 수를 MAX_CONCURRENT_PAGES로 제한하여 OOM을 방지합니다.
 *
 * 사용법 (권장 — acquirePage/releasePage):
 *   import { acquirePage } from "../lib/browser-pool";
 *   const page = await acquirePage();
 *   try { ... } finally { await page.close(); releasePage(); }
 *
 * 사용법 (레거시 — getBrowser):
 *   import { getBrowser, releasePage } from "../lib/browser-pool";
 *   const browser = await getBrowser();
 *   const page = await browser.newPage();
 *   try { ... } finally { await page.close(); releasePage(); }
 */
import puppeteer, { type Browser, type Page } from "puppeteer";
import { createLogger } from "./logger";

const logger = createLogger("browser-pool");

// ── 동시성 설정 ──
const MAX_CONCURRENT_PAGES = 5;
let activePages = 0;
const waitQueue: Array<() => void> = [];

// ── 브라우저 싱글톤 ──
let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;
let _pageCount = 0;

const LAUNCH_OPTIONS: Parameters<typeof puppeteer.launch>[0] = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--font-render-hinting=none",
    "--disable-web-security",
  ],
};

/**
 * 싱글톤 브라우저 인스턴스를 반환합니다.
 * 첫 호출 시에만 launch하고, 이후에는 기존 인스턴스를 재사용합니다.
 */
export async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) {
    _pageCount++;
    return _browser;
  }

  if (_launching) {
    const b = await _launching;
    _pageCount++;
    return b;
  }

  _launching = puppeteer.launch(LAUNCH_OPTIONS);
  try {
    _browser = await _launching;
    _pageCount = 1;

    _browser.on("disconnected", () => {
      _browser = null;
      _launching = null;
      _pageCount = 0;
      activePages = 0;
      waitQueue.length = 0;
      logger.info("Browser disconnected — pool reset");
    });

    return _browser;
  } finally {
    _launching = null;
  }
}

/**
 * 페이지 사용 완료 시 호출합니다.
 * 모든 페이지가 반환되면 30초 후 브라우저를 종료합니다 (메모리 절약).
 */
export function releasePage(): void {
  _pageCount = Math.max(0, _pageCount - 1);
  releaseSlot();

  if (_pageCount === 0) {
    setTimeout(async () => {
      if (_pageCount === 0 && _browser && _browser.connected) {
        await _browser.close().catch(() => { /* intentionally ignored — browser already closing */ });
        _browser = null;
        logger.info("Browser closed after idle timeout (30s)");
      }
    }, 30_000);
  }
}

/**
 * 동시성 제어 — MAX_CONCURRENT_PAGES 초과 시 대기 큐에 추가
 */
export async function acquireSlot(): Promise<void> {
  if (activePages < MAX_CONCURRENT_PAGES) {
    activePages++;
    return;
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activePages++;
      resolve();
    });
  });
}

/**
 * 동시성 슬롯 반환
 */
export function releaseSlot(): void {
  activePages = Math.max(0, activePages - 1);
  const next = waitQueue.shift();
  if (next) next();
}

/**
 * 통합 API: 동시성 제어 + 브라우저 획득 + 페이지 생성을 한 번에 처리
 * @returns Page 인스턴스 (사용 후 page.close() + releasePage() 호출 필수)
 */
export async function acquirePage(): Promise<Page> {
  await acquireSlot();
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    return page;
  } catch (e) {
    releaseSlot();
    _pageCount = Math.max(0, _pageCount - 1);
    throw e;
  }
}

/**
 * 즉시 브라우저를 종료합니다 (graceful shutdown 용).
 */
export async function drainPool(): Promise<void> {
  if (_browser && _browser.connected) {
    await _browser.close().catch(() => { /* intentionally ignored */ });
  }
  _browser = null;
  _launching = null;
  _pageCount = 0;
  activePages = 0;
  waitQueue.length = 0;
}

/**
 * 현재 풀 상태 (디버깅/모니터링용)
 */
export function getPoolStats() {
  return {
    activePages,
    maxConcurrent: MAX_CONCURRENT_PAGES,
    queueLength: waitQueue.length,
    browserConnected: !!(_browser && _browser.connected),
    pageCount: _pageCount,
  };
}

// Graceful shutdown
process.on("SIGTERM", drainPool);
process.on("SIGINT", drainPool);

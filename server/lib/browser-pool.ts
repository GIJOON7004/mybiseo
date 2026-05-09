/**
 * Browser Pool 싱글톤
 * 
 * Puppeteer 브라우저 인스턴스를 재사용하여 cold-start 비용(~5초)을 제거합니다.
 * 동시 요청 시 동일 브라우저에서 새 페이지를 생성하여 처리합니다.
 * 
 * 사용법:
 *   import { getBrowser, releaseBrowser } from "../lib/browser-pool";
 *   const browser = await getBrowser();
 *   const page = await browser.newPage();
 *   // ... 작업 ...
 *   await page.close();
 *   // browser.close()는 호출하지 않음 — Pool이 관리
 */
import puppeteer, { type Browser } from "puppeteer";

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
  // 이미 살아있는 브라우저가 있으면 재사용
  if (_browser && _browser.connected) {
    _pageCount++;
    return _browser;
  }

  // 동시 호출 시 중복 launch 방지
  if (_launching) {
    const b = await _launching;
    _pageCount++;
    return b;
  }

  _launching = puppeteer.launch(LAUNCH_OPTIONS);
  try {
    _browser = await _launching;
    _pageCount = 1;

    // 브라우저가 예기치 않게 종료되면 참조 정리
    _browser.on("disconnected", () => {
      _browser = null;
      _launching = null;
      _pageCount = 0;
    });

    return _browser;
  } finally {
    _launching = null;
  }
}

/**
 * 페이지 사용 완료 시 호출합니다.
 * 모든 페이지가 반환되면 일정 시간 후 브라우저를 종료합니다 (메모리 절약).
 */
export async function releasePage(): Promise<void> {
  _pageCount = Math.max(0, _pageCount - 1);

  // 모든 페이지가 반환되면 30초 후 브라우저 종료 (idle timeout)
  if (_pageCount === 0) {
    setTimeout(async () => {
      if (_pageCount === 0 && _browser && _browser.connected) {
        await _browser.close().catch(() => {});
        _browser = null;
      }
    }, 30_000);
  }
}

/**
 * 즉시 브라우저를 종료합니다 (graceful shutdown 용).
 */
export async function drainPool(): Promise<void> {
  if (_browser && _browser.connected) {
    await _browser.close().catch(() => {});
  }
  _browser = null;
  _launching = null;
  _pageCount = 0;
}

// Graceful shutdown
process.on("SIGTERM", drainPool);
process.on("SIGINT", drainPool);

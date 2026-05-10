import { createLogger } from "./lib/logger";
const logger = createLogger("search-screenshot");
/**
 * search-screenshot.ts
 * 네이버/구글 검색 결과 스크린샷 캡처 모듈
 * puppeteer를 사용하여 실제 검색 결과를 캡처하고 S3에 업로드
 *
 * 안정성 강화:
 * - 네이버/구글 페이지 구조 변경에 대비한 다중 셀렉터 fallback
 * - 캡처 실패 시 graceful degradation (placeholder 이미지 생성)
 * - 개별 키워드/엔진 실패가 전체를 중단시키지 않음
 * - 타임아웃 세분화 + 재시도 로직
 * - 브라우저 크래시 안전 처리
 */
import puppeteer, { type Browser, type Page } from "puppeteer";
import { getBrowser, releasePage } from "./lib/browser-pool";
import { storagePut } from "./storage";

export interface SearchScreenshot {
  engine: "naver" | "google";
  keyword: string;
  imageUrl: string;
  capturedAt: number;
  isPlaceholder?: boolean; // 실제 캡처 실패 시 placeholder 여부
}

export interface SearchScreenshotResult {
  screenshots: SearchScreenshot[];
  errors: string[];
}

// ── 설정 상수 ──
const CONFIG = {
  /** 페이지 로딩 타임아웃 (ms) */
  PAGE_TIMEOUT: 20000,
  /** 네트워크 idle 대기 타임아웃 (ms) */
  NETWORK_IDLE_TIMEOUT: 12000,
  /** 검색 결과 렌더링 대기 (ms) */
  RENDER_WAIT: 2000,
  /** 개별 캡처 최대 재시도 횟수 */
  MAX_RETRIES: 2,
  /** 재시도 간 대기 (ms) */
  RETRY_DELAY: 1500,
  /** 캡처 해상도 */
  VIEWPORT: { width: 1280, height: 900 },
  /** User-Agent (최신 Chrome) */
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

// ── 네이버/구글 검색 결과 영역 셀렉터 (다중 fallback) ──
const NAVER_RESULT_SELECTORS = [
  "#main_pack",           // 메인 검색 결과 영역
  ".api_subject_bx",      // 통합 검색 결과 박스
  "#content",             // 전체 콘텐츠 영역
  ".search_content",      // 검색 콘텐츠
  "body",                 // 최종 fallback
];

const GOOGLE_RESULT_SELECTORS = [
  "#search",              // 메인 검색 결과 영역
  "#rso",                 // 검색 결과 목록
  "#main",                // 메인 콘텐츠
  "#center_col",          // 중앙 컬럼
  "body",                 // 최종 fallback
];

// ── 구글 쿠키 동의 팝업 셀렉터 (다중 fallback) ──
const GOOGLE_CONSENT_SELECTORS = [
  'button[id="L2AGLb"]',           // "모두 동의" 버튼
  'button[id="W0wltc"]',           // "모두 거부" 버튼
  '[aria-label="Accept all"]',     // 영문 Accept all
  '[aria-label="모두 수락"]',       // 한국어 모두 수락
  'button.tHlp8d',                 // 클래스 기반
  'form[action*="consent"] button', // 폼 기반
];

/**
 * 안전하게 브라우저를 실행
 */
async function launchBrowser(): Promise<Browser> {
  const fs = await import("fs");
  const systemChromium = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
  const foundPath = systemChromium.find(p => fs.existsSync(p));
  
  const opts: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      `--window-size=${CONFIG.VIEWPORT.width},${CONFIG.VIEWPORT.height}`,
    ],
    timeout: 15000,
  };
  if (foundPath) {
    opts.executablePath = foundPath;
  }
  return puppeteer.launch(opts);
}

/**
 * 구글 쿠키 동의 팝업 처리 (다중 셀렉터 fallback)
 */
async function dismissGoogleConsent(page: Page): Promise<void> {
  for (const selector of GOOGLE_CONSENT_SELECTORS) {
    try {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        await new Promise((r) => setTimeout(r, 800));
        return;
      }
    } catch {
      // 셀렉터 실패 → 다음 시도
    }
  }
}

/**
 * 검색 결과 영역이 로드될 때까지 대기 (다중 셀렉터 fallback)
 */
async function waitForSearchResults(
  page: Page,
  engine: "naver" | "google",
): Promise<void> {
  const selectors = engine === "naver" ? NAVER_RESULT_SELECTORS : GOOGLE_RESULT_SELECTORS;

  for (const selector of selectors) {
    if (selector === "body") break; // body는 항상 존재하므로 skip
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      return; // 성공하면 즉시 리턴
    } catch {
      // 이 셀렉터 없음 → 다음 시도
    }
  }
  // 모든 셀렉터 실패 → 기본 대기 후 진행
  await new Promise((r) => setTimeout(r, CONFIG.RENDER_WAIT));
}

/**
 * 네이버 검색 결과에서 불필요한 요소 숨기기 (광고 배너 등)
 */
async function cleanupNaverPage(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      // 상단 광고 배너 숨기기
      const adSelectors = [
        ".ad_area",
        ".sp_tit",
        "#timesquare_ad",
        ".banner_area",
      ];
      adSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      });
    });
  } catch {
    // 페이지 조작 실패 무시
  }
}

/**
 * 구글 검색 결과에서 불필요한 요소 숨기기
 */
async function cleanupGooglePage(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      // 상단 광고 숨기기
      const adSelectors = [
        "#tads",
        "#bottomads",
        ".commercial-unit-desktop-top",
      ];
      adSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      });
    });
  } catch {
    // 페이지 조작 실패 무시
  }
}

/**
 * placeholder 이미지 생성 (캡처 실패 시 대체)
 * 간단한 SVG → PNG 변환 대신, 회색 배경에 텍스트를 넣은 HTML 캡처
 */
async function generatePlaceholderImage(
  browser: Browser,
  engine: "naver" | "google",
  keyword: string,
): Promise<Buffer | null> {
  try {
    const page = await browser.newPage();
    await page.setViewport(CONFIG.VIEWPORT);

    const engineName = engine === "naver" ? "Naver" : "Google";
    const engineColor = engine === "naver" ? "#03C75A" : "#4285F4";

    await page.setContent(`
      <html>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;
          width:${CONFIG.VIEWPORT.width}px;height:${CONFIG.VIEWPORT.height}px;
          background:#f5f5f5;font-family:sans-serif;color:#666;">
          <div style="text-align:center;padding:40px;">
            <div style="font-size:48px;color:${engineColor};font-weight:bold;margin-bottom:20px;">
              ${engineName}
            </div>
            <div style="font-size:24px;color:#333;margin-bottom:16px;">
              "${keyword}"
            </div>
            <div style="font-size:16px;color:#999;line-height:1.6;">
              검색 결과 캡처를 일시적으로 불러올 수 없습니다.<br/>
              실제 검색 결과는 ${engineName}에서 직접 확인해 주세요.
            </div>
            <div style="margin-top:30px;padding:12px 24px;background:${engineColor};
              color:white;border-radius:8px;display:inline-block;font-size:14px;">
              ${engine === "naver" ? "search.naver.com" : "google.com"} 에서 검색
            </div>
          </div>
        </body>
      </html>
    `, { waitUntil: "load" });

    const buf = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: CONFIG.VIEWPORT.width, height: CONFIG.VIEWPORT.height },
    });
    await page.close();
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

/**
 * 단일 검색 엔진 + 키워드 조합 캡처 (재시도 포함)
 */
async function captureSingle(
  browser: Browser,
  keyword: string,
  engine: "naver" | "google",
): Promise<{ buffer: Buffer; isPlaceholder: boolean }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, CONFIG.RETRY_DELAY));
    }

    let page: Page | null = null;
    try {
      page = await browser.newPage();
      await page.setViewport(CONFIG.VIEWPORT);
      await page.setUserAgent(CONFIG.USER_AGENT);

      // 불필요한 리소스 차단 (속도 향상)
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const type = req.resourceType();
        if (["media", "font", "websocket"].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // 검색 URL 구성
      const searchUrl =
        engine === "naver"
          ? `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`
          : `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=kr`;

      // 페이지 이동 (networkidle2 대신 domcontentloaded 사용 → 더 빠름)
      await page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: CONFIG.PAGE_TIMEOUT,
      });

      // 검색 결과 영역 대기
      await waitForSearchResults(page, engine);

      // 추가 렌더링 대기
      await new Promise((r) => setTimeout(r, CONFIG.RENDER_WAIT));

      // 구글 쿠키 동의 처리
      if (engine === "google") {
        await dismissGoogleConsent(page);
      }

      // 불필요한 요소 정리
      if (engine === "naver") {
        await cleanupNaverPage(page);
      } else {
        await cleanupGooglePage(page);
      }

      // 스크린샷 캡처
      const screenshotBuffer = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: CONFIG.VIEWPORT.width, height: CONFIG.VIEWPORT.height },
      });

      await page.close();
      return { buffer: Buffer.from(screenshotBuffer), isPlaceholder: false };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (page) {
        try { await page.close(); } catch { /* ignore */ }
      }
    }
  }

  // 모든 재시도 실패 → placeholder 생성
  logger.warn(`${engine}/${keyword} 캡처 ${CONFIG.MAX_RETRIES + 1}회 실패, placeholder 생성`, { error: lastError?.message });

  const placeholder = await generatePlaceholderImage(browser, engine, keyword);
  if (placeholder) {
    return { buffer: placeholder, isPlaceholder: true };
  }

  throw lastError || new Error("캡처 및 placeholder 생성 모두 실패");
}

/**
 * 네이버/구글에서 키워드를 검색하고 결과 화면을 캡처
 *
 * @param keywords - 검색할 키워드 배열
 * @param engines - 검색 엔진 목록 (기본: naver, google)
 * @param maxKeywords - 최대 키워드 수 (기본: 3)
 * @returns 캡처 결과 (screenshots + errors)
 */
export async function captureSearchScreenshots(
  keywords: string[],
  engines: ("naver" | "google")[] = ["naver", "google"],
  maxKeywords: number = 3,
): Promise<SearchScreenshotResult> {
  const screenshots: SearchScreenshot[] = [];
  const errors: string[] = [];

  // 빈 키워드 배열 처리
  if (!keywords || keywords.length === 0) {
    return { screenshots, errors };
  }

  // 키워드 수 제한 + 정제
  const targetKeywords = keywords
    .slice(0, maxKeywords)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (targetKeywords.length === 0) {
    return { screenshots, errors };
  }

  // eslint-disable-next-line no-useless-assignment
  let browser: Browser | null = null;

  try {
    browser = await getBrowser();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`브라우저 실행 실패: ${msg}`);
    return { screenshots, errors };
  }

  try {
    for (const keyword of targetKeywords) {
      for (const engine of engines) {
        try {
          const { buffer, isPlaceholder } = await captureSingle(browser, keyword, engine);

          // S3에 업로드
          const timestamp = Date.now();
          const safeKeyword = keyword
            .replace(/[^a-zA-Z0-9가-힣]/g, "_")
            .slice(0, 30);
          const prefix = isPlaceholder ? "search-screenshots/placeholder" : "search-screenshots";
          const fileKey = `${prefix}/${engine}-${safeKeyword}-${timestamp}.png`;

          const { url } = await storagePut(fileKey, buffer, "image/png");

          screenshots.push({
            engine,
            keyword,
            imageUrl: url,
            capturedAt: timestamp,
            isPlaceholder,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`[${engine}] "${keyword}" 캡처 실패: ${msg}`);
          // 개별 실패는 전체를 중단시키지 않음
        }
      }
    }
  } finally {
    if (browser) {
      try {
        // browser managed by pool
      } catch {
        // 브라우저 종료 실패 무시
      }
    }
  }

  return { screenshots, errors };
}

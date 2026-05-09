/**
 * AI 가시성 진단 보고서 — Puppeteer PDF 렌더링 모듈
 * 
 * HTML → PDF 변환 로직을 분리하여 단일 책임 원칙 준수.
 * 향후 PDF 엔진 교체(wkhtmltopdf, WeasyPrint 등) 시 이 파일만 수정.
 */
import puppeteer from "puppeteer";
import * as fs from "fs";

// ── Types ──
export interface PdfRenderOptions {
  format?: "A4" | "Letter";
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  timeout?: number;
  waitForFonts?: boolean;
  extraDelay?: number;
}

const DEFAULT_OPTIONS: Required<PdfRenderOptions> = {
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  timeout: 30000,
  waitForFonts: true,
  extraDelay: 500,
};

// ── Chromium path detection ──
function findChromiumPath(): string | undefined {
  const systemPaths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  return systemPaths.find(p => fs.existsSync(p));
}

// ── Main render function ──

/**
 * HTML 문자열을 PDF Buffer로 변환
 */
export async function renderHtmlToPdf(
  html: string,
  options: PdfRenderOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chromiumPath = findChromiumPath();

  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--font-render-hinting=none",
    ],
    timeout: opts.timeout,
  };

  if (chromiumPath) {
    launchOptions.executablePath = chromiumPath;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: opts.timeout,
    });

    if (opts.waitForFonts) {
      await page.evaluate(() => document.fonts.ready);
    }

    if (opts.extraDelay > 0) {
      await new Promise(r => setTimeout(r, opts.extraDelay));
    }

    const pdfBuffer = await page.pdf({
      format: opts.format,
      printBackground: opts.printBackground,
      preferCSSPageSize: true,
      margin: opts.margin,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * HTML 문자열을 스크린샷(PNG)으로 변환 — 디버깅/프리뷰용
 */
export async function renderHtmlToScreenshot(
  html: string,
  options: { width?: number; height?: number; timeout?: number } = {}
): Promise<Buffer> {
  const { width = 1200, height = 1600, timeout = 30000 } = options;
  const chromiumPath = findChromiumPath();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    timeout,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "networkidle0", timeout });
    const screenshot = await page.screenshot({ fullPage: true, type: "png" });
    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}

/**
 * Google PageSpeed Insights API Client
 * 실측 성능 데이터(Core Web Vitals)를 조회하여 SEO 진단 정확도를 높인다.
 */

export interface PageSpeedMetrics {
  // Lighthouse 카테고리 점수 (0~100)
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;

  // Core Web Vitals (실측)
  lcp: { value: number; unit: string; score: number; displayValue: string }; // Largest Contentful Paint
  fcp: { value: number; unit: string; score: number; displayValue: string }; // First Contentful Paint
  cls: { value: number; unit: string; score: number; displayValue: string }; // Cumulative Layout Shift
  tbt: { value: number; unit: string; score: number; displayValue: string }; // Total Blocking Time
  si: { value: number; unit: string; score: number; displayValue: string };  // Speed Index
  tti: { value: number; unit: string; score: number; displayValue: string }; // Time to Interactive

  // CrUX 실사용자 데이터 (있을 경우)
  crux: {
    available: boolean;
    lcpMs?: number;
    lcpCategory?: string;
    fcpMs?: number;
    fcpCategory?: string;
    clsScore?: number;
    clsCategory?: string;
    inpMs?: number;
    inpCategory?: string;
    ttfbMs?: number;
    ttfbCategory?: string;
  };

  // 주요 감사 항목
  diagnostics: {
    renderBlockingResources: number;
    unminifiedCss: boolean;
    unminifiedJs: boolean;
    unusedCss: boolean;
    unusedJs: boolean;
    modernImageFormats: boolean;
    efficientAnimations: boolean;
    textCompression: boolean;
    serverResponseTime: number; // ms
    domSize: number;
    redirects: number;
    thirdPartyUsage: number; // 제3자 스크립트 차단 시간 ms
  };

  // 메타 정보
  fetchedUrl: string;
  strategy: "mobile" | "desktop";
  fetchTimestamp: string;
}

function extractMetric(audits: any, key: string): { value: number; unit: string; score: number; displayValue: string } {
  const audit = audits[key] || {};
  return {
    value: audit.numericValue || 0,
    unit: audit.numericUnit || "millisecond",
    score: (audit.score || 0),
    displayValue: audit.displayValue || "N/A",
  };
}

function extractCrux(loadingExperience: any): PageSpeedMetrics["crux"] {
  if (!loadingExperience || !loadingExperience.metrics) {
    return { available: false };
  }

  const m = loadingExperience.metrics;
  return {
    available: true,
    lcpMs: m.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
    lcpCategory: m.LARGEST_CONTENTFUL_PAINT_MS?.category,
    fcpMs: m.FIRST_CONTENTFUL_PAINT_MS?.percentile,
    fcpCategory: m.FIRST_CONTENTFUL_PAINT_MS?.category,
    clsScore: m.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile,
    clsCategory: m.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category,
    inpMs: m.INTERACTION_TO_NEXT_PAINT?.percentile,
    inpCategory: m.INTERACTION_TO_NEXT_PAINT?.category,
    ttfbMs: m.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile,
    ttfbCategory: m.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.category,
  };
}

function extractDiagnostics(audits: any): PageSpeedMetrics["diagnostics"] {
  const getCount = (key: string) => {
    const items = audits[key]?.details?.items;
    return Array.isArray(items) ? items.length : 0;
  };

  const hasFailed = (key: string) => (audits[key]?.score ?? 1) < 1;

  return {
    renderBlockingResources: getCount("render-blocking-resources"),
    unminifiedCss: hasFailed("unminified-css"),
    unminifiedJs: hasFailed("unminified-javascript"),
    unusedCss: hasFailed("unused-css-rules"),
    unusedJs: hasFailed("unused-javascript"),
    modernImageFormats: hasFailed("modern-image-formats"),
    efficientAnimations: hasFailed("efficient-animated-content"),
    textCompression: hasFailed("uses-text-compression"),
    serverResponseTime: audits["server-response-time"]?.numericValue || 0,
    domSize: audits["dom-size"]?.numericValue || 0,
    redirects: getCount("redirects"),
    thirdPartyUsage: audits["third-party-summary"]?.details?.summary?.wastedMs || 0,
  };
}

// ── In-memory cache (10분 TTL) + in-flight 중복 방지 ──
const _psCache = new Map<string, { data: PageSpeedMetrics; ts: number }>();
const _psInflight = new Map<string, Promise<PageSpeedMetrics | null>>();
const PS_CACHE_TTL = 10 * 60 * 1000; // 10분

/**
 * Google PageSpeed Insights API를 호출하여 성능 데이터를 가져온다.
 * API 키가 없거나 호출 실패 시 null을 반환한다 (진단은 계속 진행).
 * 캐시: 10분 TTL + in-flight 중복 방지
 */
export async function fetchPageSpeedMetrics(
  url: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedMetrics | null> {
  const cacheKey = `${url}::${strategy}`;

  // 1) 캐시 확인
  const cached = _psCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PS_CACHE_TTL) {
    console.log(`[PageSpeed] Cache hit for ${url} (${strategy})`);
    return cached.data;
  }

  // 2) in-flight 중복 방지
  const inflight = _psInflight.get(cacheKey);
  if (inflight) {
    console.log(`[PageSpeed] Deduplicating in-flight request for ${url}`);
    return inflight;
  }

  const promise = _fetchPageSpeedMetricsInternal(url, strategy, cacheKey);
  _psInflight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    _psInflight.delete(cacheKey);
  }
}

async function _fetchPageSpeedMetricsInternal(
  url: string,
  strategy: "mobile" | "desktop",
  cacheKey: string,
): Promise<PageSpeedMetrics | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    console.warn("[PageSpeed] GOOGLE_PAGESPEED_API_KEY not set, skipping PageSpeed analysis");
    return null;
  }

  try {
    const params = new URLSearchParams({
      url,
      key: apiKey,
      strategy: strategy.toUpperCase(),
    });
    // 4개 카테고리 모두 요청
    ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"].forEach((cat) => {
      params.append("category", cat);
    });

    const apiUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.warn(`[PageSpeed] API returned ${response.status}: ${errorBody.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;
    if (!lighthouse) {
      console.warn("[PageSpeed] No lighthouseResult in response");
      return null;
    }

    const categories = lighthouse.categories || {};
    const audits = lighthouse.audits || {};

    const result: PageSpeedMetrics = {
      performanceScore: Math.round((categories.performance?.score || 0) * 100),
      accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
      bestPracticesScore: Math.round((categories["best-practices"]?.score || 0) * 100),
      seoScore: Math.round((categories.seo?.score || 0) * 100),

      lcp: extractMetric(audits, "largest-contentful-paint"),
      fcp: extractMetric(audits, "first-contentful-paint"),
      cls: extractMetric(audits, "cumulative-layout-shift"),
      tbt: extractMetric(audits, "total-blocking-time"),
      si: extractMetric(audits, "speed-index"),
      tti: extractMetric(audits, "interactive"),

      crux: extractCrux(data.loadingExperience),

      diagnostics: extractDiagnostics(audits),

      fetchedUrl: lighthouse.finalUrl || url,
      strategy: strategy,
      fetchTimestamp: lighthouse.fetchTime || new Date().toISOString(),
    };

    // 캐시 저장
    _psCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (error: any) {
    console.warn(`[PageSpeed] Failed to fetch metrics: ${error.message}`);
    return null;
  }
}

/**
 * Core Web Vitals 등급 판정
 */
export function getCWVRating(metrics: PageSpeedMetrics): {
  lcp: "good" | "needs-improvement" | "poor";
  fcp: "good" | "needs-improvement" | "poor";
  cls: "good" | "needs-improvement" | "poor";
  tbt: "good" | "needs-improvement" | "poor";
  overall: "good" | "needs-improvement" | "poor";
} {
  const lcpMs = metrics.lcp.value;
  const fcpMs = metrics.fcp.value;
  const clsVal = metrics.cls.value;
  const tbtMs = metrics.tbt.value;

  const lcpRating = lcpMs <= 2500 ? "good" : lcpMs <= 4000 ? "needs-improvement" : "poor";
  const fcpRating = fcpMs <= 1800 ? "good" : fcpMs <= 3000 ? "needs-improvement" : "poor";
  const clsRating = clsVal <= 0.1 ? "good" : clsVal <= 0.25 ? "needs-improvement" : "poor";
  const tbtRating = tbtMs <= 200 ? "good" : tbtMs <= 600 ? "needs-improvement" : "poor";

  // 전체 등급: 모두 good이면 good, 하나라도 poor면 poor, 나머지 needs-improvement
  const ratings = [lcpRating, fcpRating, clsRating, tbtRating];
  const overall = ratings.every((r) => r === "good")
    ? "good"
    : ratings.some((r) => r === "poor")
    ? "poor"
    : "needs-improvement";

  return { lcp: lcpRating, fcp: fcpRating, cls: clsRating, tbt: tbtRating, overall };
}

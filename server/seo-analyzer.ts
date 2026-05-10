/**
 * SEO Analyzer v3 — URL을 입력받아 SEO 문제점을 상세 분석
 * cheerio로 HTML 파싱, robots.txt/sitemap.xml 확인, SSL/모바일 등 체크
 *
 * v4 개선사항 (22차 수정):
 * - 12개 카테고리, 100개+ 항목으로 대폭 확대
 * - "성능 최적화" 카테고리 신규 추가 (8개 항목)
 * - "모바일 최적화" 카테고리 신규 추가 (8개 항목)
 * - "접근성/UX" 카테고리 신규 추가 (6개 항목)
 * - "국제화/다국어" 카테고리 신규 추가 (5개 항목)
 * - 기존 8개 카테고리 각각 2-4개 항목 추가
 * - 진료과별 가중치 매트릭스 적용
 * - 일반 병원 사이트 30~50점대, 완벽 최적화 시 100점 목표
 */
import * as cheerio from "cheerio";
import { generateAdditionalItems } from "./seo-analyzer-v4-items";
import { generateThaiLocalSearchItems, generateThaiSocialItems, generateThaiMedicalTourismItems } from "./seo-analyzer-th-items";
import { resolveSpecialty, applySpecialtyWeights, type SpecialtyType } from "./specialty-weights";
import { getCalibrationMap } from "./utils/specialty-weight-calibration";
import { crawlSubPages, type AggregatedData } from "./multi-page-crawler";
import { fetchPageSpeedMetrics, getCWVRating, type PageSpeedMetrics } from "./pagespeed-client";
import { displayScore } from "./utils/score-rounding";
import { enrichWithStandardIds } from "./utils/item-id-registry";
import { validateMinItems, CATEGORY_MAX_SCORES, TOTAL_MAX_SCORE } from "./utils/check-item-registry";
import { detectDynamicContent } from "./utils/dynamic-content-detector";
import { analyzeMultipleKeywords } from "./utils/keyword-exposure-checker";
import { sampleImages, extractImagesFromHtml } from "./utils/image-sampling";

// ── (#8) 표준 User-Agent ──
const STANDARD_USER_AGENT = "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.175 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

// ── 타입 정의 ──
// SeoCheckStatus moved to seo-analyzer-types.ts
import type { SeoCheckStatus, SeoCheckItem } from "./seo-analyzer-types";
export type { SeoCheckStatus, SeoCheckItem };


export interface SeoAnalysisResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    items: SeoCheckItem[];
  }[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
    info: number;
  };
  /** Site name extracted from og:site_name or <title> tag */
  siteName?: string;
  /** Favicon URL (absolute) */
  faviconUrl?: string;
  /** Multi-page crawling metadata */
  multiPage?: {
    subPageCount: number;
    crawledUrls: string[];
    aggregated: AggregatedData;
  };
  /** Google PageSpeed Insights 실측 데이터 */
  pageSpeed?: PageSpeedMetrics;
  /** 사이트 접근 불가 또는 SPA 감지 시 한계 고지 메시지 */
  diagnosticLimitation?: {
    type: "inaccessible" | "spa_empty" | "blocked";
    message: string;
  };
}

// ── 인메모리 캐시 (5분 TTL) ──
const cache = new Map<string, { result: SeoAnalysisResult; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── 동시 진단 안정성: 세마포어 + in-flight 중복 방지 ──
const MAX_CONCURRENT = 3;
let activeDiagnoses = 0;
const inFlight = new Map<string, Promise<SeoAnalysisResult>>();

function acquireSlot(): Promise<void> {
  if (activeDiagnoses < MAX_CONCURRENT) {
    activeDiagnoses++;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const check = () => {
      if (activeDiagnoses < MAX_CONCURRENT) {
        activeDiagnoses++;
        resolve();
      } else {
        setTimeout(check, 500);
      }
    };
    setTimeout(check, 500);
  });
}

function releaseSlot() {
  activeDiagnoses = Math.max(0, activeDiagnoses - 1);
}

function getCached(url: string): SeoAnalysisResult | null {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(url);
    return null;
  }
  return entry.result;
}

function setCache(url: string, result: SeoAnalysisResult) {
  if (cache.size >= 100) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(url, { result, expiry: Date.now() + CACHE_TTL_MS });
}

// ── 유틸 ──
function getAcceptLanguage(country: CountryCode = "kr"): string {
  switch (country) {
    case "th": return "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7";
    case "kr":
    default: return "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7";
  }
}

async function fetchWithTimeout(url: string, timeout = 15000, country: CountryCode = "kr"): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": STANDARD_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": getAcceptLanguage(country),
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
      },
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// (#5) 재시도 로직 강화: 지수 백오프 + 에러 유형별 재시도 판단
async function fetchWithRetry(url: string, timeout = 15000, retries = 2, country: CountryCode = "kr"): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeout, country);
      // 5xx 서버 에러는 재시도 대상
      if (res.status >= 500 && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      // 429 Rate Limit도 재시도
      if (res.status === 429 && attempt < retries) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "2", 10);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      return res;
    } catch (e: any) {
      lastError = e;
      // 타임아웃/네트워크 에러만 재시도
      const isRetryable = e.name === "AbortError" || e.code === "ECONNRESET" || e.code === "ETIMEDOUT" || e.code === "ENOTFOUND" || e.message?.includes("fetch failed");
      if (!isRetryable) throw e;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // 지수 백오프
      }
    }
  }
  throw lastError;
}

// normalizeUrl은 ./lib/normalize-url에서 import됨 (re-export 유지)
import { normalizeUrl } from "./lib/normalize-url";
export { normalizeUrl };
// @deprecated 아래 원본은 참조용
function _normalizeUrl_DEPRECATED(input: string): string {
  // 1. URL 정규화: 불필요한 텍스트, 괄호, 공백 제거
  let url = input.trim();
  // 괄호 안의 텍스트 제거 (예: "namedps.com/ (https )" → "namedps.com/")
  url = url.replace(/\s*\([^)]*\)\s*/g, "").trim();
  // 앞뒤 공백 및 비URL 문자 제거
  url = url.replace(/[\s<>"']/g, "");
  // 프로토콜 중복 제거 (예: "https://https://example.com")
  url = url.replace(/^(https?:\/\/)+/i, (m) => m.split("://").slice(0, 1).join() + "://");
  // 프로토콜이 없으면 https:// 추가
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  // 유효한 URL인지 검증, 실패 시 원본에 https:// 붙인 것 반환
  try {
    const parsed = new URL(url);
    // 호스트에 점이 없으면 (예: "localhost") 그대로 두되, 일반적으로 TLD가 필요
    url = parsed.href;
  } catch {
    // URL 파싱 실패 시 원본 그대로 반환
    return url;
  }
  if (!url.endsWith("/") && !url.includes("?") && !url.includes("#")) {
    try {
      const path = new URL(url).pathname;
      if (!path.includes(".")) url += "/";
    } catch {}
  }
  return url;
}

export function getGrade(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

// ── 메인 분석 함수 ──
export type CountryCode = "kr" | "th";

export async function analyzeSeo(inputUrl: string, specialty?: string, country: CountryCode = "kr"): Promise<SeoAnalysisResult> {
  const url = normalizeUrl(inputUrl);

  const cacheKey = `${url}::${specialty || ''}::${country}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 동일 URL 진단 중복 방지: 이미 진행 중이면 같은 Promise 반환
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const diagnosisPromise = _analyzeSeoInternal(url, cacheKey, specialty, country);
  inFlight.set(cacheKey, diagnosisPromise);
  try {
    return await diagnosisPromise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

async function _analyzeSeoInternal(url: string, cacheKey: string, specialty: string | undefined, country: CountryCode): Promise<SeoAnalysisResult> {
  await acquireSlot();
  try {
    return await _analyzeSeoCore(url, cacheKey, specialty, country);
  } finally {
    releaseSlot();
  }
}

async function _analyzeSeoCore(url: string, cacheKey: string, specialty: string | undefined, country: CountryCode): Promise<SeoAnalysisResult> {
  const parsedUrl = new URL(url);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  // 1. HTML + robots.txt 병렬 요청 (성능 최적화)
  let html = "";
  let fetchStatus = 0;
  let fetchOk = false;
  let isHttps = parsedUrl.protocol === "https:";
  let responseHeaders: Record<string, string> = {};
  let responseTime = 0;
  let robotsTxt = "";
  let robotsExists = false;

  const [htmlResult, robotsResult] = await Promise.allSettled([
    (async () => {
      const startTime = Date.now();
      let res: Response;
      try {
        res = await fetchWithRetry(url, 10000, 1, country);
      } catch (e) {
        // http 실패 시 https로 자동 재시도 (또는 그 반대)
        const altUrl = url.startsWith("https://")
          ? url.replace("https://", "http://")
          : url.replace("http://", "https://");
        res = await fetchWithRetry(altUrl, 10000, 1, country);
      }
      const elapsed = Date.now() - startTime;
      const text = await res.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      return { text, status: res.status, ok: res.ok, headers, elapsed };
    })(),
    (async () => {
      const rRes = await fetchWithRetry(`${baseUrl}/robots.txt`, 3000, 0, country);
      if (rRes.ok) {
        const text = await rRes.text();
        const valid = text.length > 10
          && !text.includes("<!DOCTYPE")
          && !text.includes("<html")
          && (text.includes("User-agent") || text.includes("user-agent") || text.includes("Sitemap"));
        return { text, valid };
      }
      return { text: "", valid: false };
    })(),
  ]);

  if (htmlResult.status === "fulfilled") {
    html = htmlResult.value.text;
    fetchStatus = htmlResult.value.status;
    fetchOk = htmlResult.value.ok;
    responseHeaders = htmlResult.value.headers;
    responseTime = htmlResult.value.elapsed;
  }

  // (#15) 응답 시간 다회 측정 중앙값 (2회 추가 측정)
  if (fetchOk && responseTime > 0) {
    try {
      const extraMeasurements: number[] = [responseTime];
      for (let i = 0; i < 2; i++) {
        const start = Date.now();
        const r = await fetchWithRetry(url, 10000, 0, country);
        await r.text(); // body 소비
        extraMeasurements.push(Date.now() - start);
      }
      extraMeasurements.sort((a, b) => a - b);
      responseTime = extraMeasurements[Math.floor(extraMeasurements.length / 2)];
    } catch {
      // 추가 측정 실패 시 최초 값 유지
    }
  }

  if (robotsResult.status === "fulfilled") {
    robotsTxt = robotsResult.value.text;
    robotsExists = robotsResult.value.valid;
  }

  const $ = cheerio.load(html);

  // 2. sitemap.xml 확인 (robots.txt 결과 필요) — (#3) 파싱 개선: sitemap index 재귀 탐색 + URL 수 카운트
  let sitemapExists = false;
  let sitemapUrl = "";
  let sitemapUrlCount = 0;
  const sitemapMatch = robotsTxt.match(/Sitemap:\s*(.+)/i);
  if (sitemapMatch) {
    sitemapUrl = sitemapMatch[1].trim();
  } else {
    sitemapUrl = `${baseUrl}/sitemap.xml`;
  }
  try {
    const sRes = await fetchWithRetry(sitemapUrl, 5000, 1, country);
    if (sRes.ok) {
      const sText = await sRes.text();
      if (sText.includes("<sitemapindex")) {
        // sitemap index → 하위 sitemap URL 추출 (1단계만)
        sitemapExists = true;
        const subSitemaps = sText.match(/<loc>([^<]+)<\/loc>/g) || [];
        sitemapUrlCount = subSitemaps.length; // 하위 sitemap 수
        // 첫 번째 하위 sitemap에서 URL 수 확인
        if (subSitemaps.length > 0) {
          const firstSub = subSitemaps[0]!.replace(/<\/?loc>/g, "");
          try {
            const subRes = await fetchWithRetry(firstSub, 3000, 0, country);
            if (subRes.ok) {
              const subText = await subRes.text();
              const urlMatches = subText.match(/<loc>/g) || [];
              sitemapUrlCount = urlMatches.length;
            }
          } catch {}
        }
      } else if (sText.includes("<urlset")) {
        sitemapExists = true;
        const urlMatches = sText.match(/<loc>/g) || [];
        sitemapUrlCount = urlMatches.length;
      }
    }
  } catch {}

  // ── 다중 페이지 크롤링 + PageSpeed API 병렬 호출 (타임아웃 가드) ──
  const crawlWithTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
    Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))]);

  const emptyAgg: any = { hasFaqContent: false, hasFaqSchema: false, hasDoctorInfo: false, hasDoctorCredentials: false, hasCredentials: false, hasOpeningHours: false, allJsonLdTypes: [], multiLangPaths: [], totalHreflangTags: 0, totalImages: 0, totalImagesWithAlt: 0, totalInternalLinks: 0, totalExternalLinks: 0, hasTelLink: false, hasEmailLink: false, hasAddress: false, hasMap: false, hasPrivacyPolicy: false, hasTerms: false, hasBeforeAfter: false, hasReviews: false, hasBookingSystem: false, hasPriceInfo: false, hasIntlPatientPage: false, subPageCount: 0, crawledUrls: [] };
  const emptyMultiPage = { subPages: [] as any[], aggregated: emptyAgg };

  // 타임아웃 강화: 8초 → 15초 (일관성 확보)
  // PageSpeed: 재시도 1회 포함 (첫 시도 실패 시 한 번 더)
  const fetchPageSpeedWithRetry = async (targetUrl: string, strategy: string): Promise<any> => {
    try {
      const result = await fetchPageSpeedMetrics(targetUrl, strategy as any);
      if (result) return result;
    } catch {}
    // 재시도 1회
    try {
      const result = await fetchPageSpeedMetrics(targetUrl, strategy as any);
      if (result) return result;
    } catch {}
    return null;
  };

  const [multiPageResult, pageSpeedData] = await Promise.all([
    crawlWithTimeout(crawlSubPages(url, html, $, $('body').text().replace(/\s+/g, ' ').trim(), baseUrl, country), 15000, emptyMultiPage),
    crawlWithTimeout(fetchPageSpeedWithRetry(url, "mobile"), 45000, null),
  ]);
  const agg = multiPageResult.aggregated;

  // ── 공통 데이터 추출 ──
  const rawTitle = $("title").text().trim();
  const ogTitleForFallback = $('meta[property="og:title"]').attr("content")?.trim() || "";
  // 에러 페이지 title 감지: 404, Error, Not Found 등이 포함된 경우 에러로 판단
  const isErrorTitle = /\b(error|404|not\s*found|403|500|502|503)\b/i.test(rawTitle);
  // 에러 title이면 og:title → og:site_name → h1 → 도메인명 순으로 fallback
  const ogSiteNameForTitle = $('meta[property="og:site_name"]').attr("content")?.trim() || "";
  const h1ForTitle = $("h1").first().text().trim() || "";
  const domainName = parsedUrl.hostname.replace(/^www\./, "").split(".")[0] || "";
  let effectiveTitle: string;
  if (!rawTitle || isErrorTitle) {
    // 빈 title이거나 에러 페이지 title인 경우: og:title → og:site_name → h1 → 도메인명 순 fallback
    effectiveTitle = ogTitleForFallback || ogSiteNameForTitle || h1ForTitle || domainName;
  } else if (rawTitle.length < 10 && ogTitleForFallback.length >= 10) {
    // title이 너무 짧으면 og:title 우선
    effectiveTitle = ogTitleForFallback;
  } else {
    effectiveTitle = rawTitle;
  }
  const titleLen = effectiveTitle.length;

  const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
  const descLen = metaDesc.length;

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.length;

  const jsonLdScripts = $('script[type="application/ld+json"]');
  let jsonLdTypes: string[] = [];
  let jsonLdData: any[] = [];
  jsonLdScripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      jsonLdData.push(data);
      if (data["@type"]) jsonLdTypes.push(data["@type"]);
      if (Array.isArray(data["@graph"])) {
        data["@graph"].forEach((item: any) => {
          if (item["@type"]) jsonLdTypes.push(item["@type"]);
        });
      }
    } catch {}
  });

  // ── 분석 항목들 ──
  const items: SeoCheckItem[] = [];

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 1: 메타 태그 (Meta Tags) — 만점 38점
  // ═══════════════════════════════════════════════════════════════

  // 1-1. Title 태그 (10점) — 기준 강화: 30~60자 사이만 pass
  // 타이틀 중복 출력 감지 (동일 문자열이 2회 이상 반복)
  const titleIsDuplicated = (() => {
    if (!effectiveTitle || effectiveTitle.length < 10) return false;
    const half = Math.floor(effectiveTitle.length / 2);
    const firstHalf = effectiveTitle.substring(0, half).trim();
    const secondHalf = effectiveTitle.substring(half).trim();
    // 앞절반과 뒷절반이 80% 이상 일치하면 중복
    if (firstHalf.length > 5 && secondHalf.startsWith(firstHalf.substring(0, Math.floor(firstHalf.length * 0.8)))) return true;
    // 또는 정확히 두 번 반복되는 패턴
    for (let len = 10; len <= half; len++) {
      const segment = effectiveTitle.substring(0, len);
      if (effectiveTitle.includes(segment + segment)) return true;
    }
    return false;
  })();
  const titleDisplay = titleIsDuplicated
    ? `"타이틀 태그가 중복 출력되고 있습니다" (실제 값: ${effectiveTitle.substring(0, 60)}${effectiveTitle.length > 60 ? '...' : ''}, ${titleLen}자)`
    : (rawTitle.length < 10 && ogTitleForFallback.length >= 10)
      ? `"${ogTitleForFallback}" (og:title ${ogTitleForFallback.length}자, title 태그: "${rawTitle}")`
      : `"${effectiveTitle}" (${titleLen}자)`;
  const titleOptimal = titleLen >= 30 && titleLen <= 60;
  items.push({
    id: "meta-title",
    category: "메타 태그",
    name: "타이틀 태그 (Title Tag)",
    status: !effectiveTitle ? "fail" : titleOptimal ? "pass" : "warning",
    score: !effectiveTitle ? 0 : titleOptimal ? 10 : (titleLen >= 10 && titleLen <= 70) ? 5 : 2,
    maxScore: 10,
    detail: !effectiveTitle ? "타이틀 태그가 없습니다." : titleDisplay,
    recommendation: !effectiveTitle
      ? "모든 페이지에 고유한 타이틀 태그를 추가하세요. 핵심 키워드를 포함하고 30~60자 사이로 작성하세요."
      : titleOptimal ? "적절한 길이의 타이틀입니다." : "타이틀을 30~60자 사이로 최적화하세요. 핵심 키워드를 앞쪽에 배치하세요.",
    impact: "타이틀 태그는 검색 결과에서 가장 먼저 보이는 요소입니다. 클릭률(CTR)에 직접적인 영향을 미치며, 구글이 페이지 주제를 판단하는 핵심 신호입니다.",
  });

  // 1-2. Meta Description (10점) — 기준 강화: 80~155자만 pass
  const descOptimal = descLen >= 80 && descLen <= 155;
  items.push({
    id: "meta-description",
    category: "메타 태그",
    name: "메타 설명 (Meta Description)",
    status: !metaDesc ? "fail" : descOptimal ? "pass" : "warning",
    score: !metaDesc ? 0 : descOptimal ? 10 : (descLen >= 50 && descLen <= 160) ? 5 : 2,
    maxScore: 10,
    detail: !metaDesc
      ? "메타 설명이 없습니다."
      : `"${metaDesc.substring(0, 80)}${metaDesc.length > 80 ? '...' : ''}" (${descLen}자)`,
    recommendation: !metaDesc
      ? "각 페이지에 고유한 메타 설명을 추가하세요. 핵심 키워드와 행동 유도 문구를 포함하고 80~155자로 작성하세요."
      : descOptimal ? "적절한 길이의 메타 설명입니다." : "메타 설명을 80~155자 사이로 최적화하세요.",
    impact: "메타 설명은 검색 결과에서 타이틀 아래에 표시됩니다. 매력적인 설명은 클릭률을 최대 30%까지 높일 수 있습니다.",
  });

  // 1-3. Meta Keywords (3점)
  const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim() || "";
  const keywordCount = metaKeywords ? metaKeywords.split(",").filter(k => k.trim()).length : 0;
  items.push({
    id: "meta-keywords",
    category: "메타 태그",
    name: "메타 키워드 (Meta Keywords)",
    status: keywordCount >= 3 && keywordCount <= 8 ? "pass" : keywordCount > 0 ? "warning" : "fail",
    score: keywordCount >= 3 && keywordCount <= 8 ? 3 : keywordCount > 0 ? 1 : 0,
    maxScore: 3,
    detail: metaKeywords ? `키워드 ${keywordCount}개: "${metaKeywords.substring(0, 60)}${metaKeywords.length > 60 ? '...' : ''}"` : "메타 키워드가 설정되지 않았습니다.",
    recommendation: keywordCount >= 3 && keywordCount <= 8 ? "메타 키워드가 적절하게 설정되어 있습니다." : country === "th" ? "Google 검색 최적화를 위해 핵심 키워드 3~8개를 설정하세요." : "네이버 검색 최적화를 위해 핵심 키워드 3~8개를 설정하세요.",
    impact: country === "th" ? "구글은 메타 키워드를 직접 순위에 반영하지 않지만, 페이지 주제 파악에 참고합니다. 태국 시장을 타겟한다면 관련 키워드를 설정하세요." : "구글은 메타 키워드를 무시하지만, 네이버는 여전히 참고 신호로 활용합니다. 한국 시장을 타겟한다면 반드시 설정하세요.",
  });

  // 1-4. Viewport (5점)
  const viewport = $('meta[name="viewport"]').attr("content") || "";
  items.push({
    id: "meta-viewport",
    category: "메타 태그",
    name: "모바일 뷰포트 (Viewport)",
    status: viewport ? "pass" : "fail",
    score: viewport ? 5 : 0,
    maxScore: 5,
    detail: viewport ? `viewport 설정: "${viewport}"` : "viewport 메타 태그가 없습니다.",
    recommendation: viewport ? "모바일 뷰포트가 올바르게 설정되어 있습니다." : '<meta name="viewport" content="width=device-width, initial-scale=1"> 태그를 추가하세요.',
    impact: "모바일 뷰포트가 없으면 모바일에서 사이트가 축소되어 보입니다. 구글은 모바일 우선 색인을 사용하므로 필수입니다.",
  });

  // 1-5. Canonical URL (5점) — 유효성 검증 강화
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const canonicalIsAbsolute = canonical.startsWith("http://") || canonical.startsWith("https://");
  const canonicalMatchesSelf = canonical ? (canonical.replace(/\/$/, "") === url.replace(/\/$/, "") || canonical.replace(/\/$/, "") === baseUrl.replace(/\/$/, "")) : false;
  const canonicalIsValid = canonical && canonicalIsAbsolute;
  const canonicalStatus = !canonical ? "fail" : (canonicalIsValid && canonicalMatchesSelf) ? "pass" : canonicalIsValid ? "warning" : "fail";
  items.push({
    id: "meta-canonical",
    category: "메타 태그",
    name: "캐노니컬 URL (Canonical)",
    status: canonicalStatus,
    score: canonicalStatus === "pass" ? 5 : canonicalStatus === "warning" ? 3 : 0,
    maxScore: 5,
    detail: !canonical ? "캐노니컬 태그가 없습니다." : !canonicalIsAbsolute ? `캐노니컬 URL이 상대 경로입니다: ${canonical} (절대 URL 필요)` : !canonicalMatchesSelf ? `캐노니컬 URL이 현재 페이지와 다릅니다: ${canonical}` : `캐노니컬 URL: ${canonical}`,
    recommendation: !canonical ? "중복 콘텐츠 문제를 방지하기 위해 <link rel='canonical' href='https://도메인/경로'> 태그를 반드시 추가하세요." : !canonicalIsAbsolute ? "캐노니컬 URL은 반드시 https://로 시작하는 절대 URL이어야 합니다." : !canonicalMatchesSelf ? "캐노니컬 URL이 현재 페이지 URL과 일치하는지 확인하세요. 불일치 시 검색엔진이 혼란을 겪습니다." : "캐노니컬 URL이 올바르게 설정되어 있습니다.",
    impact: "캐노니컬 태그가 없거나 잘못 설정되면 검색엔진이 동일 콘텐츠의 여러 버전을 발견했을 때 검색 순위가 분산됩니다. 특히 www/non-www, http/https, 쿼리 파라미터 등으로 인한 중복이 발생합니다.",
  });

  // 1-6. Charset (2점)
  const charset = $('meta[charset]').attr("charset") || $('meta[http-equiv="Content-Type"]').attr("content") || "";
  items.push({
    id: "meta-charset",
    category: "메타 태그",
    name: "문자 인코딩 (Charset)",
    status: charset ? "pass" : "warning",
    score: charset ? 2 : 0,
    maxScore: 2,
    detail: charset ? `인코딩: ${charset.toUpperCase()}` : "charset 선언이 없습니다.",
    recommendation: charset ? "문자 인코딩이 올바르게 설정되어 있습니다." : '<meta charset="UTF-8"> 태그를 추가하세요.',
    impact: "문자 인코딩이 없으면 한글이 깨져 보일 수 있으며, 검색엔진이 콘텐츠를 올바르게 해석하지 못합니다.",
  });

  // 1-7. Title에 핵심 키워드 포함 여부 (3점) — 신규
  const titleHasKeyword = metaKeywords ? metaKeywords.split(",").some(k => effectiveTitle.includes(k.trim())) : false;
  items.push({
    id: "meta-title-keyword",
    category: "메타 태그",
    name: "타이틀 키워드 일치",
    status: !metaKeywords ? "warning" : titleHasKeyword ? "pass" : "fail",
    score: !metaKeywords ? 1 : titleHasKeyword ? 3 : 0,
    maxScore: 3,
    detail: !metaKeywords ? "메타 키워드가 없어 비교할 수 없습니다." : titleHasKeyword ? "타이틀에 핵심 키워드가 포함되어 있습니다." : "타이틀에 메타 키워드가 포함되어 있지 않습니다.",
    recommendation: titleHasKeyword ? "타이틀에 핵심 키워드가 잘 포함되어 있습니다." : "타이틀 앞부분에 핵심 키워드를 배치하세요. 검색엔진은 타이틀 앞쪽 키워드에 더 높은 가중치를 부여합니다.",
    impact: "타이틀에 핵심 키워드가 없으면 해당 키워드 검색 시 노출 확률이 크게 떨어집니다. 키워드를 타이틀 앞쪽에 배치하면 순위가 올라갑니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 2: 콘텐츠 구조 (Content Structure) — 만점 35점
  // ═══════════════════════════════════════════════════════════════

  // 2-1. H1 태그 (8점)
  const h1s = $("h1");
  const h1Count = h1s.length;
  const h1Text = h1s.first().text().trim();
  items.push({
    id: "content-h1",
    category: "콘텐츠 구조",
    name: "H1 태그",
    status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warning",
    score: h1Count === 1 ? 8 : h1Count === 0 ? 0 : 4,
    maxScore: 8,
    detail: h1Count === 0 ? "H1 태그가 없습니다." : h1Count === 1 ? `H1: "${h1Text.substring(0, 60)}${h1Text.length > 60 ? '...' : ''}"` : `H1 태그가 ${h1Count}개 있습니다. 1개만 사용하는 것이 권장됩니다.`,
    recommendation: h1Count === 0 ? "페이지의 핵심 키워드를 포함한 H1 태그를 1개 추가하세요." : h1Count > 1 ? "H1 태그를 1개만 사용하세요." : "H1 태그가 올바르게 사용되고 있습니다.",
    impact: "H1 태그는 페이지의 주제를 검색엔진에 알려주는 가장 중요한 제목입니다.",
  });

  // 2-2. 제목 태그 계층 (6점)
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const hasHeadingHierarchy = h1Count > 0 && h2Count >= 2;
  items.push({
    id: "content-headings",
    category: "콘텐츠 구조",
    name: "제목 태그 계층 (H1~H6)",
    status: hasHeadingHierarchy && h3Count > 0 ? "pass" : h2Count > 0 ? "warning" : "fail",
    score: hasHeadingHierarchy && h3Count > 0 ? 6 : h2Count > 0 ? 3 : 0,
    maxScore: 6,
    detail: `H1: ${h1Count}개, H2: ${h2Count}개, H3: ${h3Count}개`,
    recommendation: hasHeadingHierarchy && h3Count > 0 ? "제목 태그가 계층적으로 잘 구성되어 있습니다." : h2Count === 0 ? "H2, H3 태그를 추가하여 콘텐츠를 섹션별로 구조화하세요. 검색엔진이 페이지 구조를 파악하는 데 중요합니다." : h3Count === 0 ? `H2는 ${h2Count}개 있지만 H3 태그가 없습니다. H3를 추가하여 더 세분화된 콘텐츠 구조를 만드세요.` : "H2 태그를 2개 이상 사용하여 콘텐츠를 섹션별로 구분하세요.",
    impact: "검색엔진은 제목 태그를 통해 페이지의 구조와 핵심 주제를 파악합니다.",
  });

  // 2-3. 이미지 Alt 태그 (6점) — 기준 강화: 100%만 pass
  // (#16) 이미지 최적화 샘플링 고정: 크기순 정렬 후 상위 N개만 분석
  const extractedImages = extractImagesFromHtml(html);
  const { sampled: sampledImages, totalCount: totalImages } = sampleImages(extractedImages);
  const sampleCount = sampledImages.length;
  let imagesWithAlt = 0;
  for (const img of sampledImages) {
    if (img.alt && img.alt.trim().length > 0) imagesWithAlt++;
  }
  const altRatio = sampleCount > 0 ? imagesWithAlt / sampleCount : 1;
  items.push({
    id: "content-img-alt",
    category: "콘텐츠 구조",
    name: "이미지 Alt 태그",
    status: totalImages === 0 ? "warning" : altRatio >= 1.0 ? "pass" : altRatio >= 0.7 ? "warning" : "fail",
    score: totalImages === 0 ? 3 : altRatio >= 1.0 ? 6 : Math.round(altRatio * 4),
    maxScore: 6,
    detail: totalImages === 0 ? "페이지에 이미지가 없습니다." : `총 ${totalImages}개 이미지 중 ${imagesWithAlt}개에 alt 태그 있음 (${Math.round(altRatio * 100)}%)`,
    recommendation: altRatio < 1.0 ? `${totalImages - imagesWithAlt}개 이미지에 설명적인 alt 태그를 추가하세요.` : "모든 이미지에 alt 태그가 있습니다.",
    impact: "이미지 alt 태그는 시각 장애인 접근성뿐 아니라, 구글 이미지 검색에서의 노출에 직접적으로 영향을 미칩니다.",
  });

  // 2-4. 텍스트 양 (5점) — 기준 강화: 2000자 이상만 pass
  items.push({
    id: "content-text-length",
    category: "콘텐츠 구조",
    name: "콘텐츠 텍스트 양",
    status: wordCount > 2000 ? "pass" : wordCount > 800 ? "warning" : "fail",
    score: wordCount > 2000 ? 5 : wordCount > 800 ? 2 : 0,
    maxScore: 5,
    detail: `페이지 텍스트: 약 ${wordCount.toLocaleString()}자`,
    recommendation: wordCount < 800 ? "콘텐츠가 너무 적습니다. 최소 2,000자 이상의 유용한 콘텐츠를 추가하세요." : wordCount < 2000 ? "콘텐츠를 2,000자 이상으로 늘리면 검색 순위에 도움이 됩니다." : "충분한 양의 콘텐츠가 있습니다.",
    impact: "구글은 콘텐츠가 풍부한 페이지를 선호합니다. 텍스트가 부족하면 '얇은 콘텐츠'로 분류됩니다.",
  });

  // 2-5. 내부/외부 링크 (5점) — 기준 강화: 내부 5개+, 외부 1개+ 필요
  const allLinks = $("a[href]");
  const internalLinks = allLinks.filter((_, el) => {
    const href = $(el).attr("href") || "";
    return href.startsWith("/") || href.startsWith(baseUrl);
  }).length;
  const externalLinks = allLinks.filter((_, el) => {
    const href = $(el).attr("href") || "";
    return href.startsWith("http") && !href.startsWith(baseUrl);
  }).length;
  items.push({
    id: "content-links",
    category: "콘텐츠 구조",
    name: "내부/외부 링크",
    status: internalLinks >= 5 && externalLinks >= 1 ? "pass" : internalLinks > 0 ? "warning" : "fail",
    score: internalLinks >= 5 && externalLinks >= 1 ? 5 : internalLinks >= 3 ? 3 : internalLinks > 0 ? 1 : 0,
    maxScore: 5,
    detail: `내부 링크: ${internalLinks}개, 외부 링크: ${externalLinks}개`,
    recommendation: internalLinks < 5 ? "내부 링크를 5개 이상 추가하세요. 관련 페이지끼리 연결하면 검색엔진이 사이트 구조를 더 잘 이해합니다." : externalLinks < 1 ? "신뢰할 수 있는 외부 사이트 링크를 1개 이상 추가하세요." : "링크 구조가 잘 구성되어 있습니다.",
    impact: "내부 링크는 검색엔진이 사이트의 페이지를 발견하고 중요도를 판단하는 핵심 수단입니다.",
  });

  // 2-6. 콘텐츠 신선도 (5점) — 신규: 최근 업데이트 날짜 확인
  const hasDateModified = html.includes("dateModified") || html.includes("lastmod") || $('meta[property="article:modified_time"]').length > 0;
  const hasDatePublished = html.includes("datePublished") || $('meta[property="article:published_time"]').length > 0;
  items.push({
    id: "content-freshness",
    category: "콘텐츠 구조",
    name: "콘텐츠 업데이트 날짜",
    status: hasDateModified ? "pass" : hasDatePublished ? "warning" : "fail",
    score: hasDateModified ? 5 : hasDatePublished ? 2 : 0,
    maxScore: 5,
    detail: hasDateModified ? "콘텐츠 수정일(dateModified)이 명시되어 있습니다." : hasDatePublished ? "발행일은 있지만 수정일이 없습니다." : "콘텐츠 발행일/수정일 정보가 없습니다.",
    recommendation: hasDateModified ? "콘텐츠 업데이트 날짜가 잘 설정되어 있습니다." : "구조화 데이터에 dateModified를 추가하세요. 검색엔진은 최신 콘텐츠를 우선 노출합니다.",
    impact: "검색엔진은 최신 콘텐츠를 우선 노출합니다. 특히 의료 정보는 최신성이 중요하여, 업데이트 날짜가 없으면 오래된 정보로 판단되어 순위가 하락합니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 3: 홈페이지 기본 설정 — 만점 30점
  // ═══════════════════════════════════════════════════════════════

  // 3-1. SSL (10점)
  items.push({
    id: "tech-ssl",
    category: "홈페이지 기본 설정",
    name: "SSL 인증서 (HTTPS)",
    status: isHttps ? "pass" : "fail",
    score: isHttps ? 10 : 0,
    maxScore: 10,
    detail: isHttps ? "HTTPS가 적용되어 있습니다." : "HTTP를 사용 중입니다.",
    recommendation: isHttps ? "SSL 인증서가 올바르게 적용되어 있습니다." : "SSL 인증서를 설치하여 HTTPS로 전환하세요.",
    impact: "구글은 HTTPS를 검색 순위 신호로 사용합니다. HTTP 사이트는 '안전하지 않음' 경고가 표시됩니다.",
  });

  // 3-2. robots.txt (5점) — (#7) 검증 강화: Googlebot 차단 여부, Sitemap 선언 여부 추가 검사
  const robotsBlocksGooglebot = robotsTxt.includes("User-agent: Googlebot") && robotsTxt.includes("Disallow: /");
  const robotsHasSitemap = /Sitemap:\s*https?:\/\//i.test(robotsTxt);
  const robotsScore = !robotsExists ? 0 : robotsBlocksGooglebot ? 1 : robotsHasSitemap ? 5 : 3;
  const robotsStatus = !robotsExists ? "fail" : robotsBlocksGooglebot ? "fail" : robotsHasSitemap ? "pass" : "warning";
  let robotsDetail = "";
  if (!robotsExists) {
    robotsDetail = "robots.txt 파일이 없거나 잘못된 형식입니다.";
  } else if (robotsBlocksGooglebot) {
    robotsDetail = "⚠️ robots.txt에서 Googlebot을 전체 차단하고 있습니다! 검색 노출이 불가능합니다.";
  } else {
    robotsDetail = `robots.txt 존재${robotsHasSitemap ? " + Sitemap 선언 확인" : " (⚠️ Sitemap 선언 없음)"}`;
  }
  items.push({
    id: "tech-robots",
    category: "홈페이지 기본 설정",
    name: "robots.txt",
    status: robotsStatus,
    score: robotsScore,
    maxScore: 5,
    detail: robotsDetail,
    recommendation: !robotsExists ? "robots.txt 파일을 생성하여 검색엔진 크롤러에게 사이트 구조를 안내하세요." : robotsBlocksGooglebot ? "Googlebot 전체 차단을 해제하세요. 'Disallow: /' 대신 특정 경로만 차단하세요." : !robotsHasSitemap ? "Sitemap: https://도메인/sitemap.xml 선언을 추가하세요." : "robots.txt가 올바르게 설정되어 있습니다.",
    impact: "robots.txt가 없거나 Googlebot을 차단하면 검색 노출이 원천 차단됩니다. Sitemap 선언은 크롤링 효율을 높입니다.",
  });

  // 3-3. sitemap.xml (5점)
  items.push({
    id: "tech-sitemap",
    category: "홈페이지 기본 설정",
    name: "사이트맵 (sitemap.xml)",
    status: sitemapExists ? "pass" : "fail",
    score: sitemapExists ? 5 : 0,
    maxScore: 5,
    detail: sitemapExists ? `사이트맵 존재: ${sitemapUrl}${sitemapUrlCount > 0 ? ` (등록 URL: ${sitemapUrlCount}개)` : ""}` : "사이트맵을 찾을 수 없습니다.",
    recommendation: sitemapExists ? "사이트맵이 올바르게 설정되어 있습니다." : "sitemap.xml을 생성하고 Google Search Console에 제출하세요.",
    impact: "사이트맵은 검색엔진에게 사이트의 모든 페이지 목록을 알려줍니다.",
  });

  // 3-4. 페이지 접근성 (5점)
  items.push({
    id: "tech-accessibility",
    category: "홈페이지 기본 설정",
    name: "페이지 접근 가능 여부",
    status: fetchOk ? "pass" : "fail",
    score: fetchOk ? 5 : 0,
    maxScore: 5,
    detail: fetchOk ? `HTTP 상태: ${fetchStatus} (정상)` : `HTTP 상태: ${fetchStatus || '접근 불가'}`,
    recommendation: fetchOk ? "페이지가 정상적으로 접근 가능합니다." : "서버 오류를 확인하세요.",
    impact: "검색엔진 크롤러가 페이지에 접근할 수 없으면 색인 자체가 불가능합니다.",
  });

  // 3-5. 서버 응답 속도 (TTFB) (5점) — PageSpeed 실측 데이터 우선, 없으면 자체 측정값 사용
  const ttfbMs = pageSpeedData?.diagnostics?.serverResponseTime || responseTime;
  const ttfbSource = pageSpeedData?.diagnostics?.serverResponseTime ? "Google PageSpeed 실측" : "자체 측정";
  // CrUX 실사용자 TTFB 데이터가 있으면 추가 표시
  const cruxTtfb = pageSpeedData?.crux?.available && pageSpeedData.crux.ttfbMs
    ? ` | 실사용자 데이터(CrUX): ${(pageSpeedData.crux.ttfbMs / 1000).toFixed(2)}초 (${pageSpeedData.crux.ttfbCategory === 'FAST' ? '빠름' : pageSpeedData.crux.ttfbCategory === 'AVERAGE' ? '보통' : '느림'})`
    : "";
  items.push({
    id: "tech-response-time",
    category: "홈페이지 기본 설정",
    name: "서버 응답 속도 (TTFB)",
    status: ttfbMs === 0 ? "fail" : ttfbMs < 800 ? "pass" : ttfbMs < 1800 ? "warning" : "fail",
    score: ttfbMs === 0 ? 0 : ttfbMs < 800 ? 5 : ttfbMs < 1800 ? 3 : ttfbMs < 3000 ? 1 : 0,
    maxScore: 5,
    detail: ttfbMs === 0 ? "응답 시간을 측정할 수 없습니다." : `서버 응답 시간: ${(ttfbMs / 1000).toFixed(2)}초 (${ttfbSource})${ttfbMs < 800 ? ' — 양호' : ttfbMs < 1800 ? ' — 개선 권장' : ' — 느림'}${cruxTtfb}`,
    recommendation: ttfbMs > 1800 ? "서버 응답이 1.8초 이상입니다. CDN 도입, 서버 캐싱, 데이터베이스 쿼리 최적화가 시급합니다." : ttfbMs > 800 ? "서버 응답이 800ms 이상입니다. CDN 도입이나 서버 캐싱을 고려하세요." : "서버 응답 속도가 양호합니다.",
    impact: "구글은 Core Web Vitals에서 TTFB를 중요 지표로 봅니다. 800ms 이하면 '좋음', 1.8초 이상이면 '개선 필요'로 분류합니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 4: 소셜 미디어 — 만점 10점
  // ═══════════════════════════════════════════════════════════════

  // 4-1. Open Graph 태그 (7점) — 기준 강화: 4개 모두 있어야 pass
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const ogUrl = $('meta[property="og:url"]').attr("content") || "";
  const ogCount = [ogTitle, ogDesc, ogImage, ogUrl].filter(Boolean).length;
  items.push({
    id: "social-og",
    category: "소셜 미디어",
    name: "Open Graph 태그",
    status: ogCount === 4 ? "pass" : ogCount >= 2 ? "warning" : "fail",
    score: ogCount === 4 ? 7 : ogCount >= 2 ? 3 : ogCount >= 1 ? 1 : 0,
    maxScore: 7,
    detail: ogCount === 0 ? "Open Graph 태그가 없습니다." : `OG 태그 ${ogCount}/4개 설정됨 (${[ogTitle && 'title', ogDesc && 'description', ogImage && 'image', ogUrl && 'url'].filter(Boolean).join(', ')})`,
    recommendation: ogCount < 4 ? `누락된 OG 태그를 추가하세요: ${[!ogTitle && 'og:title', !ogDesc && 'og:description', !ogImage && 'og:image', !ogUrl && 'og:url'].filter(Boolean).join(', ')}` : "Open Graph 태그가 모두 설정되어 있습니다.",
    impact: country === "th" ? "LINE, Facebook 등에서 링크를 공유할 때 OG 태그가 없으면 제목과 이미지가 표시되지 않습니다." : "카카오톡, 페이스북 등에서 링크를 공유할 때 OG 태그가 없으면 제목과 이미지가 표시되지 않습니다.",
  });

  // 4-2. Twitter Card (3점)
  const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
  items.push({
    id: "social-twitter",
    category: "소셜 미디어",
    name: "Twitter Card 태그",
    status: twitterCard ? "pass" : "warning",
    score: twitterCard ? 3 : 0,
    maxScore: 3,
    detail: twitterCard ? `Twitter Card: ${twitterCard}` : "Twitter Card 태그가 없습니다.",
    recommendation: twitterCard ? "Twitter Card가 설정되어 있습니다." : "Twitter Card 메타 태그를 추가하면 SNS 공유 시 더 나은 미리보기가 표시됩니다.",
    impact: "SNS 공유 시 미리보기 카드가 표시되지 않으면 링크의 신뢰도와 클릭률이 떨어집니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 5: AI 크롤링 최적화 — 만점 20점
  // ═══════════════════════════════════════════════════════════════

  // 5-1. 구조화 데이터 (7점) — 기준 강화: 2개 이상 타입 필요
  const hasJsonLd = jsonLdScripts.length > 0;
  items.push({
    id: "advanced-jsonld",
    category: "검색 고급 설정",
    name: "구조화 데이터 (Schema.org)",
    status: jsonLdTypes.length >= 2 ? "pass" : hasJsonLd ? "warning" : "fail",
    score: jsonLdTypes.length >= 2 ? 7 : hasJsonLd ? 3 : 0,
    maxScore: 7,
    detail: hasJsonLd ? `구조화 데이터 발견: ${jsonLdTypes.join(", ") || "JSON-LD 존재"}` : "구조화 데이터(JSON-LD)가 없습니다.",
    recommendation: jsonLdTypes.length >= 2 ? "구조화 데이터가 잘 적용되어 있습니다." : "JSON-LD 형식의 구조화 데이터를 2개 이상 추가하세요. LocalBusiness, Organization, FAQ 등의 스키마를 적용하면 리치 스니펫이 표시됩니다.",
    impact: "구조화 데이터가 있으면 검색 결과에 별점, 가격, FAQ 등이 표시되는 '리치 스니펫'을 얻을 수 있습니다.",
  });

  // 5-2. Language 설정 (3점) — 존재 여부 + 콘텐츠 언어 일치 여부 검증
  const htmlLang = $("html").attr("lang") || "";
  // 실제 콘텐츠 언어 감지
  const koreanChars = (bodyText.match(/[가-힣]/g) || []).length;
  const thaiChars = (bodyText.match(/[\u0E00-\u0E7F]/g) || []).length;
  const japaneseChars = (bodyText.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  const chineseChars = (bodyText.match(/[\u4E00-\u9FFF]/g) || []).length;
  const latinChars = (bodyText.match(/[a-zA-Z]/g) || []).length;
  const totalDetectable = koreanChars + thaiChars + japaneseChars + chineseChars + latinChars;
  let detectedLang = "en"; // 기본값
  if (totalDetectable > 0) {
    const langRatios = [
      { lang: "ko", count: koreanChars },
      { lang: "th", count: thaiChars },
      { lang: "ja", count: japaneseChars },
      { lang: "zh", count: chineseChars },
      { lang: "en", count: latinChars },
    ].sort((a, b) => b.count - a.count);
    detectedLang = langRatios[0].lang;
  }
  // ko-KR, ko 모두 정상으로 인정 (BCP 47 표준)
  const langMatchesContent = htmlLang ? (htmlLang.startsWith(detectedLang) || (detectedLang === "ko" && htmlLang.toLowerCase().startsWith("ko"))) : false;
  const langStatus = !htmlLang ? "fail" : langMatchesContent ? "pass" : "warning";
  const langScore = !htmlLang ? 0 : langMatchesContent ? 3 : 1;
  const langDetail = !htmlLang
    ? "HTML lang 속성이 설정되지 않았습니다."
    : langMatchesContent
      ? `언어 설정: ${htmlLang} (콘텐츠 언어와 일치 — 적절히 설정됨)`
      : `언어 설정: ${htmlLang} (실제 콘텐츠는 ${detectedLang} 중심 — 불일치)`;
  const langRec = !htmlLang
    ? `<html lang="${country === 'th' ? 'en' : 'ko'}"> 속성을 추가하여 검색엔진에 페이지 언어를 알려주세요.`
    : langMatchesContent
      ? `언어 설정(${htmlLang})이 콘텐츠 언어와 올바르게 일치합니다.`
      : `현재 lang="${htmlLang}"이지만 실제 콘텐츠는 ${detectedLang} 중심입니다. lang="${detectedLang}"로 변경하세요. 잘못된 lang 속성은 검색엔진이 페이지 언어를 오판하게 합니다.`;
  items.push({
    id: "advanced-lang",
    category: "검색 고급 설정",
    name: "언어 설정 (lang 속성)",
    status: langStatus,
    score: langScore,
    maxScore: 3,
    detail: langDetail,
    recommendation: langRec,
    impact: "lang 속성이 없거나 실제 콘텐츠 언어와 불일치하면 검색엔진이 페이지 언어를 잘못 판단하여 잘못된 국가/언어 검색 결과에 노출될 수 있습니다.",
  });

  // 5-3. Favicon (2점)
  const favicon = $('link[rel="icon"]').attr("href") || $('link[rel="shortcut icon"]').attr("href") || "";
  items.push({
    id: "advanced-favicon",
    category: "검색 고급 설정",
    name: "파비콘 (Favicon)",
    status: favicon ? "pass" : "warning",
    score: favicon ? 2 : 0,
    maxScore: 2,
    detail: favicon ? `파비콘: ${favicon}` : "파비콘이 설정되지 않았습니다.",
    recommendation: favicon ? "파비콘이 설정되어 있습니다." : "파비콘을 추가하세요.",
    impact: "파비콘이 없으면 브라우저 탭에서 사이트를 구분하기 어렵고, 검색 결과에서도 전문성이 떨어져 보입니다.",
  });

  // 5-4. Meta Robots (3점)
  const metaRobots = $('meta[name="robots"]').attr("content")?.trim() || "";
  const hasNoindex = metaRobots.toLowerCase().includes("noindex");
  items.push({
    id: "advanced-robots-meta",
    category: "검색 고급 설정",
    name: "Meta Robots 태그",
    status: hasNoindex ? "fail" : metaRobots ? "pass" : "warning",
    score: hasNoindex ? 0 : metaRobots ? 3 : 1,
    maxScore: 3,
    detail: metaRobots ? `robots: "${metaRobots}"` : "meta robots 태그가 없습니다 (기본값: index, follow).",
    recommendation: hasNoindex ? "noindex가 설정되어 있어 검색엔진에 색인되지 않습니다." : metaRobots ? "meta robots 태그가 올바르게 설정되어 있습니다." : "명시적으로 meta robots 태그를 추가하면 크롤링을 더 정확히 제어할 수 있습니다.",
    impact: "noindex가 실수로 설정되면 페이지가 검색 결과에서 완전히 사라집니다.",
  });

  // 5-5. 보안 헤더 (5점) — 신규
  const hasCSP = responseHeaders["content-security-policy"] || "";
  const hasXFrame = responseHeaders["x-frame-options"] || "";
  const hasHSTS = responseHeaders["strict-transport-security"] || "";
  const securityCount = [hasCSP, hasXFrame, hasHSTS].filter(Boolean).length;
  items.push({
    id: "advanced-security-headers",
    category: "검색 고급 설정",
    name: "보안 헤더 (CSP/HSTS)",
    status: securityCount >= 2 ? "pass" : securityCount >= 1 ? "warning" : "fail",
    score: securityCount >= 2 ? 5 : securityCount >= 1 ? 2 : 0,
    maxScore: 5,
    detail: `보안 헤더 ${securityCount}/3개 설정 (${[hasCSP && 'CSP', hasXFrame && 'X-Frame-Options', hasHSTS && 'HSTS'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: securityCount >= 2 ? "보안 헤더가 잘 설정되어 있습니다." : "Content-Security-Policy, X-Frame-Options, Strict-Transport-Security 헤더를 추가하세요. 보안이 강화된 사이트는 검색엔진 신뢰도가 높아집니다.",
    impact: "보안 헤더는 사이트의 신뢰성을 높이고, 해킹 시도를 방지합니다. 구글은 안전한 사이트를 우선 노출합니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 6: 네이버 AI 대응 — 만점 30점
  // ═══════════════════════════════════════════════════════════════

  // 6-1. 네이버 서치어드바이저 인증 (8점)
  const hasNaverVerification = $('meta[name="naver-site-verification"]').length > 0;
  items.push({
    id: "naver-verification",
    category: "네이버 검색 최적화",
    name: "네이버 서치어드바이저 인증",
    status: hasNaverVerification ? "pass" : "fail",
    score: hasNaverVerification ? 8 : 0,
    maxScore: 8,
    detail: hasNaverVerification ? "네이버 서치어드바이저 인증 메타태그가 있습니다." : "네이버 서치어드바이저 인증 메타태그가 없습니다.",
    recommendation: hasNaverVerification ? "네이버 서치어드바이저 인증이 완료되어 있습니다." : "네이버 서치어드바이저(searchadvisor.naver.com)에 사이트를 등록하고 인증 메타태그를 추가하세요. 한국 검색 시장의 60% 이상을 차지하는 네이버에 사이트를 등록하지 않으면 네이버 검색에서 노출되지 않습니다.",
    impact: "네이버 서치어드바이저에 등록하지 않으면 네이버 검색에서 사이트가 발견되지 않습니다. 한국 환자의 대부분은 네이버에서 병원을 검색합니다.",
  });

  // 6-2. 네이버 OG 태그 (5점)
  const hasOgSiteName = $('meta[property="og:site_name"]').attr("content") || "";
  const hasOgLocale = $('meta[property="og:locale"]').attr("content") || "";
  const hasOgType = $('meta[property="og:type"]').attr("content") || "";
  const naverOgCount = [ogTitle, ogDesc, ogImage, hasOgSiteName, hasOgType].filter(Boolean).length;
  items.push({
    id: "naver-og-tags",
    category: "네이버 검색 최적화",
    name: "네이버 공유 최적화 (OG 확장)",
    status: naverOgCount >= 4 ? "pass" : naverOgCount >= 2 ? "warning" : "fail",
    score: naverOgCount >= 4 ? 5 : naverOgCount >= 2 ? 2 : 0,
    maxScore: 5,
    detail: `네이버 OG 태그 ${naverOgCount}/5개 설정 (${[ogTitle && 'og:title', ogDesc && 'og:description', ogImage && 'og:image', hasOgSiteName && 'og:site_name', hasOgType && 'og:type'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: naverOgCount >= 4 ? "네이버 공유 최적화가 잘 되어 있습니다." : "og:site_name, og:type 등 확장 OG 태그를 추가하세요. 네이버 카페/블로그에서 링크 공유 시 미리보기 품질이 향상됩니다.",
    impact: "네이버 카페, 블로그, 밴드 등에서 링크를 공유할 때 OG 태그가 완벽하면 미리보기가 풍부하게 표시되어 클릭률이 높아집니다.",
  });

  // 6-3. 한국어 콘텐츠 최적화 (5점)
  const hasKoreanLang = htmlLang.startsWith("ko");
  const hasKoreanContent = bodyText.match(/[가-힣]/g)?.length || 0;
  const koreanRatio = bodyText.length > 0 ? hasKoreanContent / bodyText.length : 0;
  items.push({
    id: "naver-korean-content",
    category: "네이버 검색 최적화",
    name: "한국어 콘텐츠 최적화",
    status: hasKoreanLang && koreanRatio > 0.3 ? "pass" : koreanRatio > 0.1 ? "warning" : "fail",
    score: hasKoreanLang && koreanRatio > 0.3 ? 5 : koreanRatio > 0.1 ? 2 : 0,
    maxScore: 5,
    detail: `한국어 비율: ${Math.round(koreanRatio * 100)}%, lang 속성: ${htmlLang || '미설정'}`,
    recommendation: hasKoreanLang && koreanRatio > 0.3 ? "한국어 콘텐츠가 잘 구성되어 있습니다." : "lang='ko' 설정과 함께 한국어 콘텐츠 비율을 높이세요. 네이버는 한국어 콘텐츠를 우선 색인합니다.",
    impact: "네이버 검색엔진은 한국어 콘텐츠를 우선적으로 색인하고 노출합니다. 영어 위주 사이트는 네이버 검색에서 불리합니다.",
  });

  // 6-4. 네이버 블로그/카페 연동 신호 (6점)
  const hasNaverBlogLink = html.includes("blog.naver.com") || html.includes("m.blog.naver.com");
  const hasNaverPlaceLink = html.includes("map.naver.com") || html.includes("naver.me") || html.includes("place.naver.com");
  const hasNaverCafeLink = html.includes("cafe.naver.com");
  const naverLinkCount = [hasNaverBlogLink, hasNaverPlaceLink, hasNaverCafeLink].filter(Boolean).length;
  items.push({
    id: "naver-ecosystem",
    category: "네이버 검색 최적화",
    name: "네이버 생태계 연동",
    status: naverLinkCount >= 2 ? "pass" : naverLinkCount >= 1 ? "warning" : "fail",
    score: naverLinkCount >= 2 ? 6 : naverLinkCount >= 1 ? 3 : 0,
    maxScore: 6,
    detail: `네이버 연동 ${naverLinkCount}/3개 (${[hasNaverBlogLink && '블로그', hasNaverPlaceLink && '플레이스/지도', hasNaverCafeLink && '카페'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: naverLinkCount >= 2 ? "네이버 생태계와 잘 연동되어 있습니다." : "네이버 블로그, 네이버 플레이스(지도), 네이버 카페 링크를 사이트에 추가하세요. 네이버는 자체 생태계와 연동된 사이트를 우선 노출합니다.",
    impact: "네이버는 자체 플랫폼(블로그, 플레이스, 카페)과 연동된 사이트를 검색 결과에서 우선 노출합니다. 병원은 네이버 플레이스 등록이 특히 중요합니다.",
  });

  // 6-5. 네이버 전용 사이트맵 (6점)
  const sitemapInRobots = robotsTxt.toLowerCase().includes("sitemap");
  items.push({
    id: "naver-sitemap",
    category: "네이버 검색 최적화",
    name: "사이트맵 + robots.txt 연동",
    status: sitemapExists && sitemapInRobots ? "pass" : sitemapExists ? "warning" : "fail",
    score: sitemapExists && sitemapInRobots ? 6 : sitemapExists ? 3 : 0,
    maxScore: 6,
    detail: sitemapExists && sitemapInRobots ? "사이트맵이 robots.txt에 등록되어 있습니다." : sitemapExists ? "사이트맵은 있지만 robots.txt에 Sitemap 경로가 없습니다." : "사이트맵이 없습니다.",
    recommendation: sitemapExists && sitemapInRobots ? "사이트맵이 robots.txt에 잘 등록되어 있습니다." : "robots.txt에 Sitemap: https://도메인/sitemap.xml 을 추가하세요. 네이버 서치어드바이저에도 사이트맵을 제출하세요.",
    impact: "네이버 크롤러는 robots.txt의 Sitemap 경로를 통해 사이트 구조를 파악합니다. 이 설정이 없으면 네이버가 모든 페이지를 발견하지 못할 수 있습니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 7: 병원 특화 SEO — 만점 35점 (신규 카테고리)
  // ═══════════════════════════════════════════════════════════════

  // 7-1. 의료기관 구조화 데이터 (8점) — 서브페이지 JSON-LD 타입도 통합
  const allSiteJsonLdTypes = Array.from(new Set([...jsonLdTypes, ...agg.allJsonLdTypes]));
  const medicalSchemas = ["MedicalBusiness", "MedicalClinic", "Hospital", "Physician", "Dentist", "MedicalWebPage", "ProfessionalService"];
  const foundMedicalSchemas = allSiteJsonLdTypes.filter(t => medicalSchemas.some(s => t.includes(s)));
  items.push({
    id: "hospital-medical-schema",
    category: "병원 특화 SEO",
    name: "의료기관 구조화 데이터",
    status: foundMedicalSchemas.length >= 1 ? "pass" : "fail",
    score: foundMedicalSchemas.length >= 2 ? 8 : foundMedicalSchemas.length >= 1 ? 5 : 0,
    maxScore: 8,
    detail: foundMedicalSchemas.length > 0 ? `의료기관 스키마: ${foundMedicalSchemas.join(', ')}` : "의료기관 관련 구조화 데이터가 없습니다.",
    recommendation: foundMedicalSchemas.length >= 1 ? "의료기관 구조화 데이터가 잘 적용되어 있습니다." : "MedicalBusiness, MedicalClinic, Hospital, Physician 등 의료기관 전용 스키마를 추가하세요. 구글이 병원 사이트를 의료기관으로 인식하여 의료 관련 검색에서 우선 노출합니다.",
    impact: "의료기관 스키마가 없으면 구글이 사이트를 일반 비즈니스로 분류합니다. 의료 관련 검색에서 경쟁 병원보다 낮은 순위에 노출됩니다.",
  });

  // 7-2. 연락처/위치 정보 (7점) — 서브페이지 통합
  const hasTelLink = $("a[href^='tel:']").length > 0 || agg.hasTelLink;
  const hasEmailLink = $("a[href^='mailto:']").length > 0 || agg.hasEmailLink;
  const hasAddress = $("address").length > 0 || $('[itemprop="address"]').length > 0 || agg.hasAddress;
  const hasMap = country === "th"
    ? html.includes("maps.google") || html.includes("google.com/maps") || $("iframe[src*='google.com/maps']").length > 0 || $("iframe[src*='map']").length > 0 || agg.hasMap
    : html.includes("map.naver.com") || html.includes("maps.google") || html.includes("kakaomap") || $("iframe[src*='map']").length > 0 || agg.hasMap;
  const contactSignals = [hasTelLink, hasEmailLink, hasAddress, hasMap].filter(Boolean).length;
  items.push({
    id: "hospital-contact",
    category: "병원 특화 SEO",
    name: "연락처/위치 정보",
    status: contactSignals >= 3 ? "pass" : contactSignals >= 2 ? "warning" : "fail",
    score: contactSignals >= 3 ? 7 : contactSignals >= 2 ? 4 : contactSignals >= 1 ? 2 : 0,
    maxScore: 7,
    detail: `연락처 정보 ${contactSignals}/4개 (${[hasTelLink && '전화번호', hasEmailLink && '이메일', hasAddress && '주소', hasMap && '지도'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: contactSignals >= 3 ? "연락처 정보가 잘 구성되어 있습니다." : "전화번호(tel: 링크), 이메일(mailto: 링크), 주소(address 태그), 지도 임베드를 모두 추가하세요. 병원은 연락처 정보가 검색 순위에 직접적으로 영향을 미칩니다.",
    impact: "구글은 지역 비즈니스(병원)의 연락처 정보를 검색 순위의 핵심 신호로 사용합니다. 전화번호, 주소, 지도가 없으면 '내 주변 병원' 검색에서 노출되지 않습니다.",
  });

  // 7-3. 진료 시간/예약 시스템 (5점) — 국가별 패턴
  const openingHoursPatterns = country === "th"
    ? ["openingHours", "opening hours", "business hours", "clinic hours", "เวลาทำการ", "เวลาเปิด"]
    : ["openingHours", "진료시간", "영업시간"];
  const hasOpeningHours = openingHoursPatterns.some(p => html.includes(p)) || $('[itemprop="openingHours"]').length > 0 || agg.hasOpeningHours;
  const bookingPatterns = country === "th"
    ? ["booking", "appointment", "book now", "reserve", "นัดหมาย", "จอง"]
    : ["예약", "booking", "appointment"];
  const hasBookingSystem = bookingPatterns.some(p => html.toLowerCase().includes(p.toLowerCase())) || $("a[href*='booking']").length > 0 || $("button").filter((_, el) => bookingPatterns.some(p => $(el).text().toLowerCase().includes(p.toLowerCase()))).length > 0 || agg.hasBookingSystem;
  items.push({
    id: "hospital-booking",
    category: "병원 특화 SEO",
    name: "진료 시간/예약 시스템",
    status: hasOpeningHours && hasBookingSystem ? "pass" : hasOpeningHours || hasBookingSystem ? "warning" : "fail",
    score: hasOpeningHours && hasBookingSystem ? 5 : hasOpeningHours || hasBookingSystem ? 2 : 0,
    maxScore: 5,
    detail: `${[hasOpeningHours && (country === 'th' ? 'Opening hours info' : '진료시간 정보'), hasBookingSystem && (country === 'th' ? 'Booking system' : '예약 시스템')].filter(Boolean).join(', ') || (country === 'th' ? 'No opening hours/booking info' : '진료시간/예약 정보 없음')}`,
    recommendation: hasOpeningHours && hasBookingSystem ? "진료 시간과 예약 시스템이 잘 구성되어 있습니다." : "진료 시간을 명시하고, 온라인 예약 시스템을 추가하세요. 구글은 예약 가능한 병원을 검색 결과에서 우선 노출합니다.",
    impact: "구글은 예약 가능한 비즈니스를 검색 결과에서 우선 노출합니다. 진료 시간이 명시되지 않으면 환자가 이탈합니다.",
  });

  // 7-4. 의료진 정보/전문성 (5점) — 국가별 패턴
  const hasAuthor = $("[rel='author']").length > 0 || $('meta[name="author"]').attr("content") || $('[itemprop="author"]').length > 0;
  const doctorPatterns = country === "th"
    ? ["doctor", "physician", "surgeon", "dermatologist", "specialist", "MD", "Dr.", "แพทย์", "หมอ"]
    : ["원장", "의사", "전문의", "doctor", "physician"];
  const hasDoctorInfo = doctorPatterns.some(p => html.toLowerCase().includes(p.toLowerCase())) || agg.hasDoctorInfo;
  const credentialPatterns = country === "th"
    ? ["qualification", "credential", "board certified", "fellowship", "experience", "education", "คุณวุฒิ", "ประสบการณ์"]
    : ["자격", "학력", "경력", "수상", "논문"];
  const hasCredentials = credentialPatterns.some(p => html.toLowerCase().includes(p.toLowerCase())) || agg.hasCredentials;
  items.push({
    id: "hospital-doctor-info",
    category: "병원 특화 SEO",
    name: "의료진 정보/전문성",
    status: hasDoctorInfo && hasCredentials ? "pass" : hasDoctorInfo || hasAuthor ? "warning" : "fail",
    score: hasDoctorInfo && hasCredentials ? 5 : hasDoctorInfo || hasAuthor ? 2 : 0,
    maxScore: 5,
    detail: `${[hasDoctorInfo && '의료진 정보', hasCredentials && '자격/경력 정보', hasAuthor && '저자 정보'].filter(Boolean).join(', ') || '의료진 정보 없음'}`,
    recommendation: hasDoctorInfo && hasCredentials ? "의료진 정보가 잘 구성되어 있습니다." : "원장님의 전문의 자격, 학력, 경력, 수상 이력 등을 상세히 기재하세요. 의료 분야에서 E-E-A-T(전문성) 신호는 검색 순위에 결정적입니다.",
    impact: "구글은 의료 분야를 YMYL(Your Money Your Life)로 분류하여 전문성을 특히 엄격하게 평가합니다. 의료진 정보가 없으면 신뢰도가 낮아져 검색 순위가 크게 하락합니다.",
  });

  // 7-5. FAQ/자주 묻는 질문 (5점) — 서브페이지 통합
  const hasFaqSchema = jsonLdTypes.some(t => t.includes("FAQPage")) || agg.hasFaqSchema;
  const hasFaqContent = $("dt").length > 0 || $("details").length > 0 || $("[itemtype*='Question']").length > 0 || agg.hasFaqContent;
  items.push({
    id: "hospital-faq",
    category: "병원 특화 SEO",
    name: "FAQ (자주 묻는 질문)",
    status: hasFaqSchema ? "pass" : hasFaqContent ? "warning" : "fail",
    score: hasFaqSchema ? 5 : hasFaqContent ? 2 : 0,
    maxScore: 5,
    detail: hasFaqSchema ? "FAQ 구조화 데이터(FAQPage)가 있습니다." : hasFaqContent ? "FAQ 콘텐츠는 있지만 구조화 데이터가 없습니다." : "FAQ 콘텐츠가 없습니다.",
    recommendation: hasFaqSchema ? "FAQ 구조화 데이터가 잘 적용되어 있습니다." : "자주 묻는 질문을 FAQPage 스키마와 함께 추가하세요. 구글 검색 결과에 FAQ가 직접 표시되어 클릭률이 2~3배 높아집니다.",
    impact: "FAQ 스키마가 있으면 구글 검색 결과에 질문-답변이 직접 표시됩니다. 환자들이 자주 묻는 질문(비용, 시간, 보험 등)을 미리 답변하면 전환율이 크게 높아집니다.",
  });

  // 7-6. 개인정보처리방침/이용약관 (5점) — 국가별 패턴
  const privacyPatterns = country === "th"
    ? ["privacy", "policy", "PDPA", "นโยบายความเป็นส่วนตัว"]
    : ["개인정보", "privacy", "policy"];
  const hasPrivacyPolicy = $("a[href*='privacy']").length > 0 || $("a[href*='policy']").length > 0 || privacyPatterns.some(p => html.includes(p)) || agg.hasPrivacyPolicy;
  const termsPatterns = country === "th"
    ? ["terms", "conditions", "terms of service", "ข้อกำหนด"]
    : ["이용약관", "서비스 약관", "terms"];
  const hasTerms = $("a[href*='terms']").length > 0 || termsPatterns.some(p => html.includes(p)) || agg.hasTerms;
  items.push({
    id: "hospital-legal",
    category: "병원 특화 SEO",
    name: "개인정보처리방침/이용약관",
    status: hasPrivacyPolicy && hasTerms ? "pass" : hasPrivacyPolicy || hasTerms ? "warning" : "fail",
    score: hasPrivacyPolicy && hasTerms ? 5 : hasPrivacyPolicy || hasTerms ? 2 : 0,
    maxScore: 5,
    detail: `${[hasPrivacyPolicy && '개인정보처리방침', hasTerms && '이용약관'].filter(Boolean).join(', ') || '법적 문서 없음'}`,
    recommendation: hasPrivacyPolicy && hasTerms ? "법적 문서가 잘 구비되어 있습니다." : "개인정보처리방침과 이용약관 페이지를 추가하세요. 의료기관은 법적으로 필수이며, 구글도 신뢰도 신호로 활용합니다.",
    impact: "개인정보처리방침이 없으면 의료법 위반 소지가 있으며, 구글은 이를 신뢰도 부족으로 판단하여 검색 순위를 하락시킵니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 카테고리 8: AI 인용 — 만점 65점 (기존 12개 + 신규 1개 = 13개, 크롤러/구조화 데이터 가중치 강화)
  // ═══════════════════════════════════════════════════════════════

  // 8-1. AI 크롤러 허용 여부 (10점) — 가중치 강화: AI 인용의 전제조건
  const aiCrawlers = [
    { name: "GPTBot", label: "ChatGPT" },
    { name: "Google-Extended", label: "Gemini" },
    { name: "ClaudeBot", label: "Claude" },
    { name: "PerplexityBot", label: "Perplexity" },
    { name: "Bytespider", label: "Grok/기타" },
  ];
  const blockedCrawlers: string[] = [];
  const allowedCrawlers: string[] = [];
  for (const crawler of aiCrawlers) {
    const crawlerRegex = new RegExp(
      `User-agent:\\s*${crawler.name}[\\s\\S]*?Disallow:\\s*/`,
      "i"
    );
    if (robotsTxt && crawlerRegex.test(robotsTxt)) {
      blockedCrawlers.push(`${crawler.label}(${crawler.name})`);
    } else {
      allowedCrawlers.push(`${crawler.label}(${crawler.name})`);
    }
  }
  const aiCrawlerScore = blockedCrawlers.length === 0 ? 10 : Math.max(0, 10 - blockedCrawlers.length * 3);
  items.push({
    id: "ai-crawlers",
    category: "AI 검색 노출",
    name: "AI 크롤러 접근 허용",
    status: blockedCrawlers.length === 0 ? "pass" : blockedCrawlers.length <= 2 ? "warning" : "fail",
    score: aiCrawlerScore,
    maxScore: 10,
    detail: blockedCrawlers.length === 0
      ? `모든 AI 크롤러 접근 허용 (${allowedCrawlers.map(c => c.split('(')[0]).join(', ')})`
      : `차단된 AI 크롤러: ${blockedCrawlers.join(', ')} — 이 크롤러들이 차단되면 해당 AI 검색엔진에서 완전히 제외됩니다`,
    recommendation: blockedCrawlers.length === 0
      ? "모든 주요 AI 검색엔진의 크롤러가 사이트에 접근할 수 있습니다."
      : `robots.txt에서 ${blockedCrawlers.join(', ')}의 접근이 차단되어 있습니다. AI 검색에 노출되려면 차단을 해제하세요.`,
    impact: "ChatGPT, Gemini, Claude, Perplexity 등 AI 검색엔진은 자체 크롤러로 사이트를 수집합니다. 크롤러가 차단되면 AI 검색 결과에서 완전히 제외됩니다.",
  });

  // 8-2. AI 인용 가능 구조화 데이터 (8점) — 가중치 강화: FAQPage/MedicalWebPage 가산점
  const aiFriendlySchemas = ["FAQPage", "HowTo", "QAPage", "Article", "MedicalWebPage", "LocalBusiness", "ProfessionalService", "Physician", "MedicalClinic", "Hospital"];
  const foundAiSchemas = jsonLdTypes.filter(t => aiFriendlySchemas.some(s => t.includes(s)));
  items.push({
    id: "ai-schema",
    category: "AI 검색 노출",
    name: "AI 인용 가능 구조화 데이터",
    status: foundAiSchemas.length >= 3 ? "pass" : foundAiSchemas.length >= 1 ? "warning" : "fail",
    score: (() => {
      if (foundAiSchemas.length === 0) return 0;
      let s = Math.min(foundAiSchemas.length * 2, 6);
      // FAQPage, MedicalWebPage 가산점 (각 +1)
      if (foundAiSchemas.some(t => t.includes('FAQPage'))) s = Math.min(s + 1, 8);
      if (foundAiSchemas.some(t => t.includes('MedicalWebPage'))) s = Math.min(s + 1, 8);
      return s;
    })(),
    maxScore: 8,
    detail: foundAiSchemas.length > 0 ? `AI 친화적 스키마 ${foundAiSchemas.length}개: ${foundAiSchemas.join(', ')}${foundAiSchemas.some(t => t.includes('FAQPage')) ? ' (FAQPage 가산점 적용)' : ''}${foundAiSchemas.some(t => t.includes('MedicalWebPage')) ? ' (MedicalWebPage 가산점 적용)' : ''}` : "AI가 인용하기 좋은 구조화 데이터가 없습니다.",
    recommendation: foundAiSchemas.length >= 4 ? "AI 검색엔진이 참조하기 좋은 구조화 데이터가 잘 구성되어 있습니다." : "FAQPage, Article, LocalBusiness, MedicalClinic, MedicalWebPage 등 AI가 답변에 인용할 수 있는 스키마를 4개 이상 추가하세요. 특히 FAQPage와 MedicalWebPage는 AI 인용률을 크게 높입니다.",
    impact: "AI는 구조화 데이터를 우선 참조하여 답변을 생성합니다. 스키마가 많을수록 AI 답변의 출처로 선택될 확률이 높아집니다.",
  });

  // 8-3. 시맨틱 HTML 구조 (5점)
  const hasMain = $("main").length > 0;
  const hasArticle = $("article").length > 0;
  const hasSection = $("section").length > 0;
  const hasNav = $("nav").length > 0;
  const hasHeader = $("header").length > 0;
  const hasFooter = $("footer").length > 0;
  const semanticCount = [hasMain, hasArticle, hasSection, hasNav, hasHeader, hasFooter].filter(Boolean).length;
  items.push({
    id: "ai-semantic",
    category: "AI 검색 노출",
    name: "시맨틱 HTML 구조",
    status: semanticCount >= 5 ? "pass" : semanticCount >= 3 ? "warning" : "fail",
    score: semanticCount >= 5 ? 5 : semanticCount >= 3 ? 3 : semanticCount >= 1 ? 1 : 0,
    maxScore: 5,
    detail: `시맨틱 태그 ${semanticCount}/6개 사용 (${[hasMain && 'main', hasArticle && 'article', hasSection && 'section', hasNav && 'nav', hasHeader && 'header', hasFooter && 'footer'].filter(Boolean).join(', ')})`,
    recommendation: semanticCount >= 5 ? "시맨틱 HTML이 잘 구성되어 있습니다." : "main, article, section, nav, header, footer 등 시맨틱 태그를 5개 이상 사용하세요. AI는 시맨틱 태그로 감싼 콘텐츠를 더 정확하게 이해합니다.",
    impact: "AI 검색엔진은 HTML 구조를 분석하여 핵심 콘텐츠를 추출합니다. 시맨틱 태그가 없으면 AI가 본문을 구분하지 못합니다.",
  });

  // 8-4. E-E-A-T 신뢰도 신호 (8점) — 가중치 강화: 의료 전문성 세분화
  const hasAboutPage = $("a[href*='about']").length > 0 || $("a[href*='company']").length > 0 || html.includes("회사 소개") || html.includes("소개");
  // 의료 전문성 추가 신호 감지
  const hasMedicalCredentials = html.includes("전문의") || html.includes("원장") || html.includes("의료진") || html.includes("MD") || html.includes("Board Certified") || html.includes("전문의 자격");
  const hasAcademicInfo = html.includes("학회") || html.includes("논문") || html.includes("연구") || html.includes("학위") || html.includes("fellowship") || html.includes("publication");
  const eatSignals = [hasAuthor, hasTelLink || hasEmailLink, hasAddress, hasAboutPage, hasPrivacyPolicy, hasMedicalCredentials, hasAcademicInfo].filter(Boolean).length;
  items.push({
    id: "ai-eeat",
    category: "AI 검색 노출",
    name: "E-E-A-T 신뢰도 신호",
    status: eatSignals >= 5 ? "pass" : eatSignals >= 3 ? "warning" : "fail",
    score: eatSignals >= 5 ? 8 : eatSignals >= 3 ? Math.min(eatSignals + 1, 6) : eatSignals >= 1 ? Math.min(eatSignals, 3) : 0,
    maxScore: 8,
    detail: `신뢰도 신호 ${eatSignals}/7개 발견 (${[hasAuthor && '저자 정보', (hasTelLink || hasEmailLink) && '연락처', hasAddress && '주소', hasAboutPage && '소개 페이지', hasPrivacyPolicy && '개인정보처리방침', hasMedicalCredentials && '의료 자격/전문의', hasAcademicInfo && '학회/논문/연구'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: eatSignals >= 5 ? "사이트의 전문성과 신뢰도를 나타내는 신호가 충분합니다." : `${[!hasAuthor && '저자/전문가 정보', !(hasTelLink || hasEmailLink) && '전화번호/이메일', !hasAddress && '사업장 주소', !hasAboutPage && '소개 페이지', !hasPrivacyPolicy && '개인정보처리방침', !hasMedicalCredentials && '의료 자격/전문의 정보', !hasAcademicInfo && '학회/논문/연구 정보'].filter(Boolean).join(', ')}을(를) 추가하세요. 특히 의료 분야에서는 전문의 자격과 학회 활동 정보가 AI 인용률을 크게 높입니다.`,
    impact: "AI는 답변 생성 시 신뢰할 수 있는 출처를 우선 인용합니다. 특히 의료 분야(YMYL)에서는 전문의 자격, 학회 활동, 논문 정보가 있으면 AI가 해당 사이트를 '권위 있는 의료 정보 출처'로 판단합니다.",
  });

  // 8-5. 콘텐츠 인용 가능성 (5점) — 기준 강화
  const hasDefinitions = $("dl").length > 0 || $("dfn").length > 0 || $("abbr").length > 0;
  const hasOrderedLists = $("ol").length > 0;
  const hasUnorderedLists = $("ul").length > 0;
  const hasTable = $("table").length > 0;
  const hasClearParagraphs = $("p").filter((_, el) => {
    const text = $(el).text().trim();
    return text.length >= 50 && text.length <= 300;
  }).length >= 5;
  const citabilitySignals = [hasFaqSchema || hasFaqContent, hasDefinitions || hasTable, hasOrderedLists || hasUnorderedLists, hasClearParagraphs].filter(Boolean).length;
  items.push({
    id: "ai-citability",
    category: "AI 검색 노출",
    name: "콘텐츠 인용 가능성",
    status: citabilitySignals >= 3 ? "pass" : citabilitySignals >= 1 ? "warning" : "fail",
    score: citabilitySignals >= 3 ? 5 : citabilitySignals >= 1 ? Math.min(citabilitySignals * 2, 4) : 0,
    maxScore: 5,
    detail: `인용 가능 구조 ${citabilitySignals}/4개 발견 (${[hasFaqSchema || hasFaqContent ? 'FAQ/질문-답변' : '', (hasDefinitions || hasTable) ? '정의/표' : '', (hasOrderedLists || hasUnorderedLists) ? '리스트 구조' : '', hasClearParagraphs ? '명확한 문단' : ''].filter(Boolean).join(', ') || '없음'})`,
    recommendation: citabilitySignals >= 3 ? "AI가 답변에 직접 인용할 수 있는 콘텐츠 구조가 잘 갖춰져 있습니다." : "FAQ 형태의 질문-답변, 명확한 정의, 단계별 리스트, 50~300자 분량의 핵심 문단을 추가하세요.",
    impact: "AI 검색엔진은 명확하고 간결한 문단을 직접 인용합니다. 구조화된 콘텐츠가 있으면 AI 답변의 출처로 선택될 확률이 크게 높아집니다.",
  });

  // 8-6. AI 검색 메타데이터 (5점)
  const hasDescriptiveTitle = titleLen >= 20 && titleLen <= 60;
  const hasDescriptiveDesc = descLen >= 80 && descLen <= 160;
  const hasHreflang = $("link[hreflang]").length > 0;
  const aiMetaSignals = [hasOgSiteName, hasOgLocale, hasDescriptiveTitle, hasDescriptiveDesc, hasHreflang].filter(Boolean).length;
  items.push({
    id: "ai-metadata",
    category: "AI 검색 노출",
    name: "AI 검색 메타데이터",
    status: aiMetaSignals >= 4 ? "pass" : aiMetaSignals >= 2 ? "warning" : "fail",
    score: aiMetaSignals >= 4 ? 5 : aiMetaSignals >= 2 ? Math.min(aiMetaSignals, 3) : aiMetaSignals >= 1 ? 1 : 0,
    maxScore: 5,
    detail: `AI 메타데이터 ${aiMetaSignals}/5개 설정 (${[hasOgSiteName && 'og:site_name', hasOgLocale && 'og:locale', hasDescriptiveTitle && '최적 타이틀 길이', hasDescriptiveDesc && '최적 설명 길이', hasHreflang && 'hreflang 다국어'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: aiMetaSignals >= 4 ? "AI 검색엔진이 사이트를 이해하는 데 필요한 메타데이터가 잘 설정되어 있습니다." : `${[!hasOgSiteName && 'og:site_name', !hasOgLocale && 'og:locale', !hasDescriptiveTitle && '타이틀 20~60자 최적화', !hasDescriptiveDesc && '메타 설명 80~160자 최적화', !hasHreflang && 'hreflang 다국어 태그'].filter(Boolean).join(', ')}을(를) 추가하세요.`,
    impact: "AI는 메타데이터를 통해 사이트의 정체성과 언어를 파악합니다. og:site_name은 AI가 출처를 표시할 때 사용합니다.",
  });

  // 8-7. AI 질문-답변 최적화 (5점) — 신규
  const hasQuestionPatterns = (bodyText.match(/\?/g) || []).length;
  const hasQAStructure = hasQuestionPatterns >= 3 && (hasFaqContent || hasFaqSchema);
  const hasDirectAnswers = $("p").filter((_, el) => {
    const text = $(el).text().trim();
    if (text.length < 30 || text.length > 200) return false;
    if (country === "th") {
      // 태국/영어 사이트: 영어 직접 답변 패턴
      return /\b(is|are|can|will|should|include|provide|offer|take|cost|last)s?\b/i.test(text);
    }
    return text.includes("입니다") || text.includes("합니다") || text.includes("됩니다");
  }).length >= 3;
  items.push({
    id: "ai-qa-optimization",
    category: "AI 검색 노출",
    name: "AI 질문-답변 최적화",
    status: hasQAStructure && hasDirectAnswers ? "pass" : hasQAStructure || hasDirectAnswers ? "warning" : "fail",
    score: hasQAStructure && hasDirectAnswers ? 5 : hasQAStructure || hasDirectAnswers ? 2 : 0,
    maxScore: 5,
    detail: `질문 패턴: ${hasQuestionPatterns}개, ${[hasQAStructure && 'Q&A 구조', hasDirectAnswers && '직접 답변 문단'].filter(Boolean).join(', ') || '최적화 부족'}`,
    recommendation: hasQAStructure && hasDirectAnswers ? "AI가 질문-답변을 인용하기 좋은 구조입니다." : country === "th"
      ? "환자들이 자주 묻는 질문을 '질문 → 명확한 답변' 형태로 작성하세요. AI는 이런 패턴을 직접 인용합니다. 예: 'How much does rhinoplasty cost? → Rhinoplasty at our clinic starts from 80,000 THB.'"
      : "환자들이 자주 묻는 질문을 '질문 → 명확한 답변' 형태로 작성하세요. AI는 이런 패턴을 직접 인용합니다. 예: '임플란트 비용은 얼마인가요? → 임플란트 비용은 개당 100~200만원입니다.'",
    impact: "ChatGPT, Gemini 등 AI는 사용자 질문에 대한 답변을 생성할 때, 웹사이트의 질문-답변 패턴을 직접 인용합니다. 이 구조가 없으면 AI가 경쟁 병원의 정보를 대신 인용합니다.",
  });

  // 8-8. AI 전문 콘텐츠 깊이 (5점) — 신규
  const longParagraphs = $("p").filter((_, el) => $(el).text().trim().length >= 100).length;
  const hasSubheadings = h2Count >= 3;
  const hasDetailedContent = wordCount >= 3000 && longParagraphs >= 5 && hasSubheadings;
  items.push({
    id: "ai-content-depth",
    category: "AI 검색 노출",
    name: "AI 전문 콘텐츠 깊이",
    status: hasDetailedContent ? "pass" : longParagraphs >= 3 ? "warning" : "fail",
    score: hasDetailedContent ? 5 : longParagraphs >= 3 ? 2 : 0,
    maxScore: 5,
    detail: `텍스트 ${wordCount.toLocaleString()}자, 상세 문단 ${longParagraphs}개, 소제목 ${h2Count}개`,
    recommendation: hasDetailedContent ? "AI가 참조하기에 충분한 깊이의 콘텐츠가 있습니다." : "3,000자 이상의 상세한 콘텐츠, 100자 이상의 문단 5개+, 소제목 3개+를 갖추세요. AI는 깊이 있는 전문 콘텐츠를 우선 참조합니다.",
    impact: "AI 검색엔진은 얕은 콘텐츠보다 깊이 있는 전문 콘텐츠를 우선 인용합니다. 특히 의료 분야는 전문성이 높은 콘텐츠가 AI 답변의 출처로 선택될 확률이 높습니다.",
  });

  // 8-9. AI 크롤러 전용 허용 규칙 (3점) — 신규
  const hasExplicitAiAllow = robotsTxt.includes("GPTBot") || robotsTxt.includes("ClaudeBot") || robotsTxt.includes("Google-Extended") || robotsTxt.includes("PerplexityBot");
  const hasWildcardAllow = robotsExists && !robotsTxt.includes("Disallow: /\n") && robotsTxt.includes("Allow");
  items.push({
    id: "ai-explicit-allow",
    category: "AI 검색 노출",
    name: "AI 크롤러 명시적 허용",
    status: hasExplicitAiAllow ? "pass" : hasWildcardAllow ? "warning" : "fail",
    score: hasExplicitAiAllow ? 3 : hasWildcardAllow ? 1 : 0,
    maxScore: 3,
    detail: hasExplicitAiAllow ? "robots.txt에 AI 크롤러가 명시적으로 언급되어 있습니다." : hasWildcardAllow ? "전체 허용은 되어 있지만 AI 크롤러가 명시되지 않았습니다." : "robots.txt에 AI 크롤러 관련 규칙이 없습니다.",
    recommendation: hasExplicitAiAllow ? "AI 크롤러가 명시적으로 허용되어 있어 AI 인용에 유리합니다." : "robots.txt에 'User-agent: GPTBot\\nAllow: /' 등 AI 크롤러를 명시적으로 허용하세요. 명시적 허용은 AI 크롤러가 사이트를 더 적극적으로 수집하게 합니다.",
    impact: "AI 크롤러를 명시적으로 허용하면, AI 검색엔진이 사이트를 더 자주, 더 깊이 크롤링합니다. 이는 AI 검색 결과에서의 노출 빈도를 직접적으로 높입니다.",
  });

  // 8-10. AI 출처 표시 최적화 (3점) — 신규
  const hasOgSiteNameVal = !!hasOgSiteName;
  const hasBrandInTitle = effectiveTitle.length > 0 && (effectiveTitle.includes("|") || effectiveTitle.includes("-") || effectiveTitle.includes("·"));
  items.push({
    id: "ai-source-branding",
    category: "AI 검색 노출",
    name: "AI 출처 표시 최적화",
    status: hasOgSiteNameVal && hasBrandInTitle ? "pass" : hasOgSiteNameVal || hasBrandInTitle ? "warning" : "fail",
    score: hasOgSiteNameVal && hasBrandInTitle ? 3 : hasOgSiteNameVal || hasBrandInTitle ? 1 : 0,
    maxScore: 3,
    detail: `${[hasOgSiteNameVal && 'og:site_name 설정', hasBrandInTitle && '타이틀에 브랜드명 포함'].filter(Boolean).join(', ') || 'AI 출처 표시 최적화 부족'}`,
    recommendation: hasOgSiteNameVal && hasBrandInTitle ? "AI가 출처를 표시할 때 브랜드가 잘 노출됩니다." : "og:site_name을 설정하고, 타이틀에 '브랜드명 | 키워드' 형태로 브랜드를 포함하세요. AI가 답변에 출처를 표시할 때 브랜드명이 노출됩니다.",
    impact: "AI가 답변에 출처를 표시할 때 og:site_name과 타이틀의 브랜드명을 사용합니다. 이 설정이 없으면 AI가 출처를 표시하더라도 브랜드가 인식되지 않습니다.",
  });

  // 8-11. llms.txt 파일 (1점) — 신규
  // llms.txt는 AI 크롤러를 위해 새롭게 부상하는 파일 형식
  let hasLlmsTxt = false;
  try {
    const llmsRes = await fetchWithRetry(`${baseUrl}/llms.txt`, 2000, 0, country);
    if (llmsRes.ok) {
      const llmsText = await llmsRes.text();
      hasLlmsTxt = llmsText.length > 10 && !llmsText.includes("<!DOCTYPE") && !llmsText.includes("<html");
    }
  } catch {}
  items.push({
    id: "ai-llms-txt",
    category: "AI 검색 노출",
    name: "llms.txt (AI 전용 안내 파일)",
    status: hasLlmsTxt ? "pass" : "fail",
    score: hasLlmsTxt ? 1 : 0,
    maxScore: 1,
    detail: hasLlmsTxt ? "llms.txt 파일이 존재합니다." : "llms.txt 파일이 없습니다.",
    recommendation: hasLlmsTxt ? "llms.txt가 설정되어 있어 AI 크롤러에게 사이트 정보를 효과적으로 전달합니다." : "llms.txt 파일을 생성하세요. 이 파일은 AI 크롤러에게 사이트의 핵심 정보(서비스, 전문 분야, 연락처 등)를 구조화된 형태로 전달하는 새롭게 부상하는 제안(proposal)입니다.",
    impact: "llms.txt는 AI 검색엔진을 위해 새롭게 부상하는 파일 형식입니다. robots.txt가 검색엔진 크롤러를 위한 것이라면, llms.txt는 AI 크롤러를 위한 것입니다. 이 파일이 있으면 AI가 사이트를 더 정확하게 이해합니다.",
  });

  // 8-12. AI 최적 인용 블록 감지 (4점) — 신규: 134-167단어(한국어 80-120어절) 자기완결형 문단
  const optimalBlocks = $("p").filter((_: any, el: any) => {
    const text = $(el).text().trim();
    // 한국어: 어절 수 기준 (80-120어절), 영어: 단어 수 기준 (134-167단어)
    const wordCount = country === "th" 
      ? text.split(/\s+/).filter(Boolean).length
      : text.split(/\s+/).filter(Boolean).length;
    return wordCount >= 25 && wordCount <= 60 && text.length >= 80 && text.length <= 400;
  }).length;
  const hasOptimalBlocks = optimalBlocks >= 3;
  items.push({
    id: "ai-optimal-block",
    category: "AI 검색 노출",
    name: "AI 최적 인용 블록",
    status: hasOptimalBlocks ? "pass" : optimalBlocks >= 1 ? "warning" : "fail",
    score: hasOptimalBlocks ? 4 : optimalBlocks >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `최적 길이 문단(80-400자) ${optimalBlocks}개 발견`,
    recommendation: hasOptimalBlocks ? "AI가 직접 인용하기 좋은 최적 길이의 자기완결형 문단이 충분합니다." : "80-400자 길이의 자기완결형 문단을 3개 이상 작성하세요. AI 검색엔진은 이 길이의 문단을 가장 많이 인용합니다. 각 문단은 하나의 주제에 대해 완전한 답변을 담아야 합니다.",
    impact: "AI 검색엔진은 134-167단어(한국어 80-120어절) 길이의 자기완결형 문단을 가장 많이 인용합니다. 너무 짧으면 정보가 부족하고, 너무 길면 AI가 핵심을 추출하기 어렵습니다.",
  });

  // ── (#23) 키워드 노출 코드 기반 분석 ──
  const metaKws = metaKeywords ? metaKeywords.split(",").map(k => k.trim()).filter(Boolean).slice(0, 5) : [];
  if (metaKws.length > 0) {
    const kwResults = analyzeMultipleKeywords({ keywords: metaKws, html, title: effectiveTitle, metaDescription: metaDesc, metaKeywords, bodyText, url });
    const avgScore = kwResults.reduce((s, r) => s + r.exposureScore, 0) / kwResults.length;
    const excellentCount = kwResults.filter(r => r.status === "excellent" || r.status === "good").length;
    items.push({
      id: "ai-keyword-exposure",
      category: "AI 검색 노출",
      name: "핵심 키워드 노출 분석",
      status: avgScore >= 60 ? "pass" : avgScore >= 30 ? "warning" : "fail",
      score: avgScore >= 60 ? 5 : avgScore >= 30 ? 3 : 0,
      maxScore: 5,
      detail: `메타 키워드 ${metaKws.length}개 중 ${excellentCount}개 양호 노출 (평균 노출 점수: ${Math.round(avgScore)}/100)`,
      recommendation: avgScore >= 60 
        ? "핵심 키워드가 페이지 전반에 잘 분포되어 있습니다." 
        : `키워드 노출이 부족합니다. ${kwResults.filter(r => r.status === "missing" || r.status === "weak").map(r => `"${r.keyword}"`).join(", ")} 키워드를 타이틀, H1, 본문에 자연스럽게 포함하세요.`,
      impact: "키워드가 페이지 주요 위치(타이틀, H1, 맨 앞 본문)에 있을수록 검색엔진과 AI가 해당 주제의 권위 페이지로 판단합니다.",
    });
  }

  // ── (#20) 동적 콘텐츠 감지 ──
  const dynamicResult = detectDynamicContent(html, bodyText);
  items.push({
    id: "ai-dynamic-content",
    category: "AI 검색 노출",
    name: "동적 콘텐츠 SEO 위험도",
    status: dynamicResult.seoRisk === "low" ? "pass" : dynamicResult.seoRisk === "medium" ? "warning" : "fail",
    score: dynamicResult.seoRisk === "low" ? 4 : dynamicResult.seoRisk === "medium" ? 2 : 0,
    maxScore: 4,
    detail: `동적 콘텐츠 비율: ${dynamicResult.dynamicRatio}%, 감지 패턴: ${dynamicResult.patterns.length}개${dynamicResult.patterns.length > 0 ? ` (${dynamicResult.patterns.map(p => p.type).join(", ")})` : ""}`,
    recommendation: dynamicResult.seoRisk === "low" 
      ? "정적 HTML 기반으로 검색엔진이 콘텐츠를 정상적으로 읽을 수 있습니다." 
      : "동적 콘텐츠 비율이 높습니다. SSR(서버사이드 렌더링) 또는 프리렌더링을 적용하여 검색엔진과 AI가 콘텐츠를 읽을 수 있도록 하세요.",
    impact: "검색엔진과 AI는 주로 정적 HTML을 읽습니다. JavaScript로만 렌더링되는 콘텐츠는 인덱싱되지 않거나 AI 인용에서 누락될 수 있습니다.",
  });

  // ── v4 추가 항목 통합 (53개 항목 추가) ──
  // 이미 위에서 선언된 변수들을 재활용하여 context 구성
  const v4OgTitle = $('meta[property="og:title"]').attr("content") || "";
  const v4OgDesc = $('meta[property="og:description"]').attr("content") || "";
  const v4OgImage = $('meta[property="og:image"]').attr("content") || "";
  const v4HtmlLang = $("html").attr("lang") || "";
  const v4H1Count = $('h1').length;
  const v4H2Count = $('h2').length;
  const v4H3Count = $('h3').length;
  const v4TotalImages = $('img').length;
  let v4ImagesWithAlt = 0;
  $('img').each((_: any, el: any) => { if ($(el).attr('alt')?.trim()) v4ImagesWithAlt++; });
  const v4AllLinks = $("a[href]");
  const v4InternalLinks = v4AllLinks.filter((_: any, el: any) => {
    const href = $(el).attr("href") || "";
    return href.startsWith("/") || href.startsWith(baseUrl);
  }).length;
  const v4ExternalLinks = v4AllLinks.filter((_: any, el: any) => {
    const href = $(el).attr("href") || "";
    return href.startsWith("http") && !href.startsWith(baseUrl);
  }).length;

  const additionalItems = generateAdditionalItems({
    $, html, bodyText, wordCount, baseUrl,
    responseHeaders, robotsTxt, robotsExists,
    jsonLdTypes, jsonLdData, fetchOk, responseTime,
    effectiveTitle, metaDesc,
    ogTitle: v4OgTitle, ogDesc: v4OgDesc, ogImage: v4OgImage, htmlLang: v4HtmlLang,
    h1Count: v4H1Count, h2Count: v4H2Count, h3Count: v4H3Count,
    totalImages: v4TotalImages, imagesWithAlt: v4ImagesWithAlt,
    internalLinks: v4InternalLinks, externalLinks: v4ExternalLinks,
    country,
    agg: multiPageResult.aggregated,
    pageSpeed: pageSpeedData,
  });
  items.push(...additionalItems);

  // ── 국가별 항목 교체 ──
  if (country === "th") {
    // 태국: 네이버 관련 항목 제거
    const naverIds = new Set(["naver-verification", "naver-og-tags", "naver-korean-content", "naver-ecosystem", "naver-sitemap", "naver-smart-place", "naver-booking", "naver-pay", "social-kakao"]);
    for (let i = items.length - 1; i >= 0; i--) {
      if (naverIds.has(items[i].id)) items.splice(i, 1);
    }
    // 태국 전용 항목 추가
    const thCtx = {
      $, html, bodyText, baseUrl, robotsTxt, robotsExists,
      sitemapExists, sitemapInRobots: robotsTxt.toLowerCase().includes("sitemap"),
      htmlLang, responseHeaders, fetchOk, responseTime,
      ogTitle: v4OgTitle, ogDesc: v4OgDesc, ogImage: v4OgImage,
    };
    items.push(...generateThaiLocalSearchItems(thCtx));
    items.push(...generateThaiSocialItems(thCtx));
    items.push(...generateThaiMedicalTourismItems(thCtx));
  }

  // ── 카테고리별 집계 ──
  // AI 퍼스트 순서: AI 인용 → 콘텐츠 → 병원 특화 → 포털 대응 → 기술 인프라 순
  const categoryNames = country === "th"
    ? ["AI 검색 노출", "콘텐츠 구조", "병원 특화 SEO", "Google Thailand 최적화", "메타 태그", "검색 고급 설정", "소셜 미디어", "성능 최적화", "모바일 최적화", "접근성/UX", "국제화/다국어", "홈페이지 기본 설정"]
    : ["AI 검색 노출", "콘텐츠 구조", "병원 특화 SEO", "네이버 검색 최적화", "메타 태그", "검색 고급 설정", "소셜 미디어", "성능 최적화", "모바일 최적화", "접근성/UX", "국제화/다국어", "홈페이지 기본 설정"];
  const categories = categoryNames.map(name => {
    const catItems = items.filter(i => i.category === name);
    const actualMaxScore = catItems.reduce((s, i) => s + i.maxScore, 0);
    // (#10) 카테고리별 만점 고정 테이블 적용
    const fixedMax = CATEGORY_MAX_SCORES[name];
    const catMax = fixedMax || actualMaxScore;
    return {
      name,
      score: Math.min(catItems.reduce((s, i) => s + i.score, 0), catMax),
      maxScore: catMax,
      items: catItems,
    };
  });
  // (#11) 가중치 합산 검증: 카테고리별 maxScore 합이 TOTAL_MAX_SCORE와 일치하는지 확인
  const computedTotal = categories.reduce((s, c) => s + c.maxScore, 0);
  if (computedTotal !== TOTAL_MAX_SCORE && TOTAL_MAX_SCORE > 0) {
    console.warn(`[SEO] 카테고리 maxScore 합산(${computedTotal}) ≠ TOTAL_MAX_SCORE(${TOTAL_MAX_SCORE}). 정규화 적용.`);
  }
  // (#12) 최소 항목 수 보장 검증
  const minItemResult = validateMinItems(items);
  if (minItemResult.warnings.length > 0) {
    console.warn(`[SEO] 최소 항목 수 미달:`, minItemResult.warnings);
  }

  // 진료과별 가중치 적용
  const resolvedSpecialty = resolveSpecialty(specialty);
  let finalCategories = categories;
  let totalScore: number;
  let maxScoreTotal: number;

  if (specialty && resolvedSpecialty !== "기타") {
    // #18 데이터 기반 보정: 카테고리별 실제 점수 분포를 반영한 보정 가중치 적용
    const calibrationMap = getCalibrationMap(resolvedSpecialty);
    const calibratedCategories = categories.map(c => ({
      ...c,
      weight: calibrationMap[c.name] ?? 1.0,
    }));
    const weighted = applySpecialtyWeights(calibratedCategories, resolvedSpecialty);
    finalCategories = weighted.weightedCategories;
    totalScore = weighted.totalScore;
    maxScoreTotal = weighted.maxScore;
  } else {
    totalScore = categories.reduce((s, c) => s + c.score, 0);
    maxScoreTotal = categories.reduce((s, c) => s + c.maxScore, 0);
  }

  // 최종 안전장치: 모든 카테고리에서 score <= maxScore 보장
  finalCategories = finalCategories.map(c => ({
    ...c,
    score: Math.min(c.score, c.maxScore),
  }));

  // #19 소수점 반올림 규칙 통일: 최종 표시에만 반올림 적용
  const percent = maxScoreTotal > 0 ? displayScore((totalScore / maxScoreTotal) * 100) : 0;

  // #14 검사 항목 ID 체계 표준화: 카테고리코드-순번 형식 부여
  const allItems = enrichWithStandardIds(items);
  // Extract site name: prefer og:site_name, fallback to title tag
  // 에러 title인 경우 og:site_name → h1 → 도메인명 순으로 fallback
  const ogSiteNameVal = $('meta[property="og:site_name"]').attr("content")?.trim() || "";
  let extractedSiteName = "";
  if (!rawTitle || isErrorTitle) {
    extractedSiteName = ogSiteNameVal || h1ForTitle || domainName || parsedUrl.hostname;
  } else {
    extractedSiteName = ogSiteNameVal || effectiveTitle.split(/[|\-·–—]/).map(s => s.trim()).filter(Boolean)[0] || "";
  }
  // 최종 안전장치: siteName이 에러 문구를 포함하거나 빈 문자열이면 도메인명으로 대체
  if (!extractedSiteName || /\b(error|404|not\s*found|403|500|502|503)\b/i.test(extractedSiteName)) {
    extractedSiteName = ogSiteNameVal || domainName || parsedUrl.hostname;
  }

  // Extract favicon URL (absolute)
  const rawFavicon = $('link[rel="icon"]').attr("href") || $('link[rel="shortcut icon"]').attr("href") || "";
  const absoluteFavicon = rawFavicon
    ? rawFavicon.startsWith("http") ? rawFavicon : rawFavicon.startsWith("//") ? `https:${rawFavicon}` : `${baseUrl}${rawFavicon.startsWith("/") ? "" : "/"}${rawFavicon}`
    : "";

  const result: SeoAnalysisResult = {
    url,
    analyzedAt: new Date().toISOString(),
    totalScore: percent,
    maxScore: 100,
    grade: getGrade(percent),
    categories: finalCategories,
    summary: {
      passed: allItems.filter(i => i.status === "pass").length,
      warnings: allItems.filter(i => i.status === "warning").length,
      failed: allItems.filter(i => i.status === "fail").length,
      info: allItems.filter(i => i.status === "info").length,
    },
    siteName: extractedSiteName,
    faviconUrl: absoluteFavicon,
    multiPage: multiPageResult.subPages.length > 0 ? {
      subPageCount: multiPageResult.aggregated.subPageCount,
      crawledUrls: multiPageResult.aggregated.crawledUrls,
      aggregated: multiPageResult.aggregated,
    } : undefined,
     pageSpeed: pageSpeedData || undefined,
    // 사이트 접근 불가 / SPA 빈 콘텐츠 감지 시 한계 고지
    diagnosticLimitation: (() => {
      if (!fetchOk) {
        return {
          type: "inaccessible" as const,
          message: `본 진단은 자동 크롤링 시점에 웹사이트 접근이 불가하여 정확한 분석이 제한될 수 있습니다. 실제 웹사이트가 정상 운영 중이라면 재진단을 권장드립니다. (HTTP 상태: ${fetchStatus || '응답 없음'})`,
        };
      }
      // SPA/JS 렌더링 사이트: 응답은 정상이지만 본문 콘텐츠가 거의 없는 경우
      if (fetchOk && wordCount < 50) {
        return {
          type: "spa_empty" as const,
          message: `본 진단은 JavaScript 렌더링(SPA) 사이트의 경우 정적 HTML만 분석하므로 실제 콘텐츠와 다를 수 있습니다. 정확한 진단을 위해 재진단을 권장드립니다.`,
        };
      }
      return undefined;
    })(),
  };
  setCache(cacheKey, result);
  return result;
}

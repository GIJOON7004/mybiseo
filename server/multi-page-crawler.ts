/**
 * Multi-Page Crawler — 메인 페이지에서 내부 링크 + sitemap.xml을 수집하여
 * 중요 서브페이지를 자동 선별하고 병렬 크롤링하는 모듈
 *
 * 63차 수정: 다중 페이지 크롤링으로 SEO 진단 정확도 향상
 */
import * as cheerio from "cheerio";

// ── 타입 정의 ──
export interface SubPageData {
  url: string;
  html: string;
  $: cheerio.CheerioAPI;
  bodyText: string;
  title: string;
  /** 페이지 유형 (의료진, FAQ, 서비스, 연락처, 다국어 등) */
  pageType: string;
}

export interface MultiPageResult {
  /** 크롤링된 서브페이지 데이터 */
  subPages: SubPageData[];
  /** 종합 데이터 — 서브페이지에서 발견된 추가 정보 */
  aggregated: AggregatedData;
}

export interface AggregatedData {
  /** 전체 사이트에서 발견된 FAQ 콘텐츠 여부 */
  hasFaqContent: boolean;
  /** 전체 사이트에서 발견된 FAQ 스키마 여부 */
  hasFaqSchema: boolean;
  /** 전체 사이트에서 발견된 의료진 정보 여부 */
  hasDoctorInfo: boolean;
  /** 전체 사이트에서 발견된 의료진 자격 정보 여부 */
  hasDoctorCredentials: boolean;
  /** 전체 사이트에서 발견된 자격/경력 정보 여부 (credentials) */
  hasCredentials: boolean;
  /** 전체 사이트에서 발견된 진료시간 정보 여부 */
  hasOpeningHours: boolean;
  /** 전체 사이트에서 발견된 JSON-LD 타입들 (중복 제거) */
  allJsonLdTypes: string[];
  /** 전체 사이트에서 발견된 다국어 경로들 */
  multiLangPaths: string[];
  /** 전체 사이트에서 발견된 hreflang 태그 수 */
  totalHreflangTags: number;
  /** 전체 사이트 이미지 수 */
  totalImages: number;
  /** 전체 사이트 alt 있는 이미지 수 */
  totalImagesWithAlt: number;
  /** 전체 사이트 내부 링크 수 */
  totalInternalLinks: number;
  /** 전체 사이트 외부 링크 수 */
  totalExternalLinks: number;
  /** 전체 사이트에서 발견된 전화번호 링크 여부 */
  hasTelLink: boolean;
  /** 전체 사이트에서 발견된 이메일 링크 여부 */
  hasEmailLink: boolean;
  /** 전체 사이트에서 발견된 주소 정보 여부 */
  hasAddress: boolean;
  /** 전체 사이트에서 발견된 지도 임베드 여부 */
  hasMap: boolean;
  /** 전체 사이트에서 발견된 개인정보처리방침 여부 */
  hasPrivacyPolicy: boolean;
  /** 전체 사이트에서 발견된 이용약관 여부 */
  hasTerms: boolean;
  /** 전체 사이트에서 발견된 전후사진 여부 */
  hasBeforeAfter: boolean;
  /** 전체 사이트에서 발견된 리뷰/후기 여부 */
  hasReviews: boolean;
  /** 전체 사이트에서 발견된 예약 시스템 여부 */
  hasBookingSystem: boolean;
  /** 전체 사이트에서 발견된 비용/가격 정보 여부 */
  hasPriceInfo: boolean;
  /** 전체 사이트에서 발견된 해외 환자 전용 페이지 여부 */
  hasIntlPatientPage: boolean;
  /** 크롤링된 서브페이지 수 */
  subPageCount: number;
  /** 크롤링된 서브페이지 URL 목록 */
  crawledUrls: string[];
}

// ── 병원 사이트 중요 페이지 패턴 ──
const PRIORITY_PATTERNS: { pattern: RegExp; pageType: string; priority: number }[] = [
  // 의료진/원장 페이지 (최고 우선순위)
  { pattern: /\/(doctor|staff|team|physician|surgeon|about-us|원장|의료진|소개)/i, pageType: "의료진", priority: 10 },
  // FAQ 페이지
  { pattern: /\/(faq|frequently|자주|질문|문의)/i, pageType: "FAQ", priority: 9 },
  // 서비스/진료과 페이지
  { pattern: /\/(service|treatment|procedure|surgery|시술|진료|수술|클리닉)/i, pageType: "서비스", priority: 8 },
  // 전후사진/갤러리
  { pattern: /\/(before|after|gallery|result|portfolio|전후|사진|갤러리|사례)/i, pageType: "전후사진", priority: 7 },
  // 후기/리뷰
  { pattern: /\/(review|testimonial|후기|리뷰|체험)/i, pageType: "후기", priority: 7 },
  // 연락처/오시는 길
  { pattern: /\/(contact|location|direction|map|access|연락|오시는|위치|찾아)/i, pageType: "연락처", priority: 6 },
  // 비용/가격
  { pattern: /\/(price|cost|fee|pricing|비용|가격|요금)/i, pageType: "비용", priority: 6 },
  // 예약
  { pattern: /\/(book|appointment|reservation|예약|상담)/i, pageType: "예약", priority: 5 },
  // 다국어 페이지
  { pattern: /^\/(en|th|zh|ja|ko|vi|ru)(\/|$)/i, pageType: "다국어", priority: 8 },
  // 해외 환자
  { pattern: /\/(international|global|foreign|overseas|해외|외국)/i, pageType: "해외환자", priority: 8 },
  // 개인정보/이용약관
  { pattern: /\/(privacy|policy|terms|legal|개인정보|이용약관|약관)/i, pageType: "법적정보", priority: 4 },
  // 블로그/뉴스
  { pattern: /\/(blog|news|notice|공지|블로그|뉴스|소식)/i, pageType: "블로그", priority: 3 },
];

const MAX_SUB_PAGES = 8;
const CRAWL_TIMEOUT = 4000;

// (#4) 서브페이지 타임아웃 개별 관리
const PAGE_TYPE_TIMEOUTS: Record<string, number> = {
  "의료진 소개": 6000,    // 이미지 많음
  "진료 안내": 6000,     // 콘텐츠 많음
  "전후 사진": 8000,     // 대용량 이미지
  "리뷰/후기": 5000,    // 동적 로딩 가능성
  "예약": 5000,          // 외부 스크립트 로딩
  "가격/비용": 4000,
  "오시는 길": 4000,
  "기타": 4000,
};

function getTimeoutForPageType(pageType: string): number {
  return PAGE_TYPE_TIMEOUTS[pageType] || CRAWL_TIMEOUT;
}

// ── #1 필수 페이지 직접 탐색: 병원 사이트에 반드시 존재해야 할 URL 패턴 ──
const MUST_HAVE_PATHS = [
  "/doctor", "/team", "/about", "/contact", "/price",
  "/staff", "/physicians", "/location", "/directions",
  "/의료진", "/소개", "/오시는길", "/진료비", "/비용",
];

// ── #8 User-Agent 표준화: Googlebot Mobile User-Agent 고정 ──
const STANDARD_USER_AGENT = "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.175 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const STANDARD_ACCEPT_LANGUAGE_KR = "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7";
const STANDARD_ACCEPT_LANGUAGE_TH = "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7";

// ── 유틸 ──
function getAcceptLanguage(country: string): string {
  switch (country) {
    case "th": return STANDARD_ACCEPT_LANGUAGE_TH;
    default: return STANDARD_ACCEPT_LANGUAGE_KR;
  }
}

async function fetchPage(url: string, timeout = CRAWL_TIMEOUT, country = "kr"): Promise<string | null> {
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
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── 내부 링크 수집 ──
function collectInternalLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links = new Set<string>();
  const parsedBase = new URL(baseUrl);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let absoluteUrl: string;
    try {
      if (href.startsWith("http")) {
        absoluteUrl = href;
      } else if (href.startsWith("//")) {
        absoluteUrl = `${parsedBase.protocol}${href}`;
      } else if (href.startsWith("/")) {
        absoluteUrl = `${parsedBase.protocol}//${parsedBase.host}${href}`;
      } else {
        absoluteUrl = `${parsedBase.protocol}//${parsedBase.host}/${href}`;
      }

      const parsed = new URL(absoluteUrl);
      // 같은 도메인만
      if (parsed.host !== parsedBase.host) return;
      // 파일 확장자 제외 (이미지, PDF 등)
      if (/\.(jpg|jpeg|png|gif|svg|pdf|doc|docx|xls|xlsx|zip|mp4|mp3|css|js)$/i.test(parsed.pathname)) return;
      // 해시/쿼리 제거
      parsed.hash = "";
      // 정규화
      const normalized = parsed.toString().replace(/\/+$/, "") || parsed.origin;
      links.add(normalized);
    } catch {
      // 잘못된 URL 무시
    }
  });

  return Array.from(links);
}

// ── sitemap.xml에서 URL 추출 ──
async function parseSitemap(baseUrl: string, country = "kr"): Promise<string[]> {
  const urls: string[] = [];
  const sitemapUrls = [`${baseUrl}/sitemap.xml`];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const html = await fetchPage(sitemapUrl, 3000, country);
      if (!html) continue;

      // sitemap index인 경우 — 하위 sitemap URL 수집 (1단계만)
      if (html.includes("<sitemapindex")) {
        const $ = cheerio.load(html, { xmlMode: true });
        $("sitemap > loc").each((_, el) => {
          const loc = $(el).text().trim();
          if (loc && !sitemapUrls.includes(loc)) sitemapUrls.push(loc);
        });
        continue;
      }

      // 일반 sitemap — URL 추출
      if (html.includes("<urlset")) {
        const $ = cheerio.load(html, { xmlMode: true });
        $("url > loc").each((_, el) => {
          const loc = $(el).text().trim();
          if (loc) urls.push(loc);
        });
      }
    } catch {
      // sitemap 파싱 실패 무시
    }
  }

  return urls;
}

// ── 중요 페이지 자동 선별 ──
function selectPriorityPages(allUrls: string[], baseUrl: string, mainUrl: string): { url: string; pageType: string; priority: number }[] {
  const parsedBase = new URL(baseUrl);
  const mainNormalized = mainUrl.replace(/\/+$/, "");

  const scored: { url: string; pageType: string; priority: number }[] = [];

  for (const url of allUrls) {
    const normalized = url.replace(/\/+$/, "");
    // 메인 페이지 제외
    if (normalized === mainNormalized || normalized === parsedBase.origin) continue;

    try {
      const parsed = new URL(url);
      // 같은 도메인만
      if (parsed.host !== parsedBase.host) continue;
      const pathname = parsed.pathname;

      // 패턴 매칭
      let matched = false;
      for (const { pattern, pageType, priority } of PRIORITY_PATTERNS) {
        if (pattern.test(pathname)) {
          scored.push({ url: normalized, pageType, priority });
          matched = true;
          break;
        }
      }

      // 매칭 안 되는 페이지도 depth 1이면 포함 (낮은 우선순위)
      if (!matched) {
        const depth = pathname.split("/").filter(Boolean).length;
        if (depth <= 2) {
          scored.push({ url: normalized, pageType: "기타", priority: 1 });
        }
      }
    } catch {
      // 잘못된 URL 무시
    }
  }

  // 중복 제거 (URL 기준)
  const seen = new Set<string>();
  const unique = scored.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  // 우선순위 내림차순 정렬 → 상위 MAX_SUB_PAGES개 선택
  // 단, 같은 pageType은 최대 2개까지만 (다양성 확보)
  unique.sort((a, b) => b.priority - a.priority);
  const typeCount: Record<string, number> = {};
  const selected: typeof unique = [];

  for (const item of unique) {
    if (selected.length >= MAX_SUB_PAGES) break;
    const count = typeCount[item.pageType] || 0;
    if (count >= 2) continue;
    typeCount[item.pageType] = count + 1;
    selected.push(item);
  }

  return selected;
}

// ── 서브페이지 데이터 분석 ──
function analyzeSubPage(url: string, html: string, pageType: string): SubPageData {
  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const title = $("title").text().trim();
  return { url, html, $, bodyText, title, pageType };
}

// ── 종합 데이터 집계 ──
function aggregateData(mainHtml: string, main$: cheerio.CheerioAPI, mainBodyText: string, baseUrl: string, subPages: SubPageData[], country: string): AggregatedData {
  // 메인 페이지 기본값
  let hasFaqContent = false;
  let hasFaqSchema = false;
  let hasDoctorInfo = false;
  let hasDoctorCredentials = false;
  let hasCredentials = false;
  let hasOpeningHours = false;
  const allJsonLdTypes = new Set<string>();
  const multiLangPaths: string[] = [];
  let totalHreflangTags = 0;
  let totalImages = 0;
  let totalImagesWithAlt = 0;
  let totalInternalLinks = 0;
  let totalExternalLinks = 0;
  let hasTelLink = false;
  let hasEmailLink = false;
  let hasAddress = false;
  let hasMap = false;
  let hasPrivacyPolicy = false;
  let hasTerms = false;
  let hasBeforeAfter = false;
  let hasReviews = false;
  let hasBookingSystem = false;
  let hasPriceInfo = false;
  let hasIntlPatientPage = false;

  // 모든 페이지 (메인 + 서브) 분석
  const allPages: { $: cheerio.CheerioAPI; html: string; bodyText: string; pageType: string }[] = [
    { $: main$, html: mainHtml, bodyText: mainBodyText, pageType: "메인" },
    ...subPages.map(sp => ({ $: sp.$, html: sp.html, bodyText: sp.bodyText, pageType: sp.pageType })),
  ];

  for (const page of allPages) {
    const { $, html, bodyText, pageType } = page;

    // FAQ 감지
    const pageFaqSchema = html.includes('"FAQPage"') || html.includes("'FAQPage'");
    const pageFaqContent = $("dt").length > 0 || $("details").length > 0 || $("[itemtype*='Question']").length > 0
      || bodyText.includes("자주 묻는 질문") || bodyText.includes("FAQ") || bodyText.includes("frequently asked");
    if (pageFaqSchema) hasFaqSchema = true;
    if (pageFaqContent) hasFaqContent = true;

    // 의료진 정보 감지
    const pageDoctorInfo = bodyText.includes("원장") || bodyText.includes("의료진") || bodyText.includes("전문의")
      || bodyText.includes("doctor") || bodyText.includes("surgeon") || bodyText.includes("physician")
      || $('[itemtype*="Physician"]').length > 0 || $('[itemtype*="Person"]').length > 0;
    const pageDoctorCredentials = bodyText.includes("전문의") || bodyText.includes("학력") || bodyText.includes("경력")
      || bodyText.includes("board certified") || bodyText.includes("qualification") || bodyText.includes("fellowship")
      || bodyText.includes("M.D.") || bodyText.includes("Ph.D.");
    if (pageDoctorInfo) hasDoctorInfo = true;
    if (pageDoctorCredentials) { hasDoctorCredentials = true; hasCredentials = true; }

    // 진료시간 정보 감지
    const openingHoursPatterns = country === "th"
      ? ["openingHours", "opening hours", "business hours", "clinic hours", "\u0E40\u0E27\u0E25\u0E32\u0E17\u0E33\u0E01\u0E32\u0E23", "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E1B\u0E34\u0E14"]
      : ["openingHours", "\uc9c4\ub8cc\uc2dc\uac04", "\uc601\uc5c5\uc2dc\uac04"];
    if (openingHoursPatterns.some(p => html.includes(p)) || $('[itemprop="openingHours"]').length > 0) hasOpeningHours = true;

    // JSON-LD 타입 수집
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}");
        if (data["@type"]) allJsonLdTypes.add(data["@type"]);
        if (Array.isArray(data["@graph"])) {
          data["@graph"].forEach((item: any) => {
            if (item["@type"]) allJsonLdTypes.add(item["@type"]);
          });
        }
      } catch { /* ignored */ }
    });

    // hreflang 태그
    totalHreflangTags += $('link[rel="alternate"][hreflang]').length;

    // 이미지 통계
    const imgs = $("img");
    totalImages += imgs.length;
    imgs.each((_, el) => { if ($(el).attr("alt")?.trim()) totalImagesWithAlt++; });

    // 링크 통계
    const links = $("a[href]");
    links.each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.startsWith("/") || href.startsWith(baseUrl)) totalInternalLinks++;
      else if (href.startsWith("http")) totalExternalLinks++;
    });

    // 연락처 정보
    if ($('a[href^="tel:"]').length > 0) hasTelLink = true;
    if ($('a[href^="mailto:"]').length > 0) hasEmailLink = true;
    if ($("address").length > 0 || $('[itemprop="address"]').length > 0) hasAddress = true;
    if (country === "th") {
      if (html.includes("maps.google") || html.includes("google.com/maps") || $("iframe[src*='google.com/maps']").length > 0 || $("iframe[src*='map']").length > 0) hasMap = true;
    } else {
      if (html.includes("map.naver.com") || html.includes("maps.google") || html.includes("kakaomap") || $("iframe[src*='map']").length > 0) hasMap = true;
    }

    // 법적 정보
    if (country === "th") {
      if (html.includes("privacy") || html.includes("Privacy") || html.includes("PDPA") || html.includes("data protection")) hasPrivacyPolicy = true;
      if (html.includes("terms") || html.includes("Terms") || html.includes("conditions")) hasTerms = true;
    } else {
      if (html.includes("개인정보") || html.includes("privacy")) hasPrivacyPolicy = true;
      if (html.includes("이용약관") || html.includes("terms")) hasTerms = true;
    }

    // 전후사진
    if (html.includes("before") && html.includes("after") || html.includes("전후") || html.includes("비포") || html.includes("에프터")
      || $("img[alt*='before']").length > 0 || $("img[alt*='after']").length > 0 || $("img[alt*='전후']").length > 0) {
      hasBeforeAfter = true;
    }

    // 후기/리뷰
    if (html.includes("review") || html.includes("testimonial") || html.includes("후기") || html.includes("리뷰") || html.includes("체험담")
      || $('[itemtype*="Review"]').length > 0) {
      hasReviews = true;
    }

    // 예약 시스템
    if (html.includes("booking") || html.includes("appointment") || html.includes("예약") || html.includes("상담 신청")
      || $("form").filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes("예약") || text.includes("book") || text.includes("appointment");
      }).length > 0) {
      hasBookingSystem = true;
    }

    // 비용/가격 정보
    if (html.includes("price") || html.includes("cost") || html.includes("fee") || html.includes("비용") || html.includes("가격")
      || html.includes("요금") || html.includes("฿") || html.includes("THB") || html.includes("₩")) {
      hasPriceInfo = true;
    }

    // 해외 환자 전용 페이지
    if (pageType === "해외환자" || html.includes("international patient") || html.includes("foreign patient")
      || html.includes("해외 환자") || html.includes("외국인 환자") || $("a[href*='international']").length > 0) {
      hasIntlPatientPage = true;
    }

    // 다국어 경로 감지
    if (pageType === "다국어") {
      try {
        const parsed = new URL(page === allPages[0] ? baseUrl : subPages[allPages.indexOf(page) - 1]?.url || "");
        const langMatch = parsed.pathname.match(/^\/(en|th|zh|ja|ko|vi|ru)(\/|$)/i);
        if (langMatch && !multiLangPaths.includes(langMatch[1].toLowerCase())) {
          multiLangPaths.push(langMatch[1].toLowerCase());
        }
      } catch { /* ignored */ }
    }
  }

  return {
    hasFaqContent,
    hasFaqSchema,
    hasDoctorInfo,
    hasDoctorCredentials,
    hasCredentials,
    hasOpeningHours,
    allJsonLdTypes: Array.from(allJsonLdTypes),
    multiLangPaths,
    totalHreflangTags,
    totalImages,
    totalImagesWithAlt,
    totalInternalLinks,
    totalExternalLinks,
    hasTelLink,
    hasEmailLink,
    hasAddress,
    hasMap,
    hasPrivacyPolicy,
    hasTerms,
    hasBeforeAfter,
    hasReviews,
    hasBookingSystem,
    hasPriceInfo,
    hasIntlPatientPage,
    subPageCount: subPages.length,
    crawledUrls: subPages.map(sp => sp.url),
  };
}

// ── 메인 함수: 다중 페이지 크롤링 ──
export async function crawlSubPages(
  mainUrl: string,
  mainHtml: string,
  main$: cheerio.CheerioAPI,
  mainBodyText: string,
  baseUrl: string,
  country = "kr",
): Promise<MultiPageResult> {
  // 1. 내부 링크 수집 (메인 페이지에서)
  const internalLinks = collectInternalLinks(main$, baseUrl);

  // 2. sitemap.xml에서 URL 추출
  const sitemapUrls = await parseSitemap(baseUrl, country);

  // 2.5. (#1) 필수 페이지 직접 탐색 — 링크/sitemap에 없어도 직접 시도
  const mustHaveUrls: string[] = [];
  for (const path of MUST_HAVE_PATHS) {
    const candidateUrl = `${baseUrl}${path}`;
    mustHaveUrls.push(candidateUrl);
  }

  // 3. 전체 URL 합치기 (중복 제거) — 필수 페이지 포함
  const allUrlSet = new Set([...internalLinks, ...sitemapUrls, ...mustHaveUrls]);
  const allUrls = Array.from(allUrlSet);

  // 4. 중요 페이지 자동 선별
  const priorityPages = selectPriorityPages(allUrls, baseUrl, mainUrl);

  if (priorityPages.length === 0) {
    return {
      subPages: [],
      aggregated: aggregateData(mainHtml, main$, mainBodyText, baseUrl, [], country),
    };
  }

  // 5. 병렬 크롤링 (최대 4개 동시)
  const CONCURRENCY = 4;
  const subPages: SubPageData[] = [];

  for (let i = 0; i < priorityPages.length; i += CONCURRENCY) {
    const batch = priorityPages.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async ({ url, pageType }) => {
        const html = await fetchPage(url, getTimeoutForPageType(pageType), country);
        if (!html) return null;
        return analyzeSubPage(url, html, pageType);
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        subPages.push(r.value);
      }
    }
  }

  // 6. 종합 데이터 집계
  const aggregated = aggregateData(mainHtml, main$, mainBodyText, baseUrl, subPages, country);

  return { subPages, aggregated };
}

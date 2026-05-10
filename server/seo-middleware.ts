/**
 * SEO Middleware — Phase B 강화 + F-4 보완
 * 1. AI 크롤러 감지 및 사전 렌더링 HTML 반환 (JSON-LD 9종 포함)
 * 2. 크롤러 방문 DB 로깅 (fire-and-forget)
 * 3. 동적 sitemap.xml 생성
 * 4. robots.txt + llms.txt 서빙
 * 5. 서비스 상세 페이지 메타데이터 완비
 */
import type { Express, Request, Response, NextFunction } from "express";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { createLogger } from "./lib/logger";
import { APP_BASE_URL } from "../shared/const";

const logger = createLogger("seo-middleware");

// ── 기본 URL (shared/const.ts APP_BASE_URL 사용) ──
const BASE_URL = APP_BASE_URL;
const DEFAULT_OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663438971958/PAet9MTkZYRHY348QbWGBd/og-image-wide-VCu4Vf9EQTnQ4LcR8dKRrM.png";

// ── AI 크롤러 User-Agent 패턴 ──
const AI_CRAWLER_PATTERNS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "Anthropic",
  "CCBot",
  "Bytespider",
  "Cohere-ai",
  "Meta-ExternalAgent",
  "Applebot-Extended",
  "YouBot",
  // 2025 추가 AI 크롤러
  "DeepSeekBot",
  "GrokBot",
  "Kakaotalk-Bot",
  "kakaotalk-scrap",
  "NaverBot",
  "AdsBot-Naver",
  // 소셜 미디어 크롤러 (링크 프리뷰)
  "Twitterbot",
  "facebookexternalhit",
  "Slackbot",
  "Discordbot",
  "LinkedInBot",
];

// 일반 검색 크롤러
const SEARCH_CRAWLER_PATTERNS = [
  "Googlebot",
  "Yeti", // Naver
  "bingbot",
  "DuckDuckBot",
  "Baiduspider",
  "Sogou",
];

function isAICrawler(userAgent: string): boolean {
  return AI_CRAWLER_PATTERNS.some(pattern =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isSearchCrawler(userAgent: string): boolean {
  return SEARCH_CRAWLER_PATTERNS.some(pattern =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isCrawler(userAgent: string): boolean {
  return isAICrawler(userAgent) || isSearchCrawler(userAgent);
}

/** 크롤러 이름 감지 */
function detectCrawlerName(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();
  for (const pattern of AI_CRAWLER_PATTERNS) {
    if (ua.includes(pattern.toLowerCase())) return pattern;
  }
  for (const pattern of SEARCH_CRAWLER_PATTERNS) {
    if (ua.includes(pattern.toLowerCase())) return pattern;
  }
  return null;
}

/** 비동기 크롤러 방문 로깅 (fire-and-forget) */
async function logCrawlerVisit(crawlerName: string, path: string, userAgent: string, ip: string): Promise<void> {
  try {
    const database = await getDb();
    if (!database) return;
    await database.execute(
      sql`INSERT INTO ai_crawler_visits (crawler_name, path, user_agent, ip) VALUES (${crawlerName}, ${path.slice(0, 500)}, ${userAgent.slice(0, 2000)}, ${ip.slice(0, 45)})`
    );
  } catch {
    // 로깅 실패는 무시 — 크롤러 응답에 영향 주지 않음
  }
}

// ── JSON-LD 스키마 정의 ──

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "마이비서(MY비서)",
  "alternateName": ["MY비서", "마이비서", "mybiseo"],
  "url": BASE_URL,
  "logo": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663332229201/TJrRNFlbiSIVajBz.jpg",
  "description": "병원 전용 AI 마케팅 에이전시. 5대 AI 엔진 검색 최적화, 다국어 의료관광 환자 유치, 24시간 AI 환자 응대.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "가락로 114, 신우빌딩 6층 601-6호",
    "addressLocality": "송파구",
    "addressRegion": "서울특별시",
    "postalCode": "05765",
    "addressCountry": "KR",
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+82-10-7321-7004",
    "contactType": "customer service",
    "email": "cjw7004@naver.com",
    "availableLanguage": ["Korean", "English"],
  },
  "sameAs": [
    "https://blog.naver.com/cjw7004",
    "https://pf.kakao.com/mybiseo",
    "https://www.instagram.com/mybiseo_official",
    "https://www.youtube.com/@mybiseo",
  ],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "마이비서(MY비서)",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BASE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MY비서 AI 가시성 진단",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": `${BASE_URL}/ai-check`,
  "description": "병원 웹사이트의 AI 검색 노출 현황을 100개 이상 항목으로 진단합니다.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW",
    "description": "무료 AI 가시성 진단",
  },
  "provider": { "@type": "Organization", "name": "마이비서(MY비서)", "url": BASE_URL },
};

const PROFESSIONAL_SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "마이비서(MY비서) — 병원 AI 마케팅",
  "url": BASE_URL,
  "description": "병원 전용 AI 마케팅 에이전시. AI 검색 가시성 측정·최적화, 온라인 평판 방어, 콘텐츠 자동화.",
  "areaServed": { "@type": "Country", "name": "KR" },
  "serviceType": ["AI Search Optimization", "Hospital Marketing", "Online Reputation Management"],
  "provider": { "@type": "Organization", "name": "마이비서(MY비서)", "url": BASE_URL },
};

function makeServiceSchema(name: string, desc: string, serviceType: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": desc,
    "url": `${BASE_URL}${path}`,
    "serviceType": serviceType,
    "areaServed": { "@type": "Country", "name": "KR" },
    "provider": { "@type": "Organization", "name": "마이비서(MY비서)", "url": BASE_URL },
  };
}

const SERVICE_VISIBILITY = makeServiceSchema(
  "AI 가시성 최적화 (AEO/GEO)",
  "ChatGPT, Gemini, Claude, Perplexity 등 AI 검색 엔진에서 병원이 추천되도록 최적화하는 서비스입니다.",
  "AI Search Engine Optimization",
  "/services/visibility",
);

const SERVICE_REPUTATION = makeServiceSchema(
  "병원 평판 방어 시스템",
  "네이버, 구글, 카카오맵 등 주요 플랫폼의 병원 리뷰를 24시간 모니터링하고, 부정적 리뷰에 대한 대응 전략을 수립합니다.",
  "Online Reputation Management",
  "/services/reputation",
);

const SERVICE_LEARNING = makeServiceSchema(
  "AI 학습 허브 (병원 AI 교육)",
  "병원 원장님과 스태프가 AI 시대에 대비할 수 있도록 맞춤형 학습 콘텐츠와 워크샵을 제공합니다.",
  "Professional Training",
  "/services/learning-hub",
);

const SERVICE_WEBSITE = makeServiceSchema(
  "Smart Website Platform",
  "AI 크롤러가 읽기 쉬운 구조, Schema 마크업, llms.txt 자동 생성 등 AI 시대에 최적화된 병원 웹사이트를 구축합니다.",
  "Web Development",
  "/services/website",
);

const SERVICE_COMMUNICATION = makeServiceSchema(
  "Patient Communication Hub",
  "AI 챗봇, 스마트 예약, 노쇼 방지 리마인더, 환자 CRM으로 병원 환자 소통을 완전 자동화합니다.",
  "Patient Communication Automation",
  "/services/communication",
);

function makeBreadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": `${BASE_URL}${item.path}`,
    })),
  };
}

// ── 페이지별 메타데이터 정의 ──
interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object[];
}

function getPageMeta(path: string): PageMeta {
  // 공통 JSON-LD (모든 페이지에 포함)
  const commonLd = [ORG_SCHEMA, WEBSITE_SCHEMA];

  const pages: Record<string, PageMeta> = {
    "/": {
      title: "마이비서(MY비서) | 병원 AI 마케팅 — AI 검색 최적화, 환자 유치, 콘텐츠 자동화",
      description: "병원 전용 AI 마케팅 에이전시. ChatGPT, Gemini, Claude 등 AI 검색에서 병원이 추천되도록 최적화합니다. AI 가시성 진단, 평판 방어, 콘텐츠 자동화, 웹사이트 구축까지.",
      canonical: `${BASE_URL}/`,
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: [
        ...commonLd,
        PROFESSIONAL_SERVICE_SCHEMA,
        makeBreadcrumb([
          { name: "홈", path: "/" },
          { name: "AI 가시성 진단", path: "/ai-check" },
          { name: "블로그", path: "/blog" },
          { name: "AI 학습 허브", path: "/ai-hub" },
        ]),
      ],
    },
    "/ai-check": {
      title: "무료 AI 가시성 진단 | MY비서 — 병원 웹사이트 AI 검색 노출 점검",
      description: "병원 웹사이트가 ChatGPT, Gemini, Perplexity에서 추천되고 있는지 무료로 진단합니다. 100개 이상 항목 분석, 경쟁 병원 비교, PDF 리포트 제공.",
      canonical: `${BASE_URL}/ai-check`,
      jsonLd: [...commonLd, SOFTWARE_SCHEMA, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "AI 가시성 진단", path: "/ai-check" }])],
    },
    "/ai-blog-trial": {
      title: "AI 블로그 체험 | MY비서 — 진료과별 SEO 블로그 자동 생성",
      description: "진료과와 주제를 입력하면 AI가 SEO 최적화된 병원 블로그 초안을 즉시 생성합니다. 무료 체험.",
      canonical: `${BASE_URL}/ai-blog-trial`,
      jsonLd: [...commonLd, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "AI 블로그 체험", path: "/ai-blog-trial" }])],
    },
    "/blog": {
      title: "병원 마케팅 블로그 | MY비서 — AI 시대 의료 마케팅 인사이트",
      description: "AI 검색 최적화, 병원 SEO, 의료 마케팅 트렌드, 환자 유치 전략 등 병원 경영에 도움되는 전문 콘텐츠.",
      canonical: `${BASE_URL}/blog`,
      jsonLd: [...commonLd, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "블로그", path: "/blog" }])],
    },
    "/content-factory": {
      title: "AI 콘텐츠 팩토리 | MY비서 — 병원 콘텐츠 자동 생성",
      description: "블로그, SNS, 시술 안내, 카드뉴스까지 AI가 병원 맞춤 콘텐츠를 자동으로 생성합니다.",
      canonical: `${BASE_URL}/content-factory`,
      jsonLd: [...commonLd, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "콘텐츠 팩토리", path: "/content-factory" }])],
    },
    "/ai-hub": {
      title: "AI 학습 허브 | MY비서 — 병원 AI 마케팅 학습 센터",
      description: "AI 검색 최적화, GEO 전략, 구조화 데이터 등 병원이 AI 시대에 대비하기 위한 학습 콘텐츠.",
      canonical: `${BASE_URL}/ai-hub`,
      jsonLd: [...commonLd, SERVICE_LEARNING, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "AI 학습 허브", path: "/ai-hub" }])],
    },
    "/privacy": {
      title: "개인정보처리방침 | MY비서",
      description: "마이비서(MY비서)의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보유 기간 등을 안내합니다.",
      canonical: `${BASE_URL}/privacy`,
      jsonLd: commonLd,
    },
    "/awards": {
      title: "월간 AI 마케팅 어워드 | MY비서",
      description: "매월 AI 검색 노출 성과가 우수한 병원을 선정하여 발표합니다.",
      canonical: `${BASE_URL}/awards`,
      jsonLd: [...commonLd, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "어워드", path: "/awards" }])],
    },
    // ── 서비스 상세 페이지 ──
    "/services/visibility": {
      title: "AI Visibility Engine | MY비서 — AI 검색 가시성 측정·최적화",
      description: "ChatGPT, Gemini, Perplexity 등 AI 검색에서 병원이 추천되는지 측정하고, GEO 전략으로 AI 노출을 극대화합니다.",
      canonical: `${BASE_URL}/services/visibility`,
      jsonLd: [...commonLd, SERVICE_VISIBILITY, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "서비스", path: "/services/visibility" }, { name: "AI Visibility Engine", path: "/services/visibility" }])],
    },
    "/services/reputation": {
      title: "Reputation Defense System | MY비서 — 병원 온라인 평판 방어",
      description: "부정 리뷰 실시간 감지, AI 기반 대응 전략 수립, 긍정 리뷰 유도 시스템으로 병원 평판을 보호합니다.",
      canonical: `${BASE_URL}/services/reputation`,
      jsonLd: [...commonLd, SERVICE_REPUTATION, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "서비스", path: "/services/reputation" }, { name: "Reputation Defense", path: "/services/reputation" }])],
    },
    "/services/learning-hub": {
      title: "AI Learning Hub | MY비서 — AI가 학습하는 병원 콘텐츠 제작",
      description: "AI가 병원 정보를 정확히 학습할 수 있도록 구조화된 Knowledge Base를 구축합니다.",
      canonical: `${BASE_URL}/services/learning-hub`,
      jsonLd: [...commonLd, SERVICE_LEARNING, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "서비스", path: "/services/learning-hub" }, { name: "AI Learning Hub", path: "/services/learning-hub" }])],
    },
    "/services/website": {
      title: "Smart Website Platform | MY비서 — AI 크롤러 최적화 병원 웹사이트",
      description: "AI 크롤러가 읽기 쉬운 구조, Schema 마크업, llms.txt 자동 생성 등 AI 시대에 최적화된 병원 웹사이트를 구축합니다.",
      canonical: `${BASE_URL}/services/website`,
      jsonLd: [...commonLd, SERVICE_WEBSITE, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "서비스", path: "/services/website" }, { name: "Smart Website", path: "/services/website" }])],
    },
    "/services/communication": {
      title: "Patient Communication Hub | MY비서 — 환자 소통 자동화",
      description: "AI 챗봇, 스마트 예약, 노쇼 방지 리마인더, 환자 CRM으로 병원 환자 소통을 완전 자동화합니다.",
      canonical: `${BASE_URL}/services/communication`,
      jsonLd: [...commonLd, SERVICE_COMMUNICATION, makeBreadcrumb([{ name: "홈", path: "/" }, { name: "서비스", path: "/services/communication" }, { name: "Communication Hub", path: "/services/communication" }])],
    },
  };

  return pages[path] || {
    title: "마이비서(MY비서) | 병원 AI 마케팅",
    description: "병원 전용 AI 마케팅 에이전시. AI 검색 최적화, 환자 유치, 콘텐츠 자동화.",
    canonical: `${BASE_URL}${path}`,
    jsonLd: commonLd,
  };
}

/**
 * AI 크롤러용 사전 렌더링 HTML 생성
 */
function generatePrerenderedHtml(meta: PageMeta): string {
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
  const jsonLdTags = meta.jsonLd
    ? meta.jsonLd.map(ld => `  <script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n")
    : "";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${meta.canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:url" content="${meta.canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:locale" content="ko_KR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${meta.title}" />
  <meta name="twitter:description" content="${meta.description}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="alternate" hreflang="ko" href="${meta.canonical}" />
  <link rel="alternate" hreflang="x-default" href="${meta.canonical}" />
${jsonLdTags}
</head>
<body>
  <h1>${meta.title}</h1>
  <p>${meta.description}</p>
  <nav>
    <a href="${BASE_URL}/">홈</a>
    <a href="${BASE_URL}/ai-check">AI 가시성 진단</a>
    <a href="${BASE_URL}/services/visibility">AI Visibility Engine</a>
    <a href="${BASE_URL}/services/reputation">Reputation Defense</a>
    <a href="${BASE_URL}/services/learning-hub">AI Learning Hub</a>
    <a href="${BASE_URL}/services/website">Smart Website</a>
    <a href="${BASE_URL}/services/communication">Communication Hub</a>
    <a href="${BASE_URL}/blog">블로그</a>
    <a href="${BASE_URL}/ai-hub">AI 학습 허브</a>
    <a href="${BASE_URL}/privacy">개인정보처리방침</a>
  </nav>
  <footer>
    <p>AI-readable content available at: <a href="${BASE_URL}/llms.txt">${BASE_URL}/llms.txt</a></p>
  </footer>
</body>
</html>`;
}

/**
 * 동적 sitemap.xml 생성
 */
async function generateSitemap(): Promise<string> {
  const now = new Date().toISOString().split("T")[0];

  // 정적 페이지
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/ai-check", priority: "0.9", changefreq: "weekly" },
    { loc: "/ai-blog-trial", priority: "0.8", changefreq: "weekly" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
    { loc: "/content-factory", priority: "0.7", changefreq: "weekly" },
    { loc: "/ai-hub", priority: "0.7", changefreq: "weekly" },
    { loc: "/awards", priority: "0.6", changefreq: "monthly" },
    { loc: "/seo-history", priority: "0.6", changefreq: "weekly" },
    { loc: "/services/visibility", priority: "0.8", changefreq: "monthly" },
    { loc: "/services/reputation", priority: "0.8", changefreq: "monthly" },
    { loc: "/services/learning-hub", priority: "0.8", changefreq: "monthly" },
    { loc: "/services/website", priority: "0.7", changefreq: "monthly" },
    { loc: "/services/communication", priority: "0.7", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  ];

  // 블로그 카테고리
  const categories = [
    "plastic-surgery", "dermatology", "dentistry",
    "korean-medicine", "ophthalmology", "hospital-marketing",
  ];

  // DB에서 블로그 포스트 가져오기 (최근 200개)
  let blogPosts: { slug: string; updatedAt: string }[] = [];
  try {
    const database = await getDb();
    if (!database) throw new Error("DB not available");
    const result = await database.execute(
      `SELECT slug, updated_at as updatedAt FROM blog_posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 200`
    ) as any;
    blogPosts = (Array.isArray(result) ? result[0] : result) as any[];
  } catch {
    // DB 에러 시 빈 배열
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // 정적 페이지
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // 블로그 카테고리
  for (const cat of categories) {
    xml += `  <url>
    <loc>${BASE_URL}/blog/category/${cat}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // 블로그 포스트
  for (const post of blogPosts) {
    const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString().split("T")[0] : now;
    xml += `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * SEO 미들웨어 등록
 */
export function registerSeoMiddleware(app: Express): void {
  // 동적 sitemap.xml
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const sitemap = await generateSitemap();
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1시간 캐시
      res.send(sitemap);
    } catch (err) {
      logger.error("Sitemap generation error", { error: String(err) });
      res.status(500).send("Sitemap generation failed");
    }
  });

  // robots.txt (동적 — llms.txt 참조 추가)
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`# MY비서 — ${BASE_URL}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# AI 크롤러 허용
User-agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /api/

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: DeepSeekBot
Allow: /

User-agent: GrokBot
Allow: /

User-agent: Kakaotalk-Bot
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml

# AI-readable structured content
# See: ${BASE_URL}/llms.txt
`);
  });

  // AI 크롤러 감지 미들웨어 — HTML 페이지 요청에만 적용
  app.use((req: Request, res: Response, next: NextFunction) => {
    // API, 정적 파일, 에셋 요청은 스킵
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/manus-storage/") ||
      req.path.startsWith("/src/") ||
      req.path.startsWith("/@") ||
      req.path.includes(".") // 파일 확장자가 있는 요청 스킵
    ) {
      return next();
    }

    const ua = req.headers["user-agent"] || "";
    const crawlerName = detectCrawlerName(ua);

    // AI 크롤러인 경우 사전 렌더링 HTML 반환 + 방문 로깅
    if (crawlerName && isAICrawler(ua)) {
      const meta = getPageMeta(req.path);
      const html = generatePrerenderedHtml(meta);
      // fire-and-forget 로깅
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
      logCrawlerVisit(crawlerName, req.path, ua, clientIp);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Prerendered", "ai-crawler");
      res.setHeader("X-Crawler-Detected", crawlerName);
      return res.send(html);
    }

    // 일반 검색 크롤러도 로깅 (사전 렌더링은 하지 않음)
    if (crawlerName && isSearchCrawler(ua)) {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
      logCrawlerVisit(crawlerName, req.path, ua, clientIp);
    }

    next();
  });
}

// Export for testing
export { isAICrawler, isSearchCrawler, isCrawler, detectCrawlerName, getPageMeta, AI_CRAWLER_PATTERNS, SEARCH_CRAWLER_PATTERNS };

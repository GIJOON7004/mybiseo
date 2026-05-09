/**
 * SEO Middleware — Phase 0 기술 기반
 * 1. AI 크롤러 감지 및 사전 렌더링 HTML 반환
 * 2. 동적 sitemap.xml 생성
 * 3. llms.txt 서빙 (public에서 직접 서빙되지만 fallback)
 */
import type { Express, Request, Response, NextFunction } from "express";
import { getDb } from "./db";

// AI 크롤러 User-Agent 패턴
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
];

// 일반 검색 크롤러
const SEARCH_CRAWLER_PATTERNS = [
  "Googlebot",
  "Yeti", // Naver
  "bingbot",
  "DuckDuckBot",
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

// 페이지별 메타데이터 정의
interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object[];
}

function getPageMeta(path: string): PageMeta {
  const base = "https://mybiseo.com";
  const defaultOgImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663438971958/PAet9MTkZYRHY348QbWGBd/og-image-wide-VCu4Vf9EQTnQ4LcR8dKRrM.png";

  const pages: Record<string, PageMeta> = {
    "/": {
      title: "마이비서(MY비서) | 병원 AI 마케팅 — AI 검색 최적화, 환자 유치, 콘텐츠 자동화",
      description: "병원 전용 AI 마케팅 에이전시. ChatGPT, Gemini, Claude 등 AI 검색에서 병원이 추천되도록 최적화합니다. AI 가시성 진단, 평판 방어, 콘텐츠 자동화, 웹사이트 구축까지.",
      canonical: base + "/",
      ogImage: defaultOgImage,
    },
    "/ai-check": {
      title: "무료 AI 가시성 진단 | MY비서 — 병원 웹사이트 AI 검색 노출 점검",
      description: "병원 웹사이트가 ChatGPT, Gemini, Perplexity에서 추천되고 있는지 무료로 진단합니다. 100개 이상 항목 분석, 경쟁 병원 비교, PDF 리포트 제공.",
      canonical: base + "/ai-check",
    },
    "/ai-blog-trial": {
      title: "AI 블로그 체험 | MY비서 — 진료과별 SEO 블로그 자동 생성",
      description: "진료과와 주제를 입력하면 AI가 SEO 최적화된 병원 블로그 초안을 즉시 생성합니다. 무료 체험.",
      canonical: base + "/ai-blog-trial",
    },
    "/blog": {
      title: "병원 마케팅 블로그 | MY비서 — AI 시대 의료 마케팅 인사이트",
      description: "AI 검색 최적화, 병원 SEO, 의료 마케팅 트렌드, 환자 유치 전략 등 병원 경영에 도움되는 전문 콘텐츠.",
      canonical: base + "/blog",
    },
    "/content-factory": {
      title: "AI 콘텐츠 팩토리 | MY비서 — 병원 콘텐츠 자동 생성",
      description: "블로그, SNS, 시술 안내, 카드뉴스까지 AI가 병원 맞춤 콘텐츠를 자동으로 생성합니다.",
      canonical: base + "/content-factory",
    },
    "/ai-hub": {
      title: "AI 학습 허브 | MY비서 — 병원 AI 마케팅 학습 센터",
      description: "AI 검색 최적화, GEO 전략, 구조화 데이터 등 병원이 AI 시대에 대비하기 위한 학습 콘텐츠.",
      canonical: base + "/ai-hub",
    },
    "/privacy": {
      title: "개인정보처리방침 | MY비서",
      description: "마이비서(MY비서)의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보유 기간 등을 안내합니다.",
      canonical: base + "/privacy",
    },
    "/awards": {
      title: "월간 AI 마케팅 어워드 | MY비서",
      description: "매월 AI 검색 노출 성과가 우수한 병원을 선정하여 발표합니다.",
      canonical: base + "/awards",
    },
  };

  return pages[path] || {
    title: "마이비서(MY비서) | 병원 AI 마케팅",
    description: "병원 전용 AI 마케팅 에이전시. AI 검색 최적화, 환자 유치, 콘텐츠 자동화.",
    canonical: base + path,
  };
}

/**
 * AI 크롤러용 사전 렌더링 HTML 생성
 */
function generatePrerenderedHtml(meta: PageMeta): string {
  const ogImage = meta.ogImage || "https://d2xsxph8kpxj0f.cloudfront.net/310519663438971958/PAet9MTkZYRHY348QbWGBd/og-image-wide-VCu4Vf9EQTnQ4LcR8dKRrM.png";

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
  ${meta.jsonLd ? meta.jsonLd.map(ld => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n  ") : ""}
</head>
<body>
  <h1>${meta.title}</h1>
  <p>${meta.description}</p>
  <nav>
    <a href="https://mybiseo.com/">홈</a>
    <a href="https://mybiseo.com/ai-check">AI 가시성 진단</a>
    <a href="https://mybiseo.com/blog">블로그</a>
    <a href="https://mybiseo.com/ai-hub">AI 학습 허브</a>
    <a href="https://mybiseo.com/privacy">개인정보처리방침</a>
  </nav>
</body>
</html>`;
}

/**
 * 동적 sitemap.xml 생성
 */
async function generateSitemap(): Promise<string> {
  const base = "https://mybiseo.com";
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
    <loc>${base}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // 블로그 카테고리
  for (const cat of categories) {
    xml += `  <url>
    <loc>${base}/blog/category/${cat}</loc>
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
    <loc>${base}/blog/${post.slug}</loc>
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
      console.error("[SEO] Sitemap generation error:", err);
      res.status(500).send("Sitemap generation failed");
    }
  });

  // robots.txt (동적 — llms.txt 참조 추가)
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`# MY비서 — https://mybiseo.com
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

Sitemap: https://mybiseo.com/sitemap.xml
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

    // AI 크롤러인 경우 사전 렌더링 HTML 반환
    if (isAICrawler(ua)) {
      const meta = getPageMeta(req.path);
      const html = generatePrerenderedHtml(meta);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Prerendered", "ai-crawler");
      return res.send(html);
    }

    next();
  });
}

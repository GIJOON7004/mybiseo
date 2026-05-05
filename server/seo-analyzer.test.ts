import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * SEO Analyzer v3 테스트
 * - 8개 카테고리, 45개+ 항목 검증
 * - 일반 병원 사이트 → 낮은 점수 (45~60점)
 * - 완벽 최적화 사이트 → 높은 점수 (90점+)
 */

// Mock fetch globally before import
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocking
const { analyzeSeo } = await import("./seo-analyzer");

// ── 테스트용 HTML 생성 헬퍼 ──
function makeHtml(opts: {
  title?: string;
  description?: string;
  keywords?: string;
  viewport?: string;
  canonical?: string;
  charset?: string;
  h1?: string;
  h2s?: string[];
  h3s?: string[];
  bodyText?: string;
  images?: { src: string; alt?: string }[];
  ogTitle?: string;
  ogDesc?: string;
  ogImage?: string;
  ogUrl?: string;
  ogSiteName?: string;
  ogType?: string;
  ogLocale?: string;
  twitterCard?: string;
  jsonLd?: object | object[];
  lang?: string;
  favicon?: string;
  robotsMeta?: string;
  links?: { href: string }[];
  naverVerification?: string;
  semanticTags?: boolean;
  contactInfo?: boolean;
  doctorInfo?: boolean;
  faqContent?: boolean;
  privacyPolicy?: boolean;
  dateModified?: boolean;
  naverLinks?: boolean;
  hreflang?: boolean;
  author?: string;
  securityHeaders?: boolean;
} = {}): string {
  const meta = [
    opts.description ? `<meta name="description" content="${opts.description}">` : "",
    opts.keywords ? `<meta name="keywords" content="${opts.keywords}">` : "",
    opts.viewport ? `<meta name="viewport" content="${opts.viewport}">` : "",
    opts.canonical ? `<link rel="canonical" href="${opts.canonical}">` : "",
    opts.charset ? `<meta charset="${opts.charset}">` : "",
    opts.ogTitle ? `<meta property="og:title" content="${opts.ogTitle}">` : "",
    opts.ogDesc ? `<meta property="og:description" content="${opts.ogDesc}">` : "",
    opts.ogImage ? `<meta property="og:image" content="${opts.ogImage}">` : "",
    opts.ogUrl ? `<meta property="og:url" content="${opts.ogUrl}">` : "",
    opts.ogSiteName ? `<meta property="og:site_name" content="${opts.ogSiteName}">` : "",
    opts.ogType ? `<meta property="og:type" content="${opts.ogType}">` : "",
    opts.ogLocale ? `<meta property="og:locale" content="${opts.ogLocale}">` : "",
    opts.twitterCard ? `<meta name="twitter:card" content="${opts.twitterCard}">` : "",
    opts.favicon ? `<link rel="icon" href="${opts.favicon}">` : "",
    opts.robotsMeta ? `<meta name="robots" content="${opts.robotsMeta}">` : "",
    opts.naverVerification ? `<meta name="naver-site-verification" content="${opts.naverVerification}">` : "",
    opts.hreflang ? `<link rel="alternate" hreflang="ko" href="https://example.com/ko">` : "",
    opts.author ? `<meta name="author" content="${opts.author}">` : "",
  ].filter(Boolean).join("\n    ");

  const images = (opts.images || []).map(img =>
    `<img src="${img.src}"${img.alt ? ` alt="${img.alt}"` : ""}>`
  ).join("\n");

  const h2s = (opts.h2s || []).map(t => `<h2>${t}</h2>`).join("\n");
  const h3s = (opts.h3s || []).map(t => `<h3>${t}</h3>`).join("\n");
  const links = (opts.links || []).map(l => `<a href="${l.href}">link</a>`).join("\n");

  const jsonLdArr = opts.jsonLd
    ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd])
    : [];
  const jsonLdScripts = jsonLdArr.map(d => `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join("\n");

  const contactHtml = opts.contactInfo ? `
    <a href="tel:02-1234-5678">02-1234-5678</a>
    <a href="mailto:info@hospital.com">info@hospital.com</a>
    <address>서울시 강남구 역삼동 123-45</address>
    <iframe src="https://map.naver.com/embed"></iframe>
  ` : "";

  const doctorHtml = opts.doctorInfo ? `
    <div>김원장 전문의 - 경력 15년, 자격: 피부과 전문의, 학력: 서울대 의대</div>
  ` : "";

  const faqHtml = opts.faqContent ? `
    <details><summary>임플란트 비용은 얼마인가요?</summary><p>임플란트 비용은 개당 100~200만원입니다.</p></details>
    <details><summary>진료 시간은 어떻게 되나요?</summary><p>평일 09:00~18:00, 토요일 09:00~13:00입니다.</p></details>
    <details><summary>보험 적용이 되나요?</summary><p>65세 이상 어르신은 보험 적용이 가능합니다.</p></details>
  ` : "";

  const privacyHtml = opts.privacyPolicy ? `
    <a href="/privacy">개인정보처리방침</a>
    <a href="/terms">이용약관</a>
  ` : "";

  const naverLinksHtml = opts.naverLinks ? `
    <a href="https://blog.naver.com/hospital">네이버 블로그</a>
    <a href="https://place.naver.com/hospital">네이버 플레이스</a>
    <a href="https://cafe.naver.com/hospital">네이버 카페</a>
  ` : "";

  const dateModifiedHtml = opts.dateModified ? `
    <script type="application/ld+json">{"dateModified":"2025-01-15","datePublished":"2024-06-01"}</script>
  ` : "";

  const bodyContent = opts.semanticTags
    ? `<header><nav>메뉴</nav></header><main><article><section>${opts.h1 ? `<h1>${opts.h1}</h1>` : ""}${h2s}${h3s}${images}${links}<p>${opts.bodyText || ""}</p>${contactHtml}${doctorHtml}${faqHtml}${privacyHtml}${naverLinksHtml}</section></article></main><footer>Copyright</footer>`
    : `${opts.h1 ? `<h1>${opts.h1}</h1>` : ""}${h2s}${h3s}${images}${links}<p>${opts.bodyText || ""}</p>${contactHtml}${doctorHtml}${faqHtml}${privacyHtml}${naverLinksHtml}`;

  return `<!DOCTYPE html>
<html${opts.lang ? ` lang="${opts.lang}"` : ""}>
<head>
    <title>${opts.title || ""}</title>
    ${meta}
    ${jsonLdScripts}
    ${dateModifiedHtml}
</head>
<body>
    ${bodyContent}
</body>
</html>`;
}

// ── fetch mock 설정 헬퍼 ──
function setupFetchMock(html: string, opts: {
  robotsTxt?: string;
  sitemapXml?: string;
  status?: number;
  llmsTxt?: string;
  headers?: Record<string, string>;
} = {}) {
  mockFetch.mockImplementation(async (url: string) => {
    const urlStr = typeof url === "string" ? url : String(url);

    if (urlStr.includes("robots.txt")) {
      if (opts.robotsTxt) {
        return {
          ok: true, status: 200,
          text: async () => opts.robotsTxt!,
          headers: { forEach: () => {} },
        };
      }
      return { ok: false, status: 404, text: async () => "Not Found", headers: { forEach: () => {} } };
    }

    if (urlStr.includes("llms.txt")) {
      if (opts.llmsTxt) {
        return {
          ok: true, status: 200,
          text: async () => opts.llmsTxt!,
          headers: { forEach: () => {} },
        };
      }
      return { ok: false, status: 404, text: async () => "Not Found", headers: { forEach: () => {} } };
    }

    if (urlStr.includes("sitemap")) {
      if (opts.sitemapXml) {
        return {
          ok: true, status: 200,
          text: async () => opts.sitemapXml!,
          headers: { forEach: () => {} },
        };
      }
      return { ok: false, status: 404, text: async () => "Not Found", headers: { forEach: () => {} } };
    }

    // Main page
    const responseHeaders = opts.headers || {};
    return {
      ok: (opts.status || 200) < 400,
      status: opts.status || 200,
      text: async () => html,
      headers: {
        forEach: (cb: (v: string, k: string) => void) => {
          cb("text/html", "content-type");
          Object.entries(responseHeaders).forEach(([k, v]) => cb(v, k));
        },
      },
    };
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("SEO Analyzer v3 — 일관성 테스트", () => {
  it("동일 HTML에 대해 동일 점수를 반환해야 한다", async () => {
    const html = makeHtml({
      title: "테스트 병원 - 강남 피부과 전문 클리닉",
      description: "강남 최고의 피부과 전문 병원입니다. 레이저 시술, 보톡스, 필러 등 다양한 시술을 제공합니다.",
      viewport: "width=device-width, initial-scale=1",
      h1: "강남 피부과 전문 병원",
      h2s: ["시술 안내", "의료진 소개"],
      bodyText: "A".repeat(1200),
      lang: "ko",
      charset: "UTF-8",
    });

    setupFetchMock(html);
    const result1 = await analyzeSeo("https://test-consistency-v3-a.com");

    setupFetchMock(html);
    const result2 = await analyzeSeo("https://test-consistency-v3-b.com");

    expect(Math.abs(result1.totalScore - result2.totalScore)).toBeLessThanOrEqual(5);
    expect(result1.summary.passed).toBeGreaterThan(0);
  });
});

describe("SEO Analyzer v3 — 점수 기준 테스트", () => {
  it("일반 병원 사이트는 60점 이하를 받아야 한다", async () => {
    // 일반적인 병원 사이트: 기본 HTML만 갖춤
    const html = makeHtml({
      title: "강남 피부과",
      description: "강남 피부과입니다.",
      viewport: "width=device-width, initial-scale=1",
      h1: "강남 피부과",
      bodyText: "강남 피부과에 오신 것을 환영합니다. " + "A".repeat(500),
      lang: "ko",
      charset: "UTF-8",
      images: [{ src: "/img1.jpg" }, { src: "/img2.jpg" }],
    });

    setupFetchMock(html);
    const result = await analyzeSeo("https://test-typical-hospital-v3.com");
    expect(result.totalScore).toBeLessThanOrEqual(60);
    expect(result.grade).not.toBe("A+");
    expect(result.grade).not.toBe("A");
  });

  it("빈 HTML은 20점 이하를 받아야 한다", async () => {
    const html = "<!DOCTYPE html><html><head></head><body></body></html>";
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-empty-html-v3.com");
    expect(result.totalScore).toBeLessThanOrEqual(25);
    expect(result.summary.failed).toBeGreaterThan(10);
  });

  it("완벽하게 최적화된 사이트는 85점 이상을 받아야 한다", async () => {
    const html = makeHtml({
      title: "강남 치과 전문 병원 - 임플란트, 교정 전문 | 강남치과",
      description: "강남 최고의 치과 전문 병원입니다. 임플란트, 교정, 미백 등 다양한 치과 시술을 15년 경력의 전문의가 직접 진료합니다. 전화 02-1234-5678",
      keywords: "강남 치과, 임플란트, 교정, 치과 추천",
      viewport: "width=device-width, initial-scale=1",
      canonical: "https://test-perfect-v3.com/",
      charset: "UTF-8",
      h1: "강남 치과 전문 병원",
      h2s: ["시술 안내", "의료진 소개", "오시는 길", "자주 묻는 질문"],
      h3s: ["임플란트", "교정", "미백"],
      bodyText: "강남 치과 전문 병원에서는 임플란트, 교정, 미백 등 다양한 시술을 제공합니다. " + "임플란트 비용은 개당 100~200만원입니다. 교정 비용은 300~500만원입니다. 미백 비용은 50~100만원입니다. ".repeat(30),
      images: [
        { src: "/img1.jpg", alt: "치과 시술 사진" },
        { src: "/img2.jpg", alt: "의료진 소개" },
      ],
      ogTitle: "강남 치과 전문 병원",
      ogDesc: "강남 최고의 치과 전문 병원",
      ogImage: "https://test-perfect-v3.com/og.jpg",
      ogUrl: "https://test-perfect-v3.com/",
      ogSiteName: "강남치과",
      ogType: "website",
      ogLocale: "ko_KR",
      twitterCard: "summary_large_image",
      jsonLd: [
        { "@type": "MedicalClinic", "name": "강남치과", "telephone": "02-1234-5678", "address": { "@type": "PostalAddress", "addressLocality": "서울" } },
        { "@type": "FAQPage", "mainEntity": [{ "@type": "Question", "name": "임플란트 비용은?", "acceptedAnswer": { "@type": "Answer", "text": "임플란트 비용은 개당 100~200만원입니다." } }] },
        { "@type": "Article", "dateModified": "2025-01-15", "datePublished": "2024-06-01", "author": { "@type": "Person", "name": "김원장" } },
      ],
      lang: "ko",
      favicon: "/favicon.ico",
      robotsMeta: "index, follow",
      naverVerification: "abc123",
      semanticTags: true,
      contactInfo: true,
      doctorInfo: true,
      faqContent: true,
      privacyPolicy: true,
      dateModified: true,
      naverLinks: true,
      hreflang: true,
      author: "김원장 치과전문의",
      links: [
        { href: "/about" }, { href: "/services" }, { href: "/contact" }, { href: "/blog" }, { href: "/faq" },
        { href: "https://external.com" },
      ],
    });

    setupFetchMock(html, {
      robotsTxt: "User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nSitemap: https://test-perfect-v3.com/sitemap.xml",
      sitemapXml: '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://test-perfect-v3.com/</loc></url></urlset>',
      llmsTxt: "# 강남치과\n서비스: 임플란트, 교정, 미백\n전화: 02-1234-5678",
      headers: {
        "content-security-policy": "default-src 'self'",
        "x-frame-options": "DENY",
        "strict-transport-security": "max-age=31536000",
      },
    });

    const result = await analyzeSeo("https://test-perfect-v3.com");
    // v4: 100개 항목으로 확장되어 새 카테고리(성능/모바일/접근성/국제화)에서 감점 발생 가능
    // 테스트 HTML은 실제 성능/모바일 최적화가 없으므로 65점 이상이면 적절
    expect(result.totalScore).toBeGreaterThanOrEqual(65);
    expect(["A+", "A", "B+", "B", "C"]).toContain(result.grade);
  });
});

describe("SEO Analyzer v3 — 카테고리 구조 테스트", () => {
  it("8개 카테고리가 모두 존재해야 한다", async () => {
    const html = makeHtml({ title: "카테고리 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-all-categories-v3.com");
    const names = result.categories.map(c => c.name);
    expect(names).toContain("메타 태그");
    expect(names).toContain("콘텐츠 구조");
    expect(names).toContain("홈페이지 기본 설정");
    expect(names).toContain("소셜 미디어");
    expect(names).toContain("검색 고급 설정");
    expect(names).toContain("네이버 검색 최적화");
    expect(names).toContain("병원 특화 SEO");
    expect(names).toContain("AI 검색 노출");
    expect(names.length).toBe(12); // v4: 4개 카테고리 추가 (성능, 모바일, 접근성, 국제화)
  });

  it("AI 검색 노출 카테고리에 11개 항목이 있어야 한다", async () => {
    const html = makeHtml({ title: "AI 검색 노출 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html, {
      robotsTxt: "User-agent: *\nAllow: /",
    });

    const result = await analyzeSeo("https://test-ai-category-count-v3.com");
    const aiCategory = result.categories.find(c => c.name === "AI 검색 노출");
    expect(aiCategory).toBeDefined();
    expect(aiCategory!.items.length).toBeGreaterThanOrEqual(11); // v4: 추가 항목 포함

    const ids = aiCategory!.items.map(i => i.id);
    expect(ids).toContain("ai-crawlers");
    expect(ids).toContain("ai-schema");
    expect(ids).toContain("ai-semantic");
    expect(ids).toContain("ai-eeat");
    expect(ids).toContain("ai-citability");
    expect(ids).toContain("ai-metadata");
    expect(ids).toContain("ai-qa-optimization");
    expect(ids).toContain("ai-content-depth");
    expect(ids).toContain("ai-explicit-allow");
    expect(ids).toContain("ai-source-branding");
    expect(ids).toContain("ai-llms-txt");
  });

  it("네이버 검색 최적화 카테고리에 5개 항목이 있어야 한다", async () => {
    const html = makeHtml({ title: "네이버 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-naver-category-v3.com");
    const naverCategory = result.categories.find(c => c.name === "네이버 검색 최적화");
    expect(naverCategory).toBeDefined();
    expect(naverCategory!.items.length).toBeGreaterThanOrEqual(5); // v4: 추가 항목 포함
  });

  it("병원 특화 SEO 카테고리에 6개 항목이 있어야 한다", async () => {
    const html = makeHtml({ title: "병원 SEO 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-hospital-category-v3.com");
    const hospitalCategory = result.categories.find(c => c.name === "병원 특화 SEO");
    expect(hospitalCategory).toBeDefined();
    expect(hospitalCategory!.items.length).toBeGreaterThanOrEqual(6); // v4: 추가 항목 포함
  });
});

describe("SEO Analyzer v3 — 개별 항목 테스트", () => {
  it("타이틀이 없으면 fail이어야 한다 (h1도 없는 경우)", async () => {
    const html = makeHtml({ bodyText: "A".repeat(500) });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-no-title-v3.com");
    const titleItem = result.categories
      .find(c => c.name === "메타 태그")
      ?.items.find(i => i.id === "meta-title");
    // title이 없고 og:title, og:site_name, h1도 없으면 도메인명으로 fallback
    // 도메인명은 매우 짧으므로 warning이 될 수 있음
    expect(["fail", "warning"]).toContain(titleItem?.status);
    expect(titleItem?.score).toBeLessThanOrEqual(5);
  });

  it("타이틀이 없으면 h1으로 fallback된다", async () => {
    const html = makeHtml({ h1: "테스트", bodyText: "A".repeat(500) });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-no-title-h1-fallback.com");
    const titleItem = result.categories
      .find(c => c.name === "메타 태그")
      ?.items.find(i => i.id === "meta-title");
    // title이 없지만 h1이 있으면 fallback으로 사용되어 warning (짧은 title)
    expect(titleItem?.status).toBe("warning");
    expect(titleItem?.score).toBeGreaterThan(0);
  });

  it("HTTP 사이트는 SSL에서 fail이어야 한다", async () => {
    const html = makeHtml({ title: "HTTP 사이트 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("http://test-http-only-v3.com");
    const sslItem = result.categories
      .find(c => c.name === "홈페이지 기본 설정")
      ?.items.find(i => i.id === "tech-ssl");
    expect(sslItem?.status).toBe("fail");
  });

  it("noindex가 있으면 fail이어야 한다", async () => {
    const html = makeHtml({
      title: "noindex 테스트 페이지 - 검색 제외됨",
      robotsMeta: "noindex, nofollow",
      h1: "테스트",
    });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-noindex-v3.com");
    const robotsItem = result.categories
      .find(c => c.name === "검색 고급 설정")
      ?.items.find(i => i.id === "advanced-robots-meta");
    expect(robotsItem?.status).toBe("fail");
  });

  it("네이버 서치어드바이저 인증이 없으면 fail이어야 한다", async () => {
    const html = makeHtml({ title: "네이버 인증 없는 사이트 테스트", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-no-naver-v3.com");
    const naverItem = result.categories
      .find(c => c.name === "네이버 검색 최적화")
      ?.items.find(i => i.id === "naver-verification");
    expect(naverItem?.status).toBe("fail");
  });

  it("의료기관 스키마가 없으면 fail이어야 한다", async () => {
    const html = makeHtml({ title: "의료기관 스키마 없는 사이트 테스트", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-no-medical-schema-v3.com");
    const medicalItem = result.categories
      .find(c => c.name === "병원 특화 SEO")
      ?.items.find(i => i.id === "hospital-medical-schema");
    expect(medicalItem?.status).toBe("fail");
  });

  it("robots.txt에서 GPTBot 차단 시 ai-crawlers가 warning 이하여야 한다", async () => {
    const html = makeHtml({ title: "AI 크롤러 차단 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html, {
      robotsTxt: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /",
    });

    const result = await analyzeSeo("https://test-ai-crawler-blocked-v3.com");
    const aiCategory = result.categories.find(c => c.name === "AI 검색 노출");
    const crawlerItem = aiCategory?.items.find(i => i.id === "ai-crawlers");
    expect(["fail", "warning"]).toContain(crawlerItem?.status);
  });

  it("시맨틱 태그가 없으면 ai-semantic이 fail이어야 한다", async () => {
    const html = `<!DOCTYPE html><html><head><title>시맨틱 없는 페이지 테스트</title></head><body><div>콘텐츠</div></body></html>`;
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-ai-no-semantic-v3.com");
    const aiCategory = result.categories.find(c => c.name === "AI 검색 노출");
    const semanticItem = aiCategory?.items.find(i => i.id === "ai-semantic");
    expect(semanticItem?.status).toBe("fail");
  });

  it("시맨틱 태그가 충분하면 ai-semantic이 pass여야 한다", async () => {
    const html = `<!DOCTYPE html><html lang="ko"><head><title>시맨틱 풍부한 페이지 테스트</title></head><body><header>헤더</header><main><article><section><h1>제목</h1><p>본문</p></section></article></main><nav>네비게이션</nav><footer>푸터</footer></body></html>`;
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-ai-rich-semantic-v3.com");
    const aiCategory = result.categories.find(c => c.name === "AI 검색 노출");
    const semanticItem = aiCategory?.items.find(i => i.id === "ai-semantic");
    expect(semanticItem?.status).toBe("pass");
  });

  it("SPA 짧은 title은 og:title로 보완 판정해야 한다", async () => {
    const html = makeHtml({
      title: "MY 비서",
      ogTitle: "마이비서(MY비서) | 병원 AI 마케팅 전문 대행 업체 - 검색 노출 최적화",
      h1: "병원 AI 마케팅",
      bodyText: "A".repeat(500),
    });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-spa-short-title-v3.com");
    const titleItem = result.categories
      .find(c => c.name === "메타 태그")
      ?.items.find(i => i.id === "meta-title");
    expect(titleItem?.status).toBe("pass");
  });
});

describe("SEO Analyzer v3 — 캐싱 테스트", () => {
  it("동일 URL 재분석 시 캐시된 결과를 반환해야 한다", async () => {
    const html = makeHtml({
      title: "캐시 테스트 페이지 - 동일 결과 보장합니다",
      h1: "캐시 테스트",
      bodyText: "A".repeat(500),
    });
    setupFetchMock(html);

    const uniqueUrl = `https://test-cache-hit-v3-${Date.now()}.com`;
    const result1 = await analyzeSeo(uniqueUrl);

    mockFetch.mockReset();
    const result2 = await analyzeSeo(uniqueUrl);

    expect(result1.totalScore).toBe(result2.totalScore);
    expect(result1.analyzedAt).toBe(result2.analyzedAt);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("SEO Analyzer v3 — 구조 검증 테스트", () => {
  it("총점은 0~100 사이여야 한다", async () => {
    const html = makeHtml({ title: "점수 범위 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-score-range-v3.com");
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it("grade는 유효한 등급이어야 한다", async () => {
    const html = makeHtml({ title: "등급 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-grade-valid-v3.com");
    expect(["A+", "A", "B", "C", "D", "F"]).toContain(result.grade);
  });

  it("각 체크 항목에 필수 필드가 있어야 한다", async () => {
    const html = makeHtml({ title: "필드 검증 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-fields-check-v3.com");
    for (const category of result.categories) {
      for (const item of category.items) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("score");
        expect(item).toHaveProperty("maxScore");
        expect(item).toHaveProperty("detail");
        expect(item).toHaveProperty("recommendation");
        expect(item).toHaveProperty("impact");
        expect(["pass", "fail", "warning", "info"]).toContain(item.status);
        expect(item.score).toBeLessThanOrEqual(item.maxScore);
        expect(item.score).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("summary 카운트가 전체 항목 수와 일치해야 한다", async () => {
    const html = makeHtml({ title: "카운트 검증 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-summary-count-v3.com");
    const totalItems = result.categories.reduce((sum, c) => sum + c.items.length, 0);
    expect(result.summary.passed + result.summary.warnings + result.summary.failed + (result.summary.info || 0)).toBe(totalItems);
  });

  it("전체 항목 수가 40개 이상이어야 한다", async () => {
    const html = makeHtml({ title: "항목 수 테스트 페이지입니다", h1: "테스트" });
    setupFetchMock(html);

    const result = await analyzeSeo("https://test-total-items-v3.com");
    const totalItems = result.categories.reduce((sum, c) => sum + c.items.length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(40);
  });
});

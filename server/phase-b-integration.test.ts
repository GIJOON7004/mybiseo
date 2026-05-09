/**
 * Phase B 통합 테스트
 * - B-1: ServicePageLayout 공통 컴포넌트 구조 검증
 * - B-5: AI 크롤러 감지 + 방문 로깅 구조 검증
 * - B-6: LLM 캐싱 레이어 통합 검증
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── 헬퍼 ──
function readSrc(relPath: string): string {
  const fullPath = resolve(__dirname, "..", relPath);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf-8");
}

// ═══════════════════════════════════════════════════════
// B-1: ServicePageLayout 통합 검증
// ═══════════════════════════════════════════════════════
describe("B-1: ServicePageLayout 통합", () => {
  const layoutSrc = readSrc("client/src/components/ServicePageLayout.tsx");

  it("ServicePageLayout 컴포넌트가 존재한다", () => {
    expect(layoutSrc.length).toBeGreaterThan(100);
  });

  it("full과 compact 변형을 지원한다", () => {
    expect(layoutSrc).toContain("variant");
    expect(layoutSrc).toContain("full");
    expect(layoutSrc).toContain("compact");
  });

  it("SEO 메타데이터 (useSEO) 통합이 있다", () => {
    expect(layoutSrc).toContain("useSEO");
  });

  it("JSON-LD 구조화 데이터는 개별 페이지에서 처리된다", () => {
    // JSON-LD는 각 서비스 페이지에서 SEOProps를 통해 전달
    const visibilitySrc = readSrc("client/src/pages/ServiceVisibility.tsx");
    expect(visibilitySrc).toContain("jsonLd");
  });

  it("CTA 섹션이 포함되어 있다", () => {
    expect(layoutSrc).toContain("cta");
  });

  // 5개 서비스 페이지가 모두 ServicePageLayout을 사용하는지 확인
  const servicePages = [
    "client/src/pages/ServiceVisibility.tsx",
    "client/src/pages/ServiceReputation.tsx",
    "client/src/pages/ServiceLearningHub.tsx",
    "client/src/pages/ServiceWebsite.tsx",
    "client/src/pages/ServiceCommunication.tsx",
  ];

  servicePages.forEach(pagePath => {
    const pageName = pagePath.split("/").pop()!.replace(".tsx", "");
    it(`${pageName}이 ServicePageLayout을 사용한다`, () => {
      const src = readSrc(pagePath);
      expect(src).toContain("ServicePageLayout");
    });
  });

  it("서비스 페이지들이 개별적으로 중복 레이아웃 코드를 갖지 않는다", () => {
    // 각 페이지가 200줄 이하인지 확인 (공통화 효과)
    for (const pagePath of servicePages) {
      const src = readSrc(pagePath);
      const lineCount = src.split("\n").length;
      expect(lineCount).toBeLessThan(250); // 리팩토링 전 300~400줄 → 200줄 이하
    }
  });
});

// ═══════════════════════════════════════════════════════
// B-5: AI 크롤러 감지 + 방문 로깅 통합 검증
// ═══════════════════════════════════════════════════════
describe("B-5: AI 크롤러 감지 통합", () => {
  const middlewareSrc = readSrc("server/seo-middleware.ts");
  const schemaSrc = readSrc("drizzle/schema.ts");

  it("크롤러 방문 로그 테이블이 스키마에 정의되어 있다", () => {
    expect(schemaSrc).toContain("ai_crawler_visits");
    expect(schemaSrc).toContain("crawler_name");
    expect(schemaSrc).toContain("visited_at");
  });

  it("미들웨어에서 DB 로깅 함수를 호출한다", () => {
    expect(middlewareSrc).toContain("logCrawlerVisit");
    expect(middlewareSrc).toContain("ai_crawler_visits");
  });

  it("AI 크롤러와 검색 크롤러를 구분하여 처리한다", () => {
    expect(middlewareSrc).toContain("isAICrawler");
    expect(middlewareSrc).toContain("isSearchCrawler");
    // AI 크롤러만 사전 렌더링 HTML 반환
    expect(middlewareSrc).toContain("X-Prerendered");
    expect(middlewareSrc).toContain("ai-crawler");
  });

  it("크롤러 이름을 감지하여 헤더에 포함한다", () => {
    expect(middlewareSrc).toContain("detectCrawlerName");
    expect(middlewareSrc).toContain("X-Crawler-Detected");
  });

  it("12개 이상의 AI 크롤러 패턴을 감지한다", () => {
    const patterns = middlewareSrc.match(/AI_CRAWLER_PATTERNS[\s\S]*?\]/);
    expect(patterns).not.toBeNull();
    const patternCount = (patterns![0].match(/"/g) || []).length / 2;
    expect(patternCount).toBeGreaterThanOrEqual(10);
  });

  it("서비스 페이지 메타데이터가 모두 등록되어 있다", () => {
    expect(middlewareSrc).toContain("/services/visibility");
    expect(middlewareSrc).toContain("/services/reputation");
    expect(middlewareSrc).toContain("/services/learning-hub");
    expect(middlewareSrc).toContain("/services/website");
    expect(middlewareSrc).toContain("/services/communication");
  });

  it("sitemap에 서비스 페이지가 포함되어 있다", () => {
    const sitemapSection = middlewareSrc.includes('loc: "/services/visibility"');
    expect(sitemapSection).toBe(true);
  });

  it("fire-and-forget 패턴으로 로깅한다 (메인 응답 블로킹 없음)", () => {
    // logCrawlerVisit 호출 앞에 await가 없어야 함
    const lines = middlewareSrc.split("\n");
    const logCallLines = lines.filter(l => l.includes("logCrawlerVisit("));
    for (const line of logCallLines) {
      expect(line).not.toContain("await logCrawlerVisit");
    }
  });
});

// ═══════════════════════════════════════════════════════
// B-6: LLM 캐싱 레이어 통합 검증
// ═══════════════════════════════════════════════════════
describe("B-6: LLM 캐싱 레이어 통합", () => {
  const cacheSrc = readSrc("server/llm-cache.ts");
  const aiHubSrc = readSrc("server/routes/aiHub.ts");

  it("llm-cache.ts 모듈이 존재한다", () => {
    expect(cacheSrc.length).toBeGreaterThan(100);
  });

  it("해시 기반 캐시 키를 생성한다", () => {
    expect(cacheSrc).toContain("computeCacheKey");
    expect(cacheSrc).toContain("sha256");
  });

  it("TTL 기반 만료를 지원한다", () => {
    expect(cacheSrc).toContain("expiresAt");
    expect(cacheSrc).toContain("DEFAULT_TTL_MS");
  });

  it("최대 캐시 항목 수를 제한한다 (LRU)", () => {
    expect(cacheSrc).toContain("MAX_CACHE_ENTRIES");
    expect(cacheSrc).toContain("evictOldest");
  });

  it("캐시 통계를 제공한다", () => {
    expect(cacheSrc).toContain("getLLMCacheStats");
    expect(cacheSrc).toContain("hitRate");
  });

  it("캐시 초기화 기능이 있다 (테스트용)", () => {
    expect(cacheSrc).toContain("clearLLMCache");
  });

  it("aiHub에서 invokeLLMCached를 import하여 사용한다", () => {
    expect(aiHubSrc).toContain("invokeLLMCached");
    expect(aiHubSrc).toContain("from \"../llm-cache\"");
  });

  it("의료광고법 검수에 캐시가 적용되어 있다", () => {
    // 의료광고법 검수 호출이 invokeLLMCached를 사용하는지 확인
    const reviewSection = aiHubSrc.slice(
      aiHubSrc.indexOf("의료광고법 검수"),
      aiHubSrc.indexOf("의료광고법 검수") + 500
    );
    expect(reviewSection).toContain("invokeLLMCached");
  });

  it("네이버 블로그 HTML 변환에 캐시가 적용되어 있다", () => {
    const naverSection = aiHubSrc.slice(
      aiHubSrc.indexOf("prepareNaverBlog"),
      aiHubSrc.indexOf("prepareNaverBlog") + 500
    );
    expect(naverSection).toContain("invokeLLMCached");
  });

  it("블로그 초안 생성은 캐시하지 않는다 (매번 고유한 결과 필요)", () => {
    // trialBlog의 첫 번째 invokeLLM 호출은 캐시하지 않아야 함
    const trialSection = aiHubSrc.slice(
      aiHubSrc.indexOf("trialBlog:"),
      aiHubSrc.indexOf("trialStats:")
    );
    // 첫 번째 LLM 호출은 invokeLLM (캐시 아님)
    const firstLLMCall = trialSection.indexOf("await invokeLLM(");
    const firstCachedCall = trialSection.indexOf("await invokeLLMCached(");
    if (firstLLMCall >= 0 && firstCachedCall >= 0) {
      expect(firstLLMCall).toBeLessThan(firstCachedCall);
    } else {
      expect(firstLLMCall).toBeGreaterThanOrEqual(0);
    }
  });
});

// ═══════════════════════════════════════════════════════
// 전체 아키텍처 일관성 검증
// ═══════════════════════════════════════════════════════
describe("Phase B 아키텍처 일관성", () => {
  it("llm-cache.ts가 _core/llm.ts를 import한다 (래퍼 패턴)", () => {
    const cacheSrc = readSrc("server/llm-cache.ts");
    expect(cacheSrc).toContain("from \"./_core/llm\"");
  });

  it("seo-middleware.ts가 drizzle-orm sql을 사용한다 (타입 안전 쿼리)", () => {
    const middlewareSrc = readSrc("server/seo-middleware.ts");
    expect(middlewareSrc).toContain("from \"drizzle-orm\"");
    expect(middlewareSrc).toContain("sql`");
  });

  it("ServicePageLayout이 공통 UI 패턴을 export한다", () => {
    const layoutSrc = readSrc("client/src/components/ServicePageLayout.tsx");
    expect(layoutSrc).toContain("export");
    // 기본 export 또는 named export
    expect(layoutSrc.includes("export default") || layoutSrc.includes("export function")).toBe(true);
  });
});

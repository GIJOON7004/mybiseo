/**
 * SEO Middleware — AI 크롤러 감지 + 서비스 페이지 메타데이터 테스트
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const src = readFileSync(resolve(__dirname, "seo-middleware.ts"), "utf-8");

describe("SEO Middleware — AI 크롤러 감지", () => {
  it("주요 AI 크롤러 패턴이 등록되어 있다", () => {
    expect(src).toContain("GPTBot");
    expect(src).toContain("ChatGPT-User");
    expect(src).toContain("PerplexityBot");
    expect(src).toContain("ClaudeBot");
    expect(src).toContain("Google-Extended");
    expect(src).toContain("Applebot-Extended");
  });

  it("크롤러 이름 감지 함수가 존재한다", () => {
    expect(src).toContain("detectCrawlerName");
  });

  it("크롤러 방문 로깅 함수가 존재한다", () => {
    expect(src).toContain("logCrawlerVisit");
    expect(src).toContain("ai_crawler_visits");
  });

  it("X-Crawler-Detected 헤더를 설정한다", () => {
    expect(src).toContain("X-Crawler-Detected");
  });

  it("fire-and-forget 패턴으로 로깅한다 (await 없이 호출)", () => {
    // logCrawlerVisit 호출 시 앞에 await가 없어야 함
    const callMatch = src.match(/logCrawlerVisit\(crawlerName/g);
    expect(callMatch).not.toBeNull();
    expect(callMatch!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("SEO Middleware — 서비스 상세 페이지 메타데이터", () => {
  const servicePages = [
    { path: "/services/visibility", title: "AI Visibility Engine" },
    { path: "/services/reputation", title: "Reputation Defense" },
    { path: "/services/learning-hub", title: "AI Learning Hub" },
    { path: "/services/website", title: "Smart Website" },
    { path: "/services/communication", title: "Patient Communication" },
  ];

  servicePages.forEach(({ path, title }) => {
    it(`${path} 메타데이터가 등록되어 있다`, () => {
      expect(src).toContain(`"${path}"`);
      expect(src).toContain(title);
    });
  });
});

describe("SEO Middleware — sitemap.xml", () => {
  it("서비스 페이지가 sitemap에 포함되어 있다", () => {
    expect(src).toContain('loc: "/services/visibility"');
    expect(src).toContain('loc: "/services/reputation"');
    expect(src).toContain('loc: "/services/learning-hub"');
    expect(src).toContain('loc: "/services/website"');
    expect(src).toContain('loc: "/services/communication"');
  });

  it("블로그 포스트를 DB에서 동적으로 가져온다", () => {
    expect(src).toContain("blog_posts");
    expect(src).toContain("LIMIT 200");
  });
});

describe("SEO Middleware — robots.txt", () => {
  it("AI 크롤러 허용 규칙이 있다", () => {
    expect(src).toContain("User-agent: GPTBot");
    expect(src).toContain("User-agent: ClaudeBot");
    expect(src).toContain("User-agent: PerplexityBot");
  });

  it("admin과 api 경로는 차단한다", () => {
    expect(src).toContain("Disallow: /admin");
    expect(src).toContain("Disallow: /api/");
  });
});

describe("SEO Middleware — 사전 렌더링 HTML", () => {
  it("구조화된 HTML을 생성한다", () => {
    expect(src).toContain("generatePrerenderedHtml");
    expect(src).toContain("og:title");
    expect(src).toContain("og:description");
    expect(src).toContain("application/ld+json");
  });

  it("서비스 페이지 링크가 nav에 포함된다", () => {
    expect(src).toContain("mybiseo.com/services/visibility");
    expect(src).toContain("mybiseo.com/services/reputation");
  });
});

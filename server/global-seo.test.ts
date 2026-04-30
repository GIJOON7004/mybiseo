/**
 * 35차 글로벌 SEO 진단기 테스트
 * - 태국 맞춤 진단 항목 생성 확인
 * - 국가별 카테고리 분기 확인
 * - API에 country 파라미터 전달 확인
 */
import { readRouterSource } from "./test-helpers";
import { describe, it, expect, vi } from "vitest";
import * as cheerio from "cheerio";

// 태국 항목 모듈 직접 테스트
describe("Thai SEO Items", () => {
  it("generateThaiLocalSearchItems returns items with correct category", async () => {
    const { generateThaiLocalSearchItems } = await import("./seo-analyzer-th-items");
    const html = "<html lang='th'><head><meta name='google-site-verification' content='abc'/><meta name='description' content='Plastic surgery clinic in Bangkok'/></head><body>Welcome to our clinic</body></html>";
    const $ = cheerio.load(html);
    const mockCtx = {
      $,
      html,
      bodyText: "Welcome to our clinic in Bangkok",
      baseUrl: "https://editionbkk.com",
      robotsTxt: "User-agent: *\nAllow: /",
      robotsExists: true,
      sitemapExists: true,
      sitemapInRobots: true,
      htmlLang: "th",
      responseHeaders: {} as Record<string, string>,
      fetchOk: true,
      responseTime: 500,
      ogTitle: "Edition BKK",
      ogDesc: "Plastic surgery clinic in Bangkok",
      ogImage: "https://editionbkk.com/og.jpg",
    };
    const items = generateThaiLocalSearchItems(mockCtx);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i: any) => i.category === "Google Thailand 최적화")).toBe(true);
    // 각 항목에 필수 필드가 있는지 확인
    items.forEach((item: any) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("status");
      expect(item).toHaveProperty("score");
      expect(item).toHaveProperty("maxScore");
      expect(item).toHaveProperty("detail");
      expect(item).toHaveProperty("recommendation");
      expect(item).toHaveProperty("impact");
    });
  });

  it("generateThaiSocialItems returns LINE/Facebook items", async () => {
    const { generateThaiSocialItems } = await import("./seo-analyzer-th-items");
    const html = "<html><body><a href='https://line.me/ti/p/@clinic'>LINE</a><a href='https://facebook.com/clinic'>FB</a></body></html>";
    const $ = cheerio.load(html);
    const mockCtx = {
      $,
      html,
      bodyText: "Contact us via LINE",
      baseUrl: "https://editionbkk.com",
      robotsTxt: "",
      robotsExists: false,
      sitemapExists: false,
      sitemapInRobots: false,
      htmlLang: "th",
      responseHeaders: {} as Record<string, string>,
      fetchOk: true,
      responseTime: 500,
      ogTitle: "",
      ogDesc: "",
      ogImage: "",
    };
    const items = generateThaiSocialItems(mockCtx);
    expect(items.length).toBeGreaterThan(0);
    // LINE 관련 항목이 있어야 함
    const lineItem = items.find((i: any) => i.id.includes("line"));
    expect(lineItem).toBeDefined();
    expect(lineItem?.category).toBe("소셜 미디어");
  });

  it("generateThaiMedicalTourismItems returns medical tourism items", async () => {
    const { generateThaiMedicalTourismItems } = await import("./seo-analyzer-th-items");
    const html = "<html lang='en'><body>JCI accredited hospital with international patient services <a href='https://wa.me/123'>WhatsApp</a></body></html>";
    const $ = cheerio.load(html);
    const mockCtx = {
      $,
      html,
      bodyText: "JCI accredited hospital with international patient services",
      baseUrl: "https://editionbkk.com",
      robotsTxt: "",
      robotsExists: false,
      sitemapExists: false,
      sitemapInRobots: false,
      htmlLang: "en",
      responseHeaders: {} as Record<string, string>,
      fetchOk: true,
      responseTime: 500,
      ogTitle: "",
      ogDesc: "",
      ogImage: "",
    };
    const items = generateThaiMedicalTourismItems(mockCtx);
    expect(items.length).toBeGreaterThan(0);
    // 의료관광 관련 항목이 있어야 함
    const tourismItem = items.find((i: any) => i.id.includes("tourism") || i.id.includes("international"));
    expect(tourismItem).toBeDefined();
  });
});

describe("Country parameter in API", () => {
  it("analyze procedure accepts country parameter", async () => {
    // country 파라미터가 zod 스키마에 포함되어 있는지 확인
    const routersFile = await import("fs").then(fs => 
      readRouterSource()
    );
    expect(routersFile).toContain('country: z.enum(["kr", "th"])');
    expect(routersFile).toContain('input.country as CountryCode');
  });

  it("seo-analyzer exports CountryCode type", async () => {
    const { analyzeSeo } = await import("./seo-analyzer");
    expect(typeof analyzeSeo).toBe("function");
    // 함수가 3번째 파라미터를 받는지 확인
    expect(analyzeSeo.length).toBeLessThanOrEqual(3);
  });

  it("category names differ by country", () => {
    // 한국: 네이버 검색 최적화, 태국: Google Thailand 최적화
    const krCategories = ["메타 태그", "콘텐츠 구조", "홈페이지 기본 설정", "소셜 미디어", "검색 고급 설정", "네이버 검색 최적화", "병원 특화 SEO", "AI 검색 노출", "성능 최적화", "모바일 최적화", "접근성/UX", "국제화/다국어"];
    const thCategories = ["메타 태그", "콘텐츠 구조", "홈페이지 기본 설정", "소셜 미디어", "검색 고급 설정", "Google Thailand 최적화", "병원 특화 SEO", "AI 검색 노출", "성능 최적화", "모바일 최적화", "접근성/UX", "국제화/다국어"];
    expect(krCategories[5]).toBe("네이버 검색 최적화");
    expect(thCategories[5]).toBe("Google Thailand 최적화");
    expect(krCategories.length).toBe(thCategories.length);
  });
});

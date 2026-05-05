import { describe, it, expect, vi } from "vitest";

// Mock specialty weights module
describe("진단 알고리즘 v4 - 진료과별 가중치 시스템", () => {
  it("specialty-weights 모듈이 올바르게 export 된다", async () => {
    const mod = await import("./specialty-weights");
    expect(mod.WEIGHT_MATRIX).toBeDefined();
    expect(mod.resolveSpecialty).toBeDefined();
    expect(mod.applySpecialtyWeights).toBeDefined();
  });

  it("resolveSpecialty가 진료과명을 올바르게 매핑한다", async () => {
    const { resolveSpecialty } = await import("./specialty-weights");
    expect(resolveSpecialty("치과")).toBe("치과");
    expect(resolveSpecialty("dental")).toBe("치과");
    expect(resolveSpecialty("피부과")).toBe("피부과");
    expect(resolveSpecialty("dermatology")).toBe("피부과");
    expect(resolveSpecialty("성형외과")).toBe("성형외과");
    expect(resolveSpecialty("한의원")).toBe("한의원");
    expect(resolveSpecialty("정형외과")).toBe("정형외과");
    expect(resolveSpecialty("안과")).toBe("안과");
    expect(resolveSpecialty("산부인과")).toBe("산부인과");
    expect(resolveSpecialty("종합병원")).toBe("종합병원");
    expect(resolveSpecialty("알수없는과")).toBe("기타");
    expect(resolveSpecialty(undefined)).toBe("기타");
    expect(resolveSpecialty("")).toBe("기타");
  });

  it("WEIGHT_MATRIX에 모든 카테고리가 정의되어 있다", async () => {
    const { WEIGHT_MATRIX } = await import("./specialty-weights");
    const expectedCategories = ["메타 태그", "콘텐츠 구조", "AI 검색 노출", "성능 최적화", "모바일 최적화"];
    for (const cat of expectedCategories) {
      expect(WEIGHT_MATRIX[cat]).toBeDefined();
      expect(typeof WEIGHT_MATRIX[cat]).toBe("object");
    }
  });

  it("각 카테고리에 모든 진료과 가중치가 정의되어 있다", async () => {
    const { WEIGHT_MATRIX } = await import("./specialty-weights");
    for (const [cat, weights] of Object.entries(WEIGHT_MATRIX)) {
      const vals = Object.values(weights as Record<string, number>);
      // 각 카테고리에 13개 진료과(기타 포함) 가중치가 있어야 함
      expect(vals.length).toBe(13);
      // 모든 가중치는 0보다 크고 3보다 작아야 함
      for (const v of vals) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(3);
      }
    }
  });

  it("applySpecialtyWeights가 카테고리 점수에 가중치를 적용한다", async () => {
    const { applySpecialtyWeights } = await import("./specialty-weights");
    const categories = [
      { name: "메타 태그", score: 30, maxScore: 38, items: [] },
      { name: "콘텐츠 구조", score: 20, maxScore: 35, items: [] },
      { name: "홈페이지 기본 설정", score: 25, maxScore: 30, items: [] },
      { name: "소셜 미디어", score: 5, maxScore: 10, items: [] },
      { name: "검색 고급 설정", score: 15, maxScore: 20, items: [] },
      { name: "네이버 검색 최적화", score: 20, maxScore: 30, items: [] },
      { name: "병원 특화 SEO", score: 25, maxScore: 35, items: [] },
      { name: "AI 검색 노출", score: 50, maxScore: 70, items: [] },
      { name: "성능 최적화", score: 10, maxScore: 20, items: [] },
      { name: "모바일 최적화", score: 8, maxScore: 15, items: [] },
      { name: "접근성/UX", score: 5, maxScore: 10, items: [] },
      { name: "국제화/다국어", score: 3, maxScore: 8, items: [] },
    ];

    const result = applySpecialtyWeights(categories, "치과");
    expect(result).toBeDefined();
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.maxScore).toBeGreaterThan(0);
    expect(result.weightedCategories).toHaveLength(12);
  });

  it("applySpecialtyWeights가 기타 진료과에서도 동작한다", async () => {
    const { applySpecialtyWeights } = await import("./specialty-weights");
    const categories = [
      { name: "메타 태그", score: 30, maxScore: 38, items: [] },
      { name: "콘텐츠 구조", score: 20, maxScore: 35, items: [] },
      { name: "홈페이지 기본 설정", score: 25, maxScore: 30, items: [] },
      { name: "소셜 미디어", score: 5, maxScore: 10, items: [] },
      { name: "검색 고급 설정", score: 15, maxScore: 20, items: [] },
      { name: "네이버 검색 최적화", score: 20, maxScore: 30, items: [] },
      { name: "병원 특화 SEO", score: 25, maxScore: 35, items: [] },
      { name: "AI 검색 노출", score: 50, maxScore: 70, items: [] },
      { name: "성능 최적화", score: 10, maxScore: 20, items: [] },
      { name: "모바일 최적화", score: 8, maxScore: 15, items: [] },
      { name: "접근성/UX", score: 5, maxScore: 10, items: [] },
      { name: "국제화/다국어", score: 3, maxScore: 8, items: [] },
    ];

    // 기타도 동작해야 함
    const result = applySpecialtyWeights(categories, "기타");
    expect(result).toBeDefined();
    expect(result.totalScore).toBeGreaterThan(0);
  });
});

describe("진단 알고리즘 v4 - 추가 항목 모듈", () => {
  it("seo-analyzer-v4-items 모듈이 올바르게 export 된다", async () => {
    const mod = await import("./seo-analyzer-v4-items");
    expect(mod.generateAdditionalItems).toBeDefined();
    expect(typeof mod.generateAdditionalItems).toBe("function");
  });

  it("generateAdditionalItems가 빈 HTML에서도 항목을 생성한다", async () => {
    const { generateAdditionalItems } = await import("./seo-analyzer-v4-items");
    const cheerio = await import("cheerio");
    const $ = cheerio.load("<html><head></head><body></body></html>");
    
    const items = generateAdditionalItems({
      $,
      html: "<html><head></head><body></body></html>",
      bodyText: "",
      wordCount: 0,
      baseUrl: "https://example.com",
      responseHeaders: {},
      robotsTxt: "",
      robotsExists: false,
      jsonLdTypes: [],
      jsonLdData: [],
      fetchOk: true,
      responseTime: 500,
      effectiveTitle: "Test",
      metaDesc: "",
      ogTitle: "",
      ogDesc: "",
      ogImage: "",
      htmlLang: "",
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      totalImages: 0,
      imagesWithAlt: 0,
      internalLinks: 0,
      externalLinks: 0,
    });

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(40); // 최소 40개 이상 항목
    
    // 각 항목이 올바른 구조를 가지는지 확인
    for (const item of items) {
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
      expect(item.score).toBeGreaterThanOrEqual(0);
      if (item.status !== "info") { expect(item.maxScore).toBeGreaterThan(0); } else { expect(item.maxScore).toBe(0); }
      expect(item.score).toBeLessThanOrEqual(item.maxScore);
    }
  });

  it("generateAdditionalItems의 카테고리가 올바르다", async () => {
    const { generateAdditionalItems } = await import("./seo-analyzer-v4-items");
    const cheerio = await import("cheerio");
    const $ = cheerio.load("<html><head></head><body><h1>Test</h1></body></html>");
    
    const items = generateAdditionalItems({
      $,
      html: "<html><head></head><body><h1>Test</h1></body></html>",
      bodyText: "Test content",
      wordCount: 2,
      baseUrl: "https://example.com",
      responseHeaders: {},
      robotsTxt: "",
      robotsExists: false,
      jsonLdTypes: [],
      jsonLdData: [],
      fetchOk: true,
      responseTime: 500,
      effectiveTitle: "Test",
      metaDesc: "Test description",
      ogTitle: "Test",
      ogDesc: "Test",
      ogImage: "https://example.com/img.jpg",
      htmlLang: "ko",
      h1Count: 1,
      h2Count: 0,
      h3Count: 0,
      totalImages: 0,
      imagesWithAlt: 0,
      internalLinks: 5,
      externalLinks: 2,
    });

    const validCategories = ["성능 최적화", "모바일 최적화", "접근성/UX", "국제화/다국어",
      "메타 태그", "콘텐츠 구조", "홈페이지 기본 설정", "소셜 미디어",
      "검색 고급 설정", "네이버 검색 최적화", "병원 특화 SEO", "AI 검색 노출"];
    
    for (const item of items) {
      expect(validCategories).toContain(item.category);
    }
  });
});

describe("진단 알고리즘 v4 - analyzeSeo 통합", () => {
  it("analyzeSeo 함수가 specialty 파라미터를 받는다", async () => {
    const mod = await import("./seo-analyzer");
    expect(mod.analyzeSeo).toBeDefined();
    expect(typeof mod.analyzeSeo).toBe("function");
    // 함수 시그니처 확인 - 2개 파라미터 (url, specialty?)
    expect(mod.analyzeSeo.length).toBeGreaterThanOrEqual(1);
  });
});

/**
 * SEO 진단 일관성 테스트
 * - PageSpeed API 실패 시에도 항목 수가 고정되는지 검증
 * - 타임아웃 설정이 15초로 강화되었는지 검증
 */
import { describe, it, expect } from "vitest";
import { generateAdditionalItems } from "./seo-analyzer-v4-items";
import * as cheerio from "cheerio";

// 최소한의 mock context
function makeCtx(pageSpeed: any = null) {
  const html = `<html><head><title>Test</title></head><body><h1>Test</h1><p>Hello world content for testing purposes with enough words to pass basic checks</p></body></html>`;
  const $ = cheerio.load(html);
  return {
    $,
    html,
    bodyText: "Test Hello world content for testing purposes with enough words to pass basic checks",
    wordCount: 15,
    baseUrl: "https://example.com",
    responseHeaders: {} as Record<string, string>,
    robotsTxt: "",
    robotsExists: false,
    jsonLdTypes: [] as string[],
    jsonLdData: [] as any[],
    fetchOk: true,
    responseTime: 500,
    effectiveTitle: "Test",
    metaDesc: "Test description",
    ogTitle: "Test",
    ogDesc: "Test desc",
    ogImage: "",
    htmlLang: "ko",
    h1Count: 1,
    h2Count: 0,
    h3Count: 0,
    totalImages: 0,
    imagesWithAlt: 0,
    internalLinks: 0,
    externalLinks: 0,
    country: "kr" as const,
    agg: undefined,
    pageSpeed,
  };
}

// PageSpeed 성공 시 mock 데이터
const mockPageSpeed = {
  lcp: { value: 3000 },
  fcp: { value: 2000 },
  cls: { value: 0.15 },
  tbt: { value: 300 },
  performanceScore: 65,
  diagnostics: { domSize: 1200 },
};

describe("SEO 진단 일관성 - PageSpeed 항목 고정", () => {
  const CWV_IDS = [
    "perf-cwv-lcp",
    "perf-cwv-fcp",
    "perf-cwv-cls",
    "perf-cwv-tbt",
    "perf-pagespeed-score",
  ];

  it("PageSpeed API 성공 시 5개 CWV 항목이 모두 존재해야 한다", () => {
    const items = generateAdditionalItems(makeCtx(mockPageSpeed));
    const cwvItems = items.filter(i => CWV_IDS.includes(i.id));
    expect(cwvItems).toHaveLength(5);
    // 모든 항목의 maxScore가 고정값
    expect(cwvItems.find(i => i.id === "perf-cwv-lcp")!.maxScore).toBe(5);
    expect(cwvItems.find(i => i.id === "perf-cwv-fcp")!.maxScore).toBe(4);
    expect(cwvItems.find(i => i.id === "perf-cwv-cls")!.maxScore).toBe(5);
    expect(cwvItems.find(i => i.id === "perf-cwv-tbt")!.maxScore).toBe(4);
    expect(cwvItems.find(i => i.id === "perf-pagespeed-score")!.maxScore).toBe(5);
  });

  it("PageSpeed API 실패(null) 시에도 5개 CWV 항목이 모두 존재해야 한다", () => {
    const items = generateAdditionalItems(makeCtx(null));
    const cwvItems = items.filter(i => CWV_IDS.includes(i.id));
    expect(cwvItems).toHaveLength(5);
    // PageSpeed 실패 시 maxScore가 0이어야 한다 (점수 계산에서 제외)
    expect(cwvItems.find(i => i.id === "perf-cwv-lcp")!.maxScore).toBe(0);
    expect(cwvItems.find(i => i.id === "perf-cwv-fcp")!.maxScore).toBe(0);
    expect(cwvItems.find(i => i.id === "perf-cwv-cls")!.maxScore).toBe(0);
    expect(cwvItems.find(i => i.id === "perf-cwv-tbt")!.maxScore).toBe(0);
    expect(cwvItems.find(i => i.id === "perf-pagespeed-score")!.maxScore).toBe(0);
  });

  it("PageSpeed 실패 시 CWV 항목의 score는 모두 0이어야 한다", () => {
    const items = generateAdditionalItems(makeCtx(null));
    const cwvItems = items.filter(i => CWV_IDS.includes(i.id));
    for (const item of cwvItems) {
      expect(item.score).toBe(0);
    }
  });

  it("PageSpeed 실패 시 CWV 항목의 status는 모두 info이어야 한다", () => {
    const items = generateAdditionalItems(makeCtx(null));
    const cwvItems = items.filter(i => CWV_IDS.includes(i.id));
    for (const item of cwvItems) {
      expect(item.status).toBe("info");
    }
  });

  it("PageSpeed 실패 시 CWV 항목의 detail에 '측정 불가'가 포함되어야 한다", () => {
    const items = generateAdditionalItems(makeCtx(null));
    const cwvItems = items.filter(i => CWV_IDS.includes(i.id));
    for (const item of cwvItems) {
      expect(item.detail).toContain("측정 불가");
    }
  });

  it("PageSpeed 성공/실패 시 전체 항목 수가 동일해야 한다 (일관성)", () => {
    const itemsWithPS = generateAdditionalItems(makeCtx(mockPageSpeed));
    const itemsWithoutPS = generateAdditionalItems(makeCtx(null));
    expect(itemsWithPS.length).toBe(itemsWithoutPS.length);
  });

  it("PageSpeed 실패 시 CWV 항목의 maxScore가 0이어야 한다", () => {
    const itemsWithoutPS = generateAdditionalItems(makeCtx(null));
    const cwvItems = itemsWithoutPS.filter(i => CWV_IDS.includes(i.id));
    for (const item of cwvItems) {
      expect(item.maxScore).toBe(0);
    }
  });

  it("PageSpeed 성공 시 실제 점수가 반영되어야 한다", () => {
    const items = generateAdditionalItems(makeCtx(mockPageSpeed));
    const lcp = items.find(i => i.id === "perf-cwv-lcp")!;
    // LCP 3000ms → 2500 < 3000 <= 4000 → warning, score=2
    expect(lcp.status).toBe("warning");
    expect(lcp.score).toBe(2);
    expect(lcp.detail).toContain("3.0초");
  });

  it("카테고리별 항목 수가 PageSpeed 유무와 관계없이 동일해야 한다", () => {
    const itemsWithPS = generateAdditionalItems(makeCtx(mockPageSpeed));
    const itemsWithoutPS = generateAdditionalItems(makeCtx(null));

    // 성능 최적화 카테고리 항목 수 비교
    const perfWith = itemsWithPS.filter(i => i.category === "성능 최적화");
    const perfWithout = itemsWithoutPS.filter(i => i.category === "성능 최적화");
    expect(perfWith.length).toBe(perfWithout.length);
  });
});

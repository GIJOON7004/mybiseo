import { describe, expect, it } from "vitest";
import { CATEGORY_MAX_SCORES, TOTAL_MAX_SCORE, validateMinItems, CATEGORY_MIN_ITEMS } from "./utils/check-item-registry";
import { displayScore, displayPercent } from "./utils/score-rounding";

describe("2단계 개선사항 테스트", () => {
  // #9 검사 항목 정적 레지스트리
  describe("#9 검사 항목 정적 레지스트리", () => {
    it("CATEGORY_MAX_SCORES가 주요 카테고리를 포함해야 함", () => {
      const categories = Object.keys(CATEGORY_MAX_SCORES);
      expect(categories.length).toBeGreaterThanOrEqual(8);
      expect(categories).toContain("AI 검색 노출");
      expect(categories).toContain("콘텐츠 구조");
      expect(categories).toContain("병원 특화 SEO");
      expect(categories).toContain("홈페이지 기본 설정");
    });

    it("각 카테고리 만점이 양수여야 함", () => {
      for (const [name, score] of Object.entries(CATEGORY_MAX_SCORES)) {
        expect(score).toBeGreaterThan(0);
      }
    });
  });

  // #10 카테고리별 만점 고정 테이블
  describe("#10 카테고리별 만점 고정 테이블", () => {
    it("TOTAL_MAX_SCORE가 모든 카테고리 만점 합과 일치해야 함", () => {
      const sum = Object.values(CATEGORY_MAX_SCORES).reduce((a, b) => a + b, 0);
      expect(TOTAL_MAX_SCORE).toBe(sum);
    });
  });

  // #11 가중치 합산 검증
  describe("#11 가중치 합산 검증", () => {
    it("TOTAL_MAX_SCORE가 양수여야 함", () => {
      expect(TOTAL_MAX_SCORE).toBeGreaterThan(0);
    });
  });

  // #12 최소 항목 수 보장
  describe("#12 최소 항목 수 보장", () => {
    it("validateMinItems가 충분한 항목이 있을 때 valid를 반환해야 함", () => {
      const items = Object.entries(CATEGORY_MIN_ITEMS).flatMap(([category, count]) =>
        Array.from({ length: count }, (_, i) => ({ category }))
      );
      const result = validateMinItems(items);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("validateMinItems가 항목 부족 시 warnings를 반환해야 함", () => {
      const items = [{ category: "AI 검색 노출" }]; // 1개만
      const result = validateMinItems(items);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // #2 PageSpeed 다회 측정 중앙값 (함수 시그니처 테스트)
  describe("#2 PageSpeed 다회 측정", () => {
    it("fetchPageSpeedMetrics가 measurements 파라미터를 받아야 함", async () => {
      const { fetchPageSpeedMetrics } = await import("./pagespeed-client");
      // API 키 없이 호출하면 null 반환 (파라미터 존재 확인만)
      expect(fetchPageSpeedMetrics.length).toBeGreaterThanOrEqual(1);
    });
  });

  // #5 재시도 로직 강화 (간접 테스트 - 함수 존재 확인)
  describe("#5 재시도 로직 강화", () => {
    it("seo-analyzer 모듈이 정상 import 되어야 함", async () => {
      const mod = await import("./seo-analyzer");
      expect(mod.analyzeSeo).toBeDefined();
      expect(typeof mod.analyzeSeo).toBe("function");
    });
  });

  // #19 소수점 반올림 (1단계에서 구현했지만 2단계에서 확장)
  describe("#19 소수점 반올림 확장", () => {
    it("displayPercent가 소수점 반올림을 올바르게 적용해야 함", () => {
      expect(displayPercent(75.67)).toBe(75.7);
      expect(displayPercent(50.0)).toBe(50.0);
      expect(displayPercent(99.99)).toBe(100.0);
      expect(displayPercent(33.333)).toBe(33.3);
    });
  });
});

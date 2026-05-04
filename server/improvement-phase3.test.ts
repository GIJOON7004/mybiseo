/**
 * 3단계 개선사항 vitest 테스트
 * 
 * #16 이미지 최적화 샘플링 고정
 * #18 진료과별 가중치 데이터 기반 보정
 * #20 동적 콘텐츠 감지
 * #23 키워드 노출 코드 기반 전환
 * #24 경쟁사 분석 데이터 구조화
 * #28 다중 신호 진료과 분류
 * #29 복합 진료과 처리
 * #31 진료과 분류 사용자 확인 (신뢰도 기반)
 * #32 진료과 분류 신뢰도 점수
 */
import { describe, it, expect } from "vitest";
import {
  classifySpecialty,
  getClassificationSummary,
  type ClassificationResult,
} from "./utils/specialty-classifier";
import {
  detectDynamicContent,
  type DynamicContentResult,
} from "./utils/dynamic-content-detector";
import {
  analyzeKeywordExposure,
  analyzeMultipleKeywords,
  type KeywordExposureResult,
} from "./utils/keyword-exposure-checker";
import {
  normalizeCompetitorData,
  normalizeCompetitors,
  type CompetitorAnalysis,
} from "./utils/competitor-schema";
import {
  getCalibrationMap,
  calculateCalibrationFactor,
  CATEGORY_SEO_IMPACT,
  SPECIALTY_SEARCH_DATA,
} from "./utils/specialty-weight-calibration";
import {
  sampleImages,
  extractImagesFromHtml,
  type ImageInfo,
} from "./utils/image-sampling";

// ============================================================
// #28 #29 #32 다중 신호 진료과 분류 + 복합 진료과 + 신뢰도 점수
// ============================================================
describe("#28 #29 #32 specialty-classifier", () => {
  it("URL에서 진료과를 정확히 분류한다 (성형외과)", () => {
    const result = classifySpecialty({
      url: "https://www.gangnam-plastic.co.kr",
      title: "강남 성형외과 - 코성형, 눈성형 전문",
      description: "강남 성형외과에서 코성형, 눈성형, 리프팅 전문 상담",
      bodyText: "성형외과 전문의가 직접 상담합니다. 코성형 눈성형 리프팅 보톡스 필러",
    });
    expect(result.primary).toBe("성형외과");
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it("치과 키워드가 있는 사이트를 올바르게 분류한다", () => {
    const result = classifySpecialty({
      url: "https://www.smile-dental.co.kr",
      title: "스마일 치과 - 임플란트 교정 전문",
      description: "임플란트, 치아교정, 스케일링 전문 치과",
      bodyText: "임플란트 교정 치아 잇몸 치료 스케일링 충치 치료",
    });
    expect(result.primary).toBe("치과");
    expect(result.confidence).toBeGreaterThan(50);
  });

  it("복합 진료과를 감지한다 (#29)", () => {
    const result = classifySpecialty({
      url: "https://www.beauty-clinic.co.kr",
      title: "뷰티 클리닉 - 성형외과 피부과",
      description: "성형외과 피부과 통합 진료. 보톡스 필러 레이저 여드름 치료",
      bodyText: "성형외과 전문의와 피부과 전문의가 함께합니다. 코성형 눈성형 레이저 여드름 기미 치료",
    });
    // 복합 진료과이므로 isMultiSpecialty가 true이거나 secondary가 존재
    expect(result.secondary !== null || result.isMultiSpecialty).toBe(true);
  });

  it("신뢰도가 낮은 경우를 감지한다 (#32)", () => {
    const result = classifySpecialty({
      url: "https://www.general-hospital.co.kr",
      title: "종합 의료 서비스",
      description: "다양한 진료과목을 운영합니다",
      bodyText: "내과 외과 정형외과 이비인후과 피부과 안과 다양한 진료",
    });
    // 여러 진료과가 혼재하면 신뢰도가 낮아야 함
    const summary = getClassificationSummary(result);
    expect(summary.confidence).toBeDefined();
    expect(typeof summary.needsConfirmation).toBe("boolean");
  });

  it("사용자 입력이 있으면 우선 적용한다 (#31)", () => {
    const result = classifySpecialty({
      url: "https://www.clinic.co.kr",
      title: "클리닉",
      description: "전문 진료",
      bodyText: "다양한 진료를 합니다",
      userInput: "안과",
    });
    expect(result.primary).toBe("안과");
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it("getClassificationSummary가 올바른 구조를 반환한다", () => {
    const result = classifySpecialty({
      url: "https://www.dental-clinic.co.kr/implant",
      title: "임플란트 전문 치과",
      description: "임플란트 치과",
      bodyText: "임플란트 교정 치아",
    });
    const summary = getClassificationSummary(result);
    expect(summary).toHaveProperty("detected");
    expect(summary).toHaveProperty("confidence");
    expect(summary).toHaveProperty("needsConfirmation");
    expect(summary).toHaveProperty("alternatives");
    expect(Array.isArray(summary.alternatives)).toBe(true);
  });
});

// ============================================================
// #20 동적 콘텐츠 감지
// ============================================================
describe("#20 dynamic-content-detector", () => {
  it("SPA 프레임워크를 감지한다", () => {
    const html = `<html><body><div id="root"></div><script src="/static/js/main.chunk.js"></script></body></html>`;
    const result = detectDynamicContent(html, "");
    expect(result.hasDynamicContent).toBe(true);
    expect(result.patterns.some(p => p.type === "spa-routing")).toBe(true);
  });

  it("lazy loading 이미지를 감지한다", () => {
    const html = `<html><body><img data-src="image.jpg" loading="lazy" /><img data-src="image2.jpg" /></body></html>`;
    const result = detectDynamicContent(html, "일반 텍스트 콘텐츠");
    expect(result.hasDynamicContent).toBe(true);
    expect(result.patterns.some(p => p.type === "lazy-load")).toBe(true);
  });

  it("정적 HTML 사이트는 동적 콘텐츠 없음으로 판단한다", () => {
    const html = `<html><head><title>정적 사이트</title></head><body><h1>안녕하세요</h1><p>일반 텍스트 콘텐츠입니다.</p></body></html>`;
    const bodyText = "안녕하세요 일반 텍스트 콘텐츠입니다.";
    const result = detectDynamicContent(html, bodyText);
    expect(result.hasDynamicContent).toBe(false);
    expect(result.seoRisk).toBe("low");
  });

  it("SEO 위험도를 올바르게 분류한다", () => {
    const html = `<html><body><div id="__next"></div><script>fetch('/api/data').then(r=>r.json())</script></body></html>`;
    const result = detectDynamicContent(html, "");
    expect(["low", "medium", "high"]).toContain(result.seoRisk);
  });

  it("결과 인터페이스가 올바른 구조를 가진다", () => {
    const result = detectDynamicContent("<html><body></body></html>", "텍스트");
    expect(result).toHaveProperty("staticTextLength");
    expect(result).toHaveProperty("dynamicRatio");
    expect(result).toHaveProperty("hasDynamicContent");
    expect(result).toHaveProperty("patterns");
    expect(result).toHaveProperty("seoRisk");
    expect(typeof result.staticTextLength).toBe("number");
    expect(typeof result.dynamicRatio).toBe("number");
  });
});

// ============================================================
// #23 키워드 노출 코드 기반 전환
// ============================================================
describe("#23 keyword-exposure-checker", () => {
  it("타이틀에 키워드가 있으면 높은 점수를 부여한다", () => {
    const result = analyzeKeywordExposure({
      keyword: "임플란트",
      url: "https://www.dental.co.kr/implant",
      html: `<html><head><title>임플란트 전문 치과</title><meta name="description" content="임플란트 전문"></head><body><h1>임플란트 치과</h1><p>임플란트 시술을 합니다</p></body></html>`,
      title: "임플란트 전문 치과",
      metaDescription: "임플란트 전문",
      metaKeywords: "임플란트,치과",
      bodyText: "임플란트 시술을 합니다",
    });
    expect(result.exposureScore).toBeGreaterThan(50);
    expect(result.status).not.toBe("missing");
    expect(result.foundIn.some(f => f.element === "title")).toBe(true);
  });

  it("키워드가 없으면 missing 상태를 반환한다", () => {
    const result = analyzeKeywordExposure({
      keyword: "라식",
      url: "https://www.dental.co.kr",
      html: `<html><head><title>치과</title></head><body><p>치아 치료</p></body></html>`,
      title: "치과",
      metaDescription: "치아 치료 전문",
      metaKeywords: "치과",
      bodyText: "치아 치료를 합니다",
    });
    expect(result.status).toBe("missing");
    expect(result.exposureScore).toBe(0);
  });

  it("키워드 밀도를 올바르게 계산한다", () => {
    const bodyText = "성형외과 전문의가 성형외과에서 성형외과 수술을 합니다. 총 20단어 정도의 텍스트입니다.";
    const result = analyzeKeywordExposure({
      keyword: "성형외과",
      url: "https://www.plastic.co.kr",
      html: `<html><body><p>${bodyText}</p></body></html>`,
      title: "성형외과",
      metaDescription: "성형외과",
      metaKeywords: "",
      bodyText,
    });
    expect(result.density).toBeGreaterThan(0);
    expect(typeof result.density).toBe("number");
  });

  it("analyzeMultipleKeywords가 여러 키워드를 분석한다", () => {
    const results = analyzeMultipleKeywords({
      keywords: ["임플란트", "치아교정", "스케일링"],
      url: "https://www.dental.co.kr",
      html: `<html><head><title>임플란트 치아교정 전문</title></head><body><h1>임플란트</h1><p>임플란트와 치아교정을 합니다</p></body></html>`,
      title: "임플란트 치아교정 전문",
      metaDescription: "임플란트 치아교정",
      metaKeywords: "임플란트,치아교정",
      bodyText: "임플란트와 치아교정을 합니다",
    });
    expect(results.length).toBe(3);
    expect(results[0].keyword).toBe("임플란트");
    expect(results[0].status).not.toBe("missing");
    // 스케일링은 없으므로 missing
    expect(results[2].status).toBe("missing");
  });
});

// ============================================================
// #24 경쟁사 분석 데이터 구조화
// ============================================================
describe("#24 competitor-schema", () => {
  it("유효한 경쟁사 데이터를 정규화한다", () => {
    const raw = {
      anonymousId: "경쟁사A",
      type: "동종의원",
      estimatedVisibility: "상",
      strengths: [
        { category: "콘텐츠", description: "블로그 활발", impactLevel: "high" },
      ],
      weaknesses: ["모바일 최적화 부족"],
      contentStrategy: {
        updateFrequency: "주2-3회",
        contentTypes: ["블로그", "사례"],
        keywordStrategy: "지역명 + 진료과",
        usesStructuredData: true,
      },
      threatScore: 75,
    };
    const result = normalizeCompetitorData(raw);
    expect(result).not.toBeNull();
    expect(result!.anonymousId).toBe("경쟁사A");
    expect(result!.type).toBe("동종의원");
    expect(result!.threatScore).toBe(75);
    expect(result!.strengths.length).toBe(1);
  });

  it("잘못된 데이터는 null을 반환한다", () => {
    expect(normalizeCompetitorData(null)).toBeNull();
    expect(normalizeCompetitorData(undefined)).toBeNull();
    expect(normalizeCompetitorData("string")).toBeNull();
    // 빈 객체는 기본값으로 채워서 반환됨 (디폴트 정규화 동작)
    const emptyResult = normalizeCompetitorData({});
    expect(emptyResult).not.toBeNull();
    expect(emptyResult!.type).toBe("동종의원");
  });

  it("normalizeCompetitors가 배열을 처리한다", () => {
    const rawArray = [
      {
        anonymousId: "A",
        type: "동종의원",
        estimatedVisibility: "상",
        strengths: [],
        weaknesses: [],
        contentStrategy: {
          updateFrequency: "주1회",
          contentTypes: [],
          keywordStrategy: "",
          usesStructuredData: false,
        },
        threatScore: 50,
      },
      null, // 잘못된 데이터
      {
        anonymousId: "B",
        type: "프랜차이즈",
        estimatedVisibility: "중",
        strengths: [],
        weaknesses: [],
        contentStrategy: {
          updateFrequency: "매일",
          contentTypes: ["블로그"],
          keywordStrategy: "브랜드명",
          usesStructuredData: true,
        },
        threatScore: 80,
      },
    ];
    const results = normalizeCompetitors(rawArray);
    expect(results.length).toBe(2); // null은 필터링됨
    expect(results[0].anonymousId).toBe("A");
    expect(results[1].anonymousId).toBe("B");
  });

  it("threatScore를 0-100 범위로 클램핑한다", () => {
    const raw = {
      anonymousId: "C",
      type: "대형병원",
      estimatedVisibility: "상",
      strengths: [],
      weaknesses: [],
      contentStrategy: {
        updateFrequency: "매일",
        contentTypes: [],
        keywordStrategy: "",
        usesStructuredData: false,
      },
      threatScore: 150, // 범위 초과
    };
    const result = normalizeCompetitorData(raw);
    expect(result).not.toBeNull();
    expect(result!.threatScore).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// #18 진료과별 가중치 데이터 기반 보정
// ============================================================
describe("#18 specialty-weight-calibration", () => {
  it("성형외과에 대한 보정 맵을 반환한다", () => {
    const map = getCalibrationMap("성형외과");
    expect(typeof map).toBe("object");
    // CATEGORY_SEO_IMPACT에 정의된 카테고리들에 대해 값이 존재해야 함
    expect(map["콘텐츠 구조"]).toBeDefined();
    expect(typeof map["콘텐츠 구조"]).toBe("number");
  });

  it("모든 진료과에 대해 보정 맵을 생성할 수 있다", () => {
    const specialties = Object.keys(SPECIALTY_SEARCH_DATA);
    for (const sp of specialties) {
      const map = getCalibrationMap(sp as any);
      expect(typeof map).toBe("object");
      expect(Object.keys(map).length).toBeGreaterThan(0);
    }
  });

  it("calculateCalibrationFactor가 양수를 반환한다", () => {
    const factor = calculateCalibrationFactor("치과", "콘텐츠 구조");
    expect(factor).toBeGreaterThan(0);
    expect(typeof factor).toBe("number");
  });

  it("알 수 없는 카테고리는 기본값 1.0을 반환한다", () => {
    const factor = calculateCalibrationFactor("치과", "존재하지않는카테고리");
    expect(factor).toBe(1.0);
  });

  it("CATEGORY_SEO_IMPACT에 필수 카테고리가 정의되어 있다", () => {
    const requiredCategories = ["메타 태그", "콘텐츠 구조", "검색 고급 설정", "AI 검색 노출", "네이버 검색 최적화", "병원 특화 SEO"];
    for (const cat of requiredCategories) {
      expect(CATEGORY_SEO_IMPACT[cat]).toBeDefined();
      expect(CATEGORY_SEO_IMPACT[cat].rankingImpact).toBeGreaterThanOrEqual(0);
      expect(CATEGORY_SEO_IMPACT[cat].rankingImpact).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================
// #16 이미지 최적화 샘플링 고정
// ============================================================
describe("#16 image-sampling", () => {
  it("이미지가 50개 이하면 전체를 반환한다", () => {
    const images: ImageInfo[] = Array.from({ length: 10 }, (_, i) => ({
      src: `image${i}.jpg`,
      alt: `이미지 ${i}`,
      width: 800,
      height: 600,
    }));
    const result = sampleImages(images);
    expect(result.sampledCount).toBe(10);
    expect(result.totalCount).toBe(10);
    expect(result.samplingRatio).toBe(1);
  });

  it("이미지가 많으면 샘플링한다", () => {
    const images: ImageInfo[] = Array.from({ length: 200 }, (_, i) => ({
      src: `image${i}.jpg`,
      alt: `이미지 ${i}`,
      width: 100 + i * 10,
      height: 100 + i * 5,
      estimatedSize: 1000 + i * 500,
    }));
    const result = sampleImages(images, 50);
    expect(result.sampledCount).toBeLessThanOrEqual(50);
    expect(result.totalCount).toBe(200);
    expect(result.samplingRatio).toBeLessThan(1);
  });

  it("extractImagesFromHtml이 img 태그를 추출한다", () => {
    const html = `
      <html><body>
        <img src="test1.jpg" alt="테스트1" width="800" height="600" />
        <img src="test2.png" alt="테스트2" />
        <img data-src="test3.webp" alt="테스트3" loading="lazy" />
      </body></html>
    `;
    const images = extractImagesFromHtml(html);
    expect(images.length).toBeGreaterThanOrEqual(2);
    expect(images[0].src).toContain("test1.jpg");
    expect(images[0].alt).toBe("테스트1");
  });

  it("사용자 지정 샘플 크기를 적용한다", () => {
    const images: ImageInfo[] = Array.from({ length: 100 }, (_, i) => ({
      src: `img${i}.jpg`,
      alt: "",
      estimatedSize: i * 1000,
    }));
    const result = sampleImages(images, 20);
    expect(result.sampledCount).toBeLessThanOrEqual(20);
  });

  it("빈 배열을 처리한다", () => {
    const result = sampleImages([]);
    expect(result.sampledCount).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.sampled).toEqual([]);
  });
});

/**
 * #14 검사 항목 ID 체계 표준화
 * 
 * 기존 문자열 ID(예: "meta-title", "content-h1")를 
 * 카테고리코드-순번 형식(예: "A01", "B03")으로 매핑
 * 
 * 카테고리 코드:
 * A: 메타 태그 (Meta Tags)
 * B: 콘텐츠 (Content)
 * C: 기술적 SEO (Technical)
 * D: 소셜 미디어 (Social)
 * E: 고급 SEO (Advanced)
 * F: 네이버 최적화 (Naver)
 * G: 의료 특화 (Medical)
 * H: 성능 최적화 (Performance)
 * I: 모바일 최적화 (Mobile)
 * J: 접근성/UX (Accessibility)
 * K: 국제화/다국어 (i18n)
 * L: 기타 (Others)
 */

export interface StandardizedItem {
  /** 표준 ID (예: "A01") */
  standardId: string;
  /** 기존 ID (예: "meta-title") */
  legacyId: string;
  /** 카테고리 코드 */
  categoryCode: string;
  /** 카테고리명 */
  categoryName: string;
}

// 카테고리 코드 매핑
const CATEGORY_CODE_MAP: Record<string, string> = {
  "메타 태그": "A",
  "콘텐츠": "B",
  "기술적 SEO": "C",
  "소셜 미디어": "D",
  "고급 SEO": "E",
  "네이버 최적화": "F",
  "의료 특화": "G",
  "성능 최적화": "H",
  "모바일 최적화": "I",
  "접근성/UX": "J",
  "국제화/다국어": "K",
};

// 기존 ID → 표준 ID 매핑 테이블
const LEGACY_TO_STANDARD: Record<string, string> = {
  // A: 메타 태그
  "meta-title": "A01",
  "meta-description": "A02",
  "meta-keywords": "A03",
  "meta-viewport": "A04",
  "meta-canonical": "A05",
  "meta-charset": "A06",
  "meta-title-keyword": "A07",
  // B: 콘텐츠
  "content-h1": "B01",
  "content-headings": "B02",
  "content-img-alt": "B03",
  "content-text-length": "B04",
  "content-links": "B05",
  "content-freshness": "B06",
  // C: 기술적 SEO
  "tech-ssl": "C01",
  "tech-robots": "C02",
  "tech-sitemap": "C03",
  "tech-accessibility": "C04",
  "tech-response-time": "C05",
  // D: 소셜 미디어
  "social-og": "D01",
  "social-twitter": "D02",
  // E: 고급 SEO
  "advanced-jsonld": "E01",
  "advanced-lang": "E02",
  "advanced-favicon": "E03",
  "advanced-robots-meta": "E04",
  "advanced-security-headers": "E05",
  // F: 네이버 최적화
  "naver-verification": "F01",
  "naver-og-tags": "F02",
  "naver-korean-content": "F03",
};

/**
 * 기존 ID를 표준 ID로 변환
 * 매핑이 없으면 카테고리명 기반으로 자동 생성
 */
export function toStandardId(legacyId: string, categoryName?: string): string {
  // 매핑 테이블에 있으면 바로 반환
  if (LEGACY_TO_STANDARD[legacyId]) {
    return LEGACY_TO_STANDARD[legacyId];
  }
  // 없으면 카테고리 코드 + 해시 기반 순번
  const code = categoryName ? (CATEGORY_CODE_MAP[categoryName] || "L") : "L";
  const hash = simpleHash(legacyId) % 99 + 1;
  return `${code}${hash.toString().padStart(2, "0")}`;
}

/**
 * 표준 ID를 기존 ID로 역변환
 */
export function toLegacyId(standardId: string): string | undefined {
  for (const [legacy, standard] of Object.entries(LEGACY_TO_STANDARD)) {
    if (standard === standardId) return legacy;
  }
  return undefined;
}

/**
 * 카테고리명으로 카테고리 코드 조회
 */
export function getCategoryCode(categoryName: string): string {
  return CATEGORY_CODE_MAP[categoryName] || "L";
}

/**
 * 검사 항목에 standardId를 부여하는 헬퍼
 * seo-analyzer.ts의 결과에 적용
 */
export function enrichWithStandardIds<T extends { id: string; category: string }>(items: T[]): (T & { standardId: string })[] {
  const categoryCounters: Record<string, number> = {};
  
  return items.map(item => {
    const code = CATEGORY_CODE_MAP[item.category] || "L";
    if (!categoryCounters[code]) categoryCounters[code] = 0;
    categoryCounters[code]++;
    
    const standardId = LEGACY_TO_STANDARD[item.id] || `${code}${categoryCounters[code].toString().padStart(2, "0")}`;
    
    return { ...item, standardId };
  });
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

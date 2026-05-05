/**
 * #9 검사 항목 정적 레지스트리
 * #10 카테고리별 만점 고정 테이블
 * #11 가중치 합산 검증 로직
 * #12 카테고리별 최소 항목 수 보장
 *
 * 모든 검사 항목을 코드에 고정 선언하여 실행마다 동일한 항목 세트를 보장한다.
 */

export interface CheckItemDef {
  id: string;
  standardId: string;
  name: string;
  category: string;
  maxScore: number;
  description: string;
}

// ── 카테고리 정의 및 만점 테이블 (#10) ──
export const CATEGORY_MAX_SCORES: Record<string, number> = {
  "메타 태그": 38,        // 7항목: 10+10+3+5+5+2+3
  "콘텐츠 구조": 35,      // 6항목: 8+6+6+5+5+5
  "홈페이지 기본 설정": 30, // 5항목: 10+5+5+5+5
  "검색 고급 설정": 25,    // 5항목: 5+5+5+5+5
  "네이버 검색 최적화": 25, // 5항목: 5+5+5+5+5
  "소셜 미디어": 10,       // 2항목: 5+5
  "병원 특화 SEO": 30,    // 6항목: 5+5+5+5+5+5
  "AI 검색 노출": 60,     // 12항목: 5*12
  "성능 최적화": 53,       // 13항목: PageSpeed CWV 포함
  "모바일 최적화": 26,     // 8항목: 뷰포트, 터치, 반응형 등
  "접근성/UX": 19,        // 6항목: ARIA, 대비, 키보드 등
  "국제화/다국어": 18,    // 5항목: hreflang, 다국어 콘텐츠 등
};

// 전체 만점 합계
export const TOTAL_MAX_SCORE = Object.values(CATEGORY_MAX_SCORES).reduce((a, b) => a + b, 0);

// ── 카테고리별 최소 항목 수 (#12) ──
export const CATEGORY_MIN_ITEMS: Record<string, number> = {
  "메타 태그": 5,
  "콘텐츠 구조": 4,
  "홈페이지 기본 설정": 3,
  "검색 고급 설정": 3,
  "네이버 검색 최적화": 3,
  "소셜 미디어": 2,
  "병원 특화 SEO": 3,
  "AI 검색 노출": 5,
};

// ── 정적 레지스트리: 모든 검사 항목 (#9) ──
export const CHECK_ITEM_REGISTRY: CheckItemDef[] = [
  // 메타 태그 (7항목)
  { id: "meta-title", standardId: "A01", name: "타이틀 태그", category: "메타 태그", maxScore: 10, description: "페이지 제목 태그 존재 및 최적 길이" },
  { id: "meta-description", standardId: "A02", name: "메타 디스크립션", category: "메타 태그", maxScore: 10, description: "메타 설명 태그 존재 및 최적 길이" },
  { id: "meta-viewport", standardId: "A03", name: "뷰포트 설정", category: "메타 태그", maxScore: 3, description: "모바일 뷰포트 메타 태그 설정" },
  { id: "meta-canonical", standardId: "A04", name: "캐노니컬 URL", category: "메타 태그", maxScore: 5, description: "정규 URL 설정으로 중복 콘텐츠 방지" },
  { id: "meta-robots", standardId: "A05", name: "로봇 메타 태그", category: "메타 태그", maxScore: 5, description: "검색엔진 크롤링/인덱싱 지시" },
  { id: "meta-charset", standardId: "A06", name: "문자 인코딩", category: "메타 태그", maxScore: 2, description: "UTF-8 문자 인코딩 설정" },
  { id: "meta-lang", standardId: "A07", name: "언어 설정", category: "메타 태그", maxScore: 3, description: "HTML lang 속성 설정" },

  // 콘텐츠 구조 (6항목)
  { id: "content-h1", standardId: "B01", name: "H1 태그", category: "콘텐츠 구조", maxScore: 8, description: "페이지당 하나의 H1 태그 존재" },
  { id: "content-heading-hierarchy", standardId: "B02", name: "제목 계층 구조", category: "콘텐츠 구조", maxScore: 6, description: "H1→H2→H3 순서 준수" },
  { id: "content-images-alt", standardId: "B03", name: "이미지 Alt 태그", category: "콘텐츠 구조", maxScore: 6, description: "모든 이미지에 대체 텍스트 설정" },
  { id: "content-word-count", standardId: "B04", name: "콘텐츠 분량", category: "콘텐츠 구조", maxScore: 5, description: "충분한 텍스트 콘텐츠 보유" },
  { id: "content-internal-links", standardId: "B05", name: "내부 링크", category: "콘텐츠 구조", maxScore: 5, description: "적절한 내부 링크 구조" },
  { id: "content-external-links", standardId: "B06", name: "외부 링크", category: "콘텐츠 구조", maxScore: 5, description: "신뢰할 수 있는 외부 링크" },

  // 홈페이지 기본 설정 (5항목)
  { id: "basic-ssl", standardId: "C01", name: "SSL 인증서", category: "홈페이지 기본 설정", maxScore: 10, description: "HTTPS 보안 연결" },
  { id: "basic-mobile", standardId: "C02", name: "모바일 최적화", category: "홈페이지 기본 설정", maxScore: 5, description: "반응형 디자인 적용" },
  { id: "basic-speed", standardId: "C03", name: "서버 응답 속도 (TTFB)", category: "홈페이지 기본 설정", maxScore: 5, description: "서버 응답 시간 800ms 이하" },
  { id: "basic-favicon", standardId: "C04", name: "파비콘", category: "홈페이지 기본 설정", maxScore: 5, description: "파비콘 설정" },
  { id: "basic-404", standardId: "C05", name: "404 페이지", category: "홈페이지 기본 설정", maxScore: 5, description: "사용자 친화적 404 페이지" },

  // 검색 고급 설정 (5항목)
  { id: "advanced-schema", standardId: "D01", name: "Schema Markup", category: "검색 고급 설정", maxScore: 5, description: "구조화된 데이터 마크업" },
  { id: "advanced-sitemap", standardId: "D02", name: "사이트맵", category: "검색 고급 설정", maxScore: 5, description: "XML 사이트맵 제출" },
  { id: "advanced-robots-txt", standardId: "D03", name: "robots.txt", category: "검색 고급 설정", maxScore: 5, description: "robots.txt 파일 설정" },
  { id: "advanced-open-graph", standardId: "D04", name: "Open Graph", category: "검색 고급 설정", maxScore: 5, description: "소셜 미디어 공유 메타 태그" },
  { id: "advanced-breadcrumb", standardId: "D05", name: "브레드크럼", category: "검색 고급 설정", maxScore: 5, description: "탐색 경로 표시" },

  // 네이버 검색 최적화 (5항목)
  { id: "naver-verification", standardId: "F01", name: "네이버 사이트 인증", category: "네이버 검색 최적화", maxScore: 5, description: "네이버 웹마스터 도구 인증" },
  { id: "naver-blog-link", standardId: "F02", name: "네이버 블로그 연결", category: "네이버 검색 최적화", maxScore: 5, description: "네이버 블로그 링크 존재" },
  { id: "naver-map", standardId: "F03", name: "네이버 지도 등록", category: "네이버 검색 최적화", maxScore: 5, description: "네이버 플레이스 등록" },
  { id: "naver-korean-content", standardId: "F04", name: "한국어 콘텐츠", category: "네이버 검색 최적화", maxScore: 5, description: "한국어 콘텐츠 비율" },
  { id: "naver-mobile-friendly", standardId: "F05", name: "모바일 친화성", category: "네이버 검색 최적화", maxScore: 5, description: "네이버 모바일 검색 최적화" },

  // 소셜 미디어 (2항목)
  { id: "social-og", standardId: "E01", name: "OG 태그", category: "소셜 미디어", maxScore: 5, description: "Open Graph 메타 태그" },
  { id: "social-twitter", standardId: "E02", name: "Twitter Card", category: "소셜 미디어", maxScore: 5, description: "트위터 카드 메타 태그" },

  // 병원 특화 SEO (6항목)
  { id: "hospital-schema", standardId: "G01", name: "병원 Schema", category: "병원 특화 SEO", maxScore: 5, description: "MedicalOrganization 스키마" },
  { id: "hospital-doctor-page", standardId: "G02", name: "의료진 페이지", category: "병원 특화 SEO", maxScore: 5, description: "의료진 소개 페이지 존재" },
  { id: "hospital-treatment-page", standardId: "G03", name: "진료 안내 페이지", category: "병원 특화 SEO", maxScore: 5, description: "진료과목 상세 페이지" },
  { id: "hospital-location", standardId: "G04", name: "위치 정보", category: "병원 특화 SEO", maxScore: 5, description: "주소/지도 정보 제공" },
  { id: "hospital-hours", standardId: "G05", name: "진료 시간", category: "병원 특화 SEO", maxScore: 5, description: "진료 시간 정보 제공" },
  { id: "hospital-booking", standardId: "G06", name: "예약 시스템", category: "병원 특화 SEO", maxScore: 5, description: "온라인 예약 기능" },

  // AI 검색 노출 (12항목)
  { id: "ai-structured-data", standardId: "H01", name: "AI 구조화 데이터", category: "AI 검색 노출", maxScore: 5, description: "AI 검색엔진 최적화 데이터" },
  { id: "ai-faq-schema", standardId: "H02", name: "FAQ Schema", category: "AI 검색 노출", maxScore: 5, description: "FAQ 구조화 데이터" },
  { id: "ai-how-to-schema", standardId: "H03", name: "HowTo Schema", category: "AI 검색 노출", maxScore: 5, description: "절차 설명 구조화 데이터" },
  { id: "ai-content-depth", standardId: "H04", name: "콘텐츠 깊이", category: "AI 검색 노출", maxScore: 5, description: "AI가 인용할 수 있는 깊이 있는 콘텐츠" },
  { id: "ai-entity-clarity", standardId: "H05", name: "엔티티 명확성", category: "AI 검색 노출", maxScore: 5, description: "병원/의사 엔티티 명확한 정의" },
  { id: "ai-citation-worthy", standardId: "H06", name: "인용 가치", category: "AI 검색 노출", maxScore: 5, description: "AI가 인용할 만한 전문 콘텐츠" },
  { id: "ai-freshness", standardId: "H07", name: "콘텐츠 최신성", category: "AI 검색 노출", maxScore: 5, description: "최근 업데이트된 콘텐츠" },
  { id: "ai-authority-signals", standardId: "H08", name: "권위 신호", category: "AI 검색 노출", maxScore: 5, description: "전문성/권위성 신호" },
  { id: "ai-multimodal", standardId: "H09", name: "멀티모달 콘텐츠", category: "AI 검색 노출", maxScore: 5, description: "이미지/비디오 등 다양한 형태" },
  { id: "ai-local-relevance", standardId: "H10", name: "지역 관련성", category: "AI 검색 노출", maxScore: 5, description: "지역 기반 AI 검색 최적화" },
  { id: "ai-review-signals", standardId: "H11", name: "리뷰 신호", category: "AI 검색 노출", maxScore: 5, description: "환자 리뷰/평점 데이터" },
  { id: "ai-knowledge-graph", standardId: "H12", name: "지식 그래프", category: "AI 검색 노출", maxScore: 5, description: "지식 그래프 연결 가능성" },
];

// ── #11 가중치 합산 검증 로직 ──
export function validateCategoryWeights(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const categoryTotals: Record<string, number> = {};

  for (const item of CHECK_ITEM_REGISTRY) {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.maxScore;
  }

  // 각 카테고리의 실제 합계와 선언된 만점 비교
  for (const [category, declaredMax] of Object.entries(CATEGORY_MAX_SCORES)) {
    const actual = categoryTotals[category] || 0;
    if (actual !== declaredMax) {
      errors.push(`[${category}] 선언된 만점 ${declaredMax} ≠ 실제 합계 ${actual}`);
    }
  }

  // 레지스트리에 있지만 CATEGORY_MAX_SCORES에 없는 카테고리 확인
  for (const cat of Object.keys(categoryTotals)) {
    if (!(cat in CATEGORY_MAX_SCORES)) {
      errors.push(`[${cat}] CATEGORY_MAX_SCORES에 미등록`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── #12 카테고리별 최소 항목 수 보장 검증 ──
export function validateMinItems(items: { category: string }[]): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const categoryCounts: Record<string, number> = {};

  for (const item of items) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  for (const [category, minCount] of Object.entries(CATEGORY_MIN_ITEMS)) {
    const actual = categoryCounts[category] || 0;
    if (actual < minCount) {
      warnings.push(`[${category}] 최소 ${minCount}개 필요, 실제 ${actual}개`);
    }
  }

  return { valid: warnings.length === 0, warnings };
}

// ── 레지스트리에서 항목 조회 ──
export function getRegistryItem(id: string): CheckItemDef | undefined {
  return CHECK_ITEM_REGISTRY.find(item => item.id === id);
}

export function getRegistryByCategory(category: string): CheckItemDef[] {
  return CHECK_ITEM_REGISTRY.filter(item => item.category === category);
}

export function getCategoryMaxScore(category: string): number {
  return CATEGORY_MAX_SCORES[category] || 0;
}

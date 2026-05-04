/**
 * #23 키워드 노출 코드 기반 전환
 * 
 * LLM 의존을 줄이고 정규식/DOM 파싱으로 키워드 노출 여부를 코드 기반으로 판단
 * - 타이틀, H1~H3, 메타 description, 본문에서 키워드 존재 여부 확인
 * - 키워드 밀도(density) 계산
 * - 키워드 위치 점수 (상단 배치 가점)
 */

export interface KeywordExposureResult {
  keyword: string;
  /** 키워드가 발견된 위치들 */
  foundIn: KeywordLocation[];
  /** 키워드 밀도 (%) */
  density: number;
  /** 키워드 위치 점수 (0-100) */
  positionScore: number;
  /** 종합 노출 점수 (0-100) */
  exposureScore: number;
  /** 노출 상태 */
  status: "excellent" | "good" | "weak" | "missing";
}

export interface KeywordLocation {
  element: "title" | "h1" | "h2" | "h3" | "meta-description" | "meta-keywords" | "body-top" | "body-mid" | "body-bottom" | "alt" | "url";
  count: number;
  weight: number;
}

// 위치별 가중치
const LOCATION_WEIGHTS: Record<string, number> = {
  "title": 30,
  "h1": 25,
  "meta-description": 15,
  "url": 15,
  "h2": 10,
  "h3": 5,
  "meta-keywords": 5,
  "body-top": 8,
  "body-mid": 3,
  "body-bottom": 2,
  "alt": 5,
};

/**
 * 키워드의 정규식 패턴 생성 (한글/영어 모두 지원)
 */
function createKeywordRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "gi");
}

/**
 * 텍스트에서 키워드 출현 횟수 계산
 */
function countOccurrences(text: string, keyword: string): number {
  const regex = createKeywordRegex(keyword);
  return (text.match(regex) || []).length;
}

/**
 * HTML 파싱 없이 태그 내용 추출 (간이 파서)
 */
function extractTagContent(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push(match[1].replace(/<[^>]+>/g, "").trim());
  }
  return results;
}

/**
 * 키워드 노출 분석 (코드 기반)
 */
export function analyzeKeywordExposure(params: {
  keyword: string;
  url: string;
  html: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  bodyText: string;
}): KeywordExposureResult {
  const { keyword, url, html, title, metaDescription, metaKeywords, bodyText } = params;
  const foundIn: KeywordLocation[] = [];

  // 1. URL 확인
  const urlKeywordCount = countOccurrences(decodeURIComponent(url), keyword);
  if (urlKeywordCount > 0) {
    foundIn.push({ element: "url", count: urlKeywordCount, weight: LOCATION_WEIGHTS["url"] });
  }

  // 2. 타이틀 확인
  const titleCount = countOccurrences(title, keyword);
  if (titleCount > 0) {
    foundIn.push({ element: "title", count: titleCount, weight: LOCATION_WEIGHTS["title"] });
  }

  // 3. H1 확인
  const h1s = extractTagContent(html, "h1");
  const h1Count = h1s.reduce((sum, h) => sum + countOccurrences(h, keyword), 0);
  if (h1Count > 0) {
    foundIn.push({ element: "h1", count: h1Count, weight: LOCATION_WEIGHTS["h1"] });
  }

  // 4. H2 확인
  const h2s = extractTagContent(html, "h2");
  const h2Count = h2s.reduce((sum, h) => sum + countOccurrences(h, keyword), 0);
  if (h2Count > 0) {
    foundIn.push({ element: "h2", count: h2Count, weight: LOCATION_WEIGHTS["h2"] });
  }

  // 5. H3 확인
  const h3s = extractTagContent(html, "h3");
  const h3Count = h3s.reduce((sum, h) => sum + countOccurrences(h, keyword), 0);
  if (h3Count > 0) {
    foundIn.push({ element: "h3", count: h3Count, weight: LOCATION_WEIGHTS["h3"] });
  }

  // 6. 메타 description 확인
  const metaDescCount = countOccurrences(metaDescription, keyword);
  if (metaDescCount > 0) {
    foundIn.push({ element: "meta-description", count: metaDescCount, weight: LOCATION_WEIGHTS["meta-description"] });
  }

  // 7. 메타 keywords 확인
  const metaKwCount = countOccurrences(metaKeywords, keyword);
  if (metaKwCount > 0) {
    foundIn.push({ element: "meta-keywords", count: metaKwCount, weight: LOCATION_WEIGHTS["meta-keywords"] });
  }

  // 8. 본문 위치별 확인 (상단/중간/하단)
  if (bodyText.length > 0) {
    const third = Math.floor(bodyText.length / 3);
    const topText = bodyText.substring(0, third);
    const midText = bodyText.substring(third, third * 2);
    const bottomText = bodyText.substring(third * 2);

    const topCount = countOccurrences(topText, keyword);
    const midCount = countOccurrences(midText, keyword);
    const bottomCount = countOccurrences(bottomText, keyword);

    if (topCount > 0) foundIn.push({ element: "body-top", count: topCount, weight: LOCATION_WEIGHTS["body-top"] });
    if (midCount > 0) foundIn.push({ element: "body-mid", count: midCount, weight: LOCATION_WEIGHTS["body-mid"] });
    if (bottomCount > 0) foundIn.push({ element: "body-bottom", count: bottomCount, weight: LOCATION_WEIGHTS["body-bottom"] });
  }

  // 9. 이미지 alt 태그 확인
  const altRegex = /alt="([^"]*)"/gi;
  let altMatch;
  let altCount = 0;
  while ((altMatch = altRegex.exec(html)) !== null) {
    altCount += countOccurrences(altMatch[1], keyword);
  }
  if (altCount > 0) {
    foundIn.push({ element: "alt", count: altCount, weight: LOCATION_WEIGHTS["alt"] });
  }

  // 키워드 밀도 계산
  const totalWords = bodyText.split(/\s+/).length || 1;
  const totalKeywordCount = countOccurrences(bodyText, keyword);
  const density = (totalKeywordCount / totalWords) * 100;

  // 위치 점수 계산 (가중치 합산, 최대 100)
  const positionScore = Math.min(100, foundIn.reduce((sum, loc) => sum + loc.weight, 0));

  // 종합 노출 점수
  const densityScore = Math.min(30, density * 10); // 밀도 점수 (최대 30)
  const exposureScore = Math.min(100, Math.round(positionScore * 0.7 + densityScore));

  // 상태 판단
  let status: "excellent" | "good" | "weak" | "missing";
  if (exposureScore >= 70) status = "excellent";
  else if (exposureScore >= 40) status = "good";
  else if (exposureScore > 0) status = "weak";
  else status = "missing";

  return {
    keyword,
    foundIn,
    density: Math.round(density * 100) / 100,
    positionScore,
    exposureScore,
    status,
  };
}

/**
 * 여러 키워드에 대해 일괄 분석
 */
export function analyzeMultipleKeywords(params: {
  keywords: string[];
  url: string;
  html: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  bodyText: string;
}): KeywordExposureResult[] {
  return params.keywords.map(keyword =>
    analyzeKeywordExposure({ ...params, keyword })
  );
}

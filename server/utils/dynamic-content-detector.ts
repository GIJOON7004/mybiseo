/**
 * #20 동적 콘텐츠 감지
 * 
 * 정적 HTML과 JS 렌더링 후 콘텐츠를 비교하여
 * 동적으로 로딩되는 콘텐츠 비율을 측정
 */

export interface DynamicContentResult {
  /** 정적 HTML에서 추출한 텍스트 길이 */
  staticTextLength: number;
  /** 동적 콘텐츠 비율 (0-100%) */
  dynamicRatio: number;
  /** 동적 콘텐츠 감지 여부 */
  hasDynamicContent: boolean;
  /** 감지된 동적 콘텐츠 패턴 */
  patterns: DynamicPattern[];
  /** SEO 영향도 (검색엔진이 정적 HTML만 읽을 때의 위험도) */
  seoRisk: "low" | "medium" | "high";
}

export interface DynamicPattern {
  type: "lazy-load" | "spa-routing" | "ajax-content" | "infinite-scroll" | "client-render";
  evidence: string;
  impact: string;
}

// 동적 콘텐츠 로딩 패턴 감지 (HTML 소스 분석)
const DYNAMIC_PATTERNS = [
  {
    type: "lazy-load" as const,
    regex: /data-src|loading="lazy"|data-lazy|lazyload/gi,
    evidence: "이미지/콘텐츠 지연 로딩 감지",
    impact: "검색엔진 크롤러가 이미지를 인덱싱하지 못할 수 있음",
  },
  {
    type: "spa-routing" as const,
    regex: /react-root|__next|__nuxt|ng-app|data-reactroot|id="app"|id="root"/gi,
    evidence: "SPA 프레임워크 감지",
    impact: "서버사이드 렌더링(SSR) 없이는 검색엔진이 콘텐츠를 읽지 못할 수 있음",
  },
  {
    type: "ajax-content" as const,
    regex: /fetch\(|XMLHttpRequest|axios\.|\.ajax\(|\$\.get\(|\$\.post\(/gi,
    evidence: "AJAX 동적 콘텐츠 로딩 감지",
    impact: "페이지 로드 후 추가 데이터를 가져오므로 초기 HTML에 콘텐츠 부재",
  },
  {
    type: "infinite-scroll" as const,
    regex: /IntersectionObserver|infinite.?scroll|load.?more|pagination.*ajax/gi,
    evidence: "무한 스크롤/동적 페이지네이션 감지",
    impact: "추가 콘텐츠가 스크롤 시에만 로딩되어 검색엔진이 인덱싱 불가",
  },
  {
    type: "client-render" as const,
    regex: /document\.getElementById\(['"](app|root|main)['"]\)|ReactDOM\.render|createApp|hydrate/gi,
    evidence: "클라이언트 사이드 렌더링 감지",
    impact: "HTML 본문이 비어있고 JS가 콘텐츠를 생성하므로 SEO에 불리",
  },
];

/**
 * 정적 HTML에서 동적 콘텐츠 패턴을 감지
 */
export function detectDynamicContent(html: string, bodyText: string): DynamicContentResult {
  const patterns: DynamicPattern[] = [];

  // 패턴 매칭
  for (const pattern of DYNAMIC_PATTERNS) {
    const matches = html.match(pattern.regex);
    if (matches && matches.length > 0) {
      patterns.push({
        type: pattern.type,
        evidence: `${pattern.evidence} (${matches.length}건)`,
        impact: pattern.impact,
      });
    }
  }

  // 정적 텍스트 길이 분석
  const staticTextLength = bodyText.length;

  // 동적 콘텐츠 비율 추정
  // - body가 매우 짧고 JS가 많으면 동적 비율 높음
  const scriptTags = (html.match(/<script[\s>]/gi) || []).length;
  const bodyHtmlLength = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "").length;
  const scriptRatio = scriptTags > 0 ? Math.min(scriptTags * 5, 50) : 0;
  
  // body 내 실제 텍스트 vs HTML 비율
  const textToHtmlRatio = bodyHtmlLength > 0 ? (staticTextLength / bodyHtmlLength) * 100 : 100;
  
  // 동적 비율 계산
  let dynamicRatio = 0;
  if (patterns.some(p => p.type === "spa-routing" || p.type === "client-render")) {
    dynamicRatio = Math.max(dynamicRatio, 60);
  }
  if (patterns.some(p => p.type === "ajax-content")) {
    dynamicRatio = Math.max(dynamicRatio, 40);
  }
  if (staticTextLength < 200 && scriptTags > 3) {
    dynamicRatio = Math.max(dynamicRatio, 70);
  }
  if (textToHtmlRatio < 10 && scriptTags > 2) {
    dynamicRatio = Math.max(dynamicRatio, 50);
  }
  dynamicRatio = Math.min(100, dynamicRatio + scriptRatio * 0.3);

  // SEO 위험도 판단
  let seoRisk: "low" | "medium" | "high" = "low";
  if (dynamicRatio >= 60 || patterns.some(p => p.type === "client-render")) {
    seoRisk = "high";
  } else if (dynamicRatio >= 30 || patterns.length >= 2) {
    seoRisk = "medium";
  }

  return {
    staticTextLength,
    dynamicRatio: Math.round(dynamicRatio),
    hasDynamicContent: patterns.length > 0,
    patterns,
    seoRisk,
  };
}

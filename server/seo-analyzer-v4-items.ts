/**
 * SEO Analyzer v4 추가 항목 모듈
 * 기존 47개 항목에 53개를 추가하여 총 100개 항목으로 확장
 * 4개 신규 카테고리 + 기존 카테고리 확장
 */
import * as cheerio from "cheerio";
import type { SeoCheckItem } from "./seo-analyzer-types";
import type { AggregatedData } from "./multi-page-crawler";
import type { PageSpeedMetrics } from "./pagespeed-client";

interface AnalysisContext {
  $: cheerio.CheerioAPI;
  html: string;
  bodyText: string;
  wordCount: number;
  baseUrl: string;
  responseHeaders: Record<string, string>;
  robotsTxt: string;
  robotsExists: boolean;
  jsonLdTypes: string[];
  jsonLdData: any[];
  fetchOk: boolean;
  responseTime: number;
  effectiveTitle: string;
  metaDesc: string;
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
  htmlLang: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  totalImages: number;
  imagesWithAlt: number;
  internalLinks: number;
  externalLinks: number;
  country?: "kr" | "th";
  /** 다중 페이지 크롤링 종합 데이터 */
  agg?: AggregatedData;
  /** Google PageSpeed Insights 실측 데이터 */
  pageSpeed?: PageSpeedMetrics | null;
}

export function generateAdditionalItems(ctx: AnalysisContext): SeoCheckItem[] {
  const { $, html, bodyText, wordCount, baseUrl, responseHeaders, robotsTxt, robotsExists,
    jsonLdTypes, jsonLdData, fetchOk, responseTime, effectiveTitle, metaDesc,
    ogTitle, ogDesc, ogImage, htmlLang, h1Count, h2Count, h3Count,
    totalImages, imagesWithAlt, internalLinks, externalLinks, country = "kr" } = ctx;
  const pageSpeed = ctx.pageSpeed;

  const items: SeoCheckItem[] = [];

  // ═══════════════════════════════════════════════════════════════
  // 기존 카테고리 확장 항목 (21개)
  // ═══════════════════════════════════════════════════════════════

  // ── 메타 태그 확장 (3개) ──

  // 1-8. OG 이미지 크기 적합성 (3점)
  const ogImgTag = $('meta[property="og:image"]').attr("content") || "";
  const ogImgWidth = $('meta[property="og:image:width"]').attr("content") || "";
  const ogImgHeight = $('meta[property="og:image:height"]').attr("content") || "";
  const hasOgImgDimensions = !!(ogImgWidth && ogImgHeight);
  const optimalOgSize = ogImgWidth === "1200" && ogImgHeight === "630";
  items.push({
    id: "meta-og-image-size",
    category: "메타 태그",
    name: "OG 이미지 크기 설정",
    status: optimalOgSize ? "pass" : hasOgImgDimensions ? "warning" : ogImgTag ? "warning" : "fail",
    score: optimalOgSize ? 3 : hasOgImgDimensions ? 2 : ogImgTag ? 1 : 0,
    maxScore: 3,
    detail: optimalOgSize ? "OG 이미지 크기: 1200x630 (최적)" : hasOgImgDimensions ? `OG 이미지 크기: ${ogImgWidth}x${ogImgHeight}` : ogImgTag ? "OG 이미지는 있지만 크기 정보가 없습니다." : "OG 이미지가 없습니다.",
    recommendation: optimalOgSize ? "OG 이미지 크기가 최적입니다." : "og:image:width=1200, og:image:height=630으로 설정하세요. SNS 공유 시 최적의 미리보기가 표시됩니다.",
    impact: "SNS 공유 시 이미지 크기가 맞지 않으면 잘리거나 흐릿하게 표시됩니다. 1200x630은 모든 플랫폼에서 최적의 크기입니다.",
  });

  // 1-9. 중복 메타 태그 검사 (3점)
  const titleTags = $("title").length;
  const descTags = $('meta[name="description"]').length;
  const canonicalTags = $('link[rel="canonical"]').length;
  const hasDuplicates = titleTags > 1 || descTags > 1 || canonicalTags > 1;
  items.push({
    id: "meta-duplicates",
    category: "메타 태그",
    name: "중복 메타 태그 검사",
    status: hasDuplicates ? "fail" : "pass",
    score: hasDuplicates ? 0 : 3,
    maxScore: 3,
    detail: hasDuplicates ? `중복 발견: ${[titleTags > 1 && `title(${titleTags}개)`, descTags > 1 && `description(${descTags}개)`, canonicalTags > 1 && `canonical(${canonicalTags}개)`].filter(Boolean).join(', ')}` : "중복 메타 태그가 없습니다.",
    recommendation: hasDuplicates ? "중복된 메타 태그를 제거하세요. 중복 태그는 검색엔진을 혼란시킵니다." : "메타 태그가 중복 없이 잘 설정되어 있습니다.",
    impact: "중복 메타 태그가 있으면 검색엔진이 어떤 값을 사용할지 혼란스러워하며, 의도하지 않은 정보가 검색 결과에 표시될 수 있습니다.",
  });

  // 1-10. 메타 설명 키워드 포함 (3점)
  const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim() || "";
  const descHasKeyword = metaKeywords ? metaKeywords.split(",").some((k: any) => metaDesc.toLowerCase().includes(k.trim().toLowerCase())) : false;
  items.push({
    id: "meta-desc-keyword",
    category: "메타 태그",
    name: "메타 설명 키워드 포함",
    status: !metaKeywords ? "warning" : descHasKeyword ? "pass" : "fail",
    score: !metaKeywords ? 1 : descHasKeyword ? 3 : 0,
    maxScore: 3,
    detail: !metaKeywords ? "메타 키워드가 없어 비교 불가" : descHasKeyword ? "메타 설명에 핵심 키워드가 포함되어 있습니다." : "메타 설명에 핵심 키워드가 포함되어 있지 않습니다.",
    recommendation: descHasKeyword ? "메타 설명에 키워드가 잘 포함되어 있습니다." : "메타 설명에 핵심 키워드를 자연스럽게 포함하세요. 검색 결과에서 키워드가 굵게 표시되어 클릭률이 높아집니다.",
    impact: "메타 설명에 검색 키워드가 포함되면 검색 결과에서 해당 키워드가 굵게 표시되어 클릭률이 15-20% 향상됩니다.",
  });

  // ── 콘텐츠 구조 확장 (4개) ──

  // 2-7. 비디오 콘텐츠 (4점)
  const hasVideo = $("video").length > 0 || $("iframe[src*='youtube']").length > 0 || $("iframe[src*='vimeo']").length > 0 || html.includes("youtube.com/embed") || html.includes("player.vimeo.com");
  items.push({
    id: "content-video",
    category: "콘텐츠 구조",
    name: "비디오 콘텐츠",
    status: hasVideo ? "pass" : "warning",
    score: hasVideo ? 4 : 0,
    maxScore: 4,
    detail: hasVideo ? "비디오 콘텐츠가 포함되어 있습니다." : "비디오 콘텐츠가 없습니다.",
    recommendation: hasVideo ? "비디오 콘텐츠가 잘 활용되고 있습니다." : "시술 과정, 원장 인터뷰, 병원 소개 영상을 추가하세요. 비디오가 있는 페이지는 검색 결과에서 53배 더 높은 노출 확률을 가집니다.",
    impact: "구글은 비디오가 포함된 페이지를 검색 결과 상단에 노출합니다. 특히 '비디오 캐러셀'에 표시되면 클릭률이 크게 높아집니다.",
  });

  // 2-8. 테이블 구조 데이터 (3점)
  const tableCount = $("table").length;
  items.push({
    id: "content-table",
    category: "콘텐츠 구조",
    name: "테이블 구조 데이터",
    status: tableCount >= 1 ? "pass" : "warning",
    score: tableCount >= 1 ? 3 : 0,
    maxScore: 3,
    detail: tableCount > 0 ? `테이블 ${tableCount}개 발견` : "테이블 구조가 없습니다.",
    recommendation: tableCount >= 1 ? "테이블이 잘 활용되고 있습니다." : "진료 시간, 비용 비교, 시술 종류 등을 테이블로 정리하세요. AI 검색엔진은 테이블 데이터를 직접 인용합니다.",
    impact: "테이블로 정리된 정보는 AI가 비교 답변을 생성할 때 직접 인용합니다. 비용표, 진료시간표 등이 특히 효과적입니다.",
  });

  // 2-9. 콘텐츠 가독성 (4점)
  const paragraphs = $("p");
  const avgParagraphLen = paragraphs.length > 0 ? bodyText.length / paragraphs.length : 0;
  const goodReadability = avgParagraphLen > 50 && avgParagraphLen < 500 && h2Count >= 2;
  items.push({
    id: "content-readability",
    category: "콘텐츠 구조",
    name: "콘텐츠 가독성",
    status: goodReadability ? "pass" : paragraphs.length > 3 ? "warning" : "fail",
    score: goodReadability ? 4 : paragraphs.length > 3 ? 2 : 0,
    maxScore: 4,
    detail: `문단 ${paragraphs.length}개, 평균 길이 ${Math.round(avgParagraphLen)}자, 소제목 ${h2Count}개`,
    recommendation: goodReadability ? "콘텐츠 가독성이 좋습니다." : "문단을 50-500자로 나누고, 소제목(H2)을 2개 이상 사용하세요. 긴 텍스트 블록은 환자들이 읽기 어려워합니다.",
    impact: "가독성이 좋은 콘텐츠는 사용자 체류 시간을 늘리고, 이는 검색 순위에 긍정적 영향을 미칩니다.",
  });

  // 2-10. 이미지 최적화 (4점)
  const lazyImages = $("img[loading='lazy']").length;
  const imagesWithDimensions = $("img[width][height]").length;
  const webpImages = $("img[src*='.webp'], source[type='image/webp'], picture source[srcset*='.webp']").length;
  const imgOptSignals = [lazyImages > 0, imagesWithDimensions > 0, webpImages > 0].filter(Boolean).length;
  items.push({
    id: "content-img-optimization",
    category: "콘텐츠 구조",
    name: "이미지 최적화 기법",
    status: imgOptSignals >= 2 ? "pass" : imgOptSignals >= 1 ? "warning" : totalImages === 0 ? "warning" : "fail",
    score: imgOptSignals >= 2 ? 4 : imgOptSignals >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `${[lazyImages > 0 && `lazy loading(${lazyImages}개)`, imagesWithDimensions > 0 && `크기 지정(${imagesWithDimensions}개)`, webpImages > 0 && `WebP 형식(${webpImages}개)`].filter(Boolean).join(', ') || '이미지 최적화 없음'}`,
    recommendation: imgOptSignals >= 2 ? "이미지 최적화가 잘 되어 있습니다." : "loading='lazy', width/height 속성, WebP 형식을 사용하세요. 이미지 최적화는 페이지 속도를 크게 향상시킵니다.",
    impact: "최적화되지 않은 이미지는 페이지 로딩 속도를 크게 저하시킵니다. 구글 Core Web Vitals에서 LCP(최대 콘텐츠 페인트)에 직접 영향을 미칩니다.",
  });

  // ── 홈페이지 기본 설정 확장 (3개) ──

  // 3-6. HTTP/2 지원 (3점) — 감지 개선
  const altSvc = responseHeaders["alt-svc"] || "";
  const hasHttp2 = altSvc.includes("h2") || altSvc.includes("h3") ||
    (responseHeaders["server"] || "").toLowerCase().includes("cloudflare") ||
    (responseHeaders["server"] || "").toLowerCase().includes("nginx") ||
    (responseHeaders["via"] || "").includes("2") ||
    !!(responseHeaders["x-served-by"]) || // CDN은 대부분 HTTP/2 지원
    false;
  items.push({
    id: "tech-http2",
    category: "홈페이지 기본 설정",
    name: "HTTP/2 또는 HTTP/3 지원",
    status: hasHttp2 ? "pass" : "warning",
    score: hasHttp2 ? 3 : 0,
    maxScore: 3,
    detail: hasHttp2 ? "HTTP/2 이상 프로토콜이 지원됩니다." : "HTTP/2 지원을 확인할 수 없습니다.",
    recommendation: hasHttp2 ? "최신 HTTP 프로토콜이 지원됩니다." : "HTTP/2를 지원하는 웹서버로 업그레이드하세요. 리소스 로딩 속도가 크게 향상됩니다.",
    impact: "HTTP/2는 멀티플렉싱을 통해 여러 리소스를 동시에 로드합니다. 이미지가 많은 병원 사이트에서 특히 효과적입니다.",
  });

  // 3-7. 압축 전송 (3점)
  const contentEncoding = responseHeaders["content-encoding"] || "";
  const hasCompression = contentEncoding.includes("gzip") || contentEncoding.includes("br") || contentEncoding.includes("deflate");
  items.push({
    id: "tech-compression",
    category: "홈페이지 기본 설정",
    name: "압축 전송 (Gzip/Brotli)",
    status: hasCompression ? "pass" : "warning",
    score: hasCompression ? 3 : 0,
    maxScore: 3,
    detail: hasCompression ? `압축 방식: ${contentEncoding}` : "압축 전송이 감지되지 않았습니다.",
    recommendation: hasCompression ? "콘텐츠 압축이 적용되어 있습니다." : "Gzip 또는 Brotli 압축을 활성화하세요. 전송 크기를 60-80% 줄일 수 있습니다.",
    impact: "압축을 사용하면 페이지 전송 크기가 크게 줄어들어 로딩 속도가 향상됩니다.",
  });

  // 3-8. 캐시 헤더 (3점)
  const cacheControl = responseHeaders["cache-control"] || "";
  const hasEtag = !!responseHeaders["etag"];
  const hasCacheHeaders = cacheControl.length > 0 || hasEtag;
  items.push({
    id: "tech-cache",
    category: "홈페이지 기본 설정",
    name: "캐시 헤더 설정",
    status: hasCacheHeaders ? "pass" : "warning",
    score: hasCacheHeaders ? 3 : 0,
    maxScore: 3,
    detail: hasCacheHeaders ? `Cache-Control: ${cacheControl || '없음'}, ETag: ${hasEtag ? '있음' : '없음'}` : "캐시 헤더가 설정되지 않았습니다.",
    recommendation: hasCacheHeaders ? "캐시 헤더가 설정되어 있습니다." : "Cache-Control 헤더를 설정하세요. 재방문 시 로딩 속도가 크게 향상됩니다.",
    impact: "캐시 헤더가 없으면 매 방문마다 모든 리소스를 다시 다운로드합니다. 재방문 환자의 경험이 크게 저하됩니다.",
  });

  // ── 소셜 미디어 확장 (3개) ──

  // 4-3. 소셜 미디어 링크 (3점) — 국가별 분기
  const hasInstagram = html.includes("instagram.com") || $("a[href*='instagram.com']").length > 0;
  const hasYoutube = html.includes("youtube.com") || $("a[href*='youtube.com']").length > 0;
  if (country === "th") {
    // 태국: LINE + Facebook 체크
    const hasLINE = html.includes("line.me") || html.includes("lin.ee") || $("a[href*='line.me']").length > 0 || $("a[href*='lin.ee']").length > 0;
    const hasFacebook = html.includes("facebook.com") || $("a[href*='facebook.com']").length > 0 || $("a[href*='fb.com']").length > 0;
    const thSocialCount = [hasInstagram, hasYoutube, hasLINE, hasFacebook].filter(Boolean).length;
    items.push({
      id: "social-links",
      category: "소셜 미디어",
      name: "소셜 미디어 채널 링크",
      status: thSocialCount >= 2 ? "pass" : thSocialCount >= 1 ? "warning" : "fail",
      score: thSocialCount >= 2 ? 3 : thSocialCount >= 1 ? 1 : 0,
      maxScore: 3,
      detail: `소셜 채널 ${thSocialCount}/4개 연결 (${[hasInstagram && 'Instagram', hasYoutube && 'YouTube', hasLINE && 'LINE', hasFacebook && 'Facebook'].filter(Boolean).join(', ') || '없음'})`,
      recommendation: thSocialCount >= 2 ? "소셜 미디어 채널이 잘 연결되어 있습니다." : "Instagram, YouTube, LINE Official Account, Facebook 페이지 링크를 추가하세요.",
      impact: "태국에서 LINE은 메신저 1위(5,300만+ 사용자), Facebook은 SNS 1위입니다. 소셜 채널 연결은 브랜드 신뢰성과 검색 순위에 직접 영향을 줍니다.",
    });
  } else {
    // 한국: 카카오톡 + 네이버 블로그 체크
    const hasKakao = html.includes("pf.kakao.com") || html.includes("kakao.com/o") || $("a[href*='kakao']").length > 0;
    const hasBlog = html.includes("blog.naver.com") || $("a[href*='blog.naver']").length > 0;
    const krSocialCount = [hasInstagram, hasYoutube, hasKakao, hasBlog].filter(Boolean).length;
    items.push({
      id: "social-links",
      category: "소셜 미디어",
      name: "소셜 미디어 채널 링크",
      status: krSocialCount >= 2 ? "pass" : krSocialCount >= 1 ? "warning" : "fail",
      score: krSocialCount >= 2 ? 3 : krSocialCount >= 1 ? 1 : 0,
      maxScore: 3,
      detail: `소셜 채널 ${krSocialCount}/4개 연결 (${[hasInstagram && '인스타그램', hasYoutube && '유튜브', hasKakao && '카카오톡', hasBlog && '네이버 블로그'].filter(Boolean).join(', ') || '없음'})`,
      recommendation: krSocialCount >= 2 ? "소셜 미디어 채널이 잘 연결되어 있습니다." : "인스타그램, 유튜브, 카카오톡 채널, 네이버 블로그 링크를 추가하세요.",
      impact: "소셜 미디어 링크는 검색엔진에게 브랜드의 신뢰성을 증명합니다. 다양한 채널이 연결된 사이트는 검색 순위에서 유리합니다.",
    });
  }

  // 4-4. 카카오톡/LINE 연동 (3점) — 국가별 분기
  if (country === "th") {
    const hasLINEOfficial = html.includes("line.me") || html.includes("lin.ee") || html.includes("@line") || html.includes("LINE") || $('a[href*="line.me"]').length > 0;
    const hasLINESDK = html.includes("line-sdk") || html.includes("liff.line.me");
    items.push({
      id: "social-line",
      category: "소셜 미디어",
      name: "LINE Official Account 연동",
      status: hasLINEOfficial || hasLINESDK ? "pass" : "warning",
      score: hasLINEOfficial || hasLINESDK ? 3 : 0,
      maxScore: 3,
      detail: `${[hasLINEOfficial && 'LINE Official Account', hasLINESDK && 'LINE SDK'].filter(Boolean).join(', ') || 'LINE 연동 없음'}`,
      recommendation: hasLINEOfficial || hasLINESDK ? "LINE 연동이 되어 있습니다." : "LINE Official Account를 연동하세요. 태국 사용자의 90% 이상이 LINE을 사용합니다.",
      impact: "LINE은 태국에서 가장 많이 사용하는 메신저입니다. LINE 상담 채널이 있으면 환자 문의율이 크게 높아집니다.",
    });
  } else {
    const hasKakaoSDK = html.includes("developers.kakao.com/sdk") || html.includes("kakao.min.js") || html.includes("Kakao.init");
    const hasKakaoChannel = html.includes("pf.kakao.com") || html.includes("카카오톡") || html.includes("카톡");
    items.push({
      id: "social-kakao",
      category: "소셜 미디어",
      name: "카카오톡 연동",
      status: hasKakaoSDK || hasKakaoChannel ? "pass" : "warning",
      score: hasKakaoSDK || hasKakaoChannel ? 3 : 0,
      maxScore: 3,
      detail: `${[hasKakaoSDK && '카카오 SDK', hasKakaoChannel && '카카오 채널'].filter(Boolean).join(', ') || '카카오톡 연동 없음'}`,
      recommendation: hasKakaoSDK || hasKakaoChannel ? "카카오톡 연동이 되어 있습니다." : "카카오톡 채널 또는 카카오 SDK를 연동하세요. 한국 환자의 90%가 카카오톡을 사용합니다.",
      impact: "카카오톡은 한국에서 가장 많이 사용하는 메신저입니다. 카카오톡 상담 채널이 있으면 환자 문의율이 크게 높아집니다.",
    });
  }

  // 4-5. 소셜 프루프 (3점) — 국가별 패턴
  const hasReviewWidget = html.includes("후기") || html.includes("리뷰") || html.includes("review") || html.includes("testimonial") || html.includes("รีวิว");
  const hasRating = html.includes("rating") || html.includes("별점") || html.includes("평점") || html.includes("stars") || $("[itemprop='ratingValue']").length > 0;
  const hasPatientCount = country === "th"
    ? (html.includes("patient") || html.includes("case") || html.includes("ผู้ป่วย")) && (html.includes("+") || /\d{3,}/.test(bodyText))
    : html.includes("명") && (html.includes("누적") || html.includes("시술") || html.includes("환자"));
  const socialProofCount = [hasReviewWidget, hasRating, hasPatientCount].filter(Boolean).length;
  items.push({
    id: "social-proof",
    category: "소셜 미디어",
    name: "소셜 프루프 (후기/평점)",
    status: socialProofCount >= 2 ? "pass" : socialProofCount >= 1 ? "warning" : "fail",
    score: socialProofCount >= 2 ? 3 : socialProofCount >= 1 ? 1 : 0,
    maxScore: 3,
    detail: `소셜 프루프 ${socialProofCount}/3개 (${[hasReviewWidget && '후기/리뷰', hasRating && '별점/평점', hasPatientCount && '누적 환자 수'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: socialProofCount >= 2 ? "소셜 프루프가 잘 구성되어 있습니다." : "환자 후기, 별점, 누적 시술 건수 등을 표시하세요. 사회적 증거는 신뢰도를 크게 높입니다.",
    impact: "환자 후기와 평점은 신규 환자의 의사결정에 가장 큰 영향을 미칩니다. 검색엔진도 리뷰가 있는 사이트를 신뢰합니다.",
  });

  // ── 검색 고급 설정 확장 (3개) ──

  // 5-6. 구글 서치 콘솔 인증 (3점)
  const hasGoogleVerification = $('meta[name="google-site-verification"]').length > 0;
  items.push({
    id: "advanced-google-verification",
    category: "검색 고급 설정",
    name: "구글 서치 콘솔 인증",
    status: hasGoogleVerification ? "pass" : "fail",
    score: hasGoogleVerification ? 3 : 0,
    maxScore: 3,
    detail: hasGoogleVerification ? "구글 서치 콘솔 인증 메타태그가 있습니다." : "구글 서치 콘솔 인증이 없습니다.",
    recommendation: hasGoogleVerification ? "구글 서치 콘솔이 인증되어 있습니다." : "구글 서치 콘솔에 사이트를 등록하고 인증 메타태그를 추가하세요.",
    impact: "구글 서치 콘솔에 등록하면 검색 성과를 모니터링하고, 색인 문제를 빠르게 해결할 수 있습니다.",
  });

  // 5-7. 구조화 데이터 유효성 (3점)
  let jsonLdValid = true;
  let jsonLdErrors = 0;
  $('script[type="application/ld+json"]').each((_: any, el: any) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (!data["@context"] || !data["@type"]) jsonLdErrors++;
    } catch {
      jsonLdValid = false;
      jsonLdErrors++;
    }
  });
  items.push({
    id: "advanced-jsonld-valid",
    category: "검색 고급 설정",
    name: "구조화 데이터 유효성",
    status: jsonLdErrors === 0 && jsonLdData.length > 0 ? "pass" : jsonLdErrors === 0 ? "warning" : "fail",
    score: jsonLdErrors === 0 && jsonLdData.length > 0 ? 3 : jsonLdErrors === 0 ? 1 : 0,
    maxScore: 3,
    detail: jsonLdData.length === 0 ? "구조화 데이터가 없습니다." : jsonLdErrors > 0 ? `구조화 데이터 오류 ${jsonLdErrors}건` : "구조화 데이터가 유효합니다.",
    recommendation: jsonLdData.length === 0 ? "JSON-LD 형식의 구조화 데이터를 추가하세요. @context와 @type은 필수 속성입니다." : jsonLdErrors > 0 ? "구조화 데이터의 JSON-LD 형식 오류를 수정하세요. @context와 @type은 필수입니다." : "구조화 데이터가 유효합니다.",
    impact: "구조화 데이터에 오류가 있으면 검색엔진이 무시합니다. 리치 스니펫이 표시되지 않아 클릭률이 떨어집니다.",
  });

  // 5-8. 페이지네이션 설정 (3점)
  const hasRelNext = $('link[rel="next"]').length > 0;
  const hasRelPrev = $('link[rel="prev"]').length > 0;
  const hasInfiniteScroll = html.includes("infinite-scroll") || html.includes("loadMore") || html.includes("load-more");
  items.push({
    id: "advanced-pagination",
    category: "검색 고급 설정",
    name: "페이지네이션/무한스크롤",
    status: hasRelNext || hasRelPrev ? "pass" : hasInfiniteScroll ? "warning" : "pass",
    score: hasRelNext || hasRelPrev ? 3 : hasInfiniteScroll ? 1 : 2,
    maxScore: 3,
    detail: hasRelNext || hasRelPrev ? "rel=next/prev 페이지네이션이 설정되어 있습니다." : hasInfiniteScroll ? "무한 스크롤이 감지되었지만 rel=next/prev가 없습니다." : "단일 페이지이거나 페이지네이션이 필요하지 않습니다.",
    recommendation: hasInfiniteScroll && !hasRelNext ? "무한 스크롤 사용 시 rel=next/prev 또는 사이트맵에 모든 페이지를 포함하세요." : "페이지네이션이 적절히 설정되어 있습니다.",
    impact: "무한 스크롤만 사용하면 검색엔진이 하단 콘텐츠를 발견하지 못합니다.",
  });

  // ── 네이버 검색 최적화 확장 (3개) ──

  // 6-6. 네이버 스마트 플레이스 연동 (5점)
  const hasNaverPlace = html.includes("place.naver.com") || html.includes("map.naver.com") || html.includes("naver.me");
  items.push({
    id: "naver-smart-place",
    category: "네이버 검색 최적화",
    name: "네이버 스마트 플레이스 연동",
    status: hasNaverPlace ? "pass" : "fail",
    score: hasNaverPlace ? 5 : 0,
    maxScore: 5,
    detail: hasNaverPlace ? "네이버 스마트 플레이스 링크가 있습니다." : "네이버 스마트 플레이스 연동이 없습니다.",
    recommendation: hasNaverPlace ? "네이버 스마트 플레이스가 잘 연동되어 있습니다." : "네이버 스마트 플레이스에 병원을 등록하고 사이트에 링크를 추가하세요. '내 주변 병원' 검색에서 필수입니다.",
    impact: "네이버 스마트 플레이스는 '지역명+병원' 검색 시 최상단에 노출됩니다. 등록하지 않으면 네이버 지도 검색에서 완전히 제외됩니다.",
  });

  // 6-7. 네이버 예약 시스템 연동 (4점)
  const hasNaverBooking = html.includes("booking.naver.com") || html.includes("네이버 예약") || html.includes("naver.com/booking");
  items.push({
    id: "naver-booking",
    category: "네이버 검색 최적화",
    name: "네이버 예약 시스템",
    status: hasNaverBooking ? "pass" : "warning",
    score: hasNaverBooking ? 4 : 0,
    maxScore: 4,
    detail: hasNaverBooking ? "네이버 예약 시스템이 연동되어 있습니다." : "네이버 예약 시스템이 연동되어 있지 않습니다.",
    recommendation: hasNaverBooking ? "네이버 예약이 잘 연동되어 있습니다." : "네이버 예약 시스템을 연동하면 네이버 검색 결과에 '예약' 버튼이 표시됩니다.",
    impact: "네이버 예약이 연동되면 검색 결과에 '예약' 버튼이 표시되어 직접 예약 전환이 가능합니다.",
  });

  // 6-8. 네이버 페이 연동 (3점)
  const hasNaverPay = html.includes("pay.naver.com") || html.includes("네이버페이") || html.includes("naverpay");
  items.push({
    id: "naver-pay",
    category: "네이버 검색 최적화",
    name: "네이버 페이 연동",
    status: hasNaverPay ? "pass" : "warning",
    score: hasNaverPay ? 3 : 0,
    maxScore: 3,
    detail: hasNaverPay ? "네이버 페이가 연동되어 있습니다." : "네이버 페이가 연동되어 있지 않습니다.",
    recommendation: hasNaverPay ? "네이버 페이가 잘 연동되어 있습니다." : "네이버 페이를 연동하면 결제 편의성이 높아지고 네이버 검색에서 우대됩니다.",
    impact: "네이버 페이가 연동된 사이트는 네이버 검색에서 우대 표시를 받을 수 있습니다.",
  });

  // ── 병원 특화 SEO 확장 (4개) ──

  // 7-7. 비포/애프터 갤러리 (5점) — 국가별 패턴
  const galleryPatterns = country === "th"
    ? ["gallery", "before", "after", "result", "transformation", "ก่อน", "หลัง", "ผลงาน"]
    : ["갤러리", "gallery", "before", "after", "비포", "애프터", "전후"];
  const hasGallery = galleryPatterns.some(p => html.toLowerCase().includes(p.toLowerCase()));
  const hasImageGallery = $("img").length >= 10 || $("[class*='gallery']").length > 0 || $("[class*='slider']").length > 0 || $("[class*='carousel']").length > 0;
  items.push({
    id: "hospital-gallery",
    category: "병원 특화 SEO",
    name: "비포/애프터 갤러리",
    status: hasGallery && hasImageGallery ? "pass" : hasGallery || hasImageGallery ? "warning" : "fail",
    score: hasGallery && hasImageGallery ? 5 : hasGallery || hasImageGallery ? 2 : 0,
    maxScore: 5,
    detail: `${[hasGallery && '갤러리/비포애프터 텍스트', hasImageGallery && '이미지 갤러리 구조'].filter(Boolean).join(', ') || '갤러리 없음'}`,
    recommendation: hasGallery && hasImageGallery ? "비포/애프터 갤러리가 잘 구성되어 있습니다." : "시술 전후 사진 갤러리를 추가하세요. 환자들이 가장 관심 있어하는 콘텐츠입니다.",
    impact: "비포/애프터 사진은 환자의 의사결정에 가장 큰 영향을 미치는 콘텐츠입니다. 구글 이미지 검색에서도 노출됩니다.",
  });

  // 7-8. 환자 후기/리뷰 섹션 (5점) — 국가별 패턴
  const reviewPatterns = country === "th"
    ? ["review", "testimonial", "feedback", "patient story", "รีวิว", "รีวิวจากลูกค้า"]
    : ["후기", "리뷰", "체험", "사례", "testimonial", "review"];
  const hasReviewSection = reviewPatterns.some(p => html.toLowerCase().includes(p.toLowerCase()));
  const hasAggregateRating = jsonLdTypes.some(t => t.includes("AggregateRating")) || $("[itemprop='aggregateRating']").length > 0;
  items.push({
    id: "hospital-reviews",
    category: "병원 특화 SEO",
    name: "환자 후기/리뷰 섹션",
    status: hasReviewSection && hasAggregateRating ? "pass" : hasReviewSection ? "warning" : "fail",
    score: hasReviewSection && hasAggregateRating ? 5 : hasReviewSection ? 2 : 0,
    maxScore: 5,
    detail: `${[hasReviewSection && '후기/리뷰 콘텐츠', hasAggregateRating && '평점 구조화 데이터'].filter(Boolean).join(', ') || '후기 섹션 없음'}`,
    recommendation: hasReviewSection && hasAggregateRating ? "환자 후기와 평점이 잘 구성되어 있습니다." : "환자 후기 섹션을 추가하고 AggregateRating 스키마를 적용하세요. 검색 결과에 별점이 표시됩니다.",
    impact: "검색 결과에 별점이 표시되면 클릭률이 35% 이상 높아집니다. 환자 후기는 E-E-A-T의 'Experience' 신호입니다.",
  });

  // 7-9. 보험/비용 정보 (4점) — 국가별 패턴
  const costPatterns = country === "th"
    ? ["price", "cost", "fee", "baht", "ฎ", "THB", "package", "ราคา", "ค่าใช้จ่าย"]
    : ["비용", "가격", "요금", "보험", "수가", "원)", "만원", "price", "cost"];
  const hasCostInfo = costPatterns.some(p => html.includes(p));
  items.push({
    id: "hospital-cost",
    category: "병원 특화 SEO",
    name: "비용/보험 정보",
    status: hasCostInfo ? "pass" : "fail",
    score: hasCostInfo ? 4 : 0,
    maxScore: 4,
    detail: hasCostInfo ? "비용/보험 관련 정보가 포함되어 있습니다." : "비용/보험 정보가 없습니다.",
    recommendation: hasCostInfo ? "비용 정보가 잘 제공되고 있습니다." : country === "th"
      ? "시술 비용, 가격 범위 등을 명시하세요. 'price', 'cost' 키워드 검색량이 매우 높습니다."
      : "시술 비용, 보험 적용 여부, 가격 범위 등을 명시하세요. '비용', '가격' 키워드 검색량이 매우 높습니다.",
    impact: country === "th"
      ? "'rhinoplasty cost bangkok', 'botox price thailand' 등 비용 관련 검색은 전체 의료 검색의 30% 이상을 차지합니다. 비용 정보가 없으면 이 트래픽을 놓칩니다."
      : "'임플란트 비용', '라식 가격' 등 비용 관련 검색은 전체 의료 검색의 30% 이상을 차지합니다. 비용 정보가 없으면 이 트래픽을 놓칩니다.",
  });

  // 7-10. 다국어 의료 콘텐츠 (4점) — 주 언어 제외 후 추가 언어 권고
  const hasEnglishContent = html.includes("English") || $("a[href*='/en']").length > 0 || $("[lang='en']").length > 0;
  const hasChineseContent = html.includes("中文") || $("a[href*='/zh']").length > 0 || $("[lang='zh']").length > 0;
  const hasJapaneseContent = html.includes("日本語") || $("a[href*='/ja']").length > 0 || $("[lang='ja']").length > 0;
  const hasKoreanContent2 = html.includes("한국어") || $("a[href*='/ko']").length > 0 || $("[lang='ko']").length > 0 || (bodyText.match(/[가-힣]/g) || []).length > 50;
  const hasThaiContent2 = html.includes("ไทย") || $("a[href*='/th']").length > 0 || $("[lang='th']").length > 0 || (bodyText.match(/[\u0E00-\u0E7F]/g) || []).length > 50;
  // 사이트의 주 언어 감지 (영어 사이트인지 확인)
  const siteMainLang = htmlLang || "";
  const isEnglishSite = siteMainLang.startsWith("en") || (!siteMainLang && (bodyText.match(/[a-zA-Z]/g) || []).length > bodyText.length * 0.3);
  // 주 언어를 제외한 추가 언어 카운트
  let additionalLangs: string[] = [];
  let additionalLangLabels: string[] = [];
  if (!isEnglishSite && hasEnglishContent) { additionalLangs.push("en"); additionalLangLabels.push("영어"); }
  if (hasChineseContent) { additionalLangs.push("zh"); additionalLangLabels.push("중국어"); }
  if (hasJapaneseContent) { additionalLangs.push("ja"); additionalLangLabels.push("일본어"); }
  if (country === "th" && hasKoreanContent2) { additionalLangs.push("ko"); additionalLangLabels.push("한국어"); }
  if (country !== "th" && hasThaiContent2) { additionalLangs.push("th"); additionalLangLabels.push("태국어"); }
  const multiLangCount = additionalLangs.length;
  // 권고할 언어 목록 (주 언어 제외)
  const suggestedLangs = country === "th"
    ? [
        ...(!isEnglishSite ? [] : []),
        ...(!hasThaiContent2 ? ["태국어"] : []),
        ...(!hasChineseContent ? ["중국어"] : []),
        ...(!hasJapaneseContent ? ["일본어"] : []),
        ...(!hasKoreanContent2 ? ["한국어"] : []),
      ]
    : [
        ...(!hasEnglishContent ? ["영어"] : []),
        ...(!hasChineseContent ? ["중국어"] : []),
        ...(!hasJapaneseContent ? ["일본어"] : []),
      ];
  const suggestText = suggestedLangs.length > 0 ? suggestedLangs.join(", ") + " 페이지를 추가하세요." : "다국어 콘텐츠가 잘 구성되어 있습니다.";
  items.push({
    id: "hospital-multilang",
    category: "병원 특화 SEO",
    name: "다국어 의료 콘텐츠",
    status: multiLangCount >= 2 ? "pass" : multiLangCount >= 1 ? "warning" : "fail",
    score: multiLangCount >= 2 ? 4 : multiLangCount >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `다국어 ${multiLangCount}개 (${additionalLangLabels.join(', ') || '없음'})${isEnglishSite ? ' — 영어 사이트 기준' : ''}`,
    recommendation: multiLangCount >= 2 ? "다국어 콘텐츠가 잘 구성되어 있습니다." : suggestText + " 해외 환자 유치에 필수적입니다.",
    impact: "해외 환자 유치를 위해 다국어 콘텐츠는 필수입니다. 특히 성형외과, 피부과는 해외 환자 비중이 높습니다.",
  });

  // ── AI 인용 확장 (3개) ──

  // 8-12. AI 대화형 콘텐츠 (4점) — 국가별 패턴
  const conversationalRegex = country === "th"
    ? /\b(how|what|why|when|does|can|is it|should)\b.{5,}\?/gi
    : /[가-힣]+\s*(인가요|일까요|할까요|인지|인데|하나요|인요|입니까)\??/g;
  const conversationalPatterns = (bodyText.match(conversationalRegex) || []).length;
  const hasConversationalContent = conversationalPatterns >= 3;
  items.push({
    id: "ai-conversational",
    category: "AI 검색 노출",
    name: "AI 대화형 콘텐츠",
    status: hasConversationalContent ? "pass" : conversationalPatterns >= 1 ? "warning" : "fail",
    score: hasConversationalContent ? 4 : conversationalPatterns >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `대화형 패턴 ${conversationalPatterns}개 발견`,
    recommendation: hasConversationalContent ? "AI가 인용하기 좋은 대화형 콘텐츠가 있습니다." : country === "th"
      ? "환자들이 실제로 묻는 질문 형태로 콘텐츠를 작성하세요. 'Does rhinoplasty hurt?', 'How long is the recovery after liposuction?' 등의 자연어 질문-답변 형태가 효과적입니다."
      : "환자들이 실제로 묻는 질문 형태로 콘텐츠를 작성하세요. '임플란트 아픈가요?', '라식 부작용이 있나요?' 등의 자연어 질문-답변 형태가 효과적입니다.",
    impact: "AI 검색은 자연어 질문에 답변하는 형태입니다. 대화형 콘텐츠가 있으면 AI가 직접 인용할 확률이 높아집니다.",
  });

  // 8-13. 데이터 테이블 구조화 (3점) — 국가별 패턴
  const hasComparisonTable = $("table th").length >= 2 && $("table td").length >= 4;
  const priceKeywords = country === "th"
    ? ["price", "cost", "fee", "baht", "ราคา"]
    : ["가격", "비용", "price", "cost"];
  const hasPriceTable = priceKeywords.some(k => html.toLowerCase().includes(k)) && tableCount > 0;
  items.push({
    id: "ai-data-table",
    category: "AI 검색 노출",
    name: "데이터 테이블 구조화",
    status: hasComparisonTable ? "pass" : hasPriceTable ? "warning" : "fail",
    score: hasComparisonTable ? 3 : hasPriceTable ? 1 : 0,
    maxScore: 3,
    detail: hasComparisonTable ? "비교/데이터 테이블이 구조화되어 있습니다." : hasPriceTable ? "가격 테이블이 있지만 구조가 부족합니다." : "구조화된 데이터 테이블이 없습니다.",
    recommendation: hasComparisonTable ? "데이터 테이블이 잘 구조화되어 있습니다." : "시술 비교표, 가격표, 진료시간표 등을 HTML 테이블로 작성하세요. AI는 테이블 데이터를 직접 인용합니다.",
    impact: country === "th"
      ? "AI는 비교 질문에 답변할 때 테이블 데이터를 우선 인용합니다. 'rhinoplasty vs facelift comparison' 같은 질문에 테이블이 있으면 출처로 선택됩니다."
      : "AI는 비교 질문에 답변할 때 테이블 데이터를 우선 인용합니다. '라식 vs 라섹 비교' 같은 질문에 테이블이 있으면 출처로 선택됩니다.",
  });

  // 8-14. AI 스니펫 최적화 (3점) — 국가별 패턴
  const definitionPatterns = $("p").filter((_: any, el: any) => {
    const text = $(el).text().trim();
    if (text.length < 30 || text.length > 200) return false;
    if (country === "th") {
      return text.includes(" is ") || text.includes(" are ") || text.includes(" refers to ") ||
        text.includes(" means ") || text.includes(" defined as ") || text.includes("คือ") || text.includes("หมายถึง");
    }
    return text.includes("이란 ") || text.includes("이란,") ||
      text.includes("(은)는 ") || text.includes("은 ") ||
      text.includes("를 말합니다") || text.includes("을 의미합니다");
  }).length;
  items.push({
    id: "ai-snippet",
    category: "AI 검색 노출",
    name: "AI 스니펫 최적화",
    status: definitionPatterns >= 3 ? "pass" : definitionPatterns >= 1 ? "warning" : "fail",
    score: definitionPatterns >= 3 ? 3 : definitionPatterns >= 1 ? 1 : 0,
    maxScore: 3,
    detail: `정의형 문장 패턴 ${definitionPatterns}개 발견`,
    recommendation: definitionPatterns >= 3 ? "AI 스니펫에 적합한 정의형 문장이 충분합니다." : country === "th"
      ? "'Rhinoplasty is a surgical procedure that...', 'Botox refers to...' 형태의 정의형 문장을 추가하세요. AI가 정의를 설명할 때 직접 인용합니다."
      : "'OO이란 ~입니다', 'OO은 ~를 말합니다' 형태의 정의형 문장을 추가하세요. AI가 정의를 설명할 때 직접 인용합니다.",
    impact: "AI는 '~이란 무엇인가요?' 질문에 정의형 문장을 직접 인용합니다. 의료 용어 정의가 있으면 AI 답변의 출처로 선택됩니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 신규 카테고리 9: 성능 최적화 (8개)
  // ═══════════════════════════════════════════════════════════════

  // 9-1. 페이지 크기 (5점)
  const pageSize = html.length;
  const pageSizeKB = Math.round(pageSize / 1024);
  items.push({
    id: "perf-page-size",
    category: "성능 최적화",
    name: "페이지 크기",
    status: pageSizeKB < 500 ? "pass" : pageSizeKB < 1500 ? "warning" : "fail",
    score: pageSizeKB < 500 ? 5 : pageSizeKB < 1500 ? 2 : 0,
    maxScore: 5,
    detail: `HTML 크기: ${pageSizeKB}KB`,
    recommendation: pageSizeKB < 500 ? "페이지 크기가 적절합니다." : "HTML 크기를 500KB 이하로 줄이세요. 인라인 CSS/JS를 외부 파일로 분리하고 불필요한 코드를 제거하세요.",
    impact: "페이지 크기가 크면 로딩 시간이 길어지고, 모바일 사용자의 데이터를 소모합니다. 구글은 빠른 사이트를 우선 노출합니다.",
  });

  // 9-2. 외부 스크립트 수 (4점)
  const scriptTags = $("script[src]").length;
  items.push({
    id: "perf-scripts",
    category: "성능 최적화",
    name: "외부 스크립트 수",
    status: scriptTags <= 10 ? "pass" : scriptTags <= 20 ? "warning" : "fail",
    score: scriptTags <= 10 ? 4 : scriptTags <= 20 ? 2 : 0,
    maxScore: 4,
    detail: `외부 스크립트: ${scriptTags}개`,
    recommendation: scriptTags <= 10 ? "스크립트 수가 적절합니다." : "외부 스크립트를 10개 이하로 줄이세요. 불필요한 플러그인을 제거하고 스크립트를 번들링하세요.",
    impact: "각 외부 스크립트는 별도의 HTTP 요청을 발생시켜 페이지 로딩을 지연시킵니다.",
  });

  // 9-3. CSS 파일 수 (3점)
  const cssTags = $("link[rel='stylesheet']").length;
  items.push({
    id: "perf-css",
    category: "성능 최적화",
    name: "CSS 파일 수",
    status: cssTags <= 5 ? "pass" : cssTags <= 10 ? "warning" : "fail",
    score: cssTags <= 5 ? 3 : cssTags <= 10 ? 1 : 0,
    maxScore: 3,
    detail: `CSS 파일: ${cssTags}개`,
    recommendation: cssTags <= 5 ? "CSS 파일 수가 적절합니다." : "CSS 파일을 5개 이하로 통합하세요.",
    impact: "CSS 파일이 많으면 렌더링 차단이 발생하여 페이지가 늦게 표시됩니다.",
  });

  // 9-4. 인라인 CSS 비율 (3점)
  const inlineStyleCount = $("[style]").length;
  const inlineRatio = $("*").length > 0 ? inlineStyleCount / $("*").length : 0;
  items.push({
    id: "perf-inline-css",
    category: "성능 최적화",
    name: "인라인 CSS 비율",
    status: inlineRatio < 0.1 ? "pass" : inlineRatio < 0.3 ? "warning" : "fail",
    score: inlineRatio < 0.1 ? 3 : inlineRatio < 0.3 ? 1 : 0,
    maxScore: 3,
    detail: `인라인 스타일: ${inlineStyleCount}개 (전체 요소의 ${Math.round(inlineRatio * 100)}%)`,
    recommendation: inlineRatio < 0.1 ? "인라인 CSS 사용이 적절합니다." : "인라인 스타일을 외부 CSS 파일로 이동하세요. 유지보수성과 캐싱 효율이 향상됩니다.",
    impact: "인라인 CSS가 많으면 HTML 크기가 커지고, 브라우저 캐싱을 활용할 수 없어 반복 방문 시에도 느립니다.",
  });

  // 9-5. 이미지 최적화 형식 (4점)
  const allImgSrcs: string[] = [];
  $('img[src]').each((_: any, el: any) => { allImgSrcs.push($(el).attr("src") || ""); });
  const webpCount = allImgSrcs.filter(s => s.includes(".webp") || s.includes("format=webp")).length;
  const avifCount = allImgSrcs.filter(s => s.includes(".avif")).length;
  const modernFormatRatio = totalImages > 0 ? (webpCount + avifCount) / totalImages : 0;
  items.push({
    id: "perf-image-format",
    category: "성능 최적화",
    name: "차세대 이미지 형식",
    status: modernFormatRatio >= 0.5 ? "pass" : modernFormatRatio > 0 ? "warning" : totalImages === 0 ? "pass" : "fail",
    score: modernFormatRatio >= 0.5 ? 4 : modernFormatRatio > 0 ? 2 : totalImages === 0 ? 3 : 0,
    maxScore: 4,
    detail: totalImages === 0 ? "이미지 없음" : `WebP: ${webpCount}개, AVIF: ${avifCount}개 / 전체 ${totalImages}개 (${Math.round(modernFormatRatio * 100)}%)`,
    recommendation: modernFormatRatio >= 0.5 ? "차세대 이미지 형식이 잘 활용되고 있습니다." : "이미지를 WebP 또는 AVIF 형식으로 변환하세요. JPEG 대비 25-50% 용량 절감됩니다.",
    impact: "WebP/AVIF는 JPEG보다 25-50% 작은 파일 크기로 동일한 품질을 제공합니다. 이미지가 많은 병원 사이트에서 특히 효과적입니다.",
  });

  // 9-6. 리소스 프리로드 (3점)
  const preloadCount = $("link[rel='preload']").length;
  const prefetchCount = $("link[rel='prefetch']").length;
  const preconnectCount = $("link[rel='preconnect']").length;
  const resourceHintCount = preloadCount + prefetchCount + preconnectCount;
  items.push({
    id: "perf-preload",
    category: "성능 최적화",
    name: "리소스 힌트 (Preload/Prefetch)",
    status: resourceHintCount >= 2 ? "pass" : resourceHintCount >= 1 ? "warning" : "fail",
    score: resourceHintCount >= 2 ? 3 : resourceHintCount >= 1 ? 1 : 0,
    maxScore: 3,
    detail: `preload: ${preloadCount}개, prefetch: ${prefetchCount}개, preconnect: ${preconnectCount}개`,
    recommendation: resourceHintCount >= 2 ? "리소스 힌트가 잘 설정되어 있습니다." : "핵심 폰트, CSS, 이미지에 preload를 추가하고, 외부 도메인에 preconnect를 설정하세요.",
    impact: "리소스 힌트를 사용하면 브라우저가 필요한 리소스를 미리 준비하여 로딩 시간이 단축됩니다.",
  });

  // 9-7. JavaScript 지연 로딩 (4점)
  const deferScripts = $("script[defer]").length;
  const asyncScripts = $("script[async]").length;
  const totalExternalScripts = scriptTags;
  const deferRatio = totalExternalScripts > 0 ? (deferScripts + asyncScripts) / totalExternalScripts : 1;
  items.push({
    id: "perf-js-defer",
    category: "성능 최적화",
    name: "JavaScript 지연 로딩",
    status: deferRatio >= 0.5 ? "pass" : deferRatio > 0 ? "warning" : totalExternalScripts === 0 ? "pass" : "fail",
    score: deferRatio >= 0.5 ? 4 : deferRatio > 0 ? 2 : totalExternalScripts === 0 ? 3 : 0,
    maxScore: 4,
    detail: totalExternalScripts === 0 ? "외부 스크립트 없음" : `defer: ${deferScripts}개, async: ${asyncScripts}개 / 전체 ${totalExternalScripts}개 (${Math.round(deferRatio * 100)}%)`,
    recommendation: deferRatio >= 0.5 ? "JavaScript 지연 로딩이 잘 적용되어 있습니다." : "script 태그에 defer 또는 async 속성을 추가하세요. 페이지 렌더링이 차단되지 않습니다.",
    impact: "defer/async가 없는 스크립트는 HTML 파싱을 차단하여 페이지가 늦게 표시됩니다.",
  });

  // 9-8. DOM 크기 (4점) — PageSpeed 실측 데이터 우선
  const domSizeRaw = $("*").length;
  const domSize = pageSpeed?.diagnostics?.domSize || domSizeRaw;
  const domSource = pageSpeed?.diagnostics?.domSize ? "Google PageSpeed 실측" : "자체 측정";
  items.push({
    id: "perf-dom-size",
    category: "성능 최적화",
    name: "DOM 크기",
    status: domSize <= 1500 ? "pass" : domSize <= 3000 ? "warning" : "fail",
    score: domSize <= 1500 ? 4 : domSize <= 3000 ? 2 : 0,
    maxScore: 4,
    detail: `DOM 요소: ${domSize.toLocaleString()}개 (${domSource})`,
    recommendation: domSize <= 1500 ? "DOM 크기가 적절합니다." : "DOM 요소를 1,500개 이하로 줄이세요. 불필요한 래퍼 요소를 제거하고 가상 스크롤을 고려하세요.",
    impact: "DOM이 크면 브라우저의 메모리 사용량이 증가하고, 스크롤/애니메이션이 느려집니다.",
  });

  // ── Core Web Vitals 실측 항목 (PageSpeed API 데이터 기반) ──
  // 항목 수 고정: PageSpeed 실패 시에도 항상 5개 항목 생성 ("측정 불가" 상태)
  {
    // 9-9. LCP (Largest Contentful Paint) (5점)
    const hasLcp = !!pageSpeed;
    const lcpMs = pageSpeed?.lcp?.value ?? -1;
    const lcpSec = hasLcp ? (lcpMs / 1000).toFixed(1) : "—";
    const lcpGood = hasLcp && lcpMs <= 2500;
    const lcpOk = hasLcp && lcpMs <= 4000;
    items.push({
      id: "perf-cwv-lcp",
      category: "성능 최적화",
      name: "LCP (Largest Contentful Paint)",
      status: hasLcp ? (lcpGood ? "pass" : lcpOk ? "warning" : "fail") : "info",
      score: hasLcp ? (lcpGood ? 5 : lcpOk ? 2 : 0) : 0,
      maxScore: hasLcp ? 5 : 0,
      detail: hasLcp ? `LCP: ${lcpSec}초 (Google PageSpeed 실측)${lcpGood ? ' — 양호' : lcpOk ? ' — 개선 필요' : ' — 불량'}` : "LCP: 측정 불가 (Google PageSpeed API 응답 없음)",
      recommendation: hasLcp ? (lcpGood ? "LCP가 2.5초 이하로 양호합니다." : lcpOk ? `LCP가 ${lcpSec}초로 개선이 필요합니다. 히어로 이미지 최적화, 서버 응답 속도 개선, 렌더링 차단 리소스 제거를 권장합니다.` : `LCP가 ${lcpSec}초로 매우 느립니다. 히어로 이미지를 WebP로 변환하고, 서버 응답 속도를 개선하고, CDN을 도입하세요.`) : "Google PageSpeed API에서 데이터를 가져오지 못했습니다. 네트워크 상태를 확인하고 재진단을 권장합니다.",
      impact: "LCP는 구글 Core Web Vitals의 핵심 지표입니다. 2.5초 이하면 '좋음', 4초 초과면 '불량'으로 분류되며 검색 순위에 직접 영향을 미칩니다.",
    });

    // 9-10. FCP (First Contentful Paint) (4점)
    const hasFcp = !!pageSpeed;
    const fcpMs = pageSpeed?.fcp?.value ?? -1;
    const fcpSec = hasFcp ? (fcpMs / 1000).toFixed(1) : "—";
    const fcpGood = hasFcp && fcpMs <= 1800;
    const fcpOk = hasFcp && fcpMs <= 3000;
    items.push({
      id: "perf-cwv-fcp",
      category: "성능 최적화",
      name: "FCP (First Contentful Paint)",
      status: hasFcp ? (fcpGood ? "pass" : fcpOk ? "warning" : "fail") : "info",
      score: hasFcp ? (fcpGood ? 4 : fcpOk ? 2 : 0) : 0,
      maxScore: hasFcp ? 4 : 0,
      detail: hasFcp ? `FCP: ${fcpSec}초 (Google PageSpeed 실측)${fcpGood ? ' — 양호' : fcpOk ? ' — 개선 필요' : ' — 불량'}` : "FCP: 측정 불가 (Google PageSpeed API 응답 없음)",
      recommendation: hasFcp ? (fcpGood ? "FCP가 1.8초 이하로 양호합니다." : `FCP가 ${fcpSec}초로 개선이 필요합니다. 렌더링 차단 리소스를 제거하고, 폰트 로딩을 최적화하세요.`) : "Google PageSpeed API에서 데이터를 가져오지 못했습니다. 재진단을 권장합니다.",
      impact: "FCP는 사용자가 페이지에서 처음으로 콘텐츠를 보는 시점입니다. 1.8초 이하면 '좋음', 3초 초과면 '불량'입니다.",
    });

    // 9-11. CLS (Cumulative Layout Shift) (5점)
    const hasCls = !!pageSpeed;
    const clsVal = pageSpeed?.cls?.value ?? -1;
    const clsGood = hasCls && clsVal <= 0.1;
    const clsOk = hasCls && clsVal <= 0.25;
    items.push({
      id: "perf-cwv-cls",
      category: "성능 최적화",
      name: "CLS (Cumulative Layout Shift)",
      status: hasCls ? (clsGood ? "pass" : clsOk ? "warning" : "fail") : "info",
      score: hasCls ? (clsGood ? 5 : clsOk ? 2 : 0) : 0,
      maxScore: hasCls ? 5 : 0,
      detail: hasCls ? `CLS: ${clsVal.toFixed(3)} (Google PageSpeed 실측)${clsGood ? ' — 양호' : clsOk ? ' — 개선 필요' : ' — 불량'}` : "CLS: 측정 불가 (Google PageSpeed API 응답 없음)",
      recommendation: hasCls ? (clsGood ? "CLS가 0.1 이하로 레이아웃이 안정적입니다." : clsOk ? `CLS가 ${clsVal.toFixed(3)}로 개선이 필요합니다. 이미지/동영상에 width/height를 명시하고, 동적 콘텐츠 삽입을 줄이세요.` : `CLS가 ${clsVal.toFixed(3)}로 매우 불안정합니다. 모든 이미지/동영상에 크기를 명시하고, 광고/배너가 레이아웃을 밀어내지 않도록 고정 영역을 확보하세요.`) : "Google PageSpeed API에서 데이터를 가져오지 못했습니다. 재진단을 권장합니다.",
      impact: "CLS는 페이지 로딩 중 레이아웃이 얼마나 흔들리는지 측정합니다. 0.1 이하면 '좋음', 0.25 초과면 '불량'입니다. 레이아웃 불안정은 사용자 경험을 크게 저해합니다.",
    });

    // 9-12. TBT (Total Blocking Time) (4점)
    const hasTbt = !!pageSpeed;
    const tbtMs = pageSpeed?.tbt?.value ?? -1;
    const tbtGood = hasTbt && tbtMs <= 200;
    const tbtOk = hasTbt && tbtMs <= 600;
    items.push({
      id: "perf-cwv-tbt",
      category: "성능 최적화",
      name: "TBT (Total Blocking Time)",
      status: hasTbt ? (tbtGood ? "pass" : tbtOk ? "warning" : "fail") : "info",
      score: hasTbt ? (tbtGood ? 4 : tbtOk ? 2 : 0) : 0,
      maxScore: hasTbt ? 4 : 0,
      detail: hasTbt ? `TBT: ${Math.round(tbtMs)}ms (Google PageSpeed 실측)${tbtGood ? ' — 양호' : tbtOk ? ' — 개선 필요' : ' — 불량'}` : "TBT: 측정 불가 (Google PageSpeed API 응답 없음)",
      recommendation: hasTbt ? (tbtGood ? "TBT가 200ms 이하로 상호작용이 원활합니다." : `TBT가 ${Math.round(tbtMs)}ms로 개선이 필요합니다. 불필요한 JavaScript를 제거하고, 코드 스플리팅과 지연 로딩을 적용하세요.`) : "Google PageSpeed API에서 데이터를 가져오지 못했습니다. 재진단을 권장합니다.",
      impact: "TBT는 메인 스레드가 차단된 총 시간입니다. 200ms 이하면 '좋음', 600ms 초과면 '불량'입니다. 높은 TBT는 버튼 클릭이 지연되는 느낌을 줍니다.",
    });

    // 9-13. Google PageSpeed 성능 점수 (5점)
    const hasPerf = !!pageSpeed;
    const perfScore = pageSpeed?.performanceScore ?? -1;
    items.push({
      id: "perf-pagespeed-score",
      category: "성능 최적화",
      name: "Google PageSpeed 성능 점수",
      status: hasPerf ? (perfScore >= 90 ? "pass" : perfScore >= 50 ? "warning" : "fail") : "info",
      score: hasPerf ? (perfScore >= 90 ? 5 : perfScore >= 50 ? 3 : perfScore >= 25 ? 1 : 0) : 0,
      maxScore: hasPerf ? 5 : 0,
      detail: hasPerf ? `Google PageSpeed 성능 점수: ${perfScore}점/100점 (모바일 기준, 실측)` : "Google PageSpeed 성능 점수: 측정 불가 (API 응답 없음)",
      recommendation: hasPerf ? (perfScore >= 90 ? "성능 점수가 우수합니다." : perfScore >= 50 ? `성능 점수가 ${perfScore}점으로 개선이 필요합니다. 이미지 최적화, JavaScript 지연 로딩, CSS 최소화를 우선 적용하세요.` : `성능 점수가 ${perfScore}점으로 매우 낮습니다. 전면적인 성능 최적화가 시급합니다.`) : "Google PageSpeed API에서 데이터를 가져오지 못했습니다. 재진단을 권장합니다.",
      impact: "Google PageSpeed 점수는 구글이 실제로 측정한 성능 지표입니다. 90점 이상이면 '좋음', 50점 미만이면 '불량'으로 분류되며, 검색 순위에 직접적인 영향을 미칩니다.",
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 신규 카테고리 10: 모바일 최적화 (8개)
  // ═══════════════════════════════════════════════════════════════

  // 10-1. 모바일 전화 버튼 (5점)
  const telLinks = $("a[href^='tel:']").length;
  const hasStickyPhone = html.includes("sticky") && (html.includes("tel:") || html.includes("전화"));
  items.push({
    id: "mobile-tel-button",
    category: "모바일 최적화",
    name: "모바일 전화 버튼",
    status: telLinks >= 1 ? "pass" : "fail",
    score: telLinks >= 2 || hasStickyPhone ? 5 : telLinks >= 1 ? 3 : 0,
    maxScore: 5,
    detail: `전화 링크: ${telLinks}개${hasStickyPhone ? ', 고정 전화 버튼 있음' : ''}`,
    recommendation: telLinks >= 1 ? "모바일 전화 버튼이 잘 설정되어 있습니다." : "tel: 링크를 추가하세요. 모바일에서 탭 한 번으로 전화할 수 있어야 합니다. 하단 고정 전화 버튼도 추천합니다.",
    impact: "병원 사이트 방문자의 70%가 모바일입니다. 전화 버튼이 없으면 환자가 전화번호를 복사해야 하므로 이탈률이 높아집니다.",
  });

  // 10-2. 터치 타겟 크기 (4점)
  const smallButtons = $("a, button").filter((_: any, el: any) => {
    const style = $(el).attr("style") || "";
    const cls = $(el).attr("class") || "";
    return style.includes("font-size: 10") || style.includes("font-size: 11") || cls.includes("text-xs");
  }).length;
  items.push({
    id: "mobile-touch-target",
    category: "모바일 최적화",
    name: "터치 타겟 크기",
    status: smallButtons === 0 ? "pass" : smallButtons <= 3 ? "warning" : "fail",
    score: smallButtons === 0 ? 4 : smallButtons <= 3 ? 2 : 0,
    maxScore: 4,
    detail: smallButtons === 0 ? "작은 터치 타겟이 감지되지 않았습니다." : `작은 버튼/링크: ${smallButtons}개`,
    recommendation: smallButtons === 0 ? "터치 타겟 크기가 적절합니다." : "모든 버튼과 링크의 최소 크기를 48x48px로 설정하세요.",
    impact: "터치 타겟이 작으면 모바일에서 잘못된 곳을 터치하게 되어 사용자 경험이 크게 저하됩니다.",
  });

  // 10-3. 폰트 크기 (3점)
  const hasSmallFont = html.includes("font-size: 10px") || html.includes("font-size: 11px") || html.includes("font-size:10px") || html.includes("font-size:11px");
  items.push({
    id: "mobile-font-size",
    category: "모바일 최적화",
    name: "모바일 폰트 크기",
    status: hasSmallFont ? "warning" : "pass",
    score: hasSmallFont ? 1 : 3,
    maxScore: 3,
    detail: hasSmallFont ? "10-11px 폰트가 감지되었습니다." : "작은 폰트가 감지되지 않았습니다.",
    recommendation: hasSmallFont ? "최소 폰트 크기를 14px 이상으로 설정하세요. 모바일에서 읽기 어려운 텍스트는 사용자 이탈을 유발합니다." : "폰트 크기가 적절합니다.",
    impact: "구글은 모바일에서 읽기 어려운 텍스트가 있는 페이지의 순위를 낮춥니다.",
  });

  // 10-4. 가로 스크롤 방지 (3점)
  const hasOverflowX = html.includes("overflow-x: scroll") || html.includes("overflow-x:scroll");
  const hasFixedWidth = html.includes("width: 1000") || html.includes("width: 1200") || html.includes("width:1000") || html.includes("width:1200");
  items.push({
    id: "mobile-no-horizontal-scroll",
    category: "모바일 최적화",
    name: "가로 스크롤 방지",
    status: hasOverflowX || hasFixedWidth ? "fail" : "pass",
    score: hasOverflowX || hasFixedWidth ? 0 : 3,
    maxScore: 3,
    detail: hasOverflowX ? "가로 스크롤이 강제되어 있습니다." : hasFixedWidth ? "고정 너비가 설정되어 있습니다." : "가로 스크롤 문제가 없습니다.",
    recommendation: hasOverflowX || hasFixedWidth ? "고정 너비를 제거하고 반응형 레이아웃을 사용하세요." : "모바일 레이아웃이 적절합니다.",
    impact: "모바일에서 가로 스크롤이 발생하면 구글이 '모바일 친화적이지 않음'으로 판단하여 순위가 하락합니다.",
  });

  // 10-5. 모바일 팝업 (3점)
  const hasIntrusivePopup = $("[class*='popup']").length > 0 || $('[class*="modal"]').filter((_: any, el: any) => {
    const style = $(el).attr("style") || "";
    return style.includes("display: block") || style.includes("display:block");
  }).length > 0;
  items.push({
    id: "mobile-popup",
    category: "모바일 최적화",
    name: "모바일 팝업 제어",
    status: hasIntrusivePopup ? "warning" : "pass",
    score: hasIntrusivePopup ? 1 : 3,
    maxScore: 3,
    detail: hasIntrusivePopup ? "팝업/모달이 감지되었습니다." : "침입적 팝업이 감지되지 않았습니다.",
    recommendation: hasIntrusivePopup ? "모바일에서 전면 팝업을 사용하지 마세요. 구글은 침입적 팝업이 있는 사이트의 순위를 낮춥니다." : "팝업 설정이 적절합니다.",
    impact: "구글은 2017년부터 모바일에서 침입적 팝업이 있는 사이트의 순위를 낮추고 있습니다.",
  });

  // 10-6. AMP 지원 (2점)
  const hasAmp = $('link[rel="amphtml"]').length > 0;
  items.push({
    id: "mobile-amp",
    category: "모바일 최적화",
    name: "AMP 지원",
    status: hasAmp ? "pass" : "warning",
    score: hasAmp ? 2 : 0,
    maxScore: 2,
    detail: hasAmp ? "AMP 버전이 있습니다." : "AMP 버전이 없습니다.",
    recommendation: hasAmp ? "AMP가 지원됩니다." : "AMP(Accelerated Mobile Pages)를 도입하면 모바일에서 즉시 로딩됩니다. 블로그/콘텐츠 페이지에 특히 효과적입니다.",
    impact: "AMP 페이지는 구글 모바일 검색에서 번개 아이콘과 함께 표시되어 클릭률이 높아집니다.",
  });

  // 10-7. PWA 지원 (3점)
  const hasManifest = $('link[rel="manifest"]').length > 0;
  const hasServiceWorker = html.includes("serviceWorker") || html.includes("service-worker");
  items.push({
    id: "mobile-pwa",
    category: "모바일 최적화",
    name: "PWA 지원",
    status: hasManifest && hasServiceWorker ? "pass" : hasManifest ? "warning" : "fail",
    score: hasManifest && hasServiceWorker ? 3 : hasManifest ? 1 : 0,
    maxScore: 3,
    detail: `${[hasManifest && 'manifest.json', hasServiceWorker && 'Service Worker'].filter(Boolean).join(', ') || 'PWA 미지원'}`,
    recommendation: hasManifest && hasServiceWorker ? "PWA가 지원됩니다." : "manifest.json과 Service Worker를 추가하여 PWA를 지원하세요. 홈 화면에 추가 가능하고 오프라인에서도 작동합니다.",
    impact: "PWA를 지원하면 환자가 앱처럼 사용할 수 있어 재방문율이 높아집니다.",
  });

  // 10-8. 모바일 네비게이션 (3점)
  const hasHamburger = $("[class*='hamburger']").length > 0 || $("[class*='menu-toggle']").length > 0 || $("[class*='mobile-menu']").length > 0 || $("button[aria-label*='menu']").length > 0 || $("button[aria-label*='Menu']").length > 0;
  const hasNav = $("nav").length > 0;
  items.push({
    id: "mobile-navigation",
    category: "모바일 최적화",
    name: "모바일 네비게이션",
    status: hasHamburger || hasNav ? "pass" : "warning",
    score: hasHamburger || hasNav ? 3 : 0,
    maxScore: 3,
    detail: `${[hasHamburger && '모바일 메뉴 버튼', hasNav && 'nav 태그'].filter(Boolean).join(', ') || '모바일 네비게이션 미확인'}`,
    recommendation: hasHamburger || hasNav ? "모바일 네비게이션이 구현되어 있습니다." : "모바일용 햄버거 메뉴 또는 하단 네비게이션을 추가하세요.",
    impact: "모바일에서 네비게이션이 불편하면 환자가 원하는 정보를 찾지 못하고 이탈합니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 신규 카테고리 11: 접근성/UX (6개)
  // ═══════════════════════════════════════════════════════════════

  // 11-1. ARIA 속성 (3점)
  const ariaElements = $("[role], [aria-label], [aria-labelledby], [aria-describedby]").length;
  items.push({
    id: "ux-aria",
    category: "접근성/UX",
    name: "ARIA 접근성 속성",
    status: ariaElements >= 5 ? "pass" : ariaElements >= 1 ? "warning" : "fail",
    score: ariaElements >= 5 ? 3 : ariaElements >= 1 ? 1 : 0,
    maxScore: 3,
    detail: `ARIA 속성: ${ariaElements}개`,
    recommendation: ariaElements >= 5 ? "ARIA 접근성 속성이 잘 적용되어 있습니다." : "role, aria-label 등 ARIA 속성을 추가하세요. 스크린 리더 사용자의 접근성이 향상됩니다.",
    impact: "접근성이 좋은 사이트는 구글 검색에서 우대됩니다. 장애인 환자도 사이트를 이용할 수 있어야 합니다.",
  });

  // 11-2. 폼 접근성 (3점)
  const forms = $("form").length;
  const inputsWithLabel = $("input[id]").filter((_: any, el: any) => {
    const id = $(el).attr("id");
    return $(`label[for='${id}']`).length > 0;
  }).length;
  const totalInputs = $("input:not([type='hidden'])").length;
  const hasPlaceholders = $("input[placeholder]").length;
  items.push({
    id: "ux-form",
    category: "접근성/UX",
    name: "폼 접근성",
    status: forms === 0 ? "pass" : inputsWithLabel > 0 || hasPlaceholders > 0 ? "pass" : "warning",
    score: forms === 0 ? 2 : inputsWithLabel > 0 ? 3 : hasPlaceholders > 0 ? 2 : 0,
    maxScore: 3,
    detail: forms === 0 ? "폼이 없습니다." : `폼 ${forms}개, 입력 필드 ${totalInputs}개, label 연결 ${inputsWithLabel}개`,
    recommendation: inputsWithLabel > 0 ? "폼 접근성이 잘 설정되어 있습니다." : "모든 입력 필드에 label 태그를 연결하세요.",
    impact: "label이 없는 입력 필드는 스크린 리더에서 용도를 알 수 없어 접근성이 떨어집니다.",
  });

  // 11-3. 색상 대비 (3점) - 간접 체크
  const hasDarkBg = html.includes("background-color: #000") || html.includes("background: #000") || html.includes("bg-black") || html.includes("bg-gray-900");
  const hasLightText = html.includes("color: #fff") || html.includes("color: white") || html.includes("text-white");
  const hasContrastIssue = hasDarkBg && !hasLightText || !hasDarkBg && hasLightText;
  items.push({
    id: "ux-contrast",
    category: "접근성/UX",
    name: "색상 대비",
    status: hasContrastIssue ? "warning" : "pass",
    score: hasContrastIssue ? 1 : 3,
    maxScore: 3,
    detail: hasContrastIssue ? "색상 대비 문제가 의심됩니다." : "명백한 색상 대비 문제가 감지되지 않았습니다.",
    recommendation: hasContrastIssue ? "텍스트와 배경의 색상 대비를 4.5:1 이상으로 유지하세요." : "색상 대비가 적절해 보입니다.",
    impact: "색상 대비가 부족하면 시력이 약한 환자가 내용을 읽기 어렵습니다. WCAG 기준 4.5:1 이상이 필요합니다.",
  });

  // 11-4. 404 에러 페이지 (3점) - 간접 체크
  const has404Link = html.includes("404") || html.includes("not-found") || html.includes("페이지를 찾을 수 없");
  items.push({
    id: "ux-404",
    category: "접근성/UX",
    name: "에러 페이지 처리",
    status: "pass",
    score: 2,
    maxScore: 3,
    detail: "에러 페이지는 직접 접근하여 확인이 필요합니다.",
    recommendation: "커스텀 404 페이지를 만들어 메인 페이지로 안내하세요. 기본 404 페이지는 환자를 이탈시킵니다.",
    impact: "커스텀 404 페이지가 없으면 잘못된 URL로 접근한 환자가 바로 이탈합니다.",
  });

  // 11-5. CTA 버튼 (4점) — 국가별 패턴
  const ctaPatterns = country === "th"
    ? ["booking", "book now", "contact", "consult", "appointment", "call", "line", "นัดหมาย", "ปรึกษา", "ติดต่อ"]
    : ["예약", "상담", "문의", "전화", "카톡", "신청", "booking", "contact"];
  const ctaButtons = $("a, button").filter((_: any, el: any) => {
    const text = $(el).text().trim().toLowerCase();
    return ctaPatterns.some(p => text.includes(p));
  }).length;
  items.push({
    id: "ux-cta",
    category: "접근성/UX",
    name: "CTA 버튼 (행동 유도)",
    status: ctaButtons >= 2 ? "pass" : ctaButtons >= 1 ? "warning" : "fail",
    score: ctaButtons >= 2 ? 4 : ctaButtons >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `CTA 버튼: ${ctaButtons}개 (예약/상담/문의/전화)`,
    recommendation: ctaButtons >= 2 ? "CTA 버튼이 잘 배치되어 있습니다." : "예약, 상담, 문의 등의 CTA 버튼을 눈에 잘 띄는 위치에 2개 이상 배치하세요.",
    impact: "CTA 버튼이 없거나 눈에 띄지 않으면 환자가 어떻게 예약해야 할지 몰라 이탈합니다. 전환율에 직접적인 영향을 미칩니다.",
  });

  // 11-6. 브레드크럼 (3점)
  const hasBreadcrumb = $("[class*='breadcrumb']").length > 0 || $("[itemtype*='BreadcrumbList']").length > 0 || jsonLdTypes.some(t => t.includes("BreadcrumbList"));
  items.push({
    id: "ux-breadcrumb",
    category: "접근성/UX",
    name: "브레드크럼 네비게이션",
    status: hasBreadcrumb ? "pass" : "warning",
    score: hasBreadcrumb ? 3 : 0,
    maxScore: 3,
    detail: hasBreadcrumb ? "브레드크럼이 구현되어 있습니다." : "브레드크럼이 없습니다.",
    recommendation: hasBreadcrumb ? "브레드크럼이 잘 구현되어 있습니다." : "브레드크럼 네비게이션을 추가하세요. 검색 결과에 사이트 구조가 표시되어 클릭률이 높아집니다.",
    impact: "브레드크럼은 검색 결과에 사이트 구조를 표시하여 클릭률을 높이고, 사용자가 사이트 내에서 길을 잃지 않게 합니다.",
  });

  // ═══════════════════════════════════════════════════════════════
  // 신규 카테고리 12: 국제화/다국어 (5개)
  // ═══════════════════════════════════════════════════════════════

  // 12-1. hreflang 태그 (4점)
  const hreflangTags = $("link[hreflang]").length;
  items.push({
    id: "intl-hreflang",
    category: "국제화/다국어",
    name: "hreflang 다국어 태그",
    status: hreflangTags >= 2 ? "pass" : hreflangTags >= 1 ? "warning" : "fail",
    score: hreflangTags >= 2 ? 4 : hreflangTags >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `hreflang 태그: ${hreflangTags}개`,
    recommendation: hreflangTags >= 2 ? "다국어 hreflang 태그가 잘 설정되어 있습니다." : "hreflang 태그를 추가하여 각 언어 버전 페이지를 연결하세요. 구글이 올바른 언어 버전을 해당 국가 사용자에게 노출합니다.",
    impact: "hreflang이 없으면 구글이 한국어 페이지를 일본 사용자에게 노출하는 등의 문제가 발생합니다.",
  });

  // 12-2. 다국어 콘텐츠 존재 (4점) — 주 언어 제외 후 추가 언어 권고
  items.push({
    id: "intl-multilang-content",
    category: "국제화/다국어",
    name: "다국어 콘텐츠",
    status: multiLangCount >= 2 ? "pass" : multiLangCount >= 1 ? "warning" : "fail",
    score: multiLangCount >= 2 ? 4 : multiLangCount >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `다국어 콘텐츠: ${multiLangCount}개 (${additionalLangLabels.join(', ') || '없음'})${isEnglishSite ? ' — 영어 사이트 기준' : ''}`,
    recommendation: multiLangCount >= 2 ? "다국어 콘텐츠가 잘 구성되어 있습니다." : suggestText + " 해외 환자 유치에 필수적입니다.",
    impact: "다국어 콘텐츠가 있으면 해외 검색엔진에서도 노출되어 해외 환자를 유치할 수 있습니다.",
  });

  // 12-3. 국제 전화번호 (3점) — 국가별 분기
  const intlCode = country === "th" ? "+66" : "+82";
  const intlCodeAlt = country === "th" ? "66-" : "82-";
  const hasIntlPhone = html.includes(intlCode) || html.includes(intlCodeAlt) || $("a[href*='tel:" + intlCode + "']").length > 0;
  items.push({
    id: "intl-phone",
    category: "국제화/다국어",
    name: "국제 전화번호 형식",
    status: hasIntlPhone ? "pass" : "warning",
    score: hasIntlPhone ? 3 : 0,
    maxScore: 3,
    detail: hasIntlPhone ? `국제 전화번호 형식(${intlCode})이 있습니다.` : "국제 전화번호 형식이 없습니다.",
    recommendation: hasIntlPhone ? "국제 전화번호가 잘 표시되어 있습니다." : `전화번호를 ${intlCode}-XX-XXXX-XXXX 형식으로도 표시하세요. 해외 환자가 전화할 수 있습니다.`,
    impact: "국제 전화번호 형식이 없으면 해외 환자가 전화를 걸 수 없습니다.",
  });

  // 12-4. 통화/가격 표시 (3점) — 국가별 분기
  const hasMultiCurrency = country === "th"
    ? html.includes("USD") || html.includes("$") || html.includes("KRW") || html.includes("JPY") || html.includes("¥") || html.includes("CNY")
    : html.includes("USD") || html.includes("$") || html.includes("JPY") || html.includes("CNY") || html.includes("¥");
  const localCurrency = country === "th" ? "바트(THB)" : "원화(KRW)";
  items.push({
    id: "intl-currency",
    category: "국제화/다국어",
    name: "다국어 가격/통화 표시",
    status: hasMultiCurrency ? "pass" : "warning",
    score: hasMultiCurrency ? 3 : 0,
    maxScore: 3,
    detail: hasMultiCurrency ? "다국어 통화 표시가 있습니다." : `${localCurrency}만 표시되고 있습니다.`,
    recommendation: hasMultiCurrency ? "다국어 통화가 표시되고 있습니다." : "주요 시술 비용을 USD, JPY, CNY 등으로도 표시하면 해외 환자의 이해도가 높아집니다.",
    impact: `해외 환자는 ${localCurrency} 가격을 직관적으로 이해하기 어렵습니다. 달러/엔화 환산 가격이 있으면 문의율이 높아집니다.`,
  });

  // 12-5. 해외 환자 전용 페이지 (4점) — 국가별 키워드 분기 + 서브페이지 통합
  const hasIntlPatientPage = html.includes("international patient") || html.includes("foreign patient") || html.includes("해외 환자") || html.includes("외국인 환자") || $("a[href*='international']").length > 0 || $("a[href*='global']").length > 0 || (ctx.agg?.hasIntlPatientPage ?? false);
  const intlKeywordExamples = country === "th"
    ? "'plastic surgery bangkok', 'skin clinic thailand', 'cosmetic surgery phuket'"
    : "'plastic surgery korea', 'dental clinic seoul', 'cosmetic surgery gangnam'";
  items.push({
    id: "intl-patient-page",
    category: "국제화/다국어",
    name: "해외 환자 전용 페이지",
    status: hasIntlPatientPage ? "pass" : "fail",
    score: hasIntlPatientPage ? 4 : 0,
    maxScore: 4,
    detail: hasIntlPatientPage ? "해외 환자 전용 콘텐츠가 있습니다." : "해외 환자 전용 페이지가 없습니다.",
    recommendation: hasIntlPatientPage ? "해외 환자 전용 콘텐츠가 잘 구성되어 있습니다." : "해외 환자를 위한 전용 페이지(비자, 숙소, 통역, 공항 픽업 등)를 만드세요.",
    impact: `해외 환자 전용 페이지가 있으면 ${intlKeywordExamples} 등의 영어 검색에서 노출됩니다.`,
  });

  return items;
}

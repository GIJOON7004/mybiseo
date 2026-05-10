/**
 * 태국 맞춤 SEO 진단 항목
 * 한국의 "네이버 검색 최적화" 카테고리를 "Google Thailand 최적화"로 대체
 * 카카오→LINE, 네이버 플레이스→Google Maps TH, 네이버 블로그→Facebook TH 등
 */
import type { SeoCheckItem } from "./seo-analyzer-types";
import type { CheerioAPI } from "cheerio";

interface ThItemsContext {
  $: CheerioAPI;
  html: string;
  bodyText: string;
  baseUrl: string;
  robotsTxt: string;
  robotsExists: boolean;
  sitemapExists: boolean;
  sitemapInRobots: boolean;
  htmlLang: string;
  responseHeaders: Record<string, string>;
  fetchOk: boolean;
  responseTime: number;
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
}

/**
 * 태국 전용 "로컬 검색 최적화" 카테고리 항목 생성
 * 한국의 "네이버 검색 최적화" 카테고리(6번)를 대체
 */
export function generateThaiLocalSearchItems(ctx: ThItemsContext): SeoCheckItem[] {
  const { $, html, bodyText, baseUrl, robotsTxt, robotsExists, sitemapExists, sitemapInRobots, htmlLang, responseHeaders, ogTitle, ogDesc, ogImage } = ctx;
  const items: SeoCheckItem[] = [];

  // ── 6-1. Google Search Console 등록 (5점) ──
  const hasGoogleVerification = $('meta[name="google-site-verification"]').length > 0;
  items.push({
    id: "th-google-search-console",
    category: "Google Thailand 최적화",
    name: "Google Search Console 등록",
    status: hasGoogleVerification ? "pass" : "fail",
    score: hasGoogleVerification ? 5 : 0,
    maxScore: 5,
    detail: hasGoogleVerification ? "Google Search Console 인증 메타태그가 있습니다." : "Google Search Console 인증 메타태그가 없습니다.",
    recommendation: hasGoogleVerification 
      ? "Google Search Console이 잘 등록되어 있습니다." 
      : "Google Search Console에 사이트를 등록하세요. 태국에서 Google은 검색 시장 점유율 95% 이상입니다.",
    impact: "Google은 태국 검색 시장의 95% 이상을 차지합니다. Search Console에 등록하지 않으면 Google 검색에서 사이트가 제대로 색인되지 않습니다.",
  });

  // ── 6-2. Google OG 태그 최적화 (5점) ──
  const hasOgSiteName = $('meta[property="og:site_name"]').length > 0;
  const hasOgType = $('meta[property="og:type"]').length > 0;
  const hasOgLocale = $('meta[property="og:locale"]').attr("content")?.includes("th") || false;
  const ogCount = [ogTitle, ogDesc, ogImage, hasOgSiteName, hasOgType].filter(Boolean).length;
  items.push({
    id: "th-og-tags",
    category: "Google Thailand 최적화",
    name: "OG 태그 최적화 (Google/Facebook)",
    status: ogCount >= 4 ? "pass" : ogCount >= 2 ? "warning" : "fail",
    score: ogCount >= 4 ? 5 : ogCount >= 2 ? 2 : 0,
    maxScore: 5,
    detail: `OG 태그 ${ogCount}/5개 설정 (${[ogTitle && 'og:title', ogDesc && 'og:description', ogImage && 'og:image', hasOgSiteName && 'og:site_name', hasOgType && 'og:type'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: ogCount >= 4 
      ? "OG 태그가 잘 설정되어 있습니다." 
      : "og:site_name, og:type 등 확장 OG 태그를 추가하세요. Facebook/LINE에서 링크 공유 시 미리보기 품질이 향상됩니다.",
    impact: "태국에서 Facebook은 가장 많이 사용하는 SNS입니다. OG 태그가 완벽하면 Facebook/LINE 공유 시 미리보기가 풍부하게 표시되어 클릭률이 높아집니다.",
  });

  // ── 6-3. 태국어 콘텐츠 최적화 (5점) — 영어 사이트 여부 고려
  const hasThaiContent = (bodyText.match(/[\u0E00-\u0E7F]/g) || []).length;
  const thaiRatio = bodyText.length > 0 ? hasThaiContent / bodyText.length : 0;
  const hasThaiLang = htmlLang?.includes("th") || false;
  // 영어 사이트 감지: lang=en 또는 영어 콘텐츠 비율이 높은 경우
  const isEnglishSiteTh = htmlLang?.startsWith("en") || (!htmlLang?.startsWith("th") && (bodyText.match(/[a-zA-Z]/g) || []).length > bodyText.length * 0.3 && thaiRatio < 0.05);
  const langMismatch = htmlLang && !htmlLang.startsWith("th") && !htmlLang.startsWith("en");
  const thaiDetailExtra = langMismatch ? ` (⚠️ lang="${htmlLang}"은 실제 콘텐츠와 불일치)` : "";
  const thaiRecommendation = hasThaiLang && thaiRatio > 0.3 
    ? "태국어 콘텐츠가 잘 구성되어 있습니다."
    : isEnglishSiteTh
      ? `영어 중심 사이트입니다.${langMismatch ? ` 먼저 lang 속성을 "en"으로 수정하세요.` : ''} 태국 로컬 검색 노출을 위해 태국어 버전 페이지를 별도로 만드는 것을 권장합니다.`
      : "lang='th' 설정과 함께 태국어 콘텐츠 비율을 높이세요. Google Thailand는 태국어 콘텐츠를 우선 색인합니다.";
  items.push({
    id: "th-thai-content",
    category: "Google Thailand 최적화",
    name: "태국어 콘텐츠 최적화",
    status: hasThaiLang && thaiRatio > 0.3 ? "pass" : thaiRatio > 0.1 ? "warning" : "fail",
    score: hasThaiLang && thaiRatio > 0.3 ? 5 : thaiRatio > 0.1 ? 2 : 0,
    maxScore: 5,
    detail: `태국어 비율: ${Math.round(thaiRatio * 100)}%, lang 속성: ${htmlLang || '미설정'}${thaiDetailExtra}`,
    recommendation: thaiRecommendation,
    impact: "Google Thailand 검색에서 태국어 콘텐츠가 우선적으로 노출됩니다. 영어만 있는 사이트는 태국 로컬 검색에서 불리합니다.",
  });

  // ── 6-4. LINE Official Account 연동 (6점) ──
  const hasLineLink = html.includes("line.me") || html.includes("lin.ee") || html.includes("@line") || html.includes("LINE") || $("a[href*='line.me']").length > 0;
  const hasLineAddFriend = html.includes("line.me/R/ti/p") || html.includes("lin.ee/") || html.includes("line-add-friend");
  const lineLinkCount = [hasLineLink, hasLineAddFriend].filter(Boolean).length;
  items.push({
    id: "th-line-integration",
    category: "Google Thailand 최적화",
    name: "LINE Official Account 연동",
    status: lineLinkCount >= 2 ? "pass" : lineLinkCount >= 1 ? "warning" : "fail",
    score: lineLinkCount >= 2 ? 6 : lineLinkCount >= 1 ? 3 : 0,
    maxScore: 6,
    detail: `LINE 연동 ${lineLinkCount}/2개 (${[hasLineLink && 'LINE 링크', hasLineAddFriend && '친구추가 링크'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: lineLinkCount >= 2 
      ? "LINE Official Account가 잘 연동되어 있습니다." 
      : "LINE Official Account를 만들고 사이트에 친구추가 링크를 추가하세요. 태국에서 LINE은 카카오톡과 같은 국민 메신저입니다.",
    impact: "LINE은 태국에서 가장 많이 사용하는 메신저(4,900만+ 사용자)입니다. LINE 상담 채널이 있으면 환자 문의율이 크게 높아집니다.",
  });

  // ── 6-5. Google Maps / Google Business Profile (6점) ──
  const hasGoogleMaps = html.includes("maps.google") || html.includes("google.com/maps") || html.includes("goo.gl/maps") || $("iframe[src*='google.com/maps']").length > 0;
  const hasGoogleBusiness = html.includes("g.page") || html.includes("business.google") || html.includes("maps.app.goo.gl");
  const googleLocalCount = [hasGoogleMaps, hasGoogleBusiness].filter(Boolean).length;
  items.push({
    id: "th-google-maps",
    category: "Google Thailand 최적화",
    name: "Google Maps / Business Profile 연동",
    status: googleLocalCount >= 2 ? "pass" : googleLocalCount >= 1 ? "warning" : "fail",
    score: googleLocalCount >= 2 ? 6 : googleLocalCount >= 1 ? 3 : 0,
    maxScore: 6,
    detail: `Google 로컬 연동 ${googleLocalCount}/2개 (${[hasGoogleMaps && 'Google Maps', hasGoogleBusiness && 'Business Profile'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: googleLocalCount >= 2 
      ? "Google Maps와 Business Profile이 잘 연동되어 있습니다." 
      : "Google Business Profile에 병원을 등록하고 사이트에 Google Maps를 삽입하세요. 'clinic near me' 검색에서 필수입니다.",
    impact: "Google Business Profile은 태국에서 '주변 병원/클리닉' 검색 시 최상단에 노출됩니다. 등록하지 않으면 Google Maps 검색에서 완전히 제외됩니다.",
  });

  // ── 6-6. Facebook 비즈니스 연동 (5점) ──
  const hasFacebookLink = html.includes("facebook.com") || $("a[href*='facebook.com']").length > 0;
  const hasFacebookPixel = html.includes("fbq(") || html.includes("facebook.com/tr") || html.includes("connect.facebook.net");
  const hasFacebookMessenger = html.includes("m.me/") || html.includes("messenger") || html.includes("fb-messenger");
  const fbCount = [hasFacebookLink, hasFacebookPixel, hasFacebookMessenger].filter(Boolean).length;
  items.push({
    id: "th-facebook-integration",
    category: "Google Thailand 최적화",
    name: "Facebook 비즈니스 연동",
    status: fbCount >= 2 ? "pass" : fbCount >= 1 ? "warning" : "fail",
    score: fbCount >= 2 ? 5 : fbCount >= 1 ? 2 : 0,
    maxScore: 5,
    detail: `Facebook 연동 ${fbCount}/3개 (${[hasFacebookLink && '페이지 링크', hasFacebookPixel && 'Pixel 추적', hasFacebookMessenger && 'Messenger 채팅'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: fbCount >= 2 
      ? "Facebook 비즈니스가 잘 연동되어 있습니다." 
      : "Facebook 비즈니스 페이지, Pixel 추적, Messenger 채팅을 연동하세요. 태국에서 Facebook은 마케팅 필수 채널입니다.",
    impact: "Facebook은 태국에서 5,600만+ 사용자를 보유한 최대 SNS입니다. Facebook 광고와 Messenger 상담은 태국 의료관광 마케팅의 핵심입니다.",
  });

  // ── 6-7. Instagram 비즈니스 연동 (4점) ──
  const hasInstagram = html.includes("instagram.com") || $("a[href*='instagram.com']").length > 0;
  items.push({
    id: "th-instagram-integration",
    category: "Google Thailand 최적화",
    name: "Instagram 비즈니스 연동",
    status: hasInstagram ? "pass" : "fail",
    score: hasInstagram ? 4 : 0,
    maxScore: 4,
    detail: hasInstagram ? "Instagram 링크가 있습니다." : "Instagram 연동이 없습니다.",
    recommendation: hasInstagram 
      ? "Instagram이 잘 연동되어 있습니다." 
      : "Instagram 비즈니스 계정을 만들고 사이트에 링크를 추가하세요. 태국 성형외과/피부과는 Instagram이 핵심 마케팅 채널입니다.",
    impact: "태국에서 성형외과/피부과 환자의 70%+ 가 Instagram에서 병원을 탐색합니다. Before/After 사진 공유에 최적화된 플랫폼입니다.",
  });

  // ── 6-8. 태국 의료관광 hreflang 설정 (4점) ──
  const hasHreflangTh = $('link[hreflang="th"]').length > 0 || html.includes('hreflang="th"');
  const hasHreflangEn = $('link[hreflang="en"]').length > 0 || html.includes('hreflang="en"');
  const hasHreflangKo = $('link[hreflang="ko"]').length > 0 || html.includes('hreflang="ko"');
  const hreflangCount = [hasHreflangTh, hasHreflangEn, hasHreflangKo].filter(Boolean).length;
  items.push({
    id: "th-hreflang-medical-tourism",
    category: "Google Thailand 최적화",
    name: "다국어 hreflang 설정 (의료관광)",
    status: hreflangCount >= 2 ? "pass" : hreflangCount >= 1 ? "warning" : "fail",
    score: hreflangCount >= 2 ? 4 : hreflangCount >= 1 ? 2 : 0,
    maxScore: 4,
    detail: `hreflang 설정 ${hreflangCount}/3개 (${[hasHreflangTh && 'th', hasHreflangEn && 'en', hasHreflangKo && 'ko'].filter(Boolean).join(', ') || '없음'})`,
    recommendation: hreflangCount >= 2 
      ? "다국어 hreflang이 잘 설정되어 있습니다." 
      : "태국어(th), 영어(en), 한국어(ko) hreflang 태그를 추가하세요. 의료관광 환자는 다양한 국가에서 검색합니다.",
    impact: "hreflang 태그가 없으면 Google이 각 언어 버전을 올바른 국가의 검색 결과에 노출하지 못합니다. 의료관광 병원에게 필수입니다.",
  });

  return items;
}

/**
 * 태국 전용 "소셜 미디어" 카테고리 항목 (한국의 카카오톡 → LINE/Facebook)
 */
export function generateThaiSocialItems(ctx: ThItemsContext): SeoCheckItem[] {
  const { $, html } = ctx;
  const items: SeoCheckItem[] = [];

  // 4-4 대체: LINE 공유 최적화 (카카오톡 대체)
  const hasLineSDK = html.includes("sdk.line.me") || html.includes("line-sdk") || html.includes("liff");
  const hasLineChannel = html.includes("line.me") || html.includes("lin.ee") || html.includes("LINE");
  items.push({
    id: "th-social-line",
    category: "소셜 미디어",
    name: "LINE 연동",
    status: hasLineSDK || hasLineChannel ? "pass" : "fail",
    score: hasLineSDK || hasLineChannel ? 3 : 0,
    maxScore: 3,
    detail: `${[hasLineSDK && 'LINE SDK', hasLineChannel && 'LINE 채널'].filter(Boolean).join(', ') || 'LINE 연동 없음'}`,
    recommendation: hasLineSDK || hasLineChannel 
      ? "LINE 연동이 되어 있습니다." 
      : "LINE Official Account 또는 LINE SDK를 연동하세요. 태국 환자의 90%가 LINE을 사용합니다.",
    impact: "LINE은 태국에서 가장 많이 사용하는 메신저입니다. LINE 상담 채널이 있으면 환자 문의율이 크게 높아집니다.",
  });

  return items;
}

/**
 * 태국 전용 "병원 특화 SEO" 추가 항목 (의료관광 특화)
 */
export function generateThaiMedicalTourismItems(ctx: ThItemsContext): SeoCheckItem[] {
  const { $, html, bodyText } = ctx;
  const items: SeoCheckItem[] = [];

  // 태국 의료관광 구조화 데이터 (MedicalBusiness)
  const hasMedicalSchema = html.includes('"MedicalBusiness"') || html.includes('"MedicalClinic"') || html.includes('"Hospital"') || html.includes('"Physician"');
  const hasMedicalTourism = bodyText.toLowerCase().includes("medical tourism") || bodyText.includes("의료관광") || bodyText.includes("ท่องเที่ยวเชิงการแพทย์");
  items.push({
    id: "th-medical-tourism-schema",
    category: "병원 특화 SEO",
    name: "의료관광 구조화 데이터",
    status: hasMedicalSchema ? "pass" : "fail",
    score: hasMedicalSchema ? 5 : 0,
    maxScore: 5,
    detail: hasMedicalSchema ? "MedicalBusiness/MedicalClinic 스키마가 있습니다." : "의료 관련 구조화 데이터가 없습니다.",
    recommendation: hasMedicalSchema 
      ? "의료 구조화 데이터가 잘 설정되어 있습니다." 
      : "MedicalClinic 또는 Hospital JSON-LD 스키마를 추가하세요. Google 검색에서 병원 정보가 리치 스니펫으로 표시됩니다.",
    impact: "의료 구조화 데이터가 있으면 Google 검색에서 병원 정보(진료 시간, 전문 분야, 리뷰)가 리치 스니펫으로 표시되어 클릭률이 30% 이상 높아집니다.",
  });

  // JCI/HA 인증 표시
  const hasJCI = bodyText.toLowerCase().includes("jci") || bodyText.includes("joint commission international");
  const hasHA = bodyText.toLowerCase().includes("ha accreditation") || bodyText.includes("hospital accreditation");
  const hasCertification = hasJCI || hasHA;
  items.push({
    id: "th-medical-certification",
    category: "병원 특화 SEO",
    name: "국제 인증 표시 (JCI/HA)",
    status: hasCertification ? "pass" : "warning",
    score: hasCertification ? 4 : 1,
    maxScore: 4,
    detail: `${[hasJCI && 'JCI 인증', hasHA && 'HA 인증'].filter(Boolean).join(', ') || '국제 인증 표시 없음'}`,
    recommendation: hasCertification 
      ? "국제 인증이 잘 표시되어 있습니다." 
      : "JCI, HA 등 국제 인증을 사이트에 명시하세요. 의료관광 환자의 신뢰도를 크게 높입니다.",
    impact: "JCI/HA 인증은 국제 환자가 병원을 선택할 때 가장 중요하게 보는 요소입니다. 인증 표시가 있으면 의료관광 전환율이 크게 높아집니다.",
  });

  // 다국어 가격 정보
  const hasPricing = bodyText.toLowerCase().includes("price") || bodyText.toLowerCase().includes("cost") || bodyText.includes("ราคา") || bodyText.includes("가격") || bodyText.toLowerCase().includes("baht") || bodyText.includes("฿");
  items.push({
    id: "th-pricing-transparency",
    category: "병원 특화 SEO",
    name: "시술 가격 투명성",
    status: hasPricing ? "pass" : "warning",
    score: hasPricing ? 3 : 0,
    maxScore: 3,
    detail: hasPricing ? "가격 관련 정보가 있습니다." : "가격 정보가 없습니다.",
    recommendation: hasPricing 
      ? "가격 정보가 잘 제공되어 있습니다." 
      : "시술 가격 범위를 사이트에 표시하세요. 태국 의료관광의 핵심 경쟁력은 가격 투명성입니다.",
    impact: "의료관광 환자의 80%가 가격을 비교한 후 병원을 선택합니다. 가격 정보가 없으면 이탈률이 높아집니다.",
  });

  // WhatsApp 연동 (국제 환자용)
  const hasWhatsApp = html.includes("wa.me") || html.includes("whatsapp") || html.includes("api.whatsapp.com") || $("a[href*='wa.me']").length > 0;
  items.push({
    id: "th-whatsapp-integration",
    category: "병원 특화 SEO",
    name: "WhatsApp 연동 (국제 환자)",
    status: hasWhatsApp ? "pass" : "warning",
    score: hasWhatsApp ? 3 : 0,
    maxScore: 3,
    detail: hasWhatsApp ? "WhatsApp 링크가 있습니다." : "WhatsApp 연동이 없습니다.",
    recommendation: hasWhatsApp 
      ? "WhatsApp이 잘 연동되어 있습니다." 
      : "WhatsApp 상담 링크를 추가하세요. 중동/유럽/남미 의료관광 환자는 WhatsApp을 선호합니다.",
    impact: "WhatsApp은 전 세계 20억+ 사용자를 보유한 메신저입니다. 국제 의료관광 환자와의 소통에 필수적입니다.",
  });

  return items;
}

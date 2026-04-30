/**
 * Translation maps for English PDF report generation.
 * These maps translate Korean category names, item names,
 * and dynamic text patterns to English equivalents.
 */

// Category name translations (Korean → English)
export const categoryNameEN: Record<string, string> = {
  "메타 태그": "Meta Tags",
  "콘텐츠 구조": "Content Structure",
  "홈페이지 기본 설정": "Technical Infrastructure",
  "소셜 미디어": "Social Signals",
  "검색 고급 설정": "AI Crawling Optimization",
  "네이버 검색 최적화": "Naver AI Readiness",
  "병원 특화 SEO": "Healthcare AI Visibility",
  "AI 검색 노출": "AI Citation & Visibility",
  "성능 최적화": "Performance Optimization",
  "모바일 최적화": "Mobile Optimization",
  "접근성/UX": "Accessibility / UX",
  "국제화/다국어": "Internationalization",
  "Google Thailand 최적화": "Google Thailand Optimization",
};

// Item name translations (by id)
export const itemNameEN: Record<string, string> = {
  // Meta Tags
  "meta-title": "Title Tag",
  "meta-description": "Meta Description",
  "meta-keywords": "Meta Keywords",
  "meta-viewport": "Mobile Viewport",
  "meta-canonical": "Canonical URL",
  "meta-charset": "Character Encoding (Charset)",
  "meta-title-keyword": "Title Keyword Match",
  "meta-og-image-size": "OG Image Size",
  "meta-duplicates": "Duplicate Meta Tags",
  "meta-desc-keyword": "Meta Description Keyword",

  // Content Structure
  "content-h1": "H1 Tag",
  "content-headings": "Heading Hierarchy (H1–H6)",
  "content-img-alt": "Image Alt Tags",
  "content-text-length": "Content Text Length",
  "content-links": "Internal / External Links",
  "content-freshness": "Content Update Date",
  "content-video": "Video Content",
  "content-table": "Table Structured Data",
  "content-readability": "Content Readability",
  "content-img-optimization": "Image Optimization",

  // Technical Infrastructure
  "tech-ssl": "SSL Certificate (HTTPS)",
  "tech-robots": "robots.txt",
  "tech-sitemap": "Sitemap (sitemap.xml)",
  "tech-accessibility": "Page Accessibility",
  "tech-response-time": "Server Response Time (TTFB)",
  "tech-http2": "HTTP/2 or HTTP/3 Support",
  "tech-compression": "Compression (Gzip/Brotli)",
  "tech-cache": "Cache Headers",

  // Social Media
  "social-og": "Open Graph Tags",
  "social-twitter": "Twitter Card Tags",
  "social-links": "Social Media Channel Links",
  "social-line": "LINE Official Account",
  "social-kakao": "KakaoTalk Integration",
  "social-proof": "Social Proof (Reviews/Ratings)",

  // Advanced Configuration
  "advanced-jsonld": "Structured Data (Schema.org)",
  "advanced-lang": "Language Attribute (lang)",
  "advanced-favicon": "Favicon",
  "advanced-robots-meta": "Meta Robots Tag",
  "advanced-security-headers": "Security Headers (CSP/HSTS)",
  "advanced-google-verification": "Google Search Console Verification",
  "advanced-jsonld-valid": "Structured Data Validity",
  "advanced-pagination": "Pagination / Infinite Scroll",

  // Naver Search Optimization
  "naver-verification": "Naver Search Advisor Verification",
  "naver-og-tags": "Naver Share Optimization (OG Extended)",
  "naver-korean-content": "Korean Content Optimization",
  "naver-ecosystem": "Naver Ecosystem Integration",
  "naver-sitemap": "Sitemap + robots.txt Integration",
  "naver-smart-place": "Naver Smart Place Integration",
  "naver-booking": "Naver Booking System",
  "naver-pay": "Naver Pay Integration",

  // Healthcare AI Visibility
  "hospital-medical-schema": "Medical Structured Data",
  "hospital-contact": "Contact / Location Info",
  "hospital-booking": "Appointment / Booking System",
  "hospital-doctor-info": "Doctor Info / Expertise",
  "hospital-faq": "FAQ (Frequently Asked Questions)",
  "hospital-legal": "Privacy Policy / Terms of Service",
  "hospital-gallery": "Before / After Gallery",
  "hospital-reviews": "Patient Reviews Section",
  "hospital-cost": "Cost / Insurance Info",
  "hospital-multilang": "Multilingual Medical Content",

  // AI Search Visibility
  "ai-crawlers": "AI Crawler Access",
  "ai-schema": "AI-Citable Structured Data",
  "ai-semantic": "Semantic HTML Structure",
  "ai-eeat": "E-E-A-T Trust Signals",
  "ai-citability": "Content Citability",
  "ai-metadata": "AI Search Metadata",
  "ai-qa-optimization": "AI Q&A Optimization",
  "ai-content-depth": "AI Expert Content Depth",
  "ai-explicit-allow": "Explicit AI Crawler Allow",
  "ai-source-branding": "AI Source Branding",
  "ai-llms-txt": "llms.txt (AI Guide File)",
  "ai-conversational": "AI Conversational Content",
  "ai-data-table": "Data Table Structure",
  "ai-snippet": "AI Snippet Optimization",

  // Performance Optimization
  "perf-page-size": "Page Size",
  "perf-scripts": "External Script Count",
  "perf-css": "CSS File Count",
  "perf-inline-css": "Inline CSS Ratio",
  "perf-image-format": "Next-Gen Image Formats",
  "perf-preload": "Resource Hints (Preload/Prefetch)",
  "perf-js-defer": "JavaScript Deferred Loading",
  "perf-dom-size": "DOM Size",

  // Mobile Optimization
  "mobile-tel-button": "Mobile Call Button",
  "mobile-touch-target": "Touch Target Size",
  "mobile-font-size": "Mobile Font Size",
  "mobile-no-horizontal-scroll": "No Horizontal Scroll",
  "mobile-popup": "Mobile Popup Control",
  "mobile-amp": "AMP Support",
  "mobile-pwa": "PWA Support",
  "mobile-navigation": "Mobile Navigation",

  // Accessibility / UX
  "ux-aria": "ARIA Accessibility Attributes",
  "ux-form": "Form Accessibility",
  "ux-contrast": "Color Contrast",
  "ux-404": "Error Page Handling",
  "ux-cta": "CTA Button (Call to Action)",
  "ux-breadcrumb": "Breadcrumb Navigation",

  // Internationalization
  "intl-hreflang": "hreflang Multilingual Tags",
  "intl-multilang-content": "Multilingual Content",
  "intl-phone": "International Phone Format",
  "intl-currency": "Multilingual Price / Currency",
  "intl-patient-page": "International Patient Page",

  // Thailand specific
  "th-google-search-console": "Google Search Console Registration",
  "th-og-tags": "OG Tag Optimization (Google/Facebook)",
  "th-thai-content": "Thai Content Optimization",
  "th-line-integration": "LINE Official Account Integration",
  "th-google-maps": "Google Maps / Business Profile",
  "th-facebook-integration": "Facebook Business Integration",
  "th-instagram-integration": "Instagram Business Integration",
  "th-hreflang-medical-tourism": "Multilingual hreflang (Medical Tourism)",
  "th-social-line": "LINE Integration",
  "th-medical-tourism-schema": "Medical Tourism Structured Data",
  "th-medical-certification": "International Certification (JCI/HA)",
  "th-pricing-transparency": "Procedure Pricing Transparency",
  "th-whatsapp-integration": "WhatsApp Integration (International Patients)",
};

// Common Korean text patterns → English translations for dynamic content
// These are used to translate detail, recommendation, and impact fields
export const dynamicTextEN: Record<string, string> = {
  // Status-related
  "없습니다": "not found",
  "있습니다": "found",
  "설정되지 않았습니다": "is not configured",
  "설정되어 있습니다": "is configured",
  "올바르게 설정되어 있습니다": "is correctly configured",
  "추가하세요": "should be added",
  "최적화하세요": "should be optimized",
  "확인하세요": "should be verified",

  // Common recommendation phrases
  "모든 페이지에": "On all pages",
  "핵심 키워드를 포함하고": "Include core keywords and",
  "AI 플랫폼이": "AI platforms",
  "AI 답변에서": "In AI responses",
  "클릭률": "click-through rate (CTR)",
  "구글은": "Google",
  "네이버는": "Naver",

  // Common labels
  "정상": "Normal",
  "적절한": "Appropriate",
  "필수입니다": "is required",
};

/**
 * Translate a category name from Korean to English.
 * Returns the original name if no translation exists.
 */
export function translateCategoryName(name: string): string {
  return categoryNameEN[name] || name;
}

/**
 * Translate an item name from Korean to English using its id.
 * Returns the original name if no translation exists.
 */
export function translateItemName(id: string, originalName: string): string {
  return itemNameEN[id] || originalName;
}

/**
 * Translate dynamic Korean text to English using pattern matching.
 * This is a best-effort translation for detail/recommendation/impact fields.
 * Falls back to original text if no patterns match.
 */
export function translateDynamicText(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [ko, en] of Object.entries(dynamicTextEN)) {
    result = result.replace(new RegExp(ko, "g"), en);
  }
  return result;
}

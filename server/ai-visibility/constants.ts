/**
 * AI 가시성 진단 보고서 — 공통 상수
 * 
 * PDF/HTML 보고서 모두에서 사용하는 카테고리명 매핑, 색상 팔레트 등.
 * 디자인 시스템의 단일 진실 소스(Single Source of Truth).
 */

// ── Category name mappings ──
export const CAT_NAMES_KO: Record<string, string> = {
  "AI Citation": "AI 검색 노출",
  "Content Structure": "콘텐츠 구조",
  "Hospital AI Visibility": "병원 특화 SEO",
  "Naver AI Response": "네이버 검색 최적화",
  "Meta Tags": "메타 태그",
  "AI Crawling Optimization": "검색 고급 설정",
  "Social Signals": "소셜 신호",
  "Performance Optimization": "성능 최적화",
  "Mobile Responsiveness": "모바일 대응",
  "Accessibility/UX": "접근성/UX",
  "Internationalization/Multilingual": "국제화/다국어",
  "Homepage Basics": "홈페이지 기본 설정",
};

export const CAT_NAMES_EN: Record<string, string> = {
  "AI Citation": "AI Citation",
  "Content Structure": "Content Structure",
  "Hospital AI Visibility": "Hospital AI Visibility",
  "Naver AI Response": "Naver AI Response",
  "Meta Tags": "Meta Tags",
  "AI Crawling Optimization": "AI Crawling Optimization",
  "Social Signals": "Social Signals",
  "Performance Optimization": "Performance Optimization",
  "Mobile Responsiveness": "Mobile Responsiveness",
  "Accessibility/UX": "Accessibility/UX",
  "Internationalization/Multilingual": "Internationalization/Multilingual",
  "Homepage Basics": "Homepage Basics",
};

export const CAT_NAMES_TH: Record<string, string> = {
  "AI Citation": "การอ้างอิง AI",
  "Content Structure": "โครงสร้างเนื้อหา",
  "Hospital AI Visibility": "SEO เฉพาะโรงพยาบาล",
  "Naver AI Response": "การตอบสนอง Naver AI",
  "Meta Tags": "เมตาแท็ก",
  "AI Crawling Optimization": "การเพิ่มประสิทธิภาพการ Crawl",
  "Social Signals": "สัญญาณโซเชียล",
  "Performance Optimization": "การเพิ่มประสิทธิภาพ",
  "Mobile Responsiveness": "การตอบสนองมือถือ",
  "Accessibility/UX": "การเข้าถึง/UX",
  "Internationalization/Multilingual": "สากล/หลายภาษา",
  "Homepage Basics": "พื้นฐานหน้าแรก",
};

// ── Grade color mapping ──
export function getGradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "#059669"; // green
  if (grade === "B") return "#B45309"; // gold
  if (grade === "C") return "#D97706"; // amber
  return "#DC2626"; // red
}

// ── Status color mapping ──
export function getStatusColor(status: string): string {
  if (status === "pass") return "#059669";
  if (status === "warning") return "#D97706";
  return "#DC2626";
}

export function getStatusBg(status: string): string {
  if (status === "pass") return "#D1FAE5";
  if (status === "warning") return "#FEF3C7";
  return "#FEE2E2";
}

// ── Score range color coding ──
export function getScoreRangeColor(pct: number): string {
  if (pct >= 0.8) return "#059669";
  if (pct >= 0.6) return "#B45309";
  if (pct >= 0.4) return "#D97706";
  return "#DC2626";
}

// ── Category name resolver by language ──
export function getCategoryName(name: string, lang: "ko" | "en" | "th"): string {
  if (lang === "en") return CAT_NAMES_EN[name] || name;
  if (lang === "th") return CAT_NAMES_TH[name] || name;
  return CAT_NAMES_KO[name] || name;
}

// ── AI category English constant ──
export const AI_CATEGORY_EN = "AI Search Visibility";

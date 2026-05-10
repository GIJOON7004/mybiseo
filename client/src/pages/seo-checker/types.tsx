import React, { createContext, useContext } from "react";

export type SeoCheckStatus = "pass" | "fail" | "warning";

export interface SeoCheckItem {
  id: string;
  category: string;
  name: string;
  status: SeoCheckStatus;
  score: number;
  maxScore: number;
  detail: string;
  recommendation: string;
  impact: string;
}

export interface CategoryResult {
  name: string;
  score: number;
  maxScore: number;
  items: SeoCheckItem[];
}

export interface SeoResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  categories: CategoryResult[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

/* ── 국기 이미지 컴포넌트 (flagcdn.com CDN) ── */
export const FlagKR = ({ size = 20 }: { size?: number }) => {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src="https://flagcdn.com/w80/kr.png"
      alt="대한민국 국기"
      width={size}
      height={h}
      className="inline-block rounded-sm shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
};
export const FlagTH = ({ size = 20 }: { size?: number }) => {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src="https://flagcdn.com/w80/th.png"
      alt="태국 국기"
      width={size}
      height={h}
      className="inline-block rounded-sm shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
};
export const FlagUS = ({ size = 20 }: { size?: number }) => {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src="https://flagcdn.com/w80/us.png"
      alt="미국 국기"
      width={size}
      height={h}
      className="inline-block rounded-sm shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
};

export type ReportLang = "ko" | "en" | "th";
export type CountryCode = "kr" | "th";

/* ── i18n: country 기반 텍스트 ── */
export const CountryContext = createContext<CountryCode>("kr");
export function useCountry() { return useContext(CountryContext); }

export function t(country: CountryCode, ko: string, en: string): string;
export function t(country: CountryCode, ko: React.ReactNode, en: React.ReactNode): React.ReactNode;
export function t(country: CountryCode, ko: any, en: any) { return country === "th" ? en : ko; }

export const categoryNameEN: Record<string, string> = {
  "메타 태그": "Meta Tags",
  "콘텐츠 구조": "Content Structure",
  "홈페이지 기본 설정": "Technical Search",
  "소셜 미디어": "Social Media",
  "검색 고급 설정": "AI Crawling",
  "네이버 검색 최적화": "Naver AI Readiness",
  "Google Thailand 최적화": "Google Thailand Optimization",
  "병원 특화 SEO": "Healthcare AI",
  "AI 검색 노출": "AI Search Visibility",
  "성능 최적화": "Performance Optimization",
  "모바일 최적화": "Mobile Optimization",
  "접근성/UX": "Accessibility / UX",
  "국제화/다국어": "Internationalization",
};

export function localCatName(name: string, country: CountryCode): string {
  if (country === "th") return categoryNameEN[name] || name;
  return name;
}

export const SPECIALTIES = [
  { value: "", label: "진료과 선택" },
  { value: "치과", label: "치과" },
  { value: "피부과", label: "피부과" },
  { value: "성형외과", label: "성형외과" },
  { value: "한의원", label: "한의원" },
  { value: "정형외과", label: "정형외과" },
  { value: "안과", label: "안과" },
  { value: "산부인과", label: "산부인과" },
  { value: "종합병원", label: "종합병원" },
  { value: "소아과", label: "소아과" },
  { value: "신경외과", label: "신경외과" },
  { value: "비뇨기과", label: "비뇨기과" },
  { value: "정신건강의학과", label: "정신건강의학과" },
  { value: "내과", label: "내과" },
  { value: "이비인후과", label: "이비인후과" },
  { value: "동물병원", label: "동물병원" },
];

export const REGIONS_LIST = [
  "서울 강남", "서울 서초", "서울 송파", "서울 마포", "서울 강서", "서울 강동", "서울 영등포", "서울 종로",
  "경기 성남", "경기 수원", "경기 고양", "경기 용인", "경기 부천",
  "부산", "대구", "인천", "대전", "광주", "제주", "기타",
];

export const REPORT_LANGS = [
  { value: "ko" as ReportLang, label: "한국어", FlagIcon: FlagKR },
  { value: "en" as ReportLang, label: "English", FlagIcon: FlagUS },
  { value: "th" as ReportLang, label: "ภาษาไทย", FlagIcon: FlagTH },
];

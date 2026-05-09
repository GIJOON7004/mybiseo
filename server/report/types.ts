/**
 * AI 가시성 진단 보고서 — 타입 정의 및 디자인 상수
 */
import type { RealityDiagnosis as RealityDiagnosisImported } from "../reality-diagnosis";
export type RealityDiagnosis = RealityDiagnosisImported;

export interface SeoAuditResult {
  url: string;
  score?: number;
  totalScore?: number;
  maxScore: number;
  analyzedAt?: string;
  siteName?: string;
  grade: string;
  summary: { passed: number; warnings: number; failed: number; total?: number };
  categories: {
    name: string;
    score: number;
    maxScore: number;
    items: {
      id: string;
      name: string;
      status: "pass" | "warning" | "fail" | "info";
      score: number;
      maxScore: number;
      detail: string;
      recommendation: string;
      impact: string;
    }[];
  }[];
  diagnosticLimitation?: {
    type: "inaccessible" | "spa_empty" | "blocked";
    message: string;
  };
}

export type Lang = "ko" | "en" | "th";
export type ReportLanguage = Lang;

// ═══════════════════════════════════════════════
// DESIGN SYSTEM — 통일된 색상, 간격, 타이포그래피
// ═══════════════════════════════════════════════
export const C = {
  navy: "#1B2A4A",
  navyLight: "#2C3E6B",
  blue: "#3B82F6",
  blueLight: "#DBEAFE",
  blueMid: "#93C5FD",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  bgWarm: "#F1F5F9",
  bgAccent: "#EEF2FF",
  text: "#1E293B",
  textMid: "#475569",
  textLight: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  pass: "#059669",
  passLight: "#D1FAE5",
  warn: "#D97706",
  warnLight: "#FEF3C7",
  fail: "#DC2626",
  failLight: "#FEE2E2",
  gold: "#B45309",
  purple: "#8B5CF6",
  grayBar: "#E5E7EB",
  grayMid: "#4B5563",
  greenTint: "#F0FDF4",
  redTint: "#FEF2F2",
  purpleTint: "#F5F3FF",
  blueTintLight: "#CBD5E1",
  teal: "#1B2A4A",
  tealLight: "#DBEAFE",
  tealMid: "#2C3E6B",
  tealDark: "#1B2A4A",
};

// 디자인 상수 — 통일된 간격 시스템
export const PW = 595.28; // A4 width
export const PH = 841.89; // A4 height
export const ML = 52;     // margin left
export const MR = 52;     // margin right
export const MT = 74;     // margin top
export const CW = PW - ML - MR; // content width
export const MAX_Y = PH - 72;   // max content Y before page break

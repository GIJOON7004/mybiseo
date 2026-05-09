/**
 * AI 가시성 진단 보고서 — 공통 타입 정의
 * 
 * PDF(pdfkit) 보고서와 HTML(puppeteer) 보고서 모두에서 사용하는 공유 타입.
 * report/types.ts는 PDF 전용 디자인 상수를 포함하므로, 여기서는 순수 도메인 타입만 정의.
 */
import type { RealityDiagnosis as RealityDiagnosisImported } from "../reality-diagnosis";

// ── Re-export for convenience ──
export type RealityDiagnosis = RealityDiagnosisImported;

// ── Core audit result type ──
export interface SeoAuditResult {
  url: string;
  score?: number;
  totalScore?: number;
  maxScore: number;
  analyzedAt?: string;
  siteName?: string;
  grade: string;
  summary: { passed: number; warnings: number; failed: number; total?: number };
  categories: AuditCategory[];
  /** 사이트 접근 불가 또는 SPA 감지 시 한계 고지 */
  diagnosticLimitation?: {
    type: "inaccessible" | "spa_empty" | "blocked";
    message: string;
  };
}

export interface AuditCategory {
  name: string;
  score: number;
  maxScore: number;
  items: AuditItem[];
}

export interface AuditItem {
  id: string;
  name: string;
  status: "pass" | "warning" | "fail" | "info";
  score: number;
  maxScore: number;
  detail: string;
  recommendation: string;
  impact: string;
}

// ── Language types ──
export type Lang = "ko" | "en" | "th";
export type ReportLanguage = Lang;

// ── Grade helpers ──
export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

// ── Score range for color coding ──
export interface ScoreRange {
  min: number;
  max: number;
  color: string;
  label: string;
}

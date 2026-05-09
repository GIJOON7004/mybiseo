/**
 * Report Section Plugin Architecture — Type Definitions
 * 
 * sections.ts의 25개 함수를 점진적으로 Plugin 패턴으로 전환하기 위한
 * 공통 타입 정의. Strangler Fig 패턴으로 기존 코드를 깨지 않으면서
 * 새 섹션부터 Plugin으로 작성할 수 있게 합니다.
 * 
 * 사용법:
 *   import type { ReportContext, SectionPlugin } from "../lib/report-plugin-types";
 */

import type { RealityDiagnosis } from "../reality-diagnosis";

// ── Report Context (모든 섹션이 공유하는 데이터) ──
export interface ReportContext {
  /** 번역된 i18n 문자열 맵 */
  t: Record<string, string>;
  /** 진단 대상 URL */
  url: string;
  /** 종합 점수 (0~100) */
  score: number;
  /** 등급 (A+, A, B, C, D, F) */
  grade: string;
  /** 카테고리별 진단 결과 */
  categories: Array<{
    name: string;
    score: number;
    maxScore: number;
    items: Array<{
      name: string;
      status: "passed" | "warning" | "failed";
      message?: string;
      details?: string;
    }>;
  }>;
  /** 현실 진단 결과 (AI 추천 분석) */
  realityDiagnosis: RealityDiagnosis | null;
  /** 언어 코드 */
  lang: "ko" | "en" | "th";
  /** 현재 페이지 번호 (렌더링 후 치환) */
  pageNum: number;
  /** 전체 페이지 수 (렌더링 후 치환) */
  totalPages: number;
  /** 병원명 (sanitized) */
  hospitalName: string;
  /** QR 코드 DataURL */
  qrDataUrl: string;
  /** 월별 트렌드 데이터 */
  historyData: Array<{ month: string; score: number }>;
  /** 요약 통계 */
  summary: { passed: number; warnings: number; failed: number };
}

// ── Section Plugin Interface ──
export interface SectionPlugin {
  /** 플러그인 고유 ID (kebab-case) */
  id: string;
  /** 섹션 표시 이름 */
  name: string;
  /** 이 섹션을 렌더링할지 결정 (데이터 존재 여부 등) */
  shouldRender(ctx: ReportContext): boolean;
  /** HTML 문자열 반환 (페이지 단위, 여러 페이지 가능) */
  render(ctx: ReportContext): string | string[];
  /** 렌더링 순서 (낮을수록 먼저) */
  order: number;
}

// ── Section Registry ──
const _registry: SectionPlugin[] = [];

/**
 * 새 섹션 플러그인을 등록합니다.
 */
export function registerSection(plugin: SectionPlugin): void {
  _registry.push(plugin);
  _registry.sort((a, b) => a.order - b.order);
}

/**
 * 등록된 모든 플러그인을 순서대로 반환합니다.
 */
export function getRegisteredSections(): readonly SectionPlugin[] {
  return _registry;
}

/**
 * 레지스트리를 초기화합니다 (테스트용).
 */
export function clearRegistry(): void {
  _registry.length = 0;
}

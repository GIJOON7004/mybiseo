/**
 * AI 가시성 진단 보고서 — 모듈 barrel export
 * 
 * 구조:
 * - types.ts: 타입 정의 + 디자인 상수
 * - i18n.ts: 다국어 번역 데이터 (ko/en/th)
 * - pdf-utils.ts: PDF 드로잉 유틸리티 함수
 * - ../ai-visibility-report.ts: 메인 PDF 생성 함수 (이 모듈들을 import)
 */
export * from "./types";
export { i18n } from "./i18n";
export * from "./pdf-utils";

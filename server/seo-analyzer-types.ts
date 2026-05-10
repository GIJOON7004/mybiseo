/**
 * SEO Analyzer 공유 타입 정의
 * 순환 의존성 방지를 위해 별도 파일로 분리
 */

export type SeoCheckStatus = "pass" | "fail" | "warning" | "info";

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

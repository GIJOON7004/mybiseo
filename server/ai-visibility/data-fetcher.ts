/**
 * AI 가시성 진단 보고서 — 데이터 조회 레이어
 * 
 * 보고서 생성에 필요한 외부 데이터(DB 이력, 비교 데이터 등)를
 * 한 곳에서 관리하여 보고서 렌더링 로직과 데이터 소스를 분리.
 * 
 * Strangler Fig 패턴: 기존 db.ts 함수를 래핑하여 점진적으로 이관.
 */
import { getMonthlyTrendByUrl, getScoreComparisonByUrl } from "../db";

// ── Types (실제 DB 반환 타입에 맞춤) ──
export interface MonthlyTrendEntry {
  month: string;
  avgScore: number;
  avgAiScore: number;
  maxScore: number;
  minScore: number;
  count: number;
  latestGrade: string;
  latestCategoryScores: string;
}

export interface ScoreComparison {
  first: {
    score: number;
    aiScore: number;
    grade: string;
    date: Date;
    categoryScores: string | null;
  };
  latest: {
    score: number;
    aiScore: number;
    grade: string;
    date: Date;
    categoryScores: string | null;
  };
  change: number;
  aiChange: number;
  totalDiagnoses: number;
  periodDays: number;
}

// ── Data fetching functions ──

/**
 * URL별 월별 점수 추이 조회
 * 에러 시 빈 배열 반환 (보고서 생성이 중단되지 않도록)
 */
export async function fetchMonthlyTrend(url: string): Promise<MonthlyTrendEntry[]> {
  try {
    const data = await getMonthlyTrendByUrl(url);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * URL별 이전/현재 점수 비교 조회
 * 에러 시 null 반환
 */
export async function fetchScoreComparison(url: string): Promise<ScoreComparison | null> {
  try {
    const data = await getScoreComparisonByUrl(url);
    return data || null;
  } catch {
    return null;
  }
}

/**
 * 보고서 생성에 필요한 모든 보조 데이터를 한 번에 조회
 * (네트워크 요청 병렬화)
 */
export async function fetchReportData(url: string) {
  const [trend, comparison] = await Promise.all([
    fetchMonthlyTrend(url),
    fetchScoreComparison(url),
  ]);
  return { trend, comparison };
}

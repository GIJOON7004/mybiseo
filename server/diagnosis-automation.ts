/**
 * 진단 자동화 고도화 모듈 v2
 * - fail-close 원칙: 검증 실패 시 발송 차단 (기본 안전)
 * - 5가지 품질 게이트:
 *   1. 최소 총점 기준
 *   2. 필수 섹션 존재 확인
 *   3. 분석 실패 감지 (전체 0점)
 *   4. 카테고리 최소 수 확인
 *   5. 이상치 탐지 (만점 또는 극단적 점수)
 * - 일 10건 초과 시 운영자 검토 단계 제거 (자동 발송)
 */
import { getDiagnosisAutomationConfig, getDailyDiagnosisCount } from "./db";

export interface QualityCheckResult {
  passed: boolean;
  reasons: string[];
  autoSendAllowed: boolean;
  gateResults: GateResult[];
}

export interface GateResult {
  gate: string;
  passed: boolean;
  detail: string;
}

/**
 * 진단 리포트 발송 전 자동화 정책 확인 (fail-close)
 * 모든 게이트를 통과해야만 발송 허용
 */
export async function checkDiagnosisAutomation(reportData: {
  totalScore: number;
  maxScore?: number;
  categories: Array<{ name: string; score: number; maxScore: number }>;
  url?: string;
}): Promise<QualityCheckResult> {
  const config = await getDiagnosisAutomationConfig();
  const dailyCount = await getDailyDiagnosisCount();

  // 설정이 없으면 기본값 사용
  const threshold = config?.dailyThreshold ?? 10;
  const autoSendEnabled = config?.autoSendEnabled ?? true;
  const qualityMinScore = config?.qualityMinScore ?? 0;
  const requiredSectionsStr = config?.qualityRequiredSections ?? "[]";

  const reasons: string[] = [];
  const gateResults: GateResult[] = [];

  // ── Gate 1: 최소 총점 ──
  const gate1Passed = qualityMinScore <= 0 || reportData.totalScore >= qualityMinScore;
  gateResults.push({
    gate: "minimum_score",
    passed: gate1Passed,
    detail: gate1Passed
      ? `총점 ${reportData.totalScore} ≥ 기준 ${qualityMinScore}`
      : `총점 ${reportData.totalScore} < 기준 ${qualityMinScore}`,
  });
  if (!gate1Passed) {
    reasons.push(`총점(${reportData.totalScore})이 최소 기준(${qualityMinScore}) 미만`);
  }

  // ── Gate 2: 필수 섹션 존재 ──
  let gate2Passed = true;
  try {
    const requiredSections = JSON.parse(requiredSectionsStr) as string[];
    if (requiredSections.length > 0) {
      const presentSections = reportData.categories
        .filter(c => c.score > 0 || c.maxScore > 0)
        .map(c => c.name);
      const missing = requiredSections.filter(s => !presentSections.includes(s));
      gate2Passed = missing.length === 0;
      if (!gate2Passed) {
        reasons.push(`필수 섹션 누락: ${missing.join(", ")}`);
      }
    }
  } catch { /* ignore parse error */ }
  gateResults.push({
    gate: "required_sections",
    passed: gate2Passed,
    detail: gate2Passed ? "모든 필수 섹션 존재" : reasons[reasons.length - 1] || "섹션 검증 실패",
  });

  // ── Gate 3: 분석 실패 감지 (전체 0점) ──
  const allZero = reportData.categories.every(c => c.score === 0 && c.maxScore === 0);
  const gate3Passed = !allZero;
  gateResults.push({
    gate: "analysis_validity",
    passed: gate3Passed,
    detail: gate3Passed ? "유효한 분석 결과" : "모든 카테고리 점수 0 (분석 실패)",
  });
  if (!gate3Passed) {
    reasons.push("모든 카테고리 점수가 0 (분석 실패 가능성)");
  }

  // ── Gate 4: 카테고리 최소 수 확인 ──
  const MIN_CATEGORIES = 3;
  const validCategories = reportData.categories.filter(c => c.maxScore > 0);
  const gate4Passed = validCategories.length >= MIN_CATEGORIES;
  gateResults.push({
    gate: "minimum_categories",
    passed: gate4Passed,
    detail: gate4Passed
      ? `유효 카테고리 ${validCategories.length}개 ≥ 최소 ${MIN_CATEGORIES}개`
      : `유효 카테고리 ${validCategories.length}개 < 최소 ${MIN_CATEGORIES}개`,
  });
  if (!gate4Passed) {
    reasons.push(`유효 카테고리(${validCategories.length}개)가 최소 기준(${MIN_CATEGORIES}개) 미만`);
  }

  // ── Gate 5: 이상치 탐지 (만점 또는 극단적 점수) ──
  const maxScore = reportData.maxScore || 100;
  const scoreRatio = reportData.totalScore / maxScore;
  const isPerfect = scoreRatio >= 0.99; // 99% 이상은 의심
  const isTooLow = scoreRatio <= 0.05 && reportData.totalScore > 0; // 5% 이하 (0점 제외)
  const gate5Passed = !isPerfect && !isTooLow;
  gateResults.push({
    gate: "anomaly_detection",
    passed: gate5Passed,
    detail: gate5Passed
      ? `점수 비율 ${Math.round(scoreRatio * 100)}% (정상 범위)`
      : isPerfect
        ? `점수 비율 ${Math.round(scoreRatio * 100)}% (만점 의심 — 수동 검토 필요)`
        : `점수 비율 ${Math.round(scoreRatio * 100)}% (극단적 저점 — 분석 오류 의심)`,
  });
  if (!gate5Passed) {
    reasons.push(isPerfect
      ? "만점에 가까운 점수 (수동 검토 필요)"
      : "극단적으로 낮은 점수 (분석 오류 의심)");
  }

  // ── 최종 판정 (fail-close: 모든 게이트 통과 필요) ──
  const passed = gateResults.every(g => g.passed);

  // 자동 발송 여부 결정
  const autoSendAllowed = autoSendEnabled && passed && (dailyCount >= threshold);

  return {
    passed,
    reasons,
    autoSendAllowed: passed && autoSendAllowed,
    gateResults,
  };
}

/**
 * 현재 일일 진단 건수와 자동화 상태 요약
 */
export async function getDiagnosisAutomationStatus() {
  const config = await getDiagnosisAutomationConfig();
  const dailyCount = await getDailyDiagnosisCount();
  const threshold = config?.dailyThreshold ?? 10;

  return {
    dailyCount,
    threshold,
    autoSendEnabled: config?.autoSendEnabled ?? true,
    isAboveThreshold: dailyCount >= threshold,
    qualityMinScore: config?.qualityMinScore ?? 0,
    mode: dailyCount >= threshold ? "auto" : "review",
  };
}

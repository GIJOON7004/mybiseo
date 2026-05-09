/**
 * 진단 자동화 고도화 모듈
 * - 일 10건 초과 시 운영자 검토 단계 제거 (자동 발송)
 * - AI 리포트 품질 검증 (최소 점수, 필수 섹션 확인)
 */
import { getDiagnosisAutomationConfig, getDailyDiagnosisCount } from "./db";

export interface QualityCheckResult {
  passed: boolean;
  reasons: string[];
  autoSendAllowed: boolean;
}

/**
 * 진단 리포트 발송 전 자동화 정책 확인
 * - dailyThreshold 이하: 운영자 검토 필요 (수동 확인)
 * - dailyThreshold 초과: 자동 발송 (검토 단계 제거)
 * - 품질 미달 시: 발송 차단
 */
export async function checkDiagnosisAutomation(reportData: {
  totalScore: number;
  categories: Array<{ name: string; score: number; maxScore: number }>;
}): Promise<QualityCheckResult> {
  const config = await getDiagnosisAutomationConfig();
  const dailyCount = await getDailyDiagnosisCount();

  // 설정이 없으면 기본값 사용
  const threshold = config?.dailyThreshold ?? 10;
  const autoSendEnabled = config?.autoSendEnabled ?? true;
  const qualityMinScore = config?.qualityMinScore ?? 0;
  const requiredSectionsStr = config?.qualityRequiredSections ?? "[]";

  // 1. 품질 검증
  const reasons: string[] = [];

  // 최소 점수 체크
  if (qualityMinScore > 0 && reportData.totalScore < qualityMinScore) {
    reasons.push(`총점(${reportData.totalScore})이 최소 기준(${qualityMinScore}) 미만`);
  }

  // 필수 섹션 체크
  try {
    const requiredSections = JSON.parse(requiredSectionsStr) as string[];
    if (requiredSections.length > 0) {
      const presentSections = reportData.categories
        .filter(c => c.score > 0 || c.maxScore > 0)
        .map(c => c.name);
      const missing = requiredSections.filter(s => !presentSections.includes(s));
      if (missing.length > 0) {
        reasons.push(`필수 섹션 누락: ${missing.join(", ")}`);
      }
    }
  } catch { /* ignore parse error */ }

  // 카테고리 점수가 모두 0인 경우 (분석 실패)
  const allZero = reportData.categories.every(c => c.score === 0 && c.maxScore === 0);
  if (allZero) {
    reasons.push("모든 카테고리 점수가 0 (분석 실패 가능성)");
  }

  const passed = reasons.length === 0;

  // 2. 자동 발송 여부 결정
  // - 일일 건수가 threshold 초과 시: 자동 발송 (운영자 검토 생략)
  // - threshold 이하: 운영자 검토 후 발송 (단, autoSendEnabled=true이면 항상 자동)
  const autoSendAllowed = autoSendEnabled && (dailyCount >= threshold || passed);

  return {
    passed,
    reasons,
    autoSendAllowed: passed && autoSendAllowed,
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

/**
 * AI 가시성 진단 보고서 — 점수/등급 계산 유틸리티
 * 
 * 점수 반올림, 등급 결정, 게이지 비율 계산 등
 * PDF/HTML 보고서 모두에서 사용하는 점수 관련 로직.
 */

/**
 * 종합 점수(0-100)에서 등급 결정
 */
export function getGrade(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

/**
 * 점수를 정수로 반올림 (최종 표시용)
 */
export function displayScore(value: number): number {
  return Math.round(value);
}

/**
 * 백분율을 소수점 N자리로 반올림
 */
export function displayPercent(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 점수 비율 계산 (0~1 범위로 클램핑)
 */
export function scoreRatio(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.min(Math.max(score / maxScore, 0), 1);
}

/**
 * 카테고리 점수 달성률 (%) 계산
 */
export function categoryAchievement(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return displayPercent((score / maxScore) * 100);
}

/**
 * 등급별 설명 텍스트 (한국어)
 */
export function getGradeDescription(grade: string, lang: "ko" | "en" | "th" = "ko"): string {
  const descriptions: Record<string, Record<string, string>> = {
    ko: {
      "A+": "매우 우수 — AI 검색에서 최상위 노출이 기대됩니다.",
      "A": "우수 — AI 검색 노출 가능성이 높습니다.",
      "B": "양호 — 일부 개선으로 큰 효과를 볼 수 있습니다.",
      "C": "보통 — 체계적인 개선이 필요합니다.",
      "D": "미흡 — 즉각적인 조치가 필요합니다.",
      "F": "심각 — 전면적인 개선이 시급합니다.",
    },
    en: {
      "A+": "Excellent — Top visibility in AI search expected.",
      "A": "Very Good — High AI search visibility likely.",
      "B": "Good — Minor improvements can yield significant results.",
      "C": "Average — Systematic improvements needed.",
      "D": "Below Average — Immediate action required.",
      "F": "Critical — Comprehensive overhaul urgently needed.",
    },
    th: {
      "A+": "ดีเยี่ยม — คาดว่าจะมีการแสดงผลสูงสุดในการค้นหา AI",
      "A": "ดีมาก — มีแนวโน้มที่จะมีการแสดงผลสูงในการค้นหา AI",
      "B": "ดี — การปรับปรุงเล็กน้อยสามารถให้ผลลัพธ์ที่สำคัญ",
      "C": "ปานกลาง — ต้องการการปรับปรุงอย่างเป็นระบบ",
      "D": "ต่ำกว่าเกณฑ์ — ต้องดำเนินการทันที",
      "F": "วิกฤต — ต้องการการปรับปรุงทั้งหมดอย่างเร่งด่วน",
    },
  };
  return descriptions[lang]?.[grade] || descriptions.ko[grade] || "";
}

/**
 * 점수 변화량에 따른 트렌드 방향
 */
export function getScoreTrend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = current - previous;
  if (diff >= 3) return "up";
  if (diff <= -3) return "down";
  return "stable";
}

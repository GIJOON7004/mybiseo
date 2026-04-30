/**
 * #19 소수점 반올림 규칙 통일
 * 
 * 원칙:
 * - 중간 계산은 소수점을 유지한다 (정밀도 손실 방지)
 * - 최종 사용자 표시에만 반올림을 적용한다
 * - 백분율은 소수점 1자리, 점수는 정수로 표시
 */

/**
 * 중간 계산용: 소수점 유지 (반올림 없음)
 * 내부 로직에서 점수를 계산할 때 사용
 */
export function rawScore(value: number): number {
  return value;
}

/**
 * 최종 표시용: 점수를 정수로 반올림
 * UI에 표시하거나 최종 결과를 반환할 때 사용
 */
export function displayScore(value: number): number {
  return Math.round(value);
}

/**
 * 최종 표시용: 백분율을 소수점 1자리로 반올림
 * "87.3%" 형태로 표시할 때 사용
 */
export function displayPercent(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 최종 표시용: 금액을 만원 단위로 반올림
 * "약 1,500만원" 형태로 표시할 때 사용
 */
export function displayManwon(value: number): number {
  return Math.round(value);
}

/**
 * 최종 표시용: 비율(0~1)을 백분율 문자열로 변환
 * 예: 0.873 → "87.3%"
 */
export function formatPercent(ratio: number, decimals = 1): string {
  return `${displayPercent(ratio * 100, decimals)}%`;
}

/**
 * 최종 표시용: 점수를 "X/Y" 형태로 표시
 * 예: (73.6, 100) → "74/100"
 */
export function formatScoreDisplay(score: number, maxScore: number): string {
  return `${displayScore(score)}/${displayScore(maxScore)}`;
}

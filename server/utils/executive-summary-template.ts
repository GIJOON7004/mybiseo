/**
 * #22 executiveSummary 템플릿화
 * 
 * LLM 자유 생성 → 코드 기반 문장 구조 조립으로 전환
 * 
 * 원칙:
 * - 핵심 수치(점수, 노출률, 누락 환자 수, 매출 손실)는 코드에서 계산하여 삽입
 * - 문장 구조는 템플릿으로 고정하여 재현성 확보
 * - LLM이 생성한 executiveSummary가 있으면 수치만 동기화하고,
 *   없거나 비어있으면 템플릿 기반으로 생성
 */

export interface SummaryContext {
  hospitalName: string;
  specialty: string;
  seoScore: number;
  seoGrade: string;
  missedPatientsMonthly: number;
  revenueLossFormatted: string;
  naverExposureRate: number;
  googleExposureRate: number;
  aiReadiness: number;
  keyIssuesCount: number;
  topIssue?: string;
}

/**
 * 코드 기반 executiveSummary 생성
 * LLM이 빈 문자열을 반환하거나 실패했을 때 사용
 */
export function generateTemplatedSummary(ctx: SummaryContext): string {
  const { hospitalName, specialty, seoScore, seoGrade, missedPatientsMonthly, revenueLossFormatted, naverExposureRate, googleExposureRate, aiReadiness, keyIssuesCount, topIssue } = ctx;

  // 1문장: 현재 상태 요약
  const statusSentence = `${hospitalName}의 AI 가시성 진단 결과, 종합 점수 ${seoScore}점(${seoGrade} 등급)으로 ${getScoreAssessment(seoScore)}입니다.`;

  // 2문장: 핵심 문제점
  const exposureSentence = `네이버 노출률 ${naverExposureRate}%, 구글 노출률 ${googleExposureRate}%, AI 플랫폼 대응도 ${aiReadiness}%로, ${getExposureAssessment(naverExposureRate, googleExposureRate)}`;

  // 3문장: 비즈니스 영향
  const impactSentence = missedPatientsMonthly > 0
    ? `이로 인해 월 약 ${missedPatientsMonthly}명의 웹사이트 유입 누락 환자가 발생하고 있으며, ${revenueLossFormatted} 상당의 잠재 매출 기회가 존재합니다.`
    : `현재 검색 노출 부족으로 인한 잠재 환자 유입 기회가 상당 부분 누락되고 있습니다.`;

  // 4문장: 개선 방향
  const improvementSentence = keyIssuesCount > 0
    ? `총 ${keyIssuesCount}개의 개선 과제가 발견되었으며${topIssue ? `, 특히 ${topIssue}이(가) 가장 시급합니다` : ``}. 체계적 개선 시 3~6개월 내 가시성 점수 10~25점 개선이 가능할 수 있습니다(경쟁 환경에 따라 달라짐).`
    : `체계적인 AI 가시성 최적화를 통해 검색 노출과 환자 유입을 크게 개선할 수 있습니다.`;

  return `${statusSentence} ${exposureSentence} ${impactSentence} ${improvementSentence}`;
}

function getScoreAssessment(score: number): string {
  if (score >= 80) return "양호한 수준";
  if (score >= 60) return "보통 수준이나 개선 여지가 큼";
  if (score >= 40) return "개선이 필요한 수준";
  return "시급한 개선이 필요한 수준";
}

function getExposureAssessment(naver: number, google: number): string {
  const avg = (naver + google) / 2;
  if (avg >= 70) return "검색 노출은 양호하나 AI 플랫폼 대응이 필요합니다.";
  if (avg >= 40) return "주요 검색 채널에서의 노출이 부족한 상태입니다.";
  return "대부분의 검색 채널에서 노출이 매우 부족하여 즉각적인 조치가 필요합니다.";
}

/**
 * LLM이 생성한 executiveSummary를 검증하고, 비어있으면 템플릿으로 대체
 */
export function ensureExecutiveSummary(llmSummary: string | undefined, ctx: SummaryContext): string {
  // LLM 결과가 유효하면 그대로 사용 (수치 동기화는 별도 처리)
  if (llmSummary && llmSummary.trim().length > 20) {
    return llmSummary;
  }
  // 비어있거나 너무 짧으면 템플릿 기반 생성
  return generateTemplatedSummary(ctx);
}

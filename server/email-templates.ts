/**
 * 이메일 HTML 템플릿 빌더 — 맥킨지 보고서 요약본 스타일
 * 
 * 디자인 원칙:
 * - 밝은 배경 (#ffffff) + 진한 텍스트 (#1a1a2e) → 모든 이메일 클라이언트에서 가독성 보장
 * - 깔끔한 타이포그래피, 충분한 여백, 명확한 시각적 계층
 * - 테이블 기반 레이아웃 → 이메일 호환성 극대화
 * - 브랜드 컬러 #0d9488 (teal) 포인트 사용
 */

// ── 공통 스타일 상수 ──
const BRAND_COLOR = "#0d9488";
const BRAND_DARK = "#0a7c72";
const TEXT_PRIMARY = "#1a1a2e";
const TEXT_SECONDARY = "#4a5568";
const TEXT_MUTED = "#718096";
const BG_WHITE = "#ffffff";
const BG_LIGHT = "#f8fafb";
const BG_ACCENT = "#f0fdfa";
const BORDER_COLOR = "#e2e8f0";
const SCORE_GREEN = "#059669";
const SCORE_YELLOW = "#d97706";
const SCORE_RED = "#dc2626";

import { APP_BASE_URL, APP_DOMAIN } from "../shared/const";

function getScoreColor(score: number, threshold = { high: 80, mid: 60 }): string {
  if (score >= threshold.high) return SCORE_GREEN;
  if (score >= threshold.mid) return SCORE_YELLOW;
  return SCORE_RED;
}

function getGradeLabel(score: number): string {
  if (score >= 90) return "우수";
  if (score >= 80) return "양호";
  if (score >= 60) return "보통";
  if (score >= 40) return "미흡";
  return "위험";
}

/** 공통 이메일 래퍼 — 헤더 + 본문 + 푸터 */
function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MY비서 리포트</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: ${BG_WHITE}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          ${body}
        </table>
        <!-- 푸터 -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: ${TEXT_MUTED};">MY비서 | 글로벌 의료 마케팅 플랫폼</p>
              <p style="margin: 0; font-size: 11px; color: #a0aec0;">${APP_DOMAIN} | 010-7321-7004</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** 헤더 바 (브랜드 컬러 상단 라인 + 로고) */
function headerBar(title: string, subtitle?: string): string {
  return `
          <!-- 브랜드 컬러 상단 바 -->
          <tr>
            <td style="background-color: ${BRAND_COLOR}; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <!-- 헤더 -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid ${BORDER_COLOR};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 1.5px;">MY비서 REPORT</p>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: ${TEXT_PRIMARY}; line-height: 1.3;">${title}</h1>
                    ${subtitle ? `<p style="margin: 8px 0 0; font-size: 14px; color: ${TEXT_SECONDARY};">${subtitle}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

/** 점수 카드 (큰 숫자 + 라벨) */
function scoreCard(score: number, label: string, suffix = "점"): string {
  const color = getScoreColor(score);
  return `
              <td style="width: 50%; padding: 20px; text-align: center; background-color: ${BG_LIGHT}; border-radius: 8px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
                <p style="margin: 0; font-size: 36px; font-weight: 800; color: ${color}; line-height: 1;">${score}<span style="font-size: 18px; font-weight: 600;">${suffix}</span></p>
              </td>`;
}

/** 카테고리 테이블 행 */
function categoryRow(name: string, pct: number, isLast = false): string {
  const color = getScoreColor(pct);
  const barWidth = Math.max(pct, 5);
  return `
                <tr>
                  <td style="padding: 12px 0; ${isLast ? "" : `border-bottom: 1px solid ${BORDER_COLOR};`} font-size: 14px; color: ${TEXT_PRIMARY}; font-weight: 500;">${name}</td>
                  <td style="padding: 12px 0; ${isLast ? "" : `border-bottom: 1px solid ${BORDER_COLOR};`} width: 180px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width: 120px; padding-right: 12px;">
                          <div style="background-color: #edf2f7; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="background-color: ${color}; width: ${barWidth}%; height: 8px; border-radius: 4px;"></div>
                          </div>
                        </td>
                        <td style="font-size: 14px; font-weight: 700; color: ${color}; text-align: right; white-space: nowrap;">${pct}%</td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

/** CTA 버튼 */
function ctaButton(text: string, url: string, color = BRAND_COLOR): string {
  return `
              <td align="center" style="padding: 8px 0;">
                <a href="${url}" style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">${text}</a>
              </td>`;
}

// ═══════════════════════════════════════════════════════
// 1. 진단 결과 이메일 (AI 가시성 진단 후 즉시 발송)
// ═══════════════════════════════════════════════════════
export function buildDiagnosisEmail(params: {
  url: string;
  totalScore: number;
  grade: string;
  aiScore: number;
  summary: { passed: number; failed: number; warning: number };
  categories: Array<{ name: string; score: number; maxScore: number }>;
  pdfUrl?: string;
}): string {
  const { url, totalScore, aiScore, summary, categories, pdfUrl } = params;

  const categoryRowsHtml = categories.map((cat, i) => {
    const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
    return categoryRow(cat.name, pct, i === categories.length - 1);
  }).join("");

  const pdfSection = pdfUrl
    ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${ctaButton("상세 PDF 리포트 다운로드", pdfUrl)}
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  const body = `
          ${headerBar("AI + 포털 노출 진단 리포트", url)}
          
          <!-- 핵심 점수 -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${scoreCard(totalScore, "종합 점수")}
                  <td style="width: 16px;"></td>
                  ${scoreCard(aiScore, "AI 인용 점수", "%")}
                </tr>
              </table>
            </td>
          </tr>

          <!-- 요약 지표 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BG_ACCENT}; border-radius: 8px; border: 1px solid #ccfbf1;">
                <tr>
                  <td style="padding: 16px; text-align: center; width: 33%;">
                    <p style="margin: 0 0 2px; font-size: 11px; color: ${TEXT_MUTED};">통과</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${SCORE_GREEN};">${summary.passed}</p>
                  </td>
                  <td style="padding: 16px; text-align: center; width: 33%; border-left: 1px solid #ccfbf1; border-right: 1px solid #ccfbf1;">
                    <p style="margin: 0 0 2px; font-size: 11px; color: ${TEXT_MUTED};">주의</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${SCORE_YELLOW};">${summary.warning}</p>
                  </td>
                  <td style="padding: 16px; text-align: center; width: 33%;">
                    <p style="margin: 0 0 2px; font-size: 11px; color: ${TEXT_MUTED};">실패</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${SCORE_RED};">${summary.failed}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 카테고리별 점수 -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">카테고리별 분석</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${categoryRowsHtml}
              </table>
            </td>
          </tr>

          ${pdfSection}

          <!-- CTA 섹션 -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BG_LIGHT}; border-radius: 8px; border: 1px solid ${BORDER_COLOR};">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: ${TEXT_PRIMARY};">AI 인용 개선이 필요하신가요?</p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: ${TEXT_SECONDARY};">11년 경력 대표가 직접 무료 컨설팅을 진행합니다.</p>
                    <a href="${APP_BASE_URL}/#contact" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">무료 상담 신청</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return emailWrapper(body);
}

// ═══════════════════════════════════════════════════════
// 2. 월간 리포트 이메일
// ═══════════════════════════════════════════════════════
export function buildMonthlyReportEmail(params: {
  monthStr: string;
  url: string;
  totalScore: number;
  aiScore: number;
  prevScore: number;
  scoreDiff: number;
  categories: Array<{ name: string; score: number; maxScore: number }>;
}): string {
  const { monthStr, url, totalScore, aiScore, prevScore, scoreDiff, categories } = params;

  const diffText = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;
  const diffColor = scoreDiff > 0 ? SCORE_GREEN : scoreDiff < 0 ? SCORE_RED : TEXT_MUTED;
  const diffArrow = scoreDiff > 0 ? "&#9650;" : scoreDiff < 0 ? "&#9660;" : "&#8212;";

  const categoryRowsHtml = categories.map((cat: any, i: number) => {
    const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
    return categoryRow(cat.name, pct, i === categories.length - 1);
  }).join("");

  const body = `
          ${headerBar(`${monthStr} AI + 포털 노출 리포트`, url)}
          
          <!-- 핵심 점수 -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${scoreCard(totalScore, "종합 점수")}
                  <td style="width: 16px;"></td>
                  ${scoreCard(aiScore, "AI 인용 점수", "%")}
                </tr>
              </table>
            </td>
          </tr>

          <!-- 변화 지표 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BG_LIGHT}; border-radius: 8px; border: 1px solid ${BORDER_COLOR};">
                <tr>
                  <td style="padding: 16px 24px;">
                    <p style="margin: 0 0 2px; font-size: 12px; color: ${TEXT_MUTED};">전월 대비 변화</p>
                    <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${diffColor};">${diffArrow} ${diffText}점</p>
                  </td>
                  <td style="padding: 16px 24px; text-align: right;">
                    <p style="margin: 0 0 2px; font-size: 12px; color: ${TEXT_MUTED};">이전 점수</p>
                    <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${TEXT_SECONDARY};">${prevScore}점</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 카테고리별 점수 -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">카테고리별 분석</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${categoryRowsHtml}
              </table>
            </td>
          </tr>

          <!-- 푸터 CTA -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: ${TEXT_MUTED};">MY비서 | 병원 AI 마케팅 에이전시</p>
            </td>
          </tr>`;

  return emailWrapper(body);
}

// ═══════════════════════════════════════════════════════
// 3. 재진단 유도 이메일 (2주 후)
// ═══════════════════════════════════════════════════════
export function buildRediagnosisEmail(params: {
  url: string;
  totalScore: number;
  grade: string;
}): string {
  const { url, totalScore, grade } = params;

  const body = `
          ${headerBar("AI 인용 점수가 변했을 수 있습니다", `2주 전 진단: ${url}`)}
          
          <!-- 이전 점수 -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BG_LIGHT}; border-radius: 8px; border: 1px solid ${BORDER_COLOR};">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: ${TEXT_MUTED};">2주 전 종합 점수</p>
                    <p style="margin: 0; font-size: 42px; font-weight: 800; color: ${getScoreColor(totalScore)}; line-height: 1;">${totalScore}<span style="font-size: 20px; font-weight: 600;">점</span></p>
                    <p style="margin: 6px 0 0; font-size: 13px; color: ${TEXT_SECONDARY};">${grade}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: ${TEXT_PRIMARY};">AI 검색 엔진은 매주 학습 데이터를 업데이트합니다. 2주가 지난 지금, 귀원의 점수가 달라졌을 수 있습니다.</p>
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${TEXT_SECONDARY};">지금 다시 진단하여 최신 상태를 확인해 보세요.</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${ctaButton("지금 다시 진단하기", `${APP_BASE_URL}/ai-check?url=${encodeURIComponent(url)}`)}
                </tr>
              </table>
            </td>
          </tr>`;

  return emailWrapper(body);
}

// ═══════════════════════════════════════════════════════
// 4. 3일 후속 이메일
// ═══════════════════════════════════════════════════════
export function buildFollowup3dEmailNew(params: {
  email: string;
  url: string;
  score: number | null;
  aiScore: number | null;
}): string {
  const { url, score, aiScore } = params;

  const body = `
          ${headerBar("AI 인용, 개선하셨나요?", `3일 전 진단: ${url}`)}
          
          <!-- 점수 카드 -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${scoreCard(score ?? 0, "종합 점수")}
                  <td style="width: 16px;"></td>
                  ${scoreCard(aiScore ?? 0, "AI 인용 점수", "%")}
                </tr>
              </table>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: ${TEXT_PRIMARY};">환자들은 이제 <strong style="color: ${BRAND_COLOR};">ChatGPT, Gemini, Perplexity</strong>로도 병원을 찾습니다. AI 검색에서 노출되지 않으면 잠재 환자를 놓치고 있는 것입니다.</p>
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: ${TEXT_PRIMARY};">매출의 20~30%를 광고비로 쓰면서 에이전시에 의존하고 계시지 않으신가요? <strong style="color: ${BRAND_COLOR};">검색 최적화로 자연유입 환자를 늘리면</strong> 광고비 의존도를 낮추고 건강한 매출 기반을 만들 수 있습니다.</p>
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${TEXT_SECONDARY};">MY비서가 무료 상담을 통해 구체적인 개선 방안을 안내해 드립니다.</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${ctaButton("무료 상담 신청하기", `${APP_BASE_URL}/#contact`)}
                </tr>
              </table>
            </td>
          </tr>`;

  return emailWrapper(body);
}

// ═══════════════════════════════════════════════════════
// 5. 7일 후속 이메일 (긴급 톤)
// ═══════════════════════════════════════════════════════
export function buildFollowup7dEmailNew(params: {
  email: string;
  url: string;
  score: number | null;
  aiScore: number | null;
}): string {
  const { url, score, aiScore } = params;

  const body = `
          ${headerBar("경쟁 병원은 이미 AI 인용을 시작했습니다", `1주일 전 진단: ${url}`)}
          
          <!-- 경고 배너 -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-radius: 8px; border-left: 4px solid ${SCORE_RED};">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${TEXT_PRIMARY};">같은 진료과 경쟁 병원들이 AI 검색 최적화를 도입하고 있습니다. <strong style="color: ${SCORE_RED};">지금 시작하지 않으면 격차는 더 벌어집니다.</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 점수 카드 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${scoreCard(score ?? 0, "종합 점수")}
                  <td style="width: 16px;"></td>
                  ${scoreCard(aiScore ?? 0, "AI 인용 점수", "%")}
                </tr>
              </table>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: ${TEXT_PRIMARY};">MY비서는 <strong style="color: ${BRAND_COLOR};">포털 검색 + AI 검색</strong> 이중 노출 전략으로 신환 유치를 극대화합니다. 11년간 마케팅 대행사를 운영한 대표가 직접 컨설팅합니다.</p>
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${TEXT_PRIMARY};">광고비에 의존하는 매출 구조는 한계가 있습니다. <strong style="color: ${BRAND_COLOR};">검색 최적화로 자연유입을 늘리면</strong> 광고를 줄여도 환자가 계속 찾아옵니다.</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${ctaButton("지금 무료 상담 받기", `${APP_BASE_URL}/#contact`, SCORE_RED)}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 8px 0 0; font-size: 13px; color: ${TEXT_MUTED};">상담은 무료이며, 부담 없이 현황 분석만 받아보셔도 됩니다.</p>
            </td>
          </tr>`;

  return emailWrapper(body);
}

// ═══════════════════════════════════════════════════════
// 6. 점수 변동 알림 이메일 (재진단 유도 - blog-scheduler용)
// ═══════════════════════════════════════════════════════
export function buildScoreChangeEmail(params: {
  url: string;
  totalScore: number;
  grade: string;
}): string {
  return buildRediagnosisEmail(params);
}

// ═══════════════════════════════════════════════════════
// 7. 벤치마킹 리포트 완료 이메일
// ═══════════════════════════════════════════════════════
export function buildBenchmarkingReportEmail(params: {
  hospitalName: string;
  myScore: number;
  myGrade: string;
  competitors: Array<{ name: string; score: number; grade: string }>;
  executiveSummary: string;
  topInsights: Array<{ priority: string; title: string }>;
  pdfUrl?: string;
  reportUrl: string;
}): string {
  const { hospitalName, myScore, myGrade, competitors, executiveSummary, topInsights, pdfUrl, reportUrl } = params;
  const gradeColor = getScoreColor(myScore);

  const competitorRows = competitors.map((c) => {
    const diff = myScore - c.score;
    const diffColor = diff >= 0 ? SCORE_GREEN : SCORE_RED;
    const diffStr = diff > 0 ? `+${diff}` : String(diff);
    return `<tr style="border-bottom:1px solid ${BORDER_COLOR}">
      <td style="padding:10px 12px;font-size:13px;color:${TEXT_PRIMARY}">${c.name}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:center;color:${TEXT_PRIMARY}">${c.score}점 (${c.grade})</td>
      <td style="padding:10px 12px;font-size:13px;text-align:center;color:${diffColor};font-weight:600">${diffStr}</td>
    </tr>`;
  }).join("");

  const insightItems = topInsights.slice(0, 3).map(ins => {
    const priColor = ins.priority === "긴급" ? SCORE_RED : ins.priority === "중요" ? SCORE_YELLOW : SCORE_GREEN;
    return `<tr><td style="padding:6px 0">
      <span style="display:inline-block;background:${priColor};color:#fff;font-size:10px;padding:2px 8px;border-radius:4px;margin-right:8px">${ins.priority}</span>
      <span style="font-size:13px;color:${TEXT_PRIMARY}">${ins.title}</span>
    </td></tr>`;
  }).join("");

  const pdfSection = pdfUrl ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>${ctaButton("PDF 다운로드", pdfUrl, "#475569")}</tr>
              </table>
            </td>
          </tr>` : "";

  const body = `
          ${headerBar(`${hospitalName} 벤치마킹 리포트`, `경쟁사 대비 AI 가시성 분석 완료`)}
          
          <!-- 점수 카드 -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  ${scoreCard(myScore, "종합 AI 가시성 점수")}
                  <td style="width: 16px;"></td>
                  <td style="width: 50%; padding: 20px; text-align: center; background-color: ${BG_LIGHT}; border-radius: 8px;">
                    <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">경쟁사 수</p>
                    <p style="margin: 0; font-size: 36px; font-weight: 800; color: ${BRAND_COLOR}; line-height: 1;">${competitors.length}<span style="font-size: 18px; font-weight: 600;">개</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 요약 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${TEXT_PRIMARY};">${executiveSummary}</p>
            </td>
          </tr>

          <!-- 경쟁사 비교 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">경쟁사 비교</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden">
                <tr style="background:#f1f5f9">
                  <th style="padding:10px 12px;font-size:11px;color:${TEXT_SECONDARY};text-align:left;font-weight:600">경쟁사</th>
                  <th style="padding:10px 12px;font-size:11px;color:${TEXT_SECONDARY};text-align:center;font-weight:600">점수</th>
                  <th style="padding:10px 12px;font-size:11px;color:${TEXT_SECONDARY};text-align:center;font-weight:600">차이</th>
                </tr>
                ${competitorRows}
              </table>
            </td>
          </tr>

          <!-- 핵심 실행 지침 -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">핵심 실행 지침</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${insightItems}</table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>${ctaButton("전체 리포트 보기", reportUrl)}</tr>
              </table>
            </td>
          </tr>

          ${pdfSection}`;

  return emailWrapper(body);
}

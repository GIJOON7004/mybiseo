/**
 * AI 가시성 진단 보고서 PDF 생성 — 통합 디자인 시스템 v3.1 (최적화)
 * 참고: 시크릿에디션 CRM 보고서 수준의 완성도
 * 20페이지 이하 압축, 통일된 디자인, 영업 임팩트 극대화
 *
 * v3.1 최적화:
 * - 폰트 버퍼 lazy 초기화 (4.5MB base64 → Buffer 변환 1회만)
 * - QR 코드 캐시 유지
 * - 번역 병렬화 지원
 * - 불필요한 heightOfString 호출 최소화
 */
import * as PDFDocumentModule from "pdfkit";
const PDFDocument = (PDFDocumentModule as any).default || PDFDocumentModule;
import * as QRCode from "qrcode";
import { invokeLLM } from "./_core/llm";
import { resolveSpecialty } from "./specialty-weights";
import { SPECIALTY_REVENUE_PROFILES } from "./utils/specialty-revenue-data";
import { translateResultToEnglish } from "./ai-visibility-translate";
import { krRegularBase64, krBoldBase64 } from "./fonts-base64";
import { getMonthlyTrendByUrl, getScoreComparisonByUrl } from "./db";
// Modularized imports from report/
import type { SeoAuditResult, RealityDiagnosis, Lang, ReportLanguage } from "./report/types";
import { C, PW, PH, ML, MR, MT, CW, MAX_Y } from "./report/types";
import { i18n } from "./report/i18n";
import { sanitizeHospitalName as _sanitizeHospitalName, stripMarkdown, getGradeColor, drawSectionTitle, drawSubTitle, drawParagraph, drawInfoBox, drawProgressBar, drawHorizontalLine, drawPageHeader, ensureSpace, CAT_NAMES_KO, ITEM_NAMES_KO } from "./report/pdf-utils";
// Re-export for backward compatibility
export const sanitizeHospitalName = _sanitizeHospitalName;

// ── Lazy font buffer cache (4.5MB base64 → Buffer 변환 1회만) ──
let _fontBuffers: { krRegular: Buffer; krBold: Buffer } | null = null;
function getFontBuffers() {
  if (!_fontBuffers) {
    _fontBuffers = {
      krRegular: Buffer.from(krRegularBase64, "base64"),
      krBold: Buffer.from(krBoldBase64, "base64"),
    };
  }
  return _fontBuffers;
}

// QR 코드 캐시
let cachedQrBuffer: Buffer | null = null;


// ═══════════════════════════════════════════════
// MAIN EXPORT — generateAiVisibilityReport
// ═══════════════════════════════════════════════
// Pre-calculate content height for dynamic layout
// Math.max(100, contentH) ensures minimum section height
// bgTint — Background stripe for alternating rows
// Progress bar fill with gradient
// larger for print readability

// AI_CATEGORY_EN for English translation support
const AI_CATEGORY_EN = "AI Search Visibility";

export async function generateAiVisibilityReport(
  auditResult: SeoAuditResult,
  countryOrRd?: string | RealityDiagnosis | null,
  languageOrNull?: ReportLanguage | RealityDiagnosis | null,
  realityDiagnosis?: RealityDiagnosis | null,
): Promise<Buffer> {
  // Support both old 4-arg and new 3-arg signatures
  let rd: RealityDiagnosis | null = null;
  let language: ReportLanguage = "ko";
  const result = auditResult;
  if (realityDiagnosis !== undefined) {
    // Old signature: (result, country, language, realityDiagnosis)
    language = (languageOrNull as ReportLanguage) || "ko";
    rd = realityDiagnosis;
  } else if (countryOrRd && typeof countryOrRd === "object") {
    // New signature: (result, realityDiagnosis, language?)
    rd = countryOrRd as RealityDiagnosis;
    language = (languageOrNull as ReportLanguage) || "ko";
  } else {
    // (result, country?, language?)
    language = (languageOrNull as ReportLanguage) || (countryOrRd as ReportLanguage) || "ko";
  }
  const lang = language;
  const useTranslation = lang === "en" || lang === "th";
  if (useTranslation && lang === "en") {
    // Translate audit result to English for i18n support
    // translateResultToEnglish(result) — English mode
    try { await translateResultToEnglish(result as any); } catch (_e) { /* fallback to original */ }
  }
  const t = i18n[language] || i18n.ko;
  const score = auditResult.totalScore ?? auditResult.score ?? 0;
  const grade = auditResult.grade;
  const url = auditResult.url;
  const hCtx = { t, url };

  // ── QR code ──
  if (!cachedQrBuffer) {
    try {
      const qrDataUrl = await QRCode.toDataURL("https://mybiseo.com", { width: 120, margin: 1 });
      cachedQrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    } catch { cachedQrBuffer = null; }
  }

  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  // ── Register fonts (lazy cached) ──
  const fontBuffers = getFontBuffers();
  doc.registerFont("KrRegular", fontBuffers.krRegular);
  doc.registerFont("KrBold", fontBuffers.krBold);

  // ═══════════════════════════════════════════════
  // PAGE 1: COVER — v4 화이트 프리미엄 디자인 (mybiseo.com 브랜딩)
  // ═══════════════════════════════════════════════
  // v6: 화이트 배경 + 딥블루 액센트 (페이지 중앙 기준 배치)
  doc.rect(0, 0, PW, PH).fill(C.white);

  // 상단 딥블루 액센트 라인
  doc.rect(0, 0, PW, 4).fill(C.teal);

  // 병원명
  const rawHospitalName = rd?.hospitalName || auditResult.siteName || url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const hospitalName = sanitizeHospitalName(rawHospitalName);
  // Punycode 도메인 한글 디코딩 (xn--... → 한글)
  const rawDisplayUrl = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const displayUrl = (() => {
    try {
      if (rawDisplayUrl.includes("xn--")) {
        const { domainToUnicode } = require("url");
        const parts = rawDisplayUrl.split("/");
        parts[0] = domainToUnicode(parts[0]) || parts[0];
        return parts.join("/");
      }
      return rawDisplayUrl;
    } catch { return rawDisplayUrl; }
  })();

  const scCx = PW / 2;
  const gradeColor = getGradeColor(grade);

  // ── 상단 브랜드 영역 (좌상단 고정) ──
  doc.font("KrBold").fontSize(10).fillColor(C.teal)
    .text(t.brand, ML, 30, { width: CW });
  doc.moveTo(ML, 48).lineTo(ML + 40, 48).lineWidth(2).strokeColor(C.teal).stroke();

  // v7: 페이지 중앙 기준 레이아웃 계산 (타이틀+병원명 두 배 키움)
  const contentTotalH = 420;
  const contentStartY = (PH - contentTotalH) / 2 - 10;

  // ── 보고서 타이틀 (v7: 13→24pt) ──
  let coverY = contentStartY;
  doc.font("KrBold").fontSize(24).fillColor(C.navy)
    .text(t.coverTitle, ML, coverY, { width: CW, align: "center" });
  coverY += 34;
  doc.font("KrRegular").fontSize(9.5).fillColor(C.textLight)
    .text(t.coverSub, ML, coverY, { width: CW, align: "center" });
  coverY += 20;

  // ── 구분선 ──
  doc.moveTo(scCx - 50, coverY).lineTo(scCx + 50, coverY)
    .lineWidth(0.5).strokeColor(C.border).stroke();
  coverY += 20;

  // ── 병원명 (v7: 20→36pt) ──
  doc.font("KrBold").fontSize(36).fillColor(C.navy);
  const nameH = doc.heightOfString(hospitalName, { width: CW - 20, align: "center" });
  doc.text(hospitalName, ML + 10, coverY, { width: CW - 20, align: "center" });
  coverY += nameH + 8;
  doc.font("KrRegular").fontSize(9).fillColor(C.textLight)
    .text(displayUrl, ML, coverY, { width: CW, align: "center" });
  coverY += 24;

  // ═══════════════════════════════════════════════
  // 점수 영역 — v6: 페이지 중앙 기준 동적 배치
  // ═══════════════════════════════════════════════
  const scoreCenterY = coverY + 80;

  // v4: 절제된 크기의 원형 게이지 (반지름 65)
  const outerR = 65;
  // 배경 트랙
  doc.circle(scCx, scoreCenterY, outerR + 3).lineWidth(2).strokeColor(C.border).stroke();
  doc.circle(scCx, scoreCenterY, outerR).lineWidth(6).strokeColor(C.grayBar).stroke();

  // 게이지 아크
  const scoreRatio = Math.min(score / 100, 1);
  const arcStartAngle = -Math.PI / 2;
  const arcTotalSweep = Math.PI * 2;
  const arcEndAngle = arcStartAngle + arcTotalSweep * scoreRatio;
  for (let a = arcStartAngle; a < arcEndAngle; a += 0.03) {
    const ax = scCx + Math.cos(a) * outerR;
    const ay = scoreCenterY + Math.sin(a) * outerR;
    doc.circle(ax, ay, 3.5).fill(gradeColor);
  }
  for (let a = arcEndAngle; a < arcStartAngle + arcTotalSweep; a += 0.03) {
    const ax = scCx + Math.cos(a) * outerR;
    const ay = scoreCenterY + Math.sin(a) * outerR;
    doc.circle(ax, ay, 2.5).fill(C.grayBar);
  }

  // 내부 원
  doc.circle(scCx, scoreCenterY, outerR - 10).fill(C.white);

  // v4: 점수 숫자 48pt (적절한 크기)
  doc.font("KrBold").fontSize(48).fillColor(gradeColor);
  const scoreStr = String(score);
  const scoreW = doc.widthOfString(scoreStr);
  const scoreH = doc.currentLineHeight();
  doc.text(scoreStr, scCx - scoreW / 2, scoreCenterY - scoreH / 2 - 2);

  // "/ 100" 서브텍스트
  doc.font("KrRegular").fontSize(10).fillColor(C.textMid);
  const maxStr = "/ 100";
  const maxW = doc.widthOfString(maxStr);
  doc.text(maxStr, scCx - maxW / 2, scoreCenterY + scoreH / 2 - 16);

  // v4: 등급 배지 (적절한 크기)
  const badgeR = 16;
  const badgeCx = scCx + outerR - 6;
  const badgeCy = scoreCenterY - outerR + 14;
  doc.circle(badgeCx, badgeCy, badgeR + 1).lineWidth(1).strokeColor(C.border).stroke();
  doc.circle(badgeCx, badgeCy, badgeR).fill(gradeColor);
  doc.font("KrBold").fontSize(14).fillColor(C.white);
  const gradeLetterW = doc.widthOfString(grade);
  const gradeLetterH = doc.currentLineHeight();
  doc.text(grade, badgeCx - gradeLetterW / 2, badgeCy - gradeLetterH / 2);

  // v4: 통과/주의/실패 pill 카드 (적절한 크기 + 중앙 정렬)
  const pillY = scoreCenterY + outerR + 28;
  const pillW = 120;
  const pillH = 34;
  const pillGap = 12;
  const totalPillW = pillW * 3 + pillGap * 2;
  const pillStartX = scCx - totalPillW / 2;
  const pills = [
    { label: t.coverPassed, value: auditResult.summary.passed, color: C.pass },
    { label: t.coverWarnings, value: auditResult.summary.warnings, color: C.warn },
    { label: t.coverFailed, value: auditResult.summary.failed, color: C.fail },
  ];
  pills.forEach((pill, i) => {
    const px = pillStartX + i * (pillW + pillGap);
    doc.roundedRect(px, pillY, pillW, pillH, 6).fill(C.bg);
    doc.roundedRect(px, pillY, pillW, 3, 0).fill(pill.color);
    // v4: 라벨 좌측, 숫자 우측 — 둘 다 수직 중앙
    doc.font("KrRegular").fontSize(8).fillColor(C.textMid);
    doc.text(pill.label, px + 10, pillY + (pillH - 10) / 2);
    doc.font("KrBold").fontSize(16).fillColor(pill.color);
    const valStr = String(pill.value);
    const valW = doc.widthOfString(valStr);
    const valH = doc.currentLineHeight();
    doc.text(valStr, px + pillW - valW - 10, pillY + (pillH - valH) / 2);
  });

  // ── 하단 영역 ──
  doc.moveTo(ML + 60, PH - 120).lineTo(PW - MR - 60, PH - 120)
    .lineWidth(0.5).strokeColor(C.border).stroke();

  // 진단일
  doc.font("KrRegular").fontSize(8.5).fillColor(C.textLight);
  const dateStr = auditResult.analyzedAt
    ? new Date(auditResult.analyzedAt).toLocaleDateString(language === "ko" ? "ko-KR" : language === "th" ? "th-TH" : "en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const dateLabel = `${t.coverDate}: ${dateStr}`;
  const dateLW = doc.widthOfString(dateLabel);
  doc.text(dateLabel, scCx - dateLW / 2, PH - 105);

  // mybiseo.com
  doc.font("KrBold").fontSize(9).fillColor(C.teal);
  const siteStr = "mybiseo.com";
  const siteW = doc.widthOfString(siteStr);
  doc.text(siteStr, scCx - siteW / 2, PH - 88);

  // F등급(30점 이하) 보고서 한계 고지
  const numericScore = auditResult.totalScore ?? auditResult.score ?? 0;
  if (numericScore <= 30) {
    doc.font("KrRegular").fontSize(5.5).fillColor("#856404")
      .text("※ 본 진단은 자동 크롤링 시점 데이터 기반이며, JavaScript 렌더링 사이트의 경우 실제와 다를 수 있습니다. 정확한 진단을 위해 재진단을 권장드립니다.", ML + 20, PH - 68, { width: CW - 40, lineGap: 2, align: "center" });
  }
  // v7: 표지 하단에 disclaimer(데이터 출처) 배치 (위치 교환) + 글씨 진하게
  doc.font("KrRegular").fontSize(5.5).fillColor(C.textLight)
    .text(t.disclaimer, ML + 20, PH - 52, { width: CW - 40, lineGap: 2, align: "center" });

  // 하단 티얼 액센트 라인
  doc.rect(0, PH - 4, PW, 4).fill(C.teal);

  // ═══════════════════════════════════════════════
  // PAGE: 원장님께 드리는 말씀 — v3에서 제거됨
  // ═══════════════════════════════════════════════
  // (Greeting page removed in v3 spec)  
  let y = MT;

  // ═══════════════════════════════════════════════
  // PAGE: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, t, url);
  y = MT;

  y = drawSectionTitle(doc, y, t.executiveSummary, t.executiveDesc);
  y += 4;

  // 종합 점수 + 등급 + 통과/주의/실패 — 한 줄 카드 (#13)
  const sumCardH = 60;
  doc.roundedRect(ML, y, CW, sumCardH, 4).fill(C.bgWarm);
  doc.rect(ML, y, 3, sumCardH).fill(gradeColor);

  // 점수 — widthOfString은 현재 폰트 기준이므로 측정 후 그리기
  doc.font("KrBold").fontSize(28).fillColor(C.navy);
  const s2Str = String(score);
  const s2W = doc.widthOfString(s2Str); // 28pt 기준 너비 먼저 측정
  doc.text(s2Str, ML + 16, y + 8);
  doc.font("KrRegular").fontSize(9).fillColor(C.textMid)
    .text("/ 100", ML + 16 + s2W + 4, y + 22);
  doc.font("KrBold").fontSize(11).fillColor(gradeColor)
    .text(`${t.coverGrade} ${grade}`, ML + 16, y + 40);

  // 통과/주의/실패 — 우측 정렬
  const dotItems = [
    { label: `${t.coverPassed} ${auditResult.summary.passed}`, color: C.pass },
    { label: `${t.coverWarnings} ${auditResult.summary.warnings}`, color: C.warn },
    { label: `${t.coverFailed} ${auditResult.summary.failed}`, color: C.fail },
  ];
  let dotX = ML + CW - 10;
  dotItems.reverse().forEach((item) => {
    doc.font("KrRegular").fontSize(9).fillColor(C.text);
    const tw = doc.widthOfString(item.label);
    dotX -= tw;
    doc.text(item.label, dotX, y + (sumCardH - 12) / 2);
    dotX -= 14;
    doc.circle(dotX + 4, y + (sumCardH - 12) / 2 + 5, 4).fill(item.color);
    dotX -= 16;
  });
  y += sumCardH + 12;

  // v4: KPI 카드 3개 — 숫자 중앙 배치 + 매출손실 "월" 접두어
  if (rd?.missedPatients || rd?.metrics) {
    y = ensureSpace(doc, y, 75, hCtx);
    const kpiW = (CW - 20) / 3;
    const kpiH = 56;
    // v4: 매출 손실에 "월" 접두어 추가
    const revenueRaw = (rd.missedPatients?.revenueImpact || "-").replace(/만원원/g, "만원").replace(/억원원/g, "억원");
    const revenueValue = (() => {
      if (revenueRaw === "-") return "-";
      // revenueRaw에 이미 "월"이 포함되어 있으면 그대로 사용 (중복 방지)
      if (revenueRaw.includes("월")) {
        return revenueRaw;
      }
      const numMatch = revenueRaw.match(/[\d,]+\s*[만억]*\s*[원]?/);
      if (numMatch) {
        const cleaned = numMatch[0].replace(/\s/g, "");
        const hasWon = cleaned.endsWith("원");
        return language === "ko" ? `월 ${cleaned}${hasWon ? "" : "원"}` : cleaned;
      }
      return language === "ko" ? `월 ${revenueRaw}` : revenueRaw;
    })();
    // A등급 이상(80점+)은 "추가 성장 기회" 프레이밍, 미만은 "매출 손실" 프레이밍
    const isHighScore = score >= 80;
    const kpis = [
      {
        value: rd.missedPatients?.estimatedMonthly ? `${language === "ko" ? "월 " : ""}${rd.missedPatients.estimatedMonthly.toLocaleString()}${language === "ko" ? "명" : ""}` : "-",
        label: language === "ko" ? (isHighScore ? "추가 유입 가능 트래픽" : "예상 미유입 트래픽") : "Est. Missed Website Traffic",
        color: isHighScore ? C.pass : C.fail,
      },
      {
        value: revenueValue,
        label: language === "ko" ? (isHighScore ? "추가 성장 기회 금액" : "예상 잠재 매출 기회") : "Est. Revenue Opportunity",
        color: isHighScore ? C.pass : C.fail,
      },
      {
        value: language === "ko" ? ({ critical: "시급", high: "높음", medium: "보통", low: "낮음" }[rd.urgencyLevel as string] || rd.urgencyLevel || grade) : (rd.urgencyLevel || grade),
        label: language === "ko" ? "긴급도" : "Urgency",
        color: score < 40 ? C.fail : score < 60 ? C.warn : C.pass,
      },
    ];
    kpis.forEach((kpi, ki) => {
      const kx = ML + ki * (kpiW + 10);
      doc.roundedRect(kx, y, kpiW, kpiH, 4).fill(C.bg);
      doc.roundedRect(kx, y, kpiW, 3, 0).fill(kpi.color);
      // v5: 동적 폰트 사이징 — 텍스트가 카드 너비를 초과하면 폰트 축소
      const kvStr = String(kpi.value);
      const maxTextW = kpiW - 20;
      let fontSize = 16;
      doc.font("KrBold").fontSize(fontSize);
      while (doc.widthOfString(kvStr) > maxTextW && fontSize > 9) {
        fontSize -= 1;
        doc.font("KrBold").fontSize(fontSize);
      }
      doc.fillColor(kpi.color);
      const kvH = doc.currentLineHeight();
      const labelFontSize = 8;
      const labelH = 12;
      const textBlockH = kvH + 4 + labelH;
      const startY = y + 3 + (kpiH - 3 - textBlockH) / 2;
      doc.text(kvStr, kx + 10, startY, { width: maxTextW });
      doc.font("KrRegular").fontSize(labelFontSize).fillColor(C.textMid)
        .text(kpi.label, kx + 10, startY + kvH + 4, { width: maxTextW });
    });
     y += kpiH + 8;
    // 매출 손실 산정 근거 표시 (v8)
    if (rd?.specialty) {
      const resolvedSpec = resolveSpecialty(rd.specialty);
      const revProfile = SPECIALTY_REVENUE_PROFILES[resolvedSpec] || SPECIALTY_REVENUE_PROFILES["기타"];
      if (revProfile) {
        const convRate = Math.min(0.03, Math.max(0.01, revProfile.targetROI / 300));
        const formulaText = `* 산식: ①월간 미유입 트래픽 → ②전환율(${(convRate * 100).toFixed(1)}%) → ③예상 환자 수 → ④객단가(${revProfile.avgRevenuePerVisit}만원) → ⑤잠재 매출 | ±30% 범위`;
        doc.font("KrRegular").fontSize(6).fillColor(C.textLight)
          .text(formulaText, ML, y, { width: CW, align: "right" });
        y += 10;
      }
    }
    // v6: reasoning 텍스트 삭제됨 (사용자 요청)
  }

  // 진단 한계 고지 (사이트 접근 불가 / SPA 감지 시)
  if (result.diagnosticLimitation) {
    y = ensureSpace(doc, y, 40, hCtx);
    const limBox = { x: ML, y, w: CW, h: 32 };
    doc.rect(limBox.x, limBox.y, limBox.w, limBox.h).fill("#FFF3CD");
    doc.rect(limBox.x, limBox.y, 3, limBox.h).fill("#FFC107");
    doc.font("KrBold").fontSize(8).fillColor("#856404")
      .text("⚠️ 진단 한계 안내", limBox.x + 12, limBox.y + 4, { width: limBox.w - 20 });
    doc.font("KrRegular").fontSize(7.5).fillColor("#856404")
      .text(result.diagnosticLimitation.message, limBox.x + 12, limBox.y + 16, { width: limBox.w - 20 });
    y += limBox.h + 8;
  }
  // Executive Summary 텍스트
  if (rd?.executiveSummary) {
    y = drawParagraph(doc, y, stripMarkdown(rd.executiveSummary));
    y += 4;
  }

  // 핵심 발견사항
  if (rd?.keyFindings && rd.keyFindings.length > 0) {
    y = ensureSpace(doc, y, 100, hCtx);
    y = drawSubTitle(doc, y, t.keyFindings);
    rd.keyFindings.forEach((finding, fIdx) => {
      y = ensureSpace(doc, y, 24, hCtx);
      // v4: 네이비 원형 숫자 불릿 — 정확한 수직 중앙
      const circleR = 7;
      doc.circle(ML + circleR + 1, y + circleR + 1, circleR).fill(C.teal);
      doc.font("KrBold").fontSize(7).fillColor(C.white);
      const numStr = String(fIdx + 1);
      const numW = doc.widthOfString(numStr);
      const numH = doc.currentLineHeight();
      doc.text(numStr, ML + circleR + 1 - numW / 2, y + circleR + 1 - numH / 2);
      doc.font("KrRegular").fontSize(9).fillColor(C.text);
      const bulletText = stripMarkdown(finding);
      const bh = doc.heightOfString(bulletText, { width: CW - 28, lineGap: 4 });
      doc.text(bulletText, ML + 22, y + 1, { width: CW - 28, lineGap: 4 });
      y += Math.max(bh, circleR * 2 + 2) + 6;
    });
    y += 4;
  }

  // 카테고리별 분석 — 컴팩트 테이블
  y = ensureSpace(doc, y, 120, hCtx);
  y = drawSubTitle(doc, y, t.categoryAnalysis);
  y += 4;

  // 테이블 헤더
  const catCols = [
    { label: t.category, x: ML, w: CW * 0.35 },
    { label: t.score, x: ML + CW * 0.35, w: CW * 0.15 },
    { label: t.achievement, x: ML + CW * 0.50, w: CW * 0.30 },
    { label: t.priority, x: ML + CW * 0.80, w: CW * 0.20 },
  ];
     doc.roundedRect(ML, y, CW, 26, 4).fill(C.tealDark);

    catCols.forEach((col) => {
      doc.font("KrBold").fontSize(8).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 8);
    });
    y += 26;

  // 테이블 행
  auditResult.categories.forEach((_cat, idx) => {
    const cat = { ..._cat, score: Math.min(_cat.score, _cat.maxScore) };
    y = ensureSpace(doc, y, 30, hCtx);
    const rowH = 30;
    const bgColor = idx % 2 === 0 ? C.white : C.bg;
    const pct = cat.maxScore > 0 ? cat.score / cat.maxScore : 0;
    const pctInt = Math.round(pct * 100);
    // 달성률 기반 컬러: 0-39% 빨강, 40-59% 노랑, 60-79% 파랑, 80%+ 초록
    const priorityColor = pctInt < 40 ? C.fail : pctInt < 60 ? C.warn : pctInt < 80 ? C.blue : C.pass;
    const priorityLabel = pctInt < 40 ? t.high : pctInt < 60 ? t.medium : t.low;

    doc.rect(ML, y, CW, rowH).fill(bgColor);
    // 좌측 색상 인디케이터 2px (#15)
    doc.rect(ML, y, 2, rowH).fill(priorityColor);

    // 카테고리명
    const catName = language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name;
    doc.font("KrRegular").fontSize(8.5).fillColor(C.text)
      .text(catName, catCols[0].x + 8, y + (rowH - 10) / 2, { width: catCols[0].w - 12 });

    // 점수 — 정중앙 (#7 달성률 병기)
    const scoreLabel = `${cat.score}/${cat.maxScore} (${pctInt}%)`;
    doc.font("KrBold").fontSize(8.5).fillColor(C.text);
    const slW = doc.widthOfString(scoreLabel);
    doc.text(scoreLabel, catCols[1].x + (catCols[1].w - slW) / 2, y + (rowH - 10) / 2);

    // 프로그레스 바 — 정중앙
    const barW = catCols[2].w - 40;
    const barX = catCols[2].x + 10;
    const barY = y + (rowH - 6) / 2;
    drawProgressBar(doc, barX, barY, barW, 8, pct, priorityColor);
    doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid);
    const pctStr = `${Math.round(pct * 100)}%`;
    doc.text(pctStr, barX + barW + 4, barY - 2);

    // v4: 우선순위 배지 — 정확한 수직 중앙 + 컨러 매핑 수정
    const badgeW = 36;
    const badgeH = 16;
    const badgeX = catCols[3].x + (catCols[3].w - badgeW) / 2;
    const badgeY = y + (rowH - badgeH) / 2;
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8).fill(priorityColor);
    doc.font("KrBold").fontSize(7).fillColor(C.white);
    const plW = doc.widthOfString(priorityLabel);
    const plH = doc.currentLineHeight();
    doc.text(priorityLabel, badgeX + (badgeW - plW) / 2, badgeY + (badgeH - plH) / 2 + 0.5);

    y += rowH;
  });
   y += 12;

  // 가중치 산정 방식 설명
  {
    y = ensureSpace(doc, y, 40, hCtx);
    const weightNote = rd?.specialty
      ? (language === "ko"
        ? `※ 점수 산정 방식: 각 카테고리는 진료과(${rd.specialty})별 가중치가 적용됩니다. 예를 들어 네이버 검색 최적화는 치과의 경우 1.5배, AI 검색 노출은 성형외과의 경우 1.5배로 반영됩니다. 가중치는 해당 진료과에서 환자 유입에 미치는 실질적 영향도를 기반으로 산정됩니다.`
        : `※ Scoring: Each category has specialty-specific weights applied (${rd.specialty}). Weights reflect the real-world impact on patient acquisition for this specialty.`)
      : (language === "ko"
        ? `※ 점수 산정 방식: 각 카테고리 점수는 항목별 만점 대비 달성률로 산정됩니다. 진료과가 지정된 경우 해당 진료과의 환자 유입 영향도에 따라 카테고리별 가중치(0.5~2.0배)가 적용됩니다.`
        : `※ Scoring: Each category score is calculated as achievement rate against maximum points. When a specialty is specified, category-specific weights (0.5–2.0x) are applied based on patient acquisition impact.`);
    doc.font("KrRegular").fontSize(6.5).fillColor(C.textMid)
      .text(weightNote, ML, y, { width: CW, lineGap: 2 });
    const noteH = doc.heightOfString(weightNote, { width: CW, lineGap: 2 });
    y += noteH + 8;
  }

  // ═══════════════════════════════════════════════
  // 카테고리별 전체 항목 상세 (101개 항목 전체 포함)
  // 빈 여백 없이 이어서 배치 (ensureSpace가 필요시 페이지 넘김)
  // ═══════════════════════════════════════════════
  y = ensureSpace(doc, y, 120, hCtx);
  y = drawSectionTitle(doc, y, t.fullAudit, t.fullAuditDesc);
  y += 4;

  // v3: 카테고리 요약 미니바 차트 먼저 표시
  auditResult.categories.forEach((_cat, ci) => {
    const cat = { ..._cat, score: Math.min(_cat.score, _cat.maxScore) };
    const catName = language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name;
    const catPct = cat.maxScore > 0 ? Math.min(100, Math.round((cat.score / cat.maxScore) * 100)) : 0;
    // 달성률 기반 컬러: 0-39% 빨강, 40-59% 노랑, 60-79% 파랑, 80%+ 초록
    const catColor = catPct < 40 ? C.fail : catPct < 60 ? C.warn : catPct < 80 ? C.blue : C.pass;
    y = ensureSpace(doc, y, 18, hCtx);
    // 카테고리명
    doc.font("KrRegular").fontSize(7.5).fillColor(C.text)
      .text(catName, ML, y + 2, { width: CW * 0.30 });
    // 가로 바 차트 (8px 높이, 회색 배경)
    const barX = ML + CW * 0.32;
    const barW = CW * 0.45;
    const barH = 8;
    doc.roundedRect(barX, y + 3, barW, barH, 4).fill(C.grayBar);
    if (catPct > 0) {
      doc.roundedRect(barX, y + 3, Math.max(barW * (catPct / 100), barH), barH, 4).fill(catColor);
    }
    // 우측 점수/만점(달성률%)
    doc.font("KrBold").fontSize(7.5).fillColor(catColor)
      .text(`${cat.score}/${cat.maxScore} (${catPct}%)`, ML + CW * 0.80, y + 2, { width: CW * 0.20, align: "right" });
    y += 18;
  });
  y += 8;

  // v3: fail/warning 항목만 표시, 카테고리당 상위 5개로 제한 (페이지 압축)
  auditResult.categories.forEach((_cat) => {
    const cat = { ..._cat, score: Math.min(_cat.score, _cat.maxScore) };
    const allProblems = cat.items.filter(i => i.status === "fail" || i.status === "warning");
    if (allProblems.length === 0) return;
    // 실패 우선, 점수 낮은 순으로 정렬 후 상위 5개만
    const sorted = [...allProblems].sort((a, b) => {
      if (a.status === "fail" && b.status !== "fail") return -1;
      if (a.status !== "fail" && b.status === "fail") return 1;
      return a.score - b.score;
    });
    const problemItems = sorted; // v4: PDF에서는 전체 항목 표시 (접힘 없음, slice 제거)
    const hiddenCount = 0; // PDF에서는 항상 전체 노출 — 웹과 달리 접힘 없음
    y = ensureSpace(doc, y, 50, hCtx);
    const catName = language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name;
    const catPct = cat.maxScore > 0 ? Math.min(100, Math.round((cat.score / cat.maxScore) * 100)) : 0;
    const catColor = catPct >= 70 ? C.pass : catPct >= 40 ? C.warn : C.fail;
    // 카테고리 헤더
    doc.roundedRect(ML, y, CW, 20, 4).fill(C.tealDark);
    doc.font("KrBold").fontSize(9).fillColor(C.white)
      .text(`${catName} — ${language === "ko" ? "개선 필요 항목" : "Issues"} (${problemItems.length})`, ML + 10, y + 5, { width: CW * 0.65 });
    doc.font("KrBold").fontSize(9).fillColor(C.white);
    const catScoreStr = `${cat.score}/${cat.maxScore} (${catPct}%)`;
    const csW = doc.widthOfString(catScoreStr);
    doc.text(catScoreStr, ML + CW - csW - 10, y + 5);
    y += 22;
    // 항목 테이블 헤더
    const detCols = [
      { label: "No", x: ML, w: CW * 0.06 },
      { label: t.item, x: ML + CW * 0.06, w: CW * 0.24 },
      { label: t.status, x: ML + CW * 0.30, w: CW * 0.08 },
      { label: t.score, x: ML + CW * 0.38, w: CW * 0.10 },
      { label: t.detail, x: ML + CW * 0.48, w: CW * 0.52 },
    ];
    doc.roundedRect(ML, y, CW, 22, 4).fill(C.tealDark);
    catCols.forEach((col) => {
      doc.font("KrBold").fontSize(7).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 5);
    });
    y += 20;
    problemItems.forEach((item, idx) => {
      const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
      const detailText = stripMarkdown(item.detail || "");
      const detailH = doc.heightOfString(detailText, { width: detCols[4].w - 8, lineGap: 2 });
      const rowH = Math.max(18, detailH + 6);
      y = ensureSpace(doc, y, rowH, hCtx);
      const bgColor = idx % 2 === 0 ? C.white : C.bg;
      doc.rect(ML, y, CW, rowH).fill(bgColor);
      const stColor = item.status === "warning" ? C.warn : C.fail;
      doc.rect(ML, y, 2, rowH).fill(stColor);
      doc.font("KrRegular").fontSize(7).fillColor(C.textMid);
      const noStr = String(idx + 1);
      const noW = doc.widthOfString(noStr);
      doc.text(noStr, detCols[0].x + (detCols[0].w - noW) / 2, y + 3);
      doc.font("KrRegular").fontSize(7).fillColor(C.text)
        .text(itemName, detCols[1].x + 4, y + 3, { width: detCols[1].w - 8 });
      const stLabel = item.status === "warning" ? t.statusWarning : t.statusFail;
      const stBadgeW = 36;
      const stBadgeH = 14;
      const stBadgeX = detCols[2].x + (detCols[2].w - stBadgeW) / 2;
      const stBadgeY = y + (rowH - stBadgeH) / 2;
      doc.roundedRect(stBadgeX, stBadgeY, stBadgeW, stBadgeH, 7).fill(stColor);
      doc.font("KrBold").fontSize(6).fillColor(C.white);
      const stLW = doc.widthOfString(stLabel);
      const stLH = doc.currentLineHeight();
      doc.text(stLabel, stBadgeX + (stBadgeW - stLW) / 2, stBadgeY + (stBadgeH - stLH) / 2);
      doc.font("KrBold").fontSize(7).fillColor(stColor);
      const scStr = `${item.score}/${item.maxScore}`;
      const scW = doc.widthOfString(scStr);
      doc.text(scStr, detCols[3].x + (detCols[3].w - scW) / 2, y + 3);
      doc.font("KrRegular").fontSize(6).fillColor(C.textMid)
        .text(detailText, detCols[4].x + 4, y + 3, { width: detCols[4].w - 8, lineGap: 2 });
      y += rowH;
    });
    y += 4;
  });

  // ═══════════════════════════════════════════════
  // 부록: 통과 항목 전체 리스트 (PDF에서만 노출 — 웹에서는 접혀있던 항목)
  // ═══════════════════════════════════════════════
  const allPassItems = auditResult.categories.flatMap(cat =>
    cat.items.filter(i => i.status === "pass").map(i => ({
      ...i,
      categoryName: language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name,
    }))
  );
  if (allPassItems.length > 0) {
    y = ensureSpace(doc, y, 60, hCtx);
    const appendixTitle = language === "ko" ? "통과 항목 전체 목록" : "Passed Items (Complete List)";
    const appendixDesc = language === "ko"
      ? `총 ${allPassItems.length}개 항목이 정상적으로 통과되었습니다.`
      : `${allPassItems.length} items passed successfully.`;
    y = drawSubTitle(doc, y, appendixTitle);
    doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
      .text(appendixDesc, ML, y, { width: CW });
    y += 14;
    // 카테고리별로 그룹핑하여 표시
    const passGrouped: Record<string, typeof allPassItems> = {};
    allPassItems.forEach(item => {
      if (!passGrouped[item.categoryName]) passGrouped[item.categoryName] = [];
      passGrouped[item.categoryName].push(item);
    });
    Object.entries(passGrouped).forEach(([catName, items]) => {
      y = ensureSpace(doc, y, 20, hCtx);
      doc.font("KrBold").fontSize(7).fillColor(C.tealDark)
        .text(`✓ ${catName} (${items.length})`, ML + 4, y);
      y += 12;
      items.forEach((item, idx) => {
        y = ensureSpace(doc, y, 12, hCtx);
        const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
        doc.font("KrRegular").fontSize(6.5).fillColor(C.textMid)
          .text(`  ${idx + 1}. ${itemName} — ${item.score}/${item.maxScore}`, ML + 8, y, { width: CW - 16 });
        y += 11;
      });
      y += 4;
    });
  }
  // ═══════════════════════════════════════════════
  // SECTION: 키워드 노출 현황 (빈 여백 없이 이어서 배치)
  // ═══════════════════════════════════════════════
  if (rd?.keywords && rd.keywords.length > 0) {
    y = ensureSpace(doc, y, 120, hCtx);
    y = drawSectionTitle(doc, y, t.realityKeywords);
    y += 4;

    // 설명 텍스트
    const kwDesc = language === "ko"
      ? "환자들이 실제로 검색하는 핵심 키워드에서 병원이 노출되고 있는지 진단합니다. 미노출 키워드는 매달 환자를 놓치고 있다는 의미입니다."
      : "Diagnosis of whether the hospital is visible for key patient search keywords.";
    y = drawParagraph(doc, y, kwDesc);
    y += 4;

    // 키워드 테이블 헤더
    // 키워드 테이블
    const kwCols = [
      { label: language === "ko" ? "키워드" : "Keyword", x: ML, w: CW * 0.22 },
      { label: t.searchVolume, x: ML + CW * 0.22, w: CW * 0.13 },
      { label: t.naverLabel, x: ML + CW * 0.35, w: CW * 0.22 },
      { label: t.googleLabel, x: ML + CW * 0.57, w: CW * 0.22 },
      { label: t.aiLabel, x: ML + CW * 0.79, w: CW * 0.21 },
    ];
    doc.roundedRect(ML, y, CW, 22, 4).fill(C.tealDark);
    kwCols.forEach((col) => {
      doc.font("KrBold").fontSize(7.5).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 6);
    });
    y += 22;

    // 키워드 행
    rd.keywords.forEach((kw, idx) => {
      y = ensureSpace(doc, y, 26, hCtx);
      const rowH = 24;
      const bgColor = idx % 2 === 0 ? C.white : C.bg;
      doc.rect(ML, y, CW, rowH).fill(bgColor);

      // 키워드명
      doc.font("KrRegular").fontSize(8).fillColor(C.text)
        .text(kw.keyword, kwCols[0].x + 6, y + (rowH - 10) / 2, { width: kwCols[0].w - 10 });

      // 월간 조회량 — 정중앙
      doc.font("KrRegular").fontSize(8).fillColor(C.textMid);
      const volStr = kw.monthlySearchVolume?.toLocaleString() || "-";
      const volW = doc.widthOfString(volStr);
      doc.text(volStr, kwCols[1].x + (kwCols[1].w - volW) / 2, y + (rowH - 10) / 2);

      // 네이버 상태 — kw.naver.found / kw.google.found / kw.ai.likelihood
      const naverColor = kw.naver?.found ? C.pass : C.fail;
      const naverLabel = kw.naver?.found ? (language === "ko" ? "노출" : "Visible") : (language === "ko" ? "미노출" : "Hidden");
      doc.font("KrBold").fontSize(7.5).fillColor(naverColor);
      const nlW = doc.widthOfString(naverLabel);
      doc.text(naverLabel, kwCols[2].x + (kwCols[2].w - nlW) / 2, y + (rowH - 10) / 2);

      // 구글 상태
      const googleColor = kw.google?.found ? C.pass : C.fail;
      const googleLabel = kw.google?.found ? (language === "ko" ? "노출" : "Visible") : (language === "ko" ? "미노출" : "Hidden");
      doc.font("KrBold").fontSize(7.5).fillColor(googleColor);
      const glW = doc.widthOfString(googleLabel);
      doc.text(googleLabel, kwCols[3].x + (kwCols[3].w - glW) / 2, y + (rowH - 10) / 2);

      // v4: AI 인용 — 컨러 매핑 수정 (낮음=주황, 없음=빨강)
      const aiLikelihood = (kw.ai?.likelihood || "없음") as string;
      const aiLikelihoodLower = aiLikelihood.toLowerCase();
      const aiColor = (aiLikelihoodLower === "높음" || aiLikelihoodLower === "high") ? C.pass
        : (aiLikelihoodLower === "보통" || aiLikelihoodLower === "medium") ? C.warn
        : (aiLikelihoodLower === "낮음" || aiLikelihoodLower === "low") ? C.gold
        : C.fail;
      const aiLabel = language === "ko"
        ? (aiLikelihoodLower === "높음" || aiLikelihoodLower === "high" ? t.realityAiHigh
          : aiLikelihoodLower === "보통" || aiLikelihoodLower === "medium" ? t.realityAiMedium
          : aiLikelihoodLower === "낮음" || aiLikelihoodLower === "low" ? t.realityAiLow
          : t.realityAiNone)
        : aiLikelihood;
      doc.font("KrBold").fontSize(7.5).fillColor(aiColor);
      const alW = doc.widthOfString(aiLabel);
      doc.text(aiLabel, kwCols[4].x + (kwCols[4].w - alW) / 2, y + (rowH - 10) / 2);

      y += rowH;
    });
    y += 8;

    // v4: 놓치는 환자 수 경고 박스 + 근거 설명
    if (rd.missedPatients) {
      y = ensureSpace(doc, y, 80, hCtx);
      // v4: 매출 손실에 "월" 접두어
      const revenueText = (rd.missedPatients.revenueImpact || "").replace(/만원원/g, "만원").replace(/억원원/g, "억원");
      const revenueDisplay = (language === "ko" && revenueText && !revenueText.includes("월"))
        ? `월 ${revenueText}` : revenueText;
      const mpText = language === "ko"
        ? `매월 약 ${rd.missedPatients.estimatedMonthly.toLocaleString()}회의 트래픽이 웹사이트로 유입되지 못하고 있습니다. 예상 잠재 매출 기회: ${revenueDisplay}`
        : `Approximately ${rd.missedPatients.estimatedMonthly.toLocaleString()} monthly website visits are not being captured. Estimated revenue opportunity: ${revenueDisplay}`;
      y = drawInfoBox(doc, y, mpText, { accentColor: C.fail, bgColor: C.redTint, icon: "!" });

      // v6: reasoning 텍스트 삭제됨 (사용자 요청)
    }
  }


  // ═══════════════════════════════════════════════
  // 경쟁 환경 분석 (컴팩트)
  // ═══════════════════════════════════════════════
  if (rd?.competitors && rd.competitors.length > 0) {
    // 모든 경쟁사가 "정보 부족"이면 대체 문구로 표시
    const allLackInfo = rd.competitors.every(c => c.advantage.includes("정보 부족") || c.advantage.includes("insufficient") || c.advantage.trim().length < 5);
    y = ensureSpace(doc, y, 120, hCtx);
    y = drawSubTitle(doc, y, t.realityCompetitors);
    y += 4;
    if (allLackInfo) {
      const altMsg = language === "ko"
        ? "경쟁사 분석은 별도 컨설팅 시 상세 제공됩니다. 현재 공개된 데이터만으로는 정확한 경쟁 환경 파악이 어렵습니다."
        : "Detailed competitor analysis is available during consultation. Public data alone is insufficient for accurate competitive landscape assessment.";
      y = drawInfoBox(doc, y, altMsg, { accentColor: C.warn, bgColor: C.bg, icon: "i" });
    } else {

    // 경쟁사 테이블
    const compCols = [
      { label: language === "ko" ? "경쟁 병원" : "Competitor", x: ML, w: CW * 0.25 },
      { label: language === "ko" ? "강점" : "Advantage", x: ML + CW * 0.25, w: CW * 0.45 },
      { label: language === "ko" ? "가시성" : "Visibility", x: ML + CW * 0.70, w: CW * 0.30 },
    ];
    doc.roundedRect(ML, y, CW, 26, 4).fill(C.tealDark);
    compCols.forEach((col) => {
      doc.font("KrBold").fontSize(7.5).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 8);
    });
    y += 26;

    rd.competitors.forEach((comp, idx) => {
      const advText = stripMarkdown(comp.advantage);
      doc.font("KrRegular").fontSize(7.5);
      const advH = doc.heightOfString(advText, { width: compCols[1].w - 12, lineGap: 2 });
      const rowH = Math.max(advH + 8, 24);
      y = ensureSpace(doc, y, rowH, hCtx);
      doc.rect(ML, y, CW, rowH).fill(idx % 2 === 0 ? C.white : C.bg);
      doc.font("KrRegular").fontSize(8).fillColor(C.text)
        .text(comp.name, compCols[0].x + 6, y + 4, { width: compCols[0].w - 10 });
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(advText, compCols[1].x + 6, y + 4, { width: compCols[1].w - 12, lineGap: 2 });
      doc.font("KrBold").fontSize(7.5).fillColor(C.warn)
        .text(comp.estimatedVisibility, compCols[2].x + 6, y + 4, { width: compCols[2].w - 10, align: "center" });
      y += rowH;
    });
    y += 12;
    } // end else (allLackInfo)
  }


  // ═══════════════════════════════════════════════
  // REALITY DIAGNOSIS PAGES
  // AI 심층 진단 통합 섹션 (GEO + 인용 + 캡슐 + 교차신뢰 + 네이버 Cue)
  // 기존 5개 섹션을 1개로 통합하여 페이지 절약
  // ═══════════════════════════════════════════════
  const hasDeepDiag = rd?.geoTriAxis || rd?.aiCitationThreshold || rd?.answerCapsule || rd?.crossChannelTrust || rd?.naverCueDiagnosis;
  if (hasDeepDiag && rd) {
    y = ensureSpace(doc, y, 120, hCtx);

    const deepTitle = language === "ko" ? "AI 추천 심층 진단" : "AI Recommendation Deep Analysis";
    const deepSub = language === "ko" ? "AI가 병원을 추천하기 위해 확인하는 핵심 요소들을 진단합니다" : "Diagnosing key factors AI checks before recommending a hospital";
    y = drawSectionTitle(doc, y, deepTitle, deepSub);
    y += 4;

    // Headline (rd.headline)
    if (rd.headline) {
      doc.font("KrBold").fontSize(11).fillColor(C.navy)
        .text(rd.headline, ML, y, { width: CW, lineGap: 3 });
      y += doc.heightOfString(rd.headline, { width: CW, lineGap: 3 }) + 8;
    }

    // 핵심 지표 요약 (rd.metrics.naverExposureRate)
    if (rd.metrics) {
      const metricsItems = [
        { label: t.naverLabel, value: `${rd.metrics.naverExposureRate}%`, color: C.pass },
        { label: t.googleLabel, value: `${(rd.metrics as any).googleIndexRate ?? rd.metrics.googleExposureRate}%`, color: C.blue },
        { label: t.aiLabel, value: `${(rd.metrics as any).aiCitationRate ?? rd.metrics.aiReadiness}%`, color: C.teal },
      ];
      const mW = (CW - 12) / 3;
      const mCardH = 40;
      metricsItems.forEach((m, i) => {
        const mx = ML + i * (mW + 6);
        doc.roundedRect(mx, y, mW, mCardH, 4).fill(C.bgAccent);
        // v4: 라벨 + 숫자 수직 중앙 배치
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid);
        const mlW = doc.widthOfString(m.label);
        const mlH = doc.currentLineHeight();
        doc.font("KrBold").fontSize(14);
        const mvH = doc.currentLineHeight();
        const totalTextH = mlH + 2 + mvH;
        const textStartY = y + (mCardH - totalTextH) / 2;
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid);
        doc.text(m.label, mx + (mW - mlW) / 2, textStartY);
        doc.font("KrBold").fontSize(14).fillColor(m.color);
        const mvW = doc.widthOfString(m.value);
        doc.text(m.value, mx + (mW - mvW) / 2, textStartY + mlH + 2);
      });
      y += mCardH + 8;
    }

    // 콘텐츠 사각지대 (rd.contentGaps)
    if (rd.contentGaps && rd.contentGaps.length > 0) {
      y = ensureSpace(doc, y, 60, hCtx);
      y = drawSubTitle(doc, y, t.contentGapsTitle);
      rd.contentGaps.forEach((gap, idx) => {
        const keywordText = stripMarkdown(gap.keyword || "");
        const intentText = stripMarkdown(gap.searchIntent || "");
        const suggestionText = stripMarkdown(gap.suggestedContent || "");
        doc.font("KrRegular").fontSize(7);
        const sugH = doc.heightOfString(suggestionText, { width: CW * 0.23, lineGap: 2 });
        const intH = doc.heightOfString(intentText, { width: CW * 0.23, lineGap: 2 });
        const gapRowH = Math.max(sugH, intH, 14) + 8;
        y = ensureSpace(doc, y, gapRowH, hCtx);
        doc.roundedRect(ML, y, CW, gapRowH, 4).fill(idx % 2 === 0 ? C.bg : C.white);
        doc.font("KrBold").fontSize(7.5).fillColor(C.text)
          .text(keywordText, ML + 6, y + 4, { width: CW * 0.20 });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(intentText, ML + CW * 0.22, y + 4, { width: CW * 0.23, lineGap: 2 });
        const scoreColor = gap.opportunityScore >= 8 ? C.pass : gap.opportunityScore >= 5 ? C.warn : C.textMid;
        doc.font("KrBold").fontSize(8).fillColor(scoreColor)
          .text(String(gap.opportunityScore || 0), ML + CW * 0.48, y + 4, { width: 30, align: "center" });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(suggestionText, ML + CW * 0.55, y + 4, { width: CW * 0.23, lineGap: 2 });
        const diffColor = (gap.difficulty as string) === "\uc26c\uc6c0" || (gap.difficulty as string) === "Easy" ? C.pass : (gap.difficulty as string) === "\ubcf4\ud1b5" || (gap.difficulty as string) === "Medium" ? C.warn : C.fail;
        const diffMap: Record<string, string> = { "\uc26c\uc6c0": "\uc26c\uc6c0", "\ubcf4\ud1b5": "\ubcf4\ud1b5", "\uc5b4\ub824\uc6c0": "\uc5b4\ub824\uc6c0", "Easy": "Easy", "Medium": "Medium", "Hard": "Hard" };
        const diffLabel = diffMap[gap.difficulty] || gap.difficulty;
        doc.font("KrBold").fontSize(7).fillColor(diffColor)
          .text(diffLabel, ML + CW * 0.82, y + 4, { width: CW * 0.18 });
        y += gapRowH;
      });
      y += 8;
    }

    // rd.closingStatement 기반 종합 의견 (최종 평가에서 렌더링)

    // SECTION: GEO 3축 진단 (RxA/F)
    // GEO 3축 — 컴팩트 바 차트
    if (rd.geoTriAxis) {
      y = ensureSpace(doc, y, 100, hCtx);
      y = drawSubTitle(doc, y, t.geoTriAxisTitle);
      y = drawParagraph(doc, y, t.geoTriAxisSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.geoTriAxisWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      const geoItems = [
        { label: t.geoRelevance, score: rd.geoTriAxis.relevance.score, detail: rd.geoTriAxis.relevance.label },
        { label: t.geoAuthority, score: rd.geoTriAxis.authority.score, detail: rd.geoTriAxis.authority.label },
        { label: t.geoFriction, score: rd.geoTriAxis.friction.score, detail: rd.geoTriAxis.friction.label },
      ];
      geoItems.forEach((item) => {
        const barColor = item.score >= 70 ? C.pass : item.score >= 40 ? C.warn : C.fail;
        doc.font("KrRegular").fontSize(8).fillColor(C.text)
          .text(item.label, ML + 4, y, { width: 130 });
        drawProgressBar(doc, ML + 140, y + 1, CW - 220, 8, item.score / 100, barColor);
        doc.font("KrBold").fontSize(8).fillColor(barColor)
          .text(`${item.score}`, ML + CW - 70, y, { width: 30, align: "right" });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(item.detail, ML + CW - 36, y, { width: 36 });
        y += 20;
      });

      // GEO 종합
      doc.font("KrBold").fontSize(9).fillColor(C.navy)
        .text(`${t.geoOverall}: ${rd.geoTriAxis.overallGeoScore}/100`, ML + 4, y);
      y += 16;
      y = drawHorizontalLine(doc, y);
    }

    // SECTION: AI 인용 임계점 체크리스트
    // AI 인용 임계점 — 체크리스트
    if (rd.aiCitationThreshold) {
      y = ensureSpace(doc, y, 100, hCtx);
      y = drawSubTitle(doc, y, t.aiCitationTitle);
      y = drawParagraph(doc, y, t.aiCitationSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.aiCitationWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      rd.aiCitationThreshold.items.forEach((item) => {
        const condText = stripMarkdown(item.condition);
        const detText = stripMarkdown(item.detail);
        doc.font("KrRegular").fontSize(8.5);
        const condH = doc.heightOfString(condText, { width: CW * 0.45, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5);
        const detH = doc.heightOfString(detText, { width: CW * 0.48, lineGap: 3 });
        const rowH = Math.max(condH, detH, 14) + 6;
        y = ensureSpace(doc, y, rowH, hCtx);
        const icon = item.met ? "\u2713" : "\u2717";
        const iconColor = item.met ? C.pass : C.fail;
        doc.font("KrBold").fontSize(9).fillColor(iconColor)
          .text(icon, ML + 4, y + 2);
        doc.font("KrRegular").fontSize(8.5).fillColor(C.text)
          .text(condText, ML + 20, y + 2, { width: CW * 0.45, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
          .text(detText, ML + CW * 0.50, y + 2, { width: CW * 0.48, lineGap: 3 });
        y += rowH;
      });

      // 종합 판정
      // rd.aiCitationThreshold.verdict 기반 종합 판정
      const _citVerdict = rd.aiCitationThreshold.verdict;
      const metRatio = rd.aiCitationThreshold.metCount / rd.aiCitationThreshold.totalCount;
      const verdictColor = metRatio >= 0.8 ? C.pass : metRatio >= 0.5 ? C.warn : C.fail;
      doc.font("KrBold").fontSize(9).fillColor(verdictColor)
        .text(`${t.aiCitationVerdict}: ${rd.aiCitationThreshold.metCount}/${rd.aiCitationThreshold.totalCount} ${t.aiCitationMet}`, ML + 4, y);
      y += 16;
      y = drawHorizontalLine(doc, y);
    }

    // SECTION: 답변 캡슐 품질 진단
    // 답변 캡슐 — 현재 vs 개선 비교
    if (rd.answerCapsule) {
      // rd.answerCapsule.issues 기반 문제점 표시
      y = ensureSpace(doc, y, 120, hCtx);
      y = drawSubTitle(doc, y, t.answerCapsuleTitle);
      y = drawParagraph(doc, y, t.answerCapsuleSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.answerCapsuleWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      // 점수
      const capColor = rd.answerCapsule.score >= 70 ? C.pass : rd.answerCapsule.score >= 40 ? C.warn : C.fail;
      doc.font("KrBold").fontSize(9).fillColor(capColor)
        .text(`${t.answerCapsuleScore}: ${rd.answerCapsule.score}/100`, ML + 4, y);
      y += 16;

      // 현재 vs 개선 — 좌우 비교 카드
      const halfW = (CW - 12) / 2;
      // \ud604\uc7ac \uc0c1\ud0dc \uce74\ub4dc - \ub3d9\uc801 \ub192\uc774 \uacc4\uc0b0
      const curText = stripMarkdown(rd.answerCapsule.currentBestSentence);
      const idealText = stripMarkdown(rd.answerCapsule.idealSentence);
      doc.font("KrRegular").fontSize(7.5);
      const curH = doc.heightOfString(curText, { width: halfW - 20, lineGap: 2 });
      const idealH = doc.heightOfString(idealText, { width: halfW - 20, lineGap: 2 });
      const cardH = Math.max(curH, idealH) + 28;
      y = ensureSpace(doc, y, cardH + 8, hCtx);
      const cardTopYAdj = y;

      doc.roundedRect(ML, cardTopYAdj, halfW, cardH, 4).fill(C.redTint);
      doc.rect(ML, cardTopYAdj, 3, cardH).fill(C.fail);
      doc.font("KrBold").fontSize(7.5).fillColor(C.fail)
        .text(t.answerCapsuleCurrent, ML + 10, cardTopYAdj + 6, { width: halfW - 16 });
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(curText, ML + 10, cardTopYAdj + 20, { width: halfW - 20, lineGap: 2 });

      // \uac1c\uc120 \uc608\uc2dc \uce74\ub4dc
      doc.roundedRect(ML + halfW + 12, cardTopYAdj, halfW, cardH, 4).fill(C.greenTint);
      doc.rect(ML + halfW + 12, cardTopYAdj, 3, cardH).fill(C.pass);
      doc.font("KrBold").fontSize(7.5).fillColor(C.pass)
        .text(t.answerCapsuleSample, ML + halfW + 22, cardTopYAdj + 6, { width: halfW - 16 });
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(idealText, ML + halfW + 22, cardTopYAdj + 20, { width: halfW - 20, lineGap: 2 });

      y = cardTopYAdj + cardH + 8;
      y = drawHorizontalLine(doc, y);
    }

    // SECTION: 4채널 교차 신뢰 진단
    // 4채널 교차 신뢰 — 컴팩트 카드
    if (rd.crossChannelTrust) {
      // rd.crossChannelTrust.verdict 기반 종합 판정
      y = ensureSpace(doc, y, 80, hCtx);
      y = drawSubTitle(doc, y, t.crossChannelTitle);
      y = drawParagraph(doc, y, t.crossChannelSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.crossChannelWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      const chW = (CW - 18) / 4;
      const chCardH = 52;
      rd.crossChannelTrust.channels.forEach((ch, i) => {
        const cx = ML + i * (chW + 6);
        const chColor = ch.consistencyScore >= 70 ? C.pass : ch.consistencyScore >= 40 ? C.warn : C.fail;
        doc.roundedRect(cx, y, chW, chCardH, 4).fill(C.bgAccent);
        doc.rect(cx, y, chW, 3).fill(chColor);
        // v4: 채널명 — 수평+수직 정중앙
        doc.font("KrBold").fontSize(7.5).fillColor(C.text);
        const chNameW = doc.widthOfString(ch.name);
        const chNameH = doc.currentLineHeight();
        doc.text(ch.name, cx + (chW - chNameW) / 2, y + 8);
        // v4: 점수 — 수평+수직 정중앙 (카드 하단 영역 중앙)
        doc.font("KrBold").fontSize(16).fillColor(chColor);
        const chScoreStr = String(ch.consistencyScore);
        const chScoreW = doc.widthOfString(chScoreStr);
        const chScoreH = doc.currentLineHeight();
        const scoreAreaTop = y + 8 + chNameH + 2;
        const scoreAreaH = chCardH - (8 + chNameH + 2) - 4;
        doc.text(chScoreStr, cx + (chW - chScoreW) / 2, scoreAreaTop + (scoreAreaH - chScoreH) / 2);
      });
      y += chCardH + 8;

      // 종합 점수
      doc.font("KrBold").fontSize(9).fillColor(C.navy)
        .text(`${t.crossChannelOverall}: ${rd.crossChannelTrust.overallConsistency}/100`, ML + 4, y);
      y += 16;
      y = drawHorizontalLine(doc, y);
    }

  // ═══════════════════════════════════════════════
  // AI 추천 시뮬레이터 — 핵심 영업 섹션
  // ═══════════════════════════════════════════════
  // SECTION: AI 추천 시뮬레이터
  if (rd?.aiSimulator && rd.aiSimulator.query && rd.aiSimulator.results.length > 0) {
    y = ensureSpace(doc, y, 80, hCtx);
    y = drawSectionTitle(doc, y, t.aiSimulatorTitle, t.aiSimulatorSub);
    y += 2;

    // 왜 중요한지 설명
    y = drawInfoBox(doc, y, t.aiSimulatorWhy, { accentColor: C.teal, bgColor: C.bgAccent });

    // 시뮬레이션 질문
    doc.font("KrBold").fontSize(9.5).fillColor(C.navy)
      .text(`"${rd.aiSimulator.query}"`, ML + 10, y, { width: CW - 20 });
    y += 20;

    // 결과 테이블
    const simCols = [
      { label: "AI", x: ML, w: CW * 0.20 },
      { label: language === "ko" ? "추천 여부" : "Status", x: ML + CW * 0.20, w: CW * 0.20 },
      { label: language === "ko" ? "상세" : "Detail", x: ML + CW * 0.40, w: CW * 0.60 },
    ];
    doc.roundedRect(ML, y, CW, 24, 4).fill(C.tealDark);
    simCols.forEach((col) => {
      doc.font("KrBold").fontSize(7.5).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 7);
    });
    y += 26;

    rd.aiSimulator.results.forEach((r, idx) => {
      const ctxText = stripMarkdown(r.context);
      doc.font("KrRegular").fontSize(7);
      const ctxH = doc.heightOfString(ctxText, { width: simCols[2].w - 12, lineGap: 2 });
      const rowH = Math.max(ctxH + 8, 24);
      y = ensureSpace(doc, y, rowH, hCtx);
      doc.rect(ML, y, CW, rowH).fill(idx % 2 === 0 ? C.white : C.bg);
      // \uc88c\uce21 \uc0c9\uc0c1 \uc778\ub514\ucf00\uc774\ud130
      doc.rect(ML, y, 3, rowH).fill(r.mentioned ? C.pass : C.fail);

      doc.font("KrBold").fontSize(8).fillColor(C.text)
        .text(r.engine, simCols[0].x + 8, y + (rowH - 10) / 2, { width: simCols[0].w - 12 });

      const statusLabel = r.mentioned ? t.aiSimRecommended : t.aiSimNotRecommended;
      const statusColor = r.mentioned ? C.pass : C.fail;
      doc.font("KrBold").fontSize(7.5).fillColor(statusColor);
      const stW = doc.widthOfString(statusLabel);
      doc.text(statusLabel, simCols[1].x + (simCols[1].w - stW) / 2, y + (rowH - 10) / 2);

      doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
        .text(ctxText, simCols[2].x + 6, y + 4, { width: simCols[2].w - 12, lineGap: 2 });
      y += rowH;
    });

    // 종합 판정
    y += 4;
    const _mentionRate = rd.aiSimulator.mentionRate;
    // v4: 판정 결과에 따라 색상 구분
    const mentionedCount = rd.aiSimulator.results.filter(r => r.mentioned).length;
    const simVerdictColor = mentionedCount >= rd.aiSimulator.results.length / 2 ? C.pass : C.fail;
    const simVerdictBg = mentionedCount >= rd.aiSimulator.results.length / 2 ? C.greenTint : C.redTint;
    y = drawInfoBox(doc, y, stripMarkdown(rd.aiSimulator.verdict), { accentColor: simVerdictColor, bgColor: simVerdictBg, icon: mentionedCount >= rd.aiSimulator.results.length / 2 ? "\u2713" : "!" });
  }

    // SECTION: 네이버 Cue: 대응 진단
    // 네이버 Cue: 대응 진단 — 컴팩트
    if (rd.naverCueDiagnosis) {
      // rd.naverCueDiagnosis.verdict 기반 종합 판정
      y = ensureSpace(doc, y, 80, hCtx);
      y = drawSubTitle(doc, y, t.naverCueTitle);
      y = drawParagraph(doc, y, t.naverCueSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.naverCueWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      const cueColor = rd.naverCueDiagnosis.score >= 70 ? C.pass : rd.naverCueDiagnosis.score >= 40 ? C.warn : C.fail;
      doc.font("KrBold").fontSize(9).fillColor(cueColor)
        .text(`${language === "ko" ? "Cue: 대응 점수" : "Cue: Score"}: ${rd.naverCueDiagnosis.score}/100`, ML + 4, y);
      y += 16;

      rd.naverCueDiagnosis.items.forEach((item) => {
        const critText = stripMarkdown(item.criterion);
        const detText = stripMarkdown(item.detail);
        doc.font("KrRegular").fontSize(8);
        // v8: 동그라미와 텍스트가 나란히 같은 줄에 나오도록 수정
        const critW = CW * 0.36;
        const detW = CW * 0.53;
        const critH = doc.heightOfString(critText, { width: critW, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5);
        const detH = doc.heightOfString(detText, { width: detW, lineGap: 3 });
        const rowH = Math.max(critH, detH, 16) + 8;
        y = ensureSpace(doc, y, rowH, hCtx);
        const statusColor = (item.status as string) === "양호" || (item.status as string) === "Good" ? C.pass : (item.status as string) === "주의" || (item.status as string) === "Warning" || (item.status as string) === "미흡" ? C.warn : C.fail;
        // v8: 동그라미 수직 중앙 + critText 동그라미 바로 옆에 나란히
        const textStartY = y + (rowH - Math.max(critH, detH)) / 2;
        doc.circle(ML + 6, textStartY + critH / 2, 3.5).fill(statusColor);
        doc.font("KrRegular").fontSize(8).fillColor(C.text)
          .text(critText, ML + 16, textStartY, { width: critW, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
          .text(detText, ML + CW * 0.44, textStartY, { width: detW, lineGap: 3 });
        y += rowH;
      });
      y += 8;
    }
  }


  // ═══════════════════════════════════════════════
  // 즉시 개선 필요 항목 + 주의 항목 + 정상 운영 항목
  // ═══════════════════════════════════════════════
    const allFailItems = auditResult.categories.flatMap(c => c.items.filter(i => i.status === "fail"));
  const allWarnItems = auditResult.categories.flatMap(c => c.items.filter(i => i.status === "warning"));
  const failItems = allFailItems.sort((a, b) => a.score - b.score); // v4: 전체 표시
  const warnItems = allWarnItems.sort((a, b) => a.score - b.score); // v4: 전체 표시

  if (failItems.length > 0 || warnItems.length > 0) {
    y = ensureSpace(doc, y, 120, hCtx);

    y = drawSectionTitle(doc, y, t.criticalIssues);
    y = drawParagraph(doc, y, t.criticalDesc);
    y += 4;

    // 실패 항목 — 좌측 세로바 + 현황 pill + 기술용어 파란색 + 구분선
    failItems.forEach((item, fIdx) => {
      const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
      const detailText = stripMarkdown(item.detail);
      const recText = stripMarkdown(item.recommendation);
      doc.font("KrRegular").fontSize(7.5);
      const detH = doc.heightOfString(detailText, { width: CW - 30, lineGap: 2 });
      const recH = doc.heightOfString(recText, { width: CW - 30, lineGap: 2 });
      let impactH = 0;
      if (item.impact) {
        const impText = stripMarkdown(item.impact);
        doc.font("KrBold").fontSize(7);
        impactH = doc.heightOfString(`→ ${impText}`, { width: CW - 40, lineGap: 2 }) + 6;
      }
      const cardH = 22 + detH + 6 + recH + impactH + 12;
      y = ensureSpace(doc, y, cardH + 6, hCtx);

      // 카드 배경
      doc.roundedRect(ML, y, CW, cardH, 4).fill(C.redTint);
      // 좌측 3px 빨간색 세로바
      doc.rect(ML, y, 3, cardH).fill(C.fail);

      // 항목명
      doc.font("KrBold").fontSize(9).fillColor(C.fail)
        .text(itemName, ML + 14, y + 6, { width: CW - 28 });

      // "현황" pill 배경
      let fy = y + 22;
      const pillBgH = detH + 8;
      doc.roundedRect(ML + 14, fy - 2, CW - 28, pillBgH, 3).fill("#FEE2E2");
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(detailText, ML + 20, fy + 2, { width: CW - 40, lineGap: 2 });
      fy += pillBgH + 4;

      // "조치" — 기술 용어 파란색 구분
      doc.font("KrRegular").fontSize(7.5).fillColor(C.text)
        .text(recText, ML + 20, fy, { width: CW - 40, lineGap: 2 });

      // v8: 기대 효과 (impact) 표시
      if (item.impact) {
        const impactText = stripMarkdown(item.impact);
        doc.font("KrRegular").fontSize(7.5);
        const recActualH = doc.heightOfString(recText, { width: CW - 40, lineGap: 2 });
        const impactY = fy + recActualH + 4;
        doc.font("KrBold").fontSize(7).fillColor(C.navy)
          .text(`→ ${impactText}`, ML + 20, impactY, { width: CW - 40, lineGap: 2 });
      }

      y += cardH + 2;

      // 항목 간 0.5px 회색 구분선
      if (fIdx < failItems.length - 1) {
        doc.moveTo(ML + 10, y).lineTo(ML + CW - 10, y).lineWidth(0.5).strokeColor(C.border).stroke();
        y += 4;
      }
    });
    if (allFailItems.length > 10) {
      doc.font("KrRegular").fontSize(6).fillColor(C.textMuted)
        .text(`  + ${allFailItems.length - 10}${language === "ko" ? "개 추가 항목" : " more items"}`, ML + 10, y + 2);
      y += 14;
    }

    // 주의 항목
    if (warnItems.length > 0) {
      y = ensureSpace(doc, y, 60, hCtx);
      y += 8;
      y = drawSubTitle(doc, y, t.warningIssues);
      y = drawParagraph(doc, y, t.warningDesc);
      y += 2;

      warnItems.forEach((item) => {
        const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
        const recText = stripMarkdown(item.recommendation);
        doc.font("KrRegular").fontSize(7);
        const recH = doc.heightOfString(recText, { width: CW * 0.58, lineGap: 2 });
        let warnImpactH = 0;
        if (item.impact) {
          const impText = stripMarkdown(item.impact);
          doc.font("KrBold").fontSize(6.5);
          warnImpactH = doc.heightOfString(`→ ${impText}`, { width: CW * 0.58, lineGap: 2 }) + 4;
        }
        const rowH = Math.max(recH + warnImpactH + 8, 26);
        y = ensureSpace(doc, y, rowH + 4, hCtx);
        doc.roundedRect(ML, y, CW, rowH, 4).fill(C.bg);
        doc.rect(ML, y, 3, rowH).fill(C.warn);
        doc.font("KrBold").fontSize(8).fillColor(C.warn)
          .text(itemName, ML + 10, y + 4, { width: CW * 0.35 });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(recText, ML + CW * 0.38, y + 4, { width: CW * 0.58, lineGap: 2 });
        if (item.impact) {
          const impText = stripMarkdown(item.impact);
          const recActH = doc.heightOfString(recText, { width: CW * 0.58, lineGap: 2 });
          doc.font("KrBold").fontSize(6.5).fillColor(C.navy)
            .text(`→ ${impText}`, ML + CW * 0.38, y + 4 + recActH + 2, { width: CW * 0.58, lineGap: 2 });
        }
        y += rowH + 4;
      });
      if (allWarnItems.length > 5) {
        doc.font("KrRegular").fontSize(6).fillColor(C.textMuted)
          .text(`  + ${allWarnItems.length - 5}${language === "ko" ? "개 추가 주의 항목" : " more warning items"}`, ML + 10, y + 2);
        y += 14;
      }
    }
  }
  // (정상 운영 항목 섹션 삭제됨 — 사용자 요청)
  // ═══════════════════════════════════════════════
  // SECTION: 전략 가이드드 (웹사이트 변환 + 콘텐츠 + 마케팅 + mybiseo)
  // 전략 가이드 (통합 — 웹사이트 + 콘텐츠 + 마케팅)
  // ═══════════════════════════════════════════════
  const hasGuide = rd?.websiteTransformGuide || rd?.contentStrategy || rd?.marketingDirection;
  if (hasGuide && rd) {
    y = ensureSpace(doc, y, 120, hCtx);

    y = drawSectionTitle(doc, y, t.strategicGuideTitle, t.strategicGuideSub);
    y += 4;

    // 웹사이트 변환 가이드
    if (rd.websiteTransformGuide) {
      // rd.websiteTransformGuide.currentState 기반 현재 상태 분석
      y = ensureSpace(doc, y, 80, hCtx);
      y = drawSubTitle(doc, y, t.guideWebsite);

      rd.websiteTransformGuide.transformations.forEach((tr) => {
        const recText = stripMarkdown(tr.recommendation);
        doc.font("KrRegular").fontSize(7);
        const recH = doc.heightOfString(recText, { width: CW * 0.53, lineGap: 2 });
        const rowH = Math.max(recH + 8, 28);
        y = ensureSpace(doc, y, rowH + 4, hCtx);
        const prColor = (tr.priority as string) === "\ub192\uc74c" || (tr.priority as string) === "High" ? C.fail : (tr.priority as string) === "\ubcf4\ud1b5" || (tr.priority as string) === "Medium" ? C.warn : C.pass;
        doc.roundedRect(ML, y, CW, rowH, 4).fill(C.bg);
        doc.rect(ML, y, 3, rowH).fill(prColor);
        doc.font("KrBold").fontSize(8).fillColor(C.text)
          .text(stripMarkdown(tr.area), ML + 10, y + 4, { width: CW * 0.25 });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(recText, ML + CW * 0.28, y + 4, { width: CW * 0.53, lineGap: 2 });
        // \uc6b0\uc120\uc21c\uc704 \ubf09\uc9c0
        const badgeW2 = 34;
        const badgeH2 = 15;
        const badgeX2 = ML + CW - badgeW2 - 6;
        const badgeY2 = y + (rowH - badgeH2) / 2;
        doc.roundedRect(badgeX2, badgeY2, badgeW2, badgeH2, 7).fill(prColor);
        doc.font("KrBold").fontSize(6.5).fillColor(C.white);
        const prLabel = tr.priority;
        const prLW = doc.widthOfString(prLabel);
        const prLH = doc.currentLineHeight();
        doc.text(prLabel, badgeX2 + (badgeW2 - prLW) / 2, badgeY2 + (badgeH2 - prLH) / 2);
        y += rowH + 4;
      });
      y += 4;
      y = drawHorizontalLine(doc, y);
    }

    // 콘텐츠 전략
    if (rd.contentStrategy) {
      // rd.contentStrategy.blogStrategy / rd.contentStrategy.faqStrategy 기반 전략
      y = ensureSpace(doc, y, 60, hCtx);
      y = drawSubTitle(doc, y, t.guideContent);
      y = drawParagraph(doc, y, stripMarkdown(rd.contentStrategy.currentAssessment));

      if (rd.contentStrategy.contentCalendar && rd.contentStrategy.contentCalendar.length > 0) {
        y = ensureSpace(doc, y, 60, hCtx);
        // 콘텐츠 캘린더 — 컴팩트 테이블
        const calCols = [
          { label: language === "ko" ? "주차" : "Week", x: ML, w: CW * 0.15 },
          { label: language === "ko" ? "주제" : "Topic", x: ML + CW * 0.15, w: CW * 0.40 },
          { label: language === "ko" ? "형식" : "Format", x: ML + CW * 0.55, w: CW * 0.20 },
          { label: language === "ko" ? "타겟 키워드" : "Target Keyword", x: ML + CW * 0.75, w: CW * 0.25 },
        ];
        doc.roundedRect(ML, y, CW, 22, 4).fill(C.tealDark);
        calCols.forEach((col) => {
          doc.font("KrBold").fontSize(7).fillColor(C.white);
          const tw = doc.widthOfString(col.label);
          doc.text(col.label, col.x + (col.w - tw) / 2, y + 6);
        });
        y += 22;

        rd.contentStrategy.contentCalendar.forEach((cal, idx) => {
          const topicText = stripMarkdown(cal.topic);
          const kwText = stripMarkdown(cal.targetKeyword);
          doc.font("KrRegular").fontSize(7);
          const topicH = doc.heightOfString(topicText, { width: calCols[1].w - 8, lineGap: 2 });
          const kwH = doc.heightOfString(kwText, { width: calCols[3].w - 8, lineGap: 2 });
          const calRowH = Math.max(topicH + 8, kwH + 8, 18);
          y = ensureSpace(doc, y, calRowH, hCtx);
          doc.rect(ML, y, CW, calRowH).fill(idx % 2 === 0 ? C.white : C.bg);
          doc.font("KrRegular").fontSize(7).fillColor(C.text)
            .text(cal.week, calCols[0].x + 4, y + 4, { width: calCols[0].w - 8 });
          doc.font("KrRegular").fontSize(7).fillColor(C.text)
            .text(topicText, calCols[1].x + 4, y + 4, { width: calCols[1].w - 8, lineGap: 2 });
          doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
            .text(cal.format, calCols[2].x + 4, y + 4, { width: calCols[2].w - 8 });
          doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
            .text(kwText, calCols[3].x + 4, y + 4, { width: calCols[3].w - 8, lineGap: 2 });
          y += calRowH;
        });
        y += 8;
      }
      y = drawHorizontalLine(doc, y);
    }

    // 마케팅 방향
    if (rd.marketingDirection) {
      // rd.marketingDirection.coexistenceMessage 기반 공존 메시지
      y = ensureSpace(doc, y, 60, hCtx);
      y = drawSubTitle(doc, y, t.guideMarketing);
      y = drawParagraph(doc, y, stripMarkdown(rd.marketingDirection.overallStrategy));

      if (rd.marketingDirection.channelStrategies) {
        rd.marketingDirection.channelStrategies.forEach((ch) => {
          const stratText = stripMarkdown(ch.strategy);
          doc.font("KrRegular").fontSize(7.5);
          const stratH = doc.heightOfString(stratText, { width: CW * 0.70, lineGap: 3 });
          const rowH = Math.max(stratH, 14) + 8;
          y = ensureSpace(doc, y, rowH, hCtx);
          doc.font("KrBold").fontSize(8).fillColor(C.navy)
            .text(`\u2022 ${ch.channel}`, ML + 4, y + 2, { width: CW * 0.25 });
          doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
            .text(stratText, ML + CW * 0.28, y + 2, { width: CW * 0.70, lineGap: 3 });
          y += rowH;
        });
      }
      y += 8;
    }

    // MY비서 서비스 소개
    // rd.mybiseoServices 기반 서비스 렌더링
    if (rd.mybiseoServices) {
      y = ensureSpace(doc, y, 60, hCtx);
      const svcCount = rd.mybiseoServices.services?.length || 5;
      y = drawSectionTitle(doc, y, t.guideMybiseo, language === "ko" ? `AI 시대에 귀 병원에 꼭 필요한 ${svcCount}가지 서비스` : `${svcCount} essential services for your hospital in the AI era`);
      // rd.mybiseoServices.headline
      y = drawParagraph(doc, y, stripMarkdown(rd.mybiseoServices.headline));
      // rd.mybiseoServices.services — 2열 카드 그리드
      if (rd.mybiseoServices.services) {
        const svcCardW = (CW - 10) / 2;
        for (let si = 0; si < rd.mybiseoServices.services.length; si += 2) {
          const svc1 = rd.mybiseoServices.services[si];
          const svc2 = rd.mybiseoServices.services[si + 1];
          // 동적 높이 계산
          doc.font("KrRegular").fontSize(7);
          const desc1 = stripMarkdown(svc1.description);
          const h1 = doc.heightOfString(desc1, { width: svcCardW - 16, lineGap: 2 });
          let h2 = 0;
          let desc2 = "";
          if (svc2) {
            desc2 = stripMarkdown(svc2.description);
            h2 = doc.heightOfString(desc2, { width: svcCardW - 16, lineGap: 2 });
          }
          const cardH = Math.max(h1, h2, 14) + 28;
          y = ensureSpace(doc, y, cardH + 6, hCtx);

          // 좌측 카드
          const cx1 = ML;
          doc.roundedRect(cx1, y, svcCardW, cardH, 4).fill(C.bgAccent);
          doc.rect(cx1, y, 3, cardH).fill(C.teal);
          doc.font("KrBold").fontSize(7.5).fillColor(C.navy)
            .text(`${si + 1}. ${svc1.name}`, cx1 + 10, y + 6, { width: svcCardW - 16 });
          doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
            .text(desc1, cx1 + 10, y + 20, { width: svcCardW - 16, lineGap: 2 });

          // 우측 카드
          if (svc2) {
            const cx2 = ML + svcCardW + 10;
            doc.roundedRect(cx2, y, svcCardW, cardH, 4).fill(C.bgAccent);
            doc.rect(cx2, y, 3, cardH).fill(C.teal);
            doc.font("KrBold").fontSize(7.5).fillColor(C.navy)
              .text(`${si + 2}. ${svc2.name}`, cx2 + 10, y + 6, { width: svcCardW - 16 });
            doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
              .text(desc2, cx2 + 10, y + 20, { width: svcCardW - 16, lineGap: 2 });
          }
          y += cardH + 4;
        }
      }
      // ctaMessage는 CTA 페이지에서 통합 표시
      y += 8;
    }
  }
  // ═══════════════════════════════════════════════
  // 개선 로드맵 (3단계)
  // ════════════════════════════════════════════════
  if (rd?.actionItems && rd.actionItems.length > 0) {
    y = ensureSpace(doc, y, 120, hCtx);
    y = drawSectionTitle(doc, y, t.actionPlan, t.actionDesc);
    y += 4;

    const phases = [
      { label: t.phase1, items: rd.actionItems.filter(a => {
        const p = (a.priority as string).toLowerCase();
        return p === "즉시" || p === "높음" || p === "1개월 내" || p === "immediate" || p === "high" || p === "phase 1";
      }), color: C.fail },
      { label: t.phase2, items: rd.actionItems.filter(a => {
        const p = (a.priority as string).toLowerCase();
        return p === "단기" || p === "보통" || p === "short-term" || p === "medium" || p === "phase 2";
      }), color: C.warn },
      { label: t.phase3, items: rd.actionItems.filter(a => {
        const p = (a.priority as string).toLowerCase();
        return p === "중장기" || p === "낮음" || p === "3개월 내" || p === "long-term" || p === "low" || p === "phase 3";
      }), color: C.pass },
    ];

    phases.forEach((phase) => {
      if (phase.items.length === 0) return;
      y = ensureSpace(doc, y, 40, hCtx);

      // 단계 헤더
      doc.roundedRect(ML, y, CW, 24, 4).fill(phase.color);
      doc.font("KrBold").fontSize(9).fillColor(C.white);
      const phLW = doc.widthOfString(phase.label);
      doc.text(phase.label, ML + (CW - phLW) / 2, y + 6);
      y += 28;

      phase.items.forEach((item, itemIdx) => {
        const actText = stripMarkdown(item.action);
        const impText = stripMarkdown(item.expectedImpact);
        doc.font("KrRegular").fontSize(8);
        const actH = doc.heightOfString(`\u2022 ${actText}`, { width: CW * 0.58, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5);
        const impH = doc.heightOfString(impText, { width: CW * 0.36, lineGap: 3 });
        const rowH = Math.max(actH, impH, 14) + 8;
        y = ensureSpace(doc, y, rowH + 4, hCtx);
        // 교대 배경 (#29)
        if (itemIdx % 2 === 0) {
          doc.roundedRect(ML, y - 2, CW, rowH + 2, 2).fill(C.bg);
        }
        doc.font("KrRegular").fontSize(8).fillColor(C.text)
          .text(`\u2022 ${actText}`, ML + 8, y + 2, { width: CW * 0.58, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
          .text(impText, ML + CW * 0.62, y + 2, { width: CW * 0.36, lineGap: 3 });
        y += rowH + 2;
      });
      y += 8;
    });
  }

  // ═══════════════════════════════════════════════
  // 최종 평가 + 종합 의견 (closingStatement가 있을 때만 렌더링)
  // ═══════════════════════════════════════════════
  if (rd?.closingStatement) {
    y = ensureSpace(doc, y, 120, hCtx);

    // v4: 상단 티얼 액센트 바
    doc.roundedRect(ML, y, CW, 4, 0).fill(C.teal);
    y += 8;
    y = drawSectionTitle(doc, y, t.finalAssessment, t.finalAssessmentSub);
    y += 4;

    // v5: closingStatement — 첫 문장만 볼드, 나머지 본문 스타일
    const fullText = stripMarkdown(rd.closingStatement).trim();
    // 단락 분리 (줄바꾼 또는 마침표 기준)
    let paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
    // 단일 단락인 경우: 첫 문장만 볼드, 나머지 본문
    if (paragraphs.length <= 1 && fullText.length > 100) {
      // 첫 문장 추출 (마침표 기준)
      const firstSentenceMatch = fullText.match(/^(.+?\.\s)/);
      if (firstSentenceMatch) {
        const firstSentence = firstSentenceMatch[1].trim();
        const rest = fullText.slice(firstSentenceMatch[0].length).trim();
        paragraphs = rest ? [firstSentence, rest] : [firstSentence];
      }
    }
    paragraphs.forEach((para, idx) => {
      y = ensureSpace(doc, y, 40, hCtx);
      const trimmed = para.trim();
      if (idx === 0) {
        // v5: 첫 문장/단락만 볼드 (핵심 요약)
        doc.font("KrBold").fontSize(9.5).fillColor(C.navy);
        const bh = doc.heightOfString(trimmed, { width: CW, lineGap: 5 });
        doc.text(trimmed, ML, y, { width: CW, lineGap: 5 });
        y += bh + 8;
      } else {
        // v5: 나머지 단락은 본문 스타일 (볼드 아님)
        y = drawParagraph(doc, y, trimmed);
        y += 4;
      }
    });
    y += 4;
  }

  // 영업 CTA 박스 — CTA 페이지로 이동 (별도 페이지 생성 방지)
  const ctaBoxText = language === "ko"
    ? `현재 ${hospitalName}의 AI 가시성 점수는 ${score}점(${grade}등급)입니다. 경쟁 병원들이 AI 최적화를 시작하기 전에 선제적으로 대응하시면, 3개월 내 의미 있는 환자 유입 증가를 기대할 수 있습니다.`
    : `${hospitalName}'s current AI visibility score is ${score} (Grade ${grade}). By proactively responding before competitors start AI optimization, meaningful patient growth can be expected within 3 months.`;
  // ctaBoxText는 CTA 페이지 내부에서 사용

  // ═══════════════════════════════════════════════
  // PAGE: HISTORY TREND (부록 위치)
  // 히스토리 트렌드 (있는 경우만)
  // ═══════════════════════════════════════════════
  let historyData: any[] = [];
  try {
    historyData = await getMonthlyTrendByUrl(url);
  } catch { historyData = []; }

  if (historyData.length > 1) {
    y = ensureSpace(doc, y, 150, hCtx);

    y = drawSectionTitle(doc, y, t.historyTitle, t.historySub);
    y += 4;
    y = drawParagraph(doc, y, t.historyDesc);
    y += 4;

    // 간단한 바 차트
    const chartH = 80;
    const barMaxW = CW / Math.max(historyData.length, 1) - 8;
    const maxHistScore = Math.max(...historyData.map((d: any) => d.score || 0), 100);

    historyData.slice(-8).forEach((d: any, i: number) => {
      const bx = ML + i * (barMaxW + 8) + 4;
      const bh = (d.score / maxHistScore) * chartH;
      const by = y + chartH - bh;
      const bColor = d.score >= 70 ? C.pass : d.score >= 40 ? C.warn : C.fail;

      doc.roundedRect(bx, by, barMaxW, bh, 3).fill(bColor);
      // 점수 — 바 위 정중앙
      doc.font("KrBold").fontSize(7).fillColor(C.text);
      const sStr = String(d.score);
      const sW = doc.widthOfString(sStr);
      doc.text(sStr, bx + (barMaxW - sW) / 2, by - 12);
      // 월 — 바 아래 정중앙
      const monthLabel = d.month || `${i + 1}${t.historyMonth}`;
      doc.font("KrRegular").fontSize(6.5).fillColor(C.textMid);
      const mW = doc.widthOfString(monthLabel);
      doc.text(monthLabel, bx + (barMaxW - mW) / 2, y + chartH + 4);
    });
    y += chartH + 24;

    // 변화 요약
    if (historyData.length >= 2) {
      const first = historyData[0];
      const last = historyData[historyData.length - 1];
      const diff = (last.score || 0) - (first.score || 0);
      const changeText = diff > 0 ? t.historyImproved : diff < 0 ? t.historyDeclined : t.historyNoChange;
      const changeColor = diff > 0 ? C.pass : diff < 0 ? C.fail : C.textMid;
      doc.font("KrRegular").fontSize(8.5).fillColor(changeColor)
        .text(`${t.historyChange}: ${diff > 0 ? "+" : ""}${diff}  ${changeText}`, ML + 4, y);
      y += 16;
    }
  }

  // ═══════════════════════════════════════════════
  // CONTACT INFORMATION PAGE (CTA) — v6: QR 중심 + 좌우 중앙 + 품격있는 디자인
  // ═══════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, t, url);
  y = MT;

  // v6: 페이지 중앙 기준 레이아웃 — QR코드가 중심
  // 전체 콘텐츠 높이 계산: 타이틀(30) + 설명(50) + QR(100) + 연락처(30) + 메시지(60) ≈ 300
  const ctaContentH = 340;
  const ctaStartY = Math.max(MT + 20, (PH - ctaContentH) / 2 - 20);
  y = ctaStartY;

  // 타이틀 (좌우 중앙)
  doc.font("KrBold").fontSize(16).fillColor(C.navy);
  doc.text(t.ctaTitle, ML, y, { width: CW, align: "center" });
  y += 28;

  // 구분선 (좌우 중앙)
  doc.moveTo(scCx - 30, y).lineTo(scCx + 30, y)
    .lineWidth(2).strokeColor(C.teal).stroke();
  y += 20;

  // 설명 텍스트 (좌우 중앙)
  doc.font("KrRegular").fontSize(9.5).fillColor(C.textMid)
    .text(t.ctaDesc1, ML, y, { width: CW, align: "center", lineGap: 3 });
  y += 16;
  doc.font("KrRegular").fontSize(9.5).fillColor(C.textMid)
    .text(t.ctaDesc2, ML, y, { width: CW, align: "center", lineGap: 3 });
  y += 32;

  // v6: QR 코드 — 페이지 중심 요소 (크게 배치)
  if (cachedQrBuffer) {
    try {
      const qrSize = 90;
      const qrPad = 8;
      const qrTotalW = qrSize + qrPad * 2;
      const qrX = scCx - qrTotalW / 2;
      // QR 배경 박스
      doc.roundedRect(qrX - 4, y - 4, qrTotalW + 8, qrTotalW + 8, 6)
        .lineWidth(1).strokeColor(C.border).stroke();
      doc.image(cachedQrBuffer, qrX + qrPad, y + qrPad, { width: qrSize, height: qrSize });
      y += qrTotalW + 16;
      // QR 안내 텍스트
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textLight)
        .text("mybiseo.com", ML, y, { width: CW, align: "center" });
      y += 20;
    } catch { /* QR 실패 시 무시 */ }
  }

  // v6: 연락처 정보 (좌우 중앙 한 줄)
  doc.font("KrRegular").fontSize(8.5).fillColor(C.textLight)
    .text(language === "ko" ? "전화 상담" : "Phone", ML, y, { width: CW, align: "center" });
  y += 14;
  doc.font("KrBold").fontSize(13).fillColor(C.navy)
    .text("010-7321-7004", ML, y, { width: CW, align: "center" });
  y += 28;

  // v7: 영업 메시지 30% 줄임 + 임팩트 있게 (좌우 중앙)
  const ctaLine1 = language === "ko"
    ? `${hospitalName}의 AI 가시성 점수는 ${score}점(${grade}등급)입니다.`
    : `${hospitalName}'s AI visibility score is ${score} (Grade ${grade}).`;
  const ctaLine2 = language === "ko"
    ? `선제적 대응으로 3개월 내 환자 유입 증가를 기대할 수 있습니다.`
    : `Proactive response can drive patient growth within 3 months.`;
  const ctaShortText = `${ctaLine1}\n${ctaLine2}`;
  doc.font("KrRegular").fontSize(8.5).fillColor(C.textMid)
    .text(ctaShortText, ML + 40, y, { width: CW - 80, align: "center", lineGap: 6 });
  y += doc.heightOfString(ctaShortText, { width: CW - 80, lineGap: 6 }) + 14;

  // v7: 무료 상담 + 초안 무료 제공
  const salesLine1 = language === "ko"
    ? `지금 상담하시면, ${hospitalName}만을 위한`
    : `Contact us now for a free consultation`;
  const salesLine2 = language === "ko"
    ? `무료 상담과 맞춤 개선 초안을 무료로 제공해 드립니다.`
    : `and complimentary improvement draft for ${hospitalName}.`;
  const salesMsg = `${salesLine1}\n${salesLine2}`;
  doc.font("KrBold").fontSize(9.5).fillColor(C.teal)
    .text(salesMsg, ML + 40, y, { width: CW - 80, align: "center", lineGap: 5 });

  // v7: CTA 하단에 CONFIDENTIAL 배치 (위치 교환) + 글씨 진하게
  y = PH - 50;
  doc.moveTo(ML + 60, y).lineTo(PW - MR - 60, y).lineWidth(0.5).strokeColor(C.border).stroke();
  y += 10;
  const confText = language === "ko"
    ? "CONFIDENTIAL \u2014 \ubcf8 \ubcf4\uace0\uc11c\ub294 \uc218\uc2e0\uc790 \uc804\uc6a9\uc73c\ub85c \uc791\uc131\ub418\uc5c8\uc2b5\ub2c8\ub2e4"
    : "CONFIDENTIAL \u2014 This report was prepared exclusively for the recipient";
  doc.font("KrRegular").fontSize(6.5).fillColor(C.textLight)
    .text(confText, ML, y, { width: CW, align: "center" });

  // ═══════════════════════════════════════════════
  // 페이지 번호
  // ═══════════════════════════════════════════════
      const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      if (i === 0) continue; // 표지는 번호 없음
      // v4: 페이지 번호 + 하단 티얼 라인
      const pageNum = String(i);
      doc.font("KrRegular").fontSize(7).fillColor(C.textLight);
      const pnW = doc.widthOfString(pageNum);
      doc.text(pageNum, PW / 2 - pnW / 2, PH - 28);
      // 하단 티얼 라인 (표지 제외)
      doc.rect(0, PH - 3, PW, 3).fill(C.teal);
    }

  // ── Finalize ──
  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}


// Backward-compatible alias
export const generateSeoReportPdf = generateAiVisibilityReport;

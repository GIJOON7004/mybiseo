/**
 * AI 가시성 진단 보고서 — HTML 조합 + Puppeteer PDF 변환 엔진
 * 
 * v3.1: 클로드 v2 스펙 — 영업 심리 흐름 기반 15~18p 압축
 * - 목차/인사말 제거
 * - 전략가이드 3개 → 로드맵 1개 통합
 * - 섹션 순서: 고통인식 → 증거 → 원인 → 해결 → 신뢰 → 행동촉구
 * - 페이지 번호 정확한 치환 (regex 수정)
 * - 섹션 번호 순차 정리 (01~10)
 */
import puppeteer from "puppeteer";
import * as QRCode from "qrcode";
import type { RealityDiagnosis } from "./reality-diagnosis";
import { translateResultToEnglish } from "./ai-visibility-translate";
import { getMonthlyTrendByUrl } from "./db";
import {
  buildCoverPage, buildExecutiveSummaryPage,
  CSS, i18n, esc, stripMarkdown, getGradeColor,
  pageHeader, pageFooter,
  type SeoAuditResult, type Lang, type ReportLanguage,
} from "./ai-visibility-html-report";
import {
  buildFullAuditPages,
  buildRealityDiagnosisPages,
  buildActionPlanPage,
  buildServicePage,
  buildCtaPage,
  buildKeywordPage,
  buildContentGapPage,
  buildCriticalItemsDetailPage,
} from "./ai-visibility-html-report-sections";

// ── Hospital name sanitizer ──
function sanitizeHospitalName(raw: string): string {
  if (!raw) return raw;
  const parts = raw.split(/[|\-·–—:「」\[\]()（）!！。,，~]/).map(s => s.trim()).filter(Boolean);
  const medicalKeywords = /(?:병원|의원|치과|성형외과|피부과|안과|한의원|클리닉|센터|의료원|재활|정형|내과|외과|산부인과|비뇨기과|이비인후과|정신과|소아과|가정의학과|마취과|Clinic|Hospital|Center|Medical)/i;
  const medPart = parts.find(p => medicalKeywords.test(p));
  if (medPart) return medPart.trim();
  if (parts.length > 1) {
    const candidates = parts.filter(p => p.length >= 2);
    if (candidates.length > 0) return candidates.sort((a, b) => a.length - b.length)[0];
  }
  return raw.trim();
}

// ── Main export ──
export async function generateHtmlPdfReport(
  auditResult: SeoAuditResult,
  countryOrRd?: string | RealityDiagnosis | null,
  languageOrNull?: ReportLanguage | RealityDiagnosis | null,
  realityDiagnosis?: RealityDiagnosis | null,
): Promise<Buffer> {
  // Resolve overloaded arguments
  let rd: RealityDiagnosis | null = null;
  let lang: Lang = "ko";

  if (typeof countryOrRd === "string") {
    const map: Record<string, Lang> = { kr: "ko", th: "th", us: "en", gb: "en" };
    lang = map[countryOrRd.toLowerCase()] || "ko";
    if (languageOrNull && typeof languageOrNull === "object" && "headline" in languageOrNull) {
      rd = languageOrNull as unknown as RealityDiagnosis;
    } else if (realityDiagnosis) {
      rd = realityDiagnosis;
    }
  } else if (countryOrRd && typeof countryOrRd === "object" && "headline" in countryOrRd) {
    rd = countryOrRd as RealityDiagnosis;
    if (typeof languageOrNull === "string") {
      const map2: Record<string, Lang> = { ko: "ko", en: "en", th: "th" };
      lang = map2[languageOrNull] || "ko";
    }
  }

  const t = i18n[lang] || i18n.ko;
  const hospitalName = sanitizeHospitalName((auditResult as any).hospitalName || auditResult.siteName || auditResult.url);
  const url = auditResult.url;
  const score = auditResult.score ?? auditResult.totalScore ?? 0;
  const grade = auditResult.grade;

  // QR code
  const qrUrl = `https://mybiseo.com?utm_source=report&utm_medium=qr&utm_campaign=${encodeURIComponent(hospitalName)}`;
  let qrDataUrl = "";
  try { qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 2 }); } catch { qrDataUrl = ""; }

  // History data
  let historyData: any[] = [];
  try { historyData = await getMonthlyTrendByUrl(url); } catch { historyData = []; }

  const summary = auditResult.summary ?? { passed: 0, warnings: 0, failed: 0 };

  // ══════════════════════════════════════════════
  // Build sections — Claude v2 영업 심리 흐름
  // 고통인식 → 증거 → 원인 → 해결 → 신뢰 → 행동촉구
  // ══════════════════════════════════════════════
  const sections: string[] = [];

  // ── Page 1: 표지 (no page number, no footer) ──
  sections.push(buildCoverPage(t, hospitalName, url, score, grade, summary, lang));

  // ── Page 2: 핵심 요약 (위기선언 + KPI + 핵심 발견사항) ──
  // 섹션번호 01 (buildExecutiveSummaryPage 내부에서 '01' 하드코딩)
  sections.push(buildExecutiveSummaryPage(t, url, score, grade, summary, rd, auditResult.categories, lang, 0, 0));

  // ── Page 3: AI 추천 미추천 증거 (시뮬레이터 + 키워드) ──
  // 섹션번호 02 (buildKeywordPage 내부에서 하드코딩 → 아래에서 치환)
  if (rd) {
    const kwHtml = buildKeywordPage(t, url, rd, lang, 0, 0);
    if (kwHtml) sections.push(kwHtml);
  }

  // ── Page 4: 종합 진단 점수판 = Full Audit 첫 페이지 ──
  // 섹션번호 03 (buildFullAuditPages 내부에서 '03' 하드코딩)
  const auditPages = buildFullAuditPages(t, url, auditResult.categories, lang, 0, 0);
  if (auditPages.length > 0) sections.push(...auditPages);

  // ── Page 5-6: AI 추천 심층 진단 (GEO/Citation/Capsule/CrossChannel + Cue) ──
  // 섹션번호 04~05 (buildRealityDiagnosisPages 내부에서 하드코딩)
  if (rd) {
    const rdPages = buildRealityDiagnosisPages(t, url, rd, lang, 0, 0);
    if (rdPages.length > 0) sections.push(...rdPages);
  }

  // ── Page 7: 콘텐츠 사각지대 ──
  // 섹션번호 06 (buildContentGapPage 내부에서 '06' 하드코딩)
  if (rd) {
    const gapHtml = buildContentGapPage(t, url, rd, lang, 0, 0);
    if (gapHtml) sections.push(gapHtml);
  }

  // v2 압축: 크리티컬 아이템 상세 페이지 제거
  // 전체진단항목상세에서 이미 fail/warning만 표시하므로 중복 제거

  // ── Page 10: 단계별 개선 로드맵 (통합) ──
  // 섹션번호 08 (buildActionPlanPage 내부에서 '08' 하드코딩)
  if (rd) {
    const actionHtml = buildActionPlanPage(t, url, rd, lang, 0, 0);
    if (actionHtml) sections.push(actionHtml);
  }

  // ── Page 11: MY비서 추천 서비스 ──
  // 섹션번호 09 (buildServicePage 내부에서 '10' 하드코딩 → 아래에서 치환)
  if (rd) {
    const svcHtml = buildServicePage(t, url, rd, lang, 0, 0);
    if (svcHtml) sections.push(svcHtml);
  }

  // ── Page 12: 전문가 상담 CTA (마지막 페이지) ──
  sections.push(buildCtaPage(t, qrDataUrl, 0, 0));

  // ══════════════════════════════════════════════
  // Post-process: 페이지 번호 주입
  // ══════════════════════════════════════════════
  const rawHtml = sections.join("\n");

  // 표지(cover)와 CTA(cta-page)를 제외한 페이지만 번호 부여
  // page-footer 안의 page-num span을 찾아서 순차 번호 부여
  const PAGE_NUM_MARKER = /<span class="page-num"[^>]*>[\s\S]*?<\/span>/g;
  const totalNumberedPages = (rawHtml.match(PAGE_NUM_MARKER) || []).length;

  let pageCounter = 0;
  let numberedHtml = rawHtml.replace(PAGE_NUM_MARKER, () => {
    pageCounter++;
    return `<span class="page-num" style="color:var(--gray-3);font-size:9pt;">${pageCounter} / ${totalNumberedPages}</span>`;
  });

  // ══════════════════════════════════════════════
  // 섹션 번호 동적 순차 부여
  // 하드코딩된 섹션 번호를 실제 존재하는 섹션 순서대로 재번호
  // ══════════════════════════════════════════════
  // sec-num 클래스를 찾아서 순차적으로 01, 02, 03... 으로 치환
  // sectionTitle() 함수가 <span class="sec-num">XX /</span> 패턴을 생성
  const SECTION_NUM_RE = /<span class="sec-num">[^<]*<\/span>/g;
  let sectionCounter = 0;
  numberedHtml = numberedHtml.replace(SECTION_NUM_RE, () => {
    sectionCounter++;
    return `<span class="sec-num">${String(sectionCounter).padStart(2, '0')} /</span>`;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  ${numberedHtml}
</body>
</html>`;

  // ── Puppeteer PDF conversion ──
  // Detect Chromium path: use system chromium if available, otherwise fall back to Puppeteer's bundled browser
  const fs = await import("fs");
  const systemChromium = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
  const foundPath = systemChromium.find(p => fs.existsSync(p));
  
  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--font-render-hinting=none",
    ],
    timeout: 30000,
  };
  if (foundPath) {
    launchOptions.executablePath = foundPath;
  }
  // If no system chromium found, Puppeteer will use its bundled browser
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Backward-compatible aliases
export { sanitizeHospitalName };

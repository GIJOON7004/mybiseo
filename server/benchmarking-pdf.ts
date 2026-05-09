/**
 * 벤치마킹 리포트 PDF 생성 — 맥킨지/골드만삭스 스타일
 * Navy + Teal 팔레트, 깔끔한 타이포그래피
 */
import * as PDFDocumentModule from "pdfkit";
const PDFDocument = (PDFDocumentModule as any).default || PDFDocumentModule;
import { loadFonts } from "./fonts-base64";

// 색상 팔레트
const C = {
  navy: "#0f172a",
  teal: "#0d9488",
  tealLight: "#ccfbf1",
  gold: "#d97706",
  white: "#ffffff",
  gray50: "#f8fafc",
  gray200: "#e2e8f0",
  gray400: "#94a3b8",
  gray600: "#475569",
  gray800: "#1e293b",
  pass: "#059669",
  fail: "#dc2626",
  warn: "#d97706",
};

interface BenchmarkingReportData {
  hospitalName: string;
  hospitalUrl: string;
  specialty?: string | null;
  myScore: number;
  myGrade: string;
  reportTitle: string;
  executiveSummary: string;
  competitors: Array<{ name: string; url?: string; score: number; grade: string }>;
  categoryComparison: Array<{
    category: string;
    myScore: number;
    maxScore: number;
    competitors: Array<{ name: string; score: number; maxScore: number }>;
    items?: Array<{ name: string; status: string; message: string }>;
  }>;
  actionableInsights: Array<{
    priority: string;
    title: string;
    description: string;
    expectedImpact: string;
    competitorRef: string;
  }>;
  snsMarketingTips: Array<{
    platform: string;
    tip: string;
    frequency: string;
    keywordSuggestion: string;
  }>;
  weeklyPlan: Array<{
    week: string;
    tasks: string[];
  }>;
  createdAt?: Date | string;
}

export async function generateBenchmarkingPdf(data: BenchmarkingReportData): Promise<Buffer> {
  const FONT_BUFFERS = await loadFonts();
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      bufferPages: true,
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // 폰트 등록
    doc.registerFont("kr", FONT_BUFFERS.krRegular);
    doc.registerFont("krBold", FONT_BUFFERS.krBold);

    const W = doc.page.width - 100; // 사용 가능 너비
    const dateStr = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

    // ─── 표지 ───
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.navy);
    // 상단 teal 라인
    doc.rect(50, 50, W, 3).fill(C.teal);
    // MY비서 로고
    doc.font("krBold").fontSize(14).fillColor(C.teal).text("MY비서", 50, 70, { width: W });
    doc.font("kr").fontSize(10).fillColor(C.gray400).text("Global Medical Marketing Platform", 50, 90, { width: W });
    // 리포트 타이틀
    doc.font("krBold").fontSize(28).fillColor(C.white).text(data.reportTitle || "벤치마킹 리포트", 50, 250, { width: W, lineGap: 8 });
    // 병원 정보
    doc.font("kr").fontSize(12).fillColor(C.gray400)
      .text(`${data.hospitalName}  |  ${data.specialty || ""}  |  ${dateStr}`, 50, 340, { width: W });
    // 점수 배지
    const gradeColor = data.myScore >= 80 ? C.pass : data.myScore >= 60 ? C.gold : C.fail;
    doc.roundedRect(50, 400, 120, 60, 8).fill(gradeColor);
    doc.font("krBold").fontSize(32).fillColor(C.white).text(`${data.myScore}`, 50, 408, { width: 120, align: "center" });
    doc.font("kr").fontSize(10).fillColor(C.white).text(`${data.myGrade} 등급`, 50, 445, { width: 120, align: "center" });
    // 하단 라인
    doc.rect(50, doc.page.height - 60, W, 1).fill(C.gray600);
    doc.font("kr").fontSize(8).fillColor(C.gray400)
      .text("CONFIDENTIAL — Prepared by MY비서 AI Analytics", 50, doc.page.height - 50, { width: W, align: "center" });

    // ─── 2페이지: Executive Summary ───
    doc.addPage();
    drawHeader(doc, W, "Executive Summary");
    doc.font("kr").fontSize(11).fillColor(C.gray800).text(data.executiveSummary || "", 50, doc.y + 15, { width: W, lineGap: 6 });

    // 경쟁사 비교 표
    doc.moveDown(2);
    drawHeader(doc, W, "경쟁사 비교 요약");
    const tableY = doc.y + 15;
    // 헤더
    doc.rect(50, tableY, W, 28).fill(C.navy);
    doc.font("krBold").fontSize(9).fillColor(C.white);
    doc.text("병원명", 55, tableY + 8, { width: 200 });
    doc.text("SEO 점수", 260, tableY + 8, { width: 80, align: "center" });
    doc.text("등급", 345, tableY + 8, { width: 60, align: "center" });
    doc.text("차이", 410, tableY + 8, { width: 80, align: "center" });
    // 내 병원
    let rowY = tableY + 28;
    doc.rect(50, rowY, W, 26).fill(C.tealLight);
    doc.font("krBold").fontSize(9).fillColor(C.navy).text(data.hospitalName + " (내 병원)", 55, rowY + 7, { width: 200 });
    doc.text(String(data.myScore), 260, rowY + 7, { width: 80, align: "center" });
    doc.text(data.myGrade, 345, rowY + 7, { width: 60, align: "center" });
    doc.text("-", 410, rowY + 7, { width: 80, align: "center" });
    rowY += 26;
    // 경쟁사
    data.competitors.forEach((comp, i) => {
      const bg = i % 2 === 0 ? C.white : C.gray50;
      doc.rect(50, rowY, W, 26).fill(bg);
      const diff = data.myScore - comp.score;
      const diffStr = diff > 0 ? `+${diff}` : String(diff);
      const diffColor = diff >= 0 ? C.pass : C.fail;
      doc.font("kr").fontSize(9).fillColor(C.gray800).text(comp.name, 55, rowY + 7, { width: 200 });
      doc.text(String(comp.score), 260, rowY + 7, { width: 80, align: "center" });
      doc.text(comp.grade, 345, rowY + 7, { width: 60, align: "center" });
      doc.font("krBold").fillColor(diffColor).text(diffStr, 410, rowY + 7, { width: 80, align: "center" });
      rowY += 26;
    });

    // ─── 3페이지: 카테고리별 비교 ───
    if (data.categoryComparison && data.categoryComparison.length > 0) {
      doc.addPage();
      drawHeader(doc, W, "카테고리별 상세 비교");
      let cy = doc.y + 15;
      data.categoryComparison.forEach((cat) => {
        if (cy > doc.page.height - 120) { doc.addPage(); cy = 60; }
        doc.font("krBold").fontSize(11).fillColor(C.navy).text(cat.category, 50, cy);
        cy += 20;
        // 내 병원 바
        const myPct = cat.maxScore > 0 ? (cat.myScore / cat.maxScore) * 100 : 0;
        doc.rect(50, cy, W * 0.6, 14).fill(C.gray200);
        doc.rect(50, cy, W * 0.6 * (myPct / 100), 14).fill(C.teal);
        doc.font("kr").fontSize(8).fillColor(C.white).text(`내 병원 ${cat.myScore}/${cat.maxScore}`, 55, cy + 2);
        cy += 18;
        cat.competitors.forEach((comp) => {
          const pct = comp.maxScore > 0 ? (comp.score / comp.maxScore) * 100 : 0;
          doc.rect(50, cy, W * 0.6, 12).fill(C.gray200);
          doc.rect(50, cy, W * 0.6 * (pct / 100), 12).fill(C.gray400);
          doc.font("kr").fontSize(7).fillColor(C.gray800).text(`${comp.name} ${comp.score}/${comp.maxScore}`, 55, cy + 2);
          cy += 15;
        });
        cy += 10;
      });
    }

    // ─── 4페이지: Actionable Insights ───
    if (data.actionableInsights && data.actionableInsights.length > 0) {
      doc.addPage();
      drawHeader(doc, W, "Actionable Insights — 즉각 실행 지침");
      let iy = doc.y + 15;
      data.actionableInsights.forEach((insight, idx) => {
        if (iy > doc.page.height - 140) { doc.addPage(); iy = 60; }
        const priColor = insight.priority === "긴급" ? C.fail : insight.priority === "중요" ? C.gold : C.pass;
        // 우선순위 배지
        doc.roundedRect(50, iy, 50, 18, 4).fill(priColor);
        doc.font("krBold").fontSize(8).fillColor(C.white).text(insight.priority, 50, iy + 4, { width: 50, align: "center" });
        // 제목
        doc.font("krBold").fontSize(11).fillColor(C.navy).text(`${idx + 1}. ${insight.title}`, 110, iy + 2, { width: W - 70 });
        iy += 25;
        // 설명
        doc.font("kr").fontSize(9).fillColor(C.gray800).text(insight.description, 60, iy, { width: W - 20, lineGap: 4 });
        iy = doc.y + 8;
        // 기대 효과
        doc.font("kr").fontSize(8).fillColor(C.teal).text(`기대 효과: ${insight.expectedImpact}`, 60, iy, { width: W - 20 });
        iy = doc.y + 4;
        // 경쟁사 참조
        doc.font("kr").fontSize(8).fillColor(C.gray400).text(`참조: ${insight.competitorRef}`, 60, iy, { width: W - 20 });
        iy = doc.y + 15;
        // 구분선
        doc.rect(50, iy, W, 0.5).fill(C.gray200);
        iy += 10;
      });
    }

    // ─── 5페이지: SNS 마케팅 팁 ───
    if (data.snsMarketingTips && data.snsMarketingTips.length > 0) {
      doc.addPage();
      drawHeader(doc, W, "SNS 마케팅 전략");
      let sy = doc.y + 15;
      data.snsMarketingTips.forEach((tip) => {
        if (sy > doc.page.height - 100) { doc.addPage(); sy = 60; }
        doc.font("krBold").fontSize(10).fillColor(C.navy).text(tip.platform, 50, sy, { width: W });
        sy += 18;
        doc.font("kr").fontSize(9).fillColor(C.gray800).text(tip.tip, 60, sy, { width: W - 20, lineGap: 3 });
        sy = doc.y + 6;
        doc.font("kr").fontSize(8).fillColor(C.teal).text(`빈도: ${tip.frequency}  |  키워드: ${tip.keywordSuggestion}`, 60, sy, { width: W - 20 });
        sy = doc.y + 12;
      });
    }

    // ─── 6페이지: 4주 실행 계획 ───
    if (data.weeklyPlan && data.weeklyPlan.length > 0) {
      doc.addPage();
      drawHeader(doc, W, "4주 실행 계획");
      let wy = doc.y + 15;
      data.weeklyPlan.forEach((week) => {
        if (wy > doc.page.height - 100) { doc.addPage(); wy = 60; }
        doc.roundedRect(50, wy, W, 22, 4).fill(C.navy);
        doc.font("krBold").fontSize(10).fillColor(C.white).text(week.week, 60, wy + 5, { width: W - 20 });
        wy += 28;
        week.tasks.forEach((task) => {
          doc.font("kr").fontSize(9).fillColor(C.gray800).text(`  •  ${task}`, 60, wy, { width: W - 20 });
          wy = doc.y + 4;
        });
        wy += 10;
      });
    }

    // 페이지 번호
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      if (i > 0) { // 표지 제외
        doc.font("kr").fontSize(8).fillColor(C.gray400)
          .text(`${i + 1} / ${pages.count}`, 50, doc.page.height - 40, { width: W, align: "right", lineBreak: false, height: 12 });
      }
    }

    doc.end();
  });
}

function drawHeader(doc: any, W: number, title: string) {
  doc.rect(50, doc.y, W, 2).fill(C.teal);
  doc.font("krBold").fontSize(16).fillColor(C.navy).text(title, 50, doc.y + 10, { width: W });
  doc.moveDown(0.3);
}

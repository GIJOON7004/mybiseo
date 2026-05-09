/**
 * SEO Report PDF — HTML/Puppeteer 엔진 우선, PDFKit 레거시 fallback
 * 
 * 프로덕션 환경에서 Chromium/Puppeteer가 사용 불가능한 경우
 * 자동으로 PDFKit 기반 레거시 엔진으로 전환됩니다.
 * 
 * v2: PDF 생성 큐 적용 (concurrency: 2) — 동시 생성 시 OOM 방지
 */
import { generateHtmlPdfReport, sanitizeHospitalName } from "./ai-visibility-html-engine";
import { generateAiVisibilityReport } from "./ai-visibility-report";
import { enqueuePdfGeneration } from "./pdf-queue";

export async function generateSeoReportPdf(
  ...args: Parameters<typeof generateHtmlPdfReport>
): Promise<Buffer> {
  // PDF 생성을 큐에 넣어 동시 생성 수 제한 (concurrency: 2)
  return enqueuePdfGeneration(async () => {
    // 프로덕션에서는 Chromium이 없으므로 PDFKit 엔진을 기본으로 사용
    try {
      return await generateAiVisibilityReport(...args);
    } catch (pdfkitErr: any) {
      console.error(`[PDF] PDFKit engine failed:`, pdfkitErr?.message);
      // PDFKit 실패 시 HTML/Puppeteer 엔진 시도 (로컬 개발 환경 등)
      try {
        return await generateHtmlPdfReport(...args);
      } catch (htmlErr: any) {
        console.error(`[PDF] HTML engine also failed:`, htmlErr?.message);
        throw pdfkitErr;
      }
    }
  }, "seo-report");
}

export { sanitizeHospitalName };

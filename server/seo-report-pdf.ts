/**
 * SEO Report PDF — HTML/Puppeteer 엔진 우선, PDFKit 레거시 fallback
 * 
 * 프로덕션 환경에서 Chromium/Puppeteer가 사용 불가능한 경우
 * 자동으로 PDFKit 기반 레거시 엔진으로 전환됩니다.
 */
import { generateHtmlPdfReport, sanitizeHospitalName } from "./ai-visibility-html-engine";
import { generateAiVisibilityReport } from "./ai-visibility-report";

export async function generateSeoReportPdf(
  ...args: Parameters<typeof generateHtmlPdfReport>
): Promise<Buffer> {
  // 프로덕션에서는 Chromium이 없으므로 PDFKit 엔진을 기본으로 사용
  // PDFKit은 순수 Node.js이므로 모든 환경에서 안정적으로 작동
  try {
    return await generateAiVisibilityReport(...args);
  } catch (pdfkitErr: any) {
    console.error(`[PDF] PDFKit engine failed:`, pdfkitErr?.message);
    
    // PDFKit 실패 시 HTML/Puppeteer 엔진 시도 (로컬 개발 환경 등)
    try {
      return await generateHtmlPdfReport(...args);
    } catch (htmlErr: any) {
      console.error(`[PDF] HTML engine also failed:`, htmlErr?.message);
      throw pdfkitErr; // 원래 에러를 throw
    }
  }
}

export { sanitizeHospitalName };

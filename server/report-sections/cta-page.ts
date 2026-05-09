/**
 * CTA Page Section Plugin
 * sections.ts에서 추출 — buildCtaPage
 */
import { esc } from "../ai-visibility-html-report";

export function buildCtaPage(t: Record<string, string>, qrDataUrl: string, pageNum: number, totalPages: number): string {
  return `<div class="page cta-page">
    <h2>${esc(t.ctaTitle)}</h2>
    <div class="cta-desc">${esc(t.ctaDesc1)}<br/>${esc(t.ctaDesc2)}</div>
    <div class="cta-contact">
      <p>${esc(t.ctaPhone)}</p>
      <p>${esc(t.ctaWeb)}</p>
    </div>
    ${qrDataUrl ? `<div class="qr-section"><img src="${qrDataUrl}" width="100" height="100" alt="QR"/></div>` : ""}
    <div class="disclaimer">${esc(t.disclaimer)}</div>
  </div>`;
}

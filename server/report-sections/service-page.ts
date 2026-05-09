/**
 * Service Page Section Plugin
 * sections.ts에서 추출 — buildServicePage
 */
import type { RealityDiagnosis } from "../reality-diagnosis";
import {
  sectionTitle, pageHeader, pageFooter, esc, stripMarkdown,
} from "../ai-visibility-html-report";
import type { Lang } from "../ai-visibility-html-report";

export function buildServicePage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const svc = rd.mybiseoServices;
  if (!svc) return "";
  const services = svc.services || [];
  if (services.length === 0 && !svc.ctaMessage) return "";
  return `<div class="page">
    ${pageHeader(t, url, t.serviceTitle)}
    <div class="content">
      ${sectionTitle(t.serviceTitle, t.serviceSub, '09')}
      <div class="section-intro">${esc(svc.headline || t.serviceDesc)}</div>
      <div class="grid-2 gap-8">
        ${services.map((s, idx) => `<div class="card" style="padding:14px 16px;border-top:3px solid var(--teal-500);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="action-num">${idx + 1}</span>
            <span class="fs-11 fw-600 text-navy">${esc(s.name)}</span>
          </div>
          <div class="fs-9 text-light" style="line-height:1.6;">${esc(stripMarkdown(s.description))}</div>
          ${s.relevanceToHospital ? `<div class="fs-9 mt-8" style="color:var(--teal-500);line-height:1.4;">→ ${esc(stripMarkdown(s.relevanceToHospital))}</div>` : ""}
        </div>`).join("")}
      </div>
      ${svc.ctaMessage ? `<div class="card mt-16" style="background:linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);color:white;border:none;text-align:center;padding:20px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${esc(svc.ctaMessage)}</div>
        <div style="font-size:10px;color:var(--gray-400);line-height:1.6;">${lang === "ko" ? "MY비서 전문 컨설턴트가 귀 병원에 최적화된 AI 마케팅 전략을 제안해 드립니다." : "Our consultants will propose an AI marketing strategy optimized for your hospital."}</div>
      </div>` : ""}
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

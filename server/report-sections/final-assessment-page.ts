/**
 * Final Assessment Page Section Plugin
 * sections.ts에서 추출 — buildFinalAssessmentPage
 */
import type { RealityDiagnosis } from "../reality-diagnosis";
import {
  sectionTitle, pageHeader, pageFooter, esc, stripMarkdown, getGradeColor,
} from "../ai-visibility-html-report";
import type { Lang } from "../ai-visibility-html-report";

export function buildFinalAssessmentPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  score: number, grade: string, lang: Lang, pageNum: number, totalPages: number
): string {
  const closingText = rd.closingStatement || "";
  const paragraphs = closingText.split(/\n\n|\n/).filter((p: string) => p.trim());
  const gradeColor = getGradeColor(grade);
  const geoScore = rd.geoTriAxis?.overallGeoScore ?? 0;
  const capsuleScore = rd.answerCapsule?.score ?? 0;
  const crossScore = rd.crossChannelTrust?.overallConsistency ?? 0;
  const cueScore = rd.naverCueDiagnosis?.score ?? 0;
  const citMet = rd.aiCitationThreshold?.metCount ?? 0;
  const citTotal = rd.aiCitationThreshold?.totalCount ?? 0;
  const actionCount = rd.actionItems?.length ?? 0;
  const immediateActions = rd.actionItems?.filter(i => i.priority === "즉시").length ?? 0;
  const scoreColor = (s: number) => s >= 70 ? "var(--pass)" : s >= 40 ? "var(--warn)" : "var(--fail)";
  return `<div class="page">
    ${pageHeader(t, url, t.finalAssessment)}
    <div class="content">
      ${sectionTitle(t.finalAssessment, t.finalAssessmentSub, '09')}
      <div class="card card-dark" style="display:flex;align-items:center;gap:20px;padding:20px 24px;margin-bottom:16px;">
        <div style="text-align:center;min-width:80px;">
          <div style="font-size:36px;font-weight:700;color:${gradeColor};">${score}</div>
          <div style="font-size:10px;color:var(--gray-400);">/ 100</div>
          <div style="display:inline-block;margin-top:6px;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600;color:white;background:${gradeColor};">${grade}</div>
        </div>
        <div style="flex:1;border-left:1px solid var(--navy-500);padding-left:20px;">
          <div style="font-size:12px;font-weight:600;margin-bottom:8px;">${esc(t.finalAssessment)}</div>
          ${paragraphs.length > 0 ? `<div style="font-size:10px;color:#CBD5E1;line-height:1.7;">${esc(stripMarkdown(paragraphs[0]))}</div>` : ""}
        </div>
      </div>
      ${paragraphs.slice(1).map((p: string) => `<div class="card" style="margin-bottom:6px;border-left:3px solid var(--teal-500);">
        <div class="fs-10" style="line-height:1.7;">${esc(stripMarkdown(p))}</div>
      </div>`).join("")}
      <div class="sub-title mt-16">${lang === "ko" ? "귀 병원 포지션 요약" : "Your Position Summary"}</div>
      <div class="grid-3 gap-8 mb-12">
        <div class="metric-box" style="border-top:3px solid ${scoreColor(geoScore)};"><div class="label">${lang === "ko" ? "GEO 3축" : "GEO"}</div><div class="value" style="color:${scoreColor(geoScore)};">${geoScore}</div></div>
        <div class="metric-box" style="border-top:3px solid ${scoreColor(capsuleScore)};"><div class="label">${lang === "ko" ? "답변 캡슐" : "Capsule"}</div><div class="value" style="color:${scoreColor(capsuleScore)};">${capsuleScore}</div></div>
        <div class="metric-box" style="border-top:3px solid ${scoreColor(crossScore)};"><div class="label">${lang === "ko" ? "교차 신뢰" : "Cross"}</div><div class="value" style="color:${scoreColor(crossScore)};">${crossScore}</div></div>
      </div>
      <div class="grid-3 gap-8">
        <div class="metric-box" style="border-top:3px solid ${scoreColor(cueScore)};"><div class="label">${lang === "ko" ? "네이버 Cue" : "Naver"}</div><div class="value" style="color:${scoreColor(cueScore)};">${cueScore}</div></div>
        <div class="metric-box" style="border-top:3px solid var(--teal-500);"><div class="label">${lang === "ko" ? "AI 인용" : "Citation"}</div><div class="value" style="color:var(--teal-500);">${citMet}/${citTotal}</div></div>
        <div class="metric-box" style="border-top:3px solid var(--navy-600);"><div class="label">${lang === "ko" ? "즉시 조치" : "Immediate"}</div><div class="value">${immediateActions}<span class="fs-9 text-muted">/${actionCount}</span></div></div>
      </div>
      <div class="card card-dark mt-16" style="padding:16px 20px;">
        <div style="font-size:11px;font-weight:600;margin-bottom:10px;">${lang === "ko" ? "경쟁 우위를 선점하는 3가지 액션" : "3 Actions to Gain Competitive Edge"}</div>
        <div class="grid-3 gap-8">
          ${[
            { num: "01", text: lang === "ko" ? "본 리포트의 '선점 기회' 항목부터 실행하여 경쟁사보다 먼저 움직이세요" : "Act on 'Opportunity' items before competitors" },
            { num: "02", text: lang === "ko" ? "MY비서 전략 브리핑을 통해 귀 병원만의 AI 마케팅 로드맵을 수립하세요" : "Get a strategic briefing for your AI marketing roadmap" },
            { num: "03", text: lang === "ko" ? "1개월 후 재분석으로 경쟁사 대비 포지션 변화를 확인하세요" : "Re-analyze after 1 month to track position changes" },
          ].map(s => `<div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px 12px;">
            <div style="font-size:16px;font-weight:700;color:var(--teal-400);margin-bottom:4px;">${s.num}</div>
            <div style="font-size:9px;color:#CBD5E1;line-height:1.6;">${s.text}</div>
          </div>`).join("")}
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/**
 * AI 가시성 진단 보고서 — 섹션 빌더
 * 30가지 디자인 개선사항 반영 — 프리미엄 보고서 품질
 * RealityDiagnosis 타입에 정확히 맞춤
 */
import type { RealityDiagnosis, CompetitorSnapshot, KeywordExposure } from "./reality-diagnosis";
import {
  sectionTitle, pageHeader, pageFooter, statusBadge, progressBarHtml,
  esc, stripMarkdown, getGradeColor, getStatusColor, getStatusBg, catName,
  scoreGaugeSvgLight, statusIcon, platformIcon, miniDonutSvg, CSS, i18n, CAT_NAMES_KO,
} from "./ai-visibility-html-report";
import type { SeoAuditResult, Lang } from "./ai-visibility-html-report";

/* ═══════════════════════════════════════════════
   FULL AUDIT TABLE PAGES (smart pagination)
   ═══════════════════════════════════════════════ */

export function buildFullAuditPages(
  t: Record<string, string>, url: string, categories: SeoAuditResult["categories"],
  lang: Lang, startPage: number, totalPages: number
): string[] {
  // v2 압축: fail/warning 항목만 표시 (pass는 카테고리 요약에서 집계)
  const allItems = categories.flatMap(c =>
    c.items.map(it => ({ ...it, catName: catName(c.name, lang) }))
  );
  if (allItems.length === 0) return [];

  // 카테고리별 요약 통계
  const catSummary = categories.map(c => {
    const pass = c.items.filter(i => i.status === 'pass').length;
    const warn = c.items.filter(i => i.status === 'warning').length;
    const fail = c.items.filter(i => i.status === 'fail').length;
    return { name: catName(c.name, lang), total: c.items.length, pass, warn, fail };
  });

  // fail/warning 항목만 추출 (핵심 개선 대상)
  const problemItems = allItems.filter(it => it.status !== 'pass');

  const ROWS_FIRST = 14; // 카테고리 요약 아래에 표시
  const ROWS_NEXT = 22;  // 계속 페이지는 더 많이
  const MIN_LAST_PAGE = 5;

  const chunks: typeof problemItems[] = [];
  let idx = 0;
  chunks.push(problemItems.slice(0, ROWS_FIRST));
  idx = ROWS_FIRST;
  while (idx < problemItems.length) {
    chunks.push(problemItems.slice(idx, idx + ROWS_NEXT));
    idx += ROWS_NEXT;
  }
  if (chunks.length > 1 && chunks[chunks.length - 1].length < MIN_LAST_PAGE) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] = chunks[chunks.length - 1].concat(last);
  }

  return chunks.map((chunk, ci) => {
    const pn = startPage + ci;
    const isFirst = ci === 0;
    const rows = chunk.map(it => {
      const badgeCls = it.status === 'warning' ? 'badge-warn' : 'badge-fail';
      const statusLabel = it.status === 'warning' ? t.statusWarning : t.statusFail;
      const scoreRatio = it.maxScore > 0 ? it.score / it.maxScore : 0;
      const barColor = getStatusColor(it.status);
      return `<tr>
        <td class="fw-500" style="font-size:8px;">${esc(it.catName)}</td>
        <td style="font-size:8.5px;">${statusIcon(it.status)} ${esc(it.name)}</td>
        <td style="text-align:center;"><span class="badge ${badgeCls}" style="font-size:7px;padding:1px 5px;">${esc(statusLabel)}</span></td>
        <td style="text-align:center;font-size:8.5px;"><div style="font-weight:600;">${it.score}/${it.maxScore}</div></td>
        <td style="font-size:8px;color:var(--gray-3);line-height:1.5;white-space:normal;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${esc(stripMarkdown(it.detail || it.recommendation || '').substring(0, 80))}${(it.detail || it.recommendation || '').length > 80 ? '...' : ''}</td>
      </tr>`;
    }).join('');

    // 카테고리 요약 미니 바 (첫 페이지에만)
    const catSummaryHtml = isFirst ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:4px;margin-bottom:10px;">
      ${catSummary.map(cs => {
        const pct = cs.total > 0 ? Math.round((cs.pass / cs.total) * 100) : 0;
        const color = pct >= 70 ? 'var(--pass)' : pct >= 40 ? 'var(--warn)' : 'var(--fail)';
        return `<div style="background:var(--gray-1);border-radius:4px;padding:4px 6px;display:flex;align-items:center;gap:4px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0;"></div>
          <span style="font-size:7.5px;color:var(--text);white-space:nowrap;">${esc(cs.name)}</span>
          <span style="font-size:7px;color:var(--gray-3);margin-left:auto;">${cs.pass}/${cs.total}</span>
        </div>`;
      }).join('')}
    </div>` : '';

    const passCount = allItems.filter(i => i.status === 'pass').length;

    return `<div class="page">
      ${pageHeader(t, url, t.fullAuditTitle)}
      <div class="content">
        ${isFirst ? sectionTitle(t.fullAuditTitle, t.fullAuditSub, '03') : `<div class="sub-title">${esc(t.fullAuditTitle)} (${lang === 'ko' ? '계속' : 'cont.'})</div>`}
        ${isFirst ? `<div class="section-intro" style="margin-bottom:6px;">${lang === 'ko' ? `전체 ${allItems.length}개 항목 중 통과 ${passCount}개, 주의/실패 ${problemItems.length}개. 아래는 개선이 필요한 항목만 표시합니다.` : `${passCount} passed, ${problemItems.length} need improvement out of ${allItems.length} total items. Showing items that need attention.`}</div>` : ''}
        ${catSummaryHtml}
        <table class="data-table" style="font-size:8.5px;">
          <thead><tr>
            <th style="font-size:8px;padding:4px 6px;">${esc(t.category)}</th><th style="font-size:8px;padding:4px 6px;">${esc(t.item)}</th>
            <th style="text-align:center;font-size:8px;padding:4px 6px;">${esc(t.status)}</th>
            <th style="text-align:center;font-size:8px;padding:4px 6px;">${esc(t.score)}</th>
            <th style="font-size:8px;padding:4px 6px;">${esc(t.detail)}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${pageFooter(pn, totalPages, t.brand)}
    </div>`;
  });
}

/* ═══════════════════════════════════════════════
   REALITY DIAGNOSIS PAGES
   ═══════════════════════════════════════════════ */

export function buildRealityDiagnosisPages(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, startPage: number, totalPages: number
): string[] {
  const pages: string[] = [];
  let pn = startPage;

  // ══════════════════════════════════════════════
  // 통합 AI 심층진단 페이지 (1페이지)
  // GEO 3축 + 인용 임계점 + 캡슐 + 4채널 교차 신뢰
  // ══════════════════════════════════════════════

  const hasGeo = !!rd.geoTriAxis;
  const hasCit = !!rd.aiCitationThreshold;
  const hasCap = !!rd.answerCapsule;
  const hasCross = !!rd.crossChannelTrust;

  if (hasGeo || hasCit || hasCap || hasCross) {
    // ── GEO 3축 데이터 ──
    const geo = rd.geoTriAxis;
    const geoScore = geo?.overallGeoScore ?? 0;
    const geoColor = geoScore >= 70 ? "var(--pass)" : geoScore >= 40 ? "var(--warn)" : "var(--fail)";
    const axes = geo ? [
      { label: lang === "ko" ? "권위성" : "Authority", score: geo.authority?.score ?? 0, color: "var(--fail)" },
      { label: lang === "ko" ? "관련성" : "Relevance", score: geo.relevance?.score ?? 0, color: "var(--warn)" },
      { label: lang === "ko" ? "마찰도" : "Friction", score: geo.friction?.score ?? 0, color: "var(--pass)" },
    ] : [];

    // ── 인용 임계점 데이터 ──
    const cit = rd.aiCitationThreshold;
    const citMet = cit?.metCount ?? 0;
    const citTotal = cit?.totalCount ?? 0;
    const citPct = citTotal > 0 ? Math.round((citMet / citTotal) * 100) : 0;
    const citColor = citPct >= 70 ? "var(--pass)" : citPct >= 40 ? "var(--warn)" : "var(--fail)";

    // ── 캡슐 데이터 ──
    const cap = rd.answerCapsule;
    const capScore = cap?.score ?? 0;
    const capColor = capScore >= 70 ? "var(--pass)" : capScore >= 40 ? "var(--warn)" : "var(--fail)";

    // ── 4채널 교차 신뢰 데이터 ──
    const cross = rd.crossChannelTrust;
    const crossScore = cross?.overallConsistency ?? 0;
    const crossColor = crossScore >= 70 ? "var(--pass)" : crossScore >= 40 ? "var(--warn)" : "var(--fail)";

    // ── 미니 레이더 SVG (80px) ──
    const radarSize = 80;
    const cx = radarSize / 2, radarR = 28;
    const angles = [-90, 150, 30];
    let radarSvg = "";
    if (geo) {
      const pts = axes.map((a, i) => {
        const rad = (angles[i] * Math.PI) / 180;
        const r = (a.score / 100) * radarR;
        return { x: cx + r * Math.cos(rad), y: cx + r * Math.sin(rad) };
      });
      const polygon = pts.map(p => `${p.x},${p.y}`).join(" ");
      radarSvg = `<svg width="${radarSize}" height="${radarSize}" viewBox="0 0 ${radarSize} ${radarSize}">
        <polygon points="${angles.map(deg => { const rad = (deg * Math.PI) / 180; return `${cx + radarR * Math.cos(rad)},${cx + radarR * Math.sin(rad)}`; }).join(" ")}" fill="none" stroke="#E2E8F0" stroke-width="0.5"/>
        ${angles.map(deg => { const rad = (deg * Math.PI) / 180; return `<line x1="${cx}" y1="${cx}" x2="${cx + radarR * Math.cos(rad)}" y2="${cx + radarR * Math.sin(rad)}" stroke="#E2E8F0" stroke-width="0.5"/>`; }).join("")}
        <polygon points="${polygon}" fill="rgba(13,148,136,0.12)" stroke="var(--accent)" stroke-width="1.2"/>
        ${pts.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${axes[i].color}" stroke="white" stroke-width="1"/>`).join("")}
      </svg>`;
    }

    pages.push(`<div class="page">
      ${pageHeader(t, url, lang === "ko" ? "AI 추천 심층 진단" : "AI Deep Diagnosis")}
      <div class="content">
        ${sectionTitle(lang === "ko" ? "AI 추천 심층 진단" : "AI Recommendation Deep Diagnosis", lang === "ko" ? "4가지 핵심 지표 종합 분석" : "Comprehensive Analysis of 4 Key Metrics", '04')}

        <!-- 4개 지표 카드 2x2 그리드 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">

          <!-- GEO 3축 카드 -->
          ${hasGeo ? `<div class="card" style="padding:12px;border-top:3px solid ${geoColor};">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <div style="flex-shrink:0;">${radarSvg}</div>
              <div style="flex:1;">
                <div class="fs-10 fw-600" style="color:var(--primary);">GEO 3${lang === "ko" ? "축 분석" : "-Axis"}</div>
                <div style="font-size:22px;font-weight:700;color:${geoColor};margin:2px 0;">${geoScore}<span class="fs-9 text-muted">/100</span></div>
              </div>
            </div>
            ${axes.map(a => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
              <span class="fs-9" style="width:40px;color:var(--gray-3);">${a.label}</span>
              <div style="flex:1;height:4px;background:var(--gray-1);border-radius:2px;"><div style="height:4px;width:${a.score}%;background:${a.color};border-radius:2px;"></div></div>
              <span class="fs-9 fw-600" style="width:24px;text-align:right;color:${a.color};">${a.score}</span>
            </div>`).join("")}
          </div>` : ""}

          <!-- 인용 임계점 카드 -->
          ${hasCit ? `<div class="card" style="padding:12px;border-top:3px solid ${citColor};">
            <div class="fs-10 fw-600" style="color:var(--primary);margin-bottom:4px;">${lang === "ko" ? "AI 인용 임계점" : "AI Citation Threshold"}</div>
            <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:8px;">
              <span style="font-size:22px;font-weight:700;color:${citColor};">${citPct}%</span>
              <span class="fs-9 text-muted">(${citMet}/${citTotal} ${lang === "ko" ? "충족" : "met"})</span>
            </div>
            ${(cit?.items || []).slice(0, 4).map(it => `<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
              <span style="font-size:10px;">${it.met ? "✅" : "❌"}</span>
              <span class="fs-9" style="color:${it.met ? "var(--pass)" : "var(--fail)"};">${esc(it.condition || "")}</span>
            </div>`).join("")}
            ${(cit?.items || []).length > 4 ? `<div class="fs-9 text-muted">+${(cit?.items || []).length - 4}${lang === "ko" ? "개 항목" : " more"}</div>` : ""}
          </div>` : ""}

          <!-- 답변 캡슐 카드 -->
          ${hasCap ? `<div class="card" style="padding:12px;border-top:3px solid ${capColor};">
            <div class="fs-10 fw-600" style="color:var(--primary);margin-bottom:4px;">${lang === "ko" ? "답변 캡슐 품질" : "Answer Capsule Quality"}</div>
            <div style="font-size:22px;font-weight:700;color:${capColor};margin-bottom:6px;">${capScore}<span class="fs-9 text-muted">/100</span></div>
            ${cap?.currentBestSentence ? `<div style="padding:6px 8px;background:var(--gray-1);border-radius:4px;border-left:2px solid ${capColor};margin-bottom:4px;">
              <div class="fs-9 text-muted" style="margin-bottom:2px;">${lang === "ko" ? "현재 AI 인용 문장" : "Current AI Citation"}</div>
              <div class="fs-9 text-light" style="line-height:1.5;font-style:italic;">"${esc((cap.currentBestSentence || "").substring(0, 80))}${(cap.currentBestSentence || "").length > 80 ? "..." : ""}"</div>
            </div>` : ""}
            ${(cap?.issues || []).length > 0 ? `<div class="fs-9 text-fail">${statusIcon("fail")} ${(cap?.issues || []).length}${lang === "ko" ? "개 문제 발견" : " issues found"}</div>` : ""}
          </div>` : ""}

          <!-- 4채널 교차 신뢰 카드 -->
          ${hasCross ? `<div class="card" style="padding:12px;border-top:3px solid ${crossColor};">
            <div class="fs-10 fw-600" style="color:var(--primary);margin-bottom:4px;">${lang === "ko" ? "4채널 교차 신뢰" : "Cross-Channel Trust"}</div>
            <div style="font-size:22px;font-weight:700;color:${crossColor};margin-bottom:6px;">${crossScore}%</div>
            ${(cross?.channels || []).slice(0, 4).map(ch => {
              const chScore = ch.consistencyScore ?? 0;
              const chColor = chScore >= 70 ? "var(--pass)" : chScore >= 40 ? "var(--warn)" : "var(--fail)";
              return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span class="fs-9" style="width:50px;color:var(--gray-3);">${esc(ch.name)}</span>
                <div style="flex:1;height:4px;background:var(--gray-1);border-radius:2px;"><div style="height:4px;width:${chScore}%;background:${chColor};border-radius:2px;"></div></div>
                <span class="badge ${ch.status === "활성" ? "badge-pass" : ch.status === "미흡" ? "badge-warn" : "badge-fail"}" style="font-size:7px;padding:1px 4px;">${esc(ch.status)}</span>
              </div>`;
            }).join("")}
          </div>` : ""}
        </div>

        <!-- 종합 인사이트 -->
        <div class="info-box" style="margin-top:8px;">
          <div class="fs-10 fw-600" style="color:var(--primary);margin-bottom:6px;">${lang === "ko" ? "종합 인사이트" : "Key Insights"}</div>
          <div class="fs-9 text-light" style="line-height:1.7;">
            ${geo?.interpretation ? `${esc(stripMarkdown(geo.interpretation).substring(0, 150))}` : ""}
            ${cit?.verdict ? ` ${esc(stripMarkdown(cit.verdict).substring(0, 150))}` : ""}
          </div>
        </div>

        <!-- 다음 페이지 연결 -->
        <div style="margin-top:8px;text-align:right;">
          <span class="fs-9" style="color:var(--accent);">${lang === "ko" ? "→ 다음 페이지에서 콘텐츠 사각지대를 분석합니다" : "→ Content gap analysis on the next page"}</span>
        </div>
      </div>
      ${pageFooter(pn++, totalPages, t.brand)}
    </div>`);
  }

  // ── AI 시뮬레이터는 키워드 페이지에 통합 (엔진에서 buildKeywordPage로 처리) ──
  // ── 네이버 Cue는 별도 페이지로 유지 ──
  if (rd.naverCueDiagnosis) {
    const cue = rd.naverCueDiagnosis;
    const cueScore = cue.score ?? 0;
    const cueColor = cueScore >= 70 ? "var(--pass)" : cueScore >= 40 ? "var(--warn)" : "var(--fail)";
    const items = cue.items || [];
    const goodItems = items.filter(i => i.status === "양호").length;
    const badItems = items.filter(i => i.status !== "양호").length;

    pages.push(`<div class="page">
      ${pageHeader(t, url, t.naverCueTitle)}
      <div class="content">
        ${sectionTitle(t.naverCueTitle, t.naverCueSub, '05')}
        <div class="section-intro">${esc(t.naverCueDesc)}</div>

        <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:12px;">
          <div style="text-align:center;flex-shrink:0;">
            ${scoreGaugeSvgLight(cueScore, cueScore >= 70 ? "A" : cueScore >= 40 ? "C" : "F", 80)}
          </div>
          <div style="flex:1;">
            <div class="grid-3 gap-8 mb-8">
              <div class="metric-box" style="border-top:3px solid ${cueColor};padding:8px;">
                <div class="label" style="font-size:8px;">${lang === "ko" ? "종합" : "Overall"}</div>
                <div class="value" style="font-size:18px;color:${cueColor};">${cueScore}</div>
              </div>
              <div class="metric-box" style="border-top:3px solid var(--pass);padding:8px;">
                <div class="label" style="font-size:8px;">${lang === "ko" ? "양호" : "Good"}</div>
                <div class="value" style="font-size:18px;" class="text-pass">${goodItems}</div>
              </div>
              <div class="metric-box" style="border-top:3px solid var(--fail);padding:8px;">
                <div class="label" style="font-size:8px;">${lang === "ko" ? "개선" : "Fix"}</div>
                <div class="value" style="font-size:18px;" class="text-fail">${badItems}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 항목 카드 2열 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${items.map(it => {
            const itColor = it.status === "양호" ? "var(--pass)" : it.status === "미흡" ? "var(--warn)" : "var(--fail)";
            const itBadge = it.status === "양호" ? "badge-pass" : it.status === "미흡" ? "badge-warn" : "badge-fail";
            return `<div class="card" style="padding:10px;border-left:3px solid ${itColor};">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span class="fs-9 fw-600">${esc(it.criterion)}</span>
                <span class="badge ${itBadge}" style="font-size:7px;padding:1px 4px;">${esc(it.status)}</span>
              </div>
              <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(it.detail).substring(0, 100))}${stripMarkdown(it.detail).length > 100 ? "..." : ""}</div>
            </div>`;
          }).join("")}
        </div>

        ${cue.verdict ? `<div class="insight-box mt-8">
          <span class="fw-600">${lang === "ko" ? "판단:" : "Verdict:"}</span> ${esc(stripMarkdown(cue.verdict))}
        </div>` : ""}
      </div>
      ${pageFooter(pn++, totalPages, t.brand)}
    </div>`);
  }

  return pages;
}


/* ═══════════════════════════════════════════════
   STRATEGY GUIDE PAGES
   ═══════════════════════════════════════════════ */

export function buildStrategyGuidePages(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, startPage: number, totalPages: number
): string[] {
  const pages: string[] = [];
  let pn = startPage;

  // ── Website Transform Guide ──
  const guide = rd.websiteTransformGuide;
  if (guide) {
    const transforms = guide.transformations || [];
    pages.push(`<div class="page">
      ${pageHeader(t, url, t.strategyGuideTitle)}
      <div class="content">
        ${sectionTitle(t.strategyGuideTitle, t.strategyGuideSub, '08')}
        <div class="section-intro">${esc(t.strategyGuideDesc)}</div>
        ${guide.currentState ? `<div class="info-box mb-12">${esc(stripMarkdown(guide.currentState))}</div>` : ""}
        ${transforms.map((g, idx) => {
          const prioCls = g.priority === "높음" ? "priority-high" : g.priority === "중간" ? "priority-mid" : "priority-low";
          return `<div class="card" style="margin-bottom:8px;padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="action-num">${idx + 1}</span>
                <span class="fs-11 fw-600 text-navy">${esc(g.area)}</span>
              </div>
              <span class="priority-badge ${prioCls}">${esc(g.priority)}</span>
            </div>
            <div class="grid-2 gap-8 mt-4">
              <div style="padding:8px 10px;background:var(--fail-bg);border-radius:6px;">
                <div class="fs-9 fw-600 text-fail mb-4">${lang === "ko" ? "현재 문제" : "Current Issue"}</div>
                <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(g.currentIssue))}</div>
              </div>
              <div style="padding:8px 10px;background:var(--pass-bg);border-radius:6px;">
                <div class="fs-9 fw-600 text-pass mb-4">${lang === "ko" ? "개선 방향" : "Recommendation"}</div>
                <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(g.recommendation))}</div>
              </div>
            </div>
            ${g.estimatedImpact ? `<div class="fs-9 mt-4" style="color:var(--teal-500);">→ ${esc(stripMarkdown(g.estimatedImpact))}</div>` : ""}
          </div>`;
        }).join("")}
      </div>
      ${pageFooter(pn++, totalPages, t.brand)}
    </div>`);
  }

  // ── Content Strategy ──
  const cs = rd.contentStrategy;
  const hasContentStrategyData = cs && (cs.currentAssessment || (cs.contentCalendar && cs.contentCalendar.length > 0) || cs.blogStrategy || cs.faqStrategy || cs.comparisonTableStrategy);
  if (hasContentStrategyData) {
    const calendar = cs.contentCalendar || [];

    pages.push(`<div class="page">
      ${pageHeader(t, url, t.contentStrategyTitle)}
      <div class="content">
        ${sectionTitle(t.contentStrategyTitle, t.contentStrategySub, '08')}
        <div class="section-intro">${esc(t.contentStrategyDesc)}</div>
        ${cs.currentAssessment ? `<div class="info-box mb-12">${esc(stripMarkdown(cs.currentAssessment))}</div>` : ""}
        ${calendar.length > 0 ? `
        <div class="sub-title">${lang === "ko" ? "콘텐츠 캘린더" : "Content Calendar"}</div>
        <table class="data-table">
          <thead><tr>
            <th style="width:15%;">${lang === "ko" ? "주차" : "Week"}</th>
            <th style="width:30%;">${lang === "ko" ? "주제" : "Topic"}</th>
            <th style="width:20%;">${lang === "ko" ? "형식" : "Format"}</th>
            <th>${lang === "ko" ? "타겟 키워드" : "Target Keyword"}</th>
          </tr></thead>
          <tbody>${calendar.slice(0, 8).map(c => `<tr>
            <td class="fw-500">${esc(c.week)}</td>
            <td>${esc(c.topic)}</td>
            <td><span class="stat-pill">${esc(c.format)}</span></td>
            <td class="fs-9 text-light">${esc(c.targetKeyword)}</td>
          </tr>`).join("")}</tbody>
        </table>` : ""}
        <!-- Strategy cards -->
        <div class="grid-3 gap-8 mt-16">
          ${cs.blogStrategy ? `<div class="card" style="padding:10px 12px;border-top:3px solid var(--teal-500);">
            <div class="fs-10 fw-600 text-navy mb-4">${lang === "ko" ? "블로그 전략" : "Blog Strategy"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(cs.blogStrategy).substring(0, 120))}</div>
          </div>` : ""}
          ${cs.faqStrategy ? `<div class="card" style="padding:10px 12px;border-top:3px solid var(--blue-500);">
            <div class="fs-10 fw-600 text-navy mb-4">${lang === "ko" ? "FAQ 전략" : "FAQ Strategy"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(cs.faqStrategy).substring(0, 120))}</div>
          </div>` : ""}
          ${cs.comparisonTableStrategy ? `<div class="card" style="padding:10px 12px;border-top:3px solid var(--navy-600);">
            <div class="fs-10 fw-600 text-navy mb-4">${lang === "ko" ? "비교표 전략" : "Comparison Table"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(cs.comparisonTableStrategy).substring(0, 120))}</div>
          </div>` : ""}
        </div>
      </div>
      ${pageFooter(pn++, totalPages, t.brand)}
    </div>`);
  }

  // ── Marketing Direction ──
  const md = rd.marketingDirection;
  if (md) {
    const channels = md.channelStrategies || [];

    pages.push(`<div class="page">
      ${pageHeader(t, url, t.marketingTitle)}
      <div class="content">
        ${sectionTitle(t.marketingTitle, t.marketingSub, '08')}
        <div class="section-intro">${esc(t.marketingDesc)}</div>
        ${md.overallStrategy ? `<div class="info-box mb-12">${esc(stripMarkdown(md.overallStrategy))}</div>` : ""}
        ${channels.map(ch => {
          const prioCls = ch.priority === "높음" ? "priority-high" : ch.priority === "중간" ? "priority-mid" : "priority-low";
          return `<div class="card" style="margin-bottom:8px;padding:12px 14px;border-left:3px solid var(--blue-500);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span class="fs-11 fw-600 text-navy">${esc(ch.channel)}</span>
              <span class="priority-badge ${prioCls}">${esc(ch.priority)}</span>
            </div>
            <div class="fs-9 text-light" style="line-height:1.6;">${esc(stripMarkdown(ch.strategy))}</div>
            ${ch.expectedOutcome ? `<div class="fs-9 mt-4" style="color:var(--teal-500);">→ ${esc(stripMarkdown(ch.expectedOutcome))}</div>` : ""}
          </div>`;
        }).join("")}
        ${md.coexistenceMessage ? `<div class="card" style="background:var(--gray-50);border:1px dashed var(--gray-300);margin-top:12px;">
          <div class="fs-9 text-light" style="line-height:1.6;">${esc(stripMarkdown(md.coexistenceMessage))}</div>
        </div>` : ""}
        <!-- Monthly execution guide -->
        <div class="sub-title mt-16">${lang === "ko" ? "월별 실행 가이드" : "Monthly Execution Guide"}</div>
        <div class="grid-3 gap-8">
          <div class="card" style="padding:10px 12px;border-top:3px solid var(--fail);">
            <div class="fs-10 fw-600 text-fail mb-4">${lang === "ko" ? "1개월차" : "Month 1"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${lang === "ko" ? "기초 인프라 구축: 웹사이트 구조화 데이터 적용, 핵심 콘텐츠 발행" : "Build infrastructure: structured data, publish core contents"}</div>
          </div>
          <div class="card" style="padding:10px 12px;border-top:3px solid var(--warn);">
            <div class="fs-10 fw-600 text-warn mb-4">${lang === "ko" ? "2~3개월차" : "Month 2-3"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${lang === "ko" ? "콘텐츠 확장: 블로그/SNS 연동, 리뷰 관리, AI 플랫폼 모니터링" : "Expand content: blog/SNS, review management, AI monitoring"}</div>
          </div>
          <div class="card" style="padding:10px 12px;border-top:3px solid var(--pass);">
            <div class="fs-10 fw-600 text-pass mb-4">${lang === "ko" ? "4~6개월차" : "Month 4-6"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${lang === "ko" ? "성과 최적화: 데이터 기반 전략 조정, 고성과 채널 집중" : "Optimize: data-driven strategy, focus on high-performing channels"}</div>
          </div>
        </div>
      </div>
      ${pageFooter(pn++, totalPages, t.brand)}
    </div>`);
  }

  return pages;
}

/* ═══════════════════════════════════════════════
   ACTION PLAN PAGE
   ═══════════════════════════════════════════════ */

export function buildActionPlanPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const items = rd.actionItems || [];
  if (items.length === 0) return "";

  const phases = [
    { key: "즉시", en: "Immediate", color: "var(--fail)", items: items.filter(i => i.priority === "즉시") },
    { key: "1개월 내", en: "Within 1 Month", color: "var(--warn)", items: items.filter(i => i.priority === "1개월 내") },
    { key: "3개월 내", en: "Within 3 Months", color: "var(--pass)", items: items.filter(i => i.priority === "3개월 내") },
  ];

  return `<div class="page">
    ${pageHeader(t, url, t.actionPlanTitle)}
    <div class="content">
      ${sectionTitle(t.actionPlanTitle, t.actionPlanSub, '08')}
      <div class="section-intro">${esc(t.actionPlanDesc)}</div>
      <div class="grid-3 mb-16">
        ${phases.map(ph => `<div class="metric-box" style="border-top:3px solid ${ph.color};">
          <div class="label">${lang === "ko" ? ph.key : ph.en}</div>
          <div class="value" style="color:${ph.color};">${ph.items.length}</div>
        </div>`).join("")}
      </div>
      ${phases.filter(ph => ph.items.length > 0).map(ph => `
        <div class="phase-banner" style="background:${ph.color};color:white;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:600;margin-bottom:8px;">${lang === "ko" ? ph.key + " 개선" : ph.en}</div>
        <div class="action-grid" style="margin-bottom:12px;">
          ${ph.items.map((item, idx) => `<div class="action-card" style="border-top:3px solid ${ph.color};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span class="action-num" style="width:20px;height:20px;font-size:8px;">${idx + 1}</span>
              <span class="action-card-title">${esc(item.action)}</span>
            </div>
            <div class="action-card-impact">${esc(stripMarkdown(item.expectedImpact))}</div>
          </div>`).join("")}
        </div>
      `).join("")}
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   MY비서 SERVICE PAGE
   ═══════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════
   FINAL ASSESSMENT PAGE
   ═══════════════════════════════════════════════ */

export function buildFinalAssessmentPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  score: number, grade: string, lang: Lang, pageNum: number, totalPages: number
): string {
  const closingText = rd.closingStatement || "";
  const paragraphs = closingText.split(/\n\n|\n/).filter(p => p.trim());
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
      ${paragraphs.slice(1).map(p => `<div class="card" style="margin-bottom:6px;border-left:3px solid var(--teal-500);">
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

/* ═══════════════════════════════════════════════
   HISTORY TREND PAGE
   ═══════════════════════════════════════════════ */

export function buildHistoryTrendPage(
  t: Record<string, string>, url: string, history: any[],
  lang: Lang, pageNum: number, totalPages: number
): string {
  if (!history || history.length < 2) return "";

  const sorted = [...history].sort((a, b) => new Date(a.analyzedAt || a.date).getTime() - new Date(b.analyzedAt || b.date).getTime());
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const change = (latest.score ?? 0) - (first.score ?? 0);
  const changeColor = change > 0 ? "var(--pass)" : change < 0 ? "var(--fail)" : "var(--gray-400)";
  const changeText = change > 0 ? t.historyImproved : change < 0 ? t.historyDeclined : t.historyNoChange;

  return `<div class="page">
    ${pageHeader(t, url, t.historyTitle)}
    <div class="content">
      ${sectionTitle(t.historyTitle, t.historySub, '09')}
      <div class="section-intro">${esc(t.historyDesc)}</div>
      <div class="grid-3 mb-16">
        <div class="metric-box" style="border-top:3px solid var(--gray-300);"><div class="label">${esc(t.historyFirst)}</div><div class="value">${first.score ?? 0}</div></div>
        <div class="metric-box" style="border-top:3px solid var(--teal-500);"><div class="label">${esc(t.historyLatest)}</div><div class="value">${latest.score ?? 0}</div></div>
        <div class="metric-box" style="border-top:3px solid ${changeColor};"><div class="label">${esc(t.historyChange)}</div><div class="value" style="color:${changeColor};">${change > 0 ? "+" : ""}${change}</div></div>
      </div>
      <div class="sub-title">${esc(t.historyScore)}</div>
      <div class="card" style="padding:20px;">
        <div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding-bottom:4px;border-bottom:1px solid var(--gray-200);">
          ${sorted.map(h => {
            const s = h.score ?? 0;
            const height = Math.max(8, (s / 100) * 100);
            const color = s >= 70 ? "var(--pass)" : s >= 40 ? "var(--warn)" : "var(--fail)";
            return `<div style="flex:1;text-align:center;">
              <div class="fs-9 fw-600" style="color:${color};margin-bottom:3px;">${s}</div>
              <div style="height:${height}px;background:linear-gradient(180deg, ${color} 0%, ${color}88 100%);border-radius:4px 4px 0 0;margin:0 auto;width:28px;"></div>
            </div>`;
          }).join("")}
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;">
          ${sorted.map(h => {
            const date = new Date(h.analyzedAt || h.date);
            return `<div style="flex:1;text-align:center;"><span class="fs-9 text-muted">${date.getMonth() + 1}/${date.getDate()}</span></div>`;
          }).join("")}
        </div>
      </div>
      <div class="insight-box mt-12">
        <span class="fw-600" style="color:${change >= 0 ? "var(--pass)" : "var(--fail)"};">${change > 0 ? "↑" : change < 0 ? "↓" : "→"} ${esc(changeText)}</span>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   CTA PAGE
   ═══════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════
   KEYWORD PAGE (color dots + badges)
   ═══════════════════════════════════════════════ */

export function buildKeywordPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const keywords: KeywordExposure[] = rd.keywords || [];
  if (keywords.length === 0) return "";

  const exposed = keywords.filter(kw => kw.naver?.found || kw.google?.found).length;
  const aiHigh = keywords.filter(kw => kw.ai?.likelihood === "high").length;
  const total = keywords.length;
  const portalRate = total > 0 ? Math.round((exposed / total) * 100) : 0;

  return `<div class="page">
    ${pageHeader(t, url, t.realityKeywords)}
    <div class="content">
      ${sectionTitle(t.realityKeywords, lang === "ko" ? "AI가 이 병원을 추천하지 않는 증거" : "Evidence AI Does Not Recommend This Hospital", '02')}
      <div class="section-intro">${lang === "ko" ? "각 키워드의 포털 및 AI 플랫폼 노출 현황을 분석하고, 선점 가능한 기회를 식별합니다." : "Analyzing keyword exposure and identifying first-mover opportunities."}</div>
      <table class="data-table">
        <thead><tr>
          <th style="width:25%;">${lang === "ko" ? "키워드" : "Keyword"}</th>
          <th style="text-align:center;">${esc(t.naverLabel)}</th>
          <th style="text-align:center;">${esc(t.googleLabel)}</th>
          <th style="text-align:center;">${esc(t.aiLabel)}</th>
          <th style="text-align:center;">${lang === "ko" ? "월간 검색량" : "Volume"}</th>
        </tr></thead>
        <tbody>
          ${keywords.map(kw => {
            const naverOk = kw.naver?.found;
            const googleOk = kw.google?.found;
            const aiLikelihood = kw.ai?.likelihood || "none";
            const aiCls = aiLikelihood === "high" ? "badge-pass" : aiLikelihood === "medium" ? "badge-warn" : "badge-fail";
            const aiLabel = aiLikelihood === "high" ? (lang === "ko" ? "높음" : "High") : aiLikelihood === "medium" ? (lang === "ko" ? "보통" : "Medium") : aiLikelihood === "low" ? (lang === "ko" ? "낮음" : "Low") : (lang === "ko" ? "없음" : "None");
            return `<tr>
              <td class="fw-500">${esc(kw.keyword)}</td>
              <td style="text-align:center;"><span class="dot-indicator ${naverOk ? "dot-exposed" : "dot-not-exposed"}">${naverOk ? esc(t.realityExposed) : esc(t.realityNotExposed)}</span></td>
              <td style="text-align:center;"><span class="dot-indicator ${googleOk ? "dot-exposed" : "dot-not-exposed"}">${googleOk ? esc(t.realityExposed) : esc(t.realityNotExposed)}</span></td>
              <td style="text-align:center;"><span class="badge ${aiCls}">${esc(aiLabel)}</span></td>
              <td style="text-align:center;font-size:10px;">${kw.monthlySearchVolume?.toLocaleString() ?? "-"}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
      <div class="grid-3 gap-8 mt-16">
        <div class="metric-box" style="border-top:3px solid var(--teal-500);"><div class="label">${lang === "ko" ? "포털 노출률" : "Portal Rate"}</div><div class="value" style="color:${portalRate >= 50 ? 'var(--pass)' : portalRate >= 30 ? 'var(--warn)' : 'var(--fail)'};">${portalRate}%</div><div class="fs-9 text-muted">${exposed}/${total}</div></div>
        <div class="metric-box" style="border-top:3px solid var(--blue-500);"><div class="label">${lang === "ko" ? "AI 높음 노출" : "AI High"}</div><div class="value" style="color:var(--blue-500);">${aiHigh}</div></div>
        <div class="metric-box" style="border-top:3px solid var(--navy-600);"><div class="label">${lang === "ko" ? "분석 키워드" : "Analyzed"}</div><div class="value">${total}</div></div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   CONTENT GAP PAGE (difficulty tags)
   ═══════════════════════════════════════════════ */

export function buildContentGapPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const gaps = rd.contentGaps || [];
  if (gaps.length === 0) return "";

  return `<div class="page">
    ${pageHeader(t, url, t.contentGapsTitle)}
    <div class="content">
      ${sectionTitle(t.contentGapsTitle, lang === "ko" ? "아직 아무도 선점하지 않은 콘텐츠 기회" : "Untapped content opportunities", '06')}
      <div class="section-intro">${lang === "ko" ? "경쟁사가 아직 다루지 않은 콘텐츠 영역을 분석합니다. 지금 선점하면 AI 검색에서 독보적 포지션을 확보할 수 있습니다." : "Analyzing content gaps competitors haven't addressed. First movers gain exclusive AI search positions."}</div>
      ${gaps.map((g, idx) => {
        const diffCls = g.difficulty === "쉬움" ? "diff-easy" : g.difficulty === "보통" ? "diff-medium" : "diff-hard";
        const scoreColor = g.opportunityScore >= 7 ? "var(--pass)" : g.opportunityScore >= 4 ? "var(--warn)" : "var(--fail)";
        return `<div class="card" style="border-left:3px solid ${scoreColor};margin-bottom:8px;padding:12px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="action-num">${idx + 1}</span>
              <span class="fs-11 fw-600 text-navy">${esc(g.keyword)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="diff-tag ${diffCls}">${esc(g.difficulty)}</span>
              <span class="fs-12 fw-700" style="color:${scoreColor};">${g.opportunityScore}/10</span>
            </div>
          </div>
          ${g.searchIntent ? `<div class="fs-9 text-muted mb-4">${lang === "ko" ? "검색 의도" : "Intent"}: ${esc(g.searchIntent)}</div>` : ""}
          <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(g.rationale))}</div>
          ${g.suggestedContent ? `<div class="fs-9 mt-4" style="color:var(--teal-500);line-height:1.4;">→ ${esc(stripMarkdown(g.suggestedContent))}</div>` : ""}
        </div>`;
      }).join("")}
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   COMPETITOR ANALYSIS PAGE
   ═══════════════════════════════════════════════ */

export function buildCompetitorPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const competitors: CompetitorSnapshot[] = rd.competitors || [];
  if (competitors.length === 0) return "";

  // Count competitors with higher visibility
  const highVisCount = competitors.filter(c => c.estimatedVisibility === "상").length;
  const midVisCount = competitors.filter(c => c.estimatedVisibility === "중").length;

  return `<div class="page">
    ${pageHeader(t, url, t.realityCompetitors)}
    <div class="content">
      ${sectionTitle(t.realityCompetitors, lang === "ko" ? "경쟁사는 이미 움직이고 있습니다" : "Your competitors are already moving", '06')}
      <div class="section-intro">${lang === "ko" ? "아래 병원들은 AI 검색에서 귀 병원보다 높은 가시성을 확보하고 있거나, 빠르게 추격하고 있습니다." : "These hospitals are gaining or rapidly closing in on AI visibility."}</div>
      ${highVisCount > 0 ? `<div class="callout callout-warn" style="margin-bottom:12px;">
        <div class="callout-icon">${statusIcon("warning")}</div>
        <div class="callout-body">
          <div class="callout-title">${lang === "ko" ? "경쟁 압력 감지" : "Competitive Pressure Detected"}</div>
          <div class="callout-text">${lang === "ko" ? `분석 대상 ${competitors.length}개 경쟁 병원 중 ${highVisCount}개가 이미 높은 AI 가시성을 확보했습니다. 이들은 AI 검색에서 귀 병원의 잠재 환자를 흡수하고 있을 수 있습니다.` : `${highVisCount} of ${competitors.length} competitors already have high AI visibility.`}</div>
        </div>
      </div>` : ""}
      ${competitors.map((c, idx) => {
        const visColor = c.estimatedVisibility === "상" ? "var(--pass)" : c.estimatedVisibility === "중" ? "var(--warn)" : "var(--fail)";
        const visCls = c.estimatedVisibility === "상" ? "badge-pass" : c.estimatedVisibility === "중" ? "badge-warn" : "badge-fail";
        const threatLabel = lang === "ko"
          ? (c.estimatedVisibility === "상" ? "현재 선두" : c.estimatedVisibility === "중" ? "빠르게 추격 중" : "동일 수준")
          : (c.estimatedVisibility === "상" ? "Leading" : c.estimatedVisibility === "중" ? "Catching up" : "Same level");
        return `<div class="card" style="border-left:3px solid ${visColor};margin-bottom:8px;padding:12px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="action-num">${idx + 1}</span>
              <span class="fs-11 fw-600 text-navy">${esc(c.name)}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="badge ${visCls}">${esc(threatLabel)}</span>
            </div>
          </div>
          <div class="fs-9 text-light" style="line-height:1.6;">${esc(stripMarkdown(c.advantage || ""))}</div>
        </div>`;
      }).join("")}
      <div class="insight-box mt-12">
        <span class="fw-600">${lang === "ko" ? "핵심 인사이트:" : "Key Insight:"}</span> ${lang === "ko" ? `경쟁사 ${highVisCount + midVisCount}개 병원이 AI 검색에서 우위를 점하고 있거나 빠르게 추격 중입니다. 지금 대응하지 않으면 경쟁 격차가 벌어집니다.` : `${highVisCount + midVisCount} competitors are leading or catching up in AI search. Act now to maintain your position.`}
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   AD SAVINGS SIMULATION PAGE (#2 광고비 절감)
   ═══════════════════════════════════════════════ */

export function buildAdSavingsPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  // Skip if no traffic data (ad savings need traffic numbers)
  if (!rd.trafficInsight) return "";
  const traffic = rd.trafficInsight;
  const monthlyVisits = traffic?.monthlyVisits ?? 0;
  const organicShare = traffic?.organicSearchShare ?? 0;
  const missedMonthly = rd.missedPatients?.estimatedMonthly ?? 0;

  // Estimate ad cost savings
  const estimatedAdCpc = lang === "ko" ? 3500 : 2.5; // KRW or USD per click
  const currencySymbol = lang === "ko" ? "" : "$";
  const currencyUnit = lang === "ko" ? "원" : "";

  // If organic improves by 30%, how many clicks saved from paid?
  const currentOrganic = Math.round(monthlyVisits * (organicShare / 100));
  const improvedOrganic = Math.round(currentOrganic * 1.3);
  const savedClicks = improvedOrganic - currentOrganic;
  const monthlySavings = savedClicks * estimatedAdCpc;
  const annualSavings = monthlySavings * 12;

  const fmtNum = (n: number) => n.toLocaleString(lang === "ko" ? "ko-KR" : "en-US");

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "광고비 절감 시뮬레이션" : "Ad Spend Optimization")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "광고비 절감 시뮬레이션" : "Ad Spend Optimization",
        lang === "ko" ? "AI 가시성 개선으로 절감 가능한 광고비를 시뮬레이션합니다" : "Simulating potential ad savings through AI visibility improvement",
        '09'
      )}
      <div class="section-intro">${lang === "ko"
        ? "AI 검색 최적화를 통해 오가닉 유입이 증가하면, 기존 유료 광고 의존도를 줄이면서도 동일한 환자 유입을 유지할 수 있습니다."
        : "By improving organic traffic through AI optimization, you can reduce paid ad dependency while maintaining patient acquisition."
      }</div>

      <div class="grid-3 gap-8 mb-16">
        <div class="metric-box" style="border-top:3px solid var(--navy-600);">
          <div class="label">${lang === "ko" ? "현재 월 방문자" : "Monthly Visits"}</div>
          <div class="value">${fmtNum(monthlyVisits)}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--teal-500);">
          <div class="label">${lang === "ko" ? "오가닉 비율" : "Organic Share"}</div>
          <div class="value">${organicShare}%</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--warn);">
          <div class="label">${lang === "ko" ? "예상 미유입 잠재 환자" : "Est. Missed Website Visitors"}</div>
          <div class="value">${fmtNum(missedMonthly)}</div>
        </div>
      </div>

      <div class="sub-title">${lang === "ko" ? "오가닉 유입 30% 개선 시 절감 효과" : "Savings with 30% Organic Improvement"}</div>
      <div class="card" style="padding:20px 24px;border-left:4px solid var(--teal-500);margin-bottom:12px;">
        <div class="grid-2 gap-16">
          <div>
            <div class="fs-9 text-light mb-4">${lang === "ko" ? "현재 오가닉 유입" : "Current Organic"}</div>
            <div class="fs-14 fw-700 text-navy">${fmtNum(currentOrganic)} ${lang === "ko" ? "방문/월" : "visits/mo"}</div>
            <div style="margin-top:8px;">
              <div class="fs-9 text-light mb-4">${lang === "ko" ? "개선 후 오가닉 유입" : "After Improvement"}</div>
              <div class="fs-14 fw-700" style="color:var(--teal-500);">${fmtNum(improvedOrganic)} ${lang === "ko" ? "방문/월" : "visits/mo"}</div>
            </div>
          </div>
          <div>
            <div class="fs-9 text-light mb-4">${lang === "ko" ? "절감 가능 클릭 수" : "Saved Clicks"}</div>
            <div class="fs-14 fw-700" style="color:var(--pass);">+${fmtNum(savedClicks)} ${lang === "ko" ? "클릭/월" : "clicks/mo"}</div>
            <div style="margin-top:8px;">
              <div class="fs-9 text-light mb-4">${lang === "ko" ? "CPC 기준 절감액" : "CPC-based Savings"}</div>
              <div class="fs-14 fw-700" style="color:var(--pass);">${currencySymbol}${fmtNum(monthlySavings)}${currencyUnit}${lang === "ko" ? "/월" : "/mo"}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="highlight-card" style="background:linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);color:white;border-radius:12px;padding:20px 24px;text-align:center;">
        <div style="font-size:10px;color:var(--gray-400);margin-bottom:6px;">${lang === "ko" ? "연간 절감 가능 광고비 (추정)" : "Estimated Annual Ad Savings"}</div>
        <div style="font-size:28px;font-weight:700;color:var(--teal-400);">${currencySymbol}${fmtNum(annualSavings)}${currencyUnit}</div>
        <div style="font-size:9px;color:var(--gray-400);margin-top:6px;">${lang === "ko" ? "* 네이버 파워링크 평균 CPC 3,500원 기준 시뮬레이션" : "* Based on average CPC estimation"}</div>
      </div>

      <div class="callout callout-info mt-12">
        <div class="callout-icon">${statusIcon("pass")}</div>
        <div class="callout-body">
          <div class="callout-title">${lang === "ko" ? "핵심 포인트" : "Key Point"}</div>
          <div class="callout-text">${lang === "ko"
            ? "AI 가시성 개선은 단순히 새로운 환자를 유치하는 것이 아닙니다. 기존 광고비를 절감하면서도 동일한 환자 유입을 유지할 수 있는 '비용 효율화' 전략입니다."
            : "AI visibility improvement is not just about acquiring new patients—it's a cost optimization strategy."
          }</div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   MARKET INTELLIGENCE PAGE (#5 벤치마크 + #7 미래 트렌드 + #9 사회적 증거)
   ═══════════════════════════════════════════════ */

export function buildMarketIntelligencePage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  score: number, grade: string, categories: SeoAuditResult["categories"],
  lang: Lang, pageNum: number, totalPages: number
): string {
  // Industry benchmark data (based on aggregated analysis)
  const benchmarks: Record<string, number> = {
    "기술적 SEO": 62, "콘텐츠 품질": 48, "AI 최적화": 35,
    "사용자 경험": 55, "권위/신뢰": 45, "로컬 SEO": 52,
    "Technical SEO": 62, "Content Quality": 48, "AI Optimization": 35,
    "User Experience": 55, "Authority": 45, "Local SEO": 52,
  };

  const catRows = categories.map(c => {
    const catLabel = catName(c.name, lang);
    const benchmark = benchmarks[c.name] ?? benchmarks[catLabel] ?? 50;
    const achievement = c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0;
    const diff = achievement - benchmark;
    const diffColor = diff > 0 ? "var(--pass)" : diff < -10 ? "var(--fail)" : "var(--warn)";
    const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
    return `<tr>
      <td class="fw-500">${esc(catLabel)}</td>
      <td style="text-align:center;">${achievement}%</td>
      <td style="text-align:center;">${benchmark}%</td>
      <td style="text-align:center;color:${diffColor};font-weight:600;">${diffLabel}%</td>
      <td style="width:100px;">${progressBarHtml(achievement / 100, diff >= 0 ? "var(--pass)" : "var(--fail)", 6)}</td>
    </tr>`;
  }).join("");

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "시장 인텔리전스" : "Market Intelligence")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "업계 벤치마크 비교" : "Industry Benchmark Comparison",
        lang === "ko" ? "동종 업계 평균 대비 귀 병원의 포지션" : "Your position vs. industry average",
        '09'
      )}
      <div class="section-intro">${lang === "ko"
        ? "강남권 의료기관 200개 이상의 분석 데이터를 기반으로, 귀 병원의 각 영역별 포지션을 업계 평균과 비교합니다."
        : "Comparing your hospital's position against industry averages based on 200+ medical institution analyses."
      }</div>

      <table class="data-table">
        <thead><tr>
          <th>${lang === "ko" ? "영역" : "Category"}</th>
          <th style="text-align:center;">${lang === "ko" ? "귀 병원" : "Your Score"}</th>
          <th style="text-align:center;">${lang === "ko" ? "업계 평균" : "Industry Avg"}</th>
          <th style="text-align:center;">${lang === "ko" ? "차이" : "Gap"}</th>
          <th>${lang === "ko" ? "포지션" : "Position"}</th>
        </tr></thead>
        <tbody>${catRows}</tbody>
      </table>

      <div class="sub-title mt-16">${lang === "ko" ? "AI 검색 시장 트렌드 전망" : "AI Search Market Trends"}</div>
      <div class="grid-2 gap-8">
        <div class="card" style="border-top:3px solid var(--fail);padding:14px 16px;">
          <div class="fs-10 fw-600 text-fail mb-6">${lang === "ko" ? "2026 하반기 예측" : "2026 H2 Forecast"}</div>
          <div class="fs-9 text-light" style="line-height:1.6;">${lang === "ko"
            ? "AI 검색 답변 비율이 60%를 넘어설 것으로 예상됩니다. 기존 포털 광고만으로는 환자 유입이 30~40% 감소할 수 있습니다."
            : "AI search answers expected to exceed 60%. Portal-only strategies may see 30-40% patient decline."
          }</div>
        </div>
        <div class="card" style="border-top:3px solid var(--teal-500);padding:14px 16px;">
          <div class="fs-10 fw-600" style="color:var(--teal-500);margin-bottom:6px;">${lang === "ko" ? "선점 기회 윈도우" : "First-Mover Window"}</div>
          <div class="fs-9 text-light" style="line-height:1.6;">${lang === "ko"
            ? "현재 의료 분야 AI 최적화 도입률은 약 15%입니다. 지금 시작하면 6개월 내 상위 포지션을 확보할 수 있는 골든타임입니다."
            : "Only ~15% of medical institutions have adopted AI optimization. Starting now gives you a 6-month first-mover advantage."
          }</div>
        </div>
      </div>

      <div class="callout callout-warn mt-12">
        <div class="callout-icon">${statusIcon("warning")}</div>
        <div class="callout-body">
          <div class="callout-title">${lang === "ko" ? "업계 동향" : "Industry Trend"}</div>
          <div class="callout-text">${lang === "ko"
            ? "강남 상위 20개 성형외과 중 60% 이상이 이미 AI 가시성 최적화를 진행 중입니다. 이 추세는 2026년 하반기에 더욱 가속화될 것으로 예상됩니다."
            : "Over 60% of top 20 clinics in the area are already optimizing for AI visibility. This trend will accelerate in 2026 H2."
          }</div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   BRAND DEFENSE + PERSONAL BRANDING PAGE (#4 + #8)
   ═══════════════════════════════════════════════ */

export function buildBrandDefensePage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  hospitalName: string, lang: Lang, pageNum: number, totalPages: number
): string {
  const cross = rd.crossChannelTrust;
  const aiSim = rd.aiSimulator;
  const channels = cross?.channels || [];
  const activeCount = channels.filter(c => c.status === "활성").length;
  const totalChannels = channels.length;
  const consistency = cross?.overallConsistency ?? 0;

  const mentionRate = aiSim?.mentionRate ?? "0%";
  const aiResults = aiSim?.results || [];
  const mentionedCount = aiResults.filter(r => r.mentioned).length;

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "브랜드 방어 & 퍼스널 브랜딩" : "Brand Defense & Personal Branding")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "브랜드 방어 진단" : "Brand Defense Assessment",
        lang === "ko" ? "AI가 귀 병원을 어떻게 인식하고 있는지 분석합니다" : "How AI perceives your hospital brand",
        '07'
      )}
      <div class="section-intro">${lang === "ko"
        ? "AI는 여러 채널의 정보를 교차 검증하여 병원의 신뢰도를 판단합니다. 일관된 브랜드 메시지가 없으면, 경쟁사에게 귀 병원의 브랜드 포지션을 빼앗길 수 있습니다."
        : "AI cross-validates information across channels. Without consistent branding, competitors can erode your brand position."
      }</div>

      <div class="grid-3 gap-8 mb-16">
        <div class="metric-box" style="border-top:3px solid ${consistency >= 70 ? 'var(--pass)' : consistency >= 40 ? 'var(--warn)' : 'var(--fail)'};">
          <div class="label">${lang === "ko" ? "브랜드 일관성" : "Brand Consistency"}</div>
          <div class="value" style="color:${consistency >= 70 ? 'var(--pass)' : consistency >= 40 ? 'var(--warn)' : 'var(--fail)'};">${consistency}%</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--teal-500);">
          <div class="label">${lang === "ko" ? "활성 채널" : "Active Channels"}</div>
          <div class="value">${activeCount}<span class="fs-9 text-muted">/${totalChannels}</span></div>
        </div>
        <div class="metric-box" style="border-top:3px solid ${mentionedCount > 0 ? 'var(--pass)' : 'var(--fail)'};">
          <div class="label">${lang === "ko" ? "AI 언급률" : "AI Mention Rate"}</div>
          <div class="value">${esc(mentionRate)}</div>
        </div>
      </div>

      ${channels.length > 0 ? `
      <div class="sub-title">${lang === "ko" ? "채널별 브랜드 방어 현황" : "Channel Brand Defense Status"}</div>
      <div class="grid-2 gap-8 mb-12">
        ${channels.map(ch => {
          const stColor = ch.status === "활성" ? "var(--pass)" : ch.status === "미흡" ? "var(--warn)" : "var(--fail)";
          const stCls = ch.status === "활성" ? "badge-pass" : ch.status === "미흡" ? "badge-warn" : "badge-fail";
          return `<div class="card" style="border-left:3px solid ${stColor};padding:10px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span class="fs-10 fw-600 text-navy">${esc(ch.name)}</span>
              <span class="badge ${stCls}">${esc(ch.status)}</span>
            </div>
            <div class="fs-9 text-light" style="line-height:1.5;">${esc(stripMarkdown(ch.detail))}</div>
            <div style="margin-top:6px;">${progressBarHtml(ch.consistencyScore / 100, stColor, 4)}</div>
          </div>`;
        }).join("")}
      </div>` : ""}

      <div class="sub-title mt-16">${lang === "ko" ? "원장님 퍼스널 브랜딩 가이드" : "Personal Branding Guide"}</div>
      <div class="card" style="background:var(--gray-50);border:1px solid var(--gray-200);padding:14px 16px;">
        <div class="fs-10 fw-600 text-navy mb-8">${lang === "ko" ? "AI 시대, 원장님의 이름이 곧 병원의 브랜드입니다" : "In the AI era, your name IS your hospital's brand"}</div>
        <div class="grid-2 gap-8">
          <div>
            <div class="fs-9 fw-500 mb-4" style="color:var(--teal-500);">${lang === "ko" ? "추천 전략" : "Recommended"}</div>
            <ul style="margin:0;padding-left:16px;">
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "원장님 이름으로 전문 칼럼/인터뷰 발행" : "Publish expert columns under your name"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "학술 논문·학회 발표 내용을 웹에 구조화" : "Structure academic publications on web"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "유튜브/SNS에서 전문성 기반 콘텐츠 발행" : "Create expertise-based content on YouTube/SNS"}</li>
            </ul>
          </div>
          <div>
            <div class="fs-9 fw-500 mb-4" style="color:var(--fail);">${lang === "ko" ? "주의 사항" : "Caution"}</div>
            <ul style="margin:0;padding-left:16px;">
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "AI는 '원장 이름 + 전문 분야'로 검증함" : "AI verifies 'doctor name + specialty'"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "온라인에 원장 정보가 없으면 AI가 추천 불가" : "No online presence = no AI recommendation"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "경쟁사 원장이 먼저 포지셔닝하면 역전 어려움" : "If competitors position first, reversal is difficult"}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="insight-box mt-12">
        <span class="fw-600">${lang === "ko" ? "핵심 인사이트:" : "Key Insight:"}</span> ${lang === "ko"
          ? `현재 ${hospitalName}의 브랜드 일관성은 ${consistency}%입니다. ${consistency < 60 ? "경쟁사가 귀 병원의 브랜드 포지션을 잠식할 위험이 있습니다." : "양호한 수준이나, AI 시대에는 더 높은 일관성이 필요합니다."}`
          : `Current brand consistency is ${consistency}%. ${consistency < 60 ? "Competitors may erode your brand position." : "Good level, but AI era demands higher consistency."}`
        }
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}


/* ═══════════════════════════════════════════════
   ▼▼▼ 1.5x 확장 — 신규 섹션 빌더 ▼▼▼
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   PATIENT JOURNEY MAP PAGE (환자 여정 분석)
   ═══════════════════════════════════════════════ */

export function buildPatientJourneyPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  hospitalName: string, lang: Lang, pageNum: number, totalPages: number
): string {
  // Skip if no traffic data and no missed patients data
  if (!rd.trafficInsight && !rd.missedPatients) return "";
  const traffic = rd.trafficInsight;
  const monthlyVisits = traffic?.monthlyVisits ?? 0;
  const bounceRate = traffic?.bounceRate ?? 0;
  const organicShare = traffic?.organicSearchShare ?? 0;
  const directShare = traffic?.directShare ?? 0;
  const missedMonthly = rd.missedPatients?.estimatedMonthly ?? 0;
  const aiReadiness = rd.metrics?.aiReadiness ?? 0;

  // Journey stages with estimated conversion
  const stages = [
    {
      name: lang === "ko" ? "인지 단계" : "Awareness",
      desc: lang === "ko" ? "환자가 증상/니즈를 인식하고 정보를 검색" : "Patient recognizes symptoms and searches for information",
      icon: "🔍",
      metric: lang === "ko" ? `월 ${monthlyVisits.toLocaleString()}명 도달` : `${monthlyVisits.toLocaleString()} monthly reach`,
      status: monthlyVisits > 1000 ? "pass" : monthlyVisits > 300 ? "warning" : "fail",
    },
    {
      name: lang === "ko" ? "탐색 단계" : "Consideration",
      desc: lang === "ko" ? "여러 병원을 비교하고 AI에게 추천을 요청" : "Comparing hospitals and asking AI for recommendations",
      icon: "🤖",
      metric: lang === "ko" ? `AI 준비도 ${aiReadiness}%` : `AI Readiness ${aiReadiness}%`,
      status: aiReadiness >= 60 ? "pass" : aiReadiness >= 30 ? "warning" : "fail",
    },
    {
      name: lang === "ko" ? "결정 단계" : "Decision",
      desc: lang === "ko" ? "리뷰/후기를 확인하고 예약 결정" : "Checking reviews and deciding to book",
      icon: "✅",
      metric: lang === "ko" ? `이탈률 ${bounceRate}%` : `Bounce Rate ${bounceRate}%`,
      status: bounceRate < 50 ? "pass" : bounceRate < 70 ? "warning" : "fail",
    },
    {
      name: lang === "ko" ? "전환 단계" : "Conversion",
      desc: lang === "ko" ? "실제 예약/방문으로 전환" : "Converting to actual appointment/visit",
      icon: "📞",
      metric: lang === "ko" ? `월 ${missedMonthly}명 이탈 추정` : `Est. ${missedMonthly} lost/mo`,
      status: missedMonthly < 10 ? "pass" : missedMonthly < 50 ? "warning" : "fail",
    },
  ];

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "환자 여정 분석" : "Patient Journey Analysis")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "환자 여정 분석" : "Patient Journey Analysis",
        lang === "ko" ? "환자가 귀 병원을 발견하고 방문하기까지의 여정을 분석합니다" : "Analyzing the patient journey from discovery to visit",
        '05'
      )}
      <div class="section-intro">${lang === "ko"
        ? `${hospitalName}을(를) 찾는 환자의 디지털 여정을 4단계로 분석합니다. 각 단계에서 이탈이 발생하는 지점을 파악하고, AI 검색 시대에 맞는 최적화 방안을 제시합니다.`
        : `Analyzing the digital journey of patients finding ${hospitalName} in 4 stages. Identifying drop-off points and AI-era optimization strategies.`
      }</div>

      <!-- Journey Flow -->
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        ${stages.map((s, idx) => {
          const stColor = s.status === "pass" ? "var(--pass)" : s.status === "warning" ? "var(--warn)" : "var(--fail)";
          const stBg = s.status === "pass" ? "var(--pass-bg)" : s.status === "warning" ? "var(--warn-bg)" : "var(--fail-bg)";
          return `<div style="flex:1;position:relative;">
            <div class="card" style="border-top:3px solid ${stColor};padding:14px 12px;min-height:140px;background:${stBg};">
              <div style="font-size:20px;margin-bottom:6px;">${s.icon}</div>
              <div class="fs-10 fw-600 text-navy mb-4">${esc(s.name)}</div>
              <div class="fs-9 text-light" style="line-height:1.5;margin-bottom:8px;">${esc(s.desc)}</div>
              <div class="fs-9 fw-600" style="color:${stColor};">${esc(s.metric)}</div>
            </div>
            ${idx < stages.length - 1 ? `<div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--gray-400);z-index:1;">→</div>` : ""}
          </div>`;
        }).join("")}
      </div>

      <!-- Traffic Source Breakdown -->
      <div class="sub-title">${lang === "ko" ? "유입 경로 분석" : "Traffic Source Analysis"}</div>
      <div class="grid-2 gap-8 mb-16">
        <div class="card" style="padding:14px 16px;">
          <div class="fs-10 fw-600 text-navy mb-8">${lang === "ko" ? "현재 유입 구성" : "Current Traffic Mix"}</div>
          ${[
            { label: lang === "ko" ? "오가닉 검색" : "Organic Search", value: organicShare, color: "var(--teal-500)" },
            { label: lang === "ko" ? "직접 방문" : "Direct", value: directShare, color: "var(--blue-500)" },
            { label: lang === "ko" ? "기타 (광고/SNS)" : "Other (Ads/SNS)", value: Math.max(0, 100 - organicShare - directShare), color: "var(--gray-400)" },
          ].map(s => `<div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
              <span class="fs-9 text-light">${esc(s.label)}</span>
              <span class="fs-9 fw-600">${s.value}%</span>
            </div>
            ${progressBarHtml(s.value / 100, s.color, 6)}
          </div>`).join("")}
        </div>
        <div class="card" style="padding:14px 16px;">
          <div class="fs-10 fw-600 text-navy mb-8">${lang === "ko" ? "핵심 이탈 지점" : "Key Drop-off Points"}</div>
          <div style="padding:10px 12px;background:var(--fail-bg);border-radius:6px;margin-bottom:8px;">
            <div class="fs-9 fw-600 text-fail mb-4">${lang === "ko" ? "AI 검색 미노출" : "AI Search Invisible"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${lang === "ko"
              ? `AI 플랫폼에서 ${hospitalName}이(가) 추천되지 않아, AI를 통해 병원을 찾는 환자를 놓치고 있습니다.`
              : `${hospitalName} is not recommended by AI platforms, missing AI-driven patient acquisition.`
            }</div>
          </div>
          <div style="padding:10px 12px;background:var(--warn-bg);border-radius:6px;">
            <div class="fs-9 fw-600 text-warn mb-4">${lang === "ko" ? "높은 이탈률" : "High Bounce Rate"}</div>
            <div class="fs-9 text-light" style="line-height:1.5;">${lang === "ko"
              ? `이탈률 ${bounceRate}%는 방문자의 절반 이상이 첫 페이지에서 떠나고 있음을 의미합니다.`
              : `Bounce rate of ${bounceRate}% means over half of visitors leave on the first page.`
            }</div>
          </div>
        </div>
      </div>

      <div class="callout callout-info">
        <div class="callout-icon">${statusIcon("pass")}</div>
        <div class="callout-body">
          <div class="callout-title">${lang === "ko" ? "환자 여정 최적화 핵심" : "Patient Journey Optimization Key"}</div>
          <div class="callout-text">${lang === "ko"
            ? "2026년 환자의 40% 이상이 AI 검색을 통해 병원을 선택합니다. 기존 포털 광고에만 의존하면 AI 검색 단계에서 환자를 놓치게 됩니다. 인지→탐색→결정→전환 각 단계에서 AI 가시성을 확보하는 것이 핵심입니다."
            : "Over 40% of patients in 2026 choose hospitals through AI search. Relying solely on portal ads means losing patients at the AI search stage."
          }</div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   KEYWORD DEEP INSIGHT PAGE (키워드 심층 인사이트)
   ═══════════════════════════════════════════════ */

export function buildKeywordDeepInsightPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const keywords: KeywordExposure[] = rd.keywords || [];
  if (keywords.length === 0) return "";

  // Categorize keywords
  const highOpp = keywords.filter(kw => kw.ai?.likelihood === "none" || kw.ai?.likelihood === "low");
  const defended = keywords.filter(kw => kw.ai?.likelihood === "high");
  const atRisk = keywords.filter(kw => (kw.naver?.found || kw.google?.found) && kw.ai?.likelihood !== "high");

  // Top volume keywords
  const byVolume = [...keywords].sort((a, b) => (b.monthlySearchVolume ?? 0) - (a.monthlySearchVolume ?? 0));
  const totalVolume = keywords.reduce((sum, kw) => sum + (kw.monthlySearchVolume ?? 0), 0);

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "키워드 심층 인사이트" : "Keyword Deep Insights")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "키워드 심층 인사이트" : "Keyword Deep Insights",
        lang === "ko" ? "키워드별 전략적 가치와 선점 기회를 분석합니다" : "Analyzing strategic value and first-mover opportunities per keyword",
        '06'
      )}
      <div class="section-intro">${lang === "ko"
        ? "단순 노출 여부를 넘어, 각 키워드의 전략적 가치를 3가지 관점에서 분석합니다: AI 선점 기회, 포털 방어 필요성, 검색량 기반 ROI."
        : "Beyond simple exposure, analyzing each keyword's strategic value from 3 perspectives: AI opportunity, portal defense, and volume-based ROI."
      }</div>

      <!-- Keyword Strategy Matrix -->
      <div class="grid-3 gap-8 mb-16">
        <div class="metric-box" style="border-top:3px solid var(--fail);">
          <div class="label">${lang === "ko" ? "AI 선점 기회" : "AI Opportunity"}</div>
          <div class="value text-fail">${highOpp.length}</div>
          <div class="fs-9 text-muted">${lang === "ko" ? "아직 AI에 노출되지 않은 키워드" : "Not yet visible to AI"}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--pass);">
          <div class="label">${lang === "ko" ? "AI 방어 완료" : "AI Defended"}</div>
          <div class="value text-pass">${defended.length}</div>
          <div class="fs-9 text-muted">${lang === "ko" ? "AI 검색에서 높은 가시성" : "High AI visibility"}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--warn);">
          <div class="label">${lang === "ko" ? "포털만 노출" : "Portal Only"}</div>
          <div class="value text-warn">${atRisk.length}</div>
          <div class="fs-9 text-muted">${lang === "ko" ? "AI 전환 필요" : "Needs AI transition"}</div>
        </div>
      </div>

      <!-- Top Volume Keywords Detail -->
      <div class="sub-title">${lang === "ko" ? "검색량 기준 상위 키워드 전략" : "Top Volume Keyword Strategy"}</div>
      ${byVolume.slice(0, 5).map((kw, idx) => {
        const vol = kw.monthlySearchVolume ?? 0;
        const volShare = totalVolume > 0 ? Math.round((vol / totalVolume) * 100) : 0;
        const aiStatus = kw.ai?.likelihood || "none";
        const aiColor = aiStatus === "high" ? "var(--pass)" : aiStatus === "medium" ? "var(--warn)" : "var(--fail)";
        const aiLabel = aiStatus === "high" ? (lang === "ko" ? "AI 노출 중" : "AI Visible") : aiStatus === "medium" ? (lang === "ko" ? "부분 노출" : "Partial") : (lang === "ko" ? "미노출 — 선점 기회" : "Not Visible — Opportunity");
        const naverOk = kw.naver?.found;
        const googleOk = kw.google?.found;
        return `<div class="card" style="margin-bottom:8px;padding:12px 14px;border-left:3px solid ${aiColor};">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="action-num">${idx + 1}</span>
              <span class="fs-11 fw-600 text-navy">${esc(kw.keyword)}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="fs-9 text-muted">${vol.toLocaleString()}${lang === "ko" ? "회/월" : "/mo"}</span>
              <span class="badge ${aiStatus === "high" ? "badge-pass" : aiStatus === "medium" ? "badge-warn" : "badge-fail"}">${esc(aiLabel)}</span>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="flex:1;">
              <div class="fs-9 text-muted mb-4">${lang === "ko" ? "검색량 비중" : "Volume Share"}: ${volShare}%</div>
              ${progressBarHtml(volShare / 100, aiColor, 4)}
            </div>
            <div style="display:flex;gap:4px;">
              <span class="badge ${naverOk ? "badge-pass" : "badge-fail"}" style="font-size:8px;">N ${naverOk ? "✓" : "✗"}</span>
              <span class="badge ${googleOk ? "badge-pass" : "badge-fail"}" style="font-size:8px;">G ${googleOk ? "✓" : "✗"}</span>
            </div>
          </div>
          ${kw.ai?.detail ? `<div class="fs-9 text-light mt-4" style="line-height:1.5;">${esc(stripMarkdown(kw.ai.detail))}</div>` : ""}
        </div>`;
      }).join("")}

      <div class="insight-box mt-12">
        <span class="fw-600">${lang === "ko" ? "핵심 인사이트:" : "Key Insight:"}</span> ${lang === "ko"
          ? `분석된 ${keywords.length}개 키워드 중 ${highOpp.length}개가 AI 검색에서 아직 선점되지 않았습니다. 이 키워드들의 월간 총 검색량은 ${highOpp.reduce((s, k) => s + (k.monthlySearchVolume ?? 0), 0).toLocaleString()}회로, 지금 선점하면 상당한 신규 환자 유입이 가능합니다.`
          : `Of ${keywords.length} keywords analyzed, ${highOpp.length} are not yet claimed in AI search. Their combined monthly volume of ${highOpp.reduce((s, k) => s + (k.monthlySearchVolume ?? 0), 0).toLocaleString()} represents significant patient acquisition potential.`
        }
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   CONTENT STRATEGY DETAIL PAGE (콘텐츠 전략 상세)
   ═══════════════════════════════════════════════ */

export function buildContentStrategyDetailPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const cs = rd.contentStrategy;
  // Skip if contentStrategy is missing or has no meaningful content
  if (!cs || (!cs.blogStrategy && !cs.faqStrategy && !cs.comparisonTableStrategy)) return "";

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "콘텐츠 전략 상세" : "Content Strategy Detail")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "콘텐츠 전략 상세 가이드" : "Content Strategy Detailed Guide",
        lang === "ko" ? "AI가 인용하는 콘텐츠를 만드는 구체적 방법론" : "Methodology for creating AI-citable content",
        '08'
      )}
      <div class="section-intro">${lang === "ko"
        ? "AI 검색 엔진이 귀 병원의 콘텐츠를 인용하려면, 특정 구조와 형식을 갖춰야 합니다. 아래는 각 콘텐츠 유형별 구체적 실행 가이드입니다."
        : "For AI search engines to cite your content, specific structure and format are required. Below are detailed execution guides per content type."
      }</div>

      <!-- Blog Strategy Detail -->
      ${cs.blogStrategy ? `
      <div class="card" style="margin-bottom:12px;padding:16px 18px;border-top:3px solid var(--teal-500);">
        <div class="fs-11 fw-600 text-navy mb-8">${lang === "ko" ? "블로그 콘텐츠 전략" : "Blog Content Strategy"}</div>
        <div class="fs-9 text-light" style="line-height:1.7;margin-bottom:12px;">${esc(stripMarkdown(cs.blogStrategy))}</div>
        <div class="grid-2 gap-8">
          <div style="padding:10px 12px;background:var(--gray-50);border-radius:6px;">
            <div class="fs-9 fw-600 mb-4" style="color:var(--teal-500);">${lang === "ko" ? "AI 최적화 블로그 구조" : "AI-Optimized Blog Structure"}</div>
            <ul style="margin:0;padding-left:14px;">
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "제목: 환자 질문 형태 (\"~하면 어떻게 해야 하나요?\")" : "Title: Patient question format"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "첫 문단: 핵심 답변 (AI가 인용하는 부분)" : "First paragraph: Core answer (AI citation target)"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "본문: 전문의 관점의 상세 설명" : "Body: Detailed specialist perspective"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "마무리: 병원 차별점 + CTA" : "Closing: Hospital differentiator + CTA"}</li>
            </ul>
          </div>
          <div style="padding:10px 12px;background:var(--gray-50);border-radius:6px;">
            <div class="fs-9 fw-600 mb-4" style="color:var(--fail);">${lang === "ko" ? "피해야 할 패턴" : "Patterns to Avoid"}</div>
            <ul style="margin:0;padding-left:14px;">
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "광고성 문구 위주의 블로그" : "Ad-heavy blog posts"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "전후 사진만 나열하는 포스팅" : "Before/after photo-only posts"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "키워드 반복 삽입 (스패밍)" : "Keyword stuffing (spamming)"}</li>
              <li class="fs-9 text-light" style="line-height:1.8;">${lang === "ko" ? "의학적 근거 없는 주장" : "Claims without medical evidence"}</li>
            </ul>
          </div>
        </div>
      </div>` : ""}

      <!-- FAQ Strategy Detail -->
      ${cs.faqStrategy ? `
      <div class="card" style="margin-bottom:12px;padding:16px 18px;border-top:3px solid var(--blue-500);">
        <div class="fs-11 fw-600 text-navy mb-8">${lang === "ko" ? "FAQ 콘텐츠 전략" : "FAQ Content Strategy"}</div>
        <div class="fs-9 text-light" style="line-height:1.7;margin-bottom:12px;">${esc(stripMarkdown(cs.faqStrategy))}</div>
        <div style="padding:10px 12px;background:var(--gray-50);border-radius:6px;">
          <div class="fs-9 fw-600 mb-4" style="color:var(--blue-500);">${lang === "ko" ? "AI가 선호하는 FAQ 형식" : "AI-Preferred FAQ Format"}</div>
          <div class="fs-9 text-light" style="line-height:1.8;">${lang === "ko"
            ? "Q&A 형식으로 구조화하되, 각 답변의 첫 문장이 완결된 답변이 되어야 합니다. AI는 FAQ의 첫 문장을 직접 인용하는 경향이 있으므로, 병원명과 전문 분야를 자연스럽게 포함시키세요."
            : "Structure in Q&A format where each answer's first sentence is a complete response. AI tends to directly cite FAQ first sentences, so naturally include hospital name and specialty."
          }</div>
        </div>
      </div>` : ""}

      <!-- Comparison Table Strategy -->
      ${cs.comparisonTableStrategy ? `
      <div class="card" style="margin-bottom:12px;padding:16px 18px;border-top:3px solid var(--navy-600);">
        <div class="fs-11 fw-600 text-navy mb-8">${lang === "ko" ? "비교표 콘텐츠 전략" : "Comparison Table Strategy"}</div>
        <div class="fs-9 text-light" style="line-height:1.7;">${esc(stripMarkdown(cs.comparisonTableStrategy))}</div>
        <div style="margin-top:10px;padding:10px 12px;background:var(--gray-50);border-radius:6px;">
          <div class="fs-9 fw-600 mb-4" style="color:var(--navy-600);">${lang === "ko" ? "효과적인 비교표 예시 구조" : "Effective Comparison Table Structure"}</div>
          <div class="fs-9 text-light" style="line-height:1.8;">${lang === "ko"
            ? "시술 방법별 비교 (장점/단점/회복기간/비용 범위), 재료별 비교, 기술별 비교 등을 구조화된 표로 제공하면 AI가 이를 직접 인용합니다. 객관적이고 정확한 정보일수록 AI 인용 확률이 높아집니다."
            : "Provide structured tables comparing procedures (pros/cons/recovery/cost), materials, and techniques. Objective and accurate information increases AI citation probability."
          }</div>
        </div>
      </div>` : ""}

      <div class="callout callout-info mt-8">
        <div class="callout-icon">${statusIcon("pass")}</div>
        <div class="callout-body">
          <div class="callout-title">${lang === "ko" ? "콘텐츠 전략의 핵심 원칙" : "Core Content Strategy Principle"}</div>
          <div class="callout-text">${lang === "ko"
            ? "AI는 '환자에게 가장 도움이 되는 정보'를 우선 인용합니다. 광고가 아닌 교육적 콘텐츠, 전문의의 관점이 담긴 콘텐츠가 AI 시대의 최고의 마케팅입니다."
            : "AI prioritizes 'most helpful information for patients.' Educational content with specialist perspectives is the best marketing in the AI era."
          }</div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   EXECUTION ROADMAP PAGE (실행 로드맵)
   ═══════════════════════════════════════════════ */

export function buildExecutionRoadmapPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const items = rd.actionItems || [];
  // Skip if no action items at all
  if (items.length === 0) return "";
  const immediateItems = items.filter(i => i.priority === "즉시");
  const monthItems = items.filter(i => i.priority === "1개월 내");
  const quarterItems = items.filter(i => i.priority === "3개월 내");

  const weeks = [
    {
      week: lang === "ko" ? "1주차" : "Week 1",
      phase: lang === "ko" ? "긴급 대응" : "Emergency Response",
      color: "var(--fail)",
      tasks: immediateItems.slice(0, 3).map(i => i.action),
      fallback: [
        lang === "ko" ? "구조화 데이터 (Schema.org) 적용" : "Apply structured data (Schema.org)",
        lang === "ko" ? "메타 태그 최적화" : "Optimize meta tags",
        lang === "ko" ? "핵심 페이지 콘텐츠 보강" : "Strengthen core page content",
      ],
    },
    {
      week: lang === "ko" ? "2~3주차" : "Week 2-3",
      phase: lang === "ko" ? "기반 구축" : "Foundation Building",
      color: "var(--warn)",
      tasks: monthItems.slice(0, 3).map(i => i.action),
      fallback: [
        lang === "ko" ? "AI 최적화 블로그 콘텐츠 발행 시작" : "Start publishing AI-optimized blog content",
        lang === "ko" ? "FAQ 페이지 구조화 및 확장" : "Structure and expand FAQ page",
        lang === "ko" ? "리뷰 관리 시스템 구축" : "Build review management system",
      ],
    },
    {
      week: lang === "ko" ? "4~6주차" : "Week 4-6",
      phase: lang === "ko" ? "콘텐츠 확장" : "Content Expansion",
      color: "var(--teal-500)",
      tasks: monthItems.slice(3, 6).map(i => i.action),
      fallback: [
        lang === "ko" ? "비교표/전문 칼럼 콘텐츠 발행" : "Publish comparison tables and expert columns",
        lang === "ko" ? "SNS 채널 연동 및 일관성 확보" : "Integrate SNS channels for consistency",
        lang === "ko" ? "원장님 퍼스널 브랜딩 콘텐츠 시작" : "Start personal branding content",
      ],
    },
    {
      week: lang === "ko" ? "7~12주차" : "Week 7-12",
      phase: lang === "ko" ? "성과 최적화" : "Performance Optimization",
      color: "var(--pass)",
      tasks: quarterItems.slice(0, 3).map(i => i.action),
      fallback: [
        lang === "ko" ? "AI 플랫폼별 모니터링 및 전략 조정" : "Monitor AI platforms and adjust strategy",
        lang === "ko" ? "고성과 콘텐츠 식별 및 확대" : "Identify and scale high-performing content",
        lang === "ko" ? "경쟁사 대비 포지션 재분석" : "Re-analyze position vs competitors",
      ],
    },
  ];

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "12주 실행 로드맵" : "12-Week Execution Roadmap")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "12주 실행 로드맵" : "12-Week Execution Roadmap",
        lang === "ko" ? "AI 가시성 확보를 위한 단계별 실행 계획" : "Step-by-step execution plan for AI visibility",
        '08'
      )}
      <div class="section-intro">${lang === "ko"
        ? "본 보고서의 분석 결과를 바탕으로, 12주 동안 실행할 구체적인 로드맵을 제시합니다. 각 주차별 핵심 과제와 기대 효과를 확인하세요."
        : "Based on this report's analysis, here is a concrete 12-week roadmap. Review key tasks and expected outcomes for each phase."
      }</div>

      <!-- Timeline -->
      ${weeks.map((w, idx) => {
        const tasks = w.tasks.length > 0 ? w.tasks : w.fallback;
        return `<div style="display:flex;gap:16px;margin-bottom:${idx < weeks.length - 1 ? "4px" : "0"};">
          <!-- Timeline bar -->
          <div style="display:flex;flex-direction:column;align-items:center;width:24px;flex-shrink:0;">
            <div style="width:12px;height:12px;border-radius:50%;background:${w.color};border:2px solid white;box-shadow:0 0 0 2px ${w.color};"></div>
            ${idx < weeks.length - 1 ? `<div style="width:2px;flex:1;background:linear-gradient(${w.color}, ${weeks[idx + 1].color});min-height:60px;"></div>` : ""}
          </div>
          <!-- Content -->
          <div class="card" style="flex:1;border-left:3px solid ${w.color};padding:14px 16px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div>
                <span class="fs-11 fw-700 text-navy">${esc(w.week)}</span>
                <span class="fs-9 text-muted" style="margin-left:8px;">${esc(w.phase)}</span>
              </div>
              <span class="badge" style="background:${w.color};color:white;font-size:8px;padding:2px 8px;border-radius:10px;">${tasks.length} ${lang === "ko" ? "과제" : "tasks"}</span>
            </div>
            <ul style="margin:0;padding-left:16px;">
              ${tasks.map(task => `<li class="fs-9 text-light" style="line-height:1.8;margin-bottom:2px;">${esc(stripMarkdown(task))}</li>`).join("")}
            </ul>
          </div>
        </div>`;
      }).join("")}

      <div style="background:var(--gray-1);border-radius:8px;padding:16px 20px;text-align:center;margin-top:16px;border:1px solid var(--gray-2);">
        <div style="font-size:11px;font-weight:600;color:var(--primary);margin-bottom:10px;">${lang === "ko" ? "12주 후 기대 효과" : "Expected Results After 12 Weeks"}</div>
        <div class="grid-3 gap-12">
          <div style="padding:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--pass);">+40%</div>
            <div style="font-size:9px;color:var(--gray-3);margin-top:2px;">${lang === "ko" ? "AI 가시성 향상" : "AI Visibility"}</div>
          </div>
          <div style="padding:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--accent);">+25%</div>
            <div style="font-size:9px;color:var(--gray-3);margin-top:2px;">${lang === "ko" ? "오가닉 유입 증가" : "Organic Traffic"}</div>
          </div>
          <div style="padding:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--fail);">-30%</div>
            <div style="font-size:9px;color:var(--gray-3);margin-top:2px;">${lang === "ko" ? "광고비 절감" : "Ad Spend Reduction"}</div>
          </div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   TRAFFIC DEEP ANALYSIS PAGE (트래픽 심층 분석)
   ═══════════════════════════════════════════════ */

export function buildTrafficDeepAnalysisPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  hospitalName: string, lang: Lang, pageNum: number, totalPages: number
): string {
  const traffic = rd.trafficInsight;
  if (!traffic) return "";

  const monthlyVisits = traffic.monthlyVisits ?? 0;
  const globalRank = traffic.globalRank ?? 0;
  const bounceRate = traffic.bounceRate ?? 0;
  const organicShare = traffic.organicSearchShare ?? 0;
  const directShare = traffic.directShare ?? 0;
  const otherShare = Math.max(0, 100 - organicShare - directShare);
  const topCountries = traffic.topCountries || [];

  const missed = rd.missedPatients;
  const missedMonthly = missed?.estimatedMonthly ?? 0;
  const revenueImpact = missed?.revenueImpact || "";
  const reasoning = missed?.reasoning || "";

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "트래픽 심층 분석" : "Traffic Deep Analysis")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "트래픽 심층 분석" : "Traffic Deep Analysis",
        lang === "ko" ? "웹사이트 방문자 데이터 기반 심층 인사이트" : "Deep insights based on website visitor data",
        '05'
      )}
      <div class="section-intro">${lang === "ko"
        ? `${hospitalName}의 웹사이트 트래픽 데이터를 SimilarWeb 기반으로 분석합니다. 방문자 행동 패턴과 미유입 잠재 환자 추정치를 통해 개선 기회를 식별합니다.`
        : `Analyzing ${hospitalName}'s website traffic data via SimilarWeb. Identifying improvement opportunities through visitor behavior patterns and estimated patient loss.`
      }</div>

      <div class="grid-2 gap-8 mb-16">
        <!-- Left: Core Metrics -->
        <div>
          <div class="sub-title">${lang === "ko" ? "핵심 트래픽 지표" : "Core Traffic Metrics"}</div>
          <div class="card" style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-200);margin-bottom:10px;">
              <span class="fs-10 text-light">${lang === "ko" ? "월간 방문자" : "Monthly Visits"}</span>
              <span class="fs-14 fw-700 text-navy">${monthlyVisits.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-200);margin-bottom:10px;">
              <span class="fs-10 text-light">${lang === "ko" ? "글로벌 랭킹" : "Global Rank"}</span>
              <span class="fs-14 fw-700 text-navy">${globalRank > 0 ? `#${globalRank.toLocaleString()}` : "-"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--gray-200);margin-bottom:10px;">
              <span class="fs-10 text-light">${lang === "ko" ? "이탈률" : "Bounce Rate"}</span>
              <span class="fs-14 fw-700" style="color:${bounceRate < 50 ? "var(--pass)" : bounceRate < 70 ? "var(--warn)" : "var(--fail)"};">${bounceRate}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="fs-10 text-light">${lang === "ko" ? "오가닉 검색 비율" : "Organic Search Share"}</span>
              <span class="fs-14 fw-700" style="color:${organicShare >= 40 ? "var(--pass)" : organicShare >= 20 ? "var(--warn)" : "var(--fail)"};">${organicShare}%</span>
            </div>
          </div>
        </div>

        <!-- Right: Traffic Sources -->
        <div>
          <div class="sub-title">${lang === "ko" ? "유입 경로 비중" : "Traffic Source Distribution"}</div>
          <div class="card" style="padding:16px;">
            ${[
              { label: lang === "ko" ? "오가닉 검색" : "Organic Search", value: organicShare, color: "var(--teal-500)" },
              { label: lang === "ko" ? "직접 방문" : "Direct", value: directShare, color: "var(--blue-500)" },
              { label: lang === "ko" ? "기타 (광고/SNS/레퍼럴)" : "Other", value: otherShare, color: "var(--gray-400)" },
            ].map(s => `<div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span class="fs-9 text-light">${esc(s.label)}</span>
                <span class="fs-9 fw-600">${s.value}%</span>
              </div>
              ${progressBarHtml(s.value / 100, s.color, 8)}
            </div>`).join("")}
            ${topCountries.length > 0 ? `
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--gray-200);">
              <div class="fs-9 fw-500 mb-4">${lang === "ko" ? "주요 방문 국가" : "Top Countries"}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${topCountries.slice(0, 4).map(c => `<span class="stat-pill">${esc(c.country)} ${c.share}%</span>`).join("")}
              </div>
            </div>` : ""}
          </div>
        </div>
      </div>

      <!-- Missed Patients Analysis -->
      ${missed ? `
      <div class="sub-title">${lang === "ko" ? "미유입 잠재 환자 분석" : "Missed Website Visitor Analysis"}</div>
      <div class="card" style="border-left:4px solid var(--fail);padding:16px 18px;">
        <div class="grid-2 gap-16">
          <div>
            <div class="fs-9 text-muted mb-4">${lang === "ko" ? "예상 월간 미유입 잠재 환자" : "Est. Monthly Missed Website Visitors"}</div>
            <div class="fs-20 fw-700 text-fail">${missedMonthly.toLocaleString()}${lang === "ko" ? "명" : ""}</div>
            ${revenueImpact ? `<div class="fs-10 fw-600 mt-4" style="color:var(--fail);">${esc(revenueImpact)}</div>` : ""}
          </div>
          <div>
            <div class="fs-9 text-muted mb-4">${lang === "ko" ? "누락 원인 분석" : "Drop-off Cause Analysis"}</div>
            <div class="fs-9 text-light" style="line-height:1.7;">${esc(stripMarkdown(reasoning))}</div>
          </div>
        </div>
      </div>` : ""}

      <div class="insight-box mt-12">
        <span class="fw-600">${lang === "ko" ? "핵심 인사이트:" : "Key Insight:"}</span> ${lang === "ko"
          ? `현재 오가닉 검색 비율 ${organicShare}%는 ${organicShare >= 40 ? "양호한 수준이지만, AI 검색 최적화를 통해 추가 성장이 가능합니다." : organicShare >= 20 ? "개선 여지가 큽니다. AI 가시성 확보로 오가닉 유입을 2배 이상 늘릴 수 있습니다." : "매우 낮은 수준입니다. 광고 의존도가 높아 비용 효율이 떨어지고 있습니다."}`
          : `Current organic share of ${organicShare}% ${organicShare >= 40 ? "is good but can grow further with AI optimization." : organicShare >= 20 ? "has significant room for improvement." : "is very low, indicating high ad dependency."}`
        }
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   CRITICAL/WARNING ITEMS DETAIL PAGE (실패/주의 항목 상세)
   ═══════════════════════════════════════════════ */

export function buildCriticalItemsDetailPage(
  t: Record<string, string>, url: string, categories: { name: string; items: { name: string; status: string; score: number; maxScore: number; detail?: string; recommendation?: string }[] }[],
  lang: Lang, pageNum: number, totalPages: number
): string {
  const failItems = categories.flatMap(c =>
    c.items.filter(it => it.status === "fail").map(it => ({ ...it, catName: catName(c.name, lang) }))
  );
  const warnItems = categories.flatMap(c =>
    c.items.filter(it => it.status === "warning").map(it => ({ ...it, catName: catName(c.name, lang) }))
  );

  if (failItems.length === 0 && warnItems.length === 0) return "";

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "핵심 개선 항목 상세" : "Critical Improvement Items")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "핵심 개선 항목 상세 분석" : "Critical Improvement Items Detail",
        lang === "ko" ? "즉시 대응이 필요한 항목들의 상세 분석과 개선 방안" : "Detailed analysis and improvement plans for items requiring immediate attention",
        '07'
      )}
      <div class="section-intro">${lang === "ko"
        ? `총 ${failItems.length + warnItems.length}개의 개선 필요 항목이 발견되었습니다. 실패 ${failItems.length}개, 주의 ${warnItems.length}개 항목에 대한 구체적인 개선 방안을 제시합니다.`
        : `${failItems.length + warnItems.length} items need improvement. Providing specific improvement plans for ${failItems.length} failed and ${warnItems.length} warning items.`
      }</div>

      ${failItems.length > 0 ? `
      <div style="background:var(--fail-bg);border-left:4px solid var(--fail);padding:10px 16px;border-radius:0 6px 6px 0;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:600;color:var(--fail);">${lang === "ko" ? `즉시 개선 필요 ${failItems.length}개 항목 — AI 플랫폼 추천 차단의 직접 원인` : `${failItems.length} Critical Items — Direct cause of AI platform recommendation blocking`}</span>
      </div>
      ${failItems.map((it, idx) => `<div style="border-left:3px solid var(--fail);padding:8px 14px;margin-bottom:2px;border-bottom:0.5px solid var(--gray-2);page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--primary);color:white;font-size:9px;font-weight:700;flex-shrink:0;">${idx + 1}</span>
          <span class="badge badge-fail" style="flex-shrink:0;">${lang === 'ko' ? '실패' : 'Fail'}</span>
          <span style="font-size:11px;font-weight:600;color:var(--text);">${esc(it.name)}</span>
          <span style="margin-left:auto;font-size:9px;color:var(--gray-3);flex-shrink:0;">${esc(it.catName)}</span>
        </div>
        ${it.detail ? `<div style="display:flex;gap:8px;margin-bottom:3px;"><span style="font-size:9px;font-weight:600;color:var(--fail);flex-shrink:0;width:32px;">${lang === 'ko' ? '현황' : 'Now'}</span><span style="font-size:9px;color:var(--gray-3);line-height:1.6;">${esc(stripMarkdown(it.detail))}</span></div>` : ''}
        ${it.recommendation ? `<div style="display:flex;gap:8px;"><span style="font-size:9px;font-weight:600;color:var(--accent);flex-shrink:0;width:32px;">${lang === 'ko' ? '조치' : 'Fix'}</span><span style="font-size:9px;color:var(--text);line-height:1.6;">${esc(stripMarkdown(it.recommendation))}</span></div>` : ''}
      </div>`).join('')}` : ''}

      ${warnItems.length > 0 ? `
      <div style="background:var(--highlight);border-left:4px solid var(--accent);padding:10px 16px;border-radius:0 6px 6px 0;margin-bottom:12px;margin-top:16px;">
        <span style="font-size:11px;font-weight:600;color:var(--accent);">${lang === "ko" ? `주의 필요 ${warnItems.length}개 — 경쟁 병원이 먼저 개선하면 격차가 발생합니다` : `${warnItems.length} Warning Items — Competitors improving first will widen the gap`}</span>
      </div>
      ${warnItems.map((it, idx) => `<div style="border-left:3px solid var(--warn);padding:8px 14px;margin-bottom:2px;border-bottom:0.5px solid var(--gray-2);page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--primary);color:white;font-size:9px;font-weight:700;flex-shrink:0;">${idx + 1}</span>
          <span class="badge badge-warn" style="flex-shrink:0;">${lang === 'ko' ? '주의' : 'Warn'}</span>
          <span style="font-size:11px;font-weight:600;color:var(--text);">${esc(it.name)}</span>
          <span style="margin-left:auto;font-size:9px;color:var(--gray-3);flex-shrink:0;">${esc(it.catName)}</span>
        </div>
        ${it.detail ? `<div style="display:flex;gap:8px;margin-bottom:3px;"><span style="font-size:9px;font-weight:600;color:var(--warn);flex-shrink:0;width:32px;">${lang === 'ko' ? '현황' : 'Now'}</span><span style="font-size:9px;color:var(--gray-3);line-height:1.6;">${esc(stripMarkdown(it.detail))}</span></div>` : ''}
        ${it.recommendation ? `<div style="display:flex;gap:8px;"><span style="font-size:9px;font-weight:600;color:var(--accent);flex-shrink:0;width:32px;">${lang === 'ko' ? '조치' : 'Fix'}</span><span style="font-size:9px;color:var(--text);line-height:1.6;">${esc(stripMarkdown(it.recommendation))}</span></div>` : ''}
      </div>`).join('')}` : ''}

    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   ROI PROJECTION PAGE (ROI 프로젝션)
   ═══════════════════════════════════════════════ */

export function buildRoiProjectionPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  score: number, lang: Lang, pageNum: number, totalPages: number
): string {
  // Skip if no traffic data (ROI projections need traffic numbers)
  if (!rd.trafficInsight) return "";
  const traffic = rd.trafficInsight;
  const monthlyVisits = traffic?.monthlyVisits ?? 0;
  const organicShare = traffic?.organicSearchShare ?? 0;
  const missedMonthly = rd.missedPatients?.estimatedMonthly ?? 0;
  const revenueImpact = rd.missedPatients?.revenueImpact || "";

  // Projections
  const currentOrganic = Math.round(monthlyVisits * (organicShare / 100));
  const projectedOrganic3m = Math.round(currentOrganic * 1.25);
  const projectedOrganic6m = Math.round(currentOrganic * 1.5);
  const projectedOrganic12m = Math.round(currentOrganic * 2.0);

  const recoveredPatients3m = Math.round(missedMonthly * 0.3);
  const recoveredPatients6m = Math.round(missedMonthly * 0.5);
  const recoveredPatients12m = Math.round(missedMonthly * 0.7);

  const fmtNum = (n: number) => n.toLocaleString(lang === "ko" ? "ko-KR" : "en-US");

  const projections = [
    {
      period: lang === "ko" ? "3개월 후" : "3 Months",
      organic: projectedOrganic3m,
      recovered: recoveredPatients3m,
      color: "var(--fail)",
      scoreImprove: Math.round(score * 0.15),
    },
    {
      period: lang === "ko" ? "6개월 후" : "6 Months",
      organic: projectedOrganic6m,
      recovered: recoveredPatients6m,
      color: "var(--warn)",
      scoreImprove: Math.round(score * 0.3),
    },
    {
      period: lang === "ko" ? "12개월 후" : "12 Months",
      organic: projectedOrganic12m,
      recovered: recoveredPatients12m,
      color: "var(--pass)",
      scoreImprove: Math.min(100, Math.round(score * 0.5)),
    },
  ];

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "ROI 프로젝션" : "ROI Projection")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "투자 대비 기대 효과 (ROI)" : "Return on Investment Projection",
        lang === "ko" ? "AI 가시성 최적화 투자 시 기대되는 성과를 시뮬레이션합니다" : "Simulating expected returns from AI visibility optimization investment",
        '09'
      )}
      <div class="section-intro">${lang === "ko"
        ? "현재 데이터를 기반으로, AI 가시성 최적화를 실행했을 때 3개월/6개월/12개월 후의 기대 성과를 시뮬레이션합니다."
        : "Based on current data, simulating expected outcomes at 3/6/12 month intervals after AI visibility optimization."
      }</div>

      <!-- Current State -->
      <div class="card" style="padding:14px 16px;border-left:4px solid var(--navy-600);margin-bottom:16px;">
        <div class="fs-10 fw-600 text-navy mb-8">${lang === "ko" ? "현재 상태 (기준점)" : "Current State (Baseline)"}</div>
        <div class="grid-3 gap-8">
          <div><div class="fs-9 text-muted">${lang === "ko" ? "월간 오가닉 유입" : "Monthly Organic"}</div><div class="fs-14 fw-700 text-navy">${fmtNum(currentOrganic)}</div></div>
          <div><div class="fs-9 text-muted">${lang === "ko" ? "예상 월간 미유입 잠재 환자" : "Est. Monthly Missed Website Visitors"}</div><div class="fs-14 fw-700 text-fail">${fmtNum(missedMonthly)}</div></div>
          <div><div class="fs-9 text-muted">${lang === "ko" ? "AI 가시성 점수" : "AI Visibility Score"}</div><div class="fs-14 fw-700 text-navy">${score}/100</div></div>
        </div>
      </div>

      <!-- Projection Timeline -->
      <div class="sub-title">${lang === "ko" ? "기간별 기대 성과" : "Expected Outcomes by Period"}</div>
      <table class="data-table">
        <thead><tr>
          <th>${lang === "ko" ? "기간" : "Period"}</th>
          <th style="text-align:center;">${lang === "ko" ? "오가닉 유입" : "Organic Traffic"}</th>
          <th style="text-align:center;">${lang === "ko" ? "회복 환자" : "Recovered Patients"}</th>
          <th style="text-align:center;">${lang === "ko" ? "점수 향상" : "Score Improvement"}</th>
          <th>${lang === "ko" ? "성장률" : "Growth"}</th>
        </tr></thead>
        <tbody>
          ${projections.map(p => {
            const growthPct = currentOrganic > 0 ? Math.round(((p.organic - currentOrganic) / currentOrganic) * 100) : 0;
            return `<tr>
              <td class="fw-600" style="color:${p.color};">${esc(p.period)}</td>
              <td style="text-align:center;">${fmtNum(p.organic)}</td>
              <td style="text-align:center;color:var(--pass);">+${fmtNum(p.recovered)}${lang === "ko" ? "명/월" : "/mo"}</td>
              <td style="text-align:center;">+${p.scoreImprove}${lang === "ko" ? "점" : "pts"}</td>
              <td>${progressBarHtml(Math.min(growthPct / 100, 1), p.color, 6)} <span class="fs-9 fw-600" style="color:${p.color};">+${growthPct}%</span></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>

      ${revenueImpact ? `
      <div class="highlight-card mt-16" style="background:linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);color:white;border-radius:12px;padding:16px 20px;text-align:center;">
        <div style="font-size:10px;color:var(--gray-400);margin-bottom:6px;">${lang === "ko" ? "예상 웹사이트 전환 매출 손실" : "Est. Website Conversion Revenue Loss"}</div>
        <div style="font-size:22px;font-weight:700;color:var(--teal-400);">${esc(revenueImpact)}</div>
        <div style="font-size:9px;color:var(--gray-400);margin-top:6px;">${lang === "ko" ? "* AI 가시성 최적화로 이 중 상당 부분을 회복할 수 있습니다" : "* A significant portion can be recovered through AI visibility optimization"}</div>
      </div>` : ""}

      <div class="callout callout-info mt-12">
        <div class="callout-icon">${statusIcon("pass")}</div>
        <div class="callout-body">
          <div class="callout-title">${lang === "ko" ? "ROI 시뮬레이션 기준" : "ROI Simulation Basis"}</div>
          <div class="callout-text">${lang === "ko"
            ? "본 시뮬레이션은 SimilarWeb 트래픽 데이터와 업계 평균 전환율을 기반으로 산출되었습니다. 실제 결과는 실행 속도, 콘텐츠 품질, 경쟁 환경에 따라 달라질 수 있습니다."
            : "This simulation is based on SimilarWeb traffic data and industry average conversion rates. Actual results may vary based on execution speed, content quality, and competitive environment."
          }</div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   COMPETITIVE POSITIONING MAP (경쟁 포지셔닝 맵)
   ═══════════════════════════════════════════════ */

export function buildCompetitivePositioningPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  hospitalName: string, score: number, lang: Lang, pageNum: number, totalPages: number
): string {
  const competitors: CompetitorSnapshot[] = rd.competitors || [];
  if (competitors.length === 0) return "";

  const highVis = competitors.filter(c => c.estimatedVisibility === "상");
  const midVis = competitors.filter(c => c.estimatedVisibility === "중");
  const lowVis = competitors.filter(c => c.estimatedVisibility === "하");

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "경쟁 포지셔닝 맵" : "Competitive Positioning Map")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "경쟁 포지셔닝 맵" : "Competitive Positioning Map",
        lang === "ko" ? "AI 가시성 기준 경쟁사 대비 포지션 분석" : "Position analysis vs competitors based on AI visibility",
        '07'
      )}
      <div class="section-intro">${lang === "ko"
        ? `${hospitalName}과(와) ${competitors.length}개 경쟁 병원의 AI 가시성 포지션을 비교 분석합니다. 각 경쟁사의 강점과 귀 병원이 추월할 수 있는 전략적 기회를 식별합니다.`
        : `Comparing AI visibility positions of ${hospitalName} and ${competitors.length} competitors. Identifying each competitor's strengths and strategic overtaking opportunities.`
      }</div>

      <!-- Position Overview -->
      <div class="card" style="padding:16px 20px;margin-bottom:16px;">
        <div class="fs-10 fw-600 text-navy mb-12">${lang === "ko" ? "AI 가시성 포지션 맵" : "AI Visibility Position Map"}</div>
        <!-- Visual positioning bar -->
        <div style="position:relative;height:60px;background:linear-gradient(90deg, var(--fail-bg) 0%, var(--warn-bg) 50%, var(--pass-bg) 100%);border-radius:8px;margin-bottom:12px;">
          <div style="position:absolute;bottom:-18px;left:0;font-size:8px;color:var(--gray-400);">${lang === "ko" ? "낮음" : "Low"}</div>
          <div style="position:absolute;bottom:-18px;right:0;font-size:8px;color:var(--gray-400);">${lang === "ko" ? "높음" : "High"}</div>
          <!-- Your hospital -->
          <div style="position:absolute;left:${Math.min(95, Math.max(5, score))}%;top:50%;transform:translate(-50%,-50%);">
            <div style="background:var(--teal-500);color:white;padding:3px 8px;border-radius:10px;font-size:8px;font-weight:600;white-space:nowrap;">${esc(hospitalName)} (${score})</div>
          </div>
          <!-- Competitors -->
          ${competitors.map((c, idx) => {
            const pos = c.estimatedVisibility === "상" ? 75 + idx * 5 : c.estimatedVisibility === "중" ? 45 + idx * 5 : 15 + idx * 5;
            const color = c.estimatedVisibility === "상" ? "var(--fail)" : c.estimatedVisibility === "중" ? "var(--warn)" : "var(--gray-400)";
            return `<div style="position:absolute;left:${Math.min(95, pos)}%;top:${20 + idx * 12}%;transform:translate(-50%,0);">
              <div style="background:${color};color:white;padding:2px 6px;border-radius:8px;font-size:7px;white-space:nowrap;">${esc(c.name)}</div>
            </div>`;
          }).join("")}
        </div>
      </div>

      <!-- Competitor Detail Cards -->
      <div class="sub-title mt-16">${lang === "ko" ? "경쟁사별 전략 분석" : "Per-Competitor Strategy Analysis"}</div>
      ${competitors.map((c, idx) => {
        const visColor = c.estimatedVisibility === "상" ? "var(--pass)" : c.estimatedVisibility === "중" ? "var(--warn)" : "var(--fail)";
        const visCls = c.estimatedVisibility === "상" ? "badge-pass" : c.estimatedVisibility === "중" ? "badge-warn" : "badge-fail";
        const threatLabel = lang === "ko"
          ? (c.estimatedVisibility === "상" ? "현재 선두 — 추월 전략 필요" : c.estimatedVisibility === "중" ? "동등 수준 — 차별화 필요" : "후발 주자 — 현재 우위 유지")
          : (c.estimatedVisibility === "상" ? "Leading — Overtake strategy needed" : c.estimatedVisibility === "중" ? "Equal — Differentiation needed" : "Behind — Maintain advantage");
        return `<div class="card" style="margin-bottom:8px;padding:12px 14px;border-left:3px solid ${visColor};">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="action-num">${idx + 1}</span>
              <span class="fs-11 fw-600 text-navy">${esc(c.name)}</span>
            </div>
            <span class="badge ${visCls}">${c.estimatedVisibility === "상" ? (lang === "ko" ? "선두" : "Leading") : c.estimatedVisibility === "중" ? (lang === "ko" ? "동등" : "Equal") : (lang === "ko" ? "후발" : "Behind")}</span>
          </div>
          <div class="fs-9 text-light" style="line-height:1.6;margin-bottom:6px;">${esc(stripMarkdown(c.advantage || ""))}</div>
          <div class="fs-9 fw-500" style="color:${visColor};">→ ${esc(threatLabel)}</div>
        </div>`;
      }).join("")}

      <div class="grid-3 gap-8 mt-12">
        <div class="metric-box" style="border-top:3px solid var(--fail);">
          <div class="label">${lang === "ko" ? "선두 경쟁사" : "Leading"}</div>
          <div class="value text-fail">${highVis.length}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--warn);">
          <div class="label">${lang === "ko" ? "동등 수준" : "Equal"}</div>
          <div class="value text-warn">${midVis.length}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--pass);">
          <div class="label">${lang === "ko" ? "후발 주자" : "Behind"}</div>
          <div class="value text-pass">${lowVis.length}</div>
        </div>
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

/* ═══════════════════════════════════════════════
   CONTENT GAP DEEP ANALYSIS PAGE (콘텐츠 사각지대 심층)
   ═══════════════════════════════════════════════ */

export function buildContentGapDeepPage(
  t: Record<string, string>, url: string, rd: RealityDiagnosis,
  lang: Lang, pageNum: number, totalPages: number
): string {
  const gaps = rd.contentGaps || [];
  if (gaps.length === 0) return "";

  const easyGaps = gaps.filter(g => g.difficulty === "쉬움");
  const medGaps = gaps.filter(g => g.difficulty === "보통");
  const hardGaps = gaps.filter(g => g.difficulty === "어려움");
  const avgScore = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g.opportunityScore, 0) / gaps.length) : 0;

  return `<div class="page">
    ${pageHeader(t, url, lang === "ko" ? "콘텐츠 사각지대 심층 분석" : "Content Gap Deep Analysis")}
    <div class="content">
      ${sectionTitle(
        lang === "ko" ? "콘텐츠 사각지대 심층 분석" : "Content Gap Deep Analysis",
        lang === "ko" ? "경쟁사가 아직 선점하지 않은 콘텐츠 기회의 상세 분석" : "Detailed analysis of content opportunities not yet claimed by competitors",
        '06'
      )}
      <div class="section-intro">${lang === "ko"
        ? `${gaps.length}개의 콘텐츠 사각지대를 난이도별로 분류하고, 각 기회의 예상 ROI와 실행 우선순위를 분석합니다. 쉬운 기회부터 빠르게 선점하는 것이 핵심입니다.`
        : `Classifying ${gaps.length} content gaps by difficulty and analyzing expected ROI and execution priority. Quick wins from easy opportunities are key.`
      }</div>

      <!-- Summary -->
      <div class="grid-3 gap-8 mb-16">
        <div class="metric-box" style="border-top:3px solid var(--pass);">
          <div class="label">${lang === "ko" ? "쉬운 기회" : "Easy Wins"}</div>
          <div class="value text-pass">${easyGaps.length}</div>
          <div class="fs-9 text-muted">${lang === "ko" ? "1~2주 내 실행 가능" : "Executable in 1-2 weeks"}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--warn);">
          <div class="label">${lang === "ko" ? "보통 난이도" : "Medium"}</div>
          <div class="value text-warn">${medGaps.length}</div>
          <div class="fs-9 text-muted">${lang === "ko" ? "2~4주 소요" : "2-4 weeks needed"}</div>
        </div>
        <div class="metric-box" style="border-top:3px solid var(--fail);">
          <div class="label">${lang === "ko" ? "높은 난이도" : "Challenging"}</div>
          <div class="value text-fail">${hardGaps.length}</div>
          <div class="fs-9 text-muted">${lang === "ko" ? "전문 콘텐츠 필요" : "Expert content needed"}</div>
        </div>
      </div>

      <!-- Priority Execution Order -->
      <div class="sub-title">${lang === "ko" ? "실행 우선순위 (기회 점수 순)" : "Execution Priority (by Opportunity Score)"}</div>
      <table class="data-table">
        <thead><tr>
          <th style="width:5%;">#</th>
          <th style="width:25%;">${lang === "ko" ? "키워드" : "Keyword"}</th>
          <th style="width:15%;text-align:center;">${lang === "ko" ? "난이도" : "Difficulty"}</th>
          <th style="width:15%;text-align:center;">${lang === "ko" ? "기회 점수" : "Score"}</th>
          <th>${lang === "ko" ? "추천 콘텐츠" : "Suggested Content"}</th>
        </tr></thead>
        <tbody>
          ${[...gaps].sort((a, b) => b.opportunityScore - a.opportunityScore).map((g, idx) => {
            const diffCls = g.difficulty === "쉬움" ? "diff-easy" : g.difficulty === "보통" ? "diff-medium" : "diff-hard";
            const scoreColor = g.opportunityScore >= 7 ? "var(--pass)" : g.opportunityScore >= 4 ? "var(--warn)" : "var(--fail)";
            return `<tr>
              <td class="fw-600">${idx + 1}</td>
              <td class="fw-500">${esc(g.keyword)}</td>
              <td style="text-align:center;"><span class="diff-tag ${diffCls}">${esc(g.difficulty)}</span></td>
              <td style="text-align:center;"><span class="fs-12 fw-700" style="color:${scoreColor};">${g.opportunityScore}/10</span></td>
              <td class="fs-9 text-light" style="line-height:1.4;">${esc(stripMarkdown(g.suggestedContent || ""))}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>

      <div class="insight-box mt-12">
        <span class="fw-600">${lang === "ko" ? "핵심 인사이트:" : "Key Insight:"}</span> ${lang === "ko"
          ? `평균 기회 점수 ${avgScore}/10. ${easyGaps.length}개의 쉬운 기회를 먼저 선점하면, 2주 내에 AI 검색에서 새로운 키워드 포지션을 확보할 수 있습니다.`
          : `Average opportunity score ${avgScore}/10. Claiming ${easyGaps.length} easy opportunities first can secure new AI search positions within 2 weeks.`
        }
      </div>
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

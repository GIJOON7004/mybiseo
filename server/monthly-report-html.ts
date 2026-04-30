/**
 * 월간 리포트 HTML 생성 — 다운로드/공유용 스탠드얼론 HTML
 */

interface ReportData {
  hospitalId: number;
  year: number;
  month: number;
  seoScore: number | null;
  seoScoreChange: number | null;
  aiExposureScore: number | null;
  aiExposureChange: number | null;
  totalVisits: number | null;
  aiChannelVisits: number | null;
  naverVisits: number | null;
  googleVisits: number | null;
  snsVisits: number | null;
  directVisits: number | null;
  totalInquiries: number | null;
  conversionRate: string | null;
  summary: string | null;
  recommendations: string | null;
}

function scoreColor(score: number | null): string {
  if (!score) return "#6b7280";
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

function changeArrow(change: number | null): string {
  if (!change || change === 0) return '<span style="color:#6b7280">→ 변동 없음</span>';
  if (change > 0) return `<span style="color:#059669">▲ +${change}점</span>`;
  return `<span style="color:#dc2626">▼ ${change}점</span>`;
}

export function buildMonthlyReportHtml(report: ReportData): string {
  const monthStr = `${report.year}년 ${report.month}월`;
  const totalVisits = report.totalVisits ?? 0;
  const aiVisits = report.aiChannelVisits ?? 0;
  const naverVisits = report.naverVisits ?? 0;
  const googleVisits = report.googleVisits ?? 0;
  const snsVisits = report.snsVisits ?? 0;
  const directVisits = report.directVisits ?? 0;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MY비서 ${monthStr} 월간 리포트</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px 32px; border-radius: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; color: #94a3b8; }
    .brand { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .brand-text { font-size: 18px; font-weight: 700; }
    .brand-accent { color: #2dd4bf; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .score-box { text-align: center; padding: 20px; border-radius: 10px; background: #f1f5f9; }
    .score-box .label { font-size: 13px; color: #64748b; margin-bottom: 4px; }
    .score-box .value { font-size: 36px; font-weight: 700; }
    .score-box .change { font-size: 13px; margin-top: 4px; }
    .channel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .channel-item { text-align: center; padding: 16px 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .channel-item .ch-label { font-size: 12px; color: #64748b; }
    .channel-item .ch-value { font-size: 22px; font-weight: 700; color: #0f172a; }
    .channel-item .ch-pct { font-size: 11px; color: #94a3b8; }
    .summary-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px; }
    .rec-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
    @media (max-width: 600px) {
      .score-grid { grid-template-columns: 1fr; }
      .channel-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <span class="brand-text">MY <span class="brand-accent">비서</span></span>
      </div>
      <h1>${monthStr} 월간 성과 리포트</h1>
      <div class="subtitle">AI + 포털 검색 노출 종합 분석</div>
    </div>

    <div class="card">
      <h2>📊 핵심 지표</h2>
      <div class="score-grid">
        <div class="score-box">
          <div class="label">SEO 종합 점수</div>
          <div class="value" style="color:${scoreColor(report.seoScore)}">${report.seoScore ?? "—"}</div>
          <div class="change">${changeArrow(report.seoScoreChange)}</div>
        </div>
        <div class="score-box">
          <div class="label">AI 인용 점수</div>
          <div class="value" style="color:${scoreColor(report.aiExposureScore)}">${report.aiExposureScore ?? "—"}%</div>
          <div class="change">${changeArrow(report.aiExposureChange)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>👥 방문 현황</h2>
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:13px;color:#64748b">총 방문</div>
        <div style="font-size:42px;font-weight:700;color:#0f172a">${totalVisits.toLocaleString()}</div>
      </div>
      <div class="channel-grid">
        <div class="channel-item">
          <div class="ch-label">AI 채널</div>
          <div class="ch-value">${aiVisits}</div>
          <div class="ch-pct">${totalVisits > 0 ? Math.round(aiVisits / totalVisits * 100) : 0}%</div>
        </div>
        <div class="channel-item">
          <div class="ch-label">네이버</div>
          <div class="ch-value">${naverVisits}</div>
          <div class="ch-pct">${totalVisits > 0 ? Math.round(naverVisits / totalVisits * 100) : 0}%</div>
        </div>
        <div class="channel-item">
          <div class="ch-label">구글</div>
          <div class="ch-value">${googleVisits}</div>
          <div class="ch-pct">${totalVisits > 0 ? Math.round(googleVisits / totalVisits * 100) : 0}%</div>
        </div>
        <div class="channel-item">
          <div class="ch-label">SNS</div>
          <div class="ch-value">${snsVisits}</div>
          <div class="ch-pct">${totalVisits > 0 ? Math.round(snsVisits / totalVisits * 100) : 0}%</div>
        </div>
        <div class="channel-item">
          <div class="ch-label">직접 방문</div>
          <div class="ch-value">${directVisits}</div>
          <div class="ch-pct">${totalVisits > 0 ? Math.round(directVisits / totalVisits * 100) : 0}%</div>
        </div>
        <div class="channel-item">
          <div class="ch-label">상담 문의</div>
          <div class="ch-value">${report.totalInquiries ?? 0}</div>
          <div class="ch-pct">전환율 ${report.conversionRate ?? "0%"}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📝 AI 분석 요약</h2>
      <div class="summary-box">
        <div style="font-size:13px;font-weight:600;color:#059669;margin-bottom:4px">성과 요약</div>
        ${report.summary ? report.summary.split('\n').map(l => `<p style="margin-bottom:4px">${l}</p>`).join('') : '<p>데이터가 축적되면 AI 요약이 제공됩니다.</p>'}
      </div>
      <div class="rec-box">
        <div style="font-size:13px;font-weight:600;color:#3b82f6;margin-bottom:4px">개선 추천</div>
        ${report.recommendations ? report.recommendations.split('\n').map(l => `<p style="margin-bottom:4px">${l}</p>`).join('') : '<p>데이터가 축적되면 구체적인 추천이 제공됩니다.</p>'}
      </div>
    </div>

    <div class="footer">
      <p>© ${report.year} MY비서 — AI 기술로 병원의 환자 유치와 매출 성장을 돕습니다.</p>
      <p style="margin-top:4px">이 리포트는 자동 생성되었습니다. 문의: cjw7004@naver.com</p>
    </div>
  </div>
</body>
</html>`;
}

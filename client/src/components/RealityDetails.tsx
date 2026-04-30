/**
 * 현실 진단 상세 분석 섹션 (RealityDiagnosis 하위 컴포넌트)
 * — 차분하고 객관적인 진단 톤, FOMO/영업 요소 제거
 */
import { useState } from "react";
import {
  Search, Bot,
  ChevronDown, ChevronUp,
  Zap, BarChart3, EyeOff,
  XCircle, CheckCircle2,
  Users, Lightbulb, Target,
} from "lucide-react";

/* ── HTML 태그 제거 유틸리티 ── */
function strip(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")  // 마크다운 볼드/이탤릭 제거
    .replace(/\s{2,}/g, " ")
    .trim();
}

const NaverIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
  </svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function ExposureBadge({ found, label }: { found: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${found ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/15 text-red-400"}`}>
      {found ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function AiLikelihoodBadge({ likelihood }: { likelihood: string }) {
  const cfg: Record<string, { c: string; l: string }> = {
    high: { c: "bg-emerald-400/15 text-emerald-400", l: "높음" },
    medium: { c: "bg-amber-400/15 text-amber-400", l: "보통" },
    low: { c: "bg-orange-400/15 text-orange-400", l: "낮음" },
    none: { c: "bg-red-400/15 text-red-400", l: "거의 없음" },
  };
  const x = cfg[likelihood] || cfg.none;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${x.c}`}>
      <Bot className="w-2.5 h-2.5" />{x.l}
    </span>
  );
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function RealityDetails({ data }: { data: any }) {
  const [showKwDetail, setShowKwDetail] = useState(false);

  return (
    <div className="px-5 sm:px-8 pb-6 sm:pb-8 space-y-8 border-t border-border/20 pt-6" style={{ animation: "slideDown 0.3s ease-out" }}>

      {/* ── 1. 키워드별 AI 노출 현황 ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-brand" />
          <h4 className="text-sm font-bold text-foreground">키워드별 AI 노출 현황</h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">핵심 키워드 {data.keywords?.length || 0}개</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">키워드</th>
                <th className="text-center py-2.5 px-2 text-xs font-semibold text-muted-foreground">월간 검색량</th>
                <th className="text-center py-2.5 px-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> AI 인용</span>
                </th>
                <th className="text-center py-2.5 px-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><NaverIcon /> 네이버</span>
                </th>
                <th className="text-center py-2.5 px-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><GoogleIcon /> 구글</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(data.keywords || []).map((kw: any, i: number) => (
                <tr key={i} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-medium text-foreground">"{strip(kw.keyword)}"</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-xs font-semibold text-foreground">{fmtNum(kw.monthlySearchVolume || 0)}</span>
                    <span className="text-[10px] text-muted-foreground">/월</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <AiLikelihoodBadge likelihood={kw.ai?.likelihood || "none"} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ExposureBadge found={kw.naver?.found} label={strip(kw.naver?.position) || "미노출"} />
                      <span className="text-[10px] text-muted-foreground">{strip(kw.naver?.type)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ExposureBadge found={kw.google?.found} label={strip(kw.google?.position) || "미노출"} />
                      <span className="text-[10px] text-muted-foreground">{strip(kw.google?.type)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 키워드 상세 토글 */}
        <div className="mt-3">
          <button onClick={() => setShowKwDetail(!showKwDetail)} className="text-xs text-brand hover:underline flex items-center gap-1">
            {showKwDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showKwDetail ? "상세 설명 접기" : "키워드별 상세 설명 보기"}
          </button>
          {showKwDetail && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {(data.keywords || []).map((kw: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <p className="text-sm font-semibold text-foreground mb-2">"{strip(kw.keyword)}"</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p><span className="font-medium text-purple-400">AI 인용:</span> {strip(kw.ai?.detail)}</p>
                    <p><span className="font-medium text-[#03C75A]">네이버:</span> {strip(kw.naver?.detail)}</p>
                    <p><span className="font-medium text-[#4285F4]">구글:</span> {strip(kw.google?.detail)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 2. 트래픽 인사이트 ── */}
      {data.trafficInsight ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-brand" />
            <h4 className="text-sm font-bold text-foreground">실제 트래픽 데이터</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">SimilarWeb</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TrafficCard label="월간 방문수" value={data.trafficInsight.monthlyVisits ? fmtNum(data.trafficInsight.monthlyVisits) : "측정 불가"} warn={!data.trafficInsight.monthlyVisits} />
            <TrafficCard label="글로벌 랭킹" value={data.trafficInsight.globalRank ? `#${fmtNum(data.trafficInsight.globalRank)}` : "순위권 밖"} warn={!data.trafficInsight.globalRank} />
            <TrafficCard label="자연 검색 유입" value={data.trafficInsight.organicSearchShare ? `${(data.trafficInsight.organicSearchShare * 100).toFixed(1)}%` : "데이터 없음"} warn={!data.trafficInsight.organicSearchShare || data.trafficInsight.organicSearchShare < 0.1} />
            <TrafficCard label="이탈률" value={data.trafficInsight.bounceRate ? `${(data.trafficInsight.bounceRate * 100).toFixed(1)}%` : "데이터 없음"} warn={data.trafficInsight.bounceRate ? data.trafficInsight.bounceRate > 0.7 : false} />
          </div>
        </section>
      ) : (
        <section>
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">트래픽 데이터 측정 불가</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  SimilarWeb에서 트래픽 데이터를 수집할 수 없습니다. 이는 월간 방문수가 약 5,000회 미만으로 매우 적다는 것을 의미합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. 경쟁 병원 비교 ── */}
      {data.competitors && data.competitors.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand" />
            <h4 className="text-sm font-bold text-foreground">경쟁 병원 현황</h4>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {data.competitors.map((comp: any, i: number) => {
              const visCfg: Record<string, string> = { "상": "text-emerald-400", "중": "text-amber-400", "하": "text-red-400" };
              return (
                <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">{strip(comp.name)}</p>
                    <span className={`text-[10px] font-bold ${visCfg[comp.estimatedVisibility] || "text-muted-foreground"}`}>
                      노출도: {comp.estimatedVisibility || "-"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{strip(comp.advantage)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. 콘텐츠 사각지대 분석 ── */}
      {data.contentGaps && data.contentGaps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand" />
            <h4 className="text-sm font-bold text-foreground">콘텐츠 사각지대 분석</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">선점 기회 {data.contentGaps.length}개</span>
          </div>
            <p className="text-xs text-muted-foreground mb-4">아직 아무도 점유하지 않은 AI 인용 키워드 — 선점하면 AI 플랫폼에서 우선 인용될 수 있습니다.</p>
          <div className="space-y-3">
            {data.contentGaps.map((gap: any, i: number) => {
              const diffCfg: Record<string, { bg: string; text: string; label: string }> = {
                "쉬움": { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "쉬움" },
                "보통": { bg: "bg-amber-500/15", text: "text-amber-400", label: "보통" },
                "어려움": { bg: "bg-red-500/15", text: "text-red-400", label: "어려움" },
              };
              const dc = diffCfg[gap.difficulty] || diffCfg["보통"];
              const scoreColor = gap.opportunityScore >= 8 ? "text-emerald-400" : gap.opportunityScore >= 5 ? "text-amber-400" : "text-muted-foreground";
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/40">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-lg bg-brand/10 flex flex-col items-center justify-center`}>
                      <span className={`text-lg font-bold ${scoreColor}`}>{gap.opportunityScore || 0}</span>
                    </div>
                    <span className="text-[8px] text-muted-foreground">기회점수</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">"{strip(gap.keyword)}"</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${dc.bg} ${dc.text}`}>{dc.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      <Lightbulb className="w-3 h-3 inline mr-1 text-amber-400" />
                      {strip(gap.searchIntent)}
                    </p>
                    <p className="text-xs text-brand/80">→ {strip(gap.suggestedContent)}</p>
                    {gap.rationale && (
                      <p className="text-[11px] text-purple-400/90 mt-1.5 pl-1 border-l-2 border-purple-500/30">
                        📌 {strip(gap.rationale)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 5. 개선 로드맵 ── */}
      {data.actionItems && data.actionItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand" />
            <h4 className="text-sm font-bold text-foreground">개선 로드맵</h4>
          </div>
          <div className="space-y-3">
            {data.actionItems.map((item: any, i: number) => {
              const priCfg: Record<string, { bg: string; text: string }> = {
                "즉시": { bg: "bg-red-500/15", text: "text-red-400" },
                "1개월 내": { bg: "bg-amber-500/15", text: "text-amber-400" },
                "3개월 내": { bg: "bg-blue-500/15", text: "text-blue-400" },
              };
              const pc = priCfg[item.priority] || priCfg["3개월 내"];
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/40">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand">{i + 1}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{item.priority}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{strip(item.action)}</p>
                    <p className="text-xs text-muted-foreground">{strip(item.expectedImpact)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── 트래픽 카드 ── */
function TrafficCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${warn ? "bg-red-500/5 border-red-500/15" : "bg-background/50 border-border/40"}`}>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${warn ? "text-red-400" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

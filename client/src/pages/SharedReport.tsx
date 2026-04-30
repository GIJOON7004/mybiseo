/**
 * 월간 리포트 공유 링크 페이지
 * /report/:token 으로 접근 — 로그인 불필요
 */
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import {
  Activity, ArrowDown, ArrowUp, BarChart3, Building2, Calendar,
  FileText, Loader2, Minus, ShieldAlert, TrendingUp,
} from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-400 bg-green-500/10 border-green-500/20" :
    score >= 60 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${color}`}>
      {score}점
    </span>
  );
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" />변동없음</span>;
  const isUp = value > 0;
  return (
    <span className={`text-xs flex items-center gap-0.5 ${isUp ? "text-green-400" : "text-red-400"}`}>
      {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {isUp ? "+" : ""}{value}
    </span>
  );
}

export default function SharedReport() {
  const [, params] = useRoute("/report/:token");
  const token = params?.token ?? "";

  const { data: report, isLoading, error } = trpc.monthlyReport.getByShareToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-sm text-muted-foreground">리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">리포트를 찾을 수 없습니다</h1>
          <p className="text-sm text-muted-foreground">
            공유 링크가 만료되었거나 유효하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  const r = report as any;
  const data = typeof r.reportData === "string" ? JSON.parse(r.reportData) : r.reportData;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{r.title || "월간 리포트"}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Building2 className="w-3 h-3" />
                <span>{data?.hospitalName || "병원"}</span>
                <span className="text-border">|</span>
                <Calendar className="w-3 h-3" />
                <span>{report.month}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            MY비서 월간 성과 리포트입니다.
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 종합 점수 */}
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />종합 점수
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">AI 검색 점수</p>
              <ScoreBadge score={data?.seoScore ?? 0} />
              {data?.seoScoreChange != null && <div className="mt-1"><ChangeIndicator value={data.seoScoreChange} /></div>}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">총 방문수</p>
              <p className="text-2xl font-bold">{(data?.totalVisits ?? 0).toLocaleString()}</p>
              {data?.visitsChange != null && <div className="mt-1"><ChangeIndicator value={data.visitsChange} /></div>}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">상담 문의</p>
              <p className="text-2xl font-bold">{data?.totalInquiries ?? 0}</p>
              {data?.inquiriesChange != null && <div className="mt-1"><ChangeIndicator value={data.inquiriesChange} /></div>}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">전환율</p>
              <p className="text-2xl font-bold">{data?.conversionRate ?? 0}%</p>
              {data?.conversionChange != null && <div className="mt-1"><ChangeIndicator value={data.conversionChange} /></div>}
            </div>
          </div>
        </div>

        {/* 채널별 유입 */}
        {data?.channelVisits && (
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />채널별 유입
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(data.channelVisits).map(([ch, count]) => (
                <div key={ch} className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{ch}</p>
                  <p className="text-lg font-bold mt-1">{(count as number).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI 요약 */}
        {data?.aiSummary && (
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />AI 분석 요약
            </h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{data.aiSummary}</p>
          </div>
        )}

        {/* 개선 권고 */}
        {data?.recommendations && data.recommendations.length > 0 && (
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">개선 권고사항</h2>
            <ul className="space-y-2">
              {data.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-foreground/80">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t border-border/20">
          <p>이 리포트는 <strong className="text-brand">MY비서</strong>에서 자동 생성되었습니다.</p>
          <p className="mt-1">mybiseo.com | AI 기반 의료 마케팅 플랫폼</p>
        </div>
      </div>
    </div>
  );
}

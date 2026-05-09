/**
 * AI 검색 결과 모니터링 대시보드 — 관리자 전용 (고도화)
 * - 5대 AI 플랫폼 모니터링 (ChatGPT, Gemini, Claude, Perplexity, Grok)
 * - AI 인용 종합 점수 시각화
 * - 랭킹 변화 차트
 * - 경쟁사 비교 대시보드
 *
 * UX/UI 개선:
 * - 페이지 헤더 스타일 통일 (text-xl)
 * - 통계 카드 아이콘 배경 + 라벨 위치 통일
 * - 키워드 카드형 레이아웃 개선
 * - 빈 상태 일러스트 개선
 * - 모바일 반응형 최적화
 * - 결과 카드 간격/가독성 개선
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot, Plus, Trash2, Play, Loader2, Search, TrendingUp,
  CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, BarChart3,
  Clock, Zap, Calendar, Target, Users, Award, ArrowUp, ArrowDown, ClipboardList,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useLocation } from "wouter";

const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity", grok: "Grok",
};
const platformColors: Record<string, string> = {
  chatgpt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  gemini: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  claude: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  perplexity: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  grok: "bg-red-500/10 text-red-400 border-red-500/20",
};
const sentimentLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  positive: { label: "긍정", icon: <CheckCircle2 className="w-3 h-3" />, color: "text-emerald-400" },
  neutral: { label: "중립", icon: <AlertTriangle className="w-3 h-3" />, color: "text-amber-400" },
  negative: { label: "부정", icon: <XCircle className="w-3 h-3" />, color: "text-red-400" },
};
const PLATFORM_CHART_COLORS: Record<string, string> = {
  chatgpt: "#34d399", gemini: "#60a5fa", claude: "#fb923c", perplexity: "#a78bfa", grok: "#f87171",
};

/* ═══════════════════════════════════════════════════ */
/* 점수 게이지                                         */
/* ═══════════════════════════════════════════════════ */
function ScoreGauge({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const getColor = (s: number) => {
    if (s >= 70) return { ring: "text-emerald-400", text: "text-emerald-400" };
    if (s >= 40) return { ring: "text-amber-400", text: "text-amber-400" };
    return { ring: "text-red-400", text: "text-red-400" };
  };
  const colors = getColor(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const isLg = size === "lg";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`relative ${isLg ? "w-24 h-24" : "w-14 h-14"}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className={colors.ring} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${colors.text} ${isLg ? "text-xl" : "text-xs"}`}>{score}</span>
        </div>
      </div>
      <span className={`text-muted-foreground ${isLg ? "text-xs" : "text-[10px]"}`}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 플랫폼별 점수 카드                                   */
/* ═══════════════════════════════════════════════════ */
function PlatformScoreCard({ platform, data }: { platform: string; data: { mentioned: boolean; rank: number | null; sentiment: string; score: number } }) {
  return (
    <div className={`p-2.5 rounded-xl border ${platformColors[platform]} flex flex-col items-center gap-1`}>
      <span className="text-[10px] font-medium">{platformLabels[platform]}</span>
      <div className="text-lg font-bold">{data.score}</div>
      <div className="flex items-center gap-1 text-[10px]">
        {data.mentioned ? (
          <span className="flex items-center gap-0.5 text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5" />언급</span>
        ) : (
          <span className="flex items-center gap-0.5 text-red-400/60"><XCircle className="w-2.5 h-2.5" />미언급</span>
        )}
        {data.rank && <span className="text-amber-400">{data.rank}위</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 트렌드 차트                                         */
/* ═══════════════════════════════════════════════════ */
function TrendChart() {
  const trendQuery = trpc.aiMonitor.getTrend.useQuery({ weeks: 8 });
  const trend = trendQuery.data ?? [];
  if (trend.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-teal-500/10"><TrendingUp className="w-4 h-4 text-teal-400" /></div>
            AI 인용 트렌드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={TrendingUp} message="트렌드 데이터가 없습니다" sub="모니터링 데이터가 쌓이면 주간별 AI 인용 트렌드 차트가 표시됩니다" />
        </CardContent>
      </Card>
    );
  }
  const allPlatforms = ["chatgpt", "gemini", "claude", "perplexity", "grok"];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-teal-500/10"><TrendingUp className="w-4 h-4 text-teal-400" /></div>
          AI 인용 트렌드 (최근 8주)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 언급률 바 차트 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">주간별 전체 언급률</p>
          <div className="space-y-1.5">
            {trend.map((w) => {
              const rate = w.total > 0 ? Math.round((w.mentioned / w.total) * 100) : 0;
              return (
                <div key={w.week} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0 tabular-nums">{w.week.slice(5)}</span>
                  <div className="flex-1 h-5 bg-muted/20 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all" style={{ width: `${rate}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">{rate}% ({w.mentioned}/{w.total})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* 플랫폼별 언급 히트맵 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">플랫폼별 언급 히트맵</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-1.5 font-medium text-muted-foreground">주간</th>
                  {allPlatforms.map(p => (
                    <th key={p} className="text-center py-2 px-1.5 font-medium" style={{ color: PLATFORM_CHART_COLORS[p] }}>{platformLabels[p]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trend.map((w) => (
                  <tr key={w.week} className="border-b border-border/10">
                    <td className="py-1.5 px-1.5 text-muted-foreground">{w.week.slice(5)}</td>
                    {allPlatforms.map(p => {
                      const pd = w.platforms[p];
                      if (!pd || pd.total === 0) return <td key={p} className="text-center py-1.5 px-1.5"><span className="text-muted-foreground/30">—</span></td>;
                      const rate = Math.round((pd.mentioned / pd.total) * 100);
                      return (
                        <td key={p} className="text-center py-1.5 px-1.5">
                          <span className="inline-flex w-7 h-7 rounded-md items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: rate > 0 ? `${PLATFORM_CHART_COLORS[p]}20` : "transparent",
                              color: rate > 0 ? PLATFORM_CHART_COLORS[p] : "#6b7280",
                              border: rate > 0 ? `1px solid ${PLATFORM_CHART_COLORS[p]}40` : "1px solid transparent",
                            }}>
                            {rate > 0 ? `${rate}%` : "-"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* 레전드 */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-border/20">
          {allPlatforms.map(p => (
            <div key={p} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PLATFORM_CHART_COLORS[p] }} />
              {platformLabels[p]}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════ */
/* AI 인용 점수 대시보드                                */
/* ═══════════════════════════════════════════════════ */
function ExposureScoreDashboard({ selectedKeywordId }: { selectedKeywordId: number | null }) {
  const scoresQuery = trpc.aiMonitor.getExposureScores.useQuery(selectedKeywordId ? { keywordId: selectedKeywordId } : {});
  const scores = scoresQuery.data ?? [];
  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-amber-500/10"><Award className="w-4 h-4 text-amber-400" /></div>
            AI 인용 종합 점수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Award} message="노출 점수 데이터가 없습니다" sub="모니터링을 실행하면 AI 인용 종합 점수가 표시됩니다" />
        </CardContent>
      </Card>
    );
  }
  const latest = scores[0];
  const previous = scores.length > 1 ? scores[1] : null;
  const scoreDiff = previous ? latest.score - previous.score : 0;
  const platformScoresData = (latest.platformScores as Record<string, { mentioned: boolean; rank: number | null; sentiment: string; score: number }>) ?? {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-amber-500/10"><Award className="w-4 h-4 text-amber-400" /></div>
          AI 인용 종합 점수
          {scoreDiff !== 0 && (
            <span className={`text-xs font-normal flex items-center gap-0.5 ${scoreDiff > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {scoreDiff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(scoreDiff)}점
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={latest.score} label="종합 점수" size="lg" />
            <div className="text-[11px] text-muted-foreground text-center">
              {new Date(latest.periodStart).toLocaleDateString("ko-KR")} ~ {new Date(latest.periodEnd).toLocaleDateString("ko-KR")}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[
              { label: "언급률 (40%)", score: latest.mentionScore, color: "text-teal-400", barColor: "bg-teal-400" },
              { label: "순위 (25%)", score: latest.rankScore, color: "text-blue-400", barColor: "bg-blue-400" },
              { label: "감성 (20%)", score: latest.sentimentScore, color: "text-amber-400", barColor: "bg-amber-400" },
              { label: "경쟁사 대비 (15%)", score: latest.competitorScore, color: "text-purple-400", barColor: "bg-purple-400" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/10 border border-border/30">
                <div className="text-[11px] text-muted-foreground mb-1">{item.label}</div>
                <div className={`text-lg font-bold ${item.color}`}>{item.score}점</div>
                <div className="h-1.5 bg-muted/20 rounded-full mt-1.5">
                  <div className={`h-full ${item.barColor} rounded-full transition-all`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {Object.keys(platformScoresData).length > 0 && (
          <div className="mt-5 pt-4 border-t border-border/20">
            <p className="text-xs font-medium text-muted-foreground mb-2">플랫폼별 점수</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {["chatgpt", "gemini", "claude", "perplexity", "grok"].map(p => {
                const pd = platformScoresData[p];
                if (!pd) return <div key={p} className="p-2.5 rounded-xl border border-border/20 text-center text-[10px] text-muted-foreground">{platformLabels[p]}<br/>데이터 없음</div>;
                return <PlatformScoreCard key={p} platform={p} data={pd} />;
              })}
            </div>
          </div>
        )}
        {scores.length > 1 && (
          <div className="mt-5 pt-4 border-t border-border/20">
            <p className="text-xs font-medium text-muted-foreground mb-2">점수 변화 이력</p>
            <div className="flex items-end gap-1.5 h-16">
              {scores.slice(0, 8).reverse().map((s, i) => {
                const height = Math.max(10, s.score);
                const getBarColor = (sc: number) => sc >= 70 ? "bg-emerald-400" : sc >= 40 ? "bg-amber-400" : "bg-red-400";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground tabular-nums">{s.score}</span>
                    <div className={`w-full rounded-t ${getBarColor(s.score)} transition-all`} style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 경쟁사 관리 섹션                                     */
/* ═══════════════════════════════════════════════════ */
function CompetitorSection({ keywordId }: { keywordId: number }) {
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const utils = trpc.useUtils();
  const competitorsQuery = trpc.aiMonitor.getCompetitors.useQuery({ keywordId });
  const competitors = competitorsQuery.data ?? [];
  const addMutation = trpc.aiMonitor.addCompetitor.useMutation({
    onSuccess: () => { toast.success("경쟁사가 추가되었습니다"); setNewName(""); setNewUrl(""); utils.aiMonitor.getCompetitors.invalidate(); },
    onError: () => toast.error("경쟁사 추가에 실패했습니다"),
  });
  const deleteMutation = trpc.aiMonitor.deleteCompetitor.useMutation({ onSuccess: () => { toast.success("경쟁사가 삭제되었습니다"); utils.aiMonitor.getCompetitors.invalidate(); },
  onError: (err) => toast.error(err.message) });

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Users className="w-3.5 h-3.5 text-purple-400" />
        경쟁사 ({competitors.length}개)
      </div>
      <div className="flex gap-2">
        <Input placeholder="경쟁 업체명" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 h-8 text-xs" />
        <Input placeholder="URL (선택)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="flex-1 h-8 text-xs" />
        <Button size="sm" className="h-8 w-8 p-0" onClick={() => { if (!newName.trim()) return; addMutation.mutate({ keywordId, competitorName: newName.trim(), competitorUrl: newUrl.trim() || undefined }); }} disabled={addMutation.isPending || !newName.trim()}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {competitors.length > 0 && (
        <div className="space-y-1">
          {competitors.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/10">
              <Target className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="flex-1 truncate">{c.competitorName}</span>
              {c.competitorUrl && <span className="text-[10px] text-muted-foreground truncate max-w-28">{c.competitorUrl}</span>}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate({ id: c.id })}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 빈 상태 컴포넌트                                     */
/* ═══════════════════════════════════════════════════ */
function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 통계 카드 컴포넌트                                   */
/* ═══════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, iconBg, iconColor }: { icon: any; label: string; value: string | number; iconBg: string; iconColor: string }) {
  return (
    <Card>
      <CardContent className="p-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 메인 대시보드                                       */
/* ═══════════════════════════════════════════════════ */
export default function AdminAIMonitor() {
  const [newKeyword, setNewKeyword] = useState("");
  const [newHospital, setNewHospital] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [expandedKeywordId, setExpandedKeywordId] = useState<number | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [expandedResultIds, setExpandedResultIds] = useState<Set<number>>(new Set());
  const toggleResultExpand = (id: number) => setExpandedResultIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const statsQuery = trpc.aiMonitor.getStats.useQuery();
  const keywordsQuery = trpc.aiMonitor.getKeywords.useQuery({ activeOnly: false });
  const resultsQuery = trpc.aiMonitor.getResults.useQuery(selectedKeywordId ? { keywordId: selectedKeywordId, limit: 50 } : { limit: 50 });

  const addKeywordMutation = trpc.aiMonitor.addKeyword.useMutation({
    onSuccess: () => { toast.success("키워드가 추가되었습니다"); setNewKeyword(""); setNewHospital(""); setNewSpecialty(""); utils.aiMonitor.getKeywords.invalidate(); utils.aiMonitor.getStats.invalidate(); },
    onError: () => toast.error("키워드 추가에 실패했습니다"),
  });
  const toggleMutation = trpc.aiMonitor.toggleKeyword.useMutation({ onSuccess: () => { utils.aiMonitor.getKeywords.invalidate(); utils.aiMonitor.getStats.invalidate(); },
  onError: (err) => toast.error(err.message) });
  const deleteMutation = trpc.aiMonitor.deleteKeyword.useMutation({ onSuccess: () => { toast.success("키워드가 삭제되었습니다"); utils.aiMonitor.getKeywords.invalidate(); utils.aiMonitor.getStats.invalidate(); utils.aiMonitor.getResults.invalidate(); },
  onError: (err) => toast.error(err.message) });
  const runCheckMutation = trpc.aiMonitor.runCheck.useMutation({
    onSuccess: (data: any) => {
      const mentioned = data.results?.filter((r: any) => r.mentioned).length ?? 0;
      const score = data.score?.score ?? 0;
      toast.success(`모니터링 완료: ${data.results?.length ?? 0}개 AI 중 ${mentioned}개 언급, 노출 점수 ${score}점`);
      utils.aiMonitor.getResults.invalidate(); utils.aiMonitor.getStats.invalidate(); utils.aiMonitor.getExposureScores.invalidate();
    },
    onError: () => toast.error("모니터링 실행에 실패했습니다"),
  });
  const runAllMutation = trpc.aiMonitor.runAutoCheck.useMutation({
    onSuccess: (data: any) => {
      toast.success(`전체 모니터링 완료: ${data.checkedKeywords ?? 0}개 키워드, ${data.totalMentions ?? 0}개 언급`);
      utils.aiMonitor.getResults.invalidate(); utils.aiMonitor.getStats.invalidate(); utils.aiMonitor.getExposureScores.invalidate();
    },
    onError: () => toast.error("전체 모니터링 실행에 실패했습니다"),
  });

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newHospital.trim()) return;
    addKeywordMutation.mutate({ keyword: newKeyword.trim(), hospitalName: newHospital.trim(), specialty: newSpecialty.trim() || undefined });
  };

  const stats = statsQuery.data;
  const keywords = keywordsQuery.data || [];
  const results = resultsQuery.data || [];
  const displayResults = showAllResults ? results : results.slice(0, 10);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI 검색 모니터링</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ChatGPT, Gemini, Claude, Perplexity, Grok에서 병원이 언급되는지 추적하고 AI 인용 점수를 분석합니다
          </p>
        </div>

        {/* AI 개선 리포트 바로가기 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="p-1.5 rounded-lg bg-purple-500/10"><ClipboardList className="w-4 h-4 text-purple-400" /></div>
            <div>
              <p className="text-sm font-medium">AI 인용 개선 리포트</p>
              <p className="text-xs text-muted-foreground">모니터링 결과를 분석하여 맞춤형 개선 방안을 자동 생성합니다</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/ai-report")} className="shrink-0 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-9">
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />리포트 보기
          </Button>
        </div>

        {/* 자동 스케줄 안내 + 전체 실행 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="p-1.5 rounded-lg bg-primary/10"><Calendar className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-sm font-medium">자동 모니터링: <span className="text-primary">매주 월요일 오전 9시(KST)</span></p>
              <p className="text-xs text-muted-foreground">활성화된 모든 키워드를 5개 AI 플랫폼에서 자동 검사 + 노출 점수 산정</p>
            </div>
          </div>
          <Button size="sm" onClick={() => runAllMutation.mutate()} disabled={runAllMutation.isPending || keywords.filter(k => k.isActive === 1).length === 0} className="h-9">
            {runAllMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />검사 중...</> : <><Zap className="w-3.5 h-3.5 mr-1.5" />전체 즉시 검사</>}
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Search} label="추적 키워드" value={stats?.totalKeywords ?? 0} iconBg="bg-primary/10" iconColor="text-primary" />
          <StatCard icon={BarChart3} label="총 검사 횟수" value={stats?.totalChecks ?? 0} iconBg="bg-purple-500/10" iconColor="text-purple-400" />
          <StatCard icon={TrendingUp} label="언급률" value={`${stats?.mentionRate ?? 0}%`} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
          <StatCard icon={Award} label="평균 노출 점수" value={stats?.avgScore ?? 0} iconBg="bg-amber-500/10" iconColor="text-amber-400" />
          <StatCard icon={Users} label="추적 경쟁사" value={stats?.totalCompetitors ?? 0} iconBg="bg-red-500/10" iconColor="text-red-400" />
          <StatCard icon={Clock} label="마지막 검사" value={stats?.lastChecked ? new Date(stats.lastChecked).toLocaleDateString("ko-KR") : "—"} iconBg="bg-blue-500/10" iconColor="text-blue-400" />
        </div>

        {/* 플랫폼별 언급률 바 */}
        {stats?.platformBreakdown && Object.keys(stats.platformBreakdown).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-indigo-500/10"><BarChart3 className="w-4 h-4 text-indigo-400" /></div>
                플랫폼별 언급률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["chatgpt", "gemini", "claude", "perplexity", "grok"].map(p => {
                  const pb = (stats.platformBreakdown as Record<string, { total: number; mentioned: number; rate: number }>)?.[p];
                  if (!pb) return null;
                  return (
                    <div key={p} className="flex items-center gap-2">
                      <span className="text-xs w-20 shrink-0 font-medium" style={{ color: PLATFORM_CHART_COLORS[p] }}>{platformLabels[p]}</span>
                      <div className="flex-1 h-5 bg-muted/20 rounded-full overflow-hidden relative">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pb.rate}%`, backgroundColor: PLATFORM_CHART_COLORS[p] }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">{pb.rate}% ({pb.mentioned}/{pb.total})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI 인용 점수 대시보드 */}
        <ExposureScoreDashboard selectedKeywordId={selectedKeywordId} />

        {/* 키워드 추가 폼 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary/10"><Plus className="w-4 h-4 text-primary" /></div>
              모니터링 키워드 추가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddKeyword} className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="키워드 (예: 임플란트)" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} className="flex-1 h-10" />
              <Input placeholder="병원명 (예: 스마일치과)" value={newHospital} onChange={(e) => setNewHospital(e.target.value)} className="flex-1 h-10" />
              <Input placeholder="진료과 (선택)" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} className="sm:w-28 h-10" />
              <Button type="submit" disabled={addKeywordMutation.isPending || !newKeyword.trim() || !newHospital.trim()} className="h-10">
                <Plus className="w-4 h-4 mr-1.5" />추가
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 키워드 목록 + 경쟁사 관리 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-slate-500/10"><Search className="w-4 h-4 text-slate-400" /></div>
              등록된 키워드
              {keywords.length > 0 && <Badge variant="secondary" className="text-xs">{keywords.length}개</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {keywords.length === 0 ? (
              <EmptyState icon={Search} message="등록된 키워드가 없습니다" sub="위에서 키워드를 추가해 주세요" />
            ) : (
              <div className="space-y-2">
                {keywords.map((kw) => (
                  <div key={kw.id} className="space-y-2">
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border transition-colors cursor-pointer ${
                        selectedKeywordId === kw.id ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/10"
                      } ${kw.isActive === 0 ? "opacity-50" : ""}`}
                      onClick={() => setSelectedKeywordId(selectedKeywordId === kw.id ? null : kw.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{kw.keyword}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{kw.hospitalName}</Badge>
                          {kw.specialty && <span className="text-[11px] text-muted-foreground">{kw.specialty}</span>}
                          {kw.isActive === 0 && <Badge variant="secondary" className="text-[10px] h-5 bg-red-500/10 text-red-400">비활성</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300"
                          onClick={(e) => { e.stopPropagation(); setExpandedKeywordId(expandedKeywordId === kw.id ? null : kw.id); }} title="경쟁사 관리">
                          <Users className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); runCheckMutation.mutate({ keywordId: kw.id }); }}
                          disabled={runCheckMutation.isPending || kw.isActive === 0} title="모니터링 실행">
                          {runCheckMutation.isPending && runCheckMutation.variables?.keywordId === kw.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: kw.id, isActive: kw.isActive === 1 ? 0 : 1 }); }}
                          title={kw.isActive === 1 ? "비활성화" : "활성화"}>
                          {kw.isActive === 1 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: kw.id }); }} title="삭제">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expandedKeywordId === kw.id && (
                      <div className="ml-3 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                        <CompetitorSection keywordId={kw.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 트렌드 차트 */}
        <TrendChart />

        {/* 모니터링 결과 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-slate-500/10"><Bot className="w-4 h-4 text-slate-400" /></div>
                모니터링 결과
                {results.length > 0 && <Badge variant="secondary" className="text-xs">{results.length}개</Badge>}
              </CardTitle>
              {selectedKeywordId && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedKeywordId(null)} className="text-xs h-7">
                  필터 해제
                </Button>
              )}
            </div>
            {selectedKeywordId && (
              <CardDescription className="text-xs">
                "{keywords.find(k => k.id === selectedKeywordId)?.keyword}" 키워드 결과만 표시 중
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <EmptyState icon={Bot} message="모니터링 결과가 없습니다" sub="키워드를 추가하고 실행 버튼을 눌러 검사를 시작하세요" />
            ) : (
              <div className="space-y-2">
                {displayResults.map((r) => {
                  const kw = keywords.find(k => k.id === r.keywordId);
                  const sentimentInfo = sentimentLabels[r.sentiment || "neutral"];
                  return (
                    <div key={r.id} className="p-3.5 rounded-xl border border-border/50 hover:bg-accent/10 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${platformColors[r.platform]}`}>
                          {platformLabels[r.platform]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[11px] text-muted-foreground">{kw?.keyword}</span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">{new Date(r.checkedAt).toLocaleString("ko-KR")}</span>
                            {r.rank && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">{r.rank}위</Badge>}
                            {r.mentionPosition && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {r.mentionPosition === "first" ? "최상단" : r.mentionPosition === "middle" ? "중간" : r.mentionPosition === "last" ? "하단" : "단독"}
                              </Badge>
                            )}
                            {r.recommendationType && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-purple-500/10 text-purple-400 border-purple-500/20">
                                {r.recommendationType === "direct" ? "직접 추천" : r.recommendationType === "comparison" ? "비교 추천" : r.recommendationType === "review" ? "후기 기반" : "주의"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1.5 italic">질의: "{r.query}"</p>
                          <div className="relative">
                            <p className={`text-sm leading-relaxed ${expandedResultIds.has(r.id) ? '' : 'line-clamp-2'}`}>{r.response}</p>
                            {r.response && r.response.length > 120 && (
                              <button onClick={() => toggleResultExpand(r.id)} className="text-[11px] text-primary hover:underline mt-1 flex items-center gap-0.5 py-1">
                                {expandedResultIds.has(r.id) ? (<><ChevronUp className="w-3 h-3" />접기</>) : (<><ChevronDown className="w-3 h-3" />전체 응답 보기</>)}
                              </button>
                            )}
                          </div>
                          {r.mentioned === 1 && r.mentionContext && (
                            <div className="mt-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                              <p className="text-[10px] text-emerald-400 font-medium mb-0.5">언급 컨텍스트:</p>
                              <p className="text-xs text-emerald-300">{r.mentionContext}</p>
                            </div>
                          )}
                          {r.competitorsMentioned && (
                            <div className="mt-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                              <p className="text-[10px] text-purple-400 font-medium mb-1">경쟁사 언급:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(r.competitorsMentioned);
                                    if (Array.isArray(parsed)) {
                                      return parsed.map((name: string, idx: number) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/15">
                                          <Target className="w-2.5 h-2.5" />{name}
                                        </span>
                                      ));
                                    }
                                    return <span className="text-xs text-purple-300">{r.competitorsMentioned}</span>;
                                  } catch {
                                    return <span className="text-xs text-purple-300">{r.competitorsMentioned}</span>;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          {r.mentioned === 1 ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />언급됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
                              <XCircle className="w-3 h-3" />미언급
                            </span>
                          )}
                          {r.mentioned === 1 && sentimentInfo && (
                            <span className={`inline-flex items-center gap-0.5 text-[10px] ${sentimentInfo.color}`}>
                              {sentimentInfo.icon}{sentimentInfo.label}
                            </span>
                          )}
                          {r.mentioned === 1 && r.rank && (
                            <span className={`text-[9px] font-medium ${
                              r.rank <= 3 ? 'text-amber-400' : r.rank <= 5 ? 'text-blue-400' : 'text-muted-foreground'
                            }`}>
                              {r.rank <= 3 ? '상위 추천' : r.rank <= 5 ? '중위 추천' : '하위 언급'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {results.length > 10 && !showAllResults && (
                  <Button variant="ghost" className="w-full text-xs h-9" onClick={() => setShowAllResults(true)}>
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    나머지 {results.length - 10}개 결과 더 보기
                  </Button>
                )}
                {showAllResults && results.length > 10 && (
                  <Button variant="ghost" className="w-full text-xs h-9" onClick={() => setShowAllResults(false)}>
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    접기
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

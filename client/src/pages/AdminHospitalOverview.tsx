/**
 * 관리자 병원 현황 대시보드 — 전체 병원 통합 현황, 성과 순위, 채널 분석, 자동 진단
 */
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, Globe, TrendingUp, Activity, Zap,
  RefreshCw, ExternalLink, Search, ArrowUpRight, ArrowDownRight,
  Loader2, CheckCircle2, AlertCircle, CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CHANNEL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
  copilot: "Copilot",
  naver: "네이버",
  google: "구글",
  instagram: "인스타그램",
  youtube: "유튜브",
  facebook: "페이스북",
  tiktok: "틱톡",
  blog: "블로그",
  direct: "직접 방문",
  other: "기타",
};

const CHANNEL_COLORS: Record<string, string> = {
  chatgpt: "bg-emerald-500",
  gemini: "bg-blue-500",
  claude: "bg-orange-500",
  perplexity: "bg-cyan-500",
  copilot: "bg-purple-500",
  naver: "bg-green-500",
  google: "bg-red-500",
  instagram: "bg-pink-500",
  youtube: "bg-red-600",
  facebook: "bg-blue-600",
  tiktok: "bg-slate-800",
  blog: "bg-amber-500",
  direct: "bg-gray-500",
  other: "bg-gray-400",
};

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-muted-foreground/30" />
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, iconBg, iconColor }: {
  icon: any; label: string; value: string | number; suffix?: string; iconBg: string; iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">
              {value}{suffix && <span className="text-xs text-muted-foreground font-normal ml-0.5">{suffix}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminHospitalOverview() {
  const { data: overview } = trpc.adminDashboard.hospitalOverview.useQuery();
  const { data: ranking } = trpc.adminDashboard.hospitalRanking.useQuery();
  const { data: channelStats } = trpc.adminDashboard.channelStats.useQuery();
  const { data: schedulerStatus } = trpc.blogScheduler.status.useQuery(undefined, { refetchInterval: 60000 });
  const utils = trpc.useUtils();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isMonthlyDiag, setIsMonthlyDiag] = useState(false);
  const [isSendingBriefing, setIsSendingBriefing] = useState(false);
  const sendBriefingNow = trpc.blogScheduler.sendBriefingNow.useMutation({ onSuccess: () => utils.blogScheduler.status.invalidate(),
  onError: (err) => toast.error(err.message) });

  const runDiagnosisMutation = trpc.adminDashboard.runAutoDiagnosis.useMutation({
    onMutate: () => setIsDiagnosing(true),
    onSuccess: (data) => {
      toast.success(`자동 진단 완료: ${data.diagnosed}/${data.total}개 병원 진단 (${data.failed}건 실패)`);
      utils.adminDashboard.hospitalOverview.invalidate();
      utils.adminDashboard.hospitalRanking.invalidate();
      setIsDiagnosing(false);
    },
    onError: () => {
      toast.error("자동 진단 실행 실패");
      setIsDiagnosing(false);
    },
  });

  const runMonthlyDiagMutation = trpc.adminDashboard.runMonthlyDiagnosis.useMutation({
    onMutate: () => setIsMonthlyDiag(true),
    onSuccess: (data) => {
      toast.success(`월간 진단 완료: ${data.diagnosed}/${data.totalUrls}개 URL (${data.failed}건 실패, ${data.skipped}건 스킵)`);
      utils.adminDashboard.hospitalOverview.invalidate();
      utils.blogScheduler.status.invalidate();
      setIsMonthlyDiag(false);
    },
    onError: () => {
      toast.error("월간 진단 실행 실패");
      setIsMonthlyDiag(false);
    },
  });

  const totalChannelVisits = channelStats?.reduce((s, c) => s + c.count, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">병원 현황 대시보드</h1>
            <p className="text-sm text-muted-foreground mt-1">전체 계약 병원 통합 현황 및 성과 분석 (최근 30일)</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runDiagnosisMutation.mutate()}
              disabled={isDiagnosing || isMonthlyDiag}
            >
              {isDiagnosing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
              {isDiagnosing ? "진단 중..." : "병원 진단"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runMonthlyDiagMutation.mutate()}
              disabled={isDiagnosing || isMonthlyDiag}
              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
            >
              {isMonthlyDiag ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CalendarDays className="w-3 h-3 mr-1" />}
              {isMonthlyDiag ? "월간 진단 중..." : "월간 전체 URL 진단"}
            </Button>
          </div>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Building2} label="전체 병원" value={overview?.totalHospitals ?? 0} iconBg="bg-blue-500/10" iconColor="text-blue-400" />
          <StatCard icon={CheckCircle2} label="활성 병원" value={overview?.activeHospitals ?? 0} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
          <StatCard icon={Users} label="총 방문 (30일)" value={overview?.totalVisits ?? 0} iconBg="bg-violet-500/10" iconColor="text-violet-400" />
          <StatCard icon={Activity} label="상담 문의 (30일)" value={overview?.totalInquiries ?? 0} iconBg="bg-amber-500/10" iconColor="text-amber-400" />
          <StatCard icon={Search} label="평균 AI 검색 점수" value={overview?.avgSeoScore ?? 0} suffix="점" iconBg="bg-cyan-500/10" iconColor="text-cyan-400" />
          <StatCard icon={TrendingUp} label="평균 AI 점수" value={overview?.avgAiScore ?? 0} suffix="점" iconBg="bg-pink-500/10" iconColor="text-pink-400" />
        </div>

        {/* 자동 진단 스케줄 상태 */}
        {schedulerStatus && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-emerald-500/10"><Zap className="h-4 w-4 text-emerald-400" /></div>
                자동 진단 스케줄
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI 검색 주간 진단</p>
                  <p className="text-sm font-medium">{schedulerStatus.autoDiagnosisSchedule || "매주 목요일 06:00 KST"}</p>
                  {schedulerStatus.lastAutoDiagnosisAt && (
                    <p className="text-[11px] text-muted-foreground">
                      마지막: {new Date(schedulerStatus.lastAutoDiagnosisAt).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">월간 전체 URL 진단</p>
                  <p className="text-sm font-medium">{(schedulerStatus as any).monthlyDiagnosisSchedule || "매월 15일 06:00 KST"}</p>
                  {(schedulerStatus as any).lastMonthlyDiagnosisAt && (
                    <p className="text-[11px] text-muted-foreground">
                      마지막: {new Date((schedulerStatus as any).lastMonthlyDiagnosisAt).toLocaleString("ko-KR")}
                    </p>
                  )}
                  {(schedulerStatus as any).lastMonthlyDiagnosisResult && (
                    <p className="text-[10px] text-muted-foreground">
                      {(schedulerStatus as any).lastMonthlyDiagnosisResult.success
                        ? `${(schedulerStatus as any).lastMonthlyDiagnosisResult.diagnosed}/${(schedulerStatus as any).lastMonthlyDiagnosisResult.totalUrls}개 진단`
                        : "실패"}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI 모니터링</p>
                  <p className="text-sm font-medium">{schedulerStatus.aiMonitorSchedule}</p>
                  {schedulerStatus.lastAiMonitorAt && (
                    <p className="text-[11px] text-muted-foreground">
                      마지막: {new Date(schedulerStatus.lastAiMonitorAt).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">주간 브리핑</p>
                  <p className="text-sm font-medium">{(schedulerStatus as any).weeklyBriefingSchedule || "매주 월요일 08:00 KST"}</p>
                  <button
                    onClick={async () => {
                      if (isSendingBriefing) return;
                      setIsSendingBriefing(true);
                      try {
                        const result = await sendBriefingNow.mutateAsync();
                        if (result.success) {
                          toast.success("주간 브리핑이 발송되었습니다");
                        } else {
                          toast.error("브리핑 발송 실패: " + result.content);
                        }
                      } catch (e: any) {
                        toast.error("브리핑 발송 오류: " + (e.message || String(e)));
                      } finally {
                        setIsSendingBriefing(false);
                      }
                    }}
                    disabled={isSendingBriefing}
                    className="mt-1 px-3 py-1 text-xs rounded-md bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {isSendingBriefing ? "발송 중..." : "지금 브리핑 보내기"}
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">스케줄러 상태</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${schedulerStatus.active ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-sm font-medium">{schedulerStatus.active ? "실행 중" : "중지됨"}</span>
                  </div>
                </div>
              </div>
              {/* 최근 히스토리 */}
              {schedulerStatus.recentHistory && schedulerStatus.recentHistory.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">최근 실행 기록</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {schedulerStatus.recentHistory.filter((h: any) => h.type === "auto_diagnosis" || h.type === "ai_monitor" || h.type === "monthly_diagnosis" || h.type === "weekly_briefing").slice(-8).map((h: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        {h.success ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                        )}
                        <Badge variant="secondary" className={`text-[9px] h-4 ${h.type === "monthly_diagnosis" ? "border-violet-500/30 text-violet-400" : ""}`}>
                          {h.type === "auto_diagnosis" ? "주간 진단" : h.type === "monthly_diagnosis" ? "월간 진단" : h.type === "weekly_briefing" ? "주간 브리핑" : "AI 모니터링"}
                        </Badge>
                        <span className="text-muted-foreground truncate">{h.detail}</span>
                        <span className="text-muted-foreground/50 ml-auto shrink-0">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 채널별 유입 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-violet-500/10"><Globe className="h-4 w-4 text-violet-400" /></div>
                전체 채널별 유입 (30일)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {channelStats && channelStats.length > 0 ? (
                <div className="space-y-2">
                  {channelStats.map((ch, i) => {
                    const pct = totalChannelVisits > 0 ? ((ch.count / totalChannelVisits) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${CHANNEL_COLORS[ch.channel] || "bg-gray-400"}`} />
                            <span className="text-[11px] font-medium">{CHANNEL_LABELS[ch.channel] || ch.channel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground tabular-nums">{ch.uniqueVisitors}명</span>
                            <span className="text-[11px] font-medium tabular-nums">{ch.count}회</span>
                            <Badge variant="secondary" className="text-[9px] h-4 tabular-nums">{pct.toFixed(1)}%</Badge>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${CHANNEL_COLORS[ch.channel] || "bg-gray-400"}`}
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Globe} message="아직 유입 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>

          {/* AI 채널 vs 전통 채널 비교 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-emerald-500/10"><TrendingUp className="h-4 w-4 text-emerald-400" /></div>
                AI vs 전통 채널 비교
              </CardTitle>
            </CardHeader>
            <CardContent>
              {channelStats && channelStats.length > 0 ? (() => {
                const aiChannels = ["chatgpt", "gemini", "claude", "perplexity", "copilot"];
                const searchChannels = ["naver", "google"];
                const snsChannels = ["instagram", "youtube", "facebook", "tiktok", "blog"];
                const aiVisits = channelStats.filter(c => aiChannels.includes(c.channel)).reduce((s, c) => s + c.count, 0);
                const searchVisits = channelStats.filter(c => searchChannels.includes(c.channel)).reduce((s, c) => s + c.count, 0);
                const snsVisits = channelStats.filter(c => snsChannels.includes(c.channel)).reduce((s, c) => s + c.count, 0);
                const directVisits = channelStats.filter(c => c.channel === "direct").reduce((s, c) => s + c.count, 0);
                const otherVisits = totalChannelVisits - aiVisits - searchVisits - snsVisits - directVisits;
                const segments = [
                  { label: "AI 채널", value: aiVisits, color: "bg-emerald-500", pct: totalChannelVisits > 0 ? (aiVisits / totalChannelVisits * 100) : 0 },
                  { label: "검색 엔진", value: searchVisits, color: "bg-blue-500", pct: totalChannelVisits > 0 ? (searchVisits / totalChannelVisits * 100) : 0 },
                  { label: "SNS", value: snsVisits, color: "bg-pink-500", pct: totalChannelVisits > 0 ? (snsVisits / totalChannelVisits * 100) : 0 },
                  { label: "직접 방문", value: directVisits, color: "bg-gray-500", pct: totalChannelVisits > 0 ? (directVisits / totalChannelVisits * 100) : 0 },
                  { label: "기타", value: otherVisits, color: "bg-gray-400", pct: totalChannelVisits > 0 ? (otherVisits / totalChannelVisits * 100) : 0 },
                ];
                return (
                  <div className="space-y-4">
                    {/* 스택 바 */}
                    <div className="h-6 rounded-full overflow-hidden flex">
                      {segments.filter(s => s.value > 0).map((s, i) => (
                        <div key={i} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.value}회 (${s.pct.toFixed(1)}%)`} />
                      ))}
                    </div>
                    {/* 범례 */}
                    <div className="grid grid-cols-2 gap-2">
                      {segments.filter(s => s.value > 0).map((s, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/10">
                          <div className={`w-3 h-3 rounded-full ${s.color}`} />
                          <div>
                            <p className="text-[11px] font-medium">{s.label}</p>
                            <p className="text-[10px] text-muted-foreground tabular-nums">{s.value}회 ({s.pct.toFixed(1)}%)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <EmptyState icon={TrendingUp} message="아직 유입 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 병원별 성과 순위 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-amber-500/10"><Activity className="h-4 w-4 text-amber-400" /></div>
              병원별 성과 순위
              <Badge variant="secondary" className="text-[10px] h-5">최근 30일</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking && ranking.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">#</th>
                      <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">병원명</th>
                      <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">진료과</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">방문수</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">고유 방문자</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">상담 문의</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">AI 검색 점수</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">AI 점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((h, i) => (
                      <tr key={h.id} className="border-b border-border/10 hover:bg-accent/10 transition-colors">
                        <td className="py-2 px-2 text-[11px] text-muted-foreground tabular-nums">
                          {i < 3 ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              i === 0 ? "bg-amber-500/20 text-amber-500" :
                              i === 1 ? "bg-gray-400/20 text-gray-400" :
                              "bg-orange-500/20 text-orange-500"
                            }`}>{i + 1}</span>
                          ) : i + 1}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium truncate max-w-[160px]">{h.hospitalName}</span>
                            <a href={h.hospitalUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                            </a>
                          </div>
                          {h.region && <span className="text-[9px] text-muted-foreground">{h.region}</span>}
                        </td>
                        <td className="py-2 px-2">
                          {h.specialty ? (
                            <Badge variant="secondary" className="text-[9px] h-4">{h.specialty}</Badge>
                          ) : <span className="text-[10px] text-muted-foreground">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center text-[11px] font-medium tabular-nums">{h.visitCount}</td>
                        <td className="py-2 px-2 text-center text-[11px] tabular-nums text-muted-foreground">{h.uniqueVisitors}</td>
                        <td className="py-2 px-2 text-center text-[11px] tabular-nums">
                          {h.inquiryCount > 0 ? (
                            <span className="font-medium text-emerald-500">{h.inquiryCount}</span>
                          ) : <span className="text-muted-foreground">0</span>}
                        </td>
                        <td className="py-2 px-2 text-center text-[11px] tabular-nums">
                          {h.seoScore !== null ? (
                            <span className={h.seoScore >= 70 ? "text-emerald-500 font-medium" : h.seoScore >= 40 ? "text-amber-500" : "text-red-500"}>
                              {h.seoScore}점
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center text-[11px] tabular-nums">
                          {h.aiScore !== null ? (
                            <span className={h.aiScore >= 70 ? "text-emerald-500 font-medium" : h.aiScore >= 40 ? "text-amber-500" : "text-red-500"}>
                              {h.aiScore}%
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Building2} message="아직 등록된 병원이 없습니다" />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

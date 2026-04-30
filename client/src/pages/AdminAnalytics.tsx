/**
 * 관리자 분석 대시보드 — 진단 트래픽, 리드 퍼널, 점수 분포, 인기 URL 등
 *
 * UX/UI 개선:
 * - 페이지 헤더 text-xl 통일
 * - 카드 헤더 아이콘 배경 통일
 * - 차트 가독성 개선 (바 차트 간격, 색상)
 * - 빈 상태 일러스트 개선
 * - 테이블 모바일 반응형 최적화
 * - 퍼널 전환율 시각적 개선
 */
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, Globe, Target,
  Activity, Award, Mail, Users, MessageSquare, Zap, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

function StatCard({ icon: Icon, label, value, suffix, iconBg, iconColor }: { icon: any; label: string; value: string | number; suffix?: string; iconBg: string; iconColor: string }) {
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

export default function AdminAnalytics() {
  const { data: stats } = trpc.adminDashboard.diagnosisStats.useQuery();
  const { data: dailyCounts } = trpc.adminDashboard.dailyCounts.useQuery();
  const { data: distribution } = trpc.adminDashboard.scoreDistribution.useQuery();
  const { data: topUrls } = trpc.adminDashboard.topUrls.useQuery();
  const { data: specialtyStats } = trpc.adminDashboard.specialtyStats.useQuery();
  const { data: regionStats } = trpc.adminDashboard.regionStats.useQuery();
  const { data: funnel } = trpc.adminDashboard.leadFunnel.useQuery();
  const { data: subscriberCount } = trpc.adminDashboard.subscriberCount.useQuery();

  // 32차: 사용자 행동 이벤트 통계
  const { data: eventStats } = trpc.userEvent.getStats.useQuery();
  // 32차: 챗봇 인사이트 통계
  const { data: chatInsightStats } = trpc.chatInsight.getStats.useQuery();
  // 32차: 리드 스코어링
  const utils = trpc.useUtils();
  const recalculateMutation = trpc.leadScoring.recalculate.useMutation({
    onSuccess: (data) => {
      toast.success(`리드 점수 재계산 완료: ${data.updated}개 업데이트`);
    },
    onError: () => toast.error("리드 점수 재계산 실패"),
  });
  // 32차: 챗봇 인사이트 추출
  const extractInsightsMutation = trpc.chatInsight.extractInsights.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.processed}개 세션 인사이트 추출 완료`);
      utils.chatInsight.getStats.invalidate();
    },
    onError: () => toast.error("인사이트 추출 실패"),
  });

  const maxDaily = Math.max(...(dailyCounts?.map(d => d.count) || [1]));
  const maxDistCount = Math.max(...(distribution?.map(d => d.count) || [1]));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">분석 대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">진단 데이터 기반 비즈니스 인사이트</p>
        </div>

        {/* 핵심 지표 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Activity} label="총 진단 수" value={stats?.total ?? 0} iconBg="bg-blue-500/10" iconColor="text-blue-400" />
          <StatCard icon={Globe} label="고유 URL" value={stats?.uniqueUrls ?? 0} iconBg="bg-violet-500/10" iconColor="text-violet-400" />
          <StatCard icon={TrendingUp} label="평균 점수" value={stats?.avgScore ?? 0} suffix="점" iconBg="bg-amber-500/10" iconColor="text-amber-400" />
          <StatCard icon={Mail} label="뉴스레터 구독자" value={subscriberCount ?? 0} iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
        </div>

        {/* 리드 전환 퍼널 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
              리드 전환 퍼널
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-28">
              {[
                { label: "진단", value: funnel?.diagnosed ?? 0, color: "bg-blue-500", lightColor: "bg-blue-500/20" },
                { label: "이메일 수집", value: funnel?.emailCollected ?? 0, color: "bg-violet-500", lightColor: "bg-violet-500/20" },
                { label: "상담 중", value: funnel?.consulting ?? 0, color: "bg-amber-500", lightColor: "bg-amber-500/20" },
                { label: "계약", value: funnel?.contracted ?? 0, color: "bg-emerald-500", lightColor: "bg-emerald-500/20" },
              ].map((step, i) => {
                const maxVal = Math.max(funnel?.diagnosed ?? 1, 1);
                const h = Math.max((step.value / maxVal) * 100, 8);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold tabular-nums">{step.value}</span>
                    <div className={`w-full rounded-t-lg ${step.color} transition-all relative`} style={{ height: `${h}%` }}>
                      <div className={`absolute inset-0 ${step.lightColor} rounded-t-lg`} />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center">{step.label}</span>
                  </div>
                );
              })}
            </div>
            {funnel && funnel.diagnosed > 0 && (
              <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>이메일 전환: <strong className="text-foreground">{((funnel.emailCollected / funnel.diagnosed) * 100).toFixed(1)}%</strong></span>
                <span>상담 전환: <strong className="text-foreground">{funnel.emailCollected > 0 ? ((funnel.consulting / funnel.emailCollected) * 100).toFixed(1) : 0}%</strong></span>
                <span>계약 전환: <strong className="text-foreground">{funnel.consulting > 0 ? ((funnel.contracted / funnel.consulting) * 100).toFixed(1) : 0}%</strong></span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 일별 진단 추이 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-blue-500/10"><BarChart3 className="h-4 w-4 text-blue-400" /></div>
                일별 진단 추이 (30일)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyCounts && dailyCounts.length > 0 ? (
                <div className="flex items-end gap-[2px] h-28">
                  {dailyCounts.map((d, i) => (
                    <div key={i} className="flex-1 group relative">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-400 transition-colors"
                        style={{ height: `${Math.max((d.count / maxDaily) * 100, 2)}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                        {d.date}: {d.count}건
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BarChart3} message="아직 진단 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>

          {/* 점수 분포 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-violet-500/10"><BarChart3 className="h-4 w-4 text-violet-400" /></div>
                점수 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distribution && distribution.length > 0 ? (
                <div className="space-y-1.5">
                  {distribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] w-12 text-right text-muted-foreground tabular-nums">{d.bucket}</span>
                      <div className="flex-1 h-5 bg-muted/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${(d.count / maxDistCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] w-7 font-medium tabular-nums">{d.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BarChart3} message="아직 진단 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 진료과별 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-purple-500/10"><Award className="h-4 w-4 text-purple-400" /></div>
                진료과별 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              {specialtyStats && specialtyStats.length > 0 ? (
                <div className="space-y-2">
                  {specialtyStats.slice(0, 10).map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-violet-500/10 text-violet-400 border-violet-500/20">{s.specialty}</Badge>
                        <span className="text-[11px] text-muted-foreground">{s.count}건</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px]">평균 <strong>{s.avgScore}점</strong></span>
                        <span className="text-[11px] text-muted-foreground">AI {s.avgAiScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Award} message="아직 진료과 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>

          {/* 지역별 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-blue-500/10"><Globe className="h-4 w-4 text-blue-400" /></div>
                지역별 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              {regionStats && regionStats.length > 0 ? (
                <div className="space-y-2">
                  {regionStats.slice(0, 10).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-blue-500/10 text-blue-400 border-blue-500/20">{r.region}</Badge>
                        <span className="text-[11px] text-muted-foreground">{r.count}건</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px]">평균 <strong>{r.avgScore}점</strong></span>
                        <span className="text-[11px] text-muted-foreground">AI {r.avgAiScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Globe} message="아직 지역 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 32차: 사용자 행동 이벤트 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-cyan-500/10"><Users className="h-4 w-4 text-cyan-400" /></div>
                사용자 행동 이벤트
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventStats && eventStats.byType.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">총 이벤트: <strong className="text-foreground">{eventStats.totalEvents}</strong></span>
                    <span className="text-xs text-muted-foreground">고유 방문자: <strong className="text-foreground">{eventStats.uniqueVisitors}</strong></span>
                  </div>
                  {eventStats.byType.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10 transition-colors">
                      <Badge variant="secondary" className="text-[10px] h-5">{e.eventType}</Badge>
                      <span className="text-[11px] font-medium tabular-nums">{e.count}건</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} message="아직 이벤트 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>

          {/* 32차: 챗봇 인사이트 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/10"><MessageSquare className="h-4 w-4 text-pink-400" /></div>
                  챗봇 인사이트
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => extractInsightsMutation.mutate()}
                  disabled={extractInsightsMutation.isPending}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {extractInsightsMutation.isPending ? "분석 중..." : "인사이트 추출"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chatInsightStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">총 세션: <strong className="text-foreground">{chatInsightStats.totalSessions}</strong></span>
                    <span className="text-xs text-muted-foreground">분석 완료: <strong className="text-foreground">{chatInsightStats.analyzedSessions}</strong></span>
                  </div>
                  {chatInsightStats.specialtyStats.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">관심 진료과</p>
                      <div className="flex flex-wrap gap-1">
                        {chatInsightStats.specialtyStats.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] h-5">{s.specialty} ({s.count})</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatInsightStats.conversionStats.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">전환 가능성</p>
                      <div className="flex flex-wrap gap-1">
                        {chatInsightStats.conversionStats.map((c, i) => (
                          <Badge key={i} variant={c.likelihood === "high" ? "default" : "secondary"} className="text-[10px] h-5">
                            {c.likelihood === "high" ? "🔥" : c.likelihood === "medium" ? "🟡" : "⚪"} {c.likelihood} ({c.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon={MessageSquare} message="아직 인사이트 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 32차: 리드 스코어링 재계산 */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
            {recalculateMutation.isPending ? "계산 중..." : "리드 점수 재계산 (행동 기반)"}
          </Button>
        </div>

        {/* 인기 진단 URL 랭킹 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-indigo-500/10"><Globe className="h-4 w-4 text-indigo-400" /></div>
              인기 진단 URL TOP 20
              <Badge variant="secondary" className="text-[10px] h-5">영업 타겟</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUrls && topUrls.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">#</th>
                      <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">URL</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">진단 횟수</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">최근 점수</th>
                      <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium">AI 점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUrls.map((u, i) => (
                      <tr key={i} className="border-b border-border/10 hover:bg-accent/10 transition-colors">
                        <td className="py-2 px-2 text-[11px] text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="py-2 px-2 text-[11px] max-w-[280px] truncate">
                          <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{u.url}</a>
                        </td>
                        <td className="py-2 px-2 text-center text-[11px] font-medium tabular-nums">{u.count}회</td>
                        <td className="py-2 px-2 text-center text-[11px] tabular-nums">{u.latestScore}점</td>
                        <td className="py-2 px-2 text-center text-[11px] tabular-nums">{u.latestAiScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Globe} message="아직 진단 데이터가 없습니다" />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { CHANNEL_LABELS, EnhancedEmptyState } from "./shared";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Users, Eye, Clock, ArrowUpRight, ArrowDownRight, Minus, Copy, BarChart3, MousePointerClick, Smartphone, Monitor, Tablet, Zap, Code, Plus, ChevronRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

function TrafficAnalysisTab({ hospitalId }: { hospitalId: number }) {
  const [dateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  });

  const { data: visitStats, isLoading: statsLoading } = trpc.analytics.visitStats.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: topPages } = trpc.analytics.topPages.useQuery({
    from: dateRange.from,
    to: dateRange.to,
    limit: 5,
  });

  const { data: dailyTrend } = trpc.analytics.dailyTrend.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: deviceStats } = trpc.analytics.deviceStats.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: aiDetail } = trpc.analytics.aiChannelDetail.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: hourlyData } = trpc.analytics.hourlyDistribution.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const hasData = visitStats && visitStats.total > 0;

  // AI 채널 합산
  const aiChannels = useMemo(() => {
    if (!visitStats?.channels) return { total: 0, unique: 0 };
    const aiRows = visitStats.channels.filter((c: any) => c.channel?.startsWith("ai_"));
    return {
      total: aiRows.reduce((s: number, r: any) => s + Number(r.count), 0),
      unique: aiRows.reduce((s: number, r: any) => s + Number(r.uniqueVisitors), 0),
    };
  }, [visitStats]);

  // 디바이스 합산
  const deviceTotal = useMemo(() => {
    if (!deviceStats) return 0;
    return deviceStats.reduce((s: number, d: any) => s + Number(d.count), 0);
  }, [deviceStats]);

  // 추적 코드 스니펫
  const trackingCode = `<script src="https://mybiseo.com/track.js" data-hospital-id="${hospitalId}"></script>`;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 추적 코드 설치 안내 (데이터 없을 때) */}
      {!hasData && (
        <Card className="bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-brand" />
              추적 코드 설치 안내
            </CardTitle>
            <CardDescription>
              아래 3단계를 따라하면 방문자 유입 채널이 자동으로 분석됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span className="text-sm text-foreground">아래 코드를 복사하세요</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-sm text-foreground">병원 웹사이트의 &lt;head&gt; 태그 안에 붙여넣기</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span className="text-sm text-foreground">설치 후 이 페이지에서 실시간 데이터 확인</span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-4 font-mono text-sm text-foreground border border-border relative">
              <code>{trackingCode}</code>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(trackingCode);
                  toast.success("추적 코드가 복사되었습니다!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-4 h-4" />총 방문수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visitStats?.total ?? 0}</div>
            <span className="text-xs text-muted-foreground">최근 30일</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" />순 방문자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visitStats?.uniqueVisitors ?? 0}</div>
            <span className="text-xs text-muted-foreground">최근 30일</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4" />AI 채널 유입
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{aiChannels.total}</div>
            <span className="text-xs text-muted-foreground">
              {visitStats?.total ? `전체의 ${Math.round((aiChannels.total / visitStats.total) * 100)}%` : "최근 30일"}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4" />채널 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visitStats?.channels?.length ?? 0}</div>
            <span className="text-xs text-muted-foreground">활성 유입 채널</span>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 유입 + AI 채널 상세 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" />채널별 유입 분석
            </CardTitle>
            <CardDescription>방문자가 어디서 오는지 한눈에 확인</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="space-y-3">
                {(visitStats?.channels ?? [])
                  .sort((a: any, b: any) => Number(b.count) - Number(a.count))
                  .map((ch: any) => {
                    const info = CHANNEL_LABELS[ch.channel] || { label: ch.channel, color: "bg-gray-500", icon: "?" };
                    const pct = visitStats?.total ? Math.round((Number(ch.count) / visitStats.total) * 100) : 0;
                    return (
                      <div key={ch.channel} className="flex items-center gap-3">
                        <span className="text-lg w-6 text-center">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{info.label}</span>
                            <span className="text-xs text-muted-foreground">{ch.count}회 ({pct}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${info.color} transition-all`} style={{ width: `${Math.max(pct, 3)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EnhancedEmptyState icon={BarChart3} title="아직 유입 데이터가 없습니다" description="추적 코드를 설치하면 방문자 유입 채널이 자동으로 분석됩니다" steps={['추적 코드 복사', '웹사이트에 설치', '유입 데이터 자동 수집']} />
            )}
          </CardContent>
        </Card>

        {/* AI 채널 상세 분석 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand" />AI 채널 상세 분석
            </CardTitle>
            <CardDescription>AI 검색 엔진별 유입 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {aiDetail && aiDetail.length > 0 ? (
              <div className="space-y-4">
                {aiDetail.map((ai: any) => {
                  const info = CHANNEL_LABELS[ai.channel] || { label: ai.channel, icon: "🤖" };
                  return (
                    <div key={ai.channel} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{info.label}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">방문 <span className="font-bold text-foreground">{ai.count}</span>회</span>
                          <span className="text-xs text-muted-foreground">순방문자 <span className="font-bold text-foreground">{ai.uniqueVisitors}</span>명</span>
                          <span className="text-xs text-muted-foreground">평균체류 <span className="font-bold text-foreground">{Math.round(Number(ai.avgDuration))}</span>초</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={Zap} title="AI 채널 유입 데이터가 없습니다" description="ChatGPT, Gemini, Claude 등에서 병원이 추천되면 여기에 표시됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 인기 페이지 TOP 5 + 디바이스별 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-brand" />인기 페이지 TOP 5
            </CardTitle>
            <CardDescription>가장 많이 방문한 페이지</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages && topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? "bg-brand text-background" : "text-muted-foreground bg-muted"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.pageTitle || p.pageUrl}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.pageUrl}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{p.views}</p>
                      <p className="text-[10px] text-muted-foreground">{p.uniqueVisitors}명</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EnhancedEmptyState icon={Eye} title="페이지 데이터가 없습니다" description="추적 코드 설치 후 데이터가 수집됩니다" />
            )}
          </CardContent>
        </Card>

        {/* 디바이스별 방문 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-brand" />디바이스별 방문
            </CardTitle>
            <CardDescription>모바일 vs 데스크톱 vs 태블릿</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceStats && deviceStats.length > 0 ? (
              <div className="space-y-4">
                {deviceStats.map((d: any) => {
                  const pct = deviceTotal > 0 ? Math.round((Number(d.count) / deviceTotal) * 100) : 0;
                  const deviceInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
                    mobile: { label: "모바일", icon: <Smartphone className="w-5 h-5" />, color: "bg-blue-500" },
                    desktop: { label: "데스크톱", icon: <Monitor className="w-5 h-5" />, color: "bg-emerald-500" },
                    tablet: { label: "태블릿", icon: <Tablet className="w-5 h-5" />, color: "bg-purple-500" },
                  };
                  const info = deviceInfo[d.deviceType] || { label: d.deviceType, icon: <Monitor className="w-5 h-5" />, color: "bg-gray-500" };
                  return (
                    <div key={d.deviceType} className="flex items-center gap-3">
                      <div className="text-muted-foreground">{info.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{info.label}</span>
                          <span className="text-xs text-muted-foreground">{d.count}회 ({pct}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${info.color} transition-all`} style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={Smartphone} title="디바이스 데이터가 없습니다" description="추적 코드 설치 후 데이터가 수집됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 일별 방문 추이 + 시간대별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" />일별 방문 추이
            </CardTitle>
            <CardDescription>최근 30일 일별 방문자 수</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyTrend && dailyTrend.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-[2px] h-32">
                  {dailyTrend.map((d: any, i: number) => {
                    const maxVal = Math.max(...dailyTrend.map((x: any) => Number(x.total)), 1);
                    const height = Math.max(4, (Number(d.total) / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.total}회 방문`}>
                        <div className="w-full rounded-t bg-brand/70 hover:bg-brand transition-all" style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{dailyTrend[0]?.date}</span>
                  <span>{dailyTrend[dailyTrend.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <EnhancedEmptyState icon={TrendingUp} title="추이 데이터가 없습니다" description="추적 코드 설치 후 일별 추이가 표시됩니다" />
            )}
          </CardContent>
        </Card>

        {/* 시간대별 방문 분포 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand" />시간대별 방문 분포
            </CardTitle>
            <CardDescription>환자들이 언제 방문하는지 확인</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyData && hourlyData.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-[2px] h-32">
                  {Array.from({ length: 24 }, (_, h) => {
                    const found = hourlyData.find((d: any) => Number(d.hour) === h);
                    const count = found ? Number(found.count) : 0;
                    const maxVal = Math.max(...hourlyData.map((x: any) => Number(x.count)), 1);
                    const height = count > 0 ? Math.max(4, (count / maxVal) * 100) : 2;
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center" title={`${h}시: ${count}회`}>
                        <div className={`w-full rounded-t transition-all ${count > 0 ? "bg-brand/70 hover:bg-brand" : "bg-muted/30"}`} style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0시</span>
                  <span>6시</span>
                  <span>12시</span>
                  <span>18시</span>
                  <span>24시</span>
                </div>
              </div>
            ) : (
              <EnhancedEmptyState icon={Clock} title="시간대 데이터가 없습니다" description="추적 코드 설치 후 데이터가 수집됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 방문자 행동 퍼널 */}
      <VisitorFunnelCard />

      {/* 추적 코드 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4 text-brand" />추적 코드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs text-foreground relative">
            <code>{trackingCode}</code>
            <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(trackingCode); toast.success("복사됨!"); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 탭 3: 상담 문의 관리
// ═══════════════════════════════════════════════════════════════


function VisitorFunnelCard() {
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);
  const today = useMemo(() => new Date().toISOString(), []);
  const { data: funnel } = trpc.analytics.visitorFunnel.useQuery({ from: thirtyDaysAgo, to: today });

  if (!funnel || funnel.totalVisitors === 0) return null;

  const steps = [
    { label: "웹사이트 방문", value: funnel.totalVisitors, color: "bg-blue-500" },
    { label: "2페이지 이상 탐색", value: funnel.multiPageViewers, color: "bg-brand" },
    { label: "상담 문의 제출", value: funnel.inquirySubmitters, color: "bg-emerald-500" },
  ];
  const maxVal = steps[0].value || 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-brand" />방문자 행동 퍼널 <span className="text-xs text-muted-foreground font-normal">최근 30일</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const pct = maxVal > 0 ? Math.round((step.value / maxVal) * 100) : 0;
            const convFromPrev = i > 0 && steps[i - 1].value > 0
              ? Math.round((step.value / steps[i - 1].value) * 100)
              : null;
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}명</span>
                    {convFromPrev !== null && (
                      <span className="text-xs text-muted-foreground">({convFromPrev}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  >
                    {pct >= 15 && <span className="text-[10px] text-white font-medium">{pct}%</span>}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* 전체 전환율 */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">방문 → 상담 전환율</span>
          <span className="text-sm font-bold text-brand">
            {funnel.totalVisitors > 0 ? ((funnel.inquirySubmitters / funnel.totalVisitors) * 100).toFixed(1) : "0"}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
export default TrafficAnalysisTab;

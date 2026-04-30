/**
 * 관리자 — 기능 4: SEO 대시보드
 * 블로그 성과 측정 + 인기글 TOP10 + 카테고리별 통계 + 전환율 추적
 *
 * UX/UI 개선:
 * - 메트릭 카드 아이콘 배경 + 라벨 위치 통일
 * - 인기글 순위 뱃지 스타일 개선 (금/은/동)
 * - 카테고리별 프로그레스 바 색상 다양화
 * - 빈 상태 일러스트 개선
 * - 전환율 시각화 강화
 * - 모바일 반응형 최적화
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Eye, FileText, TrendingUp, Users, Loader2, Target,
  ArrowRight, Crown, Medal, Award,
} from "lucide-react";

export default function AdminSEO() {
  return (
    <DashboardLayout>
      <SEODashboardContent />
    </DashboardLayout>
  );
}

function SEODashboardContent() {
  const statsQuery = trpc.seoDashboard.stats.useQuery();
  const topPostsQuery = trpc.seoDashboard.topPosts.useQuery();
  const categoryStatsQuery = trpc.seoDashboard.categoryStats.useQuery();
  const conversionQuery = trpc.seoDashboard.inquiryConversion.useQuery();

  const stats = statsQuery.data;
  const topPosts = topPostsQuery.data ?? [];
  const categoryStats = categoryStatsQuery.data ?? [];
  const conversion = conversionQuery.data;

  const isLoading = statsQuery.isLoading || topPostsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
      </div>
    );
  }

  const publishedCount = (stats?.totalPosts ?? 0) - (stats?.draftCount ?? 0) - (stats?.scheduledCount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">검색 노출 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">블로그 성과와 검색 유입 현황을 한눈에 확인하세요</p>
      </div>

      {/* ─── 핵심 지표 카드 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={FileText}
          label="총 블로그 글"
          value={stats?.totalPosts ?? 0}
          suffix="개"
          subLabel={`발행 ${publishedCount} · 초안 ${stats?.draftCount ?? 0}`}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
        />
        <MetricCard
          icon={Eye}
          label="총 조회수"
          value={stats?.totalViews ?? 0}
          suffix="회"
          subLabel={`글당 평균 ${stats?.totalPosts ? Math.round((stats?.totalViews ?? 0) / stats.totalPosts) : 0}회`}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
        />
        <MetricCard
          icon={Users}
          label="총 문의"
          value={conversion?.totalInquiries ?? 0}
          suffix="건"
          subLabel="무료 상담 신청"
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
        />
        <MetricCard
          icon={Target}
          label="전환율"
          value={conversion?.conversionRate ?? "0.00"}
          suffix="%"
          subLabel="조회 → 문의 전환"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
        />
      </div>

      {/* ─── 전환 퍼널 미니 ─── */}
      {conversion && (conversion.totalInquiries ?? 0) > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">전환 흐름</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 text-center p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-lg font-bold text-blue-400">{stats?.totalViews ?? 0}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">총 조회</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 text-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <p className="text-lg font-bold text-purple-400">{conversion.totalInquiries}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">문의 전환</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 text-center p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <p className="text-lg font-bold text-orange-400">{conversion.conversionRate}%</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">전환율</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── 인기글 TOP 10 ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              인기글 TOP 10
            </CardTitle>
            <CardDescription className="text-xs">조회수 기준 상위 10개 블로그 글</CardDescription>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <EmptyState icon={TrendingUp} message="아직 블로그 글이 없습니다" sub="블로그 AI 생성에서 글을 작성해보세요" />
            ) : (
              <div className="space-y-1.5">
                {topPosts.map((post: any, index: number) => {
                  const rankColors = [
                    "bg-amber-500 text-amber-950",
                    "bg-slate-400 text-slate-950",
                    "bg-orange-600 text-orange-50",
                  ];
                  return (
                    <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/10 transition-colors group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        index < 3 ? rankColors[index] : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{post.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {post.published === "published" ? "발행됨" : "초안"} · {post.readingTime ?? 5}분 읽기
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold shrink-0 tabular-nums">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
                        {(post.viewCount ?? 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 카테고리별 성과 ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <BarChart3 className="h-4 w-4 text-violet-400" />
              </div>
              카테고리별 성과
            </CardTitle>
            <CardDescription className="text-xs">카테고리별 글 수와 총 조회수</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <EmptyState icon={BarChart3} message="카테고리 데이터가 없습니다" sub="블로그 관리에서 카테고리를 추가해보세요" />
            ) : (
              <div className="space-y-3">
                {categoryStats.map((cat: any, i: number) => {
                  const maxViews = Math.max(...categoryStats.map((c: any) => c.totalViews || 1));
                  const percentage = ((cat.totalViews ?? 0) / maxViews) * 100;
                  const barColors = [
                    "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500",
                    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500",
                  ];

                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">{cat.postCount}개</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm tabular-nums">
                          <Eye className="h-3 w-3 text-muted-foreground/50" />
                          <span className="font-medium">{(cat.totalViews ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColors[i % barColors.length]}`}
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 콘텐츠 자동화 현황 요약 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">콘텐츠 자동화 현황</CardTitle>
          <CardDescription className="text-xs">MY비서 검색 노출 콘텐츠 자동화 시스템 운영 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats?.totalPosts ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-1">총 블로그 글</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-2xl font-bold text-emerald-400">{publishedCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">발행된 글</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats?.draftCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-1">초안 대기</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── 메트릭 카드 컴포넌트 ─── */
function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  subLabel,
  iconBg,
  iconColor,
}: {
  icon: any;
  label: string;
  value: number | string;
  suffix: string;
  subLabel: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">
              {typeof value === "number" ? value.toLocaleString() : value}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">{suffix}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{subLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 빈 상태 컴포넌트 ─── */
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

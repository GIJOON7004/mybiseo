/**
 * 33차: 경쟁사 비교 대시보드
 * - AI 모니터링 데이터 기반 우리 병원 vs 경쟁사 비교
 * - 키워드별 언급률 비교 차트
 * - 플랫폼별 경쟁 현황
 * - 시계열 트렌드 비교
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Users, TrendingUp, BarChart3, Shield, Target,
  ArrowUp, ArrowDown, Minus, Swords, Crown, Medal,
} from "lucide-react";

const PLATFORMS = ["chatgpt", "gemini", "claude", "perplexity", "grok"];
const platformColors: Record<string, string> = {
  chatgpt: "bg-emerald-500",
  gemini: "bg-blue-500",
  claude: "bg-orange-500",
  perplexity: "bg-purple-500",
  grok: "bg-red-500",
};
const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
  grok: "Grok",
};

function MentionBar({ rate, color, label }: { rate: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>
      <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono w-10 text-right">{rate}%</span>
    </div>
  );
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) return <span className="text-emerald-400 flex items-center gap-0.5 text-xs"><ArrowUp className="h-3 w-3" />+{value}%</span>;
  if (value < 0) return <span className="text-red-400 flex items-center gap-0.5 text-xs"><ArrowDown className="h-3 w-3" />{value}%</span>;
  return <span className="text-muted-foreground flex items-center gap-0.5 text-xs"><Minus className="h-3 w-3" />0%</span>;
}

export default function AdminCompetitorDashboard() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>("all");
  
  // 데이터 조회
  const comparisonQuery = trpc.competitorAnalysis.getComparison.useQuery(
    selectedKeywordId !== "all" ? { keywordId: Number(selectedKeywordId) } : undefined
  );
  const comparison = comparisonQuery.data;
  
  const trendKeywordId = selectedKeywordId !== "all" ? Number(selectedKeywordId) : null;
  const trendQuery = trpc.competitorAnalysis.getTrend.useQuery(
    { keywordId: trendKeywordId!, weeks: 8 },
    { enabled: trendKeywordId !== null }
  );
  const trendData = trendQuery.data ?? [];
  
  // 전체 요약 통계
  const summary = useMemo(() => {
    if (!comparison?.comparison) return null;
    const items = comparison.comparison;
    const avgMentionRate = items.length > 0
      ? Math.round(items.reduce((s, c) => s + c.ourMentionRate, 0) / items.length) : 0;
    
    // 전체 경쟁사 중 가장 많이 언급되는 경쟁사
    const competitorTotals: Record<string, number> = {};
    for (const item of items) {
      for (const ca of item.competitorAnalysis) {
        competitorTotals[ca.name] = (competitorTotals[ca.name] || 0) + ca.mentionCount;
      }
    }
    const topCompetitor = Object.entries(competitorTotals).sort((a, b) => b[1] - a[1])[0];
    
    // 우리가 가장 강한 키워드
    const bestKeyword = items.reduce((best, item) =>
      item.ourMentionRate > (best?.ourMentionRate ?? 0) ? item : best, items[0]);
    
    // 우리가 가장 약한 키워드
    const worstKeyword = items.reduce((worst, item) =>
      item.ourMentionRate < (worst?.ourMentionRate ?? 100) ? item : worst, items[0]);
    
    return { avgMentionRate, topCompetitor, bestKeyword, worstKeyword, totalKeywords: items.length };
  }, [comparison]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Swords className="h-7 w-7 text-red-400" />
              경쟁사 비교 대시보드
            </h1>
            <p className="text-muted-foreground mt-1">
              AI 모니터링 데이터 기반 — 우리 병원 vs 경쟁사 AI 인용 비교 분석
            </p>
          </div>
          <Select value={selectedKeywordId} onValueChange={setSelectedKeywordId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="키워드 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 키워드</SelectItem>
              {comparison?.keywords.map(kw => (
                <SelectItem key={kw.id} value={String(kw.id)}>
                  {kw.keyword} ({kw.hospitalName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 요약 카드 */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">평균 언급률</p>
                    <p className="text-2xl font-bold">{summary.avgMentionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">최대 경쟁사</p>
                    <p className="text-lg font-bold truncate">{summary.topCompetitor?.[0] ?? "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">최강 키워드</p>
                    <p className="text-sm font-bold truncate">{summary.bestKeyword?.keyword ?? "-"}</p>
                    <p className="text-xs text-emerald-400">{summary.bestKeyword?.ourMentionRate ?? 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">개선 필요</p>
                    <p className="text-sm font-bold truncate">{summary.worstKeyword?.keyword ?? "-"}</p>
                    <p className="text-xs text-red-400">{summary.worstKeyword?.ourMentionRate ?? 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 키워드별 경쟁사 비교 */}
        {comparison?.comparison && comparison.comparison.length > 0 ? (
          <div className="space-y-4">
            {comparison.comparison.map((item) => (
              <Card key={item.keywordId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        {item.keyword}
                        {item.specialty && <Badge variant="outline" className="text-[10px]">{item.specialty}</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {item.hospitalName} — 총 {item.totalChecks}회 모니터링
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{item.ourMentionRate}%</div>
                      <div className="text-xs text-muted-foreground">우리 병원 언급률</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 왼쪽: 우리 병원 vs 경쟁사 언급률 비교 */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                        <Medal className="h-4 w-4 text-amber-400" /> 언급률 비교
                      </h4>
                      <div className="space-y-2">
                        <MentionBar rate={item.ourMentionRate} color="bg-emerald-500" label={item.hospitalName} />
                        {item.competitorAnalysis
                          .sort((a, b) => b.mentionRate - a.mentionRate)
                          .map((ca) => (
                            <MentionBar key={ca.id} rate={ca.mentionRate} color="bg-red-400/70" label={ca.name} />
                          ))}
                        {item.competitorAnalysis.length === 0 && (
                          <p className="text-xs text-muted-foreground">등록된 경쟁사가 없습니다. AI 모니터링에서 경쟁사를 추가하세요.</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 오른쪽: 플랫폼별 우리 병원 언급률 */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-blue-400" /> 플랫폼별 노출
                      </h4>
                      <div className="space-y-2">
                        {PLATFORMS.map((p) => {
                          const stat = item.platformStats[p];
                          if (!stat) return null;
                          return (
                            <MentionBar
                              key={p}
                              rate={stat.rate}
                              color={platformColors[p]}
                              label={platformLabels[p]}
                            />
                          );
                        })}
                        {Object.keys(item.platformStats).length === 0 && (
                          <p className="text-xs text-muted-foreground">아직 모니터링 데이터가 없습니다</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 감성 분석 */}
                  {(item.sentimentCounts.positive > 0 || item.sentimentCounts.neutral > 0 || item.sentimentCounts.negative > 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">감성 분석 (우리 병원 언급 시)</h4>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          <span className="text-xs">긍정 {item.sentimentCounts.positive}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-gray-400" />
                          <span className="text-xs">중립 {item.sentimentCounts.neutral}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <span className="text-xs">부정 {item.sentimentCounts.negative}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 경쟁사 비교 데이터가 없습니다</p>
              <p className="text-sm mt-1">AI 모니터링을 실행하고 경쟁사를 등록하면 비교 분석이 시작됩니다</p>
            </CardContent>
          </Card>
        )}

        {/* 시계열 트렌드 (특정 키워드 선택 시) */}
        {trendKeywordId && trendData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                주간 트렌드 비교
              </CardTitle>
              <CardDescription>최근 8주간 우리 병원 vs 경쟁사 AI 검색 언급률 추이</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendData.map((week) => (
                  <div key={week.week} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{week.week}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs w-16">우리 병원</span>
                        <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(week.ourMentionRate, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono w-10 text-right">{week.ourMentionRate}%</span>
                      </div>
                      {Object.entries(week.competitorRates).map(([name, rate]) => (
                        <div key={name} className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs w-16 truncate text-muted-foreground">{name}</span>
                          <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400/60 rounded-full transition-all"
                              style={{ width: `${Math.min(rate as number, 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono w-10 text-right text-muted-foreground">{rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

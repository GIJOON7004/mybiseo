/**
 * LLM 비용 모니터링 대시보드 — 관리자 전용
 * - 일별 토큰 사용량 차트
 * - 모듈별 사용량 비교
 * - 캐시 효율 통계
 * - 비용 추정 (GPT-4o 기준)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins, Zap, Database, TrendingDown, Clock, Activity,
  Loader2, AlertCircle, BarChart3, Layers,
} from "lucide-react";

export default function AdminLLMMonitor() {
  const [days, setDays] = useState(30);

  const { data: cacheStats, isLoading: loadingCache } = trpc.llmMonitor.cacheStats.useQuery();
  const { data: dailyUsage, isLoading: loadingDaily } = trpc.llmMonitor.dailyUsage.useQuery({ days });
  const { data: callerUsage, isLoading: loadingCaller } = trpc.llmMonitor.usageByCaller.useQuery({ days: 7 });
  const { data: costEstimate, isLoading: loadingCost } = trpc.llmMonitor.costEstimate.useQuery({ days });
  const { data: recentLogs, isLoading: loadingLogs } = trpc.llmMonitor.recentLogs.useQuery({ limit: 20 });

  const isLoading = loadingCache || loadingDaily || loadingCaller || loadingCost;
  const hasError = !isLoading && !cacheStats && !dailyUsage && !callerUsage && !costEstimate;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              LLM 비용 모니터링
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              토큰 사용량, 캐시 효율, 비용 추정을 실시간으로 모니터링합니다.
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  days === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">데이터 로딩 중...</span>
          </div>
        ) : hasError ? (
          <Card className="border-red-500/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-foreground font-medium">데이터를 불러올 수 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">서버 연결을 확인하거나 잠시 후 다시 시도해주세요.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                재시도
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 요약 카드 4개 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-amber-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">추정 비용 ({days}일)</p>
                      <p className="text-lg font-bold text-foreground">
                        ${costEstimate?.totalCost?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">캐싱 절감</p>
                      <p className="text-lg font-bold text-foreground">
                        ${costEstimate?.savedByCaching?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">총 토큰</p>
                      <p className="text-lg font-bold text-foreground">
                        {dailyUsage?.reduce((sum, d) => sum + (d.totalTokens || 0), 0)?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Database className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">캐시 히트율</p>
                      <p className="text-lg font-bold text-foreground">
                        {cacheStats?.hitRate
                          ? `${(cacheStats.hitRate * 100).toFixed(1)}%`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 캐시 상태 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  실시간 캐시 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cacheStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">캐시 크기</p>
                      <p className="text-lg font-semibold">{(cacheStats.l1Size + cacheStats.l2Size)} / {(cacheStats.l1MaxSize + cacheStats.l2MaxSize)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">히트</p>
                      <p className="text-lg font-semibold text-emerald-400">{cacheStats.l1Hits + cacheStats.l2Hits}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">미스</p>
                      <p className="text-lg font-semibold text-amber-400">{cacheStats.misses}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">절감 토큰</p>
                      <p className="text-lg font-semibold text-blue-400">{cacheStats.totalTokens?.toLocaleString() || 0}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">퇴출</p>
                      <p className="text-lg font-semibold">{cacheStats.evictions}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    캐시 데이터 없음
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 일별 사용량 테이블 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  일별 사용량 (최근 {days}일)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyUsage && dailyUsage.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">날짜</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">호출 수</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">총 토큰</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">캐시 히트</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">평균 응답(ms)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyUsage.slice(0, 14).map((row) => (
                          <tr key={row.date} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 px-3 font-mono text-xs">{row.date}</td>
                            <td className="py-2 px-3 text-right">{row.totalCalls?.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">{row.totalTokens?.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">
                              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                                {row.cachedCalls || 0}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
                              {row.avgDurationMs ? Math.round(row.avgDurationMs) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {dailyUsage.length > 14 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        + {dailyUsage.length - 14}일 더 있음
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <p>아직 사용량 데이터가 없습니다.</p>
                    <p className="text-xs mt-1">LLM 호출이 발생하면 여기에 표시됩니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 모듈별 사용량 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  모듈별 사용량 (최근 7일)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {callerUsage && callerUsage.length > 0 ? (
                  <div className="space-y-3">
                    {callerUsage.map((row) => {
                      const maxTokens = callerUsage[0]?.totalTokens || 1;
                      const pct = Math.round(((row.totalTokens || 0) / maxTokens) * 100);
                      return (
                        <div key={row.caller} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{row.caller || "unknown"}</span>
                            <span className="text-muted-foreground">
                              {row.totalCalls}회 · {row.totalTokens?.toLocaleString()} 토큰
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Layers className="w-8 h-8 mb-2 opacity-50" />
                    <p>모듈별 데이터가 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 최근 호출 로그 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  최근 호출 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentLogs && recentLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-muted-foreground">시간</th>
                          <th className="text-left py-2 px-2 text-muted-foreground">모듈</th>
                          <th className="text-right py-2 px-2 text-muted-foreground">토큰</th>
                          <th className="text-right py-2 px-2 text-muted-foreground">응답(ms)</th>
                          <th className="text-center py-2 px-2 text-muted-foreground">캐시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLogs.map((log, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                            <td className="py-1.5 px-2 font-mono text-muted-foreground">
                              {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("ko-KR") : "-"}
                            </td>
                            <td className="py-1.5 px-2">
                              <Badge variant="outline" className="text-xs">
                                {log.caller || "unknown"}
                              </Badge>
                            </td>
                            <td className="py-1.5 px-2 text-right">{log.totalTokens?.toLocaleString()}</td>
                            <td className="py-1.5 px-2 text-right">{log.durationMs || "-"}</td>
                            <td className="py-1.5 px-2 text-center">
                              {log.cached ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">HIT</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">MISS</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Clock className="w-6 h-6 mb-2 opacity-50" />
                    <p>최근 호출 기록이 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

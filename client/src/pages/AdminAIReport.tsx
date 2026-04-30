/**
 * AI 인용 개선 리포트 페이지 — 관리자 전용
 * - 키워드별/종합 AI 인용 개선 리포트 자동 생성
 * - 리포트 목록 조회 및 상세 보기
 * - 우선순위별 개선 권고사항
 * - 플랫폼별 분석 + 경쟁사 인사이트
 *
 * UX/UI 개선:
 * - 페이지 헤더 text-xl 통일
 * - 카드 헤더 아이콘 배경 통일
 * - 빈 상태 일러스트 개선
 * - 리포트 상세 가독성 개선
 * - 모바일 반응형 최적화
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import {
  ClipboardList, FileText, Loader2, ArrowLeft, Sparkles, Target,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Zap,
  BarChart3, Users, Eye, Trash2, Calendar,
} from "lucide-react";

const platformLabels: Record<string, string> = {
  chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity", grok: "Grok",
};
const platformColors: Record<string, string> = {
  chatgpt: "#34d399", gemini: "#60a5fa", claude: "#fb923c", perplexity: "#a78bfa", grok: "#f87171",
};
const priorityConfig = {
  high: { label: "긴급", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
  medium: { label: "중요", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Target },
  low: { label: "참고", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
};

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

const getScoreColor = (score: number) => score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
const getScoreLabel = (score: number) => score >= 80 ? "우수" : score >= 60 ? "양호" : score >= 40 ? "보통" : score >= 20 ? "미흡" : "개선 필요";

/* ═══════════════════════════════════════════════════ */
/* 리포트 상세 뷰                                       */
/* ═══════════════════════════════════════════════════ */
function ReportDetail({ reportId }: { reportId: number }) {
  const [, setLocation] = useLocation();
  const [expandedRecs, setExpandedRecs] = useState<Set<number>>(new Set());
  const reportQuery = trpc.aiMonitor.getReportById.useQuery({ id: reportId });

  if (reportQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const report = reportQuery.data;
  if (!report) {
    return (
      <DashboardLayout>
        <EmptyState icon={ClipboardList} message="리포트를 찾을 수 없습니다" sub="삭제되었거나 존재하지 않는 리포트입니다" />
        <div className="text-center mt-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/ai-report")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />목록으로
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const recommendations = report.recommendations || [];
  const platformAnalysis = report.platformAnalysis || [];
  const competitorInsights = report.competitorInsights || [];
  const toggleRec = (idx: number) => {
    setExpandedRecs(prev => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/ai-report")} className="h-8 w-8 p-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{report.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(report.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 생성
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
              {report.overallScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
            </div>
            <p className={`text-xs ${getScoreColor(report.overallScore)}`}>{getScoreLabel(report.overallScore)}</p>
          </div>
        </div>

        {/* 요약 */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{report.summary}</p>
          </CardContent>
        </Card>

        {/* 종합 점수 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3.5 text-center">
              <div className={`text-3xl font-bold ${getScoreColor(report.overallScore)}`}>{report.overallScore}</div>
              <p className="text-[10px] text-muted-foreground mt-1">종합 점수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3.5 text-center">
              <div className="text-xl font-bold text-red-400">{recommendations.filter((r: any) => r.priority === "high").length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">긴급 개선</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3.5 text-center">
              <div className="text-xl font-bold text-amber-400">{recommendations.filter((r: any) => r.priority === "medium").length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">중요 개선</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3.5 text-center">
              <div className="text-xl font-bold text-blue-400">{recommendations.filter((r: any) => r.priority === "low").length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">참고 사항</p>
            </CardContent>
          </Card>
        </div>

        {/* 플랫폼별 분석 */}
        {platformAnalysis.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-indigo-500/10"><BarChart3 className="w-4 h-4 text-indigo-400" /></div>
                플랫폼별 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {platformAnalysis.map((pa: any) => {
                  const color = platformColors[pa.platform] || "#888";
                  const isOk = pa.status === "mentioned";
                  return (
                    <div key={pa.platform} className="p-3.5 rounded-xl border" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-sm" style={{ color }}>{platformLabels[pa.platform] || pa.platform}</span>
                        {isOk ? (
                          <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">언급됨</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-red-500/10 text-red-400 border-red-500/20">미언급</Badge>
                        )}
                        {pa.rank && <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/10 text-amber-400 border-amber-500/20">{pa.rank}위</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{pa.analysis}</p>
                      <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-primary font-medium">개선 팁</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{pa.improvementTip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 개선 권고사항 */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-amber-500/10"><Zap className="w-4 h-4 text-amber-400" /></div>
                개선 권고사항
                <Badge variant="secondary" className="text-xs">{recommendations.length}건</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((rec: any, idx: number) => {
                  const config = priorityConfig[rec.priority as keyof typeof priorityConfig] || priorityConfig.low;
                  const Icon = config.icon;
                  const isExpanded = expandedRecs.has(idx);
                  return (
                    <div key={idx} className={`rounded-xl border p-3.5 ${config.color}`}>
                      <div className="flex items-start gap-2.5 cursor-pointer" onClick={() => toggleRec(idx)}>
                        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium">{config.label}</span>
                            <span className="text-[10px] opacity-70">{rec.category}</span>
                          </div>
                          <h3 className="font-medium text-sm mt-1">{rec.title}</h3>
                          {!isExpanded && <p className="text-xs opacity-70 mt-0.5 line-clamp-1">{rec.description}</p>}
                        </div>
                        <button className="shrink-0 mt-1">{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 ml-6.5 space-y-2.5">
                          <p className="text-sm opacity-90">{rec.description}</p>
                          <div className="p-2.5 rounded-lg bg-background/50 border border-border/30">
                            <p className="text-[10px] font-medium mb-1">예상 효과</p>
                            <p className="text-xs">{rec.expectedImpact}</p>
                          </div>
                          {rec.actionItems && rec.actionItems.length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium mb-1.5">실행 항목</p>
                              <ul className="space-y-1">
                                {rec.actionItems.map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs">
                                    <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 경쟁사 인사이트 */}
        {competitorInsights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-purple-500/10"><Users className="w-4 h-4 text-purple-400" /></div>
                경쟁사 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitorInsights.map((ci: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-medium text-sm text-purple-300">{ci.competitorName}</span>
                      {ci.mentionedPlatforms && ci.mentionedPlatforms.length > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {ci.mentionedPlatforms.map((p: string) => platformLabels[p] || p).join(", ")}에서 언급
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{ci.comparison}</p>
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/10">
                      <p className="text-[10px] text-purple-400 font-medium">대응 전략</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ci.strategy}</p>
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

/* ═══════════════════════════════════════════════════ */
/* 리포트 목록 + 생성                                   */
/* ═══════════════════════════════════════════════════ */
function ReportList() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const keywordsQuery = trpc.aiMonitor.getKeywords.useQuery({ activeOnly: false });
  const reportsQuery = trpc.aiMonitor.getReports.useQuery({});
  const generateMutation = trpc.aiMonitor.generateReport.useMutation({
    onSuccess: (data: any) => { toast.success(`리포트 생성 완료: ${data.title}`); utils.aiMonitor.getReports.invalidate(); if (data.id) setLocation(`/admin/ai-report/${data.id}`); },
    onError: (err: any) => toast.error(err.message || "리포트 생성에 실패했습니다"),
  });
  const generateOverallMutation = trpc.aiMonitor.generateOverallReport.useMutation({
    onSuccess: (data: any) => { toast.success("종합 리포트 생성 완료"); utils.aiMonitor.getReports.invalidate(); if (data.id) setLocation(`/admin/ai-report/${data.id}`); },
    onError: (err: any) => toast.error(err.message || "종합 리포트 생성에 실패했습니다"),
  });
  const deleteMutation = trpc.aiMonitor.deleteReport.useMutation({
    onSuccess: () => { toast.success("리포트가 삭제되었습니다"); utils.aiMonitor.getReports.invalidate(); },
  });

  const keywords = keywordsQuery.data || [];
  const reports = reportsQuery.data || [];
  const isGenerating = generateMutation.isPending || generateOverallMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI 인용 개선 리포트</h1>
          <p className="text-sm text-muted-foreground mt-1">AI 검색 모니터링 결과를 분석하여 맞춤형 개선 방안을 자동 생성합니다</p>
        </div>

        {/* 리포트 생성 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary/10"><Sparkles className="w-4 h-4 text-primary" /></div>
              리포트 생성
            </CardTitle>
            <CardDescription className="text-xs">모니터링 데이터를 기반으로 AI가 개선 리포트를 자동 생성합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 종합 리포트 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="p-1.5 rounded-lg bg-primary/10"><Sparkles className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-medium">종합 AI 인용 개선 리포트</p>
                  <p className="text-xs text-muted-foreground">모든 키워드의 모니터링 결과를 종합 분석합니다</p>
                </div>
              </div>
              <Button size="sm" onClick={() => generateOverallMutation.mutate()} disabled={isGenerating} className="h-9 shrink-0">
                {generateOverallMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />생성 중...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />종합 리포트 생성</>}
              </Button>
            </div>

            {/* 키워드별 리포트 */}
            {keywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">키워드별 리포트 생성</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {keywords.map(kw => (
                    <div key={kw.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 hover:bg-accent/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{kw.keyword}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{kw.hospitalName}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0"
                        onClick={() => generateMutation.mutate({ keywordId: kw.id })} disabled={isGenerating}>
                        {generateMutation.isPending && generateMutation.variables?.keywordId === kw.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 리포트 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-slate-500/10"><ClipboardList className="w-4 h-4 text-slate-400" /></div>
              생성된 리포트
              {reports.length > 0 && <Badge variant="secondary" className="text-xs">{reports.length}건</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <EmptyState icon={ClipboardList} message="아직 생성된 리포트가 없습니다" sub="위에서 종합 리포트 또는 키워드별 리포트를 생성해 보세요" />
            ) : (
              <div className="space-y-2">
                {reports.map((report: any) => (
                  <div key={report.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 hover:bg-accent/10 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/admin/ai-report/${report.id}`)}>
                    <div className={`text-xl font-bold w-12 text-center shrink-0 ${getScoreColor(report.overallScore)}`}>
                      {report.overallScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{report.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{report.summary}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        {report.keywordId ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">키워드별</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">종합</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); setLocation(`/admin/ai-report/${report.id}`); }} title="상세 보기">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: report.id }); }} title="삭제">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/* ═══════════════════════════════════════════════════ */
/* 메인 export                                         */
/* ═══════════════════════════════════════════════════ */
export default function AdminAIReport() {
  const [matchDetail, params] = useRoute("/admin/ai-report/:id");
  if (matchDetail && params?.id) {
    const id = parseInt(params.id, 10);
    if (!isNaN(id)) return <ReportDetail reportId={id} />;
  }
  return <ReportList />;
}

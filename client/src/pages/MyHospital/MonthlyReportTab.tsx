import { EnhancedEmptyState } from "./shared";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share2, Calendar, TrendingUp, Eye, ExternalLink, Loader2, Plus, ChevronRight, Zap, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function ReportPdfButton({ reportId }: { reportId: number }) {
  const utils = trpc.useUtils();
  const generatePdf = trpc.monthlyReport.generatePdf.useMutation({
    onSuccess: () => {
      toast.success("리포트가 생성되었습니다!");
      utils.analytics.monthlyReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => generatePdf.mutate({ reportId })}
      disabled={generatePdf.isPending}
      className="gap-2"
    >
      {generatePdf.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      리포트 생성
    </Button>
  );
}

function ReportShareButton({ reportId, shareToken }: { reportId: number; shareToken?: string | null }) {
  const utils = trpc.useUtils();
  const createShare = trpc.monthlyReport.createShareLink.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/report/${data.token}`;
      navigator.clipboard.writeText(url);
      toast.success("공유 링크가 클립보드에 복사되었습니다!");
      utils.analytics.monthlyReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleShare = () => {
    if (shareToken) {
      const url = `${window.location.origin}/report/${shareToken}`;
      navigator.clipboard.writeText(url);
      toast.success("공유 링크가 클립보드에 복사되었습니다!");
    } else {
      createShare.mutate({ reportId });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={createShare.isPending}
      className="gap-2"
    >
      {createShare.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
      {shareToken ? "공유 링크 복사" : "공유 링크 생성"}
    </Button>
  );
}

function MonthlyReportTab() {
  const { data: reports, isLoading } = trpc.analytics.monthlyReports.useQuery();
  const utils = trpc.useUtils();
  const generateReport = trpc.analytics.generateMonthlyReport.useMutation({
    onSuccess: () => {
      toast.success("월간 리포트가 생성되었습니다!");
      utils.analytics.monthlyReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 지난달 리포트 생성 함수
  const handleGenerateLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    generateReport.mutate({ year: lastMonth.getFullYear(), month: lastMonth.getMonth() + 1 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 리포트 생성 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">월간 성과 리포트</h3>
          <p className="text-sm text-muted-foreground">매월 성과를 AI가 분석하여 요약과 개선 추천을 제공합니다</p>
        </div>
        <Button
          onClick={handleGenerateLastMonth}
          disabled={generateReport.isPending}
          className="bg-brand hover:bg-brand/90"
        >
          {generateReport.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />생성 중...</>
          ) : (
            <><Plus className="w-4 h-4 mr-2" />지난달 리포트 생성</>
          )}
        </Button>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((r: any) => {
            const isExpanded = expandedId === r.id;
            const totalChannelVisits = (r.aiChannelVisits ?? 0) + (r.naverVisits ?? 0) + (r.googleVisits ?? 0) + (r.snsVisits ?? 0) + (r.directVisits ?? 0);
            return (
              <Card key={r.id} className={`bg-card border-border transition-all ${isExpanded ? "ring-1 ring-brand/30" : ""}`}>
                {/* 요약 헤더 (클릭으로 토글) */}
                <CardHeader className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{r.year}년 {r.month}월 리포트</CardTitle>
                        <CardDescription>{new Date(r.createdAt).toLocaleDateString("ko-KR")} 생성</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">방문 <span className="font-bold text-foreground">{r.totalVisits ?? 0}</span></span>
                        <span className="text-muted-foreground">문의 <span className="font-bold text-foreground">{r.totalInquiries ?? 0}</span></span>
                        {r.seoScore != null && <span className="text-muted-foreground">AI검색 <span className="font-bold text-foreground">{r.seoScore}</span></span>}
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </CardHeader>

                {/* 상세 내용 */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t border-border pt-4 space-y-4">
                      {/* 점수 카드 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">AI 검색 점수</p>
                          <p className="text-xl font-bold text-foreground">{r.seoScore ?? "-"}</p>
                          {r.seoScoreChange != null && (
                            <p className={`text-xs ${r.seoScoreChange > 0 ? "text-emerald-400" : r.seoScoreChange < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {r.seoScoreChange > 0 ? "+" : ""}{r.seoScoreChange}점
                            </p>
                          )}
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">AI 인용 점수</p>
                          <p className="text-xl font-bold text-brand">{r.aiExposureScore ?? "-"}</p>
                          {r.aiExposureChange != null && (
                            <p className={`text-xs ${r.aiExposureChange > 0 ? "text-emerald-400" : r.aiExposureChange < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {r.aiExposureChange > 0 ? "+" : ""}{r.aiExposureChange}점
                            </p>
                          )}
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">총 방문수</p>
                          <p className="text-xl font-bold text-foreground">{r.totalVisits ?? 0}</p>
                          <p className="text-xs text-muted-foreground">AI: {r.aiChannelVisits ?? 0}</p>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">상담 문의</p>
                          <p className="text-xl font-bold text-foreground">{r.totalInquiries ?? 0}</p>
                          {r.conversionRate && <p className="text-xs text-brand">전환율 {r.conversionRate}</p>}
                        </div>
                      </div>

                      {/* 채널별 방문 분포 바 */}
                      {totalChannelVisits > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">채널별 방문 분포</p>
                          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                            {[
                              { value: r.aiChannelVisits ?? 0, color: "bg-brand" },
                              { value: r.naverVisits ?? 0, color: "bg-green-500" },
                              { value: r.googleVisits ?? 0, color: "bg-red-500" },
                              { value: r.snsVisits ?? 0, color: "bg-pink-500" },
                              { value: r.directVisits ?? 0, color: "bg-gray-500" },
                            ].filter(s => s.value > 0).map((s, i) => (
                              <div key={i} className={`${s.color} transition-all`} style={{ width: `${(s.value / totalChannelVisits) * 100}%` }} />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {[
                              { label: "AI", value: r.aiChannelVisits, color: "bg-brand" },
                              { label: "네이버", value: r.naverVisits, color: "bg-green-500" },
                              { label: "구글", value: r.googleVisits, color: "bg-red-500" },
                              { label: "SNS", value: r.snsVisits, color: "bg-pink-500" },
                              { label: "직접", value: r.directVisits, color: "bg-gray-500" },
                            ].filter(s => (s.value ?? 0) > 0).map((item) => (
                              <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className="text-xs text-muted-foreground">{item.label} {item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI 요약 및 추천 */}
                      {r.summary && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Zap className="w-3 h-3" />AI 분석 요약
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-line">{r.summary}</p>
                        </div>
                      )}
                      {r.recommendations && (
                        <div className="bg-brand/5 rounded-lg p-4 border border-brand/10">
                          <p className="text-xs font-medium text-brand mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" />개선 추천 사항
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-line">{r.recommendations}</p>
                        </div>
                      )}

                      {/* PDF 다운로드 + 공유 링크 */}
                      <div className="flex flex-wrap gap-3">
                        {r.pdfUrl ? (
                          <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-sm font-medium">
                            <Download className="w-4 h-4" />리포트 보기
                          </a>
                        ) : (
                          <ReportPdfButton reportId={r.id} />
                        )}
                        <ReportShareButton reportId={r.id} shareToken={r.shareToken} />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <EnhancedEmptyState
              icon={FileText}
              title="아직 월간 리포트가 없습니다"
              description="월간 리포트는 매월 자동 생성되거나, 직접 생성할 수 있습니다"
              steps={['"지난달 리포트 생성" 버튼 클릭', 'AI가 성과 분석 및 요약', '리포트 확인 및 PDF 다운로드']}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 메인 대시보드 (탭 구조)
// ═══════════════════════════════════════════════════════════════

// ─── 인사이트 배너 ──────────────────────────────────────────────

export default MonthlyReportTab;

import { CHANNEL_LABELS, EnhancedEmptyState } from "./shared";
import { useState } from "react";
import { CardDescription } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Phone, Mail, Calendar, Clock, User, Plus, Eye, Trash2, CheckCircle2, Target, BarChart3, Code } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function ConsultationTab() {
  const { data: consultations, isLoading } = trpc.analytics.consultations.useQuery();
  const { data: consultStats } = trpc.analytics.consultationStats.useQuery();
  const { data: channelStats } = trpc.analytics.consultationByChannel.useQuery();
  const { data: monthlyTrend } = trpc.analytics.consultationMonthlyTrend.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.analytics.updateConsultation.useMutation({
    onSuccess: () => {
      toast.success("상태가 업데이트되었습니다");
      utils.analytics.consultations.invalidate();
      utils.analytics.consultationStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "대기", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    contacted: { label: "연락완료", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    completed: { label: "완료", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "취소", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredConsultations = statusFilter === "all"
    ? consultations ?? []
    : (consultations ?? []).filter((c: any) => c.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />총 문의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{consultStats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />대기 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{consultStats?.pending ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "contacted" ? "all" : "contacted")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4" />연락완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{consultStats?.contacted ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{consultStats?.completed ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand flex items-center gap-1.5">
              <Target className="w-4 h-4" />전환율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{consultStats?.conversionRate ?? "0%"}</div>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 문의 + 월별 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" />채널별 문의 분포
            </CardTitle>
            <CardDescription>어떤 채널에서 상담 문의가 많은지 확인</CardDescription>
          </CardHeader>
          <CardContent>
            {channelStats && channelStats.length > 0 ? (
              <div className="space-y-3">
                {channelStats.map((ch: any) => {
                  const info = CHANNEL_LABELS[ch.channel] || { label: ch.channel || "직접", icon: "?" };
                  const total = channelStats.reduce((s: number, c: any) => s + Number(c.count), 0);
                  const pct = total > 0 ? Math.round((Number(ch.count) / total) * 100) : 0;
                  return (
                    <div key={ch.channel || "direct"} className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{info.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{info.label}</span>
                          <span className="text-xs text-muted-foreground">{ch.count}건 ({pct}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={BarChart3} title="채널 데이터가 없습니다" description="상담 문의가 접수되면 채널별 분포가 표시됩니다" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />월별 상담 추이
            </CardTitle>
            <CardDescription>최근 6개월 상담 문의 및 전환 추이</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrend && monthlyTrend.length > 0 ? (
              <div className="space-y-3">
                {monthlyTrend.map((m: any) => {
                  const total = Number(m.total);
                  const completed = Number(m.completed);
                  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div key={m.yearMonth} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium text-muted-foreground w-16">{m.yearMonth}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">문의 <span className="font-bold">{total}</span>건</span>
                          <span className="text-xs text-brand">전환율 {rate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={Calendar} title="월별 데이터가 없습니다" description="상담 문의가 접수되면 월별 추이가 표시됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 문의 목록 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand" />상담 문의 목록
                {statusFilter !== "all" && <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">{statusLabels[statusFilter]?.label} 필터</span>}
              </CardTitle>
              <CardDescription>웹사이트에서 접수된 상담 문의를 관리합니다</CardDescription>
            </div>
            {statusFilter !== "all" && (
              <Button size="sm" variant="ghost" onClick={() => setStatusFilter("all")} className="text-xs">
                필터 해제
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredConsultations.length > 0 ? (
            <div className="space-y-3">
              {filteredConsultations.map((c: any) => {
                const st = statusLabels[c.status] || statusLabels.pending;
                return (
                  <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                        {c.treatmentType && <span className="text-xs text-muted-foreground">{c.treatmentType}</span>}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {c.patientName || "이름 미입력"}
                        {c.patientPhone && <span className="text-muted-foreground ml-2">{c.patientPhone}</span>}
                        {c.patientEmail && <span className="text-muted-foreground ml-2"><Mail className="w-3 h-3 inline" /> {c.patientEmail}</span>}
                      </p>
                      {c.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(c.createdAt).toLocaleString("ko-KR")}
                        {c.channel && <span className="ml-2">채널: {CHANNEL_LABELS[c.channel]?.label || c.channel}</span>}
                        {c.contactedAt && <span className="ml-2 text-blue-400">연락: {new Date(c.contactedAt).toLocaleDateString("ko-KR")}</span>}
                      </p>
                      {c.note && <p className="text-xs text-muted-foreground mt-1 italic">메모: {c.note}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {c.status === "pending" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "contacted" })} disabled={updateStatus.isPending}>
                          연락완료
                        </Button>
                      )}
                      {c.status === "contacted" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "completed" })} disabled={updateStatus.isPending}>
                          상담완료
                        </Button>
                      )}
                      {(c.status === "pending" || c.status === "contacted") && (
                        <Button size="sm" variant="ghost" className="text-xs text-red-400" onClick={() => updateStatus.mutate({ id: c.id, status: "cancelled" })} disabled={updateStatus.isPending}>
                          취소
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EnhancedEmptyState
              icon={MessageSquare}
              title={statusFilter !== "all" ? `${statusLabels[statusFilter]?.label} 상태의 문의가 없습니다` : "아직 상담 문의가 없습니다"}
              description="추적 코드를 설치하고 상담 폼을 연동하면 문의가 자동으로 수집됩니다"
              steps={['추적 코드 설치', '상담 폼 연동', '문의 자동 수집 시작']}
            />
          )}
        </CardContent>
      </Card>

      {/* 상담 폼 연동 안내 */}
      <Card className="bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-5 h-5 text-brand" />
            상담 폼 연동 안내
          </CardTitle>
          <CardDescription>병원 웹사이트의 상담 폼에 아래 코드를 추가하면 문의가 자동으로 수집됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg p-4 font-mono text-xs text-foreground border border-border">
            <pre className="whitespace-pre-wrap">{`// 상담 폼 제출 시 호출
fetch('https://mybiseo.com/api/trpc/tracking.inquiry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    json: {
      hospitalId: YOUR_HOSPITAL_ID,
      patientName: '환자명',
      patientPhone: '010-1234-5678',
      treatmentType: '상담 유형',
      message: '문의 내용',
      channel: window.__mybiseo_channel || 'direct'
    }
  })
});`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 탭 4: 월간 리포트
// ═══════════════════════════════════════════════════════════════


export default ConsultationTab;

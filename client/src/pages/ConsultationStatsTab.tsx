/**
 * AI 상담 현황 대시보드 탭 — 상담 건수, 전환율, 최근 문의 목록
 * 기존 consultation_inquiries 테이블 데이터를 시각적으로 보여줌
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare, TrendingUp, Users, Phone, Mail, Clock,
  CheckCircle2, AlertCircle, Loader2, BarChart3,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "대기 중", className: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
    contacted: { label: "상담 중", className: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
    completed: { label: "완료", className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
    cancelled: { label: "취소", className: "bg-red-400/10 text-red-400 border-red-400/20" },
  };
  const c = config[status] || config.pending;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.className}`}>{c.label}</span>;
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "phone" || channel === "전화") return <Phone className="w-3.5 h-3.5 text-emerald-400" />;
  if (channel === "email" || channel === "이메일") return <Mail className="w-3.5 h-3.5 text-blue-400" />;
  return <MessageSquare className="w-3.5 h-3.5 text-brand" />;
}

export default function ConsultationStatsTab() {
  const { data: pipeline, isLoading: pipeLoading } = trpc.crm.pipeline.useQuery();
  const { data: recentList = [], isLoading: listLoading } = trpc.crm.list.useQuery({ limit: 15 });

  const isLoading = pipeLoading || listLoading;

  // pipeline은 { pending, contacted, completed, cancelled, total } 객체
  const stats = useMemo(() => {
    if (!pipeline) return { total: 0, pending: 0, contacted: 0, completed: 0, cancelled: 0, conversionRate: 0 };
    const total = pipeline.total;
    const pending = pipeline.pending;
    const contacted = pipeline.contacted;
    const completed = pipeline.completed;
    const cancelled = pipeline.cancelled;
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, contacted, completed, cancelled, conversionRate };
  }, [pipeline]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={MessageSquare} label="전체 문의" value={stats.total} color="bg-brand/10 text-brand" />
        <StatCard icon={Clock} label="대기 중" value={stats.pending} color="bg-amber-400/10 text-amber-400" />
        <StatCard icon={Users} label="상담 중" value={stats.contacted} color="bg-blue-400/10 text-blue-400" />
        <StatCard icon={CheckCircle2} label="상담 완료" value={stats.completed} sub={`전환율 ${stats.conversionRate}%`} color="bg-emerald-400/10 text-emerald-400" />
      </div>

      {/* 파이프라인 시각화 */}
      {stats.total > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand" /> 상담 파이프라인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 h-6 rounded-full overflow-hidden">
              {stats.pending > 0 && (
                <div className="bg-amber-400 transition-all" style={{ width: `${(stats.pending / stats.total) * 100}%` }} title={`대기 ${stats.pending}건`} />
              )}
              {stats.contacted > 0 && (
                <div className="bg-blue-400 transition-all" style={{ width: `${(stats.contacted / stats.total) * 100}%` }} title={`상담 중 ${stats.contacted}건`} />
              )}
              {stats.completed > 0 && (
                <div className="bg-emerald-400 transition-all" style={{ width: `${(stats.completed / stats.total) * 100}%` }} title={`완료 ${stats.completed}건`} />
              )}
              {stats.cancelled > 0 && (
                <div className="bg-red-400/60 transition-all" style={{ width: `${(stats.cancelled / stats.total) * 100}%` }} title={`취소 ${stats.cancelled}건`} />
              )}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 대기 {stats.pending}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 상담 중 {stats.contacted}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> 완료 {stats.completed}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400/60" /> 취소 {stats.cancelled}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 문의 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-brand" /> 최근 상담 문의</CardTitle>
        </CardHeader>
        <CardContent>
          {recentList.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">아직 접수된 문의가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {(recentList as any[]).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors">
                  <ChannelIcon channel={item.channel || "web"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.name || "이름 없음"}</span>
                      <StatusBadge status={item.status || "pending"} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.interest || item.message || "문의 내용 없음"}
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex-shrink-0">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 관리자 — 리드 관리
 * 개선: 검색 기능, 필터 UI 통일, 테이블 가독성, 모바일 반응형, 빈 상태 안내 강화
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Users, UserPlus, Handshake, XCircle, Mail, Globe, Calendar,
  TrendingUp, FileText, MessageSquare, Flame, Send, Search,
  RefreshCw, ArrowUpDown, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "신규", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <UserPlus className="w-3 h-3" /> },
  consulting: { label: "상담중", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <MessageSquare className="w-3 h-3" /> },
  contracted: { label: "계약", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <Handshake className="w-3 h-3" /> },
  lost: { label: "이탈", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <XCircle className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.new;
  return (
    <Badge variant="outline" className={`${s.color} gap-1 font-medium text-[11px]`}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) return <span className="text-muted-foreground text-xs">-</span>;
  const color = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  return (
    <div className="text-center">
      <div className={`text-sm font-bold ${color}`}>{score}점</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function MonthlyReportButton() {
  const sendMutation = trpc.monthlyReport.sendToContracted.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: () => toast.error("리포트 발송에 실패했습니다"),
  });

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">월간 AI 인용 리포트</p>
          <p className="text-xs text-muted-foreground">계약 고객에게 월간 변화 리포트를 이메일로 발송합니다</p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => sendMutation.mutate()}
        disabled={sendMutation.isPending}
      >
        {sendMutation.isPending ? "발송 중..." : "리포트 발송"}
      </Button>
    </div>
  );
}

export default function AdminLeads() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "score">("date");
  const [editingLead, setEditingLead] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");

  const statsQuery = trpc.seoLeads.getStats.useQuery();
  const leadsQuery = trpc.seoLeads.getAll.useQuery({ limit: 200 });
  const updateMutation = trpc.seoLeads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("상태 업데이트 완료");
      leadsQuery.refetch();
      statsQuery.refetch();
      setEditingLead(null);
    },
    onError: (err) => toast.error("업데이트 실패: " + err.message),
  });

  const stats = statsQuery.data;
  const leads = leadsQuery.data ?? [];

  const filteredLeads = useMemo(() => {
    let result = filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);
    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.email.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          (l.note && l.note.toLowerCase().includes(q))
      );
    }
    // 정렬
    return [...result].sort((a, b) => {
      if (sortBy === "priority") return (b.priority ?? 0) - (a.priority ?? 0);
      if (sortBy === "score") return (b.totalScore ?? 0) - (a.totalScore ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [leads, filterStatus, searchQuery, sortBy]);

  const handleSaveStatus = () => {
    if (editingLead === null || !editStatus) return;
    updateMutation.mutate({
      id: editingLead,
      status: editStatus as "new" | "consulting" | "contracted" | "lost",
      note: editNote || undefined,
    });
  };

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">리드 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">AI 검색 최적화 진단을 통해 수집된 잠재 고객을 관리합니다</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => leadsQuery.refetch()} className="gap-1.5 self-start">
            <RefreshCw className="w-3.5 h-3.5" />
            새로고침
          </Button>
        </div>

        {/* 월간 리포트 발송 */}
        <MonthlyReportButton />

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">전체 리드</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.thisMonth ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">이번 달 신규</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.byStatus?.consulting ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">상담 진행중</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Handshake className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.byStatus?.contracted ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">계약 완료</p>
          </div>
        </div>

        {/* 파이프라인 바 */}
        {stats && stats.total > 0 && (
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">영업 파이프라인</span>
              <span className="text-xs text-muted-foreground">전체 {stats.total}건</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
              {(["new", "consulting", "contracted", "lost"] as const).map((s) => {
                const count = stats.byStatus?.[s] ?? 0;
                const pct = (count / stats.total) * 100;
                if (pct === 0) return null;
                const colors: Record<string, string> = {
                  new: "bg-blue-500",
                  consulting: "bg-amber-500",
                  contracted: "bg-emerald-500",
                  lost: "bg-red-500/50",
                };
                return <div key={s} className={`${colors[s]} transition-all`} style={{ width: `${pct}%` }} />;
              })}
            </div>
            <div className="flex gap-4 mt-2">
              {(["new", "consulting", "contracted", "lost"] as const).map((s) => (
                <div key={s} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${s === "new" ? "bg-blue-500" : s === "consulting" ? "bg-amber-500" : s === "contracted" ? "bg-emerald-500" : "bg-red-500/50"}`} />
                  {STATUS_MAP[s].label} {stats.byStatus?.[s] ?? 0}
                  <span className="opacity-60">({((stats.byStatus?.[s] ?? 0) / stats.total * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 + 필터 + 정렬 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이메일, URL, 메모 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1">
              {[
                { value: "all", label: "전체" },
                { value: "new", label: "신규" },
                { value: "consulting", label: "상담중" },
                { value: "contracted", label: "계약" },
                { value: "lost", label: "이탈" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filterStatus === f.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">최신순</SelectItem>
                <SelectItem value="priority">우선순위순</SelectItem>
                <SelectItem value="score">점수순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 리드 목록 */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">리드 목록</span>
              <Badge variant="secondary" className="text-xs">{filteredLeads.length}건</Badge>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium">
                {searchQuery ? "검색 결과가 없습니다" : "아직 수집된 리드가 없습니다"}
              </p>
              <p className="text-sm mt-2 max-w-sm mx-auto">
                {searchQuery
                  ? "다른 검색어를 시도해보세요"
                  : "AI 검색 최적화 진단 도구에서 이메일을 입력한 사용자가 리드로 등록됩니다"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground bg-muted/20">
                    <th className="text-left py-3 px-4 font-medium text-xs">이메일</th>
                    <th className="text-left py-3 px-4 font-medium text-xs">URL</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">우선</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">종합</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">AI</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">상태</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">후속</th>
                    <th className="text-left py-3 px-4 font-medium text-xs">등록일</th>
                    <th className="text-center py-3 px-4 font-medium text-xs">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate max-w-[180px]">{lead.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={lead.url.startsWith("http") ? lead.url : `https://${lead.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[200px]"
                        >
                          {lead.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-center">
                          <div className={`text-sm font-bold ${(lead.priority ?? 0) >= 70 ? "text-red-500" : (lead.priority ?? 0) >= 40 ? "text-amber-500" : "text-muted-foreground"}`}>
                            {(lead.priority ?? 0) >= 70 && <Flame className="w-3 h-3 inline mr-0.5" />}
                            {lead.priority ?? 0}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <ScoreBadge score={lead.totalScore} label="종합" />
                      </td>
                      <td className="py-3 px-4">
                        <ScoreBadge score={lead.aiScore} label="AI" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${lead.followup3dSent ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted/20 text-muted-foreground border-border/50"}`}>
                            3일
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${lead.followup7dSent ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted/20 text-muted-foreground border-border/50"}`}>
                            7일
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-muted-foreground" title={new Date(lead.createdAt).toLocaleString("ko-KR")}>
                          {formatDate(lead.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => {
                                setEditingLead(lead.id);
                                setEditStatus(lead.status);
                                setEditNote(lead.note ?? "");
                              }}
                            >
                              관리
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>리드 상태 관리</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">이메일</p>
                                  <p className="font-medium text-sm">{lead.email}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">URL</p>
                                  <a href={lead.url.startsWith("http") ? lead.url : `https://${lead.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                                    {lead.url.replace(/^https?:\/\//, "")}
                                  </a>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/30 rounded-lg text-center">
                                  <p className="text-xl font-bold">{lead.totalScore ?? "-"}<span className="text-sm font-normal text-muted-foreground">점</span></p>
                                  <p className="text-xs text-muted-foreground">종합 점수</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg text-center">
                                  <p className={`text-xl font-bold ${(lead.aiScore ?? 0) < 70 ? "text-red-500" : "text-emerald-500"}`}>{lead.aiScore ?? "-"}<span className="text-sm font-normal text-muted-foreground">점</span></p>
                                  <p className="text-xs text-muted-foreground">AI 인용 점수</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">상태 변경</p>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">신규</SelectItem>
                                    <SelectItem value="consulting">상담중</SelectItem>
                                    <SelectItem value="contracted">계약</SelectItem>
                                    <SelectItem value="lost">이탈</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">메모</p>
                                <Textarea
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  placeholder="상담 내용, 특이사항 등을 기록하세요..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSaveStatus}
                                disabled={updateMutation.isPending}
                                className="w-full"
                              >
                                {updateMutation.isPending ? "저장 중..." : "저장"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 하단 요약 */}
          {filteredLeads.length > 0 && (
            <div className="px-5 py-3 border-t border-border/50 text-xs text-muted-foreground">
              총 {filteredLeads.length}건
              {searchQuery && ` (검색: "${searchQuery}")`}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

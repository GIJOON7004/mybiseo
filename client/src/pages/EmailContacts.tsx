import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail, Users, TrendingUp, Search, Plus, Trash2, Edit2, Send,
  Filter, BarChart3, Clock, CheckCircle2, XCircle, Loader2
} from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  seo_checker: "AI 검색 진단",
  seo_compare: "AI 검색 비교",
  newsletter: "뉴스레터",
  benchmarking_report: "벤치마킹",
  consultation: "상담",
  blog_subscribe: "블로그 구독",
  manual: "수동 등록",
  import: "엑셀 가져오기",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "활성", color: "bg-emerald-500/20 text-emerald-400" },
  unsubscribed: { label: "수신거부", color: "bg-yellow-500/20 text-yellow-400" },
  bounced: { label: "반송", color: "bg-red-500/20 text-red-400" },
};

export default function EmailContacts() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [newContact, setNewContact] = useState({ email: "", name: "", hospitalName: "", specialty: "", phone: "", note: "" });

  const utils = trpc.useUtils();
  const { data: contacts, isLoading } = trpc.emailContact.list.useQuery(
    { search: search || undefined, source: sourceFilter || undefined, limit: 100 },
  );
  const { data: stats } = trpc.emailContact.stats.useQuery();
  const { data: sendStats } = trpc.emailContact.sendStats.useQuery();
  const { data: sendLogs } = trpc.emailContact.sendLogs.useQuery({ limit: 30 });

  const addMutation = trpc.emailContact.addManual.useMutation({
    onSuccess: () => { toast.success("연락처가 추가되었습니다."); setAddOpen(false); setNewContact({ email: "", name: "", hospitalName: "", specialty: "", phone: "", note: "" }); utils.emailContact.list.invalidate(); utils.emailContact.stats.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.emailContact.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다."); utils.emailContact.list.invalidate(); utils.emailContact.stats.invalidate(); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">이메일 연락처 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">모든 채널에서 수집된 이메일 데이터를 통합 관리합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10"><Users className="h-5 w-5 text-brand" /></div>
            <div><p className="text-xs text-muted-foreground">전체 연락처</p><p className="text-xl font-bold">{stats?.total ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
            <div><p className="text-xs text-muted-foreground">활성 연락처</p><p className="text-xl font-bold">{stats?.active ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><TrendingUp className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-xs text-muted-foreground">최근 7일 신규</p><p className="text-xl font-bold">{stats?.recentWeek ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10"><Send className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-xs text-muted-foreground">총 발송 수</p><p className="text-xl font-bold">{sendStats?.total ?? 0}</p></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="contacts">
          <TabsList><TabsTrigger value="contacts">연락처</TabsTrigger><TabsTrigger value="logs">발송 이력</TabsTrigger><TabsTrigger value="sources">출처별 통계</TabsTrigger></TabsList>

          {/* 연락처 탭 */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="이메일, 병원명, 이름 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">전체 출처</option>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" />추가</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>연락처 수동 추가</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>이메일 *</Label><Input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>이름</Label><Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} /></div>
                      <div><Label>병원명</Label><Input value={newContact.hospitalName} onChange={e => setNewContact(p => ({ ...p, hospitalName: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>진료과</Label><Input value={newContact.specialty} onChange={e => setNewContact(p => ({ ...p, specialty: e.target.value }))} /></div>
                      <div><Label>전화번호</Label><Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} /></div>
                    </div>
                    <div><Label>메모</Label><Input value={newContact.note} onChange={e => setNewContact(p => ({ ...p, note: e.target.value }))} /></div>
                    <Button className="w-full" onClick={() => addMutation.mutate(newContact)} disabled={!newContact.email || addMutation.isPending}>
                      {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}추가
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
            ) : !contacts?.length ? (
              <Card className="p-8 text-center text-muted-foreground">등록된 연락처가 없습니다.</Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50 text-muted-foreground text-xs">
                      <th className="text-left p-3">이메일</th><th className="text-left p-3">이름/병원</th><th className="text-left p-3">출처</th><th className="text-center p-3">상태</th><th className="text-center p-3">발송</th><th className="text-center p-3">점수</th><th className="p-3"></th>
                    </tr></thead>
                    <tbody>
                      {contacts.map((c: any) => (
                        <tr key={c.id} className="border-t border-border/50 hover:bg-muted/20">
                          <td className="p-3 font-medium">{c.email}</td>
                          <td className="p-3"><div>{c.name || "-"}</div><div className="text-xs text-muted-foreground">{c.hospitalName || ""}</div></td>
                          <td className="p-3"><Badge variant="outline" className="text-xs">{SOURCE_LABELS[c.source] || c.source}</Badge></td>
                          <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[c.status]?.color || ""}`}>{STATUS_LABELS[c.status]?.label || c.status}</span></td>
                          <td className="p-3 text-center text-muted-foreground">{c.totalEmailsSent}</td>
                          <td className="p-3 text-center">{c.lastDiagnosisScore != null ? <span className={c.lastDiagnosisScore >= 80 ? "text-emerald-400" : c.lastDiagnosisScore >= 60 ? "text-yellow-400" : "text-red-400"}>{c.lastDiagnosisScore}점</span> : "-"}</td>
                          <td className="p-3"><Button variant="ghost" size="sm" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate({ id: c.id }); }}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 발송 이력 탭 */}
          <TabsContent value="logs">
            {!sendLogs?.length ? (
              <Card className="p-8 text-center text-muted-foreground">발송 이력이 없습니다.</Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50 text-muted-foreground text-xs">
                    <th className="text-left p-3">일시</th><th className="text-left p-3">이메일</th><th className="text-left p-3">제목</th><th className="text-center p-3">유형</th><th className="text-center p-3">상태</th>
                  </tr></thead>
                  <tbody>
                    {sendLogs.map((log: any) => (
                      <tr key={log.id} className="border-t border-border/50">
                        <td className="p-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("ko-KR")}</td>
                        <td className="p-3">{log.email}</td>
                        <td className="p-3 max-w-[200px] truncate">{log.subject}</td>
                        <td className="p-3 text-center"><Badge variant="outline" className="text-xs">{log.templateType}</Badge></td>
                        <td className="p-3 text-center">{log.status === "sent" ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* 출처별 통계 탭 */}
          <TabsContent value="sources">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(stats?.bySource || []).map((s: any) => (
                <Card key={s.source}><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{SOURCE_LABELS[s.source] || s.source}</p>
                  <p className="text-2xl font-bold">{s.count}</p>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

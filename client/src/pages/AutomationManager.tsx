import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Zap, Mail, Clock, Star, Send, Trash2, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ruleTypeLabels: Record<string, string> = {
  booking_confirm: "예약 확인",
  reminder_d1: "D-1 리마인더",
  review_request_d3: "D+3 후기 요청",
  monthly_report: "월간 리포트",
};

export default function AutomationManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ ruleType: "booking_confirm" as any, name: "", channel: "email" as any });
  const [sendForm, setSendForm] = useState({ type: "booking", patientName: "", patientEmail: "", treatmentName: "", appointmentDate: "", appointmentTime: "", reviewUrl: "" });

  const rules = trpc.automation.listRules.useQuery();
  const logs = trpc.automation.getLogs.useQuery({ limit: 50 });

  const createRuleMut = trpc.automation.createRule.useMutation({
    onSuccess: () => { rules.refetch(); setShowCreate(false); toast.success("자동화 규칙이 생성되었습니다"); },
  });
  const toggleRuleMut = trpc.automation.toggleRule.useMutation({
    onSuccess: () => { rules.refetch(); },
  });
  const deleteRuleMut = trpc.automation.deleteRule.useMutation({
    onSuccess: () => { rules.refetch(); toast.success("삭제 완료"); },
  });
  const bookingMut = trpc.automation.sendBookingConfirm.useMutation({
    onSuccess: (r) => { logs.refetch(); r.success ? toast.success("예약 확인 이메일 발송 완료") : toast.error("발송 실패: " + r.error); },
  });
  const reminderMut = trpc.automation.sendReminder.useMutation({
    onSuccess: (r) => { logs.refetch(); r.success ? toast.success("리마인더 발송 완료") : toast.error("발송 실패: " + r.error); },
  });
  const reviewMut = trpc.automation.sendReviewRequest.useMutation({
    onSuccess: (r) => { logs.refetch(); r.success ? toast.success("후기 요청 발송 완료") : toast.error("발송 실패: " + r.error); },
  });

  const handleSend = () => {
    if (!sendForm.patientEmail || !sendForm.patientName) { toast.error("환자 정보를 입력해주세요"); return; }
    if (sendForm.type === "booking") {
      bookingMut.mutate({ patientName: sendForm.patientName, patientEmail: sendForm.patientEmail, treatmentName: sendForm.treatmentName, appointmentDate: sendForm.appointmentDate, appointmentTime: sendForm.appointmentTime });
    } else if (sendForm.type === "reminder") {
      reminderMut.mutate({ patientName: sendForm.patientName, patientEmail: sendForm.patientEmail, treatmentName: sendForm.treatmentName, appointmentDate: sendForm.appointmentDate, appointmentTime: sendForm.appointmentTime });
    } else {
      reviewMut.mutate({ patientName: sendForm.patientName, patientEmail: sendForm.patientEmail, treatmentName: sendForm.treatmentName, reviewUrl: sendForm.reviewUrl });
    }
  };

  const isSending = bookingMut.isPending || reminderMut.isPending || reviewMut.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6" /> 자동화 관리</h1>
        <p className="text-muted-foreground mt-1">예약 확인, 리마인더, 후기 요청 등 자동 이메일 발송을 관리합니다</p>
      </div>

      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send" className="gap-1"><Send className="w-4 h-4" /> 수동 발송</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1"><Zap className="w-4 h-4" /> 자동화 규칙</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><Activity className="w-4 h-4" /> 발송 로그</TabsTrigger>
        </TabsList>

        {/* 수동 발송 탭 */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>이메일 수동 발송</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">발송 유형</label>
                <Select value={sendForm.type} onValueChange={v => setSendForm({ ...sendForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">예약 확인</SelectItem>
                    <SelectItem value="reminder">D-1 리마인더</SelectItem>
                    <SelectItem value="review">후기 요청</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">환자명 *</label>
                  <Input value={sendForm.patientName} onChange={e => setSendForm({ ...sendForm, patientName: e.target.value })} placeholder="홍길동" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">이메일 *</label>
                  <Input type="email" value={sendForm.patientEmail} onChange={e => setSendForm({ ...sendForm, patientEmail: e.target.value })} placeholder="patient@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">시술명</label>
                  <Input value={sendForm.treatmentName} onChange={e => setSendForm({ ...sendForm, treatmentName: e.target.value })} placeholder="쥬베룩" />
                </div>
                {sendForm.type !== "review" ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">예약 날짜</label>
                      <Input type="date" value={sendForm.appointmentDate} onChange={e => setSendForm({ ...sendForm, appointmentDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">예약 시간</label>
                      <Input type="time" value={sendForm.appointmentTime} onChange={e => setSendForm({ ...sendForm, appointmentTime: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-1 block">후기 작성 URL</label>
                    <Input value={sendForm.reviewUrl} onChange={e => setSendForm({ ...sendForm, reviewUrl: e.target.value })} placeholder="https://..." />
                  </div>
                )}
              </div>
              <Button onClick={handleSend} disabled={isSending} className="gap-2">
                {isSending ? <><Loader2 className="w-4 h-4 animate-spin" /> 발송 중...</> : <><Send className="w-4 h-4" /> 이메일 발송</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 자동화 규칙 탭 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> 규칙 추가</Button>
          </div>
          {showCreate && (
            <Card className="border-2 border-primary/20">
              <CardContent className="p-5 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">규칙 유형</label>
                    <Select value={newRule.ruleType} onValueChange={v => setNewRule({ ...newRule, ruleType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking_confirm">예약 확인</SelectItem>
                        <SelectItem value="reminder_d1">D-1 리마인더</SelectItem>
                        <SelectItem value="review_request_d3">D+3 후기 요청</SelectItem>
                        <SelectItem value="monthly_report">월간 리포트</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">규칙명</label>
                    <Input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="예: 예약 확인 자동 발송" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">채널</label>
                    <Select value={newRule.channel} onValueChange={v => setNewRule({ ...newRule, channel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">이메일</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="kakao">카카오톡</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => createRuleMut.mutate(newRule)} disabled={createRuleMut.isPending}>생성</Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {rules.data?.length === 0 && (
            <Card className="p-8 text-center">
              <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">아직 자동화 규칙이 없습니다</p>
            </Card>
          )}
          {rules.data?.map((rule: any) => (
            <Card key={rule.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={rule.enabled} onCheckedChange={v => toggleRuleMut.mutate({ id: rule.id, enabled: v })} />
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline">{ruleTypeLabels[rule.ruleType] || rule.ruleType}</Badge>
                      <Badge variant="secondary">{rule.channel}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteRuleMut.mutate({ id: rule.id }); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 발송 로그 탭 */}
        <TabsContent value="logs" className="space-y-4">
          {logs.data?.length === 0 && (
            <Card className="p-8 text-center">
              <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">아직 발송 기록이 없습니다</p>
            </Card>
          )}
          <div className="space-y-2">
            {logs.data?.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === "sent" ? "default" : "destructive"}>{log.status === "sent" ? "성공" : "실패"}</Badge>
                    <span className="font-medium">{log.recipientEmail}</span>
                    <span className="text-muted-foreground">{log.channel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("ko-KR")}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

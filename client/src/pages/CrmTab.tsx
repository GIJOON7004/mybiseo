/**
 * 상담 CRM 탭 — 문의 파이프라인 (신규→상담중→계약완료)
 * 상태 변경, 메모 추가 기능
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageSquare, Phone, Mail, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Loader2, StickyNote, Filter,
  ArrowRight, User,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "대기 중", color: "bg-amber-400", textColor: "text-amber-400", bgColor: "bg-amber-400/10", borderColor: "border-amber-400/20" },
  contacted: { label: "상담 중", color: "bg-blue-400", textColor: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20" },
  completed: { label: "완료", color: "bg-emerald-400", textColor: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
  cancelled: { label: "취소", color: "bg-red-400", textColor: "text-red-400", bgColor: "bg-red-400/10", borderColor: "border-red-400/20" },
} as const;

type Status = keyof typeof STATUS_CONFIG;

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status as Status] || STATUS_CONFIG.pending;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.bgColor} ${c.textColor} ${c.borderColor}`}>{c.label}</span>;
}

export default function CrmTab() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  const utils = trpc.useUtils();
  const { data: pipeline, isLoading: pipeLoading } = trpc.crm.pipeline.useQuery();
  const { data: list = [], isLoading: listLoading } = trpc.crm.list.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
    limit: 50,
  });

  const updateStatusMutation = trpc.crm.updateStatus.useMutation({
    onSuccess: () => {
      utils.crm.pipeline.invalidate();
      utils.crm.list.invalidate();
      toast.success("상태가 변경되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateNoteMutation = trpc.crm.updateNote.useMutation({
    onSuccess: () => {
      utils.crm.list.invalidate();
      toast.success("메모가 저장되었습니다.");
      setNoteText("");
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading = pipeLoading || listLoading;

  // pipeline은 { pending, contacted, completed, cancelled, total } 객체
  const totalCount = pipeline?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 파이프라인 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending", "contacted", "completed", "cancelled"] as Status[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const count = pipeline ? Number(pipeline[status] ?? 0) : 0;
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-all hover:border-brand/30 ${filterStatus === status ? "border-brand/50 ring-1 ring-brand/20" : ""}`}
              onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 필터 + 전체 건수 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filterStatus === "all" ? `전체 ${totalCount}건` : `${STATUS_CONFIG[filterStatus as Status]?.label} ${list.length}건`}
        </p>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 보기</SelectItem>
              <SelectItem value="pending">대기 중</SelectItem>
              <SelectItem value="contacted">상담 중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 문의 리스트 */}
      {list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">해당 상태의 문의가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(list as any[]).map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <Card key={item.id} className={`transition-all ${isExpanded ? "border-brand/30" : "hover:border-brand/20"}`}>
                <CardContent className="pt-4 pb-3">
                  {/* 요약 행 */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => { setExpandedId(isExpanded ? null : item.id); setNoteText(item.note || ""); }}
                  >
                    <User className="w-8 h-8 p-1.5 rounded-full bg-muted text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{item.name || "이름 없음"}</span>
                        <StatusBadge status={item.status || "pending"} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.interest || item.message || "문의 내용 없음"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("ko-KR") : "-"}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* 상세 펼침 */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      {/* 연락처 정보 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {item.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {item.preferredDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>희망일: {item.preferredDate}</span>
                          </div>
                        )}
                      </div>

                      {/* 문의 내용 */}
                      {item.message && (
                        <div className="p-3 rounded-lg bg-muted/50 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">문의 내용</p>
                          <p className="whitespace-pre-wrap">{item.message}</p>
                        </div>
                      )}

                      {/* 상태 변경 */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">상태 변경:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {(["pending", "contacted", "completed", "cancelled"] as Status[]).map((s) => (
                            <Button
                              key={s}
                              variant={item.status === s ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              disabled={item.status === s || updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: s })}
                            >
                              {STATUS_CONFIG[s].label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* 메모 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">메모</span>
                        </div>
                        <textarea
                          className="w-full min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y"
                          placeholder="상담 메모를 입력하세요..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            disabled={updateNoteMutation.isPending}
                            onClick={() => updateNoteMutation.mutate({ id: item.id, note: noteText })}
                          >
                            {updateNoteMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                            메모 저장
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/*
 * 관리자 대시보드 — DashboardLayout 기반
 * 통계 요약 카드 + 상태 필터 탭 + 의뢰 테이블 + 상세 보기 + 상태 변경/삭제
 * 문의 상세에서 해당 고객의 챗봇 대화 전체 내역도 확인 가능
 */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | "new" | "contacted" | "completed";

const statusConfig = {
  new: {
    label: "신규",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    dotColor: "bg-yellow-500",
    icon: AlertCircle,
  },
  contacted: {
    label: "연락완료",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dotColor: "bg-blue-500",
    icon: Clock,
  },
  completed: {
    label: "완료",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    dotColor: "bg-green-500",
    icon: CheckCircle2,
  },
} as const;

type Inquiry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "new" | "contacted" | "completed";
  createdAt: Date;
};

export default function Admin() {
  return (
    <DashboardLayout>
      <AdminContent />
    </DashboardLayout>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "chat">("info");

  const {
    data: inquiries,
    isLoading,
    refetch,
  } = trpc.inquiry.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: stats } = trpc.inquiry.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: chatHistory, isLoading: chatLoading } = trpc.inquiry.chatHistory.useQuery(
    { phone: selectedInquiry?.phone ?? "" },
    { enabled: !!selectedInquiry && detailOpen && detailTab === "chat" }
  );

  const updateStatus = trpc.inquiry.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("상태가 변경되었습니다.");
    },
    onError: () => toast.error("상태 변경에 실패했습니다."),
  });

  const deleteInquiry = trpc.inquiry.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDetailOpen(false);
      toast.success("삭제되었습니다.");
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">접근 권한이 없습니다</h1>
          <p className="text-sm text-muted-foreground">
            관리자만 접근할 수 있는 페이지입니다.
            <br />관리자 권한이 필요하시면 담당자에게 문의해 주세요.
          </p>
          <Button
            onClick={() => window.location.href = "/"}
            className="bg-brand hover:bg-brand/90 text-brand-foreground mt-2"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const filteredInquiries = useMemo(() => {
    if (!inquiries) return [];
    if (filter === "all") return inquiries;
    return inquiries.filter((i) => i.status === filter);
  }, [inquiries, filter]);

  const openDetail = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailTab("info");
    setDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">문의 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            접수된 상담 의뢰를 확인하고 관리합니다
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 h-9"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">새로고침</span>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="전체 문의"
          value={stats?.total ?? 0}
          icon={Inbox}
          color="text-foreground"
          bgColor="bg-foreground/5"
        />
        <StatCard
          label="신규"
          value={stats?.new ?? 0}
          icon={AlertCircle}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
          badge={stats?.todayNew ? `오늘 +${stats.todayNew}` : undefined}
        />
        <StatCard
          label="연락완료"
          value={stats?.contacted ?? 0}
          icon={Clock}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          label="완료"
          value={stats?.completed ?? 0}
          icon={CheckCircle2}
          color="text-green-500"
          bgColor="bg-green-500/10"
          badge={stats?.weekNew ? `이번 주 ${stats.weekNew}건` : undefined}
        />
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1 w-fit">
        {(
          [
            { key: "all", label: "전체", count: stats?.total ?? 0 },
            { key: "new", label: "신규", count: stats?.new ?? 0 },
            { key: "contacted", label: "연락완료", count: stats?.contacted ?? 0 },
            { key: "completed", label: "완료", count: stats?.completed ?? 0 },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* 문의 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {filter === "all"
              ? "아직 접수된 문의가 없습니다"
              : `'${filter === "new" ? "신규" : filter === "contacted" ? "연락완료" : "완료"}' 상태의 문의가 없습니다`}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            홈페이지에서 상담 문의가 접수되면 여기에 표시됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInquiries.map((inquiry) => {
            const config = statusConfig[inquiry.status];
            return (
              <div
                key={inquiry.id}
                className="bg-card border border-border/40 rounded-xl p-4 hover:border-border/80 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => openDetail(inquiry)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* 아바타 */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {inquiry.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* 이름 + 상태 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{inquiry.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${config.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                          {config.label}
                        </span>
                      </div>
                      {/* 연락처 */}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {inquiry.phone}
                        </span>
                        {inquiry.email && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {inquiry.email}
                          </span>
                        )}
                      </div>
                      {/* 문의 내용 미리보기 */}
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {inquiry.message}
                      </p>
                    </div>
                  </div>
                  {/* 날짜 + 화살표 */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(inquiry.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 알림 채널 상태 */}
      <NotificationChannels />

      {/* 상세 보기 모달 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30">
            <DialogTitle className="flex items-center gap-2.5">
              <span className="text-base">문의 상세</span>
              {selectedInquiry && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                    statusConfig[selectedInquiry.status].color
                  }`}
                >
                  {statusConfig[selectedInquiry.status].label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* 탭 전환 */}
              <div className="flex items-center gap-1 bg-accent/20 rounded-lg p-1 mx-5 mt-3 w-fit">
                <button
                  onClick={() => setDetailTab("info")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    detailTab === "info"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  문의 정보
                </button>
                <button
                  onClick={() => setDetailTab("chat")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    detailTab === "chat"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageCircle className="w-3 h-3" />
                  대화 내역
                </button>
              </div>

              {/* 문의 정보 탭 */}
              {detailTab === "info" && (
                <div className="space-y-4 overflow-y-auto flex-1 px-5 py-4">
                  {/* 고객 정보 카드 */}
                  <div className="bg-accent/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                        {selectedInquiry.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{selectedInquiry.name}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          <a href={`tel:${selectedInquiry.phone}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                            {selectedInquiry.phone}
                          </a>
                          {selectedInquiry.email && (
                            <a href={`mailto:${selectedInquiry.email}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <Mail className="w-3.5 h-3.5" />
                              {selectedInquiry.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/20">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedInquiry.createdAt).toLocaleString("ko-KR")}
                    </div>
                  </div>

                  {/* 문의 내용 */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">문의 내용</p>
                    <div className="p-4 bg-accent/10 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-border/20">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  {/* 상태 변경 */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2.5">상태 변경</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(["new", "contacted", "completed"] as const).map((status) => {
                        const config = statusConfig[status];
                        const isActive = selectedInquiry.status === status;
                        return (
                          <Button
                            key={status}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className="h-9 text-xs gap-1.5 min-w-[80px]"
                            disabled={isActive || updateStatus.isPending}
                            onClick={() => {
                              updateStatus.mutate({ id: selectedInquiry.id, status });
                              setSelectedInquiry({ ...selectedInquiry, status });
                            }}
                          >
                            <config.icon className="w-3.5 h-3.5" />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 삭제 */}
                  <div className="flex justify-end pt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive gap-1.5 h-9"
                      disabled={deleteInquiry.isPending}
                      onClick={() => {
                        if (confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                          deleteInquiry.mutate({ id: selectedInquiry.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </Button>
                  </div>
                </div>
              )}

              {/* 대화 내역 탭 */}
              {detailTab === "chat" && (
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {chatLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : chatHistory?.messages && chatHistory.messages.length > 0 ? (
                    <div className="space-y-3">
                      {chatHistory.messages.map((msg: { id: number; role: "user" | "assistant"; content: string; createdAt: Date }) => (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-brand" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-accent/30 border border-border/30 text-foreground rounded-bl-md"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground/50"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          {msg.role === "user" && (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-15" />
                      <p className="text-sm font-medium">대화 내역이 없습니다</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        고객이 챗봇으로 대화 후 문의를 접수하면 연결됩니다
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  manus: Bell,
  kakao: MessageCircle,
  email: Mail,
  sms: Smartphone,
};

function NotificationChannels() {
  const { data: channels } = trpc.notification.channels.useQuery();
  if (!channels) return null;

  return (
    <div className="bg-card border border-border/40 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">알림 채널</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {channels.map((ch) => {
          const Icon = channelIcons[ch.name] || Bell;
          return (
            <div
              key={ch.name}
              className={`flex items-center gap-2.5 p-3 rounded-lg border transition-colors ${
                ch.enabled
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border/30 bg-accent/5 opacity-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ch.enabled ? "bg-green-500/10" : "bg-muted/50"}`}>
                <Icon className={`w-4 h-4 ${ch.enabled ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{ch.label}</p>
                <p className={`text-[10px] ${ch.enabled ? "text-green-500" : "text-muted-foreground"}`}>
                  {ch.enabled ? "활성" : "미연동"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/60 mt-3">
        문의 접수 시 활성화된 채널로 동시에 알림이 발송됩니다
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  badge,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  badge?: string;
}) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {badge && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full mb-1 font-medium">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

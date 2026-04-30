/*
 * 관리자 대화 내역 — 챗봇 대화 세션 목록 + 상세 보기
 * 개선: 검색 기능, 날짜 표시 개선, 통계 카드 디자인 통일, 빈 상태 안내 강화
 */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowUpRight,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  MessageCircle,
  UserCheck,
  Search,
  Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | "with-inquiry" | "chat-only";

type ChatSession = {
  id: number;
  sessionKey: string;
  visitorName: string | null;
  visitorPhone: string | null;
  visitorEmail: string | null;
  messageCount: number;
  hasInquiry: number;
  lastMessageAt: Date;
  createdAt: Date;
};

type ChatMessage = {
  id: number;
  sessionId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

export default function AdminChats() {
  return (
    <DashboardLayout>
      <AdminChatsContent />
    </DashboardLayout>
  );
}

function AdminChatsContent() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = trpc.chat.sessions.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: stats } = trpc.chat.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: sessionDetail, isLoading: detailLoading } = trpc.chat.sessionDetail.useQuery(
    { id: selectedSessionId! },
    { enabled: !!selectedSessionId && detailOpen }
  );

  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetch();
      setDetailOpen(false);
      toast.success("대화가 삭제되었습니다.");
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  // 권한 없음
  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">접근 권한이 없습니다</h1>
          <p className="text-sm text-muted-foreground">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
        </div>
      </div>
    );
  }

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    let result = sessions;
    // 상태 필터
    if (filter === "with-inquiry") result = result.filter((s) => s.hasInquiry === 1);
    else if (filter === "chat-only") result = result.filter((s) => s.hasInquiry === 0);
    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.visitorName && s.visitorName.toLowerCase().includes(q)) ||
          (s.visitorPhone && s.visitorPhone.includes(q)) ||
          (s.visitorEmail && s.visitorEmail.toLowerCase().includes(q)) ||
          s.sessionKey.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, filter, searchQuery]);

  const openDetail = (session: ChatSession) => {
    setSelectedSessionId(session.id);
    setDetailOpen(true);
  };

  const withInquiryCount = sessions?.filter((s) => s.hasInquiry === 1).length ?? 0;
  const chatOnlyCount = sessions?.filter((s) => s.hasInquiry === 0).length ?? 0;
  const conversionRate = (stats?.totalSessions ?? 0) > 0
    ? ((stats?.withInquiry ?? 0) / (stats?.totalSessions ?? 1) * 100).toFixed(1)
    : "0.0";

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">대화 내역</h1>
          <p className="text-sm text-muted-foreground mt-1">
            챗봇을 통한 방문자 대화를 확인하고 관리합니다
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats?.totalSessions ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">전체 대화</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <MessageCircle className="w-4 h-4 text-cyan-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats?.todaySessions ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">오늘 대화</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <UserCheck className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats?.withInquiry ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            문의 전환 <span className="text-green-500 font-medium">({conversionRate}%)</span>
          </p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <MessageCircle className="w-4 h-4 text-violet-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats?.totalMessages ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">총 메시지</p>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 전화번호, 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1">
          {(
            [
              { key: "all", label: "전체", count: stats?.totalSessions ?? 0 },
              { key: "with-inquiry", label: "문의 전환", count: withInquiryCount },
              { key: "chat-only", label: "대화만", count: chatOnlyCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
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
      </div>

      {/* 대화 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium">
            {searchQuery
              ? "검색 결과가 없습니다"
              : filter === "all"
              ? "아직 대화 내역이 없습니다"
              : filter === "with-inquiry"
              ? "문의로 전환된 대화가 없습니다"
              : "대화만 진행된 세션이 없습니다"}
          </p>
          <p className="text-sm mt-2 max-w-sm mx-auto">
            {searchQuery
              ? "다른 검색어를 시도해보세요"
              : "홈페이지 챗봇을 통해 방문자와 대화가 시작되면 여기에 표시됩니다"}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="hidden md:grid grid-cols-[1fr_80px_100px_120px_60px] gap-4 px-5 py-3 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>방문자</span>
            <span>메시지</span>
            <span>상태</span>
            <span>시간</span>
            <span className="text-right">보기</span>
          </div>

          {/* 테이블 행 */}
          <div className="divide-y divide-border/30">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_120px_60px] gap-2 md:gap-4 px-5 py-3.5 hover:bg-accent/20 transition-colors cursor-pointer group"
                onClick={() => openDetail(session)}
              >
                {/* 방문자 */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    session.visitorName
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {session.visitorName
                      ? session.visitorName.charAt(0)
                      : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.visitorName || "익명 방문자"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {session.visitorPhone || session.visitorEmail || session.sessionKey.slice(0, 12) + "..."}
                    </p>
                  </div>
                </div>

                {/* 메시지 수 */}
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">
                    {session.messageCount}건
                  </span>
                </div>

                {/* 상태 */}
                <div className="flex items-center">
                  {session.hasInquiry === 1 ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      문의 전환
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-accent/30 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      대화만
                    </span>
                  )}
                </div>

                {/* 시간 */}
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground" title={new Date(session.lastMessageAt).toLocaleString("ko-KR")}>
                    {formatRelativeTime(session.lastMessageAt)}
                  </span>
                </div>

                {/* 보기 */}
                <div className="flex items-center justify-end">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* 하단 요약 */}
          <div className="px-5 py-3 border-t border-border/50 text-xs text-muted-foreground">
            총 {filteredSessions.length}개 대화
            {searchQuery && ` (검색: "${searchQuery}")`}
          </div>
        </div>
      )}

      {/* 상세 보기 모달 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              대화 상세
              {sessionDetail?.hasInquiry === 1 && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-500">
                  문의 전환
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessionDetail ? (
            <div className="space-y-4 overflow-y-auto flex-1">
              {/* 방문자 정보 */}
              {sessionDetail.visitorName && (
                <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                    {sessionDetail.visitorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {sessionDetail.visitorName}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {sessionDetail.visitorPhone && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {sessionDetail.visitorPhone}
                        </span>
                      )}
                      {sessionDetail.visitorEmail && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {sessionDetail.visitorEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 세션 정보 */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(sessionDetail.createdAt).toLocaleString("ko-KR")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {sessionDetail.messageCount}건
                </span>
              </div>

              {/* 대화 내용 */}
              <div className="space-y-3 p-3 bg-accent/10 rounded-lg max-h-[400px] overflow-y-auto">
                {sessionDetail.messages && sessionDetail.messages.length > 0 ? (
                  sessionDetail.messages.map((msg: ChatMessage) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border border-border/50 text-foreground rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${
                          msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    대화 내용이 없습니다.
                  </p>
                )}
              </div>

              {/* 삭제 */}
              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive gap-1.5"
                  disabled={deleteSession.isPending}
                  onClick={() => {
                    if (confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                      deleteSession.mutate({ id: sessionDetail.id });
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  삭제
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

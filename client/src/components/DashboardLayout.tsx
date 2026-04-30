import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  ArrowLeft, BarChart3, Bell, Bot, Building2, Calendar, CalendarDays, FileText, Hash,
  Inbox, LogOut, Mail, MessageSquare, PanelLeft, Sparkles, Swords, Shield,
  Users, TrendingUp, ClipboardList, X, CheckCheck, BrainCircuit, Image, Video,
  Layers, Zap, Megaphone, MessageCircle, Factory, Film, PieChart, Brain, Puzzle, Settings, Mic,
  LayoutDashboard, CalendarRange,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

/* ─── 메뉴 그룹 정의 ─── */
const menuGroups = [
  {
    label: "AI 에이전트",
    items: [
      { icon: Brain, label: "에이전틱 대시보드", path: "/admin/agentic" },
      { icon: Puzzle, label: "에이전트 빌더", path: "/admin/agent-builder" },
    ],
  },
  {
    label: "플랫폼",
    items: [
      { icon: Settings, label: "플랫폼 설정", path: "/admin/platform-settings" },
    ],
  },
  {
    label: "고객 관리",
    items: [
      { icon: Inbox, label: "문의 관리", path: "/admin" },
      { icon: MessageSquare, label: "대화 내역", path: "/admin/chats" },
      { icon: Users, label: "리드 관리", path: "/admin/leads" },
      { icon: ClipboardList, label: "일괄 진단", path: "/admin/batch-reports" },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      { icon: FileText, label: "블로그 관리", path: "/admin/blog" },
      { icon: Sparkles, label: "블로그 AI 생성", path: "/admin/blog-ai" },
      { icon: Hash, label: "SNS 콘텐츠", path: "/admin/sns" },
      { icon: Calendar, label: "발행 스케줄러", path: "/admin/scheduler" },
    ],
  },
  {
    label: "AI 가시성",
    items: [
      { icon: BarChart3, label: "AI 노출", path: "/admin/seo" },
      { icon: Bot, label: "AI 모니터링", path: "/admin/ai-monitor" },
      { icon: Swords, label: "경쟁사 비교", path: "/admin/competitor-dashboard" },
      { icon: ClipboardList, label: "AI 개선 리포트", path: "/admin/ai-report" },
      { icon: TrendingUp, label: "벤치마킹 리포트", path: "/admin/benchmarking" },
    ],
  },
  {
    label: "시술페이지",
    items: [
      { icon: Layers, label: "시술페이지 빌더", path: "/admin/treatment-builder" },
    ],
  },
  {
    label: "자동화",
    items: [
      { icon: Zap, label: "자동화 관리", path: "/admin/automation" },
      { icon: MessageCircle, label: "카카오 예약", path: "/admin/kakao-booking" },
    ],
  },
  {
    label: "콘텐츠 공장",
    items: [
      { icon: Factory, label: "콘텐츠 공장", path: "/admin/content-factory" },
      { icon: Mic, label: "인터뷰 → 콘텐츠", path: "/admin/interview-content" },
      { icon: LayoutDashboard, label: "콘텐츠 대시보드", path: "/admin/interview-dashboard" },
      { icon: CalendarRange, label: "콘텐츠 캘린더", path: "/admin/interview-calendar" },
      { icon: Film, label: "AI 영상 프롬프트", path: "/admin/video-prompt" },
      { icon: Megaphone, label: "OSMU 콘텐츠", path: "/admin/marketing-channel" },
      { icon: PieChart, label: "마케팅 대시보드", path: "/admin/marketing-dashboard" },
      { icon: Sparkles, label: "광고 공장", path: "/admin/ad-factory" },
    ],
  },
  {
    label: "이메일 & CRM",
    items: [
      { icon: Mail, label: "이메일 연락처", path: "/admin/email-contacts" },
    ],
  },
  {
    label: "마케팅 & 분석",
    items: [
      { icon: CalendarDays, label: "시즌 캘린더", path: "/admin/seasonal-calendar" },
      { icon: TrendingUp, label: "분석 대시보드", path: "/admin/analytics" },
      { icon: Building2, label: "병원 현황", path: "/admin/hospital-overview" },
    ],
  },
  {
    label: "AI 콘텐츠 허브",
    items: [
      { icon: BrainCircuit, label: "AI 허브", path: "/ai-hub" },
      { icon: Image, label: "카드뉴스 템플릿", path: "/ai-hub/cardnews" },
      { icon: Shield, label: "검수 리포트", path: "/ai-hub?tab=report" },
    ],
  },
];

const allMenuItems = menuGroups.flatMap((g) => g.items);

/* ─── 알림 벨 컴포넌트 ─── */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, refetch } = trpc.notification.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const markRead = trpc.notification.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => refetch() });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors"
        aria-label="알림"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">알림</span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-[11px] text-brand hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />모두 읽음
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="ml-2 p-1 hover:bg-accent rounded">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            {(!notifications || notifications.length === 0) ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                알림이 없습니다
              </div>
            ) : (
              <div>
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border/30 last:border-b-0 cursor-pointer hover:bg-accent/30 transition-colors ${!n.isRead ? "bg-brand/5" : ""}`}
                    onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />}
                      <div className={!n.isRead ? "" : "ml-4"}>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              MY비서 관리자
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              관리자 대시보드에 접근하려면 로그인이 필요합니다.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            로그인
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = allMenuItems.find(
    (item) =>
      item.path === "/admin"
        ? location === "/admin"
        : location.startsWith(item.path)
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* ─── 사이드바 헤더 ─── */}
          <SidebarHeader className="h-14 justify-center border-b border-border/30">
            <div className="flex items-center gap-2.5 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold tracking-tight text-primary text-base">
                    MY
                  </span>
                  <span className="font-semibold tracking-tight text-foreground text-base">
                    비서
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    관리자
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ─── 사이드바 메뉴 (그룹별) ─── */}
          <SidebarContent className="gap-0 py-2">
            {menuGroups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? "mt-1" : ""}>
                {/* 그룹 라벨 */}
                {!isCollapsed && (
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {group.label}
                    </span>
                  </div>
                )}
                {isCollapsed && gi > 0 && (
                  <div className="mx-3 my-1 border-t border-border/20" />
                )}

                <SidebarMenu className="px-2 gap-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.path === "/admin"
                        ? location === "/admin"
                        : location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => {
                            setLocation(item.path);
                            if (isMobile) toggleSidebar();
                          }}
                          tooltip={item.label}
                          className={`${isMobile ? 'h-11' : 'h-9'} transition-all font-normal text-[13px] ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none"
                              : "hover:bg-accent/40"
                          }`}
                        >
                          <item.icon
                            className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} shrink-0 ${
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}

            {/* 홈으로 돌아가기 */}
            {!isCollapsed && (
              <div className="mt-auto pt-2 px-2">
                <button
                  onClick={() => setLocation("/")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-lg transition-colors w-full"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  홈으로 돌아가기
                </button>
              </div>
            )}
          </SidebarContent>

          {/* ─── 사이드바 푸터 (사용자 정보) ─── */}
          <SidebarFooter className="p-2 border-t border-border/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      관리자
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* 리사이즈 핸들 */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* 상단 바 — 모바일은 메뉴 + 알림, 데스크탑은 알림만 */}
        <div className="flex border-b border-border/30 h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            <div className="flex items-center gap-1.5">
              {activeMenuItem && (
                <>
                  <activeMenuItem.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">
                    {activeMenuItem.label}
                  </span>
                </>
              )}
            </div>
          </div>
          <NotificationBell />
        </div>
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </SidebarInset>
    </>
  );
}

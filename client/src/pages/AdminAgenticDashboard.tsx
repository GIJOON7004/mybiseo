/**
 * A1: 에이전틱 대시보드 — AI가 데이터 분석 → 액션 추천 → 원클릭 실행
 * 원장님 로그인 시 AI가 지난달 데이터를 분석하여 예측적 지원 제공
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo } from "react";
import {
  Brain, Zap, TrendingUp, TrendingDown, ArrowRight, CheckCircle2,
  AlertTriangle, Lightbulb, Sparkles, Target, BarChart3, Search,
  Globe, Bot, FileText, Clock, Play, Loader2, ChevronRight,
  Activity, Flame, Shield, Eye,
} from "lucide-react";
import { toast } from "sonner";

/* ── AI 추천 액션 타입 ── */
interface AIAction {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "seo" | "content" | "competitor" | "patient" | "global";
  title: string;
  description: string;
  impact: string;
  effort: string;
  icon: typeof Brain;
  actionLabel: string;
  actionPath?: string;
}

/* ── 우선순위 색상 ── */
const priorityConfig = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", label: "긴급" },
  high: { bg: "bg-amber-400/10", border: "border-amber-400/30", text: "text-amber-400", label: "높음" },
  medium: { bg: "bg-blue-400/10", border: "border-blue-400/30", text: "text-blue-400", label: "보통" },
  low: { bg: "bg-emerald-400/10", border: "border-emerald-400/30", text: "text-emerald-400", label: "낮음" },
};

const categoryIcons = {
  seo: Search,
  content: FileText,
  competitor: Target,
  patient: Bot,
  global: Globe,
};

/* ── 더미 AI 추천 (실제로는 서버에서 LLM 분석 결과를 받아옴) ── */
function generateAIActions(): AIAction[] {
  return [
    {
      id: "1", priority: "critical", category: "seo",
      title: "AI 인용 급락 감지",
      description: "ChatGPT에서 '강남 성형외과' 검색 시 병원 노출이 지난주 대비 3단계 하락했습니다. Schema 마크업 업데이트가 필요합니다.",
      impact: "AI 검색 유입 30% 회복 예상", effort: "2시간",
      icon: AlertTriangle, actionLabel: "자동 수정 실행", actionPath: "/admin/seo",
    },
    {
      id: "2", priority: "high", category: "content",
      title: "'눈밑지방재배치' 키워드 검색량 급증",
      description: "지난 2주간 '눈밑지방재배치' 검색량이 180% 증가했습니다. 관련 블로그 3개를 AI가 초안 작성했습니다.",
      impact: "월 신환 15~20명 추가 유입 예상", effort: "검토 10분",
      icon: TrendingUp, actionLabel: "초안 확인하기", actionPath: "/admin/blog-ai",
    },
    {
      id: "3", priority: "high", category: "competitor",
      title: "경쟁 병원 A 신규 시술 페이지 발견",
      description: "반경 2km 내 경쟁 병원이 '실리프팅' 전용 페이지를 새로 만들었습니다. 우리 병원도 대응 페이지가 필요합니다.",
      impact: "경쟁 키워드 선점 가능", effort: "AI 자동 생성 5분",
      icon: Eye, actionLabel: "대응 페이지 생성", actionPath: "/admin/treatment-builder",
    },
    {
      id: "4", priority: "medium", category: "patient",
      title: "야간 문의 패턴 분석",
      description: "오후 10시~새벽 1시 사이 챗봇 문의가 전체의 35%를 차지합니다. 야간 전용 프로모션 메시지를 추가하면 전환율이 올라갑니다.",
      impact: "야간 예약 전환율 20% 향상 예상", effort: "설정 5분",
      icon: Clock, actionLabel: "야간 메시지 설정",
    },
    {
      id: "5", priority: "medium", category: "global",
      title: "일본어 페이지 트래픽 증가 추세",
      description: "일본어 페이지 방문자가 지난달 대비 45% 증가했습니다. 일본어 블로그 콘텐츠를 추가하면 유입을 더 늘릴 수 있습니다.",
      impact: "일본 환자 문의 월 5건+ 추가 예상", effort: "AI 자동 번역 15분",
      icon: Globe, actionLabel: "일본어 콘텐츠 생성", actionPath: "/admin/blog-ai",
    },
    {
      id: "6", priority: "low", category: "seo",
      title: "블로그 발행 주기 최적화",
      description: "데이터 분석 결과, 화요일/목요일 오전 9시 발행 시 조회수가 평균 40% 높습니다. 스케줄러를 최적 시간으로 조정하세요.",
      impact: "블로그 조회수 40% 향상 예상", effort: "설정 2분",
      icon: BarChart3, actionLabel: "스케줄 최적화", actionPath: "/admin/scheduler",
    },
  ];
}

/* ── 성과 요약 카드 ── */
function MetricCard({ icon: Icon, label, value, change, changeLabel }: {
  icon: typeof Brain; label: string; value: string; change: number; changeLabel: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change >= 0 ? "+" : ""}{change}%
          </div>
        </div>
        <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{changeLabel}</p>
      </CardContent>
    </Card>
  );
}

/* ── 메인 컴포넌트 ── */
export default function AdminAgenticDashboard() {
  const { user } = useAuth();
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const actions = useMemo(() => generateAIActions(), []);

  const handleAction = async (action: AIAction) => {
    if (action.actionPath) {
      window.location.href = action.actionPath;
      return;
    }
    setLoadingAction(action.id);
    // 시뮬레이션
    await new Promise(r => setTimeout(r, 1500));
    setCompletedActions(prev => new Set([...Array.from(prev), action.id]));
    setLoadingAction(null);
    toast.success(`"${action.title}" 작업이 완료되었습니다`);
  };

  const criticalCount = actions.filter(a => a.priority === "critical" && !completedActions.has(a.id)).length;
  const highCount = actions.filter(a => a.priority === "high" && !completedActions.has(a.id)).length;
  const pendingCount = actions.filter(a => !completedActions.has(a.id)).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-violet-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-foreground">AI 에이전틱 대시보드</h1>
              <p className="text-sm text-muted-foreground">AI가 분석한 오늘의 추천 액션</p>
            </div>
          </div>
        </div>

        {/* 긴급 알림 배너 */}
        {criticalCount > 0 && (
          <div className="p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 animate-pulse">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-400">긴급 조치 필요 {criticalCount}건</p>
              <p className="text-[12px] text-muted-foreground">AI가 감지한 긴급 이슈가 있습니다. 즉시 확인해주세요.</p>
            </div>
          </div>
        )}

        {/* 성과 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={Search} label="검색 노출 순위" value="12위" change={-2} changeLabel="지난달 대비" />
          <MetricCard icon={Bot} label="AI 상담 건수" value="847건" change={23} changeLabel="지난달 대비" />
          <MetricCard icon={TrendingUp} label="웹사이트 방문" value="3,240" change={15} changeLabel="지난달 대비" />
          <MetricCard icon={Globe} label="해외 트래픽" value="18%" change={5} changeLabel="지난달 대비" />
        </div>

        {/* AI 추천 액션 리스트 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <h2 className="text-base font-semibold text-foreground">AI 추천 액션</h2>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {pendingCount}건 대기 중
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {actions.map((action) => {
              const pConfig = priorityConfig[action.priority];
              const CatIcon = categoryIcons[action.category];
              const isCompleted = completedActions.has(action.id);
              const isLoading = loadingAction === action.id;

              return (
                <Card key={action.id} className={`transition-all ${isCompleted ? "opacity-50" : ""}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* 아이콘 */}
                      <div className={`w-10 h-10 rounded-xl ${pConfig.bg} flex items-center justify-center shrink-0`}>
                        <action.icon className={`w-5 h-5 ${pConfig.text}`} />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pConfig.bg} ${pConfig.border} ${pConfig.text}`}>
                            {pConfig.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CatIcon className="w-3 h-3" />
                            {action.category === "seo" ? "AI 검색" : action.category === "content" ? "콘텐츠" : action.category === "competitor" ? "경쟁사" : action.category === "patient" ? "환자" : "글로벌"}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-foreground mb-1">{action.title}</h3>
                        <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">{action.description}</p>

                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Target className="w-3 h-3" />
                            예상 효과: {action.impact}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            소요: {action.effort}
                          </span>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="shrink-0">
                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            완료
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAction(action)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-background text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            {action.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* AI 인사이트 요약 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              AI 인사이트 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-[12px] text-foreground leading-relaxed">
                <strong className="text-brand">종합 분석:</strong> 지난달 대비 검색 노출은 소폭 하락했으나, AI 검색(ChatGPT, Gemini) 노출은 안정적입니다.
                해외 트래픽이 꾸준히 증가하고 있어 다국어 콘텐츠 확대가 효과적입니다.
                경쟁 병원 대비 블로그 발행 빈도가 낮으므로, 주 3회 이상 발행을 권장합니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-lg font-bold text-emerald-400">A-</p>
                <p className="text-[10px] text-muted-foreground">종합 등급</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-400/5 border border-amber-400/20 text-center">
                <p className="text-lg font-bold text-amber-400">6건</p>
                <p className="text-[10px] text-muted-foreground">추천 액션</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-400/5 border border-blue-400/20 text-center">
                <p className="text-lg font-bold text-blue-400">+15%</p>
                <p className="text-[10px] text-muted-foreground">성장 추세</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

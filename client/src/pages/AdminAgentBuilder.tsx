/**
 * B6: 에이전트 빌더 기초 — 병원 실장님이 직접 FAQ 챗봇, 블로그 봇 조립
 * + B7: 미니 앱 공장 기초 UI
 * + B9: 트로이 목마 확장 전략 로드맵 표시
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Bot, Puzzle, Zap, Plus, Settings, Play, Pause, Trash2,
  MessageSquare, FileText, Calendar, Globe, Search, TrendingUp,
  Shield, Clock, ChevronRight, Sparkles, Loader2, CheckCircle2,
  ArrowRight, Lightbulb, Target, BarChart3, Layers,
} from "lucide-react";
import { toast } from "sonner";

/* ── 에이전트 템플릿 ── */
const agentTemplates = [
  {
    id: "faq-bot",
    name: "FAQ 자동응답 봇",
    desc: "자주 묻는 질문에 AI가 자동 응답합니다. 진료시간, 가격, 위치 등 기본 문의를 처리합니다.",
    icon: MessageSquare,
    category: "환자 응대",
    difficulty: "쉬움",
    setupTime: "5분",
    features: ["자주 묻는 질문 자동 응답", "진료시간/위치 안내", "가격 문의 처리", "예약 안내"],
  },
  {
    id: "blog-bot",
    name: "블로그 자동 발행 봇",
    desc: "키워드 트렌드를 분석하여 블로그 초안을 자동 작성하고 스케줄에 맞춰 발행합니다.",
    icon: FileText,
    category: "콘텐츠",
    difficulty: "보통",
    setupTime: "10분",
    features: ["키워드 트렌드 분석", "AI 초안 자동 작성", "스케줄 발행", "AI 검색 최적화"],
  },
  {
    id: "review-bot",
    name: "리뷰 모니터링 봇",
    desc: "네이버, 구글 리뷰를 실시간 모니터링하고 부정적 리뷰 발생 시 즉시 알림을 보냅니다.",
    icon: Shield,
    category: "평판 관리",
    difficulty: "쉬움",
    setupTime: "3분",
    features: ["네이버/구글 리뷰 모니터링", "부정 리뷰 즉시 알림", "리뷰 트렌드 분석", "응답 초안 생성"],
  },
  {
    id: "seo-bot",
    name: "AI 검색 자동 최적화 봇",
    desc: "검색 순위를 주기적으로 체크하고 하락 시 자동으로 메타태그/콘텐츠를 최적화합니다.",
    icon: Search,
    category: "검색 최적화",
    difficulty: "보통",
    setupTime: "15분",
    features: ["검색 순위 자동 체크", "메타태그 자동 최적화", "하락 시 알림", "경쟁사 순위 비교"],
  },
  {
    id: "booking-bot",
    name: "예약 관리 봇",
    desc: "예약 접수, 확인, 리마인더를 자동 처리합니다. 노쇼 방지 알림도 포함됩니다.",
    icon: Calendar,
    category: "예약 관리",
    difficulty: "보통",
    setupTime: "10분",
    features: ["예약 자동 접수", "예약 확인 발송", "노쇼 방지 리마인더", "예약 통계"],
  },
  {
    id: "global-bot",
    name: "다국어 상담 봇",
    desc: "20개 언어로 해외 환자 문의에 자동 응답합니다. 의료 용어 전문 번역이 적용됩니다.",
    icon: Globe,
    category: "글로벌",
    difficulty: "쉬움",
    setupTime: "5분",
    features: ["20개 언어 자동 번역", "의료 용어 전문 번역", "해외 환자 문의 처리", "다국어 예약 안내"],
  },
];

/* ── 활성 에이전트 (시뮬레이션) ── */
interface ActiveAgent {
  id: string;
  name: string;
  status: "running" | "paused" | "error";
  tasksCompleted: number;
  lastRun: string;
  icon: typeof Bot;
}

const initialActiveAgents: ActiveAgent[] = [
  { id: "1", name: "FAQ 자동응답 봇", status: "running", tasksCompleted: 1247, lastRun: "방금 전", icon: MessageSquare },
  { id: "2", name: "블로그 자동 발행 봇", status: "running", tasksCompleted: 89, lastRun: "2시간 전", icon: FileText },
  { id: "3", name: "AI 검색 자동 최적화 봇", status: "paused", tasksCompleted: 34, lastRun: "어제", icon: Search },
];

/* ── B9: 트로이 목마 확장 로드맵 ── */
const roadmapSteps = [
  { phase: "현재", title: "AI 검색 최적화 진단 + 웹사이트", desc: "무료 AI 검색 최적화 진단으로 진입 → 맞춤 웹사이트 구축", active: true },
  { phase: "Phase 2", title: "AI 환자 응대 + CRM", desc: "챗봇 → 예약 관리 → 환자 이력 관리", active: true },
  { phase: "Phase 3", title: "마케팅 자동화", desc: "블로그 → SNS → 광고 → 콘텐츠 공장", active: true },
  { phase: "Phase 4", title: "병원 운영 OS", desc: "EMR 연동 → 재무 관리 → 인사 관리", active: false },
  { phase: "Phase 5", title: "의료 생태계 플랫폼", desc: "환자 앱 → 원격 진료 → 의료 데이터", active: false },
];

const statusConfig = {
  running: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "실행 중", dot: "bg-emerald-400" },
  paused: { bg: "bg-amber-400/10", text: "text-amber-400", label: "일시정지", dot: "bg-amber-400" },
  error: { bg: "bg-red-500/10", text: "text-red-400", label: "오류", dot: "bg-red-400" },
};

export default function AdminAgentBuilder() {
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>(initialActiveAgents);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async (templateId: string) => {
    setDeploying(true);
    const template = agentTemplates.find(t => t.id === templateId);
    await new Promise(r => setTimeout(r, 2000));
    if (template) {
      setActiveAgents(prev => [...prev, {
        id: String(Date.now()),
        name: template.name,
        status: "running",
        tasksCompleted: 0,
        lastRun: "방금 전",
        icon: template.icon,
      }]);
      toast.success(`"${template.name}" 에이전트가 배포되었습니다`);
    }
    setDeploying(false);
    setSelectedTemplate(null);
  };

  const toggleAgent = (id: string) => {
    setActiveAgents(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === "running" ? "paused" as const : "running" as const } : a
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-brand/20 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-foreground">AI 에이전트 빌더</h1>
              <p className="text-sm text-muted-foreground">AI 봇을 조립하고 배포하세요</p>
            </div>
          </div>
        </div>

        {/* 활성 에이전트 */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand" />
            활성 에이전트 ({activeAgents.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAgents.map((agent) => {
              const sc = statusConfig[agent.status];
              return (
                <Card key={agent.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                          <agent.icon className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{agent.name}</p>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${agent.status === "running" ? "animate-pulse" : ""}`} />
                            <span className={`text-[10px] ${sc.text}`}>{sc.label}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        className={`p-1.5 rounded-lg ${sc.bg} hover:brightness-110 transition-all`}
                      >
                        {agent.status === "running" ? (
                          <Pause className={`w-3.5 h-3.5 ${sc.text}`} />
                        ) : (
                          <Play className={`w-3.5 h-3.5 ${sc.text}`} />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>처리: {agent.tasksCompleted.toLocaleString()}건</span>
                      <span>마지막: {agent.lastRun}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 에이전트 템플릿 */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand" />
            에이전트 템플릿
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agentTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-brand/30 ${selectedTemplate === template.id ? "border-brand/50 ring-1 ring-brand/20" : ""}`}
                onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                      <template.icon className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground">{template.category} · {template.difficulty} · {template.setupTime}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{template.desc}</p>

                  {selectedTemplate === template.id && (
                    <div className="space-y-2 mb-3">
                      {template.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-brand shrink-0" />
                          <span className="text-[11px] text-foreground/80">{f}</span>
                        </div>
                      ))}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeploy(template.id); }}
                        disabled={deploying}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand text-background text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        {deploying ? "배포 중..." : "에이전트 배포"}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* B9: 확장 로드맵 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-brand" />
              MY비서 확장 로드맵
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roadmapSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${step.active ? "border-brand/20 bg-brand/5" : "border-border bg-muted/30 opacity-60"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${step.active ? "bg-brand text-background" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${step.active ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"}`}>
                        {step.phase}
                      </span>
                      <h3 className="text-xs font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

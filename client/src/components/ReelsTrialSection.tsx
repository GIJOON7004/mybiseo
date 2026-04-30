/**
 * AI 콘텐츠 공장 체험 — 인스타그램 릴스 제작 과정 시연
 * 마누스가 일하는 것처럼 단계별 AI 작업 과정을 실시간으로 보여줌
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowRight,
  Sparkles,
  Search,
  TrendingUp,
  Film,
  Type,
  Music,
  CheckCircle2,
  Loader2,
  Clock,
  Check,
  Play,
  Eye,
  Zap,
  Target,
  Clapperboard,
  ShieldCheck,
  Copy,
  Instagram,
  AlertTriangle,
  Scale,
  Lightbulb,
  Flame,
} from "lucide-react";

const SPECIALTIES = ["치과", "성형외과", "피부과", "안과", "정형외과", "한의원", "이비인후과", "산부인과", "내과"];

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  "치과": ["임플란트 비용과 수명", "치아 미백 전후 비교", "사랑니 발치 후 관리법"],
  "성형외과": ["코 성형 자연스러운 라인", "눈밑 지방 재배치", "안면 윤곽 수술 회복기"],
  "피부과": ["여드름 흉터 치료 방법", "보톡스 주름 개선 효과", "레이저 토닝 시술 과정"],
  "안과": ["라식 vs 라섹 차이점", "스마일라식 장단점", "노안 교정 수술"],
  "정형외과": ["무릎 관절염 운동법", "허리 디스크 비수술 치료", "어깨 회전근개 파열"],
  "한의원": ["추나요법 효과", "다이어트 한약 원리", "교통사고 한방 치료"],
  "이비인후과": ["코골이 수술 효과", "비중격 만곡증 치료", "편도 수술 회복기간"],
  "산부인과": ["임신 초기 검사 안내", "자궁근종 치료 방법", "산후 관리 프로그램"],
  "내과": ["건강검진 필수 항목", "당뇨 관리 생활습관", "갑상선 질환 증상"],
};

/* ─── 제작 단계 정의 ─── */
const PRODUCTION_STEPS = [
  {
    id: "benchmark",
    icon: Search,
    title: "트렌드 벤치마킹",
    desc: "업계 최고 조회수 릴스 분석 중...",
    doneDesc: "인기 릴스 벤치마킹 완료",
    color: "oklch(0.72 0.14 200)",
    duration: 800,
  },
  {
    id: "plan",
    icon: Target,
    title: "콘텐츠 기획",
    desc: "최적의 콘셉트와 구조 설계 중...",
    doneDesc: "릴스 콘셉트 & 구조 확정",
    color: "oklch(0.78 0.15 150)",
    duration: 600,
  },
  {
    id: "seo",
    icon: TrendingUp,
    title: "AI 최적화",
    desc: "AI 키워드 & 해시태그 최적화 중...",
    doneDesc: "캡션 & 해시태그 생성 완료",
    color: "oklch(0.72 0.15 280)",
    duration: 500,
  },
  {
    id: "video",
    icon: Film,
    title: "영상 제작 설계",
    desc: "최적의 영상 툴 선정 & 연출 기획 중...",
    doneDesc: "영상 제작 플랜 확정",
    color: "oklch(0.72 0.15 60)",
    duration: 500,
  },
  {
    id: "subtitle",
    icon: Type,
    title: "자막 설계",
    desc: "자막 스타일 & 나레이션 스크립트 작성 중...",
    doneDesc: "자막 & 스크립트 완성",
    color: "oklch(0.72 0.15 330)",
    duration: 400,
  },
  {
    id: "music",
    icon: Music,
    title: "음원 선정",
    desc: "분위기에 맞는 최적의 BGM 선정 중...",
    doneDesc: "BGM & 사운드 설계 완료",
    color: "oklch(0.72 0.15 30)",
    duration: 400,
  },
  {
    id: "quality",
    icon: ShieldCheck,
    title: "최종 품질 점검",
    desc: "발행 전 최종 체크리스트 검증 중...",
    doneDesc: "품질 검증 완료 — 발행 준비 OK",
    color: "oklch(0.72 0.18 145)",
    duration: 300,
  },
];

export default function ReelsTrialSection() {
  const [hospitalName, setHospitalName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [topic, setTopic] = useState("");
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  const trialMutation = trpc.interviewContent.trialReelsProduction.useMutation({
    onError: (err: any) => {
      toast.error(err.message || "생성에 실패했습니다");
      setActiveStep(-1);
      setCompletedSteps(new Set());
    },
  });

  // 단계별 애니메이션 진행
  const animateSteps = useCallback(() => {
    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= PRODUCTION_STEPS.length) {
        // 모든 단계 완료
        setTimeout(() => setShowResult(true), 400);
        return;
      }
      setActiveStep(stepIndex);
      const duration = PRODUCTION_STEPS[stepIndex].duration;
      setTimeout(() => {
        setCompletedSteps((prev) => { const next = new Set(prev); next.add(stepIndex); return next; });
        stepIndex++;
        runStep();
      }, duration);
    };
    runStep();
  }, []);

  // mutation 성공 시 단계 애니메이션 시작
  useEffect(() => {
    if (trialMutation.data && activeStep === -1) {
      // 데이터 도착하면 단계 시연 시작
      animateSteps();
    }
  }, [trialMutation.data, activeStep, animateSteps]);

  // 결과 표시 시 스크롤
  useEffect(() => {
    if (showResult && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [showResult]);

  const handleSpecialtyChange = (val: string) => {
    setSpecialty(val);
    setTopic("");
  };

  const handleGenerate = () => {
    if (!hospitalName.trim()) { toast.error("병원명을 입력해주세요."); return; }
    if (!specialty) { toast.error("진료과를 선택해주세요."); return; }
    if (!topic.trim()) { toast.error("릴스 주제를 선택하거나 입력해주세요."); return; }

    setActiveStep(-1);
    setCompletedSteps(new Set());
    setShowResult(false);

    trialMutation.mutate({
      hospitalName: hospitalName.trim(),
      specialty,
      topic: topic.trim(),
    });
  };

  const handleCopyScript = async () => {
    if (!trialMutation.data) return;
    await navigator.clipboard.writeText(trialMutation.data.script);
    setCopied(true);
    toast.success("스크립트가 클립보드에 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  };

  const data = trialMutation.data;

  return (
    <section id="try-reels" className="py-16 sm:py-24 bg-card/30">
      <div className="container max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium mb-4"
            style={{
              background: "oklch(0.72 0.15 330 / 0.1)",
              color: "oklch(0.78 0.15 330)",
              border: "1px solid oklch(0.72 0.15 330 / 0.2)",
            }}
          >
            <Instagram className="w-3.5 h-3.5" />
            무료 체험 · 로그인 불필요
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
            AI가 <span style={{ color: "oklch(0.78 0.15 330)" }}>인스타 릴스</span>를 만드는 과정을 직접 보세요
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            진료과와 주제만 입력하면, AI가 벤치마킹부터 기획, 영상 설계, 자막, 음원 선정, 최종 점검까지
            <br className="hidden sm:block" />
            릴스 제작 전 과정을 실시간으로 시연합니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <Card className="border-border/50 shadow-lg mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  병원명 <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="예: OO치과의원"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  disabled={trialMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  진료과 <span className="text-destructive">*</span>
                </label>
                <Select value={specialty} onValueChange={handleSpecialtyChange} disabled={trialMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="진료과 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 주제 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                릴스 주제 <span className="text-destructive">*</span>
              </label>
              {specialty && TOPIC_SUGGESTIONS[specialty] && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {TOPIC_SUGGESTIONS[specialty].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      disabled={trialMutation.isPending}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        topic === t
                          ? "bg-brand text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <Input
                placeholder="릴스 주제를 직접 입력하거나 위에서 선택하세요"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={trialMutation.isPending}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={trialMutation.isPending}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {trialMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI가 릴스 제작 과정을 준비하고 있습니다...
                </>
              ) : (
                <>
                  <Clapperboard className="w-5 h-5 mr-2" />
                  릴스 제작 과정 체험하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ─── 단계별 진행 시연 ─── */}
        {(trialMutation.isPending || activeStep >= 0) && (
          <div ref={stepsRef} className="space-y-3 mb-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-sm font-medium text-brand">AI 릴스 제작 에이전트 작업 중</span>
            </div>

            {PRODUCTION_STEPS.map((step, i) => {
              const isCompleted = completedSteps.has(i);
              const isActive = activeStep === i;
              const isWaiting = activeStep < i && !isCompleted;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-500/8 border border-emerald-500/20"
                      : isActive
                      ? "bg-brand/8 border border-brand/30 shadow-md"
                      : "bg-muted/30 border border-border/20 opacity-50"
                  }`}
                  style={
                    isActive
                      ? { animation: "pulse 1.5s ease-in-out infinite" }
                      : undefined
                  }
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? "bg-emerald-500/15"
                        : isActive
                        ? "bg-brand/15"
                        : "bg-muted/50"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: step.color }} />
                    ) : (
                      <step.icon className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isCompleted
                            ? "text-emerald-400"
                            : isActive
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {step.title}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                          완료
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        isCompleted
                          ? "text-emerald-400/70"
                          : isActive
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {isCompleted ? step.doneDesc : isActive ? step.desc : step.title}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-16 h-1 rounded-full bg-muted overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{
                          animation: `progress ${step.duration}ms linear forwards`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── 결과 표시 ─── */}
        {showResult && data && (
          <div ref={resultRef} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 완료 배너 */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-400">릴스 제작 플랜 완성</p>
                <p className="text-[11px] text-muted-foreground">
                  실제 서비스에서는 이 플랜을 기반으로 영상 자동 생성까지 진행됩니다
                </p>
              </div>
            </div>

            {/* 1. 벤치마킹 결과 */}
            <Card className="border-border/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2" style={{ background: "oklch(0.72 0.14 200 / 0.06)" }}>
                <Search className="w-4 h-4" style={{ color: "oklch(0.72 0.14 200)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(0.72 0.14 200)" }}>STEP 1 — 트렌드 벤치마킹</span>
              </div>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">인기 릴스 분석</h4>
                  <div className="space-y-3">
                    {data.benchmarkAnalysis.topReels.map((reel: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                          <Eye className="w-4 h-4 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{reel.account}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-medium">{reel.views}</span>
                          </div>
                          <p className="text-xs text-brand font-medium mb-1">훅: "{reel.hook}"</p>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {reel.hookType && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.72 0.14 200 / 0.12)", color: "oklch(0.78 0.14 200)" }}>
                                <Zap className="w-2.5 h-2.5" />
                                훅: {reel.hookType}
                              </span>
                            )}
                            {reel.storytellingStructure && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.72 0.15 150 / 0.12)", color: "oklch(0.78 0.15 150)" }}>
                                <Film className="w-2.5 h-2.5" />
                                구조: {reel.storytellingStructure}
                              </span>
                            )}
                            {reel.format && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.72 0.15 280 / 0.12)", color: "oklch(0.78 0.15 280)" }}>
                                <Clapperboard className="w-2.5 h-2.5" />
                                포맷: {reel.format}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{reel.whyItWorked}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 바이럴 공식 요약 카드 */}
                {data.benchmarkAnalysis.viralFormula && (
                  <div className="p-5 rounded-xl border-2 relative overflow-hidden" style={{ borderColor: "oklch(0.72 0.15 60 / 0.4)", background: "oklch(0.72 0.15 60 / 0.06)" }}>
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.06]" style={{ background: "radial-gradient(circle, oklch(0.78 0.15 60), transparent 70%)" }} />
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.72 0.15 60 / 0.15)" }}>
                        <Flame className="w-4.5 h-4.5" style={{ color: "oklch(0.78 0.15 60)" }} />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "oklch(0.78 0.15 60)" }}>이 릴스가 바이럴된 핵심 공식</span>
                        <span className="text-[10px] text-muted-foreground">훅 + 구조 + 포맷 시너지 분석</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground leading-relaxed pl-10">"{data.benchmarkAnalysis.viralFormula}"</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">트렌드 키워드</div>
                    <div className="flex flex-wrap gap-1">
                      {data.benchmarkAnalysis.trendKeywords.map((kw: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">최적 길이 & 시간</div>
                    <p className="text-xs text-foreground">{data.benchmarkAnalysis.optimalLength}</p>
                    <p className="text-xs text-muted-foreground">{data.benchmarkAnalysis.bestPostingTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. 콘텐츠 기획 */}
            <Card className="border-border/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2" style={{ background: "oklch(0.78 0.15 150 / 0.06)" }}>
                <Target className="w-4 h-4" style={{ color: "oklch(0.78 0.15 150)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(0.78 0.15 150)" }}>STEP 2 — 콘텐츠 기획</span>
              </div>
              <CardContent className="pt-4 space-y-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">콘셉트</div>
                  <p className="text-sm font-semibold text-foreground">{data.contentPlan.concept}</p>
                </div>
                <div className="p-3 rounded-lg border border-brand/20" style={{ background: "oklch(0.72 0.14 200 / 0.04)" }}>
                  <div className="text-[10px] font-semibold text-brand uppercase mb-1">첫 3초 훅 (가장 중요)</div>
                  <p className="text-sm font-bold text-brand">"{data.contentPlan.hook}"</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">타임라인 구조</h4>
                  <div className="space-y-2">
                    {data.contentPlan.structure.map((seg: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="text-[11px] font-mono font-bold text-brand bg-brand/10 px-2 py-1 rounded shrink-0 min-w-[60px] text-center">
                          {seg.timestamp}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{seg.content}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{seg.visualDirection}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">CTA (행동 유도)</div>
                  <p className="text-sm text-foreground">{data.contentPlan.cta}</p>
                </div>
              </CardContent>
            </Card>

            {/* 3. AI 가시성 최적화 */}
            <Card className="border-border/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2" style={{ background: "oklch(0.72 0.15 280 / 0.06)" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.72 0.15 280)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(0.72 0.15 280)" }}>STEP 3 — AI 최적화</span>
              </div>
              <CardContent className="pt-4 space-y-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">캡션</div>
                  <p className="text-sm text-foreground whitespace-pre-line">{data.seoOptimization.caption}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">해시태그</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.seoOptimization.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">AI 키워드</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.seoOptimization.keywords.map((kw: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-foreground">{kw}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. 제작 도구 & 5. 자막 & 6. 음원 */}
            <Card className="border-border/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2" style={{ background: "oklch(0.72 0.15 60 / 0.06)" }}>
                <Clapperboard className="w-4 h-4" style={{ color: "oklch(0.72 0.15 60)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(0.72 0.15 60)" }}>STEP 4~6 — 제작 도구 & 자막 & 음원</span>
              </div>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <Film className="w-5 h-5 text-brand" />
                    <div className="text-xs font-semibold text-muted-foreground uppercase">영상 툴</div>
                    <p className="text-sm font-semibold text-foreground">{data.productionPlan.videoTool}</p>
                    <p className="text-xs text-muted-foreground">{data.productionPlan.videoReason}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <Type className="w-5 h-5" style={{ color: "oklch(0.72 0.15 330)" }} />
                    <div className="text-xs font-semibold text-muted-foreground uppercase">자막 툴</div>
                    <p className="text-sm font-semibold text-foreground">{data.productionPlan.subtitleTool}</p>
                    <p className="text-xs text-muted-foreground">{data.productionPlan.subtitleStyle}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <Music className="w-5 h-5" style={{ color: "oklch(0.72 0.15 30)" }} />
                    <div className="text-xs font-semibold text-muted-foreground uppercase">음원 툴</div>
                    <p className="text-sm font-semibold text-foreground">{data.productionPlan.musicTool}</p>
                    <p className="text-xs text-muted-foreground">{data.productionPlan.musicGenre}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">썸네일 팁</div>
                  <p className="text-xs text-foreground">{data.productionPlan.thumbnailTip}</p>
                </div>
              </CardContent>
            </Card>

            {/* 나레이션 스크립트 */}
            <Card className="border-brand/20 shadow-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-brand/20 flex items-center justify-between bg-brand/5">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-brand" />
                  <span className="text-sm font-semibold text-brand">나레이션 스크립트 (자막용)</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyScript} className="h-7 text-xs">
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "복사됨" : "복사"}
                </Button>
              </div>
              <CardContent className="pt-4">
                <div className="p-4 rounded-lg bg-muted/30 whitespace-pre-line text-sm text-foreground leading-relaxed">
                  {data.script}
                </div>
              </CardContent>
            </Card>

            {/* 7. 최종 품질 체크리스트 */}
            <Card className="border-border/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2" style={{ background: "oklch(0.72 0.18 145 / 0.06)" }}>
                <ShieldCheck className="w-4 h-4" style={{ color: "oklch(0.72 0.18 145)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(0.72 0.18 145)" }}>STEP 7 — 최종 품질 점검</span>
              </div>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {data.qualityChecklist.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 의료법 준수 검증 */}
            {data.medicalLawCompliance && (
              <Card className="overflow-hidden" style={{ borderColor: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145 / 0.3)" : "oklch(0.65 0.2 30 / 0.3)" }}>
                <div
                  className="px-5 py-3 border-b flex items-center justify-between"
                  style={{
                    background: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145 / 0.06)" : "oklch(0.65 0.2 30 / 0.06)",
                    borderColor: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145 / 0.2)" : "oklch(0.65 0.2 30 / 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" style={{ color: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145)" : "oklch(0.65 0.2 30)" }} />
                    <span className="text-sm font-semibold" style={{ color: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145)" : "oklch(0.65 0.2 30)" }}>
                      의료광고법 준수 검증
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-full font-bold uppercase"
                    style={{
                      background: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145 / 0.15)" : "oklch(0.65 0.2 30 / 0.15)",
                      color: data.medicalLawCompliance.passed ? "oklch(0.72 0.18 145)" : "oklch(0.65 0.2 30)",
                    }}
                  >
                    {data.medicalLawCompliance.passed ? "✓ 적합" : "⚠ 주의필요"}
                  </span>
                </div>
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-2">
                    {data.medicalLawCompliance.checkedItems.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  {data.medicalLawCompliance.warnings.length > 0 && data.medicalLawCompliance.warnings[0] !== "" && (
                    <div className="space-y-2">
                      {data.medicalLawCompliance.warnings.map((w: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "oklch(0.65 0.2 60 / 0.06)" }}>
                          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "oklch(0.75 0.15 60)" }} />
                          <span className="text-sm text-foreground">{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 경쟁사 트렌드 인사이트 */}
            {data.competitorTrendInsight && (
              <Card className="border-brand/20 overflow-hidden shadow-lg">
                <div className="px-5 py-3 border-b border-brand/20 flex items-center gap-2 bg-brand/5">
                  <Lightbulb className="w-4 h-4 text-brand" />
                  <span className="text-sm font-semibold text-brand">시장 트렌드 인사이트</span>
                </div>
                <CardContent className="pt-4 space-y-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">현재 트렌드</div>
                    <p className="text-sm text-foreground">{data.competitorTrendInsight.currentTrend}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">떠오르는 주제</div>
                      <div className="space-y-1.5">
                        {data.competitorTrendInsight.risingTopics.map((t: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-brand shrink-0" />
                            <span className="text-xs text-foreground">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-brand/20" style={{ background: "oklch(0.72 0.14 200 / 0.04)" }}>
                      <div className="text-[10px] font-semibold text-brand uppercase mb-2">다음 추천 주제</div>
                      <div className="space-y-1.5">
                        {data.competitorTrendInsight.recommendedNextTopics.map((t: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-brand shrink-0" />
                            <span className="text-xs font-medium text-foreground">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-brand/20 bg-brand/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-brand" />
                      <span className="text-[10px] font-bold text-brand uppercase">시장 인사이트</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{data.competitorTrendInsight.marketInsight}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 다음 단계 CTA */}
            <div className="text-center pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                실제 서비스에서는 이 플랜을 기반으로 <strong className="text-foreground">영상 자동 생성 + 자막 합성 + BGM 적용</strong>까지 원클릭으로 완성됩니다
              </p>
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                무료로 시작하기
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 프로그레스 바 애니메이션 */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}

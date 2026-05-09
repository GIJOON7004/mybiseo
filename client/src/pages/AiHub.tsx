import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Sparkles, Copy, Check, FileText, Search, BookOpen,
  Megaphone, Camera, MessageSquare, Image, Heart, Video, Mic,
  Tag, Clock, Clapperboard, Shield, ShieldCheck, ShieldAlert,
  AlertTriangle, ChevronRight, ArrowRight, LayoutGrid, History,
  ExternalLink, Download, BarChart3, TrendingUp, Eye,
} from "lucide-react";

const SPECIALTIES = [
  "성형외과", "피부과", "치과", "안과", "한의원",
  "내과", "정형외과", "산부인과", "비뇨기과", "기타",
];
const ICON_MAP: Record<string, any> = {
  BookOpen, Megaphone, Camera, MessageSquare, Image, Heart, Video, Mic, Search, Clapperboard,
};
const CATEGORY_COLORS: Record<string, string> = {
  "네이버 블로그": "bg-green-500/10 text-green-600 border-green-500/20",
  "SNS/카카오": "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "카드뉴스": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "영상 스크립트": "bg-purple-500/10 text-purple-600 border-purple-500/20",
};
const FIELD_LABELS: Record<string, { label: string; placeholder: string }> = {
  procedure: { label: "시술/진료명", placeholder: "예: 눈성형, 코필러, 보톡스" },
  keyword: { label: "키워드/주제", placeholder: "예: 겨울철 피부관리, 치아미백 후기" },
  topic: { label: "주제", placeholder: "예: 건강검진 안내, 신규 장비 도입" },
  eventDetail: { label: "이벤트 내용", placeholder: "예: 개원 1주년 기념 20% 할인" },
  noticeContent: { label: "공지 내용", placeholder: "예: 설 연휴 진료 안내" },
};

export default function AiHub() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("presets");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Sparkles className="w-12 h-12 text-primary" />
        <h2 className="text-xl font-bold">AI 콘텐츠 허브</h2>
        <p className="text-muted-foreground">로그인 후 이용할 수 있습니다.</p>
        <Button asChild><a href={getLoginUrl()}>로그인</a></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI 콘텐츠 허브
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            템플릿을 선택하고, AI가 초안을 작성하고, 의료광고법을 검수합니다.
          </p>
        </div>
        <StatsBar />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presets" className="flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">템플릿</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">의료법 검수</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">검수 리포트</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">생성 내역</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-6">
          <PresetSelector />
        </TabsContent>
        <TabsContent value="review" className="mt-6">
          <StandaloneReview />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ReviewReport />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <RecentContents />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── 통계 바 ─── */
function StatsBar() {
  const statsQuery = trpc.aiHub.myStats.useQuery();
  if (!statsQuery.data) return null;
  const s = statsQuery.data;
  return (
    <div className="flex gap-3 text-sm">
      <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium">
        블로그 {s.blog || 0}
      </div>
      <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-medium">
        카드뉴스 {s.cardnews || 0}
      </div>
      <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 font-medium">
        영상 {s.video_script || 0}
      </div>
    </div>
  );
}

/* ─── 프리셋 선택 ─── */
function PresetSelector() {
  const presetsQuery = trpc.aiHub.presets.useQuery();
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("전체");

  const categories = useMemo(() => {
    if (!presetsQuery.data) return ["전체"];
    const cats = Array.from(new Set(presetsQuery.data.map((p: any) => p.category)));
    return ["전체", ...cats];
  }, [presetsQuery.data]);

  const filtered = useMemo(() => {
    if (!presetsQuery.data) return [];
    if (categoryFilter === "전체") return presetsQuery.data;
    return presetsQuery.data.filter((p: any) => p.category === categoryFilter);
  }, [presetsQuery.data, categoryFilter]);

  if (selectedPreset) {
    return <PresetForm preset={selectedPreset} onBack={() => setSelectedPreset(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
            className={categoryFilter !== cat ? (CATEGORY_COLORS[cat]?.split(" ").slice(0, 2).join(" ") || "") : ""}
          >
            {cat}
          </Button>
        ))}
      </div>

      {presetsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((preset: any) => {
            const IconComp = ICON_MAP[preset.icon] || FileText;
            const catColor = CATEGORY_COLORS[preset.category] || "";
            return (
              <Card
                key={preset.id}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                onClick={() => setSelectedPreset(preset)}
              >
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComp className="w-5 h-5 text-primary" />
                      </div>
                      <Badge variant="outline" className={`text-xs ${catColor}`}>{preset.category}</Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{preset.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preset.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── 프리셋 폼 + 결과 ─── */
function PresetForm({ preset, onBack }: { preset: any; onBack: () => void }) {
  const [hospitalName, setHospitalName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [userInput, setUserInput] = useState("");
  const [enableReview, setEnableReview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showNaverDialog, setShowNaverDialog] = useState(false);
  const utils = trpc.useUtils();

  const mutation = trpc.aiHub.generateFromPreset.useMutation({
    onSuccess: () => {
      utils.aiHub.myStats.invalidate();
      utils.aiHub.myContents.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const naverMutation = trpc.aiHub.prepareNaverBlog.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const mainField = preset.fields.find((f: string) =>
    ["procedure", "keyword", "topic", "eventDetail", "noticeContent"].includes(f)
  );
  const fieldInfo = mainField ? FIELD_LABELS[mainField] : { label: "내용", placeholder: "생성할 내용을 입력하세요" };
  const hasDuration = preset.fields.includes("duration");
  const [duration, setDuration] = useState("30s");

  const handleGenerate = () => {
    if (!hospitalName || !specialty || !userInput) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return;
    }
    const finalInput = hasDuration ? `${userInput} (${duration})` : userInput;
    mutation.mutate({
      presetId: preset.id,
      hospitalName,
      specialty,
      userInput: finalInput,
      enableReview,
    });
  };

  const handleCopy = async () => {
    if (!mutation.data) return;
    const d = mutation.data.draft;
    let text = "";
    if (d.content) {
      text = `${d.title}\n\n${d.content}\n\n${(d.tags || []).map((t: string) => `#${t}`).join(" ")}`;
    } else if (d.slides) {
      text = d.slides.map((s: any, i: number) => `[${i === 0 ? "표지" : `${i + 1}장`}] ${s.title}\n${s.body}`).join("\n\n");
      if (d.hashtags) text += `\n\n${d.hashtags.map((h: string) => `#${h}`).join(" ")}`;
    } else if (d.scenes) {
      text = `${d.title}\n\n` + d.scenes.map((s: any) => `[장면 ${s.scene}] ${s.duration}\n나레이션: ${s.narration}\n화면: ${s.visual}`).join("\n\n");
      if (d.bgm) text += `\n\nBGM: ${d.bgm}`;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("복사되었습니다");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNaverPublish = () => {
    if (!mutation.data?.id) {
      toast.error("콘텐츠 ID를 찾을 수 없습니다.");
      return;
    }
    naverMutation.mutate({ contentId: mutation.data.id! });
    setShowNaverDialog(true);
  };

  const IconComp = ICON_MAP[preset.icon] || FileText;
  const isBlogType = preset.category === "네이버 블로그";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← 템플릿 목록</Button>
        <div className="flex items-center gap-2">
          <IconComp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">{preset.name}</h2>
        </div>
      </div>

      {/* 입력 폼 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">병원명 <span className="text-destructive">*</span></label>
              <Input placeholder="예: OO성형외과" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} disabled={mutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">진료과 <span className="text-destructive">*</span></label>
              <Select value={specialty} onValueChange={setSpecialty} disabled={mutation.isPending}>
                <SelectTrigger><SelectValue placeholder="진료과 선택" /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{fieldInfo.label} <span className="text-destructive">*</span></label>
            <Textarea
              placeholder={fieldInfo.placeholder}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={mutation.isPending}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{preset.promptHint}</p>
          </div>

          {hasDuration && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">영상 길이</label>
              <Select value={duration} onValueChange={setDuration} disabled={mutation.isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15s">15초 (릴스/쇼츠)</SelectItem>
                  <SelectItem value="30s">30초 (릴스/쇼츠)</SelectItem>
                  <SelectItem value="60s">60초 (유튜브 쇼츠)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">의료광고법 자동 검수</p>
              <p className="text-xs text-muted-foreground">생성된 콘텐츠를 의료법 기준으로 검토합니다</p>
            </div>
            <button
              onClick={() => setEnableReview(!enableReview)}
              className={`relative w-11 h-6 rounded-full transition-colors ${enableReview ? "bg-primary" : "bg-muted-foreground/30"}`}
              disabled={mutation.isPending}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enableReview ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <Button onClick={handleGenerate} disabled={mutation.isPending} className="w-full" size="lg">
            {mutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />AI가 작업 중입니다...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />콘텐츠 생성</>
            )}
          </Button>
        </CardContent>
      </Card>

      {mutation.isPending && <PipelineProgress enableReview={enableReview} />}

      {mutation.data && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {enableReview ? "초안 생성 + 의료법 검수 완료" : "콘텐츠 생성 완료"}
            </span>
          </div>

          {/* 액션 버튼 바 */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "복사됨" : "전체 복사"}
            </Button>
            {isBlogType && (
              <Button variant="outline" size="sm" onClick={handleNaverPublish} disabled={naverMutation.isPending}>
                {naverMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                네이버 블로그 발행
              </Button>
            )}
            {mutation.data.draft?.slides && (
              <CardnewsImageButton
                title={mutation.data.draft.title || "카드뉴스"}
                slides={mutation.data.draft.slides}
                hospitalName={hospitalName}
                specialty={specialty}
              />
            )}
          </div>

          <ContentResult data={mutation.data} />
          {mutation.data.review && <ReviewResult review={mutation.data.review} />}
        </div>
      )}

      {/* 네이버 블로그 발행 다이얼로그 */}
      <NaverPublishDialog
        open={showNaverDialog}
        onClose={() => setShowNaverDialog(false)}
        data={naverMutation.data}
        isLoading={naverMutation.isPending}
        contentId={mutation.data?.id}
      />
    </div>
  );
}

/* ─── 파이프라인 진행 시각화 ─── */
function PipelineProgress({ enableReview }: { enableReview: boolean }) {
  const steps = [
    { label: "프롬프트 최적화", icon: Sparkles, status: "done" as const },
    { label: "초안 작성 중", icon: FileText, status: "active" as const },
    ...(enableReview ? [{ label: "의료광고법 검수", icon: Shield, status: "pending" as const }] : []),
  ];

  return (
    <Card className="border-primary/20">
      <CardContent className="py-5">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                step.status === "done" ? "bg-green-500/10 text-green-600" :
                step.status === "active" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {step.status === "active" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="font-medium">{step.label}</span>
              </div>
              {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 콘텐츠 결과 ─── */
function ContentResult({ data }: { data: any }) {
  const d = data.draft;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {d.title || "생성된 콘텐츠"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.content && (
          <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px]">
            {d.content}
          </div>
        )}

        {d.slides && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {d.slides.map((slide: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-4 space-y-2">
                <Badge variant="outline" className="text-xs">{i === 0 ? "표지" : `${i + 1}장`}</Badge>
                <p className="font-semibold text-sm">{slide.title}</p>
                <p className="text-sm text-foreground/80">{slide.body}</p>
                {slide.note && <p className="text-xs text-muted-foreground">참고: {slide.note}</p>}
              </div>
            ))}
          </div>
        )}

        {d.scenes && (
          <div className="space-y-3">
            {d.scenes.map((scene: any) => (
              <div key={scene.scene} className="border border-border/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">장면 {scene.scene}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {scene.duration}
                  </span>
                </div>
                <p className="text-sm"><span className="font-medium">나레이션:</span> {scene.narration}</p>
                <p className="text-sm text-muted-foreground"><span className="font-medium">화면:</span> {scene.visual}</p>
              </div>
            ))}
            {d.bgm && <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">추천 BGM: {d.bgm}</p>}
          </div>
        )}

        {(d.tags?.length > 0 || d.hashtags?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
            <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
            {(d.tags || d.hashtags || []).map((tag: string, i: number) => (
              <span key={i} className="text-sm text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── 의료법 검수 결과 ─── */
function ReviewResult({ review }: { review: any }) {
  const verdictConfig = {
    pass: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10 border-green-500/20", label: "적합" },
    warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20", label: "경미한 수정 필요" },
    fail: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-500/10 border-red-500/20", label: "수정 필요" },
  };
  const v = verdictConfig[review.verdict as keyof typeof verdictConfig] || verdictConfig.warning;
  const VerdictIcon = v.icon;

  return (
    <Card className={`border ${v.bg.split(" ")[1]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            의료광고법 검수 결과
          </CardTitle>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${v.bg}`}>
            <VerdictIcon className={`w-4 h-4 ${v.color}`} />
            <span className={`text-sm font-semibold ${v.color}`}>{v.label}</span>
            <span className={`text-sm font-bold ${v.color}`}>{review.score}점</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/80">{review.summary}</p>

        {review.issues?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              검수 지적 사항 ({review.issues.length}건)
            </h4>
            {review.issues.map((issue: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={issue.severity === "high" ? "destructive" : issue.severity === "medium" ? "default" : "secondary"}>
                    {issue.severity === "high" ? "위험" : issue.severity === "medium" ? "주의" : "참고"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{issue.clause}</span>
                </div>
                <div className="bg-red-500/5 rounded p-2">
                  <p className="text-foreground/70 line-through">{issue.original}</p>
                </div>
                <div className="bg-green-500/5 rounded p-2">
                  <p className="text-foreground">→ {issue.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {review.revisedContent && review.verdict !== "pass" && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              검수 완료 수정본
            </h4>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{review.revisedContent}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── 네이버 블로그 발행 다이얼로그 (UX 개선) ─── */
function NaverPublishDialog({ open, onClose, data, isLoading, contentId }: {
  open: boolean;
  onClose: () => void;
  data: any;
  isLoading: boolean;
  contentId?: number;
}) {
  const [postUrl, setPostUrl] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const markMutation = trpc.aiHub.markNaverPublished.useMutation({ onSuccess: () => {
      toast.success("발행 완료로 기록되었습니다.");
      onClose();
      setCurrentStep(1);
    },
  onError: (err) => toast.error(err.message) });

  const handleCopyField = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field === "title" ? "제목" : field === "html" ? "본문 HTML" : "태그"}가 복사되었습니다.`);
    setTimeout(() => setCopiedField(null), 2000);
    // 자동으로 다음 단계로
    if (field === "title" && currentStep === 1) setCurrentStep(2);
    if (field === "html" && currentStep === 2) setCurrentStep(3);
  };

  const handleMarkPublished = () => {
    if (contentId) {
      markMutation.mutate({ contentId, postUrl: postUrl || undefined });
    }
  };

  // 태그 추출
  const extractTags = () => {
    if (!data?.originalContent) return "";
    try {
      const parsed = JSON.parse(data.originalContent);
      if (parsed.tags) return parsed.tags.map((t: string) => `#${t}`).join(" ");
    } catch { /* ignore */ }
    return "";
  };

  const tags = data ? extractTags() : "";

  const steps = [
    { num: 1, label: "제목 복사", icon: "📋" },
    { num: 2, label: "본문 복사", icon: "📝" },
    { num: 3, label: "태그 복사 + 발행", icon: "🏷️" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setCurrentStep(1); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-green-600" />
            네이버 블로그 발행 가이드
          </DialogTitle>
          <DialogDescription>
            아래 3단계를 따라 네이버 블로그에 글을 발행하세요.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">네이버 블로그 호환 HTML 변환 중...</span>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* 진행 단계 표시 */}
            <div className="flex items-center justify-between px-2">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    currentStep === step.num
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.num
                        ? "bg-green-500/10 text-green-700"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.num ? <Check className="w-4 h-4" /> : <span>{step.icon}</span>}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">Step {step.num}</span>
                  </div>
                  {i < steps.length - 1 && <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />}
                </div>
              ))}
            </div>

            {/* 네이버 블로그 바로가기 */}
            <a
              href="https://blog.naver.com/postwrite"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">N</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">네이버 블로그 새 글 쓰기</p>
                <p className="text-xs text-green-600/70">클릭하면 새 탭에서 에디터가 열립니다</p>
              </div>
              <ExternalLink className="w-4 h-4 text-green-600" />
            </a>

            {/* Step 1: 제목 복사 */}
            <div className={`space-y-2 p-4 rounded-lg border transition-colors ${
              currentStep === 1 ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                  제목
                </h4>
                <Button
                  variant={copiedField === "title" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCopyField("title", data.title)}
                >
                  {copiedField === "title" ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copiedField === "title" ? "복사됨" : "제목 복사"}
                </Button>
              </div>
              <div className="bg-background border border-border rounded-md p-3">
                <p className="text-sm font-medium">{data.title}</p>
              </div>
            </div>

            {/* Step 2: 본문 HTML 복사 */}
            <div className={`space-y-2 p-4 rounded-lg border transition-colors ${
              currentStep === 2 ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                  본문 (HTML)
                  <Badge variant="outline" className="text-xs">에디터 HTML 모드에 붙여넣기</Badge>
                </h4>
                <Button
                  variant={copiedField === "html" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCopyField("html", data.html)}
                >
                  {copiedField === "html" ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copiedField === "html" ? "복사됨" : "본문 복사"}
                </Button>
              </div>
              <div className="bg-background border border-border rounded-md p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-foreground/70 whitespace-pre-wrap break-all">{data.html}</pre>
              </div>
              <p className="text-xs text-muted-foreground">
                네이버 블로그 에디터 상단의 <strong>"HTML"</strong> 버튼을 클릭한 후 붙여넣으세요.
              </p>
            </div>

            {/* Step 3: 태그 복사 */}
            <div className={`space-y-2 p-4 rounded-lg border transition-colors ${
              currentStep === 3 ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                  태그
                </h4>
                {tags && (
                  <Button
                    variant={copiedField === "tags" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCopyField("tags", tags)}
                  >
                    {copiedField === "tags" ? <Check className="w-4 h-4 mr-1" /> : <Tag className="w-4 h-4 mr-1" />}
                    {copiedField === "tags" ? "복사됨" : "태그 복사"}
                  </Button>
                )}
              </div>
              {tags ? (
                <div className="bg-background border border-border rounded-md p-3">
                  <p className="text-sm text-foreground/80">{tags}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">태그 정보가 없습니다. 발행 시 직접 입력해주세요.</p>
              )}
            </div>

            {/* 발행 완료 기록 */}
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="text-sm font-semibold">발행 완료 기록</h4>
              <div className="space-y-2">
                <Input
                  placeholder="https://blog.naver.com/myblog/... (발행 후 URL 입력)"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">발행 완료 후 URL을 입력하면 기록으로 남깁니다.</p>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onClose(); setCurrentStep(1); }}>닫기</Button>
          {data && (
            <Button onClick={handleMarkPublished} disabled={markMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {markMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              발행 완료 기록
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 카드뉴스 이미지 생성 버튼 ─── */
function CardnewsImageButton({ title, slides, hospitalName, specialty }: {
  title: string;
  slides: any[];
  hospitalName: string;
  specialty: string;
}) {
  const [style, setStyle] = useState<"modern" | "warm" | "clinical" | "bold">("modern");
  const [showDialog, setShowDialog] = useState(false);

  const mutation = trpc.aiHub.generateCardnewsImage.useMutation({
    onSuccess: () => toast.success("카드뉴스 이미지가 생성되었습니다!"),
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    mutation.mutate({
      title,
      items: slides.map((s: any) => `${s.title}: ${s.body}`).slice(0, 6),
      style,
      hospitalName,
      specialty,
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowDialog(true)}>
        <Image className="w-4 h-4 mr-1" />
        카드뉴스 이미지 생성
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              카드뉴스 이미지 생성
            </DialogTitle>
            <DialogDescription>
              스타일을 선택하면 각 슬라이드를 이미지로 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">스타일 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "modern" as const, label: "모던 다크", color: "bg-[#1a1a2e] text-[#00d4aa]" },
                  { id: "warm" as const, label: "따뜻한 톤", color: "bg-[#fef3e2] text-[#e67e22]" },
                  { id: "clinical" as const, label: "클리닉 블루", color: "bg-[#f0f4f8] text-[#2563eb]" },
                  { id: "bold" as const, label: "볼드 퍼플", color: "bg-[#7c3aed] text-[#fbbf24]" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      style === s.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                    } ${s.color}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              총 {Math.min(slides.length, 6) + 2}장 생성 (표지 + 콘텐츠 {Math.min(slides.length, 6)}장 + 마무리)
            </p>

            {mutation.data && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  생성 완료 ({mutation.data.slideCount}장)
                </h4>
                {mutation.data.coverImageUrl && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">AI 생성 표지 이미지</p>
                    <img src={mutation.data.coverImageUrl} alt="표지" className="w-full rounded-lg border border-border" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {mutation.data.slides.map((url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      {i === 0 ? "표지" : i === mutation.data.slides.length - 1 ? "마무리" : `${i}장`}
                    </a>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  각 슬라이드를 클릭하면 HTML 파일이 열립니다. 브라우저에서 스크린샷을 찍거나 인쇄(PDF)로 저장하세요.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>닫기</Button>
            <Button onClick={handleGenerate} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Image className="w-4 h-4 mr-1" />}
              {mutation.isPending ? "생성 중..." : "이미지 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── 의료법 검수 단독 실행 ─── */
function StandaloneReview() {
  const [content, setContent] = useState("");
  const mutation = trpc.aiHub.reviewContent.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const handleReview = () => {
    if (!content.trim()) {
      toast.error("검수할 콘텐츠를 입력해주세요.");
      return;
    }
    mutation.mutate({ content, hospitalName: "검수 요청", specialty: "기타" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            의료광고법 검수
          </CardTitle>
          <CardDescription>
            기존에 작성한 마케팅 콘텐츠를 붙여넣으면 의료광고법 기준으로 검수합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="검수할 블로그 글, SNS 문구, 광고 카피 등을 붙여넣으세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            disabled={mutation.isPending}
          />
          <Button onClick={handleReview} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />검수 중...</>
            ) : (
              <><Shield className="w-5 h-5 mr-2" />의료광고법 검수 실행</>
            )}
          </Button>
        </CardContent>
      </Card>

      {mutation.data && <ReviewResult review={mutation.data} />}
    </div>
  );
}

/* ─── 검수 리포트 대시보드 ─── */
function ReviewReport() {
  const reportQuery = trpc.aiHub.myReviewReport.useQuery();

  if (reportQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const r = reportQuery.data;
  if (!r || r.total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">아직 검수 이력이 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-1">콘텐츠 생성 시 의료법 검수를 활성화하면 이력이 쌓입니다.</p>
        </CardContent>
      </Card>
    );
  }

  const passRate = r.total > 0 ? Math.round((r.pass / r.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{r.total}</p>
            <p className="text-xs text-muted-foreground">총 검수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{r.pass}</p>
            <p className="text-xs text-muted-foreground">적합</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{r.warning}</p>
            <p className="text-xs text-muted-foreground">경미한 수정</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-red-600">{r.fail}</p>
            <p className="text-xs text-muted-foreground">수정 필요</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{r.avgScore}점</p>
            <p className="text-xs text-muted-foreground">평균 점수</p>
          </CardContent>
        </Card>
      </div>

      {/* 적합률 바 */}
      <Card>
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              의료광고법 적합률
            </h4>
            <span className="text-lg font-bold text-primary">{passRate}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full transition-all duration-500"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>적합 {r.pass}건</span>
            <span>경미 {r.warning}건</span>
            <span>수정 {r.fail}건</span>
          </div>
        </CardContent>
      </Card>

      {/* 최근 검수 이력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            최근 검수 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {r.recentReviews.map((item: any) => {
              const verdictColors = {
                pass: "bg-green-500/10 text-green-600",
                warning: "bg-yellow-500/10 text-yellow-600",
                fail: "bg-red-500/10 text-red-600",
              };
              const verdictLabels = { pass: "적합", warning: "경미", fail: "수정" };
              const typeLabels: Record<string, string> = {
                blog: "블로그", cardnews: "카드뉴스", video_script: "영상", poster: "포스터",
              };
              return (
                <div key={item.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0">
                  <Badge className={verdictColors[item.verdict as keyof typeof verdictColors] || ""} variant="secondary">
                    {verdictLabels[item.verdict as keyof typeof verdictLabels] || item.verdict}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[item.contentType] || item.contentType}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title || "제목 없음"}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.summary}</p>
                  </div>
                  <div className="text-sm font-semibold text-primary">{item.score}점</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── 최근 생성 내역 ─── */
function RecentContents() {
  const [limit] = useState(20);
  const contentsQuery = trpc.aiHub.myContents.useQuery({ limit });

  const typeLabels: Record<string, { label: string; color: string }> = {
    blog: { label: "블로그", color: "bg-blue-500/10 text-blue-600" },
    cardnews: { label: "카드뉴스", color: "bg-green-500/10 text-green-600" },
    video_script: { label: "영상", color: "bg-purple-500/10 text-purple-600" },
    poster: { label: "포스터", color: "bg-orange-500/10 text-orange-600" },
  };

  if (contentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contentsQuery.data?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">아직 생성한 콘텐츠가 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-1">템플릿 탭에서 첫 콘텐츠를 만들어보세요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">최근 생성 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {contentsQuery.data.map((item: any) => {
            const typeInfo = typeLabels[item.contentType] || { label: item.contentType, color: "bg-muted" };
            return (
              <div key={item.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0">
                <Badge className={typeInfo.color} variant="secondary">{typeInfo.label}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.generatedTitle || item.prompt || "제목 없음"}</p>
                  <p className="text-xs text-muted-foreground">{item.hospitalName} · {item.specialty}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                </div>
                <Badge variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}>
                  {item.status === "completed" ? "완료" : item.status === "failed" ? "실패" : "생성중"}
                </Badge>
                {item.naverPublished === 1 && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    <ExternalLink className="w-3 h-3 mr-1" />발행됨
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

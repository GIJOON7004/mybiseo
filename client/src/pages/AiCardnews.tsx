import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowLeft, Image, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const SPECIALTIES = [
  "성형외과", "피부과", "치과", "안과", "정형외과",
  "한의원", "이비인후과", "산부인과", "비뇨기과", "내과",
];

const TEMPLATES = [
  { id: "seasonal", label: "시즌 이벤트", desc: "계절별 할인·프로모션", example: "여름 맞이 보톡스 20% 할인" },
  { id: "before-after", label: "비포·애프터", desc: "시술 전후 비교 소개", example: "눈매교정 전후 변화" },
  { id: "tips", label: "건강 팁", desc: "환자를 위한 관리 정보", example: "임플란트 후 관리법 5가지" },
  { id: "intro", label: "병원 소개", desc: "장비·의료진·시설 소개", example: "최신 레이저 장비 도입 안내" },
  { id: "review", label: "후기 카드", desc: "환자 후기 기반 카드", example: "환자 만족도 98% 달성" },
  { id: "faq", label: "자주 묻는 질문", desc: "Q&A 형식 카드뉴스", example: "교정 기간은 얼마나 걸리나요?" },
];

const STYLES = [
  { value: "modern", label: "모던 / 깔끔", emoji: "◻️" },
  { value: "warm", label: "따뜻한 / 부드러운", emoji: "🟡" },
  { value: "professional", label: "전문적 / 신뢰감", emoji: "🔵" },
  { value: "cute", label: "귀여운 / 친근한", emoji: "🩷" },
];

export default function AiCardnews() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Image className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">카드뉴스 템플릿</h2>
            <p className="text-muted-foreground">
              진료과별 맞춤 카드뉴스를 AI로 생성합니다. 로그인 후 이용해 주세요.
            </p>
            <Button asChild>
              <a href={getLoginUrl()}>로그인</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CardnewsPage />;
}

function CardnewsPage() {
  const [, navigate] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [style, setStyle] = useState<"modern" | "warm" | "professional" | "cute">("modern");
  const utils = trpc.useUtils();

  const mutation = trpc.aiHub.generateCardnews.useMutation({
    onSuccess: () => {
      utils.aiHub.myStats.invalidate();
      utils.aiHub.myContents.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    if (!hospitalName || !specialty || !eventTitle) {
      toast.error("병원명, 진료과, 이벤트/주제를 입력해주세요.");
      return;
    }
    mutation.mutate({ hospitalName, specialty, eventTitle, eventDetail: eventDetail || undefined, style });
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (tpl && !eventTitle) {
      setEventTitle(tpl.example);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/ai-hub")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">AI 허브</span>
          </button>
          <span className="font-display font-semibold text-lg">카드뉴스 템플릿</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-8">
        {/* 템플릿 선택 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">템플릿 선택</h2>
          <p className="text-sm text-muted-foreground">목적에 맞는 템플릿을 선택하면 AI가 최적화된 카드뉴스를 생성합니다.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATES.map((tpl) => (
              <Card
                key={tpl.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedTemplate === tpl.id ? "border-primary ring-2 ring-primary/20" : "border-border/50"
                }`}
                onClick={() => handleSelectTemplate(tpl.id)}
              >
                <CardContent className="pt-4 pb-4 space-y-1">
                  <p className="font-semibold text-sm">{tpl.label}</p>
                  <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                  <p className="text-xs text-primary/70 italic">예: {tpl.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 입력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="w-5 h-5 text-green-500" />
              카드뉴스 생성
            </CardTitle>
            <CardDescription>
              {selectedTemplate
                ? `"${TEMPLATES.find((t) => t.id === selectedTemplate)?.label}" 템플릿으로 생성합니다.`
                : "위에서 템플릿을 선택하거나, 직접 내용을 입력하세요."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="병원명" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} disabled={mutation.isPending} />
              <Select value={specialty} onValueChange={setSpecialty} disabled={mutation.isPending}>
                <SelectTrigger><SelectValue placeholder="진료과 선택" /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="이벤트/주제"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              disabled={mutation.isPending}
            />
            <Textarea
              placeholder="상세 내용 (선택 — 가격, 기간, 특이사항 등)"
              value={eventDetail}
              onChange={(e) => setEventDetail(e.target.value)}
              disabled={mutation.isPending}
              rows={3}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STYLES.map((s) => (
                <Button
                  key={s.value}
                  variant={style === s.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStyle(s.value as any)}
                  disabled={mutation.isPending}
                  className="text-xs"
                >
                  {s.emoji} {s.label}
                </Button>
              ))}
            </div>
            <Button onClick={handleGenerate} disabled={mutation.isPending} className="w-full" size="lg">
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />생성 중 (이미지 포함 20~30초)...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />카드뉴스 생성하기</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 */}
        {mutation.data && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mutation.data.imageUrl && (
              <Card className="border-green-500/20 overflow-hidden">
                <img src={mutation.data.imageUrl} alt="카드뉴스 표지" className="w-full max-w-md mx-auto" />
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mutation.data.slides?.map((slide: any, i: number) => (
                <Card key={i} className="border-border/50">
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit">{i === 0 ? "표지" : `${i + 1}장`}</Badge>
                    <CardTitle className="text-base">{slide.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80">{slide.body}</p>
                    {slide.note && <p className="text-xs text-muted-foreground mt-2">참고: {slide.note}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
            {mutation.data.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {mutation.data.hashtags.map((h: string, i: number) => (
                  <Badge key={i} variant="secondary">#{h}</Badge>
                ))}
              </div>
            )}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-5 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  생성된 텍스트를 복사하여 카드뉴스 디자인 툴(미리캔버스, 캔바 등)에 붙여넣기 하세요.
                </p>
                <Button variant="outline" size="sm" onClick={() => {
                  const text = mutation.data.slides?.map((s: any, i: number) => `[${i === 0 ? "표지" : `${i+1}장`}]\n${s.title}\n${s.body}`).join("\n\n") || "";
                  navigator.clipboard.writeText(text);
                  toast.success("전체 텍스트가 복사되었습니다");
                }}>
                  전체 텍스트 복사
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

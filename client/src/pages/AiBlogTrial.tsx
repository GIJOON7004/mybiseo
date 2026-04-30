import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Sparkles, Copy, Check, FileText, Tag,
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const SPECIALTIES = [
  "성형외과", "피부과", "치과", "안과", "정형외과",
  "한의원", "이비인후과", "산부인과", "비뇨기과", "내과",
  "소아과", "정신건강의학과", "재활의학과", "가정의학과",
];

export default function AiBlogTrial() {
  const [, navigate] = useLocation();

  const [hospitalName, setHospitalName] = useState("");
  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const trialMutation = trpc.aiHub.trialBlog.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    },
    onError: (err) => {
      toast.error(err.message || "생성에 실패했습니다");
    },
  });

  const handleGenerate = () => {
    if (!hospitalName.trim()) {
      toast.error("병원명을 입력해주세요.");
      return;
    }
    trialMutation.mutate({ hospitalName: hospitalName.trim(), specialty: "", topic: topic.trim() || undefined });
  };

  const handleCopy = async () => {
    if (!trialMutation.data) return;
    const d = trialMutation.data;
    // 검수 수정본이 있으면 수정본을, 없으면 원본을 복사
    const contentToCopy = d.review?.revisedContent && d.review.verdict !== "pass"
      ? d.review.revisedContent
      : d.content;
    const text = `${d.title}\n\n${contentToCopy}\n\n${d.tags.map((t: string) => `#${t}`).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("블로그 글이 클립보드에 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container max-w-3xl pt-28 pb-12 space-y-8">
        {/* 타이틀 */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            무료 체험
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight leading-snug">
            병원 이름만 넣으면
            <br />
            <span className="text-primary">AI 최적화 블로그 + 의료법 검수</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            ChatGPT · Gemini · Claude · Perplexity가
            <br />
            인용하는 구조로 블로그를 작성합니다.
          </p>

          <p className="text-muted-foreground/70 text-xs sm:text-sm">
            의료광고법 검수까지 자동 · 로그인 없이 바로 체험
          </p>
        </div>

        {/* 파이프라인 안내 */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { label: "병원 정보 입력", icon: FileText },
            { label: "AEO/GEO 최적화 작성", icon: Sparkles },
            { label: "의료광고법 검수", icon: Shield },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground">
                <step.icon className="w-3.5 h-3.5" />
                {step.label}
              </div>
              {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground/50" />}
            </div>
          ))}
        </div>

        {/* 입력 폼 */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">병원명 <span className="text-destructive">*</span></label>
              <Input
                placeholder="예: OO성형외과"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                disabled={trialMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">진료과 선택 <span className="text-muted-foreground">(선택)</span></label>
              <Input
                placeholder="예: 성형외과, 피부과, 치과 등"
                disabled={trialMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">주제 <span className="text-muted-foreground">(선택)</span></label>
              <Input
                placeholder="예: 여름 자외선 차단 관리법, 임플란트 수명 관리 등"
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
                  AI가 글을 쓰고 의료법을 검수하고 있습니다...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  블로그 글 생성 + 의료법 검수
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 진행 중 파이프라인 */}
        {trialMutation.isPending && (
          <Card className="border-primary/20 animate-in fade-in duration-300">
            <CardContent className="py-5">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { label: "프롬프트 최적화", status: "done" },
                  { label: "초안 작성 중", status: "active" },
                  { label: "의료광고법 검수", status: "pending" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${
                      step.status === "done" ? "bg-green-500/10 text-green-600" :
                      step.status === "active" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {step.status === "active" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : step.status === "done" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      <span className="font-medium">{step.label}</span>
                    </div>
                    {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 결과 */}
        {trialMutation.data && (
          <div ref={resultRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 의료법 검수 결과 배지 */}
            {trialMutation.data.review && (
              <ReviewBanner review={trialMutation.data.review} />
            )}

            {/* 생성된 블로그 글 */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    생성된 블로그 글
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? "복사됨" : "전체 복사"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-4">{trialMutation.data.title}</h3>
                  <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {trialMutation.data.content}
                  </div>
                </div>
                {trialMutation.data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
                    <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                    {trialMutation.data.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-sm text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 의료법 검수 상세 결과 */}
            {trialMutation.data.review && (
              <ReviewDetail review={trialMutation.data.review} />
            )}

            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-6 text-center space-y-3">
                <p className="text-foreground font-medium">
                  10종 마케팅 템플릿 + 의료법 자동 검수를 사용해 보세요
                </p>
                <p className="text-sm text-muted-foreground">
                  MY비서 AI 콘텐츠 허브에서 블로그, 카드뉴스, 영상 스크립트까지 한 곳에서 관리하세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button onClick={() => navigate("/")} variant="outline">
                    서비스 더 알아보기
                  </Button>
                  <Button onClick={() => {
                    const el = document.getElementById("contact");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    else navigate("/#contact");
                  }}>
                    무료 상담 신청
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* 결과가 없을 때 하단 안내 */}
        {!trialMutation.data && !trialMutation.isPending && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl border border-border/50 p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">SEO 최적화 구조 (AEO/GEO)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ChatGPT · Gemini 등<br />
                AI가 인용하는 구조로 작성
              </p>
            </div>
            <div className="rounded-xl border border-border/50 p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">의료광고법 자동 검수</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                의료법 제56조 기준<br />
                위반 여부를 자동 확인
              </p>
            </div>
            <div className="rounded-xl border border-border/50 p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">진료과별 맞춤 콘텐츠</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                FAQ · E-E-A-T 구조로<br />
                AI 답변에 인용되는 콘텐츠
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── 검수 결과 배너 ─── */
function ReviewBanner({ review }: { review: any }) {
  const config: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    pass: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10 border-green-500/20", label: "의료광고법 적합" },
    warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20", label: "경미한 수정 권장" },
    fail: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-500/10 border-red-500/20", label: "수정 필요" },
  };
  const v = config[review.verdict] || config.warning;
  const VIcon = v.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${v.bg}`}>
      <VIcon className={`w-6 h-6 ${v.color} flex-shrink-0`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${v.color}`}>{v.label}</span>
          <Badge variant="outline" className={v.color}>{review.score}점</Badge>
        </div>
        <p className="text-sm text-foreground/70 mt-0.5">{review.summary}</p>
      </div>
    </div>
  );
}

/* ─── 검수 상세 결과 ─── */
function ReviewDetail({ review }: { review: any }) {
  if (!review.issues?.length && review.verdict === "pass") return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          의료광고법 검수 상세
        </CardTitle>
        <CardDescription>
          의료법 제56조, 의료법 시행령 제23조, 보건복지부 의료광고 심의 기준을 바탕으로 검수했습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 지적 사항 */}
        {review.issues?.length > 0 && (
          <div className="space-y-3">
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

        {/* 수정본 */}
        {review.revisedContent && review.verdict !== "pass" && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              검수 완료 수정본
            </h4>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{review.revisedContent}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              위 수정본은 지적 사항을 반영한 버전입니다. "전체 복사" 버튼을 누르면 수정본이 복사됩니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

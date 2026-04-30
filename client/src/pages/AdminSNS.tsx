/**
 * 관리자 — 기능 2: SNS 콘텐츠 자동 생성
 * 캡션+해시태그 생성, 프로모션 문구 생성, 업종별 종합 가이드 생성
 *
 * UX/UI 개선:
 * - 탭 아이콘 + 라벨 스타일 통일
 * - 결과 카드 디자인 개선 (플랫폼별 색상 코드)
 * - 복사 버튼 위치 및 피드백 개선
 * - 이력 탭 카드형 레이아웃 + 접기/펼치기
 * - 빈 상태 일러스트 개선
 * - 모바일 반응형 최적화
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Copy, Hash, Loader2, Megaphone, BookOpen, Trash2, Clock,
  Check, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSNS() {
  return (
    <DashboardLayout>
      <SNSContent />
    </DashboardLayout>
  );
}

/* ─── 복사 버튼 (복사 완료 피드백 포함) ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("클립보드에 복사됨!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 px-2 text-xs gap-1">
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">복사됨</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          복사
        </>
      )}
    </Button>
  );
}

function SNSContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">SNS 콘텐츠 생성</h1>
        <p className="text-sm text-muted-foreground mt-1">AI가 인스타그램 캡션, 해시태그, 프로모션 문구를 자동으로 만들어줍니다</p>
      </div>

      <Tabs defaultValue="caption" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="caption" className="gap-1.5 text-xs sm:text-sm">
            <Hash className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">캡션+해시태그</span>
            <span className="sm:hidden">캡션</span>
          </TabsTrigger>
          <TabsTrigger value="promotion" className="gap-1.5 text-xs sm:text-sm">
            <Megaphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">프로모션 문구</span>
            <span className="sm:hidden">프로모션</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">종합 가이드</span>
            <span className="sm:hidden">가이드</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">생성 이력</span>
            <span className="sm:hidden">이력</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caption"><CaptionTab /></TabsContent>
        <TabsContent value="promotion"><PromotionTab /></TabsContent>
        <TabsContent value="guide"><GuideTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── 캡션+해시태그 탭 ─── */
function CaptionTab() {
  const [industry, setIndustry] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");

  const mutation = trpc.sns.generateCaption.useMutation({
    onSuccess: () => toast.success("캡션 생성 완료!"),
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-pink-500/10">
              <Hash className="h-4 w-4 text-pink-400" />
            </div>
            인스타그램 캡션 + 해시태그 생성
          </CardTitle>
          <CardDescription className="text-xs">업종과 주제를 입력하면 인스타그램 캡션, 해시태그, 카카오톡 문구를 한 번에 생성합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">업종</Label>
              <Input placeholder="예: 성형외과" value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">주제/내용</Label>
              <Input placeholder="예: 봄맞이 쌍꺼풀 수술 트렌드" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">톤 (선택)</Label>
              <Input placeholder="예: 전문적이고 신뢰감 있는" value={tone} onChange={(e) => setTone(e.target.value)} className="h-10" />
            </div>
          </div>
          <Button onClick={() => mutation.mutate({ industry, topic, tone: tone || undefined })} disabled={mutation.isPending || !industry || !topic} className="h-10">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            생성하기
          </Button>
        </CardContent>
      </Card>

      {mutation.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ResultCard
            label="인스타그램 캡션"
            content={mutation.data.instagramCaption}
            accentColor="pink"
          />
          <ResultCard
            label="해시태그"
            content={mutation.data.hashtags}
            accentColor="blue"
          />
          <ResultCard
            label="카카오톡 문구"
            content={mutation.data.kakaoMessage}
            accentColor="amber"
          />
        </div>
      )}
    </div>
  );
}

/* ─── 프로모션 문구 탭 ─── */
function PromotionTab() {
  const [industry, setIndustry] = useState("");
  const [promotionDetail, setPromotionDetail] = useState("");

  const mutation = trpc.sns.generatePromotion.useMutation({
    onSuccess: () => toast.success("프로모션 문구 생성 완료!"),
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Megaphone className="h-4 w-4 text-orange-400" />
            </div>
            프로모션/이벤트 문구 생성
          </CardTitle>
          <CardDescription className="text-xs">이벤트 내용을 입력하면 인스타그램/카카오톡/블로그/배너용 문구를 한 번에 생성합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">업종</Label>
              <Input placeholder="예: 피부과" value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">프로모션/이벤트 내용</Label>
              <Input placeholder="예: 봄맞이 리프팅 30% 할인" value={promotionDetail} onChange={(e) => setPromotionDetail(e.target.value)} className="h-10" />
            </div>
          </div>
          <Button onClick={() => mutation.mutate({ industry, promotionDetail })} disabled={mutation.isPending || !industry || !promotionDetail} className="h-10">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            생성하기
          </Button>
        </CardContent>
      </Card>

      {mutation.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ResultCard label="인스타그램" content={mutation.data.instagram} accentColor="pink" />
          <ResultCard label="카카오톡" content={mutation.data.kakao} accentColor="amber" />
          <ResultCard label="블로그 소개글" content={mutation.data.blog} accentColor="emerald" />
          <ResultCard label="배너/팝업 카피" content={mutation.data.banner} accentColor="purple" />
        </div>
      )}
    </div>
  );
}

/* ─── 종합 가이드 탭 ─── */
function GuideTab() {
  const [industry, setIndustry] = useState("");
  const [focus, setFocus] = useState("");

  const mutation = trpc.sns.generateGuide.useMutation({
    onSuccess: () => toast.success("종합 가이드 생성 완료!"),
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <BookOpen className="h-4 w-4 text-violet-400" />
            </div>
            업종별 SNS 종합 가이드
          </CardTitle>
          <CardDescription className="text-xs">업종을 입력하면 이번 주 인스타 캡션, 해시태그, 요일별 주제, 블로그 초안까지 한 번에 생성합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">업종</Label>
              <Input placeholder="예: 치과" value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">특별 포커스 (선택)</Label>
              <Input placeholder="예: 봄맞이 치아미백 시즌" value={focus} onChange={(e) => setFocus(e.target.value)} className="h-10" />
            </div>
          </div>
          <Button onClick={() => mutation.mutate({ industry, focus: focus || undefined })} disabled={mutation.isPending || !industry} className="h-10">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            가이드 생성
          </Button>
        </CardContent>
      </Card>

      {mutation.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ResultCard label="인스타그램 캡션" content={mutation.data.instagramCaption} accentColor="pink" />
          <ResultCard label="해시태그" content={mutation.data.hashtags} accentColor="blue" />
          <ResultCard label="요일별 콘텐츠 주제" content={mutation.data.weeklyThemes} accentColor="emerald" />
          <ResultCard label="블로그 글 초안 개요" content={mutation.data.blogOutline} accentColor="violet" />
        </div>
      )}
    </div>
  );
}

/* ─── 생성 이력 탭 ─── */
function HistoryTab() {
  const historyQuery = trpc.sns.history.useQuery();
  const deleteMutation = trpc.sns.delete.useMutation({
    onSuccess: () => {
      toast.success("삭제 완료!");
      historyQuery.refetch();
    },
  });

  const items = historyQuery.data ?? [];
  const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
    caption: { label: "캡션+해시태그", color: "bg-pink-500/10 text-pink-400 border-pink-500/20", icon: Hash },
    promotion: { label: "프로모션 문구", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Megaphone },
    guide: { label: "종합 가이드", color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: BookOpen },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-slate-500/10">
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          생성 이력
          {items.length > 0 && (
            <Badge variant="secondary" className="text-xs">{items.length}개</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">이전에 생성한 SNS 콘텐츠를 확인하고 재사용할 수 있습니다</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">아직 생성 이력이 없습니다</p>
            <p className="text-xs text-muted-foreground/60 mt-1">위 탭에서 콘텐츠를 생성해보세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <HistoryItem key={item.id} item={item} typeConfig={typeConfig} onDelete={() => deleteMutation.mutate({ id: item.id })} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({ item, typeConfig, onDelete }: { item: any; typeConfig: any; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  let inputData: any = {};
  let outputData: any = {};
  try { inputData = JSON.parse(item.input); } catch {}
  try { outputData = JSON.parse(item.output); } catch {}

  const config = typeConfig[item.type] ?? typeConfig.caption;
  const TypeIcon = config.icon;

  return (
    <div className="border rounded-xl overflow-hidden hover:border-border/80 transition-colors">
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-accent/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-1.5 rounded-lg shrink-0 ${config.color.split(" ").slice(0, 1).join(" ")}`}>
          <TypeIcon className={`h-3.5 w-3.5 ${config.color.split(" ").slice(1, 2).join(" ")}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] h-5 border ${config.color}`}>{config.label}</Badge>
            <span className="text-sm text-muted-foreground truncate">
              {inputData.industry && `${inputData.industry}`}
              {inputData.topic && ` · ${inputData.topic}`}
              {inputData.promotionDetail && ` · ${inputData.promotionDetail}`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {new Date(item.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-2 border-t border-border/30 pt-3">
          {Object.entries(outputData).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground capitalize">{key}</span>
                <CopyButton text={String(val)} />
              </div>
              <div className="p-2.5 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                {String(val)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 결과 카드 컴포넌트 ─── */
const accentMap: Record<string, { bg: string; border: string; text: string }> = {
  pink: { bg: "bg-pink-500/5", border: "border-pink-500/10", text: "text-pink-400" },
  blue: { bg: "bg-blue-500/5", border: "border-blue-500/10", text: "text-blue-400" },
  amber: { bg: "bg-amber-500/5", border: "border-amber-500/10", text: "text-amber-400" },
  emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/10", text: "text-emerald-400" },
  purple: { bg: "bg-purple-500/5", border: "border-purple-500/10", text: "text-purple-400" },
  violet: { bg: "bg-violet-500/5", border: "border-violet-500/10", text: "text-violet-400" },
  orange: { bg: "bg-orange-500/5", border: "border-orange-500/10", text: "text-orange-400" },
};

function ResultCard({ label, content, accentColor }: { label: string; content: string; accentColor: string }) {
  const accent = accentMap[accentColor] ?? accentMap.blue;
  return (
    <Card className={`${accent.bg} ${accent.border}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${accent.text}`}>{label}</span>
          <CopyButton text={content} />
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}

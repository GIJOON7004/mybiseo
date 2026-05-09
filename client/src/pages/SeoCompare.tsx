import { toast } from "sonner";
/**
 * 경쟁사 AI 인용 비교 분석 페이지
 * 내 사이트 vs 경쟁사 최대 3개 동시 비교
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Search, ArrowRight, Globe, Loader2, Bot, Plus, X,
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus,
  FileText, Code2, Shield, Share2, Sparkles, Download,
  AlertTriangle, Mail, Send, CheckCircle2, XCircle,
} from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CategoryResult {
  name: string;
  score: number;
  maxScore: number;
  items: { id: string; name: string; status: string; score: number; maxScore: number; detail: string; recommendation: string; impact: string; category: string }[];
}

interface SeoResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  categories: CategoryResult[];
  summary: { passed: number; warnings: number; failed: number };
}

interface CompareResult {
  url: string;
  isMysite: boolean;
  result: SeoResult | null;
  error: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "메타 태그": <FileText className="w-4 h-4" />,
  "콘텐츠 구조": <Code2 className="w-4 h-4" />,
  "홈페이지 기본 설정": <Shield className="w-4 h-4" />,
  "소셜 미디어": <Share2 className="w-4 h-4" />,
  "검색 고급 설정": <Sparkles className="w-4 h-4" />,
  "AI 인용": <Bot className="w-4 h-4" />,
};

function getGradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-emerald-400";
  if (grade === "B") return "text-amber-400";
  if (grade === "C") return "text-orange-400";
  return "text-red-400";
}

function getGradeBg(grade: string) {
  if (grade === "A+" || grade === "A") return "bg-emerald-400/10 border-emerald-400/30";
  if (grade === "B") return "bg-amber-400/10 border-amber-400/30";
  if (grade === "C") return "bg-orange-400/10 border-orange-400/30";
  return "bg-red-400/10 border-red-400/30";
}

function DiffBadge({ myScore, theirScore }: { myScore: number; theirScore: number }) {
  const diff = myScore - theirScore;
  if (diff > 0) return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400"><TrendingUp className="w-3 h-3" />+{diff}</span>;
  if (diff < 0) return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-400"><TrendingDown className="w-3 h-3" />{diff}</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground"><Minus className="w-3 h-3" />동일</span>;
}

const SPECIALTIES_COMPARE = [
  { value: "", label: "진료과 선택 (선택시 맞춤 진단)" },
  { value: "치과", label: "치과" },
  { value: "피부과", label: "피부과" },
  { value: "성형외과", label: "성형외과" },
  { value: "한의원", label: "한의원" },
  { value: "정형외과", label: "정형외과" },
  { value: "안과", label: "안과" },
  { value: "산부인과", label: "산부인과" },
  { value: "종합병원", label: "종합병원" },
  { value: "내과", label: "내과" },
  { value: "이비인후과", label: "이비인후과" },
  { value: "동물병원", label: "동물병원" },
];

export default function SeoCompare() {
  const [myUrl, setMyUrl] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [country, setCountry] = useState<"kr" | "th">("kr");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
  const [results, setResults] = useState<CompareResult[] | null>(null);

  const compareMutation = trpc.seoAnalyzer.compareAnalyze.useMutation({
    onSuccess: (data) => setResults(data as CompareResult[]),
    onError: (err) => toast.error(err.message),
  });

  const addCompetitor = () => {
    if (competitorUrls.length < 3) setCompetitorUrls([...competitorUrls, ""]);
  };

  const removeCompetitor = (idx: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== idx));
  };

  const updateCompetitor = (idx: number, val: string) => {
    const updated = [...competitorUrls];
    updated[idx] = val;
    setCompetitorUrls(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUrl.trim()) return;
    const validCompetitors = competitorUrls.filter(u => u.trim());
    if (validCompetitors.length === 0) return;
    setResults(null);
    compareMutation.mutate({ myUrl: myUrl.trim(), competitorUrls: validCompetitors, specialty: specialty || undefined, country });
  };

  const myResult = results?.find(r => r.isMysite)?.result;
  const competitorResults = results?.filter(r => !r.isMysite) || [];

  // 카테고리별 비교 데이터 생성
  const categoryNames = myResult?.categories.map(c => c.name) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* 히어로 — URL 입력 */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, oklch(0.72 0.14 200) 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.14 200 / 0.08) 0%, transparent 60%)" }} />

        <div className="relative container max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-6">
            <BarChart3 className="w-4 h-4" />
            경쟁사 AI 인용 비교 분석
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-4">
            우리 병원 vs 경쟁 병원<br />
            <span className="text-brand">AI 인용 비교</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            같은 진료과 경쟁 병원과 AI+포털 노출 점수를 나란히 비교해 보세요.
          </p>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-3">
            {/* 진료과 선택 */}
            <div className="flex justify-center mb-1">
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="px-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground appearance-none cursor-pointer hover:border-brand/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
              >
                {SPECIALTIES_COMPARE.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCountry(country === "kr" ? "th" : "kr")}
                className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border hover:border-brand/40 transition-colors text-sm"
                title={country === "kr" ? "한국 기준 진단" : "태국 기준 진단"}
              >
                <span className="leading-none">{country === "kr" ? (
                  <svg width="22" height="22" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" className="inline-block rounded-sm"><rect fill="#FFF" width="36" height="36"/><circle fill="#C60C30" cx="18" cy="18" r="8"/><path fill="#003478" d="M18 10c-4.42 0-8 3.58-8 8 0 1.1.22 2.15.62 3.1C12.06 17.56 14.8 15 18 15s5.94 2.56 7.38 6.1c.4-.95.62-2 .62-3.1 0-4.42-3.58-8-8-8z"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" className="inline-block rounded-sm"><rect fill="#A51931" width="36" height="6"/><rect fill="#F4F5F8" y="6" width="36" height="6"/><rect fill="#2D2A4A" y="12" width="36" height="12"/><rect fill="#F4F5F8" y="24" width="36" height="6"/><rect fill="#A51931" y="30" width="36" height="6"/></svg>
                )}</span>
                <span className="text-xs text-muted-foreground">{country === "kr" ? "한국" : "태국"}</span>
              </button>
            </div>
            {/* 내 사이트 */}
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-card border-2 border-brand/30 shadow-lg shadow-brand/5">
              <div className="flex items-center gap-2 flex-1 px-3">
                <div className="shrink-0 px-2 py-0.5 rounded bg-brand/20 text-brand text-xs font-bold">MY</div>
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={myUrl}
                  onChange={(e) => setMyUrl(e.target.value)}
                  placeholder={country === "kr" ? "https://우리병원.com" : "https://your-clinic.com"}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* 경쟁사 */}
            {competitorUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <div className="shrink-0 px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-bold">VS{idx + 1}</div>
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateCompetitor(idx, e.target.value)}
                    placeholder={`https://경쟁병원${idx + 1}.com`}
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 py-2.5 text-sm"
                  />
                </div>
                {competitorUrls.length > 1 && (
                  <button type="button" onClick={() => removeCompetitor(idx)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3">
              {competitorUrls.length < 3 && (
                <button type="button" onClick={addCompetitor} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-brand border border-dashed border-border rounded-xl hover:border-brand/30 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  경쟁사 추가
                </button>
              )}
              <button
                type="submit"
                disabled={compareMutation.isPending || !myUrl.trim() || competitorUrls.every(u => !u.trim())}
                className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compareMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />비교 분석 중...</>
                ) : (
                  <>비교 분석 시작<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          {compareMutation.isPending && (
            <div className="mt-12 animate-fade-in">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                <span className="text-sm text-muted-foreground">모든 사이트를 분석하고 있습니다... 잠시만 기다려주세요</span>
              </div>
            </div>
          )}

          {compareMutation.isError && (
            <div className="mt-8 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm max-w-lg mx-auto">
              <p className="font-medium mb-1">비교 분석에 실패했습니다</p>
              <p className="text-red-400/80">URL을 확인하시고 다시 시도해 주세요.</p>
            </div>
          )}
        </div>
      </section>

      {/* 비교 결과 */}
      {results && myResult && (
        <section className="py-12 pb-32">
          <div className="container max-w-5xl mx-auto">

            {/* 총점 비교 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {results.filter(r => r.result).map((r, i) => (
                <div key={i} className={`rounded-2xl border-2 p-5 text-center ${r.isMysite ? "border-brand/40 bg-brand/5" : "border-border bg-card"}`}>
                  {r.isMysite && <div className="text-xs font-bold text-brand mb-2">우리 병원</div>}
                  {!r.isMysite && <div className="text-xs font-medium text-muted-foreground mb-2">경쟁사 {i}</div>}
                  <div className="text-xs text-muted-foreground truncate mb-3">{r.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</div>
                  <div className={`text-4xl font-bold ${getGradeColor(r.result!.grade)}`}>{r.result!.totalScore}</div>
                  <div className="text-sm text-muted-foreground mt-1">/ 100점</div>
                  <div className={`inline-block mt-2 px-3 py-0.5 rounded-full text-sm font-bold border ${getGradeBg(r.result!.grade)} ${getGradeColor(r.result!.grade)}`}>
                    {r.result!.grade}
                  </div>
                  {!r.isMysite && (
                    <div className="mt-2">
                      <DiffBadge myScore={myResult.totalScore} theirScore={r.result!.totalScore} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI 인용 점수 비교 */}
            <div className="mb-10 p-6 rounded-2xl border-2 border-brand/20 bg-brand/5">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-6 h-6 text-brand" />
                <h3 className="text-lg font-bold">AI 인용 점수 비교</h3>
              </div>
              <div className="space-y-3">
                {results.filter(r => r.result).map((r, i) => {
                  const aiCat = r.result!.categories.find(c => c.name === "AI 인용");
                  const aiPct = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
                  const barColor = r.isMysite ? "bg-brand" : "bg-muted-foreground/40";
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${r.isMysite ? "font-bold text-brand" : "text-muted-foreground"}`}>
                          {r.isMysite ? "우리 병원" : `경쟁사 ${i}`}
                          <span className="text-xs ml-2 text-muted-foreground">{r.url.replace(/^https?:\/\//, "").slice(0, 30)}</span>
                        </span>
                        <span className={`text-sm font-bold ${aiPct >= 70 ? "text-emerald-400" : aiPct >= 40 ? "text-amber-400" : "text-red-400"}`}>{aiPct}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${aiPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 카테고리별 상세 비교 테이블 */}
            <h3 className="text-lg font-bold mb-4">카테고리별 상세 비교</h3>
            <div className="overflow-x-auto mb-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">카테고리</th>
                    {results.filter(r => r.result).map((r, i) => (
                      <th key={i} className={`text-center py-3 px-4 ${r.isMysite ? "text-brand font-bold" : "text-muted-foreground font-medium"}`}>
                        {r.isMysite ? "우리 병원" : `경쟁사 ${i}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryNames.map((catName) => (
                    <tr key={catName} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-brand">{categoryIcons[catName]}</span>
                          {catName}
                        </div>
                      </td>
                      {results.filter(r => r.result).map((r, i) => {
                        const cat = r.result!.categories.find(c => c.name === catName);
                        const pct = cat && cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
                        const color = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400";
                        return (
                          <td key={i} className="text-center py-3 px-4">
                            <span className={`font-bold ${color}`}>{pct}%</span>
                            <span className="text-xs text-muted-foreground ml-1">({cat?.score}/{cat?.maxScore})</span>
                            {!r.isMysite && myResult && (
                              <div className="mt-0.5">
                                <DiffBadge
                                  myScore={Math.round(((myResult.categories.find(c => c.name === catName)?.score || 0) / (myResult.categories.find(c => c.name === catName)?.maxScore || 1)) * 100)}
                                  theirScore={pct}
                                />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* 총점 행 */}
                  <tr className="bg-accent/30 font-bold">
                    <td className="py-3 px-4">총점</td>
                    {results.filter(r => r.result).map((r, i) => (
                      <td key={i} className={`text-center py-3 px-4 ${getGradeColor(r.result!.grade)}`}>
                        {r.result!.totalScore}점 ({r.result!.grade})
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 우리 병원이 뒤처지는 항목 */}
            {competitorResults.length > 0 && (() => {
              const weakPoints: { catName: string; itemName: string; myStatus: string; competitorBetter: string[] }[] = [];
              myResult.categories.forEach(myCat => {
                myCat.items.forEach(myItem => {
                  if (myItem.status === "fail" || myItem.status === "warning") {
                    const betterCompetitors: string[] = [];
                    competitorResults.forEach((cr, ci) => {
                      if (!cr.result) return;
                      const theirCat = cr.result.categories.find(c => c.name === myCat.name);
                      const theirItem = theirCat?.items.find(i => i.id === myItem.id);
                      if (theirItem && theirItem.score > myItem.score) {
                        betterCompetitors.push(`경쟁사 ${ci + 1}`);
                      }
                    });
                    if (betterCompetitors.length > 0) {
                      weakPoints.push({ catName: myCat.name, itemName: myItem.name, myStatus: myItem.status, competitorBetter: betterCompetitors });
                    }
                  }
                });
              });

              if (weakPoints.length === 0) return null;
              return (
                <div className="mb-10">
                  <h3 className="text-lg font-bold mb-4 text-red-400">경쟁사보다 뒤처지는 항목 ({weakPoints.length}개)</h3>
                  <div className="space-y-2">
                    {weakPoints.slice(0, 10).map((wp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-400/5 border border-red-400/10">
                        <span className="text-red-400">{wp.myStatus === "fail" ? "❌" : "⚠️"}</span>
                        <div className="flex-1">
                          <span className="font-medium text-sm">{wp.itemName}</span>
                          <span className="text-xs text-muted-foreground ml-2">[{wp.catName}]</span>
                        </div>
                        <span className="text-xs text-red-400/80">{wp.competitorBetter.join(", ")}이 더 높음</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 경쟁사 비교 긴급성 CTA */}
            {(() => {
              const myAiCat = myResult.categories.find(c => c.name === "AI 인용");
              const myAiPct = myAiCat && myAiCat.maxScore > 0 ? Math.round((myAiCat.score / myAiCat.maxScore) * 100) : 0;
              const competitorAiScores = competitorResults.filter(r => r.result).map(r => {
                const aiCat = r.result!.categories.find(c => c.name === "AI 인용");
                return aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
              });
              const maxCompetitorAi = Math.max(...competitorAiScores, 0);
              const isLosing = myAiPct < maxCompetitorAi;
              const gap = maxCompetitorAi - myAiPct;

              return (
                <div className={`mb-10 p-6 rounded-2xl border-2 ${
                  isLosing ? "border-red-500/30 bg-red-500/5" : myAiPct < 70 ? "border-amber-400/30 bg-amber-400/5" : "border-emerald-400/30 bg-emerald-400/5"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 p-3 rounded-xl ${
                      isLosing ? "bg-red-500/10" : myAiPct < 70 ? "bg-amber-400/10" : "bg-emerald-400/10"
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        isLosing ? "text-red-400" : myAiPct < 70 ? "text-amber-400" : "text-emerald-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-2 ${
                        isLosing ? "text-red-400" : myAiPct < 70 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {isLosing
                          ? `⚠️ 경쟁 병원보다 AI 인용이 ${gap}% 뒤처져 있습니다`
                          : myAiPct < 70
                            ? "⚠️ AI 인용이 불안정합니다"
                            : "✅ AI 인용이 양호합니다"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isLosing
                          ? `환자가 ChatGPT나 Gemini에서 "근처 ${myResult.categories[0]?.items[0]?.detail?.includes("치과") ? "치과" : "병원"} 추천"을 물으면, 경쟁 병원이 먼저 노출될 확률이 높습니다. 지금 대응하지 않으면 환자 유입이 점점 줄어들 수 있습니다.`
                          : myAiPct < 70
                            ? "AI 검색엔진이 사이트를 충분히 참조하지 못하고 있습니다. 개선하면 경쟁사를 앞서나갈 수 있습니다."
                            : "현재 AI 인용 상태가 양호합니다. 지속적인 관리로 우위를 유지하세요."}
                      </p>
                      {(isLosing || myAiPct < 70) && (
                        <Link
                          href="/#contact"
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all"
                        >
                          AI 인용 개선 무료 상담
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CTA */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">경쟁사보다 앞서고 싶으신가요? MY비서가 도와드리겠습니다.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/#contact" className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all">
                  무료 상담 신청<ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/seo-check" className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-full border border-border text-foreground hover:bg-accent transition-all">
                  <Search className="w-4 h-4" />단일 사이트 상세 진단
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 결과 없을 때 설명 */}
      {!results && !compareMutation.isPending && (
        <section className="py-16">
          <div className="container max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <Bot className="w-6 h-6" />, title: "AI 인용 점수 비교", desc: "ChatGPT, Gemini 등 AI 검색에서 경쟁사 대비 노출 수준을 한눈에 비교합니다." },
                { icon: <BarChart3 className="w-6 h-6" />, title: "카테고리별 상세 비교", desc: "메타 태그, 콘텐츠 구조, AI 크롤러 등 6개 카테고리를 항목별로 비교합니다." },
                { icon: <TrendingUp className="w-6 h-6" />, title: "약점 분석 리포트", desc: "경쟁사보다 뒤처지는 항목을 분석하여 우선 개선 포인트를 알려드립니다." },
              ].map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-brand/10 text-brand mb-4">{item.icon}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

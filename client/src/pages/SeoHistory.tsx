/**
 * AI 검색 진단 히스토리 대시보드 — /seo-history?url=xxx
 * 같은 병원의 시간별 AI 검색 점수 변화 추이를 시각적으로 보여줌
 * 영업용: 원장님에게 "지난달 대비 변화 없음/하락" 데이터를 보여주는 용도
 */
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Calendar, ArrowRight,
  Loader2, AlertTriangle, CheckCircle2, Search, Bot, Shield,
  Clock, Target, ArrowUpRight, ArrowDownRight, Activity,
  Share2, Copy, Check,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

/* ── 공유 링크 유틸 ── */
function encodeShareUrl(url: string): string {
  return btoa(unescape(encodeURIComponent(url)));
}
function decodeShareUrl(encoded: string): string {
  try { return decodeURIComponent(escape(atob(encoded))); } catch { return ""; }
}

/* ── 공유 버튼 컴포넌트 ── */
function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const encoded = encodeShareUrl(url);
    const shareUrl = `${window.location.origin}/seo-history?share=${encoded}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("공유 링크가 복사되었습니다", { description: "원장님에게 전달하시면 로그인 없이 추이를 확인할 수 있습니다." });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("공유 링크가 복사되었습니다");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand/30 bg-brand/5 text-brand text-sm font-medium hover:bg-brand/10 transition-all"
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "복사 완료" : "공유 링크 복사"}
    </button>
  );
}

// ── 유틸 ──
function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGradeColor(grade: string) {
  if (grade.startsWith("A")) return { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" };
  if (grade === "B") return { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" };
  if (grade === "C") return { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" };
  if (grade === "D") return { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" };
  return { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" };
}

function formatDate(d: Date | string): string {
  const date = new Date(d);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  return `${y}년 ${parseInt(mo)}월`;
}

// ── 종합 점수 추이 차트 (SVG) ──
function ScoreTrendChart({ data }: { data: { month: string; avgScore: number; avgAiScore: number; latestGrade: string }[] }) {
  if (data.length < 1) return <p className="text-sm text-muted-foreground text-center py-8">추이 데이터가 없습니다.</p>;

  const W = Math.max(data.length * 80, 400);
  const H = 200;
  const PAD = { top: 30, right: 20, bottom: 40, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxScore = 100;
  const minScore = 0;
  const range = maxScore - minScore;

  const toX = (i: number) => PAD.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const toY = (v: number) => PAD.top + chartH - ((v - minScore) / range) * chartH;

  const totalLine = data.map((d, i) => `${toX(i)},${toY(d.avgScore)}`).join(" ");
  const aiLine = data.map((d, i) => `${toX(i)},${toY(d.avgAiScore)}`).join(" ");

  // 면적 채우기
  const totalArea = `${PAD.left},${toY(0)} ${totalLine} ${toX(data.length - 1)},${toY(0)}`;
  const aiArea = `${PAD.left},${toY(0)} ${aiLine} ${toX(data.length - 1)},${toY(0)}`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300, maxHeight: 240 }}>
        {/* 그리드 */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="currentColor" strokeOpacity={0.08} />
            <text x={PAD.left - 6} y={toY(v) + 3} fontSize={9} fill="currentColor" opacity={0.4} textAnchor="end">{v}</text>
          </g>
        ))}

        {/* 면적 */}
        <polygon points={totalArea} fill="oklch(0.72 0.19 195.56)" opacity={0.06} />
        <polygon points={aiArea} fill="oklch(0.65 0.15 280)" opacity={0.06} />

        {/* 라인 */}
        <polyline fill="none" stroke="oklch(0.72 0.19 195.56)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" points={totalLine} />
        <polyline fill="none" stroke="oklch(0.65 0.15 280)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" points={aiLine} />

        {/* 점 + 라벨 */}
        {data.map((d, i) => (
          <g key={i}>
            {/* 종합 점수 */}
            <circle cx={toX(i)} cy={toY(d.avgScore)} r={5} fill="oklch(0.72 0.19 195.56)" stroke="oklch(0.15 0 0)" strokeWidth={2} />
            <text x={toX(i)} y={toY(d.avgScore) - 10} fontSize={11} fill="oklch(0.72 0.19 195.56)" textAnchor="middle" fontWeight="bold">{d.avgScore}</text>
            {/* AI 점수 */}
            <circle cx={toX(i)} cy={toY(d.avgAiScore)} r={4} fill="oklch(0.65 0.15 280)" stroke="oklch(0.15 0 0)" strokeWidth={2} />
            {Math.abs(d.avgScore - d.avgAiScore) > 8 && (
              <text x={toX(i)} y={toY(d.avgAiScore) + 15} fontSize={9} fill="oklch(0.65 0.15 280)" textAnchor="middle">{d.avgAiScore}</text>
            )}
            {/* 월 라벨 */}
            <text x={toX(i)} y={H - 8} fontSize={9} fill="currentColor" opacity={0.5} textAnchor="middle">
              {d.month.split("-")[1]}월
            </text>
          </g>
        ))}

        {/* 범례 */}
        <g transform={`translate(${PAD.left + 10}, 12)`}>
          <line x1={0} y1={0} x2={16} y2={0} stroke="oklch(0.72 0.19 195.56)" strokeWidth={2.5} />
          <text x={20} y={4} fontSize={9} fill="currentColor" opacity={0.6}>종합 점수</text>
          <line x1={80} y1={0} x2={96} y2={0} stroke="oklch(0.65 0.15 280)" strokeWidth={2} strokeDasharray="4 2" />
          <text x={100} y={4} fontSize={9} fill="currentColor" opacity={0.6}>AI 인용 점수</text>
        </g>
      </svg>
    </div>
  );
}

// ── 카테고리별 추이 차트 ──
function CategoryTrendChart({ data }: { data: { month: string; categories: { name: string; pct: number }[] }[] }) {
  if (data.length < 1) return null;

  const COLORS: Record<string, string> = {
    "AI 검색 기본": "oklch(0.65 0.15 250)",
    "콘텐츠 품질": "oklch(0.72 0.15 80)",
    "기술 최적화": "oklch(0.72 0.15 160)",
    "AI 인용": "oklch(0.65 0.15 280)",
    "소셜/외부 연결": "oklch(0.65 0.15 340)",
  };

  const allCategories = Array.from(new Set(data.flatMap(d => d.categories.map(c => c.name))));
  const W = Math.max(data.length * 80, 400);
  const H = 180;
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const toY = (v: number) => PAD.top + chartH - (v / 100) * chartH;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300, maxHeight: 220 }}>
        {/* 그리드 */}
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="currentColor" strokeOpacity={0.06} />
            <text x={PAD.left - 6} y={toY(v) + 3} fontSize={8} fill="currentColor" opacity={0.3} textAnchor="end">{v}%</text>
          </g>
        ))}

        {/* 카테고리별 라인 */}
        {allCategories.map((catName) => {
          const color = COLORS[catName] || "oklch(0.6 0.1 0)";
          const points = data.map((d, i) => {
            const cat = d.categories.find(c => c.name === catName);
            return `${toX(i)},${toY(cat?.pct ?? 0)}`;
          }).join(" ");
          return (
            <polyline key={catName} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
          );
        })}

        {/* 월 라벨 */}
        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - 8} fontSize={9} fill="currentColor" opacity={0.5} textAnchor="middle">
            {d.month.split("-")[1]}월
          </text>
        ))}
      </svg>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {allCategories.map((catName) => (
          <div key={catName} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: COLORS[catName] || "#888" }} />
            {catName}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 변화 뱃지 ──
function ChangeBadge({ change, suffix = "점" }: { change: number; suffix?: string }) {
  if (change > 0) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-400 text-sm font-semibold">
      <ArrowUpRight className="w-3.5 h-3.5" />+{change}{suffix}
    </span>
  );
  if (change < 0) return (
    <span className="inline-flex items-center gap-0.5 text-red-400 text-sm font-semibold">
      <ArrowDownRight className="w-3.5 h-3.5" />{change}{suffix}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground text-sm">
      <Minus className="w-3.5 h-3.5" />변화 없음
    </span>
  );
}

// ── 메인 컴포넌트 ──
export default function SeoHistory() {
  const [inputUrl, setInputUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");

  // URL 파라미터에서 자동 로드 (url 또는 share 파라미터)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    const shareParam = params.get("share");
    if (shareParam) {
      const decoded = decodeShareUrl(shareParam);
      if (decoded) {
        setInputUrl(decoded);
        setSearchUrl(decoded);
      }
    } else if (urlParam) {
      setInputUrl(urlParam);
      setSearchUrl(urlParam);
    }
  }, []);

  // 데이터 쿼리
  const { data: history = [], isLoading: historyLoading } = trpc.seoAnalyzer.getHistory.useQuery(
    { url: searchUrl },
    { enabled: !!searchUrl }
  );

  const { data: monthlyTrend = [], isLoading: trendLoading } = trpc.seoAnalyzer.getMonthlyTrend.useQuery(
    { url: searchUrl, months: 12 },
    { enabled: !!searchUrl }
  );

  const { data: categoryTrend = [], isLoading: catLoading } = trpc.seoAnalyzer.getCategoryTrend.useQuery(
    { url: searchUrl, months: 12 },
    { enabled: !!searchUrl }
  );

  const { data: comparison } = trpc.seoAnalyzer.getScoreComparison.useQuery(
    { url: searchUrl },
    { enabled: !!searchUrl }
  );

  const isLoading = historyLoading || trendLoading || catLoading;

  // 월간 추이 데이터 가공
  const trendChartData = useMemo(() => {
    return (monthlyTrend as any[]).map((m: any) => ({
      month: m.month,
      avgScore: Number(m.avgScore) || 0,
      avgAiScore: Number(m.avgAiScore) || 0,
      latestGrade: m.latestGrade || getGrade(Number(m.avgScore) || 0),
    }));
  }, [monthlyTrend]);

  // 카테고리 추이 데이터 가공 — 월별로 그룹핑
  const categoryChartData = useMemo(() => {
    if (!categoryTrend || (categoryTrend as any[]).length === 0) return [];
    const byMonth: Record<string, { name: string; pct: number }[]> = {};
    for (const row of categoryTrend as any[]) {
      const date = new Date(row.diagnosedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[month]) byMonth[month] = [];
      try {
        const cats = typeof row.categoryScores === "string" ? JSON.parse(row.categoryScores) : row.categoryScores;
        if (Array.isArray(cats)) {
          for (const cat of cats) {
            const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
            // 같은 월에 같은 카테고리가 여러번 있으면 마지막 값 사용
            const existing = byMonth[month].findIndex(c => c.name === cat.name);
            if (existing >= 0) byMonth[month][existing].pct = pct;
            else byMonth[month].push({ name: cat.name, pct });
          }
        }
      } catch {}
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, categories]) => ({ month, categories }));
  }, [categoryTrend]);

  // 최근 vs 이전 비교 (최근 2개 히스토리)
  const recentChange = useMemo(() => {
    if (history.length < 2) return null;
    const latest = history[0];
    const prev = history[1];
    return {
      scoreChange: Number(latest.totalScore) - Number(prev.totalScore),
      aiChange: (Number(latest.aiScore) || 0) - (Number(prev.aiScore) || 0),
      latestDate: latest.diagnosedAt,
      prevDate: prev.diagnosedAt,
    };
  }, [history]);

  const latest = history[0] ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setSearchUrl(inputUrl.trim());
      // URL 파라미터 업데이트
      const params = new URLSearchParams(window.location.search);
      params.set("url", inputUrl.trim());
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* 헤더 */}
      <section className="pt-28 pb-12">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-6">
            <Activity className="w-4 h-4" />
            진단 이력 추이 분석
          </div>
          <h1 className="text-3xl font-bold font-display mb-3">
            AI 검색 점수 <span className="text-brand">변화 추이</span>
          </h1>
          {/* 공유 링크 안내 */}
          {searchUrl && history.length > 0 && (
            <div className="flex justify-center mb-4">
              <ShareButton url={searchUrl} />
            </div>
          )}
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            같은 병원의 시간별 AI 검색 점수 변화를 확인하세요.<br />
            매월 진단하면 개선 여부를 객관적으로 추적할 수 있습니다.
          </p>

          {/* URL 검색 */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="병원 URL 입력 (예: editionps.com)"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!inputUrl.trim()}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                조회
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 로딩 */}
      {isLoading && searchUrl && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
          <span className="ml-3 text-muted-foreground">이력을 불러오는 중...</span>
        </div>
      )}

      {/* 데이터 없음 */}
      {!isLoading && searchUrl && history.length === 0 && (
        <div className="container max-w-4xl mx-auto py-16 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">진단 이력이 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-6">
            이 URL에 대한 진단 기록이 아직 없습니다.<br />
            먼저 AI 검색 진단을 실행해주세요.
          </p>
          <Link href={`/seo-check?url=${encodeURIComponent(searchUrl)}`}>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all">
              <Search className="w-4 h-4" />
              지금 진단하기
            </button>
          </Link>
        </div>
      )}

      {/* 결과 대시보드 */}
      {!isLoading && searchUrl && history.length > 0 && (
        <section className="pb-20">
          <div className="container max-w-4xl mx-auto space-y-6">

            {/* ── 요약 카드 ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 현재 점수 */}
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className={`inline-flex w-14 h-14 rounded-full items-center justify-center mb-2 ${getGradeColor(latest?.grade || "F").bg} border ${getGradeColor(latest?.grade || "F").border}`}>
                    <span className={`text-xl font-bold ${getGradeColor(latest?.grade || "F").text}`}>
                      {Number(latest?.totalScore) || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">현재 점수</p>
                  <p className={`text-sm font-semibold ${getGradeColor(latest?.grade || "F").text}`}>
                    {latest?.grade || "F"} 등급
                  </p>
                </CardContent>
              </Card>

              {/* 전회 대비 변화 */}
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-2 bg-accent/50">
                    {recentChange && recentChange.scoreChange > 0 ? (
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    ) : recentChange && recentChange.scoreChange < 0 ? (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    ) : (
                      <Minus className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">전회 대비</p>
                  {recentChange ? (
                    <ChangeBadge change={recentChange.scoreChange} />
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터 부족</p>
                  )}
                </CardContent>
              </Card>

              {/* 총 진단 횟수 */}
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-2 bg-accent/50">
                    <Target className="w-6 h-6 text-brand" />
                  </div>
                  <p className="text-xs text-muted-foreground">총 진단</p>
                  <p className="text-lg font-bold">{history.length}회</p>
                </CardContent>
              </Card>

              {/* 추적 기간 */}
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-2 bg-accent/50">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">추적 기간</p>
                  <p className="text-sm font-semibold">
                    {comparison ? `${comparison.periodDays}일` : history.length > 1 ? "계산 중" : "1회"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── 첫 진단 vs 최근 진단 비교 ── */}
            {comparison && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand" />
                    첫 진단 vs 최근 진단 비교
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* 첫 진단 */}
                    <div className="text-center p-4 rounded-xl bg-accent/30">
                      <p className="text-xs text-muted-foreground mb-2">첫 진단 ({formatDate(comparison.first.date)})</p>
                      <div className={`inline-flex w-16 h-16 rounded-full items-center justify-center mb-2 ${getGradeColor(comparison.first.grade).bg} border ${getGradeColor(comparison.first.grade).border}`}>
                        <span className={`text-2xl font-bold ${getGradeColor(comparison.first.grade).text}`}>
                          {comparison.first.score}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold ${getGradeColor(comparison.first.grade).text}`}>
                        {comparison.first.grade} 등급
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">AI 인용: {comparison.first.aiScore}점</p>
                    </div>

                    {/* 최근 진단 */}
                    <div className="text-center p-4 rounded-xl bg-accent/30">
                      <p className="text-xs text-muted-foreground mb-2">최근 진단 ({formatDate(comparison.latest.date)})</p>
                      <div className={`inline-flex w-16 h-16 rounded-full items-center justify-center mb-2 ${getGradeColor(comparison.latest.grade).bg} border ${getGradeColor(comparison.latest.grade).border}`}>
                        <span className={`text-2xl font-bold ${getGradeColor(comparison.latest.grade).text}`}>
                          {comparison.latest.score}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold ${getGradeColor(comparison.latest.grade).text}`}>
                        {comparison.latest.grade} 등급
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">AI 인용: {comparison.latest.aiScore}점</p>
                    </div>
                  </div>

                  {/* 변화 요약 */}
                  <div className="mt-4 p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {comparison.periodDays}일간 {comparison.totalDiagnoses}회 진단 결과
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {comparison.change === 0
                          ? "점수 변화가 없습니다. 개선 조치가 필요합니다."
                          : comparison.change > 0
                          ? "점수가 개선되었습니다. 좋은 방향으로 가고 있습니다."
                          : "점수가 하락했습니다. 즉시 개선 조치가 필요합니다."}
                      </p>
                    </div>
                    <div className="text-right">
                      <ChangeBadge change={comparison.change} />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI: <ChangeBadge change={comparison.aiChange} />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── 종합 점수 추이 차트 ── */}
            {trendChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand" />
                    월별 점수 변화 추이
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreTrendChart data={trendChartData} />
                </CardContent>
              </Card>
            )}

            {/* ── 카테고리별 추이 ── */}
            {categoryChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand" />
                    영역별 점수 변화 추이
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryTrendChart data={categoryChartData} />
                </CardContent>
              </Card>
            )}

            {/* ── 진단 이력 타임라인 ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand" />
                  전체 진단 이력 ({history.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item: any, idx: number) => {
                    const score = Number(item.totalScore) || 0;
                    const aiScore = Number(item.aiScore) || 0;
                    const grade = item.grade || getGrade(score);
                    const prevItem = history[idx + 1];
                    const change = prevItem ? score - Number(prevItem.totalScore) : null;
                    const gc = getGradeColor(grade);

                    return (
                      <div key={item.id || idx} className="flex items-center gap-4 p-3 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors">
                        {/* 점수 원 */}
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${gc.bg} border ${gc.border}`}>
                          <span className={`text-sm font-bold ${gc.text}`}>{score}</span>
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${gc.text}`}>{grade}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.diagnosedAt)}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-medium">최신</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Bot className="w-3 h-3" /> AI: {aiScore}점
                            </span>
                            {change !== null && (
                              <span className="text-xs">
                                전회 대비: <ChangeBadge change={change} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── CTA ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link href={`/seo-check?url=${encodeURIComponent(searchUrl)}`}>
                <div className="group p-5 rounded-xl border border-border/60 bg-card/50 hover:border-brand/30 hover:bg-brand/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Search className="w-5 h-5 text-brand" />
                    <span className="font-semibold text-sm">새로 진단하기</span>
                  </div>
                  <p className="text-xs text-muted-foreground">최신 진단을 실행하여 추이 데이터를 업데이트하세요</p>
                </div>
              </Link>
              <Link href="/#contact">
                <div className="group p-5 rounded-xl border border-border/60 bg-card/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-sm">전문가 상담 받기</span>
                  </div>
                  <p className="text-xs text-muted-foreground">점수 개선을 위한 맞춤 전략을 제안받으세요</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 검색 전 안내 */}
      {!searchUrl && (
        <section className="py-16">
          <div className="container max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Activity className="w-6 h-6" />,
                  title: "점수 변화 추적",
                  desc: "매월 진단하면 AI 검색 점수의 변화를 시각적으로 확인할 수 있습니다.",
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "영역별 분석",
                  desc: "AI 검색 기본, 콘텐츠, 기술, AI 인용 등 각 영역의 개선 추이를 파악합니다.",
                },
                {
                  icon: <Target className="w-6 h-6" />,
                  title: "객관적 데이터",
                  desc: "감이 아닌 데이터로 마케팅 투자 효과를 증명합니다.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <div className="inline-flex p-3 rounded-xl bg-brand/10 text-brand mb-4">
                    {item.icon}
                  </div>
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

/**
 * 진단 보고서 대시보드 탭 — 점수/등급, 항목별 분석, 추이 그래프
 * diagnosis_history 테이블 데이터를 시각적으로 보여줌
 * DB 스키마: id, url, totalScore, aiScore, grade, specialty, region, categoryScores(JSON), diagnosedAt
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, Minus, Shield, Search, Bot, Globe, FileText,
  CheckCircle2, XCircle, AlertTriangle, Loader2, BarChart3,
} from "lucide-react";

function ScoreCircle({ score, grade, size = "lg" }: { score: number; grade: string; size?: "lg" | "sm" }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : score >= 40 ? "text-orange-400" : "text-red-400";
  const bgColor = score >= 80 ? "bg-emerald-400/10" : score >= 60 ? "bg-amber-400/10" : score >= 40 ? "bg-orange-400/10" : "bg-red-400/10";
  const borderColor = score >= 80 ? "border-emerald-400/30" : score >= 60 ? "border-amber-400/30" : score >= 40 ? "border-orange-400/30" : "border-red-400/30";
  if (size === "sm") {
    return (
      <div className={`w-12 h-12 rounded-full ${bgColor} border ${borderColor} flex items-center justify-center`}>
        <span className={`text-sm font-bold ${color}`}>{score}</span>
      </div>
    );
  }
  return (
    <div className={`w-28 h-28 rounded-full ${bgColor} border-2 ${borderColor} flex flex-col items-center justify-center`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className={`text-xs ${color} font-medium`}>{grade}</span>
    </div>
  );
}

function TrendBadge({ change }: { change: number | null }) {
  if (change === null || change === undefined) return <span className="text-xs text-muted-foreground">-</span>;
  if (change > 0) return <span className="text-xs text-emerald-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{change}</span>;
  if (change < 0) return <span className="text-xs text-red-400 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{change}</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" />0</span>;
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

// 간단한 바 차트 컴포넌트
function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}점</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// 추이 미니 차트 (최근 6개월)
function TrendChart({ data }: { data: { label: string; score: number }[] }) {
  if (data.length < 2) return <p className="text-xs text-muted-foreground text-center py-4">추이 데이터가 부족합니다.</p>;
  const maxScore = Math.max(...data.map((d) => d.score), 100);
  const minScore = Math.min(...data.map((d) => d.score), 0);
  const range = maxScore - minScore || 1;
  const h = 120;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${(data.length - 1) * 60 + 20} ${h + 30}`} className="w-full" style={{ maxHeight: 160 }}>
        {/* grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = h - ((v - minScore) / range) * h + 10;
          return (
            <g key={v}>
              <line x1={10} y1={y} x2={(data.length - 1) * 60 + 10} y2={y} stroke="currentColor" strokeOpacity={0.1} />
              <text x={0} y={y + 3} fontSize={8} fill="currentColor" opacity={0.4}>{v}</text>
            </g>
          );
        })}
        {/* line */}
        <polyline
          fill="none"
          stroke="oklch(0.72 0.19 195.56)"
          strokeWidth={2}
          points={data.map((d, i) => `${i * 60 + 10},${h - ((d.score - minScore) / range) * h + 10}`).join(" ")}
        />
        {/* dots + labels */}
        {data.map((d, i) => {
          const x = i * 60 + 10;
          const y = h - ((d.score - minScore) / range) * h + 10;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill="oklch(0.72 0.19 195.56)" />
              <text x={x} y={y - 8} fontSize={9} fill="oklch(0.72 0.19 195.56)" textAnchor="middle" fontWeight="bold">{d.score}</text>
              <text x={x} y={h + 25} fontSize={8} fill="currentColor" opacity={0.5} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DiagnosisTab() {
  const { data: diagHistory = [], isLoading } = trpc.myHospital.diagnosisHistory.useQuery();

  const latest = useMemo(() => diagHistory[0] ?? null, [diagHistory]);
  const previous = useMemo(() => diagHistory[1] ?? null, [diagHistory]);

  // diagnosedAt에서 날짜 라벨 추출
  const trendData = useMemo(() => {
    return [...diagHistory].reverse().slice(-6).map((d) => {
      const date = new Date(d.diagnosedAt);
      return {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        score: Number(d.totalScore) || 0,
      };
    });
  }, [diagHistory]);

  const scoreChange = useMemo(() => {
    if (!latest || !previous) return null;
    return Number(latest.totalScore) - Number(previous.totalScore);
  }, [latest, previous]);

  // categoryScores JSON 파싱 → 영역별 점수 추출
  const categoryData = useMemo(() => {
    if (!latest?.categoryScores) return [];
    try {
      const parsed = typeof latest.categoryScores === "string" ? JSON.parse(latest.categoryScores) : latest.categoryScores;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [latest]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!latest) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">아직 진단 보고서가 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            병원 온라인 마케팅 진단이 완료되면<br />이곳에서 상세 결과를 확인하실 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalScore = Number(latest.totalScore) || 0;
  const grade = getGrade(totalScore);
  const aiScore = Number(latest.aiScore) || 0;

  // categoryScores에서 영역별 점수 매핑
  const CATEGORY_COLORS: Record<string, string> = {
    "AI 검색 기본": "bg-blue-500",
    "콘텐츠 품질": "bg-amber-500",
    "기술 최적화": "bg-emerald-500",
    "AI 검색 노출": "bg-violet-500",
    "소셜/외부 연결": "bg-pink-500",
  };

  const passedCategories = categoryData.filter((c: any) => {
    const pct = c.max > 0 ? (c.score / c.max) * 100 : 0;
    return pct >= 70;
  });
  const failedCategories = categoryData.filter((c: any) => {
    const pct = c.max > 0 ? (c.score / c.max) * 100 : 0;
    return pct < 70;
  });

  return (
    <div className="space-y-6">
      {/* 종합 점수 카드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreCircle score={totalScore} grade={grade} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold mb-1">종합 점수: {totalScore}점</h3>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <span className="text-sm text-muted-foreground">등급: {grade}</span>
                {scoreChange !== null && (
                  <span className="text-sm">
                    (전회 대비 <TrendBadge change={scoreChange} />)
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 양호 {passedCategories.length}개 영역</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> 개선 필요 {failedCategories.length}개 영역</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                진단일: {new Date(latest.diagnosedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영역별 점수 */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-brand" /> 영역별 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.map((cat: any, idx: number) => (
              <SimpleBar
                key={idx}
                label={cat.name || `영역 ${idx + 1}`}
                value={Number(cat.score) || 0}
                max={Number(cat.max) || 100}
                color={CATEGORY_COLORS[cat.name] || "bg-brand"}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI 노출 점수 별도 표시 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-brand" /> AI 노출 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ScoreCircle score={aiScore} grade={aiScore >= 70 ? "양호" : aiScore >= 40 ? "보통" : "미흡"} size="sm" />
              <div>
                <p className="text-sm font-medium">{aiScore}점</p>
                <p className="text-xs text-muted-foreground">
                  {aiScore >= 70 ? "AI 검색에 잘 노출되고 있습니다" : aiScore >= 40 ? "AI 인용 개선이 필요합니다" : "AI 인용이 매우 부족합니다"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4 text-brand" /> 진단 URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground truncate">{latest.url}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {latest.specialty && `진료과: ${latest.specialty}`}
              {latest.specialty && latest.region && " · "}
              {latest.region && `지역: ${latest.region}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 점수 추이 */}
      {trendData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand" /> 점수 변화 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} />
          </CardContent>
        </Card>
      )}

      {/* 개선 필요 영역 */}
      {failedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> 개선 추천 영역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedCategories.map((cat: any, idx: number) => {
                const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-amber-400/5">
                    <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.score}/{cat.max}점 ({pct}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

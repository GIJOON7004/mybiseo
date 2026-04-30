import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BarChart3, Target, TrendingUp, AlertTriangle, CheckCircle2,
  Plus, Trash2, FileText, Calendar, Lightbulb, Share2, ArrowRight,
  Trophy, Zap, Clock, ChevronDown, ChevronUp, Download, Loader2
} from "lucide-react";

// ─── 타입 정의 ───
interface ActionableInsight {
  priority: string;
  title: string;
  description: string;
  expectedImpact: string;
  competitorRef: string;
}

interface SnsMarketingTip {
  platform: string;
  tip: string;
  frequency: string;
  keywordSuggestion: string;
}

interface WeeklyPlanItem {
  week: string;
  tasks: string[];
}

interface CategoryComparisonItem {
  category: string;
  myScore: number;
  maxScore: number;
  competitors: { name: string; score: number; maxScore: number }[];
  items: { name: string; status: string; message: string }[];
}

interface Competitor {
  name: string;
  url?: string;
  score: number;
  grade: string;
}

// ─── 점수 색상 유틸 ───
function getScoreColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 60) return "text-yellow-400";
  return "text-red-400";
}

function getGradeColor(grade: string) {
  if (grade === "A" || grade === "A+") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (grade === "B" || grade === "B+") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (grade === "C") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function getPriorityColor(priority: string) {
  if (priority === "긴급") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (priority === "중요") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-blue-500/20 text-blue-400 border-blue-500/30";
}

// ─── 리포트 생성 폼 ───
function ReportGenerateForm({ onGenerated }: { onGenerated: () => void }) {
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalUrl, setHospitalUrl] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);

  const generateMutation = trpc.benchmarkingReport.generate.useMutation({
    onSuccess: () => {
      toast.success("벤치마킹 리포트가 생성되었습니다!");
      onGenerated();
    },
    onError: (err) => {
      toast.error(`리포트 생성 실패: ${err.message}`);
    },
  });

  const addCompetitor = () => {
    if (competitorUrls.length < 3) {
      setCompetitorUrls([...competitorUrls, ""]);
    }
  };

  const removeCompetitor = (idx: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== idx));
  };

  const updateCompetitor = (idx: number, value: string) => {
    const updated = [...competitorUrls];
    updated[idx] = value;
    setCompetitorUrls(updated);
  };

  const handleSubmit = () => {
    if (!hospitalName.trim() || !hospitalUrl.trim()) {
      toast.error("병원명과 URL을 입력해주세요.");
      return;
    }
    const validUrls = competitorUrls.filter(u => u.trim());
    if (validUrls.length === 0) {
      toast.error("경쟁사 URL을 최소 1개 입력해주세요.");
      return;
    }
    generateMutation.mutate({
      hospitalName: hospitalName.trim(),
      hospitalUrl: hospitalUrl.trim(),
      specialty: specialty.trim() || undefined,
      competitorUrls: validUrls,
    });
  };

  return (
    <Card className="border-brand/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand" />
          새 벤치마킹 리포트 생성
        </CardTitle>
        <CardDescription>
          우리 병원과 경쟁사의 온라인 마케팅 현황을 비교 분석하고, 즉시 실행 가능한 전략을 제안합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>병원명 *</Label>
            <Input
              placeholder="예: 서울미래치과의원"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>병원 홈페이지 URL *</Label>
            <Input
              placeholder="예: seoul-dental.com"
              value={hospitalUrl}
              onChange={(e) => setHospitalUrl(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>진료과 (선택)</Label>
          <Input
            placeholder="예: 치과, 피부과, 성형외과"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>경쟁사 URL (최대 3개) *</Label>
            {competitorUrls.length < 3 && (
              <Button variant="ghost" size="sm" onClick={addCompetitor}>
                <Plus className="h-4 w-4 mr-1" /> 추가
              </Button>
            )}
          </div>
          {competitorUrls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder={`경쟁사 ${idx + 1} URL (예: competitor-dental.com)`}
                value={url}
                onChange={(e) => updateCompetitor(idx, e.target.value)}
              />
              {competitorUrls.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeCompetitor(idx)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              분석 중... (약 30초~1분 소요)
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              벤치마킹 리포트 생성
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── 리포트 상세 뷰 ───
function ReportDetail({ reportId, onBack }: { reportId: number; onBack: () => void }) {
  const { data: report, isLoading } = trpc.benchmarkingReport.getById.useQuery({ id: reportId });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const pdfMutation = trpc.benchmarkingPdf.generate.useMutation({
    onSuccess: (data) => {
      // PDF URL을 새 탭으로 열어 다운로드
      const link = document.createElement("a");
      link.href = data.pdfUrl;
      link.download = data.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF 다운로드가 시작되었습니다.");
    },
    onError: (err) => toast.error(`PDF 생성 실패: ${err.message}`),
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">리포트를 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>목록으로</Button>
      </Card>
    );
  }

  const competitors = report.competitors as Competitor[];
  const categoryComparison = report.categoryComparison as CategoryComparisonItem[];
  const actionableInsights = report.actionableInsights as ActionableInsight[];
  const snsMarketingTips = report.snsMarketingTips as SnsMarketingTip[];
  const weeklyPlan = report.weeklyPlan as WeeklyPlanItem[];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            ← 목록으로
          </Button>
          <h2 className="text-xl font-bold">{report.reportTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(report.createdAt).toLocaleDateString("ko-KR")} 생성
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pdfMutation.mutate({ reportId })}
            disabled={pdfMutation.isPending}
            className="gap-1"
          >
            {pdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF 다운로드
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/admin/benchmarking?id=${reportId}`;
              navigator.clipboard.writeText(url);
              toast.success("링크가 복사되었습니다.");
            }}
            className="gap-1"
          >
            <Share2 className="h-4 w-4" /> 공유
          </Button>
        </div>
      </div>

      {/* 점수 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">내 병원</p>
            <p className={`text-2xl font-bold ${getScoreColor(report.myScore, 100)}`}>{report.myScore}점</p>
            <Badge variant="outline" className={`mt-1 ${getGradeColor(report.myGrade)}`}>{report.myGrade}등급</Badge>
          </CardContent>
        </Card>
        {competitors.map((comp, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1 truncate">{comp.name}</p>
              <p className={`text-2xl font-bold ${getScoreColor(comp.score, 100)}`}>{comp.score}점</p>
              <Badge variant="outline" className={`mt-1 ${getGradeColor(comp.grade)}`}>{comp.grade}등급</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 핵심 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" /> 핵심 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* 탭: 실행 지침 / 카테고리 비교 / SNS 팁 / 주간 계획 */}
      <Tabs defaultValue="insights">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="insights" className="text-xs">실행 지침</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">카테고리 비교</TabsTrigger>
          <TabsTrigger value="sns" className="text-xs">SNS 팁</TabsTrigger>
          <TabsTrigger value="plan" className="text-xs">주간 계획</TabsTrigger>
        </TabsList>

        {/* 실행 지침 (Actionable Insights) */}
        <TabsContent value="insights" className="space-y-3 mt-4">
          {actionableInsights.map((insight, idx) => (
            <Card key={idx} className="border-l-4" style={{
              borderLeftColor: insight.priority === "긴급" ? "#ef4444" : insight.priority === "중요" ? "#f97316" : "#3b82f6"
            }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                      {insight.priority === "긴급" ? <AlertTriangle className="h-3 w-3 mr-1" /> :
                       insight.priority === "중요" ? <Zap className="h-3 w-3 mr-1" /> :
                       <Lightbulb className="h-3 w-3 mr-1" />}
                      {insight.priority}
                    </Badge>
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> {insight.expectedImpact}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Trophy className="h-3 w-3" /> {insight.competitorRef}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {actionableInsights.length === 0 && (
            <p className="text-center text-muted-foreground py-8">분석 결과가 없습니다.</p>
          )}
        </TabsContent>

        {/* 카테고리별 비교 */}
        <TabsContent value="comparison" className="space-y-3 mt-4">
          {categoryComparison.map((cat) => (
            <Card key={cat.category}>
              <CardContent className="p-4">
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => toggleCategory(cat.category)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{cat.category}</span>
                    <span className={`text-sm font-mono ${getScoreColor(cat.myScore, cat.maxScore)}`}>
                      {cat.myScore}/{cat.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {cat.competitors.map((comp, i) => (
                      <span key={i} className="text-xs text-muted-foreground">
                        {comp.name}: <span className={getScoreColor(comp.score, comp.maxScore)}>{comp.score}</span>
                      </span>
                    ))}
                    {expandedCategories.has(cat.category) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* 바 차트 */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate text-brand">내 병원</span>
                    <div className="flex-1 bg-muted/30 rounded-full h-2.5">
                      <div className="bg-brand h-2.5 rounded-full transition-all" style={{ width: `${(cat.myScore / cat.maxScore) * 100}%` }} />
                    </div>
                  </div>
                  {cat.competitors.map((comp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-20 truncate text-muted-foreground">{comp.name}</span>
                      <div className="flex-1 bg-muted/30 rounded-full h-2.5">
                        <div className="bg-muted-foreground/50 h-2.5 rounded-full transition-all" style={{ width: `${(comp.score / comp.maxScore) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 문제 항목 */}
                {expandedCategories.has(cat.category) && cat.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                    {cat.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        {item.status === "fail" ? (
                          <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
                        )}
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{item.name}</span>: {item.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SNS 마케팅 팁 */}
        <TabsContent value="sns" className="space-y-3 mt-4">
          {snsMarketingTips.map((tip, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {tip.platform}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {tip.frequency}
                  </span>
                </div>
                <p className="text-sm mb-2">{tip.tip}</p>
                <div className="flex items-center gap-1 text-xs text-brand">
                  <Target className="h-3 w-3" /> 추천 키워드: {tip.keywordSuggestion}
                </div>
              </CardContent>
            </Card>
          ))}
          {snsMarketingTips.length === 0 && (
            <p className="text-center text-muted-foreground py-8">SNS 마케팅 팁이 없습니다.</p>
          )}
        </TabsContent>

        {/* 주간 실행 계획 */}
        <TabsContent value="plan" className="mt-4">
          <div className="space-y-4">
            {weeklyPlan.map((week, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{week.week}</span>
                  </div>
                  <ul className="space-y-2">
                    {week.tasks.map((task, ti) => (
                      <li key={ti} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{task}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── 메인 페이지 ───
export default function BenchmarkingReport() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const { data: reports, isLoading, refetch } = trpc.benchmarkingReport.list.useQuery();

  if (selectedReportId !== null) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <ReportDetail reportId={selectedReportId} onBack={() => setSelectedReportId(null)} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand" />
            프리미엄 벤치마킹 리포트
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            경쟁사 대비 우리 병원의 온라인 마케팅 현황을 분석하고, 즉시 실행 가능한 전략을 제안합니다.
          </p>
        </div>

        {/* 리포트 생성 폼 */}
        <ReportGenerateForm onGenerated={() => refetch()} />

        {/* 기존 리포트 목록 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" /> 생성된 리포트
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">아직 생성된 리포트가 없습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">위 폼에서 경쟁사 URL을 입력하고 리포트를 생성해보세요.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:border-brand/30 transition-colors"
                  onClick={() => setSelectedReportId(report.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{report.reportTitle}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className={getGradeColor(report.myGrade)}>
                          {report.myScore}점 ({report.myGrade})
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        <Badge variant="outline" className={
                          report.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                          report.status === "generating" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }>
                          {report.status === "completed" ? "완료" : report.status === "generating" ? "생성 중" : "실패"}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * SaaS 고객용 대시보드 — AI 마케팅 관리 도구
 * 8개 탭: 리포트 | AI 인용 | 유입 분석 | 상담 관리 | 병원 정보 | 진단 보고서 | 상담 현황 | CRM
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import HospitalInfoTab from "@/pages/HospitalInfoTab";
import DiagnosisTab from "@/pages/DiagnosisTab";
import ConsultationStatsTab from "@/pages/ConsultationStatsTab";
import CrmTab from "@/pages/CrmTab";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2, RefreshCw, BarChart3, Zap, Shield,
  Globe, MessageSquare, FileText, ChevronRight,
  ExternalLink, Settings, ClipboardList, Stethoscope,
} from "lucide-react";

import TrafficAnalysisTab from "./MyHospital/TrafficAnalysisTab";
import ConsultationTab from "./MyHospital/ConsultationTab";
import MonthlyReportTab from "./MyHospital/MonthlyReportTab";
import AiExposureTab from "./MyHospital/AiExposureTab";
import DemoPreview from "./MyHospital/DemoPreview";
import { InsightBanner, SPECIALTIES, REGIONS } from "./MyHospital/shared";

// ─── 온보딩 폼 ──────────────────────────────────────────────────

function OnboardingForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ hospitalName: "", hospitalUrl: "", specialty: "", region: "", phone: "" });
  const createProfile = trpc.myHospital.createProfile.useMutation({
    onSuccess: () => {
      toast.success("병원 프로필이 등록되었습니다!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hospitalName || !form.hospitalUrl) {
      toast.error("병원명과 URL은 필수입니다");
      return;
    }
    let url = form.hospitalUrl;
    if (!url.startsWith("http")) url = "https://" + url;
    createProfile.mutate({ ...form, hospitalUrl: url });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-lg mx-auto px-4">
        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-brand" />
            </div>
            <CardTitle className="text-xl">병원 프로필 등록</CardTitle>
            <CardDescription>AI 마케팅 관리 도구를 사용하려면 먼저 병원 정보를 등록해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">병원명 *</Label>
                <Input id="hospitalName" placeholder="예: 서울미래치과" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalUrl">병원 웹사이트 URL *</Label>
                <Input id="hospitalUrl" placeholder="예: seoul-dental.com" value={form.hospitalUrl} onChange={(e) => setForm({ ...form, hospitalUrl: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>진료과</Label>
                  <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>지역</Label>
                  <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">연락처 (선택)</Label>
                <Input id="phone" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand/90" disabled={createProfile.isPending}>
                {createProfile.isPending ? "등록 중..." : "병원 등록하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

// ─── 방문자 퍼널 카드 ──────────────────────────────────────────

function VisitorFunnelCard() {
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);
  const today = useMemo(() => new Date().toISOString(), []);
  const { data: funnel } = trpc.analytics.visitorFunnel.useQuery({ from: thirtyDaysAgo, to: today });

  if (!funnel || funnel.totalVisitors === 0) return null;

  const steps = [
    { label: "웹사이트 방문", value: funnel.totalVisitors, color: "bg-blue-500" },
    { label: "2페이지 이상 탐색", value: funnel.multiPageViewers, color: "bg-brand" },
    { label: "상담 문의 제출", value: funnel.inquirySubmitters, color: "bg-emerald-500" },
  ];
  const maxVal = steps[0].value || 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          방문자 행동 퍼널 <span className="text-xs text-muted-foreground font-normal">최근 30일</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const pct = maxVal > 0 ? Math.round((step.value / maxVal) * 100) : 0;
            const convFromPrev = i > 0 && steps[i - 1].value > 0
              ? Math.round((step.value / steps[i - 1].value) * 100)
              : null;
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}명</span>
                    {convFromPrev !== null && (
                      <span className="text-xs text-muted-foreground">({convFromPrev}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  >
                    {pct >= 15 && <span className="text-[10px] text-white font-medium">{pct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">방문 → 상담 전환율</span>
          <span className="text-sm font-bold text-brand">
            {funnel.totalVisitors > 0 ? ((funnel.inquirySubmitters / funnel.totalVisitors) * 100).toFixed(1) : "0"}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 메인 대시보드
// ═══════════════════════════════════════════════════════════════

function Dashboard() {
  const utils = trpc.useUtils();
  const { data: dashData, isLoading: dashLoading } = trpc.myHospital.dashboard.useQuery();
  const { data: consultStats } = trpc.analytics.consultationStats.useQuery();
  const [visitDateRange] = useState(() => ({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  }));
  const { data: visitStats } = trpc.analytics.visitStats.useQuery(visitDateRange);
  const runDiagnosis = trpc.myHospital.runDiagnosis.useMutation({
    onSuccess: () => {
      toast.success("진단이 완료되었습니다!");
      utils.myHospital.dashboard.invalidate();
      utils.myHospital.improvements.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingCount = consultStats?.pending ?? 0;

  if (dashLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dashData) {
    return <OnboardingForm onSuccess={() => utils.myHospital.dashboard.invalidate()} />;
  }

  const { profile } = dashData;
  const latestDiag = dashData.history?.length > 0 ? dashData.history[dashData.history.length - 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-6xl mx-auto px-4">
        {/* 웰컴 헤더 */}
        <div className="rounded-2xl bg-gradient-to-r from-card to-card/80 border border-border p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-brand" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{profile.hospitalName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {profile.specialty && <span className="mr-2">{profile.specialty}</span>}
                  {profile.region && <span className="mr-2">{profile.region}</span>}
                  <a href={profile.hospitalUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                    {profile.hospitalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button
                onClick={() => runDiagnosis.mutate()}
                disabled={runDiagnosis.isPending}
                className="bg-brand hover:bg-brand/90 flex-1 lg:flex-none"
              >
                {runDiagnosis.isPending ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />진단 중...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" />지금 진단하기</>
                )}
              </Button>
            </div>
          </div>

          {/* 핵심 지표 미니 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="px-4 py-3 rounded-xl bg-background/60 border border-border/50">
              <p className="text-[11px] text-muted-foreground mb-0.5">AI 인용 점수</p>
              <p className="text-xl font-bold text-foreground">{latestDiag?.totalScore ?? '-'}<span className="text-xs text-muted-foreground font-normal ml-0.5">점</span></p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-background/60 border border-border/50">
              <p className="text-[11px] text-muted-foreground mb-0.5">30일 방문자</p>
              <p className="text-xl font-bold text-foreground">{visitStats?.total ?? 0}<span className="text-xs text-muted-foreground font-normal ml-0.5">명</span></p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-background/60 border border-border/50">
              <p className="text-[11px] text-muted-foreground mb-0.5">AI 유입</p>
              <p className="text-xl font-bold text-brand">{visitStats?.channels?.filter((c: any) => c.channel?.startsWith('ai_')).reduce((s: number, r: any) => s + Number(r.count), 0) ?? 0}<span className="text-xs text-muted-foreground font-normal ml-0.5">건</span></p>
            </div>
            <div className={`px-4 py-3 rounded-xl border ${pendingCount > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background/60 border-border/50'}`}>
              <p className="text-[11px] text-muted-foreground mb-0.5">미응대 문의</p>
              <p className={`text-xl font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-foreground'}`}>{pendingCount}<span className="text-xs text-muted-foreground font-normal ml-0.5">건</span></p>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="w-full flex h-12 mb-6 overflow-x-auto bg-muted/60 border border-border/50 rounded-xl p-1 gap-1">
            <TabsTrigger value="report" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <FileText className="w-4 h-4 hidden sm:inline" />리포트
            </TabsTrigger>
            <TabsTrigger value="ai-exposure" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Zap className="w-4 h-4 hidden sm:inline" />AI 인용
            </TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Globe className="w-4 h-4 hidden sm:inline" />유입 분석
            </TabsTrigger>
            <TabsTrigger value="consultation" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 relative data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <MessageSquare className="w-4 h-4 hidden sm:inline" />상담 관리
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:relative sm:top-auto sm:right-auto ml-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hospital-info" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Settings className="w-4 h-4 hidden sm:inline" />병원 정보
            </TabsTrigger>
            <TabsTrigger value="diagnosis" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Stethoscope className="w-4 h-4 hidden sm:inline" />진단 보고서
            </TabsTrigger>
            <TabsTrigger value="consultation-stats" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <BarChart3 className="w-4 h-4 hidden sm:inline" />상담 현황
            </TabsTrigger>
            <TabsTrigger value="crm" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <ClipboardList className="w-4 h-4 hidden sm:inline" />CRM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-exposure">
            <InsightBanner
              icon={Zap}
              color="bg-brand/5 text-brand border border-brand/15"
              message={latestDiag ? `현재 AI 인용 점수 ${latestDiag.totalScore}점 (${latestDiag.grade}등급) — 진단 후 개선 추천을 확인하세요` : '아직 진단 이력이 없습니다. "지금 진단하기" 버튼을 눌러 AI 인용 현황을 확인하세요'}
            />
            <AiExposureTab dashData={dashData} runDiagnosis={runDiagnosis} />
          </TabsContent>

          <TabsContent value="traffic">
            <InsightBanner
              icon={Globe}
              color="bg-blue-500/5 text-blue-400 border border-blue-500/15"
              message={visitStats?.total ? `최근 30일간 ${visitStats.total}명 방문 — 채널별 유입 경로를 분석하고 마케팅 전략을 세워보세요` : '추적 코드를 설치하면 방문자 유입 채널이 자동으로 분석됩니다'}
            />
            <TrafficAnalysisTab hospitalId={profile.id} />
          </TabsContent>

          <TabsContent value="consultation">
            <InsightBanner
              icon={MessageSquare}
              color={pendingCount > 0 ? 'bg-amber-500/5 text-amber-400 border border-amber-500/15' : 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/15'}
              message={pendingCount > 0 ? `미응대 문의 ${pendingCount}건이 있습니다. 빠른 응대가 전환율을 높입니다!` : '모든 문의에 응대 완료! 상담 폼을 연동하면 문의가 자동으로 수집됩니다'}
            />
            <ConsultationTab />
          </TabsContent>

          <TabsContent value="report">
            <InsightBanner
              icon={FileText}
              color="bg-violet-500/5 text-violet-400 border border-violet-500/15"
              message="매월 AI가 성과를 분석하여 요약과 개선 추천을 제공합니다. 리포트를 생성해보세요!"
            />
            <MonthlyReportTab />
          </TabsContent>

          <TabsContent value="hospital-info">
            <HospitalInfoTab />
          </TabsContent>

          <TabsContent value="diagnosis">
            <DiagnosisTab />
          </TabsContent>

          <TabsContent value="consultation-stats">
            <ConsultationStatsTab />
          </TabsContent>

          <TabsContent value="crm">
            <CrmTab />
          </TabsContent>
        </Tabs>

        {/* CTA: 프로 플랜 업그레이드 */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-brand/15 via-brand/8 to-transparent border-brand/25 mt-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-brand/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Pro 플랜으로 업그레이드</h3>
                  <p className="text-sm text-muted-foreground mt-1">주간 자동 진단 · AI 모니터링 · 경쟁사 비교 · 맞춤 개선 리포트</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">자동 주간 진단</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">경쟁사 비교</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">맞춤 리포트</span>
                  </div>
                </div>
              </div>
              <Button
                className="bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20"
                onClick={() => toast.info("준비 중인 기능입니다. 상담을 통해 문의해주세요!")}
              >
                자세히 알아보기
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function MyHospital() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <DemoPreview />;
  }

  return <Dashboard />;
}

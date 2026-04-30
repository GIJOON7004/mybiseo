/**
 * SaaS 고객용 대시보드 — AI 마케팅 관리 도구
 * 4개 탭: AI 인용 현황 | 웹사이트 유입 분석 | 상담 문의 관리 | 월간 리포트
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
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
  Building2, TrendingUp, TrendingDown, Trophy, AlertTriangle, RefreshCw,
  BarChart3, Target, ArrowUpRight, ArrowDownRight, Minus, Shield, Zap,
  CheckCircle2, XCircle, Clock, ExternalLink, ChevronRight,
  Globe, MessageSquare, FileText, Users, Smartphone, Monitor, Tablet,
  Phone, Mail, Calendar, Eye, MousePointerClick, Copy, Code,
  Download, Plus, Loader2, Settings, ClipboardList, Stethoscope,
} from "lucide-react";

const SPECIALTIES = ["치과", "피부과", "성형외과", "한의원", "정형외과", "안과", "산부인과", "내과", "이비인후과", "비뇨기과", "종합병원"];
const REGIONS = ["서울 강남", "서울 서초", "서울 송파", "서울 마포", "서울 강서", "서울", "경기 성남", "경기 수원", "부산", "대구", "인천", "대전", "광주"];

// ─── 공통 컴포넌트 ──────────────────────────────────────────────

function GradeCircle({ score, grade, size = "lg" }: { score: number; grade: string; size?: "lg" | "sm" }) {
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

function ScoreChangeIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <span className="text-xs text-muted-foreground">첫 진단</span>;
  const diff = current - previous;
  if (diff > 0) return <span className="text-xs text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+{diff}점</span>;
  if (diff < 0) return <span className="text-xs text-red-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />{diff}점</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" />변동없음</span>;
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

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

// ═══════════════════════════════════════════════════════════════
// 탭 1: AI 인용 현황
// ═══════════════════════════════════════════════════════════════

function CompetitorPositionCard() {
  const { data, isLoading } = trpc.myHospitalExtended.getCompetitorPosition.useQuery();
  if (isLoading || !data) return null;
  const isAbove = data.aboveAverage;
  const color = isAbove ? "text-emerald-400" : "text-red-400";
  const bg = isAbove ? "bg-emerald-400/10 border-emerald-400/20" : "bg-red-400/10 border-red-400/20";
  return (
    <Card className={`${bg}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-brand" />
          같은 진료과 내 위치
        </CardTitle>
        <CardDescription>동일 진료과 병원 {data.specialtyCount}개 대비</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">내 점수</p>
            <p className={`text-2xl font-bold ${color}`}>{data.myScore}<span className="text-sm">점</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">진료과 평균</p>
            <p className="text-2xl font-bold text-foreground">{data.specialtyAvg}<span className="text-sm text-muted-foreground">점</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">평균 대비</p>
            <p className={`text-2xl font-bold ${color}`}>{data.scoreDiff > 0 ? "+" : ""}{data.scoreDiff}<span className="text-sm">점</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeasonalKeywordsCard() {
  const { data, isLoading } = trpc.myHospitalExtended.getMySeasonalKeywords.useQuery();
  const keywords = Array.isArray(data) ? data : (data as any)?.thisMonth ?? [];
  if (isLoading || !data || keywords.length === 0) return null;
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand" />
          이번 달 추천 키워드
        </CardTitle>
        <CardDescription>시즌별 마케팅 키워드 추천</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw: any, i: number) => (
            <span key={i} className="px-3 py-1.5 bg-brand/10 text-brand text-sm rounded-full border border-brand/20">
              {kw.keyword}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreComparisonCard() {
  const { data, isLoading } = trpc.myHospitalExtended.getScoreComparison.useQuery();
  if (isLoading || !data) return null;
  const improved = data.change > 0;
  const color = improved ? "text-emerald-400" : data.change < 0 ? "text-red-400" : "text-muted-foreground";
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand" />
          기간별 점수 변화
        </CardTitle>
        <CardDescription>최근 {data.months}개월 vs 이전 기간 비교</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">최근 평균</p>
            <p className="text-2xl font-bold text-foreground">{data.recentAvg}<span className="text-sm text-muted-foreground">점</span></p>
            <p className="text-[10px] text-muted-foreground">{data.recentCount}회 진단</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">이전 평균</p>
            <p className="text-2xl font-bold text-muted-foreground">{data.olderAvg}<span className="text-sm">점</span></p>
            <p className="text-[10px] text-muted-foreground">{data.olderCount}회 진단</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">변화</p>
            <p className={`text-2xl font-bold ${color}`}>{data.change > 0 ? "+" : ""}{data.change}<span className="text-sm">점</span></p>
            <p className="text-[10px] text-muted-foreground">{improved ? "개선 중" : data.change < 0 ? "하락 중" : "변동 없음"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AiExposureTab({ dashData, runDiagnosis }: { dashData: any; runDiagnosis: any }) {
  const utils = trpc.useUtils();
  const { data: improvements } = trpc.myHospital.improvements.useQuery();
  const { profile, history, ranking, myRank } = dashData;
  const latestDiag = history.length > 0 ? history[history.length - 1] : null;
  const prevDiag = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="space-y-6">
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 종합 점수 */}
        <Card className="bg-card border-border md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            {latestDiag ? (
              <>
                <GradeCircle score={latestDiag.totalScore} grade={latestDiag.grade} />
                <p className="text-sm text-muted-foreground mt-3">종합 점수</p>
                <ScoreChangeIndicator current={latestDiag.totalScore} previous={prevDiag?.totalScore} />
              </>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">진단 이력이 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1">"지금 진단하기" 버튼을 눌러주세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 인용 점수 */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4" />AI 인용 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestDiag ? (
              <>
                <div className="text-3xl font-bold text-foreground">{latestDiag.aiScore}<span className="text-lg text-muted-foreground">점</span></div>
                <ScoreChangeIndicator current={latestDiag.aiScore} previous={prevDiag?.aiScore} />
              </>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="text-2xl font-bold text-muted-foreground/40">--</div>
                <span className="text-[10px] text-muted-foreground mt-1">진단 후 표시</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 진료과 내 순위 */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />{profile.specialty || "전체"} 내 순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myRank ? (
              <>
                <div className="text-3xl font-bold text-foreground">
                  {myRank.rank}<span className="text-lg text-muted-foreground">위</span>
                  <span className="text-sm text-muted-foreground ml-1">/ {myRank.total}개</span>
                </div>
                <span className="text-xs text-brand">상위 {100 - myRank.percentile}%</span>
              </>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="text-2xl font-bold text-muted-foreground/40">--</div>
                <span className="text-[10px] text-muted-foreground mt-1">진단 후 표시</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 진단 횟수 */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />진단 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{history.length}<span className="text-lg text-muted-foreground">회</span></div>
            {latestDiag && (
              <span className="text-xs text-muted-foreground">
                최근: {new Date(latestDiag.diagnosedAt).toLocaleDateString("ko-KR")}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 점수 추이 차트 + 개선 추천 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" />AI 인용 점수 추이
            </CardTitle>
            <CardDescription>진단 이력 기반 점수 변화</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-1 h-40">
                  {history.slice(-12).map((h: any, i: number) => {
                    const maxScore = 100;
                    const height = Math.max(8, (h.totalScore / maxScore) * 100);
                    const color = h.totalScore >= 80 ? "bg-emerald-400" : h.totalScore >= 60 ? "bg-amber-400" : h.totalScore >= 40 ? "bg-orange-400" : "bg-red-400";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{h.totalScore}</span>
                        <div className={`w-full rounded-t ${color} transition-all`} style={{ height: `${height}%` }} title={`${new Date(h.diagnosedAt).toLocaleDateString("ko-KR")} - ${h.totalScore}점`} />
                        <span className="text-[9px] text-muted-foreground">{new Date(h.diagnosedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                진단 이력이 없습니다. "지금 진단하기"를 눌러주세요.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-brand" />개선 추천
            </CardTitle>
            <CardDescription>점수가 낮은 항목 우선</CardDescription>
          </CardHeader>
          <CardContent>
            {improvements && improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {item.percentage >= 70 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : item.percentage >= 40 ? <Clock className="w-5 h-5 text-amber-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{item.category}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full transition-all ${item.percentage >= 70 ? "bg-emerald-400" : item.percentage >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">진단 후 개선 추천이 표시됩니다</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 진료과 내 랭킹 */}
      {ranking && ranking.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand" />{profile.specialty || "전체"} 랭킹
            </CardTitle>
            <CardDescription>같은 진료과 병원 대비 순위</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ranking.slice(0, 10).map((r: any) => (
                <div key={r.url} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${r.isMe ? "bg-brand/10 border border-brand/20" : "bg-muted/30"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${r.rank === 1 ? "bg-amber-400/20 text-amber-400 ring-2 ring-amber-400/40" : r.rank === 2 ? "bg-gray-300/20 text-gray-300 ring-2 ring-gray-300/40" : r.rank === 3 ? "bg-orange-400/20 text-orange-400 ring-2 ring-orange-400/40" : "bg-muted text-muted-foreground"}`}>
                    {r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank-1] : r.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate ${r.isMe ? "text-brand" : "text-foreground"}`}>
                      {r.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      {r.isMe && <span className="ml-2 text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">내 병원</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{r.totalScore}점</div>
                      <div className="text-xs text-muted-foreground">AI: {r.aiScore}점</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 경쟁사 대비 + 시즌 키워드 + 점수 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CompetitorPositionCard />
        <SeasonalKeywordsCard />
        <ScoreComparisonCard />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 탭 2: 웹사이트 유입 분석
// ═══════════════════════════════════════════════════════════════

const CHANNEL_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  ai_chatgpt: { label: "ChatGPT", color: "bg-emerald-500", icon: "🤖" },
  ai_gemini: { label: "Gemini", color: "bg-blue-500", icon: "✨" },
  ai_claude: { label: "Claude", color: "bg-orange-500", icon: "🧠" },
  ai_perplexity: { label: "Perplexity", color: "bg-purple-500", icon: "🔍" },
  ai_copilot: { label: "Copilot", color: "bg-cyan-500", icon: "💡" },
  ai_other: { label: "기타 AI", color: "bg-teal-500", icon: "🤖" },
  naver: { label: "네이버", color: "bg-green-500", icon: "N" },
  google: { label: "구글", color: "bg-red-500", icon: "G" },
  sns_instagram: { label: "인스타그램", color: "bg-pink-500", icon: "📷" },
  sns_youtube: { label: "유튜브", color: "bg-red-600", icon: "▶" },
  sns_blog: { label: "블로그", color: "bg-lime-500", icon: "📝" },
  direct: { label: "직접 방문", color: "bg-gray-500", icon: "🔗" },
  referral: { label: "외부 링크", color: "bg-indigo-500", icon: "↗" },
  other: { label: "기타", color: "bg-slate-500", icon: "?" },
};

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
          <Users className="w-4 h-4 text-brand" />방문자 행동 퍼널 <span className="text-xs text-muted-foreground font-normal">최근 30일</span>
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
                {i < steps.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* 전체 전환율 */}
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

function TrafficAnalysisTab({ hospitalId }: { hospitalId: number }) {
  const [dateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  });

  const { data: visitStats, isLoading: statsLoading } = trpc.analytics.visitStats.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: topPages } = trpc.analytics.topPages.useQuery({
    from: dateRange.from,
    to: dateRange.to,
    limit: 5,
  });

  const { data: dailyTrend } = trpc.analytics.dailyTrend.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: deviceStats } = trpc.analytics.deviceStats.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: aiDetail } = trpc.analytics.aiChannelDetail.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { data: hourlyData } = trpc.analytics.hourlyDistribution.useQuery({
    from: dateRange.from,
    to: dateRange.to,
  });

  const hasData = visitStats && visitStats.total > 0;

  // AI 채널 합산
  const aiChannels = useMemo(() => {
    if (!visitStats?.channels) return { total: 0, unique: 0 };
    const aiRows = visitStats.channels.filter((c: any) => c.channel?.startsWith("ai_"));
    return {
      total: aiRows.reduce((s: number, r: any) => s + Number(r.count), 0),
      unique: aiRows.reduce((s: number, r: any) => s + Number(r.uniqueVisitors), 0),
    };
  }, [visitStats]);

  // 디바이스 합산
  const deviceTotal = useMemo(() => {
    if (!deviceStats) return 0;
    return deviceStats.reduce((s: number, d: any) => s + Number(d.count), 0);
  }, [deviceStats]);

  // 추적 코드 스니펫
  const trackingCode = `<script src="https://mybiseo.com/track.js" data-hospital-id="${hospitalId}"></script>`;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 추적 코드 설치 안내 (데이터 없을 때) */}
      {!hasData && (
        <Card className="bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-brand" />
              추적 코드 설치 안내
            </CardTitle>
            <CardDescription>
              아래 3단계를 따라하면 방문자 유입 채널이 자동으로 분석됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span className="text-sm text-foreground">아래 코드를 복사하세요</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-sm text-foreground">병원 웹사이트의 &lt;head&gt; 태그 안에 붙여넣기</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span className="text-sm text-foreground">설치 후 이 페이지에서 실시간 데이터 확인</span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-4 font-mono text-sm text-foreground border border-border relative">
              <code>{trackingCode}</code>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(trackingCode);
                  toast.success("추적 코드가 복사되었습니다!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-4 h-4" />총 방문수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visitStats?.total ?? 0}</div>
            <span className="text-xs text-muted-foreground">최근 30일</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" />순 방문자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visitStats?.uniqueVisitors ?? 0}</div>
            <span className="text-xs text-muted-foreground">최근 30일</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4" />AI 채널 유입
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{aiChannels.total}</div>
            <span className="text-xs text-muted-foreground">
              {visitStats?.total ? `전체의 ${Math.round((aiChannels.total / visitStats.total) * 100)}%` : "최근 30일"}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4" />채널 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{visitStats?.channels?.length ?? 0}</div>
            <span className="text-xs text-muted-foreground">활성 유입 채널</span>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 유입 + AI 채널 상세 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" />채널별 유입 분석
            </CardTitle>
            <CardDescription>방문자가 어디서 오는지 한눈에 확인</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="space-y-3">
                {(visitStats?.channels ?? [])
                  .sort((a: any, b: any) => Number(b.count) - Number(a.count))
                  .map((ch: any) => {
                    const info = CHANNEL_LABELS[ch.channel] || { label: ch.channel, color: "bg-gray-500", icon: "?" };
                    const pct = visitStats?.total ? Math.round((Number(ch.count) / visitStats.total) * 100) : 0;
                    return (
                      <div key={ch.channel} className="flex items-center gap-3">
                        <span className="text-lg w-6 text-center">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{info.label}</span>
                            <span className="text-xs text-muted-foreground">{ch.count}회 ({pct}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${info.color} transition-all`} style={{ width: `${Math.max(pct, 3)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EnhancedEmptyState icon={BarChart3} title="아직 유입 데이터가 없습니다" description="추적 코드를 설치하면 방문자 유입 채널이 자동으로 분석됩니다" steps={['추적 코드 복사', '웹사이트에 설치', '유입 데이터 자동 수집']} />
            )}
          </CardContent>
        </Card>

        {/* AI 채널 상세 분석 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand" />AI 채널 상세 분석
            </CardTitle>
            <CardDescription>AI 검색 엔진별 유입 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {aiDetail && aiDetail.length > 0 ? (
              <div className="space-y-4">
                {aiDetail.map((ai: any) => {
                  const info = CHANNEL_LABELS[ai.channel] || { label: ai.channel, icon: "🤖" };
                  return (
                    <div key={ai.channel} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{info.label}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">방문 <span className="font-bold text-foreground">{ai.count}</span>회</span>
                          <span className="text-xs text-muted-foreground">순방문자 <span className="font-bold text-foreground">{ai.uniqueVisitors}</span>명</span>
                          <span className="text-xs text-muted-foreground">평균체류 <span className="font-bold text-foreground">{Math.round(Number(ai.avgDuration))}</span>초</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={Zap} title="AI 채널 유입 데이터가 없습니다" description="ChatGPT, Gemini, Claude 등에서 병원이 추천되면 여기에 표시됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 인기 페이지 TOP 5 + 디바이스별 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-brand" />인기 페이지 TOP 5
            </CardTitle>
            <CardDescription>가장 많이 방문한 페이지</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages && topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? "bg-brand text-background" : "text-muted-foreground bg-muted"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.pageTitle || p.pageUrl}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.pageUrl}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{p.views}</p>
                      <p className="text-[10px] text-muted-foreground">{p.uniqueVisitors}명</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EnhancedEmptyState icon={Eye} title="페이지 데이터가 없습니다" description="추적 코드 설치 후 데이터가 수집됩니다" />
            )}
          </CardContent>
        </Card>

        {/* 디바이스별 방문 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-brand" />디바이스별 방문
            </CardTitle>
            <CardDescription>모바일 vs 데스크톱 vs 태블릿</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceStats && deviceStats.length > 0 ? (
              <div className="space-y-4">
                {deviceStats.map((d: any) => {
                  const pct = deviceTotal > 0 ? Math.round((Number(d.count) / deviceTotal) * 100) : 0;
                  const deviceInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
                    mobile: { label: "모바일", icon: <Smartphone className="w-5 h-5" />, color: "bg-blue-500" },
                    desktop: { label: "데스크톱", icon: <Monitor className="w-5 h-5" />, color: "bg-emerald-500" },
                    tablet: { label: "태블릿", icon: <Tablet className="w-5 h-5" />, color: "bg-purple-500" },
                  };
                  const info = deviceInfo[d.deviceType] || { label: d.deviceType, icon: <Monitor className="w-5 h-5" />, color: "bg-gray-500" };
                  return (
                    <div key={d.deviceType} className="flex items-center gap-3">
                      <div className="text-muted-foreground">{info.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{info.label}</span>
                          <span className="text-xs text-muted-foreground">{d.count}회 ({pct}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${info.color} transition-all`} style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={Smartphone} title="디바이스 데이터가 없습니다" description="추적 코드 설치 후 데이터가 수집됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 일별 방문 추이 + 시간대별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" />일별 방문 추이
            </CardTitle>
            <CardDescription>최근 30일 일별 방문자 수</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyTrend && dailyTrend.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-[2px] h-32">
                  {dailyTrend.map((d: any, i: number) => {
                    const maxVal = Math.max(...dailyTrend.map((x: any) => Number(x.total)), 1);
                    const height = Math.max(4, (Number(d.total) / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.total}회 방문`}>
                        <div className="w-full rounded-t bg-brand/70 hover:bg-brand transition-all" style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{dailyTrend[0]?.date}</span>
                  <span>{dailyTrend[dailyTrend.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <EnhancedEmptyState icon={TrendingUp} title="추이 데이터가 없습니다" description="추적 코드 설치 후 일별 추이가 표시됩니다" />
            )}
          </CardContent>
        </Card>

        {/* 시간대별 방문 분포 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand" />시간대별 방문 분포
            </CardTitle>
            <CardDescription>환자들이 언제 방문하는지 확인</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyData && hourlyData.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-[2px] h-32">
                  {Array.from({ length: 24 }, (_, h) => {
                    const found = hourlyData.find((d: any) => Number(d.hour) === h);
                    const count = found ? Number(found.count) : 0;
                    const maxVal = Math.max(...hourlyData.map((x: any) => Number(x.count)), 1);
                    const height = count > 0 ? Math.max(4, (count / maxVal) * 100) : 2;
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center" title={`${h}시: ${count}회`}>
                        <div className={`w-full rounded-t transition-all ${count > 0 ? "bg-brand/70 hover:bg-brand" : "bg-muted/30"}`} style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0시</span>
                  <span>6시</span>
                  <span>12시</span>
                  <span>18시</span>
                  <span>24시</span>
                </div>
              </div>
            ) : (
              <EnhancedEmptyState icon={Clock} title="시간대 데이터가 없습니다" description="추적 코드 설치 후 데이터가 수집됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 방문자 행동 퍼널 */}
      <VisitorFunnelCard />

      {/* 추적 코드 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4 text-brand" />추적 코드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs text-foreground relative">
            <code>{trackingCode}</code>
            <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(trackingCode); toast.success("복사됨!"); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 탭 3: 상담 문의 관리
// ═══════════════════════════════════════════════════════════════

function ConsultationTab() {
  const { data: consultations, isLoading } = trpc.analytics.consultations.useQuery();
  const { data: consultStats } = trpc.analytics.consultationStats.useQuery();
  const { data: channelStats } = trpc.analytics.consultationByChannel.useQuery();
  const { data: monthlyTrend } = trpc.analytics.consultationMonthlyTrend.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.analytics.updateConsultation.useMutation({
    onSuccess: () => {
      toast.success("상태가 업데이트되었습니다");
      utils.analytics.consultations.invalidate();
      utils.analytics.consultationStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "대기", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    contacted: { label: "연락완료", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    completed: { label: "완료", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "취소", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredConsultations = statusFilter === "all"
    ? consultations ?? []
    : (consultations ?? []).filter((c: any) => c.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />총 문의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{consultStats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />대기 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{consultStats?.pending ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "contacted" ? "all" : "contacted")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4" />연락완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{consultStats?.contacted ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{consultStats?.completed ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand flex items-center gap-1.5">
              <Target className="w-4 h-4" />전환율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{consultStats?.conversionRate ?? "0%"}</div>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 문의 + 월별 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" />채널별 문의 분포
            </CardTitle>
            <CardDescription>어떤 채널에서 상담 문의가 많은지 확인</CardDescription>
          </CardHeader>
          <CardContent>
            {channelStats && channelStats.length > 0 ? (
              <div className="space-y-3">
                {channelStats.map((ch: any) => {
                  const info = CHANNEL_LABELS[ch.channel] || { label: ch.channel || "직접", icon: "?" };
                  const total = channelStats.reduce((s: number, c: any) => s + Number(c.count), 0);
                  const pct = total > 0 ? Math.round((Number(ch.count) / total) * 100) : 0;
                  return (
                    <div key={ch.channel || "direct"} className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{info.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{info.label}</span>
                          <span className="text-xs text-muted-foreground">{ch.count}건 ({pct}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={BarChart3} title="채널 데이터가 없습니다" description="상담 문의가 접수되면 채널별 분포가 표시됩니다" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />월별 상담 추이
            </CardTitle>
            <CardDescription>최근 6개월 상담 문의 및 전환 추이</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrend && monthlyTrend.length > 0 ? (
              <div className="space-y-3">
                {monthlyTrend.map((m: any) => {
                  const total = Number(m.total);
                  const completed = Number(m.completed);
                  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div key={m.yearMonth} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium text-muted-foreground w-16">{m.yearMonth}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">문의 <span className="font-bold">{total}</span>건</span>
                          <span className="text-xs text-brand">전환율 {rate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EnhancedEmptyState icon={Calendar} title="월별 데이터가 없습니다" description="상담 문의가 접수되면 월별 추이가 표시됩니다" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 문의 목록 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand" />상담 문의 목록
                {statusFilter !== "all" && <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">{statusLabels[statusFilter]?.label} 필터</span>}
              </CardTitle>
              <CardDescription>웹사이트에서 접수된 상담 문의를 관리합니다</CardDescription>
            </div>
            {statusFilter !== "all" && (
              <Button size="sm" variant="ghost" onClick={() => setStatusFilter("all")} className="text-xs">
                필터 해제
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredConsultations.length > 0 ? (
            <div className="space-y-3">
              {filteredConsultations.map((c: any) => {
                const st = statusLabels[c.status] || statusLabels.pending;
                return (
                  <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                        {c.treatmentType && <span className="text-xs text-muted-foreground">{c.treatmentType}</span>}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {c.patientName || "이름 미입력"}
                        {c.patientPhone && <span className="text-muted-foreground ml-2">{c.patientPhone}</span>}
                        {c.patientEmail && <span className="text-muted-foreground ml-2"><Mail className="w-3 h-3 inline" /> {c.patientEmail}</span>}
                      </p>
                      {c.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(c.createdAt).toLocaleString("ko-KR")}
                        {c.channel && <span className="ml-2">채널: {CHANNEL_LABELS[c.channel]?.label || c.channel}</span>}
                        {c.contactedAt && <span className="ml-2 text-blue-400">연락: {new Date(c.contactedAt).toLocaleDateString("ko-KR")}</span>}
                      </p>
                      {c.note && <p className="text-xs text-muted-foreground mt-1 italic">메모: {c.note}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {c.status === "pending" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "contacted" })} disabled={updateStatus.isPending}>
                          연락완료
                        </Button>
                      )}
                      {c.status === "contacted" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "completed" })} disabled={updateStatus.isPending}>
                          상담완료
                        </Button>
                      )}
                      {(c.status === "pending" || c.status === "contacted") && (
                        <Button size="sm" variant="ghost" className="text-xs text-red-400" onClick={() => updateStatus.mutate({ id: c.id, status: "cancelled" })} disabled={updateStatus.isPending}>
                          취소
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EnhancedEmptyState
              icon={MessageSquare}
              title={statusFilter !== "all" ? `${statusLabels[statusFilter]?.label} 상태의 문의가 없습니다` : "아직 상담 문의가 없습니다"}
              description="추적 코드를 설치하고 상담 폼을 연동하면 문의가 자동으로 수집됩니다"
              steps={['추적 코드 설치', '상담 폼 연동', '문의 자동 수집 시작']}
            />
          )}
        </CardContent>
      </Card>

      {/* 상담 폼 연동 안내 */}
      <Card className="bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-5 h-5 text-brand" />
            상담 폼 연동 안내
          </CardTitle>
          <CardDescription>병원 웹사이트의 상담 폼에 아래 코드를 추가하면 문의가 자동으로 수집됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg p-4 font-mono text-xs text-foreground border border-border">
            <pre className="whitespace-pre-wrap">{`// 상담 폼 제출 시 호출
fetch('https://mybiseo.com/api/trpc/tracking.inquiry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    json: {
      hospitalId: YOUR_HOSPITAL_ID,
      patientName: '환자명',
      patientPhone: '010-1234-5678',
      treatmentType: '상담 유형',
      message: '문의 내용',
      channel: window.__mybiseo_channel || 'direct'
    }
  })
});`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 탭 4: 월간 리포트
// ═══════════════════════════════════════════════════════════════

function ReportPdfButton({ reportId }: { reportId: number }) {
  const utils = trpc.useUtils();
  const generatePdf = trpc.monthlyReport.generatePdf.useMutation({
    onSuccess: () => {
      toast.success("리포트가 생성되었습니다!");
      utils.analytics.monthlyReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => generatePdf.mutate({ reportId })}
      disabled={generatePdf.isPending}
      className="gap-2"
    >
      {generatePdf.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      리포트 생성
    </Button>
  );
}

function ReportShareButton({ reportId, shareToken }: { reportId: number; shareToken?: string | null }) {
  const utils = trpc.useUtils();
  const createShare = trpc.monthlyReport.createShareLink.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/report/${data.token}`;
      navigator.clipboard.writeText(url);
      toast.success("공유 링크가 클립보드에 복사되었습니다!");
      utils.analytics.monthlyReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleShare = () => {
    if (shareToken) {
      const url = `${window.location.origin}/report/${shareToken}`;
      navigator.clipboard.writeText(url);
      toast.success("공유 링크가 클립보드에 복사되었습니다!");
    } else {
      createShare.mutate({ reportId });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={createShare.isPending}
      className="gap-2"
    >
      {createShare.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
      {shareToken ? "공유 링크 복사" : "공유 링크 생성"}
    </Button>
  );
}

function MonthlyReportTab() {
  const { data: reports, isLoading } = trpc.analytics.monthlyReports.useQuery();
  const utils = trpc.useUtils();
  const generateReport = trpc.analytics.generateMonthlyReport.useMutation({
    onSuccess: () => {
      toast.success("월간 리포트가 생성되었습니다!");
      utils.analytics.monthlyReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 지난달 리포트 생성 함수
  const handleGenerateLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    generateReport.mutate({ year: lastMonth.getFullYear(), month: lastMonth.getMonth() + 1 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 리포트 생성 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">월간 성과 리포트</h3>
          <p className="text-sm text-muted-foreground">매월 성과를 AI가 분석하여 요약과 개선 추천을 제공합니다</p>
        </div>
        <Button
          onClick={handleGenerateLastMonth}
          disabled={generateReport.isPending}
          className="bg-brand hover:bg-brand/90"
        >
          {generateReport.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />생성 중...</>
          ) : (
            <><Plus className="w-4 h-4 mr-2" />지난달 리포트 생성</>
          )}
        </Button>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((r: any) => {
            const isExpanded = expandedId === r.id;
            const totalChannelVisits = (r.aiChannelVisits ?? 0) + (r.naverVisits ?? 0) + (r.googleVisits ?? 0) + (r.snsVisits ?? 0) + (r.directVisits ?? 0);
            return (
              <Card key={r.id} className={`bg-card border-border transition-all ${isExpanded ? "ring-1 ring-brand/30" : ""}`}>
                {/* 요약 헤더 (클릭으로 토글) */}
                <CardHeader className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{r.year}년 {r.month}월 리포트</CardTitle>
                        <CardDescription>{new Date(r.createdAt).toLocaleDateString("ko-KR")} 생성</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">방문 <span className="font-bold text-foreground">{r.totalVisits ?? 0}</span></span>
                        <span className="text-muted-foreground">문의 <span className="font-bold text-foreground">{r.totalInquiries ?? 0}</span></span>
                        {r.seoScore != null && <span className="text-muted-foreground">AI검색 <span className="font-bold text-foreground">{r.seoScore}</span></span>}
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </CardHeader>

                {/* 상세 내용 */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t border-border pt-4 space-y-4">
                      {/* 점수 카드 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">AI 검색 점수</p>
                          <p className="text-xl font-bold text-foreground">{r.seoScore ?? "-"}</p>
                          {r.seoScoreChange != null && (
                            <p className={`text-xs ${r.seoScoreChange > 0 ? "text-emerald-400" : r.seoScoreChange < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {r.seoScoreChange > 0 ? "+" : ""}{r.seoScoreChange}점
                            </p>
                          )}
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">AI 인용 점수</p>
                          <p className="text-xl font-bold text-brand">{r.aiExposureScore ?? "-"}</p>
                          {r.aiExposureChange != null && (
                            <p className={`text-xs ${r.aiExposureChange > 0 ? "text-emerald-400" : r.aiExposureChange < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {r.aiExposureChange > 0 ? "+" : ""}{r.aiExposureChange}점
                            </p>
                          )}
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">총 방문수</p>
                          <p className="text-xl font-bold text-foreground">{r.totalVisits ?? 0}</p>
                          <p className="text-xs text-muted-foreground">AI: {r.aiChannelVisits ?? 0}</p>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">상담 문의</p>
                          <p className="text-xl font-bold text-foreground">{r.totalInquiries ?? 0}</p>
                          {r.conversionRate && <p className="text-xs text-brand">전환율 {r.conversionRate}</p>}
                        </div>
                      </div>

                      {/* 채널별 방문 분포 바 */}
                      {totalChannelVisits > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">채널별 방문 분포</p>
                          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                            {[
                              { value: r.aiChannelVisits ?? 0, color: "bg-brand" },
                              { value: r.naverVisits ?? 0, color: "bg-green-500" },
                              { value: r.googleVisits ?? 0, color: "bg-red-500" },
                              { value: r.snsVisits ?? 0, color: "bg-pink-500" },
                              { value: r.directVisits ?? 0, color: "bg-gray-500" },
                            ].filter(s => s.value > 0).map((s, i) => (
                              <div key={i} className={`${s.color} transition-all`} style={{ width: `${(s.value / totalChannelVisits) * 100}%` }} />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {[
                              { label: "AI", value: r.aiChannelVisits, color: "bg-brand" },
                              { label: "네이버", value: r.naverVisits, color: "bg-green-500" },
                              { label: "구글", value: r.googleVisits, color: "bg-red-500" },
                              { label: "SNS", value: r.snsVisits, color: "bg-pink-500" },
                              { label: "직접", value: r.directVisits, color: "bg-gray-500" },
                            ].filter(s => (s.value ?? 0) > 0).map((item) => (
                              <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className="text-xs text-muted-foreground">{item.label} {item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI 요약 및 추천 */}
                      {r.summary && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Zap className="w-3 h-3" />AI 분석 요약
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-line">{r.summary}</p>
                        </div>
                      )}
                      {r.recommendations && (
                        <div className="bg-brand/5 rounded-lg p-4 border border-brand/10">
                          <p className="text-xs font-medium text-brand mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" />개선 추천 사항
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-line">{r.recommendations}</p>
                        </div>
                      )}

                      {/* PDF 다운로드 + 공유 링크 */}
                      <div className="flex flex-wrap gap-3">
                        {r.pdfUrl ? (
                          <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-sm font-medium">
                            <Download className="w-4 h-4" />리포트 보기
                          </a>
                        ) : (
                          <ReportPdfButton reportId={r.id} />
                        )}
                        <ReportShareButton reportId={r.id} shareToken={r.shareToken} />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <EnhancedEmptyState
              icon={FileText}
              title="아직 월간 리포트가 없습니다"
              description="월간 리포트는 매월 자동 생성되거나, 직접 생성할 수 있습니다"
              steps={['"지난달 리포트 생성" 버튼 클릭', 'AI가 성과 분석 및 요약', '리포트 확인 및 PDF 다운로드']}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 메인 대시보드 (탭 구조)
// ═══════════════════════════════════════════════════════════════

// ─── 인사이트 배너 ──────────────────────────────────────────────
function InsightBanner({ icon: Icon, color, message }: { icon: any; color: string; message: string }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${color} mb-6`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── 개선된 빈 상태 ──────────────────────────────────────────────
function EnhancedEmptyState({ icon: Icon, title, description, steps }: { icon: any; title: string; description: string; steps?: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 flex items-center justify-center mb-6 relative">
        <Icon className="w-9 h-9 text-brand" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      {steps && steps.length > 0 && (
        <div className="flex flex-col gap-2 text-left max-w-sm w-full">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 데모 미리보기 (로그인 전 방문자용)
// ═══════════════════════════════════════════════════════════════

const DEMO_HISTORY = [
  { totalScore: 38, aiScore: 25, portalScore: 42, grade: "F", diagnosedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { totalScore: 45, aiScore: 32, portalScore: 48, grade: "D", diagnosedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { totalScore: 52, aiScore: 41, portalScore: 55, grade: "D", diagnosedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { totalScore: 61, aiScore: 55, portalScore: 63, grade: "C", diagnosedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { totalScore: 72, aiScore: 68, portalScore: 74, grade: "B", diagnosedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const DEMO_CHANNELS = [
  { channel: "naver", count: 342, uniqueVisitors: 280 },
  { channel: "google", count: 187, uniqueVisitors: 156 },
  { channel: "ai_chatgpt", count: 89, uniqueVisitors: 78 },
  { channel: "ai_gemini", count: 45, uniqueVisitors: 38 },
  { channel: "ai_perplexity", count: 23, uniqueVisitors: 20 },
  { channel: "sns_instagram", count: 56, uniqueVisitors: 48 },
  { channel: "direct", count: 134, uniqueVisitors: 112 },
];

const DEMO_IMPROVEMENTS = [
  { category: "AI 크롤러 허용", percentage: 90 },
  { category: "구조화 데이터", percentage: 45 },
  { category: "메타 태그 최적화", percentage: 60 },
  { category: "모바일 최적화", percentage: 75 },
  { category: "FAQ 스키마", percentage: 20 },
];

const DEMO_CONSULT_STATS = { total: 47, pending: 5, contacted: 12, completed: 28, cancelled: 2, conversionRate: "59.6%" };

function DemoPreview() {
  const latestDiag = DEMO_HISTORY[DEMO_HISTORY.length - 1];
  const prevDiag = DEMO_HISTORY[DEMO_HISTORY.length - 2];
  const totalVisits = DEMO_CHANNELS.reduce((s, c) => s + c.count, 0);
  const aiVisits = DEMO_CHANNELS.filter(c => c.channel.startsWith("ai_")).reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-6xl mx-auto px-4">
        {/* 데모 안내 배너 — 세련된 글래스모피즘 */}
        <div className="relative mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-brand/8 via-brand/4 to-violet-500/6 border border-brand/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/25 flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">미리보기 모드</h2>
                  <span className="text-[9px] font-semibold bg-yellow-400/15 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/20">SAMPLE</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">실제 고객사 성과 기반 샘플 · 로그인하면 내 병원 데이터로 전환됩니다</p>
              </div>
            </div>
            <a
              href={getLoginUrl()}
              className="flex-shrink-0 px-5 py-2 rounded-lg bg-brand text-background text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-brand/25"
            >
              내 병원으로 시작
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 웰컴 헤더 (데모) — 프리미엄 카드 디자인 */}
        <div className="rounded-2xl bg-gradient-to-br from-card via-card/90 to-brand/5 border border-border/80 p-5 sm:p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/15 to-brand/5 border border-brand/25 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="w-7 h-7 text-brand" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">서울미래치과의원</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">치과</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">서울 강남</span>
                    <span className="text-[11px] text-brand font-medium">seoul-future-dental.com</span>
                  </div>
                </div>
              </div>
              <Button
                className="bg-brand/80 hover:bg-brand/90 cursor-not-allowed opacity-60 text-sm"
                disabled
                size="sm"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />진단하기
              </Button>
            </div>

            {/* 핵심 지표 — 그라데이션 미니 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-background/80 to-background/40 border border-border/60 backdrop-blur-sm">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">AI 인용 점수</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{latestDiag.totalScore}</p>
                  <span className="text-xs text-muted-foreground">점</span>
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-background/80 to-background/40 border border-border/60 backdrop-blur-sm">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">30일 방문자</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{totalVisits}</p>
                  <span className="text-xs text-muted-foreground">명</span>
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-brand/5 to-background/40 border border-brand/15 backdrop-blur-sm">
                <p className="text-[10px] text-brand/70 mb-1 uppercase tracking-wider">AI 유입</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-brand tabular-nums">{aiVisits}</p>
                  <span className="text-xs text-muted-foreground">건</span>
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-amber-500/8 to-background/40 border border-amber-500/20 backdrop-blur-sm">
                <p className="text-[10px] text-amber-400/70 mb-1 uppercase tracking-wider">미응대 문의</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-amber-400 tabular-nums">{DEMO_CONSULT_STATS.pending}</p>
                  <span className="text-xs text-muted-foreground">건</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 구조 (데모) — 리포트 우선 */}
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-12 mb-6 bg-muted/60 border border-border/50 rounded-xl p-1">
            <TabsTrigger value="report" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <FileText className="w-4 h-4 hidden sm:inline" />
              리포트
            </TabsTrigger>
            <TabsTrigger value="ai-exposure" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <Zap className="w-4 h-4 hidden sm:inline" />
              AI 인용
            </TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <Globe className="w-4 h-4 hidden sm:inline" />
              유입 분석
            </TabsTrigger>
            <TabsTrigger value="consultation" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 relative data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <MessageSquare className="w-4 h-4 hidden sm:inline" />
              상담 관리
              <span className="absolute -top-1 -right-1 sm:relative sm:top-auto sm:right-auto ml-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {DEMO_CONSULT_STATS.pending}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* 탭 1: AI 인용 현황 (데모) */}
          <TabsContent value="ai-exposure">
            <InsightBanner
              icon={Zap}
              color="bg-brand/5 text-brand border border-brand/15"
              message={`현재 AI 인용 점수 ${latestDiag.totalScore}점 (${latestDiag.grade}등급) — 3개월 만에 38점→72점으로 개선된 사례입니다`}
            />
            <div className="space-y-6">
              {/* 요약 카드 4개 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border md:col-span-1">
                  <CardContent className="pt-6 flex flex-col items-center">
                    <GradeCircle score={latestDiag.totalScore} grade={latestDiag.grade} />
                    <p className="text-sm text-muted-foreground mt-3">종합 점수</p>
                    <ScoreChangeIndicator current={latestDiag.totalScore} previous={prevDiag?.totalScore} />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />AI 인용 점수
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{latestDiag.aiScore}<span className="text-lg text-muted-foreground">점</span></div>
                    <ScoreChangeIndicator current={latestDiag.aiScore} previous={prevDiag?.aiScore} />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" />치과 내 순위
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">7<span className="text-lg text-muted-foreground">위</span><span className="text-sm text-muted-foreground ml-1">/ 45개</span></div>
                    <span className="text-xs text-brand">상위 16%</span>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4" />진단 이력
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{DEMO_HISTORY.length}<span className="text-lg text-muted-foreground">회</span></div>
                    <span className="text-xs text-muted-foreground">최근: {new Date(latestDiag.diagnosedAt).toLocaleDateString("ko-KR")}</span>
                  </CardContent>
                </Card>
              </div>

              {/* 점수 추이 + 개선 추천 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card border-border lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-brand" />AI 인용 점수 추이
                    </CardTitle>
                    <CardDescription>3개월간 점수 변화 (샘플)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-40">
                      {DEMO_HISTORY.map((h, i) => {
                        const height = Math.max(8, (h.totalScore / 100) * 100);
                        const color = h.totalScore >= 80 ? "bg-emerald-400" : h.totalScore >= 60 ? "bg-amber-400" : h.totalScore >= 40 ? "bg-orange-400" : "bg-red-400";
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{h.totalScore}</span>
                            <div className={`w-full rounded-t ${color} transition-all`} style={{ height: `${height}%` }} />
                            <span className="text-[9px] text-muted-foreground">{new Date(h.diagnosedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5 text-brand" />개선 추천
                    </CardTitle>
                    <CardDescription>점수가 낮은 항목 우선</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {DEMO_IMPROVEMENTS.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {item.percentage >= 70 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : item.percentage >= 40 ? <Clock className="w-5 h-5 text-amber-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground truncate">{item.category}</span>
                              <span className="text-xs text-muted-foreground ml-2">{item.percentage}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                              <div className={`h-1.5 rounded-full transition-all ${item.percentage >= 70 ? "bg-emerald-400" : item.percentage >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${item.percentage}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 탭 2: 유입 분석 (데모) */}
          <TabsContent value="traffic">
            <InsightBanner
              icon={Globe}
              color="bg-blue-500/5 text-blue-400 border border-blue-500/15"
              message={`최근 30일간 ${totalVisits}명 방문 — AI 채널에서 ${aiVisits}건 유입 (샘플 데이터)`}
            />
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Eye className="w-4 h-4" />총 방문수</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-foreground">{totalVisits}</div><span className="text-xs text-muted-foreground">최근 30일</span></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Users className="w-4 h-4" />순 방문자</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-foreground">{DEMO_CHANNELS.reduce((s, c) => s + c.uniqueVisitors, 0)}</div><span className="text-xs text-muted-foreground">최근 30일</span></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Zap className="w-4 h-4" />AI 채널 유입</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-brand">{aiVisits}</div><span className="text-xs text-muted-foreground">전체의 {Math.round((aiVisits / totalVisits) * 100)}%</span></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Globe className="w-4 h-4" />채널 수</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-foreground">{DEMO_CHANNELS.length}</div><span className="text-xs text-muted-foreground">활성 유입 채널</span></CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand" />채널별 유입 분석</CardTitle>
                  <CardDescription>방문자가 어디서 오는지 한눈에 확인 (샘플)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DEMO_CHANNELS.sort((a, b) => b.count - a.count).map((ch) => {
                      const info = CHANNEL_LABELS[ch.channel] || { label: ch.channel, color: "bg-gray-500", icon: "?" };
                      const pct = Math.round((ch.count / totalVisits) * 100);
                      return (
                        <div key={ch.channel} className="flex items-center gap-3">
                          <span className="text-lg w-6 text-center">{info.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{info.label}</span>
                              <span className="text-xs text-muted-foreground">{ch.count}회 ({pct}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className={`h-2 rounded-full ${info.color} transition-all`} style={{ width: `${Math.max(pct, 3)}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 탭 3: 상담 관리 (데모) */}
          <TabsContent value="consultation">
            <InsightBanner
              icon={MessageSquare}
              color="bg-amber-500/5 text-amber-400 border border-amber-500/15"
              message={`미응대 문의 ${DEMO_CONSULT_STATS.pending}건이 있습니다. 빠른 응대가 전환율을 높입니다! (샘플)`}
            />
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><MessageSquare className="w-4 h-4" />총 문의</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-foreground">{DEMO_CONSULT_STATS.total}</div></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-1.5"><Clock className="w-4 h-4" />대기 중</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-amber-400">{DEMO_CONSULT_STATS.pending}</div></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-1.5"><Phone className="w-4 h-4" />연락완료</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-blue-400">{DEMO_CONSULT_STATS.contacted}</div></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />완료</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-emerald-400">{DEMO_CONSULT_STATS.completed}</div></CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-brand flex items-center gap-1.5"><Target className="w-4 h-4" />전환율</CardTitle></CardHeader>
                  <CardContent><div className="text-3xl font-bold text-brand">{DEMO_CONSULT_STATS.conversionRate}</div></CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-brand" />최근 상담 문의 (샘플)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "김**", phone: "010-****-3456", type: "임플란트 상담", status: "pending", date: "2일 전", channel: "ai_chatgpt" },
                      { name: "이**", phone: "010-****-7890", type: "치아교정 비용", status: "contacted", date: "3일 전", channel: "naver" },
                      { name: "박**", phone: "010-****-1234", type: "충치 치료", status: "completed", date: "5일 전", channel: "google" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              c.status === "pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                              c.status === "contacted" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                              "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}>
                              {c.status === "pending" ? "대기" : c.status === "contacted" ? "연락완료" : "완료"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.type} · {c.date} · {CHANNEL_LABELS[c.channel]?.label || c.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 탭 4: 리포트 (데모) */}
          <TabsContent value="report">
            <InsightBanner
              icon={FileText}
              color="bg-violet-500/5 text-violet-400 border border-violet-500/15"
              message="매월 AI가 성과를 분석하여 요약과 개선 추천을 제공합니다 (샘플)"
            />
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <CardTitle className="text-base">2026년 2월 리포트</CardTitle>
                        <CardDescription>2026. 3. 1. 생성</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">방문 <span className="font-bold text-foreground">876</span></span>
                      <span className="text-muted-foreground">문의 <span className="font-bold text-foreground">47</span></span>
                      <span className="text-muted-foreground">AI검색 <span className="font-bold text-foreground">72</span></span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">AI 검색 점수</p>
                        <p className="text-xl font-bold text-foreground">72</p>
                        <p className="text-xs text-emerald-400">+11점</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">AI 인용 점수</p>
                        <p className="text-xl font-bold text-brand">68</p>
                        <p className="text-xs text-emerald-400">+13점</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">총 방문수</p>
                        <p className="text-xl font-bold text-foreground">876</p>
                        <p className="text-xs text-muted-foreground">AI: 157</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">상담 문의</p>
                        <p className="text-xl font-bold text-foreground">47</p>
                        <p className="text-xs text-brand">전환율 59.6%</p>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Zap className="w-3 h-3" />AI 분석 요약</p>
                      <p className="text-sm text-foreground whitespace-pre-line">이번 달 AI 검색 점수가 61점에서 72점으로 11점 상승했습니다. AI 크롤러 허용 설정이 완료되어 ChatGPT와 Gemini에서의 노출이 크게 증가했습니다. 구조화 데이터(FAQ 스키마) 추가를 권장합니다.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 로그인 유도 CTA */}
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
                  <h3 className="text-lg font-bold text-foreground">내 병원 데이터로 확인하기</h3>
                  <p className="text-sm text-muted-foreground mt-1">로그인하면 실제 내 병원의 AI 인용 현황, 유입 분석, 상담 관리를 모두 확인할 수 있습니다</p>
                </div>
              </div>
              <a
                href={getLoginUrl()}
                className="flex-shrink-0 px-6 py-3 rounded-full bg-brand text-background font-medium hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg shadow-brand/20"
              >
                로그인하고 시작하기
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

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
        {/* UX 개선 1: 웰컴 헤더 강화 — 핵심 지표 요약 + 빠른 액션 */}
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

        {/* UX 개선 3+5: 탭 — 알림 뱃지 + 모바일 스크롤 */}
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="w-full flex h-12 mb-6 overflow-x-auto bg-muted/60 border border-border/50 rounded-xl p-1 gap-1">
            <TabsTrigger value="report" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <FileText className="w-4 h-4 hidden sm:inline" />
              리포트
            </TabsTrigger>
            <TabsTrigger value="ai-exposure" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Zap className="w-4 h-4 hidden sm:inline" />
              AI 인용
            </TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Globe className="w-4 h-4 hidden sm:inline" />
              유입 분석
            </TabsTrigger>
            <TabsTrigger value="consultation" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 relative data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <MessageSquare className="w-4 h-4 hidden sm:inline" />
              상담 관리
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:relative sm:top-auto sm:right-auto ml-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hospital-info" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Settings className="w-4 h-4 hidden sm:inline" />
              병원 정보
            </TabsTrigger>
            <TabsTrigger value="diagnosis" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <Stethoscope className="w-4 h-4 hidden sm:inline" />
              진단 보고서
            </TabsTrigger>
            <TabsTrigger value="consultation-stats" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <BarChart3 className="w-4 h-4 hidden sm:inline" />
              상담 현황
            </TabsTrigger>
            <TabsTrigger value="crm" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all flex-1 min-w-0">
              <ClipboardList className="w-4 h-4 hidden sm:inline" />
              CRM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-exposure">
            {/* UX 개선 2: 탭별 인사이트 배너 */}
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
                  <h3 className="text-lg font-bold text-foreground">
                    Pro 플랜으로 업그레이드
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    주간 자동 진단 · AI 모니터링 · 경쟁사 비교 · 맞춤 개선 리포트
                  </p>
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

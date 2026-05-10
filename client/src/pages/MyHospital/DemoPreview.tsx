/**
 * 데모 미리보기 — 로그인 전 방문자용 샘플 대시보드
 */
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, TrendingUp, Trophy, Target, BarChart3,
  Zap, CheckCircle2, XCircle, Clock, Eye, Globe,
  MessageSquare, FileText, ChevronRight, RefreshCw,
  Shield, Phone, Users,
} from "lucide-react";
import { GradeCircle, ScoreChangeIndicator, InsightBanner, CHANNEL_LABELS } from "./shared";

/* ── 데모 데이터 ── */

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

export default function DemoPreview() {
  const latestDiag = DEMO_HISTORY[DEMO_HISTORY.length - 1];
  const prevDiag = DEMO_HISTORY[DEMO_HISTORY.length - 2];
  const totalVisits = DEMO_CHANNELS.reduce((s, c) => s + c.count, 0);
  const aiVisits = DEMO_CHANNELS.filter(c => c.channel.startsWith("ai_")).reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-6xl mx-auto px-4">
        {/* 데모 안내 배너 */}
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

        {/* 웰컴 헤더 (데모) */}
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
              <Button className="bg-brand/80 hover:bg-brand/90 cursor-not-allowed opacity-60 text-sm" disabled size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />진단하기
              </Button>
            </div>

            {/* 핵심 지표 미니 카드 */}
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

        {/* 탭 구조 (데모) */}
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-12 mb-6 bg-muted/60 border border-border/50 rounded-xl p-1">
            <TabsTrigger value="report" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <FileText className="w-4 h-4 hidden sm:inline" />리포트
            </TabsTrigger>
            <TabsTrigger value="ai-exposure" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <Zap className="w-4 h-4 hidden sm:inline" />AI 인용
            </TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <Globe className="w-4 h-4 hidden sm:inline" />유입 분석
            </TabsTrigger>
            <TabsTrigger value="consultation" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-4 relative data-[state=active]:bg-brand data-[state=active]:text-background data-[state=active]:shadow-md rounded-lg transition-all">
              <MessageSquare className="w-4 h-4 hidden sm:inline" />상담 관리
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
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Zap className="w-4 h-4" />AI 인용 점수</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{latestDiag.aiScore}<span className="text-lg text-muted-foreground">점</span></div>
                    <ScoreChangeIndicator current={latestDiag.aiScore} previous={prevDiag?.aiScore} />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Trophy className="w-4 h-4" />치과 내 순위</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">7<span className="text-lg text-muted-foreground">위</span><span className="text-sm text-muted-foreground ml-1">/ 45개</span></div>
                    <span className="text-xs text-brand">상위 16%</span>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><BarChart3 className="w-4 h-4" />진단 이력</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{DEMO_HISTORY.length}<span className="text-lg text-muted-foreground">회</span></div>
                    <span className="text-xs text-muted-foreground">최근: {new Date(latestDiag.diagnosedAt).toLocaleDateString("ko-KR")}</span>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card border-border lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand" />AI 인용 점수 추이</CardTitle>
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
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-brand" />개선 추천</CardTitle>
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
                    <div className="flex items-center gap-4 text-xs">
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

/**
 * AI 가시성 진단 도구
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Search, ArrowRight, CheckCircle2, Globe, Sparkles,
  ArrowLeft, Bot, AlertTriangle, BarChart3,
  ChevronDown, ExternalLink, FileText, Mail, Trophy, XCircle,
} from "lucide-react";
import { Link } from "wouter";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import SnsMarketingTipsSection from "@/components/SnsMarketingTips";
import RealityDiagnosisSection from "@/components/RealityDiagnosis";
import { useEventLogger } from "@/hooks/useEventLogger";
import { toast } from "sonner";

import {
  type SeoResult,
  CountryContext, FlagKR, FlagTH, t, localCatName,
  SPECIALTIES, REGIONS_LIST,
} from "./seo-checker/types";
import {
  PdfDownloadButton, AnalysisProgress, EmailReportButton, ShareToolbar,
  ScoreRing, CategoryCard, BenchmarkCompare, AutoOptimizationPlan,
} from "./seo-checker/components";

// URL 쿼리 파라미터에서 초기값 추출 (렌더 바깥에서 1회 실행)
function parseInitialParams() {
  const params = new URLSearchParams(window.location.search);
  const u = params.get("url") || "";
  const s = params.get("specialty") || "";
  const c = (params.get("country") as "kr" | "th") || "kr";
  return { url: u, specialty: s, country: c, hasUrl: !!u };
}
const INIT = parseInitialParams();

export default function SeoChecker() {
  const [url, setUrl] = useState(INIT.url);
  const [specialty, setSpecialty] = useState(INIT.specialty);
  const [country, setCountry] = useState<"kr" | "th">(INIT.country);
  const [result, setResult] = useState<SeoResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);
  const { logEvent } = useEventLogger();
  // Phase 1: 스텝 폼 상태
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [hospitalName, setHospitalName] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const saveDiagnosisMutation = trpc.diagnosis.save.useMutation({ onError: (err) => toast.error(err.message) });
  const analyzeMutation = trpc.seoAnalyzer.analyze.useMutation({ onSuccess: (data) => {
      const r = data as SeoResult;
      setResult(r);
      // 진단 이력 저장
      const aiCat = r.categories.find(c => c.name === "AI 검색 노출");
      const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
      const catScores: Record<string, number> = {};
      r.categories.forEach(c => { catScores[c.name] = c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0; });
      saveDiagnosisMutation.mutate({
        url: r.url,
        totalScore: r.totalScore,
        aiScore,
        grade: r.grade,
        specialty: specialty || undefined,
        categoryScores: JSON.stringify(catScores),
      });
      // 이벤트 로깅: 진단 실행
      logEvent("diagnosis_run", { url: r.url, totalScore: r.totalScore, grade: r.grade, aiScore, specialty });
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    },
  });

  // URL 쿼리 파라미터 자동 실행 — 초기 마운트 시 1회만 (ref 사용으로 setState 없음)
  useEffect(() => {
    if (autoStartedRef.current || !INIT.hasUrl) return;
    autoStartedRef.current = true;
    analyzeMutation.mutate({
      url: INIT.url,
      specialty: INIT.specialty || undefined,
      country: INIT.country,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setFormStep(2);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !privacyConsent) return;
    setResult(null);
    analyzeMutation.mutate({
      url: url.trim(),
      specialty: specialty || undefined,
      country,
      hospitalName: hospitalName || undefined,
      region: region || undefined,
      email: email || undefined,
      phone: phone || undefined,
      privacyConsent,
      marketingConsent,
    });
  };
  // URL만으로 빠른 진단 (기존 호환)
  const handleQuickSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setResult(null);
    analyzeMutation.mutate({ url: url.trim(), specialty: specialty || undefined, country });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* 히어로 섹션 — URL 입력 */}
      <section className="relative pt-28 pb-6 overflow-hidden">
        {/* 배경 */}
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.72 0.14 200) 0.5px, transparent 0.5px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.14 200 / 0.08) 0%, transparent 60%)",
          }}
        />

        <div className="relative container max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-6">
            <Search className="w-4 h-4" />
            {t(country, "무료 AI+포털 노출 진단", "Free AI + Search Visibility Audit")}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display leading-tight mb-4">
            {t(country, <>우리 병원 홈페이지<br /><span className="text-brand">AI와 포털에 노출되고 있나요?</span></>, <>Is Your Clinic Website<br /><span className="text-brand">Visible on AI & Search Engines?</span></>)}
          </h1>

          {/* 스텝 폼 */}
          <div className="relative max-w-2xl mx-auto">
            {/* 국가 선택 배지 */}
            {country === "th" && (
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-medium">
                  <FlagTH size={16} /> Thailand 기준 진단
                </span>
              </div>
            )}

            {/* Step 1: URL + 병원명 + 진료과 + 지역 */}
            {formStep === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-3">
                {/* URL 입력 바 */}
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border shadow-lg shadow-brand/5">
                  <div className="shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => setCountry(country === "kr" ? "th" : "kr")}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors"
                      title={country === "kr" ? "한국 기준 진단" : "태국 기준 진단"}
                    >
                      <span className="leading-none">{country === "kr" ? <FlagKR size={24} /> : <FlagTH size={24} />}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <div className="w-px h-6 bg-border" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 px-1 min-w-0 overflow-hidden">
                    <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={country === "kr" ? "https://우리병원.com" : "https://your-clinic.com"}
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 py-3 text-base truncate"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!url.trim()}
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t(country, "다음", "Next")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {/* 병원명 + 진료과 + 지역 (선택사항) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="병원명 (선택)"
                    className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-brand/50 transition-colors"
                  />
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground outline-none focus:border-brand/50 transition-colors appearance-none cursor-pointer"
                  >
                    {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground outline-none focus:border-brand/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">지역 선택</option>
                    {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {/* 빠른 진단 링크 */}
                <p className="text-xs text-muted-foreground">
                  <button type="button" onClick={handleQuickSubmit} className="text-brand hover:underline">
                    {t(country, "URL만으로 바로 진단하기 →", "Quick audit with URL only →")}
                  </button>
                </p>
              </form>
            )}

            {/* Step 2: 이메일 + 전화번호 + 동의 */}
            {formStep === 2 && !analyzeMutation.isPending && !result && (
              <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-brand/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-brand/10">
                      <Mail className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{t(country, "진단 결과를 받으실 정보를 입력해주세요", "Enter your contact info")}</h3>
                      <p className="text-xs text-muted-foreground">{t(country, "상세 리포트를 이메일로 받아보세요", "Get detailed report via email")}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일 주소 *"
                        required
                        className="px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-brand/50 transition-colors"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="전화번호 (선택)"
                        className="px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-brand/50 transition-colors"
                      />
                    </div>
                    {/* 동의 체크박스 */}
                    <div className="space-y-2 text-left">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacyConsent}
                          onChange={(e) => setPrivacyConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-border text-brand focus:ring-brand/50"
                          required
                        />
                        <span className="text-xs text-muted-foreground">
                          <Link href="/privacy" className="text-brand hover:underline">개인정보처리방침</Link>에 동의합니다 <span className="text-red-400">*</span>
                        </span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marketingConsent}
                          onChange={(e) => setMarketingConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-border text-brand focus:ring-brand/50"
                        />
                        <span className="text-xs text-muted-foreground">마케팅 정보 수신에 동의합니다 (선택)</span>
                      </label>
                    </div>
                  </div>
                  {/* 버튼 */}
                  <div className="flex items-center gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-brand/30 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t(country, "이전", "Back")}
                    </button>
                    <button
                      type="submit"
                      disabled={!privacyConsent || !email.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Search className="w-4 h-4" />
                      {t(country, "진단 시작", "Start Audit")}
                    </button>
                  </div>
                  {/* 빠른 진단 */}
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    <button type="button" onClick={handleQuickSubmit} className="text-brand hover:underline">
                      {t(country, "연락처 없이 진단만 하기 →", "Skip and audit without contact →")}
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* 로딩 상태 — 단계별 프로그레스 */}
          {analyzeMutation.isPending && <AnalysisProgress country={country} />}

          {/* 에러 */}
          {analyzeMutation.isError && (
            <div className="mt-8 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm max-w-lg mx-auto">
              <p className="font-medium mb-1">{t(country, "분석에 실패했습니다", "Analysis failed")}</p>
              <p className="text-red-400/80">{t(country, "URL을 확인하시고 다시 시도해 주세요. 접근이 차단된 사이트는 분석이 어려울 수 있습니다.", "Please check the URL and try again. Sites with restricted access may not be analyzable.")}</p>
            </div>
          )}
        </div>
      </section>



      {/* 결과 섹션 */}
      {result && (
        <CountryContext.Provider value={country}>
        <section ref={resultRef} className="py-12 pb-32">
          <div className="container max-w-4xl mx-auto">
            {/* 결과 헤더 */}
            <div className="text-center mb-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/50 text-sm text-muted-foreground mb-6">
                <BarChart3 className="w-4 h-4" />
                분석 완료 — {new Date(result.analyzedAt).toLocaleDateString("ko-KR")}
              </div>

              <h2 className="text-2xl font-bold font-display mb-2">
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors inline-flex items-center gap-2">
                  {result.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </h2>
            </div>

            {/* ★ 현실 진단 요약 — 네이버/구글/AI 인용 현황 ★ */}
            <RealityDiagnosisSection
              url={result.url}
              specialty={specialty}
              seoScore={result.totalScore}
              seoGrade={result.grade}
              categoryScores={Object.fromEntries(result.categories.map(c => [c.name, Math.round((c.score / c.maxScore) * 100)]))}
              siteName={(result as any).siteName}
            />

            {/* 점수 링 — 개선 #2: 여백 최소화 */}
            <div className="mb-6 animate-fade-in">
              <ScoreRing score={result.totalScore} grade={result.grade} />
            </div>

            {/* ★ 진단 결과 액션 패널 — 개선 #10: 상단+하단 모두 배치 ★ */}
            <div className="mb-8 p-4 sm:p-6 rounded-2xl border border-brand/20 bg-brand/5 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-brand/10">
                  <FileText className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">상세 진단 보고서 받기</h3>
                  <p className="text-xs text-muted-foreground mt-1">AI 분석 결과를 담은 PDF 리포트를 다운로드하거나 이메일로 받아보세요</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <PdfDownloadButton url={result.url} country={country} result={result} specialty={specialty} />
                <EmailReportButton url={result.url} country={country} result={result} specialty={specialty} />
                <Link
                  href={`/seo-compare`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium rounded-full border border-border text-foreground hover:bg-accent transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  경쟁사 비교 분석
                </Link>
              </div>
            </div>

            {/* 진료과별 벤치마크 비교 */}
            <BenchmarkCompare result={result} specialty={specialty} />

            {/* 요약 카드 — 개선 #3: 시각적 강조 + 아이콘 추가 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
              {[
                { label: t(country, "통과", "Pass"), count: result.summary.passed, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: <CheckCircle2 className="w-5 h-5" /> },
                { label: t(country, "주의", "Warning"), count: result.summary.warnings, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", icon: <AlertTriangle className="w-5 h-5" /> },
                { label: t(country, "실패", "Fail"), count: result.summary.failed, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", icon: <XCircle className="w-5 h-5" /> },
              ].map((s, _i) => (
                <div
                  key={String(s.label)}
                  className={`${s.bg} ${s.border} border-2 rounded-xl p-4 sm:p-5 text-center animate-fade-in`}
                >
                  <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
                  <p className={`text-3xl sm:text-4xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* 핵심 5개 문제 요약 카드 — 가장 시급한 문제 TOP 5 */}
            {(() => {
              const failedItems = result.categories
                .flatMap(c => c.items)
                .filter(item => item.status === "fail")
                .sort((a, b) => b.maxScore - a.maxScore)
                .slice(0, 5);
              if (failedItems.length === 0) return null;
              return (
                <div className="mb-8 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t(country, `가장 시급한 문제 TOP ${failedItems.length}`, `Top ${failedItems.length} Critical Issues`)}</h3>
                  </div>
                  <div className="space-y-2">
                    {failedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15 animate-fade-in-up"
                        style={{ animationDelay: `${0.08 * idx}s` }}
                      >
                        <div className="shrink-0 w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center">
                          <span className="text-xs font-bold text-red-400">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">{item.category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{item.detail}</p>
                          <p className="text-xs text-brand/80">💡 {item.recommendation}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-red-400">{item.score}/{item.maxScore}점</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                      <a
                      href="https://pf.kakao.com/_KxmnZn/chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                    >
                      {t(country, "이 문제들을 한번에 해결하기", "Fix all issues at once")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* AI 인용 점수 강조 카드 */}
            {(() => {
              const aiCat = result.categories.find(c => c.name === "AI 검색 노출" || c.name === "AI Search Visibility");
              if (!aiCat) return null;
              const aiPercent = aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
              const aiColor = aiPercent >= 80 ? "text-emerald-400" : aiPercent >= 50 ? "text-amber-400" : "text-red-400";
              const aiBg = aiPercent >= 80 ? "border-emerald-400/30 bg-emerald-400/5" : aiPercent >= 50 ? "border-amber-400/30 bg-amber-400/5" : "border-red-400/30 bg-red-400/5";
              return (
                <div className={`mb-8 p-5 sm:p-6 rounded-2xl border-2 ${aiBg} animate-fade-in relative overflow-hidden`}>
                  {/* 좌측 accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${aiPercent >= 80 ? 'bg-emerald-400' : aiPercent >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-brand/10">
                      <Bot className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{t(country, "AI 인용 점수", "AI Search Visibility Score")}</h3>
                      <p className="text-xs text-muted-foreground">ChatGPT · Gemini · Claude · Perplexity · Grok</p>
                    </div>
                    <span className={`ml-auto text-3xl font-bold ${aiColor}`}>{aiPercent}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiPercent >= 80
                      ? t(country, "AI 플랫폼이 사이트를 인용하기 좋은 상태입니다. AI 답변에서 노출될 확률이 높습니다.", "Your site is well-optimized for AI platforms. High chance of being cited in AI responses.")
                      : aiPercent >= 50
                        ? t(country, "AI 인용을 위한 기본 요소는 있지만, 개선이 필요합니다. 아래 항목을 확인하세요.", "Basic elements are in place, but improvements needed. Check items below.")
                      : t(country, "AI 플랫폼이 사이트를 인용하기 어려운 상태입니다. ChatGPT, Gemini 등에서 노출되려면 개선이 시급합니다.", "AI platforms have difficulty citing your site. Immediate improvement needed for ChatGPT, Gemini visibility.")}
                  </p>
                  {/* 긴급성 CTA — AI 점수 70% 미만일 때 */}
                  {aiPercent < 70 && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 p-1.5 rounded-lg bg-red-500/10">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-400 mb-1">
                            {aiPercent < 30
                              ? t(country, "⚠️ 경쟁 병원은 이미 AI 답변에 노출되고 있을 수 있습니다", "⚠️ Competitors may already be cited in AI responses")
                              : t(country, "⚠️ AI 인용이 경쟁사보다 뒤처질 수 있습니다", "⚠️ Your AI search visibility may fall behind competitors")}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {t(country, <>환자의 <strong>68%</strong>가 AI로 병원을 찾는 시대입니다. 경쟁 병원과 비교해 보세요.</>, <><strong>68%</strong> of patients now find clinics via AI. Compare with competitors.</>)}
                          </p>
                          <Link
                            href="/seo-compare"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            {t(country, "경쟁 병원과 AI 인용 점수 비교하기", "Compare AI visibility with competitors")}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── 카테고리 퀵 네비게이션 (개선 #6, #9) ── */}
            <div className="mb-6 sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-5 px-5 border-b border-border/30">
              <div className="flex flex-wrap gap-1.5 pb-1">
                {result.categories.map((cat) => {
                  const catFails = cat.items.filter(i => i.status === 'fail').length;
                  const catWarns = cat.items.filter(i => i.status === 'warning').length;
                  const catPercent = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => {
                        const el = document.getElementById(`cat-${cat.name}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all hover:brightness-110 ${
                        catFails > 0 ? 'bg-red-400/10 border-red-400/30 text-red-400' :
                        catWarns > 0 ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
                        'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                      }`}
                    >
                      {localCatName(cat.name, country)}
                      <span className="font-bold">{catPercent}%</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 카테고리별 결과 — 개선: 실패 있는 카테고리만 기본 펼침 */}
            <div className="space-y-4 mb-12">
              {result.categories.map((cat, i) => {
                const hasFails = cat.items.some(item => item.status === 'fail');
                return (
                  <div key={cat.name} id={`cat-${cat.name}`} className="scroll-mt-32">
                    <CategoryCard category={cat} index={i} initialExpanded={hasFails} />
                  </div>
                );
              })}
            </div>

            {/* ── 자동 최적화 계획 (EXIT 4번) ── */}
            <AutoOptimizationPlan url={result.url} specialty={specialty} result={result} country={country} />

            {/* ── SNS 마케팅 팁 섹션 ── */}
            <SnsMarketingTipsSection result={result} specialty={specialty} country={country} />

            {/* CTA — 점수별 긴급성 강조 + 상담 유도 */}
            <div
              className={`text-center space-y-4 animate-fade-in-up p-6 sm:p-8 rounded-2xl border ${
                result.totalScore < 40 ? "bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent border-red-400/30" :
                result.totalScore < 60 ? "bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-amber-400/30" :
                "bg-gradient-to-br from-brand/5 via-purple-500/5 to-transparent border-brand/10"
              }`}
            >
              {/* 점수별 메시지 */}
              {result.totalScore < 40 ? (
                <div className="space-y-2">
                  <p className="text-lg font-bold text-red-400">
                    {t(country, "시급한 개선이 필요합니다", "Urgent improvement needed")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(country, `현재 ${result.summary.failed}개의 심각한 문제가 발견되었습니다. AI 검색에서 병원이 노출되지 않을 가능성이 높습니다.`, `${result.summary.failed} critical issues found. Your clinic may not appear in AI search results.`)}
                  </p>
                </div>
              ) : result.totalScore < 60 ? (
                <div className="space-y-2">
                  <p className="text-lg font-bold text-amber-400">
                    {t(country, "개선 여지가 큽니다", "Significant room for improvement")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(country, "경쟁 병원 대비 AI 노출에서 뒤처지고 있을 수 있습니다. 전문가와 함께 개선 전략을 세워보세요.", "You may be falling behind competitors in AI visibility. Let's build an improvement strategy.")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {t(country, "광고비에 의존하지 않는 건강한 매출 구조를 만들어 드리겠습니다.", "Build a healthy revenue structure without relying on ad spend.")}
                </p>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                <a
                  href="https://pf.kakao.com/_KxmnZn/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-full text-background hover:brightness-110 transition-all ${
                    result.totalScore < 40 ? "bg-red-500 animate-pulse" :
                    result.totalScore < 60 ? "bg-amber-500" :
                    "bg-brand"
                  }`}
                >
                  {t(country, result.totalScore < 60 ? "긴급 상담 신청" : "무료 상담 신청", result.totalScore < 60 ? "Urgent Consultation" : "Free Consultation")}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href={`/seo-compare`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-full border border-border text-foreground hover:bg-accent transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  {t(country, "경쟁사 비교 분석", "Competitor Analysis")}
                </Link>
              </div>

              {/* 바이럴 공유 섹션 */}
              <ShareToolbar result={result} country={country} />
            </div>

            {/* 고정 하단 CTA 배너 — 70점 미만일 때만 */}
            {result.totalScore < 70 && (
              <div
                className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-brand/20 px-4 py-3 sm:py-4 animate-slide-up"
              >
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      result.totalScore < 50 ? "bg-red-400/15 text-red-400" : "bg-amber-400/15 text-amber-400"
                    }`}>
                      {result.totalScore}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <strong>{result.summary.failed}{t(country, "개 문제", " issues")}</strong> {t(country, "발견 — AI+포털 노출 개선이 시급합니다", "found — Immediate improvement needed")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate hidden sm:block">
                        {t(country, "광고비 절감 + AI 인용로 건강한 매출 기반을 만드세요", "Reduce ad spend + secure AI search visibility")}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href="/seo-compare"
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-full border border-border text-foreground hover:bg-accent transition-all"
                    >
                      <BarChart3 className="w-3 h-3" />
                      {t(country, "경쟁사 비교", "Compare")}
                    </Link>
                    <a
                      href="https://pf.kakao.com/_KxmnZn/chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all"
                    >
                      {t(country, "무료 상담", "Consult")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        </CountryContext.Provider>
      )}

      {/* 벤치마크 비교 + 뉴스레터 + 랭킹/어워드 링크 */}
      {result && (
        <section className="py-12 border-t border-border/50">
          <div className="container max-w-4xl mx-auto space-y-8">
            {/* 진료과별 벤치마크 안내 */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href={`/seo-history?url=${encodeURIComponent(result.url)}`}>
                <div className="group p-5 rounded-xl border border-border/60 bg-card/50 hover:border-brand/30 hover:bg-brand/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-brand" />
                    <span className="font-semibold text-sm">점수 변화 추이 보기</span>
                  </div>
                  <p className="text-xs text-muted-foreground">이전 진단 이력과 월별 점수 변화를 확인하세요</p>
                </div>
              </Link>
              <Link href="/my-hospital">
                <div className="group p-5 rounded-xl border border-border/60 bg-card/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-sm">진료과별 AI 인용 랭킹</span>
                  </div>
                  <p className="text-xs text-muted-foreground">같은 진료과 병원들의 평균 점수와 비교해보세요</p>
                </div>
              </Link>
              <Link href="/awards">
                <div className="group p-5 rounded-xl border border-border/60 bg-card/50 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    <span className="font-semibold text-sm">월간 AI 인용 어워드</span>
                  </div>
                  <p className="text-xs text-muted-foreground">이달의 AI 인용 우수 병원을 확인하세요</p>
                </div>
              </Link>
            </div>
            {/* 뉴스레터 구독 */}
            <NewsletterSubscribe source="seo-checker" />
          </div>
        </section>
      )}

      {/* 결과가 없을 때 — 설명 섹션 */}
      {!result && !analyzeMutation.isPending && (
        <section className="py-6 min-h-[30vh]">
          <div className="container max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Bot className="w-6 h-6" />,
                  title: t(country, "AI 인용 진단", "AI Search Visibility Audit"),
                  desc: t(country, "ChatGPT, Gemini, Claude, Perplexity 등 AI 플랫폼에서 인용될 수 있는지 진단합니다.", "Diagnose whether your site can be cited by AI platforms like ChatGPT, Gemini, Claude, Perplexity."),
                },
                {
                  icon: <Search className="w-6 h-6" />,
                  title: t(country, "포털 + AI 인용 분석", "Search + AI Visibility Analysis"),
                  desc: t(country, "구글·네이버 포털, 5대 AI 엔진 크롤러 접근성, 성능·모바일·접근성 등 100개+ 항목을 체크합니다.", "Check 100+ items including Google, Naver portals, 5 AI engine crawler access, performance, mobile, and accessibility."),
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: t(country, "맞춤 개선 방안", "Custom Improvement Plan"),
                  desc: t(country, "AI 인용과 포털 노출 모두를 잡는 구체적인 개선 방법을 알려드립니다.", "Get specific recommendations to improve both AI citation and portal visibility."),
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6 text-center animate-fade-in-up"
                  style={{ animationDelay: `${0.1 * i}s` }}
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

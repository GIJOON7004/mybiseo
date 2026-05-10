/**
 * SeoChecker 서브 컴포넌트 모음
 * - PdfDownloadButton, AnalysisProgress, EmailReportButton, ShareToolbar
 * - StatusIcon, ScoreRing, CategoryCard, CheckItemRow
 * - BenchmarkCompare, AutoOptimizationPlan
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import React from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, Globe, FileText, Code2, Share2,
  Sparkles, ChevronDown, ChevronUp, Loader2, Shield, BarChart3,
  Bot, Download, Mail, Send, MapPin, Stethoscope, Copy, QrCode,
  Image as ImageIcon, MessageCircle, Smartphone, Trophy, Users as UsersIcon,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useEventLogger } from "@/hooks/useEventLogger";
import {
  type SeoCheckStatus, type SeoCheckItem, type CategoryResult, type SeoResult,
  type ReportLang, type CountryCode,
  useCountry, t, localCatName, REPORT_LANGS,
} from "./types";  // types.tsx

/* ── PDF 다운로드 버튼 ── */
export function PdfDownloadButton({ url, country = "kr", result, specialty }: { url: string; country?: "kr" | "th"; result?: any; specialty?: string }) {
  const [selectedLang, setSelectedLang] = useState<ReportLang>(country === "th" ? "en" : "ko");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setShowLangMenu(false);
    setIsPending(true);
    setError(null);
    try {
      const payload: any = { url, country, language: selectedLang };
      if (result) payload.result = result;
      if (specialty) payload.specialty = specialty;
      const res = await fetch("/api/trpc/seoAnalyzer.generateReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: payload }),
      });
      const json = await res.json();
      if (json?.result?.data?.json?.pdfUrl) {
        const pdfRes = await fetch(json.result.data.json.pdfUrl);
        const blob = await pdfRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = json.result.data.json.fileName || "seo-report.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        throw new Error("서버 응답 오류");
      }
    } catch {
      setError("PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsPending(false);
    }
  };

  const currentLang = REPORT_LANGS.find(l => l.value === selectedLang)!;

  return (
    <div className="relative inline-flex flex-col">
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="inline-flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium rounded-l-full border border-r-0 border-brand/30 text-brand hover:bg-brand/10 transition-all"
        >
          <currentLang.FlagIcon size={18} />
          <span className="text-xs">{currentLang.label}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        <button
          onClick={handleDownload}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium rounded-r-full border border-brand/30 text-brand hover:bg-brand/10 transition-all disabled:opacity-50"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />PDF 생성 중...</>
          ) : (
            <><Download className="w-4 h-4" />PDF 다운로드</>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {showLangMenu && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]">
          {REPORT_LANGS.map(lang => (
            <button
              key={lang.value}
              onClick={() => { setSelectedLang(lang.value); setShowLangMenu(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors ${
                selectedLang === lang.value ? "bg-brand/10 text-brand font-semibold" : "text-foreground"
              }`}
            >
              <lang.FlagIcon size={18} />
              <span>{lang.label}</span>
              {selectedLang === lang.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 분석 중 단계별 프로그레스 ── */
const ANALYSIS_STEPS_KR = [
  { label: "메인 페이지 크롤링 중...", duration: 2000 },
  { label: "서브페이지 수집 및 분석 중...", duration: 4000 },
  { label: "메타 태그 및 콘텐츠 구조 분석 중...", duration: 3000 },
  { label: "AI 가시성 항목 평가 중...", duration: 3000 },
  { label: "종합 진단 결과 생성 중...", duration: 2000 },
];
const ANALYSIS_STEPS_TH = [
  { label: "Crawling main page...", duration: 2000 },
  { label: "Collecting & analyzing sub-pages...", duration: 4000 },
  { label: "Analyzing meta tags & content structure...", duration: 3000 },
  { label: "Evaluating AI search optimization items...", duration: 3000 },
  { label: "Generating diagnostic results...", duration: 2000 },
];

export function AnalysisProgress({ country = "kr" }: { country?: "kr" | "th" }) {
  const steps = country === "th" ? ANALYSIS_STEPS_TH : ANALYSIS_STEPS_KR;
  const [currentStep, setCurrentStep] = useState(0);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const advance = (step: number) => {
      if (step < steps.length - 1) {
        timeout = setTimeout(() => {
          setCurrentStep(step + 1);
          advance(step + 1);
        }, steps[step].duration);
      }
    };
    advance(0);
    return () => clearTimeout(timeout);
  }, [steps]);

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="w-8 h-8 animate-spin text-brand" />
      <div className="space-y-2 text-center">
        {steps.map((step, i) => (
          <p
            key={i}
            className={`text-sm transition-all duration-500 ${
              i === currentStep ? "text-foreground font-medium" :
              i < currentStep ? "text-muted-foreground/50 line-through" : "text-muted-foreground/30"
            }`}
          >
            {i <= currentStep && (i < currentStep ? "✓ " : "▶ ")}{step.label}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── 이메일 리포트 버튼 ── */
export function EmailReportButton({ url, country = "kr", result, specialty }: { url: string; country?: "kr" | "th"; result?: any; specialty?: string }) {
  const [email, setEmail] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportLang = country === "th" ? "en" : "ko";
  const emailMutation = trpc.seoEmail.sendReport.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSent(true);
        setError(null);
        setTimeout(() => { setShowInput(false); setSent(false); }, 3000);
      } else {
        setError("메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    },
    onError: () => {
      setError("메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    },
  });

  if (sent) {
    return (
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        {country === "th" ? "Report sent to your email!" : "이메일로 발송되었습니다!"}
      </div>
    );
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-full border border-brand/30 text-brand hover:bg-brand/10 transition-all"
      >
        <Mail className="w-4 h-4" />
        {country === "th" ? "Send to Email" : "이메일로 받기"}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(null); if (email.trim()) emailMutation.mutate({ email: email.trim(), url, source: "seo_checker", country, language: reportLang, result: result || undefined, specialty: specialty || undefined }); }}
      className="relative flex items-center gap-2 p-1.5 rounded-full bg-card border border-border shadow-lg"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={country === "th" ? "Enter email address" : "이메일 주소 입력"}
        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 px-4 py-2 text-sm min-w-[200px]"
        autoFocus
      />
      <button
        type="submit"
        disabled={emailMutation.isPending || !email.trim()}
        className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
      >
        {emailMutation.isPending ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" />{country === "th" ? "Sending..." : "발송 중..."}</>
        ) : (
          <><Send className="w-3.5 h-3.5" />{country === "th" ? "Send" : "발송"}</>
        )}
      </button>
      <button type="button" onClick={() => { setShowInput(false); setError(null); }} className="p-2 text-muted-foreground hover:text-foreground">
        <XCircle className="w-4 h-4" />
      </button>
      {error && <p className="absolute top-full left-0 mt-1 text-xs text-red-400 whitespace-nowrap">{error}</p>}
    </form>
  );
}

/* ── 바이럴 공유 툴바 ── */
export function ShareToolbar({ result, country = "kr" }: { result: SeoResult; country?: "kr" | "th" }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const { logEvent } = useEventLogger();

  const shareUrl = `${window.location.origin}/seo-check?url=${encodeURIComponent(result.url)}`;
  const shareTitle = country === "th"
    ? `Clinic Website AI+Search Score: ${result.totalScore} (${result.grade})`
    : `우리 병원 홈페이지 AI+포털 노출 점수: ${result.totalScore}점 (${result.grade})`;
  const shareDesc = country === "th"
    ? `AI Search Diagnosis — Passed ${result.summary.passed}, Failed ${result.summary.failed}. Check your clinic too!`
    : `AI 인용 진단 결과 — 통과 ${result.summary.passed}개, 실패 ${result.summary.failed}개. 당신의 병원도 진단해 보세요!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      logEvent("share_click", { method: "url_copy", url: result.url, score: result.totalScore });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKakao = () => {
    const kakao = (window as any).Kakao;
    if (!kakao?.isInitialized?.()) {
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
      } else {
        navigator.clipboard?.writeText(shareUrl);
        alert("카카오톡 SDK를 불러오지 못했습니다. URL이 클립보드에 복사되었습니다.");
      }
      return;
    }
    logEvent("share_click", { method: "kakao", url: result.url, score: result.totalScore });
    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: shareTitle,
        description: shareDesc,
        imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663438971958/PAet9MTkZYRHY348QbWGBd/og-image-wide-VCu4Vf9EQTnQ4LcR8dKRrM.png",
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        { title: "나도 진단해보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
      ],
    });
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  const gradeColor = result.totalScore >= 80 ? "#34d399" : result.totalScore >= 60 ? "#fbbf24" : result.totalScore >= 40 ? "#fb923c" : "#f87171";

  return (
    <div className="mt-8 pt-6 border-t border-border/50">
      <p className="text-sm text-muted-foreground mb-5 flex items-center gap-2 justify-center">
        <Share2 className="w-4 h-4" />
        {country === "th" ? "Share with colleagues" : "공유하기"}
      </p>
      <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto mb-3">
        {country === "th" ? (
          <button onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, "_blank", "width=500,height=600")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#06C755]/10 border border-[#06C755]/20 hover:bg-[#06C755]/20 transition-all">
            <MessageCircle className="w-5 h-5 text-[#06C755]" /><span className="text-[11px] font-medium text-[#06C755]">LINE</span>
          </button>
        ) : (
          <button onClick={handleKakao} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#FEE500]/10 border border-[#FEE500]/20 hover:bg-[#FEE500]/20 transition-all">
            <MessageCircle className="w-5 h-5 text-[#FEE500]" /><span className="text-[11px] font-medium text-[#FEE500]">KakaoTalk</span>
          </button>
        )}
        <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all">
          {copied ? (<><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-[11px] font-medium text-emerald-400">복사 완료</span></>) : (<><Copy className="w-5 h-5 text-muted-foreground" /><span className="text-[11px] font-medium text-muted-foreground">URL 복사</span></>)}
        </button>
        <button onClick={() => setShowQr(!showQr)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all">
          <QrCode className="w-5 h-5 text-muted-foreground" /><span className="text-[11px] font-medium text-muted-foreground">QR코드</span>
        </button>
        <button onClick={() => setShowCard(!showCard)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all">
          <ImageIcon className="w-5 h-5 text-muted-foreground" /><span className="text-[11px] font-medium text-muted-foreground">스코어카드</span>
        </button>
        {country === "th" ? (
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=500,height=600")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all">
            <Globe className="w-5 h-5 text-[#1877F2]" /><span className="text-[11px] font-medium text-[#1877F2]">Facebook</span>
          </button>
        ) : (
          <button onClick={() => window.open(`https://band.us/plugin/share?body=${encodeURIComponent(`${shareTitle}\n\n${shareDesc}\n\n나도 진단해보기: ${shareUrl}`)}`, "_blank", "width=500,height=600")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#6CC655]/10 border border-[#6CC655]/20 hover:bg-[#6CC655]/20 transition-all">
            <UsersIcon className="w-5 h-5 text-[#6CC655]" /><span className="text-[11px] font-medium text-[#6CC655]">네이버 밴드</span>
          </button>
        )}
        <a href={`sms:?body=${encodeURIComponent(`${shareTitle}\n나도 진단해보기: ${shareUrl}`)}`} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all">
          <Smartphone className="w-5 h-5 text-muted-foreground" /><span className="text-[11px] font-medium text-muted-foreground">문자 공유</span>
        </a>
      </div>
      <div className="flex justify-center">
        <a href="/seo-compare" className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 transition-all shadow-lg shadow-amber-500/20">
          <Trophy className="w-4 h-4" />경쟁병원 비교 도전
        </a>
      </div>
      {showQr && (
        <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
          <div className="p-4 bg-white rounded-xl"><img src={qrUrl} alt="QR Code" className="w-48 h-48" /></div>
          <p className="text-xs text-muted-foreground">이 QR코드를 스캔하면 진단 결과 페이지로 이동합니다</p>
          <a href={qrUrl} download={`seo-qr-${result.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}.png`} className="text-xs text-brand hover:underline">QR코드 다운로드</a>
        </div>
      )}
      {showCard && (
        <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
          <div id="score-card" className="w-[400px] p-6 rounded-2xl text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)" }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, oklch(0.72 0.14 200) 0.5px, transparent 0.5px)", backgroundSize: "12px 12px" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center"><Bot className="w-5 h-5 text-brand" /></div>
                <span className="text-sm font-bold text-brand">MY비서 AI+포털 노출 진단</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 truncate">{result.url}</p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-bold" style={{ color: gradeColor }}>{result.totalScore}</span>
                <span className="text-lg text-gray-400">/100</span>
                <span className="text-2xl font-bold" style={{ color: gradeColor }}>{result.grade}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-emerald-400/10 rounded-lg p-2 text-center"><p className="text-lg font-bold text-emerald-400">{result.summary.passed}</p><p className="text-[10px] text-gray-400">통과</p></div>
                <div className="bg-amber-400/10 rounded-lg p-2 text-center"><p className="text-lg font-bold text-amber-400">{result.summary.warnings}</p><p className="text-[10px] text-gray-400">주의</p></div>
                <div className="bg-red-400/10 rounded-lg p-2 text-center"><p className="text-lg font-bold text-red-400">{result.summary.failed}</p><p className="text-[10px] text-gray-400">실패</p></div>
              </div>
              <div className="text-center pt-3 border-t border-white/10"><p className="text-xs text-gray-400">나도 진단해보기 → mybiseo.com/seo-check</p></div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">스크린샷을 찍어 SNS에 공유해 보세요!</p>
        </div>
      )}
    </div>
  );
}

/* ── 카테고리 아이콘 맵 ── */
export const categoryIcons: Record<string, React.ReactNode> = {
  "메타 태그": <FileText className="w-5 h-5" />,
  "콘텐츠 구조": <Code2 className="w-5 h-5" />,
  "홈페이지 기본 설정": <Shield className="w-5 h-5" />,
  "소셜 미디어": <Share2 className="w-5 h-5" />,
  "검색 고급 설정": <Sparkles className="w-5 h-5" />,
  "네이버 검색 최적화": <MapPin className="w-5 h-5" />,
  "Google Thailand 최적화": <MapPin className="w-5 h-5" />,
  "병원 특화 SEO": <Stethoscope className="w-5 h-5" />,
  "AI 검색 노출": <Bot className="w-5 h-5" />,
  "성능 최적화": <BarChart3 className="w-5 h-5" />,
  "모바일 최적화": <Smartphone className="w-5 h-5" />,
  "접근성/UX": <UsersIcon className="w-5 h-5" />,
  "국제화/다국어": <Globe className="w-5 h-5" />,
};

/* ── StatusIcon ── */
export function StatusIcon({ status }: { status: SeoCheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (status === "fail") return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
  return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
}

/* ── ScoreRing ── */
export function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "oklch(0.72 0.19 155)" : score >= 60 ? "oklch(0.75 0.18 85)" : score >= 40 ? "oklch(0.75 0.18 60)" : "oklch(0.65 0.24 25)";

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="oklch(0.22 0.015 260)" strokeWidth="8" />
        <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-display animate-fade-in" style={{ color }}>{score}</span>
        <span className="text-sm text-muted-foreground mt-1">/ 100점</span>
        <span className="text-lg font-bold mt-1" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
}

/* ── CategoryCard ── */
export function CategoryCard({ category, index, initialExpanded = false }: { category: CategoryResult; index: number; initialExpanded?: boolean }) {
  const country = useCountry();
  const [expanded, setExpanded] = useState(initialExpanded);
  const percent = category.maxScore > 0 ? Math.round((category.score / category.maxScore) * 100) : 0;
  const failCount = category.items.filter(i => i.status === "fail").length;
  const warnCount = category.items.filter(i => i.status === "warning").length;
  const catDisplayName = localCatName(category.name, country);
  const icon = categoryIcons[category.name] || <FileText className="w-5 h-5" />;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden" style={{ animationDelay: `${index * 80}ms` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 p-5 hover:bg-accent/10 transition-colors text-left">
        <div className="p-2.5 rounded-xl bg-brand/10 text-brand shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-sm">{catDisplayName}</h3>
            {failCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-400/10 text-red-400 font-bold">{failCount} fail</span>}
            {warnCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-bold">{warnCount} warn</span>}
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${percent >= 80 ? "bg-emerald-400" : percent >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-lg font-bold ${percent >= 80 ? "text-emerald-400" : percent >= 60 ? "text-amber-400" : "text-red-400"}`}>{percent}%</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/50">
          {category.items.map(item => <CheckItemRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

/* ── CheckItemRow ── */
export function CheckItemRow({ item }: { item: SeoCheckItem }) {
  const country = useCountry();
  const [open, setOpen] = useState(item.status === "fail");

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-3 hover:bg-accent/20 transition-colors text-left ${item.status === 'pass' ? 'py-2.5 px-4' : 'p-4'}`}>
        <StatusIcon status={item.status} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground break-words">{item.name}</span>
          {item.status !== "pass" && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.detail}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
            item.status === "pass" ? "bg-emerald-400/15 text-emerald-400" :
            item.status === "fail" ? (item.score === 0 ? "bg-red-500/25 text-red-400 ring-1 ring-red-400/30" : "bg-red-400/15 text-red-400") :
            "bg-amber-400/15 text-amber-400"
          }`}>{item.score}/{item.maxScore}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="overflow-hidden" style={{ animation: "slideDown 0.2s ease-out" }}>
          <div className="px-4 pb-4 pl-12 space-y-3">
            {item.status !== "pass" && (
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/10">
                <p className="text-xs font-medium text-brand mb-1">{t(country, "개선 방법", "Recommendation")}</p>
                <p className="text-sm text-foreground/80">{item.recommendation}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/30 space-y-1.5">
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">{t(country, "현재:", "Current:")}</span> {item.detail}</p>
              <p className="text-xs text-muted-foreground"><span className="font-medium text-red-400/70">{t(country, "중요:", "Important:")}</span> {item.impact}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── BenchmarkCompare ── */
export function BenchmarkCompare({ result, specialty }: { result: SeoResult; specialty: string }) {
  const { data: allStats } = trpc.diagnosis.specialtyStats.useQuery();
  if (!specialty || !allStats || allStats.length === 0) return null;
  const stat = allStats.find((s: any) => s.specialty === specialty);
  if (!stat) return null;
  const avgScore = stat.avgScore;
  const diff = result.totalScore - avgScore;
  const isAbove = diff >= 0;
  const absDiff = Math.abs(diff);
  const gradeColor = isAbove ? "text-emerald-400" : diff >= -10 ? "text-amber-400" : "text-red-400";
  const gradeBg = isAbove ? "bg-emerald-400/5 border-emerald-400/20" : diff >= -10 ? "bg-amber-400/5 border-amber-400/20" : "bg-red-400/5 border-red-400/20";

  return (
    <div className={`mb-8 p-5 sm:p-6 rounded-2xl border ${gradeBg} animate-fade-in`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-brand/10"><Stethoscope className="w-5 h-5 text-brand" /></div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{specialty} 평균 대비</h3>
          <p className="text-xs text-muted-foreground">동일 진료과 병원 벤치마크 비교</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-xl bg-background/50"><p className="text-xs text-muted-foreground mb-1">내 병원</p><p className={`text-2xl font-bold ${gradeColor}`}>{result.totalScore}<span className="text-sm">점</span></p></div>
        <div className="p-3 rounded-xl bg-background/50"><p className="text-xs text-muted-foreground mb-1">{specialty} 평균</p><p className="text-2xl font-bold text-foreground">{avgScore}<span className="text-sm text-muted-foreground">점</span></p></div>
        <div className="p-3 rounded-xl bg-background/50"><p className="text-xs text-muted-foreground mb-1">평균 대비</p><p className={`text-2xl font-bold ${gradeColor}`}>{isAbove ? "+" : ""}{diff}<span className="text-sm">점</span></p></div>
      </div>
      <p className="text-sm text-muted-foreground mt-4 text-center">
        {isAbove ? `귀 병원은 ${specialty} 평균보다 ${absDiff}점 높습니다. 우수한 상태입니다!` : `귀 병원은 ${specialty} 평균보다 ${absDiff}점 낮습니다. 개선이 필요합니다.`}
      </p>
      {!isAbove && (
        <div className="mt-3 text-center">
          <Link href="/#contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">평균 이상으로 끌어올리기<ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      )}
    </div>
  );
}

/* ── AutoOptimizationPlan ── */
export function AutoOptimizationPlan({ url, specialty, result, country = "kr" }: { url: string; specialty: string; result: SeoResult; country?: "kr" | "th" }) {
  const cc = country as CountryCode;
  const [showPlan, setShowPlan] = useState(false);
  const [_expandedCategory, _setExpandedCategory] = useState<string | null>(null);
  const optimizeMutation = trpc.autoOptimizer.generatePlan.useMutation({ onError: (err) => toast.error(err.message) });

  const failedItems = result.categories.flatMap(c => c.items).filter(i => i.status === "fail");
  const warningItems = result.categories.flatMap(c => c.items).filter(i => i.status === "warning");
  const totalFixable = failedItems.length + warningItems.length;

  if (totalFixable === 0) return null;

  const handleGenerate = () => {
    if (optimizeMutation.data) { setShowPlan(!showPlan); return; }
    optimizeMutation.mutate({ url, specialty: specialty || undefined, country }, { onSuccess: () => setShowPlan(true) });
  };

  const plan = optimizeMutation.data;

  return (
    <div className="mb-10 animate-fade-in">
      <div className="p-5 sm:p-6 rounded-2xl border-2 border-brand/30 bg-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-brand/10"><Code2 className="w-6 h-6 text-brand" /></div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{t(cc, "최적화 개선 계획", "Optimization Plan")}</h3>
            <p className="text-xs text-muted-foreground">{t(cc, `${totalFixable}개 문제에 대한 구체적인 수정 코드를 생성합니다`, `Generate fix code for ${totalFixable} issues`)}</p>
          </div>
          <button onClick={handleGenerate} disabled={optimizeMutation.isPending} className="shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-brand to-purple-500 text-background hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-brand/20">
            {optimizeMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />생성 중...</>) : showPlan ? (<><ChevronUp className="w-4 h-4" />접기</>) : (<><Sparkles className="w-4 h-4" />최적화 코드 생성</>)}
          </button>
        </div>
        {plan && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-xs text-muted-foreground">{t(cc, "예상 점수 상승", "Est. Score Increase")}</p><p className="text-xl font-bold text-emerald-400">+{plan.estimatedNewScore - plan.currentScore}점</p></div>
            <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-xs text-muted-foreground">{t(cc, "수정 항목", "Items to Fix")}</p><p className="text-xl font-bold text-brand">{plan.fixes?.length || 0}개</p></div>
            <div className="p-3 rounded-xl bg-background/50 text-center"><p className="text-xs text-muted-foreground">{t(cc, "예상 최종 점수", "Est. Final Score")}</p><p className="text-xl font-bold text-foreground">{plan.estimatedNewScore}<span className="text-sm">점</span></p></div>
          </div>
        )}
        {showPlan && plan && (
          <div className="space-y-3 mt-4">
            {["critical", "high", "medium", "low"].map(priority => {
              const fixes = plan.fixes?.filter((f: any) => f.priority === priority) || [];
              if (fixes.length === 0) return null;
              const priorityLabel = country === "th"
                ? { critical: "Critical", high: "High", medium: "Medium", low: "Low" }[priority]
                : { critical: "긴급", high: "높음", medium: "보통", low: "낮음" }[priority];
              const priorityColor = { critical: "text-red-400 bg-red-400/10", high: "text-orange-400 bg-orange-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-blue-400 bg-blue-400/10" }[priority];
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityColor}`}>{priorityLabel}</span>
                    <span className="text-xs text-muted-foreground">{fixes.length}개 항목</span>
                  </div>
                  <div className="space-y-2">
                    {fixes.map((fix: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-background/80 border border-border/50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0" /><span className="text-sm font-semibold text-foreground">{fix.itemName}</span></div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{fix.category}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{fix.issue}</p>
                        <div className="text-xs text-emerald-400 mb-2">💡 {fix.recommendation}</div>
                        {fix.codeSnippet && (
                          <div className="relative">
                            <pre className="p-3 rounded-lg bg-zinc-900 text-zinc-100 text-xs overflow-x-auto max-h-40 scrollbar-thin"><code>{fix.codeSnippet}</code></pre>
                            <button onClick={() => { navigator.clipboard.writeText(fix.codeSnippet); }} className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors" title="코드 복사"><Copy className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="mt-4 p-4 rounded-xl bg-brand/5 border border-brand/20 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t(cc, "직접 수정이 어려우신가요? MY비서가 모두 적용해 드립니다.", "Need help implementing? Let MY BISEO handle it for you.")}</p>
              <Link href="/#contact" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all">{t(cc, "최적화 대행 신청", "Request Optimization Service")}<ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

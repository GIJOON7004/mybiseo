/**
 * AI 가시성 진단 도구 — URL 입력 시 AI 가시성 문제점을 상세 분석하여 보여주는 공개 페이지
 * Pomelli / SEOptimer 스타일의 전문적인 리포트 UI
 * Performance: framer-motion 제거, CSS 애니메이션으로 교체
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Search, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Globe, FileText, Code2, Share2, Sparkles, ChevronDown, ChevronUp,
  ArrowLeft, Loader2, Shield, BarChart3, ExternalLink, Bot, Download, Mail, Send,
  MapPin, Stethoscope, Copy, QrCode, Image as ImageIcon, MessageCircle,
  Smartphone, Trophy, Users as UsersIcon
} from "lucide-react";
import { Link } from "wouter";
import React, { createContext, useContext } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import SnsMarketingTipsSection from "@/components/SnsMarketingTips";
import RealityDiagnosisSection from "@/components/RealityDiagnosis";
import { useEventLogger } from "@/hooks/useEventLogger";

type SeoCheckStatus = "pass" | "fail" | "warning";

interface SeoCheckItem {
  id: string;
  category: string;
  name: string;
  status: SeoCheckStatus;
  score: number;
  maxScore: number;
  detail: string;
  recommendation: string;
  impact: string;
}

interface CategoryResult {
  name: string;
  score: number;
  maxScore: number;
  items: SeoCheckItem[];
}

interface SeoResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  categories: CategoryResult[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

/* ── 국기 이미지 컴포넌트 (flagcdn.com CDN — 정확한 국기 보장) ── */
const FlagKR = ({ size = 20 }: { size?: number }) => {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src="https://flagcdn.com/w80/kr.png"
      alt="대한민국 국기"
      width={size}
      height={h}
      className="inline-block rounded-sm shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
};
const FlagTH = ({ size = 20 }: { size?: number }) => {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src="https://flagcdn.com/w80/th.png"
      alt="태국 국기"
      width={size}
      height={h}
      className="inline-block rounded-sm shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
};
const FlagUS = ({ size = 20 }: { size?: number }) => {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src="https://flagcdn.com/w80/us.png"
      alt="미국 국기"
      width={size}
      height={h}
      className="inline-block rounded-sm shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
};

type ReportLang = "ko" | "en" | "th";
type CountryCode = "kr" | "th";

/* ── i18n: country 기반 텍스트 ── */
const CountryContext = createContext<CountryCode>("kr");
function useCountry() { return useContext(CountryContext); }

function t(country: CountryCode, ko: string, en: string): string;
function t(country: CountryCode, ko: React.ReactNode, en: React.ReactNode): React.ReactNode;
function t(country: CountryCode, ko: any, en: any) { return country === "th" ? en : ko; }

const categoryNameEN: Record<string, string> = {
  "메타 태그": "Meta Tags",
  "콘텐츠 구조": "Content Structure",
  "홈페이지 기본 설정": "Technical Search",
  "소셜 미디어": "Social Media",
  "검색 고급 설정": "AI Crawling",
  "네이버 검색 최적화": "Naver AI Readiness",
  "Google Thailand 최적화": "Google Thailand Optimization",
  "병원 특화 SEO": "Healthcare AI",
  "AI 검색 노출": "AI Search Visibility",
  "성능 최적화": "Performance Optimization",
  "모바일 최적화": "Mobile Optimization",
  "접근성/UX": "Accessibility / UX",
  "국제화/다국어": "Internationalization",
};
function localCatName(name: string, country: CountryCode): string {
  return country === "th" ? (categoryNameEN[name] || name) : name;
}
const REPORT_LANGS: { value: ReportLang; label: string; FlagIcon: React.FC<{ size?: number }> }[] = [
  { value: "ko", label: "한국어", FlagIcon: FlagKR },
  { value: "en", label: "English", FlagIcon: FlagUS },
  { value: "th", label: "ภาษาไทย", FlagIcon: FlagTH },
];

function PdfDownloadButton({ url, country = "kr", result, specialty }: { url: string; country?: "kr" | "th"; result?: any; specialty?: string }) {
  const [selectedLang, setSelectedLang] = useState<ReportLang>(country === "th" ? "en" : "ko");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setShowLangMenu(false);
    setIsPending(true);
    setError(null);
    try {
      // 서버사이드 PDFKit으로 PDF 생성 (한국어/태국어 폰트 지원)
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
        // Fetch the PDF as blob and trigger direct download (no new tab)
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
    } catch (err) {
      setError("PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsPending(false);
    }
  };

  const currentLang = REPORT_LANGS.find(l => l.value === selectedLang)!;

  return (
    <div className="relative inline-flex flex-col">
      <div className="inline-flex items-center">
        {/* 언어 선택 토글 */}
        <button
          type="button"
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="inline-flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium rounded-l-full border border-r-0 border-brand/30 text-brand hover:bg-brand/10 transition-all"
        >
          <currentLang.FlagIcon size={18} />
          <span className="text-xs">{currentLang.label}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {/* 다운로드 버튼 */}
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
      {/* 에러 메시지 */}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {/* 언어 드롭다운 */}
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

/* ── 분석 중 단계별 프로그레스 컴포넌트 ── */
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

function AnalysisProgress({ country = "kr" }: { country?: "kr" | "th" }) {
  const steps = country === "th" ? ANALYSIS_STEPS_TH : ANALYSIS_STEPS_KR;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < steps.length; i++) {
      elapsed += steps[i - 1].duration;
      timers.push(setTimeout(() => setCurrentStep(i), elapsed));
    }
    return () => timers.forEach(clearTimeout);
  }, [steps]);

  const progress = Math.min(((currentStep + 1) / steps.length) * 100, 95);

  return (
    <div className="mt-12 animate-fade-in max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6">
        {/* 프로그레스 바 */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-brand rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* 단계 목록 */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
              i < currentStep ? "text-brand" : i === currentStep ? "text-foreground font-medium" : "text-muted-foreground/40"
            }`}>
              {i < currentStep ? (
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground/20 shrink-0" />
              )}
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailReportButton({ url, country = "kr", result, specialty }: { url: string; country?: "kr" | "th"; result?: any; specialty?: string }) {
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

/**
 * 바이럴 공유 툴바 — 카카오톡 / URL 복사 / QR코드 / 이미지 카드
 */
function ShareToolbar({ result, country = "kr" }: { result: SeoResult; country?: "kr" | "th" }) {
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
      // fallback
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
      // Kakao SDK not loaded, fallback to KakaoTalk share via scheme
      // 모바일: 카카오톡 앱으로 URL 공유 시도, 데스크톱: URL 복사 안내
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

      {/* 메인 공유 버튼 — 3열 그리드 */}
      <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto mb-3">
        {/* 카카오톡 / LINE */}
        {country === "th" ? (
          <button
            onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, "_blank", "width=500,height=600")}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#06C755]/10 border border-[#06C755]/20 hover:bg-[#06C755]/20 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-[#06C755]" />
            <span className="text-[11px] font-medium text-[#06C755]">LINE</span>
          </button>
        ) : (
          <button
            onClick={handleKakao}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#FEE500]/10 border border-[#FEE500]/20 hover:bg-[#FEE500]/20 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-[#FEE500]" />
            <span className="text-[11px] font-medium text-[#FEE500]">KakaoTalk</span>
          </button>
        )}

        {/* URL 복사 */}
        <button
          onClick={handleCopy}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all"
        >
          {copied ? (
            <><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-[11px] font-medium text-emerald-400">복사 완료</span></>
          ) : (
            <><Copy className="w-5 h-5 text-muted-foreground" /><span className="text-[11px] font-medium text-muted-foreground">URL 복사</span></>
          )}
        </button>

        {/* QR코드 */}
        <button
          onClick={() => setShowQr(!showQr)}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all"
        >
          <QrCode className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">QR코드</span>
        </button>

        {/* 스코어카드 */}
        <button
          onClick={() => setShowCard(!showCard)}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all"
        >
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">스코어카드</span>
        </button>

        {/* 네이버 밴드 / Facebook */}
        {country === "th" ? (
          <button
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=500,height=600")}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all"
          >
            <Globe className="w-5 h-5 text-[#1877F2]" />
            <span className="text-[11px] font-medium text-[#1877F2]">Facebook</span>
          </button>
        ) : (
          <button
            onClick={() => window.open(`https://band.us/plugin/share?body=${encodeURIComponent(`${shareTitle}\n\n${shareDesc}\n\n나도 진단해보기: ${shareUrl}`)}`, "_blank", "width=500,height=600")}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#6CC655]/10 border border-[#6CC655]/20 hover:bg-[#6CC655]/20 transition-all"
          >
            <UsersIcon className="w-5 h-5 text-[#6CC655]" />
            <span className="text-[11px] font-medium text-[#6CC655]">네이버 밴드</span>
          </button>
        )}

        {/* 문자 공유 */}
        <a
          href={`sms:?body=${encodeURIComponent(`${shareTitle}\n나도 진단해보기: ${shareUrl}`)}`}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all"
        >
          <Smartphone className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">문자 공유</span>
        </a>
      </div>

      {/* 경쟁병원 비교 CTA — 별도 강조 */}
      <div className="flex justify-center">
        <a
          href="/seo-compare"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
        >
          <Trophy className="w-4 h-4" />
          경쟁병원 비교 도전
        </a>
      </div>

      {/* QR코드 팝업 */}
      {showQr && (
        <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
          <div className="p-4 bg-white rounded-xl">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
          </div>
          <p className="text-xs text-muted-foreground">이 QR코드를 스캔하면 진단 결과 페이지로 이동합니다</p>
          <a
            href={qrUrl}
            download={`seo-qr-${result.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-")}.png`}
            className="text-xs text-brand hover:underline"
          >
            QR코드 다운로드
          </a>
        </div>
      )}

      {/* 이미지 스코어카드 */}
      {showCard && (
        <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
          <div
            id="score-card"
            className="w-[400px] p-6 rounded-2xl text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)" }}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, oklch(0.72 0.14 200) 0.5px, transparent 0.5px)", backgroundSize: "12px 12px" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand" />
                </div>
                <span className="text-sm font-bold text-brand">MY비서 AI+포털 노출 진단</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 truncate">{result.url}</p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-bold" style={{ color: gradeColor }}>{result.totalScore}</span>
                <span className="text-lg text-gray-400">/100</span>
                <span className="text-2xl font-bold" style={{ color: gradeColor }}>{result.grade}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-emerald-400/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-emerald-400">{result.summary.passed}</p>
                  <p className="text-[10px] text-gray-400">통과</p>
                </div>
                <div className="bg-amber-400/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-400">{result.summary.warnings}</p>
                  <p className="text-[10px] text-gray-400">주의</p>
                </div>
                <div className="bg-red-400/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-400">{result.summary.failed}</p>
                  <p className="text-[10px] text-gray-400">실패</p>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400">나도 진단해보기 → mybiseo.com/seo-check</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">스크린샷을 찍어 SNS에 공유해 보세요!</p>
        </div>
      )}
    </div>
  );
}

const categoryIcons: Record<string, React.ReactNode> = {
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

function StatusIcon({ status }: { status: SeoCheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (status === "fail") return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
  return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "oklch(0.72 0.19 155)" : score >= 60 ? "oklch(0.75 0.18 85)" : score >= 40 ? "oklch(0.75 0.18 60)" : "oklch(0.65 0.24 25)";

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="oklch(0.22 0.015 260)" strokeWidth="8" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.5s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold font-display animate-fade-in"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground mt-1">/ 100점</span>
        <span className="text-lg font-bold mt-1" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function CategoryCard({ category, index, initialExpanded = false }: { category: CategoryResult; index: number; initialExpanded?: boolean }) {
  const country = useCountry();
  const [expanded, setExpanded] = useState(initialExpanded);
  const percent = category.maxScore > 0 ? Math.round((category.score / category.maxScore) * 100) : 0;
  const failCount = category.items.filter(i => i.status === "fail").length;
  const warnCount = category.items.filter(i => i.status === "warning").length;
  const catDisplayName = localCatName(category.name, country);

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in"
    >
      {/* 카테고리 헤더 — 개선: 실패/주의 뱃지 강조, 점수 바 추가 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2 rounded-lg shrink-0 ${failCount > 0 ? 'bg-red-400/10 text-red-400' : warnCount > 0 ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
            {categoryIcons[category.name] || <Globe className="w-5 h-5" />}
          </div>
          <div className="text-left min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{catDisplayName}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              {failCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-400/15 text-red-400 text-xs font-semibold">
                  <XCircle className="w-3 h-3" /> {failCount}{t(country, "개 실패", " failed")}
                </span>
              )}
              {warnCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3" /> {warnCount}{t(country, "개 주의", " warnings")}
                </span>
              )}
              {failCount === 0 && warnCount === 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> {t(country, "모두 통과", "All passed")}
                </span>
              )}
            </div>
            {/* 프로그레스 바 — 확대 */}
            <div className="w-full h-2.5 bg-muted/50 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${percent >= 80 ? 'bg-emerald-400' : percent >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-3">
          <div className="text-right">
            <span className={`text-xl sm:text-2xl font-bold ${percent >= 80 ? 'text-emerald-400' : percent >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {percent}<span className="text-xs">%</span>
            </span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* 항목 리스트 */}
      {expanded && (
        <div
          className="border-t border-border"
          style={{
            animation: "slideDown 0.3s ease-out",
          }}
        >
          {category.items.map((item) => (
            <CheckItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckItemRow({ item }: { item: SeoCheckItem }) {
  const country = useCountry();
  const [open, setOpen] = useState(item.status === "fail");

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 hover:bg-accent/20 transition-colors text-left ${item.status === 'pass' ? 'py-2.5 px-4' : 'p-4'}`}
      >
        <StatusIcon status={item.status} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground break-words">{item.name}</span>
          {item.status !== "pass" && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.detail}</p>
          )}
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
        <div
          className="overflow-hidden"
          style={{ animation: "slideDown 0.2s ease-out" }}
        >
          <div className="px-4 pb-4 pl-12 space-y-3">
            {/* 개선 방법 — 가장 중요한 정보를 먼저 */}
            {item.status !== "pass" && (
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/10">
                <p className="text-xs font-medium text-brand mb-1">{t(country, "개선 방법", "Recommendation")}</p>
                <p className="text-sm text-foreground/80">{item.recommendation}</p>
              </div>
            )}

            {/* 현재 상태 + 왜 중요한지 — 컴팩트하게 */}
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

const SPECIALTIES = [
  { value: "", label: "진료과 선택" },
  { value: "치과", label: "치과" },
  { value: "피부과", label: "피부과" },
  { value: "성형외과", label: "성형외과" },
  { value: "한의원", label: "한의원" },
  { value: "정형외과", label: "정형외과" },
  { value: "안과", label: "안과" },
  { value: "산부인과", label: "산부인과" },
  { value: "종합병원", label: "종합병원" },
  { value: "소아과", label: "소아과" },
  { value: "신경외과", label: "신경외과" },
  { value: "비뇨기과", label: "비뇨기과" },
  { value: "정신건강의학과", label: "정신건강의학과" },
  { value: "내과", label: "내과" },
  { value: "이비인후과", label: "이비인후과" },
  { value: "동물병원", label: "동물병원" },
];

function BenchmarkCompare({ result, specialty }: { result: SeoResult; specialty: string }) {
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
        <div className="p-2.5 rounded-xl bg-brand/10">
          <Stethoscope className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{specialty} 평균 대비</h3>
          <p className="text-xs text-muted-foreground">동일 진료과 병원 벤치마크 비교</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-xl bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">내 병원</p>
          <p className={`text-2xl font-bold ${gradeColor}`}>{result.totalScore}<span className="text-sm">점</span></p>
        </div>
        <div className="p-3 rounded-xl bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">{specialty} 평균</p>
          <p className="text-2xl font-bold text-foreground">{avgScore}<span className="text-sm text-muted-foreground">점</span></p>
        </div>
        <div className="p-3 rounded-xl bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">평균 대비</p>
          <p className={`text-2xl font-bold ${gradeColor}`}>{isAbove ? "+" : ""}{diff}<span className="text-sm">점</span></p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-4 text-center">
        {isAbove
          ? `귀 병원은 ${specialty} 평균보다 ${absDiff}점 높습니다. 우수한 상태입니다!`
          : `귀 병원은 ${specialty} 평균보다 ${absDiff}점 낮습니다. 개선이 필요합니다.`}
      </p>
      {!isAbove && (
        <div className="mt-3 text-center">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            평균 이상으로 끌어올리기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/** 자동 웹사이트 최적화 계획 (EXIT 4번) */
function AutoOptimizationPlan({ url, specialty, result, country = "kr" }: { url: string; specialty: string; result: SeoResult; country?: "kr" | "th" }) {
  const cc = country as CountryCode;
  const [showPlan, setShowPlan] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const optimizeMutation = trpc.autoOptimizer.generatePlan.useMutation();

  const failedItems = result.categories.flatMap(c => c.items).filter(i => i.status === "fail");
  const warningItems = result.categories.flatMap(c => c.items).filter(i => i.status === "warning");
  const totalFixable = failedItems.length + warningItems.length;

  if (totalFixable === 0) return null;

  const handleGenerate = () => {
    if (optimizeMutation.data) {
      setShowPlan(!showPlan);
      return;
    }
    optimizeMutation.mutate({ url, specialty: specialty || undefined, country }, {
      onSuccess: () => setShowPlan(true),
    });
  };

  const plan = optimizeMutation.data;

  // 카테고리별 그룹화
  const groupedFixes = plan?.fixes?.reduce((acc: Record<string, typeof plan.fixes>, fix: any) => {
    const cat = fix.category || "기타";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(fix);
    return acc;
  }, {} as Record<string, typeof plan.fixes>) || {};

  return (
    <div className="mb-10 animate-fade-in">
      <div className="p-5 sm:p-6 rounded-2xl border-2 border-brand/30 bg-brand/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-brand/10">
            <Code2 className="w-6 h-6 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{t(cc, "최적화 개선 계획", "Optimization Plan")}</h3>
            <p className="text-xs text-muted-foreground">
              {t(cc, `${totalFixable}개 문제에 대한 구체적인 수정 코드를 생성합니다`, `Generate fix code for ${totalFixable} issues`)}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={optimizeMutation.isPending}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-brand to-purple-500 text-background hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-brand/20"
          >
            {optimizeMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />생성 중...</>
            ) : showPlan ? (
              <><ChevronUp className="w-4 h-4" />접기</>
            ) : (
              <><Sparkles className="w-4 h-4" />최적화 코드 생성</>
            )}
          </button>
        </div>

        {/* 요약 정보 */}
        {plan && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-background/50 text-center">
              <p className="text-xs text-muted-foreground">{t(cc, "예상 점수 상승", "Est. Score Increase")}</p>
              <p className="text-xl font-bold text-emerald-400">+{plan.estimatedNewScore - plan.currentScore}점</p>
            </div>
            <div className="p-3 rounded-xl bg-background/50 text-center">
              <p className="text-xs text-muted-foreground">{t(cc, "수정 항목", "Items to Fix")}</p>
              <p className="text-xl font-bold text-brand">{plan.fixes?.length || 0}개</p>
            </div>
            <div className="p-3 rounded-xl bg-background/50 text-center">
              <p className="text-xs text-muted-foreground">{t(cc, "예상 최종 점수", "Est. Final Score")}</p>
              <p className="text-xl font-bold text-foreground">{plan.estimatedNewScore}<span className="text-sm">점</span></p>
            </div>
          </div>
        )}

        {/* 상세 수정 코드 */}
        {showPlan && plan && (
          <div className="space-y-3 mt-4">
            {/* 우선순위별 정렬 */}
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
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-sm font-semibold text-foreground">{fix.itemName}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{fix.category}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{fix.issue}</p>
                        <div className="text-xs text-emerald-400 mb-2">💡 {fix.recommendation}</div>
                        {fix.codeSnippet && (
                          <div className="relative">
                            <pre className="p-3 rounded-lg bg-zinc-900 text-zinc-100 text-xs overflow-x-auto max-h-40 scrollbar-thin">
                              <code>{fix.codeSnippet}</code>
                            </pre>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(fix.codeSnippet);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                              title="코드 복사"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 전체 코드 다운로드 CTA */}
            <div className="mt-4 p-4 rounded-xl bg-brand/5 border border-brand/20 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {t(cc, "직접 수정이 어려우신가요? MY비서가 모두 적용해 드립니다.", "Need help implementing? Let MY BISEO handle it for you.")}
              </p>
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all"
              >
                {t(cc, "최적화 대행 신청", "Request Optimization Service")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeoChecker() {
  const [url, setUrl] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [country, setCountry] = useState<"kr" | "th">("kr");
  const [result, setResult] = useState<SeoResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const { logEvent } = useEventLogger();

  const saveDiagnosisMutation = trpc.diagnosis.save.useMutation();
  const analyzeMutation = trpc.seoAnalyzer.analyze.useMutation({
    onSuccess: (data) => {
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

  // URL 쿼리 파라미터에서 자동 실행
  useEffect(() => {
    if (autoStarted) return;
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      setUrl(urlParam);
      const specParam = params.get("specialty") || "";
      if (specParam) setSpecialty(specParam);
      setAutoStarted(true);
      const countryParam = params.get("country") as "kr" | "th" || "kr";
      if (countryParam === "th") setCountry("th");
      analyzeMutation.mutate({ url: urlParam, specialty: specParam || undefined, country: countryParam });
    }
  }, [autoStarted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

          {/* URL 입력 폼 */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
            {/* 국가 선택 배지 */}
            {country === "th" && (
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-medium">
                  <FlagTH size={16} /> Thailand 기준 진단
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border shadow-lg shadow-brand/5">
              {/* 국가 선택 버튼 */}
              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={() => setCountry(country === "kr" ? "th" : "kr")}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors group relative"
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
                disabled={analyzeMutation.isPending || !url.trim()}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-background font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t(country, "분석 중...", "Analyzing...")}
                  </>
                ) : (
                  <>
                    {t(country, "진단 시작", "Start Audit")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

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
              ].map((s, i) => (
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
                      <Link
                      href="/#contact"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                    >
                      {t(country, "이 문제들을 한번에 해결하기", "Fix all issues at once")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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

            {/* CTA — 배경 강화 */}
            <div
              className="text-center space-y-4 animate-fade-in-up p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand/5 via-purple-500/5 to-transparent border border-brand/10"
            >
              <p className="text-muted-foreground">
                {t(country, "광고비에 의존하지 않는 건강한 매출 구조를 만들어 드리겠습니다.", "Build a healthy revenue structure without relying on ad spend.")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all"
                >
                  {t(country, "무료 상담 신청", "Free Consultation")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
                    <Link
                      href="/#contact"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-brand text-background hover:brightness-110 transition-all"
                    >
                      {t(country, "무료 상담", "Consult")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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

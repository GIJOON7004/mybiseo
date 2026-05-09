/*
 * HeroSection v30 — Phase 2 전면 개편
 * H1: "ChatGPT가 병원을 추천하는 시대, 우리 병원은 몇 번이나 언급되고 있을까요?"
 * H2: "무료 AI 가시성 진단으로 30초 만에 확인하세요"
 * CTA: 무료 진단 받기 + 보조 CTA: 도입 사례 보기
 * 신뢰 신호: 도입 병원 수, AI 심의 통과율, 평균 온보딩
 */
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
const HeroMobileBackground = lazy(() => import("@/components/HeroMobileBackground"));
const HeroDesktopBackground = lazy(() => import("@/components/HeroDesktopBackground"));
import {
  ArrowRight,
  Search,
  Shield,
  CheckCircle2,
  ChevronDown,
  Zap,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  Award,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";

/* ── 실시간 알림 데이터 ── */
const LIVE_ALERTS = [
  "강남 A치과 — AI 가시성 점수 72점 → 진단 완료",
  "분당 B피부과 — ChatGPT 추천 노출 확인",
  "서초 C정형외과 — AI 검색 최적화 도입",
  "판교 D안과 — 무료 진단 후 상담 전환",
  "해운대 E치과 — AI 가시성 모니터링 시작",
  "역삼 F성형외과 — 의료법 자동 검수 도입",
];

/* ── 신뢰 지표 ── */
const TRUST_METRICS = [
  { icon: Building2, value: "127+", label: "도입 병원" },
  { icon: Award, value: "98%", label: "AI 심의 통과율" },
  { icon: Clock, value: "7일", label: "평균 온보딩" },
];

/* ── CSS 애니메이션 ── */
const heroStyles = `
@keyframes hero-fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes hero-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes hero-scaleIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes hero-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
@keyframes hero-alertSlide {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.hero-fadeUp { animation: hero-fadeUp 0.6s ease-out both; }
.hero-fadeIn { animation: hero-fadeIn 0.5s ease-out both; }
.hero-scaleIn { animation: hero-scaleIn 0.7s ease-out both; }
.hero-bounce { animation: hero-bounce 1.8s ease-in-out infinite; }
.hero-alertSlide { animation: hero-alertSlide 0.3s ease-out both; }
`;

export default function HeroSection() {
  const [, navigate] = useLocation();
  const [checkUrl, setCheckUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [alertIdx, setAlertIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* 플레이스홀더 타이핑 효과 */
  const PLACEHOLDERS = [
    "예: gangnam-dental.co.kr",
    "예: seoul-derma.com",
    "예: smile-ortho.kr",
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");

  useEffect(() => {
    if (checkUrl) return;
    const target = PLACEHOLDERS[placeholderIdx];
    let charIdx = 0;
    const typeTimer = setInterval(() => {
      charIdx++;
      setDisplayedPlaceholder(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeTimer);
        setTimeout(() => {
          setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 2200);
      }
    }, 65);
    return () => clearInterval(typeTimer);
  }, [placeholderIdx, checkUrl]);

  /* 실시간 알림 롤링 */
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertIdx((prev) => (prev + 1) % LIVE_ALERTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  /* URL 유효성 체크 */
  useEffect(() => {
    if (!checkUrl.trim()) { setUrlValid(null); return; }
    const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    setUrlValid(domainRegex.test(checkUrl.trim()));
  }, [checkUrl]);

  /* 화면 크기 감지 */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    if (window.innerWidth >= 768 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 1200);
    }
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSeoCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkUrl.trim()) return;
    navigate(`/ai-check?url=${encodeURIComponent(checkUrl.trim())}`);
  };

  return (
    <section className="relative min-h-[85svh] sm:min-h-[100svh] flex items-center justify-center overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />

      {/* ── 배경 ── */}
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, oklch(0.72 0.14 200) 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 40% at 50% 0%, oklch(0.72 0.14 200 / 0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, transparent 75%, var(--background) 100%)",
        }}
      />
      <Suspense fallback={null}>
        {isMobile === false && <HeroDesktopBackground />}
        {isMobile === true && <HeroMobileBackground />}
      </Suspense>

      {/* ── 콘텐츠 ── */}
      <div className="relative z-10 w-full px-5 sm:px-6 text-center pt-24 sm:pt-32 pb-12 sm:pb-16 max-w-4xl mx-auto">

        {/* 실시간 알림 롤링 */}
        <div
          className="hero-fadeUp flex items-center justify-center gap-2 mb-6 sm:mb-8"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-brand/20 bg-brand/5 overflow-hidden max-w-[340px] sm:max-w-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span
              key={alertIdx}
              className="hero-alertSlide text-[10px] sm:text-[13px] text-brand font-medium whitespace-nowrap"
            >
              {LIVE_ALERTS[alertIdx]}
            </span>
          </div>
        </div>

        {/* H1 — 메인 헤드라인 */}
        <h1
          className="hero-fadeUp relative font-display font-black text-foreground leading-[1.15] mb-4 sm:mb-6"
          style={{
            fontSize: "clamp(1.4rem, 4vw, 2.8rem)",
            letterSpacing: "-0.02em",
            wordBreak: "keep-all",
            animationDelay: "0.12s",
          }}
        >
          <span
            className="absolute inset-0 blur-[60px] opacity-20 pointer-events-none"
            aria-hidden="true"
            style={{
              background: "radial-gradient(ellipse 60% 80% at 30% 50%, oklch(0.72 0.14 200 / 0.6) 0%, transparent 70%)",
            }}
          />
          <span className="relative">
            <span className="text-brand">ChatGPT</span>가 병원을 추천하는 시대,
            <br className="hidden sm:block" />
            {" "}우리 병원은 몇 번이나 언급되고 있을까요?
          </span>
        </h1>

        {/* H2 — 서브 헤드라인 */}
        <p
          className="hero-fadeUp font-display font-semibold text-muted-foreground/70 mb-8 sm:mb-12"
          style={{
            fontSize: "clamp(0.85rem, 1.5vw + 0.15rem, 1.2rem)",
            letterSpacing: "0.01em",
            animationDelay: "0.18s",
          }}
        >
          무료 AI 가시성 진단으로 <span className="text-brand font-bold">30초</span> 만에 확인하세요
        </p>

        {/* ★ 무료 진단 카드 ★ */}
        <div
          className="hero-scaleIn max-w-[480px] mx-auto mb-8 sm:mb-10"
          style={{ animationDelay: "0.25s" }}
        >
          <div
            className={`relative rounded-2xl p-4 sm:p-7 transition-all duration-500 backdrop-blur-sm ${
              isFocused
                ? "shadow-[0_0_40px_rgba(0,200,180,0.18)]"
                : "shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
            }`}
            style={{
              background: "oklch(0.16 0.012 260 / 0.85)",
              border: `1px solid ${isFocused ? "oklch(0.72 0.14 200 / 0.35)" : "oklch(0.3 0.02 260 / 0.6)"}`,
            }}
          >
            <form onSubmit={handleSeoCheck} className="space-y-3">
              {/* URL 입력 */}
              <div
                className="flex items-center rounded-xl px-3 sm:px-4 transition-all duration-300"
                style={{
                  background: "oklch(0.98 0.005 260)",
                  border: `1.5px solid ${isFocused ? "oklch(0.72 0.14 200 / 0.5)" : "oklch(0.85 0.01 260)"}`,
                  boxShadow: isFocused ? "0 0 0 3px oklch(0.72 0.14 200 / 0.1)" : "none",
                }}
              >
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={checkUrl}
                  onChange={(e) => setCheckUrl(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={checkUrl ? "" : displayedPlaceholder}
                  aria-label="병원 홈페이지 URL 입력"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] placeholder:text-gray-400 min-h-[40px] sm:min-h-[48px] px-2"
                  style={{ color: "oklch(0.2 0.015 260)" }}
                />
                {urlValid === true && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                )}
              </div>
              {/* CTA 버튼 */}
              <button
                type="submit"
                disabled={!checkUrl.trim()}
                className="w-full flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[56px] px-6 text-[14px] sm:text-[16px] font-bold rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,200,180,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 180))",
                }}
              >
                <Search className="w-4 h-4" />
                무료 AI 가시성 진단 받기
              </button>
            </form>
            {/* 보안 시그널 */}
            <div className="flex items-center justify-between mt-3 px-0.5">
              <p className="text-[10px] sm:text-[11px] text-foreground/60">
                <span className="text-brand font-bold">30초</span>면 AI 노출 현황을 확인할 수 있습니다
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/50">
                <Shield className="w-3 h-3" />
                안전
              </span>
            </div>
            {/* 진단 항목 미리보기 */}
            <div className="mt-3 sm:mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
                {[
                  { icon: Bot, label: "ChatGPT" },
                  { icon: BrainCircuit, label: "Perplexity" },
                  { icon: BarChart3, label: "네이버" },
                  { icon: Zap, label: "구글" },
                ].map(({ icon: Icon, label }, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground/50 shrink-0"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 보조 CTA — 도입 사례 보기 */}
        <div
          className="hero-fadeIn mb-8 sm:mb-10"
          style={{ animationDelay: "0.5s" }}
        >
          <button
            onClick={() => {
              const el = document.getElementById("results");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-brand bg-brand/10 border border-brand/20 hover:bg-brand/20 transition-colors cursor-pointer"
          >
            도입 사례 보기
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 신뢰 지표 배지 */}
        <div
          className="hero-fadeIn flex items-center justify-center gap-4 sm:gap-8 flex-wrap"
          style={{ animationDelay: "0.7s" }}
        >
          {TRUST_METRICS.map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-[13px] sm:text-[15px] font-bold text-foreground">{value}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground/60">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 스크롤 힌트 */}
      <div
        className="hero-fadeIn absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ animationDelay: "1.5s" }}
      >
        <div
          className="hero-bounce cursor-pointer"
          onClick={() => {
            const next = document.querySelector("section:nth-of-type(2)");
            if (next) next.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground/30" />
        </div>
      </div>
    </section>
  );
}

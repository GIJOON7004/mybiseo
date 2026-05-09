/*
 * v27: 히어로 — 국가 선택을 탭 버튼 방식으로 변경 (확실한 작동 보장)
 * - 입력란 위에 큰 탭 버튼 2개 (한국/태국)
 * - 인라인 SVG 국기로 크기·호환성 보장
 * - 네이티브 select 제거 → 탭 버튼으로 교체
 */
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";

// Lazy load backgrounds — only mount the one matching screen size
const HeroMobileBackground = lazy(() => import("@/components/HeroMobileBackground"));
const HeroDesktopBackground = lazy(() => import("@/components/HeroDesktopBackground"));
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Search,
  Shield,
  CheckCircle2,
  ChevronDown,
  Globe,
  Zap,
  BarChart3,
  FileSearch,
  Stethoscope,
  TrendingUp,
  Bot,
  BrainCircuit,
  Plane,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

/* ── 국가별 플레이스홀더 ── */
const PLACEHOLDERS_KR = [
  "예: gangnam-dental.co.kr",
  "예: seoul-derma.com",
  "예: smile-ortho.kr",
];
const PLACEHOLDERS_TH = [
  "예: editionbkk.com",
  "예: bangkok-clinic.co.th",
  "예: phuket-dental.com",
];

type CountryCode = "kr" | "th";

/* ── 국기 이미지 컴포넌트 (flagcdn.com CDN 사용 — 정확한 국기 보장) ── */
const FLAG_URLS: Record<CountryCode, string> = {
  kr: "https://flagcdn.com/w160/kr.png",
  th: "https://flagcdn.com/w160/th.png",
};

function FlagKR({ size = 24 }: { size?: number }) {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src={FLAG_URLS.kr}
      alt="대한민국 국기"
      width={size}
      height={h}
      className="rounded-[3px] shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
}

function FlagTH({ size = 24 }: { size?: number }) {
  const h = Math.round(size * 2 / 3);
  return (
    <img
      src={FLAG_URLS.th}
      alt="태국 국기"
      width={size}
      height={h}
      className="rounded-[3px] shrink-0 object-cover"
      style={{ width: size, height: h }}
      loading="eager"
    />
  );
}

const COUNTRY_OPTIONS: { code: CountryCode; name: string; nameEn: string }[] = [
  { code: "kr", name: "한국", nameEn: "Korea" },
  { code: "th", name: "태국", nameEn: "Thailand" },
];

/* ── 국가 드롭다운 (Portal용) ── */
function CountryDropdown({
  country,
  setCountry,
  setShowCountryMenu,
  anchorRef,
  renderFlag,
  portalRef,
}: {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  setShowCountryMenu: (v: boolean) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  renderFlag: (code: CountryCode, size: number) => React.ReactNode;
  portalRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [anchorRef]);

  return (
    <div
      ref={portalRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 99999,
        minWidth: 180,
      }}
      className="rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      <div style={{ background: "#ffffff" }}>
        {COUNTRY_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => {
              setCountry(opt.code);
              setShowCountryMenu(false);
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium transition-colors cursor-pointer ${
              country === opt.code
                ? "bg-teal-50 text-teal-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {renderFlag(opt.code, 24)}
            <span>{opt.name}</span>
            <span className="text-[11px] text-gray-400 ml-auto">{opt.nameEn}</span>
            {country === opt.code && (
              <CheckCircle2 className="w-4 h-4 text-teal-600 ml-1" />
            )}
          </button>
        ))}
        <div className="px-4 py-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 italic">미국·일본 확장 예정</span>
        </div>
      </div>
    </div>
  );
}

/* ── 실시간 알림 데이터 ── */
const LIVE_ALERTS = [
  "강남 A치과 — AI 챗봇 도입 후 야간 예약 전환율 1.8배 상승",
  "분당 B피부과 — 중국·일본 신환 고객 유치 성공",
  "서초 C정형외과 — AI 예약 시스템으로 상담 응대 시간 단축",
  "방콕 D성형외과 — AI 가시성 진단 도입",
  "판교 E안과 — AI 인용 최적화로 온라인 문의 증가",
  "해운대 F치과 — 콘텐츠 전략으로 마케팅 효율 개선",
];

/* ── CSS 애니메이션 keyframes ── */
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
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const [country, setCountry] = useState<CountryCode>("kr");
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  /* 실시간 알림 롤링 */
  const [alertIdx, setAlertIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertIdx((prev) => (prev + 1) % LIVE_ALERTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  /* 국가별 플레이스홀더 */
  const placeholders = country === "kr" ? PLACEHOLDERS_KR : PLACEHOLDERS_TH;

  /* 타이핑 애니메이션 */
  useEffect(() => {
    if (checkUrl) return;
    const target = placeholders[placeholderIdx % placeholders.length];
    let charIdx = 0;
    setDisplayedPlaceholder("");

    const typeTimer = setInterval(() => {
      charIdx++;
      setDisplayedPlaceholder(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeTimer);
        setTimeout(() => {
          setPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
        }, 2200);
      }
    }, 65);

    return () => clearInterval(typeTimer);
  }, [placeholderIdx, checkUrl, country]);

  /* URL 유효성 실시간 체크 */
  useEffect(() => {
    if (!checkUrl.trim()) {
      setUrlValid(null);
      return;
    }
    const domainRegex =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    setUrlValid(domainRegex.test(checkUrl.trim()));
  }, [checkUrl]);

  /* 화면 크기 감지 + 데스크톱 자동 포커스 */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    if (window.innerWidth >= 768 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 1200);
    }
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* 국가 변경 시 플레이스홀더 리셋 */
  useEffect(() => {
    setPlaceholderIdx(0);
    setDisplayedPlaceholder("");
  }, [country]);

  const handleScroll = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSeoCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkUrl.trim()) return;
    navigate(`/ai-check?url=${encodeURIComponent(checkUrl.trim())}&country=${country}`);
  };

  /* 국기 렌더링 헬퍼 */
  const renderFlag = (code: CountryCode, size: number = 24) => {
    return code === "kr" ? <FlagKR size={size} /> : <FlagTH size={size} />;
  };

  /* 국가 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inAnchor = countryMenuRef.current?.contains(target);
      const inPortal = dropdownPortalRef.current?.contains(target);
      if (!inAnchor && !inPortal) {
        setShowCountryMenu(false);
      }
    };
    if (showCountryMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCountryMenu]);

  return (
    <section className="relative min-h-[85svh] sm:min-h-[100svh] flex items-center justify-center overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />

      {/* ── 배경 ── */}
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.72 0.14 200) 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, oklch(0.72 0.14 200 / 0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 75%, var(--background) 100%)",
        }}
      />


      {/* 조건부 배경 — 모바일에서 Desktop 컴포넌트 마운트 방지 */}
      <Suspense fallback={null}>
        {isMobile === false && <HeroDesktopBackground />}
        {isMobile === true && <HeroMobileBackground />}
      </Suspense>

      {/* ── 콘텐츠 ── */}
      <div className="relative z-10 w-full px-5 sm:px-6 text-center pt-24 sm:pt-32 pb-12 sm:pb-16">

        {/* AI 표준 배지 */}
        <div
          className="hero-fadeUp flex items-center justify-center gap-2 mb-3 sm:mb-4"
          style={{ animationDelay: "0s" }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-brand/25 bg-brand/8">
            <Globe className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] sm:text-[12px] text-brand font-semibold tracking-wide">
              Global Standard Medical Marketing Platform
            </span>
          </div>
        </div>

        {/* 실시간 알림 롤링 */}
        <div
          className="hero-fadeUp flex items-center justify-center gap-2 mb-6 sm:mb-10"
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

        {/* 1행: 리드인 캡션 */}
        <p
          className="hero-fadeUp font-display font-normal text-muted-foreground/50 mb-3 sm:mb-4"
          style={{
            fontSize: "clamp(0.75rem, 1.2vw + 0.2rem, 1.05rem)",
            letterSpacing: "0.06em",
            animationDelay: "0.06s",
          }}
        >
          원장님이 진료하는 동안에도
        </p>

        {/* 2행: 메인 헤드라인 */}
        <h1
          className="hero-fadeUp relative font-display font-black text-foreground leading-[1.05] mb-3 sm:mb-5"
          style={{
            fontSize: "clamp(1.5rem, 4.5vw, 3.2rem)",
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
            <span className="text-brand">신환</span>은 쉬지 않고 옵니다
          </span>
        </h1>

        {/* 서브 헤드라인 */}
        <p
          className="hero-fadeUp font-display font-semibold text-muted-foreground/60 mb-5 sm:mb-8"
          style={{
            fontSize: "clamp(0.8rem, 1.4vw + 0.15rem, 1.15rem)",
            letterSpacing: "0.02em",
            animationDelay: "0.14s",
          }}
        >
          <span className="text-brand">AI 검색 최적화</span>로 광고 없이 환자가 찾아옵니다
        </p>

        {/* 서브카피 */}
        <div
          className="hero-fadeUp max-w-xl mx-auto mb-8 sm:mb-14 space-y-1.5 sm:space-y-2"
          style={{ animationDelay: "0.15s" }}
        >
          <p className="text-muted-foreground/70 text-[12px] sm:text-[15px] leading-relaxed">
            매출의 30%를 광고비로 쓰고 계신가요?
          </p>
          <p className="text-foreground/80 text-[12px] sm:text-[15px] leading-relaxed font-medium">
            환자가 AI나 포털에서 검색할 때 우리 병원이 먼저 보이면
          </p>
          <p className="text-foreground/80 text-[12px] sm:text-[15px] leading-relaxed font-medium">
            광고비를 줄여도 해외 신환이 자연스럽게 늘어납니다
          </p>
        </div>

        {/* ★ 무료 진단 카드 ★ */}
        <div
          className="hero-scaleIn max-w-[460px] mx-auto mb-8 sm:mb-8"
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
            {/* 도발형 카피 */}
            <p className="text-[12px] sm:text-[14px] text-foreground/80 font-medium mb-4 sm:mb-5">
              <Stethoscope className="w-4 h-4 inline-block mr-1.5 text-brand -mt-0.5" />
              우리 병원, AI와 포털사이트에 노출되고 있을까요?
            </p>

            {/* 입력란 + 버튼 */}
            <form onSubmit={handleSeoCheck}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div
                  className={`flex-1 flex items-center gap-0 rounded-xl overflow-visible min-h-[44px] sm:min-h-[52px] transition-all duration-300 ${
                    isFocused
                      ? "ring-2 ring-brand/40 shadow-[0_0_12px_rgba(0,200,180,0.1)]"
                      : ""
                  }`}
                  style={{
                    background: "oklch(0.96 0.003 260)",
                  }}
                >
                  {/* 국기 클릭 → 드롭다운 메뉴로 국가 선택 */}
                  <div className="shrink-0" ref={countryMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryMenu(!showCountryMenu)}
                      className="flex items-center gap-1 pl-3 pr-1.5 min-h-[44px] cursor-pointer hover:bg-gray-100/80 transition-colors rounded-l-xl group"
                      aria-label="국가 선택"
                      aria-expanded={showCountryMenu}
                      title={country === "kr" ? "한국 기준 진단 (클릭하여 국가 변경)" : "태국 기준 진단 (클릭하여 국가 변경)"}
                    >
                      {renderFlag(country, 28)}
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-all duration-200 ${showCountryMenu ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* 드롭다운 메뉴 — Portal로 body에 직접 렌더링 */}
                  {showCountryMenu && createPortal(
                    <CountryDropdown
                      country={country}
                      setCountry={setCountry}
                      setShowCountryMenu={setShowCountryMenu}
                      anchorRef={countryMenuRef}
                      renderFlag={renderFlag}
                      portalRef={dropdownPortalRef}
                    />,
                    document.body
                  )}

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
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3" />
                  )}
                </div>

                {/* CTA 버튼 */}
                <button
                  type="submit"
                  disabled={!checkUrl.trim()}
                  className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[52px] px-6 sm:px-7 text-[13px] sm:text-[15px] font-bold rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,200,180,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer sm:whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 180))",
                  }}
                >
                  <Search className="w-4 h-4" />
                  무료 진단
                </button>
              </div>
            </form>

            {/* 10초 트리거 + 보안 시그널 */}
            <div className="flex items-center justify-between mt-3 sm:mt-4 px-0.5">
              <p className="text-[10px] sm:text-[11px] text-foreground/60">
                <span className="text-brand font-bold">10초</span>면 AI+포털 노출 현황을 알 수 있습니다
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/50">
                <Shield className="w-3 h-3" />
                안전
              </span>
            </div>

            {/* 진단 항목 미리보기 */}
            <div className="mt-3 sm:mt-5 pt-3 sm:pt-4.5 border-t border-border/30">
              <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                {[
                  { icon: Bot, label: "AI 가시성 진단" },
                  { icon: BarChart3, label: "포털 노출" },
                  { icon: BrainCircuit, label: "AI 크롤러" },
                  { icon: Plane, label: "해외 진단" },
                  { icon: Zap, label: "신뢰도 평가" },
                ].map(({ icon: Icon, label }, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] text-muted-foreground/40 shrink-0 whitespace-nowrap"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                ))}
                <p className="text-[9px] sm:text-[11px] text-muted-foreground/50 font-medium shrink-0 ml-auto">진단 항목</p>
              </div>
            </div>
          </div>
        </div>

        {/* 신뢰 배지 */}
        <div
          className="hero-fadeIn flex flex-col items-center gap-4 sm:gap-5"
          style={{ animationDelay: "0.7s" }}
        >
          {/* 신뢰 배지 */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {["무료 진단 제공", "맞춤 전략 수립", "데이터 기반 분석"].map(
              (text, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[12px] font-semibold tracking-wide"
                  style={{
                    background: "oklch(0.72 0.14 200 / 0.1)",
                    color: "oklch(0.78 0.14 200)",
                    border: "1px solid oklch(0.72 0.14 200 / 0.2)",
                  }}
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  {text}
                </span>
              )
            )}
          </div>
          {/* AI 블로그 체험 CTA */}
          <a
            href="/ai-blog-trial"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-brand bg-brand/10 border border-brand/20 hover:bg-brand/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI 블로그 체험
          </a>
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

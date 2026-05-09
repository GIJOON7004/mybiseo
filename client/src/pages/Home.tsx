import { useEffect, lazy, Suspense, useRef, useState } from "react";
import { useEventLogger } from "@/hooks/useEventLogger";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

// Below-the-fold: lazy load for faster initial paint
const StakesSection = lazy(() => import("@/components/StakesSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const TimelineSection = lazy(() => import("@/components/TimelineSection"));
const PriceCompareSection = lazy(() => import("@/components/PriceCompareSection"));
const TechSection = lazy(() => import("@/components/TechSection"));
const ResultsSection = lazy(() => import("@/components/ResultsSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const CEOSection = lazy(() => import("@/components/CEOSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const FooterCTASection = lazy(() => import("@/components/FooterCTASection"));
const Footer = lazy(() => import("@/components/Footer"));
const ChatBot = lazy(() => import("@/components/ChatBot"));

/**
 * LazySection — renders children only when near viewport.
 * Uses IntersectionObserver with generous rootMargin
 * so chunks load BEFORE user scrolls to them.
 */
function LazySection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <Suspense fallback={<div className="min-h-[20px]" />}>
          {children}
        </Suspense>
      ) : (
        <div className="min-h-[20px]" />
      )}
    </div>
  );
}

/**
 * Prefetch below-the-fold chunks after initial paint.
 */
function usePrefetchSections() {
  useEffect(() => {
    const prefetch = () => {
      // Priority 1: 스크롤 직후 보이는 섹션들
      import("@/components/StakesSection");
      import("@/components/ServicesSection");

      // Priority 2: 나머지
      setTimeout(() => {
        import("@/components/TimelineSection");
        import("@/components/PriceCompareSection");
        import("@/components/TechSection");
        import("@/components/ResultsSection");
        import("@/components/PricingSection");
        import("@/components/CEOSection");
        import("@/components/FAQSection");
        import("@/components/FooterCTASection");
        import("@/components/Footer");
        import("@/components/ChatBot");
      }, 3000);
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(prefetch, { timeout: 3000 });
    } else {
      setTimeout(prefetch, 1000);
    }
  }, []);
}

export default function Home() {
  useEventLogger();

  useEffect(() => {
    document.title = "마이비서(MY비서) | AI 의료 마케팅 플랫폼 — AI 검색 최적화 · 의료관광 · 환자 유치";
  }, []);

  usePrefetchSections();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* ─── 1. HERO: 핵심 가치 + 진단 CTA ─── */}
        <HeroSection />

        {/* ─── 2. Stakes: 데이터가 보여주는 현실 ─── */}
        <LazySection><StakesSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 3. 서비스 카드 (3압도 + 2보조) ─── */}
        <LazySection className="bg-card/30"><ServicesSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 4. "원장의 한 달" 타임라인 ─── */}
        <LazySection><TimelineSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 5. 차별화 비교표 (3카테고리) ─── */}
        <LazySection className="bg-card/30"><PriceCompareSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 6. 기술력: 왜 MY비서인가 ─── */}
        <LazySection><TechSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 7. 성과 증명: 도입 사례 ─── */}
        <LazySection className="bg-card/30"><ResultsSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 8. 가격 안내 (맞춤 견적 CTA) ─── */}
        <LazySection><PricingSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 9. 대표 편지 ─── */}
        <LazySection className="bg-card/30"><CEOSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 10. FAQ ─── */}
        <LazySection><FAQSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 11. 푸터 CTA: 마지막 전환 기회 ─── */}
        <LazySection className="bg-card/30"><FooterCTASection /></LazySection>
      </main>
      <Suspense fallback={null}>
        <Footer />
        <ChatBot />
      </Suspense>
    </div>
  );
}

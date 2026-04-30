import { useEffect, lazy, Suspense, useRef, useState } from "react";
import { useEventLogger } from "@/hooks/useEventLogger";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

// Below-the-fold: lazy load for faster initial paint
const StakesSection = lazy(() => import("@/components/StakesSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const ProcessSection = lazy(() => import("@/components/ProcessSection"));
const TechSection = lazy(() => import("@/components/TechSection"));
const ResultsSection = lazy(() => import("@/components/ResultsSection"));
const ROICalculator = lazy(() => import("@/components/ROICalculator"));
const PriceCompareSection = lazy(() => import("@/components/PriceCompareSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
// GuaranteeSection 삭제됨
const RoadmapSection = lazy(() => import("@/components/RoadmapSection"));
const EmpathySection = lazy(() => import("@/components/EmpathySection"));
const CEOSection = lazy(() => import("@/components/CEOSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
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
        import("@/components/ProcessSection");
        import("@/components/TechSection");
        import("@/components/ResultsSection");
        import("@/components/ROICalculator");
        import("@/components/PriceCompareSection");
        import("@/components/PricingSection");
        // GuaranteeSection 삭제됨
        import("@/components/RoadmapSection");
        import("@/components/CEOSection");
        import("@/components/FAQSection");
        import("@/components/ContactSection");
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

        {/* ─── 3. 해결책 제시: 12개 서비스 (발견→전환→유지확장 = 매출 상승) ─── */}
        <LazySection className="bg-card/30"><ServicesSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 4. 비교: 일반 업체 vs MY비서 ─── */}
        <LazySection><PriceCompareSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 5. 차별화: 왜 MY비서인가 (기술력) ─── */}
        <LazySection className="bg-card/30"><TechSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 6. 도입 프로세스 ─── */}
        <LazySection><ProcessSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 7. 성과 증명: 도입 사례 ─── */}
        <LazySection className="bg-card/30"><ResultsSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 8. ROI 계산기 ─── */}
        <LazySection><ROICalculator /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 9. 가격 안내 ─── */}
        <LazySection className="bg-card/30"><PricingSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />



        {/* ─── 11. 로드맵 ─── */}
        <LazySection className="bg-card/30"><RoadmapSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 12. 대표 편지 ─── */}
        <LazySection><CEOSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 13. FAQ ─── */}
        <LazySection className="bg-card/30"><FAQSection /></LazySection>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {/* ─── 14. 전환 유도: 상담 신청 ─── */}
        <LazySection><ContactSection /></LazySection>
      </main>
      <Suspense fallback={null}>
        <Footer />
        <ChatBot />
      </Suspense>
    </div>
  );
}

/**
 * FooterCTASection — 페이지 최하단 마지막 전환 기회
 * "지금 바로 무료 AI 가시성 진단 받기"
 */
import { FadeInSection } from "@/components/FadeInSection";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FooterCTASection() {
  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: "linear-gradient(135deg, oklch(0.6 0.2 250) 0%, oklch(0.5 0.15 270) 50%, oklch(0.6 0.2 200) 100%)" }}
        />
      </div>

      <div className="container relative z-10 max-w-3xl text-center">
        <FadeInSection delay={0}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            지금 시작하세요
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-4">
            AI가 우리 병원을<br />
            <span className="text-brand">추천하도록</span> 만들어 보세요
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8">
            30초 만에 무료 AI 가시성 진단을 받아보세요.<br />
            ChatGPT, Gemini, Perplexity에서 우리 병원이 얼마나 노출되는지 확인할 수 있습니다.
          </p>

          <a
            href="/ai-check"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand text-white font-semibold text-base hover:bg-brand/90 transition-all duration-200 shadow-lg shadow-brand/25 hover:shadow-brand/35 hover:scale-[1.03]"
          >
            무료 AI 가시성 진단 받기
            <ArrowRight className="w-5 h-5" />
          </a>

          <p className="mt-4 text-xs text-muted-foreground/60">
            이메일만 있으면 됩니다 · 30초 소요 · 강매 없음
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}

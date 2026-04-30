/*
 * v4: 텍스트 강조 계층 개선 — AI 검색 시대 대응, 중요도별 색상/굵기 구분
 * 핵심 숫자는 brand, 설명은 foreground, 부가정보는 muted
 */
import { FadeInSection } from "@/components/FadeInSection";
import { Bot, Search, TrendingUp, Globe, MessageSquare, Zap } from "lucide-react";

const aiStats = [
  { number: "68%", label: "건강 정보를 AI에게 먼저 검색", source: "McKinsey Health Survey" },
  { number: "4.2배", label: "AI 추천 병원의 예약 전환율", source: "Google Health AI Report" },
  { number: "73%", label: "환자가 AI 추천을 신뢰", source: "Accenture Digital Health" },
];

const aiEngines = [
  { name: "ChatGPT", icon: MessageSquare },
  { name: "Gemini", icon: Search },
  { name: "Perplexity", icon: Bot },
  { name: "Claude", icon: MessageSquare },
  { name: "Grok", icon: Zap },
];

export default function WhyAINative() {
  return (
    <section id="why-ai" className="py-10 lg:py-14 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10">
        {/* 헤더 — 핵심 메시지만 강조 */}
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-4 tracking-wide">
            <TrendingUp className="w-3.5 h-3.5" />
            AI 답변 시대
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            환자는 이제 <span className="text-brand">AI에게</span> 먼저 물어봅니다
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            환자의 68%가 ChatGPT, Gemini에 먼저 물어봅니다.
            <br />
            <span className="text-foreground/80 font-medium">AI가 추천하지 않는 병원은, 환자에게 존재하지 않습니다.</span>
          </p>
        </FadeInSection>

        {/* 핵심 데이터 3개 — 숫자만 강조, 나머지는 계층적 */}
        <FadeInSection delay={0.1} className="mb-8">
          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
            {aiStats.map((stat) => (
              <div
                key={stat.number}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 text-center hover:border-brand/30 transition-colors"
              >
                <div className="font-display font-bold text-3xl sm:text-4xl text-brand mb-1.5">
                  {stat.number}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1 leading-snug">
                  {stat.label}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/40">
                  {stat.source}
                </p>
              </div>
            ))}
          </div>
        </FadeInSection>

        {/* 5대 AI 엔진 — 가로 한 줄 */}
        <FadeInSection delay={0.2} className="mb-6">
          <h3 className="text-center font-display font-semibold text-sm sm:text-base mb-4 text-foreground/80">
            원장님의 병원, AI 엔진에서 <span className="text-brand">노출</span>되고 있나요?
          </h3>
          <div className="flex justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
            {aiEngines.map((engine) => (
              <div
                key={engine.name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/50 hover:border-brand/30 transition-colors"
              >
                <engine.icon className="w-4 h-4 text-brand/60" />
                <span className="text-xs font-medium text-foreground/80">{engine.name}</span>
              </div>
            ))}
          </div>
        </FadeInSection>

        {/* 하단 강조 메시지 */}
        <FadeInSection delay={0.3} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20">
            <Globe className="w-4 h-4 text-brand" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              MY비서는 포털 + <strong className="text-brand font-semibold">5대 AI 엔진</strong> + 의료관광 채널을 동시에 최적화합니다
            </span>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

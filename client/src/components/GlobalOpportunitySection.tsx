/*
 * GlobalOpportunitySection v3 — 콤팩트 버전
 * 핵심 수치 가로 한 줄 + 국가/진료과 차트 축소
 */
import { FadeInSection } from "@/components/FadeInSection";
import { Plane, TrendingUp, Users, DollarSign, Globe, BarChart3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ── 핵심 데이터 ── */
const KEY_STATS = [
  { icon: Users, value: 117, suffix: "만명", label: "외국인 환자 방문", color: "brand", format: (n: number) => Math.round(n).toLocaleString("ko-KR") },
  { icon: TrendingUp, value: 93.2, suffix: "%", label: "전년 대비 증가율", color: "emerald", format: (n: number) => n.toFixed(1) },
  { icon: DollarSign, value: 640, suffix: "만원", label: "1인당 평균 지출", color: "amber", format: (n: number) => Math.round(n).toLocaleString("ko-KR") },
];

const COUNTRY_BREAKDOWN = [
  { flag: "🇨🇳", name: "중국", pct: 28, color: "bg-red-500" },
  { flag: "🇯🇵", name: "일본", pct: 18, color: "bg-blue-500" },
  { flag: "🇺🇸", name: "미국", pct: 12, color: "bg-indigo-500" },
  { flag: "🇻🇳", name: "베트남", pct: 8, color: "bg-emerald-500" },
  { flag: "🇹🇭", name: "태국", pct: 6, color: "bg-amber-500" },
  { flag: "🌏", name: "기타", pct: 28, color: "bg-gray-500" },
];

const TOP_SPECIALTIES = [
  { name: "성형외과", pct: 32, icon: "✨" },
  { name: "피부과", pct: 24, icon: "💎" },
  { name: "치과", pct: 18, icon: "🦷" },
  { name: "안과", pct: 12, icon: "👁️" },
  { name: "건강검진", pct: 14, icon: "🏥" },
  { name: "내과", pct: 10, icon: "🩺" },
];

/* ── 카운트업 애니메이션 훅 ── */
function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  brand: { bg: "bg-brand/8", border: "border-brand/20", text: "text-brand" },
  emerald: { bg: "bg-emerald-500/8", border: "border-emerald-500/20", text: "text-emerald-400" },
  amber: { bg: "bg-amber-500/8", border: "border-amber-500/20", text: "text-amber-400" },
};

export default function GlobalOpportunitySection() {
  const { ref: sectionRef, inView } = useInView(0.2);
  const count0 = useCountUp(KEY_STATS[0].value, 2500, inView);
  const count1 = useCountUp(KEY_STATS[1].value, 2000, inView);
  const count2 = useCountUp(KEY_STATS[2].value, 2000, inView);
  const counts = [count0, count1, count2];

  return (
    <section ref={sectionRef} id="global-opportunity" className="py-10 lg:py-14 relative overflow-hidden">
      <div className="container relative z-10">
        {/* 섹션 헤더 */}
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/25 bg-amber-400/8 text-amber-400 text-xs font-medium mb-4 tracking-wide">
            <Plane className="w-3.5 h-3.5" />
            의료관광 시장 기회
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2">
            매년 <span className="text-amber-400">117만 명</span>의 외국인 환자가<br />
            한국 병원을 찾습니다
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            한국 의료관광 시장은 전년 대비 93.2% 폭발적 성장 중입니다.
          </p>
        </FadeInSection>

        {/* ★ 핵심 데이터 3개 — 가로 한 줄 콤팩트 ★ */}
        <FadeInSection delay={0.1} className="mb-8">
          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
            {KEY_STATS.map((stat, i) => {
              const colors = colorMap[stat.color];
              return (
                <div
                  key={i}
                  className={`rounded-xl border ${colors.border} ${colors.bg} p-4 sm:p-5 text-center transition-colors hover:scale-[1.02]`}
                >
                  <div className={`font-display font-black text-2xl sm:text-3xl lg:text-4xl ${colors.text} mb-1 tabular-nums`}>
                    {stat.format(counts[i])}
                    <span className="text-sm sm:text-base ml-0.5">{stat.suffix}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-foreground/70 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[9px] text-muted-foreground/40 mt-2">
            출처: 한국보건산업진흥원 2024 의료관광 통계
          </p>
        </FadeInSection>

        {/* 국가별 + 진료과 — 2열 콤팩트 */}
        <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto">
          {/* 국가별 환자 비중 */}
          <FadeInSection delay={0.2}>
            <div className="rounded-xl border border-border/30 bg-card/50 p-3 sm:p-4 h-full">
              <div className="flex items-center gap-1.5 mb-3">
                <Globe className="w-3.5 h-3.5 text-brand" />
                <h3 className="font-display font-bold text-xs sm:text-sm text-foreground">국가별 환자 비중</h3>
              </div>
              <div className="space-y-1.5">
                {COUNTRY_BREAKDOWN.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-xs w-4 text-center shrink-0">{c.flag}</span>
                    <span className="text-[9px] sm:text-[10px] text-foreground/70 w-7 sm:w-8 shrink-0">{c.name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.color}`}
                        style={{
                          width: inView ? `${(c.pct / 28) * 100}%` : "0%",
                          opacity: 0.8,
                          transition: "width 3s cubic-bezier(0.25,0.46,0.45,0.94)",
                          transitionDelay: `${i * 150 + 300}ms`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-foreground/60 w-6 text-right shrink-0">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          {/* 인기 진료과 */}
          <FadeInSection delay={0.3}>
            <div className="rounded-xl border border-border/30 bg-card/50 p-3 sm:p-4 h-full">
              <div className="flex items-center gap-1.5 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="font-display font-bold text-xs sm:text-sm text-foreground">외국인 인기 진료과</h3>
              </div>
              <div className="space-y-1.5">
                {TOP_SPECIALTIES.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-xs w-4 text-center shrink-0">{s.icon}</span>
                    <span className="text-[9px] sm:text-[10px] text-foreground/70 w-8 sm:w-10 shrink-0">{s.name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500/80 to-amber-400/60"
                        style={{
                          width: inView ? `${(s.pct / 32) * 100}%` : "0%",
                          transition: "width 3s cubic-bezier(0.25,0.46,0.45,0.94)",
                          transitionDelay: `${i * 150 + 400}ms`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-foreground/60 w-6 text-right shrink-0">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}

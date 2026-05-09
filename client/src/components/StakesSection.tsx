/**
 * A-6: Stakes(실패의 위험) 섹션
 * SB7 프레임워크 — "행동하지 않으면 잃는 것"을 객관적 데이터와 구체적 출처로 보여줌
 * v4: 수치 출처 + 측정방법 명시 강화
 */
import { FadeInSection } from "@/components/FadeInSection";
import { useInView } from "@/hooks/useInView";
import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, Search, MousePointerClick, ExternalLink } from "lucide-react";

/* ── 카운트업 훅 ── */
function useCountUp(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const start = () => {
    if (started) return;
    setStarted(true);
    const startTime = performance.now();
    const absTarget = Math.abs(target);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * absTarget));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  return { count, start, started };
}

/* ── 카운트업 숫자 컴포넌트 ── */
function AnimatedStat({ stat, isNegative }: { stat: string; isNegative: boolean }) {
  const numericValue = parseInt(stat.replace(/[^0-9]/g, ""), 10);
  const { count, start, started } = useCountUp(numericValue, 1400);
  const { ref, isInView } = useInView({ threshold: 0.3, rootMargin: "0px" });

  useEffect(() => {
    if (isInView && !started) {
      start();
    }
  }, [isInView, started]);

  return (
    <span ref={ref}>
      {isNegative ? "-" : ""}{count}{stat.includes("%") ? "%" : ""}
    </span>
  );
}

const stakes = [
  {
    icon: Search,
    stat: "51%",
    numericTarget: 51,
    isNegative: false,
    label: "의료 검색의 절반이 AI 답변으로 대체",
    detail:
      "환자가 '치아 교정 잘하는 병원' 같은 걸 검색하면, 구글이 AI로 병원을 추천해줍니다. 여기에 우리 병원이 없으면 환자는 다른 병원으로 갑니다.",
    source: "WebFX",
    methodology: "130,000+ 건강 관련 검색 쿼리 AI Overview 출현율 분석",
    sourceDate: "2026.02",
    sourceUrl: "https://www.easternprogress.com/ai-overviews-in-healthcare-what-a-study-of-more-than-130k-health-queries-reveals/article_a81cb8ec-d374-5e3c-871d-fc55020b55c2.html",
  },
  {
    icon: TrendingDown,
    stat: "-61%",
    numericTarget: 61,
    isNegative: true,
    label: "AI 답변이 나오면 병원 클릭이 61% 감소",
    detail:
      "쉽게 말해, AI가 다른 병원을 추천하면 우리 병원 홈페이지 클릭이 61% 줄어든다는 뜻입니다. 유료 광고를 돌려도 효과가 68% 떨어집니다.",
    source: "Seer Interactive",
    methodology: "25.1M 노출 데이터 기반 AI Overview 유/무 CTR 비교 분석",
    sourceDate: "2025.09",
    sourceUrl: "https://www.seerinteractive.com/insights/ai-overviews-impact-on-organic-and-paid-ctr",
  },
  {
    icon: MousePointerClick,
    stat: "-25%",
    numericTarget: 25,
    isNegative: true,
    label: "2026년까지 기존 검색 유입 25% 감소 전망",
    detail:
      "환자들이 네이버·구글 대신 AI에게 물어보는 비율이 빠르게 늘고 있습니다. 이미 검색의 69%는 클릭 없이 AI 답변만 보고 끝납니다.",
    source: "Gartner",
    methodology: "글로벌 검색 엔진 이용 행태 예측 모델 기반 공식 전망",
    sourceDate: "2024.02",
    sourceUrl: "https://www.gartner.com/en/newsroom/press-releases/2024-02-19-gartner-predicts-search-engine-volume-will-drop-25-percent-by-2026-due-to-ai-chatbots-and-other-virtual-agents",
  },
];

export default function StakesSection() {
  return (
    <section id="stakes" className="py-10 lg:py-14 relative overflow-hidden">
      {/* 배경 — 경고성 붉은 톤 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.2 25) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10 max-w-5xl">
        {/* 헤더 */}
        <FadeInSection delay={0} className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-4 tracking-wide"
            style={{
              borderColor: "oklch(0.65 0.18 25 / 0.3)",
              background: "oklch(0.65 0.18 25 / 0.08)",
              color: "oklch(0.72 0.18 25)",
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            데이터가 보여주는 현실
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            <span className="text-foreground">지금 시작하지 않으면</span><br />
             <span style={{ color: "oklch(0.72 0.18 25)" }}>환자는 다른 병원을 찾아갑니다</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            환자가 병원을 찾는 방식이 바뀌고 있습니다.<br />
            이제 환자들은 네이버만이 아니라, ChatGPT 같은 AI에게 직접 "좋은 병원 추천해줘"라고 물어보는 시대입니다.
          </p>
        </FadeInSection>

        {/* 카드 그리드 — 3개 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
          {stakes.map((item, i) => (
            <FadeInSection key={i} delay={i} className="group">
              <div
                className="relative h-full p-5 rounded-2xl border transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,60,40,0.08)] hover:scale-[1.02] cursor-default"
                style={{
                  borderColor: "oklch(0.65 0.18 25 / 0.15)",
                  background: "oklch(0.65 0.18 25 / 0.03)",
                }}
              >
                {/* 아이콘 + 숫자 */}
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:scale-110"
                    style={{ background: "oklch(0.65 0.18 25 / 0.1)" }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: "oklch(0.72 0.18 25)" }} />
                  </div>
                  <div>
                    <div
                      className="text-2xl font-bold tracking-tight tabular-nums"
                      style={{ color: "oklch(0.72 0.18 25)" }}
                    >
                      <AnimatedStat stat={item.stat} isNegative={item.isNegative} />
                    </div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{item.label}</div>
                  </div>
                </div>

                {/* 설명 */}
                <p className="text-xs text-muted-foreground leading-relaxed pl-14">{item.detail}</p>

                {/* 출처 + 측정방법 */}
                <div className="mt-3 pl-14 space-y-0.5">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] transition-all duration-300 hover:underline group-hover:opacity-100 opacity-70"
                    style={{ color: "oklch(0.65 0.14 200)" }}
                  >
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      출처: {item.source} ({item.sourceDate})
                    </span>
                  </a>
                  <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
                    측정: {item.methodology}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* 하단 전환 메시지 */}
        <FadeInSection delay={3} className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            하지만{" "}
            <strong className="text-foreground">
              지금 시작하면 AI가 우리 병원을 추천하도록 만들 수 있습니다.
            </strong>
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}

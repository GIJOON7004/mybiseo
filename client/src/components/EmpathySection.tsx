/**
 * A-7: 공감(Empathy) 섹션
 * SB7 프레임워크 — "원장님의 고통을 이해합니다"
 * Stakes 섹션 다음, 서비스 섹션 전에 배치
 * 감정적 공감 → 해결책 제시로 자연스럽게 연결
 */
import { FadeInSection } from "@/components/FadeInSection";
import { Heart, MessageCircle, Stethoscope } from "lucide-react";

const painPoints = [
  {
    emoji: "😤",
    quote: "매달 수백만 원 광고비를 쓰는데, 진짜 효과가 있는 건지 모르겠어요.",
    context: "광고비 불안",
  },
  {
    emoji: "😰",
    quote: "옆 병원은 환자가 넘치는데, 우리는 왜 이렇게 조용한 걸까요?",
    context: "경쟁 불안",
  },
  {
    emoji: "😩",
    quote: "마케팅 업체를 3번이나 바꿨는데, 매번 결과가 똑같아요.",
    context: "대행사 피로",
  },
  {
    emoji: "🤔",
    quote: "AI 시대라는데, 뭘 어떻게 해야 하는지 감이 안 잡혀요.",
    context: "변화 막막함",
  },
];

export default function EmpathySection() {
  return (
    <section className="py-10 lg:py-14 relative overflow-hidden">
      {/* 배경 — 따뜻한 톤 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.14 200) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10 max-w-4xl">
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-4 tracking-wide">
            <Heart className="w-3.5 h-3.5" />
            원장님의 마음을 압니다
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            <span className="text-foreground">혼자 고민하셨던 그 마음,</span><br className="sm:hidden" />{" "}
            <span className="text-brand">저희도 알고 있습니다</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            수많은 원장님들과 대화하며 같은 이야기를 들었습니다.
            원장님만의 고민이 아닙니다.
          </p>
        </FadeInSection>

        {/* 고민 카드 — 말풍선 스타일 */}
        <div className="space-y-5 mb-10">
          {painPoints.map((item, i) => (
            <FadeInSection key={i} delay={i} direction={i % 2 === 0 ? "left" : "right"}>
              <div className={`flex items-start gap-4 ${i % 2 !== 0 ? "flex-row-reverse" : ""}`}>
                {/* 아바타 */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
                  style={{ background: "oklch(0.72 0.14 200 / 0.08)" }}>
                  {item.emoji}
                </div>
                {/* 말풍선 */}
                <div className={`flex-1 max-w-lg ${i % 2 !== 0 ? "text-right" : ""}`}>
                  <div
                    className="inline-block p-4 sm:p-5 rounded-2xl text-sm sm:text-base text-foreground leading-relaxed shadow-sm"
                    style={{
                      background: "oklch(0.72 0.14 200 / 0.05)",
                      border: "1px solid oklch(0.72 0.14 200 / 0.15)",
                      borderRadius: i % 2 === 0 ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-brand/40 inline mr-1.5 -mt-0.5" />
                    "{item.quote}"
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-2">
                    — {item.context}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* 전환 메시지 — 공감 → 해결 */}
        <FadeInSection delay={4} className="text-center">
          <div className="inline-block p-6 sm:p-8 rounded-2xl border border-brand/25 bg-brand/5 max-w-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04]" style={{ background: "radial-gradient(circle, oklch(0.72 0.14 200), transparent 70%)" }} />
            <Stethoscope className="w-7 h-7 text-brand mx-auto mb-3" />
            <p className="text-base sm:text-lg text-foreground font-bold leading-relaxed mb-2">
              원장님은 진료에만 집중하세요.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              마케팅 고민, 광고비 불안, AI 시대 대응까지 —{" "}
              <strong className="text-brand">MY비서가 모두 해결해 드립니다.</strong>
            </p>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

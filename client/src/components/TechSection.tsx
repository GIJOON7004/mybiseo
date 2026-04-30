/*
 * v7: 기술력 섹션 — "왜 MY비서인가" 순수 기술력/차별화만 강조
 * 서비스 반복 제거, 기술적 역량과 신뢰 포인트에 집중
 */
import { FadeInSection } from "@/components/FadeInSection";
import { Sparkles, Brain, Code2, Lock, Shield, Cpu, Users } from "lucide-react";
import TechMobileBackground from "@/components/TechMobileBackground";

const differentiators = [
  {
    icon: Brain,
    title: "AI 전문가가 직접 구축",
    stat: "5대 AI",
    desc: "블로그 대행사가 아닙니다. AI 전문 엔지니어가 우리 병원에 맞는 AI를 직접 만들고, 병원 정보를 학습시켜서 환자에게 정확한 답변을 제공합니다.",
    highlight: "병원 맞춤 AI · 자체 개발 · 지속 개선",
  },
  {
    icon: Code2,
    title: "대형 병원급 안정성",
    stat: "99.9%",
    desc: "대형 병원 체인과 동일한 기술로 구축합니다. 서버가 멈추지 않는 99.9% 안정성을 보장하며, 환자가 많아져도 느려지지 않습니다.",
    highlight: "안정적 운영 · 빠른 속도 · 확장 가능",
  },
  {
    icon: Lock,
    title: "환자 정보 철저 보호",
    stat: "256bit",
    desc: "환자 개인정보 보호법을 완전히 준수합니다. 모든 데이터는 은행급 암호화(256비트)로 보호되며, 권한 없는 사람은 접근할 수 없습니다.",
    highlight: "개인정보보호법 준수 · 은행급 암호화 · 접근 제어",
  },
  {
    icon: Shield,
    title: "의료광고법 준수 AI 필터",
    stat: "100%",
    desc: "모든 콘텐츠에 의료광고법 준수 여부를 AI가 자동 검수합니다. 법적 리스크 없이 안전한 마케팅이 가능합니다.",
    highlight: "의료법 · 자동 검수 · 법적 안전",
  },
  {
    icon: Users,
    title: "전담 매니저 + 월간 전략 미팅",
    stat: "1:1",
    desc: "자동화만 하고 끝이 아닙니다. 전담 매니저가 배정되어 월간 전략 미팅, 경쟁사 분석, 성과 리뷰를 함께 진행합니다.",
    highlight: "전담 매니저 · 월간 미팅 · 전략 컨설팅",
  },
  {
    icon: Cpu,
    title: "100% 자체 기술, 외주 0%",
    stat: "12개",
    desc: "외부 업체에 넘기지 않습니다. 홈페이지, AI 챗봇, 고객관리(CRM), 대시보드까지 모두 저희가 직접 만듭니다. 문제가 생기면 바로 대응합니다.",
    highlight: "12개 서비스 · 직접 개발 · 즉시 대응",
  },
];

export default function TechSection() {
  return (
    <section id="tech" className="py-10 lg:py-14 relative overflow-hidden">
      {/* CSS 애니메이션 배경 */}
      <div className="md:hidden">
        <TechMobileBackground />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container relative z-10">
        {/* 헤더 */}
        <FadeInSection delay={0} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/20 bg-brand/5 text-brand text-sm font-medium mb-5 tracking-wide">
            <Sparkles className="w-4 h-4" />
            왜 MY비서인가
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.75rem] tracking-tight mb-4 leading-tight">
            일반 마케팅 업체와는{" "}
            <span className="text-brand">차원이 다릅니다</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            외주 없이, 100% 자체 기술로 직접 만들고 운영합니다.
          </p>
        </FadeInSection>

        {/* 6개 차별화 카드 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto mb-8">
          {differentiators.map((item) => (
            <FadeInSection
              key={item.title}
              delay={0.1}
              className="relative group p-6 sm:p-7 rounded-xl bg-card border border-border hover:border-brand/30 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at top, oklch(0.72 0.14 200 / 0.06) 0%, transparent 60%)",
                }}
              />
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-brand" />
                </div>
                <span className="text-xl font-bold font-display text-brand/80">{item.stat}</span>
              </div>
              <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-[13px] sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                {item.desc}
              </p>
              <span className="text-[11px] sm:text-xs text-brand/70 font-medium">
                {item.highlight}
              </span>
            </FadeInSection>
          ))}
        </div>

        {/* 하단 한 줄 */}
        <FadeInSection delay={0.2} className="text-center mt-4">
          <p className="text-sm sm:text-base text-muted-foreground/70 italic">
            "지금 보고 계신 이 사이트가, 같은 기술력으로 만들어졌습니다."
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}

/**
 * PricingSection — 가격 비공개 + 맞춤 견적 CTA
 * 기획안: 가격 숫자 노출 없이, 3단계 프로세스 + 상담 유도
 * "맞춤 견적을 받아보세요" 메시지 중심
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  FileSearch,
  Palette,
  TrendingUp,
  ArrowRight,
  MessageCircle,
  Shield,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const funnelSteps = [
  {
    step: 1,
    icon: FileSearch,
    title: "무료 AI 가시성 진단",
    subtitle: "30초 만에 현재 상태 파악",
    desc: "AI가 병원의 온라인 가시성을 110개 항목으로 분석합니다. 경쟁 병원 대비 어디가 부족한지 데이터로 보여드립니다.",
    badge: "무료",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  {
    step: 2,
    icon: Palette,
    title: "맞춤 전략 설계",
    subtitle: "병원에 딱 맞는 솔루션",
    desc: "진단 결과를 바탕으로 병원 규모·진료과·지역에 최적화된 마케팅 전략과 견적을 설계합니다.",
    badge: "맞춤 설계",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "성과 확인 후 결정",
    subtitle: "결과로 증명합니다",
    desc: "초안을 확인하신 후 진행 여부를 결정하세요. 월 단위 계약으로 부담 없이 시작할 수 있습니다.",
    badge: "유연한 계약",
    badgeColor: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  },
];

const whyFree = [
  "진단 결과를 보시고 직접 판단하실 수 있도록",
  "병원마다 상황이 다르기에 맞춤 견적이 필요",
  "강매 없이, 데이터로 설득하는 것이 저희 방식",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-10 lg:py-14">
      <div className="container max-w-4xl">
        {/* 헤더 */}
        <FadeInSection delay={0} className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            시작하기
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
            <span className="text-brand">3단계</span>로 부담 없이 시작하세요
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            병원마다 규모와 상황이 다릅니다.<br />
            그래서 저희는 <span className="text-foreground font-medium">진단 → 맞춤 설계 → 확인 후 결정</span> 순서로 진행합니다.
          </p>
        </FadeInSection>

        {/* 3단계 퍼널 카드 */}
        <FadeInSection delay={0.02} className="mb-10">
          <div className="grid md:grid-cols-3 gap-4">
            {funnelSteps.map((fs, i) => (
              <div
                key={i}
                className="relative p-5 rounded-2xl border border-border bg-card hover:border-brand/30 transition-all duration-300 hover:shadow-lg group"
              >
                {/* 스텝 번호 + 배지 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full">
                    STEP {fs.step}
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${fs.badgeColor}`}>
                    {fs.badge}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                  <fs.icon className="w-5 h-5 text-brand" />
                </div>

                <h3 className="font-display font-semibold text-base text-foreground mb-0.5">{fs.title}</h3>
                <p className="text-[11px] text-brand font-medium mb-2">{fs.subtitle}</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{fs.desc}</p>

                {/* 연결 화살표 (데스크톱) */}
                {i < funnelSteps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-brand/10 items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-brand" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeInSection>

        {/* 맞춤 견적 CTA 카드 */}
        <FadeInSection delay={0.04} className="mb-8">
          <div className="relative rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-brand/5 via-transparent to-brand/3 p-8 text-center overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.05] pointer-events-none" style={{ background: "radial-gradient(circle, oklch(0.65 0.2 250) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-brand" />
              </div>

              <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground mb-2">
                맞춤 견적을 받아보세요
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                병원 규모, 진료과, 지역, 목표에 따라 최적의 솔루션과 견적을 설계해 드립니다.<br />
                무료 진단 리포트와 함께 개인화된 제안서를 받아보세요.
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/ai-check"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand/90 transition-all duration-200 shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:scale-[1.02]"
                >
                  <FileSearch className="w-4 h-4" />
                  무료 AI 진단 받기
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="https://pf.kakao.com/_KxmnZn/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-accent/50 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4 text-brand" />
                  카카오톡 상담
                </a>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* 왜 가격을 공개하지 않나요? */}
        <FadeInSection delay={0.06}>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-brand" />
              <h4 className="text-sm font-semibold text-foreground">왜 가격을 바로 안내하지 않나요?</h4>
            </div>
            <div className="space-y-2">
              {whyFree.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground/70 leading-relaxed">
              진단 리포트 마지막 페이지에서 병원 상황에 맞는 개인화 견적을 확인하실 수 있습니다.
            </p>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

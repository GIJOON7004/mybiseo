/**
 * Reputation Defense — 서비스 상세 페이지
 * 공통 구조: Hero → 문제 정의 → 솔루션 → 작동 방식 → 케이스 스터디 → 포함 항목 → CTA
 */
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeInSection } from "@/components/FadeInSection";
import { useSEO } from "@/hooks/useSEO";
import {
  Shield,
  AlertTriangle,
  Eye,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageCircle,
  Scale,
  Bell,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

/* ── 작동 방식 단계 ── */
const PROCESS_STEPS = [
  {
    step: "01",
    title: "실시간 모니터링",
    desc: "네이버·구글·카카오맵 리뷰를 24시간 AI가 모니터링하고, 부정 리뷰를 즉시 감지합니다.",
    icon: Bell,
  },
  {
    step: "02",
    title: "리스크 분석·대응",
    desc: "부정 리뷰의 유형(악의적/불만/오해)을 분류하고, 최적 대응 전략을 자동 제안합니다.",
    icon: Shield,
  },
  {
    step: "03",
    title: "의료법 컴플라이언스",
    desc: "모든 마케팅 콘텐츠를 의료광고법 기준으로 자동 검수하여 심의 통과율을 극대화합니다.",
    icon: Scale,
  },
  {
    step: "04",
    title: "브랜드 강화",
    desc: "긍정 리뷰 유도 시스템 + SNS 브랜딩 전략으로 병원 온라인 평판을 체계적으로 구축합니다.",
    icon: BarChart3,
  },
];

/* ── 포함 항목 ── */
const INCLUDES = [
  "AI 실시간 리뷰 모니터링 (네이버·구글·카카오맵)",
  "부정 리뷰 자동 감지 + 유형별 대응 템플릿",
  "의료광고법 자동 검수 시스템 (광고 심의 통과율 98%)",
  "브랜딩 마케팅 전략 수립 + SNS 채널 운영 가이드",
  "경쟁사 평판 벤치마킹 리포트",
  "긍정 리뷰 유도 자동화 시스템",
  "월간 평판 관리 리포트 + 전략 미팅",
  "위기 대응 매뉴얼 (악성 리뷰·허위 정보·언론 대응)",
];

export default function ServiceReputation() {
  const [, navigate] = useLocation();

  useSEO({
    title: "Reputation Defense | 마이비서(MY비서)",
    description: "악성 리뷰·허위 정보로부터 병원 브랜드를 지키는 AI 평판 방어 시스템. 의료광고법 자동 검수, 실시간 리뷰 모니터링.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Reputation Defense",
        provider: {
          "@type": "Organization",
          name: "마이비서(MY비서)",
          url: "https://mybiseo.com",
        },
        description: "AI 기반 실시간 리뷰 모니터링과 의료광고법 컴플라이언스 자동 검수를 통한 병원 온라인 평판 방어 서비스",
        serviceType: "Online Reputation Management",
        areaServed: { "@type": "Country", name: "KR" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://mybiseo.com" },
          { "@type": "ListItem", position: 2, name: "서비스", item: "https://mybiseo.com/#services" },
          { "@type": "ListItem", position: 3, name: "Reputation Defense", item: "https://mybiseo.com/services/reputation" },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-5xl relative">
          <FadeInSection delay={0} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              방어 시스템
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              <span className="text-emerald-500">Reputation Defense</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
              온라인 평판 방어 시스템
            </p>
            <p className="text-base sm:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed mb-8">
              악성 리뷰·허위 정보로부터 병원 브랜드를 지킵니다.<br className="hidden sm:block" />
              AI 실시간 모니터링 + 의료광고법 자동 검수로 리스크를 사전 차단합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.16 160), oklch(0.60 0.16 155))" }}
              >
                도입 상담 신청
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => navigate("/ai-check")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
              >
                무료 진단 받기
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ 문제 정의 ═══ */}
      <section className="py-16 lg:py-20 border-t border-border/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              원장님, 이런 위험에 노출되어 있습니다
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              온라인 평판은 한 번 무너지면 복구에 수개월이 걸립니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: AlertTriangle,
                title: "악성 리뷰 방치",
                desc: "부정 리뷰 1건이 잠재 환자 30명을 이탈시킵니다. 대응하지 않으면 AI가 부정적 정보를 학습합니다.",
              },
              {
                icon: Scale,
                title: "의료광고법 위반 리스크",
                desc: "자율심의 미통과 시 과태료 최대 500만원. 무심코 쓴 '최고', '유일' 같은 표현이 위반 대상입니다.",
              },
              {
                icon: Eye,
                title: "경쟁사 비방·허위 정보",
                desc: "경쟁 병원이나 불만 환자가 퍼뜨리는 허위 정보에 대한 체계적 대응 없이는 브랜드가 훼손됩니다.",
              },
            ].map((item, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 솔루션 ═══ */}
      <section className="py-16 lg:py-20 bg-emerald-500/3">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              마이비서가 병원을 지킵니다
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              AI가 24시간 모니터링하고, 위험을 사전에 차단합니다.<br className="hidden sm:block" />
              의료광고법 검수까지 자동화하여 법적 리스크를 제거합니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, value: "98%", label: "광고 심의 1회 통과율" },
              { icon: Bell, value: "24시간", label: "실시간 모니터링" },
              { icon: MessageCircle, value: "-90%", label: "부정 리뷰 리스크 감소" },
              { icon: FileCheck, value: "100%", label: "의료법 자동 검수율" },
            ].map((stat, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-xl border border-emerald-500/20 bg-background p-5 text-center">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-500 mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 작동 방식 ═══ */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              작동 방식
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              4단계 방어 시스템으로 병원 평판을 체계적으로 관리합니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map((step, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="relative rounded-2xl border border-border bg-card p-6 h-full">
                  <span className="text-4xl font-black text-emerald-500/10 absolute top-4 right-4">{step.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 케이스 스터디 ═══ */}
      <section className="py-16 lg:py-20 border-t border-border/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              도입 사례
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.05}>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-4">
                    피부과 · 서울 신사
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">
                    B 피부과, 의료광고 자율심의 1회 통과율 98% 달성
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    기존에 자율심의 반려율이 40%에 달하던 B 피부과가
                    마이비서 Reputation Defense 도입 후 의료광고법 자동 검수 시스템을 통해
                    1회 통과율 98%를 달성했습니다. 동시에 부정 리뷰 대응 시간이 72시간에서 2시간으로 단축되었습니다.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">98%</p>
                      <p className="text-[11px] text-muted-foreground">심의 1회 통과율</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">2시간</p>
                      <p className="text-[11px] text-muted-foreground">리뷰 대응 시간</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">0건</p>
                      <p className="text-[11px] text-muted-foreground">과태료 발생</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-64 shrink-0">
                  <div className="rounded-xl border border-emerald-500/20 bg-background p-5">
                    <p className="text-xs text-muted-foreground mb-2">도입 전</p>
                    <p className="text-sm text-foreground/60 line-through mb-4">심의 반려율 40%, 대응 72시간</p>
                    <p className="text-xs text-muted-foreground mb-2">도입 후</p>
                    <p className="text-sm text-emerald-500 font-bold">통과율 98%, 대응 2시간</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ 포함 항목 ═══ */}
      <section className="py-16 lg:py-20 bg-card/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              서비스 포함 항목
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {INCLUDES.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ 최종 CTA ═══ */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-3xl text-center">
          <FadeInSection delay={0}>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
              병원 평판, 더 이상 방치하지 마세요
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
              AI가 24시간 병원을 지킵니다.<br />
              무료 상담으로 현재 평판 리스크를 확인해 보세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.16 160), oklch(0.60 0.16 155))" }}
              >
                <Zap className="w-4 h-4" />
                도입 상담 신청
              </a>
              <button
                onClick={() => navigate("/ai-check")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
              >
                무료 AI 진단 받기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}

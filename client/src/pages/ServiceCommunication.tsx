/**
 * Patient Communication Hub — 보조 서비스 상세 페이지 (간략 버전)
 * Hero → 핵심 기능 → 포함 항목 → CTA
 */
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeInSection } from "@/components/FadeInSection";
import { useSEO } from "@/hooks/useSEO";
import {
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Bot,
  Calendar,
  Bell,
  Users,
  Heart,
  BarChart3,
} from "lucide-react";

/* ── 핵심 기능 ── */
const FEATURES = [
  {
    icon: Bot,
    title: "24시간 AI 상담 챗봇",
    desc: "환자 문의에 즉시 응답하는 AI 챗봇. 시술 안내, 가격 문의, 예약까지 자동 처리합니다.",
  },
  {
    icon: Calendar,
    title: "스마트 예약 시스템",
    desc: "온라인 예약 + 자동 확인 문자 + 리마인더 발송. 예약 관리를 완전 자동화합니다.",
  },
  {
    icon: Bell,
    title: "노쇼 방지 리마인더",
    desc: "예약 24시간 전, 2시간 전 자동 리마인더 발송. 노쇼율을 평균 60% 감소시킵니다.",
  },
  {
    icon: Users,
    title: "환자 CRM",
    desc: "환자별 시술 이력, 선호도, 방문 주기를 관리. 맞춤형 마케팅 캠페인을 자동 실행합니다.",
  },
  {
    icon: Heart,
    title: "맞춤형 팔로업",
    desc: "시술 후 케어 안내, 재방문 유도, 만족도 조사까지 자동화된 환자 관리 시스템.",
  },
  {
    icon: BarChart3,
    title: "소통 분석 대시보드",
    desc: "문의 유형, 응답 시간, 전환율, 만족도를 실시간 분석하여 개선점을 제안합니다.",
  },
];

/* ── 포함 항목 ── */
const INCLUDES = [
  "24시간 AI 상담 챗봇 (시술 안내·가격·예약)",
  "스마트 예약 시스템 + 자동 확인 문자",
  "노쇼 방지 리마인더 (24h + 2h 전 발송)",
  "환자 CRM (시술 이력·선호도·방문 주기)",
  "시술 후 자동 팔로업 시스템",
  "만족도 조사 + 리뷰 유도 자동화",
  "소통 분석 대시보드",
  "월간 성과 리포트 + 개선 제안",
];

export default function ServiceCommunication() {
  const [, navigate] = useLocation();

  useSEO({
    title: "Patient Communication Hub | 마이비서(MY비서)",
    description: "AI 챗봇이 24시간 환자 문의 응대 + 예약 관리. 노쇼 방지 리마인더, CRM, 맞춤형 팔로업까지 자동화.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Patient Communication Hub",
        provider: {
          "@type": "Organization",
          name: "마이비서(MY비서)",
          url: "https://mybiseo.com",
        },
        description: "AI 챗봇 기반 24시간 환자 응대, 스마트 예약, 노쇼 방지, CRM까지 통합된 환자 소통 자동화 서비스",
        serviceType: "Patient Communication Automation",
        areaServed: { "@type": "Country", name: "KR" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://mybiseo.com" },
          { "@type": "ListItem", position: 2, name: "서비스", item: "https://mybiseo.com/#services" },
          { "@type": "ListItem", position: 3, name: "Patient Communication", item: "https://mybiseo.com/services/communication" },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-5xl relative">
          <FadeInSection delay={0} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-medium mb-6">
              <MessageCircle className="w-3.5 h-3.5" />
              환자 소통 시스템
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              <span className="text-amber-500">Patient Communication Hub</span>
            </h1>
            <p className="text-base sm:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed mb-8">
              AI 챗봇이 24시간 환자 문의를 응대하고, 예약부터 팔로업까지 자동화합니다.<br className="hidden sm:block" />
              노쇼 방지, CRM, 맞춤형 케어까지 하나의 시스템으로 관리하세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.75 0.15 75), oklch(0.65 0.16 60))" }}
              >
                도입 상담 신청
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => navigate("/ai-check")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
              >
                무료 AI 진단 받기
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ 핵심 기능 ═══ */}
      <section className="py-16 lg:py-20 border-t border-border/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              핵심 기능
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              환자 소통의 모든 과정을 AI가 자동화합니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                    <feat.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
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
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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
              환자 소통, AI에게 맡기세요
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
              24시간 응대, 노쇼 방지, 재방문 유도까지.<br />
              AI가 환자 관리를 자동화합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.75 0.15 75), oklch(0.65 0.16 60))" }}
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

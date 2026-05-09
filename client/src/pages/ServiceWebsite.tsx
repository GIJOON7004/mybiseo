/**
 * Smart Website Platform — 보조 서비스 상세 페이지 (간략 버전)
 * Hero → 핵심 기능 → 포함 항목 → CTA
 */
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeInSection } from "@/components/FadeInSection";
import { useSEO } from "@/hooks/useSEO";
import {
  Layout,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
  Smartphone,
  BarChart3,
  Code2,
  Image,
  Users,
} from "lucide-react";

/* ── 핵심 기능 ── */
const FEATURES = [
  {
    icon: Code2,
    title: "AI 크롤러 최적화 구조",
    desc: "Schema 마크업 9종, llms.txt, 구조화 데이터 등 AI가 학습하기 쉬운 웹사이트 구조로 설계합니다.",
  },
  {
    icon: BarChart3,
    title: "전환율 최적화(CRO) 설계",
    desc: "방문자를 환자로 전환하는 UX 설계. A/B 테스트 기반 CTA 배치, 예약 동선 최적화.",
  },
  {
    icon: Globe,
    title: "다국어 지원 (20개국)",
    desc: "해외 환자 유치를 위한 다국어 웹사이트. 각 국가별 AI 검색에 최적화된 콘텐츠 제공.",
  },
  {
    icon: Smartphone,
    title: "모바일 앱 + 반응형",
    desc: "모바일 퍼스트 설계. PWA 기반 앱 경험 제공으로 환자 접근성을 극대화합니다.",
  },
  {
    icon: Image,
    title: "전후사진 갤러리",
    desc: "의료광고법을 준수하는 전후사진 갤러리 시스템. 자동 워터마크, 동의서 관리 포함.",
  },
  {
    icon: Users,
    title: "의료진 소개 시스템",
    desc: "의료진별 전문 분야, 경력, 논문 등을 구조화하여 AI가 정확하게 학습할 수 있도록 합니다.",
  },
];

/* ── 포함 항목 ── */
const INCLUDES = [
  "AI 크롤러 최적화 웹사이트 구축",
  "Schema 마크업 9종 적용",
  "전환율 최적화(CRO) 설계",
  "다국어 지원 (최대 20개국)",
  "모바일 앱(PWA) 제공",
  "전후사진 갤러리 시스템",
  "의료진 소개 구조화 페이지",
  "월간 성과 리포트 + 개선 제안",
];

export default function ServiceWebsite() {
  const [, navigate] = useLocation();

  useSEO({
    title: "Smart Website Platform | 마이비서(MY비서)",
    description: "AI 검색에 최적화된 병원 홈페이지. 전환율 최적화 설계, 다국어 지원, 모바일 앱까지.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Smart Website Platform",
        provider: {
          "@type": "Organization",
          name: "마이비서(MY비서)",
          url: "https://mybiseo.com",
        },
        description: "AI 검색에 최적화된 병원 전용 웹사이트 구축 서비스. 전환율 최적화, 다국어 지원, 모바일 앱 포함.",
        serviceType: "Website Development",
        areaServed: { "@type": "Country", name: "KR" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://mybiseo.com" },
          { "@type": "ListItem", position: 2, name: "서비스", item: "https://mybiseo.com/#services" },
          { "@type": "ListItem", position: 3, name: "Smart Website", item: "https://mybiseo.com/services/website" },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-5xl relative">
          <FadeInSection delay={0} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-500 text-xs font-medium mb-6">
              <Layout className="w-3.5 h-3.5" />
              AI 최적화 웹사이트
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              <span className="text-sky-500">Smart Website Platform</span>
            </h1>
            <p className="text-base sm:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed mb-8">
              AI 검색에 최적화된 병원 홈페이지.<br className="hidden sm:block" />
              전환율 최적화(CRO) 설계, 다국어 지원, 모바일 앱, 전후사진 갤러리까지.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 220), oklch(0.60 0.16 210))" }}
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
              단순한 홈페이지가 아닌, AI 시대에 맞는 스마트 웹사이트입니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4">
                    <feat.icon className="w-5 h-5 text-sky-500" />
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
                  <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
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
              AI 시대에 맞는 병원 웹사이트를 만들어 보세요
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
              기존 홈페이지로는 AI 검색에 노출되지 않습니다.<br />
              스마트 웹사이트로 전환하세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 220), oklch(0.60 0.16 210))" }}
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

/**
 * AI Learning Hub — 서비스 상세 페이지
 * 공통 구조: Hero → 문제 정의 → 솔루션 → 작동 방식 → 케이스 스터디 → 포함 항목 → CTA
 */
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeInSection } from "@/components/FadeInSection";
import { useSEO } from "@/hooks/useSEO";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Database,
  Code2,
  BarChart3,
  Brain,
  FileCode,
  RefreshCw,
  Target,
} from "lucide-react";

/* ── 작동 방식 단계 ── */
const PROCESS_STEPS = [
  {
    step: "01",
    title: "병원 데이터 구조화",
    desc: "시술·의료진·장비·후기 등 병원의 모든 정보를 AI가 학습할 수 있는 형태로 구조화합니다.",
    icon: Database,
  },
  {
    step: "02",
    title: "AI 크롤러 최적화",
    desc: "llms.txt, Schema 마크업, 구조화 데이터를 배포하여 AI 크롤러가 정보를 정확히 수집하도록 합니다.",
    icon: Code2,
  },
  {
    step: "03",
    title: "AI 답변 모니터링",
    desc: "주요 AI 플랫폼에서 병원 관련 질문에 대한 답변 정확도를 실시간 추적합니다.",
    icon: BarChart3,
  },
  {
    step: "04",
    title: "지속적 교정·업데이트",
    desc: "부정확한 AI 답변을 감지하면 데이터를 교정하고, 새로운 정보를 지속적으로 학습시킵니다.",
    icon: RefreshCw,
  },
];

/* ── 포함 항목 ── */
const INCLUDES = [
  "병원 전용 Knowledge Base 구축 (시술·의료진·장비·후기)",
  "AI 크롤러 최적화 (llms.txt, Schema 마크업 9종)",
  "의료 전문 데이터 구조화 + JSON-LD 배포",
  "AI 답변 정확도 모니터링 (5대 플랫폼)",
  "부정확 답변 감지 시 자동 교정 프로세스",
  "월간 AI 학습 성과 리포트",
  "경쟁사 AI 학습 현황 비교 분석",
  "신규 시술·의료진 정보 즉시 반영 시스템",
];

export default function ServiceLearningHub() {
  const [, navigate] = useLocation();

  useSEO({
    title: "AI Learning Hub | 마이비서(MY비서)",
    description: "AI에게 우리 병원 정보를 정확하게 학습시키는 서비스. Knowledge Base 구축, AI 크롤러 최적화, 답변 정확도 모니터링.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "AI Learning Hub",
        provider: {
          "@type": "Organization",
          name: "마이비서(MY비서)",
          url: "https://mybiseo.com",
        },
        description: "병원 전용 Knowledge Base 구축과 AI 크롤러 최적화를 통해 AI가 병원 정보를 정확하게 학습하도록 하는 서비스",
        serviceType: "AI Data Optimization",
        areaServed: { "@type": "Country", name: "KR" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://mybiseo.com" },
          { "@type": "ListItem", position: 2, name: "서비스", item: "https://mybiseo.com/#services" },
          { "@type": "ListItem", position: 3, name: "AI Learning Hub", item: "https://mybiseo.com/services/learning-hub" },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-5xl relative">
          <FadeInSection delay={0} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-500 text-xs font-medium mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              학습 허브
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              <span className="text-violet-500">AI Learning Hub</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
              AI 학습 허브
            </p>
            <p className="text-base sm:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed mb-8">
              AI에게 우리 병원 정보를 정확하게 학습시킵니다.<br className="hidden sm:block" />
              구조화된 데이터로 AI가 정확한 답변을 하도록 만드는 유일한 방법입니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.15 290), oklch(0.55 0.18 280))" }}
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

      {/* ═══ 문제 정의 ═══ */}
      <section className="py-16 lg:py-20 border-t border-border/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              AI가 우리 병원을 잘못 알고 있습니다
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              AI에게 정확한 정보를 제공하지 않으면, 잘못된 답변이 환자에게 전달됩니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: AlertTriangle,
                title: "부정확한 AI 답변",
                desc: "AI가 폐업한 진료과를 추천하거나, 없는 시술을 안내하는 등 잘못된 정보를 환자에게 전달합니다.",
              },
              {
                icon: Brain,
                title: "학습 데이터 부재",
                desc: "병원 홈페이지가 AI 크롤러에 최적화되지 않아, AI가 경쟁 병원의 정보만 학습하고 있습니다.",
              },
              {
                icon: Target,
                title: "경쟁사에 뒤처짐",
                desc: "이미 선도 병원들은 AI 학습 최적화를 시작했습니다. 늦을수록 AI 검색 점유율 격차가 벌어집니다.",
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
      <section className="py-16 lg:py-20 bg-violet-500/3">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              마이비서가 AI를 교육합니다
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              병원의 모든 정보를 구조화하고, AI가 정확하게 학습하도록 만듭니다.<br className="hidden sm:block" />
              결과적으로 AI가 우리 병원을 정확하게 추천합니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Database, value: "100%", label: "병원 정보 구조화율" },
              { icon: FileCode, value: "9종", label: "Schema 마크업 적용" },
              { icon: Brain, value: "95%+", label: "AI 답변 정확도" },
              { icon: RefreshCw, value: "실시간", label: "정보 업데이트 반영" },
            ].map((stat, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-xl border border-violet-500/20 bg-background p-5 text-center">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-5 h-5 text-violet-500" />
                  </div>
                  <p className="text-2xl font-bold text-violet-500 mb-1">{stat.value}</p>
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
              4단계 프로세스로 AI가 병원을 정확하게 이해하도록 만듭니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map((step, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="relative rounded-2xl border border-border bg-card p-6 h-full">
                  <span className="text-4xl font-black text-violet-500/10 absolute top-4 right-4">{step.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-violet-500" />
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
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium mb-4">
                    성형외과 · 서울 압구정
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">
                    C 성형외과, AI 답변 정확도 32% → 96%로 개선
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    ChatGPT에 C 성형외과를 물어보면 폐업한 진료과를 추천하거나 잘못된 원장 정보를 답변하던 상황이었습니다.
                    마이비서 AI Learning Hub 도입 후 2개월 만에 AI 답변 정확도가 96%까지 개선되었고,
                    AI 추천을 통한 신환 문의가 시작되었습니다.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-500">96%</p>
                      <p className="text-[11px] text-muted-foreground">AI 답변 정확도</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-500">2개월</p>
                      <p className="text-[11px] text-muted-foreground">소요 기간</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-500">+23건</p>
                      <p className="text-[11px] text-muted-foreground">월 AI 추천 신환</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-64 shrink-0">
                  <div className="rounded-xl border border-violet-500/20 bg-background p-5">
                    <p className="text-xs text-muted-foreground mb-2">도입 전</p>
                    <p className="text-sm text-foreground/60 line-through mb-4">AI 답변 정확도 32%</p>
                    <p className="text-xs text-muted-foreground mb-2">도입 후 (2개월)</p>
                    <p className="text-sm text-violet-500 font-bold">AI 답변 정확도 96%</p>
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
                  <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
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
              AI가 우리 병원을 정확하게 알도록 만드세요
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
              무료 진단으로 현재 AI가 우리 병원을 어떻게 알고 있는지 확인하고,<br />
              정확한 학습 전략을 받아보세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.15 290), oklch(0.55 0.18 280))" }}
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

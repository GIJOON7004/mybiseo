/**
 * AI Visibility Engine — 서비스 상세 페이지
 * 공통 구조: Hero → 문제 정의 → 솔루션 → 작동 방식 → 케이스 스터디 → 포함 항목 → CTA
 */
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeInSection } from "@/components/FadeInSection";
import { useSEO } from "@/hooks/useSEO";
import {
  Search,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Eye,
  Bot,
  Globe,
  FileText,
  Zap,
  Target,
  LineChart,
} from "lucide-react";

/* ── 작동 방식 단계 ── */
const PROCESS_STEPS = [
  {
    step: "01",
    title: "AI 가시성 진단",
    desc: "5대 AI 플랫폼 + 네이버·구글에서 병원 노출 현황을 110개 항목으로 분석합니다.",
    icon: Search,
  },
  {
    step: "02",
    title: "최적화 전략 수립",
    desc: "진료과·지역·경쟁 환경을 고려한 맞춤형 AI 검색 최적화 전략을 설계합니다.",
    icon: Target,
  },
  {
    step: "03",
    title: "콘텐츠 제작·배포",
    desc: "의료법 준수 AI 콘텐츠를 제작하고, AI 크롤러가 학습할 수 있도록 구조화합니다.",
    icon: FileText,
  },
  {
    step: "04",
    title: "실시간 모니터링",
    desc: "7개 AI 플랫폼에서 병원 추천 빈도를 실시간 추적하고 성과를 리포팅합니다.",
    icon: LineChart,
  },
];

/* ── 포함 항목 ── */
const INCLUDES = [
  "5대 AI 엔진 동시 최적화 (ChatGPT, Perplexity, Gemini, Claude, CoPilot)",
  "네이버·구글 검색 최적화 (SEO/AEO/GEO)",
  "110개 항목 종합 AI 가시성 진단 리포트",
  "AI 블로그 자동 생성 (의료광고법 자동 검수)",
  "콘텐츠 공장: 영상 1개 → 블로그 3 + 숏폼 5 + 카드뉴스 5",
  "해외 20개국 다국어 GEO 전략",
  "월간 AI 노출 성과 리포트 + 전략 미팅",
  "경쟁사 AI 노출 벤치마킹",
];

export default function ServiceVisibility() {
  const [, navigate] = useLocation();

  useSEO({
    title: "AI Visibility Engine | 마이비서(MY비서)",
    description: "ChatGPT·Perplexity·Gemini가 우리 병원을 추천하게 만드는 AI 검색 최적화 서비스. 5대 AI 플랫폼 + 네이버·구글 동시 최적화.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "AI Visibility Engine",
        provider: {
          "@type": "Organization",
          name: "마이비서(MY비서)",
          url: "https://mybiseo.com",
        },
        description: "5대 AI 플랫폼과 네이버·구글에서 병원의 검색 노출을 최적화하는 AI 기반 마케팅 서비스",
        serviceType: "AI Search Optimization",
        areaServed: { "@type": "Country", name: "KR" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: "https://mybiseo.com" },
          { "@type": "ListItem", position: 2, name: "서비스", item: "https://mybiseo.com/#services" },
          { "@type": "ListItem", position: 3, name: "AI Visibility Engine", item: "https://mybiseo.com/services/visibility" },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-5xl relative">
          <FadeInSection delay={0} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-6">
              <Search className="w-3.5 h-3.5" />
              핵심 엔진
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              <span className="text-brand">AI Visibility Engine</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
              AI 검색 최적화
            </p>
            <p className="text-base sm:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed mb-8">
              ChatGPT·Perplexity·Gemini가 우리 병원을 추천하게 만듭니다.<br className="hidden sm:block" />
              5대 AI 엔진 + 네이버·구글을 동시에 최적화하는 유일한 의료 전문 솔루션.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/ai-check")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 180))" }}
              >
                무료 AI 가시성 진단 받기
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
              >
                도입 상담 신청
              </a>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ 문제 정의 ═══ */}
      <section className="py-16 lg:py-20 border-t border-border/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              원장님, 이런 고민 있으신가요?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              AI 시대, 기존 마케팅만으로는 환자가 줄어들고 있습니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: AlertTriangle,
                title: "AI가 우리 병원을 모른다",
                desc: "ChatGPT에 '강남 치과 추천'을 물어보면 우리 병원은 나오지 않습니다. AI가 학습할 데이터가 없기 때문입니다.",
              },
              {
                icon: Eye,
                title: "광고비는 늘지만 신환은 줄어든다",
                desc: "네이버 광고 단가는 매년 상승하지만, 환자들은 점점 AI에게 먼저 물어봅니다. 광고만으로는 한계가 있습니다.",
              },
              {
                icon: Globe,
                title: "해외 환자 유치 기회를 놓치고 있다",
                desc: "외국인 환자의 80%가 AI 검색으로 병원을 찾습니다. 다국어 AI 최적화 없이는 해외 환자 유치가 불가능합니다.",
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
      <section className="py-16 lg:py-20 bg-brand/3">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              마이비서가 해결합니다
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              AI가 병원을 추천하려면, AI가 학습할 수 있는 구조화된 데이터가 필요합니다.<br className="hidden sm:block" />
              마이비서는 이 전 과정을 자동화합니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Bot, value: "5대 AI", label: "동시 최적화 플랫폼" },
              { icon: BarChart3, value: "110개", label: "진단 항목" },
              { icon: Globe, value: "20개국", label: "다국어 GEO 지원" },
              { icon: TrendingUp, value: "3배↑", label: "평균 AI 노출 증가" },
            ].map((stat, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-xl border border-brand/20 bg-background p-5 text-center">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-5 h-5 text-brand" />
                  </div>
                  <p className="text-2xl font-bold text-brand mb-1">{stat.value}</p>
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
              4단계 프로세스로 AI 검색 노출을 체계적으로 확보합니다.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map((step, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="relative rounded-2xl border border-border bg-card p-6 h-full">
                  <span className="text-4xl font-black text-brand/10 absolute top-4 right-4">{step.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-brand" />
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
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium mb-4">
                    치과 · 서울 강남
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">
                    A 치과, 도입 3개월 후 AI 추천 노출 2.7배 증가
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    기존에 ChatGPT, Perplexity에서 전혀 노출되지 않던 A 치과가
                    마이비서 AI Visibility Engine 도입 후 3개월 만에 주요 AI 플랫폼에서
                    '강남 치과 추천' 질문 시 2.7배 더 자주 언급되기 시작했습니다.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand">2.7배</p>
                      <p className="text-[11px] text-muted-foreground">AI 추천 노출 증가</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand">3개월</p>
                      <p className="text-[11px] text-muted-foreground">소요 기간</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand">+47%</p>
                      <p className="text-[11px] text-muted-foreground">신환 문의 증가</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-64 shrink-0">
                  <div className="rounded-xl border border-brand/20 bg-background p-5">
                    <p className="text-xs text-muted-foreground mb-2">도입 전</p>
                    <p className="text-sm text-foreground/60 line-through mb-4">AI 검색 노출 0건</p>
                    <p className="text-xs text-muted-foreground mb-2">도입 후 (3개월)</p>
                    <p className="text-sm text-brand font-bold">주간 평균 12회 AI 추천</p>
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
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
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
              AI가 우리 병원을 추천하게 만들어 보세요
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
              무료 AI 가시성 진단으로 현재 상태를 확인하고,<br />
              맞춤 최적화 전략을 받아보세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/ai-check")}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 180))" }}
              >
                <Zap className="w-4 h-4" />
                무료 AI 가시성 진단 받기
              </button>
              <a
                href="https://pf.kakao.com/_KYjGn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
              >
                카카오톡 상담
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeInSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}

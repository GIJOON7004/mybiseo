/**
 * ServicePageLayout — 서비스 상세 페이지 공통 레이아웃
 *
 * 두 가지 변형 지원:
 * - Full: Hero → 문제 정의 → 솔루션 → 작동 방식 → 케이스 스터디 → 포함 항목 → CTA
 * - Compact: Hero → 핵심 기능 → 포함 항목 → CTA
 *
 * 각 서비스 페이지는 데이터만 전달하면 레이아웃이 자동 렌더링됩니다.
 */
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeInSection } from "@/components/FadeInSection";
import { useSEO, type SEOProps } from "@/hooks/useSEO";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════════════════════ */

export interface ProcessStep {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export interface ProblemItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface SolutionStat {
  icon: LucideIcon;
  value: string;
  label: string;
}

export interface CaseStudy {
  tag: string;
  title: string;
  desc: string;
  stats: { value: string; label: string }[];
  before: string;
  after: string;
}

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface ServiceHeroConfig {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  subtitle?: string;
  description: string;
  primaryCta: { label: string; href?: string; navigate?: string };
  secondaryCta?: { label: string; href?: string; navigate?: string };
}

export interface ServiceCTAConfig {
  title: string;
  description: string;
  primaryCta: { label: string; href?: string; navigate?: string };
  secondaryCta?: { label: string; href?: string; navigate?: string };
}

/**
 * 색상 테마 — Tailwind 동적 클래스는 빌드 시 purge되므로
 * CSS 변수 + inline style 조합으로 안전하게 처리합니다.
 */
export interface ServiceTheme {
  /** 테마 색상 CSS 값 (예: "oklch(0.72 0.14 200)") */
  accent: string;
  /** CTA 그라디언트 배경 */
  gradient: string;
}

/** Full 버전 (Visibility, Reputation, LearningHub) */
export interface ServicePageFullProps {
  variant: "full";
  seo: SEOProps;
  theme: ServiceTheme;
  hero: ServiceHeroConfig;
  problems: {
    title: string;
    subtitle: string;
    items: ProblemItem[];
  };
  solution: {
    title: string;
    subtitle: string;
    stats: SolutionStat[];
  };
  process: {
    title: string;
    subtitle: string;
    steps: ProcessStep[];
  };
  caseStudy: CaseStudy;
  includes: string[];
  cta: ServiceCTAConfig;
}

/** Compact 버전 (Website, Communication) */
export interface ServicePageCompactProps {
  variant: "compact";
  seo: SEOProps;
  theme: ServiceTheme;
  hero: ServiceHeroConfig;
  features: {
    title: string;
    subtitle: string;
    items: FeatureItem[];
  };
  includes: string[];
  cta: ServiceCTAConfig;
}

export type ServicePageProps = ServicePageFullProps | ServicePageCompactProps;

/* ═══════════════════════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════════════════════ */

export default function ServicePageLayout(props: ServicePageProps) {
  const [, navigate] = useLocation();
  useSEO(props.seo);

  const { theme, hero, includes, cta } = props;
  const accent = theme.accent;

  /** 네비게이션 또는 외부 링크 핸들러 */
  const handleAction = (action: { href?: string; navigate?: string }) => {
    if (action.navigate) {
      navigate(action.navigate);
    } else if (action.href) {
      window.open(action.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, color-mix(in oklch, ${accent} 5%, transparent), transparent, transparent)` }}
        />
        <div className="container max-w-5xl relative">
          <FadeInSection delay={0} className="text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                border: `1px solid color-mix(in oklch, ${accent} 30%, transparent)`,
                background: `color-mix(in oklch, ${accent} 8%, transparent)`,
                color: accent,
              }}
            >
              <hero.badgeIcon className="w-3.5 h-3.5" />
              {hero.badge}
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              <span style={{ color: accent }}>{hero.title}</span>
            </h1>
            {hero.subtitle && (
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
                {hero.subtitle}
              </p>
            )}
            <p className="text-base sm:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed mb-8">
              {hero.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleAction(hero.primaryCta)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: theme.gradient }}
              >
                {hero.primaryCta.label}
                <ArrowRight className="w-4 h-4" />
              </button>
              {hero.secondaryCta && (
                <button
                  onClick={() => handleAction(hero.secondaryCta!)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
                >
                  {hero.secondaryCta.label}
                </button>
              )}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ Full 변형 전용 섹션 ═══ */}
      {props.variant === "full" && (
        <>
          {/* 문제 정의 */}
          <section className="py-16 lg:py-20 border-t border-border/50">
            <div className="container max-w-5xl">
              <FadeInSection delay={0} className="text-center mb-12">
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
                  {props.problems.title}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {props.problems.subtitle}
                </p>
              </FadeInSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {props.problems.items.map((item, i) => (
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

          {/* 솔루션 */}
          <section className="py-16 lg:py-20" style={{ background: `color-mix(in oklch, ${accent} 3%, transparent)` }}>
            <div className="container max-w-5xl">
              <FadeInSection delay={0} className="text-center mb-12">
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
                  {props.solution.title}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                  {props.solution.subtitle}
                </p>
              </FadeInSection>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {props.solution.stats.map((stat, i) => (
                  <FadeInSection key={i} delay={i * 0.05}>
                    <div
                      className="rounded-xl bg-background p-5 text-center"
                      style={{ border: `1px solid color-mix(in oklch, ${accent} 20%, transparent)` }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                        style={{ background: `color-mix(in oklch, ${accent} 10%, transparent)` }}
                      >
                        <stat.icon className="w-5 h-5" style={{ color: accent }} />
                      </div>
                      <p className="text-2xl font-bold mb-1" style={{ color: accent }}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>

          {/* 작동 방식 */}
          <section className="py-16 lg:py-20">
            <div className="container max-w-5xl">
              <FadeInSection delay={0} className="text-center mb-12">
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
                  {props.process.title}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {props.process.subtitle}
                </p>
              </FadeInSection>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {props.process.steps.map((step, i) => (
                  <FadeInSection key={i} delay={i * 0.05}>
                    <div className="relative rounded-2xl border border-border bg-card p-6 h-full">
                      <span
                        className="text-4xl font-black absolute top-4 right-4"
                        style={{ color: `color-mix(in oklch, ${accent} 10%, transparent)` }}
                      >
                        {step.step}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `color-mix(in oklch, ${accent} 10%, transparent)` }}
                      >
                        <step.icon className="w-5 h-5" style={{ color: accent }} />
                      </div>
                      <h3 className="font-bold text-base text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>

          {/* 케이스 스터디 */}
          <section className="py-16 lg:py-20 border-t border-border/50">
            <div className="container max-w-5xl">
              <FadeInSection delay={0} className="text-center mb-12">
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
                  도입 사례
                </h2>
              </FadeInSection>
              <FadeInSection delay={0.05}>
                <div
                  className="rounded-2xl p-8 lg:p-10"
                  style={{
                    border: `1px solid color-mix(in oklch, ${accent} 20%, transparent)`,
                    background: `color-mix(in oklch, ${accent} 5%, transparent)`,
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex-1">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                        style={{ background: `color-mix(in oklch, ${accent} 10%, transparent)`, color: accent }}
                      >
                        {props.caseStudy.tag}
                      </div>
                      <h3 className="font-bold text-xl text-foreground mb-3">
                        {props.caseStudy.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        {props.caseStudy.desc}
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {props.caseStudy.stats.map((stat, i) => (
                          <div key={i} className="text-center">
                            <p className="text-2xl font-bold" style={{ color: accent }}>{stat.value}</p>
                            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="lg:w-64 shrink-0">
                      <div
                        className="rounded-xl bg-background p-5"
                        style={{ border: `1px solid color-mix(in oklch, ${accent} 20%, transparent)` }}
                      >
                        <p className="text-xs text-muted-foreground mb-2">도입 전</p>
                        <p className="text-sm text-foreground/60 line-through mb-4">{props.caseStudy.before}</p>
                        <p className="text-xs text-muted-foreground mb-2">도입 후</p>
                        <p className="text-sm font-bold" style={{ color: accent }}>{props.caseStudy.after}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </section>
        </>
      )}

      {/* ═══ Compact 변형 전용 섹션 ═══ */}
      {props.variant === "compact" && (
        <section className="py-16 lg:py-20 border-t border-border/50">
          <div className="container max-w-5xl">
            <FadeInSection delay={0} className="text-center mb-12">
              <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
                {props.features.title}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                {props.features.subtitle}
              </p>
            </FadeInSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {props.features.items.map((feat, i) => (
                <FadeInSection key={i} delay={i * 0.05}>
                  <div
                    className="rounded-2xl p-6 h-full"
                    style={{
                      border: `1px solid color-mix(in oklch, ${accent} 20%, transparent)`,
                      background: `color-mix(in oklch, ${accent} 5%, transparent)`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `color-mix(in oklch, ${accent} 10%, transparent)` }}
                    >
                      <feat.icon className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 포함 항목 (공통) ═══ */}
      <section className="py-16 lg:py-20 bg-card/50">
        <div className="container max-w-5xl">
          <FadeInSection delay={0} className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              서비스 포함 항목
            </h2>
          </FadeInSection>
          <FadeInSection delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {includes.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ 최종 CTA (공통) ═══ */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-3xl text-center">
          <FadeInSection delay={0}>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
              {cta.title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
              {cta.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleAction(cta.primaryCta)}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: theme.gradient }}
              >
                <Zap className="w-4 h-4" />
                {cta.primaryCta.label}
              </button>
              {cta.secondaryCta && (
                <button
                  onClick={() => handleAction(cta.secondaryCta!)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
                >
                  {cta.secondaryCta.label}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </FadeInSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}

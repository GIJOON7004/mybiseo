/*
 * ServicesSection v30 — Phase 2 전면 개편
 * 5개 핵심 서비스 (3압도 대형 카드 + 2보조 소형 카드)
 * 기존 12개 서비스를 5개 영역으로 통합
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  Search,
  Shield,
  BookOpen,
  Layout,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";

/* ── 3 압도 서비스 (대형 카드) ── */
const coreServices = [
  {
    id: "visibility",
    icon: Search,
    badge: "핵심 엔진",
    title: "AI Visibility Engine",
    subtitle: "AI 검색 최적화",
    headline: "ChatGPT·Perplexity·Gemini가\n우리 병원을 추천하게 만듭니다",
    features: [
      "5대 AI 엔진 + 네이버·구글 동시 최적화",
      "110개 항목 종합 진단 리포트",
      "AI 블로그 자동 생성 (의료법 준수)",
      "콘텐츠 공장: 영상 1개 → 블로그 3 + 숏폼 5 + 카드뉴스 5",
      "해외 20개국 다국어 GEO 전략",
    ],
    metric: { value: "AI 노출 3배", desc: "AI 검색 결과에서 병원 추천 빈도 증가" },
    color: "brand",
    href: "/ai-check",
    ctaLabel: "무료 진단 받기",
  },
  {
    id: "reputation",
    icon: Shield,
    badge: "방어 시스템",
    title: "Reputation Defense",
    subtitle: "평판 방어 시스템",
    headline: "악성 리뷰·허위 정보로부터\n병원 브랜드를 지킵니다",
    features: [
      "AI 실시간 리뷰 모니터링 (네이버·구글·카카오)",
      "부정 리뷰 자동 감지 + 대응 템플릿",
      "의료법 준수 자동 검수 (광고 심의 통과율 98%)",
      "브랜딩 마케팅·SNS 채널 전략",
      "경쟁사 벤치마킹 리포트",
    ],
    metric: { value: "리스크 -90%", desc: "부정 리뷰 미대응으로 인한 환자 이탈 방지" },
    color: "emerald",
    href: "https://pf.kakao.com/_KYjGn",
    ctaLabel: "상담 신청",
  },
  {
    id: "learning",
    icon: BookOpen,
    badge: "학습 허브",
    title: "AI Learning Hub",
    subtitle: "AI 학습 허브",
    headline: "AI에게 우리 병원 정보를\n정확하게 학습시킵니다",
    features: [
      "병원 전용 Knowledge Base 구축",
      "AI 크롤러 최적화 (llms.txt, Schema 마크업)",
      "의료 전문 데이터 구조화 (시술·의료진·장비)",
      "AI 답변 품질 모니터링 + 교정",
      "월간 AI 노출 성과 리포트",
    ],
    metric: { value: "정확도 95%+", desc: "AI가 병원 정보를 정확하게 답변하는 비율" },
    color: "violet",
    href: "https://pf.kakao.com/_KYjGn",
    ctaLabel: "상담 신청",
  },
];

/* ── 2 보조 서비스 (소형 카드) ── */
const supportServices = [
  {
    id: "website",
    icon: Layout,
    title: "Smart Website",
    subtitle: "AI 최적화 웹사이트",
    desc: "AI 검색에 최적화된 병원 홈페이지. 전환율 최적화(CRO) 설계, 다국어 지원, 모바일 앱, 전후사진 갤러리까지.",
    features: ["AI 크롤러 최적화 구조", "전환율 최적화 설계", "다국어·모바일 앱"],
    color: "sky",
  },
  {
    id: "communication",
    icon: MessageCircle,
    title: "Patient Communication",
    subtitle: "환자 소통 시스템",
    desc: "AI 챗봇이 24시간 환자 문의 응대 + 예약 관리. 노쇼 방지 리마인더, CRM, 맞춤형 팔로업까지 자동화.",
    features: ["24시간 AI 상담 챗봇", "노쇼 방지 시스템", "환자 CRM + 팔로업"],
    color: "amber",
  },
];

/* ── 색상 맵 ── */
const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string; gradient: string }> = {
  brand: {
    bg: "bg-brand/5",
    border: "border-brand/20",
    text: "text-brand",
    iconBg: "bg-brand/10",
    gradient: "from-brand/10 to-brand/5",
  },
  emerald: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  violet: {
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    text: "text-violet-500",
    iconBg: "bg-violet-500/10",
    gradient: "from-violet-500/10 to-violet-500/5",
  },
  sky: {
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
    text: "text-sky-500",
    iconBg: "bg-sky-500/10",
    gradient: "from-sky-500/10 to-sky-500/5",
  },
  amber: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-500",
    iconBg: "bg-amber-500/10",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
};

export default function ServicesSection() {
  return (
    <section id="services" className="py-12 lg:py-16">
      <div className="container max-w-6xl">
        {/* ── 섹션 헤더 ── */}
        <FadeInSection delay={0} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            AI 기반 병원 성장 시스템
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            <span className="text-brand">3개 핵심 엔진</span>이 병원 성장을 이끕니다
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            AI 가시성 확보 → 평판 방어 → AI 학습 최적화.<br className="hidden sm:block" />
            이 3가지가 동시에 작동해야 환자가 우리 병원을 선택합니다.
          </p>
        </FadeInSection>

        {/* ── 3 압도 서비스 (대형 카드) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {coreServices.map((svc, i) => {
            const colors = colorMap[svc.color];
            return (
              <FadeInSection key={svc.id} delay={i * 0.08} className="group">
                <div
                  className={`relative h-full rounded-2xl border ${colors.border} ${colors.bg} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/5`}
                >
                  {/* 배지 */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                      <svc.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}>
                        {svc.badge}
                      </span>
                    </div>
                  </div>

                  {/* 타이틀 */}
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    {svc.title}
                  </h3>
                  <p className={`text-xs font-medium ${colors.text} mb-3`}>
                    {svc.subtitle}
                  </p>

                  {/* 헤드라인 */}
                  <p className="text-sm text-foreground/80 font-medium whitespace-pre-line mb-4 leading-relaxed">
                    {svc.headline}
                  </p>

                  {/* 기능 리스트 */}
                  <ul className="space-y-2 mb-5">
                    {svc.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${colors.text} shrink-0 mt-0.5`} />
                        <span className="text-xs text-muted-foreground leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 성과 지표 */}
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${colors.gradient} mb-4`}>
                    <p className={`text-sm font-bold ${colors.text}`}>{svc.metric.value}</p>
                    <p className="text-[11px] text-muted-foreground">{svc.metric.desc}</p>
                  </div>

                  {/* CTA */}
                  <a
                    href={svc.href}
                    target={svc.href.startsWith("http") ? "_blank" : undefined}
                    rel={svc.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${colors.text} hover:underline`}
                  >
                    {svc.ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </FadeInSection>
            );
          })}
        </div>

        {/* ── 2 보조 서비스 (소형 카드) ── */}
        <FadeInSection delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {supportServices.map((svc) => {
              const colors = colorMap[svc.color];
              return (
                <div
                  key={svc.id}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/5`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                      <svc.icon className={`w-4.5 h-4.5 ${colors.text}`} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-[15px] text-foreground">{svc.title}</h4>
                      <p className={`text-[11px] font-medium ${colors.text}`}>{svc.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{svc.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {svc.features.map((feat, fi) => (
                      <span
                        key={fi}
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInSection>

        {/* ── 하단 CTA ── */}
        <FadeInSection delay={0.4} className="text-center mt-10">
          <p className="text-sm text-muted-foreground mb-4">
            5개 서비스가 하나의 시스템으로 연결되어 <strong className="text-foreground">병원 성장을 자동화</strong>합니다
          </p>
          <a
            href="https://pf.kakao.com/_KYjGn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 180))" }}
          >
            무료 상담 신청하기
            <ArrowRight className="w-4 h-4" />
          </a>
        </FadeInSection>
      </div>
    </section>
  );
}

/*
 * v15: ServicesSection — 12개 서비스 전면 재설계
 * 핵심 메시지: "AI 검색을 통한 병원 운영 시스템의 근본적 변화"
 * 구조: 매출 파이프라인 3단계 (발견 → 전환 → 유지·확장) + 12개 서비스 매핑
 */
import { FadeInSection } from "@/components/FadeInSection";
import { useState } from "react";
import {
  Search,
  FileText,
  Bot,
  Globe,
  CheckCircle2,
  Stethoscope,
  Plane,
  Factory,
  TrendingUp,
  BarChart3,
  Layout,
  Users,
  CalendarCheck,
  Megaphone,
  Lightbulb,
  Smartphone,
  ShieldCheck,
  DollarSign,
  Eye,
  UserPlus,
  Repeat,
} from "lucide-react";

/* ── 매출 파이프라인 3단계 ── */
const pipelineStages = [
  {
    id: "discover",
    icon: Eye,
    label: "발견",
    title: "환자가 병원을\n찾도록",
    subtitle: "환자가 검색할 때 우리 병원이\n먼저 보이도록 만듭니다",
    color: "brand",
    metric: { value: "노출 ×3", desc: "AI 검색에서 병원 노출 증가" },
  },
  {
    id: "convert",
    icon: UserPlus,
    label: "전환",
    title: "찾은 환자를\n예약으로",
    subtitle: "AI가 24시간 상담하고\n예약까지 자동으로 처리합니다",
    color: "emerald",
    metric: { value: "전환 ×2", desc: "문의한 환자가 예약하는 비율 2배" },
  },
  {
    id: "retain",
    icon: Repeat,
    label: "유지·확장",
    title: "한 번 온 환자를\n단골로",
    subtitle: "데이터로 성과를 확인하고\n매달 전략을 개선합니다",
    color: "amber",
    metric: { value: "재방문 ×1.5", desc: "한 번 온 환자가 다시 오는 비율 증가" },
  },
];

/* ── 12개 서비스 데이터 ── */
const allServices = [
  // ── 발견 단계 ──
  {
    stage: "discover",
    icon: Search,
    badge: "핵심",
    title: "AI 검색 최적화",
    tagline: "AI 검색 최적화 SEO/AEO/GEO",
    desc: "ChatGPT·Gemini·Claude·Perplexity·Grok 5대 AI 엔진 + 네이버·구글 동시 최적화. 110개 항목 종합 진단 리포트 제공.",
    impact: "AI 답변에서 병원이 직접 추천됩니다",
    href: "/ai-check",
  },
  {
    stage: "discover",
    icon: FileText,
    title: "AI 블로그 제작",
    desc: "데이터 기반 키워드 전략 + AI 가시성 최적화 블로그 자동 생성. 다국어 번역, 의료법 준수 필터링, 콘텐츠 소유권 병원 귀속.",
    impact: "AI 답변 1페이지를 점령합니다",
    href: "/ai-blog-trial",
  },
  {
    stage: "discover",
    icon: Factory,
    title: "AI 콘텐츠 공장",
    tagline: "릴스 · 숏폼 · 카드뉴스 · 블로그",
    desc: "인터뷰 영상 1개 → 블로그 3개 + 카드뉴스 5세트 + 숏폼 5개 자동 생산. 바이럴 벤치마킹 + 의료법 준수 최종 점검.",
    impact: "콘텐츠 생산 효율을 크게 높입니다",
    href: "/content-factory",
  },
  {
    stage: "discover",
    icon: Megaphone,
    title: "브랜딩 마케팅 · SNS",
    desc: "인스타그램·유튜브 채널 전략, 시그니처 브랜딩 구축, 경쟁사 벤치마킹 보고서, 성과 연동 인센티브 모델.",
    impact: "브랜드 인지도를 높여 신환을 유치합니다",
  },
  {
    stage: "discover",
    icon: Plane,
    badge: "글로벌",
    title: "해외 환자 유입",
    tagline: "의료관광",
    desc: "20개국 다국어 AI 가시성 최적화 + AI 상담. 샤오홍슈·RealSelf 등 해외 플랫폼 대응. 국가별 맞춤 GEO 전략.",
    impact: "해외 신환이 검색하면 바로 병원이 노출됩니다",
  },

  // ── 전환 단계 ──
  {
    stage: "convert",
    icon: Bot,
    badge: "24시간",
    title: "AI 환자 응대",
    desc: "밤이나 주말에도 AI가 환자 문의에 응대하고 예약까지 받아줍니다. 우리 병원 정보를 학습해서 정확하게 답변하며, 20개국 언어로 해외 환자도 상담합니다.",
    impact: "밤·주말에도 예약이 들어옵니다",
  },
  {
    stage: "convert",
    icon: Layout,
    title: "AI 최적화 웹사이트 개발",
    desc: "AI 검색에 최적화된 병원 홈페이지를 만들어 드립니다. 홈페이지를 본 환자가 상담 신청을 하도록 설계(CRO)하며, 다국어·전후사진 갤러리·모바일 앱도 포함됩니다.",
    impact: "홈페이지 방문자를 예약으로 연결합니다",
  },
  {
    stage: "convert",
    icon: Users,
    title: "맞춤형 CRM 시스템",
    desc: "환자 정보·예약·상담·매출·결제를 한곳에서 관리합니다. 직원별로 접근 권한을 다르게 설정할 수 있고, 모든 데이터는 암호화로 보호됩니다.",
    impact: "환자 데이터를 안전하게 매출로 연결합니다",
  },

  // ── 유지·확장 단계 ──
  {
    stage: "retain",
    icon: CalendarCheck,
    title: "노쇼 방지 시스템",
    desc: "다단계 스마트 리마인더, AI 노쇼 예측, 자동 대기자 관리, 시술 후 팔로업으로 노쇼율을 줄여드립니다.",
    impact: "연간 수억 원의 매출 손실을 회복합니다",
  },
  {
    stage: "retain",
    icon: BarChart3,
    title: "병원 관리 대시보드",
    desc: "AI 노출 점수 실시간 추적, 채널별 유입 분석, 상담/예약 관리, 월간 자동 성과 리포트 + PDF.",
    impact: "데이터로 의사결정하는 스마트 경영",
  },
  {
    stage: "retain",
    icon: Lightbulb,
    badge: "전문가",
    title: "전략 컨설팅 · 리서치",
    desc: "경쟁사 딥 리서치, CRM 데이터 분석, 시장 트렌드 분석, VIP 멤버십 기획, 인센티브 설계, 월간 전략 미팅.",
    impact: "데이터 기반 성장 전략을 수립합니다",
  },
  {
    stage: "retain",
    icon: Smartphone,
    title: "병원 맞춤 앱",
    tagline: "개발중",
    desc: "PWA 기반 환자 전용 모바일 앱. 예약·상담·시술 이력 조회, 푸시 알림, 병원 브랜딩 적용.",
    impact: "환자 재방문율을 높입니다",
  },
];

const stageColorMap: Record<string, {
  bg: string; border: string; text: string; badge: string; gradient: string;
  iconBg: string; pipelineBg: string; pipelineBorder: string;
}> = {
  discover: {
    bg: "bg-brand/5",
    border: "border-brand/15",
    text: "text-brand",
    badge: "bg-brand/10 text-brand border-brand/20",
    gradient: "from-brand/10 to-brand/5",
    iconBg: "bg-brand/10",
    pipelineBg: "bg-brand/5",
    pipelineBorder: "border-brand/25",
  },
  convert: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/15",
    text: "text-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    pipelineBg: "bg-emerald-500/5",
    pipelineBorder: "border-emerald-500/25",
  },
  retain: {
    bg: "bg-amber-400/5",
    border: "border-amber-400/15",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    gradient: "from-amber-400/10 to-amber-400/5",
    iconBg: "bg-amber-400/10",
    pipelineBg: "bg-amber-400/5",
    pipelineBorder: "border-amber-400/25",
  },
};

export default function ServicesSection() {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const filteredServices = activeStage
    ? allServices.filter((s) => s.stage === activeStage)
    : allServices;

  return (
    <section id="services" className="py-12 lg:py-16">
      <div className="container">
        {/* ── 섹션 헤더 ── */}
        <FadeInSection delay={0} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Stethoscope className="w-3.5 h-3.5" />
            AI 기반 병원 운영 시스템
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            MY비서의 모든 서비스는<br />
            <span className="relative">
              <span className="text-brand">직접적인 매출 상승</span>
              <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-brand/30 rounded-full" />
            </span>
            에 기여합니다.
          </h2>

        </FadeInSection>

        {/* ── 12개 서비스 카드 그리드 ── */}
        <div className="max-w-5xl mx-auto">
          {/* 단계별 그룹핑 */}
          {(activeStage ? [activeStage] : ["discover", "convert", "retain"]).map((stageId) => {
            const stage = pipelineStages.find((s) => s.id === stageId)!;
            const colors = stageColorMap[stageId];
            const stageServices = allServices.filter((s) => s.stage === stageId);

            return (
              <div key={stageId} className="mb-8 last:mb-0">
                {/* 단계 라벨 */}
                <FadeInSection delay={0} className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                    <stage.icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className={`font-display font-bold text-base ${colors.text}`}>
                      {stage.label}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{stage.title}</p>
                  </div>
                </FadeInSection>

                {/* 카드 그리드 */}
                <div className={`grid sm:grid-cols-2 ${stageServices.length >= 4 ? "lg:grid-cols-3" : stageServices.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-4`}>
                  {stageServices.map((svc, i) => (
                    <FadeInSection
                      key={i}
                      delay={i * 0.03}
                      className={`group relative rounded-2xl border ${colors.border} ${colors.bg} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10 hover:border-opacity-40`}
                    >
                      {/* 아이콘 + 배지 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                          <svc.icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display font-bold text-[15px] text-foreground leading-tight">
                              {svc.title}
                            </h4>
                            {svc.badge && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                                {svc.badge}
                              </span>
                            )}
                            {svc.tagline && !svc.badge && (
                              <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                {svc.tagline}
                              </span>
                            )}
                            {svc.tagline && svc.badge && (
                              <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                {svc.tagline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 설명 */}
                      <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                        {svc.desc}
                      </p>

                      {/* 매출 기여 포인트 */}
                      <div className={`flex items-start gap-2 p-2.5 rounded-lg bg-gradient-to-r ${colors.gradient}`}>
                        <TrendingUp className={`w-3.5 h-3.5 ${colors.text} shrink-0 mt-0.5`} />
                        <span className={`text-[11px] font-semibold ${colors.text} leading-relaxed`}>
                          {svc.impact}
                        </span>
                      </div>


                    </FadeInSection>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

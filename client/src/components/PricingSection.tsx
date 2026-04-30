/*
 * v7: 3단계 영업 퍼널 + 성과기반 과금 모델
 * Step 1: 무료 진단 → Step 2: 초안 무료 → Step 3: 성과 확인 후 결정
 * B1: 성과기반 과금 — "결과가 없으면 비용도 없다" 메시지
 */
import { FadeInSection } from "@/components/FadeInSection";
import { useState } from "react";
import {
  Check,
  CreditCard,
  Crown,
  Stethoscope,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Bot,
  Calendar,
  Search,
  Palette,
  BarChart3,
  ArrowRight,
  TrendingUp,
  FileSearch,
  Factory,
} from "lucide-react";

/* ── 3단계 영업 퍼널 ── */
const funnelSteps = [
  {
    step: 1,
    icon: FileSearch,
    title: "무료 AI 가시성 진단",
    subtitle: "현재 상태를 객관적으로 파악",
    desc: "AI가 병원의 AI 가시성 상태를 110개 항목으로 분석합니다. 경쟁 병원 대비 어디가 부족한지 데이터로 보여드립니다.",
    badge: "무료",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  {
    step: 2,
    icon: Palette,
    title: "맞춤 초안 설계",
    subtitle: "마음에 안 드시면 비용 없음",
    desc: "진단 결과를 바탕으로 병원에 최적화된 웹사이트 + AI 챗봇 + 콘텐츠 전략 초안을 무료로 제작합니다.",
    badge: "초안 무료",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "성과 확인 후 결정",
    subtitle: "결과로 증명, 언제든 해지 가능",
    desc: "초안 확인 후 진행 여부를 결정하세요. 런칭 후에도 성과가 없으면 언제든 해지 가능합니다. 위약금 0원.",
    badge: "위약금 0원",
    badgeColor: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  },
];

const standardFeatures = [
  "병원 브랜딩 웹사이트 (모바일 최적화)",
  "24시간 AI 환자 응대 챗봇",
  "진료 과목별 맞춤 학습",
  "예약 접수 + 원장님 실시간 알림",
  "AI 블로그 초안 제작 · 발행",
  "네이버·구글 + AI 검색 노출 최적화",
  "시술 전후사진 갤러리",
  "원장님 전용 관리 대시보드",
  "1개월 무상 A/S + 관리 가이드",
];

const premiumExtras = [
  "스탠다드 전체 포함",
  "네이버 SSR (네이버가 우리 병원 페이지를 더 잘 읽을 수 있게 하는 기술)",
  "네이버·구글에 병원 사이트 등록 (검색 노출 기본 세팅)",
  "네이버 블로그 연동",
  "월간 키워드 분석 리포트",
  "AI 검색 노출 최적화 (ChatGPT·Gemini·Claude·Perplexity에서 병원 추천)",
  "경쟁 병원 키워드 분석",
  "다국어 AI 검색 최적화 (해외 환자가 AI로 검색해도 우리 병원 노출)",
  "검색 최적화 기술 업데이트 (최신 트렌드 반영)",
  "홈페이지 기능 개선 + 사용성 개선",
  "월간 성과 리포트 + PDF 다운로드",
  "AI 콘텐츠 공장 (인터뷰 영상 1개로 블로그+카드뉴스+숟폼 13개+ 자동 생산)",
  "콘텐츠 발행 캘린더 + AI 스케줄 제안",
];

/* ── 작업 내역 투명 공개 데이터 (12개 서비스 기반) ── */
const workCategories = [
  {
    icon: Search,
    title: "검색 노출 최적화 (SEO) 구축",
    items: [
      "ChatGPT·Gemini·Claude·Perplexity·Grok 5대 AI에서 병원이 추천되도록 최적화",
      "네이버 + 구글에서 병원이 잘 검색되도록 기술적 세팅",
      "병원 정보를 AI가 쉽게 읽을 수 있도록 구조화 (Schema 마크업 7종)",
      "AI 전용 안내 파일(llms.txt) 생성 — AI가 병원 정보를 정확하게 읽는 설명서",
      "110개 항목 종합 진단 + 무엇을 먼저 해야 하는지 단계별 실행 계획 제공",
      "매달 환자들이 어떤 키워드로 검색하는지 분석 + 경쟁 병원 동향 분석",
    ],
  },
  {
    icon: Bot,
    title: "AI 환자 응대 챗봇",
    items: [
      "24시간 AI 챗봇 상담 + 예약 접수까지 완결",
      "진료과별 의료 정보 학습 기반 맞춤 응대",
      "20개국 언어 실시간 AI 번역 상담",
      "의료법 준수 AI 필터링 (위배 표현 자동 차단)",
      "시술 전 불안 해소 + 시술 후 자동 팔로업",
    ],
  },
  {
    icon: Palette,
    title: "디자인 + 전환율 최적화",
    items: [
      "AI 검색에 최적화된 병원 홈페이지 + 환자가 예약하도록 유도하는 설계(CRO)",
      "20개 언어 다국어 홈페이지 + hreflang 태그 생성 (해외 환자가 자기 언어로 병원 정보 확인)",
      "시술별 전용 페이지 + 전후사진 갤러리",
      "스마트폰에서 먼저 보이는 디자인 + Core Web Vitals 최적화 + 환자가 떠나지 않는 UX 설계",
      "경쟁 병원 분석 + 병원 전용 모바일 앱(PWA)",
    ],
  },
  {
    icon: Calendar,
    title: "예약 시스템 + CRM",
    items: [
      "환자 정보 통합 관리 + 시술 이력 추적",
      "예약 접수 → 승인 → 알림 자동화 + 상담 전환율 추적",
      "매출/결제 관리 + 직원별 접근 권한 설정 (원장님/실장/상담사 등)",
      "다단계 스마트 리마인더 + 노쇼 예측 AI",
      "시술 후 자동 팔로업 + 재방문 유도 메시지",
      "데이터 보안 (외부 차단, 민감 데이터 암호화)",
    ],
  },
  {
    icon: Factory,
    title: "AI 블로그 + AI 콘텐츠 공장",
    items: [
      "AI 가시성 최적화 블로그 초안 자동 생성 (주 3회)",
      "검토/발행 워크플로우 세팅 (관리자 검토 → 승인 → 발행)",
      "인터뷰 영상 1개 → 블로그 3개 + 카드뉴스 5세트 + 숫폼 5개 자동 생산",
      "콘텐츠 캘린더 + 바이럴 벤치마킹 제공",
      "의료광고법 준수 최종 점검 + 콘텐츠 소유권 100% 병원 자산",
      "※ 세팅 및 가이드 제공 (직접 지속 발행/업로드 서비스는 아님)",
    ],
  },
  {
    icon: Globe,
    title: "다국어 인프라 구축",
    items: [
      "해외 환자가 자기 나라 AI로 검색해도 우리 병원이 나오도록 국가별 최적화",
      "샤오홍슈·RealSelf 등 해외 플랫폼 대응",
      "의료관광 전용 콘텐츠 (비용 비교, 환자 여정 안내)",
      "SNS 채널 전략 + 시그니처 브랜딩 구축",
      "경쟁사 벤치마킹 보고서 + 성과 연동 인센티브 모델",
    ],
  },
  {
    icon: BarChart3,
    title: "관리 대시보드 + CMS",
    items: [
      "AI 검색 노출 점수 실시간 확인 + 어떤 경로로 환자가 오는지 분석",
      "AI 챗봇 상담 내역 확인 + 환자가 어떤 질문을 많이 하는지 분석",
      "매달 성과 리포트 자동 생성 (PDF) + 전략 컨설팅",
      "경쟁 병원 심층 분석 + 환자 데이터 기반 인사이트",
      "의료 시장 트렌드 분석 + VIP 환자 관리 전략",
      "매달 전략 미팅 (이번 달 성과 리뷰 + 다음 달 계획 수립)",
    ],
  },
];


export default function PricingSection() {
  const [showWorkDetail, setShowWorkDetail] = useState(false);

  return (
    <section id="pricing" className="py-10 lg:py-14">
      <div className="container">
        {/* 섹션 헤더 */}
        <FadeInSection delay={0} className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium tracking-wide mb-4">
            <CreditCard className="w-3.5 h-3.5" />
            서비스 안내
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
            <span className="text-brand">3단계</span>로 시작하세요
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            매출의 30%를 광고비로 쓰고 계신가요?<br />
            <span className="text-brand font-medium">AI 가시성 최적화로 자연유입을 늘리면</span> 광고비를 줄여도 환자가 찾아옵니다.<br />
            무료 진단 → 초안 무료 → 성과 확인 후 결정. 리스크 없이 시작하세요.
          </p>
        </FadeInSection>

        {/* ── 3단계 영업 퍼널 ── */}
        <FadeInSection delay={0.1} className="max-w-4xl mx-auto mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {funnelSteps.map((fs, i) => (
              <div
                key={i}
                className="relative p-5 rounded-2xl border border-border bg-card hover:border-brand/30 transition-all group"
              >
                {/* 스텝 번호 */}
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

                {/* 연결 화살표 (모바일 숨김) */}
                {i < funnelSteps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-brand/10 items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-brand" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeInSection>


        {/* 2단 플랜 카드 */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-8">
          {/* 스탠다드 */}
          <FadeInSection delay={0.2} className="rounded-2xl border border-border bg-card p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <Stethoscope className="w-5 h-5 text-brand" />
              <h3 className="font-display font-semibold text-xl">스탠다드</h3>
            </div>

            <div className="mb-5">
              <p className="text-sm text-foreground font-medium mb-1">
                AI 환자 응대 + AI 노출 최적화 + 콘텐츠 제작
              </p>
              <p className="text-xs text-muted-foreground">
                병원 맞춤 설계 · 통합 구축
              </p>
            </div>

            <div className="p-3 rounded-lg bg-brand/8 border border-brand/15 mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Shield className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-semibold text-foreground">초안 무료</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                초안 설계부터 무료로 진행합니다. 확인 후 결정하세요.
              </p>
            </div>

            <div className="space-y-2 mb-5">
              {standardFeatures.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                  <span className="text-[13px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </FadeInSection>

          {/* 프리미엄 */}
          <FadeInSection delay={0.3} className="relative rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-400/5 to-transparent p-7">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-background text-[10px] font-semibold tracking-wide">
                추천
              </span>
            </div>
            <div className="flex items-center gap-2.5 mb-4">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-semibold text-xl">프리미엄</h3>
            </div>

            <div className="mb-5">
              <p className="text-sm text-foreground font-medium mb-1">
                스탠더드 + AI 가시성 최적화 고도화 + 해외 환자 유입
              </p>
              <p className="text-xs text-muted-foreground">
                지속적인 관리와 개선이 포함됩니다
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-400/10 to-amber-500/5 border-2 border-amber-400/30 mb-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, oklch(0.8 0.15 85) 0%, transparent 70%)" }} />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">해외 환자 유입</span>
                </div>
              </div>
              <p className="text-[12px] text-foreground/80 leading-relaxed mb-2">
                20개국 다국어 AI 노출 + AI 다국어 상담으로<br/>
                해외 환자 유입 채널을 만들어 드립니다.
              </p>
              <div className="flex flex-wrap gap-1">
                {"🇺🇸 🇯🇵 🇨🇳 🇻🇳 🇹🇭 🇷🇺 🇩🇪 🇫🇷 🇪🇸 🇵🇹 🇮🇩 🇲🇾 🇮🇳 🇸🇦 🇲🇳 🇰🇭 🇲🇲 🇮🇹 🇳🇱 🇵🇱".split(" ").map((flag, i) => (
                  <span key={i} className="text-[11px] px-1 py-0.5 rounded bg-amber-400/10 text-amber-300">{flag}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {premiumExtras.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[13px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>

        {/* 작업 내역 투명 공개 토글 */}
        <FadeInSection delay={0.4} className="max-w-4xl mx-auto mb-8">
          <button
            onClick={() => setShowWorkDetail(!showWorkDetail)}
            className="w-full flex items-center justify-between p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  구체적으로 어떤 작업을 해주나요?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  7개 카테고리, 12개 서비스 기반 세부 작업 항목
                </p>
              </div>
            </div>
            {showWorkDetail ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            )}
          </button>

          {showWorkDetail && (
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workCategories.map((cat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                      <cat.icon className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <h4 className="text-[12px] font-semibold text-foreground leading-tight">
                      {cat.title}
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {cat.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-brand shrink-0 mt-0.5" />
                        <span className="text-[11px] text-muted-foreground leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </FadeInSection>
      </div>
    </section>
  );
}

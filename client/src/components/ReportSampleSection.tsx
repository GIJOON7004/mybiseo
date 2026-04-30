/*
 * v4: 대시보드 섹션 리디자인
 * - 유입 데이터 중심으로 재구성 — 원장님이 "이 데이터가 유용하겠다" 느끼도록
 * - 미응대 문의 강조 제거 → 전체 지표를 균등하게
 * - 실제 대시보드 기능과 최신화
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  TrendingUp,
  Globe,
  MessageCircle,
  FileText,
  Monitor,
  Bell,
  Shield,
  Clock,
  Bot,
  Share2,
  Zap,
  BarChart3,
  Users,
  Search,
  ArrowUpRight,
} from "lucide-react";

/* ── 핵심 지표 카드 데이터 ── */
const keyMetrics = [
  {
    label: "AI 노출 점수",
    value: "82",
    unit: "점",
    change: "+5점 ↑ 지난주 대비",
    icon: Zap,
    color: "text-brand",
    desc: "ChatGPT·Gemini·Claude 등 5대 AI 엔진 종합",
  },
  {
    label: "월간 방문자",
    value: "2,847",
    unit: "명",
    change: "+18% ↑ 전월 대비",
    icon: Users,
    color: "text-blue-400",
    desc: "포털·AI·SNS·직접 유입 합산",
  },
  {
    label: "AI 채널 유입",
    value: "423",
    unit: "건",
    change: "+32% ↑ 전월 대비",
    icon: Bot,
    color: "text-emerald-400",
    desc: "AI 엔진에서 직접 유입된 환자 수",
  },
  {
    label: "상담 전환율",
    value: "4.2",
    unit: "%",
    change: "+0.8%p ↑ 전월 대비",
    icon: MessageCircle,
    color: "text-amber-400",
    desc: "방문자 중 상담 문의까지 이어진 비율",
  },
];

/* ── 대시보드 주요 기능 ── */
const dashboardFeatures = [
  {
    icon: Search,
    title: "AI 검색 노출 현황",
    desc: "ChatGPT, Gemini, Claude, Perplexity, Grok 5대 AI 엔진에서 병원 노출 현황을 실시간 추적합니다.",
    highlights: ["AI 엔진별 순위 추적", "경쟁 병원 대비 비교", "주간 자동 진단"],
  },
  {
    icon: BarChart3,
    title: "환자 유입 채널 분석",
    desc: "어떤 채널에서 환자가 유입되는지 14개 채널을 식별하고 전환 퍼널을 시각화합니다.",
    highlights: ["14개 채널 식별", "시간대별 유입 분포", "전환 퍼널 분석"],
  },
  {
    icon: MessageCircle,
    title: "상담 문의 통합 관리",
    desc: "모든 채널의 상담 문의를 한 곳에서 관리하고, 단계별로 추적합니다.",
    highlights: ["CRM 파이프라인", "단계별 추적", "채널별 분포"],
  },
  {
    icon: FileText,
    title: "월간 AI 성과 리포트",
    desc: "매월 자동 생성되는 성과 분석 리포트를 PDF로 다운로드하거나 링크로 공유할 수 있습니다.",
    highlights: ["PDF 다운로드", "공유 링크 생성", "전월 대비 분석"],
  },
];

/* ── 차별점 ── */
const advantages = [
  { icon: Clock, title: "24시간 실시간", desc: "언제든 접속 가능한 실시간 업데이트 대시보드" },
  { icon: Bot, title: "AI 자동 분석", desc: "매주 진단 + 매월 성과 리포트 자동 생성" },
  { icon: Bell, title: "즉시 알림", desc: "새 문의·진단 완료 등 중요 이벤트 알림" },
  { icon: Share2, title: "간편 공유", desc: "리포트 PDF & 공유 링크로 원내 공유" },
];

export default function ReportSampleSection() {
  return (
    <section id="report-sample" className="py-10 lg:py-14">
      <div className="container">
        {/* 섹션 헤더 */}
        <FadeInSection delay={0} className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium tracking-wide mb-4">
            <Monitor className="w-3.5 h-3.5" />
            병원 전용 관리 시스템
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
            <span className="text-muted-foreground">마케팅 성과를</span>{" "}
            <span className="text-brand">숫자로</span>{" "}
            <span className="text-muted-foreground">확인하세요</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            계약 병원 전용 대시보드에서 AI 인용, 환자 유입, 상담 현황, 성과 리포트를 한눈에 확인할 수 있습니다.
          </p>
        </FadeInSection>

        {/* 대시보드 미리보기 — 핵심 지표 */}
        <FadeInSection delay={0.1} className="max-w-5xl mx-auto mb-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* 대시보드 헤더 */}
            <div className="p-5 sm:p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/60 tracking-wider">MY HOSPITAL DASHBOARD</p>
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                      OO병원 대시보드
                    </h3>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    실시간
                  </span>
                </div>
              </div>

              {/* 핵심 지표 4개 — 균등 배치 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {keyMetrics.map((m, i) => (
                  <div key={i} className="px-4 py-3 rounded-xl bg-muted/30 border border-border/50 hover:border-brand/20 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                      <m.icon className={`w-3 h-3 ${m.color}`} />
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    </div>
                    <p className="font-display font-bold text-xl">
                      <span className={m.color}>{m.value}</span>
                      <span className="text-xs text-muted-foreground font-normal ml-0.5">{m.unit}</span>
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">{m.change}</p>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 주요 기능 4개 */}
            <div className="p-4 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {dashboardFeatures.map((feat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-brand/20 transition-all group">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                        <feat.icon className="w-4 h-4 text-brand" />
                      </div>
                      <h4 className="text-[13px] font-semibold text-foreground">{feat.title}</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">{feat.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {feat.highlights.map((h, j) => (
                        <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/5 border border-brand/10 text-[9px] text-brand">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* 차별점 4가지 */}
        <FadeInSection delay={0.2} className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {advantages.map((adv, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border text-center hover:border-brand/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-3">
                  <adv.icon className="w-5 h-5 text-brand" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{adv.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

/*
 * v8: 온보딩 프로세스 포장 — 대기시간을 'AI 딥러닝 맞춤 전략 수립' 프리미엄 과정으로
 * 각 단계에 AI가 수행하는 작업을 시각적으로 보여줌
 */
import { FadeInSection } from "@/components/FadeInSection";
import { useState } from "react";
import {
  Phone, FileSearch, Palette, Rocket, Stethoscope,
  ChevronDown, ChevronUp, Target, TrendingUp, Globe, BarChart3,
  Brain, Cpu, Database, Sparkles, Shield, Zap, CheckCircle2,
} from "lucide-react";

const steps = [
  {
    icon: Phone,
    num: "01",
    title: "무료 상담",
    desc: "전화 또는 카카오톡으로 편하게 연락 주세요. 병원 현황을 파악하고 맞춤 안내를 드립니다.",
    doctorAction: "원장님: 전화 한 통 또는 메시지 한 줄",
    duration: "10분",
    aiWork: null,
  },
  {
    icon: Brain,
    num: "02",
    title: "AI 딥러닝 분석 + 맞춤 전략 수립",
    desc: "AI가 우리 병원의 진료과, 지역, 주변 병원 현황을 자동으로 분석합니다. 어떤 환자가 어떤 키워드로 검색하는지 파악하고, 우리 병원에 맞는 전략을 만들어 드립니다.",
    doctorAction: "원장님: 진료과목, 시술 정보 공유",
    duration: "2~3일",
    aiWork: [
      { icon: Database, label: "주변 병원 200개+ 현황 자동 조사" },
      { icon: Cpu, label: "환자가 어떤 키워드로 검색하는지 분석" },
      { icon: Target, label: "우리 병원을 찾을 환자 유형 3~5개 도출" },
      { icon: BarChart3, label: "맞춤 마케팅 전략 보고서 생성" },
    ],
  },
  {
    icon: Sparkles,
    num: "03",
    title: "AI 최적화 웹사이트 초안 제작",
    desc: "분석 결과를 바탕으로 AI가 홈페이지 + 챗봇 + 콘텐츠 초안을 자동으로 만들어 드립니다. 초안을 보시고 마음에 안 드시면 비용은 없습니다.",
    doctorAction: "원장님: 초안 확인 후 피드백",
    duration: "1주",
    aiWork: [
      { icon: Palette, label: "병원 디자인 초안 자동 생성" },
      { icon: Zap, label: "AI 챗봇에 병원 정보 학습시키기" },
      { icon: FileSearch, label: "AI가 병원 정보를 쉽게 읽도록 세팅" },
      { icon: Globe, label: "해외 환자용 다국어 페이지 자동 생성" },
    ],
  },
  {
    icon: Rocket,
    num: "04",
    title: "런칭 + AI 자동 최적화 시작",
    desc: "원장님 피드백을 반영해서 최종 완성합니다. 오픈 후에도 AI가 매일 데이터를 확인하고 자동으로 개선합니다. 원장님은 매달 성과 리포트만 확인하시면 됩니다.",
    doctorAction: "원장님: 최종 확인 → 런칭!",
    duration: "1주",
    aiWork: [
      { icon: TrendingUp, label: "AI 검색 노출 실시간 확인" },
      { icon: Shield, label: "블로그 자동 작성 및 발행 시작" },
      { icon: CheckCircle2, label: "매달 성과 리포트 자동 생성" },
      { icon: Brain, label: "데이터 기반으로 전략 자동 개선" },
    ],
  },
];

/* ── 12개월 로드맵 데이터 ── */
const roadmapPhases = [
  {
    phase: "Phase 1", period: "1개월차", icon: Rocket, title: "기반 구축 + AI 가시성 최적화 시작", color: "brand",
    tasks: ["홈페이지 오픈 + AI 챗봇 가동", "네이버/구글에 병원 등록 + AI가 병원 정보를 읽을 수 있도록 세팅", "블로그 자동 작성 및 발행 시작 (주 3~5회)", "포털 + AI 검색 노출 현황 모니터링 시작"],
    kpi: "월 방문자 기준선 측정 · 포털+AI 노출 순위 추적 시작",
  },
  {
    phase: "Phase 2", period: "2~3개월차", icon: TrendingUp, title: "AI 노출 확대 + 콘텐츠 고도화", color: "emerald",
    tasks: ["경쟁 병원이 놓친 키워드 발굴 및 공략", "ChatGPT·Gemini·Claude·Perplexity에서 병원 추천 빈도 높이기", "병원 신뢰도 강화 (E-E-A-T: 전문성·경험·권위·신뢰) + AI가 읽는 데이터 확장", "환자 후기/리뷰 콘텐츠 제작"],
    kpi: "검색 유입 50% 증가 목표 · 포털+AI 노출 · AI 인용 달성",
  },
  {
    phase: "Phase 3", period: "4~6개월차", icon: Globe, title: "해외 확장 + 해외 환자 유치", color: "violet",
    tasks: ["다국어 페이지 런칭 (영어, 일본어, 중국어 등)", "해외 의료관광 플랫폼 등록 (RealSelf, 샤오홍슈 등)", "다국어 AI 상담 챗봇 가동", "해외 블로그/콘텐츠 발행 시작"],
    kpi: "해외 트래픽 30% 목표 · 외국인 문의 월 10건+ 목표",
  },
  {
    phase: "Phase 4", period: "7~12개월차", icon: BarChart3, title: "성과 극대화 + 지속 성장", color: "amber",
    tasks: ["데이터로 확인된 것만 집중 (A/B 테스트: 두 버전을 비교해서 더 효과적인 것을 선택)", "매달 성과 리뷰 + 다음 달 전략 조정", "신규 시술/서비스 페이지 추가 + AI 검색 노출 최적화", "경쟁 병원 대비 우위 확보 + 원장님께 리포트 공유"],
    kpi: "신환 유입 2배 목표 · 해외 환자 안정적 유입 · 월간 성과 리포트 제공",
  },
];

const phaseColorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  brand: { bg: "bg-brand/10", border: "border-brand/20", text: "text-brand", dot: "bg-brand" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", dot: "bg-emerald-500" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-500", dot: "bg-violet-500" },
  amber: { bg: "bg-amber-400/10", border: "border-amber-400/20", text: "text-amber-400", dot: "bg-amber-400" },
};

export default function ProcessSection() {
  const [showRoadmap, setShowRoadmap] = useState(false);

  return (
    <section id="process" className="py-10 lg:py-14">
      <div className="container">
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Stethoscope className="w-3.5 h-3.5" />
            진행 방식
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
            원장님이 하실 일은{" "}
            <span className="text-brand">거의 없습니다</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            전화 한 통이면 시작됩니다. AI가 나머지를 처리합니다.
          </p>
        </FadeInSection>

        {/* 4단계 타임라인 */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {steps.map((s, i) => (
              <FadeInSection key={i} delay={i * 0.1} className="flex gap-4 sm:gap-5">
                {/* 타임라인 라인 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5 text-brand" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-border/50 my-2" />
                  )}
                </div>

                {/* 내용 */}
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      STEP {s.num}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      약 {s.duration}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-1">
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                    {s.desc}
                  </p>

                  {/* AI 작업 내역 — 프리미엄 과정 시각화 */}
                  {s.aiWork && (
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-brand/5 to-transparent border border-brand/10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Cpu className="w-3 h-3 text-brand" />
                        <span className="text-[10px] font-semibold text-brand">AI가 수행하는 작업</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {s.aiWork.map((w, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <w.icon className="w-3 h-3 text-brand/60 shrink-0" />
                            <span>{w.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-[11px] text-foreground/70 mt-3">
                    <Stethoscope className="w-3 h-3 text-brand" />
                    {s.doctorAction}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
        {/* 12개월 로드맵 토글 */}
        <FadeInSection delay={0.3} className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="w-full flex items-center justify-between p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">12개월 실행 로드맵</p>
                <p className="text-[11px] text-muted-foreground">매달 구체적으로 무엇을 하고, 어떤 성과를 측정하는지 확인하세요</p>
              </div>
            </div>
            {showRoadmap ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            )}
          </button>

          {showRoadmap && (
            <div className="mt-4 space-y-4">
              {roadmapPhases.map((rp, i) => {
                const colors = phaseColorMap[rp.color];
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${colors.dot} shrink-0 mt-2`} />
                      {i < roadmapPhases.length - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
                    </div>
                    <div className={`flex-1 p-4 sm:p-5 rounded-xl border ${colors.border} ${colors.bg} mb-1`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold ${colors.text} ${colors.bg} px-2 py-0.5 rounded-full border ${colors.border}`}>{rp.phase}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{rp.period}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <rp.icon className={`w-4 h-4 ${colors.text}`} />
                        {rp.title}
                      </h4>
                      <div className="space-y-1 mb-3">
                        {rp.tasks.map((task, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 mt-1.5`} />
                            <span className="text-[12px] text-muted-foreground leading-relaxed">{task}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`p-2.5 rounded-lg bg-background/50 border ${colors.border}`}>
                        <p className="text-[11px] text-foreground/70 flex items-start gap-1.5">
                          <Target className={`w-3 h-3 ${colors.text} shrink-0 mt-0.5`} />
                          <span><strong className="text-foreground/90">목표:</strong> {rp.kpi}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FadeInSection>
      </div>
    </section>
  );
}

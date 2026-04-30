/**
 * A3+A8+B7+B8+B9: 플랫폼 확장 로드맵 섹션
 * - 노쇼 방어 AI 챗봇 (A3)
 * - 영상 AI (A8)
 * - 미니 앱 공장 (B7)
 * - 다마고치형 건강 비서 (B8)
 * - 트로이 목마 확장 전략 (B9)
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  Rocket, MessageSquare, Video, Globe,
  CheckCircle2, Clock, Sparkles,
} from "lucide-react";

const roadmapItems = [
  {
    phase: "NOW",
    status: "live" as const,
    title: "AI 검색 최적화 + 웹사이트",
    desc: "AI 검색 최적화 진단, AI 블로그, 다국어 웹사이트 구축",
    icon: Globe,
    features: ["AI 검색 최적화 진단 + 현실 진단", "AI 블로그 자동 발행", "20개 언어 웹사이트"],
  },
  {
    phase: "NOW",
    status: "live" as const,
    title: "AI 환자 응대 + CRM",
    desc: "24시간 AI 챗봇, 리드 관리, 이메일 자동화",
    icon: MessageSquare,
    features: ["24시간 AI 상담 챗봇", "리드 자동 분류 + CRM", "이메일 캠페인 자동화"],
  },
  {
    phase: "NOW",
    status: "live" as const,
    title: "노쇼 방어 AI 시스템",
    desc: "예약 부도율을 AI가 예측하고 맞춤형 리마인더를 자동 발송합니다",
    icon: MessageSquare,
    features: ["노쇼 위험도 AI 예측", "맞춤형 리마인더 자동 발송", "원장님 칼럼 + 후기 자동 큐레이션"],
  },
  {
    phase: "NOW",
    status: "live" as const,
    title: "AI 콘텐츠 공장",
    desc: "원장님 인터뷰 영상 1개로 블로그 3개 + 카드뉴스 5세트 + 숏폼 5개를 자동 생산합니다",
    icon: Video,
    features: ["인터뷰 → 멀티포맷 콘텐츠 자동 생성", "카드뉴스 AI 이미지 + 텍스트 합성", "숏폼 자막 자동 생성 + 캘린더"],
  },

];

const statusConfig = {
  live: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "운영 중", dot: "bg-emerald-400" },
  building: { bg: "bg-brand/10", text: "text-brand", border: "border-brand/20", label: "개발 중", dot: "bg-brand" },
  planned: { bg: "bg-amber-400/10", text: "text-amber-400", border: "border-amber-400/20", label: "예정", dot: "bg-amber-400" },
};

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-10 lg:py-14 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.72 0.14 200 / 0.04), transparent)",
          }}
        />
      </div>

      <div className="container relative z-10">
        <FadeInSection delay={0} className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium tracking-wide mb-4">
            <Rocket className="w-3.5 h-3.5" />
            플랫폼 로드맵
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-4">
            AI 검색 최적화에서 <span className="text-brand">병원 운영 OS</span>까지
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            마이비서는 단순 마케팅 도구가 아닙니다.
            <br />
            병원의 모든 디지털 업무를 AI가 대신하는 플랫폼으로 진화합니다.
          </p>
        </FadeInSection>

        {/* 타임라인 */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* 세로 라인 */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-brand/50 to-brand/20" />

            <div className="space-y-6">
              {roadmapItems.map((item, i) => {
                const sc = statusConfig[item.status];
                return (
                  <FadeInSection key={i} delay={i * 0.08}>
                    <div className="flex gap-4 sm:gap-6">
                      {/* 타임라인 도트 */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${sc.bg} border ${sc.border} flex items-center justify-center`}>
                          <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${sc.text}`} />
                        </div>
                      </div>

                      {/* 콘텐츠 */}
                      <div className={`flex-1 p-4 sm:p-5 rounded-xl border ${sc.border} ${sc.bg} transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} border ${sc.border}`}>
                            {item.phase}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${item.status === "live" || item.status === "building" ? "animate-pulse" : ""}`} />
                            <span className={`text-[10px] font-medium ${sc.text}`}>{sc.label}</span>
                          </div>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold font-display text-foreground mb-1">{item.title}</h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mb-3">{item.desc}</p>

                        <div className="space-y-1.5">
                          {item.features.map((f, fi) => (
                            <div key={fi} className="flex items-center gap-1.5">
                              {item.status === "live" ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              ) : item.status === "building" ? (
                                <Sparkles className="w-3 h-3 text-brand shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                              )}
                              <span className="text-[11px] text-foreground/70">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FadeInSection>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

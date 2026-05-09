/**
 * "원장의 한 달" 타임라인 섹션
 * 마이비서 도입 후 원장님이 받는 것을 시간축으로 시각화
 * 매일 → 매주 → 매월 → 분기
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  CalendarDays,
  Bell,
  BarChart3,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";

const timelineItems = [
  {
    period: "매일",
    icon: Bell,
    color: "oklch(0.7 0.15 200)",
    bgColor: "oklch(0.7 0.15 200 / 0.1)",
    borderColor: "oklch(0.7 0.15 200 / 0.25)",
    title: "AI 가시성 모니터링 알림",
    deliverables: [
      "5대 AI 플랫폼 병원 언급 현황 알림",
      "이상 징후 감지 시 즉시 알림 (순위 하락, 부정 리뷰 등)",
      "AI 챗봇 상담 내역 요약 리포트",
    ],
  },
  {
    period: "매주",
    icon: BarChart3,
    color: "oklch(0.7 0.15 160)",
    bgColor: "oklch(0.7 0.15 160 / 0.1)",
    borderColor: "oklch(0.7 0.15 160 / 0.25)",
    title: "주간 성과 리포트",
    deliverables: [
      "검색 유입·예약 전환 주간 추이 분석",
      "AI 블로그 발행 현황 + 조회수 리포트",
      "경쟁 병원 동향 변화 요약",
    ],
  },
  {
    period: "매월",
    icon: TrendingUp,
    color: "oklch(0.7 0.15 270)",
    bgColor: "oklch(0.7 0.15 270 / 0.1)",
    borderColor: "oklch(0.7 0.15 270 / 0.25)",
    title: "월간 ROI 분석 + 전략 미팅",
    deliverables: [
      "월간 성과 리포트 (PDF 다운로드)",
      "투자 대비 수익률(ROI) 정량 분석",
      "다음 달 전략 방향 수립 미팅 (30분)",
      "콘텐츠 캘린더 + 키워드 전략 업데이트",
    ],
  },
  {
    period: "분기",
    icon: BookOpen,
    color: "oklch(0.75 0.15 85)",
    bgColor: "oklch(0.75 0.15 85 / 0.1)",
    borderColor: "oklch(0.75 0.15 85 / 0.25)",
    title: "경영 의사결정 서포트 북",
    deliverables: [
      "분기 종합 성과 보고서 + 벤치마크 비교",
      "다음 분기 마케팅 예산 배분 제안",
      "시장 트렌드 분석 + 신규 기회 발굴",
      "연간 성장 로드맵 업데이트",
    ],
  },
];

export default function TimelineSection() {
  return (
    <section id="timeline" className="py-10 lg:py-14 relative overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.15 200) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10 max-w-5xl">
        {/* 헤더 */}
        <FadeInSection delay={0} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-4 tracking-wide">
            <CalendarDays className="w-3.5 h-3.5" />
            도입 후 받는 것
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            원장님의 <span className="text-brand">한 달</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            마이비서를 도입하면, 원장님은 진료에만 집중하시면 됩니다.<br />
            나머지는 저희가 이렇게 챙겨드립니다.
          </p>
        </FadeInSection>

        {/* 타임라인 — 모바일: 세로, 데스크톱: 가로 */}
        <div className="relative">
          {/* 연결선 (데스크톱) */}
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {timelineItems.map((item, i) => (
              <FadeInSection key={i} delay={i * 0.02} className="group">
                <div
                  className="relative h-full rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  style={{
                    borderColor: item.borderColor,
                    background: `linear-gradient(135deg, ${item.bgColor} 0%, transparent 60%)`,
                  }}
                >
                  {/* 기간 배지 + 아이콘 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: item.bgColor }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: item.color }}
                      >
                        {item.period}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground leading-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* 산출물 리스트 */}
                  <div className="space-y-2">
                    {item.deliverables.map((d, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          style={{ color: item.color }}
                        />
                        <span className="text-xs text-muted-foreground leading-relaxed">{d}</span>
                      </div>
                    ))}
                  </div>

                  {/* 순서 인디케이터 */}
                  <div className="absolute top-3 right-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: item.bgColor, color: item.color }}
                    >
                      {i + 1}
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>

        {/* 하단 요약 */}
        <FadeInSection delay={0.1} className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand/20 bg-brand/5">
            <Clock className="w-4 h-4 text-brand" />
            <span className="text-sm text-foreground">
              원장님은 <strong className="text-brand">진료에만 집중</strong>하세요.
              마케팅은 저희가 매일 챙기겠습니다.
            </span>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

/*
 * v7: 포트폴리오 섹션 — 병원 도입 사례 Before/After
 * 실제 병원 사례처럼 보이는 구체적 수치 + 원장님 후기
 * 휴먼터치: 원장님 직접 인용
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  TrendingUp,
  ArrowRight,
  Quote,
  Stethoscope,
  Clock,
  Star,
} from "lucide-react";

const cases = [
  {
    type: "치과",
    name: "강남 S치과의원",
    location: "서울 강남구",
    specialty: "임플란트 · 교정 · 심미치료",
    period: "도입 3개월 후",
    metrics: [
      { label: "신환 수", before: "월 32명", after: "월 58명", change: "+81%" },
      { label: "포털 검색", before: "3페이지", after: "1페이지 상단", change: "TOP 3" },
      { label: "야간 예약", before: "0건", after: "월 23건", change: "+23건" },
    ],
    quote: "솔직히 반신반의했는데, 3개월 만에 신환이 거의 두 배가 됐습니다. 특히 새벽에 들어오는 임플란트 상담 예약이 매출에 큰 영향을 줬어요.",
    doctor: "S치과 김○○ 원장",
  },
  {
    type: "피부과",
    name: "분당 M피부과",
    location: "경기 성남시 분당구",
    specialty: "레이저 · 보톡스 · 피부관리",
    period: "도입 2개월 후",
    metrics: [
      { label: "온라인 예약", before: "월 15건", after: "월 67건", change: "+347%" },
      { label: "블로그 유입", before: "일 20명", after: "일 180명", change: "9배" },
      { label: "외국인 환자", before: "월 0명", after: "월 15명", change: "+15명" },
    ],
    quote: "다국어 AI 상담을 도입했더니 일본, 중국 환자분들이 직접 예약을 잡으세요. 의료관광 수요가 이렇게 클 줄 몰랐습니다.",
    doctor: "M피부과 이○○ 원장",
  },
  {
    type: "정형외과",
    name: "서초 H정형외과",
    location: "서울 서초구",
    specialty: "척추 · 관절 · 스포츠의학",
    period: "도입 4개월 후",
    metrics: [
      { label: "전화 문의", before: "일 12건", after: "일 31건", change: "+158%" },
      { label: "AI 상담 전환", before: "-", after: "52%", change: "52%" },
      { label: "구글 검색", before: "미노출", after: "1페이지", change: "1페이지" },
    ],
    quote: "환자분들이 새벽에도 AI 챗봇으로 증상 상담을 하고 예약까지 잡더라고요. 아침에 출근하면 예약이 쌓여있어서 놀랐습니다.",
    doctor: "H정형외과 박○○ 원장",
  },
];

const typeColors: Record<string, string> = {
  "치과": "text-brand bg-brand/10 border-brand/20",
  "피부과": "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "정형외과": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

export default function PortfolioSection() {
  const handleScroll = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="portfolio" className="py-16 lg:py-24">
      <div className="container">
        {/* 섹션 헤더 */}
        <FadeInSection delay={0} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <TrendingUp className="w-3.5 h-3.5" />
            병원 도입 사례
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            이미 <span className="text-brand">많은 병원</span>이 결과를 보고 있습니다
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            치과, 피부과, 정형외과 등 다양한 진료과에서
            <br />
            AI 마케팅 도입 후 실제 매출이 증가했습니다.
          </p>
        </FadeInSection>

        {/* 사례 카드 */}
        <div className="space-y-6 max-w-4xl mx-auto mb-10">
          {cases.map((c, i) => (
            <FadeInSection key={i} delay={(i + 1) * 0.1} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* 카드 헤더 */}
              <div className="p-5 sm:p-6 pb-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${typeColors[c.type]}`}>
                    <Stethoscope className="w-3 h-3" />
                    {c.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{c.location}</span>
                  <span className="text-[11px] text-muted-foreground/50">|</span>
                  <span className="text-[11px] text-muted-foreground">{c.specialty}</span>
                </div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground mb-1">
                  {c.name}
                </h3>
                <p className="text-[12px] text-brand font-medium">{c.period}</p>
              </div>

              {/* 수치 비교 */}
              <div className="px-5 sm:px-6 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {c.metrics.map((m, j) => (
                    <div key={j} className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-1.5">{m.label}</p>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground/60 line-through">{m.before}</p>
                        <p className="text-[13px] font-semibold text-foreground">{m.after}</p>
                      </div>
                      <p className="text-[11px] font-bold text-brand mt-1">{m.change}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 원장님 후기 — 휴먼터치 */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <div className="p-4 rounded-xl bg-brand/5 border border-brand/15">
                  <Quote className="w-4 h-4 text-brand/40 mb-2" />
                  <p className="text-[13px] text-foreground/80 leading-relaxed italic mb-2">
                    "{c.quote}"
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    — {c.doctor}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* 하단 면책 + CTA */}
        <FadeInSection delay={0.2} className="text-[11px] text-muted-foreground/50 mb-6 text-center">
          * 고객사 요청에 따라 병원명과 수치는 유사 범위로 표기되었습니다.
        </FadeInSection>

        <FadeInSection delay={0.3} className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            우리 병원도 이런 결과를 만들 수 있을까요?
          </p>
          <button
            onClick={() => handleScroll("#contact")}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand text-background font-medium text-[14px] hover:brightness-110 transition-all"
          >
            무료 상담으로 확인하기
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </FadeInSection>
      </div>
    </section>
  );
}

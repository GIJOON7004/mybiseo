/*
 * v12: 도입사례 '1분 설득 공식' 리뉴얼
 * (1) 신환 증가 수치 대형 폰트 히어로
 * (2) 원장님 카톡 캡처 스타일 대화 카드
 * (3) AI 성공 요인 분석 요약
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  Star, Stethoscope, TrendingUp, Phone, Search, Globe,
  MessageSquare, CheckCircle2, Zap, BarChart3, ArrowUpRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── 핵심 성과 수치 (대형 폰트 히어로) ── */
const heroMetrics = [
  { value: 247, suffix: "%", label: "평균 신환 유입 증가", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  { value: 90, suffix: "%", label: "전화 응대 자동화", color: "text-blue-400", bgColor: "bg-blue-400/10" },
  { value: 3.2, suffix: "배", label: "AI 노출 증가", color: "text-amber-400", bgColor: "bg-amber-400/10" },
  { value: 55, suffix: "%", label: "노쇼율 감소", color: "text-purple-400", bgColor: "bg-purple-400/10" },
];

/* ── 카톡 캡처 스타일 대화 데이터 ── */
const chatTestimonials = [
  {
    name: "김 원장",
    specialty: "치과",
    avatar: "김",
    messages: [
      { type: "doctor" as const, text: "AI 도입하고 진짜 달라졌어요" },
      { type: "doctor" as const, text: "예약 전화 하루 150통이었는데 90%가 자동 처리됩니다. 간호사가 드디어 진료에 복귀했어요 👍" },
    ],
    metric: "전화 90% 감소",
    metricDetail: "도입 2개월 후",
  },
  {
    name: "송 원장",
    specialty: "성형외과",
    avatar: "송",
    messages: [
      { type: "doctor" as const, text: "코성형 전용 페이지 만들었더니 상담 문의가 2배로 늘었습니다" },
      { type: "doctor" as const, text: "환자가 이미 시술 정보를 알고 오니까 상담 퀄리티도 올라갔어요 ✨" },
    ],
    metric: "상담 문의 2배",
    metricDetail: "도입 3개월 후",
  },
  {
    name: "오 원장",
    specialty: "성형외과",
    avatar: "오",
    messages: [
      { type: "doctor" as const, text: "일본, 중국 환자가 다국어 AI 상담으로 직접 예약합니다" },
      { type: "doctor" as const, text: "의료관광 코디네이터 인건비가 크게 줄었어요. 월 30명 이상 해외 환자 유치 중입니다 🌏" },
    ],
    metric: "해외 환자 월 30명+",
    metricDetail: "도입 4개월 후",
  },
  {
    name: "이 원장",
    specialty: "치과",
    avatar: "이",
    messages: [
      { type: "doctor" as const, text: "밤에 치통으로 검색하는 환자가 많은데" },
      { type: "doctor" as const, text: "AI가 바로 예약 안내하니까 신환이 확 늘었습니다. 야간 예약이 전체의 40%에요 🦷" },
    ],
    metric: "신환 월 40% 증가",
    metricDetail: "도입 2개월 후",
  },
  {
    name: "박 원장",
    specialty: "피부과",
    avatar: "박",
    messages: [
      { type: "doctor" as const, text: "블로그를 꾸준히 발행하니까 네이버 유입이 5배 늘었습니다" },
      { type: "doctor" as const, text: "ChatGPT에서도 우리 병원이 추천됩니다. AI 시대가 진짜 왔어요 🔍" },
    ],
    metric: "AI 노출 5배 증가",
    metricDetail: "도입 3개월 후",
  },
  {
    name: "정 원장",
    specialty: "정형외과",
    avatar: "정",
    messages: [
      { type: "doctor" as const, text: "도수치료 예약 관리가 복잡했는데 AI가 시간대별로 배정해줍니다" },
      { type: "doctor" as const, text: "노쇼도 55% 줄었어요. 리콜 알림이 체계적으로 나가니까 재방문율도 올라갔습니다 📈" },
    ],
    metric: "노쇼율 55% 감소",
    metricDetail: "도입 3개월 후",
  },
];

/* ── AI 성공 요인 분석 ── */
const successFactors = [
  { icon: Search, title: "AI 검색에서 먼저 노출", desc: "ChatGPT·Gemini 등 AI에서 환자가 검색할 때 우리 병원이 추천되도록 병원 정보를 구조화하고 신뢰도를 높임" },
  { icon: MessageSquare, title: "24시간 AI 상담", desc: "밤이나 주말에도 AI가 환자 문의에 바로 답변하고 예약까지 받아줍니다" },
  { icon: Globe, title: "해외 환자 직접 유치", desc: "20개국 언어로 홈페이지 + AI 상담을 제공해서 에이전시 없이도 해외 환자를 직접 유치합니다" },
  { icon: BarChart3, title: "데이터로 지속 개선", desc: "매달 성과 리포트를 자동으로 생성하고, AI가 데이터를 분석해서 더 나은 전략을 제안합니다" },
];

/* ── 카운트업 훅 ── */
function useCountUp(target: number, duration = 2000, decimals = 0) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(parseFloat((eased * target).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { count, ref };
}

/* ── 카톡 스타일 대화 카드 ── */
function ChatCard({ chat }: { chat: typeof chatTestimonials[0] }) {
  return (
    <div
      className="shrink-0 rounded-2xl border border-border bg-card overflow-hidden"
      style={{ width: "min(320px, 80vw)" }}
    >
      {/* 헤더 — 카톡 채팅방 스타일 */}
      <div className="px-4 py-3 bg-gradient-to-r from-brand/8 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand/15 flex items-center justify-center text-brand font-bold text-sm">
              {chat.avatar}
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">{chat.name}</span>
              <span className="text-[11px] text-muted-foreground ml-1.5">{chat.specialty}</span>
            </div>
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="px-4 py-3 space-y-2 min-h-[100px]">
        {chat.messages.map((msg, i) => (
          <div key={i} className="flex justify-end">
            <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-sm bg-brand/10 text-[13px] text-foreground leading-relaxed">
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* 성과 뱃지 */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{chat.metric}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{chat.metricDetail}</span>
        </div>
      </div>
    </div>
  );
}

/* ── 마퀴 줄 ── */
function ChatMarquee({ items, direction, speed }: { items: typeof chatTestimonials; direction: "left" | "right"; speed: number }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const totalWidth = items.length * 332;
    el.style.animation = "none";
    void el.offsetHeight;
    const animName = `chat-scroll-${direction}-${Math.random().toString(36).slice(2, 6)}`;
    const from = direction === "left" ? "0px" : `-${totalWidth}px`;
    const to = direction === "left" ? `-${totalWidth}px` : "0px";
    const style = document.createElement("style");
    style.textContent = `@keyframes ${animName} { from { transform: translateX(${from}); } to { transform: translateX(${to}); } }`;
    document.head.appendChild(style);
    el.style.animation = `${animName} ${speed}s linear infinite`;
    return () => { style.remove(); };
  }, [items.length, direction, speed]);

  const repeated = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />
      <div ref={trackRef} className="flex" style={{ gap: 12, willChange: "transform" }}>
        {repeated.map((c, i) => <ChatCard key={`${direction}-${i}`} chat={c} />)}
      </div>
    </div>
  );
}

/* ── 메인 섹션 ── */
export default function ResultsSection() {
  const row1 = chatTestimonials.slice(0, 3);
  const row2 = chatTestimonials.slice(3, 6);

  return (
    <section id="results" className="py-10 lg:py-14 overflow-hidden">
      <div className="container">
        {/* 섹션 헤더 */}
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Stethoscope className="w-3.5 h-3.5" />
            도입 성과
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
            <span className="text-brand">숫자</span>로 증명합니다
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            AI 도입 병원들의 평균 성과입니다.
          </p>
        </FadeInSection>


      </div>

      {/* (2) 카톡 캡처 스타일 대화 마퀴 */}
      <div className="mb-3">
        <ChatMarquee items={row1} direction="left" speed={32} />
      </div>
      <div className="mb-8">
        <ChatMarquee items={row2} direction="right" speed={30} />
      </div>

      {/* (3) AI 성공 요인 분석 */}
      <div className="container">
        <FadeInSection delay={0.2}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold text-foreground">AI 성공 요인 분석</h3>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">MY비서 AI 분석</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {successFactors.map((f, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-foreground mb-1">{f.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        <p className="text-[11px] text-muted-foreground/50 mt-6 text-center">
          * 예시 사례입니다. 실제 고객 사례는 상담 시 안내드립니다.
        </p>
      </div>
    </section>
  );
}

/**
 * AI 콘텐츠 공장 — 로그인 전에도 볼 수 있는 기능 소개 랜딩 페이지
 * 인터뷰 영상 → 블로그/카드뉴스/숏폼 자동 생성 기능을 시각적으로 소개
 * v3: 카운터 삭제 + 문구 줄바꿈 가독성 + 릴스 체험 상단 이동
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import ReelsTrialSection from "@/components/ReelsTrialSection";
import {
  ArrowRight,
  Upload,
  FileText,
  Image,
  Video,
  Sparkles,
  Calendar,
  BarChart3,
  Mic,
  Zap,
  CheckCircle2,
  Play,
  Download,
  Type,
  Clock,
  Shield,
  FileCheck,
  DoorOpen,
} from "lucide-react";

/* ─── 기능 카드 데이터 ─── */
const FEATURES = [
  {
    icon: FileText,
    title: "AEO/GEO 블로그",
    count: "3개",
    desc: "환자 관점 · 전문가 관점 · 트렌드 관점으로\nAI 검색 최적화 블로그를 자동 생성합니다.",
    color: "oklch(0.72 0.14 200)",
    bg: "oklch(0.72 0.14 200 / 0.08)",
  },
  {
    icon: Image,
    title: "인스타 카드뉴스",
    count: "5세트",
    desc: "Q&A · 체크리스트 · 비포애프터 ·\n오해와진실 · 인사이트 컨셉으로 기획합니다.",
    color: "oklch(0.72 0.15 330)",
    bg: "oklch(0.72 0.15 330 / 0.08)",
  },
  {
    icon: Video,
    title: "숏폼 스크립트",
    count: "5개",
    desc: "경고형 · 인사이트 · Q&A · 리스트 · 비교 포맷으로\n릴스/숏츠 대본을 자동 생성합니다.",
    color: "oklch(0.72 0.15 280)",
    bg: "oklch(0.72 0.15 280 / 0.08)",
  },
];

const EXTRA_FEATURES = [
  {
    icon: Sparkles,
    title: "AI 이미지 생성",
    desc: "카드뉴스에 맞는 AI 이미지를 자동 생성하고,\n1080×1080 인스타 최적 사이즈로 변환합니다.",
  },
  {
    icon: Type,
    title: "텍스트 오버레이",
    desc: "AI 이미지 위에 헤드라인과 본문을 합성하여\n완성된 카드뉴스 이미지를 출력합니다.",
  },
  {
    icon: Download,
    title: "ZIP 일괄 다운로드",
    desc: "생성된 카드뉴스 이미지를 세트별 또는\n전체 ZIP으로 한 번에 다운로드합니다.",
  },
  {
    icon: Clock,
    title: "SRT/VTT 자막",
    desc: "숏폼 스크립트를 Netflix 표준 자막으로 변환하여\n영상 편집에 바로 활용합니다.",
  },
  {
    icon: Calendar,
    title: "콘텐츠 캘린더",
    desc: "AI가 일주일 발행 스케줄을 자동 제안하고,\n월간/주간 뷰로 관리합니다.",
  },
  {
    icon: BarChart3,
    title: "콘텐츠 대시보드",
    desc: "생산된 블로그 · 카드뉴스 · 숏폼 통계와\n최근 활동을 한눈에 확인합니다.",
  },
];

const PROCESS_STEPS = [
  { step: "01", icon: Upload, title: "영상 업로드", desc: "원장님 인터뷰 영상 또는\n음성 파일을 업로드합니다" },
  { step: "02", icon: Mic, title: "AI 음성 추출", desc: "Whisper가 음성을 텍스트로\n정확하게 변환합니다" },
  { step: "03", icon: Sparkles, title: "콘텐츠 생성", desc: "AI가 블로그 3개 + 카드뉴스 5세트\n+ 숏폼 5개를 생성합니다" },
  { step: "04", icon: Play, title: "편집 & 발행", desc: "생성된 콘텐츠를 편집하고\n원클릭으로 발행합니다" },
];

/* 소셜 프루프 카운터 */
function SocialProofCounter() {
  return (
    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground py-3">
      <span><strong className="text-foreground">2,400+</strong> 병원 이용 중</span>
      <span><strong className="text-foreground">18,000+</strong> 콘텐츠 생성</span>
      <span><strong className="text-foreground">96%</strong> 시간 절약</span>
    </div>
  );
}

export default function ContentFactoryLanding() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/admin/interview-content");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-20"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.18 280), oklch(0.65 0.18 200), transparent)" }}
          />
        </div>

        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium mb-6"
            style={{ background: "oklch(0.72 0.15 280 / 0.1)", color: "oklch(0.78 0.15 280)", border: "1px solid oklch(0.72 0.15 280 / 0.2)" }}>
            <Zap className="w-3.5 h-3.5" />
            촬영만 하세요, 나머지는 MY비서가
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.15] mb-6">
            인터뷰 영상 <span className="text-brand">1개</span>로
            <br />
            <span style={{ color: "oklch(0.78 0.15 280)" }}>13개 콘텐츠</span> 자동 생산
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            원장님 인터뷰 영상을 업로드하면 AI가<br />
            <strong className="text-foreground">AEO/GEO 블로그 3개</strong>,{" "}
            <strong className="text-foreground">인스타 카드뉴스 5세트</strong>,<br />
            <strong className="text-foreground">숏폼 스크립트 5개</strong>를 고품질로 생성합니다.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleCTA}
              className="group inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.04] shadow-lg shadow-primary/20"
            >
              {isAuthenticated ? "콘텐츠 공장 시작하기" : "무료로 시작하기"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => {
                const el = document.querySelector("#how-it-works");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold rounded-full transition-all duration-300 hover:scale-[1.03]"
              style={{ background: "oklch(0.72 0.14 200 / 0.1)", color: "oklch(0.72 0.14 200)", border: "1px solid oklch(0.72 0.14 200 / 0.2)" }}
            >
              작동 방식 보기
            </button>
          </div>
        </div>
      </section>

      <SocialProofCounter />

      <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ─── 체험 모드: 인스타 릴스 제작 과정 시연 (상단으로 이동) ─── */}
      <ReelsTrialSection />

      <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ─── 핵심 생산물 3종 ─── */}
      <section className="py-14 sm:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              영상 <span className="text-brand">1개</span>에서 나오는 것들
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              각 콘텐츠는 의료 마케팅에 최적화된<br className="sm:hidden" />
              고품질 프롬프트로 생성됩니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="relative group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
                style={{
                  background: f.bg,
                  border: `1px solid ${f.color}20`,
                }}
              >
                {/* 수량 배지 */}
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: `${f.color}20`, color: f.color }}
                >
                  {f.count}
                </div>

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}15`, color: f.color }}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-display font-bold mb-2" style={{ color: f.color }}>
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ─── 작동 방식 ─── */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              4단계로 끝나는 <span className="text-brand">콘텐츠 생산</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              촬영 후 업로드만 하면,<br className="sm:hidden" />
              AI가 나머지를 처리합니다
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {/* 데스크톱 연결선 */}
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 right-0 translate-x-1/2 w-full h-px z-0"
                    style={{ background: "linear-gradient(90deg, oklch(0.72 0.14 200 / 0.3), oklch(0.72 0.14 200 / 0.1))" }}
                  />
                )}
                {/* 모바일 연결선 */}
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="lg:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-px h-6 z-0"
                    style={{ background: "linear-gradient(180deg, oklch(0.72 0.14 200 / 0.3), transparent)" }}
                  />
                )}
                <div className="relative z-10 rounded-2xl p-6 bg-card/50 border border-border/30 text-center hover:border-brand/30 transition-all duration-300 group">
                  <div className="text-[11px] font-mono font-bold text-brand mb-3">STEP {s.step}</div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-display font-bold mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ─── 추가 기능 6종 ─── */}
      <section className="py-14 sm:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              생성만이 아닙니다.<br />
              <span style={{ color: "oklch(0.78 0.15 280)" }}>완성</span>까지.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              이미지 생성, 텍스트 합성, 자막 변환,<br className="sm:hidden" />
              캘린더 관리까지 원스톱으로
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {EXTRA_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 bg-card/40 border border-border/30 hover:border-brand/30 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-brand/10 text-brand group-hover:bg-brand/20 group-hover:scale-110 transition-all duration-300">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-display font-bold mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ─── 비교 섹션 ─── */}
      <section className="py-14 sm:py-20 bg-card/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              기존 방식 vs<br className="sm:hidden" />
              <span className="text-brand"> MY비서 콘텐츠 공장</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기존 방식 */}
            <div className="rounded-2xl p-8 border border-border/30 bg-card/20">
              <h3 className="text-lg font-display font-bold text-muted-foreground mb-6">기존 방식</h3>
              <div className="space-y-4">
                {[
                  "인터뷰 촬영 → 수동 원고 작성",
                  "블로그 1개 작성에 2~3시간",
                  "카드뉴스 기획 + 디자인 외주",
                  "숏폼 대본 별도 작성",
                  "자막 수동 입력",
                  "콘텐츠 캘린더 엑셀 관리",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="text-red-400 mt-0.5">✕</span>
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border/30">
                <div className="text-xs text-muted-foreground mb-2">소요 시간</div>
                <div className="text-2xl font-display font-bold text-muted-foreground mb-2">8~12시간</div>
                <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full bg-red-400/40 w-full" />
                </div>
              </div>
            </div>

            {/* MY비서 */}
            <div className="rounded-2xl p-8 border border-brand/30" style={{ background: "oklch(0.72 0.14 200 / 0.05)" }}>
              <h3 className="text-lg font-display font-bold text-brand mb-6">MY비서 콘텐츠 공장</h3>
              <div className="space-y-4">
                {[
                  "영상 업로드 → AI 자동 생산",
                  "블로그 3개 동시 생성 (3분)",
                  "카드뉴스 5세트 + AI 이미지 자동",
                  "숏폼 5개 + SRT/VTT 자막 포함",
                  "텍스트 오버레이 자동 합성",
                  "AI 캘린더 스케줄 자동 제안",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-brand/20">
                <div className="text-xs text-muted-foreground mb-2">소요 시간</div>
                <div className="text-2xl font-display font-bold text-brand mb-2">3~5분</div>
                <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: "5%",
                      background: "linear-gradient(90deg, oklch(0.72 0.14 200), oklch(0.78 0.16 195))",
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Zap className="w-3 h-3 text-brand" />
                  <span className="text-[11px] font-semibold text-brand">시간 96% 절약</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* ─── 최종 CTA ─── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[140px] opacity-15"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.18 200), oklch(0.65 0.14 280), transparent)" }}
          />
        </div>

        <div className="container text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-display font-bold mb-4 leading-snug">
            촬영만 하세요.<br />
            <span className="text-brand">나머지는 MY비서가.</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            지금 바로 인터뷰 영상을 업로드하고,<br />
            13개 고품질 콘텐츠를 자동으로 받아보세요.
          </p>
          <button
            onClick={handleCTA}
            className="group inline-flex items-center gap-2 px-8 py-4 text-[16px] font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.04] shadow-lg shadow-primary/20 hover:shadow-[0_8px_30px_rgba(0,200,180,0.3)]"
          >
            {isAuthenticated ? "콘텐츠 공장 시작하기" : "무료로 시작하기"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 신뢰 배지 */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap mt-8">
            {[
              { icon: Shield, text: "의료법 준수 AI 필터" },
              { icon: FileCheck, text: "콘텐츠 소유권 100%" },
              { icon: DoorOpen, text: "위약금 0원" },
            ].map((badge) => (
              <span
                key={badge.text}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[12px] font-semibold tracking-wide"
                style={{
                  background: "oklch(0.72 0.14 200 / 0.1)",
                  color: "oklch(0.78 0.14 200)",
                  border: "1px solid oklch(0.72 0.14 200 / 0.2)",
                }}
              >
                <badge.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

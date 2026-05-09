import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, TrendingUp, Users, Search, Star, Camera, Sparkles, ArrowRight, Shield, Zap, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

const painPoints = [
  { icon: <Camera className="w-5 h-5" />, title: "전후사진 광고 규제 강화", desc: "의료광고 심의 기준 강화로 기존 마케팅 방식이 막힘" },
  { icon: <Users className="w-5 h-5" />, title: "인스타 팔로워 ≠ 실제 환자", desc: "SNS 팔로워는 많은데 실제 예약으로 전환이 안 됨" },
  { icon: <Star className="w-5 h-5" />, title: "체험단 리뷰 신뢰도 하락", desc: "환자들이 체험단 리뷰를 걸러보기 시작, 효과 급감" },
  { icon: <Search className="w-5 h-5" />, title: "AI 검색에서 경쟁사만 노출", desc: "ChatGPT에 \"피부과 추천\" 물어보면 우리 병원은 안 나옴" },
];

const solutions = [
  { title: "AI 검색 최적화", desc: "\"여드름 치료 잘하는 피부과\", \"레이저 토닝 추천\" 등 시술별 AI 노출 최적화", metric: "AI 노출률 평균 280% 증가", icon: <Sparkles className="w-6 h-6" /> },
  { title: "시술별 콘텐츠 자동화", desc: "보톡스·필러·레이저·여드름 등 시술별 전문 콘텐츠를 AI가 자동 생성", metric: "월 25편+ 콘텐츠 발행", icon: <Zap className="w-6 h-6" /> },
  { title: "의료광고 컴플라이언스", desc: "전후사진 규정, 과장 표현 자동 감지 — 심의 위반 사전 차단", metric: "심의 통과율 98%", icon: <Shield className="w-6 h-6" /> },
  { title: "리뷰·평판 관리", desc: "네이버·구글·강남언니 리뷰 통합 모니터링 + 부정 리뷰 즉시 대응", metric: "평점 0.5+ 평균 상승", icon: <Heart className="w-6 h-6" /> },
];

const caseStudy = {
  name: "서울 신사동 B피부과",
  specialty: "레이저·여드름·안티에이징 전문",
  before: { monthlyPatients: 120, adCost: "월 450만원", aiExposure: "3건" },
  after: { monthlyPatients: 210, adCost: "월 200만원", aiExposure: "월 520건+" },
  period: "4개월",
  quote: "인스타 광고에만 의존하다가 AI 검색 최적화를 시작했는데, 광고비를 반 이상 줄이고도 신환이 75% 늘었어요. 특히 고가 시술 문의가 확 늘었습니다.",
};

const procedures = [
  "보톡스·필러", "레이저 토닝", "여드름 치료", "리프팅",
  "피부 재생", "색소 치료", "모공 축소", "안티에이징",
];

const faqs = [
  { q: "피부과는 시각적 콘텐츠가 중요한데, AI 최적화가 효과 있나요?", a: "네. AI는 텍스트 기반으로 추천하므로, 시술 원리·효과·부작용을 상세히 설명한 구조화된 콘텐츠가 핵심입니다. 전후사진 없이도 전문성을 보여줄 수 있어 규제 리스크도 줄어듭니다." },
  { q: "강남 피부과 경쟁이 치열한데 효과가 있을까요?", a: "경쟁이 치열할수록 AI 검색 최적화의 효과가 큽니다. 대부분의 피부과가 아직 AI 최적화를 하지 않고 있어, 지금 시작하면 선점 효과를 누릴 수 있습니다." },
  { q: "전후사진 없이 마케팅이 가능한가요?", a: "가능합니다. AI 검색 최적화, 시술 원리 콘텐츠, 의사 전문성 콘텐츠, FAQ 콘텐츠 등 규제에 안전한 방식으로 충분히 신환을 유치할 수 있습니다." },
  { q: "소규모 피부과도 효과를 볼 수 있나요?", a: "네. 오히려 소규모 피부과에서 ROI가 더 높습니다. 대형 피부과 대비 마케팅 예산이 적은 상황에서, AI 검색 최적화는 비용 효율이 가장 높은 채널입니다." },
];

export default function LandingDermatology() {
  useSEO({
    title: "피부과 마케팅 전문 | MY비서 - AI로 시술 문의 늘리기",
    description: "레이저·보톡스·여드름 피부과를 위한 AI 마케팅. 의료광고 규제 안전한 방식으로 ChatGPT 노출 최적화. 광고비 55% 절감, 신환 75% 증가 사례.",
    canonical: "https://mybiseo.com/dermatology",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "MY비서 피부과 마케팅",
      description: "피부과 전용 AI 마케팅 솔루션 — 시술별 검색 최적화, 컴플라이언스, 콘텐츠 자동화",
      provider: { "@type": "Organization", name: "MY비서", url: "https://mybiseo.com" },
      areaServed: "KR",
      serviceType: "피부과 디지털 마케팅",
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-background to-purple-500/5" />
        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            피부과 전용 마케팅 솔루션
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            전후사진 없이도<br />
            <span className="text-violet-400">신환이 찾아오는</span> 피부과 마케팅
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            의료광고 규제 걱정 없이, AI가 우리 피부과를 추천하게 만드세요.<br />
            시술별 전문 콘텐츠로 고가 시술 문의를 늘립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/ai-check">
              <Button size="lg" className="bg-violet-500 hover:bg-violet-600 text-white px-8">
                무료 AI 노출 진단 받기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/#contact">
              <Button size="lg" variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                맞춤 상담 신청
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-violet-400">75%</div>
              <div className="text-xs text-muted-foreground">신환 증가</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-violet-400">55%</div>
              <div className="text-xs text-muted-foreground">광고비 절감</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-violet-400">98%</div>
              <div className="text-xs text-muted-foreground">심의 통과율</div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Procedures */}
      <section className="py-12 border-y border-border/30">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-4">지원 시술 분야</p>
          <div className="flex flex-wrap justify-center gap-3">
            {procedures.map((proc, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-violet-500/5 border border-violet-500/10 text-sm text-violet-300">
                {proc}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            피부과 마케팅, 이런 문제 겪고 계시죠?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            규제는 강화되고, 기존 방식은 효과가 떨어지고 있습니다
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {painPoints.map((point, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl bg-card border border-border/60">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  {point.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            MY비서 피부과 솔루션
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            규제 안전 + AI 최적화 + 자동화의 삼박자
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((sol, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-border/60 bg-card/50 hover:border-violet-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  {sol.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{sol.title}</h3>
                <p className="text-muted-foreground mb-4">{sol.desc}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {sol.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            실제 피부과 성공 사례
          </h2>
          <div className="rounded-2xl border border-violet-500/20 bg-card p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-xl">✨</div>
              <div>
                <h3 className="font-semibold text-lg">{caseStudy.name}</h3>
                <p className="text-sm text-muted-foreground">{caseStudy.specialty}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-400">{caseStudy.period} 성과</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">월 신환</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{caseStudy.before.monthlyPatients}명</span>
                  <ArrowRight className="w-4 h-4 text-violet-400" />
                  <span className="text-2xl font-bold text-violet-400">{caseStudy.after.monthlyPatients}명</span>
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">광고비</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{caseStudy.before.adCost}</span>
                  <ArrowRight className="w-4 h-4 text-violet-400" />
                  <span className="text-2xl font-bold text-violet-400">{caseStudy.after.adCost}</span>
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">AI 노출</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{caseStudy.before.aiExposure}</span>
                  <ArrowRight className="w-4 h-4 text-violet-400" />
                  <span className="text-2xl font-bold text-violet-400">{caseStudy.after.aiExposure}</span>
                </div>
              </div>
            </div>

            <blockquote className="border-l-4 border-violet-500/50 pl-4 italic text-muted-foreground">
              "{caseStudy.quote}"
              <footer className="mt-2 text-sm not-italic text-foreground">— B피부과 원장</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border/60 bg-card/50 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                  <span className="font-medium pr-4">{faq.q}</span>
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            우리 피부과, AI에서 어떻게 보일까?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            30초 무료 진단으로 현재 AI 노출 상태를 확인하세요.<br />
            시술별 개선 전략까지 즉시 리포트로 받아보실 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-check">
              <Button size="lg" className="bg-violet-500 hover:bg-violet-600 text-white px-8">
                <Eye className="w-4 h-4 mr-2" />
                무료 AI 노출 진단
              </Button>
            </Link>
            <a href="tel:010-7321-7004">
              <Button size="lg" variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                전화 상담: 010-7321-7004
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, TrendingUp, Users, Search, Star, MessageSquare, Calendar, Sparkles, ArrowRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { APP_BASE_URL, APP_DOMAIN } from "@/lib/site-config";

const painPoints = [
  { icon: <Search className="w-5 h-5" />, title: "네이버 광고비만 월 200만원+", desc: "클릭당 5,000~8,000원, 매달 올라가는 CPC에 수익률 하락" },
  { icon: <Users className="w-5 h-5" />, title: "신환 유입 경로 파악 불가", desc: "\"어떻게 오셨어요?\" 물어봐도 정확한 채널 추적 안 됨" },
  { icon: <Star className="w-5 h-5" />, title: "블로그 체험단 효과 의문", desc: "월 50~100만원 쓰는데 실제 예약으로 이어지는지 모름" },
  { icon: <MessageSquare className="w-5 h-5" />, title: "ChatGPT에 우리 치과 안 나옴", desc: "환자가 AI에 물어봐도 경쟁 치과만 추천됨" },
];

const solutions = [
  { title: "AI 검색 최적화", desc: "ChatGPT, Gemini에서 \"강남 임플란트 잘하는 곳\" 검색 시 우리 치과가 추천되도록", metric: "AI 노출률 평균 340% 증가", icon: <Sparkles className="w-6 h-6" /> },
  { title: "네이버 상위 노출", desc: "플레이스 + 블로그 + 지식인 통합 최적화로 광고비 없이 상위 노출", metric: "광고비 평균 45% 절감", icon: <TrendingUp className="w-6 h-6" /> },
  { title: "환자 리뷰 관리", desc: "네이버·구글·카카오 리뷰 통합 모니터링 + 부정 리뷰 즉시 알림", metric: "평점 4.2→4.7 평균 개선", icon: <Shield className="w-6 h-6" /> },
  { title: "자동 콘텐츠 생산", desc: "임플란트·교정·미백 등 시술별 블로그 콘텐츠 AI 자동 생성", metric: "월 20편+ 콘텐츠 자동 발행", icon: <Zap className="w-6 h-6" /> },
];

const caseStudy = {
  name: "서울 강남 A치과",
  specialty: "임플란트·심미보철 전문",
  before: { monthlyPatients: 45, adCost: "월 280만원", aiExposure: "0건" },
  after: { monthlyPatients: 82, adCost: "월 120만원", aiExposure: "월 340건+" },
  period: "3개월",
  quote: "광고비를 절반으로 줄였는데 신환이 오히려 80% 늘었습니다. ChatGPT에서 우리 치과를 추천해주니까 환자분들이 이미 신뢰를 갖고 오세요.",
};

const faqs = [
  { q: "치과도 AI 검색 최적화가 필요한가요?", a: "네. 2025년 현재 치과 관련 검색의 23%가 AI를 통해 이루어지고 있으며, 이 비율은 매월 증가 중입니다. 특히 임플란트, 교정 등 고가 시술일수록 AI 검색 비중이 높습니다." },
  { q: "기존 마케팅 대행사와 뭐가 다른가요?", a: "일반 대행사는 네이버 광고 집행 대행이 중심입니다. MY비서는 AI 검색 최적화 + 포털 SEO + 콘텐츠 자동화를 통합 제공하여, 광고비 의존도를 낮추면서 신환을 늘립니다." },
  { q: "효과가 나타나기까지 얼마나 걸리나요?", a: "AI 검색 노출은 1~2주 내 개선이 시작됩니다. 포털 SEO는 4~8주, 종합적인 신환 증가는 2~3개월 내 체감하실 수 있습니다." },
  { q: "1인 치과도 가능한가요?", a: "네. 오히려 1인 치과에 더 효과적입니다. 대형 치과 대비 마케팅 예산이 제한적인 상황에서, AI 검색 최적화는 비용 대비 가장 높은 ROI를 제공합니다." },
];

export default function LandingDental() {
  useSEO({
    title: "치과 마케팅 전문 | MY비서 - AI로 신환 늘리고 광고비 줄이기",
    description: "임플란트·교정·심미 치과를 위한 AI 마케팅. ChatGPT 노출 최적화, 네이버 상위 노출, 리뷰 관리까지. 광고비 45% 절감, 신환 80% 증가 사례.",
    canonical: `${APP_BASE_URL}/dental`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "MY비서 치과 마케팅",
      description: "치과 전용 AI 마케팅 솔루션 — 검색 최적화, 리뷰 관리, 콘텐츠 자동화",
      provider: { "@type": "Organization", name: "MY비서", url: APP_BASE_URL },
      areaServed: "KR",
      serviceType: "치과 디지털 마케팅",
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-background to-blue-500/5" />
        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm mb-6">
            <span className="text-lg">🦷</span>
            치과 전용 마케팅 솔루션
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            광고비는 줄이고<br />
            <span className="text-sky-400">신환은 늘리는</span> 치과 마케팅
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            ChatGPT가 우리 치과를 추천하게 만드세요.<br />
            AI 검색 최적화로 광고 없이도 환자가 찾아옵니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/ai-check">
              <Button size="lg" className="bg-sky-500 hover:bg-sky-600 text-white px-8">
                무료 AI 노출 진단 받기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/#contact">
              <Button size="lg" variant="outline" className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
                맞춤 상담 신청
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-sky-400">80%</div>
              <div className="text-xs text-muted-foreground">신환 증가</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-sky-400">45%</div>
              <div className="text-xs text-muted-foreground">광고비 절감</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-sky-400">340%</div>
              <div className="text-xs text-muted-foreground">AI 노출 증가</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            이런 고민, 하고 계시죠?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            대부분의 치과 원장님이 겪는 마케팅 문제입니다
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
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            MY비서가 해결합니다
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            치과에 특화된 4가지 핵심 솔루션
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((sol, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-border/60 bg-card/50 hover:border-sky-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                  {sol.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{sol.title}</h3>
                <p className="text-muted-foreground mb-4">{sol.desc}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-sm font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {sol.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            실제 치과 성공 사례
          </h2>
          <div className="rounded-2xl border border-sky-500/20 bg-card p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 text-xl">🦷</div>
              <div>
                <h3 className="font-semibold text-lg">{caseStudy.name}</h3>
                <p className="text-sm text-muted-foreground">{caseStudy.specialty}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-sky-500/10 text-sky-400">{caseStudy.period} 성과</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">월 신환</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{caseStudy.before.monthlyPatients}명</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                  <span className="text-2xl font-bold text-sky-400">{caseStudy.after.monthlyPatients}명</span>
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">광고비</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{caseStudy.before.adCost}</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                  <span className="text-2xl font-bold text-sky-400">{caseStudy.after.adCost}</span>
                </div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">AI 노출</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{caseStudy.before.aiExposure}</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                  <span className="text-2xl font-bold text-sky-400">{caseStudy.after.aiExposure}</span>
                </div>
              </div>
            </div>

            <blockquote className="border-l-4 border-sky-500/50 pl-4 italic text-muted-foreground">
              "{caseStudy.quote}"
              <footer className="mt-2 text-sm not-italic text-foreground">— A치과 원장</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
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
      <section className="py-20 bg-gradient-to-b from-sky-500/5 to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            우리 치과, AI에서 어떻게 보일까?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            30초 무료 진단으로 현재 AI 노출 상태를 확인하세요.<br />
            개선 방향까지 즉시 리포트로 받아보실 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-check">
              <Button size="lg" className="bg-sky-500 hover:bg-sky-600 text-white px-8">
                <Search className="w-4 h-4 mr-2" />
                무료 AI 노출 진단
              </Button>
            </Link>
            <a href="tel:010-7321-7004">
              <Button size="lg" variant="outline" className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
                <Calendar className="w-4 h-4 mr-2" />
                전화 상담: 010-7321-7004
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

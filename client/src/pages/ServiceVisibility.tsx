/**
 * AI Visibility Engine — 서비스 상세 페이지
 * ServicePageLayout 공통 컴포넌트 활용
 */
import ServicePageLayout from "@/components/ServicePageLayout";
import {
  Search,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Eye,
  Bot,
  Globe,
  FileText,
  Target,
  LineChart,
} from "lucide-react";
import { APP_BASE_URL, APP_DOMAIN } from "@/lib/site-config";

export default function ServiceVisibility() {
  return (
    <ServicePageLayout
      variant="full"
      seo={{
        title: "AI Visibility Engine | 마이비서(MY비서)",
        description: "ChatGPT·Perplexity·Gemini가 우리 병원을 추천하게 만드는 AI 검색 최적화 서비스. 5대 AI 플랫폼 + 네이버·구글 동시 최적화.",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "AI Visibility Engine",
            provider: { "@type": "Organization", name: "마이비서(MY비서)", url: APP_BASE_URL },
            description: "5대 AI 플랫폼과 네이버·구글에서 병원의 검색 노출을 최적화하는 AI 기반 마케팅 서비스",
            serviceType: "AI Search Optimization",
            areaServed: { "@type": "Country", name: "KR" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "홈", item: APP_BASE_URL },
              { "@type": "ListItem", position: 2, name: "서비스", item: `${APP_BASE_URL}/#services` },
              { "@type": "ListItem", position: 3, name: "AI Visibility Engine", item: `${APP_BASE_URL}/services/visibility` },
            ],
          },
        ],
      }}
      theme={{
        accent: "oklch(0.72 0.14 200)",
        gradient: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 180))",
      }}
      hero={{
        badge: "핵심 엔진",
        badgeIcon: Search,
        title: "AI Visibility Engine",
        subtitle: "AI 검색 최적화",
        description: "ChatGPT·Perplexity·Gemini가 우리 병원을 추천하게 만듭니다. 5대 AI 엔진 + 네이버·구글을 동시에 최적화하는 유일한 의료 전문 솔루션.",
        primaryCta: { label: "무료 AI 가시성 진단 받기", navigate: "/ai-check" },
        secondaryCta: { label: "도입 상담 신청", href: "https://pf.kakao.com/_KYjGn" },
      }}
      problems={{
        title: "원장님, 이런 고민 있으신가요?",
        subtitle: "AI 시대, 기존 마케팅만으로는 환자가 줄어들고 있습니다.",
        items: [
          {
            icon: AlertTriangle,
            title: "AI가 우리 병원을 모른다",
            desc: "ChatGPT에 '강남 치과 추천'을 물어보면 우리 병원은 나오지 않습니다. AI가 학습할 데이터가 없기 때문입니다.",
          },
          {
            icon: Eye,
            title: "광고비는 늘지만 신환은 줄어든다",
            desc: "네이버 광고 단가는 매년 상승하지만, 환자들은 점점 AI에게 먼저 물어봅니다. 광고만으로는 한계가 있습니다.",
          },
          {
            icon: Globe,
            title: "해외 환자 유치 기회를 놓치고 있다",
            desc: "외국인 환자의 80%가 AI 검색으로 병원을 찾습니다. 다국어 AI 최적화 없이는 해외 환자 유치가 불가능합니다.",
          },
        ],
      }}
      solution={{
        title: "마이비서가 해결합니다",
        subtitle: "AI가 병원을 추천하려면, AI가 학습할 수 있는 구조화된 데이터가 필요합니다. 마이비서는 이 전 과정을 자동화합니다.",
        stats: [
          { icon: Bot, value: "5대 AI", label: "동시 최적화 플랫폼" },
          { icon: BarChart3, value: "110개", label: "진단 항목" },
          { icon: Globe, value: "20개국", label: "다국어 GEO 지원" },
          { icon: TrendingUp, value: "3배↑", label: "평균 AI 노출 증가" },
        ],
      }}
      process={{
        title: "작동 방식",
        subtitle: "4단계 프로세스로 AI 검색 노출을 체계적으로 확보합니다.",
        steps: [
          { step: "01", title: "AI 가시성 진단", desc: "5대 AI 플랫폼 + 네이버·구글에서 병원 노출 현황을 110개 항목으로 분석합니다.", icon: Search },
          { step: "02", title: "최적화 전략 수립", desc: "진료과·지역·경쟁 환경을 고려한 맞춤형 AI 검색 최적화 전략을 설계합니다.", icon: Target },
          { step: "03", title: "콘텐츠 제작·배포", desc: "의료법 준수 AI 콘텐츠를 제작하고, AI 크롤러가 학습할 수 있도록 구조화합니다.", icon: FileText },
          { step: "04", title: "실시간 모니터링", desc: "7개 AI 플랫폼에서 병원 추천 빈도를 실시간 추적하고 성과를 리포팅합니다.", icon: LineChart },
        ],
      }}
      caseStudy={{
        tag: "치과 · 서울 강남",
        title: "A 치과, 도입 3개월 후 AI 추천 노출 2.7배 증가",
        desc: "기존에 ChatGPT, Perplexity에서 전혀 노출되지 않던 A 치과가 마이비서 AI Visibility Engine 도입 후 3개월 만에 주요 AI 플랫폼에서 '강남 치과 추천' 질문 시 2.7배 더 자주 언급되기 시작했습니다.",
        stats: [
          { value: "2.7배", label: "AI 추천 노출 증가" },
          { value: "3개월", label: "소요 기간" },
          { value: "+47%", label: "신환 문의 증가" },
        ],
        before: "AI 검색 노출 0건",
        after: "주간 평균 12회 AI 추천",
      }}
      includes={[
        "5대 AI 엔진 동시 최적화 (ChatGPT, Perplexity, Gemini, Claude, CoPilot)",
        "네이버·구글 검색 최적화 (SEO/AEO/GEO)",
        "110개 항목 종합 AI 가시성 진단 리포트",
        "AI 블로그 자동 생성 (의료광고법 자동 검수)",
        "콘텐츠 공장: 영상 1개 → 블로그 3 + 숏폼 5 + 카드뉴스 5",
        "해외 20개국 다국어 GEO 전략",
        "월간 AI 노출 성과 리포트 + 전략 미팅",
        "경쟁사 AI 노출 벤치마킹",
      ]}
      cta={{
        title: "AI가 우리 병원을 추천하게 만들어 보세요",
        description: "무료 AI 가시성 진단으로 현재 상태를 확인하고, 맞춤 최적화 전략을 받아보세요.",
        primaryCta: { label: "무료 AI 가시성 진단 받기", navigate: "/ai-check" },
        secondaryCta: { label: "카카오톡 상담", href: "https://pf.kakao.com/_KYjGn" },
      }}
    />
  );
}

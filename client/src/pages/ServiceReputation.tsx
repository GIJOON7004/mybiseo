/**
 * Reputation Defense — 서비스 상세 페이지
 * ServicePageLayout 공통 컴포넌트 활용
 */
import ServicePageLayout from "@/components/ServicePageLayout";
import {
  Shield,
  AlertTriangle,
  Eye,
  Bell,
  BarChart3,
  Scale,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { APP_BASE_URL, APP_DOMAIN } from "@/lib/site-config";

export default function ServiceReputation() {
  return (
    <ServicePageLayout
      variant="full"
      seo={{
        title: "Reputation Defense | 마이비서(MY비서)",
        description: "악성 리뷰·허위 정보로부터 병원 브랜드를 지키는 AI 평판 방어 시스템. 의료광고법 자동 검수, 실시간 리뷰 모니터링.",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Reputation Defense",
            provider: { "@type": "Organization", name: "마이비서(MY비서)", url: APP_BASE_URL },
            description: "AI 기반 실시간 리뷰 모니터링과 의료광고법 컴플라이언스 자동 검수를 통한 병원 온라인 평판 방어 서비스",
            serviceType: "Online Reputation Management",
            areaServed: { "@type": "Country", name: "KR" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "홈", item: APP_BASE_URL },
              { "@type": "ListItem", position: 2, name: "서비스", item: `${APP_BASE_URL}/#services` },
              { "@type": "ListItem", position: 3, name: "Reputation Defense", item: `${APP_BASE_URL}/services/reputation` },
            ],
          },
        ],
      }}
      theme={{
        accent: "oklch(0.72 0.16 160)",
        gradient: "linear-gradient(135deg, oklch(0.72 0.16 160), oklch(0.60 0.16 155))",
      }}
      hero={{
        badge: "평판 방어",
        badgeIcon: Shield,
        title: "Reputation Defense",
        subtitle: "AI 평판 방어 시스템",
        description: "악성 리뷰·허위 정보로부터 병원 브랜드를 지킵니다. AI 실시간 모니터링 + 의료광고법 자동 검수로 온라인 평판을 체계적으로 관리합니다.",
        primaryCta: { label: "도입 상담 신청", href: "https://pf.kakao.com/_KYjGn" },
        secondaryCta: { label: "무료 AI 진단 받기", navigate: "/ai-check" },
      }}
      problems={{
        title: "원장님, 이런 위험에 노출되어 있습니다",
        subtitle: "온라인 평판은 한 번 무너지면 복구에 수개월이 걸립니다.",
        items: [
          {
            icon: AlertTriangle,
            title: "악성 리뷰가 방치되고 있다",
            desc: "악의적 리뷰 1건이 잠재 환자 30명을 이탈시킵니다. 대응하지 않으면 AI가 부정적 정보를 학습합니다.",
          },
          {
            icon: Eye,
            title: "의료광고법 위반 리스크",
            desc: "과장 광고, 비교 광고, 후기 활용 등 의료광고법 위반 시 과태료 최대 300만원. 반복 시 영업정지까지.",
          },
          {
            icon: MessageCircle,
            title: "경쟁사 비방·허위 정보",
            desc: "경쟁 병원의 악의적 비방, 허위 정보 유포에 대한 체계적 대응 없이 브랜드가 훼손되고 있습니다.",
          },
        ],
      }}
      solution={{
        title: "마이비서가 지킵니다",
        subtitle: "AI가 24시간 병원 온라인 평판을 모니터링하고, 위험을 사전에 차단합니다.",
        stats: [
          { icon: Bell, value: "24시간", label: "실시간 모니터링" },
          { icon: Scale, value: "98%", label: "심의 1회 통과율" },
          { icon: ShieldCheck, value: "2시간", label: "평균 대응 시간" },
          { icon: BarChart3, value: "0건", label: "과태료 발생" },
        ],
      }}
      process={{
        title: "작동 방식",
        subtitle: "4단계 프로세스로 병원 온라인 평판을 체계적으로 방어합니다.",
        steps: [
          { step: "01", title: "실시간 모니터링", desc: "네이버·구글·카카오맵 리뷰를 24시간 AI가 모니터링하고, 부정 리뷰를 즉시 감지합니다.", icon: Bell },
          { step: "02", title: "리스크 분석·대응", desc: "부정 리뷰의 유형(악의적/불만/오해)을 분류하고, 최적 대응 전략을 자동 제안합니다.", icon: Shield },
          { step: "03", title: "의료법 컴플라이언스", desc: "모든 마케팅 콘텐츠를 의료광고법 기준으로 자동 검수하여 심의 통과율을 극대화합니다.", icon: Scale },
          { step: "04", title: "브랜드 강화", desc: "긍정 리뷰 유도 시스템 + SNS 브랜딩 전략으로 병원 온라인 평판을 체계적으로 구축합니다.", icon: BarChart3 },
        ],
      }}
      caseStudy={{
        tag: "피부과 · 서울 신사",
        title: "B 피부과, 의료광고 자율심의 1회 통과율 98% 달성",
        desc: "기존에 자율심의 반려율이 40%에 달하던 B 피부과가 마이비서 Reputation Defense 도입 후 의료광고법 자동 검수 시스템을 통해 1회 통과율 98%를 달성했습니다. 동시에 부정 리뷰 대응 시간이 72시간에서 2시간으로 단축되었습니다.",
        stats: [
          { value: "98%", label: "심의 1회 통과율" },
          { value: "2시간", label: "리뷰 대응 시간" },
          { value: "0건", label: "과태료 발생" },
        ],
        before: "심의 반려율 40%, 대응 72시간",
        after: "통과율 98%, 대응 2시간",
      }}
      includes={[
        "AI 실시간 리뷰 모니터링 (네이버·구글·카카오맵)",
        "부정 리뷰 자동 감지 + 유형별 대응 템플릿",
        "의료광고법 자동 검수 시스템 (광고 심의 통과율 98%)",
        "브랜딩 마케팅 전략 수립 + SNS 채널 운영 가이드",
        "경쟁사 평판 벤치마킹 리포트",
        "긍정 리뷰 유도 자동화 시스템",
        "월간 평판 관리 리포트 + 전략 미팅",
        "위기 대응 매뉴얼 (악성 리뷰·허위 정보·언론 대응)",
      ]}
      cta={{
        title: "병원 평판, 더 이상 방치하지 마세요",
        description: "AI가 24시간 병원을 지킵니다. 무료 상담으로 현재 평판 리스크를 확인해 보세요.",
        primaryCta: { label: "도입 상담 신청", href: "https://pf.kakao.com/_KYjGn" },
        secondaryCta: { label: "무료 AI 진단 받기", navigate: "/ai-check" },
      }}
    />
  );
}

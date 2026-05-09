/*
 * v9: FAQ — 검색 최적화 질문 상단 배치 + 병원 원장님 관점 특화
 * 전문 용어를 쉽게 풀어 설명 + 왜 해야 하는지 동기부여
 */
import { FadeInSection } from "@/components/FadeInSection";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  // ── 검색 최적화 관련 (상단) ──
  {
    q: "포털·AI 검색 최적화가 정말 효과가 있나요?",
    a: "검색 최적화는 환자가 검색할 때 병원이 잘 보이도록 기술적으로 세팅하는 작업입니다. 쉽게 말해, 네이버·구글이 우리 병원 정보를 더 잘 읽을 수 있게 정리해주는 것입니다. 검색 엔진의 알고리즘은 수시로 변하기 때문에 특정 순위를 보장할 수는 없지만, 기술적 기반을 탄탄하게 구축하면 장기적으로 노출이 개선됩니다."  },
  {
    q: "AI 인용이 뭐예요? 기존 포털 검색 노출과 다른 건가요?",
    a: "네, 요즘 환자들은 네이버·구글만이 아니라 ChatGPT, Gemini, Claude 같은 AI에게도 '좋은 치과 추천해줘'라고 물어봅니다. 기존 포털 검색 노출이 네이버·구글에서 순위를 높이는 것이라면, AI 인용은 AI가 환자에게 병원을 추천할 때 우리 병원이 선택되도록 하는 것입니다. 업계에서는 이것을 AEO(AI가 답변할 때 우리 병원이 나오게 하는 기술)라고 부릅니다. MY비서는 포털 검색 + AI 검색 두 채널 모두에서 병원을 노출시켜 드립니다.",
  },
  {
    q: "ChatGPT, Gemini 같은 AI 검색에서도 노출이 되나요?",
    a: "네, 저희는 네이버·구글 같은 포털 검색만이 아니라 ChatGPT, Gemini, Claude 등 AI 검색에서도 병원이 노출될 수 있도록 최적화합니다. 쉽게 말해, AI가 우리 병원 정보를 쉽게 읽어갈 수 있도록 홈페이지를 정리하고, 병원의 전문성과 신뢰도를 높이는 정보를 체계적으로 구축하여 AI가 우리 병원을 우선적으로 추천하도록 만듭니다.",
  },
  // ── 의료법/안전 관련 ──
  {
    q: "의료법에 문제없나요? AI가 진료 행위를 하는 건 아닌가요?",
    a: "AI는 진료 행위를 하지 않습니다. 진료 과목 안내, 예약 접수, 시술 전후 주의사항 안내 등 행정적 업무를 담당합니다. 의료법을 철저히 준수하며, 진료 관련 질문은 '원장님과 직접 상담을 권해드립니다'로 안내합니다.",
  },
  {
    q: "AI 챗봇이 잘못된 정보를 환자에게 전달하면 어떡하나요?",
    a: "원장님이 직접 검수한 정보만 학습시킵니다. 진료비, 시술 정보, 주의사항 등 병원에서 제공한 데이터 기반으로만 응답하며, 학습되지 않은 질문은 '병원에 직접 문의해주세요'로 안내합니다. 원장님이 언제든 응답 내용을 수정할 수 있습니다.",
  },
  // ── 도입/효과 관련 ──
  {
    q: "환자가 AI인 걸 알면 불편해하지 않나요?",
    a: "오히려 반대입니다. 밤 10시에 전화해서 안 받히는 것보다, AI가 바로 답해주는 게 환자 만족도가 높습니다. 도입 병원들에서 '편하다', '빠르다'는 피드백이 대부분입니다. AI임을 밝히더라도 즉시 응답에 대한 만족도가 높습니다.",
  },
  {
    q: "우리 병원은 규모가 작은데, 효과가 있을까요?",
    a: "오히려 소규모 병원에서 효과가 더 큽니다. 대형 병원은 이미 마케팅팀이 있지만, 원장님 혼자 또는 소수 인력으로 운영하는 병원에서 AI 도입 효과가 극대화됩니다. 전화 응대, 예약 관리, 콘텐츠 제작을 AI가 담당하면 원장님은 진료에만 집중할 수 있습니다.",
  },
  {
    q: "기존 마케팅 업체를 쓰고 있는데, 같이 쓸 수 있나요?",
    a: "네, 가능합니다. 기존 마케팅과 충돌하지 않습니다. 오히려 AI 콘텐츠 제작이 기존 마케팅의 효과를 증폭시킵니다. 많은 병원이 기존 업체와 병행하다가, MY비서만으로 충분하다고 판단해 마케팅비를 줄이고 있습니다.",
  },
  // ── 비용/일정 관련 ──
  {
    q: "비용은 어떻게 되나요?",
    a: "무료 상담 후 병원 상황에 맞는 맞춤 견적을 안내드립니다. 웹사이트 + AI 챗봇 + 콘텐츠 제작 + 검색 최적화가 모두 포함된 패키지입니다. 초안 제작과 상담 모두 무료이니 부담 없이 문의해 주세요.",
  },
  {
    q: "만드는 데 얼마나 걸리나요?",
    a: "보통 2주면 완성됩니다. 원장님은 초기 상담 시 진료 과목, 시술 정보, 가격표 등만 공유해 주시면 됩니다. 나머지는 저희가 모두 세팅합니다. 완성 후 1개월간 무상 A/S를 제공하며, 프리미엄 장기 파트너십을 선택하시면 매달 최신 검색 최적화 기술 업데이트, 웹사이트 기능 개선, UX/UI 개선을 지속적으로 받으실 수 있습니다.",
  },
  {
    q: "정말 무료로 초안을 보여주나요?",
    a: "네. 상담도 무료, 초안 제작도 무료입니다. 실제로 작동하는 초안을 보시고 확신이 드실 때만 진행합니다. 마음에 안 드시면 비용은 0원입니다. 계약 의무도 없습니다.",
  },
  {
    q: "계약이 끝나면 만들어진 콘텐츠는 어떻게 되나요?",
    a: "계약 기간 중 제작된 모든 블로그, SNS 콘텐츠, 이미지의 소유권은 100% 원장님께 있습니다. 계약 종료 후에도 모든 콘텐츠를 그대로 사용하실 수 있으며, 다른 마케팅 업체로 이관도 가능합니다. 원장님의 자산이니까요.",
  },
];

export default function FAQSection() {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-faq-schema", "true");
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    return () => {
      document.querySelectorAll("[data-faq-schema]").forEach((el) => el.remove());
    };
  }, []);

  return (
    <section id="faq" className="py-10 lg:py-14">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <FadeInSection delay={0} className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2">
              원장님들이 자주 묻는 질문
            </h2>
            <p className="text-muted-foreground text-sm">
              AI 도입 전 궁금한 점, 모두 답해드립니다.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-xl border border-border px-5 data-[state=open]:border-brand/25 transition-colors"
                >
                  <AccordionTrigger className="text-left text-[14px] sm:text-[15px] font-medium text-foreground hover:text-brand transition-colors py-4 [&[data-state=open]]:text-brand">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-[13px] sm:text-[14px] leading-relaxed pb-4">
                    <p className="mb-3">{faq.a}</p>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                    >
                      더 궁금하신 점이 있으시면 무료 상담을 신청하세요
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeInSection>


        </div>
      </div>
    </section>
  );
}

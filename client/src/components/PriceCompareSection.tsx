/*
 * v9: 통합 비교표 — 12개 서비스 기준, 금액 비교 제거 → 서비스 품질 차이 중심
 * "모든 서비스는 매출 상승에 기여한다" 메시지 강화
 */
import React from "react";
import { FadeInSection } from "@/components/FadeInSection";
import { Check, X, Stethoscope, TrendingUp } from "lucide-react";

const comparisonItems = [
  // 1단계: 발견 (환자가 병원을 찾는 단계)
  { category: "발견", label: "AI 검색 노출 (AI 검색 최적화)", traditional: "대응 불가", mybiseo: "ChatGPT 등 5대 AI에서 병원 추천되도록 최적화", traditionalBad: true },
  { category: "발견", label: "AI 블로그 제작", traditional: "키워드 나열식 대량 생산", mybiseo: "환자가 검색하는 키워드 기반 + 의료광고법 자동 검사", traditionalBad: true },
  { category: "발견", label: "AI 콘텐츠 자동 생산", traditional: "미제공", mybiseo: "원장님 인터뷰 1개로 블로그+숟폼+카드뉴스 13개+ 자동", traditionalBad: true },
  { category: "발견", label: "해외 환자 유치 (의료관광)", traditional: "에이전시 수수료 의존", mybiseo: "20개국 언어로 AI 검색 노출 + 해외 환자 직접 유치", traditionalBad: true },

  // 2단계: 전환 (환자가 예약하는 단계)
  { category: "전환", label: "24시간 AI 상담", traditional: "미제공", mybiseo: "밤·주말에도 AI가 환자 상담 + 예약 접수 + 20개국 언어", traditionalBad: true },
  { category: "전환", label: "병원 홈페이지", traditional: "템플릿 기반 단순 제작", mybiseo: "환자가 예약하도록 유도하는 설계 + 데이터로 지속 개선", traditionalBad: true },
  { category: "전환", label: "노쇼 방지", traditional: "미제공", mybiseo: "AI가 노쇼 예측 + 자동 리마인드 + 대기자 자동 배정", traditionalBad: true },

  // 3단계: 유지·확장 (매출을 키우는 단계)
  { category: "유지·확장", label: "환자 관리 (CRM)", traditional: "엑셀 수기 관리", mybiseo: "환자·예약·매출·VIP 통합 관리 시스템", traditionalBad: true },
  { category: "유지·확장", label: "성과 확인 대시보드", traditional: "월 1회 PDF 보고", mybiseo: "실시간으로 성과 확인 + AI가 개선점 제안", traditionalBad: true },
  { category: "유지·확장", label: "브랜딩·SNS", traditional: "단순 포스팅 대행", mybiseo: "병원만의 시그니처 브랜딩 + 채널별 전략", traditionalBad: true },
  { category: "유지·확장", label: "전략 컨설팅", traditional: "미제공", mybiseo: "경쟁 병원 분석 + 매달 전략 미팅", traditionalBad: true },
  { category: "유지·확장", label: "병원 전용 앱", traditional: "미제공", mybiseo: "병원 전용 모바일 앱 포함 (개발중)", traditionalBad: true },
];

// 카테고리별 그룹핑
const categories = ["발견", "전환", "유지·확장"];

export default function PriceCompareSection() {
  return (
    <section id="price-compare" className="py-10 lg:py-14">
      <div className="container max-w-4xl">
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Stethoscope className="w-3.5 h-3.5" />
            비교
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
            일반 마케팅 업체 vs <span className="text-brand">MY비서</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            같은 항목이라도 <span className="text-brand font-semibold">어떻게 하느냐</span>에 따라
            <br />
            결과는 완전히 달라집니다.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.1} className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-2.5 py-3 sm:p-4 text-[11px] sm:text-sm font-medium text-muted-foreground w-[28%]">
                  서비스
                </th>
                <th className="px-2.5 py-3 sm:p-4 text-[11px] sm:text-sm font-medium text-muted-foreground text-center border-l border-border w-[32%]">
                  일반 업체
                </th>
                <th className="px-2.5 py-3 sm:p-4 text-[11px] sm:text-sm font-medium text-brand text-center border-l border-border bg-brand/5 w-[40%]">
                  MY비서
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const items = comparisonItems.filter((item) => item.category === cat);
                return (
                  <React.Fragment key={cat}>
                    {/* 카테고리 헤더 */}
                    <tr className="bg-muted/30 border-t border-border">
                      <td colSpan={3} className="px-2.5 py-2 sm:px-4 sm:py-2.5">
                        <span className="text-[10px] sm:text-xs font-bold text-brand/80 uppercase tracking-wider">
                          {cat === "발견" ? "🔍 1단계 · 발견" : cat === "전환" ? "🎯 2단계 · 전환" : "📈 3단계 · 유지·확장"}
                        </span>
                      </td>
                    </tr>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t border-border transition-colors duration-200 hover:bg-brand/[0.03]">
                        <td className="px-2.5 py-2.5 sm:p-4 text-[11px] sm:text-sm text-foreground font-medium align-middle leading-tight">
                          {item.label}
                        </td>
                        <td className="px-2.5 py-2.5 sm:p-4 text-[11px] sm:text-sm text-center border-l border-border align-middle">
                          <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1">
                            {item.traditionalBad && <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400/60 shrink-0" />}
                            <span className="text-muted-foreground/70 leading-tight">{item.traditional}</span>
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 sm:p-4 text-[11px] sm:text-sm text-brand font-medium text-center border-l border-border bg-brand/5 align-middle">
                          <span className="inline-flex items-center justify-center gap-0.5 sm:gap-1">
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand shrink-0" />
                            <span className="leading-tight">{item.mybiseo}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="px-2.5 py-3 sm:p-4 text-[11px] sm:text-sm font-bold text-foreground align-middle">
                  결론
                </td>
                <td className="px-2.5 py-3 sm:p-4 text-center border-l border-border align-middle">
                  <span className="text-[10px] sm:text-sm font-semibold text-muted-foreground">
                    항목별 개별 관리 · 단순 대행
                  </span>
                </td>
                <td className="px-2.5 py-3 sm:p-4 text-center border-l border-border bg-brand/5 align-middle">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-sm font-bold text-brand">
                    <TrendingUp className="w-3.5 h-3.5" />
                    12개 서비스 통합 · 매출 상승에 집중
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </FadeInSection>
      </div>
    </section>
  );
}

/**
 * 비교표 섹션 — 3카테고리 비교
 * "마이비서 vs 일반 마케팅 에이전시 vs 일반 검색 최적화 도구"
 * 경쟁사 실명 완전 삭제, 추상화된 비교
 */
import React from "react";
import { FadeInSection } from "@/components/FadeInSection";
import { Check, X, Minus, TrendingUp, Scale } from "lucide-react";

type Rating = "full" | "partial" | "none";

interface ComparisonRow {
  category: string;
  feature: string;
  mybiseo: Rating;
  agency: Rating;
  seoTool: Rating;
  mybiseoNote?: string;
}

const comparisonData: ComparisonRow[] = [
  // 발견 단계
  { category: "발견", feature: "AI 검색 최적화 (GEO)", mybiseo: "full", agency: "none", seoTool: "partial", mybiseoNote: "5대 AI 플랫폼 최적화" },
  { category: "발견", feature: "네이버·구글 검색 최적화", mybiseo: "full", agency: "partial", seoTool: "full" },
  { category: "발견", feature: "의료 전문 콘텐츠 제작", mybiseo: "full", agency: "partial", seoTool: "none", mybiseoNote: "의료광고법 자동 검사" },
  { category: "발견", feature: "해외 환자 유치 (다국어)", mybiseo: "full", agency: "none", seoTool: "none", mybiseoNote: "20개국 언어 AI 최적화" },

  // 전환 단계
  { category: "전환", feature: "24시간 AI 환자 상담", mybiseo: "full", agency: "none", seoTool: "none", mybiseoNote: "예약 접수까지 완결" },
  { category: "전환", feature: "전환율 최적화 (CRO)", mybiseo: "full", agency: "partial", seoTool: "none" },
  { category: "전환", feature: "노쇼 방지 시스템", mybiseo: "full", agency: "none", seoTool: "none" },

  // 관리·성장 단계
  { category: "관리·성장", feature: "실시간 성과 대시보드", mybiseo: "full", agency: "none", seoTool: "partial" },
  { category: "관리·성장", feature: "월간 전략 미팅", mybiseo: "full", agency: "partial", seoTool: "none" },
  { category: "관리·성장", feature: "의료법 컴플라이언스", mybiseo: "full", agency: "none", seoTool: "none", mybiseoNote: "AI 실시간 감사" },
  { category: "관리·성장", feature: "경쟁 병원 분석", mybiseo: "full", agency: "none", seoTool: "partial" },
];

const categories = ["발견", "전환", "관리·성장"];
const categoryLabels: Record<string, string> = {
  "발견": "🔍 1단계 · 환자가 병원을 찾는 단계",
  "전환": "🎯 2단계 · 환자가 예약하는 단계",
  "관리·성장": "📈 3단계 · 매출을 키우는 단계",
};

function RatingIcon({ rating }: { rating: Rating }) {
  if (rating === "full") {
    return <Check className="w-4 h-4 text-brand" />;
  }
  if (rating === "partial") {
    return <Minus className="w-4 h-4 text-amber-400/80" />;
  }
  return <X className="w-4 h-4 text-red-400/60" />;
}

function RatingLabel({ rating }: { rating: Rating }) {
  if (rating === "full") return <span className="text-brand text-[10px] font-medium">제공</span>;
  if (rating === "partial") return <span className="text-amber-400/80 text-[10px]">일부</span>;
  return <span className="text-red-400/60 text-[10px]">미제공</span>;
}

export default function PriceCompareSection() {
  return (
    <section id="price-compare" className="py-10 lg:py-14">
      <div className="container max-w-5xl">
        <FadeInSection delay={0} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-5 tracking-wide">
            <Scale className="w-3.5 h-3.5" />
            비교
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-4">
            어떤 선택이 <span className="text-brand">병원 매출</span>을 만들까요?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            같은 "마케팅"이라도 접근 방식에 따라 결과가 완전히 다릅니다.
          </p>
        </FadeInSection>

        {/* 비교표 */}
        <FadeInSection delay={0.05} className="rounded-2xl border border-border overflow-hidden">
          {/* 모바일: 카드형, 데스크톱: 테이블 */}

          {/* 데스크톱 테이블 */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-[30%]">
                    서비스 항목
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-brand text-center border-l border-border bg-brand/5 w-[25%]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-semibold">MY비서</span>
                      <span className="text-[9px] text-brand/70 font-normal">병원 특화 AI 마케팅</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center border-l border-border w-[22%]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>일반 에이전시</span>
                      <span className="text-[9px] text-muted-foreground/60 font-normal">종합 마케팅 대행</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center border-l border-border w-[23%]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>일반 검색 도구</span>
                      <span className="text-[9px] text-muted-foreground/60 font-normal">셀프서비스 툴</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const items = comparisonData.filter((row) => row.category === cat);
                  return (
                    <React.Fragment key={cat}>
                      {/* 카테고리 헤더 */}
                      <tr className="bg-muted/30 border-t border-border">
                        <td colSpan={4} className="px-4 py-2">
                          <span className="text-[10px] font-bold text-brand/80 uppercase tracking-wider">
                            {categoryLabels[cat]}
                          </span>
                        </td>
                      </tr>
                      {items.map((row, i) => (
                        <tr key={i} className="border-t border-border transition-colors duration-200 hover:bg-brand/[0.02]">
                          <td className="px-4 py-3 text-sm text-foreground font-medium align-middle">
                            {row.feature}
                          </td>
                          <td className="px-4 py-3 text-center border-l border-border bg-brand/5 align-middle">
                            <div className="flex flex-col items-center gap-0.5">
                              <RatingIcon rating={row.mybiseo} />
                              {row.mybiseoNote && (
                                <span className="text-[9px] text-brand/70 leading-tight">{row.mybiseoNote}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center border-l border-border align-middle">
                            <RatingIcon rating={row.agency} />
                          </td>
                          <td className="px-4 py-3 text-center border-l border-border align-middle">
                            <RatingIcon rating={row.seoTool} />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-4 py-3 text-sm font-bold text-foreground align-middle">
                    종합
                  </td>
                  <td className="px-4 py-3 text-center border-l border-border bg-brand/5 align-middle">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">
                      <TrendingUp className="w-4 h-4" />
                      11/11 제공
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center border-l border-border align-middle">
                    <span className="text-xs text-muted-foreground">3/11 일부 제공</span>
                  </td>
                  <td className="px-4 py-3 text-center border-l border-border align-middle">
                    <span className="text-xs text-muted-foreground">4/11 일부 제공</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 모바일 카드형 */}
          <div className="sm:hidden divide-y divide-border">
            {/* 범례 */}
            <div className="px-4 py-3 bg-muted/50 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-medium">범례:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-brand" /> 제공</span>
                <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-amber-400/80" /> 일부</span>
                <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-400/60" /> 미제공</span>
              </div>
            </div>

            {categories.map((cat) => {
              const items = comparisonData.filter((row) => row.category === cat);
              return (
                <div key={cat}>
                  <div className="px-4 py-2 bg-muted/30">
                    <span className="text-[10px] font-bold text-brand/80 uppercase tracking-wider">
                      {categoryLabels[cat]}
                    </span>
                  </div>
                  {items.map((row, i) => (
                    <div key={i} className="px-4 py-3 border-t border-border/50">
                      <div className="text-xs font-medium text-foreground mb-2">{row.feature}</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <RatingIcon rating={row.mybiseo} />
                          <span className="text-[9px] text-brand font-medium">MY비서</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <RatingIcon rating={row.agency} />
                          <span className="text-[9px] text-muted-foreground">에이전시</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <RatingIcon rating={row.seoTool} />
                          <span className="text-[9px] text-muted-foreground">검색 도구</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* 모바일 종합 */}
            <div className="px-4 py-3 bg-brand/5">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                <span className="text-sm font-bold text-brand">MY비서: 11개 항목 모두 제공</span>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* 하단 메시지 */}
        <FadeInSection delay={0.1} className="text-center mt-6">
          <p className="text-xs text-muted-foreground/70">
            * 비교 기준: 2026년 기준 국내 주요 의료 마케팅 에이전시 및 검색 최적화 도구 서비스 범위 조사
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}

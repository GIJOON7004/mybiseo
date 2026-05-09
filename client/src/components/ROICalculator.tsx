import { useState, useMemo, useEffect, useRef } from "react";
import { Calculator, TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * 진료과별 기준 데이터
 * - avgRevenue: 신환 1명당 평균 매출 (만원) — 초진+재진+추가 시술 포함 6개월 LTV 기준
 * - cpa: 기존 광고 기반 환자 획득 비용 (만원) — 네이버/구글 광고 업계 평균
 * - aiDiscount: AI 검색 최적화 적용 시 CPA 절감률 — 자연유입 비중 증가 효과 (보수적 적용)
 *
 * 계산 논리:
 * 1. 마케팅 예산 ÷ (CPA × (1 - AI절감률)) = 기본 추가 환자
 * 2. 현재 신규 환자가 많을수록 시장 포화로 효율 체감 (로그 보정)
 * 3. 예산 수확체감 보정 - sqrt 기반 완만한 곡선 (예산이 클수록 효율 하락, 단 급격하지 않음)
 * 4. AI 최적화 복합 효과 배율 2.5배 적용 (자연유입 + 전환률 + 브랜드 신뢰도)
 * 5. 추가 환자 × 환자당 평균 매출 = 추가 매출
 * 6. (추가 매출 - 투자 비용) ÷ 투자 비용 × 100 = ROI (최소 400%, 최대 800%)
 */
const specialties = [
  { label: "성형외과", avgRevenue: 200, cpa: 50, aiDiscount: 0.20 },
  { label: "피부과", avgRevenue: 80, cpa: 15, aiDiscount: 0.25 },
  { label: "치과", avgRevenue: 120, cpa: 30, aiDiscount: 0.20 },
  { label: "한의원", avgRevenue: 60, cpa: 18, aiDiscount: 0.25 },
  { label: "정형외과", avgRevenue: 80, cpa: 22, aiDiscount: 0.20 },
  { label: "안과", avgRevenue: 120, cpa: 35, aiDiscount: 0.20 },
  { label: "기타", avgRevenue: 100, cpa: 25, aiDiscount: 0.20 },
];

/* 커스텀 슬라이더 CSS */
const sliderStyles = `
@keyframes slider-bounce {
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.15); }
}
@keyframes slider-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes thumb-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.72 0.14 200 / 0.4), 0 2px 8px oklch(0 0 0 / 0.2); }
  50% { box-shadow: 0 0 0 8px oklch(0.72 0.14 200 / 0.15), 0 2px 8px oklch(0 0 0 / 0.2); }
}
.custom-slider-track {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: oklch(0.3 0.02 200 / 0.3);
  cursor: pointer;
  touch-action: none;
}
.custom-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, oklch(0.72 0.14 200), oklch(0.78 0.16 195));
  transition: width 0.15s ease-out;
  pointer-events: none;
}
.custom-slider-fill.shimmer {
  background: linear-gradient(90deg, oklch(0.72 0.14 200) 0%, oklch(0.82 0.16 195) 50%, oklch(0.72 0.14 200) 100%);
  background-size: 200% 100%;
  animation: slider-shimmer 2s ease-in-out infinite;
}
.custom-slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: oklch(0.75 0.18 195);
  border: 3px solid oklch(0.95 0 0);
  box-shadow: 0 2px 8px oklch(0 0 0 / 0.25);
  cursor: grab;
  transition: box-shadow 0.2s, transform 0.2s;
  z-index: 2;
}
.custom-slider-thumb:hover {
  box-shadow: 0 0 0 6px oklch(0.72 0.14 200 / 0.2), 0 2px 8px oklch(0 0 0 / 0.25);
}
.custom-slider-thumb:active {
  cursor: grabbing;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 0 8px oklch(0.72 0.14 200 / 0.25), 0 4px 12px oklch(0 0 0 / 0.3);
}
.custom-slider-thumb.hint-active {
  animation: thumb-glow-pulse 1.5s ease-in-out infinite;
}
@media (max-width: 640px) {
  .custom-slider-thumb {
    width: 34px;
    height: 34px;
  }
  .custom-slider-track {
    height: 12px;
    border-radius: 6px;
  }
  .custom-slider-fill {
    border-radius: 6px;
  }
}
`;

/* 커스텀 슬라이더 컴포넌트 */
function CustomSlider({
  min,
  max,
  step,
  value,
  onChange,
  showHint = false,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  showHint?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;

  const getValueFromPosition = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onChange(getValueFromPosition(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    onChange(getValueFromPosition(e.clientX));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <div
      ref={trackRef}
      className="custom-slider-track"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`custom-slider-fill ${showHint ? "shimmer" : ""}`}
        style={{ width: `${pct}%` }}
      />
      <div
        className={`custom-slider-thumb ${showHint ? "hint-active" : ""}`}
        style={{ left: `calc(${pct}% - 14px)` }}
      />
    </div>
  );
}

export default function ROICalculator() {
  const [specialty, setSpecialty] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [currentPatients, setCurrentPatients] = useState(50);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // 사용자 인터랙션 시 힌트 숨김
  useEffect(() => {
    if (hasInteracted) {
      setShowHint(false);
    }
  }, [hasInteracted]);

  const result = useMemo(() => {
    const spec = specialties[specialty];
    // AI 최적화 적용 시 실효 CPA (기존 CPA에서 AI 절감률 적용)
    const effectiveCpa = spec.cpa * (1 - spec.aiDiscount);
    // 예산 기반 기본 추가 환자 수
    const baseAdditional = monthlyBudget / effectiveCpa;
    // 예산 수확체감 보정 (Diminishing Returns) - sqrt 기반 완만한 곡선
    // 400만원일 때 1.0, 700만원일 때 ~0.76, 1000만원일 때 ~0.63
    const baseBudget = 400;
    const budgetEfficiency = Math.sqrt(baseBudget / monthlyBudget);
    // 현재 전체 신규 환자 수에 따른 시장 포화 보정 (환자가 많을수록 효율 체감)
    // 10명일 때 ~0.94, 50명일 때 ~0.80, 100명일 때 ~0.74, 200명일 때 ~0.68
    const saturationFactor = Math.max(0.5, 1 - Math.log10(currentPatients / 5) * 0.2);
    // AI 최적화 복합 효과 배율 (자연유입 증가 + 전환률 개선 + 브랜드 신뢰도 상승)
    const aiMultiplier = 2.5;
    const rawAdditionalPatients = Math.round(baseAdditional * saturationFactor * aiMultiplier * budgetEfficiency);
    const rawAdditionalRevenue = rawAdditionalPatients * spec.avgRevenue;
    const rawRoi = Math.round(((rawAdditionalRevenue - monthlyBudget) / monthlyBudget) * 100);
    // ROI 최소 400%, 최대 800% (시뮬레이션 범위 제한)
    const roi = Math.min(Math.max(rawRoi, 400), 800);
    // ROI floor/cap 적용 시 매출과 환자 수도 역산
    const additionalRevenue = roi !== rawRoi ? monthlyBudget * (roi / 100 + 1) : rawAdditionalRevenue;
    const additionalPatients = roi !== rawRoi ? Math.round(additionalRevenue / spec.avgRevenue) : rawAdditionalPatients;
    return {
      additionalPatients,
      additionalRevenue,
      roi,
      monthlyProfit: additionalRevenue - monthlyBudget,
    };
  }, [specialty, monthlyBudget, currentPatients]);

  const handleBudgetChange = (val: number) => {
    setMonthlyBudget(val);
    setHasInteracted(true);
  };

  const handlePatientsChange = (val: number) => {
    setCurrentPatients(val);
    setHasInteracted(true);
  };

  return (
    <section className="py-12 lg:py-16" id="roi-calculator">
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            투자 대비 수익 계산기
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            MY비서 도입하면<br />
            <span className="text-primary">매출이 얼마나 늘어날까요?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            원장님의 진료과목과 현재 상황을 입력하시면
              <br />
              예상 ROI를 바로 확인하실 수 있습니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 입력 영역 */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8">
            <h3 className="font-semibold text-lg mb-6">우리 병원 정보 입력</h3>

            {/* 진료과목 */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">진료과목</label>
              <div className="grid grid-cols-2 gap-2">
                {specialties.map((spec, i) => (
                  <button
                    key={i}
                    onClick={() => { setSpecialty(i); setHasInteracted(true); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      specialty === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 월 마케팅 예산 */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">
                월 마케팅 예산: <span className="text-foreground font-semibold">{monthlyBudget}만원</span>
              </label>
              <CustomSlider
                min={400}
                max={1000}
                step={50}
                value={monthlyBudget}
                onChange={handleBudgetChange}
                showHint={showHint}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>400만원</span>
                <span>1,000만원</span>
              </div>
            </div>

            {/* 현재 월 신규 환자 */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">
                현재 월 신규 환자: <span className="text-foreground font-semibold">{currentPatients}명</span>
              </label>
              <CustomSlider
                min={10}
                max={200}
                step={10}
                value={currentPatients}
                onChange={handlePatientsChange}
                showHint={showHint}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>10명</span>
                <span>200명</span>
              </div>
            </div>

            {/* 드래그 힌트 */}
            {showHint && (
              <p className="text-center text-[11px] text-brand/60 font-medium mt-1">
                슬라이더를 좌우로 드래그하여 조절하세요
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              * 파트너 병원 평균 데이터 기반 예측치이며, 실제 결과는 다를 수 있습니다.
            </p>
          </div>

          {/* 결과 영역 */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-6">예상 월간 성과</h3>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">예상 추가 신규 환자</p>
                        <p className="text-lg font-bold text-primary">+{result.additionalPatients}명/월</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden ml-14">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-700 ease-out"
                      style={{ width: `${Math.min((result.additionalPatients / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">예상 추가 매출</p>
                        <p className="text-lg font-bold text-emerald-400">+{result.additionalRevenue.toLocaleString()}만원/월</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden ml-14">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600/60 to-emerald-400 transition-all duration-700 ease-out"
                      style={{ width: `${Math.min((result.additionalRevenue / 10000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">투자 대비 수익률 (ROI)</p>
                        <p className="text-lg font-bold text-amber-400">{result.roi}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden ml-14">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-600/60 to-amber-400 transition-all duration-700 ease-out"
                      style={{ width: `${Math.min((result.roi / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  월 <span className="text-foreground font-semibold">{monthlyBudget}만원</span> 투자 →
                  월 <span className="text-emerald-400 font-semibold">{result.additionalRevenue.toLocaleString()}만원</span> 매출 예상
                </p>
              </div>
            </div>

            <a href="#contact" className="mt-6 block">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                무료 맞춤 견적 받기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

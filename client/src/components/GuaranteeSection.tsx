/*
 * v5: 보장 섹션 — B2 성과증명형 영업 메시지 + ROI 데이터
 * "결과가 없으면 비용도 없다" + 실제 성과 수치로 증명
 */
import { FadeInSection } from "@/components/FadeInSection";
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Wrench,
  DoorOpen,
  FileText,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
} from "lucide-react";

/* ── B2: 성과 증명 수치 ── */
const proofMetrics = [
  { value: "312%", label: "평균 검색 노출 증가율", icon: TrendingUp, color: "text-emerald-400" },
  { value: "47건", label: "월 평균 신환 문의 증가", icon: Users, color: "text-blue-400" },
  { value: "8개국", label: "해외 환자 유입 국가", icon: Globe, color: "text-amber-400" },
  { value: "98%", label: "고객 만족도 (계약 갱신율)", icon: BarChart3, color: "text-brand" },
];

const guarantees = [
  {
    icon: FileCheck,
    title: "무료 초안, 0원 리스크",
    description: "실제로 작동하는 초안을 무료로 보여드립니다. 마음에 안 드시면 비용은 없습니다.",
    emphasis: "0원",
  },
  {
    icon: DoorOpen,
    title: "중도 해지 가능, 위약금 0원",
    description: "가치가 느껴지지 않으시면 언제든 해지하실 수 있습니다. 위약금은 없습니다.",
    emphasis: "해지 자유",
  },
  {
    icon: ShieldCheck,
    title: "의료법 AI 필터링 시스템",
    description: "AI가 생성하는 모든 콘텐츠는 의료법 준수 필터링을 거칩니다. 과대광고, 비교광고, 치료후기 등 가이드라인 위반 요소를 검수합니다.",
    emphasis: "AI 필터",
  },
  {
    icon: Lock,
    title: "환자 데이터 보안",
    description: "환자 개인정보 보호법(PIPA) 준수. SSL 암호화 전송, 접근 제어, 데이터 암호화를 기본 적용합니다.",
    emphasis: "보안",
  },
  {
    icon: Wrench,
    title: "1개월 무상 보수",
    description: "구축 완료 후 1개월간 수정·보완·오류 대응을 무상으로 해드리고, 직접 관리하실 수 있도록 상세 가이드를 제공합니다.",
    emphasis: "무상",
  },
  {
    icon: FileText,
    title: "콘텐츠 소유권 100% 보장",
    description: "계약 기간 중 제작된 모든 블로그, SNS 콘텐츠, 이미지의 소유권은 원장님께 있습니다. 계약 종료 후에도 모든 콘텐츠를 그대로 사용하실 수 있습니다.",
    emphasis: "소유권",
  },
];

export default function GuaranteeSection() {
  return (
    <section id="guarantee" className="py-10 lg:py-14 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.72 0.14 200 / 0.06), transparent)",
          }}
        />
      </div>

      <div className="container relative z-10">
        <FadeInSection delay={0} className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium tracking-wide mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            원장님을 위한 약속
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-4">
            잃을 것은 <span className="text-brand">없습니다</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            결정하기 전까지 비용은 0원입니다.
            <br />
            의료법 준수와 환자 데이터 보안까지, 안심하고 시작하세요.
          </p>
        </FadeInSection>



        {/* 첫 번째 줄: 2개 (무료 초안 + 중도 해지) — 큰 카드 */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
          {guarantees.slice(0, 2).map((g, i) => (
            <FadeInSection key={g.title} delay={(i + 1) * 0.1} className="group relative rounded-xl border border-border bg-card p-6 text-center hover:border-brand/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand/15 transition-colors">
                <g.icon className="w-7 h-7 text-brand" />
              </div>

              <div className="font-display font-bold text-3xl sm:text-4xl text-brand mb-1">
                {g.emphasis}
              </div>

              <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-2">
                {g.title}
              </h3>

              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {g.description}
              </p>
            </FadeInSection>
          ))}
        </div>

        {/* 두 번째 줄: 4개 (의료법 + 보안 + 무상 보수 + 콘텐츠 소유권) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {guarantees.slice(2).map((g, i) => (
            <FadeInSection key={g.title} delay={(i + 1) * 0.1} className="group relative rounded-xl border border-border bg-card p-6 text-center hover:border-brand/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand/15 transition-colors">
                <g.icon className="w-7 h-7 text-brand" />
              </div>

              <div className="font-display font-bold text-3xl sm:text-4xl text-brand mb-1">
                {g.emphasis}
              </div>

              <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-2">
                {g.title}
              </h3>

              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {g.description}
              </p>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

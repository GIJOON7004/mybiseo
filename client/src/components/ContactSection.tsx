/*
 * v11: 문의 섹션 — AI 검색 노출 최적화 상담, Calendly 제거, 자체 상담 시간 선택 + 문자 알림
 * 시간 선택 시 대표에게 SOLAPI 문자 발송
 */
import { FadeInSection } from "@/components/FadeInSection";
import { useState, useMemo } from "react";
import { CheckCircle, Shield, Loader2, Check, Stethoscope, Phone, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useEventLogger } from "@/hooks/useEventLogger";

const SPECIALTY_OPTIONS = [
  "치과",
  "피부과",
  "정형외과",
  "안과",
  "이비인후과",
  "내과",
  "산부인과",
  "비뇨기과",
  "성형외과",
  "한의원",
  "기타",
];

const SERVICE_OPTIONS = [
  {
    id: "ai-seo",
    label: "AI 검색 최적화 (노출 최적화)",
    desc: "ChatGPT 등 AI에서 병원이 추천되도록",
  },
  {
    id: "ai-chatbot",
    label: "AI 환자 응대 (24시간 AI 상담)",
    desc: "밤·주말에도 환자 문의 응대 + 예약 접수",
  },
  {
    id: "website",
    label: "병원 홈페이지 제작",
    desc: "환자가 예약하도록 설계 + 모바일 최적화",
  },
  {
    id: "crm",
    label: "환자 관리 시스템 (CRM)",
    desc: "환자·예약·매출·VIP 통합 관리",
  },
  {
    id: "ai-blog",
    label: "AI 블로그 제작",
    desc: "환자가 검색하는 키워드 기반 + 의료광고법 자동 검사",
  },
  {
    id: "content-factory",
    label: "AI 콘텐츠 자동 생산",
    desc: "인터뷰 1개로 블로그+숟폼+카드뉴스 13개+ 자동",
  },
  {
    id: "noshow",
    label: "노쇼 방지",
    desc: "AI가 노쇼 예측 + 자동 리마인드 + 대기자 자동 배정",
  },
  {
    id: "medical-tourism",
    label: "해외 환자 유치",
    desc: "20개국 언어로 AI 검색 노출 + 해외 환자 직접 유치",
  },
  {
    id: "dashboard",
    label: "성과 확인 대시보드",
    desc: "실시간 성과 확인 + AI가 개선점 제안",
  },
  {
    id: "branding",
    label: "브랜딩·SNS",
    desc: "병원만의 브랜드 + 채널별 전략",
  },
  {
    id: "consulting",
    label: "전략 컨설팅",
    desc: "경쟁 병원 분석 + 매달 전략 미팅",
  },
  {
    id: "full-package",
    label: "풀 패키지 (전체 포함)",
    desc: "위 서비스 전부 + 맞춤 컨설팅",
  },
];

const TIME_SLOTS = [
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

function getNext7Days(): { label: string; value: string; dayOfWeek: string }[] {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const result = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const dayOfWeek = days[d.getDay()];
    // 주말 제외
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    result.push({
      label: `${month}/${date}`,
      value: `${d.getFullYear()}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`,
      dayOfWeek,
    });
  }
  return result;
}

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    hospitalName: "",
    specialty: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const availableDays = useMemo(() => getNext7Days(), []);

  const { logEvent } = useEventLogger();

  const submitMutation = trpc.inquiry.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      logEvent("contact_submit", { specialty: form.specialty, services: selectedServices });
      toast.success("감사합니다! 원장님께 곧 연락드릴게요 😊");
    },
    onError: (err) => {
      toast.error(err.message || "앗, 잠시 문제가 생겼어요. 한 번만 더 시도해 주세요!");
    },
  });

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("성함과 연락처를 입력해주세요.");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("관심 서비스를 1개 이상 선택해주세요.");
      return;
    }

    const serviceLabels = selectedServices
      .map((id) => SERVICE_OPTIONS.find((o) => o.id === id)?.label)
      .filter(Boolean)
      .join(", ");

    const messageParts = [
      form.hospitalName && `병원명: ${form.hospitalName}`,
      form.specialty && `진료과: ${form.specialty}`,
      `관심 서비스: ${serviceLabels}`,
      selectedDate && selectedTime && `희망 상담 시간: ${selectedDate} ${selectedTime}`,
    ].filter(Boolean);

    submitMutation.mutate({
      name: form.name,
      phone: form.phone,
      email: form.email || "",
      message: messageParts.join(" | "),
    });
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-brand/50 focus:ring-2 focus:ring-brand/25 focus:shadow-[0_0_12px_rgba(0,200,180,0.08)] transition-all duration-200 outline-none text-[16px]";

  return (
    <section id="contact" className="py-10 lg:py-14">
      <div className="container">
        <div className="max-w-lg mx-auto">
          <FadeInSection delay={0} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand text-xs font-medium mb-4">
              <Stethoscope className="w-3.5 h-3.5" />
              무료 상담
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
              원장님의 매출 고민,
              <br />
              <span className="text-brand">함께 해결하겠습니다</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              지금 놓치고 있는 환자가 얼마나 되는지, 무료로 파악해 드립니다.
              <br />
              초안까지 무료. 확신이 드실 때만 진행하세요.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-10 h-10 text-brand mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">감사합니다, 원장님! 🎉</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {selectedDate && selectedTime
                    ? `${selectedDate} ${selectedTime}에 맞춰 연락드릴게요!`
                    : "빠른 시간 내에 직접 연락드릴게요!"}
                </p>
                <p className="text-muted-foreground text-xs">
                  궁금한 점이 있으시면 언제든 편하게 전화 주세요!
                </p>
                <a
                  href="tel:010-7321-7004"
                  className="inline-flex items-center gap-1.5 mt-3 text-brand text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  010-7321-7004
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    placeholder="성함 *"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass}
                    placeholder="연락처 *"
                  />
                </div>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder="이메일 (선택)"
                />

                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  className={inputClass}
                  placeholder="병원명 (선택)"
                />

                {/* 관심 서비스 선택 */}
                <div className="space-y-2 pt-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    관심 있는 서비스를 선택해주세요 (복수 선택 가능)
                  </p>
                  <div className="space-y-2">
                    {SERVICE_OPTIONS.map((opt) => {
                      const isSelected = selectedServices.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleService(opt.id)}
                          className={`
                            flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all
                            ${
                              isSelected
                                ? "border-brand/60 bg-brand/10"
                                : "border-border bg-card hover:border-border/80"
                            }
                          `}
                        >
                          <span
                            className={`
                              flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                              ${isSelected ? "border-brand bg-brand" : "border-muted-foreground/30"}
                            `}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-background" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[13px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                              {opt.label}
                            </span>
                            <p className="text-[11px] text-muted-foreground/60">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 상담 희망 시간 선택 (Calendly 대체) */}
                <div className="pt-2">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-brand" />
                      <span className="text-sm font-medium text-foreground">30분 상담하기 (선택)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      편한 시간을 선택하시면, 해당 시간에 전화드리겠습니다.
                    </p>

                    {/* 날짜 선택 */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                      {availableDays.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => setSelectedDate(day.value)}
                          className={`flex flex-col items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                            selectedDate === day.value
                              ? "bg-brand text-background"
                              : "bg-card border border-border text-muted-foreground hover:border-brand/30"
                          }`}
                        >
                          <span className="text-[10px]">{day.dayOfWeek}</span>
                          <span className="text-sm font-semibold">{day.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* 시간 선택 */}
                    {selectedDate && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                              selectedTime === time
                                ? "bg-brand text-background"
                                : "bg-card border border-border text-muted-foreground hover:border-brand/30"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {time}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <p className="text-xs text-brand mt-2 font-medium">
                        {selectedDate} {selectedTime}에 전화드리겠습니다
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full py-3.5 rounded-xl font-bold text-[15px] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3 hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(0,200,180,0.25)] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.14 200), oklch(0.65 0.16 195))",
                    color: "oklch(0.15 0 0)",
                  }}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      접수 중...
                    </>
                  ) : (
                    "무료 상담 신청하기"
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
                  <Shield className="w-3 h-3" />
                  <span>상담 후 계약 의무 없음 · 초안 무료 · 마음에 들 때만 결제</span>
                </div>
              </form>
            )}
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}

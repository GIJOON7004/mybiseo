/*
 * CalendlyEmbed — Calendly 인라인 위젯 임베드
 * Calendly URL이 설정되지 않은 경우 대체 UI 표시
 */
import { useEffect, useRef, useState } from "react";
import { Calendar, Clock, Video, Phone, ArrowRight } from "lucide-react";

// Calendly URL — 실제 URL로 교체 필요
const CALENDLY_URL = "https://calendly.com/mybiseo/30min";

export default function CalendlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Calendly 위젯 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);

    return () => {
      // cleanup
      try {
        document.head.removeChild(script);
      } catch {}
    };
  }, []);

  // Calendly 위젯이 로드되지 않은 경우 대체 UI
  if (error) {
    return <FallbackBooking />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* 상단 안내 */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">30분 상담하기</h3>
            <p className="text-xs text-muted-foreground">편한 시간을 선택하시면, 원장님께 맞는 AI 마케팅 전략을 제안드립니다</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" /> 30분 소요
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Video className="w-3 h-3" /> 화상 또는 전화
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Phone className="w-3 h-3" /> 부담 없는 상담
          </span>
        </div>
      </div>

      {/* Calendly 인라인 위젯 */}
      <div
        ref={containerRef}
        className="calendly-inline-widget"
        data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=0a0a14&text_color=e8e8ed&primary_color=00c2a8`}
        style={{ minWidth: "320px", height: "630px" }}
      />
    </div>
  );
}

/* ─── Calendly 로드 실패 시 대체 UI ─── */
function FallbackBooking() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-7 h-7 text-brand" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">30분 상담하기</h3>
      <p className="text-sm text-muted-foreground mb-6">
        아래 버튼을 클릭하시면 Calendly에서 편한 시간을 선택하실 수 있습니다.
      </p>
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand text-background font-semibold text-[15px] hover:brightness-110 transition-all"
      >
        상담 시간 선택하기
        <ArrowRight className="w-4 h-4" />
      </a>
      <div className="flex items-center justify-center gap-4 mt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" /> 30분 소요
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Video className="w-3 h-3" /> 화상 또는 전화
        </span>
      </div>
    </div>
  );
}

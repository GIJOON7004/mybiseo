/**
 * 현실 진단 요약 (Reality Diagnosis Summary) — McKinsey-grade
 * AI 가시성 진단 결과 최상단에 표시
 * 구조: Executive Summary (항상 보임) → 상세 분석 (접기/펼치기)
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  ChevronDown, ChevronUp, Loader2,
  ShieldAlert, Activity,
} from "lucide-react";
import RealityDetails from "./RealityDetails";

const NaverIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
  </svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

interface Props {
  url: string;
  specialty: string;
  seoScore: number;
  seoGrade: string;
  categoryScores: Record<string, number>;
  siteName?: string;
}

/* ── 원형 리스크 스코어 ── */
function RiskCircle({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? "#ef4444" : score >= 50 ? "#f59e0b" : score >= 25 ? "#3b82f6" : "#10b981";
  const label = score >= 75 ? "위험" : score >= 50 ? "주의" : score >= 25 ? "보통" : "양호";
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-border/20" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
        <text x="44" y="40" textAnchor="middle" className="fill-foreground" style={{ fontSize: "22px", fontWeight: 700 }}>{score}</text>
        <text x="44" y="56" textAnchor="middle" style={{ fontSize: "10px", fill: color, fontWeight: 600 }}>{label}</text>
      </svg>
      <span className="text-[10px] text-muted-foreground mt-0.5">위험 지수</span>
    </div>
  );
}

/* ── 반원 게이지 ── */
function SemiGauge({ value, color, label, icon }: { value: number; color: string; label: string; icon: React.ReactNode }) {
  const r = 30;
  const circ = Math.PI * r;
  const offset = circ * (1 - Math.min(value, 100) / 100);
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-background/40 border border-border/30">
      <svg width="72" height="40" viewBox="0 0 72 40">
        <path d={`M 4 36 A ${r} ${r} 0 0 1 68 36`} fill="none" stroke="currentColor" strokeWidth="5" className="text-border/20" />
        <path d={`M 4 36 A ${r} ${r} 0 0 1 68 36`} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
      </svg>
      <span className="text-base font-bold -mt-1" style={{ color }}>{value}<span className="text-[10px] text-muted-foreground">%</span></span>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">{icon}{label}</div>
    </div>
  );
}



/* ── HTML 태그 제거 유틸리티 ── */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")  // HTML 태그 제거 (</td>, <br/> 등)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ── 종합 의견 요약 컴포넌트 ── */
function ClosingSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const cleanText = useMemo(() => stripHtml(text), [text]);
  
  // 웹에서는 처음 200자만 보여주고 나머지는 접기
  const isLong = cleanText.length > 200;
  const summary = isLong ? cleanText.slice(0, 200) + "..." : cleanText;
  
  // 문단 분리 (. 기준)
  const displayText = expanded ? cleanText : summary;
  const paragraphs = expanded 
    ? cleanText.split(/(?<=\.)\s+/).filter(p => p.trim().length > 0)
    : [displayText];

  return (
    <div className="mb-5 rounded-xl border border-border/30 bg-background/30 overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-brand" />
          <span className="text-xs font-semibold text-foreground">종합 의견</span>
        </div>
        <span className="text-[10px] text-muted-foreground">상세 내용은 PDF 보고서에서 확인하세요</span>
      </div>
      {/* 본문 */}
      <div className="px-5 py-4">
        {paragraphs.map((p, i) => (
          <p key={i} className={`text-sm text-muted-foreground leading-relaxed ${
            i < paragraphs.length - 1 ? "mb-3" : ""
          }`}>
            {p}
          </p>
        ))}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs font-medium text-brand hover:text-brand/80 transition-colors flex items-center gap-1"
          >
            {expanded ? (
              <><ChevronUp className="w-3.5 h-3.5" /> 접기</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> 더 보기</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
 *  메인 컴포넌트
 * ══════════════════════════════════════════ */
export default function RealityDiagnosisSection({ url, specialty, seoScore, seoGrade, categoryScores, siteName }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [showKeywordDetails, setShowKeywordDetails] = useState(false);
  const triggeredRef = useRef(false);
  const realityMutation = trpc.seoAnalyzer.realityDiagnosis.useMutation();

  useEffect(() => {
    if (!triggeredRef.current) {
      triggeredRef.current = true;
      realityMutation.mutate({ url, specialty, seoScore, seoGrade, categoryScores, siteName });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const data = realityMutation.data;

  /* ── 로딩 ── */
  if (realityMutation.isPending) {
    return (
      <div className="mb-8 animate-fade-in">
        <div className="p-6 sm:p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-brand/10 animate-pulse"><Activity className="w-6 h-6 text-brand" /></div>
            <div>
              <h3 className="text-lg font-bold text-foreground">현실 진단 보고서 생성 중</h3>
              <p className="text-xs text-muted-foreground">원장님 병원의 AI 가시성 현황을 분석하고 있습니다</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {["AI 가시성", "네이버 AI 대응", "구글 가시성"].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-background/30 border border-border/30 text-center animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                <Loader2 className="w-4 h-4 animate-spin text-brand mx-auto mb-1.5" />
                <span className="text-[10px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
          <div className="h-1 rounded-full bg-border/20 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (realityMutation.isError || !data) return null;

  const urgCfg: Record<string, { color: string; bg: string; border: string; label: string }> = {
    critical: { color: "#ef4444", bg: "from-red-500/6 via-red-500/2 to-transparent", border: "border-red-500/25", label: "긴급 개선 필요" },
    high: { color: "#f59e0b", bg: "from-amber-500/6 via-amber-500/2 to-transparent", border: "border-amber-500/25", label: "빠른 개선 권장" },
    medium: { color: "#3b82f6", bg: "from-blue-500/6 via-blue-500/2 to-transparent", border: "border-blue-500/25", label: "개선 권장" },
    low: { color: "#10b981", bg: "from-emerald-500/6 via-emerald-500/2 to-transparent", border: "border-emerald-500/25", label: "양호" },
  };
  const u = urgCfg[data.urgencyLevel] || urgCfg.medium;

  return (
    <div className="mb-10 animate-fade-in">
      <div className={`rounded-2xl border ${u.border} bg-gradient-to-br ${u.bg} overflow-hidden`}>

        {/* ═══════════════════════════════════════════
         *  EXECUTIVE SUMMARY — 항상 보임
         * ═══════════════════════════════════════════ */}
        <div className="p-5 sm:p-8">
          {/* 라벨 */}
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="w-4 h-4" style={{ color: u.color }} />
            <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: u.color }}>현실 진단 보고서</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: u.color, background: `${u.color}15` }}>{u.label}</span>
          </div>

          {/* 헤드라인 */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug mb-3">{stripHtml(data.headline)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{stripHtml(data.executiveSummary)}</p>
          </div>

          {/* 핵심 발견 3가지 */}
          {data.keyFindings && data.keyFindings.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {data.keyFindings.map((finding: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-background/40 border border-border/30">
                  <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: `${u.color}20`, color: u.color }}>{i + 1}</div>
                  <p className="text-xs text-foreground leading-relaxed">{stripHtml(finding)}</p>
                </div>
              ))}
            </div>
          )}

          {/* 핵심 키워드 노출 요약 */}
          {data.keywords && data.keywords.length > 0 && (() => {
            const total = data.keywords.length;
            const naverFound = data.keywords.filter((k: any) => k.naver?.found).length;
            const googleFound = data.keywords.filter((k: any) => k.google?.found).length;
            const aiFound = data.keywords.filter((k: any) => k.ai?.likelihood === 'high' || k.ai?.likelihood === 'medium').length;
            const overallRate = Math.round(((naverFound + googleFound + aiFound) / (total * 3)) * 100);
            return (
              <div className="mb-5 p-4 rounded-xl bg-background/30 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-foreground">핵심 키워드 노출 현황</span>
                  <span className="text-[10px] text-muted-foreground">총 {total}개 키워드 분석</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-background/40">
                    <div className="text-lg font-bold" style={{ color: overallRate >= 50 ? '#10b981' : overallRate >= 25 ? '#f59e0b' : '#ef4444' }}>{overallRate}%</div>
                    <div className="text-[10px] text-muted-foreground">종합 가시성</div>
                  </div>
                  <div className="p-2 rounded-lg bg-background/40">
                    <div className="text-lg font-bold text-[#a855f7]">{aiFound}<span className="text-xs text-muted-foreground">/{total}</span></div>
                    <div className="text-[10px] text-muted-foreground">AI 인용</div>
                  </div>
                  <div className="p-2 rounded-lg bg-background/40">
                    <div className="text-lg font-bold text-[#03C75A]">{naverFound}<span className="text-xs text-muted-foreground">/{total}</span></div>
                    <div className="text-[10px] text-muted-foreground">네이버</div>
                  </div>
                  <div className="p-2 rounded-lg bg-background/40">
                    <div className="text-lg font-bold text-[#4285F4]">{googleFound}<span className="text-xs text-muted-foreground">/{total}</span></div>
                    <div className="text-[10px] text-muted-foreground">구글</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 핵심 지표 3개 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <SemiGauge value={data.metrics.aiReadiness} color="#a855f7" label="AI 인용 대비도"
              icon={<Bot className="w-3 h-3" />} />
            <SemiGauge value={data.metrics.naverExposureRate} color="#03C75A" label="네이버 노출률"
              icon={<NaverIcon />} />
            <SemiGauge value={data.metrics.googleExposureRate} color="#4285F4" label="구글 노출률"
              icon={<GoogleIcon />} />
          </div>

          {/* 종합 의견 — 웹에서는 간결 요약만, 상세는 PDF */}
          {data.closingStatement && (
            <ClosingSummary text={data.closingStatement} />
          )}

          {/* 상세 보기 토글 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-border/50 bg-background/30 hover:bg-background/50 transition-colors text-foreground"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? "상세 분석 접기" : "상세 분석 보기"}
            </button>
          </div>
        </div>

        {/* 상세 분석 — 펼치기 시 표시 */}
        {showDetails && <RealityDetails data={data} />}

      </div>
    </div>
  );
}

/**
 * SNS 마케팅 팁 섹션 - 진단서 결과에 경쟁사 키워드 기반 SNS 마케팅 팁 추가
 * AI(LLM) 기반 고도화 + 로컬 폴백
 */
import { useState } from "react";
import { Share2, Sparkles, Loader2, ChevronUp, ArrowRight, Brain, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

type SeoCheckStatus = "pass" | "fail" | "warning";

interface SeoCheckItem {
  id: string;
  category: string;
  name: string;
  status: SeoCheckStatus;
  score: number;
  maxScore: number;
  detail: string;
  recommendation: string;
  impact: string;
}

interface SeoResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  grade: string;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    items: SeoCheckItem[];
  }[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
  siteName?: string;
}

type CountryCode = "kr" | "th";

function t(country: CountryCode, ko: string, en: string): string;
function t(country: CountryCode, ko: React.ReactNode, en: React.ReactNode): React.ReactNode;
function t(country: CountryCode, ko: any, en: any) { return country === "th" ? en : ko; }

interface SnsTip {
  platform: string;
  title?: string;
  tip?: string;
  description?: string;
  frequency: string;
  keywords: string[];
  contentIdeas?: string[];
  priority?: string;
}

export default function SnsMarketingTipsSection({ result, specialty, country = "kr" }: { result: SeoResult; specialty: string; country?: "kr" | "th" }) {
  const cc = country as CountryCode;
  const [showTips, setShowTips] = useState(false);
  const [tips, setTips] = useState<SnsTip[] | null>(null);
  const [overallStrategy, setOverallStrategy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const aiSnsTipsMutation = trpc.aiSnsTips.generate.useMutation();

  const failedItems = result.categories.flatMap(c => c.items).filter(i => i.status === "fail" || i.status === "warning");
  const siteName = result.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  const generateLocalTips = (): SnsTip[] => {
    const snsItems: SnsTip[] = [];
    snsItems.push({
      platform: "네이버 블로그",
      tip: specialty
        ? `"${specialty} ${siteName.split(".")[0]}" 키워드로 주 2~3회 블로그 발행. 환자 후기/시술 정보/Q&A 형식이 효과적입니다.`
        : `병원 전문 키워드로 주 2~3회 블로그 발행. 환자 후기/시술 정보/Q&A 형식이 효과적입니다.`,
      frequency: "주 2~3회",
      keywords: specialty ? [`${specialty} 병원`, `${specialty} 추천`, `${specialty} 비용`, `${specialty} 후기`] : ["병원 추천", "진료 후기", "병원 정보"],
    });
    snsItems.push({
      platform: "인스타그램",
      tip: "병원 내부/시술 전후/의료진 소개 릴스를 주 1~2회 발행하세요. 해시태그는 지역명+진료과 조합이 효과적입니다.",
      frequency: "주 1~2회",
      keywords: specialty ? [`#${specialty}`, `#${specialty}병원`, `#${specialty}추천`] : ["#병원추천", "#의료정보"],
    });
    snsItems.push({
      platform: "카카오 톡채널",
      tip: "예약 안내/이벤트/건강 팁 메시지를 주 1회 발송하세요. 친구 추가 유도를 위해 QR코드를 원내에 비치하세요.",
      frequency: "주 1회",
      keywords: ["예약 안내", "건강 팁", "이벤트"],
    });
    const hasSeoIssue = failedItems.some(i => i.name.includes("meta") || i.name.includes("title") || i.name.includes("제목"));
    if (hasSeoIssue) {
      snsItems.push({
        platform: "구글 비즈니스 프로필",
        tip: "구글 비즈니스 프로필에 병원 사진/진료시간/위치 정보를 최신 상태로 유지하세요. 환자 리뷰 요청도 적극 활용하세요.",
        frequency: "월 1회 업데이트",
        keywords: ["병원 리뷰", "구글 지도", "병원 위치"],
      });
    }
    return snsItems;
  };

  const handleLocalTips = () => {
    if (!tips) {
      setLoading(true);
      setTimeout(() => {
        setTips(generateLocalTips());
        setIsAiGenerated(false);
        setLoading(false);
        setShowTips(true);
      }, 300);
    } else {
      setShowTips(!showTips);
    }
  };

  const handleAiTips = async () => {
    setLoading(true);
    try {
      const aiResult = await aiSnsTipsMutation.mutateAsync({
        url: result.url,
        specialty: specialty || undefined,
        country: country,
        diagnosticResult: result,
      });
      const aiTips: SnsTip[] = (aiResult.tips || []).map((t: any) => ({
        platform: t.platform,
        title: t.title,
        description: t.description,
        tip: t.description,
        frequency: t.frequency,
        keywords: t.keywords || [],
        contentIdeas: t.contentIdeas || [],
        priority: t.priority,
      }));
      setTips(aiTips);
      setOverallStrategy(aiResult.overallStrategy || "");
      setIsAiGenerated(true);
      setShowTips(true);
    } catch {
      // AI 실패 시 로컬 폴백
      setTips(generateLocalTips());
      setIsAiGenerated(false);
      setShowTips(true);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const colors: Record<string, string> = {
      "높음": "bg-red-500/10 text-red-400 border-red-500/20",
      "중간": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      "낮음": "bg-green-500/10 text-green-400 border-green-500/20",
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[priority] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="mb-8 animate-fade-in">
      <div className="p-4 sm:p-6 rounded-2xl border-2 border-purple-500/30 bg-purple-500/5">
        {/* 헤더 — 모바일에서 버튼 줄바꿈 */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 shrink-0">
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {t(cc, "SNS 마케팅 실행 가이드", "SNS Marketing Action Guide")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(cc, "진단 결과 기반 맞춤형 SNS 마케팅 전략", "Customized SNS marketing strategy based on diagnosis")}
            </p>
          </div>
        </div>
        {/* 버튼 — 모바일에서 가로 풀 너비 */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleLocalTips}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50 border border-purple-500/30"
          >
            {loading && !aiSnsTipsMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : showTips && !isAiGenerated ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {t(cc, "기본 팁", "Basic Tips")}
          </button>
          <button
            onClick={handleAiTips}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {aiSnsTipsMutation.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t(cc, "AI 분석 중...", "AI Analyzing...")}</>
            ) : (
              <><Brain className="w-3.5 h-3.5" />{t(cc, "AI 맞춤 팁", "AI Custom Tips")}</>
            )}
          </button>
        </div>

        {showTips && tips && (
          <div className="mt-4 space-y-3 animate-fade-in">
            {/* AI 생성 표시 + 전체 전략 */}
            {isAiGenerated && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2">
                <Wand2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-purple-400">AI 맞춤 분석 결과</span>
                  {overallStrategy && (
                    <p className="text-sm text-muted-foreground mt-1">{overallStrategy}</p>
                  )}
                </div>
              </div>
            )}

            {tips.map((tip, idx) => (
              <div key={idx} className="p-3 sm:p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-sm">{tip.platform}</span>
                  {tip.title && tip.title !== tip.platform && (
                    <span className="text-xs text-muted-foreground truncate">- {tip.title}</span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    {getPriorityBadge(tip.priority)}
                    <span className="text-[11px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {tip.frequency}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2 break-words">{tip.tip || tip.description}</p>

                {/* 콘텐츠 아이디어 (AI 전용) */}
                {tip.contentIdeas && tip.contentIdeas.length > 0 && (
                  <div className="mb-2 pl-3 border-l-2 border-purple-500/30">
                    <p className="text-xs font-medium text-purple-400 mb-1">콘텐츠 아이디어</p>
                    {tip.contentIdeas.map((idea, i) => (
                      <p key={i} className="text-xs text-muted-foreground">- {idea}</p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {(tip.keywords || []).slice(0, 5).map((kw: string, ki: number) => (
                    <span key={ki} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {kw}
                    </span>
                  ))}
                  {(tip.keywords || []).length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                      +{(tip.keywords || []).length - 5}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* CTA: 벤치마킹 리포트 유도 */}
            <div className="mt-4 p-4 rounded-xl bg-brand/5 border border-brand/20 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t(cc, "더 상세한 경쟁사 분석과 AI 맞춤 전략이 필요하신가요?", "Need more detailed competitor analysis and AI-customized strategy?")}
              </p>
              <Link
                href="/admin/benchmarking"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
              >
                {t(cc, "프리미엄 벤치마킹 리포트 생성하기", "Generate Premium Benchmarking Report")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

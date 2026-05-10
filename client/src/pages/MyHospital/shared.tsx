import { Plus, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── 공통 컴포넌트 ── */

export function GradeCircle({ score, grade, size = "lg" }: { score: number; grade: string; size?: "lg" | "sm" }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : score >= 40 ? "text-orange-400" : "text-red-400";
  const bgColor = score >= 80 ? "bg-emerald-400/10" : score >= 60 ? "bg-amber-400/10" : score >= 40 ? "bg-orange-400/10" : "bg-red-400/10";
  const borderColor = score >= 80 ? "border-emerald-400/30" : score >= 60 ? "border-amber-400/30" : score >= 40 ? "border-orange-400/30" : "border-red-400/30";
  if (size === "sm") {
    return (
      <div className={`w-12 h-12 rounded-full ${bgColor} border ${borderColor} flex items-center justify-center`}>
        <span className={`text-sm font-bold ${color}`}>{score}</span>
      </div>
    );
  }
  return (
    <div className={`w-28 h-28 rounded-full ${bgColor} border-2 ${borderColor} flex flex-col items-center justify-center`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className={`text-xs ${color} font-medium`}>{grade}</span>
    </div>
  );
}

export function ScoreChangeIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <span className="text-xs text-muted-foreground">첫 진단</span>;
  const diff = current - previous;
  if (diff > 0) return <span className="text-xs text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+{diff}점</span>;
  if (diff < 0) return <span className="text-xs text-red-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />{diff}점</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" />변동없음</span>;
}

export function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

export function InsightBanner({ icon: Icon, color, message }: { icon: any; color: string; message: string }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${color} mb-6`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export const SPECIALTIES = ["치과", "피부과", "성형외과", "한의원", "정형외과", "안과", "산부인과", "내과", "이비인후과", "비뇨기과", "종합병원"];
export const REGIONS = ["서울 강남", "서울 서초", "서울 송파", "서울 마포", "서울 강서", "서울", "경기 성남", "경기 수원", "부산", "대구", "인천", "대전", "광주"];

export const CHANNEL_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  ai_chatgpt: { label: "ChatGPT", color: "bg-emerald-500", icon: "🤖" },
  ai_gemini: { label: "Gemini", color: "bg-blue-500", icon: "✨" },
  ai_claude: { label: "Claude", color: "bg-orange-500", icon: "🧠" },
  ai_perplexity: { label: "Perplexity", color: "bg-purple-500", icon: "🔍" },
  ai_copilot: { label: "Copilot", color: "bg-cyan-500", icon: "💡" },
  ai_other: { label: "기타 AI", color: "bg-teal-500", icon: "🤖" },
  naver: { label: "네이버", color: "bg-green-500", icon: "N" },
  google: { label: "구글", color: "bg-red-500", icon: "G" },
  sns_instagram: { label: "인스타그램", color: "bg-pink-500", icon: "📷" },
  sns_youtube: { label: "유튜브", color: "bg-red-600", icon: "▶" },
  sns_blog: { label: "블로그", color: "bg-lime-500", icon: "📝" },
  direct: { label: "직접 방문", color: "bg-gray-500", icon: "🔗" },
  referral: { label: "외부 링크", color: "bg-indigo-500", icon: "↗" },
  other: { label: "기타", color: "bg-slate-500", icon: "?" },
};

export function EnhancedEmptyState({ icon: Icon, title, description, steps }: { icon: LucideIcon | any; title: string; description: string; steps?: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 flex items-center justify-center mb-6 relative">
        <Icon className="w-9 h-9 text-brand" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      {steps && steps.length > 0 && (
        <div className="flex flex-col gap-2 text-left max-w-sm w-full">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

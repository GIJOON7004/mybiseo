import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

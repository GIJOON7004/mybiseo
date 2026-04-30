/**
 * B3: 멀티모델 라우팅 설정 — AI 원가 30% 절감
 * B4: 전략적 플랫폼 파트너십 관리
 * B5: B2B2B 파트너 생태계 관리
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Cpu, Zap, DollarSign, Settings, BarChart3, TrendingDown,
  Globe, Building2, Users, Handshake, Plus, CheckCircle2,
  ArrowRight, Sparkles, Shield, Clock, Layers, Target,
} from "lucide-react";
import { toast } from "sonner";

/* ── B3: 멀티모델 라우팅 설정 ── */
interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  costPer1k: number;
  speed: string;
  quality: string;
  useCases: string[];
  enabled: boolean;
}

const defaultModels: ModelConfig[] = [
  { id: "gpt4o", name: "GPT-4o", provider: "OpenAI", costPer1k: 5.0, speed: "보통", quality: "최상", useCases: ["의료 콘텐츠 생성", "복잡한 분석", "번역 검수"], enabled: true },
  { id: "gpt4o-mini", name: "GPT-4o Mini", provider: "OpenAI", costPer1k: 0.15, speed: "빠름", quality: "상", useCases: ["FAQ 응답", "간단한 요약", "키워드 추출"], enabled: true },
  { id: "claude-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", costPer1k: 3.0, speed: "보통", quality: "최상", useCases: ["장문 블로그", "의료법 검수", "경쟁사 분석"], enabled: true },
  { id: "claude-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", costPer1k: 0.25, speed: "매우 빠름", quality: "상", useCases: ["챗봇 응답", "분류", "감성 분석"], enabled: true },
  { id: "gemini-pro", name: "Gemini 2.0 Flash", provider: "Google", costPer1k: 0.075, speed: "매우 빠름", quality: "중상", useCases: ["대량 처리", "AI 검색 분석", "데이터 정리"], enabled: false },
];

/* ── B4/B5: 파트너 생태계 ── */
interface Partner {
  name: string;
  type: "EMR" | "CRM" | "대행사" | "플랫폼";
  status: "연동 완료" | "협의 중" | "계획";
  hospitals: number;
}

const partners: Partner[] = [
  { name: "굿닥", type: "플랫폼", status: "계획", hospitals: 0 },
  { name: "바비톡", type: "플랫폼", status: "계획", hospitals: 0 },
  { name: "강남언니", type: "플랫폼", status: "계획", hospitals: 0 },
  { name: "덴트인", type: "EMR", status: "계획", hospitals: 0 },
  { name: "리얼닥터", type: "CRM", status: "계획", hospitals: 0 },
];

const partnerTypeConfig = {
  EMR: { bg: "bg-blue-500/10", text: "text-blue-400" },
  CRM: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "대행사": { bg: "bg-amber-400/10", text: "text-amber-400" },
  "플랫폼": { bg: "bg-violet-500/10", text: "text-violet-400" },
};

const statusConfig = {
  "연동 완료": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  "협의 중": { bg: "bg-amber-400/10", text: "text-amber-400", dot: "bg-amber-400" },
  "계획": { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export default function AdminPlatformSettings() {
  const [models, setModels] = useState(defaultModels);

  const toggleModel = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    toast.success("모델 설정이 변경되었습니다");
  };

  const enabledModels = models.filter(m => m.enabled);
  const avgCost = enabledModels.length > 0
    ? enabledModels.reduce((sum, m) => sum + m.costPer1k, 0) / enabledModels.length
    : 0;
  const savingsPercent = Math.round((1 - avgCost / 5.0) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-brand/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-foreground">플랫폼 설정</h1>
              <p className="text-sm text-muted-foreground">AI 모델 라우팅 + 파트너 생태계 관리</p>
            </div>
          </div>
        </div>

        {/* B3: AI 비용 절감 요약 */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">AI 비용 절감률</p>
                  <p className="text-xl font-bold font-display text-emerald-400">{savingsPercent}%</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">멀티모델 라우팅으로 GPT-4o 단독 대비 절감</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">활성 모델</p>
                  <p className="text-xl font-bold font-display text-foreground">{enabledModels.length}개</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">작업 난이도별 자동 분배</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">평균 비용/1K토큰</p>
                  <p className="text-xl font-bold font-display text-foreground">${avgCost.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">GPT-4o 단독: $5.00/1K</p>
            </CardContent>
          </Card>
        </div>

        {/* B3: 모델 라우팅 설정 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand" />
              AI 모델 라우팅 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {models.map((model) => (
                <div key={model.id} className={`p-3 rounded-lg border ${model.enabled ? "border-brand/20 bg-brand/5" : "border-border bg-muted/30 opacity-60"} transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleModel(model.id)}
                        className={`w-10 h-5 rounded-full transition-all relative ${model.enabled ? "bg-brand" : "bg-muted-foreground/30"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${model.enabled ? "left-5.5" : "left-0.5"}`}
                          style={{ left: model.enabled ? "22px" : "2px" }}
                        />
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{model.name}</p>
                        <p className="text-[10px] text-muted-foreground">{model.provider} · ${model.costPer1k}/1K · {model.speed}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${model.quality === "최상" ? "bg-brand/10 text-brand" : model.quality === "상" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>
                      품질: {model.quality}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {model.useCases.map((uc, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 border border-border text-muted-foreground">{uc}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* B4/B5: 파트너 생태계 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Handshake className="w-4 h-4 text-brand" />
              파트너 생태계
              <span className="text-[10px] font-normal text-muted-foreground ml-auto">B2B2B 확장 전략</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {partners.map((p, i) => {
                const tc = partnerTypeConfig[p.type];
                const sc = statusConfig[p.status];
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center`}>
                        <Building2 className={`w-4 h-4 ${tc.text}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${tc.text}`}>{p.type}</span>
                          {p.hospitals > 0 && <span className="text-[10px] text-muted-foreground">{p.hospitals}개 병원 연동</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      <span className={`text-[10px] font-medium ${sc.text}`}>{p.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => toast.info("파트너 추가 기능은 준비 중입니다")}
              className="w-full mt-3 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-border hover:border-brand/30 text-muted-foreground hover:text-brand transition-all text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              파트너 추가
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Video, Sparkles, Copy, Loader2, Film, Clapperboard, Eye, Trash2, RefreshCw } from "lucide-react";

export default function VideoPromptGenerator() {
  const { data: prompts = [] } = trpc.videoMarketing.list.useQuery();
  const utils = trpc.useUtils();
  const generateMut = trpc.videoMarketing.generate.useMutation({ onSuccess: () => { toast.success("AI 영상 프롬프트 생성 완료"); utils.videoMarketing.list.invalidate(); setShowGen(false); },
  onError: (err) => toast.error(err.message) });
  const deleteMut = trpc.videoMarketing.delete.useMutation({ onSuccess: () => utils.videoMarketing.list.invalidate()});
  const [showGen, setShowGen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    treatmentName: "",
    videoType: "fear_relief",
    targetEmotion: "공포증 해소",
    duration: "30초",
    additionalNotes: "",
  });

  const videoTypes: Record<string, { label: string; desc: string; icon: string }> = {
    fear_relief: { label: "공포증 해소", desc: "시술이 무섭지 않다는 것을 보여주는 영상", icon: "😌" },
    before_after: { label: "전후 변신", desc: "시술 전후 극적인 변화를 보여주는 영상", icon: "✨" },
    procedure_guide: { label: "시술 과정 안내", desc: "시술이 어떻게 진행되는지 단계별 안내", icon: "📋" },
    doctor_explain: { label: "원장님 직접 설명", desc: "원장님이 직접 시술을 설명하는 영상", icon: "👨‍⚕️" },
    behind_scene: { label: "비하인드 씬", desc: "병원 일상/준비 과정을 보여주는 영상", icon: "🎬" },
    patient_story: { label: "환자 스토리", desc: "환자의 고민과 해결 과정을 스토리텔링", icon: "💬" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6" />AI 영상 프롬프트</h2>
          <p className="text-muted-foreground mt-1">Veo3/Sora 등 AI 영상 생성 도구에 바로 사용할 수 있는 프롬프트를 자동 생성합니다.</p>
        </div>
        <Button onClick={() => setShowGen(true)}><Sparkles className="h-4 w-4 mr-1" />프롬프트 생성</Button>
      </div>

      {showGen && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-lg">AI 영상 프롬프트 생성</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">시술명</label>
              <Input placeholder="예: 코성형, 보톡스, 쥬베룩" value={form.treatmentName} onChange={e => setForm(p => ({ ...p, treatmentName: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">영상 유형</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(videoTypes).map(([key, val]) => (
                  <button key={key} onClick={() => setForm(p => ({ ...p, videoType: key, targetEmotion: val.label }))}
                    className={`p-3 rounded-lg border text-left transition-all ${form.videoType === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                    <div className="text-lg mb-1">{val.icon}</div>
                    <div className="text-sm font-medium">{val.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{val.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">영상 길이</label>
                <Select value={form.duration} onValueChange={v => setForm(p => ({ ...p, duration: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15초">15초 (숏폼)</SelectItem>
                    <SelectItem value="30초">30초 (릴스)</SelectItem>
                    <SelectItem value="60초">60초 (릴스)</SelectItem>
                    <SelectItem value="3분">3분 (유튜브)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">목표 감정</label>
                <Input placeholder="예: 안심, 기대감, 신뢰" value={form.targetEmotion} onChange={e => setForm(p => ({ ...p, targetEmotion: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">추가 요청사항</label>
              <Textarea placeholder="예: 20대 여성 타겟, 밝은 톤, 자막 포함" value={form.additionalNotes} onChange={e => setForm(p => ({ ...p, additionalNotes: e.target.value }))} rows={2} />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => generateMut.mutate(form)} disabled={!form.treatmentName || generateMut.isPending}>
                {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                프롬프트 생성
              </Button>
              <Button variant="outline" onClick={() => setShowGen(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((p: any) => {
          const vt = videoTypes[p.videoType] || { label: p.videoType, icon: "🎥" };
          return (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{vt.icon}</span>
                      <span className="font-medium">{p.treatmentName}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{vt.label}</Badge>
                      <Badge variant="secondary">{p.duration}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={e => { e.stopPropagation(); deleteMut.mutate({ id: p.id }); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {p.promptText && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{p.promptText}</p>}
              </CardContent>
            </Card>
          );
        })}
        {prompts.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>아직 생성된 프롬프트가 없습니다.</p>
            <p className="text-sm mt-1">위 버튼을 눌러 AI 영상 프롬프트를 생성해보세요.</p>
          </div>
        )}
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{videoTypes[selected.videoType]?.icon || "🎥"}</span>
                {selected.treatmentName} - {videoTypes[selected.videoType]?.label || selected.videoType}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold flex items-center gap-1"><Film className="h-4 w-4" />Veo3/Sora 프롬프트</span>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(selected.promptText || ""); toast.success("프롬프트 복사 완료"); }}>
                    <Copy className="h-3 w-3 mr-1" />복사
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">{selected.promptText}</pre>
              </div>

              {selected.sceneBreakdown && (
                <div>
                  <span className="font-semibold flex items-center gap-1"><Clapperboard className="h-4 w-4" />장면별 분석</span>
                  <pre className="whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mt-2 text-sm">{selected.sceneBreakdown}</pre>
                </div>
              )}

              {selected.directionNotes && (
                <div>
                  <span className="font-semibold flex items-center gap-1"><Eye className="h-4 w-4" />연출 노트</span>
                  <pre className="whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 rounded-lg p-4 mt-2 text-sm">{selected.directionNotes}</pre>
                </div>
              )}

              {selected.hashtags && (
                <div>
                  <span className="font-semibold">추천 해시태그</span>
                  <p className="text-muted-foreground mt-1">{selected.hashtags}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

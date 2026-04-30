import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Palette, Lightbulb, Zap, FileText, Calendar, Plus, Trash2, Sparkles, ExternalLink, Loader2, ChevronRight, Copy, RefreshCw } from "lucide-react";
import RequireHospital from "@/components/RequireHospital";

// ── 1단계: 스타일 가이드 ──
function StyleGuideTab() {
  const { data: guide, isLoading } = trpc.contentFactory.getStyleGuide.useQuery();
  const saveMut = trpc.contentFactory.saveStyleGuide.useMutation({
    onSuccess: () => { toast.success("스타일 가이드 저장 완료"); utils.contentFactory.getStyleGuide.invalidate(); },
  });
  const utils = trpc.useUtils();
  const [form, setForm] = useState<Record<string, string>>({});

  const fields = [
    { key: "brandColor", label: "브랜드 메인 컬러", placeholder: "#2563EB 또는 파란색 계열" },
    { key: "subColors", label: "서브 컬러", placeholder: "#F59E0B, #10B981 등" },
    { key: "fontStyle", label: "글씨체 스타일", placeholder: "고딕 계열, 깔끔하고 모던한 느낌" },
    { key: "toneOfVoice", label: "톤앤매너", placeholder: "전문적이면서 친근한, 신뢰감 있는" },
    { key: "targetAudience", label: "타겟 고객", placeholder: "20~40대 여성, 피부/성형 관심" },
    { key: "brandKeywords", label: "브랜드 키워드", placeholder: "자연스러운, 안전한, 전문적인, 1:1 맞춤" },
    { key: "doList", label: "DO (해야 할 것)", placeholder: "전문 용어 쉽게 풀어쓰기, 환자 후기 활용" },
    { key: "dontList", label: "DON'T (하지 말 것)", placeholder: "과장 표현, 경쟁사 비방, 의료광고법 위반" },
    { key: "referenceUrls", label: "참고 레퍼런스 URL", placeholder: "https://instagram.com/xxx" },
  ];

  const getValue = (key: string) => form[key] ?? (guide as any)?.[key] ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">브랜드 스타일 가이드</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">콘텐츠 제작 시 일관된 브랜드 톤을 유지하기 위한 가이드입니다.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-sm font-medium">{f.label}</label>
            {f.key === "doList" || f.key === "dontList" || f.key === "referenceUrls" ? (
              <Textarea placeholder={f.placeholder} value={getValue(f.key)} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3} />
            ) : (
              <Input placeholder={f.placeholder} value={getValue(f.key)} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <Button onClick={() => saveMut.mutate(Object.fromEntries(fields.map(f => [f.key, getValue(f.key)])))} disabled={saveMut.isPending}>
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}저장
      </Button>
    </div>
  );
}

// ── 2단계: 아이디어 수집방 ──
function IdeasTab() {
  const { data: ideas = [], isLoading } = trpc.contentFactory.listIdeas.useQuery();
  const utils = trpc.useUtils();
  const addMut = trpc.contentFactory.addIdea.useMutation({ onSuccess: () => { toast.success("아이디어 추가 완료"); utils.contentFactory.listIdeas.invalidate(); setShowAdd(false); } });
  const deleteMut = trpc.contentFactory.deleteIdea.useMutation({ onSuccess: () => { utils.contentFactory.listIdeas.invalidate(); } });
  const analyzeMut = trpc.contentFactory.analyzeIdea.useMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", sourceUrl: "", platform: "", category: "", notes: "" });
  const [analysis, setAnalysis] = useState<any>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-lg">아이디어 수집방</h3>
          <Badge variant="secondary">{ideas.length}개</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />아이디어 추가</Button>
      </div>
      <p className="text-sm text-muted-foreground">잘 터진 병원 릴스/유튜브 영상을 스크랩하고 분석하세요. 매일 3개씩 수집하는 것을 추천합니다.</p>

      {showAdd && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="콘텐츠 제목/설명" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="원본 URL" value={form.sourceUrl} onChange={e => setForm(p => ({ ...p, sourceUrl: e.target.value }))} />
              <Select value={form.platform} onValueChange={v => setForm(p => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue placeholder="플랫폼" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">인스타그램</SelectItem>
                  <SelectItem value="youtube">유튜브</SelectItem>
                  <SelectItem value="tiktok">틱톡</SelectItem>
                  <SelectItem value="blog">블로그</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="메모 (왜 이 콘텐츠가 잘 됐는지?)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMut.mutate(form)} disabled={!form.title || addMut.isPending}>
                {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}저장
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {ideas.map((idea: any) => (
          <Card key={idea.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{idea.title}</span>
                  {idea.platform && <Badge variant="outline" className="text-xs">{idea.platform}</Badge>}
                </div>
                {idea.notes && <p className="text-xs text-muted-foreground line-clamp-2">{idea.notes}</p>}
                {idea.sourceUrl && (
                  <a href={idea.sourceUrl} target="_blank" rel="noopener" className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                    <ExternalLink className="h-3 w-3" />원본 보기
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={async () => {
                  const result = await analyzeMut.mutateAsync({ title: idea.title, sourceUrl: idea.sourceUrl, platform: idea.platform });
                  setAnalysis({ ...result, ideaTitle: idea.title });
                }} disabled={analyzeMut.isPending}>
                  {analyzeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: idea.id })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {ideas.length === 0 && !isLoading && <p className="text-sm text-muted-foreground text-center py-8">아직 수집한 아이디어가 없습니다. 잘 터진 병원 콘텐츠를 스크랩해보세요!</p>}
      </div>

      {analysis && (
        <Dialog open={!!analysis} onOpenChange={() => setAnalysis(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>AI 분석: {analysis.ideaTitle}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">성공 이유:</span> <p className="text-muted-foreground mt-1">{analysis.whyItWorks}</p></div>
              <div><span className="font-medium">병원 적용 방법:</span> <p className="text-muted-foreground mt-1">{analysis.hospitalAdaptation}</p></div>
              <div><span className="font-medium">추천 훅:</span> <p className="text-muted-foreground mt-1">{analysis.suggestedHook}</p></div>
              <div><span className="font-medium">추천 해시태그:</span> <p className="text-muted-foreground mt-1">{analysis.suggestedHashtags}</p></div>
              <div><span className="font-medium">제작 난이도:</span> <Badge variant="outline">{analysis.difficulty}</Badge></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── 3단계: 훅 라이브러리 ──
function HooksTab() {
  const { data: hooks = [] } = trpc.contentFactory.listHooks.useQuery();
  const utils = trpc.useUtils();
  const addMut = trpc.contentFactory.addHook.useMutation({ onSuccess: () => { toast.success("훅 추가 완료"); utils.contentFactory.listHooks.invalidate(); } });
  const deleteMut = trpc.contentFactory.deleteHook.useMutation({ onSuccess: () => { utils.contentFactory.listHooks.invalidate(); } });
  const generateMut = trpc.contentFactory.generateHooks.useMutation();
  const [newHook, setNewHook] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genResult, setGenResult] = useState<any>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold text-lg">훅 라이브러리</h3>
        <Badge variant="secondary">{hooks.length}개</Badge>
      </div>
      <p className="text-sm text-muted-foreground">3초 안에 시청자를 사로잡는 첫 문장/장면을 모아두세요.</p>

      <div className="flex gap-2">
        <Input placeholder="새 훅 입력 (예: '주사 무서운 분? 실제로는 이렇습니다')" value={newHook} onChange={e => setNewHook(e.target.value)} className="flex-1" />
        <Button size="sm" onClick={() => { if (newHook) { addMut.mutate({ hookText: newHook }); setNewHook(""); } }} disabled={!newHook}>추가</Button>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex gap-2 items-center">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <Input placeholder="AI로 훅 생성 (주제 입력: 코성형, 보톡스 등)" value={genTopic} onChange={e => setGenTopic(e.target.value)} className="flex-1" />
            <Button size="sm" variant="secondary" onClick={async () => {
              if (!genTopic) return;
              const result = await generateMut.mutateAsync({ topic: genTopic, count: 5 });
              setGenResult(result);
            }} disabled={!genTopic || generateMut.isPending}>
              {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "AI 생성"}
            </Button>
          </div>
          {genResult?.hooks?.length > 0 && (
            <div className="mt-3 space-y-2">
              {genResult.hooks.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-background rounded-md p-2 text-sm">
                  <div>
                    <span className="font-medium">"{h.hookText}"</span>
                    <span className="text-xs text-muted-foreground ml-2">({h.hookType})</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { addMut.mutate({ hookText: h.hookText, hookType: h.hookType }); }}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {hooks.map((hook: any) => (
          <div key={hook.id} className="flex items-center justify-between bg-muted/20 rounded-md p-3">
            <div className="flex-1">
              <span className="text-sm font-medium">"{hook.hookText}"</span>
              {hook.hookType && <Badge variant="outline" className="ml-2 text-xs">{hook.hookType}</Badge>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(hook.hookText); toast.success("복사 완료"); }}><Copy className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: hook.id })}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4단계: 대본 작성 ──
function ScriptsTab() {
  const { data: scripts = [] } = trpc.contentFactory.listScripts.useQuery();
  const utils = trpc.useUtils();
  const generateMut = trpc.contentFactory.generateScript.useMutation({
    onSuccess: () => { toast.success("대본 생성 완료"); utils.contentFactory.listScripts.invalidate(); setShowGen(false); },
  });
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ topic: "", hookText: "", platform: "instagram", scriptType: "정보 전달", duration: "60초" });
  const [selectedScript, setSelectedScript] = useState<any>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-lg">대본 작성</h3>
          <Badge variant="secondary">{scripts.length}개</Badge>
        </div>
        <Button size="sm" onClick={() => setShowGen(true)}><Sparkles className="h-4 w-4 mr-1" />AI 대본 생성</Button>
      </div>

      {showGen && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="영상 주제 (예: 코성형 공포증 해소)" value={genForm.topic} onChange={e => setGenForm(p => ({ ...p, topic: e.target.value }))} />
            <Input placeholder="훅 (선택 - 비워두면 AI가 생성)" value={genForm.hookText} onChange={e => setGenForm(p => ({ ...p, hookText: e.target.value }))} />
            <div className="grid grid-cols-3 gap-3">
              <Select value={genForm.platform} onValueChange={v => setGenForm(p => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">인스타그램 릴스</SelectItem>
                  <SelectItem value="youtube_shorts">유튜브 쇼츠</SelectItem>
                  <SelectItem value="tiktok">틱톡</SelectItem>
                  <SelectItem value="youtube">유튜브 (긴 영상)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genForm.scriptType} onValueChange={v => setGenForm(p => ({ ...p, scriptType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="정보 전달">정보 전달</SelectItem>
                  <SelectItem value="공포증 해소">공포증 해소</SelectItem>
                  <SelectItem value="전후 변신">전후 변신</SelectItem>
                  <SelectItem value="원장님 직접 설명">원장님 직접 설명</SelectItem>
                  <SelectItem value="비하인드">비하인드</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genForm.duration} onValueChange={v => setGenForm(p => ({ ...p, duration: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30초">30초</SelectItem>
                  <SelectItem value="60초">60초</SelectItem>
                  <SelectItem value="90초">90초</SelectItem>
                  <SelectItem value="3분">3분</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => generateMut.mutate(genForm)} disabled={!genForm.topic || generateMut.isPending}>
                {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}대본 생성
              </Button>
              <Button variant="outline" onClick={() => setShowGen(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {scripts.map((s: any) => (
          <Card key={s.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedScript(s)}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{s.title}</span>
                  <div className="flex gap-2 mt-1">
                    {s.platform && <Badge variant="outline" className="text-xs">{s.platform}</Badge>}
                    {s.duration && <Badge variant="secondary" className="text-xs">{s.duration}</Badge>}
                    {s.scriptType && <Badge variant="secondary" className="text-xs">{s.scriptType}</Badge>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedScript && (
        <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selectedScript.title}</DialogTitle></DialogHeader>
            <div className="space-y-4 text-sm">
              {selectedScript.hookSection && (
                <div><span className="font-semibold text-orange-600">훅 (0~3초)</span><pre className="mt-1 whitespace-pre-wrap bg-orange-50 dark:bg-orange-950/20 rounded p-3">{selectedScript.hookSection}</pre></div>
              )}
              {selectedScript.bodySection && (
                <div><span className="font-semibold text-blue-600">본문 (3~45초)</span><pre className="mt-1 whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/20 rounded p-3">{selectedScript.bodySection}</pre></div>
              )}
              {selectedScript.ctaSection && (
                <div><span className="font-semibold text-green-600">CTA (45~60초)</span><pre className="mt-1 whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 rounded p-3">{selectedScript.ctaSection}</pre></div>
              )}
              {selectedScript.fullScript && (
                <div><span className="font-semibold">전체 대본</span><pre className="mt-1 whitespace-pre-wrap bg-muted/30 rounded p-3">{selectedScript.fullScript}</pre></div>
              )}
              {selectedScript.hashtags && <div><span className="font-semibold">해시태그:</span> <span className="text-muted-foreground">{selectedScript.hashtags}</span></div>}
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(selectedScript.fullScript || ""); toast.success("대본 복사 완료"); }}>
                <Copy className="h-4 w-4 mr-1" />대본 복사
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── 5단계: 콘텐츠 달력 ──
function CalendarTab() {
  const { data: items = [] } = trpc.contentFactory.listCalendar.useQuery();
  const utils = trpc.useUtils();
  const addMut = trpc.contentFactory.addCalendarItem.useMutation({ onSuccess: () => { toast.success("일정 추가 완료"); utils.contentFactory.listCalendar.invalidate(); setShowAdd(false); } });
  const updateMut = trpc.contentFactory.updateCalendarItem.useMutation({ onSuccess: () => { utils.contentFactory.listCalendar.invalidate(); } });
  const deleteMut = trpc.contentFactory.deleteCalendarItem.useMutation({ onSuccess: () => { utils.contentFactory.listCalendar.invalidate(); } });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", platform: "instagram", scheduledDate: "", scheduledTime: "", notes: "" });

  const statusColors: Record<string, string> = {
    planned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold text-lg">콘텐츠 달력</h3>
          <Badge variant="secondary">{items.length}개</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />일정 추가</Button>
      </div>

      {showAdd && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="콘텐츠 제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <div className="grid grid-cols-3 gap-3">
              <Select value={form.platform} onValueChange={v => setForm(p => ({ ...p, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">인스타그램</SelectItem>
                  <SelectItem value="youtube">유튜브</SelectItem>
                  <SelectItem value="blog">블로그</SelectItem>
                  <SelectItem value="kakao">카카오</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
              <Input type="time" value={form.scheduledTime} onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMut.mutate(form)} disabled={!form.title || !form.scheduledDate}>저장</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((item: any) => (
          <Card key={item.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[50px]">
                  <div className="text-xs text-muted-foreground">{new Date(item.scheduledDate).toLocaleDateString("ko-KR", { month: "short" })}</div>
                  <div className="text-lg font-bold">{new Date(item.scheduledDate).getDate()}</div>
                </div>
                <div>
                  <span className="font-medium text-sm">{item.title}</span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status] || statusColors.planned}`}>{item.status === "planned" ? "예정" : item.status === "published" ? "발행완료" : item.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {item.status === "planned" && (
                  <Button size="sm" variant="ghost" onClick={() => updateMut.mutate({ id: item.id, status: "published" })}>발행완료</Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: item.id })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">콘텐츠 일정을 추가하여 발행 계획을 관리하세요.</p>}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function ContentFactory() {
  return (
    <RequireHospital featureName="콘텐츠 공장">
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">콘텐츠 공장</h2>
        <p className="text-muted-foreground mt-1">5단계 시스템으로 병원 마케팅 콘텐츠를 체계적으로 생산하세요.</p>
      </div>

      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="style" className="text-xs sm:text-sm"><Palette className="h-4 w-4 mr-1 hidden sm:inline" />스타일</TabsTrigger>
          <TabsTrigger value="ideas" className="text-xs sm:text-sm"><Lightbulb className="h-4 w-4 mr-1 hidden sm:inline" />아이디어</TabsTrigger>
          <TabsTrigger value="hooks" className="text-xs sm:text-sm"><Zap className="h-4 w-4 mr-1 hidden sm:inline" />훅</TabsTrigger>
          <TabsTrigger value="scripts" className="text-xs sm:text-sm"><FileText className="h-4 w-4 mr-1 hidden sm:inline" />대본</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm"><Calendar className="h-4 w-4 mr-1 hidden sm:inline" />달력</TabsTrigger>
        </TabsList>
        <TabsContent value="style"><StyleGuideTab /></TabsContent>
        <TabsContent value="ideas"><IdeasTab /></TabsContent>
        <TabsContent value="hooks"><HooksTab /></TabsContent>
        <TabsContent value="scripts"><ScriptsTab /></TabsContent>
        <TabsContent value="calendar"><CalendarTab /></TabsContent>
      </Tabs>
    </div>
    </RequireHospital>
  );
}

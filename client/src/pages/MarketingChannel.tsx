import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Megaphone, Copy, Trash2, Sparkles, FileText, Instagram, MessageCircle, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const channelIcons: Record<string, any> = {
  blog: FileText,
  instagram: Instagram,
  kakao: MessageCircle,
  google_business: Globe,
};
const channelLabels: Record<string, string> = {
  blog: "네이버 블로그",
  instagram: "인스타그램",
  kakao: "카카오톡",
  google_business: "구글 비즈니스",
};

export default function MarketingChannel() {
  const [form, setForm] = useState({ title: "", content: "", channels: ["blog", "instagram"] as string[], treatmentPageId: undefined as number | undefined });
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["blog", "instagram"]);

  const contents = trpc.marketingChannel.list.useQuery({});
  const generateMut = trpc.marketingChannel.generateOsmu.useMutation({
    onSuccess: (data: any) => {
      contents.refetch();
      toast.success(`${data.length}개 채널 콘텐츠가 생성되었습니다`);
    },
    onError: (e: any) => toast.error("생성 실패: " + e.message),
  });
  const updateStatusMut = trpc.marketingChannel.update.useMutation({ onSuccess: () => { contents.refetch(); toast.success("상태 업데이트 완료"); },
  onError: (err) => toast.error(err.message) });
  const deleteMut = trpc.marketingChannel.delete.useMutation({ onSuccess: () => { contents.refetch(); toast.success("삭제 완료"); },
  onError: (err) => toast.error(err.message) });

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleGenerate = () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error("제목과 내용을 입력해주세요"); return; }
    if (selectedChannels.length === 0) { toast.error("최소 1개 채널을 선택해주세요"); return; }
    generateMut.mutate({ title: form.title, content: form.content, channels: selectedChannels as any, treatmentPageId: form.treatmentPageId });
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6" /> OSMU 콘텐츠 관리</h1>
        <p className="text-muted-foreground mt-1">하나의 콘텐츠를 여러 마케팅 채널에 맞게 자동 변환합니다 (One Source Multi Use)</p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1"><Sparkles className="w-4 h-4" /> AI 콘텐츠 생성</TabsTrigger>
          <TabsTrigger value="library" className="gap-1"><FileText className="w-4 h-4" /> 콘텐츠 라이브러리</TabsTrigger>
        </TabsList>

        {/* AI 콘텐츠 생성 탭 */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>원본 콘텐츠 입력</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">제목</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="예: 쥬베룩 시술 안내" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">원본 콘텐츠</label>
                <Textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="시술 설명, 효과, 주의사항 등 원본 콘텐츠를 입력하세요..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">변환할 채널 선택</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(channelLabels).map(([key, label]) => {
                    const Icon = channelIcons[key] || Globe;
                    const isSelected = selectedChannels.includes(key);
                    return (
                      <Button key={key} variant={isSelected ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => toggleChannel(key)}>
                        <Icon className="w-4 h-4" /> {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generateMut.isPending} className="gap-2">
                {generateMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> AI 변환 중...</> : <><Sparkles className="w-4 h-4" /> OSMU 콘텐츠 생성</>}
              </Button>
            </CardContent>
          </Card>

          {/* 생성 결과 미리보기 */}
          {generateMut.data && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">생성 결과</h3>
              {generateMut.data.map((item: any, i: number) => {
                const Icon = channelIcons[item.channel] || Globe;
                return (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="gap-1"><Icon className="w-3 h-3" /> {channelLabels[item.channel] || item.channel}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => copyContent(item.preview)} className="gap-1"><Copy className="w-3 h-3" /> 복사</Button>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.preview}...</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 콘텐츠 라이브러리 탭 */}
        <TabsContent value="library" className="space-y-4">
          {contents.data?.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">아직 생성된 콘텐츠가 없습니다</p>
            </Card>
          )}
          {contents.data?.map((item: any) => {
            const Icon = channelIcons[item.channel] || Globe;
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="gap-1"><Icon className="w-3 h-3" /> {channelLabels[item.channel] || item.channel}</Badge>
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={item.status} onValueChange={v => updateStatusMut.mutate({ id: item.id, data: { status: v as any } })}>
                        <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">초안</SelectItem>
                          <SelectItem value="scheduled">예약</SelectItem>
                          <SelectItem value="published">발행</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => copyContent(item.content)} className="h-7"><Copy className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: item.id }); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(item.createdAt).toLocaleString("ko-KR")}</p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

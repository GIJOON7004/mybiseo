import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Copy, RefreshCw, Sparkles, Play, Eye, FileDown, Subtitles, FileVideo } from "lucide-react";
import { triggerDownload } from "./utils";

export default function ShortformResults({
  data,
  videoId,
  onRegenerate,
  isRegenerating,
}: {
  data: any;
  videoId: number;
  onRegenerate: (instruction?: string) => void;
  isRegenerating: boolean;
}) {
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [generatingSubtitle, setGeneratingSubtitle] = useState<string | null>(null);
  const [generatingAllSubtitles, setGeneratingAllSubtitles] = useState(false);
  const [subtitlePreview, setSubtitlePreview] = useState<{ index: number; content: string; format: string } | null>(null);

  // 개별 자막 생성
  const generateSubtitleMut = trpc.interviewContent.generateSubtitle.useMutation({ onSuccess: (result, variables) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success(`${result.cueCount}개 자막이 생성되었습니다 (${variables.format.toUpperCase()})`);
      setSubtitlePreview({ index: variables.shortformIndex, content: result.content, format: variables.format });
      setGeneratingSubtitle(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingSubtitle(null);
    },
  });

  // 전체 자막 일괄 생성
  const generateAllSubtitlesMut = trpc.interviewContent.generateAllSubtitles.useMutation({ onSuccess: (result) => {
      result.results.forEach((r: any) => {
        triggerDownload(r.downloadUrl, r.fileName);
      });
      toast.success(`${result.generated}/${result.total}개 자막 파일이 생성되었습니다`);
      setGeneratingAllSubtitles(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingAllSubtitles(false);
    },
  });

  const scripts = data?.shortforms || [];
  if (!scripts.length) return <EmptyContentState type="숏폼 스크립트" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm text-muted-foreground">숏폼 스크립트 {scripts.length}개</h3>
        <div className="flex items-center gap-2">
          {/* 전체 자막 일괄 생성 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGeneratingAllSubtitles(true);
              generateAllSubtitlesMut.mutate({ id: videoId, format: "srt" });
            }}
            disabled={generatingAllSubtitles}
            className="gap-1.5"
          >
            {generatingAllSubtitles ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Subtitles className="w-3.5 h-3.5" />
            )}
            {generatingAllSubtitles ? "자막 생성 중..." : "전체 SRT 자막 생성"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGeneratingAllSubtitles(true);
              generateAllSubtitlesMut.mutate({ id: videoId, format: "vtt" });
            }}
            disabled={generatingAllSubtitles}
            className="gap-1.5"
          >
            {generatingAllSubtitles ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileVideo className="w-3.5 h-3.5" />
            )}
            {generatingAllSubtitles ? "자막 생성 중..." : "전체 VTT 자막 생성"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRegenDialog(true)}
            disabled={isRegenerating}
            className="gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            재생성
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {scripts.map((script: any, i: number) => {
          const isSrtGenerating = generatingSubtitle === `${i}-srt`;
          const isVttGenerating = generatingSubtitle === `${i}-vtt`;
          const showPreview = subtitlePreview?.index === i;

          return (
            <Card
              key={i}
              className={`cursor-pointer transition-colors ${selectedScript === i ? "border-primary" : "hover:border-primary/40"}`}
              onClick={() => setSelectedScript(selectedScript === i ? null : i)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Play className="w-3 h-3" />
                        {script.duration}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{script.platform}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm">{script.title}</h4>
                    <p className="text-xs text-primary font-medium mt-1">후크: "{script.hook}"</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(script.script);
                        toast.success("스크립트가 복사되었습니다");
                      }}
                      className="gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {selectedScript === i && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">전체 스크립트</p>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                        {script.script}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">영상 연출</p>
                        <p className="text-xs">{script.visualDirection}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">배경음악</p>
                        <p className="text-xs">{script.bgmSuggestion}</p>
                      </div>
                    </div>

                    {/* 자막 생성 버튼 */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Subtitles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">영상 자막 생성</span>
                          <Badge variant="outline" className="text-[10px]">Netflix 표준 12~15 CPS</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGeneratingSubtitle(`${i}-srt`);
                              generateSubtitleMut.mutate({ id: videoId, shortformIndex: i, format: "srt" });
                            }}
                            disabled={isSrtGenerating}
                            className="gap-1 text-xs"
                          >
                            {isSrtGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileDown className="w-3 h-3" />
                            )}
                            SRT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGeneratingSubtitle(`${i}-vtt`);
                              generateSubtitleMut.mutate({ id: videoId, shortformIndex: i, format: "vtt" });
                            }}
                            disabled={isVttGenerating}
                            className="gap-1 text-xs"
                          >
                            {isVttGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileDown className="w-3 h-3" />
                            )}
                            VTT
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 자막 미리보기 */}
                    {showPreview && subtitlePreview.content && (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            자막 미리보기 ({subtitlePreview.format.toUpperCase()})
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(subtitlePreview.content);
                              toast.success("자막 내용이 복사되었습니다");
                            }}
                            className="gap-1 text-xs h-6"
                          >
                            <Copy className="w-3 h-3" />
                            복사
                          </Button>
                        </div>
                        <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-muted-foreground">
                          {subtitlePreview.content}
                        </pre>
                      </div>
                    )}

                    {script.hashtags && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">해시태그</p>
                        <p className="text-xs">{script.hashtags}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(script.hashtags);
                            toast.success("해시태그가 복사되었습니다");
                          }}
                          className="mt-1 text-xs gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          해시태그 복사
                        </Button>
                      </div>
                    )}
                    {script.trendReference && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">참고 트렌드</p>
                        <p className="text-xs">{script.trendReference}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 재생성 다이얼로그 */}
      <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>숏폼 스크립트 재생성</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="추가 지시사항 (선택사항): 예) 더 짧고 임팩트 있게 만들어주세요"
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={() => {
              onRegenerate(regenInstruction || undefined);
              setShowRegenDialog(false);
              setRegenInstruction("");
            }}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            재생성
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── 빈 콘텐츠 상태 ─── */
export function EmptyContentState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">아직 생성된 {type}가 없습니다.</p>
      <p className="text-sm text-muted-foreground mt-1">음성 추출 후 콘텐츠를 생성해주세요.</p>
    </div>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Video, FileText, Image, Film, Loader2, AlertCircle, Copy, Mic, Sparkles, Clock, ArrowLeft } from "lucide-react";
import { parseJsonSafe, formatDuration, statusMap } from "./utils";

import { lazy } from "react";
const BlogResults = lazy(() => import("./BlogResults"));
const CardnewsResults = lazy(() => import("./CardnewsResults"));
const ShortformResults = lazy(() => import("./ShortformResults"));

export default function VideoDetail({ videoId, onBack }: { videoId: number; onBack: () => void }) {
  const { data: video, isLoading } = trpc.interviewContent.getById.useQuery({ id: videoId });
  const utils = trpc.useUtils();

  const transcribeMut = trpc.interviewContent.transcribe.useMutation({ onSuccess: () => {
      toast.success("음성 추출이 완료되었습니다!");
      utils.interviewContent.getById.invalidate({ id: videoId});
    },
    onError: (err) => toast.error(err.message),
  });

  const generateMut = trpc.interviewContent.generateContents.useMutation({ onSuccess: () => {
      toast.success("콘텐츠가 생성되었습니다!");
      utils.interviewContent.getById.invalidate({ id: videoId});
    },
    onError: (err) => toast.error(err.message),
  });

  const regenerateMut = trpc.interviewContent.regenerateContent.useMutation({ onSuccess: () => {
      toast.success("콘텐츠가 재생성되었습니다!");
      utils.interviewContent.getById.invalidate({ id: videoId});
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !video) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const st = statusMap[video.status] || statusMap.uploading;
  const parsed = {
    blogs: parseJsonSafe(video.blogContents),
    cardnews: parseJsonSafe(video.cardnewsContents),
    shortforms: parseJsonSafe(video.shortformContents),
  };

  return (
    <div className="space-y-6">
      {/* 상단 네비 */}
      <Button variant="ghost" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Button>

      {/* 영상 정보 카드 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold">{video.fileName || `인터뷰 #${video.id}`}</h2>
                <Badge variant="outline" className={`text-xs ${st.color} border-0`}>
                  {st.icon}
                  <span className="ml-1">{st.label}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {video.doctorName && <span>{video.doctorName}</span>}
                {video.hospitalName && <span>{video.hospitalName}</span>}
                {video.topicKeyword && <Badge variant="secondary" className="text-xs">{video.topicKeyword}</Badge>}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(video.durationSec)}
                </span>
              </div>
            </div>
          </div>

          {video.errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {video.errorMessage}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-3 mt-6 ml-11">
            {(video.status === "uploading" || video.status === "error") && (
              <Button
                onClick={() => transcribeMut.mutate({ id: videoId })}
                disabled={transcribeMut.isPending}
                className="gap-2"
              >
                {transcribeMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {transcribeMut.isPending ? "음성 추출 중..." : "1단계: 음성 추출"}
              </Button>
            )}

            {(video.status === "transcribed" || video.status === "completed") && (
              <Button
                onClick={() => generateMut.mutate({ id: videoId })}
                disabled={generateMut.isPending}
                className="gap-2"
                variant={video.status === "completed" ? "outline" : "default"}
              >
                {generateMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generateMut.isPending
                  ? "콘텐츠 생성 중..."
                  : video.status === "completed"
                    ? "전체 재생성"
                    : "2단계: 콘텐츠 생성"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 트랜스크립트 */}
      {video.transcript && (
        <TranscriptCard transcript={video.transcript} videoId={videoId} />
      )}

      {/* 생성된 콘텐츠 탭 */}
      {video.status === "completed" && (
        <Tabs defaultValue="blog" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blog" className="gap-1.5">
              <FileText className="w-4 h-4" />
              블로그 ({parsed.blogs?.blogs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="cardnews" className="gap-1.5">
              <Image className="w-4 h-4" />
              카드뉴스 ({parsed.cardnews?.cardnews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="shortform" className="gap-1.5">
              <Film className="w-4 h-4" />
              숏폼 ({parsed.shortforms?.shortforms?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog" className="mt-4">
            <BlogResults
              data={parsed.blogs}
              videoId={videoId}
              onRegenerate={(instruction) => {
                regenerateMut.mutate({
                  id: videoId,
                  contentType: "blog",
                  additionalInstruction: instruction,
                });
              }}
              isRegenerating={regenerateMut.isPending}
            />
          </TabsContent>

          <TabsContent value="cardnews" className="mt-4">
            <CardnewsResults
              data={parsed.cardnews}
              videoId={videoId}
              onRegenerate={(instruction) => {
                regenerateMut.mutate({
                  id: videoId,
                  contentType: "cardnews",
                  additionalInstruction: instruction,
                });
              }}
              isRegenerating={regenerateMut.isPending}
            />
          </TabsContent>

          <TabsContent value="shortform" className="mt-4">
            <ShortformResults
              data={parsed.shortforms}
              videoId={videoId}
              onRegenerate={(instruction) => {
                regenerateMut.mutate({
                  id: videoId,
                  contentType: "shortform",
                  additionalInstruction: instruction,
                });
              }}
              isRegenerating={regenerateMut.isPending}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ─── 트랜스크립트 카드 ─── */
function TranscriptCard({ transcript, videoId }: { transcript: string; videoId: number }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(transcript);
  const updateMut = trpc.interviewContent.updateTranscript.useMutation({ onSuccess: () => { toast.success("트랜스크립트가 수정되었습니다"); setEditing(false); },
  onError: (err) => toast.error(err.message) });
  const utils = trpc.useUtils();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            트랜스크립트
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(transcript);
                toast.success("복사되었습니다");
              }}
              className="gap-1 text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              복사
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editing) {
                  updateMut.mutate({ id: videoId, transcript: editText });
                  utils.interviewContent.getById.invalidate({ id: videoId });
                } else {
                  setEditText(transcript);
                  setEditing(true);
                }
              }}
              className="gap-1 text-xs"
            >
              {editing ? "저장" : "수정"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[200px] text-sm"
          />
        ) : (
          <div className={`text-sm text-muted-foreground whitespace-pre-wrap ${!expanded ? "max-h-32 overflow-hidden relative" : ""}`}>
            {transcript}
            {!expanded && transcript.length > 300 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
            )}
          </div>
        )}
        {!editing && transcript.length > 300 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="mt-2 text-xs">
            {expanded ? "접기" : "전체 보기"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


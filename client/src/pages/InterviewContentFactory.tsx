import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload, Video, FileText, Image, Film, Loader2, CheckCircle2, AlertCircle,
  Copy, RefreshCw, Trash2, ChevronRight, Mic, Sparkles, Clock, ArrowLeft,
  Play, Hash, Eye, Download, Send, ImagePlus, ExternalLink, Archive,
  FileDown, Subtitles, FileVideo, Type, Palette,
} from "lucide-react";
import RequireHospital from "@/components/RequireHospital";

/* ─── 유틸 ─── */
function parseJsonSafe(text: string | null | undefined) {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatDuration(sec: number | null | undefined) {
  if (!sec) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s}초`;
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  uploading: { label: "업로드 중", color: "bg-blue-500/10 text-blue-600", icon: <Upload className="w-3.5 h-3.5" /> },
  transcribing: { label: "음성 추출 중", color: "bg-yellow-500/10 text-yellow-600", icon: <Mic className="w-3.5 h-3.5 animate-pulse" /> },
  transcribed: { label: "음성 추출 완료", color: "bg-emerald-500/10 text-emerald-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  generating: { label: "콘텐츠 생성 중", color: "bg-purple-500/10 text-purple-600", icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" /> },
  completed: { label: "완료", color: "bg-green-500/10 text-green-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  error: { label: "오류", color: "bg-red-500/10 text-red-600", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

/* ─── 메인 컴포넌트 ─── */
export default function InterviewContentFactory() {
  return (
    <RequireHospital featureName="AI 콘텐츠 공장">
      <InterviewContentFactoryInner />
    </RequireHospital>
  );
}

function InterviewContentFactoryInner() {
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: videos, isLoading } = trpc.interviewContent.list.useQuery();
  const utils = trpc.useUtils();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Video className="w-7 h-7 text-primary" />
              인터뷰 콘텐츠 팩토리
            </h1>
            <p className="text-muted-foreground mt-1">
              원장님 인터뷰 영상 1개 → 블로그 3개 + 카드뉴스 5개 + 숏폼 스크립트 5개
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            영상 업로드
          </Button>
        </div>

        {/* 영상 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !videos?.length ? (
          <EmptyState onUpload={() => setShowUploadDialog(true)} />
        ) : selectedVideoId ? (
          <VideoDetail
            videoId={selectedVideoId}
            onBack={() => setSelectedVideoId(null)}
          />
        ) : (
          <VideoList
            videos={videos}
            onSelect={setSelectedVideoId}
            onRefresh={() => utils.interviewContent.list.invalidate()}
          />
        )}

        {/* 업로드 다이얼로그 */}
        <UploadDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSuccess={(id) => {
            setShowUploadDialog(false);
            setSelectedVideoId(id);
            utils.interviewContent.list.invalidate();
          }}
        />
      </div>
    </div>
  );
}

/* ─── 빈 상태 ─── */
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Video className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">아직 업로드된 영상이 없습니다</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        원장님 인터뷰 영상을 업로드하면 AI가 고품질 블로그 3개, 인스타 카드뉴스 5개, 숏폼 스크립트 5개를 자동으로 생성합니다.
      </p>
      <Button onClick={onUpload} size="lg" className="gap-2">
        <Upload className="w-5 h-5" />
        첫 영상 업로드하기
      </Button>
    </div>
  );
}

/* ─── 영상 목록 ─── */
function VideoList({
  videos,
  onSelect,
  onRefresh,
}: {
  videos: any[];
  onSelect: (id: number) => void;
  onRefresh: () => void;
}) {
  const deleteMut = trpc.interviewContent.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다"); onRefresh(); },
  });

  return (
    <div className="grid gap-4">
      {videos.map((v: any) => {
        const st = statusMap[v.status] || statusMap.uploading;
        const parsed = {
          blogs: parseJsonSafe(v.blogContents),
          cardnews: parseJsonSafe(v.cardnewsContents),
          shortforms: parseJsonSafe(v.shortformContents),
        };
        const blogCount = parsed.blogs?.blogs?.length || 0;
        const cardnewsCount = parsed.cardnews?.cardnews?.length || 0;
        const shortformCount = parsed.shortforms?.shortforms?.length || 0;

        return (
          <Card
            key={v.id}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onSelect(v.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {v.fileName || `인터뷰 #${v.id}`}
                    </h3>
                    <Badge variant="outline" className={`text-xs ${st.color} border-0`}>
                      {st.icon}
                      <span className="ml-1">{st.label}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {v.doctorName && <span>{v.doctorName}</span>}
                    {v.hospitalName && <span>{v.hospitalName}</span>}
                    {v.topicKeyword && <Badge variant="secondary" className="text-xs">{v.topicKeyword}</Badge>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(v.durationSec)}
                    </span>
                    <span>{formatFileSize(v.fileSizeBytes)}</span>
                  </div>
                  {v.status === "completed" && (
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="w-3 h-3" /> 블로그 {blogCount}개
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Image className="w-3 h-3" /> 카드뉴스 {cardnewsCount}세트
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Film className="w-3 h-3" /> 숏폼 {shortformCount}개
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("이 영상과 생성된 콘텐츠를 삭제하시겠습니까?")) {
                        deleteMut.mutate({ id: v.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── 업로드 다이얼로그 ─── */
function UploadDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [topicKeyword, setTopicKeyword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMut = trpc.interviewContent.upload.useMutation();

  const handleUpload = useCallback(async () => {
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("파일 크기가 16MB를 초과합니다. 더 작은 파일을 사용해주세요.");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      setProgress(30);

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `interview-videos/${Date.now()}-${randomSuffix}-${file.name}`;

      const forgeApiUrl = (import.meta as any).env?.VITE_FRONTEND_FORGE_API_URL || "";
      const forgeApiKey = (import.meta as any).env?.VITE_FRONTEND_FORGE_API_KEY || "";

      const uploadUrl = new URL("v1/storage/upload", forgeApiUrl.replace(/\/+$/, "") + "/");
      uploadUrl.searchParams.set("path", fileKey);

      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: file.type || "video/mp4" });
      const formData = new FormData();
      formData.append("file", blob, file.name);

      const uploadResponse = await fetch(uploadUrl.toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${forgeApiKey}` },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("S3 업로드 실패");
      const { url: videoUrl } = await uploadResponse.json();

      setProgress(70);

      const result = await uploadMut.mutateAsync({
        videoUrl,
        videoFileKey: fileKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        doctorName: doctorName || undefined,
        hospitalName: hospitalName || undefined,
        topicKeyword: topicKeyword || undefined,
      });

      setProgress(100);
      toast.success("영상이 업로드되었습니다!");
      onSuccess(result.id);
    } catch (e: any) {
      toast.error(e.message || "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [file, doctorName, hospitalName, topicKeyword, uploadMut, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            인터뷰 영상 업로드
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 파일 선택 */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,video/*,.mp3,.mp4,.wav,.webm,.m4a,.ogg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Video className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">영상 또는 음성 파일을 선택하세요</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MP3, WAV, WebM, M4A (최대 16MB)</p>
              </>
            )}
          </div>

          {/* 메타 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">원장님 이름</label>
              <Input
                placeholder="예: 김철수"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">병원명</label>
              <Input
                placeholder="예: 에디션성형외과"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">주제/시술 키워드</label>
            <Input
              placeholder="예: 코성형, 눈성형, 리프팅"
              value={topicKeyword}
              onChange={(e) => setTopicKeyword(e.target.value)}
            />
          </div>

          {/* 업로드 버튼 */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                업로드 중... ({progress}%)
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                업로드
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 영상 상세 ─── */
function VideoDetail({ videoId, onBack }: { videoId: number; onBack: () => void }) {
  const { data: video, isLoading } = trpc.interviewContent.getById.useQuery({ id: videoId });
  const utils = trpc.useUtils();

  const transcribeMut = trpc.interviewContent.transcribe.useMutation({
    onSuccess: () => {
      toast.success("음성 추출이 완료되었습니다!");
      utils.interviewContent.getById.invalidate({ id: videoId });
    },
    onError: (err) => toast.error(err.message),
  });

  const generateMut = trpc.interviewContent.generateContents.useMutation({
    onSuccess: () => {
      toast.success("콘텐츠가 생성되었습니다!");
      utils.interviewContent.getById.invalidate({ id: videoId });
    },
    onError: (err) => toast.error(err.message),
  });

  const regenerateMut = trpc.interviewContent.regenerateContent.useMutation({
    onSuccess: () => {
      toast.success("콘텐츠가 재생성되었습니다!");
      utils.interviewContent.getById.invalidate({ id: videoId });
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
  const updateMut = trpc.interviewContent.updateTranscript.useMutation({
    onSuccess: () => { toast.success("트랜스크립트가 수정되었습니다"); setEditing(false); },
  });
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

/* ─── 블로그 결과 (발행 기능 포함) ─── */
function BlogResults({
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
  const [selectedBlog, setSelectedBlog] = useState<number>(0);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishBlogIndex, setPublishBlogIndex] = useState<number>(0);
  const [publishCategoryId, setPublishCategoryId] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");

  const { data: categories } = trpc.interviewContent.getBlogCategories.useQuery();
  const publishMut = trpc.interviewContent.publishToBlog.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.status === "published"
          ? `"${result.title}" 블로그가 발행되었습니다!`
          : `"${result.title}" 블로그가 임시저장되었습니다.`
      );
      setShowPublishDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const blogs = data?.blogs || [];
  if (!blogs.length) return <EmptyContentState type="블로그" />;

  const blog = blogs[selectedBlog];

  return (
    <div className="space-y-4">
      {/* 블로그 선택 탭 */}
      <div className="flex items-center gap-2 flex-wrap">
        {blogs.map((b: any, i: number) => (
          <Button
            key={i}
            variant={selectedBlog === i ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBlog(i)}
            className="gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            {i + 1}번 ({b.angle || `관점 ${i + 1}`})
          </Button>
        ))}
        <div className="flex-1" />
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

      {/* 블로그 내용 */}
      {blog && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold">{blog.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{blog.excerpt}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const full = `# ${blog.title}\n\n${blog.content}`;
                    navigator.clipboard.writeText(full);
                    toast.success("블로그 전체 내용이 복사되었습니다");
                  }}
                  className="gap-1"
                >
                  <Copy className="w-4 h-4" />
                  복사
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setPublishBlogIndex(selectedBlog);
                    setShowPublishDialog(true);
                  }}
                  className="gap-1"
                >
                  <Send className="w-4 h-4" />
                  블로그 발행
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {blog.tags?.split(",").map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  <Hash className="w-3 h-3 mr-0.5" />
                  {tag.trim()}
                </Badge>
              ))}
              {blog.readingTime && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  {blog.readingTime}분 읽기
                </Badge>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground space-y-1 mb-3">
                <p><strong>검색 최적화 제목:</strong> {blog.metaTitle}</p>
                <p><strong>검색 최적화 설명:</strong> {blog.metaDescription}</p>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm">
                {blog.content}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 발행 다이얼로그 */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              블로그 발행
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">{blogs[publishBlogIndex]?.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{blogs[publishBlogIndex]?.excerpt}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <Select value={publishCategoryId} onValueChange={setPublishCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">발행 상태</label>
              <Select value={publishStatus} onValueChange={(v) => setPublishStatus(v as "draft" | "published")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">임시저장 (검토 후 발행)</SelectItem>
                  <SelectItem value="published">즉시 발행</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                if (!publishCategoryId) {
                  toast.error("카테고리를 선택해주세요");
                  return;
                }
                publishMut.mutate({
                  id: videoId,
                  blogIndex: publishBlogIndex,
                  categoryId: parseInt(publishCategoryId),
                  publishStatus,
                });
              }}
              disabled={publishMut.isPending || !publishCategoryId}
              className="w-full gap-2"
            >
              {publishMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {publishMut.isPending
                ? "발행 중..."
                : publishStatus === "published"
                  ? "즉시 발행"
                  : "임시저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 재생성 다이얼로그 */}
      <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>블로그 재생성</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="추가 지시사항 (선택사항): 예) 비용 관련 내용을 더 강조해주세요"
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

/* ─── 카드뉴스 결과 (이미지 생성 + 다운로드 포함) ─── */
function CardnewsResults({
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
  const [selectedSet, setSelectedSet] = useState<number>(0);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [downloadingSet, setDownloadingSet] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState<string | null>(null);
  const [overlayDialog, setOverlayDialog] = useState<{ setIndex: number; cardIndex: number; headline: string; bodyText: string } | null>(null);
  const [overlayStyle, setOverlayStyle] = useState({
    headlineColor: "#FFFFFF",
    headlineFontSize: 72,
    bodyColor: "#F0F0F0",
    bodyFontSize: 36,
    overlayOpacity: 0.4,
    position: "center" as "top" | "center" | "bottom",
  });
  const [generatingOverlay, setGeneratingOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // 텍스트 오버레이 뮤테이션
  const overlayMut = trpc.interviewContent.generateCardOverlay.useMutation({
    onSuccess: (result) => {
      toast.success("텍스트 오버레이 이미지가 생성되었습니다!");
      setGeneratingOverlay(false);
      setOverlayResult(result.overlayUrl);
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingOverlay(false);
    },
  });

  const generateCardImageMut = trpc.interviewContent.generateCardImage.useMutation({
    onSuccess: (result, variables) => {
      toast.success(`카드 ${variables.cardIndex + 1} 이미지가 생성되었습니다!`);
      setGeneratingImages((prev) => ({ ...prev, [`${variables.setIndex}-${variables.cardIndex}`]: false }));
      utils.interviewContent.getById.invalidate({ id: videoId });
    },
    onError: (err, variables) => {
      toast.error(err.message);
      setGeneratingImages((prev) => ({ ...prev, [`${variables.setIndex}-${variables.cardIndex}`]: false }));
    },
  });

  const generateSetImagesMut = trpc.interviewContent.generateCardSetImages.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.generated}/${result.total}개 이미지가 생성되었습니다!`);
      setGeneratingImages({});
      utils.interviewContent.getById.invalidate({ id: videoId });
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingImages({});
    },
  });

  // 개별 이미지 1080x1080 다운로드
  const optimizeCardMut = trpc.interviewContent.optimizeCardImage.useMutation({
    onSuccess: (result) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success("1080x1080 최적화 이미지가 다운로드됩니다");
      setDownloadingSingle(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setDownloadingSingle(null);
    },
  });

  // 세트 ZIP 다운로드
  const downloadSetZipMut = trpc.interviewContent.downloadCardSetZip.useMutation({
    onSuccess: (result) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success(`${result.imageCount}개 이미지 ZIP 다운로드가 시작됩니다`);
      setDownloadingSet(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setDownloadingSet(false);
    },
  });

  // 전체 ZIP 다운로드
  const downloadAllZipMut = trpc.interviewContent.downloadAllCardSetsZip.useMutation({
    onSuccess: (result) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success(`${result.setCount}세트 ${result.totalImages}개 이미지 ZIP 다운로드가 시작됩니다`);
      setDownloadingAll(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setDownloadingAll(false);
    },
  });

  const sets = data?.cardnews || [];
  if (!sets.length) return <EmptyContentState type="카드뉴스" />;

  const currentSet = sets[selectedSet];
  const hasAnyImages = (currentSet?.cards || []).some((c: any) => c.imageUrl);
  const hasAllImages = currentSet?.cards?.length > 0 && (currentSet?.cards || []).every((c: any) => c.imageUrl);

  const handleGenerateSingleImage = (setIndex: number, cardIndex: number) => {
    setGeneratingImages((prev) => ({ ...prev, [`${setIndex}-${cardIndex}`]: true }));
    generateCardImageMut.mutate({ id: videoId, setIndex, cardIndex });
  };

  const handleGenerateAllImages = (setIndex: number) => {
    const cards = sets[setIndex]?.cards || [];
    const allKeys: Record<string, boolean> = {};
    cards.forEach((_: any, i: number) => { allKeys[`${setIndex}-${i}`] = true; });
    setGeneratingImages((prev) => ({ ...prev, ...allKeys }));
    generateSetImagesMut.mutate({ id: videoId, setIndex });
  };

  return (
    <div className="space-y-4">
      {/* 세트 선택 */}
      <div className="flex items-center gap-2 flex-wrap">
        {sets.map((s: any, i: number) => (
          <Button
            key={i}
            variant={selectedSet === i ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSet(i)}
            className="gap-1"
          >
            <Image className="w-3.5 h-3.5" />
            {i + 1}번 ({s.concept || `컨셉 ${i + 1}`})
          </Button>
        ))}
        <div className="flex-1" />
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

      {/* 카드뉴스 세트 */}
      {currentSet && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{currentSet.setTitle}</CardTitle>
                  <CardDescription>{currentSet.concept}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAllImages(selectedSet)}
                    disabled={generateSetImagesMut.isPending}
                    className="gap-1"
                  >
                    {generateSetImagesMut.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-3.5 h-3.5" />
                    )}
                    {generateSetImagesMut.isPending ? "생성 중..." : "전체 이미지 생성"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = currentSet.cards.map((c: any) =>
                        `[슬라이드 ${c.slideNumber}]\n${c.headline}\n${c.bodyText}\n디자인: ${c.designNote}`
                      ).join("\n\n");
                      navigator.clipboard.writeText(text);
                      toast.success("카드뉴스 내용이 복사되었습니다");
                    }}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    전체 복사
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">{currentSet.targetAudience}</Badge>
                {currentSet.bestPostingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {currentSet.bestPostingTime}
                  </span>
                )}
              </div>

              {/* 카드 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentSet.cards?.map((card: any, i: number) => {
                  const isGenerating = generatingImages[`${selectedSet}-${i}`];
                  const hasImage = !!card.imageUrl;
                  const isDownloading = downloadingSingle === `${selectedSet}-${i}`;

                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-xl border overflow-hidden relative group"
                    >
                      {/* 배경: 이미지가 있으면 이미지, 없으면 그라데이션 */}
                      {hasImage ? (
                        <img
                          src={card.imageUrl}
                          alt={card.headline}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10" />
                      )}

                      {/* 오버레이 콘텐츠 */}
                      <div className={`absolute inset-0 flex flex-col justify-between p-4 ${hasImage ? "bg-black/40" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div className="w-6 h-6 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-primary">
                            {card.slideNumber}
                          </div>
                          <div className="flex items-center gap-1">
                            {/* 텍스트 오버레이 버튼 */}
                            {hasImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOverlayDialog({ setIndex: selectedSet, cardIndex: i, headline: card.headline, bodyText: card.bodyText || "" });
                                  setOverlayResult(null);
                                }}
                                title="텍스트 오버레이 합성"
                              >
                                <Type className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {/* 이미지 다운로드 버튼 (1080x1080) */}
                            {hasImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${hasImage ? "text-white hover:bg-white/20" : "text-primary hover:bg-primary/10"}`}
                                onClick={() => {
                                  setDownloadingSingle(`${selectedSet}-${i}`);
                                  optimizeCardMut.mutate({ id: videoId, setIndex: selectedSet, cardIndex: i });
                                }}
                                disabled={isDownloading}
                                title="1080x1080 최적화 다운로드"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                            {/* 이미지 생성/재생성 버튼 */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${hasImage ? "text-white hover:bg-white/20" : "text-primary hover:bg-primary/10"}`}
                              onClick={() => handleGenerateSingleImage(selectedSet, i)}
                              disabled={isGenerating}
                            >
                              {isGenerating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : hasImage ? (
                                <RefreshCw className="w-3.5 h-3.5" />
                              ) : (
                                <ImagePlus className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className={`font-bold text-sm leading-tight ${hasImage ? "text-white" : "text-foreground"}`}>
                            {card.headline}
                          </p>
                          <p className={`text-xs line-clamp-2 mt-1 ${hasImage ? "text-white/80" : "text-muted-foreground"}`}>
                            {card.bodyText}
                          </p>
                        </div>
                      </div>

                      {/* 이미지 생성 중 오버레이 */}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <p className="text-xs text-muted-foreground">이미지 생성 중...</p>
                        </div>
                      )}

                      {/* 비주얼 타입 뱃지 */}
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="outline" className={`text-[10px] ${hasImage ? "bg-black/40 text-white border-white/30" : ""}`}>
                          {card.visualType}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 다운로드 액션 바 */}
              {hasAnyImages && (
                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">인스타그램용 다운로드</span>
                      <Badge variant="outline" className="text-[10px]">1080x1080px / JPEG 92%</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDownloadingSet(true);
                          downloadSetZipMut.mutate({ id: videoId, setIndex: selectedSet });
                        }}
                        disabled={downloadingSet}
                        className="gap-1.5"
                      >
                        {downloadingSet ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileDown className="w-3.5 h-3.5" />
                        )}
                        {downloadingSet ? "ZIP 생성 중..." : "이 세트 ZIP 다운로드"}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setDownloadingAll(true);
                          downloadAllZipMut.mutate({ id: videoId });
                        }}
                        disabled={downloadingAll}
                        className="gap-1.5"
                      >
                        {downloadingAll ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                        {downloadingAll ? "전체 ZIP 생성 중..." : "전체 세트 ZIP 다운로드"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 해시태그 */}
              {currentSet.hashtags && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">해시태그</p>
                  <p className="text-sm">{currentSet.hashtags}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(currentSet.hashtags);
                      toast.success("해시태그가 복사되었습니다");
                    }}
                    className="mt-1 text-xs gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    해시태그 복사
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 재생성 다이얼로그 */}
      <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카드뉴스 재생성</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="추가 지시사항 (선택사항): 예) 더 젊은 감성으로 만들어주세요"
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

      {/* 텍스트 오버레이 다이얼로그 */}
      <Dialog open={!!overlayDialog} onOpenChange={(open) => { if (!open) setOverlayDialog(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              텍스트 오버레이 합성
            </DialogTitle>
          </DialogHeader>
          {overlayDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 설정 영역 */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">헤드라인</label>
                    <Input
                      value={overlayDialog.headline}
                      onChange={(e) => setOverlayDialog(prev => prev ? { ...prev, headline: e.target.value } : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">본문 텍스트</label>
                    <Textarea
                      value={overlayDialog.bodyText}
                      onChange={(e) => setOverlayDialog(prev => prev ? { ...prev, bodyText: e.target.value } : null)}
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">헤드라인 색상</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={overlayStyle.headlineColor}
                          onChange={(e) => setOverlayStyle(p => ({ ...p, headlineColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{overlayStyle.headlineColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">본문 색상</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={overlayStyle.bodyColor}
                          onChange={(e) => setOverlayStyle(p => ({ ...p, bodyColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{overlayStyle.bodyColor}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">텍스트 위치</label>
                    <div className="flex gap-2 mt-1">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <Button
                          key={pos}
                          variant={overlayStyle.position === pos ? "default" : "outline"}
                          size="sm"
                          onClick={() => setOverlayStyle(p => ({ ...p, position: pos }))}
                        >
                          {pos === "top" ? "상단" : pos === "center" ? "중앙" : "하단"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">배경 투명도: {Math.round(overlayStyle.overlayOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={overlayStyle.overlayOpacity * 100}
                      onChange={(e) => setOverlayStyle(p => ({ ...p, overlayOpacity: Number(e.target.value) / 100 }))}
                      className="w-full mt-1"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setGeneratingOverlay(true);
                      overlayMut.mutate({
                        id: videoId,
                        setIndex: overlayDialog.setIndex,
                        cardIndex: overlayDialog.cardIndex,
                        headline: overlayDialog.headline,
                        bodyText: overlayDialog.bodyText || undefined,
                        style: overlayStyle,
                      });
                    }}
                    disabled={generatingOverlay}
                  >
                    {generatingOverlay ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 합성 중...</>
                    ) : (
                      <><Palette className="w-4 h-4" /> 텍스트 합성하기</>
                    )}
                  </Button>
                </div>
                {/* 미리보기 영역 */}
                <div className="flex flex-col items-center justify-center">
                  {overlayResult ? (
                    <div className="space-y-3 w-full">
                      <img
                        src={overlayResult}
                        alt="오버레이 결과"
                        className="w-full aspect-square rounded-lg object-cover border"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = overlayResult;
                            a.download = `overlay_card_${overlayDialog.cardIndex + 1}.jpg`;
                            a.click();
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          다운로드
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(overlayResult);
                            toast.success("URL이 복사되었습니다");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          URL 복사
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Palette className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">왼쪽에서 설정 후</p>
                      <p className="text-sm">"텍스트 합성하기" 버튼을 눌러주세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── 숏폼 결과 (자막 생성 포함) ─── */
function ShortformResults({
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
  const generateSubtitleMut = trpc.interviewContent.generateSubtitle.useMutation({
    onSuccess: (result, variables) => {
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
  const generateAllSubtitlesMut = trpc.interviewContent.generateAllSubtitles.useMutation({
    onSuccess: (result) => {
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
function EmptyContentState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">아직 생성된 {type}가 없습니다.</p>
      <p className="text-sm text-muted-foreground mt-1">음성 추출 후 콘텐츠를 생성해주세요.</p>
    </div>
  );
}

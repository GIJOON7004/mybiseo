import { useState, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Video } from "lucide-react";
import RequireHospital from "@/components/RequireHospital";

/* ─── Lazy-loaded 하위 컴포넌트 ─── */
const VideoList = lazy(() => import("./interview-content/VideoList"));
const UploadDialog = lazy(() => import("./interview-content/UploadDialog"));
const VideoDetail = lazy(() => import("./interview-content/VideoDetail"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

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

        {/* 콘텐츠 영역 */}
        <Suspense fallback={<LoadingFallback />}>
          {isLoading ? (
            <LoadingFallback />
          ) : selectedVideoId ? (
            <VideoDetail videoId={selectedVideoId} onBack={() => setSelectedVideoId(null)} />
          ) : (
            <VideoList
              videos={videos || []}
              onSelect={setSelectedVideoId}
              onRefresh={() => utils.interviewContent.list.invalidate()}
              onUpload={() => setShowUploadDialog(true)}
            />
          )}
        </Suspense>

        {/* 업로드 다이얼로그 */}
        <Suspense fallback={null}>
          <UploadDialog
            open={showUploadDialog}
            onClose={() => setShowUploadDialog(false)}
            onSuccess={(id: number) => {
              setShowUploadDialog(false);
              setSelectedVideoId(id);
              utils.interviewContent.list.invalidate();
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Video, FileText, Image, Film, Trash2, ChevronRight, Clock } from "lucide-react";
import { parseJsonSafe, formatDuration, formatFileSize, statusMap } from "./utils";

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
export default function VideoList({
  videos,
  onSelect,
  onRefresh,
  onUpload,
}: {
  videos: any[];
  onSelect: (id: number) => void;
  onRefresh: () => void;
  onUpload?: () => void;
}) {
  const deleteMut = trpc.interviewContent.delete.useMutation({ onSuccess: () => { toast.success("삭제되었습니다"); onRefresh(); },
  onError: (err) => toast.error(err.message) });

  if (!videos.length && onUpload) {
    return <EmptyState onUpload={onUpload} />;
  }

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


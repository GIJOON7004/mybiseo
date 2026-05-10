import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Loader2, Copy, RefreshCw, Sparkles, Clock, Hash, Send } from "lucide-react";
import { EmptyContentState } from "./ShortformResults";

export default function BlogResults({
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

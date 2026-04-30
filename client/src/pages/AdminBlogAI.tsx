/**
 * 관리자 — 기능 1: AEO/GEO 최적화 블로그 자동 생성
 * 키워드 + 카테고리 입력 → AI가 AEO/GEO 최적화 블로그 글 자동 생성 → 초안 저장 → 관리자 확인 후 발행
 *
 * UX/UI 개선:
 * - 생성 폼 레이아웃 개선 (아이콘 배경, 라벨 정리)
 * - 키워드 추천 결과 클릭 시 자동 입력 + 시각 피드백
 * - 생성 중 프로그레스 표시 개선 (단계별 안내)
 * - 초안 목록 카드형 + 정렬
 * - 미리보기 다이얼로그 크기 최적화
 * - 빈 상태 일러스트 개선
 * - 모바일 반응형 최적화
 */
import DashboardLayout from "@/components/DashboardLayout";
import RequireHospital from "@/components/RequireHospital";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { FileText, Lightbulb, Loader2, Sparkles, Eye, Check, Trash2, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LightMarkdown } from "@/components/LightMarkdown";

export default function AdminBlogAI() {
  return (
    <DashboardLayout>
      <RequireHospital featureName="AI 블로그 생성">
        <BlogAIContent />
      </RequireHospital>
    </DashboardLayout>
  );
}

function BlogAIContent() {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [previewPost, setPreviewPost] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const categoriesQuery = trpc.blog.categories.useQuery();
  const adminListQuery = trpc.blog.adminList.useQuery();
  const utils = trpc.useUtils();

  const generateMutation = trpc.blog.aiGenerate.useMutation({
    onSuccess: (data) => {
      toast.success("블로그 글이 생성되었습니다! (초안 상태)");
      setPreviewPost(data.post);
      setShowPreview(true);
      setKeyword("");
      setAdditionalContext("");
      utils.blog.adminList.invalidate();
    },
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  const suggestMutation = trpc.blog.suggestKeywords.useMutation({
    onSuccess: (data) => toast.success(`${data.keywords.length}개 키워드 추천 완료!`),
    onError: (err) => toast.error("키워드 추천 실패: " + err.message),
  });

  const publishMutation = trpc.blog.adminUpdatePost.useMutation({
    onSuccess: () => {
      toast.success("발행 완료!");
      utils.blog.adminList.invalidate();
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error("병원 등록이 필요합니다. 내 병원 페이지에서 병원 정보를 먼저 등록해 주세요.");
      } else {
        toast.error("발행 실패: " + (err.message || "알 수 없는 오류가 발생했습니다."));
      }
    },
  });

  const deleteMutation = trpc.blog.adminDeletePost.useMutation({
    onSuccess: () => {
      toast.success("삭제 완료!");
      utils.blog.adminList.invalidate();
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error("병원 등록이 필요합니다. 내 병원 페이지에서 병원 정보를 먼저 등록해 주세요.");
      } else {
        toast.error("삭제 실패: " + (err.message || "알 수 없는 오류가 발생했습니다."));
      }
    },
  });

  const categories = categoriesQuery.data ?? [];
  const draftPosts = (adminListQuery.data?.posts ?? []).filter(p => p.published === "draft");

  const handleGenerate = () => {
    if (!keyword.trim() || !categoryId) {
      toast.error("키워드와 카테고리를 입력해주세요");
      return;
    }
    generateMutation.mutate({
      keyword: keyword.trim(),
      categoryId: parseInt(categoryId),
      additionalContext: additionalContext.trim() || undefined,
    });
  };

  const handleSuggest = () => {
    if (!categoryId) {
      toast.error("카테고리를 먼저 선택해주세요");
      return;
    }
    suggestMutation.mutate({ categoryId: parseInt(categoryId) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">블로그 AI 생성</h1>
        <p className="text-sm text-muted-foreground mt-1">키워드를 입력하면 AI가 ChatGPT · Gemini · Claude 등 AI 검색엔진이 인용하는 AEO/GEO 최적화 블로그를 자동으로 작성합니다</p>
      </div>

      {/* ─── 생성 폼 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            AI 블로그 글 생성
          </CardTitle>
          <CardDescription className="text-xs">키워드와 카테고리를 선택하면 AI가 1500~2500자 분량의 AEO/GEO 최적화 글을 작성합니다 (Q&A 구조 + E-E-A-T 강화)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">카테고리</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">타겟 키워드</Label>
              <Input
                placeholder="예: 성형외과 코수술 후기 관리"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">추가 맥락 (선택)</Label>
            <Textarea
              placeholder="예: 강남 성형외과 타겟, 비절개 눈매교정 키워드 중심으로 작성"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="h-10">
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  AI 생성 중... (10~20초)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI로 글 생성하기
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleSuggest} disabled={suggestMutation.isPending || !categoryId} className="h-10">
              {suggestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              키워드 추천
            </Button>
          </div>

          {/* 생성 중 프로그레스 */}
          {generateMutation.isPending && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI가 블로그 글을 작성하고 있습니다</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <span>키워드 분석</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>구조 설계</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>본문 작성</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>AEO/GEO 최적화</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 키워드 추천 결과 */}
          {suggestMutation.data && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">추천 키워드</span>
                <span className="text-xs text-muted-foreground">(클릭하여 선택)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestMutation.data.keywords.map((kw, i) => (
                  <Badge
                    key={i}
                    variant={keyword === kw ? "default" : "secondary"}
                    className={`cursor-pointer transition-all text-xs py-1 px-2.5 ${
                      keyword === kw
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "hover:bg-primary/10 hover:text-primary"
                    }`}
                    onClick={() => setKeyword(kw)}
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 초안 목록 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            초안 목록
            {draftPosts.length > 0 && (
              <Badge variant="secondary" className="text-xs">{draftPosts.length}개</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">AI가 생성한 초안을 확인하고 발행하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {draftPosts.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">아직 초안이 없습니다</p>
              <p className="text-xs text-muted-foreground/60 mt-1">위에서 키워드를 입력하고 AI로 글을 생성해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {draftPosts.map((post) => {
                const cat = adminListQuery.data?.categories.find(c => c.id === post.categoryId);
                return (
                  <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-xl hover:bg-accent/10 transition-colors gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-5">{cat?.name ?? "미분류"}</Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/10 text-amber-400 border-amber-500/20">초안</Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm truncate">{post.title}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setPreviewPost(post); setShowPreview(true); }}
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        미리보기
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => publishMutation.mutate({ id: post.id, published: "published" })}
                        disabled={publishMutation.isPending}
                        className="h-8 gap-1 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        발행
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: post.id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 미리보기 다이얼로그 ─── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg pr-8">{previewPost?.title ?? "미리보기"}</DialogTitle>
          </DialogHeader>
          {previewPost && (
            <div className="space-y-4">
              {/* 태그 */}
              {previewPost.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {previewPost.tags.split(",").map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px] h-5">{tag.trim()}</Badge>
                  ))}
                </div>
              )}
              {/* 메타 정보 */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30 space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">메타 타이틀</span>
                  <span>{previewPost.metaTitle}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-24 shrink-0 mt-0.5">메타 디스크립션</span>
                  <span className="text-muted-foreground">{previewPost.metaDescription}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">읽기 시간</span>
                  <span>{previewPost.readingTime}분</span>
                </div>
              </div>
              {/* 본문 */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <LightMarkdown>{previewPost.content}</LightMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

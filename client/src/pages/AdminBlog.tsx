/**
 * 관리자 — 블로그 관리 (전체 글 목록 + 수정 + 삭제 + 상태 변경 + 카테고리 관리)
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  FolderOpen,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Clock,
  BarChart3,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { LightMarkdown } from "@/components/LightMarkdown";

type PostStatus = "all" | "published" | "draft" | "scheduled";

const statusLabels: Record<string, { label: string; color: string }> = {
  published: { label: "발행됨", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  draft: { label: "초안", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  scheduled: { label: "예약", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

export default function AdminBlog() {
  return (
    <DashboardLayout>
      <BlogManageContent />
    </DashboardLayout>
  );
}

function BlogManageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">블로그 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          블로그 글과 카테고리를 관리합니다
        </p>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" className="gap-1.5">
            <FileText className="h-4 w-4" />
            글 관리
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <FolderOpen className="h-4 w-4" />
            카테고리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <PostsManager />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* 글 관리 탭                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

const BLOG_PAGE_SIZE = 20;

function PostsManager() {
  const [statusFilter, setStatusFilter] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPost, setPreviewPost] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [blogPage, setBlogPage] = useState(1);

  const adminListQuery = trpc.blog.adminList.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.blog.adminUpdatePost.useMutation({
    onSuccess: () => {
      toast.success("글이 수정되었습니다");
      utils.blog.adminList.invalidate();
      setShowEditDialog(false);
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error("병원 등록이 필요합니다. 내 병원 페이지에서 병원 정보를 먼저 등록해 주세요.");
      } else {
        toast.error("수정 실패: " + err.message);
      }
    },
  });

  const deleteMutation = trpc.blog.adminDeletePost.useMutation({
    onSuccess: () => {
      toast.success("글이 삭제되었습니다");
      utils.blog.adminList.invalidate();
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error("병원 등록이 필요합니다. 내 병원 페이지에서 병원 정보를 먼저 등록해 주세요.");
      } else {
        toast.error("삭제 실패: " + err.message);
      }
    },
  });

  const posts = adminListQuery.data?.posts ?? [];
  const categories = adminListQuery.data?.categories ?? [];

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.published === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.tags && p.tags.toLowerCase().includes(q))
      );
    }
    return result;
  }, [posts, statusFilter, searchQuery]);

  const blogTotalPages = Math.ceil(filteredPosts.length / BLOG_PAGE_SIZE);
  const paginatedPosts = useMemo(() => filteredPosts.slice((blogPage - 1) * BLOG_PAGE_SIZE, blogPage * BLOG_PAGE_SIZE), [filteredPosts, blogPage]);
  // Reset page when filter/search changes (handled via useMemo dependency)
  const prevFilterRef = useRef(statusFilter);
  const prevSearchRef = useRef(searchQuery);
  if (prevFilterRef.current !== statusFilter || prevSearchRef.current !== searchQuery) {
    prevFilterRef.current = statusFilter;
    prevSearchRef.current = searchQuery;
    if (blogPage !== 1) setBlogPage(1);
  }

  const statusCounts = useMemo(() => {
    return {
      all: posts.length,
      published: posts.filter((p) => p.published === "published").length,
      draft: posts.filter((p) => p.published === "draft").length,
      scheduled: posts.filter((p) => p.published === "scheduled").length,
    };
  }, [posts]);

  const getCategoryName = (catId: number) =>
    categories.find((c) => c.id === catId)?.name ?? "미분류";

  const handleStatusChange = (postId: number, newStatus: "draft" | "published" | "scheduled") => {
    updateMutation.mutate({ id: postId, published: newStatus });
  };

  const handleDelete = (postId: number, title: string) => {
    if (confirm(`"${title}" 글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      deleteMutation.mutate({ id: postId });
    }
  };

  const openEdit = (post: any) => {
    setEditingPost({ ...post });
    setShowEditDialog(true);
  };

  const openPreview = (post: any) => {
    setPreviewPost(post);
    setShowPreview(true);
  };

  return (
    <div className="space-y-4">
      {/* 상단 통계 + 검색 + 새 글 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="제목, 슬러그, 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adminListQuery.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          새 글 작성
        </Button>
      </div>

      {/* 상태 필터 */}
      <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1 w-fit">
        {(
          [
            { key: "all", label: "전체" },
            { key: "published", label: "발행됨" },
            { key: "draft", label: "초안" },
            { key: "scheduled", label: "예약" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">
              ({statusCounts[tab.key]})
            </span>
          </button>
        ))}
      </div>

      {/* 글 목록 */}
      {adminListQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm">
            {searchQuery
              ? "검색 결과가 없습니다"
              : "해당 상태의 글이 없습니다"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {searchQuery ? "다른 검색어를 입력해 보세요" : "블로그 AI 생성에서 새 글을 만들어 보세요"}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {/* 헤더 */}
          <div className="hidden lg:grid grid-cols-[1fr_120px_100px_80px_80px_140px] gap-4 px-5 py-3 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>제목</span>
            <span>카테고리</span>
            <span>상태</span>
            <span>조회수</span>
            <span>읽기</span>
            <span className="text-right">관리</span>
          </div>

          <div className="divide-y divide-border/30">
            {paginatedPosts.map((post) => {
              const status = statusLabels[post.published] ?? statusLabels.draft;
              return (
                <div
                  key={post.id}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_120px_100px_80px_80px_140px] gap-2 lg:gap-4 px-5 py-3.5 hover:bg-accent/20 transition-colors"
                >
                  {/* 제목 */}
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {post.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      /{post.slug}
                    </p>
                  </div>

                  {/* 카테고리 */}
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-[10px]">
                      {getCategoryName(post.categoryId)}
                    </Badge>
                  </div>

                  {/* 상태 */}
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* 조회수 */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {post.viewCount}
                  </div>

                  {/* 읽기 시간 */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {post.readingTime}분
                  </div>

                  {/* 관리 버튼 */}
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => openPreview(post)}
                      title="미리보기"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {post.published === "published" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          window.open(`/blog/${post.slug}`, "_blank")
                        }
                        title="사이트에서 보기"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(post)}
                      title="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {post.published === "draft" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-green-500 hover:text-green-600"
                        onClick={() =>
                          handleStatusChange(post.id, "published")
                        }
                        title="발행"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {post.published === "published" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-yellow-500 hover:text-yellow-600"
                        onClick={() =>
                          handleStatusChange(post.id, "draft")
                        }
                        title="초안으로 전환"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id, post.title)}
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {blogTotalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground">{filteredPosts.length}개 중 {(blogPage - 1) * BLOG_PAGE_SIZE + 1}-{Math.min(blogPage * BLOG_PAGE_SIZE, filteredPosts.length)}개</span>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={blogPage <= 1} onClick={() => setBlogPage(p => p - 1)}>이전</Button>
                <span className="text-xs text-muted-foreground px-1.5">{blogPage}/{blogTotalPages}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={blogPage >= blogTotalPages} onClick={() => setBlogPage(p => p + 1)}>다음</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 수정 다이얼로그 */}
      <EditPostDialog
        post={editingPost}
        categories={categories}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={(data) => {
          updateMutation.mutate(data);
        }}
        isPending={updateMutation.isPending}
      />

      {/* 미리보기 다이얼로그 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewPost?.title ?? "미리보기"}</DialogTitle>
          </DialogHeader>
          {previewPost && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {previewPost.tags
                  ?.split(",")
                  .map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <p>
                  <strong>메타 타이틀:</strong> {previewPost.metaTitle}
                </p>
                <p>
                  <strong>메타 디스크립션:</strong>{" "}
                  {previewPost.metaDescription}
                </p>
                <p>
                  <strong>읽기 시간:</strong> {previewPost.readingTime}분
                </p>
                <p>
                  <strong>조회수:</strong> {previewPost.viewCount}
                </p>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <LightMarkdown>{previewPost.content}</LightMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 새 글 작성 다이얼로그 */}
      <CreatePostDialog
        categories={categories}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* 글 수정 다이얼로그                                                       */
/* ──────────────────────────────────────────────────────────────────────── */

function EditPostDialog({
  post,
  categories,
  open,
  onOpenChange,
  onSave,
  isPending,
}: {
  post: any;
  categories: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<any>({});

  // Sync form when post changes
  const postId = post?.id;
  useMemo(() => {
    if (post) {
      setForm({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId,
        metaTitle: post.metaTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        tags: post.tags ?? "",
        readingTime: post.readingTime,
        published: post.published,
      });
    }
  }, [postId]);

  const handleSave = () => {
    onSave({
      id: form.id,
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      categoryId: form.categoryId,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      tags: form.tags || undefined,
      readingTime: form.readingTime,
      published: form.published,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>글 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={form.title ?? ""}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>슬러그 (URL)</Label>
              <Input
                value={form.slug ?? ""}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={form.categoryId?.toString() ?? ""}
                onValueChange={(v) =>
                  setForm((f: any) => ({ ...f, categoryId: parseInt(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.published ?? "draft"}
                onValueChange={(v) =>
                  setForm((f: any) => ({ ...f, published: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="published">발행됨</SelectItem>
                  <SelectItem value="scheduled">예약</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>읽기 시간 (분)</Label>
              <Input
                type="number"
                value={form.readingTime ?? 5}
                onChange={(e) =>
                  setForm((f: any) => ({
                    ...f,
                    readingTime: parseInt(e.target.value) || 5,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>요약 (excerpt)</Label>
            <Textarea
              value={form.excerpt ?? ""}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, excerpt: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>본문 (마크다운)</Label>
            <Textarea
              value={form.content ?? ""}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, content: e.target.value }))
              }
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>메타 타이틀</Label>
              <Input
                value={form.metaTitle ?? ""}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, metaTitle: e.target.value }))
                }
                placeholder="검색 노출용 제목"
              />
            </div>
            <div className="space-y-2">
              <Label>태그 (쉼표 구분)</Label>
              <Input
                value={form.tags ?? ""}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, tags: e.target.value }))
                }
                placeholder="태그1, 태그2, 태그3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>메타 디스크립션</Label>
            <Textarea
              value={form.metaDescription ?? ""}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  metaDescription: e.target.value,
                }))
              }
              rows={2}
              placeholder="검색 노출용 설명"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* 새 글 작성 다이얼로그                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function CreatePostDialog({
  categories,
  open,
  onOpenChange,
}: {
  categories: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    categoryId: "",
    metaTitle: "",
    metaDescription: "",
    tags: "",
    readingTime: 5,
    published: "draft" as "draft" | "published" | "scheduled",
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.blog.adminCreatePost.useMutation({
    onSuccess: () => {
      toast.success("글이 생성되었습니다");
      utils.blog.adminList.invalidate();
      onOpenChange(false);
      setForm({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        categoryId: "",
        metaTitle: "",
        metaDescription: "",
        tags: "",
        readingTime: 5,
        published: "draft",
      });
    },
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  const handleCreate = () => {
    if (!form.title.trim() || !form.slug.trim() || !form.categoryId) {
      toast.error("제목, 슬러그, 카테고리는 필수입니다");
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || form.title.trim(),
      content: form.content.trim() || "내용을 작성해주세요.",
      categoryId: parseInt(form.categoryId),
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      tags: form.tags || undefined,
      readingTime: form.readingTime,
      published: form.published,
    });
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: title
        .toLowerCase()
        .replace(/[가-힣]/g, (ch) => encodeURIComponent(ch))
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9%-]/g, "")
        .slice(0, 80),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 글 작성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="블로그 글 제목"
              />
            </div>
            <div className="space-y-2">
              <Label>슬러그 (URL) *</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="url-friendly-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>카테고리 *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoryId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.published}
                onValueChange={(v: any) =>
                  setForm((f) => ({ ...f, published: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="published">바로 발행</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>읽기 시간 (분)</Label>
              <Input
                type="number"
                value={form.readingTime}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    readingTime: parseInt(e.target.value) || 5,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>요약</Label>
            <Textarea
              value={form.excerpt}
              onChange={(e) =>
                setForm((f) => ({ ...f, excerpt: e.target.value }))
              }
              rows={2}
              placeholder="글 요약 (비워두면 제목이 사용됩니다)"
            />
          </div>

          <div className="space-y-2">
            <Label>본문 (마크다운)</Label>
            <Textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              rows={12}
              className="font-mono text-sm"
              placeholder="마크다운으로 본문을 작성하세요..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>메타 타이틀</Label>
              <Input
                value={form.metaTitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaTitle: e.target.value }))
                }
                placeholder="검색 노출용 제목 (선택)"
              />
            </div>
            <div className="space-y-2">
              <Label>태그</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="태그1, 태그2, 태그3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>메타 디스크립션</Label>
            <Textarea
              value={form.metaDescription}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  metaDescription: e.target.value,
                }))
              }
              rows={2}
              placeholder="검색 노출용 설명 (선택)"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {form.published === "published" ? "발행" : "초안 저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* 카테고리 관리 탭                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

function CategoriesManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const categoriesQuery = trpc.blog.categories.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.blog.adminCreateCategory.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 생성되었습니다");
      utils.blog.categories.invalidate();
      utils.blog.adminList.invalidate();
      setShowCreateDialog(false);
    },
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  const updateMutation = trpc.blog.adminUpdateCategory.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 수정되었습니다");
      utils.blog.categories.invalidate();
      utils.blog.adminList.invalidate();
      setShowEditDialog(false);
    },
    onError: (err) => toast.error("수정 실패: " + err.message),
  });

  const deleteMutation = trpc.blog.adminDeleteCategory.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 삭제되었습니다");
      utils.blog.categories.invalidate();
      utils.blog.adminList.invalidate();
    },
    onError: (err) => toast.error("삭제 실패: " + err.message),
  });

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          블로그 카테고리(업종별 허브)를 관리합니다
        </p>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-1.5"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          카테고리 추가
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm">아직 카테고리가 없습니다</p>
          <p className="text-xs text-muted-foreground/60 mt-1">카테고리를 추가하여 블로그 글을 분류하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingCategory(cat);
                        setShowEditDialog(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (
                          confirm(
                            `"${cat.name}" 카테고리를 삭제하시겠습니까?\n해당 카테고리의 글은 삭제되지 않습니다.`
                          )
                        ) {
                          deleteMutation.mutate({ id: cat.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {cat.description || "설명 없음"}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>슬러그: /{cat.slug}</span>
                  <span>글 {cat.postCount ?? 0}개</span>
                  <span>정렬: {cat.sortOrder}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 카테고리 생성 다이얼로그 */}
      <CategoryFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        title="카테고리 추가"
      />

      {/* 카테고리 수정 다이얼로그 */}
      <CategoryFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        initialData={editingCategory}
        onSave={(data) =>
          updateMutation.mutate({ id: editingCategory?.id, ...data })
        }
        isPending={updateMutation.isPending}
        title="카테고리 수정"
      />
    </div>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  isPending,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSave: (data: any) => void;
  isPending: boolean;
  title: string;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    sortOrder: 0,
  });

  useMemo(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        slug: initialData.slug ?? "",
        description: initialData.description ?? "",
        metaTitle: initialData.metaTitle ?? "",
        metaDescription: initialData.metaDescription ?? "",
        sortOrder: initialData.sortOrder ?? 0,
      });
    } else {
      setForm({
        name: "",
        slug: "",
        description: "",
        metaTitle: "",
        metaDescription: "",
        sortOrder: 0,
      });
    }
  }, [initialData?.id, open]);

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("이름과 슬러그는 필수입니다");
      return;
    }
    onSave({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description || undefined,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      sortOrder: form.sortOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="카테고리 이름"
              />
            </div>
            <div className="space-y-2">
              <Label>슬러그 *</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="url-slug"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              placeholder="카테고리 설명"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>메타 타이틀</Label>
              <Input
                value={form.metaTitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaTitle: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>정렬 순서</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>메타 디스크립션</Label>
            <Textarea
              value={form.metaDescription}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  metaDescription: e.target.value,
                }))
              }
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

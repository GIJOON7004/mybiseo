/**
 * 관리자 — 기능 3: 자동 발행 스케줄러
 * 검색 노출 키워드 등록 → AI 자동 생성 → 초안 확인 → 예약/즉시 발행
 * + 자동 스케줄러 상태 모니터링 및 수동 실행
 *
 * UX/UI 개선:
 * - 스케줄러 상태 카드 시각화 강화 (큰 아이콘, 색상 코드)
 * - 키워드 파이프라인 진행 상태 스텝 표시
 * - 모바일 반응형 레이아웃 최적화
 * - 빈 상태 일러스트 및 안내 개선
 * - 버튼 크기 및 터치 타겟 44px 이상
 * - 실행 히스토리 타임라인 스타일
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Loader2, Plus, Play, Trash2, Clock, CheckCircle2,
  FileText, Sparkles, Zap, RefreshCw, Power, ArrowRight, AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

export default function AdminScheduler() {
  return (
    <DashboardLayout>
      <SchedulerContent />
    </DashboardLayout>
  );
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; step: number }> = {
  pending:      { label: "대기",     color: "text-slate-400",  bgColor: "bg-slate-500/10 border-slate-500/20", icon: Clock,        step: 1 },
  generating:   { label: "생성 중",  color: "text-amber-400",  bgColor: "bg-amber-500/10 border-amber-500/20", icon: Loader2,      step: 2 },
  draft_ready:  { label: "초안 완성", color: "text-blue-400",   bgColor: "bg-blue-500/10 border-blue-500/20",   icon: FileText,     step: 3 },
  review_done:  { label: "검토 완료", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20", icon: CheckCircle2, step: 4 },
  scheduled:    { label: "예약됨",   color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20", icon: Calendar,     step: 5 },
  published:    { label: "발행됨",   color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, step: 6 },
};

const STEPS = [
  { label: "등록", step: 1 },
  { label: "AI 생성", step: 2 },
  { label: "초안", step: 3 },
  { label: "검토", step: 4 },
  { label: "예약", step: 5 },
  { label: "발행", step: 6 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {STEPS.map((s, i) => (
        <div key={s.step} className="flex items-center gap-0.5">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              s.step <= currentStep ? "bg-primary" : "bg-muted-foreground/20"
            }`}
          />
          {i < STEPS.length - 1 && (
            <div className={`w-3 h-px ${s.step < currentStep ? "bg-primary" : "bg-muted-foreground/20"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SchedulerContent() {
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");

  const categoriesQuery = trpc.blog.categories.useQuery();
  const keywordsQuery = trpc.seoKeyword.list.useQuery();
  const scheduledQuery = trpc.blog.scheduledList.useQuery();
  const schedulerStatusQuery = trpc.blogScheduler.status.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const utils = trpc.useUtils();

  const createMutation = trpc.seoKeyword.create.useMutation({
    onSuccess: () => {
      toast.success("키워드 등록 완료!");
      setNewKeyword("");
      utils.seoKeyword.list.invalidate();
    },
    onError: (err) => toast.error("등록 실패: " + err.message),
  });

  const generateMutation = trpc.seoKeyword.generateFromKeyword.useMutation({
    onSuccess: () => {
      toast.success("AI 블로그 글 생성 완료! (초안 상태)");
      utils.seoKeyword.list.invalidate();
      utils.blog.adminList.invalidate();
    },
    onError: (err) => toast.error("생성 실패: " + err.message),
  });

  const deleteMutation = trpc.seoKeyword.delete.useMutation({ onSuccess: () => {
      toast.success("삭제 완료!");
      utils.seoKeyword.list.invalidate();
    },
  onError: (err) => toast.error(err.message) });

  const publishScheduledMutation = trpc.blog.publishScheduled.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.published}개 글 발행 완료!`);
      utils.blog.scheduledList.invalidate();
      utils.blog.adminList.invalidate();
    },
    onError: (err) => toast.error("발행 실패: " + err.message),
  });

  const runNowMutation = trpc.blogScheduler.runNow.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`자동 발행 완료: "${data.title}"`);
      } else {
        toast.error(`자동 발행 실패: ${data.error}`);
      }
      utils.blogScheduler.status.invalidate();
      utils.blog.adminList.invalidate();
      utils.seoKeyword.list.invalidate();
    },
    onError: (err) => toast.error("실행 실패: " + err.message),
  });

  const genKeywordsMutation = trpc.blogScheduler.generateKeywords.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`이번 달 키워드 ${data.count}개 자동 선정 완료!`);
      } else {
        toast.error(`키워드 선정 실패: ${data.error}`);
      }
      utils.blogScheduler.status.invalidate();
      utils.seoKeyword.list.invalidate();
    },
    onError: (err) => toast.error("키워드 선정 실패: " + err.message),
  });

  const categories = categoriesQuery.data ?? [];
  const keywords = keywordsQuery.data ?? [];
  const scheduledPosts = scheduledQuery.data ?? [];
  const schedulerStatus = schedulerStatusQuery.data;
  const [kwPage, setKwPage] = useState(1);
  const kwTotalPages = Math.ceil(keywords.length / ITEMS_PER_PAGE);
  const displayKeywords = useMemo(() => keywords.slice((kwPage - 1) * ITEMS_PER_PAGE, kwPage * ITEMS_PER_PAGE), [keywords, kwPage]);

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !newCategoryId) {
      toast.error("키워드와 카테고리를 입력해주세요");
      return;
    }
    createMutation.mutate({ keyword: newKeyword.trim(), categoryId: parseInt(newCategoryId) });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">발행 스케줄러</h1>
        <p className="text-sm text-muted-foreground mt-1">
          검색 노출 키워드를 등록하면 AI가 자동으로 블로그 글을 생성하고, 예약 발행까지 관리합니다
        </p>
      </div>

      {/* ─── 자동 발행 스케줄러 상태 ─── */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                자동 발행 스케줄러
              </CardTitle>
              <CardDescription className="mt-1.5 text-xs">
                매월 1일 키워드 8개 자동 선정 → 매주 화/금 오전 10시 자동 발행
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => utils.blogScheduler.status.invalidate()}
                disabled={schedulerStatusQuery.isRefetching}
                className="h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${schedulerStatusQuery.isRefetching ? "animate-spin" : ""}`} />
                새로고침
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("이번 달 키워드 8개를 AI가 자동 선정하시겠습니까?")) {
                    genKeywordsMutation.mutate();
                  }
                }}
                disabled={genKeywordsMutation.isPending}
                className="h-9"
              >
                {genKeywordsMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                키워드 선정
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (confirm("지금 즉시 AI 블로그 글을 생성하고 발행하시겠습니까?")) {
                    runNowMutation.mutate();
                  }
                }}
                disabled={runNowMutation.isPending}
                className="h-9"
              >
                {runNowMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                )}
                즉시 발행
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {schedulerStatus ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 상태 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/50">
                <div className={`p-2 rounded-lg ${schedulerStatus.active ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <Power className={`h-4 w-4 ${schedulerStatus.active ? "text-emerald-400" : "text-red-400"}`} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">상태</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {schedulerStatus.active ? (
                      <span className="text-emerald-400">활성</span>
                    ) : (
                      <span className="text-red-400">비활성</span>
                    )}
                    {schedulerStatus.isRunning && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                        <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                        생성 중
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
              {/* 발행 스케줄 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/50">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">발행 스케줄</p>
                  <p className="text-sm font-medium mt-0.5 truncate">{schedulerStatus.schedule}</p>
                  {schedulerStatus.keywordSchedule && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{schedulerStatus.keywordSchedule}</p>
                  )}
                </div>
              </div>
              {/* 마지막 실행 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/50">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">마지막 실행</p>
                  <p className="text-sm font-medium mt-0.5 truncate">
                    {schedulerStatus.lastRunAt
                      ? new Date(schedulerStatus.lastRunAt).toLocaleString("ko-KR")
                      : "아직 실행되지 않음"}
                  </p>
                  {schedulerStatus.lastRunResult && (
                    <p className={`text-[11px] mt-0.5 truncate ${schedulerStatus.lastRunResult.success ? "text-emerald-400" : "text-red-400"}`}>
                      {schedulerStatus.lastRunResult.success
                        ? `"${schedulerStatus.lastRunResult.title}"`
                        : schedulerStatus.lastRunResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              스케줄러 상태 확인 중...
            </div>
          )}

          {/* 최근 실행 히스토리 — 타임라인 스타일 */}
          {schedulerStatus?.recentHistory && schedulerStatus.recentHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-xs font-medium text-muted-foreground mb-3">최근 실행 기록</p>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {[...schedulerStatus.recentHistory].reverse().map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      h.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {h.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {h.type === "publish" ? "발행" : "키워드"}
                        </Badge>
                        <span className="text-muted-foreground">{h.date}</span>
                      </div>
                      <p className="text-muted-foreground truncate mt-0.5">{h.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 키워드 등록 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            키워드 등록
          </CardTitle>
          <CardDescription className="text-xs">
            타겟 키워드를 등록하면 AI가 해당 키워드로 블로그 글을 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={newCategoryId} onValueChange={setNewCategoryId}>
              <SelectTrigger className="sm:w-44 h-10">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="타겟 키워드 입력"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              className="flex-1 h-10"
            />
            <Button onClick={handleAddKeyword} disabled={createMutation.isPending} className="h-10 px-5">
              <Plus className="h-4 w-4 mr-1.5" />
              등록
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── 키워드 파이프라인 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                키워드 파이프라인
                {keywords.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">{keywords.length}개</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                등록 → AI 생성 → 초안 확인 → 발행 순서로 진행됩니다
              </CardDescription>
            </div>
          </div>
          {/* 스텝 범례 */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {STEPS.map((s) => (
              <span key={s.step} className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {s.label}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">등록된 키워드가 없습니다</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                위에서 키워드를 등록하거나, 자동 스케줄러가 키워드를 자동 생성합니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayKeywords.map((kw) => {
                const cat = categories.find(c => c.id === kw.categoryId);
                const status = statusConfig[kw.status] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                const isGenerating = generateMutation.isPending && generateMutation.variables?.id === kw.id;

                return (
                  <div
                    key={kw.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-xl hover:bg-accent/10 transition-colors ${status.bgColor}`}
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${status.bgColor}`}>
                        <StatusIcon className={`h-4 w-4 ${status.color} ${kw.status === "generating" ? "animate-spin" : ""}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-medium text-sm">{kw.keyword}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{cat?.name ?? "미분류"}</Badge>
                          <span className={`text-[11px] font-medium ${status.color}`}>{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{new Date(kw.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <StepIndicator currentStep={status.step} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-3 shrink-0">
                      {(kw.status === "pending" || kw.status === "draft_ready") && (
                        <Button
                          size="sm"
                          variant={kw.status === "pending" ? "default" : "outline"}
                          onClick={() => generateMutation.mutate({ id: kw.id })}
                          disabled={isGenerating}
                          className="h-8 text-xs"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1" />
                          )}
                          {kw.status === "pending" ? "AI 생성" : "재생성"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까?")) {
                            deleteMutation.mutate({ id: kw.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {kwTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">{keywords.length}개 중 {(kwPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(kwPage * ITEMS_PER_PAGE, keywords.length)}개</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={kwPage <= 1} onClick={() => setKwPage(p => p - 1)}>이전</Button>
                    <span className="text-xs text-muted-foreground px-1.5">{kwPage}/{kwTotalPages}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={kwPage >= kwTotalPages} onClick={() => setKwPage(p => p + 1)}>다음</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 예약 발행 대기 ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-orange-500/10">
                  <Clock className="h-4 w-4 text-orange-400" />
                </div>
                예약 발행 대기
                {scheduledPosts.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">{scheduledPosts.length}개</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                예약 시간이 지난 글을 일괄 발행합니다
              </CardDescription>
            </div>
            {scheduledPosts.length > 0 && (
              <Button
                size="sm"
                onClick={() => publishScheduledMutation.mutate()}
                disabled={publishScheduledMutation.isPending}
                className="h-9"
              >
                {publishScheduledMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                일괄 발행
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">예약 발행 대기 중인 글이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{post.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        예약: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString("ko-KR") : "미설정"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                    예약됨
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

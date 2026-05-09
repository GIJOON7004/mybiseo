import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Loader2, Sparkles,
  FileText, Image, Film, Trash2, Clock, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const CONTENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  pink: { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  gray: { bg: "bg-gray-50 dark:bg-gray-950/30", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800" },
};

const PLATFORM_LABELS: Record<string, string> = {
  blog: "블로그",
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  naver: "네이버",
};

const CONTENT_TYPE_ICONS: Record<string, typeof FileText> = {
  blog: FileText,
  cardnews: Image,
  shortform: Film,
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function InterviewCalendar() {
  // sonner toast is imported at top level
  const now = new Date();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newItem, setNewItem] = useState({
    title: "",
    platform: "blog",
    scheduledTime: "09:00",
    notes: "",
    colorTag: "blue",
  });

  // 데이터 조회
  const monthlyQuery = trpc.interviewContent.calendarMonthly.useQuery(
    { year: currentYear, month: currentMonth },
    { enabled: viewMode === "month" }
  );
  const weeklyQuery = trpc.interviewContent.calendarWeekly.useQuery(
    { startDate: weekStart.toISOString() },
    { enabled: viewMode === "week" }
  );
  const videosQuery = trpc.interviewContent.list.useQuery();

  const calendarItems = viewMode === "month" ? (monthlyQuery.data || []) : (weeklyQuery.data || []);

  // 뮤테이션
  const createMut = trpc.interviewContent.calendarCreate.useMutation({ onSuccess: () => {
      toast.success("일정이 추가되었습니다");
      setShowAddDialog(false);
      monthlyQuery.refetch();
      weeklyQuery.refetch();
    },
  onError: (err) => toast.error(err.message) });
  const deleteMut = trpc.interviewContent.calendarDelete.useMutation({ onSuccess: () => {
      toast.success("일정이 삭제되었습니다");
      monthlyQuery.refetch();
      weeklyQuery.refetch();
    },
  onError: (err) => toast.error(err.message) });
  const suggestMut = trpc.interviewContent.suggestWeeklySchedule.useMutation({ onError: (err) => toast.error(err.message) });
  const applyMut = trpc.interviewContent.applySchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.created}개 일정이 캘린더에 등록되었습니다`);
      setShowSuggestDialog(false);
      monthlyQuery.refetch();
      weeklyQuery.refetch();
    },
  });

  const [suggestResult, setSuggestResult] = useState<any>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  // 월간 네비게이션
  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // 주간 네비게이션
  const prevWeek = () => setWeekStart(d => new Date(d.getTime() - 7 * 86400000));
  const nextWeek = () => setWeekStart(d => new Date(d.getTime() + 7 * 86400000));

  // 월간 캘린더 데이터
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const itemsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const item of calendarItems) {
      const dateStr = new Date(item.scheduledDate).toISOString().slice(0, 10);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    }
    return map;
  }, [calendarItems]);

  // 주간 날짜 배열
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.getTime() + i * 86400000);
      return d;
    });
  }, [weekStart]);

  const handleAddItem = () => {
    if (!newItem.title || !selectedDate) return;
    createMut.mutate({
      title: newItem.title,
      platform: newItem.platform,
      scheduledDate: selectedDate,
      scheduledTime: newItem.scheduledTime,
      notes: newItem.notes,
      colorTag: newItem.colorTag,
    });
  };

  const handleSuggest = async () => {
    if (!selectedVideoId) return;
    const startDate = viewMode === "week"
      ? weekStart.toISOString().slice(0, 10)
      : `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    try {
      const result = await suggestMut.mutateAsync({ id: selectedVideoId, startDate });
      setSuggestResult(result);
    } catch (e: any) {
      toast.error("스케줄 제안 실패", { description: e.message });
    }
  };

  const handleApplySchedule = () => {
    if (!suggestResult?.schedule || !selectedVideoId) return;
    const startDate = viewMode === "week"
      ? weekStart
      : new Date(currentYear, currentMonth - 1, 1);

    const items = suggestResult.schedule.map((s: any) => {
      const date = new Date(startDate.getTime() + s.dayOffset * 86400000);
      return {
        title: s.title,
        platform: s.platform,
        scheduledDate: date.toISOString(),
        scheduledTime: s.time,
        contentType: s.contentType,
        contentIndex: s.contentIndex,
        colorTag: s.contentType === "blog" ? "blue" : s.contentType === "cardnews" ? "pink" : "purple",
        contentSummary: s.reason,
      };
    });

    applyMut.mutate({ interviewVideoId: selectedVideoId, items });
  };

  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">콘텐츠 캘린더</h1>
          <p className="text-muted-foreground mt-1">
            인터뷰 콘텐츠 발행 일정을 관리하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setShowSuggestDialog(true); setSuggestResult(null); }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI 스케줄 제안
          </Button>
        </div>
      </div>

      {/* 뷰 전환 + 네비게이션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            월간
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            주간
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={viewMode === "month" ? prevMonth : prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-lg min-w-[160px] text-center">
            {viewMode === "month"
              ? `${currentYear}년 ${currentMonth}월`
              : `${weekStart.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} ~ ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}`
            }
          </span>
          <Button variant="ghost" size="icon" onClick={viewMode === "month" ? nextMonth : nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />블로그</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" />카드뉴스</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />숏폼</span>
        </div>
      </div>

      {/* 월간 뷰 */}
      {viewMode === "month" && (
        <Card>
          <CardContent className="p-0">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map((day, i) => (
                <div
                  key={day}
                  className={`p-3 text-center text-sm font-medium ${
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {/* 빈 칸 (월 시작 전) */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px] border-b border-r p-1 bg-muted/20" />
              ))}
              {/* 날짜 */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === now.toISOString().slice(0, 10);
                const dayOfWeek = (firstDay + i) % 7;

                return (
                  <div
                    key={day}
                    className={`min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowAddDialog(true);
                    }}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center" :
                      dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : ""
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map((item: any) => {
                        const colors = CONTENT_COLORS[item.colorTag || "gray"];
                        return (
                          <div
                            key={item.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate ${colors.bg} ${colors.text} border ${colors.border}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.scheduledTime && <span className="opacity-70">{item.scheduledTime} </span>}
                            {item.title}
                          </div>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                          +{dayItems.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주간 뷰 */}
      {viewMode === "week" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 divide-x">
              {weekDays.map((day, i) => {
                const dateStr = day.toISOString().slice(0, 10);
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === now.toISOString().slice(0, 10);

                return (
                  <div key={i} className={`min-h-[400px] ${isToday ? "bg-primary/5" : ""}`}>
                    {/* 요일 헤더 */}
                    <div className={`p-3 border-b text-center ${
                      i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""
                    }`}>
                      <div className="text-xs text-muted-foreground">{DAY_NAMES[i]}</div>
                      <div className={`text-lg font-semibold ${
                        isToday ? "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto" : ""
                      }`}>
                        {day.getDate()}
                      </div>
                    </div>
                    {/* 콘텐츠 */}
                    <div
                      className="p-2 space-y-2 cursor-pointer min-h-[350px]"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setShowAddDialog(true);
                      }}
                    >
                      {dayItems.map((item: any) => {
                        const colors = CONTENT_COLORS[item.colorTag || "gray"];
                        const Icon = CONTENT_TYPE_ICONS[item.contentType || ""] || Calendar;
                        return (
                          <div
                            key={item.id}
                            className={`p-2 rounded-lg border text-xs ${colors.bg} ${colors.text} ${colors.border}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {item.scheduledTime && (
                                  <span className="opacity-70">{item.scheduledTime}</span>
                                )}
                              </div>
                              <button
                                className="opacity-50 hover:opacity-100"
                                onClick={() => deleteMut.mutate({ id: item.id })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="font-medium truncate">{item.title}</div>
                            {item.platform && (
                              <Badge variant="outline" className="mt-1 text-[10px] h-4">
                                {PLATFORM_LABELS[item.platform] || item.platform}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 일정 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일정 추가</DialogTitle>
            <DialogDescription>
              {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric", weekday: "long",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제목</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))}
                placeholder="콘텐츠 제목"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>플랫폼</Label>
                <Select value={newItem.platform} onValueChange={(v) => setNewItem(p => ({ ...p, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">블로그</SelectItem>
                    <SelectItem value="instagram">인스타그램</SelectItem>
                    <SelectItem value="youtube">유튜브</SelectItem>
                    <SelectItem value="tiktok">틱톡</SelectItem>
                    <SelectItem value="naver">네이버</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>발행 시간</Label>
                <Input
                  type="time"
                  value={newItem.scheduledTime}
                  onChange={(e) => setNewItem(p => ({ ...p, scheduledTime: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>색상 태그</Label>
              <div className="flex gap-2 mt-1">
                {Object.entries(CONTENT_COLORS).map(([key, colors]) => (
                  <button
                    key={key}
                    className={`w-8 h-8 rounded-full border-2 ${colors.bg} ${
                      newItem.colorTag === key ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onClick={() => setNewItem(p => ({ ...p, colorTag: key }))}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>메모</Label>
              <Textarea
                value={newItem.notes}
                onChange={(e) => setNewItem(p => ({ ...p, notes: e.target.value }))}
                placeholder="메모 (선택)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>취소</Button>
            <Button onClick={handleAddItem} disabled={createMut.isPending || !newItem.title}>
              {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 스케줄 제안 다이얼로그 */}
      <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI 주간 발행 스케줄 제안
            </DialogTitle>
            <DialogDescription>
              인터뷰 영상에서 생성된 콘텐츠를 기반으로 최적의 발행 일정을 자동으로 제안합니다
            </DialogDescription>
          </DialogHeader>

          {!suggestResult ? (
            <div className="space-y-4">
              <div>
                <Label>인터뷰 영상 선택</Label>
                <Select
                  value={selectedVideoId?.toString() || ""}
                  onValueChange={(v) => setSelectedVideoId(Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="영상을 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    {(videosQuery.data || [])
                      .filter((v: any) => v.status === "completed")
                      .map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.topicKeyword || v.fileName || `인터뷰 #${v.id}`}
                          {v.doctorName && ` (${v.doctorName})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">AI가 고려하는 요소:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>플랫폼별 최적 발행 시간대 (검색/피드/영상 트래픽 피크)</li>
                  <li>블로그 선행 → 카드뉴스 후속 → 숏폼 마무리 전략</li>
                  <li>하루 최대 2개 발행, 채널 분산 원칙</li>
                  <li>콘텐츠 간 시너지 (깊이 → 요약 → 바이럴)</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSuggestDialog(false)}>취소</Button>
                <Button onClick={handleSuggest} disabled={suggestMut.isPending || !selectedVideoId}>
                  {suggestMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  스케줄 제안받기
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 전략 요약 */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-1">전략 요약</p>
                <p className="text-sm text-muted-foreground">{suggestResult.strategy}</p>
              </div>

              {/* 제안된 스케줄 */}
              <div className="space-y-2">
                {suggestResult.schedule?.map((item: any, i: number) => {
                  const Icon = CONTENT_TYPE_ICONS[item.contentType] || Calendar;
                  const colorKey = item.contentType === "blog" ? "blue" : item.contentType === "cardnews" ? "pink" : "purple";
                  const colors = CONTENT_COLORS[colorKey];
                  const startDate = viewMode === "week"
                    ? weekStart
                    : new Date(currentYear, currentMonth - 1, 1);
                  const date = new Date(startDate.getTime() + item.dayOffset * 86400000);

                  return (
                    <div key={i} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                          <span className="font-medium text-sm">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })} {item.time}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {PLATFORM_LABELS[item.platform] || item.platform}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSuggestResult(null)}>
                  다시 제안받기
                </Button>
                <Button onClick={handleApplySchedule} disabled={applyMut.isPending}>
                  {applyMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  캘린더에 적용
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

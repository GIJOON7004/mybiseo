/**
 * 33차: 시즌별 마케팅 캘린더 관리자 페이지
 * - 진료과별 월별 추천 키워드 조회
 * - 이번 달 / 다음 달 추천 키워드 하이라이트
 * - 키워드 추가/삭제 관리
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Plus, Trash2, Sparkles, TrendingUp, Tag,
  ChevronLeft, ChevronRight, Lightbulb, Target, Megaphone,
} from "lucide-react";

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const CATEGORIES = ["시술", "이벤트", "건강정보", "프로모션"] as const;
const PRIORITIES = ["high", "medium", "low"] as const;

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const priorityLabels: Record<string, string> = { high: "높음", medium: "보통", low: "낮음" };

const categoryIcons: Record<string, typeof Sparkles> = {
  "시술": Target,
  "이벤트": CalendarDays,
  "건강정보": Lightbulb,
  "프로모션": Megaphone,
};

export default function AdminSeasonalCalendar() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // 폼 상태
  const [newKeyword, setNewKeyword] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCategory, setNewCategory] = useState<typeof CATEGORIES[number]>("시술");
  const [newPriority, setNewPriority] = useState<typeof PRIORITIES[number]>("medium");
  const [newDescription, setNewDescription] = useState("");
  const [newTips, setNewTips] = useState("");
  
  const utils = trpc.useUtils();
  
  // 데이터 조회
  const specialtiesQuery = trpc.seasonalCalendar.getSpecialties.useQuery();
  const specialties = specialtiesQuery.data ?? [];
  
  const recommendationsQuery = trpc.seasonalCalendar.getRecommendations.useQuery(
    selectedSpecialty !== "all" ? { specialty: selectedSpecialty } : undefined
  );
  const recommendations = recommendationsQuery.data;
  
  const allKeywordsQuery = trpc.seasonalCalendar.getAll.useQuery({
    specialty: selectedSpecialty !== "all" ? selectedSpecialty : undefined,
    month: selectedMonth,
  });
  const keywords = allKeywordsQuery.data ?? [];
  
  // 뮤테이션
  const addMutation = trpc.seasonalCalendar.add.useMutation({
    onSuccess: () => {
      toast.success("시즌 키워드가 추가되었습니다");
      setShowAddDialog(false);
      resetForm();
      utils.seasonalCalendar.getAll.invalidate();
      utils.seasonalCalendar.getRecommendations.invalidate();
    },
    onError: () => toast.error("키워드 추가에 실패했습니다"),
  });
  
  const deleteMutation = trpc.seasonalCalendar.delete.useMutation({ onSuccess: () => {
      toast.success("키워드가 삭제되었습니다");
      utils.seasonalCalendar.getAll.invalidate();
      utils.seasonalCalendar.getRecommendations.invalidate();
    },
  onError: (err) => toast.error(err.message) });
  
  function resetForm() {
    setNewKeyword(""); setNewSpecialty(""); setNewCategory("시술");
    setNewPriority("medium"); setNewDescription(""); setNewTips("");
  }
  
  function handleAdd() {
    if (!newKeyword.trim() || !newSpecialty.trim()) return;
    addMutation.mutate({
      specialty: newSpecialty,
      month: selectedMonth,
      keyword: newKeyword,
      category: newCategory,
      priority: newPriority,
      description: newDescription || undefined,
      tips: newTips || undefined,
    });
  }
  
  // 진료과별 그룹핑
  const groupedKeywords = useMemo(() => {
    const groups: Record<string, typeof keywords> = {};
    for (const kw of keywords) {
      if (!groups[kw.specialty]) groups[kw.specialty] = [];
      groups[kw.specialty].push(kw);
    }
    return groups;
  }, [keywords]);
  
  const isThisMonth = selectedMonth === currentMonth;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const isNextMonth = selectedMonth === nextMonth;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-emerald-400" />
              시즌별 마케팅 캘린더
            </h1>
            <p className="text-muted-foreground mt-1">
              진료과별 월별 추천 마케팅 키워드 — 시즌에 맞는 콘텐츠 전략을 자동 제안합니다
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> 키워드 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>시즌 키워드 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">진료과</label>
                    <Input value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} placeholder="예: 치과, 피부과" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">월</label>
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">키워드</label>
                  <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="예: 여름 제모 레이저" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">카테고리</label>
                    <Select value={newCategory} onValueChange={(v) => setNewCategory(v as typeof CATEGORIES[number])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">우선순위</label>
                    <Select value={newPriority} onValueChange={(v) => setNewPriority(v as typeof PRIORITIES[number])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">설명</label>
                  <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="시즌 설명" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">마케팅 팁</label>
                  <Textarea value={newTips} onChange={(e) => setNewTips(e.target.value)} placeholder="추천 마케팅 전략" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">취소</Button></DialogClose>
                <Button onClick={handleAdd} disabled={addMutation.isPending || !newKeyword.trim() || !newSpecialty.trim()}>
                  {addMutation.isPending ? "추가 중..." : "추가"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 이번 달 / 다음 달 추천 하이라이트 */}
        {recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  이번 달 추천 ({MONTHS[currentMonth - 1]})
                </CardTitle>
                <CardDescription>지금 바로 활용할 수 있는 시즌 키워드</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.thisMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">등록된 키워드가 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {recommendations.thisMonth.slice(0, 5).map((kw) => {
                      const Icon = categoryIcons[kw.category] || Tag;
                      return (
                        <div key={kw.id} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                          <Icon className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{kw.keyword}</span>
                              <Badge variant="outline" className={`text-[10px] ${priorityColors[kw.priority]}`}>
                                {priorityLabels[kw.priority]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{kw.specialty}</Badge>
                            </div>
                            {kw.tips && <p className="text-xs text-muted-foreground mt-0.5">{kw.tips}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  다음 달 준비 ({MONTHS[nextMonth - 1]})
                </CardTitle>
                <CardDescription>미리 준비해야 할 시즌 키워드</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.nextMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">등록된 키워드가 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {recommendations.nextMonth.slice(0, 5).map((kw) => {
                      const Icon = categoryIcons[kw.category] || Tag;
                      return (
                        <div key={kw.id} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                          <Icon className="h-4 w-4 mt-0.5 text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{kw.keyword}</span>
                              <Badge variant="outline" className={`text-[10px] ${priorityColors[kw.priority]}`}>
                                {priorityLabels[kw.priority]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{kw.specialty}</Badge>
                            </div>
                            {kw.tips && <p className="text-xs text-muted-foreground mt-0.5">{kw.tips}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 필터 바 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSelectedMonth(selectedMonth === 1 ? 12 : selectedMonth - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg min-w-[4rem] text-center">
              {MONTHS[selectedMonth - 1]}
              {isThisMonth && <Badge className="ml-2 text-[10px] bg-emerald-500">이번 달</Badge>}
              {isNextMonth && <Badge className="ml-2 text-[10px] bg-blue-500">다음 달</Badge>}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSelectedMonth(selectedMonth === 12 ? 1 : selectedMonth + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="전체 진료과" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 진료과</SelectItem>
              {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => setSelectedMonth(currentMonth)}>
            오늘
          </Button>
        </div>

        {/* 키워드 목록 — 진료과별 그룹 */}
        {Object.keys(groupedKeywords).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>이 달에 등록된 시즌 키워드가 없습니다</p>
              <p className="text-sm mt-1">키워드를 추가하여 시즌 마케팅 전략을 세워보세요</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedKeywords).map(([specialty, items]) => (
              <Card key={specialty}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    {specialty}
                    <Badge variant="secondary" className="text-xs">{items.length}개</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((kw) => {
                      const Icon = categoryIcons[kw.category] || Tag;
                      return (
                        <div key={kw.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{kw.keyword}</span>
                              <Badge variant="outline" className="text-[10px]">{kw.category}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${priorityColors[kw.priority]}`}>
                                {priorityLabels[kw.priority]}
                              </Badge>
                            </div>
                            {kw.description && <p className="text-sm text-muted-foreground mt-1">{kw.description}</p>}
                            {kw.tips && (
                              <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
                                <p className="text-xs text-amber-300 flex items-center gap-1">
                                  <Lightbulb className="h-3 w-3" /> {kw.tips}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => { if (confirm("이 키워드를 삭제하시겠습니까?")) deleteMutation.mutate({ id: kw.id }); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 연간 캘린더 미니맵 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">연간 캘린더 미니맵</CardTitle>
            <CardDescription>각 월을 클릭하여 시즌 키워드를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {MONTHS.map((m, i) => {
                const monthNum = i + 1;
                const isSelected = selectedMonth === monthNum;
                const isCurrent = currentMonth === monthNum;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(monthNum)}
                    className={`p-2 rounded-lg text-center text-sm transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : isCurrent
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-card border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="font-medium">{m}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

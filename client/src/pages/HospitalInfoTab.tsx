/**
 * 병원 정보 관리 탭 — 가격표, 진료시간, 이벤트, FAQ, 공지사항 CRUD
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Save, X, DollarSign, Clock, Megaphone, HelpCircle, Bell,
  GripVertical, Loader2,
} from "lucide-react";

const CATEGORIES = [
  { value: "price", label: "가격표", icon: DollarSign, description: "시술/진료 항목별 가격 정보" },
  { value: "hours", label: "진료시간", icon: Clock, description: "요일별 진료 시간 안내" },
  { value: "event", label: "이벤트", icon: Megaphone, description: "현재 진행 중인 프로모션" },
  { value: "faq", label: "자주 묻는 질문", icon: HelpCircle, description: "환자분들이 자주 묻는 질문과 답변" },
  { value: "notice", label: "공지사항", icon: Bell, description: "병원 공지사항 및 안내" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

interface InfoItem {
  id: number;
  category: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function HospitalInfoTab() {
  const [activeCategory, setActiveCategory] = useState<Category>("price");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.hospitalInfo.list.useQuery({ category: activeCategory });

  const createMutation = trpc.hospitalInfo.create.useMutation({
    onSuccess: () => {
      utils.hospitalInfo.list.invalidate();
      setIsAdding(false);
      setFormTitle("");
      setFormContent("");
      toast.success("항목이 추가되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.hospitalInfo.update.useMutation({
    onSuccess: () => {
      utils.hospitalInfo.list.invalidate();
      setEditingId(null);
      toast.success("수정되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.hospitalInfo.delete.useMutation({
    onSuccess: () => {
      utils.hospitalInfo.list.invalidate();
      toast.success("삭제되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("제목과 내용을 모두 입력해주세요.");
      return;
    }
    createMutation.mutate({
      category: activeCategory,
      title: formTitle.trim(),
      content: formContent.trim(),
      sortOrder: items.length,
    });
  };

  const handleUpdate = (item: InfoItem) => {
    updateMutation.mutate({
      id: item.id,
      title: formTitle.trim() || item.title,
      content: formContent.trim() || item.content,
    });
  };

  const startEdit = (item: InfoItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
  };

  const catInfo = CATEGORIES.find((c) => c.value === activeCategory)!;

  return (
    <div className="space-y-6">
      {/* 카테고리 탭 */}
      <Tabs value={activeCategory} onValueChange={(v) => { setActiveCategory(v as Category); cancelEdit(); setIsAdding(false); }}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-card/50 p-1.5 rounded-xl">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className="text-xs sm:text-sm gap-1.5 px-3 py-2 data-[state=active]:bg-brand data-[state=active]:text-background rounded-lg transition-all"
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 카테고리 설명 + 추가 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{catInfo.description}</p>
        {!isAdding && (
          <Button size="sm" onClick={() => { setIsAdding(true); cancelEdit(); }} className="gap-1.5">
            <Plus className="w-4 h-4" /> 항목 추가
          </Button>
        )}
      </div>

      {/* 추가 폼 */}
      {isAdding && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                placeholder={activeCategory === "price" ? "예: 보톡스 (이마)" : activeCategory === "hours" ? "예: 평일 진료시간" : "제목을 입력하세요"}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y"
                placeholder={activeCategory === "price" ? "예: 50,000원 ~ 80,000원 (부위별 상이)" : "내용을 입력하세요"}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setIsAdding(false); setFormTitle(""); setFormContent(""); }}>
                <X className="w-4 h-4 mr-1" /> 취소
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 항목 리스트 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : items.length === 0 && !isAdding ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <catInfo.icon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">등록된 {catInfo.label} 항목이 없습니다.</p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4" /> 첫 항목 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(items as InfoItem[]).map((item) => (
            <Card key={item.id} className={`transition-all ${editingId === item.id ? "border-brand/30 bg-brand/5" : "hover:border-brand/20"}`}>
              <CardContent className="pt-4 pb-4">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                    <textarea
                      className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        <X className="w-4 h-4 mr-1" /> 취소
                      </Button>
                      <Button size="sm" onClick={() => handleUpdate(item)} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        저장
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                        <h4 className="font-medium text-sm">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">{item.content}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: item.id });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

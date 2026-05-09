import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Eye, Trash2, Globe, Pencil, ExternalLink, Copy, Sparkles, FileText, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TreatmentPageBuilder() {

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    treatmentName: "", treatmentCategory: "", hospitalName: "", hospitalInfo: "",
    doctorName: "", doctorTitle: "", targetAudience: "", keyBenefits: "", language: "ko" as "ko" | "en" | "ja" | "zh" | "vi" | "th",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  const pages = trpc.treatmentPage.list.useQuery();
  const generateMut = trpc.treatmentPage.generate.useMutation({
    onSuccess: () => { pages.refetch(); setShowForm(false); resetForm(); toast.success("시술 상세페이지가 생성되었습니다"); },
    onError: (e) => toast.error("생성 실패: " + e.message),
  });
  const updateMut = trpc.treatmentPage.update.useMutation({ onSuccess: () => { pages.refetch(); setEditingId(null); toast.success("수정 완료"); },
  onError: (err) => toast.error(err.message) });
  const publishMut = trpc.treatmentPage.publish.useMutation({ onSuccess: () => { pages.refetch(); toast.success("페이지가 퍼블리시되었습니다"); },
  onError: (err) => toast.error(err.message) });
  const deleteMut = trpc.treatmentPage.delete.useMutation({ onSuccess: () => { pages.refetch(); toast.success("삭제 완료"); },
  onError: (err) => toast.error(err.message) });

  const resetForm = () => setForm({ treatmentName: "", treatmentCategory: "", hospitalName: "", hospitalInfo: "", doctorName: "", doctorTitle: "", targetAudience: "", keyBenefits: "", language: "ko" });

  const handleGenerate = () => {
    if (!form.treatmentName.trim()) { toast.error("시술명을 입력해주세요"); return; }
    generateMut.mutate(form);
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL이 복사되었습니다");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시술 상세페이지 빌더</h1>
          <p className="text-muted-foreground mt-1">AI가 고품질 시술 상세페이지를 자동으로 생성합니다</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> 새 페이지 생성
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI 시술 상세페이지 생성</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">시술명 *</label>
                <Input placeholder="예: 쥬베룩, 울쎄라, 눈밑지방재배치" value={form.treatmentName} onChange={e => setForm({ ...form, treatmentName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">카테고리</label>
                <Select value={form.treatmentCategory} onValueChange={v => setForm({ ...form, treatmentCategory: v })}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skin">피부 시술</SelectItem>
                    <SelectItem value="lifting">리프팅</SelectItem>
                    <SelectItem value="filler">필러/보톡스</SelectItem>
                    <SelectItem value="laser">레이저</SelectItem>
                    <SelectItem value="surgery">수술</SelectItem>
                    <SelectItem value="body">바디</SelectItem>
                    <SelectItem value="hair">모발</SelectItem>
                    <SelectItem value="dental">치과</SelectItem>
                    <SelectItem value="eye">안과</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">병원명</label>
                <Input placeholder="예: OO성형외과" value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">의료진명</label>
                <Input placeholder="예: 김OO 원장" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">의료진 직함</label>
                <Input placeholder="예: 대한성형외과학회 정회원" value={form.doctorTitle} onChange={e => setForm({ ...form, doctorTitle: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">언어</label>
                <Select value={form.language} onValueChange={v => setForm({ ...form, language: v as "ko" | "en" | "ja" | "zh" | "vi" | "th" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="th">ภาษาไทย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">병원 소개 / 특장점</label>
              <Textarea placeholder="병원의 특징, 장비, 경력 등을 자유롭게 입력하세요" value={form.hospitalInfo} onChange={e => setForm({ ...form, hospitalInfo: e.target.value })} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">타겟 대상</label>
              <Input placeholder="예: 30~50대 여성, 피부 탄력 고민" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">핵심 장점</label>
              <Textarea placeholder="이 시술의 핵심 장점을 입력하세요" value={form.keyBenefits} onChange={e => setForm({ ...form, keyBenefits: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleGenerate} disabled={generateMut.isPending} className="gap-2">
                {generateMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> AI 생성 중... (30초~1분)</> : <><Sparkles className="w-4 h-4" /> AI로 페이지 생성</>}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 페이지 목록 */}
      <div className="space-y-4">
        {pages.data?.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 생성된 페이지가 없습니다</h3>
            <p className="text-muted-foreground mb-4">AI가 시술 상세페이지를 자동으로 만들어 드립니다</p>
            <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> 첫 페이지 만들기</Button>
          </Card>
        )}
        {pages.data?.map((page: any) => (
          <Card key={page.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{page.treatmentName}</h3>
                    <Badge variant={page.status === "published" ? "default" : page.status === "draft" ? "secondary" : "outline"}>
                      {page.status === "published" ? "공개" : page.status === "draft" ? "초안" : "보관"}
                    </Badge>
                    {page.treatmentCategory && <Badge variant="outline">{page.treatmentCategory}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{page.heroSubtitle || page.heroTitle}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {page.viewCount || 0}회 조회</span>
                    <span>{new Date(page.createdAt).toLocaleDateString("ko-KR")}</span>
                    {page.hospitalName && <span>{page.hospitalName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
                    <ExternalLink className="w-3.5 h-3.5" /> 미리보기
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => copyUrl(page.slug)}>
                    <Copy className="w-3.5 h-3.5" /> URL
                  </Button>
                  {page.status === "draft" && (
                    <Button size="sm" className="gap-1" onClick={() => publishMut.mutate({ id: page.id })} disabled={publishMut.isPending}>
                      <Globe className="w-3.5 h-3.5" /> 퍼블리시
                    </Button>
                  )}

                  {/* 수정 다이얼로그 */}
                  <Dialog open={editingId === page.id} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(page.id); setEditData({ ctaPhone: page.ctaPhone || "", ctaKakao: page.ctaKakao || "", ctaNaver: page.ctaNaver || "", themeColor: page.themeColor || "#6B46C1", hospitalName: page.hospitalName || "", doctorName: page.doctorName || "", doctorTitle: page.doctorTitle || "" }); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>페이지 설정 수정</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">전화번호 (CTA)</label>
                          <Input value={editData.ctaPhone || ""} onChange={e => setEditData({ ...editData, ctaPhone: e.target.value })} placeholder="02-1234-5678" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">카카오 상담 URL</label>
                          <Input value={editData.ctaKakao || ""} onChange={e => setEditData({ ...editData, ctaKakao: e.target.value })} placeholder="https://pf.kakao.com/..." />
                        </div>
                        <div>
                          <label className="text-sm font-medium">네이버 예약 URL</label>
                          <Input value={editData.ctaNaver || ""} onChange={e => setEditData({ ...editData, ctaNaver: e.target.value })} placeholder="https://booking.naver.com/..." />
                        </div>
                        <div>
                          <label className="text-sm font-medium">테마 컬러</label>
                          <div className="flex gap-2">
                            <input type="color" value={editData.themeColor || "#6B46C1"} onChange={e => setEditData({ ...editData, themeColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                            <Input value={editData.themeColor || ""} onChange={e => setEditData({ ...editData, themeColor: e.target.value })} className="flex-1" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium">병원명</label>
                            <Input value={editData.hospitalName || ""} onChange={e => setEditData({ ...editData, hospitalName: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">의료진명</label>
                            <Input value={editData.doctorName || ""} onChange={e => setEditData({ ...editData, doctorName: e.target.value })} />
                          </div>
                        </div>
                        <Button className="w-full" onClick={() => updateMut.mutate({ id: page.id, data: editData })} disabled={updateMut.isPending}>
                          {updateMut.isPending ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("정말 삭제하시겠습니까?")) deleteMut.mutate({ id: page.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

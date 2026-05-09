import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, Plus, Trash2, Settings, MessageCircle, CheckCircle, AlertCircle, GripVertical, Power, Link2 } from "lucide-react";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export default function KakaoBooking() {
  const { data: settings, isLoading: settingsLoading } = trpc.kakaoBooking.getSettings.useQuery();
  const { data: slots = [], isLoading: slotsLoading } = trpc.kakaoBooking.getSlots.useQuery();
  const utils = trpc.useUtils();

  const upsertSettings = trpc.kakaoBooking.upsertSettings.useMutation({
    onSuccess: () => { utils.kakaoBooking.getSettings.invalidate(); toast.success("설정이 저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const createSlot = trpc.kakaoBooking.createSlot.useMutation({
    onSuccess: () => { utils.kakaoBooking.getSlots.invalidate(); toast.success("시술 항목이 추가되었습니다."); setShowSlotDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateSlot = trpc.kakaoBooking.updateSlot.useMutation({ onSuccess: () => { utils.kakaoBooking.getSlots.invalidate(); toast.success("수정되었습니다."); },
  onError: (err) => toast.error(err.message) });
  const deleteSlot = trpc.kakaoBooking.deleteSlot.useMutation({ onSuccess: () => { utils.kakaoBooking.getSlots.invalidate(); toast.success("삭제되었습니다."); },
  onError: (err) => toast.error(err.message) });

  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("13:00");
  const [closedDays, setClosedDays] = useState<number[]>([0]);
  const [maxSlots, setMaxSlots] = useState(20);
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [bookingNotice, setBookingNotice] = useState("");
  const [settingsInit, setSettingsInit] = useState(false);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [slotName, setSlotName] = useState("");
  const [slotCategory, setSlotCategory] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotPrice, setSlotPrice] = useState<number | undefined>();
  const [slotPriceNote, setSlotPriceNote] = useState("");
  const [slotDesc, setSlotDesc] = useState("");

  if (settings && !settingsInit) {
    setChannelId(settings.kakaoChannelId || "");
    setChannelName(settings.kakaoChannelName || "");
    setChannelUrl(settings.kakaoChannelUrl || "");
    setIsActive(settings.isActive);
    setWorkStart(settings.workingHoursStart);
    setWorkEnd(settings.workingHoursEnd);
    setLunchStart(settings.lunchStart || "12:00");
    setLunchEnd(settings.lunchEnd || "13:00");
    setClosedDays((settings.closedDays as number[]) || [0]);
    setMaxSlots(settings.maxDailySlots);
    setDefaultDuration(settings.defaultDuration);
    setAutoConfirm(settings.autoConfirm);
    setBookingNotice(settings.bookingNotice || "");
    setSettingsInit(true);
  }

  const handleSaveSettings = () => {
    upsertSettings.mutate({
      kakaoChannelId: channelId || undefined,
      kakaoChannelName: channelName || undefined,
      kakaoChannelUrl: channelUrl || undefined,
      isActive,
      defaultDuration,
      maxDailySlots: maxSlots,
      workingHoursStart: workStart,
      workingHoursEnd: workEnd,
      lunchStart,
      lunchEnd,
      closedDays,
      bookingNotice: bookingNotice || undefined,
      autoConfirm,
    });
  };

  const toggleDay = (day: number) => {
    setClosedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (settingsLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-48 bg-gray-200 rounded" /></div></div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-yellow-500" />
            카카오톡 예약하기
          </h1>
          <p className="text-sm text-gray-500 mt-1">카카오톡 채널과 연동하여 환자 예약을 관리합니다.</p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="text-sm px-3 py-1">
          {isActive ? <><CheckCircle className="w-3.5 h-3.5 mr-1" /> 활성화</> : <><AlertCircle className="w-3.5 h-3.5 mr-1" /> 비활성</>}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Link2 className="w-5 h-5" /> 카카오 채널 연동</CardTitle>
          <CardDescription>카카오톡 비즈니스 채널 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>채널 ID</Label><Input placeholder="@병원채널명" value={channelId} onChange={e => setChannelId(e.target.value)} /></div>
            <div className="space-y-2"><Label>채널명</Label><Input placeholder="OO성형외과" value={channelName} onChange={e => setChannelName(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>채널 URL</Label><Input placeholder="https://pf.kakao.com/_xxxxx" value={channelUrl} onChange={e => setChannelUrl(e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>예약 시스템 활성화</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5" /> 운영 시간 설정</CardTitle>
          <CardDescription>진료 시간과 휴무일을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2"><Label>진료 시작</Label><Input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} /></div>
            <div className="space-y-2"><Label>진료 종료</Label><Input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} /></div>
            <div className="space-y-2"><Label>점심 시작</Label><Input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)} /></div>
            <div className="space-y-2"><Label>점심 종료</Label><Input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>휴무일</Label>
            <div className="flex gap-2">
              {DAY_NAMES.map((name, i) => (
                <button key={i} onClick={() => toggleDay(i)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${closedDays.includes(i) ? "bg-red-100 text-red-700 border-red-300 border" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{name}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>일일 최대 예약 수</Label><Input type="number" min={1} max={100} value={maxSlots} onChange={e => setMaxSlots(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>기본 시술 시간 (분)</Label><Input type="number" min={5} max={300} value={defaultDuration} onChange={e => setDefaultDuration(Number(e.target.value))} /></div>
          </div>
          <div className="flex items-center gap-3"><Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} /><Label>예약 자동 확인 (수동 확인 필요 시 끄기)</Label></div>
          <div className="space-y-2"><Label>예약 안내 문구</Label><Textarea placeholder="예약 시 참고사항을 입력하세요..." value={bookingNotice} onChange={e => setBookingNotice(e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={upsertSettings.isPending} className="px-8">
          <Settings className="w-4 h-4 mr-2" />{upsertSettings.isPending ? "저장 중..." : "설정 저장"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="w-5 h-5" /> 예약 가능 시술 항목</CardTitle>
              <CardDescription>환자가 예약할 수 있는 시술 항목을 관리합니다.</CardDescription>
            </div>
            <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setSlotName(""); setSlotCategory(""); setSlotDuration(defaultDuration); setSlotPrice(undefined); setSlotPriceNote(""); setSlotDesc(""); }}>
                  <Plus className="w-4 h-4 mr-1" /> 시술 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>시술 항목 추가</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2"><Label>시술명 *</Label><Input placeholder="예: 보톡스 (이마)" value={slotName} onChange={e => setSlotName(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>카테고리</Label>
                      <Select value={slotCategory} onValueChange={setSlotCategory}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="피부">피부</SelectItem>
                          <SelectItem value="성형">성형</SelectItem>
                          <SelectItem value="리프팅">리프팅</SelectItem>
                          <SelectItem value="레이저">레이저</SelectItem>
                          <SelectItem value="주사">주사</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>시술 시간 (분)</Label><Input type="number" min={5} max={300} value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>가격 (원)</Label><Input type="number" placeholder="미입력 시 '상담 후 결정'" value={slotPrice || ""} onChange={e => setSlotPrice(e.target.value ? Number(e.target.value) : undefined)} /></div>
                    <div className="space-y-2"><Label>가격 참고</Label><Input placeholder="상담 후 결정" value={slotPriceNote} onChange={e => setSlotPriceNote(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>설명</Label><Textarea placeholder="시술에 대한 간단한 설명..." value={slotDesc} onChange={e => setSlotDesc(e.target.value)} rows={2} /></div>
                  <Button onClick={() => createSlot.mutate({ treatmentName: slotName, treatmentCategory: slotCategory || undefined, duration: slotDuration, price: slotPrice, priceNote: slotPriceNote || undefined, description: slotDesc || undefined })} disabled={!slotName || createSlot.isPending} className="w-full">
                    {createSlot.isPending ? "추가 중..." : "시술 추가"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {slotsLoading ? (
            <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}</div>
          ) : slots.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">등록된 시술 항목이 없습니다.</p>
              <p className="text-sm mt-1">위 버튼으로 시술을 추가해주세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot: any) => (
                <div key={slot.id} className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${slot.isActive ? "bg-white" : "bg-gray-50 opacity-60"}`}>
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{slot.treatmentName}</span>
                      {slot.treatmentCategory && <Badge variant="outline" className="text-xs">{slot.treatmentCategory}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {slot.duration}분</span>
                      {slot.price ? <span>{slot.price.toLocaleString()}원</span> : <span>{slot.priceNote || "상담 후 결정"}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateSlot.mutate({ id: slot.id, isActive: !slot.isActive })}>
                      <Power className={`w-4 h-4 ${slot.isActive ? "text-green-500" : "text-gray-400"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteSlot.mutate({ id: slot.id }); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader><CardTitle className="text-lg text-yellow-800">카카오톡 채널 연동 가이드</CardTitle></CardHeader>
        <CardContent className="text-sm text-yellow-700 space-y-2">
          <p>1. <strong>카카오톡 비즈니스</strong>에서 채널을 개설하세요.</p>
          <p>2. 채널 관리자 &gt; 비즈니스 도구 &gt; <strong>예약하기</strong>를 활성화하세요.</p>
          <p>3. 위에 채널 ID와 URL을 입력하고 설정을 저장하세요.</p>
          <p>4. 시술 항목을 등록하면 시술 상세페이지에 예약 버튼이 자동으로 노출됩니다.</p>
          <p className="text-yellow-600 font-medium mt-3">* 카카오톡 예약하기 API 연동은 카카오 비즈니스 승인 후 가능합니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}

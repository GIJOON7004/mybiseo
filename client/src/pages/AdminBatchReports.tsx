/**
 * 관리자 — 일괄 AI 검색 최적화 진단 + PDF 보고서 생성
 * 강남 병원 리스트를 입력하면 일괄로 진단 + PDF 보고서를 생성
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FileText, Plus, Trash2, Loader2, Download, CheckCircle2, XCircle,
  ClipboardList, Sparkles, AlertCircle,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UrlEntry {
  id: string;
  url: string;
  specialty: string;
}

const SPECIALTIES = [
  { value: "", label: "자동 감지" },
  { value: "성형외과", label: "성형외과" },
  { value: "피부과", label: "피부과" },
  { value: "치과", label: "치과" },
  { value: "안과", label: "안과" },
  { value: "정형외과", label: "정형외과" },
  { value: "산부인과", label: "산부인과" },
  { value: "내과", label: "내과" },
  { value: "비뇨기과", label: "비뇨기과" },
  { value: "한의원", label: "한의원" },
  { value: "종합병원", label: "종합병원" },
];

const GANGNAM_PRESETS = [
  { url: "banobagi.com", specialty: "성형외과" },
  { url: "idhospital.com", specialty: "성형외과" },
  { url: "jayjun.com", specialty: "성형외과" },
  { url: "tlps.co.kr", specialty: "성형외과" },
  { url: "gangnamdental.co.kr", specialty: "치과" },
  { url: "yonseimiso.com", specialty: "치과" },
  { url: "gangnam-severance.com", specialty: "종합병원" },
  { url: "oracleclinic.com", specialty: "피부과" },
  { url: "seoulbarun.com", specialty: "정형외과" },
  { url: "apgujeong-yonsei.com", specialty: "피부과" },
];

export default function AdminBatchReports() {
  return (
    <DashboardLayout>
      <BatchReportsContent />
    </DashboardLayout>
  );
}

function BatchReportsContent() {
  const [entries, setEntries] = useState<UrlEntry[]>([
    { id: crypto.randomUUID(), url: "", specialty: "" },
  ]);
  const [language, setLanguage] = useState<"ko" | "en" | "th">("ko");
  const [results, setResults] = useState<any[]>([]);

  const batchMutation = trpc.seoAnalyzer.batchGenerateReports.useMutation({
    onSuccess: (data) => {
      setResults(data.results);
      toast.success(`일괄 진단 완료 — 성공 ${data.success}건 / 실패 ${data.failed}건`);
    },
    onError: (err) => {
      toast.error(`일괄 진단 실패: ${err.message}`);
    },
  });

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, { id: crypto.randomUUID(), url: "", specialty: "" }]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateEntry = useCallback((id: string, field: "url" | "specialty", value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }, []);

  const loadPresets = useCallback(() => {
    setEntries(GANGNAM_PRESETS.map(p => ({
      id: crypto.randomUUID(),
      url: p.url,
      specialty: p.specialty,
    })));
  }, []);

  const handleBatchGenerate = useCallback(() => {
    const validEntries = entries.filter(e => e.url.trim());
    if (validEntries.length === 0) {
      toast.error("URL을 입력해주세요");
      return;
    }
    setResults([]);
    batchMutation.mutate({
      urls: validEntries.map(e => ({
        url: e.url.trim(),
        specialty: e.specialty || undefined,
      })),
      country: "kr",
      language,
    });
  }, [entries, language, batchMutation, toast]);

  const validCount = entries.filter(e => e.url.trim()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">일괄 AI 검색 최적화 진단 + PDF 보고서</h1>
        <p className="text-sm text-muted-foreground mt-1">
          강남 병원 리스트를 입력하면 일괄로 진단하고 PDF 보고서를 생성합니다
        </p>
      </div>

      {/* 입력 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                병원 URL 리스트
              </CardTitle>
              <CardDescription>진단할 병원 홈페이지 URL과 진료과를 입력하세요 (최대 50개)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadPresets}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                강남 프리셋
              </Button>
              <Button variant="outline" size="sm" onClick={addEntry}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                추가
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
              <Input
                placeholder="예: gangnam-dental.co.kr"
                value={entry.url}
                onChange={e => updateEntry(entry.id, "url", e.target.value)}
                className="flex-1 text-[16px]"
              />
              <Select
                value={entry.specialty}
                onValueChange={v => updateEntry(entry.id, "specialty", v)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="진료과" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => (
                    <SelectItem key={s.value || "auto"} value={s.value || "auto"}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entries.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={v => setLanguage(v as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="th">ไทย</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{validCount}개 URL</span>
            </div>
            <Button
              onClick={handleBatchGenerate}
              disabled={batchMutation.isPending || validCount === 0}
              className="min-w-[160px]"
            >
              {batchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  진단 중... ({results.length}/{validCount})
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  일괄 진단 시작
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 진행 상태 / 결과 */}
      {batchMutation.isPending && (
        <Card className="border-primary/20">
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm font-medium">일괄 진단 진행 중...</p>
            <p className="text-xs text-muted-foreground mt-1">
              병원당 약 15~30초 소요됩니다. 총 {validCount}개 병원 진단 예상 시간: {Math.ceil(validCount * 0.4)}~{Math.ceil(validCount * 0.5)}분
            </p>
            <div className="w-full max-w-md mx-auto mt-4 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, (results.length / validCount) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !batchMutation.isPending && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              진단 결과
            </CardTitle>
            <CardDescription>
              성공 {results.filter(r => r.status === "success").length}건 / 
              실패 {results.filter(r => r.status === "failed").length}건
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.status === "success" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{r.url}</p>
                      {r.status === "success" && (
                        <p className="text-xs text-muted-foreground">
                          점수: {r.totalScore}점 · 등급: {r.grade}
                        </p>
                      )}
                      {r.status === "failed" && (
                        <p className="text-xs text-red-500">{r.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "success" && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {r.totalScore}점
                        </Badge>
                        <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 전체 다운로드 안내 */}
            {results.filter(r => r.status === "success").length > 1 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  각 PDF를 개별 다운로드하여 인쇄하세요. 병원명이 파일명에 포함되어 있어 구분이 쉽습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

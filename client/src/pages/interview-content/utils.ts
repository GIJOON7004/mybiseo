import React from "react";
import { Upload, Mic, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

/* ─── 유틸 ─── */
export function parseJsonSafe(text: string | null | undefined) {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function formatDuration(sec: number | null | undefined) {
  if (!sec) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s}초`;
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function triggerDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  uploading: { label: "업로드 중", color: "bg-blue-500/10 text-blue-600", icon: React.createElement(Upload, { className: "w-3.5 h-3.5" }) },
  transcribing: { label: "음성 추출 중", color: "bg-yellow-500/10 text-yellow-600", icon: React.createElement(Mic, { className: "w-3.5 h-3.5 animate-pulse" }) },
  transcribed: { label: "음성 추출 완료", color: "bg-emerald-500/10 text-emerald-600", icon: React.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }) },
  generating: { label: "콘텐츠 생성 중", color: "bg-purple-500/10 text-purple-600", icon: React.createElement(Sparkles, { className: "w-3.5 h-3.5 animate-pulse" }) },
  completed: { label: "완료", color: "bg-green-500/10 text-green-600", icon: React.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }) },
  error: { label: "오류", color: "bg-red-500/10 text-red-600", icon: React.createElement(AlertCircle, { className: "w-3.5 h-3.5" }) },
};

/* ─── 공통 Props 타입 ─── */
export interface ContentResultsProps {
  data: any;
  videoId: number;
  onRegenerate: (instruction?: string) => void;
  isRegenerating: boolean;
}

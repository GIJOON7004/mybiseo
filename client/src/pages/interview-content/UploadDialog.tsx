import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Video, Loader2 } from "lucide-react";
import { formatFileSize } from "./utils";

export default function UploadDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [topicKeyword, setTopicKeyword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMut = trpc.interviewContent.upload.useMutation({ onError: (err) => toast.error(err.message) });

  const handleUpload = useCallback(async () => {
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("파일 크기가 16MB를 초과합니다. 더 작은 파일을 사용해주세요.");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const _base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      setProgress(30);

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `interview-videos/${Date.now()}-${randomSuffix}-${file.name}`;

      const forgeApiUrl = (import.meta as any).env?.VITE_FRONTEND_FORGE_API_URL || "";
      const forgeApiKey = (import.meta as any).env?.VITE_FRONTEND_FORGE_API_KEY || "";

      const uploadUrl = new URL("v1/storage/upload", forgeApiUrl.replace(/\/+$/, "") + "/");
      uploadUrl.searchParams.set("path", fileKey);

      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: file.type || "video/mp4" });
      const formData = new FormData();
      formData.append("file", blob, file.name);

      const uploadResponse = await fetch(uploadUrl.toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${forgeApiKey}` },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("S3 업로드 실패");
      const { url: videoUrl } = await uploadResponse.json();

      setProgress(70);

      const result = await uploadMut.mutateAsync({
        videoUrl,
        videoFileKey: fileKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        doctorName: doctorName || undefined,
        hospitalName: hospitalName || undefined,
        topicKeyword: topicKeyword || undefined,
      });

      setProgress(100);
      toast.success("영상이 업로드되었습니다!");
      onSuccess(result.id);
    } catch (e: any) {
      toast.error(e.message || "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [file, doctorName, hospitalName, topicKeyword, uploadMut, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            인터뷰 영상 업로드
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 파일 선택 */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,video/*,.mp3,.mp4,.wav,.webm,.m4a,.ogg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Video className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">영상 또는 음성 파일을 선택하세요</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MP3, WAV, WebM, M4A (최대 16MB)</p>
              </>
            )}
          </div>

          {/* 메타 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">원장님 이름</label>
              <Input
                placeholder="예: 김철수"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">병원명</label>
              <Input
                placeholder="예: 에디션성형외과"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">주제/시술 키워드</label>
            <Input
              placeholder="예: 코성형, 눈성형, 리프팅"
              value={topicKeyword}
              onChange={(e) => setTopicKeyword(e.target.value)}
            />
          </div>

          {/* 업로드 버튼 */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                업로드 중... ({progress}%)
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                업로드
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


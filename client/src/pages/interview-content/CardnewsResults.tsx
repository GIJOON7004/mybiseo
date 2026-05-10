import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Image, Loader2, Copy, RefreshCw, Sparkles, Clock, Download, ImagePlus, Archive, FileDown, Type, Palette } from "lucide-react";
import { triggerDownload } from "./utils";
import { EmptyContentState } from "./ShortformResults";

export default function CardnewsResults({
  data,
  videoId,
  onRegenerate,
  isRegenerating,
}: {
  data: any;
  videoId: number;
  onRegenerate: (instruction?: string) => void;
  isRegenerating: boolean;
}) {
  const [selectedSet, setSelectedSet] = useState<number>(0);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [downloadingSet, setDownloadingSet] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState<string | null>(null);
  const [overlayDialog, setOverlayDialog] = useState<{ setIndex: number; cardIndex: number; headline: string; bodyText: string } | null>(null);
  const [overlayStyle, setOverlayStyle] = useState({
    headlineColor: "#FFFFFF",
    headlineFontSize: 72,
    bodyColor: "#F0F0F0",
    bodyFontSize: 36,
    overlayOpacity: 0.4,
    position: "center" as "top" | "center" | "bottom",
  });
  const [generatingOverlay, setGeneratingOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // 텍스트 오버레이 뮤테이션
  const overlayMut = trpc.interviewContent.generateCardOverlay.useMutation({
    onSuccess: (result) => {
      toast.success("텍스트 오버레이 이미지가 생성되었습니다!");
      setGeneratingOverlay(false);
      setOverlayResult(result.overlayUrl);
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingOverlay(false);
    },
  });

  const generateCardImageMut = trpc.interviewContent.generateCardImage.useMutation({ onSuccess: (result, variables) => {
      toast.success(`카드 ${variables.cardIndex + 1} 이미지가 생성되었습니다!`);
      setGeneratingImages((prev) => ({ ...prev, [`${variables.setIndex}-${variables.cardIndex}`]: false}));
      utils.interviewContent.getById.invalidate({ id: videoId });
    },
    onError: (err, variables) => {
      toast.error(err.message);
      setGeneratingImages((prev) => ({ ...prev, [`${variables.setIndex}-${variables.cardIndex}`]: false }));
    },
  });
  const generateSetImagesMut = trpc.interviewContent.generateCardSetImages.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.generated}/${result.total}개 이미지가 생성되었습니다!`);
      setGeneratingImages({});
      utils.interviewContent.getById.invalidate({ id: videoId });
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingImages({});
    },
  });

  // 개별 이미지 1080x1080 다운로드
  const optimizeCardMut = trpc.interviewContent.optimizeCardImage.useMutation({
    onSuccess: (result) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success("1080x1080 최적화 이미지가 다운로드됩니다");
      setDownloadingSingle(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setDownloadingSingle(null);
    },
  });

  // 세트 ZIP 다운로드
  const downloadSetZipMut = trpc.interviewContent.downloadCardSetZip.useMutation({
    onSuccess: (result) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success(`${result.imageCount}개 이미지 ZIP 다운로드가 시작됩니다`);
      setDownloadingSet(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setDownloadingSet(false);
    },
  });

  // 전체 ZIP 다운로드
  const downloadAllZipMut = trpc.interviewContent.downloadAllCardSetsZip.useMutation({
    onSuccess: (result) => {
      triggerDownload(result.downloadUrl, result.fileName);
      toast.success(`${result.setCount}세트 ${result.totalImages}개 이미지 ZIP 다운로드가 시작됩니다`);
      setDownloadingAll(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setDownloadingAll(false);
    },
  });

  const sets = data?.cardnews || [];
  if (!sets.length) return <EmptyContentState type="카드뉴스" />;

  const currentSet = sets[selectedSet];
  const hasAnyImages = (currentSet?.cards || []).some((c: any) => c.imageUrl);
  const _hasAllImages = currentSet?.cards?.length > 0 && (currentSet?.cards || []).every((c: any) => c.imageUrl);

  const handleGenerateSingleImage = (setIndex: number, cardIndex: number) => {
    setGeneratingImages((prev) => ({ ...prev, [`${setIndex}-${cardIndex}`]: true }));
    generateCardImageMut.mutate({ id: videoId, setIndex, cardIndex });
  };

  const handleGenerateAllImages = (setIndex: number) => {
    const cards = sets[setIndex]?.cards || [];
    const allKeys: Record<string, boolean> = {};
    cards.forEach((_: any, i: number) => { allKeys[`${setIndex}-${i}`] = true; });
    setGeneratingImages((prev) => ({ ...prev, ...allKeys }));
    generateSetImagesMut.mutate({ id: videoId, setIndex });
  };

  return (
    <div className="space-y-4">
      {/* 세트 선택 */}
      <div className="flex items-center gap-2 flex-wrap">
        {sets.map((s: any, i: number) => (
          <Button
            key={i}
            variant={selectedSet === i ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSet(i)}
            className="gap-1"
          >
            <Image className="w-3.5 h-3.5" />
            {i + 1}번 ({s.concept || `컨셉 ${i + 1}`})
          </Button>
        ))}
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRegenDialog(true)}
          disabled={isRegenerating}
          className="gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
          재생성
        </Button>
      </div>

      {/* 카드뉴스 세트 */}
      {currentSet && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{currentSet.setTitle}</CardTitle>
                  <CardDescription>{currentSet.concept}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAllImages(selectedSet)}
                    disabled={generateSetImagesMut.isPending}
                    className="gap-1"
                  >
                    {generateSetImagesMut.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-3.5 h-3.5" />
                    )}
                    {generateSetImagesMut.isPending ? "생성 중..." : "전체 이미지 생성"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = currentSet.cards.map((c: any) =>
                        `[슬라이드 ${c.slideNumber}]\n${c.headline}\n${c.bodyText}\n디자인: ${c.designNote}`
                      ).join("\n\n");
                      navigator.clipboard.writeText(text);
                      toast.success("카드뉴스 내용이 복사되었습니다");
                    }}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    전체 복사
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">{currentSet.targetAudience}</Badge>
                {currentSet.bestPostingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {currentSet.bestPostingTime}
                  </span>
                )}
              </div>

              {/* 카드 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentSet.cards?.map((card: any, i: number) => {
                  const isGenerating = generatingImages[`${selectedSet}-${i}`];
                  const hasImage = !!card.imageUrl;
                  const isDownloading = downloadingSingle === `${selectedSet}-${i}`;

                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-xl border overflow-hidden relative group"
                    >
                      {/* 배경: 이미지가 있으면 이미지, 없으면 그라데이션 */}
                      {hasImage ? (
                        <img
                          src={card.imageUrl}
                          alt={card.headline}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10" />
                      )}

                      {/* 오버레이 콘텐츠 */}
                      <div className={`absolute inset-0 flex flex-col justify-between p-4 ${hasImage ? "bg-black/40" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div className="w-6 h-6 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-primary">
                            {card.slideNumber}
                          </div>
                          <div className="flex items-center gap-1">
                            {/* 텍스트 오버레이 버튼 */}
                            {hasImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOverlayDialog({ setIndex: selectedSet, cardIndex: i, headline: card.headline, bodyText: card.bodyText || "" });
                                  setOverlayResult(null);
                                }}
                                title="텍스트 오버레이 합성"
                              >
                                <Type className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {/* 이미지 다운로드 버튼 (1080x1080) */}
                            {hasImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${hasImage ? "text-white hover:bg-white/20" : "text-primary hover:bg-primary/10"}`}
                                onClick={() => {
                                  setDownloadingSingle(`${selectedSet}-${i}`);
                                  optimizeCardMut.mutate({ id: videoId, setIndex: selectedSet, cardIndex: i });
                                }}
                                disabled={isDownloading}
                                title="1080x1080 최적화 다운로드"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                            {/* 이미지 생성/재생성 버튼 */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${hasImage ? "text-white hover:bg-white/20" : "text-primary hover:bg-primary/10"}`}
                              onClick={() => handleGenerateSingleImage(selectedSet, i)}
                              disabled={isGenerating}
                            >
                              {isGenerating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : hasImage ? (
                                <RefreshCw className="w-3.5 h-3.5" />
                              ) : (
                                <ImagePlus className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className={`font-bold text-sm leading-tight ${hasImage ? "text-white" : "text-foreground"}`}>
                            {card.headline}
                          </p>
                          <p className={`text-xs line-clamp-2 mt-1 ${hasImage ? "text-white/80" : "text-muted-foreground"}`}>
                            {card.bodyText}
                          </p>
                        </div>
                      </div>

                      {/* 이미지 생성 중 오버레이 */}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <p className="text-xs text-muted-foreground">이미지 생성 중...</p>
                        </div>
                      )}

                      {/* 비주얼 타입 뱃지 */}
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="outline" className={`text-[10px] ${hasImage ? "bg-black/40 text-white border-white/30" : ""}`}>
                          {card.visualType}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 다운로드 액션 바 */}
              {hasAnyImages && (
                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">인스타그램용 다운로드</span>
                      <Badge variant="outline" className="text-[10px]">1080x1080px / JPEG 92%</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDownloadingSet(true);
                          downloadSetZipMut.mutate({ id: videoId, setIndex: selectedSet });
                        }}
                        disabled={downloadingSet}
                        className="gap-1.5"
                      >
                        {downloadingSet ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileDown className="w-3.5 h-3.5" />
                        )}
                        {downloadingSet ? "ZIP 생성 중..." : "이 세트 ZIP 다운로드"}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setDownloadingAll(true);
                          downloadAllZipMut.mutate({ id: videoId });
                        }}
                        disabled={downloadingAll}
                        className="gap-1.5"
                      >
                        {downloadingAll ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                        {downloadingAll ? "전체 ZIP 생성 중..." : "전체 세트 ZIP 다운로드"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 해시태그 */}
              {currentSet.hashtags && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">해시태그</p>
                  <p className="text-sm">{currentSet.hashtags}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(currentSet.hashtags);
                      toast.success("해시태그가 복사되었습니다");
                    }}
                    className="mt-1 text-xs gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    해시태그 복사
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 재생성 다이얼로그 */}
      <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카드뉴스 재생성</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="추가 지시사항 (선택사항): 예) 더 젊은 감성으로 만들어주세요"
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={() => {
              onRegenerate(regenInstruction || undefined);
              setShowRegenDialog(false);
              setRegenInstruction("");
            }}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            재생성
          </Button>
        </DialogContent>
      </Dialog>

      {/* 텍스트 오버레이 다이얼로그 */}
      <Dialog open={!!overlayDialog} onOpenChange={(open) => { if (!open) setOverlayDialog(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              텍스트 오버레이 합성
            </DialogTitle>
          </DialogHeader>
          {overlayDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 설정 영역 */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">헤드라인</label>
                    <Input
                      value={overlayDialog.headline}
                      onChange={(e) => setOverlayDialog(prev => prev ? { ...prev, headline: e.target.value } : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">본문 텍스트</label>
                    <Textarea
                      value={overlayDialog.bodyText}
                      onChange={(e) => setOverlayDialog(prev => prev ? { ...prev, bodyText: e.target.value } : null)}
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">헤드라인 색상</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={overlayStyle.headlineColor}
                          onChange={(e) => setOverlayStyle(p => ({ ...p, headlineColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{overlayStyle.headlineColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">본문 색상</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={overlayStyle.bodyColor}
                          onChange={(e) => setOverlayStyle(p => ({ ...p, bodyColor: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{overlayStyle.bodyColor}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">텍스트 위치</label>
                    <div className="flex gap-2 mt-1">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <Button
                          key={pos}
                          variant={overlayStyle.position === pos ? "default" : "outline"}
                          size="sm"
                          onClick={() => setOverlayStyle(p => ({ ...p, position: pos }))}
                        >
                          {pos === "top" ? "상단" : pos === "center" ? "중앙" : "하단"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">배경 투명도: {Math.round(overlayStyle.overlayOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={overlayStyle.overlayOpacity * 100}
                      onChange={(e) => setOverlayStyle(p => ({ ...p, overlayOpacity: Number(e.target.value) / 100 }))}
                      className="w-full mt-1"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setGeneratingOverlay(true);
                      overlayMut.mutate({
                        id: videoId,
                        setIndex: overlayDialog.setIndex,
                        cardIndex: overlayDialog.cardIndex,
                        headline: overlayDialog.headline,
                        bodyText: overlayDialog.bodyText || undefined,
                        style: overlayStyle,
                      });
                    }}
                    disabled={generatingOverlay}
                  >
                    {generatingOverlay ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 합성 중...</>
                    ) : (
                      <><Palette className="w-4 h-4" /> 텍스트 합성하기</>
                    )}
                  </Button>
                </div>
                {/* 미리보기 영역 */}
                <div className="flex flex-col items-center justify-center">
                  {overlayResult ? (
                    <div className="space-y-3 w-full">
                      <img
                        src={overlayResult}
                        alt="오버레이 결과"
                        className="w-full aspect-square rounded-lg object-cover border"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = overlayResult;
                            a.download = `overlay_card_${overlayDialog.cardIndex + 1}.jpg`;
                            a.click();
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          다운로드
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(overlayResult);
                            toast.success("URL이 복사되었습니다");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          URL 복사
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Palette className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">왼쪽에서 설정 후</p>
                      <p className="text-sm">"텍스트 합성하기" 버튼을 눌러주세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── 숏폼 결과 (자막 생성 포함) ─── */

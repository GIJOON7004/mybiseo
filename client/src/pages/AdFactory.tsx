import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Globe, Palette, Sparkles, Image, Download, Heart, Trash2, Shield, CheckCircle2,
  AlertTriangle, XCircle, Loader2, Plus, ChevronRight, Eye, Copy, RefreshCw
} from "lucide-react";

// 플랫폼 옵션
const PLATFORMS = [
  { value: "instagram", label: "인스타그램 피드", icon: "📸" },
  { value: "instagram_story", label: "인스타 스토리", icon: "📱" },
  { value: "facebook", label: "페이스북", icon: "👤" },
  { value: "google_display", label: "구글 디스플레이", icon: "🌐" },
  { value: "google_square", label: "구글 정사각형", icon: "⬜" },
  { value: "naver_banner", label: "네이버 배너", icon: "🟢" },
  { value: "kakao", label: "카카오 배너", icon: "💬" },
];

const AD_TYPES = [
  { value: "sponsored", label: "스폰서드 광고" },
  { value: "event", label: "이벤트/프로모션" },
  { value: "awareness", label: "브랜드 인지도" },
  { value: "before_after", label: "전후 비교" },
  { value: "testimonial", label: "후기/추천" },
];

export default function AdFactory() {
  const [activeTab, setActiveTab] = useState("profiles");
  const [urlInput, setUrlInput] = useState("");

  // 브랜드 프로필 목록
  const profilesQuery = trpc.adFactory.listProfiles.useQuery();
  const extractMutation = trpc.adFactory.extractBrandDna.useMutation({ onSuccess: () => {
      toast.success("브랜드 DNA 추출 완료!", { description: "병원 웹사이트에서 브랜드 정보를 분석했습니다."});
      profilesQuery.refetch();
      setUrlInput("");
      setActiveTab("profiles");
    },
    onError: (err) => toast.error("추출 실패", { description: err.message }),
  });
  const deleteProfileMutation = trpc.adFactory.deleteProfile.useMutation({ onSuccess: () => { profilesQuery.refetch(); toast.success("프로필 삭제됨"); },
  onError: (err) => toast.error(err.message) });

  // 광고 생성
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [treatmentName, setTreatmentName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [selectedAdTypes, setSelectedAdTypes] = useState<string[]>(["sponsored"]);
  const [adCount, setAdCount] = useState(4);
  const [generateImages, setGenerateImages] = useState(true);

  const generateMutation = trpc.adFactory.generateAds.useMutation({ onSuccess: (data) => {
      toast.success(`${data.count}개 광고 생성 완료!`, { description: "광고 갤러리에서 확인하세요."});
      creativesQuery.refetch();
      statsQuery.refetch();
      setActiveTab("gallery");
    },
    onError: (err) => toast.error("생성 실패", { description: err.message }),
  });

  // 광고 갤러리
  const [galleryFilter, setGalleryFilter] = useState<string>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const creativesQuery = trpc.adFactory.listCreatives.useQuery(
    galleryFilter === "all" && !favoriteOnly
      ? undefined
      : {
          platform: galleryFilter !== "all" ? galleryFilter : undefined,
          favoriteOnly: favoriteOnly || undefined,
        }
  );
  const updateCreativeMutation = trpc.adFactory.updateCreative.useMutation({ onSuccess: () => creativesQuery.refetch(),
  onError: (err) => toast.error(err.message) });
  const deleteCreativeMutation = trpc.adFactory.deleteCreative.useMutation({ onSuccess: () => { creativesQuery.refetch(); statsQuery.refetch(); toast.success("광고 삭제됨"); },
  onError: (err) => toast.error(err.message) });
  const complianceMutation = trpc.adFactory.checkCompliance.useMutation({ onSuccess: (data) => {
      creativesQuery.refetch();
      if (data.status === "passed") {
        toast.success("의료광고법 검수 통과", { description: data.summary});
      } else if (data.status === "failed") {
        toast.error("검수 결과 확인 필요", { description: data.summary });
      } else {
        toast.warning("검수 결과 확인 필요", { description: data.summary });
      }
    },
    onError: (err) => toast.error("검수 실패", { description: err.message }),
  });

  // 통계
  const statsQuery = trpc.adFactory.stats.useQuery();

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const toggleAdType = (t: string) => {
    setSelectedAdTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const handleExtract = () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    extractMutation.mutate({ hospitalUrl: url });
  };

  const handleGenerate = () => {
    if (!selectedProfileId) {
      toast.error("브랜드 프로필을 선택해주세요");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("플랫폼을 1개 이상 선택해주세요");
      return;
    }
    generateMutation.mutate({
      brandProfileId: selectedProfileId,
      treatmentName: treatmentName || undefined,
      eventDescription: eventDesc || undefined,
      platforms: selectedPlatforms,
      adTypes: selectedAdTypes,
      count: adCount,
      generateImages,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사됨");
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            초고속 광고 공장
          </h1>
          <p className="text-muted-foreground mt-1">
            병원 URL만 입력하면 브랜드 DNA를 분석하고, AI가 광고 이미지와 카피를 대량 생성합니다
          </p>
        </div>
        {statsQuery.data && (
          <div className="flex gap-3">
            <Card className="px-4 py-2">
              <div className="text-xs text-muted-foreground">총 광고</div>
              <div className="text-xl font-bold">{statsQuery.data.total}</div>
            </Card>
            <Card className="px-4 py-2">
              <div className="text-xs text-muted-foreground">프로필</div>
              <div className="text-xl font-bold">{profilesQuery.data?.length || 0}</div>
            </Card>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles">
            <Globe className="h-4 w-4 mr-1" /> 브랜드 DNA
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-1" /> 광고 생성
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Image className="h-4 w-4 mr-1" /> 광고 갤러리
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="h-4 w-4 mr-1" /> 의료법 검수
          </TabsTrigger>
        </TabsList>

        {/* ── 탭1: 브랜드 DNA ── */}
        <TabsContent value="profiles" className="space-y-4">
          {/* URL 입력 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">병원 웹사이트에서 브랜드 DNA 추출</CardTitle>
              <CardDescription>
                병원 홈페이지 URL만 입력하면 AI가 로고, 색상, 분위기, 타겟 고객을 자동 분석합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="https://www.hospital-example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                  className="flex-1"
                />
                <Button
                  onClick={handleExtract}
                  disabled={extractMutation.isPending || !urlInput.trim()}
                >
                  {extractMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 분석 중...</>
                  ) : (
                    <><Globe className="h-4 w-4 mr-2" /> DNA 추출</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 프로필 목록 */}
          {profilesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : profilesQuery.data?.length === 0 ? (
            <Card className="py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">아직 분석된 브랜드가 없습니다</p>
              <p className="text-sm text-muted-foreground/70 mt-1">위에서 병원 URL을 입력해 시작하세요</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {profilesQuery.data?.map((profile) => (
                <Card key={profile.id} className="relative group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{profile.hospitalName || "병원명 미상"}</CardTitle>
                        <CardDescription className="text-xs truncate max-w-[280px]">
                          {profile.hospitalUrl}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteProfileMutation.mutate({ id: profile.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 색상 팔레트 */}
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">색상:</span>
                      <div className="flex gap-1">
                        {[profile.primaryColor, profile.secondaryColor, profile.accentColor].filter(Boolean).map((c, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border border-border"
                            style={{ backgroundColor: c || "#ccc" }}
                            title={c || ""}
                          />
                        ))}
                      </div>
                    </div>
                    {/* 톤앤매너 & 폰트 */}
                    <div className="flex flex-wrap gap-1.5">
                      {profile.toneOfVoice && <Badge variant="secondary">{profile.toneOfVoice}</Badge>}
                      {profile.fontStyle && <Badge variant="outline">{profile.fontStyle}</Badge>}
                    </div>
                    {/* 키워드 */}
                    {profile.brandKeywords && (
                      <div className="flex flex-wrap gap-1">
                        {profile.brandKeywords.split(",").map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{kw.trim()}</Badge>
                        ))}
                      </div>
                    )}
                    {/* 요약 */}
                    {profile.brandSummary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{profile.brandSummary}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => { setSelectedProfileId(profile.id); setActiveTab("generate"); }}
                    >
                      이 브랜드로 광고 만들기 <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── 탭2: 광고 생성 ── */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI 광고 대량 생성</CardTitle>
              <CardDescription>
                브랜드 DNA에 맞춰 광고 카피와 이미지를 한 번에 생성합니다. 10분 만에 30장 이상!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 브랜드 선택 */}
              <div className="space-y-2">
                <Label>브랜드 프로필 선택</Label>
                <Select
                  value={selectedProfileId?.toString() || ""}
                  onValueChange={(v) => setSelectedProfileId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="분석된 병원 브랜드를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {profilesQuery.data?.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.hospitalName || p.hospitalUrl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 시술/이벤트 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>시술/서비스명 (선택)</Label>
                  <Input
                    placeholder="예: 코성형, 보톡스, 피부관리"
                    value={treatmentName}
                    onChange={(e) => setTreatmentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>이벤트 설명 (선택)</Label>
                  <Input
                    placeholder="예: 봄맞이 20% 할인 이벤트"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* 플랫폼 선택 */}
              <div className="space-y-2">
                <Label>광고 플랫폼 (복수 선택 가능)</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <Button
                      key={p.value}
                      variant={selectedPlatforms.includes(p.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePlatform(p.value)}
                    >
                      {p.icon} {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 광고 유형 */}
              <div className="space-y-2">
                <Label>광고 유형</Label>
                <div className="flex flex-wrap gap-2">
                  {AD_TYPES.map((t) => (
                    <Button
                      key={t.value}
                      variant={selectedAdTypes.includes(t.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAdType(t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 수량 & 이미지 옵션 */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>플랫폼당 생성 수</Label>
                  <Select value={adCount.toString()} onValueChange={(v) => setAdCount(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8, 10].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}개</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI 이미지 생성</Label>
                  <Button
                    variant={generateImages ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setGenerateImages(!generateImages)}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    {generateImages ? "이미지 포함" : "카피만 생성"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>예상 생성량</Label>
                  <div className="h-9 flex items-center justify-center bg-muted rounded-md text-sm font-medium">
                    총 {selectedPlatforms.length * adCount}개 광고
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !selectedProfileId}
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> AI가 광고를 만들고 있습니다... (1~3분 소요)</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" /> {selectedPlatforms.length * adCount}개 광고 한번에 생성</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── 탭3: 광고 갤러리 ── */}
        <TabsContent value="gallery" className="space-y-4">
          {/* 필터 */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={galleryFilter} onValueChange={setGalleryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="플랫폼 필터" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 플랫폼</SelectItem>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={favoriteOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFavoriteOnly(!favoriteOnly)}
            >
              <Heart className={`h-4 w-4 mr-1 ${favoriteOnly ? "fill-current" : ""}`} /> 즐겨찾기
            </Button>
            <Button variant="outline" size="sm" onClick={() => creativesQuery.refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> 새로고침
            </Button>
          </div>

          {/* 갤러리 그리드 */}
          {creativesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : creativesQuery.data?.length === 0 ? (
            <Card className="py-12 text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">생성된 광고가 없습니다</p>
              <Button variant="link" onClick={() => setActiveTab("generate")}>
                광고 생성하러 가기 <ChevronRight className="h-4 w-4" />
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creativesQuery.data?.map((creative) => (
                <Card key={creative.id} className="group overflow-hidden">
                  {/* 이미지 */}
                  {creative.imageUrl ? (
                    <div className="relative aspect-square bg-muted">
                      <img
                        src={creative.imageUrl}
                        alt={creative.headline || "광고 이미지"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {creative.dimensions}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <span className="text-4xl opacity-20">📝</span>
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    {/* 플랫폼 & 유형 */}
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {PLATFORMS.find(p => p.value === creative.platform)?.label || creative.platform}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{creative.adType}</Badge>
                      {creative.complianceStatus === "passed" && (
                        <Badge className="text-xs bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-0.5" /> 검수통과</Badge>
                      )}
                      {creative.complianceStatus === "failed" && (
                        <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-0.5" /> 검수실패</Badge>
                      )}
                      {creative.complianceStatus === "warning" && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-0.5" /> 주의</Badge>
                      )}
                    </div>
                    {/* 카피 */}
                    <h3 className="font-semibold text-sm line-clamp-1">{creative.headline}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{creative.bodyText}</p>
                    {creative.ctaText && (
                      <Badge variant="default" className="text-xs">{creative.ctaText}</Badge>
                    )}
                    {/* 해시태그 */}
                    {creative.hashtags && (
                      <p className="text-xs text-blue-500 line-clamp-1">{creative.hashtags}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCreativeMutation.mutate({
                        id: creative.id,
                        isFavorite: creative.isFavorite === 1 ? 0 : 1,
                      })}
                    >
                      <Heart className={`h-4 w-4 ${creative.isFavorite === 1 ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(`${creative.headline}\n${creative.bodyText}\n${creative.ctaText}\n${creative.hashtags || ""}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {creative.imageUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(creative.imageUrl!, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => complianceMutation.mutate({ creativeId: creative.id })}
                      disabled={complianceMutation.isPending}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteCreativeMutation.mutate({ id: creative.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── 탭4: 의료법 검수 ── */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                의료광고법 자동 검수
              </CardTitle>
              <CardDescription>
                생성된 광고 카피가 의료법을 준수하는지 AI가 자동으로 검사합니다.
                갤러리에서 개별 광고의 방패 아이콘을 클릭하거나, 아래에서 일괄 검수하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Card className="p-4 text-center border-green-200 bg-green-50/50">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-700">
                    {creativesQuery.data?.filter(c => c.complianceStatus === "passed").length || 0}
                  </div>
                  <div className="text-xs text-green-600">검수 통과</div>
                </Card>
                <Card className="p-4 text-center border-yellow-200 bg-yellow-50/50">
                  <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold text-yellow-700">
                    {creativesQuery.data?.filter(c => c.complianceStatus === "warning").length || 0}
                  </div>
                  <div className="text-xs text-yellow-600">주의 필요</div>
                </Card>
                <Card className="p-4 text-center border-red-200 bg-red-50/50">
                  <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-700">
                    {creativesQuery.data?.filter(c => c.complianceStatus === "failed").length || 0}
                  </div>
                  <div className="text-xs text-red-600">검수 실패</div>
                </Card>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <h4 className="font-semibold">의료광고법 주요 검수 항목</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>1. 과장 표현 금지 — "최고", "최초", "유일" 등</li>
                  <li>2. 비교 광고 금지 — "다른 병원보다" 등</li>
                  <li>3. 전후 사진 사용 시 면책 문구 필수</li>
                  <li>4. 부작용/주의사항 안내 필수</li>
                  <li>5. 가격 유인 표현 주의</li>
                  <li>6. 환자 유인 표현 금지</li>
                  <li>7. 비급여 의료인 시술 표현 주의</li>
                </ul>
              </div>

              {/* 미검수 광고 목록 */}
              {creativesQuery.data?.filter(c => c.complianceStatus === "unchecked").length ? (
                <div>
                  <h4 className="font-semibold mb-2">미검수 광고 ({creativesQuery.data.filter(c => c.complianceStatus === "unchecked").length}개)</h4>
                  <div className="space-y-2">
                    {creativesQuery.data.filter(c => c.complianceStatus === "unchecked").slice(0, 10).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.headline}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.bodyText}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => complianceMutation.mutate({ creativeId: c.id })}
                          disabled={complianceMutation.isPending}
                        >
                          {complianceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 mr-1" />}
                          검수
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">모든 광고가 검수되었습니다</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * AI 인용 현황 탭 — MyHospital 대시보드의 첫 번째 탭
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertTriangle, TrendingUp, Trophy, Target, BarChart3,
  Zap, CheckCircle2, XCircle, Clock, Calendar,
} from "lucide-react";
import { GradeCircle, ScoreChangeIndicator } from "./shared";

/* ── 경쟁사 위치 카드 ── */
function CompetitorPositionCard() {
  const { data, isLoading } = trpc.myHospitalExtended.getCompetitorPosition.useQuery();
  if (isLoading || !data) return null;
  const isAbove = data.aboveAverage;
  const color = isAbove ? "text-emerald-400" : "text-red-400";
  const bg = isAbove ? "bg-emerald-400/10 border-emerald-400/20" : "bg-red-400/10 border-red-400/20";
  return (
    <Card className={`${bg}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-brand" />
          같은 진료과 내 위치
        </CardTitle>
        <CardDescription>동일 진료과 병원 {data.specialtyCount}개 대비</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">내 점수</p>
            <p className={`text-2xl font-bold ${color}`}>{data.myScore}<span className="text-sm">점</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">진료과 평균</p>
            <p className="text-2xl font-bold text-foreground">{data.specialtyAvg}<span className="text-sm text-muted-foreground">점</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">평균 대비</p>
            <p className={`text-2xl font-bold ${color}`}>{data.scoreDiff > 0 ? "+" : ""}{data.scoreDiff}<span className="text-sm">점</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── 시즌 키워드 카드 ── */
function SeasonalKeywordsCard() {
  const { data, isLoading } = trpc.myHospitalExtended.getMySeasonalKeywords.useQuery();
  const keywords = Array.isArray(data) ? data : (data as any)?.thisMonth ?? [];
  if (isLoading || !data || keywords.length === 0) return null;
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand" />
          이번 달 추천 키워드
        </CardTitle>
        <CardDescription>시즌별 마케팅 키워드 추천</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw: any, i: number) => (
            <span key={i} className="px-3 py-1.5 bg-brand/10 text-brand text-sm rounded-full border border-brand/20">
              {kw.keyword}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── 점수 비교 카드 ── */
function ScoreComparisonCard() {
  const { data, isLoading } = trpc.myHospitalExtended.getScoreComparison.useQuery();
  if (isLoading || !data) return null;
  const improved = data.change > 0;
  const color = improved ? "text-emerald-400" : data.change < 0 ? "text-red-400" : "text-muted-foreground";
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand" />
          기간별 점수 변화
        </CardTitle>
        <CardDescription>최근 {data.months}개월 vs 이전 기간 비교</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">최근 평균</p>
            <p className="text-2xl font-bold text-foreground">{data.recentAvg}<span className="text-sm text-muted-foreground">점</span></p>
            <p className="text-[10px] text-muted-foreground">{data.recentCount}회 진단</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">이전 평균</p>
            <p className="text-2xl font-bold text-muted-foreground">{data.olderAvg}<span className="text-sm">점</span></p>
            <p className="text-[10px] text-muted-foreground">{data.olderCount}회 진단</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">변화</p>
            <p className={`text-2xl font-bold ${color}`}>{data.change > 0 ? "+" : ""}{data.change}<span className="text-sm">점</span></p>
            <p className="text-[10px] text-muted-foreground">{improved ? "개선 중" : data.change < 0 ? "하락 중" : "변동 없음"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── 메인 AI 인용 탭 ── */
export default function AiExposureTab({ dashData, runDiagnosis: _runDiagnosis }: { dashData: any; runDiagnosis: any }) {
  const _utils = trpc.useUtils();
  const { data: improvements } = trpc.myHospital.improvements.useQuery();
  const { profile, history, ranking, myRank } = dashData;
  const latestDiag = history.length > 0 ? history[history.length - 1] : null;
  const prevDiag = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="space-y-6">
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 종합 점수 */}
        <Card className="bg-card border-border md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            {latestDiag ? (
              <>
                <GradeCircle score={latestDiag.totalScore} grade={latestDiag.grade} />
                <p className="text-sm text-muted-foreground mt-3">종합 점수</p>
                <ScoreChangeIndicator current={latestDiag.totalScore} previous={prevDiag?.totalScore} />
              </>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">진단 이력이 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1">"지금 진단하기" 버튼을 눌러주세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 인용 점수 */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4" />AI 인용 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestDiag ? (
              <>
                <div className="text-3xl font-bold text-foreground">{latestDiag.aiScore}<span className="text-lg text-muted-foreground">점</span></div>
                <ScoreChangeIndicator current={latestDiag.aiScore} previous={prevDiag?.aiScore} />
              </>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="text-2xl font-bold text-muted-foreground/40">--</div>
                <span className="text-[10px] text-muted-foreground mt-1">진단 후 표시</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 진료과 내 순위 */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />{profile.specialty || "전체"} 내 순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myRank ? (
              <>
                <div className="text-3xl font-bold text-foreground">
                  {myRank.rank}<span className="text-lg text-muted-foreground">위</span>
                  <span className="text-sm text-muted-foreground ml-1">/ {myRank.total}개</span>
                </div>
                <span className="text-xs text-brand">상위 {100 - myRank.percentile}%</span>
              </>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="text-2xl font-bold text-muted-foreground/40">--</div>
                <span className="text-[10px] text-muted-foreground mt-1">진단 후 표시</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 진단 횟수 */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />진단 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{history.length}<span className="text-lg text-muted-foreground">회</span></div>
            {latestDiag && (
              <span className="text-xs text-muted-foreground">
                최근: {new Date(latestDiag.diagnosedAt).toLocaleDateString("ko-KR")}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 점수 추이 차트 + 개선 추천 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" />AI 인용 점수 추이
            </CardTitle>
            <CardDescription>진단 이력 기반 점수 변화</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-1 h-40">
                  {history.slice(-12).map((h: any, i: number) => {
                    const maxScore = 100;
                    const height = Math.max(8, (h.totalScore / maxScore) * 100);
                    const color = h.totalScore >= 80 ? "bg-emerald-400" : h.totalScore >= 60 ? "bg-amber-400" : h.totalScore >= 40 ? "bg-orange-400" : "bg-red-400";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{h.totalScore}</span>
                        <div className={`w-full rounded-t ${color} transition-all`} style={{ height: `${height}%` }} title={`${new Date(h.diagnosedAt).toLocaleDateString("ko-KR")} - ${h.totalScore}점`} />
                        <span className="text-[9px] text-muted-foreground">{new Date(h.diagnosedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                진단 이력이 없습니다. "지금 진단하기"를 눌러주세요.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-brand" />개선 추천
            </CardTitle>
            <CardDescription>점수가 낮은 항목 우선</CardDescription>
          </CardHeader>
          <CardContent>
            {improvements && improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {item.percentage >= 70 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : item.percentage >= 40 ? <Clock className="w-5 h-5 text-amber-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{item.category}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full transition-all ${item.percentage >= 70 ? "bg-emerald-400" : item.percentage >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">진단 후 개선 추천이 표시됩니다</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 진료과 내 랭킹 */}
      {ranking && ranking.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand" />{profile.specialty || "전체"} 랭킹
            </CardTitle>
            <CardDescription>같은 진료과 병원 대비 순위</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ranking.slice(0, 10).map((r: any) => (
                <div key={r.url} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${r.isMe ? "bg-brand/10 border border-brand/20" : "bg-muted/30"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${r.rank === 1 ? "bg-amber-400/20 text-amber-400 ring-2 ring-amber-400/40" : r.rank === 2 ? "bg-gray-300/20 text-gray-300 ring-2 ring-gray-300/40" : r.rank === 3 ? "bg-orange-400/20 text-orange-400 ring-2 ring-orange-400/40" : "bg-muted text-muted-foreground"}`}>
                    {r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank-1] : r.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate ${r.isMe ? "text-brand" : "text-foreground"}`}>
                      {r.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      {r.isMe && <span className="ml-2 text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">내 병원</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{r.totalScore}점</div>
                      <div className="text-xs text-muted-foreground">AI: {r.aiScore}점</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 경쟁사 대비 + 시즌 키워드 + 점수 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CompetitorPositionCard />
        <SeasonalKeywordsCard />
        <ScoreComparisonCard />
      </div>
    </div>
  );
}

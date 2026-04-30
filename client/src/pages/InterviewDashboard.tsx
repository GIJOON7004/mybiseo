import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Video, FileText, Image, Film, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Loader2, ArrowRight, Calendar
} from "lucide-react";
import { useLocation } from "wouter";

export default function InterviewDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.interviewContent.dashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "총 인터뷰 영상",
      value: stats.totalVideos,
      icon: Video,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "생성된 블로그",
      value: stats.totalBlogs,
      icon: FileText,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "생성된 카드뉴스",
      value: stats.totalCardnews,
      icon: Image,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      title: "생성된 숏폼 스크립트",
      value: stats.totalShortforms,
      icon: Film,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  const totalContents = stats.totalBlogs + stats.totalCardnews + stats.totalShortforms;

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">인터뷰 콘텐츠 대시보드</h1>
          <p className="text-muted-foreground mt-1">
            인터뷰 영상에서 생성된 모든 콘텐츠를 한눈에 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/interview-calendar")}>
            <Calendar className="w-4 h-4 mr-2" />
            콘텐츠 캘린더
          </Button>
          <Button onClick={() => navigate("/admin/interview-content")}>
            <Video className="w-4 h-4 mr-2" />
            새 인터뷰 업로드
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 콘텐츠 생산 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            콘텐츠 생산 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">총 생산 콘텐츠</span>
              <span className="text-2xl font-bold">{totalContents}개</span>
            </div>
            {stats.totalVideos > 0 && (
              <div className="text-sm text-muted-foreground">
                영상 1개당 평균{" "}
                <span className="font-semibold text-foreground">
                  {(totalContents / stats.totalVideos).toFixed(1)}개
                </span>
                의 콘텐츠가 생산되었습니다
              </div>
            )}
            {/* 콘텐츠 타입별 비율 바 */}
            {totalContents > 0 && (
              <div className="space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${(stats.totalBlogs / totalContents) * 100}%` }}
                  />
                  <div
                    className="bg-pink-500 transition-all"
                    style={{ width: `${(stats.totalCardnews / totalContents) * 100}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all"
                    style={{ width: `${(stats.totalShortforms / totalContents) * 100}%` }}
                  />
                </div>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    블로그 {stats.totalBlogs}개
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    카드뉴스 {stats.totalCardnews}세트
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    숏폼 {stats.totalShortforms}개
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 최근 인터뷰 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            최근 인터뷰 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentVideos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>아직 업로드된 인터뷰 영상이 없습니다</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/admin/interview-content")}
              >
                첫 인터뷰 업로드하기
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentVideos.map((video: any) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/admin/interview-content")}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Video className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {video.topicKeyword || video.fileName || `인터뷰 #${video.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {video.doctorName && `${video.doctorName}`}
                        {video.hospitalName && ` · ${video.hospitalName}`}
                        {video.createdAt && ` · ${new Date(video.createdAt).toLocaleDateString("ko-KR")}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {video.status === "completed" ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        완료
                      </Badge>
                    ) : video.status === "error" ? (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        오류
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        처리중
                      </Badge>
                    )}
                    <div className="flex gap-1">
                      {video.hasBlog && (
                        <Badge variant="secondary" className="text-xs">블로그</Badge>
                      )}
                      {video.hasCardnews && (
                        <Badge variant="secondary" className="text-xs">카드뉴스</Badge>
                      )}
                      {video.hasShortform && (
                        <Badge variant="secondary" className="text-xs">숏폼</Badge>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 월간 AI 인용 어워드 페이지 — /awards
 * "이달의 AI 인용 우수 병원" 공개 페이지
 */
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Star, Crown, ArrowRight, Sparkles } from "lucide-react";

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: typeof Trophy }> = {
  gold: { label: "Gold", color: "text-amber-500 bg-amber-500/10 border-amber-500/30", icon: Crown },
  silver: { label: "Silver", color: "text-gray-400 bg-gray-400/10 border-gray-400/30", icon: Medal },
  bronze: { label: "Bronze", color: "text-orange-600 bg-orange-600/10 border-orange-600/30", icon: Medal },
  top10: { label: "Top 10%", color: "text-blue-500 bg-blue-500/10 border-blue-500/30", icon: Star },
  top30: { label: "Top 30%", color: "text-violet-500 bg-violet-500/10 border-violet-500/30", icon: Star },
};

export default function MonthlyAwards() {
  const { data: awards } = trpc.awards.latest.useQuery();

  const period = awards?.[0]?.period;
  const periodLabel = period ? `${period.slice(0, 4)}년 ${parseInt(period.slice(5, 7))}월` : "이번 달";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container max-w-4xl py-12">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 px-4 py-1.5 mb-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">Monthly Awards</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{periodLabel} AI 인용 우수 병원</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            AI 인용 최적화를 가장 잘 실천한 병원들을 선정하여 매월 발표합니다.
          </p>
        </div>

        {awards && awards.length > 0 ? (
          <div className="space-y-4">
            {awards.map((award, i) => {
              const badge = BADGE_CONFIG[award.badgeType] || BADGE_CONFIG.top30;
              const BadgeIcon = badge.icon;
              return (
                <Card key={i} className={`${i < 3 ? "border-2" : ""} ${
                  i === 0 ? "border-amber-500/40" : i === 1 ? "border-gray-400/40" : i === 2 ? "border-orange-500/40" : ""
                }`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${
                          i === 0 ? "bg-amber-500/20 text-amber-500" :
                          i === 1 ? "bg-gray-400/20 text-gray-400" :
                          i === 2 ? "bg-orange-500/20 text-orange-500" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {award.rank}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{award.hospitalName || new URL(award.url).hostname}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </div>
                          {award.specialty && (
                            <p className="text-xs text-muted-foreground mt-0.5">{award.specialty}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">종합 점수</p>
                          <p className="text-xl font-bold">{award.totalScore}<span className="text-xs text-muted-foreground">점</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">AI 인용</p>
                          <p className="text-xl font-bold text-violet-500">{award.aiScore}<span className="text-xs text-muted-foreground">%</span></p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 어워드 데이터가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">
              충분한 진단 데이터가 수집되면 매월 우수 병원을 선정합니다.<br />
              먼저 무료 진단을 받아보세요!
            </p>
            <Link href="/seo-checker">
              <Button className="bg-gradient-to-r from-violet-600 to-blue-600 text-white">
                무료 AI 인용 진단받기 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/20">
            <CardContent className="p-8">
              <Trophy className="mx-auto h-10 w-10 text-amber-500 mb-3" />
              <h3 className="text-xl font-bold mb-2">다음 달 어워드에 도전하세요!</h3>
              <p className="text-sm text-muted-foreground mb-5">
                MY비서의 AI 마케팅 서비스로 병원 사이트를 최적화하면<br />
                어워드 상위권에 오를 수 있습니다.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/seo-checker">
                  <Button variant="outline" className="rounded-full">
                    무료 진단받기
                  </Button>
                </Link>
                <Link href="/#contact">
                  <Button className="bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full">
                    최적화 상담 신청
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 뉴스레터 */}
        <div className="mt-8">
          <NewsletterSubscribe source="awards" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

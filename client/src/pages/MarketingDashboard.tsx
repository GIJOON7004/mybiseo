import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Video, Mail, Lightbulb, Zap, ScrollText, CalendarDays, Stethoscope, BookOpen, ClipboardCheck } from "lucide-react";

function StatCard({ title, value, icon: Icon, color = "text-primary" }: { title: string; value: number; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketingDashboard() {
  const { data: stats, isLoading } = trpc.marketingDashboard.stats.useQuery();

  const s = stats || {
    ideas: 0, hooks: 0, scripts: 0, calendarItems: 0,
    videoPrompts: 0, diagnoses: 0, emailContacts: 0,
    treatmentPages: 0, benchmarkReports: 0, blogPosts: 0,
  };

  const totalContents = s.ideas + s.hooks + s.scripts + s.videoPrompts + s.blogPosts;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" />마케팅 성과 대시보드</h2>
        <p className="text-muted-foreground mt-1">병원 마케팅 콘텐츠 생산 현황을 한눈에 확인하세요.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          {/* 콘텐츠 생산 현황 */}
          <Card>
            <CardHeader><CardTitle className="text-base">콘텐츠 생산 현황</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard title="아이디어" value={s.ideas} icon={Lightbulb} color="text-yellow-500" />
                <StatCard title="훅 라이브러리" value={s.hooks} icon={Zap} color="text-orange-500" />
                <StatCard title="대본" value={s.scripts} icon={ScrollText} color="text-blue-500" />
                <StatCard title="영상 프롬프트" value={s.videoPrompts} icon={Video} color="text-purple-500" />
                <StatCard title="블로그 포스트" value={s.blogPosts} icon={BookOpen} color="text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* 마케팅 자산 현황 */}
          <Card>
            <CardHeader><CardTitle className="text-base">마케팅 자산 현황</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard title="시술 상세페이지" value={s.treatmentPages} icon={FileText} color="text-indigo-500" />
                <StatCard title="벤치마킹 리포트" value={s.benchmarkReports} icon={ClipboardCheck} color="text-teal-500" />
                <StatCard title="AI 검색 진단" value={s.diagnoses} icon={Stethoscope} color="text-red-500" />
                <StatCard title="이메일 연락처" value={s.emailContacts} icon={Mail} color="text-sky-500" />
                <StatCard title="캘린더 일정" value={s.calendarItems} icon={CalendarDays} color="text-pink-500" />
              </div>
            </CardContent>
          </Card>

          {/* 요약 */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{totalContents}</p>
                <p className="text-muted-foreground mt-1">총 콘텐츠 생산량</p>
                <p className="text-xs text-muted-foreground mt-2">아이디어 + 훅 + 대본 + 영상 프롬프트 + 블로그 포스트</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

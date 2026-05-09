import { systemRouter } from "./_core/systemRouter";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addSeasonalKeyword, aggregateMonthlyBenchmark, deleteSeasonalKeyword, generateMonthlyAwards,
  getActiveSubscribers, getAdminNotifications, getAllSeoLeads, getBenchmarkByRegion,
  getBenchmarkBySpecialty, getBlogStats, getCategoryStats, getCompetitorComparison,
  getCompetitorTrend, getConsultationPipeline, getCurrentSeasonalRecommendations, getDiagnosisHistoryByUrl,
  getHospitalProfileByUserId, getInquiryStats, getLatestBenchmarks, getMonthlyAwards,
  getRecentConsultations, getRecentUserEvents, getRegionStats, getSeasonalKeywords,
  getSeasonalSpecialties, getSeoLeadStats, getSpecialtyStats, getSubscriberCount,
  getTopBlogPosts, getUnreadNotificationCount, getUserEventStats, insertConsultationInquiry,
  insertSiteVisit, logUserEvent, markAllNotificationsRead, markNotificationRead,
  recalculateLeadScores, saveBenchmarkData, saveDiagnosisHistory, subscribeNewsletter,
  unsubscribeNewsletter, updateConsultationNote, updateConsultationStatus, updateSeoLeadStatus,
} from "./db";
import { generateOptimizationPlan } from "./lib/auto-optimizer";
import { getNotificationChannelStatus } from "./notifier";
import { analyzeSeo, type CountryCode } from "./seo-analyzer";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// === 분할된 라우터 import ===
import { adFactoryRouter } from "./routes/adFactory";
import { interviewContentRouter } from "./routes/interviewContent";
import { aiHubRouter } from "./routes/aiHub";
import { aiMonitorRouter } from "./routes/aiMonitor";
import { analyticsRouter } from "./routes/analytics";
import { automationRouter } from "./routes/automation";
import { benchmarkingReportRouter, benchmarkingPdfRouter } from "./routes/benchmarkingReport";
import { blogRouter, blogSchedulerRouter } from "./routes/blog";
import { chatRouter, chatInsightRouter } from "./routes/chat";
import { contentFactoryRouter } from "./routes/contentFactory";
import { seoEmailRouter, emailContactRouter, retargetEmailRouter } from "./routes/email";
import { inquiryRouter, kakaoBookingRouter, aiSnsTipsRouter } from "./routes/engagement";
import { myHospitalRouter, myHospitalExtendedRouter, hospitalInfoRouter } from "./routes/hospital";
import { marketingChannelRouter, videoMarketingRouter, marketingDashboardRouter } from "./routes/marketingChannel";
import { monthlyReportRouter, adminDashboardRouter } from "./routes/report";
import { seoKeywordRouter, seoAnalyzerRouter } from "./routes/seo";
import { snsRouter } from "./routes/sns";
import { treatmentPageRouter } from "./routes/treatmentPage";
import { abtestRouter, diagnosisAutomationRouter } from "./routes/abtest";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  inquiry: inquiryRouter,
  notification: router({
    channels: adminProcedure.query(() => {
      return getNotificationChannelStatus();
    }),
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getAdminNotifications(input?.limit ?? 50);
      }),
    unreadCount: adminProcedure
      .query(async () => {
        return getUnreadNotificationCount();
      }),
    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.id);
        return { ok: true };
      }),
    markAllRead: adminProcedure
      .mutation(async () => {
        await markAllNotificationsRead();
        return { ok: true };
      }),
  }),
  blog: blogRouter,
  sns: snsRouter,
  seoKeyword: seoKeywordRouter,
  seoDashboard: router({
    stats: adminProcedure.query(async () => {
      return getBlogStats();
    }),

    topPosts: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getTopBlogPosts(input?.limit ?? 10);
      }),

    categoryStats: adminProcedure.query(async () => {
      return getCategoryStats();
    }),

    inquiryConversion: adminProcedure.query(async () => {
      const stats = await getBlogStats();
      const inquiryStats = await getInquiryStats();
      return {
        totalViews: stats.totalViews,
        totalInquiries: inquiryStats.total,
        conversionRate: stats.totalViews > 0
          ? ((inquiryStats.total / stats.totalViews) * 100).toFixed(2)
          : "0.00",
      };
    }),
  }),
  blogScheduler: blogSchedulerRouter,
  abtest: abtestRouter,
  diagnosisAutomation: diagnosisAutomationRouter,
  chat: chatRouter,
  seoAnalyzer: seoAnalyzerRouter,
  aiMonitor: aiMonitorRouter,
  seoLeads: router({
    getStats: adminProcedure.query(async () => {
      return getSeoLeadStats();
    }),
    getAll: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getAllSeoLeads(input?.limit ?? 100);
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "consulting", "contracted", "lost"]),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateSeoLeadStatus(input.id, input.status, input.note);
        return { success: true };
      }),
  }),
  monthlyReport: monthlyReportRouter,
  seoEmail: seoEmailRouter,
  diagnosis: router({
    history: publicProcedure
      .input(z.object({ url: z.string().min(1) }))
      .query(async ({ input }) => {
        return getDiagnosisHistoryByUrl(input.url);
      }),
    save: publicProcedure
      .input(z.object({
        url: z.string().min(1),
        totalScore: z.number(),
        aiScore: z.number(),
        grade: z.string(),
        specialty: z.string().optional(),
        region: z.string().optional(),
        categoryScores: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await saveDiagnosisHistory(input);
        return { success: true };
      }),
    benchmarkBySpecialty: publicProcedure
      .input(z.object({ specialty: z.string() }))
      .query(async ({ input }) => {
        return getBenchmarkBySpecialty(input.specialty);
      }),
    benchmarkByRegion: publicProcedure
      .input(z.object({ region: z.string() }))
      .query(async ({ input }) => {
        return getBenchmarkByRegion(input.region);
      }),
    latestBenchmarks: publicProcedure.query(async () => {
      return getLatestBenchmarks();
    }),
    specialtyStats: publicProcedure.query(async () => {
      return getSpecialtyStats();
    }),
    regionStats: publicProcedure.query(async () => {
      return getRegionStats();
    }),
  }),
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        hospitalName: z.string().optional(),
        specialty: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await subscribeNewsletter(input);
        // 관리자에게 알림
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: "[뉴스레터] 새 구독자",
          content: `이메일: ${input.email}\n병원명: ${input.hospitalName || '-'}\n진료과: ${input.specialty || '-'}`,
        });
        return { success: true };
      }),
    unsubscribe: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        await unsubscribeNewsletter(input.email);
        return { success: true };
      }),
    count: publicProcedure.query(async () => {
      return getSubscriberCount();
    }),
    list: adminProcedure.query(async () => {
      return getActiveSubscribers();
    }),
  }),
  awards: router({
    latest: publicProcedure.query(async () => {
      return getMonthlyAwards();
    }),
    byPeriod: publicProcedure
      .input(z.object({ period: z.string() }))
      .query(async ({ input }) => {
        return getMonthlyAwards(input.period);
      }),
  }),
  adminDashboard: adminDashboardRouter,
  batchDiagnosis: router({
    run: adminProcedure
      .input(z.object({
        urls: z.array(z.string().min(1)).min(1).max(50),
        specialty: z.string().optional(),
        region: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const results: { url: string; success: boolean; totalScore?: number; aiScore?: number; grade?: string; error?: string }[] = [];
        for (const url of input.urls) {
          try {
            const result = await analyzeSeo(url, input.specialty);
            const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
            const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
            // 진단이력 저장
            await saveDiagnosisHistory({
              url: result.url,
              totalScore: result.totalScore,
              aiScore,
              grade: result.grade,
              specialty: input.specialty,
              region: input.region,
              categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
            });
            // 벤치마크 데이터 저장
            if (input.specialty) {
              const now = new Date();
              const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              await saveBenchmarkData({
                specialty: input.specialty,
                region: input.region || "전국",
                avgTotalScore: result.totalScore,
                avgAiScore: aiScore,
                sampleCount: 1,
                period,
              });
            }
            results.push({ url: result.url, success: true, totalScore: result.totalScore, aiScore, grade: result.grade });
          } catch (e: any) {
            results.push({ url, success: false, error: e.message?.slice(0, 100) || "분석 실패" });
          }
        }
        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        return { results, summary: { total: input.urls.length, succeeded, failed } };
      }),
  }),
  retargetEmail: retargetEmailRouter,
  myHospital: myHospitalRouter,
  chatInsight: chatInsightRouter,
  userEvent: router({
    // 이벤트 기록 (public - 비로그인 사용자도 기록)
    log: publicProcedure
      .input(z.object({
        eventType: z.string().min(1),
        page: z.string().optional(),
        metadata: z.string().optional(),
        sessionId: z.string().optional(),
        visitorId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await logUserEvent({
            eventType: input.eventType,
            page: input.page || null,
            metadata: input.metadata || null,
            sessionId: input.sessionId || null,
            visitorId: input.visitorId || null,
            userId: (ctx as any).user?.id || null,
            ipHash: null,
            userAgent: null,
            referrer: null,
          });
        } catch (e) {
          // 이벤트 로깅 실패는 사용자 경험에 영향 주지 않도록 무시
          console.error("[UserEvent] 로깅 실패:", e);
        }
        return { ok: true };
      }),
    // 통계 조회 (관리자)
    getStats: adminProcedure
      .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => {
        return getUserEventStats(input?.days ?? 30);
      }),
    // 최근 이벤트 (관리자)
    getRecent: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
      .query(async ({ input }) => {
        return getRecentUserEvents(input?.limit ?? 100);
      }),
  }),
  monthlyBenchmark: router({
    // 월간 벤치마크 수동 집계 (관리자)
    aggregate: adminProcedure
      .input(z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }))
      .mutation(async ({ input }) => {
        const benchmarks = await aggregateMonthlyBenchmark(input.period);
        const awards = await generateMonthlyAwards(input.period);
        return { benchmarks, awards };
      }),
    // 어워드 조회
    getAwards: publicProcedure
      .input(z.object({ period: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getMonthlyAwards(input?.period);
      }),
  }),
  leadScoring: router({
    // 리드 점수 재계산 (관리자)
    recalculate: adminProcedure.mutation(async () => {
      return recalculateLeadScores();
    }),
  }),
  seasonalCalendar: router({
    // 추천 키워드 조회 (이번 달 + 다음 달)
    getRecommendations: publicProcedure
      .input(z.object({ specialty: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getCurrentSeasonalRecommendations(input?.specialty);
      }),
    // 전체 키워드 조회 (필터)
    getAll: publicProcedure
      .input(z.object({
        specialty: z.string().optional(),
        month: z.number().min(1).max(12).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getSeasonalKeywords(input?.specialty, input?.month);
      }),
    // 등록된 진료과 목록
    getSpecialties: publicProcedure.query(async () => {
      return getSeasonalSpecialties();
    }),
    // 키워드 추가 (관리자)
    add: adminProcedure
      .input(z.object({
        specialty: z.string().min(1),
        month: z.number().min(1).max(12),
        keyword: z.string().min(1),
        category: z.enum(["시술", "이벤트", "건강정보", "프로모션"]),
        description: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        tips: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await addSeasonalKeyword(input);
        return { success: true };
      }),
    // 키워드 삭제 (관리자)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSeasonalKeyword(input.id);
        return { success: true };
      }),
  }),
  competitorAnalysis: router({
    // 경쟁사 비교 분석 (키워드별)
    getComparison: adminProcedure
      .input(z.object({ keywordId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getCompetitorComparison(input?.keywordId);
      }),
    // 경쟁사 vs 우리 병원 시계열 트렌드
    getTrend: adminProcedure
      .input(z.object({
        keywordId: z.number(),
        weeks: z.number().min(1).max(52).optional(),
      }))
      .query(async ({ input }) => {
        return getCompetitorTrend(input.keywordId, input.weeks ?? 8);
      }),
  }),
  autoOptimizer: router({
    // 진단 결과 기반 자동 최적화 계획 생성
    generatePlan: publicProcedure
      .input(z.object({
        url: z.string().min(1),
        specialty: z.string().optional(),
        country: z.enum(["kr", "th"]).optional().default("kr"),
      }))
      .mutation(async ({ input }) => {
        const result = await analyzeSeo(input.url, input.specialty, input.country as CountryCode);
        const plan = generateOptimizationPlan(result);
        return plan;
      }),
    // 특정 항목의 AI 기반 맞춤 수정 코드 생성 (LLM 활용)
    generateCustomFix: protectedProcedure
      .input(z.object({
        url: z.string(),
        itemName: z.string(),
        currentIssue: z.string(),
        specialty: z.string().optional(),
        hospitalName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 병원 웹사이트 SEO 전문가입니다. 사용자가 제공한 문제점에 대해 구체적인 수정 코드를 생성해주세요.
반드시 복사-붙여넣기 가능한 실제 코드를 제공하세요.
병원명: ${input.hospitalName || "병원"}
진료과: ${input.specialty || "일반"}
URL: ${input.url}`,
            },
            {
              role: "user",
              content: `문제 항목: ${input.itemName}\n현재 문제: ${input.currentIssue}\n\n이 문제를 해결할 수 있는 구체적인 코드 스니펫을 생성해주세요. HTML, 메타태그, JSON-LD 등 필요한 코드를 모두 포함해주세요.`,
            },
          ],
        });
        return {
          customCode: response.choices?.[0]?.message?.content || "코드 생성에 실패했습니다.",
          generatedAt: new Date().toISOString(),
        };
      }),
  }),
  myHospitalExtended: myHospitalExtendedRouter,
  tracking: router({
    // 페이지뷰 기록 (추적 코드에서 호출 - 공개 API)
    pageview: publicProcedure
      .input(z.object({
        hospitalId: z.number(),
        visitorId: z.string(),
        sessionId: z.string(),
        channel: z.enum(["ai_chatgpt", "ai_gemini", "ai_claude", "ai_perplexity", "ai_copilot", "ai_other", "naver", "google", "sns_instagram", "sns_youtube", "sns_blog", "direct", "referral", "other"]),
        referrer: z.string().optional(),
        landingPage: z.string(),
        pageUrl: z.string(),
        pageTitle: z.string().optional(),
        deviceType: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
        country: z.string().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertSiteVisit(input);
        return { ok: true };
      }),

    // 상담 문의 수신 (병원 웹사이트 상담 폼에서 호출 - 공개 API)
    inquiry: publicProcedure
      .input(z.object({
        hospitalId: z.number(),
        patientName: z.string().optional(),
        patientPhone: z.string().optional(),
        patientEmail: z.string().optional(),
        treatmentType: z.string().optional(),
        message: z.string().optional(),
        channel: z.string().optional(),
        visitorId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertConsultationInquiry(input);
        return { ok: true };
      }),
  }),
  analytics: analyticsRouter,
  hospitalInfo: hospitalInfoRouter,
  crm: router({
    pipeline: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "병원 프로필을 먼저 등록해주세요." });
      return getConsultationPipeline(profile.id);
    }),
    list: protectedProcedure
      .input(z.object({ status: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await getHospitalProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return getRecentConsultations(profile.id, input.limit ?? 20, input.status);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "contacted", "completed", "cancelled"]) }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getHospitalProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        await updateConsultationStatus(input.id, input.status);
        return { ok: true };
      }),
    updateNote: protectedProcedure
      .input(z.object({ id: z.number(), note: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getHospitalProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        await updateConsultationNote(input.id, profile.id, input.note);
        return { ok: true };
      }),
  }),
  aiHub: aiHubRouter,
  benchmarkingReport: benchmarkingReportRouter,
  emailContact: emailContactRouter,
  benchmarkingPdf: benchmarkingPdfRouter,
  aiSnsTips: aiSnsTipsRouter,
  treatmentPage: treatmentPageRouter,
  automation: automationRouter,
  marketingChannel: marketingChannelRouter,
  kakaoBooking: kakaoBookingRouter,
  contentFactory: contentFactoryRouter,
  videoMarketing: videoMarketingRouter,
  marketingDashboard: marketingDashboardRouter,
  adFactory: adFactoryRouter,
  interviewContent: interviewContentRouter,
});
export type AppRouter = typeof appRouter;

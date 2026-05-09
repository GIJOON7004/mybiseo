/**
 * routes/misc.ts — routers.ts에서 추출된 인라인 라우터 모음
 * notification, seoDashboard, seoLeads, diagnosis, newsletter, awards,
 * batchDiagnosis, userEvent, monthlyBenchmark, leadScoring, seasonalCalendar,
 * competitorAnalysis, autoOptimizer, tracking, crm
 */
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
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
} from "../db";
import { generateOptimizationPlan } from "../lib/auto-optimizer";
import { getNotificationChannelStatus } from "../notifier";
import { analyzeSeo, type CountryCode } from "../seo-analyzer";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const notificationRouter = router({
  channels: adminProcedure.query(() => {
    return getNotificationChannelStatus();
  }),
  list: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getAdminNotifications(input?.limit ?? 50);
    }),
  unreadCount: adminProcedure.query(async () => {
    return getUnreadNotificationCount();
  }),
  markRead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { ok: true };
    }),
  markAllRead: adminProcedure.mutation(async () => {
    await markAllNotificationsRead();
    return { ok: true };
  }),
});

export const seoDashboardRouter = router({
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
});

export const seoLeadsRouter = router({
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
});

export const diagnosisRouter = router({
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
});

export const newsletterRouter = router({
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
      const { notifyOwner } = await import("../_core/notification");
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
});

export const awardsRouter = router({
  latest: publicProcedure.query(async () => {
    return getMonthlyAwards();
  }),
  byPeriod: publicProcedure
    .input(z.object({ period: z.string() }))
    .query(async ({ input }) => {
      return getMonthlyAwards(input.period);
    }),
});

export const batchDiagnosisRouter = router({
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
          await saveDiagnosisHistory({
            url: result.url,
            totalScore: result.totalScore,
            aiScore,
            grade: result.grade,
            specialty: input.specialty,
            region: input.region,
            categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
          });
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
});

export const userEventRouter = router({
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
          userId: ctx.user?.id || null,
          ipHash: null,
          userAgent: null,
          referrer: null,
        });
      } catch (e) {
        console.error("[UserEvent] 로깅 실패:", e);
      }
      return { ok: true };
    }),
  getStats: adminProcedure
    .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
    .query(async ({ input }) => {
      return getUserEventStats(input?.days ?? 30);
    }),
  getRecent: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input }) => {
      return getRecentUserEvents(input?.limit ?? 100);
    }),
});

export const monthlyBenchmarkRouter = router({
  aggregate: adminProcedure
    .input(z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }))
    .mutation(async ({ input }) => {
      const benchmarks = await aggregateMonthlyBenchmark(input.period);
      const awards = await generateMonthlyAwards(input.period);
      return { benchmarks, awards };
    }),
  getAwards: publicProcedure
    .input(z.object({ period: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getMonthlyAwards(input?.period);
    }),
});

export const leadScoringRouter = router({
  recalculate: adminProcedure.mutation(async () => {
    return recalculateLeadScores();
  }),
});

export const seasonalCalendarRouter = router({
  getRecommendations: publicProcedure
    .input(z.object({ specialty: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getCurrentSeasonalRecommendations(input?.specialty);
    }),
  getAll: publicProcedure
    .input(z.object({
      specialty: z.string().optional(),
      month: z.number().min(1).max(12).optional(),
    }).optional())
    .query(async ({ input }) => {
      return getSeasonalKeywords(input?.specialty, input?.month);
    }),
  getSpecialties: publicProcedure.query(async () => {
    return getSeasonalSpecialties();
  }),
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
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSeasonalKeyword(input.id);
      return { success: true };
    }),
});

export const competitorAnalysisRouter = router({
  getComparison: adminProcedure
    .input(z.object({ keywordId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getCompetitorComparison(input?.keywordId);
    }),
  getTrend: adminProcedure
    .input(z.object({
      keywordId: z.number(),
      weeks: z.number().min(1).max(52).optional(),
    }))
    .query(async ({ input }) => {
      return getCompetitorTrend(input.keywordId, input.weeks ?? 8);
    }),
});

export const autoOptimizerRouter = router({
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
});

export const trackingRouter = router({
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
});

export const crmRouter = router({
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
});

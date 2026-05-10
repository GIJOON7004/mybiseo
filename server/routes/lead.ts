/**
 * routes/lead.ts — 뉴스레터, 어워드, 리드 스코어링, SEO 리드 라우터
 */
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getActiveSubscribers,
  getAllSeoLeads,
  getBlogStats,
  getCategoryStats,
  getInquiryStats,
  getMonthlyAwards,
  getSeoLeadStats,
  getSubscriberCount,
  getTopBlogPosts,
  recalculateLeadScores,
  subscribeNewsletter,
  unsubscribeNewsletter,
  updateSeoLeadStatus,
} from "../db";
import { z } from "zod";

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

export const leadScoringRouter = router({
  recalculate: adminProcedure.mutation(async () => {
    return recalculateLeadScores();
  }),
});

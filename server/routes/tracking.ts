/**
 * routes/tracking.ts — 사이트 추적, CRM, 유저 이벤트 라우터
 */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getConsultationPipeline,
  getHospitalProfileByUserId,
  getRecentConsultations,
  getRecentUserEvents,
  getUserEventStats,
  insertConsultationInquiry,
  insertSiteVisit,
  logUserEvent,
  updateConsultationNote,
  updateConsultationStatus,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
  getStats: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
    .query(async ({ input }) => {
      return getUserEventStats(input?.days ?? 30);
    }),
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input }) => {
      return getRecentUserEvents(input?.limit ?? 100);
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

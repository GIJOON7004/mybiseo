/**
 * analytics 라우터
 * routers.ts에서 분할 — analytics
 */

import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAiChannelDetail, getConsultationByChannel, getConsultationMonthlyTrend, getConsultationStats,
  getConsultationsByHospital, getDailyVisitTrend, getDeviceStats, getDiagnosisHistoryByUrl,
  getHospitalProfileByUserId, getHourlyDistribution, getMonthlyInquirySummary, getMonthlyReportsByHospital,
  getMonthlyVisitSummary, getSiteVisitStats, getTopPages, getVisitorFunnel,
  insertMonthlyReport, updateConsultationStatus,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const analyticsRouter = router({
  // 채널별 방문 통계
  visitStats: protectedProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return { channels: [], total: 0, uniqueVisitors: 0 };
      const stats = await getSiteVisitStats(profile.id, new Date(input.from), new Date(input.to));
      const total = stats?.reduce((s, r) => s + Number(r.count), 0) ?? 0;
      const uniqueVisitors = stats?.reduce((s, r) => s + Number(r.uniqueVisitors), 0) ?? 0;
      return { channels: stats ?? [], total, uniqueVisitors };
    }),

  // 인기 페이지 TOP N
  topPages: protectedProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getTopPages(profile.id, new Date(input.from), new Date(input.to), input.limit);
    }),

  // 일별 방문 추이
  dailyTrend: protectedProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getDailyVisitTrend(profile.id, new Date(input.from), new Date(input.to));
    }),

  // 디바이스별 방문 통계
  deviceStats: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getDeviceStats(profile.id, new Date(input.from), new Date(input.to));
    }),

  // AI 채널 상세 분석
  aiChannelDetail: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getAiChannelDetail(profile.id, new Date(input.from), new Date(input.to));
    }),

  // 시간대별 방문 분포
  hourlyDistribution: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getHourlyDistribution(profile.id, new Date(input.from), new Date(input.to));
    }),

  // 상담 문의 목록
  consultations: protectedProcedure
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getConsultationsByHospital(
        profile.id,
        input?.from ? new Date(input.from) : undefined,
        input?.to ? new Date(input.to) : undefined
      );
    }),

  // 상담 상태 업데이트
  updateConsultation: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "contacted", "completed", "cancelled"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateConsultationStatus(input.id, input.status, input.note);
      return { ok: true };
    }),

  // 상담 통계 (상태별 집계 + 전환율)
  consultationStats: protectedProcedure
    .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return { total: 0, pending: 0, contacted: 0, completed: 0, cancelled: 0, conversionRate: "0%" };
      return getConsultationStats(
        profile.id,
        input?.from ? new Date(input.from) : undefined,
        input?.to ? new Date(input.to) : undefined
      );
    }),

  // 채널별 상담 문의 집계
  consultationByChannel: protectedProcedure
    .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getConsultationByChannel(
        profile.id,
        input?.from ? new Date(input.from) : undefined,
        input?.to ? new Date(input.to) : undefined
      );
    }),

  // 월별 상담 추이
  consultationMonthlyTrend: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getConsultationMonthlyTrend(profile.id);
    }),

  // 방문자 행동 퍼널
  visitorFunnel: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return { totalVisitors: 0, pageViewers: 0, multiPageViewers: 0, inquirySubmitters: 0 };
      return getVisitorFunnel(profile.id, new Date(input.from), new Date(input.to));
    }),

  // 월간 리포트 목록
  monthlyReports: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getMonthlyReportsByHospital(profile.id);
    }),

  // 월간 리포트 수동 생성
  generateMonthlyReport: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "병원 프로필이 없습니다" });

      // 방문 데이터 집계
      const visitSummary = await getMonthlyVisitSummary(profile.id, input.year, input.month);
      // 상담 데이터 집계
      const inquirySummary = await getMonthlyInquirySummary(profile.id, input.year, input.month);

      // 최근 진단 점수 가져오기
      const history = await getDiagnosisHistoryByUrl(profile.hospitalUrl);
      const latestDiag = history.length > 0 ? history[history.length - 1] : null;
      const prevMonthDiag = history.length > 1 ? history[history.length - 2] : null;

      // AI로 요약 및 추천 생성
      let summary = "";
      let recommendations = "";
      try {
        const llmRes = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 병원 마케팅 전문 컨설턴트입니다. 월간 성과 데이터를 분석하여 간결한 요약과 구체적인 개선 추천을 한국어로 작성해주세요." },
            { role: "user", content: `${input.year}년 ${input.month}월 ${profile.hospitalName} 성과:\n- SEO 점수: ${latestDiag?.totalScore ?? "N/A"}\n- AI 인용 점수: ${latestDiag?.aiScore ?? "N/A"}\n- 총 방문: ${visitSummary?.totalVisits ?? 0} (AI: ${visitSummary?.aiChannelVisits ?? 0}, 네이버: ${visitSummary?.naverVisits ?? 0}, 구글: ${visitSummary?.googleVisits ?? 0})\n- 상담 문의: ${inquirySummary.totalInquiries}건 (전환율: ${inquirySummary.conversionRate})\n\n1) 3줄 이내 요약\n2) 3가지 구체적 개선 추천` },
          ],
        });
        const rawContent = llmRes.choices?.[0]?.message?.content ?? "";
        const content = typeof rawContent === "string" ? rawContent : "";
        const parts = content.split(/추천|개선/);
        summary = parts[0]?.trim().slice(0, 500) || content.slice(0, 300);
        recommendations = parts.slice(1).join("\n").trim().slice(0, 500) || "데이터가 더 축적되면 구체적인 추천이 제공됩니다.";
      } catch {
        summary = `${input.year}년 ${input.month}월 총 ${visitSummary?.totalVisits ?? 0}회 방문, ${inquirySummary.totalInquiries}건 상담 문의가 접수되었습니다.`;
        recommendations = "추적 코드를 통한 데이터 수집을 지속하고, AI 채널 노출을 강화해주세요.";
      }

      // DB 저장
      await insertMonthlyReport({
        hospitalId: profile.id,
        year: input.year,
        month: input.month,
        seoScore: latestDiag ? Number(latestDiag.totalScore) : null,
        seoScoreChange: latestDiag && prevMonthDiag ? Number(latestDiag.totalScore) - Number(prevMonthDiag.totalScore) : null,
        aiExposureScore: latestDiag ? Number(latestDiag.aiScore) : null,
        aiExposureChange: latestDiag && prevMonthDiag ? Number(latestDiag.aiScore) - Number(prevMonthDiag.aiScore) : null,
        totalVisits: visitSummary?.totalVisits ?? 0,
        aiChannelVisits: visitSummary?.aiChannelVisits ?? 0,
        naverVisits: visitSummary?.naverVisits ?? 0,
        googleVisits: visitSummary?.googleVisits ?? 0,
        snsVisits: visitSummary?.snsVisits ?? 0,
        directVisits: visitSummary?.directVisits ?? 0,
        totalInquiries: inquirySummary.totalInquiries,
        conversionRate: inquirySummary.conversionRate,
        summary,
        recommendations,
      });

      return { ok: true };
    }),
});

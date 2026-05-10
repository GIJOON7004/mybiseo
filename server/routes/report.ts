/**
 * report 라우터
 * routers.ts에서 분할 — monthlyReport, adminDashboard
 */

import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getActiveHospitalProfiles, getAdminChannelStats, getAdminHospitalOverview, getAllSeoLeads,
  getDailyDiagnosisCounts, getDiagnosisStats, getHospitalPerformanceRanking, getLeadFunnelStats,
  getHospitalProfileByUserId, getMonthlyReportById, getMonthlyReportByShareToken,
  getRecentDiagnoses, getRegionStats,
  getScoreDistribution, getSpecialtyStats, getSubscriberCount, getTopDiagnosedUrls,
  saveDiagnosisHistory, setMonthlyReportShareToken, updateMonthlyReportPdfUrl,
} from "../db";
import { buildMonthlyReportHtml } from "../monthly-report-html";
import { sendEmailViaNaver } from "../notifier";
import { analyzeSeo } from "../seo-analyzer";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createLogger } from "../lib/logger";
const logger = createLogger("report");

export const monthlyReportRouter = router({
  sendToContracted: adminProcedure.mutation(async () => {
    // 계약 완료 리드들에게 월간 AI 인용 리포트 발송
    const allLeads = await getAllSeoLeads(500);
    const contracted = allLeads.filter(l => l.status === "contracted");
    if (contracted.length === 0) return { sent: 0, failed: 0, message: "계약 완료 리드가 없습니다" };

    let sent = 0;
    let failed = 0;
    const now = new Date();
    const monthStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

    for (const lead of contracted) {
      try {
        // 해당 URL 재분석
        const result = await analyzeSeo(lead.url);
        const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
        const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
        const prevScore = lead.totalScore ?? 0;
        const scoreDiff = result.totalScore - prevScore;

        const { buildMonthlyReportEmail } = await import("../email-templates");
        const emailHtml = buildMonthlyReportEmail({
          monthStr,
          url: lead.url,
          totalScore: result.totalScore,
          aiScore,
          prevScore,
          scoreDiff,
          categories: result.categories,
        });

        const emailSent = await sendEmailViaNaver({
          to: lead.email,
          subject: `[MY비서] ${monthStr} AI+포털 노출 리포트 (${lead.url})`,
          html: emailHtml,
          text: `${monthStr} AI+포털 노출 리포트\nURL: ${lead.url}\n종합: ${result.totalScore}점 | AI: ${aiScore}% | 변화: ${scoreDiff > 0 ? "+" : ""}${scoreDiff}점`,
        });

        if (emailSent) sent++; else failed++;
      } catch (err) {
        logger.error(`[MonthlyReport] Failed for ${lead.email}:`, err);
        failed++;
      }
    }

    return { sent, failed, message: `${sent}건 발송 완료, ${failed}건 실패` };
  }),

  // 월간 리포트 PDF 생성 + S3 업로드
  generatePdf: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input }) => {
      const report = await getMonthlyReportById(input.reportId);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "리포트를 찾을 수 없습니다" });

      // 간단한 HTML 기반 PDF 생성 (pdfkit 대신 HTML 템플릿 사용)
      const { storagePut } = await import("../storage");
      const crypto = await import("crypto");

      const htmlContent = buildMonthlyReportHtml(report);
      const fileKey = `monthly-reports/${report.hospitalId}-${report.year}-${String(report.month).padStart(2, "0")}-${crypto.randomBytes(4).toString("hex")}.html`;
      const { url } = await storagePut(fileKey, htmlContent, "text/html");
      await updateMonthlyReportPdfUrl(report.id, url);
      return { url };
    }),

  // 공유 링크 생성
  createShareLink: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input }) => {
      const report = await getMonthlyReportById(input.reportId);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "리포트를 찾을 수 없습니다" });
      const { nanoid } = await import("nanoid");
      const token = nanoid(21);
      await setMonthlyReportShareToken(report.id, token);
      return { token };
    }),

  // 공유 링크로 리포트 조회 (공개 + 소유권 검증)
  // Rate Limit: IP당 1분 30회 (rate-limit.ts에서 등록)
  // 소유권: 로그인 사용자라면 자신의 병원 리포트인지 확인
  getByShareToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const report = await getMonthlyReportByShareToken(input.token);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "리포트를 찾을 수 없거나 링크가 만료되었습니다" });

      // 소유권 검증: 로그인 사용자라면 자신의 병원 리포트인지 확인
      // 비로그인 사용자(ctx.user === null)는 공개 접근 허용 (공유 링크 본래 목적)
      if (ctx.user) {
        const profile = await getHospitalProfileByUserId(ctx.user.id);
        // 로그인 사용자이지만 병원 프로필이 없는 경우(admin 등) → 허용
        if (profile && profile.id !== report.hospitalId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "이 리포트에 대한 접근 권한이 없습니다",
          });
        }
      }

      return report;
    }),
});

export const adminDashboardRouter = router({
  diagnosisStats: adminProcedure.query(async () => {
    return getDiagnosisStats();
  }),
  dailyCounts: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      return getDailyDiagnosisCounts(input?.days ?? 30);
    }),
  scoreDistribution: adminProcedure.query(async () => {
    return getScoreDistribution();
  }),
  topUrls: adminProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      return getTopDiagnosedUrls(input?.limit ?? 20);
    }),
  specialtyStats: adminProcedure.query(async () => {
    return getSpecialtyStats();
  }),
  regionStats: adminProcedure.query(async () => {
    return getRegionStats();
  }),
  leadFunnel: adminProcedure.query(async () => {
    return getLeadFunnelStats();
  }),
  subscriberCount: adminProcedure.query(async () => {
    return getSubscriberCount();
  }),
  // 10번: 전체 병원 현황 대시보드
  hospitalOverview: adminProcedure.query(async () => {
    return getAdminHospitalOverview();
  }),
  hospitalRanking: adminProcedure.query(async () => {
    return getHospitalPerformanceRanking();
  }),
  channelStats: adminProcedure.query(async () => {
    return getAdminChannelStats();
  }),
  // 5번: 자동 진단 수동 실행 (관리자)
  runAutoDiagnosis: adminProcedure.mutation(async () => {
    const profiles = await getActiveHospitalProfiles();
    if (profiles.length === 0) return { diagnosed: 0, failed: 0, total: 0 };
    let diagnosed = 0;
    let failed = 0;
    for (const profile of profiles) {
      try {
        const result = await analyzeSeo(profile.hospitalUrl, profile.specialty || undefined);
        const aiCat = result.categories.find((c: any) => c.name === "AI \uAC80\uC0C9 \uB178\uCD9C");
        const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
        await saveDiagnosisHistory({
          url: result.url,
          totalScore: result.totalScore,
          aiScore,
          grade: result.grade,
          specialty: profile.specialty || undefined,
          region: profile.region || undefined,
          categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
        });
        diagnosed++;
      } catch {
        failed++;
      }
    }
    return { diagnosed, failed, total: profiles.length };
  }),
  // 월간 전체 URL 진단 수동 실행 (관리자)
  runMonthlyDiagnosis: adminProcedure.mutation(async () => {
    const { runMonthlyBatchDiagnosis } = await import("../blog-scheduler");
    return runMonthlyBatchDiagnosis();
  }),
  recentDiagnoses: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getRecentDiagnoses(input?.limit ?? 50);
    }),
});

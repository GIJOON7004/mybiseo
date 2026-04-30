/**
 * aiMonitor 라우터
 * routers.ts에서 분할 — aiMonitor
 */

import { adminProcedure, router } from "../_core/trpc";
import {
  addAiMonitorCompetitor, createAiImprovementReport, createAiMonitorKeyword, deleteAiImprovementReport,
  deleteAiMonitorCompetitor, deleteAiMonitorKeyword, getAiExposureScores, getAiImprovementReportById,
  getAiImprovementReports, getAiMonitorCompetitors, getAiMonitorKeywordTrend, getAiMonitorKeywords,
  getAiMonitorResults, getAiMonitorStatsEnhanced, getAiMonitorTrend, getKeywordMonitoringDataForReport,
  getLatestAiExposureScores, toggleAiMonitorKeyword,
} from "../db";
import { generateImprovementReport, generateOverallReport, type MonitoringData } from "../lib/ai-improvement-report";
import { runEnhancedAutoMonitor, runEnhancedMonitorCheck } from "../lib/ai-monitor-enhanced";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const aiMonitorRouter = router({
  // 통계 (고도화: 플랫폼별 통계, 평균 노출 점수 포함)
  getStats: adminProcedure.query(async () => {
    return getAiMonitorStatsEnhanced();
  }),
  getKeywords: adminProcedure
    .input(z.object({ activeOnly: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return getAiMonitorKeywords(input?.activeOnly ?? true);
    }),
  addKeyword: adminProcedure
    .input(z.object({
      keyword: z.string().min(1),
      hospitalName: z.string().min(1),
      specialty: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await createAiMonitorKeyword(input);
      return { success: true } as const;
    }),
  toggleKeyword: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.number() }))
    .mutation(async ({ input }) => {
      await toggleAiMonitorKeyword(input.id, input.isActive);
      return { success: true } as const;
    }),
  deleteKeyword: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAiMonitorKeyword(input.id);
      return { success: true } as const;
    }),
  getResults: adminProcedure
    .input(z.object({ keywordId: z.number().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getAiMonitorResults(input?.keywordId, input?.limit ?? 50);
    }),
  // ── 경쟁사 관리 ──
  addCompetitor: adminProcedure
    .input(z.object({
      keywordId: z.number(),
      competitorName: z.string().min(1),
      competitorUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await addAiMonitorCompetitor(input);
      return { success: true } as const;
    }),
  getCompetitors: adminProcedure
    .input(z.object({ keywordId: z.number() }))
    .query(async ({ input }) => {
      return getAiMonitorCompetitors(input.keywordId);
    }),
  deleteCompetitor: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAiMonitorCompetitor(input.id);
      return { success: true } as const;
    }),
  // ── AI 인용 점수 ──
  getExposureScores: adminProcedure
    .input(z.object({ keywordId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.keywordId) {
        return getAiExposureScores(input.keywordId);
      }
      return getLatestAiExposureScores();
    }),
  // ── 고도화된 모니터링 실행 (개별 키워드) ──
  runCheck: adminProcedure
    .input(z.object({ keywordId: z.number() }))
    .mutation(async ({ input }) => {
      const keywords = await getAiMonitorKeywords(true);
      const keyword = keywords.find(k => k.id === input.keywordId);
      if (!keyword) throw new Error("키워드를 찾을 수 없습니다");

      const competitors = await getAiMonitorCompetitors(keyword.id);
      const { results, score } = await runEnhancedMonitorCheck(keyword, competitors);

      return {
        keywordId: keyword.id,
        results,
        score,
      };
    }),
  // ── 전체 키워드 자동 모니터링 (고도화) ──
  runAutoCheck: adminProcedure
    .mutation(async () => {
      const result = await runEnhancedAutoMonitor();
      return result;
    }),
  // 주간 트렌드 데이터
  getTrend: adminProcedure
    .input(z.object({ weeks: z.number().min(1).max(52).optional() }).optional())
    .query(async ({ input }) => {
      return getAiMonitorTrend(input?.weeks ?? 8);
    }),
  // 키워드별 트렌드
  getKeywordTrend: adminProcedure
    .input(z.object({ keywordId: z.number(), weeks: z.number().min(1).max(52).optional() }))
    .query(async ({ input }) => {
      return getAiMonitorKeywordTrend(input.keywordId, input.weeks ?? 8);
    }),

  // ── AI 인용 개선 리포트 ──
  generateReport: adminProcedure
    .input(z.object({ keywordId: z.number() }))
    .mutation(async ({ input }) => {
      const data = await getKeywordMonitoringDataForReport(input.keywordId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "키워드를 찾을 수 없습니다" });
      if (data.results.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "모니터링 결과가 없습니다. 먼저 검사를 실행해주세요." });

      const monitoringData: MonitoringData = {
        keyword: data.keyword.keyword,
        hospitalName: data.keyword.hospitalName,
        specialty: data.keyword.specialty || "",
        results: data.results.map(r => ({
          platform: r.platform,
          mentioned: r.mentioned === 1,
          rank: r.rank,
          sentiment: r.sentiment || "neutral",
          mentionPosition: r.mentionPosition,
          recommendationType: r.recommendationType,
          competitorsMentioned: r.competitorsMentioned ? JSON.parse(r.competitorsMentioned) : [],
          context: r.mentionContext || "",
          response: r.response,
        })),
        exposureScore: data.exposureScore ? {
          score: data.exposureScore.score,
          mentionScore: data.exposureScore.mentionScore,
          rankScore: data.exposureScore.rankScore,
          sentimentScore: data.exposureScore.sentimentScore,
          competitorScore: data.exposureScore.competitorScore,
        } : null,
        competitors: data.competitors.map(c => c.competitorName),
      };

      const report = await generateImprovementReport(monitoringData);

      const saved = await createAiImprovementReport({
        keywordId: input.keywordId,
        title: report.title,
        summary: report.summary,
        content: report.content,
        overallScore: report.overallScore,
        recommendations: JSON.stringify(report.recommendations),
        platformAnalysis: JSON.stringify(report.platformAnalysis),
        competitorInsights: JSON.stringify(report.competitorInsights),
      });

      return { ...report, id: saved?.id };
    }),

  generateOverallReport: adminProcedure.mutation(async () => {
    const keywords = await getAiMonitorKeywords(true);
    if (keywords.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "등록된 키워드가 없습니다" });

    const allData: MonitoringData[] = [];
    for (const kw of keywords) {
      const data = await getKeywordMonitoringDataForReport(kw.id);
      if (!data || data.results.length === 0) continue;
      allData.push({
        keyword: kw.keyword,
        hospitalName: kw.hospitalName,
        specialty: kw.specialty || "",
        results: data.results.map(r => ({
          platform: r.platform,
          mentioned: r.mentioned === 1,
          rank: r.rank,
          sentiment: r.sentiment || "neutral",
          mentionPosition: r.mentionPosition,
          recommendationType: r.recommendationType,
          competitorsMentioned: r.competitorsMentioned ? JSON.parse(r.competitorsMentioned) : [],
          context: r.mentionContext || "",
          response: r.response,
        })),
        exposureScore: data.exposureScore ? {
          score: data.exposureScore.score,
          mentionScore: data.exposureScore.mentionScore,
          rankScore: data.exposureScore.rankScore,
          sentimentScore: data.exposureScore.sentimentScore,
          competitorScore: data.exposureScore.competitorScore,
        } : null,
        competitors: data.competitors.map(c => c.competitorName),
      });
    }

    if (allData.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "모니터링 결과가 없습니다" });

    const report = await generateOverallReport(allData);
    const saved = await createAiImprovementReport({
      keywordId: null,
      title: report.title,
      summary: report.summary,
      content: report.content,
      overallScore: report.overallScore,
      recommendations: JSON.stringify(report.recommendations),
      platformAnalysis: JSON.stringify(report.platformAnalysis),
      competitorInsights: JSON.stringify(report.competitorInsights),
    });

    return { ...report, id: saved?.id };
  }),

  getReports: adminProcedure
    .input(z.object({ keywordId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getAiImprovementReports(input?.keywordId);
    }),

  getReportById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await getAiImprovementReportById(input.id);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "리포트를 찾을 수 없습니다" });
      return {
        ...report,
        recommendations: report.recommendations ? JSON.parse(report.recommendations) : [],
        platformAnalysis: report.platformAnalysis ? JSON.parse(report.platformAnalysis) : [],
        competitorInsights: report.competitorInsights ? JSON.parse(report.competitorInsights) : [],
      };
    }),

  deleteReport: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAiImprovementReport(input.id);
      return { success: true };
    }),
});

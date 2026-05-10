import { getErrorMessage } from "../lib/errors";
/**
 * routes/diagnosis.ts — SEO 진단, 배치 진단, 벤치마크 라우터
 */
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  aggregateMonthlyBenchmark,
  generateMonthlyAwards,
  getBenchmarkByRegion,
  getBenchmarkBySpecialty,
  getDiagnosisHistoryByUrl,
  getLatestBenchmarks,
  getMonthlyAwards,
  getRegionStats,
  getSpecialtyStats,
  saveBenchmarkData,
  saveDiagnosisHistory,
} from "../db";
import { analyzeSeo, type CountryCode } from "../seo-analyzer";
import { z } from "zod";

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
        } catch (e: unknown) {
          results.push({ url, success: false, error: getErrorMessage(e).slice(0, 100) || "분석 실패" });
        }
      }
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      return { results, summary: { total: input.urls.length, succeeded, failed } };
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

/**
 * routes/marketingTools.ts — 시즌 캘린더, 경쟁사 분석, 자동 최적화 라우터
 */
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  addSeasonalKeyword,
  deleteSeasonalKeyword,
  getCompetitorComparison,
  getCompetitorTrend,
  getCurrentSeasonalRecommendations,
  getSeasonalKeywords,
  getSeasonalSpecialties,
} from "../db";
import { analyzeSeo, type CountryCode } from "../seo-analyzer";
import { generateOptimizationPlan } from "../lib/auto-optimizer";
import { z } from "zod";

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

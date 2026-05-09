/**
 * LLM 사용량 모니터링 라우터 (관리자 전용)
 */
import { adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { llmUsageLogs } from "../../drizzle/schema";
import { sql, desc, gte, and } from "drizzle-orm";
import { getLLMCacheStats } from "../llm-cache";

export const llmMonitorRouter = router({
  // 실시간 캐시 상태
  cacheStats: adminProcedure.query(() => {
    return getLLMCacheStats();
  }),

  // 일별 토큰 사용량 집계 (최근 30일)
  dailyUsage: adminProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(30) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const days = input?.days || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await db
        .select({
          date: sql<string>`DATE(created_at)`.as("date"),
          totalCalls: sql<number>`COUNT(*)`.as("total_calls"),
          totalTokens: sql<number>`SUM(total_tokens)`.as("total_tokens"),
          promptTokens: sql<number>`SUM(prompt_tokens)`.as("prompt_tokens"),
          completionTokens: sql<number>`SUM(completion_tokens)`.as("completion_tokens"),
          cachedCalls: sql<number>`SUM(CASE WHEN cached = 1 THEN 1 ELSE 0 END)`.as("cached_calls"),
          avgDurationMs: sql<number>`AVG(duration_ms)`.as("avg_duration_ms"),
        })
        .from(llmUsageLogs)
        .where(gte(llmUsageLogs.createdAt, since))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(desc(sql`DATE(created_at)`));
      return result;
    }),

  // 모듈별 사용량 집계
  usageByCaller: adminProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const days = input?.days || 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await db
        .select({
          caller: llmUsageLogs.caller,
          totalCalls: sql<number>`COUNT(*)`.as("total_calls"),
          totalTokens: sql<number>`SUM(total_tokens)`.as("total_tokens"),
          avgTokens: sql<number>`AVG(total_tokens)`.as("avg_tokens"),
          avgDurationMs: sql<number>`AVG(duration_ms)`.as("avg_duration_ms"),
        })
        .from(llmUsageLogs)
        .where(gte(llmUsageLogs.createdAt, since))
        .groupBy(llmUsageLogs.caller)
        .orderBy(desc(sql`SUM(total_tokens)`));
      return result;
    }),

  // 최근 호출 로그 (디버깅용)
  recentLogs: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit || 20;
      const result = await db
        .select()
        .from(llmUsageLogs)
        .orderBy(desc(llmUsageLogs.createdAt))
        .limit(limit);
      return result;
    }),

  // 비용 추정 (GPT-4o 기준 개략 추정)
  costEstimate: adminProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(30) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalCost: 0, promptCost: 0, completionCost: 0, savedByCaching: 0 };
      const days = input?.days || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await db
        .select({
          promptTokens: sql<number>`SUM(prompt_tokens)`.as("prompt_tokens"),
          completionTokens: sql<number>`SUM(completion_tokens)`.as("completion_tokens"),
          cachedTokens: sql<number>`SUM(CASE WHEN cached = 1 THEN total_tokens ELSE 0 END)`.as("cached_tokens"),
        })
        .from(llmUsageLogs)
        .where(gte(llmUsageLogs.createdAt, since));
      const row = result[0] || { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
      // GPT-4o 가격 기준 (USD per 1M tokens)
      const PROMPT_PRICE = 2.5;  // $2.5/1M input tokens
      const COMPLETION_PRICE = 10; // $10/1M output tokens
      const promptCost = ((row.promptTokens || 0) / 1_000_000) * PROMPT_PRICE;
      const completionCost = ((row.completionTokens || 0) / 1_000_000) * COMPLETION_PRICE;
      const savedByCaching = ((row.cachedTokens || 0) / 1_000_000) * ((PROMPT_PRICE + COMPLETION_PRICE) / 2);
      return {
        totalCost: Math.round((promptCost + completionCost) * 100) / 100,
        promptCost: Math.round(promptCost * 100) / 100,
        completionCost: Math.round(completionCost * 100) / 100,
        savedByCaching: Math.round(savedByCaching * 100) / 100,
      };
    }),
});

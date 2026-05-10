/**
 * db/ai-content.ts — Ai-Content 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, isNotNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

import { createLogger } from "../lib/logger";
const logger = createLogger("db-ai-content");

export async function createAiBlogTrial(data: schema.InsertAiBlogTrial) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.aiBlogTrials).values(data).$returningId();
  return result;
}

export async function getAiBlogTrialStats() {
  const db = await getDb();
  if (!db) return { total: 0, today: 0 };
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(schema.aiBlogTrials);
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const [today] = await db.select({ count: sql<number>`count(*)` }).from(schema.aiBlogTrials).where(gte(schema.aiBlogTrials.createdAt, todayStart));
  return { total: total.count, today: today.count };
}

export async function getRecentAiBlogTrials(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.aiBlogTrials).orderBy(desc(schema.aiBlogTrials.createdAt)).limit(limit);
}

export async function createAiContentLog(data: schema.InsertAiContentLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.aiContentLogs).values(data).$returningId();
  return result;
}

export async function updateAiContentLog(id: number, data: Partial<schema.InsertAiContentLog>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.aiContentLogs).set(data).where(eq(schema.aiContentLogs.id, id));
}

export async function getAiContentLogsByUser(userId: number, contentType?: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(schema.aiContentLogs.userId, userId)];
  if (contentType) {
    conditions.push(eq(schema.aiContentLogs.contentType, contentType as any));
  }
  return db.select().from(schema.aiContentLogs)
    .where(and(...conditions))
    .orderBy(desc(schema.aiContentLogs.createdAt))
    .limit(limit);
}

export async function getAiContentStats(userId: number) {
  const db = await getDb();
  if (!db) return { blog: 0, cardnews: 0, video_script: 0, poster: 0, total: 0 };
  const rows = await db.select({
    contentType: schema.aiContentLogs.contentType,
    count: sql<number>`count(*)`,
  }).from(schema.aiContentLogs)
    .where(and(eq(schema.aiContentLogs.userId, userId), eq(schema.aiContentLogs.status, "completed")))
    .groupBy(schema.aiContentLogs.contentType);
  const stats: Record<string, number> = { blog: 0, cardnews: 0, video_script: 0, poster: 0 };
  let total = 0;
  for (const r of rows) { stats[r.contentType] = r.count; total += r.count; }
  return { ...stats, total };
}

export async function getCardnewsTemplates(specialty?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(schema.cardnewsTemplates.isActive, 1)];
  if (specialty) conditions.push(eq(schema.cardnewsTemplates.specialty, specialty));
  if (category) conditions.push(eq(schema.cardnewsTemplates.category, category as any));
  return db.select().from(schema.cardnewsTemplates)
    .where(and(...conditions))
    .orderBy(desc(schema.cardnewsTemplates.usageCount));
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.cardnewsTemplates).set({ usageCount: sql`${schema.cardnewsTemplates.usageCount} + 1` }).where(eq(schema.cardnewsTemplates.id, id));
}

export async function createCardnewsTemplate(data: schema.InsertCardnewsTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.cardnewsTemplates).values(data).$returningId();
  return result;
}

export async function getReviewReport(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pass: 0, warning: 0, fail: 0, avgScore: 0, recentReviews: [] };
  const allLogs = await db.select().from(schema.aiContentLogs)
    .where(and(eq(schema.aiContentLogs.userId, userId), isNotNull(schema.aiContentLogs.reviewVerdict)))
    .orderBy(desc(schema.aiContentLogs.createdAt))
    .limit(200);
  const total = allLogs.length;
  const pass = allLogs.filter(l => l.reviewVerdict === "pass").length;
  const warning = allLogs.filter(l => l.reviewVerdict === "warning").length;
  const fail = allLogs.filter(l => l.reviewVerdict === "fail").length;
  const scores = allLogs.filter(l => l.reviewScore !== null).map(l => l.reviewScore!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const recentReviews = allLogs.slice(0, 20).map(l => ({
    id: l.id,
    contentType: l.contentType,
    title: l.generatedTitle,
    verdict: l.reviewVerdict,
    score: l.reviewScore,
    summary: l.reviewSummary,
    issues: l.reviewIssues ? JSON.parse(l.reviewIssues) : [],
    presetId: l.presetId,
    createdAt: l.createdAt,
  }));
  return { total, pass, warning, fail, avgScore, recentReviews };
}

export async function getReviewReportAdmin() {
  const db = await getDb();
  if (!db) return { total: 0, pass: 0, warning: 0, fail: 0, avgScore: 0, recentReviews: [], topIssues: [] };
  const allLogs = await db.select().from(schema.aiContentLogs)
    .where(isNotNull(schema.aiContentLogs.reviewVerdict))
    .orderBy(desc(schema.aiContentLogs.createdAt))
    .limit(500);
  const total = allLogs.length;
  const pass = allLogs.filter(l => l.reviewVerdict === "pass").length;
  const warning = allLogs.filter(l => l.reviewVerdict === "warning").length;
  const fail = allLogs.filter(l => l.reviewVerdict === "fail").length;
  const scores = allLogs.filter(l => l.reviewScore !== null).map(l => l.reviewScore!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  // 자주 발생하는 위반 항목 집계
  const issueMap = new Map<string, number>();
  allLogs.forEach(l => {
    if (l.reviewIssues) {
      try {
        const issues = JSON.parse(l.reviewIssues);
        issues.forEach((issue: any) => {
          const clause = issue.clause || "기타";
          issueMap.set(clause, (issueMap.get(clause) || 0) + 1);
        });
      } catch (e) { logger.warn("[DB] Suppressed error:", e); }
    }
  });
  const topIssues = Array.from(issueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([clause, count]) => ({ clause, count }));
  const recentReviews = allLogs.slice(0, 30).map(l => ({
    id: l.id,
    contentType: l.contentType,
    title: l.generatedTitle,
    verdict: l.reviewVerdict,
    score: l.reviewScore,
    summary: l.reviewSummary,
    issues: l.reviewIssues ? JSON.parse(l.reviewIssues) : [],
    presetId: l.presetId,
    hospitalName: l.hospitalName,
    createdAt: l.createdAt,
  }));
  return { total, pass, warning, fail, avgScore, recentReviews, topIssues };
}

export async function updateNaverPublishStatus(contentId: number, postUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.aiContentLogs).set({
    naverPublished: 1,
    naverPostUrl: postUrl,
    naverPublishedAt: new Date(),
  }).where(eq(schema.aiContentLogs.id, contentId));
}

export async function updateContentReview(contentId: number, review: {
  verdict: string;
  score: number;
  issues: any[];
  summary: string;
  revisedContent: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.aiContentLogs).set({
    reviewVerdict: review.verdict as any,
    reviewScore: review.score,
    reviewIssues: JSON.stringify(review.issues),
    reviewSummary: review.summary,
    revisedContent: review.revisedContent,
  }).where(eq(schema.aiContentLogs.id, contentId));
}

export async function getContentById(contentId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.aiContentLogs).where(eq(schema.aiContentLogs.id, contentId)).limit(1);
  return row || null;
}


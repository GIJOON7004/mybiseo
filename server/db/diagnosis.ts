/**
 * db/diagnosis.ts — Diagnosis 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function saveDiagnosisHistory(data: schema.InsertDiagnosisHistory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.diagnosisHistory).values(data);
}

export async function getDiagnosisHistoryByUrl(url: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.diagnosisHistory)
    .where(eq(schema.diagnosisHistory.url, url))
    .orderBy(desc(schema.diagnosisHistory.diagnosedAt))
    .limit(limit);
}

export async function getRecentDiagnoses(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.diagnosisHistory)
    .orderBy(desc(schema.diagnosisHistory.diagnosedAt))
    .limit(limit);
}

export async function getDiagnosisStats() {
  const db = await getDb();
  if (!db) return { total: 0, uniqueUrls: 0, avgScore: 0, avgAiScore: 0 };
  const rows = await db.select({
    total: sql<number>`COUNT(*)`,
    uniqueUrls: sql<number>`COUNT(DISTINCT url)`,
    avgScore: sql<number>`COALESCE(ROUND(AVG(total_score)), 0)`,
    avgAiScore: sql<number>`COALESCE(ROUND(AVG(ai_score)), 0)`,
  }).from(schema.diagnosisHistory);
  return rows[0] ?? { total: 0, uniqueUrls: 0, avgScore: 0, avgAiScore: 0 };
}

export async function getDailyDiagnosisCounts(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db.select({
    date: sql<string>`DATE(diagnosed_at)`.as("date"),
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(schema.diagnosisHistory)
    .where(gte(schema.diagnosisHistory.diagnosedAt, since))
    .groupBy(sql`DATE(diagnosed_at)`)
    .orderBy(sql`DATE(diagnosed_at)`);
}

export async function getScoreDistribution() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    bucket: sql<string>`CASE 
      WHEN total_score >= 90 THEN '90-100'
      WHEN total_score >= 80 THEN '80-89'
      WHEN total_score >= 70 THEN '70-79'
      WHEN total_score >= 60 THEN '60-69'
      WHEN total_score >= 50 THEN '50-59'
      WHEN total_score >= 40 THEN '40-49'
      WHEN total_score >= 30 THEN '30-39'
      ELSE '0-29'
    END`.as("bucket"),
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(schema.diagnosisHistory)
    .groupBy(sql`bucket`)
    .orderBy(sql`MIN(total_score)`);
}

export async function getTopDiagnosedUrls(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    url: schema.diagnosisHistory.url,
    count: sql<number>`COUNT(*)`.as("count"),
    latestScore: sql<number>`MAX(total_score)`.as("latest_score"),
    latestAiScore: sql<number>`MAX(ai_score)`.as("latest_ai_score"),
  }).from(schema.diagnosisHistory)
    .groupBy(schema.diagnosisHistory.url)
    .orderBy(desc(sql`count`))
    .limit(limit);
}

export async function getSpecialtyStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    specialty: schema.diagnosisHistory.specialty,
    count: sql<number>`COUNT(*)`.as("count"),
    avgScore: sql<number>`ROUND(AVG(total_score))`.as("avg_score"),
    avgAiScore: sql<number>`ROUND(AVG(ai_score))`.as("avg_ai_score"),
  }).from(schema.diagnosisHistory)
    .where(sql`specialty IS NOT NULL AND specialty != ''`)
    .groupBy(schema.diagnosisHistory.specialty)
    .orderBy(desc(sql`count`));
}

export async function getRegionStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    region: schema.diagnosisHistory.region,
    count: sql<number>`COUNT(*)`.as("count"),
    avgScore: sql<number>`ROUND(AVG(total_score))`.as("avg_score"),
    avgAiScore: sql<number>`ROUND(AVG(ai_score))`.as("avg_ai_score"),
  }).from(schema.diagnosisHistory)
    .where(sql`region IS NOT NULL AND region != ''`)
    .groupBy(schema.diagnosisHistory.region)
    .orderBy(desc(sql`count`));
}

export async function getMonthlyTrendByUrl(url: string, months = 12) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
  return db.select({
    month: sql<string>`DATE_FORMAT(diagnosed_at, '%Y-%m')`.as("month"),
    avgScore: sql<number>`ROUND(AVG(total_score))`.as("avg_score"),
    avgAiScore: sql<number>`ROUND(AVG(ai_score))`.as("avg_ai_score"),
    maxScore: sql<number>`MAX(total_score)`.as("max_score"),
    minScore: sql<number>`MIN(total_score)`.as("min_score"),
    count: sql<number>`COUNT(*)`.as("count"),
    latestGrade: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(grade ORDER BY diagnosed_at DESC), ',', 1)`.as("latest_grade"),
    latestCategoryScores: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(category_scores ORDER BY diagnosed_at DESC SEPARATOR '|||'), '|||', 1)`.as("latest_category_scores"),
  }).from(schema.diagnosisHistory)
    .where(and(eq(schema.diagnosisHistory.url, url), gte(schema.diagnosisHistory.diagnosedAt, since)))
    .groupBy(sql`DATE_FORMAT(diagnosed_at, '%Y-%m')`)
    .orderBy(sql`month`);
}

export async function getCategoryTrendByUrl(url: string, months = 12) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    diagnosedAt: schema.diagnosisHistory.diagnosedAt,
    categoryScores: schema.diagnosisHistory.categoryScores,
    totalScore: schema.diagnosisHistory.totalScore,
    aiScore: schema.diagnosisHistory.aiScore,
    grade: schema.diagnosisHistory.grade,
  }).from(schema.diagnosisHistory)
    .where(and(eq(schema.diagnosisHistory.url, url), gte(schema.diagnosisHistory.diagnosedAt, since)))
    .orderBy(schema.diagnosisHistory.diagnosedAt);
  return rows;
}

export async function getPublicHistoryByUrl(url: string, limit = 24) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: schema.diagnosisHistory.id,
    url: schema.diagnosisHistory.url,
    totalScore: schema.diagnosisHistory.totalScore,
    aiScore: schema.diagnosisHistory.aiScore,
    grade: schema.diagnosisHistory.grade,
    specialty: schema.diagnosisHistory.specialty,
    categoryScores: schema.diagnosisHistory.categoryScores,
    diagnosedAt: schema.diagnosisHistory.diagnosedAt,
  }).from(schema.diagnosisHistory)
    .where(eq(schema.diagnosisHistory.url, url))
    .orderBy(desc(schema.diagnosisHistory.diagnosedAt))
    .limit(limit);
}

export async function getScoreComparisonByUrl(url: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.diagnosisHistory)
    .where(eq(schema.diagnosisHistory.url, url))
    .orderBy(schema.diagnosisHistory.diagnosedAt);
  if (rows.length < 2) return null;
  const first = rows[0];
  const latest = rows[rows.length - 1];
  return {
    first: { score: first.totalScore, aiScore: first.aiScore, grade: first.grade, date: first.diagnosedAt, categoryScores: first.categoryScores },
    latest: { score: latest.totalScore, aiScore: latest.aiScore, grade: latest.grade, date: latest.diagnosedAt, categoryScores: latest.categoryScores },
    change: latest.totalScore - first.totalScore,
    aiChange: (latest.aiScore ?? 0) - (first.aiScore ?? 0),
    totalDiagnoses: rows.length,
    periodDays: Math.round((new Date(latest.diagnosedAt).getTime() - new Date(first.diagnosedAt).getTime()) / (1000 * 60 * 60 * 24)),
  };
}

export async function getDailyDiagnosisCount(): Promise<number> {
  const db = await getDb(); if (!db) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(schema.seoLeads)
    .where(gte(schema.seoLeads.createdAt, today));
  return result?.count || 0;
}


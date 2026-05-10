/**
 * db/benchmarking-report.ts — Benchmarking-Report 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createBenchmarkingReport(data: schema.InsertBenchmarkingReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(schema.benchmarkingReports).values(data).$returningId();
  return result.id;
}

export async function getBenchmarkingReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.benchmarkingReports).where(eq(schema.benchmarkingReports.id, id)).limit(1);
  return row || null;
}

export async function getBenchmarkingReportsByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.benchmarkingReports)
    .where(eq(schema.benchmarkingReports.userId, userId))
    .orderBy(desc(schema.benchmarkingReports.createdAt))
    .limit(20);
}

export async function updateBenchmarkingReportStatus(id: number, status: "generating" | "completed" | "failed", updates?: Partial<{
  executiveSummary: string;
  categoryComparison: string;
  actionableInsights: string;
  snsMarketingTips: string;
  weeklyPlan: string;
  pdfUrl: string;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.benchmarkingReports).set({
    status,
    ...updates,
  }).where(eq(schema.benchmarkingReports.id, id));
}

export async function getBenchmarkingReportByShareToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.benchmarkingReports)
    .where(eq(schema.benchmarkingReports.shareToken, token))
    .limit(1);
  return row || null;
}


/**
 * db/monthly-report.ts — Monthly-Report 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getMonthlyReportsByHospital(hospitalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.monthlyReports)
    .where(eq(schema.monthlyReports.hospitalId, hospitalId))
    .orderBy(desc(schema.monthlyReports.year), desc(schema.monthlyReports.month));
}

export async function insertMonthlyReport(report: schema.InsertMonthlyReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.monthlyReports).values(report);
  return result;
}

export async function getMonthlyInquirySummary(hospitalId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return { totalInquiries: 0, completedInquiries: 0, conversionRate: "0%" };
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);
  const rows = await db.select({
    status: schema.consultationInquiries.status,
    count: sql<number>`count(*)`,
  }).from(schema.consultationInquiries)
    .where(and(
      eq(schema.consultationInquiries.hospitalId, hospitalId),
      gte(schema.consultationInquiries.createdAt, from),
      lte(schema.consultationInquiries.createdAt, to)
    ))
    .groupBy(schema.consultationInquiries.status);
  const totalInquiries = rows.reduce((s, r) => s + Number(r.count), 0);
  const completedInquiries = Number(rows.find(r => r.status === "completed")?.count ?? 0);
  const conversionRate = totalInquiries > 0 ? `${Math.round((completedInquiries / totalInquiries) * 100)}%` : "0%";
  return { totalInquiries, completedInquiries, conversionRate };
}

export async function setMonthlyReportShareToken(reportId: number, token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.monthlyReports).set({ shareToken: token }).where(eq(schema.monthlyReports.id, reportId));
}

export async function getMonthlyReportByShareToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.monthlyReports)
    .where(eq(schema.monthlyReports.shareToken, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function getMonthlyReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.monthlyReports)
    .where(eq(schema.monthlyReports.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateMonthlyReportPdfUrl(reportId: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.monthlyReports).set({ pdfUrl }).where(eq(schema.monthlyReports.id, reportId));
}


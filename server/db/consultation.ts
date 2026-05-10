/**
 * db/consultation.ts — Consultation 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function insertConsultationInquiry(inquiry: schema.InsertConsultationInquiry) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.consultationInquiries).values(inquiry);
  return result;
}

export async function getConsultationsByHospital(hospitalId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(schema.consultationInquiries.hospitalId, hospitalId)];
  if (from) conditions.push(gte(schema.consultationInquiries.createdAt, from));
  if (to) conditions.push(lte(schema.consultationInquiries.createdAt, to));
  return db.select().from(schema.consultationInquiries)
    .where(and(...conditions))
    .orderBy(desc(schema.consultationInquiries.createdAt));
}

export async function updateConsultationStatus(id: number, status: "pending" | "contacted" | "completed" | "cancelled", note?: string) {
  const db = await getDb();
  if (!db) return null;
  const updates: Record<string, unknown> = { status };
  if (status === "contacted") updates.contactedAt = new Date();
  if (note !== undefined) updates.note = note;
  return db.update(schema.consultationInquiries).set(updates).where(eq(schema.consultationInquiries.id, id));
}

export async function getConsultationStats(hospitalId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, contacted: 0, completed: 0, cancelled: 0, conversionRate: "0%" };
  const conditions = [eq(schema.consultationInquiries.hospitalId, hospitalId)];
  if (from) conditions.push(gte(schema.consultationInquiries.createdAt, from));
  if (to) conditions.push(lte(schema.consultationInquiries.createdAt, to));
  const rows = await db.select({
    status: schema.consultationInquiries.status,
    count: sql<number>`count(*)`,
  }).from(schema.consultationInquiries)
    .where(and(...conditions))
    .groupBy(schema.consultationInquiries.status);
  const total = rows.reduce((s, r) => s + Number(r.count), 0);
  const pending = Number(rows.find(r => r.status === "pending")?.count ?? 0);
  const contacted = Number(rows.find(r => r.status === "contacted")?.count ?? 0);
  const completed = Number(rows.find(r => r.status === "completed")?.count ?? 0);
  const cancelled = Number(rows.find(r => r.status === "cancelled")?.count ?? 0);
  const conversionRate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
  return { total, pending, contacted, completed, cancelled, conversionRate };
}

export async function getConsultationByChannel(hospitalId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(schema.consultationInquiries.hospitalId, hospitalId)];
  if (from) conditions.push(gte(schema.consultationInquiries.createdAt, from));
  if (to) conditions.push(lte(schema.consultationInquiries.createdAt, to));
  return db.select({
    channel: schema.consultationInquiries.channel,
    count: sql<number>`count(*)`,
  }).from(schema.consultationInquiries)
    .where(and(...conditions))
    .groupBy(schema.consultationInquiries.channel)
    .orderBy(sql`count(*) desc`);
}

export async function getConsultationMonthlyTrend(hospitalId: number) {
  const db = await getDb();
  if (!db) return [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const rows = await db.execute(sql`
    SELECT DATE_FORMAT(created_at, '%Y-%m') as yearMonth, COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM consultation_inquiries
    WHERE hospital_id = ${hospitalId}
      AND created_at >= ${sixMonthsAgo}
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY DATE_FORMAT(created_at, '%Y-%m')
  `);
  return (rows[0] as unknown as any[]).map((r: any) => ({
    yearMonth: r.yearMonth as string,
    total: Number(r.total),
    completed: Number(r.completed),
  }));
}

export async function getConsultationPipeline(hospitalId: number) {
  const db = await getDb();
  if (!db) return { pending: 0, contacted: 0, completed: 0, cancelled: 0, total: 0 };
  const rows = await db.select({
    status: schema.consultationInquiries.status,
    count: sql<number>`COUNT(*)`,
  }).from(schema.consultationInquiries)
    .where(eq(schema.consultationInquiries.hospitalId, hospitalId))
    .groupBy(schema.consultationInquiries.status);
  
  const result = { pending: 0, contacted: 0, completed: 0, cancelled: 0, total: 0 };
  for (const row of rows) {
    const s = row.status as keyof typeof result;
    if (s in result) result[s] = Number(row.count);
    result.total += Number(row.count);
  }
  return result;
}

export async function getRecentConsultations(hospitalId: number, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(schema.consultationInquiries.hospitalId, hospitalId)];
  if (status && status !== "all") {
    conditions.push(eq(schema.consultationInquiries.status, status as any));
  }
  return db.select().from(schema.consultationInquiries)
    .where(and(...conditions))
    .orderBy(desc(schema.consultationInquiries.createdAt))
    .limit(limit);
}

export async function updateConsultationNote(id: number, hospitalId: number, note: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.consultationInquiries).set({ note })
    .where(and(eq(schema.consultationInquiries.id, id), eq(schema.consultationInquiries.hospitalId, hospitalId)));
}


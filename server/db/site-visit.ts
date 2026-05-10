/**
 * db/site-visit.ts — Site-Visit 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function insertSiteVisit(visit: schema.InsertSiteVisit) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.siteVisits).values(visit);
  return result;
}

export async function getSiteVisitsByHospital(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to)
    ))
    .orderBy(desc(schema.siteVisits.visitedAt));
}

export async function getSiteVisitStats(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    channel: schema.siteVisits.channel,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to)
    ))
    .groupBy(schema.siteVisits.channel);
  return rows;
}

export async function getDailyVisitTrend(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT DATE(visited_at) as date, COUNT(*) as total,
      COUNT(DISTINCT visitor_id) as uniqueVisitors
    FROM site_visits
    WHERE hospital_id = ${hospitalId}
      AND visited_at >= ${from}
      AND visited_at <= ${to}
    GROUP BY DATE(visited_at)
    ORDER BY DATE(visited_at)
  `);
  return (rows[0] as unknown as any[]).map((r: any) => ({
    date: String(r.date),
    total: Number(r.total),
    uniqueVisitors: Number(r.uniqueVisitors),
  }));
}

export async function getHourlyDistribution(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT HOUR(visited_at) as hour, COUNT(*) as count
    FROM site_visits
    WHERE hospital_id = ${hospitalId}
      AND visited_at >= ${from}
      AND visited_at <= ${to}
    GROUP BY HOUR(visited_at)
    ORDER BY HOUR(visited_at)
  `);
  return (rows[0] as unknown as any[]).map((r: any) => ({ hour: Number(r.hour), count: Number(r.count) }));
}

export async function getMonthlyVisitSummary(hospitalId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return null;
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);
  const rows = await db.select({
    channel: schema.siteVisits.channel,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to)
    ))
    .groupBy(schema.siteVisits.channel);
  
  const totalVisits = rows.reduce((s, r) => s + Number(r.count), 0);
  const aiChannelVisits = rows.filter(r => r.channel?.startsWith("ai_")).reduce((s, r) => s + Number(r.count), 0);
  const naverVisits = Number(rows.find(r => r.channel === "naver")?.count ?? 0);
  const googleVisits = Number(rows.find(r => r.channel === "google")?.count ?? 0);
  const snsVisits = rows.filter(r => r.channel?.startsWith("sns_")).reduce((s, r) => s + Number(r.count), 0);
  const directVisits = Number(rows.find(r => r.channel === "direct")?.count ?? 0);
  
  return { totalVisits, aiChannelVisits, naverVisits, googleVisits, snsVisits, directVisits };
}


/**
 * db/misc.ts — Misc 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getTopPages(hospitalId: number, from: Date, to: Date, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    pageUrl: schema.siteVisits.pageUrl,
    pageTitle: schema.siteVisits.pageTitle,
    views: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to)
    ))
    .groupBy(schema.siteVisits.pageUrl, schema.siteVisits.pageTitle)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
}

export async function getDeviceStats(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    deviceType: schema.siteVisits.deviceType,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to)
    ))
    .groupBy(schema.siteVisits.deviceType);
}

export async function getVisitorFunnel(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return { totalVisitors: 0, pageViewers: 0, multiPageViewers: 0, inquirySubmitters: 0 };

  // 1. 총 고유 방문자 수
  const [visitors] = await db.select({
    count: sql<number>`COUNT(DISTINCT ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to),
    ));

  // 2. 2페이지 이상 본 방문자 (engagement)
  const multiPageRows = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(
    db.select({
      visitorId: schema.siteVisits.visitorId,
      pageCount: sql<number>`COUNT(DISTINCT ${schema.siteVisits.pageUrl})`,
    }).from(schema.siteVisits)
      .where(and(
        eq(schema.siteVisits.hospitalId, hospitalId),
        gte(schema.siteVisits.visitedAt, from),
        lte(schema.siteVisits.visitedAt, to),
      ))
      .groupBy(schema.siteVisits.visitorId)
      .having(sql`COUNT(DISTINCT ${schema.siteVisits.pageUrl}) >= 2`)
      .as("multi_page")
  );

  // 3. 상담 문의 제출자 수
  const [inquiries] = await db.select({
    count: sql<number>`COUNT(DISTINCT ${schema.consultationInquiries.visitorId})`,
  }).from(schema.consultationInquiries)
    .where(and(
      eq(schema.consultationInquiries.hospitalId, hospitalId),
      gte(schema.consultationInquiries.createdAt, from),
      lte(schema.consultationInquiries.createdAt, to),
    ));

  return {
    totalVisitors: visitors?.count ?? 0,
    pageViewers: visitors?.count ?? 0, // 방문 = 페이지뷰
    multiPageViewers: multiPageRows[0]?.count ?? 0,
    inquirySubmitters: inquiries?.count ?? 0,
  };
}

export async function updateEmailContact(id: number, updates: Partial<{
  name: string;
  hospitalName: string;
  specialty: string;
  phone: string;
  tags: string[];
  marketingConsent: boolean;
  status: "active" | "unsubscribed" | "bounced";
  note: string;
}>) {
  const db = await getDb();
  if (!db) return;
  const data: any = { ...updates, updatedAt: new Date() };
  if (updates.tags) data.tags = JSON.stringify(updates.tags);
  await db.update(schema.emailContacts).set(data).where(eq(schema.emailContacts.id, id));
}

export async function deleteEmailContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.emailContacts).where(eq(schema.emailContacts.id, id));
}


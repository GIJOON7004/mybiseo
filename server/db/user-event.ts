/**
 * db/user-event.ts — User-Event 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function logUserEvent(data: schema.InsertUserEvent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.userEvents).values(data);
}

export async function getUserEventStats(days = 30) {
  const db = await getDb();
  if (!db) return { byType: [], daily: [], uniqueVisitors: 0, totalEvents: 0 };
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // 이벤트 타입별 통계
  const byType = await db.select({
    eventType: schema.userEvents.eventType,
    count: sql<number>`COUNT(*)`,
  }).from(schema.userEvents)
    .where(gte(schema.userEvents.createdAt, since))
    .groupBy(schema.userEvents.eventType)
    .orderBy(sql`COUNT(*) DESC`);

  // 일별 이벤트 수
  const daily = await db.select({
    date: sql<string>`DATE(${schema.userEvents.createdAt})`,
    count: sql<number>`COUNT(*)`,
  }).from(schema.userEvents)
    .where(gte(schema.userEvents.createdAt, since))
    .groupBy(sql`DATE(${schema.userEvents.createdAt})`)
    .orderBy(sql`DATE(${schema.userEvents.createdAt})`);

  // 고유 방문자 수
  const [uniqueVisitors] = await db.select({
    count: sql<number>`COUNT(DISTINCT ${schema.userEvents.visitorId})`,
  }).from(schema.userEvents)
    .where(gte(schema.userEvents.createdAt, since));

  return {
    byType,
    daily,
    uniqueVisitors: uniqueVisitors.count,
    totalEvents: byType.reduce((sum, t) => sum + t.count, 0),
  };
}

export async function getRecentUserEvents(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.userEvents)
    .orderBy(desc(schema.userEvents.createdAt))
    .limit(limit);
}


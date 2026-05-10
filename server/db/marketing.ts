/**
 * db/marketing.ts — Marketing 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createMarketingContent(data: schema.InsertMarketingContent) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.marketingContent).values(data).$returningId();
  return result;
}

export async function getMarketingContentByUser(userId: number, filters?: { channel?: string; status?: string }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(schema.marketingContent.userId, userId)];
  if (filters?.channel) conditions.push(eq(schema.marketingContent.channel, filters.channel));
  if (filters?.status) conditions.push(eq(schema.marketingContent.status, filters.status));
  return db.select().from(schema.marketingContent).where(and(...conditions)).orderBy(desc(schema.marketingContent.createdAt));
}

export async function updateMarketingContent(id: number, data: Partial<schema.InsertMarketingContent>) {
  const db = await getDb(); if (!db) return null;
  await db.update(schema.marketingContent).set({ ...data, updatedAt: new Date() }).where(eq(schema.marketingContent.id, id));
  const rows = await (await getDb())!.select().from(schema.marketingContent).where(eq(schema.marketingContent.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteMarketingContent(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(schema.marketingContent).where(eq(schema.marketingContent.id, id));
}

export async function getMarketingCalendar(userId: number, year: number, month: number) {
  const db = await getDb(); if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(schema.marketingContent)
    .where(and(eq(schema.marketingContent.userId, userId), gte(schema.marketingContent.scheduledAt, startDate), lte(schema.marketingContent.scheduledAt, endDate)))
    .orderBy(schema.marketingContent.scheduledAt);
}


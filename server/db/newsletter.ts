/**
 * db/newsletter.ts — Newsletter 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function subscribeNewsletter(data: schema.InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) return null;
  // upsert: 이미 있으면 활성화
  const existing = await db.select().from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.email, data.email)).limit(1);
  if (existing.length > 0) {
    await db.update(schema.newsletterSubscribers)
      .set({ isActive: 1, name: data.name, hospitalName: data.hospitalName, specialty: data.specialty })
      .where(eq(schema.newsletterSubscribers.email, data.email));
    return existing[0];
  }
  await db.insert(schema.newsletterSubscribers).values(data);
  return data;
}

export async function unsubscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.newsletterSubscribers)
    .set({ isActive: 0 })
    .where(eq(schema.newsletterSubscribers.email, email));
}

export async function getActiveSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.isActive, 1))
    .orderBy(desc(schema.newsletterSubscribers.createdAt));
}

export async function getSubscriberCount() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.isActive, 1));
  return rows[0]?.count ?? 0;
}


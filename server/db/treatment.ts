/**
 * db/treatment.ts — Treatment 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createTreatmentPage(data: schema.InsertTreatmentPage) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.treatmentPages).values(data).$returningId();
  return result;
}

export async function getTreatmentPageBySlug(slug: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(schema.treatmentPages).where(eq(schema.treatmentPages.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function getTreatmentPageById(id: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(schema.treatmentPages).where(eq(schema.treatmentPages.id, id)).limit(1);
  return rows[0] || null;
}

export async function getTreatmentPagesByUser(userId: number) {
  const db = await getDb(); if (!db) return null;
  return db.select().from(schema.treatmentPages).where(eq(schema.treatmentPages.userId, userId)).orderBy(desc(schema.treatmentPages.createdAt));
}

export async function updateTreatmentPage(id: number, data: Partial<schema.InsertTreatmentPage>) {
  const db = await getDb(); if (!db) return null;
  await db.update(schema.treatmentPages).set({ ...data, updatedAt: new Date() }).where(eq(schema.treatmentPages.id, id));
  return getTreatmentPageById(id);
}

export async function deleteTreatmentPage(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(schema.treatmentPages).where(eq(schema.treatmentPages.id, id));
}

export async function incrementTreatmentPageView(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(schema.treatmentPages).set({ viewCount: sql`view_count + 1` }).where(eq(schema.treatmentPages.id, id));
}


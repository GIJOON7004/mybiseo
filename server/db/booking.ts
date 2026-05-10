/**
 * db/booking.ts — Booking 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getBookingSettings(userId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(schema.kakaoBookingSettings).where(eq(schema.kakaoBookingSettings.userId, userId)).limit(1);
  return rows[0] || null;
}

export async function upsertBookingSettings(userId: number, data: Partial<schema.InsertKakaoBookingSetting>) {
  const db = await getDb(); if (!db) return null;
  const existing = await getBookingSettings(userId);
  if (existing) {
    await db.update(schema.kakaoBookingSettings).set({ ...data, updatedAt: new Date() }).where(eq(schema.kakaoBookingSettings.id, existing.id));
    return { ...existing, ...data };
  } else {
    const [result] = await db.insert(schema.kakaoBookingSettings).values({ ...data, userId } as schema.InsertKakaoBookingSetting);
    return { id: result.insertId, userId, ...data };
  }
}

export async function getBookingSlots(userId: number, settingId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(schema.bookingSlots.userId, userId)];
  if (settingId) conditions.push(eq(schema.bookingSlots.settingId, settingId));
  return db.select().from(schema.bookingSlots).where(and(...conditions)).orderBy(schema.bookingSlots.sortOrder);
}

export async function createBookingSlot(data: schema.InsertBookingSlot) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.bookingSlots).values(data);
  return { id: result.insertId, ...data };
}

export async function updateBookingSlot(id: number, userId: number, data: Partial<schema.InsertBookingSlot>) {
  const db = await getDb(); if (!db) return false;
  await db.update(schema.bookingSlots).set(data).where(and(eq(schema.bookingSlots.id, id), eq(schema.bookingSlots.userId, userId)));
  return true;
}

export async function deleteBookingSlot(id: number, userId: number) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.bookingSlots).where(and(eq(schema.bookingSlots.id, id), eq(schema.bookingSlots.userId, userId)));
  return true;
}


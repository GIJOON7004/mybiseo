/**
 * db/seasonal.ts — Seasonal 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getSeasonalKeywords(specialty?: string, month?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const query = db.select().from(schema.seasonalCalendar);
  
  if (specialty && month) {
    return query.where(and(
      eq(schema.seasonalCalendar.specialty, specialty),
      eq(schema.seasonalCalendar.month, month)
    )).orderBy(schema.seasonalCalendar.priority);
  } else if (specialty) {
    return query.where(eq(schema.seasonalCalendar.specialty, specialty)).orderBy(schema.seasonalCalendar.month, schema.seasonalCalendar.priority);
  } else if (month) {
    return query.where(eq(schema.seasonalCalendar.month, month)).orderBy(schema.seasonalCalendar.specialty, schema.seasonalCalendar.priority);
  }
  return query.orderBy(schema.seasonalCalendar.specialty, schema.seasonalCalendar.month);
}

export async function getCurrentSeasonalRecommendations(specialty?: string) {
  const db = await getDb();
  if (!db) return { thisMonth: [], nextMonth: [] };
  
  const now = new Date();
  const thisMonth = now.getMonth() + 1; // 1~12
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  
  let thisMonthData, nextMonthData;
  
  if (specialty) {
    thisMonthData = await db.select().from(schema.seasonalCalendar)
      .where(and(eq(schema.seasonalCalendar.specialty, specialty), eq(schema.seasonalCalendar.month, thisMonth)))
      .orderBy(schema.seasonalCalendar.priority);
    nextMonthData = await db.select().from(schema.seasonalCalendar)
      .where(and(eq(schema.seasonalCalendar.specialty, specialty), eq(schema.seasonalCalendar.month, nextMonth)))
      .orderBy(schema.seasonalCalendar.priority);
  } else {
    thisMonthData = await db.select().from(schema.seasonalCalendar)
      .where(eq(schema.seasonalCalendar.month, thisMonth))
      .orderBy(schema.seasonalCalendar.specialty, schema.seasonalCalendar.priority);
    nextMonthData = await db.select().from(schema.seasonalCalendar)
      .where(eq(schema.seasonalCalendar.month, nextMonth))
      .orderBy(schema.seasonalCalendar.specialty, schema.seasonalCalendar.priority);
  }
  
  return { thisMonth: thisMonthData, nextMonth: nextMonthData };
}

export async function getSeasonalSpecialties() {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select({ specialty: schema.seasonalCalendar.specialty }).from(schema.seasonalCalendar);
  return Array.from(new Set(all.map(r => r.specialty)));
}

export async function deleteSeasonalKeyword(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.seasonalCalendar).where(eq(schema.seasonalCalendar.id, id));
}


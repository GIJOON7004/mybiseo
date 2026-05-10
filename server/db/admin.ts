/**
 * db/admin.ts — Admin 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getUnreadNotificationCount() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.adminNotifications)
    .where(eq(schema.adminNotifications.isRead, false));
  return row?.count ?? 0;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.adminNotifications).set({ isRead: true }).where(eq(schema.adminNotifications.id, id));
}

export async function markAllNotificationsRead() {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.adminNotifications).set({ isRead: true }).where(eq(schema.adminNotifications.isRead, false));
}


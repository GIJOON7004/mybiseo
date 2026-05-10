/**
 * db/inquiry.ts — Inquiry 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createInquiry(data: schema.InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.inquiries).values(data);
}

export async function getAllInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt));
}

export async function updateInquiryStatus(id: number, status: "new" | "contacted" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.inquiries).set({ status }).where(eq(schema.inquiries.id, id));
}

export async function deleteInquiry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.inquiries).where(eq(schema.inquiries.id, id));
}

export async function getInquiryStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, contacted: 0, completed: 0, todayNew: 0, weekNew: 0 };

  const all = await db.select().from(schema.inquiries);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  return {
    total: all.length,
    new: all.filter(i => i.status === "new").length,
    contacted: all.filter(i => i.status === "contacted").length,
    completed: all.filter(i => i.status === "completed").length,
    todayNew: all.filter(i => i.status === "new" && i.createdAt >= todayStart).length,
    weekNew: all.filter(i => i.createdAt >= weekStart).length,
  };
}


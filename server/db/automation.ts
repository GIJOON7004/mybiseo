/**
 * db/automation.ts — Automation 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createAutomationRule(data: schema.InsertAutomationRule) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.automationRules).values(data).$returningId();
  return result;
}

export async function getAutomationRulesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.automationRules).where(eq(schema.automationRules.userId, userId)).orderBy(desc(schema.automationRules.createdAt));
}

export async function updateAutomationRule(id: number, data: Partial<schema.InsertAutomationRule>) {
  const db = await getDb(); if (!db) return null;
  await db.update(schema.automationRules).set({ ...data, updatedAt: new Date() }).where(eq(schema.automationRules.id, id));
  const rows = await (await getDb())!.select().from(schema.automationRules).where(eq(schema.automationRules.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteAutomationRule(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(schema.automationRules).where(eq(schema.automationRules.id, id));
}

export async function createAutomationLog(data: { ruleId: number; userId: number; recipientEmail?: string; recipientPhone?: string; channel: string; status: string; errorMessage?: string; metadata?: any }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.automationLogs).values(data).$returningId();
  return result;
}

export async function getAutomationLogsByUser(userId: number, limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.automationLogs).where(eq(schema.automationLogs.userId, userId)).orderBy(desc(schema.automationLogs.createdAt)).limit(limit);
}


/**
 * db/chat.ts — chat 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import { eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray } from "drizzle-orm";
import { getDb } from "./connection";
import * as schema from "../../drizzle/schema";

export async function getChatSessionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteChatSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.chatMessages).where(eq(schema.chatMessages.sessionId, id));
  await db.delete(schema.chatSessions).where(eq(schema.chatSessions.id, id));
}



export async function saveChatMessage(sessionId: number, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(schema.chatMessages).values({ sessionId, role, content });
  await db.update(schema.chatSessions).set({
    messageCount: sql`${schema.chatSessions.messageCount} + 1`,
    lastMessageAt: new Date(),
  }).where(eq(schema.chatSessions.id, sessionId));
}


export async function updateChatSessionVisitor(sessionId: number, data: { name?: string; phone?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateSet: Record<string, unknown> = {};
  if (data.name) updateSet.visitorName = data.name;
  if (data.phone) updateSet.visitorPhone = data.phone;
  if (data.email) updateSet.visitorEmail = data.email;
  updateSet.hasInquiry = 1;

  if (Object.keys(updateSet).length > 0) {
    await db.update(schema.chatSessions).set(updateSet).where(eq(schema.chatSessions.id, sessionId));
  }
}


export async function findChatSessionByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.visitorPhone, phone)).orderBy(desc(schema.chatSessions.lastMessageAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


export async function getAllChatSessions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.chatSessions).orderBy(desc(schema.chatSessions.lastMessageAt));
}


export async function getChatMessagesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.chatMessages).where(eq(schema.chatMessages.sessionId, sessionId)).orderBy(schema.chatMessages.createdAt);
}


export async function getChatStats() {
  const db = await getDb();
  if (!db) return { totalSessions: 0, totalMessages: 0, withInquiry: 0, todaySessions: 0 };

  const sessions = await db.select().from(schema.chatSessions);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    totalSessions: sessions.length,
    totalMessages: sessions.reduce((sum, s) => sum + (s.messageCount ?? 0), 0),
    withInquiry: sessions.filter(s => s.hasInquiry === 1).length,
    todaySessions: sessions.filter(s => s.createdAt >= todayStart).length,
  };
}

// ── AI 검색 모니터링 ──


export async function updateChatSessionInsight(sessionId: number, insight: {
  specialty?: string;
  intentType?: string;
  conversionLikelihood?: string;
  summary?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.chatSessions)
    .set({
      insightSpecialty: insight.specialty || null,
      insightIntentType: insight.intentType || null,
      insightConversionLikelihood: insight.conversionLikelihood || null,
      insightSummary: insight.summary || null,
      insightExtractedAt: new Date(),
    })
    .where(eq(schema.chatSessions.id, sessionId));
}


export async function getSessionsWithoutInsight(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.chatSessions)
    .where(sql`${schema.chatSessions.insightExtractedAt} IS NULL AND ${schema.chatSessions.messageCount} >= 3`)
    .orderBy(desc(schema.chatSessions.createdAt))
    .limit(limit);
}


export async function getChatInsightStats() {
  const db = await getDb();
  if (!db) return { totalSessions: 0, analyzedSessions: 0, specialtyStats: [], intentStats: [], conversionStats: [] };
  const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.chatSessions);
  const [withInsight] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.chatSessions)
    .where(sql`${schema.chatSessions.insightExtractedAt} IS NOT NULL`);
  
  // 진료과별 관심도
  const specialtyStats = await db.select({
    specialty: schema.chatSessions.insightSpecialty,
    count: sql<number>`COUNT(*)`,
  }).from(schema.chatSessions)
    .where(sql`${schema.chatSessions.insightSpecialty} IS NOT NULL`)
    .groupBy(schema.chatSessions.insightSpecialty)
    .orderBy(sql`COUNT(*) DESC`);

  // 문의 유형별 통계
  const intentStats = await db.select({
    intentType: schema.chatSessions.insightIntentType,
    count: sql<number>`COUNT(*)`,
  }).from(schema.chatSessions)
    .where(sql`${schema.chatSessions.insightIntentType} IS NOT NULL`)
    .groupBy(schema.chatSessions.insightIntentType)
    .orderBy(sql`COUNT(*) DESC`);

  // 전환 가능성별 통계
  const conversionStats = await db.select({
    likelihood: schema.chatSessions.insightConversionLikelihood,
    count: sql<number>`COUNT(*)`,
  }).from(schema.chatSessions)
    .where(sql`${schema.chatSessions.insightConversionLikelihood} IS NOT NULL`)
    .groupBy(schema.chatSessions.insightConversionLikelihood)
    .orderBy(sql`COUNT(*) DESC`);

  return {
    totalSessions: total.count,
    analyzedSessions: withInsight.count,
    specialtyStats,
    intentStats,
    conversionStats,
  };
}

// ═══════════════════════════════════════════════════
// 7번: 사용자 행동 이벤트 로깅
// ═══════════════════════════════════════════════════

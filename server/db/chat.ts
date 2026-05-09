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


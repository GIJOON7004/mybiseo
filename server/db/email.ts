/**
 * db/email.ts — Email 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function upsertEmailContact(data: {
  email: string;
  name?: string;
  hospitalName?: string;
  specialty?: string;
  phone?: string;
  source: schema.InsertEmailContact["source"];
  tags?: string[];
  lastDiagnosisUrl?: string;
  lastDiagnosisScore?: number;
  lastDiagnosisGrade?: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  // 기존 연락처 확인
  const [existing] = await db.select().from(schema.emailContacts)
    .where(eq(schema.emailContacts.email, data.email)).limit(1);
  if (existing) {
    // 기존 연락처 업데이트 (새 데이터로 보강)
    const updates: any = { updatedAt: new Date() };
    if (data.name && !existing.name) updates.name = data.name;
    if (data.hospitalName) updates.hospitalName = data.hospitalName;
    if (data.specialty && !existing.specialty) updates.specialty = data.specialty;
    if (data.phone && !existing.phone) updates.phone = data.phone;
    if (data.lastDiagnosisUrl) {
      updates.lastDiagnosisUrl = data.lastDiagnosisUrl;
      updates.lastDiagnosisScore = data.lastDiagnosisScore;
      updates.lastDiagnosisGrade = data.lastDiagnosisGrade;
    }
    // 태그 병합
    if (data.tags && data.tags.length > 0) {
      const existingTags = (existing.tags as string[]) || [];
      const merged = Array.from(new Set([...existingTags, ...data.tags]));
      updates.tags = JSON.stringify(merged);
    }
    await db.update(schema.emailContacts).set(updates).where(eq(schema.emailContacts.id, existing.id));
    return existing.id;
  } else {
    // 새 연락처 생성
    const [result] = await db.insert(schema.emailContacts).values({
      email: data.email,
      name: data.name || null,
      hospitalName: data.hospitalName || null,
      specialty: data.specialty || null,
      phone: data.phone || null,
      source: data.source,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      lastDiagnosisUrl: data.lastDiagnosisUrl || null,
      lastDiagnosisScore: data.lastDiagnosisScore ?? null,
      lastDiagnosisGrade: data.lastDiagnosisGrade || null,
      note: data.note || null,
    } as any).$returningId();
    return result.id;
  }
}

export async function getEmailContacts(options?: {
  source?: string;
  status?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (options?.source) conditions.push(eq(schema.emailContacts.source, options.source as any));
  if (options?.status) conditions.push(eq(schema.emailContacts.status, options.status as any));
  if (options?.search) {
    conditions.push(
      sql`(${schema.emailContacts.email} LIKE ${`%${options.search}%`} OR ${schema.emailContacts.hospitalName} LIKE ${`%${options.search}%`} OR ${schema.emailContacts.name} LIKE ${`%${options.search}%`})`
    );
  }
  if (options?.tag) {
    conditions.push(sql`JSON_CONTAINS(${schema.emailContacts.tags}, ${JSON.stringify(options.tag)}, '$')`);
  }
  const query = db.select().from(schema.emailContacts);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return (where ? query.where(where) : query)
    .orderBy(desc(schema.emailContacts.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);
}

export async function getEmailContactStats() {
  const db = await getDb();
  if (!db) return null;
  const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.emailContacts);
  const [active] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.emailContacts).where(eq(schema.emailContacts.status, "active"));
  const sourceStats = await db.select({
    source: schema.emailContacts.source,
    count: sql<number>`COUNT(*)`,
  }).from(schema.emailContacts).groupBy(schema.emailContacts.source);
  const [recentWeek] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.emailContacts)
    .where(gte(schema.emailContacts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  return {
    total: total.count,
    active: active.count,
    recentWeek: recentWeek.count,
    bySource: sourceStats,
  };
}

export async function getEmailContactByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.emailContacts).where(eq(schema.emailContacts.email, email)).limit(1);
  return row || null;
}

export async function incrementEmailSentCount(contactId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.emailContacts).set({
    totalEmailsSent: sql`${schema.emailContacts.totalEmailsSent} + 1`,
    lastEmailSentAt: new Date(),
  }).where(eq(schema.emailContacts.id, contactId));
}

export async function createEmailSendLog(data: schema.InsertEmailSendLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.emailSendLogs).values(data).$returningId();
  return result.id;
}

export async function getEmailSendLogs(options?: {
  contactId?: number;
  email?: string;
  templateType?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (options?.contactId) conditions.push(eq(schema.emailSendLogs.contactId, options.contactId));
  if (options?.email) conditions.push(eq(schema.emailSendLogs.email, options.email));
  if (options?.templateType) conditions.push(eq(schema.emailSendLogs.templateType, options.templateType));
  const query = db.select().from(schema.emailSendLogs);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return (where ? query.where(where) : query)
    .orderBy(desc(schema.emailSendLogs.createdAt))
    .limit(options?.limit || 50);
}

export async function getEmailSendStats() {
  const db = await getDb();
  if (!db) return null;
  const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.emailSendLogs);
  const [sent] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.emailSendLogs).where(eq(schema.emailSendLogs.status, "sent"));
  const templateStats = await db.select({
    type: schema.emailSendLogs.templateType,
    count: sql<number>`COUNT(*)`,
  }).from(schema.emailSendLogs).groupBy(schema.emailSendLogs.templateType);
  return { total: total.count, sent: sent.count, byTemplate: templateStats };
}


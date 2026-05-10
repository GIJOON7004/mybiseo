/**
 * db/content-factory.ts — Content-Factory 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getStyleGuide(userId: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(schema.contentStyleGuides).where(eq(schema.contentStyleGuides.userId, userId)).limit(1);
  return rows[0] || null;
}

export async function upsertStyleGuide(userId: string, data: Partial<schema.ContentStyleGuide>) {
  const db = await getDb(); if (!db) return null;
  const existing = await getStyleGuide(userId);
  if (existing) {
    await db.update(schema.contentStyleGuides).set({ ...data, updatedAt: new Date() }).where(eq(schema.contentStyleGuides.id, existing.id));
    return { ...existing, ...data };
  }
  const [result] = await db.insert(schema.contentStyleGuides).values({ userId, ...data } as any);
  return { id: result.insertId, userId, ...data };
}

export async function getContentIdeas(userId: string, opts: { status?: string; platform?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  let q = db.select().from(schema.contentIdeas).where(eq(schema.contentIdeas.userId, userId)).orderBy(desc(schema.contentIdeas.createdAt));
  return q.limit(opts.limit || 50);
}

export async function createContentIdea(data: { userId: string; title: string; sourceUrl?: string; sourceType?: string; platform?: string; category?: string; whyItWorks?: string; viewCount?: string; notes?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.contentIdeas).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateContentIdea(id: number, userId: string, data: Partial<schema.ContentIdea>) {
  const db = await getDb(); if (!db) return null;
  await db.update(schema.contentIdeas).set(data).where(and(eq(schema.contentIdeas.id, id), eq(schema.contentIdeas.userId, userId)));
  return { id, ...data };
}

export async function deleteContentIdea(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.contentIdeas).where(and(eq(schema.contentIdeas.id, id), eq(schema.contentIdeas.userId, userId)));
  return true;
}

export async function getContentHooks(userId: string, opts: { category?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.contentHooks).where(eq(schema.contentHooks.userId, userId)).orderBy(desc(schema.contentHooks.createdAt)).limit(opts.limit || 50);
}

export async function createContentHook(data: { userId: string; hookText: string; hookType?: string; platform?: string; category?: string; sourceIdeaId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.contentHooks).values(data as any);
  return { id: result.insertId, ...data };
}

export async function deleteContentHook(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.contentHooks).where(and(eq(schema.contentHooks.id, id), eq(schema.contentHooks.userId, userId)));
  return true;
}

export async function getContentScripts(userId: string, opts: { status?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.contentScripts).where(eq(schema.contentScripts.userId, userId)).orderBy(desc(schema.contentScripts.createdAt)).limit(opts.limit || 50);
}

export async function createContentScript(data: { userId: string; title: string; hookId?: number; ideaId?: number; platform?: string; scriptType?: string; duration?: string; hookSection?: string; bodySection?: string; ctaSection?: string; fullScript?: string; hashtags?: string; hospitalId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.contentScripts).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateContentScript(id: number, userId: string, data: Partial<schema.ContentScript>) {
  const db = await getDb(); if (!db) return null;
  await db.update(schema.contentScripts).set(data).where(and(eq(schema.contentScripts.id, id), eq(schema.contentScripts.userId, userId)));
  return { id, ...data };
}

export async function getCalendarItems(userId: string, opts: { month?: string; platform?: string } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.contentCalendar).where(eq(schema.contentCalendar.userId, userId)).orderBy(desc(schema.contentCalendar.scheduledDate)).limit(100);
}

export async function createCalendarItem(data: { userId: string; title: string; scriptId?: number; platform: string; scheduledDate: Date; scheduledTime?: string; notes?: string; hospitalId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.contentCalendar).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateCalendarItem(id: number, userId: string, data: Partial<schema.ContentCalendarItem>) {
  const db = await getDb(); if (!db) return null;
  await db.update(schema.contentCalendar).set(data).where(and(eq(schema.contentCalendar.id, id), eq(schema.contentCalendar.userId, userId)));
  return { id, ...data };
}

export async function deleteCalendarItem(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.contentCalendar).where(and(eq(schema.contentCalendar.id, id), eq(schema.contentCalendar.userId, userId)));
  return true;
}

export async function getVideoPrompts(userId: string, opts: { videoType?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.videoPrompts).where(eq(schema.videoPrompts.userId, userId)).orderBy(desc(schema.videoPrompts.createdAt)).limit(opts.limit || 50);
}

export async function createVideoPrompt(data: { userId: string; treatmentName: string; videoType: string; targetPlatform?: string; prompt: string; script?: string; duration?: string; style?: string; musicSuggestion?: string; hashtags?: string; hospitalId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.videoPrompts).values(data as any);
  return { id: result.insertId, ...data };
}

export async function getMarketingDashboardStats(userId: string) {
  const db = await getDb(); if (!db) return null;
  const [ideasCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contentIdeas).where(eq(schema.contentIdeas.userId, userId));
  const [hooksCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contentHooks).where(eq(schema.contentHooks.userId, userId));
  const [scriptsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contentScripts).where(eq(schema.contentScripts.userId, userId));
  const [calendarCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contentCalendar).where(eq(schema.contentCalendar.userId, userId));
  const [videoPromptsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.videoPrompts).where(eq(schema.videoPrompts.userId, userId));
  const [diagnosisCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.diagnosisHistory);
  const [emailCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.emailContacts);
  const [treatmentPagesCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.treatmentPages).where(eq(schema.treatmentPages.userId, Number(userId)));
  const [benchmarkCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.benchmarkingReports).where(eq(schema.benchmarkingReports.userId, userId));
  const [blogCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.blogPosts);
  return {
    ideas: ideasCount?.count || 0,
    hooks: hooksCount?.count || 0,
    scripts: scriptsCount?.count || 0,
    calendarItems: calendarCount?.count || 0,
    videoPrompts: videoPromptsCount?.count || 0,
    diagnoses: diagnosisCount?.count || 0,
    emailContacts: emailCount?.count || 0,
    treatmentPages: treatmentPagesCount?.count || 0,
    benchmarkReports: benchmarkCount?.count || 0,
    blogPosts: blogCount?.count || 0,
  };
}

export async function deleteVideoPrompt(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.videoPrompts).where(and(eq(schema.videoPrompts.id, id), eq(schema.videoPrompts.userId, userId)));
  return true;
}

export async function getCalendarItemsByMonth(userId: string, year: number, month: number) {
  const db = await getDb(); if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(schema.contentCalendar)
    .where(and(
      eq(schema.contentCalendar.userId, userId),
      gte(schema.contentCalendar.scheduledDate, startDate),
      lte(schema.contentCalendar.scheduledDate, endDate),
    ))
    .orderBy(schema.contentCalendar.scheduledDate);
}

export async function getCalendarItemsByWeek(userId: string, startDate: Date) {
  const db = await getDb(); if (!db) return [];
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  return db.select().from(schema.contentCalendar)
    .where(and(
      eq(schema.contentCalendar.userId, userId),
      gte(schema.contentCalendar.scheduledDate, startDate),
      lte(schema.contentCalendar.scheduledDate, endDate),
    ))
    .orderBy(schema.contentCalendar.scheduledDate);
}

export async function createCalendarItemExtended(data: {
  userId: string;
  title: string;
  platform: string;
  scheduledDate: Date;
  scheduledTime?: string;
  notes?: string;
  hospitalId?: number;
  interviewVideoId?: number;
  contentType?: string;
  contentIndex?: number;
  contentSummary?: string;
  colorTag?: string;
  status?: string;
}) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.contentCalendar).values(data as any);
  return { id: result.insertId, ...data };
}


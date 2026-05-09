/**
 * db/ad.ts — ad 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import { eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray } from "drizzle-orm";
import { getDb } from "./connection";
import * as schema from "../../drizzle/schema";
import type { InsertAiMonitorCompetitor, InsertSeasonalCalendar, InsertAdminNotification } from "../../drizzle/schema";

export async function addAiMonitorCompetitor(data: InsertAiMonitorCompetitor) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.aiMonitorCompetitors).values(data);
}

export async function addSeasonalKeyword(data: InsertSeasonalCalendar) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.seasonalCalendar).values(data);
}

/**
 * 시즌 키워드 삭제
 */

export async function getAdminHospitalOverview() {
  const db = await getDb();
  if (!db) return { totalHospitals: 0, activeHospitals: 0, totalVisits: 0, totalInquiries: 0, avgSeoScore: 0, avgAiScore: 0 };

  // 병원 수
  const [totalCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.hospitalProfiles);
  const [activeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.hospitalProfiles)
    .where(eq(schema.hospitalProfiles.isActive, 1));

  // 최근 30일 방문 수
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [visitCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.siteVisits)
    .where(gte(schema.siteVisits.visitedAt, thirtyDaysAgo));

  // 최근 30일 상담 문의 수
  const [inquiryCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.consultationInquiries)
    .where(gte(schema.consultationInquiries.createdAt, thirtyDaysAgo));

  // 평균 SEO/AI 점수 (최근 진단 기준)
  const avgScores = await db.select({
    avgSeo: sql<number>`ROUND(AVG(${schema.diagnosisHistory.totalScore}))`,
    avgAi: sql<number>`ROUND(AVG(${schema.diagnosisHistory.aiScore}))`,
  }).from(schema.diagnosisHistory)
    .where(gte(schema.diagnosisHistory.diagnosedAt, thirtyDaysAgo));

  return {
    totalHospitals: totalCount?.count ?? 0,
    activeHospitals: activeCount?.count ?? 0,
    totalVisits: visitCount?.count ?? 0,
    totalInquiries: inquiryCount?.count ?? 0,
    avgSeoScore: avgScores[0]?.avgSeo ?? 0,
    avgAiScore: avgScores[0]?.avgAi ?? 0,
  };
}

/** 병원별 성과 순위 (관리자 대시보드용) */

export async function getAdminChannelStats() {
  const db = await getDb();
  if (!db) return [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db.select({
    channel: schema.siteVisits.channel,
    count: sql<number>`COUNT(*)`,
    uniqueVisitors: sql<number>`COUNT(DISTINCT ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(gte(schema.siteVisits.visitedAt, thirtyDaysAgo))
    .groupBy(schema.siteVisits.channel)
    .orderBy(sql`COUNT(*) DESC`);
}

// ═══════════════════════════════════════════════════
// 관리자 알림 시스템
// ═══════════════════════════════════════════════════

/** 알림 생성 */

export async function createAdminNotification(data: InsertAdminNotification) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.adminNotifications).values(data);
  return result;
}

/** 알림 목록 조회 (최신순, limit) */

export async function getAdminNotifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.adminNotifications)
    .orderBy(desc(schema.adminNotifications.createdAt))
    .limit(limit);
}

/** 읽지 않은 알림 수 */

export async function createAdBrandProfile(data: { userId: string; hospitalUrl: string; hospitalName?: string; logoUrl?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string; fontStyle?: string; toneOfVoice?: string; targetAudience?: string; brandKeywords?: string; specialties?: string; brandSummary?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.adBrandProfiles).values(data).$returningId();
  return result;
}

export async function getAdBrandProfiles(userId: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.adBrandProfiles).where(eq(schema.adBrandProfiles.userId, userId)).orderBy(desc(schema.adBrandProfiles.createdAt));
}

export async function getAdBrandProfileById(id: number, userId: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(schema.adBrandProfiles).where(and(eq(schema.adBrandProfiles.id, id), eq(schema.adBrandProfiles.userId, userId)));
  return rows[0] || null;
}

export async function updateAdBrandProfile(id: number, userId: string, data: Partial<{ hospitalName: string; logoUrl: string; primaryColor: string; secondaryColor: string; accentColor: string; fontStyle: string; toneOfVoice: string; targetAudience: string; brandKeywords: string; specialties: string; brandSummary: string }>) {
  const db = await getDb(); if (!db) return false;
  await db.update(schema.adBrandProfiles).set(data).where(and(eq(schema.adBrandProfiles.id, id), eq(schema.adBrandProfiles.userId, userId)));
  return true;
}

export async function deleteAdBrandProfile(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.adBrandProfiles).where(and(eq(schema.adBrandProfiles.id, id), eq(schema.adBrandProfiles.userId, userId)));
  return true;
}

export async function createAdCreative(data: { userId: string; brandProfileId?: number; platform: string; adType: string; treatmentName?: string; headline?: string; bodyText?: string; ctaText?: string; imageUrl?: string; imagePrompt?: string; dimensions?: string; hashtags?: string; complianceStatus?: string; complianceNotes?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(schema.adCreatives).values(data).$returningId();
  return result;
}

export async function getAdCreatives(userId: string, filters?: { platform?: string; brandProfileId?: number; favoriteOnly?: boolean }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(schema.adCreatives.userId, userId)];
  if (filters?.platform) conditions.push(eq(schema.adCreatives.platform, filters.platform));
  if (filters?.brandProfileId) conditions.push(eq(schema.adCreatives.brandProfileId, filters.brandProfileId));
  if (filters?.favoriteOnly) conditions.push(eq(schema.adCreatives.isFavorite, 1));
  return db.select().from(schema.adCreatives).where(and(...conditions)).orderBy(desc(schema.adCreatives.createdAt));
}

export async function getAdCreativeById(id: number, userId: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(schema.adCreatives).where(and(eq(schema.adCreatives.id, id), eq(schema.adCreatives.userId, userId)));
  return rows[0] || null;
}

export async function updateAdCreative(id: number, userId: string, data: Partial<{ headline: string; bodyText: string; ctaText: string; hashtags: string; isFavorite: number; complianceStatus: string; complianceNotes: string; status: string }>) {
  const db = await getDb(); if (!db) return false;
  await db.update(schema.adCreatives).set(data).where(and(eq(schema.adCreatives.id, id), eq(schema.adCreatives.userId, userId)));
  return true;
}

export async function deleteAdCreative(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(schema.adCreatives).where(and(eq(schema.adCreatives.id, id), eq(schema.adCreatives.userId, userId)));
  return true;
}

export async function getAdCreativeStats(userId: string) {
  const db = await getDb(); if (!db) return { total: 0, byPlatform: {}, byType: {} };
  const all = await db.select().from(schema.adCreatives).where(eq(schema.adCreatives.userId, userId));
  const byPlatform: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const c of all) {
    byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
    byType[c.adType] = (byType[c.adType] || 0) + 1;
  }
  return { total: all.length, byPlatform, byType };
}


// ─── 주간 브리핑 통계 ───


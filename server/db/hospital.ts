/**
 * db/hospital.ts — hospital 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import { eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray } from "drizzle-orm";
import { getDb } from "./connection";
import * as schema from "../../drizzle/schema";
import type { InsertHospitalProfile, InsertHospitalInfoItem } from "../../drizzle/schema";

export async function createHospitalProfile(data: InsertHospitalProfile) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(schema.hospitalProfiles).values(data);
  return result;
}

export async function getHospitalProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.hospitalProfiles)
    .where(and(eq(schema.hospitalProfiles.userId, userId), eq(schema.hospitalProfiles.isActive, 1)))
    .limit(1);
  return rows[0] || null;
}

export async function getHospitalProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.hospitalProfiles)
    .where(eq(schema.hospitalProfiles.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function updateHospitalProfile(id: number, data: Partial<InsertHospitalProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.hospitalProfiles).set(data).where(eq(schema.hospitalProfiles.id, id));
}

export async function getAllHospitalProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.hospitalProfiles)
    .where(eq(schema.hospitalProfiles.isActive, 1))
    .orderBy(desc(schema.hospitalProfiles.createdAt));
}

export async function getHospitalDashboardData(hospitalUrl: string) {
  const db = await getDb();
  if (!db) return { history: [], benchmarks: [], ranking: [] };
  
  // 진단 이력 (최근 20개)
  const history = await db.select().from(schema.diagnosisHistory)
    .where(eq(schema.diagnosisHistory.url, hospitalUrl))
    .orderBy(desc(schema.diagnosisHistory.diagnosedAt))
    .limit(20);
  
  // 해당 진료과 벤치마크
  const specialty = history[0]?.specialty;
  let benchmarks: any[] = [];
  if (specialty) {
    benchmarks = await db.select().from(schema.benchmarkData)
      .where(eq(schema.benchmarkData.specialty, specialty))
      .orderBy(desc(schema.benchmarkData.period))
      .limit(12);
  }
  
  // 전체 진단 이력에서 같은 진료과 순위 계산
  const latestScores = await db.select({
    url: schema.diagnosisHistory.url,
    totalScore: schema.diagnosisHistory.totalScore,
    aiScore: schema.diagnosisHistory.aiScore,
    specialty: schema.diagnosisHistory.specialty,
  }).from(schema.diagnosisHistory)
    .where(specialty ? eq(schema.diagnosisHistory.specialty, specialty) : sql`1=1`)
    .orderBy(desc(schema.diagnosisHistory.diagnosedAt))
    .limit(500);
  
  // URL별 최신 점수만 추출
  const urlScoreMap = new Map<string, { totalScore: number; aiScore: number }>();
  for (const row of latestScores) {
    if (!urlScoreMap.has(row.url)) {
      urlScoreMap.set(row.url, { totalScore: row.totalScore, aiScore: row.aiScore });
    }
  }
  
  // 순위 계산
  const ranking = Array.from(urlScoreMap)
    .sort((a, b) => b[1].totalScore - a[1].totalScore)
    .map((entry, idx) => ({
      rank: idx + 1,
      url: entry[0],
      totalScore: entry[1].totalScore,
      aiScore: entry[1].aiScore,
      isMe: entry[0] === hospitalUrl,
    }));
  
  const myRank = ranking.find(r => r.isMe);
  
  return {
    history: history.reverse(), // 시간순 정렬 (오래된 것 먼저)
    benchmarks,
    ranking: ranking.slice(0, 20),
    myRank: myRank ? { rank: myRank.rank, total: ranking.length, percentile: Math.round((1 - myRank.rank / ranking.length) * 100) } : null,
  };
}


// ═══════════════════════════════════════════════════
// AI 모니터링 경쟁사 (Competitors)
// ═══════════════════════════════════════════════════

export async function getActiveHospitalProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.hospitalProfiles)
    .where(eq(schema.hospitalProfiles.isActive, 1));
}

/** 마지막 자동 진단 날짜 조회 */

export async function getHospitalPerformanceRanking() {
  const db = await getDb();
  if (!db) return [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 병원별 방문수 집계
  const visitsByHospital = await db.select({
    hospitalId: schema.siteVisits.hospitalId,
    visitCount: sql<number>`COUNT(*)`,
    uniqueVisitors: sql<number>`COUNT(DISTINCT ${schema.siteVisits.visitorId})`,
  }).from(schema.siteVisits)
    .where(gte(schema.siteVisits.visitedAt, thirtyDaysAgo))
    .groupBy(schema.siteVisits.hospitalId);

  // 병원별 상담수 집계
  const inquiriesByHospital = await db.select({
    hospitalId: schema.consultationInquiries.hospitalId,
    inquiryCount: sql<number>`COUNT(*)`,
  }).from(schema.consultationInquiries)
    .where(gte(schema.consultationInquiries.createdAt, thirtyDaysAgo))
    .groupBy(schema.consultationInquiries.hospitalId);

  // 병원 프로필
  const profiles = await db.select().from(schema.hospitalProfiles)
    .where(eq(schema.hospitalProfiles.isActive, 1));

  // 최근 진단 점수
  const latestScores = await db.select({
    url: schema.diagnosisHistory.url,
    totalScore: sql<number>`MAX(${schema.diagnosisHistory.totalScore})`,
    aiScore: sql<number>`MAX(${schema.diagnosisHistory.aiScore})`,
  }).from(schema.diagnosisHistory)
    .where(gte(schema.diagnosisHistory.diagnosedAt, thirtyDaysAgo))
    .groupBy(schema.diagnosisHistory.url);

  return profiles.map(p => {
    const visits = visitsByHospital.find(v => v.hospitalId === p.id);
    const inquiries = inquiriesByHospital.find(i => i.hospitalId === p.id);
    const scores = latestScores.find(s => s.url === p.hospitalUrl);
    return {
      id: p.id,
      hospitalName: p.hospitalName,
      hospitalUrl: p.hospitalUrl,
      specialty: p.specialty,
      region: p.region,
      visitCount: visits?.visitCount ?? 0,
      uniqueVisitors: visits?.uniqueVisitors ?? 0,
      inquiryCount: inquiries?.inquiryCount ?? 0,
      seoScore: scores?.totalScore ?? null,
      aiScore: scores?.aiScore ?? null,
      createdAt: p.createdAt,
    };
  }).sort((a, b) => b.visitCount - a.visitCount);
}

/** 전체 병원 채널별 유입 통계 (관리자용) */

export async function getHospitalInfoItems(hospitalId: number, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(schema.hospitalInfoItems.hospitalId, hospitalId)];
  if (category) {
    conditions.push(eq(schema.hospitalInfoItems.category, category as any));
  }
  return db.select().from(schema.hospitalInfoItems)
    .where(and(...conditions))
    .orderBy(schema.hospitalInfoItems.sortOrder, schema.hospitalInfoItems.createdAt);
}

export async function createHospitalInfoItem(data: InsertHospitalInfoItem) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.hospitalInfoItems).values(data).$returningId();
  return result;
}

export async function updateHospitalInfoItem(id: number, hospitalId: number, data: Partial<InsertHospitalInfoItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.hospitalInfoItems).set(data)
    .where(and(eq(schema.hospitalInfoItems.id, id), eq(schema.hospitalInfoItems.hospitalId, hospitalId)));
}

export async function deleteHospitalInfoItem(id: number, hospitalId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.hospitalInfoItems)
    .where(and(eq(schema.hospitalInfoItems.id, id), eq(schema.hospitalInfoItems.hospitalId, hospitalId)));
}

// ─── 상담 CRM 확장 (파이프라인 통계) ──────────────────────────────


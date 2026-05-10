/**
 * db/ai-monitor.ts — Ai-Monitor 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createAiMonitorKeyword(data: schema.InsertAiMonitorKeyword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.aiMonitorKeywords).values(data);
}

export async function getAiMonitorKeywords(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(schema.aiMonitorKeywords).where(eq(schema.aiMonitorKeywords.isActive, 1)).orderBy(desc(schema.aiMonitorKeywords.createdAt));
  }
  return db.select().from(schema.aiMonitorKeywords).orderBy(desc(schema.aiMonitorKeywords.createdAt));
}

export async function toggleAiMonitorKeyword(id: number, isActive: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.aiMonitorKeywords).set({ isActive }).where(eq(schema.aiMonitorKeywords.id, id));
}

export async function deleteAiMonitorKeyword(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.aiMonitorResults).where(eq(schema.aiMonitorResults.keywordId, id));
  await db.delete(schema.aiMonitorKeywords).where(eq(schema.aiMonitorKeywords.id, id));
}

export async function createAiMonitorResult(data: schema.InsertAiMonitorResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.aiMonitorResults).values(data);
}

export async function getAiMonitorResults(keywordId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (keywordId) {
    return db.select().from(schema.aiMonitorResults)
      .where(eq(schema.aiMonitorResults.keywordId, keywordId))
      .orderBy(desc(schema.aiMonitorResults.checkedAt))
      .limit(limit);
  }
  return db.select().from(schema.aiMonitorResults)
    .orderBy(desc(schema.aiMonitorResults.checkedAt))
    .limit(limit);
}

export async function getAiMonitorStats() {
  const db = await getDb();
  if (!db) return { totalKeywords: 0, totalChecks: 0, mentionRate: 0, lastChecked: null as string | null };
  
  const keywords = await db.select().from(schema.aiMonitorKeywords).where(eq(schema.aiMonitorKeywords.isActive, 1));
  const results = await db.select().from(schema.aiMonitorResults).orderBy(desc(schema.aiMonitorResults.checkedAt)).limit(200);
  
  const mentionedCount = results.filter(r => r.mentioned === 1).length;
  const mentionRate = results.length > 0 ? Math.round((mentionedCount / results.length) * 100) : 0;
  const lastChecked = results.length > 0 ? results[0].checkedAt.toISOString() : null;
  
  return {
    totalKeywords: keywords.length,
    totalChecks: results.length,
    mentionRate,
    lastChecked,
  };
}

export async function getAiMonitorTrend(weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  const results = await db.select().from(schema.aiMonitorResults)
    .where(gte(schema.aiMonitorResults.checkedAt, since))
    .orderBy(schema.aiMonitorResults.checkedAt);
  
  // 주간 단위로 집계
  const weeklyMap = new Map<string, { week: string; total: number; mentioned: number; platforms: Record<string, { total: number; mentioned: number }> }>();
  
  for (const r of results) {
    const d = new Date(r.checkedAt);
    // ISO week 기준
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { week: weekKey, total: 0, mentioned: 0, platforms: {} });
    }
    const entry = weeklyMap.get(weekKey)!;
    entry.total++;
    if (r.mentioned) entry.mentioned++;
    
    const platform = r.platform;
    if (!entry.platforms[platform]) {
      entry.platforms[platform] = { total: 0, mentioned: 0 };
    }
    entry.platforms[platform].total++;
    if (r.mentioned) entry.platforms[platform].mentioned++;
  }
  
  return Array.from(weeklyMap.values()).sort((a, b) => a.week.localeCompare(b.week));
}

export async function getAiMonitorKeywordTrend(keywordId: number, weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  return db.select().from(schema.aiMonitorResults)
    .where(and(
      eq(schema.aiMonitorResults.keywordId, keywordId),
      gte(schema.aiMonitorResults.checkedAt, since)
    ))
    .orderBy(schema.aiMonitorResults.checkedAt);
}

export async function getAiMonitorCompetitors(keywordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.aiMonitorCompetitors)
    .where(eq(schema.aiMonitorCompetitors.keywordId, keywordId))
    .orderBy(desc(schema.aiMonitorCompetitors.createdAt));
}

export async function deleteAiMonitorCompetitor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.aiMonitorCompetitors).where(eq(schema.aiMonitorCompetitors.id, id));
}

export async function getAllCompetitorsForKeywords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.aiMonitorCompetitors).orderBy(schema.aiMonitorCompetitors.keywordId);
}

export async function saveAiExposureScore(data: schema.InsertAiExposureScore) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.aiExposureScores).values(data);
}

export async function getAiExposureScores(keywordId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.aiExposureScores)
    .where(eq(schema.aiExposureScores.keywordId, keywordId))
    .orderBy(desc(schema.aiExposureScores.periodEnd))
    .limit(limit);
}

export async function getLatestAiExposureScores() {
  const db = await getDb();
  if (!db) return [];
  // 각 키워드별 최신 점수
  const all = await db.select().from(schema.aiExposureScores)
    .orderBy(desc(schema.aiExposureScores.periodEnd))
    .limit(200);
  
  const keywordMap = new Map<number, typeof all[0]>();
  for (const row of all) {
    if (!keywordMap.has(row.keywordId)) {
      keywordMap.set(row.keywordId, row);
    }
  }
  return Array.from(keywordMap.values());
}

export async function getAiMonitorStatsEnhanced() {
  const db = await getDb();
  if (!db) return {
    totalKeywords: 0, totalChecks: 0, mentionRate: 0, lastChecked: null as string | null,
    totalCompetitors: 0, avgScore: 0, platformBreakdown: {} as Record<string, { total: number; mentioned: number; rate: number }>,
  };
  
  const keywords = await db.select().from(schema.aiMonitorKeywords).where(eq(schema.aiMonitorKeywords.isActive, 1));
  const results = await db.select().from(schema.aiMonitorResults).orderBy(desc(schema.aiMonitorResults.checkedAt)).limit(500);
  const competitors = await db.select().from(schema.aiMonitorCompetitors);
  const scores = await db.select().from(schema.aiExposureScores).orderBy(desc(schema.aiExposureScores.periodEnd)).limit(100);
  
  const mentionedCount = results.filter(r => r.mentioned === 1).length;
  const mentionRate = results.length > 0 ? Math.round((mentionedCount / results.length) * 100) : 0;
  const lastChecked = results.length > 0 ? results[0].checkedAt.toISOString() : null;
  
  // 플랫폼별 통계
  const platformBreakdown: Record<string, { total: number; mentioned: number; rate: number }> = {};
  for (const r of results) {
    if (!platformBreakdown[r.platform]) {
      platformBreakdown[r.platform] = { total: 0, mentioned: 0, rate: 0 };
    }
    platformBreakdown[r.platform].total++;
    if (r.mentioned === 1) platformBreakdown[r.platform].mentioned++;
  }
  for (const p of Object.keys(platformBreakdown)) {
    const pb = platformBreakdown[p];
    pb.rate = pb.total > 0 ? Math.round((pb.mentioned / pb.total) * 100) : 0;
  }
  
  // 평균 노출 점수
  const keywordLatestScores = new Map<number, number>();
  for (const s of scores) {
    if (!keywordLatestScores.has(s.keywordId)) {
      keywordLatestScores.set(s.keywordId, s.score);
    }
  }
  const avgScore = keywordLatestScores.size > 0
    ? Math.round(Array.from(keywordLatestScores.values()).reduce((a, b) => a + b, 0) / keywordLatestScores.size)
    : 0;
  
  return {
    totalKeywords: keywords.length,
    totalChecks: results.length,
    mentionRate,
    lastChecked,
    totalCompetitors: competitors.length,
    avgScore,
    platformBreakdown,
  };
}

export async function createAiImprovementReport(data: schema.InsertAiImprovementReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(schema.aiImprovementReports).values(data).$returningId();
  return result;
}

export async function getAiImprovementReports(keywordId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (keywordId) {
    return db.select().from(schema.aiImprovementReports)
      .where(eq(schema.aiImprovementReports.keywordId, keywordId))
      .orderBy(desc(schema.aiImprovementReports.createdAt));
  }
  return db.select().from(schema.aiImprovementReports)
    .orderBy(desc(schema.aiImprovementReports.createdAt));
}

export async function getAiImprovementReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.aiImprovementReports)
    .where(eq(schema.aiImprovementReports.id, id));
  return rows[0] || null;
}

export async function deleteAiImprovementReport(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.aiImprovementReports).where(eq(schema.aiImprovementReports.id, id));
}

export async function getKeywordMonitoringDataForReport(keywordId: number) {
  const db = await getDb();
  if (!db) return null;

  // 키워드 정보
  const kwRows = await db.select().from(schema.aiMonitorKeywords)
    .where(eq(schema.aiMonitorKeywords.id, keywordId));
  if (kwRows.length === 0) return null;
  const keyword = kwRows[0];

  // 최신 결과 (각 플랫폼별 최신 1건)
  const results = await db.select().from(schema.aiMonitorResults)
    .where(eq(schema.aiMonitorResults.keywordId, keywordId))
    .orderBy(desc(schema.aiMonitorResults.checkedAt));

  // 플랫폼별 최신 결과만 추출
  const latestByPlatform = new Map<string, typeof results[0]>();
  for (const r of results) {
    if (!latestByPlatform.has(r.platform)) {
      latestByPlatform.set(r.platform, r);
    }
  }

  // 최신 노출 점수
  const scoreRows = await db.select().from(schema.aiExposureScores)
    .where(eq(schema.aiExposureScores.keywordId, keywordId))
    .orderBy(desc(schema.aiExposureScores.createdAt))
    .limit(1);

  // 경쟁사 목록
  const competitors = await db.select().from(schema.aiMonitorCompetitors)
    .where(eq(schema.aiMonitorCompetitors.keywordId, keywordId));

  return {
    keyword,
    results: Array.from(latestByPlatform.values()),
    exposureScore: scoreRows[0] || null,
    competitors,
  };
}

export async function getAiChannelDetail(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    channel: schema.siteVisits.channel,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${schema.siteVisits.visitorId})`,
    avgDuration: sql<number>`COALESCE(AVG(${schema.siteVisits.duration}), 0)`,
  }).from(schema.siteVisits)
    .where(and(
      eq(schema.siteVisits.hospitalId, hospitalId),
      gte(schema.siteVisits.visitedAt, from),
      lte(schema.siteVisits.visitedAt, to),
      sql`${schema.siteVisits.channel} LIKE 'ai_%'`
    ))
    .groupBy(schema.siteVisits.channel)
    .orderBy(sql`count(*) desc`);
}


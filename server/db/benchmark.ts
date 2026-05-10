/**
 * db/benchmark.ts — Benchmark 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function saveBenchmarkData(data: schema.InsertBenchmarkData) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.benchmarkData).values(data);
}

export async function getBenchmarkBySpecialty(specialty: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.benchmarkData)
    .where(eq(schema.benchmarkData.specialty, specialty))
    .orderBy(desc(schema.benchmarkData.period))
    .limit(12);
}

export async function getBenchmarkByRegion(region: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.benchmarkData)
    .where(eq(schema.benchmarkData.region, region))
    .orderBy(desc(schema.benchmarkData.period))
    .limit(12);
}

export async function getLatestBenchmarks() {
  const db = await getDb();
  if (!db) return [];
  // 가장 최근 period의 데이터
  const latestPeriod = await db.select({ period: schema.benchmarkData.period })
    .from(schema.benchmarkData)
    .orderBy(desc(schema.benchmarkData.period))
    .limit(1);
  if (latestPeriod.length === 0) return [];
  return db.select().from(schema.benchmarkData)
    .where(eq(schema.benchmarkData.period, latestPeriod[0].period))
    .orderBy(desc(schema.benchmarkData.sampleCount));
}

export async function saveMonthlyAward(data: schema.InsertMonthlyAward) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schema.monthlyAwards).values(data);
}

export async function getMonthlyAwards(period?: string) {
  const db = await getDb();
  if (!db) return [];
  if (period) {
    return db.select().from(schema.monthlyAwards)
      .where(eq(schema.monthlyAwards.period, period))
      .orderBy(schema.monthlyAwards.rank);
  }
  // 최신 period
  const latestPeriod = await db.select({ period: schema.monthlyAwards.period })
    .from(schema.monthlyAwards)
    .orderBy(desc(schema.monthlyAwards.period))
    .limit(1);
  if (latestPeriod.length === 0) return [];
  return db.select().from(schema.monthlyAwards)
    .where(eq(schema.monthlyAwards.period, latestPeriod[0].period))
    .orderBy(schema.monthlyAwards.rank);
}

export async function aggregateMonthlyBenchmark(period: string) {
  const db = await getDb();
  if (!db) return [];
  
  // 해당 월의 진단 이력에서 진료과별 평균 점수 집계
  const stats = await db.select({
    specialty: schema.diagnosisHistory.specialty,
    avgTotal: sql<number>`ROUND(AVG(${schema.diagnosisHistory.totalScore}))`,
    avgAi: sql<number>`ROUND(AVG(${schema.diagnosisHistory.aiScore}))`,
    count: sql<number>`COUNT(*)`,
    topPercentile: sql<number>`ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY ${schema.diagnosisHistory.totalScore}))`,
  }).from(schema.diagnosisHistory)
    .where(sql`DATE_FORMAT(${schema.diagnosisHistory.diagnosedAt}, '%Y-%m') = ${period} AND ${schema.diagnosisHistory.specialty} IS NOT NULL`)
    .groupBy(schema.diagnosisHistory.specialty);

  const results = [];
  for (const stat of stats) {
    if (!stat.specialty) continue;
    await db.insert(schema.benchmarkData).values({
      period,
      specialty: stat.specialty,
      region: "전국",
      avgTotalScore: stat.avgTotal || 0,
      avgAiScore: stat.avgAi || 0,
      sampleCount: stat.count || 0,
      topPercentile: stat.topPercentile || 0,
    });
    results.push(stat);
  }
  return results;
}

export async function generateMonthlyAwards(period: string) {
  const db = await getDb();
  if (!db) return [];
  
  // 해당 월의 진단 이력에서 진료과별 상위 병원 선정
  const topHospitals = await db.select({
    url: schema.diagnosisHistory.url,
    specialty: schema.diagnosisHistory.specialty,
    totalScore: sql<number>`MAX(${schema.diagnosisHistory.totalScore})`,
    aiScore: sql<number>`MAX(${schema.diagnosisHistory.aiScore})`,
  }).from(schema.diagnosisHistory)
    .where(sql`DATE_FORMAT(${schema.diagnosisHistory.diagnosedAt}, '%Y-%m') = ${period} AND ${schema.diagnosisHistory.specialty} IS NOT NULL`)
    .groupBy(schema.diagnosisHistory.url, schema.diagnosisHistory.specialty)
    .orderBy(sql`MAX(${schema.diagnosisHistory.totalScore}) DESC`)
    .limit(30);

  const awards = [];
  for (let i = 0; i < topHospitals.length; i++) {
    const h = topHospitals[i];
    let badgeType: "gold" | "silver" | "bronze" | "top10" | "top30" = "top30";
    if (i === 0) badgeType = "gold";
    else if (i === 1) badgeType = "silver";
    else if (i === 2) badgeType = "bronze";
    else if (i < 10) badgeType = "top10";

    const domain = h.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    await db.insert(schema.monthlyAwards).values({
      period,
      url: h.url,
      hospitalName: domain,
      specialty: h.specialty,
      totalScore: h.totalScore || 0,
      aiScore: h.aiScore || 0,
      rank: i + 1,
      badgeType,
    });
    awards.push({ rank: i + 1, url: h.url, totalScore: h.totalScore, badgeType });
  }
  return awards;
}


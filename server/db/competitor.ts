/**
 * db/competitor.ts — Competitor 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getCompetitorComparison(keywordId?: number) {
  const db = await getDb();
  if (!db) return { keywords: [], comparison: [] };
  
  const keywords = await db.select().from(schema.aiMonitorKeywords).where(eq(schema.aiMonitorKeywords.isActive, 1));
  
  // 최근 모니터링 결과 가져오기 (최근 4주)
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  let results;
  if (keywordId) {
    results = await db.select().from(schema.aiMonitorResults)
      .where(and(
        eq(schema.aiMonitorResults.keywordId, keywordId),
        gte(schema.aiMonitorResults.checkedAt, fourWeeksAgo)
      ))
      .orderBy(desc(schema.aiMonitorResults.checkedAt));
  } else {
    results = await db.select().from(schema.aiMonitorResults)
      .where(gte(schema.aiMonitorResults.checkedAt, fourWeeksAgo))
      .orderBy(desc(schema.aiMonitorResults.checkedAt));
  }
  
  const competitors = await db.select().from(schema.aiMonitorCompetitors);
  
  // 키워드별 비교 데이터 생성
  const comparison = keywords.map(kw => {
    const kwResults = results.filter(r => r.keywordId === kw.id);
    const kwCompetitors = competitors.filter(c => c.keywordId === kw.id);
    
    // 우리 병원 언급 통계
    const ourMentions = kwResults.filter(r => r.mentioned === 1).length;
    const totalChecks = kwResults.length;
    const ourMentionRate = totalChecks > 0 ? Math.round((ourMentions / totalChecks) * 100) : 0;
    
    // 플랫폼별 우리 병원 언급
    const platformStats: Record<string, { total: number; mentioned: number; rate: number }> = {};
    for (const r of kwResults) {
      if (!platformStats[r.platform]) {
        platformStats[r.platform] = { total: 0, mentioned: 0, rate: 0 };
      }
      platformStats[r.platform].total++;
      if (r.mentioned === 1) platformStats[r.platform].mentioned++;
    }
    for (const p of Object.keys(platformStats)) {
      platformStats[p].rate = platformStats[p].total > 0
        ? Math.round((platformStats[p].mentioned / platformStats[p].total) * 100) : 0;
    }
    
    // 경쟁사 언급 분석 (competitorsMentioned 필드 파싱)
    const competitorMentionCounts: Record<string, number> = {};
    for (const r of kwResults) {
      if (r.competitorsMentioned) {
        try {
          const mentioned = JSON.parse(r.competitorsMentioned);
          if (Array.isArray(mentioned)) {
            for (const name of mentioned) {
              competitorMentionCounts[name] = (competitorMentionCounts[name] || 0) + 1;
            }
          }
        } catch (e) { console.warn("[DB] Suppressed error:", e); }
      }
    }
    
    // 경쟁사별 언급률
    const competitorAnalysis = kwCompetitors.map(c => ({
      id: c.id,
      name: c.competitorName,
      url: c.competitorUrl,
      mentionCount: competitorMentionCounts[c.competitorName] || 0,
      mentionRate: totalChecks > 0
        ? Math.round(((competitorMentionCounts[c.competitorName] || 0) / totalChecks) * 100) : 0,
    }));
    
    // 감성 분석
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const r of kwResults) {
      if (r.sentiment && r.mentioned === 1) {
        sentimentCounts[r.sentiment as keyof typeof sentimentCounts]++;
      }
    }
    
    return {
      keywordId: kw.id,
      keyword: kw.keyword,
      hospitalName: kw.hospitalName,
      specialty: kw.specialty,
      totalChecks,
      ourMentionRate,
      ourMentions,
      platformStats,
      competitorAnalysis,
      sentimentCounts,
    };
  });
  
  return { keywords, comparison };
}

export async function getCompetitorTrend(keywordId: number, weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];
  
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  const results = await db.select().from(schema.aiMonitorResults)
    .where(and(
      eq(schema.aiMonitorResults.keywordId, keywordId),
      gte(schema.aiMonitorResults.checkedAt, since)
    ))
    .orderBy(schema.aiMonitorResults.checkedAt);
  
  // 주간 버킷으로 분류
  const weekBuckets: Record<string, { our: number; total: number; competitors: Record<string, number> }> = {};
  
  for (const r of results) {
    const weekStart = new Date(r.checkedAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    
    if (!weekBuckets[weekKey]) {
      weekBuckets[weekKey] = { our: 0, total: 0, competitors: {} };
    }
    weekBuckets[weekKey].total++;
    if (r.mentioned === 1) weekBuckets[weekKey].our++;
    
    // 경쟁사 언급
    if (r.competitorsMentioned) {
      try {
        const mentioned = JSON.parse(r.competitorsMentioned);
        if (Array.isArray(mentioned)) {
          for (const name of mentioned) {
            weekBuckets[weekKey].competitors[name] = (weekBuckets[weekKey].competitors[name] || 0) + 1;
          }
        }
      } catch (e) { console.warn("[DB] Suppressed error:", e); }
    }
  }
  
  return Object.entries(weekBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week,
      ourMentionRate: data.total > 0 ? Math.round((data.our / data.total) * 100) : 0,
      totalChecks: data.total,
      competitorRates: Object.fromEntries(
        Object.entries(data.competitors).map(([name, count]) => [
          name,
          data.total > 0 ? Math.round((count / data.total) * 100) : 0
        ])
      ),
    }));
}


/**
 * db/briefing.ts — Briefing 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (Strangler Fig 완료)
 */
import { eq, desc, sql, and, lt, ne, gt, gte, lte, or, asc, inArray, isNull, count, sum, avg, between, like, not } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getWeeklyBriefingData() {
  const db = await getDb();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1) 이번 주 + 전주 블로그 발행 수
  let weeklyBlogCount = 0;
  let prevWeekBlogCount = 0;
  let totalBlogCount = 0;
  if (db) {
    const allPosts = await db.select().from(schema.blogPosts);
    const published = allPosts.filter(p => p.published === "published");
    totalBlogCount = published.length;
    weeklyBlogCount = published.filter(p => p.createdAt && new Date(p.createdAt) >= weekAgo).length;
    prevWeekBlogCount = published.filter(p => p.createdAt && new Date(p.createdAt) >= twoWeeksAgo && new Date(p.createdAt) < weekAgo).length;
  }

  // 2) 이번 주 + 전주 챗봇 세션 수 + 예약 문의 수
  let weeklyChatSessions = 0;
  let weeklyInquiries = 0;
  let prevWeekChatSessions = 0;
  let prevWeekInquiries = 0;
  let totalChatSessions = 0;
  if (db) {
    const sessions = await db.select().from(schema.chatSessions);
    totalChatSessions = sessions.length;
    const weeklySessions = sessions.filter(s => s.createdAt && new Date(s.createdAt) >= weekAgo);
    weeklyChatSessions = weeklySessions.length;
    weeklyInquiries = weeklySessions.filter(s => s.hasInquiry === 1).length;
    const prevSessions = sessions.filter(s => s.createdAt && new Date(s.createdAt) >= twoWeeksAgo && new Date(s.createdAt) < weekAgo);
    prevWeekChatSessions = prevSessions.length;
    prevWeekInquiries = prevSessions.filter(s => s.hasInquiry === 1).length;
  }

  // 3) 이번 주 + 전주 SEO 진단 수
  let weeklyDiagnoses = 0;
  let prevWeekDiagnoses = 0;
  let totalDiagnoses = 0;
  if (db) {
    const [totalRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.diagnosisHistory);
    totalDiagnoses = totalRow?.count ?? 0;
    const [weekRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.diagnosisHistory)
      .where(gte(schema.diagnosisHistory.diagnosedAt, weekAgo));
    weeklyDiagnoses = weekRow?.count ?? 0;
    const [prevRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.diagnosisHistory)
      .where(sql`${schema.diagnosisHistory.diagnosedAt} >= ${twoWeeksAgo} AND ${schema.diagnosisHistory.diagnosedAt} < ${weekAgo}`);
    prevWeekDiagnoses = prevRow?.count ?? 0;
  }

  // 4) 이번 주 + 전주 신규 리드 수
  let weeklyLeads = 0;
  let prevWeekLeads = 0;
  let totalLeads = 0;
  if (db) {
    const allLeads = await db.select().from(schema.seoLeads);
    totalLeads = allLeads.length;
    weeklyLeads = allLeads.filter(l => l.createdAt && new Date(l.createdAt) >= weekAgo).length;
    prevWeekLeads = allLeads.filter(l => l.createdAt && new Date(l.createdAt) >= twoWeeksAgo && new Date(l.createdAt) < weekAgo).length;
  }

  // 5) 이번 주 + 전주 AI 블로그 체험 수
  let weeklyTrials = 0;
  let prevWeekTrials = 0;
  if (db) {
    const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.aiBlogTrials)
      .where(gte(schema.aiBlogTrials.createdAt, weekAgo));
    weeklyTrials = row?.count ?? 0;
    const [prevRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.aiBlogTrials)
      .where(sql`${schema.aiBlogTrials.createdAt} >= ${twoWeeksAgo} AND ${schema.aiBlogTrials.createdAt} < ${weekAgo}`);
    prevWeekTrials = prevRow?.count ?? 0;
  }

  // 6) 계약 병원 수
  let contractedCount = 0;
  if (db) {
    const profiles = await db.select().from(schema.hospitalProfiles);
    contractedCount = profiles.filter(p => p.isActive === 1).length;
  }

  return {
    period: {
      from: weekAgo.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    },
    blog: { weekly: weeklyBlogCount, prevWeek: prevWeekBlogCount, total: totalBlogCount },
    chat: { weeklySessions: weeklyChatSessions, weeklyInquiries, prevWeekSessions: prevWeekChatSessions, prevWeekInquiries, totalSessions: totalChatSessions },
    diagnosis: { weekly: weeklyDiagnoses, prevWeek: prevWeekDiagnoses, total: totalDiagnoses },
    leads: { weekly: weeklyLeads, prevWeek: prevWeekLeads, total: totalLeads },
    trials: { weekly: weeklyTrials, prevWeek: prevWeekTrials },
    hospitals: { contracted: contractedCount },
  };
}


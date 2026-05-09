import { eq, desc, sql, and, lt, gte, lte, ne, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inquiries, InsertInquiry, blogCategories, blogPosts, InsertBlogCategory, InsertBlogPost, snsContents, InsertSnsContent, seoKeywords, InsertSeoKeyword, chatSessions, chatMessages, InsertChatSession, InsertChatMessage, aiMonitorKeywords, aiMonitorResults, InsertAiMonitorKeyword, InsertAiMonitorResult, seoLeads, InsertSeoLead, diagnosisHistory, InsertDiagnosisHistory, newsletterSubscribers, InsertNewsletterSubscriber, benchmarkData, InsertBenchmarkData, monthlyAwards, InsertMonthlyAward, hospitalProfiles, InsertHospitalProfile, aiExposureScores, InsertAiExposureScore, aiMonitorCompetitors, InsertAiMonitorCompetitor, aiImprovementReports, InsertAiImprovementReport, userEvents, InsertUserEvent, seasonalCalendar, InsertSeasonalCalendar, siteVisits, InsertSiteVisit, consultationInquiries, InsertConsultationInquiry, monthlyReports, InsertMonthlyReport, adminNotifications, InsertAdminNotification, hospitalInfoItems, InsertHospitalInfoItem, aiBlogTrials, InsertAiBlogTrial, aiContentLogs, InsertAiContentLog, cardnewsTemplates, InsertCardnewsTemplate, benchmarkingReports, InsertBenchmarkingReport, emailContacts, InsertEmailContact, emailSendLogs, InsertEmailSendLog, treatmentPages, InsertTreatmentPage, automationRules, InsertAutomationRule, automationLogs, marketingContent, InsertMarketingContent, kakaoBookingSettings, InsertKakaoBookingSetting, bookingSlots, InsertBookingSlot, contentStyleGuides, ContentStyleGuide, contentIdeas, ContentIdea, contentHooks, ContentHook, contentScripts, ContentScript, contentCalendar, ContentCalendarItem, videoPrompts, VideoPrompt, adBrandProfiles, AdBrandProfile, adCreatives, AdCreative, interviewVideos, InterviewVideo, abExperiments, abVariants, abEvents, diagnosisAutomationConfig, InsertAbExperiment, InsertAbVariant, InsertAbEvent, DiagnosisAutomationConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * DB 커넥션 풀 설정 (drizzle-orm/mysql2 내장 풀 사용)
 * drizzle()에 URL 문자열을 전달하면 내부적으로 mysql2 pool을 생성합니다.
 * connection config는 URL 파라미터로 전달합니다.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // drizzle-orm이 내부적으로 mysql2 pool을 생성 (커넥션 풀 설정은 URL 파라미터로 제어)
      _db = drizzle(process.env.DATABASE_URL + "&connectionLimit=10&connectTimeout=10000&waitForConnections=true");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/** Graceful shutdown — 서버 종료 시 커넥션 풀 정리 */
export async function closeDb(): Promise<void> {
  if (_db) {
    try {
      // drizzle의 $client는 내부 mysql2 pool
      const client = (_db as any).$client;
      if (client && typeof client.end === 'function') {
        await client.end();
      }
    } catch (e) {
      console.warn("[Database] Error closing pool:", e);
    }
    _db = null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Inquiry helpers ──

export async function createInquiry(data: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(inquiries).values(data);
}

export async function getAllInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

export async function updateInquiryStatus(id: number, status: "new" | "contacted" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
}

export async function deleteInquiry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(inquiries).where(eq(inquiries.id, id));
}

export async function getInquiryStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, contacted: 0, completed: 0, todayNew: 0, weekNew: 0 };

  const all = await db.select().from(inquiries);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  return {
    total: all.length,
    new: all.filter(i => i.status === "new").length,
    contacted: all.filter(i => i.status === "contacted").length,
    completed: all.filter(i => i.status === "completed").length,
    todayNew: all.filter(i => i.status === "new" && i.createdAt >= todayStart).length,
    weekNew: all.filter(i => i.createdAt >= weekStart).length,
  };
}

// ── Blog & Content 도메인 → server/db/content.ts로 추출됨 ──
export {
  getAllBlogCategories, getBlogCategoryBySlug, createBlogCategory, updateBlogCategory, deleteBlogCategory,
  getAllBlogPosts, getBlogPostsByCategory, getBlogPostBySlug, incrementBlogPostView,
  createBlogPost, updateBlogPost, deleteBlogPost, getAllBlogPostsAdmin, getBlogPostCount,
  getBlogPostCountByCategory, getAllCategoriesWithPostCount,
  createSnsContent, getAllSnsContents, deleteSnsContent,
  getBlogStats, getTopBlogPosts, getCategoryStats,
  getScheduledPosts, publishScheduledPosts,
  getOrCreateChatSession,
  createSeoKeyword, getAllSeoKeywords, updateSeoKeyword, deleteSeoKeyword,
} from "./db/content";

export async function saveChatMessage(sessionId: number, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatMessages).values({ sessionId, role, content });
  await db.update(chatSessions).set({
    messageCount: sql`${chatSessions.messageCount} + 1`,
    lastMessageAt: new Date(),
  }).where(eq(chatSessions.id, sessionId));
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
    await db.update(chatSessions).set(updateSet).where(eq(chatSessions.id, sessionId));
  }
}

export async function findChatSessionByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatSessions).where(eq(chatSessions.visitorPhone, phone)).orderBy(desc(chatSessions.lastMessageAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllChatSessions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).orderBy(desc(chatSessions.lastMessageAt));
}

export async function getChatSessionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getChatMessagesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
}

export async function deleteChatSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));
  await db.delete(chatSessions).where(eq(chatSessions.id, id));
}

export async function getChatStats() {
  const db = await getDb();
  if (!db) return { totalSessions: 0, totalMessages: 0, withInquiry: 0, todaySessions: 0 };

  const sessions = await db.select().from(chatSessions);
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

export async function createAiMonitorKeyword(data: InsertAiMonitorKeyword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiMonitorKeywords).values(data);
}

export async function getAiMonitorKeywords(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(aiMonitorKeywords).where(eq(aiMonitorKeywords.isActive, 1)).orderBy(desc(aiMonitorKeywords.createdAt));
  }
  return db.select().from(aiMonitorKeywords).orderBy(desc(aiMonitorKeywords.createdAt));
}

export async function toggleAiMonitorKeyword(id: number, isActive: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiMonitorKeywords).set({ isActive }).where(eq(aiMonitorKeywords.id, id));
}

export async function deleteAiMonitorKeyword(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiMonitorResults).where(eq(aiMonitorResults.keywordId, id));
  await db.delete(aiMonitorKeywords).where(eq(aiMonitorKeywords.id, id));
}

export async function createAiMonitorResult(data: InsertAiMonitorResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiMonitorResults).values(data);
}

export async function getAiMonitorResults(keywordId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (keywordId) {
    return db.select().from(aiMonitorResults)
      .where(eq(aiMonitorResults.keywordId, keywordId))
      .orderBy(desc(aiMonitorResults.checkedAt))
      .limit(limit);
  }
  return db.select().from(aiMonitorResults)
    .orderBy(desc(aiMonitorResults.checkedAt))
    .limit(limit);
}

export async function getAiMonitorStats() {
  const db = await getDb();
  if (!db) return { totalKeywords: 0, totalChecks: 0, mentionRate: 0, lastChecked: null as string | null };
  
  const keywords = await db.select().from(aiMonitorKeywords).where(eq(aiMonitorKeywords.isActive, 1));
  const results = await db.select().from(aiMonitorResults).orderBy(desc(aiMonitorResults.checkedAt)).limit(200);
  
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


// ── SEO 리드 (잠재 고객) ──
/**
 * 리드 우선순위 자동 계산
 * 점수가 낮을수록 = 서비스 필요성 높음 = 우선순위 높음
 * priority 0~100 (100이 최우선)
 */
function calculateLeadPriority(totalScore: number | null | undefined, aiScore: number | null | undefined): number {
  const ts = totalScore ?? 50;
  const ai = aiScore ?? 50;
  // 종합 점수가 낮을수록 높은 우선순위 (40%), AI 점수가 낮을수록 높은 우선순위 (60%)
  const totalPart = Math.max(0, Math.min(100, 100 - ts)) * 0.4;
  const aiPart = Math.max(0, Math.min(100, 100 - ai)) * 0.6;
  return Math.round(totalPart + aiPart);
}

export async function createSeoLead(data: InsertSeoLead) {
  const db = await getDb();
  if (!db) return;
  const priority = calculateLeadPriority(data.totalScore, data.aiScore);
  await db.insert(seoLeads).values({ ...data, priority });
}

export async function getAllSeoLeads(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  // 우선순위 높은 순 → 최신순 정렬
  return db.select().from(seoLeads).orderBy(desc(seoLeads.priority), desc(seoLeads.createdAt)).limit(limit);
}

export async function getSeoLeadStats() {
  const db = await getDb();
  if (!db) return { total: 0, thisMonth: 0, sources: { seo_checker: 0, seo_compare: 0 }, byStatus: { new: 0, consulting: 0, contracted: 0, lost: 0 } };
  const all = await db.select().from(seoLeads);
  const now = new Date();
  const thisMonth = all.filter(l => {
    const d = new Date(l.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const sources = { seo_checker: 0, seo_compare: 0 };
  all.forEach(l => { if (l.source === "seo_checker" || l.source === "seo_compare") sources[l.source]++; });
  const byStatus = { new: 0, consulting: 0, contracted: 0, lost: 0 };
  all.forEach(l => { if (l.status in byStatus) byStatus[l.status as keyof typeof byStatus]++; });
  return { total: all.length, thisMonth: thisMonth.length, sources, byStatus };
}

// ─── 리드 상태 업데이트 ───
export async function updateSeoLeadStatus(id: number, status: "new" | "consulting" | "contracted" | "lost", note?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { status };
  if (note !== undefined) updateData.note = note;
  await db.update(seoLeads).set(updateData).where(eq(seoLeads.id, id));
}

// ─── 후속 이메일 대상 조회 (3일 후속) ───
export async function getLeadsForFollowup3d() {
  const db = await getDb();
  if (!db) return [];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  return db.select().from(seoLeads).where(
    and(
      eq(seoLeads.followup3dSent, 0),
      lte(seoLeads.createdAt, threeDaysAgo),
      gte(seoLeads.createdAt, fourDaysAgo),
      ne(seoLeads.status, "contracted"),
      ne(seoLeads.status, "lost")
    )
  );
}

// ─── 후속 이메일 대상 조회 (7일 후속) ───
export async function getLeadsForFollowup7d() {
  const db = await getDb();
  if (!db) return [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  return db.select().from(seoLeads).where(
    and(
      eq(seoLeads.followup7dSent, 0),
      eq(seoLeads.followup3dSent, 1),
      lte(seoLeads.createdAt, sevenDaysAgo),
      gte(seoLeads.createdAt, eightDaysAgo),
      ne(seoLeads.status, "contracted"),
      ne(seoLeads.status, "lost")
    )
  );
}

// ─── 후속 이메일 발송 플래그 업데이트 ───
export async function markFollowupSent(id: number, type: "3d" | "7d") {
  const db = await getDb();
  if (!db) return;
  if (type === "3d") {
    await db.update(seoLeads).set({ followup3dSent: 1 }).where(eq(seoLeads.id, id));
  } else {
    await db.update(seoLeads).set({ followup7dSent: 1 }).where(eq(seoLeads.id, id));
  }
}

// ─── AI 모니터링 트렌드 데이터 (주간 집계) ───
export async function getAiMonitorTrend(weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  const results = await db.select().from(aiMonitorResults)
    .where(gte(aiMonitorResults.checkedAt, since))
    .orderBy(aiMonitorResults.checkedAt);
  
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

// ─── 키워드별 AI 모니터링 트렌드 ───
export async function getAiMonitorKeywordTrend(keywordId: number, weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  return db.select().from(aiMonitorResults)
    .where(and(
      eq(aiMonitorResults.keywordId, keywordId),
      gte(aiMonitorResults.checkedAt, since)
    ))
    .orderBy(aiMonitorResults.checkedAt);
}

// ═══════════════════════════════════════════════════
// 진단 이력 (Diagnosis History)
// ═══════════════════════════════════════════════════

export async function saveDiagnosisHistory(data: InsertDiagnosisHistory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(diagnosisHistory).values(data);
}

export async function getDiagnosisHistoryByUrl(url: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diagnosisHistory)
    .where(eq(diagnosisHistory.url, url))
    .orderBy(desc(diagnosisHistory.diagnosedAt))
    .limit(limit);
}

export async function getRecentDiagnoses(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diagnosisHistory)
    .orderBy(desc(diagnosisHistory.diagnosedAt))
    .limit(limit);
}

export async function getDiagnosisStats() {
  const db = await getDb();
  if (!db) return { total: 0, uniqueUrls: 0, avgScore: 0, avgAiScore: 0 };
  const rows = await db.select({
    total: sql<number>`COUNT(*)`,
    uniqueUrls: sql<number>`COUNT(DISTINCT url)`,
    avgScore: sql<number>`COALESCE(ROUND(AVG(total_score)), 0)`,
    avgAiScore: sql<number>`COALESCE(ROUND(AVG(ai_score)), 0)`,
  }).from(diagnosisHistory);
  return rows[0] ?? { total: 0, uniqueUrls: 0, avgScore: 0, avgAiScore: 0 };
}

export async function getDailyDiagnosisCounts(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db.select({
    date: sql<string>`DATE(diagnosed_at)`.as("date"),
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(diagnosisHistory)
    .where(gte(diagnosisHistory.diagnosedAt, since))
    .groupBy(sql`DATE(diagnosed_at)`)
    .orderBy(sql`DATE(diagnosed_at)`);
}

export async function getScoreDistribution() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    bucket: sql<string>`CASE 
      WHEN total_score >= 90 THEN '90-100'
      WHEN total_score >= 80 THEN '80-89'
      WHEN total_score >= 70 THEN '70-79'
      WHEN total_score >= 60 THEN '60-69'
      WHEN total_score >= 50 THEN '50-59'
      WHEN total_score >= 40 THEN '40-49'
      WHEN total_score >= 30 THEN '30-39'
      ELSE '0-29'
    END`.as("bucket"),
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(diagnosisHistory)
    .groupBy(sql`bucket`)
    .orderBy(sql`MIN(total_score)`);
}

export async function getTopDiagnosedUrls(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    url: diagnosisHistory.url,
    count: sql<number>`COUNT(*)`.as("count"),
    latestScore: sql<number>`MAX(total_score)`.as("latest_score"),
    latestAiScore: sql<number>`MAX(ai_score)`.as("latest_ai_score"),
  }).from(diagnosisHistory)
    .groupBy(diagnosisHistory.url)
    .orderBy(desc(sql`count`))
    .limit(limit);
}

export async function getSpecialtyStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    specialty: diagnosisHistory.specialty,
    count: sql<number>`COUNT(*)`.as("count"),
    avgScore: sql<number>`ROUND(AVG(total_score))`.as("avg_score"),
    avgAiScore: sql<number>`ROUND(AVG(ai_score))`.as("avg_ai_score"),
  }).from(diagnosisHistory)
    .where(sql`specialty IS NOT NULL AND specialty != ''`)
    .groupBy(diagnosisHistory.specialty)
    .orderBy(desc(sql`count`));
}

export async function getRegionStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    region: diagnosisHistory.region,
    count: sql<number>`COUNT(*)`.as("count"),
    avgScore: sql<number>`ROUND(AVG(total_score))`.as("avg_score"),
    avgAiScore: sql<number>`ROUND(AVG(ai_score))`.as("avg_ai_score"),
  }).from(diagnosisHistory)
    .where(sql`region IS NOT NULL AND region != ''`)
    .groupBy(diagnosisHistory.region)
    .orderBy(desc(sql`count`));
}

/**
 * URL별 월간 점수 추이 — 같은 URL의 시간별 점수 변화 (영업용)
 * 각 월의 마지막 진단 결과를 대표값으로 사용
 */
export async function getMonthlyTrendByUrl(url: string, months = 12) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
  return db.select({
    month: sql<string>`DATE_FORMAT(diagnosed_at, '%Y-%m')`.as("month"),
    avgScore: sql<number>`ROUND(AVG(total_score))`.as("avg_score"),
    avgAiScore: sql<number>`ROUND(AVG(ai_score))`.as("avg_ai_score"),
    maxScore: sql<number>`MAX(total_score)`.as("max_score"),
    minScore: sql<number>`MIN(total_score)`.as("min_score"),
    count: sql<number>`COUNT(*)`.as("count"),
    latestGrade: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(grade ORDER BY diagnosed_at DESC), ',', 1)`.as("latest_grade"),
    latestCategoryScores: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(category_scores ORDER BY diagnosed_at DESC SEPARATOR '|||'), '|||', 1)`.as("latest_category_scores"),
  }).from(diagnosisHistory)
    .where(and(eq(diagnosisHistory.url, url), gte(diagnosisHistory.diagnosedAt, since)))
    .groupBy(sql`DATE_FORMAT(diagnosed_at, '%Y-%m')`)
    .orderBy(sql`month`);
}

/**
 * URL별 카테고리 점수 추이 — 각 카테고리의 월별 변화
 */
export async function getCategoryTrendByUrl(url: string, months = 12) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    diagnosedAt: diagnosisHistory.diagnosedAt,
    categoryScores: diagnosisHistory.categoryScores,
    totalScore: diagnosisHistory.totalScore,
    aiScore: diagnosisHistory.aiScore,
    grade: diagnosisHistory.grade,
  }).from(diagnosisHistory)
    .where(and(eq(diagnosisHistory.url, url), gte(diagnosisHistory.diagnosedAt, since)))
    .orderBy(diagnosisHistory.diagnosedAt);
  return rows;
}

/**
 * 공개 히스토리 조회 — URL만으로 히스토리 조회 (로그인 불필요, 영업용)
 */
export async function getPublicHistoryByUrl(url: string, limit = 24) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: diagnosisHistory.id,
    url: diagnosisHistory.url,
    totalScore: diagnosisHistory.totalScore,
    aiScore: diagnosisHistory.aiScore,
    grade: diagnosisHistory.grade,
    specialty: diagnosisHistory.specialty,
    categoryScores: diagnosisHistory.categoryScores,
    diagnosedAt: diagnosisHistory.diagnosedAt,
  }).from(diagnosisHistory)
    .where(eq(diagnosisHistory.url, url))
    .orderBy(desc(diagnosisHistory.diagnosedAt))
    .limit(limit);
}

/**
 * 두 시점 간 점수 비교 — 첫 진단 vs 최근 진단
 */
export async function getScoreComparisonByUrl(url: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(diagnosisHistory)
    .where(eq(diagnosisHistory.url, url))
    .orderBy(diagnosisHistory.diagnosedAt);
  if (rows.length < 2) return null;
  const first = rows[0];
  const latest = rows[rows.length - 1];
  return {
    first: { score: first.totalScore, aiScore: first.aiScore, grade: first.grade, date: first.diagnosedAt, categoryScores: first.categoryScores },
    latest: { score: latest.totalScore, aiScore: latest.aiScore, grade: latest.grade, date: latest.diagnosedAt, categoryScores: latest.categoryScores },
    change: latest.totalScore - first.totalScore,
    aiChange: (latest.aiScore ?? 0) - (first.aiScore ?? 0),
    totalDiagnoses: rows.length,
    periodDays: Math.round((new Date(latest.diagnosedAt).getTime() - new Date(first.diagnosedAt).getTime()) / (1000 * 60 * 60 * 24)),
  };
}

// ═══════════════════════════════════════════════════
// 뉴스레터 구독 (Newsletter)
// ═══════════════════════════════════════════════════

export async function subscribeNewsletter(data: InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) return null;
  // upsert: 이미 있으면 활성화
  const existing = await db.select().from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, data.email)).limit(1);
  if (existing.length > 0) {
    await db.update(newsletterSubscribers)
      .set({ isActive: 1, name: data.name, hospitalName: data.hospitalName, specialty: data.specialty })
      .where(eq(newsletterSubscribers.email, data.email));
    return existing[0];
  }
  await db.insert(newsletterSubscribers).values(data);
  return data;
}

export async function unsubscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(newsletterSubscribers)
    .set({ isActive: 0 })
    .where(eq(newsletterSubscribers.email, email));
}

export async function getActiveSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.isActive, 1))
    .orderBy(desc(newsletterSubscribers.createdAt));
}

export async function getSubscriberCount() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.isActive, 1));
  return rows[0]?.count ?? 0;
}

// ═══════════════════════════════════════════════════
// 벤치마크 데이터 (Benchmark)
// ═══════════════════════════════════════════════════

export async function saveBenchmarkData(data: InsertBenchmarkData) {
  const db = await getDb();
  if (!db) return;
  await db.insert(benchmarkData).values(data);
}

export async function getBenchmarkBySpecialty(specialty: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(benchmarkData)
    .where(eq(benchmarkData.specialty, specialty))
    .orderBy(desc(benchmarkData.period))
    .limit(12);
}

export async function getBenchmarkByRegion(region: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(benchmarkData)
    .where(eq(benchmarkData.region, region))
    .orderBy(desc(benchmarkData.period))
    .limit(12);
}

export async function getLatestBenchmarks() {
  const db = await getDb();
  if (!db) return [];
  // 가장 최근 period의 데이터
  const latestPeriod = await db.select({ period: benchmarkData.period })
    .from(benchmarkData)
    .orderBy(desc(benchmarkData.period))
    .limit(1);
  if (latestPeriod.length === 0) return [];
  return db.select().from(benchmarkData)
    .where(eq(benchmarkData.period, latestPeriod[0].period))
    .orderBy(desc(benchmarkData.sampleCount));
}

// ═══════════════════════════════════════════════════
// 월간 어워드 (Monthly Awards)
// ═══════════════════════════════════════════════════

export async function saveMonthlyAward(data: InsertMonthlyAward) {
  const db = await getDb();
  if (!db) return;
  await db.insert(monthlyAwards).values(data);
}

export async function getMonthlyAwards(period?: string) {
  const db = await getDb();
  if (!db) return [];
  if (period) {
    return db.select().from(monthlyAwards)
      .where(eq(monthlyAwards.period, period))
      .orderBy(monthlyAwards.rank);
  }
  // 최신 period
  const latestPeriod = await db.select({ period: monthlyAwards.period })
    .from(monthlyAwards)
    .orderBy(desc(monthlyAwards.period))
    .limit(1);
  if (latestPeriod.length === 0) return [];
  return db.select().from(monthlyAwards)
    .where(eq(monthlyAwards.period, latestPeriod[0].period))
    .orderBy(monthlyAwards.rank);
}

// ═══════════════════════════════════════════════════
// 리드 전환 퍼널 (Lead Funnel)
// ═══════════════════════════════════════════════════

export async function getLeadFunnelStats() {
  const db = await getDb();
  if (!db) return { diagnosed: 0, emailCollected: 0, consulting: 0, contracted: 0 };
  
  const diagnosedRows = await db.select({ count: sql<number>`COUNT(DISTINCT url)` }).from(diagnosisHistory);
  const diagnosed = diagnosedRows[0]?.count ?? 0;
  
  const leadRows = await db.select({
    total: sql<number>`COUNT(*)`,
    consulting: sql<number>`SUM(CASE WHEN status = 'consulting' THEN 1 ELSE 0 END)`,
    contracted: sql<number>`SUM(CASE WHEN status = 'contracted' THEN 1 ELSE 0 END)`,
  }).from(seoLeads);
  
  return {
    diagnosed,
    emailCollected: leadRows[0]?.total ?? 0,
    consulting: leadRows[0]?.consulting ?? 0,
    contracted: leadRows[0]?.contracted ?? 0,
  };
}


// ═══════════════════════════════════════════════════
// 병원 프로필 (Hospital Profiles) — SaaS 대시보드
// ═══════════════════════════════════════════════════

export async function createHospitalProfile(data: InsertHospitalProfile) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(hospitalProfiles).values(data);
  return result;
}

export async function getHospitalProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(hospitalProfiles)
    .where(and(eq(hospitalProfiles.userId, userId), eq(hospitalProfiles.isActive, 1)))
    .limit(1);
  return rows[0] || null;
}

export async function getHospitalProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(hospitalProfiles)
    .where(eq(hospitalProfiles.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function updateHospitalProfile(id: number, data: Partial<InsertHospitalProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(hospitalProfiles).set(data).where(eq(hospitalProfiles.id, id));
}

export async function getAllHospitalProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hospitalProfiles)
    .where(eq(hospitalProfiles.isActive, 1))
    .orderBy(desc(hospitalProfiles.createdAt));
}

export async function getHospitalDashboardData(hospitalUrl: string) {
  const db = await getDb();
  if (!db) return { history: [], benchmarks: [], ranking: [] };
  
  // 진단 이력 (최근 20개)
  const history = await db.select().from(diagnosisHistory)
    .where(eq(diagnosisHistory.url, hospitalUrl))
    .orderBy(desc(diagnosisHistory.diagnosedAt))
    .limit(20);
  
  // 해당 진료과 벤치마크
  const specialty = history[0]?.specialty;
  let benchmarks: any[] = [];
  if (specialty) {
    benchmarks = await db.select().from(benchmarkData)
      .where(eq(benchmarkData.specialty, specialty))
      .orderBy(desc(benchmarkData.period))
      .limit(12);
  }
  
  // 전체 진단 이력에서 같은 진료과 순위 계산
  const latestScores = await db.select({
    url: diagnosisHistory.url,
    totalScore: diagnosisHistory.totalScore,
    aiScore: diagnosisHistory.aiScore,
    specialty: diagnosisHistory.specialty,
  }).from(diagnosisHistory)
    .where(specialty ? eq(diagnosisHistory.specialty, specialty) : sql`1=1`)
    .orderBy(desc(diagnosisHistory.diagnosedAt))
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

export async function addAiMonitorCompetitor(data: InsertAiMonitorCompetitor) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiMonitorCompetitors).values(data);
}

export async function getAiMonitorCompetitors(keywordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiMonitorCompetitors)
    .where(eq(aiMonitorCompetitors.keywordId, keywordId))
    .orderBy(desc(aiMonitorCompetitors.createdAt));
}

export async function deleteAiMonitorCompetitor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiMonitorCompetitors).where(eq(aiMonitorCompetitors.id, id));
}

export async function getAllCompetitorsForKeywords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiMonitorCompetitors).orderBy(aiMonitorCompetitors.keywordId);
}

// ═══════════════════════════════════════════════════
// AI 인용 종합 점수 (Exposure Scores)
// ═══════════════════════════════════════════════════

export async function saveAiExposureScore(data: InsertAiExposureScore) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiExposureScores).values(data);
}

export async function getAiExposureScores(keywordId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiExposureScores)
    .where(eq(aiExposureScores.keywordId, keywordId))
    .orderBy(desc(aiExposureScores.periodEnd))
    .limit(limit);
}

export async function getLatestAiExposureScores() {
  const db = await getDb();
  if (!db) return [];
  // 각 키워드별 최신 점수
  const all = await db.select().from(aiExposureScores)
    .orderBy(desc(aiExposureScores.periodEnd))
    .limit(200);
  
  const keywordMap = new Map<number, typeof all[0]>();
  for (const row of all) {
    if (!keywordMap.has(row.keywordId)) {
      keywordMap.set(row.keywordId, row);
    }
  }
  return Array.from(keywordMap.values());
}

// ═══════════════════════════════════════════════════
// AI 모니터링 고도화 — 경쟁사 포함 통계
// ═══════════════════════════════════════════════════

export async function getAiMonitorStatsEnhanced() {
  const db = await getDb();
  if (!db) return {
    totalKeywords: 0, totalChecks: 0, mentionRate: 0, lastChecked: null as string | null,
    totalCompetitors: 0, avgScore: 0, platformBreakdown: {} as Record<string, { total: number; mentioned: number; rate: number }>,
  };
  
  const keywords = await db.select().from(aiMonitorKeywords).where(eq(aiMonitorKeywords.isActive, 1));
  const results = await db.select().from(aiMonitorResults).orderBy(desc(aiMonitorResults.checkedAt)).limit(500);
  const competitors = await db.select().from(aiMonitorCompetitors);
  const scores = await db.select().from(aiExposureScores).orderBy(desc(aiExposureScores.periodEnd)).limit(100);
  
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


// ═══════════════════════════════════════════════════
// AI 개선 리포트 CRUD
// ═══════════════════════════════════════════════════

export async function createAiImprovementReport(data: InsertAiImprovementReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiImprovementReports).values(data).$returningId();
  return result;
}

export async function getAiImprovementReports(keywordId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (keywordId) {
    return db.select().from(aiImprovementReports)
      .where(eq(aiImprovementReports.keywordId, keywordId))
      .orderBy(desc(aiImprovementReports.createdAt));
  }
  return db.select().from(aiImprovementReports)
    .orderBy(desc(aiImprovementReports.createdAt));
}

export async function getAiImprovementReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(aiImprovementReports)
    .where(eq(aiImprovementReports.id, id));
  return rows[0] || null;
}

export async function deleteAiImprovementReport(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiImprovementReports).where(eq(aiImprovementReports.id, id));
}

// 키워드별 최신 모니터링 결과 + 노출 점수 조회 (리포트 생성용)
export async function getKeywordMonitoringDataForReport(keywordId: number) {
  const db = await getDb();
  if (!db) return null;

  // 키워드 정보
  const kwRows = await db.select().from(aiMonitorKeywords)
    .where(eq(aiMonitorKeywords.id, keywordId));
  if (kwRows.length === 0) return null;
  const keyword = kwRows[0];

  // 최신 결과 (각 플랫폼별 최신 1건)
  const results = await db.select().from(aiMonitorResults)
    .where(eq(aiMonitorResults.keywordId, keywordId))
    .orderBy(desc(aiMonitorResults.checkedAt));

  // 플랫폼별 최신 결과만 추출
  const latestByPlatform = new Map<string, typeof results[0]>();
  for (const r of results) {
    if (!latestByPlatform.has(r.platform)) {
      latestByPlatform.set(r.platform, r);
    }
  }

  // 최신 노출 점수
  const scoreRows = await db.select().from(aiExposureScores)
    .where(eq(aiExposureScores.keywordId, keywordId))
    .orderBy(desc(aiExposureScores.createdAt))
    .limit(1);

  // 경쟁사 목록
  const competitors = await db.select().from(aiMonitorCompetitors)
    .where(eq(aiMonitorCompetitors.keywordId, keywordId));

  return {
    keyword,
    results: Array.from(latestByPlatform.values()),
    exposureScore: scoreRows[0] || null,
    competitors,
  };
}


// ═══════════════════════════════════════════════════
// 3번: 챗봇 대화 인사이트 업데이트
// ═══════════════════════════════════════════════════

export async function updateChatSessionInsight(sessionId: number, insight: {
  specialty?: string;
  intentType?: string;
  conversionLikelihood?: string;
  summary?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions)
    .set({
      insightSpecialty: insight.specialty || null,
      insightIntentType: insight.intentType || null,
      insightConversionLikelihood: insight.conversionLikelihood || null,
      insightSummary: insight.summary || null,
      insightExtractedAt: new Date(),
    })
    .where(eq(chatSessions.id, sessionId));
}

export async function getSessionsWithoutInsight(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions)
    .where(sql`${chatSessions.insightExtractedAt} IS NULL AND ${chatSessions.messageCount} >= 3`)
    .orderBy(desc(chatSessions.createdAt))
    .limit(limit);
}

export async function getChatInsightStats() {
  const db = await getDb();
  if (!db) return { totalSessions: 0, analyzedSessions: 0, specialtyStats: [], intentStats: [], conversionStats: [] };
  const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(chatSessions);
  const [withInsight] = await db.select({ count: sql<number>`COUNT(*)` }).from(chatSessions)
    .where(sql`${chatSessions.insightExtractedAt} IS NOT NULL`);
  
  // 진료과별 관심도
  const specialtyStats = await db.select({
    specialty: chatSessions.insightSpecialty,
    count: sql<number>`COUNT(*)`,
  }).from(chatSessions)
    .where(sql`${chatSessions.insightSpecialty} IS NOT NULL`)
    .groupBy(chatSessions.insightSpecialty)
    .orderBy(sql`COUNT(*) DESC`);

  // 문의 유형별 통계
  const intentStats = await db.select({
    intentType: chatSessions.insightIntentType,
    count: sql<number>`COUNT(*)`,
  }).from(chatSessions)
    .where(sql`${chatSessions.insightIntentType} IS NOT NULL`)
    .groupBy(chatSessions.insightIntentType)
    .orderBy(sql`COUNT(*) DESC`);

  // 전환 가능성별 통계
  const conversionStats = await db.select({
    likelihood: chatSessions.insightConversionLikelihood,
    count: sql<number>`COUNT(*)`,
  }).from(chatSessions)
    .where(sql`${chatSessions.insightConversionLikelihood} IS NOT NULL`)
    .groupBy(chatSessions.insightConversionLikelihood)
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

export async function logUserEvent(data: InsertUserEvent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userEvents).values(data);
}

export async function getUserEventStats(days = 30) {
  const db = await getDb();
  if (!db) return { byType: [], daily: [], uniqueVisitors: 0, totalEvents: 0 };
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // 이벤트 타입별 통계
  const byType = await db.select({
    eventType: userEvents.eventType,
    count: sql<number>`COUNT(*)`,
  }).from(userEvents)
    .where(gte(userEvents.createdAt, since))
    .groupBy(userEvents.eventType)
    .orderBy(sql`COUNT(*) DESC`);

  // 일별 이벤트 수
  const daily = await db.select({
    date: sql<string>`DATE(${userEvents.createdAt})`,
    count: sql<number>`COUNT(*)`,
  }).from(userEvents)
    .where(gte(userEvents.createdAt, since))
    .groupBy(sql`DATE(${userEvents.createdAt})`)
    .orderBy(sql`DATE(${userEvents.createdAt})`);

  // 고유 방문자 수
  const [uniqueVisitors] = await db.select({
    count: sql<number>`COUNT(DISTINCT ${userEvents.visitorId})`,
  }).from(userEvents)
    .where(gte(userEvents.createdAt, since));

  return {
    byType,
    daily,
    uniqueVisitors: uniqueVisitors.count,
    totalEvents: byType.reduce((sum, t) => sum + t.count, 0),
  };
}

export async function getRecentUserEvents(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userEvents)
    .orderBy(desc(userEvents.createdAt))
    .limit(limit);
}

// ═══════════════════════════════════════════════════
// 5번: 월간 벤치마크 자동 집계 + 어워드
// ═══════════════════════════════════════════════════

export async function aggregateMonthlyBenchmark(period: string) {
  const db = await getDb();
  if (!db) return [];
  
  // 해당 월의 진단 이력에서 진료과별 평균 점수 집계
  const stats = await db.select({
    specialty: diagnosisHistory.specialty,
    avgTotal: sql<number>`ROUND(AVG(${diagnosisHistory.totalScore}))`,
    avgAi: sql<number>`ROUND(AVG(${diagnosisHistory.aiScore}))`,
    count: sql<number>`COUNT(*)`,
    topPercentile: sql<number>`ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY ${diagnosisHistory.totalScore}))`,
  }).from(diagnosisHistory)
    .where(sql`DATE_FORMAT(${diagnosisHistory.diagnosedAt}, '%Y-%m') = ${period} AND ${diagnosisHistory.specialty} IS NOT NULL`)
    .groupBy(diagnosisHistory.specialty);

  const results = [];
  for (const stat of stats) {
    if (!stat.specialty) continue;
    await db.insert(benchmarkData).values({
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
    url: diagnosisHistory.url,
    specialty: diagnosisHistory.specialty,
    totalScore: sql<number>`MAX(${diagnosisHistory.totalScore})`,
    aiScore: sql<number>`MAX(${diagnosisHistory.aiScore})`,
  }).from(diagnosisHistory)
    .where(sql`DATE_FORMAT(${diagnosisHistory.diagnosedAt}, '%Y-%m') = ${period} AND ${diagnosisHistory.specialty} IS NOT NULL`)
    .groupBy(diagnosisHistory.url, diagnosisHistory.specialty)
    .orderBy(sql`MAX(${diagnosisHistory.totalScore}) DESC`)
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
    await db.insert(monthlyAwards).values({
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

// getMonthlyAwards 이미 상단에 정의됨

// ═══════════════════════════════════════════════════
// 8번: 리드 스코어링 고도화 — 행동 기반 점수 산정
// ═══════════════════════════════════════════════════

/**
 * 리드의 행동 데이터를 기반으로 우선순위를 재계산
 * - 진단 횟수 (재방문 = 관심 높음)
 * - 뉴스레터 구독 여부
 * - 챗봇 대화 여부 (전환 가능성 high)
 * - 후속 이메일 오픈 여부
 */
export async function recalculateLeadScores() {
  const db = await getDb();
  if (!db) return { updated: 0 };

  const leads = await db.select().from(seoLeads);
  let updated = 0;

  for (const lead of leads) {
    let behaviorBonus = 0;

    // 1. 같은 URL의 재진단 횟수 (최대 +20)
    const [diagCount] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(diagnosisHistory)
      .where(eq(diagnosisHistory.url, lead.url));
    if (diagCount.count > 1) behaviorBonus += Math.min(20, (diagCount.count - 1) * 5);

    // 2. 뉴스레터 구독 여부 (+10)
    if (lead.email) {
      const [subscriber] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, lead.email));
      if (subscriber.count > 0) behaviorBonus += 10;
    }

    // 3. 챗봇 대화에서 전환 가능성 high (+15)
    if (lead.email) {
      const [highIntent] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(chatSessions)
        .where(and(
          eq(chatSessions.visitorEmail, lead.email),
          eq(chatSessions.insightConversionLikelihood, "high")
        ));
      if (highIntent.count > 0) behaviorBonus += 15;
    }

    // 4. 후속 이메일 발송 후 재방문 (+10)
    if (lead.followup3dSent || lead.followup7dSent) {
      const [revisit] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(diagnosisHistory)
        .where(and(
          eq(diagnosisHistory.url, lead.url),
          sql`${diagnosisHistory.diagnosedAt} > ${lead.createdAt}`
        ));
      if (revisit.count > 0) behaviorBonus += 10;
    }

    // 기본 점수 + 행동 보너스 (최대 100)
    const basePriority = calculateLeadPriorityPublic(lead.totalScore, lead.aiScore);
    const newPriority = Math.min(100, basePriority + behaviorBonus);

    if (newPriority !== lead.priority) {
      await db.update(seoLeads)
        .set({ priority: newPriority })
        .where(eq(seoLeads.id, lead.id));
      updated++;
    }
  }

  return { updated, total: leads.length };
}

// 외부에서도 사용 가능한 리드 우선순위 계산 함수
function calculateLeadPriorityPublic(totalScore: number | null | undefined, aiScore: number | null | undefined): number {
  const ts = totalScore ?? 50;
  const ai = aiScore ?? 50;
  const totalPart = Math.max(0, Math.min(100, 100 - ts)) * 0.4;
  const aiPart = Math.max(0, Math.min(100, 100 - ai)) * 0.6;
  return Math.round(totalPart + aiPart);
}


// ═══════════════════════════════════════════════════
// 33차: 시즌별 마케팅 캘린더
// ═══════════════════════════════════════════════════

/**
 * 특정 진료과의 특정 월 시즌 키워드 조회
 */
export async function getSeasonalKeywords(specialty?: string, month?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(seasonalCalendar);
  
  if (specialty && month) {
    return query.where(and(
      eq(seasonalCalendar.specialty, specialty),
      eq(seasonalCalendar.month, month)
    )).orderBy(seasonalCalendar.priority);
  } else if (specialty) {
    return query.where(eq(seasonalCalendar.specialty, specialty)).orderBy(seasonalCalendar.month, seasonalCalendar.priority);
  } else if (month) {
    return query.where(eq(seasonalCalendar.month, month)).orderBy(seasonalCalendar.specialty, seasonalCalendar.priority);
  }
  return query.orderBy(seasonalCalendar.specialty, seasonalCalendar.month);
}

/**
 * 현재 월 기준 추천 키워드 (이번 달 + 다음 달)
 */
export async function getCurrentSeasonalRecommendations(specialty?: string) {
  const db = await getDb();
  if (!db) return { thisMonth: [], nextMonth: [] };
  
  const now = new Date();
  const thisMonth = now.getMonth() + 1; // 1~12
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  
  let thisMonthData, nextMonthData;
  
  if (specialty) {
    thisMonthData = await db.select().from(seasonalCalendar)
      .where(and(eq(seasonalCalendar.specialty, specialty), eq(seasonalCalendar.month, thisMonth)))
      .orderBy(seasonalCalendar.priority);
    nextMonthData = await db.select().from(seasonalCalendar)
      .where(and(eq(seasonalCalendar.specialty, specialty), eq(seasonalCalendar.month, nextMonth)))
      .orderBy(seasonalCalendar.priority);
  } else {
    thisMonthData = await db.select().from(seasonalCalendar)
      .where(eq(seasonalCalendar.month, thisMonth))
      .orderBy(seasonalCalendar.specialty, seasonalCalendar.priority);
    nextMonthData = await db.select().from(seasonalCalendar)
      .where(eq(seasonalCalendar.month, nextMonth))
      .orderBy(seasonalCalendar.specialty, seasonalCalendar.priority);
  }
  
  return { thisMonth: thisMonthData, nextMonth: nextMonthData };
}

/**
 * 전체 진료과 목록 (시즌 캘린더에 등록된)
 */
export async function getSeasonalSpecialties() {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select({ specialty: seasonalCalendar.specialty }).from(seasonalCalendar);
  return Array.from(new Set(all.map(r => r.specialty)));
}

/**
 * 시즌 키워드 추가
 */
export async function addSeasonalKeyword(data: InsertSeasonalCalendar) {
  const db = await getDb();
  if (!db) return;
  await db.insert(seasonalCalendar).values(data);
}

/**
 * 시즌 키워드 삭제
 */
export async function deleteSeasonalKeyword(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(seasonalCalendar).where(eq(seasonalCalendar.id, id));
}

// ═══════════════════════════════════════════════════
// 33차: 경쟁사 비교 분석 — AI 모니터링 데이터 기반
// ═══════════════════════════════════════════════════

/**
 * 키워드별 경쟁사 언급 비교 분석
 * AI 모니터링 결과에서 우리 병원 vs 경쟁사 언급 비교
 */
export async function getCompetitorComparison(keywordId?: number) {
  const db = await getDb();
  if (!db) return { keywords: [], comparison: [] };
  
  const keywords = await db.select().from(aiMonitorKeywords).where(eq(aiMonitorKeywords.isActive, 1));
  
  // 최근 모니터링 결과 가져오기 (최근 4주)
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  let results;
  if (keywordId) {
    results = await db.select().from(aiMonitorResults)
      .where(and(
        eq(aiMonitorResults.keywordId, keywordId),
        gte(aiMonitorResults.checkedAt, fourWeeksAgo)
      ))
      .orderBy(desc(aiMonitorResults.checkedAt));
  } else {
    results = await db.select().from(aiMonitorResults)
      .where(gte(aiMonitorResults.checkedAt, fourWeeksAgo))
      .orderBy(desc(aiMonitorResults.checkedAt));
  }
  
  const competitors = await db.select().from(aiMonitorCompetitors);
  
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
        } catch {}
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

/**
 * 경쟁사 vs 우리 병원 시계열 비교 (주간)
 */
export async function getCompetitorTrend(keywordId: number, weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];
  
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  const results = await db.select().from(aiMonitorResults)
    .where(and(
      eq(aiMonitorResults.keywordId, keywordId),
      gte(aiMonitorResults.checkedAt, since)
    ))
    .orderBy(aiMonitorResults.checkedAt);
  
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
      } catch {}
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


// ─── Site Visits (추적 코드 데이터) ───────────────────────────────

export async function insertSiteVisit(visit: InsertSiteVisit) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(siteVisits).values(visit);
  return result;
}

export async function getSiteVisitsByHospital(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to)
    ))
    .orderBy(desc(siteVisits.visitedAt));
}

export async function getSiteVisitStats(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    channel: siteVisits.channel,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to)
    ))
    .groupBy(siteVisits.channel);
  return rows;
}

export async function getTopPages(hospitalId: number, from: Date, to: Date, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    pageUrl: siteVisits.pageUrl,
    pageTitle: siteVisits.pageTitle,
    views: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to)
    ))
    .groupBy(siteVisits.pageUrl, siteVisits.pageTitle)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
}

export async function getDailyVisitTrend(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT DATE(visited_at) as date, COUNT(*) as total,
      COUNT(DISTINCT visitor_id) as uniqueVisitors
    FROM site_visits
    WHERE hospital_id = ${hospitalId}
      AND visited_at >= ${from}
      AND visited_at <= ${to}
    GROUP BY DATE(visited_at)
    ORDER BY DATE(visited_at)
  `);
  return (rows[0] as unknown as any[]).map((r: any) => ({
    date: String(r.date),
    total: Number(r.total),
    uniqueVisitors: Number(r.uniqueVisitors),
  }));
}

// ─── Consultation Inquiries (상담 문의) ──────────────────────────

export async function insertConsultationInquiry(inquiry: InsertConsultationInquiry) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(consultationInquiries).values(inquiry);
  return result;
}

export async function getConsultationsByHospital(hospitalId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(consultationInquiries.hospitalId, hospitalId)];
  if (from) conditions.push(gte(consultationInquiries.createdAt, from));
  if (to) conditions.push(lte(consultationInquiries.createdAt, to));
  return db.select().from(consultationInquiries)
    .where(and(...conditions))
    .orderBy(desc(consultationInquiries.createdAt));
}

export async function updateConsultationStatus(id: number, status: "pending" | "contacted" | "completed" | "cancelled", note?: string) {
  const db = await getDb();
  if (!db) return null;
  const updates: Record<string, unknown> = { status };
  if (status === "contacted") updates.contactedAt = new Date();
  if (note !== undefined) updates.note = note;
  return db.update(consultationInquiries).set(updates).where(eq(consultationInquiries.id, id));
}

// ─── Monthly Reports ─────────────────────────────────────────────

export async function getMonthlyReportsByHospital(hospitalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(monthlyReports)
    .where(eq(monthlyReports.hospitalId, hospitalId))
    .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
}

export async function insertMonthlyReport(report: InsertMonthlyReport) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(monthlyReports).values(report);
  return result;
}

// ─── 7번: 유입 분석 강화 ─────────────────────────────────────────

/** 디바이스별 방문 통계 */
export async function getDeviceStats(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    deviceType: siteVisits.deviceType,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to)
    ))
    .groupBy(siteVisits.deviceType);
}

/** AI 채널 상세 분석 (AI 채널만 필터) */
export async function getAiChannelDetail(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    channel: siteVisits.channel,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${siteVisits.visitorId})`,
    avgDuration: sql<number>`COALESCE(AVG(${siteVisits.duration}), 0)`,
  }).from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to),
      sql`${siteVisits.channel} LIKE 'ai_%'`
    ))
    .groupBy(siteVisits.channel)
    .orderBy(sql`count(*) desc`);
}

/** 시간대별 방문 분포 (0~23시) */
export async function getHourlyDistribution(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT HOUR(visited_at) as hour, COUNT(*) as count
    FROM site_visits
    WHERE hospital_id = ${hospitalId}
      AND visited_at >= ${from}
      AND visited_at <= ${to}
    GROUP BY HOUR(visited_at)
    ORDER BY HOUR(visited_at)
  `);
  return (rows[0] as unknown as any[]).map((r: any) => ({ hour: Number(r.hour), count: Number(r.count) }));
}

// ─── 8번: 상담 문의 관리 강화 ────────────────────────────────────

/** 상담 문의 통계 (상태별 집계 + 전환율) */
export async function getConsultationStats(hospitalId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, contacted: 0, completed: 0, cancelled: 0, conversionRate: "0%" };
  const conditions = [eq(consultationInquiries.hospitalId, hospitalId)];
  if (from) conditions.push(gte(consultationInquiries.createdAt, from));
  if (to) conditions.push(lte(consultationInquiries.createdAt, to));
  const rows = await db.select({
    status: consultationInquiries.status,
    count: sql<number>`count(*)`,
  }).from(consultationInquiries)
    .where(and(...conditions))
    .groupBy(consultationInquiries.status);
  const total = rows.reduce((s, r) => s + Number(r.count), 0);
  const pending = Number(rows.find(r => r.status === "pending")?.count ?? 0);
  const contacted = Number(rows.find(r => r.status === "contacted")?.count ?? 0);
  const completed = Number(rows.find(r => r.status === "completed")?.count ?? 0);
  const cancelled = Number(rows.find(r => r.status === "cancelled")?.count ?? 0);
  const conversionRate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
  return { total, pending, contacted, completed, cancelled, conversionRate };
}

/** 채널별 상담 문의 집계 */
export async function getConsultationByChannel(hospitalId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(consultationInquiries.hospitalId, hospitalId)];
  if (from) conditions.push(gte(consultationInquiries.createdAt, from));
  if (to) conditions.push(lte(consultationInquiries.createdAt, to));
  return db.select({
    channel: consultationInquiries.channel,
    count: sql<number>`count(*)`,
  }).from(consultationInquiries)
    .where(and(...conditions))
    .groupBy(consultationInquiries.channel)
    .orderBy(sql`count(*) desc`);
}

/** 월별 상담 문의 추이 (최근 6개월) */
export async function getConsultationMonthlyTrend(hospitalId: number) {
  const db = await getDb();
  if (!db) return [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const rows = await db.execute(sql`
    SELECT DATE_FORMAT(created_at, '%Y-%m') as yearMonth, COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM consultation_inquiries
    WHERE hospital_id = ${hospitalId}
      AND created_at >= ${sixMonthsAgo}
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY DATE_FORMAT(created_at, '%Y-%m')
  `);
  return (rows[0] as unknown as any[]).map((r: any) => ({
    yearMonth: r.yearMonth as string,
    total: Number(r.total),
    completed: Number(r.completed),
  }));
}

// ─── 9번: 월간 리포트 자동 생성 ─────────────────────────────────

/** 특정 월의 방문 채널별 집계 (리포트 생성용) */
export async function getMonthlyVisitSummary(hospitalId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return null;
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);
  const rows = await db.select({
    channel: siteVisits.channel,
    count: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to)
    ))
    .groupBy(siteVisits.channel);
  
  const totalVisits = rows.reduce((s, r) => s + Number(r.count), 0);
  const aiChannelVisits = rows.filter(r => r.channel?.startsWith("ai_")).reduce((s, r) => s + Number(r.count), 0);
  const naverVisits = Number(rows.find(r => r.channel === "naver")?.count ?? 0);
  const googleVisits = Number(rows.find(r => r.channel === "google")?.count ?? 0);
  const snsVisits = rows.filter(r => r.channel?.startsWith("sns_")).reduce((s, r) => s + Number(r.count), 0);
  const directVisits = Number(rows.find(r => r.channel === "direct")?.count ?? 0);
  
  return { totalVisits, aiChannelVisits, naverVisits, googleVisits, snsVisits, directVisits };
}

/** 특정 월의 상담 문의 집계 (리포트 생성용) */
export async function getMonthlyInquirySummary(hospitalId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return { totalInquiries: 0, completedInquiries: 0, conversionRate: "0%" };
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);
  const rows = await db.select({
    status: consultationInquiries.status,
    count: sql<number>`count(*)`,
  }).from(consultationInquiries)
    .where(and(
      eq(consultationInquiries.hospitalId, hospitalId),
      gte(consultationInquiries.createdAt, from),
      lte(consultationInquiries.createdAt, to)
    ))
    .groupBy(consultationInquiries.status);
  const totalInquiries = rows.reduce((s, r) => s + Number(r.count), 0);
  const completedInquiries = Number(rows.find(r => r.status === "completed")?.count ?? 0);
  const conversionRate = totalInquiries > 0 ? `${Math.round((completedInquiries / totalInquiries) * 100)}%` : "0%";
  return { totalInquiries, completedInquiries, conversionRate };
}


// ═══════════════════════════════════════════════════
// 5번: 자동 진단 시스템 — 계약 병원 자동 진단 관련
// ═══════════════════════════════════════════════════

/** 활성 병원 프로필 전체 조회 (자동 진단용) */
export async function getActiveHospitalProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hospitalProfiles)
    .where(eq(hospitalProfiles.isActive, 1));
}

/** 마지막 자동 진단 날짜 조회 */
export async function getLastAutoDiagnosisDate(hospitalUrl: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ diagnosedAt: diagnosisHistory.diagnosedAt })
    .from(diagnosisHistory)
    .where(eq(diagnosisHistory.url, hospitalUrl))
    .orderBy(desc(diagnosisHistory.diagnosedAt))
    .limit(1);
  return rows[0]?.diagnosedAt ?? null;
}

// ═══════════════════════════════════════════════════
// 10번: 관리자 병원 현황 대시보드 — 전체 병원 통합 통계
// ═══════════════════════════════════════════════════

/** 전체 병원 현황 요약 (관리자 대시보드용) */
export async function getAdminHospitalOverview() {
  const db = await getDb();
  if (!db) return { totalHospitals: 0, activeHospitals: 0, totalVisits: 0, totalInquiries: 0, avgSeoScore: 0, avgAiScore: 0 };

  // 병원 수
  const [totalCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(hospitalProfiles);
  const [activeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(hospitalProfiles)
    .where(eq(hospitalProfiles.isActive, 1));

  // 최근 30일 방문 수
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [visitCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(siteVisits)
    .where(gte(siteVisits.visitedAt, thirtyDaysAgo));

  // 최근 30일 상담 문의 수
  const [inquiryCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(consultationInquiries)
    .where(gte(consultationInquiries.createdAt, thirtyDaysAgo));

  // 평균 SEO/AI 점수 (최근 진단 기준)
  const avgScores = await db.select({
    avgSeo: sql<number>`ROUND(AVG(${diagnosisHistory.totalScore}))`,
    avgAi: sql<number>`ROUND(AVG(${diagnosisHistory.aiScore}))`,
  }).from(diagnosisHistory)
    .where(gte(diagnosisHistory.diagnosedAt, thirtyDaysAgo));

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
export async function getHospitalPerformanceRanking() {
  const db = await getDb();
  if (!db) return [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 병원별 방문수 집계
  const visitsByHospital = await db.select({
    hospitalId: siteVisits.hospitalId,
    visitCount: sql<number>`COUNT(*)`,
    uniqueVisitors: sql<number>`COUNT(DISTINCT ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(gte(siteVisits.visitedAt, thirtyDaysAgo))
    .groupBy(siteVisits.hospitalId);

  // 병원별 상담수 집계
  const inquiriesByHospital = await db.select({
    hospitalId: consultationInquiries.hospitalId,
    inquiryCount: sql<number>`COUNT(*)`,
  }).from(consultationInquiries)
    .where(gte(consultationInquiries.createdAt, thirtyDaysAgo))
    .groupBy(consultationInquiries.hospitalId);

  // 병원 프로필
  const profiles = await db.select().from(hospitalProfiles)
    .where(eq(hospitalProfiles.isActive, 1));

  // 최근 진단 점수
  const latestScores = await db.select({
    url: diagnosisHistory.url,
    totalScore: sql<number>`MAX(${diagnosisHistory.totalScore})`,
    aiScore: sql<number>`MAX(${diagnosisHistory.aiScore})`,
  }).from(diagnosisHistory)
    .where(gte(diagnosisHistory.diagnosedAt, thirtyDaysAgo))
    .groupBy(diagnosisHistory.url);

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
export async function getAdminChannelStats() {
  const db = await getDb();
  if (!db) return [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db.select({
    channel: siteVisits.channel,
    count: sql<number>`COUNT(*)`,
    uniqueVisitors: sql<number>`COUNT(DISTINCT ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(gte(siteVisits.visitedAt, thirtyDaysAgo))
    .groupBy(siteVisits.channel)
    .orderBy(sql`COUNT(*) DESC`);
}

// ═══════════════════════════════════════════════════
// 관리자 알림 시스템
// ═══════════════════════════════════════════════════

/** 알림 생성 */
export async function createAdminNotification(data: InsertAdminNotification) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(adminNotifications).values(data);
  return result;
}

/** 알림 목록 조회 (최신순, limit) */
export async function getAdminNotifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminNotifications)
    .orderBy(desc(adminNotifications.createdAt))
    .limit(limit);
}

/** 읽지 않은 알림 수 */
export async function getUnreadNotificationCount() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(adminNotifications)
    .where(eq(adminNotifications.isRead, false));
  return row?.count ?? 0;
}

/** 알림 읽음 처리 */
export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.id, id));
}

/** 모든 알림 읽음 처리 */
export async function markAllNotificationsRead() {
  const db = await getDb();
  if (!db) return;
  await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.isRead, false));
}

// ═══════════════════════════════════════════════════
// 월간 리포트 공유 토큰
// ═══════════════════════════════════════════════════

/** 월간 리포트에 공유 토큰 설정 */
export async function setMonthlyReportShareToken(reportId: number, token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(monthlyReports).set({ shareToken: token }).where(eq(monthlyReports.id, reportId));
}

/** 공유 토큰으로 월간 리포트 조회 */
export async function getMonthlyReportByShareToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(monthlyReports)
    .where(eq(monthlyReports.shareToken, token))
    .limit(1);
  return rows[0] ?? null;
}

/** 월간 리포트 단건 조회 (ID) */
export async function getMonthlyReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(monthlyReports)
    .where(eq(monthlyReports.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** 월간 리포트 PDF URL 업데이트 */
export async function updateMonthlyReportPdfUrl(reportId: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(monthlyReports).set({ pdfUrl }).where(eq(monthlyReports.id, reportId));
}

// ═══════════════════════════════════════════════════
// 방문자 행동 퍼널 (병원별)
// ═══════════════════════════════════════════════════

/** 병원별 방문자 행동 퍼널 데이터 */
export async function getVisitorFunnel(hospitalId: number, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return { totalVisitors: 0, pageViewers: 0, multiPageViewers: 0, inquirySubmitters: 0 };

  // 1. 총 고유 방문자 수
  const [visitors] = await db.select({
    count: sql<number>`COUNT(DISTINCT ${siteVisits.visitorId})`,
  }).from(siteVisits)
    .where(and(
      eq(siteVisits.hospitalId, hospitalId),
      gte(siteVisits.visitedAt, from),
      lte(siteVisits.visitedAt, to),
    ));

  // 2. 2페이지 이상 본 방문자 (engagement)
  const multiPageRows = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(
    db.select({
      visitorId: siteVisits.visitorId,
      pageCount: sql<number>`COUNT(DISTINCT ${siteVisits.pageUrl})`,
    }).from(siteVisits)
      .where(and(
        eq(siteVisits.hospitalId, hospitalId),
        gte(siteVisits.visitedAt, from),
        lte(siteVisits.visitedAt, to),
      ))
      .groupBy(siteVisits.visitorId)
      .having(sql`COUNT(DISTINCT ${siteVisits.pageUrl}) >= 2`)
      .as("multi_page")
  );

  // 3. 상담 문의 제출자 수
  const [inquiries] = await db.select({
    count: sql<number>`COUNT(DISTINCT ${consultationInquiries.visitorId})`,
  }).from(consultationInquiries)
    .where(and(
      eq(consultationInquiries.hospitalId, hospitalId),
      gte(consultationInquiries.createdAt, from),
      lte(consultationInquiries.createdAt, to),
    ));

  return {
    totalVisitors: visitors?.count ?? 0,
    pageViewers: visitors?.count ?? 0, // 방문 = 페이지뷰
    multiPageViewers: multiPageRows[0]?.count ?? 0,
    inquirySubmitters: inquiries?.count ?? 0,
  };
}


// ─── 병원 정보 관리 (Hospital Info Items) ──────────────────────────

export async function getHospitalInfoItems(hospitalId: number, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(hospitalInfoItems.hospitalId, hospitalId)];
  if (category) {
    conditions.push(eq(hospitalInfoItems.category, category as any));
  }
  return db.select().from(hospitalInfoItems)
    .where(and(...conditions))
    .orderBy(hospitalInfoItems.sortOrder, hospitalInfoItems.createdAt);
}

export async function createHospitalInfoItem(data: InsertHospitalInfoItem) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(hospitalInfoItems).values(data).$returningId();
  return result;
}

export async function updateHospitalInfoItem(id: number, hospitalId: number, data: Partial<InsertHospitalInfoItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(hospitalInfoItems).set(data)
    .where(and(eq(hospitalInfoItems.id, id), eq(hospitalInfoItems.hospitalId, hospitalId)));
}

export async function deleteHospitalInfoItem(id: number, hospitalId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(hospitalInfoItems)
    .where(and(eq(hospitalInfoItems.id, id), eq(hospitalInfoItems.hospitalId, hospitalId)));
}

// ─── 상담 CRM 확장 (파이프라인 통계) ──────────────────────────────

export async function getConsultationPipeline(hospitalId: number) {
  const db = await getDb();
  if (!db) return { pending: 0, contacted: 0, completed: 0, cancelled: 0, total: 0 };
  const rows = await db.select({
    status: consultationInquiries.status,
    count: sql<number>`COUNT(*)`,
  }).from(consultationInquiries)
    .where(eq(consultationInquiries.hospitalId, hospitalId))
    .groupBy(consultationInquiries.status);
  
  const result = { pending: 0, contacted: 0, completed: 0, cancelled: 0, total: 0 };
  for (const row of rows) {
    const s = row.status as keyof typeof result;
    if (s in result) result[s] = Number(row.count);
    result.total += Number(row.count);
  }
  return result;
}

export async function getRecentConsultations(hospitalId: number, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(consultationInquiries.hospitalId, hospitalId)];
  if (status && status !== "all") {
    conditions.push(eq(consultationInquiries.status, status as any));
  }
  return db.select().from(consultationInquiries)
    .where(and(...conditions))
    .orderBy(desc(consultationInquiries.createdAt))
    .limit(limit);
}

export async function updateConsultationNote(id: number, hospitalId: number, note: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(consultationInquiries).set({ note })
    .where(and(eq(consultationInquiries.id, id), eq(consultationInquiries.hospitalId, hospitalId)));
}



// ─── AI 블로그 무료 체험 ───
export async function createAiBlogTrial(data: InsertAiBlogTrial) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiBlogTrials).values(data).$returningId();
  return result;
}

export async function getAiBlogTrialStats() {
  const db = await getDb();
  if (!db) return { total: 0, today: 0 };
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(aiBlogTrials);
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const [today] = await db.select({ count: sql<number>`count(*)` }).from(aiBlogTrials).where(gte(aiBlogTrials.createdAt, todayStart));
  return { total: total.count, today: today.count };
}

export async function getRecentAiBlogTrials(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiBlogTrials).orderBy(desc(aiBlogTrials.createdAt)).limit(limit);
}

// ─── AI 콘텐츠 생성 로그 ───
export async function createAiContentLog(data: InsertAiContentLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiContentLogs).values(data).$returningId();
  return result;
}

export async function updateAiContentLog(id: number, data: Partial<InsertAiContentLog>) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiContentLogs).set(data).where(eq(aiContentLogs.id, id));
}

export async function getAiContentLogsByUser(userId: number, contentType?: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiContentLogs.userId, userId)];
  if (contentType) {
    conditions.push(eq(aiContentLogs.contentType, contentType as any));
  }
  return db.select().from(aiContentLogs)
    .where(and(...conditions))
    .orderBy(desc(aiContentLogs.createdAt))
    .limit(limit);
}

export async function getAiContentStats(userId: number) {
  const db = await getDb();
  if (!db) return { blog: 0, cardnews: 0, video_script: 0, poster: 0, total: 0 };
  const rows = await db.select({
    contentType: aiContentLogs.contentType,
    count: sql<number>`count(*)`,
  }).from(aiContentLogs)
    .where(and(eq(aiContentLogs.userId, userId), eq(aiContentLogs.status, "completed")))
    .groupBy(aiContentLogs.contentType);
  const stats: Record<string, number> = { blog: 0, cardnews: 0, video_script: 0, poster: 0 };
  let total = 0;
  for (const r of rows) { stats[r.contentType] = r.count; total += r.count; }
  return { ...stats, total };
}

// ─── 카드뉴스 템플릿 ───
export async function getCardnewsTemplates(specialty?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(cardnewsTemplates.isActive, 1)];
  if (specialty) conditions.push(eq(cardnewsTemplates.specialty, specialty));
  if (category) conditions.push(eq(cardnewsTemplates.category, category as any));
  return db.select().from(cardnewsTemplates)
    .where(and(...conditions))
    .orderBy(desc(cardnewsTemplates.usageCount));
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(cardnewsTemplates).set({ usageCount: sql`${cardnewsTemplates.usageCount} + 1` }).where(eq(cardnewsTemplates.id, id));
}

export async function createCardnewsTemplate(data: InsertCardnewsTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(cardnewsTemplates).values(data).$returningId();
  return result;
}


// ─── 검수 리포트 관련 ───
export async function getReviewReport(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pass: 0, warning: 0, fail: 0, avgScore: 0, recentReviews: [] };
  const allLogs = await db.select().from(aiContentLogs)
    .where(and(eq(aiContentLogs.userId, userId), isNotNull(aiContentLogs.reviewVerdict)))
    .orderBy(desc(aiContentLogs.createdAt))
    .limit(200);
  const total = allLogs.length;
  const pass = allLogs.filter(l => l.reviewVerdict === "pass").length;
  const warning = allLogs.filter(l => l.reviewVerdict === "warning").length;
  const fail = allLogs.filter(l => l.reviewVerdict === "fail").length;
  const scores = allLogs.filter(l => l.reviewScore !== null).map(l => l.reviewScore!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const recentReviews = allLogs.slice(0, 20).map(l => ({
    id: l.id,
    contentType: l.contentType,
    title: l.generatedTitle,
    verdict: l.reviewVerdict,
    score: l.reviewScore,
    summary: l.reviewSummary,
    issues: l.reviewIssues ? JSON.parse(l.reviewIssues) : [],
    presetId: l.presetId,
    createdAt: l.createdAt,
  }));
  return { total, pass, warning, fail, avgScore, recentReviews };
}

export async function getReviewReportAdmin() {
  const db = await getDb();
  if (!db) return { total: 0, pass: 0, warning: 0, fail: 0, avgScore: 0, recentReviews: [], topIssues: [] };
  const allLogs = await db.select().from(aiContentLogs)
    .where(isNotNull(aiContentLogs.reviewVerdict))
    .orderBy(desc(aiContentLogs.createdAt))
    .limit(500);
  const total = allLogs.length;
  const pass = allLogs.filter(l => l.reviewVerdict === "pass").length;
  const warning = allLogs.filter(l => l.reviewVerdict === "warning").length;
  const fail = allLogs.filter(l => l.reviewVerdict === "fail").length;
  const scores = allLogs.filter(l => l.reviewScore !== null).map(l => l.reviewScore!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  // 자주 발생하는 위반 항목 집계
  const issueMap = new Map<string, number>();
  allLogs.forEach(l => {
    if (l.reviewIssues) {
      try {
        const issues = JSON.parse(l.reviewIssues);
        issues.forEach((issue: any) => {
          const clause = issue.clause || "기타";
          issueMap.set(clause, (issueMap.get(clause) || 0) + 1);
        });
      } catch {}
    }
  });
  const topIssues = Array.from(issueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([clause, count]) => ({ clause, count }));
  const recentReviews = allLogs.slice(0, 30).map(l => ({
    id: l.id,
    contentType: l.contentType,
    title: l.generatedTitle,
    verdict: l.reviewVerdict,
    score: l.reviewScore,
    summary: l.reviewSummary,
    issues: l.reviewIssues ? JSON.parse(l.reviewIssues) : [],
    presetId: l.presetId,
    hospitalName: l.hospitalName,
    createdAt: l.createdAt,
  }));
  return { total, pass, warning, fail, avgScore, recentReviews, topIssues };
}

// ─── 네이버 블로그 발행 기록 업데이트 ───
export async function updateNaverPublishStatus(contentId: number, postUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiContentLogs).set({
    naverPublished: 1,
    naverPostUrl: postUrl,
    naverPublishedAt: new Date(),
  }).where(eq(aiContentLogs.id, contentId));
}

// ─── 콘텐츠 로그에 검수 결과 저장 ───
export async function updateContentReview(contentId: number, review: {
  verdict: string;
  score: number;
  issues: any[];
  summary: string;
  revisedContent: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiContentLogs).set({
    reviewVerdict: review.verdict as any,
    reviewScore: review.score,
    reviewIssues: JSON.stringify(review.issues),
    reviewSummary: review.summary,
    revisedContent: review.revisedContent,
  }).where(eq(aiContentLogs.id, contentId));
}

// ─── 콘텐츠 상세 조회 ───
export async function getContentById(contentId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(aiContentLogs).where(eq(aiContentLogs.id, contentId)).limit(1);
  return row || null;
}


// ═══════════════════════════════════════════════════════════════════
// 38차: 프리미엄 벤치마킹 리포트 DB 헬퍼
// ═══════════════════════════════════════════════════════════════════
// benchmarkingReports imported at top of file

export async function createBenchmarkingReport(data: InsertBenchmarkingReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(benchmarkingReports).values(data).$returningId();
  return result.id;
}

export async function getBenchmarkingReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(benchmarkingReports).where(eq(benchmarkingReports.id, id)).limit(1);
  return row || null;
}

export async function getBenchmarkingReportsByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(benchmarkingReports)
    .where(eq(benchmarkingReports.userId, userId))
    .orderBy(desc(benchmarkingReports.createdAt))
    .limit(20);
}

export async function updateBenchmarkingReportStatus(id: number, status: "generating" | "completed" | "failed", updates?: Partial<{
  executiveSummary: string;
  categoryComparison: string;
  actionableInsights: string;
  snsMarketingTips: string;
  weeklyPlan: string;
  pdfUrl: string;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(benchmarkingReports).set({
    status,
    ...updates,
  }).where(eq(benchmarkingReports.id, id));
}

export async function getBenchmarkingReportByShareToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(benchmarkingReports)
    .where(eq(benchmarkingReports.shareToken, token))
    .limit(1);
  return row || null;
}


// ─── 이메일 연락처 통합 관리 ───
export async function upsertEmailContact(data: {
  email: string;
  name?: string;
  hospitalName?: string;
  specialty?: string;
  phone?: string;
  source: InsertEmailContact["source"];
  tags?: string[];
  lastDiagnosisUrl?: string;
  lastDiagnosisScore?: number;
  lastDiagnosisGrade?: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  // 기존 연락처 확인
  const [existing] = await db.select().from(emailContacts)
    .where(eq(emailContacts.email, data.email)).limit(1);
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
    await db.update(emailContacts).set(updates).where(eq(emailContacts.id, existing.id));
    return existing.id;
  } else {
    // 새 연락처 생성
    const [result] = await db.insert(emailContacts).values({
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
  if (options?.source) conditions.push(eq(emailContacts.source, options.source as any));
  if (options?.status) conditions.push(eq(emailContacts.status, options.status as any));
  if (options?.search) {
    conditions.push(
      sql`(${emailContacts.email} LIKE ${`%${options.search}%`} OR ${emailContacts.hospitalName} LIKE ${`%${options.search}%`} OR ${emailContacts.name} LIKE ${`%${options.search}%`})`
    );
  }
  if (options?.tag) {
    conditions.push(sql`JSON_CONTAINS(${emailContacts.tags}, ${JSON.stringify(options.tag)}, '$')`);
  }
  const query = db.select().from(emailContacts);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return (where ? query.where(where) : query)
    .orderBy(desc(emailContacts.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);
}

export async function getEmailContactStats() {
  const db = await getDb();
  if (!db) return null;
  const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailContacts);
  const [active] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailContacts).where(eq(emailContacts.status, "active"));
  const sourceStats = await db.select({
    source: emailContacts.source,
    count: sql<number>`COUNT(*)`,
  }).from(emailContacts).groupBy(emailContacts.source);
  const [recentWeek] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailContacts)
    .where(gte(emailContacts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  return {
    total: total.count,
    active: active.count,
    recentWeek: recentWeek.count,
    bySource: sourceStats,
  };
}

export async function updateEmailContact(id: number, updates: Partial<{
  name: string;
  hospitalName: string;
  specialty: string;
  phone: string;
  tags: string[];
  marketingConsent: boolean;
  status: "active" | "unsubscribed" | "bounced";
  note: string;
}>) {
  const db = await getDb();
  if (!db) return;
  const data: any = { ...updates, updatedAt: new Date() };
  if (updates.tags) data.tags = JSON.stringify(updates.tags);
  await db.update(emailContacts).set(data).where(eq(emailContacts.id, id));
}

export async function deleteEmailContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailContacts).where(eq(emailContacts.id, id));
}

export async function getEmailContactByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(emailContacts).where(eq(emailContacts.email, email)).limit(1);
  return row || null;
}

export async function incrementEmailSentCount(contactId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailContacts).set({
    totalEmailsSent: sql`${emailContacts.totalEmailsSent} + 1`,
    lastEmailSentAt: new Date(),
  }).where(eq(emailContacts.id, contactId));
}

// ─── 이메일 발송 로그 ───
export async function createEmailSendLog(data: InsertEmailSendLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(emailSendLogs).values(data).$returningId();
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
  if (options?.contactId) conditions.push(eq(emailSendLogs.contactId, options.contactId));
  if (options?.email) conditions.push(eq(emailSendLogs.email, options.email));
  if (options?.templateType) conditions.push(eq(emailSendLogs.templateType, options.templateType));
  const query = db.select().from(emailSendLogs);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return (where ? query.where(where) : query)
    .orderBy(desc(emailSendLogs.createdAt))
    .limit(options?.limit || 50);
}

export async function getEmailSendStats() {
  const db = await getDb();
  if (!db) return null;
  const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailSendLogs);
  const [sent] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailSendLogs).where(eq(emailSendLogs.status, "sent"));
  const templateStats = await db.select({
    type: emailSendLogs.templateType,
    count: sql<number>`COUNT(*)`,
  }).from(emailSendLogs).groupBy(emailSendLogs.templateType);
  return { total: total.count, sent: sent.count, byTemplate: templateStats };
}


// ===== 40차: 시술 상세페이지 =====
export async function createTreatmentPage(data: InsertTreatmentPage) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(treatmentPages).values(data).$returningId();
  return result;
}
export async function getTreatmentPageBySlug(slug: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(treatmentPages).where(eq(treatmentPages.slug, slug)).limit(1);
  return rows[0] || null;
}
export async function getTreatmentPageById(id: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(treatmentPages).where(eq(treatmentPages.id, id)).limit(1);
  return rows[0] || null;
}
export async function getTreatmentPagesByUser(userId: number) {
  const db = await getDb(); if (!db) return null;
  return db.select().from(treatmentPages).where(eq(treatmentPages.userId, userId)).orderBy(desc(treatmentPages.createdAt));
}
export async function updateTreatmentPage(id: number, data: Partial<InsertTreatmentPage>) {
  const db = await getDb(); if (!db) return null;
  await db.update(treatmentPages).set({ ...data, updatedAt: new Date() }).where(eq(treatmentPages.id, id));
  return getTreatmentPageById(id);
}
export async function deleteTreatmentPage(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(treatmentPages).where(eq(treatmentPages.id, id));
}
export async function incrementTreatmentPageView(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(treatmentPages).set({ viewCount: sql`view_count + 1` }).where(eq(treatmentPages.id, id));
}

// ===== 40차: 자동화 규칙 =====
export async function createAutomationRule(data: InsertAutomationRule) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(automationRules).values(data).$returningId();
  return result;
}
export async function getAutomationRulesByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(automationRules).where(eq(automationRules.userId, userId)).orderBy(desc(automationRules.createdAt));
}
export async function updateAutomationRule(id: number, data: Partial<InsertAutomationRule>) {
  const db = await getDb(); if (!db) return null;
  await db.update(automationRules).set({ ...data, updatedAt: new Date() }).where(eq(automationRules.id, id));
  const rows = await (await getDb())!.select().from(automationRules).where(eq(automationRules.id, id)).limit(1);
  return rows[0] || null;
}
export async function deleteAutomationRule(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(automationRules).where(eq(automationRules.id, id));
}
export async function createAutomationLog(data: { ruleId: number; userId: number; recipientEmail?: string; recipientPhone?: string; channel: string; status: string; errorMessage?: string; metadata?: any }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(automationLogs).values(data).$returningId();
  return result;
}
export async function getAutomationLogsByUser(userId: number, limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(automationLogs).where(eq(automationLogs.userId, userId)).orderBy(desc(automationLogs.createdAt)).limit(limit);
}

// ===== 40차: 마케팅 콘텐츠 =====
export async function createMarketingContent(data: InsertMarketingContent) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(marketingContent).values(data).$returningId();
  return result;
}
export async function getMarketingContentByUser(userId: number, filters?: { channel?: string; status?: string }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(marketingContent.userId, userId)];
  if (filters?.channel) conditions.push(eq(marketingContent.channel, filters.channel));
  if (filters?.status) conditions.push(eq(marketingContent.status, filters.status));
  return db.select().from(marketingContent).where(and(...conditions)).orderBy(desc(marketingContent.createdAt));
}
export async function updateMarketingContent(id: number, data: Partial<InsertMarketingContent>) {
  const db = await getDb(); if (!db) return null;
  await db.update(marketingContent).set({ ...data, updatedAt: new Date() }).where(eq(marketingContent.id, id));
  const rows = await (await getDb())!.select().from(marketingContent).where(eq(marketingContent.id, id)).limit(1);
  return rows[0] || null;
}
export async function deleteMarketingContent(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(marketingContent).where(eq(marketingContent.id, id));
}
export async function getMarketingCalendar(userId: number, year: number, month: number) {
  const db = await getDb(); if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(marketingContent)
    .where(and(eq(marketingContent.userId, userId), gte(marketingContent.scheduledAt, startDate), lte(marketingContent.scheduledAt, endDate)))
    .orderBy(marketingContent.scheduledAt);
}


// ===== 카카오톡 예약하기 =====
export async function getBookingSettings(userId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(kakaoBookingSettings).where(eq(kakaoBookingSettings.userId, userId)).limit(1);
  return rows[0] || null;
}

export async function upsertBookingSettings(userId: number, data: Partial<InsertKakaoBookingSetting>) {
  const db = await getDb(); if (!db) return null;
  const existing = await getBookingSettings(userId);
  if (existing) {
    await db.update(kakaoBookingSettings).set({ ...data, updatedAt: new Date() }).where(eq(kakaoBookingSettings.id, existing.id));
    return { ...existing, ...data };
  } else {
    const [result] = await db.insert(kakaoBookingSettings).values({ ...data, userId } as InsertKakaoBookingSetting);
    return { id: result.insertId, userId, ...data };
  }
}

export async function getBookingSlots(userId: number, settingId?: number) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(bookingSlots.userId, userId)];
  if (settingId) conditions.push(eq(bookingSlots.settingId, settingId));
  return db.select().from(bookingSlots).where(and(...conditions)).orderBy(bookingSlots.sortOrder);
}

export async function createBookingSlot(data: InsertBookingSlot) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(bookingSlots).values(data);
  return { id: result.insertId, ...data };
}

export async function updateBookingSlot(id: number, userId: number, data: Partial<InsertBookingSlot>) {
  const db = await getDb(); if (!db) return false;
  await db.update(bookingSlots).set(data).where(and(eq(bookingSlots.id, id), eq(bookingSlots.userId, userId)));
  return true;
}

export async function deleteBookingSlot(id: number, userId: number) {
  const db = await getDb(); if (!db) return false;
  await db.delete(bookingSlots).where(and(eq(bookingSlots.id, id), eq(bookingSlots.userId, userId)));
  return true;
}


// ── 43차: 콘텐츠 공장 시스템 + AI 영상 마케팅 ──

export async function getStyleGuide(userId: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(contentStyleGuides).where(eq(contentStyleGuides.userId, userId)).limit(1);
  return rows[0] || null;
}

export async function upsertStyleGuide(userId: string, data: Partial<ContentStyleGuide>) {
  const db = await getDb(); if (!db) return null;
  const existing = await getStyleGuide(userId);
  if (existing) {
    await db.update(contentStyleGuides).set({ ...data, updatedAt: new Date() }).where(eq(contentStyleGuides.id, existing.id));
    return { ...existing, ...data };
  }
  const [result] = await db.insert(contentStyleGuides).values({ userId, ...data } as any);
  return { id: result.insertId, userId, ...data };
}

export async function getContentIdeas(userId: string, opts: { status?: string; platform?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  let q = db.select().from(contentIdeas).where(eq(contentIdeas.userId, userId)).orderBy(desc(contentIdeas.createdAt));
  return q.limit(opts.limit || 50);
}

export async function createContentIdea(data: { userId: string; title: string; sourceUrl?: string; sourceType?: string; platform?: string; category?: string; whyItWorks?: string; viewCount?: string; notes?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(contentIdeas).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateContentIdea(id: number, userId: string, data: Partial<ContentIdea>) {
  const db = await getDb(); if (!db) return null;
  await db.update(contentIdeas).set(data).where(and(eq(contentIdeas.id, id), eq(contentIdeas.userId, userId)));
  return { id, ...data };
}

export async function deleteContentIdea(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(contentIdeas).where(and(eq(contentIdeas.id, id), eq(contentIdeas.userId, userId)));
  return true;
}

export async function getContentHooks(userId: string, opts: { category?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contentHooks).where(eq(contentHooks.userId, userId)).orderBy(desc(contentHooks.createdAt)).limit(opts.limit || 50);
}

export async function createContentHook(data: { userId: string; hookText: string; hookType?: string; platform?: string; category?: string; sourceIdeaId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(contentHooks).values(data as any);
  return { id: result.insertId, ...data };
}

export async function deleteContentHook(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(contentHooks).where(and(eq(contentHooks.id, id), eq(contentHooks.userId, userId)));
  return true;
}

export async function getContentScripts(userId: string, opts: { status?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contentScripts).where(eq(contentScripts.userId, userId)).orderBy(desc(contentScripts.createdAt)).limit(opts.limit || 50);
}

export async function createContentScript(data: { userId: string; title: string; hookId?: number; ideaId?: number; platform?: string; scriptType?: string; duration?: string; hookSection?: string; bodySection?: string; ctaSection?: string; fullScript?: string; hashtags?: string; hospitalId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(contentScripts).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateContentScript(id: number, userId: string, data: Partial<ContentScript>) {
  const db = await getDb(); if (!db) return null;
  await db.update(contentScripts).set(data).where(and(eq(contentScripts.id, id), eq(contentScripts.userId, userId)));
  return { id, ...data };
}

export async function getCalendarItems(userId: string, opts: { month?: string; platform?: string } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contentCalendar).where(eq(contentCalendar.userId, userId)).orderBy(desc(contentCalendar.scheduledDate)).limit(100);
}

export async function createCalendarItem(data: { userId: string; title: string; scriptId?: number; platform: string; scheduledDate: Date; scheduledTime?: string; notes?: string; hospitalId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(contentCalendar).values(data as any);
  return { id: result.insertId, ...data };
}

export async function updateCalendarItem(id: number, userId: string, data: Partial<ContentCalendarItem>) {
  const db = await getDb(); if (!db) return null;
  await db.update(contentCalendar).set(data).where(and(eq(contentCalendar.id, id), eq(contentCalendar.userId, userId)));
  return { id, ...data };
}

export async function deleteCalendarItem(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(contentCalendar).where(and(eq(contentCalendar.id, id), eq(contentCalendar.userId, userId)));
  return true;
}

export async function getVideoPrompts(userId: string, opts: { videoType?: string; limit?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(videoPrompts).where(eq(videoPrompts.userId, userId)).orderBy(desc(videoPrompts.createdAt)).limit(opts.limit || 50);
}

export async function createVideoPrompt(data: { userId: string; treatmentName: string; videoType: string; targetPlatform?: string; prompt: string; script?: string; duration?: string; style?: string; musicSuggestion?: string; hashtags?: string; hospitalId?: number }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(videoPrompts).values(data as any);
  return { id: result.insertId, ...data };
}

export async function getMarketingDashboardStats(userId: string) {
  const db = await getDb(); if (!db) return null;
  const [ideasCount] = await db.select({ count: sql<number>`count(*)` }).from(contentIdeas).where(eq(contentIdeas.userId, userId));
  const [hooksCount] = await db.select({ count: sql<number>`count(*)` }).from(contentHooks).where(eq(contentHooks.userId, userId));
  const [scriptsCount] = await db.select({ count: sql<number>`count(*)` }).from(contentScripts).where(eq(contentScripts.userId, userId));
  const [calendarCount] = await db.select({ count: sql<number>`count(*)` }).from(contentCalendar).where(eq(contentCalendar.userId, userId));
  const [videoPromptsCount] = await db.select({ count: sql<number>`count(*)` }).from(videoPrompts).where(eq(videoPrompts.userId, userId));
  const [diagnosisCount] = await db.select({ count: sql<number>`count(*)` }).from(diagnosisHistory);
  const [emailCount] = await db.select({ count: sql<number>`count(*)` }).from(emailContacts);
  const [treatmentPagesCount] = await db.select({ count: sql<number>`count(*)` }).from(treatmentPages).where(eq(treatmentPages.userId, Number(userId)));
  const [benchmarkCount] = await db.select({ count: sql<number>`count(*)` }).from(benchmarkingReports).where(eq(benchmarkingReports.userId, userId));
  const [blogCount] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
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
  await db.delete(videoPrompts).where(and(eq(videoPrompts.id, id), eq(videoPrompts.userId, userId)));
  return true;
}


// ─── 44차: 광고 공장 ───

export async function createAdBrandProfile(data: { userId: string; hospitalUrl: string; hospitalName?: string; logoUrl?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string; fontStyle?: string; toneOfVoice?: string; targetAudience?: string; brandKeywords?: string; specialties?: string; brandSummary?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(adBrandProfiles).values(data).$returningId();
  return result;
}

export async function getAdBrandProfiles(userId: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(adBrandProfiles).where(eq(adBrandProfiles.userId, userId)).orderBy(desc(adBrandProfiles.createdAt));
}

export async function getAdBrandProfileById(id: number, userId: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(adBrandProfiles).where(and(eq(adBrandProfiles.id, id), eq(adBrandProfiles.userId, userId)));
  return rows[0] || null;
}

export async function updateAdBrandProfile(id: number, userId: string, data: Partial<{ hospitalName: string; logoUrl: string; primaryColor: string; secondaryColor: string; accentColor: string; fontStyle: string; toneOfVoice: string; targetAudience: string; brandKeywords: string; specialties: string; brandSummary: string }>) {
  const db = await getDb(); if (!db) return false;
  await db.update(adBrandProfiles).set(data).where(and(eq(adBrandProfiles.id, id), eq(adBrandProfiles.userId, userId)));
  return true;
}

export async function deleteAdBrandProfile(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(adBrandProfiles).where(and(eq(adBrandProfiles.id, id), eq(adBrandProfiles.userId, userId)));
  return true;
}

export async function createAdCreative(data: { userId: string; brandProfileId?: number; platform: string; adType: string; treatmentName?: string; headline?: string; bodyText?: string; ctaText?: string; imageUrl?: string; imagePrompt?: string; dimensions?: string; hashtags?: string; complianceStatus?: string; complianceNotes?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(adCreatives).values(data).$returningId();
  return result;
}

export async function getAdCreatives(userId: string, filters?: { platform?: string; brandProfileId?: number; favoriteOnly?: boolean }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(adCreatives.userId, userId)];
  if (filters?.platform) conditions.push(eq(adCreatives.platform, filters.platform));
  if (filters?.brandProfileId) conditions.push(eq(adCreatives.brandProfileId, filters.brandProfileId));
  if (filters?.favoriteOnly) conditions.push(eq(adCreatives.isFavorite, 1));
  return db.select().from(adCreatives).where(and(...conditions)).orderBy(desc(adCreatives.createdAt));
}

export async function getAdCreativeById(id: number, userId: string) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(adCreatives).where(and(eq(adCreatives.id, id), eq(adCreatives.userId, userId)));
  return rows[0] || null;
}

export async function updateAdCreative(id: number, userId: string, data: Partial<{ headline: string; bodyText: string; ctaText: string; hashtags: string; isFavorite: number; complianceStatus: string; complianceNotes: string; status: string }>) {
  const db = await getDb(); if (!db) return false;
  await db.update(adCreatives).set(data).where(and(eq(adCreatives.id, id), eq(adCreatives.userId, userId)));
  return true;
}

export async function deleteAdCreative(id: number, userId: string) {
  const db = await getDb(); if (!db) return false;
  await db.delete(adCreatives).where(and(eq(adCreatives.id, id), eq(adCreatives.userId, userId)));
  return true;
}

export async function getAdCreativeStats(userId: string) {
  const db = await getDb(); if (!db) return { total: 0, byPlatform: {}, byType: {} };
  const all = await db.select().from(adCreatives).where(eq(adCreatives.userId, userId));
  const byPlatform: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const c of all) {
    byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
    byType[c.adType] = (byType[c.adType] || 0) + 1;
  }
  return { total: all.length, byPlatform, byType };
}


// ─── 주간 브리핑 통계 ───
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
    const allPosts = await db.select().from(blogPosts);
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
    const sessions = await db.select().from(chatSessions);
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
    const [totalRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(diagnosisHistory);
    totalDiagnoses = totalRow?.count ?? 0;
    const [weekRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(diagnosisHistory)
      .where(gte(diagnosisHistory.diagnosedAt, weekAgo));
    weeklyDiagnoses = weekRow?.count ?? 0;
    const [prevRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(diagnosisHistory)
      .where(sql`${diagnosisHistory.diagnosedAt} >= ${twoWeeksAgo} AND ${diagnosisHistory.diagnosedAt} < ${weekAgo}`);
    prevWeekDiagnoses = prevRow?.count ?? 0;
  }

  // 4) 이번 주 + 전주 신규 리드 수
  let weeklyLeads = 0;
  let prevWeekLeads = 0;
  let totalLeads = 0;
  if (db) {
    const allLeads = await db.select().from(seoLeads);
    totalLeads = allLeads.length;
    weeklyLeads = allLeads.filter(l => l.createdAt && new Date(l.createdAt) >= weekAgo).length;
    prevWeekLeads = allLeads.filter(l => l.createdAt && new Date(l.createdAt) >= twoWeeksAgo && new Date(l.createdAt) < weekAgo).length;
  }

  // 5) 이번 주 + 전주 AI 블로그 체험 수
  let weeklyTrials = 0;
  let prevWeekTrials = 0;
  if (db) {
    const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(aiBlogTrials)
      .where(gte(aiBlogTrials.createdAt, weekAgo));
    weeklyTrials = row?.count ?? 0;
    const [prevRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(aiBlogTrials)
      .where(sql`${aiBlogTrials.createdAt} >= ${twoWeeksAgo} AND ${aiBlogTrials.createdAt} < ${weekAgo}`);
    prevWeekTrials = prevRow?.count ?? 0;
  }

  // 6) 계약 병원 수
  let contractedCount = 0;
  if (db) {
    const profiles = await db.select().from(hospitalProfiles);
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


/* ─── 인터뷰 영상 → 멀티포맷 콘텐츠 ─── */
export async function createInterviewVideo(data: {
  userId: string;
  videoUrl: string;
  videoFileKey: string;
  fileName?: string;
  fileSizeBytes?: number;
  doctorName?: string;
  hospitalName?: string;
  topicKeyword?: string;
  hospitalId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(interviewVideos).values(data);
  return result;
}

export async function getInterviewVideos(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewVideos)
    .where(eq(interviewVideos.userId, userId))
    .orderBy(desc(interviewVideos.createdAt));
}

export async function getInterviewVideoById(id: number, userId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(interviewVideos)
    .where(and(eq(interviewVideos.id, id), eq(interviewVideos.userId, userId)));
  return rows[0] ?? null;
}

export async function updateInterviewVideo(id: number, userId: string, data: Partial<{
  status: string;
  transcript: string;
  transcriptLang: string;
  blogContents: string;
  cardnewsContents: string;
  shortformContents: string;
  errorMessage: string;
  durationSec: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(interviewVideos).set(data)
    .where(and(eq(interviewVideos.id, id), eq(interviewVideos.userId, userId)));
}

export async function deleteInterviewVideo(id: number, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(interviewVideos)
    .where(and(eq(interviewVideos.id, id), eq(interviewVideos.userId, userId)));
}


/* ─── 인터뷰 콘텐츠 대시보드 통계 ─── */
export async function getInterviewContentStats(userId: string) {
  const db = await getDb();
  if (!db) return { totalVideos: 0, totalBlogs: 0, totalCardnews: 0, totalShortforms: 0, recentVideos: [] };
  const videos = await db.select().from(interviewVideos)
    .where(eq(interviewVideos.userId, userId))
    .orderBy(desc(interviewVideos.createdAt));
  let totalBlogs = 0;
  let totalCardnews = 0;
  let totalShortforms = 0;
  for (const v of videos) {
    if (v.blogContents) { try { totalBlogs += JSON.parse(v.blogContents as string).length; } catch {} }
    if (v.cardnewsContents) { try { totalCardnews += JSON.parse(v.cardnewsContents as string).length; } catch {} }
    if (v.shortformContents) { try { totalShortforms += JSON.parse(v.shortformContents as string).length; } catch {} }
  }
  return {
    totalVideos: videos.length,
    totalBlogs,
    totalCardnews,
    totalShortforms,
    recentVideos: videos.slice(0, 10).map(v => ({
      id: v.id,
      fileName: v.fileName,
      doctorName: v.doctorName,
      hospitalName: v.hospitalName,
      topicKeyword: v.topicKeyword,
      status: v.status,
      createdAt: v.createdAt,
      hasBlog: !!v.blogContents,
      hasCardnews: !!v.cardnewsContents,
      hasShortform: !!v.shortformContents,
    })),
  };
}

/* ─── 캘린더 확장: 월별 조회 + 인터뷰 콘텐츠 연동 ─── */
export async function getCalendarItemsByMonth(userId: string, year: number, month: number) {
  const db = await getDb(); if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(contentCalendar)
    .where(and(
      eq(contentCalendar.userId, userId),
      gte(contentCalendar.scheduledDate, startDate),
      lte(contentCalendar.scheduledDate, endDate),
    ))
    .orderBy(contentCalendar.scheduledDate);
}

export async function getCalendarItemsByWeek(userId: string, startDate: Date) {
  const db = await getDb(); if (!db) return [];
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  return db.select().from(contentCalendar)
    .where(and(
      eq(contentCalendar.userId, userId),
      gte(contentCalendar.scheduledDate, startDate),
      lte(contentCalendar.scheduledDate, endDate),
    ))
    .orderBy(contentCalendar.scheduledDate);
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
  const [result] = await db.insert(contentCalendar).values(data as any);
  return { id: result.insertId, ...data };
}

// ============================================================
// A/B 테스트 DB 헬퍼
// ============================================================
// A/B 테스트 + 진단 자동화 헬퍼 (스키마는 상단 import에서 가져옴)

export async function getAbExperiments() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(abExperiments).orderBy(desc(abExperiments.createdAt));
}

export async function getAbExperimentById(id: number) {
  const db = await getDb(); if (!db) return null;
  const [exp] = await db.select().from(abExperiments).where(eq(abExperiments.id, id)).limit(1);
  return exp || null;
}

export async function createAbExperiment(data: InsertAbExperiment) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const [result] = await db.insert(abExperiments).values(data).$returningId();
  return result;
}

export async function updateAbExperiment(id: number, data: Partial<Omit<InsertAbExperiment, "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(abExperiments).set(data).where(eq(abExperiments.id, id));
}

export async function getAbVariantsByExperiment(experimentId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(abVariants).where(eq(abVariants.experimentId, experimentId));
}

export async function createAbVariant(data: InsertAbVariant) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const [result] = await db.insert(abVariants).values(data).$returningId();
  return result;
}

export async function updateAbVariant(id: number, data: Partial<Omit<InsertAbVariant, "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(abVariants).set(data).where(eq(abVariants.id, id));
}

export async function deleteAbVariant(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.delete(abVariants).where(eq(abVariants.id, id));
}

export async function getActiveExperimentForElement(targetElement: string) {
  const db = await getDb(); if (!db) return null;
  const [exp] = await db.select().from(abExperiments)
    .where(and(eq(abExperiments.targetElement, targetElement), eq(abExperiments.status, "running")))
    .limit(1);
  return exp || null;
}

export async function recordAbEvent(data: InsertAbEvent) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(abEvents).values(data);
}

export async function getAbEventStats(experimentId: number) {
  const db = await getDb(); if (!db) return [];
  const variants = await getAbVariantsByExperiment(experimentId);
  const stats = await Promise.all(variants.map(async (v) => {
    const impressions = await db.select({ count: sql<number>`count(*)` }).from(abEvents)
      .where(and(eq(abEvents.variantId, v.id), eq(abEvents.eventType, "impression")));
    const clicks = await db.select({ count: sql<number>`count(*)` }).from(abEvents)
      .where(and(eq(abEvents.variantId, v.id), eq(abEvents.eventType, "click")));
    const conversions = await db.select({ count: sql<number>`count(*)` }).from(abEvents)
      .where(and(eq(abEvents.variantId, v.id), eq(abEvents.eventType, "conversion")));
    return {
      variantId: v.id,
      variantName: v.name,
      impressions: impressions[0]?.count || 0,
      clicks: clicks[0]?.count || 0,
      conversions: conversions[0]?.count || 0,
      ctr: impressions[0]?.count ? (clicks[0]?.count || 0) / impressions[0].count : 0,
      conversionRate: clicks[0]?.count ? (conversions[0]?.count || 0) / clicks[0].count : 0,
    };
  }));
  return stats;
}

// ============================================================
// 진단 자동화 설정 DB 헬퍼
// ============================================================

export async function getDiagnosisAutomationConfig() {
  const db = await getDb(); if (!db) return null;
  const [config] = await db.select().from(diagnosisAutomationConfig).limit(1);
  return config || null;
}

export async function upsertDiagnosisAutomationConfig(data: Partial<DiagnosisAutomationConfig>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const existing = await getDiagnosisAutomationConfig();
  if (existing) {
    await db.update(diagnosisAutomationConfig).set(data as any).where(eq(diagnosisAutomationConfig.id, existing.id));
  } else {
    await db.insert(diagnosisAutomationConfig).values(data as any);
  }
}

export async function getDailyDiagnosisCount(): Promise<number> {
  const db = await getDb(); if (!db) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(seoLeads)
    .where(gte(seoLeads.createdAt, today));
  return result?.count || 0;
}

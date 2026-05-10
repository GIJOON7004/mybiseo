/**
 * db/lead.ts — lead 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import { eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray } from "drizzle-orm";
import { getDb } from "./connection";
import * as schema from "../../drizzle/schema";
import type { InsertSeoLead } from "../../drizzle/schema";

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
  await db.insert(schema.seoLeads).values({ ...data, priority });
}

export async function getSeoLeadStats() {
  const db = await getDb();
  if (!db) return { total: 0, thisMonth: 0, sources: { seo_checker: 0, seo_compare: 0 }, byStatus: { new: 0, consulting: 0, contracted: 0, lost: 0 } };
  const all = await db.select().from(schema.seoLeads);
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
  await db.update(schema.seoLeads).set(updateData).where(eq(schema.seoLeads.id, id));
}

// ─── 후속 이메일 대상 조회 (3일 후속) ───



export async function getAllSeoLeads(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  // 우선순위 높은 순 → 최신순 정렬
  return db.select().from(schema.seoLeads).orderBy(desc(schema.seoLeads.priority), desc(schema.seoLeads.createdAt)).limit(limit);
}


export async function getLeadsForFollowup3d() {
  const db = await getDb();
  if (!db) return [];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  return db.select().from(schema.seoLeads).where(
    and(
      eq(schema.seoLeads.followup3dSent, 0),
      lte(schema.seoLeads.createdAt, threeDaysAgo),
      gte(schema.seoLeads.createdAt, fourDaysAgo),
      ne(schema.seoLeads.status, "contracted"),
      ne(schema.seoLeads.status, "lost")
    )
  );
}

// ─── 후속 이메일 대상 조회 (7일 후속) ───


export async function getLeadsForFollowup7d() {
  const db = await getDb();
  if (!db) return [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  return db.select().from(schema.seoLeads).where(
    and(
      eq(schema.seoLeads.followup7dSent, 0),
      eq(schema.seoLeads.followup3dSent, 1),
      lte(schema.seoLeads.createdAt, sevenDaysAgo),
      gte(schema.seoLeads.createdAt, eightDaysAgo),
      ne(schema.seoLeads.status, "contracted"),
      ne(schema.seoLeads.status, "lost")
    )
  );
}

// ─── 후속 이메일 발송 플래그 업데이트 ───


export async function markFollowupSent(id: number, type: "3d" | "7d") {
  const db = await getDb();
  if (!db) return;
  if (type === "3d") {
    await db.update(schema.seoLeads).set({ followup3dSent: 1 }).where(eq(schema.seoLeads.id, id));
  } else {
    await db.update(schema.seoLeads).set({ followup7dSent: 1 }).where(eq(schema.seoLeads.id, id));
  }
}

// ─── AI 모니터링 트렌드 데이터 (주간 집계) ───


export async function getLeadFunnelStats() {
  const db = await getDb();
  if (!db) return { diagnosed: 0, emailCollected: 0, consulting: 0, contracted: 0 };
  
  const diagnosedRows = await db.select({ count: sql<number>`COUNT(DISTINCT url)` }).from(schema.diagnosisHistory);
  const diagnosed = diagnosedRows[0]?.count ?? 0;
  
  const leadRows = await db.select({
    total: sql<number>`COUNT(*)`,
    consulting: sql<number>`SUM(CASE WHEN status = 'consulting' THEN 1 ELSE 0 END)`,
    contracted: sql<number>`SUM(CASE WHEN status = 'contracted' THEN 1 ELSE 0 END)`,
  }).from(schema.seoLeads);
  
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


export async function recalculateLeadScores() {
  const db = await getDb();
  if (!db) return { updated: 0 };

  const leads = await db.select().from(schema.seoLeads);
  let updated = 0;

  for (const lead of leads) {
    let behaviorBonus = 0;

    // 1. 같은 URL의 재진단 횟수 (최대 +20)
    const [diagCount] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.diagnosisHistory)
      .where(eq(schema.diagnosisHistory.url, lead.url));
    if (diagCount.count > 1) behaviorBonus += Math.min(20, (diagCount.count - 1) * 5);

    // 2. 뉴스레터 구독 여부 (+10)
    if (lead.email) {
      const [subscriber] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(schema.newsletterSubscribers)
        .where(eq(schema.newsletterSubscribers.email, lead.email));
      if (subscriber.count > 0) behaviorBonus += 10;
    }

    // 3. 챗봇 대화에서 전환 가능성 high (+15)
    if (lead.email) {
      const [highIntent] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(schema.chatSessions)
        .where(and(
          eq(schema.chatSessions.visitorEmail, lead.email),
          eq(schema.chatSessions.insightConversionLikelihood, "high")
        ));
      if (highIntent.count > 0) behaviorBonus += 15;
    }

    // 4. 후속 이메일 발송 후 재방문 (+10)
    if (lead.followup3dSent || lead.followup7dSent) {
      const [revisit] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(schema.diagnosisHistory)
        .where(and(
          eq(schema.diagnosisHistory.url, lead.url),
          sql`${schema.diagnosisHistory.diagnosedAt} > ${lead.createdAt}`
        ));
      if (revisit.count > 0) behaviorBonus += 10;
    }

    // 기본 점수 + 행동 보너스 (최대 100)
    const basePriority = calculateLeadPriorityPublic(lead.totalScore, lead.aiScore);
    const newPriority = Math.min(100, basePriority + behaviorBonus);

    if (newPriority !== lead.priority) {
      await db.update(schema.seoLeads)
        .set({ priority: newPriority })
        .where(eq(schema.seoLeads.id, lead.id));
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

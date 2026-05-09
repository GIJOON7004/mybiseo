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


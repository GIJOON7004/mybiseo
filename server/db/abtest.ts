/**
 * db/abtest.ts — abtest 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import { eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray } from "drizzle-orm";
import { getDb } from "./connection";
import * as schema from "../../drizzle/schema";
import type { InsertAbExperiment, InsertAbVariant, InsertAbEvent, DiagnosisAutomationConfig } from "../../drizzle/schema";

export async function getAbExperiments() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.abExperiments).orderBy(desc(schema.abExperiments.createdAt));
}

export async function getAbExperimentById(id: number) {
  const db = await getDb(); if (!db) return null;
  const [exp] = await db.select().from(schema.abExperiments).where(eq(schema.abExperiments.id, id)).limit(1);
  return exp || null;
}

export async function createAbExperiment(data: InsertAbExperiment) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const [result] = await db.insert(schema.abExperiments).values(data).$returningId();
  return result;
}

export async function updateAbExperiment(id: number, data: Partial<Omit<InsertAbExperiment, "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(schema.abExperiments).set(data).where(eq(schema.abExperiments.id, id));
}

export async function getAbVariantsByExperiment(experimentId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(schema.abVariants).where(eq(schema.abVariants.experimentId, experimentId));
}

export async function createAbVariant(data: InsertAbVariant) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const [result] = await db.insert(schema.abVariants).values(data).$returningId();
  return result;
}

export async function updateAbVariant(id: number, data: Partial<Omit<InsertAbVariant, "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(schema.abVariants).set(data).where(eq(schema.abVariants.id, id));
}

export async function deleteAbVariant(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.delete(schema.abVariants).where(eq(schema.abVariants.id, id));
}

export async function recordAbEvent(data: InsertAbEvent) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(schema.abEvents).values(data);
}

export async function getAbEventStats(experimentId: number) {
  const db = await getDb(); if (!db) return [];
  const variants = await getAbVariantsByExperiment(experimentId);
  const stats = await Promise.all(variants.map(async (v) => {
    const impressions = await db.select({ count: sql<number>`count(*)` }).from(schema.abEvents)
      .where(and(eq(schema.abEvents.variantId, v.id), eq(schema.abEvents.eventType, "impression")));
    const clicks = await db.select({ count: sql<number>`count(*)` }).from(schema.abEvents)
      .where(and(eq(schema.abEvents.variantId, v.id), eq(schema.abEvents.eventType, "click")));
    const conversions = await db.select({ count: sql<number>`count(*)` }).from(schema.abEvents)
      .where(and(eq(schema.abEvents.variantId, v.id), eq(schema.abEvents.eventType, "conversion")));
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
  const [config] = await db.select().from(schema.diagnosisAutomationConfig).limit(1);
  return config || null;
}

export async function upsertDiagnosisAutomationConfig(data: Partial<DiagnosisAutomationConfig>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const existing = await getDiagnosisAutomationConfig();
  if (existing) {
    await db.update(schema.diagnosisAutomationConfig).set(data as any).where(eq(schema.diagnosisAutomationConfig.id, existing.id));
  } else {
    await db.insert(schema.diagnosisAutomationConfig).values(data as any);
  }
}



export async function getActiveExperimentForElement(targetElement: string) {
  const db = await getDb(); if (!db) return null;
  const [exp] = await db.select().from(schema.abExperiments)
    .where(and(eq(schema.abExperiments.targetElement, targetElement), eq(schema.abExperiments.status, "running")))
    .limit(1);
  return exp || null;
}

/**
 * db/interview.ts — interview 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import { eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray } from "drizzle-orm";
import { getDb } from "./connection";
import * as schema from "../../drizzle/schema";

import { createLogger } from "../lib/logger";
const logger = createLogger("db-interview");

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
  const [result] = await db.insert(schema.interviewVideos).values(data);
  return result;
}

export async function getInterviewVideos(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.interviewVideos)
    .where(eq(schema.interviewVideos.userId, userId))
    .orderBy(desc(schema.interviewVideos.createdAt));
}

export async function getInterviewVideoById(id: number, userId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.interviewVideos)
    .where(and(eq(schema.interviewVideos.id, id), eq(schema.interviewVideos.userId, userId)));
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
  await db.update(schema.interviewVideos).set(data)
    .where(and(eq(schema.interviewVideos.id, id), eq(schema.interviewVideos.userId, userId)));
}

export async function deleteInterviewVideo(id: number, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(schema.interviewVideos)
    .where(and(eq(schema.interviewVideos.id, id), eq(schema.interviewVideos.userId, userId)));
}


/* ─── 인터뷰 콘텐츠 대시보드 통계 ─── */

export async function getInterviewContentStats(userId: string) {
  const db = await getDb();
  if (!db) return { totalVideos: 0, totalBlogs: 0, totalCardnews: 0, totalShortforms: 0, recentVideos: [] };
  const videos = await db.select().from(schema.interviewVideos)
    .where(eq(schema.interviewVideos.userId, userId))
    .orderBy(desc(schema.interviewVideos.createdAt));
  let totalBlogs = 0;
  let totalCardnews = 0;
  let totalShortforms = 0;
  for (const v of videos) {
    if (v.blogContents) { try { totalBlogs += JSON.parse(v.blogContents as string).length; } catch (e) { logger.warn("[DB] Suppressed error:", e); } }
    if (v.cardnewsContents) { try { totalCardnews += JSON.parse(v.cardnewsContents as string).length; } catch (e) { logger.warn("[DB] Suppressed error:", e); } }
    if (v.shortformContents) { try { totalShortforms += JSON.parse(v.shortformContents as string).length; } catch (e) { logger.warn("[DB] Suppressed error:", e); } }
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


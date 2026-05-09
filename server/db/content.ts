/**
 * db/content.ts — Blog & Content 도메인 쿼리 헬퍼
 * db.ts에서 추출됨 (Strangler Fig 패턴)
 */
import { eq, desc, sql, and, lt, ne } from "drizzle-orm";
import {
  blogCategories, blogPosts, snsContents, chatSessions, chatMessages,
  seoKeywords, InsertSeoKeyword,
  InsertBlogCategory, InsertBlogPost, InsertSnsContent,
} from "../../drizzle/schema";
import { getDb } from "../db";


// ── Blog Category helpers ──

export async function getAllBlogCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogCategories).orderBy(blogCategories.sortOrder);
}

export async function getBlogCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBlogCategory(data: InsertBlogCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(blogCategories).values(data);
}

export async function updateBlogCategory(id: number, data: Partial<InsertBlogCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogCategories).set(data).where(eq(blogCategories.id, id));
}

export async function deleteBlogCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogCategories).where(eq(blogCategories.id, id));
}

// ── Blog Post helpers ──

export async function getAllBlogPosts(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts)
    .where(eq(blogPosts.published, "published"))
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getBlogPostsByCategory(categoryId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts)
    .where(and(eq(blogPosts.categoryId, categoryId), eq(blogPosts.published, "published")))
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementBlogPostView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(blogPosts).set({ viewCount: sql`${blogPosts.viewCount} + 1` }).where(eq(blogPosts.id, id));
}

export async function createBlogPost(data: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(blogPosts).values(data);
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function getAllBlogPostsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function getBlogPostCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.published, "published"));
  return result[0]?.count ?? 0;
}

export async function getBlogPostCountByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(blogPosts)
    .where(and(eq(blogPosts.categoryId, categoryId), eq(blogPosts.published, "published")));
  return result[0]?.count ?? 0;
}

/** 카테고리별 게시글 수를 단일 GROUP BY 쿼리로 조회 (N+1 해소) */
export async function getAllCategoriesWithPostCount() {
  const db = await getDb();
  if (!db) return [];
  const categories = await db.select().from(blogCategories).orderBy(blogCategories.sortOrder);
  const counts = await db.select({
    categoryId: blogPosts.categoryId,
    count: sql<number>`count(*)`,
  }).from(blogPosts)
    .where(eq(blogPosts.published, "published"))
    .groupBy(blogPosts.categoryId);
  const countMap = new Map(counts.map(c => [c.categoryId, c.count]));
  return categories.map(cat => ({
    ...cat,
    postCount: countMap.get(cat.id) ?? 0,
  }));
}

// ── SNS Content helpers ──

export async function createSnsContent(data: InsertSnsContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(snsContents).values(data);
}

export async function getAllSnsContents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(snsContents).orderBy(desc(snsContents.createdAt)).limit(limit);
}

export async function deleteSnsContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(snsContents).where(eq(snsContents.id, id));
}

// ── SEO Keyword helpers ──

export async function createSeoKeyword(data: InsertSeoKeyword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(seoKeywords).values(data);
}

export async function getAllSeoKeywords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seoKeywords).orderBy(desc(seoKeywords.createdAt));
}

export async function updateSeoKeyword(id: number, data: Partial<InsertSeoKeyword>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(seoKeywords).set(data).where(eq(seoKeywords.id, id));
}

export async function deleteSeoKeyword(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(seoKeywords).where(eq(seoKeywords.id, id));
}

// ── Blog Stats helpers (SEO 대시보드용) ──

export async function getBlogStats() {
  const db = await getDb();
  if (!db) return { totalPosts: 0, totalViews: 0, avgViews: 0, draftCount: 0, scheduledCount: 0 };

  const allPosts = await db.select().from(blogPosts);
  const publishedPosts = allPosts.filter(p => p.published === "published");
  const totalViews = publishedPosts.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);

  return {
    totalPosts: publishedPosts.length,
    totalViews,
    avgViews: publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0,
    draftCount: allPosts.filter(p => p.published === "draft").length,
    scheduledCount: allPosts.filter(p => p.published === "scheduled").length,
  };
}

export async function getTopBlogPosts(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts)
    .where(eq(blogPosts.published, "published"))
    .orderBy(desc(blogPosts.viewCount))
    .limit(limit);
}

export async function getCategoryStats() {
  const db = await getDb();
  if (!db) return [];
  
  const categories = await db.select().from(blogCategories).orderBy(blogCategories.sortOrder);
  const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, "published"));
  
  return categories.map(cat => {
    const catPosts = posts.filter(p => p.categoryId === cat.id);
    const totalViews = catPosts.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
    return {
      ...cat,
      postCount: catPosts.length,
      totalViews,
      avgViews: catPosts.length > 0 ? Math.round(totalViews / catPosts.length) : 0,
    };
  });
}

export async function getScheduledPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts)
    .where(eq(blogPosts.published, "scheduled"))
    .orderBy(blogPosts.scheduledAt);
}

export async function publishScheduledPosts() {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const scheduled = await db.select().from(blogPosts)
    .where(and(eq(blogPosts.published, "scheduled")));
  
  let count = 0;
  for (const post of scheduled) {
    if (post.scheduledAt && post.scheduledAt <= now) {
      await db.update(blogPosts).set({ published: "published" }).where(eq(blogPosts.id, post.id));
      count++;
    }
  }
  return count;
}

// ── Chat Session / Message helpers ──

export async function getOrCreateChatSession(sessionKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(chatSessions).where(eq(chatSessions.sessionKey, sessionKey)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(chatSessions).values({ sessionKey });
  const created = await db.select().from(chatSessions).where(eq(chatSessions.sessionKey, sessionKey)).limit(1);
  return created[0];
}


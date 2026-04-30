/**
 * blog 라우터
 * routers.ts에서 분할 — blog, blogScheduler
 */

import { invokeLLM } from "../_core/llm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getHospitalProfileByUserId } from "../db";
import { TRPCError } from "@trpc/server";
import { generateAndPublishBlogPost, generateMonthlyKeywords, getSchedulerStatus, sendWeeklyBriefingNow } from "../blog-scheduler";
import {
  createBlogCategory, createBlogPost, deleteBlogCategory, deleteBlogPost,
  getAllBlogCategories, getAllBlogPosts, getAllBlogPostsAdmin, getBlogCategoryBySlug,
  getBlogPostBySlug, getBlogPostCount, getBlogPostCountByCategory, getBlogPostsByCategory,
  getScheduledPosts, incrementBlogPostView, publishScheduledPosts, updateBlogCategory,
  updateBlogPost,
} from "../db";
import { z } from "zod";
import { BLOG_GENERATOR_PROMPT, formatBlogContent } from "./_shared";

export const blogRouter = router({
  categories: publicProcedure.query(async () => {
    const categories = await getAllBlogCategories();
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        postCount: await getBlogPostCountByCategory(cat.id),
      }))
    );
    return categoriesWithCount;
  }),

  categoryBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const category = await getBlogCategoryBySlug(input.slug);
      if (!category) return null;
      const posts = await getBlogPostsByCategory(category.id);
      return { ...category, posts };
    }),

  posts: publicProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const posts = await getAllBlogPosts(input?.limit ?? 50, input?.offset ?? 0);
      const total = await getBlogPostCount();
      return { posts, total };
    }),

  postBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const post = await getBlogPostBySlug(input.slug);
      if (!post) return null;
      await incrementBlogPostView(post.id);
      const category = post.categoryId
        ? await getAllBlogCategories().then(cats => cats.find(c => c.id === post.categoryId))
        : null;
      return { ...post, category };
    }),

  // Admin endpoints (병원 등록한 사용자면 접근 가능)
  adminList: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다. 내 병원 페이지에서 병원 정보를 먼저 등록해 주세요." });
    const posts = await getAllBlogPostsAdmin();
    const categories = await getAllBlogCategories();
    return { posts, categories };
  }),

  adminCreatePost: protectedProcedure
    .input(z.object({
      categoryId: z.number(),
      title: z.string().min(1),
      slug: z.string().min(1),
      excerpt: z.string().min(1),
      content: z.string().min(1),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      tags: z.string().optional(),
      readingTime: z.number().optional(),
      published: z.enum(["draft", "published", "scheduled"]).optional(),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      await createBlogPost(input);
      return { success: true } as const;
    }),

  adminUpdatePost: protectedProcedure
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      title: z.string().optional(),
      slug: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      tags: z.string().optional(),
      readingTime: z.number().optional(),
      published: z.enum(["draft", "published", "scheduled"]).optional(),
      scheduledAt: z.date().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      const { id, ...data } = input;
      await updateBlogPost(id, data);
      return { success: true } as const;
    }),

  adminDeletePost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      await deleteBlogPost(input.id);
      return { success: true } as const;
    }),

  adminCreateCategory: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      await createBlogCategory(input);
      return { success: true } as const;
    }),

  adminUpdateCategory: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      const { id, ...data } = input;
      await updateBlogCategory(id, data);
      return { success: true } as const;
    }),

  adminDeleteCategory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      await deleteBlogCategory(input.id);
      return { success: true } as const;
    }),

  // ── 기능 1: SEO 블로그 자동 생성 ──
  aiGenerate: protectedProcedure
    .input(z.object({
      keyword: z.string().min(1),
      categoryId: z.number(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      const categoryList = await getAllBlogCategories();
      const category = categoryList.find(c => c.id === input.categoryId);
      const categoryName = category?.name ?? "일반";

      const userMessage = `키워드: "${input.keyword}"
카테고리: "${categoryName}"
${input.additionalContext ? `추가 맥락: ${input.additionalContext}` : ""}

위 키워드와 카테고리에 맞는 AEO/GEO 최적화 블로그 글을 작성해주세요. AI 검색엔진이 답변에 인용할 수 있는 구조로 작성해주세요.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: BLOG_GENERATOR_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "blog_post",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                slug: { type: "string" },
                excerpt: { type: "string" },
                content: { type: "string" },
                metaTitle: { type: "string" },
                metaDescription: { type: "string" },
                tags: { type: "string" },
                readingTime: { type: "integer" },
              },
              required: ["title", "slug", "excerpt", "content", "metaTitle", "metaDescription", "tags", "readingTime"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");

      // 초안 상태로 저장
      await createBlogPost({
        categoryId: input.categoryId,
        title: parsed.title,
        slug: parsed.slug + "-" + Date.now().toString(36),
        excerpt: parsed.excerpt,
        content: formatBlogContent(parsed.content),
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        tags: parsed.tags,
        readingTime: parsed.readingTime || 5,
        published: "draft",
      });

      return { success: true, post: { ...parsed, content: formatBlogContent(parsed.content) } } as const;
    }),

  // 키워드 추천
  suggestKeywords: protectedProcedure
    .input(z.object({ categoryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
      const categoryList = await getAllBlogCategories();
      const category = categoryList.find(c => c.id === input.categoryId);
      const categoryName = category?.name ?? "일반";

      const result = await invokeLLM({
        messages: [
          { role: "system", content: "당신은 AEO/GEO 관점의 키워드 전문가입니다. AI 검색엔진(ChatGPT, Gemini, Claude, Perplexity)이 답변에 인용할 수 있는 콘텐츠를 만들기 위한 키워드를 추천합니다. 환자가 AI에게 질문할 법한 자연어 키워드 위주로 추천하세요. 반드시 JSON 배열 형식으로 응답하세요." },
          { role: "user", content: `"${categoryName}" 카테고리에 적합한 AEO/GEO 블로그 키워드 10개를 추천해주세요. 환자가 AI 검색엔진에 질문할 법한 자연어 키워드 위주로, AI가 답변에 인용할 수 있는 콘텐츠를 만들기 좋은 키워드를 추천해주세요. 형식: {"keywords": ["키워드1", "키워드2", ...]}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "keyword_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                keywords: { type: "array", items: { type: "string" } },
              },
              required: ["keywords"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : '{"keywords":[]}');
      return { keywords: parsed.keywords as string[] };
    }),

  // 예약 발행 처리
  publishScheduled: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
    const count = await publishScheduledPosts();
    return { published: count };
  }),

  // 예약 글 목록
  scheduledList: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
    return getScheduledPosts();
  }),
});

export const blogSchedulerRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
    return getSchedulerStatus();
  }),

  runNow: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
    const result = await generateAndPublishBlogPost();
    return result;
  }),

  generateKeywords: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
    const result = await generateMonthlyKeywords();
    return result;
  }),

  sendBriefingNow: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "병원 등록이 필요합니다." });
    const result = await sendWeeklyBriefingNow();
    return result;
  }),
});

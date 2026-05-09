import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getAllBlogCategories: vi.fn().mockResolvedValue([
      { id: 1, slug: "beauty-salon", name: "미용실 · 네일샵", description: "미용실 AI 자동화 가이드", metaTitle: null, metaDescription: null, createdAt: new Date() },
      { id: 2, slug: "clinic", name: "병원 · 의원", description: "병원 AI 자동화 가이드", metaTitle: null, metaDescription: null, createdAt: new Date() },
    ]),
    getBlogCategoryBySlug: vi.fn().mockImplementation(async (slug: string) => {
      if (slug === "beauty-salon") {
        return { id: 1, slug: "beauty-salon", name: "미용실 · 네일샵", description: "미용실 AI 자동화 가이드", metaTitle: null, metaDescription: null, createdAt: new Date() };
      }
      throw new Error("Category not found");
    }),
    getBlogPostsByCategory: vi.fn().mockResolvedValue([
      { id: 1, slug: "test-post-1", title: "테스트 글 1", excerpt: "테스트 발췌", content: "테스트 내용", tags: "AI,미용실", readingTime: 5, viewCount: 10, categoryId: 1, createdAt: new Date(), updatedAt: new Date() },
    ]),
    getAllBlogPosts: vi.fn().mockResolvedValue([
      { id: 1, slug: "test-post-1", title: "테스트 글 1", excerpt: "테스트 발췌", content: "테스트 내용", tags: "AI,미용실", readingTime: 5, viewCount: 10, categoryId: 1, category: { slug: "beauty-salon", name: "미용실 · 네일샵" }, createdAt: new Date(), updatedAt: new Date() },
    ]),
    getBlogPostCount: vi.fn().mockResolvedValue(1),
    getBlogPostCountByCategory: vi.fn().mockResolvedValue(1),
    getAllCategoriesWithPostCount: vi.fn().mockResolvedValue([
      { id: 1, slug: "beauty-salon", name: "미용실 · 네일샵", description: "미용실 AI 자동화 가이드", metaTitle: null, metaDescription: null, createdAt: new Date(), postCount: 1 },
      { id: 2, slug: "clinic", name: "병원 · 의원", description: "병원 AI 자동화 가이드", metaTitle: null, metaDescription: null, createdAt: new Date(), postCount: 0 },
    ]),
    getBlogPostBySlug: vi.fn().mockImplementation(async (slug: string) => {
      if (slug === "test-post-1") {
        return { id: 1, slug: "test-post-1", title: "테스트 글 1", excerpt: "테스트 발췌", content: "테스트 내용", tags: "AI,미용실", readingTime: 5, viewCount: 10, categoryId: 1, metaTitle: null, metaDescription: null, createdAt: new Date(), updatedAt: new Date() };
      }
      throw new Error("Post not found");
    }),
    incrementBlogPostView: vi.fn().mockResolvedValue(undefined),
    getAllBlogPostsAdmin: vi.fn().mockResolvedValue([
      { id: 1, slug: "test-post-1", title: "테스트 글 1", excerpt: "테스트 발췌", categoryId: 1, viewCount: 10, createdAt: new Date(), updatedAt: new Date() },
    ]),
    createBlogPost: vi.fn().mockResolvedValue(undefined),
    updateBlogPost: vi.fn().mockResolvedValue(undefined),
    deleteBlogPost: vi.fn().mockResolvedValue(undefined),
    createBlogCategory: vi.fn().mockResolvedValue(undefined),
    updateBlogCategory: vi.fn().mockResolvedValue(undefined),
    deleteBlogCategory: vi.fn().mockResolvedValue(undefined),
    getHospitalProfileByUserId: vi.fn().mockImplementation(async (userId: number) => userId === 1 ? { id: 1, userId: 1, hospitalName: "테스트병원", specialty: "성형외과" } : null),
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "normal-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("blog public procedures", () => {
  it("lists all categories with post counts", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const categories = await caller.blog.categories();
    expect(categories).toHaveLength(2);
    expect(categories[0]).toHaveProperty("slug", "beauty-salon");
    expect(categories[0]).toHaveProperty("postCount");
  });

  it("gets a category by slug with posts", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.blog.categoryBySlug({ slug: "beauty-salon" });
    expect(result.name).toBe("미용실 · 네일샵");
    expect(result.posts).toBeDefined();
    expect(Array.isArray(result.posts)).toBe(true);
  });

  it("lists all blog posts with pagination", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.blog.posts({});
    expect(result.posts).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("gets a post by slug and increments view count", async () => {
    const { incrementBlogPostView } = await import("./db");
    const caller = appRouter.createCaller(createPublicContext());
    const post = await caller.blog.postBySlug({ slug: "test-post-1" });
    expect(post.title).toBe("테스트 글 1");
    expect(incrementBlogPostView).toHaveBeenCalledWith(1);
  });

  it("throws error for non-existent post", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.blog.postBySlug({ slug: "non-existent" })).rejects.toThrow();
  });

  it("throws error for non-existent category", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.blog.categoryBySlug({ slug: "non-existent" })).rejects.toThrow();
  });
});

describe("blog admin procedures", () => {
  it("admin can list all posts for management", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blog.adminList();
    expect(result.posts).toHaveLength(1);
    expect(result.categories).toHaveLength(2);
  });

  it("admin can create a blog post", async () => {
    const { createBlogPost } = await import("./db");
    const caller = appRouter.createCaller(createAdminContext());
    await caller.blog.adminCreatePost({
      title: "새 글",
      slug: "new-post",
      excerpt: "새 글 발취",
      content: "새 글 내용",
      categoryId: 1,
      readingTime: 3,
    });
    expect(createBlogPost).toHaveBeenCalled();
  });

  it("admin can delete a blog post", async () => {
    const { deleteBlogPost } = await import("./db");
    const caller = appRouter.createCaller(createAdminContext());
    await caller.blog.adminDeletePost({ id: 1 });
    expect(deleteBlogPost).toHaveBeenCalledWith(1);
  });

  it("non-admin cannot access admin blog list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.blog.adminList()).rejects.toThrow();
  });

  it("non-admin cannot create blog posts", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.blog.adminCreatePost({
        title: "새 글",
        slug: "new-post",
        excerpt: "새 글 발취",
        content: "새 글 내용",
        categoryId: 1,
        readingTime: 3,
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot access admin blog", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.blog.adminList()).rejects.toThrow();
  });
});

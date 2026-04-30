import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB helpers ──
const mockPosts = [
  {
    id: 1,
    categoryId: 1,
    title: "테스트 글 1",
    slug: "test-post-1",
    excerpt: "테스트 요약",
    content: "# 테스트 본문",
    metaTitle: "테스트 메타",
    metaDescription: "테스트 설명",
    tags: "테스트,AI",
    readingTime: 5,
    viewCount: 10,
    published: "published" as const,
    scheduledAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: 2,
    categoryId: 1,
    title: "초안 글",
    slug: "draft-post",
    excerpt: "초안 요약",
    content: "# 초안 본문",
    metaTitle: null,
    metaDescription: null,
    tags: null,
    readingTime: 3,
    viewCount: 0,
    published: "draft" as const,
    scheduledAt: null,
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
];

const mockCategories = [
  {
    id: 1,
    name: "뷰티/에스테틱",
    slug: "beauty",
    description: "뷰티 관련 글",
    metaTitle: null,
    metaDescription: null,
    sortOrder: 0,
    createdAt: new Date("2025-01-01"),
  },
];

// 병원 프로필 mock — 기본적으로 등록된 상태
const mockHospitalProfile = {
  id: 1,
  userId: 1,
  hospitalName: "테스트치과",
  hospitalUrl: "https://test-dental.com",
  specialty: "치과",
  region: "서울 강남",
  phone: "010-1234-5678",
  plan: "free",
  isActive: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("./db", () => ({
  getAllBlogPostsAdmin: vi.fn(() => Promise.resolve(mockPosts)),
  getAllBlogCategories: vi.fn(() => Promise.resolve(mockCategories)),
  createBlogPost: vi.fn(() => Promise.resolve()),
  updateBlogPost: vi.fn(() => Promise.resolve()),
  deleteBlogPost: vi.fn(() => Promise.resolve()),
  createBlogCategory: vi.fn(() => Promise.resolve()),
  updateBlogCategory: vi.fn(() => Promise.resolve()),
  deleteBlogCategory: vi.fn(() => Promise.resolve()),
  getBlogPostCountByCategory: vi.fn(() => Promise.resolve(5)),
  getHospitalProfileByUserId: vi.fn(() => Promise.resolve(mockHospitalProfile)),
  // Other db helpers needed by router
  getAllBlogPosts: vi.fn(() => Promise.resolve([])),
  getBlogPostsByCategory: vi.fn(() => Promise.resolve([])),
  getBlogPostBySlug: vi.fn(() => Promise.resolve(null)),
  getBlogCategoryBySlug: vi.fn(() => Promise.resolve(null)),
  incrementBlogPostView: vi.fn(() => Promise.resolve()),
  getBlogPostCount: vi.fn(() => Promise.resolve(0)),
  createInquiry: vi.fn(() => Promise.resolve()),
  getAllInquiries: vi.fn(() => Promise.resolve([])),
  updateInquiryStatus: vi.fn(() => Promise.resolve()),
  deleteInquiry: vi.fn(() => Promise.resolve()),
  getInquiryStats: vi.fn(() => Promise.resolve({ total: 0, new: 0, contacted: 0, completed: 0, todayNew: 0, weekNew: 0 })),
  createSnsContent: vi.fn(() => Promise.resolve()),
  getAllSnsContents: vi.fn(() => Promise.resolve([])),
  deleteSnsContent: vi.fn(() => Promise.resolve()),
  createSeoKeyword: vi.fn(() => Promise.resolve()),
  getAllSeoKeywords: vi.fn(() => Promise.resolve([])),
  updateSeoKeyword: vi.fn(() => Promise.resolve()),
  deleteSeoKeyword: vi.fn(() => Promise.resolve()),
  getBlogStats: vi.fn(() => Promise.resolve({ totalPosts: 0, totalViews: 0, avgViews: 0, draftCount: 0, scheduledCount: 0 })),
  getTopBlogPosts: vi.fn(() => Promise.resolve([])),
  getCategoryStats: vi.fn(() => Promise.resolve([])),
  getScheduledPosts: vi.fn(() => Promise.resolve([])),
  publishScheduledPosts: vi.fn(() => Promise.resolve(0)),
}));

vi.mock("./notifier", () => ({
  sendInquiryNotification: vi.fn(() => Promise.resolve()),
  getNotificationChannelStatus: vi.fn(() => []),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(() =>
    Promise.resolve({
      choices: [{ message: { content: JSON.stringify({ title: "t", slug: "s", excerpt: "e", content: "c", metaTitle: "mt", metaDescription: "md", tags: "t1", readingTime: 5 }) } }],
    })
  ),
}));

import { appRouter } from "./routers";
import { getHospitalProfileByUserId } from "./db";

function createTestCaller(role: "admin" | "user" | null) {
  return appRouter.createCaller({
    user: role
      ? { id: 1, openId: "test", name: "Test", email: "test@test.com", role, loginMethod: "email", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
      : null,
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

describe("Admin Blog Management (병원 등록 기반 권한)", () => {
  const adminCaller = createTestCaller("admin");
  const userCaller = createTestCaller("user");
  const anonCaller = createTestCaller(null);

  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: 병원 프로필 등록된 상태
    vi.mocked(getHospitalProfileByUserId).mockResolvedValue(mockHospitalProfile as any);
  });

  describe("blog.adminList", () => {
    it("병원 등록한 사용자는 목록을 조회할 수 있다", async () => {
      const result = await userCaller.blog.adminList();
      expect(result.posts).toHaveLength(2);
      expect(result.categories).toHaveLength(1);
      expect(result.posts[0].title).toBe("테스트 글 1");
    });

    it("병원 미등록 사용자는 접근할 수 없다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValue(null);
      await expect(userCaller.blog.adminList()).rejects.toThrow("병원 등록이 필요합니다");
    });

    it("비로그인 사용자는 접근할 수 없다", async () => {
      await expect(anonCaller.blog.adminList()).rejects.toThrow();
    });
  });

  describe("blog.adminCreatePost", () => {
    it("병원 등록한 사용자는 글을 생성할 수 있다", async () => {
      const { createBlogPost } = await import("./db");
      const result = await userCaller.blog.adminCreatePost({
        categoryId: 1,
        title: "새 글",
        slug: "new-post",
        excerpt: "새 글 요약",
        content: "# 새 글 본문",
        metaTitle: "새 글 메타",
        tags: "새글,테스트",
        readingTime: 4,
        published: "draft",
      });
      expect(result.success).toBe(true);
      expect(createBlogPost).toHaveBeenCalledOnce();
    });

    it("병원 미등록 사용자는 글을 생성할 수 없다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValue(null);
      await expect(
        userCaller.blog.adminCreatePost({
          categoryId: 1,
          title: "새 글",
          slug: "new-post",
          excerpt: "새 글 요약",
          content: "# 새 글 본문",
        })
      ).rejects.toThrow("병원 등록이 필요합니다");
    });
  });

  describe("blog.adminUpdatePost (발행 포함)", () => {
    it("병원 등록한 사용자는 글을 수정/발행할 수 있다", async () => {
      const { updateBlogPost } = await import("./db");
      const result = await userCaller.blog.adminUpdatePost({
        id: 1,
        title: "수정된 제목",
        published: "published",
      });
      expect(result.success).toBe(true);
      expect(updateBlogPost).toHaveBeenCalledWith(1, {
        title: "수정된 제목",
        published: "published",
      });
    });

    it("병원 미등록 사용자는 글을 수정/발행할 수 없다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValue(null);
      await expect(
        userCaller.blog.adminUpdatePost({ id: 1, published: "published" })
      ).rejects.toThrow("병원 등록이 필요합니다");
    });
  });

  describe("blog.adminDeletePost", () => {
    it("병원 등록한 사용자는 글을 삭제할 수 있다", async () => {
      const { deleteBlogPost } = await import("./db");
      const result = await userCaller.blog.adminDeletePost({ id: 1 });
      expect(result.success).toBe(true);
      expect(deleteBlogPost).toHaveBeenCalledWith(1);
    });

    it("병원 미등록 사용자는 글을 삭제할 수 없다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValue(null);
      await expect(
        userCaller.blog.adminDeletePost({ id: 1 })
      ).rejects.toThrow("병원 등록이 필요합니다");
    });
  });

  describe("blog.adminCreateCategory", () => {
    it("병원 등록한 사용자는 카테고리를 생성할 수 있다", async () => {
      const { createBlogCategory } = await import("./db");
      const result = await userCaller.blog.adminCreateCategory({
        name: "새 카테고리",
        slug: "new-category",
        description: "설명",
        sortOrder: 1,
      });
      expect(result.success).toBe(true);
      expect(createBlogCategory).toHaveBeenCalledOnce();
    });

    it("병원 미등록 사용자는 카테고리를 생성할 수 없다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValue(null);
      await expect(
        userCaller.blog.adminCreateCategory({
          name: "새 카테고리",
          slug: "new-category",
        })
      ).rejects.toThrow("병원 등록이 필요합니다");
    });
  });

  describe("blog.adminUpdateCategory", () => {
    it("병원 등록한 사용자는 카테고리를 수정할 수 있다", async () => {
      const { updateBlogCategory } = await import("./db");
      const result = await userCaller.blog.adminUpdateCategory({
        id: 1,
        name: "수정된 카테고리",
      });
      expect(result.success).toBe(true);
      expect(updateBlogCategory).toHaveBeenCalledWith(1, {
        name: "수정된 카테고리",
      });
    });
  });

  describe("blog.adminDeleteCategory", () => {
    it("병원 등록한 사용자는 카테고리를 삭제할 수 있다", async () => {
      const { deleteBlogCategory } = await import("./db");
      const result = await userCaller.blog.adminDeleteCategory({ id: 1 });
      expect(result.success).toBe(true);
      expect(deleteBlogCategory).toHaveBeenCalledWith(1);
    });
  });
});

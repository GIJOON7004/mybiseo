import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          title: "테스트 블로그 제목",
          slug: "test-blog-slug",
          excerpt: "테스트 요약입니다",
          content: "# 테스트 본문\n\n이것은 테스트 블로그 글입니다.",
          metaTitle: "테스트 메타 타이틀",
          metaDescription: "테스트 메타 디스크립션",
          tags: "테스트, AI, 자동화",
          readingTime: 5,
        }),
      },
    }],
  }),
}));

// Mock DB module for tests without real database
vi.mock("./db", () => {
  const _mockBlogPosts: any[] = [];
  const _mockSeoKeywords: any[] = [];
  const _mockBlogCategories: any[] = [
    { id: 1, name: "치과", slug: "dental", description: "치과 마케팅", postCount: 0 },
    { id: 2, name: "피부과", slug: "dermatology", description: "피부과 마케팅", postCount: 0 },
  ];
  let _blogPostIdCounter = 1;
  let _seoKeywordIdCounter = 1;

  return {
    getDb: vi.fn().mockResolvedValue({}),
    // Blog
    createBlogPost: vi.fn().mockImplementation(async (data: any) => {
      const post = {
        id: _blogPostIdCounter++,
        ...data,
        views: 0,
        status: data.status || "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      _mockBlogPosts.push(post);
      return post;
    }),
    getAllBlogPosts: vi.fn().mockImplementation(async () => _mockBlogPosts),
    getBlogPostsByCategory: vi.fn().mockResolvedValue([]),
    getBlogPostBySlug: vi.fn().mockImplementation(async (slug: string) => {
      return _mockBlogPosts.find((p: any) => p.slug === slug) || null;
    }),
    getAllBlogPostsAdmin: vi.fn().mockImplementation(async () => _mockBlogPosts),
    getBlogPostCount: vi.fn().mockResolvedValue(0),
    getBlogPostCountByCategory: vi.fn().mockResolvedValue(0),
    getAllCategoriesWithPostCount: vi.fn().mockResolvedValue([
      { id: 1, name: "치과", slug: "dental", description: "치과 마케팅", postCount: 0 },
      { id: 2, name: "피부과", slug: "dermatology", description: "피부과 마케팅", postCount: 0 },
    ]),
    incrementBlogPostView: vi.fn().mockResolvedValue(undefined),
    updateBlogPost: vi.fn().mockResolvedValue(undefined),
    deleteBlogPost: vi.fn().mockResolvedValue(undefined),
    // Blog categories
    getAllBlogCategories: vi.fn().mockResolvedValue(_mockBlogCategories),
    getBlogCategoryBySlug: vi.fn().mockImplementation(async (slug: string) => {
      return _mockBlogCategories.find((c: any) => c.slug === slug) || null;
    }),
    createBlogCategory: vi.fn().mockResolvedValue({ id: 3, name: "test", slug: "test" }),
    updateBlogCategory: vi.fn().mockResolvedValue(undefined),
    deleteBlogCategory: vi.fn().mockResolvedValue(undefined),
    // SEO Keywords
    createSeoKeyword: vi.fn().mockImplementation(async (data: any) => {
      const kw = { id: _seoKeywordIdCounter++, ...data, createdAt: new Date() };
      _mockSeoKeywords.push(kw);
      return kw;
    }),
    getAllSeoKeywords: vi.fn().mockResolvedValue([]),
    updateSeoKeyword: vi.fn().mockResolvedValue(undefined),
    deleteSeoKeyword: vi.fn().mockResolvedValue(undefined),
    // SNS
    getAllSnsContents: vi.fn().mockResolvedValue([]),
    createSnsContent: vi.fn().mockImplementation(async (data: any) => {
      return { id: 1, ...data, createdAt: new Date() };
    }),
    deleteSnsContent: vi.fn().mockResolvedValue(undefined),
    // SEO Dashboard
    getBlogStats: vi.fn().mockResolvedValue({
      totalPosts: 0,
      totalViews: 0,
      avgViews: 0,
      draftCount: 0,
      scheduledCount: 0,
    }),
    getTopBlogPosts: vi.fn().mockResolvedValue([]),
    getCategoryStats: vi.fn().mockResolvedValue([]),
    getScheduledPosts: vi.fn().mockResolvedValue([]),
    publishScheduledPosts: vi.fn().mockResolvedValue({ published: 0 }),
    // Inquiry
    createInquiry: vi.fn().mockResolvedValue({ id: 1 }),
    getAllInquiries: vi.fn().mockResolvedValue([]),
    updateInquiryStatus: vi.fn().mockResolvedValue(undefined),
    deleteInquiry: vi.fn().mockResolvedValue(undefined),
    getInquiryStats: vi.fn().mockResolvedValue({ total: 0, pending: 0, responded: 0 }),
    // Chat
    getOrCreateChatSession: vi.fn().mockResolvedValue({ id: 1, sessionKey: "test", messageCount: 0 }),
    saveChatMessage: vi.fn().mockResolvedValue(undefined),
    updateChatSessionVisitor: vi.fn().mockResolvedValue(undefined),
    getAllChatSessions: vi.fn().mockResolvedValue([]),
    getChatSessionById: vi.fn().mockResolvedValue(undefined),
    getChatMessagesBySession: vi.fn().mockResolvedValue([]),
    deleteChatSession: vi.fn().mockResolvedValue(undefined),
    getChatStats: vi.fn().mockResolvedValue({ totalSessions: 0, totalMessages: 0, withInquiry: 0, todaySessions: 0 }),
    findChatSessionByPhone: vi.fn().mockResolvedValue(null),
    // AI Monitor
    createAiMonitorKeyword: vi.fn().mockResolvedValue(undefined),
    getAiMonitorKeywords: vi.fn().mockResolvedValue([]),
    toggleAiMonitorKeyword: vi.fn().mockResolvedValue(undefined),
    deleteAiMonitorKeyword: vi.fn().mockResolvedValue(undefined),
    createAiMonitorResult: vi.fn().mockResolvedValue(undefined),
    getAiMonitorResults: vi.fn().mockResolvedValue([]),
    getAiMonitorStats: vi.fn().mockResolvedValue({ totalKeywords: 0, totalResults: 0 }),
    // SEO Leads
    createSeoLead: vi.fn().mockResolvedValue(undefined),
    getAllSeoLeads: vi.fn().mockResolvedValue([]),
    getSeoLeadStats: vi.fn().mockResolvedValue({ total: 0, new: 0, consulting: 0, contracted: 0 }),
    updateSeoLeadStatus: vi.fn().mockResolvedValue(undefined),
    // AI Monitor Trend
    getAiMonitorTrend: vi.fn().mockResolvedValue([]),
    getAiMonitorKeywordTrend: vi.fn().mockResolvedValue([]),
    // Diagnosis
    saveDiagnosisHistory: vi.fn().mockResolvedValue(undefined),
    getDiagnosisHistoryByUrl: vi.fn().mockResolvedValue([]),
    getRecentDiagnoses: vi.fn().mockResolvedValue([]),
    getDiagnosisStats: vi.fn().mockResolvedValue({ total: 0 }),
    getDailyDiagnosisCounts: vi.fn().mockResolvedValue([]),
    getScoreDistribution: vi.fn().mockResolvedValue([]),
    getTopDiagnosedUrls: vi.fn().mockResolvedValue([]),
    getSpecialtyStats: vi.fn().mockResolvedValue([]),
    getRegionStats: vi.fn().mockResolvedValue([]),
    // Newsletter
    subscribeNewsletter: vi.fn().mockResolvedValue(undefined),
    unsubscribeNewsletter: vi.fn().mockResolvedValue(undefined),
    getActiveSubscribers: vi.fn().mockResolvedValue([]),
    getSubscriberCount: vi.fn().mockResolvedValue(0),
    // Benchmark
    saveBenchmarkData: vi.fn().mockResolvedValue(undefined),
    getBenchmarkBySpecialty: vi.fn().mockResolvedValue([]),
    getBenchmarkByRegion: vi.fn().mockResolvedValue([]),
    getLatestBenchmarks: vi.fn().mockResolvedValue([]),
    // Awards
    saveMonthlyAward: vi.fn().mockResolvedValue(undefined),
    getMonthlyAwards: vi.fn().mockResolvedValue([]),
    getLeadFunnelStats: vi.fn().mockResolvedValue({ total: 0 }),
    // Hospital
    createHospitalProfile: vi.fn().mockResolvedValue(undefined),
    getHospitalProfileByUserId: vi.fn().mockImplementation(async (userId: number) => userId === 1 ? { id: 1, userId: 1, hospitalName: "테스트병원", specialty: "성형외과" } : null),
    updateHospitalProfile: vi.fn().mockResolvedValue(undefined),
    getHospitalDashboardData: vi.fn().mockResolvedValue(null),
    getAllHospitalProfiles: vi.fn().mockResolvedValue([]),
    // AI Monitor Competitors
    addAiMonitorCompetitor: vi.fn().mockResolvedValue(undefined),
    getAiMonitorCompetitors: vi.fn().mockResolvedValue([]),
    deleteAiMonitorCompetitor: vi.fn().mockResolvedValue(undefined),
    // AI Exposure
    getAiExposureScores: vi.fn().mockResolvedValue([]),
    getLatestAiExposureScores: vi.fn().mockResolvedValue([]),
    getAiMonitorStatsEnhanced: vi.fn().mockResolvedValue({}),
    // AI Reports
    saveAiImprovementReport: vi.fn().mockResolvedValue(undefined),
    getAiImprovementReports: vi.fn().mockResolvedValue([]),
    getAiImprovementReportById: vi.fn().mockResolvedValue(null),
    // User Events
    recordUserEvent: vi.fn().mockResolvedValue(undefined),
    getUserEventStats: vi.fn().mockResolvedValue([]),
    // Seasonal Calendar
    getSeasonalCalendar: vi.fn().mockResolvedValue([]),
    getSeasonalCalendarBySpecialty: vi.fn().mockResolvedValue([]),
    upsertSeasonalCalendar: vi.fn().mockResolvedValue(undefined),
    // Lead scoring
    recalculateLeadPriority: vi.fn().mockResolvedValue(undefined),
    // Batch diagnosis
    batchDiagnosis: vi.fn().mockResolvedValue({ success: 0, failed: 0 }),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@mybiseo.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Content Automation Features", () => {
  // ── 기능 1: SEO 블로그 자동 생성 ──
  describe("Feature 1: Blog AI Generation", () => {
    it("blog.aiGenerate requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.blog.aiGenerate({ keyword: "테스트", categoryId: 1 })
      ).rejects.toThrow();
    });

    it("blog.aiGenerate creates a draft post on success", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.blog.aiGenerate({
        keyword: "미용실 예약 자동화",
        categoryId: 1,
      });
      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
      expect(result.post.title).toBe("테스트 블로그 제목");
      expect(result.post.slug).toBe("test-blog-slug");
      expect(result.post.content).toContain("테스트 블로그 글");
    });

    it("blog.suggestKeywords requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.blog.suggestKeywords({ categoryId: 1 })
      ).rejects.toThrow();
    });
  });

  // ── 기능 2: SNS 콘텐츠 자동 생성 ──
  describe("Feature 2: SNS Content Generation", () => {
    it("sns.generateCaption requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.sns.generateCaption({ industry: "네일샵", topic: "봄 네일" })
      ).rejects.toThrow();
    });

    it("sns.generatePromotion requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.sns.generatePromotion({ industry: "피부과", promotionDetail: "할인" })
      ).rejects.toThrow();
    });

    it("sns.generateGuide requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.sns.generateGuide({ industry: "학원" })
      ).rejects.toThrow();
    });

    it("sns.history requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.sns.history()).rejects.toThrow();
    });
  });

  // ── 기능 3: 자동 발행 스케줄러 ──
  describe("Feature 3: Auto-publish Scheduler", () => {
    it("seoKeyword.list requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.seoKeyword.list()).rejects.toThrow();
    });

    it("seoKeyword.create requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.seoKeyword.create({ keyword: "테스트", categoryId: 1 })
      ).rejects.toThrow();
    });

    it("seoKeyword.create succeeds for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.seoKeyword.create({
        keyword: "자동화 테스트 키워드",
        categoryId: 1,
      });
      expect(result.success).toBe(true);
    });

    it("seoKeyword.list returns keywords for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const keywords = await caller.seoKeyword.list();
      expect(Array.isArray(keywords)).toBe(true);
    });

    it("blog.publishScheduled requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.blog.publishScheduled()).rejects.toThrow();
    });
  });

  // ── 기능 4: SEO 대시보드 ──
  describe("Feature 4: SEO Dashboard", () => {
    it("seoDashboard.stats requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.seoDashboard.stats()).rejects.toThrow();
    });

    it("seoDashboard.stats returns valid stats for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const stats = await caller.seoDashboard.stats();
      expect(stats).toHaveProperty("totalPosts");
      expect(stats).toHaveProperty("totalViews");
      expect(stats).toHaveProperty("avgViews");
      expect(stats).toHaveProperty("draftCount");
      expect(stats).toHaveProperty("scheduledCount");
      expect(typeof stats.totalPosts).toBe("number");
      expect(typeof stats.totalViews).toBe("number");
    });

    it("seoDashboard.topPosts requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.seoDashboard.topPosts()).rejects.toThrow();
    });

    it("seoDashboard.topPosts returns array for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const topPosts = await caller.seoDashboard.topPosts();
      expect(Array.isArray(topPosts)).toBe(true);
    });

    it("seoDashboard.categoryStats requires admin auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.seoDashboard.categoryStats()).rejects.toThrow();
    });

    it("seoDashboard.inquiryConversion returns conversion data for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const conversion = await caller.seoDashboard.inquiryConversion();
      expect(conversion).toHaveProperty("totalViews");
      expect(conversion).toHaveProperty("totalInquiries");
      expect(conversion).toHaveProperty("conversionRate");
    });
  });

  // ── 공통: 블로그 공개 API ──
  describe("Blog Public API", () => {
    it("blog.categories is publicly accessible", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const categories = await caller.blog.categories();
      expect(Array.isArray(categories)).toBe(true);
    });

    it("blog.posts is publicly accessible", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.blog.posts();
      expect(result).toHaveProperty("posts");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.posts)).toBe(true);
    });
  });
});

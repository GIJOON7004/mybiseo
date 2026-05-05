import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          title: "2026년 쌍꺼풀 수술 비용 총정리 — 매몰법 vs 절개법",
          slug: "double-eyelid-surgery-cost-2026",
          excerpt: "쌍꺼풀 수술을 고민하고 계신가요? 매몰법과 절개법의 비용, 장단점, 회복 기간을 한눈에 비교해 드립니다.",
          content: "## 쌍꺼풀 수술, 어떤 방법이 나에게 맞을까?\n\n쌍꺼풀 수술을 고민하는 분들이 가장 먼저 궁금해하는 것은 비용과 방법입니다.\n\n## 매몰법 vs 절개법 비용 비교\n\n매몰법은 일반적으로 50~100만원 선이며, 절개법은 100~200만원 선입니다.\n\n## 회복 기간과 주의사항\n\n매몰법은 3~7일, 절개법은 7~14일 정도의 회복 기간이 필요합니다.\n\n## 병원 선택 시 체크리스트\n\n1. 전문의 자격 확인\n2. 수술 전후 사진 확인",
          metaTitle: "2026년 쌍꺼풀 수술 비용 총정리 | 매몰법 vs 절개법 비교",
          metaDescription: "쌍꺼풀 수술 비용이 궁금하신가요? 매몰법과 절개법의 가격, 장단점, 회복 기간을 상세히 비교합니다.",
          tags: "쌍꺼풀수술, 매몰법, 절개법, 성형외과, 쌍꺼풀비용",
          readingTime: 5,
        }),
      },
    }],
  }),
}));

vi.mock("./db", () => ({
  getAllBlogCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "성형외과", slug: "plastic-surgery", description: "", sortOrder: 1, createdAt: new Date() },
    { id: 2, name: "피부과", slug: "dermatology", description: "", sortOrder: 2, createdAt: new Date() },
    { id: 3, name: "치과", slug: "dental", description: "", sortOrder: 3, createdAt: new Date() },
    { id: 4, name: "한의원", slug: "korean-medicine", description: "", sortOrder: 4, createdAt: new Date() },
    { id: 5, name: "병원 SEO 가이드", slug: "hospital-seo", description: "", sortOrder: 5, createdAt: new Date() },
    { id: 6, name: "AI 마케팅 트렌드", slug: "ai-marketing", description: "", sortOrder: 6, createdAt: new Date() },
  ]),
  getAllSeoKeywords: vi.fn().mockResolvedValue([
    { id: 1, keyword: "쌍꺼풀 수술 비용", categoryId: 1, status: "pending", blogPostId: null, createdAt: new Date("2026-03-01") },
    { id: 2, keyword: "피부과 레이저 종류", categoryId: 2, status: "pending", blogPostId: null, createdAt: new Date("2026-03-02") },
    { id: 3, keyword: "치아 교정 기간", categoryId: 3, status: "pending", blogPostId: null, createdAt: new Date("2026-03-03") },
  ]),
  getAllBlogPostsAdmin: vi.fn().mockResolvedValue([
    { id: 1, title: "기존 블로그 글 1", slug: "existing-1", categoryId: 1, published: "published", viewCount: 100, createdAt: new Date() },
  ]),
  createBlogPost: vi.fn().mockResolvedValue({ id: 99 }),
  updateSeoKeyword: vi.fn().mockResolvedValue(undefined),
  createSeoKeyword: vi.fn().mockResolvedValue({ id: 100 }),
  publishScheduledPosts: vi.fn().mockResolvedValue(0),
  createInquiry: vi.fn(),
  getAllInquiries: vi.fn().mockResolvedValue([]),
  updateInquiryStatus: vi.fn(),
  deleteInquiry: vi.fn(),
  getInquiryStats: vi.fn().mockResolvedValue({ total: 0, new: 0, contacted: 0, completed: 0 }),
  getAllBlogPosts: vi.fn().mockResolvedValue([]),
  getBlogCategoryBySlug: vi.fn(),
  getBlogPostsByCategory: vi.fn().mockResolvedValue([]),
  getBlogPostBySlug: vi.fn(),
  incrementBlogPostView: vi.fn(),
  updateBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  getBlogPostCount: vi.fn().mockResolvedValue(0),
  getBlogPostCountByCategory: vi.fn().mockResolvedValue(0),
  createBlogCategory: vi.fn(),
  updateBlogCategory: vi.fn(),
  deleteBlogCategory: vi.fn(),
  createSnsContent: vi.fn(),
  getAllSnsContents: vi.fn().mockResolvedValue([]),
  deleteSnsContent: vi.fn(),
  deleteSeoKeyword: vi.fn(),
  getBlogStats: vi.fn().mockResolvedValue({ totalPosts: 0, totalViews: 0, avgViews: 0, draftCount: 0, scheduledCount: 0 }),
  getTopBlogPosts: vi.fn().mockResolvedValue([]),
  getCategoryStats: vi.fn().mockResolvedValue([]),
  getScheduledPosts: vi.fn().mockResolvedValue([]),
  getOrCreateChatSession: vi.fn(),
  saveChatMessage: vi.fn(),
  updateChatSessionVisitor: vi.fn(),
  getAllChatSessions: vi.fn().mockResolvedValue([]),
  getChatSessionById: vi.fn(),
  getChatMessagesBySession: vi.fn().mockResolvedValue([]),
  deleteChatSession: vi.fn(),
  getChatStats: vi.fn().mockResolvedValue({ totalSessions: 0, totalMessages: 0 }),
  findChatSessionByPhone: vi.fn(),
  getHospitalProfileByUserId: vi.fn().mockResolvedValue({ id: 1, userId: 1, hospitalName: "테스트병원", specialty: "성형외과" }),
}));

vi.mock("./notifier", () => ({
  sendInquiryNotification: vi.fn().mockResolvedValue(undefined),
  getNotificationChannelStatus: vi.fn().mockReturnValue({ manus: true, email: true, sms: true }),
}));

import {
  getSchedulerStatus,
  generateAndPublishBlogPost,
  generateMonthlyKeywords,
  startBlogScheduler,
  stopBlogScheduler,
} from "./blog-scheduler";
import { invokeLLM } from "./_core/llm";
import { createBlogPost, updateSeoKeyword, createSeoKeyword, getAllSeoKeywords, getAllBlogCategories } from "./db";

describe("블로그 스케줄러 v2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopBlogScheduler();
  });

  afterEach(() => {
    stopBlogScheduler();
  });

  // ── 상태 관리 ──
  describe("getSchedulerStatus", () => {
    it("초기 상태에서 비활성 상태를 반환한다", () => {
      const status = getSchedulerStatus();
      expect(status.active).toBe(false);
      expect(status.lastRunAt).toBeNull();
      expect(status.lastRunResult).toBeNull();
      expect(status.isRunning).toBe(false);
    });

    it("스케줄 정보에 화/금 10시가 포함된다", () => {
      const status = getSchedulerStatus();
      expect(status.schedule).toContain("화");
      expect(status.schedule).toContain("금");
      expect(status.schedule).toContain("10");
    });

    it("키워드 스케줄 정보에 매월 1일이 포함된다", () => {
      const status = getSchedulerStatus();
      expect(status.keywordSchedule).toContain("매월");
      expect(status.keywordSchedule).toContain("1일");
    });
  });

  // ── 시작/중지 ──
  describe("startBlogScheduler / stopBlogScheduler", () => {
    it("스케줄러를 시작하면 active 상태가 된다", () => {
      startBlogScheduler();
      expect(getSchedulerStatus().active).toBe(true);
    });

    it("스케줄러를 중지하면 inactive 상태가 된다", () => {
      startBlogScheduler();
      stopBlogScheduler();
      expect(getSchedulerStatus().active).toBe(false);
    });

    it("중복 시작을 방지한다 (에러 없이)", () => {
      startBlogScheduler();
      startBlogScheduler(); // 두 번째 호출도 에러 없이
      expect(getSchedulerStatus().active).toBe(true);
    });

    it("실행 중이지 않은 스케줄러를 중지해도 에러가 발생하지 않는다", () => {
      stopBlogScheduler();
      expect(getSchedulerStatus().active).toBe(false);
    });
  });

  // ── 블로그 글 생성 및 발행 ──
  describe("generateAndPublishBlogPost", () => {
    it("pending 키워드가 있으면 가장 오래된 것부터 처리한다", async () => {
      const result = await generateAndPublishBlogPost();
      expect(result.success).toBe(true);
      expect(result.title).toContain("쌍꺼풀");

      // 가장 오래된 키워드(id=1)가 generating → published로 변경
      expect(updateSeoKeyword).toHaveBeenCalledWith(1, { status: "generating" });
      expect(updateSeoKeyword).toHaveBeenCalledWith(1, { status: "published" });
    });

    it("블로그 글이 published 상태로 저장된다", async () => {
      await generateAndPublishBlogPost();
      expect(createBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          published: "published",
          categoryId: 1,
          title: expect.stringContaining("쌍꺼풀"),
        })
      );
    });

    it("카테고리가 없으면 실패한다", async () => {
      (getAllBlogCategories as any).mockResolvedValueOnce([]);
      const result = await generateAndPublishBlogPost();
      expect(result.success).toBe(false);
      expect(result.error).toContain("카테고리");
    });

    it("발행 결과가 상태에 기록된다", async () => {
      await generateAndPublishBlogPost();
      const status = getSchedulerStatus();
      expect(status.lastRunAt).not.toBeNull();
      expect(status.lastRunResult?.success).toBe(true);
      expect(status.recentHistory.length).toBeGreaterThan(0);
      expect(status.recentHistory.some((h: any) => h.type === "publish")).toBe(true);
    });

    it("동시 실행을 방지한다", async () => {
      // 느린 LLM 응답 시뮬레이션
      const slowResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: "테스트 글",
              slug: "test-post",
              excerpt: "테스트 요약",
              content: "## 테스트\n\n테스트 내용입니다.",
              metaTitle: "테스트 메타 타이틀",
              metaDescription: "테스트 메타 설명",
              tags: "테스트",
              readingTime: 3,
            }),
          },
        }],
      };
      (invokeLLM as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(slowResponse), 100))
      );

      const [result1, result2] = await Promise.all([
        generateAndPublishBlogPost(),
        generateAndPublishBlogPost(),
      ]);

      const results = [result1, result2];
      expect(results.some(r => r.success)).toBe(true);
      expect(results.some(r => !r.success)).toBe(true);
    });
  });

  // ── 월간 키워드 자동 선정 ──
  describe("generateMonthlyKeywords", () => {
    it("AI가 키워드 8개를 선정하여 DB에 저장한다", async () => {
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            keywords: [
              { keyword: "봄철 피부 관리법", categorySlug: "dermatology", reason: "봄 환절기" },
              { keyword: "임플란트 수명", categorySlug: "dental", reason: "검색 꾸준" },
              { keyword: "코필러 부작용", categorySlug: "plastic-surgery", reason: "비수술 관심" },
              { keyword: "한방 다이어트", categorySlug: "korean-medicine", reason: "봄 시즌" },
              { keyword: "병원 블로그 SEO", categorySlug: "hospital-seo", reason: "콘텐츠 마케팅" },
              { keyword: "AI 챗봇 병원", categorySlug: "ai-marketing", reason: "AI 트렌드" },
              { keyword: "눈밑지방 재배치", categorySlug: "plastic-surgery", reason: "눈 성형" },
              { keyword: "여드름 흉터 치료", categorySlug: "dermatology", reason: "피부과 수요" },
            ],
          }),
        },
      }],
    });
    const result = await generateMonthlyKeywords();
    expect(result.success).toBe(true);
    expect(result.count).toBe(8);
    expect(createSeoKeyword).toHaveBeenCalledTimes(8);
    });

    it("카테고리가 없으면 실패한다", async () => {
      (getAllBlogCategories as any).mockResolvedValueOnce([]);
      const result = await generateMonthlyKeywords();
      expect(result.success).toBe(false);
      expect(result.error).toContain("카테고리");
    });

    it("중복 키워드는 건너뛴다", async () => {
      // 기존에 "봄철 피부 관리법"이 이미 있는 경우
      (getAllSeoKeywords as any).mockResolvedValueOnce([
        { id: 10, keyword: "봄철 피부 관리법", categoryId: 2, status: "published", createdAt: new Date() },
        { id: 1, keyword: "쌍꺼풀 수술 비용", categoryId: 1, status: "pending", createdAt: new Date("2026-03-01") },
      ]);
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              keywords: [
                { keyword: "봄철 피부 관리법", categorySlug: "dermatology", reason: "봄 환절기" },
                { keyword: "임플란트 수명", categorySlug: "dental", reason: "검색 꾸준" },
                { keyword: "코필러 부작용", categorySlug: "plastic-surgery", reason: "비수술 관심" },
                { keyword: "한방 다이어트", categorySlug: "korean-medicine", reason: "봄 시즌" },
                { keyword: "병원 블로그 SEO", categorySlug: "hospital-seo", reason: "콘텐츠 마케팅" },
                { keyword: "AI 챗봇 병원", categorySlug: "ai-marketing", reason: "AI 트렌드" },
                { keyword: "눈밑지방 재배치", categorySlug: "plastic-surgery", reason: "눈 성형" },
                { keyword: "여드름 흉터 치료", categorySlug: "dermatology", reason: "피부과 수요" },
              ],
            }),
          },
        }],
      });

      const result = await generateMonthlyKeywords();
      expect(result.success).toBe(true);
      expect(result.count).toBe(7); // 1개 중복 제외
    });

    it("키워드 선정 결과가 상태에 기록된다", async () => {
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            keywords: [
              { keyword: "봄철 피부 관리법", categorySlug: "dermatology", reason: "봄 환절기" },
              { keyword: "임플란트 수명", categorySlug: "dental", reason: "검색 꾸준" },
              { keyword: "코필러 부작용", categorySlug: "plastic-surgery", reason: "비수술 관심" },
              { keyword: "한방 다이어트", categorySlug: "korean-medicine", reason: "봄 시즌" },
              { keyword: "병원 블로그 SEO", categorySlug: "hospital-seo", reason: "콘텐츠 마케팅" },
              { keyword: "AI 챗봇 병원", categorySlug: "ai-marketing", reason: "AI 트렌드" },
              { keyword: "눈밑지방 재배치", categorySlug: "plastic-surgery", reason: "눈 성형" },
              { keyword: "여드름 흉터 치료", categorySlug: "dermatology", reason: "피부과 수요" },
            ],
          }),
        },
      }],
    });
    await generateMonthlyKeywords();
      const status = getSchedulerStatus();
      expect(status.lastKeywordGenAt).not.toBeNull();
      expect(status.lastKeywordGenResult?.success).toBe(true);
    });
  });
});

// ── tRPC 라우터 테스트 ──
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("blogScheduler tRPC Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopBlogScheduler();
  });

  afterEach(() => {
    stopBlogScheduler();
  });

  it("관리자가 스케줄러 상태를 조회할 수 있다", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const status = await adminCaller.blogScheduler.status();
    expect(status).toHaveProperty("active");
    expect(status).toHaveProperty("schedule");
    expect(status).toHaveProperty("keywordSchedule");
    expect(status).toHaveProperty("recentHistory");
  });

  it("비인증 사용자는 스케줄러 상태를 조회할 수 없다", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    await expect(publicCaller.blogScheduler.status()).rejects.toThrow();
  });

  it("관리자가 즉시 발행을 할 수 있다", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.blogScheduler.runNow();
    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("관리자가 키워드 자동 선정을 할 수 있다", async () => {
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            keywords: [
              { keyword: "봄철 피부 관리법", categorySlug: "dermatology", reason: "봄 환절기" },
              { keyword: "임플란트 수명", categorySlug: "dental", reason: "검색 꾸준" },
              { keyword: "코필러 부작용", categorySlug: "plastic-surgery", reason: "비수술 관심" },
              { keyword: "한방 다이어트", categorySlug: "korean-medicine", reason: "봄 시즌" },
              { keyword: "병원 블로그 SEO", categorySlug: "hospital-seo", reason: "콘텐츠 마케팅" },
              { keyword: "AI 챗봇 병원", categorySlug: "ai-marketing", reason: "AI 트렌드" },
              { keyword: "눈밑지방 재배치", categorySlug: "plastic-surgery", reason: "눈 성형" },
              { keyword: "여드름 흉터 치료", categorySlug: "dermatology", reason: "피부과 수요" },
            ],
          }),
        },
      }],
    });
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.blogScheduler.generateKeywords();
    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result.count).toBe(8);
  });

  it("비인증 사용자는 즉시 발행을 할 수 없다", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    await expect(publicCaller.blogScheduler.runNow()).rejects.toThrow();
  });

  it("비인증 사용자는 키워드 선정을 할 수 없다", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    await expect(publicCaller.blogScheduler.generateKeywords()).rejects.toThrow();
  });
});

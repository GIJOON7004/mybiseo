/**
 * SaaS 대시보드 (myHospital) 라우터 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions
vi.mock("./db", () => ({
  createHospitalProfile: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  getHospitalProfileByUserId: vi.fn().mockResolvedValue(null),
  updateHospitalProfile: vi.fn().mockResolvedValue(undefined),
  getHospitalDashboardData: vi.fn().mockResolvedValue({
    history: [],
    benchmarks: [],
    ranking: [],
    myRank: null,
  }),
  getAllHospitalProfiles: vi.fn().mockResolvedValue([]),
  getDiagnosisHistoryByUrl: vi.fn().mockResolvedValue([]),
  saveDiagnosisHistory: vi.fn().mockResolvedValue(undefined),
  // Other db functions that may be imported
  upsertUser: vi.fn(),
  createInquiry: vi.fn(),
  getAllInquiries: vi.fn().mockResolvedValue([]),
  updateInquiryStatus: vi.fn(),
  deleteInquiry: vi.fn(),
  getInquiryStats: vi.fn().mockResolvedValue({ total: 0, new: 0, contacted: 0, completed: 0 }),
  getAllBlogCategories: vi.fn().mockResolvedValue([]),
  getBlogCategoryBySlug: vi.fn(),
  getAllBlogPosts: vi.fn().mockResolvedValue([]),
  getBlogPostsByCategory: vi.fn().mockResolvedValue([]),
  getBlogPostBySlug: vi.fn(),
  incrementBlogPostView: vi.fn(),
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  getAllBlogPostsAdmin: vi.fn().mockResolvedValue([]),
  getBlogPostCount: vi.fn().mockResolvedValue(0),
  getBlogPostCountByCategory: vi.fn().mockResolvedValue(0),
  createBlogCategory: vi.fn(),
  updateBlogCategory: vi.fn(),
  deleteBlogCategory: vi.fn(),
  createSnsContent: vi.fn(),
  getAllSnsContents: vi.fn().mockResolvedValue([]),
  deleteSnsContent: vi.fn(),
  createSeoKeyword: vi.fn(),
  getAllSeoKeywords: vi.fn().mockResolvedValue([]),
  updateSeoKeyword: vi.fn(),
  deleteSeoKeyword: vi.fn(),
  getBlogStats: vi.fn().mockResolvedValue({}),
  getTopBlogPosts: vi.fn().mockResolvedValue([]),
  getCategoryStats: vi.fn().mockResolvedValue([]),
  getScheduledPosts: vi.fn().mockResolvedValue([]),
  publishScheduledPosts: vi.fn(),
  getOrCreateChatSession: vi.fn(),
  saveChatMessage: vi.fn(),
  updateChatSessionVisitor: vi.fn(),
  getAllChatSessions: vi.fn().mockResolvedValue([]),
  getChatSessionById: vi.fn(),
  getChatMessagesBySession: vi.fn().mockResolvedValue([]),
  deleteChatSession: vi.fn(),
  getChatStats: vi.fn().mockResolvedValue({}),
  findChatSessionByPhone: vi.fn(),
  createAiMonitorKeyword: vi.fn(),
  getAiMonitorKeywords: vi.fn().mockResolvedValue([]),
  toggleAiMonitorKeyword: vi.fn(),
  deleteAiMonitorKeyword: vi.fn(),
  createAiMonitorResult: vi.fn(),
  getAiMonitorResults: vi.fn().mockResolvedValue([]),
  getAiMonitorStats: vi.fn().mockResolvedValue({}),
  createSeoLead: vi.fn(),
  getAllSeoLeads: vi.fn().mockResolvedValue([]),
  getSeoLeadStats: vi.fn().mockResolvedValue({}),
  updateSeoLeadStatus: vi.fn(),
  getAiMonitorTrend: vi.fn().mockResolvedValue([]),
  getAiMonitorKeywordTrend: vi.fn().mockResolvedValue([]),
  getRecentDiagnoses: vi.fn().mockResolvedValue([]),
  getDiagnosisStats: vi.fn().mockResolvedValue({}),
  getDailyDiagnosisCounts: vi.fn().mockResolvedValue([]),
  getScoreDistribution: vi.fn().mockResolvedValue([]),
  getTopDiagnosedUrls: vi.fn().mockResolvedValue([]),
  getSpecialtyStats: vi.fn().mockResolvedValue([]),
  getRegionStats: vi.fn().mockResolvedValue([]),
  subscribeNewsletter: vi.fn(),
  unsubscribeNewsletter: vi.fn(),
  getActiveSubscribers: vi.fn().mockResolvedValue([]),
  getSubscriberCount: vi.fn().mockResolvedValue(0),
  saveBenchmarkData: vi.fn(),
  getBenchmarkBySpecialty: vi.fn().mockResolvedValue([]),
  getBenchmarkByRegion: vi.fn().mockResolvedValue([]),
  getLatestBenchmarks: vi.fn().mockResolvedValue([]),
  saveMonthlyAward: vi.fn(),
  getMonthlyAwards: vi.fn().mockResolvedValue([]),
  getLeadFunnelStats: vi.fn().mockResolvedValue({}),
}));

vi.mock("./seo-analyzer", () => ({
  analyzeSeo: vi.fn().mockResolvedValue({
    url: "https://test-hospital.com",
    totalScore: 65,
    grade: "C",
    categories: [
      { name: "AI 검색 노출", score: 12, maxScore: 25 },
      { name: "기본 SEO", score: 15, maxScore: 25 },
      { name: "콘텐츠 품질", score: 20, maxScore: 25 },
      { name: "기술 SEO", score: 18, maxScore: 25 },
    ],
  }),
}));

vi.mock("./notifier", () => ({
  sendInquiryNotification: vi.fn(),
  getNotificationChannelStatus: vi.fn().mockResolvedValue({ email: true, sms: false }),
  sendEmailViaNaver: vi.fn(),
}));

vi.mock("./blog-scheduler", () => ({
  getSchedulerStatus: vi.fn().mockResolvedValue({}),
  generateAndPublishBlogPost: vi.fn(),
  generateMonthlyKeywords: vi.fn(),
  runAutoAiMonitor: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "test response" } }],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import { createHospitalProfile, getHospitalProfileByUserId, getHospitalDashboardData, getDiagnosisHistoryByUrl } from "./db";

// Helper to create caller with user context
function createAuthCaller(userId = 1, role = "user" as "user" | "admin") {
  return appRouter.createCaller({
    user: { id: userId, openId: "test-open-id", name: "테스트 원장", role },
    setCookie: vi.fn(),
    getCookie: vi.fn(),
    deleteCookie: vi.fn(),
  } as any);
}

function createPublicCaller() {
  return appRouter.createCaller({
    user: null,
    setCookie: vi.fn(),
    getCookie: vi.fn(),
    deleteCookie: vi.fn(),
  } as any);
}

describe("myHospital 라우터", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("로그인한 사용자의 병원 프로필을 조회한다", async () => {
      const mockProfile = {
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
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(mockProfile as any);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.getProfile();
      
      expect(result).toBeTruthy();
      expect(result?.hospitalName).toBe("테스트치과");
      expect(getHospitalProfileByUserId).toHaveBeenCalledWith(1);
    });

    it("프로필이 없으면 null을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.getProfile();
      
      expect(result).toBeNull();
    });

    it("비로그인 사용자는 접근할 수 없다", async () => {
      const caller = createPublicCaller();
      await expect(caller.myHospital.getProfile()).rejects.toThrow();
    });
  });

  describe("createProfile", () => {
    it("새 병원 프로필을 생성한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.createProfile({
        hospitalName: "새치과",
        hospitalUrl: "https://new-dental.com",
        specialty: "치과",
        region: "서울",
      });
      
      expect(result.success).toBe(true);
      expect(result.updated).toBe(false);
      expect(createHospitalProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalName: "새치과",
          hospitalUrl: "https://new-dental.com",
          userId: 1,
        })
      );
    });

    it("기존 프로필이 있으면 업데이트한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce({
        id: 5,
        userId: 1,
        hospitalName: "기존치과",
        hospitalUrl: "https://old.com",
      } as any);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.createProfile({
        hospitalName: "업데이트치과",
        hospitalUrl: "https://updated.com",
      });
      
      expect(result.success).toBe(true);
      expect(result.updated).toBe(true);
    });

    it("빈 병원명은 거부한다", async () => {
      const caller = createAuthCaller();
      await expect(
        caller.myHospital.createProfile({
          hospitalName: "",
          hospitalUrl: "https://test.com",
        })
      ).rejects.toThrow();
    });
  });

  describe("dashboard", () => {
    it("프로필이 없으면 null을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.dashboard();
      
      expect(result).toBeNull();
    });

    it("프로필이 있으면 대시보드 데이터를 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce({
        id: 1,
        userId: 1,
        hospitalName: "테스트치과",
        hospitalUrl: "https://test-dental.com",
      } as any);
      vi.mocked(getHospitalDashboardData).mockResolvedValueOnce({
        history: [{ totalScore: 60, aiScore: 45, grade: "C", diagnosedAt: new Date() }],
        benchmarks: [],
        ranking: [{ rank: 1, url: "https://test-dental.com", totalScore: 60, aiScore: 45, isMe: true }],
        myRank: { rank: 1, total: 5, percentile: 80 },
      } as any);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.dashboard();
      
      expect(result).toBeTruthy();
      expect(result?.profile.hospitalName).toBe("테스트치과");
      expect(result?.history).toHaveLength(1);
      expect(result?.myRank?.rank).toBe(1);
    });
  });

  describe("improvements", () => {
    it("프로필이 없으면 빈 배열을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.improvements();
      
      expect(result).toEqual([]);
    });

    it("진단 이력이 있으면 개선 추천 항목을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce({
        id: 1,
        userId: 1,
        hospitalUrl: "https://test.com",
      } as any);
      vi.mocked(getDiagnosisHistoryByUrl).mockResolvedValueOnce([{
        id: 1,
        url: "https://test.com",
        totalScore: 60,
        aiScore: 40,
        grade: "C",
        categoryScores: JSON.stringify([
          { name: "AI 검색 노출", score: 8, max: 25 },
          { name: "기본 SEO", score: 20, max: 25 },
          { name: "콘텐츠 품질", score: 15, max: 25 },
        ]),
        diagnosedAt: new Date(),
      }] as any);
      
      const caller = createAuthCaller();
      const result = await caller.myHospital.improvements();
      
      expect(result.length).toBe(3);
      // AI 검색 노출이 가장 낮으므로 첫 번째
      expect(result[0].category).toBe("AI 검색 노출");
      expect(result[0].percentage).toBe(32); // 8/25 * 100
    });
  });

  describe("allProfiles (관리자 전용)", () => {
    it("관리자는 전체 프로필 목록을 조회할 수 있다", async () => {
      const caller = createAuthCaller(1, "admin");
      const result = await caller.myHospital.allProfiles();
      expect(Array.isArray(result)).toBe(true);
    });

    it("일반 사용자는 접근할 수 없다", async () => {
      const caller = createAuthCaller(1, "user");
      await expect(caller.myHospital.allProfiles()).rejects.toThrow();
    });
  });
});

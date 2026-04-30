/**
 * 추적 코드 데이터 수신 API (tracking) + 유입 분석 (analytics) 라우터 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions
vi.mock("./db", () => ({
  // tracking
  insertSiteVisit: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  insertConsultationInquiry: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  // analytics
  getSiteVisitStats: vi.fn().mockResolvedValue([
    { channel: "ai_chatgpt", count: 15, uniqueVisitors: 10 },
    { channel: "naver", count: 25, uniqueVisitors: 20 },
    { channel: "google", count: 10, uniqueVisitors: 8 },
  ]),
  getTopPages: vi.fn().mockResolvedValue([
    { pageUrl: "/", pageTitle: "홈", views: 30, uniqueVisitors: 25 },
    { pageUrl: "/about", pageTitle: "소개", views: 15, uniqueVisitors: 12 },
  ]),
  getDailyVisitTrend: vi.fn().mockResolvedValue([
    { date: "2026-03-01", total: 5, uniqueVisitors: 4 },
    { date: "2026-03-02", total: 8, uniqueVisitors: 6 },
  ]),
  getConsultationsByHospital: vi.fn().mockResolvedValue([
    {
      id: 1,
      hospitalId: 1,
      patientName: "홍길동",
      patientPhone: "010-1234-5678",
      treatmentType: "임플란트",
      message: "상담 원합니다",
      status: "pending",
      channel: "ai_chatgpt",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateConsultationStatus: vi.fn().mockResolvedValue(undefined),
  getMonthlyReportsByHospital: vi.fn().mockResolvedValue([
    {
      id: 1,
      hospitalId: 1,
      year: 2026,
      month: 3,
      seoScore: 72,
      aiExposureScore: 65,
      totalVisits: 150,
      aiChannelVisits: 45,
      totalInquiries: 8,
      createdAt: new Date(),
    },
  ]),
  getHospitalProfileByUserId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    hospitalName: "테스트치과",
    hospitalUrl: "https://test-dental.com",
    specialty: "치과",
    region: "서울 강남",
  }),
  // Other required db exports
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
  saveDiagnosisHistory: vi.fn(),
  getDiagnosisHistoryByUrl: vi.fn().mockResolvedValue([]),
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
  createHospitalProfile: vi.fn(),
  updateHospitalProfile: vi.fn(),
  getHospitalDashboardData: vi.fn().mockResolvedValue({ history: [], benchmarks: [], ranking: [], myRank: null }),
  getAllHospitalProfiles: vi.fn().mockResolvedValue([]),
  addAiMonitorCompetitor: vi.fn(),
  getAiMonitorCompetitors: vi.fn().mockResolvedValue([]),
  deleteAiMonitorCompetitor: vi.fn(),
  getAiExposureScores: vi.fn().mockResolvedValue([]),
  getLatestAiExposureScores: vi.fn().mockResolvedValue([]),
  getAiMonitorStatsEnhanced: vi.fn().mockResolvedValue({}),
  updateChatSessionInsight: vi.fn(),
  getSessionsWithoutInsight: vi.fn().mockResolvedValue([]),
  getChatInsightStats: vi.fn().mockResolvedValue({}),
  logUserEvent: vi.fn(),
  getUserEventStats: vi.fn().mockResolvedValue([]),
  getRecentUserEvents: vi.fn().mockResolvedValue([]),
  aggregateMonthlyBenchmark: vi.fn(),
  generateMonthlyAwards: vi.fn(),
  recalculateLeadScores: vi.fn(),
  createAiImprovementReport: vi.fn(),
  getAiImprovementReports: vi.fn().mockResolvedValue([]),
  getAiImprovementReportById: vi.fn(),
  deleteAiImprovementReport: vi.fn(),
  getKeywordMonitoringDataForReport: vi.fn().mockResolvedValue([]),
  getSeasonalKeywords: vi.fn().mockResolvedValue([]),
  getCurrentSeasonalRecommendations: vi.fn().mockResolvedValue([]),
  getSeasonalSpecialties: vi.fn().mockResolvedValue([]),
  addSeasonalKeyword: vi.fn(),
  deleteSeasonalKeyword: vi.fn(),
  getCompetitorComparison: vi.fn().mockResolvedValue([]),
  getCompetitorTrend: vi.fn().mockResolvedValue([]),
  getSiteVisitsByHospital: vi.fn().mockResolvedValue([]),
  insertMonthlyReport: vi.fn(),
  getDeviceStats: vi.fn().mockResolvedValue([
    { deviceType: "mobile", count: 30, uniqueVisitors: 25 },
    { deviceType: "desktop", count: 20, uniqueVisitors: 18 },
  ]),
  getAiChannelDetail: vi.fn().mockResolvedValue([
    { channel: "ai_chatgpt", count: 15, uniqueVisitors: 10, avgDuration: 45.5 },
    { channel: "ai_gemini", count: 8, uniqueVisitors: 6, avgDuration: 32.0 },
  ]),
  getHourlyDistribution: vi.fn().mockResolvedValue([
    { hour: 9, count: 12 },
    { hour: 14, count: 18 },
    { hour: 20, count: 8 },
  ]),
  getConsultationStats: vi.fn().mockResolvedValue({
    total: 10, pending: 3, contacted: 4, completed: 2, cancelled: 1, conversionRate: "20%",
  }),
  getConsultationByChannel: vi.fn().mockResolvedValue([
    { channel: "ai_chatgpt", count: 5 },
    { channel: "naver", count: 3 },
  ]),
  getConsultationMonthlyTrend: vi.fn().mockResolvedValue([
    { yearMonth: "2026-02", total: 8, completed: 3 },
    { yearMonth: "2026-03", total: 12, completed: 5 },
  ]),
  getMonthlyVisitSummary: vi.fn().mockResolvedValue({
    totalVisits: 150, aiChannelVisits: 45, naverVisits: 50, googleVisits: 30, snsVisits: 15, directVisits: 10,
  }),
  getMonthlyInquirySummary: vi.fn().mockResolvedValue({
    totalInquiries: 8, conversionRate: "20%",
  }),
}));

vi.mock("./seo-analyzer", () => ({
  analyzeSeo: vi.fn().mockResolvedValue({
    url: "https://test-hospital.com",
    totalScore: 65,
    grade: "C",
    categories: [],
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
import {
  insertSiteVisit,
  insertConsultationInquiry,
  getSiteVisitStats,
  getTopPages,
  getDailyVisitTrend,
  getConsultationsByHospital,
  updateConsultationStatus,
  getMonthlyReportsByHospital,
  getHospitalProfileByUserId,
  getDeviceStats,
  getAiChannelDetail,
  getHourlyDistribution,
  getConsultationStats,
  getConsultationByChannel,
  getConsultationMonthlyTrend,
  insertMonthlyReport,
} from "./db";

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

// ═══════════════════════════════════════════════════════════════
// tracking 라우터 테스트
// ═══════════════════════════════════════════════════════════════

describe("tracking 라우터", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("pageview", () => {
    it("페이지뷰 데이터를 정상적으로 저장한다", async () => {
      const caller = createPublicCaller();
      const result = await caller.tracking.pageview({
        hospitalId: 1,
        visitorId: "mb_test123",
        sessionId: "mb_sess456",
        channel: "ai_chatgpt",
        referrer: "https://chatgpt.com",
        landingPage: "/",
        pageUrl: "/about",
        pageTitle: "소개 페이지",
        deviceType: "mobile",
      });

      expect(result.ok).toBe(true);
      expect(insertSiteVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId: 1,
          visitorId: "mb_test123",
          channel: "ai_chatgpt",
          pageUrl: "/about",
        })
      );
    });

    it("비로그인 사용자도 페이지뷰를 기록할 수 있다 (공개 API)", async () => {
      const caller = createPublicCaller();
      const result = await caller.tracking.pageview({
        hospitalId: 1,
        visitorId: "mb_anon",
        sessionId: "mb_sess_anon",
        channel: "naver",
        landingPage: "/",
        pageUrl: "/",
      });

      expect(result.ok).toBe(true);
    });

    it("다양한 채널을 지원한다", async () => {
      const channels = [
        "ai_chatgpt", "ai_gemini", "ai_claude", "ai_perplexity", "ai_copilot", "ai_other",
        "naver", "google", "sns_instagram", "sns_youtube", "sns_blog",
        "direct", "referral", "other",
      ] as const;

      const caller = createPublicCaller();
      for (const channel of channels) {
        const result = await caller.tracking.pageview({
          hospitalId: 1,
          visitorId: "mb_test",
          sessionId: "mb_sess",
          channel,
          landingPage: "/",
          pageUrl: "/",
        });
        expect(result.ok).toBe(true);
      }
      expect(insertSiteVisit).toHaveBeenCalledTimes(channels.length);
    });

    it("디바이스 타입 기본값은 desktop이다", async () => {
      const caller = createPublicCaller();
      await caller.tracking.pageview({
        hospitalId: 1,
        visitorId: "mb_test",
        sessionId: "mb_sess",
        channel: "direct",
        landingPage: "/",
        pageUrl: "/",
      });

      expect(insertSiteVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceType: "desktop",
        })
      );
    });
  });

  describe("inquiry", () => {
    it("상담 문의를 정상적으로 저장한다", async () => {
      const caller = createPublicCaller();
      const result = await caller.tracking.inquiry({
        hospitalId: 1,
        patientName: "홍길동",
        patientPhone: "010-1234-5678",
        treatmentType: "임플란트",
        message: "상담 원합니다",
        channel: "ai_chatgpt",
        visitorId: "mb_test123",
      });

      expect(result.ok).toBe(true);
      expect(insertConsultationInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId: 1,
          patientName: "홍길동",
          patientPhone: "010-1234-5678",
        })
      );
    });

    it("최소 정보만으로도 문의를 저장할 수 있다", async () => {
      const caller = createPublicCaller();
      const result = await caller.tracking.inquiry({
        hospitalId: 1,
      });

      expect(result.ok).toBe(true);
      expect(insertConsultationInquiry).toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// analytics 라우터 테스트
// ═══════════════════════════════════════════════════════════════

describe("analytics 라우터", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("visitStats", () => {
    it("채널별 방문 통계를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.visitStats({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result.channels).toHaveLength(3);
      expect(result.total).toBe(50); // 15 + 25 + 10
      expect(result.uniqueVisitors).toBe(38); // 10 + 20 + 8
      expect(getSiteVisitStats).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date)
      );
    });

    it("프로필이 없으면 빈 결과를 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      const caller = createAuthCaller();
      const result = await caller.analytics.visitStats({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result.channels).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("비로그인 사용자는 접근할 수 없다", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.analytics.visitStats({ from: "2026-03-01", to: "2026-03-31" })
      ).rejects.toThrow();
    });
  });

  describe("topPages", () => {
    it("인기 페이지 목록을 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.topPages({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result).toHaveLength(2);
      expect(result[0].pageUrl).toBe("/");
      expect(getTopPages).toHaveBeenCalledWith(1, expect.any(Date), expect.any(Date), 10);
    });
  });

  describe("dailyTrend", () => {
    it("일별 방문 추이를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.dailyTrend({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe("2026-03-01");
      expect(getDailyVisitTrend).toHaveBeenCalled();
    });
  });

  describe("consultations", () => {
    it("상담 문의 목록을 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.consultations();

      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe("홍길동");
      expect(getConsultationsByHospital).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it("프로필이 없으면 빈 배열을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      const caller = createAuthCaller();
      const result = await caller.analytics.consultations();

      expect(result).toHaveLength(0);
    });
  });

  describe("updateConsultation", () => {
    it("상담 상태를 업데이트한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.updateConsultation({
        id: 1,
        status: "contacted",
        note: "전화 연락 완료",
      });

      expect(result.ok).toBe(true);
      expect(updateConsultationStatus).toHaveBeenCalledWith(1, "contacted", "전화 연락 완료");
    });
  });

  describe("monthlyReports", () => {
    it("월간 리포트 목록을 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.monthlyReports();

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2026);
      expect(result[0].month).toBe(3);
      expect(getMonthlyReportsByHospital).toHaveBeenCalledWith(1);
    });

    it("프로필이 없으면 빈 배열을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      const caller = createAuthCaller();
      const result = await caller.analytics.monthlyReports();

      expect(result).toHaveLength(0);
    });
  });

  describe("deviceStats", () => {
    it("디바이스별 방문 통계를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.deviceStats({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result).toHaveLength(2);
      expect(result[0].deviceType).toBe("mobile");
      expect(getDeviceStats).toHaveBeenCalledWith(1, expect.any(Date), expect.any(Date));
    });

    it("프로필이 없으면 빈 배열을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      const caller = createAuthCaller();
      const result = await caller.analytics.deviceStats({ from: "2026-03-01", to: "2026-03-31" });
      expect(result).toHaveLength(0);
    });
  });

  describe("aiChannelDetail", () => {
    it("AI 채널 상세 분석을 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.aiChannelDetail({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe("ai_chatgpt");
      expect(result[0].avgDuration).toBe(45.5);
      expect(getAiChannelDetail).toHaveBeenCalled();
    });
  });

  describe("hourlyDistribution", () => {
    it("시간대별 방문 분포를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.hourlyDistribution({
        from: "2026-03-01",
        to: "2026-03-31",
      });

      expect(result).toHaveLength(3);
      expect(result[1].hour).toBe(14);
      expect(result[1].count).toBe(18);
      expect(getHourlyDistribution).toHaveBeenCalled();
    });
  });

  describe("consultationStats", () => {
    it("상담 통계를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.consultationStats();

      expect(result.total).toBe(10);
      expect(result.pending).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.conversionRate).toBe("20%");
      expect(getConsultationStats).toHaveBeenCalled();
    });

    it("프로필이 없으면 기본값을 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      const caller = createAuthCaller();
      const result = await caller.analytics.consultationStats();
      expect(result.total).toBe(0);
      expect(result.conversionRate).toBe("0%");
    });
  });

  describe("consultationByChannel", () => {
    it("채널별 상담 문의 집계를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.consultationByChannel();

      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe("ai_chatgpt");
      expect(result[0].count).toBe(5);
      expect(getConsultationByChannel).toHaveBeenCalled();
    });
  });

  describe("consultationMonthlyTrend", () => {
    it("월별 상담 추이를 반환한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.consultationMonthlyTrend();

      expect(result).toHaveLength(2);
      expect(result[1].yearMonth).toBe("2026-03");
      expect(result[1].total).toBe(12);
      expect(getConsultationMonthlyTrend).toHaveBeenCalled();
    });
  });

  describe("generateMonthlyReport", () => {
    it("월간 리포트를 생성한다", async () => {
      const caller = createAuthCaller();
      const result = await caller.analytics.generateMonthlyReport({
        year: 2026,
        month: 2,
      });

      expect(result.ok).toBe(true);
      expect(insertMonthlyReport).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId: 1,
          year: 2026,
          month: 2,
          totalVisits: 150,
          totalInquiries: 8,
        })
      );
    });

    it("프로필이 없으면 에러를 반환한다", async () => {
      vi.mocked(getHospitalProfileByUserId).mockResolvedValueOnce(null);
      const caller = createAuthCaller();
      await expect(
        caller.analytics.generateMonthlyReport({ year: 2026, month: 2 })
      ).rejects.toThrow();
    });

    it("비로그인 사용자는 리포트를 생성할 수 없다", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.analytics.generateMonthlyReport({ year: 2026, month: 2 })
      ).rejects.toThrow();
    });
  });
});

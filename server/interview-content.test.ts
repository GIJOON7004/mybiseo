import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-interview",
    email: "doctor@example.com",
    name: "테스트 원장",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

// Mock DB functions
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  const mockVideos = new Map<number, any>();
  let nextId = 1;

  return {
    ...actual,
    createInterviewVideo: vi.fn(async (data: any) => {
      const id = nextId++;
      mockVideos.set(id, { id, ...data, status: "uploading", createdAt: new Date() });
      return { insertId: id } as any;
    }),
    getInterviewVideos: vi.fn(async (userId: string) => {
      return Array.from(mockVideos.values()).filter((v) => v.userId === userId);
    }),
    getInterviewVideoById: vi.fn(async (id: number, userId: string) => {
      const v = mockVideos.get(id);
      if (!v || v.userId !== userId) return null;
      return v;
    }),
    updateInterviewVideo: vi.fn(async (id: number, userId: string, data: any) => {
      const v = mockVideos.get(id);
      if (v && v.userId === userId) {
        Object.assign(v, data);
      }
    }),
    deleteInterviewVideo: vi.fn(async (id: number, userId: string) => {
      const v = mockVideos.get(id);
      if (v && v.userId === userId) {
        mockVideos.delete(id);
      }
    }),
    getAllBlogCategories: vi.fn(async () => {
      return [
        { id: 1, name: "성형", slug: "surgery", description: null, sortOrder: 0, createdAt: new Date() },
        { id: 2, name: "피부", slug: "skin", description: null, sortOrder: 1, createdAt: new Date() },
      ];
    }),
    createBlogPost: vi.fn(async (data: any) => {
      return { insertId: 100 } as any;
    }),
    getInterviewContentStats: vi.fn(async (userId: string) => {
      const videos = Array.from(mockVideos.values()).filter((v) => v.userId === userId);
      let totalBlogs = 0, totalCardnews = 0, totalShortforms = 0;
      for (const v of videos) {
        try {
          const blogs = JSON.parse(v.blogContents || "[]");
          totalBlogs += blogs.length;
        } catch {}
        try {
          const cards = JSON.parse(v.cardnewsContents || "[]");
          totalCardnews += cards.length;
        } catch {}
        try {
          const shorts = JSON.parse(v.shortformContents || "[]");
          totalShortforms += shorts.length;
        } catch {}
      }
      return {
        totalVideos: videos.length,
        totalBlogs,
        totalCardnews,
        totalShortforms,
        recentVideos: videos.slice(-5).reverse(),
      };
    }),
    getCalendarItemsByMonth: vi.fn(async () => []),
    getCalendarItemsByWeek: vi.fn(async () => []),
    createCalendarItemExtended: vi.fn(async (data: any) => {
      const calId = nextId++;
      return { insertId: calId } as any;
    }),
    deleteCalendarItem: vi.fn(async () => {}),
  };
});

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn(async () => ({ url: "https://example.com/generated-image.png" })),
}));

describe("interviewContent router", () => {
  it("upload creates a new video record", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video.mp4",
      videoFileKey: "interview-videos/test-video.mp4",
      fileName: "원장님_인터뷰.mp4",
      fileSizeBytes: 5000000,
      doctorName: "김원장",
      hospitalName: "테스트성형외과",
      topicKeyword: "눈밑지방재배치",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("list returns uploaded videos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.interviewContent.list();
    expect(Array.isArray(videos)).toBe(true);
    expect(videos.length).toBeGreaterThanOrEqual(1);
  });

  it("getById returns a specific video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Upload first
    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-2.mp4",
      videoFileKey: "interview-videos/test-video-2.mp4",
      fileName: "인터뷰2.mp4",
    });

    const video = await caller.interviewContent.getById({ id: uploaded.id });
    expect(video).toBeDefined();
    expect(video.videoUrl).toBe("https://example.com/test-video-2.mp4");
  });

  it("getById throws NOT_FOUND for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.interviewContent.getById({ id: 99999 })).rejects.toThrow();
  });

  it("updateTranscript updates the transcript text", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-3.mp4",
      videoFileKey: "interview-videos/test-video-3.mp4",
    });

    const result = await caller.interviewContent.updateTranscript({
      id: uploaded.id,
      transcript: "안녕하세요, 오늘은 눈밑지방재배치에 대해 이야기하겠습니다.",
    });

    expect(result.success).toBe(true);
  });

  it("delete removes a video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-4.mp4",
      videoFileKey: "interview-videos/test-video-4.mp4",
    });

    const result = await caller.interviewContent.delete({ id: uploaded.id });
    expect(result.success).toBe(true);
  });

  it("transcribe throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.interviewContent.transcribe({ id: 99999 })).rejects.toThrow();
  });

  it("generateContents throws error when no transcript", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-5.mp4",
      videoFileKey: "interview-videos/test-video-5.mp4",
    });

    await expect(
      caller.interviewContent.generateContents({ id: uploaded.id })
    ).rejects.toThrow("트랜스크립트가 없습니다");
  });

  it("getBlogCategories returns available categories", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.interviewContent.getBlogCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThanOrEqual(1);
    expect(categories[0]).toHaveProperty("id");
    expect(categories[0]).toHaveProperty("name");
  });

  it("publishToBlog throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.publishToBlog({
        id: 99999,
        blogIndex: 0,
        categoryId: 1,
        publishStatus: "draft",
      })
    ).rejects.toThrow();
  });

  it("publishToBlog throws error when no blog contents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-pub.mp4",
      videoFileKey: "interview-videos/test-video-pub.mp4",
    });

    await expect(
      caller.interviewContent.publishToBlog({
        id: uploaded.id,
        blogIndex: 0,
        categoryId: 1,
        publishStatus: "draft",
      })
    ).rejects.toThrow();
  });

  it("generateCardImage throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.generateCardImage({
        id: 99999,
        setIndex: 0,
        cardIndex: 0,
      })
    ).rejects.toThrow();
  });

  it("generateCardSetImages throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.generateCardSetImages({
        id: 99999,
        setIndex: 0,
      })
    ).rejects.toThrow();
  });

  it("optimizeCardImage throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.optimizeCardImage({
        id: 99999,
        setIndex: 0,
        cardIndex: 0,
      })
    ).rejects.toThrow();
  });

  it("optimizeCardImage throws error when no cardnews contents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-opt.mp4",
      videoFileKey: "interview-videos/test-video-opt.mp4",
    });

    await expect(
      caller.interviewContent.optimizeCardImage({
        id: uploaded.id,
        setIndex: 0,
        cardIndex: 0,
      })
    ).rejects.toThrow();
  });

  it("downloadCardSetZip throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.downloadCardSetZip({
        id: 99999,
        setIndex: 0,
      })
    ).rejects.toThrow();
  });

  it("downloadAllCardSetsZip throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.downloadAllCardSetsZip({
        id: 99999,
      })
    ).rejects.toThrow();
  });

  it("generateSubtitle throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.generateSubtitle({
        id: 99999,
        shortformIndex: 0,
        format: "srt",
      })
    ).rejects.toThrow();
  });

  it("generateSubtitle throws error when no shortform contents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-sub.mp4",
      videoFileKey: "interview-videos/test-video-sub.mp4",
    });

    await expect(
      caller.interviewContent.generateSubtitle({
        id: uploaded.id,
        shortformIndex: 0,
        format: "srt",
      })
    ).rejects.toThrow();
  });

  it("generateAllSubtitles throws error for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.interviewContent.generateAllSubtitles({
        id: 99999,
        format: "vtt",
      })
    ).rejects.toThrow();
  });

  it("generateAllSubtitles throws error when no shortform contents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-allsub.mp4",
      videoFileKey: "interview-videos/test-video-allsub.mp4",
    });

    await expect(
      caller.interviewContent.generateAllSubtitles({
        id: uploaded.id,
        format: "srt",
      })
    ).rejects.toThrow();
  });

  /* ─── 대시보드 통계 테스트 ─── */
  it("dashboardStats returns statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.interviewContent.dashboardStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalVideos");
    expect(stats).toHaveProperty("totalBlogs");
    expect(stats).toHaveProperty("totalCardnews");
    expect(stats).toHaveProperty("totalShortforms");
    expect(typeof stats.totalVideos).toBe("number");
  });

  /* ─── 캘린더 테스트 ─── */
  it("calendarMonthly returns items for a month", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.interviewContent.calendarMonthly({ year: 2026, month: 4 });
    expect(Array.isArray(items)).toBe(true);
  });

  it("calendarWeekly returns items for a week", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.interviewContent.calendarWeekly({ startDate: "2026-04-01" });
    expect(Array.isArray(items)).toBe(true);
  });

  it("calendarCreate creates a new calendar item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.interviewContent.calendarCreate({
      title: "테스트 블로그 발행",
      scheduledDate: "2026-04-10",
      platform: "blog",
      contentType: "blog",
    });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("calendarDelete removes a calendar item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Delete with a fixed id (mock doesn't need real item)
    const result = await caller.interviewContent.calendarDelete({ id: 999 });
    expect(result.success).toBe(true);
  });

  /* ─── 텍스트 오버레이 테스트 ─── */
  it("generateCardOverlay throws for non-existent video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.interviewContent.generateCardOverlay({
        id: 99999,
        setIndex: 0,
        cardIndex: 0,
        headline: "테스트",
      })
    ).rejects.toThrow();
  });

  it("generateCardOverlay throws when card has no image", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uploaded = await caller.interviewContent.upload({
      videoUrl: "https://example.com/test-video-overlay.mp4",
      videoFileKey: "interview-videos/test-video-overlay.mp4",
    });
    // No cardnews content generated, so should throw
    await expect(
      caller.interviewContent.generateCardOverlay({
        id: uploaded.id,
        setIndex: 0,
        cardIndex: 0,
        headline: "테스트",
      })
    ).rejects.toThrow();
  });
});

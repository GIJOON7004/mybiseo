import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── 테스트 컨텍스트 헬퍼 ──

function createAdminContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
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
  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
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
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

// ── AI 모니터링 테스트 ──

describe("aiMonitor", () => {
  describe("권한 검증", () => {
    it("일반 사용자는 getStats에 접근할 수 없다", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.aiMonitor.getStats()).rejects.toThrow();
    });

    it("비로그인 사용자는 getKeywords에 접근할 수 없다", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.aiMonitor.getKeywords()).rejects.toThrow();
    });

    it("일반 사용자는 addKeyword에 접근할 수 없다", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.aiMonitor.addKeyword({
          keyword: "임플란트",
          hospitalName: "테스트치과",
        })
      ).rejects.toThrow();
    });

    it("일반 사용자는 runCheck에 접근할 수 없다", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.aiMonitor.runCheck({ keywordId: 1 })
      ).rejects.toThrow();
    });

    it("일반 사용자는 deleteKeyword에 접근할 수 없다", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.aiMonitor.deleteKeyword({ id: 1 })
      ).rejects.toThrow();
    });
  });
});

// ── SEO 경쟁사 비교 분석 테스트 ──

describe("seoAnalyzer.compareAnalyze", () => {
  it("공개 프로시저로 접근 가능하다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // 실제 URL 분석은 네트워크 의존이므로 입력 검증만 테스트
    await expect(
      caller.seoAnalyzer.compareAnalyze({
        myUrl: "",
        competitorUrls: ["https://example.com"],
      })
    ).rejects.toThrow(); // 빈 URL은 zod 검증 실패
  });

  it("경쟁사 URL이 최소 1개 필요하다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoAnalyzer.compareAnalyze({
        myUrl: "https://my-hospital.com",
        competitorUrls: [],
      })
    ).rejects.toThrow(); // 빈 배열은 zod 검증 실패
  });

  it("경쟁사 URL은 최대 3개까지 허용된다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoAnalyzer.compareAnalyze({
        myUrl: "https://my-hospital.com",
        competitorUrls: [
          "https://a.com",
          "https://b.com",
          "https://c.com",
          "https://d.com",
        ],
      })
    ).rejects.toThrow(); // 4개는 zod 검증 실패
  });
});

// ── PDF 리포트 생성 테스트 ──

describe("seoAnalyzer.generateReport", () => {
  it("공개 프로시저로 접근 가능하다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // 빈 URL은 zod 검증 실패
    await expect(
      caller.seoAnalyzer.generateReport({ url: "" })
    ).rejects.toThrow();
  });
});

// ── 입력 검증 테스트 ──

describe("aiMonitor 입력 검증", () => {
  it("addKeyword에 빈 keyword는 거부된다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.aiMonitor.addKeyword({
        keyword: "",
        hospitalName: "테스트치과",
      })
    ).rejects.toThrow();
  });

  it("addKeyword에 빈 hospitalName은 거부된다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.aiMonitor.addKeyword({
        keyword: "임플란트",
        hospitalName: "",
      })
    ).rejects.toThrow();
  });

  it("toggleKeyword 입력 검증 — id와 isActive 필수", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // @ts-expect-error 의도적으로 잘못된 입력
    await expect(caller.aiMonitor.toggleKeyword({})).rejects.toThrow();
  });
});

// ── 전체 키워드 자동 모니터링 테스트 ──

describe("aiMonitor.runAutoCheck", () => {
  it("일반 사용자는 runAutoCheck에 접근할 수 없다", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiMonitor.runAutoCheck()).rejects.toThrow();
  });

  it("비로그인 사용자는 runAutoCheck에 접근할 수 없다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiMonitor.runAutoCheck()).rejects.toThrow();
  });
});

// ── SEO 이메일 발송 테스트 ──

describe("seoEmail.sendReport", () => {
  it("이메일 형식이 잘못되면 거부된다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoEmail.sendReport({
        email: "not-an-email",
        url: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("빈 URL은 거부된다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoEmail.sendReport({
        email: "test@example.com",
        url: "",
      })
    ).rejects.toThrow();
  });

  it("유효한 source 값만 허용된다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoEmail.sendReport({
        email: "test@example.com",
        url: "https://example.com",
        // @ts-expect-error 의도적으로 잘못된 source
        source: "invalid_source",
      })
    ).rejects.toThrow();
  });
});

// ── SEO 리드 관리 테스트 ──

describe("seoLeads", () => {
  it("일반 사용자는 getStats에 접근할 수 없다", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.seoLeads.getStats()).rejects.toThrow();
  });

  it("비로그인 사용자는 getAll에 접근할 수 없다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.seoLeads.getAll()).rejects.toThrow();
  });

  it("일반 사용자는 getAll에 접근할 수 없다", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.seoLeads.getAll()).rejects.toThrow();
  });
});

// ── 리드 상태 관리 테스트 (19차) ──

describe("seoLeads.updateStatus", () => {
  it("일반 사용자는 updateStatus에 접근할 수 없다", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoLeads.updateStatus({ id: 1, status: "consulting" })
    ).rejects.toThrow();
  });

  it("비로그인 사용자는 updateStatus에 접근할 수 없다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoLeads.updateStatus({ id: 1, status: "consulting" })
    ).rejects.toThrow();
  });

  it("유효하지 않은 status 값은 거부된다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.seoLeads.updateStatus({
        id: 1,
        // @ts-expect-error 의도적으로 잘못된 status
        status: "invalid_status",
      })
    ).rejects.toThrow();
  });

  it("유효한 status 값은 new, consulting, contracted, lost이다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // 존재하지 않는 ID지만 status 검증은 통과해야 함 (DB 에러는 별개)
    const validStatuses = ["new", "consulting", "contracted", "lost"];
    for (const status of validStatuses) {
      // zod 검증은 통과하므로 DB 에러가 발생할 수 있음 (그것은 OK)
      try {
        await caller.seoLeads.updateStatus({ id: 99999, status: status as any });
      } catch (e: any) {
        // FORBIDDEN이나 BAD_REQUEST가 아닌 에러면 OK (DB 관련 에러)
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });
});

// ── AI 모니터링 트렌드 API 테스트 (19차) ──

describe("aiMonitor.getTrend", () => {
  it("일반 사용자는 getTrend에 접근할 수 없다", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiMonitor.getTrend({ weeks: 4 })).rejects.toThrow();
  });

  it("비로그인 사용자는 getTrend에 접근할 수 없다", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiMonitor.getTrend({ weeks: 4 })).rejects.toThrow();
  });

  it("weeks 파라미터 검증 — 1~52 범위", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.aiMonitor.getTrend({ weeks: 0 })
    ).rejects.toThrow();
    await expect(
      caller.aiMonitor.getTrend({ weeks: 53 })
    ).rejects.toThrow();
  });

  it("관리자는 getTrend에 접근 가능하다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aiMonitor.getTrend({ weeks: 4 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── 후속 이메일 스케줄러 관련 테스트 (19차) ──

describe("리드 후속 이메일 자동화", () => {
  it("seoLeads.getStats는 관리자만 접근 가능하다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.seoLeads.getStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("thisMonth");
    expect(stats).toHaveProperty("byStatus");
  });

  it("seoLeads.getAll은 관리자만 접근 가능하다", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const leads = await caller.seoLeads.getAll({ limit: 10 });
    expect(Array.isArray(leads)).toBe(true);
  });
});

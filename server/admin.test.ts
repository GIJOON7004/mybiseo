import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db
vi.mock("./db", () => ({
  createInquiry: vi.fn().mockResolvedValue(undefined),
  getAllInquiries: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "홍길동",
      phone: "010-1234-5678",
      email: "hong@example.com",
      message: "고객 응대 자동화",
      status: "new",
      createdAt: new Date(),
    },
  ]),
  updateInquiryStatus: vi.fn().mockResolvedValue(undefined),
  deleteInquiry: vi.fn().mockResolvedValue(undefined),
  getInquiryStats: vi.fn().mockResolvedValue({
    total: 5,
    new: 2,
    contacted: 2,
    completed: 1,
    todayNew: 1,
    weekNew: 3,
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./notifier", () => ({
  sendInquiryNotification: vi.fn().mockResolvedValue(true),
  getNotificationChannelStatus: vi.fn().mockReturnValue([
    { name: "manus", enabled: true, label: "앱 내 알림 + 이메일" },
    { name: "kakao", enabled: false, label: "카카오톡 알림톡" },
    { name: "sms", enabled: false, label: "SMS 문자" },
  ]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
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

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "normal-user",
    email: "user@example.com",
    name: "User",
    loginMethod: "manus",
    role: "user",
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

describe("inquiry.list (admin only)", () => {
  it("returns inquiries for admin user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inquiry.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("홍길동");
  });

  it("rejects non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inquiry.list()).rejects.toThrow();
  });

  it("rejects unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inquiry.list()).rejects.toThrow();
  });
});

describe("inquiry.updateStatus (admin only)", () => {
  it("updates status for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inquiry.updateStatus({ id: 1, status: "contacted" });
    expect(result).toEqual({ success: true });
  });

  it("rejects non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.inquiry.updateStatus({ id: 1, status: "contacted" })
    ).rejects.toThrow();
  });
});

describe("inquiry.delete (admin only)", () => {
  it("deletes inquiry for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inquiry.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("rejects non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inquiry.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("notification.channels (admin only)", () => {
  it("returns channel status for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.channels();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0].name).toBe("manus");
    expect(result[0].enabled).toBe(true);
    expect(result[1].name).toBe("kakao");
    expect(result[1].enabled).toBe(false);
    expect(result[2].name).toBe("sms");
    expect(result[2].enabled).toBe(false);
  });

  it("rejects non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.channels()).rejects.toThrow();
  });
});

describe("inquiry.stats (admin only)", () => {
  it("returns stats for admin user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inquiry.stats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("new");
    expect(result).toHaveProperty("contacted");
    expect(result).toHaveProperty("completed");
    expect(result).toHaveProperty("todayNew");
    expect(result).toHaveProperty("weekNew");
    expect(result.total).toBe(5);
  });

  it("rejects non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inquiry.stats()).rejects.toThrow();
  });

  it("rejects unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inquiry.stats()).rejects.toThrow();
  });
});

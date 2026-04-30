import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db and notification
vi.mock("./db", () => ({
  createInquiry: vi.fn().mockResolvedValue(undefined),
  getOrCreateChatSession: vi.fn().mockResolvedValue({ id: 1 }),
  updateChatSessionVisitor: vi.fn().mockResolvedValue(undefined),
  getAllInquiries: vi.fn().mockResolvedValue([]),
  getInquiryStats: vi.fn().mockResolvedValue({ total: 0, new: 0, contacted: 0, completed: 0, todayNew: 0, weekNew: 0 }),
  updateInquiryStatus: vi.fn().mockResolvedValue(undefined),
  deleteInquiry: vi.fn().mockResolvedValue(undefined),
  findChatSessionByPhone: vi.fn().mockImplementation(async (phone: string) => {
    if (phone === "010-1234-5678") {
      return { id: 1, sessionKey: "test-session", visitorName: "홍길동", visitorPhone: "010-1234-5678", visitorEmail: "test@example.com", messageCount: 3, hasInquiry: 1, lastMessageAt: new Date(), createdAt: new Date() };
    }
    return undefined;
  }),
  getChatMessagesBySession: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, role: "user", content: "안녕하세요", createdAt: new Date() },
    { id: 2, sessionId: 1, role: "assistant", content: "안녕하세요! MY비서입니다.", createdAt: new Date() },
    { id: 3, sessionId: 1, role: "user", content: "비용이 궁금합니다", createdAt: new Date() },
  ]),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the notifier to prevent actual SMTP connections
vi.mock("./notifier", () => ({
  sendInquiryNotification: vi.fn().mockResolvedValue(true),
  getNotificationChannelStatus: vi.fn().mockReturnValue([]),
}));

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

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "관리자",
      role: "admin",
      createdAt: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("inquiry.submit", () => {
  it("accepts valid inquiry and returns success", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiry.submit({
      name: "홍길동",
      phone: "010-1234-5678",
      email: "test@example.com",
      message: "고객 응대 자동화를 맡기고 싶습니다.",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects empty name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inquiry.submit({
        name: "",
        phone: "010-1234-5678",
        email: "test@example.com",
        message: "테스트",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inquiry.submit({
        name: "홍길동",
        phone: "010-1234-5678",
        email: "invalid-email",
        message: "테스트",
      })
    ).rejects.toThrow();
  });
});

describe("inquiry.chatHistory", () => {
  it("returns chat messages for a known phone number (admin)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiry.chatHistory({ phone: "010-1234-5678" });

    expect(result.session).not.toBeNull();
    expect(result.session?.visitorPhone).toBe("010-1234-5678");
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content).toBe("안녕하세요");
    expect(result.messages[1].role).toBe("assistant");
  });

  it("returns empty messages for unknown phone number (admin)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiry.chatHistory({ phone: "010-9999-9999" });

    expect(result.session).toBeNull();
    expect(result.messages).toHaveLength(0);
  });

  it("rejects non-admin users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inquiry.chatHistory({ phone: "010-1234-5678" })
    ).rejects.toThrow();
  });
});

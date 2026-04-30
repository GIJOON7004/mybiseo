import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test",
    created: Date.now(),
    model: "test",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "안녕하세요! MY비서입니다. 무엇을 도와드릴까요?",
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

// Mock the DB module so tests pass without a real database
const mockSessions: any[] = [];
const mockMessages: any[] = [];
let sessionIdCounter = 1;
let messageIdCounter = 1;

vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    getDb: vi.fn().mockResolvedValue({}),
    getOrCreateChatSession: vi.fn().mockImplementation(async (sessionKey: string) => {
      let session = mockSessions.find((s) => s.sessionKey === sessionKey);
      if (!session) {
        session = {
          id: sessionIdCounter++,
          sessionKey,
          messageCount: 0,
          showedInquiryForm: false,
          hasInquiry: 0,
          specialty: null,
          intentType: null,
          conversionLikelihood: null,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockSessions.push(session);
      }
      return session;
    }),
    saveChatMessage: vi.fn().mockImplementation(async (sessionId: number, role: string, content: string) => {
      const msg = { id: messageIdCounter++, sessionId, role, content, createdAt: new Date() };
      mockMessages.push(msg);
      const session = mockSessions.find((s) => s.id === sessionId);
      if (session) session.messageCount++;
      return msg;
    }),
    updateChatSessionVisitor: vi.fn().mockResolvedValue(undefined),
    getAllChatSessions: vi.fn().mockImplementation(async () => {
      return mockSessions.map((s) => ({ ...s }));
    }),
    getChatStats: vi.fn().mockImplementation(async () => ({
      totalSessions: mockSessions.length,
      totalMessages: mockMessages.length,
      todaySessions: mockSessions.length,
      withInquiry: mockSessions.filter((s) => s.showedInquiryForm).length,
    })),
    getChatSessionById: vi.fn().mockImplementation(async (id: number) => {
      return mockSessions.find((s) => s.id === id) || undefined;
    }),
    getChatMessagesBySession: vi.fn().mockImplementation(async (sessionId: number) => {
      return mockMessages
        .filter((m) => m.sessionId === sessionId)
        .map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }));
    }),
    deleteChatSession: vi.fn().mockImplementation(async (id: number) => {
      const idx = mockSessions.findIndex((s) => s.id === id);
      if (idx >= 0) mockSessions.splice(idx, 1);
    }),
    recordUserEvent: vi.fn().mockResolvedValue(undefined),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("chat.send", () => {
  const sessionKey = "test_send_" + Date.now().toString(36);

  it("returns a reply from the AI with sessionKey", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "안녕하세요" }],
      sessionKey,
    });

    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("showInquiryForm");
    expect(typeof result.showInquiryForm).toBe("boolean");
  });

  it("rejects empty sessionKey", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chat.send({
        messages: [{ role: "user", content: "테스트" }],
        sessionKey: "",
      })
    ).rejects.toThrow();
  });

  it("detects [SHOW_INQUIRY_FORM] tag and sets showInquiryForm to true", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const mockedInvokeLLM = vi.mocked(invokeLLM);

    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test2",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "더 자세한 상담을 원하시면 무료 상담을 신청해보세요! [SHOW_INQUIRY_FORM]",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [
        { role: "user", content: "비용이 얼마나 드나요?" },
        {
          role: "assistant",
          content: "업종에 따라 다릅니다.",
        },
        { role: "user", content: "좀 더 자세히 알고 싶어요" },
      ],
      sessionKey: "test_form_" + Date.now().toString(36),
    });

    expect(result.showInquiryForm).toBe(true);
    expect(result.reply).not.toContain("[SHOW_INQUIRY_FORM]");
  });

  it("strips [SHOW_INQUIRY_FORM] tag from reply text", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const mockedInvokeLLM = vi.mocked(invokeLLM);

    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test3",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "무료 상담을 신청해보세요! [SHOW_INQUIRY_FORM]",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "상담 받고 싶어요" }],
      sessionKey: "test_strip_" + Date.now().toString(36),
    });

    expect(result.reply).toBe("무료 상담을 신청해보세요!");
    expect(result.showInquiryForm).toBe(true);
  });
});

describe("chat admin procedures", () => {
  const sessionKey = "admin_test_" + Date.now().toString(36);

  // Create a chat session by sending a message
  beforeEach(async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await caller.chat.send({
      messages: [{ role: "user", content: "관리자 테스트 메시지" }],
      sessionKey,
    });
  });

  it("admin can list chat sessions", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.chat.sessions();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
  });

  it("admin can get chat stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.chat.stats();
    expect(stats).toHaveProperty("totalSessions");
    expect(stats).toHaveProperty("totalMessages");
    expect(stats).toHaveProperty("todaySessions");
    expect(stats).toHaveProperty("withInquiry");
    expect(typeof stats.totalSessions).toBe("number");
    expect(stats.totalSessions).toBeGreaterThanOrEqual(1);
  });

  it("admin can view session detail with messages", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.chat.sessions();
    const testSession = sessions.find((s) => s.sessionKey === sessionKey);
    expect(testSession).toBeDefined();

    if (testSession) {
      const detail = await caller.chat.sessionDetail({ id: testSession.id });
      expect(detail).not.toBeNull();
      expect(detail).toHaveProperty("messages");
      expect(Array.isArray(detail!.messages)).toBe(true);
      // Should have at least the user message and the AI reply
      expect(detail!.messages.length).toBeGreaterThanOrEqual(2);
      // Check message structure
      const firstMsg = detail!.messages[0];
      expect(firstMsg).toHaveProperty("role");
      expect(firstMsg).toHaveProperty("content");
      expect(firstMsg).toHaveProperty("createdAt");
    }
  });

  it("admin can delete a chat session", async () => {
    const deleteSessionKey = "delete_test_" + Date.now().toString(36);
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    // Create a session to delete
    await publicCaller.chat.send({
      messages: [{ role: "user", content: "삭제 테스트" }],
      sessionKey: deleteSessionKey,
    });

    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Find the session
    const sessions = await adminCaller.chat.sessions();
    const toDelete = sessions.find((s) => s.sessionKey === deleteSessionKey);
    expect(toDelete).toBeDefined();

    if (toDelete) {
      const result = await adminCaller.chat.deleteSession({ id: toDelete.id });
      expect(result).toEqual({ success: true });
    }
  });

  it("non-admin cannot access chat sessions", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.chat.sessions()).rejects.toThrow();
  });

  it("non-admin cannot access chat stats", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.chat.stats()).rejects.toThrow();
  });

  it("non-admin cannot delete chat session", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.chat.deleteSession({ id: 1 })).rejects.toThrow();
  });
});

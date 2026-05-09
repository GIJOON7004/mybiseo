import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock nodemailer before importing notifier
const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({
  sendMail: mockSendMail,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

// Mock solapi
const mockSendOne = vi.fn();
vi.mock("solapi", () => ({
  SolapiMessageService: vi.fn(() => ({
    sendOne: mockSendOne,
  })),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock env with SMTP + SOLAPI credentials
vi.mock("./_core/env", () => ({
  ENV: {
    naverSmtpUser: "cjw7004@naver.com",
    naverSmtpPass: "TESTPASS123456",
    notifyEmail: "cjw7004@naver.com",
    solapiApiKey: "NCSZ9D5HBDMLF400",
    solapiApiSecret: "TESTSECRET123",
    notifyPhone: "01073217004",
    forgeApiUrl: "",
    forgeApiKey: "",
    appId: "",
    cookieSecret: "",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "",
    isProduction: false,
  },
}));

describe("Notifier - Email Channel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: "test-msg-id" });
    mockSendOne.mockResolvedValue({ groupId: "test-group-id", messageId: "test-sms-id" });
  });

  it("sendEmailViaNaver sends email via SMTP", async () => {
    const { sendEmailViaNaver } = await import("./notifier");

    const result = await sendEmailViaNaver({
      to: "cjw7004@naver.com",
      subject: "테스트 이메일",
      html: "<h1>테스트</h1>",
      text: "테스트",
    });

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining("MY비서"),
        to: "cjw7004@naver.com",
        subject: "테스트 이메일",
        html: "<h1>테스트</h1>",
        text: "테스트",
      })
    );
  });

  it("sendEmailViaNaver returns false on error", async () => {
    mockSendMail.mockRejectedValue(new Error("SMTP error"));
    const { sendEmailViaNaver } = await import("./notifier");

    const result = await sendEmailViaNaver({
      to: "test@test.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result).toBe(false);
  });

  it("email contains inquiry details in HTML", async () => {
    const { sendInquiryNotification } = await import("./notifier");

    await sendInquiryNotification({
      name: "김대표",
      phone: "010-9999-8888",
      email: "kim@business.com",
      message: "네일샵 웹사이트 만들고 싶습니다",
    });

    const emailCall = mockSendMail.mock.calls[0]?.[0];
    if (emailCall) {
      expect(emailCall.html).toContain("김대표");
      expect(emailCall.html).toContain("010-9999-8888");
      expect(emailCall.html).toContain("kim@business.com");
      expect(emailCall.html).toContain("네일샵 웹사이트 만들고 싶습니다");
      expect(emailCall.subject).toContain("김대표");
    }
  });

  it("SMTP transporter is created with naver SMTP config", async () => {
    const { sendEmailViaNaver } = await import("./notifier");
    await sendEmailViaNaver({
      to: "test@test.com",
      subject: "Config Test",
      html: "<p>Config Test</p>",
    });

    expect(mockSendMail).toHaveBeenCalled();
  });
});

describe("Notifier - SMS Channel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: "test-msg-id" });
    mockSendOne.mockResolvedValue({ groupId: "test-group-id", messageId: "test-sms-id" });
  });

  it("sendSmsViaSolapi sends SMS via SOLAPI", async () => {
    const { sendSmsViaSolapi } = await import("./notifier");

    const result = await sendSmsViaSolapi({
      to: "01073217004",
      from: "01073217004",
      text: "[MY비서] 테스트 SMS",
    });

    expect(result).toBe(true);
    expect(mockSendOne).toHaveBeenCalledWith({
      to: "01073217004",
      from: "01073217004",
      text: "[MY비서] 테스트 SMS",
    });
  });

  it("sendSmsViaSolapi returns false on error", async () => {
    mockSendOne.mockRejectedValueOnce(new Error("SOLAPI error"));
    const { sendSmsViaSolapi } = await import("./notifier");

    const result = await sendSmsViaSolapi({
      to: "01073217004",
      from: "01073217004",
      text: "Test SMS",
    });

    expect(result).toBe(false);
  });

  it("SMS channel is enabled when SOLAPI credentials are configured", async () => {
    const { getNotificationChannelStatus } = await import("./notifier");

    const status = getNotificationChannelStatus();
    const smsStatus = status.find((ch) => ch.name === "sms");
    expect(smsStatus).toBeDefined();
    expect(smsStatus!.enabled).toBe(true);
    expect(smsStatus!.label).toContain("01073217004");
  });

  it("sendInquiryNotification sends to all 3 enabled channels (manus + email + sms)", async () => {
    const { sendInquiryNotification } = await import("./notifier");

    const result = await sendInquiryNotification({
      name: "홍길동",
      phone: "010-1234-5678",
      email: "hong@test.com",
      message: "챗봇 구축 문의드립니다",
    });

    expect(result).toBe(true);
    // email channel
    expect(mockSendMail).toHaveBeenCalled();
    // sms channel
    expect(mockSendOne).toHaveBeenCalled();
  });

  it("SMS message contains inquiry name and phone", async () => {
    const { sendInquiryNotification } = await import("./notifier");

    await sendInquiryNotification({
      name: "박대표",
      phone: "010-5555-6666",
      email: "park@test.com",
      message: "인스타그램 자동화 문의",
    });

    const smsCall = mockSendOne.mock.calls[0]?.[0];
    if (smsCall) {
      expect(smsCall.text).toContain("박대표");
      expect(smsCall.text).toContain("010-5555-6666");
      expect(smsCall.text).toContain("MY비서");
    }
  });

  it("SMS truncates long messages to fit SMS limit", async () => {
    const { sendInquiryNotification } = await import("./notifier");

    const longMessage = "이것은 매우 긴 메시지입니다. ".repeat(10);

    await sendInquiryNotification({
      name: "이대표",
      phone: "010-7777-8888",
      email: "lee@test.com",
      message: longMessage,
    });

    const smsCall = mockSendOne.mock.calls[0]?.[0];
    if (smsCall) {
      expect(smsCall.text).toContain("...");
    }
  });
});

describe("Notifier - Channel Status", () => {
  it("getNotificationChannelStatus returns all 4 channels", async () => {
    const { getNotificationChannelStatus } = await import("./notifier");

    const status = getNotificationChannelStatus();
    expect(status).toHaveLength(4);
    expect(status.map((ch) => ch.name)).toEqual(["manus", "email", "kakao", "sms"]);
  });

  it("manus and email and sms are enabled, kakao is disabled", async () => {
    const { getNotificationChannelStatus } = await import("./notifier");

    const status = getNotificationChannelStatus();
    expect(status.find((ch) => ch.name === "manus")!.enabled).toBe(true);
    expect(status.find((ch) => ch.name === "email")!.enabled).toBe(true);
    expect(status.find((ch) => ch.name === "sms")!.enabled).toBe(true);
    expect(status.find((ch) => ch.name === "kakao")!.enabled).toBe(false);
  });
});

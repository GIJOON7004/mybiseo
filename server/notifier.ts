import { createLogger } from "./lib/logger";
const logger = createLogger("notifier");
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import nodemailer from "nodemailer";
import { SolapiMessageService } from "solapi";

/**
 * 알림 채널 인터페이스
 * 카카오톡, SMS, 이메일 등 다양한 채널을 추가할 수 있도록 모듈화
 */
export interface NotificationChannel {
  name: string;
  enabled: boolean;
  send(payload: InquiryNotificationPayload): Promise<boolean>;
}

export interface InquiryNotificationPayload {
  name: string;
  phone: string;
  email: string;
  message: string;
}

// ─── 네이버 SMTP 트랜스포터 (싱글턴) ───
let _transporter: nodemailer.Transporter | null = null;

function getNaverTransporter(): nodemailer.Transporter | null {
  if (!ENV.naverSmtpUser || !ENV.naverSmtpPass) {
    logger.warn("[email] NAVER_SMTP_USER or NAVER_SMTP_PASS not configured");
    return null;
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: "smtp.naver.com",
      port: 465,
      secure: true,
      auth: {
        user: ENV.naverSmtpUser,
        pass: ENV.naverSmtpPass,
      },
      // 타임아웃 설정
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return _transporter;
}

/**
 * 네이버 SMTP를 통해 이메일을 발송합니다.
 * 테스트용으로도 사용 가능합니다.
 */
export async function sendEmailViaNaver(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  maxRetries?: number;
}): Promise<boolean> {
  const transporter = getNaverTransporter();
  if (!transporter) return false;

  const maxRetries = options.maxRetries ?? 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"MY비서 알림" <${ENV.naverSmtpUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      logger.info(`[email] Sent successfully (attempt ${attempt}): ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`[email] Attempt ${attempt}/${maxRetries} failed`, { error: String(error) });
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 1s, 2s, 4s...
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  logger.error(`[email] All ${maxRetries} attempts exhausted for: ${options.to}`);
  return false;
}

// ─── SOLAPI SMS 클라이언트 (싱글턴) ───
let _solapiClient: SolapiMessageService | null = null;

function getSolapiClient(): SolapiMessageService | null {
  if (!ENV.solapiApiKey || !ENV.solapiApiSecret) {
    logger.warn("[sms] SOLAPI_API_KEY or SOLAPI_API_SECRET not configured");
    return null;
  }
  if (!_solapiClient) {
    _solapiClient = new SolapiMessageService(ENV.solapiApiKey, ENV.solapiApiSecret);
  }
  return _solapiClient;
}

/**
 * SOLAPI를 통해 SMS를 발송합니다.
 * 테스트용으로도 사용 가능합니다.
 */
export async function sendSmsViaSolapi(options: {
  to: string;
  from: string;
  text: string;
}): Promise<boolean> {
  const client = getSolapiClient();
  if (!client) return false;

  try {
    const result = await client.sendOne({
      to: options.to,
      from: options.from,
      text: options.text,
    });
    logger.info(`[sms] Sent successfully:`, result);
    return true;
  } catch (error) {
    console.error("[Notifier:sms] Failed to send:", error);
    return false;
  }
}

// ─── 채널 1: Manus 내장 알림 (앱 내 알림) ───
const manusChannel: NotificationChannel = {
  name: "manus",
  enabled: true,
  async send(payload) {
    const title = `[MY비서] 새 무료 상담 신청 — ${payload.name}님`;
    const content = [
      `━━━━━━━━━━━━━━━━━━━━`,
      `📋 새 무료 상담 신청이 접수되었습니다.`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `■ 성함: ${payload.name}`,
      `■ 연락처: ${payload.phone}`,
      `■ 이메일: ${payload.email}`,
      ``,
      `■ 맡기고 싶은 업무:`,
      `${payload.message}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `관리자 대시보드에서 확인하세요: /admin`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ].join("\n");

    try {
      return await notifyOwner({ title, content });
    } catch (error) {
      console.error("[Notifier:manus] Failed:", error);
      return false;
    }
  },
};

// ─── 채널 2: 네이버 SMTP 이메일 ───
const emailChannel: NotificationChannel = {
  name: "email",
  enabled: true,
  async send(payload) {
    const toEmail = ENV.notifyEmail || ENV.naverSmtpUser;
    if (!toEmail) {
      logger.warn("[email] No recipient email configured");
      return false;
    }

    const subject = `[MY비서] 새 무료 상담 신청 — ${payload.name}님`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📋 새 무료 상담 신청</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">MY비서 웹사이트에서 새로운 상담 신청이 접수되었습니다.</p>
  </div>
  <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 80px;">성함</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; font-weight: 600;">${payload.name}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">연락처</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px;">
          <a href="tel:${payload.phone}" style="color: #6366f1; text-decoration: none;">${payload.phone}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">이메일</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px;">
          <a href="mailto:${payload.email}" style="color: #6366f1; text-decoration: none;">${payload.email}</a>
        </td>
      </tr>
    </table>
    <div style="margin-top: 16px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 600;">💬 맡기고 싶은 업무</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${payload.message}</p>
    </div>
    <div style="margin-top: 20px; text-align: center;">
      <a href="https://mybiseo.com/admin" style="display: inline-block; padding: 10px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">관리자 대시보드에서 확인하기</a>
    </div>
  </div>
  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">이 메일은 MY비서(mybiseo.com)에서 자동 발송되었습니다.</p>
</body>
</html>`.trim();

    const text = [
      `[MY비서] 새 무료 상담 신청`,
      ``,
      `성함: ${payload.name}`,
      `연락처: ${payload.phone}`,
      `이메일: ${payload.email}`,
      ``,
      `맡기고 싶은 업무:`,
      `${payload.message}`,
      ``,
      `관리자 대시보드: https://mybiseo.com/admin`,
    ].join("\n");

    return sendEmailViaNaver({ to: toEmail, subject, html, text });
  },
};

// ─── 채널 3: 카카오톡 알림톡 (추후 연동) ───
const kakaoChannel: NotificationChannel = {
  name: "kakao",
  enabled: false,
  async send(payload) {
    console.log("[Notifier:kakao] Channel not yet configured");
    return false;
  },
};

// ─── 채널 4: SMS (SOLAPI) ───
const smsChannel: NotificationChannel = {
  name: "sms",
  enabled: !!(ENV.solapiApiKey && ENV.solapiApiSecret && ENV.notifyPhone),
  async send(payload) {
    const toPhone = ENV.notifyPhone;
    if (!toPhone) {
      logger.warn("[sms] NOTIFY_PHONE not configured");
      return false;
    }

    // 발신번호 = 수신번호 (본인 번호로 발신)
    const fromPhone = toPhone;

    // SMS는 90바이트(한글 약 45자) 제한이므로 핵심 정보만 간결하게
    const text = [
      `[MY비서] 새 상담 신청`,
      `성함: ${payload.name}`,
      `연락처: ${payload.phone}`,
      `업무: ${payload.message.length > 30 ? payload.message.slice(0, 30) + "..." : payload.message}`,
    ].join("\n");

    return sendSmsViaSolapi({ to: toPhone, from: fromPhone, text });
  },
};

// ─── 등록된 알림 채널 목록 ───
const channels: NotificationChannel[] = [
  manusChannel,
  emailChannel,
  kakaoChannel,
  smsChannel,
];

/**
 * 모든 활성화된 채널로 알림을 발송합니다.
 * 하나라도 성공하면 true를 반환합니다.
 */
export async function sendInquiryNotification(
  payload: InquiryNotificationPayload
): Promise<boolean> {
  const enabledChannels = channels.filter((ch) => ch.enabled);

  if (enabledChannels.length === 0) {
    console.warn("[Notifier] No enabled notification channels");
    return false;
  }

  const results = await Promise.allSettled(
    enabledChannels.map((ch) =>
      ch.send(payload).catch((err) => {
        console.error(`[Notifier:${ch.name}] Error:`, err);
        return false;
      })
    )
  );

  const anySuccess = results.some(
    (r) => r.status === "fulfilled" && r.value === true
  );

  const summary = enabledChannels
    .map((ch, i) => {
      const r = results[i];
      const ok = r.status === "fulfilled" && r.value === true;
      return `${ch.name}:${ok ? "OK" : "FAIL"}`;
    })
    .join(", ");

  console.log(`[Notifier] Sent to ${enabledChannels.length} channels — ${summary}`);

  return anySuccess;
}

/**
 * 현재 알림 채널 상태를 반환합니다 (관리자 대시보드용).
 */
export function getNotificationChannelStatus() {
  return channels.map((ch) => ({
    name: ch.name,
    enabled: ch.enabled,
    label:
      ch.name === "manus"
        ? "앱 내 알림"
        : ch.name === "email"
          ? `이메일 (${ENV.notifyEmail || ENV.naverSmtpUser || "미설정"})`
          : ch.name === "kakao"
            ? "카카오톡 알림톡"
            : ch.name === "sms"
              ? `SMS (${ENV.notifyPhone || "미설정"})`
              : ch.name,
  }));
}

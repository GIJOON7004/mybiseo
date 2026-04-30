import { notifyOwner } from "./_core/notification";

/**
 * 문의 접수 시 오너에게 상세 알림을 보냅니다.
 * Manus 내장 알림 시스템을 통해 즉시 전달됩니다.
 * (Settings > Notifications에서 이메일 알림을 활성화하면 이메일로도 수신)
 */
export async function sendInquiryNotification(inquiry: {
  name: string;
  phone: string;
  email: string;
  message: string;
}): Promise<boolean> {
  const title = `[MY비서] 새 무료 상담 신청 — ${inquiry.name}님`;

  const content = [
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 새 무료 상담 신청이 접수되었습니다.`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `■ 성함: ${inquiry.name}`,
    `■ 연락처: ${inquiry.phone}`,
    `■ 이메일: ${inquiry.email}`,
    ``,
    `■ 맡기고 싶은 업무:`,
    `${inquiry.message}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `관리자 대시보드에서 확인하세요: /admin`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

  try {
    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("[EmailNotify] Failed to send notification:", error);
    return false;
  }
}

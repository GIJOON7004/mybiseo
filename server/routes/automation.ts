import { getErrorMessage } from "../lib/errors";
/**
 * automation 라우터
 * routers.ts에서 분할 — automation
 */

import { protectedProcedure, router } from "../_core/trpc";
import {
  createAutomationLog, createAutomationRule, deleteAutomationRule, getAutomationLogsByUser,
  getAutomationRulesByUser, getHospitalProfileByUserId, updateAutomationRule, upsertEmailContact,
} from "../db";
import { sendEmailViaNaver } from "../notifier";
import { z } from "zod";

export const automationRouter = router({
  createRule: protectedProcedure.input(z.object({
    ruleType: z.enum(["booking_confirm", "reminder_d1", "review_request_d3", "monthly_report"]),
    name: z.string(),
    channel: z.enum(["email", "sms", "kakao"]).default("email"),
    templateContent: z.string().optional(),
    triggerConfig: z.any().optional(),
  })).mutation(async ({ input, ctx }) => {
    return createAutomationRule({ ...input, userId: ctx.user.id });
  }),

  listRules: protectedProcedure.query(async ({ ctx }) => {
    return getAutomationRulesByUser(ctx.user.id);
  }),

  updateRule: protectedProcedure.input(z.object({
    id: z.number(),
    data: z.object({
      name: z.string().optional(),
      enabled: z.boolean().optional(),
      channel: z.enum(["email", "sms", "kakao"]).optional(),
      templateContent: z.string().optional(),
      triggerConfig: z.any().optional(),
    }),
  })).mutation(async ({ input }) => {
    return updateAutomationRule(input.id, input.data);
  }),

  deleteRule: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteAutomationRule(input.id);
    return { success: true };
  }),

  toggleRule: protectedProcedure.input(z.object({ id: z.number(), enabled: z.boolean() })).mutation(async ({ input }) => {
    return updateAutomationRule(input.id, { enabled: input.enabled });
  }),

  getLogs: protectedProcedure.input(z.object({ limit: z.number().default(50) })).query(async ({ ctx, input }) => {
    return getAutomationLogsByUser(ctx.user.id, input.limit);
  }),

  sendBookingConfirm: protectedProcedure.input(z.object({
    patientName: z.string(),
    patientEmail: z.string(),
    treatmentName: z.string(),
    appointmentDate: z.string(),
    appointmentTime: z.string(),
    hospitalName: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    const hName = input.hospitalName || profile?.hospitalName || "MY비서 파트너 병원";
    const subject = `[예약 확인] ${hName} - ${input.treatmentName}`;
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6B46C1">${hName}</h2>
      <p>${input.patientName}님, 예약이 확인되었습니다.</p>
      <div style="background:#f9f5ff;border-radius:12px;padding:20px;margin:16px 0">
        <p><strong>시술:</strong> ${input.treatmentName}</p>
        <p><strong>날짜:</strong> ${input.appointmentDate}</p>
        <p><strong>시간:</strong> ${input.appointmentTime}</p>
      </div>
      <p style="color:#666;font-size:14px">예약 변경이 필요하시면 병원으로 연락해 주세요.</p>
    </div>`;
    try {
      await sendEmailViaNaver({ to: input.patientEmail, subject, html });
      await upsertEmailContact({ email: input.patientEmail, name: input.patientName, source: "consultation", tags: ["patient", "booking"] });
      await createAutomationLog({ ruleId: 0, userId: ctx.user.id, recipientEmail: input.patientEmail, channel: "email", status: "sent", metadata: { type: "booking_confirm", treatment: input.treatmentName } });
      return { success: true };
    } catch (e: unknown) {
      await createAutomationLog({ ruleId: 0, userId: ctx.user.id, recipientEmail: input.patientEmail, channel: "email", status: "failed", errorMessage: getErrorMessage(e) });
      return { success: false, error: getErrorMessage(e) };
    }
  }),

  sendReminder: protectedProcedure.input(z.object({
    patientName: z.string(),
    patientEmail: z.string(),
    treatmentName: z.string(),
    appointmentDate: z.string(),
    appointmentTime: z.string(),
    hospitalName: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    const hName = input.hospitalName || profile?.hospitalName || "MY비서 파트너 병원";
    const subject = `[내일 예약] ${hName} - ${input.treatmentName} 안내`;
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6B46C1">내일 예약 안내</h2>
      <p>${input.patientName}님, 내일 예약이 있습니다.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:16px 0">
        <p><strong>시술:</strong> ${input.treatmentName}</p>
        <p><strong>날짜:</strong> ${input.appointmentDate}</p>
        <p><strong>시간:</strong> ${input.appointmentTime}</p>
      </div>
      <p style="color:#666;font-size:14px">시술 전 주의사항을 미리 확인해 주세요.</p>
    </div>`;
    try {
      await sendEmailViaNaver({ to: input.patientEmail, subject, html });
      await createAutomationLog({ ruleId: 0, userId: ctx.user.id, recipientEmail: input.patientEmail, channel: "email", status: "sent", metadata: { type: "reminder_d1" } });
      return { success: true };
    } catch (e: unknown) {
      await createAutomationLog({ ruleId: 0, userId: ctx.user.id, recipientEmail: input.patientEmail, channel: "email", status: "failed", errorMessage: getErrorMessage(e) });
      return { success: false, error: getErrorMessage(e) };
    }
  }),

  sendReviewRequest: protectedProcedure.input(z.object({
    patientName: z.string(),
    patientEmail: z.string(),
    treatmentName: z.string(),
    hospitalName: z.string().optional(),
    reviewUrl: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    const hName = input.hospitalName || profile?.hospitalName || "MY비서 파트너 병원";
    const subject = `${hName} - ${input.treatmentName} 시술 후기 부탁드립니다`;
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6B46C1">시술 후기 부탁드립니다</h2>
      <p>${input.patientName}님, ${input.treatmentName} 시술은 만족스러우셨나요?</p>
      <p>소중한 후기를 남겨주시면 다른 환자분들에게 큰 도움이 됩니다.</p>
      ${input.reviewUrl ? `<a href="${input.reviewUrl}" style="display:inline-block;background:#6B46C1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">후기 작성하기</a>` : ""}
      <p style="color:#666;font-size:14px">감사합니다. ${hName} 드림</p>
    </div>`;
    try {
      await sendEmailViaNaver({ to: input.patientEmail, subject, html });
      await upsertEmailContact({ email: input.patientEmail, name: input.patientName, source: "consultation", tags: ["patient", "review_requested"] });
      await createAutomationLog({ ruleId: 0, userId: ctx.user.id, recipientEmail: input.patientEmail, channel: "email", status: "sent", metadata: { type: "review_request" } });
      return { success: true };
    } catch (e: unknown) {
      await createAutomationLog({ ruleId: 0, userId: ctx.user.id, recipientEmail: input.patientEmail, channel: "email", status: "failed", errorMessage: getErrorMessage(e) });
      return { success: false, error: getErrorMessage(e) };
    }
  }),
});

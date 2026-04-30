/**
 * engagement 라우터
 * routers.ts에서 분할 — inquiry, kakaoBooking, aiSnsTips
 */

import { invokeLLM } from "../_core/llm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBookingSlot, createInquiry, deleteBookingSlot, deleteInquiry,
  findChatSessionByPhone, getAllInquiries, getBookingSettings, getBookingSlots,
  getChatMessagesBySession, getInquiryStats, getOrCreateChatSession, updateBookingSlot,
  updateChatSessionVisitor, updateInquiryStatus, upsertBookingSettings,
} from "../db";
import { sendInquiryNotification } from "../notifier";
import { analyzeSeo, type CountryCode } from "../seo-analyzer";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const inquiryRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "성함을 입력해주세요"),
        phone: z.string().min(1, "연락처를 입력해주세요"),
        email: z.string().email("올바른 이메일을 입력해주세요"),
        message: z.string().min(1, "문의 내용을 입력해주세요"),
        sessionKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createInquiry({
        name: input.name,
        phone: input.phone,
        email: input.email,
        message: input.message,
      });

      // 챗봇 세션이 있으면 방문자 정보 연결
      if (input.sessionKey) {
        try {
          const session = await getOrCreateChatSession(input.sessionKey);
          await updateChatSessionVisitor(session.id, {
            name: input.name,
            phone: input.phone,
            email: input.email,
          });
        } catch (e) {
          console.warn("[Chat] Failed to link session to inquiry:", e);
        }
      }

      await sendInquiryNotification({
        name: input.name,
        phone: input.phone,
        email: input.email,
        message: input.message,
      });

      return { success: true } as const;
    }),

  list: adminProcedure.query(async () => {
    return getAllInquiries();
  }),

  stats: adminProcedure.query(async () => {
    return getInquiryStats();
  }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateInquiryStatus(input.id, input.status);
      return { success: true } as const;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInquiry(input.id);
      return { success: true } as const;
    }),

  // 관리자: 문의 고객의 채팅 대화 내역 조회 (전화번호 기반)
  chatHistory: adminProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }) => {
      const session = await findChatSessionByPhone(input.phone);
      if (!session) return { session: null, messages: [] };
      const messages = await getChatMessagesBySession(session.id);
      return { session, messages };
    }),
});

export const kakaoBookingRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return getBookingSettings(ctx.user.id);
  }),
  upsertSettings: protectedProcedure.input(z.object({
    kakaoChannelId: z.string().optional(),
    kakaoChannelName: z.string().optional(),
    kakaoChannelUrl: z.string().optional(),
    isActive: z.boolean().optional(),
    defaultDuration: z.number().min(5).max(300).optional(),
    maxDailySlots: z.number().min(1).max(100).optional(),
    workingHoursStart: z.string().optional(),
    workingHoursEnd: z.string().optional(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional(),
    closedDays: z.array(z.number().min(0).max(6)).optional(),
    bookingNotice: z.string().optional(),
    autoConfirm: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    return upsertBookingSettings(ctx.user.id, input as any);
  }),
  getSlots: protectedProcedure.query(async ({ ctx }) => {
    const settings = await getBookingSettings(ctx.user.id);
    if (!settings) return [];
    return getBookingSlots(ctx.user.id, settings.id);
  }),
  createSlot: protectedProcedure.input(z.object({
    treatmentName: z.string().min(1),
    treatmentCategory: z.string().optional(),
    duration: z.number().min(5).max(300),
    price: z.number().optional(),
    priceNote: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const settings = await getBookingSettings(ctx.user.id);
    if (!settings) throw new TRPCError({ code: "BAD_REQUEST", message: "예약 설정을 먼저 완료해주세요." });
    return createBookingSlot({ ...input, userId: ctx.user.id, settingId: settings.id } as any);
  }),
  updateSlot: protectedProcedure.input(z.object({
    id: z.number(),
    treatmentName: z.string().optional(),
    treatmentCategory: z.string().optional(),
    duration: z.number().min(5).max(300).optional(),
    price: z.number().optional(),
    priceNote: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return updateBookingSlot(id, ctx.user.id, data as any);
  }),
  deleteSlot: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteBookingSlot(input.id, ctx.user.id);
  }),
  // 퍼블릭 API: 예약 가능 시간 조회 (slug 기반)
  getPublicSlots: publicProcedure.input(z.object({
    hospitalSlug: z.string(),
  })).query(async ({ input }) => {
    // hospitalSlug로 병원 프로필 찾고, 해당 병원의 예약 설정/슬롯 반환
    const db = (await import("../db")).getDb;
    return { message: "예약 시스템 준비 중입니다.", slots: [] };
  }),
});

export const aiSnsTipsRouter = router({
  generate: protectedProcedure
    .input(z.object({
      url: z.string().min(1),
      specialty: z.string().optional(),
      country: z.enum(["kr", "th"]).optional().default("kr"),
      diagnosticResult: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = input.diagnosticResult || await analyzeSeo(input.url, input.specialty, input.country as CountryCode);
      const failedItems = result.categories?.flatMap((c: any) => c.items?.filter((i: any) => i.status === "fail" || i.status === "warning").map((i: any) => `[${c.name}] ${i.name}: ${i.detail || i.message}`)) || [];
      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: `당신은 병원 SNS 마케팅 전략가 10년차입니다. 아래 SEO 진단 결과를 바탕으로 각 SNS 채널별 구체적이고 즉시 실행 가능한 마케팅 팁을 작성합니다.

## 진단 결과
- URL: ${result.url || input.url}
- 종합 점수: ${result.totalScore}점 (${result.grade})
- 진료과: ${input.specialty || "미지정"}
- 국가: ${input.country === "th" ? "태국" : "한국"}

## 문제점
${failedItems.slice(0, 10).join("\n")}

## 작성 원칙
- 각 플랫폼별로 실제 포스팅 예시문구를 contentIdeas에 포함하세요 (복사해서 바로 쓸 수 있는 수준)
- keywords는 환자가 실제 검색하는 구어체 키워드로 (예: '강남 피부과 추천', '여드름 치료 방법')
- frequency는 구체적인 요일과 시간대까지 제안 (예: '화/목 오전 10시')
- 의료광고법 준수: 과장 표현 금지, 전후 사진 주의사항 안내

JSON 형식으로 응답해주세요.` },
          { role: "user", content: "각 SNS 채널별 구체적인 마케팅 팁을 생성해주세요." }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sns_marketing_tips",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tips: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string", description: "플랫폼명 (네이버 블로그/인스타그램/카카오 톡채널/구글 비즈니스 프로필/YouTube)" },
                      title: { type: "string", description: "팁 제목" },
                      description: { type: "string", description: "구체적인 실행 방법 (3~5문장)" },
                      keywords: { type: "array", items: { type: "string" }, description: "추천 키워드 3~5개" },
                      frequency: { type: "string", description: "권장 발행 빈도" },
                      contentIdeas: { type: "array", items: { type: "string" }, description: "콘텐츠 아이디어 3개" },
                      priority: { type: "string", description: "우선순위 (높음/중간/낮음)" }
                    },
                    required: ["platform", "title", "description", "keywords", "frequency", "contentIdeas", "priority"],
                    additionalProperties: false
                  }
                },
                overallStrategy: { type: "string", description: "전체 SNS 전략 요약 (2~3문장)" }
              },
              required: ["tips", "overallStrategy"],
              additionalProperties: false
            }
          }
        }
      });
      const aiData = JSON.parse(typeof aiResponse.choices[0].message.content === "string" ? aiResponse.choices[0].message.content : "{}");
      return aiData;
    }),
});

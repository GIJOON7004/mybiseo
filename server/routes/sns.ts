/**
 * sns 라우터
 * routers.ts에서 분할 — sns
 */

import { invokeLLM } from "../_core/llm";
import { injectMedicalGuard } from "../lib/medical-law-gate";
import { adminProcedure, router } from "../_core/trpc";
import { createSnsContent, deleteSnsContent, getAllSnsContents } from "../db";
import { z } from "zod";
import { SNS_CAPTION_PROMPT, SNS_GUIDE_PROMPT, SNS_PROMOTION_PROMPT } from "./_shared";

export const snsRouter = router({
  generateCaption: adminProcedure
    .input(z.object({
      industry: z.string().min(1),
      topic: z.string().min(1),
      tone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userMessage = `업종: ${input.industry}
주제: ${input.topic}
${input.tone ? `톤: ${input.tone}` : "톤: 친근하고 전문적인"}

위 정보로 인스타그램 캡션 + 해시태그 + 카카오톡 문구를 생성해주세요.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: injectMedicalGuard(SNS_CAPTION_PROMPT) },
          { role: "user", content: userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sns_caption",
            strict: true,
            schema: {
              type: "object",
              properties: {
                instagramCaption: { type: "string" },
                hashtags: { type: "string" },
                kakaoMessage: { type: "string" },
              },
              required: ["instagramCaption", "hashtags", "kakaoMessage"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");

      await createSnsContent({
        type: "caption",
        input: JSON.stringify(input),
        output: typeof content === "string" ? content : "{}",
      });

      return parsed;
    }),

  generatePromotion: adminProcedure
    .input(z.object({
      industry: z.string().min(1),
      promotionDetail: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const userMessage = `업종: ${input.industry}
프로모션/이벤트 내용: ${input.promotionDetail}

위 정보로 인스타그램/카카오톡/블로그/배너용 프로모션 문구를 생성해주세요.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: injectMedicalGuard(SNS_PROMOTION_PROMPT) },
          { role: "user", content: userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sns_promotion",
            strict: true,
            schema: {
              type: "object",
              properties: {
                instagram: { type: "string" },
                kakao: { type: "string" },
                blog: { type: "string" },
                banner: { type: "string" },
              },
              required: ["instagram", "kakao", "blog", "banner"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");

      await createSnsContent({
        type: "promotion",
        input: JSON.stringify(input),
        output: typeof content === "string" ? content : "{}",
      });

      return parsed;
    }),

  generateGuide: adminProcedure
    .input(z.object({
      industry: z.string().min(1),
      focus: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userMessage = `업종: ${input.industry}
${input.focus ? `특별 포커스: ${input.focus}` : ""}

위 업종에 맞는 이번 주 SNS 콘텐츠 종합 가이드를 생성해주세요.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: injectMedicalGuard(SNS_GUIDE_PROMPT) },
          { role: "user", content: userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sns_guide",
            strict: true,
            schema: {
              type: "object",
              properties: {
                instagramCaption: { type: "string" },
                hashtags: { type: "string" },
                weeklyThemes: { type: "string" },
                blogOutline: { type: "string" },
              },
              required: ["instagramCaption", "hashtags", "weeklyThemes", "blogOutline"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");

      await createSnsContent({
        type: "guide",
        input: JSON.stringify(input),
        output: typeof content === "string" ? content : "{}",
      });

      return parsed;
    }),

  history: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getAllSnsContents(input?.limit ?? 50);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSnsContent(input.id);
      return { success: true } as const;
    }),
});

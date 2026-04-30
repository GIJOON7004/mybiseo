/**
 * chat 라우터
 * routers.ts에서 분할 — chat, chatInsight
 */

import { invokeLLM } from "../_core/llm";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  deleteChatSession, getAllChatSessions, getChatInsightStats, getChatMessagesBySession,
  getChatSessionById, getChatStats, getOrCreateChatSession, getSessionsWithoutInsight,
  saveChatMessage, updateChatSessionInsight,
} from "../db";
import { z } from "zod";
import { CHATBOT_SYSTEM_PROMPT } from "./_shared";

export const chatRouter = router({
  send: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
        sessionKey: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      // 세션 가져오기/생성
      const session = await getOrCreateChatSession(input.sessionKey);

      // 마지막 사용자 메시지 저장
      const lastUserMsg = input.messages[input.messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === "user") {
        await saveChatMessage(session.id, "user", lastUserMsg.content);
      }

      // 최근 10개 메시지만 LLM에 전달 (토큰 초과 방지)
      const recentMessages = input.messages.slice(-10);
      const llmMessages = [
        { role: "system" as const, content: CHATBOT_SYSTEM_PROMPT },
        ...recentMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // LLM 호출 + 재시도 로직 (1회 재시도)
      let result;
      try {
        result = await invokeLLM({ messages: llmMessages });
      } catch (firstError) {
        console.error("[ChatBot] LLM 1차 호출 실패:", firstError);
        try {
          // 1초 대기 후 재시도
          await new Promise((r) => setTimeout(r, 1000));
          result = await invokeLLM({ messages: llmMessages });
        } catch (retryError) {
          console.error("[ChatBot] LLM 재시도 실패:", retryError);
          const fallbackReply = "죄송합니다, 잠시 연결이 불안정합니다.\n\n📞 직접 문의: cjw7004@naver.com\n👉 또는 하단 무료 상담 폼을 이용해주세요!";
          await saveChatMessage(session.id, "assistant", fallbackReply);
          return {
            reply: fallbackReply,
            showInquiryForm: true,
          };
        }
      }

      const content = result.choices[0]?.message?.content;
      const text = typeof content === "string" ? content : "";

      const showForm = text.includes("[SHOW_INQUIRY_FORM]");
      const cleanText = text.replace(/\[SHOW_INQUIRY_FORM\]/g, "").trim();

      // AI 응답 저장
      await saveChatMessage(session.id, "assistant", cleanText);

      return {
        reply: cleanText,
        showInquiryForm: showForm,
      };
    }),

  // 관리자: 대화 세션 목록
  sessions: adminProcedure.query(async () => {
    return getAllChatSessions();
  }),

  // 관리자: 대화 통계
  stats: adminProcedure.query(async () => {
    return getChatStats();
  }),

  // 관리자: 세션 상세 (메시지 포함)
  sessionDetail: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getChatSessionById(input.id);
      if (!session) return null;
      const messages = await getChatMessagesBySession(session.id);
      return { ...session, messages };
    }),

  // 관리자: 세션 삭제
  deleteSession: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteChatSession(input.id);
      return { success: true } as const;
    }),
});

export const chatInsightRouter = router({
  // 인사이트 통계 조회
  getStats: adminProcedure.query(async () => {
    return getChatInsightStats();
  }),
  // 인사이트 미추출 세션 목록
  getPending: adminProcedure.query(async () => {
    return getSessionsWithoutInsight(50);
  }),
  // 수동 인사이트 추출 실행 (관리자)
  extractInsights: adminProcedure.mutation(async () => {
    const sessions = await getSessionsWithoutInsight(20);
    if (sessions.length === 0) return { processed: 0 };
    const { invokeLLM } = await import("../_core/llm");
    let processed = 0;
    for (const session of sessions) {
      try {
        const messages = await getChatMessagesBySession(session.id);
        if (messages.length < 3) continue;
        const conversationText = messages.map(m => `${m.role}: ${m.content}`).join("\n").slice(0, 3000);
        const result = await invokeLLM({
          messages: [
            { role: "system", content: `당신은 병원 마케팅 챗봇 대화 분석가입니다. 대화 내용을 분석하여 다음 정보를 추출하세요.` },
            { role: "user", content: `다음 챗봇 대화를 분석해주세요:\n\n${conversationText}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "chat_insight",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  specialty: { type: "string", description: "관심 진료과 (치과, 피부과, 성형외과, 한의원, 정형외과, 기타, 알 수 없음)" },
                  intentType: { type: "string", description: "문의 유형 (가격문의, 서비스문의, 기술문의, 상담예약, 일반문의, 기타)" },
                  conversionLikelihood: { type: "string", description: "전환 가능성 (high, medium, low)" },
                  summary: { type: "string", description: "대화 요약 (50자 이내)" },
                },
                required: ["specialty", "intentType", "conversionLikelihood", "summary"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = result.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        await updateChatSessionInsight(session.id, parsed);
        processed++;
      } catch (e) {
        console.error(`[ChatInsight] 세션 ${session.id} 분석 실패:`, e);
      }
    }
    return { processed };
  }),
});

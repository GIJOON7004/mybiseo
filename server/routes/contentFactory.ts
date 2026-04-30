/**
 * contentFactory 라우터
 * routers.ts에서 분할 — contentFactory
 */

import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCalendarItem, createContentHook, createContentIdea, createContentScript,
  deleteCalendarItem, deleteContentHook, deleteContentIdea, getCalendarItems,
  getContentHooks, getContentIdeas, getContentScripts, getStyleGuide,
  updateCalendarItem, updateContentIdea, updateContentScript, upsertStyleGuide,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const contentFactoryRouter = router({
  // 1단계: 스타일 가이드
  getStyleGuide: protectedProcedure.query(async ({ ctx }) => {
    return getStyleGuide(String(ctx.user.id));
  }),
  saveStyleGuide: protectedProcedure.input(z.object({
    brandColor: z.string().optional(),
    subColors: z.string().optional(),
    fontStyle: z.string().optional(),
    toneOfVoice: z.string().optional(),
    targetAudience: z.string().optional(),
    brandKeywords: z.string().optional(),
    doList: z.string().optional(),
    dontList: z.string().optional(),
    referenceUrls: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return upsertStyleGuide(String(ctx.user.id), input);
  }),

  // 2단계: 아이디어 수집방
  listIdeas: protectedProcedure.query(async ({ ctx }) => {
    return getContentIdeas(String(ctx.user.id));
  }),
  addIdea: protectedProcedure.input(z.object({
    title: z.string(),
    sourceUrl: z.string().optional(),
    sourceType: z.string().optional(),
    platform: z.string().optional(),
    category: z.string().optional(),
    whyItWorks: z.string().optional(),
    viewCount: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return createContentIdea({ userId: String(ctx.user.id), ...input });
  }),
  updateIdea: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    whyItWorks: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return updateContentIdea(id, String(ctx.user.id), data);
  }),
  deleteIdea: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteContentIdea(input.id, String(ctx.user.id));
  }),
  // AI로 아이디어 분석
  analyzeIdea: protectedProcedure.input(z.object({
    title: z.string(),
    sourceUrl: z.string().optional(),
    platform: z.string().optional(),
  })).mutation(async ({ input }) => {
    const resp = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 병원 마케팅 콘텐츠 전략가입니다. 주어진 콘텐츠 아이디어를 분석하여 병원 마케팅에 어떻게 적용할 수 있는지 제안하세요. JSON으로 응답하세요.` },
        { role: "user", content: `콘텐츠: ${input.title}\n플랫폼: ${input.platform || '미지정'}\nURL: ${input.sourceUrl || '없음'}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "idea_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              whyItWorks: { type: "string", description: "이 콘텐츠가 성공한 이유 (알고리즘, 감정, 트렌드)" },
              hospitalAdaptation: { type: "string", description: "병원 마케팅에 적용하는 방법" },
              suggestedHook: { type: "string", description: "3초 훅 제안" },
              suggestedHashtags: { type: "string", description: "추천 해시태그 5개" },
              difficulty: { type: "string", description: "제작 난이도 (쉽음/보통/어려움)" },
            },
            required: ["whyItWorks", "hospitalAdaptation", "suggestedHook", "suggestedHashtags", "difficulty"],
            additionalProperties: false,
          }
        }
      }
    });
    try {
      const c = resp.choices[0].message.content;
      return JSON.parse(typeof c === 'string' ? c : '{}');
    } catch { return { whyItWorks: "분석 실패", hospitalAdaptation: "", suggestedHook: "", suggestedHashtags: "", difficulty: "" }; }
  }),

  // 3단계: 훅 라이브러리
  listHooks: protectedProcedure.query(async ({ ctx }) => {
    return getContentHooks(String(ctx.user.id));
  }),
  addHook: protectedProcedure.input(z.object({
    hookText: z.string(),
    hookType: z.string().optional(),
    platform: z.string().optional(),
    category: z.string().optional(),
    sourceIdeaId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    return createContentHook({ userId: String(ctx.user.id), ...input });
  }),
  deleteHook: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteContentHook(input.id, String(ctx.user.id));
  }),
  // AI로 훅 생성
  generateHooks: protectedProcedure.input(z.object({
    topic: z.string(),
    platform: z.string().optional(),
    count: z.number().default(5),
  })).mutation(async ({ input }) => {
    const resp = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 병원 마케팅 영상 훅 전문가입니다. 3초 안에 시청자를 사로잡는 훅을 작성하세요.\n\n훅 유형:\n- 공포증 해소: "주사 무서운 분?", "마취 안 되면 어쩌죠?"\n- 전후 변신: "이 코가 진짜 제 코예요?"\n- 원장님 직접: "원장이 말하는 OO의 진실"\n- 수술실 비하인드: "수술실에서 보여주는 OO"\n- 질문형: "왜 OO은 실패할까?"\n\nJSON 배열로 응답하세요.` },
        { role: "user", content: `주제: ${input.topic}\n플랫폼: ${input.platform || '인스타그램 릴스'}\n${input.count}개 생성` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hooks_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hooks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    hookText: { type: "string" },
                    hookType: { type: "string" },
                    whyEffective: { type: "string" },
                  },
                  required: ["hookText", "hookType", "whyEffective"],
                  additionalProperties: false,
                }
              }
            },
            required: ["hooks"],
            additionalProperties: false,
          }
        }
      }
    });
    try {
      const c = resp.choices[0].message.content;
      return JSON.parse(typeof c === 'string' ? c : '{"hooks":[]}');
    } catch { return { hooks: [] }; }
  }),

  // 4단계: 대본 생성
  listScripts: protectedProcedure.query(async ({ ctx }) => {
    return getContentScripts(String(ctx.user.id));
  }),
  generateScript: protectedProcedure.input(z.object({
    topic: z.string(),
    hookText: z.string().optional(),
    platform: z.string().optional(),
    scriptType: z.string().optional(),
    duration: z.string().optional(),
    hospitalName: z.string().optional(),
    treatmentName: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const resp = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 병원 마케팅 영상 대본 작가입니다. 의료광고법을 준수하면서 환자의 공감을 얻는 대본을 작성하세요.\n\n대본 구조:\n1. 훅 (0-3초): 시청자를 사로잡는 첫 문장/장면\n2. 본문 (3-45초): 핵심 정보 전달, 실제 사례/데이터 활용\n3. CTA (45-60초): 행동 유도 (예약, 상담, 팔로우)\n\n의료광고법 준수: 전후 사진 비교 금지, "최고/최초" 등 과장 표현 금지, 부작용 안내 필수\nJSON으로 응답하세요.` },
        { role: "user", content: `주제: ${input.topic}\n훅: ${input.hookText || '자동 생성'}\n플랫폼: ${input.platform || '인스타그램 릴스'}\n영상 유형: ${input.scriptType || '정보 전달'}\n길이: ${input.duration || '60초'}\n병원: ${input.hospitalName || ''}\n시술: ${input.treatmentName || ''}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_script",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "영상 제목" },
              hookSection: { type: "string", description: "훅 섹션 (0-3초) 대본" },
              bodySection: { type: "string", description: "본문 섹션 (3-45초) 대본" },
              ctaSection: { type: "string", description: "CTA 섹션 (45-60초) 대본" },
              fullScript: { type: "string", description: "전체 대본 (장면 설명 포함)" },
              hashtags: { type: "string", description: "추천 해시태그" },
              musicSuggestion: { type: "string", description: "추천 배경음악 분위기" },
            },
            required: ["title", "hookSection", "bodySection", "ctaSection", "fullScript", "hashtags", "musicSuggestion"],
            additionalProperties: false,
          }
        }
      }
    });
    try {
      const content = resp.choices[0].message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");
      const saved = await createContentScript({
        userId: String(ctx.user.id),
        title: parsed.title || input.topic,
        platform: input.platform,
        scriptType: input.scriptType,
        duration: input.duration,
        hookSection: parsed.hookSection,
        bodySection: parsed.bodySection,
        ctaSection: parsed.ctaSection,
        fullScript: parsed.fullScript,
        hashtags: parsed.hashtags,
      });
      return { ...parsed, id: saved?.id };
    } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "대본 생성 실패" }); }
  }),
  updateScript: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    fullScript: z.string().optional(),
    hookSection: z.string().optional(),
    bodySection: z.string().optional(),
    ctaSection: z.string().optional(),
    status: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return updateContentScript(id, String(ctx.user.id), data);
  }),

  // 5단계: 콘텐츠 캘린더
  listCalendar: protectedProcedure.query(async ({ ctx }) => {
    return getCalendarItems(String(ctx.user.id));
  }),
  addCalendarItem: protectedProcedure.input(z.object({
    title: z.string(),
    scriptId: z.number().optional(),
    platform: z.string(),
    scheduledDate: z.string(),
    scheduledTime: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return createCalendarItem({
      userId: String(ctx.user.id),
      ...input,
      scheduledDate: new Date(input.scheduledDate),
    });
  }),
  updateCalendarItem: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    status: z.string().optional(),
    publishedUrl: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return updateCalendarItem(id, String(ctx.user.id), data);
  }),
  deleteCalendarItem: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteCalendarItem(input.id, String(ctx.user.id));
  }),
});

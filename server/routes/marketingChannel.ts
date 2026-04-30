/**
 * marketingChannel 라우터
 * routers.ts에서 분할 — marketingChannel, videoMarketing, marketingDashboard
 */

import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createMarketingContent, createVideoPrompt, deleteMarketingContent, deleteVideoPrompt,
  getMarketingCalendar, getMarketingContentByUser, getMarketingDashboardStats, getVideoPrompts,
  updateMarketingContent,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const marketingChannelRouter = router({
  generateOsmu: protectedProcedure.input(z.object({
    treatmentPageId: z.number().optional(),
    title: z.string(),
    content: z.string(),
    channels: z.array(z.enum(["blog", "instagram", "kakao"])),
  })).mutation(async ({ input, ctx }) => {
    const results: any[] = [];
    for (const channel of input.channels) {
      const formatPrompt = channel === "blog"
        ? `네이버 블로그용 SEO 최적화 글.
구조: 도입부(3줄, 환자 고민 공감) → 본문(H2/H3 소제목 3~4개, 각 200~400자) → 마무리(상담 유도 CTA)
총 1500~2500자. 시술명 키워드를 제목/첫문단/소제목에 자연스럽게 3~5회 반복.
의료광고법 준수: 과장 표현 금지, '도움이 될 수 있습니다' 등 준법 표현 사용`
        : channel === "instagram"
        ? `인스타그램 피드용 포스트.
구조: 첫줄 훅(10자 이내) + 본문(100~150자, 줄바꿈 활용) + 해시태그 15~20개(시술명+지역+증상 키워드)
톤: 친근하지만 전문적. 이모지는 문단 끝에 1개씩만.
캐러셀 이미지 안내문구 포함 (예: '스와이프 해서 자세히 보기')`
        : `카카오톡 채널 메시지용.
구조: 인사말(1줄) + 핵심 정보(3~4줄) + CTA 버튼 안내(1줄)
총 150~200자. 친근하고 따뜻한 톤. '원장님' 대신 '고객님' 사용.
CTA: '상담 예약하기', '자세히 보기' 등 명확한 행동 유도`;

      const aiRes = await invokeLLM({
        messages: [
          { role: "system", content: `당신은 의료 마케팅 콘텐츠 전문가입니다. 다음 원본 콘텐츠를 ${formatPrompt} 포맷으로 변환하세요. 의료광고법을 준수하세요.` },
          { role: "user", content: `제목: ${input.title}\n내용: ${input.content}` }
        ]
      });
      let generated = "";
      try {
        generated = typeof aiRes.choices[0].message.content === "string" ? aiRes.choices[0].message.content : "";
        if (!generated) throw new Error("빈 응답");
      } catch {
        generated = `[${channel}] ${input.title} - AI 콘텐츠 생성에 실패했습니다. 다시 시도해주세요.`;
      }
      const mc = await createMarketingContent({
        userId: ctx.user.id,
        sourceType: input.treatmentPageId ? "treatment_page" : "manual",
        sourceId: input.treatmentPageId || null,
        channel,
        title: `[${channel.toUpperCase()}] ${input.title}`,
        content: generated,
        status: "draft",
      });
      results.push({ channel, contentId: (mc as any)?.id || (mc as any)?.insertId, preview: generated.slice(0, 200) });
    }
    return results;
  }),

  list: protectedProcedure.input(z.object({
    channel: z.string().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return getMarketingContentByUser(ctx.user.id, input || {});
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    data: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      scheduledAt: z.string().optional(),
      status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
      hashtags: z.string().optional(),
    }),
  })).mutation(async ({ input }) => {
    const updateData: any = { ...input.data };
    if (input.data.scheduledAt) updateData.scheduledAt = new Date(input.data.scheduledAt);
    if (input.data.status === "published") updateData.publishedAt = new Date();
    return updateMarketingContent(input.id, updateData);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteMarketingContent(input.id);
    return { success: true };
  }),

  calendar: protectedProcedure.input(z.object({
    year: z.number(),
    month: z.number(),
  })).query(async ({ ctx, input }) => {
    return getMarketingCalendar(ctx.user.id, input.year, input.month);
  }),
});

export const videoMarketingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getVideoPrompts(String(ctx.user.id));
  }),
  generate: protectedProcedure.input(z.object({
    treatmentName: z.string(),
    videoType: z.string(),
    targetPlatform: z.string().optional(),
    hospitalName: z.string().optional(),
    doctorName: z.string().optional(),
    style: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const videoTypePrompts: Record<string, string> = {
      fear_relief: `공포증 해소 영상: 환자들이 가장 두려워하는 부분을 친근하게 해소해주는 영상. 예: "주사 무서운 분? 실제로는 이렇습니다" 형식으로, 원장님이 직접 설명하는 느낌`,
      before_after: `전후 변신 영상: 시술 전후 변화를 드라마틱하게 보여주는 영상. 의료광고법 준수 필수 - 실제 환자 사진 대신 일러스트/3D 시뮬레이션 활용`,
      doctor_explain: `원장님 직접 설명 영상: 원장님이 카메라 앞에서 시술에 대해 직접 설명하는 형식. 신뢰감 극대화`,
      behind_scene: `수술실 비하인드: 수술실 내부를 보여주며 안전성과 전문성을 어필하는 영상`,
      patient_story: `환자 스토리: 실제 환자의 고민과 결정 과정을 다큐멘터리 형식으로 제작`,
      facility_tour: `병원 시설 투어: 병원 내부 시설을 시네마틱하게 보여주는 영상`,
      seasonal: `시즌 마케팅: 계절/이벤트에 맞춰 시술 수요를 자극하는 영상`,
    };
    const typeGuide = videoTypePrompts[input.videoType] || `일반 병원 마케팅 영상`;

    const resp = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 병원 마케팅 AI 영상 프롬프트 전문가입니다. Google Veo3나 Sora 같은 AI 영상 생성 도구에 입력할 수 있는 상세한 영상 프롬프트와 함께, 영상 대본을 작성하세요.\n\n영상 유형: ${typeGuide}\n\n프롬프트 작성 규칙:\n1. 장면 설명을 구체적으로 (카메라 앵글, 조명, 배경, 인물 동작)\n2. 의료 환경에 맞는 전문적이면서 친근한 분위기\n3. 의료광고법 준수 (전후 사진 비교 금지, 과장 표현 금지)\n4. 60초 이내 영상 기준\n\nJSON으로 응답하세요.` },
        { role: "user", content: `시술명: ${input.treatmentName}\n영상 유형: ${input.videoType}\n플랫폼: ${input.targetPlatform || '인스타그램 릴스'}\n병원명: ${input.hospitalName || ''}\n원장님: ${input.doctorName || ''}\n스타일: ${input.style || '전문적이면서 친근한'}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_prompt",
          strict: true,
          schema: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "AI 영상 생성 프롬프트 (장면 설명 상세)" },
              script: { type: "string", description: "영상 대본 (나레이션/자막 포함)" },
              duration: { type: "string", description: "영상 길이" },
              musicSuggestion: { type: "string", description: "추천 배경음악" },
              hashtags: { type: "string", description: "추천 해시태그" },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timeRange: { type: "string" },
                    description: { type: "string" },
                    cameraAngle: { type: "string" },
                    narration: { type: "string" },
                  },
                  required: ["timeRange", "description", "cameraAngle", "narration"],
                  additionalProperties: false,
                }
              },
            },
            required: ["prompt", "script", "duration", "musicSuggestion", "hashtags", "scenes"],
            additionalProperties: false,
          }
        }
      }
    });
    try {
      const content = resp.choices[0].message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : "{}");
      const saved = await createVideoPrompt({
        userId: String(ctx.user.id),
        treatmentName: input.treatmentName,
        videoType: input.videoType,
        targetPlatform: input.targetPlatform,
        prompt: parsed.prompt || "",
        script: parsed.script,
        duration: parsed.duration,
        style: input.style,
        musicSuggestion: parsed.musicSuggestion,
        hashtags: parsed.hashtags,
      });
      return { ...parsed, id: saved?.id };
    } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "영상 프롬프트 생성 실패" }); }
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteVideoPrompt(input.id, String(ctx.user.id));
  }),
});

export const marketingDashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getMarketingDashboardStats(String(ctx.user.id));
  }),
});

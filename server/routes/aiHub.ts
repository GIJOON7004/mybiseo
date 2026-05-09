/**
 * aiHub 라우터
 * routers.ts에서 분할 — aiHub
 */

import { invokeLLM } from "../_core/llm";
import { invokeLLMCached } from "../llm-cache";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createAiBlogTrial, createAiContentLog, createCardnewsTemplate, getAiBlogTrialStats,
  getAiContentLogsByUser, getAiContentStats, getCardnewsTemplates, getContentById,
  getRecentAiBlogTrials, getReviewReport, getReviewReportAdmin, incrementTemplateUsage,
  updateAiContentLog, updateContentReview, updateNaverPublishStatus,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const aiHubRouter = router({
  // AI 블로그 무료 체험 (로그인 없이 사용 가능)
  trialBlog: publicProcedure
    .input(z.object({
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      topic: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { hospitalName, specialty, topic } = input;
      const blogTopic = topic || `${specialty} ${hospitalName} 환자 안내`;

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 AEO(AI Engine Optimization) / GEO(Generative Engine Optimization) 전문 병원 블로그 작성자입니다.
ChatGPT, Gemini, Claude, Perplexity 등 AI 검색엔진이 답변에 인용하는 구조로 블로그를 작성합니다.

## AEO/GEO 최적화 규칙
- 제목: 환자가 AI에게 질문할 법한 자연어 질문형 키워드 포함 (예: "임플란트 후 통증 얼마나 오래 가나요", "라섹 시술 부작용 있나요")
- 본문 구조: 질문-답변(Q&A) 패턴을 자연스럽게 녕여서 AI가 발취하기 쉬운 구조로 작성
- E-E-A-T 강화: 전문의 경험(Experience), 전문성(Expertise), 권위(Authority), 신뢰(Trust)를 드러내는 문체
- 구조화된 데이터: 핵심 정보를 "질문: ... / 답변: ..." 패턴으로 정리하여 AI가 추출하기 쉬운 형태로
- 환자 입장의 궁금증 중심으로 작성 (비용, 회복기간, 부작용, 시술과정 등)
- 구체적인 수치와 팩트를 포함하여 신뢰도 확보
- 의료법 준수: 과대 광고 금지, 부작용/개인차 고지 포함
- 마크다운 문법 사용 금지, 일반 텍스트로 작성
- 본문 800~1200자 내외

## AI 인용 최적 블록 규칙 (가장 중요)
AI 검색엔진은 답변에 인용할 때 134~167단어 길이의 자기완결형 문단을 가장 선호합니다.
- 핵심 정보 문단을 띄어쓰기 기준 80~120어절 길이로 작성
- 각 문단은 다른 문맥 없이도 독립적으로 의미가 통하는 구조로 작성
- 최소 2개 이상의 "질문:/답변:" 패턴 포함
- 문단 첫 문장에 핵심 키워드 포함
- 각 블록에 구체적 수치 포함으로 AI 신뢰도 확보

## 가독성 규칙
- 한 문단은 최대 3문장으로 짧게
- 문단 사이 빈 줄(\n\n)으로 여백
- 핵심 수치나 키워드는 강조
- 도입부에서 환자의 고민을 공감하는 문장으로 시작

## 응답 형식
JSON: {"title": "...", "content": "...", "tags": ["..."]}`
          },
          {
            role: "user",
            content: `병원명: ${hospitalName}\n진료과: ${specialty}\n주제: ${blogTopic}\n\nAI 검색엔진이 답변에 인용할 수 있는 AEO/GEO 최적화 블로그 글을 작성해주세요.`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "blog_post",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "블로그 제목" },
                content: { type: "string", description: "블로그 본문" },
                tags: { type: "array", items: { type: "string" }, description: "해시태그 목록" }
              },
              required: ["title", "content", "tags"],
              additionalProperties: false
            }
          }
        }
      });

      const rawContent = result.choices[0].message.content;
      const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");

      // 체험 로그 저장
      const ip = ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket.remoteAddress || "";
      await createAiBlogTrial({
        hospitalName,
        specialty,
        topic: blogTopic,
        generatedTitle: parsed.title,
        generatedContent: parsed.content,
        ipAddress: ip.split(",")[0].trim(),
        userId: ctx.user?.id,
      });

      // 2단계: 의료광고법 검수 (동일 콘텐츠 반복 검수 시 캐시 활용)
      let review = null;
      try {
        const reviewResult = await invokeLLMCached({
          messages: [
            {
              role: "system",
              content: `당신은 대한민국 의료광고법 전문 검수관입니다. 의료법 제56조, 의료법 시행령 제23조, 보건복지부 의료광고 심의 기준을 바탕으로 검수합니다.

검수 항목:
1. 효과 보장 표현
2. 비교 광고
3. 환자 유인 행위
4. 미인증 의료기기/시술명
5. 전후 사진 규정
6. 부작용/개인차 고지 누락
7. 의료인 경력 과장

JSON: {"verdict":"pass|warning|fail","score":0-100,"issues":[{"original":"...","clause":"...","severity":"high|medium|low","suggestion":"..."}],"summary":"...","revisedContent":"..."}`,
            },
            {
              role: "user",
              content: `병원: ${hospitalName} (${specialty})\n유형: 블로그\n\n--- 검수 대상 ---\n${parsed.content}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "medical_ad_review",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  verdict: { type: "string" },
                  score: { type: "integer" },
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original: { type: "string" },
                        clause: { type: "string" },
                        severity: { type: "string" },
                        suggestion: { type: "string" },
                      },
                      required: ["original", "clause", "severity", "suggestion"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                  revisedContent: { type: "string" },
                },
                required: ["verdict", "score", "issues", "summary", "revisedContent"],
                additionalProperties: false,
              },
            },
          },
        }, { caller: "aiHub.checkAdLaw" });
        const rawReview = reviewResult.choices[0].message.content;
        review = JSON.parse(typeof rawReview === "string" ? rawReview : "{}");
      } catch (e) {
        // 검수 실패해도 블로그 글은 반환
        console.error("Trial blog review failed:", e);
      }

      return { title: parsed.title, content: parsed.content, tags: parsed.tags || [], review };
    }),

  // 체험 통계 (관리자)
  trialStats: adminProcedure.query(async () => {
    return getAiBlogTrialStats();
  }),
  recentTrials: adminProcedure.query(async () => {
    return getRecentAiBlogTrials();
  }),

  // AI 콘텐츠 생성 (로그인 필요)
  generateBlog: protectedProcedure
    .input(z.object({
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      topic: z.string().min(1),
      tone: z.string().optional(),
      length: z.enum(["short", "medium", "long"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lengthGuide = input.length === "short" ? "500자 내외" : input.length === "long" ? "1500자 내외" : "800~1200자 내외";
      const toneGuide = input.tone || "전문적이면서 친근한";

      const log = await createAiContentLog({
        userId: ctx.user.id,
        contentType: "blog",
        hospitalName: input.hospitalName,
        specialty: input.specialty,
        prompt: input.topic,
        status: "generating",
      });

      try {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 AEO(AI Engine Optimization) / GEO(Generative Engine Optimization) 전문 병원 블로그 작성자입니다.
ChatGPT, Gemini, Claude, Perplexity 등 AI 검색엔진이 답변에 인용하는 구조로 작성합니다.

## AEO/GEO 최적화 규칙
- 본문 ${lengthGuide}
- 톤: ${toneGuide}
- 제목: 환자가 AI에게 질문할 법한 자연어 키워드 포함
- 본문: Q&A 패턴을 자연스럽게 녹여서 AI가 발취하기 쉬운 구조
- E-E-A-T 강화: 전문의 경험·전문성·권위·신뢰를 드러내는 문체
- 구체적 수치/팩트 포함으로 AI 인용 신뢰도 확보
- 의료법 준수: 과대광고 금지, 부작용/개인차 고지
- 마크다운 문법 사용 금지
- metaDescription: AI 검색엔진이 요약으로 사용할 수 있는 1~2문장 (155자 이내)

## AI 인용 최적 블록 규칙 (핵심)
AI는 134~167단어(한국어 80~120어절) 길이의 자기완결형 문단을 가장 선호합니다.
- 핵심 정보 문단을 80~120어절 길이로 작성
- 최소 2개 이상 "질문:/답변:" Q&A 패턴 포함
- 문단 첫 문장에 핵심 키워드 + 구체적 수치 포함
JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`
            },
            { role: "user", content: `병원: ${input.hospitalName} (${input.specialty})\n주제: ${input.topic}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "blog_post",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  metaDescription: { type: "string" }
                },
                required: ["title", "content", "tags", "metaDescription"],
                additionalProperties: false
              }
            }
          }
        });

        const rawContent2 = result.choices[0].message.content;
        const parsed = JSON.parse(typeof rawContent2 === "string" ? rawContent2 : "{}");
        if (log) {
          await updateAiContentLog(log.id, {
            generatedTitle: parsed.title,
            generatedContent: parsed.content,
            status: "completed",
          });
        }
        return { id: log?.id, ...parsed };
      } catch (e) {
        if (log) await updateAiContentLog(log.id, { status: "failed" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "블로그 생성에 실패했습니다" });
      }
    }),

  // AI 카드뉴스 생성
  generateCardnews: protectedProcedure
    .input(z.object({
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      eventTitle: z.string().min(1),
      eventDetail: z.string().optional(),
      templateId: z.number().optional(),
      style: z.enum(["modern", "warm", "professional", "cute"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const log = await createAiContentLog({
        userId: ctx.user.id,
        contentType: "cardnews",
        hospitalName: input.hospitalName,
        specialty: input.specialty,
        prompt: input.eventTitle,
        status: "generating",
      });

      if (input.templateId) {
        await incrementTemplateUsage(input.templateId);
      }

      try {
        // 1) 카드뉴스 텍스트 생성
        const textResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 병원 카드뉴스 카피라이터입니다. 인스타그램/카카오톡 카드뉴스에 들어갈 텍스트를 작성합니다.\n규칙:\n- 3~5장 구성 (표지 + 본문 + CTA)\n- 각 장은 제목(20자 이내) + 본문(50자 이내)\n- 의료법 준수\nJSON: {"slides":[{"title":"...","body":"...","note":"..."}],"hashtags":["..."]}`
            },
            { role: "user", content: `병원: ${input.hospitalName} (${input.specialty})\n이벤트: ${input.eventTitle}\n상세: ${input.eventDetail || "없음"}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "cardnews",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        body: { type: "string" },
                        note: { type: "string" }
                      },
                      required: ["title", "body", "note"],
                      additionalProperties: false
                    }
                  },
                  hashtags: { type: "array", items: { type: "string" } }
                },
                required: ["slides", "hashtags"],
                additionalProperties: false
              }
            }
          }
        });

        const rawContent3 = textResult.choices[0].message.content;
        const parsed = JSON.parse(typeof rawContent3 === "string" ? rawContent3 : "{}");

        // 2) 카드뉴스 이미지 생성 (표지 1장)
        let imageUrl: string | undefined = undefined;
        try {
          const { generateImage } = await import("../_core/imageGeneration");
          const styleMap: Record<string, string> = {
            modern: "clean modern minimalist medical",
            warm: "warm friendly pastel medical",
            professional: "professional corporate medical blue",
            cute: "cute kawaii friendly medical"
          };
          const stylePrompt = styleMap[input.style || "modern"];
          const imgResult = await generateImage({
            prompt: `${stylePrompt} social media card design for ${input.specialty} hospital event: ${input.eventTitle}. Korean text overlay area. Square format 1080x1080. No text in image, clean background with medical theme.`
          });
          imageUrl = imgResult.url;
        } catch (imgErr) {
          console.warn("[AI Hub] Image generation failed:", imgErr);
        }

        if (log) {
          await updateAiContentLog(log.id, {
            generatedTitle: parsed.slides?.[0]?.title || input.eventTitle,
            generatedContent: JSON.stringify(parsed),
            generatedImageUrl: imageUrl ? imageUrl : null as any,
            status: "completed",
          });
        }

        return { id: log?.id, slides: parsed.slides, hashtags: parsed.hashtags, imageUrl };
      } catch (e) {
        if (log) await updateAiContentLog(log.id, { status: "failed" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "카드뉴스 생성에 실패했습니다" });
      }
    }),

  // AI 영상 스크립트 생성
  generateVideoScript: protectedProcedure
    .input(z.object({
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      topic: z.string().min(1),
      duration: z.enum(["15s", "30s", "60s"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dur = input.duration || "30s";
      const log = await createAiContentLog({
        userId: ctx.user.id,
        contentType: "video_script",
        hospitalName: input.hospitalName,
        specialty: input.specialty,
        prompt: input.topic,
        status: "generating",
      });

      try {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 병원 SNS 영상 스크립트 작성자입니다. 인스타그램 릴스/유튜브 쇼츠용 스크립트를 작성합니다.\n규칙:\n- ${dur} 분량\n- 장면별 나레이션 + 화면 설명\n- 의료법 준수\nJSON: {"title":"...","scenes":[{"scene":1,"duration":"...","narration":"...","visual":"..."}],"bgm":"..."}`
            },
            { role: "user", content: `병원: ${input.hospitalName} (${input.specialty})\n주제: ${input.topic}\n길이: ${dur}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "video_script",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        scene: { type: "integer" },
                        duration: { type: "string" },
                        narration: { type: "string" },
                        visual: { type: "string" }
                      },
                      required: ["scene", "duration", "narration", "visual"],
                      additionalProperties: false
                    }
                  },
                  bgm: { type: "string" }
                },
                required: ["title", "scenes", "bgm"],
                additionalProperties: false
              }
            }
          }
        });

        const rawContent4 = result.choices[0].message.content;
        const parsed = JSON.parse(typeof rawContent4 === "string" ? rawContent4 : "{}");
        if (log) {
          await updateAiContentLog(log.id, {
            generatedTitle: parsed.title,
            generatedContent: JSON.stringify(parsed),
            status: "completed",
          });
        }
        return { id: log?.id, ...parsed };
      } catch (e) {
        if (log) await updateAiContentLog(log.id, { status: "failed" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "영상 스크립트 생성에 실패했습니다" });
      }
    }),

  // 내 콘텐츠 목록
  myContents: protectedProcedure
    .input(z.object({ contentType: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return getAiContentLogsByUser(ctx.user.id, input.contentType, input.limit || 20);
    }),

  // 내 콘텐츠 통계
  myStats: protectedProcedure.query(async ({ ctx }) => {
    return getAiContentStats(ctx.user.id);
  }),

  // 카드뉴스 템플릿 목록
  templates: publicProcedure
    .input(z.object({ specialty: z.string().optional(), category: z.string().optional() }))
    .query(async ({ input }) => {
      return getCardnewsTemplates(input.specialty, input.category);
    }),

  // 템플릿 추가 (관리자)
  createTemplate: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      specialty: z.string().min(1),
      category: z.enum(["event", "info", "seasonal", "review", "before_after"]),
      description: z.string().optional(),
      promptTemplate: z.string().min(1),
      sampleImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createCardnewsTemplate(input as any);
    }),

  // ─── 35차: 마케팅 프리셋 템플릿 (MindStudio식) ───
  presets: publicProcedure.query(() => {
    return [
      {
        id: "naver_blog_review",
        category: "블로그",
        name: "네이버 블로그 시술 후기",
        description: "환자 시점에서 시술 경험을 자연스럽게 풀어낸 후기 글",
        icon: "FileText",
        fields: ["hospitalName", "specialty", "procedure"],
        promptHint: "시술명을 입력하면 환자 시점 후기 글이 생성됩니다",
      },
      {
        id: "naver_blog_seo",
        category: "블로그",
        name: "SEO 키워드 최적화 글",
        description: "특정 키워드로 네이버 검색 상위 노출을 노리는 정보성 글",
        icon: "Search",
        fields: ["hospitalName", "specialty", "keyword"],
        promptHint: "타겟 키워드를 입력하면 SEO 최적화 글이 생성됩니다",
      },
      {
        id: "naver_blog_info",
        category: "블로그",
        name: "질환/시술 정보 안내",
        description: "환자가 궁금해하는 질환·시술 정보를 전문적으로 설명",
        icon: "BookOpen",
        fields: ["hospitalName", "specialty", "topic"],
        promptHint: "질환명이나 시술명을 입력하면 정보 안내 글이 생성됩니다",
      },
      {
        id: "insta_event",
        category: "SNS",
        name: "인스타그램 이벤트 공지",
        description: "할인·이벤트를 알리는 인스타그램 캡션 + 해시태그",
        icon: "Megaphone",
        fields: ["hospitalName", "specialty", "eventDetail"],
        promptHint: "이벤트 내용을 입력하면 인스타 캡션이 생성됩니다",
      },
      {
        id: "insta_daily",
        category: "SNS",
        name: "인스타그램 일상 포스팅",
        description: "병원 일상·스태프 소개 등 친근한 인스타 포스팅",
        icon: "Camera",
        fields: ["hospitalName", "specialty", "topic"],
        promptHint: "포스팅 주제를 입력하면 친근한 캡션이 생성됩니다",
      },
      {
        id: "kakao_notice",
        category: "SNS",
        name: "카카오톡 공지 메시지",
        description: "기존 환자에게 보내는 카카오톡 알림 메시지",
        icon: "MessageSquare",
        fields: ["hospitalName", "specialty", "noticeContent"],
        promptHint: "공지 내용을 입력하면 카카오톡 메시지가 생성됩니다",
      },
      {
        id: "cardnews_event",
        category: "카드뉴스",
        name: "이벤트/할인 카드뉴스",
        description: "시즌 할인·이벤트를 알리는 3~5장 카드뉴스 텍스트",
        icon: "Image",
        fields: ["hospitalName", "specialty", "eventDetail"],
        promptHint: "이벤트 내용을 입력하면 카드뉴스 텍스트가 생성됩니다",
      },
      {
        id: "cardnews_tip",
        category: "카드뉴스",
        name: "건강 팁 카드뉴스",
        description: "환자에게 유용한 건강 정보를 카드뉴스로 전달",
        icon: "Heart",
        fields: ["hospitalName", "specialty", "topic"],
        promptHint: "건강 주제를 입력하면 정보성 카드뉴스가 생성됩니다",
      },
      {
        id: "video_shorts",
        category: "영상",
        name: "릴스/쇼츠 스크립트",
        description: "15~60초 짧은 영상 스크립트 (나레이션+화면 구성)",
        icon: "Video",
        fields: ["hospitalName", "specialty", "topic", "duration"],
        promptHint: "영상 주제를 입력하면 스크립트가 생성됩니다",
      },
      {
        id: "video_interview",
        category: "영상",
        name: "원장님 인터뷰 대본",
        description: "원장님이 카메라 앞에서 읽을 수 있는 인터뷰 대본",
        icon: "Mic",
        fields: ["hospitalName", "specialty", "topic"],
        promptHint: "인터뷰 주제를 입력하면 자연스러운 대본이 생성됩니다",
      },
    ];
  }),

  // ─── 35차: 프리셋 기반 콘텐츠 생성 ───
  generateFromPreset: protectedProcedure
    .input(z.object({
      presetId: z.string().min(1),
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      userInput: z.string().min(1),
      enableReview: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const presetPrompts: Record<string, { system: string; contentType: string }> = {
        naver_blog_review: {
          contentType: "blog",
          system: `당신은 한국 병원 마케팅 전문 블로거입니다. 환자 시점에서 시술 후기를 작성합니다.

작성 원칙:
- 실제 환자가 쓴 것처럼 자연스러운 구어체
- "~했어요", "~더라고요" 등 후기 톤
- 시술 전 고민 → 병원 선택 이유 → 시술 과정 → 결과 만족도 순서
- 구체적인 감각 묘사 포함 (통증, 회복기간, 변화 등)
- 800~1200자
- 의료법 준수: 효과 보장 표현 금지, "개인차가 있을 수 있습니다" 포함
- 마크다운 금지, 일반 텍스트

JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`,
        },
        naver_blog_seo: {
          contentType: "blog",
          system: `당신은 네이버 SEO 전문가이자 의료 콘텐츠 작성자입니다.

작성 원칙:
- 타겟 키워드를 제목과 본문 첫 문단에 자연스럽게 배치
- 관련 키워드(LSI)를 본문 전체에 분산 배치
- 소제목 2~3개로 구조화 (소제목에도 키워드 포함)
- 정보성 + 병원 전문성을 자연스럽게 연결
- 1000~1500자
- 의료법 준수: 과대광고 금지
- 마크다운 금지, 일반 텍스트

JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`,
        },
        naver_blog_info: {
          contentType: "blog",
          system: `당신은 의료 정보 전문 작성자입니다. 환자가 이해하기 쉬운 질환/시술 안내 글을 작성합니다.

작성 원칙:
- 의학 용어는 쉬운 말로 풀어서 설명
- "이런 분들에게 추천" 섹션 포함
- 시술 과정, 소요 시간, 회복 기간 등 실용 정보 중심
- 전문적이면서도 친근한 톤
- 1000~1500자
- 의료법 준수: 효과 보장 금지, 부작용 가능성 언급
- 마크다운 금지, 일반 텍스트

JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`,
        },
        insta_event: {
          contentType: "blog",
          system: `당신은 병원 인스타그램 마케터입니다. 이벤트/할인 공지 캡션을 작성합니다.

작성 원칙:
- 첫 줄에 시선을 끄는 한 줄 카피
- 이벤트 내용을 간결하게 정리
- 참여 방법/기간/조건 명시
- 이모지 적절히 활용
- 300~500자
- 해시태그 10~15개 (지역+시술+이벤트 키워드)
- 의료법 준수

JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`,
        },
        insta_daily: {
          contentType: "blog",
          system: `당신은 병원 SNS 담당자입니다. 병원 일상을 친근하게 전달하는 인스타 캡션을 작성합니다.

작성 원칙:
- 따뜻하고 친근한 톤
- 스태프 소개, 병원 일상, 환자와의 에피소드 등
- 200~400자
- 이모지 자연스럽게 활용
- 해시태그 8~12개

JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`,
        },
        kakao_notice: {
          contentType: "blog",
          system: `당신은 병원 CRM 담당자입니다. 기존 환자에게 보내는 카카오톡 알림 메시지를 작성합니다.

작성 원칙:
- 존댓말, 정중하면서 친근한 톤
- 핵심 내용을 앞에 배치
- 200자 이내로 간결하게
- CTA(예약 링크, 전화번호) 안내 포함
- 의료법 준수

JSON: {"title":"...","content":"...","tags":["..."],"metaDescription":"..."}`,
        },
        cardnews_event: {
          contentType: "cardnews",
          system: `당신은 병원 카드뉴스 카피라이터입니다. 이벤트/할인 카드뉴스 텍스트를 작성합니다.

작성 원칙:
- 4~5장 구성 (표지 + 이벤트 내용 + 상세 + CTA)
- 각 장: 제목(15자 이내) + 본문(40자 이내)
- 시선을 끄는 표지 카피
- 의료법 준수

JSON: {"slides":[{"title":"...","body":"...","note":"..."}],"hashtags":["..."],"metaDescription":"..."}`,
        },
        cardnews_tip: {
          contentType: "cardnews",
          system: `당신은 의료 정보 카드뉴스 작성자입니다. 건강 팁을 카드뉴스로 전달합니다.

작성 원칙:
- 5~6장 구성 (표지 + 정보 3~4장 + 병원 소개)
- 각 장: 제목(15자 이내) + 본문(50자 이내)
- 숫자, 비교, Q&A 등 읽기 쉬운 구성
- 의료법 준수

JSON: {"slides":[{"title":"...","body":"...","note":"..."}],"hashtags":["..."],"metaDescription":"..."}`,
        },
        video_shorts: {
          contentType: "video_script",
          system: `당신은 병원 SNS 영상 스크립트 작성자입니다. 릴스/쇼츠용 스크립트를 작성합니다.

작성 원칙:
- 첫 3초에 시선을 잡는 훅
- 장면별 나레이션 + 화면 설명
- 자연스러운 구어체
- 의료법 준수

JSON: {"title":"...","scenes":[{"scene":1,"duration":"...","narration":"...","visual":"..."}],"bgm":"...","metaDescription":"..."}`,
        },
        video_interview: {
          contentType: "video_script",
          system: `당신은 병원 영상 대본 작성자입니다. 원장님이 카메라 앞에서 자연스럽게 읽을 수 있는 인터뷰 대본을 작성합니다.

작성 원칙:
- 대화하듯 자연스러운 톤
- 전문성과 친근함의 균형
- 2~3분 분량 (500~800자)
- 중간중간 "잠깐 쉬어가는" 포인트 표시
- 의료법 준수

JSON: {"title":"...","scenes":[{"scene":1,"duration":"...","narration":"...","visual":"..."}],"bgm":"...","metaDescription":"..."}`,
        },
      };

      const preset = presetPrompts[input.presetId];
      if (!preset) throw new TRPCError({ code: "BAD_REQUEST", message: "존재하지 않는 프리셋입니다" });

      const log = await createAiContentLog({
        userId: ctx.user.id,
        contentType: preset.contentType as any,
        hospitalName: input.hospitalName,
        specialty: input.specialty,
        prompt: `[${input.presetId}] ${input.userInput}`,
        status: "generating",
      });

      try {
        // ── STEP 1: 초안 생성 ──
        const draftResult = await invokeLLM({
          messages: [
            { role: "system", content: preset.system },
            { role: "user", content: `병원: ${input.hospitalName} (${input.specialty})\n내용: ${input.userInput}` },
          ],
        });

        const rawDraft = draftResult.choices[0].message.content;
        const draft = JSON.parse(typeof rawDraft === "string" ? rawDraft : "{}");

        // ── STEP 2: 의료광고법 검수 (선택) ──
        let review = null;
        if (input.enableReview !== false) {
          const reviewResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `당신은 대한민국 의료광고법 전문 검수관입니다. 의료법 제56조, 의료법 시행령 제23조, 보건복지부 의료광고 심의 기준을 바탕으로 아래 마케팅 콘텐츠를 검수합니다.

검수 항목:
1. 효과 보장 표현 ("확실한", "100%", "완벽한" 등)
2. 비교 광고 (타 병원 비하, 근거 없는 최상급 표현)
3. 환자 유인 행위 (과도한 할인 강조, 무료 시술 미끼)
4. 미인증 의료기기/시술명 사용
5. 전후 사진 관련 규정 위반
6. 부작용/개인차 고지 누락
7. 의료인 경력 과장

각 위반 사항에 대해:
- 위반 문구 원문
- 위반 조항
- 위험도 (high/medium/low)
- 수정 제안

전체 판정: pass(문제없음) / warning(경미한 수정 필요) / fail(반드시 수정 필요)

JSON: {"verdict":"pass|warning|fail","score":0-100,"issues":[{"original":"...","clause":"...","severity":"high|medium|low","suggestion":"..."}],"summary":"...","revisedContent":"..."}`,
              },
              {
                role: "user",
                content: `아래 병원 마케팅 콘텐츠를 검수해주세요.\n\n병원: ${input.hospitalName} (${input.specialty})\n콘텐츠 유형: ${preset.contentType}\n\n--- 콘텐츠 ---\n${draft.content || JSON.stringify(draft.slides || draft.scenes)}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "medical_ad_review",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    verdict: { type: "string", description: "pass, warning, or fail" },
                    score: { type: "integer", description: "0-100 compliance score" },
                    issues: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          original: { type: "string" },
                          clause: { type: "string" },
                          severity: { type: "string" },
                          suggestion: { type: "string" },
                        },
                        required: ["original", "clause", "severity", "suggestion"],
                        additionalProperties: false,
                      },
                    },
                    summary: { type: "string" },
                    revisedContent: { type: "string" },
                  },
                  required: ["verdict", "score", "issues", "summary", "revisedContent"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawReview = reviewResult.choices[0].message.content;
          review = JSON.parse(typeof rawReview === "string" ? rawReview : "{}");
        }

        if (log) {
          await updateAiContentLog(log.id, {
            generatedTitle: draft.title,
            generatedContent: JSON.stringify({ draft, review }),
            status: "completed",
          });
        }

        return {
          id: log?.id,
          presetId: input.presetId,
          contentType: preset.contentType,
          draft,
          review,
        };
      } catch (e) {
        if (log) await updateAiContentLog(log.id, { status: "failed" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "콘텐츠 생성에 실패했습니다" });
      }
    }),

  // ─── 35차: 의료광고법 검수만 단독 실행 ───
  reviewContent: protectedProcedure
    .input(z.object({
      content: z.string().min(1),
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      contentType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const reviewResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 대한민국 의료광고법 전문 검수관입니다. 의료법 제56조, 의료법 시행령 제23조, 보건복지부 의료광고 심의 기준을 바탕으로 검수합니다.

검수 항목:
1. 효과 보장 표현
2. 비교 광고
3. 환자 유인 행위
4. 미인증 의료기기/시술명
5. 전후 사진 규정
6. 부작용/개인차 고지 누락
7. 의료인 경력 과장

JSON: {"verdict":"pass|warning|fail","score":0-100,"issues":[{"original":"...","clause":"...","severity":"high|medium|low","suggestion":"..."}],"summary":"...","revisedContent":"..."}`,
          },
          {
            role: "user",
            content: `병원: ${input.hospitalName} (${input.specialty})\n유형: ${input.contentType || "일반"}\n\n--- 검수 대상 ---\n${input.content}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "medical_ad_review",
            strict: true,
            schema: {
              type: "object",
              properties: {
                verdict: { type: "string" },
                score: { type: "integer" },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original: { type: "string" },
                      clause: { type: "string" },
                      severity: { type: "string" },
                      suggestion: { type: "string" },
                    },
                    required: ["original", "clause", "severity", "suggestion"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
                revisedContent: { type: "string" },
              },
              required: ["verdict", "score", "issues", "summary", "revisedContent"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawReview = reviewResult.choices[0].message.content;
      return JSON.parse(typeof rawReview === "string" ? rawReview : "{}");
    }),

  // ─── 네이버 블로그 발행 준비 (HTML 변환 — 동일 콘텐츠 재변환 시 캐시) ───
  prepareNaverBlog: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .mutation(async ({ input }) => {
      const content = await getContentById(input.contentId);
      if (!content) throw new TRPCError({ code: "NOT_FOUND", message: "콘텐츠를 찾을 수 없습니다" });
      // 마크다운 → HTML 변환 (LLM 사용, 캐시 적용)
      const htmlResult = await invokeLLMCached({
        messages: [
          {
            role: "system",
            content: `당신은 네이버 블로그 HTML 변환 전문가입니다. 주어진 블로그 글을 네이버 블로그에 바로 붙여넣을 수 있는 HTML으로 변환하세요.\n\n규칙:\n- <h2>, <h3>, <p>, <br>, <strong>, <ul>, <li> 태그만 사용\n- 인라인 스타일만 허용 (font-size, color, text-align)\n- 이미지 태그 제외\n- 네이버 블로그 에디터 호환 형식\n\nHTML만 반환하세요. 설명 없이.`,
          },
          {
            role: "user",
            content: `제목: ${content.generatedTitle}\n\n${content.revisedContent || content.generatedContent}`,
          },
        ],
      }, { caller: "aiHub.naverHtml" });
      const html = typeof htmlResult.choices[0].message.content === "string"
        ? htmlResult.choices[0].message.content
        : "";
      return {
        id: content.id,
        title: content.generatedTitle || "",
        html: html.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim(),
        originalContent: content.revisedContent || content.generatedContent || "",
      };
    }),

  // 네이버 블로그 발행 완료 기록
  markNaverPublished: protectedProcedure
    .input(z.object({ contentId: z.number(), postUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateNaverPublishStatus(input.contentId, input.postUrl || "");
      return { success: true };
    }),

  // ─── 카드뉴스 이미지 생성 (HTML → S3 업로드) ───
  generateCardnewsImage: protectedProcedure
    .input(z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      items: z.array(z.string()).max(6),
      style: z.enum(["modern", "warm", "clinical", "bold"]),
      hospitalName: z.string(),
      specialty: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const colorSchemes: Record<string, { bg: string; accent: string; text: string }> = {
        modern: { bg: "#1a1a2e", accent: "#00d4aa", text: "#ffffff" },
        warm: { bg: "#fef3e2", accent: "#e67e22", text: "#2c3e50" },
        clinical: { bg: "#f0f4f8", accent: "#2563eb", text: "#1e293b" },
        bold: { bg: "#7c3aed", accent: "#fbbf24", text: "#ffffff" },
      };
      const colors = colorSchemes[input.style] || colorSchemes.modern;

      // 각 슬라이드용 HTML 생성
      const slides: string[] = [];

      // 표지 슬라이드
      slides.push(`
        <div style="width:1080px;height:1080px;background:${colors.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;font-family:'Pretendard','Noto Sans KR',sans-serif;">
          <div style="font-size:24px;color:${colors.accent};margin-bottom:20px;">${input.hospitalName}</div>
          <div style="font-size:56px;font-weight:800;color:${colors.text};text-align:center;line-height:1.3;margin-bottom:30px;">${input.title}</div>
          ${input.subtitle ? `<div style="font-size:28px;color:${colors.text};opacity:0.7;text-align:center;">${input.subtitle}</div>` : ""}
        </div>
      `);

      // 콘텐츠 슬라이드들
      input.items.forEach((item, i) => {
        slides.push(`
          <div style="width:1080px;height:1080px;background:${colors.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;font-family:'Pretendard','Noto Sans KR',sans-serif;">
            <div style="font-size:120px;font-weight:900;color:${colors.accent};margin-bottom:40px;">${String(i + 1).padStart(2, "0")}</div>
            <div style="font-size:32px;color:${colors.text};text-align:center;line-height:1.6;max-width:800px;">${item}</div>
          </div>
        `);
      });

      // 마무리 슬라이드
      slides.push(`
        <div style="width:1080px;height:1080px;background:${colors.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;font-family:'Pretendard','Noto Sans KR',sans-serif;">
          <div style="font-size:48px;font-weight:800;color:${colors.text};margin-bottom:30px;">${input.hospitalName}</div>
          <div style="font-size:28px;color:${colors.accent};">MY비서로 제작되었습니다</div>
        </div>
      `);

      // S3에 HTML 업로드 (각 슬라이드별)
      const { storagePut } = await import("../storage");
      const slideUrls: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body>${slides[i]}</body></html>`;
        const suffix = Math.random().toString(36).slice(2, 8);
        const { url } = await storagePut(
          `cardnews/${Date.now()}-slide-${i}-${suffix}.html`,
          fullHtml,
          "text/html"
        );
        slideUrls.push(url);
      }

      // AI로 표지 이미지도 생성
      let coverImageUrl: string | undefined;
      try {
        const { generateImage } = await import("../_core/imageGeneration");
        const imgResult = await generateImage({
          prompt: `의료 카드뉴스 표지 이미지. 제목: "${input.title}". ${input.specialty || "성형외과"} 병원 마케팅용. 미니멀한 디자인, ${input.style} 스타일. 텍스트 없이 이미지만.`,
        });
        coverImageUrl = imgResult?.url;
      } catch (e) {
        console.error("Cover image generation failed:", e);
      }

      return {
        slides: slideUrls,
        slideCount: slides.length,
        coverImageUrl,
        style: input.style,
        colors,
      };
    }),

  // ─── 검수 리포트 (내 검수 이력) ───
  myReviewReport: protectedProcedure.query(async ({ ctx }) => {
    return getReviewReport(ctx.user.id);
  }),

  // 검수 리포트 (관리자 전체)
  adminReviewReport: adminProcedure.query(async () => {
    return getReviewReportAdmin();
  }),

  // 콘텐츠 상세 조회
  getContent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const content = await getContentById(input.id);
      if (!content) throw new TRPCError({ code: "NOT_FOUND" });
      return content;
    }),

  // 콘텐츠에 검수 결과 저장
  saveReview: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      verdict: z.string(),
      score: z.number(),
      issues: z.array(z.any()),
      summary: z.string(),
      revisedContent: z.string(),
    }))
    .mutation(async ({ input }) => {
      await updateContentReview(input.contentId, {
        verdict: input.verdict,
        score: input.score,
        issues: input.issues,
        summary: input.summary,
        revisedContent: input.revisedContent,
      });
      return { success: true };
    }),
});

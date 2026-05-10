/**
 * interviewContent 라우터
 * 원장님 인터뷰 영상 → 멀티포맷 콘텐츠 자동 생산
 * 영상 1개 → 블로그 3개 + 인스타 카드뉴스 5개 + 숏폼 스크립트 5개
 */
import { invokeLLM } from "../_core/llm";
import { transcribeAudio } from "../_core/voiceTranscription";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { injectMedicalGuard, withMedicalGate } from "../lib/medical-law-gate";
import { storagePut } from "../storage";
import { generateImage } from "../_core/imageGeneration";
import {
  createInterviewVideo,
  getInterviewVideos,
  getInterviewVideoById,
  updateInterviewVideo,
  deleteInterviewVideo,
  createBlogPost,
  getAllBlogCategories,
  getInterviewContentStats,
  getCalendarItemsByMonth,
  getCalendarItemsByWeek,
  createCalendarItemExtended,
  getCalendarItems,
  updateCalendarItem,
  deleteCalendarItem,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { BLOG_GENERATOR_PROMPT } from "./_shared";
import sharp from "sharp";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";

/* ─── 프롬프트 ─── */

const INTERVIEW_BLOG_PROMPT = `당신은 의료 전문 AEO/GEO 블로그 라이터입니다.
원장님의 인터뷰 트랜스크립트를 바탕으로 고품질 블로그 글 3개를 작성합니다.

## 핵심 원칙
- 원장님의 말투, 전문성, 경험을 최대한 살려서 작성
- "자동 생성된 느낌" 절대 금지 — 원장님이 직접 쓴 것처럼 자연스럽게
- AEO/GEO 최적화: ChatGPT, Gemini, Claude, Perplexity, Grok이 답변에 인용하는 구조

## AEO/GEO 최적화 규칙
1. 제목: 환자가 AI에게 질문할 법한 자연어 키워드 포함 (50자 이내)
2. 요약(excerpt): AI가 답변 요약으로 사용할 핵심 2~3문장 (150자 이내)
3. 본문: 마크다운 형식, H2/H3 소제목, Q&A 패턴, 1500~2500자
4. E-E-A-T 강화: 원장님의 실제 경험·전문성·권위·신뢰를 드러내는 문체
5. 구조화된 데이터: "질문: ... / 답변: ..." 패턴으로 AI가 추출하기 쉬운 형태
6. 구체적 수치·사례·팁 포함

## ⭐ AI 인용 최적 블록 규칙 (가장 중요)
1. **최적 블록**: 핵심 정보 문단을 134~167단어(한국어 기준 80~120어절) 길이로 작성
2. **자기완결형**: 각 문단은 독립적으로 의미가 통하는 구조
3. **Q&A 패턴**: 각 섹션의 첫 문단을 "질문: [자연어 질문]" + "답변: [최적 블록]" 형식
4. **최소 3개 이상의 Q&A 블록** 포함
5. **통계/수치 삽입**: 각 블록에 구체적 수치 포함

## 가독성 규칙
- 문단 사이 빈 줄(\\n\\n) 필수
- 한 문단 최대 3~4문장
- H2 소제목 앞뒤 빈 줄 2개씩
- 핵심 키워드/수치는 **굵은 글씨**로 강조
- 도입부 1~2문장으로 짧게, 환자 고민 공감으로 시작

## 응답 형식 (반드시 이 JSON 형식으로)
{
  "blogs": [
    {
      "title": "블로그 제목",
      "slug": "url-friendly-slug",
      "excerpt": "요약 텍스트",
      "content": "마크다운 본문 전체",
      "metaTitle": "AI 검색엔진 인용용 제목 (60자 이내)",
      "metaDescription": "AI가 요약으로 인용할 설명 (155자 이내)",
      "tags": "태그1, 태그2, 태그3, 태그4, 태그5",
      "readingTime": 5,
      "angle": "이 글의 관점/각도 설명 (예: 비용 분석, 사례 중심, 트렌드 등)"
    }
  ]
}

3개의 블로그는 각각 다른 관점(angle)으로 작성:
- 1번: 환자 관점 (고민·궁금증 해소)
- 2번: 전문가 관점 (원장님의 노하우·경험)
- 3번: 트렌드/비교 관점 (최신 동향·비교 분석)`;

const INTERVIEW_CARDNEWS_PROMPT = `당신은 의료 전문 인스타그램 카드뉴스 기획자입니다.
원장님의 인터뷰 트랜스크립트에서 핵심 메시지를 추출하여 인스타 카드뉴스 5세트를 기획합니다.

## 핵심 원칙
- 원장님의 전문성과 신뢰감이 드러나는 콘텐츠
- 환자가 저장·공유하고 싶은 유용한 정보
- 시각적으로 임팩트 있는 구성
- 의료광고법 준수: 과장 표현 금지

## 카드뉴스 구조 (각 세트 5~7장)
1장: 후킹 커버 (강렬한 질문 또는 충격적 사실)
2~5장: 핵심 정보 전달 (한 장에 1가지 포인트)
6장: 요약/정리
7장: CTA (병원 방문/상담 유도)

## 응답 형식 (반드시 이 JSON 형식으로)
{
  "cardnews": [
    {
      "setTitle": "카드뉴스 세트 제목",
      "concept": "컨셉 설명 (예: 비포/애프터, Q&A, 체크리스트 등)",
      "targetAudience": "타겟 (예: 30대 여성, 첫 시술 고민자)",
      "cards": [
        {
          "slideNumber": 1,
          "headline": "카드 상단 큰 글씨 (15자 이내)",
          "bodyText": "카드 본문 (50자 이내, 핵심만)",
          "designNote": "디자인 제안 (배경색, 아이콘, 레이아웃 등)",
          "visualType": "text-only | icon | photo-bg | chart | checklist"
        }
      ],
      "hashtags": "#해시태그1 #해시태그2 ... (15~20개)",
      "bestPostingTime": "최적 게시 시간 (예: 화요일 오후 7시)",
      "estimatedReach": "예상 도달률 설명"
    }
  ]
}

5세트는 각각 다른 컨셉으로:
- 1번: Q&A 형식 (환자 질문 → 원장님 답변)
- 2번: 체크리스트/팁 (시술 전 체크리스트, 관리법 등)
- 3번: 비포/애프터 스토리 (변화 과정)
- 4번: 오해와 진실 (잘못된 상식 바로잡기)
- 5번: 원장님 인사이트 (전문가만 아는 팁)`;

const INTERVIEW_SHORTFORM_PROMPT = `당신은 의료 전문 숏폼 영상 스크립트 작가입니다.
원장님의 인터뷰 트랜스크립트에서 핵심 포인트를 추출하여 숏폼 스크립트 5개를 작성합니다.

## 핵심 원칙
- 15~60초 분량 (150~500자)
- 처음 3초 안에 시청자를 잡는 후킹 포인트
- 원장님의 전문성이 드러나는 자연스러운 말투
- 의료광고법 준수

## 숏폼 구조 (3단 구조)
1. 후크 (0~3초): 충격적 사실, 강렬한 질문, 반전 포인트
2. 본론 (3~45초): 핵심 정보 전달 (1가지 포인트에 집중)
3. CTA (45~60초): 행동 유도 (팔로우, 댓글, 예약)

## 응답 형식 (반드시 이 JSON 형식으로)
{
  "shortforms": [
    {
      "title": "영상 제목 (30자 이내)",
      "hook": "후킹 대사 (처음 3초, 50자 이내)",
      "script": "전체 스크립트 (원장님이 읽을 대본)",
      "duration": "예상 길이 (예: 30초)",
      "platform": "추천 플랫폼 (릴스/숏츠/틱톡)",
      "visualDirection": "영상 연출 방향 (카메라 앵글, 자막 스타일 등)",
      "bgmSuggestion": "배경음악 분위기 (예: 밝고 경쾌한, 신뢰감 있는)",
      "hashtags": "#해시태그1 #해시태그2 ... (10~15개)",
      "trendReference": "참고할 트렌드/밈 (있다면)"
    }
  ]
}

5개 스크립트는 각각 다른 포맷으로:
- 1번: "이것 모르면 큰일" (경고/주의 포맷)
- 2번: "원장이 직접 말하는" (전문가 인사이트)
- 3번: "환자분들이 가장 많이 묻는" (Q&A 포맷)
- 4번: "3가지만 기억하세요" (리스트 포맷)
- 5번: "이런 병원은 피하세요" (비교/선택 가이드)`;

/* ─── 라우터 ─── */

export const interviewContentRouter = router({
  /** 영상 목록 조회 */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getInterviewVideos(String(ctx.user.id));
  }),

  /** 영상 상세 조회 */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const video = await getInterviewVideoById(input.id, String(ctx.user.id));
      if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "영상을 찾을 수 없습니다" });
      return video;
    }),

  /** 영상 업로드 (S3 URL 등록) */
  upload: protectedProcedure
    .input(z.object({
      videoUrl: z.string(),
      videoFileKey: z.string(),
      fileName: z.string().optional(),
      fileSizeBytes: z.number().optional(),
      doctorName: z.string().optional(),
      hospitalName: z.string().optional(),
      topicKeyword: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createInterviewVideo({
        userId: String(ctx.user.id),
        ...input,
      });
      return { id: (result as any).insertId, success: true };
    }),

  /** 트랜스크립션 실행 */
  transcribe: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      await updateInterviewVideo(input.id, userId, { status: "transcribing" });

      try {
        const result = await transcribeAudio({
          audioUrl: video.videoUrl,
          language: "ko",
          prompt: "병원 원장님 인터뷰 트랜스크립션. 의료 시술명, 전문 용어를 정확하게 인식해주세요.",
        });

        if ("error" in result) {
          await updateInterviewVideo(input.id, userId, {
            status: "error",
            errorMessage: result.error,
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }

        await updateInterviewVideo(input.id, userId, {
          status: "transcribed",
          transcript: result.text,
          transcriptLang: result.language || "ko",
          durationSec: Math.round(result.duration || 0),
        });

        return { transcript: result.text, duration: result.duration };
      } catch (e: any) {
        if (e instanceof TRPCError) throw e;
        await updateInterviewVideo(input.id, userId, {
          status: "error",
          errorMessage: e.message || "트랜스크립션 실패",
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "트랜스크립션 중 오류가 발생했습니다" });
      }
    }),

  /** 콘텐츠 생성 (블로그 3개 + 카드뉴스 5개 + 숏폼 5개) */
  generateContents: protectedProcedure
    .input(z.object({
      id: z.number(),
      contentTypes: z.array(z.enum(["blog", "cardnews", "shortform"])).default(["blog", "cardnews", "shortform"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.transcript) throw new TRPCError({ code: "BAD_REQUEST", message: "트랜스크립트가 없습니다. 먼저 음성 추출을 실행하세요." });

      await updateInterviewVideo(input.id, userId, { status: "generating" });

      const contextInfo = [
        video.doctorName ? `원장님: ${video.doctorName}` : "",
        video.hospitalName ? `병원: ${video.hospitalName}` : "",
        video.topicKeyword ? `주제/시술: ${video.topicKeyword}` : "",
      ].filter(Boolean).join("\n");

      const results: { blogContents?: string; cardnewsContents?: string; shortformContents?: string } = {};

      try {
        // 블로그 3개 생성
        if (input.contentTypes.includes("blog")) {
          const blogResponse = await invokeLLM({
            messages: [
              { role: "system", content: injectMedicalGuard(INTERVIEW_BLOG_PROMPT) },
              {
                role: "user",
                content: `## 인터뷰 정보\n${contextInfo}\n\n## 인터뷰 트랜스크립트\n${video.transcript}\n\n위 인터뷰 내용을 바탕으로 고품질 블로그 글 3개를 작성해주세요. 각각 다른 관점(환자 관점, 전문가 관점, 트렌드 관점)으로 작성합니다.`,
              },
            ],
          });
          const blogText = String(blogResponse.choices?.[0]?.message?.content || "");
          results.blogContents = blogText;
        }

        // 카드뉴스 5개 생성
        if (input.contentTypes.includes("cardnews")) {
          const cardnewsResponse = await invokeLLM({
            messages: [
              { role: "system", content: injectMedicalGuard(INTERVIEW_CARDNEWS_PROMPT) },
              {
                role: "user",
                content: `## 인터뷰 정보\n${contextInfo}\n\n## 인터뷰 트랜스크립트\n${video.transcript}\n\n위 인터뷰 내용을 바탕으로 인스타그램 카드뉴스 5세트를 기획해주세요.`,
              },
            ],
          });
          const cardnewsText = String(cardnewsResponse.choices?.[0]?.message?.content || "");
          results.cardnewsContents = cardnewsText;
        }

        // 숏폼 스크립트 5개 생성
        if (input.contentTypes.includes("shortform")) {
          const shortformResponse = await invokeLLM({
            messages: [
              { role: "system", content: injectMedicalGuard(INTERVIEW_SHORTFORM_PROMPT) },
              {
                role: "user",
                content: `## 인터뷰 정보\n${contextInfo}\n\n## 인터뷰 트랜스크립트\n${video.transcript}\n\n위 인터뷰 내용을 바탕으로 숏폼 영상 스크립트 5개를 작성해주세요.`,
              },
            ],
          });
          const shortformText = String(shortformResponse.choices?.[0]?.message?.content || "");
          results.shortformContents = shortformText;
        }

        await updateInterviewVideo(input.id, userId, {
          status: "completed",
          ...results,
        });

        return { success: true, ...results };
      } catch (e: any) {
        await updateInterviewVideo(input.id, userId, {
          status: "error",
          errorMessage: e.message || "콘텐츠 생성 실패",
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "콘텐츠 생성 중 오류가 발생했습니다" });
      }
    }),

  /** 개별 콘텐츠 재생성 */
  regenerateContent: protectedProcedure
    .input(z.object({
      id: z.number(),
      contentType: z.enum(["blog", "cardnews", "shortform"]),
      additionalInstruction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.transcript) throw new TRPCError({ code: "BAD_REQUEST", message: "트랜스크립트가 없습니다" });

      const contextInfo = [
        video.doctorName ? `원장님: ${video.doctorName}` : "",
        video.hospitalName ? `병원: ${video.hospitalName}` : "",
        video.topicKeyword ? `주제/시술: ${video.topicKeyword}` : "",
      ].filter(Boolean).join("\n");

      const extra = input.additionalInstruction ? `\n\n## 추가 지시사항\n${input.additionalInstruction}` : "";

      let prompt: string;
      let userMsg: string;
      let updateField: string;

      switch (input.contentType) {
        case "blog":
          prompt = INTERVIEW_BLOG_PROMPT;
          userMsg = `## 인터뷰 정보\n${contextInfo}\n\n## 인터뷰 트랜스크립트\n${video.transcript}\n\n위 인터뷰 내용을 바탕으로 고품질 블로그 글 3개를 작성해주세요.${extra}`;
          updateField = "blogContents";
          break;
        case "cardnews":
          prompt = INTERVIEW_CARDNEWS_PROMPT;
          userMsg = `## 인터뷰 정보\n${contextInfo}\n\n## 인터뷰 트랜스크립트\n${video.transcript}\n\n위 인터뷰 내용을 바탕으로 인스타그램 카드뉴스 5세트를 기획해주세요.${extra}`;
          updateField = "cardnewsContents";
          break;
        case "shortform":
          prompt = INTERVIEW_SHORTFORM_PROMPT;
          userMsg = `## 인터뷰 정보\n${contextInfo}\n\n## 인터뷰 트랜스크립트\n${video.transcript}\n\n위 인터뷰 내용을 바탕으로 숏폼 영상 스크립트 5개를 작성해주세요.${extra}`;
          updateField = "shortformContents";
          break;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userMsg },
        ],
      });

      const content = response.choices?.[0]?.message?.content || "";
      await updateInterviewVideo(input.id, userId, { [updateField]: content } as any);

      return { success: true, content };
    }),

  /** 영상 삭제 */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteInterviewVideo(input.id, String(ctx.user.id));
      return { success: true };
    }),

  /** 트랜스크립트 수동 수정 */
  updateTranscript: protectedProcedure
    .input(z.object({
      id: z.number(),
      transcript: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateInterviewVideo(input.id, String(ctx.user.id), {
        transcript: input.transcript,
      });
      return { success: true };
    }),

  /** 블로그 카테고리 목록 조회 */
  getBlogCategories: protectedProcedure.query(async () => {
    return getAllBlogCategories();
  }),

  /** 블로그 원클릭 발행 */
  publishToBlog: protectedProcedure
    .input(z.object({
      id: z.number(),
      blogIndex: z.number(),
      categoryId: z.number(),
      publishStatus: z.enum(["draft", "published"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.blogContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 블로그가 없습니다" });

      const parsed = parseJsonContent(video.blogContents);
      if (!parsed?.blogs?.[input.blogIndex]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "해당 블로그를 찾을 수 없습니다" });
      }

      const blog = parsed.blogs[input.blogIndex];

      // slug 중복 방지
      const slug = `${blog.slug || blog.title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;

      await createBlogPost({
        categoryId: input.categoryId,
        title: blog.title,
        slug,
        excerpt: blog.excerpt || "",
        content: blog.content,
        metaTitle: blog.metaTitle || blog.title,
        metaDescription: blog.metaDescription || blog.excerpt,
        tags: blog.tags || "",
        readingTime: blog.readingTime || 5,
        published: input.publishStatus,
      });

      return { success: true, slug, title: blog.title, status: input.publishStatus };
    }),

  /** 카드뉴스 이미지 생성 (개별 카드) */
  generateCardImage: protectedProcedure
    .input(z.object({
      id: z.number(),
      setIndex: z.number(),
      cardIndex: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.cardnewsContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 카드뉴스가 없습니다" });

      const parsed = parseJsonContent(video.cardnewsContents);
      const cardSet = parsed?.cardnews?.[input.setIndex];
      if (!cardSet) throw new TRPCError({ code: "BAD_REQUEST", message: "해당 카드뉴스 세트를 찾을 수 없습니다" });

      const card = cardSet.cards?.[input.cardIndex];
      if (!card) throw new TRPCError({ code: "BAD_REQUEST", message: "해당 카드를 찾을 수 없습니다" });

      const imagePrompt = buildCardImagePrompt(cardSet, card);

      const { url } = await generateImage({ prompt: imagePrompt });

      // 카드뉴스 JSON에 이미지 URL 추가
      card.imageUrl = url;
      const updatedJson = JSON.stringify(parsed);
      await updateInterviewVideo(input.id, userId, { cardnewsContents: updatedJson });

      return { success: true, imageUrl: url };
    }),

  /** 카드뉴스 세트 전체 이미지 일괄 생성 */
  generateCardSetImages: protectedProcedure
    .input(z.object({
      id: z.number(),
      setIndex: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.cardnewsContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 카드뉴스가 없습니다" });

      const parsed = parseJsonContent(video.cardnewsContents);
      const cardSet = parsed?.cardnews?.[input.setIndex];
      if (!cardSet) throw new TRPCError({ code: "BAD_REQUEST", message: "해당 카드뉴스 세트를 찾을 수 없습니다" });

      const results: { cardIndex: number; imageUrl: string }[] = [];

      for (let i = 0; i < (cardSet.cards?.length || 0); i++) {
        const card = cardSet.cards[i];
        try {
          const imagePrompt = buildCardImagePrompt(cardSet, card);
          const { url } = await generateImage({ prompt: imagePrompt });
          if (url) {
            card.imageUrl = url;
            results.push({ cardIndex: i, imageUrl: url });
          }
        } catch (e: any) {
          console.error(`Card ${i} image generation failed:`, e.message);
          // 개별 카드 실패는 무시하고 계속
        }
      }

      const updatedJson = JSON.stringify(parsed);
      await updateInterviewVideo(input.id, userId, { cardnewsContents: updatedJson });

      return { success: true, generated: results.length, total: cardSet.cards?.length || 0, results };
    }),

  /** 카드뉴스 개별 이미지 1080x1080 최적화 다운로드 URL 생성 */
  optimizeCardImage: protectedProcedure
    .input(z.object({
      id: z.number(),
      setIndex: z.number(),
      cardIndex: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.cardnewsContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 카드뉴스가 없습니다" });

      const parsed = parseJsonContent(video.cardnewsContents);
      const cardSet = parsed?.cardnews?.[input.setIndex];
      if (!cardSet) throw new TRPCError({ code: "BAD_REQUEST", message: "해당 카드뉴스 세트를 찾을 수 없습니다" });

      const card = cardSet.cards?.[input.cardIndex];
      if (!card?.imageUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "이미지가 아직 생성되지 않았습니다" });

      // 원본 이미지 fetch → sharp로 1080x1080 최적화
      const optimized = await fetchAndOptimizeImage(card.imageUrl);

      const safeTitle = sanitizeFileName(cardSet.setTitle || `set${input.setIndex + 1}`);
      const fileKey = `interview-cardnews/${userId}/${Date.now()}-${safeTitle}-card${input.cardIndex + 1}.jpg`;
      const { url } = await storagePut(fileKey, optimized, "image/jpeg");

      return { success: true, downloadUrl: url, fileName: `${safeTitle}_card${input.cardIndex + 1}.jpg` };
    }),

  /** 카드뉴스 세트 전체 ZIP 다운로드 (1080x1080 최적화) */
  downloadCardSetZip: protectedProcedure
    .input(z.object({
      id: z.number(),
      setIndex: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.cardnewsContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 카드뉴스가 없습니다" });

      const parsed = parseJsonContent(video.cardnewsContents);
      const cardSet = parsed?.cardnews?.[input.setIndex];
      if (!cardSet) throw new TRPCError({ code: "BAD_REQUEST", message: "해당 카드뉴스 세트를 찾을 수 없습니다" });

      const cardsWithImages = (cardSet.cards || []).filter((c: any) => c.imageUrl);
      if (cardsWithImages.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미지가 생성된 카드가 없습니다. 먼저 이미지를 생성해주세요." });
      }

      // ZIP 생성: archiver → Buffer
      const zipBuffer = await createCardNewsZip(cardSet, cardsWithImages);

      const safeTitle = sanitizeFileName(cardSet.setTitle || `set${input.setIndex + 1}`);
      const fileKey = `interview-cardnews-zip/${userId}/${Date.now()}-${safeTitle}.zip`;
      const { url } = await storagePut(fileKey, zipBuffer, "application/zip");

      return {
        success: true,
        downloadUrl: url,
        fileName: `${safeTitle}_카드뉴스_1080x1080.zip`,
        imageCount: cardsWithImages.length,
        totalCards: cardSet.cards?.length || 0,
      };
    }),

  /** 카드뉴스 전체 세트 ZIP 다운로드 (모든 세트 포함) */
  downloadAllCardSetsZip: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.cardnewsContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 카드뉴스가 없습니다" });

      const parsed = parseJsonContent(video.cardnewsContents);
      if (!parsed?.cardnews?.length) throw new TRPCError({ code: "BAD_REQUEST", message: "카드뉴스 데이터가 없습니다" });

      const zipBuffer = await createAllCardNewsZip(parsed.cardnews);

      const fileKey = `interview-cardnews-zip/${userId}/${Date.now()}-all-cardnews.zip`;
      const { url } = await storagePut(fileKey, zipBuffer, "application/zip");

      const totalImages = parsed.cardnews.reduce((sum: number, set: any) =>
        sum + (set.cards || []).filter((c: any) => c.imageUrl).length, 0);

      return {
        success: true,
        downloadUrl: url,
        fileName: `카드뉴스_전체_1080x1080.zip`,
        setCount: parsed.cardnews.length,
        totalImages,
      };
    }),

  /** 숏폼 스크립트 → SRT/VTT 자막 생성 */
  generateSubtitle: protectedProcedure
    .input(z.object({
      id: z.number(),
      shortformIndex: z.number(),
      format: z.enum(["srt", "vtt"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.shortformContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 숏폼 스크립트가 없습니다" });

      const parsed = parseJsonContent(video.shortformContents);
      const shortform = parsed?.shortforms?.[input.shortformIndex];
      if (!shortform) throw new TRPCError({ code: "BAD_REQUEST", message: "해당 숏폼 스크립트를 찾을 수 없습니다" });

      // LLM으로 고품질 자막 타임코드 생성
      const subtitleData = await generateSubtitleTimecodes(shortform);

      // SRT 또는 VTT 포맷으로 변환
      const content = input.format === "srt"
        ? buildSRT(subtitleData)
        : buildVTT(subtitleData);

      const ext = input.format;
      const safeTitle = sanitizeFileName(shortform.title || `shortform${input.shortformIndex + 1}`);
      const fileKey = `interview-subtitles/${userId}/${Date.now()}-${safeTitle}.${ext}`;
      const { url } = await storagePut(fileKey, content, "text/plain; charset=utf-8");

      return {
        success: true,
        downloadUrl: url,
        fileName: `${safeTitle}.${ext}`,
        content,
        cueCount: subtitleData.length,
      };
    }),

  /** 숏폼 전체 자막 일괄 생성 */
  generateAllSubtitles: protectedProcedure
    .input(z.object({
      id: z.number(),
      format: z.enum(["srt", "vtt"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const video = await getInterviewVideoById(input.id, userId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      if (!video.shortformContents) throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 숏폼 스크립트가 없습니다" });

      const parsed = parseJsonContent(video.shortformContents);
      if (!parsed?.shortforms?.length) throw new TRPCError({ code: "BAD_REQUEST", message: "숏폼 데이터가 없습니다" });

      const results: { index: number; title: string; downloadUrl: string; fileName: string }[] = [];

      for (let i = 0; i < parsed.shortforms.length; i++) {
        const sf = parsed.shortforms[i];
        try {
          const subtitleData = await generateSubtitleTimecodes(sf);
          const content = input.format === "srt" ? buildSRT(subtitleData) : buildVTT(subtitleData);
          const safeTitle = sanitizeFileName(sf.title || `shortform${i + 1}`);
          const fileKey = `interview-subtitles/${userId}/${Date.now()}-${safeTitle}.${input.format}`;
          const { url } = await storagePut(fileKey, content, "text/plain; charset=utf-8");
          results.push({ index: i, title: sf.title, downloadUrl: url, fileName: `${safeTitle}.${input.format}` });
        } catch (e: any) {
          console.error(`Subtitle generation failed for shortform ${i}:`, e.message);
        }
      }

      return { success: true, generated: results.length, total: parsed.shortforms.length, results };
    }),

  /* ─── 대시보드 통계 ─── */
  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    return getInterviewContentStats(String(ctx.user.id));
  }),

  /* ─── 콘텐츠 캘린더 ─── */
  calendarMonthly: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      return getCalendarItemsByMonth(String(ctx.user.id), input.year, input.month);
    }),

  calendarWeekly: protectedProcedure
    .input(z.object({ startDate: z.string() }))
    .query(async ({ ctx, input }) => {
      return getCalendarItemsByWeek(String(ctx.user.id), new Date(input.startDate));
    }),

  calendarCreate: protectedProcedure
    .input(z.object({
      title: z.string(),
      platform: z.string(),
      scheduledDate: z.string(),
      scheduledTime: z.string().optional(),
      notes: z.string().optional(),
      interviewVideoId: z.number().optional(),
      contentType: z.string().optional(),
      contentIndex: z.number().optional(),
      contentSummary: z.string().optional(),
      colorTag: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createCalendarItemExtended({
        userId: String(ctx.user.id),
        title: input.title,
        platform: input.platform,
        scheduledDate: new Date(input.scheduledDate),
        scheduledTime: input.scheduledTime,
        notes: input.notes,
        interviewVideoId: input.interviewVideoId,
        contentType: input.contentType,
        contentIndex: input.contentIndex,
        contentSummary: input.contentSummary,
        colorTag: input.colorTag,
      });
      return { success: true, item: result };
    }),

  calendarUpdate: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      platform: z.string().optional(),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
      colorTag: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, scheduledDate, ...rest } = input;
      const data: any = { ...rest };
      if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
      await updateCalendarItem(id, String(ctx.user.id), data);
      return { success: true };
    }),

  calendarDelete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteCalendarItem(input.id, String(ctx.user.id));
      return { success: true };
    }),

  /** LLM 기반 일주일 발행 스케줄 자동 제안 */
  suggestWeeklySchedule: protectedProcedure
    .input(z.object({
      id: z.number(),
      startDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const video = await getInterviewVideoById(input.id, String(ctx.user.id));
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      const blogs = parseJsonContent(video.blogContents as string);
      const cards = parseJsonContent(video.cardnewsContents as string);
      const shorts = parseJsonContent(video.shortformContents as string);

      if (!blogs && !cards && !shorts) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "생성된 콘텐츠가 없습니다" });
      }

      const contentSummary = [
        blogs ? `블로그 ${blogs.length}개: ${blogs.map((b: any) => b.title || b.headline).join(", ")}` : "",
        cards ? `카드뉴스 ${cards.length}세트` : "",
        shorts ? `숏폼 ${shorts.length}개: ${shorts.map((s: any) => s.title).join(", ")}` : "",
      ].filter(Boolean).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: WEEKLY_SCHEDULE_PROMPT,
          },
          {
            role: "user",
            content: `시작일: ${input.startDate}
원장님: ${video.doctorName || "미입력"}
병원: ${video.hospitalName || "미입력"}
주제: ${video.topicKeyword || "미입력"}

생성된 콘텐츠:
${contentSummary}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "weekly_schedule",
            strict: true,
            schema: {
              type: "object",
              properties: {
                schedule: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dayOffset: { type: "integer", description: "0=시작일, 1=다음날...6=마지막날" },
                      time: { type: "string", description: "HH:MM 형식" },
                      platform: { type: "string", description: "blog/instagram/youtube/tiktok" },
                      contentType: { type: "string", description: "blog/cardnews/shortform" },
                      contentIndex: { type: "integer" },
                      title: { type: "string" },
                      reason: { type: "string", description: "이 시간대/플랫폼을 선택한 이유" },
                    },
                    required: ["dayOffset", "time", "platform", "contentType", "contentIndex", "title", "reason"],
                    additionalProperties: false,
                  },
                },
                strategy: { type: "string", description: "전체 전략 요약" },
              },
              required: ["schedule", "strategy"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = String(response.choices?.[0]?.message?.content || "{}");
      return JSON.parse(content);
    }),

  /** 제안된 스케줄 일괄 캘린더에 등록 */
  applySchedule: protectedProcedure
    .input(z.object({
      interviewVideoId: z.number(),
      items: z.array(z.object({
        title: z.string(),
        platform: z.string(),
        scheduledDate: z.string(),
        scheduledTime: z.string().optional(),
        contentType: z.string(),
        contentIndex: z.number(),
        colorTag: z.string().optional(),
        contentSummary: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const created = [];
      for (const item of input.items) {
        const result = await createCalendarItemExtended({
          userId,
          title: item.title,
          platform: item.platform,
          scheduledDate: new Date(item.scheduledDate),
          scheduledTime: item.scheduledTime,
          interviewVideoId: input.interviewVideoId,
          contentType: item.contentType,
          contentIndex: item.contentIndex,
          colorTag: item.colorTag || getColorTag(item.contentType),
          contentSummary: item.contentSummary,
        });
        if (result) created.push(result);
      }
      return { success: true, created: created.length };
    }),

  /** 카드뉴스 텍스트 오버레이 이미지 생성 */
  generateCardOverlay: protectedProcedure
    .input(z.object({
      id: z.number(),
      setIndex: z.number(),
      cardIndex: z.number(),
      headline: z.string(),
      bodyText: z.string().optional(),
      style: z.object({
        headlineColor: z.string().default("#FFFFFF"),
        headlineFontSize: z.number().default(72),
        bodyColor: z.string().default("#F0F0F0"),
        bodyFontSize: z.number().default(36),
        overlayOpacity: z.number().default(0.4),
        position: z.enum(["top", "center", "bottom"]).default("center"),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const video = await getInterviewVideoById(input.id, String(ctx.user.id));
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      const parsed = parseJsonContent(video.cardnewsContents as string);
      if (!parsed?.length || !parsed[input.setIndex]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "카드뉴스 콘텐츠가 없습니다" });
      }

      const cardSet = parsed[input.setIndex];
      const card = cardSet.cards?.[input.cardIndex];
      if (!card?.imageUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미지가 없습니다. 먼저 이미지를 생성해주세요." });
      }

      const s = input.style;
      const overlayImage = await createTextOverlayImage({
        sourceImageUrl: card.imageUrl,
        headline: input.headline,
        bodyText: input.bodyText,
        headlineColor: s?.headlineColor || "#FFFFFF",
        headlineFontSize: s?.headlineFontSize || 72,
        bodyColor: s?.bodyColor || "#F0F0F0",
        bodyFontSize: s?.bodyFontSize || 36,
        overlayOpacity: s?.overlayOpacity ?? 0.4,
        position: s?.position || "center",
      });

      const fileKey = `interview-overlay/${video.id}/set${input.setIndex}-card${input.cardIndex}-${Date.now()}.jpg`;
      const { url } = await storagePut(fileKey, overlayImage, "image/jpeg");

      return { success: true, overlayUrl: url };
    }),

  /** 콘텐츠 공장 체험 모드 — 로그인 없이 샘플 인터뷰 텍스트로 블로그 1개 생성 */
  trialContentBlog: publicProcedure
    .input(z.object({
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      sampleTranscript: z.string().min(20),
    }))
    .mutation(async ({ input }) => {
      const { hospitalName, specialty, sampleTranscript } = input;

      const blogResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 의료 전문 AEO/GEO 블로그 라이터입니다.
원장님의 인터뷰 트랜스크립트를 바탕으로 고품질 블로그 글 1개를 작성합니다.

## 핵심 원칙
- 원장님의 말투, 전문성, 경험을 최대한 살려서 작성
- "자동 생성된 느낌" 절대 금지 — 원장님이 직접 쓴 것처럼 자연스럽게
- AEO/GEO 최적화: ChatGPT, Gemini, Claude, Perplexity, Grok이 답변에 인용하는 구조

## 응답 형식 (JSON)
{
  "title": "블로그 제목",
  "excerpt": "요약 텍스트",
  "content": "마크다운 본문 전체",
  "tags": ["태그1", "태그2", "태그3"],
  "angle": "환자 관점"
}`,
          },
          {
            role: "user",
            content: `병원: ${hospitalName}\n진료과: ${specialty}\n\n## 원장님 인터뷰 트랜스크립트\n${sampleTranscript}\n\n위 인터뷰 내용을 바탕으로 환자 관점의 고품질 AEO/GEO 블로그 글 1개를 작성해주세요.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trial_content_blog",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "블로그 제목" },
                excerpt: { type: "string", description: "요약" },
                content: { type: "string", description: "본문" },
                tags: { type: "array", items: { type: "string" }, description: "태그" },
                angle: { type: "string", description: "관점" },
              },
              required: ["title", "excerpt", "content", "tags", "angle"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = blogResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");

      return {
        title: parsed.title || "",
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
        tags: parsed.tags || [],
        angle: parsed.angle || "",
      };
    }),

  /** 콘텐츠 공장 체험 모드 — 인스타 릴스 제작 과정 AI 시연 */
  trialReelsProduction: publicProcedure
    .input(z.object({
      hospitalName: z.string().min(1),
      specialty: z.string().min(1),
      topic: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { hospitalName, specialty, topic } = input;

      const reelsResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 의료 마케팅 전문 인스타그램 릴스 제작 AI입니다.
병원의 전문 주제를 바탕으로 최고 조회수를 낼 수 있는 인스타그램 릴스를 기획합니다.

각 단계별로 상세한 결과물을 생성해주세요.

## 핵심 분석 원칙
1. topReels 분석 시 반드시 "왜 바이럴되었는지"를 3가지 축으로 분리 분석하세요:
   - hookType: 첫 3초 훅이 시청자를 잡는 심리적 메커니즘 (질문형→호기심 유발 / 충격형→감정 자극 / 공감형→공감대 형성 / 반전형→예상 뒤집기 / 정보형→즉각 가치 제공)
   - storytellingStructure: 전체 영상의 서사 구조가 시청 완료율을 높이는 원리 (문제-해결→긴장-해소 / 비포-애프터→변화 시각화 / 타임라인→시간순 몰입 / 리스트형→정보 밀도 / 인터뷰형→신뢰 구축)
   - format: 영상 제작 포맷이 알고리즘 노출에 유리한 이유 (자막 중심→무음 시청 최적화 / 얼굴 노출→친밀감 / B-roll→전문성 / 인터뷰→권위 / 혼합→다양성)
2. whyItWorked에는 위 3가지가 어떻게 시너지를 내어 바이럴을 만들었는지 종합 분석을 작성하세요.
3. viralFormula에는 분석한 릴스들의 공통 성공 패턴을 "[훅 유형] + [구조] + [포맷] = 바이럴" 형태로 공식화하세요.

## 응답 형식 (JSON)
{
  "benchmarkAnalysis": {
    "topReels": [
      { "account": "계정명", "views": "조회수", "hook": "훅 문구", "hookType": "훅 유형(질문형/충격형/공감형/반전형/정보형 중 택1)", "storytellingStructure": "스토리텔링 구조(문제-해결/비포-애프터/타임라인/리스트형/인터뷰형 중 택1)", "format": "영상 포맷(자막 중심/얼굴 노출/B-roll/인터뷰/혼합 중 택1)", "whyItWorked": "위 3가지 축의 시너지를 종합 분석한 성공 요인" }
    ],
    "viralFormula": "[훅 유형] + [구조] + [포맷] = 바이럴 공식 한 문장 요약",
    "trendKeywords": ["키워드1", "키워드2"],
    "optimalLength": "최적 길이",
    "bestPostingTime": "최적 업로드 시간"
  },
  "contentPlan": {
    "concept": "콘셉트",
    "hook": "첫 3초 훅 문구",
    "structure": [
      { "timestamp": "0-3초", "content": "훅", "visualDirection": "영상 연출" },
      { "timestamp": "3-10초", "content": "문제 제기", "visualDirection": "영상 연출" },
      { "timestamp": "10-25초", "content": "핵심 정보", "visualDirection": "영상 연출" },
      { "timestamp": "25-30초", "content": "CTA", "visualDirection": "영상 연출" }
    ],
    "cta": "CTA 문구"
  },
  "seoOptimization": {
    "caption": "캡션 전체",
    "hashtags": ["#해시태그1", "#해시태그2"],
    "altText": "대체 텍스트",
    "keywords": ["검색 최적화 키워드1", "키워드2"]
  },
  "productionPlan": {
    "videoTool": "추천 영상 툴",
    "videoReason": "선정 이유",
    "subtitleTool": "자막 툴",
    "subtitleStyle": "자막 스타일",
    "musicTool": "음원 툴",
    "musicGenre": "장르/분위기",
    "thumbnailTip": "썸네일 팁"
  },
  "script": "전체 나레이션 스크립트 (자막용)",
  "qualityChecklist": ["체크리스트 항목1", "항목 2", "항목 3"],
  "medicalLawCompliance": {
    "passed": true,
    "checkedItems": ["Before/After 사진 미사용 확인", "허위/과장 표현 없음 확인", "의료법 제56조 준수 확인"],
    "warnings": ["주의사항이 있으면 여기에"]
  },
  "competitorTrendInsight": {
    "currentTrend": "현재 해당 진료과 숏폼 트렌드 요약",
    "risingTopics": ["떠오르는 주제1", "떠오르는 주제2"],
    "recommendedNextTopics": ["다음에 만들면 좋을 주제1", "다음에 만들면 좋을 주제2"],
    "marketInsight": "시장 인사이트 한 문장"
  }
}`,
          },
          {
            role: "user",
            content: `병원: ${hospitalName}\n진료과: ${specialty}\n주제: ${topic}\n\n위 정보를 바탕으로 인스타그램 릴스 제작 전체 과정을 생성해주세요.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trial_reels_production",
            strict: true,
            schema: {
              type: "object",
              properties: {
                benchmarkAnalysis: {
                  type: "object",
                  properties: {
                    topReels: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          account: { type: "string" },
                          views: { type: "string" },
                          hook: { type: "string" },
                          hookType: { type: "string", description: "훅 유형: 질문형/충격형/공감형/반전형/정보형" },
                          storytellingStructure: { type: "string", description: "스토리텔링 구조: 문제-해결/비포-애프터/타임라인/리스트형/인터뷰형" },
                          format: { type: "string", description: "영상 포맷: 자막 중심/얼굴 노출/B-roll/인터뷰/혼합" },
                          whyItWorked: { type: "string" },
                        },
                        required: ["account", "views", "hook", "hookType", "storytellingStructure", "format", "whyItWorked"],
                        additionalProperties: false,
                      },
                    },
                    viralFormula: { type: "string", description: "바이럴 공식 요약" },
                    trendKeywords: { type: "array", items: { type: "string" } },
                    optimalLength: { type: "string" },
                    bestPostingTime: { type: "string" },
                  },
                  required: ["topReels", "viralFormula", "trendKeywords", "optimalLength", "bestPostingTime"],
                  additionalProperties: false,
                },
                contentPlan: {
                  type: "object",
                  properties: {
                    concept: { type: "string" },
                    hook: { type: "string" },
                    structure: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          timestamp: { type: "string" },
                          content: { type: "string" },
                          visualDirection: { type: "string" },
                        },
                        required: ["timestamp", "content", "visualDirection"],
                        additionalProperties: false,
                      },
                    },
                    cta: { type: "string" },
                  },
                  required: ["concept", "hook", "structure", "cta"],
                  additionalProperties: false,
                },
                seoOptimization: {
                  type: "object",
                  properties: {
                    caption: { type: "string" },
                    hashtags: { type: "array", items: { type: "string" } },
                    altText: { type: "string" },
                    keywords: { type: "array", items: { type: "string" } },
                  },
                  required: ["caption", "hashtags", "altText", "keywords"],
                  additionalProperties: false,
                },
                productionPlan: {
                  type: "object",
                  properties: {
                    videoTool: { type: "string" },
                    videoReason: { type: "string" },
                    subtitleTool: { type: "string" },
                    subtitleStyle: { type: "string" },
                    musicTool: { type: "string" },
                    musicGenre: { type: "string" },
                    thumbnailTip: { type: "string" },
                  },
                  required: ["videoTool", "videoReason", "subtitleTool", "subtitleStyle", "musicTool", "musicGenre", "thumbnailTip"],
                  additionalProperties: false,
                },
                script: { type: "string" },
                qualityChecklist: { type: "array", items: { type: "string" } },
                medicalLawCompliance: {
                  type: "object",
                  properties: {
                    passed: { type: "boolean", description: "의료법 준수 여부" },
                    checkedItems: { type: "array", items: { type: "string" }, description: "검증된 항목들" },
                    warnings: { type: "array", items: { type: "string" }, description: "주의사항" },
                  },
                  required: ["passed", "checkedItems", "warnings"],
                  additionalProperties: false,
                },
                competitorTrendInsight: {
                  type: "object",
                  properties: {
                    currentTrend: { type: "string", description: "현재 트렌드 요약" },
                    risingTopics: { type: "array", items: { type: "string" }, description: "떠오르는 주제들" },
                    recommendedNextTopics: { type: "array", items: { type: "string" }, description: "다음 추천 주제" },
                    marketInsight: { type: "string", description: "시장 인사이트" },
                  },
                  required: ["currentTrend", "risingTopics", "recommendedNextTopics", "marketInsight"],
                  additionalProperties: false,
                },
              },
              required: ["benchmarkAnalysis", "contentPlan", "seoOptimization", "productionPlan", "script", "qualityChecklist", "medicalLawCompliance", "competitorTrendInsight"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = reelsResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
      return parsed;
    }),
});

/* ─── 유틸 ─── */

function parseJsonContent(text: string | null | undefined) {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildCardImagePrompt(cardSet: any, card: any): string {
  const isKorean = /[\uac00-\ud7af]/.test(card.headline || "");
  return `Create a professional Instagram card news slide for a medical/aesthetic clinic.

Style: Clean, modern, premium medical marketing design.
Layout: Square format (1:1 ratio), suitable for Instagram carousel.
Color scheme: Soft gradient background with professional medical tones (light blue, white, mint, or subtle gold accents).

Content to visualize:
- Main headline: "${card.headline}"
- Body text concept: "${card.bodyText}"
- Visual type: ${card.visualType || "text-based"}
- Design direction: ${card.designNote || "Clean and professional"}
- This is slide ${card.slideNumber} of a ${cardSet.cards?.length || 7}-slide series
- Series concept: ${cardSet.concept || "Medical information"}

IMPORTANT:
- Do NOT include any text or typography in the image
- Create only the visual background/illustration that would go behind the text
- Use medical/aesthetic themed imagery appropriate for the content
- Keep the design clean with space for text overlay
- Professional, trustworthy, premium feel
- Suitable for a medical clinic's social media`;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"\/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}

/* ─── 이미지 최적화 (sharp) ─── */

async function fetchAndOptimizeImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`이미지 다운로드 실패: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // sharp: 1080x1080 정사각형 리사이즈 + 고품질 JPEG 최적화
  const optimized = await sharp(inputBuffer)
    .resize(1080, 1080, {
      fit: "cover",           // 정사각형 비율로 크롭
      position: "centre",     // 중앙 기준 크롭
      withoutEnlargement: false, // 작은 이미지도 확대
    })
    .jpeg({
      quality: 92,            // 인스타그램 최적 품질 (90~95 권장)
      mozjpeg: true,          // MozJPEG 압축 (더 나은 품질/크기 비율)
      chromaSubsampling: "4:4:4", // 최대 색상 품질 유지
    })
    .withMetadata({           // EXIF 메타데이터 유지 (sRGB 색공간)
      icc: "srgb",
    })
    .toBuffer();

  return optimized;
}

/* ─── ZIP 생성 (archiver) ─── */

async function createCardNewsZip(cardSet: any, cardsWithImages: any[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const chunks: Buffer[] = [];
    const passthrough = new PassThrough();
    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", reject);
    archive.pipe(passthrough);

    for (let i = 0; i < cardsWithImages.length; i++) {
      const card = cardsWithImages[i];
      try {
        const optimized = await fetchAndOptimizeImage(card.imageUrl);
        const fileName = `${String(card.slideNumber || i + 1).padStart(2, "0")}_card.jpg`;
        archive.append(optimized, { name: fileName });
      } catch (e: any) {
        console.error(`ZIP: Card ${i} optimization failed:`, e.message);
      }
    }

    await archive.finalize();
  });
}

async function createAllCardNewsZip(cardnewsSets: any[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const chunks: Buffer[] = [];
    const passthrough = new PassThrough();
    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", reject);
    archive.pipe(passthrough);

    for (let setIdx = 0; setIdx < cardnewsSets.length; setIdx++) {
      const cardSet = cardnewsSets[setIdx];
      const setFolder = sanitizeFileName(cardSet.setTitle || `set_${setIdx + 1}`);
      const cardsWithImages = (cardSet.cards || []).filter((c: any) => c.imageUrl);

      for (let i = 0; i < cardsWithImages.length; i++) {
        const card = cardsWithImages[i];
        try {
          const optimized = await fetchAndOptimizeImage(card.imageUrl);
          const fileName = `${setFolder}/${String(card.slideNumber || i + 1).padStart(2, "0")}_card.jpg`;
          archive.append(optimized, { name: fileName });
        } catch (e: any) {
          console.error(`ZIP: Set ${setIdx} Card ${i} failed:`, e.message);
        }
      }
    }

    await archive.finalize();
  });
}

/* ─── 자막 생성 (LLM 기반 고품질 타임코드) ─── */

interface SubtitleCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

const SUBTITLE_PROMPT = `당신은 전문 영상 자막 타이밍 전문가입니다.
숏폼 스크립트를 받아 전문적인 자막 타임코드를 생성합니다.

## 핵심 규칙 (Netflix/YouTube 자막 표준 기반)
1. 한 자막 단위: 최대 2줄, 줄당 최대 21자 (한국어 기준)
2. 읽기 속도: 12~15 CPS (Characters Per Second) — 시청자가 편안하게 읽을 수 있는 속도
3. 최소 표시 시간: 1.2초 / 최대 표시 시간: 7초
4. 자막 간 간격: 최소 80ms (눈 깜빡임 시간 고려)
5. 문장 자연스럽게 분할: 의미 단위로 끊음 (조사/어미 중간에서 끊지 않기)
6. 후크 구간(0~3초)은 자막이 빠르게 나타나도 OK (주목도 높이기)
7. CTA 구간은 자막이 조금 더 오래 떠 있어도 OK (행동 유도)

## 응답 형식 (JSON)
{
  "cues": [
    {
      "index": 1,
      "startMs": 0,
      "endMs": 2500,
      "text": "자막 텍스트 (최대 2줄, \\n으로 줄바꿈)"
    }
  ]
}

## 중요
- 스크립트의 예상 길이(duration)를 참고하여 전체 타임라인 배분
- 원본 스크립트의 말투와 느낌을 살려서 자막화
- 의학 용어는 정확하게 유지
- 감탄사, 간투사, 불필요한 반복어는 자막에서 제거 (깨끗한 자막)
- 자연스러운 호흡 단위로 끊음`;

async function generateSubtitleTimecodes(shortform: any): Promise<SubtitleCue[]> {
  const durationStr = shortform.duration || "30초";
  const durationSec = parseDurationToSeconds(durationStr);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: SUBTITLE_PROMPT },
      {
        role: "user",
        content: `## 숏폼 정보
- 제목: ${shortform.title}
- 예상 길이: ${durationStr} (${durationSec}초)
- 후크: ${shortform.hook}
- 플랫폼: ${shortform.platform || "릴스/숏츠"}

## 전체 스크립트
${shortform.script}

위 스크립트를 ${durationSec}초 길이의 영상 자막으로 변환해주세요.
Netflix 자막 표준(12~15 CPS, 줄당 21자, 최소 1.2초 표시)을 준수해주세요.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "subtitle_cues",
        strict: true,
        schema: {
          type: "object",
          properties: {
            cues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "integer" },
                  startMs: { type: "integer" },
                  endMs: { type: "integer" },
                  text: { type: "string" },
                },
                required: ["index", "startMs", "endMs", "text"],
                additionalProperties: false,
              },
            },
          },
          required: ["cues"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = String(response.choices?.[0]?.message?.content || "{}");
  const parsed = JSON.parse(content);
  return parsed.cues || [];
}

function parseDurationToSeconds(duration: string): number {
  // "30초" → 30, "1분" → 60, "1분 30초" → 90, "45s" → 45
  const minMatch = duration.match(/(\d+)\s*분/);
  const secMatch = duration.match(/(\d+)\s*(초|s)/i);
  let total = 0;
  if (minMatch) total += parseInt(minMatch[1]) * 60;
  if (secMatch) total += parseInt(secMatch[1]);
  if (total === 0) total = 30; // 기본값
  return total;
}

/* ─── SRT/VTT 포맷 빌더 ─── */

function formatTimeSRT(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const f = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(f, 3)}`;
}

function formatTimeVTT(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const f = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(f, 3)}`;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

function buildSRT(cues: SubtitleCue[]): string {
  return cues.map((cue) =>
    `${cue.index}\n${formatTimeSRT(cue.startMs)} --> ${formatTimeSRT(cue.endMs)}\n${cue.text}`
  ).join("\n\n");
}

function buildVTT(cues: SubtitleCue[]): string {
  const header = "WEBVTT\n\n";
  const body = cues.map((cue) =>
    `${cue.index}\n${formatTimeVTT(cue.startMs)} --> ${formatTimeVTT(cue.endMs)}\n${cue.text}`
  ).join("\n\n");
  return header + body;
}


/* ─── 콘텐츠 타입별 색상 태그 ─── */
function getColorTag(contentType: string): string {
  switch (contentType) {
    case "blog": return "blue";
    case "cardnews": return "pink";
    case "shortform": return "purple";
    default: return "gray";
  }
}

/* ─── 주간 스케줄 자동 제안 프롬프트 ─── */
const WEEKLY_SCHEDULE_PROMPT = `당신은 의료 마케팅 콘텐츠 발행 전략가입니다.
인터뷰 영상에서 생성된 블로그/카드뉴스/숏폼 콘텐츠를 일주일 동안 최적의 시간대에 배치합니다.

## 발행 전략 원칙

### 플랫폼별 최적 발행 시간
- **블로그 (네이버/구글)**: 화~목 오전 8:00~10:00 (검색 트래픽 피크)
- **인스타그램 카드뉴스**: 월/수/금 오후 12:00~13:00 또는 저녁 19:00~21:00 (피드 체류 피크)
- **유튜브 숏츠/릴스**: 화/목/토 오후 17:00~19:00 (영상 소비 피크)
- **틱톡**: 수/금/일 오후 18:00~21:00

### 콘텐츠 배치 원칙
1. **블로그 선행**: 블로그를 먼저 발행하여 SEO 인덱싱 시간 확보
2. **카드뉴스 후속**: 블로그 발행 1~2일 후 핵심 내용을 카드뉴스로 재가공
3. **숏폼 마무리**: 주 후반에 숏폼으로 바이럴 유도
4. **하루 최대 2개**: 같은 날 2개 이상 발행 시 채널 분산 (블로그+인스타 OK, 블로그+블로그 X)
5. **주말 활용**: 토요일 오전은 라이프스타일 콘텐츠 적합

### 콘텐츠 간 시너지
- 같은 주제의 블로그 → 카드뉴스 → 숏폼 순서로 배치 (깊이 → 요약 → 바이럴)
- 서로 다른 관점의 블로그는 2~3일 간격으로 배치

## 응답 형식
schedule 배열에 각 콘텐츠의 발행 일정을 배치하고, strategy에 전체 전략을 요약해주세요.
reason에는 해당 시간대/플랫폼을 선택한 구체적 이유를 작성해주세요.`;

/* ─── 텍스트 오버레이 이미지 생성 (sharp SVG 합성) ─── */

async function createTextOverlayImage(opts: {
  sourceImageUrl: string;
  headline: string;
  bodyText?: string;
  headlineColor: string;
  headlineFontSize: number;
  bodyColor: string;
  bodyFontSize: number;
  overlayOpacity: number;
  position: "top" | "center" | "bottom";
}): Promise<Buffer> {
  // 1. 원본 이미지 다운로드 및 1080x1080 리사이즈
  const response = await fetch(opts.sourceImageUrl);
  if (!response.ok) throw new Error(`이미지 다운로드 실패: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const base = await sharp(inputBuffer)
    .resize(1080, 1080, { fit: "cover", position: "centre" })
    .toBuffer();

  // 2. 텍스트 줄바꿈 처리 (한국어 기준 줄당 최대 12~14자)
  const headlineLines = wrapText(opts.headline, 14);
  const bodyLines = opts.bodyText ? wrapText(opts.bodyText, 20) : [];

  // 3. 텍스트 영역 높이 계산
  const headlineLineHeight = opts.headlineFontSize * 1.3;
  const bodyLineHeight = opts.bodyFontSize * 1.4;
  const headlineBlockHeight = headlineLines.length * headlineLineHeight;
  const bodyBlockHeight = bodyLines.length * bodyLineHeight;
  const gap = opts.bodyText ? 30 : 0;
  const totalTextHeight = headlineBlockHeight + gap + bodyBlockHeight;
  const padding = 60;

  // 4. 텍스트 Y 위치 계산
  let textStartY: number;
  if (opts.position === "top") {
    textStartY = padding + 40;
  } else if (opts.position === "bottom") {
    textStartY = 1080 - totalTextHeight - padding - 40;
  } else {
    textStartY = (1080 - totalTextHeight) / 2;
  }

  // 5. SVG 오버레이 생성
  const overlayAlpha = Math.round(opts.overlayOpacity * 255);
  const overlayHex = overlayAlpha.toString(16).padStart(2, "0");

  // 반투명 배경 영역
  const bgY = textStartY - padding;
  const bgHeight = totalTextHeight + padding * 2;

  let svgContent = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="${bgY}" width="1080" height="${bgHeight}" fill="#000000${overlayHex}" rx="0"/>`;

  // 헤드라인 텍스트
  let currentY = textStartY + opts.headlineFontSize;
  for (const line of headlineLines) {
    svgContent += `\n  <text x="540" y="${currentY}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${opts.headlineFontSize}" fill="${opts.headlineColor}" letter-spacing="1">${escapeXml(line)}</text>`;
    currentY += headlineLineHeight;
  }

  // 본문 텍스트
  if (bodyLines.length > 0) {
    currentY += gap;
    for (const line of bodyLines) {
      svgContent += `\n  <text x="540" y="${currentY}" text-anchor="middle" font-family="sans-serif" font-size="${opts.bodyFontSize}" fill="${opts.bodyColor}">${escapeXml(line)}</text>`;
      currentY += bodyLineHeight;
    }
  }

  svgContent += `\n</svg>`;

  // 6. sharp로 합성
  const overlayBuffer = Buffer.from(svgContent);
  const result = await sharp(base)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return result;
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxCharsPerLine) {
      lines.push(remaining);
      break;
    }
    // 최대 길이 내에서 자연스러운 끊기 지점 찾기
    let breakPoint = maxCharsPerLine;
    const spaceIdx = remaining.lastIndexOf(" ", maxCharsPerLine);
    const commaIdx = remaining.lastIndexOf(",", maxCharsPerLine);
    const periodIdx = remaining.lastIndexOf(".", maxCharsPerLine);
    const koBreak = remaining.lastIndexOf(" ", maxCharsPerLine);
    // 한국어: 조사/어미 뒤에서 끊기
    for (let i = Math.min(maxCharsPerLine, remaining.length) - 1; i >= maxCharsPerLine - 4 && i >= 0; i--) {
      const ch = remaining[i];
      if (ch === " " || ch === "," || ch === "." || ch === "!" || ch === "?" || ch === ")" || ch === "」") {
        breakPoint = i + 1;
        break;
      }
    }
    if (breakPoint > maxCharsPerLine) breakPoint = maxCharsPerLine;
    lines.push(remaining.substring(0, breakPoint).trim());
    remaining = remaining.substring(breakPoint).trim();
  }
  return lines;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

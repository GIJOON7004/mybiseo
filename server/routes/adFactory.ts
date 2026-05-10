/**
 * adFactory 라우터
 * routers.ts에서 분할 — adFactory
 */

import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createAdBrandProfile, createAdCreative, deleteAdBrandProfile, deleteAdCreative,
  getAdBrandProfileById, getAdBrandProfiles, getAdCreativeById, getAdCreativeStats,
  getAdCreatives, updateAdCreative,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createLogger } from "../lib/logger";
const logger = createLogger("ad-factory");

export const adFactoryRouter = router({
  // 브랜드 DNA 프로필
  listProfiles: protectedProcedure.query(async ({ ctx }) => {
    return getAdBrandProfiles(String(ctx.user.id));
  }),
  getProfile: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    return getAdBrandProfileById(input.id, String(ctx.user.id));
  }),
  deleteProfile: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteAdBrandProfile(input.id, String(ctx.user.id));
  }),

  // 브랜드 DNA 추출 (URL → AI 분석)
  extractBrandDna: protectedProcedure.input(z.object({
    hospitalUrl: z.string().url(),
  })).mutation(async ({ ctx, input }) => {
    // 1. 웹사이트 HTML 가져오기
    // eslint-disable-next-line no-useless-assignment
    let html = "";
    try {
      const resp = await fetch(input.hospitalUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MyBiseoBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      html = await resp.text();
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "웹사이트에 접속할 수 없습니다. URL을 확인해주세요." });
    }

    // 2. HTML에서 핵심 정보 추출 (제목, 메타, 색상, 로고 등)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i);
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i);
    const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);

    // 3. LLM으로 브랜드 DNA 분석
    const resp = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 병원 브랜드 분석 전문가입니다. 병원 웹사이트의 HTML과 텍스트를 분석하여 브랜드 DNA를 추출하세요.\n\n분석 항목:\n- 병원명\n- 메인 색상 (HEX 코드)\n- 보조 색상 (HEX 코드)\n- 액센트 색상 (HEX 코드)\n- 폰트 스타일 (세리프/산세리프/모던/클래식)\n- 톤앵매너 (전문적/친근한/고급스러운/활기찬)\n- 타겟 고객층\n- 브랜드 키워드 (5개)\n- 전문 진료과\n- 브랜드 요약 (2줄)\n\nJSON으로 응답하세요.` },
        { role: "user", content: `URL: ${input.hospitalUrl}\n제목: ${titleMatch?.[1] || "미상"}
설명: ${metaDesc?.[1] || "없음"}\nOG이미지: ${ogImage?.[1] || "없음"}\n\n본문 내용:\n${bodyText}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "brand_dna",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hospitalName: { type: "string", description: "병원명" },
              primaryColor: { type: "string", description: "메인 색상 HEX" },
              secondaryColor: { type: "string", description: "보조 색상 HEX" },
              accentColor: { type: "string", description: "액센트 색상 HEX" },
              fontStyle: { type: "string", description: "폰트 스타일" },
              toneOfVoice: { type: "string", description: "톤앥매너" },
              targetAudience: { type: "string", description: "타겟 고객층" },
              brandKeywords: { type: "string", description: "브랜드 키워드 (쉼표 구분)" },
              specialties: { type: "string", description: "전문 진료과 (쉼표 구분)" },
              brandSummary: { type: "string", description: "브랜드 요약 2줄" },
            },
            required: ["hospitalName", "primaryColor", "secondaryColor", "accentColor", "fontStyle", "toneOfVoice", "targetAudience", "brandKeywords", "specialties", "brandSummary"],
            additionalProperties: false,
          },
        },
      },
    });

    let parsed: any;
    try {
      const content = resp.choices?.[0]?.message?.content;
      parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "브랜드 분석 실패" }); }

    // 4. DB 저장
    const saved = await createAdBrandProfile({
      userId: String(ctx.user.id),
      hospitalUrl: input.hospitalUrl,
      hospitalName: parsed.hospitalName,
      logoUrl: ogImage?.[1] || undefined,
      primaryColor: parsed.primaryColor,
      secondaryColor: parsed.secondaryColor,
      accentColor: parsed.accentColor,
      fontStyle: parsed.fontStyle,
      toneOfVoice: parsed.toneOfVoice,
      targetAudience: parsed.targetAudience,
      brandKeywords: parsed.brandKeywords,
      specialties: parsed.specialties,
      brandSummary: parsed.brandSummary,
    });

    return { ...parsed, id: saved?.id, logoUrl: ogImage?.[1] || null };
  }),

  // 광고 카피 + 이미지 대량 생성
  generateAds: protectedProcedure.input(z.object({
    brandProfileId: z.number(),
    treatmentName: z.string().optional(),
    eventDescription: z.string().optional(),
    platforms: z.array(z.string()).default(["instagram"]),
    adTypes: z.array(z.string()).default(["sponsored"]),
    count: z.number().min(1).max(10).default(4),
    generateImages: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const userId = String(ctx.user.id);
    // 브랜드 프로필 조회
    const profile = await getAdBrandProfileById(input.brandProfileId, userId);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "브랜드 프로필을 찾을 수 없습니다" });

    const platformDimensions: Record<string, { name: string; width: string; height: string }> = {
      instagram: { name: "인스타그램 피드/릴스", width: "1080", height: "1080" },
      instagram_story: { name: "인스타그램 스토리", width: "1080", height: "1920" },
      facebook: { name: "페이스북 피드", width: "1200", height: "628" },
      google_display: { name: "구글 디스플레이", width: "1200", height: "628" },
      google_square: { name: "구글 정사각형", width: "1080", height: "1080" },
      naver_banner: { name: "네이버 배너", width: "1200", height: "600" },
      kakao: { name: "카카오 배너", width: "1029", height: "258" },
    };

    // LLM으로 카피 대량 생성
    const adCopies: any[] = [];
    for (const platform of input.platforms) {
      const dim = platformDimensions[platform] || platformDimensions.instagram;
      const resp = await invokeLLM({
        messages: [
          { role: "system", content: `당신은 병원 광고 카피라이터입니다. 브랜드 DNA에 맞춰 광고 카피를 생성하세요.\n\n## 브랜드 DNA\n- 병원명: ${profile.hospitalName}\n- 메인색상: ${profile.primaryColor}\n- 톤: ${profile.toneOfVoice}\n- 타겟: ${profile.targetAudience}\n- 키워드: ${profile.brandKeywords}\n- 전문과: ${profile.specialties}\n\n## 플랫폼: ${dim.name} (${dim.width}x${dim.height})\n\n## 의료광고법 준수 필수\n- "최고", "최초", "유일" 등 과장 표현 금지\n- 전후 사진 사용 시 "개인에 따라 차이가 있을 수 있습니다" 문구 필수\n- 부작용/주의사항 안내 필수\n- "무료", "할인" 등 가격 유인 표현 주의\n\nJSON 배열로 ${input.count}개 카피를 생성하세요.` },
          { role: "user", content: `${input.treatmentName ? `시술/서비스: ${input.treatmentName}` : "일반 병원 광고"}\n${input.eventDescription ? `이벤트: ${input.eventDescription}` : ""}\n광고 유형: ${input.adTypes.join(", ")}\n${input.count}개 생성해주세요.` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ad_copies",
            strict: true,
            schema: {
              type: "object",
              properties: {
                ads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headline: { type: "string", description: "광고 헤드라인 (20자 이내)" },
                      bodyText: { type: "string", description: "광고 본문 (50자 이내)" },
                      ctaText: { type: "string", description: "CTA 버튼 문구" },
                      hashtags: { type: "string", description: "해시태그 (쉼표 구분)" },
                      imagePrompt: { type: "string", description: "광고 이미지 생성용 영문 프롬프트 (Belova.ai 스타일, 브랜드 색상 반영, 깔끔한 의료 광고 디자인)" },
                      adType: { type: "string", description: "광고 유형" },
                    },
                    required: ["headline", "bodyText", "ctaText", "hashtags", "imagePrompt", "adType"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["ads"],
              additionalProperties: false,
            },
          },
        },
      });

      let parsed: any;
      try {
        const content = resp.choices?.[0]?.message?.content;
        parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      } catch { continue; }

      for (const ad of (parsed.ads || [])) {
        let imageUrl: string | undefined;
        if (input.generateImages) {
          try {
            const { generateImage } = await import("../_core/imageGeneration");
            const imgResult = await generateImage({
              prompt: `${ad.imagePrompt}. Brand colors: primary ${profile.primaryColor}, secondary ${profile.secondaryColor}. Clean medical advertising design, professional, modern. Size: ${dim.width}x${dim.height}px.`,
            });
            imageUrl = imgResult.url;
          } catch (e) {
            logger.warn("[AdFactory] Image generation failed:", e);
          }
        }

        const saved = await createAdCreative({
          userId,
          brandProfileId: input.brandProfileId,
          platform,
          adType: ad.adType || input.adTypes[0] || "sponsored",
          treatmentName: input.treatmentName,
          headline: ad.headline,
          bodyText: ad.bodyText,
          ctaText: ad.ctaText,
          imageUrl: imageUrl || undefined,
          imagePrompt: ad.imagePrompt,
          dimensions: `${dim.width}x${dim.height}`,
          hashtags: ad.hashtags,
        });
        adCopies.push({ ...ad, id: saved?.id, imageUrl, platform, dimensions: `${dim.width}x${dim.height}` });
      }
    }

    return { ads: adCopies, count: adCopies.length };
  }),

  // 광고 목록 조회
  listCreatives: protectedProcedure.input(z.object({
    platform: z.string().optional(),
    brandProfileId: z.number().optional(),
    favoriteOnly: z.boolean().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return getAdCreatives(String(ctx.user.id), input);
  }),

  // 광고 상세 조회
  getCreative: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    return getAdCreativeById(input.id, String(ctx.user.id));
  }),

  // 광고 수정 (카피 편집, 즐겨찾기)
  updateCreative: protectedProcedure.input(z.object({
    id: z.number(),
    headline: z.string().optional(),
    bodyText: z.string().optional(),
    ctaText: z.string().optional(),
    hashtags: z.string().optional(),
    isFavorite: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return updateAdCreative(id, String(ctx.user.id), data);
  }),

  // 광고 삭제
  deleteCreative: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    return deleteAdCreative(input.id, String(ctx.user.id));
  }),

  // 광고 통계
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getAdCreativeStats(String(ctx.user.id));
  }),

  // 의료광고법 검수
  checkCompliance: protectedProcedure.input(z.object({
    creativeId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const userId = String(ctx.user.id);
    const creative = await getAdCreativeById(input.creativeId, userId);
    if (!creative) throw new TRPCError({ code: "NOT_FOUND" });

    const resp = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 의료광고법 검수 전문가입니다. 다음 광고 카피를 검토하세요.\n\n검수 항목:\n1. 과장 표현 ("최고", "최초", "유일" 등)\n2. 비교 광고 ("다른 병원보다" 등)\n3. 전후 사진 관련 문구\n4. 부작용/주의사항 누락\n5. 가격 유인 표현\n6. 환자 유인 표현\n7. 비급여 의료인 시술 표현\n\nJSON으로 응답하세요.` },
        { role: "user", content: `헤드라인: ${creative.headline}\n본문: ${creative.bodyText}\nCTA: ${creative.ctaText}\n해시태그: ${creative.hashtags}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "compliance_check",
          strict: true,
          schema: {
            type: "object",
            properties: {
              status: { type: "string", description: "passed 또는 failed 또는 warning" },
              issues: { type: "array", items: { type: "string" }, description: "발견된 문제점" },
              suggestions: { type: "array", items: { type: "string" }, description: "개선 제안" },
              summary: { type: "string", description: "검수 요약" },
            },
            required: ["status", "issues", "suggestions", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    let result: any;
    try {
      const content = resp.choices?.[0]?.message?.content;
      result = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "검수 실패" }); }

    await updateAdCreative(input.creativeId, userId, {
      complianceStatus: result.status,
      complianceNotes: JSON.stringify({ issues: result.issues, suggestions: result.suggestions, summary: result.summary }),
    });

    return result;
  }),
});

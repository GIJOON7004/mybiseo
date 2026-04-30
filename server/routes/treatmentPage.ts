/**
 * treatmentPage 라우터
 * routers.ts에서 분할 — treatmentPage
 */

import { invokeLLM } from "../_core/llm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createTreatmentPage, deleteTreatmentPage, getTreatmentPageById, getTreatmentPageBySlug,
  getTreatmentPagesByUser, incrementTreatmentPageView, updateTreatmentPage,
} from "../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const treatmentPageRouter = router({
  generate: protectedProcedure.input(z.object({
    treatmentName: z.string(),
    treatmentCategory: z.string().optional(),
    hospitalName: z.string().optional(),
    hospitalInfo: z.string().optional(),
    doctorName: z.string().optional(),
    doctorTitle: z.string().optional(),
    targetAudience: z.string().optional(),
    keyBenefits: z.string().optional(),
    language: z.enum(["ko", "en", "ja", "zh", "vi", "th"]).default("ko"),
  })).mutation(async ({ input, ctx }) => {
    const langMap: Record<string, string> = { ko: "한국어", en: "English", ja: "日本語", zh: "中文", vi: "Tiếng Việt", th: "ภาษาไทย" };
    const lang = langMap[input.language] || "한국어";
    const prompt = `당신은 대한민국 TOP 5 피부과/성형외과 웹사이트를 제작한 경력 15년차 의료 마케팅 카피라이터이자 AEO(AI 검색 최적화) 전문가입니다.
보스피부과(vos.co.kr), 에이원성형외과, 바노바기 수준의 프리미엄 시술 상세페이지를 제작합니다.

## 시술 정보
- 시술명: ${input.treatmentName}
- 카테고리: ${input.treatmentCategory || "미지정"}
- 병원명: ${input.hospitalName || "미지정"}
- 병원 소개: ${input.hospitalInfo || "미지정"}
- 대표 의료진: ${input.doctorName || "미지정"} (${input.doctorTitle || "전문의"})
- 타겟 환자: ${input.targetAudience || "해당 시술에 관심 있는 환자"}
- 핵심 차별점: ${input.keyBenefits || "미지정"}

## 작성 원칙 (AEO + SEO + 의료광고법)
1. **AEO(AI 검색 최적화) 최우선**: AI(카카오 카나나, ChatGPT, Perplexity)가 이 페이지를 읽고 환자에게 추천할 수 있도록 구조화된 정보 제공. 과장된 수식어 대신 객관적 사실과 구체적 데이터 중심으로 작성
2. **의료광고법 100% 준수**: "최고", "완벽", "확실한 효과", "부작용 없음" 등 과장 표현 절대 금지. "~에 도움이 될 수 있습니다", "개인차가 있을 수 있습니다" 등 의료법 준수 표현 사용
3. **논리적 정보 흐름**: 모든 콘텐츠를 '증상/고민 → 대상 → 치료 방법(원리) → 시술 과정 → 회복 과정 → 주의사항' 순서로 구성하여 AI의 정보 수집을 돕는다
4. **SEO + AEO 키워드**: 시술명 + 관련 키워드를 자연스럽게 반복. 환자가 실제 검색하는 질문 형태("~하면 어떻게 해야 하나요?", "~수술 후 회복기간은?") 반영
5. **정보의 객관성**: "최고의 병원" 같은 주관적 수식어 배제. 실제 진료 경험과 구체적 치료 단계 안내 중심. 시술 시간, 회복 기간, 유지 기간 등 구체적 수치 포함 (일반적 범위)
6. **전문성 + 신뢰감**: 의학적 원리를 쉽게 설명하되, 전문 용어를 적절히 사용하여 신뢰도 확보
7. **감성적 공감**: 환자의 고민과 불안을 이해하는 따뜻한 톤. 시술 전후 변화에 대한 기대감 형성

## 섹션별 상세 가이드
1. **feature** (정확히 3개): 시술의 핵심 원리/기술/특징을 "Feature 01, 02, 03" 형태로. 각 feature는 제목(8자 이내) + 설명(50~80자). 의학적 원리를 환자가 이해할 수 있게 설명
2. **comparison**: 시술 옵션 비교표. 해당 시술의 종류별 비교 또는 유사 시술과의 차이점. 최소 3개 항목 비교. 각 항목에 장단점 명시
3. **benefits**: 장점 5개 + 추천 대상 5개. 장점은 구체적이고 측정 가능한 표현 사용. 추천 대상은 환자가 자신의 상황과 매칭할 수 있도록 구체적으로
4. **process**: 시술 과정 5단계 (상담→디자인→시술→회복→관리). 각 단계별 소요 시간과 핵심 포인트 포함
5. **faq**: 환자가 실제로 검색하는 질문 8개를 Q&A 형태로 생성. 반드시 다음 주제를 모두 포함: 통증/마취, 시술시간, 회복기간/일상복귀, 부작용/위험성, 유지기간, 비용/가격대, 시술 전 주의사항, 시술 후 관리법. 각 답변은 3~5문장으로 의학적 근거를 포함하여 구체적으로 작성. 질문은 환자의 실제 검색어 형태로 (예: "${input.treatmentName} 수술 후 회복기간은 얼마나 걸리나요?")
6. **doctor**: 의료진 전문성과 경력 강조. 환자에게 신뢰감을 주는 따뜻한 소개
7. **cta**: 상담 유도 문구. 부담 없이 상담받을 수 있다는 메시지 + 지금 바로 행동하게 만드는 긴급성

${lang}로 작성하세요.`;

    const aiResponse = await invokeLLM({
      messages: [{ role: "system", content: prompt }, { role: "user", content: `${input.treatmentName} 시술 상세페이지 콘텐츠를 JSON으로 생성해주세요.` }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "treatment_page",
          strict: true,
          schema: {
            type: "object",
            properties: {
              heroTitle: { type: "string", description: "히어로 메인 타이틀 - 시술의 핵심 가치를 한 줄로 (15~20자). 예: '자연스러운 코 라인의 완성'" },
              heroSubtitle: { type: "string", description: "히어로 서브타이틀 - 시술명을 포함한 전문적 한 줄 설명 (20~30자). 예: '맞춤형 3D 코성형 시스템'" },
              heroDescription: { type: "string", description: "히어로 설명문 - 환자의 고민에 공감하며 시술의 가치를 전달 (60~80자). 예: '얼굴 전체의 밸런스를 고려한 정밀 설계로, 자연스러우면서도 만족도 높은 결과를 추구합니다'" },
              seoTitle: { type: "string", description: "SEO 타이틀 - '시술명 | 병원명' 형식 (50~60자)" },
              seoDescription: { type: "string", description: "SEO 디스크립션 - 시술 핵심 키워드 2~3개 포함, 환자 검색 의도 반영 (120~160자)" },
              seoKeywords: { type: "string", description: "SEO 키워드 - 시술명, 지역명, 관련 증상 포함 (쉼표 구분, 8~12개)" },
              sections: {
                type: "array",
                description: "페이지 섹션 배열",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", description: "feature|comparison|benefits|process|faq|doctor|cta" },
                    title: { type: "string", description: "섹션 제목" },
                    subtitle: { type: "string", description: "섹션 부제" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          title: { type: "string" },
                          description: { type: "string" },
                          icon: { type: "string", description: "lucide 아이콘명" }
                        },
                        required: ["label", "title", "description", "icon"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["type", "title", "subtitle", "items"],
                  additionalProperties: false
                }
              }
            },
            required: ["heroTitle", "heroSubtitle", "heroDescription", "seoTitle", "seoDescription", "seoKeywords", "sections"],
            additionalProperties: false
          }
        }
      }
    });

    let content: any;
    try {
      content = JSON.parse(typeof aiResponse.choices[0].message.content === "string" ? aiResponse.choices[0].message.content : "{}");
      if (!content.heroTitle || !content.sections) throw new Error("AI 응답에 필수 필드가 누락되었습니다");
    } catch (parseErr: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `AI 콘텐츠 생성 실패: ${parseErr.message}` });
    }
    const slug = input.treatmentName.toLowerCase().replace(/[^a-z0-9가-힯]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    const result = await createTreatmentPage({
      userId: ctx.user.id,
      slug,
      treatmentName: input.treatmentName,
      treatmentCategory: input.treatmentCategory || null,
      heroTitle: content.heroTitle,
      heroSubtitle: content.heroSubtitle,
      heroDescription: content.heroDescription,
      sections: content.sections,
      seoTitle: content.seoTitle,
      seoDescription: content.seoDescription,
      seoKeywords: content.seoKeywords,
      themeColor: "#6B46C1",
      hospitalName: input.hospitalName || null,
      doctorName: input.doctorName || null,
      doctorTitle: input.doctorTitle || null,
      status: "draft",
    });
    return { id: (result as any)?.id || (result as any)?.insertId, slug, content };;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getTreatmentPagesByUser(ctx.user.id);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getTreatmentPageById(input.id);
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const page = await getTreatmentPageBySlug(input.slug);
    if (page) await incrementTreatmentPageView(page.id);
    return page;
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    data: z.object({
      heroTitle: z.string().optional(),
      heroSubtitle: z.string().optional(),
      heroDescription: z.string().optional(),
      heroImageUrl: z.string().optional(),
      sections: z.any().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      seoKeywords: z.string().optional(),
      themeColor: z.string().optional(),
      ctaPhone: z.string().optional(),
      ctaKakao: z.string().optional(),
      ctaNaver: z.string().optional(),
      hospitalName: z.string().optional(),
      hospitalLogo: z.string().optional(),
      doctorName: z.string().optional(),
      doctorTitle: z.string().optional(),
      doctorImageUrl: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }),
  })).mutation(async ({ input }) => {
    const updateData: any = { ...input.data };
    if (input.data.status === "published") updateData.publishedAt = new Date();
    return updateTreatmentPage(input.id, updateData);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteTreatmentPage(input.id);
    return { success: true };
  }),

  publish: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return updateTreatmentPage(input.id, { status: "published", publishedAt: new Date() });
  }),
});

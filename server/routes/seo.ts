/**
 * seo 라우터
 * routers.ts에서 분할 — seoKeyword, seoAnalyzer
 */

import { invokeLLM } from "../_core/llm";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBlogPost, createSeoKeyword, deleteSeoKeyword, getAllBlogCategories,
  getAllSeoKeywords, saveBenchmarkData, saveDiagnosisHistory, updateSeoKeyword,
  getMonthlyTrendByUrl, getCategoryTrendByUrl, getPublicHistoryByUrl, getScoreComparisonByUrl,
  createSeoLead,
} from "../db";
import { analyzeSeo, type CountryCode } from "../seo-analyzer";
import { generateRealityDiagnosis } from "../reality-diagnosis";
import { z } from "zod";
import { BLOG_GENERATOR_PROMPT, formatBlogContent } from "./_shared";

export const seoKeywordRouter = router({
  list: adminProcedure.query(async () => {
    return getAllSeoKeywords();
  }),

  create: adminProcedure
    .input(z.object({
      keyword: z.string().min(1),
      categoryId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await createSeoKeyword(input);
      return { success: true } as const;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "generating", "draft_ready", "review_done", "scheduled", "published"]).optional(),
      blogPostId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSeoKeyword(id, data);
      return { success: true } as const;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSeoKeyword(input.id);
      return { success: true } as const;
    }),

  // 키워드로 AI 블로그 글 자동 생성 + 초안 저장
  generateFromKeyword: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const keywords = await getAllSeoKeywords();
      const kw = keywords.find(k => k.id === input.id);
      if (!kw) throw new Error("키워드를 찾을 수 없습니다");

      // 상태 업데이트: generating
      await updateSeoKeyword(input.id, { status: "generating" });

      const categoryList = await getAllBlogCategories();
      const category = categoryList.find(c => c.id === kw.categoryId);
      const categoryName = category?.name ?? "일반";

      const userMessage = `키워드: "${kw.keyword}"
카테고리: "${categoryName}"

위 키워드와 카테고리에 맞는 AEO/GEO 최적화 블로그 글을 작성해주세요. AI 검색엔진이 답변에 인용할 수 있는 구조로 작성해주세요.`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: BLOG_GENERATOR_PROMPT },
            { role: "user", content: userMessage },
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
                  slug: { type: "string" },
                  excerpt: { type: "string" },
                  content: { type: "string" },
                  metaTitle: { type: "string" },
                  metaDescription: { type: "string" },
                  tags: { type: "string" },
                  readingTime: { type: "integer" },
                },
                required: ["title", "slug", "excerpt", "content", "metaTitle", "metaDescription", "tags", "readingTime"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = result.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");

        await createBlogPost({
          categoryId: kw.categoryId,
          title: parsed.title,
          slug: parsed.slug + "-" + Date.now().toString(36),
          excerpt: parsed.excerpt,
          content: formatBlogContent(parsed.content),
          metaTitle: parsed.metaTitle,
          metaDescription: parsed.metaDescription,
          tags: parsed.tags,
          readingTime: parsed.readingTime || 5,
          published: "draft",
        });

        await updateSeoKeyword(input.id, { status: "draft_ready" });
        return { success: true, post: { ...parsed, content: formatBlogContent(parsed.content) } } as const;
      } catch (error) {
        await updateSeoKeyword(input.id, { status: "pending" });
        throw error;
      }
    }),
});

export const seoAnalyzerRouter = router({
  analyze: publicProcedure
    .input(z.object({
      url: z.string().min(1, "URL을 입력해주세요"),
      specialty: z.string().optional(),
      country: z.enum(["kr", "th"]).optional().default("kr"),
      hospitalName: z.string().optional(),
      region: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      privacyConsent: z.boolean().optional(),
      marketingConsent: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await analyzeSeo(input.url, input.specialty, input.country as CountryCode);
      // 데이터 축적: 모든 진단 결과를 자동으로 이력에 저장
      try {
        const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
        const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
        await saveDiagnosisHistory({
          url: result.url,
          totalScore: result.totalScore,
          aiScore,
          grade: result.grade,
          specialty: input.specialty || null,
          categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
        });
        // 벤치마크 데이터도 자동 저장
        if (input.specialty) {
          const now = new Date();
          const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          await saveBenchmarkData({
            specialty: input.specialty,
            region: input.region || "전국",
            avgTotalScore: result.totalScore,
            avgAiScore: aiScore,
            sampleCount: 1,
            period,
          });
        }
        // 리드 자동 생성 (이메일이 있는 경우)
        if (input.email) {
          await createSeoLead({
            email: input.email,
            url: input.url,
            hospitalName: input.hospitalName || null,
            specialty: input.specialty || null,
            region: input.region || null,
            phone: input.phone || null,
            totalScore: result.totalScore,
            grade: result.grade,
            aiScore,
            privacyConsent: input.privacyConsent ?? false,
            marketingConsent: input.marketingConsent ?? false,
            source: "seo_checker",
          });
        }
        // 운영자 알림 발송
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `[진단 완료] ${input.hospitalName || input.url}`,
          content: `병원명: ${input.hospitalName || '-'}\n진료과: ${input.specialty || '-'}\n지역: ${input.region || '-'}\nURL: ${input.url}\n점수: ${result.totalScore}점 (${result.grade})\nAI 노출: ${aiScore}%\n이메일: ${input.email || '-'}\n전화: ${input.phone || '-'}`,
        });
      } catch (e) {
        console.error("[DataAccumulation] 진단 이력 저장 실패:", e);
      }
      return result;
    }),
  // 경쟁사 비교 분석: 내 URL + 경쟁사 URL 최대 3개 동시 분석
  compareAnalyze: publicProcedure
    .input(z.object({
      myUrl: z.string().min(1, "내 URL을 입력해주세요"),
      competitorUrls: z.array(z.string().min(1)).min(1).max(3),
      specialty: z.string().optional(),
      country: z.enum(["kr", "th"]).optional().default("kr"),
    }))
    .mutation(async ({ input }) => {
      const allUrls = [input.myUrl, ...input.competitorUrls];
      const results = await Promise.allSettled(
        allUrls.map(url => analyzeSeo(url, input.specialty, input.country as CountryCode))
      );
      // 데이터 축적: 비교 분석 결과도 모두 이력에 저장
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          try {
            const res = r.value;
            const aiCat = res.categories.find((c: any) => c.name === "AI 검색 노출");
            const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
            await saveDiagnosisHistory({
              url: res.url,
              totalScore: res.totalScore,
              aiScore,
              grade: res.grade,
              specialty: input.specialty || null,
              categoryScores: JSON.stringify(res.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
            });
          } catch (e) {
            console.error("[DataAccumulation] 비교 분석 이력 저장 실패:", e);
          }
        }
      }
      return results.map((r, i) => ({
        url: allUrls[i],
        isMysite: i === 0,
        result: r.status === "fulfilled" ? r.value : null,
        error: r.status === "rejected" ? "분석 실패" : null,
      }));
    }),
  // 현실 진단 요약: 네이버/구글/AI 인용 현황을 원장님 언어로 분석
  realityDiagnosis: publicProcedure
    .input(z.object({
      url: z.string().min(1),
      specialty: z.string().optional(),
      seoScore: z.number(),
      seoGrade: z.string(),
      categoryScores: z.record(z.string(), z.number()),
      siteName: z.string().optional(),
      region: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const domain = input.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      return generateRealityDiagnosis(
        domain,
        input.specialty || "",
        input.seoScore,
        input.seoGrade,
        input.categoryScores as Record<string, number>,
        input.siteName,
        input.region,
      );
    }),

  // PDF 리포트 생성: 진단 결과 기반 AI 인용 개선 가이드 생성
  // result를 직접 전달하면 재진단 없이 PDF만 생성, 없으면 URL로 진단 후 PDF 생성
  generateReport: publicProcedure
    .input(z.object({ url: z.string().min(1), specialty: z.string().optional(), country: z.enum(["kr", "th"]).optional().default("kr"), language: z.enum(["ko", "en", "th"]).optional(), result: z.any().optional() }))
    .mutation(async ({ input }) => {
      const result = input.result || await analyzeSeo(input.url, input.specialty, input.country as CountryCode);
      // 현실 진단 요약 데이터 생성 (4개 병렬 LLM 호출로 최적화됨)
      let realityData = null;
      try {
        const domain = input.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        const categoryScores = Object.fromEntries(
          result.categories.map((c: any) => [c.name, c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0])
        );
        realityData = await generateRealityDiagnosis(
          domain,
          input.specialty || "",
          result.totalScore,
          result.grade,
          categoryScores,
          result.siteName,
        );

        // (Screenshot capture removed — clean diagnostic report)
      } catch (err) {
        console.error("[generateReport] Reality diagnosis failed, continuing without it:", err);
      }
      const { generateSeoReportPdf } = await import("../seo-report-pdf");
      const pdfBuffer = await generateSeoReportPdf(result, input.country as any, input.language as any, realityData);
      const { storagePut } = await import("../storage");
      const timestamp = Date.now();
      const safeDomain = result.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50);
      const langSuffix = input.language ? `_${input.language}` : "";
      const fileKey = `ai-visibility-reports/${safeDomain}-${timestamp}${langSuffix}.pdf`;
      const { url: pdfUrl } = await storagePut(fileKey, Buffer.from(pdfBuffer), "application/pdf");
      // PDF 파일명: [병원명]AI가시성진단서.pdf 형식 (슬로건 제거)
      const { sanitizeHospitalName } = await import("../ai-visibility-report");
      const siteName = sanitizeHospitalName(result.siteName || safeDomain);
      const lang = input.language || "ko";
      const fileNameMap: Record<string, string> = {
        ko: `[${siteName}] AI 가시성 진단서.pdf`,
        en: `[${siteName}] AI Visibility Report.pdf`,
        th: `[${siteName}] รายงานการมองเห็น AI.pdf`,
      };
      const fileName = fileNameMap[lang] || fileNameMap.ko;
      return { pdfUrl, fileName };
    }),

  // ═══ 히스토리 추이 API (영업용 — 로그인 불필요) ═══

  // URL별 전체 히스토리 조회
  getHistory: publicProcedure
    .input(z.object({ url: z.string().min(1) }))
    .query(async ({ input }) => {
      // URL 정규화: http/https, trailing slash 통일
      const normalizedUrl = normalizeUrl(input.url);
      return getPublicHistoryByUrl(normalizedUrl, 24);
    }),

  // URL별 월간 추이 (차트용)
  getMonthlyTrend: publicProcedure
    .input(z.object({ url: z.string().min(1), months: z.number().min(1).max(24).optional() }))
    .query(async ({ input }) => {
      const normalizedUrl = normalizeUrl(input.url);
      return getMonthlyTrendByUrl(normalizedUrl, input.months ?? 12);
    }),

  // URL별 카테고리 추이 (상세 차트용)
  getCategoryTrend: publicProcedure
    .input(z.object({ url: z.string().min(1), months: z.number().min(1).max(24).optional() }))
    .query(async ({ input }) => {
      const normalizedUrl = normalizeUrl(input.url);
      return getCategoryTrendByUrl(normalizedUrl, input.months ?? 12);
    }),

  // 첫 진단 vs 최근 진단 비교
  getScoreComparison: publicProcedure
    .input(z.object({ url: z.string().min(1) }))
    .query(async ({ input }) => {
      const normalizedUrl = normalizeUrl(input.url);
      return getScoreComparisonByUrl(normalizedUrl);
    }),

  // ═══ 일괄 진단 + PDF 보고서 생성 (관리자 전용) ═══
  batchGenerateReports: adminProcedure
    .input(z.object({
      urls: z.array(z.object({
        url: z.string().min(1),
        specialty: z.string().optional(),
      })).min(1).max(50),
      country: z.enum(["kr", "th"]).optional().default("kr"),
      language: z.enum(["ko", "en", "th"]).optional().default("ko"),
    }))
    .mutation(async ({ input }) => {
      const results: Array<{
        url: string;
        status: "success" | "failed";
        totalScore?: number;
        grade?: string;
        pdfUrl?: string;
        fileName?: string;
        error?: string;
      }> = [];

      for (const item of input.urls) {
        try {
          // 1) SEO 진단
          const result = await analyzeSeo(item.url, item.specialty, input.country as CountryCode);

          // 2) 이력 저장
          try {
            const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
            const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
            await saveDiagnosisHistory({
              url: result.url,
              totalScore: result.totalScore,
              aiScore,
              grade: result.grade,
              specialty: item.specialty,
              categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
            });
          } catch { /* 이력 저장 실패해도 계속 진행 */ }

          // 3) Reality Diagnosis
          let realityData = null;
          try {
            const domain = item.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
            const categoryScores = Object.fromEntries(
              result.categories.map((c: any) => [c.name, c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0])
            );
            realityData = await generateRealityDiagnosis(
              domain, item.specialty || "", result.totalScore, result.grade, categoryScores, result.siteName,
            );
          } catch { /* Reality Diagnosis 실패해도 계속 진행 */ }

          // 4) PDF 생성
          const { generateSeoReportPdf } = await import("../seo-report-pdf");
          const pdfBuffer = await generateSeoReportPdf(result, input.country as any, input.language as any, realityData);

          // 5) S3 업로드
          const { storagePut } = await import("../storage");
          const timestamp = Date.now();
          const safeDomain = result.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50);
          const langSuffix = input.language ? `_${input.language}` : "";
          const fileKey = `ai-visibility-reports/batch/${safeDomain}-${timestamp}${langSuffix}.pdf`;
          const { url: pdfUrl } = await storagePut(fileKey, Buffer.from(pdfBuffer), "application/pdf");

          const siteName = result.siteName || safeDomain;
          const lang = input.language || "ko";
          const fileNameMap: Record<string, string> = {
            ko: `[${siteName}] AI 가시성 진단서.pdf`,
            en: `[${siteName}] AI Visibility Report.pdf`,
            th: `[${siteName}] รายงานการมองเห็น AI.pdf`,
          };

          results.push({
            url: item.url,
            status: "success",
            totalScore: result.totalScore,
            grade: result.grade,
            pdfUrl,
            fileName: fileNameMap[lang] || fileNameMap.ko,
          });
        } catch (err: any) {
          results.push({
            url: item.url,
            status: "failed",
            error: err?.message || "진단 실패",
          });
        }
      }

      const success = results.filter(r => r.status === "success").length;
      const failed = results.filter(r => r.status === "failed").length;
      return { total: input.urls.length, success, failed, results };
    }),
});

/** URL 정규화 — seo-analyzer의 normalizeUrl과 동일한 형식으로 맞춤 */
function normalizeUrl(input: string): string {
  let url = input.trim();
  url = url.replace(/\s*\([^)]*\)\s*/g, "").trim();
  url = url.replace(/[\s<>"']/g, "");
  url = url.replace(/^(https?:\/\/)+/i, (m) => m.split("://").slice(0, 1).join() + "://");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  try {
    const parsed = new URL(url);
    url = parsed.href;
  } catch {
    return url;
  }
  if (!url.endsWith("/") && !url.includes("?") && !url.includes("#")) {
    try {
      const path = new URL(url).pathname;
      if (!path.includes(".")) url += "/";
    } catch {}
  }
  return url;
}

/**
 * benchmarkingReport 라우터
 * routers.ts에서 분할 — benchmarkingReport, benchmarkingPdf
 */

import { invokeLLM } from "../_core/llm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBenchmarkingReport, createEmailSendLog, getBenchmarkingReportById, getBenchmarkingReportByShareToken,
  getBenchmarkingReportsByUser, incrementEmailSentCount, updateBenchmarkingReportStatus, upsertEmailContact,
} from "../db";
import { sendEmailViaNaver } from "../notifier";
import { analyzeSeo } from "../seo-analyzer";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const benchmarkingReportRouter = router({
  // 벤치마킹 리포트 생성 (경쟁사 SEO 분석 + AI Actionable Insights)
  generate: protectedProcedure
    .input(z.object({
      hospitalUrl: z.string().min(1),
      hospitalName: z.string().min(1),
      specialty: z.string().optional(),
      competitorUrls: z.array(z.string().min(1)).min(1).max(3),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      // 1단계: 내 병원 SEO 분석
      const myResult = await analyzeSeo(input.hospitalUrl, input.specialty);

      // 2단계: 경쟁사 SEO 분석 (병렬)
      const competitorResults = await Promise.all(
        input.competitorUrls.map(async (url) => {
          try {
            const result = await analyzeSeo(url, input.specialty);
            return { url, name: result.siteName || url, score: result.totalScore, grade: result.grade, categories: result.categories };
          } catch {
            return { url, name: url, score: 0, grade: "F", categories: [] };
          }
        })
      );

      // 3단계: DB에 초기 레코드 생성
      const reportId = await createBenchmarkingReport({
        userId: String(userId),
        hospitalName: input.hospitalName,
        hospitalUrl: input.hospitalUrl,
        specialty: input.specialty || null,
        competitors: JSON.stringify(competitorResults.map(c => ({ name: c.name, url: c.url, score: c.score, grade: c.grade }))),
        myScore: myResult.totalScore,
        myGrade: myResult.grade,
        reportTitle: `${input.hospitalName} vs 지역 TOP ${competitorResults.length} 벤치마킹 리포트`,
        executiveSummary: "",
        categoryComparison: "[]",
        actionableInsights: "[]",
        status: "generating",
      });

      // 4단계: 카테고리별 비교 데이터 생성
      const categoryComparison = myResult.categories.map(cat => {
        const competitorCats = competitorResults.map(comp => {
          const matchCat = comp.categories.find(c => c.name === cat.name);
          return { name: comp.name, score: matchCat?.score || 0, maxScore: matchCat?.maxScore || cat.maxScore };
        });
        return {
          category: cat.name,
          myScore: cat.score,
          maxScore: cat.maxScore,
          competitors: competitorCats,
          items: cat.items.filter(i => i.status === "fail" || i.status === "warning").map(i => ({ name: i.name, status: i.status, message: i.detail })),
        };
      });

      // 5단계: AI로 Actionable Insights + SNS 마케팅 팁 생성
      const aiPrompt = `당신은 병원 마케팅 전략 컨설턴트 10년차입니다. 대한민국 상위 1% 병원들의 디지털 마케팅 전략을 분석하고, 원장님이 즉시 실행할 수 있는 구체적이고 측정 가능한 지침을 작성합니다.

## 내 병원 정보
- 병원명: ${input.hospitalName}
- URL: ${input.hospitalUrl}
- 진료과: ${input.specialty || "미지정"}
- SEO 점수: ${myResult.totalScore}점 (${myResult.grade}등급)

## 경쟁사 분석
${competitorResults.map((c, i) => `${i + 1}. ${c.name} (${c.url}) - ${c.score}점 (${c.grade}등급)`).join("\n")}

## 카테고리별 비교
${categoryComparison.map(c => `- ${c.category}: 내 병원 ${c.myScore}/${c.maxScore}, 경쟁사 ${c.competitors.map(cc => `${cc.name} ${cc.score}/${cc.maxScore}`).join(", ")}`).join("\n")}

## 내 병원 문제점
${categoryComparison.flatMap(c => c.items).map(i => `- [${i.status}] ${i.name}: ${i.message}`).join("\n")}

## 작성 원칙
- executiveSummary: 원장님이 30초 안에 핵심을 파악할 수 있는 간결한 요약. 점수 차이와 가장 시급한 개선점을 명시
- actionableInsights: 각 항목은 "오늘 바로 실행 가능한" 수준으로 구체적으로. "메타 디스크립션을 추가하세요" 대신 "홈페이지 <head>에 <meta name='description' content='강남 임플란트 전문 OO치과...'> 태그를 추가하세요" 수준
- snsMarketingTips: 각 플랫폼별로 실제 포스팅 예시문구를 포함하세요
- weeklyPlan: 4주간 단계별 실행 계획. 1주차는 즉시 실행 가능한 것, 4주차는 장기 전략

JSON 형식으로 응답해주세요:`;

      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: aiPrompt },
          { role: "user", content: "위 분석 결과를 바탕으로 리포트를 생성해주세요." }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "benchmarking_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                executiveSummary: { type: "string", description: "핵심 요약 (3~5문장)" },
                actionableInsights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "string", description: "긴급/중요/권장 중 하나" },
                      title: { type: "string", description: "실행 항목 제목" },
                      description: { type: "string", description: "구체적인 실행 방법" },
                      expectedImpact: { type: "string", description: "기대 효과" },
                      competitorRef: { type: "string", description: "경쟁사 참조 (예: A병원은 이미 적용 중)" }
                    },
                    required: ["priority", "title", "description", "expectedImpact", "competitorRef"],
                    additionalProperties: false
                  },
                  description: "즉각 실행 가능한 지침 목록"
                },
                snsMarketingTips: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string", description: "플랫폼 (네이버 블로그/인스타그램/카카오 등)" },
                      tip: { type: "string", description: "구체적인 팁" },
                      frequency: { type: "string", description: "권장 빈도 (예: 주 2회)" },
                      keywordSuggestion: { type: "string", description: "추천 키워드" }
                    },
                    required: ["platform", "tip", "frequency", "keywordSuggestion"],
                    additionalProperties: false
                  },
                  description: "SNS 마케팅 팁 목록"
                },
                weeklyPlan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "string", description: "주차 (예: 1주차)" },
                      tasks: {
                        type: "array",
                        items: { type: "string" },
                        description: "해당 주 실행 항목"
                      }
                    },
                    required: ["week", "tasks"],
                    additionalProperties: false
                  },
                  description: "4주 실행 계획"
                }
              },
              required: ["executiveSummary", "actionableInsights", "snsMarketingTips", "weeklyPlan"],
              additionalProperties: false
            }
          }
        }
      });

      let aiData: any;
      try {
        aiData = JSON.parse(typeof aiResponse.choices[0].message.content === "string" ? aiResponse.choices[0].message.content : "{}");
      } catch {
        aiData = { executiveSummary: "자동 분석 결과를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.", actionableInsights: [], snsMarketingTips: [], weeklyPlan: [] };
      }
      // 6단계: DB 업데이트트
      await updateBenchmarkingReportStatus(reportId, "completed", {
        executiveSummary: aiData.executiveSummary || "",
        categoryComparison: JSON.stringify(categoryComparison),
        actionableInsights: JSON.stringify(aiData.actionableInsights || []),
        snsMarketingTips: JSON.stringify(aiData.snsMarketingTips || []),
        weeklyPlan: JSON.stringify(aiData.weeklyPlan || []),
      });

      // 7단계: 사용자 이메일로 자동 이메일 발송 + email_contacts 등록
      try {
        const userEmail = ctx.user.email;
        if (userEmail) {
          // email_contacts에 등록/업데이트
          const contactId = await upsertEmailContact({
            email: userEmail,
            name: ctx.user.name || undefined,
            hospitalName: input.hospitalName,
            specialty: input.specialty || undefined,
            source: "benchmarking_report",
            tags: ["벤치마킹", input.specialty || "일반"].filter(Boolean),
            lastDiagnosisUrl: input.hospitalUrl,
            lastDiagnosisScore: myResult.totalScore,
            lastDiagnosisGrade: myResult.grade,
          });
          // 이메일 발송
          const { buildBenchmarkingReportEmail } = await import("../email-templates");
          const reportUrl = `https://mybiseo.com/admin/benchmarking?id=${reportId}`;
          const emailHtml = buildBenchmarkingReportEmail({
            hospitalName: input.hospitalName,
            myScore: myResult.totalScore,
            myGrade: myResult.grade,
            competitors: competitorResults.map(c => ({ name: c.name, score: c.score, grade: c.grade })),
            executiveSummary: aiData.executiveSummary || "",
            topInsights: (aiData.actionableInsights || []).slice(0, 3),
            reportUrl,
          });
          const emailSent = await sendEmailViaNaver({
            to: userEmail,
            subject: `[MY비서] ${input.hospitalName} 벤치마킹 리포트 완료 (${myResult.totalScore}점)`,
            html: emailHtml,
          });
          // 발송 로그 기록
          await createEmailSendLog({
            contactId: contactId || undefined,
            email: userEmail,
            subject: `[MY비서] ${input.hospitalName} 벤치마킹 리포트 완료`,
            templateType: "benchmarking",
            status: emailSent ? "sent" : "failed",
            metadata: { reportId, hospitalName: input.hospitalName, score: myResult.totalScore },
          } as any);
          if (contactId) await incrementEmailSentCount(contactId);
        }
      } catch (emailErr) {
        console.error("[benchmarking] 자동 이메일 발송 실패:", emailErr);
      }

      return {
        reportId,
        myScore: myResult.totalScore,
        myGrade: myResult.grade,
        competitors: competitorResults.map(c => ({ name: c.name, score: c.score, grade: c.grade })),
        executiveSummary: aiData.executiveSummary,
        categoryComparison,
        actionableInsights: aiData.actionableInsights,
        snsMarketingTips: aiData.snsMarketingTips,
        weeklyPlan: aiData.weeklyPlan,
      };
    }),

  // 리포트 목록 조회
  list: protectedProcedure.query(async ({ ctx }) => {
    return getBenchmarkingReportsByUser(String(ctx.user.id));
  }),

  // 리포트 상세 조회
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const report = await getBenchmarkingReportById(input.id);
      if (!report || report.userId !== String(ctx.user.id)) return null;
      return {
        ...report,
        competitors: JSON.parse(report.competitors || "[]"),
        categoryComparison: JSON.parse(report.categoryComparison || "[]"),
        actionableInsights: JSON.parse(report.actionableInsights || "[]"),
        snsMarketingTips: report.snsMarketingTips ? JSON.parse(report.snsMarketingTips) : [],
        weeklyPlan: report.weeklyPlan ? JSON.parse(report.weeklyPlan) : [],
      };
    }),

  // 공유 토큰으로 리포트 조회 (로그인 불필요)
  getByShareToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const report = await getBenchmarkingReportByShareToken(input.token);
      if (!report) return null;
      return {
        ...report,
        competitors: JSON.parse(report.competitors || "[]"),
        categoryComparison: JSON.parse(report.categoryComparison || "[]"),
        actionableInsights: JSON.parse(report.actionableInsights || "[]"),
        snsMarketingTips: report.snsMarketingTips ? JSON.parse(report.snsMarketingTips) : [],
        weeklyPlan: report.weeklyPlan ? JSON.parse(report.weeklyPlan) : [],
      };
    }),
});

export const benchmarkingPdfRouter = router({
  generate: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const report = await getBenchmarkingReportById(input.reportId);
      if (!report || report.userId !== String(ctx.user.id)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "리포트를 찾을 수 없습니다" });
      }
      if (report.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "리포트 생성이 완료되지 않았습니다" });
      }
      const { generateBenchmarkingPdf } = await import("../benchmarking-pdf");
      const pdfBuffer = await generateBenchmarkingPdf({
        ...report,
        competitors: JSON.parse(report.competitors || "[]"),
        categoryComparison: JSON.parse(report.categoryComparison || "[]"),
        actionableInsights: JSON.parse(report.actionableInsights || "[]"),
        snsMarketingTips: report.snsMarketingTips ? JSON.parse(report.snsMarketingTips) : [],
        weeklyPlan: report.weeklyPlan ? JSON.parse(report.weeklyPlan) : [],
      });
      const { storagePut } = await import("../storage");
      const crypto = await import("crypto");
      const fileKey = `benchmarking-reports/${report.hospitalName.replace(/[^a-zA-Z0-9\uAC00-\uD7A3]/g, "_")}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.pdf`;
      const { url: pdfUrl } = await storagePut(fileKey, Buffer.from(pdfBuffer), "application/pdf");
      await updateBenchmarkingReportStatus(report.id, "completed", { pdfUrl });
      return { pdfUrl, fileName: `[${report.hospitalName}] 벤치마킹 리포트.pdf` };
    }),
});

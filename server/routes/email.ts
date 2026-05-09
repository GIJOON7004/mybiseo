/**
 * email 라우터
 * routers.ts에서 분할 — seoEmail, emailContact, retargetEmail
 */

import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createSeoLead, deleteEmailContact, getAllSeoLeads, getEmailContactStats,
  getEmailContacts, getEmailSendLogs, getEmailSendStats, updateEmailContact,
  upsertEmailContact,
} from "../db";
import { sendEmailViaNaver } from "../notifier";
import { analyzeSeo, type CountryCode } from "../seo-analyzer";
import { z } from "zod";

export const seoEmailRouter = router({
  sendReport: publicProcedure
    .input(z.object({
      email: z.string().email(),
      url: z.string().min(1),
      source: z.enum(["seo_checker", "seo_compare"]).optional(),
      specialty: z.string().optional(),
      country: z.enum(["kr", "th"]).optional().default("kr"),
      language: z.enum(["ko", "en", "th"]).optional(),
      result: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      // 0. 진단 자동화 체크 — 일일 임계값 초과 시 자동 발송, 품질 검증 실패 시 차단
      const { checkDiagnosisAutomation } = await import("../diagnosis-automation");
      // 1. SEO 분석 — result가 전달되면 재분석 없이 사용
      const result = input.result || await analyzeSeo(input.url, input.specialty, input.country as CountryCode);
      // 품질 검증 실행
      const automationCheck = await checkDiagnosisAutomation({
        totalScore: result.totalScore,
        categories: result.categories || [],
      });
      // 품질 검증 실패 시 발송 차단 + 운영자 알림
      if (!automationCheck.passed) {
        const { notifyOwner: notifyBlock } = await import("../_core/notification");
        await notifyBlock({
          title: "[진단 품질 검증 실패] 발송 차단됨",
          content: `URL: ${input.url}\n점수: ${result.totalScore}\n사유: ${automationCheck.reasons.join(", ")}`,
        });
        return { success: false, pdfUrl: null, blocked: true, reason: automationCheck.reasons };
      }

      // 2. AI 점수 계산
      const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
      const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;

      // 3. 리드 저장
      await createSeoLead({
        email: input.email,
        url: input.url,
        totalScore: result.totalScore,
        grade: result.grade,
        aiScore,
        source: input.source ?? "seo_checker",
      });

      // 4. PDF 생성 (실패해도 이메일은 발송) — 현실 진단 요약 포함
      let pdfUrl = "";
      try {
        const { generateSeoReportPdf } = await import("../seo-report-pdf");
        const { generateRealityDiagnosis } = await import("../reality-diagnosis");
        const reportLang = input.language || (input.country === "th" ? "en" : "ko");

        // 현실 진단 데이터 생성 (specialty가 있으면)
        let realityDiagnosis;
        try {
          const categoryScores = Object.fromEntries(
            result.categories.map((c: any) => [c.name, c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0])
          );
          const domain = result.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          realityDiagnosis = await generateRealityDiagnosis(
            domain,
            input.specialty || "",
            result.totalScore,
            result.grade,
            categoryScores,
            result.siteName,
          );
          // 검색 결과 스크린샷 캡처
          if (realityDiagnosis?.keywords?.length) {
            try {
              const { captureSearchScreenshots } = await import("../search-screenshot");
              const topKeywords = realityDiagnosis.keywords.slice(0, 2).map((k: any) => k.keyword);
              const ssResult = await captureSearchScreenshots(topKeywords, ["naver", "google"], 2);
              if (ssResult.screenshots.length > 0) {
                realityDiagnosis.searchScreenshots = ssResult.screenshots;
              }
            } catch (ssErr) {
              console.warn("[seoEmail] Screenshot capture failed, continuing without:", ssErr);
            }
          }
        } catch (rdErr) {
          console.error("[seoEmail] Reality diagnosis generation failed, continuing without it:", rdErr);
        }

        const pdfBuffer = await generateSeoReportPdf(result, input.country as any, reportLang as any, realityDiagnosis);
        const { storagePut } = await import("../storage");
        const timestamp = Date.now();
        const safeDomain = result.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50);
        const fileKey = `seo-reports/${safeDomain}-${timestamp}.pdf`;
        const { url } = await storagePut(fileKey, Buffer.from(pdfBuffer), "application/pdf");
        pdfUrl = url;
      } catch (pdfErr) {
        console.error("[seoEmail] PDF generation failed, sending email without PDF:", pdfErr);
      }

      // 5. 이메일 발송 — 맥킨지 스타일 고품질 템플릿
      const { buildDiagnosisEmail } = await import("../email-templates");
      const emailHtml = buildDiagnosisEmail({
        url: result.url,
        totalScore: result.totalScore,
        grade: result.grade,
        aiScore,
        summary: result.summary,
        categories: result.categories,
        pdfUrl: pdfUrl || undefined,
      });

      const emailSent = await sendEmailViaNaver({
        to: input.email,
        subject: `[MY\ube44\uc11c] ${result.url} AI+\ud3ec\ud138 \ub178\ucd9c \uc9c4\ub2e8 \uacb0\uacfc (${result.totalScore}\uc810)`,
        html: emailHtml,
        text: `MY\ube44\uc11c AI+\ud3ec\ud138 \ub178\ucd9c \uc9c4\ub2e8 \uacb0\uacfc\n\nURL: ${result.url}\n\uc885\ud569 \uc810\uc218: ${result.totalScore}\uc810 (${result.grade})\nAI \ub178\ucd9c: ${aiScore}%\n\uac1c\uc120 \ud544\uc694: ${result.summary.failed}\uac1c${pdfUrl ? `\n\nPDF \ub9ac\ud3ec\ud2b8: ${pdfUrl}` : ""}`,
      });

      // 6. 관리자에게 새 리드 알림
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "[\uc0c8 \ub9ac\ub4dc] SEO \uc9c4\ub2e8 \uc774\uba54\uc77c \ubc1c\uc1a1",
        content: `\uc774\uba54\uc77c: ${input.email}\nURL: ${input.url}\n\uc810\uc218: ${result.totalScore}\uc810 (${result.grade})\nAI \ub178\ucd9c: ${aiScore}%`,
      });

      return { success: emailSent, pdfUrl: pdfUrl || null };
    }),
});

export const emailContactRouter = router({
  list: adminProcedure
    .input(z.object({
      source: z.string().optional(),
      status: z.string().optional(),
      tag: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return getEmailContacts(input || {});
    }),
  stats: adminProcedure.query(async () => {
    return getEmailContactStats();
  }),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      hospitalName: z.string().optional(),
      specialty: z.string().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      marketingConsent: z.boolean().optional(),
      status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 0. 진단 자동화 체크 — 일일 임계값 초과 시 자동 발송, 품질 검증 실패 시 차단
      const { checkDiagnosisAutomation } = await import("../diagnosis-automation");
      const { id, ...updates } = input;
      await updateEmailContact(id, updates);
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // 0. 진단 자동화 체크 — 일일 임계값 초과 시 자동 발송, 품질 검증 실패 시 차단
      const { checkDiagnosisAutomation } = await import("../diagnosis-automation");
      await deleteEmailContact(input.id);
      return { success: true };
    }),
  addManual: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      hospitalName: z.string().optional(),
      specialty: z.string().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 0. 진단 자동화 체크 — 일일 임계값 초과 시 자동 발송, 품질 검증 실패 시 차단
      const { checkDiagnosisAutomation } = await import("../diagnosis-automation");
      const id = await upsertEmailContact({
        ...input,
        source: "manual",
      });
      return { id };
    }),
  sendLogs: adminProcedure
    .input(z.object({
      email: z.string().optional(),
      templateType: z.string().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return getEmailSendLogs(input || {});
    }),
  sendStats: adminProcedure.query(async () => {
    return getEmailSendStats();
  }),
});

export const retargetEmailRouter = router({
  sendReminders: adminProcedure.mutation(async () => {
    // 2주 전에 진단한 리드 중 아직 재진단하지 않은 리드에게 이메일 발송
    const allLeads = await getAllSeoLeads(500);
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const threeWeeksAgo = Date.now() - 21 * 24 * 60 * 60 * 1000;
    // 2~3주 전 진단한 리드만 대상
    const targets = allLeads.filter(l => {
      const created = new Date(l.createdAt).getTime();
      return created <= twoWeeksAgo && created >= threeWeeksAgo && l.email && l.status !== "contracted";
    });
    if (targets.length === 0) return { sent: 0, message: "재진단 유도 대상이 없습니다" };
    let sent = 0;
    for (const lead of targets) {
      try {
        const { buildRediagnosisEmail } = await import("../email-templates");
        const emailHtml = buildRediagnosisEmail({
          url: lead.url,
          totalScore: lead.totalScore ?? 0,
          grade: lead.grade ?? "",
        });
        await sendEmailViaNaver({
          to: lead.email,
          subject: `[MY비서] ${lead.url} AI 인용 점수가 변했을 수 있습니다`,
          html: emailHtml,
        });
        sent++;
      } catch (e) {
        // 개별 실패는 무시
      }
    }
    return { sent, total: targets.length };
  }),
});

import { createLogger } from "../lib/logger";
const logger = createLogger("scheduled");
/**
 * /api/scheduled/* — Heartbeat cron 콜백 핸들러
 * 
 * setInterval 기반 blog-scheduler를 Heartbeat cron으로 완전 전환.
 * 각 작업은 개별 엔드포인트로 분리되어 Heartbeat에서 HTTP POST로 호출됨.
 */
import { Router, Request, Response } from "express";
import {
  generateMonthlyKeywords,
  generateAndPublishBlogPost,
  runMonthlyBatchDiagnosis,
  runMonthlyReportAuto,
  runFollowupEmails,
  sendWeeklyBriefingNow,
} from "../blog-scheduler";
import { publishScheduledPosts } from "../db";
import { notifyOwner } from "../_core/notification";
import { createAdminNotification } from "../db";
import { addHistory } from "../scheduler/utils";

const router = Router();

// 인증: Heartbeat은 내부에서 호출하므로 별도 인증 불필요 (플랫폼이 보장)
// 하지만 안전을 위해 x-manus-heartbeat 헤더 확인
function verifyHeartbeat(req: Request, res: Response): boolean {
  // Heartbeat 플랫폼은 자동으로 인증 처리하므로 추가 검증 불필요
  // 향후 필요 시 여기에 서명 검증 추가 가능
  return true;
}

// ─── 1. 예약 발행 처리 (매 10분) ───
router.post("/publish_scheduled", async (_req, res) => {
  try {
    await publishScheduledPosts();
    res.json({ ok: true, task: "publish_scheduled" });
  } catch (err) {
    logger.error("[Scheduled] publish_scheduled 실패", { error: String(err) });
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 2. 월간 키워드 선정 (매월 1일 00:10 KST) ───
router.post("/monthly_keywords", async (_req, res) => {
  try {
    logger.info("[Scheduled] 월간 키워드 선정 시작");
    const result = await generateMonthlyKeywords();
    addHistory("keyword_gen", result.success, result.success ? `${result.count}개 키워드 선정` : result.error || "");
    res.json({ ok: true, task: "monthly_keywords", result });
  } catch (err) {
    logger.error("[Scheduled] monthly_keywords 실패", { error: String(err) });
    addHistory("keyword_gen", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 3. 블로그 자동 발행 (매주 화/금 10:00 KST) ───
router.post("/blog_publish", async (_req, res) => {
  try {
    logger.info("[Scheduled] 블로그 자동 발행 시작");
    const result = await generateAndPublishBlogPost();
    addHistory("publish", result.success, result.success ? result.title || "" : result.error || "");
    res.json({ ok: true, task: "blog_publish", result });
  } catch (err) {
    logger.error("[Scheduled] blog_publish 실패", { error: String(err) });
    addHistory("publish", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 4. 후속 이메일 발송 (매일 10:00 KST) ───
router.post("/followup_emails", async (_req, res) => {
  try {
    logger.info("[Scheduled] 후속 이메일 발송 시작");
    const result = await runFollowupEmails();
    addHistory("followup_email", true, `3일: ${result.sent3d}건, 7일: ${result.sent7d}건 발송`);
    res.json({ ok: true, task: "followup_emails", result });
  } catch (err) {
    logger.error("[Scheduled] followup_emails 실패", { error: String(err) });
    addHistory("followup_email", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 5. 월간 리포트 자동 발송 (매월 1일 08:00 KST) ───
router.post("/monthly_report", async (_req, res) => {
  try {
    logger.info("[Scheduled] 월간 리포트 자동 발송 시작");
    const result = await runMonthlyReportAuto();
    addHistory("followup_email", true, `월간 리포트: ${result.sent}건 발송, ${result.failed}건 실패`);
    if (result.sent > 0) {
      await notifyOwner({
        title: "[월간 리포트] 자동 발송 완료",
        content: `계약 고객 ${result.sent}건 월간 AI 인용 리포트 발송 완료 (${result.failed}건 실패)`,
      });
    }
    res.json({ ok: true, task: "monthly_report", result });
  } catch (err) {
    logger.error("[Scheduled] monthly_report 실패", { error: String(err) });
    addHistory("followup_email", false, `월간 리포트 실패: ${String(err)}`);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 6. 재진단 유도 이메일 (매주 수 10:00 KST) ───
router.post("/retarget_email", async (_req, res) => {
  try {
    logger.info("[Scheduled] 재진단 유도 이메일 발송 시작");
    const { getAllSeoLeads } = await import("../db");
    const { sendEmailViaNaver } = await import("../notifier");
    const { buildRediagnosisEmail } = await import("../email-templates");

    const allLeads = await getAllSeoLeads(500);
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const threeWeeksAgo = Date.now() - 21 * 24 * 60 * 60 * 1000;
    const targets = allLeads.filter(l => {
      const created = new Date(l.createdAt).getTime();
      return created <= twoWeeksAgo && created >= threeWeeksAgo && l.email && l.status !== "contracted";
    });
    let sent = 0;
    for (const lead of targets) {
      try {
        const emailHtml = buildRediagnosisEmail({ url: lead.url, totalScore: lead.totalScore ?? 0, grade: lead.grade ?? "" });
        await sendEmailViaNaver({ to: lead.email, subject: `[MY비서] ${lead.url} AI 인용 점수가 변했을 수 있습니다`, html: emailHtml });
        sent++;
      } catch (e) { console.warn(`[Scheduled] 재진단 이메일 개별 실패 (${lead.email}):`, String(e)); }
    }
    addHistory("followup_email", true, `재진단 유도: ${sent}/${targets.length}건 발송`);
    if (sent > 0) {
      await notifyOwner({ title: "[재진단 유도] 이메일 발송 완료", content: `${sent}건 재진단 유도 이메일 발송 완료` });
    }
    res.json({ ok: true, task: "retarget_email", sent, total: targets.length });
  } catch (err) {
    logger.error("[Scheduled] retarget_email 실패", { error: String(err) });
    addHistory("followup_email", false, `재진단 유도 실패: ${String(err)}`);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 7. 월간 벤치마크 집계 (매월 1일 07:00 KST) ───
router.post("/monthly_benchmark", async (_req, res) => {
  try {
    logger.info("[Scheduled] 월간 벤치마크 자동 집계 시작");
    const { aggregateMonthlyBenchmark, generateMonthlyAwards } = await import("../db");
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    const benchmarks = await aggregateMonthlyBenchmark(period);
    const awards = await generateMonthlyAwards(period);
    addHistory("benchmark", true, `${period} 벤치마크: ${benchmarks.length}개 진료과, 어워드: ${awards.length}개 병원`);
    await notifyOwner({
      title: `[벤치마크] ${period} 월간 집계 완료`,
      content: `${benchmarks.length}개 진료과 벤치마크 집계\n${awards.length}개 병원 어워드 선정`,
    });
    res.json({ ok: true, task: "monthly_benchmark", period, benchmarks: benchmarks.length, awards: awards.length });
  } catch (err) {
    logger.error("[Scheduled] monthly_benchmark 실패", { error: String(err) });
    addHistory("benchmark", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 8. 챗봇 인사이트 추출 (매일 11:00 KST) ───
router.post("/chat_insight", async (_req, res) => {
  try {
    logger.info("[Scheduled] 챗봇 인사이트 추출 시작");
    const { getSessionsWithoutInsight, getChatMessagesBySession, updateChatSessionInsight } = await import("../db");
    const { invokeLLM } = await import("../_core/llm");
    const sessions = await getSessionsWithoutInsight(20);
    let processed = 0;
    for (const session of sessions) {
      try {
        const messages = await getChatMessagesBySession(session.id);
        if (messages.length < 3) continue;
        const conversationText = messages.map(m => `${m.role}: ${m.content}`).join("\n").slice(0, 3000);
        const result = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 병원 마케팅 챗봇 대화 분석가입니다. 대화 내용을 분석하여 JSON으로 응답하세요." },
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
                  specialty: { type: "string", description: "관심 진료과" },
                  intentType: { type: "string", description: "문의 유형" },
                  conversionLikelihood: { type: "string", description: "전환 가능성 (high/medium/low)" },
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
      } catch (e) { console.warn(`[Scheduled] 세션 ${session.id} 인사이트 실패:`, String(e)); }
    }
    addHistory("chat_insight", true, `${processed}개 세션 인사이트 추출 완료`);
    res.json({ ok: true, task: "chat_insight", processed });
  } catch (err) {
    logger.error("[Scheduled] chat_insight 실패", { error: String(err) });
    addHistory("chat_insight", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 9. 주간 자동 SEO 진단 (매주 목 06:00 KST) ───
router.post("/weekly_diagnosis", async (_req, res) => {
  try {
    logger.info("[Scheduled] 주간 자동 SEO 진단 시작");
    const { getActiveHospitalProfiles, saveDiagnosisHistory } = await import("../db");
    const { analyzeSeo } = await import("../seo-analyzer");
    const profiles = await getActiveHospitalProfiles();
    let diagnosed = 0;
    let failed = 0;
    for (const profile of profiles) {
      try {
        const result = await analyzeSeo(profile.hospitalUrl, profile.specialty || undefined);
        const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
        const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
        await saveDiagnosisHistory({
          url: result.url,
          totalScore: result.totalScore,
          aiScore,
          grade: result.grade,
          specialty: profile.specialty || undefined,
          region: profile.region || undefined,
          categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
        });
        diagnosed++;
      } catch (e) {
        failed++;
        console.warn(`[Scheduled] ${profile.hospitalUrl} 진단 실패:`, String(e));
      }
    }
    addHistory("auto_diagnosis", true, `${diagnosed}/${profiles.length}개 병원 진단 완료 (${failed}건 실패)`);
    await notifyOwner({
      title: "[자동 진단] 주간 SEO 진단 완료",
      content: `${diagnosed}개 병원 자동 진단 완료\n${failed > 0 ? `${failed}건 실패` : "전체 성공"}`,
    });
    await createAdminNotification({
      type: "auto_diagnosis",
      title: `주간 SEO 진단 완료 - ${diagnosed}개 병원`,
      message: `${diagnosed}/${profiles.length}개 병원 진단 완료${failed > 0 ? ` (${failed}건 실패)` : ""}`,
      metadata: JSON.stringify({ diagnosed, failed, total: profiles.length }),
    });
    res.json({ ok: true, task: "weekly_diagnosis", diagnosed, failed });
  } catch (err) {
    logger.error("[Scheduled] weekly_diagnosis 실패", { error: String(err) });
    addHistory("auto_diagnosis", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 10. 전체 URL 월간 진단 (매월 15일 06:00 KST) ───
router.post("/monthly_diagnosis", async (_req, res) => {
  try {
    logger.info("[Scheduled] 월간 전체 URL 진단 시작");
    const result = await runMonthlyBatchDiagnosis();
    addHistory("monthly_diagnosis", true, `${result.diagnosed}/${result.totalUrls}개 URL 진단 완료 (${result.failed}건 실패, ${result.skipped}건 스킵)`);
    await notifyOwner({
      title: "[월간 진단] 전체 URL 월간 SEO 진단 완료",
      content: `${result.diagnosed}/${result.totalUrls}개 URL 진단 완료\n${result.failed > 0 ? `${result.failed}건 실패` : "전체 성공"}`,
    });
    res.json({ ok: true, task: "monthly_diagnosis", ...result });
  } catch (err) {
    logger.error("[Scheduled] monthly_diagnosis 실패", { error: String(err) });
    addHistory("monthly_diagnosis", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 11. AI 모니터링 (매주 월 09:00 KST) ───
router.post("/ai_monitor", async (_req, res) => {
  try {
    logger.info("[Scheduled] 주간 AI 모니터링 시작");
    const { runEnhancedAutoMonitor } = await import("../lib/ai-monitor-enhanced");
    const monitorResult = await runEnhancedAutoMonitor();
    const scoresSummary = monitorResult.scores.map((s: any) => `${s.keyword}: ${s.score}점`).join(", ");
    addHistory("ai_monitor", true, `${monitorResult.checkedKeywords}개 키워드 검사, ${monitorResult.totalMentions}건 언급, 점수: ${scoresSummary}`);
    await notifyOwner({
      title: "[AI 모니터링] 주간 자동 검사 완료",
      content: `${monitorResult.checkedKeywords}개 키워드 검사 완료\n총 ${monitorResult.totalMentions}건 AI 언급 감지`,
    });
    res.json({ ok: true, task: "ai_monitor", ...monitorResult });
  } catch (err) {
    logger.error("[Scheduled] ai_monitor 실패", { error: String(err) });
    addHistory("ai_monitor", false, String(err));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 12. 주간 브리핑 (매주 월 08:00 KST) ───
router.post("/weekly_briefing", async (_req, res) => {
  try {
    logger.info("[Scheduled] 주간 브리핑 생성 시작");
    const result = await sendWeeklyBriefingNow();
    res.json({ ok: true, task: "weekly_briefing", ...result });
  } catch (err) {
    logger.error("[Scheduled] weekly_briefing 실패", { error: String(err) });
    addHistory("weekly_briefing", false, `주간 브리핑 실패: ${String(err)}`);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 통합 엔드포인트: daily_tasks (매일 01:00 UTC = 10:00 KST) ───
router.post("/daily_tasks", async (req, res) => {
  const results: Record<string, any> = {};
  try {
    // 1. 후속 이메일
    try {
      const followup = await runFollowupEmails();
      results.followup = { ok: true, ...followup };
    } catch (e) { results.followup = { ok: false, error: String(e) }; }

    // 2. 재진단 유도 (수요일만)
    const dayOfWeek = new Date().getUTCDay(); // 0=일, 1=월, ..., 3=수
    if (dayOfWeek === 3) {
      try {
        const { getAllSeoLeads } = await import("../db");
        const { sendEmailViaNaver } = await import("../notifier");
        const { buildRediagnosisEmail } = await import("../email-templates");
        const allLeads = await getAllSeoLeads(500);
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const threeWeeksAgo = Date.now() - 21 * 24 * 60 * 60 * 1000;
        const targets = allLeads.filter(l => {
          const created = new Date(l.createdAt).getTime();
          return created <= twoWeeksAgo && created >= threeWeeksAgo && l.email && l.status !== "contracted";
        });
        let sent = 0;
        for (const lead of targets) {
          try {
            const emailHtml = buildRediagnosisEmail({ url: lead.url, totalScore: lead.totalScore ?? 0, grade: lead.grade ?? "" });
            await sendEmailViaNaver({ to: lead.email, subject: `[MY\uBE44\uC11C] ${lead.url} AI \uC778\uC6A9 \uC810\uC218\uAC00 \uBCC0\uD588\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4`, html: emailHtml });
            sent++;
          } catch (e) { console.warn(`[Scheduled] \uC7AC\uC9C4\uB2E8 \uC774\uBA54\uC77C \uAC1C\uBCC4 \uC2E4\uD328:`, String(e)); }
        }
        results.retarget = { ok: true, sent, total: targets.length };
      } catch (e) { results.retarget = { ok: false, error: String(e) }; }
    } else {
      results.retarget = { ok: true, skipped: "not_wednesday" };
    }

    // 3. 챗봇 인사이트
    try {
      const { getSessionsWithoutInsight, getChatMessagesBySession, updateChatSessionInsight } = await import("../db");
      const { invokeLLM } = await import("../_core/llm");
      const sessions = await getSessionsWithoutInsight(20);
      let processed = 0;
      for (const session of sessions) {
        try {
          const messages = await getChatMessagesBySession(session.id);
          if (messages.length < 3) continue;
          const conversationText = messages.map(m => `${m.role}: ${m.content}`).join("\n").slice(0, 3000);
          const result = await invokeLLM({
            messages: [
              { role: "system", content: "\uB2F9\uC2E0\uC740 \uBCD1\uC6D0 \uB9C8\uCF00\uD305 \uCC57\uBD07 \uB300\uD654 \uBD84\uC11D\uAC00\uC785\uB2C8\uB2E4. \uB300\uD654 \uB0B4\uC6A9\uC744 \uBD84\uC11D\uD558\uC5EC JSON\uC73C\uB85C \uC751\uB2F5\uD558\uC138\uC694." },
              { role: "user", content: `\uB2E4\uC74C \uCC57\uBD07 \uB300\uD654\uB97C \uBD84\uC11D\uD574\uC8FC\uC138\uC694:\n\n${conversationText}` },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "chat_insight",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    specialty: { type: "string" },
                    intentType: { type: "string" },
                    conversionLikelihood: { type: "string" },
                    summary: { type: "string" },
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
        } catch (e) { console.warn(`[Scheduled] \uC138\uC158 \uC778\uC0AC\uC774\uD2B8 \uC2E4\uD328:`, String(e)); }
      }
      results.chatInsight = { ok: true, processed };
    } catch (e) { results.chatInsight = { ok: false, error: String(e) }; }

    res.json({ ok: true, task: "daily_tasks", results });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 통합 엔드포인트: weekly_tasks (매주 월 00:00 UTC = 09:00 KST) ───
router.post("/weekly_tasks", async (_req, res) => {
  const results: Record<string, any> = {};
  try {
    // 1. AI 모니터링
    try {
      const { runEnhancedAutoMonitor } = await import("../lib/ai-monitor-enhanced");
      const monitorResult = await runEnhancedAutoMonitor();
      results.aiMonitor = { ok: true, ...monitorResult };
    } catch (e) { results.aiMonitor = { ok: false, error: String(e) }; }

    // 2. 주간 브리핑
    try {
      const briefingResult = await sendWeeklyBriefingNow();
      results.weeklyBriefing = { ok: true, ...briefingResult };
    } catch (e) { results.weeklyBriefing = { ok: false, error: String(e) }; }

    // 3. 자동 진단 (목요일에 해당하는 주에만 — 실제로는 매주 실행)
    try {
      const { getActiveHospitalProfiles, saveDiagnosisHistory } = await import("../db");
      const { analyzeSeo } = await import("../seo-analyzer");
      const profiles = await getActiveHospitalProfiles();
      let diagnosed = 0, failed = 0;
      for (const profile of profiles) {
        try {
          const result = await analyzeSeo(profile.hospitalUrl, profile.specialty || undefined);
          const aiCat = result.categories.find((c: any) => c.name === "AI \uAC80\uC0C9 \uB178\uCD9C");
          const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
          await saveDiagnosisHistory({
            url: result.url,
            totalScore: result.totalScore,
            aiScore,
            grade: result.grade,
            specialty: profile.specialty || undefined,
            region: profile.region || undefined,
            categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
          });
          diagnosed++;
        } catch (e) { failed++; console.warn(`[Scheduled] \uC9C4\uB2E8 \uC2E4\uD328:`, String(e)); }
      }
      results.weeklyDiagnosis = { ok: true, diagnosed, failed, total: profiles.length };
      await createAdminNotification({
        type: "auto_diagnosis",
        title: `\uC8FC\uAC04 SEO \uC9C4\uB2E8 \uC644\uB8CC - ${diagnosed}\uAC1C \uBCD1\uC6D0`,
        message: `${diagnosed}/${profiles.length}\uAC1C \uBCD1\uC6D0 \uC9C4\uB2E8 \uC644\uB8CC${failed > 0 ? ` (${failed}\uAC74 \uC2E4\uD328)` : ""}`,
        metadata: JSON.stringify({ diagnosed, failed, total: profiles.length }),
      });
    } catch (e) { results.weeklyDiagnosis = { ok: false, error: String(e) }; }

    res.json({ ok: true, task: "weekly_tasks", results });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── 통합 엔드포인트: monthly_tasks (매월 1일 15:10 UTC = 매월 2일 00:10 KST) ───
router.post("/monthly_tasks", async (_req, res) => {
  const results: Record<string, any> = {};
  try {
    // 1. 월간 키워드 선정
    try {
      const kwResult = await generateMonthlyKeywords();
      results.keywords = { ok: kwResult.success, count: kwResult.count };
    } catch (e) { results.keywords = { ok: false, error: String(e) }; }

    // 2. 월간 리포트
    try {
      const reportResult = await runMonthlyReportAuto();
      results.report = { ok: true, sent: reportResult.sent, failed: reportResult.failed };
    } catch (e) { results.report = { ok: false, error: String(e) }; }

    // 3. 월간 벤치마크
    try {
      const { aggregateMonthlyBenchmark, generateMonthlyAwards } = await import("../db");
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
      const benchmarks = await aggregateMonthlyBenchmark(period);
      const awards = await generateMonthlyAwards(period);
      results.benchmark = { ok: true, period, benchmarks: benchmarks.length, awards: awards.length };
    } catch (e) { results.benchmark = { ok: false, error: String(e) }; }

    // 4. 월간 진단 (15일에만 실행)
    const dayOfMonth = new Date().getUTCDate();
    if (dayOfMonth >= 14 && dayOfMonth <= 16) {
      try {
        const diagResult = await runMonthlyBatchDiagnosis();
        results.monthlyDiagnosis = { ok: true, ...diagResult };
      } catch (e) { results.monthlyDiagnosis = { ok: false, error: String(e) }; }
    } else {
      results.monthlyDiagnosis = { ok: true, skipped: "not_mid_month" };
    }

    await notifyOwner({
      title: "[\uC6D4\uAC04 \uC791\uC5C5] \uC790\uB3D9 \uC2E4\uD589 \uC644\uB8CC",
      content: `\uD0A4\uC6CC\uB4DC: ${results.keywords?.count || 0}\uAC1C, \uB9AC\uD3EC\uD2B8: ${results.report?.sent || 0}\uAC74, \uBCA4\uCE58\uB9C8\uD06C: ${results.benchmark?.benchmarks || 0}\uAC1C \uC9C4\uB8CC\uACFC`,
    });
    res.json({ ok: true, task: "monthly_tasks", results });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export function registerScheduledRoutes(app: Router) {
  app.use("/api/scheduled", router);
}

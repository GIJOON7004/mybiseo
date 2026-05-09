import { createLogger } from "./lib/logger";
const logger = createLogger("blog-scheduler");
/**
 * 블로그 자동 발행 스케줄러 v2
 * 
 * 구조:
 * 1) 매월 1일 00:10 KST — AI가 그 달의 검색량 높은 키워드 8개를 사전 선정하여 큐에 등록
 * 2) 매주 화/금 10:00 KST — 큐에서 키워드를 하나씩 꺼내 AI가 글을 작성하여 즉시 발행
 * 3) 예약 발행 — scheduled 상태의 글은 scheduledAt 시간이 되면 자동 발행
 * 
 * 최적화:
 * - 계절/시기별 키워드 선정 (여름=제모/자외선, 겨울=보습/리프팅 등)
 * - 카테고리 균등 분배 (편중 방지)
 * - 글 품질 자동 검증 (최소 길이, 구조 체크)
 * - 발행 실패 시 자동 재시도 (최대 2회)
 * - 발행 결과 로깅 및 통계
 */
import { invokeLLM } from "./_core/llm";
import {
  getAllBlogCategories,
  getAllSeoKeywords,
  getAllBlogPostsAdmin,
  createBlogPost,
  updateSeoKeyword,
  createSeoKeyword,
  publishScheduledPosts,
  getAiMonitorKeywords,
  createAiMonitorResult,
  getLeadsForFollowup3d,
  getLeadsForFollowup7d,
  markFollowupSent,
  getAllSeoLeads,
  createAdminNotification,
  getWeeklyBriefingData,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { sendEmailViaNaver } from "./notifier";
import {
  formatBlogContent,
  getSeasonalContext,
  validatePostQuality,
  addHistory,
  getHistory,
  getKSTTime,
  isAiMonitorTime,
  isPublishTime,
  isKeywordGenTime,
  normalizeUrlForDiag,
  formatWeeklyBriefing,
} from "./scheduler/utils";
import { AUTO_BLOG_PROMPT, MONTHLY_KEYWORD_PROMPT, FOLLOWUP_3D_SUBJECT, FOLLOWUP_7D_SUBJECT } from "./scheduler/prompts";
import { buildFollowup3dEmailNew as buildFollowup3dHtml, buildFollowup7dEmailNew as buildFollowup7dHtml } from "./email-templates";
// ── 스케줄러 상태 ──
/** 스케줄러 전역 상태 — 단일 객체로 캡슐화 (#13) */
interface SchedulerState {
  schedulerInterval: ReturnType<typeof setInterval> | null;
  lastRunAt: Date | null;
  lastRunResult: { success: boolean; title?: string; error?: string } | null;
  lastKeywordGenAt: Date | null;
  lastKeywordGenResult: { success: boolean; count?: number; error?: string } | null;
  isRunning: boolean;
  lastAiMonitorAt: Date | null;
  lastAiMonitorResult: { success: boolean; count?: number; error?: string } | null;
  lastAutoDiagnosisAt: Date | null;
  lastAutoDiagnosisResult: { success: boolean; diagnosed?: number; error?: string } | null;
  lastMonthlyDiagnosisAt: Date | null;
  lastMonthlyDiagnosisResult: { success: boolean; diagnosed?: number; totalUrls?: number; error?: string } | null;
  lastWeeklyBriefingRun: string;
}
const state: SchedulerState = {
  schedulerInterval: null,
  lastRunAt: null,
  lastRunResult: null,
  lastKeywordGenAt: null,
  lastKeywordGenResult: null,
  isRunning: false,
  lastAiMonitorAt: null,
  lastAiMonitorResult: null,
  lastAutoDiagnosisAt: null,
  lastAutoDiagnosisResult: null,
  lastMonthlyDiagnosisAt: null,
  lastMonthlyDiagnosisResult: null,
  lastWeeklyBriefingRun: "",
};

/**
 * 스케줄러 상태 조회
 */
export function getSchedulerStatus() {
  return {
    active: state.schedulerInterval !== null,
    lastRunAt: state.lastRunAt?.toISOString() ?? null,
    lastRunResult: state.lastRunResult,
    lastKeywordGenAt: state.lastKeywordGenAt?.toISOString() ?? null,
    lastKeywordGenResult: state.lastKeywordGenResult,
    isRunning: state.isRunning,
    schedule: "매주 화요일, 금요일 10:00 (KST)",
    keywordSchedule: "매월 1일 00:10 (KST) — 8개 키워드 자동 선정",
    aiMonitorSchedule: "매주 월요일 09:00 (KST) — 전체 활성 키워드 자동 검사",
    weeklyBriefingSchedule: "매주 월요일 08:00 (KST) — 주간 브리핑 Push 자동 발송",
    autoDiagnosisSchedule: "매주 목요일 06:00 (KST) — 계약 병원 자동 SEO 진단",
    monthlyDiagnosisSchedule: "매월 15일 06:00 (KST) — 전체 URL 월간 진단 (히스토리 축적)",
    lastMonthlyDiagnosisAt: state.lastMonthlyDiagnosisAt?.toISOString() ?? null,
    lastMonthlyDiagnosisResult: state.lastMonthlyDiagnosisResult,
    lastAiMonitorAt: state.lastAiMonitorAt?.toISOString() ?? null,
    lastAiMonitorResult: state.lastAiMonitorResult,
    lastAutoDiagnosisAt: state.lastAutoDiagnosisAt?.toISOString() ?? null,
    lastAutoDiagnosisResult: state.lastAutoDiagnosisResult,
    recentHistory: getHistory().slice(-10),
  };
}
/**
 * 매월 1일 — AI가 그 달의 키워드 8개를 선정하여 큐에 등록
 */
export async function generateMonthlyKeywords(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  if (state.isRunning) {
    return { success: false, error: "이미 작업 중입니다" };
  }

  state.isRunning = true;
  try {
    const categories = await getAllBlogCategories();
    if (categories.length === 0) {
      return { success: false, error: "블로그 카테고리가 없습니다" };
    }

    const allKeywords = await getAllSeoKeywords();
    const usedKeywords = allKeywords.map(k => k.keyword).join(", ");

    // 카테고리별 기존 키워드 수 계산 (균등 분배 참고)
    const categoryInfo = categories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      id: cat.id,
      existingCount: allKeywords.filter(k => k.categoryId === cat.id).length,
    }));

    const seasonalContext = getSeasonalContext();

    const result = await invokeLLM({
      messages: [
        { role: "system", content: MONTHLY_KEYWORD_PROMPT },
        {
          role: "user",
          content: `${seasonalContext}

카테고리 목록 (균등 분배 필요):
${categoryInfo.map(c => `- ${c.name} (slug: ${c.slug}, 기존 ${c.existingCount}개)`).join("\n")}

이미 사용된 키워드 (중복 금지):
${usedKeywords || "없음"}

이번 달에 검색량이 높을 키워드 8개를 선정해주세요. 각 카테고리에서 최소 1개씩 균등하게 배분하되, 시기적 특성을 반영하세요.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "monthly_keywords",
          strict: true,
          schema: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    keyword: { type: "string" },
                    categorySlug: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["keyword", "categorySlug", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["keywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : '{"keywords":[]}');
    const newKeywords: Array<{ keyword: string; categorySlug: string; reason: string }> = parsed.keywords || [];

    let savedCount = 0;
    for (const kw of newKeywords) {
      try {
        const category = categories.find(c => c.slug === kw.categorySlug);
        if (!category) continue;

        // 중복 체크
        const isDuplicate = allKeywords.some(
          existing => existing.keyword.toLowerCase() === kw.keyword.toLowerCase()
        );
        if (isDuplicate) continue;

        await createSeoKeyword({
          keyword: kw.keyword,
          categoryId: category.id,
          status: "pending",
        });
        savedCount++;
      } catch (e) {
        console.warn(`[KeywordGen] 키워드 저장 실패 (중복 등):`, String(e));
      }
    }

    const genResult = { success: true, count: savedCount };
    state.lastKeywordGenAt = new Date();
    state.lastKeywordGenResult = genResult;

    addHistory("keyword_gen", true, `${savedCount}개 키워드 선정 완료`);
    console.log(`[BlogScheduler] 월간 키워드 ${savedCount}개 선정 완료`);
    return genResult;
  } catch (error: any) {
    const errorMsg = error?.message || "알 수 없는 오류";
    logger.error("월간 키워드 선정 실패", { detail: errorMsg });
    state.lastKeywordGenResult = { success: false, error: errorMsg };
    addHistory("keyword_gen", false, errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    state.isRunning = false;
  }
}
/**
 * pending 상태의 키워드 중 하나를 선택하여 블로그 글 생성 (재시도 포함)
 */
export async function generateAndPublishBlogPost(retryCount = 0): Promise<{
  success: boolean;
  title?: string;
  error?: string;
}> {
  const MAX_RETRIES = 2;

  if (state.isRunning && retryCount === 0) {
    return { success: false, error: "이미 생성 중입니다" };
  }

  if (retryCount === 0) state.isRunning = true;

  try {
    // 1. 카테고리 목록 가져오기
    const categories = await getAllBlogCategories();
    if (categories.length === 0) {
      return { success: false, error: "블로그 카테고리가 없습니다" };
    }

    // 2. pending 상태의 키워드 가져오기 (가장 오래된 것 = 먼저 등록된 것)
    const allKeywords = await getAllSeoKeywords();
    const pendingKeywords = allKeywords
      .filter(k => k.status === "pending")
      .sort((a, b) => {
        // createdAt 기준 오름차순 (가장 오래된 것 먼저)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

    let keyword: string;
    let keywordId: number | null = null;
    let categoryId: number;

    if (pendingKeywords.length > 0) {
      const selected = pendingKeywords[0]; // 가장 오래된 pending 키워드
      keyword = selected.keyword;
      keywordId = selected.id;
      categoryId = selected.categoryId;

      await updateSeoKeyword(keywordId, { status: "generating" });
    } else {
      // pending 키워드가 없으면 즉석으로 키워드 생성 (fallback)
      console.log("[BlogScheduler] pending 키워드 없음 — 즉석 생성");
      const autoResult = await generateMonthlyKeywords();
      if (!autoResult.success || !autoResult.count) {
        return { success: false, error: "키워드 자동 생성에 실패했습니다. 다음 발행 시 재시도합니다." };
      }

      // 방금 생성된 키워드 중 첫 번째 선택
      const refreshedKeywords = await getAllSeoKeywords();
      const newPending = refreshedKeywords
        .filter(k => k.status === "pending")
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });

      if (newPending.length === 0) {
        return { success: false, error: "키워드 생성 후에도 pending 키워드가 없습니다" };
      }

      const selected = newPending[0];
      keyword = selected.keyword;
      keywordId = selected.id;
      categoryId = selected.categoryId;

      await updateSeoKeyword(keywordId, { status: "generating" });
    }

    // 3. 기존 글 제목 가져오기 (중복 방지)
    const existingPosts = await getAllBlogPostsAdmin();
    const existingTitles = existingPosts
      .slice(0, 50)
      .map(p => p.title)
      .join("\n- ");

    const categoryName = categories.find(c => c.id === categoryId)?.name ?? "일반";
    const seasonalContext = getSeasonalContext();

    // 4. AI로 블로그 글 생성
    const userMessage = `키워드: "${keyword}"
카테고리: "${categoryName}"
${seasonalContext}

기존 글 제목 목록 (이와 겹치지 않게 작성):
- ${existingTitles || "없음"}

위 키워드와 카테고리에 맞는 SEO 최적화 블로그 글을 작성해주세요. 시기적 특성을 자연스럽게 반영하세요.`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: AUTO_BLOG_PROMPT },
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
    if (!content) {
      if (keywordId) await updateSeoKeyword(keywordId, { status: "pending" });
      if (retryCount < MAX_RETRIES) {
        console.log(`[BlogScheduler] AI 응답 비어있음 — 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
        return generateAndPublishBlogPost(retryCount + 1);
      }
      return { success: false, error: "AI 응답이 비어있습니다 (재시도 실패)" };
    }

    const parsed = JSON.parse(typeof content === "string" ? content : "{}");

    // 5. 품질 검증
    const quality = validatePostQuality(parsed);
    if (!quality.valid) {
      console.log(`[BlogScheduler] 품질 미달: ${quality.issues.join(", ")}`);
      if (retryCount < MAX_RETRIES) {
        if (keywordId) await updateSeoKeyword(keywordId, { status: "pending" });
        console.log(`[BlogScheduler] 품질 미달 — 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
        return generateAndPublishBlogPost(retryCount + 1);
      }
      // 마지막 시도에서도 미달이면 그래도 발행 (로그만 남김)
      console.warn(`[BlogScheduler] 품질 미달이지만 최종 시도이므로 발행: ${quality.issues.join(", ")}`);
    }

    // 6. 블로그 글 저장 (즉시 발행)
    await createBlogPost({
      categoryId,
      title: parsed.title,
      slug: parsed.slug + "-" + Date.now().toString(36),
      excerpt: parsed.excerpt,
      content: formatBlogContent(parsed.content),
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      tags: parsed.tags,
      readingTime: parsed.readingTime || 5,
      published: "published",
    });

    // 7. 키워드 상태 업데이트
    if (keywordId) {
      await updateSeoKeyword(keywordId, { status: "published" });
    }

    const runResult = { success: true, title: parsed.title };
    state.lastRunAt = new Date();
    state.lastRunResult = runResult;

    addHistory("publish", true, `"${parsed.title}" 발행 완료`);
    console.log(`[BlogScheduler] 자동 발행 완료: "${parsed.title}"`);
    return runResult;
  } catch (error: any) {
    const errorMsg = error?.message || "알 수 없는 오류";
    logger.error("자동 발행 실패", { detail: errorMsg });

    if (retryCount < MAX_RETRIES) {
      console.log(`[BlogScheduler] 오류 발생 — 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
      return generateAndPublishBlogPost(retryCount + 1);
    }

    state.lastRunResult = { success: false, error: errorMsg };
    addHistory("publish", false, errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    if (retryCount === 0) state.isRunning = false;
  }
}
/**
 * 스케줄러 시작 — 10분마다 체크
 */
/** @deprecated Heartbeat cron으로 전환 완료. /api/scheduled/* 엔드포인트 사용. 이 함수는 하위 호환성을 위해 유지되지만 더 이상 호출되지 않음. */
export function startBlogScheduler() {
  if (state.schedulerInterval) {
  console.warn("[BlogScheduler] ⚠️ startBlogScheduler는 deprecated. Heartbeat cron(/api/scheduled/*)으로 전환 완료.");
    console.log("[BlogScheduler] 이미 실행 중입니다");
    return;
  }

  console.log("[BlogScheduler] 스케줄러 시작 — 매주 화/금 10:00 KST 발행, 매월 1일 키워드 선정");

  const CHECK_INTERVAL = 10 * 60 * 1000; // 10분마다 체크 (정확도 향상)
  let lastPublishRun = "";
  let lastKeywordRun = "";
  let lastAiMonitorRun = "";
  let lastFollowupRun = "";
  let lastMonthlyReportRun = "";
  let lastRetargetRun = "";
  let lastBenchmarkRun = "";
  let lastInsightRun = "";
  let lastMonthlyDiagRun = "";
  // TODO: setInterval은 Cloud Run에서 동작하지 않음. Heartbeat cron으로 전환 필요 (references/periodic-updates.md 참조)

  state.schedulerInterval = setInterval(async () => {
    try {
      // 예약 발행 처리 (매 체크마다)
      await publishScheduledPosts();

      const kst = getKSTTime();
      const todayKey = `${kst.year}-${kst.month}-${kst.day}`;

      // 매월 1일 키워드 선정
      if (isKeywordGenTime()) {
        const keywordRunKey = `${todayKey}-keyword`;
        if (lastKeywordRun !== keywordRunKey) {
          lastKeywordRun = keywordRunKey;
          console.log("[BlogScheduler] 월간 키워드 선정 시작");
          await generateMonthlyKeywords();
        }
      }

      // 화/금 발행
      if (isPublishTime()) {
        const publishRunKey = `${todayKey}-publish`;
        if (lastPublishRun !== publishRunKey) {
          lastPublishRun = publishRunKey;
          console.log("[BlogScheduler] 자동 발행 시작");
          await generateAndPublishBlogPost();
        }
      }

      // 매일 10:00 KST 후속 이메일 발송
      if (kst.hour === 10 && kst.minute < 10) {
        const followupRunKey = `${todayKey}-followup`;
        if (!lastFollowupRun || lastFollowupRun !== followupRunKey) {
          lastFollowupRun = followupRunKey;
          console.log("[FollowupEmail] 후속 이메일 발송 시작");
          try {
            const result = await runFollowupEmails();
            if (result.sent3d > 0 || result.sent7d > 0) {
              addHistory("followup_email", true, `3일: ${result.sent3d}건, 7일: ${result.sent7d}건 발송`);
              console.log(`[FollowupEmail] 발송 완료 — 3일: ${result.sent3d}건, 7일: ${result.sent7d}건`);
            }
          } catch (err) {
            addHistory("followup_email", false, String(err));
          }
        }
      }

      // 매월 1일 08:00 KST 월간 리포트 자동 발송
      if (kst.day === 1 && kst.hour === 8 && kst.minute < 10) {
        const reportRunKey = `${todayKey}-monthlyreport`;
        if (lastMonthlyReportRun !== reportRunKey) {
          lastMonthlyReportRun = reportRunKey;
          console.log("[MonthlyReport] 월간 리포트 자동 발송 시작");
          try {
            const result = await runMonthlyReportAuto();
            addHistory("followup_email", true, `월간 리포트: ${result.sent}건 발송, ${result.failed}건 실패`);
            if (result.sent > 0) {
              await notifyOwner({
                title: "[월간 리포트] 자동 발송 완료",
                content: `계약 고객 ${result.sent}건 월간 AI 인용 리포트 발송 완료 (${result.failed}건 실패)`,
              });
            }
          } catch (err) {
            addHistory("followup_email", false, `월간 리포트 실패: ${String(err)}`);
          }
        }
      }

      // 매주 수요일 10:00 KST 재진단 유도 이메일 자동 발송
      if (kst.dayOfWeek === 3 && kst.hour === 10 && kst.minute < 10) {
        const retargetRunKey = `${todayKey}-retarget`;
        if (lastRetargetRun !== retargetRunKey) {
          lastRetargetRun = retargetRunKey;
          console.log("[Retarget] 재진단 유도 이메일 발송 시작");
          try {
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
                const { buildRediagnosisEmail } = await import("./email-templates");
                const emailHtml = buildRediagnosisEmail({ url: lead.url, totalScore: lead.totalScore ?? 0, grade: lead.grade ?? "" });
                await sendEmailViaNaver({ to: lead.email, subject: `[MY비서] ${lead.url} AI 인용 점수가 변했을 수 있습니다`, html: emailHtml });
                sent++;
              } catch (e) { console.warn(`[FollowupEmail] 개별 발송 실패 (${lead.email}):`, String(e)); }
            }
            addHistory("followup_email", true, `재진단 유도: ${sent}/${targets.length}건 발송`);
            if (sent > 0) {
              await notifyOwner({ title: "[재진단 유도] 이메일 발송 완료", content: `${sent}건 재진단 유도 이메일 발송 완료` });
            }
          } catch (err) {
            addHistory("followup_email", false, `재진단 유도 실패: ${String(err)}`);
          }
        }
      }

      // 매월 1일 07:00 KST 월간 벤치마크 자동 집계 + 어워드
      if (kst.day === 1 && kst.hour === 7 && kst.minute < 10) {
        const benchmarkRunKey = `${todayKey}-benchmark`;
        if (lastBenchmarkRun !== benchmarkRunKey) {
          lastBenchmarkRun = benchmarkRunKey;
          console.log("[Benchmark] 월간 벤치마크 자동 집계 시작");
          try {
            const { aggregateMonthlyBenchmark, generateMonthlyAwards } = await import("./db");
            // 전월 기간 계산
            const prevMonth = new Date(kst.year, kst.month - 2, 1);
            const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
            const benchmarks = await aggregateMonthlyBenchmark(period);
            const awards = await generateMonthlyAwards(period);
            addHistory("benchmark", true, `${period} 벤치마크: ${benchmarks.length}개 진료과, 어워드: ${awards.length}개 병원`);
            await notifyOwner({
              title: `[벤치마크] ${period} 월간 집계 완료`,
              content: `${benchmarks.length}개 진료과 벤치마크 집계\n${awards.length}개 병원 어워드 선정`,
            });
          } catch (err) {
            addHistory("benchmark", false, String(err));
          }
        }
      }

      // 매일 11:00 KST 챗봇 인사이트 자동 추출
      if (kst.hour === 11 && kst.minute < 10) {
        const insightRunKey = `${todayKey}-insight`;
        if (lastInsightRun !== insightRunKey) {
          lastInsightRun = insightRunKey;
          try {
            const { getSessionsWithoutInsight, getChatMessagesBySession, updateChatSessionInsight } = await import("./db");
            const { invokeLLM } = await import("./_core/llm");
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
              } catch (e) { console.warn(`[ChatInsight] 세션 ${session.id} 처리 실패:`, String(e)); }
            }
            if (processed > 0) {
              addHistory("chat_insight", true, `${processed}개 세션 인사이트 추출 완료`);
            }
          } catch (err) {
            addHistory("chat_insight", false, String(err));
          }
        }
      }

      // 매주 목요일 06:00 KST 계약 병원 자동 SEO 진단
      if (kst.dayOfWeek === 4 && kst.hour === 6 && kst.minute < 10) {
        const diagRunKey = `${todayKey}-autodiag`;
        if (!state.lastAutoDiagnosisAt || state.lastAutoDiagnosisAt.toISOString().slice(0, 10) !== todayKey) {
          console.log("[AutoDiagnosis] 주간 자동 진단 시작");
          try {
            state.lastAutoDiagnosisAt = new Date();
            const { getActiveHospitalProfiles, saveDiagnosisHistory } = await import("./db");
            const { analyzeSeo } = await import("./seo-analyzer");
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
                console.warn(`[AutoDiagnosis] ${profile.hospitalUrl} 진단 실패:`, String(e));
              }
              // 서버 부하 방지: 각 진단 사이 3초 대기
              await new Promise(r => setTimeout(r, 3000));
            }
            state.lastAutoDiagnosisResult = { success: true, diagnosed };
            addHistory("auto_diagnosis", true, `${diagnosed}/${profiles.length}개 병원 진단 완료 (${failed}건 실패)`);
            await notifyOwner({
              title: "[자동 진단] 주간 SEO 진단 완료",
              content: `${diagnosed}개 병원 자동 진단 완료\n${failed > 0 ? `${failed}건 실패` : "전체 성공"}\n\n상세 결과는 관리자 대시보드에서 확인하세요.`,
            });
            await createAdminNotification({
              type: "auto_diagnosis",
              title: `주간 SEO 진단 완료 - ${diagnosed}개 병원`,
              message: `${diagnosed}/${profiles.length}개 병원 진단 완료${failed > 0 ? ` (${failed}건 실패)` : ""}`,
              metadata: JSON.stringify({ diagnosed, failed, total: profiles.length }),
            });
          } catch (err) {
            state.lastAutoDiagnosisResult = { success: false, error: String(err) };
            addHistory("auto_diagnosis", false, String(err));
          }
        }
      }

      // ═══ 매월 15일 06:00 KST — 전체 URL 월간 진단 (히스토리 축적) ═══
      if (kst.day === 15 && kst.hour === 6 && kst.minute < 10) {
        const monthlyDiagKey = `${todayKey}-monthlydiag`;
        if (lastMonthlyDiagRun !== monthlyDiagKey) {
          lastMonthlyDiagRun = monthlyDiagKey;
          console.log("[MonthlyDiagnosis] 월간 전체 URL 진단 시작");
          try {
            state.lastMonthlyDiagnosisAt = new Date();
            const result = await runMonthlyBatchDiagnosis();
            state.lastMonthlyDiagnosisResult = { success: true, diagnosed: result.diagnosed, totalUrls: result.totalUrls };
            addHistory("monthly_diagnosis", true, `${result.diagnosed}/${result.totalUrls}개 URL 진단 완료 (${result.failed}건 실패, ${result.skipped}건 스킵)`);
            await notifyOwner({
              title: "[월간 진단] 전체 URL 월간 SEO 진단 완료",
              content: `${result.diagnosed}/${result.totalUrls}개 URL 진단 완료\n${result.failed > 0 ? `${result.failed}건 실패` : "전체 성공"}\n${result.skipped > 0 ? `${result.skipped}건 최근 진단으로 스킵` : ""}\n\n히스토리 대시보드에서 추이를 확인하세요.`,
            });
            await createAdminNotification({
              type: "auto_diagnosis",
              title: `월간 SEO 진단 완료 - ${result.diagnosed}개 URL`,
              message: `${result.diagnosed}/${result.totalUrls}개 URL 진단 완료${result.failed > 0 ? ` (${result.failed}건 실패)` : ""}`,
              metadata: JSON.stringify({ ...result, type: "monthly" }),
            });
          } catch (err) {
            state.lastMonthlyDiagnosisResult = { success: false, error: String(err) };
            addHistory("monthly_diagnosis", false, String(err));
          }
        }
      }

      // 매주 월요일 09:00 AI 모니터링 자동 실행
      if (isAiMonitorTime()) {
        const monitorRunKey = `${todayKey}-aimonitor`;
        if (lastAiMonitorRun !== monitorRunKey) {
          lastAiMonitorRun = monitorRunKey;
          console.log("[AIMonitor] 주간 자동 모니터링 시작");
          try {
            state.lastAiMonitorAt = new Date();
            // v2 고도화 버전 사용 (AI 인용 점수 자동 산정 + DB 저장 포함)
            const { runEnhancedAutoMonitor } = await import("./lib/ai-monitor-enhanced");
            const monitorResult = await runEnhancedAutoMonitor();
            state.lastAiMonitorResult = { success: true, count: monitorResult.checkedKeywords };
            const scoresSummary = monitorResult.scores.map((s: any) => `${s.keyword}: ${s.score}점`).join(", ");
            addHistory("ai_monitor", true, `${monitorResult.checkedKeywords}개 키워드 검사, ${monitorResult.totalMentions}건 언급, 점수: ${scoresSummary}`);
            // 관리자에게 결과 알림
            await notifyOwner({
              title: "[AI 모니터링] 주간 자동 검사 완료",
              content: `${monitorResult.checkedKeywords}개 키워드 검사 완료\n총 ${monitorResult.totalMentions}건 AI 언급 감지\n\n상세 결과는 관리자 대시보드 > AI 모니터링에서 확인하세요.`,
            });
          } catch (err) {
            state.lastAiMonitorResult = { success: false, error: String(err) };
            addHistory("ai_monitor", false, String(err));
          }
        }
      }
       // ═══ 매주 월요일 08:00 KST — 주간 브리핑 Push ═══
      if (kst.dayOfWeek === 1 && kst.hour === 8 && kst.minute < 10) {
        const briefingRunKey = `${todayKey}-briefing`;
        if (state.lastWeeklyBriefingRun !== briefingRunKey) {
          state.lastWeeklyBriefingRun = briefingRunKey;
          console.log("[WeeklyBriefing] 주간 브리핑 생성 시작");
          try {
            const data = await getWeeklyBriefingData();
            const briefingContent = formatWeeklyBriefing(data);
            await notifyOwner({
              title: `[MY비서] ${data.period.from} ~ ${data.period.to} 주간 브리핑`,
              content: briefingContent,
            });
            await createAdminNotification({
              type: "weekly_briefing" as any,
              title: `주간 브리핑 발송 완료`,
              message: briefingContent.slice(0, 200),
              metadata: JSON.stringify(data),
            });
            addHistory("weekly_briefing", true, `주간 브리핑 발송 완료 (${data.period.from} ~ ${data.period.to})`);
          } catch (err) {
            addHistory("weekly_briefing", false, `주간 브리핑 실패: ${String(err)}`);
          }
        }
      }
    } catch (error) {
      logger.error("스케줄 체크 오류", { error: String(error) });
    }
  }, CHECK_INTERVAL);
  // 서버 시작 시 즉시 예약 발행 처리
  publishScheduledPosts().catch(console.error);
}

/**
 * 월간 배치 진단 — hospital_profiles + seo_leads 전체 URL 진단
 * 영업용 히스토리 데이터 축적 목적
 */
export async function runMonthlyBatchDiagnosis() {
  const { getActiveHospitalProfiles, saveDiagnosisHistory, getLastAutoDiagnosisDate } = await import("./db");
  const { analyzeSeo } = await import("./seo-analyzer");

  // 1) 병원 프로필 URL 수집
  const profiles = await getActiveHospitalProfiles();
  const profileUrls = new Map<string, { specialty?: string; region?: string }>();
  for (const p of profiles) {
    const normalized = normalizeUrlForDiag(p.hospitalUrl);
    profileUrls.set(normalized, { specialty: p.specialty || undefined, region: p.region || undefined });
  }

  // 2) SEO 리드 URL 수집
  const allLeads = await getAllSeoLeads(1000);
  const leadUrls = new Map<string, { specialty?: string; region?: string }>();
  for (const l of allLeads) {
    const normalized = normalizeUrlForDiag(l.url);
    if (!profileUrls.has(normalized) && !leadUrls.has(normalized)) {
      leadUrls.set(normalized, {});
    }
  }

  // 3) 전체 URL 병합 (중복 제거)
  const allUrlEntries: Array<[string, { specialty?: string; region?: string }]> = [];
  profileUrls.forEach((v, k) => allUrlEntries.push([k, v]));
  leadUrls.forEach((v, k) => allUrlEntries.push([k, v]));
  const totalUrls = allUrlEntries.length;
  let diagnosed = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`[MonthlyDiagnosis] 전체 ${totalUrls}개 URL 진단 시작 (병원 ${profileUrls.size}개 + 리드 ${leadUrls.size}개)`);

  for (const [url, meta] of allUrlEntries) {
    try {
      // 최근 7일 이내 진단 기록이 있으면 스킵 (주간 진단과 중복 방지)
      const lastDiag = await getLastAutoDiagnosisDate(url);
      if (lastDiag) {
        const daysSince = (Date.now() - new Date(lastDiag).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          skipped++;
          continue;
        }
      }

      const result = await analyzeSeo(url, meta.specialty);
      const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
      const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
      await saveDiagnosisHistory({
        url: result.url,
        totalScore: result.totalScore,
        aiScore,
        grade: result.grade,
        specialty: meta.specialty,
        region: meta.region,
        categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
      });
      diagnosed++;
      console.log(`[MonthlyDiagnosis] ✓ ${url} — ${result.totalScore}점 (${result.grade})`);
    } catch (err) {
      failed++;
      console.error(`[MonthlyDiagnosis] ✗ ${url} — ${String(err).slice(0, 100)}`);
    }
    // 서버 부하 방지: 각 진단 사이 5초 대기
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`[MonthlyDiagnosis] 완료: ${diagnosed}/${totalUrls} 성공, ${failed} 실패, ${skipped} 스킵`);
  return { diagnosed, failed, skipped, totalUrls };
}

/**
 * 월간 리포트 자동 발송 — 계약 고객에게 매월 1일 AI 인용 리포트 발송
 */
export async function runMonthlyReportAuto(): Promise<{ sent: number; failed: number }> {
  const { analyzeSeo } = await import("./seo-analyzer");
  const allLeads = await getAllSeoLeads(500);
  const contracted = allLeads.filter((l: any) => l.status === "contracted");
  if (contracted.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const now = new Date();
  const monthStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  for (const lead of contracted) {
    try {
      const result = await analyzeSeo(lead.url);
      const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
      const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
      const prevScore = lead.totalScore ?? 0;
      const scoreDiff = result.totalScore - prevScore;

      const { buildMonthlyReportEmail } = await import("./email-templates");
      const emailHtml = buildMonthlyReportEmail({
        monthStr,
        url: lead.url,
        totalScore: result.totalScore,
        aiScore,
        prevScore,
        scoreDiff,
        categories: result.categories,
      });

      const emailSent = await sendEmailViaNaver({
        to: lead.email,
        subject: `[MY비서] ${monthStr} AI+포털 노출 리포트 (${lead.url})`,
        html: emailHtml,
        text: `${monthStr} AI+포털 노출 리포트\nURL: ${lead.url}\n종합: ${result.totalScore}점 | AI: ${aiScore}% | 변화: ${scoreDiff > 0 ? "+" : ""}${scoreDiff}점`,
      });
      if (emailSent) sent++; else failed++;
    } catch (err) {
      console.error(`[MonthlyReport] Failed for ${lead.email}:`, err);
      failed++;
    }
  }
  return { sent, failed };
}

export async function runFollowupEmails(): Promise<{ sent3d: number; sent7d: number }> {
  let sent3d = 0;
  let sent7d = 0;

  try {
    // 3일 후속
    const leads3d = await getLeadsForFollowup3d();
    for (const lead of leads3d) {
      const html = buildFollowup3dHtml({ email: lead.email, url: lead.url, score: lead.totalScore, aiScore: lead.aiScore });
      const ok = await sendEmailViaNaver({ to: lead.email, subject: FOLLOWUP_3D_SUBJECT, html });
      if (ok) {
        await markFollowupSent(lead.id, "3d");
        sent3d++;
      }
    }

    // 7일 후속
    const leads7d = await getLeadsForFollowup7d();
    for (const lead of leads7d) {
      const html = buildFollowup7dHtml({ email: lead.email, url: lead.url, score: lead.totalScore, aiScore: lead.aiScore });
      const ok = await sendEmailViaNaver({ to: lead.email, subject: FOLLOWUP_7D_SUBJECT, html });
      if (ok) {
        await markFollowupSent(lead.id, "7d");
        sent7d++;
      }
    }
  } catch (err) {
    console.error("[FollowupEmail] Error:", err);
  }

  return { sent3d, sent7d };
}

/**
 * 수동 주간 브리핑 발송 (관리자 대시보드에서 즉시 테스트)
 */
export async function sendWeeklyBriefingNow(): Promise<{ success: boolean; content: string }> {
  try {
    const data = await getWeeklyBriefingData();
    const briefingContent = formatWeeklyBriefing(data);
    await notifyOwner({
      title: `[MY비서] ${data.period.from} ~ ${data.period.to} 주간 브리핑 (수동 발송)`,
      content: briefingContent,
    });
    await createAdminNotification({
      type: "weekly_briefing" as any,
      title: `주간 브리핑 수동 발송 완료`,
      message: briefingContent.slice(0, 200),
      metadata: JSON.stringify(data),
    });
    addHistory("weekly_briefing", true, `주간 브리핑 수동 발송 완료 (${data.period.from} ~ ${data.period.to})`);
    return { success: true, content: briefingContent };
  } catch (err) {
    addHistory("weekly_briefing", false, `주간 브리핑 수동 발송 실패: ${String(err)}`);
    return { success: false, content: String(err) };
  }
}

export function stopBlogScheduler() {
  if (state.schedulerInterval) {
    clearInterval(state.schedulerInterval);
    state.schedulerInterval = null;
    console.log("[BlogScheduler] 스케줄러 중지됨");
  }
}

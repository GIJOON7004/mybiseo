/**
 * A/B 테스트 + 진단 자동화 라우터
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getAbExperiments, getAbExperimentById, createAbExperiment, updateAbExperiment,
  getAbVariantsByExperiment, createAbVariant, updateAbVariant, deleteAbVariant,
  getActiveExperimentForElement, recordAbEvent, getAbEventStats,
  getDiagnosisAutomationConfig, upsertDiagnosisAutomationConfig, getDailyDiagnosisCount,
} from "../db";

export const abtestRouter = router({
  // ── 관리자: 실험 목록 ──
  list: adminProcedure.query(async () => {
    const experiments = await getAbExperiments();
    return experiments;
  }),

  // ── 관리자: 실험 상세 + 변형 + 통계 ──
  detail: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const experiment = await getAbExperimentById(input.id);
      if (!experiment) return null;
      const variants = await getAbVariantsByExperiment(input.id);
      const stats = await getAbEventStats(input.id);
      return { experiment, variants, stats };
    }),

  // ── 관리자: 실험 생성 ──
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      targetElement: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const result = await createAbExperiment({
        name: input.name,
        description: input.description || null,
        targetElement: input.targetElement,
      });
      return result;
    }),

  // ── 관리자: 실험 상태 변경 ──
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "running", "paused", "completed"]),
    }))
    .mutation(async ({ input }) => {
      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === "running") updates.startedAt = new Date();
      if (input.status === "completed") updates.endedAt = new Date();
      await updateAbExperiment(input.id, updates as any);
      return { success: true };
    }),

  // ── 관리자: 변형 추가 ──
  addVariant: adminProcedure
    .input(z.object({
      experimentId: z.number(),
      name: z.string().min(1),
      content: z.string().min(1), // JSON string
      weight: z.number().min(1).max(100).default(50),
    }))
    .mutation(async ({ input }) => {
      const result = await createAbVariant({
        experimentId: input.experimentId,
        name: input.name,
        content: input.content,
        weight: input.weight,
      });
      return result;
    }),

  // ── 관리자: 변형 수정 ──
  updateVariant: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      content: z.string().optional(),
      weight: z.number().min(1).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAbVariant(id, data as any);
      return { success: true };
    }),

  // ── 관리자: 변형 삭제 ──
  deleteVariant: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAbVariant(input.id);
      return { success: true };
    }),

  // ── Public: 활성 실험에서 변형 할당 (쿠키 기반) ──
  getVariant: publicProcedure
    .input(z.object({
      targetElement: z.string(),
      visitorId: z.string(),
    }))
    .query(async ({ input }) => {
      const experiment = await getActiveExperimentForElement(input.targetElement);
      if (!experiment) return null;

      const variants = await getAbVariantsByExperiment(experiment.id);
      if (variants.length === 0) return null;

      // 가중치 기반 결정적 할당 (visitorId 해시)
      const hash = simpleHash(input.visitorId + experiment.id);
      const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
      let target = hash % totalWeight;
      let selectedVariant = variants[0];
      for (const v of variants) {
        target -= v.weight;
        if (target < 0) { selectedVariant = v; break; }
      }

      return {
        experimentId: experiment.id,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        content: JSON.parse(selectedVariant.content),
      };
    }),

  // ── Public: 이벤트 기록 ──
  trackEvent: publicProcedure
    .input(z.object({
      experimentId: z.number(),
      variantId: z.number(),
      visitorId: z.string(),
      eventType: z.enum(["impression", "click", "conversion"]),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await recordAbEvent({
        experimentId: input.experimentId,
        variantId: input.variantId,
        visitorId: input.visitorId,
        eventType: input.eventType,
        metadata: input.metadata || null,
      });
      return { success: true };
    }),
});

// ── 진단 자동화 라우터 ──
export const diagnosisAutomationRouter = router({
  getConfig: adminProcedure.query(async () => {
    const config = await getDiagnosisAutomationConfig();
    const dailyCount = await getDailyDiagnosisCount();
    return { config, dailyCount };
  }),

  updateConfig: adminProcedure
    .input(z.object({
      dailyThreshold: z.number().min(1).max(100).optional(),
      autoSendEnabled: z.boolean().optional(),
      qualityMinScore: z.number().min(0).max(100).optional(),
      qualityRequiredSections: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await upsertDiagnosisAutomationConfig(input as any);
      return { success: true };
    }),

  // 품질 검증 로직 (진단 결과 발송 전 호출)
  validateReport: adminProcedure
    .input(z.object({
      totalScore: z.number(),
      sections: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const config = await getDiagnosisAutomationConfig();
      if (!config) return { valid: true, reasons: [] };

      const reasons: string[] = [];

      // 최소 점수 체크
      if (input.totalScore < config.qualityMinScore) {
        reasons.push(`점수(${input.totalScore})가 최소 기준(${config.qualityMinScore}) 미만`);
      }

      // 필수 섹션 체크
      if (config.qualityRequiredSections) {
        try {
          const required = JSON.parse(config.qualityRequiredSections) as string[];
          const missing = required.filter(s => !input.sections.includes(s));
          if (missing.length > 0) {
            reasons.push(`필수 섹션 누락: ${missing.join(", ")}`);
          }
        } catch { /* ignore parse error */ }
      }

      return { valid: reasons.length === 0, reasons };
    }),
});

// 간단한 해시 함수 (결정적 변형 할당용)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

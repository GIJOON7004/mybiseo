/**
 * hospital 라우터
 * routers.ts에서 분할 — myHospital, myHospitalExtended, hospitalInfo
 */

import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createHospitalInfoItem, createHospitalProfile, deleteHospitalInfoItem, getAllHospitalProfiles,
  getCurrentSeasonalRecommendations, getDiagnosisHistoryByUrl, getHospitalDashboardData, getHospitalInfoItems,
  getHospitalProfileByUserId, getSpecialtyStats, saveDiagnosisHistory, updateHospitalInfoItem,
  updateHospitalProfile,
} from "../db";
import { analyzeSeo } from "../seo-analyzer";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const myHospitalRouter = router({
  // 병원 프로필 조회/생성
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    return profile;
  }),
  createProfile: protectedProcedure
    .input(z.object({
      hospitalName: z.string().min(1, "병원명을 입력해주세요"),
      hospitalUrl: z.string().min(1, "URL을 입력해주세요"),
      specialty: z.string().optional(),
      region: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 기존 프로필 확인
      const existing = await getHospitalProfileByUserId(ctx.user.id);
      if (existing) {
        await updateHospitalProfile(existing.id, input);
        return { success: true, id: existing.id, updated: true };
      }
      await createHospitalProfile({ ...input, userId: ctx.user.id });
      return { success: true, updated: false };
    }),
  updateProfile: protectedProcedure
    .input(z.object({
      hospitalName: z.string().optional(),
      hospitalUrl: z.string().optional(),
      specialty: z.string().optional(),
      region: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new Error("병원 프로필이 없습니다");
      await updateHospitalProfile(profile.id, input);
      return { success: true };
    }),
  // 대시보드 데이터 조회
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) return null;
    const data = await getHospitalDashboardData(profile.hospitalUrl);
    return { profile, ...data };
  }),
  // 진단 실행 (대시보드에서 직접 진단)
  runDiagnosis: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) throw new Error("병원 프로필을 먼저 등록해주세요");
    const result = await analyzeSeo(profile.hospitalUrl, profile.specialty || undefined);
    const aiCat = result.categories.find((c: any) => c.name === "AI 검색 노출");
    const aiScore = aiCat && aiCat.maxScore > 0 ? Math.round((aiCat.score / aiCat.maxScore) * 100) : 0;
    // 진단이력 저장
    await saveDiagnosisHistory({
      url: result.url,
      totalScore: result.totalScore,
      aiScore,
      grade: result.grade,
      specialty: profile.specialty || undefined,
      region: profile.region || undefined,
      categoryScores: JSON.stringify(result.categories.map((c: any) => ({ name: c.name, score: c.score, max: c.maxScore }))),
    });
    return { ...result, aiScore };
  }),
  // 개선 추천 항목 (진단 결과 기반)
  improvements: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) return [];
    const history = await getDiagnosisHistoryByUrl(profile.hospitalUrl, 1);
    if (history.length === 0) return [];
    const latest = history[0];
    const categoryScores = latest.categoryScores ? JSON.parse(latest.categoryScores) : [];
    // 점수가 낮은 카테고리 순으로 개선 추천
    return categoryScores
      .map((c: any) => ({
        category: c.name,
        score: c.score,
        maxScore: c.max,
        percentage: c.max > 0 ? Math.round((c.score / c.max) * 100) : 0,
        priority: c.max > 0 ? (1 - c.score / c.max) : 0,
      }))
      .sort((a: any, b: any) => b.priority - a.priority);
  }),
  // 관리자: 전체 병원 프로필 목록
  allProfiles: adminProcedure.query(async () => {
    return getAllHospitalProfiles();
  }),
  // 진단 이력 조회 (DiagnosisTab용)
  diagnosisHistory: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) return [];
    return getDiagnosisHistoryByUrl(profile.hospitalUrl, 12);
  }),
});

export const myHospitalExtendedRouter = router({
  // 경쟁사 대비 내 위치 (고객용)
  getCompetitorPosition: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile) return null;
    // 같은 진료과 내 진단 이력에서 내 위치 파악
    const myHistory = await getDiagnosisHistoryByUrl(profile.hospitalUrl, 1);
    if (myHistory.length === 0) return null;
    const myLatest = myHistory[0];
    // 같은 진료과 최근 진단 데이터
    const stats = await getSpecialtyStats();
    const mySpecialty = stats.find((s: any) => s.specialty === profile.specialty);
    return {
      myScore: myLatest.totalScore,
      myGrade: myLatest.grade,
      specialtyAvg: mySpecialty?.avgScore || 0,
      specialtyAvgAi: mySpecialty?.avgAiScore || 0,
      specialtyCount: mySpecialty?.count || 0,
      aboveAverage: myLatest.totalScore > Number(mySpecialty?.avgScore || 0),
      scoreDiff: myLatest.totalScore - Number(mySpecialty?.avgScore || 0),
    };
  }),
  // 시즌 추천 키워드 (고객용 - 내 진료과 기반)
  getMySeasonalKeywords: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getHospitalProfileByUserId(ctx.user.id);
    if (!profile || !profile.specialty) return [];
    return getCurrentSeasonalRecommendations(profile.specialty);
  }),
  // 기간별 점수 비교 (고객용)
  getScoreComparison: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) return null;
      const history = await getDiagnosisHistoryByUrl(profile.hospitalUrl, 50);
      if (history.length < 2) return null;
      const months = input?.months ?? 3;
      const cutoff = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
      const recent = history.filter((h: any) => new Date(h.diagnosedAt).getTime() > cutoff);
      const older = history.filter((h: any) => new Date(h.diagnosedAt).getTime() <= cutoff);
      const recentAvg = recent.length > 0 ? Math.round(recent.reduce((s: number, h: any) => s + h.totalScore, 0) / recent.length) : 0;
      const olderAvg = older.length > 0 ? Math.round(older.reduce((s: number, h: any) => s + h.totalScore, 0) / older.length) : 0;
      return {
        recentAvg,
        olderAvg,
        change: recentAvg - olderAvg,
        recentCount: recent.length,
        olderCount: older.length,
        months,
      };
    }),
 });

export const hospitalInfoRouter = router({
  list: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "병원 프로필을 먼저 등록해주세요." });
      return getHospitalInfoItems(profile.id, input.category);
    }),
  create: protectedProcedure
    .input(z.object({
      category: z.enum(["price", "hours", "event", "faq", "notice"]),
      title: z.string().min(1).max(300),
      content: z.string().min(1),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "병원 프로필을 먼저 등록해주세요." });
      return createHospitalInfoItem({ ...input, hospitalId: profile.id });
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(300).optional(),
      content: z.string().min(1).optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateHospitalInfoItem(id, profile.id, data);
      return { ok: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getHospitalProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteHospitalInfoItem(input.id, profile.id);
      return { ok: true };
    }),
});

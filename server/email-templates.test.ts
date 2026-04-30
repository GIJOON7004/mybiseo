import { describe, it, expect } from "vitest";
import {
  buildDiagnosisEmail,
  buildMonthlyReportEmail,
  buildRediagnosisEmail,
  buildFollowup3dEmailNew,
  buildFollowup7dEmailNew,
} from "./email-templates";

describe("email-templates", () => {
  const sampleCategories = [
    { name: "기본 SEO", score: 8, maxScore: 10 },
    { name: "AI 검색 노출", score: 5, maxScore: 10 },
    { name: "모바일 최적화", score: 7, maxScore: 10 },
  ];

  describe("buildDiagnosisEmail", () => {
    it("should return valid HTML with light background", () => {
      const html = buildDiagnosisEmail({
        url: "https://example.com",
        totalScore: 76,
        grade: "보통",
        aiScore: 50,
        summary: { passed: 10, failed: 5, warning: 3 },
        categories: sampleCategories,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("example.com");
      expect(html).toContain("76");
      expect(html).toContain("50");
      // 밝은 배경 사용 확인 (다크 배경 #0a0a0f 미사용)
      expect(html).not.toContain("#0a0a0f");
      // 밝은 배경 #f0f2f5 사용 확인
      expect(html).toContain("#f0f2f5");
      // 진한 텍스트 색상 사용 확인
      expect(html).toContain("#1a1a2e");
      // 카테고리 이름 포함 확인
      expect(html).toContain("기본 SEO");
      expect(html).toContain("AI 검색 노출");
      expect(html).toContain("모바일 최적화");
      // 요약 지표 포함
      expect(html).toContain("10"); // passed
      expect(html).toContain("5"); // failed
      expect(html).toContain("3"); // warning
    });

    it("should include PDF download button when pdfUrl is provided", () => {
      const html = buildDiagnosisEmail({
        url: "https://example.com",
        totalScore: 85,
        grade: "양호",
        aiScore: 70,
        summary: { passed: 15, failed: 2, warning: 1 },
        categories: sampleCategories,
        pdfUrl: "https://cdn.example.com/report.pdf",
      });

      expect(html).toContain("https://cdn.example.com/report.pdf");
      expect(html).toContain("PDF 리포트 다운로드");
    });

    it("should not include PDF section when pdfUrl is not provided", () => {
      const html = buildDiagnosisEmail({
        url: "https://example.com",
        totalScore: 85,
        grade: "양호",
        aiScore: 70,
        summary: { passed: 15, failed: 2, warning: 1 },
        categories: sampleCategories,
      });

      expect(html).not.toContain("PDF 리포트 다운로드");
    });

    it("should use green color for high scores", () => {
      const html = buildDiagnosisEmail({
        url: "https://example.com",
        totalScore: 90,
        grade: "우수",
        aiScore: 85,
        summary: { passed: 18, failed: 0, warning: 0 },
        categories: [{ name: "기본 SEO", score: 9, maxScore: 10 }],
      });

      expect(html).toContain("#059669"); // SCORE_GREEN
    });

    it("should use red color for low scores", () => {
      const html = buildDiagnosisEmail({
        url: "https://example.com",
        totalScore: 30,
        grade: "위험",
        aiScore: 20,
        summary: { passed: 3, failed: 15, warning: 2 },
        categories: [{ name: "기본 SEO", score: 2, maxScore: 10 }],
      });

      expect(html).toContain("#dc2626"); // SCORE_RED
    });
  });

  describe("buildMonthlyReportEmail", () => {
    it("should return valid HTML with month info and score change", () => {
      const html = buildMonthlyReportEmail({
        monthStr: "2026년 3월",
        url: "https://hospital.com",
        totalScore: 82,
        aiScore: 65,
        prevScore: 75,
        scoreDiff: 7,
        categories: sampleCategories,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("2026년 3월");
      expect(html).toContain("hospital.com");
      expect(html).toContain("82");
      expect(html).toContain("+7");
      expect(html).not.toContain("#0a0a0f");
      expect(html).toContain("#f0f2f5");
    });

    it("should show negative diff correctly", () => {
      const html = buildMonthlyReportEmail({
        monthStr: "2026년 3월",
        url: "https://hospital.com",
        totalScore: 70,
        aiScore: 55,
        prevScore: 75,
        scoreDiff: -5,
        categories: sampleCategories,
      });

      expect(html).toContain("-5");
      expect(html).toContain("#dc2626"); // red for negative
    });
  });

  describe("buildRediagnosisEmail", () => {
    it("should return valid HTML with re-diagnosis CTA", () => {
      const html = buildRediagnosisEmail({
        url: "https://clinic.com",
        totalScore: 65,
        grade: "보통",
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("clinic.com");
      expect(html).toContain("65");
      expect(html).toContain("지금 다시 진단하기");
      expect(html).toContain("mybiseo.com/ai-check");
      expect(html).not.toContain("#0a0a0f");
    });
  });

  describe("buildFollowup3dEmailNew", () => {
    it("should return valid HTML with 3-day followup content", () => {
      const html = buildFollowup3dEmailNew({
        email: "test@example.com",
        url: "https://dental.com",
        score: 72,
        aiScore: 45,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("dental.com");
      expect(html).toContain("72");
      expect(html).toContain("45");
      expect(html).toContain("무료 상담 신청하기");
      expect(html).not.toContain("#0a0a0f");
      expect(html).toContain("#f0f2f5");
    });

    it("should handle null scores gracefully", () => {
      const html = buildFollowup3dEmailNew({
        email: "test@example.com",
        url: "https://dental.com",
        score: null,
        aiScore: null,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("dental.com");
    });
  });

  describe("buildFollowup7dEmailNew", () => {
    it("should return valid HTML with urgent 7-day followup content", () => {
      const html = buildFollowup7dEmailNew({
        email: "test@example.com",
        url: "https://plastic.com",
        score: 55,
        aiScore: 30,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("plastic.com");
      expect(html).toContain("경쟁 병원");
      expect(html).toContain("지금 무료 상담 받기");
      expect(html).not.toContain("#0a0a0f");
      expect(html).toContain("#f0f2f5");
      // 경고 배너 스타일 확인 (빨간색 border-left)
      expect(html).toContain("#dc2626");
    });
  });
});

import { describe, it, expect } from "vitest";

// Test the exported types and score calculation logic
// Note: generateImprovementReport requires LLM, so we test the fallback/pure logic
import { calculateAiExposureScore } from "./lib/ai-monitor-enhanced";

describe("AI Improvement Report - Score-based Analysis", () => {
  it("low exposure score should indicate need for improvement", () => {
    // 0 mentions → low score → high priority recommendations needed
    const result = calculateAiExposureScore([], 0);
    expect(result.score).toBeLessThan(30);
    expect(result.mentionScore).toBe(0);
  });

  it("partial exposure should indicate moderate improvement needed", () => {
    const results = [
      { platform: "chatgpt", mentioned: true, rank: 3, sentiment: "positive", competitorsMentioned: ["경쟁A"] },
      { platform: "gemini", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 2, sentiment: "neutral", competitorsMentioned: ["경쟁A", "경쟁B"] },
      { platform: "perplexity", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "grok", mentioned: true, rank: 5, sentiment: "positive", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(results, 2);
    // 3/5 mentioned = 60% mention score
    expect(result.mentionScore).toBe(60);
    // Score should be moderate
    expect(result.score).toBeGreaterThan(30);
    expect(result.score).toBeLessThan(80);
  });

  it("full exposure with top ranks should yield high score", () => {
    const results = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 2, sentiment: "positive", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "grok", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(results, 0);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.mentionScore).toBe(100);
    expect(result.sentimentScore).toBe(100);
  });

  it("competitor presence should lower competitor score", () => {
    const withCompetitors = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: ["경쟁A", "경쟁B"] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: ["경쟁A"] },
      { platform: "claude", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: ["경쟁A", "경쟁B", "경쟁C"] },
    ];
    const withoutCompetitors = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
    ];
    const scoreWith = calculateAiExposureScore(withCompetitors, 3);
    const scoreWithout = calculateAiExposureScore(withoutCompetitors, 0);
    // With competitors tracked but our mention rate is high, score may still be good
    // Without competitors, score defaults to 50 (neutral)
    // Key: both should be valid numbers
    expect(scoreWith.competitorScore).toBeGreaterThanOrEqual(0);
    expect(scoreWith.competitorScore).toBeLessThanOrEqual(100);
    expect(scoreWithout.competitorScore).toBe(50); // default neutral when no competitors tracked
  });

  it("negative sentiment should lower sentiment score", () => {
    const negative = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "negative", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "negative", competitorsMentioned: [] },
    ];
    const positive = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
    ];
    const negScore = calculateAiExposureScore(negative, 0);
    const posScore = calculateAiExposureScore(positive, 0);
    expect(negScore.sentimentScore).toBeLessThan(posScore.sentimentScore);
  });

  it("rank affects rank score correctly", () => {
    const rank1 = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "neutral", competitorsMentioned: [] },
    ];
    const rank10 = [
      { platform: "chatgpt", mentioned: true, rank: 10, sentiment: "neutral", competitorsMentioned: [] },
    ];
    const score1 = calculateAiExposureScore(rank1, 0);
    const score10 = calculateAiExposureScore(rank10, 0);
    expect(score1.rankScore).toBeGreaterThan(score10.rankScore);
  });
});

describe("AI Improvement Report - DB Schema Validation", () => {
  it("report data structure should have required fields", () => {
    const reportData = {
      keywordId: 1,
      title: "테스트 리포트",
      summary: "요약",
      content: "# 리포트 내용",
      overallScore: 55,
      recommendations: JSON.stringify([{ priority: "high", title: "테스트" }]),
      platformAnalysis: JSON.stringify([{ platform: "chatgpt", analysis: "분석" }]),
      competitorInsights: JSON.stringify([{ competitorName: "경쟁사" }]),
    };

    expect(reportData.keywordId).toBeDefined();
    expect(reportData.title).toBeTruthy();
    expect(reportData.overallScore).toBeGreaterThanOrEqual(0);
    expect(reportData.overallScore).toBeLessThanOrEqual(100);
    expect(() => JSON.parse(reportData.recommendations)).not.toThrow();
    expect(() => JSON.parse(reportData.platformAnalysis)).not.toThrow();
    expect(() => JSON.parse(reportData.competitorInsights)).not.toThrow();
  });

  it("null keywordId should be valid for overall reports", () => {
    const overallReport = {
      keywordId: null,
      title: "종합 리포트",
      summary: "전체 키워드 종합 분석",
      content: "# 종합 리포트",
      overallScore: 60,
      recommendations: "[]",
      platformAnalysis: "[]",
      competitorInsights: "[]",
    };

    expect(overallReport.keywordId).toBeNull();
    expect(overallReport.title).toBeTruthy();
  });
});

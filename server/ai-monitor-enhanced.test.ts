import { describe, it, expect, vi } from "vitest";

// Test the pure scoring function (no DB dependency)
import { calculateAiExposureScore } from "./lib/ai-monitor-enhanced";

describe("AI Exposure Score Calculation", () => {
  it("returns low score when no results", () => {
    const result = calculateAiExposureScore([], 0);
    // 감성 50 * 0.20 + 경쟁사 50 * 0.15 = 10 + 7.5 = ~18
    expect(result.score).toBeLessThanOrEqual(20);
    expect(result.mentionScore).toBe(0);
    expect(result.rankScore).toBe(0);
  });

  it("calculates high score when mentioned in all platforms with rank 1", () => {
    const results = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "grok", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(results, 0);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.mentionScore).toBe(100);
    expect(result.rankScore).toBe(100);
    expect(result.sentimentScore).toBe(100);
  });

  it("calculates medium score when mentioned in some platforms", () => {
    const results = [
      { platform: "chatgpt", mentioned: true, rank: 3, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "gemini", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 5, sentiment: "positive", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "grok", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(results, 0);
    expect(result.score).toBeGreaterThan(20);
    expect(result.score).toBeLessThan(70);
    expect(result.mentionScore).toBe(40); // 2/5 = 40%
  });

  it("calculates low score when not mentioned anywhere", () => {
    const results = [
      { platform: "chatgpt", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "gemini", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "claude", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
      { platform: "grok", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(results, 0);
    expect(result.score).toBeLessThanOrEqual(20); // sentiment base 50*0.2 + competitor base 50*0.15 = ~18
    expect(result.mentionScore).toBe(0);
    expect(result.rankScore).toBe(0);
  });

  it("penalizes negative sentiment", () => {
    const positiveResults = [
      { platform: "chatgpt", mentioned: true, rank: 2, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 2, sentiment: "positive", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 2, sentiment: "positive", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: true, rank: 2, sentiment: "positive", competitorsMentioned: [] },
      { platform: "grok", mentioned: true, rank: 2, sentiment: "positive", competitorsMentioned: [] },
    ];
    const negativeResults = [
      { platform: "chatgpt", mentioned: true, rank: 2, sentiment: "negative", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 2, sentiment: "negative", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 2, sentiment: "negative", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: true, rank: 2, sentiment: "negative", competitorsMentioned: [] },
      { platform: "grok", mentioned: true, rank: 2, sentiment: "negative", competitorsMentioned: [] },
    ];
    const posScore = calculateAiExposureScore(positiveResults, 0);
    const negScore = calculateAiExposureScore(negativeResults, 0);
    expect(posScore.sentimentScore).toBeGreaterThan(negScore.sentimentScore);
    expect(posScore.score).toBeGreaterThan(negScore.score);
  });

  it("returns platform scores for each platform", () => {
    const results = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(results, 0);
    expect(result.platformScores).toBeDefined();
    expect(result.platformScores.chatgpt).toBeDefined();
    expect(result.platformScores.chatgpt.mentioned).toBe(true);
    expect(result.platformScores.chatgpt.score).toBeGreaterThan(0);
    expect(result.platformScores.gemini.mentioned).toBe(false);
    expect(result.platformScores.gemini.score).toBe(0);
  });

  it("handles competitor comparison scoring", () => {
    // When my hospital is mentioned but competitors are also mentioned
    const results = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: ["경쟁병원A", "경쟁병원B"] },
      { platform: "gemini", mentioned: true, rank: 2, sentiment: "neutral", competitorsMentioned: ["경쟁병원A"] },
      { platform: "claude", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: ["경쟁병원A", "경쟁병원B"] },
      { platform: "perplexity", mentioned: true, rank: 3, sentiment: "positive", competitorsMentioned: [] },
      { platform: "grok", mentioned: false, rank: null, sentiment: "neutral", competitorsMentioned: ["경쟁병원B"] },
    ];
    const result = calculateAiExposureScore(results, 2);
    expect(result.competitorScore).toBeDefined();
    expect(result.competitorScore).toBeGreaterThanOrEqual(0);
    expect(result.competitorScore).toBeLessThanOrEqual(100);
  });

  it("score is always between 0 and 100", () => {
    // Edge case: extreme values
    const extremeResults = [
      { platform: "chatgpt", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "gemini", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "claude", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "perplexity", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
      { platform: "grok", mentioned: true, rank: 1, sentiment: "positive", competitorsMentioned: [] },
    ];
    const result = calculateAiExposureScore(extremeResults, 0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("AI Monitor Router Integration", () => {
  it("appRouter has enhanced AI monitor procedures", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    
    // 기존 프로시저
    expect(procedures).toContain("aiMonitor.getStats");
    expect(procedures).toContain("aiMonitor.getKeywords");
    expect(procedures).toContain("aiMonitor.addKeyword");
    expect(procedures).toContain("aiMonitor.runCheck");
    expect(procedures).toContain("aiMonitor.runAutoCheck");
    expect(procedures).toContain("aiMonitor.getTrend");
    expect(procedures).toContain("aiMonitor.getKeywordTrend");
    
    // 고도화 프로시저
    expect(procedures).toContain("aiMonitor.addCompetitor");
    expect(procedures).toContain("aiMonitor.getCompetitors");
    expect(procedures).toContain("aiMonitor.deleteCompetitor");
    expect(procedures).toContain("aiMonitor.getExposureScores");
  });
});

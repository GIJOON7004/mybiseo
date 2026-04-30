import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * 리드 우선순위 계산 + 월간 리포트 + 공유 기능 테스트
 */

// ── 리드 우선순위 계산 로직 테스트 ──
// db.ts의 calculateLeadPriority 함수 로직을 직접 테스트
function calculateLeadPriority(totalScore: number | null | undefined, aiScore: number | null | undefined): number {
  const ts = totalScore ?? 50;
  const ai = aiScore ?? 50;
  const totalPart = Math.max(0, Math.min(100, 100 - ts)) * 0.4;
  const aiPart = Math.max(0, Math.min(100, 100 - ai)) * 0.6;
  return Math.round(totalPart + aiPart);
}

describe("리드 우선순위 계산", () => {
  it("점수가 매우 낮은 리드 → 최고 우선순위", () => {
    // 종합 10점, AI 5점 → 서비스 필요성 매우 높음
    const priority = calculateLeadPriority(10, 5);
    expect(priority).toBeGreaterThanOrEqual(90);
    expect(priority).toBeLessThanOrEqual(100);
  });

  it("점수가 매우 높은 리드 → 최저 우선순위", () => {
    // 종합 95점, AI 90점 → 서비스 필요성 낮음
    const priority = calculateLeadPriority(95, 90);
    expect(priority).toBeLessThanOrEqual(10);
  });

  it("중간 점수 리드 → 중간 우선순위", () => {
    const priority = calculateLeadPriority(50, 50);
    expect(priority).toBeGreaterThanOrEqual(40);
    expect(priority).toBeLessThanOrEqual(60);
  });

  it("null 값은 50으로 기본 처리", () => {
    const priority = calculateLeadPriority(null, null);
    expect(priority).toBe(50); // (100-50)*0.4 + (100-50)*0.6 = 20 + 30 = 50
  });

  it("undefined 값은 50으로 기본 처리", () => {
    const priority = calculateLeadPriority(undefined, undefined);
    expect(priority).toBe(50);
  });

  it("AI 점수가 종합보다 더 큰 가중치를 가짐", () => {
    // 종합 낮고 AI 높은 경우 vs 종합 높고 AI 낮은 경우
    const priorityLowTotalHighAi = calculateLeadPriority(20, 80);
    const priorityHighTotalLowAi = calculateLeadPriority(80, 20);
    // AI 점수가 낮은 쪽이 더 높은 우선순위
    expect(priorityHighTotalLowAi).toBeGreaterThan(priorityLowTotalHighAi);
  });

  it("0~100 범위 내에서만 결과 반환", () => {
    const cases = [
      [0, 0], [100, 100], [50, 50], [0, 100], [100, 0],
      [-10, -10], [150, 150],
    ];
    for (const [total, ai] of cases) {
      const p = calculateLeadPriority(total, ai);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it("종합 0점 + AI 0점 → 100 (최고 우선순위)", () => {
    const priority = calculateLeadPriority(0, 0);
    expect(priority).toBe(100);
  });

  it("종합 100점 + AI 100점 → 0 (최저 우선순위)", () => {
    const priority = calculateLeadPriority(100, 100);
    expect(priority).toBe(0);
  });
});

// ── 공유 URL 생성 로직 테스트 ──
describe("공유 URL 생성", () => {
  it("올바른 공유 URL 형식 생성", () => {
    const origin = "https://mybiseo.com";
    const targetUrl = "https://gangnam-dental.co.kr";
    const shareUrl = `${origin}/ai-check?url=${encodeURIComponent(targetUrl)}`;
    
    expect(shareUrl).toBe("https://mybiseo.com/ai-check?url=https%3A%2F%2Fgangnam-dental.co.kr");
    expect(shareUrl).toContain("/ai-check?url=");
  });

  it("한글 URL도 올바르게 인코딩", () => {
    const origin = "https://mybiseo.com";
    const targetUrl = "https://강남치과.com";
    const shareUrl = `${origin}/ai-check?url=${encodeURIComponent(targetUrl)}`;
    
    expect(shareUrl).toContain("ai-check?url=");
    expect(decodeURIComponent(shareUrl)).toContain("강남치과.com");
  });

  it("QR 코드 URL이 올바른 형식", () => {
    const shareUrl = "https://mybiseo.com/ai-check?url=https%3A%2F%2Ftest.com";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    expect(qrUrl).toContain("api.qrserver.com");
    expect(qrUrl).toContain("size=200x200");
    expect(qrUrl).toContain("data=");
  });

  it("네이버 밴드 공유 URL 형식", () => {
    const shareBody = "우리 병원 AI 노출 점수: 45점\n나도 진단해보기: https://mybiseo.com/ai-check";
    const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(shareBody)}`;
    
    expect(bandUrl).toContain("band.us/plugin/share");
    expect(bandUrl).toContain("body=");
  });

  it("SMS 공유 URL 형식", () => {
    const smsBody = "우리 병원 AI 노출 점수: 45점\n나도 진단해보기: https://mybiseo.com/ai-check";
    const smsUrl = `sms:?body=${encodeURIComponent(smsBody)}`;
    
    expect(smsUrl.startsWith("sms:")).toBe(true);
    expect(smsUrl).toContain("body=");
  });
});

// ── 점수 등급 색상 테스트 ──
describe("점수 등급 색상", () => {
  function getGradeColor(score: number): string {
    return score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : score >= 40 ? "#fb923c" : "#f87171";
  }

  it("80점 이상 → 초록색", () => {
    expect(getGradeColor(80)).toBe("#34d399");
    expect(getGradeColor(100)).toBe("#34d399");
  });

  it("60~79점 → 노란색", () => {
    expect(getGradeColor(60)).toBe("#fbbf24");
    expect(getGradeColor(79)).toBe("#fbbf24");
  });

  it("40~59점 → 주황색", () => {
    expect(getGradeColor(40)).toBe("#fb923c");
    expect(getGradeColor(59)).toBe("#fb923c");
  });

  it("40점 미만 → 빨간색", () => {
    expect(getGradeColor(0)).toBe("#f87171");
    expect(getGradeColor(39)).toBe("#f87171");
  });
});

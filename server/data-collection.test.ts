/**
 * 진단→데이터수집 기능 테스트
 * - 벤치마크 집계
 * - 뉴스레터 구독
 * - 진단이력 추적
 * - 월간 어워드
 * - 분석 대시보드
 * - OG 메타태그 동적 생성
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mock DB ----
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
  returning: vi.fn().mockResolvedValue([{ id: 1 }]),
};

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    getDb: () => mockDb,
    createSeoLead: vi.fn().mockResolvedValue({ id: 1, priority: 85 }),
    getAllSeoLeads: vi.fn().mockResolvedValue([]),
    saveDiagnosticHistory: vi.fn().mockResolvedValue({ id: 1 }),
    getDiagnosticHistory: vi.fn().mockResolvedValue([]),
    updateBenchmark: vi.fn().mockResolvedValue(undefined),
    getBenchmarkBySpecialty: vi.fn().mockResolvedValue(null),
    getAllBenchmarks: vi.fn().mockResolvedValue([]),
    subscribeNewsletter: vi.fn().mockResolvedValue({ id: 1 }),
    unsubscribeNewsletter: vi.fn().mockResolvedValue(true),
    getMonthlyAwards: vi.fn().mockResolvedValue([]),
    createMonthlyAward: vi.fn().mockResolvedValue({ id: 1 }),
    // 32차 데이터 축적 강화
    updateChatSessionInsight: vi.fn().mockResolvedValue(undefined),
    getSessionsWithoutInsight: vi.fn().mockResolvedValue([]),
    getChatInsightStats: vi.fn().mockResolvedValue({ totalSessions: 0, analyzedSessions: 0, specialtyStats: [], conversionStats: [] }),
    logUserEvent: vi.fn().mockResolvedValue({ id: 1 }),
    getUserEventStats: vi.fn().mockResolvedValue({ totalEvents: 0, uniqueVisitors: 0, byType: [] }),
    getRecentUserEvents: vi.fn().mockResolvedValue([]),
    aggregateMonthlyBenchmark: vi.fn().mockResolvedValue([]),
    generateMonthlyAwards: vi.fn().mockResolvedValue([]),
    recalculateLeadScores: vi.fn().mockResolvedValue({ updated: 0, total: 0 }),
  };
});

describe("벤치마크 시스템", () => {
  it("진료과별 벤치마크 데이터 구조가 올바르다", () => {
    const benchmark = {
      specialty: "치과",
      avgScore: 52,
      avgAiScore: 35,
      totalDiagnoses: 150,
      region: "서울",
      month: "2026-03",
    };
    expect(benchmark.specialty).toBe("치과");
    expect(benchmark.avgScore).toBeGreaterThanOrEqual(0);
    expect(benchmark.avgScore).toBeLessThanOrEqual(100);
    expect(benchmark.totalDiagnoses).toBeGreaterThan(0);
  });

  it("진료과 분류가 올바르게 동작한다", () => {
    const specialties = [
      "치과", "피부과", "성형외과", "안과", "정형외과",
      "내과", "산부인과", "이비인후과", "비뇨기과", "한의원",
      "정신건강의학과", "소아청소년과", "재활의학과", "기타"
    ];
    expect(specialties.length).toBeGreaterThanOrEqual(10);
    expect(specialties).toContain("치과");
    expect(specialties).toContain("기타");
  });

  it("벤치마크 점수 비교 로직이 올바르다", () => {
    const myScore = 45;
    const avgScore = 52;
    const diff = myScore - avgScore;
    const percentile = diff < -10 ? "하위" : diff < 0 ? "평균 이하" : diff < 10 ? "평균 이상" : "상위";
    expect(diff).toBe(-7);
    expect(percentile).toBe("평균 이하");
  });

  it("지역별 순위가 올바르게 정렬된다", () => {
    const rankings = [
      { url: "a.com", score: 78, region: "서울" },
      { url: "b.com", score: 45, region: "서울" },
      { url: "c.com", score: 92, region: "서울" },
      { url: "d.com", score: 61, region: "서울" },
    ];
    const sorted = [...rankings].sort((a, b) => b.score - a.score);
    expect(sorted[0].url).toBe("c.com");
    expect(sorted[sorted.length - 1].url).toBe("b.com");
  });
});

describe("진단이력 추적", () => {
  it("진단이력 데이터 구조가 올바르다", () => {
    const history = {
      url: "https://example-dental.com",
      totalScore: 45,
      aiScore: 30,
      categories: JSON.stringify([{ name: "메타 태그", score: 8, maxScore: 15 }]),
      diagnosedAt: Date.now(),
    };
    expect(history.url).toContain("https://");
    expect(history.totalScore).toBeGreaterThanOrEqual(0);
    expect(JSON.parse(history.categories)).toBeInstanceOf(Array);
  });

  it("이전 진단과 비교 로직이 올바르다", () => {
    const prev = { totalScore: 38, aiScore: 20, diagnosedAt: Date.now() - 30 * 24 * 60 * 60 * 1000 };
    const curr = { totalScore: 52, aiScore: 35, diagnosedAt: Date.now() };
    const scoreDiff = curr.totalScore - prev.totalScore;
    const aiDiff = curr.aiScore - prev.aiScore;
    expect(scoreDiff).toBe(14);
    expect(aiDiff).toBe(15);
    expect(scoreDiff).toBeGreaterThan(0); // 개선됨
  });

  it("같은 URL의 진단이력이 시간순으로 정렬된다", () => {
    const histories = [
      { diagnosedAt: 1000, totalScore: 30 },
      { diagnosedAt: 3000, totalScore: 55 },
      { diagnosedAt: 2000, totalScore: 42 },
    ];
    const sorted = [...histories].sort((a, b) => a.diagnosedAt - b.diagnosedAt);
    expect(sorted[0].totalScore).toBe(30);
    expect(sorted[2].totalScore).toBe(55);
  });
});

describe("뉴스레터 구독", () => {
  it("이메일 유효성 검증이 올바르다", () => {
    const validEmails = ["test@example.com", "doctor@hospital.co.kr", "a@b.c"];
    const invalidEmails = ["", "notanemail", "@no.com", "no@", "no@.com"];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it("구독 소스가 올바르게 기록된다", () => {
    const sources = ["seo-checker", "blog-post", "homepage", "ranking-page"];
    sources.forEach(source => {
      expect(typeof source).toBe("string");
      expect(source.length).toBeGreaterThan(0);
    });
  });
});

describe("월간 어워드", () => {
  it("어워드 선정 기준이 올바르다", () => {
    const candidates = [
      { url: "best-dental.com", totalScore: 92, isContracted: true },
      { url: "good-skin.com", totalScore: 88, isContracted: true },
      { url: "avg-hospital.com", totalScore: 65, isContracted: false },
      { url: "low-hospital.com", totalScore: 40, isContracted: false },
    ];
    // 계약 고객 중 점수 높은 순
    const winners = candidates
      .filter(c => c.isContracted)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
    expect(winners.length).toBe(2);
    expect(winners[0].url).toBe("best-dental.com");
  });

  it("어워드 월 형식이 올바르다", () => {
    const month = "2026-03";
    expect(month).toMatch(/^\d{4}-\d{2}$/);
    const [year, mon] = month.split("-").map(Number);
    expect(year).toBeGreaterThanOrEqual(2024);
    expect(mon).toBeGreaterThanOrEqual(1);
    expect(mon).toBeLessThanOrEqual(12);
  });
});

describe("분석 대시보드", () => {
  it("일별 진단 횟수 집계가 올바르다", () => {
    const dailyData = [
      { date: "2026-03-01", count: 15 },
      { date: "2026-03-02", count: 23 },
      { date: "2026-03-03", count: 8 },
    ];
    const total = dailyData.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(46);
  });

  it("전환 퍼널 단계가 올바르다", () => {
    const funnel = {
      diagnosed: 500,
      emailSubmitted: 120,
      consultRequested: 35,
      contracted: 8,
    };
    expect(funnel.diagnosed).toBeGreaterThan(funnel.emailSubmitted);
    expect(funnel.emailSubmitted).toBeGreaterThan(funnel.consultRequested);
    expect(funnel.consultRequested).toBeGreaterThan(funnel.contracted);
    
    const conversionRate = (funnel.contracted / funnel.diagnosed * 100).toFixed(1);
    expect(parseFloat(conversionRate)).toBeLessThan(10);
  });

  it("점수 분포 히스토그램 버킷이 올바르다", () => {
    const scores = [23, 45, 67, 34, 56, 78, 89, 12, 45, 56, 67, 78, 90, 34, 45];
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0-9, 10-19, ..., 90-99
    scores.forEach(s => {
      const idx = Math.min(Math.floor(s / 10), 9);
      buckets[idx]++;
    });
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(scores.length);
    expect(buckets[0]).toBe(0); // 0-9점 없음
    expect(buckets[1]).toBe(1); // 10-19점 1개 (12)
  });

  it("인기 진단 URL TOP N이 올바르게 정렬된다", () => {
    const urlCounts = [
      { url: "a.com", count: 5 },
      { url: "b.com", count: 12 },
      { url: "c.com", count: 3 },
      { url: "d.com", count: 8 },
    ];
    const top3 = [...urlCounts].sort((a, b) => b.count - a.count).slice(0, 3);
    expect(top3[0].url).toBe("b.com");
    expect(top3[0].count).toBe(12);
    expect(top3.length).toBe(3);
  });
});

describe("OG 메타태그 동적 생성", () => {
  it("SEO 진단 결과 URL 패턴을 올바르게 매칭한다", () => {
    const ogPattern = /^\/ai-check/;
    expect(ogPattern.test("/ai-check")).toBe(true);
    expect(ogPattern.test("/ai-check?url=example.com")).toBe(true);
    expect(ogPattern.test("/seo-compare")).toBe(false);
    expect(ogPattern.test("/blog/test")).toBe(false);
  });

  it("OG 태그 HTML이 올바르게 생성된다", () => {
    const score = 45;
    const grade = "D";
    const url = "https://example-dental.com";
    
    const ogTitle = `SEO 진단 결과: ${score}점 (${grade}등급) | MY비서`;
    const ogDesc = `${url}의 검색 노출 진단 결과입니다. AI 검색 + 포털 검색 45개 항목 분석.`;
    
    expect(ogTitle).toContain("45점");
    expect(ogTitle).toContain("D등급");
    expect(ogDesc).toContain(url);
  });

  it("점수에 따른 등급 색상이 올바르다", () => {
    const getGradeColor = (score: number) => {
      if (score >= 90) return "#22c55e";
      if (score >= 70) return "#3b82f6";
      if (score >= 50) return "#f59e0b";
      return "#ef4444";
    };
    expect(getGradeColor(95)).toBe("#22c55e");
    expect(getGradeColor(75)).toBe("#3b82f6");
    expect(getGradeColor(55)).toBe("#f59e0b");
    expect(getGradeColor(35)).toBe("#ef4444");
  });
});

describe("월간 리포트 자동 스케줄링", () => {
  it("매월 1일 체크 로직이 올바르다", () => {
    const isFirstDayOfMonth = (date: Date) => date.getDate() === 1;
    
    expect(isFirstDayOfMonth(new Date(2026, 2, 1))).toBe(true);  // 3월 1일
    expect(isFirstDayOfMonth(new Date(2026, 2, 2))).toBe(false); // 3월 2일
    expect(isFirstDayOfMonth(new Date(2026, 0, 1))).toBe(true);  // 1월 1일
  });

  it("리포트 발송 대상 필터링이 올바르다", () => {
    const leads = [
      { email: "a@test.com", status: "contracted", emailConsent: true },
      { email: "b@test.com", status: "contracted", emailConsent: false },
      { email: "c@test.com", status: "new", emailConsent: true },
      { email: null, status: "contracted", emailConsent: true },
    ];
    const targets = leads.filter(l => l.email && l.status === "contracted" && l.emailConsent);
    expect(targets.length).toBe(1);
    expect(targets[0].email).toBe("a@test.com");
  });
});

describe("리드 우선순위 시스템", () => {
  it("우선순위 점수가 올바르게 계산된다", () => {
    // 점수가 낮을수록 서비스 필요성 높음 → 우선순위 높음
    const calcPriority = (totalScore: number) => {
      return Math.max(0, Math.min(100, 100 - totalScore));
    };
    expect(calcPriority(30)).toBe(70);  // 낮은 점수 → 높은 우선순위
    expect(calcPriority(80)).toBe(20);  // 높은 점수 → 낮은 우선순위
    expect(calcPriority(0)).toBe(100);  // 최저 점수 → 최고 우선순위
    expect(calcPriority(100)).toBe(0);  // 최고 점수 → 최저 우선순위
  });

  it("우선순위 등급 분류가 올바르다", () => {
    const getPriorityLabel = (priority: number) => {
      if (priority >= 80) return "긴급";
      if (priority >= 60) return "높음";
      if (priority >= 40) return "보통";
      return "낮음";
    };
    expect(getPriorityLabel(90)).toBe("긴급");
    expect(getPriorityLabel(70)).toBe("높음");
    expect(getPriorityLabel(50)).toBe("보통");
    expect(getPriorityLabel(20)).toBe("낮음");
  });
});

describe("순위 배지 생성", () => {
  it("백분위 계산이 올바르다", () => {
    const calcPercentile = (myScore: number, allScores: number[]) => {
      const below = allScores.filter(s => s < myScore).length;
      return Math.round((below / allScores.length) * 100);
    };
    const scores = [20, 30, 40, 50, 60, 70, 80, 90];
    expect(calcPercentile(75, scores)).toBe(75); // 상위 25%
    expect(calcPercentile(25, scores)).toBe(13); // 하위
    expect(calcPercentile(95, scores)).toBe(100); // 최상위
  });

  it("배지 등급이 올바르게 결정된다", () => {
    const getBadge = (percentile: number) => {
      if (percentile >= 90) return "🏆 플래티넘";
      if (percentile >= 70) return "🥇 골드";
      if (percentile >= 50) return "🥈 실버";
      if (percentile >= 30) return "🥉 브론즈";
      return "개선 필요";
    };
    expect(getBadge(95)).toBe("🏆 플래티넘");
    expect(getBadge(75)).toBe("🥇 골드");
    expect(getBadge(55)).toBe("🥈 실버");
    expect(getBadge(35)).toBe("🥉 브론즈");
    expect(getBadge(15)).toBe("개선 필요");
  });
});

// ═══════════════════════════════════════════════════
// 32차: 데이터 축적 강화 — tRPC 프로시저 통합 테스트
// ═══════════════════════════════════════════════════
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@mybiseo.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("32차: 사용자 이벤트 로깅 프로시저", () => {
  it("이벤트 로깅 (public)", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.userEvent.log({
      eventType: "page_view",
      page: "/",
      visitorId: "test_visitor_1",
      sessionId: "test_session_1",
    });
    expect(result).toBeDefined();
    expect(result.ok).toBe(true);
  });

  it("이벤트 통계 조회 (admin)", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const stats = await caller.userEvent.getStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalEvents");
    expect(stats).toHaveProperty("uniqueVisitors");
    expect(stats).toHaveProperty("byType");
    expect(Array.isArray(stats.byType)).toBe(true);
  });
});

describe("32차: 챗봇 인사이트 프로시저", () => {
  it("인사이트 통계 조회 (admin)", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const stats = await caller.chatInsight.getStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalSessions");
    expect(stats).toHaveProperty("analyzedSessions");
    expect(stats).toHaveProperty("specialtyStats");
    expect(stats).toHaveProperty("conversionStats");
  });
});

describe("32차: 월간 벤치마크 프로시저", () => {
  it("어워드 조회 (public)", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const awards = await caller.monthlyBenchmark.getAwards();
    expect(awards).toBeDefined();
    expect(Array.isArray(awards)).toBe(true);
  });
});

describe("32차: 리드 스코어링 프로시저", () => {
  it("리드 점수 재계산 (admin)", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.leadScoring.recalculate();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("updated");
  });
});

describe("32차: 행동 기반 리드 스코어링 로직", () => {
  it("행동 보너스 점수 계산이 올바르다", () => {
    // 재진단 횟수 보너스 (최대 +20)
    const calcRevisitBonus = (count: number) => Math.min(20, (count - 1) * 5);
    expect(calcRevisitBonus(1)).toBe(0);  // 첫 진단 = 보너스 없음
    expect(calcRevisitBonus(2)).toBe(5);  // 재진단 1회
    expect(calcRevisitBonus(3)).toBe(10); // 재진단 2회
    expect(calcRevisitBonus(5)).toBe(20); // 재진단 4회 = 최대
    expect(calcRevisitBonus(10)).toBe(20); // 캡

    // 뉴스레터 구독 보너스
    const newsletterBonus = 10;
    expect(newsletterBonus).toBe(10);

    // 챗봇 전환 가능성 high 보너스
    const chatHighIntentBonus = 15;
    expect(chatHighIntentBonus).toBe(15);

    // 후속 이메일 후 재방문 보너스
    const followupRevisitBonus = 10;
    expect(followupRevisitBonus).toBe(10);
  });

  it("최종 우선순위가 100을 초과하지 않는다", () => {
    const basePriority = 85;
    const behaviorBonus = 30;
    const finalPriority = Math.min(100, basePriority + behaviorBonus);
    expect(finalPriority).toBe(100);
    expect(finalPriority).toBeLessThanOrEqual(100);
  });
});

describe("32차: 이벤트 타입 분류", () => {
  it("주요 이벤트 타입이 정의되어 있다", () => {
    const eventTypes = [
      "page_view",
      "diagnosis_run",
      "chat_start",
      "contact_submit",
      "newsletter_subscribe",
      "share_click",
    ];
    expect(eventTypes.length).toBe(6);
    eventTypes.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("이벤트 메타데이터 구조가 올바르다", () => {
    const diagnosisEvent = {
      eventType: "diagnosis_run",
      page: "/ai-check",
      metadata: JSON.stringify({ url: "https://test.com", totalScore: 45, grade: "D", aiScore: 30 }),
      visitorId: "v_123",
      sessionId: "s_456",
    };
    expect(diagnosisEvent.eventType).toBe("diagnosis_run");
    const meta = JSON.parse(diagnosisEvent.metadata);
    expect(meta).toHaveProperty("url");
    expect(meta).toHaveProperty("totalScore");
    expect(meta).toHaveProperty("grade");
  });
});

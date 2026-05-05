/**
 * 11번: 에디션성형외과 실제 데이터 통합 테스트
 * - 병원 프로필 등록
 * - 추적 코드 시뮬레이션 (pageview + inquiry)
 * - 분석 데이터 조회
 * - 월간 리포트 생성
 * - 관리자 병원 현황 대시보드
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  createHospitalProfile,
  getHospitalProfileByUserId,
  insertSiteVisit,
  getSiteVisitStats,
  getTopPages,
  getDailyVisitTrend,
  insertConsultationInquiry,
  getConsultationsByHospital,
  getConsultationStats,
  getConsultationByChannel,
  getConsultationMonthlyTrend,
  updateConsultationStatus,
  getDeviceStats,
  getAiChannelDetail,
  getHourlyDistribution,
  getMonthlyReportsByHospital,
  getMonthlyVisitSummary,
  getMonthlyInquirySummary,
  getAdminHospitalOverview,
  getHospitalPerformanceRanking,
  getAdminChannelStats,
  getActiveHospitalProfiles,
} from "./db";

const TEST_USER_ID = 99998; // 고유한 테스트 유저 ID
let hospitalId: number;

// 날짜 범위 헬퍼
const now = new Date();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

describe("11번: 에디션성형외과 통합 테스트", () => {
  beforeAll(async () => {
    // 테스트용 병원 프로필 생성
    await createHospitalProfile({
      userId: TEST_USER_ID,
      hospitalName: "에디션성형외과테스트",
      hospitalUrl: "https://editionps-test.com",
      specialty: "성형외과",
      region: "서울 강남",
      phone: "02-1234-5678",
      plan: "pro",
    });
    // insertId를 통해 ID 가져오기
    const profile = await getHospitalProfileByUserId(TEST_USER_ID);
    if (!profile) throw new Error("병원 프로필 생성 실패");
    hospitalId = profile.id;
  });

  describe("Phase 1: 추적 코드 시뮬레이션 - 페이지뷰", () => {
    it("ChatGPT에서 유입된 방문 기록", async () => {
      const result = await insertSiteVisit({
        hospitalId,
        visitorId: "v-test-001",
        sessionId: "s-test-001",
        channel: "ai_chatgpt",
        landingPage: "https://editionps-test.com/",
        pageUrl: "https://editionps-test.com/",
        pageTitle: "에디션성형외과 - 강남 코성형 전문",
        referrer: "https://chat.openai.com",
        deviceType: "mobile",
      });
      expect(result).toBeDefined();
    });

    it("Gemini에서 유입된 방문 기록", async () => {
      const result = await insertSiteVisit({
        hospitalId,
        visitorId: "v-test-002",
        sessionId: "s-test-002",
        channel: "ai_gemini",
        landingPage: "https://editionps-test.com/rhinoplasty",
        pageUrl: "https://editionps-test.com/rhinoplasty",
        pageTitle: "코성형 안내",
        referrer: "https://gemini.google.com",
        deviceType: "desktop",
      });
      expect(result).toBeDefined();
    });

    it("네이버에서 유입된 방문 기록", async () => {
      const result = await insertSiteVisit({
        hospitalId,
        visitorId: "v-test-003",
        sessionId: "s-test-003",
        channel: "naver",
        landingPage: "https://editionps-test.com/",
        pageUrl: "https://editionps-test.com/",
        pageTitle: "에디션성형외과",
        referrer: "https://search.naver.com",
        deviceType: "mobile",
      });
      expect(result).toBeDefined();
    });

    it("구글에서 유입된 방문 기록", async () => {
      const result = await insertSiteVisit({
        hospitalId,
        visitorId: "v-test-004",
        sessionId: "s-test-004",
        channel: "google",
        landingPage: "https://editionps-test.com/before-after",
        pageUrl: "https://editionps-test.com/before-after",
        pageTitle: "전후사진",
        referrer: "https://www.google.com",
        deviceType: "desktop",
      });
      expect(result).toBeDefined();
    });

    it("인스타그램에서 유입된 방문 기록", async () => {
      const result = await insertSiteVisit({
        hospitalId,
        visitorId: "v-test-005",
        sessionId: "s-test-005",
        channel: "sns_instagram",
        landingPage: "https://editionps-test.com/events",
        pageUrl: "https://editionps-test.com/events",
        pageTitle: "이벤트",
        referrer: "https://www.instagram.com",
        deviceType: "mobile",
      });
      expect(result).toBeDefined();
    });

    it("직접 방문 기록", async () => {
      const result = await insertSiteVisit({
        hospitalId,
        visitorId: "v-test-006",
        sessionId: "s-test-006",
        channel: "direct",
        landingPage: "https://editionps-test.com/",
        pageUrl: "https://editionps-test.com/",
        pageTitle: "에디션성형외과",
        referrer: "",
        deviceType: "tablet",
      });
      expect(result).toBeDefined();
    });
  });

  describe.skip("Phase 2: 추적 코드 시뮬레이션 - 상담 문의 (DB 마이그레이션 대기)", () => {
    it("ChatGPT에서 유입된 상담 문의", async () => {
      const result = await insertConsultationInquiry({
        hospitalId,
        visitorId: "v-test-001",
        channel: "ai_chatgpt",
        patientName: "김환자",
        patientPhone: "010-1111-2222",
        patientEmail: "kim@test.com",
        message: "코성형 상담 받고 싶습니다",
        treatmentType: "코성형",
      });
      expect(result).toBeDefined();
    });

    it("네이버에서 유입된 상담 문의", async () => {
      const result = await insertConsultationInquiry({
        hospitalId,
        visitorId: "v-test-003",
        channel: "naver",
        patientName: "이환자",
        patientPhone: "010-3333-4444",
        message: "눈성형 비용 문의",
        treatmentType: "눈성형",
      });
      expect(result).toBeDefined();
    });

    it("구글에서 유입된 상담 문의", async () => {
      const result = await insertConsultationInquiry({
        hospitalId,
        visitorId: "v-test-004",
        channel: "google",
        patientName: "Park",
        patientPhone: "010-5555-6666",
        patientEmail: "park@test.com",
        message: "I want to book a consultation for rhinoplasty",
        treatmentType: "rhinoplasty",
      });
      expect(result).toBeDefined();
    });
  });

  describe("Phase 3: 유입 분석 데이터 조회", () => {
    it("방문 통계 조회", async () => {
      const stats = await getSiteVisitStats(hospitalId, thirtyDaysAgo, tomorrow);
      expect(stats).toBeDefined();
      expect(stats!.length).toBeGreaterThan(0);
      const totalVisits = stats!.reduce((s, r) => s + Number(r.count), 0);
      expect(totalVisits).toBeGreaterThanOrEqual(6);
    });

    it("인기 페이지 TOP 조회", async () => {
      const pages = await getTopPages(hospitalId, thirtyDaysAgo, tomorrow, 10);
      expect(pages).toBeDefined();
      expect(pages.length).toBeGreaterThan(0);
    });

    it("일별 방문 추이 조회", async () => {
      const trend = await getDailyVisitTrend(hospitalId, thirtyDaysAgo, tomorrow);
      expect(trend).toBeDefined();
      expect(trend.length).toBeGreaterThan(0);
    });

    it("디바이스별 통계 조회", async () => {
      const devices = await getDeviceStats(hospitalId, thirtyDaysAgo, tomorrow);
      expect(devices).toBeDefined();
      expect(devices.length).toBeGreaterThan(0);
      const mobileCount = devices.find(d => d.deviceType === "mobile");
      expect(mobileCount).toBeDefined();
    });

    it("AI 채널 상세 조회", async () => {
      const aiDetail = await getAiChannelDetail(hospitalId, thirtyDaysAgo, tomorrow);
      expect(aiDetail).toBeDefined();
      expect(aiDetail.length).toBeGreaterThan(0);
      const chatgpt = aiDetail.find(a => a.channel === "ai_chatgpt");
      expect(chatgpt).toBeDefined();
    });

    it("시간대별 분포 조회", async () => {
      const hourly = await getHourlyDistribution(hospitalId, thirtyDaysAgo, tomorrow);
      expect(hourly).toBeDefined();
      expect(hourly.length).toBeGreaterThan(0);
    });
  });

  describe.skip("Phase 4: 상담 관리 기능 검증 (DB 마이그레이션 대기)", () => {
    it("상담 목록 조회", async () => {
      const consultations = await getConsultationsByHospital(hospitalId);
      expect(consultations).toBeDefined();
      expect(consultations.length).toBeGreaterThanOrEqual(3);
    });

    it("상담 통계 조회", async () => {
      const stats = await getConsultationStats(hospitalId);
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
    });

    it("채널별 상담 분석", async () => {
      const byChannel = await getConsultationByChannel(hospitalId);
      expect(byChannel).toBeDefined();
      expect(byChannel.length).toBeGreaterThan(0);
    });

    it("상담 상태 변경 (미응대 → 응대중)", async () => {
      const consultations = await getConsultationsByHospital(hospitalId);
      const first = consultations[0];
      await updateConsultationStatus(first.id, "contacted");
      const updated = await getConsultationsByHospital(hospitalId);
      const updatedFirst = updated.find(c => c.id === first.id);
      expect(updatedFirst?.status).toBe("contacted");
    });

    it("상담 상태 변경 (응대중 → 완료)", async () => {
      const consultations = await getConsultationsByHospital(hospitalId);
      const contacted = consultations.find(c => c.status === "contacted");
      if (contacted) {
        await updateConsultationStatus(contacted.id, "completed");
        const stats = await getConsultationStats(hospitalId);
        expect(stats.completed).toBeGreaterThanOrEqual(1);
      }
    });

    it("월별 상담 추이", async () => {
      const trend = await getConsultationMonthlyTrend(hospitalId);
      expect(trend).toBeDefined();
      expect(trend.length).toBeGreaterThan(0);
    });
  });

  describe.skip("Phase 5: 월간 리포트 데이터 준비 (DB 마이그레이션 대기)", () => {
    it("월간 방문 요약 조회", async () => {
      const summary = await getMonthlyVisitSummary(hospitalId, now.getFullYear(), now.getMonth() + 1);
      expect(summary).toBeDefined();
      expect(summary!.totalVisits).toBeGreaterThanOrEqual(6);
    });

    it("월간 상담 요약 조회", async () => {
      const summary = await getMonthlyInquirySummary(hospitalId, now.getFullYear(), now.getMonth() + 1);
      expect(summary).toBeDefined();
      expect(summary.totalInquiries).toBeGreaterThanOrEqual(3);
    });

    it("월간 리포트 히스토리 조회", async () => {
      const reports = await getMonthlyReportsByHospital(hospitalId);
      expect(reports).toBeDefined();
      expect(reports.length).toBe(0);
    });
  });

  describe.skip("Phase 6: 관리자 병원 현황 대시보드 (DB 마이그레이션 대기)", () => {
    it("전체 병원 현황 조회", async () => {
      const overview = await getAdminHospitalOverview();
      expect(overview).toBeDefined();
      expect(overview.totalHospitals).toBeGreaterThanOrEqual(1);
      expect(overview.totalVisits).toBeGreaterThanOrEqual(6);
      expect(overview.totalInquiries).toBeGreaterThanOrEqual(3);
    });

    it("병원 성과 순위 조회", async () => {
      const ranking = await getHospitalPerformanceRanking();
      expect(ranking).toBeDefined();
      expect(ranking.length).toBeGreaterThanOrEqual(1);
      const edition = ranking.find(r => r.hospitalName === "에디션성형외과테스트");
      expect(edition).toBeDefined();
      expect(edition!.visitCount).toBeGreaterThanOrEqual(6);
    });

    it("전체 채널 통계 조회", async () => {
      const stats = await getAdminChannelStats();
      expect(stats).toBeDefined();
      expect(stats.length).toBeGreaterThan(0);
    });

    it("활성 병원 프로필 조회", async () => {
      const profiles = await getActiveHospitalProfiles();
      expect(profiles).toBeDefined();
      expect(profiles.length).toBeGreaterThanOrEqual(1);
      const edition = profiles.find(p => p.hospitalName === "에디션성형외과테스트");
      expect(edition).toBeDefined();
    });
  });
});

import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("42차: AEO 최적화 + 카카오 예약하기", () => {
  // ===== AEO 빌더 기능 강화 =====
  describe("시술 상세페이지 LLM 프롬프트 AEO 강화", () => {
    const routersContent = readRouterSource();

    it("시술페이지 프롬프트에 AEO 원칙이 포함되어 있어야 한다", () => {
      expect(routersContent).toContain("AEO");
    });

    it("시술페이지 프롬프트에 FAQ 자동 생성 지침이 포함되어 있어야 한다", () => {
      const hasFaq = routersContent.includes("FAQ") || routersContent.includes("faq") || routersContent.includes("자주 묻는");
      expect(hasFaq).toBe(true);
    });

    it("시술페이지 프롬프트에 정보 객관성 지침이 포함되어 있어야 한다", () => {
      // 객관적/근거 기반 표현 요구
      const hasObjectivity = routersContent.includes("객관") || routersContent.includes("근거") || routersContent.includes("evidence") || routersContent.includes("논문");
      expect(hasObjectivity).toBe(true);
    });

    it("시술페이지 프롬프트에 논리적 구조화 지침이 포함되어 있어야 한다", () => {
      const hasStructure = routersContent.includes("구조화") || routersContent.includes("논리적") || routersContent.includes("structured");
      expect(hasStructure).toBe(true);
    });
  });

  // ===== Schema.org 구조화 데이터 =====
  describe("시술 상세페이지 구조화 데이터", () => {
    const publicPageContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/TreatmentPagePublic.tsx"), "utf-8"
    );

    it("Schema.org MedicalProcedure 구조화 데이터가 포함되어 있어야 한다", () => {
      expect(publicPageContent).toContain("MedicalProcedure");
    });

    it("FAQPage 구조화 데이터가 포함되어 있어야 한다", () => {
      expect(publicPageContent).toContain("FAQPage");
    });

    it("JSON-LD 스크립트 태그가 포함되어 있어야 한다", () => {
      expect(publicPageContent).toContain("application/ld+json");
    });

    it("메타 태그 description이 동적으로 설정되어야 한다", () => {
      expect(publicPageContent).toContain("meta");
      expect(publicPageContent).toContain("description");
    });

    it("FAQ 섹션이 렌더링되어야 한다", () => {
      expect(publicPageContent).toContain("FAQ");
    });
  });

  // ===== 카카오톡 예약하기 =====
  describe("카카오 예약 DB 스키마", () => {
    const schemaContent = fs.readFileSync(
      path.resolve(__dirname, "../drizzle/schema.ts"), "utf-8"
    );

    it("kakaoBookingSettings 테이블이 정의되어 있어야 한다", () => {
      expect(schemaContent).toContain("kakaoBookingSettings");
    });

    it("bookingSlots 테이블이 정의되어 있어야 한다", () => {
      expect(schemaContent).toContain("bookingSlots");
    });

    it("예약 설정에 운영시간 필드가 있어야 한다", () => {
      expect(schemaContent).toContain("workingHoursStart");
      expect(schemaContent).toContain("workingHoursEnd");
    });

    it("예약 설정에 휴무일 필드가 있어야 한다", () => {
      expect(schemaContent).toContain("closedDays");
    });

    it("예약 슬롯에 시술명과 시간 필드가 있어야 한다", () => {
      expect(schemaContent).toContain("treatmentName");
      expect(schemaContent).toContain("duration");
    });
  });

  describe("카카오 예약 서버 API", () => {
    const routersContent = readRouterSource();

    it("kakaoBooking 라우터가 정의되어 있어야 한다", () => {
      expect(routersContent).toContain("kakaoBooking:");
    });

    it("getSettings 프로시저가 있어야 한다", () => {
      expect(routersContent).toContain("getSettings:");
    });

    it("upsertSettings 프로시저가 있어야 한다", () => {
      expect(routersContent).toContain("upsertSettings:");
    });

    it("createSlot 프로시저가 있어야 한다", () => {
      expect(routersContent).toContain("createSlot:");
    });

    it("deleteSlot 프로시저가 있어야 한다", () => {
      expect(routersContent).toContain("deleteSlot:");
    });

    it("getPublicSlots 퍼블릭 프로시저가 있어야 한다", () => {
      expect(routersContent).toContain("getPublicSlots:");
    });
  });

  describe("카카오 예약 DB 헬퍼", () => {
    const dbContent = fs.readFileSync(path.resolve(__dirname, "db.ts"), "utf-8");

    it("getBookingSettings 함수가 있어야 한다", () => {
      expect(dbContent).toContain("getBookingSettings");
    });

    it("upsertBookingSettings 함수가 있어야 한다", () => {
      expect(dbContent).toContain("upsertBookingSettings");
    });

    it("getBookingSlots 함수가 있어야 한다", () => {
      expect(dbContent).toContain("getBookingSlots");
    });

    it("createBookingSlot 함수가 있어야 한다", () => {
      expect(dbContent).toContain("createBookingSlot");
    });

    it("deleteBookingSlot 함수가 있어야 한다", () => {
      expect(dbContent).toContain("deleteBookingSlot");
    });
  });

  describe("카카오 예약 UI", () => {
    const uiContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/KakaoBooking.tsx"), "utf-8"
    );

    it("카카오 채널 연동 설정 UI가 있어야 한다", () => {
      expect(uiContent).toContain("채널 ID");
      expect(uiContent).toContain("채널 URL");
    });

    it("운영 시간 설정 UI가 있어야 한다", () => {
      expect(uiContent).toContain("진료 시작");
      expect(uiContent).toContain("진료 종료");
    });

    it("휴무일 설정 UI가 있어야 한다", () => {
      expect(uiContent).toContain("휴무일");
    });

    it("시술 항목 관리 UI가 있어야 한다", () => {
      expect(uiContent).toContain("시술 추가");
      expect(uiContent).toContain("시술명");
    });

    it("연동 가이드가 포함되어 있어야 한다", () => {
      expect(uiContent).toContain("연동 가이드");
    });
  });

  describe("사이드바 + 라우트 등록", () => {
    const dashboardContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8"
    );
    const appContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/App.tsx"), "utf-8"
    );

    it("사이드바에 카카오 예약 메뉴가 있어야 한다", () => {
      expect(dashboardContent).toContain("카카오 예약");
      expect(dashboardContent).toContain("/admin/kakao-booking");
    });

    it("App.tsx에 카카오 예약 라우트가 있어야 한다", () => {
      expect(appContent).toContain("/admin/kakao-booking");
      expect(appContent).toContain("KakaoBooking");
    });
  });
});

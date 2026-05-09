/**
 * Phase 3: 서비스 상세 페이지 5개 검증 테스트
 * - 파일 존재 여부
 * - Service Schema JSON-LD 포함
 * - 라우팅 연결 확인
 * - 핵심 콘텐츠 검증
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const clientDir = resolve(__dirname, "../client/src");

function readPage(name: string): string {
  return readFileSync(resolve(clientDir, `pages/${name}.tsx`), "utf-8");
}

function readComponent(name: string): string {
  return readFileSync(resolve(clientDir, `components/${name}.tsx`), "utf-8");
}

describe("Phase 3: 서비스 상세 페이지", () => {
  describe("파일 존재 확인", () => {
    const pages = [
      "ServiceVisibility",
      "ServiceReputation",
      "ServiceLearningHub",
      "ServiceWebsite",
      "ServiceCommunication",
    ];

    pages.forEach((page) => {
      it(`${page}.tsx 파일이 존재한다`, () => {
        expect(() => readPage(page)).not.toThrow();
      });
    });
  });

  describe("App.tsx 라우팅 연결", () => {
    const appTsx = readFileSync(resolve(clientDir, "App.tsx"), "utf-8");

    it("/services/visibility 라우트가 등록되어 있다", () => {
      expect(appTsx).toContain("/services/visibility");
      expect(appTsx).toContain("ServiceVisibility");
    });

    it("/services/reputation 라우트가 등록되어 있다", () => {
      expect(appTsx).toContain("/services/reputation");
      expect(appTsx).toContain("ServiceReputation");
    });

    it("/services/learning-hub 라우트가 등록되어 있다", () => {
      expect(appTsx).toContain("/services/learning-hub");
      expect(appTsx).toContain("ServiceLearningHub");
    });

    it("/services/website 라우트가 등록되어 있다", () => {
      expect(appTsx).toContain("/services/website");
      expect(appTsx).toContain("ServiceWebsite");
    });

    it("/services/communication 라우트가 등록되어 있다", () => {
      expect(appTsx).toContain("/services/communication");
      expect(appTsx).toContain("ServiceCommunication");
    });
  });

  describe("Service Schema (JSON-LD) 적용", () => {
    it("ServiceVisibility에 Service schema가 포함되어 있다", () => {
      const src = readPage("ServiceVisibility");
      expect(src).toContain('"@type": "Service"');
      expect(src).toContain('"@type": "BreadcrumbList"');
      expect(src).toContain("AI Visibility Engine");
    });

    it("ServiceReputation에 Service schema가 포함되어 있다", () => {
      const src = readPage("ServiceReputation");
      expect(src).toContain('"@type": "Service"');
      expect(src).toContain('"@type": "BreadcrumbList"');
      expect(src).toContain("Reputation Defense");
    });

    it("ServiceLearningHub에 Service schema가 포함되어 있다", () => {
      const src = readPage("ServiceLearningHub");
      expect(src).toContain('"@type": "Service"');
      expect(src).toContain('"@type": "BreadcrumbList"');
      expect(src).toContain("AI Learning Hub");
    });

    it("ServiceWebsite에 Service schema가 포함되어 있다", () => {
      const src = readPage("ServiceWebsite");
      expect(src).toContain('"@type": "Service"');
      expect(src).toContain('"@type": "BreadcrumbList"');
      expect(src).toContain("Smart Website Platform");
    });

    it("ServiceCommunication에 Service schema가 포함되어 있다", () => {
      const src = readPage("ServiceCommunication");
      expect(src).toContain('"@type": "Service"');
      expect(src).toContain('"@type": "BreadcrumbList"');
      expect(src).toContain("Patient Communication Hub");
    });
  });

  describe("AI Visibility Engine 핵심 콘텐츠", () => {
    const src = readPage("ServiceVisibility");

    it("문제 정의 섹션이 포함되어 있다", () => {
      expect(src).toMatch(/AI\s*검색|가시성/);
    });

    it("작동 방식(프로세스) 섹션이 포함되어 있다", () => {
      expect(src).toMatch(/작동\s*방식|프로세스/);
    });

    it("케이스 스터디가 포함되어 있다", () => {
      expect(src).toMatch(/도입\s*사례|케이스|성형외과|피부과/);
    });

    it("포함 항목 리스트가 있다", () => {
      expect(src).toMatch(/포함\s*항목/);
    });

    it("CTA 버튼이 있다 (도입 상담 또는 무료 진단)", () => {
      expect(src).toMatch(/도입\s*상담|무료.*진단/);
    });
  });

  describe("Reputation Defense 핵심 콘텐츠", () => {
    const src = readPage("ServiceReputation");

    it("평판 방어 관련 문제 정의가 있다", () => {
      expect(src).toMatch(/부정\s*리뷰|평판|악성/);
    });

    it("작동 방식 섹션이 있다", () => {
      expect(src).toMatch(/작동\s*방식/);
    });

    it("케이스 스터디가 있다", () => {
      expect(src).toMatch(/도입\s*사례|케이스/);
    });

    it("포함 항목이 있다", () => {
      expect(src).toMatch(/포함\s*항목/);
    });
  });

  describe("AI Learning Hub 핵심 콘텐츠", () => {
    const src = readPage("ServiceLearningHub");

    it("AI 학습 관련 문제 정의가 있다", () => {
      expect(src).toMatch(/AI.*학습|부정확.*답변|Knowledge\s*Base/);
    });

    it("작동 방식 섹션이 있다", () => {
      expect(src).toMatch(/작동\s*방식/);
    });

    it("케이스 스터디가 있다", () => {
      expect(src).toMatch(/도입\s*사례/);
    });

    it("포함 항목이 있다", () => {
      expect(src).toMatch(/포함\s*항목/);
    });
  });

  describe("Smart Website 핵심 콘텐츠", () => {
    const src = readPage("ServiceWebsite");

    it("핵심 기능 섹션이 있다", () => {
      expect(src).toMatch(/핵심\s*기능/);
    });

    it("AI 크롤러 최적화 관련 내용이 있다", () => {
      expect(src).toMatch(/AI\s*크롤러|Schema\s*마크업|llms\.txt/);
    });

    it("포함 항목이 있다", () => {
      expect(src).toMatch(/포함\s*항목/);
    });
  });

  describe("Patient Communication 핵심 콘텐츠", () => {
    const src = readPage("ServiceCommunication");

    it("핵심 기능 섹션이 있다", () => {
      expect(src).toMatch(/핵심\s*기능/);
    });

    it("AI 챗봇 관련 내용이 있다", () => {
      expect(src).toMatch(/AI\s*챗봇|24시간|상담/);
    });

    it("노쇼 방지 관련 내용이 있다", () => {
      expect(src).toMatch(/노쇼\s*방지|리마인더/);
    });

    it("포함 항목이 있다", () => {
      expect(src).toMatch(/포함\s*항목/);
    });
  });

  describe("ServicesSection 링크 업데이트", () => {
    const src = readComponent("ServicesSection");

    it("3개 압도 서비스가 상세 페이지로 링크된다", () => {
      expect(src).toContain("/services/visibility");
      expect(src).toContain("/services/reputation");
      expect(src).toContain("/services/learning-hub");
    });

    it("2개 보조 서비스가 상세 페이지로 링크된다", () => {
      expect(src).toContain("/services/website");
      expect(src).toContain("/services/communication");
    });

    it("CTA 라벨이 '자세히 보기'로 변경되었다", () => {
      expect(src).toContain("자세히 보기");
    });
  });

  describe("Navbar prefetch 등록", () => {
    const navbar = readComponent("Navbar");

    it("서비스 상세 페이지 prefetch가 등록되어 있다", () => {
      expect(navbar).toContain("/services/visibility");
      expect(navbar).toContain("/services/reputation");
      expect(navbar).toContain("/services/learning-hub");
      expect(navbar).toContain("/services/website");
      expect(navbar).toContain("/services/communication");
    });
  });
});

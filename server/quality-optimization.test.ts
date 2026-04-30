import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { readRouterSource } from "./test-helpers";

describe("41차: 서비스 품질 업그레이드 + 코드/성능 최적화", () => {
  // === LLM 프롬프트 고도화 ===
  describe("LLM 프롬프트 품질", () => {
    const routersContent = readRouterSource();

    it("시술 상세페이지 프롬프트가 의료광고법 준수 원칙을 포함해야 함", () => {
      expect(routersContent).toContain("의료광고법 100% 준수");
      expect(routersContent).toContain("과장 표현 절대 금지");
    });

    it("시술 상세페이지 프롬프트가 SEO 최적화 가이드를 포함해야 함", () => {
      expect(routersContent).toContain("SEO 최적화");
      expect(routersContent).toContain("키워드를 자연스럽게");
    });

    it("시술 상세페이지 프롬프트가 섹션별 상세 가이드를 포함해야 함", () => {
      expect(routersContent).toContain("섹션별 상세 가이드");
      expect(routersContent).toContain("feature");
      expect(routersContent).toContain("comparison");
      expect(routersContent).toContain("benefits");
      expect(routersContent).toContain("process");
      expect(routersContent).toContain("faq");
    });

    it("시술 상세페이지 JSON schema에 상세한 description이 있어야 함", () => {
      expect(routersContent).toContain("히어로 메인 타이틀 - 시술의 핵심 가치를 한 줄로");
      expect(routersContent).toContain("SEO 타이틀 - '시술명 | 병원명' 형식");
      expect(routersContent).toContain("SEO 키워드 - 시술명, 지역명, 관련 증상 포함");
    });

    it("벤치마킹 리포트 프롬프트가 구체적인 작성 원칙을 포함해야 함", () => {
      expect(routersContent).toContain("오늘 바로 실행 가능한");
      expect(routersContent).toContain("측정 가능한 지침");
    });

    it("OSMU 콘텐츠 프롬프트가 채널별 상세 가이드를 포함해야 함", () => {
      expect(routersContent).toContain("네이버 블로그용 SEO 최적화 글");
      expect(routersContent).toContain("인스타그램 피드용 포스트");
      expect(routersContent).toContain("카카오톡 채널 메시지용");
    });

    it("AI SNS 팁 프롬프트가 실제 포스팅 예시 요구를 포함해야 함", () => {
      expect(routersContent).toContain("실제 포스팅 예시문구를 contentIdeas에 포함");
      expect(routersContent).toContain("구어체 키워드");
    });
  });

  // === 번들 최적화 ===
  describe("번들 최적화", () => {
    it("Home.tsx에 lazy import로 코드 스플리팅이 적용되어 있어야 함", () => {
      const homePath = join(__dirname, "../client/src/pages/Home.tsx");
      const content = readFileSync(homePath, "utf8");
      expect(content).toContain("lazy(");
      expect(content).toContain("Suspense");
    });

    it("vite.config.ts에 manualChunks가 vendor-react 분리용으로만 사용되어야 함", () => {
      const vitePath = join(__dirname, "../vite.config.ts");
      const content = readFileSync(vitePath, "utf8");
      expect(content).toContain("manualChunks");
      expect(content).toContain("vendor-react");
    });

    it("LazySection으로 스크롤 기반 로딩이 적용되어 있어야 함", () => {
      const homePath = join(__dirname, "../client/src/pages/Home.tsx");
      const content = readFileSync(homePath, "utf8");
      expect(content).toContain("LazySection");
      expect(content).toContain("IntersectionObserver");
    });
  });

  // === React Query 최적화 ===
  describe("React Query 최적화", () => {
    it("QueryClient에 staleTime이 설정되어 있어야 함", () => {
      const mainPath = join(__dirname, "../client/src/main.tsx");
      const content = readFileSync(mainPath, "utf8");
      expect(content).toContain("staleTime");
    });

    it("QueryClient에 gcTime이 설정되어 있어야 함", () => {
      const mainPath = join(__dirname, "../client/src/main.tsx");
      const content = readFileSync(mainPath, "utf8");
      expect(content).toContain("gcTime");
    });

    it("refetchOnWindowFocus가 비활성화되어 있어야 함", () => {
      const mainPath = join(__dirname, "../client/src/main.tsx");
      const content = readFileSync(mainPath, "utf8");
      expect(content).toContain("refetchOnWindowFocus: false");
    });

    it("mutation retry가 0으로 설정되어 있어야 함", () => {
      const mainPath = join(__dirname, "../client/src/main.tsx");
      const content = readFileSync(mainPath, "utf8");
      expect(content).toContain("retry: 0");
    });
  });

  // === 에러 핸들링 ===
  describe("에러 핸들링 강화", () => {
    const routersContent = readRouterSource();

    it("시술 상세페이지 AI 응답에 에러 핸들링이 있어야 함", () => {
      expect(routersContent).toContain("AI 콘텐츠 생성 실패");
      expect(routersContent).toContain("필수 필드가 누락");
    });

    it("벤치마킹 AI 응답에 에러 핸들링이 있어야 함", () => {
      expect(routersContent).toContain("자동 분석 결과를 생성하지 못했습니다");
    });

    it("OSMU 콘텐츠 생성에 에러 핸들링이 있어야 함", () => {
      expect(routersContent).toContain("AI 콘텐츠 생성에 실패했습니다");
    });
  });

  // === 보안 헤더 유지 확인 ===
  describe("보안 설정 유지", () => {
    it("서버에 X-Powered-By 제거가 유지되어야 함", () => {
      const indexPath = join(__dirname, "_core/index.ts");
      const content = readFileSync(indexPath, "utf8");
      expect(content).toContain("x-powered-by");
    });

    it("쿠키 이름이 커스텀으로 유지되어야 함", () => {
      const constPath = join(__dirname, "../shared/const.ts");
      const content = readFileSync(constPath, "utf8");
      expect(content).toContain("_mb_sid");
    });
  });
});

/**
 * 콘텐츠 공장 체험 모드 + 사이트 개선 테스트
 * - trialReelsProduction 릴스 체험 프로시저 확인
 * - trialContentBlog 블로그 체험 프로시저 하위 호환
 * - ReelsTrialSection 컴포넌트 확인
 * - 메뉴바 AI 최적화 진단 텍스트 변경
 * - 검은 여백 수정 (LazySection)
 * - 서비스 카드 → /content-factory 링크
 * - 로드맵 상태 유지
 * - 내 병원 탭 순서 유지
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

/* ─── 1. 릴스 체험 모드 (trialReelsProduction) ─── */
describe("AI 콘텐츠 공장 체험 모드 — 인스타 릴스 제작 과정 시연", () => {
  const routerSrc = readFileSync(
    resolve(ROOT, "server/routes/interviewContent.ts"),
    "utf-8"
  );

  it("trialReelsProduction publicProcedure가 interviewContent 라우터에 존재한다", () => {
    expect(routerSrc).toContain("trialReelsProduction");
    expect(routerSrc).toContain("publicProcedure");
  });

  it("trialReelsProduction은 hospitalName, specialty, topic을 입력받는다", () => {
    const reelsSection = routerSrc.substring(routerSrc.indexOf("trialReelsProduction"));
    expect(reelsSection).toContain("hospitalName: z.string()");
    expect(reelsSection).toContain("specialty: z.string()");
    expect(reelsSection).toContain("topic: z.string()");
  });

  it("trialReelsProduction은 벤치마킹, 콘텐츠 기획, SEO 최적화, 제작 도구 정보를 반환한다", () => {
    expect(routerSrc).toContain("benchmarkAnalysis");
    expect(routerSrc).toContain("contentPlan");
    expect(routerSrc).toContain("seoOptimization");
    expect(routerSrc).toContain("productionPlan");
    expect(routerSrc).toContain("qualityChecklist");
  });

  it("기존 trialContentBlog 프로시저도 여전히 존재한다 (하위 호환)", () => {
    expect(routerSrc).toContain("trialContentBlog: publicProcedure");
  });
});

/* ─── 2. ReelsTrialSection 컴포넌트 ─── */
describe("ReelsTrialSection 컴포넌트", () => {
  const componentSrc = readFileSync(
    resolve(ROOT, "client/src/components/ReelsTrialSection.tsx"),
    "utf-8"
  );

  it("ReelsTrialSection 컴포넌트가 존재한다", () => {
    expect(componentSrc).toContain("export default function ReelsTrialSection");
  });

  it("trpc.interviewContent.trialReelsProduction.useMutation을 호출한다", () => {
    expect(componentSrc).toContain("trpc.interviewContent.trialReelsProduction.useMutation");
  });

  it("7단계 제작 과정 (PRODUCTION_STEPS)이 정의되어 있다", () => {
    expect(componentSrc).toContain("PRODUCTION_STEPS");
    expect(componentSrc).toContain('"benchmark"');
    expect(componentSrc).toContain('"plan"');
    expect(componentSrc).toContain('"seo"');
    expect(componentSrc).toContain('"video"');
    expect(componentSrc).toContain('"subtitle"');
    expect(componentSrc).toContain('"music"');
    expect(componentSrc).toContain('"quality"');
  });

  it("진료과별 주제 추천 (TOPIC_SUGGESTIONS)이 정의되어 있다", () => {
    expect(componentSrc).toContain("TOPIC_SUGGESTIONS");
  });

  it("단계별 애니메이션 진행 로직이 있다", () => {
    expect(componentSrc).toContain("animateSteps");
    expect(componentSrc).toContain("completedSteps");
    expect(componentSrc).toContain("activeStep");
  });
});

/* ─── 3. ContentFactoryLanding에서 ReelsTrialSection 사용 ─── */
describe("ContentFactoryLanding 페이지", () => {
  const landingSrc = readFileSync(
    resolve(ROOT, "client/src/pages/ContentFactoryLanding.tsx"),
    "utf-8"
  );

  it("ReelsTrialSection을 import하고 사용한다", () => {
    expect(landingSrc).toContain('import ReelsTrialSection from "@/components/ReelsTrialSection"');
    expect(landingSrc).toContain("<ReelsTrialSection />");
  });

  it("기존 TrialSection 함수가 제거되었다", () => {
    expect(landingSrc).not.toContain("function TrialSection()");
    expect(landingSrc).not.toContain("SAMPLE_TRANSCRIPTS");
  });
});

/* ─── 4. 메뉴바 AI 최적화 진단 ─── */
describe("메뉴바 텍스트 변경", () => {
  const navbarSrc = readFileSync(
    resolve(ROOT, "client/src/components/Navbar.tsx"),
    "utf-8"
  );

  it("AI 최적화 진단 텍스트가 존재한다", () => {
    expect(navbarSrc).toContain("AI 최적화 진단");
  });

  it("AI 최적화 진단 텍스트가 navLinks에 정의되어 있다", () => {
    expect(navbarSrc).toContain('label: "AI 최적화 진단"');
  });
});

/* ─── 5. 검은 여백 수정 (LazySection) ─── */
describe("검은 여백 레이아웃 수정", () => {
  const homeSrc = readFileSync(
    resolve(ROOT, "client/src/pages/Home.tsx"),
    "utf-8"
  );

  it("LazySection rootMargin이 600px으로 설정되어 미리 로드된다", () => {
    expect(homeSrc).toContain("600px");
  });
});

/* ─── 6. 서비스 카드 → /content-factory 링크 ─── */
describe("서비스 카드 콘텐츠 공장 링크", () => {
  const servicesSrc = readFileSync(
    resolve(ROOT, "client/src/components/ServicesSection.tsx"),
    "utf-8"
  );

  it("AI 콘텐츠 공장 카드에 /content-factory href가 있다", () => {
    expect(servicesSrc).toContain("/content-factory");
  });
});

/* ─── 7. 로드맵 상태 유지 ─── */
describe("로드맵 상태 유지 확인", () => {
  const roadmapSrc = readFileSync(
    resolve(ROOT, "client/src/components/RoadmapSection.tsx"),
    "utf-8"
  );

  it("노쇼 방어 AI 시스템이 live 상태이다", () => {
    const noshoIndex = roadmapSrc.indexOf("노쇼 방어 AI 시스템");
    expect(noshoIndex).toBeGreaterThan(-1);
    const nearbyContent = roadmapSrc.substring(Math.max(0, noshoIndex - 500), noshoIndex + 500);
    expect(nearbyContent).toMatch(/status:\s*"live"/);
  });

  it("콘텐츠 공장이 live 상태이다", () => {
    const factoryIndex = roadmapSrc.indexOf("콘텐츠 공장");
    expect(factoryIndex).toBeGreaterThan(-1);
    const nearbyContent = roadmapSrc.substring(Math.max(0, factoryIndex - 200), factoryIndex + 200);
    expect(nearbyContent).toContain("live");
  });

  it("병원 맞춤 미니 앱이 삭제되었다", () => {
    expect(roadmapSrc).not.toContain("병원 맞춤 미니 앱");
  });

  it("AI 건강 비서 앱이 삭제되었다", () => {
    expect(roadmapSrc).not.toContain("AI 건강 비서");
  });
});

/* ─── 8. 내 병원 탭 순서 유지 ─── */
describe("내 병원 탭 순서 유지 확인", () => {
  const myHospitalSrc = readFileSync(
    resolve(ROOT, "client/src/pages/MyHospital.tsx"),
    "utf-8"
  );

  it("탭 순서가 리포트 → AI 인용 → 유입 분석 → 상담 관리 순이다", () => {
    const tabsListStart = myHospitalSrc.indexOf("<TabsList");
    const tabsListEnd = myHospitalSrc.indexOf("</TabsList>", tabsListStart);
    const tabsListContent = myHospitalSrc.substring(tabsListStart, tabsListEnd);

    const reportTrigger = tabsListContent.indexOf('value="report"');
    const aiExposureTrigger = tabsListContent.indexOf('value="ai-exposure"');
    const trafficTrigger = tabsListContent.indexOf('value="traffic"');
    const consultTrigger = tabsListContent.indexOf('value="consultation"');

    expect(reportTrigger).toBeGreaterThan(-1);
    expect(aiExposureTrigger).toBeGreaterThan(-1);
    expect(trafficTrigger).toBeGreaterThan(-1);
    expect(consultTrigger).toBeGreaterThan(-1);

    expect(reportTrigger).toBeLessThan(aiExposureTrigger);
    expect(aiExposureTrigger).toBeLessThan(trafficTrigger);
    expect(trafficTrigger).toBeLessThan(consultTrigger);
  });

  it("defaultValue가 report이다", () => {
    expect(myHospitalSrc).toContain('defaultValue="report"');
  });
});

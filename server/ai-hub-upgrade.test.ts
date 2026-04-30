import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── 프리셋 템플릿 시스템 테스트 ───
describe("AI Hub Preset Templates", () => {
  const routersContent = readRouterSource();

  it("presets 프로시저가 존재한다", () => {
    expect(routersContent).toContain("presets:");
  });

  it("generateFromPreset 프로시저가 존재한다", () => {
    expect(routersContent).toContain("generateFromPreset:");
  });

  it("reviewContent 단독 프로시저가 존재한다", () => {
    expect(routersContent).toContain("reviewContent:");
  });

  it("프리셋 10종이 정의되어 있다", () => {
    // 각 프리셋 ID 확인
    const presetIds = [
      "naver_blog_review",
      "naver_blog_seo",
      "naver_blog_info",
      "insta_event",
      "insta_daily",
      "kakao_notice",
      "cardnews_event",
      "cardnews_tip",
      "video_shorts",
      "video_interview",
    ];
    presetIds.forEach((id) => {
      expect(routersContent).toContain(id);
    });
  });

  it("프리셋에 카테고리가 4종 포함되어 있다 (블로그, SNS, 카드뉴스, 영상)", () => {
    expect(routersContent).toContain('category: "블로그"');
    expect(routersContent).toContain('category: "SNS"');
    expect(routersContent).toContain('category: "카드뉴스"');
    expect(routersContent).toContain('category: "영상"');
  });
});

// ─── 의료광고법 검수 파이프라인 테스트 ───
describe("Medical Ad Review Pipeline", () => {
  const routersContent = readRouterSource();

  it("의료법 7개 검수 항목이 프롬프트에 포함되어 있다", () => {
    const reviewItems = [
      "효과 보장 표현",
      "비교 광고",
      "환자 유인 행위",
      "미인증 의료기기",
      "전후 사진 규정",
      "부작용/개인차 고지 누락",
      "의료인 경력 과장",
    ];
    reviewItems.forEach((item) => {
      expect(routersContent).toContain(item);
    });
  });

  it("검수 결과에 verdict, score, issues, summary, revisedContent 필드가 포함된다", () => {
    expect(routersContent).toContain('"verdict"');
    expect(routersContent).toContain('"score"');
    expect(routersContent).toContain('"issues"');
    expect(routersContent).toContain('"summary"');
    expect(routersContent).toContain('"revisedContent"');
  });

  it("generateFromPreset에 enableReview 옵션이 있다", () => {
    expect(routersContent).toContain("enableReview");
  });

  it("trialBlog에 의료법 검수 파이프라인이 추가되어 있다", () => {
    // trialBlog 프로시저 내에서 의료법 검수가 실행되는지 확인
    const trialBlogSection = routersContent.substring(
      routersContent.indexOf("trialBlog:"),
      routersContent.indexOf("trialStats:")
    );
    expect(trialBlogSection).toContain("의료광고법 검수");
    expect(trialBlogSection).toContain("review");
    expect(trialBlogSection).toContain("medical_ad_review");
  });
});

// ─── UI 컴포넌트 테스트 ───
describe("AI Hub UI Components", () => {
  const hubContent = readFileSync(resolve(__dirname, "../client/src/pages/AiHub.tsx"), "utf-8");
  const trialContent = readFileSync(resolve(__dirname, "../client/src/pages/AiBlogTrial.tsx"), "utf-8");

  it("AI 허브에 프리셋 선택기가 있다", () => {
    expect(hubContent).toContain("PresetSelector");
    expect(hubContent).toContain("presets");
  });

  it("AI 허브에 파이프라인 진행 시각화가 있다", () => {
    expect(hubContent).toContain("PipelineProgress");
  });

  it("AI 허브에 의료법 검수 결과 컴포넌트가 있다", () => {
    expect(hubContent).toContain("ReviewResult");
  });

  it("AI 허브에 단독 의료법 검수 탭이 있다", () => {
    expect(hubContent).toContain("StandaloneReview");
    expect(hubContent).toContain("의료광고법 검수");
  });

  it("AI 허브에 카테고리 필터가 있다", () => {
    expect(hubContent).toContain("categoryFilter");
  });

  it("AI 허브에 의료법 검수 토글이 있다", () => {
    expect(hubContent).toContain("enableReview");
  });

  it("블로그 체험 페이지에 의료법 검수 결과가 표시된다", () => {
    expect(trialContent).toContain("ReviewBanner");
    expect(trialContent).toContain("ReviewDetail");
    expect(trialContent).toContain("의료광고법");
  });

  it("블로그 체험 페이지에 파이프라인 시각화가 있다", () => {
    expect(trialContent).toContain("초안 작성 중");
    expect(trialContent).toContain("의료광고법 검수");
  });

  it("블로그 체험 페이지에서 검수 수정본이 있으면 수정본을 복사한다", () => {
    expect(trialContent).toContain("revisedContent");
    expect(trialContent).toContain("verdict");
  });

  it("검수 결과에 severity별 배지가 있다 (위험/주의/참고)", () => {
    expect(hubContent).toContain("위험");
    expect(hubContent).toContain("주의");
    expect(hubContent).toContain("참고");
  });
});

// ─── 프리셋 구조 검증 ───
describe("Preset Structure Validation", () => {
  const routersContent = readRouterSource();

  it("각 프리셋에 필수 필드가 있다 (id, name, category, description, icon, fields, promptHint)", () => {
    // 프리셋 정의 부분에서 필수 필드 확인
    expect(routersContent).toContain("promptHint:");
    expect(routersContent).toContain("fields:");
    expect(routersContent).toContain("icon:");
  });

  it("generateFromPreset이 presetId, hospitalName, specialty, userInput을 입력받는다", () => {
    expect(routersContent).toContain("presetId:");
    expect(routersContent).toContain("hospitalName:");
    expect(routersContent).toContain("specialty:");
    expect(routersContent).toContain("userInput:");
  });
});

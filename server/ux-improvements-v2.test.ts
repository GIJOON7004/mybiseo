import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function readClient(relPath: string): string {
  return readFileSync(resolve(__dirname, "..", "client", "src", relPath), "utf-8");
}

function readComponent(name: string): string {
  return readClient(`components/${name}`);
}

function readPage(name: string): string {
  return readClient(`pages/${name}`);
}

describe("UI/UX 개선 v2 (10개 항목)", () => {
  // 개선 #1: /diagnosis → /ai-check 리다이렉트
  it("App.tsx에 /diagnosis → /ai-check 리다이렉트가 있어야 한다", () => {
    const app = readClient("App.tsx");
    expect(app).toContain('path="/diagnosis"');
    expect(app).toContain('/ai-check');
  });

  // 개선 #2: 404 페이지 다크 테마
  it("NotFound 페이지가 다크 테마(bg-background)를 사용해야 한다", () => {
    const notFound = readPage("NotFound.tsx");
    expect(notFound).toContain("bg-background");
    // 라이트 테마 클래스가 없어야 함
    expect(notFound).not.toContain("bg-gradient-to-br from-slate-50");
    expect(notFound).not.toContain("bg-white");
  });

  // 개선 #2 추가: 404 페이지 한국어 텍스트
  it("NotFound 페이지가 한국어 텍스트를 사용해야 한다", () => {
    const notFound = readPage("NotFound.tsx");
    expect(notFound).toContain("페이지를 찾을 수 없습니다");
    expect(notFound).toContain("홈으로 이동");
  });

  // 개선 #3: 관리자 권한 없음 시 홈으로 돌아가기 버튼
  it("Admin 페이지에 권한 없을 때 홈으로 돌아가기 버튼이 있어야 한다", () => {
    const admin = readPage("Admin.tsx");
    expect(admin).toContain("홈으로 돌아가기");
    expect(admin).toContain("관리자 권한이 필요하시면 담당자에게 문의해 주세요");
  });

  // 개선 #4: AI 블로그 체험 페이지 하단 안내 카드
  it("AiBlogTrial 페이지에 결과 없을 때 하단 안내 카드가 있어야 한다", () => {
    const trial = readPage("AiBlogTrial.tsx");
    expect(trial).toContain("SEO 최적화 구조");
    expect(trial).toContain("의료광고법 자동 검수");
    expect(trial).toContain("진료과별 맞춤 콘텐츠");
  });

  // 개선 #5: 국기 버튼에 title 속성
  it("HeroSection 국기 버튼에 title 속성이 있어야 한다", () => {
    const hero = readComponent("HeroSection.tsx");
    expect(hero).toContain("클릭하여 국가 변경");
  });

  // 개선 #6: 미리보기 모드 배너 강화
  it("MyHospital 미리보기 배너가 yellow 테마로 강화되어야 한다", () => {
    const myHospital = readPage("MyHospital.tsx");
    expect(myHospital).toContain("text-yellow-400");
    expect(myHospital).toContain("샘플 데이터");
  });

  // 개선 #7: 블로그 0개 글 카테고리 '준비 중' 표시
  it("Blog 페이지에서 0개 글 카테고리에 '준비 중' 표시가 있어야 한다", () => {
    const blog = readPage("Blog.tsx");
    expect(blog).toContain("준비 중");
    expect(blog).toContain("cat.postCount === 0");
  });

  // 개선 #8: SeoChecker 결과 없을 때 최소 높이 보장
  it("SeoChecker에 결과 없을 때 최소 높이 spacer가 있어야 한다", () => {
    const seo = readPage("SeoChecker.tsx");
    expect(seo).toContain("min-h-[30vh]");
    expect(seo).toContain("!result && !analyzeMutation.isPending");
  });

  // 개선 #9: KakaoFloat 위치 조정 (ChatBot과 겹치지 않도록)
  it("KakaoFloat이 ChatBot 위에 위치해야 한다 (bottom-[88px])", () => {
    const kakao = readComponent("KakaoFloat.tsx");
    expect(kakao).toContain("bottom-[88px]");
    // z-index가 ChatBot(z-50)보다 낮아야 함
    expect(kakao).toContain("z-40");
  });

  // 개선 #10: 모바일 메뉴 터치 영역 개선
  it("Navbar 모바일 메뉴 항목이 py-4 터치 영역을 가져야 한다", () => {
    const navbar = readComponent("Navbar.tsx");
    // py-4로 터치 영역 확대
    expect(navbar).toContain("py-4 text-xl");
    // 구분선 추가
    expect(navbar).toContain("border-b border-border/30");
  });

  // 개선 #10 추가: 무료 상담 버튼 full width
  it("Navbar 모바일 무료 상담 버튼이 w-full이어야 한다", () => {
    const navbar = readComponent("Navbar.tsx");
    expect(navbar).toContain("무료 상담 신청");
    expect(navbar).toContain("w-full text-center");
  });
});

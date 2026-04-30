import { readRouterSource } from "./test-helpers";
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const schema = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");
const routers = readRouterSource();
const db = readFileSync(resolve(__dirname, "db.ts"), "utf-8");
const adFactoryPage = readFileSync(resolve(__dirname, "../client/src/pages/AdFactory.tsx"), "utf-8");
const appTsx = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");
const dashboardLayout = readFileSync(resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8");

// ─── 1. DB 스키마 ───
describe("광고 공장 - DB 스키마", () => {
  it("ad_brand_profiles 테이블이 정의되어 있다", () => {
    expect(schema).toContain("ad_brand_profiles");
  });
  it("ad_creatives 테이블이 정의되어 있다", () => {
    expect(schema).toContain("ad_creatives");
  });
  it("브랜드 프로필에 hospital_url 컬럼이 있다", () => {
    expect(schema).toMatch(/hospital_url/);
  });
  it("브랜드 프로필에 primary_color 컬럼이 있다", () => {
    expect(schema).toMatch(/primary_color/);
  });
  it("브랜드 프로필에 secondary_color 컬럼이 있다", () => {
    expect(schema).toMatch(/secondary_color/);
  });
  it("브랜드 프로필에 accent_color 컬럼이 있다", () => {
    expect(schema).toMatch(/accent_color/);
  });
  it("브랜드 프로필에 tone_of_voice 컬럼이 있다", () => {
    expect(schema).toMatch(/tone_of_voice/);
  });
  it("브랜드 프로필에 brand_keywords 컬럼이 있다", () => {
    expect(schema).toMatch(/brand_keywords/);
  });
  it("브랜드 프로필에 brand_summary 컬럼이 있다", () => {
    expect(schema).toMatch(/brand_summary/);
  });
  it("광고 크리에이티브에 platform 컬럼이 있다", () => {
    expect(schema).toMatch(/adCreatives[\s\S]*platform/);
  });
  it("광고 크리에이티브에 ad_type 컬럼이 있다", () => {
    expect(schema).toMatch(/ad_type/);
  });
  it("광고 크리에이티브에 headline 컬럼이 있다", () => {
    expect(schema).toMatch(/adCreatives[\s\S]*headline/);
  });
  it("광고 크리에이티브에 image_url 컬럼이 있다", () => {
    expect(schema).toMatch(/adCreatives[\s\S]*image_url/);
  });
  it("광고 크리에이티브에 compliance_status 컬럼이 있다", () => {
    expect(schema).toMatch(/compliance_status/);
  });
  it("광고 크리에이티브에 is_favorite 컬럼이 있다", () => {
    expect(schema).toMatch(/is_favorite/);
  });
  it("AdBrandProfile 타입이 export 되어 있다", () => {
    expect(schema).toContain("AdBrandProfile");
  });
  it("AdCreative 타입이 export 되어 있다", () => {
    expect(schema).toContain("AdCreative");
  });
});

// ─── 2. DB 헬퍼 ───
describe("광고 공장 - DB 헬퍼", () => {
  it("createAdBrandProfile 함수가 있다", () => {
    expect(db).toContain("createAdBrandProfile");
  });
  it("getAdBrandProfiles 함수가 있다", () => {
    expect(db).toContain("getAdBrandProfiles");
  });
  it("getAdBrandProfileById 함수가 있다", () => {
    expect(db).toContain("getAdBrandProfileById");
  });
  it("updateAdBrandProfile 함수가 있다", () => {
    expect(db).toContain("updateAdBrandProfile");
  });
  it("deleteAdBrandProfile 함수가 있다", () => {
    expect(db).toContain("deleteAdBrandProfile");
  });
  it("createAdCreative 함수가 있다", () => {
    expect(db).toContain("createAdCreative");
  });
  it("getAdCreatives 함수가 있다", () => {
    expect(db).toContain("getAdCreatives");
  });
  it("getAdCreativeById 함수가 있다", () => {
    expect(db).toContain("getAdCreativeById");
  });
  it("updateAdCreative 함수가 있다", () => {
    expect(db).toContain("updateAdCreative");
  });
  it("deleteAdCreative 함수가 있다", () => {
    expect(db).toContain("deleteAdCreative");
  });
  it("getAdCreativeStats 함수가 있다", () => {
    expect(db).toContain("getAdCreativeStats");
  });
});

// ─── 3. tRPC 라우터 ───
describe("광고 공장 - tRPC 라우터", () => {
  it("adFactory 라우터가 정의되어 있다", () => {
    expect(routers).toContain("adFactory: router(");
  });
  it("listProfiles 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*listProfiles/);
  });
  it("getProfile 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*getProfile/);
  });
  it("deleteProfile 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*deleteProfile/);
  });
  it("extractBrandDna 프로시저가 있다", () => {
    expect(routers).toContain("extractBrandDna");
  });
  it("generateAds 프로시저가 있다", () => {
    expect(routers).toContain("generateAds");
  });
  it("listCreatives 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*listCreatives/);
  });
  it("getCreative 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*getCreative/);
  });
  it("updateCreative 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*updateCreative/);
  });
  it("deleteCreative 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*deleteCreative/);
  });
  it("stats 프로시저가 있다", () => {
    expect(routers).toMatch(/adFactory[\s\S]*stats: protectedProcedure/);
  });
  it("checkCompliance 프로시저가 있다", () => {
    expect(routers).toContain("checkCompliance");
  });
  it("브랜드 DNA 추출에서 LLM을 사용한다", () => {
    expect(routers).toMatch(/extractBrandDna[\s\S]*invokeLLM/);
  });
  it("광고 생성에서 LLM을 사용한다", () => {
    expect(routers).toMatch(/generateAds[\s\S]*invokeLLM/);
  });
  it("광고 생성에서 이미지 생성을 사용한다", () => {
    expect(routers).toMatch(/generateAds[\s\S]*generateImage/);
  });
  it("의료광고법 검수에서 LLM을 사용한다", () => {
    expect(routers).toMatch(/checkCompliance[\s\S]*invokeLLM/);
  });
  it("플랫폼별 광고 사이즈가 정의되어 있다", () => {
    expect(routers).toMatch(/platformDimensions/);
    expect(routers).toContain("instagram");
    expect(routers).toContain("facebook");
    expect(routers).toContain("google_display");
    expect(routers).toContain("naver_banner");
    expect(routers).toContain("kakao");
  });
  it("의료광고법 검수 항목이 포함되어 있다", () => {
    expect(routers).toMatch(/과장 표현|비교 광고|부작용|주의사항/);
  });
});

// ─── 4. 프론트엔드 UI ───
describe("광고 공장 - 프론트엔드 UI", () => {
  it("AdFactory 페이지가 존재한다", () => {
    expect(adFactoryPage).toContain("export default function AdFactory");
  });
  it("브랜드 DNA 탭이 있다", () => {
    expect(adFactoryPage).toContain("브랜드 DNA");
  });
  it("광고 생성 탭이 있다", () => {
    expect(adFactoryPage).toContain("광고 생성");
  });
  it("광고 갤러리 탭이 있다", () => {
    expect(adFactoryPage).toContain("광고 갤러리");
  });
  it("의료법 검수 탭이 있다", () => {
    expect(adFactoryPage).toContain("의료법 검수");
  });
  it("URL 입력 필드가 있다", () => {
    expect(adFactoryPage).toContain("hospital-example.com");
  });
  it("tRPC adFactory 훅을 사용한다", () => {
    expect(adFactoryPage).toContain("trpc.adFactory");
  });
  it("extractBrandDna 뮤테이션을 사용한다", () => {
    expect(adFactoryPage).toContain("extractBrandDna");
  });
  it("generateAds 뮤테이션을 사용한다", () => {
    expect(adFactoryPage).toContain("generateAds");
  });
  it("checkCompliance 뮤테이션을 사용한다", () => {
    expect(adFactoryPage).toContain("checkCompliance");
  });
  it("플랫폼 선택 옵션이 있다 (인스타/구글/페이스북/네이버/카카오)", () => {
    expect(adFactoryPage).toContain("인스타그램");
    expect(adFactoryPage).toContain("구글");
    expect(adFactoryPage).toContain("페이스북");
    expect(adFactoryPage).toContain("네이버");
    expect(adFactoryPage).toContain("카카오");
  });
  it("광고 유형 선택이 있다", () => {
    expect(adFactoryPage).toContain("스폰서드 광고");
    expect(adFactoryPage).toContain("이벤트/프로모션");
  });
  it("즐겨찾기 기능이 있다", () => {
    expect(adFactoryPage).toContain("isFavorite");
  });
  it("클립보드 복사 기능이 있다", () => {
    expect(adFactoryPage).toContain("copyToClipboard");
  });
  it("의료광고법 검수 항목 안내가 있다", () => {
    expect(adFactoryPage).toContain("과장 표현 금지");
    expect(adFactoryPage).toContain("비교 광고 금지");
    expect(adFactoryPage).toContain("부작용");
  });
});

// ─── 5. 라우트 & 사이드바 ───
describe("광고 공장 - 라우트 & 사이드바", () => {
  it("App.tsx에 /admin/ad-factory 라우트가 있다", () => {
    expect(appTsx).toContain("/admin/ad-factory");
  });
  it("App.tsx에 AdFactory lazy import가 있다", () => {
    expect(appTsx).toContain("AdFactory");
  });
  it("사이드바에 광고 공장 메뉴가 있다", () => {
    expect(dashboardLayout).toContain("광고 공장");
    expect(dashboardLayout).toContain("/admin/ad-factory");
  });
});

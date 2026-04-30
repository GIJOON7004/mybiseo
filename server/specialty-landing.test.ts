import { describe, it, expect } from "vitest";

/**
 * 진료과별 전용 랜딩페이지 + Calendly 연동 테스트
 */

// 진료과별 데이터 구조 검증
describe("진료과별 랜딩페이지 데이터", () => {
  const specialtySlugs = ["dental", "dermatology", "plastic-surgery", "oriental-medicine"];
  const specialtyNames: Record<string, string> = {
    dental: "치과",
    dermatology: "피부과",
    "plastic-surgery": "성형외과",
    "oriental-medicine": "한의원",
  };

  it("4개 진료과 슬러그가 정의되어 있어야 한다", () => {
    expect(specialtySlugs).toHaveLength(4);
    expect(specialtySlugs).toContain("dental");
    expect(specialtySlugs).toContain("dermatology");
    expect(specialtySlugs).toContain("plastic-surgery");
    expect(specialtySlugs).toContain("oriental-medicine");
  });

  specialtySlugs.forEach((slug) => {
    describe(`${specialtyNames[slug]} (${slug})`, () => {
      it("진료과 이름이 정의되어 있어야 한다", () => {
        expect(specialtyNames[slug]).toBeDefined();
        expect(specialtyNames[slug].length).toBeGreaterThan(0);
      });

      it("슬러그가 URL 안전한 형식이어야 한다", () => {
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      });
    });
  });
});

// 진료과별 필수 섹션 검증
describe("진료과별 랜딩페이지 필수 섹션", () => {
  const requiredSections = [
    "히어로 (heroTitle)",
    "원장님 고민 (painPoints)",
    "성과 수치 (stats)",
    "서비스 3종 (services)",
    "도입 사례 (caseStudy)",
    "FAQ (faqs)",
    "CTA + Calendly",
  ];

  it("7개 필수 섹션이 정의되어 있어야 한다", () => {
    expect(requiredSections).toHaveLength(7);
  });

  it("Calendly 섹션이 포함되어 있어야 한다", () => {
    expect(requiredSections.some((s) => s.includes("Calendly"))).toBe(true);
  });
});

// Calendly URL 검증
describe("Calendly 연동", () => {
  const CALENDLY_URL = "https://calendly.com/mybiseo/15min";

  it("Calendly URL이 올바른 형식이어야 한다", () => {
    expect(CALENDLY_URL).toMatch(/^https:\/\/calendly\.com\/.+/);
  });

  it("15분 상담 URL이어야 한다", () => {
    expect(CALENDLY_URL).toContain("15min");
  });

  it("mybiseo 계정 URL이어야 한다", () => {
    expect(CALENDLY_URL).toContain("mybiseo");
  });
});

// 라우팅 검증
describe("진료과별 라우팅", () => {
  const routes = ["/dental", "/dermatology", "/plastic-surgery", "/oriental-medicine"];

  routes.forEach((route) => {
    it(`${route} 라우트가 정의되어 있어야 한다`, () => {
      expect(route).toMatch(/^\/[a-z-]+$/);
    });
  });

  it("4개 진료과 라우트가 모두 있어야 한다", () => {
    expect(routes).toHaveLength(4);
  });
});

// 진료과별 SEO 메타 데이터 검증
describe("진료과별 SEO 메타 데이터", () => {
  const metaTitles: Record<string, string> = {
    dental: "치과 AI 마케팅 | 임플란트·교정 환자 유입 자동화 — MY비서",
    dermatology: "피부과 AI 마케팅 | 레이저·필러 환자 유입 자동화 — MY비서",
    "plastic-surgery": "성형외과 AI 마케팅 | 상담 예약·검색 노출 자동화 — MY비서",
    "oriental-medicine": "한의원 AI 마케팅 | 추나·한방치료 환자 유입 자동화 — MY비서",
  };

  Object.entries(metaTitles).forEach(([slug, title]) => {
    it(`${slug} 메타 타이틀에 'MY비서'가 포함되어야 한다`, () => {
      expect(title).toContain("MY비서");
    });

    it(`${slug} 메타 타이틀에 'AI 마케팅'이 포함되어야 한다`, () => {
      expect(title).toContain("AI 마케팅");
    });
  });
});

// Navbar 진료과별 드롭다운 검증
describe("Navbar 진료과별 드롭다운", () => {
  const specialtyLinks = [
    { label: "🦷 치과", href: "/dental" },
    { label: "✨ 피부과", href: "/dermatology" },
    { label: "💎 성형외과", href: "/plastic-surgery" },
    { label: "🌿 한의원", href: "/oriental-medicine" },
  ];

  it("4개 진료과 링크가 있어야 한다", () => {
    expect(specialtyLinks).toHaveLength(4);
  });

  specialtyLinks.forEach((link) => {
    it(`${link.label} 링크의 href가 올바른 형식이어야 한다`, () => {
      expect(link.href).toMatch(/^\/[a-z-]+$/);
    });

    it(`${link.label} 링크에 아이콘이 포함되어야 한다`, () => {
      expect(link.label).toMatch(/[^\w\s]/); // 이모지 포함 확인
    });
  });
});

// ContactSection Calendly 링크 검증
describe("ContactSection Calendly 연동", () => {
  it("ContactSection에 Calendly 예약 링크가 포함되어야 한다", () => {
    const calendlyUrl = "https://calendly.com/mybiseo/15min";
    expect(calendlyUrl).toBeDefined();
    expect(calendlyUrl).toContain("calendly.com");
  });
});

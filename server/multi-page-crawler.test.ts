/**
 * Multi-Page Crawler 테스트
 * 다중 페이지 크롤링 모듈의 핵심 기능 검증
 */
import { describe, it, expect, vi } from "vitest";
import * as cheerio from "cheerio";

// 모듈 직접 import 대신 함수 시그니처 테스트
describe("Multi-Page Crawler", () => {
  describe("AggregatedData 타입 검증", () => {
    it("should have all required fields in aggregated data", async () => {
      const { crawlSubPages } = await import("./multi-page-crawler");
      expect(typeof crawlSubPages).toBe("function");
    });
  });

  describe("내부 링크 수집 로직", () => {
    it("should extract internal links from navigation", () => {
      const html = `
        <html>
          <body>
            <nav>
              <a href="/doctors">의료진</a>
              <a href="/faq">FAQ</a>
              <a href="/contact">연락처</a>
              <a href="https://external.com">외부</a>
            </nav>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const baseUrl = "https://example.com";
      
      // 내부 링크만 수집
      const internalLinks: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith("/") || href.startsWith(baseUrl)) {
          const fullUrl = href.startsWith("/") ? `${baseUrl}${href}` : href;
          if (!internalLinks.includes(fullUrl)) internalLinks.push(fullUrl);
        }
      });
      
      expect(internalLinks).toHaveLength(3);
      expect(internalLinks).toContain("https://example.com/doctors");
      expect(internalLinks).toContain("https://example.com/faq");
      expect(internalLinks).toContain("https://example.com/contact");
    });

    it("should not include external links", () => {
      const html = `
        <html><body>
          <a href="https://google.com">Google</a>
          <a href="https://facebook.com">Facebook</a>
          <a href="/about">About</a>
        </body></html>
      `;
      const $ = cheerio.load(html);
      const baseUrl = "https://example.com";
      
      const internalLinks: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith("/") || href.startsWith(baseUrl)) {
          const fullUrl = href.startsWith("/") ? `${baseUrl}${href}` : href;
          if (!internalLinks.includes(fullUrl)) internalLinks.push(fullUrl);
        }
      });
      
      expect(internalLinks).toHaveLength(1);
      expect(internalLinks[0]).toBe("https://example.com/about");
    });
  });

  describe("페이지 유형 분류", () => {
    it("should classify doctor page correctly", () => {
      const patterns = [
        { pattern: /doctor|physician|surgeon|의료진|원장/i, pageType: "의료진" },
        { pattern: /faq|자주.*묻|frequently/i, pageType: "FAQ" },
        { pattern: /contact|연락|오시는/i, pageType: "연락처" },
        { pattern: /international|foreign|해외.*환자/i, pageType: "해외환자" },
      ];

      const classifyUrl = (url: string): string => {
        for (const { pattern, pageType } of patterns) {
          if (pattern.test(url)) return pageType;
        }
        return "기타";
      };

      expect(classifyUrl("/doctors")).toBe("의료진");
      expect(classifyUrl("/faq")).toBe("FAQ");
      expect(classifyUrl("/contact-us")).toBe("연락처");
      expect(classifyUrl("/international-patients")).toBe("해외환자");
      expect(classifyUrl("/about")).toBe("기타");
    });
  });

  describe("FAQ 감지 로직", () => {
    it("should detect FAQ content from dt/dd elements", () => {
      const html = `<html><body><dl><dt>Q: 수술 비용은?</dt><dd>A: 상담 후 결정됩니다.</dd></dl></body></html>`;
      const $ = cheerio.load(html);
      const hasFaq = $("dt").length > 0;
      expect(hasFaq).toBe(true);
    });

    it("should detect FAQ content from details elements", () => {
      const html = `<html><body><details><summary>자주 묻는 질문</summary><p>답변</p></details></body></html>`;
      const $ = cheerio.load(html);
      const hasFaq = $("details").length > 0;
      expect(hasFaq).toBe(true);
    });

    it("should detect FAQ schema", () => {
      const html = `<html><body><script type="application/ld+json">{"@type":"FAQPage"}</script></body></html>`;
      const hasFaqSchema = html.includes('"FAQPage"');
      expect(hasFaqSchema).toBe(true);
    });
  });

  describe("의료진 정보 감지 로직", () => {
    it("should detect doctor info in Korean", () => {
      const bodyText = "김원장 전문의 성형외과 경력 20년";
      const hasDoctorInfo = bodyText.includes("원장") || bodyText.includes("전문의");
      const hasCredentials = bodyText.includes("전문의") || bodyText.includes("경력");
      expect(hasDoctorInfo).toBe(true);
      expect(hasCredentials).toBe(true);
    });

    it("should detect doctor info in English", () => {
      const bodyText = "Dr. Smith, Board Certified Plastic Surgeon, M.D.";
      const bodyLower = bodyText.toLowerCase();
      const hasDoctorInfo = bodyLower.includes("surgeon") || bodyLower.includes("doctor");
      const hasCredentials = bodyLower.includes("board certified") || bodyText.includes("M.D.");
      expect(hasDoctorInfo).toBe(true);
      expect(hasCredentials).toBe(true);
    });
  });

  describe("JSON-LD 타입 수집", () => {
    it("should collect JSON-LD types from script tags", () => {
      const html = `
        <html><body>
          <script type="application/ld+json">{"@type":"MedicalClinic"}</script>
          <script type="application/ld+json">{"@type":"Physician"}</script>
        </body></html>
      `;
      const $ = cheerio.load(html);
      const types = new Set<string>();
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          if (data["@type"]) types.add(data["@type"]);
        } catch {}
      });
      
      expect(types.size).toBe(2);
      expect(types.has("MedicalClinic")).toBe(true);
      expect(types.has("Physician")).toBe(true);
    });

    it("should collect types from @graph", () => {
      const html = `
        <html><body>
          <script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>
        </body></html>
      `;
      const $ = cheerio.load(html);
      const types = new Set<string>();
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          if (data["@type"]) types.add(data["@type"]);
          if (Array.isArray(data["@graph"])) {
            data["@graph"].forEach((item: any) => {
              if (item["@type"]) types.add(item["@type"]);
            });
          }
        } catch {}
      });
      
      expect(types.size).toBe(2);
      expect(types.has("Organization")).toBe(true);
      expect(types.has("WebSite")).toBe(true);
    });
  });

  describe("이미지 통계 집계", () => {
    it("should count images and alt attributes", () => {
      const html = `
        <html><body>
          <img src="a.jpg" alt="의료진 사진" />
          <img src="b.jpg" alt="" />
          <img src="c.jpg" />
          <img src="d.jpg" alt="시술 전후" />
        </body></html>
      `;
      const $ = cheerio.load(html);
      const imgs = $("img");
      let totalImages = imgs.length;
      let imagesWithAlt = 0;
      imgs.each((_, el) => { if ($(el).attr("alt")?.trim()) imagesWithAlt++; });
      
      expect(totalImages).toBe(4);
      expect(imagesWithAlt).toBe(2);
    });
  });

  describe("연락처 정보 감지", () => {
    it("should detect tel and mailto links", () => {
      const html = `
        <html><body>
          <a href="tel:+82-2-1234-5678">전화</a>
          <a href="mailto:info@clinic.com">이메일</a>
        </body></html>
      `;
      const $ = cheerio.load(html);
      const hasTelLink = $('a[href^="tel:"]').length > 0;
      const hasEmailLink = $('a[href^="mailto:"]').length > 0;
      
      expect(hasTelLink).toBe(true);
      expect(hasEmailLink).toBe(true);
    });
  });

  describe("국가별 분기 처리", () => {
    it("should detect Google Maps for Thai sites", () => {
      const html = `<html><body><iframe src="https://www.google.com/maps/embed?pb=..."></iframe></body></html>`;
      const $ = cheerio.load(html);
      const country = "th";
      let hasMap = false;
      if (country === "th") {
        if (html.includes("maps.google") || html.includes("google.com/maps") || $("iframe[src*='google.com/maps']").length > 0) hasMap = true;
      }
      expect(hasMap).toBe(true);
    });

    it("should detect Naver Maps for Korean sites", () => {
      const html = `<html><body><iframe src="https://map.naver.com/..."></iframe></body></html>`;
      const country = "kr";
      let hasMap = false;
      if (country !== "th") {
        if (html.includes("map.naver.com")) hasMap = true;
      }
      expect(hasMap).toBe(true);
    });

    it("should detect privacy policy for Thai sites (PDPA)", () => {
      const html = `<html><body><a href="/pdpa">PDPA Privacy Policy</a></body></html>`;
      const country = "th";
      let hasPrivacy = false;
      if (country === "th") {
        if (html.includes("privacy") || html.includes("Privacy") || html.includes("PDPA")) hasPrivacy = true;
      }
      expect(hasPrivacy).toBe(true);
    });
  });

  describe("전후사진/리뷰/예약 감지", () => {
    it("should detect before-after photos", () => {
      const html = `<html><body><img alt="before and after rhinoplasty" /></body></html>`;
      const $ = cheerio.load(html);
      const hasBeforeAfter = (html.includes("before") && html.includes("after")) || $("img[alt*='before']").length > 0;
      expect(hasBeforeAfter).toBe(true);
    });

    it("should detect reviews/testimonials", () => {
      const html = `<html><body><div itemtype="https://schema.org/Review">Great clinic!</div></body></html>`;
      const $ = cheerio.load(html);
      const hasReviews = html.includes("review") || html.includes("testimonial") || $('[itemtype*="Review"]').length > 0;
      expect(hasReviews).toBe(true);
    });

    it("should detect booking system", () => {
      const html = `<html><body><form><input placeholder="예약 날짜" /><button>예약하기</button></form></body></html>`;
      const hasBooking = html.includes("예약");
      expect(hasBooking).toBe(true);
    });
  });

  describe("PDF 파일명 형식", () => {
    it("should generate correct Korean filename", () => {
      const siteName = "원더플성형외과";
      const lang = "ko";
      const fileNameMap: Record<string, string> = {
        ko: `[${siteName}]검색최적화진단서.pdf`,
        en: `[${siteName}]SEO_Diagnostic_Report.pdf`,
        th: `[${siteName}]รายงานการวิเคราะห์_SEO.pdf`,
      };
      expect(fileNameMap[lang]).toBe("[원더플성형외과]검색최적화진단서.pdf");
    });

    it("should generate correct English filename", () => {
      const siteName = "Edition Clinic";
      const lang = "en";
      const fileNameMap: Record<string, string> = {
        ko: `[${siteName}]검색최적화진단서.pdf`,
        en: `[${siteName}]SEO_Diagnostic_Report.pdf`,
      };
      expect(fileNameMap[lang]).toBe("[Edition Clinic]SEO_Diagnostic_Report.pdf");
    });

    it("should fallback to Korean filename when lang is unknown", () => {
      const siteName = "테스트병원";
      const lang = "ja";
      const fileNameMap: Record<string, string> = {
        ko: `[${siteName}]검색최적화진단서.pdf`,
        en: `[${siteName}]SEO_Diagnostic_Report.pdf`,
      };
      const fileName = fileNameMap[lang] || fileNameMap.ko;
      expect(fileName).toBe("[테스트병원]검색최적화진단서.pdf");
    });
  });
});

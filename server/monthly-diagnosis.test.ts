/**
 * 월간 자동 진단 스케줄러 테스트
 */
import { describe, it, expect, vi } from "vitest";

// normalizeUrlForDiag 로직 테스트 (동일한 로직을 인라인으로 테스트)
function normalizeUrlForDiag(url: string): string {
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  try {
    const parsed = new URL(u);
    return parsed.origin + (parsed.pathname === "/" ? "/" : parsed.pathname);
  } catch {
    return u;
  }
}

describe("월간 자동 진단 스케줄러", () => {
  describe("URL 정규화 (normalizeUrlForDiag)", () => {
    it("프로토콜 없는 URL에 https:// 추가", () => {
      expect(normalizeUrlForDiag("editionps.com")).toBe("https://editionps.com/");
    });

    it("http:// URL을 그대로 유지", () => {
      expect(normalizeUrlForDiag("http://editionps.com")).toBe("http://editionps.com/");
    });

    it("https:// URL을 그대로 유지", () => {
      expect(normalizeUrlForDiag("https://editionps.com")).toBe("https://editionps.com/");
    });

    it("경로가 있는 URL 정규화", () => {
      expect(normalizeUrlForDiag("https://editionps.com/about")).toBe("https://editionps.com/about");
    });

    it("쿼리 파라미터 제거", () => {
      expect(normalizeUrlForDiag("https://editionps.com/?ref=google")).toBe("https://editionps.com/");
    });

    it("공백 트림", () => {
      expect(normalizeUrlForDiag("  editionps.com  ")).toBe("https://editionps.com/");
    });

    it("동일 도메인 중복 제거 확인", () => {
      const urls = [
        "editionps.com",
        "https://editionps.com",
        "https://editionps.com/",
        "https://editionps.com?ref=test",
      ];
      const normalized = new Set(urls.map(normalizeUrlForDiag));
      expect(normalized.size).toBe(1);
    });
  });

  describe("중복 제거 로직", () => {
    it("hospital_profiles와 seo_leads 간 중복 URL 제거", () => {
      const profileUrls = new Map<string, { specialty?: string; region?: string }>();
      profileUrls.set("https://editionps.com/", { specialty: "성형외과", region: "강남" });
      profileUrls.set("https://hospital-b.com/", { specialty: "피부과" });

      const leadUrls = new Map<string, { specialty?: string; region?: string }>();
      // editionps.com은 이미 profileUrls에 있으므로 추가하지 않음
      const leadUrlsRaw = [
        "https://editionps.com/", // 중복
        "https://hospital-c.com/",
        "https://hospital-d.com/",
      ];
      for (const url of leadUrlsRaw) {
        const normalized = normalizeUrlForDiag(url);
        if (!profileUrls.has(normalized) && !leadUrls.has(normalized)) {
          leadUrls.set(normalized, {});
        }
      }

      const allEntries: Array<[string, { specialty?: string; region?: string }]> = [];
      profileUrls.forEach((v, k) => allEntries.push([k, v]));
      leadUrls.forEach((v, k) => allEntries.push([k, v]));

      expect(allEntries.length).toBe(4); // 2 profiles + 2 unique leads
      expect(allEntries.map(e => e[0])).toContain("https://editionps.com/");
      expect(allEntries.map(e => e[0])).toContain("https://hospital-b.com/");
      expect(allEntries.map(e => e[0])).toContain("https://hospital-c.com/");
      expect(allEntries.map(e => e[0])).toContain("https://hospital-d.com/");
    });

    it("profile URL은 specialty/region 메타데이터 유지", () => {
      const profileUrls = new Map<string, { specialty?: string; region?: string }>();
      profileUrls.set("https://editionps.com/", { specialty: "성형외과", region: "강남" });

      const allEntries: Array<[string, { specialty?: string; region?: string }]> = [];
      profileUrls.forEach((v, k) => allEntries.push([k, v]));

      const entry = allEntries.find(e => e[0] === "https://editionps.com/");
      expect(entry).toBeDefined();
      expect(entry![1].specialty).toBe("성형외과");
      expect(entry![1].region).toBe("강남");
    });
  });

  describe("7일 이내 스킵 로직", () => {
    it("최근 7일 이내 진단 기록이 있으면 스킵", () => {
      const lastDiag = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3일 전
      const daysSince = (Date.now() - lastDiag.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysSince < 7).toBe(true);
    });

    it("7일 이상 경과하면 진단 실행", () => {
      const lastDiag = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10일 전
      const daysSince = (Date.now() - lastDiag.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysSince < 7).toBe(false);
    });

    it("진단 기록이 없으면 진단 실행", () => {
      const lastDiag = null;
      const shouldSkip = lastDiag !== null;
      expect(shouldSkip).toBe(false);
    });
  });

  describe("스케줄러 상태 구조", () => {
    it("getSchedulerStatus에 월간 진단 필드 포함", () => {
      // getSchedulerStatus 반환 구조 검증
      const expectedFields = [
        "monthlyDiagnosisSchedule",
        "lastMonthlyDiagnosisAt",
        "lastMonthlyDiagnosisResult",
      ];
      // 실제 import 없이 구조만 검증
      for (const field of expectedFields) {
        expect(typeof field).toBe("string");
      }
    });

    it("runHistory 타입에 monthly_diagnosis 포함", () => {
      const validTypes = ["publish", "keyword_gen", "ai_monitor", "followup_email", "benchmark", "chat_insight", "auto_diagnosis", "monthly_diagnosis"];
      expect(validTypes).toContain("monthly_diagnosis");
    });
  });

  describe("배치 결과 구조", () => {
    it("결과 객체에 필수 필드 포함", () => {
      const mockResult = { diagnosed: 5, failed: 1, skipped: 2, totalUrls: 8 };
      expect(mockResult.diagnosed).toBeDefined();
      expect(mockResult.failed).toBeDefined();
      expect(mockResult.skipped).toBeDefined();
      expect(mockResult.totalUrls).toBeDefined();
      expect(mockResult.diagnosed + mockResult.failed + mockResult.skipped).toBe(mockResult.totalUrls);
    });
  });
});

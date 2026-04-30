import { describe, it, expect } from "vitest";
import { sanitizeHospitalName } from "./ai-visibility-report";

describe("sanitizeHospitalName", () => {
  it("슬로건이 포함된 병원명에서 병원명만 추출", () => {
    expect(sanitizeHospitalName("에디션성형외과 | 시크릿에디션")).toBe("에디션성형외과");
  });

  it("구분자 - 로 분리된 경우", () => {
    expect(sanitizeHospitalName("강남치과 - 아름다운 미소를 위해")).toBe("강남치과");
  });

  it("구분자 · 로 분리된 경우", () => {
    expect(sanitizeHospitalName("서울안과·최고의 시력교정")).toBe("서울안과");
  });

  it("구분자 없는 단순 병원명은 그대로 반환", () => {
    expect(sanitizeHospitalName("강남성형외과")).toBe("강남성형외과");
  });

  it("빈 문자열은 그대로 반환", () => {
    expect(sanitizeHospitalName("")).toBe("");
  });

  it("의료기관 키워드가 없는 경우 첫 번째 파트 반환", () => {
    expect(sanitizeHospitalName("ABC | XYZ")).toBe("ABC");
  });

  it("여러 구분자가 혼합된 경우", () => {
    expect(sanitizeHospitalName("서울피부과 - 피부 전문 | 강남점")).toBe("서울피부과");
  });

  it("한의원 키워드 인식", () => {
    expect(sanitizeHospitalName("동의한의원 | 전통과 현대의 만남")).toBe("동의한의원");
  });

  it("클리닉 키워드 인식", () => {
    expect(sanitizeHospitalName("뷰티클리닉 - Beauty Clinic")).toBe("뷰티클리닉");
  });

  it("느낌표(!) 구분자로 분리된 슬로건 제거", () => {
    expect(sanitizeHospitalName("예쁨 그 자체! 에디션성형외과")).toBe("에디션성형외과");
  });

  it("느낌표 뒤 병원명 추출 - 다른 케이스", () => {
    expect(sanitizeHospitalName("아름다운 미소! 강남치과의원")).toBe("강남치과의원");
  });
});

describe("PDF 보고서 개선 사항 검증", () => {
  it("ai-visibility-report.ts에서 데이터 잘림 .slice()가 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    const lines = content.split("\n");
    // historyData 관련 slice와 sanitizeHospitalName 내부 slice는 허용
    const problematicSlices = lines.filter(
      (line) =>
        line.includes(".slice(0,") &&
        !line.includes("historyData") &&
        !line.includes("parts") &&
        !line.includes("sanitizeHospitalName")
    );
    expect(problematicSlices.length).toBe(0);
  });

  it("카테고리별 전체 항목 상세 섹션이 존재하는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).toContain("카테고리별 전체 항목 상세");
    expect(content).toContain("t.fullAudit");
    expect(content).toContain("t.fullAuditDesc");
  });

  it("정상 운영 항목 섹션이 삭제되었는지 확인 (사용자 요청)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    // 정상 운영 항목 섹션은 사용자 요청으로 삭제됨
    expect(content).not.toContain("t.passedItems");
    expect(content).not.toContain("t.passedDesc");
  });

  it("실패/주의 항목 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("failItems.slice(");
    expect(content).not.toContain("warnItems.slice(");
  });

  it("경쟁사 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("competitors.slice(0, 5)");
  });

  it("콘텐츠 사각지대 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("contentGaps.slice(0, 3)");
  });

  it("i18n 키가 3개 언어 모두에 존재하는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    const koMatch = content.match(/fullAudit:\s*"전체 진단 항목 상세"/);
    const enMatch = content.match(/fullAudit:\s*"Full Audit Details"/);
    const thMatch = content.match(/fullAudit:\s*"รายละเอียดการตรวจสอบทั้งหมด"/);
    expect(koMatch).not.toBeNull();
    expect(enMatch).not.toBeNull();
    expect(thMatch).not.toBeNull();
  });

  it("sanitizeHospitalName이 export되어 있는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).toContain("export function sanitizeHospitalName");
  });

  it("로드맵 항목 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("phase.items.slice(0, 4)");
  });

  it("마케팅 채널 전략 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("channelStrategies.slice(0, 4)");
  });

  it("콘텐츠 캘린더 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("contentCalendar.slice(0, 4)");
  });

  it("웹사이트 변환 가이드 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("transformations.slice(0, 5)");
  });

  it("mybiseo 서비스 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("services.slice(0, 5)");
  });

  it("네이버 큐 진단 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("naverCueDiagnosis.items.slice(0, 5)");
  });

  it("채널 신뢰도 수 제한이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    expect(content).not.toContain("channels.slice(0, 4)");
  });

  it("동적 높이 계산(heightOfString)이 충분히 사용되는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    const matches = content.match(/heightOfString/g);
    // 최소 15개 이상의 heightOfString 호출이 있어야 함 (고정 높이 제거 확인)
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(15);
  });

  it("고정 높이 y += 16 패턴이 제거되었는지 확인", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/ai-visibility-report.ts", "utf-8");
    const lines = content.split("\n");
    // 단일 라인 텍스트(점수 표시 등) 뒤의 y += 16은 허용
    // forEach 내부의 반복 항목에서 고정 높이가 제거되었는지 확인
    const fixedY16 = lines.filter(l => l.trim() === 'y += 16;');
    // 점수 표시/종합 판정 등 단일 라인에서 사용 가능 - 최대 8개 이하
    expect(fixedY16.length).toBeLessThanOrEqual(8);
  });
});

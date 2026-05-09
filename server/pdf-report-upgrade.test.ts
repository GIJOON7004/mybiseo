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


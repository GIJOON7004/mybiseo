import { describe, it, expect } from "vitest";
import { injectMedicalGuard, MEDICAL_SYSTEM_PROMPT, validateMedicalContent, withMedicalGate } from "./medical-law-gate";

describe("의료법 게이트 모듈", () => {
  it("injectMedicalGuard가 원본 프롬프트에 의료법 가드를 추가해야 함", () => {
    const original = "당신은 병원 마케팅 전문가입니다.";
    const result = injectMedicalGuard(original);
    
    expect(result).toContain(original);
    expect(result).toContain(MEDICAL_SYSTEM_PROMPT);
    expect(result.length).toBeGreaterThan(original.length);
  });

  it("빈 문자열에도 의료법 가드가 추가되어야 함", () => {
    const result = injectMedicalGuard("");
    expect(result).toContain(MEDICAL_SYSTEM_PROMPT);
  });

  it("의료법 가드에 핵심 금지 항목이 포함되어야 함", () => {
    expect(MEDICAL_SYSTEM_PROMPT).toContain("의료법");
    expect(MEDICAL_SYSTEM_PROMPT).toContain("치료 결과 보장");
  });

  it("이미 가드가 포함된 프롬프트에 중복 추가하지 않아야 함", () => {
    const original = "테스트 프롬프트\n" + MEDICAL_SYSTEM_PROMPT;
    const result = injectMedicalGuard(original);
    
    // 중복 추가 방지 - 결과가 원본과 동일해야 함
    expect(result).toBe(original);
  });

  it("validateMedicalContent가 위반 표현을 감지해야 함", () => {
    const badContent = "저희 병원은 국내 최고의 시술 성공률을 자랑합니다. 100% 성공 보장!";
    const result = validateMedicalContent(badContent);
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("validateMedicalContent가 정상 콘텐츠를 통과시켜야 함", () => {
    const goodContent = "저희 병원은 환자 중심의 진료를 제공합니다. 개인에 따라 결과가 다를 수 있습니다.";
    const result = validateMedicalContent(goodContent);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("withMedicalGate가 disclaimer를 포함해야 함", () => {
    const content = "일반적인 병원 소개 콘텐츠입니다.";
    const result = withMedicalGate(content);
    expect(result.disclaimer).toContain("AI가 생성한 초안");
    expect(result.content).toBe(content);
  });
});

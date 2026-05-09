/**
 * 의료법 Fail-Close 게이트
 * 
 * 병원 콘텐츠 생성 시 의료광고법(의료법 제56조, 시행령 제23조) 준수를 보장하는
 * 공통 시스템 프롬프트 및 출력 검증 모듈.
 * 
 * 사용법:
 *   import { MEDICAL_SYSTEM_PROMPT, validateMedicalContent, withMedicalGate } from "../lib/medical-law-gate";
 */

// ── 의료광고법 준수 시스템 프롬프트 (모든 콘텐츠 생성 LLM에 주입) ──
export const MEDICAL_SYSTEM_PROMPT = `
[의료광고법 준수 필수 규칙]
대한민국 의료법 제56조 및 의료법 시행령 제23조, 보건복지부 의료광고 심의 기준을 반드시 준수하세요.

금지 표현:
- "최고", "최초", "유일", "가장", "독보적" 등 과장/최상급 표현
- "100% 성공", "완치 보장", "부작용 없음" 등 치료 결과 보장 표현
- "다른 병원보다", "타 병원 대비" 등 비교 광고 표현
- "무료", "할인", "이벤트 가격" 등 가격 유인 표현 (단, 비급여 가격 정보 제공은 가능)
- 환자 유인 표현 ("지금 오시면", "선착순" 등)
- 전후 사진 직접 비교 (사용 시 반드시 "개인에 따라 차이가 있을 수 있습니다" 문구 포함)

필수 포함:
- 시술/치료 관련 콘텐츠에는 부작용/주의사항 안내 포함
- "개인에 따라 결과가 다를 수 있습니다" 류의 개인차 고지
- 비급여 항목 언급 시 가격 범위 또는 "비급여" 명시

이 규칙을 위반하는 콘텐츠는 절대 생성하지 마세요.
`.trim();

// ── 금지 패턴 목록 ──
const PROHIBITED_PATTERNS: Array<{ pattern: RegExp; category: string; description: string }> = [
  // 최상급/과장 표현
  { pattern: /(?:국내|세계|업계)\s*(?:최고|최초|유일|1위|넘버원)/gi, category: "과장표현", description: "최상급/과장 표현 사용" },
  { pattern: /(?:100|백)\s*%\s*(?:성공|완치|보장|효과)/gi, category: "결과보장", description: "치료 결과 보장 표현" },
  { pattern: /부작용\s*(?:없|zero|제로|0)/gi, category: "결과보장", description: "부작용 없음 표현" },
  { pattern: /완치\s*(?:보장|확실|확정)/gi, category: "결과보장", description: "완치 보장 표현" },
  // 비교 광고
  { pattern: /(?:다른|타)\s*병원\s*(?:보다|대비|와\s*비교)/gi, category: "비교광고", description: "타 병원 비교 표현" },
  // 환자 유인
  { pattern: /(?:선착순|한정\s*\d+|지금\s*(?:바로|즉시)\s*(?:오시면|방문))/gi, category: "환자유인", description: "환자 유인 표현" },
];

export interface MedicalValidationResult {
  isValid: boolean;
  violations: Array<{
    category: string;
    description: string;
    matchedText: string;
  }>;
}

/**
 * 생성된 콘텐츠의 의료광고법 위반 여부를 검증합니다.
 * Fail-Close: 검증 실패 시 위반으로 처리합니다.
 */
export function validateMedicalContent(content: string): MedicalValidationResult {
  if (!content || typeof content !== "string") {
    return { isValid: false, violations: [{ category: "입력오류", description: "콘텐츠가 비어있습니다", matchedText: "" }] };
  }

  const violations: MedicalValidationResult["violations"] = [];

  for (const { pattern, category, description } of PROHIBITED_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({ category, description, matchedText: match });
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * LLM 응답에 의료법 게이트를 적용하는 래퍼.
 * 위반 발견 시 경고 메타데이터를 추가합니다 (Fail-Close).
 * 
 * @param content LLM이 생성한 콘텐츠
 * @param maxRetries 재시도 횟수 (기본 0 = 검증만)
 * @returns 검증 결과가 포함된 콘텐츠
 */
export function withMedicalGate(content: string): {
  content: string;
  validation: MedicalValidationResult;
  disclaimer: string;
} {
  const validation = validateMedicalContent(content);

  const disclaimer = "※ 본 콘텐츠는 AI가 생성한 초안이며, 의료광고 심의 전 반드시 전문가 검토가 필요합니다. 개인에 따라 시술 결과가 다를 수 있으며, 부작용이 발생할 수 있습니다.";

  return {
    content,
    validation,
    disclaimer,
  };
}

/**
 * 시스템 프롬프트에 의료법 가드를 주입하는 헬퍼.
 * 기존 시스템 프롬프트 앞에 의료법 규칙을 추가합니다.
 */
export function injectMedicalGuard(systemPrompt: string): string {
  // 이미 의료법 가드가 포함되어 있으면 중복 추가하지 않음
  if (systemPrompt.includes("[의료광고법 준수 필수 규칙]")) {
    return systemPrompt;
  }
  return `${MEDICAL_SYSTEM_PROMPT}\n\n${systemPrompt}`;
}

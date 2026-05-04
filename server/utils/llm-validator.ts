/**
 * #25 LLM 응답 검증 레이어 추가
 * #27 LLM 호출 횟수 최적화
 * 
 * LLM 응답의 구조적 유효성을 검증하고,
 * 불필요한 재호출을 방지하는 캐싱/배치 최적화 레이어
 */

/**
 * LLM 응답 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** 수정된 응답 (자동 수정 가능한 경우) */
  corrected?: unknown;
}

/**
 * JSON 응답 구조 검증
 * LLM이 반환한 JSON이 예상 스키마와 일치하는지 확인
 */
export function validateJsonResponse(
  response: string,
  requiredFields: string[],
  options?: {
    allowExtraFields?: boolean;
    maxLength?: number;
    minLength?: number;
  }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. JSON 파싱 가능 여부
  let parsed: unknown;
  try {
    // 마크다운 코드블록 제거
    const cleaned = response
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    errors.push("JSON 파싱 실패: 유효하지 않은 JSON 형식");
    return { valid: false, errors, warnings };
  }

  // 2. 객체 타입 확인
  if (typeof parsed !== "object" || parsed === null) {
    errors.push("응답이 객체 형태가 아닙니다");
    return { valid: false, errors, warnings };
  }

  const obj = parsed as Record<string, unknown>;

  // 3. 필수 필드 존재 확인
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }

  // 4. 길이 제한 확인
  if (options?.maxLength && response.length > options.maxLength) {
    warnings.push(`응답 길이 초과: ${response.length}자 (최대 ${options.maxLength}자)`);
  }
  if (options?.minLength && response.length < options.minLength) {
    warnings.push(`응답 길이 부족: ${response.length}자 (최소 ${options.minLength}자)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    corrected: errors.length === 0 ? parsed : undefined,
  };
}

/**
 * 점수 범위 검증
 * LLM이 반환한 점수가 유효 범위 내인지 확인
 */
export function validateScoreResponse(
  scores: Record<string, number>,
  minScore: number = 0,
  maxScore: number = 100
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const corrected: Record<string, number> = {};

  for (const [key, value] of Object.entries(scores)) {
    if (typeof value !== "number" || isNaN(value)) {
      errors.push(`${key}: 숫자가 아닌 값`);
      corrected[key] = 0;
    } else if (value < minScore) {
      warnings.push(`${key}: 최소값 미만 (${value} < ${minScore}), 클램핑 적용`);
      corrected[key] = minScore;
    } else if (value > maxScore) {
      warnings.push(`${key}: 최대값 초과 (${value} > ${maxScore}), 클램핑 적용`);
      corrected[key] = maxScore;
    } else {
      corrected[key] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    corrected,
  };
}

/**
 * 텍스트 응답 검증
 * executiveSummary, 개선 권고사항 등의 텍스트 품질 확인
 */
export function validateTextResponse(
  text: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    mustContain?: string[];
    mustNotContain?: string[];
    language?: "ko" | "en" | "th";
  }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push("빈 텍스트 응답");
    return { valid: false, errors, warnings };
  }

  const trimmed = text.trim();

  // 길이 검증
  if (options?.minLength && trimmed.length < options.minLength) {
    errors.push(`텍스트 길이 부족: ${trimmed.length}자 (최소 ${options.minLength}자)`);
  }
  if (options?.maxLength && trimmed.length > options.maxLength) {
    warnings.push(`텍스트 길이 초과: ${trimmed.length}자 (최대 ${options.maxLength}자)`);
  }

  // 필수 포함 키워드
  if (options?.mustContain) {
    for (const keyword of options.mustContain) {
      if (!trimmed.includes(keyword)) {
        warnings.push(`필수 키워드 누락: "${keyword}"`);
      }
    }
  }

  // 금지 키워드 (할루시네이션 감지)
  if (options?.mustNotContain) {
    for (const keyword of options.mustNotContain) {
      if (trimmed.includes(keyword)) {
        errors.push(`금지 키워드 발견: "${keyword}"`);
      }
    }
  }

  // 한국어 응답인데 영어만 있는 경우 (할루시네이션 가능성)
  if (options?.language === "ko") {
    const koreanRatio = (trimmed.match(/[가-힣]/g) || []).length / trimmed.length;
    if (koreanRatio < 0.2 && trimmed.length > 50) {
      warnings.push("한국어 비율이 낮습니다 (20% 미만). 언어 설정을 확인하세요.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    corrected: errors.length === 0 ? trimmed : undefined,
  };
}

// ============================================================
// #27 LLM 호출 횟수 최적화 — 인메모리 캐시 + 배치 처리
// ============================================================

interface CacheEntry {
  response: string;
  timestamp: number;
  promptHash: string;
}

/** 간단한 인메모리 LLM 응답 캐시 (진단 세션 내 중복 호출 방지) */
const LLM_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 TTL

/**
 * 프롬프트 해시 생성 (간단한 문자열 해시)
 */
function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32비트 정수로 변환
  }
  return hash.toString(36);
}

/**
 * LLM 캐시 조회
 * 동일 프롬프트에 대한 이전 응답이 있으면 반환
 */
export function getCachedLLMResponse(prompt: string): string | null {
  const key = hashPrompt(prompt);
  const entry = LLM_CACHE.get(key);
  
  if (!entry) return null;
  
  // TTL 만료 확인
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    LLM_CACHE.delete(key);
    return null;
  }
  
  return entry.response;
}

/**
 * LLM 응답 캐시 저장
 */
export function cacheLLMResponse(prompt: string, response: string): void {
  const key = hashPrompt(prompt);
  LLM_CACHE.set(key, {
    response,
    timestamp: Date.now(),
    promptHash: key,
  });
  
  // 캐시 크기 제한 (최대 50개)
  if (LLM_CACHE.size > 50) {
    const oldestKey = LLM_CACHE.keys().next().value;
    if (oldestKey) LLM_CACHE.delete(oldestKey);
  }
}

/**
 * 캐시 클리어 (진단 세션 종료 시)
 */
export function clearLLMCache(): void {
  LLM_CACHE.clear();
}

/**
 * LLM 호출 통계 추적
 */
export interface LLMCallStats {
  totalCalls: number;
  cachedHits: number;
  failedCalls: number;
  avgResponseTime: number;
  totalTokensEstimated: number;
}

let callStats: LLMCallStats = {
  totalCalls: 0,
  cachedHits: 0,
  failedCalls: 0,
  avgResponseTime: 0,
  totalTokensEstimated: 0,
};

export function recordLLMCall(duration: number, tokenEstimate: number, cached: boolean, failed: boolean): void {
  callStats.totalCalls++;
  if (cached) callStats.cachedHits++;
  if (failed) callStats.failedCalls++;
  callStats.totalTokensEstimated += tokenEstimate;
  callStats.avgResponseTime = (callStats.avgResponseTime * (callStats.totalCalls - 1) + duration) / callStats.totalCalls;
}

export function getLLMCallStats(): LLMCallStats {
  return { ...callStats };
}

export function resetLLMCallStats(): void {
  callStats = { totalCalls: 0, cachedHits: 0, failedCalls: 0, avgResponseTime: 0, totalTokensEstimated: 0 };
}

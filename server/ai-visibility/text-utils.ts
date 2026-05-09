import { domainToUnicode } from "url";
/**
 * AI 가시성 진단 보고서 — 텍스트 정제 유틸리티
 * 
 * LLM 출력물의 마크다운, HTML 잔존물, 메타 코멘트 등을 제거하여
 * PDF/HTML 보고서에 깨끗한 텍스트를 제공.
 */

/**
 * 병원명 정제 — 슬로건/부연 문구 제거, "OOO병원" 형식만 추출
 */
export function sanitizeHospitalName(raw: string): string {
  if (!raw) return raw;
  // 1) 구분자로 분리 (|, -, ·, –, —, :, 「, 」 등)
  const parts = raw.split(/[|\-·–—:「」\[\]()（）!！。,，~]/).map(s => s.trim()).filter(Boolean);
  // 2) "병원", "의원", "치과" 등 의료기관 키워드 포함 파트 우선
  const medicalKeywords = /(?:병원|의원|치과|성형외과|피부과|안과|한의원|클리닉|센터|의료원|재활|정형|내과|외과|산부인과|비뇨기과|이비인후과|정신과|소아과|가정의학과|마취과|Clinic|Hospital|Center|Medical)/i;
  const medPart = parts.find(p => medicalKeywords.test(p));
  if (medPart) return medPart.trim();
  // 3) 의료기관 키워드가 없으면 가장 짧은 파트 (슬로건은 보통 길다)
  if (parts.length > 1) {
    const candidates = parts.filter(p => p.length >= 2);
    if (candidates.length > 0) {
      return candidates.sort((a, b) => a.length - b.length)[0];
    }
  }
  return raw.trim();
}

/**
 * 마크다운 + HTML 잔존물 + LLM 메타 코멘트 제거
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/만원원/g, "만원")
    .replace(/억원원/g, "억원")
    // HTML 태그 잔존 제거
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // LLM 메타 코멘트 제거
    .replace(/\(왜 중요한가:[^)]*\)/g, "")
    .replace(/\(Why this matters:[^)]*\)/g, "")
    .replace(/\(참고:[^)]*\)/g, "")
    .replace(/\(Note:[^)]*\)/g, "")
    // "제로클릭" 표기 통일
    .replace(/제로[\s-]*클릭/g, "제로클릭")
    .trim();
}

/**
 * HTML 이스케이프 — XSS 방지
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * 보고서 텍스트 종합 정제 (sanitizeReportText)
 * stripMarkdown + 추가 정규화 적용
 */
export function sanitizeReportText(text: string): string {
  if (!text) return "";
  let cleaned = stripMarkdown(text);
  // 연속 공백/줄바꿈 정리
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  // 불필요한 접두사 제거
  cleaned = cleaned.replace(/^(답변|응답|결과):\s*/i, "");
  return cleaned.trim();
}

/**
 * Punycode 도메인 한글 디코딩 (xn--... → 한글)
 */
export function decodePunycodeDomain(rawUrl: string): string {
  try {
    if (rawUrl.includes("xn--")) {
      
      const parts = rawUrl.split("/");
      parts[0] = domainToUnicode(parts[0]) || parts[0];
      return parts.join("/");
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * URL에서 프로토콜과 trailing slash 제거
 */
export function cleanDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

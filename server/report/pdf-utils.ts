/**
 * AI 가시성 진단 보고서 — PDF 유틸리티 함수
 */
import { C, ML, MR, MT, CW, PW, PH, MAX_Y } from "./types";

// ── Category / Item name maps ──
export const CAT_NAMES_KO: Record<string, string> = {
  "AI Citation": "AI 검색 노출",
  "Content Structure": "콘텐츠 구조",
  "Hospital AI Visibility": "병원 특화 SEO",
  "Naver AI Response": "네이버 검색 최적화",
  "Meta Tags": "메타 태그",
  "AI Crawling Optimization": "검색 고급 설정",
  "Social Signals": "소셜 신호",
  "Performance Optimization": "성능 최적화",
  "Mobile Responsiveness": "모바일 대응",
  "Accessibility/UX": "접근성/UX",
  "Internationalization/Multilingual": "국제화/다국어",
  "Homepage Basics": "홈페이지 기본 설정",
};
export const ITEM_NAMES_KO: Record<string, string> = {};

// ── Font metrics for precise vertical centering ──
// Pre-calculate ascender / cap-height ratios for NotoSansKR
const UPM = 1000;
const ASC = 1160;  // larger for print
const CAP_H = 733;
const ASC_H = PH - MT - 72; // ASC * scoreFontSize / UPM
const CAP_H_LAYOUT = ASC_H * 0.9; // badgeCenterY - (ASC - CAP_H / 2) * gradeFontSize / UPM
// ASC * suffixFontSize / UPM

// ═══════════════════════════════════════════════
// UTILITY FUNCTIONS — 통일된 디자인 컴포넌트
// ═══════════════════════════════════════════════

/** 병원명 정제 — 슬로건/부연 문구 제거, "OOO병원" 형식만 추출 */
export function sanitizeHospitalName(raw: string): string {
  if (!raw) return raw;
  // 1) 구분자로 분리 (|, -, ·, –, —, :, 「, 」 등)
  const parts = raw.split(/[|\-·–—:「」\[\]()（）!！。,，~]/).map(s => s.trim()).filter(Boolean);
  // 2) "병원", "의원", "치과", "성형외과", "피부과", "안과", "한의원", "클리닉" 등 의료기관 키워드 포함 파트 우선
  const medicalKeywords = /(?:병원|의원|치과|성형외과|피부과|안과|한의원|클리닉|센터|의료원|재활|정형|내과|외과|산부인과|비뇨기과|이비인후과|정신과|소아과|가정의학과|마취과|Clinic|Hospital|Center|Medical)/i;
  const medPart = parts.find(p => medicalKeywords.test(p));
  if (medPart) return medPart.trim();
  // 3) 의료기관 키워드가 없으면 가장 짧은 파트 (슬로건은 보통 길다)
  if (parts.length > 1) {
    // 가장 짧은 파트 선택 (단, 2글자 이상)
    const candidates = parts.filter(p => p.length >= 2);
    if (candidates.length > 0) {
      return candidates.sort((a, b) => a.length - b.length)[0];
    }
  }
  return raw.trim();
}
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
    // HTML 태그 잔존 제거 (</td>, <br>, <p> 등)
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // LLM 메타 코멘트 제거 ("(왜 중요한가: ...)" 등 reasoning 흔적)
    .replace(/\(왜 중요한가:[^)]*\)/g, "")
    .replace(/\(Why this matters:[^)]*\)/g, "")
    .replace(/\(참고:[^)]*\)/g, "")
    .replace(/\(Note:[^)]*\)/g, "")
    // "제로클릭" 표기 통일
    .replace(/제로[\s-]*클릭/g, "제로클릭")
    .trim();
}

export function getGradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return C.pass;
  if (grade === "B") return C.gold;
  if (grade === "C") return C.warn;
  return C.fail;
}

/** 통일된 섹션 타이틀 — v4: 티얼 액센트 + 품위있는 타이포그래피 */
export function drawSectionTitle(doc: any, y: number, title: string, sub?: string): number {
  // v4: 좌측 티얼 액센트 바 (mybiseo 브랜딩)
  doc.rect(ML, y, 4, sub ? 28 : 22).fill(C.teal);
  doc.font("KrBold").fontSize(13).fillColor(C.navy)
    .text(title, ML + 14, y + 3, { width: CW - 14 });
  if (sub) {
    doc.font("KrRegular").fontSize(8).fillColor(C.textLight)
      .text(sub, ML + 14, y + 20, { width: CW - 14 });
    doc.moveTo(ML, y + 36).lineTo(ML + CW, y + 36).lineWidth(1.5).strokeColor(C.teal).stroke();
    return y + 44;
  }
  doc.moveTo(ML, y + 26).lineTo(ML + CW, y + 26).lineWidth(1.5).strokeColor(C.teal).stroke();
  return y + 34;
}

/** 통일된 서브타이틀 — v4: 티얼 도트 + 세련된 구분선 */
export function drawSubTitle(doc: any, y: number, title: string): number {
  doc.circle(ML + 4, y + 6, 3).fill(C.teal);
  doc.font("KrBold").fontSize(10.5).fillColor(C.navy)
    .text(title, ML + 14, y, { width: CW - 14 });
  doc.moveTo(ML, y + 20).lineTo(ML + CW, y + 20).lineWidth(0.5).strokeColor(C.border).stroke();
  return y + 26;
}

/** 통일된 본문 텍스트 — v4: lineGap 6 가독성 향상 */
export function drawParagraph(doc: any, y: number, text: string, opts?: { color?: string; fontSize?: number }): number {
  text = text.replace(/만원원/g, "만원").replace(/억원원/g, "억원");
  const fs = opts?.fontSize || 9;
  const color = opts?.color || C.textMid;
  doc.font("KrRegular").fontSize(fs).fillColor(color);
  const h = doc.heightOfString(text, { width: CW, lineGap: 6 });
  doc.text(text, ML, y, { width: CW, lineGap: 6 });
  return y + h + 6;
}

/** 통일된 정보 박스 — 좌측 3px 색상 바 + 배경 (v4: 텍스트 수직 정중앙 배치) */
export function drawInfoBox(doc: any, y: number, text: string, opts?: { accentColor?: string; bgColor?: string; icon?: string }): number {
  text = text.replace(/만원원/g, "만원").replace(/억원원/g, "억원");
  const accent = opts?.accentColor || C.teal;
  const bgTint = opts?.bgColor || C.bgAccent;
  doc.font("KrRegular").fontSize(9);
  const textContentW = opts?.icon ? CW - 44 : CW - 28;
  const textH = doc.heightOfString(text, { width: textContentW, lineGap: 5 });
  const boxH = Math.max(textH + 20, 38);
  const textY = y + (boxH - textH) / 2; // v4: 정확한 수직 중앙
  doc.roundedRect(ML, y, CW, boxH, 4).fill(bgTint);
  doc.rect(ML, y, 3, boxH).fill(accent);
  if (opts?.icon) {
    // v4: 느낌표 아이콘도 텍스트와 동일한 수직 중앙
    doc.font("KrBold").fontSize(10).fillColor(accent)
      .text(opts.icon, ML + 12, textY, { width: 14 });
    doc.font("KrRegular").fontSize(9).fillColor(C.text)
      .text(text, ML + 30, textY, { width: textContentW, lineGap: 5 });
  } else {
    doc.font("KrRegular").fontSize(9).fillColor(C.text)
      .text(text, ML + 14, textY, { width: textContentW, lineGap: 5 });
  }
  return y + boxH + 8;
}

/** 통일된 프로그레스 바 — 높이 8px 고정 (#8) */
export function drawProgressBar(doc: any, x: number, y: number, w: number, h: number, ratio: number, color: string): void {
  const barH = 8; // 통일된 높이 (#8)
  doc.roundedRect(x, y, w, barH, barH / 2).fill(C.grayBar);
  if (ratio > 0) {
    doc.roundedRect(x, y, Math.max(w * Math.min(ratio, 1), barH), barH, barH / 2).fill(color);
  }
}

/** 통일된 구분선 — 간격 12px (#25) */
export function drawHorizontalLine(doc: any, y: number): number {
  doc.moveTo(ML, y).lineTo(ML + CW, y).lineWidth(0.5).strokeColor(C.border).stroke();
  return y + 12;
}

/** 통일된 페이지 헤더 — v4: 화이트 배경 + 티얼 액센트 */
export function drawPageHeader(doc: any, t: Record<string, string>, url: string): void {
  // v4: 화이트 배경 + 하단 티얼 라인
  doc.rect(0, 0, PW, 38).fill(C.white);
  // 좌측 티얼 액센트 바
  doc.rect(0, 0, 4, 38).fill(C.teal);
  doc.font("KrBold").fontSize(8.5).fillColor(C.teal)
    .text(t.brand, ML, 12, { width: 100 });
  // Punycode 디코딩
  const rawUrl = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const displayUrl = (() => {
    try {
      if (rawUrl.includes("xn--")) {
        const { domainToUnicode } = require("url");
        const parts = rawUrl.split("/");
        parts[0] = domainToUnicode(parts[0]) || parts[0];
        return parts.join("/");
      }
      return rawUrl;
    } catch { return rawUrl; }
  })();
  doc.font("KrRegular").fontSize(7.5).fillColor(C.textLight)
    .text(displayUrl, ML + 100, 13, { width: CW - 100, align: "right" });
  // 하단 2px 티얼 라인
  doc.moveTo(0, 38).lineTo(PW, 38).lineWidth(2).strokeColor(C.teal).stroke();
}

/** 페이지 넘김 체크 */
export function ensureSpace(doc: any, y: number, needed: number, hCtx: { t: Record<string, string>; url: string }): number {
  if (y + needed > MAX_Y) {
    doc.addPage();
    drawPageHeader(doc, hCtx.t, hCtx.url);
    return MT;
  }
  return y;
}

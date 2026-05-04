/**
 * #28 다중 신호 진료과 분류
 * #29 복합 진료과 처리
 * #32 진료과 분류 신뢰도 점수
 *
 * URL + 메타태그 + 본문 콘텐츠를 종합 분석하여 진료과를 자동 분류
 */

import { SPECIALTY_ALIASES, type SpecialtyType } from "../specialty-weights";

export interface ClassificationSignal {
  source: "url" | "meta" | "title" | "content" | "schema" | "og";
  specialty: SpecialtyType;
  weight: number;
  evidence: string;
}

export interface ClassificationResult {
  primary: SpecialtyType;
  secondary: SpecialtyType | null;
  confidence: number; // 0-100
  signals: ClassificationSignal[];
  isMultiSpecialty: boolean;
}

// 진료과 키워드 사전 (URL, 메타, 콘텐츠에서 탐지)
const SPECIALTY_KEYWORDS: Record<SpecialtyType, string[]> = {
  "성형외과": ["성형", "코성형", "눈성형", "지방흡입", "리프팅", "보톡스", "필러", "가슴수술", "안면윤곽", "쌍꺼풀", "plastic surgery", "rhinoplasty", "facelift"],
  "치과": ["치과", "임플란트", "교정", "치아", "잇몸", "스케일링", "충치", "사랑니", "보철", "dental", "orthodontic", "implant"],
  "피부과": ["피부과", "여드름", "탈모", "레이저", "기미", "주근깨", "아토피", "피부관리", "dermatology", "acne", "hair loss"],
  "한의원": ["한의원", "한방", "침", "한약", "추나", "한의", "oriental medicine", "acupuncture", "herbal"],
  "정형외과": ["정형외과", "관절", "척추", "허리", "무릎", "어깨", "디스크", "인공관절", "orthopedic", "spine", "joint"],
  "안과": ["안과", "라식", "라섹", "백내장", "녹내장", "시력", "렌즈삽입", "ophthalmology", "lasik", "cataract"],
  "산부인과": ["산부인과", "산부", "임신", "출산", "난임", "자궁", "여성", "obstetrics", "gynecology", "pregnancy"],
  "종합병원": ["종합병원", "대학병원", "건강검진", "종합검진", "general hospital", "health check"],
  "이비인후과": ["이비인후과", "코막힘", "축농증", "편도", "중이염", "비염", "ent", "sinusitis"],
  "비뇨기과": ["비뇨기과", "전립선", "비뇨", "요로", "urology", "prostate"],
  "내과": ["내과", "위내시경", "대장내시경", "당뇨", "고혈압", "갑상선", "internal medicine", "endoscopy"],
  "소아과": ["소아과", "소아청소년과", "소아", "어린이", "예방접종", "pediatrics", "children"],
  "기타": [],
};

// 신호 가중치
const SIGNAL_WEIGHTS = {
  url: 3.0,       // URL에 진료과 정보가 있으면 매우 강력한 신호
  schema: 2.5,    // 구조화 데이터(Schema.org)
  title: 2.0,     // 페이지 타이틀
  meta: 1.5,      // 메타 description/keywords
  og: 1.5,        // Open Graph 태그
  content: 1.0,   // 본문 콘텐츠 (빈도 기반)
};

/**
 * URL에서 진료과 신호 추출
 */
function extractUrlSignals(url: string): ClassificationSignal[] {
  const signals: ClassificationSignal[] = [];
  const urlLower = url.toLowerCase();

  for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (specialty === "기타") continue;
    for (const kw of keywords) {
      if (urlLower.includes(kw.toLowerCase().replace(/\s/g, ""))) {
        signals.push({
          source: "url",
          specialty: specialty as SpecialtyType,
          weight: SIGNAL_WEIGHTS.url,
          evidence: `URL contains "${kw}"`,
        });
        break; // 같은 진료과에서 하나만 카운트
      }
    }
  }
  return signals;
}

/**
 * 메타태그에서 진료과 신호 추출
 */
function extractMetaSignals(title: string, description: string, keywords: string, ogType?: string): ClassificationSignal[] {
  const signals: ClassificationSignal[] = [];
  const combined = `${title} ${description} ${keywords}`.toLowerCase();

  for (const [specialty, kws] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (specialty === "기타") continue;
    let matchCount = 0;
    let matchedKw = "";
    for (const kw of kws) {
      if (combined.includes(kw.toLowerCase())) {
        matchCount++;
        if (!matchedKw) matchedKw = kw;
      }
    }
    if (matchCount > 0) {
      signals.push({
        source: "meta",
        specialty: specialty as SpecialtyType,
        weight: SIGNAL_WEIGHTS.meta * Math.min(matchCount, 3),
        evidence: `Meta contains "${matchedKw}" (+${matchCount - 1} more)`,
      });
    }
  }

  // 타이틀에서 직접 매칭 (더 높은 가중치)
  for (const [specialty, kws] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (specialty === "기타") continue;
    for (const kw of kws) {
      if (title.toLowerCase().includes(kw.toLowerCase())) {
        signals.push({
          source: "title",
          specialty: specialty as SpecialtyType,
          weight: SIGNAL_WEIGHTS.title,
          evidence: `Title contains "${kw}"`,
        });
        break;
      }
    }
  }

  return signals;
}

/**
 * 본문 콘텐츠에서 진료과 신호 추출 (빈도 기반)
 */
function extractContentSignals(bodyText: string): ClassificationSignal[] {
  const signals: ClassificationSignal[] = [];
  const textLower = bodyText.toLowerCase();
  const textLength = textLower.length;
  if (textLength < 50) return signals;

  for (const [specialty, kws] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (specialty === "기타") continue;
    let totalOccurrences = 0;
    for (const kw of kws) {
      const regex = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const matches = textLower.match(regex);
      if (matches) totalOccurrences += matches.length;
    }
    if (totalOccurrences >= 2) {
      // 빈도를 정규화 (1000자당 출현 횟수)
      const density = (totalOccurrences / textLength) * 1000;
      signals.push({
        source: "content",
        specialty: specialty as SpecialtyType,
        weight: SIGNAL_WEIGHTS.content * Math.min(density * 2, 5),
        evidence: `Content mentions ${totalOccurrences} times (density: ${density.toFixed(2)}/1000chars)`,
      });
    }
  }

  return signals;
}

/**
 * Schema.org 구조화 데이터에서 진료과 신호 추출
 */
function extractSchemaSignals(html: string): ClassificationSignal[] {
  const signals: ClassificationSignal[] = [];
  
  // MedicalSpecialty 또는 medicalSpecialty 필드 탐지
  const schemaMatch = html.match(/"medicalSpecialty"\s*:\s*"([^"]+)"/i);
  if (schemaMatch) {
    const schemaSpecialty = schemaMatch[1];
    const resolved = SPECIALTY_ALIASES[schemaSpecialty];
    if (resolved) {
      signals.push({
        source: "schema",
        specialty: resolved,
        weight: SIGNAL_WEIGHTS.schema,
        evidence: `Schema.org medicalSpecialty: "${schemaSpecialty}"`,
      });
    }
  }

  // @type: MedicalClinic, Dentist, Hospital 등
  const typeMatch = html.match(/"@type"\s*:\s*"(Dentist|MedicalClinic|Hospital|Physician)"/i);
  if (typeMatch) {
    const typeMap: Record<string, SpecialtyType> = {
      "Dentist": "치과",
      "Hospital": "종합병원",
    };
    const mapped = typeMap[typeMatch[1]];
    if (mapped) {
      signals.push({
        source: "schema",
        specialty: mapped,
        weight: SIGNAL_WEIGHTS.schema * 0.8,
        evidence: `Schema.org @type: "${typeMatch[1]}"`,
      });
    }
  }

  return signals;
}

/**
 * 모든 신호를 종합하여 진료과 분류 결과 반환
 */
export function classifySpecialty(params: {
  url: string;
  title?: string;
  description?: string;
  keywords?: string;
  bodyText?: string;
  html?: string;
  userInput?: string; // 사용자가 직접 입력한 진료과
}): ClassificationResult {
  const { url, title = "", description = "", keywords = "", bodyText = "", html = "", userInput } = params;

  // 사용자가 직접 입력한 경우 최우선 (confidence 100)
  if (userInput) {
    const resolved = SPECIALTY_ALIASES[userInput.trim()] || SPECIALTY_ALIASES[userInput.trim().toLowerCase()];
    if (resolved && resolved !== "기타") {
      return {
        primary: resolved,
        secondary: null,
        confidence: 100,
        signals: [{ source: "meta", specialty: resolved, weight: 10, evidence: `User input: "${userInput}"` }],
        isMultiSpecialty: false,
      };
    }
  }

  // 모든 신호 수집
  const allSignals: ClassificationSignal[] = [
    ...extractUrlSignals(url),
    ...extractMetaSignals(title, description, keywords),
    ...extractContentSignals(bodyText),
    ...extractSchemaSignals(html),
  ];

  if (allSignals.length === 0) {
    return { primary: "기타", secondary: null, confidence: 0, signals: [], isMultiSpecialty: false };
  }

  // 진료과별 총 가중치 합산
  const scoreMap = new Map<SpecialtyType, number>();
  for (const signal of allSignals) {
    scoreMap.set(signal.specialty, (scoreMap.get(signal.specialty) || 0) + signal.weight);
  }

  // 정렬
  const sorted = Array.from(scoreMap.entries()).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const primaryScore = sorted[0][1];
  const secondary = sorted.length > 1 ? sorted[1][0] : null;
  const secondaryScore = sorted.length > 1 ? sorted[1][1] : 0;

  // 신뢰도 계산 (#32)
  // 1차와 2차 간 격차가 클수록 신뢰도 높음
  const totalWeight = sorted.reduce((sum, [, w]) => sum + w, 0);
  const dominance = primaryScore / totalWeight; // 0~1
  const gap = secondaryScore > 0 ? (primaryScore - secondaryScore) / primaryScore : 1;
  const confidence = Math.min(100, Math.round(dominance * 60 + gap * 40));

  // 복합 진료과 판단 (#29)
  // 2차 진료과의 점수가 1차의 60% 이상이면 복합 진료과
  const isMultiSpecialty = secondary !== null && secondaryScore >= primaryScore * 0.6;

  return {
    primary,
    secondary: isMultiSpecialty ? secondary : null,
    confidence,
    signals: allSignals,
    isMultiSpecialty,
  };
}

/**
 * #31 진료과 분류 사용자 확인용 데이터 생성
 * 프론트엔드에서 사용자에게 분류 결과를 보여주고 확인/수정할 수 있도록 함
 */
export function getClassificationSummary(result: ClassificationResult): {
  detected: string;
  confidence: string;
  needsConfirmation: boolean;
  alternatives: string[];
} {
  const confidenceLabel = result.confidence >= 80 ? "높음" : result.confidence >= 50 ? "보통" : "낮음";
  const needsConfirmation = result.confidence < 70 || result.isMultiSpecialty;
  
  const alternatives: string[] = [];
  if (result.secondary) alternatives.push(result.secondary);
  // 신뢰도가 낮으면 상위 3개 후보 제시
  if (result.confidence < 50) {
    const seen = new Set([result.primary, result.secondary]);
    const scoreMap = new Map<SpecialtyType, number>();
    for (const s of result.signals) {
      scoreMap.set(s.specialty, (scoreMap.get(s.specialty) || 0) + s.weight);
    }
    for (const [sp] of Array.from(scoreMap.entries()).sort((a, b) => b[1] - a[1])) {
      if (!seen.has(sp) && alternatives.length < 3) {
        alternatives.push(sp);
        seen.add(sp);
      }
    }
  }

  return {
    detected: result.isMultiSpecialty ? `${result.primary} + ${result.secondary}` : result.primary,
    confidence: confidenceLabel,
    needsConfirmation,
    alternatives,
  };
}

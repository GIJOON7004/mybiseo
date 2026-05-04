/**
 * #35 진료과별 핵심 키워드 사전 구축
 * 
 * 각 진료과별 검색 노출 측정에 사용할 핵심 키워드를 사전으로 관리
 * - 시술명, 증상명, 지역명 조합 패턴 포함
 * - 네이버/구글 검색 시 사용할 키워드 자동 생성
 */

import type { SpecialtyType } from "../specialty-weights";

export interface KeywordEntry {
  /** 키워드 */
  keyword: string;
  /** 키워드 유형 */
  type: "시술" | "증상" | "일반" | "브랜드" | "지역조합";
  /** 월간 추정 검색량 (네이버 기준) */
  estimatedVolume: number;
  /** 전환 의도 강도 (0-1, 높을수록 예약 의도 강함) */
  intentStrength: number;
  /** AI 검색 노출 가능성 (0-1) */
  aiVisibilityPotential: number;
}

/**
 * 진료과별 핵심 키워드 사전
 * 각 진료과의 대표 키워드를 검색량/전환 의도 순으로 정렬
 */
export const SPECIALTY_KEYWORDS_DICT: Record<SpecialtyType, KeywordEntry[]> = {
  "성형외과": [
    { keyword: "코성형", type: "시술", estimatedVolume: 74000, intentStrength: 0.8, aiVisibilityPotential: 0.7 },
    { keyword: "눈성형", type: "시술", estimatedVolume: 60000, intentStrength: 0.8, aiVisibilityPotential: 0.7 },
    { keyword: "지방흡입", type: "시술", estimatedVolume: 45000, intentStrength: 0.75, aiVisibilityPotential: 0.6 },
    { keyword: "안면윤곽", type: "시술", estimatedVolume: 33000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "리프팅", type: "시술", estimatedVolume: 40000, intentStrength: 0.7, aiVisibilityPotential: 0.65 },
    { keyword: "보톡스", type: "시술", estimatedVolume: 55000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "필러", type: "시술", estimatedVolume: 48000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "쌍꺼풀", type: "시술", estimatedVolume: 35000, intentStrength: 0.75, aiVisibilityPotential: 0.6 },
    { keyword: "가슴수술", type: "시술", estimatedVolume: 22000, intentStrength: 0.8, aiVisibilityPotential: 0.5 },
    { keyword: "성형외과 추천", type: "일반", estimatedVolume: 28000, intentStrength: 0.9, aiVisibilityPotential: 0.8 },
  ],
  "치과": [
    { keyword: "임플란트", type: "시술", estimatedVolume: 90000, intentStrength: 0.85, aiVisibilityPotential: 0.8 },
    { keyword: "치아교정", type: "시술", estimatedVolume: 65000, intentStrength: 0.8, aiVisibilityPotential: 0.75 },
    { keyword: "임플란트 가격", type: "시술", estimatedVolume: 55000, intentStrength: 0.9, aiVisibilityPotential: 0.7 },
    { keyword: "치아미백", type: "시술", estimatedVolume: 30000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "사랑니 발치", type: "시술", estimatedVolume: 25000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "충치 치료", type: "증상", estimatedVolume: 35000, intentStrength: 0.75, aiVisibilityPotential: 0.6 },
    { keyword: "잇몸 치료", type: "증상", estimatedVolume: 20000, intentStrength: 0.7, aiVisibilityPotential: 0.55 },
    { keyword: "스케일링", type: "시술", estimatedVolume: 22000, intentStrength: 0.5, aiVisibilityPotential: 0.4 },
    { keyword: "치과 추천", type: "일반", estimatedVolume: 40000, intentStrength: 0.9, aiVisibilityPotential: 0.8 },
    { keyword: "교정 비용", type: "시술", estimatedVolume: 28000, intentStrength: 0.85, aiVisibilityPotential: 0.65 },
  ],
  "피부과": [
    { keyword: "여드름 치료", type: "증상", estimatedVolume: 50000, intentStrength: 0.7, aiVisibilityPotential: 0.7 },
    { keyword: "레이저 토닝", type: "시술", estimatedVolume: 35000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "기미 치료", type: "증상", estimatedVolume: 28000, intentStrength: 0.7, aiVisibilityPotential: 0.65 },
    { keyword: "탈모 치료", type: "증상", estimatedVolume: 45000, intentStrength: 0.75, aiVisibilityPotential: 0.7 },
    { keyword: "피부과 추천", type: "일반", estimatedVolume: 32000, intentStrength: 0.9, aiVisibilityPotential: 0.8 },
    { keyword: "아토피", type: "증상", estimatedVolume: 25000, intentStrength: 0.6, aiVisibilityPotential: 0.6 },
    { keyword: "주근깨 제거", type: "시술", estimatedVolume: 18000, intentStrength: 0.65, aiVisibilityPotential: 0.5 },
    { keyword: "피부 관리", type: "일반", estimatedVolume: 40000, intentStrength: 0.5, aiVisibilityPotential: 0.5 },
    { keyword: "보톡스 피부과", type: "시술", estimatedVolume: 20000, intentStrength: 0.7, aiVisibilityPotential: 0.5 },
    { keyword: "모공 축소", type: "시술", estimatedVolume: 15000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
  ],
  "한의원": [
    { keyword: "한의원 추천", type: "일반", estimatedVolume: 25000, intentStrength: 0.85, aiVisibilityPotential: 0.7 },
    { keyword: "추나요법", type: "시술", estimatedVolume: 20000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "침 치료", type: "시술", estimatedVolume: 18000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "한약 다이어트", type: "시술", estimatedVolume: 22000, intentStrength: 0.7, aiVisibilityPotential: 0.55 },
    { keyword: "교통사고 한의원", type: "일반", estimatedVolume: 15000, intentStrength: 0.8, aiVisibilityPotential: 0.6 },
    { keyword: "허리 디스크 한방", type: "증상", estimatedVolume: 12000, intentStrength: 0.7, aiVisibilityPotential: 0.55 },
    { keyword: "보약", type: "시술", estimatedVolume: 10000, intentStrength: 0.5, aiVisibilityPotential: 0.4 },
    { keyword: "한방 다이어트", type: "시술", estimatedVolume: 18000, intentStrength: 0.65, aiVisibilityPotential: 0.5 },
  ],
  "정형외과": [
    { keyword: "허리 디스크", type: "증상", estimatedVolume: 55000, intentStrength: 0.7, aiVisibilityPotential: 0.7 },
    { keyword: "무릎 관절", type: "증상", estimatedVolume: 35000, intentStrength: 0.7, aiVisibilityPotential: 0.65 },
    { keyword: "어깨 통증", type: "증상", estimatedVolume: 30000, intentStrength: 0.65, aiVisibilityPotential: 0.6 },
    { keyword: "인공관절", type: "시술", estimatedVolume: 20000, intentStrength: 0.8, aiVisibilityPotential: 0.6 },
    { keyword: "척추 수술", type: "시술", estimatedVolume: 18000, intentStrength: 0.75, aiVisibilityPotential: 0.6 },
    { keyword: "정형외과 추천", type: "일반", estimatedVolume: 22000, intentStrength: 0.9, aiVisibilityPotential: 0.75 },
    { keyword: "관절염 치료", type: "증상", estimatedVolume: 25000, intentStrength: 0.65, aiVisibilityPotential: 0.6 },
    { keyword: "목 디스크", type: "증상", estimatedVolume: 28000, intentStrength: 0.7, aiVisibilityPotential: 0.65 },
  ],
  "안과": [
    { keyword: "라식", type: "시술", estimatedVolume: 40000, intentStrength: 0.8, aiVisibilityPotential: 0.7 },
    { keyword: "라섹", type: "시술", estimatedVolume: 35000, intentStrength: 0.8, aiVisibilityPotential: 0.7 },
    { keyword: "백내장 수술", type: "시술", estimatedVolume: 25000, intentStrength: 0.8, aiVisibilityPotential: 0.65 },
    { keyword: "스마일라식", type: "시술", estimatedVolume: 20000, intentStrength: 0.8, aiVisibilityPotential: 0.6 },
    { keyword: "안과 추천", type: "일반", estimatedVolume: 18000, intentStrength: 0.9, aiVisibilityPotential: 0.75 },
    { keyword: "렌즈삽입술", type: "시술", estimatedVolume: 15000, intentStrength: 0.75, aiVisibilityPotential: 0.55 },
    { keyword: "녹내장", type: "증상", estimatedVolume: 12000, intentStrength: 0.6, aiVisibilityPotential: 0.6 },
    { keyword: "시력교정", type: "시술", estimatedVolume: 22000, intentStrength: 0.75, aiVisibilityPotential: 0.65 },
  ],
  "산부인과": [
    { keyword: "산부인과 추천", type: "일반", estimatedVolume: 20000, intentStrength: 0.9, aiVisibilityPotential: 0.7 },
    { keyword: "난임 치료", type: "증상", estimatedVolume: 18000, intentStrength: 0.8, aiVisibilityPotential: 0.65 },
    { keyword: "임신 검사", type: "증상", estimatedVolume: 25000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "자궁근종", type: "증상", estimatedVolume: 15000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "산전 검사", type: "시술", estimatedVolume: 12000, intentStrength: 0.7, aiVisibilityPotential: 0.5 },
    { keyword: "여성 검진", type: "시술", estimatedVolume: 18000, intentStrength: 0.65, aiVisibilityPotential: 0.55 },
  ],
  "종합병원": [
    { keyword: "건강검진", type: "시술", estimatedVolume: 80000, intentStrength: 0.7, aiVisibilityPotential: 0.7 },
    { keyword: "종합검진", type: "시술", estimatedVolume: 45000, intentStrength: 0.75, aiVisibilityPotential: 0.65 },
    { keyword: "종합병원 추천", type: "일반", estimatedVolume: 25000, intentStrength: 0.85, aiVisibilityPotential: 0.7 },
    { keyword: "대학병원 예약", type: "일반", estimatedVolume: 30000, intentStrength: 0.8, aiVisibilityPotential: 0.5 },
    { keyword: "MRI 검사", type: "시술", estimatedVolume: 20000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "내시경 검사", type: "시술", estimatedVolume: 22000, intentStrength: 0.65, aiVisibilityPotential: 0.55 },
  ],
  "이비인후과": [
    { keyword: "비염 치료", type: "증상", estimatedVolume: 30000, intentStrength: 0.7, aiVisibilityPotential: 0.65 },
    { keyword: "축농증", type: "증상", estimatedVolume: 20000, intentStrength: 0.65, aiVisibilityPotential: 0.6 },
    { keyword: "편도 수술", type: "시술", estimatedVolume: 12000, intentStrength: 0.75, aiVisibilityPotential: 0.55 },
    { keyword: "코골이 치료", type: "증상", estimatedVolume: 15000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "이비인후과 추천", type: "일반", estimatedVolume: 12000, intentStrength: 0.9, aiVisibilityPotential: 0.7 },
    { keyword: "중이염", type: "증상", estimatedVolume: 18000, intentStrength: 0.6, aiVisibilityPotential: 0.55 },
  ],
  "비뇨기과": [
    { keyword: "전립선", type: "증상", estimatedVolume: 22000, intentStrength: 0.65, aiVisibilityPotential: 0.6 },
    { keyword: "비뇨기과 추천", type: "일반", estimatedVolume: 12000, intentStrength: 0.9, aiVisibilityPotential: 0.7 },
    { keyword: "요로결석", type: "증상", estimatedVolume: 15000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "남성 검진", type: "시술", estimatedVolume: 10000, intentStrength: 0.7, aiVisibilityPotential: 0.5 },
    { keyword: "방광염", type: "증상", estimatedVolume: 18000, intentStrength: 0.6, aiVisibilityPotential: 0.55 },
  ],
  "내과": [
    { keyword: "내과 추천", type: "일반", estimatedVolume: 30000, intentStrength: 0.85, aiVisibilityPotential: 0.7 },
    { keyword: "위내시경", type: "시술", estimatedVolume: 35000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "대장내시경", type: "시술", estimatedVolume: 28000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
    { keyword: "당뇨 치료", type: "증상", estimatedVolume: 20000, intentStrength: 0.6, aiVisibilityPotential: 0.6 },
    { keyword: "고혈압 치료", type: "증상", estimatedVolume: 18000, intentStrength: 0.55, aiVisibilityPotential: 0.55 },
    { keyword: "갑상선 검사", type: "시술", estimatedVolume: 15000, intentStrength: 0.65, aiVisibilityPotential: 0.55 },
    { keyword: "건강검진 내과", type: "시술", estimatedVolume: 22000, intentStrength: 0.7, aiVisibilityPotential: 0.6 },
  ],
  "소아과": [
    { keyword: "소아과 추천", type: "일반", estimatedVolume: 25000, intentStrength: 0.9, aiVisibilityPotential: 0.7 },
    { keyword: "소아 예방접종", type: "시술", estimatedVolume: 20000, intentStrength: 0.7, aiVisibilityPotential: 0.55 },
    { keyword: "소아 감기", type: "증상", estimatedVolume: 30000, intentStrength: 0.6, aiVisibilityPotential: 0.5 },
    { keyword: "소아 아토피", type: "증상", estimatedVolume: 12000, intentStrength: 0.65, aiVisibilityPotential: 0.55 },
    { keyword: "소아청소년과", type: "일반", estimatedVolume: 18000, intentStrength: 0.8, aiVisibilityPotential: 0.6 },
  ],
  "기타": [
    { keyword: "병원 추천", type: "일반", estimatedVolume: 50000, intentStrength: 0.8, aiVisibilityPotential: 0.7 },
    { keyword: "의원 추천", type: "일반", estimatedVolume: 20000, intentStrength: 0.8, aiVisibilityPotential: 0.65 },
    { keyword: "진료 예약", type: "일반", estimatedVolume: 15000, intentStrength: 0.7, aiVisibilityPotential: 0.5 },
  ],
};

/**
 * 진료과 + 지역명 조합 키워드 생성
 * 예: "강남 성형외과", "분당 치과 추천"
 */
export function generateLocationKeywords(
  specialty: SpecialtyType,
  location?: string
): KeywordEntry[] {
  if (!location) return [];
  
  const baseKeywords = SPECIALTY_KEYWORDS_DICT[specialty] || SPECIALTY_KEYWORDS_DICT["기타"];
  const locationKeywords: KeywordEntry[] = [];

  // 지역명 + 진료과명
  locationKeywords.push({
    keyword: `${location} ${specialty}`,
    type: "지역조합",
    estimatedVolume: Math.round(baseKeywords[0]?.estimatedVolume * 0.3 || 5000),
    intentStrength: 0.95,
    aiVisibilityPotential: 0.8,
  });

  // 지역명 + 진료과 추천
  locationKeywords.push({
    keyword: `${location} ${specialty} 추천`,
    type: "지역조합",
    estimatedVolume: Math.round(baseKeywords[0]?.estimatedVolume * 0.2 || 3000),
    intentStrength: 0.95,
    aiVisibilityPotential: 0.85,
  });

  // 지역명 + 주요 시술명 (상위 3개)
  const topProcedures = baseKeywords
    .filter(k => k.type === "시술")
    .slice(0, 3);
  
  for (const proc of topProcedures) {
    locationKeywords.push({
      keyword: `${location} ${proc.keyword}`,
      type: "지역조합",
      estimatedVolume: Math.round(proc.estimatedVolume * 0.25),
      intentStrength: 0.9,
      aiVisibilityPotential: 0.75,
    });
  }

  return locationKeywords;
}

/**
 * 진료과별 핵심 키워드 목록 반환 (검색 노출 측정용)
 * @param specialty 진료과
 * @param location 지역명 (선택)
 * @param topN 상위 N개 키워드만 반환
 */
export function getKeywordsForMeasurement(
  specialty: SpecialtyType,
  location?: string,
  topN: number = 10
): KeywordEntry[] {
  const baseKeywords = SPECIALTY_KEYWORDS_DICT[specialty] || SPECIALTY_KEYWORDS_DICT["기타"];
  const locationKeywords = generateLocationKeywords(specialty, location);
  
  // 지역 키워드 + 일반 키워드를 intentStrength 순으로 정렬
  const allKeywords = [...locationKeywords, ...baseKeywords]
    .sort((a, b) => b.intentStrength - a.intentStrength);
  
  return allKeywords.slice(0, topN);
}

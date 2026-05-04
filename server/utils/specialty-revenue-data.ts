/**
 * #30 진료과별 객단가 범위의 데이터 기반 업데이트
 * 
 * 진료과별 시술 객단가를 실제 시장 데이터 기반으로 구조화
 * - 시술별 가격 범위 (최소~최대)
 * - 평균 객단가 산출
 * - 온라인 마케팅 ROI 계산에 활용
 */

import type { SpecialtyType } from "../specialty-weights";

export interface ProcedureRevenue {
  /** 시술명 */
  procedure: string;
  /** 최소 가격 (만원) */
  minPrice: number;
  /** 최대 가격 (만원) */
  maxPrice: number;
  /** 평균 가격 (만원) */
  avgPrice: number;
  /** 시술 빈도 (월간 환자 수 대비 비율, 0-1) */
  frequency: number;
}

export interface SpecialtyRevenueProfile {
  /** 진료과 */
  specialty: SpecialtyType;
  /** 평균 객단가 (만원) */
  avgRevenuePerVisit: number;
  /** 신환 평균 객단가 (만원) — 첫 방문 시 */
  avgNewPatientRevenue: number;
  /** 재방문 평균 객단가 (만원) */
  avgReturnPatientRevenue: number;
  /** 주요 시술별 객단가 */
  procedures: ProcedureRevenue[];
  /** 온라인 마케팅 CPA 기준 (만원) — 환자 1명 유치 비용 */
  targetCPA: number;
  /** 마케팅 ROI 기준 배수 (객단가 / CPA) */
  targetROI: number;
  /** 최종 업데이트 기준 */
  dataSource: string;
}

/**
 * 진료과별 객단가 프로필
 * 2024-2025 시장 데이터 기반 추정치
 */
export const SPECIALTY_REVENUE_PROFILES: Record<SpecialtyType, SpecialtyRevenueProfile> = {
  "성형외과": {
    specialty: "성형외과",
    avgRevenuePerVisit: 350,
    avgNewPatientRevenue: 500,
    avgReturnPatientRevenue: 150,
    procedures: [
      { procedure: "코성형", minPrice: 200, maxPrice: 800, avgPrice: 400, frequency: 0.15 },
      { procedure: "눈성형", minPrice: 100, maxPrice: 500, avgPrice: 250, frequency: 0.2 },
      { procedure: "지방흡입", minPrice: 200, maxPrice: 600, avgPrice: 350, frequency: 0.1 },
      { procedure: "안면윤곽", minPrice: 400, maxPrice: 1500, avgPrice: 800, frequency: 0.05 },
      { procedure: "보톡스", minPrice: 5, maxPrice: 30, avgPrice: 15, frequency: 0.3 },
      { procedure: "필러", minPrice: 20, maxPrice: 80, avgPrice: 40, frequency: 0.2 },
    ],
    targetCPA: 30,
    targetROI: 10,
    dataSource: "2024-2025 성형외과 시장 추정치",
  },
  "치과": {
    specialty: "치과",
    avgRevenuePerVisit: 120,
    avgNewPatientRevenue: 200,
    avgReturnPatientRevenue: 60,
    procedures: [
      { procedure: "임플란트", minPrice: 80, maxPrice: 250, avgPrice: 130, frequency: 0.15 },
      { procedure: "치아교정", minPrice: 300, maxPrice: 800, avgPrice: 500, frequency: 0.1 },
      { procedure: "충치치료", minPrice: 5, maxPrice: 30, avgPrice: 15, frequency: 0.3 },
      { procedure: "스케일링", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.25 },
      { procedure: "치아미백", minPrice: 20, maxPrice: 80, avgPrice: 40, frequency: 0.1 },
      { procedure: "사랑니발치", minPrice: 5, maxPrice: 20, avgPrice: 10, frequency: 0.1 },
    ],
    targetCPA: 15,
    targetROI: 8,
    dataSource: "2024-2025 치과 시장 추정치",
  },
  "피부과": {
    specialty: "피부과",
    avgRevenuePerVisit: 80,
    avgNewPatientRevenue: 120,
    avgReturnPatientRevenue: 50,
    procedures: [
      { procedure: "레이저토닝", minPrice: 5, maxPrice: 30, avgPrice: 15, frequency: 0.25 },
      { procedure: "여드름치료", minPrice: 5, maxPrice: 20, avgPrice: 10, frequency: 0.2 },
      { procedure: "보톡스", minPrice: 5, maxPrice: 30, avgPrice: 12, frequency: 0.15 },
      { procedure: "탈모치료", minPrice: 10, maxPrice: 50, avgPrice: 25, frequency: 0.15 },
      { procedure: "기미치료", minPrice: 10, maxPrice: 40, avgPrice: 20, frequency: 0.15 },
      { procedure: "필러", minPrice: 20, maxPrice: 60, avgPrice: 35, frequency: 0.1 },
    ],
    targetCPA: 10,
    targetROI: 8,
    dataSource: "2024-2025 피부과 시장 추정치",
  },
  "한의원": {
    specialty: "한의원",
    avgRevenuePerVisit: 60,
    avgNewPatientRevenue: 80,
    avgReturnPatientRevenue: 45,
    procedures: [
      { procedure: "추나요법", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.25 },
      { procedure: "침치료", minPrice: 1, maxPrice: 5, avgPrice: 3, frequency: 0.3 },
      { procedure: "한약처방", minPrice: 30, maxPrice: 100, avgPrice: 60, frequency: 0.2 },
      { procedure: "다이어트한약", minPrice: 30, maxPrice: 80, avgPrice: 50, frequency: 0.15 },
      { procedure: "교통사고치료", minPrice: 5, maxPrice: 15, avgPrice: 8, frequency: 0.1 },
    ],
    targetCPA: 8,
    targetROI: 7,
    dataSource: "2024-2025 한의원 시장 추정치",
  },
  "정형외과": {
    specialty: "정형외과",
    avgRevenuePerVisit: 50,
    avgNewPatientRevenue: 80,
    avgReturnPatientRevenue: 30,
    procedures: [
      { procedure: "인공관절", minPrice: 500, maxPrice: 1500, avgPrice: 800, frequency: 0.05 },
      { procedure: "척추수술", minPrice: 300, maxPrice: 1000, avgPrice: 600, frequency: 0.05 },
      { procedure: "물리치료", minPrice: 1, maxPrice: 5, avgPrice: 2, frequency: 0.4 },
      { procedure: "주사치료", minPrice: 5, maxPrice: 30, avgPrice: 15, frequency: 0.3 },
      { procedure: "도수치료", minPrice: 5, maxPrice: 15, avgPrice: 8, frequency: 0.2 },
    ],
    targetCPA: 8,
    targetROI: 6,
    dataSource: "2024-2025 정형외과 시장 추정치",
  },
  "안과": {
    specialty: "안과",
    avgRevenuePerVisit: 200,
    avgNewPatientRevenue: 300,
    avgReturnPatientRevenue: 50,
    procedures: [
      { procedure: "라식/라섹", minPrice: 80, maxPrice: 250, avgPrice: 150, frequency: 0.2 },
      { procedure: "스마일라식", minPrice: 150, maxPrice: 350, avgPrice: 230, frequency: 0.15 },
      { procedure: "백내장수술", minPrice: 100, maxPrice: 400, avgPrice: 200, frequency: 0.15 },
      { procedure: "렌즈삽입술", minPrice: 200, maxPrice: 500, avgPrice: 350, frequency: 0.1 },
      { procedure: "일반진료", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.4 },
    ],
    targetCPA: 20,
    targetROI: 10,
    dataSource: "2024-2025 안과 시장 추정치",
  },
  "산부인과": {
    specialty: "산부인과",
    avgRevenuePerVisit: 70,
    avgNewPatientRevenue: 100,
    avgReturnPatientRevenue: 50,
    procedures: [
      { procedure: "산전검사", minPrice: 10, maxPrice: 50, avgPrice: 25, frequency: 0.2 },
      { procedure: "난임치료", minPrice: 100, maxPrice: 500, avgPrice: 250, frequency: 0.1 },
      { procedure: "여성검진", minPrice: 10, maxPrice: 30, avgPrice: 15, frequency: 0.3 },
      { procedure: "분만", minPrice: 100, maxPrice: 300, avgPrice: 180, frequency: 0.1 },
      { procedure: "일반진료", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.3 },
    ],
    targetCPA: 10,
    targetROI: 7,
    dataSource: "2024-2025 산부인과 시장 추정치",
  },
  "종합병원": {
    specialty: "종합병원",
    avgRevenuePerVisit: 40,
    avgNewPatientRevenue: 60,
    avgReturnPatientRevenue: 30,
    procedures: [
      { procedure: "건강검진", minPrice: 20, maxPrice: 200, avgPrice: 80, frequency: 0.2 },
      { procedure: "MRI/CT", minPrice: 20, maxPrice: 80, avgPrice: 40, frequency: 0.15 },
      { procedure: "내시경", minPrice: 10, maxPrice: 30, avgPrice: 15, frequency: 0.2 },
      { procedure: "외래진료", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.45 },
    ],
    targetCPA: 5,
    targetROI: 8,
    dataSource: "2024-2025 종합병원 시장 추정치",
  },
  "이비인후과": {
    specialty: "이비인후과",
    avgRevenuePerVisit: 30,
    avgNewPatientRevenue: 50,
    avgReturnPatientRevenue: 20,
    procedures: [
      { procedure: "비염수술", minPrice: 50, maxPrice: 200, avgPrice: 100, frequency: 0.1 },
      { procedure: "편도수술", minPrice: 50, maxPrice: 150, avgPrice: 80, frequency: 0.05 },
      { procedure: "코골이치료", minPrice: 30, maxPrice: 100, avgPrice: 60, frequency: 0.1 },
      { procedure: "일반진료", minPrice: 2, maxPrice: 5, avgPrice: 3, frequency: 0.75 },
    ],
    targetCPA: 5,
    targetROI: 6,
    dataSource: "2024-2025 이비인후과 시장 추정치",
  },
  "비뇨기과": {
    specialty: "비뇨기과",
    avgRevenuePerVisit: 60,
    avgNewPatientRevenue: 80,
    avgReturnPatientRevenue: 40,
    procedures: [
      { procedure: "전립선치료", minPrice: 10, maxPrice: 50, avgPrice: 25, frequency: 0.2 },
      { procedure: "요로결석", minPrice: 30, maxPrice: 100, avgPrice: 60, frequency: 0.15 },
      { procedure: "남성수술", minPrice: 50, maxPrice: 200, avgPrice: 100, frequency: 0.1 },
      { procedure: "일반진료", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.55 },
    ],
    targetCPA: 8,
    targetROI: 7,
    dataSource: "2024-2025 비뇨기과 시장 추정치",
  },
  "내과": {
    specialty: "내과",
    avgRevenuePerVisit: 25,
    avgNewPatientRevenue: 40,
    avgReturnPatientRevenue: 15,
    procedures: [
      { procedure: "내시경", minPrice: 10, maxPrice: 30, avgPrice: 15, frequency: 0.15 },
      { procedure: "건강검진", minPrice: 10, maxPrice: 50, avgPrice: 25, frequency: 0.2 },
      { procedure: "만성질환관리", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.3 },
      { procedure: "일반진료", minPrice: 2, maxPrice: 5, avgPrice: 3, frequency: 0.35 },
    ],
    targetCPA: 3,
    targetROI: 8,
    dataSource: "2024-2025 내과 시장 추정치",
  },
  "소아과": {
    specialty: "소아과",
    avgRevenuePerVisit: 20,
    avgNewPatientRevenue: 30,
    avgReturnPatientRevenue: 15,
    procedures: [
      { procedure: "예방접종", minPrice: 3, maxPrice: 15, avgPrice: 8, frequency: 0.25 },
      { procedure: "일반진료", minPrice: 2, maxPrice: 5, avgPrice: 3, frequency: 0.5 },
      { procedure: "알레르기검사", minPrice: 5, maxPrice: 20, avgPrice: 10, frequency: 0.15 },
      { procedure: "성장클리닉", minPrice: 10, maxPrice: 50, avgPrice: 25, frequency: 0.1 },
    ],
    targetCPA: 3,
    targetROI: 7,
    dataSource: "2024-2025 소아과 시장 추정치",
  },
  "기타": {
    specialty: "기타",
    avgRevenuePerVisit: 40,
    avgNewPatientRevenue: 60,
    avgReturnPatientRevenue: 30,
    procedures: [
      { procedure: "일반진료", minPrice: 3, maxPrice: 10, avgPrice: 5, frequency: 0.6 },
      { procedure: "검사", minPrice: 5, maxPrice: 30, avgPrice: 15, frequency: 0.4 },
    ],
    targetCPA: 5,
    targetROI: 8,
    dataSource: "2024-2025 일반 의원 시장 추정치",
  },
};

/**
 * 진료과의 온라인 마케팅 가치 점수 계산
 * 객단가와 온라인 의존도를 종합하여 SEO 투자 가치를 산출
 */
export function calculateMarketingValue(specialty: SpecialtyType): {
  monthlyValue: number; // 월간 신환 1명당 가치 (만원)
  seoInvestmentScore: number; // SEO 투자 가치 점수 (0-100)
  recommendation: string;
} {
  const profile = SPECIALTY_REVENUE_PROFILES[specialty] || SPECIALTY_REVENUE_PROFILES["기타"];
  
  const monthlyValue = profile.avgNewPatientRevenue;
  
  // SEO 투자 가치 = (객단가 × ROI 기준) / CPA 기준 × 정규화
  const rawScore = (monthlyValue * profile.targetROI) / (profile.targetCPA * 10);
  const seoInvestmentScore = Math.min(100, Math.round(rawScore * 10));
  
  let recommendation: string;
  if (seoInvestmentScore >= 80) {
    recommendation = "SEO 투자 가치가 매우 높습니다. 적극적인 콘텐츠 마케팅과 기술 SEO 투자를 권장합니다.";
  } else if (seoInvestmentScore >= 60) {
    recommendation = "SEO 투자 가치가 높습니다. 핵심 키워드 중심의 최적화를 권장합니다.";
  } else if (seoInvestmentScore >= 40) {
    recommendation = "SEO 투자 가치가 보통입니다. 기본 SEO 최적화와 지역 검색 최적화를 권장합니다.";
  } else {
    recommendation = "객단가 대비 SEO 투자 효율이 낮을 수 있습니다. 지역 검색과 리뷰 관리에 집중하세요.";
  }
  
  return { monthlyValue, seoInvestmentScore, recommendation };
}

import { ENV } from "../_core/env";
/**
 * 네이버 검색광고 API 실연동 모듈
 * - RelKwdStat: 키워드 검색량 조회
 * - 실제 네이버 검색 노출 데이터 기반 분석
 */
import crypto from "crypto";

const BASE_URL = "https://api.searchad.naver.com";

function getApiCredentials() {
  return {
    apiKey: ENV.NAVER_AD_API_ACCESS_LICENSE || "",
    secretKey: ENV.NAVER_AD_API_SECRET_KEY || "",
    customerId: ENV.NAVER_AD_API_CUSTOMER_ID || "",
  };
}

function generateSignature(secretKey: string, timestamp: string, method: string, path: string): string {
  const message = `${timestamp}.${method}.${path}`;
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  return hmac.digest("base64");
}

function buildHeaders(method: string, path: string) {
  const { apiKey, secretKey, customerId } = getApiCredentials();
  const timestamp = String(Date.now());
  const signature = generateSignature(secretKey, timestamp, method, path);

  return {
    "X-Timestamp": timestamp,
    "X-API-KEY": apiKey,
    "X-Customer": customerId,
    "X-Signature": signature,
  };
}

// ─── 타입 정의 ───────────────────────────────────────────────

export interface KeywordSearchVolume {
  keyword: string;
  monthlyPcSearches: number;
  monthlyMobileSearches: number;
  totalMonthlySearches: number;
  competitionLevel: string; // "높음" | "중간" | "낮음"
  avgPcClickCount: number;
  avgMobileClickCount: number;
  avgPcCtr: number;
  avgMobileCtr: number;
}

export interface KeywordSearchResult {
  success: boolean;
  keywords: KeywordSearchVolume[];
  error?: string;
}

export interface CompetitorAdAnalysis {
  keyword: string;
  adDepth: number; // 광고 노출 깊이 (페이지 수)
  competitionLevel: string;
  estimatedCpc?: number;
}

// ─── API 호출 함수 ───────────────────────────────────────────

/**
 * 키워드 검색량 조회 (RelKwdStat)
 * @param keywords - 조회할 키워드 목록 (최대 5개)
 */
export async function getKeywordSearchVolume(keywords: string[]): Promise<KeywordSearchResult> {
  const { apiKey } = getApiCredentials();
  if (!apiKey) {
    return { success: false, keywords: [], error: "NAVER_AD_API_ACCESS_LICENSE not configured" };
  }

  try {
    const method = "GET";
    const path = "/keywordstool";
    const headers = buildHeaders(method, path);

    const hintKeywords = keywords.slice(0, 5).join(",");
    const url = `${BASE_URL}${path}?hintKeywords=${encodeURIComponent(hintKeywords)}&showDetail=1`;

    const response = await fetch(url, { method, headers });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, keywords: [], error: `API Error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const keywordList = data.keywordList || [];

    const results: KeywordSearchVolume[] = keywordList.map((item: any) => ({
      keyword: item.relKeyword,
      monthlyPcSearches: item.monthlyPcQcCnt || 0,
      monthlyMobileSearches: item.monthlyMobileQcCnt || 0,
      totalMonthlySearches: (item.monthlyPcQcCnt || 0) + (item.monthlyMobileQcCnt || 0),
      competitionLevel: item.compIdx || "낮음",
      avgPcClickCount: item.monthlyAvePcClkCnt || 0,
      avgMobileClickCount: item.monthlyAveMobileClkCnt || 0,
      avgPcCtr: item.monthlyAvePcCtr || 0,
      avgMobileCtr: item.monthlyAveMobileCtr || 0,
    }));

    return { success: true, keywords: results };
  } catch (error) {
    return { success: false, keywords: [], error: `Network error: ${(error as Error).message}` };
  }
}

/**
 * 특정 키워드의 광고 경쟁 분석
 * @param keywords - 분석할 키워드 목록
 */
export async function analyzeAdCompetition(keywords: string[]): Promise<CompetitorAdAnalysis[]> {
  const result = await getKeywordSearchVolume(keywords);
  if (!result.success) return [];

  return result.keywords
    .filter((kw) => keywords.some((k) => kw.keyword.includes(k) || k.includes(kw.keyword)))
    .map((kw) => ({
      keyword: kw.keyword,
      adDepth: Math.ceil(kw.avgPcClickCount / Math.max(kw.avgPcCtr, 0.01)),
      competitionLevel: kw.competitionLevel,
    }));
}

/**
 * 진료과 키워드 검색량 일괄 조회
 * 진료과명 + 지역명 조합으로 검색량 파악
 */
export async function getSpecialtyKeywordVolumes(
  specialty: string,
  region?: string
): Promise<KeywordSearchResult> {
  const baseKeywords = [specialty];
  if (region) {
    baseKeywords.push(`${region} ${specialty}`);
    baseKeywords.push(`${region} ${specialty} 추천`);
  } else {
    baseKeywords.push(`${specialty} 추천`);
    baseKeywords.push(`${specialty} 잘하는곳`);
  }

  return getKeywordSearchVolume(baseKeywords);
}

/**
 * 자연검색 vs 광고 비중 분석
 * CTR과 광고 깊이를 기반으로 자연검색 점유율 추정
 */
export function estimateOrganicShare(keywordData: KeywordSearchVolume): {
  organicSharePercent: number;
  adSharePercent: number;
  recommendation: string;
} {
  // 광고 CTR이 높으면 자연검색 점유율이 낮음
  const avgCtr = (keywordData.avgPcCtr + keywordData.avgMobileCtr) / 2;
  
  // 경쟁도에 따른 광고 점유율 추정
  let adShare: number;
  switch (keywordData.competitionLevel) {
    case "높음":
      adShare = 60 + avgCtr * 10;
      break;
    case "중간":
      adShare = 40 + avgCtr * 10;
      break;
    default:
      adShare = 20 + avgCtr * 10;
  }
  adShare = Math.min(adShare, 85);

  const organicShare = 100 - adShare;

  let recommendation: string;
  if (organicShare < 30) {
    recommendation = "광고 비중이 매우 높은 키워드입니다. SEO 최적화와 함께 광고 집행을 병행하는 것이 효과적입니다.";
  } else if (organicShare < 50) {
    recommendation = "광고와 자연검색이 혼재된 키워드입니다. SEO 최적화로 자연검색 노출을 강화하면 광고비를 절감할 수 있습니다.";
  } else {
    recommendation = "자연검색 비중이 높은 키워드입니다. SEO 최적화만으로도 충분한 노출 효과를 기대할 수 있습니다.";
  }

  return {
    organicSharePercent: Math.round(organicShare),
    adSharePercent: Math.round(adShare),
    recommendation,
  };
}

/**
 * 키워드 마케팅 가치 산출
 * 검색량 × CTR × 전환율 × 객단가로 월간 마케팅 가치 추정
 */
export function calculateKeywordMarketingValue(
  keywordData: KeywordSearchVolume,
  conversionRate: number = 0.03, // 기본 전환율 3%
  avgRevenue: number = 300000 // 기본 객단가 30만원
): {
  monthlyPotentialRevenue: number;
  monthlyPotentialPatients: number;
  valuePerClick: number;
} {
  const totalClicks = keywordData.avgPcClickCount + keywordData.avgMobileClickCount;
  const monthlyPatients = Math.round(totalClicks * conversionRate);
  const monthlyRevenue = monthlyPatients * avgRevenue;
  const valuePerClick = totalClicks > 0 ? Math.round(monthlyRevenue / totalClicks) : 0;

  return {
    monthlyPotentialRevenue: monthlyRevenue,
    monthlyPotentialPatients: monthlyPatients,
    valuePerClick,
  };
}

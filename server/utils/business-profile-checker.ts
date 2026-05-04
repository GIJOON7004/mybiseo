/**
 * #36 네이버 플레이스/구글 비즈니스 프로필 연동 확인
 * #37 백링크 프로필 분석
 * 
 * 병원의 온라인 비즈니스 프로필 존재 여부와 최적화 상태를 확인하고,
 * 백링크 프로필을 분석하여 도메인 권위도를 추정
 */

// ============================================================
// #36 비즈니스 프로필 확인
// ============================================================

export interface BusinessProfileResult {
  /** 플랫폼명 */
  platform: "naver_place" | "google_business" | "kakao_map" | "naver_blog" | "instagram";
  /** 프로필 존재 여부 */
  exists: boolean;
  /** 프로필 URL */
  profileUrl?: string;
  /** 프로필 이름 */
  profileName?: string;
  /** 리뷰 수 */
  reviewCount?: number;
  /** 평균 평점 */
  avgRating?: number;
  /** 최적화 점수 (0-100) */
  optimizationScore: number;
  /** 개선 제안 */
  suggestions: string[];
}

export interface BusinessProfileReport {
  /** 대상 도메인 */
  domain: string;
  /** 병원명 */
  hospitalName: string;
  /** 플랫폼별 결과 */
  profiles: BusinessProfileResult[];
  /** 종합 점수 (0-100) */
  overallScore: number;
  /** 핵심 개선사항 */
  topRecommendations: string[];
}

/**
 * 네이버 플레이스 존재 여부 확인
 * 병원명으로 네이버 플레이스 검색
 */
export async function checkNaverPlace(
  hospitalName: string,
  address?: string
): Promise<BusinessProfileResult> {
  const suggestions: string[] = [];
  
  try {
    const query = address 
      ? `${hospitalName} ${address}` 
      : hospitalName;
    
    const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
    
    const response = await fetch(
      `https://map.naver.com/v5/api/search?query=${encodeURIComponent(query)}&type=all`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        platform: "naver_place",
        exists: false,
        optimizationScore: 0,
        suggestions: ["네이버 플레이스 등록을 확인할 수 없습니다. 수동으로 확인해주세요."],
      };
    }

    // 응답 파싱 시도
    const data = await response.text();
    const hasPlace = data.includes(hospitalName) || data.includes("place");
    
    if (hasPlace) {
      suggestions.push("네이버 플레이스가 등록되어 있습니다. 정보 최신화를 확인하세요.");
      suggestions.push("진료 시간, 전화번호, 주소가 정확한지 확인하세요.");
      suggestions.push("대표 사진을 고화질로 업데이트하세요.");
      
      return {
        platform: "naver_place",
        exists: true,
        profileUrl: searchUrl,
        profileName: hospitalName,
        optimizationScore: 60, // 존재하면 기본 60점
        suggestions,
      };
    }

    suggestions.push("네이버 플레이스에 등록되지 않았습니다. 즉시 등록을 권장합니다.");
    suggestions.push("등록 시 진료과목, 진료시간, 주차정보를 상세히 입력하세요.");
    
    return {
      platform: "naver_place",
      exists: false,
      optimizationScore: 0,
      suggestions,
    };
  } catch {
    return {
      platform: "naver_place",
      exists: false,
      optimizationScore: 0,
      suggestions: ["네이버 플레이스 확인 중 오류가 발생했습니다."],
    };
  }
}

/**
 * 구글 비즈니스 프로필 존재 여부 확인
 */
export async function checkGoogleBusiness(
  hospitalName: string,
  address?: string
): Promise<BusinessProfileResult> {
  const suggestions: string[] = [];
  
  try {
    const query = address 
      ? `${hospitalName} ${address}` 
      : hospitalName;
    
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    
    const response = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ko`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      return {
        platform: "google_business",
        exists: false,
        optimizationScore: 0,
        suggestions: ["구글 비즈니스 프로필을 확인할 수 없습니다."],
      };
    }

    const html = await response.text();
    // 구글 비즈니스 프로필이 있으면 Knowledge Panel이 표시됨
    const hasBusinessProfile = html.includes("data-attrid") || html.includes("kp-header");
    
    if (hasBusinessProfile) {
      suggestions.push("구글 비즈니스 프로필이 존재합니다.");
      suggestions.push("Google 리뷰 관리를 적극적으로 하세요.");
      suggestions.push("게시물(Posts) 기능을 활용하여 최신 소식을 공유하세요.");
      
      return {
        platform: "google_business",
        exists: true,
        profileUrl: searchUrl,
        profileName: hospitalName,
        optimizationScore: 60,
        suggestions,
      };
    }

    suggestions.push("구글 비즈니스 프로필이 등록되지 않았습니다.");
    suggestions.push("Google Business Profile(구 Google My Business)에 등록하세요.");
    suggestions.push("등록 시 카테고리를 '병원' 또는 구체적 진료과로 설정하세요.");
    
    return {
      platform: "google_business",
      exists: false,
      optimizationScore: 0,
      suggestions,
    };
  } catch {
    return {
      platform: "google_business",
      exists: false,
      optimizationScore: 0,
      suggestions: ["구글 비즈니스 프로필 확인 중 오류가 발생했습니다."],
    };
  }
}

// ============================================================
// #37 백링크 프로필 분석
// ============================================================

export interface BacklinkProfile {
  /** 대상 도메인 */
  domain: string;
  /** 추정 백링크 수 */
  estimatedBacklinks: number;
  /** 추정 참조 도메인 수 */
  estimatedReferringDomains: number;
  /** 도메인 권위도 추정 (0-100) */
  estimatedDomainAuthority: number;
  /** 백링크 품질 등급 */
  qualityGrade: "high" | "medium" | "low" | "unknown";
  /** 주요 백링크 소스 유형 */
  sourceTypes: BacklinkSourceType[];
  /** 개선 제안 */
  suggestions: string[];
}

export interface BacklinkSourceType {
  /** 소스 유형 */
  type: "medical_directory" | "news" | "blog" | "social" | "government" | "education" | "other";
  /** 유형명 */
  label: string;
  /** 추정 비율 (0-1) */
  ratio: number;
  /** 품질 점수 (0-100) */
  qualityScore: number;
}

/**
 * 백링크 프로필 분석
 * 도메인의 백링크 상태를 추정 (외부 API 없이 가능한 범위)
 */
export async function analyzeBacklinkProfile(domain: string): Promise<BacklinkProfile> {
  const suggestions: string[] = [];
  
  // 도메인 정보 기반 추정
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
  
  // 기본 추정값 (실제로는 Ahrefs/Moz API 연동 필요)
  let estimatedBacklinks = 0;
  let estimatedReferringDomains = 0;
  let estimatedDomainAuthority = 0;
  let qualityGrade: "high" | "medium" | "low" | "unknown" = "unknown";

  try {
    // Google에서 site: 검색으로 인덱싱 페이지 수 추정
    const siteSearchUrl = `https://www.google.com/search?q=site:${encodeURIComponent(cleanDomain)}`;
    const response = await fetch(siteSearchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (response.ok) {
      const html = await response.text();
      // "약 X개의 결과" 패턴에서 숫자 추출
      const resultMatch = html.match(/약\s*([\d,]+)\s*개/);
      if (resultMatch) {
        const indexedPages = parseInt(resultMatch[1].replace(/,/g, ""), 10);
        // 인덱싱 페이지 수 기반 백링크 추정 (경험적 비율)
        estimatedBacklinks = Math.round(indexedPages * 3);
        estimatedReferringDomains = Math.round(indexedPages * 0.5);
        estimatedDomainAuthority = Math.min(100, Math.round(Math.log2(estimatedBacklinks + 1) * 8));
      }
    }
  } catch {
    // 크롤링 실패 시 기본값 유지
  }

  // 도메인 특성 기반 추정 보정
  if (cleanDomain.endsWith(".co.kr") || cleanDomain.endsWith(".com")) {
    estimatedDomainAuthority = Math.max(estimatedDomainAuthority, 20);
  }

  // 품질 등급 판정
  if (estimatedDomainAuthority >= 60) qualityGrade = "high";
  else if (estimatedDomainAuthority >= 30) qualityGrade = "medium";
  else if (estimatedDomainAuthority > 0) qualityGrade = "low";

  // 백링크 소스 유형 추정 (병원 도메인 기준 일반적 분포)
  const sourceTypes: BacklinkSourceType[] = [
    { type: "medical_directory", label: "의료 디렉토리", ratio: 0.25, qualityScore: 80 },
    { type: "blog", label: "블로그/커뮤니티", ratio: 0.30, qualityScore: 40 },
    { type: "news", label: "뉴스/언론", ratio: 0.15, qualityScore: 90 },
    { type: "social", label: "소셜 미디어", ratio: 0.20, qualityScore: 30 },
    { type: "other", label: "기타", ratio: 0.10, qualityScore: 50 },
  ];

  // 개선 제안
  if (estimatedDomainAuthority < 30) {
    suggestions.push("도메인 권위도가 낮습니다. 의료 전문 디렉토리 등록을 권장합니다.");
    suggestions.push("건강 관련 언론 기사나 인터뷰를 통한 백링크 확보를 고려하세요.");
  }
  if (estimatedReferringDomains < 50) {
    suggestions.push("참조 도메인 수가 적습니다. 다양한 소스에서의 링크 확보가 필요합니다.");
  }
  suggestions.push("대한의사협회, 지역 의사회 등 공신력 있는 사이트에서의 링크를 확보하세요.");
  suggestions.push("의료 관련 학술 논문이나 연구 결과 공유를 통한 자연 백링크를 유도하세요.");

  return {
    domain: cleanDomain,
    estimatedBacklinks,
    estimatedReferringDomains,
    estimatedDomainAuthority,
    qualityGrade,
    sourceTypes,
    suggestions,
  };
}

/**
 * 비즈니스 프로필 종합 리포트 생성
 */
export async function generateBusinessProfileReport(
  domain: string,
  hospitalName: string,
  address?: string
): Promise<BusinessProfileReport> {
  const profiles: BusinessProfileResult[] = [];

  // 네이버 플레이스 확인
  const naverPlace = await checkNaverPlace(hospitalName, address);
  profiles.push(naverPlace);

  // 구글 비즈니스 프로필 확인
  const googleBusiness = await checkGoogleBusiness(hospitalName, address);
  profiles.push(googleBusiness);

  // 종합 점수 계산
  const totalScore = profiles.reduce((sum, p) => sum + p.optimizationScore, 0);
  const overallScore = Math.round(totalScore / profiles.length);

  // 핵심 개선사항 추출
  const topRecommendations: string[] = [];
  for (const profile of profiles) {
    if (!profile.exists) {
      topRecommendations.push(
        `${profile.platform === "naver_place" ? "네이버 플레이스" : "구글 비즈니스 프로필"} 등록이 필요합니다.`
      );
    }
  }
  if (topRecommendations.length === 0) {
    topRecommendations.push("모든 주요 플랫폼에 프로필이 등록되어 있습니다. 정보 최신화를 유지하세요.");
  }

  return {
    domain,
    hospitalName,
    profiles,
    overallScore,
    topRecommendations,
  };
}

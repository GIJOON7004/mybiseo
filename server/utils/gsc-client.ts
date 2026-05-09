import { ENV } from "../_core/env";
/**
 * Google Search Console API 클라이언트
 * 
 * 서비스 계정 JSON 키가 환경변수(GOOGLE_SERVICE_ACCOUNT_KEY)로 제공되면
 * 자동으로 인증하여 Search Analytics 데이터를 조회합니다.
 * 
 * 키가 없는 경우 graceful하게 null을 반환합니다.
 */

interface GSCQueryParams {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dimensions?: ("query" | "page" | "country" | "device" | "date")[];
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: Array<{
    groupType?: "and" | "or";
    filters: Array<{
      dimension: string;
      operator: "equals" | "contains" | "notContains" | "includingRegex" | "excludingRegex";
      expression: string;
    }>;
  }>;
}

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCResponse {
  rows: GSCRow[];
  responseAggregationType: string;
}

interface GSCError {
  code: string;
  message: string;
}

type GSCResult = 
  | { success: true; data: GSCResponse }
  | { success: false; error: GSCError };

/**
 * Google OAuth2 토큰을 서비스 계정 JSON 키로 발급받습니다.
 */
async function getAccessToken(serviceAccountKey: string): Promise<string | null> {
  try {
    const key = JSON.parse(serviceAccountKey);
    const { client_email, private_key } = key;
    
    if (!client_email || !private_key) {
      console.warn("[GSC] 서비스 계정 키에 client_email 또는 private_key가 없습니다.");
      return null;
    }

    // JWT 생성을 위한 헤더와 클레임
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    // Node.js crypto를 사용한 JWT 서명
    const crypto = await import("crypto");
    const base64url = (obj: object) => 
      Buffer.from(JSON.stringify(obj)).toString("base64url");
    
    const unsignedToken = `${base64url(header)}.${base64url(claim)}`;
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(unsignedToken);
    const signature = sign.sign(private_key, "base64url");
    const jwt = `${unsignedToken}.${signature}`;

    // 토큰 교환
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      console.warn("[GSC] 토큰 발급 실패:", tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    return tokenData.access_token;
  } catch (e) {
    console.warn("[GSC] 토큰 발급 중 오류:", (e as Error).message);
    return null;
  }
}

/**
 * Google Search Console Search Analytics API를 호출합니다.
 */
export async function querySearchAnalytics(params: GSCQueryParams): Promise<GSCResult> {
  const serviceAccountKey = ENV.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    return {
      success: false,
      error: {
        code: "NO_CREDENTIALS",
        message: "GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다. Google Cloud Console에서 서비스 계정을 생성하고 JSON 키를 제공해주세요.",
      },
    };
  }

  const accessToken = await getAccessToken(serviceAccountKey);
  if (!accessToken) {
    return {
      success: false,
      error: {
        code: "AUTH_FAILED",
        message: "서비스 계정 인증에 실패했습니다. JSON 키가 올바른지 확인해주세요.",
      },
    };
  }

  try {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(params.siteUrl)}/searchAnalytics/query`;
    
    const body: Record<string, unknown> = {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions || ["query"],
      rowLimit: params.rowLimit || 25,
    };

    if (params.startRow) body.startRow = params.startRow;
    if (params.dimensionFilterGroups) body.dimensionFilterGroups = params.dimensionFilterGroups;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.error?.message || `HTTP ${response.status} 오류`,
        },
      };
    }

    const data = await response.json() as GSCResponse;
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: (e as Error).message,
      },
    };
  }
}

/**
 * GSC 연동 상태를 확인합니다.
 */
export function getGSCStatus(): { available: boolean; reason?: string } {
  const key = ENV.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    return { available: false, reason: "GOOGLE_SERVICE_ACCOUNT_KEY 환경변수 미설정" };
  }
  try {
    const parsed = JSON.parse(key);
    if (!parsed.client_email || !parsed.private_key) {
      return { available: false, reason: "서비스 계정 키에 필수 필드 누락" };
    }
    return { available: true };
  } catch {
    return { available: false, reason: "서비스 계정 키 JSON 파싱 실패" };
  }
}

/**
 * 특정 사이트의 검색 성과 요약을 조회합니다.
 */
export async function getSitePerformanceSummary(siteUrl: string, days: number = 28): Promise<GSCResult> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return querySearchAnalytics({
    siteUrl,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    dimensions: ["query"],
    rowLimit: 50,
  });
}

export type { GSCQueryParams, GSCRow, GSCResponse, GSCResult };

import { describe, it, expect } from "vitest";
import crypto from "crypto";

/**
 * 네이버 검색광고 API 키 검증 테스트
 * RelKwdStat API를 호출하여 키가 유효한지 확인
 */

const BASE_URL = "https://api.searchad.naver.com";
const API_KEY = process.env.NAVER_AD_API_ACCESS_LICENSE || "";
const SECRET_KEY = process.env.NAVER_AD_API_SECRET_KEY || "";
const CUSTOMER_ID = process.env.NAVER_AD_API_CUSTOMER_ID || "";

function generateSignature(timestamp: string, method: string, path: string): string {
  const message = `${timestamp}.${method}.${path}`;
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(message);
  return hmac.digest("base64");
}

describe("네이버 검색광고 API 키 검증", () => {
  it("환경변수가 설정되어 있어야 함", () => {
    expect(API_KEY).toBeTruthy();
    expect(SECRET_KEY).toBeTruthy();
    expect(CUSTOMER_ID).toBeTruthy();
  });

  it("RelKwdStat API 호출이 성공해야 함 (키워드 검색량 조회)", async () => {
    const timestamp = String(Date.now());
    const method = "GET";
    const path = "/keywordstool";
    const signature = generateSignature(timestamp, method, path);

    const url = `${BASE_URL}${path}?hintKeywords=치과&showDetail=1`;

    const response = await fetch(url, {
      method,
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": API_KEY,
        "X-Customer": CUSTOMER_ID,
        "X-Signature": signature,
      },
    });

    // 200이면 성공, 401/403이면 키 문제
    console.log(`네이버 API 응답 상태: ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      const body = await response.text();
      console.error("인증 실패:", body);
    }

    expect(response.status).toBe(200);

    const data = await response.json();
    console.log("키워드 결과 샘플:", JSON.stringify(data).slice(0, 500));
    
    // keywordList가 있어야 함
    expect(data.keywordList).toBeDefined();
    expect(data.keywordList.length).toBeGreaterThan(0);
  }, 15000);
});

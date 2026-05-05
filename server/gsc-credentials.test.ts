/**
 * Google Search Console 서비스 계정 키 유효성 검증 테스트
 * 
 * 이 테스트는 GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 올바르게 설정되었는지,
 * 그리고 해당 키로 OAuth2 토큰을 발급받을 수 있는지 검증합니다.
 */
import { describe, it, expect } from "vitest";

describe("Google Search Console Credentials Validation", () => {
  it("GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 설정되어 있어야 한다", () => {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(100);
  });

  it("서비스 계정 키가 유효한 JSON 형식이어야 한다", () => {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
    const parsed = JSON.parse(key);
    expect(parsed).toBeDefined();
    expect(parsed.type).toBe("service_account");
    expect(parsed.project_id).toBe("mybiseo-api");
    expect(parsed.client_email).toBe("mybiseo-gsc-reader@mybiseo-api.iam.gserviceaccount.com");
    expect(parsed.private_key).toContain("-----BEGIN PRIVATE KEY-----");
    expect(parsed.private_key).toContain("-----END PRIVATE KEY-----");
    expect(parsed.token_uri).toBe("https://oauth2.googleapis.com/token");
  });

  it("서비스 계정 키로 OAuth2 액세스 토큰을 발급받을 수 있어야 한다", async () => {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
    const { client_email, private_key } = key;

    // JWT 생성
    const crypto = await import("crypto");
    const base64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");

    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

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

    expect(tokenResponse.ok).toBe(true);
    const tokenData = await tokenResponse.json() as { access_token: string; token_type: string };
    expect(tokenData.access_token).toBeDefined();
    expect(tokenData.access_token.length).toBeGreaterThan(50);
    expect(tokenData.token_type).toBe("Bearer");
  }, 15000);

  it("getGSCStatus()가 available: true를 반환해야 한다", async () => {
    const { getGSCStatus } = await import("./utils/gsc-client");
    const status = getGSCStatus();
    expect(status.available).toBe(true);
    expect(status.reason).toBeUndefined();
  });
});

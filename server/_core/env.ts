import { z } from "zod";

/**
 * 환경변수 스키마 — 필수(required)와 선택(optional)을 명시적으로 구분
 * 서버 시작 시 필수 환경변수가 누락되면 즉시 실패하여 런타임 오류 방지
 */
const envSchema = z.object({
  // ─── 필수: 서버 동작에 반드시 필요 ───
  VITE_APP_ID: z.string().min(1, "VITE_APP_ID is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OAUTH_SERVER_URL: z.string().url("OAUTH_SERVER_URL must be a valid URL"),
  OWNER_OPEN_ID: z.string().min(1, "OWNER_OPEN_ID is required"),
  BUILT_IN_FORGE_API_URL: z.string().min(1, "BUILT_IN_FORGE_API_URL is required"),
  BUILT_IN_FORGE_API_KEY: z.string().min(1, "BUILT_IN_FORGE_API_KEY is required"),

  // ─── 선택: 없으면 해당 기능 비활성화 ───
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NOTIFIER_SMTP_USER: z.string().default(""),
  NOTIFIER_SMTP_PASS: z.string().default(""),
  SOLAPI_API_KEY: z.string().default(""),
  SOLAPI_API_SECRET: z.string().default(""),
  NOTIFY_EMAIL: z.string().default(""),
  NOTIFY_PHONE: z.string().default(""),
  KAKAO_JS_KEY: z.string().default(""),
  GOOGLE_PAGESPEED_API_KEY: z.string().default(""),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().default(""),
  NAVER_AD_API_ACCESS_LICENSE: z.string().default(""),
  NAVER_AD_API_CUSTOMER_ID: z.string().default(""),
  NAVER_AD_API_SECRET_KEY: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment variable validation failed:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  // 프로덕션에서는 서버 시작 차단, 개발 환경에서는 경고만
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const env = parsed.success ? parsed.data : envSchema.parse({
  ...process.env,
  // 개발 환경 fallback — 필수 값이 없어도 빈 문자열로 진행
  VITE_APP_ID: process.env.VITE_APP_ID || "dev-app-id",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  DATABASE_URL: process.env.DATABASE_URL || "mysql://localhost:3306/dev",
  OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL || "http://localhost:4000",
  OWNER_OPEN_ID: process.env.OWNER_OPEN_ID || "dev-owner",
  BUILT_IN_FORGE_API_URL: process.env.BUILT_IN_FORGE_API_URL || "http://localhost:5000",
  BUILT_IN_FORGE_API_KEY: process.env.BUILT_IN_FORGE_API_KEY || "dev-key",
});

/**
 * 타입 안전한 환경변수 접근 — 기존 ENV 인터페이스 호환
 */
export const ENV = {
  appId: env.VITE_APP_ID,
  cookieSecret: env.JWT_SECRET,
  databaseUrl: env.DATABASE_URL,
  oAuthServerUrl: env.OAUTH_SERVER_URL,
  ownerOpenId: env.OWNER_OPEN_ID,
  isProduction: env.NODE_ENV === "production",
  forgeApiUrl: env.BUILT_IN_FORGE_API_URL,
  forgeApiKey: env.BUILT_IN_FORGE_API_KEY,
  // SMTP (Naver) for email notifications
  naverSmtpUser: env.NOTIFIER_SMTP_USER,
  naverSmtpPass: env.NOTIFIER_SMTP_PASS,
  // Solapi for SMS notifications
  solapiApiKey: env.SOLAPI_API_KEY,
  solapiApiSecret: env.SOLAPI_API_SECRET,
  // Notification targets
  notifyEmail: env.NOTIFY_EMAIL,
  notifyPhone: env.NOTIFY_PHONE,
  // Kakao JS Key
  kakaoJsKey: env.KAKAO_JS_KEY,

  GOOGLE_PAGESPEED_API_KEY: env.GOOGLE_PAGESPEED_API_KEY,
  GOOGLE_SERVICE_ACCOUNT_KEY: env.GOOGLE_SERVICE_ACCOUNT_KEY,
  NAVER_AD_API_ACCESS_LICENSE: env.NAVER_AD_API_ACCESS_LICENSE,
  NAVER_AD_API_CUSTOMER_ID: env.NAVER_AD_API_CUSTOMER_ID,
  NAVER_AD_API_SECRET_KEY: env.NAVER_AD_API_SECRET_KEY,
};

import { z } from "zod";

/**
 * 환경변수 스키마 — 필수(required)와 선택(optional)을 명시적으로 구분
 * 서버 시작 시 필수 환경변수가 누락되면 경고 로그 출력
 * 
 * 참고: 배포 환경(Cloud Run)에서는 일부 환경변수가 플랫폼에 의해 주입되므로
 * process.exit(1)로 강제 종료하면 배포 실패를 유발할 수 있음.
 * 따라서 경고만 출력하고 빈 문자열 fallback으로 진행.
 */
const envSchema = z.object({
  // ─── 핵심: 서버 동작에 필요하지만 배포 환경에서 플랫폼이 주입 ───
  VITE_APP_ID: z.string().default(""),
  JWT_SECRET: z.string().default(""),
  DATABASE_URL: z.string().default(""),
  OAUTH_SERVER_URL: z.string().default(""),
  OWNER_OPEN_ID: z.string().default(""),
  BUILT_IN_FORGE_API_URL: z.string().default(""),
  BUILT_IN_FORGE_API_KEY: z.string().default(""),

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
}

const env = parsed.data ?? envSchema.parse(process.env);

// 핵심 환경변수 누락 경고 (서버는 시작하되, 기능 제한될 수 있음을 알림)
const criticalVars = ["VITE_APP_ID", "JWT_SECRET", "DATABASE_URL", "OAUTH_SERVER_URL", "BUILT_IN_FORGE_API_URL", "BUILT_IN_FORGE_API_KEY"] as const;
for (const key of criticalVars) {
  if (!env[key]) {
    console.warn(`⚠️  Critical env var ${key} is empty — some features may not work`);
  }
}

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

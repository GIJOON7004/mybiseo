export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // SMTP (Naver) for email notifications
  naverSmtpUser: process.env.NOTIFIER_SMTP_USER ?? "",
  naverSmtpPass: process.env.NOTIFIER_SMTP_PASS ?? "",
  // Solapi for SMS notifications
  solapiApiKey: process.env.SOLAPI_API_KEY ?? "",
  solapiApiSecret: process.env.SOLAPI_API_SECRET ?? "",
  // Notification targets
  notifyEmail: process.env.NOTIFY_EMAIL ?? "",
  notifyPhone: process.env.NOTIFY_PHONE ?? "",
  // Kakao JS Key
  kakaoJsKey: process.env.KAKAO_JS_KEY ?? "",

  GOOGLE_PAGESPEED_API_KEY: process.env.GOOGLE_PAGESPEED_API_KEY || "",
  GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "",
  NAVER_AD_API_ACCESS_LICENSE: process.env.NAVER_AD_API_ACCESS_LICENSE || "",
  NAVER_AD_API_CUSTOMER_ID: process.env.NAVER_AD_API_CUSTOMER_ID || "",
  NAVER_AD_API_SECRET_KEY: process.env.NAVER_AD_API_SECRET_KEY || "",
};

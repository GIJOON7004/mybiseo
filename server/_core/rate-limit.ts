/**
 * Rate Limiting 미들웨어
 * 
 * 전역: IP당 15분 100회
 * 진단 API: IP당 1시간 3회 (LLM 호출 비용 보호)
 * 이메일 발송: IP당 1시간 5회
 */
import rateLimit from "express-rate-limit";
import type { Express } from "express";

/** 전역 Rate Limiter — 모든 API 요청에 적용 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100회
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    retryAfter: "15분 후 재시도 가능합니다.",
  },
  skip: (req) => {
    // 정적 파일, 헬스체크는 제외
    return req.path.startsWith("/assets/") || req.path === "/health";
  },
});

/** 진단 API 전용 Rate Limiter — LLM 호출 비용 보호 */
const diagnosisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // IP당 최대 3회
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "진단 요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.",
    retryAfter: "1시간 후 재시도 가능합니다.",
    limit: "시간당 3회까지 무료 진단이 가능합니다.",
  },
  // 기본 keyGenerator 사용 (express-rate-limit 내장 IPv6 처리)
});

/** 이메일 발송 Rate Limiter */
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5, // IP당 최대 5회
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "이메일 발송 한도를 초과했습니다. 1시간 후 다시 시도해주세요.",
    retryAfter: "1시간 후 재시도 가능합니다.",
  },
});

/** 인증 관련 Rate Limiter (로그인 시도 보호) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // IP당 최대 10회
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
});

/**
 * Rate Limiting 미들웨어를 Express 앱에 등록
 * - 전역 limiter는 /api/ 경로에만 적용 (정적 파일 제외)
 * - 진단/이메일/인증은 tRPC 프로시저 이름 기반으로 적용
 */
export function registerRateLimiting(app: Express): void {
  // 전역 API Rate Limit
  app.use("/api/", globalLimiter);

  // 진단 API 전용 (tRPC 프로시저 이름 기반 매칭)
  app.use("/api/trpc/seoAnalyzer", diagnosisLimiter);
  app.use("/api/trpc/seo.analyze", diagnosisLimiter);
  app.use("/api/trpc/seo.generateReport", diagnosisLimiter);

  // 이메일 발송 전용
  app.use("/api/trpc/email.sendReport", emailLimiter);
  app.use("/api/trpc/email.send", emailLimiter);

  // 인증 관련
  app.use("/api/oauth", authLimiter);
}

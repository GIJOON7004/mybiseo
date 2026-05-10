/**
 * server/_core/app.ts — Express 앱 생성 및 미들웨어 등록
 * index.ts에서 서버 시작 로직과 분리하여 테스트 용이성 확보
 */
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerSeoMiddleware } from "../seo-middleware";
import { registerScheduledRoutes } from "../routes/scheduled";
import { registerRateLimiting } from "./rate-limit";
import { appRouter } from "../routers";
import { createContext } from "./context";

// ─── Security Headers ───
function securityHeaders(_req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=(), payment=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.clarity.ms https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://api.manus.im https://*.clarity.ms https://www.google-analytics.com https://*.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.removeHeader("Server");
  next();
}

// ─── CORS Configuration ───
const allowedOrigins = [
  "https://mybiseo.com",
  "https://www.mybiseo.com",
  "https://mybiseo-ynrsyg5s.manus.space",
];

function corsOptions() {
  return cors({
    origin: process.env.NODE_ENV === "production"
      ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
          if (!origin || allowedOrigins.includes(origin)) cb(null, true);
          else cb(new Error("CORS not allowed"));
        }
      : true,
    credentials: true,
  });
}

// ─── Global Error Handler ───
function globalErrorHandler(err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) {
  const isErrorLike = (e: unknown): e is { status?: number; statusCode?: number; message?: string; stack?: string } =>
    typeof e === "object" && e !== null;
  const status = isErrorLike(err) ? (err.status || err.statusCode || 500) : 500;
  const message = isErrorLike(err) ? err.message : undefined;
  const stack = isErrorLike(err) ? err.stack : undefined;
  const isDev = process.env.NODE_ENV === "development";
  console.error(`[Error ${status}]`, isDev ? err : (message || "Unknown error"));
  res.status(status).json({
    error: isDev ? (message || "서버 오류가 발생했습니다.") : "서버 오류가 발생했습니다.",
    ...(isDev && stack && { stack }),
  });
}

/**
 * Express 앱을 생성하고 모든 미들웨어를 등록합니다.
 * 서버 시작(listen)은 포함하지 않아 테스트에서 재사용 가능합니다.
 */
export function createApp(): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Security
  app.use(securityHeaders);
  app.use(corsOptions());

  // Body parser (1MB 제한 — DoS 방지)
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // Rate Limiting (보안 + LLM 비용 보호)
  registerRateLimiting(app);

  // Routes & Middleware
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSeoMiddleware(app);
  registerScheduledRoutes(app);

  // tRPC API — API 응답 캐싱 방지 (ASVS 8.2.1)
  app.use("/api/trpc", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    next();
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Global error handler
  app.use(globalErrorHandler);

  return app;
}

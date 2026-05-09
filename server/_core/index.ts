import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerSeoMiddleware } from "../seo-middleware";
import { registerScheduledRoutes } from "../routes/scheduled";
import { registerRateLimiting } from "./rate-limit";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // 프록시 환경에서 정확한 클라이언트 IP 식별
  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.removeHeader("Server");
    next();
  });
  const server = createServer(app);
  // CORS — 프로덕션 도메인 + 개발 환경 허용
  const allowedOrigins = [
    "https://mybiseo.com",
    "https://www.mybiseo.com",
    "https://mybiseo-ynrsyg5s.manus.space",
  ];
  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) cb(null, true);
          else cb(new Error("CORS not allowed"));
        }
      : true,
    credentials: true,
  }));

  // Body parser (1MB 제한 — DoS 방지)
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  // Rate Limiting (보안 + LLM 비용 보호)
  registerRateLimiting(app);

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Phase 0: SEO 미들웨어 (sitemap, robots.txt, AI 크롤러 대응)
  registerSeoMiddleware(app);
  // Heartbeat cron 콜백 라우트
  registerScheduledRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Global error handler — production에서 stack trace 노출 방지
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const isDev = process.env.NODE_ENV === "development";
    console.error(`[Error ${status}]`, isDev ? err : err.message);
    res.status(status).json({
      error: err.message || "서버 오류가 발생했습니다.",
      ...(isDev && { stack: err.stack }),
    });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
import { closeDb } from "../db";

// ─── Global Error Handlers ───
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception:", error);
  // 프로세스를 즉시 종료하지 않고 graceful shutdown 시도
  setTimeout(() => process.exit(1), 3000);
});

const shutdown = async (signal: string) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  await closeDb();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

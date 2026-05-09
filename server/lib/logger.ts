/**
 * lib/logger.ts — 구조화된 로거
 * console.log/warn/error 래퍼 — JSON 형식 출력으로 운영 환경에서 파싱 용이
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function normalizeMeta(meta: unknown): Record<string, unknown> {
  if (!meta) return {};
  if (typeof meta === "object" && meta !== null && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return { data: meta };
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function createLogger(module: string) {
  return {
    info(message: string, meta?: unknown) {
      console.log(formatEntry({ level: "info", module, message, timestamp: new Date().toISOString(), ...normalizeMeta(meta) }));
    },
    warn(message: string, meta?: unknown) {
      console.warn(formatEntry({ level: "warn", module, message, timestamp: new Date().toISOString(), ...normalizeMeta(meta) }));
    },
    error(message: string, meta?: unknown) {
      console.error(formatEntry({ level: "error", module, message, timestamp: new Date().toISOString(), ...normalizeMeta(meta) }));
    },
    debug(message: string, meta?: unknown) {
      if (process.env.NODE_ENV !== "production") {
        console.log(formatEntry({ level: "debug", module, message, timestamp: new Date().toISOString(), ...normalizeMeta(meta) }));
      }
    },
  };
}

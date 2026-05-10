/**
 * server/db.ts — Thin Re-export Facade
 * 
 * 모든 실제 구현은 server/db/ 도메인 모듈에 위치합니다.
 * 이 파일은 하위 호환성을 위해 모든 모듈을 re-export합니다.
 * 새 코드에서는 직접 도메인 모듈을 import하세요:
 *   import { saveDiagnosisHistory } from "./db/diagnosis";
 */

export * from "./db/abtest";
export * from "./db/ad";
export * from "./db/admin";
export * from "./db/ai-content";
export * from "./db/ai-monitor";
export * from "./db/automation";
export * from "./db/benchmark";
export * from "./db/benchmarking-report";
export * from "./db/booking";
export * from "./db/briefing";
export * from "./db/chat";
export * from "./db/competitor";
export * from "./db/consultation";
export * from "./db/content";
export * from "./db/content-factory";
export * from "./db/diagnosis";
export * from "./db/email";
export * from "./db/hospital";
export * from "./db/inquiry";
export * from "./db/interview";
export * from "./db/lead";
export * from "./db/marketing";
export * from "./db/misc";
export * from "./db/monthly-report";
export * from "./db/newsletter";
export * from "./db/seasonal";
export * from "./db/site-visit";
export * from "./db/treatment";
export * from "./db/user";
export * from "./db/user-event";
export { getDb, closeDb } from "./db/connection";

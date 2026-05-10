/**
 * db/connection.ts — DB 커넥션 관리
 * 순환 참조 방지를 위해 db.ts에서 분리
 */
import { drizzle } from "drizzle-orm/mysql2";

import { createLogger } from "../lib/logger";
const logger = createLogger("db-connection");

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL + "&connectionLimit=10&connectTimeout=10000&waitForConnections=true");
    } catch (error) {
      logger.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    try {
      const client = (_db as any).$client;
      if (client && typeof client.end === "function") {
        await client.end();
      }
    } catch (e) {
      logger.warn("[Database] Error closing pool:", e);
    }
    _db = null;
  }
}

"""
db.ts 분리 스크립트 v2 — 순환 참조 방지 전략:
1. getDb + closeDb를 server/db/connection.ts로 분리
2. 도메인 모듈은 connection.ts에서 getDb를 import
3. db.ts는 connection.ts + 도메인 모듈을 모두 re-export (하위 호환)
"""
import os, re

BASE = "/home/ubuntu/mybiseo"

def read(path):
    with open(os.path.join(BASE, path), "r") as f:
        return f.read()

def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"  Written: {path} ({len(content.splitlines())} lines)")

# Step 1: connection.ts 생성 (getDb + closeDb)
print("\n=== Step 1: connection.ts 생성 ===")
connection_ts = '''/**
 * db/connection.ts — DB 커넥션 관리
 * 순환 참조 방지를 위해 db.ts에서 분리
 */
import { drizzle } from "drizzle-orm/mysql2";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL + "&connectionLimit=10&connectTimeout=10000&waitForConnections=true");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
      console.warn("[Database] Error closing pool:", e);
    }
    _db = null;
  }
}
'''
write("server/db/connection.ts", connection_ts)

# Step 2: db.ts 읽기 및 도메인별 함수 범위 파악
print("\n=== Step 2: db.ts 도메인 분석 ===")
db_content = read("server/db.ts")
lines = db_content.split("\n")

# 함수 시작 위치 파악
func_starts = []
for i, line in enumerate(lines):
    if line.startswith("export async function ") or line.startswith("export function "):
        match = re.match(r'export (?:async )?function (\w+)', line)
        if match:
            func_starts.append((i, match.group(1)))

# 함수 끝 위치 파악 (다음 함수 시작 전까지)
func_ranges = []
for idx, (start, name) in enumerate(func_starts):
    if idx + 1 < len(func_starts):
        end = func_starts[idx + 1][0] - 1
    else:
        end = len(lines) - 1
    # re-export 라인 제외
    while end > start and (lines[end].strip() == "" or lines[end].startswith("// ─── 분리된")):
        end -= 1
    func_ranges.append((start, end, name))

# 도메인 분류
domains = {
    "chat": ["createChatSession", "getChatSessions", "getChatMessages", "addChatMessage", "deleteChatSession", "updateChatSessionTitle", "getChatSessionById"],
    "lead": ["createSeoLead", "getSeoLeads", "updateSeoLeadStatus", "getSeoLeadStats", "calculateLeadPriority"],
    "hospital": [],  # hospital로 시작하는 모든 함수
    "ad": [],  # Ad/ad로 시작하는 모든 함수
    "interview": [],  # Interview/interview로 시작하는 모든 함수
    "abtest": [],  # Ab/ab/experiment로 시작하는 모든 함수
}

# 자동 분류
for start, end, name in func_ranges:
    lower = name.lower()
    if lower.startswith("hospital") or lower.startswith("gethospital") or lower.startswith("createhospital") or lower.startswith("updatehospital") or lower.startswith("deletehospital") or "hospitalprofile" in lower or "hospitalinfo" in lower:
        domains["hospital"].append(name)
    elif lower.startswith("ad") or lower.startswith("getad") or lower.startswith("createad") or lower.startswith("deletead") or lower.startswith("updatead") or "adbrand" in lower or "adcreative" in lower:
        domains["ad"].append(name)
    elif lower.startswith("interview") or lower.startswith("getinterview") or lower.startswith("createinterview") or lower.startswith("deleteinterview") or lower.startswith("updateinterview"):
        domains["interview"].append(name)
    elif lower.startswith("ab") or lower.startswith("experiment") or lower.startswith("getab") or lower.startswith("createab") or "abexperiment" in lower or "abvariant" in lower or "abevent" in lower or "diagnosisautomation" in lower:
        domains["abtest"].append(name)

# 도메인별 함수 추출 및 파일 생성
print("\n=== Step 3: 도메인별 모듈 생성 ===")

# 이미 분리된 content.ts는 건드리지 않음
existing_modules = set()
if os.path.exists(os.path.join(BASE, "server/db/content.ts")):
    existing_modules.add("content")

for domain, func_names in domains.items():
    if domain in existing_modules:
        continue
    if not func_names:
        continue
    
    # 해당 도메인의 함수 코드 추출
    domain_code_parts = []
    for start, end, name in func_ranges:
        if name in func_names:
            domain_code_parts.append("\n".join(lines[start:end+1]))
    
    if not domain_code_parts:
        continue
    
    # 모듈 파일 생성
    module_content = f'''/**
 * db/{domain}.ts — {domain} 도메인 쿼리 헬퍼
 * db.ts에서 자동 추출됨 (순환 참조 방지: connection.ts에서 getDb import)
 */
import {{ eq, desc, and, gte, lte, sql, count, lt, ne, isNull, or, asc, between, like, inArray }} from "drizzle-orm";
import {{ getDb }} from "./connection";
import * as schema from "../../drizzle/schema";

'''
    # 함수 코드에서 bare schema 테이블명을 schema.xxx로 변환
    for code in domain_code_parts:
        module_content += code + "\n\n"
    
    write(f"server/db/{domain}.ts", module_content)

# Step 4: db.ts에서 getDb/closeDb를 connection.ts에서 re-export하도록 수정
print("\n=== Step 4: db.ts 수정 — connection.ts re-export 추가 ===")

# db.ts 끝에 이미 re-export가 있는지 확인
if "export * from" not in db_content:
    # 끝에 re-export 추가
    reexport_block = '''
// ─── 분리된 도메인 모듈 re-export (하위 호환) ───
export { getDb, closeDb } from "./db/connection";
export * from "./db/chat";
export * from "./db/lead";
export * from "./db/hospital";
export * from "./db/ad";
export * from "./db/interview";
export * from "./db/abtest";
export * from "./db/content";
'''
    db_content += reexport_block
    write("server/db.ts", db_content)
else:
    # 이미 re-export 있으면 connection re-export만 추가
    if "connection" not in db_content:
        db_content = db_content.replace(
            '// ─── 분리된 도메인 모듈 re-export',
            'export { getDb, closeDb } from "./db/connection";\n// ─── 분리된 도메인 모듈 re-export'
        )
        write("server/db.ts", db_content)

print("\n=== 완료 ===")
print("주의: 분리된 모듈에서 bare schema 테이블명(예: blogPosts)을 schema.blogPosts로 변환 필요")
print("     이 작업은 별도 스크립트로 처리합니다.")

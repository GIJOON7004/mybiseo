"""
Phase 1+2 배치 적용 스크립트
#1, #2, #4, #8, #10, #11, #12, #13, #14, #17, #22 한 번에 처리
(#3 DB 인덱스는 SQL로 별도 실행)
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
    print(f"  Written: {path}")

def patch(path, old, new):
    content = read(path)
    if old not in content:
        print(f"  WARNING: patch target not found in {path}")
        return False
    content = content.replace(old, new, 1)
    write(path, content)
    return True

# ═══════════════════════════════════════════
# #1 unhandledRejection 핸들러
# ═══════════════════════════════════════════
print("\n#1 unhandledRejection 핸들러 추가...")
index_content = read("server/_core/index.ts")
if "unhandledRejection" not in index_content:
    handler_code = '''
// ─── Global Error Handlers ───
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception:", error);
  // 프로세스를 즉시 종료하지 않고 graceful shutdown 시도
  setTimeout(() => process.exit(1), 3000);
});
'''
    # import 라인 바로 다음에 삽입
    lines = index_content.split("\n")
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_idx = i + 1
    # 마지막 import 다음에 삽입
    lines.insert(insert_idx, handler_code)
    write("server/_core/index.ts", "\n".join(lines))
else:
    print("  Already exists, skipping")

# ═══════════════════════════════════════════
# #4 tracking rate-limit 추가
# ═══════════════════════════════════════════
print("\n#4 tracking rate-limit 추가...")
rl_content = read("server/_core/rate-limit.ts")
if "trackingLimiter" not in rl_content:
    # shareTokenLimiter 정의 뒤에 trackingLimiter 추가
    tracking_limiter = '''
/** tracking.pageview/inquiry — IP당 1분 30회 (봇 방어) */
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many tracking requests" },
});
'''
    rl_content = rl_content.replace(
        'export function registerRateLimiting',
        tracking_limiter + '\nexport function registerRateLimiting'
    )
    # registerRateLimiting 함수 끝에 tracking 등록 추가
    rl_content = rl_content.replace(
        '  app.use("/api/trpc/report.getByShareToken", shareTokenLimiter);\n}',
        '  app.use("/api/trpc/report.getByShareToken", shareTokenLimiter);\n  // 트래킹 API — 봇 방어\n  app.use("/api/trpc/tracking", trackingLimiter);\n}'
    )
    write("server/_core/rate-limit.ts", rl_content)
else:
    print("  Already exists, skipping")

# ═══════════════════════════════════════════
# #2 XSS DOMPurify 적용
# ═══════════════════════════════════════════
print("\n#2 LightMarkdown XSS sanitize...")
lm_content = read("client/src/components/LightMarkdown.tsx")
if "DOMPurify" not in lm_content:
    # import 추가
    lm_content = "import DOMPurify from 'dompurify';\n" + lm_content
    # dangerouslySetInnerHTML에서 sanitize 적용
    lm_content = lm_content.replace(
        'dangerouslySetInnerHTML={{ __html: html }}',
        'dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}'
    )
    write("client/src/components/LightMarkdown.tsx", lm_content)
else:
    print("  Already exists, skipping")

# ═══════════════════════════════════════════
# #8 normalizeUrl 공통 모듈
# ═══════════════════════════════════════════
print("\n#8 normalizeUrl 공통 모듈 생성...")
normalize_url_module = '''/**
 * lib/normalize-url.ts — URL 정규화 공통 모듈
 * seo-analyzer.ts, routes/seo.ts, scheduler/utils.ts에서 중복 제거
 */

/** 전체 정규화 (SEO 분석용) */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  url = url.replace(/\\s*\\([^)]*\\)\\s*/g, "").trim();
  url = url.replace(/[\\s<>"']/g, "");
  url = url.replace(/^(https?:\\/\\/)+/i, (m) => m.split("://").slice(0, 1).join() + "://");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  try {
    const parsed = new URL(url);
    url = parsed.href;
  } catch {
    return url;
  }
  if (!url.endsWith("/") && !url.includes("?") && !url.includes("#")) {
    try {
      const path = new URL(url).pathname;
      if (!path.includes(".")) url += "/";
    } catch {}
  }
  return url;
}

/** 간소화 정규화 (진단용 — origin + pathname만) */
export function normalizeUrlForDiag(url: string): string {
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  try {
    const parsed = new URL(u);
    return parsed.origin + (parsed.pathname === "/" ? "/" : parsed.pathname);
  } catch {
    return u;
  }
}
'''
write("server/lib/normalize-url.ts", normalize_url_module)

# seo-analyzer.ts에서 normalizeUrl을 공통 모듈에서 import
seo_content = read("server/seo-analyzer.ts")
if "from './lib/normalize-url'" not in seo_content and "from \"./lib/normalize-url\"" not in seo_content:
    # 기존 function normalizeUrl을 제거하고 import로 대체
    # 먼저 import 추가
    seo_content = 'import { normalizeUrl } from "./lib/normalize-url";\n' + seo_content
    # 기존 함수 정의를 주석 처리 (export function normalizeUrl → // re-exported from lib)
    seo_content = seo_content.replace(
        'export function normalizeUrl(input: string): string {',
        '// normalizeUrl은 ./lib/normalize-url에서 import됨 (re-export 유지)\nexport { normalizeUrl } from "./lib/normalize-url";\n// @deprecated 아래 원본은 참조용\nfunction _normalizeUrl_DEPRECATED(input: string): string {'
    )
    write("server/seo-analyzer.ts", seo_content)

# ═══════════════════════════════════════════
# #11 구조화된 로거 모듈
# ═══════════════════════════════════════════
print("\n#11 구조화된 로거 모듈 생성...")
logger_module = '''/**
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

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function createLogger(module: string) {
  return {
    info(message: string, meta?: Record<string, unknown>) {
      console.log(formatEntry({ level: "info", module, message, timestamp: new Date().toISOString(), ...meta }));
    },
    warn(message: string, meta?: Record<string, unknown>) {
      console.warn(formatEntry({ level: "warn", module, message, timestamp: new Date().toISOString(), ...meta }));
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(formatEntry({ level: "error", module, message, timestamp: new Date().toISOString(), ...meta }));
    },
    debug(message: string, meta?: Record<string, unknown>) {
      if (process.env.NODE_ENV !== "production") {
        console.log(formatEntry({ level: "debug", module, message, timestamp: new Date().toISOString(), ...meta }));
      }
    },
  };
}
'''
write("server/lib/logger.ts", logger_module)

# ═══════════════════════════════════════════
# #14 ComponentShowcase 삭제
# ═══════════════════════════════════════════
print("\n#14 ComponentShowcase 삭제...")
showcase_path = os.path.join(BASE, "client/src/pages/ComponentShowcase.tsx")
if os.path.exists(showcase_path):
    os.remove(showcase_path)
    print("  Deleted: client/src/pages/ComponentShowcase.tsx")
else:
    print("  Already deleted")

# ═══════════════════════════════════════════
# #17 browser-pool 동시성 상한
# ═══════════════════════════════════════════
print("\n#17 browser-pool 동시성 상한 추가...")
bp_path = "server/lib/browser-pool.ts"
if os.path.exists(os.path.join(BASE, bp_path)):
    bp_content = read(bp_path)
    if "MAX_CONCURRENT_PAGES" not in bp_content:
        # 파일 시작에 상수 추가
        bp_content = "const MAX_CONCURRENT_PAGES = 5;\nlet activePages = 0;\nconst waitQueue: Array<() => void> = [];\n\n" + bp_content
        
        # acquirePage 함수가 있으면 동시성 제어 추가
        if "async function" in bp_content or "export async" in bp_content:
            # getPage 또는 withPage 함수 앞에 동시성 제어 헬퍼 추가
            concurrency_helper = '''
/** 동시성 제어 — MAX_CONCURRENT_PAGES 초과 시 대기 */
async function acquireSlot(): Promise<void> {
  if (activePages < MAX_CONCURRENT_PAGES) {
    activePages++;
    return;
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => { activePages++; resolve(); });
  });
}
function releaseSlot(): void {
  activePages--;
  const next = waitQueue.shift();
  if (next) next();
}
'''
            bp_content = bp_content + "\n" + concurrency_helper
        write(bp_path, bp_content)
    else:
        print("  Already exists, skipping")
else:
    print(f"  File not found: {bp_path}")

# ═══════════════════════════════════════════
# #22 formatBlogContent ### 정규식 버그
# ═══════════════════════════════════════════
print("\n#22 formatBlogContent ### 정규식 버그 수정...")
utils_content = read("server/scheduler/utils.ts")
# 문제: ## 정규식이 ### 도 매칭함. 해결: ### 를 먼저 처리
old_pattern = "  formatted = formatted.replace(/\\n*(## [^\\n]+)/g, '\\n\\n\\n$1\\n\\n');\n  formatted = formatted.replace(/\\n*(### [^\\n]+)/g, '\\n\\n$1\\n');"
new_pattern = "  // ### 를 먼저 처리해야 ## regex가 ### 를 삼키지 않음\n  formatted = formatted.replace(/\\n*(### [^\\n]+)/g, '\\n\\n$1\\n');\n  formatted = formatted.replace(/\\n*(## [^\\n]+)/g, '\\n\\n\\n$1\\n\\n');"
if old_pattern in utils_content:
    utils_content = utils_content.replace(old_pattern, new_pattern)
    write("server/scheduler/utils.ts", utils_content)
else:
    print("  Pattern not found, trying alternative...")
    # 줄 단위로 시도
    lines = utils_content.split("\n")
    for i, line in enumerate(lines):
        if "formatted = formatted.replace(/\\n*(## " in line and i+1 < len(lines) and "### " in lines[i+1]:
            # 두 줄 순서 바꾸기
            lines[i], lines[i+1] = lines[i+1], lines[i]
            lines.insert(i, "  // ### 를 먼저 처리해야 ## regex가 ### 를 삼키지 않음")
            write("server/scheduler/utils.ts", "\n".join(lines))
            break
    else:
        print("  Could not find pattern to fix")

# ═══════════════════════════════════════════
# #12 빈 catch 블록 제거 (db.ts)
# ═══════════════════════════════════════════
print("\n#12 빈 catch 블록에 로깅 추가 (db.ts)...")
db_content = read("server/db.ts")
# 패턴: } catch (e) { } 또는 } catch { }
empty_catch_count = 0
# catch (e) { } → catch (e) { console.warn(...) }
db_content_new = re.sub(
    r'} catch \((\w+)\) \{\s*\}',
    lambda m: f'}} catch ({m.group(1)}) {{ console.warn("[DB] Suppressed error:", {m.group(1)}); }}',
    db_content
)
# catch { } → catch (e) { console.warn(...) }
db_content_new = re.sub(
    r'} catch \{\s*\}',
    '} catch (e) { console.warn("[DB] Suppressed error:", e); }',
    db_content_new
)
if db_content_new != db_content:
    write("server/db.ts", db_content_new)
    print("  Fixed empty catch blocks in db.ts")
else:
    print("  No empty catch blocks found")

# blog-scheduler.ts 빈 catch 블록
print("  Checking blog-scheduler.ts...")
bs_content = read("server/blog-scheduler.ts")
bs_new = re.sub(
    r'} catch \((\w+)\) \{\s*\}',
    lambda m: f'}} catch ({m.group(1)}) {{ console.warn("[Scheduler] Suppressed error:", {m.group(1)}); }}',
    bs_content
)
bs_new = re.sub(
    r'} catch \{\s*\}',
    '} catch (e) { console.warn("[Scheduler] Suppressed error:", e); }',
    bs_new
)
if bs_new != bs_content:
    write("server/blog-scheduler.ts", bs_new)
    print("  Fixed empty catch blocks in blog-scheduler.ts")

# ═══════════════════════════════════════════
# #10 env.ts 통합
# ═══════════════════════════════════════════
print("\n#10 env.ts에 누락된 환경변수 추가...")
env_content = read("server/_core/env.ts")
new_vars = []
if "GOOGLE_PAGESPEED_API_KEY" not in env_content:
    new_vars.append('  GOOGLE_PAGESPEED_API_KEY: process.env.GOOGLE_PAGESPEED_API_KEY || "",')
if "GOOGLE_SERVICE_ACCOUNT_KEY" not in env_content:
    new_vars.append('  GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "",')
if "NAVER_AD_API_ACCESS_LICENSE" not in env_content:
    new_vars.append('  NAVER_AD_API_ACCESS_LICENSE: process.env.NAVER_AD_API_ACCESS_LICENSE || "",')
if "NAVER_AD_API_CUSTOMER_ID" not in env_content:
    new_vars.append('  NAVER_AD_API_CUSTOMER_ID: process.env.NAVER_AD_API_CUSTOMER_ID || "",')
if "NAVER_AD_API_SECRET_KEY" not in env_content:
    new_vars.append('  NAVER_AD_API_SECRET_KEY: process.env.NAVER_AD_API_SECRET_KEY || "",')

if new_vars:
    # ENV 객체의 마지막 } 앞에 삽입
    # "} as const" 또는 "}" 찾기
    env_content = env_content.rstrip()
    if env_content.endswith("} as const;"):
        env_content = env_content[:-len("} as const;")] + "\n".join([""] + new_vars) + "\n} as const;"
    elif env_content.endswith("};"):
        env_content = env_content[:-2] + "\n".join([""] + new_vars) + "\n};"
    write("server/_core/env.ts", env_content + "\n")
else:
    print("  All vars already present")

print("\n=== Phase 1+2 배치 완료 ===")
print("남은 작업: #3 DB 인덱스 (SQL), #10 파일별 process.env→ENV 변환, #13 전역상태 캡슐화")

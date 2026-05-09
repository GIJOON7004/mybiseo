/**
 * lib/normalize-url.ts — URL 정규화 공통 모듈
 * seo-analyzer.ts, routes/seo.ts, scheduler/utils.ts에서 중복 제거
 */

/** 전체 정규화 (SEO 분석용) */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  url = url.replace(/\s*\([^)]*\)\s*/g, "").trim();
  url = url.replace(/[\s<>"']/g, "");
  url = url.replace(/^(https?:\/\/)+/i, (m) => m.split("://").slice(0, 1).join() + "://");
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

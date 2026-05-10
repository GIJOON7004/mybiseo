/**
 * OG 메타태그 동적 생성 미들웨어
 * /ai-check?url=xxx 공유 시 카카오톡/밴드 미리보기에 점수가 표시되도록
 * 크롤러(봇)에게만 동적 OG 태그를 반환하고, 일반 사용자는 SPA로 통과
 */
import type { Request, Response, NextFunction } from "express";
import { analyzeSeo } from "./seo-analyzer";

import { createLogger } from "./lib/logger";
const logger = createLogger("og-meta");

// 크롤러/봇 User-Agent 패턴
const BOT_UA = /kakaotalk|facebookexternalhit|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|whatsapp|line-poker|bandapp|naverbot|yeti|googlebot|bingbot|baiduspider|duckduckbot|pinterestbot|embedly|quora|outbrain|vkshare|tumblr|w3c_validator|redditbot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot/i;

// 간단한 메모리 캐시 (URL → {html, expiry})
const ogCache = new Map<string, { html: string; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

function getGradeEmoji(grade: string): string {
  if (grade === "A+") return "🟢";
  if (grade === "A") return "🟢";
  if (grade === "B") return "🟡";
  if (grade === "C") return "🟠";
  return "🔴";
}

export function ogMetaMiddleware(htmlTemplate: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ua = req.headers["user-agent"] || "";
    const url = req.originalUrl;

    // /ai-check 또는 /seo-check 경로이고 url 파라미터가 있고 봇인 경우만 처리
    if (!(url.startsWith("/ai-check") || url.startsWith("/seo-check")) || !BOT_UA.test(ua)) {
      return next();
    }

    // URL 파라미터 추출
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const targetUrl = urlObj.searchParams.get("url");
    if (!targetUrl) return next();

    try {
      // 캐시 확인
      const cacheKey = targetUrl.toLowerCase().trim();
      const cached = ogCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return res.status(200).set({ "Content-Type": "text/html" }).end(cached.html);
      }

      // SEO 분석 실행
      const result = await analyzeSeo(targetUrl);
      const score = result.totalScore;
      const grade = result.grade;
      const emoji = getGradeEmoji(grade);
      const passed = result.summary.passed;
      const failed = result.summary.failed;
      const warnings = result.summary.warnings;
      const displayUrl = targetUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const ogTitle = `${emoji} ${displayUrl} — AI+포털 노출 점수 ${score}점 (${grade})`;
      const ogDesc = `통과 ${passed}개 · 주의 ${warnings}개 · 실패 ${failed}개 — 당신의 병원도 무료 진단해 보세요!`;
      const ogImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663438971958/PAet9MTkZYRHY348QbWGBd/og-image-wide-VCu4Vf9EQTnQ4LcR8dKRrM.png";
      const canonicalUrl = `https://mybiseo.com/ai-check?url=${encodeURIComponent(targetUrl)}`;

      // HTML 템플릿에서 OG 태그 교체
      let html = htmlTemplate;
      // title 교체
      html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${ogTitle} | MY비서</title>`
      );
      // og:title
      html = html.replace(
        /<meta property="og:title" content="[^"]*" \/>/,
        `<meta property="og:title" content="${ogTitle}" />`
      );
      // og:description
      html = html.replace(
        /<meta property="og:description" content="[^"]*" \/>/,
        `<meta property="og:description" content="${ogDesc}" />`
      );
      // og:url
      html = html.replace(
        /<meta property="og:url" content="[^"]*" \/>/,
        `<meta property="og:url" content="${canonicalUrl}" />`
      );
      // og:image (keep existing)
      html = html.replace(
        /<meta property="og:image" content="[^"]*" \/>/,
        `<meta property="og:image" content="${ogImage}" />`
      );
      // twitter:title
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*" \/>/,
        `<meta name="twitter:title" content="${ogTitle}" />`
      );
      // twitter:description
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*" \/>/,
        `<meta name="twitter:description" content="${ogDesc}" />`
      );
      // meta description
      html = html.replace(
        /<meta name="description" content="[^"]*" \/>/,
        `<meta name="description" content="${ogDesc}" />`
      );
      // canonical URL 동적 교체
      html = html.replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );

      // 캐시 저장
      ogCache.set(cacheKey, { html, expiry: Date.now() + CACHE_TTL });

      return res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      // 분석 실패 시 기본 HTML로 통과
      logger.error("[OG Meta] Error generating dynamic OG:", err);
      return next();
    }
  };
}

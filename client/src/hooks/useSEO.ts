import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function useSEO({ title, description, canonical, ogType, ogImage, jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;

      // OG description
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
      if (!ogDesc) {
        ogDesc = document.createElement("meta");
        ogDesc.setAttribute("property", "og:description");
        document.head.appendChild(ogDesc);
      }
      ogDesc.content = description;
    }

    // OG title
    let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = title;

    // OG type
    if (ogType) {
      let ogTypeMeta = document.querySelector('meta[property="og:type"]') as HTMLMetaElement | null;
      if (!ogTypeMeta) {
        ogTypeMeta = document.createElement("meta");
        ogTypeMeta.setAttribute("property", "og:type");
        document.head.appendChild(ogTypeMeta);
      }
      ogTypeMeta.content = ogType;
    }

    // OG image
    if (ogImage) {
      let ogImgMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
      if (!ogImgMeta) {
        ogImgMeta = document.createElement("meta");
        ogImgMeta.setAttribute("property", "og:image");
        document.head.appendChild(ogImgMeta);
      }
      ogImgMeta.content = ogImage;
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // JSON-LD structured data (supports single object or array)
    if (jsonLd) {
      // Remove existing dynamic jsonld elements
      document.querySelectorAll('[data-dynamic-jsonld]').forEach(el => el.remove());
      
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, idx) => {
        const scriptEl = document.createElement("script");
        scriptEl.type = "application/ld+json";
        scriptEl.setAttribute('data-dynamic-jsonld', String(idx));
        scriptEl.textContent = JSON.stringify(item);
        document.head.appendChild(scriptEl);
      });
    }

    return () => {
      // Reset to default on unmount
      document.title = "마이비서(MY비서) | 병원 AI 마케팅 — 환자 응대 · 검색 노출 · 콘텐츠 제작";
      // Clean up dynamic JSON-LD
      document.querySelectorAll('[data-dynamic-jsonld]').forEach(el => el.remove());
    };
  }, [title, description, canonical, ogType, ogImage, jsonLd]);
}

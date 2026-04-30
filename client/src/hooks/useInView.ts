import { useEffect, useRef, useState } from "react";

/**
 * Shared IntersectionObserver pool — all useInView hooks with the same
 * threshold+rootMargin share a single observer instance.
 * This reduces 48+ individual observers to 1-2 shared ones.
 */
type ObserverCallback = (isIntersecting: boolean) => void;

const observerMap = new Map<
  string,
  { observer: IntersectionObserver; callbacks: Map<Element, ObserverCallback> }
>();

function getSharedObserver(
  threshold: number,
  rootMargin: string
): { observer: IntersectionObserver; callbacks: Map<Element, ObserverCallback> } {
  const key = `${threshold}|${rootMargin}`;
  const existing = observerMap.get(key);
  if (existing) return existing;

  const callbacks = new Map<Element, ObserverCallback>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cb = callbacks.get(entry.target);
        if (cb) cb(entry.isIntersecting);
      }
    },
    { threshold, rootMargin }
  );

  const entry = { observer, callbacks };
  observerMap.set(key, entry);
  return entry;
}

/**
 * Lightweight IntersectionObserver hook — replaces framer-motion whileInView.
 * Returns a ref and a boolean `isInView`.
 * Once visible, stays visible (once: true by default).
 * Uses a shared observer pool for performance (48 elements → 1 observer).
 * v2: rootMargin 0px로 변경 — 뷰포트 진입 즉시 감지
 */
export function useInView(options?: { threshold?: number; rootMargin?: string; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const once = options?.once ?? true;
  const threshold = options?.threshold ?? 0.02;
  const rootMargin = options?.rootMargin ?? "0px";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { observer, callbacks } = getSharedObserver(threshold, rootMargin);

    const handleIntersect = (isIntersecting: boolean) => {
      if (isIntersecting) {
        setIsInView(true);
        if (once) {
          observer.unobserve(el);
          callbacks.delete(el);
        }
      } else if (!once) {
        setIsInView(false);
      }
    };

    callbacks.set(el, handleIntersect);
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, [once, threshold, rootMargin]);

  return { ref, isInView };
}

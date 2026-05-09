import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * 쿠키 기반 방문자 ID 생성/유지 (A/B 테스트 일관성)
 */
function getVisitorId(): string {
  const KEY = "mybiseo_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export interface ABVariant {
  experimentId: number;
  variantId: number;
  variantName: string;
  content: Record<string, string>;
}

/**
 * A/B 테스트 변형을 가져오는 훅
 * @param targetElement - "hero_headline" | "hero_cta" | "service_cta" 등
 * @returns { variant, isLoading, trackEvent }
 */
export function useABTest(targetElement: string) {
  const [visitorId] = useState(() => getVisitorId());

  const { data: variant, isLoading } = trpc.abtest.getVariant.useQuery(
    { targetElement, visitorId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  const trackMutation = trpc.abtest.trackEvent.useMutation();

  // impression 자동 기록
  useEffect(() => {
    if (variant) {
      trackMutation.mutate({
        experimentId: variant.experimentId,
        variantId: variant.variantId,
        visitorId,
        eventType: "impression",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant?.variantId]);

  const trackEvent = useMemo(() => {
    return (eventType: "click" | "conversion", metadata?: string) => {
      if (!variant) return;
      trackMutation.mutate({
        experimentId: variant.experimentId,
        variantId: variant.variantId,
        visitorId,
        eventType,
        metadata,
      });
    };
  }, [variant, visitorId, trackMutation]);

  return {
    variant: variant as ABVariant | null | undefined,
    isLoading,
    trackEvent,
  };
}

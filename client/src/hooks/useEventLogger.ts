import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useRef } from "react";

// 브라우저 세션에서 고유 방문자 ID 생성/유지
function getVisitorId(): string {
  const key = "mybiseo_vid";
  let vid = localStorage.getItem(key);
  if (!vid) {
    vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, vid);
  }
  return vid;
}

function getSessionId(): string {
  const key = "mybiseo_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export function useEventLogger() {
  const logMutation = trpc.userEvent.log.useMutation({ onError: () => {} });
  const visitorId = useRef(getVisitorId());
  const sessionId = useRef(getSessionId());

  const logEvent = useCallback(
    (eventType: string, metadata?: Record<string, any>) => {
      try {
        logMutation.mutate({
          eventType,
          page: window.location.pathname,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          visitorId: visitorId.current,
          sessionId: sessionId.current,
        });
      } catch {
        // 이벤트 로깅 실패는 무시
      }
    },
    [logMutation]
  );

  // 페이지 뷰 자동 기록
  useEffect(() => {
    logEvent("page_view");
  }, []);

  return { logEvent };
}

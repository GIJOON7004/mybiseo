/**
 * useMutationDefaults.ts — 공통 mutation 에러 핸들러
 * 모든 useMutation에 기본 onError를 제공하여 silent failure 방지
 */
import { toast } from "sonner";

/** 기본 onError 콜백 — toast로 에러 메시지 표시 */
export const defaultOnError = (err: { message: string }) => {
  toast.error(err.message || "요청 처리 중 오류가 발생했습니다.");
};

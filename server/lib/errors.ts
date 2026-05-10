/**
 * server/lib/errors.ts — 타입 안전한 에러 처리 유틸리티
 * catch (e: unknown) 패턴에서 안전하게 에러 메시지를 추출
 */

/**
 * unknown 타입의 에러에서 메시지 문자열을 안전하게 추출
 * @example
 * try { ... } catch (e: unknown) { logger.error(getErrorMessage(e)); }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

/**
 * unknown 타입의 에러에서 Error 인스턴스를 보장
 * @example
 * try { ... } catch (e: unknown) { throw toError(e); }
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(getErrorMessage(error));
}

/**
 * 사이트 URL 상수 — client 전용
 * shared/const.ts의 APP_DOMAIN/APP_BASE_URL과 동일한 값
 * client에서는 process.env가 없으므로 정적 값 사용
 */
export const APP_DOMAIN = "mybiseo.com";
export const APP_BASE_URL = `https://${APP_DOMAIN}`;

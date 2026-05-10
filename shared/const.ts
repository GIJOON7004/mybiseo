// 3단계 보안: 세션 쿠키 이름을 일반적이지 않은 이름으로 변경하여 기술 스택 은닉
export const COOKIE_NAME = "_mb_sid";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7일 (보안 강화)
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

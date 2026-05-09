/**
 * db.ts Strangler Fig Facade
 * 
 * 이 파일은 기존 server/db.ts의 모든 export를 re-export합니다.
 * 점진적 마이그레이션 전략:
 * 
 * 1단계 (현재): barrel re-export — 기존 import 경로 유지
 * 2단계: 도메인별 모듈 분리 (blog.ts, chat.ts, seo.ts 등)
 * 3단계: 기존 db.ts에서 분리된 모듈로 코드 이동
 * 4단계: db.ts 제거 (모든 import가 도메인 모듈을 직접 참조)
 * 
 * 도메인 분류 (270개 함수):
 * - blog: 13개 (getAllBlogCategories, createBlogPost, ...)
 * - chat: 9개 (getOrCreateChatSession, saveChatMessage, ...)
 * - seo/diagnosis: 26개+ (createSeoKeyword, getDiagnosis*, ...)
 * - hospital: 10개 (getHospitalProfile*, updateHospital*, ...)
 * - email: 10개 (createEmailTemplate, sendEmail*, ...)
 * - content: 12개 (getContentIdeas, createContentHook, ...)
 * - ad: 11개 (createAdBrandProfile, getAdCreatives, ...)
 * - ab-test: 10개 (getAbExperiments, createAbVariant, ...)
 * - calendar: 7개 (getCalendarItems, createCalendarItem, ...)
 * - marketing: 6개 (getMarketingDashboardStats, ...)
 * - automation: 6개 (getDiagnosisAutomationConfig, ...)
 * - misc: 나머지
 */

// 현재 단계: 기존 db.ts 전체 re-export
export * from "../db";

# Database Layer — Strangler Fig Migration Guide

## 현재 상태
- `server/db.ts`: 270개 함수, 3,698줄 (모놀리스)
- 목표: 도메인별 분리 후 `server/db.ts`는 re-export 허브로 전환

## 분리 계획 (우선순위순)

| 순서 | 도메인 | 파일명 | 함수 수 | 상태 |
|------|--------|--------|---------|------|
| 1 | 콘텐츠 (SNS, Ad, Content) | `db/content.ts` | ~59 | 대기 |
| 2 | 병원 프로필 | `db/hospital.ts` | ~42 | 대기 |
| 3 | 블로그 | `db/blog.ts` | ~31 | 대기 |
| 4 | 리드/SEO/진단 | `db/lead-seo.ts` | ~22 | 대기 |
| 5 | AI 모니터 | `db/monitor.ts` | ~17 | 대기 |
| 6 | 채팅 | `db/chat.ts` | ~10 | 대기 |
| 7 | 기타 (이벤트, 알림, 구독) | `db/misc.ts` | ~89 | 대기 |

## 마이그레이션 절차 (각 도메인)

1. `server/db/{domain}.ts` 파일 생성
2. 해당 도메인 함수들을 복사 (import 정리)
3. `server/db.ts`에서 해당 함수들을 `export * from "./db/{domain}"` 로 교체
4. TypeScript 에러 0개 확인
5. 기존 import 경로 (`from "../db"`) 는 변경 불필요 (re-export 유지)

## 핵심 원칙
- **기존 import 경로 깨지지 않음**: `server/db.ts`가 re-export 허브 역할
- **점진적 전환**: 한 번에 하나의 도메인만 이동
- **테스트 필수**: 각 도메인 이동 후 서버 재시작 + TS 에러 확인

# ADR-001: db.ts God Object → Re-export Facade + 도메인 모듈 분할

## Status
Accepted (2026-05-10)

## Context

`server/db.ts`가 3,455줄의 God Object로 성장하여 모든 데이터베이스 쿼리 헬퍼를 단일 파일에 포함하고 있었다. 이로 인해 IDE 성능 저하, 코드 리뷰 어려움, 순환 의존성 발생, 그리고 새 기능 추가 시 merge conflict가 빈번했다.

## Decision

`server/db.ts`를 40줄 이하의 re-export facade로 축소하고, 실제 로직은 `server/db/` 디렉토리 아래 16개 도메인 모듈로 분리한다.

| 모듈 | 책임 |
|------|------|
| connection.ts | DB 연결 + closeDb() |
| admin.ts | 관리자 전용 쿼리 |
| hospital.ts | 병원 CRUD |
| content.ts | 블로그/콘텐츠 |
| content-factory.ts | AI 콘텐츠 생성 |
| chat.ts | 채팅 이력 |
| lead.ts | 리드/뉴스레터 |
| ad.ts | 광고 관리 |
| abtest.ts | A/B 테스트 |
| interview.ts | 인터뷰 콘텐츠 |
| misc.ts | 분류 불가 유틸 |
| user.ts | 사용자 관리 |
| seo.ts | SEO 진단 데이터 |
| engagement.ts | 사용자 참여 |
| analytics.ts | 분석 데이터 |
| report.ts | 보고서 생성 |
| notification.ts | 알림 관리 |

## Consequences

**긍정적:**
- IDE 자동완성 속도 회복 (3,455줄 → 각 100~300줄)
- 순환 의존성 해소 (madge 검증 통과)
- 도메인별 독립 테스트 가능

**부정적:**
- import 경로가 `../db`에서 변경 없음 (facade가 re-export하므로 기존 코드 호환)
- 초기 분할 시 export 누락 위험 → TypeScript strict mode로 컴파일 타임 검증

## Alternatives Considered

1. **barrel 200줄 유지 + 내부만 분리:** 채택하지 않음. barrel이 200줄이면 여전히 God Object 경향.
2. **db.ts 완전 삭제 + 직접 import:** 채택하지 않음. 기존 코드 200+ 곳에서 `from "../db"` 사용 중이라 마이그레이션 비용 과다.

## 회귀 방지

CI workflow의 `architecture-guard` job이 `server/db.ts`가 100줄을 초과하면 빌드를 실패시킨다.

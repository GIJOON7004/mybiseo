# ADR-002: Logger 출력 Destination 결정

## Status
Accepted (2026-05-10)

## Context

`server/lib/logger.ts`를 도입하여 `console.log` 직접 호출을 구조화된 로거로 교체했다. 그러나 logger 내부에서 최종적으로 `console.log/warn/error`를 호출하고 있어, 실질적으로 출력 형태만 바뀌었을 뿐 destination은 동일하다. 프로덕션 환경에서 로그 수집/검색/알림이 필요한 시점이 올 것이다.

## Decision

**현재 단계 (Phase 0~2):** stdout/stderr 출력을 유지한다. Manus 플랫폼의 `.manus-logs/devserver.log`가 자동 수집하고 있으며, 배포 환경(Cloud Run)은 Cloud Logging이 stdout을 자동 수집한다.

**향후 전환 시점:** MAU 1,000 돌파 또는 유료 고객 10명 이상 시점에 destination adapter를 교체한다.

| 후보 | 장점 | 단점 | 비용 |
|------|------|------|------|
| Cloud Logging (현재) | 무료, 자동 수집 | 검색 UI 불편 | $0 |
| Datadog | APM + 로그 통합 | 비용 높음 | $15/host/mo |
| Logtail (Better Stack) | 저렴, 검색 빠름 | APM 없음 | $0~$25/mo |
| Sentry | 에러 추적 특화 | 일반 로그 미지원 | $26/mo |

## Consequences

- logger.ts의 `output()` 함수만 교체하면 전체 앱의 로그 destination이 변경됨
- 현재 코드에서 `console.log` → `logger.info` 전환은 ESLint `no-console` 규칙이 점진적으로 강제
- 전환 시 기존 로그 형식(JSON structured)을 유지하므로 파싱 호환성 보장

## Alternatives Considered

1. **즉시 Datadog 도입:** 채택하지 않음. 현재 트래픽 수준에서 월 $15 비용 대비 ROI 없음.
2. **Winston/Pino 도입:** 채택하지 않음. 커스텀 logger.ts가 이미 동일 기능 제공 (level, timestamp, context).

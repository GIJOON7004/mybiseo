# ADR-003: Puppeteer vs Puppeteer-Core + @sparticuz/chromium 전략

## Status
Accepted (2026-05-10)

## Context

SEO 진단 기능에서 Puppeteer를 사용하여 웹페이지를 렌더링하고 스크린샷/HTML을 수집한다. 배포 환경(Cloud Run)에서 full Chromium 바이너리(~400MB)를 포함하면 컨테이너 이미지 크기가 비대해지고, cold start가 느려진다.

## Decision

**현재:** `puppeteer` (full 패키지)를 사용한다. 이유:

1. Manus 플랫폼 배포 환경에서 Chromium이 시스템 레벨로 설치되어 있어 별도 바이너리 관리 불필요
2. `browser-pool.ts`에서 `MAX_CONCURRENT_PAGES=5`로 동시성 제한 중
3. `@sparticuz/chromium`은 AWS Lambda 최적화 패키지로, Cloud Run 환경에서는 이점이 제한적

**전환 조건:** AWS Lambda로 마이그레이션하거나, 컨테이너 이미지 크기가 배포 시간에 영향을 줄 때 `puppeteer-core` + `@sparticuz/chromium`으로 전환한다.

## Production 배포 환경 (2026-05-10 보완)

- **현재 환경:** Manus Platform (Chromium pre-installed, Ubuntu 22.04)
- **번들 크기:** puppeteer full 패키지 포함 시 ~400MB이나, 플랫폼이 시스템 Chromium을 제공하므로 실제 다운로드는 skip됨
- **cold start:** ~3초 (허용 범위)

## 재검토 트리거

다음 조건 중 하나라도 충족되면 puppeteer-core 전환을 재검토한다:
1. Docker 자체 배포로 전환 시 (이미지 크기 직접 관리 필요)
2. 빌드 시간이 5분을 초과할 때
3. AWS Lambda 또는 Vercel Edge로 마이그레이션 시
4. Chromium 버전 충돌이 발생할 때 (시스템 vs puppeteer 내장)

## Consequences

- dependencies에 `puppeteer` 유지 (devDependencies 아님 — 서버 런타임 사용)
- 컨테이너 이미지에 Chromium 포함 (현재 Manus 플랫폼이 관리)
- cold start ~3초 (허용 범위 내)

## Alternatives Considered

1. **puppeteer-core + 시스템 Chromium:** 가능하나 경로 관리 복잡성 증가.
2. **Playwright:** API 호환성 없음, 마이그레이션 비용 과다.
3. **외부 렌더링 서비스 (Browserless.io):** 비용 발생 + 네트워크 지연.

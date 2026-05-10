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

## Consequences

- dependencies에 `puppeteer` 유지 (devDependencies 아님 — 서버 런타임 사용)
- 컨테이너 이미지에 Chromium 포함 (현재 Manus 플랫폼이 관리)
- cold start ~3초 (허용 범위 내)

## Alternatives Considered

1. **puppeteer-core + 시스템 Chromium:** 가능하나 경로 관리 복잡성 증가.
2. **Playwright:** API 호환성 없음, 마이그레이션 비용 과다.
3. **외부 렌더링 서비스 (Browserless.io):** 비용 발생 + 네트워크 지연.

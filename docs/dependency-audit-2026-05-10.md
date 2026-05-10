# 의존성 감사 결과 (2026-05-10)

## 요약

| 지표 | Before | After |
|------|--------|-------|
| 취약점 수 | 39 | 6 |
| 심각도 | 1 critical + 14 high + 20 moderate + 4 low | 2 high + 3 moderate + 1 low |
| 미사용 의존성 | 12개 | 0개 |

## 제거된 미사용 패키지 (10개 production + 2개 dev)

### Production
1. `@aws-sdk/client-s3` — Forge API 사용으로 불필요
2. `@aws-sdk/s3-request-presigner` — 동일
3. `@hookform/resolvers` — 코드에서 미사용
4. `date-fns` — 코드에서 미사용
5. `framer-motion` — CSS 애니메이션으로 대체 완료
6. `node-cron` — heartbeat 시스템으로 대체 완료
7. `resend` — 코드에서 미사용
8. `streamdown` — LightMarkdown으로 대체 완료
9. `tailwindcss-animate` — tw-animate-css로 대체 완료
10. `xlsx` — 코드에서 미사용

### DevDependencies
1. `@tailwindcss/typography` — 코드에서 미사용
2. `add` — 오타로 설치된 패키지

## 업데이트된 패키지

| 패키지 | Before | After | 해결된 취약점 |
|--------|--------|-------|--------------|
| axios | 1.12.2 | 1.16.0 | 5개 (4 high + 1 low) |
| @trpc/server | 11.6.0 | 11.17.0 | 1개 (1 high) |
| @trpc/client | 11.6.0 | 11.17.0 | — |
| @trpc/react-query | 11.6.0 | 11.17.0 | — |
| archiver | 7.0.1 | 8.0.0 | 0 (lodash 간접 의존 유지) |

## 제거된 타입 패키지

| 패키지 | 이유 |
|--------|------|
| `@types/express-rate-limit` | express-rate-limit v8이 자체 타입 포함. 이 패키지가 path-to-regexp + qs 취약점 유발 |

## 잔존 취약점 (6개, 모두 간접 의존성)

| 패키지 | 심각도 | 경로 | 조치 |
|--------|--------|------|------|
| lodash | high + 2 moderate | archiver → archiver-utils → lodash | archiver 업스트림 수정 대기 |
| path-to-regexp | high | 잔존 간접 의존 | 모니터링 |
| qs | moderate + low | 잔존 간접 의존 | 모니터링 |

> 모두 archiver의 간접 의존성으로, 직접 해결 불가. archiver가 lodash 의존을 제거할 때까지 모니터링.

# 의존성 감사 결과

## 최신 감사: 2026-05-11

| 지표 | 2026-05-10 | 2026-05-11 |
|------|-----------|-----------|
| 총 취약점 수 | 33 | 15 |
| High | 15 | 2 |
| Moderate | 17 | 12 |
| Low | 1 | 1 |

## 이번 라운드 조치 내역

| 패키지 | Before | After | 해결된 취약점 |
|--------|--------|-------|--------------|
| vite | 7.1.9 | 7.3.2 | 2 high (server.fs.deny bypass) |
| @tailwindcss/vite | 4.1.14 | 4.1.14 (tar override) | 6 high (node-tar 전체) |
| pnpm (devDep) | 10.18.0 | 10.27.0 | 3 high (lockfile bypass, lifecycle scripts, command injection) |
| archiver | 7.0.1 | 8.0.0 | 1 high (lodash via archiver-utils 제거) |
| rollup | 4.52.4 | ≥4.59.0 (override) | 1 high (path traversal) |
| @vitejs/plugin-react | 5.0.4 | 5.0.4 (유지) | — |
| picomatch | 4.0.3 | ≥4.0.4 (vite 7.3.2 내장) | 1 high (ReDoS) |

## pnpm overrides 적용

```json
{
  "pnpm": {
    "overrides": {
      "rollup": ">=4.59.0"
    }
  }
}
```

## 잔존 취약점 (2 high, 12 moderate, 1 low)

### High — 해결 불가 (업스트림 의존)

| 패키지 | 심각도 | 경로 | 사유 | 위험도 평가 |
|--------|--------|------|------|------------|
| path-to-regexp 0.1.12 | high (ReDoS) | express@4.21.2 내부 | Express 4.x 코어 의존. Express 5.x 전환 시 해결 가능하나 breaking change 다수 | **낮음** — 서버 라우트 패턴이 고정값이므로 사용자 입력이 path-to-regexp에 도달하지 않음 |
| lodash 4.17.21 | high (Code Injection via _.template) | recharts@2.15.4 내부 | recharts가 lodash 전체를 번들. recharts 업스트림 수정 대기 | **낮음** — 서버에서 lodash.template 미사용. 클라이언트 전용 차트 라이브러리 |

### Moderate — 모니터링

| 패키지 | 심각도 | 경로 | 사유 |
|--------|--------|------|------|
| postcss 8.5.6 | moderate (7건) | vite 내부 | vite 7.3.x가 postcss 8.5.6 고정. vite 7.4+ 출시 시 해결 예상 |
| tar 7.5.1 | moderate (4건) | @tailwindcss/oxide 내부 | tailwindcss 4.2+ 에서 tar 의존 제거 예정 |
| qs 6.13.0 | low (1건) | express 내부 | Express 5.x 전환 시 해결 |

## Suppress 정책

위 잔존 취약점은 다음 조건에서 수용합니다:

1. **path-to-regexp**: Express 라우트 패턴은 코드에 하드코딩된 문자열이며, 사용자 입력이 라우트 매칭 로직에 주입될 경로가 없음. ReDoS 공격 벡터 부재.
2. **lodash**: recharts 내부에서만 사용되며 서버 사이드에서 `_.template()`을 호출하는 코드 없음. Code Injection 공격 벡터 부재.
3. **postcss/tar**: 빌드 타임 전용 의존성. 프로덕션 런타임에 포함되지 않음.

## 재검토 트리거

- Express 5.x stable 출시 시 → path-to-regexp + qs 동시 해결
- recharts 3.x 출시 시 → lodash 의존 제거 확인
- vite 7.4+ 출시 시 → postcss 패치 확인
- 분기별 `pnpm audit` 실행 (CI에서 자동 실행, continue-on-error)

---

## 이전 감사 이력

### 2026-05-10 (카테고리 E-8)

| 지표 | Before | After |
|------|--------|-------|
| 취약점 수 | 39 | 6 |
| 심각도 | 1 critical + 14 high + 20 moderate + 4 low | 2 high + 3 moderate + 1 low |
| 미사용 의존성 | 12개 | 0개 |

제거된 미사용 패키지 10개(production) + 2개(dev): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @hookform/resolvers, date-fns, framer-motion, node-cron, resend, streamdown, tailwindcss-animate, xlsx, @tailwindcss/typography, add

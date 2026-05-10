# ADR-004: `as any` 허용 정책 및 ESLint Inline Disable 규칙

## Status
Accepted (2026-05-10)

## Context

코드베이스에 `as any` 약 90개가 존재했다. 전부 제거하는 것은 비현실적이며, 일부는 라이브러리 타입 한계로 불가피하다. 무분별한 `as any` 사용과 정당한 사용을 구분하는 정책이 필요하다.

## Decision

`as any`를 4개 카테고리로 분류하고, 각각 다른 정책을 적용한다.

| Category | 설명 | 수량 | 정책 |
|----------|------|------|------|
| A | `catch (e: any)` → `catch (e: unknown)` + 타입 가드 | ~40개 | **제거 완료** (일괄 변환) |
| B | ORM 결과 → `InferSelectModel<typeof table>` | ~30개 | **점진적 제거** (신규 코드 금지) |
| C | 외부 API 응답 → Zod schema 런타임 검증 | ~15개 | **허용 (주석 필수)** |
| D | 라이브러리 타입 미스매치 | ~5개 | **영구 허용** (`eslint-disable-next-line` + 사유 주석) |

### ESLint Inline Disable 규칙

```typescript
// ✅ 허용: 사유 명시
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle closeDb() 내부 접근
($client as any).end();

// ❌ 금지: 사유 없는 disable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = response as any;
```

## Consequences

- ESLint `@typescript-eslint/no-explicit-any`를 `warn`으로 설정 (error가 아님)
- CI에서 warning 수 증가 추이를 모니터링 (감소 추세 유지)
- 신규 코드에서 Category A/B 패턴 사용 시 PR 차단 (lint-staged)

## Alternatives Considered

1. **전부 error로 강제:** 채택하지 않음. 기존 코드 90개를 한 번에 수정하면 회귀 위험.
2. **ts-reset 도입:** 향후 검토. `JSON.parse` 반환 타입 강화에 유용하나 현재 우선순위 낮음.

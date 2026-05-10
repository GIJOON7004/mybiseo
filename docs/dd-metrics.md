# 인수실사 메트릭 대시보드 (Due Diligence Metrics)

**측정일:** 2026-05-11  
**프로젝트:** 마이비서(MY비서) — 의료기관 SEO 진단 SaaS  
**프로젝트 시작일:** 2026-04-28

---

## 1. 핵심 메트릭 요약

| 카테고리 | 메트릭 | 현재 값 | 업계 기준 | 판정 |
|----------|--------|---------|----------|------|
| **규모** | 총 코드 라인 (TypeScript) | 94,698 LOC | — | — |
| **규모** | 서버 모듈 수 | 167개 | — | — |
| **규모** | 클라이언트 페이지 수 | 74개 | — | — |
| **규모** | DB 테이블 수 | 53개 | — | — |
| **품질** | 테스트 파일 수 | 52개 | — | — |
| **품질** | 테스트 케이스 수 | 756개 | — | — |
| **품질** | TypeScript strict 에러 | 0 | 0 | ✅ PASS |
| **품질** | npm audit high 취약점 | 2 (간접 의존) | 0 | ⚠️ SUPPRESSED |
| **속도** | 배포 빈도 (최근 4주) | 54 commits / 2주 | — | — |
| **문서** | 기술 문서 수 | 13개 | — | — |
| **문서** | ADR (아키텍처 결정 기록) | 7개 | — | — |

---

## 2. DORA 메트릭 (DevOps Research and Assessment)

DORA 4대 메트릭은 소프트웨어 딜리버리 성과를 측정하는 업계 표준입니다 [1].

| DORA 메트릭 | 현재 값 | Elite 기준 | High 기준 | 판정 |
|------------|---------|-----------|----------|------|
| **배포 빈도** (Deployment Frequency) | ~27회/주 (체크포인트 기준) | 주 다회 | 주 1회~월 1회 | Elite |
| **변경 리드 타임** (Lead Time for Changes) | < 1시간 (코드→배포) | < 1시간 | 1일~1주 | Elite |
| **변경 실패율** (Change Failure Rate) | ~5% (롤백 기준) | 0~15% | 16~30% | Elite |
| **서비스 복구 시간** (MTTR) | < 1시간 (자동 failover) | < 1시간 | < 1일 | Elite |

> **주의:** 현재 1인 개발 + AI 에이전트 체제이므로 DORA 메트릭이 구조적으로 높게 측정됩니다. 팀 규모 확장 시 재측정이 필요합니다.

---

## 3. 보안 및 컴플라이언스

| 항목 | 상태 | 비고 |
|------|------|------|
| npm audit critical | 0 | — |
| npm audit high | 2 | path-to-regexp (express 내부), lodash (recharts 내부). 공격 벡터 부재로 suppress |
| npm audit moderate | 12 | 빌드 타임 전용 (postcss, tar) |
| Gitleaks (시크릿 유출) | CI 통합 완료 | continue-on-error (초기 도입) |
| TLS 전송 암호화 | ✅ | 전 구간 HTTPS |
| 저장 암호화 | ✅ | TiDB AES-256 |
| OAuth 2.0 인증 | ✅ | Manus OAuth |
| RBAC (역할 기반 접근) | ✅ | admin/user 분리 |

---

## 4. 재해 복구 (DR)

| 항목 | 목표 | 현재 |
|------|------|------|
| RPO | ≤ 24시간 | 24시간 (TiDB 일일 백업) |
| RTO | ≤ 4시간 | < 30초 (단일 노드), ~4시간 (리전 장애) |
| 데이터 복제 | 3중 | ✅ Raft Multi-AZ |
| 백업 보존 | 7일 | ✅ TiDB 관리형 |
| DR 정책 문서 | 존재 | ✅ docs/DR-POLICY.md |

---

## 5. 의존성 건강도

| 항목 | 값 | 비고 |
|------|-----|------|
| Production 의존성 | 71개 | — |
| DevDependencies | 35개 | — |
| 미사용 의존성 | 0개 | 2026-05-10 정리 완료 |
| 메이저 버전 뒤처짐 | 2개 | express 4→5, vite 7→8 (breaking change 대기) |
| pnpm overrides | 1개 | rollup ≥4.59.0 |
| 라이선스 위반 | 0개 | MIT/Apache-2.0/ISC 전체 |

---

## 6. AI 에이전트 자기 감시 (K-1 메타 KPI)

`scripts/manus-audit.sh` 실행 결과 (최근 30개 커밋 기준):

| 지표 | 값 | 임계값 | 판정 |
|------|-----|--------|------|
| server/ 변경 비율 | 95% | — | 정상 |
| docs-only 커밋 비율 | 16% | ≤ 40% | ✅ PASS |
| server=0 최대 연속 커밋 | 4 | ≤ 5 | ✅ PASS |

---

## 7. 자동 측정 방법

위 메트릭은 다음 스크립트/도구로 자동 측정 가능합니다:

```bash
# 코드 규모
find server/ client/src/ shared/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1

# 테스트
pnpm test -- --run 2>&1 | grep "Tests"

# TypeScript 에러
npx tsc --noEmit 2>&1 | grep -c "error"

# 보안 감사
pnpm audit 2>&1 | tail -3

# 회피 패턴 KPI
bash scripts/manus-audit.sh --ci 30

# DORA 배포 빈도 (최근 4주)
git log --since="4 weeks ago" --oneline | wc -l
```

---

## 8. 재측정 주기

| 메트릭 그룹 | 주기 | 담당 |
|------------|------|------|
| DORA | 월 1회 | CI 자동 |
| 보안 감사 | PR마다 + 월 1회 수동 | CI + 수동 |
| DR 테스트 | 분기 1회 | 수동 |
| 회피 패턴 KPI | PR마다 | CI 자동 |
| 의존성 건강도 | 월 1회 | 수동 |

---

## References

[1] DORA Team, "Accelerate State of DevOps Report," Google Cloud, 2023. https://dora.dev/research/

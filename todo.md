# Project TODO — mybiseo 소스코드 복원 및 배포

- [x] ZIP 소스코드(server, client, drizzle, shared)를 Manus 프로젝트에 덮어씌우기
- [x] package.json 추가 의존성 병합 및 설치 (puppeteer, pdfkit, jspdf, sharp, solapi, nodemailer 등)
- [x] drizzle/schema.ts 적용 및 DB 마이그레이션 실행 (48개 테이블 생성 완료)
- [x] server/routers.ts 및 server/routes/* 전체 라우터 연결 확인
- [x] client/src/App.tsx 라우팅(50개 이상 페이지) 및 모든 컴포넌트/페이지 파일 복원
- [x] shared/_core/errors.ts 경로 보정 및 esbuild alias 설정 유지
- [x] 개발 서버 정상 실행 확인 (localhost:3000 정상 응답)
- [x] GitHub GIJOON7004/mybiseo 리포지토리 최종 동기화 완료
- [x] 체크포인트 저장 및 게시(publish) - version: 3f134332

## 1단계: 즉시 구현 (개선방안 50개)
- [x] #1 필수 페이지 직접 탐색 - 크롤러에 MUST_HAVE_PATHS 추가, MAX_SUB_PAGES 4→8 확대
- [x] #22 executiveSummary 템플릿화 - LLM 실패 시 코드 기반 생성, 성공 시 수치 동기화
- [x] #26 LLM temperature 최소화 - invokeLLM에 temperature 파라미터 추가, 기본값 0.1
- [x] #19 소수점 반올림 규칙 통일 - utils/score-rounding.ts 유틸 생성, 최종 표시에만 반올림
- [x] #8 User-Agent/Accept-Language 표준화 - Googlebot Mobile UA 상수화
- [x] #14 검사 항목 ID 체계 표준화 - utils/item-id-registry.ts 생성, enrichWithStandardIds 적용

## 인프라: drizzle-orm 버전 충돌 해결
- [x] drizzle-orm 0.44.6 → 0.45.2 통일 (TS 에러 953→0개)

## 2단계: 구조적 기반 작업 (개선방안 50개)
- [x] #9 검사 항목 정적 레지스트리 (check-item-registry.ts: CATEGORY_MAX_SCORES, TOTAL_MAX_SCORE, CATEGORY_MIN_ITEMS)
- [x] #10 카테고리별 만점 고정 테이블 (seo-analyzer.ts에 fixedMax 적용)
- [x] #11 가중치 합산 검증 (computedTotal ≠ TOTAL_MAX_SCORE 경고)
- [x] #12 최소 항목 수 보장 (validateMinItems)
- [x] #13 선택적 항목 가중치 정규화 (applySpecialtyWeights 정규화 로직)
- [x] #2 PageSpeed 다회 측정 중앙값 (3회 측정 후 중앙값 채택)
- [x] #15 응답 시간 다회 측정 (TTFB 3회 측정 중앙값)
- [x] #4 서브페이지 타임아웃 개별 관리 (getTimeoutForPageType)
- [x] #5 재시도 로직 강화 (지수 백오프 + 에러 유형별 판단)
- [x] #3 sitemap.xml 파싱 개선 (sitemap index 재귀 탐색, URL 수 카운트)
- [x] #6 이미지 최적화 검사 샘플링 고정 (상위 50개)
- [x] #7 robots.txt 검증 강화 (Googlebot 차단, Sitemap 선언 확인)

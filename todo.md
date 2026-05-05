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

## 3단계: 중간 난이도 항목 (개선방안 50개)
- [x] #16 이미지 최적화 샘플링 고정 (크기순 정렬 후 상위 N개만 분석)
- [x] #18 진료과별 가중치 데이터 기반 보정 (실제 전환율/검색량 데이터 반영)
- [x] #20 동적 콘텐츠 감지 (JS 렌더링 후 콘텐츠 vs 정적 HTML 비교)
- [x] #23 키워드 노출 코드 기반 전환 (LLM 의존 → 정규식/DOM 파싱)
- [x] #24 경쟁사 분석 데이터 구조화 (JSON 스키마 고정)
- [x] #28 다중 신호 진료과 분류 (URL + 메타 + 콘텐츠 종합 판단)
- [x] #29 복합 진료과 처리 (다중 진료과 병원 지원)
- [x] #31 진료과 분류 사용자 확인 (신뢰도 0.5 이상일 때만 분류 결과 사용)
- [x] #32 진료과 분류 신뢰도 점수 (confidence score 반환)

## 4단계: 고난이도 항목 (개선방안 50개 — F/G/H 카테고리 + 미구현 C/D 항목)

### F. 실제 검색 노출 측정
- [x] #33 네이버/구글 실제 검색 결과 기반 노출 순위 측정
- [x] #34 AI 검색 플랫폼(ChatGPT, Perplexity) 노출 확인
- [x] #35 진료과별 핵심 키워드 사전 구축
- [x] #36 네이버 플레이스/구글 비즈니스 프로필 연동 확인
- [x] #37 백링크 프로필 분석
- [x] #38 검색 노출 추이 시계열 데이터 수집

### G. 경쟁 분석 및 벤치마크
- [x] #39 동일 지역·동일 진료과 벤치마크 DB 구축
- [x] #40 경쟁사 자동 식별 알고리즘
- [x] #41 경쟁사 점수의 실제 측정 기반 비교
- [x] #42 업종별 평균 점수 대시보드 제공
- [x] #43 시간대별 검색 트렌드 반영
- [x] #44 광고 집행 현황 대비 자연 검색 비중 분석

### H. 품질 보증 및 모니터링
- [x] #45 골든 테스트 세트(Golden Test Set) 구축
- [x] #46 동일 사이트 재검사 편차 모니터링
- [x] #47 진단 결과 이력 저장 및 변동 원인 추적
- [x] #48 사용자 피드백 수집 및 반영 루프
- [x] #49 외부 API 상태 대시보드 및 Fallback 전략 문서화
- [x] #50 진단 정확도 KPI 정의 및 분기별 리뷰

### 미구현 C/D 항목
- [x] #17 점수 구간 경계값 명확 정의 및 문서화
- [x] #21 점수 변동 허용 범위(tolerance) 설정
- [x] #25 LLM 응답 검증 레이어 추가
- [x] #27 LLM 호출 횟수 최적화
- [x] #30 진료과별 객단가 범위 데이터 기반 업데이트

## 검증 및 최적화 작업

- [x] 50개 항목 전체 적용 여부 코드 레벨 검증
- [x] 비효율적 코드 정리 및 리팩토링
- [x] 통합 테스트: 실제 병원 URL로 진단 실행 (gijoon.com 78/100 B등급, 108개 항목)
- [x] 네이버 검색광고 API 실연동 (키워드 검색량 조회 정상 동작)
- [x] Google PageSpeed Insights API 실연동 (Performance 49, SEO 100 수집 확인)
- [x] Google Search Console API 연동 모듈 구현 (server/utils/gsc-client.ts)

## 보안 및 안정성 개선
- [x] X-Powered-By 헤더 비활성화
- [x] X-Content-Type-Options, X-Frame-Options 보안 헤더 추가
- [x] Server 헤더 제거
- [x] PageSpeed API 타임아웃 15s→45s 확대 (실제 응답 20s+ 대응)

## Google Search Console 연동 및 DB 마이그레이션
- [x] consultation_inquiries 테이블에 hospital_id 컨럼 마이그레이션 적용 (DROP+재생성, monthly_reports도 동시 수정)
- [x] Google Search Console 서비스 계정 키 환경변수(GOOGLE_SERVICE_ACCOUNT_KEY) 등록 (mybiseo-gsc-reader@mybiseo-api.iam.gserviceaccount.com)
- [x] 통합 테스트 skip 해제 후 전체 테스트 통과 확인 (28개 통합 테스트 + GSC 인증 테스트 통과)

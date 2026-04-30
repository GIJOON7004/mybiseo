# Project TODO — mybiseo 소스코드 복원 및 배포

- [x] ZIP 소스코드(server, client, drizzle, shared)를 Manus 프로젝트에 덮어씌우기
- [x] package.json 추가 의존성 병합 및 설치 (puppeteer, pdfkit, jspdf, sharp, solapi, nodemailer 등)
- [x] drizzle/schema.ts 적용 및 DB 마이그레이션 실행 (48개 테이블 생성 완료)
- [x] server/routers.ts 및 server/routes/* 전체 라우터 연결 확인
- [x] client/src/App.tsx 라우팅(50개 이상 페이지) 및 모든 컴포넌트/페이지 파일 복원
- [x] shared/_core/errors.ts 경로 보정 및 esbuild alias 설정 유지
- [x] 개발 서버 정상 실행 확인 (localhost:3000 정상 응답)
- [x] GitHub GIJOON7004/mybiseo 리포지토리 최종 동기화 완료
- [ ] 체크포인트 저장 및 게시(publish)

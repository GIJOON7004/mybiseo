/**
 * 시즌별 마케팅 캘린더 시드 데이터 — 진료과별 12개월 추천 키워드
 * 실행: node server/seed-seasonal-calendar.mjs
 */

// 진료과별 월별 시즌 키워드 데이터
const data = [
  // ── 치과 ──
  { specialty: "치과", month: 1, keyword: "새해 스케일링", category: "시술", priority: "high", description: "연초 건강검진 시즌, 스케일링 수요 급증", tips: "새해 건강 결심과 연계한 스케일링 프로모션 추천" },
  { specialty: "치과", month: 2, keyword: "발렌타인 치아미백", category: "프로모션", priority: "medium", description: "발렌타인데이 앞두고 미백 수요 증가", tips: "커플 할인, 화이트데이 연계 마케팅" },
  { specialty: "치과", month: 3, keyword: "봄 교정 상담", category: "시술", priority: "high", description: "신학기 시작 전 교정 상담 수요", tips: "학생 교정 할인, 투명교정 홍보" },
  { specialty: "치과", month: 4, keyword: "어린이 치과검진", category: "건강정보", priority: "medium", description: "구강보건의 날(6/9) 사전 홍보", tips: "어린이 불소도포, 실란트 프로모션" },
  { specialty: "치과", month: 5, keyword: "어버이날 임플란트", category: "프로모션", priority: "high", description: "어버이날 효도 선물로 임플란트 수요", tips: "부모님 임플란트 할인 이벤트, 효도 패키지" },
  { specialty: "치과", month: 6, keyword: "여름 라미네이트", category: "시술", priority: "medium", description: "여름 휴가 전 치아 성형 수요", tips: "라미네이트/비니어 여름 특가" },
  { specialty: "치과", month: 7, keyword: "여름방학 교정", category: "시술", priority: "high", description: "방학 기간 교정 시작 최적기", tips: "학생 방학 교정 패키지, 투명교정 집중 홍보" },
  { specialty: "치과", month: 8, keyword: "잇몸 건강 캠페인", category: "건강정보", priority: "medium", description: "무더위 잇몸 질환 증가 시기", tips: "잇몸 건강 체크 무료 이벤트" },
  { specialty: "치과", month: 9, keyword: "추석 전 치료", category: "프로모션", priority: "high", description: "추석 연휴 전 치과 치료 마무리", tips: "추석 전 긴급 치료, 명절 선물 패키지" },
  { specialty: "치과", month: 10, keyword: "가을 치아미백", category: "시술", priority: "medium", description: "결혼 시즌 미백 수요", tips: "웨딩 미백 패키지, 가을 이벤트" },
  { specialty: "치과", month: 11, keyword: "연말 보험 스케일링", category: "프로모션", priority: "high", description: "건강보험 스케일링 연 1회 혜택 소진", tips: "보험 스케일링 마감 안내, 연말 정산 연계" },
  { specialty: "치과", month: 12, keyword: "크리스마스 미백", category: "프로모션", priority: "medium", description: "연말 모임 앞두고 미백 수요", tips: "크리스마스 미백 특가, 연말 패키지" },

  // ── 피부과 ──
  { specialty: "피부과", month: 1, keyword: "겨울 보습 관리", category: "건강정보", priority: "high", description: "건조한 겨울철 피부 보습 수요", tips: "보습 레이저, 수분 관리 프로그램 홍보" },
  { specialty: "피부과", month: 2, keyword: "봄맞이 피부 리뉴얼", category: "시술", priority: "high", description: "봄 전 피부 톤업/재생 수요", tips: "필링, 레이저 토닝 봄맞이 패키지" },
  { specialty: "피부과", month: 3, keyword: "꽃가루 알레르기 피부", category: "건강정보", priority: "medium", description: "봄철 알레르기 피부염 증가", tips: "알레르기 피부 관리 콘텐츠, 진정 관리" },
  { specialty: "피부과", month: 4, keyword: "자외선 차단 캠페인", category: "건강정보", priority: "high", description: "자외선 강해지는 시기, 선크림 중요성", tips: "자외선 차단 교육 콘텐츠, 기미/주근깨 예방" },
  { specialty: "피부과", month: 5, keyword: "여름 제모", category: "시술", priority: "high", description: "여름 노출 시즌 앞두고 제모 수요 급증", tips: "레이저 제모 얼리버드 할인" },
  { specialty: "피부과", month: 6, keyword: "여름 여드름 관리", category: "시술", priority: "high", description: "고온다습 여드름 악화 시기", tips: "여드름 집중 관리 프로그램, 피지 관리" },
  { specialty: "피부과", month: 7, keyword: "자외선 손상 복구", category: "시술", priority: "medium", description: "강한 자외선 노출 후 피부 복구", tips: "비타민C 관리, 미백 레이저" },
  { specialty: "피부과", month: 8, keyword: "여름 보톡스", category: "시술", priority: "medium", description: "땀 보톡스, 주름 보톡스 수요", tips: "다한증 보톡스, 여름 특가" },
  { specialty: "피부과", month: 9, keyword: "가을 피부 재생", category: "시술", priority: "high", description: "여름 손상 피부 회복 최적기", tips: "프락셀, 리쥬란 가을 패키지" },
  { specialty: "피부과", month: 10, keyword: "기미/색소 치료", category: "시술", priority: "high", description: "자외선 줄어드는 시기, 색소 치료 적기", tips: "기미 레이저 집중 치료 시즌" },
  { specialty: "피부과", month: 11, keyword: "겨울 리프팅", category: "시술", priority: "high", description: "회복기 가리기 좋은 겨울, 리프팅 수요", tips: "울쎄라, 써마지 겨울 특가" },
  { specialty: "피부과", month: 12, keyword: "연말 동안 시술", category: "프로모션", priority: "high", description: "연말 모임, 신년 준비 동안 시술", tips: "필러/보톡스 연말 패키지" },

  // ── 성형외과 ──
  { specialty: "성형외과", month: 1, keyword: "새해 성형 상담", category: "시술", priority: "high", description: "새해 결심으로 성형 상담 급증", tips: "신년 특가, 무이자 할부 이벤트" },
  { specialty: "성형외과", month: 2, keyword: "봄맞이 코성형", category: "시술", priority: "high", description: "봄 전 회복 완료 목표 코성형", tips: "코성형 봄맞이 상담 이벤트" },
  { specialty: "성형외과", month: 3, keyword: "졸업 시즌 성형", category: "프로모션", priority: "high", description: "졸업/입학 시즌 성형 수요", tips: "학생 할인, 졸업 기념 패키지" },
  { specialty: "성형외과", month: 5, keyword: "여름 전 바디성형", category: "시술", priority: "high", description: "여름 노출 대비 지방흡입/바디 성형", tips: "바디 라인 시술 여름 특가" },
  { specialty: "성형외과", month: 7, keyword: "여름방학 성형", category: "프로모션", priority: "high", description: "방학 기간 회복 가능, 학생 수요", tips: "방학 성형 패키지, 학생 할인" },
  { specialty: "성형외과", month: 9, keyword: "가을 눈성형", category: "시술", priority: "medium", description: "선선한 가을 회복 최적기", tips: "쌍꺼풀/눈매교정 가을 이벤트" },
  { specialty: "성형외과", month: 11, keyword: "겨울 성형 시즌", category: "프로모션", priority: "high", description: "마스크/목도리로 회복 가리기 좋은 시즌", tips: "겨울 성형 올인원 패키지" },
  { specialty: "성형외과", month: 12, keyword: "연말 안티에이징", category: "시술", priority: "medium", description: "연말 동안 시술 수요", tips: "리프팅+필러 연말 패키지" },

  // ── 안과 ──
  { specialty: "안과", month: 1, keyword: "새해 라식/라섹", category: "시술", priority: "high", description: "새해 안경 벗기 결심", tips: "신년 라식/라섹 할인 이벤트" },
  { specialty: "안과", month: 3, keyword: "봄 알레르기 결막염", category: "건강정보", priority: "medium", description: "봄철 알레르기 결막염 증가", tips: "결막염 예방 콘텐츠, 안약 처방" },
  { specialty: "안과", month: 5, keyword: "자외선 눈 보호", category: "건강정보", priority: "medium", description: "자외선 강해지는 시기 눈 건강", tips: "선글라스 착용 캠페인, 황반변성 검진" },
  { specialty: "안과", month: 7, keyword: "여름방학 시력교정", category: "시술", priority: "high", description: "방학 회복 기간 활용 시력교정", tips: "학생 라식/라섹 방학 특가" },
  { specialty: "안과", month: 9, keyword: "노안 검진", category: "건강정보", priority: "medium", description: "추석 전후 부모님 눈 건강 체크", tips: "효도 안과검진 패키지" },
  { specialty: "안과", month: 11, keyword: "건조한 겨울 안구건조증", category: "건강정보", priority: "high", description: "겨울철 안구건조증 급증", tips: "안구건조증 치료 프로그램 홍보" },

  // ── 정형외과 ──
  { specialty: "정형외과", month: 1, keyword: "겨울 관절 통증", category: "건강정보", priority: "high", description: "추운 날씨 관절 통증 악화", tips: "관절 건강 체크 캠페인" },
  { specialty: "정형외과", month: 3, keyword: "봄 운동 부상", category: "건강정보", priority: "medium", description: "봄 야외활동 증가로 부상 증가", tips: "운동 전 스트레칭 교육 콘텐츠" },
  { specialty: "정형외과", month: 5, keyword: "등산 무릎 관리", category: "건강정보", priority: "medium", description: "등산 시즌 무릎 부상 증가", tips: "등산 전후 무릎 관리 콘텐츠" },
  { specialty: "정형외과", month: 7, keyword: "여름 수영 어깨", category: "건강정보", priority: "medium", description: "수영 시즌 어깨 부상", tips: "수영 어깨 예방 운동 콘텐츠" },
  { specialty: "정형외과", month: 9, keyword: "추석 후 허리 통증", category: "건강정보", priority: "high", description: "명절 장거리 운전/가사 후 허리 통증", tips: "명절 후 허리 디스크 검진 이벤트" },
  { specialty: "정형외과", month: 11, keyword: "겨울 낙상 예방", category: "건강정보", priority: "high", description: "빙판길 낙상 골절 증가", tips: "낙상 예방 캠페인, 골다공증 검진" },

  // ── 내과 ──
  { specialty: "내과", month: 1, keyword: "신년 건강검진", category: "건강정보", priority: "high", description: "새해 건강검진 수요 최고", tips: "종합검진 신년 특가, 얼리버드" },
  { specialty: "내과", month: 3, keyword: "봄 알레르기 검사", category: "건강정보", priority: "medium", description: "봄철 알레르기 검사 수요", tips: "알레르기 검사 패키지" },
  { specialty: "내과", month: 5, keyword: "성인병 예방", category: "건강정보", priority: "medium", description: "가정의 달 건강 체크", tips: "가족 건강검진 패키지" },
  { specialty: "내과", month: 9, keyword: "독감 예방접종", category: "건강정보", priority: "high", description: "독감 시즌 시작, 예방접종 수요", tips: "독감 예방접종 예약 안내" },
  { specialty: "내과", month: 10, keyword: "건강검진 시즌", category: "건강정보", priority: "high", description: "연말 전 건강검진 마감 러시", tips: "국가건강검진 마감 안내, 추가 검진 패키지" },
  { specialty: "내과", month: 12, keyword: "연말 건강 총정리", category: "건강정보", priority: "medium", description: "연말 건강 결산, 내년 건강 계획", tips: "건강검진 결과 상담 이벤트" },

  // ── 한의원 ──
  { specialty: "한의원", month: 1, keyword: "새해 다이어트 한방", category: "시술", priority: "high", description: "새해 다이어트 결심, 한방 다이어트", tips: "한방 다이어트 신년 특가" },
  { specialty: "한의원", month: 3, keyword: "봄 보약", category: "시술", priority: "high", description: "환절기 보약 수요", tips: "봄 보약 패키지, 면역력 강화" },
  { specialty: "한의원", month: 5, keyword: "여름 보양", category: "시술", priority: "medium", description: "여름 보양 한약 수요", tips: "공진단, 경옥고 여름 보양 패키지" },
  { specialty: "한의원", month: 7, keyword: "삼복더위 보양", category: "프로모션", priority: "high", description: "초복/중복/말복 보양 시즌", tips: "삼복 보양 한약 특가" },
  { specialty: "한의원", month: 9, keyword: "추석 효도 한약", category: "프로모션", priority: "high", description: "추석 선물용 한약 수요", tips: "효도 한약 선물 세트" },
  { specialty: "한의원", month: 11, keyword: "겨울 보약 시즌", category: "시술", priority: "high", description: "겨울철 면역력 강화 보약", tips: "겨울 보약 패키지, 수험생 보약" },

  // ── 산부인과 ──
  { specialty: "산부인과", month: 1, keyword: "새해 여성검진", category: "건강정보", priority: "high", description: "새해 여성 건강검진", tips: "자궁경부암 검진 안내" },
  { specialty: "산부인과", month: 3, keyword: "봄 산전검사", category: "건강정보", priority: "medium", description: "봄 임신 계획 산전검사", tips: "산전검사 패키지" },
  { specialty: "산부인과", month: 5, keyword: "난임 상담", category: "건강정보", priority: "medium", description: "가정의 달 난임 상담 수요", tips: "난임 상담 무료 이벤트" },
  { specialty: "산부인과", month: 9, keyword: "HPV 예방접종", category: "건강정보", priority: "high", description: "학기 시작 HPV 접종 안내", tips: "HPV 예방접종 캠페인" },
  { specialty: "산부인과", month: 11, keyword: "연말 여성검진", category: "건강정보", priority: "high", description: "연말 전 여성 건강검진 마감", tips: "연말 여성검진 할인 이벤트" },

  // ── 소아청소년과 ──
  { specialty: "소아청소년과", month: 2, keyword: "입학 전 예방접종", category: "건강정보", priority: "high", description: "입학/입원 전 예방접종 확인", tips: "입학 전 예방접종 체크리스트" },
  { specialty: "소아청소년과", month: 4, keyword: "봄 알레르기 소아", category: "건강정보", priority: "medium", description: "봄철 소아 알레르기 증가", tips: "소아 알레르기 관리 콘텐츠" },
  { specialty: "소아청소년과", month: 7, keyword: "여름 식중독 예방", category: "건강정보", priority: "medium", description: "여름철 소아 식중독/장염", tips: "여름 위생 관리 캠페인" },
  { specialty: "소아청소년과", month: 9, keyword: "독감 예방접종 소아", category: "건강정보", priority: "high", description: "소아 독감 예방접종 시즌", tips: "소아 독감 예방접종 안내" },
  { specialty: "소아청소년과", month: 11, keyword: "겨울 감기 예방", category: "건강정보", priority: "high", description: "겨울철 소아 감기/독감 증가", tips: "소아 면역력 강화 캠페인" },
];

// DB 삽입 실행
import mysql from "mysql2/promise";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
  
  const conn = await mysql.createConnection(url);
  
  // 기존 데이터 삭제
  await conn.execute("DELETE FROM seasonal_calendar");
  
  let inserted = 0;
  for (const row of data) {
    await conn.execute(
      "INSERT INTO seasonal_calendar (specialty, month, keyword, category, description, priority, tips) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [row.specialty, row.month, row.keyword, row.category, row.description, row.priority, row.tips]
    );
    inserted++;
  }
  
  console.log(`✅ ${inserted}개 시즌 키워드 삽입 완료`);
  await conn.end();
}

seed().catch(console.error);

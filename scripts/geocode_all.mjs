import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load env from mybiseo project
config({ path: '/home/ubuntu/mybiseo/.env' });

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL.replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function geocode(address) {
  const params = new URLSearchParams({
    key: FORGE_API_KEY,
    address: address,
    language: 'ko'
  });
  const url = `${FORGE_API_URL}/v1/maps/proxy/maps/api/geocode/json?${params}`;
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
  } catch (e) {
    console.error(`  ERROR: ${address} -> ${e.message}`);
  }
  return null;
}

// 엑셀에서 추출한 건물 목록 (route_final_v5.py의 결과 기반)
// 동선 순서대로 건물명과 주소
const buildings = [
  // Seg1: 서초구 남하 (교보→우성)
  { name: '교보타워', addr: '서울 서초구 강남대로 465', seg: 1 },
  { name: '리젠 메디컬타워', addr: '서울 서초구 강남대로 463', seg: 1 },
  { name: '강남태영데시앙루브', addr: '서울 서초구 강남대로 455', seg: 1 },
  { name: '서초빌딩', addr: '서울 서초구 강남대로 453', seg: 1 },
  { name: '영신빌딩', addr: '서울 서초구 강남대로 449', seg: 1 },
  { name: '남서울빌딩', addr: '서울 서초구 강남대로 447', seg: 1 },
  { name: '우신빌딩', addr: '서울 서초구 강남대로 445', seg: 1 },
  { name: '서산빌딩', addr: '서울 서초구 강남대로 441', seg: 1 },
  { name: '유화빌딩', addr: '서울 서초구 강남대로 439', seg: 1 },
  { name: '대원빌딩', addr: '서울 서초구 강남대로 437', seg: 1 },
  { name: '주류성빌딩', addr: '서울 서초구 강남대로 435', seg: 1 },
  { name: '효봉빌딩', addr: '서울 서초구 강남대로65길 1', seg: 1 },
  { name: '소형빌딩', addr: '서울 서초구 강남대로85길 5', seg: 1 },
  { name: '케이아이타워', addr: '서울 서초구 강남대로69길 8', seg: 1 },
  { name: '서호빌딩', addr: '서울 서초구 강남대로69길 10', seg: 1 },
  { name: '성우빌딩', addr: '서울 서초구 강남대로 433', seg: 1 },
  { name: '동일빌딩', addr: '서울 서초구 강남대로 429', seg: 1 },
  { name: '한승빌딩', addr: '서울 서초구 강남대로 423', seg: 1 },
  { name: '삼영빌딩', addr: '서울 서초구 강남대로 421', seg: 1 },
  { name: '파고다타워', addr: '서울 서초구 강남대로 419', seg: 1 },
  { name: '대동빌딩', addr: '서울 서초구 강남대로 415', seg: 1 },
  { name: '디에스타워', addr: '서울 서초구 강남대로 411', seg: 1 },
  { name: '오퍼스407', addr: '서울 서초구 강남대로 407', seg: 1 },
  { name: '통영빌딩', addr: '서울 서초구 강남대로 405', seg: 1 },
  { name: '343 GANGNAM', addr: '서울 서초구 강남대로 403', seg: 1 },
  { name: 'ARA TOWER', addr: '서울 서초구 서초대로77길 3', seg: 1 },
  { name: '진명빌딩', addr: '서울 서초구 서초대로77길 5', seg: 1 },
  { name: '강남누드죤빌딩', addr: '서울 서초구 서초대로77길 9', seg: 1 },
  { name: 'BLOCK77', addr: '서울 서초구 서초대로77길 17', seg: 1 },
  { name: 'GWELL Tower II', addr: '서울 서초구 서초대로77길 24', seg: 1 },
  { name: 'MK빌딩', addr: '서울 서초구 서초대로77길 39', seg: 1 },
  { name: '서초더블유타워', addr: '서울 서초구 서초대로77길 54', seg: 1 },
  { name: '에이프로스퀘어', addr: '서울 서초구 서초대로77길 55', seg: 1 },
  { name: 'S&C TOWER', addr: '서울 서초구 서초대로77길 61', seg: 1 },
  { name: '강남역아이파크1차', addr: '서울 서초구 서초대로77길 62', seg: 1 },
  { name: '두산베어스텔', addr: '서울 서초구 강남대로 381', seg: 1 },
  { name: '서초현대타워', addr: '서울 서초구 강남대로 375', seg: 1 },
  { name: '홍우빌딩', addr: '서울 서초구 강남대로 373', seg: 1 },
  { name: 'DF타워', addr: '서울 서초구 강남대로 369', seg: 1 },
  { name: '대우도씨에빛1차', addr: '서울 서초구 강남대로 365', seg: 1 },
  { name: '363강남타워', addr: '서울 서초구 강남대로 363', seg: 1 },
  { name: '대우도씨에빛2', addr: '서울 서초구 강남대로 359', seg: 1 },
  { name: '우남빌딩', addr: '서울 서초구 강남대로 349', seg: 1 },
  { name: '삼원빌딩', addr: '서울 서초구 강남대로 341', seg: 1 },
  { name: '337빌딩', addr: '서울 서초구 강남대로 337', seg: 1 },
  // Seg2: 강남구 북상 (유턴→1번출구)
  { name: '루카831', addr: '서울 강남구 강남대로 338', seg: 2 },
  { name: '경원빌딩', addr: '서울 강남구 강남대로 340', seg: 2 },
  { name: '역삼빌딩', addr: '서울 강남구 강남대로 342', seg: 2 },
  { name: '미왕빌딩', addr: '서울 강남구 강남대로 364', seg: 2 },
  { name: 'FINE TOWER', addr: '서울 강남구 강남대로 372', seg: 2 },
  { name: '강남8258빌딩', addr: '서울 강남구 강남대로 376', seg: 2 },
  { name: '준빌딩', addr: '서울 강남구 강남대로 378', seg: 2 },
  { name: '강남센타빌딩', addr: '서울 강남구 강남대로 388', seg: 2 },
  { name: '미진프라자', addr: '서울 강남구 강남대로 390', seg: 2 },
  { name: '이즈타워', addr: '서울 강남구 테헤란로 101', seg: 2 },
  // Seg3: 강남구 북상 (12번→논현역)
  { name: '시계탑빌딩', addr: '서울 강남구 강남대로 402', seg: 3 },
  { name: '글라스타워', addr: '서울 강남구 강남대로 406', seg: 3 },
  { name: 'YBM빌딩', addr: '서울 강남구 강남대로 408', seg: 3 },
  { name: '바로그의원 건물', addr: '서울 강남구 강남대로 410', seg: 3 },
  { name: '규정빌딩', addr: '서울 강남구 강남대로 412', seg: 3 },
  { name: '창림빌딩', addr: '서울 강남구 강남대로 416', seg: 3 },
  { name: '씨티빌딩', addr: '서울 강남구 강남대로 422', seg: 3 },
  { name: '만이빌딩', addr: '서울 강남구 강남대로 428', seg: 3 },
  { name: '점프밀라노', addr: '서울 강남구 강남대로 432', seg: 3 },
  { name: '스타플렉스', addr: '서울 강남구 강남대로 438', seg: 3 },
  { name: '흥국생명빌딩', addr: '서울 강남구 강남대로 442', seg: 3 },
  { name: '강남한웰빌딩', addr: '서울 강남구 강남대로 446', seg: 3 },
  { name: '대연빌딩', addr: '서울 강남구 강남대로 452', seg: 3 },
  { name: '남영빌딩', addr: '서울 강남구 강남대로 458', seg: 3 },
  { name: '논현동빌딩', addr: '서울 강남구 강남대로 464', seg: 3 },
  { name: '충림빌딩', addr: '서울 강남구 강남대로 468', seg: 3 },
  { name: '커피빈건물', addr: '서울 강남구 봉은사로 108', seg: 3 },
  { name: '808 TOWER', addr: '서울 강남구 강남대로 470', seg: 3 },
  { name: 'URBAN HIVE', addr: '서울 강남구 강남대로 476', seg: 3 },
  { name: '제우빌딩', addr: '서울 강남구 강남대로 478', seg: 3 },
  { name: 'BoraTR빌딩', addr: '서울 강남구 강남대로 480', seg: 3 },
  { name: '99빌딩', addr: '서울 강남구 강남대로 484', seg: 3 },
  { name: '센트럴스퀘어강남', addr: '서울 강남구 강남대로 488', seg: 3 },
  { name: 'HM TOWER', addr: '서울 강남구 강남대로 492', seg: 3 },
  { name: '데이뷰의원', addr: '서울 강남구 강남대로 494', seg: 3 },
  { name: '서희 TOWER', addr: '서울 강남구 강남대로 502', seg: 3 },
  { name: '별성형외과', addr: '서울 서초구 사평대로56길 6', seg: 3 },
  { name: '한일유앤아이빌딩', addr: '서울 서초구 사평대로56길 7', seg: 3 },
  { name: '삼흥빌딩', addr: '서울 서초구 사평대로 373', seg: 3 },
  { name: '에스원빌딩', addr: '서울 강남구 강남대로 516', seg: 3 },
  { name: '화이트518', addr: '서울 강남구 강남대로 518', seg: 3 },
  // Seg4: 서초구 남하 (유턴→교보)
  { name: 'B722빌딩', addr: '서울 서초구 강남대로 531', seg: 4 },
  { name: '투썸플레이스 건물', addr: '서울 서초구 강남대로 527', seg: 4 },
  { name: '강남브랜드안과 건물', addr: '서울 서초구 강남대로 519', seg: 4 },
  { name: '하늘메디컬빌딩 A동', addr: '서울 서초구 강남대로 509', seg: 4 },
  { name: '하늘메디컬빌딩 B동', addr: '서울 서초구 강남대로 509', seg: 4 },
  { name: '신태양빌딩', addr: '서울 서초구 강남대로 507', seg: 4 },
  { name: '고도일병원', addr: '서울 서초구 강남대로 505', seg: 4 },
  { name: '차민성형외과 빌딩', addr: '서울 서초구 강남대로 503', seg: 4 },
  { name: 'IOK안과빌딩', addr: '서울 서초구 강남대로 491', seg: 4 },
  { name: '제애정형외과타워', addr: '서울 서초구 강남대로 489', seg: 4 },
  { name: '원빌딩', addr: '서울 서초구 강남대로 487', seg: 4 },
  { name: '청호빌딩', addr: '서울 서초구 강남대로 483', seg: 4 },
  { name: 'PAGELAB CLINIC', addr: '서울 서초구 강남대로 477', seg: 4 },
  { name: '브라운성형외과빌딩', addr: '서울 서초구 강남대로 475', seg: 4 },
];

async function main() {
  console.log(`총 ${buildings.length}개 건물 Geocoding 시작...`);
  
  const results = [];
  const uniqueAddrs = new Map(); // 중복 주소 캐싱
  
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    
    // 같은 주소는 캐시 사용
    if (uniqueAddrs.has(b.addr)) {
      results.push({ ...b, ...uniqueAddrs.get(b.addr) });
      continue;
    }
    
    const loc = await geocode(b.addr);
    if (loc) {
      const coord = { lat: loc.lat, lng: loc.lng };
      uniqueAddrs.set(b.addr, coord);
      results.push({ ...b, ...coord });
    } else {
      console.log(`  FAILED: ${b.name} (${b.addr})`);
      results.push({ ...b, lat: null, lng: null });
    }
    
    if ((i+1) % 10 === 0) console.log(`  진행: ${i+1}/${buildings.length}`);
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  const success = results.filter(r => r.lat !== null).length;
  console.log(`\n좌표 확보: ${success}/${buildings.length}`);
  
  writeFileSync('/home/ubuntu/building_coords.json', JSON.stringify(results, null, 2));
  console.log('저장 완료: building_coords.json');
}

main().catch(console.error);

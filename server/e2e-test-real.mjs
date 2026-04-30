/**
 * E2E 테스트 스크립트 — 실제 병원 URL로 전체 플로우 검증
 * 
 * 1. 스크린샷 캡처 테스트 (네이버/구글)
 * 2. 현실 진단 생성 테스트
 * 3. PDF 생성 테스트 (현실 진단 + 스크린샷 포함)
 * 4. 이메일 발송 시뮬레이션 (실제 발송 없이 PDF 생성까지)
 */
import { createRequire } from "module";
import { register } from "tsx/esm/api";
const unregister = register();
const require = createRequire(import.meta.url);

// Load env
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const fs = require("fs");
const path = require("path");

const TEST_URL = "https://editionps.com";
const TEST_SPECIALTY = "성형외과";
const TEST_KEYWORDS = ["에디션성형외과", "강남 성형외과"];

console.log("=== E2E 테스트 시작 ===");
console.log(`URL: ${TEST_URL}`);
console.log(`진료과: ${TEST_SPECIALTY}`);
console.log(`키워드: ${TEST_KEYWORDS.join(", ")}`);
console.log("");

// ── Step 1: 스크린샷 캡처 테스트 ──
console.log("--- Step 1: 스크린샷 캡처 테스트 ---");
try {
  const { captureSearchScreenshots } = await import("./search-screenshot.ts");
  
  const startTime = Date.now();
  const result = await captureSearchScreenshots(TEST_KEYWORDS, ["naver", "google"], 2);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`  소요 시간: ${elapsed}초`);
  console.log(`  캡처 성공: ${result.screenshots.length}개`);
  console.log(`  에러: ${result.errors.length}개`);
  
  for (const ss of result.screenshots) {
    const placeholder = ss.isPlaceholder ? " [PLACEHOLDER]" : "";
    console.log(`  - [${ss.engine}] "${ss.keyword}" → ${ss.imageUrl.substring(0, 80)}...${placeholder}`);
  }
  
  if (result.errors.length > 0) {
    for (const err of result.errors) {
      console.log(`  [ERROR] ${err}`);
    }
  }
  
  // 스크린샷 결과를 다음 단계에서 사용
  globalThis.__screenshots = result.screenshots;
  console.log("  >> 스크린샷 캡처 완료\n");
} catch (err) {
  console.error("  >> 스크린샷 캡처 실패:", err.message);
  globalThis.__screenshots = [];
}

// ── Step 2: SEO 분석 테스트 ──
console.log("--- Step 2: SEO 분석 ---");
let seoResult;
try {
  const { analyzeSeo } = await import("./seo-analyzer.ts");
  
  const startTime = Date.now();
  seoResult = await analyzeSeo(TEST_URL, TEST_SPECIALTY, "kr");
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`  소요 시간: ${elapsed}초`);
  console.log(`  총점: ${seoResult.totalScore}/${seoResult.maxScore} (${seoResult.grade})`);
  console.log(`  카테고리: ${seoResult.categories.length}개`);
  for (const cat of seoResult.categories) {
    const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
    console.log(`    - ${cat.name}: ${cat.score}/${cat.maxScore} (${pct}%)`);
  }
  console.log("  >> SEO 분석 완료\n");
} catch (err) {
  console.error("  >> SEO 분석 실패:", err.message);
  process.exit(1);
}

// ── Step 3: 현실 진단 생성 테스트 ──
console.log("--- Step 3: 현실 진단 생성 ---");
let realityDiagnosis;
try {
  const { generateRealityDiagnosis } = await import("./reality-diagnosis.ts");
  
  const categoryScores = Object.fromEntries(
    seoResult.categories.map(c => [c.name, c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0])
  );
  const domain = TEST_URL.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  
  const startTime = Date.now();
  realityDiagnosis = await generateRealityDiagnosis(
    domain,
    TEST_SPECIALTY,
    seoResult.totalScore,
    seoResult.grade,
    categoryScores,
    seoResult.siteName,
  );
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`  소요 시간: ${elapsed}초`);
  console.log(`  병원명: ${realityDiagnosis.hospitalName}`);
  console.log(`  헤드라인: ${realityDiagnosis.headline}`);
  console.log(`  위험도: ${realityDiagnosis.riskScore}/100 (${realityDiagnosis.urgencyLevel})`);
  console.log(`  키워드: ${realityDiagnosis.keywords?.length || 0}개`);
  console.log(`  경쟁사: ${realityDiagnosis.competitors?.length || 0}개`);
  console.log(`  액션 아이템: ${realityDiagnosis.actionItems?.length || 0}개`);
  
  // 스크린샷 연동
  if (globalThis.__screenshots && globalThis.__screenshots.length > 0) {
    realityDiagnosis.searchScreenshots = globalThis.__screenshots;
    console.log(`  스크린샷 연동: ${globalThis.__screenshots.length}개`);
  }
  
  console.log("  >> 현실 진단 생성 완료\n");
} catch (err) {
  console.error("  >> 현실 진단 생성 실패:", err.message);
  realityDiagnosis = null;
}

// ── Step 4: PDF 생성 테스트 ──
console.log("--- Step 4: PDF 생성 (현실 진단 + 스크린샷 포함) ---");
try {
  const { generateSeoReportPdf } = await import("./seo-report-pdf.ts");
  
  const startTime = Date.now();
  const pdfBuffer = await generateSeoReportPdf(seoResult, "kr", "ko", realityDiagnosis);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // 로컬에 저장해서 확인
  const outputPath = path.join("/home/ubuntu", "e2e-test-report.pdf");
  fs.writeFileSync(outputPath, pdfBuffer);
  
  const fileSizeKB = Math.round(pdfBuffer.length / 1024);
  console.log(`  소요 시간: ${elapsed}초`);
  console.log(`  파일 크기: ${fileSizeKB}KB`);
  console.log(`  저장 위치: ${outputPath}`);
  console.log(`  현실 진단 포함: ${realityDiagnosis ? "YES" : "NO"}`);
  console.log(`  스크린샷 포함: ${realityDiagnosis?.searchScreenshots?.length > 0 ? "YES (" + realityDiagnosis.searchScreenshots.length + "개)" : "NO"}`);
  console.log("  >> PDF 생성 완료\n");
} catch (err) {
  console.error("  >> PDF 생성 실패:", err.message);
  console.error(err.stack);
}

// ── Step 5: 영문 PDF 생성 테스트 ──
console.log("--- Step 5: 영문 PDF 생성 테스트 ---");
try {
  const { generateSeoReportPdf } = await import("./seo-report-pdf.ts");
  
  const startTime = Date.now();
  const pdfBuffer = await generateSeoReportPdf(seoResult, "kr", "en", realityDiagnosis);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  const outputPath = path.join("/home/ubuntu", "e2e-test-report-en.pdf");
  fs.writeFileSync(outputPath, pdfBuffer);
  
  const fileSizeKB = Math.round(pdfBuffer.length / 1024);
  console.log(`  소요 시간: ${elapsed}초`);
  console.log(`  파일 크기: ${fileSizeKB}KB`);
  console.log(`  저장 위치: ${outputPath}`);
  console.log("  >> 영문 PDF 생성 완료\n");
} catch (err) {
  console.error("  >> 영문 PDF 생성 실패:", err.message);
}

console.log("=== E2E 테스트 완료 ===");
console.log("");
console.log("결과 요약:");
console.log(`  SEO 점수: ${seoResult?.totalScore || "N/A"}/${seoResult?.maxScore || "N/A"} (${seoResult?.grade || "N/A"})`);
console.log(`  현실 진단: ${realityDiagnosis ? "생성됨" : "실패"}`);
console.log(`  스크린샷: ${globalThis.__screenshots?.length || 0}개 캡처`);
console.log(`  PDF: /home/ubuntu/e2e-test-report.pdf 확인`);

process.exit(0);

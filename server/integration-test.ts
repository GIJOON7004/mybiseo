/**
 * 통합 테스트: 실제 병원 URL로 SEO 분석 + Reality Diagnosis 실행
 * 실행: npx tsx server/integration-test.ts
 */
import { analyzeSeo } from "./seo-analyzer";

const TEST_URLS = [
  { url: "https://gijoon.com", specialty: "성형외과" },
];

async function runSeoTest(testCase: { url: string; specialty: string }) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SEO 분석 테스트: ${testCase.url} (${testCase.specialty})`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  try {
    const result = await analyzeSeo(testCase.url, testCase.specialty);
    const elapsed = Date.now() - startTime;

    console.log(`✓ SEO 분석 완료 (${elapsed}ms)`);
    console.log(`  총점: ${result.totalScore}/${result.maxScore} (${result.grade})`);
    console.log(`  카테고리 수: ${result.categories.length}`);
    console.log(`  항목 수: ${result.categories.reduce((s, c) => s + c.items.length, 0)}`);
    console.log(`  Pass/Warning/Fail: ${result.summary.passed}/${result.summary.warnings}/${result.summary.failed}`);
    console.log(`  사이트명: ${result.siteName || "N/A"}`);

    // 카테고리별 점수
    console.log(`\n  카테고리별 점수:`);
    for (const cat of result.categories) {
      const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
      console.log(`    ${cat.name}: ${cat.score}/${cat.maxScore} (${pct}%)`);
    }

    // 멀티페이지 크롤링 결과
    if (result.multiPage) {
      console.log(`\n  멀티페이지: ${result.multiPage.subPageCount}개 서브페이지 크롤링`);
    }

    // PageSpeed 결과
    if (result.pageSpeed) {
      console.log(`\n  PageSpeed 실측 데이터:`);
      console.log(`    Performance: ${result.pageSpeed.performanceScore}/100`);
      console.log(`    Accessibility: ${result.pageSpeed.accessibilityScore}/100`);
      console.log(`    Best Practices: ${result.pageSpeed.bestPracticesScore}/100`);
      console.log(`    SEO: ${result.pageSpeed.seoScore}/100`);
      console.log(`    LCP: ${result.pageSpeed.lcp?.value}ms`);
      console.log(`    CLS: ${result.pageSpeed.cls?.value}`);
    } else {
      console.log(`\n  ⚠️ PageSpeed 데이터 없음 (API 키 미설정 또는 타임아웃)`);
    }

    // 검증: 점수가 합리적 범위인지
    const percent = result.maxScore > 0 ? (result.totalScore / result.maxScore) * 100 : 0;
    if (percent < 10 || percent > 95) {
      console.log(`  ⚠️ 점수가 비정상 범위: ${percent.toFixed(1)}%`);
    } else {
      console.log(`  ✓ 점수 범위 정상: ${percent.toFixed(1)}%`);
    }

    // 검증: 최소 항목 수
    const totalItems = result.categories.reduce((s, c) => s + c.items.length, 0);
    if (totalItems < 30) {
      console.log(`  ⚠️ 항목 수 부족: ${totalItems}개 (최소 30개 기대)`);
    } else {
      console.log(`  ✓ 항목 수 충분: ${totalItems}개`);
    }

    return { success: true, result };
  } catch (e: any) {
    const elapsed = Date.now() - startTime;
    console.log(`✗ 실패 (${elapsed}ms): ${e.message}`);
    console.log(`  Stack: ${e.stack?.split("\n").slice(0, 3).join("\n  ")}`);
    return { success: false, error: e.message };
  }
}

async function main() {
  console.log("=== MY비서 통합 테스트 시작 ===\n");

  const results = [];
  for (const tc of TEST_URLS) {
    const r = await runSeoTest(tc);
    results.push(r);
  }

  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`통합 테스트 결과: ${results.filter((r) => r.success).length}/${results.length} 성공`);
  process.exit(results.every((r) => r.success) ? 0 : 1);
}

main();

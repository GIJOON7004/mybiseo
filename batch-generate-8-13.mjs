/**
 * 코스2 8~13번 병원 AI 가시성 진단서 배치 생성
 * 다음산부인과, 원진치과, 아름다운나라피부과, 포샤르치과의원, 클래스원의원, 수림선한의원
 */
import fs from "fs";
import path from "path";

const SERVER_URL = "http://localhost:3000";
const OUTPUT_DIR = "/home/ubuntu/ai-visibility-reports-v3";

const hospitals = [
  { name: "다음산부인과", url: "https://daumclinic.com/", specialty: "산부인과" },
  { name: "원진치과", url: "https://wonjindental.com", specialty: "치과" },
  { name: "아름다운나라피부과", url: "https://anacli.co.kr/", specialty: "피부과" },
  { name: "포샤르치과의원", url: "http://www.fauchard.co.kr/", specialty: "치과" },
  { name: "클래스원의원", url: "https://classoneclinic.com/", specialty: "성형외과" },
  { name: "수림선한의원", url: "http://수림선한의원.com", specialty: "한의원" },
];

async function generateReport(hospital, index) {
  const safeName = hospital.name.replace(/\//g, "·");
  const fileName = `[${safeName}] AI 가시성 진단서.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 50000) {
    console.log(`⏭️  SKIP (already exists): ${fileName}`);
    return { success: true, skipped: true };
  }

  console.log(`\n🔄 [${index + 1}/6] Generating: ${hospital.name} (${hospital.url})`);
  const startTime = Date.now();

  try {
    // Step 1: SEO 분석
    console.log(`   📊 SEO 분석 중...`);
    const analyzeRes = await fetch(`${SERVER_URL}/api/trpc/seoAnalyzer.analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { url: hospital.url, specialty: hospital.specialty, country: "kr", skipPageSpeed: true }
      }),
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      throw new Error(`Analyze failed (${analyzeRes.status}): ${errText.substring(0, 200)}`);
    }

    const analyzeData = await analyzeRes.json();
    const seoResult = analyzeData.result?.data?.json || analyzeData.result?.data;

    if (!seoResult) {
      throw new Error("No SEO result returned");
    }
    console.log(`   ✓ SEO 분석 완료 (점수: ${seoResult.overallScore || 'N/A'})`);

    // Step 2: PDF 생성 (LLM 호출 포함)
    console.log(`   📄 PDF 생성 중 (LLM 호출)...`);
    const reportRes = await fetch(`${SERVER_URL}/api/trpc/seoAnalyzer.generateReport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { url: hospital.url, specialty: hospital.specialty, country: "kr", language: "ko", result: seoResult }
      }),
    });

    if (!reportRes.ok) {
      const errText = await reportRes.text();
      throw new Error(`Report generation failed (${reportRes.status}): ${errText.substring(0, 300)}`);
    }

    const reportData = await reportRes.json();
    const pdfUrl = reportData.result?.data?.json?.url || reportData.result?.data?.json?.pdfUrl;

    if (!pdfUrl) {
      throw new Error("No PDF URL returned");
    }

    // Step 3: PDF 다운로드
    const fullUrl = pdfUrl.startsWith("http") ? pdfUrl : `${SERVER_URL}${pdfUrl}`;
    const pdfRes = await fetch(fullUrl);
    if (!pdfRes.ok) throw new Error(`PDF download failed: ${pdfRes.status}`);

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    fs.writeFileSync(filePath, pdfBuffer);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const sizeKB = (pdfBuffer.length / 1024).toFixed(0);
    console.log(`   ✅ SUCCESS: ${fileName} (${sizeKB}KB, ${elapsed}s)`);
    return { success: true, elapsed, size: sizeKB };

  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`   ❌ FAILED: ${hospital.name} (${elapsed}s) - ${err.message}`);
    return { success: false, error: err.message, elapsed };
  }
}

async function main() {
  console.log(`\n📋 코스2 8~13번 병원 AI 가시성 진단서 배치 생성`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🏥 Hospitals: ${hospitals.map(h => h.name).join(", ")}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = [];
  for (let i = 0; i < hospitals.length; i++) {
    const result = await generateReport(hospitals[i], i);
    results.push({ ...result, name: hospitals[i].name });

    if (!result.success && !result.skipped) {
      console.log(`\n⚠️  ${hospitals[i].name} 실패. 다음 병원으로 계속 진행...`);
    }

    // 병원 간 3초 대기 (LLM rate limit 방지)
    if (i < hospitals.length - 1 && !result.skipped) {
      console.log(`   ⏳ 3초 대기...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // 결과 요약
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 결과 요약:`);
  const success = results.filter(r => r.success && !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const failed = results.filter(r => !r.success);
  console.log(`   ✅ 성공: ${success.length}개`);
  if (skipped.length) console.log(`   ⏭️  스킵: ${skipped.length}개`);
  if (failed.length) {
    console.log(`   ❌ 실패: ${failed.length}개`);
    failed.forEach(f => console.log(`      - ${f.name}: ${f.error}`));
  }
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(console.error);

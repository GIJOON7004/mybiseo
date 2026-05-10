/**
 * 실패 2건 재생성 스크립트
 * - 다음성형외과/피부과 (파일명 / 문자 문제 → _ 로 치환)
 * - 뷰앤유외과 (이미 생성 완료 확인됨 - 스킵)
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const SERVER_URL = "http://localhost:3001";
const OUTPUT_DIR = "/home/ubuntu/ai-visibility-reports-v2";

const hospitals = [
  { name: "다음성형외과/피부과", url: "https://m.dawoomps.com/", specialty: "성형외과" },
];

async function generateReport(hospital) {
  const safeName = hospital.name.replace(/\//g, "·");  // / → · (가운데점)
  const fileName = `[${safeName}] AI 가시성 진단서.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  SKIP (already exists): ${fileName}`);
    return { success: true, skipped: true };
  }

  console.log(`🔄 Generating: ${hospital.name} (${hospital.url})`);
  const startTime = Date.now();

  try {
    // Step 1: SEO 분석 (skipPageSpeed)
    const analyzeRes = await fetch(`${SERVER_URL}/api/trpc/seo.analyze`, {
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

    // Step 2: PDF 생성 (LLM 호출 포함)
    const reportRes = await fetch(`${SERVER_URL}/api/trpc/seo.generateReport`, {
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
    const pdfRes = await fetch(pdfUrl.startsWith("http") ? pdfUrl : `${SERVER_URL}${pdfUrl}`);
    if (!pdfRes.ok) throw new Error(`PDF download failed: ${pdfRes.status}`);
    
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    fs.writeFileSync(filePath, pdfBuffer);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ SUCCESS: ${fileName} (${(pdfBuffer.length / 1024).toFixed(0)}KB, ${elapsed}s)`);
    return { success: true, elapsed };
    
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ FAILED: ${hospital.name} (${elapsed}s) - ${err.message}`);
    return { success: false, error: err.message, elapsed };
  }
}

async function main() {
  console.log(`\n📋 Retry failed reports (${hospitals.length} hospitals)`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const h of hospitals) {
    const result = await generateReport(h);
    if (!result.success) {
      console.log("\n⚠️  LLM 한도 초과 가능성 있음. 나중에 다시 시도하세요.");
    }
  }
  
  console.log("\n🏁 Done!");
}

main().catch(console.error);

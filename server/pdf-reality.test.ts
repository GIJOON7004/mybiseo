/**
 * Tests for Reality Diagnosis integration in SEO Report PDF
 * Updated: Batch 1 - 7개 신규 섹션 추가 검증
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("49차: PDF에 현실 진단 요약 섹션 추가", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const seoRouterSrc = readFileSync(resolve(__dirname, "routes/seo.ts"), "utf-8");
  const seoCheckerSrc = readFileSync(resolve(__dirname, "../client/src/pages/SeoChecker.tsx"), "utf-8");

  it("seo-report-pdf.ts에서 RealityDiagnosis 타입을 import한다", () => {
    expect(pdfSrc).toContain("import type { RealityDiagnosis");
  });

  it("generateSeoReportPdf 함수가 realityDiagnosis 파라미터를 받는다", () => {
    expect(pdfSrc).toContain("realityDiagnosis?: RealityDiagnosis");
  });

  it("PDF에 현실 진단 요약 페이지가 Executive Summary 다음에 삽입된다", () => {
    expect(pdfSrc).toContain("REALITY DIAGNOSIS PAGES");
    // Executive Summary 이후, Reality Diagnosis 위치 (커버 → ExecSummary → Reality)
    const execIdx = pdfSrc.indexOf("PAGE: EXECUTIVE SUMMARY");
    const realityIdx = pdfSrc.indexOf("REALITY DIAGNOSIS PAGES");
    expect(execIdx).toBeLessThan(realityIdx);
  });

  it("PDF 현실 진단에 핵심 요소들이 포함된다", () => {
    // 헤드라인
    expect(pdfSrc).toContain("rd.headline");
    // 3대 지표 게이지
    expect(pdfSrc).toContain("rd.metrics.naverExposureRate");
    expect(pdfSrc).toContain("rd.metrics.googleExposureRate");
    expect(pdfSrc).toContain("rd.metrics.aiReadiness");
    // 핵심 발견사항
    expect(pdfSrc).toContain("rd.keyFindings");
    // 키워드 테이블
    expect(pdfSrc).toContain("rd.keywords");
    // 경쟁 병원
    expect(pdfSrc).toContain("rd.competitors");
    // 개선 로드맵
    expect(pdfSrc).toContain("rd.actionItems");
    // 종합 의견
    expect(pdfSrc).toContain("rd.closingStatement");
  });

  it("i18n에 현실 진단 관련 텍스트가 ko/en/th 모두 있다", () => {
    // 한국어
    expect(pdfSrc).toContain('realityTitle: "디지털 가시성 현실 진단"');
    expect(pdfSrc).toContain('realityKeywords: "키워드별 AI\u00b7포털 노출 현황"');
    expect(pdfSrc).toContain('realityCompetitors: "경쟁 환경 분석"');
    // 영어
    expect(pdfSrc).toContain('realityTitle: "Digital Visibility Reality Check"');
  });

  it("generateReport 프로시저에서 specialty를 받아 realityDiagnosis를 생성한다", () => {
    expect(seoRouterSrc).toContain("generateRealityDiagnosis");
    expect(seoRouterSrc).toContain("realityData");
    expect(seoRouterSrc).toContain("generateSeoReportPdf(result, input.country");
  });

  it("PdfDownloadButton에서 specialty를 서버로 전달한다", () => {
    expect(seoCheckerSrc).toContain("specialty?: string");
    expect(seoCheckerSrc).toContain("if (specialty) payload.specialty = specialty");
    expect(seoCheckerSrc).toContain("specialty={specialty}");
  });

  it("키워드 테이블에 네이버/구글/AI 상태 배지가 있다", () => {
    expect(pdfSrc).toContain("kw.naver.found");
    expect(pdfSrc).toContain("kw.google.found");
    expect(pdfSrc).toContain("kw.ai.likelihood");
  });

  it("경쟁 병원 카드에 가시성 배지가 있다", () => {
    expect(pdfSrc).toContain("comp.estimatedVisibility");
    expect(pdfSrc).toContain("comp.advantage");
  });

  it("콘텐츠 사각지대 분석 섹션이 PDF에 포함된다", () => {
    expect(pdfSrc).toContain("rd.contentGaps");
    expect(pdfSrc).toContain("gap.keyword");
    expect(pdfSrc).toContain("gap.opportunityScore");
    expect(pdfSrc).toContain("gap.searchIntent");
    expect(pdfSrc).toContain("gap.suggestedContent");
    expect(pdfSrc).toContain("gap.difficulty");
  });

  it("i18n에 콘텐츠 사각지대 분석 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('contentGapsTitle: "콘텐츠 사각지대 분석"');
    expect(pdfSrc).toContain('contentGapsTitle: "Content Gap Analysis"');
    expect(pdfSrc).toContain('contentGapsTitle: "การวิเคราะห์ช่องว่างเนื้อหา"');
  });

  it("reality-diagnosis.ts에 contentGaps 필드가 정의되어 있다", () => {
    const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");
    expect(diagSrc).toContain("contentGaps");
    expect(diagSrc).toContain("opportunityScore");
    expect(diagSrc).toContain("suggestedContent");
    expect(diagSrc).toContain("searchIntent");
  });

  it("프론트엔드 RealityDetails에 콘텐츠 사각지대 섹션이 있다", () => {
    const detailsSrc = readFileSync(resolve(__dirname, "../client/src/components/RealityDetails.tsx"), "utf-8");
    expect(detailsSrc).toContain("콘텐츠 사각지대 분석");
    expect(detailsSrc).toContain("contentGaps");
    expect(detailsSrc).toContain("opportunityScore");
  });
});

// ═══════════════════════════════════════════════
// Batch 1: 7개 신규 섹션 테스트
// ═══════════════════════════════════════════════
describe("Batch 1: GEO 3축 진단 (RxA/F) 섹션", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 geoTriAxis 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("geoTriAxis");
    expect(diagSrc).toContain("relevance:");
    expect(diagSrc).toContain("authority:");
    expect(diagSrc).toContain("friction:");
    expect(diagSrc).toContain("overallGeoScore:");
    expect(diagSrc).toContain("interpretation:");
  });

  it("PDF에 GEO 3축 진단 섹션이 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.geoTriAxis");
    expect(pdfSrc).toContain("rd.geoTriAxis.relevance");
    expect(pdfSrc).toContain("rd.geoTriAxis.authority");
    expect(pdfSrc).toContain("rd.geoTriAxis.friction");
    expect(pdfSrc).toContain("rd.geoTriAxis.overallGeoScore");
  });

  it("i18n에 GEO 3축 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('geoTriAxisTitle: "GEO(Generative Engine Optimization) 3\ucd95 \uc9c4\ub2e8"');
    expect(pdfSrc).toContain('geoTriAxisTitle: "GEO Tri-Axis Diagnosis (RxA/F)"');
    expect(pdfSrc).toContain('geoTriAxisTitle: "การวินิจฉัย GEO 3 แกน (RxA/F)"');
  });
});

describe("Batch 1: AI 인용 임계점 체크리스트 섹션", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 aiCitationThreshold 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("aiCitationThreshold");
    expect(diagSrc).toContain("condition:");
    expect(diagSrc).toContain("met:");
    expect(diagSrc).toContain("howToFix:");
    expect(diagSrc).toContain("metCount:");
    expect(diagSrc).toContain("totalCount:");
    expect(diagSrc).toContain("verdict:");
  });

  it("PDF에 AI 인용 임계점 체크리스트가 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.aiCitationThreshold");
    expect(pdfSrc).toContain("rd.aiCitationThreshold.items");
    expect(pdfSrc).toContain("rd.aiCitationThreshold.metCount");
    expect(pdfSrc).toContain("rd.aiCitationThreshold.totalCount");
    expect(pdfSrc).toContain("rd.aiCitationThreshold.verdict");
  });

  it("i18n에 AI 인용 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('aiCitationTitle: "AI 인용 임계점 체크리스트"');
    expect(pdfSrc).toContain('aiCitationTitle: "AI Citation Threshold Checklist"');
    expect(pdfSrc).toContain('aiCitationTitle: "รายการตรวจสอบเกณฑ์การอ้างอิง AI"');
  });
});

describe("Batch 1: 답변 캡슐 품질 진단 섹션", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 answerCapsule 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("answerCapsule");
    expect(diagSrc).toContain("currentBestSentence:");
    expect(diagSrc).toContain("idealSentence:");
    expect(diagSrc).toContain("issues:");
    expect(diagSrc).toContain("recommendations:");
  });

  it("PDF에 답변 캡슐 품질 진단이 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.answerCapsule");
    expect(pdfSrc).toContain("rd.answerCapsule.score");
    expect(pdfSrc).toContain("rd.answerCapsule.currentBestSentence");
    expect(pdfSrc).toContain("rd.answerCapsule.idealSentence");
    expect(pdfSrc).toContain("rd.answerCapsule.issues");
  });

  it("i18n에 답변 캡슐 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('answerCapsuleTitle: "답변 캡슐 품질 진단"');
    expect(pdfSrc).toContain('answerCapsuleTitle: "Answer Capsule Quality Diagnosis"');
    expect(pdfSrc).toContain('answerCapsuleTitle: "การวินิจฉัยคุณภาพแคปซูลคำตอบ"');
  });
});

describe("Batch 1: 4채널 교차 신뢰 진단 섹션", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 crossChannelTrust 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("crossChannelTrust");
    expect(diagSrc).toContain("channels:");
    expect(diagSrc).toContain("overallConsistency:");
    expect(diagSrc).toContain("consistencyScore:");
  });

  it("PDF에 4채널 교차 신뢰 진단이 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.crossChannelTrust");
    expect(pdfSrc).toContain("rd.crossChannelTrust.channels");
    expect(pdfSrc).toContain("rd.crossChannelTrust.overallConsistency");
    expect(pdfSrc).toContain("rd.crossChannelTrust.verdict");
  });

  it("i18n에 4채널 교차 신뢰 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('crossChannelTitle: "4채널 교차 신뢰 진단"');
    expect(pdfSrc).toContain('crossChannelTitle: "4-Channel Cross Trust Diagnosis"');
    expect(pdfSrc).toContain('crossChannelTitle: "การวินิจฉัยความน่าเชื่อถือข้ามช่องทาง 4 ช่อง"');
  });
});

describe("Batch 1: AI 추천 시뮬레이터 섹션", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 aiSimulator 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("aiSimulator");
    expect(diagSrc).toContain("engine:");
    expect(diagSrc).toContain("mentioned:");
    expect(diagSrc).toContain("mentionRate:");
  });

  it("PDF에 AI 추천 시뮬레이터가 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.aiSimulator");
    expect(pdfSrc).toContain("rd.aiSimulator.results");
    expect(pdfSrc).toContain("rd.aiSimulator.mentionRate");
    expect(pdfSrc).toContain("rd.aiSimulator.query");
    expect(pdfSrc).toContain("rd.aiSimulator.verdict");
  });

  it("i18n에 AI 시뮬레이터 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('aiSimulatorTitle: "AI 추천 시뮬레이터"');
    expect(pdfSrc).toContain('aiSimulatorTitle: "AI Recommendation Simulator"');
    expect(pdfSrc).toContain('aiSimulatorTitle: "ตัวจำลองคำแนะนำ AI"');
  });
});

describe("Batch 1: 네이버 Cue 대응 진단 섹션", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 naverCueDiagnosis 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("naverCueDiagnosis");
    expect(diagSrc).toContain("criterion:");
    expect(diagSrc).toContain("recommendation:");
  });

  it("PDF에 네이버 Cue 대응 진단이 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.naverCueDiagnosis");
    expect(pdfSrc).toContain("rd.naverCueDiagnosis.score");
    expect(pdfSrc).toContain("rd.naverCueDiagnosis.items");
    expect(pdfSrc).toContain("rd.naverCueDiagnosis.verdict");
  });

  it("i18n에 네이버 Cue 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('naverCueTitle: "네이버 Cue: 대응 진단"');
    expect(pdfSrc).toContain('naverCueTitle: "Naver Cue: Response Diagnosis"');
    expect(pdfSrc).toContain('naverCueTitle: "Naver Cue: การวินิจฉัยการตอบสนอง"');
  });
});

describe("Batch 1: 전략 가이드 섹션 (웹사이트 변환 + 콘텐츠 + 마케팅 + mybiseo)", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");
  const diagSrc = readFileSync(resolve(__dirname, "reality-diagnosis.ts"), "utf-8");

  it("reality-diagnosis.ts에 전략 가이드 관련 인터페이스가 정의되어 있다", () => {
    expect(diagSrc).toContain("websiteTransformGuide");
    expect(diagSrc).toContain("contentStrategy");
    expect(diagSrc).toContain("marketingDirection");
    expect(diagSrc).toContain("mybiseoServices");
  });

  it("PDF에 웹사이트 변환 가이드가 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.websiteTransformGuide");
    expect(pdfSrc).toContain("rd.websiteTransformGuide.currentState");
    expect(pdfSrc).toContain("rd.websiteTransformGuide.transformations");
  });

  it("PDF에 콘텐츠 전략이 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.contentStrategy");
    expect(pdfSrc).toContain("rd.contentStrategy.blogStrategy");
    expect(pdfSrc).toContain("rd.contentStrategy.faqStrategy");
    expect(pdfSrc).toContain("rd.contentStrategy.contentCalendar");
  });

  it("PDF에 마케팅 방향이 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.marketingDirection");
    expect(pdfSrc).toContain("rd.marketingDirection.overallStrategy");
    expect(pdfSrc).toContain("rd.marketingDirection.channelStrategies");
    expect(pdfSrc).toContain("rd.marketingDirection.coexistenceMessage");
  });

  it("PDF에 mybiseo 서비스 소개가 렌더링된다", () => {
    expect(pdfSrc).toContain("rd.mybiseoServices");
    expect(pdfSrc).toContain("rd.mybiseoServices.headline");
    expect(pdfSrc).toContain("rd.mybiseoServices.services");
    // ctaMessage는 CTA 페이지에서 통합 표시 (drawInfoBox 제거)
    // expect(pdfSrc).toContain("rd.mybiseoServices.ctaMessage");
  });

  it("i18n에 전략 가이드 라벨이 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('strategicGuideTitle: "전략 가이드"');
    expect(pdfSrc).toContain('strategicGuideTitle: "Strategic Guide"');
    expect(pdfSrc).toContain('strategicGuideTitle: "คู่มือกลยุทธ์"');
    expect(pdfSrc).toContain('guideWebsite: "웹사이트 변환 가이드"');
    expect(pdfSrc).toContain('guideContent: "콘텐츠 전략"');
    expect(pdfSrc).toContain('guideMarketing: "마케팅 방향"');
    expect(pdfSrc).toContain('guideMybiseo: "MY비서 추천 서비스"');
  });
});

describe("Batch 1: 신규 섹션 배치 순서 검증", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");

  it("신규 섹션들이 closingStatement 이후, HISTORY TREND 이전에 위치한다", () => {
    const closingIdx = pdfSrc.indexOf("rd.closingStatement");
    const geoIdx = pdfSrc.indexOf("SECTION: GEO 3축 진단");
    const citationIdx = pdfSrc.indexOf("SECTION: AI 인용 임계점");
    const capsuleIdx = pdfSrc.indexOf("SECTION: 답변 캡슐");
    const crossIdx = pdfSrc.indexOf("SECTION: 4채널 교차 신뢰");
    const simIdx = pdfSrc.indexOf("SECTION: AI 추천 시뮬레이터");
    const cueIdx = pdfSrc.indexOf("SECTION: 네이버 Cue");
    const guideIdx = pdfSrc.indexOf("SECTION: 전략 가이드");
    const historyIdx = pdfSrc.indexOf("PAGE: HISTORY TREND");

    // 모든 신규 섹션이 존재
    expect(geoIdx).toBeGreaterThan(-1);
    expect(citationIdx).toBeGreaterThan(-1);
    expect(capsuleIdx).toBeGreaterThan(-1);
    expect(crossIdx).toBeGreaterThan(-1);
    expect(simIdx).toBeGreaterThan(-1);
    expect(cueIdx).toBeGreaterThan(-1);
    expect(guideIdx).toBeGreaterThan(-1);

    // 순서: closingStatement < GEO < Citation < Capsule < Cross < Sim < Cue < Guide < History
    expect(closingIdx).toBeLessThan(geoIdx);
    expect(geoIdx).toBeLessThan(citationIdx);
    expect(citationIdx).toBeLessThan(capsuleIdx);
    expect(capsuleIdx).toBeLessThan(crossIdx);
    expect(crossIdx).toBeLessThan(simIdx);
    expect(simIdx).toBeLessThan(cueIdx);
    expect(cueIdx).toBeLessThan(guideIdx);
    expect(guideIdx).toBeLessThan(historyIdx);
  });
});

// ═══════════════════════════════════════════════
// v9: 5컷 AI 시나리오 페이지 테스트
// ═══════════════════════════════════════════════
describe.skip("v9: 5컷 AI 시나리오 페이지 (미구현 - 향후 추가 예정)", () => {
  const pdfSrc = readFileSync(resolve(__dirname, "ai-visibility-report.ts"), "utf-8");

  it("PAGE: AI SCENARIO 5-CUT 마커가 존재한다", () => {
    expect(pdfSrc).toContain("PAGE: AI SCENARIO 5-CUT");
  });

  it("5컷 페이지가 표지 다음, Executive Summary 전에 위치한다", () => {
    const coverIdx = pdfSrc.indexOf("하단 티얼 액센트 라인");
    const scenarioIdx = pdfSrc.indexOf("PAGE: AI SCENARIO 5-CUT");
    const execIdx = pdfSrc.indexOf("PAGE: EXECUTIVE SUMMARY");
    expect(coverIdx).toBeLessThan(scenarioIdx);
    expect(scenarioIdx).toBeLessThan(execIdx);
  });

  it("i18n에 시나리오 관련 키가 ko/en/th 모두 있다", () => {
    expect(pdfSrc).toContain('scenarioTitle: "AI 시대, 환자는 이렇게 병원을 찾습니다"');
    expect(pdfSrc).toContain('scenarioTitle: "How Patients Find Hospitals in the AI Era"');
    expect(pdfSrc).toContain('scenarioStep1:');
    expect(pdfSrc).toContain('scenarioStep2:');
    expect(pdfSrc).toContain('scenarioStep3:');
    expect(pdfSrc).toContain('scenarioStep4:');
    expect(pdfSrc).toContain('scenarioStep5:');
    expect(pdfSrc).toContain('scenarioNotMentioned:');
    expect(pdfSrc).toContain('scenarioAfter:');
    expect(pdfSrc).toContain('scenarioCurrentReality:');
    expect(pdfSrc).toContain('scenarioFutureVision:');
  });

  it("시나리오 페이지가 aiSimulator 데이터를 사용한다", () => {
    expect(pdfSrc).toContain("rd.aiSimulator.query");
    expect(pdfSrc).toContain("rd.aiSimulator.results");
  });

  it("3개 AI 플랫폼 카드가 렌더링된다 (ChatGPT, Perplexity, Cue:)", () => {
    // 플랫폼 정의 확인
    expect(pdfSrc).toContain('"ChatGPT"');
    expect(pdfSrc).toContain('"Perplexity"');
    expect(pdfSrc).toContain('"Cue:"');
    // 플랫폼 브랜드 컬러
    expect(pdfSrc).toContain('"#10A37F"'); // ChatGPT green
    expect(pdfSrc).toContain('"#20808D"'); // Perplexity teal
    expect(pdfSrc).toContain('"#03C75A"'); // Naver green
  });

  it("미추천 X 마크와 추천됨 체크마크가 구현되어 있다", () => {
    expect(pdfSrc).toContain("C.failLight");
    expect(pdfSrc).toContain("C.fail");
    expect(pdfSrc).toContain("C.passLight");
    expect(pdfSrc).toContain("C.pass");
    // 크로스라인 직접 그리기
    expect(pdfSrc).toContain("iconCX - xR");
    expect(pdfSrc).toContain("iconCY - xR");
  });

  it("STEP 5 최적화 후 비전 카드가 있다", () => {
    expect(pdfSrc).toContain("scenarioFutureVision");
    expect(pdfSrc).toContain("AI 추천 1순위");
  });

  it("하단 요약 메시지가 mentionedCount 기반으로 동적 생성된다", () => {
    expect(pdfSrc).toContain("scenarioMentionedCount");
    expect(pdfSrc).toContain("scenarioTotalPlatforms");
  });
});

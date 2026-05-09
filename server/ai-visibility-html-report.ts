/**
 * AI 가시성 진단 보고서 — HTML/CSS + Puppeteer PDF 생성
 * 30가지 디자인 개선사항 반영 — 프리미엄 보고서 품질
 */
import puppeteer from "puppeteer";
import * as QRCode from "qrcode";
import type { RealityDiagnosis } from "./reality-diagnosis";
import { translateResultToEnglish } from "./ai-visibility-translate";
import { getMonthlyTrendByUrl, getScoreComparisonByUrl } from "./db";
import { stripMarkdown as _modStripMarkdown, sanitizeHospitalName as _modSanitizeHospitalName } from "./ai-visibility/text-utils";
import { getGradeColorHtml, getStatusColorHtml, getStatusBgHtml, getScoreRangeColorHtml } from "./ai-visibility/constants";

// ── Types ──
interface SeoAuditResult {
  url: string;
  score?: number;
  totalScore?: number;
  maxScore: number;
  analyzedAt?: string;
  siteName?: string;
  grade: string;
  summary: { passed: number; warnings: number; failed: number; total?: number };
  categories: {
    name: string;
    score: number;
    maxScore: number;
    items: {
      id: string;
      name: string;
      status: "pass" | "warning" | "fail" | "info";
      score: number;
      maxScore: number;
      detail: string;
      recommendation: string;
      impact: string;
    }[];
  }[];
  /** 사이트 접근 불가 또는 SPA 감지 시 한계 고지 */
  diagnosticLimitation?: {
    type: "inaccessible" | "spa_empty" | "blocked";
    message: string;
  };
}

type Lang = "ko" | "en" | "th";
type ReportLanguage = Lang;

// ── i18n (same as original) ──
const i18n: Record<Lang, Record<string, string>> = {
  ko: {
    brand: "MY비서",
    coverTitle: "AI 검색 시장 인텔리전스 리포트",
    coverSub: "AI Search Market Intelligence Report",
    coverDate: "진단일",
    coverScore: "종합 점수",
    coverGrade: "등급",
    coverPassed: "통과",
    coverWarnings: "주의",
    coverFailed: "실패",
    langLabel: "한국어",
    realityTitle: "시장 포지션 분석",
    realitySub: "Reality Diagnosis",
    realityExposed: "노출",
    realityNotExposed: "미노출",
    realityAiHigh: "높음",
    realityAiMedium: "보통",
    realityAiLow: "낮음",
    realityAiNone: "없음",
    realityKeywords: "키워드별 AI·포털 노출 현황",
    realityCompetitors: "경쟁사 동향 인텔리전스",
    realityActions: "개선 로드맵",
    realityConclusion: "종합 의견",
    historyTitle: "진단 이력 추이",
    historySub: "Score Trend Analysis",
    historyDesc: "이전 진단 결과와 비교하여 AI 가시성 상태의 변화를 확인합니다.",
    historyFirst: "최초 진단",
    historyLatest: "최근 진단",
    historyChange: "변화",
    historyImproved: "점수가 개선되었습니다.",
    historyDeclined: "점수가 하락했습니다.",
    historyNoChange: "변화 없음",
    historyScore: "월별 점수",
    historyAiScore: "AI 인용 점수",
    historyMonth: "월",
    historyNoData: "데이터 없음",
    historyPeriod: "기간",
    historyDays: "일",
    historyDiagnoses: "진단 횟수",
    historyTimes: "회",
    executiveSummary: "시장 인텔리전스 요약",
    executiveDesc: "AI 검색 시장의 기회와 경쟁 동향을 분석하고, 귀 병원의 포지션을 진단합니다.",
    aiVisibility: "AI 인용 지수",
    aiPlatforms: "ChatGPT, Perplexity, Gemini, Claude 등 AI 플랫폼에서 병원이 추천·인용될 가능성을 평가합니다.",
    aiGood: "AI 플랫폼에서 양호한 추천·인용이 기대됩니다.",
    aiMedium: "AI 플랫폼 인용에 개선 여지가 있습니다.",
    aiBad: "AI 플랫폼 인용이 제한적입니다. 전반적인 개선이 필요합니다.",
    keyFindings: "핵심 발견사항",
    strengths: "강점 영역",
    weaknesses: "개선 필요 영역",
    categoryAnalysis: "카테고리별 상세 분석",
    category: "카테고리",
    score: "점수",
    achievement: "달성률",
    priority: "우선순위",
    assessment: "평가",
    high: "높음",
    medium: "보통",
    low: "낮음",
    criticalIssues: "선점 기회 — 즉시 실행 가능 항목",
    criticalDesc: "아래 항목을 먼저 실행하면 경쟁사 대비 가장 빠르게 AI 가시성을 확보할 수 있습니다.",
    warningIssues: "경쟁 우위 강화 기회",
    warningDesc: "경쟁사가 아직 선점하지 않은 영역입니다. 지금 실행하면 차별화됩니다.",
    currentStatus: "현재 상태",
    recommendation: "개선 방법",
    expectedImpact: "기대 효과",
    difficulty: "난이도",
    actionPlan: "선점 전략 로드맵",
    actionDesc: "시장 기회를 선점하기 위한 우선순위별 실행 로드맵입니다.",
    phase1: "1단계: 즉시 개선 (1~2주)",
    phase2: "2단계: 단기 개선 (1~2개월)",
    phase3: "3단계: 중장기 개선 (3개월~)",
    fullAudit: "전체 진단 항목 상세",
    fullAuditDesc: "모든 진단 항목의 상태와 점수를 확인할 수 있습니다.",
    item: "항목",
    status: "상태",
    detail: "상세",
    finalAssessment: "전략적 포지션 평가",
    finalAssessmentSub: "Strategic Position Assessment",
    ctaTitle: "시장 선점 전략 상담",
    ctaDesc1: "본 리포트에서 발견된 시장 기회를 선점하고 싶으시다면,",
    ctaDesc2: "MY비서 전문 컨설팅 팀이 귀 병원만의 경쟁 우위 전략을 수립해 드립니다.",
    ctaPhone: "전화 상담  010-7321-7004",
    ctaWeb: "온라인 상담  mybiseo.com",
    disclaimer: "본 보고서는 mybiseo.com의 AI 가시성 진단 시스템에 의해 생성되었습니다. AI 플랫폼의 내부 알고리즘은 비공개이므로, 진단 결과는 전략 수립을 위한 참고 자료입니다.",
    statusPass: "통과",
    statusWarning: "주의",
    statusFail: "실패",
    naverLabel: "네이버",
    googleLabel: "구글",
    aiLabel: "AI 검색 노출",
    searchVolume: "월간 조회량",
    contentGapsTitle: "콘텐츠 사각지대 분석",
    contentGapsSub: "제로클릭 시대, 아직 아무도 선점하지 않은 AI 인용 기회 키워드",
    geoTriAxisTitle: "GEO(Generative Engine Optimization) 3축 진단",
    geoTriAxisSub: "AI가 답변을 생성할 때 참고하는 3가지 기준: 적합성 · 권위 · 마찰",
    geoTriAxisWhy: "환자의 76%가 AI 답변을 클릭 없이 소비합니다. AI가 답변에 병원을 포함시키려면 이 3축이 모두 충족되어야 합니다.",
    geoRelevance: "적합성 (Relevance)",
    geoAuthority: "권위 (Authority)",
    geoFriction: "마찰 (Friction)",
    geoOverall: "GEO 종합 점수",
    aiCitationTitle: "AI 인용 임계점 체크리스트",
    aiCitationSub: "AI가 이 병원을 추천하기 위한 5가지 조건",
    aiCitationWhy: "AI 플랫폼은 임계점을 넘는 병원만 추천합니다. 하나라도 미충족이면 경쟁 병원에게 추천 기회가 넘어갑니다.",
    aiCitationMet: "충족",
    aiCitationNotMet: "미충족",
    aiCitationVerdict: "종합 판정",
    answerCapsuleTitle: "답변 캡슐 품질 진단",
    answerCapsuleSub: "AI가 환자에게 병원을 추천할 때 인용하는 문장",
    answerCapsuleWhy: "AI는 웹사이트에서 완결된 문장을 찾아 답변에 직접 인용합니다. 좋은 답변 캡슐이 있으면 AI가 병원을 자연스럽게 추천합니다.",
    answerCapsuleCurrent: "현재 상태",
    answerCapsuleScore: "캡슐 품질 점수",
    answerCapsuleIssues: "발견된 문제",
    answerCapsuleSample: "개선 예시",
    crossChannelTitle: "4채널 교차 신뢰 진단",
    crossChannelSub: "환자가 여러 채널에서 같은 메시지를 볼 때 신뢰가 형성됩니다",
    crossChannelWhy: "AI는 여러 출처의 정보를 교차 검증합니다. 채널 간 메시지가 일관되면 AI의 신뢰도가 높아져 추천 확률이 올라갑니다.",
    crossChannelOverall: "교차 신뢰 종합 점수",
    aiSimulatorTitle: "AI 추천 시뮬레이터",
    aiSimulatorSub: "실제로 AI에게 병원 추천을 요청했을 때의 결과",
    aiSimulatorWhy: "환자들이 실제로 AI에게 병원을 물어보는 시대입니다. 여기서 추천되지 않으면 환자는 병원의 존재조차 모릅니다.",
    aiSimRecommended: "추천됨",
    aiSimNotRecommended: "미추천",
    naverCueTitle: "네이버 Cue: 대응 진단",
    naverCueSub: "네이버 AI(Cue:) 대응 준비도",
    naverCueWhy: "네이버는 한국 포털 시장의 60%를 차지합니다. Cue: AI 답변이 확대되면 기존 포털 노출 전략이 무력화될 수 있습니다.",
    strategicGuideTitle: "경쟁 우위 전략 가이드",
    strategicGuideSub: "시장 기회를 선점하고 경쟁 우위를 유지하는 맞춤 전략",
    guideWebsite: "웹사이트 변환 가이드",
    guideContent: "콘텐츠 전략",
    guideMarketing: "마케팅 방향",
    guideMybiseo: "MY비서 추천 서비스",
    // ── Sections aliases ──
    fullAuditTitle: "전체 진단 항목 상세",
    fullAuditSub: "모든 진단 항목의 상태와 점수를 확인합니다",
    actionPlanTitle: "선점 전략 로드맵",
    actionPlanSub: "시장 기회 선점을 위한 실행 계획",
    actionPlanDesc: "경쟁사보다 먼저 실행하면 가장 큰 효과를 얻을 수 있는 항목 순서입니다.",
    aiCitationDesc: "AI가 병원을 추천하기 위해 확인하는 5가지 필수 조건입니다.",
    aiSimTitle: "AI 추천 시뮬레이터",
    aiSimSub: "AI에게 병원 추천을 요청했을 때 결과",
    aiSimDesc: "환자가 AI에게 병원 추천을 요청하면 어떤 결과가 나오는지 시뮬레이션합니다.",
    answerCapsuleDesc: "AI가 병원을 추천할 때 직접 인용할 수 있는 문장을 진단합니다.",
    citationDetail: "조건별 상세",
    citationMet: "충족 조건",
    citationNotMet: "미충족 조건",
    citationRate: "충족률",
    contentStrategyTitle: "콘텐츠 전략",
    contentStrategySub: "AI 시대에 맞는 콘텐츠 전략",
    contentStrategyDesc: "AI 검색에 최적화된 콘텐츠 전략을 제안합니다.",
    crossChannelDesc: "AI는 여러 채널의 정보를 교차 검증하여 신뢰도를 평가합니다.",
    geoTriAxisDesc: "AI가 병원을 평가하는 3가지 핵심 기준: 관련성 · 권위성 · 마찰도",
    marketingTitle: "마케팅 방향",
    marketingSub: "채널별 마케팅 전략",
    marketingDesc: "AI 시대에 효과적인 채널별 마케팅 방향을 제안합니다.",
    naverCueDesc: "네이버 AI(Cue:)가 병원 정보를 얼마나 잘 인식하는지 진단합니다.",
    serviceTitle: "MY비서 추천 서비스",
    serviceSub: "귀 병원에 맞는 맞춤형 솔루션",
    serviceDesc: "진단 결과를 바탕으로 가장 효과적인 서비스를 추천합니다.",
    strategyGuideTitle: "경쟁 우위 전략 가이드",
    strategyGuideSub: "시장 선점을 위한 3축 전략",
    strategyGuideDesc: "웹사이트·콘텐츠·마케팅 3축에서 경쟁사 대비 우위를 확보하는 전략입니다.",
  },
  en: {
    brand: "MY Biseo",
    coverTitle: "AI Visibility Diagnostic Report",
    coverSub: "AI Visibility Diagnostic Report",
    coverDate: "Date",
    coverScore: "Overall Score",
    coverGrade: "Grade",
    coverPassed: "Pass",
    coverWarnings: "Warning",
    coverFailed: "Fail",
    langLabel: "English",
    realityTitle: "Digital Visibility Reality Check",
    realitySub: "Reality Diagnosis",
    realityExposed: "Visible",
    realityNotExposed: "Not Visible",
    realityAiHigh: "High",
    realityAiMedium: "Medium",
    realityAiLow: "Low",
    realityAiNone: "None",
    realityKeywords: "Keyword AI & Portal Visibility Status",
    realityCompetitors: "Market Environment",
    realityActions: "Improvement Roadmap",
    realityConclusion: "Summary Opinion",
    historyTitle: "Score Trend",
    historySub: "Score Trend Analysis",
    historyDesc: "Compare with previous diagnostics to track changes in AI visibility.",
    historyFirst: "First Diagnosis",
    historyLatest: "Latest Diagnosis",
    historyChange: "Change",
    historyImproved: "Score improved.",
    historyDeclined: "Score declined.",
    historyNoChange: "No change",
    historyScore: "Monthly Score",
    historyAiScore: "AI Citation Score",
    historyMonth: "Month",
    historyNoData: "No data",
    historyPeriod: "Period",
    historyDays: " days",
    historyDiagnoses: "Diagnoses",
    historyTimes: "",
    executiveSummary: "Executive Summary",
    executiveDesc: "A comprehensive analysis of the overall AI visibility status.",
    aiVisibility: "AI Citation Index",
    aiPlatforms: "Evaluates the likelihood of being recommended across AI platforms.",
    aiGood: "Good recommendation expected across AI platforms.",
    aiMedium: "Room for improvement in AI platform citation.",
    aiBad: "AI platform citation is limited. Improvements needed.",
    keyFindings: "Key Findings",
    strengths: "Strengths",
    weaknesses: "Areas for Improvement",
    categoryAnalysis: "Category Analysis",
    category: "Category",
    score: "Score",
    achievement: "Achievement",
    priority: "Priority",
    assessment: "Assessment",
    high: "High",
    medium: "Medium",
    low: "Low",
    criticalIssues: "Critical Issues",
    criticalDesc: "These items directly impact AI visibility.",
    warningIssues: "Warning Issues",
    warningDesc: "These items partially affect AI visibility.",
    currentStatus: "Current Status",
    recommendation: "Recommendation",
    expectedImpact: "Expected Impact",
    difficulty: "Difficulty",
    actionPlan: "Action Plan",
    actionDesc: "A phased improvement plan based on priority levels.",
    phase1: "Phase 1: Immediate (1-2 weeks)",
    phase2: "Phase 2: Short-term (1-2 months)",
    phase3: "Phase 3: Long-term (3+ months)",
    fullAudit: "Full Audit Details",
    fullAuditDesc: "Complete status and scores for all diagnostic items.",
    item: "Item",
    status: "Status",
    detail: "Detail",
    finalAssessment: "Final Assessment",
    finalAssessmentSub: "Final Assessment",
    ctaTitle: "Expert Consultation",
    ctaDesc1: "If you want to systematically resolve the issues found in this report,",
    ctaDesc2: "our MY Biseo consulting team will develop a customized improvement strategy.",
    ctaPhone: "Phone  010-7321-7004",
    ctaWeb: "Online  mybiseo.com",
    disclaimer: "This report was generated by the AI Visibility Diagnostic System at mybiseo.com. Diagnostic results serve as reference material for strategy development.",
    statusPass: "Pass",
    statusWarning: "Warning",
    statusFail: "Fail",
    naverLabel: "Naver",
    googleLabel: "Google",
    aiLabel: "AI Citation",
    searchVolume: "Monthly Volume",
    contentGapsTitle: "Content Gap Analysis",
    contentGapsSub: "AI citation opportunity keywords that no one has claimed yet",
    geoTriAxisTitle: "GEO Tri-Axis Diagnosis (RxA/F)",
    geoTriAxisSub: "Three criteria AI uses: Relevance · Authority · Friction",
    geoTriAxisWhy: "76% of patients consume AI answers without clicking. All three axes must be met for AI to include your hospital.",
    geoRelevance: "Relevance",
    geoAuthority: "Authority",
    geoFriction: "Friction",
    geoOverall: "GEO Overall Score",
    aiCitationTitle: "AI Citation Threshold Checklist",
    aiCitationSub: "5 conditions for AI to recommend this hospital",
    aiCitationWhy: "AI platforms only recommend hospitals that pass the threshold.",
    aiCitationMet: "Met",
    aiCitationNotMet: "Not Met",
    aiCitationVerdict: "Overall Verdict",
    answerCapsuleTitle: "Answer Capsule Quality Diagnosis",
    answerCapsuleSub: "The sentence AI cites when recommending your hospital",
    answerCapsuleWhy: "AI looks for complete sentences on your website to directly cite.",
    answerCapsuleCurrent: "Current Status",
    answerCapsuleScore: "Capsule Quality Score",
    answerCapsuleIssues: "Issues Found",
    answerCapsuleSample: "Improved Example",
    crossChannelTitle: "4-Channel Cross Trust Diagnosis",
    crossChannelSub: "Trust builds when patients see the same message across channels",
    crossChannelWhy: "AI cross-validates information from multiple sources.",
    crossChannelOverall: "Overall Consistency Score",
    aiSimulatorTitle: "AI Recommendation Simulator",
    aiSimulatorSub: "Results when asking AI to recommend a hospital",
    aiSimulatorWhy: "Patients now ask AI for hospital recommendations.",
    aiSimRecommended: "Recommended",
    aiSimNotRecommended: "Not Recommended",
    naverCueTitle: "Naver Cue: Response Diagnosis",
    naverCueSub: "Naver AI (Cue:) readiness assessment",
    naverCueWhy: "Naver holds 60% of the Korean portal market.",
    strategicGuideTitle: "Strategic Guide",
    strategicGuideSub: "Customized strategies for surviving the zero-click era",
    guideWebsite: "Website Transformation Guide",
    guideContent: "Content Strategy",
    guideMarketing: "Marketing Direction",
    guideMybiseo: "MY Biseo Services",
    fullAuditTitle: "Full Audit Details",
    fullAuditSub: "Detailed status and scores for all diagnostic items",
    actionPlanTitle: "Action Plan",
    actionPlanSub: "Priority-based execution roadmap",
    actionPlanDesc: "Improvement items organized by immediate, short-term, and mid-term priorities.",
    aiCitationDesc: "Five essential conditions AI checks before recommending a hospital.",
    aiSimTitle: "AI Recommendation Simulator",
    aiSimSub: "Results when asking AI for hospital recommendations",
    aiSimDesc: "Simulates what happens when patients ask AI for hospital recommendations.",
    answerCapsuleDesc: "Diagnoses sentences that AI can directly quote when recommending your hospital.",
    citationDetail: "Condition Details",
    citationMet: "Met",
    citationNotMet: "Not Met",
    citationRate: "Met Rate",
    contentStrategyTitle: "Content Strategy",
    contentStrategySub: "Content strategy for the AI era",
    contentStrategyDesc: "Content strategies optimized for AI search.",
    crossChannelDesc: "AI cross-validates information across multiple channels to assess credibility.",
    geoTriAxisDesc: "Three core criteria AI uses to evaluate hospitals: Relevance, Authority, Friction",
    marketingTitle: "Marketing Direction",
    marketingSub: "Channel-specific marketing strategy",
    marketingDesc: "Effective channel-specific marketing directions for the AI era.",
    naverCueDesc: "Diagnoses how well Naver AI (Cue:) recognizes your hospital information.",
    serviceTitle: "MY Biseo Services",
    serviceSub: "Customized solutions for your hospital",
    serviceDesc: "Recommends the most effective services based on diagnostic results.",
    strategyGuideTitle: "Strategy Guide",
    strategyGuideSub: "Survival strategy for the zero-click era",
    strategyGuideDesc: "Strategies across three axes: website, content, and marketing.",
  },
  th: {
    brand: "MY Biseo",
    coverTitle: "รายงานการวินิจฉัย AI Visibility",
    coverSub: "AI Visibility Diagnostic Report",
    coverDate: "วันที่วินิจฉัย",
    coverScore: "คะแนนรวม",
    coverGrade: "เกรด",
    coverPassed: "ผ่าน",
    coverWarnings: "เตือน",
    coverFailed: "ไม่ผ่าน",
    langLabel: "ภาษาไทย",
    realityTitle: "การวินิจฉัยความเป็นจริงดิจิทัล",
    realitySub: "Reality Diagnosis",
    realityExposed: "แสดง",
    realityNotExposed: "ไม่แสดง",
    realityAiHigh: "สูง",
    realityAiMedium: "ปานกลาง",
    realityAiLow: "ต่ำ",
    realityAiNone: "ไม่มี",
    realityKeywords: "สถานะการแสดงผลคีย์เวิร์ด",
    realityCompetitors: "การวิเคราะห์การแข่งขัน",
    realityActions: "แผนการปรับปรุง",
    realityConclusion: "สรุปความเห็น",
    historyTitle: "แนวโน้มคะแนน",
    historySub: "Score Trend Analysis",
    historyDesc: "เปรียบเทียบกับการวินิจฉัยก่อนหน้า",
    historyFirst: "การวินิจฉัยครั้งแรก",
    historyLatest: "การวินิจฉัยล่าสุด",
    historyChange: "การเปลี่ยนแปลง",
    historyImproved: "คะแนนดีขึ้น",
    historyDeclined: "คะแนนลดลง",
    historyNoChange: "ไม่มีการเปลี่ยนแปลง",
    historyScore: "คะแนนรายเดือน",
    historyAiScore: "คะแนน AI",
    historyMonth: "เดือน",
    historyNoData: "ไม่มีข้อมูล",
    historyPeriod: "ระยะเวลา",
    historyDays: " วัน",
    historyDiagnoses: "จำนวนการวินิจฉัย",
    historyTimes: " ครั้ง",
    executiveSummary: "สรุปผลการวิเคราะห์",
    executiveDesc: "การวินิจฉัยภาพรวมความสามารถในการมองเห็นดิจิทัล",
    aiVisibility: "ดัชนี AI Citation",
    aiPlatforms: "ประเมินโอกาสที่จะถูกแนะนำบนแพลตฟอร์ม AI",
    aiGood: "คาดว่าจะได้รับการแนะนำที่ดีบนแพลตฟอร์ม AI",
    aiMedium: "มีโอกาสปรับปรุงการอ้างอิงบน AI",
    aiBad: "การอ้างอิงบน AI มีจำกัด ต้องปรับปรุง",
    keyFindings: "ข้อค้นพบสำคัญ",
    strengths: "จุดแข็ง",
    weaknesses: "จุดที่ต้องปรับปรุง",
    categoryAnalysis: "การวิเคราะห์ตามหมวดหมู่",
    category: "หมวดหมู่",
    score: "คะแนน",
    achievement: "ความสำเร็จ",
    priority: "ลำดับความสำคัญ",
    assessment: "การประเมิน",
    high: "สูง",
    medium: "ปานกลาง",
    low: "ต่ำ",
    criticalIssues: "ปัญหาวิกฤต",
    criticalDesc: "รายการเหล่านี้ส่งผลกระทบโดยตรงต่อการมองเห็น AI",
    warningIssues: "ปัญหาที่ต้องระวัง",
    warningDesc: "รายการเหล่านี้ส่งผลบางส่วนต่อการมองเห็น AI",
    currentStatus: "สถานะปัจจุบัน",
    recommendation: "คำแนะนำ",
    expectedImpact: "ผลกระทบที่คาดหวัง",
    difficulty: "ความยาก",
    actionPlan: "แผนปฏิบัติการ",
    actionDesc: "แผนการปรับปรุงตามลำดับความสำคัญ",
    phase1: "ระยะที่ 1: ทันที (1-2 สัปดาห์)",
    phase2: "ระยะที่ 2: ระยะสั้น (1-2 เดือน)",
    phase3: "ระยะที่ 3: ระยะยาว (3+ เดือน)",
    fullAudit: "รายละเอียดการตรวจสอบทั้งหมด",
    fullAuditDesc: "สถานะและคะแนนของรายการวินิจฉัยทั้งหมด",
    item: "รายการ",
    status: "สถานะ",
    detail: "รายละเอียด",
    finalAssessment: "สรุปการประเมินขั้นสุดท้าย",
    finalAssessmentSub: "Final Assessment",
    ctaTitle: "ปรึกษาผู้เชี่ยวชาญ",
    ctaDesc1: "หากต้องการแก้ไขปัญหาที่พบในรายงานนี้อย่างเป็นระบบ",
    ctaDesc2: "ทีมที่ปรึกษา MY Biseo จะพัฒนากลยุทธ์ที่เหมาะสม",
    ctaPhone: "โทร  010-7321-7004",
    ctaWeb: "ออนไลน์  mybiseo.com",
    disclaimer: "รายงานนี้สร้างโดยระบบวินิจฉัย AI Visibility ของ mybiseo.com",
    statusPass: "ผ่าน",
    statusWarning: "เตือน",
    statusFail: "ไม่ผ่าน",
    naverLabel: "Naver",
    googleLabel: "Google",
    aiLabel: "AI Citation",
    searchVolume: "ปริมาณรายเดือน",
    contentGapsTitle: "การวิเคราะห์ช่องว่างเนื้อหา",
    contentGapsSub: "คีย์เวิร์ดโอกาส AI ที่ยังไม่มีใครครอง",
    geoTriAxisTitle: "การวินิจฉัย GEO 3 แกน (RxA/F)",
    geoTriAxisSub: "เกณฑ์ 3 ข้อที่ AI ใช้: ความเกี่ยวข้อง · อำนาจ · อุปสรรค",
    geoTriAxisWhy: "76% ของผู้ป่วยใช้คำตอบ AI โดยไม่คลิก",
    geoRelevance: "ความเกี่ยวข้อง",
    geoAuthority: "อำนาจ",
    geoFriction: "อุปสรรค",
    geoOverall: "คะแนน GEO รวม",
    aiCitationTitle: "รายการตรวจสอบเกณฑ์การอ้างอิง AI",
    aiCitationSub: "5 เงื่อนไขสำหรับ AI แนะนำโรงพยาบาล",
    aiCitationWhy: "AI แนะนำเฉพาะโรงพยาบาลที่ผ่านเกณฑ์",
    aiCitationMet: "ผ่าน",
    aiCitationNotMet: "ไม่ผ่าน",
    aiCitationVerdict: "ผลรวม",
    answerCapsuleTitle: "การวินิจฉัยคุณภาพแคปซูลคำตอบ",
    answerCapsuleSub: "ประโยคที่ AI อ้างอิงเมื่อแนะนำโรงพยาบาล",
    answerCapsuleWhy: "AI ค้นหาประโยคสมบูรณ์จากเว็บไซต์เพื่ออ้างอิง",
    answerCapsuleCurrent: "สถานะปัจจุบัน",
    answerCapsuleScore: "คะแนนคุณภาพ",
    answerCapsuleIssues: "ปัญหาที่พบ",
    answerCapsuleSample: "ตัวอย่างที่ปรับปรุง",
    crossChannelTitle: "การวินิจฉัยความน่าเชื่อถือข้ามช่องทาง 4 ช่อง",
    crossChannelSub: "ความไว้วางใจเกิดขึ้นเมื่อข้อความสอดคล้องกันทุกช่องทาง",
    crossChannelWhy: "AI ตรวจสอบข้อมูลจากหลายแหล่ง",
    crossChannelOverall: "คะแนนความสอดคล้องรวม",
    aiSimulatorTitle: "ตัวจำลองคำแนะนำ AI",
    aiSimulatorSub: "ผลลัพธ์เมื่อถาม AI ให้แนะนำโรงพยาบาล",
    aiSimulatorWhy: "ผู้ป่วยถาม AI แนะนำโรงพยาบาล",
    aiSimRecommended: "แนะนำ",
    aiSimNotRecommended: "ไม่แนะนำ",
    naverCueTitle: "Naver Cue: การวินิจฉัยการตอบสนอง",
    naverCueSub: "การประเมินความพร้อม Naver AI (Cue:)",
    naverCueWhy: "Naver ครอง 60% ของตลาดพอร์ทัลเกาหลี",
    strategicGuideTitle: "คู่มือกลยุทธ์",
    strategicGuideSub: "กลยุทธ์ที่ปรับแต่งสำหรับยุค zero-click",
    guideWebsite: "คู่มือการปรับเว็บไซต์",
    guideContent: "กลยุทธ์เนื้อหา",
    guideMarketing: "ทิศทางการตลาด",
    guideMybiseo: "บริการ MY Biseo",
    fullAuditTitle: "รายละเอียดการตรวจสอบทั้งหมด",
    fullAuditSub: "Full Audit Details",
    actionPlanTitle: "แผนปฏิบัติการ",
    actionPlanSub: "Action Plan",
    actionPlanDesc: "Action plan organized by priority.",
    aiCitationDesc: "Five conditions AI checks before recommending.",
    aiSimTitle: "AI Recommendation Simulator",
    aiSimSub: "AI Recommendation Results",
    aiSimDesc: "Simulates AI hospital recommendation results.",
    answerCapsuleDesc: "Diagnoses quotable sentences for AI.",
    citationDetail: "Details",
    citationMet: "Met",
    citationNotMet: "Not Met",
    citationRate: "Met Rate",
    contentStrategyTitle: "กลยุทธ์เนื้อหา",
    contentStrategySub: "Content Strategy",
    contentStrategyDesc: "Content strategies for AI era.",
    crossChannelDesc: "AI cross-validates across channels.",
    geoTriAxisDesc: "Three core AI evaluation criteria.",
    marketingTitle: "ทิศทางการตลาด",
    marketingSub: "Marketing Direction",
    marketingDesc: "Channel marketing directions.",
    naverCueDesc: "Naver AI recognition diagnosis.",
    serviceTitle: "บริการ MY Biseo",
    serviceSub: "Customized solutions",
    serviceDesc: "Recommended services based on diagnosis.",
    strategyGuideTitle: "คู่มือกลยุทธ์",
    strategyGuideSub: "Strategy Guide",
    strategyGuideDesc: "Strategies across website, content, and marketing.",
  },
};

// ── Category name maps ──
const CAT_NAMES_KO: Record<string, string> = {
  "AI Citation": "AI 검색 노출",
  "Content Structure": "콘텐츠 구조",
  "Hospital AI Visibility": "병원 특화 SEO",
  "Naver AI Response": "네이버 검색 최적화",
  "Meta Tags": "메타 태그",
  "AI Crawling Optimization": "검색 고급 설정",
  "Social Signals": "소셜 신호",
  "Performance Optimization": "성능 최적화",
  "Mobile Responsiveness": "모바일 대응",
  "Accessibility/UX": "접근성/UX",
  "Internationalization/Multilingual": "국제화/다국어",
  "Homepage Basics": "홈페이지 기본 설정",
};

// ── Helpers ──
function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// stripMarkdown: 모듈에서 import됨 (./ai-visibility/text-utils)
function stripMarkdown(text: string): string {
  return _modStripMarkdown(text);
}

// sanitizeHospitalName: 모듈에서 import됨 (./ai-visibility/text-utils)
export const sanitizeHospitalName = _modSanitizeHospitalName;

// getGradeColor: 모듈에서 import됨 (./ai-visibility/constants → getGradeColorHtml)
function getGradeColor(grade: string): string {
  return getGradeColorHtml(grade);
}

function getStatusColor(status: string): string {
  return getStatusColorHtml(status);
}

function getStatusBg(status: string): string {
  return getStatusBgHtml(status);
}

function catName(name: string, lang: Lang): string {
  if (lang === "ko") return CAT_NAMES_KO[name] || name;
  return name;
}

/** Conic gauge SVG — thick gradient stroke matching reference cover */
function scoreGaugeSvg(score: number, grade: string, size: number = 160): string {
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75; // 270 degrees
  const arcLen = circumference * arcFraction;
  const ratio = Math.min(score / 100, 1);
  const filledLen = arcLen * ratio;
  const gapLen = arcLen - filledLen;

  // Gradient colors based on score
  const gradId = `gauge-grad-${size}`;
  const gradeColor = getGradeColor(grade);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(135deg);">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="40%" stop-color="#F97316"/>
        <stop offset="70%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#10B981"/>
      </linearGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"
      stroke-dasharray="${arcLen} ${circumference - arcLen}" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${gradId})" stroke-width="10"
      stroke-dasharray="${filledLen} ${gapLen + circumference - arcLen}" stroke-linecap="round"/>
  </svg>
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
    <div style="font-size:${Math.round(size * 0.28)}px;font-weight:700;color:white;line-height:1;">${score}</div>
    <div style="font-size:${Math.round(size * 0.08)}px;color:rgba(255,255,255,0.5);margin-top:2px;">/ 100</div>
  </div>`;
}

/** Light-theme gauge for inner pages */
function scoreGaugeSvgLight(score: number, grade: string, size: number = 100): string {
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const arcLen = circumference * arcFraction;
  const ratio = Math.min(score / 100, 1);
  const filledLen = arcLen * ratio;
  const gapLen = arcLen - filledLen;
  const color = getGradeColor(grade);

  return `<div style="position:relative;width:${size}px;height:${size}px;display:inline-block;">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(135deg);">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="8"
        stroke-dasharray="${arcLen} ${circumference - arcLen}" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${filledLen} ${gapLen + circumference - arcLen}" stroke-linecap="round"/>
    </svg>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
      <div style="font-size:${Math.round(size * 0.26)}px;font-weight:700;color:${color};line-height:1;">${score}</div>
      <div style="font-size:${Math.round(size * 0.09)}px;color:#94A3B8;margin-top:1px;">/ 100</div>
    </div>
  </div>`;
}

/** #12 SVG status icons */
function svgIconCheck(): string {
  return `<svg class="icon-check" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="var(--pass-bg)" stroke="var(--pass)" stroke-width="1"/><path d="M5 8l2 2 4-4" stroke="var(--pass)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function svgIconWarn(): string {
  return `<svg class="icon-warn" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="var(--warn-bg)" stroke="var(--warn)" stroke-width="1"/><path d="M8 5v3" stroke="var(--warn)" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="10.5" r="0.8" fill="var(--warn)"/></svg>`;
}
function svgIconFail(): string {
  return `<svg class="icon-fail" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="var(--fail-bg)" stroke="var(--fail)" stroke-width="1"/><path d="M6 6l4 4M10 6l-4 4" stroke="var(--fail)" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
function statusIcon(status: string): string {
  if (status === "pass") return svgIconCheck();
  if (status === "warning") return svgIconWarn();
  return svgIconFail();
}

/** #16 AI Platform icon */
function platformIcon(engine: string): string {
  const map: Record<string, string> = {
    "ChatGPT": "G", "GPT": "G", "chatgpt": "G",
    "Perplexity": "P", "perplexity": "P",
    "Gemini": "Ge", "gemini": "Ge",
    "Claude": "C", "claude": "C",
    "Copilot": "Co", "copilot": "Co",
    "Naver": "N", "naver": "N",
    "Google": "G", "google": "G",
  };
  const abbr = map[engine] || engine.substring(0, 2).toUpperCase();
  return `<span class="platform-icon">${abbr}</span>`;
}

/** #26 Mini donut SVG for cover summary */
function miniDonutSvg(value: number, total: number, color: string, size: number = 44): string {
  const r = (size / 2) - 4;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total > 0 ? value / total : 0;
  const filled = circumference * ratio;
  const gap = circumference - filled;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-dasharray="${filled} ${gap}" stroke-linecap="round"/>
  </svg>
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
    <div style="font-size:12px;font-weight:700;color:${color};line-height:1;">${value}</div>
  </div>`;
}

function getScoreRangeColor(pct: number): string {
  return getScoreRangeColorHtml(pct);
}

function progressBarHtml(ratio: number, color: string, height: number = 8): string {
  const pct = Math.round(ratio * 100);
  const barColor = color || getScoreRangeColor(pct);
  return `<div style="background:var(--gray-2);border-radius:${height/2}px;height:${height}px;width:100%;overflow:hidden;">
    <div style="background:${barColor};height:100%;width:${pct}%;border-radius:${height/2}px;"></div>
  </div>`;
}

function statusBadge(status: string, t: Record<string, string>): string {
  const label = status === "pass" ? t.statusPass : status === "warning" ? t.statusWarning : t.statusFail;
  const bg = getStatusBg(status);
  const color = getStatusColor(status);
  return `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:9pt;font-weight:600;background:${bg};color:${color};border:1px solid ${color};">${esc(label)}</span>`;
}

// ═══════════════════════════════════════════════
// CSS DESIGN SYSTEM — Premium Report v2
// 30 design improvements applied
// ═══════════════════════════════════════════════
const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  /* ── Claude Spec Color Tokens ── */
  --primary: #0F2B5B;
  --accent: #1D6FBF;
  --highlight: #E8F0FB;
  --success: #1A7F5A;
  --warning: #C47D0E;
  --danger: #B83232;
  --gray-1: #F5F6F8;
  --gray-2: #E4E6EA;
  --gray-3: #8A90A0;
  --text: #1A1D23;

  /* Legacy aliases for backward compat */
  --navy-900: #0F2B5B;
  --navy-800: #0F2B5B;
  --navy-700: #1a3a6e;
  --navy-600: #0F2B5B;
  --navy-500: #1D6FBF;
  --navy-400: #1D6FBF;
  --teal-500: #1D6FBF;
  --teal-400: #1D6FBF;
  --teal-300: #5BA3E0;
  --blue-500: #1D6FBF;
  --blue-400: #5BA3E0;

  --gray-50: #F5F6F8;
  --gray-100: #F5F6F8;
  --gray-200: #E4E6EA;
  --gray-300: #C8CCD4;
  --gray-400: #8A90A0;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1A1D23;

  /* Semantic */
  --pass: #1A7F5A;
  --pass-bg: #E6F7F0;
  --pass-border: #1A7F5A;
  --warn: #C47D0E;
  --warn-bg: #FEF5E4;
  --warn-border: #C47D0E;
  --fail: #B83232;
  --fail-bg: #FDECEC;
  --fail-border: #B83232;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.03);

  /* Typography Scale — Claude Spec */
  --h1: 22px;
  --h2: 14px;
  --body: 10px;
  --caption: 9px;
  --micro: 8px;
  --kpi: 28px;
  --label: 11px;
  --lead: 12px;
}

body {
  font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text);
  line-height: 1.75;
  font-size: var(--body);
  background: white;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ═══ Page Shell ═══ */
.page {
  width: 210mm;
  min-height: 297mm;
  padding: 0;
  page-break-after: always;
  position: relative;
  overflow: hidden;
  background: white;
}
.page:last-child { page-break-after: avoid; }

/* ── Page Header — Claude Spec ── */
.page-header {
  padding: 12px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--accent);
  background: white;
}
.page-header .brand {
  font-weight: 700;
  font-size: 10px;
  color: var(--primary);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-header .brand::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}
.page-header .section-name {
  font-size: 8pt;
  color: var(--gray-3);
  font-weight: 400;
  letter-spacing: 0.3px;
}

/* ── Page Footer — Claude Spec ── */
.page-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9pt;
  color: var(--gray-3);
  border-top: 0.5px solid var(--gray-2);
}

/* ── Content Area ── */
.content { padding: 24px 40px 50px 40px; }
.content p { margin-bottom: 10px; max-width: 560px; }
.content > .sub-title { margin-top: 24px; }
.content > .card + .card { margin-top: 0; }
.content > .grid-2, .content > .grid-3, .content > .grid-4 { margin-bottom: 16px; }
.content > .info-box, .content > .insight-box { margin-top: 16px; margin-bottom: 16px; }

/* ── Section Header — Claude Spec "01 / 섹션명" format ── */
.section-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--gray-2);
}
.section-title .accent-bar {
  width: 4px;
  min-height: 32px;
  background: var(--accent);
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 1px;
}
.section-title h2 {
  font-size: var(--h2);
  font-weight: 600;
  color: var(--primary);
  line-height: 1.3;
  letter-spacing: -0.2px;
}
.section-title .sec-num {
  color: var(--gray-3);
  font-weight: 400;
  margin-right: 4px;
}
.section-title .subtitle {
  font-size: var(--caption);
  color: var(--gray-3);
  margin-top: 3px;
  font-weight: 400;
  letter-spacing: 0.3px;
}

/* ── Sub Section Title ── */
.sub-title {
  font-size: var(--h2);
  font-weight: 600;
  color: var(--primary);
  margin: 18px 0 10px 0;
  padding-left: 12px;
  border-left: 4px solid var(--accent);
  line-height: 1.4;
}

/* ── #28 Caption/Intro text — italic + color ── */
.section-intro {
  font-size: var(--body);
  color: var(--gray-500);
  font-style: italic;
  line-height: 1.7;
  margin-bottom: 16px;
  padding-left: 2px;
}

/* ── Info Box — Claude Spec ── */
.info-box {
  background: var(--highlight);
  border-left: 4px solid var(--accent);
  padding: 12px 16px;
  margin: 10px 0 16px 0;
  border-radius: 0 6px 6px 0;
  font-size: var(--label);
  color: var(--text);
  line-height: 1.75;
}
.info-box-danger {
  background: #FDF2F2;
  border-left: 4px solid var(--danger);
}
.info-box-success {
  background: #F0FAF5;
  border-left: 4px solid var(--success);
}

/* ── Insight Box ── */
.insight-box {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border: 1px solid var(--warn-border);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 12px 0;
  font-size: var(--body);
}

/* ── Card ── */
.card {
  background: white;
  border: 1px solid var(--gray-2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
}
.card-accent {
  border-left: 4px solid var(--accent);
}
.card-danger-top { border-top: 3px solid var(--danger); }
.card-warning-top { border-top: 3px solid var(--warning); }
.card-success-top { border-top: 3px solid var(--success); }
.card-dark {
  background: var(--primary);
  border: 1px solid var(--accent);
  color: white;
}

/* ── Table — Claude Spec ── */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--body);
  border: 1px solid var(--gray-2);
  border-radius: 8px;
  overflow: hidden;
}
.data-table thead th {
  background: var(--primary);
  color: white;
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 10pt;
  letter-spacing: 0.3px;
}
.data-table tbody td {
  padding: 10px 14px;
  border-bottom: 0.5px solid var(--gray-2);
  vertical-align: top;
  font-size: 10px;
  line-height: 1.75;
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
}
.data-table tbody tr:nth-child(odd) { background: white; }
.data-table tbody tr:nth-child(even) { background: var(--gray-1); }
.data-table tbody tr:last-child td { border-bottom: none; }

/* ── Score Card ── */
.score-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--gray-50);
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}
.score-card .score-value { font-size: 28px; font-weight: 700; }
.score-card .score-label { font-size: var(--body); color: var(--gray-500); }

/* ── Grid ── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }

/* ── Metric Box ── */
.metric-box {
  text-align: center;
  padding: 14px 8px;
  background: var(--gray-50);
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}
.metric-box .label { font-size: var(--caption); color: var(--gray-500); margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-box .value { font-size: 22px; font-weight: 700; }

/* ── Status Badge — Claude Spec ── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 9pt;
  font-weight: 600;
  border: 1px solid transparent;
}
.badge-pass { background: #E6F7F0; color: #1A7F5A; border-color: #1A7F5A; }
.badge-warn { background: #FEF5E4; color: #C47D0E; border-color: #C47D0E; }
.badge-fail { background: #FDECEC; color: #B83232; border-color: #B83232; }

/* ── #27 Priority Badge ── */
.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.priority-high { background: var(--fail-bg); color: var(--fail); border: 1px solid var(--fail-border); }
.priority-mid { background: var(--warn-bg); color: var(--warn); border: 1px solid var(--warn-border); }
.priority-low { background: var(--pass-bg); color: var(--pass); border: 1px solid var(--pass-border); }

/* ── #24 Difficulty Tag ── */
.diff-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 8.5px;
  font-weight: 500;
}
.diff-easy { background: #ECFDF5; color: #059669; }
.diff-medium { background: #FFF7ED; color: #EA580C; }
.diff-hard { background: #FEF2F2; color: #DC2626; }

/* ═══ Cover Page — Claude Spec ═══ */
.cover {
  background: var(--primary);
  color: white;
  height: 297mm;
  position: relative;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
/* Geometric circles pattern — centered background */
.cover .geo-pattern {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  opacity: 0.04;
}
.cover .geo-pattern circle { fill: none; stroke: white; }

/* Cover header bar — stays left/right aligned */
.cover-header {
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.cover-header .brand-mark {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}
.cover-header .brand-mark::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--teal-400);
}
.cover-header .brand-mark .sep {
  color: var(--navy-500);
  margin: 0 4px;
}
.cover-header .brand-mark .report-type {
  font-weight: 400;
  color: var(--gray-400);
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.cover-header .cover-date {
  font-size: 9px;
  color: var(--gray-400);
}

/* Cover center content — vertically + horizontally centered */
.cover-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  text-align: center;
  position: relative;
  z-index: 1;
  padding: 0 40px 40px 40px;
  gap: 0;
}

/* Cover body — centered */
.cover-body {
  text-align: center;
  position: relative;
  z-index: 1;
  width: 100%;
}
.cover-body .tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 18px;
  border-radius: 20px;
  background: rgba(16,185,129,0.15);
  border: 1px solid rgba(16,185,129,0.3);
  font-size: 10px;
  font-weight: 600;
  color: var(--teal-300);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 28px;
}
.cover-body .tag-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--teal-400);
}
.cover-body .hospital-name {
  font-size: 28pt;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}
.cover-body .hospital-url {
  font-size: 13px;
  color: var(--gray-400);
  font-family: 'Inter', monospace;
  margin-bottom: 28px;
}
.cover-body .accent-line {
  width: 60px;
  height: 1px;
  background: var(--accent);
  border-radius: 0;
  margin: 12px auto;
}
.cover-body .report-title {
  font-size: 16pt;
  font-weight: 400;
  color: rgba(255,255,255,0.8);
  margin-bottom: 6px;
}
.cover-body .report-subtitle {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.5px;
}

/* Cover score section — centered */
.cover-score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;
  margin-top: 40px;
  width: 100%;
}
.cover-gauge {
  position: relative;
  flex-shrink: 0;
}
.cover-score-details {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  justify-content: center;
}
/* #8 Grade box — premium styled */
.grade-box {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 18px 32px;
  text-align: center;
}
.grade-box .grade-label {
  font-size: 9px;
  color: var(--gray-400);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.grade-box .grade-value {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
}

/* #26 Cover donut row — centered */
.cover-donut-row {
  display: flex;
  gap: 20px;
  justify-content: center;
}

/* Cover footer */
.cover-footer {
  position: absolute;
  bottom: 24px;
  left: 40px;
  right: 40px;
  display: flex;
  justify-content: space-between;
  font-size: var(--caption);
  color: var(--gray-500);
  z-index: 1;
}
.cover-footer .confidential {
  font-size: 7px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--navy-500);
}

/* ═══ #15 Page number — brand color accent ═══ */
.page-footer .page-num {
  color: var(--teal-500);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* ═══ Greeting Card ═══ */
.greeting-card {
  background: var(--gray-50);
  border-left: 3px solid var(--navy-600);
  border-radius: 0 8px 8px 0;
  padding: 22px 26px;
  margin-bottom: 16px;
}
.greeting-card .greeting-to {
  font-size: var(--h2);
  font-weight: 700;
  color: var(--navy-600);
  margin-bottom: 12px;
}
.greeting-card p {
  font-size: var(--body);
  color: var(--gray-600);
  line-height: 1.85;
  margin-bottom: 8px;
}
.greeting-card .sign {
  text-align: right;
  font-size: 9px;
  color: var(--gray-400);
  margin-top: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* ═══ Phase Banner ═══ */
.phase-banner {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin: 12px 0 10px 0;
  letter-spacing: 0.3px;
}
.phase-1 { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); }
.phase-2 { background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%); }
.phase-3 { background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%); }

/* ═══ Action Item ═══ */
.action-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
}
.action-item:last-child { border-bottom: none; }
.action-item .action-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--navy-600);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}
.action-item .action-body { flex: 1; }
.action-item .action-title { font-size: var(--body); font-weight: 600; color: var(--gray-800); line-height: 1.5; }
.action-item .action-impact { font-size: 9px; color: var(--gray-500); margin-top: 2px; line-height: 1.5; }

/* ═══ CTA Page — Claude Spec ═══ */
.cta-page {
  background: var(--primary);
  color: white;
  min-height: 297mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.cta-page h2 { font-size: 20pt; font-weight: 700; margin-bottom: 16px; }
.cta-page .cta-desc { font-size: 10pt; color: rgba(255,255,255,0.8); line-height: 1.8; margin-bottom: 32px; }
.cta-page .cta-contact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.cta-page .cta-contact .contact-card {
  background: white;
  border-radius: 8px;
  padding: 20px 24px;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}
.cta-page .qr-section { margin-top: 16px; }
.cta-page .qr-section img { border-radius: 8px; border: 3px solid rgba(255,255,255,0.2); }
.cta-page .disclaimer {
  position: absolute;
  bottom: 24px;
  left: 40px;
  right: 40px;
  font-size: var(--micro);
  color: var(--navy-500);
  line-height: 1.5;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 12px;
}

/* ═══ Utility ═══ */
.text-pass { color: var(--pass); }
.text-warn { color: var(--warn); }
.text-fail { color: var(--fail); }
.text-navy { color: var(--navy-600); }
.text-muted { color: var(--gray-400); }
.text-light { color: var(--gray-500); }
.text-mid { color: var(--gray-600); }
.fw-500 { font-weight: 500; }
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
.fs-9 { font-size: 9px; }
.fs-10 { font-size: var(--body); }
.fs-11 { font-size: 11px; }
.fs-12 { font-size: 12px; }
.fs-14 { font-size: 14px; }
.fs-20 { font-size: 20px; }
.mt-4 { margin-top: 4px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mb-4 { margin-bottom: 4px; }
.mb-8 { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.gap-8 { gap: 8px; }
.gap-10 { gap: 10px; }

/* ═══ Highlight Card ═══ */
.highlight-card {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

/* ═══ Stat Pill ═══ */
.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
}

/* ═══ Divider ═══ */
.divider { height: 1px; background: var(--gray-200); margin: 14px 0; }

/* ═══ #29 Spacing — min 32px between sections ═══ */
.section-gap { margin-top: 32px; }

/* ═══ #9 Alternating section backgrounds ═══ */
.section-alt {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
}

/* ═══ #12 SVG Icon set for status ═══ */
.icon-check, .icon-warn, .icon-fail { display: inline-block; width: 14px; height: 14px; vertical-align: middle; margin-right: 3px; }

/* ═══ #16 AI Platform icons ═══ */
.platform-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  font-size: 10px;
  font-weight: 700;
  color: var(--navy-600);
  flex-shrink: 0;
}

/* ═══ #25 Action cards 2-col grid ═══ */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.action-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: var(--shadow-xs);
}
.action-card .action-card-title {
  font-size: var(--body);
  font-weight: 600;
  color: var(--gray-800);
  line-height: 1.5;
  margin-bottom: 4px;
}
.action-card .action-card-impact {
  font-size: 9px;
  color: var(--gray-500);
  line-height: 1.5;
}

/* ═══ #26 Mini donut for cover ═══ */
.cover-donut-row {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

/* ═══ #23 Keyword dot ═══ */
.dot-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 500;
}
.dot-indicator::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot-exposed::before { background: var(--pass); }
.dot-not-exposed::before { background: var(--gray-300); }

/* ═══ Callout Component ═══ */
.callout {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  margin: 10px 0;
  font-size: var(--body);
  line-height: 1.6;
}
.callout-icon { flex-shrink: 0; margin-top: 1px; }
.callout-body { flex: 1; }
.callout-title { font-weight: 600; font-size: var(--body); margin-bottom: 4px; }
.callout-text { font-size: var(--caption); color: var(--gray-600); line-height: 1.6; }
.callout-warn { background: var(--warn-bg); border: 1px solid var(--warn-border); }
.callout-warn .callout-title { color: var(--warn); }
.callout-info { background: #F0FAF5; border: 1px solid var(--success); }
.callout-info .callout-title { color: var(--success); }
.callout-fail { background: var(--fail-bg); border: 1px solid var(--fail-border); }
.callout-fail .callout-title { color: var(--fail); }

/* ═══ Gap utility ═══ */
.gap-16 { gap: 16px; }

/* ═══ Text utilities ═══ */
.text-pass { color: var(--pass); }
.text-warn { color: var(--warn); }
.text-fail { color: var(--fail); }
.text-muted { color: var(--gray-400); }

/* ═══ Print optimization — Claude Spec ═══ */
@media print {
  .page { page-break-inside: avoid; }
  .card, .data-table, .action-item, .callout { page-break-inside: avoid; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cover, .cta-page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

/* ═══ Pill Tag — Claude Spec ═══ */
.pill-tag {
  display: inline-block;
  background: var(--gray-1);
  border: 1px solid var(--gray-2);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 9pt;
  color: var(--text);
}

/* ═══ Priority Number Badge — Claude Spec ═══ */
.num-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

/* ═══ Score Bar — Claude Spec ═══ */
.score-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.score-bar-bg {
  flex: 1;
  height: 8px;
  background: var(--gray-2);
  border-radius: 4px;
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
  border-radius: 4px;
}
.score-bar-label {
  font-size: 10pt;
  color: var(--gray-3);
  white-space: nowrap;
}
`;

// ═══════════════════════════════════════════════
// HTML SECTION BUILDERS
// ═══════════════════════════════════════════════

function pageHeader(t: Record<string, string>, url: string, sectionName?: string): string {
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `<div class="page-header">
    <span class="brand">${esc(t.brand)}</span>
    <span class="section-name">${sectionName ? esc(sectionName) : esc(displayUrl)}</span>
  </div>`;
}

function pageFooter(pageNum: number, totalPages: number, brand: string): string {
  return `<div class="page-footer">
    <span class="page-num" style="color:var(--gray-3);font-size:9pt;">${pageNum} / ${totalPages}</span>
    <span style="color:var(--gray-3);font-size:9pt;">CONFIDENTIAL | mybiseo.com</span>
  </div>`;
}

function sectionTitle(title: string, subtitle?: string, sectionNum?: string): string {
  return `<div class="section-title">
    <div class="accent-bar"></div>
    <div>
      <h2>${sectionNum ? `<span class="sec-num">${esc(sectionNum)} /</span> ` : ''}${esc(title)}</h2>
      ${subtitle ? `<div class="subtitle">${esc(subtitle)}</div>` : ""}
    </div>
  </div>`;
}

// ── Cover Page — matching reference image exactly ──
function buildCoverPage(t: Record<string, string>, hospitalName: string, displayUrl: string, score: number, grade: string, summary: { passed: number; warnings: number; failed: number }, lang: Lang): string {
  const now = new Date();
  let dateStr: string;
  if (lang === "ko") {
    dateStr = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
  } else if (lang === "th") {
    dateStr = now.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  } else {
    dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  const gradeBadgeColor = score >= 90 ? '#1A7F5A' : score >= 70 ? '#1D6FBF' : score >= 50 ? '#C47D0E' : '#B83232';
  const scoreColor = score >= 80 ? '#6EE7B7' : score >= 60 ? '#93C5FD' : score >= 40 ? '#FCD34D' : '#FCA5A5';
  const cleanUrl = displayUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  return `<div class="page cover">
    <!-- Header: 상단 20% -->
    <div style="padding:28px 40px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="font-size:13px;font-weight:700;color:white;letter-spacing:1px;">${esc(t.brand)}</div>
        <span style="color:rgba(255,255,255,0.3);margin:0 6px;">|</span>
        <span style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.7);">AI 가시성 진단 보고서</span>
      </div>
      <div style="font-size:9px;color:rgba(255,255,255,0.5);">${esc(t.coverDate)}: ${esc(dateStr)}</div>
    </div>

    <!-- 중앙 40%: 핵심 점수 블록 -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 40px;position:relative;z-index:1;">
      <div style="font-size:80pt;font-weight:700;color:${scoreColor};line-height:1;letter-spacing:-2px;">${score}<span style="font-size:24pt;font-weight:400;color:rgba(255,255,255,0.5);margin-left:4px;">/ 100</span></div>
      <div style="width:80px;height:1px;background:var(--accent);margin:16px auto;"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:${gradeBadgeColor};font-size:22pt;font-weight:700;color:white;">${grade}</span>
        <span style="font-size:10pt;color:rgba(255,255,255,0.7);">${lang === 'ko' ? '현재 귀 병원의 AI 가시성 등급' : lang === 'en' ? 'Your AI Visibility Grade' : 'ระดับ AI Visibility ของคุณ'}</span>
      </div>
    </div>

    <!-- 중하단 20%: 병원 정보 -->
    <div style="text-align:center;padding:0 40px 20px;position:relative;z-index:1;">
      <div style="font-size:26pt;font-weight:700;color:white;line-height:1.2;margin-bottom:8px;">${esc(hospitalName)}</div>
      <div style="font-size:12px;font-weight:400;color:rgba(255,255,255,0.5);font-family:'Inter',monospace;">${esc(cleanUrl)}</div>
    </div>

    <!-- 하단 20%: 요약 수치 3 pill -->
    <div style="display:flex;justify-content:center;gap:12px;padding:0 40px 32px;position:relative;z-index:1;">
      <span style="padding:8px 20px;border-radius:24px;background:rgba(26,127,90,0.2);border:1px solid rgba(26,127,90,0.4);color:#6EE7B7;font-size:12px;font-weight:600;">${esc(t.coverPassed)} ${summary.passed}${lang === 'ko' ? '개' : ''}</span>
      <span style="padding:8px 20px;border-radius:24px;background:rgba(196,125,14,0.2);border:1px solid rgba(196,125,14,0.4);color:#FCD34D;font-size:12px;font-weight:600;">${esc(t.coverWarnings)} ${summary.warnings}${lang === 'ko' ? '개' : ''}</span>
      <span style="padding:8px 20px;border-radius:24px;background:rgba(184,50,50,0.2);border:1px solid rgba(184,50,50,0.4);color:#FCA5A5;font-size:12px;font-weight:600;">${esc(t.coverFailed)} ${summary.failed}${lang === 'ko' ? '개' : ''}</span>
    </div>

    <!-- 하단 띠: accent 8px + 인사말 흡수 -->
    <div style="position:absolute;bottom:0;left:0;right:0;z-index:1;">
      <div style="text-align:center;padding:10px 40px;font-size:9pt;color:rgba(255,255,255,0.7);line-height:1.5;">${lang === 'ko' ? '이 보고서는 귀 병원만을 위해 자동 생성된 맞춤 진단 결과입니다' : lang === 'en' ? 'This report is a customized diagnostic generated exclusively for your hospital' : 'รายงานนี้สร้างขึ้นเฉพาะสำหรับโรงพยาบาลของคุณ'}</div>
      <div style="height:8px;background:var(--accent);"></div>
    </div>

    <!-- 우하단 mybiseo.com -->
    <div style="position:absolute;bottom:14px;right:40px;font-size:8pt;color:rgba(255,255,255,0.4);z-index:2;">mybiseo.com</div>
  </div>`;
}

// ── Greeting Page ──
function buildGreetingPage(t: Record<string, string>, url: string, hospitalName: string, lang: Lang, pageNum: number, totalPages: number, score?: number, grade?: string, rd?: RealityDiagnosis | null): string {
  const greetingTitle = lang === "ko" ? "원장님께 드리는 시장 브리핑" : lang === "en" ? "Market Briefing" : "ข้อความถึงท่าน";
  const greetingSub = lang === "ko" ? "AI 검색 시장이 변화하고 있습니다 — 경쟁사는 이미 움직이고 있습니다" : lang === "en" ? "The AI search market is shifting — your competitors are already moving" : "ยุค AI การตลาดโรงพยาบาลกำลังเปลี่ยนแปลง";

  const paragraphs = lang === "ko" ? [
    `${hospitalName} 원장님께`,
    "본 리포트는 단순한 '문제 진단'이 아닙니다. AI 검색 시장의 기회와 경쟁 동향을 담은 '시장 인텔리전스'입니다. 강남 상위 20개 병원 중 60% 이상이 이미 AI 가시성 최적화를 진행 중이며, 이 추세는 가속화되고 있습니다.",
    "Google의 2025년 조사에 따르면, 의료 정보 검색의 40% 이상이 AI 기반 답변을 통해 이루어지고 있습니다. 환자의 여정은 'AI에게 질문 → AI 추천 병원 확인 → 바로 예약'으로 전환되고 있으며, 이 변화에 선제적으로 대응하는 병원은 경쟁 병원 대비 높은 신규 환자 유입을 기대할 수 있습니다.",
    "본 리포트는 귀 병원의 현재 포지션을 객관적으로 분석하고, 경쟁사 대비 선점할 수 있는 구체적인 기회를 제안합니다. 장사가 잘되는 병원일수록, 이 시장 변화에 먼저 대응해야 경쟁 우위를 유지할 수 있습니다.",
  ] : lang === "en" ? [
    `Dear ${hospitalName}`,
    "The way patients discover hospitals is fundamentally changing. According to Google's 2025 research, over 40% of medical information searches are now answered through AI-powered responses.",
    "The patient journey has shifted from 'portal search → blog check → visit' to 'ask AI → check AI-recommended hospital → book directly'.",
    "MY Biseo is a specialized AI marketing agency that maximizes hospitals' digital visibility in the AI era.",
    "This report objectively diagnoses your hospital's current AI visibility status and proposes specific improvement directions.",
  ] : [
    `เรียน ${hospitalName}`,
    "วิธีที่ผู้ป่วยค้นหาโรงพยาบาลกำลังเปลี่ยนแปลงอย่างพื้นฐาน จากการวิจัยของ Google ปี 2025 การค้นหาข้อมูลทางการแพทย์มากกว่า 40% ใช้ AI ตอบคำถาม",
    "รายงานฉบับนี้วินิจฉัยสถานะการมองเห็น AI ของโรงพยาบาลของคุณและเสนอแนวทางการปรับปรุงที่เฉพาะเจาะจง",
  ];

  return `<div class="page">
    ${pageHeader(t, url, greetingTitle)}
    <div class="content">
      ${sectionTitle(greetingTitle, greetingSub, '01')}
      <div class="greeting-card">
        <div class="greeting-to">${esc(paragraphs[0])}</div>
        ${paragraphs.slice(1).map(p => `<p>${esc(p)}</p>`).join("")}
        <div class="sign">${esc(t.brand)}</div>
      </div>

      ${score !== undefined ? `
      <div class="sub-title" style="margin-top:20px;">${lang === "ko" ? "귀 병원의 현재 포지션" : lang === "en" ? "Your Current Position" : "สรุปการวินิจฉัย"}</div>
      <div class="grid-3 mb-16">
        <div class="card card-accent" style="text-align:center;padding:16px 12px;">
          <div class="fs-9 text-light mb-4" style="text-transform:uppercase;letter-spacing:0.5px;">${esc(t.coverScore)}</div>
          <div style="font-size:32px;font-weight:700;color:${getGradeColor(grade || 'D')};">${score}</div>
          <div style="font-size:10px;color:var(--gray-400);">${esc(t.coverGrade)}: ${grade || 'D'}</div>
        </div>
        <div class="card card-accent" style="text-align:center;padding:16px 12px;">
          <div class="fs-9 text-light mb-4" style="text-transform:uppercase;letter-spacing:0.5px;">${lang === "ko" ? "AI 대응력" : lang === "en" ? "AI Readiness" : "AI Visibility"}</div>
          <div style="font-size:32px;font-weight:700;color:${(rd?.metrics?.aiReadiness ?? 0) >= 40 ? 'var(--warn)' : 'var(--fail)'};">${rd?.metrics?.aiReadiness ?? 0}</div>
          <div style="font-size:10px;color:var(--gray-400);">/ 100</div>
        </div>
        <div class="card card-accent" style="text-align:center;padding:16px 12px;">
          <div class="fs-9 text-light mb-4" style="text-transform:uppercase;letter-spacing:0.5px;">${lang === "ko" ? "선점 기회" : lang === "en" ? "Opportunities" : "การดำเนินการทันที"}</div>
          <div style="font-size:32px;font-weight:700;color:var(--fail);">${rd?.actionItems?.filter(a => (a.priority as string) === '즉시' || (a.priority as string) === 'immediate').length ?? 0}</div>
          <div style="font-size:10px;color:var(--gray-400);">${lang === "ko" ? "건" : lang === "en" ? "items" : "รายการ"}</div>
        </div>
      </div>

      ${rd?.keyFindings && rd.keyFindings.length > 0 ? `
      <div class="sub-title">${lang === "ko" ? "시장 핵심 인사이트" : lang === "en" ? "Key Market Insights" : "ข้อค้นพบสำคัญ"}</div>
      <div class="card" style="padding:12px 16px;">
        ${rd.keyFindings.slice(0, 4).map((f, i) => `<div style="display:flex;gap:10px;padding:7px 0;${i < Math.min(rd.keyFindings!.length, 4) - 1 ? 'border-bottom:1px solid var(--gray-100);' : ''}"><span style="width:20px;height:20px;border-radius:50%;background:var(--navy-600);color:white;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;flex-shrink:0;">${i + 1}</span><span class="fs-10" style="line-height:1.6;">${esc(stripMarkdown(f))}</span></div>`).join('')}
      </div>` : ''}
      ` : ''}
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

// ── Executive Summary Page ──
function buildExecutiveSummaryPage(t: Record<string, string>, url: string, score: number, grade: string, summary: { passed: number; warnings: number; failed: number }, rd: RealityDiagnosis | null, categories: SeoAuditResult["categories"], lang: Lang, pageNum: number, totalPages: number): string {
  const hospitalName = rd?.hospitalName || url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const missedPatients = rd?.metrics?.missedPatientsMonthly ?? 0;
  const revenueLoss = rd?.metrics?.estimatedRevenueLoss ?? '0';
  const findings = rd?.keyFindings || [];
  const aiMentionRate = rd?.aiSimulator?.mentionRate ?? '0%';

  // AI 플랫폼 추천 수 계산
  const aiResults = rd?.aiSimulator?.results || [];
  const aiMentioned = aiResults.filter(r => r.mentioned).length;
  const aiTotal = aiResults.length || 5;

  // 키워드 미노출 계산
  const keywords = rd?.keywords || [];
  const unexposed = keywords.filter(k => !k.naver.found && !k.google.found).length;
  const unexposedRate = keywords.length > 0 ? Math.round((unexposed / keywords.length) * 100) : 0;

  const summaryTitle = lang === 'ko' ? '핵심 요약' : lang === 'en' ? 'Executive Summary' : 'สรุปผล';
  const summarySubtitle = lang === 'ko' ? '지금 이 병원에 무슨 일이 일어나고 있나' : lang === 'en' ? 'What is happening to this hospital right now' : 'สิ่งที่เกิดขึ้นกับโรงพยาบาลนี้ตอนนี้';

  return `<div class="page">
    ${pageHeader(t, url, summaryTitle)}
    <div class="content">
      ${sectionTitle(summaryTitle, summarySubtitle, '01')}

      <!-- 위기 선언 인포박스 -->
      <div class="info-box info-box-danger" style="border-left-width:6px;padding:14px 18px;margin-top:14px;">
        <div style="font-size:13pt;font-weight:600;color:var(--text);line-height:1.7;">
          ${esc(hospitalName)}${lang === 'ko' ? '은 현재 매월 약 ' : ' is currently missing approximately '}<span style="color:var(--danger);font-size:16pt;font-weight:700;">${missedPatients}${lang === 'ko' ? '명' : ''}</span>${lang === 'ko' ? '의 웹사이트 유입 누락 환자와 ' : ' missed website visitors and '}<span style="color:var(--danger);font-size:16pt;font-weight:700;">${esc(revenueLoss)}</span>${lang === 'ko' ? '의 잠재 매출 기회가 존재합니다' : ' in potential revenue opportunity every month'}
        </div>
      </div>

      <!-- KPI 3열 카드 -->
      <div class="grid-3" style="margin-top:16px;">
        <div class="card card-danger-top" style="text-align:center;padding:18px 14px;">
          <div style="margin-bottom:8px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></div>
          <div style="font-size:32pt;font-weight:700;color:var(--danger);line-height:1;">${esc(revenueLoss)}</div>
          <div style="font-size:10px;font-weight:500;color:var(--text);margin-top:6px;">${lang === 'ko' ? '예상 잠재 매출 기회' : 'Est. Revenue Opportunity'}</div>
          <div style="font-size:9px;color:var(--gray-3);margin-top:4px;">${lang === 'ko' ? `웹사이트 유입 누락 환자 ${missedPatients}명 기준` : `Based on ${missedPatients} missed website visitors`}</div>
        </div>
        <div class="card card-danger-top" style="text-align:center;padding:18px 14px;">
          <div style="margin-bottom:8px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></div>
          <div style="font-size:32pt;font-weight:700;color:var(--danger);line-height:1;">${aiMentioned} / ${aiTotal}</div>
          <div style="font-size:10px;font-weight:500;color:var(--text);margin-top:6px;">${lang === 'ko' ? '주요 AI 플랫폼 추천' : 'AI Platform Recommendations'}</div>
          <div style="font-size:9px;color:var(--gray-3);margin-top:4px;">${lang === 'ko' ? 'ChatGPT·Gemini·Perplexity·Claude·Cue' : 'ChatGPT·Gemini·Perplexity·Claude·Cue'}</div>
        </div>
        <div class="card card-warning-top" style="text-align:center;padding:18px 14px;">
          <div style="margin-bottom:8px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>
          <div style="font-size:32pt;font-weight:700;color:var(--warning);line-height:1;">${unexposed} / ${keywords.length}</div>
          <div style="font-size:10px;font-weight:500;color:var(--text);margin-top:6px;">${lang === 'ko' ? '핵심 키워드 미노출' : 'Keywords Not Exposed'}</div>
          <div style="font-size:9px;color:var(--gray-3);margin-top:4px;">${lang === 'ko' ? `${unexposedRate}%가 네이버·구글에서 미노출` : `${unexposedRate}% not found on Naver/Google`}</div>
        </div>
      </div>

      <!-- 핵심 발견사항 5개 -->
      ${findings.length > 0 ? `
      <div class="info-box" style="margin-top:16px;padding:14px 18px;">
        <div style="font-weight:600;font-size:11px;color:var(--primary);margin-bottom:10px;">${lang === 'ko' ? '핵심 발견사항' : 'Key Findings'}</div>
        ${findings.slice(0, 5).map((f, i) => `<div style="display:flex;gap:8px;padding:5px 0;${i < Math.min(findings.length, 5) - 1 ? 'border-bottom:1px solid var(--gray-2);' : ''}">
          <span style="color:var(--danger);font-size:10px;margin-top:2px;">●</span>
          <span style="font-size:10px;color:var(--text);line-height:1.75;">${esc(stripMarkdown(f))}</span>
        </div>`).join('')}
        <div style="text-align:right;margin-top:10px;font-size:9px;color:var(--accent);font-style:italic;">${lang === 'ko' ? '→ 다음 페이지에서 상세 진단 결과를 확인하세요' : '→ See next pages for detailed diagnosis results'}</div>
      </div>` : `
      <!-- findings 없을 때 카테고리별 점수 요약 -->
      <div class="info-box" style="margin-top:16px;padding:14px 18px;">
        <div style="font-weight:600;font-size:11px;color:var(--primary);margin-bottom:10px;">${lang === 'ko' ? '카테고리별 진단 요약' : 'Category Diagnosis Summary'}</div>
        ${categories.slice(0, 8).map((c, i) => {
          const catScore = c.items.reduce((s, it) => s + it.score, 0);
          const catMax = c.items.reduce((s, it) => s + it.maxScore, 0);
          const pct = catMax > 0 ? Math.round((catScore / catMax) * 100) : 0;
          const passCount = c.items.filter(it => it.status === 'pass').length;
          const failCount = c.items.filter(it => it.status === 'fail').length;
          const warnCount = c.items.filter(it => it.status === 'warning').length;
          const barColor = pct >= 70 ? 'var(--pass)' : pct >= 40 ? 'var(--warn)' : 'var(--fail)';
          return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;${i < Math.min(categories.length, 8) - 1 ? 'border-bottom:1px solid var(--gray-2);' : ''}">
            <span style="font-size:9px;color:var(--text);min-width:100px;font-weight:500;">${esc(catName(c.name, lang))}</span>
            <div style="flex:1;height:6px;background:var(--gray-2);border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;"></div></div>
            <span style="font-size:8px;color:var(--gray-3);min-width:40px;text-align:right;">${catScore}/${catMax}</span>
            <span style="font-size:7px;color:var(--gray-3);min-width:70px;text-align:right;">✅${passCount} ⚠️${warnCount} ❌${failCount}</span>
          </div>`;
        }).join('')}
        <div style="text-align:right;margin-top:10px;font-size:9px;color:var(--accent);font-style:italic;">${lang === 'ko' ? '→ 다음 페이지에서 상세 진단 결과를 확인하세요' : '→ See next pages for detailed diagnosis results'}</div>
      </div>`}
    </div>
    ${pageFooter(pageNum, totalPages, t.brand)}
  </div>`;
}

export { buildCoverPage, buildGreetingPage, buildExecutiveSummaryPage, sectionTitle, pageHeader, pageFooter, statusBadge, progressBarHtml, esc, stripMarkdown, getGradeColor, getStatusColor, getStatusBg, catName, scoreGaugeSvg, scoreGaugeSvgLight, statusIcon, platformIcon, miniDonutSvg, CSS, i18n, CAT_NAMES_KO };
export type { SeoAuditResult, Lang, ReportLanguage };

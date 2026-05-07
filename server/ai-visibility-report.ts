/**
 * AI 가시성 진단 보고서 PDF 생성 — 통합 디자인 시스템 v3.1 (최적화)
 * 참고: 시크릿에디션 CRM 보고서 수준의 완성도
 * 20페이지 이하 압축, 통일된 디자인, 영업 임팩트 극대화
 *
 * v3.1 최적화:
 * - 폰트 버퍼 lazy 초기화 (4.5MB base64 → Buffer 변환 1회만)
 * - QR 코드 캐시 유지
 * - 번역 병렬화 지원
 * - 불필요한 heightOfString 호출 최소화
 */
import * as PDFDocumentModule from "pdfkit";
const PDFDocument = (PDFDocumentModule as any).default || PDFDocumentModule;
import * as QRCode from "qrcode";
import { invokeLLM } from "./_core/llm";
import type { RealityDiagnosis as RealityDiagnosisImported } from "./reality-diagnosis";
type RealityDiagnosis = RealityDiagnosisImported;
import { resolveSpecialty } from "./specialty-weights";
import { SPECIALTY_REVENUE_PROFILES } from "./utils/specialty-revenue-data";
import { translateResultToEnglish } from "./ai-visibility-translate";
import { krRegularBase64, krBoldBase64 } from "./fonts-base64";
import { getMonthlyTrendByUrl, getScoreComparisonByUrl } from "./db";

// ── Lazy font buffer cache (4.5MB base64 → Buffer 변환 1회만) ──
let _fontBuffers: { krRegular: Buffer; krBold: Buffer } | null = null;
function getFontBuffers() {
  if (!_fontBuffers) {
    _fontBuffers = {
      krRegular: Buffer.from(krRegularBase64, "base64"),
      krBold: Buffer.from(krBoldBase64, "base64"),
    };
  }
  return _fontBuffers;
}

// QR 코드 캐시
let cachedQrBuffer: Buffer | null = null;

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

// RealityDiagnosis is imported from ./reality-diagnosis
// Local interface removed to avoid conflict
interface _RealityDiagnosisRef {
  hospitalName: string;
  specialty: string;
  headline: string;
  executiveSummary: string;
  keyFindings: string[];
  riskScore: number;
  urgencyLevel: string;
  metrics: {
    naverExposureRate: number;
    googleExposureRate: number;
    aiReadiness: number;
    missedPatientsMonthly: number;
    estimatedRevenueLoss: string;
  };
  keywords: {
    keyword: string;
    monthlySearchVolume: number;
    naver: { found: boolean; position: string; type: string; detail: string };
    google: { found: boolean; position: string; type: string; detail: string };
    ai: { likelihood: string; detail: string };
  }[];
  trafficInsight: any;
  competitors: { name: string; advantage: string; estimatedVisibility: string }[];
  missedPatients: { estimatedMonthly: number; reasoning: string; revenueImpact: string };
  contentGaps?: { keyword: string; searchIntent: string; difficulty: string; opportunityScore: number; suggestedContent: string; rationale: string }[];
  actionItems: { priority: string; action: string; expectedImpact: string }[];
  closingStatement: string;
  // ── Batch 1: 신규 진단 필드 ──
  geoTriAxis?: {
    relevance: { score: number; label: string; details: string[] };
    authority: { score: number; label: string; details: string[] };
    friction: { score: number; label: string; details: string[] };
    overallGeoScore: number;
    interpretation: string;
  };
  aiCitationThreshold?: {
    items: { condition: string; met: boolean; detail: string; howToFix: string }[];
    metCount: number;
    totalCount: number;
    verdict: string;
  };
  answerCapsule?: {
    score: number;
    currentBestSentence: string;
    idealSentence: string;
    issues: string[];
    recommendations: string[];
  };
  crossChannelTrust?: {
    channels: { name: string; status: string; consistencyScore: number; detail: string }[];
    overallConsistency: number;
    verdict: string;
  };
  aiSimulator?: {
    query: string;
    results: { engine: string; mentioned: boolean; rank: number | null; context: string }[];
    mentionRate: string;
    verdict: string;
  };
  naverCueDiagnosis?: {
    score: number;
    items: { criterion: string; status: string; detail: string; recommendation: string }[];
    verdict: string;
  };
  websiteTransformGuide?: {
    currentState: string;
    transformations: { area: string; currentIssue: string; recommendation: string; priority: string; estimatedImpact: string }[];
  };
  contentStrategy?: {
    currentAssessment: string;
    blogStrategy: string;
    faqStrategy: string;
    comparisonTableStrategy: string;
    contentCalendar: { week: string; topic: string; format: string; targetKeyword: string }[];
  };
  marketingDirection?: {
    overallStrategy: string;
    channelStrategies: { channel: string; strategy: string; priority: string; expectedOutcome: string }[];
    coexistenceMessage: string;
  };
  mybiseoServices?: {
    headline: string;
    services: { name: string; description: string; relevanceToHospital: string }[];
    ctaMessage: string;
  };
}

type Lang = "ko" | "en" | "th";
type ReportLanguage = Lang;

// ═══════════════════════════════════════════════
// DESIGN SYSTEM — 통일된 색상, 간격, 타이포그래피
// ═══════════════════════════════════════════════
const C = {
  // v5: 딥블루/네이비 계열 팔레트 (홈페이지 브랜딩 일관성)
  navy: "#1B2A4A",
  navyLight: "#2C3E6B",
  blue: "#3B82F6",
  blueLight: "#DBEAFE",
  blueMid: "#93C5FD",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  bgWarm: "#F1F5F9",
  bgAccent: "#EEF2FF",  // v5: 딥블루 계열 연한 배경
  text: "#1E293B",
  textMid: "#475569",
  textLight: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  pass: "#059669",
  passLight: "#D1FAE5",
  warn: "#D97706",
  warnLight: "#FEF3C7",
  fail: "#DC2626",
  failLight: "#FEE2E2",
  gold: "#B45309",
  purple: "#8B5CF6",
  grayBar: "#E5E7EB",
  grayMid: "#4B5563",
  greenTint: "#F0FDF4",
  redTint: "#FEF2F2",
  purpleTint: "#F5F3FF",
  blueTintLight: "#CBD5E1",
  teal: "#1B2A4A",       // v5: 딥블루(네이비)로 변경 (액센트 용도)
  tealLight: "#DBEAFE",  // v5: 블루 연한 배경
  tealMid: "#2C3E6B",    // v5: 네이비 라이트 (강조용)
  tealDark: "#1B2A4A",   // v5: 딥네이비 (헤더용)
};

// 디자인 상수 — 통일된 간격 시스템
const PW = 595.28; // A4 width
const PH = 841.89; // A4 height
const ML = 52;     // margin left (v4: 넓은 여백)
const MR = 52;     // margin right (v4: 넓은 여백)
const MT = 74;     // margin top (after header, +2 for header border)
const CW = PW - ML - MR; // content width
const MAX_Y = PH - 72;   // max content Y before page break (v4: 하단 여백 최적화)

// ── i18n ──
const i18n: Record<Lang, Record<string, string>> = {
  ko: {
    brand: "MY비서",
    coverTitle: "AI 가시성 진단 보고서",
    coverSub: "AI Visibility Diagnostic Report",
    coverDate: "진단일",
    coverScore: "종합 점수",
    coverGrade: "등급",
    coverItems: "진단 항목",
    coverPassed: "통과",
    coverWarnings: "주의",
    coverFailed: "실패",
    langLabel: "한국어",
    realityTitle: "디지털 가시성 현실 진단",
    realitySub: "Reality Diagnosis",
    realityExposed: "노출",
    realityNotExposed: "미노출",
    realityAiHigh: "높음",
    realityAiMedium: "보통",
    realityAiLow: "낮음",
    realityAiNone: "없음",
    realityKeywords: "키워드별 AI·포털 노출 현황",
    realityCompetitors: "경쟁 환경 분석",
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
    executiveSummary: "종합 분석 요약",
    executiveDesc: "AI가 직접 답변을 제공하는 제로클릭 시대, 병원의 디지털 가시성을 종합 진단합니다.",
    aiVisibility: "AI 인용 지수",
    aiPlatforms: "ChatGPT, Perplexity, Gemini, Claude 등 AI 플랫폼에서 병원이 추천·인용될 가능성을 평가합니다.",
    aiGood: "AI 플랫폼에서 양호한 추천·인용이 기대됩니다. 구조화된 데이터와 콘텐츠 품질이 적절한 수준입니다.",
    aiMedium: "AI 플랫폼 인용에 개선 여지가 있습니다. 답변 캡슐과 구조화 데이터 보강을 권장합니다.",
    aiBad: "AI 플랫폼 인용이 제한적입니다. 답변 캡슐, 구조화 데이터, E-E-A-T 신호 전반의 개선이 필요합니다.",
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
    criticalIssues: "즉시 개선 필요 항목",
    criticalDesc: "아래 항목들은 AI 플랫폼이 병원을 추천하지 않는 직접적인 원인입니다. 개선하지 않으면 환자가 AI를 통해 병원을 발견할 기회를 잃습니다.",
    warningIssues: "주의 필요 항목",
    warningDesc: "아래 항목들은 AI 가시성을 약화시키는 요소입니다. 경쟁 병원이 먼저 개선하면 추천 순위에서 뒤처질 수 있습니다.",
    currentStatus: "현재 상태",
    recommendation: "개선 방법",
    expectedImpact: "기대 효과",
    difficulty: "난이도",
    actionPlan: "단계별 개선 계획",
    actionDesc: "진단 결과를 바탕으로 우선순위에 따른 단계별 개선 계획을 제안합니다.",
    phase1: "1단계: 즉시 개선 (1~2주)",
    phase2: "2단계: 단기 개선 (1~2개월)",
    phase3: "3단계: 중장기 개선 (3개월~)",
    fullAudit: "전체 진단 항목 상세",
    fullAuditDesc: "모든 진단 항목의 상태와 점수를 확인할 수 있습니다.",
    item: "항목",
    status: "상태",
    detail: "상세",

    finalAssessment: "최종 평가 요약",
    finalAssessmentSub: "Final Assessment",
    ctaTitle: "전문가 상담 안내",
    ctaDesc1: "본 보고서에서 발견된 문제들을 체계적으로 해결하고 싶으시다면,",
    ctaDesc2: "MY비서 전문 컨설팅 팀의 맞춤 개선 전략을 수립해 드립니다.",
    ctaPhone: "전화 상담  010-7321-7004",
    ctaWeb: "온라인 상담  mybiseo.com",
    disclaimer: "본 보고서는 mybiseo.com의 AI 가시성 진단 시스템에 의해 생성되었습니다.\n데이터 출처: 네이버 검색 API, Google Search, SimilarWeb 트래픽 추정, AI 엔진(ChatGPT, Perplexity, Gemini, Claude, Cue:) 응답 분석.\nAI 플랫폼 및 포털의 내부 알고리즘은 비공개이므로, 진단 결과는 전략 수립을 위한 참고 자료입니다. 실제 노출 결과는 AI 모델 업데이트, 사용자 위치, 쿼리 맥락에 따라 달라질 수 있습니다.",
    statusPass: "통과",
    statusWarning: "주의",
    statusFail: "실패",
    naverLabel: "네이버",
    googleLabel: "구글",
    aiLabel: "AI 검색 노출",
    searchVolume: "월간 조회량",
    contentGapsTitle: "콘텐츠 사각지대 분석",
    contentGapsSub: "제로클릭 시대, 아직 아무도 선점하지 않은 AI 인용 기회 키워드",
    contentGapsKeyword: "키워드",
    contentGapsIntent: "사용자 의도",
    contentGapsDifficulty: "난이도",
    contentGapsOpportunity: "기회 점수",
    contentGapsSuggestion: "추천 콘텐츠 방향",
    contentGapsEasy: "쉬움",
    contentGapsNormal: "보통",
    contentGapsHard: "어려움",
    contentGapsRationale: "근거",
    geoTriAxisTitle: "GEO(Generative Engine Optimization) 3축 진단",
    geoTriAxisSub: "AI가 답변을 생성할 때 참고하는 3가지 기준: 적합성 · 권위 · 마찰",
    geoTriAxisWhy: "▶ 환자의 약 70~80%가 AI 답변을 클릭 없이 소비합니다 (Gartner, 2024). AI가 답변에 병원을 포함시키려면 이 3축이 모두 충족되어야 합니다.",
    geoRelevance: "적합성 (Relevance)",
    geoAuthority: "권위 (Authority)",
    geoFriction: "마찰 (Friction)",
    geoOverall: "GEO 종합 점수",
    aiCitationTitle: "AI 인용 임계점 체크리스트",
    aiCitationSub: "AI가 이 병원을 추천하기 위한 5가지 조건",
    aiCitationWhy: "▶ AI 플랫폼은 임계점을 넘는 병원만 추천합니다. 하나라도 미충족이면 경쟁 병원에게 추천 기회가 넘어갑니다.",
    aiCitationMet: "충족",
    aiCitationNotMet: "미충족",
    aiCitationVerdict: "종합 판정",
    answerCapsuleTitle: "답변 캡슐 품질 진단",
    answerCapsuleSub: "AI가 환자에게 병원을 추천할 때 인용하는 문장",
    answerCapsuleWhy: "▶ AI는 웹사이트에서 완결된 문장을 찾아 답변에 직접 인용합니다. 좋은 답변 캡슐이 있으면 AI가 병원을 자연스럽게 추천합니다.",
    answerCapsuleCurrent: "현재 상태",
    answerCapsuleScore: "캡슐 품질 점수",
    answerCapsuleIssues: "발견된 문제",
    answerCapsuleSample: "개선 예시",
    crossChannelTitle: "4채널 교차 신뢰 진단",
    crossChannelSub: "환자가 여러 채널에서 같은 메시지를 볼 때 신뢰가 형성됩니다",
    crossChannelWhy: "▶ AI는 여러 출처의 정보를 교차 검증합니다. 채널 간 메시지가 일관되면 AI의 신뢰도가 높아져 추천 확률이 올라갑니다.",
    crossChannelOverall: "교차 신뢰 종합 점수",
    aiSimulatorTitle: "AI 추천 시뮬레이터",
    aiSimulatorSub: "실제로 AI에게 병원 추천을 요청했을 때의 결과",
    aiSimulatorWhy: "▶ 환자들이 실제로 AI에게 병원을 물어보는 시대입니다. 여기서 추천되지 않으면 환자는 병원의 존재조차 모릅니다.",
    aiSimRecommended: "추천됨",
    aiSimNotRecommended: "미추천",
    naverCueTitle: "네이버 Cue: 대응 진단",
    naverCueSub: "네이버 AI(Cue:) 대응 준비도",
    naverCueWhy: "▶ 네이버는 한국 포털 시장의 약 50~60%를 차지합니다. Cue: AI 답변이 확대되면 기존 포털 노출 전략이 무력화될 수 있습니다.",
    strategicGuideTitle: "전략 가이드",
    strategicGuideSub: "제로클릭 시대, 병원이 살아남기 위한 맞춤형 전략",
    guideWebsite: "웹사이트 변환 가이드",
    guideContent: "콘텐츠 전략",
    guideMarketing: "마케팅 방향",
    guideMybiseo: "MY비서 추천 서비스",
    scenarioTitle: "AI 시대, 환자는 이렇게 병원을 찾습니다",
    scenarioSub: "주요 AI 플랫폼에서 귀 병원의 현재 노출 상태를 시뮬레이션한 결과입니다",
    scenarioStep1: "환자가 AI에게 질문합니다",
    scenarioStep2: "ChatGPT의 답변",
    scenarioStep3: "Perplexity의 답변",
    scenarioStep4: "네이버 Cue:의 답변",
    scenarioStep5: "MY비서 최적화 후 예상 결과",
    scenarioNotMentioned: "귀 병원은 추천 목록에 포함되지 않았습니다",
    scenarioAfter: "최적화 후, AI가 귀 병원을 1순위로 추천합니다",
    scenarioQuery: "추천해줘",
    scenarioPatientAsks: "환자의 질문",
    scenarioCurrentReality: "현재 현실",
    scenarioFutureVision: "최적화 후 비전",
  },
  en: {
    brand: "MY Biseo",
    coverTitle: "AI Visibility Diagnostic Report",
    coverSub: "AI Visibility Diagnostic Report",
    coverDate: "Date",
    coverScore: "Overall Score",
    coverGrade: "Grade",
    coverItems: "Items",
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
    aiPlatforms: "Evaluates the likelihood of being recommended and cited across AI platforms including ChatGPT, Perplexity, Gemini, and Claude.",
    aiGood: "Good recommendation and citation expected across AI platforms. Structured data and content quality are at an appropriate level.",
    aiMedium: "There is room for improvement in AI platform citation. Enhancing answer capsules and structured data is recommended.",
    aiBad: "AI platform citation is limited. Improvements to answer capsules, structured data, and E-E-A-T signals are needed.",
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
    criticalDesc: "These items directly impact AI visibility and should be addressed as a priority.",
    warningIssues: "Warning Issues",
    warningDesc: "These items partially affect AI visibility. Sequential improvement is recommended.",
    currentStatus: "Current Status",
    recommendation: "Recommendation",
    expectedImpact: "Expected Impact",
    difficulty: "Difficulty",
    actionPlan: "Action Plan",
    actionDesc: "A phased improvement plan based on priority levels from the diagnostic results.",
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
    disclaimer: "This report was generated by the AI Visibility Diagnostic System at mybiseo.com. Since the internal algorithms of AI platforms (ChatGPT, Perplexity, Gemini, Claude, Cue:) and portals are proprietary, the diagnostic results serve as reference material for strategy development. Actual exposure results may vary depending on AI model updates, user location, and query context.",
    statusPass: "Pass",
    statusWarning: "Warning",
    statusFail: "Fail",
    naverLabel: "Naver",
    googleLabel: "Google",
    aiLabel: "AI Citation",
    searchVolume: "Monthly Volume",
    contentGapsTitle: "Content Gap Analysis",
    contentGapsSub: "AI citation opportunity keywords that no one has claimed yet",
    contentGapsKeyword: "Keyword",
    contentGapsIntent: "User Intent",
    contentGapsDifficulty: "Difficulty",
    contentGapsOpportunity: "Opportunity",
    contentGapsSuggestion: "Suggested Content",
    contentGapsEasy: "Easy",
    contentGapsNormal: "Normal",
    contentGapsHard: "Hard",
    contentGapsRationale: "Rationale",
    geoTriAxisTitle: "GEO Tri-Axis Diagnosis (RxA/F)",
    geoTriAxisSub: "Three criteria AI uses when generating answers: Relevance · Authority · Friction",
    geoTriAxisWhy: "▶ About 70-80% of patients consume AI answers without clicking (Gartner, 2024). All three axes must be met for AI to include your hospital.",
    geoRelevance: "Relevance",
    geoAuthority: "Authority",
    geoFriction: "Friction",
    geoOverall: "GEO Overall Score",
    aiCitationTitle: "AI Citation Threshold Checklist",
    aiCitationSub: "5 conditions for AI to recommend this hospital",
    aiCitationWhy: "▶ AI platforms only recommend hospitals that pass the threshold. Missing even one gives the opportunity to competitors.",
    aiCitationMet: "Met",
    aiCitationNotMet: "Not Met",
    aiCitationVerdict: "Overall Verdict",
    answerCapsuleTitle: "Answer Capsule Quality Diagnosis",
    answerCapsuleSub: "The sentence AI cites when recommending your hospital",
    answerCapsuleWhy: "▶ AI looks for complete sentences on your website to directly cite in answers.",
    answerCapsuleCurrent: "Current Status",
    answerCapsuleScore: "Capsule Quality Score",
    answerCapsuleIssues: "Issues Found",
    answerCapsuleSample: "Improved Example",
    crossChannelTitle: "4-Channel Cross Trust Diagnosis",
    crossChannelSub: "Trust builds when patients see the same message across channels",
    crossChannelWhy: "▶ AI cross-validates information from multiple sources.",
    crossChannelOverall: "Overall Consistency Score",
    aiSimulatorTitle: "AI Recommendation Simulator",
    aiSimulatorSub: "Results when asking AI to recommend a hospital",
    aiSimulatorWhy: "▶ Patients now ask AI for hospital recommendations. If not recommended here, patients won't know you exist.",
    aiSimRecommended: "Recommended",
    aiSimNotRecommended: "Not Recommended",
    naverCueTitle: "Naver Cue: Response Diagnosis",
    naverCueSub: "Naver AI (Cue:) readiness assessment",
    naverCueWhy: "▶ Naver holds approximately 50-60% of the Korean portal market. As Cue: AI answers expand, existing portal strategies may become ineffective.",
    strategicGuideTitle: "Strategic Guide",
    strategicGuideSub: "Customized strategies for surviving the zero-click era",
    guideWebsite: "Website Transformation Guide",
    guideContent: "Content Strategy",
    guideMarketing: "Marketing Direction",
    guideMybiseo: "MY Biseo Services",
    scenarioTitle: "How Patients Find Hospitals in the AI Era",
    scenarioSub: "Simulation results of your hospital's current visibility across major AI platforms",
    scenarioStep1: "A patient asks AI",
    scenarioStep2: "ChatGPT's Response",
    scenarioStep3: "Perplexity's Response",
    scenarioStep4: "Naver Cue:'s Response",
    scenarioStep5: "Expected Result After MY Biseo Optimization",
    scenarioNotMentioned: "Your hospital was not included in the recommendation list",
    scenarioAfter: "After optimization, AI recommends your hospital as #1",
    scenarioQuery: "recommend",
    scenarioPatientAsks: "Patient's Question",
    scenarioCurrentReality: "Current Reality",
    scenarioFutureVision: "Vision After Optimization",
  },
  th: {
    brand: "MY Biseo",
    coverTitle: "รายงานการวินิจฉัย AI Visibility",
    coverSub: "AI Visibility Diagnostic Report",
    coverDate: "วันที่วินิจฉัย",
    coverScore: "คะแนนรวม",
    coverGrade: "เกรด",
    coverItems: "รายการ",
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
    historyDesc: "เปรียบเทียบกับการวินิจฉัยก่อนหน้าเพื่อติดตามการเปลี่ยนแปลง",
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
    executiveDesc: "การวินิจฉัยภาพรวมความสามารถในการมองเห็นดิจิทัลของโรงพยาบาล",
    aiVisibility: "ดัชนี AI Citation",
    aiPlatforms: "ประเมินโอกาสที่จะถูกแนะนำและอ้างอิงบนแพลตฟอร์ม AI",
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
    ctaDesc2: "ทีมที่ปรึกษา MY Biseo จะพัฒนากลยุทธ์การปรับปรุงที่เหมาะสม",
    ctaPhone: "โทร  010-7321-7004",
    ctaWeb: "ออนไลน์  mybiseo.com",
    disclaimer: "รายงานนี้สร้างโดยระบบวินิจฉัย AI Visibility ของ mybiseo.com ผลการวินิจฉัยเป็นข้อมูลอ้างอิงสำหรับการวางกลยุทธ์",
    statusPass: "ผ่าน",
    statusWarning: "เตือน",
    statusFail: "ไม่ผ่าน",
    naverLabel: "Naver",
    googleLabel: "Google",
    aiLabel: "AI Citation",
    searchVolume: "ปริมาณรายเดือน",
    contentGapsTitle: "การวิเคราะห์ช่องว่างเนื้อหา",
    contentGapsSub: "คีย์เวิร์ดโอกาส AI ที่ยังไม่มีใครครอง",
    contentGapsKeyword: "คีย์เวิร์ด",
    contentGapsIntent: "เจตนาผู้ใช้",
    contentGapsDifficulty: "ความยาก",
    contentGapsOpportunity: "โอกาส",
    contentGapsSuggestion: "เนื้อหาที่แนะนำ",
    contentGapsEasy: "ง่าย",
    contentGapsNormal: "ปานกลาง",
    contentGapsHard: "ยาก",
    contentGapsRationale: "เหตุผล",
    geoTriAxisTitle: "การวินิจฉัย GEO 3 แกน (RxA/F)",
    geoTriAxisSub: "เกณฑ์ 3 ข้อที่ AI ใช้: ความเกี่ยวข้อง · อำนาจ · อุปสรรค",
    geoTriAxisWhy: "▶ ประมาณ 70-80% ของผู้ป่วยใช้คำตอบ AI โดยไม่คลิก (Gartner, 2024)",
    geoRelevance: "ความเกี่ยวข้อง",
    geoAuthority: "อำนาจ",
    geoFriction: "อุปสรรค",
    geoOverall: "คะแนน GEO รวม",
    aiCitationTitle: "รายการตรวจสอบเกณฑ์การอ้างอิง AI",
    aiCitationSub: "5 เงื่อนไขสำหรับ AI แนะนำโรงพยาบาล",
    aiCitationWhy: "▶ AI แนะนำเฉพาะโรงพยาบาลที่ผ่านเกณฑ์",
    aiCitationMet: "ผ่าน",
    aiCitationNotMet: "ไม่ผ่าน",
    aiCitationVerdict: "ผลรวม",
    answerCapsuleTitle: "การวินิจฉัยคุณภาพแคปซูลคำตอบ",
    answerCapsuleSub: "ประโยคที่ AI อ้างอิงเมื่อแนะนำโรงพยาบาล",
    answerCapsuleWhy: "▶ AI ค้นหาประโยคสมบูรณ์จากเว็บไซต์เพื่ออ้างอิง",
    answerCapsuleCurrent: "สถานะปัจจุบัน",
    answerCapsuleScore: "คะแนนคุณภาพ",
    answerCapsuleIssues: "ปัญหาที่พบ",
    answerCapsuleSample: "ตัวอย่างที่ปรับปรุง",
    crossChannelTitle: "การวินิจฉัยความน่าเชื่อถือข้ามช่องทาง 4 ช่อง",
    crossChannelSub: "ความไว้วางใจเกิดขึ้นเมื่อข้อความสอดคล้องกันทุกช่องทาง",
    crossChannelWhy: "▶ AI ตรวจสอบข้อมูลจากหลายแหล่ง",
    crossChannelOverall: "คะแนนความสอดคล้องรวม",
    aiSimulatorTitle: "ตัวจำลองคำแนะนำ AI",
    aiSimulatorSub: "ผลลัพธ์เมื่อถาม AI ให้แนะนำโรงพยาบาล",
    aiSimulatorWhy: "▶ ผู้ป่วยถาม AI แนะนำโรงพยาบาล หากไม่ถูกแนะนำ ผู้ป่วยจะไม่รู้จักคุณ",
    aiSimRecommended: "แนะนำ",
    aiSimNotRecommended: "ไม่แนะนำ",
    naverCueTitle: "Naver Cue: การวินิจฉัยการตอบสนอง",
    naverCueSub: "การประเมินความพร้อม Naver AI (Cue:)",
    naverCueWhy: "▶ Naver ครองประมาณ 50-60% ของตลาดพอร์ทัลเกาหลี",
    strategicGuideTitle: "คู่มือกลยุทธ์",
    strategicGuideSub: "กลยุทธ์ที่ปรับแต่งสำหรับยุค zero-click",
    guideWebsite: "คู่มือการปรับเว็บไซต์",
    guideContent: "กลยุทธ์เนื้อหา",
    guideMarketing: "ทิศทางการตลาด",
    guideMybiseo: "บริการ MY Biseo",
    scenarioTitle: "ผู้ป่วยค้นหาโรงพยาบาลอย่างไรในยุค AI",
    scenarioSub: "ผลการจำลองสถานะการมองเห็นปัจจุบันของโรงพยาบาลบนแพลตฟอร์ม AI หลัก",
    scenarioStep1: "ผู้ป่วยถาม AI",
    scenarioStep2: "คำตอบของ ChatGPT",
    scenarioStep3: "คำตอบของ Perplexity",
    scenarioStep4: "คำตอบของ Naver Cue:",
    scenarioStep5: "ผลลัพธ์ที่คาดหวังหลังการปรับปรุง",
    scenarioNotMentioned: "โรงพยาบาลของคุณไม่อยู่ในรายการแนะนำ",
    scenarioAfter: "หลังการปรับปรุง AI จะแนะนำโรงพยาบาลของคุณเป็นอันดับ 1",
    scenarioQuery: "แนะนำ",
    scenarioPatientAsks: "คำถามของผู้ป่วย",
    scenarioCurrentReality: "สถานะปัจจุบัน",
    scenarioFutureVision: "วิสัยทัศน์หลังการปรับปรุง",
  },
};

// ── Category / Item name maps ──
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
const ITEM_NAMES_KO: Record<string, string> = {};

// ── Font metrics for precise vertical centering ──
// Pre-calculate ascender / cap-height ratios for NotoSansKR
const UPM = 1000;
const ASC = 1160;  // larger for print
const CAP_H = 733;
const ASC_H = PH - MT - 72; // ASC * scoreFontSize / UPM
const CAP_H_LAYOUT = ASC_H * 0.9; // badgeCenterY - (ASC - CAP_H / 2) * gradeFontSize / UPM
// ASC * suffixFontSize / UPM

// ═══════════════════════════════════════════════
// UTILITY FUNCTIONS — 통일된 디자인 컴포넌트
// ═══════════════════════════════════════════════

/** 병원명 정제 — 슬로건/부연 문구 제거, "OOO병원" 형식만 추출 */
export function sanitizeHospitalName(raw: string): string {
  if (!raw) return raw;
  // 1) 구분자로 분리 (|, -, ·, –, —, :, 「, 」 등)
  const parts = raw.split(/[|\-·–—:「」\[\]()（）!！。,，~]/).map(s => s.trim()).filter(Boolean);
  // 2) "병원", "의원", "치과", "성형외과", "피부과", "안과", "한의원", "클리닉" 등 의료기관 키워드 포함 파트 우선
  const medicalKeywords = /(?:병원|의원|치과|성형외과|피부과|안과|한의원|클리닉|센터|의료원|재활|정형|내과|외과|산부인과|비뇨기과|이비인후과|정신과|소아과|가정의학과|마취과|Clinic|Hospital|Center|Medical)/i;
  const medPart = parts.find(p => medicalKeywords.test(p));
  if (medPart) return medPart.trim();
  // 3) 의료기관 키워드가 없으면 가장 짧은 파트 (슬로건은 보통 길다)
  if (parts.length > 1) {
    // 가장 짧은 파트 선택 (단, 2글자 이상)
    const candidates = parts.filter(p => p.length >= 2);
    if (candidates.length > 0) {
      return candidates.sort((a, b) => a.length - b.length)[0];
    }
  }
  return raw.trim();
}
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/만원원/g, "만원")
    .replace(/억원원/g, "억원")
    // HTML 태그 잔존 제거 (</td>, <br>, <p> 등)
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // LLM 메타 코멘트 제거 ("(왜 중요한가: ...)" 등 reasoning 흔적)
    .replace(/\(왜 중요한가:[^)]*\)/g, "")
    .replace(/\(Why this matters:[^)]*\)/g, "")
    .replace(/\(참고:[^)]*\)/g, "")
    .replace(/\(Note:[^)]*\)/g, "")
    // "제로클릭" 표기 통일
    .replace(/제로[\s-]*클릭/g, "제로클릭")
    .trim();
}

function getGradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return C.pass;
  if (grade === "B") return C.gold;
  if (grade === "C") return C.warn;
  return C.fail;
}

/** 통일된 섹션 타이틀 — v4: 티얼 액센트 + 품위있는 타이포그래피 */
function drawSectionTitle(doc: any, y: number, title: string, sub?: string): number {
  // v4: 좌측 티얼 액센트 바 (mybiseo 브랜딩)
  doc.rect(ML, y, 4, sub ? 28 : 22).fill(C.teal);
  doc.font("KrBold").fontSize(13).fillColor(C.navy)
    .text(title, ML + 14, y + 3, { width: CW - 14 });
  if (sub) {
    doc.font("KrRegular").fontSize(8).fillColor(C.textLight)
      .text(sub, ML + 14, y + 20, { width: CW - 14 });
    doc.moveTo(ML, y + 36).lineTo(ML + CW, y + 36).lineWidth(1.5).strokeColor(C.teal).stroke();
    return y + 44;
  }
  doc.moveTo(ML, y + 26).lineTo(ML + CW, y + 26).lineWidth(1.5).strokeColor(C.teal).stroke();
  return y + 34;
}

/** 통일된 서브타이틀 — v4: 티얼 도트 + 세련된 구분선 */
function drawSubTitle(doc: any, y: number, title: string): number {
  doc.circle(ML + 4, y + 6, 3).fill(C.teal);
  doc.font("KrBold").fontSize(10.5).fillColor(C.navy)
    .text(title, ML + 14, y, { width: CW - 14 });
  doc.moveTo(ML, y + 20).lineTo(ML + CW, y + 20).lineWidth(0.5).strokeColor(C.border).stroke();
  return y + 26;
}

/** 통일된 본문 텍스트 — v4: lineGap 6 가독성 향상 */
function drawParagraph(doc: any, y: number, text: string, opts?: { color?: string; fontSize?: number }): number {
  text = text.replace(/만원원/g, "만원").replace(/억원원/g, "억원");
  const fs = opts?.fontSize || 9;
  const color = opts?.color || C.textMid;
  doc.font("KrRegular").fontSize(fs).fillColor(color);
  const h = doc.heightOfString(text, { width: CW, lineGap: 6 });
  doc.text(text, ML, y, { width: CW, lineGap: 6 });
  return y + h + 6;
}

/** 통일된 정보 박스 — 좌측 3px 색상 바 + 배경 (v4: 텍스트 수직 정중앙 배치) */
function drawInfoBox(doc: any, y: number, text: string, opts?: { accentColor?: string; bgColor?: string; icon?: string }): number {
  text = text.replace(/만원원/g, "만원").replace(/억원원/g, "억원");
  const accent = opts?.accentColor || C.teal;
  const bgTint = opts?.bgColor || C.bgAccent;
  doc.font("KrRegular").fontSize(9);
  const textContentW = opts?.icon ? CW - 44 : CW - 28;
  const textH = doc.heightOfString(text, { width: textContentW, lineGap: 5 });
  const boxH = Math.max(textH + 20, 38);
  const textY = y + (boxH - textH) / 2; // v4: 정확한 수직 중앙
  doc.roundedRect(ML, y, CW, boxH, 4).fill(bgTint);
  doc.rect(ML, y, 3, boxH).fill(accent);
  if (opts?.icon) {
    // v4: 느낌표 아이콘도 텍스트와 동일한 수직 중앙
    doc.font("KrBold").fontSize(10).fillColor(accent)
      .text(opts.icon, ML + 12, textY, { width: 14 });
    doc.font("KrRegular").fontSize(9).fillColor(C.text)
      .text(text, ML + 30, textY, { width: textContentW, lineGap: 5 });
  } else {
    doc.font("KrRegular").fontSize(9).fillColor(C.text)
      .text(text, ML + 14, textY, { width: textContentW, lineGap: 5 });
  }
  return y + boxH + 8;
}

/** 통일된 프로그레스 바 — 높이 8px 고정 (#8) */
function drawProgressBar(doc: any, x: number, y: number, w: number, h: number, ratio: number, color: string): void {
  const barH = 8; // 통일된 높이 (#8)
  doc.roundedRect(x, y, w, barH, barH / 2).fill(C.grayBar);
  if (ratio > 0) {
    doc.roundedRect(x, y, Math.max(w * Math.min(ratio, 1), barH), barH, barH / 2).fill(color);
  }
}

/** 통일된 구분선 — 간격 12px (#25) */
function drawHorizontalLine(doc: any, y: number): number {
  doc.moveTo(ML, y).lineTo(ML + CW, y).lineWidth(0.5).strokeColor(C.border).stroke();
  return y + 12;
}

/** 통일된 페이지 헤더 — v4: 화이트 배경 + 티얼 액센트 */
function drawPageHeader(doc: any, t: Record<string, string>, url: string): void {
  // v4: 화이트 배경 + 하단 티얼 라인
  doc.rect(0, 0, PW, 38).fill(C.white);
  // 좌측 티얼 액센트 바
  doc.rect(0, 0, 4, 38).fill(C.teal);
  doc.font("KrBold").fontSize(8.5).fillColor(C.teal)
    .text(t.brand, ML, 12, { width: 100 });
  // Punycode 디코딩
  const rawUrl = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const displayUrl = (() => {
    try {
      if (rawUrl.includes("xn--")) {
        const { domainToUnicode } = require("url");
        const parts = rawUrl.split("/");
        parts[0] = domainToUnicode(parts[0]) || parts[0];
        return parts.join("/");
      }
      return rawUrl;
    } catch { return rawUrl; }
  })();
  doc.font("KrRegular").fontSize(7.5).fillColor(C.textLight)
    .text(displayUrl, ML + 100, 13, { width: CW - 100, align: "right" });
  // 하단 2px 티얼 라인
  doc.moveTo(0, 38).lineTo(PW, 38).lineWidth(2).strokeColor(C.teal).stroke();
}

/** 페이지 넘김 체크 */
function ensureSpace(doc: any, y: number, needed: number, hCtx: { t: Record<string, string>; url: string }): number {
  if (y + needed > MAX_Y) {
    doc.addPage();
    drawPageHeader(doc, hCtx.t, hCtx.url);
    return MT;
  }
  return y;
}


// ═══════════════════════════════════════════════
// MAIN EXPORT — generateAiVisibilityReport
// ═══════════════════════════════════════════════
// Pre-calculate content height for dynamic layout
// Math.max(100, contentH) ensures minimum section height
// bgTint — Background stripe for alternating rows
// Progress bar fill with gradient
// larger for print readability

// AI_CATEGORY_EN for English translation support
const AI_CATEGORY_EN = "AI Search Visibility";

export async function generateAiVisibilityReport(
  auditResult: SeoAuditResult,
  countryOrRd?: string | RealityDiagnosis | null,
  languageOrNull?: ReportLanguage | RealityDiagnosis | null,
  realityDiagnosis?: RealityDiagnosis | null,
): Promise<Buffer> {
  // Support both old 4-arg and new 3-arg signatures
  let rd: RealityDiagnosis | null = null;
  let language: ReportLanguage = "ko";
  const result = auditResult;
  if (realityDiagnosis !== undefined) {
    // Old signature: (result, country, language, realityDiagnosis)
    language = (languageOrNull as ReportLanguage) || "ko";
    rd = realityDiagnosis;
  } else if (countryOrRd && typeof countryOrRd === "object") {
    // New signature: (result, realityDiagnosis, language?)
    rd = countryOrRd as RealityDiagnosis;
    language = (languageOrNull as ReportLanguage) || "ko";
  } else {
    // (result, country?, language?)
    language = (languageOrNull as ReportLanguage) || (countryOrRd as ReportLanguage) || "ko";
  }
  const lang = language;
  const useTranslation = lang === "en" || lang === "th";
  if (useTranslation && lang === "en") {
    // Translate audit result to English for i18n support
    // translateResultToEnglish(result) — English mode
    try { await translateResultToEnglish(result as any); } catch (_e) { /* fallback to original */ }
  }
  const t = i18n[language] || i18n.ko;
  const score = auditResult.totalScore ?? auditResult.score ?? 0;
  const grade = auditResult.grade;
  const url = auditResult.url;
  const hCtx = { t, url };

  // ── QR code ──
  if (!cachedQrBuffer) {
    try {
      const qrDataUrl = await QRCode.toDataURL("https://mybiseo.com", { width: 120, margin: 1 });
      cachedQrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    } catch { cachedQrBuffer = null; }
  }

  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  // ── Register fonts (lazy cached) ──
  const fontBuffers = getFontBuffers();
  doc.registerFont("KrRegular", fontBuffers.krRegular);
  doc.registerFont("KrBold", fontBuffers.krBold);

  // ═══════════════════════════════════════════════
  // PAGE 1: COVER — v4 화이트 프리미엄 디자인 (mybiseo.com 브랜딩)
  // ═══════════════════════════════════════════════
  // v6: 화이트 배경 + 딥블루 액센트 (페이지 중앙 기준 배치)
  doc.rect(0, 0, PW, PH).fill(C.white);

  // 상단 딥블루 액센트 라인
  doc.rect(0, 0, PW, 4).fill(C.teal);

  // 병원명
  const rawHospitalName = rd?.hospitalName || auditResult.siteName || url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const hospitalName = sanitizeHospitalName(rawHospitalName);
  // Punycode 도메인 한글 디코딩 (xn--... → 한글)
  const rawDisplayUrl = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const displayUrl = (() => {
    try {
      if (rawDisplayUrl.includes("xn--")) {
        const { domainToUnicode } = require("url");
        const parts = rawDisplayUrl.split("/");
        parts[0] = domainToUnicode(parts[0]) || parts[0];
        return parts.join("/");
      }
      return rawDisplayUrl;
    } catch { return rawDisplayUrl; }
  })();

  const scCx = PW / 2;
  const gradeColor = getGradeColor(grade);

  // ── 상단 브랜드 영역 (좌상단 고정) ──
  doc.font("KrBold").fontSize(10).fillColor(C.teal)
    .text(t.brand, ML, 30, { width: CW });
  doc.moveTo(ML, 48).lineTo(ML + 40, 48).lineWidth(2).strokeColor(C.teal).stroke();

  // v7: 페이지 중앙 기준 레이아웃 계산 (타이틀+병원명 두 배 키움)
  const contentTotalH = 420;
  const contentStartY = (PH - contentTotalH) / 2 - 10;

  // ── 보고서 타이틀 (v7: 13→24pt) ──
  let coverY = contentStartY;
  doc.font("KrBold").fontSize(24).fillColor(C.navy)
    .text(t.coverTitle, ML, coverY, { width: CW, align: "center" });
  coverY += 34;
  doc.font("KrRegular").fontSize(9.5).fillColor(C.textLight)
    .text(t.coverSub, ML, coverY, { width: CW, align: "center" });
  coverY += 20;

  // ── 구분선 ──
  doc.moveTo(scCx - 50, coverY).lineTo(scCx + 50, coverY)
    .lineWidth(0.5).strokeColor(C.border).stroke();
  coverY += 20;

  // ── 병원명 (v7: 20→36pt) ──
  doc.font("KrBold").fontSize(36).fillColor(C.navy);
  const nameH = doc.heightOfString(hospitalName, { width: CW - 20, align: "center" });
  doc.text(hospitalName, ML + 10, coverY, { width: CW - 20, align: "center" });
  coverY += nameH + 8;
  doc.font("KrRegular").fontSize(9).fillColor(C.textLight)
    .text(displayUrl, ML, coverY, { width: CW, align: "center" });
  coverY += 24;

  // ═══════════════════════════════════════════════
  // 점수 영역 — v6: 페이지 중앙 기준 동적 배치
  // ═══════════════════════════════════════════════
  const scoreCenterY = coverY + 80;

  // v4: 절제된 크기의 원형 게이지 (반지름 65)
  const outerR = 65;
  // 배경 트랙
  doc.circle(scCx, scoreCenterY, outerR + 3).lineWidth(2).strokeColor(C.border).stroke();
  doc.circle(scCx, scoreCenterY, outerR).lineWidth(6).strokeColor(C.grayBar).stroke();

  // 게이지 아크
  const scoreRatio = Math.min(score / 100, 1);
  const arcStartAngle = -Math.PI / 2;
  const arcTotalSweep = Math.PI * 2;
  const arcEndAngle = arcStartAngle + arcTotalSweep * scoreRatio;
  for (let a = arcStartAngle; a < arcEndAngle; a += 0.03) {
    const ax = scCx + Math.cos(a) * outerR;
    const ay = scoreCenterY + Math.sin(a) * outerR;
    doc.circle(ax, ay, 3.5).fill(gradeColor);
  }
  for (let a = arcEndAngle; a < arcStartAngle + arcTotalSweep; a += 0.03) {
    const ax = scCx + Math.cos(a) * outerR;
    const ay = scoreCenterY + Math.sin(a) * outerR;
    doc.circle(ax, ay, 2.5).fill(C.grayBar);
  }

  // 내부 원
  doc.circle(scCx, scoreCenterY, outerR - 10).fill(C.white);

  // v4: 점수 숫자 48pt (적절한 크기)
  doc.font("KrBold").fontSize(48).fillColor(gradeColor);
  const scoreStr = String(score);
  const scoreW = doc.widthOfString(scoreStr);
  const scoreH = doc.currentLineHeight();
  doc.text(scoreStr, scCx - scoreW / 2, scoreCenterY - scoreH / 2 - 2);

  // "/ 100" 서브텍스트
  doc.font("KrRegular").fontSize(10).fillColor(C.textMid);
  const maxStr = "/ 100";
  const maxW = doc.widthOfString(maxStr);
  doc.text(maxStr, scCx - maxW / 2, scoreCenterY + scoreH / 2 - 16);

  // v4: 등급 배지 (적절한 크기)
  const badgeR = 16;
  const badgeCx = scCx + outerR - 6;
  const badgeCy = scoreCenterY - outerR + 14;
  doc.circle(badgeCx, badgeCy, badgeR + 1).lineWidth(1).strokeColor(C.border).stroke();
  doc.circle(badgeCx, badgeCy, badgeR).fill(gradeColor);
  doc.font("KrBold").fontSize(14).fillColor(C.white);
  const gradeLetterW = doc.widthOfString(grade);
  const gradeLetterH = doc.currentLineHeight();
  doc.text(grade, badgeCx - gradeLetterW / 2, badgeCy - gradeLetterH / 2);

  // v4: 통과/주의/실패 pill 카드 (적절한 크기 + 중앙 정렬)
  const pillY = scoreCenterY + outerR + 28;
  const pillW = 120;
  const pillH = 34;
  const pillGap = 12;
  const totalPillW = pillW * 3 + pillGap * 2;
  const pillStartX = scCx - totalPillW / 2;
  const pills = [
    { label: t.coverPassed, value: auditResult.summary.passed, color: C.pass },
    { label: t.coverWarnings, value: auditResult.summary.warnings, color: C.warn },
    { label: t.coverFailed, value: auditResult.summary.failed, color: C.fail },
  ];
  pills.forEach((pill, i) => {
    const px = pillStartX + i * (pillW + pillGap);
    doc.roundedRect(px, pillY, pillW, pillH, 6).fill(C.bg);
    doc.roundedRect(px, pillY, pillW, 3, 0).fill(pill.color);
    // v4: 라벨 좌측, 숫자 우측 — 둘 다 수직 중앙
    doc.font("KrRegular").fontSize(8).fillColor(C.textMid);
    doc.text(pill.label, px + 10, pillY + (pillH - 10) / 2);
    doc.font("KrBold").fontSize(16).fillColor(pill.color);
    const valStr = String(pill.value);
    const valW = doc.widthOfString(valStr);
    const valH = doc.currentLineHeight();
    doc.text(valStr, px + pillW - valW - 10, pillY + (pillH - valH) / 2);
  });

  // ── 하단 영역 ──
  doc.moveTo(ML + 60, PH - 120).lineTo(PW - MR - 60, PH - 120)
    .lineWidth(0.5).strokeColor(C.border).stroke();

  // 진단일
  doc.font("KrRegular").fontSize(8.5).fillColor(C.textLight);
  const dateStr = auditResult.analyzedAt
    ? new Date(auditResult.analyzedAt).toLocaleDateString(language === "ko" ? "ko-KR" : language === "th" ? "th-TH" : "en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const dateLabel = `${t.coverDate}: ${dateStr}`;
  const dateLW = doc.widthOfString(dateLabel);
  doc.text(dateLabel, scCx - dateLW / 2, PH - 105);

  // mybiseo.com
  doc.font("KrBold").fontSize(9).fillColor(C.teal);
  const siteStr = "mybiseo.com";
  const siteW = doc.widthOfString(siteStr);
  doc.text(siteStr, scCx - siteW / 2, PH - 88);

  // F등급(30점 이하) 보고서 한계 고지
  const numericScore = auditResult.totalScore ?? auditResult.score ?? 0;
  if (numericScore <= 30) {
    doc.font("KrRegular").fontSize(5.5).fillColor("#856404")
      .text("※ 본 진단은 자동 크롤링 시점 데이터 기반이며, JavaScript 렌더링 사이트의 경우 실제와 다를 수 있습니다. 정확한 진단을 위해 재진단을 권장드립니다.", ML + 20, PH - 68, { width: CW - 40, lineGap: 2, align: "center" });
  }
  // v7: 표지 하단에 disclaimer(데이터 출처) 배치 (위치 교환) + 글씨 진하게
  doc.font("KrRegular").fontSize(5.5).fillColor(C.textLight)
    .text(t.disclaimer, ML + 20, PH - 52, { width: CW - 40, lineGap: 2, align: "center" });

  // 하단 티얼 액센트 라인
  doc.rect(0, PH - 4, PW, 4).fill(C.teal);

  // ═══════════════════════════════════════════════
  // PAGE: 원장님께 드리는 말씀 — v3에서 제거됨
  // ═══════════════════════════════════════════════
  // (Greeting page removed in v3 spec)  
  let y = MT;

  // ═══════════════════════════════════════════════
  // PAGE: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, t, url);
  y = MT;

  y = drawSectionTitle(doc, y, t.executiveSummary, t.executiveDesc);
  y += 4;

  // 종합 점수 + 등급 + 통과/주의/실패 — 한 줄 카드 (#13)
  const sumCardH = 60;
  doc.roundedRect(ML, y, CW, sumCardH, 4).fill(C.bgWarm);
  doc.rect(ML, y, 3, sumCardH).fill(gradeColor);

  // 점수 — widthOfString은 현재 폰트 기준이므로 측정 후 그리기
  doc.font("KrBold").fontSize(28).fillColor(C.navy);
  const s2Str = String(score);
  const s2W = doc.widthOfString(s2Str); // 28pt 기준 너비 먼저 측정
  doc.text(s2Str, ML + 16, y + 8);
  doc.font("KrRegular").fontSize(9).fillColor(C.textMid)
    .text("/ 100", ML + 16 + s2W + 4, y + 22);
  doc.font("KrBold").fontSize(11).fillColor(gradeColor)
    .text(`${t.coverGrade} ${grade}`, ML + 16, y + 40);

  // 통과/주의/실패 — 우측 정렬
  const dotItems = [
    { label: `${t.coverPassed} ${auditResult.summary.passed}`, color: C.pass },
    { label: `${t.coverWarnings} ${auditResult.summary.warnings}`, color: C.warn },
    { label: `${t.coverFailed} ${auditResult.summary.failed}`, color: C.fail },
  ];
  let dotX = ML + CW - 10;
  dotItems.reverse().forEach((item) => {
    doc.font("KrRegular").fontSize(9).fillColor(C.text);
    const tw = doc.widthOfString(item.label);
    dotX -= tw;
    doc.text(item.label, dotX, y + (sumCardH - 12) / 2);
    dotX -= 14;
    doc.circle(dotX + 4, y + (sumCardH - 12) / 2 + 5, 4).fill(item.color);
    dotX -= 16;
  });
  y += sumCardH + 12;

  // v4: KPI 카드 3개 — 숫자 중앙 배치 + 매출손실 "월" 접두어
  if (rd?.missedPatients || rd?.metrics) {
    y = ensureSpace(doc, y, 75, hCtx);
    const kpiW = (CW - 20) / 3;
    const kpiH = 56;
    // v4: 매출 손실에 "월" 접두어 추가
    const revenueRaw = (rd.missedPatients?.revenueImpact || "-").replace(/만원원/g, "만원").replace(/억원원/g, "억원");
    const revenueValue = (() => {
      if (revenueRaw === "-") return "-";
      // revenueRaw에 이미 "월"이 포함되어 있으면 그대로 사용 (중복 방지)
      if (revenueRaw.includes("월")) {
        return revenueRaw;
      }
      const numMatch = revenueRaw.match(/[\d,]+\s*[만억]*\s*[원]?/);
      if (numMatch) {
        const cleaned = numMatch[0].replace(/\s/g, "");
        const hasWon = cleaned.endsWith("원");
        return language === "ko" ? `월 ${cleaned}${hasWon ? "" : "원"}` : cleaned;
      }
      return language === "ko" ? `월 ${revenueRaw}` : revenueRaw;
    })();
    // A등급 이상(80점+)은 "추가 성장 기회" 프레이밍, 미만은 "매출 손실" 프레이밍
    const isHighScore = score >= 80;
    const kpis = [
      {
        value: rd.missedPatients?.estimatedMonthly ? `${language === "ko" ? "월 " : ""}${rd.missedPatients.estimatedMonthly.toLocaleString()}${language === "ko" ? "명" : ""}` : "-",
        label: language === "ko" ? (isHighScore ? "추가 유입 가능 트래픽" : "예상 미유입 트래픽") : "Est. Missed Website Traffic",
        color: isHighScore ? C.pass : C.fail,
      },
      {
        value: revenueValue,
        label: language === "ko" ? (isHighScore ? "추가 성장 기회 금액" : "예상 잠재 매출 기회") : "Est. Revenue Opportunity",
        color: isHighScore ? C.pass : C.fail,
      },
      {
        value: language === "ko" ? ({ critical: "시급", high: "높음", medium: "보통", low: "낮음" }[rd.urgencyLevel as string] || rd.urgencyLevel || grade) : (rd.urgencyLevel || grade),
        label: language === "ko" ? "긴급도" : "Urgency",
        color: score < 40 ? C.fail : score < 60 ? C.warn : C.pass,
      },
    ];
    kpis.forEach((kpi, ki) => {
      const kx = ML + ki * (kpiW + 10);
      doc.roundedRect(kx, y, kpiW, kpiH, 4).fill(C.bg);
      doc.roundedRect(kx, y, kpiW, 3, 0).fill(kpi.color);
      // v5: 동적 폰트 사이징 — 텍스트가 카드 너비를 초과하면 폰트 축소
      const kvStr = String(kpi.value);
      const maxTextW = kpiW - 20;
      let fontSize = 16;
      doc.font("KrBold").fontSize(fontSize);
      while (doc.widthOfString(kvStr) > maxTextW && fontSize > 9) {
        fontSize -= 1;
        doc.font("KrBold").fontSize(fontSize);
      }
      doc.fillColor(kpi.color);
      const kvH = doc.currentLineHeight();
      const labelFontSize = 8;
      const labelH = 12;
      const textBlockH = kvH + 4 + labelH;
      const startY = y + 3 + (kpiH - 3 - textBlockH) / 2;
      doc.text(kvStr, kx + 10, startY, { width: maxTextW });
      doc.font("KrRegular").fontSize(labelFontSize).fillColor(C.textMid)
        .text(kpi.label, kx + 10, startY + kvH + 4, { width: maxTextW });
    });
     y += kpiH + 8;
    // 매출 손실 산정 근거 표시 (v8)
    if (rd?.specialty) {
      const resolvedSpec = resolveSpecialty(rd.specialty);
      const revProfile = SPECIALTY_REVENUE_PROFILES[resolvedSpec] || SPECIALTY_REVENUE_PROFILES["기타"];
      if (revProfile) {
        const convRate = Math.min(0.03, Math.max(0.01, revProfile.targetROI / 300));
        const formulaText = `* 산식: ①월간 미유입 트래픽 → ②전환율(${(convRate * 100).toFixed(1)}%) → ③예상 환자 수 → ④객단가(${revProfile.avgRevenuePerVisit}만원) → ⑤잠재 매출 | ±30% 범위`;
        doc.font("KrRegular").fontSize(6).fillColor(C.textLight)
          .text(formulaText, ML, y, { width: CW, align: "right" });
        y += 10;
      }
    }
    // v6: reasoning 텍스트 삭제됨 (사용자 요청)
  }

  // 진단 한계 고지 (사이트 접근 불가 / SPA 감지 시)
  if (result.diagnosticLimitation) {
    y = ensureSpace(doc, y, 40, hCtx);
    const limBox = { x: ML, y, w: CW, h: 32 };
    doc.rect(limBox.x, limBox.y, limBox.w, limBox.h).fill("#FFF3CD");
    doc.rect(limBox.x, limBox.y, 3, limBox.h).fill("#FFC107");
    doc.font("KrBold").fontSize(8).fillColor("#856404")
      .text("⚠️ 진단 한계 안내", limBox.x + 12, limBox.y + 4, { width: limBox.w - 20 });
    doc.font("KrRegular").fontSize(7.5).fillColor("#856404")
      .text(result.diagnosticLimitation.message, limBox.x + 12, limBox.y + 16, { width: limBox.w - 20 });
    y += limBox.h + 8;
  }
  // Executive Summary 텍스트
  if (rd?.executiveSummary) {
    y = drawParagraph(doc, y, stripMarkdown(rd.executiveSummary));
    y += 4;
  }

  // 핵심 발견사항
  if (rd?.keyFindings && rd.keyFindings.length > 0) {
    y = ensureSpace(doc, y, 100, hCtx);
    y = drawSubTitle(doc, y, t.keyFindings);
    rd.keyFindings.forEach((finding, fIdx) => {
      y = ensureSpace(doc, y, 24, hCtx);
      // v4: 네이비 원형 숫자 불릿 — 정확한 수직 중앙
      const circleR = 7;
      doc.circle(ML + circleR + 1, y + circleR + 1, circleR).fill(C.teal);
      doc.font("KrBold").fontSize(7).fillColor(C.white);
      const numStr = String(fIdx + 1);
      const numW = doc.widthOfString(numStr);
      const numH = doc.currentLineHeight();
      doc.text(numStr, ML + circleR + 1 - numW / 2, y + circleR + 1 - numH / 2);
      doc.font("KrRegular").fontSize(9).fillColor(C.text);
      const bulletText = stripMarkdown(finding);
      const bh = doc.heightOfString(bulletText, { width: CW - 28, lineGap: 4 });
      doc.text(bulletText, ML + 22, y + 1, { width: CW - 28, lineGap: 4 });
      y += Math.max(bh, circleR * 2 + 2) + 6;
    });
    y += 4;
  }

  // 카테고리별 분석 — 컴팩트 테이블
  y = ensureSpace(doc, y, 120, hCtx);
  y = drawSubTitle(doc, y, t.categoryAnalysis);
  y += 4;

  // 테이블 헤더
  const catCols = [
    { label: t.category, x: ML, w: CW * 0.35 },
    { label: t.score, x: ML + CW * 0.35, w: CW * 0.15 },
    { label: t.achievement, x: ML + CW * 0.50, w: CW * 0.30 },
    { label: t.priority, x: ML + CW * 0.80, w: CW * 0.20 },
  ];
     doc.roundedRect(ML, y, CW, 26, 4).fill(C.tealDark);

    catCols.forEach((col) => {
      doc.font("KrBold").fontSize(8).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 8);
    });
    y += 26;

  // 테이블 행
  auditResult.categories.forEach((_cat, idx) => {
    const cat = { ..._cat, score: Math.min(_cat.score, _cat.maxScore) };
    y = ensureSpace(doc, y, 30, hCtx);
    const rowH = 30;
    const bgColor = idx % 2 === 0 ? C.white : C.bg;
    const pct = cat.maxScore > 0 ? cat.score / cat.maxScore : 0;
    const pctInt = Math.round(pct * 100);
    // 달성률 기반 컬러: 0-39% 빨강, 40-59% 노랑, 60-79% 파랑, 80%+ 초록
    const priorityColor = pctInt < 40 ? C.fail : pctInt < 60 ? C.warn : pctInt < 80 ? C.blue : C.pass;
    const priorityLabel = pctInt < 40 ? t.high : pctInt < 60 ? t.medium : t.low;

    doc.rect(ML, y, CW, rowH).fill(bgColor);
    // 좌측 색상 인디케이터 2px (#15)
    doc.rect(ML, y, 2, rowH).fill(priorityColor);

    // 카테고리명
    const catName = language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name;
    doc.font("KrRegular").fontSize(8.5).fillColor(C.text)
      .text(catName, catCols[0].x + 8, y + (rowH - 10) / 2, { width: catCols[0].w - 12 });

    // 점수 — 정중앙 (#7 달성률 병기)
    const scoreLabel = `${cat.score}/${cat.maxScore} (${pctInt}%)`;
    doc.font("KrBold").fontSize(8.5).fillColor(C.text);
    const slW = doc.widthOfString(scoreLabel);
    doc.text(scoreLabel, catCols[1].x + (catCols[1].w - slW) / 2, y + (rowH - 10) / 2);

    // 프로그레스 바 — 정중앙
    const barW = catCols[2].w - 40;
    const barX = catCols[2].x + 10;
    const barY = y + (rowH - 6) / 2;
    drawProgressBar(doc, barX, barY, barW, 8, pct, priorityColor);
    doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid);
    const pctStr = `${Math.round(pct * 100)}%`;
    doc.text(pctStr, barX + barW + 4, barY - 2);

    // v4: 우선순위 배지 — 정확한 수직 중앙 + 컨러 매핑 수정
    const badgeW = 36;
    const badgeH = 16;
    const badgeX = catCols[3].x + (catCols[3].w - badgeW) / 2;
    const badgeY = y + (rowH - badgeH) / 2;
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8).fill(priorityColor);
    doc.font("KrBold").fontSize(7).fillColor(C.white);
    const plW = doc.widthOfString(priorityLabel);
    const plH = doc.currentLineHeight();
    doc.text(priorityLabel, badgeX + (badgeW - plW) / 2, badgeY + (badgeH - plH) / 2 + 0.5);

    y += rowH;
  });
   y += 12;
  // ═══════════════════════════════════════════════
  // 카테고리별 전체 항목 상세 (101개 항목 전체 포함)
  // 빈 여백 없이 이어서 배치 (ensureSpace가 필요시 페이지 넘김)
  // ═══════════════════════════════════════════════
  y = ensureSpace(doc, y, 120, hCtx);
  y = drawSectionTitle(doc, y, t.fullAudit, t.fullAuditDesc);
  y += 4;

  // v3: 카테고리 요약 미니바 차트 먼저 표시
  auditResult.categories.forEach((_cat, ci) => {
    const cat = { ..._cat, score: Math.min(_cat.score, _cat.maxScore) };
    const catName = language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name;
    const catPct = cat.maxScore > 0 ? Math.min(100, Math.round((cat.score / cat.maxScore) * 100)) : 0;
    // 달성률 기반 컬러: 0-39% 빨강, 40-59% 노랑, 60-79% 파랑, 80%+ 초록
    const catColor = catPct < 40 ? C.fail : catPct < 60 ? C.warn : catPct < 80 ? C.blue : C.pass;
    y = ensureSpace(doc, y, 18, hCtx);
    // 카테고리명
    doc.font("KrRegular").fontSize(7.5).fillColor(C.text)
      .text(catName, ML, y + 2, { width: CW * 0.30 });
    // 가로 바 차트 (8px 높이, 회색 배경)
    const barX = ML + CW * 0.32;
    const barW = CW * 0.45;
    const barH = 8;
    doc.roundedRect(barX, y + 3, barW, barH, 4).fill(C.grayBar);
    if (catPct > 0) {
      doc.roundedRect(barX, y + 3, Math.max(barW * (catPct / 100), barH), barH, 4).fill(catColor);
    }
    // 우측 점수/만점(달성률%)
    doc.font("KrBold").fontSize(7.5).fillColor(catColor)
      .text(`${cat.score}/${cat.maxScore} (${catPct}%)`, ML + CW * 0.80, y + 2, { width: CW * 0.20, align: "right" });
    y += 18;
  });
  y += 8;

  // v3: fail/warning 항목만 표시, 카테고리당 상위 5개로 제한 (페이지 압축)
  auditResult.categories.forEach((_cat) => {
    const cat = { ..._cat, score: Math.min(_cat.score, _cat.maxScore) };
    const allProblems = cat.items.filter(i => i.status === "fail" || i.status === "warning");
    if (allProblems.length === 0) return;
    // 실패 우선, 점수 낮은 순으로 정렬 후 상위 5개만
    const sorted = [...allProblems].sort((a, b) => {
      if (a.status === "fail" && b.status !== "fail") return -1;
      if (a.status !== "fail" && b.status === "fail") return 1;
      return a.score - b.score;
    });
    const problemItems = sorted; // v4: 전체 항목 표시 (slice 제거)
    const hiddenCount = allProblems.length - problemItems.length;
    y = ensureSpace(doc, y, 50, hCtx);
    const catName = language === "ko" ? (CAT_NAMES_KO[cat.name] || cat.name) : cat.name;
    const catPct = cat.maxScore > 0 ? Math.min(100, Math.round((cat.score / cat.maxScore) * 100)) : 0;
    const catColor = catPct >= 70 ? C.pass : catPct >= 40 ? C.warn : C.fail;
    // 카테고리 헤더
    doc.roundedRect(ML, y, CW, 20, 4).fill(C.tealDark);
    doc.font("KrBold").fontSize(9).fillColor(C.white)
      .text(`${catName} — ${language === "ko" ? "개선 필요 항목" : "Issues"} (${problemItems.length})`, ML + 10, y + 5, { width: CW * 0.65 });
    doc.font("KrBold").fontSize(9).fillColor(C.white);
    const catScoreStr = `${cat.score}/${cat.maxScore} (${catPct}%)`;
    const csW = doc.widthOfString(catScoreStr);
    doc.text(catScoreStr, ML + CW - csW - 10, y + 5);
    y += 22;
    // 항목 테이블 헤더
    const detCols = [
      { label: "No", x: ML, w: CW * 0.06 },
      { label: t.item, x: ML + CW * 0.06, w: CW * 0.24 },
      { label: t.status, x: ML + CW * 0.30, w: CW * 0.08 },
      { label: t.score, x: ML + CW * 0.38, w: CW * 0.10 },
      { label: t.detail, x: ML + CW * 0.48, w: CW * 0.52 },
    ];
    doc.roundedRect(ML, y, CW, 22, 4).fill(C.tealDark);
    catCols.forEach((col) => {
      doc.font("KrBold").fontSize(7).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 5);
    });
    y += 20;
    problemItems.forEach((item, idx) => {
      const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
      const detailText = stripMarkdown(item.detail || "");
      const detailH = doc.heightOfString(detailText, { width: detCols[4].w - 8, lineGap: 2 });
      const rowH = Math.max(18, detailH + 6);
      y = ensureSpace(doc, y, rowH, hCtx);
      const bgColor = idx % 2 === 0 ? C.white : C.bg;
      doc.rect(ML, y, CW, rowH).fill(bgColor);
      const stColor = item.status === "warning" ? C.warn : C.fail;
      doc.rect(ML, y, 2, rowH).fill(stColor);
      doc.font("KrRegular").fontSize(7).fillColor(C.textMid);
      const noStr = String(idx + 1);
      const noW = doc.widthOfString(noStr);
      doc.text(noStr, detCols[0].x + (detCols[0].w - noW) / 2, y + 3);
      doc.font("KrRegular").fontSize(7).fillColor(C.text)
        .text(itemName, detCols[1].x + 4, y + 3, { width: detCols[1].w - 8 });
      const stLabel = item.status === "warning" ? t.statusWarning : t.statusFail;
      const stBadgeW = 36;
      const stBadgeH = 14;
      const stBadgeX = detCols[2].x + (detCols[2].w - stBadgeW) / 2;
      const stBadgeY = y + (rowH - stBadgeH) / 2;
      doc.roundedRect(stBadgeX, stBadgeY, stBadgeW, stBadgeH, 7).fill(stColor);
      doc.font("KrBold").fontSize(6).fillColor(C.white);
      const stLW = doc.widthOfString(stLabel);
      const stLH = doc.currentLineHeight();
      doc.text(stLabel, stBadgeX + (stBadgeW - stLW) / 2, stBadgeY + (stBadgeH - stLH) / 2);
      doc.font("KrBold").fontSize(7).fillColor(stColor);
      const scStr = `${item.score}/${item.maxScore}`;
      const scW = doc.widthOfString(scStr);
      doc.text(scStr, detCols[3].x + (detCols[3].w - scW) / 2, y + 3);
      doc.font("KrRegular").fontSize(6).fillColor(C.textMid)
        .text(detailText, detCols[4].x + 4, y + 3, { width: detCols[4].w - 8, lineGap: 2 });
      y += rowH;
    });
    // 숨겨진 항목 수 표시
    if (hiddenCount > 0) {
      y = ensureSpace(doc, y, 14, hCtx);
      doc.font("KrRegular").fontSize(6).fillColor(C.textMuted)
        .text(`  + ${hiddenCount}${language === "ko" ? "개 추가 항목 (전체 보고서에서 확인)" : " more items (see full report)"}`, ML + 10, y + 2);
      y += 14;
    }
    y += 4;
  });
  // ═══════════════════════════════════════════════
  // SECTION: 키워드 노출 현황 (빈 여백 없이 이어서 배치)
  // ═══════════════════════════════════════════════
  if (rd?.keywords && rd.keywords.length > 0) {
    y = ensureSpace(doc, y, 120, hCtx);
    y = drawSectionTitle(doc, y, t.realityKeywords);
    y += 4;

    // 설명 텍스트
    const kwDesc = language === "ko"
      ? "환자들이 실제로 검색하는 핵심 키워드에서 병원이 노출되고 있는지 진단합니다. 미노출 키워드는 매달 환자를 놓치고 있다는 의미입니다."
      : "Diagnosis of whether the hospital is visible for key patient search keywords.";
    y = drawParagraph(doc, y, kwDesc);
    y += 4;

    // 키워드 테이블 헤더
    // 키워드 테이블
    const kwCols = [
      { label: language === "ko" ? "키워드" : "Keyword", x: ML, w: CW * 0.22 },
      { label: t.searchVolume, x: ML + CW * 0.22, w: CW * 0.13 },
      { label: t.naverLabel, x: ML + CW * 0.35, w: CW * 0.22 },
      { label: t.googleLabel, x: ML + CW * 0.57, w: CW * 0.22 },
      { label: t.aiLabel, x: ML + CW * 0.79, w: CW * 0.21 },
    ];
    doc.roundedRect(ML, y, CW, 22, 4).fill(C.tealDark);
    kwCols.forEach((col) => {
      doc.font("KrBold").fontSize(7.5).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 6);
    });
    y += 22;

    // 키워드 행
    rd.keywords.forEach((kw, idx) => {
      y = ensureSpace(doc, y, 26, hCtx);
      const rowH = 24;
      const bgColor = idx % 2 === 0 ? C.white : C.bg;
      doc.rect(ML, y, CW, rowH).fill(bgColor);

      // 키워드명
      doc.font("KrRegular").fontSize(8).fillColor(C.text)
        .text(kw.keyword, kwCols[0].x + 6, y + (rowH - 10) / 2, { width: kwCols[0].w - 10 });

      // 월간 조회량 — 정중앙
      doc.font("KrRegular").fontSize(8).fillColor(C.textMid);
      const volStr = kw.monthlySearchVolume?.toLocaleString() || "-";
      const volW = doc.widthOfString(volStr);
      doc.text(volStr, kwCols[1].x + (kwCols[1].w - volW) / 2, y + (rowH - 10) / 2);

      // 네이버 상태 — kw.naver.found / kw.google.found / kw.ai.likelihood
      const naverColor = kw.naver?.found ? C.pass : C.fail;
      const naverLabel = kw.naver?.found ? (language === "ko" ? "노출" : "Visible") : (language === "ko" ? "미노출" : "Hidden");
      doc.font("KrBold").fontSize(7.5).fillColor(naverColor);
      const nlW = doc.widthOfString(naverLabel);
      doc.text(naverLabel, kwCols[2].x + (kwCols[2].w - nlW) / 2, y + (rowH - 10) / 2);

      // 구글 상태
      const googleColor = kw.google?.found ? C.pass : C.fail;
      const googleLabel = kw.google?.found ? (language === "ko" ? "노출" : "Visible") : (language === "ko" ? "미노출" : "Hidden");
      doc.font("KrBold").fontSize(7.5).fillColor(googleColor);
      const glW = doc.widthOfString(googleLabel);
      doc.text(googleLabel, kwCols[3].x + (kwCols[3].w - glW) / 2, y + (rowH - 10) / 2);

      // v4: AI 인용 — 컨러 매핑 수정 (낮음=주황, 없음=빨강)
      const aiLikelihood = (kw.ai?.likelihood || "없음") as string;
      const aiLikelihoodLower = aiLikelihood.toLowerCase();
      const aiColor = (aiLikelihoodLower === "높음" || aiLikelihoodLower === "high") ? C.pass
        : (aiLikelihoodLower === "보통" || aiLikelihoodLower === "medium") ? C.warn
        : (aiLikelihoodLower === "낮음" || aiLikelihoodLower === "low") ? C.gold
        : C.fail;
      const aiLabel = language === "ko"
        ? (aiLikelihoodLower === "높음" || aiLikelihoodLower === "high" ? t.realityAiHigh
          : aiLikelihoodLower === "보통" || aiLikelihoodLower === "medium" ? t.realityAiMedium
          : aiLikelihoodLower === "낮음" || aiLikelihoodLower === "low" ? t.realityAiLow
          : t.realityAiNone)
        : aiLikelihood;
      doc.font("KrBold").fontSize(7.5).fillColor(aiColor);
      const alW = doc.widthOfString(aiLabel);
      doc.text(aiLabel, kwCols[4].x + (kwCols[4].w - alW) / 2, y + (rowH - 10) / 2);

      y += rowH;
    });
    y += 8;

    // v4: 놓치는 환자 수 경고 박스 + 근거 설명
    if (rd.missedPatients) {
      y = ensureSpace(doc, y, 80, hCtx);
      // v4: 매출 손실에 "월" 접두어
      const revenueText = (rd.missedPatients.revenueImpact || "").replace(/만원원/g, "만원").replace(/억원원/g, "억원");
      const revenueDisplay = (language === "ko" && revenueText && !revenueText.includes("월"))
        ? `월 ${revenueText}` : revenueText;
      const mpText = language === "ko"
        ? `매월 약 ${rd.missedPatients.estimatedMonthly.toLocaleString()}회의 트래픽이 웹사이트로 유입되지 못하고 있습니다. 예상 잠재 매출 기회: ${revenueDisplay}`
        : `Approximately ${rd.missedPatients.estimatedMonthly.toLocaleString()} monthly website visits are not being captured. Estimated revenue opportunity: ${revenueDisplay}`;
      y = drawInfoBox(doc, y, mpText, { accentColor: C.fail, bgColor: C.redTint, icon: "!" });

      // v6: reasoning 텍스트 삭제됨 (사용자 요청)
    }
  }


  // ═══════════════════════════════════════════════
  // 경쟁 환경 분석 (컴팩트)
  // ═══════════════════════════════════════════════
  if (rd?.competitors && rd.competitors.length > 0) {
    // 모든 경쟁사가 "정보 부족"이면 대체 문구로 표시
    const allLackInfo = rd.competitors.every(c => c.advantage.includes("정보 부족") || c.advantage.includes("insufficient") || c.advantage.trim().length < 5);
    y = ensureSpace(doc, y, 120, hCtx);
    y = drawSubTitle(doc, y, t.realityCompetitors);
    y += 4;
    if (allLackInfo) {
      const altMsg = language === "ko"
        ? "경쟁사 분석은 별도 컨설팅 시 상세 제공됩니다. 현재 공개된 데이터만으로는 정확한 경쟁 환경 파악이 어렵습니다."
        : "Detailed competitor analysis is available during consultation. Public data alone is insufficient for accurate competitive landscape assessment.";
      y = drawInfoBox(doc, y, altMsg, { accentColor: C.warn, bgColor: C.bg, icon: "i" });
    } else {

    // 경쟁사 테이블
    const compCols = [
      { label: language === "ko" ? "경쟁 병원" : "Competitor", x: ML, w: CW * 0.25 },
      { label: language === "ko" ? "강점" : "Advantage", x: ML + CW * 0.25, w: CW * 0.45 },
      { label: language === "ko" ? "가시성" : "Visibility", x: ML + CW * 0.70, w: CW * 0.30 },
    ];
    doc.roundedRect(ML, y, CW, 26, 4).fill(C.tealDark);
    compCols.forEach((col) => {
      doc.font("KrBold").fontSize(7.5).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 8);
    });
    y += 26;

    rd.competitors.forEach((comp, idx) => {
      const advText = stripMarkdown(comp.advantage);
      doc.font("KrRegular").fontSize(7.5);
      const advH = doc.heightOfString(advText, { width: compCols[1].w - 12, lineGap: 2 });
      const rowH = Math.max(advH + 8, 24);
      y = ensureSpace(doc, y, rowH, hCtx);
      doc.rect(ML, y, CW, rowH).fill(idx % 2 === 0 ? C.white : C.bg);
      doc.font("KrRegular").fontSize(8).fillColor(C.text)
        .text(comp.name, compCols[0].x + 6, y + 4, { width: compCols[0].w - 10 });
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(advText, compCols[1].x + 6, y + 4, { width: compCols[1].w - 12, lineGap: 2 });
      doc.font("KrBold").fontSize(7.5).fillColor(C.warn)
        .text(comp.estimatedVisibility, compCols[2].x + 6, y + 4, { width: compCols[2].w - 10, align: "center" });
      y += rowH;
    });
    y += 12;
    } // end else (allLackInfo)
  }


  // ═══════════════════════════════════════════════
  // REALITY DIAGNOSIS PAGES
  // AI 심층 진단 통합 섹션 (GEO + 인용 + 캡슐 + 교차신뢰 + 네이버 Cue)
  // 기존 5개 섹션을 1개로 통합하여 페이지 절약
  // ═══════════════════════════════════════════════
  const hasDeepDiag = rd?.geoTriAxis || rd?.aiCitationThreshold || rd?.answerCapsule || rd?.crossChannelTrust || rd?.naverCueDiagnosis;
  if (hasDeepDiag && rd) {
    y = ensureSpace(doc, y, 120, hCtx);

    const deepTitle = language === "ko" ? "AI 추천 심층 진단" : "AI Recommendation Deep Analysis";
    const deepSub = language === "ko" ? "AI가 병원을 추천하기 위해 확인하는 핵심 요소들을 진단합니다" : "Diagnosing key factors AI checks before recommending a hospital";
    y = drawSectionTitle(doc, y, deepTitle, deepSub);
    y += 4;

    // Headline (rd.headline)
    if (rd.headline) {
      doc.font("KrBold").fontSize(11).fillColor(C.navy)
        .text(rd.headline, ML, y, { width: CW, lineGap: 3 });
      y += doc.heightOfString(rd.headline, { width: CW, lineGap: 3 }) + 8;
    }

    // 핵심 지표 요약 (rd.metrics.naverExposureRate)
    if (rd.metrics) {
      const metricsItems = [
        { label: t.naverLabel, value: `${rd.metrics.naverExposureRate}%`, color: C.pass },
        { label: t.googleLabel, value: `${(rd.metrics as any).googleIndexRate ?? rd.metrics.googleExposureRate}%`, color: C.blue },
        { label: t.aiLabel, value: `${(rd.metrics as any).aiCitationRate ?? rd.metrics.aiReadiness}%`, color: C.teal },
      ];
      const mW = (CW - 12) / 3;
      const mCardH = 40;
      metricsItems.forEach((m, i) => {
        const mx = ML + i * (mW + 6);
        doc.roundedRect(mx, y, mW, mCardH, 4).fill(C.bgAccent);
        // v4: 라벨 + 숫자 수직 중앙 배치
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid);
        const mlW = doc.widthOfString(m.label);
        const mlH = doc.currentLineHeight();
        doc.font("KrBold").fontSize(14);
        const mvH = doc.currentLineHeight();
        const totalTextH = mlH + 2 + mvH;
        const textStartY = y + (mCardH - totalTextH) / 2;
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid);
        doc.text(m.label, mx + (mW - mlW) / 2, textStartY);
        doc.font("KrBold").fontSize(14).fillColor(m.color);
        const mvW = doc.widthOfString(m.value);
        doc.text(m.value, mx + (mW - mvW) / 2, textStartY + mlH + 2);
      });
      y += mCardH + 8;
    }

    // 콘텐츠 사각지대 (rd.contentGaps)
    if (rd.contentGaps && rd.contentGaps.length > 0) {
      y = ensureSpace(doc, y, 60, hCtx);
      y = drawSubTitle(doc, y, t.contentGapsTitle);
      rd.contentGaps.forEach((gap, idx) => {
        const keywordText = stripMarkdown(gap.keyword || "");
        const intentText = stripMarkdown(gap.searchIntent || "");
        const suggestionText = stripMarkdown(gap.suggestedContent || "");
        doc.font("KrRegular").fontSize(7);
        const sugH = doc.heightOfString(suggestionText, { width: CW * 0.23, lineGap: 2 });
        const intH = doc.heightOfString(intentText, { width: CW * 0.23, lineGap: 2 });
        const gapRowH = Math.max(sugH, intH, 14) + 8;
        y = ensureSpace(doc, y, gapRowH, hCtx);
        doc.roundedRect(ML, y, CW, gapRowH, 4).fill(idx % 2 === 0 ? C.bg : C.white);
        doc.font("KrBold").fontSize(7.5).fillColor(C.text)
          .text(keywordText, ML + 6, y + 4, { width: CW * 0.20 });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(intentText, ML + CW * 0.22, y + 4, { width: CW * 0.23, lineGap: 2 });
        const scoreColor = gap.opportunityScore >= 8 ? C.pass : gap.opportunityScore >= 5 ? C.warn : C.textMid;
        doc.font("KrBold").fontSize(8).fillColor(scoreColor)
          .text(String(gap.opportunityScore || 0), ML + CW * 0.48, y + 4, { width: 30, align: "center" });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(suggestionText, ML + CW * 0.55, y + 4, { width: CW * 0.23, lineGap: 2 });
        const diffColor = (gap.difficulty as string) === "\uc26c\uc6c0" || (gap.difficulty as string) === "Easy" ? C.pass : (gap.difficulty as string) === "\ubcf4\ud1b5" || (gap.difficulty as string) === "Medium" ? C.warn : C.fail;
        const diffMap: Record<string, string> = { "\uc26c\uc6c0": "\uc26c\uc6c0", "\ubcf4\ud1b5": "\ubcf4\ud1b5", "\uc5b4\ub824\uc6c0": "\uc5b4\ub824\uc6c0", "Easy": "Easy", "Medium": "Medium", "Hard": "Hard" };
        const diffLabel = diffMap[gap.difficulty] || gap.difficulty;
        doc.font("KrBold").fontSize(7).fillColor(diffColor)
          .text(diffLabel, ML + CW * 0.82, y + 4, { width: CW * 0.18 });
        y += gapRowH;
      });
      y += 8;
    }

    // rd.closingStatement 기반 종합 의견 (최종 평가에서 렌더링)

    // SECTION: GEO 3축 진단 (RxA/F)
    // GEO 3축 — 컴팩트 바 차트
    if (rd.geoTriAxis) {
      y = ensureSpace(doc, y, 100, hCtx);
      y = drawSubTitle(doc, y, t.geoTriAxisTitle);
      y = drawParagraph(doc, y, t.geoTriAxisSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.geoTriAxisWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      const geoItems = [
        { label: t.geoRelevance, score: rd.geoTriAxis.relevance.score, detail: rd.geoTriAxis.relevance.label },
        { label: t.geoAuthority, score: rd.geoTriAxis.authority.score, detail: rd.geoTriAxis.authority.label },
        { label: t.geoFriction, score: rd.geoTriAxis.friction.score, detail: rd.geoTriAxis.friction.label },
      ];
      geoItems.forEach((item) => {
        const barColor = item.score >= 70 ? C.pass : item.score >= 40 ? C.warn : C.fail;
        doc.font("KrRegular").fontSize(8).fillColor(C.text)
          .text(item.label, ML + 4, y, { width: 130 });
        drawProgressBar(doc, ML + 140, y + 1, CW - 220, 8, item.score / 100, barColor);
        doc.font("KrBold").fontSize(8).fillColor(barColor)
          .text(`${item.score}`, ML + CW - 70, y, { width: 30, align: "right" });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(item.detail, ML + CW - 36, y, { width: 36 });
        y += 20;
      });

      // GEO 종합
      doc.font("KrBold").fontSize(9).fillColor(C.navy)
        .text(`${t.geoOverall}: ${rd.geoTriAxis.overallGeoScore}/100`, ML + 4, y);
      y += 16;
      y = drawHorizontalLine(doc, y);
    }

    // SECTION: AI 인용 임계점 체크리스트
    // AI 인용 임계점 — 체크리스트
    if (rd.aiCitationThreshold) {
      y = ensureSpace(doc, y, 100, hCtx);
      y = drawSubTitle(doc, y, t.aiCitationTitle);
      y = drawParagraph(doc, y, t.aiCitationSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.aiCitationWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      rd.aiCitationThreshold.items.forEach((item) => {
        const condText = stripMarkdown(item.condition);
        const detText = stripMarkdown(item.detail);
        doc.font("KrRegular").fontSize(8.5);
        const condH = doc.heightOfString(condText, { width: CW * 0.45, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5);
        const detH = doc.heightOfString(detText, { width: CW * 0.48, lineGap: 3 });
        const rowH = Math.max(condH, detH, 14) + 6;
        y = ensureSpace(doc, y, rowH, hCtx);
        const icon = item.met ? "\u2713" : "\u2717";
        const iconColor = item.met ? C.pass : C.fail;
        doc.font("KrBold").fontSize(9).fillColor(iconColor)
          .text(icon, ML + 4, y + 2);
        doc.font("KrRegular").fontSize(8.5).fillColor(C.text)
          .text(condText, ML + 20, y + 2, { width: CW * 0.45, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
          .text(detText, ML + CW * 0.50, y + 2, { width: CW * 0.48, lineGap: 3 });
        y += rowH;
      });

      // 종합 판정
      // rd.aiCitationThreshold.verdict 기반 종합 판정
      const _citVerdict = rd.aiCitationThreshold.verdict;
      const metRatio = rd.aiCitationThreshold.metCount / rd.aiCitationThreshold.totalCount;
      const verdictColor = metRatio >= 0.8 ? C.pass : metRatio >= 0.5 ? C.warn : C.fail;
      doc.font("KrBold").fontSize(9).fillColor(verdictColor)
        .text(`${t.aiCitationVerdict}: ${rd.aiCitationThreshold.metCount}/${rd.aiCitationThreshold.totalCount} ${t.aiCitationMet}`, ML + 4, y);
      y += 16;
      y = drawHorizontalLine(doc, y);
    }

    // SECTION: 답변 캡슐 품질 진단
    // 답변 캡슐 — 현재 vs 개선 비교
    if (rd.answerCapsule) {
      // rd.answerCapsule.issues 기반 문제점 표시
      y = ensureSpace(doc, y, 120, hCtx);
      y = drawSubTitle(doc, y, t.answerCapsuleTitle);
      y = drawParagraph(doc, y, t.answerCapsuleSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.answerCapsuleWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      // 점수
      const capColor = rd.answerCapsule.score >= 70 ? C.pass : rd.answerCapsule.score >= 40 ? C.warn : C.fail;
      doc.font("KrBold").fontSize(9).fillColor(capColor)
        .text(`${t.answerCapsuleScore}: ${rd.answerCapsule.score}/100`, ML + 4, y);
      y += 16;

      // 현재 vs 개선 — 좌우 비교 카드
      const halfW = (CW - 12) / 2;
      // \ud604\uc7ac \uc0c1\ud0dc \uce74\ub4dc - \ub3d9\uc801 \ub192\uc774 \uacc4\uc0b0
      const curText = stripMarkdown(rd.answerCapsule.currentBestSentence);
      const idealText = stripMarkdown(rd.answerCapsule.idealSentence);
      doc.font("KrRegular").fontSize(7.5);
      const curH = doc.heightOfString(curText, { width: halfW - 20, lineGap: 2 });
      const idealH = doc.heightOfString(idealText, { width: halfW - 20, lineGap: 2 });
      const cardH = Math.max(curH, idealH) + 28;
      y = ensureSpace(doc, y, cardH + 8, hCtx);
      const cardTopYAdj = y;

      doc.roundedRect(ML, cardTopYAdj, halfW, cardH, 4).fill(C.redTint);
      doc.rect(ML, cardTopYAdj, 3, cardH).fill(C.fail);
      doc.font("KrBold").fontSize(7.5).fillColor(C.fail)
        .text(t.answerCapsuleCurrent, ML + 10, cardTopYAdj + 6, { width: halfW - 16 });
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(curText, ML + 10, cardTopYAdj + 20, { width: halfW - 20, lineGap: 2 });

      // \uac1c\uc120 \uc608\uc2dc \uce74\ub4dc
      doc.roundedRect(ML + halfW + 12, cardTopYAdj, halfW, cardH, 4).fill(C.greenTint);
      doc.rect(ML + halfW + 12, cardTopYAdj, 3, cardH).fill(C.pass);
      doc.font("KrBold").fontSize(7.5).fillColor(C.pass)
        .text(t.answerCapsuleSample, ML + halfW + 22, cardTopYAdj + 6, { width: halfW - 16 });
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(idealText, ML + halfW + 22, cardTopYAdj + 20, { width: halfW - 20, lineGap: 2 });

      y = cardTopYAdj + cardH + 8;
      y = drawHorizontalLine(doc, y);
    }

    // SECTION: 4채널 교차 신뢰 진단
    // 4채널 교차 신뢰 — 컴팩트 카드
    if (rd.crossChannelTrust) {
      // rd.crossChannelTrust.verdict 기반 종합 판정
      y = ensureSpace(doc, y, 80, hCtx);
      y = drawSubTitle(doc, y, t.crossChannelTitle);
      y = drawParagraph(doc, y, t.crossChannelSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.crossChannelWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      const chW = (CW - 18) / 4;
      const chCardH = 52;
      rd.crossChannelTrust.channels.forEach((ch, i) => {
        const cx = ML + i * (chW + 6);
        const chColor = ch.consistencyScore >= 70 ? C.pass : ch.consistencyScore >= 40 ? C.warn : C.fail;
        doc.roundedRect(cx, y, chW, chCardH, 4).fill(C.bgAccent);
        doc.rect(cx, y, chW, 3).fill(chColor);
        // v4: 채널명 — 수평+수직 정중앙
        doc.font("KrBold").fontSize(7.5).fillColor(C.text);
        const chNameW = doc.widthOfString(ch.name);
        const chNameH = doc.currentLineHeight();
        doc.text(ch.name, cx + (chW - chNameW) / 2, y + 8);
        // v4: 점수 — 수평+수직 정중앙 (카드 하단 영역 중앙)
        doc.font("KrBold").fontSize(16).fillColor(chColor);
        const chScoreStr = String(ch.consistencyScore);
        const chScoreW = doc.widthOfString(chScoreStr);
        const chScoreH = doc.currentLineHeight();
        const scoreAreaTop = y + 8 + chNameH + 2;
        const scoreAreaH = chCardH - (8 + chNameH + 2) - 4;
        doc.text(chScoreStr, cx + (chW - chScoreW) / 2, scoreAreaTop + (scoreAreaH - chScoreH) / 2);
      });
      y += chCardH + 8;

      // 종합 점수
      doc.font("KrBold").fontSize(9).fillColor(C.navy)
        .text(`${t.crossChannelOverall}: ${rd.crossChannelTrust.overallConsistency}/100`, ML + 4, y);
      y += 16;
      y = drawHorizontalLine(doc, y);
    }

  // ═══════════════════════════════════════════════
  // AI 추천 시뮬레이터 — 핵심 영업 섹션
  // ═══════════════════════════════════════════════
  // SECTION: AI 추천 시뮬레이터
  if (rd?.aiSimulator && rd.aiSimulator.query && rd.aiSimulator.results.length > 0) {
    y = ensureSpace(doc, y, 80, hCtx);
    y = drawSectionTitle(doc, y, t.aiSimulatorTitle, t.aiSimulatorSub);
    y += 2;

    // 왜 중요한지 설명
    y = drawInfoBox(doc, y, t.aiSimulatorWhy, { accentColor: C.teal, bgColor: C.bgAccent });

    // 시뮬레이션 질문
    doc.font("KrBold").fontSize(9.5).fillColor(C.navy)
      .text(`"${rd.aiSimulator.query}"`, ML + 10, y, { width: CW - 20 });
    y += 20;

    // 결과 테이블
    const simCols = [
      { label: "AI", x: ML, w: CW * 0.20 },
      { label: language === "ko" ? "추천 여부" : "Status", x: ML + CW * 0.20, w: CW * 0.20 },
      { label: language === "ko" ? "상세" : "Detail", x: ML + CW * 0.40, w: CW * 0.60 },
    ];
    doc.roundedRect(ML, y, CW, 24, 4).fill(C.tealDark);
    simCols.forEach((col) => {
      doc.font("KrBold").fontSize(7.5).fillColor(C.white);
      const tw = doc.widthOfString(col.label);
      doc.text(col.label, col.x + (col.w - tw) / 2, y + 7);
    });
    y += 26;

    rd.aiSimulator.results.forEach((r, idx) => {
      const ctxText = stripMarkdown(r.context);
      doc.font("KrRegular").fontSize(7);
      const ctxH = doc.heightOfString(ctxText, { width: simCols[2].w - 12, lineGap: 2 });
      const rowH = Math.max(ctxH + 8, 24);
      y = ensureSpace(doc, y, rowH, hCtx);
      doc.rect(ML, y, CW, rowH).fill(idx % 2 === 0 ? C.white : C.bg);
      // \uc88c\uce21 \uc0c9\uc0c1 \uc778\ub514\ucf00\uc774\ud130
      doc.rect(ML, y, 3, rowH).fill(r.mentioned ? C.pass : C.fail);

      doc.font("KrBold").fontSize(8).fillColor(C.text)
        .text(r.engine, simCols[0].x + 8, y + (rowH - 10) / 2, { width: simCols[0].w - 12 });

      const statusLabel = r.mentioned ? t.aiSimRecommended : t.aiSimNotRecommended;
      const statusColor = r.mentioned ? C.pass : C.fail;
      doc.font("KrBold").fontSize(7.5).fillColor(statusColor);
      const stW = doc.widthOfString(statusLabel);
      doc.text(statusLabel, simCols[1].x + (simCols[1].w - stW) / 2, y + (rowH - 10) / 2);

      doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
        .text(ctxText, simCols[2].x + 6, y + 4, { width: simCols[2].w - 12, lineGap: 2 });
      y += rowH;
    });

    // 종합 판정
    y += 4;
    const _mentionRate = rd.aiSimulator.mentionRate;
    // v4: 판정 결과에 따라 색상 구분
    const mentionedCount = rd.aiSimulator.results.filter(r => r.mentioned).length;
    const simVerdictColor = mentionedCount >= rd.aiSimulator.results.length / 2 ? C.pass : C.fail;
    const simVerdictBg = mentionedCount >= rd.aiSimulator.results.length / 2 ? C.greenTint : C.redTint;
    y = drawInfoBox(doc, y, stripMarkdown(rd.aiSimulator.verdict), { accentColor: simVerdictColor, bgColor: simVerdictBg, icon: mentionedCount >= rd.aiSimulator.results.length / 2 ? "\u2713" : "!" });
  }

    // SECTION: 네이버 Cue: 대응 진단
    // 네이버 Cue: 대응 진단 — 컴팩트
    if (rd.naverCueDiagnosis) {
      // rd.naverCueDiagnosis.verdict 기반 종합 판정
      y = ensureSpace(doc, y, 80, hCtx);
      y = drawSubTitle(doc, y, t.naverCueTitle);
      y = drawParagraph(doc, y, t.naverCueSub, { fontSize: 8.5, color: C.textMid });
      y = drawInfoBox(doc, y, t.naverCueWhy, { accentColor: C.teal, bgColor: C.bgAccent });

      const cueColor = rd.naverCueDiagnosis.score >= 70 ? C.pass : rd.naverCueDiagnosis.score >= 40 ? C.warn : C.fail;
      doc.font("KrBold").fontSize(9).fillColor(cueColor)
        .text(`${language === "ko" ? "Cue: 대응 점수" : "Cue: Score"}: ${rd.naverCueDiagnosis.score}/100`, ML + 4, y);
      y += 16;

      rd.naverCueDiagnosis.items.forEach((item) => {
        const critText = stripMarkdown(item.criterion);
        const detText = stripMarkdown(item.detail);
        doc.font("KrRegular").fontSize(8);
        // v8: 동그라미와 텍스트가 나란히 같은 줄에 나오도록 수정
        const critW = CW * 0.36;
        const detW = CW * 0.53;
        const critH = doc.heightOfString(critText, { width: critW, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5);
        const detH = doc.heightOfString(detText, { width: detW, lineGap: 3 });
        const rowH = Math.max(critH, detH, 16) + 8;
        y = ensureSpace(doc, y, rowH, hCtx);
        const statusColor = (item.status as string) === "양호" || (item.status as string) === "Good" ? C.pass : (item.status as string) === "주의" || (item.status as string) === "Warning" || (item.status as string) === "미흡" ? C.warn : C.fail;
        // v8: 동그라미 수직 중앙 + critText 동그라미 바로 옆에 나란히
        const textStartY = y + (rowH - Math.max(critH, detH)) / 2;
        doc.circle(ML + 6, textStartY + critH / 2, 3.5).fill(statusColor);
        doc.font("KrRegular").fontSize(8).fillColor(C.text)
          .text(critText, ML + 16, textStartY, { width: critW, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
          .text(detText, ML + CW * 0.44, textStartY, { width: detW, lineGap: 3 });
        y += rowH;
      });
      y += 8;
    }
  }


  // ═══════════════════════════════════════════════
  // 즉시 개선 필요 항목 + 주의 항목 + 정상 운영 항목
  // ═══════════════════════════════════════════════
    const allFailItems = auditResult.categories.flatMap(c => c.items.filter(i => i.status === "fail"));
  const allWarnItems = auditResult.categories.flatMap(c => c.items.filter(i => i.status === "warning"));
  const failItems = allFailItems.sort((a, b) => a.score - b.score); // v4: 전체 표시
  const warnItems = allWarnItems.sort((a, b) => a.score - b.score); // v4: 전체 표시

  if (failItems.length > 0 || warnItems.length > 0) {
    y = ensureSpace(doc, y, 120, hCtx);

    y = drawSectionTitle(doc, y, t.criticalIssues);
    y = drawParagraph(doc, y, t.criticalDesc);
    y += 4;

    // 실패 항목 — 좌측 세로바 + 현황 pill + 기술용어 파란색 + 구분선
    failItems.forEach((item, fIdx) => {
      const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
      const detailText = stripMarkdown(item.detail);
      const recText = stripMarkdown(item.recommendation);
      doc.font("KrRegular").fontSize(7.5);
      const detH = doc.heightOfString(detailText, { width: CW - 30, lineGap: 2 });
      const recH = doc.heightOfString(recText, { width: CW - 30, lineGap: 2 });
      let impactH = 0;
      if (item.impact) {
        const impText = stripMarkdown(item.impact);
        doc.font("KrBold").fontSize(7);
        impactH = doc.heightOfString(`→ ${impText}`, { width: CW - 40, lineGap: 2 }) + 6;
      }
      const cardH = 22 + detH + 6 + recH + impactH + 12;
      y = ensureSpace(doc, y, cardH + 6, hCtx);

      // 카드 배경
      doc.roundedRect(ML, y, CW, cardH, 4).fill(C.redTint);
      // 좌측 3px 빨간색 세로바
      doc.rect(ML, y, 3, cardH).fill(C.fail);

      // 항목명
      doc.font("KrBold").fontSize(9).fillColor(C.fail)
        .text(itemName, ML + 14, y + 6, { width: CW - 28 });

      // "현황" pill 배경
      let fy = y + 22;
      const pillBgH = detH + 8;
      doc.roundedRect(ML + 14, fy - 2, CW - 28, pillBgH, 3).fill("#FEE2E2");
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
        .text(detailText, ML + 20, fy + 2, { width: CW - 40, lineGap: 2 });
      fy += pillBgH + 4;

      // "조치" — 기술 용어 파란색 구분
      doc.font("KrRegular").fontSize(7.5).fillColor(C.text)
        .text(recText, ML + 20, fy, { width: CW - 40, lineGap: 2 });

      // v8: 기대 효과 (impact) 표시
      if (item.impact) {
        const impactText = stripMarkdown(item.impact);
        doc.font("KrRegular").fontSize(7.5);
        const recActualH = doc.heightOfString(recText, { width: CW - 40, lineGap: 2 });
        const impactY = fy + recActualH + 4;
        doc.font("KrBold").fontSize(7).fillColor(C.navy)
          .text(`→ ${impactText}`, ML + 20, impactY, { width: CW - 40, lineGap: 2 });
      }

      y += cardH + 2;

      // 항목 간 0.5px 회색 구분선
      if (fIdx < failItems.length - 1) {
        doc.moveTo(ML + 10, y).lineTo(ML + CW - 10, y).lineWidth(0.5).strokeColor(C.border).stroke();
        y += 4;
      }
    });
    if (allFailItems.length > 10) {
      doc.font("KrRegular").fontSize(6).fillColor(C.textMuted)
        .text(`  + ${allFailItems.length - 10}${language === "ko" ? "개 추가 항목" : " more items"}`, ML + 10, y + 2);
      y += 14;
    }

    // 주의 항목
    if (warnItems.length > 0) {
      y = ensureSpace(doc, y, 60, hCtx);
      y += 8;
      y = drawSubTitle(doc, y, t.warningIssues);
      y = drawParagraph(doc, y, t.warningDesc);
      y += 2;

      warnItems.forEach((item) => {
        const itemName = language === "ko" ? (ITEM_NAMES_KO[item.name] || item.name) : item.name;
        const recText = stripMarkdown(item.recommendation);
        doc.font("KrRegular").fontSize(7);
        const recH = doc.heightOfString(recText, { width: CW * 0.58, lineGap: 2 });
        let warnImpactH = 0;
        if (item.impact) {
          const impText = stripMarkdown(item.impact);
          doc.font("KrBold").fontSize(6.5);
          warnImpactH = doc.heightOfString(`→ ${impText}`, { width: CW * 0.58, lineGap: 2 }) + 4;
        }
        const rowH = Math.max(recH + warnImpactH + 8, 26);
        y = ensureSpace(doc, y, rowH + 4, hCtx);
        doc.roundedRect(ML, y, CW, rowH, 4).fill(C.bg);
        doc.rect(ML, y, 3, rowH).fill(C.warn);
        doc.font("KrBold").fontSize(8).fillColor(C.warn)
          .text(itemName, ML + 10, y + 4, { width: CW * 0.35 });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(recText, ML + CW * 0.38, y + 4, { width: CW * 0.58, lineGap: 2 });
        if (item.impact) {
          const impText = stripMarkdown(item.impact);
          const recActH = doc.heightOfString(recText, { width: CW * 0.58, lineGap: 2 });
          doc.font("KrBold").fontSize(6.5).fillColor(C.navy)
            .text(`→ ${impText}`, ML + CW * 0.38, y + 4 + recActH + 2, { width: CW * 0.58, lineGap: 2 });
        }
        y += rowH + 4;
      });
      if (allWarnItems.length > 5) {
        doc.font("KrRegular").fontSize(6).fillColor(C.textMuted)
          .text(`  + ${allWarnItems.length - 5}${language === "ko" ? "개 추가 주의 항목" : " more warning items"}`, ML + 10, y + 2);
        y += 14;
      }
    }
  }
  // (정상 운영 항목 섹션 삭제됨 — 사용자 요청)
  // ═══════════════════════════════════════════════
  // SECTION: 전략 가이드드 (웹사이트 변환 + 콘텐츠 + 마케팅 + mybiseo)
  // 전략 가이드 (통합 — 웹사이트 + 콘텐츠 + 마케팅)
  // ═══════════════════════════════════════════════
  const hasGuide = rd?.websiteTransformGuide || rd?.contentStrategy || rd?.marketingDirection;
  if (hasGuide && rd) {
    y = ensureSpace(doc, y, 120, hCtx);

    y = drawSectionTitle(doc, y, t.strategicGuideTitle, t.strategicGuideSub);
    y += 4;

    // 웹사이트 변환 가이드
    if (rd.websiteTransformGuide) {
      // rd.websiteTransformGuide.currentState 기반 현재 상태 분석
      y = ensureSpace(doc, y, 80, hCtx);
      y = drawSubTitle(doc, y, t.guideWebsite);

      rd.websiteTransformGuide.transformations.forEach((tr) => {
        const recText = stripMarkdown(tr.recommendation);
        doc.font("KrRegular").fontSize(7);
        const recH = doc.heightOfString(recText, { width: CW * 0.53, lineGap: 2 });
        const rowH = Math.max(recH + 8, 28);
        y = ensureSpace(doc, y, rowH + 4, hCtx);
        const prColor = (tr.priority as string) === "\ub192\uc74c" || (tr.priority as string) === "High" ? C.fail : (tr.priority as string) === "\ubcf4\ud1b5" || (tr.priority as string) === "Medium" ? C.warn : C.pass;
        doc.roundedRect(ML, y, CW, rowH, 4).fill(C.bg);
        doc.rect(ML, y, 3, rowH).fill(prColor);
        doc.font("KrBold").fontSize(8).fillColor(C.text)
          .text(stripMarkdown(tr.area), ML + 10, y + 4, { width: CW * 0.25 });
        doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
          .text(recText, ML + CW * 0.28, y + 4, { width: CW * 0.53, lineGap: 2 });
        // \uc6b0\uc120\uc21c\uc704 \ubf09\uc9c0
        const badgeW2 = 34;
        const badgeH2 = 15;
        const badgeX2 = ML + CW - badgeW2 - 6;
        const badgeY2 = y + (rowH - badgeH2) / 2;
        doc.roundedRect(badgeX2, badgeY2, badgeW2, badgeH2, 7).fill(prColor);
        doc.font("KrBold").fontSize(6.5).fillColor(C.white);
        const prLabel = tr.priority;
        const prLW = doc.widthOfString(prLabel);
        const prLH = doc.currentLineHeight();
        doc.text(prLabel, badgeX2 + (badgeW2 - prLW) / 2, badgeY2 + (badgeH2 - prLH) / 2);
        y += rowH + 4;
      });
      y += 4;
      y = drawHorizontalLine(doc, y);
    }

    // 콘텐츠 전략
    if (rd.contentStrategy) {
      // rd.contentStrategy.blogStrategy / rd.contentStrategy.faqStrategy 기반 전략
      y = ensureSpace(doc, y, 60, hCtx);
      y = drawSubTitle(doc, y, t.guideContent);
      y = drawParagraph(doc, y, stripMarkdown(rd.contentStrategy.currentAssessment));

      if (rd.contentStrategy.contentCalendar && rd.contentStrategy.contentCalendar.length > 0) {
        y = ensureSpace(doc, y, 60, hCtx);
        // 콘텐츠 캘린더 — 컴팩트 테이블
        const calCols = [
          { label: language === "ko" ? "주차" : "Week", x: ML, w: CW * 0.15 },
          { label: language === "ko" ? "주제" : "Topic", x: ML + CW * 0.15, w: CW * 0.40 },
          { label: language === "ko" ? "형식" : "Format", x: ML + CW * 0.55, w: CW * 0.20 },
          { label: language === "ko" ? "타겟 키워드" : "Target Keyword", x: ML + CW * 0.75, w: CW * 0.25 },
        ];
        doc.roundedRect(ML, y, CW, 22, 4).fill(C.tealDark);
        calCols.forEach((col) => {
          doc.font("KrBold").fontSize(7).fillColor(C.white);
          const tw = doc.widthOfString(col.label);
          doc.text(col.label, col.x + (col.w - tw) / 2, y + 6);
        });
        y += 22;

        rd.contentStrategy.contentCalendar.forEach((cal, idx) => {
          const topicText = stripMarkdown(cal.topic);
          const kwText = stripMarkdown(cal.targetKeyword);
          doc.font("KrRegular").fontSize(7);
          const topicH = doc.heightOfString(topicText, { width: calCols[1].w - 8, lineGap: 2 });
          const kwH = doc.heightOfString(kwText, { width: calCols[3].w - 8, lineGap: 2 });
          const calRowH = Math.max(topicH + 8, kwH + 8, 18);
          y = ensureSpace(doc, y, calRowH, hCtx);
          doc.rect(ML, y, CW, calRowH).fill(idx % 2 === 0 ? C.white : C.bg);
          doc.font("KrRegular").fontSize(7).fillColor(C.text)
            .text(cal.week, calCols[0].x + 4, y + 4, { width: calCols[0].w - 8 });
          doc.font("KrRegular").fontSize(7).fillColor(C.text)
            .text(topicText, calCols[1].x + 4, y + 4, { width: calCols[1].w - 8, lineGap: 2 });
          doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
            .text(cal.format, calCols[2].x + 4, y + 4, { width: calCols[2].w - 8 });
          doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
            .text(kwText, calCols[3].x + 4, y + 4, { width: calCols[3].w - 8, lineGap: 2 });
          y += calRowH;
        });
        y += 8;
      }
      y = drawHorizontalLine(doc, y);
    }

    // 마케팅 방향
    if (rd.marketingDirection) {
      // rd.marketingDirection.coexistenceMessage 기반 공존 메시지
      y = ensureSpace(doc, y, 60, hCtx);
      y = drawSubTitle(doc, y, t.guideMarketing);
      y = drawParagraph(doc, y, stripMarkdown(rd.marketingDirection.overallStrategy));

      if (rd.marketingDirection.channelStrategies) {
        rd.marketingDirection.channelStrategies.forEach((ch) => {
          const stratText = stripMarkdown(ch.strategy);
          doc.font("KrRegular").fontSize(7.5);
          const stratH = doc.heightOfString(stratText, { width: CW * 0.70, lineGap: 3 });
          const rowH = Math.max(stratH, 14) + 8;
          y = ensureSpace(doc, y, rowH, hCtx);
          doc.font("KrBold").fontSize(8).fillColor(C.navy)
            .text(`\u2022 ${ch.channel}`, ML + 4, y + 2, { width: CW * 0.25 });
          doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
            .text(stratText, ML + CW * 0.28, y + 2, { width: CW * 0.70, lineGap: 3 });
          y += rowH;
        });
      }
      y += 8;
    }

    // MY비서 서비스 소개
    // rd.mybiseoServices 기반 서비스 렌더링
    if (rd.mybiseoServices) {
      y = ensureSpace(doc, y, 60, hCtx);
      const svcCount = rd.mybiseoServices.services?.length || 5;
      y = drawSectionTitle(doc, y, t.guideMybiseo, language === "ko" ? `AI 시대에 귀 병원에 꼭 필요한 ${svcCount}가지 서비스` : `${svcCount} essential services for your hospital in the AI era`);
      // rd.mybiseoServices.headline
      y = drawParagraph(doc, y, stripMarkdown(rd.mybiseoServices.headline));
      // rd.mybiseoServices.services — 2열 카드 그리드
      if (rd.mybiseoServices.services) {
        const svcCardW = (CW - 10) / 2;
        for (let si = 0; si < rd.mybiseoServices.services.length; si += 2) {
          const svc1 = rd.mybiseoServices.services[si];
          const svc2 = rd.mybiseoServices.services[si + 1];
          // 동적 높이 계산
          doc.font("KrRegular").fontSize(7);
          const desc1 = stripMarkdown(svc1.description);
          const h1 = doc.heightOfString(desc1, { width: svcCardW - 16, lineGap: 2 });
          let h2 = 0;
          let desc2 = "";
          if (svc2) {
            desc2 = stripMarkdown(svc2.description);
            h2 = doc.heightOfString(desc2, { width: svcCardW - 16, lineGap: 2 });
          }
          const cardH = Math.max(h1, h2, 14) + 28;
          y = ensureSpace(doc, y, cardH + 6, hCtx);

          // 좌측 카드
          const cx1 = ML;
          doc.roundedRect(cx1, y, svcCardW, cardH, 4).fill(C.bgAccent);
          doc.rect(cx1, y, 3, cardH).fill(C.teal);
          doc.font("KrBold").fontSize(7.5).fillColor(C.navy)
            .text(`${si + 1}. ${svc1.name}`, cx1 + 10, y + 6, { width: svcCardW - 16 });
          doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
            .text(desc1, cx1 + 10, y + 20, { width: svcCardW - 16, lineGap: 2 });

          // 우측 카드
          if (svc2) {
            const cx2 = ML + svcCardW + 10;
            doc.roundedRect(cx2, y, svcCardW, cardH, 4).fill(C.bgAccent);
            doc.rect(cx2, y, 3, cardH).fill(C.teal);
            doc.font("KrBold").fontSize(7.5).fillColor(C.navy)
              .text(`${si + 2}. ${svc2.name}`, cx2 + 10, y + 6, { width: svcCardW - 16 });
            doc.font("KrRegular").fontSize(7).fillColor(C.textMid)
              .text(desc2, cx2 + 10, y + 20, { width: svcCardW - 16, lineGap: 2 });
          }
          y += cardH + 4;
        }
      }
      // ctaMessage는 CTA 페이지에서 통합 표시
      y += 8;
    }
  }
  // ═══════════════════════════════════════════════
  // 개선 로드맵 (3단계)
  // ════════════════════════════════════════════════
  if (rd?.actionItems && rd.actionItems.length > 0) {
    y = ensureSpace(doc, y, 120, hCtx);
    y = drawSectionTitle(doc, y, t.actionPlan, t.actionDesc);
    y += 4;

    const phases = [
      { label: t.phase1, items: rd.actionItems.filter(a => {
        const p = (a.priority as string).toLowerCase();
        return p === "즉시" || p === "높음" || p === "1개월 내" || p === "immediate" || p === "high" || p === "phase 1";
      }), color: C.fail },
      { label: t.phase2, items: rd.actionItems.filter(a => {
        const p = (a.priority as string).toLowerCase();
        return p === "단기" || p === "보통" || p === "short-term" || p === "medium" || p === "phase 2";
      }), color: C.warn },
      { label: t.phase3, items: rd.actionItems.filter(a => {
        const p = (a.priority as string).toLowerCase();
        return p === "중장기" || p === "낮음" || p === "3개월 내" || p === "long-term" || p === "low" || p === "phase 3";
      }), color: C.pass },
    ];

    phases.forEach((phase) => {
      if (phase.items.length === 0) return;
      y = ensureSpace(doc, y, 40, hCtx);

      // 단계 헤더
      doc.roundedRect(ML, y, CW, 24, 4).fill(phase.color);
      doc.font("KrBold").fontSize(9).fillColor(C.white);
      const phLW = doc.widthOfString(phase.label);
      doc.text(phase.label, ML + (CW - phLW) / 2, y + 6);
      y += 28;

      phase.items.forEach((item, itemIdx) => {
        const actText = stripMarkdown(item.action);
        const impText = stripMarkdown(item.expectedImpact);
        doc.font("KrRegular").fontSize(8);
        const actH = doc.heightOfString(`\u2022 ${actText}`, { width: CW * 0.58, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5);
        const impH = doc.heightOfString(impText, { width: CW * 0.36, lineGap: 3 });
        const rowH = Math.max(actH, impH, 14) + 8;
        y = ensureSpace(doc, y, rowH + 4, hCtx);
        // 교대 배경 (#29)
        if (itemIdx % 2 === 0) {
          doc.roundedRect(ML, y - 2, CW, rowH + 2, 2).fill(C.bg);
        }
        doc.font("KrRegular").fontSize(8).fillColor(C.text)
          .text(`\u2022 ${actText}`, ML + 8, y + 2, { width: CW * 0.58, lineGap: 3 });
        doc.font("KrRegular").fontSize(7.5).fillColor(C.textMid)
          .text(impText, ML + CW * 0.62, y + 2, { width: CW * 0.36, lineGap: 3 });
        y += rowH + 2;
      });
      y += 8;
    });
  }

  // ═══════════════════════════════════════════════
  // 최종 평가 + 종합 의견 (closingStatement가 있을 때만 렌더링)
  // ═══════════════════════════════════════════════
  if (rd?.closingStatement) {
    y = ensureSpace(doc, y, 120, hCtx);

    // v4: 상단 티얼 액센트 바
    doc.roundedRect(ML, y, CW, 4, 0).fill(C.teal);
    y += 8;
    y = drawSectionTitle(doc, y, t.finalAssessment, t.finalAssessmentSub);
    y += 4;

    // v5: closingStatement — 첫 문장만 볼드, 나머지 본문 스타일
    const fullText = stripMarkdown(rd.closingStatement).trim();
    // 단락 분리 (줄바꾼 또는 마침표 기준)
    let paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
    // 단일 단락인 경우: 첫 문장만 볼드, 나머지 본문
    if (paragraphs.length <= 1 && fullText.length > 100) {
      // 첫 문장 추출 (마침표 기준)
      const firstSentenceMatch = fullText.match(/^(.+?\.\s)/);
      if (firstSentenceMatch) {
        const firstSentence = firstSentenceMatch[1].trim();
        const rest = fullText.slice(firstSentenceMatch[0].length).trim();
        paragraphs = rest ? [firstSentence, rest] : [firstSentence];
      }
    }
    paragraphs.forEach((para, idx) => {
      y = ensureSpace(doc, y, 40, hCtx);
      const trimmed = para.trim();
      if (idx === 0) {
        // v5: 첫 문장/단락만 볼드 (핵심 요약)
        doc.font("KrBold").fontSize(9.5).fillColor(C.navy);
        const bh = doc.heightOfString(trimmed, { width: CW, lineGap: 5 });
        doc.text(trimmed, ML, y, { width: CW, lineGap: 5 });
        y += bh + 8;
      } else {
        // v5: 나머지 단락은 본문 스타일 (볼드 아님)
        y = drawParagraph(doc, y, trimmed);
        y += 4;
      }
    });
    y += 4;
  }

  // 영업 CTA 박스 — CTA 페이지로 이동 (별도 페이지 생성 방지)
  const ctaBoxText = language === "ko"
    ? `현재 ${hospitalName}의 AI 가시성 점수는 ${score}점(${grade}등급)입니다. 경쟁 병원들이 AI 최적화를 시작하기 전에 선제적으로 대응하시면, 3개월 내 의미 있는 환자 유입 증가를 기대할 수 있습니다.`
    : `${hospitalName}'s current AI visibility score is ${score} (Grade ${grade}). By proactively responding before competitors start AI optimization, meaningful patient growth can be expected within 3 months.`;
  // ctaBoxText는 CTA 페이지 내부에서 사용

  // ═══════════════════════════════════════════════
  // PAGE: HISTORY TREND (부록 위치)
  // 히스토리 트렌드 (있는 경우만)
  // ═══════════════════════════════════════════════
  let historyData: any[] = [];
  try {
    historyData = await getMonthlyTrendByUrl(url);
  } catch { historyData = []; }

  if (historyData.length > 1) {
    y = ensureSpace(doc, y, 150, hCtx);

    y = drawSectionTitle(doc, y, t.historyTitle, t.historySub);
    y += 4;
    y = drawParagraph(doc, y, t.historyDesc);
    y += 4;

    // 간단한 바 차트
    const chartH = 80;
    const barMaxW = CW / Math.max(historyData.length, 1) - 8;
    const maxHistScore = Math.max(...historyData.map((d: any) => d.score || 0), 100);

    historyData.slice(-8).forEach((d: any, i: number) => {
      const bx = ML + i * (barMaxW + 8) + 4;
      const bh = (d.score / maxHistScore) * chartH;
      const by = y + chartH - bh;
      const bColor = d.score >= 70 ? C.pass : d.score >= 40 ? C.warn : C.fail;

      doc.roundedRect(bx, by, barMaxW, bh, 3).fill(bColor);
      // 점수 — 바 위 정중앙
      doc.font("KrBold").fontSize(7).fillColor(C.text);
      const sStr = String(d.score);
      const sW = doc.widthOfString(sStr);
      doc.text(sStr, bx + (barMaxW - sW) / 2, by - 12);
      // 월 — 바 아래 정중앙
      const monthLabel = d.month || `${i + 1}${t.historyMonth}`;
      doc.font("KrRegular").fontSize(6.5).fillColor(C.textMid);
      const mW = doc.widthOfString(monthLabel);
      doc.text(monthLabel, bx + (barMaxW - mW) / 2, y + chartH + 4);
    });
    y += chartH + 24;

    // 변화 요약
    if (historyData.length >= 2) {
      const first = historyData[0];
      const last = historyData[historyData.length - 1];
      const diff = (last.score || 0) - (first.score || 0);
      const changeText = diff > 0 ? t.historyImproved : diff < 0 ? t.historyDeclined : t.historyNoChange;
      const changeColor = diff > 0 ? C.pass : diff < 0 ? C.fail : C.textMid;
      doc.font("KrRegular").fontSize(8.5).fillColor(changeColor)
        .text(`${t.historyChange}: ${diff > 0 ? "+" : ""}${diff}  ${changeText}`, ML + 4, y);
      y += 16;
    }
  }

  // ═══════════════════════════════════════════════
  // CONTACT INFORMATION PAGE (CTA) — v6: QR 중심 + 좌우 중앙 + 품격있는 디자인
  // ═══════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, t, url);
  y = MT;

  // v6: 페이지 중앙 기준 레이아웃 — QR코드가 중심
  // 전체 콘텐츠 높이 계산: 타이틀(30) + 설명(50) + QR(100) + 연락처(30) + 메시지(60) ≈ 300
  const ctaContentH = 340;
  const ctaStartY = Math.max(MT + 20, (PH - ctaContentH) / 2 - 20);
  y = ctaStartY;

  // 타이틀 (좌우 중앙)
  doc.font("KrBold").fontSize(16).fillColor(C.navy);
  doc.text(t.ctaTitle, ML, y, { width: CW, align: "center" });
  y += 28;

  // 구분선 (좌우 중앙)
  doc.moveTo(scCx - 30, y).lineTo(scCx + 30, y)
    .lineWidth(2).strokeColor(C.teal).stroke();
  y += 20;

  // 설명 텍스트 (좌우 중앙)
  doc.font("KrRegular").fontSize(9.5).fillColor(C.textMid)
    .text(t.ctaDesc1, ML, y, { width: CW, align: "center", lineGap: 3 });
  y += 16;
  doc.font("KrRegular").fontSize(9.5).fillColor(C.textMid)
    .text(t.ctaDesc2, ML, y, { width: CW, align: "center", lineGap: 3 });
  y += 32;

  // v6: QR 코드 — 페이지 중심 요소 (크게 배치)
  if (cachedQrBuffer) {
    try {
      const qrSize = 90;
      const qrPad = 8;
      const qrTotalW = qrSize + qrPad * 2;
      const qrX = scCx - qrTotalW / 2;
      // QR 배경 박스
      doc.roundedRect(qrX - 4, y - 4, qrTotalW + 8, qrTotalW + 8, 6)
        .lineWidth(1).strokeColor(C.border).stroke();
      doc.image(cachedQrBuffer, qrX + qrPad, y + qrPad, { width: qrSize, height: qrSize });
      y += qrTotalW + 16;
      // QR 안내 텍스트
      doc.font("KrRegular").fontSize(7.5).fillColor(C.textLight)
        .text("mybiseo.com", ML, y, { width: CW, align: "center" });
      y += 20;
    } catch { /* QR 실패 시 무시 */ }
  }

  // v6: 연락처 정보 (좌우 중앙 한 줄)
  doc.font("KrRegular").fontSize(8.5).fillColor(C.textLight)
    .text(language === "ko" ? "전화 상담" : "Phone", ML, y, { width: CW, align: "center" });
  y += 14;
  doc.font("KrBold").fontSize(13).fillColor(C.navy)
    .text("010-7321-7004", ML, y, { width: CW, align: "center" });
  y += 28;

  // v7: 영업 메시지 30% 줄임 + 임팩트 있게 (좌우 중앙)
  const ctaLine1 = language === "ko"
    ? `${hospitalName}의 AI 가시성 점수는 ${score}점(${grade}등급)입니다.`
    : `${hospitalName}'s AI visibility score is ${score} (Grade ${grade}).`;
  const ctaLine2 = language === "ko"
    ? `선제적 대응으로 3개월 내 환자 유입 증가를 기대할 수 있습니다.`
    : `Proactive response can drive patient growth within 3 months.`;
  const ctaShortText = `${ctaLine1}\n${ctaLine2}`;
  doc.font("KrRegular").fontSize(8.5).fillColor(C.textMid)
    .text(ctaShortText, ML + 40, y, { width: CW - 80, align: "center", lineGap: 6 });
  y += doc.heightOfString(ctaShortText, { width: CW - 80, lineGap: 6 }) + 14;

  // v7: 무료 상담 + 초안 무료 제공
  const salesLine1 = language === "ko"
    ? `지금 상담하시면, ${hospitalName}만을 위한`
    : `Contact us now for a free consultation`;
  const salesLine2 = language === "ko"
    ? `무료 상담과 맞춤 개선 초안을 무료로 제공해 드립니다.`
    : `and complimentary improvement draft for ${hospitalName}.`;
  const salesMsg = `${salesLine1}\n${salesLine2}`;
  doc.font("KrBold").fontSize(9.5).fillColor(C.teal)
    .text(salesMsg, ML + 40, y, { width: CW - 80, align: "center", lineGap: 5 });

  // v7: CTA 하단에 CONFIDENTIAL 배치 (위치 교환) + 글씨 진하게
  y = PH - 50;
  doc.moveTo(ML + 60, y).lineTo(PW - MR - 60, y).lineWidth(0.5).strokeColor(C.border).stroke();
  y += 10;
  const confText = language === "ko"
    ? "CONFIDENTIAL \u2014 \ubcf8 \ubcf4\uace0\uc11c\ub294 \uc218\uc2e0\uc790 \uc804\uc6a9\uc73c\ub85c \uc791\uc131\ub418\uc5c8\uc2b5\ub2c8\ub2e4"
    : "CONFIDENTIAL \u2014 This report was prepared exclusively for the recipient";
  doc.font("KrRegular").fontSize(6.5).fillColor(C.textLight)
    .text(confText, ML, y, { width: CW, align: "center" });

  // ═══════════════════════════════════════════════
  // 페이지 번호
  // ═══════════════════════════════════════════════
      const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      if (i === 0) continue; // 표지는 번호 없음
      // v4: 페이지 번호 + 하단 티얼 라인
      const pageNum = String(i);
      doc.font("KrRegular").fontSize(7).fillColor(C.textLight);
      const pnW = doc.widthOfString(pageNum);
      doc.text(pageNum, PW / 2 - pnW / 2, PH - 28);
      // 하단 티얼 라인 (표지 제외)
      doc.rect(0, PH - 3, PW, 3).fill(C.teal);
    }

  // ── Finalize ──
  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}


// Backward-compatible alias
export const generateSeoReportPdf = generateAiVisibilityReport;

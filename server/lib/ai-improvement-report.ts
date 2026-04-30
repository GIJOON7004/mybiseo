/**
 * AI 인용 개선 리포트 자동 생성 모듈
 * 모니터링 결과를 분석하여 맞춤형 개선 방안 리포트를 LLM으로 생성
 */

import { invokeLLM } from "../_core/llm";

export interface MonitoringData {
  keyword: string;
  hospitalName: string;
  specialty: string;
  results: Array<{
    platform: string;
    mentioned: boolean;
    rank: number | null;
    sentiment: string;
    mentionPosition: string | null;
    recommendationType: string | null;
    competitorsMentioned: string[];
    context: string;
    response: string;
  }>;
  exposureScore: {
    score: number;
    mentionScore: number;
    rankScore: number;
    sentimentScore: number;
    competitorScore: number;
  } | null;
  competitors: string[];
}

export interface ImprovementReport {
  title: string;
  summary: string;
  content: string;
  overallScore: number;
  recommendations: Recommendation[];
  platformAnalysis: PlatformAnalysis[];
  competitorInsights: CompetitorInsight[];
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
}

export interface PlatformAnalysis {
  platform: string;
  status: "mentioned" | "not_mentioned" | "error";
  rank: number | null;
  sentiment: string;
  analysis: string;
  improvementTip: string;
}

export interface CompetitorInsight {
  competitorName: string;
  mentionedPlatforms: string[];
  comparison: string;
  strategy: string;
}

/**
 * 모니터링 데이터를 기반으로 AI 인용 개선 리포트 생성
 */
export async function generateImprovementReport(
  data: MonitoringData
): Promise<ImprovementReport> {
  // 모니터링 데이터 요약 생성
  const mentionedPlatforms = data.results.filter(r => r.mentioned);
  const notMentionedPlatforms = data.results.filter(r => !r.mentioned);
  const avgRank = mentionedPlatforms.length > 0
    ? mentionedPlatforms.reduce((sum, r) => sum + (r.rank ?? 10), 0) / mentionedPlatforms.length
    : null;

  // 경쟁사 언급 분석
  const competitorMentions: Record<string, string[]> = {};
  for (const r of data.results) {
    for (const comp of r.competitorsMentioned) {
      if (!competitorMentions[comp]) competitorMentions[comp] = [];
      competitorMentions[comp].push(r.platform);
    }
  }

  const prompt = `당신은 병원 AI 마케팅 전문 컨설턴트입니다. 아래 AI 검색 모니터링 결과를 분석하여 상세한 개선 리포트를 작성해주세요.

## 모니터링 대상
- 키워드: "${data.keyword}"
- 병원명: "${data.hospitalName}"
- 진료과: "${data.specialty}"

## 현재 AI 인용 현황
- 종합 노출 점수: ${data.exposureScore?.score ?? "미산정"}/100
- 언급 점수: ${data.exposureScore?.mentionScore ?? 0}/100 (5개 플랫폼 중 ${mentionedPlatforms.length}개에서 언급)
- 순위 점수: ${data.exposureScore?.rankScore ?? 0}/100 ${avgRank ? `(평균 ${avgRank.toFixed(1)}위)` : "(순위 없음)"}
- 감성 점수: ${data.exposureScore?.sentimentScore ?? 0}/100
- 경쟁사 대비 점수: ${data.exposureScore?.competitorScore ?? 0}/100

## 플랫폼별 결과
${data.results.map(r => {
  const status = r.mentioned ? `✅ 언급됨 (${r.rank ? `${r.rank}위` : "순위 없음"}, ${r.sentiment})` : "❌ 미언급";
  const compStr = r.competitorsMentioned.length > 0 ? `경쟁사 언급: ${r.competitorsMentioned.join(", ")}` : "";
  return `- ${r.platform}: ${status} ${compStr}
  ${r.mentioned && r.context ? `맥락: "${r.context}"` : ""}`;
}).join("\n")}

## 경쟁사 현황
${Object.entries(competitorMentions).map(([name, platforms]) => 
  `- ${name}: ${platforms.length}개 플랫폼에서 언급 (${platforms.join(", ")})`
).join("\n") || "등록된 경쟁사 없음"}

## 요청사항
다음 JSON 형식으로 상세한 개선 리포트를 작성해주세요:

{
  "title": "리포트 제목 (예: '강남연세치과 임플란트 AI 인용 개선 리포트')",
  "summary": "3-4문장 요약 (현재 상태 + 핵심 개선 방향)",
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "카테고리 (콘텐츠전략|기술SEO|리뷰관리|브랜딩|경쟁대응|플랫폼최적화)",
      "title": "개선 항목 제목",
      "description": "상세 설명 (왜 필요한지, 현재 문제점)",
      "expectedImpact": "예상 효과 (구체적 수치 포함)",
      "actionItems": ["구체적 실행 항목 1", "구체적 실행 항목 2", "..."]
    }
  ],
  "platformAnalysis": [
    {
      "platform": "chatgpt|gemini|claude|perplexity|grok",
      "analysis": "해당 플랫폼에서의 현재 상태 분석",
      "improvementTip": "해당 플랫폼에서 노출을 높이기 위한 구체적 팁"
    }
  ],
  "competitorInsights": [
    {
      "competitorName": "경쟁사명",
      "comparison": "우리 병원 대비 경쟁사 현황 비교",
      "strategy": "경쟁사 대비 우위를 점하기 위한 전략"
    }
  ]
}

반드시 JSON만 출력하세요. 마크다운이나 코드블록 없이 순수 JSON만 반환하세요.
recommendations는 최소 5개 이상, platformAnalysis는 5개 플랫폼 모두, competitorInsights는 등록된 경쟁사 모두 포함해주세요.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "당신은 병원 AI 마케팅 전문 컨설턴트입니다. 항상 유효한 JSON만 반환합니다." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "improvement_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    category: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    expectedImpact: { type: "string" },
                    actionItems: { type: "array", items: { type: "string" } },
                  },
                  required: ["priority", "category", "title", "description", "expectedImpact", "actionItems"],
                  additionalProperties: false,
                },
              },
              platformAnalysis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    analysis: { type: "string" },
                    improvementTip: { type: "string" },
                  },
                  required: ["platform", "analysis", "improvementTip"],
                  additionalProperties: false,
                },
              },
              competitorInsights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    competitorName: { type: "string" },
                    comparison: { type: "string" },
                    strategy: { type: "string" },
                  },
                  required: ["competitorName", "comparison", "strategy"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "summary", "recommendations", "platformAnalysis", "competitorInsights"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("LLM 응답이 비어있습니다");

    const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent));

    // 플랫폼 분석에 실제 데이터 보강
    const platformAnalysis: PlatformAnalysis[] = (parsed.platformAnalysis || []).map((pa: any) => {
      const result = data.results.find(r => r.platform === pa.platform);
      return {
        platform: pa.platform,
        status: result ? (result.mentioned ? "mentioned" : "not_mentioned") : "error",
        rank: result?.rank ?? null,
        sentiment: result?.sentiment ?? "neutral",
        analysis: pa.analysis,
        improvementTip: pa.improvementTip,
      };
    });

    // 경쟁사 인사이트에 실제 데이터 보강
    const competitorInsights: CompetitorInsight[] = (parsed.competitorInsights || []).map((ci: any) => ({
      competitorName: ci.competitorName,
      mentionedPlatforms: competitorMentions[ci.competitorName] || [],
      comparison: ci.comparison,
      strategy: ci.strategy,
    }));

    // 마크다운 형식의 전체 리포트 콘텐츠 생성
    const content = generateMarkdownReport(
      parsed.title,
      parsed.summary,
      data,
      parsed.recommendations,
      platformAnalysis,
      competitorInsights
    );

    return {
      title: parsed.title,
      summary: parsed.summary,
      content,
      overallScore: data.exposureScore?.score ?? 0,
      recommendations: parsed.recommendations,
      platformAnalysis,
      competitorInsights,
    };
  } catch (err) {
    console.error("[ImprovementReport] LLM 리포트 생성 실패:", err);
    // 폴백: 기본 리포트 생성
    return generateFallbackReport(data, mentionedPlatforms, notMentionedPlatforms, competitorMentions);
  }
}

function generateMarkdownReport(
  title: string,
  summary: string,
  data: MonitoringData,
  recommendations: Recommendation[],
  platformAnalysis: PlatformAnalysis[],
  competitorInsights: CompetitorInsight[]
): string {
  const mentionCount = data.results.filter(r => r.mentioned).length;
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> ${summary}`);
  lines.push("");
  lines.push(`## 1. 현재 AI 인용 현황`);
  lines.push("");
  lines.push(`| 항목 | 점수 | 상태 |`);
  lines.push(`|------|------|------|`);
  lines.push(`| 종합 점수 | ${data.exposureScore?.score ?? 0}/100 | ${getScoreEmoji(data.exposureScore?.score ?? 0)} |`);
  lines.push(`| 언급률 | ${mentionCount}/5 플랫폼 | ${mentionCount >= 4 ? "우수" : mentionCount >= 2 ? "보통" : "개선 필요"} |`);
  lines.push(`| 감성 | ${data.exposureScore?.sentimentScore ?? 0}/100 | ${getScoreEmoji(data.exposureScore?.sentimentScore ?? 0)} |`);
  lines.push(`| 경쟁사 대비 | ${data.exposureScore?.competitorScore ?? 0}/100 | ${getScoreEmoji(data.exposureScore?.competitorScore ?? 0)} |`);
  lines.push("");

  lines.push(`## 2. 플랫폼별 분석`);
  lines.push("");
  for (const pa of platformAnalysis) {
    const icon = pa.status === "mentioned" ? "O" : "X";
    const rankStr = pa.rank ? ` (${pa.rank}위)` : "";
    lines.push(`### ${getPlatformName(pa.platform)} ${icon}${rankStr}`);
    lines.push(`**분석:** ${pa.analysis}`);
    lines.push(`**개선 방안:** ${pa.improvementTip}`);
    lines.push("");
  }

  lines.push(`## 3. 개선 권고사항`);
  lines.push("");
  const highPriority = recommendations.filter(r => r.priority === "high");
  const medPriority = recommendations.filter(r => r.priority === "medium");
  const lowPriority = recommendations.filter(r => r.priority === "low");

  if (highPriority.length > 0) {
    lines.push(`### [긴급] 우선 개선 항목`);
    for (const rec of highPriority) {
      lines.push(`#### ${rec.title}`);
      lines.push(`- **카테고리:** ${rec.category}`);
      lines.push(`- **설명:** ${rec.description}`);
      lines.push(`- **예상 효과:** ${rec.expectedImpact}`);
      lines.push(`- **실행 항목:**`);
      for (const item of rec.actionItems) {
        lines.push(`  - ${item}`);
      }
      lines.push("");
    }
  }

  if (medPriority.length > 0) {
    lines.push(`### [중요] 중기 개선 항목`);
    for (const rec of medPriority) {
      lines.push(`#### ${rec.title}`);
      lines.push(`- **카테고리:** ${rec.category}`);
      lines.push(`- **설명:** ${rec.description}`);
      lines.push(`- **예상 효과:** ${rec.expectedImpact}`);
      lines.push(`- **실행 항목:**`);
      for (const item of rec.actionItems) {
        lines.push(`  - ${item}`);
      }
      lines.push("");
    }
  }

  if (lowPriority.length > 0) {
    lines.push(`### [참고] 장기 개선 항목`);
    for (const rec of lowPriority) {
      lines.push(`#### ${rec.title}`);
      lines.push(`- **설명:** ${rec.description}`);
      lines.push(`- **예상 효과:** ${rec.expectedImpact}`);
      lines.push("");
    }
  }

  if (competitorInsights.length > 0) {
    lines.push(`## 4. 경쟁사 분석`);
    lines.push("");
    for (const ci of competitorInsights) {
      lines.push(`### ${ci.competitorName}`);
      lines.push(`- **AI 인용 현황:** ${ci.mentionedPlatforms.length > 0 ? ci.mentionedPlatforms.map(p => getPlatformName(p)).join(", ") + "에서 언급" : "미언급"}`);
      lines.push(`- **비교:** ${ci.comparison}`);
      lines.push(`- **대응 전략:** ${ci.strategy}`);
      lines.push("");
    }
  }

  lines.push(`---`);
  lines.push(`*본 리포트는 MY비서 AI 모니터링 시스템에 의해 자동 생성되었습니다.*`);
  lines.push(`*생성일: ${new Date().toLocaleDateString("ko-KR")}*`);

  return lines.join("\n");
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return "우수";
  if (score >= 60) return "양호";
  if (score >= 40) return "보통";
  if (score >= 20) return "미흡";
  return "개선 필요";
}

function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    chatgpt: "ChatGPT",
    gemini: "Gemini",
    claude: "Claude",
    perplexity: "Perplexity",
    grok: "Grok",
  };
  return names[platform] || platform;
}

function generateFallbackReport(
  data: MonitoringData,
  mentionedPlatforms: any[],
  notMentionedPlatforms: any[],
  competitorMentions: Record<string, string[]>
): ImprovementReport {
  const score = data.exposureScore?.score ?? 0;
  const title = `${data.hospitalName} "${data.keyword}" AI 인용 개선 리포트`;
  const summary = `현재 ${data.hospitalName}의 "${data.keyword}" 키워드는 5개 AI 플랫폼 중 ${mentionedPlatforms.length}개에서 언급되고 있으며, 종합 AI 인용 점수는 ${score}점입니다. ${mentionedPlatforms.length < 3 ? "AI 인용을 높이기 위한 적극적인 개선이 필요합니다." : "현재 양호한 수준이나, 추가 최적화를 통해 더 높은 노출을 달성할 수 있습니다."}`;

  const recommendations: Recommendation[] = [];

  if (mentionedPlatforms.length < 5) {
    recommendations.push({
      priority: "high",
      category: "콘텐츠전략",
      title: "미노출 플랫폼 대응 콘텐츠 강화",
      description: `${notMentionedPlatforms.map(r => getPlatformName(r.platform)).join(", ")}에서 병원이 언급되지 않고 있습니다. 각 플랫폼의 학습 데이터에 병원 정보가 포함되도록 온라인 콘텐츠를 강화해야 합니다.`,
      expectedImpact: "3개월 내 언급 플랫폼 1~2개 추가 가능",
      actionItems: [
        "병원 공식 웹사이트에 전문 분야별 상세 콘텐츠 추가",
        "네이버 블로그/카페에 전문 의료 콘텐츠 정기 발행",
        "구글 비즈니스 프로필 최적화 (리뷰 관리, 사진 업데이트)",
        "의료 전문 포럼/커뮤니티에 전문가 답변 활동",
      ],
    });
  }

  recommendations.push({
    priority: "high",
    category: "기술SEO",
    title: "구조화 데이터 및 E-E-A-T 강화",
    description: "AI 검색엔진은 구조화된 데이터와 전문성(E-E-A-T)을 중시합니다. 병원 웹사이트의 기술적 SEO를 강화하면 AI 추천 확률이 높아집니다.",
    expectedImpact: "AI 인용 점수 15~25점 상승 가능",
    actionItems: [
      "Schema.org MedicalOrganization 마크업 추가",
      "의료진 프로필 페이지에 Physician 스키마 적용",
      "FAQ 페이지에 FAQPage 스키마 적용",
      "진료 후기/리뷰 페이지에 Review 스키마 적용",
    ],
  });

  recommendations.push({
    priority: "medium",
    category: "리뷰관리",
    title: "온라인 리뷰 및 평판 관리 강화",
    description: "AI 검색엔진은 실제 환자 리뷰와 평판을 중요한 추천 근거로 활용합니다.",
    expectedImpact: "감성 점수 20점 이상 개선 가능",
    actionItems: [
      "네이버 플레이스/구글 리뷰 적극 관리",
      "긍정 리뷰 유도 프로세스 구축",
      "부정 리뷰에 대한 전문적 대응 매뉴얼 작성",
    ],
  });

  if (Object.keys(competitorMentions).length > 0) {
    recommendations.push({
      priority: "medium",
      category: "경쟁대응",
      title: "경쟁사 대비 차별화 전략",
      description: `${Object.keys(competitorMentions).join(", ")} 등 경쟁 병원이 AI 검색에서 언급되고 있습니다. 차별화된 강점을 부각해야 합니다.`,
      expectedImpact: "경쟁사 대비 점수 10~20점 개선",
      actionItems: [
        "경쟁사 대비 차별화 포인트 정리 및 콘텐츠화",
        "전문 분야별 사례/실적 콘텐츠 강화",
        "환자 후기 및 비포/애프터 사례 공유",
      ],
    });
  }

  recommendations.push({
    priority: "low",
    category: "브랜딩",
    title: "AI 시대 브랜드 인지도 구축",
    description: "장기적으로 AI가 자연스럽게 추천하는 브랜드가 되기 위한 전략이 필요합니다.",
    expectedImpact: "6개월~1년 내 AI 인용 점수 30점 이상 상승",
    actionItems: [
      "의료 전문 매체 기고/인터뷰 활동",
      "학술 발표 및 연구 활동 강화",
      "소셜 미디어 전문가 브랜딩",
    ],
  });

  const platformAnalysis: PlatformAnalysis[] = data.results.map(r => ({
    platform: r.platform,
    status: r.mentioned ? "mentioned" as const : "not_mentioned" as const,
    rank: r.rank,
    sentiment: r.sentiment,
    analysis: r.mentioned
      ? `${getPlatformName(r.platform)}에서 ${r.rank ? `${r.rank}위로` : ""} 언급되고 있습니다. 감성은 ${r.sentiment === "positive" ? "긍정적" : r.sentiment === "negative" ? "부정적" : "중립적"}입니다.`
      : `${getPlatformName(r.platform)}에서 현재 언급되지 않고 있습니다. 해당 플랫폼의 학습 데이터에 병원 정보가 부족한 것으로 보입니다.`,
    improvementTip: r.mentioned
      ? "현재 노출을 유지하면서 순위를 높이기 위해 전문 콘텐츠를 지속적으로 발행하세요."
      : "해당 플랫폼이 참조하는 웹 소스(블로그, 뉴스, 리뷰)에 병원 정보를 적극적으로 노출하세요.",
  }));

  const competitorInsights: CompetitorInsight[] = Object.entries(competitorMentions).map(([name, platforms]) => ({
    competitorName: name,
    mentionedPlatforms: platforms,
    comparison: `${name}은(는) ${platforms.length}개 플랫폼에서 언급되고 있습니다.`,
    strategy: "해당 경쟁사가 노출되는 플랫폼에서 우리 병원도 노출될 수 있도록 콘텐츠 전략을 수립하세요.",
  }));

  const content = generateMarkdownReport(title, summary, data, recommendations, platformAnalysis, competitorInsights);

  return {
    title,
    summary,
    content,
    overallScore: score,
    recommendations,
    platformAnalysis,
    competitorInsights,
  };
}

/**
 * 전체 키워드에 대한 종합 리포트 생성
 */
export async function generateOverallReport(
  allData: MonitoringData[]
): Promise<ImprovementReport> {
  const totalKeywords = allData.length;
  const avgScore = allData.reduce((sum, d) => sum + (d.exposureScore?.score ?? 0), 0) / Math.max(totalKeywords, 1);
  const totalMentions = allData.reduce((sum, d) => sum + d.results.filter(r => r.mentioned).length, 0);
  const totalChecks = totalKeywords * 5;

  const keywordSummaries = allData.map(d => {
    const mentions = d.results.filter(r => r.mentioned).length;
    return `- "${d.keyword}" (${d.hospitalName}): ${mentions}/5 언급, ${d.exposureScore?.score ?? 0}점`;
  }).join("\n");

  const prompt = `당신은 병원 AI 마케팅 전문 컨설턴트입니다. 아래 전체 AI 모니터링 결과를 종합 분석하여 리포트를 작성해주세요.

## 전체 현황
- 총 모니터링 키워드: ${totalKeywords}개
- 평균 AI 인용 점수: ${Math.round(avgScore)}점
- 전체 언급률: ${totalMentions}/${totalChecks} (${Math.round(totalMentions / totalChecks * 100)}%)

## 키워드별 현황
${keywordSummaries}

다음 JSON 형식으로 종합 리포트를 작성해주세요:
{
  "title": "종합 리포트 제목",
  "summary": "3-4문장 종합 요약",
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "카테고리",
      "title": "개선 항목",
      "description": "상세 설명",
      "expectedImpact": "예상 효과",
      "actionItems": ["실행 항목"]
    }
  ],
  "platformAnalysis": [
    {
      "platform": "chatgpt|gemini|claude|perplexity|grok",
      "analysis": "플랫폼 종합 분석",
      "improvementTip": "개선 팁"
    }
  ],
  "competitorInsights": []
}

반드시 JSON만 출력하세요.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "당신은 병원 AI 마케팅 전문 컨설턴트입니다. 항상 유효한 JSON만 반환합니다." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "overall_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    category: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    expectedImpact: { type: "string" },
                    actionItems: { type: "array", items: { type: "string" } },
                  },
                  required: ["priority", "category", "title", "description", "expectedImpact", "actionItems"],
                  additionalProperties: false,
                },
              },
              platformAnalysis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    analysis: { type: "string" },
                    improvementTip: { type: "string" },
                  },
                  required: ["platform", "analysis", "improvementTip"],
                  additionalProperties: false,
                },
              },
              competitorInsights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    competitorName: { type: "string" },
                    comparison: { type: "string" },
                    strategy: { type: "string" },
                  },
                  required: ["competitorName", "comparison", "strategy"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "summary", "recommendations", "platformAnalysis", "competitorInsights"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("LLM 응답이 비어있습니다");
    const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent));

    const platformAnalysis: PlatformAnalysis[] = (parsed.platformAnalysis || []).map((pa: any) => ({
      platform: pa.platform,
      status: "mentioned" as const,
      rank: null,
      sentiment: "neutral",
      analysis: pa.analysis,
      improvementTip: pa.improvementTip,
    }));

    const overallData: MonitoringData = {
      keyword: "전체 키워드",
      hospitalName: "전체",
      specialty: "",
      results: [],
      exposureScore: { score: Math.round(avgScore), mentionScore: 0, rankScore: 0, sentimentScore: 0, competitorScore: 0 },
      competitors: [],
    };

    const content = generateMarkdownReport(
      parsed.title, parsed.summary, overallData,
      parsed.recommendations, platformAnalysis, []
    );

    return {
      title: parsed.title,
      summary: parsed.summary,
      content,
      overallScore: Math.round(avgScore),
      recommendations: parsed.recommendations,
      platformAnalysis,
      competitorInsights: [],
    };
  } catch (err) {
    console.error("[OverallReport] 생성 실패:", err);
    return {
      title: "AI 인용 종합 개선 리포트",
      summary: `총 ${totalKeywords}개 키워드 모니터링 결과, 평균 AI 인용 점수는 ${Math.round(avgScore)}점이며, 전체 언급률은 ${Math.round(totalMentions / totalChecks * 100)}%입니다.`,
      content: `# AI 인용 종합 개선 리포트\n\n총 ${totalKeywords}개 키워드, 평균 ${Math.round(avgScore)}점, 언급률 ${Math.round(totalMentions / totalChecks * 100)}%`,
      overallScore: Math.round(avgScore),
      recommendations: [],
      platformAnalysis: [],
      competitorInsights: [],
    };
  }
}

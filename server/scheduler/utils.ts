/**
 * scheduler/utils.ts — blog-scheduler에서 추출된 유틸리티 함수들
 * 순수 함수 또는 부수효과가 제한적인 헬퍼들을 모아 테스트 가능하게 분리
 */

// ── 콘텐츠 포맷팅 ──

export function formatBlogContent(content: string): string {
  let formatted = content;
  formatted = formatted.replace(/\r\n/g, '\n');
  // ## 와 ### 를 구분: negative lookahead로 ##뒤에 #이 오지 않는 경우만 매칭
  formatted = formatted.replace(/\n*(### [^\n]+)/g, '\n\n$1\n');
  formatted = formatted.replace(/\n*(## (?!#)[^\n]+)/g, '\n\n\n$1\n\n');
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  const lines = formatted.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('-') || line.startsWith('|') || line.trim() === '') {
      result.push(line);
      continue;
    }
    const sentences = line.split(/(?<=[.!?])\s+/);
    if (sentences.length > 5) {
      const mid = Math.ceil(sentences.length / 2);
      result.push(sentences.slice(0, mid).join(' '));
      result.push('');
      result.push(sentences.slice(mid).join(' '));
    } else {
      result.push(line);
    }
  }
  formatted = result.join('\n');
  formatted = formatted.trim();
  return formatted;
}

// ── 계절/시기 컨텍스트 ──

export function getSeasonalContext(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const seasonMap: Record<number, string> = {
    1: "겨울(1월) - 신년 건강검진, 보습/리프팅 시즌, 다이어트 결심",
    2: "겨울(2월) - 졸업/입학 시즌, 피부관리, 체형교정",
    3: "봄(3월) - 환절기 알레르기, 봄맞이 피부관리, 새학기 건강",
    4: "봄(4월) - 야외활동 증가, 자외선 차단, 관절건강",
    5: "봄(5월) - 가정의달 건강검진, 어버이날 효도검진",
    6: "여름(6월) - 제모/바디라인, 자외선관리, 여름철 피부",
    7: "여름(7월) - 휴가시즌 바디케어, 여름 피부트러블",
    8: "여름(8월) - 자외선 손상 회복, 가을 준비 피부관리",
    9: "가을(9월) - 환절기 건강, 탈모관리, 피부재생",
    10: "가을(10월) - 건조함 대비, 보습관리, 면역력",
    11: "가을(11월) - 겨울 준비, 보습/영양, 연말 이벤트 준비",
    12: "겨울(12월) - 연말 피부관리, 신년 준비, 건강검진",
  };
  return seasonMap[month] || "일반";
}

// ── 품질 검증 ──

export function validatePostQuality(parsed: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!parsed.title || parsed.title.length < 10) issues.push("제목이 너무 짧습니다 (최소 10자)");
  if (!parsed.content || parsed.content.length < 800) issues.push("본문이 너무 짧습니다 (최소 800자)");
  if (parsed.content && !parsed.content.includes("##")) issues.push("소제목(##)이 없습니다");
  if (parsed.title && parsed.title.length > 100) issues.push("제목이 너무 깁니다 (최대 100자)");
  if (parsed.content && parsed.content.length > 15000) issues.push("본문이 너무 깁니다 (최대 15000자)");
  // FAQ 구조 확인
  if (parsed.content && !parsed.content.includes("Q:") && !parsed.content.includes("질문")) {
    issues.push("FAQ 섹션이 없습니다");
  }
  return { valid: issues.length === 0, issues };
}

// ── 스케줄러 히스토리 ──

type HistoryType = "publish" | "keyword_gen" | "ai_monitor" | "followup_email" | "benchmark" | "chat_insight" | "auto_diagnosis" | "monthly_diagnosis" | "weekly_briefing";

interface HistoryEntry {
  type: HistoryType;
  success: boolean;
  detail: string;
  timestamp: Date;
}

const schedulerHistory: HistoryEntry[] = [];

export function addHistory(type: HistoryType, success: boolean, detail: string) {
  schedulerHistory.push({ type, success, detail, timestamp: new Date() });
  if (schedulerHistory.length > 100) schedulerHistory.shift();
}

export function getHistory(): HistoryEntry[] {
  return schedulerHistory;
}

// ── KST 시간 유틸 ──

export function getKSTTime() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    dayOfWeek: kst.getUTCDay(), // 0=일, 1=월, ..., 6=토
    date: kst.getUTCDate(),
    day: kst.getUTCDate(), // alias for date (used in todayKey)
    month: kst.getUTCMonth() + 1,
    year: kst.getUTCFullYear(),
    kstDate: kst,
  };
}

// ── 시간 체크 유틸 ──

export function isAiMonitorTime(): boolean {
  const { hour, minute } = getKSTTime();
  return hour === 6 && minute >= 0 && minute < 10;
}

export function isPublishTime(): boolean {
  const { hour, minute, dayOfWeek } = getKSTTime();
  return (dayOfWeek === 2 || dayOfWeek === 5) && hour === 10 && minute >= 0 && minute < 10;
}

export function isKeywordGenTime(): boolean {
  const { hour, minute, date } = getKSTTime();
  return date === 1 && hour === 0 && minute >= 10 && minute < 20;
}

// ── URL 정규화 ──

export function normalizeUrlForDiag(url: string): string {
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  try {
    const parsed = new URL(u);
    return parsed.origin + (parsed.pathname === "/" ? "/" : parsed.pathname);
  } catch {
    return u;
  }
}

// ── 주간 브리핑 포맷팅 ──

export function formatWeeklyBriefing(data: {
  period: { from: string; to: string };
  blog: { weekly: number; prevWeek: number; total: number };
  chat: { weeklySessions: number; weeklyInquiries: number; prevWeekSessions: number; prevWeekInquiries: number; totalSessions: number };
  diagnosis: { weekly: number; prevWeek: number; total: number };
  leads: { weekly: number; prevWeek: number; total: number };
  trials: { weekly: number; prevWeek: number };
  hospitals: { contracted: number };
}): string {
  function diff(curr: number, prev: number): string {
    const d = curr - prev;
    if (d === 0) return "";
    const pct = prev > 0 ? Math.round((d / prev) * 100) : 0;
    if (d > 0) return ` (▲${d}건, +${pct}%)`;
    return ` (▼${Math.abs(d)}건, ${pct}%)`;
  }
  const lines: string[] = [];
  lines.push(`📊 [MY비서] 주간 브리핑 (${data.period.from} ~ ${data.period.to})\n`);
  lines.push(`🔹 블로그 발행: ${data.blog.weekly}건${diff(data.blog.weekly, data.blog.prevWeek)} | 누적 ${data.blog.total}건`);
  lines.push(`🔹 채팅 세션: ${data.chat.weeklySessions}건${diff(data.chat.weeklySessions, data.chat.prevWeekSessions)} | 예약문의 ${data.chat.weeklyInquiries}건`);
  lines.push(`🔹 AI 진단: ${data.diagnosis.weekly}건${diff(data.diagnosis.weekly, data.diagnosis.prevWeek)} | 누적 ${data.diagnosis.total}건`);
  lines.push(`🔹 리드: ${data.leads.weekly}건${diff(data.leads.weekly, data.leads.prevWeek)} | 누적 ${data.leads.total}건`);
  lines.push(`🔹 체험판: ${data.trials.weekly}건${diff(data.trials.weekly, data.trials.prevWeek)}`);
  lines.push(`🔹 계약 병원: ${data.hospitals.contracted}개`);
  return lines.join("\n");
}

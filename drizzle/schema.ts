import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 문의 접수 테이블 — 무료 상담 신청 폼 데이터 저장
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "completed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * 블로그 카테고리 (업종별 허브)
 */
export const blogCategories = mysqlTable("blog_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = typeof blogCategories.$inferInsert;

/**
 * 블로그 글 — scheduledAt 추가 (예약 발행)
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  excerpt: varchar("excerpt", { length: 500 }).notNull(),
  content: text("content").notNull(),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  tags: text("tags"),
  readingTime: int("reading_time").default(5).notNull(),
  viewCount: int("view_count").default(0).notNull(),
  published: mysqlEnum("published", ["draft", "published", "scheduled"]).default("published").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * SNS 콘텐츠 생성 히스토리
 */
export const snsContents = mysqlTable("sns_contents", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["caption", "promotion", "guide"]).notNull(),
  input: text("input").notNull(),
  output: text("output").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SnsContent = typeof snsContents.$inferSelect;
export type InsertSnsContent = typeof snsContents.$inferInsert;

/**
 * SEO 키워드 등록 (자동 발행 스케줄러용)
 */
export const seoKeywords = mysqlTable("seo_keywords", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 200 }).notNull(),
  categoryId: int("category_id").notNull(),
  status: mysqlEnum("status", ["pending", "generating", "draft_ready", "review_done", "scheduled", "published"]).default("pending").notNull(),
  blogPostId: int("blog_post_id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeoKeyword = typeof seoKeywords.$inferSelect;
export type InsertSeoKeyword = typeof seoKeywords.$inferInsert;

/**
 * 챗봇 대화 세션 — 방문자별 대화 단위
 */
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("session_key", { length: 64 }).notNull().unique(),
  visitorName: varchar("visitor_name", { length: 100 }),
  visitorPhone: varchar("visitor_phone", { length: 30 }),
  visitorEmail: varchar("visitor_email", { length: 320 }),
  messageCount: int("message_count").default(0).notNull(),
  hasInquiry: int("has_inquiry").default(0).notNull(),
  // 인사이트 자동 추출 필드 (LLM 분석 결과)
  insightSpecialty: varchar("insight_specialty", { length: 100 }),
  insightIntentType: varchar("insight_intent_type", { length: 50 }),
  insightConversionLikelihood: varchar("insight_conversion_likelihood", { length: 20 }),
  insightSummary: text("insight_summary"),
  insightExtractedAt: timestamp("insight_extracted_at"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * 챗봇 대화 메시지 — 세션별 개별 메시지
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * AI 검색 모니터링 키워드 — 추적할 키워드 등록
 */
export const aiMonitorKeywords = mysqlTable("ai_monitor_keywords", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 200 }).notNull(),
  hospitalName: varchar("hospital_name", { length: 200 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMonitorKeyword = typeof aiMonitorKeywords.$inferSelect;
export type InsertAiMonitorKeyword = typeof aiMonitorKeywords.$inferInsert;

/**
 * AI 검색 모니터링 결과 — 각 AI 플랫폼별 응답 기록
 */
export const aiMonitorResults = mysqlTable("ai_monitor_results", {
  id: int("id").autoincrement().primaryKey(),
  keywordId: int("keyword_id").notNull(),
  platform: mysqlEnum("platform", ["chatgpt", "gemini", "claude", "perplexity", "grok"]).notNull(),
  query: varchar("query", { length: 500 }).notNull(),
  response: text("response").notNull(),
  mentioned: int("mentioned").default(0).notNull(),
  mentionContext: text("mention_context"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  rank: int("rank"),
  competitorsMentioned: text("competitors_mentioned"),
  mentionPosition: varchar("mention_position", { length: 20 }),
  recommendationType: varchar("recommendation_type", { length: 50 }),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMonitorResult = typeof aiMonitorResults.$inferSelect;
export type InsertAiMonitorResult = typeof aiMonitorResults.$inferInsert;

/**
 * SEO 진단 리드 (잠재 고객) — 이메일 발송 시 수집
 */
export const seoLeads = mysqlTable("seo_leads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  totalScore: int("total_score"),
  grade: varchar("grade", { length: 10 }),
  aiScore: int("ai_score"),
  source: mysqlEnum("source", ["seo_checker", "seo_compare"]).default("seo_checker").notNull(),
  status: mysqlEnum("status", ["new", "consulting", "contracted", "lost"]).default("new").notNull(),
  followup3dSent: int("followup_3d_sent").default(0).notNull(),
  followup7dSent: int("followup_7d_sent").default(0).notNull(),
  note: text("note"),
  priority: int("priority").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeoLead = typeof seoLeads.$inferSelect;
export type InsertSeoLead = typeof seoLeads.$inferInsert;

/**
 * 진단 이력 — 같은 URL의 재진단 시 점수 변화 추적
 */
export const diagnosisHistory = mysqlTable("diagnosis_history", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 2048 }).notNull(),
  totalScore: int("total_score").notNull(),
  aiScore: int("ai_score").default(0).notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  region: varchar("region", { length: 100 }),
  categoryScores: text("category_scores"), // JSON: { categoryName: score }
  diagnosedAt: timestamp("diagnosed_at").defaultNow().notNull(),
});

export type DiagnosisHistory = typeof diagnosisHistory.$inferSelect;
export type InsertDiagnosisHistory = typeof diagnosisHistory.$inferInsert;

/**
 * 뉴스레터 구독자 — AI 노출 트렌드 뉴스레터
 */
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  hospitalName: varchar("hospital_name", { length: 200 }),
  specialty: varchar("specialty", { length: 100 }),
  isActive: int("is_active").default(1).notNull(),
  source: varchar("source", { length: 50 }).default("website").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * 벤치마크 데이터 — 진료과별/지역별 평균 점수 집계
 */
export const benchmarkData = mysqlTable("benchmark_data", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 20 }).notNull(), // e.g. "2026-03"
  specialty: varchar("specialty", { length: 100 }),
  region: varchar("region", { length: 100 }),
  avgTotalScore: int("avg_total_score").default(0).notNull(),
  avgAiScore: int("avg_ai_score").default(0).notNull(),
  sampleCount: int("sample_count").default(0).notNull(),
  topPercentile: int("top_percentile").default(0).notNull(), // 상위 10% 점수
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BenchmarkData = typeof benchmarkData.$inferSelect;
export type InsertBenchmarkData = typeof benchmarkData.$inferInsert;

/**
 * 월간 어워드 — 이달의 AI 노출 우수 병원
 */
export const monthlyAwards = mysqlTable("monthly_awards", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 20 }).notNull(), // e.g. "2026-03"
  url: varchar("url", { length: 2048 }).notNull(),
  hospitalName: varchar("hospital_name", { length: 200 }),
  specialty: varchar("specialty", { length: 100 }),
  totalScore: int("total_score").notNull(),
  aiScore: int("ai_score").default(0).notNull(),
  rank: int("rank").notNull(),
  badgeType: mysqlEnum("badge_type", ["gold", "silver", "bronze", "top10", "top30"]).default("top30").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonthlyAward = typeof monthlyAwards.$inferSelect;
export type InsertMonthlyAward = typeof monthlyAwards.$inferInsert;


/**
 * 병원 프로필 — SaaS 대시보드용 고객 병원 정보
 * 로그인한 사용자가 자기 병원을 등록하고 대시보드에서 현황을 볼 수 있음
 */
export const hospitalProfiles = mysqlTable("hospital_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // users.id 참조
  hospitalName: varchar("hospital_name", { length: 200 }).notNull(),
  hospitalUrl: varchar("hospital_url", { length: 2048 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  region: varchar("region", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  plan: mysqlEnum("plan", ["free", "basic", "pro", "enterprise"]).default("free").notNull(),
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HospitalProfile = typeof hospitalProfiles.$inferSelect;
export type InsertHospitalProfile = typeof hospitalProfiles.$inferInsert;

/**
 * AI 노출 종합 점수 — 키워드별 주간 AI 노출 점수 기록
 */
export const aiExposureScores = mysqlTable("ai_exposure_scores", {
  id: int("id").autoincrement().primaryKey(),
  keywordId: int("keyword_id").notNull(),
  score: int("score").notNull().default(0),
  mentionScore: int("mention_score").notNull().default(0),
  rankScore: int("rank_score").notNull().default(0),
  sentimentScore: int("sentiment_score").notNull().default(0),
  competitorScore: int("competitor_score").notNull().default(0),
  platformScores: json("platform_scores"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiExposureScore = typeof aiExposureScores.$inferSelect;
export type InsertAiExposureScore = typeof aiExposureScores.$inferInsert;

/**
 * AI 모니터링 경쟁사 — 키워드별 경쟁 병원 등록
 */
export const aiMonitorCompetitors = mysqlTable("ai_monitor_competitors", {
  id: int("id").autoincrement().primaryKey(),
  keywordId: int("keyword_id").notNull(),
  competitorName: varchar("competitor_name", { length: 200 }).notNull(),
  competitorUrl: varchar("competitor_url", { length: 2048 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiMonitorCompetitor = typeof aiMonitorCompetitors.$inferSelect;
export type InsertAiMonitorCompetitor = typeof aiMonitorCompetitors.$inferInsert;

/**
 * AI 노출 개선 리포트 — 키워드별 AI 노출 개선 방안 자동 생성
 */
export const aiImprovementReports = mysqlTable("ai_improvement_reports", {
  id: int("id").autoincrement().primaryKey(),
  keywordId: int("keyword_id"),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  overallScore: int("overall_score").default(0).notNull(),
  recommendations: text("recommendations"), // JSON array of recommendations
  platformAnalysis: text("platform_analysis"), // JSON: platform-by-platform analysis
  competitorInsights: text("competitor_insights"), // JSON: competitor comparison insights
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiImprovementReport = typeof aiImprovementReports.$inferSelect;
export type InsertAiImprovementReport = typeof aiImprovementReports.$inferInsert;

/**
 * 사용자 행동 이벤트 로깅 — 주요 사용자 행동 자동 기록
 */
export const userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // page_view, diagnosis_run, report_download, newsletter_subscribe, chat_start, contact_submit, blog_view, share_click
  page: varchar("page", { length: 500 }),
  metadata: text("metadata"), // JSON: 추가 정보 (URL, 점수, 진료과 등)
  sessionId: varchar("session_id", { length: 64 }), // 채팅 세션 또는 브라우저 세션
  visitorId: varchar("visitor_id", { length: 64 }), // 익명 방문자 식별자
  userId: int("user_id"), // 로그인한 사용자
  ipHash: varchar("ip_hash", { length: 64 }), // IP 해시 (개인정보 보호)
  userAgent: varchar("user_agent", { length: 500 }),
  referrer: varchar("referrer", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;


/**
 * 시즌별 마케팅 캘린더 — 진료과별 월별 추천 키워드/이벤트
 */
export const seasonalCalendar = mysqlTable("seasonal_calendar", {
  id: int("id").autoincrement().primaryKey(),
  specialty: varchar("specialty", { length: 100 }).notNull(),
  month: int("month").notNull(), // 1~12
  keyword: varchar("keyword", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["시술", "이벤트", "건강정보", "프로모션"]).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  tips: text("tips"), // 마케팅 팁/제안
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SeasonalCalendar = typeof seasonalCalendar.$inferSelect;
export type InsertSeasonalCalendar = typeof seasonalCalendar.$inferInsert;

/**
 * 사이트 방문 로그 — 병원 웹사이트 추적 코드(track.js)에서 수집
 */
export const siteVisits = mysqlTable("site_visits", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospital_id").notNull(),
  visitorId: varchar("visitor_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  channel: mysqlEnum("channel", ["ai_chatgpt", "ai_gemini", "ai_claude", "ai_perplexity", "ai_copilot", "ai_other", "naver", "google", "sns_instagram", "sns_youtube", "sns_blog", "direct", "referral", "other"]).default("other").notNull(),
  referrer: varchar("referrer", { length: 2048 }),
  landingPage: varchar("landing_page", { length: 2048 }).notNull(),
  pageUrl: varchar("page_url", { length: 2048 }).notNull(),
  pageTitle: varchar("page_title", { length: 500 }),
  deviceType: mysqlEnum("device_type", ["desktop", "mobile", "tablet"]).default("desktop").notNull(),
  country: varchar("country", { length: 10 }),
  duration: int("duration").default(0),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});
export type SiteVisit = typeof siteVisits.$inferSelect;
export type InsertSiteVisit = typeof siteVisits.$inferInsert;

/**
 * 상담 문의 — 병원 웹사이트 상담 폼에서 수집
 */
export const consultationInquiries = mysqlTable("consultation_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospital_id").notNull(),
  patientName: varchar("patient_name", { length: 100 }),
  patientPhone: varchar("patient_phone", { length: 30 }),
  patientEmail: varchar("patient_email", { length: 320 }),
  treatmentType: varchar("treatment_type", { length: 200 }),
  message: text("message"),
  channel: varchar("channel", { length: 50 }),
  status: mysqlEnum("status", ["pending", "contacted", "completed", "cancelled"]).default("pending").notNull(),
  contactedAt: timestamp("contacted_at"),
  note: text("note"),
  visitorId: varchar("visitor_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ConsultationInquiry = typeof consultationInquiries.$inferSelect;
export type InsertConsultationInquiry = typeof consultationInquiries.$inferInsert;

/**
 * 월간 리포트 — 자동 생성된 월간 성과 리포트
 */
export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospital_id").notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(),
  seoScore: int("seo_score"),
  seoScoreChange: int("seo_score_change"),
  aiExposureScore: int("ai_exposure_score"),
  aiExposureChange: int("ai_exposure_change"),
  totalVisits: int("total_visits").default(0),
  aiChannelVisits: int("ai_channel_visits").default(0),
  naverVisits: int("naver_visits").default(0),
  googleVisits: int("google_visits").default(0),
  snsVisits: int("sns_visits").default(0),
  directVisits: int("direct_visits").default(0),
  totalInquiries: int("total_inquiries").default(0),
  conversionRate: varchar("conversion_rate", { length: 10 }),
  summary: text("summary"),
  recommendations: text("recommendations"),
  pdfUrl: varchar("pdf_url", { length: 2048 }),
  shareToken: varchar("share_token", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = typeof monthlyReports.$inferInsert;

/**
 * 관리자 알림 — 새 상담, 진단 완료, 시스템 이벤트 등
 */
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message"),
  metadata: json("metadata"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;


/**
 * 병원 정보 항목 — 원장님이 직접 관리하는 병원 상세 정보
 * 가격표, 진료시간, 이벤트, FAQ 등 카테고리별 정보 저장
 */
export const hospitalInfoItems = mysqlTable("hospital_info_items", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospital_id").notNull(),
  category: mysqlEnum("category", ["price", "hours", "event", "faq", "notice"]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type HospitalInfoItem = typeof hospitalInfoItems.$inferSelect;
export type InsertHospitalInfoItem = typeof hospitalInfoItems.$inferInsert;


/**
 * AI 블로그 무료 체험 로그 — 비로그인 사용자의 체험 기록
 */
export const aiBlogTrials = mysqlTable("ai_blog_trials", {
  id: int("id").autoincrement().primaryKey(),
  hospitalName: varchar("hospital_name", { length: 200 }).notNull(),
  specialty: varchar("specialty", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 300 }),
  generatedTitle: varchar("generated_title", { length: 500 }),
  generatedContent: text("generated_content"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userId: int("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AiBlogTrial = typeof aiBlogTrials.$inferSelect;
export type InsertAiBlogTrial = typeof aiBlogTrials.$inferInsert;

/**
 * AI 콘텐츠 생성 로그 — AI 허브에서 생성한 모든 콘텐츠 기록 (블로그, 카드뉴스, 영상 스크립트)
 */
export const aiContentLogs = mysqlTable("ai_content_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  contentType: mysqlEnum("content_type", ["blog", "cardnews", "video_script", "poster"]).notNull(),
  hospitalName: varchar("hospital_name", { length: 200 }),
  specialty: varchar("specialty", { length: 100 }),
  prompt: text("prompt"),
  generatedTitle: varchar("generated_title", { length: 500 }),
  generatedContent: text("generated_content"),
  generatedImageUrl: text("generated_image_url"),
  presetId: varchar("preset_id", { length: 100 }),
  reviewVerdict: mysqlEnum("review_verdict", ["pass", "warning", "fail"]),
  reviewScore: int("review_score"),
  reviewIssues: text("review_issues"),
  reviewSummary: text("review_summary"),
  revisedContent: text("revised_content"),
  naverPublished: int("naver_published").default(0),
  naverPostUrl: text("naver_post_url"),
  naverPublishedAt: timestamp("naver_published_at"),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AiContentLog = typeof aiContentLogs.$inferSelect;
export type InsertAiContentLog = typeof aiContentLogs.$inferInsert;

/**
 * 카드뉴스/포스터 템플릿 — 진료과별 사전 정의 템플릿
 */
export const cardnewsTemplates = mysqlTable("cardnews_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  specialty: varchar("specialty", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["event", "info", "seasonal", "review", "before_after"]).notNull(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  sampleImageUrl: text("sample_image_url"),
  isActive: int("is_active").default(1).notNull(),
  usageCount: int("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CardnewsTemplate = typeof cardnewsTemplates.$inferSelect;
export type InsertCardnewsTemplate = typeof cardnewsTemplates.$inferInsert;


/**
 * 프리미엄 벤치마킹 리포트 — 경쟁사 분석 + Actionable Insights
 * PDF 2 - 1절: 병원 원장님 대상 경쟁사 분석 리포트
 */
export const benchmarkingReports = mysqlTable("benchmarking_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  hospitalName: varchar("hospital_name", { length: 200 }).notNull(),
  hospitalUrl: varchar("hospital_url", { length: 2048 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  // 경쟁사 정보 (최대 3개)
  competitors: text("competitors").notNull(), // JSON: [{name, url, score, grade}]
  // 분석 결과
  myScore: int("my_score").notNull(),
  myGrade: varchar("my_grade", { length: 10 }).notNull(),
  // AI 생성 리포트 내용
  reportTitle: varchar("report_title", { length: 500 }).notNull(),
  executiveSummary: text("executive_summary").notNull(), // 핵심 요약
  categoryComparison: text("category_comparison").notNull(), // JSON: 카테고리별 비교 데이터
  actionableInsights: text("actionable_insights").notNull(), // JSON: 즉각 실행 가능한 지침들
  snsMarketingTips: text("sns_marketing_tips"), // JSON: SNS 마케팅 팁 (PDF 1 - 1절 ②)
  weeklyPlan: text("weekly_plan"), // JSON: 주간 실행 계획
  // 메타데이터
  status: mysqlEnum("report_status", ["generating", "completed", "failed"]).default("generating").notNull(),
  pdfUrl: text("pdf_url"),
  shareToken: varchar("share_token", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BenchmarkingReport = typeof benchmarkingReports.$inferSelect;
export type InsertBenchmarkingReport = typeof benchmarkingReports.$inferInsert;


/**
 * 이메일 연락처 통합 테이블 — 모든 이메일 데이터를 한곳에 수집/관리
 * seoLeads, newsletterSubscribers 등 다양한 출처에서 수집된 이메일을 통합
 */
export const emailContacts = mysqlTable("email_contacts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 100 }),
  hospitalName: varchar("hospital_name", { length: 200 }),
  specialty: varchar("specialty", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  // 출처 추적
  source: mysqlEnum("email_source", [
    "seo_checker", "seo_compare", "newsletter", "benchmarking_report",
    "consultation", "blog_subscribe", "manual", "import"
  ]).default("manual").notNull(),
  // 태그 (JSON 배열) — 세분화된 분류
  tags: json("tags").$type<string[]>(),
  // 마케팅 동의
  marketingConsent: boolean("marketing_consent").default(true).notNull(),
  // 상태
  status: mysqlEnum("contact_status", ["active", "unsubscribed", "bounced"]).default("active").notNull(),
  // SEO 관련 데이터 (진단 결과가 있는 경우)
  lastDiagnosisUrl: varchar("last_diagnosis_url", { length: 2048 }),
  lastDiagnosisScore: int("last_diagnosis_score"),
  lastDiagnosisGrade: varchar("last_diagnosis_grade", { length: 10 }),
  // 활동 추적
  totalEmailsSent: int("total_emails_sent").default(0).notNull(),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  totalEmailsOpened: int("total_emails_opened").default(0).notNull(),
  lastOpenedAt: timestamp("last_opened_at"),
  // 메모
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type EmailContact = typeof emailContacts.$inferSelect;
export type InsertEmailContact = typeof emailContacts.$inferInsert;

/**
 * 이메일 발송 로그 — 모든 이메일 발송 이력 추적
 */
export const emailSendLogs = mysqlTable("email_send_logs", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contact_id"),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // diagnosis, benchmarking, monthly_report, followup, newsletter
  status: mysqlEnum("send_status", ["sent", "failed", "bounced"]).default("sent").notNull(),
  metadata: json("metadata"), // 추가 데이터 (리포트 ID, URL 등)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EmailSendLog = typeof emailSendLogs.$inferSelect;
export type InsertEmailSendLog = typeof emailSendLogs.$inferInsert;


// ===== 40차: 시술 상세페이지 + 자동화 + 마케팅 채널 =====

// 시술 상세페이지
export const treatmentPages = mysqlTable("treatment_pages", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  hospitalId: int("hospital_id"),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  treatmentName: varchar("treatment_name", { length: 200 }).notNull(),
  treatmentCategory: varchar("treatment_category", { length: 100 }),
  heroTitle: varchar("hero_title", { length: 500 }),
  heroSubtitle: varchar("hero_subtitle", { length: 500 }),
  heroDescription: text("hero_description"),
  heroImageUrl: text("hero_image_url"),
  sections: json("sections"), // JSON array of section blocks
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: varchar("seo_description", { length: 500 }),
  seoKeywords: text("seo_keywords"),
  themeColor: varchar("theme_color", { length: 20 }).default("#6B46C1"),
  ctaPhone: varchar("cta_phone", { length: 30 }),
  ctaKakao: varchar("cta_kakao", { length: 200 }),
  ctaNaver: varchar("cta_naver", { length: 200 }),
  hospitalName: varchar("hospital_name", { length: 200 }),
  hospitalLogo: text("hospital_logo"),
  doctorName: varchar("doctor_name", { length: 100 }),
  doctorTitle: varchar("doctor_title", { length: 200 }),
  doctorImageUrl: text("doctor_image_url"),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, published, archived
  publishedAt: timestamp("published_at"),
  viewCount: int("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type TreatmentPage = typeof treatmentPages.$inferSelect;
export type InsertTreatmentPage = typeof treatmentPages.$inferInsert;

// 자동화 규칙
export const automationRules = mysqlTable("automation_rules", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  hospitalId: int("hospital_id"),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // booking_confirm, reminder_d1, review_request_d3, monthly_report
  name: varchar("name", { length: 200 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  channel: varchar("channel", { length: 30 }).default("email").notNull(), // email, sms, kakao
  templateContent: text("template_content"),
  triggerConfig: json("trigger_config"), // timing, conditions etc
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: int("trigger_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

// 자동화 실행 로그
export const automationLogs = mysqlTable("automation_logs", {
  id: int("id").primaryKey().autoincrement(),
  ruleId: int("rule_id").notNull(),
  userId: int("user_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 300 }),
  recipientPhone: varchar("recipient_phone", { length: 30 }),
  channel: varchar("channel", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // sent, failed, pending
  errorMessage: text("error_message"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AutomationLog = typeof automationLogs.$inferSelect;

// 마케팅 콘텐츠 (OSMU)
export const marketingContent = mysqlTable("marketing_content", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  hospitalId: int("hospital_id"),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // treatment_page, manual, ai_generated
  sourceId: int("source_id"),
  channel: varchar("channel", { length: 30 }).notNull(), // blog, instagram, kakao, all
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  imageUrls: json("image_urls"),
  hashtags: text("hashtags"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, scheduled, published, failed
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type MarketingContent = typeof marketingContent.$inferSelect;
export type InsertMarketingContent = typeof marketingContent.$inferInsert;


// ===== 카카오톡 예약하기 연동 =====
export const kakaoBookingSettings = mysqlTable("kakao_booking_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  hospitalId: int("hospital_id"),
  kakaoChannelId: varchar("kakao_channel_id", { length: 100 }),
  kakaoChannelName: varchar("kakao_channel_name", { length: 200 }),
  kakaoChannelUrl: varchar("kakao_channel_url", { length: 500 }),
  isActive: boolean("is_active").default(false).notNull(),
  defaultDuration: int("default_duration").default(30).notNull(), // 기본 시술 시간(분)
  maxDailySlots: int("max_daily_slots").default(20).notNull(),
  workingHoursStart: varchar("working_hours_start", { length: 5 }).default("09:00").notNull(),
  workingHoursEnd: varchar("working_hours_end", { length: 5 }).default("18:00").notNull(),
  lunchStart: varchar("lunch_start", { length: 5 }).default("12:00"),
  lunchEnd: varchar("lunch_end", { length: 5 }).default("13:00"),
  closedDays: json("closed_days").$type<number[]>(), // 0=일요일
  bookingNotice: text("booking_notice"),
  autoConfirm: boolean("auto_confirm").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type KakaoBookingSetting = typeof kakaoBookingSettings.$inferSelect;
export type InsertKakaoBookingSetting = typeof kakaoBookingSettings.$inferInsert;

export const bookingSlots = mysqlTable("booking_slots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  settingId: int("setting_id").notNull(),
  treatmentName: varchar("treatment_name", { length: 200 }).notNull(),
  treatmentCategory: varchar("treatment_category", { length: 100 }),
  duration: int("duration").notNull(), // 시술 시간(분)
  price: int("price"), // 가격 (원)
  priceNote: varchar("price_note", { length: 200 }), // "상담 후 결정" 등
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BookingSlot = typeof bookingSlots.$inferSelect;
export type InsertBookingSlot = typeof bookingSlots.$inferInsert;


// ── 43차: 콘텐츠 공장 시스템 + AI 영상 마케팅 ──

export const contentStyleGuides = mysqlTable("content_style_guides", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalId: int("hospital_id"),
  brandColor: varchar("brand_color", { length: 50 }),
  subColors: text("sub_colors"),
  fontStyle: varchar("font_style", { length: 100 }),
  toneOfVoice: varchar("tone_of_voice", { length: 100 }),
  targetAudience: text("target_audience"),
  brandKeywords: text("brand_keywords"),
  doList: text("do_list"),
  dontList: text("dont_list"),
  referenceUrls: text("reference_urls"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ContentStyleGuide = typeof contentStyleGuides.$inferSelect;

export const contentIdeas = mysqlTable("content_ideas", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalId: int("hospital_id"),
  title: varchar("title", { length: 500 }).notNull(),
  sourceUrl: text("source_url"),
  sourceType: varchar("source_type", { length: 50 }),
  platform: varchar("platform", { length: 50 }),
  category: varchar("category", { length: 100 }),
  whyItWorks: text("why_it_works"),
  viewCount: varchar("view_count", { length: 50 }),
  thumbnailUrl: text("thumbnail_url"),
  notes: text("notes"),
  status: varchar("status", { length: 30 }).default("collected").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ContentIdea = typeof contentIdeas.$inferSelect;

export const contentHooks = mysqlTable("content_hooks", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hookText: text("hook_text").notNull(),
  hookType: varchar("hook_type", { length: 50 }),
  platform: varchar("platform", { length: 50 }),
  category: varchar("category", { length: 100 }),
  sourceIdeaId: int("source_idea_id"),
  effectiveness: varchar("effectiveness", { length: 20 }),
  usageCount: int("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ContentHook = typeof contentHooks.$inferSelect;

export const contentScripts = mysqlTable("content_scripts", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalId: int("hospital_id"),
  title: varchar("title", { length: 500 }).notNull(),
  hookId: int("hook_id"),
  ideaId: int("idea_id"),
  platform: varchar("platform", { length: 50 }),
  scriptType: varchar("script_type", { length: 50 }),
  duration: varchar("duration", { length: 30 }),
  hookSection: text("hook_section"),
  bodySection: text("body_section"),
  ctaSection: text("cta_section"),
  fullScript: text("full_script"),
  hashtags: text("hashtags"),
  status: varchar("status", { length: 30 }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ContentScript = typeof contentScripts.$inferSelect;

export const contentCalendar = mysqlTable("content_calendar", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalId: int("hospital_id"),
  title: varchar("title", { length: 500 }).notNull(),
  scriptId: int("script_id"),
  platform: varchar("platform", { length: 50 }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 10 }),
  status: varchar("status", { length: 30 }).default("planned").notNull(),
  publishedUrl: text("published_url"),
  performance: text("performance"),
  notes: text("notes"),
  /** 인터뷰 콘텐츠 연동: 원본 인터뷰 영상 ID */
  interviewVideoId: int("interview_video_id"),
  /** 콘텐츠 타입: blog / cardnews / shortform */
  contentType: varchar("content_type", { length: 30 }),
  /** 콘텐츠 인덱스 (블로그 0~2, 카드뉴스 0~4, 숏폼 0~4) */
  contentIndex: int("content_index"),
  /** 콘텐츠 미리보기 요약 */
  contentSummary: text("content_summary"),
  /** 콘텐츠 색상 태그 (UI 표시용) */
  colorTag: varchar("color_tag", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ContentCalendarItem = typeof contentCalendar.$inferSelect;

export const videoPrompts = mysqlTable("video_prompts", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalId: int("hospital_id"),
  treatmentName: varchar("treatment_name", { length: 200 }).notNull(),
  videoType: varchar("video_type", { length: 50 }).notNull(),
  targetPlatform: varchar("target_platform", { length: 50 }),
  prompt: text("prompt").notNull(),
  script: text("script"),
  duration: varchar("duration", { length: 30 }),
  style: varchar("style", { length: 100 }),
  musicSuggestion: text("music_suggestion"),
  hashtags: text("hashtags"),
  status: varchar("status", { length: 30 }).default("generated").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type VideoPrompt = typeof videoPrompts.$inferSelect;


/**
 * 44차: 브랜드 DNA 프로필 — 병원 URL에서 추출한 브랜드 정보
 */
export const adBrandProfiles = mysqlTable("ad_brand_profiles", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalUrl: varchar("hospital_url", { length: 500 }).notNull(),
  hospitalName: varchar("hospital_name", { length: 200 }),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 20 }),
  secondaryColor: varchar("secondary_color", { length: 20 }),
  accentColor: varchar("accent_color", { length: 20 }),
  fontStyle: varchar("font_style", { length: 100 }),
  toneOfVoice: varchar("tone_of_voice", { length: 100 }),
  targetAudience: text("target_audience"),
  brandKeywords: text("brand_keywords"),
  specialties: text("specialties"),
  brandSummary: text("brand_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AdBrandProfile = typeof adBrandProfiles.$inferSelect;

/**
 * 44차: AI 광고 크리에이티브 — 생성된 광고 에셋 (이미지+카피)
 */
export const adCreatives = mysqlTable("ad_creatives", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  brandProfileId: int("brand_profile_id"),
  platform: varchar("platform", { length: 50 }).notNull(),
  adType: varchar("ad_type", { length: 50 }).notNull(),
  treatmentName: varchar("treatment_name", { length: 200 }),
  headline: varchar("headline", { length: 300 }),
  bodyText: text("body_text"),
  ctaText: varchar("cta_text", { length: 100 }),
  imageUrl: text("image_url"),
  imagePrompt: text("image_prompt"),
  dimensions: varchar("dimensions", { length: 30 }),
  hashtags: text("hashtags"),
  complianceStatus: varchar("compliance_status", { length: 30 }).default("unchecked"),
  complianceNotes: text("compliance_notes"),
  isFavorite: int("is_favorite").default(0),
  status: varchar("status", { length: 30 }).default("generated").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdCreative = typeof adCreatives.$inferSelect;


/**
 * 원장님 인터뷰 영상 → 멀티포맷 콘텐츠 자동 생산
 */
export const interviewVideos = mysqlTable("interview_videos", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  hospitalId: int("hospital_id"),
  /** 원본 영상 S3 URL */
  videoUrl: text("video_url").notNull(),
  videoFileKey: varchar("video_file_key", { length: 500 }).notNull(),
  /** 영상 파일명 */
  fileName: varchar("file_name", { length: 300 }),
  /** 영상 길이 (초) */
  durationSec: int("duration_sec"),
  /** 영상 파일 크기 (bytes) */
  fileSizeBytes: int("file_size_bytes"),
  /** Whisper 트랜스크립트 원문 */
  transcript: text("transcript"),
  /** 트랜스크립트 언어 */
  transcriptLang: varchar("transcript_lang", { length: 10 }),
  /** 처리 상태: uploading → transcribing → generating → completed / error */
  status: varchar("status", { length: 30 }).default("uploading").notNull(),
  errorMessage: text("error_message"),
  /** 생성된 블로그 콘텐츠 (JSON array of 3) */
  blogContents: text("blog_contents"),
  /** 생성된 인스타 카드뉴스 (JSON array of 5) */
  cardnewsContents: text("cardnews_contents"),
  /** 생성된 숏폼 스크립트 (JSON array of 5) */
  shortformContents: text("shortform_contents"),
  /** 원장님 이름/직함 (콘텐츠 톤 유지용) */
  doctorName: varchar("doctor_name", { length: 100 }),
  /** 병원명 */
  hospitalName: varchar("hospital_name", { length: 200 }),
  /** 시술/주제 키워드 */
  topicKeyword: varchar("topic_keyword", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type InterviewVideo = typeof interviewVideos.$inferSelect;

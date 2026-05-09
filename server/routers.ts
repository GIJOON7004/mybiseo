import { systemRouter } from "./_core/systemRouter";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";

// === 분할된 라우터 import ===
import { adFactoryRouter } from "./routes/adFactory";
import { interviewContentRouter } from "./routes/interviewContent";
import { llmMonitorRouter } from "./routes/llmMonitor";
import { aiHubRouter } from "./routes/aiHub";
import { aiMonitorRouter } from "./routes/aiMonitor";
import { analyticsRouter } from "./routes/analytics";
import { automationRouter } from "./routes/automation";
import { benchmarkingReportRouter, benchmarkingPdfRouter } from "./routes/benchmarkingReport";
import { blogRouter, blogSchedulerRouter } from "./routes/blog";
import { chatRouter, chatInsightRouter } from "./routes/chat";
import { contentFactoryRouter } from "./routes/contentFactory";
import { seoEmailRouter, emailContactRouter, retargetEmailRouter } from "./routes/email";
import { inquiryRouter, kakaoBookingRouter, aiSnsTipsRouter } from "./routes/engagement";
import { myHospitalRouter, myHospitalExtendedRouter, hospitalInfoRouter } from "./routes/hospital";
import { marketingChannelRouter, videoMarketingRouter, marketingDashboardRouter } from "./routes/marketingChannel";
import { monthlyReportRouter, adminDashboardRouter } from "./routes/report";
import { seoKeywordRouter, seoAnalyzerRouter } from "./routes/seo";
import { snsRouter } from "./routes/sns";
import { treatmentPageRouter } from "./routes/treatmentPage";
import { abtestRouter, diagnosisAutomationRouter } from "./routes/abtest";
import {
  notificationRouter, seoDashboardRouter, seoLeadsRouter, diagnosisRouter,
  newsletterRouter, awardsRouter, batchDiagnosisRouter, userEventRouter,
  monthlyBenchmarkRouter, leadScoringRouter, seasonalCalendarRouter,
  competitorAnalysisRouter, autoOptimizerRouter, trackingRouter, crmRouter,
} from "./routes/misc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  inquiry: inquiryRouter,
  notification: notificationRouter,
  blog: blogRouter,
  sns: snsRouter,
  seoKeyword: seoKeywordRouter,
  seoDashboard: seoDashboardRouter,
  blogScheduler: blogSchedulerRouter,
  abtest: abtestRouter,
  diagnosisAutomation: diagnosisAutomationRouter,
  chat: chatRouter,
  seoAnalyzer: seoAnalyzerRouter,
  aiMonitor: aiMonitorRouter,
  seoLeads: seoLeadsRouter,
  monthlyReport: monthlyReportRouter,
  seoEmail: seoEmailRouter,
  diagnosis: diagnosisRouter,
  newsletter: newsletterRouter,
  awards: awardsRouter,
  adminDashboard: adminDashboardRouter,
  batchDiagnosis: batchDiagnosisRouter,
  retargetEmail: retargetEmailRouter,
  myHospital: myHospitalRouter,
  chatInsight: chatInsightRouter,
  userEvent: userEventRouter,
  monthlyBenchmark: monthlyBenchmarkRouter,
  leadScoring: leadScoringRouter,
  seasonalCalendar: seasonalCalendarRouter,
  competitorAnalysis: competitorAnalysisRouter,
  autoOptimizer: autoOptimizerRouter,
  myHospitalExtended: myHospitalExtendedRouter,
  tracking: trackingRouter,
  analytics: analyticsRouter,
  hospitalInfo: hospitalInfoRouter,
  crm: crmRouter,
  aiHub: aiHubRouter,
  benchmarkingReport: benchmarkingReportRouter,
  emailContact: emailContactRouter,
  benchmarkingPdf: benchmarkingPdfRouter,
  aiSnsTips: aiSnsTipsRouter,
  treatmentPage: treatmentPageRouter,
  automation: automationRouter,
  marketingChannel: marketingChannelRouter,
  kakaoBooking: kakaoBookingRouter,
  contentFactory: contentFactoryRouter,
  videoMarketing: videoMarketingRouter,
  marketingDashboard: marketingDashboardRouter,
  adFactory: adFactoryRouter,
  interviewContent: interviewContentRouter,
  llmMonitor: llmMonitorRouter,
});
export type AppRouter = typeof appRouter;

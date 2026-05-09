import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Critical path: Home loads eagerly for fastest initial render
import Home from "./pages/Home";

// Lazy-loaded pages — only fetched when navigated to
const Admin = lazy(() => import("./pages/Admin"));
const AdminBlogAI = lazy(() => import("./pages/AdminBlogAI"));
const AdminSNS = lazy(() => import("./pages/AdminSNS"));
const AdminScheduler = lazy(() => import("./pages/AdminScheduler"));
const AdminSEO = lazy(() => import("./pages/AdminSEO"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminChats = lazy(() => import("./pages/AdminChats"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const SeoChecker = lazy(() => import("./pages/SeoChecker"));
const SeoCompare = lazy(() => import("./pages/SeoCompare"));
const AdminAIMonitor = lazy(() => import("./pages/AdminAIMonitor"));
const AdminAIReport = lazy(() => import("./pages/AdminAIReport"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSeasonalCalendar = lazy(() => import("./pages/AdminSeasonalCalendar"));
const AdminCompetitorDashboard = lazy(() => import("./pages/AdminCompetitorDashboard"));
const AdminHospitalOverview = lazy(() => import("./pages/AdminHospitalOverview"));

const MonthlyAwards = lazy(() => import("./pages/MonthlyAwards"));
const MyHospital = lazy(() => import("./pages/MyHospital"));
const SharedReport = lazy(() => import("./pages/SharedReport"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AiBlogTrial = lazy(() => import("./pages/AiBlogTrial"));
const AiHub = lazy(() => import("./pages/AiHub"));
const AiCardnews = lazy(() => import("./pages/AiCardnews"));
const BenchmarkingReport = lazy(() => import("./pages/BenchmarkingReport"));
const EmailContacts = lazy(() => import("./pages/EmailContacts"));
const TreatmentPageBuilder = lazy(() => import("./pages/TreatmentPageBuilder"));
const TreatmentPagePublic = lazy(() => import("./pages/TreatmentPagePublic"));
const AutomationManager = lazy(() => import("./pages/AutomationManager"));
const MarketingChannel = lazy(() => import("./pages/MarketingChannel"));
const KakaoBooking = lazy(() => import("./pages/KakaoBooking"));
const ContentFactory = lazy(() => import("./pages/ContentFactory"));
const VideoPromptGenerator = lazy(() => import("./pages/VideoPromptGenerator"));
const MarketingDashboard = lazy(() => import("./pages/MarketingDashboard"));
const AdFactory = lazy(() => import("./pages/AdFactory"));
const SeoHistory = lazy(() => import("./pages/SeoHistory"));
const AdminAgenticDashboard = lazy(() => import("./pages/AdminAgenticDashboard"));
const AdminAgentBuilder = lazy(() => import("./pages/AdminAgentBuilder"));
const AdminPlatformSettings = lazy(() => import("./pages/AdminPlatformSettings"));
const AdminLLMMonitor = lazy(() => import("./pages/AdminLLMMonitor"));
const AdminBatchReports = lazy(() => import("./pages/AdminBatchReports"));
const InterviewContentFactory = lazy(() => import("./pages/InterviewContentFactory"));
const InterviewDashboard = lazy(() => import("./pages/InterviewDashboard"));
const InterviewCalendar = lazy(() => import("./pages/InterviewCalendar"));
const ContentFactoryLanding = lazy(() => import("./pages/ContentFactoryLanding"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ServiceVisibility = lazy(() => import("./pages/ServiceVisibility"));
const ServiceReputation = lazy(() => import("./pages/ServiceReputation"));
const ServiceLearningHub = lazy(() => import("./pages/ServiceLearningHub"));
const ServiceWebsite = lazy(() => import("./pages/ServiceWebsite"));
const ServiceCommunication = lazy(() => import("./pages/ServiceCommunication"));
const LandingDental = lazy(() => import("./pages/LandingDental"));
const LandingDermatology = lazy(() => import("./pages/LandingDermatology"));

// Minimal loading fallback — keeps layout stable during chunk load
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Prefetch commonly navigated pages after initial load.
 * Blog and SeoChecker are the most common navigation targets from Home.
 */
function usePrefetchRoutes() {
  useEffect(() => {
    const prefetch = () => {
      import("./pages/Blog");
      import("./pages/SeoChecker");
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(prefetch, { timeout: 5000 });
    } else {
      setTimeout(prefetch, 2000);
    }
  }, []);
}

function Router() {
  usePrefetchRoutes();

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Home} />

        <Route path={"/admin"} component={Admin} />
        <Route path={"/admin/chats"} component={AdminChats} />
        <Route path={"/admin/blog-ai"} component={AdminBlogAI} />
        <Route path={"/admin/blog"} component={AdminBlog} />
        <Route path={"/admin/sns"} component={AdminSNS} />
        <Route path={"/admin/scheduler"} component={AdminScheduler} />
        <Route path={"/admin/seo"} component={AdminSEO} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/blog/category/:slug"} component={BlogCategory} />
        <Route path={"/blog/:slug"} component={BlogPost} />
        <Route path="/ai-check" component={SeoChecker} />
        <Route path="/seo-check">{() => <Redirect to="/ai-check" />}</Route>
        <Route path="/seo-checker">{() => <Redirect to="/ai-check" />}</Route>
        <Route path="/diagnosis">{() => <Redirect to="/ai-check" />}</Route>
        <Route path="/seo-compare" component={SeoCompare} />
        <Route path="/seo-history" component={SeoHistory} />
        <Route path="/admin/ai-monitor" component={AdminAIMonitor} />
        <Route path="/admin/ai-report" component={AdminAIReport} />
        <Route path="/admin/ai-report/:id" component={AdminAIReport} />
        <Route path="/admin/leads" component={AdminLeads} />
        <Route path="/admin/batch-reports" component={AdminBatchReports} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/seasonal-calendar" component={AdminSeasonalCalendar} />
        <Route path="/admin/competitor-dashboard" component={AdminCompetitorDashboard} />
        <Route path="/admin/hospital-overview" component={AdminHospitalOverview} />
        <Route path="/admin/benchmarking" component={BenchmarkingReport} />
        <Route path="/admin/email-contacts" component={EmailContacts} />
        <Route path="/admin/treatment-builder" component={TreatmentPageBuilder} />
        <Route path="/admin/automation" component={AutomationManager} />
        <Route path="/admin/marketing-channel" component={MarketingChannel} />
        <Route path="/admin/kakao-booking" component={KakaoBooking} />
        <Route path="/admin/content-factory" component={ContentFactory} />
        <Route path="/admin/video-prompt" component={VideoPromptGenerator} />
        <Route path="/admin/marketing-dashboard" component={MarketingDashboard} />
        <Route path="/admin/ad-factory" component={AdFactory} />
        <Route path="/admin/agentic" component={AdminAgenticDashboard} />
        <Route path="/admin/agent-builder" component={AdminAgentBuilder} />
        <Route path="/admin/platform-settings" component={AdminPlatformSettings} />
        <Route path="/admin/llm-monitor" component={AdminLLMMonitor} />
        <Route path="/admin/interview-content" component={InterviewContentFactory} />
        <Route path="/admin/interview-dashboard" component={InterviewDashboard} />
        <Route path="/admin/interview-calendar" component={InterviewCalendar} />
        <Route path="/p/:slug" component={TreatmentPagePublic} />

        <Route path="/awards" component={MonthlyAwards} />
        <Route path="/my-hospital" component={MyHospital} />
        <Route path="/ai-blog-trial" component={AiBlogTrial} />
        <Route path="/content-factory" component={ContentFactoryLanding} />
        <Route path="/ai-hub" component={AiHub} />
        <Route path="/ai-hub/cardnews" component={AiCardnews} />
        <Route path="/services/visibility" component={ServiceVisibility} />
        <Route path="/services/reputation" component={ServiceReputation} />
        <Route path="/services/learning-hub" component={ServiceLearningHub} />
        <Route path="/services/website" component={ServiceWebsite} />
        <Route path="/services/communication" component={ServiceCommunication} />
        <Route path="/dental" component={LandingDental} />
        <Route path="/dermatology" component={LandingDermatology} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/report/:token" component={SharedReport} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

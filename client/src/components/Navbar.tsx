/*
 * v10: MY비서 — 병원 AI 에이전시 네비게이션
 * 진료과별 드롭다운 제거, 핵심 메뉴만 유지
 */
import { useState, useEffect, useCallback } from "react";
import { Menu, X, LayoutDashboard, Phone, Stethoscope, Building2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

/** Prefetch page chunks on hover for instant navigation */
const prefetchCache = new Set<string>();
const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  "/blog": () => import("@/pages/Blog"),
  "/ai-check": () => import("@/pages/SeoChecker"),
  "/ai-blog-trial": () => import("@/pages/AiBlogTrial"),
  "/content-factory": () => import("../pages/ContentFactoryLanding"),
  "/admin": () => import("@/pages/Admin"),
};
function prefetchRoute(href: string) {
  if (prefetchCache.has(href)) return;
  const loader = routePrefetchMap[href];
  if (loader) {
    prefetchCache.add(href);
    loader();
  }
}

const navLinks = [
  { label: "서비스", href: "#services" },
  { label: "기술력", href: "#tech" },
  { label: "진행 방식", href: "#process" },
  { label: "가격 안내", href: "#pricing" },
  { label: "AI 최적화 진단", href: "/ai-check", isRoute: true },
  { label: "AI 블로그", href: "/ai-blog-trial", isRoute: true },
  { label: "AI 콘텐츠 공장", href: "/content-factory", isRoute: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [location] = useLocation();

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      if (location !== "/") {
        window.location.href = "/" + href;
        return;
      }
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/50"
            : "bg-transparent"
        }`}
        style={{ animation: "nav-slideDown 0.5s ease-out both" }}
      >
        <div className="container flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-1.5 font-display font-bold text-[17px] tracking-tight text-foreground">
            MY<span className="text-brand">비서</span>
            <span className="hidden sm:inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[9px] font-semibold tracking-wide">
              <Stethoscope className="w-2.5 h-2.5" />
              병원 AI
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onPointerEnter={() => prefetchRoute(link.href)}
                  className={`text-[13px] transition-colors duration-200 ${
                    location.startsWith(link.href)
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </button>
              )
            )}
            <Link
              href="/my-hospital"
              className={`text-[13px] transition-colors duration-200 flex items-center gap-1.5 ${
                location.startsWith("/my-hospital")
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              내 병원
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                onPointerEnter={() => prefetchRoute("/admin")}
                className={`text-[13px] transition-colors duration-200 flex items-center gap-1.5 ${
                  location.startsWith("/admin")
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                앱 관리자
              </Link>
            ) : !isAuthenticated ? (
              <a
                href={getLoginUrl()}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                로그인
              </a>
            ) : null}
          </div>

          {/* Desktop: 전화번호 + CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:010-7321-7004"
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              010-7321-7004
            </a>
            <button
              onClick={() => handleNavClick("#contact")}
              className="px-5 py-2 text-[14px] font-medium rounded-full bg-brand text-background hover:brightness-110 transition-all"
            >
              무료 상담
            </button>
          </div>

          {/* Mobile: 전화 아이콘 + 햄버거 */}
          <div className="lg:hidden flex items-center gap-2">
            <a
              href="tel:010-7321-7004"
              className="p-2 text-brand"
              aria-label="전화 문의"
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-foreground"
              aria-label="메뉴"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/98 backdrop-blur-2xl pt-20"
          style={{ animation: "mobile-menu-fadeIn 0.2s ease-out both" }}
        >
          <div className="container flex flex-col gap-4 py-8">
            <nav className="flex flex-col">
              {navLinks.map((link, i) =>
                (link as any).isRoute ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-4 text-xl font-display font-semibold border-b border-border/30 ${
                      location.startsWith(link.href) ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="block py-4 text-xl font-display font-semibold text-foreground text-left w-full border-b border-border/30"
                  >
                    {link.label}
                  </button>
                )
              )}
            </nav>

            <div className="flex flex-col gap-1 mt-2">
              <Link
                href="/my-hospital"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-4 text-xl font-display font-semibold border-b border-border/30 ${
                  location.startsWith("/my-hospital") ? "text-primary" : "text-brand"
                }`}
              >
                <Building2 className="w-6 h-6" />
                내 병원
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-4 text-xl font-display font-semibold border-b border-border/30 ${
                    location.startsWith("/admin") ? "text-primary" : "text-brand"
                  }`}
                >
                  <LayoutDashboard className="w-6 h-6" />
                  앱 관리자
                </Link>
              ) : !isAuthenticated ? (
                <a
                  href={getLoginUrl()}
                  className="flex items-center gap-3 py-4 text-xl font-display font-semibold text-brand border-b border-border/30"
                >
                  <LayoutDashboard className="w-6 h-6" />
                  로그인
                </a>
              ) : null}

              <a
                href="tel:010-7321-7004"
                className="flex items-center gap-3 py-4 text-xl font-display font-semibold text-brand"
              >
                <Phone className="w-5 h-5" />
                010-7321-7004
              </a>
            </div>

            <button
              onClick={() => handleNavClick("#contact")}
              className="mt-4 px-6 py-4 text-base font-medium rounded-full bg-brand text-background w-full text-center"
            >
              무료 상담 신청
            </button>
          </div>
        </div>
      )}
    </>
  );
}

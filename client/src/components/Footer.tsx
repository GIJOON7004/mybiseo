/*
 * v17: MY비서 — 푸터
 * 핵심: 아이콘+텍스트를 inline-flex span으로 묶어서 절대 분리 불가능하게 보장
 * 모바일/데스크탑 모두 동일한 연락처 구조 사용
 */
import { Link } from "wouter";
import { MapPin, Mail, Phone, Settings, Stethoscope } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/* 아이콘+텍스트 묶음 — 절대 분리 안 됨 */
function IconText({ icon: Icon, children, href }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      <span>{children}</span>
    </>
  );
  const cls = "inline-flex items-center gap-1.5 whitespace-nowrap";
  if (href) {
    return <a href={href} className={`${cls} hover:text-foreground transition-colors`}>{inner}</a>;
  }
  return <span className={cls}>{inner}</span>;
}

export default function Footer() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="container py-8 md:py-10">

        {/* ── 데스크탑: 3컬럼 ── */}
        <div className="hidden md:grid md:grid-cols-[1.2fr_1fr_0.8fr] gap-12">
          {/* 브랜드 */}
          <div>
            <Link href="/">
              <span className="font-display font-bold text-lg text-foreground cursor-pointer inline-flex items-center gap-2">
                MY<span className="text-brand">비서</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[9px] font-semibold">
                  <Stethoscope className="w-2.5 h-2.5" />병원 AI
                </span>
              </span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-[280px]">
              AI 기술로 병원의 환자 유치와 매출 성장을 돕는 의료 마케팅 플랫폼입니다.
            </p>
          </div>
          {/* 연락처 */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2.5">연락처</h4>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <IconText icon={MapPin}>서울시 송파구 가락로 114, 신우빌딩 6층 601-6호</IconText>
              <IconText icon={Phone} href="tel:010-7321-7004">010-7321-7004</IconText>
              <IconText icon={Mail} href="mailto:cjw7004@naver.com">cjw7004@naver.com</IconText>
            </div>
          </div>
          {/* 서비스 */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2.5">서비스</h4>
            <nav className="flex flex-col gap-1.5 text-xs text-muted-foreground" aria-label="서비스 메뉴">
              <a href="/#services" className="hover:text-foreground transition-colors">AI 환자 응대</a>
              <a href="/#services" className="hover:text-foreground transition-colors">AI 인용</a>
              <a href="/#services" className="hover:text-foreground transition-colors">AI 콘텐츠 제작</a>
              <Link href="/blog" className="hover:text-foreground transition-colors">블로그</Link>
              <Link href="/ai-check" className="hover:text-foreground transition-colors">무료 AI+포털 진단</Link>
              <Link href="/content-factory" className="hover:text-foreground transition-colors">AI 콘텐츠 공장</Link>
              <Link href="/ai-blog-trial" className="hover:text-foreground transition-colors">AI 블로그 체험</Link>
            </nav>
          </div>
        </div>

        {/* ── 모바일: 컴팩트 레이아웃 ── */}
        <div className="md:hidden space-y-5">
          {/* 브랜드 */}
          <div>
            <Link href="/">
              <span className="font-display font-bold text-base text-foreground cursor-pointer inline-flex items-center gap-2">
                MY<span className="text-brand">비서</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[9px] font-semibold">
                  <Stethoscope className="w-2.5 h-2.5" />병원 AI
                </span>
              </span>
            </Link>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
              AI 기술로 병원의 환자 유치와 매출 성장을 돕는 의료 마케팅 플랫폼입니다.
            </p>
          </div>

          {/* 연락처 — 아이콘+텍스트 inline-flex로 절대 분리 불가 */}
          <div className="text-[11px] text-muted-foreground space-y-1">
            <div>
              <IconText icon={MapPin}>서울시 송파구 가락로 114, 신우빌딩 6층 601-6호</IconText>
            </div>
            <div className="flex items-center gap-3">
              <IconText icon={Phone} href="tel:010-7321-7004">010-7321-7004</IconText>
              <span className="text-muted-foreground/30">|</span>
              <IconText icon={Mail} href="mailto:cjw7004@naver.com">cjw7004@naver.com</IconText>
            </div>
          </div>

          {/* 서비스 — 가로 나열 */}
          <nav className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground" aria-label="서비스 메뉴">
            <a href="/#services" className="hover:text-foreground transition-colors">AI 환자 응대</a>
            <span className="text-muted-foreground/30">·</span>
            <a href="/#services" className="hover:text-foreground transition-colors">AI 인용</a>
            <span className="text-muted-foreground/30">·</span>
            <a href="/#services" className="hover:text-foreground transition-colors">AI 콘텐츠 제작</a>
            <span className="text-muted-foreground/30">·</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">블로그</Link>
            <span className="text-muted-foreground/30">·</span>
            <Link href="/ai-check" className="hover:text-foreground transition-colors">무료 AI+포털 진단</Link>
            <span className="text-muted-foreground/30">·</span>
            <Link href="/content-factory" className="hover:text-foreground transition-colors">AI 콘텐츠 공장</Link>
          </nav>
        </div>

        {/* ── 하단 바 (공통) ── */}
        <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/50">
            &copy; 2026 MY비서. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
          >
            <Settings className="w-2.5 h-2.5" />
            관리자
          </Link>
        </div>
      </div>
    </footer>
  );
}

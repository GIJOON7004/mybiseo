/**
 * RequireHospital — 병원 프로필이 등록된 사용자만 접근 가능하도록 하는 가드 컴포넌트
 * 로그인 안 된 경우 → 로그인 페이지로 이동
 * 로그인은 됐지만 병원 미등록 → 병원 등록 안내 화면 표시
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequireHospitalProps {
  children: React.ReactNode;
  /** 안내 문구에 표시할 기능 이름 */
  featureName?: string;
}

export default function RequireHospital({ children, featureName = "이 기능" }: RequireHospitalProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.myHospital.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // 로딩 중
  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 로그인 안 됨
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-3">로그인이 필요합니다</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            <strong>{featureName}</strong>을 사용하려면<br />
            먼저 로그인해 주세요.
          </p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="gap-2"
          >
            로그인하기
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 병원 미등록
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold mb-3">병원 등록이 필요합니다</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            <strong>{featureName}</strong>은<br />
            병원 정보를 등록한 회원만 사용할 수 있습니다.<br />
            <span className="text-xs text-muted-foreground/70 mt-2 inline-block">
              내 병원 페이지에서 간단히 등록할 수 있습니다.
            </span>
          </p>
          <Button
            onClick={() => navigate("/my-hospital")}
            className="gap-2"
          >
            <Building2 className="w-4 h-4" />
            병원 등록하러 가기
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 병원 등록 완료 → 자식 컴포넌트 렌더링
  return <>{children}</>;
}

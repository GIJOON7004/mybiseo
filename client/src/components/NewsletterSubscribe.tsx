/**
 * 뉴스레터 구독 컴포넌트 — AI 인용 트렌드 뉴스레터 구독 폼
 * 진단 없이도 이메일 수집 가능
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEventLogger } from "@/hooks/useEventLogger";

interface NewsletterSubscribeProps {
  source?: string;
  compact?: boolean;
}

export default function NewsletterSubscribe({ source = "website", compact = false }: NewsletterSubscribeProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { logEvent } = useEventLogger();
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubscribed(true);
      logEvent("newsletter_subscribe", { source });
      toast.success("구독 완료! 매월 AI 인용 트렌드 리포트를 보내드리겠습니다.");
    },
    onError: () => {
      toast.error("구독 실패. 잠시 후 다시 시도해주세요.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribeMutation.mutate({ email: email.trim(), name: name.trim() || undefined, hospitalName: hospitalName.trim() || undefined, source });
  };

  if (subscribed) {
    return (
      <div className={`rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center ${compact ? "" : "py-10"}`}>
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
        <p className="text-lg font-semibold text-green-400">구독이 완료되었습니다!</p>
        <p className="mt-1 text-sm text-muted-foreground">매월 병원 AI 인용 트렌드 리포트를 보내드리겠습니다.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-background/50"
          required
        />
        <Button type="submit" size="sm" disabled={subscribeMutation.isPending} className="bg-gradient-to-r from-violet-600 to-blue-600 text-white whitespace-nowrap">
          {subscribeMutation.isPending ? "..." : "구독"}
        </Button>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-xl font-bold">AI 인용 트렌드 뉴스레터</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          매월 병원 업계의 AI 인용 트렌드, 진료과별 벤치마크 데이터,<br />
          그리고 실전 AI 가시성 최적화 팁을 무료로 받아보세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="이메일 주소 *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background/50"
              required
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="이름 (선택)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-background/50"
            />
            <Input
              type="text"
              placeholder="병원명 (선택)"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="flex-1 bg-background/50"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white" disabled={subscribeMutation.isPending}>
            <Mail className="mr-2 h-4 w-4" />
            {subscribeMutation.isPending ? "구독 중..." : "무료 구독하기"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">스팸 없이 월 1회만 발송됩니다. 언제든 구독 해지 가능합니다.</p>
      </div>
    </div>
  );
}

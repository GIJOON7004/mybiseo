import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-lg mx-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
            <AlertCircle className="relative h-16 w-16 text-red-400" />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-foreground mb-2">404</h1>

        <h2 className="text-xl font-semibold text-muted-foreground mb-4">
          페이지를 찾을 수 없습니다
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          요청하신 페이지가 존재하지 않거나
          <br />
          이동되었을 수 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-border text-foreground hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            <Home className="w-4 h-4 mr-2" />
            홈으로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}

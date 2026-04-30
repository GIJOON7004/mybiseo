import { useInView } from "@/hooks/useInView";
import type { CSSProperties, ReactNode } from "react";

/**
 * Lightweight fade-in-on-scroll wrapper.
 * v3: 빠른 등장 — duration 0.35s, 이동 거리 8px, 빠른 easing
 * stagger delay는 최대 0.05s로 제한하여 거의 동시에 나타남
 */
const translateMap = {
  up: "translateY(8px)",
  down: "translateY(-8px)",
  left: "translateX(8px)",
  right: "translateX(-8px)",
  none: "none",
} as const;

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  style?: CSSProperties;
}) {
  // delay를 최대 0.05s로 제한 (stagger 효과 최소화)
  const clampedDelay = Math.min(delay, 0.05);
  const { ref, isInView } = useInView({ threshold: 0.02, rootMargin: "0px" });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "none" : translateMap[direction],
        transition: `opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${clampedDelay}s, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${clampedDelay}s`,
        willChange: isInView ? "auto" : "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

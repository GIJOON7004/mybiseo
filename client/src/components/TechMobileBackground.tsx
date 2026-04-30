/*
 * TechMobileBackground — 기술력 섹션 모바일 전용 CSS 배경
 * - 순수 CSS로 구현 (Three.js 없음)
 * - 떠다니는 와이어프레임 도형 느낌
 * - 은은한 그라데이션 + 회전하는 기하학 도형
 */

export default function TechMobileBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* 그라데이션 배경 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 20% 30%, rgba(45,212,191,0.05) 0%, transparent 70%), " +
            "radial-gradient(ellipse 40% 50% at 80% 70%, rgba(13,148,136,0.04) 0%, transparent 70%)",
        }}
      />

      {/* 떠다니는 기하학 도형들 */}
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className="absolute border"
          style={{
            width: s.size,
            height: s.size,
            left: s.x,
            top: s.y,
            borderColor: "rgba(45, 212, 191, 0.12)",
            borderRadius: s.radius,
            transform: `rotate(${s.rotate}deg)`,
            animation: `techMobileFloat${s.anim} ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* 작은 빛나는 점들 */}
      {DOTS.map((d, i) => (
        <div
          key={`dot-${i}`}
          className="absolute rounded-full"
          style={{
            width: d.size,
            height: d.size,
            left: d.x,
            top: d.y,
            background: `rgba(45, 212, 191, ${d.opacity})`,
            boxShadow: `0 0 ${d.size * 2}px rgba(45, 212, 191, ${d.opacity * 0.5})`,
            animation: `techMobileDotPulse ${d.duration}s ease-in-out infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes techMobileFloat1 {
          0%, 100% { transform: rotate(0deg) translateY(0); opacity: 1; }
          50% { transform: rotate(180deg) translateY(-8px); opacity: 0.6; }
        }
        @keyframes techMobileFloat2 {
          0%, 100% { transform: rotate(45deg) translateX(0); opacity: 1; }
          50% { transform: rotate(225deg) translateX(6px); opacity: 0.5; }
        }
        @keyframes techMobileFloat3 {
          0%, 100% { transform: rotate(30deg) scale(1); opacity: 1; }
          50% { transform: rotate(210deg) scale(0.9); opacity: 0.7; }
        }
        @keyframes techMobileDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

const SHAPES = [
  { x: "8%", y: "15%", size: 28, radius: "50%", rotate: 0, duration: 10, delay: 0, anim: 1 },
  { x: "85%", y: "10%", size: 22, radius: "4px", rotate: 45, duration: 12, delay: 1, anim: 2 },
  { x: "70%", y: "60%", size: 20, radius: "30%", rotate: 30, duration: 11, delay: 0.5, anim: 3 },
  { x: "15%", y: "70%", size: 24, radius: "50%", rotate: 0, duration: 9, delay: 1.5, anim: 1 },
  { x: "50%", y: "85%", size: 18, radius: "4px", rotate: 45, duration: 13, delay: 0.8, anim: 2 },
  { x: "35%", y: "25%", size: 16, radius: "30%", rotate: 30, duration: 10, delay: 2, anim: 3 },
];

const DOTS = [
  { x: "25%", y: "20%", size: 2, opacity: 0.35, duration: 4, delay: 0 },
  { x: "65%", y: "35%", size: 3, opacity: 0.3, duration: 5, delay: 0.5 },
  { x: "45%", y: "55%", size: 2, opacity: 0.25, duration: 4.5, delay: 1 },
  { x: "80%", y: "45%", size: 2, opacity: 0.3, duration: 5.5, delay: 1.5 },
  { x: "20%", y: "80%", size: 3, opacity: 0.25, duration: 4, delay: 0.8 },
  { x: "55%", y: "15%", size: 2, opacity: 0.35, duration: 5, delay: 2 },
];

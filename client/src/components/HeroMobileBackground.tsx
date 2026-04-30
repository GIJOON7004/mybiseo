/*
 * HeroMobileBackground — 모바일 전용 히어로 배경 애니메이션
 * - 순수 CSS로 구현 (Three.js 없음, GPU 부담 최소)
 * - 떠다니는 파티클 점 + 연결선 느낌의 그라데이션
 * - AI 네트워크 느낌을 가볍게 표현
 */

export default function HeroMobileBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 그라데이션 오버레이 — AI 네트워크 느낌 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(45,212,191,0.08) 0%, transparent 70%), " +
            "radial-gradient(ellipse 50% 40% at 70% 60%, rgba(13,148,136,0.06) 0%, transparent 70%)",
        }}
      />

      {/* 떠다니는 파티클 점들 */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: `rgba(45, 212, 191, ${p.opacity})`,
            boxShadow: `0 0 ${p.glow}px rgba(45, 212, 191, ${p.opacity * 0.5})`,
            animation: `mobileFloat${p.anim} ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* 연결선 느낌의 가는 라인들 */}
      {LINES.map((l, i) => (
        <div
          key={`line-${i}`}
          className="absolute"
          style={{
            width: l.width,
            height: "1px",
            left: l.x,
            top: l.y,
            background: `linear-gradient(90deg, transparent, rgba(45,212,191,${l.opacity}), transparent)`,
            transform: `rotate(${l.angle}deg)`,
            animation: `mobileLinePulse ${l.duration}s ease-in-out infinite`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}

      {/* 중앙 글로우 — AI 코어 느낌 */}
      <div
        className="absolute"
        style={{
          width: "120px",
          height: "120px",
          left: "50%",
          top: "35%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)",
          animation: "mobileCorePulse 4s ease-in-out infinite",
        }}
      />

      {/* CSS 키프레임 */}
      <style>{`
        @keyframes mobileFloat1 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(8px, -12px); }
          50% { transform: translate(-5px, -20px); opacity: 0.6; }
          75% { transform: translate(10px, -8px); }
        }
        @keyframes mobileFloat2 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-10px, 8px); }
          50% { transform: translate(6px, 15px); opacity: 0.5; }
          75% { transform: translate(-8px, 5px); }
        }
        @keyframes mobileFloat3 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          33% { transform: translate(12px, 6px); opacity: 0.7; }
          66% { transform: translate(-8px, -10px); }
        }
        @keyframes mobileLinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes mobileCorePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* ── 파티클 데이터 (정적, 렌더링 시 재계산 없음) ── */
const PARTICLES = [
  { x: "15%", y: "20%", size: 3, opacity: 0.5, glow: 6, duration: 6, delay: 0, anim: 1 },
  { x: "75%", y: "15%", size: 2, opacity: 0.4, glow: 4, duration: 7, delay: 0.5, anim: 2 },
  { x: "40%", y: "55%", size: 4, opacity: 0.35, glow: 8, duration: 8, delay: 1, anim: 3 },
  { x: "85%", y: "45%", size: 2, opacity: 0.3, glow: 4, duration: 6.5, delay: 1.5, anim: 1 },
  { x: "25%", y: "70%", size: 3, opacity: 0.4, glow: 6, duration: 7.5, delay: 0.8, anim: 2 },
  { x: "60%", y: "30%", size: 2, opacity: 0.45, glow: 5, duration: 6, delay: 2, anim: 3 },
  { x: "10%", y: "45%", size: 3, opacity: 0.3, glow: 6, duration: 8, delay: 0.3, anim: 1 },
  { x: "90%", y: "65%", size: 2, opacity: 0.35, glow: 4, duration: 7, delay: 1.2, anim: 2 },
  { x: "50%", y: "10%", size: 2, opacity: 0.4, glow: 5, duration: 6.5, delay: 0.7, anim: 3 },
  { x: "35%", y: "85%", size: 3, opacity: 0.3, glow: 6, duration: 7.5, delay: 1.8, anim: 1 },
  { x: "70%", y: "75%", size: 2, opacity: 0.35, glow: 4, duration: 8, delay: 0.4, anim: 2 },
  { x: "20%", y: "35%", size: 2, opacity: 0.4, glow: 5, duration: 6, delay: 2.2, anim: 3 },
];

const LINES = [
  { x: "10%", y: "25%", width: "80px", angle: 25, opacity: 0.12, duration: 5, delay: 0 },
  { x: "55%", y: "20%", width: "60px", angle: -15, opacity: 0.1, duration: 6, delay: 1 },
  { x: "30%", y: "60%", width: "70px", angle: 35, opacity: 0.08, duration: 7, delay: 0.5 },
  { x: "70%", y: "50%", width: "50px", angle: -30, opacity: 0.1, duration: 5.5, delay: 1.5 },
  { x: "20%", y: "80%", width: "65px", angle: 10, opacity: 0.09, duration: 6.5, delay: 0.8 },
  { x: "80%", y: "35%", width: "55px", angle: -20, opacity: 0.11, duration: 5, delay: 2 },
];

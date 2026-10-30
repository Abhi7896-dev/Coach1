import React, { useEffect, useRef, useState } from 'react';

interface BackgroundScreeningProps {
  variant?: 'hero' | 'dark' | 'blue' | 'light';
  showCourtLines?: boolean;
  showParticles?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function BackgroundScreening({
  variant = 'hero',
  showCourtLines = true,
  showParticles = true,
  className = '',
  children,
}: BackgroundScreeningProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only activate spotlight when pointer is within or near the element
      if (x >= -100 && x <= rect.width + 100 && y >= -100 && y <= rect.height + 100) {
        setMousePos({ x, y, active: true });
      } else {
        setMousePos((prev) => ({ ...prev, active: false }));
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 1. Ambient Dynamic Light Mesh Screening */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">
        {variant === 'hero' && (
          <>
            {/* Primary Athlete Orange ambient orb */}
            <div
              className="parallax-bg-1 absolute -left-36 -top-36 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-orange-600/35 to-orange-400/20 blur-[130px] animate-pulse-glow"
              style={{ animationDuration: '7s' }}
            />
            {/* Trust Blue ambient orb */}
            <div
              className="parallax-bg-2 absolute -right-32 top-16 h-[540px] w-[540px] rounded-full bg-gradient-to-bl from-blue-600/30 to-blue-400/15 blur-[130px] animate-pulse-glow"
              style={{ animationDuration: '9s', animationDelay: '1.5s' }}
            />
            {/* Growth Green grounding orb */}
            <div
              className="parallax-bg-3 absolute bottom-[-100px] left-1/3 h-[460px] w-[460px] rounded-full bg-gradient-to-t from-green-500/20 to-green-400/10 blur-[120px] animate-pulse-glow"
              style={{ animationDuration: '8s', animationDelay: '3s' }}
            />
          </>
        )}

        {variant === 'blue' && (
          <>
            <div
              className="absolute -right-36 -top-24 h-[560px] w-[560px] rounded-full bg-gradient-to-br from-blue-500/30 to-blue-400/15 blur-[130px] animate-pulse-glow"
              style={{ animationDuration: '8s' }}
            />
            <div
              className="absolute -left-28 bottom-0 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-green-500/20 to-green-400/10 blur-[120px] animate-pulse-glow"
              style={{ animationDuration: '9s', animationDelay: '2s' }}
            />
          </>
        )}

        {variant === 'dark' && (
          <>
            <div
              className="absolute -left-28 -top-20 h-[480px] w-[480px] rounded-full bg-orange-600/25 blur-[120px] animate-pulse-glow"
              style={{ animationDuration: '8s' }}
            />
            <div
              className="absolute -right-28 -bottom-20 h-[480px] w-[480px] rounded-full bg-blue-600/25 blur-[120px] animate-pulse-glow"
              style={{ animationDuration: '10s', animationDelay: '2s' }}
            />
          </>
        )}

        {variant === 'light' && (
          <>
            <div
              className="absolute -left-40 top-1/4 h-[520px] w-[520px] rounded-full bg-orange-400/10 blur-[140px] animate-pulse-glow"
              style={{ animationDuration: '10s' }}
            />
            <div
              className="absolute -right-40 bottom-1/4 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-[140px] animate-pulse-glow"
              style={{ animationDuration: '11s', animationDelay: '3s' }}
            />
          </>
        )}

        {/* 2. Interactive Cursor Spotlight Screening (Follows User Movement) */}
        {mousePos.active && (
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-500"
            style={{
              opacity: mousePos.active ? 1 : 0,
              background:
                variant === 'light'
                  ? `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(251,90,12,0.06), transparent 75%)`
                  : `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(251,90,12,0.18), rgba(28,99,240,0.08) 40%, transparent 75%)`,
            }}
          />
        )}

        {/* 3. Athletic Vector Geometry & Court Line Screening */}
        {showCourtLines && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="courtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb5a0c" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3282fb" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#19b062" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Parabolic Trajectory Curves (Simulating tennis / badminton ball paths) */}
            <path
              d="M -100,320 Q 450,-80 950,420 T 1950,220"
              fill="none"
              stroke="url(#courtGrad)"
              strokeWidth="1.75"
              className="animated-stroke"
            />
            <path
              d="M 50,680 Q 700,200 1350,750"
              fill="none"
              stroke="url(#courtGrad)"
              strokeWidth="1.25"
              strokeDasharray="6 8"
            />

            {/* Athletic Court Marking Geometry */}
            <ellipse
              cx="50%"
              cy="48%"
              rx="420"
              ry="260"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 6"
              className="text-white/60 animate-spin-slow"
              style={{ transformOrigin: 'center' }}
            />
            <ellipse
              cx="50%"
              cy="48%"
              rx="220"
              ry="130"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              className="text-white/40"
            />
          </svg>
        )}

        {/* 4. Kinetic Floating Particles (Athletic Energy Points) */}
        {showParticles && (
          <div className="pointer-events-none absolute inset-0">
            {[
              { top: '18%', left: '12%', size: 'h-1.5 w-1.5', delay: '0s', dur: '7s', color: 'bg-orange-400' },
              { top: '28%', left: '84%', size: 'h-2 w-2', delay: '1.2s', dur: '9s', color: 'bg-blue-400' },
              { top: '65%', left: '22%', size: 'h-1.5 w-1.5', delay: '2.5s', dur: '8s', color: 'bg-green-400' },
              { top: '78%', left: '74%', size: 'h-2 w-2', delay: '0.8s', dur: '10s', color: 'bg-orange-300' },
              { top: '45%', left: '50%', size: 'h-1 w-1', delay: '3.1s', dur: '6s', color: 'bg-white' },
              { top: '88%', left: '38%', size: 'h-1.5 w-1.5', delay: '1.8s', dur: '7.5s', color: 'bg-blue-300' },
            ].map((p, idx) => (
              <span
                key={idx}
                className={`absolute rounded-full ${p.size} ${p.color} opacity-40 blur-[0.5px] animate-float`}
                style={{
                  top: p.top,
                  left: p.left,
                  animationDelay: p.delay,
                  animationDuration: p.dur,
                }}
              />
            ))}
          </div>
        )}

        {/* 5. Subtle Technical Grid Pattern */}
        <div
          className={`absolute inset-0 ${
            variant === 'light' ? 'grid-bg opacity-[0.35]' : 'grid-bg-dark opacity-[0.25]'
          }`}
        />
      </div>

      {/* Content slot */}
      {children}
    </div>
  );
}

export function KineticTrajectory({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="trajGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb5a0c" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#ff7f37" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3282fb" stopOpacity="0.9" />
          </linearGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Dynamic Launch Arc */}
        <path
          d="M 20 210 Q 180 20 480 130"
          stroke="url(#trajGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animated-stroke"
          filter="url(#glowFilter)"
        />

        {/* Secondary ghost curve */}
        <path
          d="M 40 225 Q 220 60 460 170"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.25"
          strokeDasharray="4 6"
        />

        {/* Origin Target Node */}
        <circle cx="20" cy="210" r="5" fill="#fb5a0c" className="animate-pulse" />
        <circle cx="20" cy="210" r="10" stroke="#fb5a0c" strokeWidth="1" opacity="0.4" className="animate-ping" />

        {/* Apex Node */}
        <circle cx="215" cy="55" r="4" fill="#ffcea8" />
        <text x="225" y="52" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          APEX VELOCITY
        </text>

        {/* Destination Target Node */}
        <circle cx="480" cy="130" r="5" fill="#3282fb" className="animate-pulse" />
        <circle cx="480" cy="130" r="12" stroke="#3282fb" strokeWidth="1" opacity="0.5" className="animate-ping" />
      </svg>
    </div>
  );
}

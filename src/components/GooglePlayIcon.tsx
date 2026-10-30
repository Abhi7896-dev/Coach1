import React from 'react';

interface GooglePlayIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Official Google Play "Play" triangle mark, rendered on a rounded squircle
// to visually match AppStoreIcon's badge treatment.
export function GooglePlayIcon({ size = 24, className = '', ...props }: GooglePlayIconProps) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 800 800" width={size} height={size} className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={`gpBg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#101010" />
          <stop offset="100%" stopColor="#262626" />
        </linearGradient>
        <linearGradient id={`gpBlue-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D6FF" />
          <stop offset="100%" stopColor="#00A0FF" />
        </linearGradient>
        <linearGradient id={`gpGreen-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F076" />
          <stop offset="100%" stopColor="#00C853" />
        </linearGradient>
        <linearGradient id={`gpYellow-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE000" />
          <stop offset="100%" stopColor="#FFBD00" />
        </linearGradient>
        <linearGradient id={`gpRed-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF3A44" />
          <stop offset="100%" stopColor="#FF1744" />
        </linearGradient>
      </defs>

      <rect width="800" height="800" rx="180" ry="180" fill={`url(#gpBg-${id})`} />

      <g transform="translate(400,400)">
        {/* Blue: bottom-left to top-right stripe */}
        <path d="M -220,-230 L 60,20 L -220,230 Z" fill={`url(#gpBlue-${id})`} />
        {/* Green: top wedge */}
        <path d="M -220,-230 L 60,20 L 195,-85 Z" fill={`url(#gpGreen-${id})`} />
        {/* Red: bottom wedge */}
        <path d="M -220,230 L 60,20 L 195,105 Z" fill={`url(#gpRed-${id})`} />
        {/* Yellow: right tip */}
        <path d="M 60,20 L 195,-85 L 260,-32 L 260,32 L 195,105 Z" fill={`url(#gpYellow-${id})`} />
      </g>
    </svg>
  );
}

import React from 'react';

interface AppStoreIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: 'squircle' | 'apple' | 'glyph';
}

export function AppStoreIcon({
  size = 24,
  variant = 'squircle',
  className = '',
  ...props
}: AppStoreIconProps) {
  if (variant === 'apple') {
    return (
      <svg
        viewBox="0 0 170 170"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.86-11.96-14.43-5.65-8.6-10.09-18.42-13.32-29.47-3.23-11.04-4.85-21.84-4.85-32.39 0-13.06 3.29-23.75 9.87-32.06 6.58-8.32 14.89-12.57 24.93-12.77 4.14 0 9.07 1.05 14.8 3.17 5.73 2.13 9.42 3.24 11.08 3.35 2.11-.22 6.01-1.44 11.71-3.66 5.7-2.22 10.37-3.17 14.02-2.85 10.74.87 19.34 5.09 25.79 12.66-9.35 5.66-13.9 13.59-13.67 23.8.23 7.82 3.15 14.34 8.78 19.56 5.62 5.21 12.35 8.1 20.19 8.68-2.29 6.74-5.06 13.25-8.31 19.53zM119.22 33.56c0-7.18 2.6-13.88 7.8-20.1 5.2-6.22 11.83-9.84 19.89-10.86.33 1.09.49 2.17.49 3.26 0 7.07-2.67 13.93-8.01 20.59-5.34 6.66-12.01 10.3-20.02 10.92-.05-1.25-.15-2.52-.15-3.81z" />
      </svg>
    );
  }

  if (variant === 'glyph') {
    return (
      <svg
        viewBox="0 0 800 800"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M396.6,183.8l16.2-28c10-17.5,32.3-23.4,49.8-13.4s23.4,32.3,13.4,49.8L319.9,462.4h112.9 c36.6,0,57.1,43,41.2,72.8H143c-20.2,0-36.4-16.2-36.4-36.4c0-20.2,16.2-36.4,36.4-36.4h92.8l118.8-205.9l-37.1-64.4 c-10-17.5-4.1-39.6,13.4-49.8c17.5-10,39.6-4.1,49.8,13.4L396.6,183.8L396.6,183.8z M256.2,572.7l-35,60.7 c-10,17.5-32.3,23.4-49.8,13.4S148,614.5,158,597l26-45C213.4,542.9,237.3,549.9,256.2,572.7L256.2,572.7z M557.6,462.6h94.7 c20.2,0,36.4,16.2,36.4,36.4c0,20.2-16.2,36.4-36.4,36.4h-52.6l35.5,61.6c10,17.5,4.1,39.6-13.4,49.8c-17.5,10-39.6,4.1-49.8-13.4 c-59.8-103.7-104.7-181.3-134.5-233c-30.5-52.6-8.7-105.4,12.8-123.3C474.2,318.1,509.9,380,557.6,462.6L557.6,462.6z" />
      </svg>
    );
  }

  // Standard official App Store squircle icon
  const id = React.useId();
  return (
    <svg
      viewBox="0 0 800 800"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={`asGrad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1DC3FD" />
          <stop offset="45%" stopColor="#0B87FF" />
          <stop offset="100%" stopColor="#025EE3" />
        </linearGradient>
        <linearGradient id={`asHighlight-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`asShadow-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#013B8F" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Squircle Background */}
      <rect width="800" height="800" rx="180" ry="180" fill={`url(#asGrad-${id})`} />
      
      {/* Top subtle highlight rim */}
      <rect
        x="6"
        y="6"
        width="788"
        height="788"
        rx="174"
        ry="174"
        fill="none"
        stroke={`url(#asHighlight-${id})`}
        strokeWidth="12"
      />

      {/* App Store 'A' Symbol */}
      <g filter={`url(#asShadow-${id})`}>
        <path
          fill="#FFFFFF"
          d="M396.6,183.8l16.2-28c10-17.5,32.3-23.4,49.8-13.4s23.4,32.3,13.4,49.8L319.9,462.4h112.9 c36.6,0,57.1,43,41.2,72.8H143c-20.2,0-36.4-16.2-36.4-36.4c0-20.2,16.2-36.4,36.4-36.4h92.8l118.8-205.9l-37.1-64.4 c-10-17.5-4.1-39.6,13.4-49.8c17.5-10,39.6-4.1,49.8,13.4L396.6,183.8L396.6,183.8z M256.2,572.7l-35,60.7 c-10,17.5-32.3,23.4-49.8,13.4S148,614.5,158,597l26-45C213.4,542.9,237.3,549.9,256.2,572.7L256.2,572.7z M557.6,462.6h94.7 c20.2,0,36.4,16.2,36.4,36.4c0,20.2-16.2,36.4-36.4,36.4h-52.6l35.5,61.6c10,17.5,4.1,39.6-13.4,49.8c-17.5,10-39.6,4.1-49.8-13.4 c-59.8-103.7-104.7-181.3-134.5-233c-30.5-52.6-8.7-105.4,12.8-123.3C474.2,318.1,509.9,380,557.6,462.6L557.6,462.6z"
        />
      </g>
    </svg>
  );
}

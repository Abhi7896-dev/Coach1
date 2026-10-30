import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  const location = useLocation();

  const handleClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Link
      to="/"
      onClick={handleClick}
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="TruCoach Home"
    >
      <img
        src="/logo.png"
        alt="TruCoach Logo"
        className="h-12 sm:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />
      <span className="font-display text-xl sm:text-[22px] font-700 leading-none tracking-tight">
        <span className="text-blue-600">Tru</span>
        <span className="text-orange-500">Coach</span>
      </span>
    </Link>
  );
}

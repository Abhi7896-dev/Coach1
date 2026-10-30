import React from 'react';
import {
  Target,
  Waves,
  Trophy,
  Activity,
  Flame,
  Dumbbell,
  Footprints,
  Shield,
  Award,
  Zap,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export interface SportConfig {
  name: string;
  icon: LucideIcon;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
}

const DEFAULT_SPORT: SportConfig = {
  name: 'Sports',
  icon: Trophy,
  gradient: 'from-orange-500 to-amber-500',
  badgeBg: 'bg-orange-50',
  badgeText: 'text-orange-700',
  badgeBorder: 'border-orange-200',
  accentColor: '#fb5a0c',
};

const SPORT_REGISTRY: Record<string, SportConfig> = {
  archery: {
    name: 'Archery',
    icon: Target,
    gradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentColor: '#d97706',
  },
  swimming: {
    name: 'Swimming',
    icon: Waves,
    gradient: 'from-cyan-500 to-blue-600',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    accentColor: '#0891b2',
  },
  badminton: {
    name: 'Badminton',
    icon: Zap,
    gradient: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    accentColor: '#059669',
  },
  cricket: {
    name: 'Cricket',
    icon: Trophy,
    gradient: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    accentColor: '#2563eb',
  },
  football: {
    name: 'Football',
    icon: Activity,
    gradient: 'from-green-600 to-emerald-700',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-800',
    badgeBorder: 'border-green-200',
    accentColor: '#16a34a',
  },
  soccer: {
    name: 'Soccer',
    icon: Activity,
    gradient: 'from-green-600 to-emerald-700',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-800',
    badgeBorder: 'border-green-200',
    accentColor: '#16a34a',
  },
  tennis: {
    name: 'Tennis',
    icon: Flame,
    gradient: 'from-lime-500 to-emerald-600',
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-800',
    badgeBorder: 'border-lime-200',
    accentColor: '#65a30d',
  },
  'table tennis': {
    name: 'Table Tennis',
    icon: Flame,
    gradient: 'from-rose-500 to-orange-600',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    accentColor: '#e11d48',
  },
  basketball: {
    name: 'Basketball',
    icon: Flame,
    gradient: 'from-orange-600 to-red-600',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    accentColor: '#ea580c',
  },
  athletics: {
    name: 'Athletics',
    icon: Footprints,
    gradient: 'from-violet-600 to-purple-700',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-800',
    badgeBorder: 'border-violet-200',
    accentColor: '#7c3aed',
  },
  running: {
    name: 'Running',
    icon: Footprints,
    gradient: 'from-indigo-500 to-blue-600',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    accentColor: '#4f46e5',
  },
  karate: {
    name: 'Karate',
    icon: Shield,
    gradient: 'from-red-600 to-rose-700',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-200',
    accentColor: '#dc2626',
  },
  'martial arts': {
    name: 'Martial Arts',
    icon: Shield,
    gradient: 'from-red-600 to-rose-700',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-200',
    accentColor: '#dc2626',
  },
  fitness: {
    name: 'Fitness',
    icon: Dumbbell,
    gradient: 'from-slate-700 to-ink-900',
    badgeBg: 'bg-ink-100',
    badgeText: 'text-ink-800',
    badgeBorder: 'border-ink-200',
    accentColor: '#334155',
  },
  gymnastics: {
    name: 'Gymnastics',
    icon: Sparkles,
    gradient: 'from-fuchsia-600 to-pink-600',
    badgeBg: 'bg-fuchsia-50',
    badgeText: 'text-fuchsia-800',
    badgeBorder: 'border-fuchsia-200',
    accentColor: '#c026d3',
  },
  skating: {
    name: 'Skating',
    icon: Activity,
    gradient: 'from-sky-500 to-indigo-600',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    accentColor: '#0284c7',
  },
  chess: {
    name: 'Chess',
    icon: Award,
    gradient: 'from-amber-600 to-yellow-600',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-900',
    badgeBorder: 'border-yellow-200',
    accentColor: '#b45309',
  },
};

export function getSportConfig(sportName: string | null | undefined): SportConfig {
  if (!sportName) return DEFAULT_SPORT;
  const key = sportName.trim().toLowerCase();
  if (SPORT_REGISTRY[key]) return SPORT_REGISTRY[key];

  // Partial search
  for (const [k, v] of Object.entries(SPORT_REGISTRY)) {
    if (key.includes(k) || k.includes(key)) {
      return v;
    }
  }

  return {
    ...DEFAULT_SPORT,
    name: sportName,
  };
}

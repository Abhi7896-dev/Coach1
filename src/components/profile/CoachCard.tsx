import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Trophy,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Calendar,
  ChevronRight,
  Check,
} from 'lucide-react';
import { DirectoryCoach } from '@/lib/directoryData';
import { getSportConfig } from '@/lib/sportUtils';
import { FreeTrialModal } from '@/components/profile/FreeTrialModal';

interface CoachCardProps {
  coach: DirectoryCoach;
  avatarGradient: (seed: string) => string;
}

export function CoachCard({ coach, avatarGradient }: CoachCardProps) {
  const [isTrialOpen, setIsTrialOpen] = useState(false);

  const sports = coach.sports_offered && coach.sports_offered.length > 0 ? coach.sports_offered : [];
  const primarySport = sports[0] || 'Sports Training';
  const primarySportCfg = getSportConfig(primarySport);
  const locationLabel = [coach.locality, coach.pincode].filter(Boolean).join(' · ') || 'Hyderabad';

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-ink-100/90 bg-white p-5 shadow-[0_12px_36px_-18px_rgba(15,18,25,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
        {/* Subtle accent hover glow on top right */}
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none" />

        <div>
          {/* Header row with Avatar + Info + Live Badge */}
          <div className="flex items-start gap-3.5">
            <Link
              to={`/coach/${coach.slug || coach.id}`}
              className="relative shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-2xl"
            >
              <div
                className={`grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${avatarGradient(
                  coach.id
                )} shadow-md transition-transform duration-300 group-hover:scale-105`}
              >
                {coach.profile_image_url ? (
                  <img
                    src={coach.profile_image_url}
                    alt={coach.name || 'Coach'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-display text-2xl font-700 text-white">
                    {(coach.name || 'C').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Status pulse dot */}
              <span
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
                title="Available for Trial"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/coach/${coach.slug || coach.id}`}
                  className="font-display text-base font-700 text-ink-950 group-hover:text-orange-600 transition-colors truncate max-w-[170px] sm:max-w-[200px]"
                >
                  {coach.name || 'Coach'}
                </Link>
                {coach.is_verified && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200 shrink-0"
                    title="TruCoach Verified Coach"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              <p className="truncate text-xs font-medium text-ink-500 mt-0.5">
                {coach.designation || coach.academy_name || 'Professional Coach'}
              </p>

              {/* Location pin */}
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-400 truncate">
                <MapPin className="h-3 w-3 text-orange-500 shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Sport Tags */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink-100/70 pt-3 text-xs">
            {coach.years_of_experience != null ? (
              <span className="inline-flex items-center gap-1 font-bold text-ink-800 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[11px]">
                <Trophy className="h-3 w-3 text-amber-500" />
                {coach.years_of_experience}+ yrs exp
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-600">
                <Sparkles className="h-3 w-3 text-orange-500" />
                Certified
              </span>
            )}

            {/* Live slot indicator */}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Free Trial Pass
            </span>
          </div>

          {/* Sports Offered Badges */}
          {sports.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sports.slice(0, 3).map((s) => {
                const cfg = getSportConfig(s);
                return (
                  <span
                    key={s}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                  >
                    {s}
                  </span>
                );
              })}
              {sports.length > 3 && (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                  +{sports.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Interactive Action Bar (Book Free Trial + View Profile) */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsTrialOpen(true);
            }}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md hover:brightness-105 active:scale-95"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-200" />
            <span>Book Trial</span>
          </button>

          <Link
            to={`/coach/${coach.slug || coach.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-bold text-ink-800 transition hover:bg-ink-50 hover:border-ink-300"
          >
            <span>View Profile</span>
            <ChevronRight className="h-3.5 w-3.5 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Free Trial Modal Trigger */}
      <FreeTrialModal
        isOpen={isTrialOpen}
        onClose={() => setIsTrialOpen(false)}
        coachId={coach.id}
        coachName={coach.name || 'Coach'}
        academyName={coach.academy_name}
        sportsOffered={coach.sports_offered}
        coachImageUrl={coach.profile_image_url}
        locality={coach.locality}
      />
    </>
  );
}


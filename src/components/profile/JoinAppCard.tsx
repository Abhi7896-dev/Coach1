import React from 'react';
import { Sparkles, ShieldCheck, ArrowRight, Calendar, Flame, Check } from 'lucide-react';
import { AppStoreIcon } from '@/components/AppStoreIcon';
import { GooglePlayIcon } from '@/components/GooglePlayIcon';

const APP_STORE_URL = 'https://apps.apple.com/in/app/trucoach/id6808904997';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share';
const APP_STORE_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(APP_STORE_URL)}`;
const GOOGLE_PLAY_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(GOOGLE_PLAY_URL)}`;

interface JoinAppCardProps {
  targetName: string;
  targetType: 'coach' | 'academy';
  onOpenModal?: () => void;
  onBookFreeTrial?: () => void;
  variant?: 'sidebar' | 'banner';
}

export function JoinAppCard({
  targetName,
  targetType,
  onOpenModal,
  onBookFreeTrial,
  variant = 'sidebar',
}: JoinAppCardProps) {
  const isAcademy = targetType === 'academy';
  const mainQuestion = isAcademy
    ? 'Interested in joining the academy?'
    : `Interested in training with ${targetName}?`;
  const kidQuestion = isAcademy
    ? 'Wanna join your Kid into the Academy?'
    : 'Wanna join your Kid for training?';

  if (variant === 'banner') {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 p-7 sm:p-10 text-white shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30">
              <Sparkles className="h-3.5 w-3.5" /> Book 1st Trial Free
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Check className="h-3 w-3" /> No App Download Required
            </span>
          </div>

          <h3 className="mt-4 font-display text-2xl font-700 tracking-tight sm:text-3xl text-white">
            {mainQuestion}
          </h3>
          <p className="mt-1 font-display text-lg font-600 text-orange-400">
            or {kidQuestion}
          </p>

          <p className="mt-3 text-sm font-medium leading-relaxed text-ink-200">
            Request your free trial session directly from the website in 30 seconds. The coach will confirm your slot via WhatsApp or call.
          </p>

          {onBookFreeTrial && (
            <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
              <button
                onClick={onBookFreeTrial}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition hover:shadow-orange-500/50 hover:brightness-105 active:scale-[0.98]"
              >
                <Calendar className="h-4 w-4 text-amber-200" />
                <span>Request Free Trial (Website)</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </div>

        {/* Clear non-overlapping scanners for mobile app */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
            Or track everything inside the TruCoach mobile app:
          </p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-xl">
            {/* iOS Card */}
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur transition hover:bg-white/10">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <AppStoreIcon size={16} className="h-4 w-4 rounded-[3px]" /> Apple App Store
              </span>
              <p className="mt-0.5 text-[11px] text-ink-400">Scan to download on iPhone / iPad</p>

              <div className="my-3 rounded-xl border-2 border-white bg-white p-1.5 shadow-md">
                <img
                  src={APP_STORE_QR_SRC}
                  alt="Scan to download TruCoach on App Store"
                  className="h-28 w-28 rounded-lg"
                />
              </div>

              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 text-xs font-bold text-white transition hover:bg-white/20"
              >
                <AppStoreIcon size={14} className="h-3.5 w-3.5" /> Download for iOS
              </a>
            </div>

            {/* Android Card */}
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur transition hover:bg-white/10">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <GooglePlayIcon size={16} className="h-4 w-4 rounded-[3px]" /> Google Play Store
              </span>
              <p className="mt-0.5 text-[11px] text-ink-400">Scan to download on Android</p>

              <div className="my-3 rounded-xl border-2 border-white bg-white p-1.5 shadow-md">
                <img
                  src={GOOGLE_PLAY_QR_SRC}
                  alt="Scan to download TruCoach on Google Play"
                  className="h-28 w-28 rounded-lg"
                />
              </div>

              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2 text-xs font-bold text-white transition hover:bg-orange-500 shadow-md"
              >
                <GooglePlayIcon size={14} className="h-3.5 w-3.5" /> Download for Android
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-ink-400">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          <span>Trials, coach discovery &amp; batch schedules are safely verified on TruCoach.</span>
        </div>
      </div>
    );
  }

  // Sidebar variant (Sticky card on right)
  return (
    <div className="rounded-3xl border-2 border-orange-500/20 bg-gradient-to-b from-[#111726] to-[#0c101a] p-6 shadow-xl text-white relative overflow-hidden">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-orange-500/15 blur-2xl pointer-events-none" />

      {/* Acoustic live badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30">
          <Flame className="h-3 w-3 text-orange-400 animate-pulse" /> Free Trial Pass
        </span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          Slot Open
        </span>
      </div>

      <div className="mt-4">
        <h3 className="font-display text-lg font-700 leading-snug text-white">
          {mainQuestion}
        </h3>
        <p className="text-xs font-bold text-orange-400 mt-1">
          or {kidQuestion}
        </p>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-ink-300">
        No app download needed to get started! Book a free trial directly from the website and test before you commit.
      </p>

      {/* Primary Action Button: Book Free Trial Online */}
      {onBookFreeTrial && (
        <div className="mt-4">
          <button
            onClick={onBookFreeTrial}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40 hover:brightness-105 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4 text-amber-200" />
            <span>Book Free Trial on Website</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="my-5 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Or use App</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Scanner & App buttons */}
      <div className="space-y-3">
        {/* iOS Quick download */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <AppStoreIcon size={14} className="h-3.5 w-3.5 rounded-[2px]" /> iOS App Store
            </span>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-orange-400 hover:text-orange-300 font-bold"
            >
              Get App →
            </a>
          </div>
        </div>

        {/* Android Quick download */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <GooglePlayIcon size={14} className="h-3.5 w-3.5 rounded-[2px]" /> Google Play
            </span>
            <a
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-orange-400 hover:text-orange-300 font-bold"
            >
              Get App →
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-center">
        <span className="text-[10px] text-ink-400">
          Instant Coach alert sent via TruCoach operations.
        </span>
      </div>
    </div>
  );
}

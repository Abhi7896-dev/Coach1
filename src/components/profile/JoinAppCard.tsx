import React from 'react';
import { Sparkles, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';
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
  variant?: 'sidebar' | 'banner';
}

export function JoinAppCard({
  targetName,
  targetType,
  onOpenModal,
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
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 p-7 sm:p-10 text-white shadow-xl border border-white/10">
        <div className="max-w-2xl text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30">
            <Sparkles className="h-3.5 w-3.5" /> Official TruCoach Application
          </span>

          <h3 className="mt-4 font-display text-2xl font-700 tracking-tight sm:text-3xl text-white">
            {mainQuestion}
          </h3>
          <p className="mt-1 font-display text-lg font-600 text-orange-400">
            or {kidQuestion}
          </p>

          <p className="mt-3 text-sm font-medium leading-relaxed text-ink-200">
            Download our Official Application to Book Trials &amp; Explore All Coaches of different sports
          </p>
        </div>

        {/* Clear non-overlapping scanners */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-xl">
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
            <p className="mt-0.5 text-[11px] text-ink-400">Scan to download on Android phone</p>

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
              className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <GooglePlayIcon size={14} className="h-3.5 w-3.5" /> Download for Android
            </a>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-ink-400">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          <span>Trials, coach discovery &amp; batch schedules are exclusively managed inside the app.</span>
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="rounded-3xl border-2 border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-700 leading-snug text-ink-950">
            {mainQuestion}
          </h3>
          <p className="text-xs font-bold text-orange-600 mt-0.5">
            or {kidQuestion}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-600 font-medium">
        Download our Official Application to Book Trials &amp; Explore All Coaches of different sports.
      </p>

      {/* Clean Scanner Area with ample space and no text overlap */}
      <div className="mt-5 space-y-4">
        {/* iOS Scanner Card */}
        <div className="rounded-2xl border border-ink-100 bg-ink-50/70 p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink-900">
            <AppStoreIcon size={16} className="h-4 w-4 rounded-[3px]" />
            <span>Apple App Store</span>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-500">Scan with iPhone camera</p>

          <div className="my-2.5 flex justify-center">
            <div className="rounded-xl border border-ink-200 bg-white p-2 shadow-xs">
              <img
                src={APP_STORE_QR_SRC}
                alt="App Store QR"
                className="h-28 w-28 rounded-lg"
              />
            </div>
          </div>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white py-2 text-xs font-bold text-ink-800 transition hover:bg-ink-100"
          >
            <AppStoreIcon size={14} className="h-3.5 w-3.5" />
            Download for iOS
          </a>
        </div>

        {/* Android Scanner Card */}
        <div className="rounded-2xl border border-ink-100 bg-ink-50/70 p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink-900">
            <GooglePlayIcon size={16} className="h-4 w-4 rounded-[3px]" />
            <span>Google Play Store</span>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-500">Scan with Android camera</p>

          <div className="my-2.5 flex justify-center">
            <div className="rounded-xl border border-ink-200 bg-white p-2 shadow-xs">
              <img
                src={GOOGLE_PLAY_QR_SRC}
                alt="Google Play QR"
                className="h-28 w-28 rounded-lg"
              />
            </div>
          </div>

          <a
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full !py-2 !text-xs font-bold"
          >
            <GooglePlayIcon size={14} className="h-3.5 w-3.5" />
            Download for Android
          </a>
        </div>
      </div>

      <div className="mt-4 border-t border-ink-100 pt-3 text-center">
        <span className="text-[11px] text-ink-400">
          Book trials &amp; explore schedules directly inside TruCoach App
        </span>
      </div>
    </div>
  );
}

import React from 'react';
import { X, Sparkles, Smartphone, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppStoreIcon } from '@/components/AppStoreIcon';
import { GooglePlayIcon } from '@/components/GooglePlayIcon';

const APP_STORE_URL = 'https://apps.apple.com/in/app/trucoach/id6808904997';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share';
const APP_STORE_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(APP_STORE_URL)}`;
const GOOGLE_PLAY_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(GOOGLE_PLAY_URL)}`;

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetType: 'coach' | 'academy';
}

export function AppDownloadModal({
  isOpen,
  onClose,
  targetName,
  targetType,
}: AppDownloadModalProps) {
  if (!isOpen) return null;

  const isAcademy = targetType === 'academy';
  const mainQuestion = isAcademy
    ? 'Interested in joining the academy?'
    : `Interested in training with ${targetName}?`;
  const kidQuestion = isAcademy
    ? 'Wanna join your Kid into the Academy?'
    : 'Wanna join your Kid for training?';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink-950/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-2xl sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-ink-600 transition-colors hover:bg-ink-200 hover:text-ink-950"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Sparkles className="h-3.5 w-3.5" /> Official TruCoach Application
            </span>

            <div className="mt-3">
              <h2 className="font-display text-2xl font-700 tracking-tight text-ink-950 sm:text-3xl">
                {mainQuestion}
              </h2>
              <p className="mt-1 font-display text-lg font-600 text-orange-600">
                or {kidQuestion}
              </p>
            </div>

            <p className="mt-3 text-sm font-medium leading-relaxed text-ink-600">
              Download our Official Application to Book Trials &amp; Explore All Coaches of different sports
            </p>
          </div>

          {/* Two Non-Overlapping QR Code Scanner Cards */}
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* iOS App Store Card */}
            <div className="flex flex-col items-center rounded-3xl border-2 border-ink-100 bg-gradient-to-b from-ink-50/60 to-white p-5 text-center shadow-xs transition hover:border-orange-200 hover:shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
                <AppStoreIcon size={18} className="h-[18px] w-[18px] rounded-[4px]" />
                <span>Apple App Store</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-500">Scan with iPhone or iPad camera</p>

              {/* High-res non-overlapping QR image */}
              <div className="my-4 rounded-2xl border border-ink-200 bg-white p-2.5 shadow-sm">
                <img
                  src={APP_STORE_QR_SRC}
                  alt="Download TruCoach on Apple App Store"
                  className="h-36 w-36 rounded-xl object-contain sm:h-40 sm:w-40"
                />
              </div>

              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full !py-2.5 !text-xs font-bold"
              >
                <AppStoreIcon size={14} className="h-3.5 w-3.5" />
                Open App Store
              </a>
            </div>

            {/* Android Google Play Card */}
            <div className="flex flex-col items-center rounded-3xl border-2 border-ink-100 bg-gradient-to-b from-ink-50/60 to-white p-5 text-center shadow-xs transition hover:border-orange-200 hover:shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
                <GooglePlayIcon size={18} className="h-[18px] w-[18px] rounded-[4px]" />
                <span>Google Play Store</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-500">Scan with Android phone camera</p>

              {/* High-res non-overlapping QR image */}
              <div className="my-4 rounded-2xl border border-ink-200 bg-white p-2.5 shadow-sm">
                <img
                  src={GOOGLE_PLAY_QR_SRC}
                  alt="Download TruCoach on Google Play"
                  className="h-36 w-36 rounded-xl object-contain sm:h-40 sm:w-40"
                />
              </div>

              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full !py-2.5 !text-xs font-bold"
              >
                <GooglePlayIcon size={14} className="h-3.5 w-3.5" />
                Open Google Play
              </a>
            </div>
          </div>

          {/* TruCoach App Features Strip */}
          <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 text-center sm:text-left">
              Inside the Official App
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs text-ink-700">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="font-semibold">Book Free Trials</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold">Explore All Coaches</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-semibold">Live Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="font-semibold">Skill Remarks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-semibold">Batch Schedules</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">100% Free Trial</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Official TruCoach Application · Available on iOS &amp; Android</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { X, Copy, Check, Share2, QrCode, Sparkles, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url?: string;
}

export function ShareQrModal({
  isOpen,
  onClose,
  title,
  subtitle,
  url = typeof window !== 'undefined' ? window.location.href : '',
}: ShareQrModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // ignore clipboard error
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: subtitle || `Check out ${title} on TruCoach!`,
          url,
        });
      } else {
        handleCopy();
      }
    } catch {
      // user cancelled share
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-2xl text-center sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-ink-100 text-ink-600 transition-colors hover:bg-ink-200 hover:text-ink-950"
            aria-label="Close share dialog"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
            <QrCode className="h-6 w-6" />
          </div>

          <h3 className="mt-4 font-display text-xl font-700 text-ink-950">Share {title}</h3>
          <p className="mt-1 text-xs text-ink-500">
            Scan with any phone camera or share the direct link with parents and athletes.
          </p>

          {/* QR Code Container with nice styling */}
          <div className="mt-5 flex justify-center">
            <div className="relative rounded-2xl border-2 border-orange-100 bg-gradient-to-b from-orange-50/50 to-white p-4 shadow-inner">
              <img
                src={qrSrc}
                alt={`QR code for ${title}`}
                className="h-44 w-44 rounded-xl shadow-sm"
              />
              <div className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-orange-600">
                TruCoach Profile QR
              </div>
            </div>
          </div>

          {/* URL Copy Box */}
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 p-2 text-left">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 bg-transparent px-2 text-xs font-medium text-ink-700 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-ink-900 shadow-sm border border-ink-200 transition hover:bg-ink-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-ink-600" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Native Share button */}
          <button
            onClick={handleNativeShare}
            className="btn-primary mt-4 w-full !py-3 !text-xs font-bold"
          >
            <Share2 className="h-4 w-4" /> Share via Apps / Social
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

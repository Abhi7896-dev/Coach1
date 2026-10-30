import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileLightboxProps {
  images: string[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  title?: string;
}

export function ProfileLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  title = 'Gallery Image',
}: ProfileLightboxProps) {
  const isOpen = currentIndex !== null && currentIndex >= 0 && currentIndex < images.length;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex !== null && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex !== null && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || currentIndex === null) return null;

  const currentUrl = images[currentIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink-950/90 backdrop-blur-md"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 flex max-h-[90vh] max-w-5xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-ink-950/60 p-2 shadow-2xl backdrop-blur-2xl"
        >
          {/* Top Bar */}
          <div className="flex w-full items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                {currentIndex + 1} of {images.length}
              </span>
              <span className="hidden text-xs font-medium text-ink-300 sm:inline-block">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                title="Open full resolution"
              >
                <Maximize2 className="h-4 w-4" />
              </a>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close lightbox"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Image View */}
          <div className="relative flex max-h-[75vh] w-full items-center justify-center overflow-hidden p-2">
            <img
              src={currentUrl}
              alt={`${title} - #${currentIndex + 1}`}
              className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(currentIndex - 1);
                }}
                className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition-all hover:scale-105 hover:bg-black/80"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next Button */}
            {currentIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(currentIndex + 1);
                }}
                className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition-all hover:scale-105 hover:bg-black/80"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Thumbnails Strip (if > 1 image) */}
          {images.length > 1 && (
            <div className="no-scrollbar flex w-full gap-2 overflow-x-auto px-4 pb-3 pt-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(idx)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    idx === currentIndex
                      ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

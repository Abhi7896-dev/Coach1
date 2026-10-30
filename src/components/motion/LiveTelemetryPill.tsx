import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Zap, MessageCircle } from 'lucide-react';

const TELEMETRY_ITEMS = [
  {
    icon: Activity,
    tag: 'Live Attendance',
    text: '28/30 athletes checked in · Velocity Academy',
    color: 'text-green-400',
    dot: 'bg-green-400',
  },
  {
    icon: MessageCircle,
    tag: 'WhatsApp Sync',
    text: 'Broadcast delivered to 28 parents · Zero delay',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  {
    icon: ShieldCheck,
    tag: 'Verified Network',
    text: '100% physically verified tutors across Hyderabad',
    color: 'text-orange-400',
    dot: 'bg-orange-400',
  },
  {
    icon: Zap,
    tag: 'Fee Engine',
    text: 'Instant UPI receipt dispatched to parent WhatsApp',
    color: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
];

export function LiveTelemetryPill() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TELEMETRY_ITEMS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const current = TELEMETRY_ITEMS[index];
  const Icon = current.icon;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/10">
      {/* Pulsing live radar indicator */}
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${current.dot} opacity-75`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${current.dot}`} />
      </span>

      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300">
        Live Ecosystem
      </span>

      <span className="h-3 w-px bg-white/20" />

      {/* Dynamic cycling status with smooth motion */}
      <div className="relative h-4.5 w-64 sm:w-80 overflow-hidden text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center gap-1.5 truncate text-xs font-medium text-white"
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${current.color}`} />
            <span className="truncate">{current.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { Dumbbell, Music2, Swords, Trophy, Activity, Zap, ShieldCheck, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { icon: Trophy, label: 'Badminton & Tennis', color: 'from-orange-500 to-orange-600', glow: 'shadow-glow-orange' },
  { icon: Activity, label: 'Boxing & Karate', color: 'from-blue-500 to-blue-600', glow: 'shadow-glow-blue' },
  { icon: Dumbbell, label: 'Gymnastics & Athletics', color: 'from-green-500 to-green-600', glow: 'shadow-glow-green' },
  { icon: Swords, label: 'Martial Arts & MMA', color: 'from-orange-500 to-red-600', glow: 'shadow-glow-orange' },
  { icon: Music2, label: 'Music & Dance', color: 'from-blue-500 to-indigo-600', glow: 'shadow-glow-blue' },
  { icon: Trophy, label: 'Cricket & Football', color: 'from-yellow-500 to-orange-500', glow: 'shadow-glow-orange' },
  { icon: Activity, label: 'Swimming & Skating', color: 'from-teal-500 to-blue-500', glow: 'shadow-glow-blue' },
  { icon: Sparkles, label: 'Chess & Academics', color: 'from-purple-500 to-pink-500', glow: 'shadow-glow' },
];

const ECOSYSTEM_PERKS = [
  { icon: Zap, text: 'Real-time WhatsApp Attendance', accent: 'text-green-400' },
  { icon: ShieldCheck, text: '100% Physically Verified Tutors', accent: 'text-orange-400' },
  { icon: CheckCircle2, text: 'Automated Monthly Skill PDF Reports', accent: 'text-blue-400' },
  { icon: Sparkles, text: 'Instant UPI Digital Fee Receipts', accent: 'text-yellow-400' },
  { icon: MapPin, text: 'Active Across Hyderabad Communities', accent: 'text-green-400' },
  { icon: Trophy, text: 'Free Trial Discovery Engine', accent: 'text-orange-400' },
];

export function CategoryStrip() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink-950 py-10 text-white">
      {/* Background ambient glow line */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,90,12,0.15),transparent)]" />
      <div className="absolute inset-0 -z-10 dot-bg-dark opacity-20" />

      {/* Header bar */}
      <div className="container-page mb-6 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping" />
            Multi-Sport
          </span>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-700 tracking-tight text-white">
            One Unified Ecosystem<span className="text-orange-400">.</span> Every Discipline.
          </h3>
        </div>

        {/* Live Location Beacon */}
        <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold text-green-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span>Live Now in Hyderabad, India</span>
          <span className="hidden text-ink-400 sm:inline">· Expanding Nationwide</span>
        </div>
      </div>

      {/* Stream 1: Infinite flowing sports marquee (Left) */}
      <div className="mask-fade-x relative mt-4 overflow-hidden py-2">
        <div className="flex w-max animate-marquee gap-3 pause-hover [will-change:transform] [transform:translateZ(0)]">
          {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <motion.div
              key={`${c.label}-${i}`}
              whileHover={{ scale: 1.05, y: -2 }}
              className="group inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.08] sm:bg-white/[0.06] py-2 pl-2 pr-5 backdrop-blur-none sm:backdrop-blur-md transition-all duration-300 hover:border-orange-400/50 hover:bg-white/[0.12]"
            >
              <span className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${c.color} text-white shadow-sm transition-transform duration-300 group-hover:rotate-6`}>
                <c.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-white group-hover:text-orange-300 transition-colors">
                {c.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stream 2: Dynamic ecosystem perks flowing reverse (Right) */}
      <div className="mask-fade-x relative mt-3 overflow-hidden py-1">
        <div className="flex w-max animate-marquee-reverse gap-3 pause-hover [will-change:transform] [transform:translateZ(0)]">
          {[...ECOSYSTEM_PERKS, ...ECOSYSTEM_PERKS, ...ECOSYSTEM_PERKS].map((p, i) => (
            <div
              key={`${p.text}-${i}`}
              className="inline-flex cursor-default items-center gap-2 rounded-full border border-white/5 bg-ink-900/90 sm:bg-ink-900/60 px-4 py-1.5 text-xs font-medium text-ink-300 backdrop-blur-none sm:backdrop-blur transition-colors hover:border-white/20 hover:text-white"
            >
              <p.icon className={`h-3.5 w-3.5 ${p.accent}`} />
              <span>{p.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

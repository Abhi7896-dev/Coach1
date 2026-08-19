import { Dumbbell, Music2, Palette, BookOpen, Trophy, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CATEGORIES = [
  { icon: Trophy, label: 'Badminton & Tennis' },
  { icon: Activity, label: 'Boxing & Karate' },
  { icon: Dumbbell, label: 'Gymnastics & Athletics' },
  { icon: Palette, label: 'Martial Arts' },
  { icon: Music2, label: 'Music & Dance' },
  // { icon: Trophy, label: 'And Many More' },
];

export function CategoryStrip() {
  return (
    <section className="border-y border-ink-100 bg-ink-50/60 py-6">
      <div className="container-page">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <p className="text-sm font-medium text-ink-500">
            One ecosystem for every discipline
          </p>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-5%" }}
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 sm:gap-x-9"
          >
            {CATEGORIES.map((c) => (
              <motion.div
                key={c.label}
                variants={itemVariants}
                className="group inline-flex items-center gap-2 text-ink-600 transition-colors hover:text-ink-950"
              >
                <c.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">{c.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Live Location Note */}
        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-700 ring-1 ring-orange-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Currently Live in Hyderabad, India.
          </span>
        </div>
        <p className='text-center text-sm font-medium text-ink-500'>Coming to your City Soon :)</p>
      </div>
    </section>
  );
}

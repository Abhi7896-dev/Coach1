import { Dumbbell, Music2, Palette, BookOpen, Trophy, Activity } from 'lucide-react';

const CATEGORIES = [
  { icon: Trophy, label: 'Sports' },
  { icon: Dumbbell, label: 'Fitness' },
  { icon: Music2, label: 'Music' },
  { icon: Palette, label: 'Arts' },
  { icon: BookOpen, label: 'Academics' },
  { icon: Activity, label: 'Martial Arts' },
];

export function CategoryStrip() {
  return (
    <section className="border-y border-ink-100 bg-ink-50/60 py-6">
      <div className="container-page">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <p className="text-sm font-medium text-ink-500">
            One ecosystem for every discipline
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 sm:gap-x-9">
            {CATEGORIES.map((c) => (
              <div
                key={c.label}
                className="group inline-flex items-center gap-2 text-ink-600 transition-colors hover:text-ink-950"
              >
                <c.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

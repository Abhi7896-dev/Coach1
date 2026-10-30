import { Sparkles, Lightbulb, Layers, Scale } from 'lucide-react';
import { BackgroundScreening } from './motion/BackgroundScreening';
import { SpotlightCard } from './motion/SpotlightCard';

const DIFFERENTIATORS = [
  {
    icon: Lightbulb,
    tag: 'Why we exist',
    title: 'Local coaching talent was invisible.',
    body: "A great coach running sessions out of a local ground or a rented hall had no way to be discovered beyond word of mouth — and parents had no way to actually vet them. We built a verified community around that gap, not another private CRM.",
  },
  {
    icon: Layers,
    tag: 'What we actually do',
    title: 'One app, the whole academy.',
    body: "Attendance, fees, progress reports, and parent updates — automated and in one place, instead of five different tools and WhatsApp groups duct-taped together.",
  },
  {
    icon: Scale,
    tag: "How we're different",
    title: "We don't sell data, and we don't paywall trust.",
    body: "Role-based privacy by default — coaches see their batches, parents see their own child, nobody sees more than that. Transparent pricing, no ads, no data reselling.",
  },
];

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-24 overflow-hidden bg-ink-950 py-24 text-white lg:py-32">
      <BackgroundScreening variant="dark" showCourtLines={true} showParticles={true}>
        <div className="container-page py-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-200 backdrop-blur reveal">
              <Sparkles className="h-3.5 w-3.5 text-green-400" />
              Why TruCoach
            </span>
            <h2 className="reveal mt-5 font-display text-3xl font-700 leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]">
              Built different,
              <br />
              <span className="bg-gradient-to-r from-green-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                on purpose.
              </span>
            </h2>
            <p className="reveal reveal-delay-1 mt-5 text-lg leading-relaxed text-ink-200">
              Most sports platforms bolt a listings page onto generic business software. TruCoach
              is built sport-first, from the ground up — and that shows up in three ways.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {DIFFERENTIATORS.map((d, i) => (
              <SpotlightCard
                key={d.title}
                spotlightColor="rgba(25, 176, 98, 0.16)"
                glowColor="rgba(25, 176, 98, 0.45)"
                className="group border border-white/10 bg-white/[0.04] p-7 backdrop-blur-none sm:backdrop-blur transition-all duration-300 hover:border-green-400/30 hover:bg-white/[0.07]"
              >
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-green-400 to-blue-400 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/15 text-green-300 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-green-400 group-hover:text-green-950">
                  <d.icon className="h-6 w-6" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-green-400">{d.tag}</p>
                <h3 className="mt-2 font-display text-xl font-700 leading-snug text-white">{d.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-300">{d.body}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </BackgroundScreening>
    </section>
  );
}

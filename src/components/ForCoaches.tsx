import {
  Globe,
  LayoutGrid,
  MessageCircle,
  Store,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

const COACH_IMG =
  'https://images.pexels.com/photos/38675930/pexels-photo-38675930.jpeg?auto=compress&cs=tinysrgb&h=1100&w=850';

const FEATURES = [
  {
    icon: Globe,
    title: 'A stunning public portfolio',
    body: "Launch a professional academy page in minutes — photos, disciplines, timings, fees, and achievements. Your brand, live on the web, no designer required.",
  },
  {
    icon: LayoutGrid,
    title: 'Batches, attendance & fees',
    body: "Organize students into batches, mark live attendance in seconds, and auto-generate professional receipts. The paperwork disappears.",
  },
  {
    icon: MessageCircle,
    title: 'Instant WhatsApp alerts',
    body: "Schedule changes, event reminders, and fee notices land straight on parents' WhatsApp — no phone tree, no missed messages.",
  },
  {
    icon: Store,
    title: 'Community Marketplace',
    body: "Get discovered by families searching your pincode. The marketplace surfaces verified academies to the parents closest to you.",
  },
];

export function ForCoaches() {
  return (
    <section id="coaches" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="container-page">
        <div className="grid items-start gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          {/* Left: image + marketplace card */}
          <div className="reveal relative lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-[2rem] border border-ink-100 shadow-[0_24px_60px_-24px_rgba(15,18,25,0.25)]">
              <img
                src={COACH_IMG}
                alt="A confident coach on the field at golden hour"
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                    Coach · Football
                  </div>
                  <div className="font-display text-2xl font-700 text-white">
                    Velocity Academy
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>
            </div>

            {/* Marketplace discovery card */}
            <div className="absolute -right-3 -top-4 w-44 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-glow sm:-right-6 lg:-right-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-900">
                <Store className="h-4 w-4 text-orange-500" />
                Marketplace
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
                Found by 14 parents near <span className="font-semibold text-ink-800">560037</span>
              </p>
              <div className="mt-2 flex -space-x-2">
                {['bg-orange-400', 'bg-blue-400', 'bg-green-400', 'bg-ink-400'].map((c, i) => (
                  <span
                    key={i}
                    className={`h-6 w-6 rounded-full ${c} ring-2 ring-white`}
                  />
                ))}
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-600 ring-2 ring-white">
                  +10
                </span>
              </div>
            </div>
          </div>

          {/* Right: copy + features */}
          <div>
            <span className="eyebrow reveal">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              For the Coach
            </span>
            <h2 className="reveal mt-5 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-[2.9rem]">
              Your Digital Academy,
              <br />
              <span className="text-gradient-warm">built in an afternoon.</span>
            </h2>
            <p className="reveal reveal-delay-1 mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
              You're elite at teaching — not at spreadsheets. Academy Manager
              handles the operations layer of your coaching business so you can
              walk onto the field, the mat, or the studio and simply coach.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`reveal reveal-delay-${(i % 4) + 1} group rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-glow-orange`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                    <f.icon className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-600 text-ink-950">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.body}</p>
                </div>
              ))}
            </div>

            <a
              href="#join"
              className="reveal reveal-delay-3 mt-9 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              Start building your academy
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

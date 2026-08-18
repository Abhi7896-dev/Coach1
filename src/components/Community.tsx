import { MapPin, Search, BadgeCheck, Navigation, Star } from 'lucide-react';

const ACADEMIES = [
  {
    name: 'Velocity Football Academy',
    coach: 'Coach Ramesh',
    discipline: 'Sports',
    rating: 4.9,
    pincode: '560037',
    color: 'from-orange-500 to-orange-600',
    img: 'https://images.pexels.com/photos/8941567/pexels-photo-8941567.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  },
  {
    name: 'Rhythm Music Studio',
    coach: 'Coach Anita',
    discipline: 'Music',
    rating: 4.8,
    pincode: '560037',
    color: 'from-blue-500 to-blue-600',
    img: 'https://images.pexels.com/photos/8520472/pexels-photo-8520472.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  },
  {
    name: 'Zenith Martial Arts',
    coach: 'Coach Vikram',
    discipline: 'Martial Arts',
    rating: 5.0,
    pincode: '560034',
    color: 'from-green-500 to-green-600',
    img: 'https://images.pexels.com/photos/8041297/pexels-photo-8041297.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  },
];

export function Community() {
  return (
    <section id="community" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="container-page">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow reveal">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            The Community
          </span>
          <h2 className="reveal mt-5 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-[2.9rem]">
            We're mapping every local academy
            <br />
            so no talent goes unnoticed.
          </h2>
          <p className="reveal reveal-delay-1 mt-5 text-lg leading-relaxed text-ink-600">
            Academy Manager is more than software — it's a discovery engine. Families
            search by pincode and find verified coaches right in their neighborhood.
            Talent meets opportunity, block by block.
          </p>
        </div>

        {/* Search bar mock */}
        <div className="reveal reveal-delay-2 mx-auto mt-12 max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-white p-2 shadow-[0_12px_32px_-16px_rgba(15,18,25,0.18)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-950 text-white">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              defaultValue="Football near 560037"
              readOnly
              className="flex-1 bg-transparent px-2 text-sm font-medium text-ink-800 outline-none sm:text-base"
            />
            <button type="button" className="btn-primary !px-5 !py-2.5 !text-[13px]">
              <Navigation className="h-4 w-4" />
              Search
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-400">
            <span>Popular:</span>
            {['Football', 'Piano', 'Karate', 'Chess', 'Dance'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-ink-200 bg-white px-3 py-1 font-medium text-ink-600"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Academy cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACADEMIES.map((a, i) => (
            <article
              key={a.name}
              className={`reveal reveal-delay-${(i % 3) + 1} group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_12px_32px_-20px_rgba(15,18,25,0.2)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow`}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={a.img}
                  alt={a.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${a.color} opacity-20 mix-blend-multiply`} />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink-900 backdrop-blur">
                  <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
                  Verified
                </span>
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                  <Star className="h-3 w-3 text-orange-400" />
                  {a.rating}
                </span>
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {a.discipline}
                </div>
                <h3 className="mt-1 font-display text-lg font-700 text-ink-950">
                  {a.name}
                </h3>
                <div className="mt-1 text-sm text-ink-500">{a.coach}</div>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                    Pincode {a.pincode}
                  </span>
                  <span className="text-xs font-semibold text-green-600">2.4 km away</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Verified Coach explainer */}
        <div className="reveal mt-16 grid gap-6 rounded-3xl border border-ink-100 bg-ink-50/70 p-7 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700">
              <BadgeCheck className="h-4 w-4" />
              The Verified Coach system
            </span>
            <h3 className="mt-4 font-display text-2xl font-700 text-ink-950 sm:text-3xl">
              Trust, earned and displayed.
            </h3>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-600">
              Every coach on Academy Manager goes through identity and credential
              verification. Once cleared, they earn the green Verified badge — a
              signal parents can rely on when choosing who will shape their child.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
            {[
              { step: '01', title: 'Identity check', body: 'Government ID + selfie verification.' },
              { step: '02', title: 'Credential review', body: 'Coaching certifications & experience validated.' },
              { step: '03', title: 'Badge granted', body: 'Verified status displayed across the marketplace.' },
            ].map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-white p-4"
              >
                <span className="font-display text-lg font-700 text-green-600">{s.step}</span>
                <div>
                  <div className="text-sm font-semibold text-ink-900">{s.title}</div>
                  <div className="text-xs text-ink-500">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

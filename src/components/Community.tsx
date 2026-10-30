import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Search, Navigation, ChevronDown, HelpCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import gsap from 'gsap';
import { searchAcademies, DirectoryAcademy } from '@/lib/directoryData';
import { BackgroundScreening } from './motion/BackgroundScreening';
import { SpotlightCard } from './motion/SpotlightCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } }
};

const MIN_RESULTS_FOR_GRID = 1;

const AVATAR_COLORS = ['from-orange-500 to-orange-600', 'from-blue-500 to-blue-600', 'from-green-500 to-green-600'];
function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Community() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [academies, setAcademies] = useState<DirectoryAcademy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Loads an initial set of academies on mount
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    searchAcademies('', 6)
      .then(setAcademies)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Scroll reveal animation for academy cards
  useEffect(() => {
    if (loading || academies.length < MIN_RESULTS_FOR_GRID) return;
    const ctx = gsap.context(() => {
      let mm = gsap.matchMedia();

      // On desktop, full interactive scrub
      mm.add("(min-width: 1024px)", () => {
        gsap.fromTo('.academy-card',
          { y: 120, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.cards-container',
              start: 'top 85%',
              end: 'center center',
              scrub: true,
            }
          }
        );
      });

      // On mobile/tablet, smooth entrance once without scroll scrub lock
      mm.add("(max-width: 1023px)", () => {
        gsap.fromTo('.academy-card',
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.cards-container',
              start: 'top 90%',
              once: true,
            }
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading, academies]);

  return (
    <section ref={sectionRef} id="community" className="relative scroll-mt-24 py-16 lg:py-24 bg-ink-50/30">
      <BackgroundScreening variant="light" showCourtLines={true} showParticles={false}>
        <div className="container-page relative py-6">
        {/* Heading */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.span variants={itemVariants} className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            The Community
          </motion.span>
          <motion.h2 variants={itemVariants} className="mt-5 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-[2.9rem]">
            We're mapping every local academy
            <br />
            so no talent goes unnoticed.
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-5 text-lg leading-relaxed text-ink-600">
            TruCoach is more than software — it's a vibrant sports community.
            Connecting multiple tutors from diverse sports backgrounds, parents can
            easily find live teachers nearby with all their experience, achievements,
            and certifications at one place.
          </motion.p>
        </motion.div>

        {/* Search bar — Clicking anywhere redirects to /academies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div
            onClick={() => navigate('/academies')}
            role="button"
            tabIndex={0}
            aria-label="Click to search academies directory"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/academies');
              }
            }}
            className="group flex cursor-pointer items-center gap-2 rounded-full border border-ink-200 bg-white p-2 shadow-[0_12px_32px_-16px_rgba(15,18,25,0.18)] transition-all duration-300 hover:border-orange-300 hover:shadow-glow-orange hover:scale-[1.01]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-950 text-white transition-all group-hover:scale-105 group-hover:bg-orange-500">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              readOnly
              onClick={() => navigate('/academies')}
              onFocus={() => navigate('/academies')}
              placeholder="Search by sport, city, or area..."
              className="flex-1 cursor-pointer bg-transparent px-2 text-sm font-medium text-ink-800 outline-none sm:text-base placeholder:text-ink-400 select-none"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/academies');
              }}
              className="btn-primary !px-5 !py-2.5 !text-[13px] shadow-sm"
            >
              <Navigation className="h-4 w-4" />
              Search
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-400">
            <span>Popular:</span>
            {['Football', 'Piano', 'Karate', 'Chess', 'Dance', 'Badminton', 'Swimming'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => navigate(`/academies?sport=${encodeURIComponent(t)}`)}
                className="cursor-pointer rounded-full border border-ink-200 bg-white px-3 py-1 font-medium text-ink-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Academy cards */}
        {loading ? (
          <div className="mt-14 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          </div>
        ) : loadError ? (
          <p className="mt-14 text-center text-sm text-ink-500">Couldn't load academies right now — please try again shortly.</p>
        ) : academies.length < MIN_RESULTS_FOR_GRID ? (
          <div className="mx-auto mt-14 max-w-md rounded-3xl border border-dashed border-ink-200 bg-white/60 p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-orange-400" />
            <h3 className="mt-4 font-display text-lg font-700 text-ink-950">We're onboarding academies in your area</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              New verified academies join every week — check back soon, or be one of the first to{' '}
              <a href="#join" className="font-semibold text-orange-600 hover:text-orange-700">join the ecosystem</a>.
            </p>
          </div>
        ) : (
          <>
            <div className="cards-container mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {academies.map((a) => (
                <Link
                  key={a.id}
                  to={`/academy/${a.slug || a.id}`}
                  className="group block outline-none"
                >
                  <motion.article
                    whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
                    className="academy-card h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_12px_32px_-20px_rgba(15,18,25,0.2)] transition-colors duration-300 group-hover:border-orange-300 group-hover:shadow-glow-orange"
                  >
                    <div>
                      <div className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${avatarGradient(a.id)}`}>
                        {a.logo_url ? (
                          <img src={a.logo_url} alt={a.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <span className="font-display text-4xl font-700 text-white/90">{a.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="p-5">
                        {a.sports_offered && a.sports_offered.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {a.sports_offered.slice(0, 3).map((s) => (
                              <span key={s} className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="mt-2 font-display text-lg font-700 text-ink-950 transition-colors group-hover:text-orange-600">{a.name}</h3>
                        {a.description && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{a.description}</p>}
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between border-t border-ink-100 pt-3.5 text-xs font-medium text-ink-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">{[a.locality, a.pincode].filter(Boolean).join(' · ') || 'Location coming soon'}</span>
                        </div>
                        <span className="shrink-0 font-bold text-orange-600 flex items-center gap-0.5 transition-transform group-hover:translate-x-1">
                          View <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>

            {/* Link to Full Directory */}
            <div className="mt-12 flex justify-center">
              <Link
                to="/academies"
                className="group inline-flex items-center gap-2.5 rounded-full border border-orange-200 bg-white px-7 py-3.5 font-display text-sm font-bold text-ink-900 shadow-sm transition-all duration-300 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4 text-orange-500 transition-transform group-hover:scale-110" />
                <span>Explore All Verified Academies & Coaches</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        )}

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="mt-20 max-w-3xl mx-auto pb-10"
        >
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600">
              <HelpCircle className="h-4 w-4" />
              Frequently Asked Questions
            </span>
            <h3 className="mt-4 font-display text-3xl font-700 text-ink-950 sm:text-4xl">
              Everything you need to know.
            </h3>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How do I book a trial session?', a: 'Download the official TruCoach app to explore coaches across multiple sports, view batch schedules, and book trial sessions directly with verified academies.' },
              { q: 'How does live attendance work?', a: 'When your child arrives, the coach marks attendance via the TruCoach app. You instantly receive a WhatsApp alert confirming their safe arrival.' },
              { q: 'Can I pay fees through the app?', a: 'Absolutely. TruCoach generates secure payment links powered by Easebuzz. You can pay via UPI, cards, or net banking, and get automated digital receipts.' },
              { q: 'Is it only for sports?', a: 'No, TruCoach supports multiple disciplines including music, arts, academics, and martial arts! Any academy or private tutor can join the ecosystem.' },
              { q: 'How do I join the Community?', a: 'Every tutor, coach, and academy is physically verified by TruCoach administrators and must strictly follow our Community Guidelines.' },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:border-orange-200"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-display text-lg font-600 text-ink-900 focus:outline-none"
                >
                  {faq.q}
                  <motion.div animate={{ rotate: openFaq === index ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className={`h-5 w-5 transition-colors duration-300 ${openFaq === index ? 'text-orange-500' : 'text-ink-400'}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <p className="px-5 pb-5 text-ink-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      </BackgroundScreening>
    </section>
  );
}

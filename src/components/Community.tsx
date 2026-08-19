import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, BadgeCheck, Navigation, Star, Clock, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import gsap from 'gsap';

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

const ACADEMIES = [
  {
    name: 'Velocity Football Academy',
    coach: 'Coach Ramesh',
    discipline: 'Sports',
    rating: 4.9,
    location: 'Kompally, Hyderabad',
    color: 'from-orange-500 to-orange-600',
    img: 'https://images.pexels.com/photos/8941567/pexels-photo-8941567.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    experience: '5+ Years',
    distance: '2.4 km away',
  },
  {
    name: 'Rhythm Music Studio',
    coach: 'Coach Anita',
    discipline: 'Music',
    rating: 4.8,
    location: 'Alwal, Hyderabad',
    color: 'from-blue-500 to-blue-600',
    img: 'https://images.pexels.com/photos/8520472/pexels-photo-8520472.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    experience: '8+ Years',
    distance: '1.2 km away',
  },
  {
    name: 'Zenith Martial Arts',
    coach: 'Coach Vikram',
    discipline: 'Martial Arts',
    rating: 5.0,
    location: 'Bowenpally, Hyderabad',
    color: 'from-green-500 to-green-600',
    img: 'https://images.pexels.com/photos/8041297/pexels-photo-8041297.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    experience: '12+ Years',
    distance: '3.8 km away',
  },
];

export function Community() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="community" className="relative scroll-mt-24 py-16 lg:py-24 bg-ink-50/30">
      <div className="absolute inset-0 -z-10 bg-blue-50/20 dot-bg opacity-40" />
      <div className="container-page relative">
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

        {/* Search bar mock */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-white p-2 shadow-[0_12px_32px_-16px_rgba(15,18,25,0.18)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-950 text-white">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              defaultValue="Martial Arts"
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
        </motion.div>

        {/* Academy cards */}
        <div 
          className="cards-container mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ACADEMIES.map((a, i) => (
            <motion.article
              key={a.name}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="academy-card group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_12px_32px_-20px_rgba(15,18,25,0.2)] hover:shadow-glow"
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
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  Exp: {a.experience}
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
                    {a.location}
                  </span>
                  <span className="text-xs font-semibold text-green-600">{a.distance}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

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
            {/* ... */}
            {[
              { q: 'How do I book a free trial?', a: 'Simply browse the Community marketplace for academies near you, select the one you like, and click "Book Free Trial". The coach will be notified instantly.' },
              { q: 'How does live attendance work?', a: 'When your child arrives, the coach marks attendance via the TruCoach app. You instantly receive a WhatsApp alert confirming their safe arrival.' },
              { q: 'Can I pay fees through the app?', a: 'Absolutely. TruCoach generates secure payment links powered by Cashfree. You can pay via UPI, cards, or net banking, and get automated digital receipts.' },
              { q: 'Is it only for sports?', a: 'No, TruCoach supports multi-disciplines including music, arts, academics, and martial arts! Any academy or private tutor can join the ecosystem.' },
              { q: 'How do I Join Community?', a: 'The Tutors / Coaches / Academis are physically verified by TruCoach Administrators and should strictly follow Community Guide lines.' },
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
    </section>
  );
}

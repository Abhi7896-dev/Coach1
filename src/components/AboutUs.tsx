import { Users, Target, Rocket, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpotlightCard } from './motion/SpotlightCard';

const FOUNDERS = [
  {
    name: 'Abhishek Khode',
    role: 'Founder',
    quote:
      "Building scalable systems that simplify sports academy management, allowing coaches to focus on developing athletes. Creating an ecosystem where local coaching talent is easily discoverable, giving coaches the visibility they deserve and parents an easier way to find the right coach.",
    // "I wanted to build scalable systems that simplify sports academy management, allowing coaches to focus on what they do best—developing athletes. Creating an ecosystem where great coaching talent in every neighborhood becomes easily discoverable, without the barriers of traditional systems. Giving coaches the visibility they deserve and parents the ease of finding the right coaching talent.",
    img: '/Abhi.png',
  },
  {
    name: 'Ashley Albert',
    role: 'Co-Founder',
    quote:
      "Being a sportsperson myself, I understand the importance of quality coaching and the challenges athletes face in finding the right opportunities. With my marketing background, I wanted to help great coaches gain the visibility they deserve and connect with more aspiring athletes.",
    img: '/Ashley.jpeg',
  },
];

export function AboutUs() {
  return (
    <section id="about" className="relative scroll-mt-24 py-24 lg:py-32 bg-ink-50/40">
      <div className="container-page">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            About TruCoach
          </span>
          <h2 className="mt-5 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-[2.9rem]">
            Built to Explore,
            <br />
            for the love of the game.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-600">
            We started TruCoach with a simple mission: to empower local coaches and connect communities through sports. We believe finding the right mentor should be as easy as sending a message.
          </p>
        </div>

        {/* Founders Insights — Balanced 2-Column Cards with Spotlight Effect */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 items-stretch">
            {FOUNDERS.map((founder, i) => (
              <SpotlightCard
                key={founder.name}
                spotlightColor="rgba(251, 90, 12, 0.08)"
                glowColor="rgba(251, 90, 12, 0.35)"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 sm:p-9 shadow-[0_12px_32px_-20px_rgba(15,18,25,0.12)] transition-all duration-300 hover:border-orange-200 hover:shadow-glow-orange"
              >
                {/* Decorative top-right quote icon watermark */}
                <div className="absolute right-6 top-6 text-orange-100 transition-colors group-hover:text-orange-200 pointer-events-none">
                  <Quote className="h-12 w-12" />
                </div>

                <div>
                  {/* Founder Profile Header */}
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="relative shrink-0">
                      <div className="h-20 w-20 sm:h-22 sm:w-22 overflow-hidden rounded-2xl border-2 border-white shadow-md bg-ink-50">
                        <img
                          src={founder.img}
                          alt={founder.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-700 text-ink-950">
                        {founder.name}
                      </h3>
                      <div className="mt-1 inline-block rounded-full bg-orange-50 border border-orange-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-orange-600">
                        {founder.role}
                      </div>
                    </div>
                  </div>

                  {/* Founder Quote — clean left alignment for high readability */}
                  <div className="mt-6 border-l-2 border-orange-300 pl-4">
                    <p className="text-sm sm:text-base leading-relaxed text-ink-700 italic">
                      "{founder.quote}"
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-ink-100 pt-4 text-xs font-semibold text-ink-400">
                  TruCoach Leadership
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>

        {/* Our Motto */}
        <div className="mt-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Our Motto
          </span>
          <h3 className="mt-6 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl">
            "Be Discovered. Be Successful."
          </h3>
        </div>

        {/* Mission Pillars */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              icon: Users,
              title: 'Community First',
              text: 'Everything we build starts with the needs of the coaches and parents we serve.',
            },
            {
              icon: Target,
              title: 'Uncompromising Quality',
              text: 'Experienced / Certified coaches, secure payments, and a premium experience from day one.',
            },
            {
              icon: Rocket,
              title: 'Continuous Growth',
              text: 'We are constantly evolving to bring the best tools to grassroots sports.',
            },
          ].map((pillar, i) => (
            <SpotlightCard
              key={pillar.title}
              spotlightColor="rgba(251, 90, 12, 0.08)"
              glowColor="rgba(251, 90, 12, 0.3)"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border border-ink-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-glow-orange"
            >
              <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-orange-400 to-orange-600 transition-transform duration-300 group-hover:scale-x-100" />
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h4 className="mt-4 font-display text-lg font-600 text-ink-950">{pillar.title}</h4>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{pillar.text}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

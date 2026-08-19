import { Users, Target, Rocket } from 'lucide-react';

const FOUNDERS = [
  {
    name: 'Abhishek Khode',
    role: 'Co-Founder',
    bio: 'Passionate about sports and technology, driven to connect local communities with the best coaching talent.',
    img: '/Abhi.png',
  },
  {
    name: 'Ashley Albert',
    role: 'Co-Founder',
    bio: 'Building scalable and secure platforms. Dedicated to making the technical aspects of sports management invisible and effortless.',
    img: '/Ashley.jpeg',
  }
];

export function AboutUs() {
  return (
    <section id="about" className="relative scroll-mt-24 py-24 lg:py-32 bg-ink-50/40">
      <div className="container-page">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow reveal">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            About TruCoach
          </span>
          <h2 className="reveal mt-5 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-[2.9rem]">
            Built to Explore,
            <br />
            for the love of the game.
          </h2>
          <p className="reveal reveal-delay-1 mt-5 text-lg leading-relaxed text-ink-600">
            We started TruCoach with a simple mission: to empower local coaches and connect communities through sports. We believe finding the right mentor should be as easy as sending a message.
          </p>
        </div>

        {/* Founders */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:mx-auto lg:max-w-4xl">
          {FOUNDERS.map((founder, i) => (
            <div
              key={founder.name}
              className={`reveal reveal-delay-${(i % 2) + 1} flex flex-col items-center rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-[0_12px_32px_-20px_rgba(15,18,25,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-glow`}
            >
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-ink-50 shadow-sm">
                <img
                  src={founder.img}
                  alt={founder.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-6 font-display text-xl font-700 text-ink-950">
                {founder.name}
              </h3>
              <div className="mt-1 text-sm font-semibold uppercase tracking-wider text-orange-500">
                {founder.role}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-600">
                {founder.bio}
              </p>
            </div>
          ))}
        </div>

        {/* Our Motto */}
        <div className="mt-20 text-center reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Our Motto
          </span>
          <h3 className="mt-6 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl">
            "Be Discovered. Be Successful."
          </h3>
        </div>

        {/* Mission Pillars */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {/* <span className="eyebrow reveal">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Our Moto
          </span> */}
          {[
            { icon: Users, title: 'Community First', text: 'Everything we build starts with the needs of the coaches and parents we serve.' },
            { icon: Target, title: 'Uncompromising Quality', text: 'Experienced /  Certified coaches, secure payments, and a premium experience from day one.' },
            { icon: Rocket, title: 'Continuous Growth', text: 'We are constantly evolving to bring the best tools to grassroots sports.' },
          ].map((pillar, i) => (
            <div key={pillar.title} className={`reveal reveal-delay-${(i % 3) + 1} rounded-2xl border border-ink-100 bg-white p-6`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h4 className="mt-4 font-display text-lg font-600 text-ink-950">{pillar.title}</h4>
              <p className="mt-2 text-sm text-ink-600">{pillar.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

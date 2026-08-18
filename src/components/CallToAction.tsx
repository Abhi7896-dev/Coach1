import { ArrowRight, MapPin, GraduationCap, Sparkles } from 'lucide-react';

const CTA_IMG =
  'https://images.pexels.com/photos/10347891/pexels-photo-10347891.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';

export function CallToAction() {
  return (
    <section id="join" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-32">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-950 px-6 py-16 text-center text-white sm:px-12 lg:py-24">
          {/* Background image */}
          <div className="absolute inset-0 -z-10">
            <img
              src={CTA_IMG}
              alt=""
              className="h-full w-full object-cover opacity-25"
              loading="lazy"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/70" />
            <div className="absolute -left-20 top-0 h-[360px] w-[360px] rounded-full bg-orange-500/30 blur-[100px]" />
            <div className="absolute -right-20 bottom-0 h-[360px] w-[360px] rounded-full bg-blue-500/30 blur-[100px]" />
          </div>

          <span className="reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            Join the ecosystem
          </span>

          <h2 className="reveal reveal-delay-1 mx-auto mt-6 max-w-3xl font-display text-3xl font-700 leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Your next chapter starts
            <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-green-300 bg-clip-text text-transparent">
              {' '}on the field.
            </span>
          </h2>
          <p className="reveal reveal-delay-2 mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-200">
            Whether you coach or cheer, Academy Manager brings your academy
            closer to the people who matter. Pick your path and get started today.
          </p>

          <div className="reveal reveal-delay-3 mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <a href="#top" className="btn-primary !px-7 !py-4 !text-base">
              <GraduationCap className="h-5 w-5" />
              Join the Ecosystem as a Tutor
            </a>
            <a
              href="#coaches"
              className="btn-secondary !bg-white/10 !px-7 !py-4 !text-base !text-white hover:!bg-white/15"
            >
              <MapPin className="h-5 w-5" />
              Discover Academies Near You
              <ArrowRight className="h-4.5 w-4.5" />
            </a>
          </div>

          <p className="reveal reveal-delay-4 mt-6 text-sm text-ink-400">
            Free to get started. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}

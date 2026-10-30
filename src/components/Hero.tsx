import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Star, ShieldCheck, TrendingUp, Users, Trophy, Zap, Timer } from 'lucide-react';
import { AppStoreIcon } from './AppStoreIcon';
import { GooglePlayIcon } from './GooglePlayIcon';
import { BackgroundScreening } from './motion/BackgroundScreening';
import { LiveTelemetryPill } from './motion/LiveTelemetryPill';
import { KineticTrajectory } from './motion/KineticTrajectory';
import { SpotlightCard } from './motion/SpotlightCard';
import { motion, Variants } from 'framer-motion';
import gsap from 'gsap';

const APP_STORE_URL = 'https://apps.apple.com/in/app/trucoach/id6808904997';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } }
};

const HERO_IMG =
  'https://images.pexels.com/photos/9517922/pexels-photo-9517922.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      let mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          }
        });

        tl.to('.parallax-bg-1', { y: -100, ease: 'none' }, 0)
          .to('.parallax-bg-2', { y: -200, ease: 'none' }, 0)
          .to('.parallax-bg-3', { y: -300, ease: 'none' }, 0)
          .to('.hero-text-container', { y: 150, opacity: 0, ease: 'none' }, 0)
          .to('.hero-image-container', { y: -80, opacity: 0.2, ease: 'none' }, 0);
      });

      mm.add("(max-width: 1023px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          }
        });

        tl.to('.parallax-bg-1', { y: -50, ease: 'none' }, 0)
          .to('.parallax-bg-2', { y: -100, ease: 'none' }, 0)
          .to('.hero-text-container', { opacity: 0, ease: 'none' }, 0)
          .to('.hero-image-container', { opacity: 0.3, ease: 'none' }, 0);
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="top" className="relative overflow-hidden bg-ink-950 text-white">
      {/* Dynamic Background Screening & Mesh with interactive spotlight & court geometry */}
      <BackgroundScreening variant="hero" showCourtLines={true} showParticles={true} className="w-full">
        <div className="container-page relative pt-20 pb-16 sm:pt-28 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            {/* Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } }
              }}
              className="hero-text-container max-w-2xl"
            >
              {/* Dynamic Live Telemetry Pill Motion Graphic */}
              <motion.div variants={itemVariants} className="mb-6">
                <LiveTelemetryPill />
              </motion.div>

              <motion.h1 variants={itemVariants} className="font-display text-[2.6rem] font-700 leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.1rem]">
                Empowering Coaches.<br />
                Delighting Parents.<br />
                <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
                  Building Champions.
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="mt-6 max-w-xl text-lg leading-relaxed text-ink-200">
                TruCoach is the premier real-time sports Community and operating system.
                Discover verified local tutors, book free trials, and join a multi-sport
                community—while we automate the attendance, fees, and communication for the coaches.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('join');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    window.dispatchEvent(new CustomEvent('open-tutor-modal'));
                  }}
                  className="btn-primary !px-7 !py-4 !text-base"
                >
                  Join the Ecosystem as a Tutor
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
                <Link to="/academies" className="btn-secondary !bg-white/10 !px-7 !py-4 !text-base !text-white hover:!bg-white/15">
                  <MapPin className="h-4.5 w-4.5" />
                  Discover Academies Near You
                </Link>
              </motion.div>

              {/* Trust row */}
              <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 text-sm text-ink-300">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-1.5 font-medium text-white ring-1 ring-white/20 backdrop-blur transition-all duration-200 hover:bg-white/15 hover:ring-white/30 hover:shadow-[0_4px_20px_-4px_rgba(0,122,255,0.4)]"
                >
                  <AppStoreIcon size={20} className="h-5 w-5 rounded-[5px] shadow-sm transition-transform duration-200 group-hover:scale-110" />
                  <span>
                    Available on the <span className="font-semibold text-white">App Store</span>
                  </span>
                </a>
                <a
                  href={GOOGLE_PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-1.5 font-medium text-white ring-1 ring-white/20 backdrop-blur transition-all duration-200 hover:bg-white/15 hover:ring-white/30 hover:shadow-[0_4px_20px_-4px_rgba(0,200,83,0.4)]"
                >
                  <GooglePlayIcon size={20} className="h-5 w-5 rounded-[5px] shadow-sm transition-transform duration-200 group-hover:scale-110" />
                  <span>
                    Available on <span className="font-semibold text-white">Google Play</span>
                  </span>
                </a>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                  Explore Coaches Securely
                </span>
                <span className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4 text-orange-400" />
                  Verified Coach network
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Built for Sports, Arts &amp; Academics
                </span>
              </motion.div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative"
            >
              <div className="hero-image-container">
                <HeroVisual />
              </div>
            </motion.div>
          </div>

          {/* Stat bar — Upgraded with interactive SpotlightCards */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Trophy, value: 'Multi-Sport', label: 'One ecosystem, every discipline', accent: 'text-orange-400', chip: 'bg-orange-500/15', border: 'border-orange-400/25', spotlight: 'rgba(251,90,12,0.18)', glow: 'rgba(251,90,12,0.4)' },
              { icon: TrendingUp, value: 'Real-Time', label: 'Attendance & updates, live', accent: 'text-blue-400', chip: 'bg-blue-500/15', border: 'border-blue-400/25', spotlight: 'rgba(50,130,251,0.18)', glow: 'rgba(50,130,251,0.4)' },
              { icon: ShieldCheck, value: '100%', label: 'Role-based data privacy', accent: 'text-green-400', chip: 'bg-green-500/15', border: 'border-green-400/25', spotlight: 'rgba(25,176,98,0.18)', glow: 'rgba(25,176,98,0.4)' },
              { icon: Zap, value: 'Zero', label: 'Spreadsheets. Fully automated', accent: 'text-orange-400', chip: 'bg-orange-500/15', border: 'border-orange-400/25', spotlight: 'rgba(251,90,12,0.18)', glow: 'rgba(251,90,12,0.4)' },
            ].map((s, i) => (
              <SpotlightCard
                key={s.label}
                spotlightColor={s.spotlight}
                glowColor={s.glow}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
                className={`group border bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-300 ${s.border} sm:p-5`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.chip} ${s.accent} transition-transform duration-300 group-hover:scale-110`}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="mt-3 font-display text-xl font-700 leading-none text-white sm:text-2xl">{s.value}</div>
                <div className="mt-1.5 text-[11px] leading-snug text-ink-300 sm:text-xs">{s.label}</div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </BackgroundScreening>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      {/* Kinetic Trajectory Arc Motion Graphic behind card */}
      <KineticTrajectory className="absolute -top-14 -left-12 w-96 h-48 -z-10 opacity-80" />

      {/* Dynamic ambient energy aura */}
      <div className="absolute -inset-2 rounded-[2.3rem] bg-gradient-to-tr from-orange-500/30 via-blue-500/20 to-green-500/25 blur-xl animate-pulse-glow -z-10" />

      {/* Main image card */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 shadow-glow bg-ink-900/60 backdrop-blur-sm">
        <img
          src={HERO_IMG}
          alt="A coach leading a group of young athletes through warm-up drills"
          className="aspect-[4/5] w-full object-cover sm:aspect-[5/5] lg:aspect-[4/5] transition-transform duration-700 hover:scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/15 to-transparent" />

        {/* Coach badge */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-md backdrop-blur">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-green-500 text-white">
            <ShieldCheck className="h-3 w-3" />
          </span>
          Verified Coach
        </div>
      </div>

      {/* Floating sticker badges — with smooth floating motion graphics */}
      <span className="absolute -right-3 -top-5 grid h-14 w-14 rotate-[9deg] place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-glow-orange animate-float-slow sm:-right-6">
        <Trophy className="h-6 w-6" />
      </span>
      <span className="absolute -right-2 bottom-1/3 grid h-11 w-11 rotate-[-10deg] place-items-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-glow-blue animate-float-reverse sm:-right-4">
        <Timer className="h-5 w-5" />
      </span>

      {/* Floating: live attendance with dynamic pulse indicator */}
      <div className="absolute -left-4 top-1/4 w-48 rounded-2xl border border-white/15 bg-ink-900/90 p-3.5 shadow-glow backdrop-blur-xl animate-float sm:-left-8 lg:-left-12">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">
            Live attendance
          </span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
        </div>
        <div className="mt-2.5 flex items-end gap-1.5 h-8">
          {[40, 65, 50, 80, 95, 70, 88].map((h, i) => (
            <div
              key={i}
              className="w-full rounded-sm bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500"
              style={{ height: `${h * 0.32}px` }}
            />
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="text-ink-300">Batch A</span>
          <span className="font-semibold text-green-400">28/30 Present</span>
        </div>
      </div>

      {/* Floating: WhatsApp alert */}
      <div className="absolute -right-3 bottom-10 w-52 rounded-2xl border border-white/15 bg-ink-900/90 p-3.5 shadow-glow backdrop-blur-xl animate-float-reverse sm:-right-6 lg:-right-10">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-green-500 text-white text-sm font-bold shadow-sm">
            W
          </span>
          <div>
            <div className="text-xs font-semibold text-white">WhatsApp alert</div>
            <div className="text-[10px] text-ink-400">Sent to 28 parents</div>
          </div>
        </div>
        <p className="mt-2.5 rounded-lg bg-white/5 p-2 text-[11px] leading-snug text-ink-200">
          “Tomorrow's match moved to 7 AM. Please bring water &amp; kit.”
        </p>
      </div>

      {/* Floating: progress remark */}
      <div className="absolute -bottom-5 left-8 w-52 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-glow backdrop-blur-xl animate-float-slow">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-orange-600">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div className="text-xs font-semibold text-ink-900">Progress remark</div>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-ink-600">
          “Aarav's footwork improved sharply this week. Ready for the next level.”
        </p>
      </div>
    </div>
  );
}

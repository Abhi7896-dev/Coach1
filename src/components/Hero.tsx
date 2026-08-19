import { useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Star, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import gsap from 'gsap';

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
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="top" className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-[0.18]" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="parallax-bg-1 absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-orange-600/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="parallax-bg-2 absolute -right-32 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/30 blur-[120px]" 
        />
        <div className="parallax-bg-3 absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-green-500/15 blur-[120px]" />
      </div>

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
            <motion.span variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-orange-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
              </span>
              The Complete Sports Community
            </motion.span>

            <motion.h1 variants={itemVariants} className="mt-6 font-display text-[2.6rem] font-700 leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              Empowering Coaches.<br />
              Delighting Parents.<br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent">
                Building Champions.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-6 max-w-xl text-lg leading-relaxed text-ink-200">
              TruCoach is the premier real-time sports Community and operating system.
              Discover verified local tutors, book free trials, and join a multi-sport
              community—while we automate the attendance, fees, and communication for the coaches.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#join" className="btn-primary !px-7 !py-4 !text-base">
                Join the Ecosystem as a Tutor
                <ArrowRight className="h-4.5 w-4.5" />
              </a>
              <a href="#coaches" className="btn-secondary !bg-white/10 !px-7 !py-4 !text-base !text-white hover:!bg-white/15">
                <MapPin className="h-4.5 w-4.5" />
                Discover Academies Near You
              </a>
            </motion.div>

            {/* Trust row */}
            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 text-sm text-ink-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 font-medium text-white ring-1 ring-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                Launching Shortly on App Store & Google Play
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                OTP &amp; Biometric secured
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
            className="hero-image-container relative"
          >
            <HeroVisual />
          </motion.div>
        </div>

        {/* Stat bar */}
        {/* <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-4 animate-fade-up [animation-delay:0.4s]">
          {[
            { icon: Users, value: '12K+', label: 'Active learners', color: 'text-orange-400' },
            { icon: Star, value: '850+', label: 'Verified coaches', color: 'text-blue-400' },
            { icon: MapPin, value: 'Multi-Sport', label: 'Local discovery', color: 'text-green-400' },
            { icon: TrendingUp, value: 'Real-Time', label: 'Updates & tracking', color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 bg-ink-950/40 px-5 py-5">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="font-display text-xl font-700 text-white">{s.value}</div>
                <div className="text-xs text-ink-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      {/* Main image card */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-glow">
        <img
          src={HERO_IMG}
          alt="A coach leading a group of young athletes through warm-up drills"
          className="aspect-[4/5] w-full object-cover sm:aspect-[5/5] lg:aspect-[4/5]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />

        {/* Coach badge */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-900 backdrop-blur">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-green-500 text-white">
            <ShieldCheck className="h-3 w-3" />
          </span>
          Verified Coach
        </div>
      </div>

      {/* Floating: live attendance */}
      <div className="absolute -left-4 top-1/4 w-44 rounded-2xl border border-white/10 bg-ink-900/90 p-3.5 shadow-glow backdrop-blur-xl animate-float sm:-left-8 lg:-left-12">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Live attendance
          </span>
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          {[40, 65, 50, 80, 95, 70, 88].map((h, i) => (
            <div
              key={i}
              className="w-full rounded-sm bg-gradient-to-t from-green-600 to-green-400"
              style={{ height: `${h * 0.32}px` }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-ink-300">Batch A</span>
          <span className="font-semibold text-green-400">28/30</span>
        </div>
      </div>

      {/* Floating: WhatsApp alert */}
      <div className="absolute -right-3 bottom-10 w-52 rounded-2xl border border-white/10 bg-ink-900/90 p-3.5 shadow-glow backdrop-blur-xl animate-float [animation-delay:1.5s] sm:-right-6 lg:-right-10">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-green-500 text-white text-sm font-bold">
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
      <div className="absolute -bottom-5 left-8 w-48 rounded-2xl border border-white/10 bg-white p-3.5 shadow-glow backdrop-blur-xl animate-float [animation-delay:0.8s]">
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

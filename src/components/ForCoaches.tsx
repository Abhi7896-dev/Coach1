import { useEffect, useRef } from 'react';
import {
  Globe,
  LayoutGrid,
  MessageCircle,
  Store,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';


const contentVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.1, type: 'spring', stiffness: 100, damping: 20 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } }
};

const COACH_IMG =
  'https://images.pexels.com/photos/38675930/pexels-photo-38675930.jpeg?auto=compress&cs=tinysrgb&h=1100&w=850';

const FEATURES = [
  {
    icon: Store,
    title: 'Community',
    body: "Get discovered by families searching for coaches in your area. The Community surfaces verified academies to parents, letting them book free trials directly.",
  },
  {
    icon: LayoutGrid,
    title: 'Smart Attendance & Fees',
    body: "Mark live attendance in seconds with visual compliance gauges. The Zero-Touch fee engine auto-sends payment links and digital receipts via WhatsApp.",
  },
  {
    icon: MessageCircle,
    title: 'Batch Flash Broadcast',
    body: "1-Tap real-time server-side WhatsApp alerts for rain delays, schedule shifts, or emergency cancellations sent directly to all parents in seconds.",
  },
  {
    icon: Globe,
    title: 'Multi-Coach Enterprise',
    body: "Perfect for independent trainers or full academies. Secure roles ensure all student data remains 100% owned and protected by the Academy Admin.",
  },
];

export function ForCoaches() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.coach-image-zoom', {
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="coaches" className="relative scroll-mt-24 py-16 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-orange-50/30 dot-bg opacity-30" />
      <div className="container-page relative">
        <div className="grid items-start gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          {/* Left: image + marketplace card */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="relative lg:sticky lg:top-28"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-ink-100 shadow-[0_24px_60px_-24px_rgba(15,18,25,0.25)]">
              <img
                src={COACH_IMG}
                alt="A confident coach on the field at golden hour"
                className="coach-image-zoom aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                    Coach · Tennis
                  </div>
                  <div className="font-display text-2xl font-700 text-white">
                    Velocity Academy
                  </div>
                </div>
                {/* <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span> */}
              </div>
            </div>

            {/* Marketplace discovery card */}
            <div className="absolute -right-3 -top-4 w-44 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-glow sm:-right-6 lg:-right-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-900">
                <Store className="h-4 w-4 text-orange-500" />
                Community
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
                Found by 14 parents near <span className="font-semibold text-ink-800">500010</span>
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
          </motion.div>

          {/* Right: copy + features */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={contentVariants}
          >
            <motion.span variants={itemVariants} className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              For the Coach
            </motion.span>
            <motion.h2 variants={itemVariants} className="mt-5 font-display text-3xl font-700 leading-tight tracking-tight text-ink-950 sm:text-4xl lg:text-[2.9rem]">
              Your Digital Academy,
              <br />
              <span className="text-gradient-warm">Built for your Personilization</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
              You're elite at teaching — not at spreadsheets. TruCoach
              handles the operations layer of your coaching business while connecting
              you to a thriving local community of athletes. Walk onto the field,
              the mat, or the studio and simply coach.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-300 hover:border-orange-200 hover:shadow-glow-orange"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                    <f.icon className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-600 text-ink-950">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.body}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.a
              variants={itemVariants}
              href="#join"
              className="mt-9 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              Start building your academy
              <ArrowUpRight className="h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

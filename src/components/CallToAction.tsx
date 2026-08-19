import { useState } from 'react';
import { ArrowRight, MapPin, GraduationCap, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CTA_IMG =
  'https://images.pexels.com/photos/10347891/pexels-photo-10347891.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';

export function CallToAction() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setTimeout(() => setIsSubmitted(false), 300); // reset after closing
    }, 2000);
  };

  return (
    <section id="join" className="relative scroll-mt-24 overflow-hidden py-16 lg:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-950 px-6 py-16 text-center text-white sm:px-12 lg:py-20">
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
            Whether you coach or cheer, TruCoach brings your academy
            closer to the people who matter. Pick your path and get started today.
          </p>

          <div className="reveal reveal-delay-3 mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary !px-7 !py-4 !text-base"
            >
              <GraduationCap className="h-5 w-5" />
              Join the Ecosystem as a Tutor
            </button>
            <a
              href="#coaches"
              className="btn-secondary !bg-white/10 !px-7 !py-4 !text-base !text-white hover:!bg-white/15"
            >
              <MapPin className="h-5 w-5" />
              Discover Academies Near You
              <ArrowRight className="h-4.5 w-4.5" />
            </a>
          </div>

          <div className="reveal reveal-delay-4 mt-8 flex flex-col items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Launching Shortly on App Store & Google Play
            </span>
          </div>
        </div>
      </div>

      {/* Tutor Join Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" 
              onClick={() => !isSubmitted && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 text-left shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                <X className="h-5 w-5" />
              </button>

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center py-10 text-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-bold text-ink-950">Application Received!</h3>
                    <p className="mt-2 text-ink-500">Our team will contact you shortly to verify your details.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 className="font-display text-2xl font-bold text-ink-950">Join as a Tutor</h3>
                    <p className="mt-2 text-sm text-ink-500">
                      Fill in your details to get early access to the TruCoach platform.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">Full Name</label>
                        <input required type="text" placeholder="e.g. Coach Ramesh" className="w-full rounded-xl border border-ink-200 px-4 py-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">Phone Number</label>
                        <input required type="tel" placeholder="+91 98765 43210" className="w-full rounded-xl border border-ink-200 px-4 py-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">Academy / Specialization</label>
                        <input required type="text" placeholder="e.g. Football Academy or Private Tutor" className="w-full rounded-xl border border-ink-200 px-4 py-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                      </div>
                      
                      <button type="submit" className="btn-primary mt-2 w-full !py-4">
                        Submit Application
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

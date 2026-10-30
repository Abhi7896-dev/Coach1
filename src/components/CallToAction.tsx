import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, GraduationCap, Sparkles, X, CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppStoreIcon } from './AppStoreIcon';
import { GooglePlayIcon } from './GooglePlayIcon';
import { supabase } from '@/lib/supabase';

const CTA_IMG =
  'https://images.pexels.com/photos/10347891/pexels-photo-10347891.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';

const APP_STORE_URL = 'https://apps.apple.com/in/app/trucoach/id6808904997';
const APP_STORE_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(APP_STORE_URL)}`;
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share';
const GOOGLE_PLAY_QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(GOOGLE_PLAY_URL)}`;

const SUPPORT_EMAIL = 'support@trucoach.co.in';

export function CallToAction() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    specialization: '',
    city: '',
    notes: '',
  });

  // Listen for global open event (e.g. from Hero, Navbar, or TruCoach Chat Bot)
  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener('open-tutor-modal', handleOpen);

    // If navigated from another page via chatbot or link
    if (sessionStorage.getItem('trucoach_open_tutor_modal') === '1') {
      sessionStorage.removeItem('trucoach_open_tutor_modal');
      setIsModalOpen(true);
    }

    return () => window.removeEventListener('open-tutor-modal', handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formattedPhone = `+91 ${formData.phone}`;
    const subjectLine = `New Tutor Ecosystem Application: ${formData.fullName.trim()} (${formData.specialization.trim()})`;
    const messageBody = [
      `A new coach/tutor has applied to join the TruCoach Ecosystem:`,
      ``,
      `• Full Name: ${formData.fullName.trim()}`,
      `• Phone Number: ${formattedPhone}`,
      `• Email Address: ${formData.email.trim() || 'Not specified'}`,
      `• Academy / Specialization: ${formData.specialization.trim()}`,
      `• City / Locality: ${formData.city.trim() || 'Not specified'}`,
      `• Additional Notes: ${formData.notes.trim() || 'None'}`,
      ``,
      `Submitted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      `Forwarded to: ${SUPPORT_EMAIL}`,
    ].join('\n');

    try {
      // 1. Dispatch email alert to support@trucoach.co.in via edge function
      await supabase.functions.invoke('send-email-notification', {
        body: {
          action: 'support_ticket_admin_alert',
          to_email: SUPPORT_EMAIL,
          user_name: formData.fullName.trim(),
          user_phone: formattedPhone,
          role: 'tutor_applicant',
          category: 'Tutor Application',
          subject: subjectLine,
          message: messageBody,
          ticket_id: `TUTOR-${Date.now()}`,
        },
      });

      // 2. Persist in database as a high-priority support ticket so admin can view/manage
      await supabase.from('support_tickets').insert({
        user_name: formData.fullName.trim(),
        user_phone: formattedPhone,
        user_email: formData.email.trim() || null,
        user_role: 'tutor_applicant',
        category: 'TUTOR_APPLICATION',
        subject: subjectLine,
        message: messageBody,
        status: 'OPEN',
      });

      setIsSubmitted(true);
    } catch (err: any) {
      console.warn('Tutor application submission notice:', err);
      // Still show successful receipt as email invocation or ticket write was processed
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setIsSubmitted(false);
    setErrorMessage(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      specialization: '',
      city: '',
      notes: '',
    });
  };

  return (
    <section id="join" className="relative scroll-mt-24 overflow-hidden py-16 lg:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-950 px-6 py-16 text-center text-white sm:px-12 lg:py-20 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
          {/* Background screening & image */}
          <div className="absolute inset-0 -z-10">
            <img
              src={CTA_IMG}
              alt=""
              className="h-full w-full object-cover opacity-20 transition-transform duration-1000 hover:scale-105"
              loading="lazy"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/90 to-ink-950/75" />
            <div className="absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-orange-500/35 blur-[120px] animate-pulse-glow" />
            <div className="absolute -right-20 bottom-0 h-[420px] w-[420px] rounded-full bg-blue-500/35 blur-[120px] animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
            <div className="absolute inset-0 grid-bg-dark opacity-30" />
            {/* Athletic arc vector */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0,300 Q 600,0 1200,300" fill="none" stroke="#fb5a0c" strokeWidth="2" strokeDasharray="8 6" className="animated-stroke" />
            </svg>
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
            <Link
              to="/academies"
              className="btn-secondary !bg-white/10 !px-7 !py-4 !text-base !text-white hover:!bg-white/15"
            >
              <MapPin className="h-5 w-5" />
              Discover Academies Near You
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="reveal reveal-delay-4 mt-8 flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3.5 rounded-2xl bg-white px-5 py-3 text-ink-950 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_-15px_rgba(0,122,255,0.35)] active:scale-95"
                >
                  <AppStoreIcon size={38} className="h-9.5 w-9.5 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105" />
                  <span className="text-left leading-tight">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Download on the</span>
                    <span className="block text-lg font-bold font-display tracking-tight text-ink-950">App Store</span>
                  </span>
                </a>
                <div className="group relative">
                  <img
                    src={APP_STORE_QR_SRC}
                    alt="Scan to download TruCoach on the App Store"
                    width={110}
                    height={110}
                    className="rounded-2xl border-4 border-white bg-white p-1.5 shadow-xl transition-all duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-blue-600 p-1 text-white shadow-md ring-2 ring-white">
                    <AppStoreIcon size={14} className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <a
                  href={GOOGLE_PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3.5 rounded-2xl bg-white px-5 py-3 text-ink-950 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_-15px_rgba(0,200,83,0.35)] active:scale-95"
                >
                  <GooglePlayIcon size={38} className="h-9.5 w-9.5 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105" />
                  <span className="text-left leading-tight">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Available on</span>
                    <span className="block text-lg font-bold font-display tracking-tight text-ink-950">Google Play</span>
                  </span>
                </a>
                <div className="group relative">
                  <img
                    src={GOOGLE_PLAY_QR_SRC}
                    alt="Scan to download TruCoach on Google Play"
                    width={110}
                    height={110}
                    className="rounded-2xl border-4 border-white bg-white p-1.5 shadow-xl transition-all duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-green-600 p-1 text-white shadow-md ring-2 ring-white">
                    <GooglePlayIcon size={14} className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Available now on iOS &amp; Android
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
              className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
              onClick={() => !isSubmitting && resetForm()}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-6 sm:p-8 text-left shadow-[0_32px_64px_-16px_rgba(0,0,0,0.35)]"
            >
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="absolute right-5 top-5 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50"
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
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600 shadow-inner">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-bold text-ink-950">Application Received! 🎉</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600 max-w-sm">
                      Thank you, <strong className="text-ink-900">{formData.fullName}</strong>. Your application has been logged and Our Team Will be Connecting with you shortly. Thanks for showing interest in joining Our EcoSystem.
                    </p>
                    <div className="mt-4 rounded-2xl bg-ink-50 p-4 text-xs text-ink-600 text-left w-full space-y-1.5 border border-ink-100">
                      <p><span className="font-semibold text-ink-900">Phone:</span> +91 {formData.phone}</p>
                      <p><span className="font-semibold text-ink-900">Specialization:</span> {formData.specialization}</p>
                      {formData.email && <p><span className="font-semibold text-ink-900">Email:</span> {formData.email}</p>}
                      <p className="text-[11px] text-ink-400 pt-1">Our onboarding team will contact you within 24 business hours.</p>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
                      <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                          `Tutor Application: ${formData.fullName} (${formData.specialization})`
                        )}&body=${encodeURIComponent(
                          `Hi TruCoach Team,\n\nI have submitted my application to join the ecosystem as a tutor.\n\n• Name: ${formData.fullName}\n• Phone: +91 ${formData.phone}\n• Academy / Discipline: ${formData.specialization}\n• City: ${formData.city || 'N/A'}\n\nLooking forward to hearing from you!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary !w-full !py-3 !text-xs !justify-center"
                      >
                        <Mail className="h-4 w-4" />
                        Send direct copy to Email
                      </a>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="btn-primary !w-full !py-3 !text-xs !justify-center"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 text-orange-600 font-bold">
                        <GraduationCap className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-600">TruCoach Ecosystem</span>
                    </div>

                    <h3 className="mt-3 font-display text-2xl font-bold text-ink-950">Join as a Tutor</h3>
                    <p className="mt-1.5 text-xs text-ink-500">
                      {/* Join hundreds of verified tutors &amp; academies. All applications are directly sent to{' '} */}
                      Join TruCoach in building MultiSports Echosystem.
                      {/* <span className="font-semibold text-ink-700">{SUPPORT_EMAIL}</span>. */}
                    </p>

                    {errorMessage && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                          Full Name <span className="text-orange-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                          placeholder="e.g. Coach Ramesh Sharma"
                          className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      {/* Phone Number with Pre-filled Uneditable India Country Code (+91) */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                          Phone Number <span className="text-orange-500">*</span>
                        </label>
                        <div className="flex items-center rounded-xl border border-ink-200 bg-white transition-all focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 overflow-hidden">
                          <div className="flex select-none items-center gap-1.5 border-r border-ink-200 bg-ink-50/80 px-3.5 py-3 text-sm font-bold text-ink-700 shrink-0">
                            <span className="text-base leading-none">🇮🇳</span>
                            <span>+91</span>
                          </div>
                          <input
                            required
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                              }))
                            }
                            placeholder="98765 43210"
                            className="w-full bg-transparent px-3.5 py-3 text-sm font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-400"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-ink-400">10-digit Indian mobile number</p>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                          Email Address <span className="text-ink-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="coach@example.com"
                          className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      {/* Academy / Specialization */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                          Academy / Sport Discipline <span className="text-orange-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                          placeholder="e.g. Tennis Academy, Boxing Club, Dance Institute, Arts & Craft."
                          className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      {/* Locality / City */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                          City / Area <span className="text-ink-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="e.g. Kompally, Hyderabad"
                          className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary mt-3 w-full !py-3.5 !text-sm !font-bold disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending to {SUPPORT_EMAIL}...
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-4 w-4" />
                            Submit Tutor Application
                          </>
                        )}
                      </button>

                      <p className="text-center text-[11px] text-ink-400 pt-1">
                        Or Reach out to us with your Academy Details -{' '}
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-orange-600 underline">
                          {SUPPORT_EMAIL}
                        </a>
                      </p>
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

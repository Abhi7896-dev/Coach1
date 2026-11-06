import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Flame,
  ArrowRight,
  MessageSquare,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { directoryClient } from '@/lib/directoryClient';

interface FreeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  coachName: string;
  academyName?: string | null;
  sportsOffered?: string[] | null;
  coachImageUrl?: string | null;
  locality?: string | null;
}

const PREFERRED_DAYS = [
  'Today / Earliest',
  'Tomorrow',
  'This Weekend',
  'Next Week',
];

const PREFERRED_SLOTS = [
  'Morning (6 AM - 9 AM)',
  'Afternoon (4 PM - 6 PM)',
  'Evening (6 PM - 8 PM)',
  'Flexible / Any time',
];

const AGE_GROUPS = [
  'Under 8 (Beginner)',
  '8 - 12 (Junior)',
  '13 - 17 (Teen)',
  '18+ (Adult)',
];

export function FreeTrialModal({
  isOpen,
  onClose,
  coachId,
  coachName,
  academyName,
  sportsOffered,
  coachImageUrl,
  locality,
}: FreeTrialModalProps) {
  const sports = sportsOffered && sportsOffered.length > 0 ? sportsOffered : ['General Training'];

  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childAgeGroup, setChildAgeGroup] = useState(AGE_GROUPS[1]);
  const [selectedSport, setSelectedSport] = useState(sports[0] || 'Training');
  const [selectedDay, setSelectedDay] = useState(PREFERRED_DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState(PREFERRED_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [coachPhone, setCoachPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep numbers and optional leading plus
    const val = e.target.value.replace(/[^0-9+]/g, '');
    setParentPhone(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const phone10 = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    if (!parentName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (phone10.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile / WhatsApp number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Approximate numeric age from group
      let approxAge = 10;
      if (childAgeGroup.includes('Under 8')) approxAge = 7;
      else if (childAgeGroup.includes('8 - 12')) approxAge = 10;
      else if (childAgeGroup.includes('13 - 17')) approxAge = 15;
      else if (childAgeGroup.includes('18+')) approxAge = 20;

      const fullAthleteInfo = childName.trim()
        ? childName.trim()
        : `${parentName.trim()} (Self)`;

      const preferredBatch = `${selectedDay} • ${selectedSlot}`;

      const combinedNotes = [
        `Preferred: ${selectedDay} | ${selectedSlot}`,
        notes.trim() ? `Note: ${notes.trim()}` : '',
        locality ? `Locality: ${locality}` : '',
        `Source: Website Coach Profile`,
      ]
        .filter(Boolean)
        .join(' • ');

      // Standardize phone with +91 country prefix for seamless TruCoach app binding
      const standardizedPhone = `+91${phone10}`;

      // Check if this parent is already registered in TruCoach profiles
      let parentUserId: string | null = null;
      try {
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .or(`phone.eq.${phone10},phone.eq.+91${phone10},phone.eq.91${phone10}`)
          .maybeSingle();
        if (existingProf?.id) {
          parentUserId = existingProf.id;
        }
      } catch (_) {}

      // Align with actual public.admission_requests table schema:
      // - status: 'pending' (required by table RLS policy: 'pending' | 'trial_active' | 'trial_completed' | 'approved' | 'rejected')
      // - parent_phone, tutor_id, tutor_name, sport_name: required columns
      // - preferred_batch_title, trial_classes_count (default: 2)
      // - parent_id & parent_user_id: mapped to user UUID so it renders in the TruCoach app
      const payload: Record<string, any> = {
        tutor_id: coachId,
        tutor_name: coachName,
        parent_name: parentName.trim(),
        parent_phone: standardizedPhone,
        child_name: fullAthleteInfo,
        child_age: approxAge,
        sport_name: selectedSport || 'Sports Training',
        preferred_batch_title: preferredBatch,
        request_type: 'trial',
        trial_classes_count: 2,
        status: 'pending',
        tutor_notes: combinedNotes,
        trial_time: selectedSlot,
        trial_location: locality || '',
        created_at: new Date().toISOString(),
      };

      if (parentUserId) {
        payload.parent_id = parentUserId;
        payload.parent_user_id = parentUserId;
      }

      // 1. Write to main Supabase admission_requests (visible to admin & coach mobile app)
      const { data: insertedData, error: mainError } = await supabase
        .from('admission_requests')
        .insert([payload])
        .select()
        .single();

      if (mainError) {
        console.error('Direct insert into admission_requests failed:', mainError);
        throw new Error(mainError.message || 'Failed to submit trial request');
      }

      const requestId = insertedData?.id || `TRIAL-${Date.now()}`;

      // 2. Fetch coach contact details for direct WhatsApp communication
      let coachNotifyPhone: string | null = null;
      try {
        const { data: tutorDoc } = await supabase
          .from('tutors_public')
          .select('phone, phone_number')
          .eq('id', coachId)
          .maybeSingle();
        const rawTutorPhone = (tutorDoc?.phone || tutorDoc?.phone_number || '').replace(/[^0-9]/g, '');
        if (rawTutorPhone.length >= 10) {
          setCoachPhone(rawTutorPhone.slice(-10));
          coachNotifyPhone = rawTutorPhone.length === 10 ? `91${rawTutorPhone}` : rawTutorPhone;
        }
      } catch (_) {}

      // 2b. Alert the coach on WhatsApp via the Meta-approved "new_lead_alert"
      // template — mirrors the in-app free-trial/admission flow so a coach
      // gets notified the same way regardless of whether the lead came from
      // the TruCoach app or the public website. Any field that could be
      // empty is shown as "Not Available" rather than sent blank.
      if (coachNotifyPhone) {
        try {
          await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              recipient_phone: coachNotifyPhone,
              event_key: 'new_lead_alert',
              template_name: 'new_lead_alert',
              message: `New Free Trial Request\n\nParent: ${parentName.trim() || 'Not Available'}\nPhone: ${standardizedPhone}\nStudent: ${fullAthleteInfo}\nSport: ${selectedSport || 'Not Available'}\nPreferred Batch: ${preferredBatch || 'Not Available'}\nRequested On: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
              template_header_params: ['Free Trial'],
              template_params: [
                parentName.trim() || 'Not Available',
                standardizedPhone || 'Not Available',
                childName.trim() || 'Not Available',
                approxAge ? `${approxAge}` : 'Not Available',
                selectedSport || 'Not Available',
                preferredBatch || 'Not Available',
                new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              ],
            },
          });
        } catch (waErr) {
          console.warn('WhatsApp new_lead_alert dispatch failed:', waErr);
        }
      }

      // 3. Dispatch admin email alert via the send-email-notification edge function
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            action: 'support_ticket_admin_alert',
            to_email: 'support@trucoach.co.in',
            user_name: parentName.trim(),
            user_phone: phone10,
            role: 'parent',
            category: 'Free Trial Request',
            subject: `🎯 New Free Trial Request for Coach ${coachName} (${selectedSport})`,
            message: `New Free Trial Request details:\n\n• Request ID: ${requestId}\n• Coach: ${coachName} (ID: ${coachId})\n• Academy: ${academyName || 'Independent'}\n• Parent: ${parentName.trim()}\n• Phone / WhatsApp: ${standardizedPhone}\n• Athlete: ${fullAthleteInfo} (Age ~${approxAge})\n• Sport: ${selectedSport}\n• Preferred Batch / Slot: ${preferredBatch}\n• Note: ${notes.trim() || 'None'}\n• Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
            ticket_id: `TRIAL-${Date.now()}`,
          },
        });
      } catch (fnErr) {
        console.warn('Edge notification fallback error:', fnErr);
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Error submitting trial request:', err);
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hi Coach ${coachName}! I just requested a Free Trial session for ${selectedSport} via TruCoach for ${childName.trim() || parentName.trim()}. Looking forward to the session schedule.`
    );
    const target = coachPhone ? (coachPhone.length === 10 ? `91${coachPhone}` : coachPhone) : '';
    const waUrl = target ? `https://wa.me/${target}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 my-8 w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0e131f] text-white shadow-2xl"
        >
          {/* Top energetic gradient ambient glow */}
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-orange-500/20 via-orange-600/5 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>

          {!submitSuccess ? (
            <div className="p-6 sm:p-8">
              {/* Header Badge & Coach Snapshot */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30">
                  <Flame className="h-3.5 w-3.5 text-orange-400 animate-pulse" /> 100% Free Trial Session
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> No App Needed
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3.5 pb-5 border-b border-white/10">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-orange-500/30 bg-ink-900 shadow-md">
                  {coachImageUrl ? (
                    <img src={coachImageUrl} alt={coachName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-orange-500 to-amber-600 font-display text-xl font-bold text-white">
                      {coachName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0e131f]" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-700 text-white leading-tight">
                    Book Trial with {coachName}
                  </h3>
                  <p className="text-xs text-ink-300 mt-0.5">
                    {academyName ? `${academyName} • ` : ''}
                    {locality || 'Verified TruCoach Partner'}
                  </p>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Sport Selector if multiple */}
                {sports.length > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-ink-200 mb-1.5">
                      Select Sport
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sports.map((sp) => (
                        <button
                          type="button"
                          key={sp}
                          onClick={() => setSelectedSport(sp)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            selectedSport === sp
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                              : 'bg-white/5 text-ink-300 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parent / Contact details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-ink-200 mb-1">
                      Your Name <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-200 mb-1">
                      Mobile / WhatsApp <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                      <input
                        type="tel"
                        required
                        placeholder="10-digit phone number"
                        value={parentPhone}
                        onChange={handlePhoneChange}
                        maxLength={13}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Athlete / Child Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-ink-200 mb-1">
                      Student / Kid Name <span className="text-ink-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aarav (or leave empty if for self)"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-200 mb-1">
                      Age Category
                    </label>
                    <select
                      value={childAgeGroup}
                      onChange={(e) => setChildAgeGroup(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#161c2c] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-orange-500"
                    >
                      {AGE_GROUPS.map((grp) => (
                        <option key={grp} value={grp} className="bg-[#161c2c] text-white">
                          {grp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preferred Day & Time slot pills */}
                <div>
                  <label className="block text-xs font-bold text-ink-200 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-orange-400" /> Preferred Trial Day
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PREFERRED_DAYS.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={`rounded-xl py-2 px-2 text-[11px] font-bold text-center border transition ${
                          selectedDay === d
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500 shadow-sm'
                            : 'border-white/10 bg-white/[0.03] text-ink-300 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-200 mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400" /> Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PREFERRED_SLOTS.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-xl py-2 px-3 text-[11px] font-bold text-left border transition ${
                          selectedSlot === slot
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-sm'
                            : 'border-white/10 bg-white/[0.03] text-ink-300 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional note */}
                <div>
                  <label className="block text-xs font-bold text-ink-200 mb-1">
                    Any specific question or goals? <span className="text-ink-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. beginner looking for cricket batting coaching"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10 resize-none"
                  />
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit CTA button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 py-3.5 px-6 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition hover:shadow-orange-500/50 hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Request to {coachName}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-200" />
                        <span>Confirm Free Trial Request</span>
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-ink-400 pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Free &amp; Zero Commitment • Coach will contact to confirm slot</span>
                </div>
              </form>
            </div>
          ) : (
            /* Success confirmation screen */
            <div className="p-8 sm:p-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl shadow-emerald-500/30"
              >
                <CheckCircle2 className="h-9 w-9" />
              </motion.div>

              <span className="mt-5 inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                Trial Request Confirmed
              </span>

              <h3 className="mt-3 font-display text-2xl sm:text-3xl font-700 text-white tracking-tight">
                Request Sent to Coach {coachName}!
              </h3>

              <p className="mt-3 text-sm text-ink-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{parentName}</strong>! Coach {coachName}{' '}
                {academyName ? `at ${academyName}` : ''} and our operations team have received your free trial request for{' '}
                <strong className="text-orange-400">{selectedSport}</strong>.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-ink-200 max-w-md mx-auto text-left space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-ink-400">Athlete:</span>
                  <span className="text-white font-bold">{childName.trim() || parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Phone:</span>
                  <span className="text-white font-bold">{parentPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Preferred Slot:</span>
                  <span className="text-orange-300">{selectedDay} ({selectedSlot})</span>
                </div>
              </div>

              {/* TruCoach Mobile App Realtime Sync Banner */}
              <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5 text-xs text-left max-w-md mx-auto flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Track Live in TruCoach App</p>
                  <p className="mt-0.5 text-ink-300 leading-relaxed text-[11px]">
                    This request is synced directly to TruCoach. Open or download the app and log in with <strong className="text-orange-300">{parentPhone}</strong> to view your trial pass under <strong className="text-white">"My Applications & Trials"</strong>.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleWhatsAppDirect}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs font-bold text-white transition shadow-md"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat on WhatsApp Directly
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 text-xs font-bold text-white transition"
                >
                  Done
                </button>
              </div>

              <p className="mt-5 text-[11px] text-ink-400">
                You will receive a confirmation message on WhatsApp with venue instructions shortly.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


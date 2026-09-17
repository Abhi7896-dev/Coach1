import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Layers,
  HelpCircle,
  Clock,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Sparkles,
  RefreshCw,
  HeartPulse,
  Activity,
  Award,
  FileText,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ParentItem } from '@/pages/AdminPortal';

interface ParentProfileModalProps {
  parent: ParentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded?: () => void;
}

export function ParentProfileModal({
  parent,
  isOpen,
  onClose,
  onStudentAdded,
}: ParentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'athletes' | 'trials' | 'receipts' | 'profile'>('athletes');
  const [isLoading, setIsLoading] = useState(false);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [financeList, setFinanceList] = useState<any[]>([]);

  // Add Athlete state
  const [isAddingAthlete, setIsAddingAthlete] = useState(false);
  const [athleteName, setAthleteName] = useState('');
  const [athleteAge, setAthleteAge] = useState('10');
  const [isSavingAthlete, setIsSavingAthlete] = useState(false);

  // `students` stores date of birth, not a plain age number — approximate a
  // DOB from the age entered in the form (years-ago from today).
  const ageToDob = (age: string) => {
    const years = parseInt(age) || 10;
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    return d.toISOString().slice(0, 10);
  };

  const calculateAge = (dob?: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  useEffect(() => {
    if (parent && isOpen) {
      loadDeepParentData(parent.phone);
    }
  }, [parent, isOpen]);

  const loadDeepParentData = async (rawPhone: string) => {
    setIsLoading(true);
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const p10 = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    try {
      // 1. Fetch Students matching this parent's phone.
      // `students` has no guardian_phone column — parent_phone is the only
      // contact field on this table. Filtering on guardian_phone here used
      // to make this entire query fail (400), which is why nothing ever
      // showed up for any parent.
      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .ilike('parent_phone', `%${p10}%`);

      const students = sData || [];
      setStudentsList(students);

      const studentIds = students.map((s) => s.id).filter(Boolean);

      // 2. Fetch Enrollments with Batch (+ its sport) and Tutor joins.
      // `batches` has no schedule/days/time/sport_name/fee columns — the real
      // fields are schedule_days/start_time/end_time/monthly_fee, and sport
      // is a separate `sports` lookup table joined via sport_id.
      if (studentIds.length > 0) {
        let enrollments: any[] = [];
        const { data: eData, error: eError } = await supabase
          .from('enrollments')
          .select(
            '*, tutors(name, academy_name, sports_offered), batches(title, schedule_days, start_time, end_time, monthly_fee, sports(name))'
          )
          .in('student_id', studentIds);

        if (eError || !eData) {
          const { data: eFallback } = await supabase
            .from('enrollments')
            .select('*')
            .in('student_id', studentIds);
          enrollments = eFallback || [];
        } else {
          enrollments = eData;
        }
        setEnrollmentsList(enrollments);

        // finance_logs has no student_id column — it's keyed by enrollment_id
        // (and tutor_id). Resolve via the enrollment IDs we just fetched.
        const enrollmentIds = enrollments.map((e) => e.id).filter(Boolean);
        if (enrollmentIds.length > 0) {
          const { data: fData } = await supabase
            .from('finance_logs')
            .select('*')
            .in('enrollment_id', enrollmentIds);
          setFinanceList(fData || []);
        } else {
          setFinanceList([]);
        }
      } else {
        setEnrollmentsList([]);
        setFinanceList([]);
      }

      // 3. Fetch Admissions & Free Trials from admission_requests, then
      // resolve the coach/academy name via tutor_id — admission_requests has
      // no academy_name column of its own.
      const { data: qData } = await supabase
        .from('admission_requests')
        .select('*')
        .ilike('parent_phone', `%${p10}%`);
      const inquiries = qData || [];

      const tutorIds = Array.from(new Set(inquiries.map((q: any) => q.tutor_id).filter(Boolean)));
      let tutorLookup = new Map<string, any>();
      if (tutorIds.length > 0) {
        const { data: tutorsForInquiries } = await supabase
          .from('tutors')
          .select('id, name, academy_name')
          .in('id', tutorIds);
        tutorLookup = new Map((tutorsForInquiries || []).map((t: any) => [t.id, t]));
      }
      setInquiriesList(
        inquiries.map((q: any) => ({
          ...q,
          academy_name: tutorLookup.get(q.tutor_id)?.academy_name || 'Unassigned',
        }))
      );
    } catch (err) {
      console.error('Error fetching deep parent data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteName.trim() || !parent) return;

    setIsSavingAthlete(true);
    try {
      const cleanPhone = parent.phone.replace(/[^0-9]/g, '');
      const p10 = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

      // `students` only has: name, dob, guardian_name, parent_phone, tags.
      // (No age/gender/locality/pincode/status columns exist on this table.)
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: athleteName.trim(),
          dob: ageToDob(athleteAge),
          guardian_name: parent.name,
          parent_phone: p10,
        })
        .select()
        .single();

      if (error) {
        alert('Could not add athlete: ' + error.message);
      } else {
        setStudentsList((prev) => [data, ...prev]);
        setIsAddingAthlete(false);
        setAthleteName('');
        if (onStudentAdded) onStudentAdded();
      }
    } catch (err: any) {
      alert('Error adding athlete: ' + err.message);
    } finally {
      setIsSavingAthlete(false);
    }
  };

  if (!isOpen || !parent) return null;

  const cleanPhone = (parent.phone || '').replace(/[^0-9]/g, '');

  // finance_logs only carries enrollment_id — resolve back to the athlete's
  // name via the enrollments + students already loaded for this family.
  const enrollmentById = new Map(enrollmentsList.map((e: any) => [e.id, e]));
  const resolveReceiptAthlete = (f: any) => {
    const enr = f.enrollment_id ? enrollmentById.get(f.enrollment_id) : undefined;
    const student = enr ? studentsList.find((s) => s.id === enr.student_id) : undefined;
    return student?.name || 'Athlete';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0c1018] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] text-white"
      >
        {/* Header Ribbon */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-blue-500/15 via-transparent to-orange-500/10 p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-display text-2xl font-bold text-white shadow-xl">
                  {parent.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#0c1018] bg-blue-400" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-white">{parent.name}</h2>
                  <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase">
                    Registered Guardian
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-ink-300">
                    {studentsList.length} Linked {studentsList.length === 1 ? 'Child' : 'Children'}
                  </span>
                </div>

                <p className="mt-1 flex items-center gap-2 text-xs font-mono text-ink-300">
                  <Phone className="h-3.5 w-3.5 text-blue-400" />
                  <span>+91 {parent.phone}</span>
                  {parent.locality && (
                    <span className="text-ink-400">• {parent.locality} {parent.pincode ? `(${parent.pincode})` : ''}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {cleanPhone && (
                <>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                  >
                    <Phone className="h-3.5 w-3.5 text-blue-400" />
                    <span>Call Guardian</span>
                  </a>
                  <a
                    href={`https://wa.me/91${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="mt-6 flex gap-2 overflow-x-auto border-t border-white/10 pt-4">
            {[
              { id: 'athletes', label: `Linked Athletes (${studentsList.length})`, icon: Users },
              { id: 'trials', label: `Free Trials & Inquiries (${inquiriesList.length})`, icon: HelpCircle },
              { id: 'receipts', label: `Receipts & Payments (${financeList.length})`, icon: DollarSign },
              { id: 'profile', label: 'Guardian Details', icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-ink-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />
              <p className="mt-3 text-xs text-ink-400">Loading live family records from database...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: LINKED ATHLETES */}
              {activeTab === 'athletes' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-400">
                      Children enrolled under this guardian: <strong className="text-white">{studentsList.length}</strong>
                    </p>
                    <button
                      onClick={() => setIsAddingAthlete(!isAddingAthlete)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md shadow-blue-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isAddingAthlete ? 'Cancel' : 'Add Child / Athlete'}</span>
                    </button>
                  </div>

                  {/* Add Athlete Dropdown Form */}
                  <AnimatePresence>
                    {isAddingAthlete && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddAthlete}
                        className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-4"
                      >
                        <h4 className="font-display text-sm font-bold text-white">Register Child into Supabase</h4>
                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                          <div>
                            <label className="text-ink-300 block mb-1">Athlete Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Aarav Sharma"
                              value={athleteName}
                              onChange={(e) => setAthleteName(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Age (Years)</label>
                            <input
                              type="number"
                              required
                              value={athleteAge}
                              onChange={(e) => setAthleteAge(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingAthlete(false)}
                            className="rounded-xl px-3 py-1.5 text-xs text-ink-300 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingAthlete}
                            className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md"
                          >
                            {isSavingAthlete ? 'Saving...' : 'Save Athlete'}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {studentsList.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <Users className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No student records found linked to this guardian yet. Tap "Add Child / Athlete" above to enroll.
                    </div>
                  ) : (
                    studentsList.map((student) => {
                      const enrollments = enrollmentsList.filter((e) => e.student_id === student.id);
                      const age = calculateAge(student.dob);
                      return (
                        <div
                          key={student.id}
                          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15 font-display text-lg font-bold text-orange-400">
                                🏃
                              </div>
                              <div>
                                <h3 className="font-display text-lg font-bold text-white">{student.name || 'Athlete'}</h3>
                                <p className="text-xs text-ink-400">
                                  {age !== null ? `${age} Years Old` : 'DOB unrecorded'}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px] text-ink-500">ID: {student.id}</p>
                              </div>
                            </div>

                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 self-start sm:self-auto">
                              Active Athlete
                            </span>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 text-xs">
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                              <span className="text-ink-400 block text-[10px] uppercase font-bold">Guardian Contact</span>
                              <span className="font-medium text-white">{student.guardian_name || parent.name}</span>
                              <span className="font-mono text-ink-300 block">{student.parent_phone || parent.phone}</span>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                              <span className="text-ink-400 block text-[10px] uppercase font-bold">Record Details</span>
                              <span className="text-white block">
                                DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : 'Not recorded'}
                              </span>
                              <span className="text-ink-300 block">
                                {Array.isArray(student.tags) && student.tags.length > 0
                                  ? student.tags.join(', ')
                                  : 'No tags recorded'}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
                              Enrolled Academies &amp; Sessions
                            </h4>

                            {enrollments.length === 0 ? (
                              <p className="text-xs text-ink-400 italic">No academy batches currently linked to this student in Supabase.</p>
                            ) : (
                              <div className="space-y-2">
                                {enrollments.map((en) => {
                                  const tutor = en.tutors;
                                  const batch = en.batches;
                                  return (
                                    <div
                                      key={en.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs"
                                    >
                                      <div>
                                        <p className="font-bold text-white text-sm">
                                          {tutor?.academy_name || 'Sports Academy'}
                                        </p>
                                        <p className="text-orange-400 font-medium">
                                          Batch: {batch?.title || 'General Training'} • {batch?.sports?.name || 'Sports'}
                                        </p>
                                        <p className="text-ink-400 text-[11px] mt-0.5">
                                          Coach: {tutor?.name || 'Assigned Coach'} •{' '}
                                          {Array.isArray(batch?.schedule_days) && batch.schedule_days.length > 0
                                            ? batch.schedule_days.join(', ')
                                            : 'Weekly'}
                                          {batch?.start_time ? ` (${batch.start_time}${batch.end_time ? ' - ' + batch.end_time : ''})` : ''}
                                        </p>
                                      </div>

                                      <div className="text-right self-start sm:self-auto">
                                        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                          {batch?.monthly_fee ? `₹${batch.monthly_fee}/mo` : 'Tuition Active'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: FREE TRIALS & INQUIRIES */}
              {activeTab === 'trials' && (
                <div className="space-y-4">
                  {inquiriesList.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <HelpCircle className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No free trial bookings or admissions queries found in database for this guardian.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                          <tr>
                            <th className="px-5 py-3.5">Athlete</th>
                            <th className="px-5 py-3.5">Academy &amp; Sport</th>
                            <th className="px-5 py-3.5">Query Type</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5">Submitted On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {inquiriesList.map((q) => (
                            <tr key={q.id} className="hover:bg-white/[0.03]">
                              <td className="px-5 py-3.5 font-bold text-white">
                                {q.child_name || 'Athlete'} {q.child_age ? `(${q.child_age} yrs)` : ''}
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-orange-400">{q.academy_name || 'Academy'}</p>
                                <p className="text-ink-400">{q.sport_name || 'General'}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase">
                                  {q.request_type || 'Trial'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 uppercase font-bold text-[10px] text-ink-300">
                                {q.status || 'New'}
                              </td>
                              <td className="px-5 py-3.5 text-ink-400">
                                {q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RECEIPTS & PAYMENTS */}
              {activeTab === 'receipts' && (
                <div className="space-y-4">
                  {financeList.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <DollarSign className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No direct payment logs or receipts recorded under this family profile yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {financeList.map((f) => (
                        <div
                          key={f.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs"
                        >
                          <div>
                            <p className="font-bold text-white text-sm">Receipt #{f.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-orange-400 font-medium">{resolveReceiptAthlete(f)}</p>
                            <p className="text-ink-300">{f.batch_title || 'Sports Tuition Fee'}</p>
                            <p className="text-ink-500 font-mono text-[11px]">Method: {f.payment_method || 'UPI / Cashfree'}</p>
                          </div>

                          <div className="text-right">
                            <span className="font-display text-base font-bold text-emerald-400 block">
                              ₹{f.amount || 0}
                            </span>
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                              {f.status || 'PAID'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: GUARDIAN DETAILS */}
              {activeTab === 'profile' && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4 text-xs">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-blue-400">
                    Parent Account &amp; Verification Details
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-ink-400">Full Name</span>
                      <span className="font-bold text-white">{parent.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-ink-400">Primary Phone</span>
                      <span className="font-mono text-white">+91 {parent.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-ink-400">Locality &amp; Pincode</span>
                      <span className="text-white">{parent.locality || 'Hyderabad'} {parent.pincode ? `(${parent.pincode})` : ''}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-ink-400">Total Linked Athletes</span>
                      <span className="font-bold text-blue-400">{studentsList.length} Athletes</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-ink-400">Profile Registration Date</span>
                      <span className="text-white">{parent.registeredAt ? new Date(parent.registeredAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-6 py-4 sm:px-8">
          <p className="text-xs text-ink-400">
            TruCoach Family Record • {studentsList.length} Linked Athletes
          </p>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}

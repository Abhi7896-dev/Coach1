import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
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
  PauseCircle,
  XCircle,
  ExternalLink,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoachItem } from '@/pages/AdminPortal';

interface CoachProfileModalProps {
  coach: CoachItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (coachId: string, status: 'approved' | 'rejected' | 'paused') => Promise<void>;
  onBatchCreated?: () => void;
}

export function CoachProfileModal({
  coach,
  isOpen,
  onClose,
  onStatusUpdate,
  onBatchCreated,
}: CoachProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'students' | 'inquiries'>('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // New Batch Form Modal State
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [newBatchTitle, setNewBatchTitle] = useState('');
  const [newBatchSport, setNewBatchSport] = useState('Cricket');
  const [newBatchSchedule, setNewBatchSchedule] = useState('Mon, Wed, Fri');
  const [newBatchTime, setNewBatchTime] = useState('4:00 PM - 5:30 PM');
  const [newBatchFee, setNewBatchFee] = useState('1500');
  const [newBatchCapacity, setNewBatchCapacity] = useState('20');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  useEffect(() => {
    if (coach && isOpen) {
      loadDeepCoachData(coach.id, coach.academyName);
    }
  }, [coach, isOpen]);

  const loadDeepCoachData = async (coachId: string, academyName: string) => {
    setIsLoadingDetails(true);
    try {
      const [batchesRes, enrollmentsRes, requestsRes] = await Promise.allSettled([
        supabase.from('batches').select('*').eq('tutor_id', coachId),
        supabase.from('enrollments').select('*, students(*)').eq('tutor_id', coachId),
        supabase.from('admission_requests').select('*').or(`academy_name.ilike.%${academyName}%,tutor_id.eq.${coachId}`),
      ]);

      setBatches(batchesRes.status === 'fulfilled' ? batchesRes.value.data || [] : []);
      setStudents(enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value.data || [] : []);
      setInquiries(requestsRes.status === 'fulfilled' ? requestsRes.value.data || [] : []);
    } catch (err) {
      console.error('Error loading deep coach data:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen || !coach) return null;

  const handleStatus = async (status: 'approved' | 'rejected' | 'paused') => {
    setStatusUpdating(true);
    try {
      await onStatusUpdate(coach.id, status);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchTitle.trim()) return;

    setIsCreatingBatch(true);
    try {
      const { data, error } = await supabase
        .from('batches')
        .insert({
          title: newBatchTitle.trim(),
          sport_name: newBatchSport,
          sport: newBatchSport,
          tutor_id: coach.id,
          schedule: newBatchSchedule,
          days: newBatchSchedule,
          time: newBatchTime,
          fee: parseFloat(newBatchFee) || 0,
          monthly_fee: parseFloat(newBatchFee) || 0,
          capacity: parseInt(newBatchCapacity) || 20,
          max_capacity: parseInt(newBatchCapacity) || 20,
        })
        .select()
        .single();

      if (error) {
        alert('Could not create batch: ' + error.message);
      } else {
        setBatches((prev) => [data, ...prev]);
        setIsAddingBatch(false);
        setNewBatchTitle('');
        if (onBatchCreated) onBatchCreated();
      }
    } catch (err: any) {
      alert('Error creating batch: ' + err.message);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleExportRoster = () => {
    if (students.length === 0) return;
    const headers = ['Student Name', 'Age', 'Gender', 'Guardian Contact', 'Batch', 'Enrollment Date', 'Status'];
    const rows = students.map((e) => {
      const s = e.students || {};
      return [
        `"${s.name || 'Athlete'}"`,
        s.age || 'N/A',
        s.gender || 'N/A',
        s.parent_phone || s.guardian_phone || 'N/A',
        `"${batches.find((b) => b.id === e.batch_id)?.title || 'General Batch'}"`,
        e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A',
        e.status || 'Active',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${coach.name.replace(/\s+/g, '_')}_Student_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanPhone = (coach.phone || '').replace(/[^0-9]/g, '');

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
        {/* Header Ribbon with Brand Aura */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-orange-500/15 via-transparent to-blue-500/10 p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 font-display text-2xl font-bold text-white shadow-xl">
                  {coach.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#0c1018] ${
                    coach.status === 'approved'
                      ? 'bg-emerald-500'
                      : coach.status === 'paused'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-white">{coach.name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      coach.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : coach.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : coach.status === 'paused'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {coach.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-ink-300">
                    {coach.role === 'admin' ? 'Super Admin' : (coach.role === 'academy_admin' ? 'Academy Admin' : 'Coach')}
                  </span>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{coach.academyName}</span>
                  {coach.locality && (
                    <span className="text-ink-400">• {coach.locality}, {coach.pincode}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {cleanPhone && (
                <>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                  >
                    <Phone className="h-3.5 w-3.5 text-blue-400" />
                    <span>Call</span>
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

              {coach.email && (
                <a
                  href={`mailto:${coach.email}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  <Mail className="h-3.5 w-3.5 text-amber-400" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto border-t border-white/10 pt-4">
            {[
              { id: 'overview', label: 'Profile & Academy', icon: Building2 },
              { id: 'batches', label: `Batches (${batches.length})`, icon: Layers },
              { id: 'students', label: `Enrolled Students (${students.length})`, icon: Users },
              { id: 'inquiries', label: `Admissions & Trials (${inquiries.length})`, icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-ink-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {isLoadingDetails ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-400" />
              <p className="mt-3 text-xs text-ink-400">Loading live database records for this coach...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-orange-400">
                      Coaching Credentials &amp; Location
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Tutor ID</span>
                        <span className="font-mono text-ink-200">{coach.id}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Official Academy</span>
                        <span className="font-bold text-white">{coach.academyName}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Phone Number</span>
                        <span className="text-white font-mono">{coach.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Email Address</span>
                        <span className="text-white">{coach.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Locality &amp; Pincode</span>
                        <span className="text-white">{coach.locality || 'Hyderabad'} {coach.pincode ? `(${coach.pincode})` : ''}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Coaching Experience</span>
                        <span className="font-bold text-white">{coach.experienceYears} Years</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Monthly Tuition Base</span>
                        <span className="font-bold text-emerald-400">₹{coach.basePrice} / month</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-2">
                        Offered Sports Disciplines:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {coach.sportsOffered.length > 0 ? (
                          coach.sportsOffered.map((sport) => (
                            <span
                              key={sport}
                              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-orange-300"
                            >
                              🏆 {sport}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-ink-500">Cricket, Football, Badminton</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-blue-400">
                      Live Platform Metrics
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                        <span className="text-[10px] text-ink-400 uppercase block font-bold">Total Batches</span>
                        <span className="font-display text-2xl font-bold text-white mt-1 block">{batches.length}</span>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                        <span className="text-[10px] text-ink-400 uppercase block font-bold">Enrolled Students</span>
                        <span className="font-display text-2xl font-bold text-emerald-400 mt-1 block">{students.length}</span>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                        <span className="text-[10px] text-ink-400 uppercase block font-bold">Est. Monthly Gross</span>
                        <span className="font-display text-2xl font-bold text-orange-400 mt-1 block">
                          ₹{coach.basePrice * students.length}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                        <span className="text-[10px] text-ink-400 uppercase block font-bold">Inquiries</span>
                        <span className="font-display text-2xl font-bold text-purple-400 mt-1 block">{inquiries.length}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between text-ink-300">
                        <span>Payment Window:</span>
                        <span className="font-bold text-white">Day 1 to 7 of month</span>
                      </div>
                      <div className="flex items-center justify-between text-ink-300">
                        <span>Report Card Cycle:</span>
                        <span className="font-bold text-white">Day 28 of month</span>
                      </div>
                      <div className="flex items-center justify-between text-ink-300">
                        <span>Escrow Mode:</span>
                        <span className="font-bold text-emerald-400">Zero-Custody Direct Split</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BATCHES */}
              {activeTab === 'batches' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-400">
                      Training batches created by this academy ({batches.length})
                    </p>
                    <button
                      onClick={() => setIsAddingBatch(!isAddingBatch)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition shadow-md shadow-orange-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isAddingBatch ? 'Cancel' : 'Create Batch'}</span>
                    </button>
                  </div>

                  {/* Add Batch Form Dropdown */}
                  <AnimatePresence>
                    {isAddingBatch && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCreateBatch}
                        className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 space-y-4"
                      >
                        <h4 className="font-display text-sm font-bold text-white">Create New Batch in Supabase</h4>
                        <div className="grid gap-3 sm:grid-cols-3 text-xs">
                          <div>
                            <label className="text-ink-300 block mb-1">Batch Title</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Morning Pro Academy"
                              value={newBatchTitle}
                              onChange={(e) => setNewBatchTitle(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Sport</label>
                            <input
                              type="text"
                              required
                              value={newBatchSport}
                              onChange={(e) => setNewBatchSport(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Monthly Fee (₹)</label>
                            <input
                              type="number"
                              required
                              value={newBatchFee}
                              onChange={(e) => setNewBatchFee(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Weekly Days</label>
                            <input
                              type="text"
                              value={newBatchSchedule}
                              onChange={(e) => setNewBatchSchedule(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Session Timing</label>
                            <input
                              type="text"
                              value={newBatchTime}
                              onChange={(e) => setNewBatchTime(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Max Capacity</label>
                            <input
                              type="number"
                              value={newBatchCapacity}
                              onChange={(e) => setNewBatchCapacity(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingBatch(false)}
                            className="rounded-xl px-3 py-1.5 text-xs text-ink-300 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isCreatingBatch}
                            className="rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-600 shadow-md"
                          >
                            {isCreatingBatch ? 'Saving...' : 'Save Batch'}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {batches.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <Layers className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No batches created for this coach yet. Tap "Create Batch" above to create one.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {batches.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition hover:border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase">
                              {b.sport_name || b.sport || 'Sports'}
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              ₹{b.fee || b.monthly_fee || coach.basePrice} / mo
                            </span>
                          </div>

                          <h4 className="mt-3 font-display text-base font-bold text-white">{b.title || b.name || 'Batch'}</h4>

                          <div className="mt-3 space-y-1.5 text-xs text-ink-300 border-t border-white/5 pt-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-ink-400" />
                              <span>{b.days || b.schedule || 'Weekly Schedule'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-ink-400" />
                              <span>{b.time || b.start_time || 'Regular Timing'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-ink-400" />
                              <span>Capacity: {b.capacity || b.max_capacity || 25} Athletes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STUDENTS */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-400">
                      Total Enrolled Athletes: <strong className="text-white">{students.length}</strong>
                    </p>
                    {students.length > 0 && (
                      <button
                        onClick={handleExportRoster}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Export CSV</span>
                      </button>
                    )}
                  </div>

                  {students.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <Users className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No students currently enrolled under this coach in the database.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                          <tr>
                            <th className="px-5 py-3.5">Athlete Name</th>
                            <th className="px-5 py-3.5">Age / Gender</th>
                            <th className="px-5 py-3.5">Guardian Contact</th>
                            <th className="px-5 py-3.5">Enrolled Batch</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {students.map((e) => {
                            const s = e.students || {};
                            const b = batches.find((item) => item.id === e.batch_id);
                            return (
                              <tr key={e.id} className="hover:bg-white/[0.03]">
                                <td className="px-5 py-3.5 font-bold text-white">
                                  {s.name || 'Athlete'}
                                </td>
                                <td className="px-5 py-3.5 text-ink-300">
                                  {s.age ? `${s.age} yrs` : '—'} • {s.gender || '—'}
                                </td>
                                <td className="px-5 py-3.5 text-ink-300">
                                  <p className="font-medium text-white">{s.guardian_name || 'Guardian'}</p>
                                  <p className="font-mono text-ink-400">{s.parent_phone || s.guardian_phone || '—'}</p>
                                </td>
                                <td className="px-5 py-3.5 text-orange-400">
                                  {b?.title || 'General Batch'}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                                    {e.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INQUIRIES & TRIALS */}
              {activeTab === 'inquiries' && (
                <div className="space-y-4">
                  {inquiries.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <HelpCircle className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No direct admissions or free trial queries recorded for this coach in the database yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                          <tr>
                            <th className="px-5 py-3.5">Parent / Phone</th>
                            <th className="px-5 py-3.5">Child / Age</th>
                            <th className="px-5 py-3.5">Sport Requested</th>
                            <th className="px-5 py-3.5">Query Type</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {inquiries.map((q) => (
                            <tr key={q.id} className="hover:bg-white/[0.03]">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-white">{q.parent_name || 'Parent'}</p>
                                <p className="text-ink-400 font-mono">{q.parent_phone}</p>
                              </td>
                              <td className="px-5 py-3.5 text-ink-200">
                                {q.child_name || 'Athlete'} {q.child_age ? `(${q.child_age} yrs)` : ''}
                              </td>
                              <td className="px-5 py-3.5 font-bold text-orange-400">
                                {q.sport_name || 'General'}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                                  {q.request_type || 'Trial'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-ink-300 uppercase font-bold text-[10px]">
                                {q.status || 'New'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-white/[0.02] px-6 py-4 sm:px-8">
          <p className="text-xs text-ink-400">
            Registered Date: {coach.createdAt ? new Date(coach.createdAt).toLocaleDateString() : 'N/A'}
          </p>

          <div className="flex items-center gap-2">
            {coach.status !== 'approved' && (
              <button
                disabled={statusUpdating}
                onClick={() => handleStatus('approved')}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/25"
              >
                Approve &amp; Activate
              </button>
            )}

            {coach.status === 'approved' && (
              <button
                disabled={statusUpdating}
                onClick={() => handleStatus('paused')}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition shadow-lg shadow-amber-500/25"
              >
                Pause Coach Access
              </button>
            )}

            {coach.status === 'paused' && (
              <button
                disabled={statusUpdating}
                onClick={() => handleStatus('approved')}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition"
              >
                Resume Access
              </button>
            )}

            {coach.status !== 'rejected' && (
              <button
                disabled={statusUpdating}
                onClick={() => handleStatus('rejected')}
                className="rounded-xl bg-rose-600/30 border border-rose-500/30 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition"
              >
                Revoke / Reject
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

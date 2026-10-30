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
  Ticket,
  Search,
  Wallet,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Landmark,
  Save,
  Globe,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoachItem } from '@/pages/AdminPortal';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// schedule_days is a real Postgres array column, not a string.
const formatDays = (days: unknown): string =>
  Array.isArray(days) && days.length > 0 ? days.join(', ') : '';

// The only columns that actually exist on `students` — kept as one source of
// truth so the in-app instructions, the downloadable template, and the
// importer's validation can never drift apart.
const CSV_REQUIRED_COLUMNS = ['name', 'parent_phone'] as const;
const CSV_OPTIONAL_COLUMNS = ['guardian_name', 'age'] as const;

// Minimal RFC 4180-ish CSV parser: handles quoted fields, escaped quotes
// ("") and commas inside quotes — enough for a simple student-roster sheet
// without pulling in a whole CSV library.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
}

interface CoachProfileModalProps {
  coach: CoachItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (coachId: string, status: 'approved' | 'rejected' | 'paused') => Promise<void>;
  onBatchCreated?: () => void;
  onUpdateEasebuzz?: (coachId: string, accountLabel: string, subMerchantId: string) => Promise<void>;
  onUpdateRole?: (coachId: string, role: string) => Promise<void>;
}

export function CoachProfileModal({
  coach,
  isOpen,
  onClose,
  onStatusUpdate,
  onBatchCreated,
  onUpdateEasebuzz,
  onUpdateRole,
}: CoachProfileModalProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'batches' | 'students' | 'inquiries' | 'events' | 'finance'
  >('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [financeLogs, setFinanceLogs] = useState<any[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isConfirmingRoleChange, setIsConfirmingRoleChange] = useState(false);

  // Public profile visibility — platform-admin-only; the coach has no field
  // or screen anywhere in the app to see or change this themselves. Fetched
  // directly rather than threaded through the admin portal's bulk coach
  // list, since it's a rarely-touched, modal-local control.
  const [publicProfileEnabled, setPublicProfileEnabled] = useState<boolean | null>(null);
  const [togglingPublicProfile, setTogglingPublicProfile] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState<string | null>(null);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);

  // Wherever this admin portal is actually running right now — localhost
  // during local dev, the real domain once deployed — never a hardcoded
  // production URL that would be wrong in every environment except prod.
  const publicProfileUrl = `${window.location.origin}/coach/${coach?.id || ''}`;
  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setPublicLinkCopied(true);
      setTimeout(() => setPublicLinkCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing further to do silently
    }
  };

  useEffect(() => {
    if (!coach) return;
    let cancelled = false;
    supabase
      .from('tutors')
      .select('public_profile_enabled')
      .eq('id', coach.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setPublicProfileEnabled(data?.public_profile_enabled ?? false);
      });
    return () => {
      cancelled = true;
    };
  }, [coach?.id]);

  const handleTogglePublicProfile = async () => {
    if (!coach || publicProfileEnabled === null || togglingPublicProfile) return;
    const next = !publicProfileEnabled;
    setTogglingPublicProfile(true);
    setPublicProfileError(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'toggle_coach_public_profile', user_id: coach.id, enabled: next },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPublicProfileEnabled(next);
    } catch (err: any) {
      setPublicProfileError(err?.message || 'Failed to update public profile visibility.');
    } finally {
      setTogglingPublicProfile(false);
    }
  };

  // Easebuzz Settlement Configuration State
  const [subMerchantId, setSubMerchantId] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [isSavingEasebuzz, setIsSavingEasebuzz] = useState(false);
  const [easebuzzError, setEasebuzzError] = useState<string | null>(null);

  // Financial Logs filter state
  const [financeStatusFilter, setFinanceStatusFilter] = useState<string>('all');
  const [financeSearch, setFinanceSearch] = useState('');
  const [isExportingReport, setIsExportingReport] = useState(false);

  // New Batch Form Modal State
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [sportsList, setSportsList] = useState<{ id: string; name: string }[]>([]);
  const [newBatchTitle, setNewBatchTitle] = useState('');
  const [newBatchSportId, setNewBatchSportId] = useState('');
  const [newBatchDays, setNewBatchDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [newBatchStartTime, setNewBatchStartTime] = useState('16:00');
  const [newBatchEndTime, setNewBatchEndTime] = useState('17:30');
  const [newBatchFee, setNewBatchFee] = useState('1500');
  const [newBatchCapacity, setNewBatchCapacity] = useState('20');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Bulk CSV Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importBatchId, setImportBatchId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failures: { row: number; name: string; reason: string }[];
  } | null>(null);

  const calculateAge = (dob?: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };

  useEffect(() => {
    if (coach && isOpen) {
      loadDeepCoachData(coach.id);
      setSubMerchantId(coach.easebuzzSubMerchantId || '');
      setAccountLabel(coach.easebuzzAccountLabel || '');
      setEasebuzzError(null);
    }
  }, [coach, isOpen]);

  const handleSaveEasebuzz = async () => {
    if (!coach || !onUpdateEasebuzz) return;
    const trimmedId = subMerchantId.trim();
    if (trimmedId && !/^[a-zA-Z0-9-]{1,15}$/.test(trimmedId)) {
      setEasebuzzError('Sub-Merchant ID must be 1-15 characters: letters, numbers, and hyphens only.');
      return;
    }
    setEasebuzzError(null);
    setIsSavingEasebuzz(true);
    try {
      await onUpdateEasebuzz(coach.id, accountLabel.trim(), trimmedId);
    } catch (err: any) {
      setEasebuzzError(err?.message || 'Failed to save settlement details.');
    } finally {
      setIsSavingEasebuzz(false);
    }
  };

  const loadDeepCoachData = async (coachId: string) => {
    setIsLoadingDetails(true);
    try {
      const [batchesRes, enrollmentsRes, requestsRes, eventsRes, financeRes, sportsRes] = await Promise.allSettled([
        // batches has no sport_name/schedule/days/time/fee/max_capacity columns —
        // sport is a separate lookup table joined via sport_id, and the real
        // schedule/fee fields are schedule_days/start_time/end_time/monthly_fee.
        supabase.from('batches').select('*, sports(name)').eq('tutor_id', coachId),
        supabase.from('enrollments').select('*, students(*)').eq('tutor_id', coachId),
        // Strictly scoped to THIS coach only — not the whole academy, so a
        // sibling coach's requests never leak into this profile.
        supabase.from('admission_requests').select('*').eq('tutor_id', coachId),
        supabase
          .from('community_events')
          .select('*')
          .eq('tutor_id', coachId)
          .order('event_date', { ascending: false }),
        // finance_logs is keyed by tutor_id, not student_id — scope directly to this coach.
        supabase
          .from('finance_logs')
          .select('*')
          .eq('tutor_id', coachId)
          .order('created_at', { ascending: false }),
        supabase.from('sports').select('id, name').order('name'),
      ]);

      setBatches(batchesRes.status === 'fulfilled' ? batchesRes.value.data || [] : []);
      setStudents(enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value.data || [] : []);
      setInquiries(requestsRes.status === 'fulfilled' ? requestsRes.value.data || [] : []);
      setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value.data || [] : []);
      setFinanceLogs(financeRes.status === 'fulfilled' ? financeRes.value.data || [] : []);
      const fetchedSports = sportsRes.status === 'fulfilled' ? sportsRes.value.data || [] : [];
      setSportsList(fetchedSports);
      if (fetchedSports.length > 0) {
        setNewBatchSportId((prev) => prev || fetchedSports[0].id);
      }
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

  // Clicking the badge only opens the confirmation — this is a privileged,
  // blast-radius-affecting change (it changes what the coach can do in
  // their own app), not something that should ever fire from one accidental
  // tap. The actual write happens in confirmRoleChange below.
  const handleRoleToggle = () => {
    if (!onUpdateRole || isUpdatingRole) return;
    setIsConfirmingRoleChange(true);
  };

  const confirmRoleChange = async () => {
    if (!onUpdateRole || isUpdatingRole) return;
    // 'academy_admin' — not plain 'coach' — is what actually unlocks
    // academy-management screens (staff, academy settings) within the app;
    // 'coach'/'staff_coach' are non-admin roles under an academy.
    const newRole = coach.role === 'independent' ? 'academy_admin' : 'independent';
    setIsUpdatingRole(true);
    try {
      await onUpdateRole(coach.id, newRole);
      setIsConfirmingRoleChange(false);
    } catch (_) {
      // onUpdateRole already surfaces its own error notice; leave the
      // dialog open so the admin can see the error and retry or cancel.
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const toggleBatchDay = (day: string) => {
    setNewBatchDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchTitle.trim() || !newBatchSportId || newBatchDays.length === 0) return;

    setIsCreatingBatch(true);
    try {
      // batches only has: title, tutor_id, sport_id (FK -> sports), academy_id,
      // schedule_days, start_time, end_time, monthly_fee, capacity.
      // schedule_days is a real Postgres array column — sending it as a plain
      // comma-separated string ("Mon, Wed, Fri") fails with "malformed array
      // literal" every time, which is why batch creation never worked before.
      const { data, error } = await supabase
        .from('batches')
        .insert({
          title: newBatchTitle.trim(),
          tutor_id: coach.id,
          sport_id: newBatchSportId,
          schedule_days: newBatchDays,
          start_time: newBatchStartTime,
          end_time: newBatchEndTime,
          monthly_fee: parseFloat(newBatchFee) || 0,
          capacity: parseInt(newBatchCapacity) || 20,
        })
        .select()
        .single();

      if (error) {
        alert('Could not create batch: ' + error.message);
      } else {
        const sportName = sportsList.find((s) => s.id === newBatchSportId)?.name;
        setBatches((prev) => [{ ...data, sports: sportName ? { name: sportName } : null }, ...prev]);
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
    const headers = ['Student Name', 'Age', 'Guardian Contact', 'Batch', 'Enrollment Date', 'Status'];
    const rows = students.map((e) => {
      const s = e.students || {};
      const age = calculateAge(s.dob);
      return [
        `"${s.name || 'Athlete'}"`,
        age !== null ? age : 'N/A',
        s.parent_phone || 'N/A',
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

  // `finance_logs` has no student_id — only enrollment_id. The "students" tab
  // data (enrollments for this coach, each with its embedded student record)
  // already has everything we need to resolve enrollment_id -> athlete, so
  // reuse it instead of firing another query.
  const enrollmentMap = new Map(students.map((e: any) => [e.id, e]));
  const resolveStudent = (f: any) => {
    const enr = f.enrollment_id ? enrollmentMap.get(f.enrollment_id) : undefined;
    const s = enr?.students;
    return {
      name: s?.name || 'Unknown Athlete',
      guardian: s?.guardian_name || '',
      phone: s?.parent_phone || '',
    };
  };

  // A log is "Paid" (money the coach actually received) only if its status
  // reads as a completed payment. Everything else (pending/failed/initiated/
  // refunded/...) still counts toward the max-potential total below, but not
  // toward what's actually been received.
  const PAID_STATUS_HINTS = ['paid', 'success', 'complete', 'settled', 'captured'];
  const isPaidStatus = (status: unknown) => {
    const s = typeof status === 'string' ? status.toLowerCase() : '';
    return PAID_STATUS_HINTS.some((hint) => s.includes(hint));
  };

  // Distinct statuses actually present in this coach's finance logs, so the
  // filter always matches whatever status strings the payment flow really uses.
  const financeStatuses = Array.from(
    new Set(financeLogs.map((f) => (f.status || 'unknown').toLowerCase()))
  );

  const filteredFinanceLogs = financeLogs.filter((f) => {
    const status = (f.status || 'unknown').toLowerCase();
    const matchesStatus = financeStatusFilter === 'all' || status === financeStatusFilter;
    const q = financeSearch.toLowerCase().trim();
    const student = resolveStudent(f);
    const matchesSearch =
      !q ||
      student.name.toLowerCase().includes(q) ||
      (f.batch_title || '').toLowerCase().includes(q) ||
      (f.transaction_id || '').toLowerCase().includes(q) ||
      (f.payment_method || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Max potential = every log regardless of status (what's been invoiced/logged).
  // Paid = only the logs that actually completed — the real money received.
  const totalPotential = financeLogs.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalPaid = financeLogs
    .filter((f) => isPaidStatus(f.status))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const financeByStatus = financeStatuses.map((status) => {
    const rows = financeLogs.filter((f) => (f.status || 'unknown').toLowerCase() === status);
    return {
      status,
      count: rows.length,
      total: rows.reduce((sum, f) => sum + (Number(f.amount) || 0), 0),
    };
  });

  const handleExportFinance = () => {
    if (financeLogs.length === 0) return;
    const headers = ['Date', 'Athlete', 'Guardian Phone', 'Amount', 'Payment Method', 'Status', 'Transaction ID'];
    const rows = financeLogs.map((f) => {
      const student = resolveStudent(f);
      return [
        f.paid_at || f.created_at ? new Date(f.paid_at || f.created_at).toLocaleDateString() : 'N/A',
        `"${student.name}"`,
        student.phone || 'N/A',
        f.amount || 0,
        f.payment_method || 'N/A',
        f.status || 'N/A',
        f.transaction_id || 'N/A',
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${coach.name.replace(/\s+/g, '_')}_Financial_Logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Full multi-sheet export for this coach — one workbook, five tabs.
  // xlsx is dynamically imported so it never bloats the main site bundle;
  // it only loads the moment an admin actually clicks the button.
  const handleExportFullReport = async () => {
    setIsExportingReport(true);
    try {
      const XLSX = await import('xlsx');

      const profileSheet = XLSX.utils.json_to_sheet([
        {
          'Tutor ID': coach.id,
          Name: coach.name,
          Academy: coach.academyName,
          Role: coach.role,
          Status: coach.status,
          Phone: coach.phone,
          Email: coach.email,
          Locality: coach.locality,
          Pincode: coach.pincode,
          'Experience (Years)': coach.experienceYears,
          'Sports Offered': coach.sportsOffered.join(', ') || 'N/A',
          'Total Batches': batches.length,
          'Total Students': students.length,
          'Total Events': events.length,
          'Total Paid (Received) (₹)': totalPaid,
          'Registered On': coach.createdAt ? new Date(coach.createdAt).toLocaleDateString() : 'N/A',
        },
      ]);

      const batchesSheet = XLSX.utils.json_to_sheet(
        batches.map((b: any) => ({
          Title: b.title || 'Batch',
          Sport: b.sports?.name || 'Sports',
          Days: formatDays(b.schedule_days) || 'Weekly',
          Timing: b.start_time ? `${b.start_time}${b.end_time ? ' - ' + b.end_time : ''}` : 'Regular Timing',
          'Monthly Fee (₹)': b.monthly_fee || 0,
          Capacity: b.capacity || 'N/A',
        }))
      );

      const studentsSheet = XLSX.utils.json_to_sheet(
        students.map((e: any) => {
          const s = e.students || {};
          const b = batches.find((item: any) => item.id === e.batch_id);
          const age = calculateAge(s.dob);
          return {
            'Athlete Name': s.name || 'Athlete',
            Age: age !== null ? age : 'N/A',
            'Guardian Name': s.guardian_name || 'N/A',
            'Guardian Phone': s.parent_phone || 'N/A',
            Batch: b?.title || 'General Batch',
            'Enrolled On': e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A',
            Status: e.status || 'Active',
          };
        })
      );

      const eventsSheet = XLSX.utils.json_to_sheet(
        events.map((ev: any) => ({
          Title: ev.title || 'Community Event',
          Sport: ev.sport_name || 'Sports',
          Date: ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'N/A',
          Time: ev.start_time ? `${ev.start_time}${ev.end_time ? ' - ' + ev.end_time : ''}` : 'N/A',
          Venue: ev.venue_address || 'N/A',
          Pincode: ev.pincode || 'N/A',
          Fee: ev.is_paid ? `₹${ev.entry_fee}` : 'Free',
          'Booked / Capacity': `${ev.booked_count || 0} / ${ev.max_capacity || '∞'}`,
          'Public Event': ev.is_public === false ? 'No' : 'Yes',
          Attendees: Array.isArray(ev.attendees) ? ev.attendees.length : 0,
        }))
      );

      const financeSheet = XLSX.utils.json_to_sheet(
        financeLogs.map((f: any) => {
          const student = resolveStudent(f);
          return {
            Date: f.paid_at || f.created_at ? new Date(f.paid_at || f.created_at).toLocaleDateString() : 'N/A',
            Athlete: student.name,
            'Guardian Phone': student.phone || 'N/A',
            'Amount (₹)': f.amount || 0,
            'Payment Method': f.payment_method || 'N/A',
            Status: f.status || 'N/A',
            'Transaction ID': f.transaction_id || 'N/A',
          };
        })
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, profileSheet, 'Profile');
      XLSX.utils.book_append_sheet(wb, batchesSheet, 'Batches');
      XLSX.utils.book_append_sheet(wb, studentsSheet, 'Students Enrolled');
      XLSX.utils.book_append_sheet(wb, eventsSheet, 'Events');
      XLSX.utils.book_append_sheet(wb, financeSheet, 'Financial Logs');

      XLSX.writeFile(wb, `${coach.name.replace(/\s+/g, '_')}_TruCoach_Report.xlsx`);
    } catch (err) {
      console.error('Error generating coach report:', err);
      alert('Could not generate the report. Please try again.');
    } finally {
      setIsExportingReport(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const headers = [...CSV_REQUIRED_COLUMNS, ...CSV_OPTIONAL_COLUMNS];
    const exampleRow = ['Aarav Sharma', '9876543210', 'Rajesh Sharma', '10'];
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), exampleRow.join(',')].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'TruCoach_Student_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = async (file: File) => {
    setIsImporting(true);
    setImportResults(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length === 0) {
        setImportResults({ total: 0, success: 0, failures: [{ row: 0, name: '', reason: 'File is empty or unreadable.' }] });
        return;
      }

      const headerRow = Object.keys(rows[0]);
      const missingRequired = CSV_REQUIRED_COLUMNS.filter((c) => !headerRow.includes(c));
      if (missingRequired.length > 0) {
        setImportResults({
          total: rows.length,
          success: 0,
          failures: [{ row: 0, name: '', reason: `Missing required column(s): ${missingRequired.join(', ')}` }],
        });
        return;
      }

      const failures: { row: number; name: string; reason: string }[] = [];
      let success = 0;

      // Sequential on purpose — students insert triggers server-side
      // validation (e.g. duplicate-role checks), so we surface each row's
      // real error individually rather than firing them all in parallel.
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = (r.name || '').trim();
        const parentPhoneRaw = (r.parent_phone || '').replace(/[^0-9]/g, '');
        const parentPhone = parentPhoneRaw.length > 10 ? parentPhoneRaw.slice(-10) : parentPhoneRaw;

        if (!name || parentPhone.length !== 10) {
          failures.push({
            row: i + 2,
            name: name || '(blank)',
            reason: !name ? 'Missing name' : 'parent_phone must be a 10-digit number',
          });
          continue;
        }

        const years = parseInt(r.age) || 10;
        const dob = new Date();
        dob.setFullYear(dob.getFullYear() - years);

        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert({
            name,
            dob: dob.toISOString().slice(0, 10),
            guardian_name: r.guardian_name?.trim() || `Parent of ${name}`,
            parent_phone: parentPhone,
          })
          .select()
          .single();

        if (studentError || !newStudent) {
          failures.push({ row: i + 2, name, reason: studentError?.message || 'Insert failed' });
          continue;
        }

        const { error: enrollError } = await supabase.from('enrollments').insert({
          tutor_id: coach.id,
          student_id: newStudent.id,
          ...(importBatchId ? { batch_id: importBatchId } : {}),
        });

        if (enrollError) {
          failures.push({ row: i + 2, name, reason: `Saved athlete, but enrollment failed: ${enrollError.message}` });
          continue;
        }

        success++;
      }

      setImportResults({ total: rows.length, success, failures });
      loadDeepCoachData(coach.id);
      if (onBatchCreated) onBatchCreated();
    } catch (err: any) {
      setImportResults({
        total: 0,
        success: 0,
        failures: [{ row: 0, name: '', reason: err?.message || 'Unexpected error reading file' }],
      });
    } finally {
      setIsImporting(false);
    }
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

              <button
                onClick={handleExportFullReport}
                disabled={isExportingReport}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-60"
              >
                <FileSpreadsheet className={`h-3.5 w-3.5 ${isExportingReport ? 'animate-pulse' : ''}`} />
                <span>{isExportingReport ? 'Generating...' : 'Download Report'}</span>
              </button>

              <button
                onClick={() => {
                  setImportResults(null);
                  setIsImportOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400 transition hover:bg-blue-500/20"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import CSV</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto border-t border-white/10 pt-4">
            {[
              { id: 'overview', label: 'Profile & Academy', icon: Building2 },
              { id: 'batches', label: `Batches (${batches.length})`, icon: Layers },
              { id: 'students', label: `Enrolled Students (${students.length})`, icon: Users },
              { id: 'inquiries', label: `Admissions & Trials (${inquiries.length})`, icon: HelpCircle },
              { id: 'events', label: `Events (${events.length})`, icon: Ticket },
              { id: 'finance', label: `Financial Logs (${financeLogs.length})`, icon: Wallet },
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
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-ink-400">Coach Type</span>
                        {onUpdateRole ? (
                          <button
                            onClick={handleRoleToggle}
                            disabled={isUpdatingRole}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                              coach.role === 'independent'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25'
                                : 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25'
                            }`}
                            title="Click to switch this coach's type"
                          >
                            {isUpdatingRole && <RefreshCw className="h-3 w-3 animate-spin" />}
                            {coach.role === 'independent' ? 'Individual Coach' : 'Academy Coach'}
                          </button>
                        ) : (
                          <span className="font-bold text-white">
                            {coach.role === 'independent' ? 'Individual Coach' : 'Academy Coach'}
                          </span>
                        )}
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
                        <span className="text-ink-400">Avg. Batch Fee</span>
                        <span className="font-bold text-emerald-400">
                          {batches.length > 0
                            ? `₹${Math.round(
                                batches.reduce((sum: number, b: any) => sum + (Number(b.monthly_fee) || 0), 0) /
                                  batches.length
                              )} / month`
                            : 'No batches yet'}
                        </span>
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
                        <span className="text-[10px] text-ink-400 uppercase block font-bold">Total Paid (Received)</span>
                        <span className="font-display text-2xl font-bold text-orange-400 mt-1 block">
                          ₹{totalPaid.toLocaleString('en-IN')}
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
                        <span
                          className={
                            'font-bold ' + (coach.easebuzzSubMerchantId ? 'text-emerald-400' : 'text-amber-400')
                          }
                        >
                          {coach.easebuzzSubMerchantId ? 'Zero-Custody Direct Split' : 'Not Configured'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-sky-400" />
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-sky-400">
                        Easebuzz Settlement Configuration
                      </h3>
                    </div>
                    <p className="text-xs text-ink-400 -mt-2">
                      Sets this coach up as an Easebuzz sub-merchant so student fee payments settle directly to
                      their own account instead of being held by TruCoach.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-1.5">
                          Easebuzz Sub-Merchant ID
                        </label>
                        <input
                          type="text"
                          value={subMerchantId}
                          onChange={(e) => setSubMerchantId(e.target.value)}
                          placeholder="e.g. TC-COACH-042"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-white placeholder-ink-500 outline-none focus:border-sky-500/60"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-1.5">
                          Account Label (optional)
                        </label>
                        <input
                          type="text"
                          value={accountLabel}
                          onChange={(e) => setAccountLabel(e.target.value)}
                          placeholder="e.g. Ramesh's Cricket Academy"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-ink-500 outline-none focus:border-sky-500/60"
                        />
                      </div>
                    </div>

                    {easebuzzError && (
                      <p className="text-xs font-semibold text-rose-400">{easebuzzError}</p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-ink-500">
                        1-15 characters &middot; letters, numbers, and hyphens only.
                      </span>
                      <button
                        onClick={handleSaveEasebuzz}
                        disabled={isSavingEasebuzz || !onUpdateEasebuzz}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingEasebuzz ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        <span>{isSavingEasebuzz ? 'Saving...' : 'Save Settlement Details'}</span>
                      </button>
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
                            <select
                              required
                              value={newBatchSportId}
                              onChange={(e) => setNewBatchSportId(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-white outline-none focus:border-orange-500"
                            >
                              {sportsList.length === 0 && <option value="">Loading sports...</option>}
                              {sportsList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
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
                          <div className="sm:col-span-3">
                            <label className="text-ink-300 block mb-1">Weekly Days</label>
                            <div className="flex flex-wrap gap-1.5">
                              {WEEKDAYS.map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleBatchDay(day)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                    newBatchDays.includes(day)
                                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                      : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                            {newBatchDays.length === 0 && (
                              <p className="mt-1.5 text-[10px] text-rose-400">Select at least one day.</p>
                            )}
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">Start Time</label>
                            <input
                              type="time"
                              value={newBatchStartTime}
                              onChange={(e) => setNewBatchStartTime(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-ink-300 block mb-1">End Time</label>
                            <input
                              type="time"
                              value={newBatchEndTime}
                              onChange={(e) => setNewBatchEndTime(e.target.value)}
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
                            disabled={isCreatingBatch || newBatchDays.length === 0}
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
                              {b.sports?.name || 'Sports'}
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              ₹{b.monthly_fee || 0} / mo
                            </span>
                          </div>

                          <h4 className="mt-3 font-display text-base font-bold text-white">{b.title || 'Batch'}</h4>

                          <div className="mt-3 space-y-1.5 text-xs text-ink-300 border-t border-white/5 pt-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-ink-400" />
                              <span>{formatDays(b.schedule_days) || 'Weekly Schedule'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-ink-400" />
                              <span>
                                {b.start_time ? `${b.start_time}${b.end_time ? ' - ' + b.end_time : ''}` : 'Regular Timing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-ink-400" />
                              <span>Capacity: {b.capacity || 25} Athletes</span>
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
                            <th className="px-5 py-3.5">Age</th>
                            <th className="px-5 py-3.5">Guardian Contact</th>
                            <th className="px-5 py-3.5">Enrolled Batch</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {students.map((e) => {
                            const s = e.students || {};
                            const b = batches.find((item) => item.id === e.batch_id);
                            const age = calculateAge(s.dob);
                            return (
                              <tr key={e.id} className="hover:bg-white/[0.03]">
                                <td className="px-5 py-3.5 font-bold text-white">
                                  {s.name || 'Athlete'}
                                  <span className="block font-mono text-[10px] font-normal text-ink-500">{s.id}</span>
                                </td>
                                <td className="px-5 py-3.5 text-ink-300">
                                  {age !== null ? `${age} yrs` : '—'}
                                </td>
                                <td className="px-5 py-3.5 text-ink-300">
                                  <p className="font-medium text-white">{s.guardian_name || 'Guardian'}</p>
                                  <p className="font-mono text-ink-400">{s.parent_phone || '—'}</p>
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

              {/* TAB 5: COMMUNITY EVENTS */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <Ticket className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No community events hosted by this coach in the database yet.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {events.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">
                              {ev.sport_name || 'Sports'}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                ev.is_paid
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              {ev.is_paid ? `₹${ev.entry_fee}` : 'Free'}
                            </span>
                          </div>

                          <h4 className="mt-3 font-display text-base font-bold text-white">
                            {ev.title || 'Community Event'}
                          </h4>
                          {ev.description && (
                            <p className="mt-1 text-xs text-ink-300 leading-relaxed">{ev.description}</p>
                          )}

                          <div className="mt-3 space-y-1.5 text-xs text-ink-300 border-t border-white/5 pt-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-ink-400" />
                              <span>
                                {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'Date TBD'}
                                {ev.start_time ? ` • ${ev.start_time}${ev.end_time ? ' - ' + ev.end_time : ''}` : ''}
                              </span>
                            </div>
                            {ev.venue_address && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-ink-400" />
                                <span>{ev.venue_address} {ev.pincode ? `(${ev.pincode})` : ''}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-ink-400" />
                              <span>
                                {ev.booked_count || 0} / {ev.max_capacity || '∞'} booked
                                {ev.is_public === false ? ' • Private event' : ''}
                              </span>
                            </div>
                          </div>

                          {Array.isArray(ev.attendees) && ev.attendees.length > 0 && (
                            <div className="mt-3 border-t border-white/5 pt-3">
                              <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block mb-1.5">
                                Attendees ({ev.attendees.length})
                              </span>
                              <div className="space-y-1">
                                {ev.attendees.map((a: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between rounded-lg bg-white/[0.02] px-2.5 py-1 text-[11px]"
                                  >
                                    <span className="text-white font-medium">{a.name || 'Guest'}</span>
                                    <span className="font-mono text-ink-400">{a.phone}</span>
                                    <span className="text-emerald-400 uppercase font-bold">{a.status || 'confirmed'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: FINANCIAL LOGS */}
              {activeTab === 'finance' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                      <span className="text-[10px] text-ink-400 uppercase block font-bold">Max Potential</span>
                      <span className="font-display text-2xl font-bold text-white mt-1 block">
                        ₹{totalPotential.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-ink-500 block mt-0.5">All logs, any status</span>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                      <span className="text-[10px] text-ink-400 uppercase block font-bold">Paid (Received)</span>
                      <span className="font-display text-2xl font-bold text-emerald-400 mt-1 block">
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-ink-500 block mt-0.5">Actually completed</span>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                      <span className="text-[10px] text-ink-400 uppercase block font-bold">Total Logs</span>
                      <span className="font-display text-2xl font-bold text-white mt-1 block">{financeLogs.length}</span>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                      <span className="text-[10px] text-ink-400 uppercase block font-bold">Outstanding</span>
                      <span className="font-display text-2xl font-bold text-amber-400 mt-1 block">
                        ₹{(totalPotential - totalPaid).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-ink-500 block mt-0.5">Not yet received</span>
                    </div>
                  </div>

                  {financeByStatus.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {financeByStatus.map((s) => (
                        <span
                          key={s.status}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-ink-300 capitalize"
                        >
                          {s.status}: <strong className="text-white">₹{s.total.toLocaleString('en-IN')}</strong> ({s.count})
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setFinanceStatusFilter('all')}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          financeStatusFilter === 'all'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        All ({financeLogs.length})
                      </button>
                      {financeByStatus.map((s) => (
                        <button
                          key={s.status}
                          onClick={() => setFinanceStatusFilter(s.status)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                            financeStatusFilter === s.status
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]'
                          }`}
                        >
                          {s.status} ({s.count})
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative min-w-[200px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                        <input
                          type="text"
                          placeholder="Search batch, txn ID, method..."
                          value={financeSearch}
                          onChange={(e) => setFinanceSearch(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-white placeholder-ink-400 outline-none focus:border-orange-500/60"
                        />
                      </div>
                      {financeLogs.length > 0 && (
                        <button
                          onClick={handleExportFinance}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 whitespace-nowrap"
                        >
                          <Download className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Export CSV</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {financeLogs.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      <Wallet className="mx-auto h-10 w-10 text-ink-500 mb-2" />
                      No financial logs recorded for this coach in the database yet.
                    </div>
                  ) : filteredFinanceLogs.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-14 text-center text-xs text-ink-400">
                      No logs match the current filter or search.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                          <tr>
                            <th className="px-5 py-3.5">Date</th>
                            <th className="px-5 py-3.5">Athlete</th>
                            <th className="px-5 py-3.5">Guardian Contact</th>
                            <th className="px-5 py-3.5">Amount</th>
                            <th className="px-5 py-3.5">Method</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5">Transaction ID</th>
                            <th className="px-5 py-3.5">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredFinanceLogs.map((f) => {
                            const student = resolveStudent(f);
                            return (
                            <tr key={f.id} className="hover:bg-white/[0.03]">
                              <td className="px-5 py-3.5 text-ink-300">
                                {f.paid_at || f.created_at
                                  ? new Date(f.paid_at || f.created_at).toLocaleDateString()
                                  : 'N/A'}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-white">
                                {student.name}
                              </td>
                              <td className="px-5 py-3.5 text-ink-300">
                                <p>{student.guardian || '—'}</p>
                                <p className="font-mono text-ink-400">{student.phone || '—'}</p>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-emerald-400">
                                ₹{Number(f.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-3.5 text-ink-300 capitalize">
                                {f.payment_method || 'N/A'}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-300">
                                  {f.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-ink-400">
                                {f.transaction_id || '—'}
                              </td>
                              <td className="px-5 py-3.5">
                                {f.receipt_url ? (
                                  <a
                                    href={f.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View</span>
                                  </a>
                                ) : (
                                  <span className="text-ink-500">—</span>
                                )}
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

          {/* Public profile visibility — admin-only, no coach-side control */}
          <div
            className={`mt-4 overflow-hidden rounded-2xl border transition-colors ${
              publicProfileEnabled ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${
                    publicProfileEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-ink-400'
                  }`}
                >
                  <Globe className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Public Website Profile</p>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        publicProfileEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-ink-500'
                      }`}
                    >
                      {publicProfileEnabled === null ? '...' : publicProfileEnabled ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    Admin-only — the coach has no control over this.{' '}
                    {coach?.academyId
                      ? `When on, they appear in ${coach.academyName || 'their academy'}'s public roster — no separate page.`
                      : 'When on, they get their own standalone public profile page.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleTogglePublicProfile}
                disabled={publicProfileEnabled === null || togglingPublicProfile}
                className={`relative h-7 w-[3.25rem] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  publicProfileEnabled ? 'bg-emerald-500' : 'bg-white/15'
                }`}
                aria-label="Toggle public profile visibility"
              >
                <span
                  className={`absolute top-0.5 grid h-6 w-6 place-items-center rounded-full bg-white shadow-md transition-transform ${
                    publicProfileEnabled ? 'translate-x-[1.65rem]' : 'translate-x-0.5'
                  }`}
                >
                  {togglingPublicProfile ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-500" />
                  ) : publicProfileEnabled ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-ink-400" />
                  )}
                </span>
              </button>
            </div>

            {publicProfileError && (
              <p className="border-t border-white/10 px-4 py-2 text-[11px] text-rose-400">{publicProfileError}</p>
            )}

            {publicProfileEnabled && !coach?.academyId && (
              <div className="flex items-center justify-between gap-3 border-t border-emerald-500/20 bg-black/10 px-4 py-2.5">
                <p className="truncate text-[11px] font-medium text-emerald-200/80">{publicProfileUrl}</p>
                <button
                  onClick={handleCopyPublicLink}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
                >
                  {publicLinkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {publicLinkCopied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            )}
            {publicProfileEnabled && coach?.academyId && (
              <div className="border-t border-emerald-500/20 bg-black/10 px-4 py-2.5">
                <p className="truncate text-[11px] font-medium text-emerald-200/80">
                  Visible on {coach.academyName || 'the academy'}'s public page — not a separate link.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bulk Import Students Modal */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isImporting && setIsImportOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0e121a] p-7 shadow-2xl text-white"
            >
              <button
                onClick={() => setIsImportOpen(false)}
                className="absolute right-5 top-5 p-2 text-ink-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-400" />
                Bulk Import Students
              </h3>
              <p className="mt-1 text-xs text-ink-400">
                Upload a CSV to enroll many athletes under {coach.name} in one go.
              </p>

              {/* Required/optional column reference — kept in sync with the actual insert logic above */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-2">
                <p className="font-bold text-white">CSV columns:</p>
                <p>
                  <span className="text-rose-400 font-bold">Required:</span>{' '}
                  <span className="font-mono text-ink-200">{CSV_REQUIRED_COLUMNS.join(', ')}</span>
                </p>
                <p>
                  <span className="text-emerald-400 font-bold">Optional:</span>{' '}
                  <span className="font-mono text-ink-200">{CSV_OPTIONAL_COLUMNS.join(', ')}</span>
                </p>
                <p className="text-ink-400">
                  <code className="font-mono">parent_phone</code> must be a 10-digit number.{' '}
                  <code className="font-mono">age</code> defaults to 10 if left blank.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="mt-1 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download sample template</span>
                </button>
              </div>

              {batches.length > 0 && (
                <div className="mt-4">
                  <label className="text-ink-300 block mb-1 text-xs">
                    Assign all imported athletes to a batch (optional)
                  </label>
                  <select
                    value={importBatchId}
                    onChange={(e) => setImportBatchId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="">No batch — just enroll under this coach</option>
                    {batches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-4">
                <label
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center text-xs transition ${
                    isImporting
                      ? 'border-white/10 text-ink-500'
                      : 'border-white/20 text-ink-300 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer'
                  }`}
                >
                  <Upload className="h-6 w-6" />
                  <span>{isImporting ? 'Importing...' : 'Click to choose a .csv file'}</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={isImporting}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportCsv(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Import results summary */}
              {importResults && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-white">
                      {importResults.success} of {importResults.total} imported successfully
                    </span>
                  </div>
                  {importResults.failures.length > 0 && (
                    <div className="space-y-1.5 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{importResults.failures.length} row(s) had issues:</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResults.failures.map((f, i) => (
                          <div key={i} className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-rose-300">
                            {f.row > 0 ? `Row ${f.row} (${f.name}): ` : ''}
                            {f.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coach Type change confirmation */}
      <AnimatePresence>
        {isConfirmingRoleChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !isUpdatingRole && setIsConfirmingRoleChange(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d111a] p-6 shadow-2xl"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                Switch {coach.name} to {coach.role === 'independent' ? 'Academy Coach' : 'Individual Coach'}?
              </h3>
              <p className="mt-1.5 text-xs text-ink-400 leading-relaxed">
                This changes their role in the live database immediately. {coach.name} will see whatever screens
                and permissions the new type grants the next time their app refreshes their profile (typically
                their next login) — this does not force-log them out right now.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsConfirmingRoleChange(false)}
                  disabled={isUpdatingRole}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-ink-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={isUpdatingRole}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {isUpdatingRole ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isUpdatingRole
                      ? 'Switching...'
                      : `Switch to ${coach.role === 'independent' ? 'Academy Coach' : 'Individual Coach'}`}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

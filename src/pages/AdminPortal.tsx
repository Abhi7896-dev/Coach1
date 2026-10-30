import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HelpCircle,
  LogOut,
  Search,
  CheckCircle2,
  RefreshCw,
  Building2,
  Phone,
  MapPin,
  AlertTriangle,
  Sparkles,
  Download,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Eye,
  Plus,
  X,
  Award,
  ShieldCheck,
  Wallet,
  Activity,
  MessageCircle,
  Send,
  ArrowUpDown,
  Hash,
  UserX,
  Bot,
  CalendarDays,
  Settings,
  ShieldAlert,
  Bell,
  UploadCloud,
  Receipt,
  ExternalLink,
  PhoneCall,
  Clock,
  LifeBuoy,
} from 'lucide-react';
import { supabase, signOutAdmin, getAdminSession, AdminUser } from '@/lib/supabase';
import { CoachProfileModal } from '@/components/admin/CoachProfileModal';
import { ParentProfileModal } from '@/components/admin/ParentProfileModal';
import { GrowthDashboard } from '@/components/admin/GrowthDashboard';
import { FeeTransactionsDashboard } from '@/components/admin/FeeTransactionsDashboard';
import { UserActivityDashboard } from '@/components/admin/UserActivityDashboard';
import { WhatsAppTemplatesDashboard } from '@/components/admin/WhatsAppTemplatesDashboard';
import { PushTemplatesDashboard } from '@/components/admin/PushTemplatesDashboard';
import { FeatureFlagsDashboard } from '@/components/admin/FeatureFlagsDashboard';
import { BroadcastDashboard } from '@/components/admin/BroadcastDashboard';
import { BulkStudentImportDashboard } from '@/components/admin/BulkStudentImportDashboard';
import { PaymentNotificationsDashboard } from '@/components/admin/PaymentNotificationsDashboard';
import { WhatsAppInboxDashboard } from '@/components/admin/WhatsAppInboxDashboard';
import { MessageLogsDashboard } from '@/components/admin/MessageLogsDashboard';
import { AccountDeletionRequestsDashboard } from '@/components/admin/AccountDeletionRequestsDashboard';
import { CommunityEventsDashboard } from '@/components/admin/CommunityEventsDashboard';
import { PlatformSettingsDashboard } from '@/components/admin/PlatformSettingsDashboard';
import { AuthRegistryDashboard } from '@/components/admin/AuthRegistryDashboard';
import { AdminAccountDashboard } from '@/components/admin/AdminAccountDashboard';

export interface CoachItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  academyName: string;
  academyId?: string;
  role: string;
  locality: string;
  pincode: string;
  experienceYears: number;
  basePrice: number;
  sportsOffered: string[];
  status: 'pending' | 'approved' | 'rejected' | 'paused';
  totalStudents: number;
  totalBatches: number;
  createdAt?: string;
  easebuzzAccountLabel?: string;
  easebuzzSubMerchantId?: string;
}

export interface AcademyItem {
  id: string;
  name: string;
  headCoachName: string;
  headCoachPhone: string;
  locality: string;
  pincode: string;
  coachesCount: number;
  batchesCount: number;
  studentsCount: number;
  sportsOffered: string[];
  coaches: CoachItem[];
}

export interface ParentItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  locality: string;
  pincode: string;
  childrenCount: number;
  childrenNames: string[];
  registeredAt?: string;
}

export interface AdmissionQueryItem {
  id: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge?: number;
  sportName: string;
  academyName: string;
  tutorId?: string;
  coachName: string;
  requestType: 'trial' | 'admission';
  status: 'new' | 'contacted' | 'enrolled' | 'closed';
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  role: 'coach' | 'parent' | 'other';
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminNotes?: string;
  createdAt: string;
}

export interface PlatformConfig {
  id: string;
  support_email: string | null;
  whatsapp_support_number: string | null;
  api_base_url: string | null;
  max_monthly_community_events: number | null;
  max_monthly_academy_events: number | null;
  default_payment_window_start_day: number | null;
  default_payment_window_end_day: number | null;
  default_report_window_day: number | null;
  max_location_changes: number | null;
  location_change_window_days: number | null;
  otp_mandatory_for_location: boolean | null;
  min_app_version_android: string | null;
  min_app_version_ios: string | null;
  updated_at: string | null;
}

export interface CommunityEventItem {
  id: string;
  tutor_id: string;
  tutor_name: string;
  academy_name: string;
  sport_name: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  is_public: boolean;
  target_batch_ids: string[] | null;
  booked_count: number;
  max_capacity: number;
  created_at: string;
}

export function AdminPortal() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'coaches'
    | 'academies'
    | 'parents'
    | 'growth'
    | 'finance'
    | 'activity'
    | 'whatsapp'
    | 'pushtemplates'
    | 'bulkimport'
    | 'paymentnotifications'
    | 'whatsappinbox'
    | 'messagelogs'
    | 'deletionrequests'
    | 'admissions'
    | 'tickets'
    | 'events'
    | 'settings'
    | 'authregistry'
  >('overview');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [academies, setAcademies] = useState<AcademyItem[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionQueryItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [financeLogs, setFinanceLogs] = useState<any[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [communityEvents, setCommunityEvents] = useState<CommunityEventItem[]>([]);

  // Lightweight counts for the Overview "Quick Access" tiles — these pages
  // manage their own full data fetch; here we only need a cheap headline
  // number, so these are simple count-only queries, not the full dataset.
  const [whatsappTemplateCount, setWhatsappTemplateCount] = useState<number | null>(null);
  const [messagesSent7dCount, setMessagesSent7dCount] = useState<number | null>(null);
  const [deletionRequestsCount, setDeletionRequestsCount] = useState<number | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [totalBatchesCount, setTotalBatchesCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [coachStatusFilter, setCoachStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paused' | 'rejected'>('all');

  // Support Desk filter/sort state
  const [ticketRoleFilter, setTicketRoleFilter] = useState<'all' | 'coach' | 'parent' | 'other'>('all');
  const [ticketSortBy, setTicketSortBy] = useState<'date' | 'type'>('date');
  const [ticketSortDir, setTicketSortDir] = useState<'asc' | 'desc'>('desc');

  // Deep Profile Modals State
  const [selectedCoach, setSelectedCoach] = useState<CoachItem | null>(null);
  const [selectedParent, setSelectedParent] = useState<ParentItem | null>(null);

  // Quick Register Parent & Athlete Modal
  const [isAddingParent, setIsAddingParent] = useState(false);
  const [regParentName, setRegParentName] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regChildName, setRegChildName] = useState('');
  const [regChildAge, setRegChildAge] = useState('10');
  const [isSavingParent, setIsSavingParent] = useState(false);

  // Sign-out confirmation
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function verifySession() {
      try {
        const session = await getAdminSession();
        if (!session) {
          navigate('/login/admin');
          return;
        }
        setAdminUser(session);
        // fetchQuickAccessStats is now only a fallback: fetchPlatformData's
        // edge-function call already returns these same stats in one round
        // trip (see the "stats" block in get_platform_directory), so the 5
        // separate count queries this used to always run are skipped
        // entirely on the normal/happy path.
        fetchPlatformData().then((edgeSucceeded) => {
          if (!edgeSucceeded) fetchQuickAccessStats();
        });
      } catch {
        navigate('/login/admin');
      }
    }
    verifySession();
  }, [navigate]);

  // Cheap headline numbers for the Overview "Quick Access" tiles. Each is
  // independent and allowed to fail on its own (e.g. the activity RPC isn't
  // set up yet) without blocking the others — falls back to null, rendered
  // as "—" rather than crashing the page.
  const fetchQuickAccessStats = async () => {
    try {
      const { count } = await supabase
        .from('whatsapp_templates')
        .select('template_name', { count: 'exact', head: true });
      setWhatsappTemplateCount(count ?? null);
    } catch (_) {
      setWhatsappTemplateCount(null);
    }

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count } = await supabase
        .from('automation_logs')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', sevenDaysAgo.toISOString());
      setMessagesSent7dCount(count ?? null);
    } catch (_) {
      setMessagesSent7dCount(null);
    }

    try {
      const { count } = await supabase
        .from('account_deletion_logs')
        .select('*', { count: 'exact', head: true });
      setDeletionRequestsCount(count ?? null);
    } catch (_) {
      setDeletionRequestsCount(null);
    }

    try {
      const { data, error } = await supabase.rpc('get_user_activity');
      if (error || !data) throw error || new Error('no data');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const active = data.filter(
        (u: any) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= cutoff
      ).length;
      setActiveUsersCount(active);
    } catch (_) {
      setActiveUsersCount(null);
    }
  };

  const fetchPlatformData = async (): Promise<boolean> => {
    setIsRefreshing(true);
    try {
      // 1. Try single-call service-role edge function if available
      let edgeData: any = null;
      try {
        const dirRes = await supabase.functions.invoke('admin-operations', {
          body: { action: 'get_platform_directory' },
        });
        if (dirRes.data && dirRes.data.success) {
          edgeData = dirRes.data;
        }
      } catch (_) {}

      // 2. Independent queries with Promise.allSettled — but only for
      // whatever get_platform_directory DIDN'T already give us. Tutors/
      // profiles/academies/students/batches/enrollments all come back from
      // that edge function on the happy path, so re-fetching them here too
      // used to double every one of those 6 queries on every single load —
      // a real, avoidable spike in concurrent connections against the pool.
      // admission_requests/support_tickets/finance_logs aren't part of that
      // edge function's response, so those three always need a direct fetch.
      const needsFallback = !edgeData;
      const fallbackEntries: [string, any][] = needsFallback
        ? [
            ['tutors', supabase.from('tutors').select('*')],
            ['profiles', supabase.from('profiles').select('*')],
            ['academies', supabase.from('academies').select('*')],
            ['students', supabase.from('students').select('*')],
            ['batches', supabase.from('batches').select('*')],
            ['enrollments', supabase.from('enrollments').select('*')],
          ]
        : [];
      const alwaysEntries: [string, any][] = [
        ['requests', supabase.from('admission_requests').select('*')],
        ['tickets', supabase.from('support_tickets').select('*')],
        // Platform-wide fee transactions — keyed by tutor_id, not student_id.
        ['finance', supabase.from('finance_logs').select('*').order('created_at', { ascending: false })],
      ];
      const allEntries = [...fallbackEntries, ...alwaysEntries];

      const settled = await Promise.allSettled(allEntries.map(([, query]) => query));
      const byKey: Record<string, any[]> = {};
      allEntries.forEach(([key], i) => {
        const result = settled[i];
        byKey[key] = result.status === 'fulfilled' ? (result as PromiseFulfilledResult<any>).value.data || [] : [];
      });

      const tutorsData = edgeData?.tutors || byKey.tutors || [];
      const profilesData = edgeData?.profiles || byKey.profiles || [];
      const academiesData = edgeData?.academies || byKey.academies || [];
      const studentsData = edgeData?.students || byKey.students || [];
      const batchesData = edgeData?.batches || byKey.batches || [];
      const enrollmentsData = edgeData?.enrollments || byKey.enrollments || [];
      const requestsData = byKey.requests || [];
      const ticketsData = byKey.tickets || [];
      const financeData = byKey.finance || [];

      // Quick Access tile counts — comes bundled in the same edge-function
      // response now, so this replaces what used to be 5 separate round
      // trips from fetchQuickAccessStats on every load. Only that function
      // runs its own queries now, and only as a fallback when this edge
      // call itself failed (edgeData is null) — see the caller.
      if (edgeData?.stats) {
        setWhatsappTemplateCount(edgeData.stats.whatsapp_template_count ?? null);
        setMessagesSent7dCount(edgeData.stats.messages_sent_7d_count ?? null);
        setDeletionRequestsCount(edgeData.stats.deletion_requests_count ?? null);
        setActiveUsersCount(edgeData.stats.active_users_30d_count ?? null);
      }
      if (edgeData?.platform_config) {
        setPlatformConfig(edgeData.platform_config);
      }
      setCommunityEvents(edgeData?.community_events || []);

      const academiesMap = new Map<string, string>();
      if (academiesData) {
        academiesData.forEach((a: any) => {
          if (a.id && a.name) academiesMap.set(a.id, a.name);
        });
      }

      const enrollmentsByTutor = new Map<string, number>();
      if (enrollmentsData) {
        enrollmentsData.forEach((e: any) => {
          const tId = e.tutor_id;
          if (tId) enrollmentsByTutor.set(tId, (enrollmentsByTutor.get(tId) || 0) + 1);
        });
      }

      const batchesByTutor = new Map<string, number>();
      if (batchesData) {
        setTotalBatchesCount(batchesData.length);
        batchesData.forEach((b: any) => {
          const tId = b.tutor_id;
          if (tId) batchesByTutor.set(tId, (batchesByTutor.get(tId) || 0) + 1);
        });
      }

      if (studentsData) {
        setTotalStudentsCount(studentsData.length);
      }

      // ─────────────────────────────────────────────────────────────
      // 1. STRICT COACHES PARSING:
      // STRICT FILTER: Exclude role === 'parent' and role === 'admin'
      // ─────────────────────────────────────────────────────────────
      const coachMap = new Map<string, CoachItem>();

      // Ingest profiles (STRICT: role !== 'parent' && role !== 'admin')
      if (profilesData) {
        profilesData.forEach((p: any) => {
          const role = (p.role || '').toLowerCase();
          if (p.id && role !== 'parent' && role !== 'admin') {
            const acadId = p.academy_id;
            const acadName = (acadId && academiesMap.get(acadId)) || p.academy_name || 'Sports Academy';
            coachMap.set(p.id, {
              id: p.id,
              name: p.full_name || p.name || 'Coach',
              email: p.email || '',
              phone: p.phone || p.phone_number || '',
              academyName: acadName,
              academyId: acadId,
              role: p.role || 'coach',
              locality: p.locality || '',
              pincode: p.pincode || '',
              experienceYears: 0,
              basePrice: 0,
              sportsOffered: [],
              status: (p.status as any) || 'approved',
              totalStudents: 0,
              totalBatches: 0,
              createdAt: p.created_at,
            });
          }
        });
      }

      // Ingest tutors (STRICT: role !== 'parent' && role !== 'admin')
      if (tutorsData) {
        tutorsData.forEach((t: any) => {
          const role = (t.role || '').toLowerCase();
          if (t.id && role !== 'parent' && role !== 'admin') {
            const id = t.id;
            const existing = coachMap.get(id);
            const acadId = t.academy_id || existing?.academyId;
            const computedAcadName =
              (acadId && academiesMap.get(acadId)) ||
              t.academy_name ||
              existing?.academyName ||
              'Sports Academy';

            coachMap.set(id, {
              id,
              name: t.name || t.full_name || existing?.name || 'Coach',
              email: t.email || existing?.email || '',
              phone: t.phone || t.phone_number || existing?.phone || '',
              academyName: computedAcadName,
              academyId: acadId,
              role: t.role || existing?.role || 'coach',
              locality: t.locality || existing?.locality || '',
              pincode: t.pincode || existing?.pincode || '',
              experienceYears: t.years_of_experience || existing?.experienceYears || 0,
              basePrice: Number(t.base_price || existing?.basePrice || 0),
              sportsOffered: Array.isArray(t.sports_offered) ? t.sports_offered : [],
              status: (t.status as any) || existing?.status || 'approved',
              totalStudents: enrollmentsByTutor.get(id) || 0,
              totalBatches: batchesByTutor.get(id) || 0,
              createdAt: t.created_at || existing?.createdAt,
              easebuzzAccountLabel: t.easebuzz_account_label || existing?.easebuzzAccountLabel || '',
              easebuzzSubMerchantId: t.easebuzz_sub_merchant_id || existing?.easebuzzSubMerchantId || '',
            });
          }
        });
      }

      const cleanCoachesList = Array.from(coachMap.values());
      setCoaches(cleanCoachesList);

      // ─────────────────────────────────────────────────────────────
      // 2. ACADEMIES PARSING:
      // Group coaches by real academy name to create Academy Directory
      // ─────────────────────────────────────────────────────────────
      const academyGroupMap = new Map<string, AcademyItem>();
      cleanCoachesList.forEach((c) => {
        const acadKey = (c.academyName || 'Sports Academy').trim();
        if (!academyGroupMap.has(acadKey)) {
          academyGroupMap.set(acadKey, {
            id: c.academyId || 'acad_' + acadKey.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: acadKey,
            headCoachName: c.name,
            headCoachPhone: c.phone,
            locality: c.locality,
            pincode: c.pincode,
            coachesCount: 1,
            batchesCount: c.totalBatches,
            studentsCount: c.totalStudents,
            sportsOffered: [...c.sportsOffered],
            coaches: [c],
          });
        } else {
          const existing = academyGroupMap.get(acadKey);
          if (existing) {
            existing.coachesCount += 1;
            existing.batchesCount += c.totalBatches;
            existing.studentsCount += c.totalStudents;
            c.sportsOffered.forEach((s) => {
              if (!existing.sportsOffered.includes(s)) existing.sportsOffered.push(s);
            });
            existing.coaches.push(c);
          }
        }
      });
      setAcademies(Array.from(academyGroupMap.values()));

      // ─────────────────────────────────────────────────────────────
      // 3. STRICT PARENTS PARSING:
      // Aggregates strictly from:
      // a) profiles WHERE role === 'parent' OR id.startsWith('parent_')
      // b) students grouped by 10-digit parent/guardian phone
      // NEVER mixes with coaches or academies!
      // ─────────────────────────────────────────────────────────────
      // Coaches/mobile app often leave the guardian name field on a student
      // record as a generic placeholder ("Parent", "Guardian", "N/A", etc.)
      // instead of the real name. Treat those as "no name" so we fall back
      // to something more useful instead of displaying the placeholder.
      const GENERIC_NAME_PLACEHOLDERS = new Set([
        '', 'parent', 'guardian', 'parent/guardian', 'guardian/parent',
        'n/a', 'na', '-', 'unknown', 'test',
      ]);
      const realName = (value: unknown): string | null => {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) return null;
        return GENERIC_NAME_PLACEHOLDERS.has(trimmed.toLowerCase()) ? null : trimmed;
      };

      const parentItemsMap = new Map<string, ParentItem>();

      // Group students by normalized 10-digit parent phone
      const studentsByPhone = new Map<string, any[]>();
      if (studentsData && studentsData.length > 0) {
        studentsData.forEach((s: any) => {
          const phoneRaw = (s.parent_phone || s.guardian_phone || '').trim();
          const clean = phoneRaw.replace(/[^0-9]/g, '');
          const p10 = clean.length > 10 ? clean.slice(-10) : clean;
          if (p10 && p10.length >= 7) {
            const list = studentsByPhone.get(p10) || [];
            list.push(s);
            studentsByPhone.set(p10, list);
          }
        });
      }

      // Process profiles where role === 'parent'
      if (profilesData) {
        profilesData.forEach((p: any) => {
          const role = (p.role || '').toLowerCase();
          const id = (p.id || '').toString();
          if (role === 'parent' || id.startsWith('parent_')) {
            const phoneRaw = (p.phone || p.phone_number || '').trim();
            const clean = phoneRaw.replace(/[^0-9]/g, '');
            const p10 = clean.length > 10 ? clean.slice(-10) : clean;
            if (p10) {
              const matchedStudents = studentsByPhone.get(p10) || [];
              const childrenNames = matchedStudents.map((s: any) => s.name || 'Athlete');
              const childName = realName(matchedStudents[0]?.name);
              const fallbackName = childName ? 'Parent of ' + childName : 'Parent · ' + p10;
              parentItemsMap.set(p10, {
                id: p.id || 'parent_' + p10,
                name:
                  realName(p.full_name) ||
                  realName(p.name) ||
                  realName(matchedStudents[0]?.guardian_name) ||
                  fallbackName,
                phone: p10,
                email: p.email,
                locality: p.locality || '',
                pincode: p.pincode || '',
                childrenCount: matchedStudents.length,
                childrenNames,
                registeredAt: p.created_at,
              });
            }
          }
        });
      }

      // Include parents from students table who don't have a registered profile record yet
      studentsByPhone.forEach((matchedStudents, p10) => {
        if (!parentItemsMap.has(p10)) {
          const first = matchedStudents[0];
          const guardianName =
            realName(first.guardian_name) || 'Parent of ' + (realName(first.name) || 'Athlete');
          const childrenNames = matchedStudents.map((s: any) => s.name || 'Athlete');
          parentItemsMap.set(p10, {
            id: first.id || 'parent_' + p10,
            name: guardianName,
            phone: p10,
            locality: first.locality || '',
            pincode: first.pincode || '',
            childrenCount: matchedStudents.length,
            childrenNames,
            registeredAt: first.created_at,
          });
        }
      });

      setParents(Array.from(parentItemsMap.values()));

      // ─────────────────────────────────────────────────────────────
      // 4. ADMISSION REQUESTS & FREE TRIALS
      // ─────────────────────────────────────────────────────────────
      if (requestsData) {
        setAdmissions(
          requestsData.map((q: any) => {
            // `admission_requests` has no academy_name/academy_id column — the
            // only link to a coach/academy is `tutor_id`. Resolve the real
            // academy + coach name via the coach directory built above,
            // instead of reading a field that doesn't exist on this table.
            const linkedCoach = q.tutor_id ? coachMap.get(q.tutor_id) : undefined;
            return {
              id: q.id,
              parentName: q.parent_name || 'Parent',
              parentPhone: q.parent_phone || '',
              childName: q.child_name || 'Athlete',
              childAge: q.child_age,
              sportName: q.sport_name || 'General',
              academyName: linkedCoach?.academyName || 'Unassigned',
              tutorId: q.tutor_id,
              coachName: linkedCoach?.name || 'Unassigned Coach',
              requestType: (q.request_type || 'trial').toLowerCase().includes('trial') ? 'trial' : 'admission',
              status: q.status || 'new',
              createdAt: q.created_at,
            };
          })
        );
      }

      // ─────────────────────────────────────────────────────────────
      // 5. SUPPORT TICKETS
      // ─────────────────────────────────────────────────────────────
      if (ticketsData) {
        setTickets(
          ticketsData.map((t: any) => ({
            id: t.id,
            userName: t.user_name || 'User',
            userPhone: t.user_phone || '',
            userEmail: t.user_email,
            // support_tickets has no `role` column — the real one is
            // `user_role`. Reading the wrong field silently mislabeled
            // every ticket as "coach", parent tickets included.
            role: (t.user_role || 'other').toLowerCase(),
            category: t.category || 'General',
            subject: t.subject || 'Support Query',
            message: t.message || '',
            status: t.status || 'open',
            adminNotes: t.admin_notes,
            createdAt: t.created_at,
          }))
        );
      }

      // ─────────────────────────────────────────────────────────────
      // 6. FEE TRANSACTIONS (platform-wide, keyed by tutor_id)
      // ─────────────────────────────────────────────────────────────
      setFinanceLogs(financeData || []);

      return !!edgeData;
    } catch (err: any) {
      console.error('Error fetching platform admin data:', err);
      showNotice('error', 'Notice: ' + (err?.message || 'Check database permissions'));
      return false;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleUpdateCoachStatus = async (
    coachId: string,
    newStatus: 'approved' | 'rejected' | 'paused'
  ) => {
    try {
      await Promise.allSettled([
        supabase.from('tutors').update({ status: newStatus }).eq('id', coachId),
        supabase.from('profiles').update({ status: newStatus }).eq('id', coachId),
      ]);

      setCoaches((prev) =>
        prev.map((c) => (c.id === coachId ? { ...c, status: newStatus } : c))
      );
      if (selectedCoach && selectedCoach.id === coachId) {
        setSelectedCoach({ ...selectedCoach, status: newStatus });
      }

      showNotice('success', 'Coach status updated to "' + newStatus.toUpperCase() + '".');
    } catch (err: any) {
      showNotice('error', 'Failed to update status: ' + (err?.message || 'Error'));
    }
  };

  const handleUpdateCoachEasebuzz = async (
    coachId: string,
    accountLabel: string,
    subMerchantId: string
  ) => {
    const res = await supabase.functions.invoke('admin-operations', {
      body: {
        action: 'update_coach_split',
        coach_id: coachId,
        account_label: accountLabel,
        sub_merchant_id: subMerchantId,
      },
    });

    if (res.error || !res.data?.success) {
      const message = res.data?.error || res.error?.message || 'Failed to save Easebuzz settlement details';
      showNotice('error', message);
      throw new Error(message);
    }

    setCoaches((prev) =>
      prev.map((c) =>
        c.id === coachId
          ? { ...c, easebuzzAccountLabel: accountLabel, easebuzzSubMerchantId: subMerchantId }
          : c
      )
    );
    if (selectedCoach && selectedCoach.id === coachId) {
      setSelectedCoach({ ...selectedCoach, easebuzzAccountLabel: accountLabel, easebuzzSubMerchantId: subMerchantId });
    }

    showNotice('success', 'Easebuzz settlement details saved for this coach.');
  };

  const handleUpdateCoachRole = async (coachId: string, newRole: string) => {
    const res = await supabase.functions.invoke('admin-operations', {
      body: {
        action: 'update_coach_profile',
        coach_id: coachId,
        role: newRole,
      },
    });

    if (res.error || !res.data?.success) {
      const message = res.data?.error || res.error?.message || 'Failed to update coach role';
      showNotice('error', message);
      throw new Error(message);
    }

    setCoaches((prev) => prev.map((c) => (c.id === coachId ? { ...c, role: newRole } : c)));
    if (selectedCoach && selectedCoach.id === coachId) {
      setSelectedCoach({ ...selectedCoach, role: newRole });
    }

    showNotice('success', `Coach role updated to "${newRole === 'independent' ? 'Individual Coach' : 'Academy Coach'}".`);
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'in_progress' | 'resolved') => {
    try {
      await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      showNotice('success', 'Ticket status updated to "' + newStatus + '".');
    } catch (err: any) {
      showNotice('error', 'Failed to update ticket: ' + (err?.message || 'Error'));
    }
  };

  const handleCreateParentAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regParentPhone.trim() || !regChildName.trim()) return;

    setIsSavingParent(true);
    try {
      const clean = regParentPhone.replace(/[^0-9]/g, '');
      const p10 = clean.length > 10 ? clean.slice(-10) : clean;
      const years = parseInt(regChildAge) || 10;
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - years);

      // `students` only has: name, dob, guardian_name, parent_phone, tags.
      // (No age/gender/guardian_phone/locality/status columns exist on this
      // table — this insert used to fail outright with a "column does not
      // exist" error every time this form was submitted.)
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: regChildName.trim(),
          dob: dob.toISOString().slice(0, 10),
          guardian_name: regParentName.trim() || ('Parent of ' + regChildName),
          parent_phone: p10,
        })
        .select()
        .single();

      if (error) {
        showNotice('error', 'Error adding student: ' + error.message);
      } else {
        showNotice('success', 'Student enrolled into database successfully!');
        setIsAddingParent(false);
        setRegParentName('');
        setRegParentPhone('');
        setRegChildName('');
        fetchPlatformData();
      }
    } catch (err: any) {
      showNotice('error', 'Error: ' + err.message);
    } finally {
      setIsSavingParent(false);
    }
  };

  const handleExportCoaches = () => {
    if (coaches.length === 0) {
      showNotice('error', 'No coach records available to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Academy', 'Role', 'Status', 'Phone', 'Email', 'Locality', 'Pincode', 'Students', 'Batches'];
    const rows = coaches.map((c) => [
      c.id,
      '"' + c.name + '"',
      '"' + c.academyName + '"',
      c.role,
      c.status,
      c.phone,
      c.email,
      '"' + c.locality + '"',
      c.pincode,
      c.totalStudents,
      c.totalBatches,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TruCoach_Coaches_Export_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('success', 'Coach directory exported as CSV.');
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOutAdmin();
    } finally {
      navigate('/login/admin');
    }
  };

  const kpis = useMemo(() => {
    const totalCoaches = coaches.length;
    const activeCoaches = coaches.filter((c) => c.status === 'approved').length;
    const pendingCoaches = coaches.filter((c) => c.status === 'pending').length;
    const pausedCoaches = coaches.filter((c) => c.status === 'paused').length;
    const openTickets = tickets.filter((t) => t.status === 'open').length;

    return {
      totalCoaches,
      activeCoaches,
      pendingCoaches,
      pausedCoaches,
      totalAcademies: academies.length,
      totalStudents: totalStudentsCount || parents.reduce((a, b) => a + b.childrenCount, 0),
      totalBatches: totalBatchesCount,
      openTickets,
    };
  }, [coaches, academies, totalStudentsCount, totalBatchesCount, parents, tickets]);

  const filteredCoaches = useMemo(() => {
    return coaches.filter((c) => {
      const matchFilter = coachStatusFilter === 'all' || c.status === coachStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.academyName.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.sportsOffered.some((s) => s.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [coaches, coachStatusFilter, searchQuery]);

  const filteredAcademies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return academies;
    return academies.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.headCoachName.toLowerCase().includes(q) ||
        a.locality.toLowerCase().includes(q) ||
        a.sportsOffered.some((s) => s.toLowerCase().includes(q))
    );
  }, [academies, searchQuery]);

  const filteredParents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return parents;
    return parents.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.childrenNames.some((c) => c.toLowerCase().includes(q))
    );
  }, [parents, searchQuery]);

  const filteredSortedTickets = useMemo(() => {
    const filtered =
      ticketRoleFilter === 'all' ? tickets : tickets.filter((t) => t.role === ticketRoleFilter);

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (ticketSortBy === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        cmp = a.category.localeCompare(b.category);
      }
      return ticketSortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [tickets, ticketRoleFilter, ticketSortBy, ticketSortDir]);

  return (
    <div className="min-h-screen bg-[#090c13] font-sans text-white selection:bg-orange-500/30">
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={'fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl backdrop-blur-xl border ' +
              (actionNotice.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/30')}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-xs font-semibold">{actionNotice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090c13]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="TruCoach Logo" className="h-9 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold leading-none tracking-tight">
                  <span className="text-blue-500">Tru</span>
                  <span className="text-orange-500">Coach</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                  Admin Console
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-400">
              <Sparkles className="h-3 w-3" />
              Live DB
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchPlatformData().then((edgeSucceeded) => {
                  if (!edgeSucceeded) fetchQuickAccessStats();
                });
              }}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-ink-200 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              <RefreshCw className={'h-3.5 w-3.5 ' + (isRefreshing ? 'animate-spin text-orange-400' : '')} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <div className="hidden md:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.05] to-white/[0.02] px-3.5 py-1.5 shadow-inner backdrop-blur">
              <div className={'grid h-8 w-8 place-items-center rounded-xl font-display text-xs font-bold text-white shadow-md ' + (adminUser?.isSuperAdmin ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 ring-2 ring-amber-400/40' : 'bg-gradient-to-br from-blue-500 to-indigo-600')}>
                {adminUser?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold leading-none text-white">{adminUser?.fullName}</p>
                  {adminUser?.isSuperAdmin && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500/25 to-orange-500/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/40 shadow-sm">
                      👑 Super Admin
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-ink-400">{adminUser?.email || adminUser?.phone}</p>
              </div>
            </div>

            <button
              onClick={() => setIsConfirmingLogout(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/20 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Top Tab Bar — grouped into logical clusters with an elite glass pill dock styling */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <nav className="scrollbar-none flex items-center gap-1.5 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              {
                label: 'Overview',
                tabs: [
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'coaches', label: 'Coaches (' + coaches.length + ')', icon: GraduationCap, badge: kpis.pendingCoaches },
                  { id: 'academies', label: 'Academies (' + academies.length + ')', icon: Building2, count: academies.length },
                  { id: 'parents', label: 'Parents & Athletes (' + parents.length + ')', icon: Users, count: parents.length },
                  { id: 'growth', label: 'New Registrations', icon: TrendingUp },
                  { id: 'finance', label: 'Fee Transactions', icon: Wallet },
                  { id: 'activity', label: 'Active & Passive Users', icon: Activity },
                ],
              },
              {
                label: 'Messaging',
                tabs: [
                  { id: 'whatsapp', label: 'WhatsApp Templates', icon: MessageCircle },
                  { id: 'pushtemplates', label: 'Push Templates', icon: Bell },
                  { id: 'whatsappinbox', label: 'WhatsApp Inbox', icon: MessageCircle },
                  { id: 'messagelogs', label: 'Message Logs', icon: Send },
                  { id: 'paymentnotifications', label: 'Payment Notifications', icon: Receipt },
                  { id: 'bulkimport', label: 'Bulk Import Students', icon: UploadCloud },
                ],
              },
              {
                label: 'Operations',
                tabs: [
                  { id: 'admissions', label: 'Admissions & Trials (' + admissions.length + ')', icon: MessageSquare, count: admissions.length },
                  { id: 'tickets', label: 'Support Desk (' + tickets.length + ')', icon: HelpCircle, badge: kpis.openTickets },
                  { id: 'events', label: 'Community Events (' + communityEvents.length + ')', icon: CalendarDays, count: communityEvents.length },
                  { id: 'deletionrequests', label: 'Account Deletion Requests', icon: UserX },
                ],
              },
              {
                label: 'Platform',
                tabs: [
                  { id: 'settings', label: 'Platform Settings', icon: Settings },
                  { id: 'authregistry', label: 'Auth Registry', icon: ShieldAlert },
                ],
              },
            ].map((group, gi) => (
              <React.Fragment key={group.label}>
                {gi > 0 && <span className="mx-1.5 h-6 w-px shrink-0 bg-white/[0.08]" />}
                {group.tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setSearchQuery('');
                      }}
                      className={
                        'group relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ' +
                        (isActive
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-1 ring-white/20 -translate-y-0.5'
                          : 'border border-white/5 bg-white/[0.03] text-ink-300 hover:border-white/10 hover:bg-white/[0.07] hover:text-white')
                      }
                    >
                      <tab.icon className={'h-3.5 w-3.5 transition-transform duration-200 ' + (isActive ? '' : 'group-hover:scale-110')} />
                      <span>{tab.label}</span>
                      {tab.badge ? (
                        <span
                          className={
                            'rounded-full px-1.5 py-0.5 text-[10px] font-bold ' +
                            (isActive ? 'bg-white/25 text-white' : 'bg-orange-500 text-white')
                          }
                        >
                          {tab.badge}
                        </span>
                      ) : tab.count !== undefined && tab.count > 0 ? (
                        <span
                          className={
                            'rounded-full px-1.5 py-0.5 text-[10px] font-medium ' +
                            (isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-ink-300')
                          }
                        >
                          {tab.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#090c13] to-transparent sm:left-8" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#090c13] to-transparent sm:right-8" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-400 shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {adminUser?.isSuperAdmin ? 'Super Admin Command Console' : 'Platform Operations'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Systems Operational
                    </span>
                  </div>
                  <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    TruCoach Command Center
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-xs text-ink-300 sm:text-sm leading-relaxed">
                    Comprehensive real-time command across verified sports academies, coaches, athlete rosters, fee ledgers, and community discovery.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center backdrop-blur shadow-inner min-w-[125px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total Roster</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-white">{kpis.totalStudents}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">Active Athletes</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center backdrop-blur shadow-inner min-w-[125px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total Coaches</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-white">{kpis.totalCoaches}</p>
                    <p className="text-[10px] text-orange-400 font-semibold">{academies.length} Academies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div
                onClick={() => setActiveTab('coaches')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-950/20"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-orange-500/20" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-orange-300 transition-colors">Total Coaches</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500/15 text-orange-400 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-orange-500/25">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{kpis.totalCoaches}</span>
                  <span className="text-xs text-ink-400 font-medium">Registered</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-300 border-t border-white/5 pt-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  <span><strong className="text-white">{kpis.activeCoaches}</strong> Active · <strong className="text-amber-400">{kpis.pendingCoaches}</strong> Pending</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('academies')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/20"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-blue-500/20" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-blue-300 transition-colors">Sports Academies</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-400 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/25">
                    <Building2 className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{academies.length}</span>
                  <span className="text-xs text-ink-400 font-medium">Organizations</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-300 border-t border-white/5 pt-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50"></span>
                  <span>Multi-coach verified hubs</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('parents')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-emerald-500/20" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-emerald-300 transition-colors">Athletes &amp; Parents</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-emerald-500/25">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{kpis.totalStudents}</span>
                  <span className="text-xs text-ink-400 font-medium">Athletes</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-300 border-t border-white/5 pt-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  <span><strong className="text-white">{parents.length}</strong> Guardians connected</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('admissions')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-950/20"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-amber-500/20" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-amber-300 transition-colors">Inquiries &amp; Trials</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-amber-500/25">
                    <HelpCircle className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{admissions.length}</span>
                  <span className="text-xs text-ink-400 font-medium">Queries</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-300 border-t border-white/5 pt-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                  <span><strong className="text-white">{tickets.length}</strong> Support Tickets</span>
                </div>
              </div>
            </div>

            {/* Quick Access — every other section in the console, one click away */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-ink-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Direct Operations &amp; Intelligence
                </h3>
                <span className="text-[11px] text-ink-500 font-medium">Instant Navigation</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab('growth')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:bg-purple-500/[0.03] hover:shadow-xl hover:shadow-purple-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-purple-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-purple-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-purple-300 transition-colors">New Registrations</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/15 text-purple-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">{parents.length}</span>
                    <span className="text-xs text-ink-400 font-medium">Total Parents</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50"></span>
                    <span>Growth trend &amp; sign-ups over time</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('finance')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/50 hover:bg-teal-500/[0.03] hover:shadow-xl hover:shadow-teal-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-teal-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-teal-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-teal-300 transition-colors">Fee Transactions</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-500/15 text-teal-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <Wallet className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">{financeLogs.length}</span>
                    <span className="text-xs text-ink-400 font-medium">Ledger Records</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50"></span>
                    <span>Cashflow &amp; payment method split</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('activity')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:bg-cyan-500/[0.03] hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-cyan-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-cyan-300 transition-colors">User Engagement</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <Activity className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">
                      {activeUsersCount !== null ? activeUsersCount : '—'}
                    </span>
                    <span className="text-xs text-ink-400 font-medium">Active (30d)</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
                    <span>{activeUsersCount !== null ? 'Signed in within past 30 days' : 'Real-time telemetry'}</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('tickets')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:bg-sky-500/[0.03] hover:shadow-xl hover:shadow-sky-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-sky-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-sky-300 transition-colors">Support Desk</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 text-sky-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <HelpCircle className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">{tickets.length}</span>
                    <span className="text-xs text-ink-400 font-medium">Tickets</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"></span>
                    <span><strong className="text-white">{kpis.openTickets}</strong> Open · Sort &amp; filter by role</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('whatsapp')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] hover:shadow-xl hover:shadow-emerald-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-emerald-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-emerald-300 transition-colors">WhatsApp Templates</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">
                      {whatsappTemplateCount !== null ? whatsappTemplateCount : '—'}
                    </span>
                    <span className="text-xs text-ink-400 font-medium">Registered</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                    <span>Templates, variables &amp; demo previews</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('messagelogs')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-indigo-500/[0.03] hover:shadow-xl hover:shadow-indigo-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-indigo-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-indigo-300 transition-colors">Message Logs</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <Send className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">
                      {messagesSent7dCount !== null ? messagesSent7dCount : '—'}
                    </span>
                    <span className="text-xs text-ink-400 font-medium">Sent (7d)</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50"></span>
                    <span>Delivery history by recipient &amp; type</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('deletionrequests')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/50 hover:bg-rose-500/[0.03] hover:shadow-xl hover:shadow-rose-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-rose-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-rose-300 transition-colors">Deletion Requests</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/15 text-rose-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <UserX className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">
                      {deletionRequestsCount !== null ? deletionRequestsCount : '—'}
                    </span>
                    <span className="text-xs text-ink-400 font-medium">Total Requests</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50"></span>
                    <span>Review queue &amp; enrollment history</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('events')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/[0.03] hover:shadow-xl hover:shadow-fuchsia-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-fuchsia-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-fuchsia-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-fuchsia-300 transition-colors">Community Events</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-white tracking-tight">{communityEvents.length}</span>
                    <span className="text-xs text-ink-400 font-medium">Total Events</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400 shadow-sm shadow-fuchsia-400/50"></span>
                    <span>Public &amp; private, moderate or remove</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('authregistry')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-amber-500/[0.03] hover:shadow-xl hover:shadow-amber-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-amber-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-amber-300 transition-colors">Auth Registry</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <ShieldAlert className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-extrabold text-white tracking-tight">Audit Accounts</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                    <span>Identify orphaned auth accounts</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('settings')}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:bg-sky-500/[0.03] hover:shadow-xl hover:shadow-sky-950/20"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-500/10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:bg-sky-500/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 group-hover:text-sky-300 transition-colors">Platform Settings</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 text-sky-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <Settings className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-extrabold text-white tracking-tight">
                      {platformConfig ? 'Configured' : 'Live Config'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 border-t border-white/5 pt-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"></span>
                    <span>Quotas, support contact &amp; rules</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Rows */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-white">Registered Coaches</h3>
                  <button
                    onClick={() => setActiveTab('coaches')}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300"
                  >
                    View All ({coaches.length}) &rarr;
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  Real coaches in live database. Click any row to view full operational profile.
                </p>

                <div className="mt-5 space-y-3">
                  {coaches.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCoach(c)}
                      className="cursor-pointer flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/10 text-xs font-bold text-orange-400">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{c.name}</span>
                            <Eye className="h-3 w-3 text-ink-400" />
                          </p>
                          <p className="text-[11px] text-ink-400">{c.academyName} · {c.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                          {c.status}
                        </span>
                        <button
                          onClick={() => setSelectedCoach(c)}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-ink-300 hover:bg-white/10"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-white">Registered Sports Academies</h3>
                  <button
                    onClick={() => setActiveTab('academies')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    View All ({academies.length}) &rarr;
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  Organizations managing training batches and student rosters.
                </p>

                <div className="mt-5 space-y-3">
                  {academies.length === 0 ? (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-ink-400">
                      No academies registered yet.
                    </div>
                  ) : (
                    academies.slice(0, 5).map((a) => (
                      <div
                        key={a.name}
                        onClick={() => {
                          setActiveTab('academies');
                          setSearchQuery(a.name);
                        }}
                        className="cursor-pointer flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{a.name}</p>
                            <p className="text-[11px] text-ink-400">Lead: {a.headCoachName} · {a.coachesCount} Coach(es)</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                          {a.batchesCount} Batches
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COACHES DIRECTORY */}
        {activeTab === 'coaches' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Coaches Directory ({coaches.length})
                </h2>
                <p className="mt-1 text-sm text-ink-400">
                  Real coaches loaded live from Supabase. Click any card to open complete operational profile.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCoaches}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.1]"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All', count: coaches.length },
                  { id: 'pending', label: 'Pending', count: kpis.pendingCoaches },
                  { id: 'approved', label: 'Approved', count: kpis.activeCoaches },
                  { id: 'paused', label: 'Paused', count: kpis.pausedCoaches },
                  { id: 'rejected', label: 'Rejected', count: coaches.filter((c) => c.status === 'rejected').length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCoachStatusFilter(f.id as any)}
                    className={'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ' +
                      (coachStatusFilter === f.id
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]')}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search coach, academy, sport, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-ink-400 outline-none focus:border-orange-500/60"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                <p className="mt-3 text-xs text-ink-400">Loading coach directory from Supabase...</p>
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-ink-500" />
                <p className="mt-4 text-sm font-bold text-white">No coaches match current filter</p>
                <p className="mt-1 text-xs text-ink-400">Try adjusting your status filter or search keywords.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCoaches.map((coach) => {
                  const cleanPhone = (coach.phone || '').replace(/\D/g, '');
                  const waUrl = cleanPhone ? 'https://wa.me/91' + cleanPhone : null;

                  return (
                    <div
                      key={coach.id}
                      onClick={() => setSelectedCoach(coach)}
                      className="cursor-pointer group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] via-white/[0.015] to-transparent p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-500/40 hover:bg-orange-500/[0.02] hover:shadow-2xl hover:shadow-orange-950/20"
                    >
                      {/* Top status accent line */}
                      <div
                        className={
                          'absolute top-0 left-0 right-0 h-1 ' +
                          (coach.status === 'approved'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : coach.status === 'pending'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : coach.status === 'paused'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : 'bg-rose-500')
                        }
                      />

                      <div>
                        {/* Status + View Profile Link */}
                        <div className="flex items-center justify-between">
                          <span
                            className={
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ' +
                              (coach.status === 'approved'
                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                : coach.status === 'pending'
                                ? 'border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/20'
                                : coach.status === 'paused'
                                ? 'border-blue-500/30 bg-blue-500/15 text-blue-300'
                                : 'border-rose-500/30 bg-rose-500/15 text-rose-300')
                            }
                          >
                            {coach.status === 'pending' && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                              </span>
                            )}
                            {coach.status === 'approved' && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            )}
                            <span>{coach.status}</span>
                          </span>

                          <span className="text-[11px] text-ink-400 font-semibold group-hover:text-orange-400 flex items-center gap-1 transition">
                            <span>Deep Profile</span>
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </div>

                        {/* Coach Identity & Academy */}
                        <div className="mt-4 flex items-start gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-base font-extrabold text-orange-400 ring-1 ring-orange-500/30 shadow-md">
                            {coach.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-bold text-white group-hover:text-orange-300 transition truncate">
                              {coach.name}
                            </h3>
                            <p className="text-xs font-semibold text-orange-400/90 flex items-center gap-1.5 mt-0.5 truncate">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{coach.academyName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Sports Offered Tags */}
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {coach.sportsOffered.length > 0 ? (
                            coach.sportsOffered.map((sport) => (
                              <span
                                key={sport}
                                className="rounded-lg border border-white/5 bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-bold text-ink-300"
                              >
                                {sport}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-lg bg-white/[0.03] px-2 py-0.5 text-[10px] text-ink-500">General Athletics</span>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3.5">
                          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">Enrolled</span>
                            <span className="font-display text-xl font-extrabold text-white">{coach.totalStudents}</span>
                            <span className="text-[10px] text-ink-500 block">Athletes</span>
                          </div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">Batches</span>
                            <span className="font-display text-xl font-extrabold text-white">{coach.totalBatches}</span>
                            <span className="text-[10px] text-ink-500 block">Active Schedules</span>
                          </div>
                        </div>

                        {/* Contact & Location Strip */}
                        <div className="mt-3.5 space-y-1.5 text-xs text-ink-300 border-t border-white/5 pt-3">
                          {coach.phone && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-mono text-ink-300">
                                <Phone className="h-3.5 w-3.5 text-ink-400" />
                                <span>{coach.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={'tel:' + coach.phone}
                                  className="text-[11px] font-bold text-ink-400 hover:text-white transition"
                                >
                                  Call
                                </a>
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
                                  >
                                    WA
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {coach.locality && (
                            <div className="flex items-center gap-1.5 text-ink-400">
                              <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                              <span className="truncate">{coach.locality}{coach.pincode ? ' (' + coach.pincode + ')' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedCoach(coach)}
                          className="text-xs font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1"
                        >
                          <span>Full Profile</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          {coach.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateCoachStatus(coach.id, 'approved')}
                              className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {coach.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateCoachStatus(coach.id, 'paused')}
                              className="rounded-xl border border-amber-500/30 bg-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-sm"
                            >
                              Pause
                            </button>
                          )}
                          {coach.status === 'paused' && (
                            <button
                              onClick={() => handleUpdateCoachStatus(coach.id, 'approved')}
                              className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition shadow-sm"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateCoachStatus(coach.id, 'rejected')}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-ink-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACADEMIES DIRECTORY */}
        {activeTab === 'academies' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Sports Academies Directory ({academies.length})
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Registered sports academies and coaching organizations operating on TruCoach platform.
              </p>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search academy by name, lead coach, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-ink-400 outline-none focus:border-blue-500/60"
              />
            </div>

            {filteredAcademies.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
                <Building2 className="mx-auto h-12 w-12 text-ink-500" />
                <p className="mt-4 text-sm font-bold text-white">No academies match search</p>
                <p className="mt-1 text-xs text-ink-400">Try changing your search terms.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAcademies.map((academy) => {
                  const cleanPhone = (academy.headCoachPhone || '').replace(/\D/g, '');
                  const waUrl = cleanPhone ? 'https://wa.me/91' + cleanPhone : null;

                  return (
                    <div
                      key={academy.name}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] via-white/[0.015] to-transparent p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:bg-blue-500/[0.02] hover:shadow-2xl hover:shadow-blue-950/20"
                    >
                      {/* Top status accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

                      <div>
                        {/* Header Badge Row */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>Sports Academy</span>
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-bold text-ink-300">
                            {academy.coachesCount} Coach{academy.coachesCount > 1 ? 'es' : ''}
                          </span>
                        </div>

                        {/* Title & Lead Coach */}
                        <div className="mt-4">
                          <h3 className="font-display text-lg font-bold text-white group-hover:text-blue-300 transition">
                            {academy.name}
                          </h3>
                          <div className="mt-1 flex items-center justify-between text-xs text-ink-300">
                            <p>
                              Lead: <strong className="text-white">{academy.headCoachName}</strong>
                            </p>
                            {academy.headCoachPhone && (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-400">
                                <a href={'tel:' + academy.headCoachPhone} className="hover:text-white transition">
                                  {academy.headCoachPhone}
                                </a>
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
                                  >
                                    WA
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sports Tags */}
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {academy.sportsOffered.length > 0 ? (
                            academy.sportsOffered.map((sport) => (
                              <span
                                key={sport}
                                className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300"
                              >
                                {sport}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-lg bg-white/[0.03] px-2 py-0.5 text-[10px] text-ink-500">Multi-Sport Coaching</span>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3.5">
                          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">Batches</span>
                            <span className="font-display text-xl font-extrabold text-white">{academy.batchesCount}</span>
                            <span className="text-[10px] text-ink-500 block">Active Schedules</span>
                          </div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">Students</span>
                            <span className="font-display text-xl font-extrabold text-white">{academy.studentsCount}</span>
                            <span className="text-[10px] text-ink-500 block">Enrolled Athletes</span>
                          </div>
                        </div>

                        {academy.locality && (
                          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-ink-400 border-t border-white/5 pt-3">
                            <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                            <span>{academy.locality}{academy.pincode ? ' (' + academy.pincode + ')' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Coaches Roster */}
                      <div className="mt-5 border-t border-white/5 pt-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-400 mb-2">
                          Coaches Roster ({academy.coaches.length}):
                        </p>
                        <div className="space-y-1.5">
                          {academy.coaches.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCoach(c)}
                              className="cursor-pointer flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs transition-all hover:border-orange-500/30 hover:bg-white/[0.06]"
                            >
                              <div className="flex items-center gap-2">
                                <div className="grid h-6 w-6 place-items-center rounded-lg bg-orange-500/15 text-[10px] font-bold text-orange-400">
                                  {c.name.charAt(0)}
                                </div>
                                <span className="text-white font-medium">{c.name}</span>
                              </div>
                              <span className="text-orange-400 font-bold flex items-center gap-1 text-[11px]">
                                <span>Profile</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PARENTS & ATHLETES */}
        {activeTab === 'parents' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Parents &amp; Linked Athletes ({parents.length})
                </h2>
                <p className="mt-1 text-sm text-ink-400">
                  Guardians and athletes registered in the database. Tap any card to open complete family profile.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddingParent(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md shadow-blue-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enroll Student</span>
                </button>
              </div>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search guardian, athlete, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-ink-400 outline-none focus:border-blue-500/60"
              />
            </div>

            {filteredParents.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
                <Users className="mx-auto h-12 w-12 text-ink-500" />
                <p className="mt-4 text-sm font-bold text-white">No parents or athletes found in database</p>
                <p className="mt-1 text-xs text-ink-400">Click &quot;Enroll Student&quot; above to register a real athlete record.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredParents.map((parent) => {
                  const cleanPhone = (parent.phone || '').replace(/\D/g, '');
                  const waUrl = cleanPhone ? 'https://wa.me/91' + cleanPhone : null;

                  return (
                    <div
                      key={parent.phone}
                      onClick={() => setSelectedParent(parent)}
                      className="cursor-pointer group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] via-white/[0.015] to-transparent p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-2xl hover:shadow-emerald-950/20"
                    >
                      {/* Top status accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                      <div>
                        {/* Parent Identity & Children Count */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-base font-extrabold text-emerald-400 ring-1 ring-emerald-500/30 shadow-md">
                              {parent.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-display text-base font-bold text-white group-hover:text-emerald-300 transition">
                                {parent.name}
                              </h3>
                              <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5 font-mono">
                                <Phone className="h-3 w-3" />
                                <span>{parent.phone}</span>
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-300">
                            {parent.childrenCount} {parent.childrenCount === 1 ? 'Child' : 'Children'}
                          </span>
                        </div>

                        {/* Athletes Roster Chips */}
                        <div className="mt-4 border-t border-white/5 pt-3.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-400 block mb-2">
                            Linked Athletes:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {parent.childrenNames.length > 0 ? (
                              parent.childrenNames.map((cName) => (
                                <span
                                  key={cName}
                                  className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 hover:border-emerald-500/30 transition"
                                >
                                  <span className="text-emerald-400">🏅</span>
                                  <span>{cName}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-ink-500">No athletes linked</span>
                            )}
                          </div>
                        </div>

                        {parent.locality && (
                          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-ink-400 border-t border-white/5 pt-3">
                            <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                            <span>{parent.locality}{parent.pincode ? ' (' + parent.pincode + ')' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedParent(parent)}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                        >
                          <span>Family Profile</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-center gap-2">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition"
                            >
                              WhatsApp
                            </a>
                          )}
                          <a
                            href={'tel:' + parent.phone}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-ink-300 hover:bg-white/[0.08] hover:text-white transition"
                          >
                            Call
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: NEW REGISTRATIONS / GROWTH */}
        {activeTab === 'growth' && <GrowthDashboard parents={parents} />}

        {/* TAB: FEE TRANSACTIONS */}
        {activeTab === 'finance' && (
          <FeeTransactionsDashboard financeLogs={financeLogs} coaches={coaches} />
        )}

        {/* TAB: ACTIVE & PASSIVE USERS */}
        {activeTab === 'activity' && <UserActivityDashboard coaches={coaches} parents={parents} />}

        {/* TAB: WHATSAPP TEMPLATES */}
        {activeTab === 'whatsapp' && <WhatsAppTemplatesDashboard />}

        {activeTab === 'pushtemplates' && <PushTemplatesDashboard />}

        {activeTab === 'bulkimport' && <BulkStudentImportDashboard coaches={coaches} />}

        {activeTab === 'paymentnotifications' && (
          <PaymentNotificationsDashboard coaches={coaches} isSuperAdmin={!!adminUser?.isSuperAdmin} />
        )}

        {activeTab === 'whatsappinbox' && <WhatsAppInboxDashboard isSuperAdmin={!!adminUser?.isSuperAdmin} />}

        {/* TAB: MESSAGE LOGS */}
        {activeTab === 'messagelogs' && <MessageLogsDashboard coaches={coaches} parents={parents} />}

        {/* TAB: ACCOUNT DELETION REQUESTS */}
        {activeTab === 'deletionrequests' && <AccountDeletionRequestsDashboard />}

        {/* TAB 5: ADMISSIONS & TRIALS */}
        {activeTab === 'admissions' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Academy Inquiries &amp; Free Trials ({admissions.length})
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Prospect requests submitted from the mobile app and website portal.
              </p>
            </div>

            {admissions.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-ink-500" />
                <p className="mt-4 text-sm font-bold text-white">No trial inquiries yet in database</p>
                <p className="mt-1 text-xs text-ink-400">When visitors book trials through the app or website, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                    <tr>
                      <th className="px-6 py-4">Parent / Contact</th>
                      <th className="px-6 py-4">Athlete</th>
                      <th className="px-6 py-4">Sport &amp; Academy</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {admissions.map((q) => (
                      <tr key={q.id} className="hover:bg-white/[0.03]">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{q.parentName}</p>
                          <p className="text-ink-400 font-mono">{q.parentPhone}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-ink-200">
                          {q.childName} {q.childAge ? '(' + q.childAge + ' yrs)' : ''}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-orange-400">{q.sportName}</p>
                          <p className="text-ink-400">{q.academyName}</p>
                          <p className="text-ink-500">Coach: {q.coachName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ' +
                              (q.requestType === 'trial'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-blue-500/20 text-blue-300')}
                          >
                            {q.requestType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-ink-300">
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink-400">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SUPPORT DESK */}
        {activeTab === 'tickets' && (
          <div className="space-y-7">
            {/* Desk Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold text-sky-400 backdrop-blur mb-2">
                  <LifeBuoy className="h-3.5 w-3.5" />
                  <span>Platform Resolution Desk</span>
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
                  Support &amp; Grievances
                </h2>
                <p className="mt-1 text-sm text-ink-400">
                  Direct customer support queue. Inquiries submitted via mobile apps and web portals appear here in real time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPlatformData}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white hover:bg-white/[0.08] transition"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-orange-400" />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {/* Support Desk KPI Summary Strip */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 backdrop-blur-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-400">Total Inquiries</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-white tracking-tight">{tickets.length}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                  <span>All logged submissions</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent p-5 backdrop-blur-xl shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Pending Attention</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                </div>
                <p className="mt-2 font-display text-3xl font-extrabold text-amber-300 tracking-tight">
                  {tickets.filter((t) => t.status === 'open').length}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300/80">
                  <span>Awaiting superadmin response</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent p-5 backdrop-blur-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">In Progress</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-blue-300 tracking-tight">
                  {tickets.filter((t) => t.status === 'in_progress').length}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-300/80">
                  <span>Actively being resolved</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent p-5 backdrop-blur-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Resolved Cases</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-emerald-300 tracking-tight">
                  {tickets.filter((t) => t.status === 'resolved').length}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300/80">
                  <span>Successfully closed issues</span>
                </div>
              </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Roles', count: tickets.length },
                  { id: 'parent', label: 'Parents', count: tickets.filter((t) => t.role === 'parent').length },
                  { id: 'coach', label: 'Coaches', count: tickets.filter((t) => t.role === 'coach').length },
                  { id: 'other', label: 'Other', count: tickets.filter((t) => t.role === 'other').length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTicketRoleFilter(f.id as any)}
                    className={
                      'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ' +
                      (ticketRoleFilter === f.id
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08] hover:text-white')
                    }
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  {[
                    { id: 'date', label: 'Date' },
                    { id: 'type', label: 'Type' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTicketSortBy(s.id as any)}
                      className={
                        'rounded-lg px-3 py-1.5 text-xs font-bold transition-all ' +
                        (ticketSortBy === s.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-ink-400 hover:bg-white/[0.06] hover:text-white')
                      }
                    >
                      Sort by {s.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setTicketSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-ink-300 hover:bg-white/[0.08] hover:text-white transition"
                  title={ticketSortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>{ticketSortDir === 'asc' ? 'Oldest / A→Z' : 'Newest / Z→A'}</span>
                </button>
              </div>
            </div>

            {filteredSortedTickets.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-20 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.03] border border-white/10 text-ink-500">
                  <LifeBuoy className="h-8 w-8 text-ink-400" />
                </div>
                <p className="mt-4 text-base font-bold text-white">
                  {tickets.length === 0 ? 'Support queue is completely clear' : 'No tickets match selected filter'}
                </p>
                <p className="mt-1 text-xs text-ink-400 max-w-md mx-auto">
                  {tickets.length === 0
                    ? 'All complaints, inquiries, and grievances submitted by academy coaches and parents have been addressed.'
                    : 'Try selecting "All Roles" or clearing the sort filter.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {filteredSortedTickets.map((t) => {
                  const cleanPhone = (t.userPhone || '').replace(/\D/g, '');
                  const waUrl = cleanPhone
                    ? 'https://wa.me/91' + cleanPhone + '?text=' + encodeURIComponent('Hi ' + (t.userName || 'there') + ', this is TruCoach Super Admin regarding your support request #' + t.id.slice(0, 8) + ' (' + t.subject + ').')
                    : null;

                  return (
                    <div
                      key={t.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-6 sm:p-7 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
                    >
                      {/* Top status accent bar */}
                      <div
                        className={
                          'absolute top-0 left-0 right-0 h-1 ' +
                          (t.status === 'open'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : t.status === 'in_progress'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500')
                        }
                      />

                      <div>
                        {/* Status + Category Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                              {t.category || 'General'}
                            </span>
                            <span
                              className={
                                'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ' +
                                (t.role === 'parent'
                                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                  : t.role === 'coach'
                                  ? 'border-blue-500/30 bg-blue-500/15 text-blue-300'
                                  : 'border-white/20 bg-white/10 text-ink-300')
                              }
                            >
                              {t.role}
                            </span>
                          </div>

                          <span
                            className={
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ' +
                              (t.status === 'open'
                                ? 'border-amber-500/30 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20'
                                : t.status === 'in_progress'
                                ? 'border-blue-500/30 bg-blue-500/20 text-blue-300 shadow-sm shadow-blue-500/20'
                                : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300')
                            }
                          >
                            {t.status === 'open' && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                              </span>
                            )}
                            {t.status === 'in_progress' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            )}
                            {t.status === 'resolved' && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            )}
                            <span>{t.status.replace('_', ' ')}</span>
                          </span>
                        </div>

                        {/* Subject & Description */}
                        <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-orange-300 transition-colors">
                          {t.subject}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-ink-300 whitespace-pre-wrap rounded-xl border border-white/5 bg-white/[0.015] p-3">
                          {t.message}
                        </p>

                        {/* Reporter & Contact Card */}
                        <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs text-ink-300 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-ink-400 text-[11px]">Reporter:</span>
                            <span className="font-bold text-white">{t.userName} ({t.role})</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-ink-400 text-[11px]">Phone:</span>
                            <div className="flex items-center gap-2">
                              {t.userPhone ? (
                                <>
                                  <a
                                    href={'tel:' + t.userPhone}
                                    className="font-mono text-ink-200 hover:text-white underline decoration-white/20"
                                  >
                                    {t.userPhone}
                                  </a>
                                  {waUrl && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                                      title="Open WhatsApp chat with user"
                                    >
                                      <MessageCircle className="h-3 w-3" />
                                      <span>WA</span>
                                    </a>
                                  )}
                                </>
                              ) : (
                                <span className="text-ink-500">Not provided</span>
                              )}
                            </div>
                          </div>

                          {t.userEmail && (
                            <div className="flex items-center justify-between">
                              <span className="text-ink-400 text-[11px]">Email:</span>
                              <a
                                href={'mailto:' + t.userEmail}
                                className="text-ink-300 hover:text-white underline decoration-white/20 truncate max-w-[200px]"
                              >
                                {t.userEmail}
                              </a>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-ink-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Hash className="h-3 w-3 text-ink-500" />
                              <span>{t.id.slice(0, 13)}...</span>
                            </span>
                            <span>{t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Action Footer */}
                      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {t.userPhone && (
                            <a
                              href={'tel:' + t.userPhone}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-ink-300 hover:bg-white/[0.08] hover:text-white transition"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {t.status !== 'in_progress' && t.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, 'in_progress')}
                              className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/25 transition shadow-sm"
                            >
                              In Progress
                            </button>
                          )}
                          {t.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <CommunityEventsDashboard events={communityEvents} onEventDeleted={(eventId) => {
            setCommunityEvents((prev) => prev.filter((e) => e.id !== eventId));
          }} />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {adminUser?.isSuperAdmin ? (
              <PlatformSettingsDashboard config={platformConfig} onSaved={(updated) => setPlatformConfig(updated)} />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                <ShieldAlert className="h-7 w-7 text-ink-500" />
                <p className="text-sm font-semibold text-white">Super Admin access required</p>
                <p className="text-xs text-ink-400">Platform-wide settings can only be changed by a Super Admin.</p>
              </div>
            )}
            <FeatureFlagsDashboard isSuperAdmin={!!adminUser?.isSuperAdmin} />
            <BroadcastDashboard isSuperAdmin={!!adminUser?.isSuperAdmin} />
            <AdminAccountDashboard adminUser={adminUser} />
          </div>
        )}

        {activeTab === 'authregistry' && <AuthRegistryDashboard />}
      </main>

      {/* Modal: Enroll New Student */}
      <AnimatePresence>
        {isAddingParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingParent(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0e121a] p-7 shadow-2xl text-white z-10"
            >
              <button
                onClick={() => setIsAddingParent(false)}
                className="absolute right-5 top-5 p-2 text-ink-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="font-display text-xl font-bold text-white">Enroll Athlete &amp; Guardian</h3>
              <p className="mt-1 text-xs text-ink-400">Save a real athlete record into your Supabase database.</p>

              <form onSubmit={handleCreateParentAthlete} className="mt-5 space-y-3 text-xs">
                <div>
                  <label className="text-ink-300 block mb-1">Athlete Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={regChildName}
                    onChange={(e) => setRegChildName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-ink-300 block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    value={regChildAge}
                    onChange={(e) => setRegChildAge(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-ink-300 block mb-1">Guardian Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={regParentName}
                    onChange={(e) => setRegParentName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-ink-300 block mb-1">Guardian Phone (10 digits)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={regParentPhone}
                    onChange={(e) => setRegParentPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingParent(false)}
                    className="rounded-xl px-4 py-2 text-xs text-ink-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingParent}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md"
                  >
                    {isSavingParent ? 'Saving...' : 'Save to Supabase'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coach Deep Profile Modal */}
      <AnimatePresence>
        {selectedCoach && (
          <CoachProfileModal
            coach={selectedCoach}
            isOpen={!!selectedCoach}
            onClose={() => setSelectedCoach(null)}
            onStatusUpdate={handleUpdateCoachStatus}
            onBatchCreated={fetchPlatformData}
            onUpdateEasebuzz={handleUpdateCoachEasebuzz}
            onUpdateRole={handleUpdateCoachRole}
          />
        )}
      </AnimatePresence>

      {/* Parent Deep Profile Modal */}
      <AnimatePresence>
        {selectedParent && (
          <ParentProfileModal
            parent={selectedParent}
            isOpen={!!selectedParent}
            onClose={() => setSelectedParent(null)}
            onStudentAdded={fetchPlatformData}
          />
        )}
      </AnimatePresence>

      {/* Sign-out confirmation */}
      <AnimatePresence>
        {isConfirmingLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !isSigningOut && setIsConfirmingLogout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d111a] p-6 shadow-2xl"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-400">
                <LogOut className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-white">Sign out of Admin Console?</h3>
              <p className="mt-1.5 text-xs text-ink-400 leading-relaxed">
                Your session will be revoked immediately and every live connection this tab holds will be closed.
                You'll need to sign in again to come back.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsConfirmingLogout(false)}
                  disabled={isSigningOut}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-ink-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
                >
                  {isSigningOut ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

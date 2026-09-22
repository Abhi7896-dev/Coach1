import { useEffect, useMemo, useState } from 'react';
import { UserX, Search, RefreshCw, ChevronDown, Phone, Mail, Hash, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// account_deletion_logs has admin-only RLS that blocks the anon key entirely
// (even a plain select('*') is rejected), so its exact columns can't be
// verified from outside an authenticated admin session. We read '*' (safe —
// never references a specific column name) and resolve a best-effort header
// from the field names this app uses everywhere else (user_name, user_phone,
// status, created_at, ...), falling back through common alternates. Every
// raw field actually present is still shown per-record, so nothing is lost
// if the real column names differ from the guess.
const NAME_KEYS = ['user_name', 'full_name', 'name', 'guardian_name'];
const PHONE_KEYS = ['user_phone', 'phone', 'phone_number', 'mobile', 'contact_phone'];
const EMAIL_KEYS = ['user_email', 'email', 'contact_email'];
const ROLE_KEYS = ['role', 'user_role', 'account_type'];
const REASON_KEYS = ['reason', 'deletion_reason', 'notes', 'message', 'comment'];
const STATUS_KEYS = ['status', 'request_status', 'state'];
const REQUESTED_AT_KEYS = ['requested_at', 'created_at', 'submitted_at', 'raised_at'];
const PROCESSED_AT_KEYS = ['processed_at', 'deleted_at', 'completed_at', 'resolved_at'];
const METHOD_KEYS = ['method', 'source', 'channel', 'request_method'];
const ID_KEYS = ['id', 'request_id', 'uuid'];

function firstOf(row: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
  }
  return undefined;
}

const ALL_KNOWN_KEYS = [
  ...NAME_KEYS,
  ...PHONE_KEYS,
  ...EMAIL_KEYS,
  ...ROLE_KEYS,
  ...REASON_KEYS,
  ...STATUS_KEYS,
  ...REQUESTED_AT_KEYS,
  ...PROCESSED_AT_KEYS,
  ...METHOD_KEYS,
  ...ID_KEYS,
];

export function AccountDeletionRequestsDashboard() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Enrollment history lookup, keyed by normalized 10-digit phone — loaded
  // lazily per-row on first expand (not eagerly for every request) so
  // opening this page doesn't fire a query storm.
  const [historyCache, setHistoryCache] = useState<Map<string, { students: any[]; enrollments: any[] }>>(new Map());
  const [loadingHistoryFor, setLoadingHistoryFor] = useState<string | null>(null);

  const normalizePhone = (raw: string) => {
    const clean = (raw || '').replace(/[^0-9]/g, '');
    return clean.length > 10 ? clean.slice(-10) : clean;
  };

  const loadHistory = async (phone: string) => {
    const p10 = normalizePhone(phone);
    if (!p10 || historyCache.has(p10)) return;

    setLoadingHistoryFor(p10);
    try {
      // Exact match on the normalized 10-digit number, not a %...% substring
      // search — parent_phone is stored consistently as clean 10 digits, so
      // this is equivalent in practice but lets Postgres use
      // idx_students_parent_phone (a leading-wildcard ILIKE can't use a
      // plain btree index and forces a sequential scan).
      // Embeds enrollments (+ tutor/batch/sport) directly via the reverse
      // student_id FK, instead of a second query chained off the student
      // IDs from this one.
      const { data: students } = await supabase
        .from('students')
        .select('*, enrollments(*, tutors(name, academy_name), batches(title, sports(name)))')
        .eq('parent_phone', p10);
      const studentList = students || [];
      const enrollments = studentList.flatMap((s: any) => s.enrollments || []);

      setHistoryCache((prev) => new Map(prev).set(p10, { students: studentList, enrollments }));
    } catch (_) {
      setHistoryCache((prev) => new Map(prev).set(p10, { students: [], enrollments: [] }));
    } finally {
      setLoadingHistoryFor(null);
    }
  };

  const load = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // No server-side .order() here on purpose — we don't know the real
      // column names, and ordering by a guessed one that doesn't exist would
      // fail the entire query (the same class of bug fixed everywhere else
      // in this app). Sorting happens client-side below instead, using
      // whatever date field actually resolves from the real returned data.
      const { data, error } = await supabase.from('account_deletion_logs').select('*');

      if (error) {
        setErrorMsg(error.message);
        setRows([]);
        return;
      }
      setRows(data || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load account deletion requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolved = useMemo(
    () =>
      rows
        .map((r) => ({
          raw: r,
          id: firstOf(r, ID_KEYS) || JSON.stringify(r).slice(0, 24),
          name: firstOf(r, NAME_KEYS) || 'Unknown User',
          phone: firstOf(r, PHONE_KEYS) || '',
          email: firstOf(r, EMAIL_KEYS) || '',
          role: (firstOf(r, ROLE_KEYS) || 'unknown').toString().toLowerCase(),
          reason: firstOf(r, REASON_KEYS) || '',
          status: (firstOf(r, STATUS_KEYS) || 'pending').toString().toLowerCase(),
          requestedAt: firstOf(r, REQUESTED_AT_KEYS),
          processedAt: firstOf(r, PROCESSED_AT_KEYS),
          method: firstOf(r, METHOD_KEYS) || '',
        }))
        .sort((a, b) => {
          const aTime = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
          const bTime = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
          return bTime - aTime;
        }),
    [rows]
  );

  const statuses = useMemo(() => Array.from(new Set(resolved.map((r) => r.status))), [resolved]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return resolved.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [resolved, statusFilter, search]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    resolved.forEach((r) => counts.set(r.status, (counts.get(r.status) || 0) + 1));
    return counts;
  }, [resolved]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Account Deletion Requests</h2>
        <p className="mt-1 text-sm text-ink-400">
          Every account deletion request raised in-app or via support — full detail per request.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg.toLowerCase().includes('permission') || errorMsg.toLowerCase().includes('is_platform_admin') ? (
            <>
              Access denied fetching this table for your session. This table is admin-restricted at the database
              level — confirm you're signed in with an account whose <code className="font-mono">role</code> is{' '}
              <code className="font-mono">admin</code>/<code className="font-mono">superadmin</code>.
              <span className="block mt-1 text-rose-400/70">({errorMsg})</span>
            </>
          ) : (
            errorMsg
          )}
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Requests</span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/15 text-rose-400">
              <UserX className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-white">{resolved.length}</div>
        </div>

        {Array.from(statusCounts.entries())
          .slice(0, 3)
          .map(([status, count]) => (
            <div key={status} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">{status}</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400">
                  <Clock className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{count}</div>
            </div>
          ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]'
            }`}
          >
            All ({resolved.length})
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                statusFilter === s ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]'
              }`}
            >
              {s} ({statusCounts.get(s)})
            </button>
          ))}
        </div>
        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-ink-400 outline-none focus:border-rose-500/60"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
          <p className="mt-3 text-xs text-ink-400">Loading account deletion requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <UserX className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">
            {resolved.length === 0 ? 'No deletion requests recorded' : 'No requests match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isExpanded = expandedId === String(r.id);
            const extraKeys = Object.keys(r.raw).filter((k) => !ALL_KNOWN_KEYS.includes(k));
            return (
              <div key={String(r.id)} className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-base font-bold text-white">{r.name}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-300">
                        {r.role}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          r.status.includes('complete') || r.status.includes('done') || r.status.includes('deleted')
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : r.status.includes('reject') || r.status.includes('cancel')
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                      {r.phone && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Phone className="h-3 w-3" /> {r.phone}
                        </span>
                      )}
                      {r.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {r.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3 w-3" /> <span className="font-mono">{r.id}</span>
                      </span>
                    </div>
                    {r.reason && <p className="mt-2 text-xs text-ink-300 max-w-xl">"{r.reason}"</p>}
                  </div>

                  <div className="text-right text-xs text-ink-400 shrink-0">
                    <p>
                      <strong className="text-white">Requested:</strong>{' '}
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : 'N/A'}
                    </p>
                    {r.processedAt && (
                      <p className="mt-1">
                        <strong className="text-white">Processed:</strong> {new Date(r.processedAt).toLocaleString()}
                      </p>
                    )}
                    {r.method && <p className="mt-1">Via: {r.method}</p>}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const next = isExpanded ? null : String(r.id);
                    setExpandedId(next);
                    if (next && r.phone) loadHistory(r.phone);
                  }}
                  className="flex w-full items-center justify-between border-t border-white/5 bg-white/[0.01] px-5 py-2.5 text-[11px] font-bold text-ink-400 hover:text-white"
                >
                  <span>View account history &amp; all fields ({Object.keys(r.raw).length} fields)</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-5 space-y-5">
                    {/* Account history — linked athletes & their coach/academy enrollment, past and present */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                        Linked Athletes &amp; Enrollment History
                      </h4>
                      {!r.phone ? (
                        <p className="text-xs text-ink-500">No phone number resolved for this request — can't look up linked records.</p>
                      ) : loadingHistoryFor === normalizePhone(r.phone) ? (
                        <p className="text-xs text-ink-400 flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Loading history for this phone number...
                        </p>
                      ) : (
                        (() => {
                          const hist = historyCache.get(normalizePhone(r.phone));
                          if (!hist) return <p className="text-xs text-ink-500">—</p>;
                          if (hist.students.length === 0) {
                            return (
                              <p className="text-xs text-ink-500">
                                No linked athlete or enrollment records found for this phone number.
                              </p>
                            );
                          }
                          return (
                            <div className="space-y-3">
                              {hist.students.map((s: any) => {
                                const studentEnrollments = hist.enrollments.filter((e: any) => e.student_id === s.id);
                                return (
                                  <div key={s.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                                    <p className="text-xs font-bold text-white">{s.name || 'Athlete'}</p>
                                    {studentEnrollments.length === 0 ? (
                                      <p className="mt-1 text-[11px] text-ink-500">
                                        No coach/academy enrollment on record — never registered with a coach.
                                      </p>
                                    ) : (
                                      <div className="mt-2 space-y-1.5">
                                        {studentEnrollments.map((e: any) => {
                                          const isActive = (e.status || '').toLowerCase().includes('active');
                                          return (
                                            <div
                                              key={e.id}
                                              className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[11px]"
                                            >
                                              <span className="text-ink-200">
                                                {e.tutors?.academy_name || 'Sports Academy'}
                                                {e.batches?.title ? ` · ${e.batches.title}` : ''}
                                                {e.batches?.sports?.name ? ` (${e.batches.sports.name})` : ''}
                                              </span>
                                              <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                  isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-ink-400'
                                                }`}
                                              >
                                                {isActive ? 'Active' : e.status || 'Past'}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Raw fields — whatever the real schema actually holds */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                        All Fields on This Record
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(r.raw).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-3 text-xs border-b border-white/5 pb-1.5">
                            <span className="text-ink-500 font-mono">{key}</span>
                            <span className="text-ink-200 text-right break-all">
                              {value === null || value === undefined || value === ''
                                ? '—'
                                : typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

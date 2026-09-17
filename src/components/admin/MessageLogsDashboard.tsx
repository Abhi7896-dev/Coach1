import { useEffect, useMemo, useState } from 'react';
import { Send, Search, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoachItem, ParentItem } from '@/pages/AdminPortal';

interface MessageLogsDashboardProps {
  coaches: CoachItem[];
  parents: ParentItem[];
}

type RangeDays = 7 | 30 | 90;

interface LogRow {
  id: string;
  recipient_phone: string | null;
  message_type: string | null;
  sent_at: string | null;
  tutor_id: string | null;
  student_id: string | null;
  status: string | null;
}

// Same validated categorical order used for the payment-method breakdown —
// adjacent CVD Delta E 8.5+/normal-vision 31.3+ vs this app's dark surface,
// and every row here is direct-labeled anyway.
const TYPE_COLORS = ['#3282fb', '#fb5a0c', '#19b062', '#a855f7', '#f59e0b'];
const OTHER_COLOR = '#5a6478';

function statusBucket(status: unknown): 'good' | 'warning' | 'critical' {
  const s = typeof status === 'string' ? status.toLowerCase() : '';
  if (s.includes('fail') || s.includes('error') || s.includes('bounce')) return 'critical';
  if (s.includes('pending') || s.includes('queue') || s.includes('retry')) return 'warning';
  return 'good';
}

function normalizePhone(raw: string | null | undefined): string {
  const clean = (raw || '').replace(/[^0-9]/g, '');
  return clean.length > 10 ? clean.slice(-10) : clean;
}

export function MessageLogsDashboard({ coaches, parents }: MessageLogsDashboardProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [studentMap, setStudentMap] = useState<Map<string, { id: string; name: string; guardian_name: string }>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const coachById = useMemo(() => new Map(coaches.map((c) => [c.id, c])), [coaches]);
  const parentByPhone = useMemo(() => new Map(parents.map((p) => [normalizePhone(p.phone), p])), [parents]);

  const loadLogs = async (days: RangeDays) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const start = new Date();
      start.setDate(start.getDate() - days);

      const LIMIT = 2000;
      const { data, error, count } = await supabase
        .from('automation_logs')
        .select('id, recipient_phone, message_type, sent_at, tutor_id, student_id, status', { count: 'exact' })
        .gte('sent_at', start.toISOString())
        .order('sent_at', { ascending: false })
        .limit(LIMIT);

      if (error) {
        setErrorMsg(error.message);
        setLogs([]);
        return;
      }

      const rows = data || [];
      setLogs(rows);
      setTruncated((count || 0) > rows.length);

      const studentIds = Array.from(new Set(rows.map((r) => r.student_id).filter(Boolean))) as string[];
      if (studentIds.length > 0) {
        const { data: sData } = await supabase
          .from('students')
          .select('id, name, guardian_name')
          .in('id', studentIds);
        setStudentMap(new Map((sData || []).map((s: any) => [s.id, s])));
      } else {
        setStudentMap(new Map());
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load message logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(rangeDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const resolveRecipient = (log: LogRow) => {
    const student = log.student_id ? studentMap.get(log.student_id) : undefined;
    const coach = log.tutor_id ? coachById.get(log.tutor_id) : undefined;
    const parent = log.recipient_phone ? parentByPhone.get(normalizePhone(log.recipient_phone)) : undefined;

    const name = parent?.name || coach?.name || student?.guardian_name || 'Unknown Recipient';
    const context = student ? `Re: ${student.name}` : coach ? coach.academyName : parent ? 'Parent' : '';
    return { name, context };
  };

  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach((l) => {
      const t = (l.message_type || 'Unspecified').trim();
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    const sorted = Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    return [
      ...top,
      ...(rest.length > 0 ? [{ type: 'Other', count: rest.reduce((s, r) => s + r.count, 0) }] : []),
    ];
  }, [logs]);

  const statusBreakdown = useMemo(() => {
    const buckets = { good: 0, warning: 0, critical: 0 };
    logs.forEach((l) => {
      buckets[statusBucket(l.status)]++;
    });
    return buckets;
  }, [logs]);

  const messageTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.message_type || 'Unspecified'))),
    [logs]
  );
  const statuses = useMemo(() => Array.from(new Set(logs.map((l) => l.status || 'unknown'))), [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((l) => {
      const matchesType = typeFilter === 'all' || (l.message_type || 'Unspecified') === typeFilter;
      const matchesStatus = statusFilter === 'all' || (l.status || 'unknown') === statusFilter;
      if (!matchesType || !matchesStatus) return false;
      if (!q) return true;
      const { name } = resolveRecipient(l);
      return name.toLowerCase().includes(q) || (l.recipient_phone || '').includes(q);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [logs, typeFilter, statusFilter, search, studentMap, coachById, parentByPhone]);

  const uniqueRecipients = useMemo(
    () => new Set(logs.map((l) => normalizePhone(l.recipient_phone)).filter(Boolean)).size,
    [logs]
  );

  const typeMax = Math.max(...typeBreakdown.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">WhatsApp Message Logs</h2>
          <p className="mt-1 text-sm text-ink-400">
            Every automated message sent — who received it, what type, and delivery status.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {([7, 30, 90] as RangeDays[]).map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rangeDays === d ? 'bg-blue-600 text-white shadow-md' : 'text-ink-400 hover:bg-white/[0.06]'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-xs text-ink-400">Loading message logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <Send className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">No messages logged in this period</p>
        </div>
      ) : (
        <>
          {truncated && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Showing the most recent 2,000 messages in this range — totals below are based on this sample.</span>
            </div>
          )}

          {/* KPI tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Messages</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <Send className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{logs.length}</div>
              <p className="mt-2 text-xs text-ink-400">Last {rangeDays} days</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Unique Recipients</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/15 text-purple-400">
                  <Send className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{uniqueRecipients}</div>
              <p className="mt-2 text-xs text-ink-400">Distinct phone numbers messaged</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Delivered / Sent OK</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-emerald-400">{statusBreakdown.good}</div>
              <p className="mt-2 text-xs text-ink-400">
                {statusBreakdown.warning} pending · {statusBreakdown.critical} failed
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Failed</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/15 text-rose-400">
                  <XCircle className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-rose-400">{statusBreakdown.critical}</div>
              <p className="mt-2 text-xs text-ink-400">Failed or bounced sends</p>
            </div>
          </div>

          {/* Message type breakdown — categorical, direct-labeled */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-display text-base font-bold text-white mb-4">Messages by Type</h3>
            <div className="space-y-3">
              {typeBreakdown.map((t, i) => {
                const color = i < TYPE_COLORS.length ? TYPE_COLORS[i] : OTHER_COLOR;
                return (
                  <div key={t.type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2 font-semibold text-white">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {t.type}
                      </span>
                      <span className="font-bold text-white">{t.count}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(t.count / typeMax) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#141a26] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="all">All Types ({logs.length})</option>
                {messageTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#141a26] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search recipient, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-ink-400 outline-none focus:border-blue-500/60"
              />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center text-xs text-ink-400">
              No messages match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                  <tr>
                    <th className="px-5 py-3.5">Recipient</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Message Type</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.slice(0, 300).map((log) => {
                    const { name, context } = resolveRecipient(log);
                    const bucket = statusBucket(log.status);
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.03]">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-white">{name}</p>
                          {context && <p className="text-ink-400">{context}</p>}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-ink-300">{log.recipient_phone || '—'}</td>
                        <td className="px-5 py-3.5 text-ink-200">{log.message_type || 'Unspecified'}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              bucket === 'good'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : bucket === 'warning'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {bucket === 'warning' && <Clock className="h-2.5 w-2.5" />}
                            {log.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-ink-400">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 300 && (
                <p className="px-5 py-3 text-[11px] text-ink-500">
                  Showing first 300 of {filtered.length} matching messages — narrow the filters to see more precisely.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Activity, MoonStar, HelpCircle, Users, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CoachItem, ParentItem } from '@/pages/AdminPortal';

interface UserActivityDashboardProps {
  coaches: CoachItem[];
  parents: ParentItem[];
}

type WindowDays = 7 | 30 | 90;
type RoleFilter = 'all' | 'coach' | 'parent';
type ActivityStatus = 'active' | 'passive' | 'never';

interface ActivityRow {
  id: string;
  email: string | null;
  phone: string | null;
  lastSignInAt: string | null;
  role: string;
  fullName: string | null;
}

export function UserActivityDashboard({ coaches, parents }: UserActivityDashboardProps) {
  const [windowDays, setWindowDays] = useState<WindowDays>(30);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivityRow[]>([]);

  const coachById = useMemo(() => new Map(coaches.map((c) => [c.id, c])), [coaches]);
  const parentById = useMemo(() => new Map(parents.map((p) => [p.id, p])), [parents]);

  const loadActivity = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSetupNeeded(false);
    try {
      const { data, error } = await supabase.rpc('get_user_activity');
      if (error) {
        // PGRST202 / 42883 = function doesn't exist yet — the one-time SQL
        // setup hasn't been run. Anything else is a real error.
        if (error.code === 'PGRST202' || error.message?.toLowerCase().includes('function')) {
          setSetupNeeded(true);
        } else {
          setErrorMsg(error.message);
        }
        setRows([]);
        return;
      }
      setRows(
        (data || []).map((r: any) => ({
          id: r.id,
          email: r.email,
          phone: r.phone,
          lastSignInAt: r.last_sign_in_at,
          role: (r.role || 'unknown').toLowerCase(),
          fullName: r.full_name,
        }))
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected error loading user activity.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classified = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    return rows
      .filter((r) => r.role !== 'admin' && r.role !== 'superadmin')
      .map((r) => {
        let status: ActivityStatus;
        if (!r.lastSignInAt) status = 'never';
        else if (new Date(r.lastSignInAt) >= cutoff) status = 'active';
        else status = 'passive';

        const roleGroup: 'coach' | 'parent' | 'unknown' =
          r.role === 'parent' ? 'parent' : r.role === 'unknown' ? 'unknown' : 'coach';

        const coach = roleGroup === 'coach' ? coachById.get(r.id) : undefined;
        const parent = roleGroup === 'parent' ? parentById.get(r.id) : undefined;

        return {
          ...r,
          status,
          roleGroup,
          displayName: r.fullName || coach?.name || parent?.name || 'Unnamed User',
          context: coach?.academyName || parent?.locality || '',
        };
      });
  }, [rows, windowDays, coachById, parentById]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return classified.filter((r) => {
      const matchesRole = roleFilter === 'all' || r.roleGroup === roleFilter;
      const matchesSearch =
        !q ||
        r.displayName.toLowerCase().includes(q) ||
        (r.phone || '').includes(q) ||
        (r.email || '').toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [classified, roleFilter, search]);

  const stats = useMemo(() => {
    const active = classified.filter((r) => r.status === 'active').length;
    const passive = classified.filter((r) => r.status === 'passive').length;
    const never = classified.filter((r) => r.status === 'never').length;
    return { active, passive, never, total: classified.length };
  }, [classified]);

  if (setupNeeded) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-lg font-bold text-white">One-time setup needed</h3>
            <p className="mt-2 text-sm text-ink-300 leading-relaxed">
              This page reads <code className="font-mono text-amber-300">last_sign_in_at</code> from Supabase Auth,
              which requires a small database function that hasn't been created yet. Run{' '}
              <code className="font-mono text-amber-300">supabase_user_activity_setup.sql</code> (in the project root)
              once in your Supabase Dashboard → SQL Editor, then refresh this page.
            </p>
            <button
              onClick={loadActivity}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Active &amp; Passive Users</h2>
          <p className="mt-1 text-sm text-ink-400">
            Based on real Supabase Auth sign-in activity — not registration date.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {([7, 30, 90] as WindowDays[]).map((d) => (
            <button
              key={d}
              onClick={() => setWindowDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                windowDays === d ? 'bg-blue-600 text-white shadow-md' : 'text-ink-400 hover:bg-white/[0.06]'
              }`}
            >
              Active = signed in last {d}d
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
          <p className="mt-3 text-xs text-ink-400">Loading sign-in activity...</p>
        </div>
      ) : (
        <>
          {/* KPI stat tiles + status breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Active</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <Activity className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{stats.active}</div>
              <p className="mt-2 text-xs text-ink-400">Signed in within {windowDays} days</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Passive / Dormant</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400">
                  <MoonStar className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{stats.passive}</div>
              <p className="mt-2 text-xs text-ink-400">Signed in before that, still registered</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Never Signed In</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-ink-300">
                  <HelpCircle className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{stats.never}</div>
              <p className="mt-2 text-xs text-ink-400">Account exists, no recorded sign-in</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Tracked</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <Users className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-white">{stats.total}</div>
              <p className="mt-2 text-xs text-ink-400">Coaches + parents with an auth account</p>
            </div>
          </div>

          {/* Status breakdown bar — 3 categories, direct-labeled */}
          {stats.total > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-display text-sm font-bold text-white mb-3">Activity Breakdown</h3>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-emerald-500" style={{ width: `${(stats.active / stats.total) * 100}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${(stats.passive / stats.total) * 100}%` }} />
                <div className="h-full bg-white/20" style={{ width: `${(stats.never / stats.total) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Active (
                  {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Passive (
                  {stats.total > 0 ? ((stats.passive / stats.total) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/40" /> Never signed in (
                  {stats.total > 0 ? ((stats.never / stats.total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {([
                { id: 'all', label: 'All' },
                { id: 'coach', label: 'Coaches' },
                { id: 'parent', label: 'Parents' },
              ] as { id: RoleFilter; label: string }[]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    roleFilter === f.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/[0.04] text-ink-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {f.label}
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-ink-400 outline-none focus:border-blue-500/60"
              />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
              <Users className="mx-auto h-12 w-12 text-ink-500" />
              <p className="mt-4 text-sm font-bold text-white">No users match current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                  <tr>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Context</th>
                    <th className="px-5 py-3.5">Last Sign-In</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5 font-bold text-white">{r.displayName}</td>
                      <td className="px-5 py-3.5 text-ink-300 capitalize">{r.roleGroup}</td>
                      <td className="px-5 py-3.5 text-ink-300">
                        <p className="font-mono">{r.phone || '—'}</p>
                        {r.email && <p className="text-ink-500">{r.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-ink-400">{r.context || '—'}</td>
                      <td className="px-5 py-3.5 text-ink-300">
                        {r.lastSignInAt ? new Date(r.lastSignInAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            r.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : r.status === 'passive'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-white/10 text-ink-300'
                          }`}
                        >
                          {r.status === 'never' ? 'Never Signed In' : r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

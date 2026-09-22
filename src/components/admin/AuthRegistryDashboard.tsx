import { useState } from 'react';
import { ShieldAlert, RefreshCw, Trash2, AlertTriangle, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrphanedUser {
  id: string;
  email: string;
  phone: string;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
}

// Deliberately NOT fetched as part of the bundled directory call — this is
// an occasional cleanup task, not something every admin session needs, so
// it only queries when this tab is actually opened.
export function AuthRegistryDashboard() {
  const [users, setUsers] = useState<OrphanedUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_unregistered_auth_users' },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || error?.message || 'Failed to load auth registry.');
        return;
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load auth registry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOne = async (user: OrphanedUser) => {
    if (!confirm(`Delete auth account ${user.email !== 'No Email' ? user.email : user.phone}? This can't be undone.`)) return;
    setBusyId(user.id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'delete_unregistered_auth_user', user_id: user.id },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || error?.message || 'Failed to delete user.');
        return;
      }
      setUsers((prev) => (prev || []).filter((u) => u.id !== user.id));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete user.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeAll = async () => {
    if (!users || users.length === 0) return;
    if (!confirm(`Delete all ${users.length} orphaned auth accounts? This can't be undone.`)) return;
    setIsPurging(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'purge_all_unregistered_auth_users' },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || error?.message || 'Purge failed.');
        return;
      }
      setUsers([]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Purge failed.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Auth Registry</h2>
          <p className="mt-1 text-sm text-ink-400 max-w-2xl">
            Accounts that exist in Supabase Auth but have no matching row in <code className="font-mono text-ink-300">profiles</code>{' '}
            or <code className="font-mono text-ink-300">tutors</code> — usually left behind by an interrupted signup
            (OTP requested but never verified, app closed mid-registration). They can't log in to anything, but they
            still count against your auth user total.
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {users === null ? 'Scan for Orphaned Accounts' : 'Rescan'}
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {users === null && !isLoading && (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">Not scanned yet</p>
          <p className="mt-1 text-xs text-ink-400">This checks every auth user against your database, so it's run on demand, not on every page load.</p>
        </div>
      )}

      {isLoading && (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
          <p className="mt-3 text-xs text-ink-400">Scanning auth users...</p>
        </div>
      )}

      {users !== null && !isLoading && (
        <>
          {users.length === 0 ? (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 py-16 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="mt-4 text-sm font-bold text-white">No orphaned accounts</p>
              <p className="mt-1 text-xs text-ink-400">Every auth user has a matching profile or tutor row.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{users.length} orphaned account{users.length === 1 ? '' : 's'} found.</span>
                </div>
                <button
                  onClick={handlePurgeAll}
                  disabled={isPurging}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {isPurging ? 'Purging...' : 'Delete All'}
                </button>
              </div>

              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
                        <UserX className="h-4 w-4" />
                      </span>
                      <div className="text-xs">
                        <p className="font-bold text-white">{u.email !== 'No Email' ? u.email : u.phone}</p>
                        <p className="text-ink-400 mt-0.5">
                          Signed up {new Date(u.created_at).toLocaleDateString()} via {u.provider}
                          {u.last_sign_in_at && <span> · last seen {new Date(u.last_sign_in_at).toLocaleDateString()}</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteOne(u)}
                      disabled={busyId === u.id}
                      className="p-1.5 text-ink-500 hover:text-rose-400 disabled:opacity-50"
                      title="Delete this account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

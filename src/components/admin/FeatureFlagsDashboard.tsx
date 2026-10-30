import { useEffect, useState } from 'react';
import { Flag, AlertTriangle, Plus, Loader2, ShieldQuestion } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FlagRow {
  key: string;
  enabled: boolean;
  description: string | null;
}

interface FeatureFlagsDashboardProps {
  isSuperAdmin: boolean;
}

// Reads/writes feature_flags directly (same pattern as PlatformSettingsDashboard's
// platform_config) — RLS on that table already restricts writes to superadmin,
// so this needs no edge function round trip, just the one table.
//
// IMPORTANT, and shown in the UI below: flipping a flag here only changes
// what's stored in the database. Nothing in the mobile app reads this table
// yet — actually enforcing a flag (or showing a maintenance screen) is a
// separate Flutter-side change, out of scope for this portal.
export function FeatureFlagsDashboard({ isSuperAdmin }: FeatureFlagsDashboardProps) {
  const [rows, setRows] = useState<FlagRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase.from('feature_flags').select('key, enabled, description').order('key');
    if (error) setErrorMsg(error.message);
    setRows(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center">
        <ShieldQuestion className="h-7 w-7 text-ink-500" />
        <p className="text-sm font-semibold text-white">Super Admin access required</p>
        <p className="text-xs text-ink-400">Feature flags and maintenance mode are Super Admin-only.</p>
      </div>
    );
  }

  const toggle = async (row: FlagRow) => {
    setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, enabled: !r.enabled } : r)));
    const { error } = await supabase.from('feature_flags').update({ enabled: !row.enabled }).eq('key', row.key);
    if (error) {
      setErrorMsg(error.message);
      load();
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('feature_flags').insert({
      key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
      enabled: false,
      description: newDescription.trim() || null,
    });
    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setNewKey('');
    setNewDescription('');
    setIsAdding(false);
    load();
  };

  const maintenanceRow = rows.find((r) => r.key === 'maintenance_mode');
  const otherRows = rows.filter((r) => r.key !== 'maintenance_mode');

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 text-sky-400">
          <Flag className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Feature Flags & Maintenance Mode</h3>
          <p className="text-xs text-ink-400">
            Stored platform-wide — enforcing these in the mobile app itself is a separate change, not yet wired up.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {maintenanceRow && (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                maintenanceRow.enabled ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${maintenanceRow.enabled ? 'text-rose-400' : 'text-ink-500'}`} />
                <div>
                  <p className="text-sm font-bold text-white">Maintenance Mode</p>
                  <p className="text-xs text-ink-400">{maintenanceRow.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(maintenanceRow)}
                className={`relative h-7 w-13 shrink-0 rounded-full transition-colors ${
                  maintenanceRow.enabled ? 'bg-rose-500' : 'bg-white/10'
                }`}
                style={{ width: 52 }}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                    maintenanceRow.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          )}

          {otherRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-bold text-white">{row.key}</p>
                {row.description && <p className="text-xs text-ink-400">{row.description}</p>}
              </div>
              <button
                onClick={() => toggle(row)}
                className={`relative h-7 shrink-0 rounded-full transition-colors ${row.enabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                style={{ width: 52 }}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${row.enabled ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>
          ))}

          {isAdding ? (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-2">
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="flag_key (e.g. new_dashboard_ui)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
              />
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What does this control? (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="rounded-xl bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl px-4 py-1.5 text-xs font-bold text-ink-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"
            >
              <Plus className="h-3.5 w-3.5" /> New Flag
            </button>
          )}
        </div>
      )}
    </div>
  );
}

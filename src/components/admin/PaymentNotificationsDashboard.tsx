import { useMemo, useState } from 'react';
import { Search, Loader2, Users, UserCheck, AlertTriangle, CheckCircle2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CoachItem } from '@/pages/AdminPortal';

interface PaymentNotificationsDashboardProps {
  coaches: CoachItem[];
  isSuperAdmin: boolean;
}

interface RunResult {
  payment_notices_sent: number;
  report_cards_dispatched: number;
  batch_errors: number;
  ist_date?: string;
}

// Fires the existing payment-window-cron engine on demand instead of
// waiting for its daily schedule. That function already owns the real
// billing logic (per-student due/overdue stage from finance_logs, correct
// amount, idempotent per-stage notification) — this panel is just a manual
// trigger + audience scope on top of it, not a second notification system.
export function PaymentNotificationsDashboard({ coaches, isSuperAdmin }: PaymentNotificationsDashboardProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [scope, setScope] = useState<'all' | 'coach'>('all');
  const [coachSearch, setCoachSearch] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<CoachItem | null>(null);
  const [forceResend, setForceResend] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredCoaches = useMemo(() => {
    const q = coachSearch.trim().toLowerCase();
    if (!q) return coaches.slice(0, 20);
    return coaches.filter((c) => c.name.toLowerCase().includes(q) || c.academyName?.toLowerCase().includes(q)).slice(0, 20);
  }, [coachSearch, coaches]);

  const canRun = scope === 'all' || !!selectedCoach;

  const runNow = async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      // Routed through admin-operations (service-role, server-to-server)
      // rather than calling payment-window-cron directly with the admin's
      // own JWT — that function's own auth gate is intentionally left
      // untouched (it's relied on by the coach app's own bell-icon dispatch
      // today), so this goes through a path that doesn't depend on it.
      const { data, error: fnError } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'trigger_payment_notifications',
          p_tutor_id: scope === 'coach' && selectedCoach ? selectedCoach.id : undefined,
          p_force: forceResend,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResult(data.result || data);
    } catch (err: any) {
      setError(err?.message || 'Failed to run payment notifications.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Payment Notifications</h2>
        <p className="mt-1 text-sm text-ink-400">
          Send fee reminders to parents — personalized per student from the real billing ledger, not a generic blast.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <button onClick={() => setInstructionsOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-400">How This Works</span>
          {instructionsOpen ? <ChevronUp className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
        </button>
        {instructionsOpen && (
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-300">
            <p>
              • This does <strong className="text-white">not</strong> send one message to everyone. It checks each student's
              real invoice in the finance ledger and only notifies parents whose fee is{' '}
              <strong className="text-white">due within 3 days, due today, or overdue</strong>.
            </p>
            <p>
              • Each message is personalized with the actual student name, batch, and amount due — sent via WhatsApp (the
              approved "Fee Overdue Notice" template) and a push notification together.
            </p>
            <p>
              • A student who is fully paid, or who was already notified for their current billing stage today, is
              automatically skipped — unless you turn on <strong className="text-white">Force Resend</strong> below.
            </p>
            <p>• This same engine also runs automatically every day — this panel just lets you trigger it manually right now, e.g. scoped to one coach after onboarding a new batch.</p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">1. Choose Audience</h3>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => {
              setScope('all');
              setSelectedCoach(null);
            }}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              scope === 'all' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <Users className="h-4 w-4" /> All Coaches
            </span>
            <span className="mt-1 block text-[11px] text-ink-400">Every parent across the platform with a due/overdue fee.</span>
          </button>
          <button
            onClick={() => setScope('coach')}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              scope === 'coach' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <UserCheck className="h-4 w-4" /> One Coach
            </span>
            <span className="mt-1 block text-[11px] text-ink-400">Only that coach's students' parents.</span>
          </button>
        </div>

        {scope === 'coach' &&
          (selectedCoach ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white">{selectedCoach.name}</p>
                <p className="text-xs text-ink-400">{selectedCoach.academyName}</p>
              </div>
              <button onClick={() => setSelectedCoach(null)} className="text-xs font-bold text-blue-400 hover:text-blue-300">
                Change
              </button>
            </div>
          ) : (
            <div>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  placeholder="Search coach or academy name..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {filteredCoaches.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCoach(c)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-ink-500">{c.academyName}</span>
                  </button>
                ))}
                {filteredCoaches.length === 0 && <p className="px-3 py-2 text-xs text-ink-500">No coaches match.</p>}
              </div>
            </div>
          ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">2. Send</h3>
        {isSuperAdmin && (
          <label className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
            <input type="checkbox" checked={forceResend} onChange={(e) => setForceResend(e.target.checked)} className="mt-0.5" />
            <span>
              <strong className="block text-amber-300">Force resend (Super Admin only)</strong>
              Re-sends to every student still in an active billing stage, even if they were already notified today. Use only
              for an intentional, urgent resend.
            </span>
          </label>
        )}
        <button
          onClick={runNow}
          disabled={!canRun || running}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-105 hover:bg-emerald-500 disabled:scale-100 disabled:opacity-40"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Send Payment Notifications Now
        </button>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {result && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Sent {result.payment_notices_sent} payment notice{result.payment_notices_sent === 1 ? '' : 's'}
            {result.report_cards_dispatched
              ? ` and ${result.report_cards_dispatched} progress report${result.report_cards_dispatched === 1 ? '' : 's'}`
              : ''}
            .{result.batch_errors ? ` (${result.batch_errors} batch error${result.batch_errors === 1 ? '' : 's'} — check function logs.)` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Flame, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ActionOtpModal } from './ActionOtpModal';

// Full identity wipe by email or phone — across auth.users, profiles,
// tutors, phone_registry, and cascading parent/student data. Exists
// specifically for test/dev identities stuck straddling tables (an
// orphaned auth.users row with no profile, a stray profile with no
// tutor row, etc.) that keep blocking re-registration with a confusing
// "already registered" error none of the other, narrower delete flows
// (delete_parent, delete_tutor — each scoped to one account type) fully
// clear. Superadmin-only, OTP-gated like every other severe action here.
export function PurgeIdentityPanel() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const cleanEmail = email.trim().toLowerCase();
  const canSubmit = (cleanEmail.length > 0 || cleanPhone.length === 10) && !isPurging;

  const handlePurge = async () => {
    setIsPurging(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'purge_identity',
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
        },
      });

      if (error || !data?.success) {
        const message = data?.error || error?.message || 'Purge failed';
        setResult({ type: 'error', message });
        return;
      }

      const count = data.result?.count ?? 0;
      setResult({
        type: 'success',
        message: count > 0
          ? `Purged ${count} account${count === 1 ? '' : 's'} completely — every row across auth, profiles, tutors and phone registry is gone.`
          : 'No matching account found for that email/phone — nothing to purge.',
      });
      setEmail('');
      setPhone('');
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-400">
          <Flame className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-white">Purge Identity</h3>
          <p className="text-xs text-ink-400">
            Permanently wipe an email or phone number across every table — use when a test/dev
            identity gets stuck half-deleted and blocks re-registration.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-ink-500 outline-none focus:border-rose-500/50"
        />
        <input
          type="tel"
          placeholder="10-digit phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-ink-500 outline-none focus:border-rose-500/50"
        />
      </div>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
            result.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{result.message}</span>
        </div>
      )}

      <button
        onClick={() => setIsOtpOpen(true)}
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-500 disabled:opacity-40"
      >
        {isPurging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
        Purge This Identity
      </button>

      <ActionOtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onVerified={async () => {
          setIsOtpOpen(false);
          await handlePurge();
        }}
        actionTitle="Purge Identity"
        targetName={cleanEmail || `+91 ${cleanPhone}`}
        targetId={cleanEmail || cleanPhone}
        actionType="purge_identity"
        dangerLevel="critical"
      />
    </div>
  );
}

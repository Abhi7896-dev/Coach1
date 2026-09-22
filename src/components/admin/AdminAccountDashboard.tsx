import { useState } from 'react';
import { ShieldPlus, KeyRound, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminUser } from '@/lib/supabase';

interface AdminAccountDashboardProps {
  adminUser: AdminUser | null;
}

type FlowStage = 'form' | 'otp' | 'done';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Sends a 6-digit code to the CURRENTLY LOGGED-IN admin's own email via the
 * existing send-email-notification/email_verification_otp action (already
 * used for the parent-portal email-change flow, and for account-deletion
 * confirmation) — generated and compared client-side, so there's no
 * server-side OTP state to manage, matching that established pattern.
 *
 * This intentionally verifies the ACTING admin's identity, not the target
 * of the action — it protects against someone at an admin's unlocked
 * laptop silently adding a new admin account or changing the password,
 * not against email ownership of a new account being created.
 */
async function sendOtpToActingAdmin(adminUser: AdminUser | null): Promise<string> {
  if (!adminUser?.email) {
    throw new Error('No active admin session email found — please sign in again.');
  }
  const code = generateOtp();
  const { error } = await supabase.functions.invoke('send-email-notification', {
    body: {
      action: 'email_verification_otp',
      to_email: adminUser.email,
      user_name: adminUser.fullName || 'Admin',
      otp: code,
    },
  });
  if (error) {
    throw new Error(error.message || 'Failed to send verification code.');
  }
  return code;
}

export function AdminAccountDashboard({ adminUser }: AdminAccountDashboardProps) {
  // ── Add New Admin ──────────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [addStage, setAddStage] = useState<FlowStage>('form');
  const [addOtpInput, setAddOtpInput] = useState('');
  const [addGeneratedOtp, setAddGeneratedOtp] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const validateAddForm = (): string | null => {
    if (!newName.trim()) return 'Full name is required.';
    if (!newEmail.trim().includes('@')) return 'Enter a valid email address.';
    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return 'Enter a valid 10-digit mobile number.';
    if (newPassword.length < 8) return 'Password must be at least 8 characters.';
    if (newPassword !== newPasswordConfirm) return 'Passwords do not match.';
    return null;
  };

  const resetAddFlow = () => {
    setAddStage('form');
    setAddOtpInput('');
    setAddGeneratedOtp('');
    setAddError(null);
  };

  const handleRequestAddAdmin = async () => {
    const validationError = validateAddForm();
    if (validationError) {
      setAddError(validationError);
      return;
    }
    setAddError(null);
    setAddBusy(true);
    try {
      const code = await sendOtpToActingAdmin(adminUser);
      setAddGeneratedOtp(code);
      setAddStage('otp');
    } catch (err: any) {
      setAddError(err?.message || 'Failed to send verification code.');
    } finally {
      setAddBusy(false);
    }
  };

  const handleConfirmAddAdmin = async () => {
    if (addOtpInput.trim().length !== 6) {
      setAddError('Enter the 6-digit code.');
      return;
    }
    if (addOtpInput.trim() !== addGeneratedOtp) {
      setAddError('Incorrect code. Please check and try again.');
      return;
    }
    setAddBusy(true);
    setAddError(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'create_platform_admin',
          p_name: newName.trim(),
          p_email: newEmail.trim(),
          p_phone: newPhone.replace(/\D/g, ''),
          p_password: newPassword,
        },
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to create admin account.');
      }
      setAddStage('done');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setAddOtpInput('');
      setAddGeneratedOtp('');
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create admin account.');
    } finally {
      setAddBusy(false);
    }
  };

  // ── Change My Password ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwNewConfirm, setPwNewConfirm] = useState('');
  const [pwStage, setPwStage] = useState<FlowStage>('form');
  const [pwOtpInput, setPwOtpInput] = useState('');
  const [pwGeneratedOtp, setPwGeneratedOtp] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const validatePwForm = (): string | null => {
    if (!currentPassword) return 'Enter your current password.';
    if (pwNew.length < 8) return 'New password must be at least 8 characters.';
    if (pwNew !== pwNewConfirm) return 'New passwords do not match.';
    if (pwNew === currentPassword) return 'New password must be different from your current password.';
    return null;
  };

  const resetPwFlow = () => {
    setPwStage('form');
    setPwOtpInput('');
    setPwGeneratedOtp('');
    setPwError(null);
  };

  const handleRequestPasswordChange = async () => {
    const validationError = validatePwForm();
    if (validationError) {
      setPwError(validationError);
      return;
    }
    setPwError(null);
    setPwBusy(true);
    try {
      // Verify the current password is actually correct BEFORE sending an
      // OTP for a change that would fail anyway — same order of operations
      // as the mobile app's own change-password flow.
      if (!adminUser?.email) throw new Error('No active admin session email found.');
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: adminUser.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error('Current password is incorrect.');

      const code = await sendOtpToActingAdmin(adminUser);
      setPwGeneratedOtp(code);
      setPwStage('otp');
    } catch (err: any) {
      setPwError(err?.message || 'Failed to send verification code.');
    } finally {
      setPwBusy(false);
    }
  };

  const handleConfirmPasswordChange = async () => {
    if (pwOtpInput.trim().length !== 6) {
      setPwError('Enter the 6-digit code.');
      return;
    }
    if (pwOtpInput.trim() !== pwGeneratedOtp) {
      setPwError('Incorrect code. Please check and try again.');
      return;
    }
    setPwBusy(true);
    setPwError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw new Error(error.message);
      setPwStage('done');
      setCurrentPassword('');
      setPwNew('');
      setPwNewConfirm('');
      setPwOtpInput('');
      setPwGeneratedOtp('');
    } catch (err: any) {
      setPwError(err?.message || 'Failed to update password.');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Add New Admin ──────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-400">
            <ShieldPlus className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Add Platform Admin</h3>
            <p className="text-xs text-ink-400">Grants full platform admin access immediately.</p>
          </div>
        </div>

        {addStage === 'done' ? (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Admin account created.</p>
            <button
              onClick={resetAddFlow}
              className="mt-1 rounded-xl bg-white/[0.06] px-4 py-1.5 text-xs font-bold text-ink-200 hover:bg-white/[0.1]"
            >
              Add Another
            </button>
          </div>
        ) : addStage === 'otp' ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-ink-400">
              Enter the 6-digit code sent to <span className="font-semibold text-white">{adminUser?.email}</span> to
              confirm it's really you.
            </p>
            <input
              value={addOtpInput}
              onChange={(e) => setAddOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-white placeholder:text-ink-600 focus:border-cyan-500/50 focus:outline-none"
            />
            {addError && <p className="text-xs font-medium text-rose-400">{addError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmAddAdmin}
                disabled={addBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify & Create
              </button>
              <button
                onClick={handleRequestAddAdmin}
                disabled={addBusy}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-ink-300 hover:text-white"
              >
                Resend
              </button>
              <button
                onClick={resetAddFlow}
                disabled={addBusy}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-ink-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-cyan-500/50 focus:outline-none"
            />
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-cyan-500/50 focus:outline-none"
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-cyan-500/50 focus:outline-none"
            />
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password (min. 8 characters)"
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-cyan-500/50 focus:outline-none"
            />
            <input
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="Confirm password"
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-cyan-500/50 focus:outline-none"
            />
            {addError && <p className="text-xs font-medium text-rose-400">{addError}</p>}
            <button
              onClick={handleRequestAddAdmin}
              disabled={addBusy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
              Send Verification Code
            </button>
          </div>
        )}
      </div>

      {/* ── Change My Password ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Change My Password</h3>
            <p className="text-xs text-ink-400">Self-service only — signed in as {adminUser?.email}.</p>
          </div>
        </div>

        {pwStage === 'done' ? (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Password updated.</p>
            <button
              onClick={resetPwFlow}
              className="mt-1 rounded-xl bg-white/[0.06] px-4 py-1.5 text-xs font-bold text-ink-200 hover:bg-white/[0.1]"
            >
              Done
            </button>
          </div>
        ) : pwStage === 'otp' ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-ink-400">
              Enter the 6-digit code sent to <span className="font-semibold text-white">{adminUser?.email}</span> to
              confirm the password change.
            </p>
            <input
              value={pwOtpInput}
              onChange={(e) => setPwOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-white placeholder:text-ink-600 focus:border-amber-500/50 focus:outline-none"
            />
            {pwError && <p className="text-xs font-medium text-rose-400">{pwError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmPasswordChange}
                disabled={pwBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify & Update
              </button>
              <button
                onClick={handleRequestPasswordChange}
                disabled={pwBusy}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-ink-300 hover:text-white"
              >
                Resend
              </button>
              <button
                onClick={resetPwFlow}
                disabled={pwBusy}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-ink-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-amber-500/50 focus:outline-none"
            />
            <input
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="New password (min. 8 characters)"
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-amber-500/50 focus:outline-none"
            />
            <input
              value={pwNewConfirm}
              onChange={(e) => setPwNewConfirm(e.target.value)}
              placeholder="Confirm new password"
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-amber-500/50 focus:outline-none"
            />
            {pwError && <p className="text-xs font-medium text-rose-400">{pwError}</p>}
            <button
              onClick={handleRequestPasswordChange}
              disabled={pwBusy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Send Verification Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

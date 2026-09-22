import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AdminResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otp.trim().length !== 6) {
      setErrorMsg('Enter the 6-digit verification code from the email.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-password-reset', {
        body: { action: 'confirm', token, otp: otp.trim(), new_password: newPassword },
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to reset password.');
      }
      setIsDone(true);
      setTimeout(() => navigate('/login/admin'), 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset password. The link may have expired — request a new one.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07090e] font-sans text-white selection:bg-orange-500/30">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 0.95, 1], x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-orange-600/25 to-amber-500/10 blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 0.9, 1.1, 1], x: [0, -40, 30, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-blue-600/20 via-indigo-500/10 to-transparent blur-[140px]"
        />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          to="/login/admin"
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-ink-300 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px]"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-blue-600 opacity-75 blur-md" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-ink-950 p-2.5 shadow-2xl">
                  <img src="/logo.png" alt="TruCoach Logo" className="h-full w-full object-contain" />
                </div>
              </div>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Reset <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Password</span>
            </h1>
            <p className="mt-2 text-sm text-ink-300">
              Enter the code from your email and choose a new password.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-9 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-36 w-64 -translate-x-1/2 rounded-full bg-orange-500/15 blur-2xl" />

            {!token ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-10 text-center">
                <XCircle className="h-9 w-9 text-rose-400" />
                <p className="text-sm font-semibold text-white">Invalid reset link</p>
                <p className="text-xs leading-relaxed text-ink-400">
                  This link is missing its verification token. Request a new reset link from the sign-in page.
                </p>
                <Link
                  to="/login/admin"
                  className="mt-2 rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-bold text-ink-200 hover:bg-white/[0.1]"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : isDone ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-10 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Password updated.</p>
                <p className="text-xs text-ink-400">Redirecting to sign in...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-300 backdrop-blur">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-300">
                    6-Digit Verification Code
                  </label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 text-center text-xl font-bold tracking-[0.5em] text-white placeholder-ink-600 outline-none transition-all focus:border-orange-500/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-300">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-12 text-sm text-white placeholder-ink-400 outline-none transition-all focus:border-orange-500/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink-400 transition-colors hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-300">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-4 text-sm text-white placeholder-ink-400 outline-none transition-all focus:border-orange-500/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-60"
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>Verify & Update Password</span>
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

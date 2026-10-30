import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  signInAdmin,
  getAdminSession,
  supabase,
  sendAdminLoginOtp,
  markAdmin2faVerified,
  signOutAdmin,
  type AdminUser,
} from '@/lib/supabase';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingAdmin, setExistingAdmin] = useState<string | null>(null);

  // ── Two-Factor Verification Stage ─────────────────────────────────────
  const [stage, setStage] = useState<'password' | 'otp'>('password');
  const [pendingAdmin, setPendingAdmin] = useState<AdminUser | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const dispatchLoginOtp = async (admin: AdminUser) => {
    const code = await sendAdminLoginOtp(admin);
    setGeneratedOtp(code);
    setResendCooldown(30);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code.');
      return;
    }
    if (otpInput.trim() !== generatedOtp) {
      setOtpError('Incorrect code. Please check and try again.');
      return;
    }
    markAdmin2faVerified();
    setIsSuccess(true);
    setTimeout(() => navigate('/admin'), 1000);
  };

  const handleResendOtp = async () => {
    if (!pendingAdmin || resendCooldown > 0) return;
    setOtpError(null);
    setOtpBusy(true);
    try {
      await dispatchLoginOtp(pendingAdmin);
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to resend code.');
    } finally {
      setOtpBusy(false);
    }
  };

  const cancelOtpStage = async () => {
    setOtpBusy(true);
    try {
      await signOutAdmin();
    } finally {
      setStage('password');
      setPendingAdmin(null);
      setOtpInput('');
      setGeneratedOtp('');
      setOtpError(null);
      setOtpBusy(false);
    }
  };

  // ── Forgot Password Flow ──────────────────────────────────────────────
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotError(null);
    setForgotBusy(true);
    try {
      const { error } = await supabase.functions.invoke('admin-password-reset', {
        body: { action: 'request', email: forgotEmail.trim() },
      });
      if (error) throw new Error(error.message);
      setForgotSent(true);
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setForgotBusy(false);
    }
  };

  const resetForgotFlow = () => {
    setIsForgotMode(false);
    setForgotEmail('');
    setForgotSent(false);
    setForgotError(null);
  };

  // Check if session is already active
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getAdminSession();
        if (session) {
          setExistingAdmin(session.fullName || session.email);
        }
      } catch (err) {
        console.warn('Session check:', err);
      }
    }
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const admin = await signInAdmin(email.trim(), password);
      setPendingAdmin(admin);
      await dispatchLoginOtp(admin);
      setStage('otp');
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Invalid email or password. Please try again.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ink-950 font-sans text-white selection:bg-orange-500/30">
      {/* Subtle Ambient Background Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-600/15 blur-[140px]" />
        <div className="absolute -right-40 top-1/4 h-[550px] w-[550px] rounded-full bg-blue-600/15 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Top Bar Navigation */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-ink-300 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Login Workspace */}
      <main className="relative z-10 flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 pb-16 pt-2 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Logo & Simple Title */}
          <div className="mb-7 text-center">
            <Link to="/" className="inline-block mb-3 transition hover:opacity-90">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-lg backdrop-blur">
                <img
                  src="/logo.png"
                  alt="TruCoach Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome Back
            </h1>
            <p className="mt-1.5 text-xs text-ink-400 sm:text-sm">
              Sign in to manage your TruCoach account
            </p>
          </div>

          {/* Active Session Notification */}
          {existingAdmin && !isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Signed in as</p>
                  <p className="truncate text-xs font-bold text-white">{existingAdmin}</p>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="btn-primary shrink-0 !px-4 !py-2 !text-xs font-bold shadow-sm"
                >
                  Go to Dashboard →
                </button>
              </div>
            </motion.div>
          )}

          {/* Login Card Form */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {stage === 'otp' ? (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-white">Two-Step Verification</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
                    Enter the 6-digit verification code sent to{' '}
                    <span className="font-semibold text-white">{pendingAdmin?.email}</span>.
                  </p>
                </div>

                {otpError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{otpError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-center text-2xl font-bold tracking-[0.4em] text-white placeholder-ink-600 outline-none transition focus:border-orange-500 focus:bg-white/10 focus:ring-2 focus:ring-orange-500/20"
                  />

                  <button
                    type="submit"
                    disabled={isSuccess}
                    className="btn-primary w-full !py-3.5 !text-sm font-bold shadow-lg"
                  >
                    {isSuccess ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Redirecting...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={cancelOtpStage}
                    disabled={otpBusy}
                    className="font-medium text-ink-400 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpBusy || resendCooldown > 0}
                    className="font-semibold text-orange-400 hover:text-orange-300 disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                  </button>
                </div>
              </div>
            ) : isForgotMode ? (
              forgotSent ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-8 text-center">
                  <MailCheck className="h-9 w-9 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Check Your Email</h3>
                  <p className="text-xs leading-relaxed text-ink-400">
                    If <span className="font-semibold text-white">{forgotEmail}</span> is registered with us,
                    we've sent password reset instructions to your inbox.
                  </p>
                  <button
                    onClick={resetForgotFlow}
                    className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center">
                    <h2 className="font-display text-lg font-bold text-white">Reset Password</h2>
                    <p className="mt-1 text-xs text-ink-400">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>

                  {forgotError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="btn-primary w-full !py-3 !text-sm font-bold shadow-md disabled:opacity-60"
                  >
                    {forgotBusy ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetForgotFlow}
                    className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs font-medium text-ink-400 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-ink-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotMode(true)}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder-ink-500 outline-none transition focus:border-orange-500 focus:bg-white/10 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-400 transition hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="btn-primary w-full !py-3.5 !text-sm font-bold shadow-lg transition mt-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : isSuccess ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Success! Redirecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Simple Clean Footer */}
          <div className="mt-8 text-center text-xs text-ink-500">
            <p>© {new Date().getFullYear()} TruCoach. All rights reserved.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

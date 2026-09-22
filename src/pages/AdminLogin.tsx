import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Cpu,
  KeyRound,
  Loader2,
  MailCheck,
} from 'lucide-react';
import { signInAdmin, getAdminSession, supabase } from '@/lib/supabase';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingAdmin, setExistingAdmin] = useState<string | null>(null);

  // ── Forgot Password ────────────────────────────────────────────────────
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Enter your admin email address.');
      return;
    }
    setForgotError(null);
    setForgotBusy(true);
    try {
      const { error } = await supabase.functions.invoke('admin-password-reset', {
        body: { action: 'request', email: forgotEmail.trim() },
      });
      if (error) throw new Error(error.message);
      // Deliberately shown regardless of whether the email actually matched
      // a registered admin account — the edge function itself never
      // confirms or denies that either.
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

  // Check if already authenticated as Admin
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
      setErrorMsg('Please enter both admin email and password.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await signInAdmin(email.trim(), password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 1200);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Authentication failed. Please verify your credentials.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07090e] font-sans text-white selection:bg-orange-500/30">
      {/* Background Animated Gradients & Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Animated Radial Glows */}
        <motion.div
          animate={{
            scale: [1, 1.15, 0.95, 1],
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-orange-600/25 to-amber-500/10 blur-[130px]"
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1.1, 1],
            x: [0, -40, 30, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-blue-600/20 via-indigo-500/10 to-transparent blur-[140px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]"
        />

        {/* Ambient Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Subtle Scanline Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent" />
      </div>

      {/* Top Bar Navigation */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-ink-300 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to TruCoach Portal</span>
        </Link>

        {/* Security Trust Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Role-Based Access Control (RBAC Active)</span>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="relative z-10 flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px]"
        >
          {/* Brand Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center justify-center mb-4"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-blue-600 opacity-75 blur-md" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-ink-950 p-2.5 shadow-2xl">
                  <img
                    src="/logo.png"
                    alt="TruCoach Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
                <Sparkles className="h-3 w-3" />
                Platform Administration
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                SuperAdmin <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Console</span>
              </h1>
              <p className="mt-2 text-sm text-ink-300">
                Sign in with verified platform admin credentials to oversee academies, coaches, and platform finances.
              </p>
            </motion.div>
          </div>

          {/* If already signed in */}
          {existingAdmin && !isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Active Session Detected</p>
                    <p className="text-sm font-bold text-white">{existingAdmin}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-500 shadow-md hover:shadow-blue-500/25"
                >
                  <span>Open Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Login Card Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-9 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          >
            {/* Ambient inner rim glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-36 w-64 -translate-x-1/2 rounded-full bg-orange-500/15 blur-2xl" />

            {isForgotMode ? (
              forgotSent ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-10 text-center">
                  <MailCheck className="h-9 w-9 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Check your email</p>
                  <p className="text-xs leading-relaxed text-ink-400">
                    If <span className="font-semibold text-white">{forgotEmail}</span> is a registered platform admin
                    account, a reset link and verification code have been sent — both valid for 10 minutes.
                  </p>
                  <button
                    onClick={resetForgotFlow}
                    className="mt-2 rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-bold text-ink-200 hover:bg-white/[0.1]"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-display text-lg font-bold text-white">Reset Admin Password</h2>
                    <p className="mt-1 text-xs text-ink-400">
                      Enter your admin email — we'll send a reset link and verification code, valid for 10 minutes.
                    </p>
                  </div>

                  {forgotError && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-300 backdrop-blur">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-300">
                      Platform Admin Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@trucoach.co.in"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-4 text-sm text-white placeholder-ink-400 outline-none transition-all focus:border-orange-500/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-60"
                  >
                    {forgotBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    <span>Send Reset Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForgotFlow}
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </button>
                </form>
              )
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Shake Alert */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, x: -8 }}
                    animate={{ opacity: 1, height: 'auto', x: [0, -10, 10, -6, 6, -2, 2, 0] }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-300 backdrop-blur"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-300">
                  Platform Admin Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@trucoach.co.in"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-4 text-sm text-white placeholder-ink-400 outline-none transition-all focus:border-orange-500/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-300">
                    Master Password / Key
                  </label>
                  <span className="text-[11px] text-ink-400 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-orange-400" />
                    Encrypted
                  </span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
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
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading || isSuccess}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className={`relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-all ${
                  isSuccess
                    ? 'bg-emerald-500 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 shadow-orange-500/25 hover:shadow-orange-500/40'
                }`}
              >
                {/* Shimmer sweep */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Authenticating SuperAdmin...</span>
                  </div>
                ) : isSuccess ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Access Granted! Redirecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span>Authenticate & Launch Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </motion.button>
            </form>
            )}

            {/* Bottom Security Footer */}
            <div className="mt-7 border-t border-white/[0.08] pt-5 text-center">
              <p className="text-[11px] leading-relaxed text-ink-400">
                Protected by strict Zero-Trust cryptographic authentication. Unauthorized access attempts are monitored and logged to the security audit trail.
              </p>
            </div>
          </motion.div>

          {/* Trust badges footer */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-ink-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-400" />
              Direct Supabase Database
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              Row Level Security
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Live Mobile Parity
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

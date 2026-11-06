import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  RefreshCw,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ActionOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => Promise<void> | void;
  actionTitle: string;            // e.g. "Delete Coach Profile"
  targetName: string;             // e.g. "Poonam Daga"
  targetId: string;               // e.g. "uuid"
  actionType: string;             // e.g. "delete_coach", "delete_student", "update_split"
  dangerLevel?: 'high' | 'critical';
}

export function ActionOtpModal({
  isOpen,
  onClose,
  onVerified,
  actionTitle,
  targetName,
  targetId,
  actionType,
  dangerLevel = 'critical',
}: ActionOtpModalProps) {
  const [step, setStep] = useState<'request' | 'enter_otp' | 'success'>('request');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('admin@trucoach.co.in');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(300); // 5 mins in seconds

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setVerificationId(null);
      // Auto-trigger OTP request immediately on modal open
      handleRequestOtp();
    }
  }, [isOpen, targetId]);

  // Countdown timer
  useEffect(() => {
    if (step !== 'enter_otp') return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    try {
      // 1. Call RPC in Supabase to generate cryptographic OTP
      const { data, error } = await supabase.rpc('request_admin_action_otp', {
        p_action_type: actionType,
        p_target_id: targetId,
        p_target_name: targetName,
      });

      if (error) throw error;
      if (!data?.verification_id || !data?.code) {
        throw new Error('Failed to generate verification OTP. Please try again.');
      }

      setVerificationId(data.verification_id);
      setAdminEmail(data.admin_email || 'admin@trucoach.co.in');
      setCountdown(300);

      // 2. Dispatch OTP via send-email-notification edge function directly to admin@trucoach.co.in
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            action: 'support_ticket_admin_alert',
            to_email: data.admin_email || 'admin@trucoach.co.in',
            user_name: 'Platform SuperAdmin',
            user_phone: 'Internal Security System',
            role: 'superadmin',
            category: 'Security OTP Verification',
            subject: `🔐 [SECURITY ALERT] OTP for Severe Action: ${actionTitle}`,
            message: `A severe administrative action was requested on the TruCoach Admin Portal:\n\n• Action: ${actionTitle}\n• Target: ${targetName} (ID: ${targetId})\n• Verification OTP: ${data.code}\n\nThis OTP is valid for 5 minutes. If you did not initiate this action, please secure your admin account immediately.`,
            ticket_id: `SEC-${Date.now()}`,
          },
        });
      } catch (emailErr) {
        console.warn('Email dispatch warning:', emailErr);
      }

      setStep('enter_otp');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Error generating action OTP:', err);
      setErrorMessage(err?.message || 'Failed to request OTP. Ensure you are signed in as SuperAdmin.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    // Only accept numeric digit
    const cleaned = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted full OTP
      const chars = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      if (chars.length === 6) {
        handleVerifyOtp(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 filled
    if (newDigits.every((d) => d.length === 1)) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otpDigits.join('');
    if (code.length !== 6 || !verificationId) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.rpc('verify_admin_action_otp', {
        p_verification_id: verificationId,
        p_code: code,
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Verification failed. Incorrect OTP.');
      }

      setStep('success');

      // Execute authorized callback
      setTimeout(async () => {
        try {
          await onVerified();
          onClose();
        } catch (execErr: any) {
          setErrorMessage(execErr?.message || 'Action failed during execution.');
          setStep('enter_otp');
        }
      }, 700);
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setErrorMessage(err?.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 my-8 w-full max-w-lg overflow-hidden rounded-[2.25rem] border border-rose-500/30 bg-[#0c1018] text-white shadow-[0_32px_80px_-20px_rgba(244,63,94,0.3)]"
        >
          {/* Top energetic security ambient glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rose-500/20 via-transparent to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" /> 2-Step Admin Verification
              </span>
              <span className="text-[11px] font-mono text-ink-400">
                admin@trucoach.co.in
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-display text-xl font-bold text-white">
                Confirm {actionTitle}
              </h3>
              <p className="mt-1 text-xs text-ink-300">
                You are about to perform a severe action on <strong className="text-white font-bold">{targetName}</strong>. 
                A 6-digit OTP has been sent to the company SuperAdmin email to authenticate this change.
              </p>
            </div>

            {/* Target card banner */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-ink-400 text-[10px] uppercase">Target Entity</span>
                <p className="font-bold text-rose-300 truncate max-w-[280px]">{targetName}</p>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                {dangerLevel}
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {step === 'request' && (
              <div className="mt-8 text-center py-6">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-rose-400" />
                <p className="mt-3 text-xs font-bold text-ink-200">Generating secure OTP challenge...</p>
              </div>
            )}

            {step === 'enter_otp' && (
              <div className="mt-6">
                <label className="block text-xs font-bold text-ink-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>

                {/* 6 Digit Inputs */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="h-12 w-11 sm:h-14 sm:w-12 rounded-2xl border border-white/15 bg-white/5 text-center font-display text-xl sm:text-2xl font-bold text-white outline-none transition focus:border-rose-500 focus:bg-rose-500/10 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    />
                  ))}
                </div>

                {/* Countdown & Resend */}
                <div className="mt-4 flex items-center justify-between text-xs text-ink-400 px-1">
                  <span className="flex items-center gap-1 font-mono">
                    Expires in: <strong className="text-white">{formatCountdown(countdown)}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isRequesting || countdown > 240}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40 transition font-bold"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRequesting ? 'animate-spin' : ''}`} />
                    Resend Code
                  </button>
                </div>

                {/* Confirm Action Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isVerifying || otpDigits.some((d) => !d)}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 py-3.5 px-4 text-xs font-bold text-white shadow-xl shadow-rose-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-40"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying &amp; Authorizing Action...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Verify &amp; Execute Action</span>
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="mt-8 text-center py-6">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 animate-bounce" />
                <h4 className="mt-3 font-display text-lg font-bold text-white">Action Verified</h4>
                <p className="text-xs text-ink-300 mt-1">Executing authorized changes now...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


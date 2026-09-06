import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import {
  Smartphone,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Clock,
  UserX,
  FileText,
  ExternalLink,
} from 'lucide-react';

export function DeleteAccount() {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const emailTemplate = `Subject: TruCoach Account Deletion Request

Hi TruCoach Support Team,

I would like to request the permanent deletion of my TruCoach account and all associated personal data.

My Account Details:
- Registered Mobile Number: +91 [Enter your registered phone number]
- Registered Email Address: [Enter your email if linked]
- Account Role: [Parent / Coach / Academy Admin]
- Reason for Deletion (Optional): [Brief reason]

Please confirm once my account and personal data have been deleted.

Thank you.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const faqs = [
    {
      q: 'How fast is my account deleted when requested in-app?',
      a: 'When you initiate account deletion from within the TruCoach app and verify your identity via OTP, your account is queued and permanently deleted immediately without delay.',
    },
    {
      q: 'How long does a manual email deletion request take?',
      a: 'If you request deletion via email to support@trucoach.in, our compliance team will authenticate your account ownership and process the deletion within 2-4 business days.',
    },
    {
      q: 'What happens to my child’s academy attendance and fee records?',
      a: "If you are a parent, your child's past enrollment history (attendance records and fee receipts) is maintained within the coach's academy management register for their administrative accounting until the coach removes the student record. This notice is also clearly presented in-app before you confirm deletion.",
    },
    {
      q: 'Can I restore or reactivate my deleted account?',
      a: 'No. Account deletion is permanent and irreversible. All personal profile records, login tokens, and biometric links are purged. You are welcome to create a fresh account anytime with your phone number if you wish to rejoin.',
    },
    {
      q: 'Who can I contact for privacy grievances or compliance questions?',
      a: 'You can contact our Data Privacy & Grievance Officer directly at support@trucoach.in for any questions regarding DPDP Act 2023, Google Play Data Safety, or App Store compliance.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-ink-900 selection:bg-orange-500/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
          <Logo />

          <div className="flex items-center gap-4">
            <a
              href="/policies.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 sm:inline-block"
            >
              Legal &amp; Privacy Center
            </a>
            <Link
              to="/"
              className="btn-ghost !px-4 !py-2 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-[13px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-ink-50/50 py-16 sm:py-20">
        <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
        <div className="container-page text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            Google Play &amp; App Store Compliance
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl lg:text-5xl">
            How to Delete Your <span className="text-orange-500">TruCoach</span> Account
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
            We respect your privacy and data autonomy. You can delete your TruCoach account and associated personal data directly within the mobile app or by submitting a verified manual request.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <main className="container-page py-12 sm:py-16 space-y-16 max-w-5xl">

        {/* Section 1: In-App Account Deletion (Primary) */}
        <section id="in-app" className="scroll-mt-24">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-xs">
              1
            </span>
            <h2 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">
              In-App Account Deletion (Instant &amp; Self-Serve)
            </h2>
          </div>
          <p className="mt-2 text-ink-600">
            You can request deletion of your TruCoach account and associated data directly from within the app in 4 easy steps:
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="card-surface group relative flex flex-col justify-between p-6 transition-all duration-300 hover:border-orange-200 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-ink-200 group-hover:text-orange-400 transition-colors">
                    01
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <Smartphone className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-ink-900">
                  Open &amp; Log In
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Open the <strong>TruCoach app</strong> on your mobile device and log in to your registered account.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-surface group relative flex flex-col justify-between p-6 transition-all duration-300 hover:border-orange-200 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-ink-200 group-hover:text-orange-400 transition-colors">
                    02
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-ink-900">
                  Navigate to Settings
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Go to <span className="font-semibold text-ink-800">Profile &rarr; Settings &rarr; Delete Account</span>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-surface group relative flex flex-col justify-between p-6 transition-all duration-300 hover:border-orange-200 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-ink-200 group-hover:text-orange-400 transition-colors">
                    03
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <KeyRound className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-ink-900">
                  Verify with OTP
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Verify your identity by entering the secure <strong>OTP</strong> sent to your registered phone number.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="card-surface group relative flex flex-col justify-between p-6 transition-all duration-300 hover:border-red-200 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-ink-200 group-hover:text-red-400 transition-colors">
                    04
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                    <Trash2 className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-ink-900">
                  Confirm Deletion
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Review the in-app disclosure and tap <strong className="text-red-600">Confirm Deletion</strong> to permanently wipe your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Data Handling Breakdown */}
        <section id="data-handling" className="scroll-mt-24">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-xs">
              2
            </span>
            <h2 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">
              What Gets Deleted vs. What May Be Retained
            </h2>
          </div>
          <p className="mt-2 text-ink-600">
            In compliance with Google Play Data Safety policies, Apple App Store Review Guidelines (5.1.1), and DPDP Act 2023:
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* What gets deleted */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-emerald-950">
                    What Gets Deleted
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Purged upon confirmation
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3.5 text-sm text-emerald-900">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 font-bold" />
                  <span>
                    <strong>User Profile:</strong> Full name, phone number, email address, profile photograph, and personal bio.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 font-bold" />
                  <span>
                    <strong>Login Credentials:</strong> Session tokens, biometric enclave mappings, and authentication identifiers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 font-bold" />
                  <span>
                    <strong>Notification Tokens:</strong> Device push identifiers registered with OneSignal are removed immediately.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 font-bold" />
                  <span>
                    <strong>Personal Data &amp; Preferences:</strong> App preferences and files uploaded exclusively for your personal profile.
                  </span>
                </li>
              </ul>
            </div>

            {/* What may be retained */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-amber-950">
                    What May Be Retained &amp; Why
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    Limited operational &amp; statutory records
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3.5 text-sm text-amber-900">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>
                    <strong>Coach/Academy Enrollment Records:</strong> If you are a parent whose child is enrolled with a coach/academy, the child's enrollment records remain in that coach's academy records (attendance, fee history) until the coach separately removes the student — <em>this is disclosed in-app before you confirm deletion</em>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>
                    <strong>Statutory Tax &amp; Payment Compliance:</strong> Payment gateway transaction reference numbers (UTR, Order IDs) are preserved in accordance with RBI and Indian accounting compliance regulations.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Manual Deletion via Support Email */}
        <section id="manual-deletion" className="scroll-mt-24">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-xs">
              3
            </span>
            <h2 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">
              Unable to Access the App? Request Deletion via Email
            </h2>
          </div>
          <p className="mt-2 text-ink-600">
            If you're unable to access the app or have uninstalled it, you can email our support desk directly. We will authenticate and process your deletion within <strong>2-4 business days</strong>.
          </p>

          <div className="card-surface mt-8 overflow-hidden p-6 sm:p-8 bg-ink-50/40">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-ink-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Official Support Channel
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-ink-400" />
                  <a
                    href="mailto:support@trucoach.in"
                    className="font-display text-xl sm:text-2xl font-bold text-ink-950 hover:text-orange-600 transition-colors"
                  >
                    support@trucoach.in
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <span>Turnaround Time: Processed within 2-4 business days</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="mailto:support@trucoach.in?subject=TruCoach%20Account%20Deletion%20Request&body=Hi%20TruCoach%20Support%2C%0A%0AI%20would%20like%20to%20request%20the%20permanent%20deletion%20of%20my%20TruCoach%20account%20and%20associated%20personal%20data.%0A%0AMy%20Registered%20Details%3A%0A-%20Registered%20Phone%20Number%3A%20%0A-%20Registered%20Email%20Address%3A%20%0A-%20Account%20Role%20(Parent%20%2F%20Coach)%3A%20%0A-%20Reason%20for%20deletion%20(Optional)%3A%20%0A%0APlease%20confirm%20once%20my%20data%20has%20been%20deleted.%0A%0AThank%20you."
                  className="btn-primary !px-5 !py-3 !text-sm"
                >
                  <Mail className="h-4 w-4" />
                  <span>Open Email Client</span>
                </a>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="btn-ghost !px-5 !py-3 !text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied Template!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Email Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email template format */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                Template Preview:
              </h4>
              <div className="rounded-2xl border border-ink-200 bg-white p-4 font-mono text-xs sm:text-sm text-ink-700 leading-relaxed overflow-x-auto">
                <pre className="whitespace-pre-wrap font-sans">{emailTemplate}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: FAQs */}
        <section id="faqs" className="scroll-mt-24 pt-4 border-t border-ink-100">
          <h2 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-ink-600">
            Common questions regarding data deletion, account rights, and retention.
          </p>

          <div className="mt-6 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-ink-200/80 bg-white transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left font-display text-base font-bold text-ink-900 transition hover:bg-ink-50/50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-500' : ''
                        }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-ink-100 bg-ink-50/30 px-5 py-4 text-sm leading-relaxed text-ink-600">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Grievance & Compliance Box */}
        <div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h4 className="font-display text-lg font-bold text-ink-950">
              Need assistance or have privacy concerns?
            </h4>
            <p className="mt-1 text-sm text-ink-600">
              Our Data Privacy &amp; Grievance Officer is available at <span className="font-semibold text-orange-600">support@trucoach.in</span>.
            </p>
          </div>
          <a
            href="/policies.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !px-5 !py-2.5 !text-xs shrink-0 inline-flex items-center gap-2"
          >
            <span>Read Legal Policies</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 bg-ink-50/60 py-12">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-500">
            &copy; {new Date().getFullYear()} TruCoach. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-ink-500">
            <a href="/policies.html#privacy" target="_blank" rel="noopener noreferrer" className="hover:text-ink-900 transition-colors">Privacy Policy</a>
            <a href="/policies.html#datasafety" target="_blank" rel="noopener noreferrer" className="hover:text-ink-900 transition-colors">Data Safety</a>
            <a href="/policies.html#terms" target="_blank" rel="noopener noreferrer" className="hover:text-ink-900 transition-colors">Terms of Service</a>
            <a href="/policies.html#refunds" target="_blank" rel="noopener noreferrer" className="hover:text-ink-900 transition-colors">Refund Policy</a>
            <Link to="/delete-account" className="font-semibold text-orange-600 hover:text-orange-700">Delete Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

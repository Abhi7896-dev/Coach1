import { Fingerprint, KeyRound, Lock, ShieldCheck, Eye, ServerCog } from 'lucide-react';

const PILLARS = [
  {
    icon: Fingerprint,
    title: 'Biometric Lock',
    body: "App access gated behind fingerprint or face unlock. Only the registered guardian opens the child's records.",
  },
  {
    icon: KeyRound,
    title: 'OTP-based login',
    body: "Every sign-in is verified with a one-time password. No shared passwords, no stale sessions left open.",
  },
  {
    icon: Lock,
    title: 'Encrypted Student data',
    body: "Attendance, progress remarks, and personal details are encrypted in transit and at rest.",
  },
  {
    icon: Eye,
    title: 'Minimal data, maximum care',
    body: "We collect only what's needed to run the academy. Nothing is sold, nothing is shared with advertisers.",
  },
  {
    icon: ServerCog,
    title: 'Role-based access',
    body: "Coaches see their batches. Parents see their children. Nobody sees more than they should.",
  },
  {
    icon: ShieldCheck,
    title: 'Audit-ready receipts',
    body: "Every payment and attendance entry is timestamped and immutable — a clean trail you can trust.",
  },
];

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-24 overflow-hidden bg-ink-950 py-24 text-white lg:py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-green-500/10 blur-[120px]" />
        <div className="absolute inset-0 dot-bg opacity-20" />
      </div>

      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-200 backdrop-blur reveal">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            Reliable &amp; Secure
          </span>
          <h2 className="reveal mt-5 font-display text-3xl font-700 leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]">
            Built to protect
            <br />
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              what matters most.
            </span>
          </h2>
          <p className="reveal reveal-delay-1 mt-5 text-lg leading-relaxed text-ink-200">
            Student data and Multi-Tenant Privacy is sacred. TruCoach uses bank-grade security
            practices and strict HMAC-SHA256 signature verification so families can engage
            with total confidence — and coaches can focus on coaching, not compliance.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className={`reveal reveal-delay-${(i % 4) + 1} group rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-green-400/30 hover:bg-white/[0.07]`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/15 text-green-300 transition-colors group-hover:bg-green-400 group-hover:text-green-950">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-600 text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

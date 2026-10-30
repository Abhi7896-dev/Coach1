import React from 'react';
import { ShieldCheck, Award, Smartphone, CheckCircle2, Lock } from 'lucide-react';

export function TrustGuarantee() {
  const points = [
    {
      icon: ShieldCheck,
      title: 'Identity & Safety Verified',
      desc: 'All listed coaches & academies undergo vetting to ensure a trusted learning space.',
      color: 'text-green-600 bg-green-50 border-green-100',
    },
    {
      icon: Award,
      title: 'Certified Credentials',
      desc: 'Accredited coaching licenses, federation experience, and competition achievements.',
      color: 'text-orange-600 bg-orange-50 border-orange-100',
    },
    {
      icon: Smartphone,
      title: 'Parent App Integration',
      desc: 'Live attendance alerts, skill milestone remarks, and digital payment receipts.',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: Lock,
      title: 'Transparent & Secure',
      desc: 'Clear session schedules, direct trial bookings, and zero hidden commitments.',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            <ShieldCheck className="h-4 w-4" /> The TruCoach Standard
          </span>
          <h3 className="mt-2 font-display text-xl font-700 text-ink-950">
            Why Train with TruCoach Verified Profiles?
          </h3>
          <p className="mt-1 text-sm text-ink-500 max-w-xl">
            We ensure every student receives high-caliber mentorship in a supportive, secure sporting environment.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((pt, i) => {
          const Icon = pt.icon;
          return (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-ink-100 bg-ink-50/40 p-4 transition-all hover:bg-white hover:shadow-md hover:border-ink-200"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-xl border ${pt.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-ink-900">{pt.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{pt.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import {
  CalendarCheck,
  FileText,
  MessageSquareText,
  Bell,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const PARENT_IMG =
  'https://images.pexels.com/photos/28260827/pexels-photo-28260827.jpeg?auto=compress&cs=tinysrgb&h=900&w=1300';

const BENEFITS = [
  {
    icon: CalendarCheck,
    title: 'Live attendance',
    body: "The moment your child checks into a session, you know. No more wondering whether practice happened.",
  },
  {
    icon: MessageSquareText,
    title: 'Digital progress remarks',
    body: "Real, written feedback from the coach after sessions — strengths, areas to work on, milestones reached.",
  },
  {
    icon: FileText,
    title: 'Professional receipts',
    body: "Every payment generates a clean, shareable receipt delivered to your phone. Your records, always tidy.",
  },
  {
    icon: Bell,
    title: 'Event & reminder alerts',
    body: "Match days, schedule changes, and fee reminders arrive as WhatsApp notifications. You stay in the loop effortlessly.",
  },
];

export function ForParents() {
  return (
    <section
      id="parents"
      className="relative scroll-mt-24 overflow-hidden bg-blue-950 py-24 text-white lg:py-32"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-20 h-[500px] w-[500px] rounded-full bg-blue-500/25 blur-[120px]" />
        <div className="absolute -left-32 bottom-0 h-[440px] w-[440px] rounded-full bg-green-500/15 blur-[120px]" />
        <div className="absolute inset-0 grid-bg opacity-[0.12]" />
      </div>

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-200 backdrop-blur reveal">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              For the Parent
            </span>
            <h2 className="reveal mt-5 font-display text-3xl font-700 leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]">
              A transparent window into
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-green-300 bg-clip-text text-transparent">
                your child's growth.
              </span>
            </h2>
            <p className="reveal reveal-delay-1 mt-5 max-w-xl text-lg leading-relaxed text-ink-200">
              Peace of mind, in your pocket. See exactly what happens at practice,
              read what the coach thinks, and hold a tidy record of every payment —
              all without chasing anyone for updates.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.title}
                  className={`reveal reveal-delay-${(i % 4) + 1} group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/40 hover:bg-white/10`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300 transition-colors group-hover:bg-blue-400 group-hover:text-blue-950">
                    <b.icon className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-600 text-white">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">{b.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="reveal reveal-delay-2 relative mx-auto">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Soft background image */}
      <div className="absolute -inset-6 -z-10 overflow-hidden rounded-[2.5rem] opacity-30">
        <img
          src={PARENT_IMG}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          aria-hidden
        />
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] rounded-[2.6rem] border-[10px] border-ink-950 bg-ink-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:w-[300px]">
        <div className="overflow-hidden rounded-[1.9rem] bg-ink-50">
          {/* Notch */}
          <div className="relative flex justify-center pt-2">
            <div className="h-5 w-24 rounded-b-xl bg-ink-950" />
          </div>

          {/* Screen content */}
          <div className="px-4 pb-5 pt-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-medium text-ink-400">Good evening,</div>
                <div className="font-display text-base font-700 text-ink-950">Priya S.</div>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            {/* Child card */}
            <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  A
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">Aarav · Batch A</div>
                  <div className="text-[10px] text-ink-400">Velocity Academy</div>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  Present
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-50 px-2.5 py-2">
                <span className="text-[10px] font-medium text-ink-500">Attendance</span>
                <span className="text-[11px] font-bold text-ink-900">94% this month</span>
              </div>
            </div>

            {/* Progress remark */}
            <div className="mt-3 rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-orange-500" />
                <span className="text-[11px] font-semibold text-ink-900">Coach's remark</span>
                <span className="ml-auto text-[9px] text-ink-400">2h ago</span>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-ink-600">
                “Aarav's footwork improved sharply this week. Ready for the
                inter-academy match.”
              </p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[10px] font-semibold text-green-700">
                  Skill level up: Dribbling +2
                </span>
              </div>
            </div>

            {/* Receipt */}
            <div className="mt-3 rounded-2xl bg-ink-950 p-3.5 text-white">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                  <FileText className="h-3.5 w-3.5 text-blue-300" />
                  Receipt
                </span>
                <span className="text-[9px] text-ink-400">#RC-2048</span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-[9px] text-ink-400">Monthly fee</div>
                  <div className="font-display text-lg font-700">₹ 2,400</div>
                </div>
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold">
                  Paid
                </span>
              </div>
            </div>

            {/* Bottom nav */}
            <div className="mt-4 flex items-center justify-around rounded-2xl bg-white py-2.5 shadow-sm">
              {[CalendarCheck, MessageSquareText, FileText, Bell].map((Icon, i) => (
                <span
                  key={i}
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    i === 0 ? 'bg-blue-100 text-blue-600' : 'text-ink-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating: progress ring */}
      <div className="absolute -left-6 top-1/3 hidden animate-float rounded-2xl border border-white/10 bg-ink-900/90 p-3 shadow-glow backdrop-blur-xl sm:block">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Growth
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="relative grid h-10 w-10 place-items-center">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none" stroke="#3dcb7c" strokeWidth="3"
                strokeDasharray="94 100" strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">94%</span>
          </div>
          <span className="text-[10px] text-ink-300">On track</span>
        </div>
      </div>
    </div>
  );
}

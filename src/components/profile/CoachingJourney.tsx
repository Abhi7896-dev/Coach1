import React from 'react';
import {
  Calendar,
  Sparkles,
  MessageSquare,
  Trophy,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CoachingJourneyProps {
  targetName: string;
  targetType: 'coach' | 'academy';
  onOpenModal: () => void;
}

export function CoachingJourney({
  targetName,
  targetType,
  onOpenModal,
}: CoachingJourneyProps) {
  const isAcademy = targetType === 'academy';
  const shortName = targetName.split(' ')[0] || targetName;

  const STEPS = [
    {
      step: '01',
      title: 'Select Batch & Schedule',
      subtitle: 'Tailored for School Timetables',
      description:
        'Browse age-appropriate batches (Beginner, Intermediate, Pro) with flexible morning and evening training slots that balance easily with school hours.',
      icon: Calendar,
      color: 'from-orange-500 to-amber-500',
      badgeBg: 'bg-orange-50 border-orange-200 text-orange-700',
      highlight: 'Morning & Evening Batches',
    },
    {
      step: '02',
      title: 'Book a Free Trial Session',
      subtitle: 'Hands-on In-Person Experience',
      description: isAcademy
        ? `Visit ${targetName} grounds for an introductory trial session, assess facilities, and meet certified coaching staff.`
        : `Meet ${targetName} at the training grounds for a one-on-one skill assessment and firsthand coaching experience.`,
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-500',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
      highlight: 'Zero Upfront Commitment',
    },
    {
      step: '03',
      title: 'Live WhatsApp Attendance',
      subtitle: 'Instant Arrival Notifications',
      description:
        'The moment your child checks in at the training grounds, TruCoach registers attendance and delivers an instant WhatsApp alert directly to parents.',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-500',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      highlight: '100% Parent Peace of Mind',
    },
    {
      step: '04',
      title: 'Monthly Skill Progression',
      subtitle: 'Scorecards & Coach Remarks',
      description:
        'Track technical development, agility benchmarks, attendance consistency, and personalized remarks from coaches in monthly digital report cards.',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
      highlight: 'Measurable Athlete Growth',
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
      {/* Section Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-600">
            <Sparkles className="h-3.5 w-3.5" /> 4-Step Training Journey
          </span>
          <h2 className="mt-3 font-display text-2xl font-700 tracking-tight text-ink-950 sm:text-3xl">
            How Coaching with {isAcademy ? targetName : `Coach ${shortName}`} Works
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-ink-500">
            From the first free trial session to continuous athletic milestones, we keep parents in the loop at every step.
          </p>
        </div>
      </div>

      {/* 4 Step Timeline Grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-100 bg-ink-50/50 p-5 transition-all duration-300 hover:border-orange-200 hover:bg-white hover:shadow-md"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-400">
                        Step {s.step}
                      </span>
                      <h3 className="font-display text-base font-700 text-ink-950 leading-tight">
                        {s.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Subtitle & Description */}
                <p className="mt-3 text-xs leading-relaxed text-ink-600">
                  {s.description}
                </p>
              </div>

              {/* Step Pill Highlight */}
              <div className="mt-4 pt-3 border-t border-ink-100/70 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${s.badgeBg}`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {s.highlight}
                </span>
                <span className="text-[11px] font-bold text-ink-400 group-hover:text-orange-600 transition-colors flex items-center gap-0.5">
                  Details <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Footer Ribbon */}
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display text-base font-700 text-white">
              Ready to take the first step?
            </h4>
            <p className="text-xs text-ink-300 mt-0.5">
              Download the official TruCoach App to book a free trial and view active batches.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="btn-primary shrink-0 !px-5 !py-3 !text-xs font-bold shadow-glow-orange w-full sm:w-auto justify-center"
        >
          <Smartphone className="h-4 w-4" />
          Get the TruCoach App
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Loader2,
  ArrowLeft,
  Sparkles,
  Users,
  ShieldCheck,
  Share2,
  Check,
  Trophy,
  Award,
  Calendar,
  ExternalLink,
  QrCode,
  Compass,
  Navigation,
  ChevronRight,
  GraduationCap,
  Activity,
  Layers,
  Search,
  Smartphone,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getAcademyBySlugOrId, DirectoryAcademy, AcademyRosterCoach } from '@/lib/directoryData';
import { getSportConfig } from '@/lib/sportUtils';
import { AppDownloadModal } from '@/components/profile/AppDownloadModal';
import { JoinAppCard } from '@/components/profile/JoinAppCard';
import { CoachingJourney } from '@/components/profile/CoachingJourney';
import { ShareQrModal } from '@/components/profile/ShareQrModal';
import { TrustGuarantee } from '@/components/profile/TrustGuarantee';

const AVATAR_GRADIENTS = [
  'from-orange-600 via-amber-600 to-orange-700',
  'from-blue-600 via-indigo-600 to-blue-700',
  'from-emerald-600 via-teal-600 to-emerald-700',
  'from-purple-600 via-violet-600 to-indigo-700',
];

function getSeedGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function AcademyProfile() {
  const { id } = useParams<{ id: string }>();
  const [academy, setAcademy] = useState<DirectoryAcademy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter state for coaches
  const [coachFilterSport, setCoachFilterSport] = useState<string>('all');
  const [coachSearch, setCoachSearch] = useState<string>('');

  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    setLoading(true);
    getAcademyBySlugOrId(id)
      .then((data) => {
        if (!data) setNotFound(true);
        else setAcademy(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: academy?.name || 'TruCoach Academy', url });
        return;
      }
    } catch {
      // cancelled or unsupported
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard blocked
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex min-h-[75vh] flex-col items-center justify-center gap-3 pt-20">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
            <GraduationCap className="absolute inset-0 m-auto h-5 w-5 text-orange-500 animate-pulse" />
          </div>
          <p className="font-display text-sm font-semibold text-ink-500">Loading Academy Profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !academy) {
    return (
      <div className="min-h-screen bg-ink-50/40">
        <Navbar />
        <div className="container-page flex min-h-[75vh] flex-col items-center justify-center gap-4 pt-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-orange-100 text-orange-600 shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-700 text-ink-950">This Academy Page isn't available</h1>
          <p className="max-w-md text-sm leading-relaxed text-ink-500">
            The academy link may have changed or the academy has been updated. Explore other verified sports academies in your city!
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link to="/academies" className="btn-primary !px-6 !py-3 !text-sm">
              <ArrowLeft className="h-4 w-4" /> Discover Academies & Coaches
            </Link>
            <Link to="/" className="btn-ghost !px-6 !py-3 !text-sm">
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Sports list: combine academy.sports_offered and coaches' sports if academy array is empty
  const allSports = Array.from(
    new Set([
      ...(academy.sports_offered || []),
      ...(academy.coaches || []).flatMap((c) => c.sports_offered || []),
    ])
  ).filter(Boolean);

  const coachesList = academy.coaches || [];

  // Filter coaches by sport and search text
  const filteredCoaches = coachesList.filter((c) => {
    const matchesSport =
      coachFilterSport === 'all' ||
      (c.sports_offered && c.sports_offered.some((s) => s.toLowerCase() === coachFilterSport.toLowerCase()));
    const matchesSearch =
      !coachSearch.trim() ||
      (c.name && c.name.toLowerCase().includes(coachSearch.toLowerCase())) ||
      (c.designation && c.designation.toLowerCase().includes(coachSearch.toLowerCase()));
    return matchesSport && matchesSearch;
  });

  // Google Maps navigation link
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [academy.name, academy.locality, academy.pincode].filter(Boolean).join(' ')
  )}`;

  return (
    <div className="min-h-screen bg-ink-50/50">
      <Navbar />

      <main className="pt-20 sm:pt-24 pb-20">
        {/* Dynamic Campus Hero */}
        <section className="relative overflow-hidden bg-ink-950 text-white">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute -left-48 -top-48 h-[550px] w-[550px] rounded-full bg-orange-600/25 blur-[130px]" />
            <div className="absolute -right-48 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/25 blur-[140px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/60 to-ink-950" />
          </div>

          <div className="container-page relative pb-16 pt-8 sm:pb-20 sm:pt-12">
            {/* Navigation links & share trigger */}
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/academies"
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-ink-300 backdrop-blur transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
                All Academies & Coaches
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  title="Share or View QR code"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">QR Code</span>
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Academy Identity Hero Row */}
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Academy Emblem / Logo */}
                <div className="relative shrink-0">
                  <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-white/20 bg-ink-900 shadow-2xl sm:h-36 sm:w-36">
                    {academy.logo_url ? (
                      <img src={academy.logo_url} alt={academy.name} className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className={`grid h-full w-full place-items-center bg-gradient-to-br ${getSeedGradient(
                          academy.id
                        )} font-display text-4xl font-700 text-white shadow-inner`}
                      >
                        {academy.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Active Admissions Beacon */}
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-ink-900/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 shadow-md backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Admissions Open
                  </span>
                </div>

                {/* Academy Title & Location */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30 backdrop-blur">
                      <GraduationCap className="h-3.5 w-3.5" /> Sports Academy
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/30 backdrop-blur">
                      <ShieldCheck className="h-3.5 w-3.5" /> TruCoach Verified Partner
                    </span>
                  </div>

                  <h1 className="mt-2.5 font-display text-3xl font-700 tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {academy.name}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-300">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-ink-300 hover:text-white transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-orange-400" />
                      {[academy.locality, academy.pincode].filter(Boolean).join(' · ') || 'Campus Location on File'}
                    </a>

                    <span className="inline-flex items-center gap-1 text-ink-300">
                      <Users className="h-3.5 w-3.5 text-blue-400" />
                      {coachesList.length} Roster Coaches
                    </span>

                    {allSports.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-ink-300">
                        <Activity className="h-3.5 w-3.5 text-emerald-400" />
                        {allSports.length} Sports Disciplines
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAppModalOpen(true)}
                  className="btn-primary flex-1 sm:flex-initial !px-6 !py-3.5 !text-sm font-bold shadow-lg"
                >
                  <Smartphone className="h-4 w-4" /> Contact Academy Admin
                </button>

                <a
                  href="#coaches-roster"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <Users className="h-4 w-4" /> Explore Coaches ({coachesList.length})
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* High-Impact Stats Strip */}
        <section className="container-page -mt-8 relative z-20">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Coaching Staff</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-700 text-ink-950 sm:text-3xl">
                {coachesList.length > 0 ? `${coachesList.length} Coaches` : 'Certified'}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">Qualified On-ground Mentors</p>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Disciplines</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-700 text-ink-950 sm:text-3xl">
                {allSports.length > 0 ? `${allSports.length} Sports` : 'Multi-Sport'}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">Training Programs Offered</p>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Facility Status</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-xl font-700 text-ink-950 sm:text-2xl">
                Verified Campus
              </div>
              <p className="mt-0.5 text-xs text-green-600 font-semibold">Inspected Training Grounds</p>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">App Ecosystem</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-xl font-700 text-ink-950 sm:text-2xl">
                TruCoach Live
              </div>
              <p className="mt-0.5 text-xs text-purple-600 font-semibold">Attendance &amp; Progress</p>
            </div>
          </div>
        </section>

        {/* Main Body */}
        <div className="container-page mt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Left Column: Academy Details */}
            <div className="space-y-8">
              {/* About Academy Card */}
              <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-700 text-ink-950">About {academy.name}</h2>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                    Verified Academy
                  </span>
                </div>

                {academy.description ? (
                  <p className="mt-4 text-base leading-relaxed text-ink-700 whitespace-pre-line">
                    {academy.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-ink-500 italic">
                    {academy.name} is dedicated to fostering grassroots athletic talent through disciplined training regimens, certified coaching staff, and modern sporting infrastructure.
                  </p>
                )}
              </div>

              {/* Sports Offered Disciplines Grid */}
              {allSports.length > 0 && (
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                        <Activity className="h-5 w-5 text-orange-500" />
                        Sports Programs &amp; Disciplines
                      </h2>
                      <p className="mt-1 text-xs text-ink-500">
                        Specialized coaching batches available across these sports:
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {allSports.map((sport) => {
                      const cfg = getSportConfig(sport);
                      const Icon = cfg.icon;
                      const coachesCount = coachesList.filter((c) =>
                        (c.sports_offered || []).some((s) => s.toLowerCase() === sport.toLowerCase())
                      ).length;

                      return (
                        <div
                          key={sport}
                          className="flex items-start gap-3.5 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-orange-200"
                        >
                          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${cfg.gradient} text-white shadow-sm`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-display text-sm font-bold text-ink-950">{sport}</h4>
                            <p className="mt-0.5 text-xs text-ink-500">
                              {coachesCount > 0 ? `${coachesCount} Coach${coachesCount > 1 ? 'es' : ''}` : 'Batch Available'}
                            </p>
                            <span className="mt-2 inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-600 border border-ink-200">
                              Beginner to Pro
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coaches Roster Section (Clickable Profiles) */}
              <div id="coaches-roster" className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8 scroll-mt-24">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                      <Users className="h-5 w-5 text-blue-500" />
                      Our Coaching Staff ({coachesList.length})
                    </h2>
                    <p className="mt-1 text-xs text-ink-500">
                      Click any coach profile to view their achievements, gallery, and certifications.
                    </p>
                  </div>

                  {/* Sport Filter Chips if more than 1 sport */}
                  {allSports.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setCoachFilterSport('all')}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${coachFilterSport === 'all'
                            ? 'bg-ink-950 text-white'
                            : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                          }`}
                      >
                        All ({coachesList.length})
                      </button>
                      {allSports.map((s) => (
                        <button
                          key={s}
                          onClick={() => setCoachFilterSport(s)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${coachFilterSport === s
                              ? 'bg-orange-500 text-white'
                              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coaches Grid */}
                {filteredCoaches.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 p-8 text-center text-sm text-ink-500">
                    No coaches found for this filter.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {filteredCoaches.map((c: AcademyRosterCoach) => (
                      <Link
                        key={c.id}
                        to={`/coach/${c.id}`}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                      >
                        <div>
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 shadow-sm">
                              {c.profile_image_url ? (
                                <img
                                  src={c.profile_image_url}
                                  alt={c.name || 'Coach'}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div
                                  className={`grid h-full w-full place-items-center bg-gradient-to-br ${getSeedGradient(
                                    c.id
                                  )} font-display text-xl font-700 text-white`}
                                >
                                  {(c.name || 'C').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="truncate font-display text-base font-700 text-ink-950 group-hover:text-orange-600 transition-colors">
                                  {c.name || 'Coach'}
                                </h3>
                                {c.is_verified && (
                                  <span title="Verified Coach">
                                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs font-medium text-ink-500">
                                {c.designation || 'Sports Coach'}
                              </p>

                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {c.years_of_experience != null && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    <Trophy className="h-3 w-3" /> {c.years_of_experience}+ yrs exp
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sports badges */}
                          {c.sports_offered && c.sports_offered.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3">
                              {c.sports_offered.map((sport) => {
                                const cfg = getSportConfig(sport);
                                return (
                                  <span
                                    key={sport}
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} border`}
                                  >
                                    {sport}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Action link strip */}
                        <div className="mt-4 flex items-center justify-between pt-2 text-xs font-bold text-orange-600 group-hover:text-orange-700">
                          <span>View Full Profile</span>
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Trust & Safety Standard */}
              <TrustGuarantee />

              {/* 4-Step Coaching Journey */}
              <CoachingJourney
                targetName={academy.name}
                targetType="academy"
                onOpenModal={() => setIsAppModalOpen(true)}
              />
            </div>

            {/* Right Sidebar: Sticky Action & Location Card */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              {/* User-Requested Join App Card Sidebar */}
              <JoinAppCard
                targetName={academy.name}
                targetType="academy"
                onOpenModal={() => setIsAppModalOpen(true)}
                variant="sidebar"
              />

              {/* Campus Location Card */}
              <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Campus Grounds</span>
                <div className="mt-2 flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-700 text-ink-950">
                      {[academy.locality, academy.pincode].filter(Boolean).join(' · ') || 'Local Campus Facility'}
                    </h4>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Sports grounds with professional equipment and coaching facilities.
                    </p>
                  </div>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-bold text-ink-800 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Get Directions in Google Maps
                </a>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        targetName={academy.name}
        targetType="academy"
      />

      {/* Share / QR Modal */}
      <ShareQrModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={academy.name}
        subtitle={`Discover ${academy.name} on TruCoach`}
      />

      {/* Mobile Sticky Floating Bottom Dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 p-3 backdrop-blur-lg sm:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
              {academy.logo_url ? (
                <img src={academy.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className={`grid h-full w-full place-items-center bg-gradient-to-br ${getSeedGradient(
                    academy.id
                  )} text-xs font-bold text-white`}
                >
                  {academy.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink-950">{academy.name}</p>
              <p className="truncate text-[10px] text-ink-500">
                {allSports[0] || 'Sports Academy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink-200 bg-white text-ink-800"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsAppModalOpen(true)}
              className="btn-primary !px-4 !py-2.5 !text-xs font-bold"
            >
              <Smartphone className="h-3.5 w-3.5" /> Get the App
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

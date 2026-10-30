import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Loader2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Trophy,
  Users,
  Link2,
  Share2,
  Check,
  Award,
  Images,
  FileBadge,
  Calendar,
  ExternalLink,
  QrCode,
  Compass,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Maximize2,
  ChevronRight,
  BadgeCheck,
  Medal,
  Clock,
  Navigation,
  Smartphone,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getCoachBySlugOrId, DirectoryCoach } from '@/lib/directoryData';
import { getSportConfig } from '@/lib/sportUtils';
import { ProfileLightbox } from '@/components/profile/ProfileLightbox';
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

function getSocialDetails(url: string | null) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com')) return { label: 'Instagram', icon: Instagram, color: 'text-pink-600 hover:border-pink-300' };
  if (lower.includes('linkedin.com')) return { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600 hover:border-blue-300' };
  if (lower.includes('twitter.com') || lower.includes('x.com')) return { label: 'Twitter / X', icon: Twitter, color: 'text-sky-500 hover:border-sky-300' };
  return { label: 'Website / Social', icon: Globe, color: 'text-orange-600 hover:border-orange-300' };
}

export function CoachProfile() {
  const { id } = useParams<{ id: string }>();
  const [coach, setCoach] = useState<DirectoryCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    setLoading(true);
    getCoachBySlugOrId(id)
      .then((data) => {
        if (!data) setNotFound(true);
        else setCoach(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: coach?.name || 'TruCoach Profile', url });
        return;
      }
    } catch {
      // user cancelled or share unsupported
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
            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-orange-500 animate-pulse" />
          </div>
          <p className="font-display text-sm font-semibold text-ink-500">Loading Coach Profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !coach) {
    return (
      <div className="min-h-screen bg-ink-50/40">
        <Navbar />
        <div className="container-page flex min-h-[75vh] flex-col items-center justify-center gap-4 pt-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-orange-100 text-orange-600 shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-700 text-ink-950">This Coach Profile isn't available</h1>
          <p className="max-w-md text-sm leading-relaxed text-ink-500">
            The coach profile may have been updated, relocated, or this link is no longer active. Discover more accredited coaches near you!
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link to="/academies" className="btn-primary !px-6 !py-3 !text-sm">
              <ArrowLeft className="h-4 w-4" /> Discover Coaches & Academies
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

  const primarySport = coach.sports_offered?.[0] || 'Sports';
  const sportConfig = getSportConfig(primarySport);
  const socialInfo = getSocialDetails(coach.social_link);

  // Google Maps navigation link
  const mapsUrl = coach.latitude && coach.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${coach.latitude},${coach.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([coach.name, coach.locality, coach.pincode].filter(Boolean).join(' '))}`;

  const hasAchievements = coach.achievements && coach.achievements.length > 0;
  const hasGallery = coach.gallery_urls && coach.gallery_urls.length > 0;
  const hasCertifications = coach.certification_urls && coach.certification_urls.length > 0;
  const hasSpecializations = coach.title_tags && coach.title_tags.length > 0;

  return (
    <div className="min-h-screen bg-ink-50/50">
      <Navbar />

      <main className="pt-20 sm:pt-24 pb-20">
        {/* Top Breadcrumb & Hero Cover */}
        <section className="relative overflow-hidden bg-ink-950 text-white">
          {/* Athletic mesh gradient backgrounds */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute -left-48 -top-48 h-[550px] w-[550px] rounded-full bg-orange-600/20 blur-[130px]" />
            <div className="absolute -right-48 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[140px]" />
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
                All Coaches & Academies
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

            {/* Profile Header Main Identity */}
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Large Profile Avatar */}
                <div className="relative shrink-0">
                  <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-white/20 bg-ink-900 shadow-2xl sm:h-36 sm:w-36">
                    {coach.profile_image_url ? (
                      <img
                        src={coach.profile_image_url}
                        alt={coach.name || 'Coach'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`grid h-full w-full place-items-center bg-gradient-to-br ${getSeedGradient(coach.id)} font-display text-4xl font-700 text-white shadow-inner`}
                      >
                        {(coach.name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-ink-900/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 shadow-md backdrop-blur"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Available
                  </span>
                </div>

                {/* Name, Designation & Badges */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30 backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5" /> Certified Coach
                    </span>
                    {coach.is_verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/30 backdrop-blur">
                        <ShieldCheck className="h-3.5 w-3.5" /> TruCoach Verified
                      </span>
                    )}
                  </div>

                  <h1 className="mt-2.5 font-display text-3xl font-700 tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {coach.name || 'Coach'}
                  </h1>

                  <p className="mt-1.5 text-base font-semibold text-ink-300 sm:text-lg">
                    {coach.designation || 'Head Coach'}
                    {coach.academy_name && (
                      <span className="text-white">
                        {' '}
                        · <span className="text-orange-400 font-bold">{coach.academy_name}</span>
                      </span>
                    )}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-300">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-ink-300 hover:text-white transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-orange-400" />
                      {[coach.locality, coach.pincode].filter(Boolean).join(' · ') || 'Location on file'}
                    </a>

                    {coach.years_of_experience != null && (
                      <span className="inline-flex items-center gap-1 text-ink-300">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        {coach.years_of_experience}+ Years Experience
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Header */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAppModalOpen(true)}
                  className="btn-primary flex-1 sm:flex-initial !px-6 !py-3.5 !text-sm font-bold shadow-lg"
                >
                  <Smartphone className="h-4 w-4" /> Contact Coach
                </button>

                {socialInfo && coach.social_link && (
                  <a
                    href={coach.social_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <socialInfo.icon className="h-4 w-4" />
                    <span>{socialInfo.label}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* High-Impact Stat Strip */}
        <section className="container-page -mt-8 relative z-20">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Experience</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <Trophy className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-700 text-ink-950 sm:text-3xl">
                {coach.years_of_experience != null ? `${coach.years_of_experience}+` : 'Certified'}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">Years in Sports Mentorship</p>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Athletes</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-700 text-ink-950 sm:text-3xl">
                {coach.total_students_taught != null && coach.total_students_taught > 0
                  ? `${coach.total_students_taught}+`
                  : 'Active'}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">Students & Trainees Taught</p>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Discipline</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Award className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-xl font-700 text-ink-950 sm:text-2xl truncate">
                {primarySport}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">
                {(coach.sports_offered?.length || 1) > 1 ? `+${coach.sports_offered!.length - 1} more sports` : 'Primary Focus'}
              </p>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,18,25,0.08)] transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Accreditation</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-green-50 text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-xl font-700 text-ink-950 sm:text-2xl">
                100% Vetted
              </div>
              <p className="mt-0.5 text-xs text-green-600 font-semibold">TruCoach Verified Safe</p>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <div className="container-page mt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Left Column: Rich Sections */}
            <div className="space-y-8">
              {/* Sports Offered Showcase */}
              {coach.sports_offered && coach.sports_offered.length > 0 && (
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                    <sportConfig.icon className="h-5 w-5 text-orange-500" />
                    Sports &amp; Disciplines Offered
                  </h2>
                  <p className="mt-1 text-xs text-ink-500">
                    Professional training programs and coaching sessions available for these sports:
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {coach.sports_offered.map((sport) => {
                      const cfg = getSportConfig(sport);
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={sport}
                          className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50/70 px-4 py-2.5 transition hover:bg-white hover:border-orange-300 hover:shadow-sm"
                        >
                          <span className={`grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br ${cfg.gradient} text-white shadow-sm`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm font-bold text-ink-900">{sport}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bio & Philosophy Section */}
              <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-700 text-ink-950">About Coach {(coach.name || '').split(' ')[0]}</h2>
                  <span className="text-xs font-semibold text-ink-400">Coach Profile</span>
                </div>

                {coach.bio ? (
                  <p className="mt-4 text-base leading-relaxed text-ink-700 whitespace-pre-line">
                    {coach.bio}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-ink-500 italic">
                    Passionate sports trainer dedicated to cultivating athletic excellence, technique discipline, and sportsmanship. Download the TruCoach app to book trials and explore batches.
                  </p>
                )}

                {/* Specialization Tags */}
                {hasSpecializations && (
                  <div className="mt-6 border-t border-ink-100 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400">Coaching Focus &amp; Specializations</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {coach.title_tags!.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-ink-200 bg-ink-50 px-3.5 py-1.5 text-xs font-semibold text-ink-800 transition hover:bg-ink-100"
                        >
                          ⭐ {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Achievements Showcase */}
              {hasAchievements && (
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Key Achievements &amp; Honors
                    </h2>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                      {coach.achievements!.length} Honors
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Recognized milestones from competitive tournaments and career coaching achievements.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {coach.achievements!.map((ach, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3.5 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm transition hover:shadow-md hover:border-amber-200"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm">
                          <Medal className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Honor #{idx + 1}</span>
                          <p className="mt-0.5 text-sm font-semibold text-ink-900 leading-snug">{ach}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Photo Gallery with Lightbox */}
              {hasGallery && (
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                        <Images className="h-5 w-5 text-blue-500" />
                        Training &amp; Action Gallery
                      </h2>
                      <p className="mt-1 text-xs text-ink-500">
                        Click any image to view in high resolution fullscreen.
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {coach.gallery_urls!.length} Photos
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {coach.gallery_urls!.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <img
                          src={url}
                          alt={`${coach.name || 'Coach'} gallery ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-ink-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink-950 shadow-lg backdrop-blur">
                            <Maximize2 className="h-4 w-4" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications & Badges */}
              {hasCertifications && (
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                        <FileBadge className="h-5 w-5 text-green-600" />
                        Verified Certifications &amp; Credentials
                      </h2>
                      <p className="mt-1 text-xs text-ink-500">
                        Official certificates, coaching diplomas, and federation accreditations.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {coach.certification_urls!.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-green-100 bg-green-50/40 p-4 transition-all hover:bg-green-50 hover:border-green-300 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-600 text-white shadow-sm">
                            <FileBadge className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">Verified Document</span>
                            <h4 className="text-sm font-bold text-ink-900 group-hover:text-green-800">
                              Certificate #{i + 1}
                            </h4>
                          </div>
                        </div>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink-600 shadow-xs group-hover:text-green-700">
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust & Safety Standard */}
              <TrustGuarantee />

              {/* 4-Step Coaching Journey */}
              <CoachingJourney
                targetName={coach.name || 'Coach'}
                targetType="coach"
                onOpenModal={() => setIsAppModalOpen(true)}
              />
            </div>

            {/* Right Sidebar: Sticky Action & Location Card */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              {/* User-Requested Join App Card Sidebar */}
              <JoinAppCard
                targetName={coach.name || 'Coach'}
                targetType="coach"
                onOpenModal={() => setIsAppModalOpen(true)}
                variant="sidebar"
              />

              {/* Academy Affiliation (if present) */}
              {coach.academy_name && (
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Home Academy</span>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-base font-700 text-ink-950">{coach.academy_name}</h4>
                      <p className="text-xs text-ink-500 mt-0.5">Official Partner Academy</p>
                    </div>
                    <Link
                      to={`/academies`}
                      className="grid h-8 w-8 place-items-center rounded-xl bg-ink-50 text-ink-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      title="Explore Academy"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Location & Directions Card */}
              <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Training Location</span>
                <div className="mt-2 flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-700 text-ink-950">
                      {[coach.locality, coach.pincode].filter(Boolean).join(' · ') || 'Local Training Grounds'}
                    </h4>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Convenient access for athletes and students.
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

      {/* Lightbox Modal */}
      {hasGallery && (
        <ProfileLightbox
          images={coach.gallery_urls!}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(i) => setLightboxIndex(i)}
          title={`${coach.name || 'Coach'} Gallery`}
        />
      )}

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        targetName={coach.name || 'Coach'}
        targetType="coach"
      />

      {/* Share / QR Modal */}
      <ShareQrModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={coach.name || 'Coach Profile'}
        subtitle={`Connect with Coach ${coach.name || ''} on TruCoach`}
      />

      {/* Mobile Sticky Floating Bottom Dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 p-3 backdrop-blur-lg sm:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
              {coach.profile_image_url ? (
                <img src={coach.profile_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className={`grid h-full w-full place-items-center bg-gradient-to-br ${getSeedGradient(coach.id)} text-xs font-bold text-white`}>
                  {(coach.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink-950">{coach.name || 'Coach'}</p>
              <p className="truncate text-[10px] text-ink-500">{primarySport}</p>
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

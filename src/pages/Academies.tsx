import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Navigation,
  MapPin,
  Loader2,
  Sparkles,
  ShieldCheck,
  Trophy,
  Users,
  GraduationCap,
  Filter,
  X,
  ChevronDown,
  Activity,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { searchAcademies, searchCoaches, DirectoryAcademy, DirectoryCoach } from '@/lib/directoryData';
import { getSportConfig } from '@/lib/sportUtils';

const MIN_RESULTS_FOR_GRID = 1;

const AVATAR_COLORS = [
  'from-orange-500 to-orange-600',
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-indigo-600',
];

function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

type Tab = 'all' | 'academies' | 'coaches';

export function Academies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialQ = searchParams.get('q') || '';
  const initialSport = searchParams.get('sport') || 'all';
  const initialLoc = searchParams.get('location') || 'all';

  const [tab, setTab] = useState<Tab>('all');
  const [searchInput, setSearchInput] = useState(initialQ);
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLoc);

  const [rawAcademies, setRawAcademies] = useState<DirectoryAcademy[]>([]);
  const [rawCoaches, setRawCoaches] = useState<DirectoryCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const runSearch = (query: string) => {
    setLoading(true);
    setLoadError(null);
    Promise.all([searchAcademies(query, 60), searchCoaches(query, 60)])
      .then(([a, c]) => {
        setRawAcademies(a);
        setRawCoaches(c);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const q = searchParams.get('q') || '';
    const sport = searchParams.get('sport') || 'all';
    const loc = searchParams.get('location') || 'all';
    setSearchInput(q);
    setSelectedSport(sport);
    setSelectedLocation(loc);
    runSearch(q);

    // Focus input gently for immediate searching
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Extract all available sports from loaded inventory + common sports
  const availableSports = useMemo(() => {
    const sportSet = new Set<string>();
    rawAcademies.forEach((a) => {
      (a.sports_offered || []).forEach((s) => s && sportSet.add(s.trim()));
      (a.coaches || []).forEach((c) => {
        (c.sports_offered || []).forEach((s) => s && sportSet.add(s.trim()));
      });
    });
    rawCoaches.forEach((c) => {
      (c.sports_offered || []).forEach((s) => s && sportSet.add(s.trim()));
    });
    return Array.from(sportSet).sort();
  }, [rawAcademies, rawCoaches]);

  // Extract all available localities/areas from loaded inventory
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    rawAcademies.forEach((a) => {
      if (a.locality) locSet.add(a.locality.trim());
      if (a.pincode) locSet.add(a.pincode.trim());
    });
    rawCoaches.forEach((c) => {
      if (c.locality) locSet.add(c.locality.trim());
      if (c.pincode) locSet.add(c.pincode.trim());
    });
    return Array.from(locSet).sort();
  }, [rawAcademies, rawCoaches]);

  // Filtered Academies
  const filteredAcademies = useMemo(() => {
    return rawAcademies.filter((a) => {
      // Sport match
      if (selectedSport !== 'all') {
        const academyHasSport = (a.sports_offered || []).some(
          (s) => s.toLowerCase() === selectedSport.toLowerCase()
        );
        const coachHasSport = (a.coaches || []).some((c) =>
          (c.sports_offered || []).some((s) => s.toLowerCase() === selectedSport.toLowerCase())
        );
        if (!academyHasSport && !coachHasSport) return false;
      }

      // Location match
      if (selectedLocation !== 'all') {
        const locLower = selectedLocation.toLowerCase();
        const matchesLoc =
          (a.locality && a.locality.toLowerCase().includes(locLower)) ||
          (a.pincode && a.pincode.includes(selectedLocation));
        if (!matchesLoc) return false;
      }

      return true;
    });
  }, [rawAcademies, selectedSport, selectedLocation]);

  // Filtered Coaches
  const filteredCoaches = useMemo(() => {
    return rawCoaches.filter((c) => {
      // Sport match
      if (selectedSport !== 'all') {
        const coachHasSport = (c.sports_offered || []).some(
          (s) => s.toLowerCase() === selectedSport.toLowerCase()
        );
        if (!coachHasSport) return false;
      }

      // Location match
      if (selectedLocation !== 'all') {
        const locLower = selectedLocation.toLowerCase();
        const matchesLoc =
          (c.locality && c.locality.toLowerCase().includes(locLower)) ||
          (c.pincode && c.pincode.includes(selectedLocation));
        if (!matchesLoc) return false;
      }

      return true;
    });
  }, [rawCoaches, selectedSport, selectedLocation]);

  const totalFilteredResults = filteredAcademies.length + filteredCoaches.length;
  const showAcademies = tab === 'all' || tab === 'academies';
  const showCoaches = tab === 'all' || tab === 'coaches';

  const hasActiveFilters =
    selectedSport !== 'all' || selectedLocation !== 'all' || Boolean(searchInput.trim());

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    const next = new URLSearchParams(searchParams);
    if (sport !== 'all') next.set('sport', sport);
    else next.delete('sport');
    setSearchParams(next);
  };

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    const next = new URLSearchParams(searchParams);
    if (loc !== 'all') next.set('location', loc);
    else next.delete('location');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSelectedSport('all');
    setSelectedLocation('all');
    setSearchInput('');
    setSearchParams({});
    runSearch('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero banner */}
        <section className="relative overflow-hidden bg-ink-950 pb-16 pt-28 text-white sm:pt-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 grid-bg opacity-[0.15]" />
            <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-600/25 blur-[120px]" />
            <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-blue-600/25 blur-[120px]" />
          </div>
          <div className="container-page relative text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              Discover the Ecosystem
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-700 leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Find Your Academy
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent">
                &amp; Your Coach.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-200">
              Verified academies and coaches across every discipline — search by sport, city, or area to find the
              right fit near you.
            </p>

            {/* Keyword Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const next = new URLSearchParams(searchParams);
                if (searchInput.trim()) next.set('q', searchInput.trim());
                else next.delete('q');
                setSearchParams(next);
                runSearch(searchInput);
              }}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur shadow-2xl"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink-950">
                <Search className="h-5 w-5" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by sport, academy name, area..."
                className="flex-1 bg-transparent px-2 text-sm font-medium text-white outline-none placeholder:text-ink-400 sm:text-base"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary !px-5 !py-2.5 !text-[13px] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                Search
              </button>
            </form>

            {/* Category Switcher Tabs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  ['all', `All (${totalFilteredResults})`, Sparkles],
                  ['academies', `Academies (${filteredAcademies.length})`, GraduationCap],
                  ['coaches', `Coaches (${filteredCoaches.length})`, Users],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    tab === id
                      ? 'bg-white text-ink-950 shadow-md scale-105'
                      : 'bg-white/5 text-ink-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filters & Results Section */}
        <section className="relative bg-ink-50/40 py-12 lg:py-16">
          <div className="absolute inset-0 -z-10 dot-bg opacity-30" />
          <div className="container-page">
            {/* Filter Control Bar */}
            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm sm:p-6 mb-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-orange-100 text-orange-600 font-bold">
                    <Filter className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-700 text-ink-950">Refine Your Search</h3>
                    <p className="text-xs text-ink-500">Filter directory by sport discipline and location</p>
                  </div>
                </div>

                {/* Filter Selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Sports-wise Filter */}
                  <div className="relative flex-1 sm:flex-initial min-w-[170px]">
                    <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 transition focus-within:border-orange-500 focus-within:bg-white">
                      <Activity className="h-4 w-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                          Sport
                        </label>
                        <select
                          value={selectedSport}
                          onChange={(e) => handleSportChange(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-ink-900 outline-none cursor-pointer"
                        >
                          <option value="all">All Sports ({availableSports.length})</option>
                          {availableSports.map((sport) => (
                            <option key={sport} value={sport}>
                              {sport}
                            </option>
                          ))}
                          {selectedSport !== 'all' &&
                            !availableSports.some((s) => s.toLowerCase() === selectedSport.toLowerCase()) && (
                              <option value={selectedSport}>{selectedSport}</option>
                            )}
                        </select>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-ink-400 shrink-0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Location-wise Filter */}
                  <div className="relative flex-1 sm:flex-initial min-w-[170px]">
                    <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 transition focus-within:border-blue-500 focus-within:bg-white">
                      <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                          Location / Area
                        </label>
                        <select
                          value={selectedLocation}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-ink-900 outline-none cursor-pointer"
                        >
                          <option value="all">All Locations ({availableLocations.length || 'Any'})</option>
                          {availableLocations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                          {selectedLocation !== 'all' &&
                            !availableLocations.some((l) => l.toLowerCase() === selectedLocation.toLowerCase()) && (
                              <option value={selectedLocation}>{selectedLocation}</option>
                            )}
                        </select>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-ink-400 shrink-0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-xs font-bold text-ink-600 transition hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Sport Pills Bar */}
              {availableSports.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-4">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-xs font-bold text-ink-400 shrink-0">Quick Sports:</span>
                    <button
                      onClick={() => handleSportChange('all')}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                        selectedSport === 'all'
                          ? 'bg-ink-950 text-white'
                          : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}
                    >
                      All
                    </button>
                    {availableSports.map((sport) => {
                      const cfg = getSportConfig(sport);
                      const Icon = cfg.icon;
                      const isSelected = selectedSport.toLowerCase() === sport.toLowerCase();
                      return (
                        <button
                          key={sport}
                          onClick={() => handleSportChange(isSelected ? 'all' : sport)}
                          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-ink-100 text-ink-700 hover:bg-orange-50 hover:text-orange-600'
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {sport}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Filter Indicators */}
              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <span className="text-ink-500">Active filters:</span>
                  {selectedSport !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 font-bold text-orange-700">
                      Sport: {selectedSport}
                      <button onClick={() => handleSportChange('all')}>
                        <X className="h-3 w-3 hover:text-orange-900" />
                      </button>
                    </span>
                  )}
                  {selectedLocation !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-bold text-blue-700">
                      Location: {selectedLocation}
                      <button onClick={() => handleLocationChange('all')}>
                        <X className="h-3 w-3 hover:text-blue-900" />
                      </button>
                    </span>
                  )}
                  {Boolean(searchInput.trim()) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 border border-ink-200 px-2.5 py-0.5 font-bold text-ink-800">
                      Keyword: "{searchInput}"
                      <button
                        onClick={() => {
                          setSearchInput('');
                          runSearch('');
                        }}
                      >
                        <X className="h-3 w-3 hover:text-ink-950" />
                      </button>
                    </span>
                  )}
                  <span className="text-ink-400">
                    ({totalFilteredResults} result{totalFilteredResults === 1 ? '' : 's'})
                  </span>
                </div>
              )}
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-sm font-semibold text-ink-500">Searching verified academies &amp; coaches...</p>
              </div>
            ) : loadError ? (
              <p className="py-20 text-center text-sm text-ink-500">
                Couldn't load results right now — please try again shortly.
              </p>
            ) : totalFilteredResults === 0 ? (
              <div className="mx-auto max-w-md rounded-3xl border border-dashed border-ink-200 bg-white/70 p-10 text-center shadow-xs">
                <Sparkles className="mx-auto h-8 w-8 text-orange-400" />
                <h3 className="mt-4 font-display text-lg font-700 text-ink-950">
                  No matches for your filter criteria
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  Try selecting a different sport or location, or reset filters to explore all available academies &amp; coaches.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-primary mt-5 !px-5 !py-2.5 !text-xs font-bold"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-14">
                {/* Academies Section */}
                {showAcademies && filteredAcademies.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                        <GraduationCap className="h-5 w-5 text-orange-500" /> Academies
                      </h2>
                      <span className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700">
                        {filteredAcademies.length} Academies
                      </span>
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredAcademies.map((a) => (
                        <Link
                          key={a.id}
                          to={`/academy/${a.slug || a.id}`}
                          className="group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_12px_32px_-20px_rgba(15,18,25,0.1)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                        >
                          <div
                            className={`flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br ${avatarGradient(
                              a.id
                            )} relative`}
                          >
                            <div className="absolute inset-0 dot-bg opacity-15" />
                            {a.logo_url ? (
                              <img
                                src={a.logo_url}
                                alt={a.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <span className="font-display text-4xl font-700 text-white/90">
                                {a.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="p-5">
                            {/* Sports badges */}
                            {a.sports_offered && a.sports_offered.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {a.sports_offered.slice(0, 3).map((s) => {
                                  const cfg = getSportConfig(s);
                                  return (
                                    <span
                                      key={s}
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                                    >
                                      {s}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <h3 className="mt-2 font-display text-lg font-700 text-ink-950 group-hover:text-orange-600 transition-colors">
                              {a.name}
                            </h3>

                            {a.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-ink-500 leading-relaxed">
                                {a.description}
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5 text-xs font-medium text-ink-500">
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                {[a.locality, a.pincode].filter(Boolean).join(' · ') || 'Location coming soon'}
                              </span>

                              <span className="font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                                Explore →
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coaches Section */}
                {showCoaches && filteredCoaches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-display text-xl font-700 text-ink-950">
                        <Users className="h-5 w-5 text-blue-500" /> Coaches
                      </h2>
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                        {filteredCoaches.length} Coaches
                      </span>
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredCoaches.map((c) => (
                        <Link
                          key={c.id}
                          to={`/coach/${c.slug || c.id}`}
                          className="group overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_12px_32px_-20px_rgba(15,18,25,0.1)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${avatarGradient(
                                c.id
                              )}`}
                            >
                              {c.profile_image_url ? (
                                <img
                                  src={c.profile_image_url}
                                  alt={c.name || 'Coach'}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="font-display text-xl font-700 text-white/90">
                                  {(c.name || 'C').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="truncate font-display text-base font-700 text-ink-950 group-hover:text-blue-600 transition-colors">
                                  {c.name || 'Coach'}
                                </h3>
                                {c.is_verified && <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />}
                              </div>
                              <p className="truncate text-xs text-ink-500">
                                {c.designation || c.academy_name || 'Independent Coach'}
                              </p>
                            </div>
                          </div>

                          {/* Sports badges */}
                          {c.sports_offered && c.sports_offered.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {c.sports_offered.slice(0, 3).map((s) => {
                                const cfg = getSportConfig(s);
                                return (
                                  <span
                                    key={s}
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                                  >
                                    {s}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5 text-xs font-medium text-ink-500">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-blue-500" />
                              {[c.locality, c.pincode].filter(Boolean).join(' · ') || 'Location coming soon'}
                            </span>
                            {c.years_of_experience != null && (
                              <span className="inline-flex items-center gap-1 font-bold text-ink-800">
                                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                {c.years_of_experience}+ yrs
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

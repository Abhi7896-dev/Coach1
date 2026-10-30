import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { AppStoreIcon } from './AppStoreIcon';
import { GooglePlayIcon } from './GooglePlayIcon';
import { useActiveSection } from '@/hooks/useReveal';

const LINKS = [
  { id: 'coaches', label: 'For Coaches' },
  { id: 'parents', label: 'For Parents' },
  { id: 'community', label: 'Community' },
  { id: 'about', label: 'About Us' },
  { id: 'security', label: 'Why TruCoach' },
];

const APP_STORE_URL = 'https://apps.apple.com/in/app/trucoach/id6808904997';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAcademies = location.pathname === '/academies';

  const active = useActiveSection(['coaches', 'parents', 'community', 'about', 'security']);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 12);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle smooth scroll when on home page, or let Router navigate when on sub-pages
  const handleSectionClick = (e: React.MouseEvent, sectionId: string) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${sectionId}`);
      }
      if (sectionId === 'join') {
        window.dispatchEvent(new CustomEvent('open-tutor-modal'));
      }
    }
    setOpen(false);
  };

  // Fixed frosted header on subpages (so it never clashes with subpage hero banners)
  // or on home page once scrolled
  const isSolidHeader = !isHome || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isSolidHeader
          ? 'border-b border-ink-100 bg-white/95 backdrop-blur-md sm:backdrop-blur-xl shadow-xs'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        {/* Logo (always navigates Home) */}
        <Logo />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const isActive = isHome && active === link.id;
            return (
              <a
                key={link.id}
                href={isHome ? `#${link.id}` : `/#${link.id}`}
                onClick={(e) => handleSectionClick(e, link.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-500 align-middle" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {isAcademies ? (
            <Link to="/" className="btn-ghost !px-5 !py-2.5 !text-[13px]">
              Home
            </Link>
          ) : (
            <Link to="/academies" className="btn-ghost !px-5 !py-2.5 !text-[13px]">
              Discover Academies
            </Link>
          )}

          <a
            href={isHome ? '#join' : '/#join'}
            onClick={(e) => handleSectionClick(e, 'join')}
            className="btn-primary !px-5 !py-2.5 !text-[13px]"
          >
            Join as a Tutor
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-800 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={`lg:hidden ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-x-0 top-16 origin-top border-b border-ink-100 bg-white/98 sm:bg-white/95 backdrop-blur-none sm:backdrop-blur-xl transition-all duration-300 sm:top-[72px] ${
            open ? 'scale-y-100 opacity-100' : 'scale-y-95 opacity-0'
          }`}
          style={{ transformOrigin: 'top' }}
        >
          <div className="container-page flex flex-col gap-1 py-5">
            {/* Section links */}
            {LINKS.map((link) => (
              <a
                key={link.id}
                href={isHome ? `#${link.id}` : `/#${link.id}`}
                onClick={(e) => handleSectionClick(e, link.id)}
                className="rounded-xl px-4 py-3 text-base font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-3 flex gap-2.5">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 px-3 py-3 text-sm font-semibold text-ink-800"
              >
                <AppStoreIcon size={18} className="h-[18px] w-[18px] rounded-[4px]" /> App Store
              </a>
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 px-3 py-3 text-sm font-semibold text-ink-800"
              >
                <GooglePlayIcon size={18} className="h-[18px] w-[18px] rounded-[4px]" /> Google Play
              </a>
            </div>

            <div className="mt-2.5 flex flex-col gap-2.5">
              {isAcademies ? (
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full"
                >
                  Home
                </Link>
              ) : (
                <Link
                  to="/academies"
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full"
                >
                  Discover Academies
                </Link>
              )}
              <a
                href={isHome ? '#join' : '/#join'}
                onClick={(e) => handleSectionClick(e, 'join')}
                className="btn-primary w-full"
              >
                Join as a Tutor
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

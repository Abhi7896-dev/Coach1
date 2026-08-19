import { useEffect, useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { useActiveSection } from '@/hooks/useReveal';

const LINKS = [
  { id: 'coaches', label: 'For Coaches' },
  { id: 'parents', label: 'For Parents' },
  { id: 'community', label: 'Community' },
  { id: 'about', label: 'About Us' },
  { id: 'security', label: 'Security' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(['coaches', 'parents', 'community', 'about', 'security']);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-ink-100 bg-white/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                active === link.id
                  ? 'text-blue-600'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {link.label}
              {active === link.id && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-500 align-middle" />
              )}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <a href="#coaches" className="btn-ghost !px-5 !py-2.5 !text-[13px]">
            Discover Academies
          </a>
          <a href="#join" className="btn-primary !px-5 !py-2.5 !text-[13px]">
            Join as a Tutor
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

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
          className={`absolute inset-x-0 top-16 origin-top border-b border-ink-100 bg-white/95 backdrop-blur-xl transition-all duration-300 sm:top-[72px] ${
            open ? 'scale-y-100 opacity-100' : 'scale-y-95 opacity-0'
          }`}
          style={{ transformOrigin: 'top' }}
        >
          <div className="container-page flex flex-col gap-1 py-5">
            {LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2.5">
              <a
                href="#coaches"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full"
              >
                Discover Academies
              </a>
              <a
                href="#join"
                onClick={() => setOpen(false)}
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

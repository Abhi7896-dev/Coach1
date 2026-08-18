import { Logo } from './Logo';
import { Zap, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const COLS = [
  {
    title: 'For Coaches',
    links: ['Digital Academy', 'Batch Management', 'WhatsApp Alerts', 'Marketplace'],
  },
  {
    title: 'For Parents',
    links: ['Live Attendance', 'Progress Remarks', 'Digital Receipts', 'Discover Academies'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Verified Coaches', 'Security', 'Contact'],
  },
];

const SOCIALS = [Twitter, Instagram, Linkedin, Youtube];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50/60">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              Academy Manager is the ecosystem bridging local talent and global
              opportunity — empowering coaches, informing parents, and mapping
              every academy so no star goes unnoticed.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#top"
                  aria-label="social link"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-all hover:-translate-y-0.5 hover:border-ink-300 hover:text-ink-900"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-700 uppercase tracking-wider text-ink-900">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#top"
                      className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-7 sm:flex-row">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Academy Manager. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-ink-400">
            <a href="#top" className="hover:text-ink-700">Privacy</a>
            <a href="#top" className="hover:text-ink-700">Terms</a>
            <a href="#top" className="hover:text-ink-700">Cookies</a>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-orange-500" />
              Built for local champions
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

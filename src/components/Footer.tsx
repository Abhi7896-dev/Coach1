import { Logo } from './Logo';
import { Zap, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const COLS = [
  {
    title: 'For Coaches',
    links: [
      { label: 'Digital Academy', href: '#coaches' },
      { label: 'Batch Management', href: '#coaches' },
      { label: 'WhatsApp Alerts', href: '#coaches' },
      { label: 'Community', href: '#community' },
    ],
  },
  {
    title: 'For Parents',
    links: [
      { label: 'Live Attendance', href: '#parents' },
      { label: 'Progress Remarks', href: '#parents' },
      { label: 'Digital Receipts', href: '#parents' },
      { label: 'Discover Academies', href: '#community' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Security', href: '#security' },
      { label: 'Contact', href: '/policies.html#contact' },
    ],
  },
];

const SOCIALS = [Twitter, Instagram, Linkedin, Youtube];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50/60">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              TruCoach is the complete sports community bridging local talent and global
              opportunity — empowering coaches, informing parents, and mapping
              every academy so no star goes unnoticed.
            </p>
            {/* <div className="mt-5 flex items-center gap-2.5">
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
            </div> */}
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-700 uppercase tracking-wider text-ink-900">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div>
            <h4 className="font-display text-sm font-700 uppercase tracking-wider text-ink-900">
              Reach Out
            </h4>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-ink-500 leading-relaxed">
                For any queries, support, or partnership opportunities, feel free to reach out to us:
              </p>
              <a
                href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}
                className="inline-flex text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
              >
                {import.meta.env.VITE_CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-7 sm:flex-row">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} TruCoach. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-ink-400">
            <a href="/policies.html#privacy" target="_blank" rel="noopener noreferrer" className="hover:text-ink-700">Privacy Policy</a>
            <a href="/policies.html#terms" target="_blank" rel="noopener noreferrer" className="hover:text-ink-700">Terms of Service</a>
            <a href="/policies.html#refunds" target="_blank" rel="noopener noreferrer" className="hover:text-ink-700">Refund Policy</a>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-orange-500" />
              Built for Champions.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

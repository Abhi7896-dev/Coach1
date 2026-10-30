import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share';
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(GOOGLE_PLAY_URL)}`;

// A persistent "scan to get the app" widget, visible throughout the scroll
// (not just in the Hero/footer) rather than a one-shot badge you can only
// act on once. Dismissible, and only shown once the visitor has scrolled
// past the Hero's own App Store/Google Play badges so it doesn't duplicate
// them immediately.
export function FloatingAppWidget() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > 700);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden animate-fade-up lg:block">
      <div className="relative rounded-2xl border border-ink-100 bg-white p-3 pt-2.5 shadow-2xl">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink-950 text-white shadow-md transition-transform hover:scale-110 hover:bg-ink-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <p className="text-center text-[11px] font-bold uppercase tracking-wide text-ink-600">Get the App</p>
        <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="mt-1.5 block">
          <img src={QR_SRC} alt="Scan to download TruCoach" width={108} height={108} className="rounded-lg" />
        </a>
      </div>
    </div>
  );
}

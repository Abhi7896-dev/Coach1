import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Threshold raised past the Hero's own height (not just an arbitrary
    // 600px) — at 600px on mobile this button sat directly on top of the
    // Hero's "Zero" stat card, hiding its label text.
    const onScroll = () => setVisible(window.scrollY > 1400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-[92px] right-[30px] z-40 grid h-11 w-11 place-items-center rounded-full bg-ink-950 text-white shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:scale-110 hover:bg-ink-900 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

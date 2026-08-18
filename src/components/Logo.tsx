import { Zap } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-ink-950 text-white shadow-[0_6px_16px_-6px_rgba(15,18,25,0.5)] transition-transform duration-300 group-hover:scale-105">
        <Zap className="h-5 w-5 text-orange-400" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
      </span>
      <span className="font-display text-[17px] font-700 leading-none tracking-tight text-ink-950">
        Academy<span className="text-orange-500">Manager</span>
      </span>
    </a>
  );
}

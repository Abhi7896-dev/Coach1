export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-3 ${className}`}>
      <img 
        src="/logo.png" 
        alt="TruCoach Logo" 
        className="h-12 sm:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
      />
      <span className="font-display text-xl sm:text-[22px] font-700 leading-none tracking-tight">
        <span className="text-blue-600">Tru</span>
        <span className="text-orange-500">Coach</span>
      </span>
    </a>
  );
}

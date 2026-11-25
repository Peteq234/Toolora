import { Link } from "@/lib/router";
import { cn } from "@/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[11px] bg-brand-400 text-ink-950 shadow-[0_4px_18px_-6px_rgba(199,240,95,0.55)]",
        className
      )}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path d="M5 6.5h14M12 6.5v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="18.7" cy="18.3" r="1.9" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Toolsy home"
      className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-brand-400"
    >
      <LogoMark className="size-9 transition-transform duration-300 group-hover:-rotate-3" />
      {!compact && (
        <span className="text-[19px] font-extrabold tracking-[-0.035em] text-mist-50">
          Toolsy<span className="text-brand-400">.</span>
        </span>
      )}
    </Link>
  );
}

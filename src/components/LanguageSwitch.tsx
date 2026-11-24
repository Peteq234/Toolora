import { useLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/utils/cn";

const OPTIONS: { value: Language; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "pl", label: "PL", name: "Polski" },
];

export function LanguageSwitch({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div role="group" aria-label="Language / Język" className={cn("flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5", className)}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          title={option.name}
          className={language === option.value ? "rounded-md bg-brand-400 px-1.5 py-1 font-mono text-[9.5px] font-bold text-ink-950" : "rounded-md px-1.5 py-1 font-mono text-[9.5px] text-mist-400 hover:text-mist-100"}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

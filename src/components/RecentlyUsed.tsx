import { cn } from "@/utils/cn";
import { Link } from "@/lib/router";
import { getCategory, getTool } from "@/lib/tools";
import { useRecent } from "@/lib/recent";
import { Icon } from "@/components/Icons";
import { categoryAccent } from "@/components/ToolBrowser";

export function RecentTools({ className }: { className?: string }) {
  const { recents, clearRecent } = useRecent();
  const items = recents
    .map((slug) => getTool(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-used-heading" className={cn("scroll-mt-24", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="history" size={13} className="text-brand-300/80" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-300/80">
              Pick up where you left off
            </span>
          </div>
          <h2
            id="recently-used-heading"
            className="mt-1.5 text-[20px] font-semibold tracking-[-0.025em] text-mist-50"
          >
            Recently used
          </h2>
        </div>
        <button
          type="button"
          onClick={clearRecent}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-mist-500 transition hover:bg-white/[0.04] hover:text-mist-200"
        >
          <Icon name="trash" size={12} />
          Clear history
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((tool) => {
          const category = getCategory(tool.category);
          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-ink-850/70 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-ink-850"
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg border transition-transform duration-200 group-hover:scale-105",
                  categoryAccent[tool.category]
                )}
              >
                <Icon name={tool.icon} size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-mist-200 group-hover:text-mist-50">
                  {tool.shortName}
                </span>
                <span className="block truncate font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-600">
                  {category.name}
                </span>
              </span>
              <Icon
                name="arrowUpRight"
                size={12}
                className="shrink-0 text-mist-600 transition group-hover:text-brand-300"
              />
            </Link>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">
        Saved in this browser only · no account
      </p>
    </section>
  );
}

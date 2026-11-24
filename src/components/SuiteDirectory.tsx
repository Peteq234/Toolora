import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { Link } from "@/lib/router";
import { suiteAccentClasses, suiteGlowClasses, suiteTools, suites, type Suite } from "@/lib/suites";
import { usePlatform } from "@/lib/platform";
import { Icon } from "@/components/Icons";
import { Input } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";

function SuiteCard({ suite }: { suite: Suite }) {
  const { isToolListed, toolName } = usePlatform();
  const items = suiteTools(suite).filter((tool) => isToolListed(tool.slug, tool.category));
  if (items.length === 0) return null;
  const preview = items.slice(0, 4);

  return (
    <Link
      href={`/toolkits/${suite.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]"
    >
      <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-70", suiteGlowClasses[suite.accent])} />
      <div className="relative flex items-start justify-between gap-2">
        <span className={cn("grid size-10 place-items-center rounded-xl border", suiteAccentClasses[suite.accent])}>
          <Icon name={suite.icon} size={18} />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
          {items.length} tools
        </span>
      </div>
      <div className="relative">
        <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.015em] text-mist-50">{suite.name}</h3>
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-mist-400">{suite.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {preview.map((tool) => (
            <span key={tool.slug} className="rounded border border-white/[0.07] bg-ink-900/60 px-1.5 py-0.5 font-mono text-[8.5px] text-mist-500">
              {toolName(tool)}
            </span>
          ))}
          {items.length > preview.length && (
            <span className="rounded border border-white/[0.07] px-1.5 py-0.5 font-mono text-[8.5px] text-mist-600">
              +{items.length - preview.length}
            </span>
          )}
        </div>
      </div>
      <span className="relative mt-auto inline-flex items-center gap-1 pt-4 text-[11.5px] font-semibold text-mist-400 transition group-hover:text-brand-300">
        Open suite
        <Icon name="arrowRight" size={12} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function SuiteDirectory({
  heading = "Tool suites",
  description = "Related tools share a tabbed workspace. Individual tools keep their own pages, bookmarks and search results — nothing moves or breaks.",
  compact = false,
  showSearch = true,
  align = "left",
}: {
  heading?: string;
  description?: string;
  compact?: boolean;
  showSearch?: boolean;
  align?: "left" | "center";
}) {
  const [query, setQuery] = useState("");
  const { toolName, isToolListed } = usePlatform();
  const { t } = useLanguage();

  const visibleSuites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return suites;
    return suites.filter((suite) => {
      const toolNames = suiteTools(suite).filter((tool) => isToolListed(tool.slug, tool.category)).map((tool) => `${toolName(tool)} ${tool.slug} ${tool.tagline} ${tool.metaDescription}`).join(" ");
      return `${suite.name} ${suite.shortName} ${suite.tagline} ${suite.description} ${toolNames}`.toLowerCase().includes(normalized);
    });
  }, [query, toolName, isToolListed]);

  return (
    <section aria-labelledby="suite-directory-heading" className="scroll-mt-24">
      <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", align === "center" && "sm:flex-col sm:items-center sm:text-center")}>
        <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
          <div className={cn("flex items-center gap-2.5", align === "center" && "justify-center")}>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-brand-300/80">{t("suites.eyebrow")}</span>
            <span className="h-px w-8 bg-white/15" aria-hidden="true" />
          </div>
          <h2 id="suite-directory-heading" className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-mist-50 sm:text-[28px]">
            {heading === "Tool suites" ? t("suites.heading") : heading}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist-400">{description}</p>
        </div>
        {showSearch && (
          <div className="relative w-full sm:max-w-[300px]">
            <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("suites.search")}
              aria-label="Search tool suites and functions"
              className="h-10 pl-9 text-[12.5px]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear suite search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-mist-500 hover:text-mist-100">
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {visibleSuites.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.012] px-5 py-8 text-center">
          <p className="text-[13px] font-semibold text-mist-200">No suite matches “{query}”</p>
          <p className="mt-1 text-[11.5px] text-mist-500">Every individual tool is still searchable below. Try “PDF”, “JSON” or “percentage”.</p>
        </div>
      ) : (
        <div className={cn("mt-4 grid gap-3", compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
          {visibleSuites.map((suite) => <SuiteCard key={suite.slug} suite={suite} />)}
        </div>
      )}
    </section>
  );
}

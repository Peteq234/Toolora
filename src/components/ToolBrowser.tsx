import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { Link } from "@/lib/router";
import { categories, tools, type CategoryId, type Tool } from "@/lib/tools";
import { useFavorites } from "@/lib/favorites";
import { Icon } from "@/components/Icons";
import { useSearch } from "@/components/Layout";
import { usePlatform } from "@/lib/platform";
import { suiteForTool } from "@/lib/suites";
import {
  Badge,
  Button,
  EmptyState,
  FavoriteButton,
  Input,
} from "@/components/ui";

export const categoryAccent: Record<CategoryId, string> = {
  generators: "border-brand-400/20 bg-brand-400/[0.09] text-brand-300",
  text: "border-sky-400/20 bg-sky-400/[0.09] text-sky-300",
  calculators: "border-amber-400/20 bg-amber-400/[0.09] text-amber-300",
  time: "border-violet-400/20 bg-violet-400/[0.09] text-violet-300",
  design: "border-pink-400/20 bg-pink-400/[0.09] text-pink-300",
  tech: "border-teal-400/20 bg-teal-400/[0.09] text-teal-300",
  developer: "border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-300",
  files: "border-cyan-400/20 bg-cyan-400/[0.09] text-cyan-300",
  family: "border-rose-400/20 bg-rose-400/[0.09] text-rose-300",
  learning: "border-indigo-400/20 bg-indigo-400/[0.09] text-indigo-300",
};

export function ToolCard({ tool }: { tool: Tool }) {
  const category = categories.find((item) => item.id === tool.category);
  const { toolName, toolDescription, categoryLabel } = usePlatform();
  const suite = suiteForTool(tool.slug);
  const displayName = toolName(tool);
  const displayDescription = toolDescription(tool);
  return (
    <div className="group relative h-full [contain-intrinsic-size:auto_190px] [content-visibility:auto]">
      <Link
        href={`/tools/${tool.slug}`}
        className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-transparent bg-ink-850 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:shadow-[0_28px_60px_-32px_rgba(0,0,0,0.95)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="flex items-center justify-between gap-3 pr-9">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-xl border transition-transform duration-300 group-hover:scale-105",
              categoryAccent[tool.category]
            )}
          >
            <Icon name={tool.icon} size={18} />
          </span>
          {tool.isNew && <Badge tone="brand">New</Badge>}
        </div>

        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
          {category ? categoryLabel(category.id, category.name) : "Tool"}
          {suite ? ` · ${suite.shortName}` : ""}
        </p>
        <h3 className="mt-1 text-[15.5px] font-semibold leading-snug tracking-[-0.015em] text-mist-50">
          {displayName}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-mist-400">
          {displayDescription}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
            Free
            <span className="size-0.5 rounded-full bg-mist-600" />
            Local
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-mist-500 transition-colors group-hover:text-brand-300">
            Open tool
            <Icon
              name="arrowUpRight"
              size={13}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
      <FavoriteButton
        slug={tool.slug}
        name={displayName}
        iconSize={14}
        className="absolute right-3.5 top-3.5 z-10 size-8 bg-ink-850/90 backdrop-blur"
      />
    </div>
  );
}

function matchesQuery(tool: Tool, query: string): boolean {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  const category = categories.find((item) => item.id === tool.category)?.name ?? "";
  const suite = suiteForTool(tool.slug);
  return [tool.name, tool.shortName, tool.tagline, tool.metaDescription, category, suite?.name ?? "", suite?.description ?? "", ...tool.keywords]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export function ToolBrowser({
  query,
  onQueryChange,
  initialCategory = "all",
  onlyFavorites = false,
  showHeading = true,
  showSearch = true,
  showFavoritesToggle = true,
  heading = "The whole toolkit",
  description = `${tools.length} focused tools. No sign-up screens, no uploads, no upsells hiding behind the download button.`,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  initialCategory?: CategoryId | "all";
  onlyFavorites?: boolean;
  showHeading?: boolean;
  showSearch?: boolean;
  showFavoritesToggle?: boolean;
  heading?: string;
  description?: string;
}) {
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [favoritesFilter, setFavoritesFilter] = useState(onlyFavorites);
  const { favorites } = useFavorites();
  const { openSearch } = useSearch();
  const { isToolListed, categoryLabel: categoryOverride } = usePlatform();

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const showingFavoritesOnly = onlyFavorites || favoritesFilter;

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      if (!isToolListed(tool.slug, tool.category)) return false;
      if (category !== "all" && tool.category !== category) return false;
      if (showingFavoritesOnly && !favorites.includes(tool.slug)) return false;
      return matchesQuery(tool, query);
    });
  }, [category, favorites, showingFavoritesOnly, query, isToolListed]);

  const activeFilters = query.trim() !== "" || category !== "all" || (!onlyFavorites && favoritesFilter);
  const categoryLabel = categories.find((item) => item.id === category)?.name;

  function resetFilters() {
    onQueryChange("");
    setCategory("all");
    if (!onlyFavorites) setFavoritesFilter(false);
  }

  return (
    <section id="toolkit" aria-label="Browse tools" className="scroll-mt-20">
      {showHeading && (
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-brand-300/80">
                Toolkit
              </span>
              <span className="h-px w-8 bg-white/15" aria-hidden="true" />
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-mist-50 sm:text-[30px]">
              {heading}
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-mist-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={openSearch}
            className="hidden items-center gap-2 self-start rounded-lg px-1 py-1 text-[12px] font-medium text-mist-500 transition hover:text-mist-200 sm:flex"
          >
            <Icon name="command" size={13} />
            Or open quick search
            <kbd className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9.5px]">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {showSearch && (
            <div className="relative flex-1">
              <Icon
                name="search"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500"
              />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Filter by name, task or keyword…"
                aria-label="Filter tools"
                className="h-10 bg-ink-900/80 pl-9 pr-9 text-[13px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-mist-500 transition hover:text-mist-100"
                >
                  <Icon name="close" size={13} />
                </button>
              )}
            </div>
          )}
          {showFavoritesToggle && (
            <button
              type="button"
              onClick={() => setFavoritesFilter((current) => !current)}
              aria-pressed={favoritesFilter}
              className={cn(
                "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 text-[12px] font-semibold transition",
                favoritesFilter
                  ? "border-brand-400/30 bg-brand-400/10 text-brand-200"
                  : "border-white/10 bg-white/[0.025] text-mist-400 hover:border-white/20 hover:text-mist-100"
              )}
            >
              <Icon name={favoritesFilter ? "starFilled" : "star"} size={14} />
              Favorites
              <span className="font-mono text-[10px] text-mist-500">{favorites.length}</span>
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
              category === "all"
                ? "border-brand-400/40 bg-brand-400 text-ink-950"
                : "border-white/8 bg-white/[0.02] text-mist-400 hover:border-white/15 hover:text-mist-100"
            )}
          >
            All tools
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition",
                category === item.id
                  ? "border-brand-400/40 bg-brand-400 text-ink-950"
                  : "border-white/8 bg-white/[0.02] text-mist-400 hover:border-white/15 hover:text-mist-100"
              )}
            >
              {categoryOverride(item.id, item.name)}
            </button>
          ))}
        </div>
      </div>

      {category !== "all" && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-brand-400/15 bg-brand-400/[0.035] px-3.5 py-3">
          <span className="mt-0.5 text-brand-300">
            <Icon name={categories.find((item) => item.id === category)?.icon ?? "layers"} size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-mist-100">
              {categories.find((item) => item.id === category)?.name}
              <span className="ml-2 font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-mist-500">
                {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
              </span>
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist-500">
              {categories.find((item) => item.id === category)?.description}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mist-500">
          {filtered.length} of {tools.length} tools
          {categoryLabel && <span className="text-mist-400"> · {categoryLabel}</span>}
          {query && <span className="text-brand-300"> · “{query}”</span>}
        </p>
        {activeFilters && !onlyFavorites && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-8 items-center gap-1.5 px-1 text-[11.5px] font-medium text-mist-500 transition hover:text-mist-200"
          >
            <Icon name="refresh" size={12} />
            Reset filters
          </button>
        )}
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={showingFavoritesOnly && !query ? "star" : "search"}
            title={
              showingFavoritesOnly && !query
                ? "No favorites here yet"
                : "No tools match those filters"
            }
            description={
              showingFavoritesOnly && !query
                ? "Tap the star on any tool card to keep it close. Favorites are saved in this browser only."
                : "Try a different keyword, switch category, or clear the filters to see the full toolkit."
            }
            action={
              showingFavoritesOnly && !query ? (
                <Link
                  href="/tools"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-[13px] font-semibold text-mist-100 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  Browse all tools
                  <Icon name="arrowRight" size={13} />
                </Link>
              ) : (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

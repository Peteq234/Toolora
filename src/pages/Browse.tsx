import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@/lib/router";
import { Link } from "@/lib/router";
import { categories, tools, type CategoryId } from "@/lib/tools";
import { suites } from "@/lib/suites";
import { usePlatform } from "@/lib/platform";
import { useFavorites } from "@/lib/favorites";
import { useSeo } from "@/lib/seo";
import { Icon } from "@/components/Icons";
import { ToolBrowser } from "@/components/ToolBrowser";
import { RecentTools } from "@/components/RecentlyUsed";
import { SuiteDirectory } from "@/components/SuiteDirectory";
import { FileLauncher } from "@/components/FileLauncher";
import {
  AdSlot,
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Note,
} from "@/components/ui";

function isCategoryId(value: string | null): value is CategoryId {
  return Boolean(value) && categories.some((category) => category.id === value);
}

export function ToolsIndex() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const categoryParam = params.get("category");
  const queryParam = params.get("q") ?? "";
  const [query, setQuery] = useState(queryParam);
  const { favorites } = useFavorites();
  const { isToolListed, toolName } = usePlatform();
  const popular = useMemo(
    () => tools.filter((tool) => tool.popular && isToolListed(tool.slug, tool.category)).slice(0, 8),
    [isToolListed]
  );

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useSeo({
    title: `All ${tools.length} Free Online Tools — Browse the Toolkit | Toolora`,
    description: `Browse ${tools.length} free tools in ${suites.length} organised suites: calculators, text studio, image studio, developer toolkit, PDF, QR, family growth, plus generators and guides. Search every function instantly.`,
    path: "/tools",
    schema: {
      "@type": "CollectionPage",
      name: "All Toolora tools",
      description: `A free online toolkit of ${tools.length} browser-based utilities in ${suites.length} organised suites for developers, writers, designers and everyday tasks.`,
      url: "https://toolora.com/tools",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `https://toolora.com/tools/${tool.slug}`,
        })),
      },
    },
  });

  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All tools" }]} />

      <header className="animate-fade-up flex flex-col gap-6 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{tools.length} tools · free</Badge>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
              no sign-up · runs locally
            </span>
          </div>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-mist-50 sm:text-[42px]">
            The whole toolkit.
            <br />
            <span className="font-serif font-normal italic text-brand-200">Nothing behind a login.</span>
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-mist-400 sm:text-[14.5px]">
            {tools.length} tools in {suites.length} suites, plus standalone utilities. Search every function by
            name, filter by category, or star the ones you want to keep — every tool still has its own page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/favorites"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-[12.5px] font-semibold text-mist-200 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Icon name="star" size={14} />
            Favorites
            <span className="font-mono text-[10px] text-mist-500">{favorites.length}</span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium text-mist-500 transition hover:bg-white/[0.04] hover:text-mist-200"
          >
            Suggest a tool
            <Icon name="arrowUpRight" size={13} />
          </Link>
        </div>
      </header>

      <div className="mt-8">
        <FileLauncher />
      </div>

      <div className="mt-6">
        <SuiteDirectory
          description="Tabs keep related tools together. Search a suite or a function; every tool remains individually bookmarked and indexable."
        />
      </div>

      {popular.length > 0 && (
        <section aria-labelledby="popular-tools-heading" className="mt-9">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-300/80">Most useful</p>
              <h2 id="popular-tools-heading" className="mt-1.5 text-[20px] font-semibold tracking-[-0.025em] text-mist-50">Popular tools</h2>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">hand-picked · not visitor counts</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {popular.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11.5px] text-mist-300 transition hover:border-brand-400/30 hover:bg-brand-400/[0.05] hover:text-mist-50">
                <Icon name={tool.icon} size={12} className="text-mist-500 group-hover:text-brand-300" />
                {toolName(tool)}
                <Icon name="arrowUpRight" size={10} className="text-mist-600 group-hover:text-brand-300" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <RecentTools className="mt-9" />

      <div className="mt-9 border-t border-white/[0.07] pt-8">
        <ToolBrowser
          query={query}
          onQueryChange={setQuery}
          initialCategory={isCategoryId(categoryParam) ? categoryParam : "all"}
          showHeading={false}
          showSearch
        />
      </div>

      <AdSlot className="mt-14" />

      <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-3">
        {[
          { icon: "shield" as const, title: "Nothing uploaded", text: "Tools process data in your browser; there is no server-side history." },
          { icon: "star" as const, title: "Favorites stay local", text: "Your starred tools are stored in this browser's local storage only." },
          { icon: "heart" as const, title: "Free to use", text: "No paywall or account. Future ads will be clearly labelled, never disguised." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
            <Icon name={item.icon} size={15} className="text-brand-300/85" />
            <p className="mt-2 text-[12px] font-semibold text-mist-200">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mist-500">{item.text}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

export function FavoritesPage() {
  const [query, setQuery] = useState("");
  const { favorites, clearFavorites } = useFavorites();
  const [confirming, setConfirming] = useState(false);

  useSeo({
    title: "Your Saved Tools — Toolora Favorites",
    description:
      "Your saved Toolora tools, stored privately in this browser. Open a favorite or star more from the full toolkit.",
    path: "/favorites",
    noindex: true,
  });

  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Favorites" }]} />

      <header className="flex flex-col gap-5 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <Icon name="star" size={10} />
              {favorites.length} saved
            </Badge>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
              stored on this device
            </span>
          </div>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] text-mist-50 sm:text-[38px]">
            Your <span className="capitalize">favorites</span>
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-mist-400">
            A shortcut shelf for the tools you keep coming back to. Stars are saved in this
            browser's local storage — no account, no sync, no data leaving your device.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/tools"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-400 px-3.5 text-[12.5px] font-bold text-ink-950 transition hover:bg-brand-300"
          >
            Browse all tools
            <Icon name="arrowRight" size={13} />
          </Link>
          {favorites.length > 0 &&
            (confirming ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearFavorites();
                    setConfirming(false);
                  }}
                  className="text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                >
                  Confirm clear
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
                <Icon name="trash" size={13} />
                Clear all
              </Button>
            ))}
        </div>
      </header>

      <RecentTools className="mt-8" />

      <div className="mt-9 border-t border-white/[0.07] pt-8">
        <ToolBrowser
          query={query}
          onQueryChange={setQuery}
          onlyFavorites
          showHeading={false}
          showSearch
          showFavoritesToggle={false}
        />
      </div>

      <Note tone="info" className="mt-8">
        Favorites are device-specific. Clearing your browser's site data, using private browsing, or
        switching browsers will empty this list. You can re-add tools at any time from the toolkit.
      </Note>
    </Container>
  );
}

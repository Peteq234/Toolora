import { useEffect } from "react";
import { cn } from "@/utils/cn";
import { Link, useLocation, useNavigate } from "@/lib/router";
import { useSeo, SITE_URL } from "@/lib/seo";
import { getSuite, suiteAccentClasses, suiteGlowClasses, suiteTools, suites } from "@/lib/suites";
import { tools, type Tool } from "@/lib/tools";
import { toolComponents } from "@/tools";
import { useRecent } from "@/lib/recent";
import { usePlatform } from "@/lib/platform";
import { Icon } from "@/components/Icons";
import { categoryAccent } from "@/components/ToolBrowser";
import {
  Badge,
  Breadcrumbs,
  Container,
  FaqList,
  FavoriteButton,
  Note,
} from "@/components/ui";

function SuiteSwitcher({ activeSlug }: { activeSlug: string }) {
  return (
    <nav aria-label="Tool suites" className="flex flex-wrap gap-1.5">
      {suites.map((item) => {
        const active = item.slug === activeSlug;
        return (
          <Link
            key={item.slug}
            href={`/toolkits/${item.slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
              active
                ? "border-brand-400/35 bg-brand-400/10 font-semibold text-brand-200"
                : "border-white/[0.07] bg-white/[0.02] text-mist-400 hover:border-white/20 hover:text-mist-100"
            )}
          >
            <Icon name={item.icon} size={11} />
            {item.shortName}
          </Link>
        );
      })}
    </nav>
  );
}

function ToolOverviewCard({ suiteSlug, tool, keepSeparate }: { suiteSlug: string; tool: Tool; keepSeparate: boolean }) {
  const { toolName, toolDescription } = usePlatform();
  const category = tool.category;
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16]">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("grid size-9 place-items-center rounded-xl border", categoryAccent[category])}>
          <Icon name={tool.icon} size={16} />
        </span>
        <FavoriteButton slug={tool.slug} name={toolName(tool)} iconSize={12} className="size-7" />
      </div>
      <h3 className="mt-3 text-[14px] font-semibold leading-snug text-mist-50">{toolName(tool)}</h3>
      <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{toolDescription(tool)}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
        <Link href={keepSeparate ? `/tools/${tool.slug}` : `/toolkits/${suiteSlug}?tool=${tool.slug}`} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-300 hover:text-brand-200">
          {keepSeparate ? "Open tool" : "Use here"}
          <Icon name="arrowRight" size={11} />
        </Link>
        <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-1 text-[10.5px] text-mist-500 transition hover:text-mist-200">
          Full page
          <Icon name="arrowUpRight" size={10} />
        </Link>
      </div>
    </div>
  );
}

export function SuitePage({ suiteSlug }: { suiteSlug: string }) {
  const suite = getSuite(suiteSlug);
  const { search } = useLocation();
  const navigate = useNavigate();
  const { recordRecent } = useRecent();
  const { isToolEnabled, isToolListed, toolName, toolDescription, seoFor, recordEvent } = usePlatform();

  const params = new URLSearchParams(search);
  const requestedSlug = params.get("tool");
  const suiteItems = suite ? suiteTools(suite) : [];
  const requested = requestedSlug ? suiteItems.find((tool) => tool.slug === requestedSlug) : undefined;
  const activeTool = requested && isToolEnabled(requested.slug) && !suite?.keepSeparate ? requested : undefined;

  const seo = activeTool
    ? seoFor(activeTool.slug, { title: activeTool.metaTitle, description: activeTool.metaDescription })
    : {
        title: suite?.metaTitle ?? "Tool suite — Toolora",
        description: suite?.metaDescription ?? "Related browser-based tools grouped in one organised suite.",
      };
  const path = activeTool ? `/tools/${activeTool.slug}` : `/toolkits/${suiteSlug}`;

  useSeo({
    title: seo.title,
    description: seo.description,
    path,
    schema: suite
      ? activeTool
        ? [
            {
              "@type": "SoftwareApplication",
              name: toolName(activeTool),
              description: seo.description,
              url: `${SITE_URL}/tools/${activeTool.slug}`,
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any modern browser",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              isPartOf: { "@type": "CollectionPage", name: suite.name, url: `${SITE_URL}/toolkits/${suite.slug}` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Tool suites", item: `${SITE_URL}/tools` },
                { "@type": "ListItem", position: 3, name: suite.name, item: `${SITE_URL}/toolkits/${suite.slug}` },
                { "@type": "ListItem", position: 4, name: toolName(activeTool), item: `${SITE_URL}/tools/${activeTool.slug}` },
              ],
            },
          ]
        : [
            {
              "@type": "CollectionPage",
              name: suite.name,
              description: suite.metaDescription,
              url: `${SITE_URL}/toolkits/${suite.slug}`,
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: suiteItems.length,
                itemListElement: suiteItems.map((tool, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: tool.name,
                  url: `${SITE_URL}/tools/${tool.slug}`,
                })),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools` },
                { "@type": "ListItem", position: 3, name: suite.name, item: `${SITE_URL}/toolkits/${suite.slug}` },
              ],
            },
          ]
      : undefined,
  });

  useEffect(() => {
    if (!activeTool) return;
    recordRecent(activeTool.slug);
    recordEvent(activeTool.slug, "tool_open");
  }, [activeTool, recordRecent, recordEvent]);

  if (!suite) {
    return (
      <Container className="pb-20 pt-10">
        <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-ink-850 p-6 text-center">
          <Icon name="alert" size={22} className="mx-auto text-amber-300" />
          <h1 className="mt-3 text-[22px] font-semibold text-mist-50">Suite not found</h1>
          <p className="mt-1.5 text-[12.5px] text-mist-500">That toolkit address does not exist. Browse the suite directory instead.</p>
          <Link href="/tools" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-400 px-4 text-[12.5px] font-bold text-ink-950">
            All tools <Icon name="arrowRight" size={13} />
          </Link>
        </div>
      </Container>
    );
  }

  const ToolComponent = activeTool ? toolComponents[activeTool.slug] : undefined;
  const availableItems = suiteItems.filter((tool) => isToolListed(tool.slug, tool.category));
  const activeIndex = activeTool ? suiteItems.findIndex((tool) => tool.slug === activeTool.slug) : -1;
  const relatedSuites = suites.filter((item) => item.slug !== suite.slug).slice(0, 4);

  return (
    <Container className="pb-16 pt-7 sm:pt-9">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tool suites", href: "/tools" },
          { label: suite.name, href: activeTool ? `/toolkits/${suite.slug}` : undefined },
          ...(activeTool ? [{ label: toolName(activeTool) }] : []),
        ]}
      />

      <header className="animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl border sm:size-14", suiteAccentClasses[suite.accent])}>
              <Icon name={suite.icon} size={22} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">Tool suite</Badge>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  {availableItems.length} of {suiteItems.length} tools available
                </span>
              </div>
              <h1 className="mt-2 text-[28px] font-semibold leading-[1.06] tracking-[-0.035em] text-mist-50 sm:text-[36px]">
                {suite.name}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/tools" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11.5px] font-semibold text-mist-200 transition hover:border-white/20 hover:bg-white/[0.06]">
              <Icon name="layers" size={13} /> All suites
            </Link>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-mist-300">{suite.tagline}</p>
        <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-mist-500">{suite.description}</p>
      </header>

      {!suite.keepSeparate && (
        <div className={cn("relative mt-5 rounded-2xl border border-white/[0.07] bg-ink-850/60 p-2", suiteGlowClasses[suite.accent])}>
          <div role="tablist" aria-label={`${suite.name} tools`} className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={`/toolkits/${suite.slug}`}
              role="tab"
              aria-selected={!activeTool}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-[11.5px] transition",
                !activeTool ? "bg-brand-400 font-bold text-ink-950" : "font-medium text-mist-400 hover:bg-white/[0.05] hover:text-mist-100"
              )}
            >
              Overview
            </Link>
            {suiteItems.filter((tool) => isToolListed(tool.slug, tool.category)).map((tool) => {
              const enabled = isToolEnabled(tool.slug);
              const selected = activeTool?.slug === tool.slug;
              return (
                <button
                  key={tool.slug}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  disabled={!enabled}
                  onClick={() => navigate(`/toolkits/${suite.slug}?tool=${tool.slug}`)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[11.5px] transition disabled:cursor-not-allowed disabled:opacity-40",
                    selected ? "bg-brand-400 font-bold text-ink-950" : "font-medium text-mist-400 hover:bg-white/[0.05] hover:text-mist-100"
                  )}
                >
                  {toolName(tool)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTool && !suite.keepSeparate ? (
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="min-w-0 space-y-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-300/80">{suite.name}</p>
                <h2 className="mt-1 text-[23px] font-semibold tracking-[-0.025em] text-mist-50">{toolName(activeTool)}</h2>
                <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-mist-500">{toolDescription(activeTool)}</p>
              </div>
              <div className="flex items-center gap-2">
                <FavoriteButton slug={activeTool.slug} name={toolName(activeTool)} withLabel />
                <Link href={`/tools/${activeTool.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11.5px] font-semibold text-mist-200 transition hover:border-white/20 hover:bg-white/[0.06]">
                  Dedicated page <Icon name="arrowUpRight" size={12} />
                </Link>
              </div>
            </div>

            {ToolComponent ? <ToolComponent /> : <Note tone="warn">This tool is being prepared.</Note>}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
              <button
                type="button"
                onClick={() => navigate(`/toolkits/${suite.slug}?tool=${suiteItems[Math.max(0, activeIndex - 1)].slug}`)}
                disabled={activeIndex <= 0}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-mist-400 transition hover:text-mist-100 disabled:opacity-30"
              >
                <Icon name="arrowLeft" size={12} /> Previous tool
              </button>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">{activeIndex + 1} / {suiteItems.length}</span>
              <button
                type="button"
                onClick={() => navigate(`/toolkits/${suite.slug}?tool=${suiteItems[Math.min(suiteItems.length - 1, activeIndex + 1)].slug}`)}
                disabled={activeIndex >= suiteItems.length - 1}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-mist-400 transition hover:text-mist-100 disabled:opacity-30"
              >
                Next tool <Icon name="arrowRight" size={12} />
              </button>
            </div>

            <section aria-labelledby="suite-tool-about">
              <h2 id="suite-tool-about" className="text-[19px] font-semibold tracking-[-0.02em] text-mist-50">About this tool</h2>
              <div className="mt-2 space-y-2.5">
                {activeTool.about.map((paragraph) => (
                  <p key={paragraph} className="text-[13px] leading-[1.75] text-mist-400">{paragraph}</p>
                ))}
              </div>
              <h3 className="mt-5 text-[16px] font-semibold text-mist-50">How to use it</h3>
              <ol className="mt-2 grid gap-2 sm:grid-cols-2">
                {activeTool.steps.map((step, index) => (
                  <li key={step.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="text-[12px] font-semibold text-mist-100"><span className="mr-1.5 font-mono text-[9px] text-brand-300">{String(index + 1).padStart(2, "0")}</span>{step.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-mist-500">{step.text}</p>
                  </li>
                ))}
              </ol>
              <h3 className="mt-5 text-[16px] font-semibold text-mist-50">Frequently asked questions</h3>
              <div className="mt-2"><FaqList faqs={activeTool.faqs} /></div>
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-[86px]">
            <div className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">In this suite</p>
              <div className="mt-2 space-y-0.5">
                {suiteItems.map((tool) => (
                  <button
                    key={tool.slug}
                    type="button"
                    onClick={() => navigate(`/toolkits/${suite.slug}?tool=${tool.slug}`)}
                    disabled={!isToolEnabled(tool.slug)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] transition disabled:opacity-40",
                      tool.slug === activeTool.slug ? "bg-brand-400/10 font-semibold text-brand-200" : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-100"
                    )}
                  >
                    <Icon name={tool.icon} size={12} className="shrink-0" />
                    <span className="min-w-0 truncate">{toolName(tool)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-brand-400/15 bg-brand-400/[0.04] p-4">
              <Icon name="shield" size={16} className="text-brand-300" />
              <p className="mt-2 text-[12px] font-semibold text-mist-100">Local by default</p>
              <p className="mt-1 text-[11px] leading-relaxed text-mist-400">Inputs are processed in this tab. Images and PDFs are not uploaded. See the privacy policy for the few optional services.</p>
              <Link href="/privacy" className="mt-2 inline-block text-[11px] font-medium text-mist-300 underline decoration-white/20 underline-offset-2 hover:text-brand-200">Privacy policy</Link>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section aria-labelledby="suite-overview">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="suite-overview" className="text-[21px] font-semibold tracking-[-0.025em] text-mist-50">Tools in this suite</h2>
                <p className="mt-1 text-[12px] text-mist-500">
                  {suite.keepSeparate
                    ? "Each tool opens on its own page — these results are intentionally not combined."
                    : "Choose a tab above or open any tool directly. Both routes use the same working component."}
                </p>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">{availableItems.length} available</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableItems.map((tool) => <ToolOverviewCard key={tool.slug} suiteSlug={suite.slug} tool={tool} keepSeparate={Boolean(suite.keepSeparate)} />)}
            </div>
            {availableItems.length < suiteItems.length && (
              <Note tone="info" className="mt-3">Some tools in this suite are currently disabled by the administrator. Their dedicated pages explain the temporary unavailability.</Note>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
            <h2 className="text-[18px] font-semibold text-mist-50">About the {suite.name}</h2>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {suite.about.map((paragraph) => <p key={paragraph} className="text-[12.5px] leading-relaxed text-mist-400">{paragraph}</p>)}
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">Every tool keeps its own URL, metadata and SEO page.</p>
          </section>
        </div>
      )}

      <section className="mt-10 border-t border-white/[0.07] pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-mist-50">Other suites</h2>
          <Link href="/tools" className="text-[11.5px] font-medium text-mist-500 transition hover:text-mist-200">All tools and suites →</Link>
        </div>
        <div className="mt-3"><SuiteSwitcher activeSlug={suite.slug} /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {relatedSuites.map((item) => {
            const itemTools = suiteTools(item);
            return (
              <Link key={item.slug} href={`/toolkits/${item.slug}`} className="group rounded-xl border border-white/[0.07] bg-ink-850/60 p-3 transition hover:border-white/[0.16]">
                <span className={cn("grid size-8 place-items-center rounded-lg border", suiteAccentClasses[item.accent])}>
                  <Icon name={item.icon} size={14} />
                </span>
                <p className="mt-2 text-[12.5px] font-semibold text-mist-100">{item.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-relaxed text-mist-500">{item.tagline}</p>
                <span className="mt-2 block font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-600">{itemTools.length} tools</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {tools.filter((tool) => !suiteItems.some((item) => item.slug === tool.slug)).slice(0, 4).map((tool) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`} className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[11px] text-mist-500 transition hover:border-white/15 hover:text-mist-100">
            {toolName(tool)}
          </Link>
        ))}
      </div>
    </Container>
  );
}

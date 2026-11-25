import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { Link, useNavigate } from "@/lib/router";
import { categories, tools, toolsInCategory } from "@/lib/tools";
import { SITE_URL, useSeo } from "@/lib/seo";
import { useFavorites } from "@/lib/favorites";
import { Icon } from "@/components/Icons";
import { useSearch } from "@/components/Layout";
import { ToolBrowser, categoryAccent } from "@/components/ToolBrowser";
import { RecentTools } from "@/components/RecentlyUsed";
import { SuiteDirectory } from "@/components/SuiteDirectory";
import { suites } from "@/lib/suites";
import { Reveal } from "@/components/Reveal";
import {
  AdSlot,
  Badge,
  Button,
  Container,
  Eyebrow,
  FaqList,
} from "@/components/ui";

const FEATURES = [
  { icon: "tools" as const, title: `${tools.length} focused tools`, text: "One quiet place for the tasks you repeat." },
  { icon: "shield" as const, title: "No accounts", text: "Open, use, close. Nothing to remember." },
  { icon: "heart" as const, title: "No dark patterns", text: "No fake urgency, no disguised ads." },
  { icon: "command" as const, title: "Keyboard-ready", text: "Find any tool instantly with ⌘K." },
];

const TRUST_POINTS = [
  { icon: "shield" as const, text: "Nothing uploaded" },
  { icon: "zap" as const, text: "Instant, local results" },
  { icon: "star" as const, text: "Free, no sign-up" },
];

const QUICK_TOOLS = ["password-generator", "json-formatter-validator", "word-counter", "qr-code-generator"]
  .map((slug) => tools.find((tool) => tool.slug === slug))
  .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

const VALUES = [
  {
    icon: "shield" as const,
    title: "Private by default",
    text: "Tool inputs are processed in your browser. There is no Toolsy account and no server-side history of what you calculate or generate.",
  },
  {
    icon: "sparkles" as const,
    title: "Useful over loud",
    text: "Every tool exists to finish a real task. No invented statistics, no countdown timers, no results held behind a fake download button.",
  },
  {
    icon: "zap" as const,
    title: "Fast and accessible",
    text: "Clear headings, keyboard focus, reduced-motion support and layouts that work on a small phone as well as a wide monitor.",
  },
  {
    icon: "heart" as const,
    title: "Honest funding",
    text: "Toolsy is free today. If ads or affiliate links arrive, they will be clearly labelled and kept away from the working part of each tool.",
  },
];

const HOME_FAQS = [
  {
    q: "Are Toolsy's tools really free?",
    a: "Yes. There is no paywall, no trial and no account requirement. Toolsy aims to cover its costs through clearly labelled advertising and, where relevant, affiliate links in the future. We do not sell tool inputs.",
  },
  {
    q: "Do you store what I type or generate?",
    a: "No. The tools run in your browser and there is no endpoint that receives their inputs. Generated passwords, pasted text and calculations are not saved on a server. The one exception is your favorites list, which is stored locally in your browser.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Every tool works without registration. Favorites are kept in your browser's local storage, so the star system works without a login — it simply won't follow you to a new device.",
  },
  {
    q: "How is Toolsy funded?",
    a: "Today it isn't — there are no ads running. The plan is to fund the toolkit with clearly labelled, respectful ad placements and relevant affiliate links. We will never disguise an advertisement as a tool result, and no funding approach is guaranteed to succeed.",
  },
  {
    q: "Can I use Toolsy on my phone?",
    a: "Yes. Each tool is designed to work on mobile and desktop, with large touch targets and no hover-only functionality for essential actions.",
  },
];

function HeroSearch({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  const navigate = useNavigate();
  const { openSearch } = useSearch();

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return tools
      .filter((tool) =>
        [tool.name, tool.tagline, tool.category, ...tool.keywords]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      )
      .slice(0, 5);
  }, [query]);

  return (
    <div className="relative mt-7 max-w-[545px]">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (suggestions[0]) navigate(`/tools/${suggestions[0].slug}`);
          else navigate(`/tools?q=${encodeURIComponent(query)}`);
        }}
        className="flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-ink-850/90 p-1.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur transition focus-within:border-brand-400/45 focus-within:ring-2 focus-within:ring-brand-400/10"
      >
        <Icon name="search" size={18} className="ml-2 shrink-0 text-mist-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${tools.length} tools — try “JSON”, “image” or “BMI”`}
          aria-label="Search tools"
          type="search"
          className="h-10 min-w-0 flex-1 bg-transparent text-[13px] text-mist-50 outline-none placeholder:text-mist-500 sm:text-[13.5px] [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="rounded-md p-1.5 text-mist-500 transition hover:bg-white/5 hover:text-mist-100"
          >
            <Icon name="close" size={14} />
          </button>
        )}
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-400 px-3.5 text-[12.5px] font-bold text-ink-950 transition hover:bg-brand-300 active:scale-[0.985]"
        >
          <span className="hidden sm:inline">Browse</span>
          <Icon name="arrowRight" size={14} />
        </button>
      </form>

      {query.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/[0.12] bg-ink-850 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]">
          {suggestions.length > 0 ? (
            suggestions.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-white/[0.05]"
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-md border", categoryAccent[tool.category])}>
                  <Icon name={tool.icon} size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-mist-100">{tool.name}</span>
                  <span className="block truncate text-[10.5px] text-mist-500">{tool.tagline}</span>
                </span>
                <Icon name="arrowUpRight" size={13} className="shrink-0 text-mist-500" />
              </Link>
            ))
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-[12.5px] text-mist-300">No tools match “{query}”.</p>
              <button
                type="button"
                onClick={openSearch}
                className="mt-2 text-[11.5px] font-medium text-brand-300 underline underline-offset-4"
              >
                Search the full toolkit
              </button>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-white/[0.07] bg-ink-925/60 px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
              {suggestions.length} match{suggestions.length === 1 ? "" : "es"}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">
              Enter to open first
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroPanel() {
  const { openSearch } = useSearch();
  const { favorites } = useFavorites();

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[440px]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[44px] bg-[radial-gradient(closest-side,rgba(199,240,95,0.13),transparent_75%)] blur-2xl"
      />
      <div className="relative rounded-[26px] border border-white/[0.1] bg-ink-850/90 p-2.5 shadow-[0_45px_110px_-45px_rgba(0,0,0,1)] backdrop-blur">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
            Quick access
          </span>
          <button
            type="button"
            onClick={openSearch}
            aria-label="Open quick search"
            className="flex min-h-8 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[9px] text-mist-500 transition hover:border-white/20 hover:text-mist-200"
          >
            <Icon name="command" size={10} />
            K
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-925/80">
          <button
            type="button"
            onClick={openSearch}
            className="flex min-h-11 w-full items-center gap-2 border-b border-white/[0.06] px-3.5 py-3 text-left transition hover:bg-white/[0.025]"
          >
            <Icon name="search" size={14} className="shrink-0 text-mist-500" />
            <span className="flex-1 text-[12px] text-mist-500">Search {tools.length} tools…</span>
            <kbd className="rounded border border-white/10 bg-ink-900 px-1.5 py-0.5 font-mono text-[9px] text-mist-500">
              ⌘K
            </kbd>
          </button>
          <div className="p-2">
            {QUICK_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-white/[0.045]"
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", categoryAccent[tool.category])}>
                  <Icon name={tool.icon} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-mist-200 group-hover:text-mist-50">
                    {tool.name}
                  </span>
                  <span className="block truncate text-[10px] text-mist-500">{tool.tagline}</span>
                </span>
                <Icon
                  name="arrowUpRight"
                  size={13}
                  className="shrink-0 text-mist-600 transition group-hover:text-brand-300"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-2.5 rounded-2xl border border-brand-400/15 bg-brand-400/[0.05] p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-brand-400/20 bg-brand-400/[0.08] text-brand-300">
              <Icon name="shield" size={14} />
            </span>
            <div>
              <p className="text-[11.5px] font-semibold text-mist-100">
                Everything stays on your device
              </p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-mist-500">
                No accounts. No uploads. Favorites saved in this browser only.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">
          <span className="size-1.5 rounded-full bg-brand-400" />
          {tools.length} tools · no analytics
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-mist-500">
          <Icon name="star" size={11} className="text-brand-300/80" />
          {favorites.length > 0
            ? `${favorites.length} favorite${favorites.length === 1 ? "" : "s"} saved`
            : "Star a tool to keep it close"}
        </span>
      </div>
    </div>
  );
}

export function Home() {
  const [query, setQuery] = useState("");
  const { openSearch } = useSearch();

  useSeo({
    title: `Toolsy — ${tools.length} Free Online Tools in ${suites.length} Suites`,
    description:
      "Free online tools organised into suites: Calculator Hub, Text Studio, Image Studio, Developer Toolkit, PDF, QR and Family & Growth. Private, browser-based, no account.",
    path: "/",
    schema: [
      {
        "@type": "FAQPage",
        mainEntity: HOME_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "ItemList",
        name: "Toolsy online tools",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `${SITE_URL}/tools/${tool.slug}`,
        })),
      },
    ],
  });

  return (
    <div>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="relative pb-4">
        <Container className="pb-12 pt-12 sm:pt-16 lg:pb-20 lg:pt-20">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-10">
            <div className="min-w-0 animate-fade-up">
              <div className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5">
                <span className="relative flex size-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-brand-400" />
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist-300">
                  {tools.length} free tools
                </span>
                <span aria-hidden="true" className="h-3 w-px bg-white/10" />
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist-500">
                  No account
                </span>
                <span aria-hidden="true" className="h-3 w-px bg-white/10" />
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist-500">
                  Private
                </span>
              </div>

              <h1
                id="hero-heading"
                className="mt-5 max-w-[620px] text-[40px] font-semibold leading-[0.98] tracking-[-0.045em] text-mist-50 sm:text-[56px] lg:text-[62px]"
              >
                Free online tools,
                <br />
                <span className="font-serif font-normal italic tracking-[-0.015em] text-brand-200">
                  done properly.
                </span>
              </h1>

              <p className="mt-5 max-w-[530px] text-[14.5px] leading-relaxed text-mist-400 sm:text-[15.5px]">
                {tools.length} focused utilities in {suites.length} organised suites — calculators,
                text, images, developers, PDFs, QR codes and family growth. Everything runs in your
                browser. No sign-up, no uploads, no noise.
              </p>

              <HeroSearch query={query} setQuery={setQuery} />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  Popular
                </span>
                {QUICK_TOOLS.slice(0, 3).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] py-1.5 pl-3 pr-2.5 text-[11.5px] text-mist-400 transition hover:border-white/20 hover:text-mist-100"
                  >
                    {tool.shortName}
                    <Icon
                      name="arrowUpRight"
                      size={11}
                      className="text-mist-600 transition group-hover:text-brand-300"
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
                {TRUST_POINTS.map((point) => (
                  <span key={point.text} className="inline-flex items-center gap-1.5 text-[11.5px] text-mist-500">
                    <Icon name={point.icon} size={13} className="text-brand-300/80" />
                    {point.text}
                  </span>
                ))}
              </div>
            </div>

            <HeroPanel />
          </div>
        </Container>
      </section>

      {/* Feature strip */}
      <Container>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex items-start gap-2.5 bg-ink-950 px-4 py-4">
              <Icon
                name={feature.icon === "tools" ? "layers" : feature.icon}
                size={15}
                className="mt-0.5 shrink-0 text-brand-300/85"
              />
              <div>
                <p className="text-[12px] font-semibold text-mist-200">{feature.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-mist-500">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Toolkit */}
      <Container className="pt-14 sm:pt-20">
        <ToolBrowser
          query={query}
          onQueryChange={setQuery}
          showSearch={false}
          heading="The whole toolkit"
          description={`${tools.length} focused tools in ${suites.length} suites, with no sign-up screens, no uploads and no upsells hiding behind the download button.`}
        />
      </Container>

      <Container className="pt-12">
        <SuiteDirectory
          heading="Seven suites, one calm toolkit"
          description="Related functions share a tabbed workspace while keeping dedicated pages. Start with the job, not a list of 55 links."
        />
      </Container>

      <Container className="pt-10">
        <RecentTools />
      </Container>

      {/* Values */}
      <section className="cv-auto mt-16 border-y border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.022),transparent_60%)] sm:mt-20">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
            <Reveal>
              <Eyebrow>Why Toolsy</Eyebrow>
              <h2 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-mist-50 sm:text-[38px]">
                Built to be used,
                <br />
                <span className="font-serif font-normal italic text-brand-200">not to hold you hostage.</span>
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-mist-400">
                A tool should finish a job and get out of the way. No account wall, no manufactured
                scarcity, no “download your result” button that turns out to be an advertisement.
              </p>
              <Link
                href="/about"
                className="mt-5 inline-flex min-h-9 items-center gap-1.5 text-[12.5px] font-semibold text-mist-200 transition hover:text-brand-300"
              >
                Read our principles
                <Icon name="arrowRight" size={14} />
              </Link>
            </Reveal>

            <div className="grid gap-3 sm:grid-cols-2">
              {VALUES.map((value, index) => (
                <Reveal key={value.title} delay={index * 60}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-ink-900/60 p-4 transition-colors hover:border-white/[0.13]">
                    <span className="grid size-8 place-items-center rounded-lg border border-brand-400/15 bg-brand-400/[0.06] text-brand-300">
                      <Icon name={value.icon} size={15} />
                    </span>
                    <h3 className="mt-3 text-[13.5px] font-semibold text-mist-100">{value.title}</h3>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-500">{value.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Categories */}
      <Container className="pt-16 sm:pt-20">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Browse by category</Eyebrow>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-mist-50 sm:text-[32px]">
                Start with the job at hand
              </h2>
              <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-mist-400">
                Six everyday categories, one consistent interface. Every tool works the same way:
                open it, get the answer, move on.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex min-h-9 items-center gap-1.5 self-start text-[12px] font-semibold text-mist-300 transition hover:text-brand-300 sm:self-auto"
            >
              Browse all {tools.length}
              <Icon name="arrowRight" size={13} />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const items = toolsInCategory(category.id);
              return (
                <Reveal key={category.id} delay={index * 45}>
                  <Link
                    href={`/tools?category=${category.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-ink-850/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-ink-850"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("grid size-9 place-items-center rounded-xl border", categoryAccent[category.id])}>
                        <Icon name={category.icon} size={16} />
                      </span>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-600">
                        {items.length} tools
                      </span>
                    </div>
                    <h3 className="mt-3 text-[14px] font-semibold text-mist-100">{category.name}</h3>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">
                      {category.description}
                    </p>
                    <p className="mt-3 truncate text-[10.5px] text-mist-600 transition group-hover:text-mist-400">
                      {items.map((item) => item.shortName).join(" · ")}
                    </p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Reveal>
      </Container>

      <Container className="pt-14">
        <AdSlot />
      </Container>

      {/* FAQ */}
      <Container className="cv-auto pt-16 sm:pt-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <Eyebrow>Good to know</Eyebrow>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-mist-50 sm:text-[32px]">
              Straight answers
            </h2>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-mist-400">
              The questions people ask before trusting a free tool with a task. Still curious?
              We're happy to answer directly.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/contact"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[12px] font-semibold text-mist-200 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                Contact Toolsy
                <Icon name="arrowRight" size={13} />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-mist-400 transition hover:bg-white/[0.04] hover:text-mist-100"
              >
                Privacy policy
              </Link>
            </div>
          </div>
          <FaqList faqs={HOME_FAQS} />
        </div>
      </Container>

      {/* CTA */}
      <Container className="pt-16 sm:pt-20">
        <div className="relative overflow-hidden rounded-[26px] border border-white/[0.09] bg-gradient-to-br from-brand-400/[0.09] via-ink-850 to-ink-900 px-6 py-9 sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 size-64 rounded-full bg-brand-400/[0.09] blur-3xl"
          />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <Badge tone="brand">
                <Icon name="star" size={10} />
                Your toolkit
              </Badge>
              <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-mist-50 sm:text-[32px]">
                Make the useful ones easy to find.
              </h2>
              <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-mist-400">
                Star any tool to save it in your browser. Then press ⌘K (or Ctrl+K) anywhere for
                instant access — no account required.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/favorites"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-400 px-4 text-[13px] font-bold text-ink-950 transition hover:bg-brand-300"
              >
                <Icon name="star" size={15} />
                Your favorites
              </Link>
              <Button variant="secondary" size="md" onClick={openSearch}>
                Quick search
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

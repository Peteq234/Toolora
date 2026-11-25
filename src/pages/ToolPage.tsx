import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { Link } from "@/lib/router";
import { getCategory, getRelatedTools, toolsInCategory, type Tool } from "@/lib/tools";
import { suiteForTool } from "@/lib/suites";
import { SITE_URL, useSeo } from "@/lib/seo";
import { useRecent } from "@/lib/recent";
import { usePlatform } from "@/lib/platform";
import { toolComponents } from "@/tools";
import { Icon } from "@/components/Icons";
import { ToolCard, categoryAccent } from "@/components/ToolBrowser";
import {
  AdSlot,
  Badge,
  Breadcrumbs,
  Container,
  CopyButton,
  FaqList,
  FavoriteButton,
  Note,
} from "@/components/ui";

function RelatedCompact({ tool }: { tool: Tool }) {
  const category = getCategory(tool.category);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-start gap-2.5 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]"
    >
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-ink-900 text-mist-400 group-hover:text-brand-300">
        <Icon name={tool.icon} size={13} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-mist-300 group-hover:text-mist-50">
          {tool.name}
        </span>
        <span className="block truncate font-mono text-[9px] uppercase tracking-[0.08em] text-mist-600">
          {category.name}
        </span>
      </span>
    </Link>
  );
}

function Feedback({ slug }: { slug: string }) {
  const { submitFeedback, config } = usePlatform();
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send() {
    if (helpful === null && message.trim().length === 0) {
      setError("Choose a rating or write a short message first.");
      return;
    }
    setError("");
    setStatus("sending");
    const result = await submitFeedback({
      slug,
      ...(helpful === null ? {} : { helpful }),
      ...(message.trim() ? { message: message.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
    });
    if (result.ok) {
      setStatus("sent");
      setMessage("");
      setEmail("");
    } else {
      setStatus("idle");
      setError(result.error ?? "Feedback could not be saved.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-brand-400/25 bg-brand-400/[0.06] px-4 py-3" role="status">
        <p className="text-[12.5px] font-semibold text-brand-100">Thank you — your feedback was received.</p>
        <p className="mt-0.5 text-[11px] text-mist-500">It will be reviewed in the private dashboard. No account was created.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] font-semibold text-mist-100">Was this page helpful?</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHelpful(true)}
            aria-pressed={helpful === true}
            className={helpful === true ? "inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-400/40 bg-brand-400/10 px-2.5 text-[11.5px] font-semibold text-brand-200" : "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.025] px-2.5 text-[11.5px] text-mist-300 transition hover:border-white/20"}
          >
            <Icon name="check" size={12} /> Yes
          </button>
          <button
            type="button"
            onClick={() => setHelpful(false)}
            aria-pressed={helpful === false}
            className={helpful === false ? "inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 text-[11.5px] font-semibold text-amber-200" : "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.025] px-2.5 text-[11.5px] text-mist-300 transition hover:border-white/20"}
          >
            <Icon name="close" size={12} /> Not really
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_200px]">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Optional: what worked, what was unclear, or what's missing?"
          aria-label="Feedback message"
          className="field-input resize-y text-[12px] leading-relaxed"
        />
        <div className="space-y-2">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            maxLength={254}
            placeholder="Email (optional, for a reply)"
            aria-label="Feedback email (optional)"
            className="field-input text-[12px]"
          />
          <button type="button" onClick={() => void send()} disabled={status === "sending"} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-400 text-[12px] font-bold text-ink-950 transition hover:bg-brand-300 disabled:opacity-50">
            <Icon name={status === "sending" ? "refresh" : "send"} size={13} className={status === "sending" ? "animate-spin" : ""} />
            {status === "sending" ? "Sending…" : "Send feedback"}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-[11.5px] font-medium text-rose-300" role="alert">{error}</p>}
      <p className="mt-2 text-[10px] leading-relaxed text-mist-600">
        {config.configured
          ? "Only what you type is sent. The dashboard stores the tool name, rating, message, optional email and time — no IP address or tracking identifiers."
          : "Feedback storage is not connected to a backend yet. Use the contact page to reach us directly."}
      </p>
    </div>
  );
}

export function ToolPage({ tool }: { tool: Tool }) {
  const category = getCategory(tool.category);
  const ToolComponent = toolComponents[tool.slug];
  const related = getRelatedTools(tool, 3);
  const categoryTools = toolsInCategory(tool.category);
  const path = `/tools/${tool.slug}`;
  const { recordRecent } = useRecent();
  const { seoFor, isToolEnabled, recordEvent, toolName, toolDescription, categoryLabel } = usePlatform();
  const suite = suiteForTool(tool.slug);
  const displayName = toolName(tool);
  const displayDescription = toolDescription(tool);
  const seo = seoFor(tool.slug, { title: tool.metaTitle, description: tool.metaDescription });
  const toolEnabled = isToolEnabled(tool.slug);

  useEffect(() => {
    recordRecent(tool.slug);
    if (recordEvent) recordEvent(tool.slug, "tool_open");
  }, [tool.slug, recordRecent, recordEvent]);

  useSeo({
    title: seo.title,
    description: seo.description,
    path,
    schema: [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: seo.description,
        url: `${SITE_URL}${path}`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any modern browser",
        browserRequirements: "Requires JavaScript",
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "Toolsy", url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools` },
          { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE_URL}${path}` },
        ],
      },
    ],
  });

  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: displayName },
        ]}
      />

      <header className="animate-fade-up">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl border sm:size-14",
              categoryAccent[tool.category]
            )}
          >
            <Icon name={tool.icon} size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{categoryLabel(category.id, category.name)}</Badge>
              {suite && (
                <Link href={`/toolkits/${suite.slug}`} className="inline-flex min-h-8 items-center rounded-full border border-brand-400/25 bg-brand-400/[0.07] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-brand-200 transition hover:bg-brand-400/[0.12]">
                  {suite.name}
                </Link>
              )}
              {tool.isNew && <Badge tone="brand">New</Badge>}
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                Updated {tool.updated}
              </span>
            </div>
            <h1 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-mist-50 sm:text-[40px]">
              {displayName}
            </h1>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-mist-300 sm:text-[15px]">
          {tool.intro}
        </p>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-mist-500">{displayDescription}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <FavoriteButton slug={tool.slug} name={displayName} withLabel />
          <CopyButton value={`${SITE_URL}${path}`} label="Copy link" copiedLabel="Link copied" />
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">
            <Icon name="shield" size={11} className="text-brand-300/80" />
            Runs locally · free
          </span>
        </div>
      </header>

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_286px] xl:gap-10">
        <div className="min-w-0 space-y-8">
          {!toolEnabled ? (
            <Note tone="warn" title="This tool is temporarily unavailable">
              An administrator has disabled this tool in the tools manager. Nothing is broken in your
              browser — please try another tool from the toolkit, or come back later.
            </Note>
          ) : ToolComponent ? (
            <ToolComponent />
          ) : (
            <Note tone="warn">This tool is being prepared. Try another tool from the toolkit.</Note>
          )}

          <section aria-labelledby="about-this-tool" className="space-y-4">
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-300/80">
                Background
              </p>
              <h2 id="about-this-tool" className="mt-1.5 text-[24px] font-semibold tracking-[-0.025em] text-mist-50">
                About the {tool.name}
              </h2>
            </div>
            <div className="space-y-3">
              {tool.about.map((paragraph, index) => (
                <p key={index} className="text-[13.5px] leading-[1.75] text-mist-400">
                  {paragraph}
                </p>
              ))}
            </div>

            <h2 className="pt-2 text-[20px] font-semibold tracking-[-0.02em] text-mist-50">
              How to use it
            </h2>
            <ol className="grid gap-2.5 sm:grid-cols-2">
              {tool.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-brand-400/25 bg-brand-400/[0.08] font-mono text-[9px] text-brand-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[12.5px] font-semibold text-mist-100">{step.title}</h3>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">{step.text}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <h2 className="pt-2 text-[20px] font-semibold tracking-[-0.02em] text-mist-50">
              Frequently asked questions
            </h2>
            <FaqList faqs={tool.faqs} />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tool.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10.5px] text-mist-500"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </section>

          <AdSlot />

          <Feedback slug={tool.slug} />

          <section aria-labelledby="related-tools">
            <div className="flex items-end justify-between gap-3">
              <h2 id="related-tools" className="text-[20px] font-semibold tracking-[-0.02em] text-mist-50">
                Related tools
              </h2>
              <Link
                href="/tools"
                className="inline-flex min-h-9 items-center gap-1 text-[12px] font-medium text-mist-500 transition hover:text-mist-200"
              >
                All tools
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <ToolCard key={item.slug} tool={item} />
              ))}
            </div>
            {suite && (
              <Link href={`/toolkits/${suite.slug}`} className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-[11.5px] font-medium text-brand-300 hover:text-brand-200">
                Explore all {suite.toolSlugs.length} tools in {suite.name}
                <Icon name="arrowRight" size={12} />
              </Link>
            )}
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[86px] space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
                On this page
              </p>
              <nav aria-label="On this page" className="mt-2.5 space-y-1">
                <a href="#content" className="block rounded-lg px-2 py-1.5 text-[12px] font-medium text-mist-200">
                  The tool
                </a>
                <a href="#about-this-tool" className="block rounded-lg px-2 py-1.5 text-[12px] text-mist-400 transition hover:bg-white/[0.04] hover:text-mist-100">
                  About this tool
                </a>
                <a href="#related-tools" className="block rounded-lg px-2 py-1.5 text-[12px] text-mist-400 transition hover:bg-white/[0.04] hover:text-mist-100">
                  Related tools
                </a>
              </nav>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
                  More in {category.name}
                </p>
                <Icon name={category.icon} size={13} className="text-mist-600" />
              </div>
              <div className="mt-2 space-y-0.5">
                {categoryTools
                  .filter((item) => item.slug !== tool.slug)
                  .slice(0, 4)
                  .map((item) => (
                    <RelatedCompact key={item.slug} tool={item} />
                  ))}
              </div>
              <Link
                href={`/tools?category=${category.id}`}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-300/90 transition hover:text-brand-200"
              >
                Browse category
                <Icon name="arrowRight" size={12} />
              </Link>
            </div>

            <div className="rounded-2xl border border-brand-400/15 bg-brand-400/[0.04] p-4">
              <Icon name="shield" size={17} className="text-brand-300" />
              <p className="mt-2 text-[12px] font-semibold text-mist-100">Private by design</p>
              <p className="mt-1 text-[11px] leading-relaxed text-mist-400">
                Tool inputs are processed in this tab. Favorites live in your browser's local
                storage. No account, no tool history on a server.
              </p>
              <Link
                href="/privacy"
                className="mt-2.5 inline-flex min-h-9 items-center gap-1 text-[11px] font-medium text-mist-300 underline decoration-white/20 underline-offset-2 hover:text-brand-200"
              >
                Read the privacy policy
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}

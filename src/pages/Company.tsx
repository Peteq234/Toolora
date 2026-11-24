import { useMemo, useState } from "react";
import { Link, useLocation } from "@/lib/router";
import { categories, tools } from "@/lib/tools";
import { SITE_URL, useSeo } from "@/lib/seo";
import { useSearch } from "@/components/Layout";
import { Icon } from "@/components/Icons";
import {
  AdSlot,
  Badge,
  Breadcrumbs,
  Button,
  Container,
  CopyButton,
  Eyebrow,
  Field,
  Input,
  Note,
  Select,
} from "@/components/ui";

const PRINCIPLES = [
  {
    icon: "shield" as const,
    title: "Privacy without a lecture",
    text: "Tools process data in the browser. We don't require an account, and we don't keep a server-side record of what you type, generate or calculate.",
  },
  {
    icon: "sparkles" as const,
    title: "Real utility only",
    text: "A tool earns its place if it finishes a real task. We don't add fake counters, invented testimonials or buttons that exist only to take you somewhere else.",
  },
  {
    icon: "zap" as const,
    title: "Speed is a feature",
    text: "Pages should load quickly on ordinary connections. Layouts stay simple, dependencies stay deliberate, and tools respond as you type.",
  },
  {
    icon: "heart" as const,
    title: "Honest monetisation",
    text: "Advertising and affiliate links may fund the site later. If they arrive, they will be clearly labelled and kept out of the way of the tools themselves.",
  },
];

const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "tool", label: "Tool suggestion" },
  { value: "bug", label: "Bug report" },
  { value: "advertising", label: "Advertising or partnership" },
  { value: "privacy", label: "Privacy question" },
];

const CONTACT_EMAIL = "hello@toolora.com";

function validTopic(value: string | null): string {
  return CONTACT_TOPICS.some((topic) => topic.value === value) ? (value as string) : "general";
}

export function AboutPage() {
  useSeo({
    title: "About Toolora — Free, Private Online Tools",
    description:
      `Why Toolora exists: ${tools.length} genuinely useful browser-based tools, a privacy-first approach, honest funding plans and no fake statistics. Read our principles.`,
    path: "/about",
    schema: {
      "@type": "AboutPage",
      name: "About Toolora",
      description:
        "Toolora is a free online toolkit built around privacy, genuine utility and honest monetisation.",
      url: `${SITE_URL}/about`,
      about: {
        "@type": "Organization",
        name: "Toolora",
        url: SITE_URL,
        email: CONTACT_EMAIL,
        description:
          "A free online tools platform offering browser-based utilities for everyday tasks.",
      },
    },
  });

  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <header className="animate-fade-up max-w-3xl">
        <Eyebrow>About Toolora</Eyebrow>
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-mist-50 sm:text-[50px]">
          Tools should be useful.
          <br />
          <span className="font-serif font-normal italic text-brand-200">Not noisy.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-mist-400">
          Toolora is a free online toolkit for the small tasks that break your concentration:
          generating a password, counting a paragraph, converting a measurement, checking your age.
          {tools.length} tools, one calm interface and no account required.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="brand">{tools.length} tools</Badge>
          <Badge>{categories.length} categories</Badge>
          <Badge>Zero sign-ups</Badge>
          <Badge>No analytics today</Badge>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="why">
            <h2 id="why" className="text-[24px] font-semibold tracking-[-0.025em] text-mist-50">
              Why this exists
            </h2>
            <div className="mt-3 space-y-3 text-[13.5px] leading-[1.75] text-mist-400">
              <p>
                Plenty of useful tools are buried under intrusive advertising, inflated claims or
                sign-up walls. Toolora takes the opposite approach: the tool comes first, the
                interface stays quiet, and nothing is uploaded unless there is a genuine reason.
              </p>
              <p>
                Each tool has a narrow purpose and a complete explanation beneath it. If a
                calculation is approximate, the page says so. If a result depends on missing data,
                the page explains the gap instead of inventing precision.
              </p>
              <p>
                Toolora is an independent project rather than a large company. That means a smaller
                catalogue and a slower roadmap, but also fewer reasons to compromise on the things
                that make a tool worth trusting.
              </p>
            </div>
          </section>

          <section aria-labelledby="principles">
            <h2 id="principles" className="text-[24px] font-semibold tracking-[-0.025em] text-mist-50">
              What we believe
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => (
                <div key={principle.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <span className="grid size-8 place-items-center rounded-lg border border-brand-400/15 bg-brand-400/[0.06] text-brand-300">
                    <Icon name={principle.icon} size={15} />
                  </span>
                  <h3 className="mt-3 text-[13.5px] font-semibold text-mist-100">{principle.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-mist-500">{principle.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="works">
            <h2 id="works" className="text-[24px] font-semibold tracking-[-0.025em] text-mist-50">
              How the site works
            </h2>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-mist-400">
              {[
                "Most tools run entirely in your browser. Passwords use the Web Crypto API and calculations happen on your device.",
                "Favorites are stored in your browser's local storage. They don't sync to other devices and Toolora cannot see them.",
                "You can use every tool without an account. There is no email capture gate in front of results.",
                "Pages are built with semantic HTML, keyboard focus states and reduced-motion support, so the site remains usable without a mouse or with animation disabled.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Icon name="checkCircle" size={15} className="mt-0.5 shrink-0 text-brand-300/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="funding">
            <h2 id="funding" className="text-[24px] font-semibold tracking-[-0.025em] text-mist-50">
              How Toolora is funded
            </h2>
            <div className="mt-3 space-y-3 text-[13.5px] leading-[1.75] text-mist-400">
              <p>
                Toolora is free to use and currently shows no advertising. The plan is to fund the
                project through clearly labelled advertising — for example Google AdSense after an
                approval process — and, where genuinely relevant, affiliate links.
              </p>
              <p>
                We won't promise that this succeeds, and we won't invent income claims. We will label
                ads, keep them away from tool controls, and never present sponsored content as a
                neutral result. If a placement ever feels dishonest, it doesn't belong here.
              </p>
            </div>
            <div className="mt-4">
              <AdSlot />
            </div>
          </section>

          <section aria-labelledby="feedback">
            <h2 id="feedback" className="text-[24px] font-semibold tracking-[-0.025em] text-mist-50">
              Corrections and feedback
            </h2>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mist-400">
              Calculators and guides are checked carefully, but mistakes happen. If a result looks
              wrong or an explanation could be clearer, please say so. Tool suggestions are welcome
              too — genuine usefulness is the only test that matters.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/contact"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-400 px-3.5 text-[12.5px] font-bold text-ink-950 transition hover:bg-brand-300"
              >
                <Icon name="mail" size={14} />
                Contact Toolora
              </Link>
              <Link
                href="/tools"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-[12.5px] font-semibold text-mist-200 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                Browse the tools
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[86px] lg:self-start">
          <div className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
              At a glance
            </p>
            <dl className="mt-3 space-y-2.5 text-[12px]">
              {[
                ["Tools", `${tools.length} free utilities`],
                ["Categories", `${categories.length} focused groups`],
                ["Accounts", "Not required"],
                ["Tool data", "Processed in your browser"],
                ["Favorites", "Local storage only"],
                ["Analytics", "None installed currently"],
                ["Last reviewed", "February 2026"],
              ].map(([term, value]) => (
                <div key={term} className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-b-0 last:pb-0">
                  <dt className="text-mist-500">{term}</dt>
                  <dd className="text-right font-medium text-mist-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12px] font-semibold text-mist-100">Read the fine print</p>
            <div className="mt-2 space-y-1.5">
              <Link href="/privacy" className="block text-[11.5px] text-mist-400 transition hover:text-brand-200">
                Privacy policy
              </Link>
              <Link href="/terms" className="block text-[11.5px] text-mist-400 transition hover:text-brand-200">
                Terms of use
              </Link>
              <Link href="/contact?topic=advertising" className="block text-[11.5px] text-mist-400 transition hover:text-brand-200">
                Advertising enquiries
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}

/* --------------------------------- contact -------------------------------- */

type FormState = { name: string; email: string; topic: string; message: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

export function ContactPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const initialTopic = useMemo(() => validTopic(params.get("topic")), [search]);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    topic: initialTopic,
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [mailto, setMailto] = useState("");
  const { openSearch } = useSearch();

  useSeo({
    title: "Contact Toolora — Questions, Bugs & Advertising",
    description:
      "Get in touch with Toolora about a tool suggestion, bug report, privacy question or advertising enquiry. Direct email, no ticket system or account required.",
    path: "/contact",
    schema: {
      "@type": "ContactPage",
      name: "Contact Toolora",
      url: `${SITE_URL}/contact`,
      mainEntity: {
        "@type": "Organization",
        name: "Toolora",
        email: CONTACT_EMAIL,
        contactPoint: {
          "@type": "ContactPoint",
          email: CONTACT_EMAIL,
          contactType: "customer support",
          availableLanguage: "English",
        },
      },
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMailto("");
  }

  function handleSubmit() {
    const nextErrors: FormErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = "Please add a name we can reply to.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (form.message.trim().length < 10) {
      nextErrors.message = "A little more detail will help us respond properly.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMailto("");
      return;
    }

    const topicLabel =
      CONTACT_TOPICS.find((topic) => topic.value === form.topic)?.label ?? "General question";
    const subject = `[Toolora] ${topicLabel} — ${form.name.trim()}`;
    const body = `From: ${form.name.trim()} <${form.email.trim()}>\nTopic: ${topicLabel}\n\n${form.message.trim()}\n\n---\nSent from the Toolora contact page.`;
    const link = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMailto(link);
    window.location.href = link;
  }

  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <header className="animate-fade-up max-w-2xl">
        <Eyebrow>Contact</Eyebrow>
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.03] tracking-[-0.045em] text-mist-50 sm:text-[46px]">
          Say hello.
          <br />
          <span className="font-serif font-normal italic text-brand-200">We actually read email.</span>
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-mist-400">
          Tool ideas, bug reports, privacy questions or advertising enquiries — email is the best
          route. There's no ticket system and no account to create.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0">
          <div className="rounded-[22px] border border-white/[0.08] bg-ink-850 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-4">
              <h2 className="text-[16px] font-semibold text-mist-50">Send a message</h2>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
                Opens your email app
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Your name" htmlFor="contact-name" error={errors.name}>
                <Input
                  id="contact-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Alex"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Email address" htmlFor="contact-email" error={errors.email}>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
              <Field label="Topic" htmlFor="contact-topic" className="sm:col-span-2">
                <Select
                  id="contact-topic"
                  value={form.topic}
                  onChange={(event) => update("topic", event.target.value)}
                  options={CONTACT_TOPICS}
                />
              </Field>
              <Field
                label="Message"
                htmlFor="contact-message"
                hint={`${form.message.length}/2000`}
                error={errors.message}
                className="sm:col-span-2"
              >
                <textarea
                  id="contact-message"
                  value={form.message}
                  maxLength={2000}
                  rows={6}
                  onChange={(event) => update("message", event.target.value)}
                  placeholder="Tell us what you're trying to do, what went wrong, or what's missing…"
                  className="field-input resize-y leading-relaxed"
                  aria-invalid={Boolean(errors.message)}
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleSubmit}>
                <Icon name="send" size={15} />
                Open email draft
              </Button>
              <span className="text-[11px] text-mist-500">
                Nothing is transmitted until you send the email yourself.
              </span>
            </div>

            {mailto && (
              <div className="mt-4 space-y-3" role="status">
                <Note tone="brand" title="Your email app should be opening">
                  If nothing happened, use the direct link below or copy the message. Toolora cannot
                  confirm that an email was sent until it reaches us.
                </Note>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={mailto}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-400 px-3 text-[12px] font-bold text-ink-950 transition hover:bg-brand-300"
                  >
                    <Icon name="mail" size={13} />
                    Open draft again
                  </a>
                  <CopyButton
                    value={`From: ${form.name} <${form.email}>\nTopic: ${CONTACT_TOPICS.find((topic) => topic.value === form.topic)?.label}\n\n${form.message}`}
                    label="Copy message"
                    copiedLabel="Copied"
                  />
                  <CopyButton value={CONTACT_EMAIL} label="Copy email address" copiedLabel="Address copied" iconOnly={false} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href="/contact?topic=advertising"
              className="group rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 transition hover:border-white/15"
            >
              <p className="text-[12.5px] font-semibold text-mist-100">Advertise with Toolora</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">
                Ask about respectful, clearly labelled placements. No results are guaranteed.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-300/90">
                Choose advertising topic
                <Icon name="arrowRight" size={12} />
              </span>
            </Link>
            <button
              type="button"
              onClick={openSearch}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 text-left transition hover:border-white/15"
            >
              <p className="text-[12.5px] font-semibold text-mist-100">Looking for a tool?</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">
                Search the full toolkit first — it may already exist, free and without a sign-up.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-300/90">
                Quick search
                <Icon name="search" size={12} />
              </span>
            </button>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[86px] lg:self-start">
          <div className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
              Direct email
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 block break-all font-mono text-[12.5px] text-brand-200 underline decoration-brand-400/30 underline-offset-4 transition hover:text-brand-100"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
              Direct email, answered by a person. Please don't send passwords or other secrets.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <CopyButton value={CONTACT_EMAIL} label="Copy address" copiedLabel="Copied" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12px] font-semibold text-mist-100">Before you write</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-500">
              <li>• Tell us the tool name and what you expected.</li>
              <li>• For a bug, mention your browser and device.</li>
              <li>• For a tool idea, describe the job it should finish.</li>
              <li>• For privacy requests, use the subject “Privacy”.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
            <div className="flex items-start gap-2">
              <Icon name="alert" size={15} className="mt-0.5 shrink-0 text-amber-300" />
              <div>
                <p className="text-[12px] font-semibold text-amber-100">Not medical or legal advice</p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-100/60">
                  BMI, age and calculation results are informational. For personal health or legal
                  decisions, speak with a qualified professional.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}

/* --------------------------------- 404 ------------------------------------ */

export function NotFoundPage() {
  const { openSearch } = useSearch();

  useSeo({
    title: "Page Not Found — Toolora",
    description: "That page doesn't exist. Search the Toolora toolkit or browse all free tools.",
    path: "/404",
    noindex: true,
  });

  return (
    <Container className="pb-24 pt-16 sm:pt-24">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/[0.08] bg-ink-850 text-mist-400">
          <Icon name="search" size={24} />
        </span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-300/80">
          404 · page not found
        </p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.035em] text-mist-50 sm:text-[38px]">
          This one isn't in the toolkit.
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-mist-400">
          The address may be mistyped, or the page may have moved. There are still {tools.length} working
          tools waiting.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={openSearch}>
            <Icon name="search" size={15} />
            Search the toolkit
          </Button>
          <Link
            href="/tools"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[13px] font-semibold text-mist-200 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            All tools
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-1.5">
          {["password-generator", "word-counter", "unit-converter", "qr-code-generator"].map((slug) => {
            const tool = tools.find((item) => item.slug === slug);
            if (!tool) return null;
            return (
              <Link
                key={slug}
                href={`/tools/${slug}`}
                className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[11.5px] text-mist-400 transition hover:border-white/15 hover:text-mist-100"
              >
                {tool.name}
              </Link>
            );
          })}
        </div>
      </div>
    </Container>
  );
}

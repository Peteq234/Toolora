import { useState } from "react";
import { Link } from "@/lib/router";
import { useSeo } from "@/lib/seo";
import { usePlatform } from "@/lib/platform";
import { Icon } from "@/components/Icons";
import { Breadcrumbs, Button, Container, Field, Input, Note } from "@/components/ui";

type Mode = "tool" | "bug" | "feedback";

const MODES: { id: Mode; label: string; slug: string; titleField: string; messageLabel: string; hint: string }[] = [
  { id: "tool", label: "Suggest a tool", slug: "tool-suggestion", titleField: "Tool idea", messageLabel: "What should it do?", hint: "Describe the problem you want solved and what the tool should accept or produce." },
  { id: "bug", label: "Report a bug", slug: "bug-report", titleField: "Which tool or page?", messageLabel: "What went wrong?", hint: "Include the device and browser, the steps you took and what you expected instead." },
  { id: "feedback", label: "General feedback", slug: "site-feedback", titleField: "Subject", messageLabel: "Your message", hint: "Anything about Toolsy: clarity, speed, accessibility or a feature that would help." },
];

export function SuggestPage() {
  const [mode, setMode] = useState<Mode>("tool");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const { submitFeedback, config } = usePlatform();
  const active = MODES.find((entry) => entry.id === mode) ?? MODES[0];

  useSeo({
    title: "Suggest a Tool or Report a Bug — Toolsy",
    description:
      "Send Toolsy a tool idea, report a bug or share feedback. No account needed. Suggestions are reviewed in the admin dashboard.",
    path: "/suggest",
    schema: {
      "@type": "WebPage",
      name: "Suggest a tool or report a bug",
      url: "https://toolsy.com/suggest",
      description: "Send Toolsy a tool idea, bug report or general feedback.",
      isPartOf: { "@type": "WebSite", name: "Toolsy", url: "https://toolsy.com" },
    },
  });

  async function submit() {
    setError("");
    if (title.trim().length < 3) { setError("Add a short subject of at least 3 characters."); return; }
    if (message.trim().length < 10) { setError("Please add at least 10 characters of detail so the request is actionable."); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError("That email address does not look valid."); return; }
    if (!config.configured) {
      setError("Submissions need the Toolsy backend, which is not connected in this build. Use the contact page to email directly.");
      return;
    }
    setStatus("sending");
    const result = await submitFeedback({
      slug: active.slug,
      message: `[${active.titleField}: ${title.trim()}]\n\n${message.trim()}`,
      ...(email.trim() ? { email: email.trim() } : {}),
    });
    if (result.ok) {
      setStatus("sent");
      setTitle(""); setMessage(""); setEmail("");
    } else {
      setStatus("idle");
      setError(result.error ?? "The submission could not be saved. Please try again.");
    }
  }

  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Suggest a tool" }]} />
      <header className="max-w-2xl">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-brand-300/80">Help shape Toolsy</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.04] tracking-[-0.04em] text-mist-50 sm:text-[40px]">
          Suggest a tool or report a problem.
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-mist-400">
          Ideas that solve a real, repeated task get priority. Bug reports include your device so problems on
          phones can be reproduced. No account is required.
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[18px] border border-white/[0.08] bg-ink-850 p-4 sm:p-5">
          <div role="tablist" aria-label="Submission type" className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-ink-925/70 p-1">
            {MODES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={mode === entry.id}
                onClick={() => { setMode(entry.id); setStatus("idle"); setError(""); }}
                className={mode === entry.id ? "min-h-10 rounded-lg bg-brand-400 px-2 py-2 text-[11.5px] font-bold text-ink-950" : "min-h-10 rounded-lg px-2 py-2 text-[11.5px] font-medium text-mist-400 hover:bg-white/[0.05] hover:text-mist-100"}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {status === "sent" ? (
            <div role="status" className="mt-4 rounded-xl border border-brand-400/25 bg-brand-400/[0.06] p-4">
              <div className="flex items-center gap-2">
                <Icon name="checkCircle" size={17} className="text-brand-300" />
                <p className="text-[13px] font-semibold text-brand-100">Thank you — your submission was received.</p>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-mist-400">It will be reviewed in the Toolsy admin dashboard. If you left an email, we may reply.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setStatus("idle")}>Send another</Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <Field label={active.titleField} htmlFor="suggest-title">
                <Input id="suggest-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder={mode === "tool" ? "e.g. Invoice total calculator" : mode === "bug" ? "e.g. Chess board on iPhone" : "Short subject"} />
              </Field>
              <Field label={active.messageLabel} htmlFor="suggest-message" hint={`${message.length}/2000`}>
                <textarea id="suggest-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={7} placeholder={active.hint} className="field-input resize-y text-[13px] leading-relaxed" aria-describedby="suggest-hint" />
              </Field>
              <p id="suggest-hint" className="text-[11px] leading-relaxed text-mist-500">{active.hint}</p>
              <Field label="Email" htmlFor="suggest-email" hint="optional, for a reply">
                <Input id="suggest-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} placeholder="you@example.com" autoComplete="email" />
              </Field>
              {error && <Note tone="warn">{error}</Note>}
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => void submit()} disabled={status === "sending"}>
                  <Icon name={status === "sending" ? "refresh" : "send"} size={14} className={status === "sending" ? "animate-spin" : ""} />
                  {status === "sending" ? "Sending…" : "Submit"}
                </Button>
                <span className="text-[10.5px] text-mist-500">Validated and rate-limited on the server.</span>
              </div>
              {!config.configured && (
                <Note tone="info" title="Email works without the backend">
                  The submission API is not connected in this environment, so the form explains that instead of
                  pretending to send. You can reach us now through the <Link href="/contact" className="text-brand-200 underline decoration-brand-400/30 underline-offset-2">contact page</Link>.
                </Note>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12px] font-semibold text-mist-100">What makes a good suggestion</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-500">
              <li>• A task you actually repeat, not a novelty</li>
              <li>• What goes in and what should come out</li>
              <li>• Why existing tools do not solve it</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12px] font-semibold text-mist-100">Before reporting a bug</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-500">
              <li>• Reload once and retry</li>
              <li>• Note phone model, browser and screen width</li>
              <li>• Say whether desktop works</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-400/15 bg-brand-400/[0.04] p-4">
            <Icon name="shield" size={16} className="text-brand-300" />
            <p className="mt-2 text-[12px] font-semibold text-mist-100">No secrets, please</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mist-400">Never paste passwords, API keys or private tokens into any submission form.</p>
          </div>
        </aside>
      </div>
    </Container>
  );
}

export default SuggestPage;

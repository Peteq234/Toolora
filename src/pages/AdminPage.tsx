import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Icon, type IconName } from "@/components/Icons";
import { Link } from "@/lib/router";
import { LogoMark } from "@/components/Logo";
import { categories as baseCategories, tools } from "@/lib/tools";
import { suiteForTool, suites } from "@/lib/suites";
import { cn } from "@/utils/cn";
import { Button, Field, Input } from "@/components/ui";

/* ------------------------------ supabase client ---------------------------- */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
const CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type SupabaseModule = typeof import("@supabase/supabase-js");
let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * The admin SDK is loaded only on the /admin route (dynamic import) and is
 * bundled with the app rather than fetched from a third-party CDN. The anon
 * key is public by design; authorization is enforced by the server and RLS.
 */
async function getClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then((module: SupabaseModule) =>
        module.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
        })
      )
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

type ApiState = { loading: boolean; error: string; code?: string };

async function adminFetch<T>(session: Session, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error ?? `Request failed (HTTP ${response.status}).`) as Error & { code?: string; status?: number };
    error.code = body?.code;
    error.status = response.status;
    throw error;
  }
  return body as T;
}

/* ------------------------------- shared bits ------------------------------ */

function SetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12" style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(199,240,95,0.08), transparent 70%), #060709" }}>
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <p className="text-[16px] font-extrabold tracking-tight text-mist-50">Toolora <span className="text-brand-400">Admin</span></p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">Private dashboard</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/[0.05] p-5">
          <div className="flex items-center gap-2">
            <Icon name="lock" size={16} className="text-amber-300" />
            <h1 className="text-[16px] font-semibold text-amber-100">Authentication backend is not configured</h1>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-amber-100/70">
            The dashboard intentionally does not fake a login. Until Supabase credentials are set, there
            is no account system to authenticate against, and no admin data exists to display.
          </p>
          <ol className="mt-4 space-y-2.5 text-[12px] leading-relaxed text-mist-300">
            <li><span className="font-mono text-brand-300">1.</span> Create a free Supabase project, then run <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">supabase/migrations/0001_admin_schema.sql</code> in its SQL editor.</li>
            <li><span className="font-mono text-brand-300">2.</span> Create your account in Supabase → Authentication → Users.</li>
            <li><span className="font-mono text-brand-300">3.</span> Add that user's UUID to <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">public.admin_users</code> using the SQL snippet at the end of the migration.</li>
            <li><span className="font-mono text-brand-300">4.</span> In Vercel, set <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">VITE_SUPABASE_URL</code>, <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>, <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">SUPABASE_URL</code>, <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">SUPABASE_ANON_KEY</code>, <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> and optionally <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px]">ADMIN_EMAILS</code>. Redeploy.</li>
          </ol>
          <p className="mt-3 text-[11px] leading-relaxed text-mist-500">
            Full instructions, including RLS verification steps, are in <code className="font-mono">docs/ADMIN_SETUP.md</code>. No password or service-role key belongs in frontend code or this repository.
          </p>
        </div>
        <Button variant="secondary" className="mt-4" onClick={() => { window.location.href = "/"; }}>
          <Icon name="arrowLeft" size={14} /> Back to Toolora
        </Button>
      </div>
    </main>
  );
}

function AdminLoading({ label = "Checking your session…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-5">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">{label}</p>
      </div>
    </div>
  );
}

/* ---------------------------------- login --------------------------------- */

function LoginScreen({ onSession, supabase }: { onSession: (session: Session) => void; supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notAdmin, setNotAdmin] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotAdmin(false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    if (password.length < 8) { setError("Enter your password."); return; }
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.session) {
        setError("Email or password is incorrect. Check your details and try again.");
        return;
      }
      try {
        await adminFetch(data.session, "overview");
        onSession(data.session);
      } catch (apiError) {
        await supabase.auth.signOut();
        const typed = apiError as Error & { status?: number; code?: string };
        if (typed.status === 403) {
          setNotAdmin(true);
          setError("This account is signed in but is not an authorized administrator.");
        } else if (typed.status === 503) {
          setError("The server has no Supabase configuration. Complete the backend setup first.");
        } else {
          setError(typed.message || "The server could not authorize this session.");
        }
      }
    } catch {
      setError("The authentication service could not be reached. Check your connection and try again.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-10" style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(199,240,95,0.09), transparent 70%), #060709" }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="relative w-full max-w-[400px]">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <p className="text-[17px] font-extrabold tracking-tight text-mist-50">Toolora<span className="text-brand-400">.</span></p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">Administrator access</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 rounded-2xl border border-white/[0.09] bg-ink-850/95 p-5 shadow-[0_35px_90px_-40px_rgba(0,0,0,0.95)]">
          <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-mist-50">Sign in</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-mist-500">
            This dashboard is restricted to explicitly authorized administrators. Sessions are verified
            again by the server on every request.
          </p>

          <div className="mt-4 space-y-3">
            <Field label="Email address" htmlFor="admin-email">
              <Input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={busy} />
            </Field>
            <Field label="Password" htmlFor="admin-password">
              <div className="flex gap-2">
                <Input id="admin-password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" disabled={busy} />
                <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"} className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist-300">
                  <Icon name={show ? "eyeOff" : "eye"} size={15} />
                </button>
              </div>
            </Field>
          </div>

          {error && (
            <div role="alert" className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/[0.07] px-3 py-2 text-[11.5px] leading-relaxed text-rose-100">
              {error}
              {notAdmin && <p className="mt-1 text-rose-100/60">Ordinary accounts cannot promote themselves. Add the user to admin_users in Supabase.</p>}
            </div>
          )}

          <Button type="submit" className="mt-4 w-full" disabled={busy}>
            <Icon name={busy ? "refresh" : "lock"} size={15} className={busy ? "animate-spin" : ""} />
            {busy ? "Signing in…" : "Sign in securely"}
          </Button>

          <p className="mt-3 text-center text-[10.5px] leading-relaxed text-mist-600">
            Protected by Supabase Auth. No password is stored in this application.
          </p>
        </form>

        <a href="/" className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-mist-500 transition hover:text-mist-200">
          <Icon name="arrowLeft" size={12} /> Back to the public site
        </a>
      </div>
    </main>
  );
}

/* -------------------------------- dashboard -------------------------------- */

type SectionId = "overview" | "tools" | "analytics" | "feedback" | "seo" | "announcements" | "settings";

const NAV: { id: SectionId; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "layers" },
  { id: "tools", label: "Tools manager", icon: "code" },
  { id: "analytics", label: "Analytics", icon: "activity" },
  { id: "feedback", label: "Feedback", icon: "mail" },
  { id: "seo", label: "SEO", icon: "globe" },
  { id: "announcements", label: "Announcements", icon: "send" },
  { id: "settings", label: "Settings", icon: "filter" },
];


type OverviewData = {
  admin: { email: string };
  counts: {
    totalTools: number; enabledTools: number; disabledTools: number; hiddenTools: number;
    events: number; feedback: number; newFeedback: number;
    announcements: number; activeAnnouncements: number; categories: number;
  };
  usage: Record<string, { opens: number; uses: number }>;
  categoryCounts: Record<string, number>;
  recentActivity: { slug: string; event: string; created_at: string }[];
  recentFeedback: { id: number; slug: string; helpful: boolean | null; status: string; created_at: string }[];
};
type ToolRow = {
  slug: string; enabled: boolean; hidden: boolean;
  name: string | null; description: string | null; category: string | null;
  updated_at: string | null;
};
type CategoryRow = { id: string; name: string; description: string | null; active: boolean; position: number };
type AnalyticsData = {
  days: number; total: number;
  tools: { slug: string; opens: number; uses: number }[];
  daily: { day: string; count: number }[];
  categories: { category: string; count: number }[];
};
type FeedbackStatus = "new" | "reviewing" | "resolved";
type FeedbackRow = { id: number; slug: string; helpful: boolean | null; message: string | null; email: string | null; status: FeedbackStatus; created_at: string };
type SeoRow = { slug: string; title: string; description: string; updated_at?: string };
type Announcement = { id: string; title: string; body: string; active: boolean; created_at: string; updated_at: string };
type Setting = { key: string; value: unknown; updated_at?: string };

function toolName(slug: string): string {
  return tools.find((tool) => tool.slug === slug)?.name ?? slug;
}
function categoryName(id: string): string {
  return baseCategories.find((category) => category.id === id)?.name ?? id;
}
function formatWhen(value: string): string {
  try {
    return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

function StatePanel({ state, onRetry, empty }: { state: ApiState; onRetry: () => void; empty?: boolean }) {
  if (state.loading) {
    return (
      <div className="grid min-h-[170px] place-items-center rounded-xl border border-white/[0.07] bg-white/[0.015]" role="status" aria-live="polite">
        <div className="text-center">
          <span className="mx-auto block size-6 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-500">Loading real data…</p>
        </div>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
        <p className="text-[12.5px] font-semibold text-rose-100">{state.code === "SUPABASE_NOT_CONFIGURED" ? "Backend not configured" : "Could not load this section"}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-rose-100/70">{state.error}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}><Icon name="refresh" size={13} /> Retry</Button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="grid min-h-[150px] place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.012] px-5 text-center">
        <div>
          <Icon name="info" size={18} className="mx-auto text-mist-500" />
          <p className="mt-2 text-[12.5px] font-semibold text-mist-200">No data yet</p>
          <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-mist-500">Nothing has been recorded. This dashboard never fills gaps with sample numbers.</p>
        </div>
      </div>
    );
  }
  return null;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">{label}</p>
      <p className="mt-1.5 font-mono text-[23px] leading-none text-mist-50">{value}</p>
      {hint && <p className="mt-1 text-[10px] leading-snug text-mist-600">{hint}</p>}
    </div>
  );
}

function SectionHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-mist-50">{title}</h2>
        <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-mist-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function OverviewSection({ data, state, retry }: { data: OverviewData | null; state: ApiState; retry: () => void }) {
  if (state.loading || state.error) return <StatePanel state={state} onRetry={retry} />;
  if (!data) return <StatePanel state={{ loading: false, error: "" }} empty onRetry={retry} />;
  const top = Object.entries(data.usage).sort((a, b) => b[1].opens - a[1].opens).slice(0, 6);
  const maxOpens = top[0]?.[1].opens ?? 1;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total tools" value={data.counts.totalTools} hint="rows in tool_settings" />
        <StatCard label="Enabled" value={data.counts.enabledTools} hint="available on the public site" />
        <StatCard label="Disabled" value={data.counts.disabledTools} hint="page shows availability notice" />
        <StatCard label="Hidden from lists" value={data.counts.hiddenTools} hint="still reachable by direct URL" />
        <StatCard label="Recorded events" value={data.counts.events} hint="anonymous tool opens" />
        <StatCard label="Feedback" value={data.counts.feedback} hint={`${data.counts.newFeedback} new / unread`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-mist-100">Most opened tools</p>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">{data.counts.categories} categories</span>
          </div>
          {top.length === 0 ? (
            <p className="mt-2 text-[11.5px] leading-relaxed text-mist-500">No tool opens recorded yet. Analytics begin collecting after the backend is configured and the site is redeployed.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {top.map(([slug, value]) => (
                <div key={slug} className="grid grid-cols-[minmax(0,1fr)_1fr_38px] items-center gap-2.5">
                  <span className="truncate text-[11.5px] text-mist-300">{toolName(slug)}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <span className="block h-full rounded-full bg-brand-400/80" style={{ width: `${Math.max(4, (value.opens / maxOpens) * 100)}%` }} />
                  </span>
                  <span className="text-right font-mono text-[10px] text-mist-500">{value.opens}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
          <p className="text-[12.5px] font-semibold text-mist-100">Recent activity</p>
          {data.recentActivity.length === 0 ? (
            <p className="mt-2 text-[11.5px] text-mist-500">No activity recorded yet. Events are anonymous: tool slug, event type and timestamp only.</p>
          ) : (
            <div className="mt-2 divide-y divide-white/[0.05]">
              {data.recentActivity.map((event, index) => (
                <div key={`${event.created_at}-${index}`} className="flex items-center gap-2 py-1.5">
                  <span className={event.event === "tool_use" ? "size-1.5 rounded-full bg-brand-400" : "size-1.5 rounded-full bg-mist-600"} />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-mist-300">{toolName(event.slug)}</span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-mist-600">{event.event === "tool_use" ? "used" : "opened"}</span>
                  <span className="font-mono text-[9px] text-mist-600">{formatWhen(event.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
        <p className="text-[12.5px] font-semibold text-mist-100">Category distribution</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.categoryCounts).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-1.5">
              <span className="truncate text-[11px] text-mist-400">{categoryName(category)}</span>
              <span className="font-mono text-[10px] text-mist-300">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10.5px] leading-relaxed text-mist-600">
        Signed in as <span className="text-mist-400">{data.admin.email}</span>. Authorization is checked on the
        server for every request; hiding buttons in the browser is never the protection.
      </p>
    </div>
  );
}

type ToolDraft = { name: string; description: string; category: string; enabled: boolean; hidden: boolean };

function ToolsSection({ session }: { session: Session }) {
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [rows, setRows] = useState<ToolRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ToolDraft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, { name: string; description: string; active: boolean }>>({});
  const [newCategory, setNewCategory] = useState({ id: "", name: "", description: "" });

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const data = await adminFetch<{ tools: ToolRow[]; categories: CategoryRow[] }>(session, "tools");
      setRows(data.tools);
      setCategories(data.categories ?? []);
      setDrafts(Object.fromEntries(data.tools.map((row) => [row.slug, {
        name: row.name ?? "",
        description: row.description ?? "",
        category: row.category ?? tools.find((tool) => tool.slug === row.slug)?.category ?? "",
        enabled: row.enabled,
        hidden: row.hidden,
      }])));
      setCategoryDrafts(Object.fromEntries((data.categories ?? []).map((row) => [row.id, { name: row.name, description: row.description ?? "", active: row.active }])));
      setState({ loading: false, error: "" });
    } catch (error) {
      const typed = error as Error & { code?: string };
      setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function patch(slug: string, body: Record<string, unknown>, successMessage: string) {
    setSaving(slug);
    setNotice("");
    try {
      await adminFetch(session, "tools", { method: "PATCH", body: JSON.stringify({ slug, ...body }) });
      setNotice(successMessage);
      return true;
    } catch (error) {
      setNotice((error as Error).message);
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function toggle(row: ToolRow, field: "enabled" | "hidden") {
    const next = !row[field];
    const ok = await patch(row.slug, { [field]: next }, `${toolName(row.slug)} ${field === "enabled" ? (next ? "enabled" : "disabled") : next ? "hidden from lists" : "listed publicly"}.`);
    if (!ok) return;
    setRows((current) => current.map((item) => (item.slug === row.slug ? { ...item, [field]: next } : item)));
    setDrafts((current) => ({ ...current, [row.slug]: { ...current[row.slug], [field]: next } }));
  }

  async function saveDetails(row: ToolRow) {
    const draft = drafts[row.slug];
    if (!draft) return;
    const ok = await patch(row.slug, {
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category || null,
    }, `Metadata saved for ${toolName(row.slug)}.`);
    if (!ok) return;
    setRows((current) => current.map((item) => item.slug === row.slug ? {
      ...item,
      name: draft.name.trim() || null,
      description: draft.description.trim() || null,
      category: draft.category || null,
    } : item));
    setExpanded(null);
  }

  async function saveCategory(id: string) {
    const draft = categoryDrafts[id];
    if (!draft) return;
    setSaving(`cat-${id}`);
    setNotice("");
    try {
      await adminFetch(session, "categories", { method: "POST", body: JSON.stringify({ id, ...draft }) });
      setNotice(`Category “${draft.name}” saved.`);
      await load();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function createCategory() {
    if (!/^[a-z0-9-]{2,40}$/.test(newCategory.id) || newCategory.name.trim().length < 2) {
      setNotice("Use a lowercase id (letters, numbers, hyphens) and a name of at least 2 characters.");
      return;
    }
    setSaving("cat-new");
    try {
      await adminFetch(session, "categories", { method: "POST", body: JSON.stringify({ id: newCategory.id, name: newCategory.name.trim(), description: newCategory.description.trim(), active: true, position: categories.length + 1 }) });
      setNotice(`Category “${newCategory.name}” created.`);
      setNewCategory({ id: "", name: "", description: "" });
      await load();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function removeCategory(id: string) {
    setSaving(`cat-${id}`);
    try {
      await adminFetch(session, `categories/${id}`, { method: "DELETE" });
      setNotice("Category deleted.");
      await load();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(null);
    }
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows
      .filter((row) => !normalized || `${row.slug} ${row.name ?? ""} ${toolName(row.slug)} ${suiteForTool(row.slug)?.name ?? ""}`.toLowerCase().includes(normalized))
      .sort((a, b) => (a.name ?? toolName(a.slug)).localeCompare(b.name ?? toolName(b.slug)));
  }, [rows, query]);
  const suiteGroups = suites.map((suite) => ({ suite, count: suite.toolSlugs.length }));

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Tools manager"
        description="Enable or disable tools, hide them from public lists, rename them, rewrite public descriptions and reassign categories. Every change is stored in Supabase and applied to the public site."
        action={<Button variant="secondary" size="sm" onClick={() => void load()}><Icon name="refresh" size={13} /> Refresh</Button>}
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <StatCard label="Tools" value={rows.length} />
        <StatCard label="Disabled" value={rows.filter((row) => !row.enabled).length} />
        <StatCard label="Hidden" value={rows.filter((row) => row.hidden).length} />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="min-w-[200px] flex-1">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name, slug, suite or function…" aria-label="Filter tools" />
        </div>
        <Button variant="secondary" size="md" onClick={() => setShowCategories((value) => !value)}>
          <Icon name="layers" size={14} /> {showCategories ? "Hide categories" : "Manage categories"}
        </Button>
      </div>

      {notice && <p className="rounded-lg border border-brand-400/20 bg-brand-400/[0.06] px-3 py-2 text-[11.5px] text-mist-200" role="status">{notice}</p>}

      {showCategories && (
        <section className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
          <div>
            <h3 className="text-[13px] font-semibold text-mist-100">Categories</h3>
            <p className="mt-0.5 text-[11px] text-mist-500">Rename, describe, deactivate or add categories. Inactive categories are hidden from the public filter. Assign tools to a category in their editor.</p>
          </div>
          {categories.length === 0 && <p className="text-[11.5px] text-mist-500">No categories returned. Run migration 0002 to seed the category table.</p>}
          {categories.map((category) => {
            const draft = categoryDrafts[category.id] ?? { name: category.name, description: category.description ?? "", active: category.active };
            return (
              <div key={category.id} className="grid gap-2 rounded-lg border border-white/[0.06] bg-ink-950/40 p-2.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto_auto]">
                <Input value={draft.name} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.id]: { ...draft, name: event.target.value } }))} aria-label={`Name of ${category.id}`} className="h-9 text-[12px]" />
                <Input value={draft.description} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.id]: { ...draft, description: event.target.value } }))} placeholder="Description" aria-label={`Description of ${category.id}`} className="h-9 text-[11.5px]" />
                <button type="button" onClick={() => setCategoryDrafts((current) => ({ ...current, [category.id]: { ...draft, active: !draft.active } }))} aria-pressed={draft.active} className={draft.active ? "rounded-lg border border-brand-400/30 bg-brand-400/10 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-200" : "rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-500"}>
                  {draft.active ? "active" : "hidden"}
                </button>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => void saveCategory(category.id)} disabled={saving === `cat-${category.id}`}>Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => void removeCategory(category.id)} disabled={saving === `cat-${category.id}`} aria-label={`Delete ${category.name}`}><Icon name="trash" size={12} /></Button>
                </div>
              </div>
            );
          })}
          <div className="grid gap-2 rounded-lg border border-dashed border-white/10 p-2.5 sm:grid-cols-[130px_1fr_1fr_auto]">
            <Input value={newCategory.id} onChange={(event) => setNewCategory({ ...newCategory, id: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="new-id" aria-label="New category id" className="h-9 font-mono text-[11.5px]" />
            <Input value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} placeholder="Display name" aria-label="New category name" className="h-9 text-[12px]" />
            <Input value={newCategory.description} onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })} placeholder="Short description" aria-label="New category description" className="h-9 text-[11.5px]" />
            <Button size="sm" onClick={() => void createCategory()} disabled={saving === "cat-new"}><Icon name="plus" size={12} /> Add</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">Suite membership (defined in the tool registry)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suiteGroups.map(({ suite, count }) => (
            <span key={suite.slug} className="rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-1 text-[10px] text-mist-400">
              {suite.name} <span className="font-mono text-[9px] text-mist-600">{count}</span>
            </span>
          ))}
          <span className="rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-1 text-[10px] text-mist-400">
            Standalone <span className="font-mono text-[9px] text-mist-600">{rows.length - suites.reduce((total, suite) => total + suite.toolSlugs.length, 0)}</span>
          </span>
        </div>
      </div>

      <StatePanel state={state} onRetry={load} empty={!state.loading && !state.error && filtered.length === 0} />
      {!state.loading && !state.error && filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map((row) => {
            const suite = suiteForTool(row.slug);
            const draft = drafts[row.slug];
            const isOpen = expanded === row.slug;
            const displayName = row.name ?? toolName(row.slug);
            return (
              <div key={row.slug} className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.015]">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <button type="button" onClick={() => setExpanded(isOpen ? null : row.slug)} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={isOpen}>
                    <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={12} className="shrink-0 text-mist-500" />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-mist-100">{displayName}</span>
                      <span className="block truncate font-mono text-[9px] text-mist-600">/tools/{row.slug} · {suite?.shortName ?? row.category ?? "standalone"}</span>
                    </span>
                  </button>
                  <span className={row.enabled ? "rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-brand-200" : "rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-mist-500"}>{row.enabled ? "enabled" : "disabled"}</span>
                  {row.hidden && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-200">hidden</span>}
                  <Button variant="ghost" size="sm" onClick={() => void toggle(row, "enabled")} disabled={saving === row.slug}>{row.enabled ? "Disable" : "Enable"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => void toggle(row, "hidden")} disabled={saving === row.slug}>{row.hidden ? "List" : "Hide"}</Button>
                </div>
                {isOpen && draft && (
                  <div className="space-y-2 border-t border-white/[0.06] bg-ink-950/40 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Display name" htmlFor={`tool-name-${row.slug}`} hint={`${draft.name.length}/80`}>
                        <Input id={`tool-name-${row.slug}`} value={draft.name} onChange={(event) => setDrafts((current) => ({ ...current, [row.slug]: { ...draft, name: event.target.value } }))} placeholder={toolName(row.slug)} maxLength={80} />
                      </Field>
                      <Field label="Category" htmlFor={`tool-category-${row.slug}`}>
                        <select
                          id={`tool-category-${row.slug}`}
                          value={draft.category}
                          onChange={(event) => setDrafts((current) => ({ ...current, [row.slug]: { ...draft, category: event.target.value } }))}
                          className="field-input cursor-pointer"
                        >
                          <option value="">Keep built-in category</option>
                          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Public description" htmlFor={`tool-description-${row.slug}`} hint={`${draft.description.length}/300 · used in cards and the tool header`}>
                      <textarea id={`tool-description-${row.slug}`} value={draft.description} onChange={(event) => setDrafts((current) => ({ ...current, [row.slug]: { ...draft, description: event.target.value } }))} rows={2} maxLength={300} placeholder={tools.find((tool) => tool.slug === row.slug)?.tagline} className="field-input resize-y text-[12px] leading-relaxed" />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => void saveDetails(row)} disabled={saving === row.slug}>{saving === row.slug ? "Saving…" : "Save metadata"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDrafts((current) => ({ ...current, [row.slug]: { name: "", description: "", category: tools.find((tool) => tool.slug === row.slug)?.category ?? "", enabled: row.enabled, hidden: row.hidden } }))}>Reset to defaults</Button>
                      <Link href={`/tools/${row.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-[11px] text-mist-500 hover:text-mist-200">Preview page <Icon name="external" size={11} /></Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10.5px] leading-relaxed text-mist-600">Disabled tools are unavailable on their page and removed from directory/search. Hidden tools keep working but disappear from listings, palette results and suites. Suite membership itself is code-defined so navigation cannot break silently.</p>
    </div>
  );
}

function AnalyticsSection({ session }: { session: Session }) {
  const [days, setDays] = useState(30);
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [data, setData] = useState<AnalyticsData | null>(null);

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      setData(await adminFetch<AnalyticsData>(session, `analytics?days=${days}`));
      setState({ loading: false, error: "" });
    } catch (error) {
      const typed = error as Error & { code?: string };
      setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session, days]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Analytics"
        description="First-party usage events recorded only when the backend is configured. No IP addresses, user agents, cookies or visitor identifiers are stored — these are aggregate tool events, not unique people."
        action={<div className="flex gap-1">{[7, 30, 90].map((period) => (
          <button key={period} type="button" onClick={() => setDays(period)} aria-pressed={days === period} className={days === period ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-2.5 py-1.5 font-mono text-[10.5px] text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10.5px] text-mist-500"}>{period}d</button>
        ))}</div>}
      />
      <StatePanel state={state} onRetry={load} empty={!state.loading && !state.error && (data?.total ?? 0) === 0} />
      {data && data.total > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={`Events · ${data.days} days`} value={data.total} />
            <StatCard label="Tools with activity" value={data.tools.length} />
            <StatCard label="Average / day" value={(data.total / data.days).toFixed(1)} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              <p className="text-[12.5px] font-semibold text-mist-100">Daily volume</p>
              <div className="mt-3 flex h-28 items-end gap-[3px]">
                {data.daily.map((day) => {
                  const max = Math.max(...data.daily.map((entry) => entry.count), 1);
                  return <span key={day.day} title={`${day.day}: ${day.count}`} className="min-w-[2px] flex-1 rounded-t bg-brand-400/70" style={{ height: `${Math.max(4, (day.count / max) * 100)}%` }} />;
                })}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              <p className="text-[12.5px] font-semibold text-mist-100">Popular categories</p>
              <div className="mt-3 space-y-2">
                {data.categories.map((row) => {
                  const max = data.categories[0]?.count || 1;
                  return (
                    <div key={row.category} className="grid grid-cols-[minmax(0,1fr)_1fr_40px] items-center gap-2">
                      <span className="truncate text-[11px] text-mist-400">{categoryName(row.category)}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-ink-700"><span className="block h-full rounded-full bg-sky-400/70" style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }} /></span>
                      <span className="text-right font-mono text-[9.5px] text-mist-500">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            <div className="grid grid-cols-[minmax(0,1fr)_64px_64px] gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500"><span>Tool</span><span className="text-right">Opens</span><span className="text-right">Uses</span></div>
            {data.tools.map((row) => (
              <div key={row.slug} className="grid grid-cols-[minmax(0,1fr)_64px_64px] gap-2 border-b border-white/[0.04] px-3 py-2 text-[11.5px] last:border-b-0">
                <span className="truncate text-mist-200">{toolName(row.slug)}</span>
                <span className="text-right font-mono text-mist-300">{row.opens}</span>
                <span className="text-right font-mono text-mist-400">{row.uses}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FeedbackSection({ session }: { session: Session }) {
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [filter, setFilter] = useState<"all" | FeedbackStatus>("all");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const data = await adminFetch<{ feedback: FeedbackRow[] }>(session, "feedback");
      setRows(data.feedback);
      setState({ loading: false, error: "" });
    } catch (error) {
      const typed = error as Error & { code?: string };
      setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: number, status: FeedbackStatus) {
    setBusy(id); setNotice("");
    try {
      await adminFetch(session, `feedback/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
      setNotice(`Feedback marked ${status}.`);
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(null); }
  }

  async function remove(id: number) {
    setBusy(id); setNotice("");
    try {
      await adminFetch(session, `feedback/${id}`, { method: "DELETE" });
      setRows((current) => current.filter((row) => row.id !== id));
      setNotice("Feedback deleted.");
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(null); }
  }

  const filtered = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <div className="space-y-4">
      <SectionHeading title="Feedback" description="Ratings and messages submitted from tool pages. Optional emails appear only when a visitor chose to add one. Manage status and delete entries when they are no longer needed." action={<Button variant="secondary" size="sm" onClick={() => void load()}><Icon name="refresh" size={13} /> Refresh</Button>} />
      <div className="flex flex-wrap gap-1.5">
        {(["all", "new", "reviewing", "resolved"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={filter === value ? "rounded-lg border border-brand-400/40 bg-brand-400/10 px-2.5 py-1.5 text-[11px] font-semibold capitalize text-brand-200" : "rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 text-[11px] capitalize text-mist-400"}>
            {value} <span className="ml-1 font-mono text-[9px] text-mist-500">{value === "all" ? rows.length : rows.filter((row) => row.status === value).length}</span>
          </button>
        ))}
      </div>
      {notice && <p className="rounded-lg border border-brand-400/20 bg-brand-400/[0.06] px-3 py-2 text-[11.5px] text-mist-200">{notice}</p>}
      <StatePanel state={state} onRetry={load} empty={!state.loading && !state.error && filtered.length === 0} />
      {!state.loading && !state.error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] text-mist-400">{toolName(row.slug)}</span>
                {row.helpful !== null && <span className={row.helpful ? "font-mono text-[9px] uppercase tracking-wider text-brand-300" : "font-mono text-[9px] uppercase tracking-wider text-amber-300"}>{row.helpful ? "helpful" : "not helpful"}</span>}
                <span className={row.status === "new" ? "rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-sky-200" : row.status === "reviewing" ? "rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-200" : "rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-brand-200"}>{row.status}</span>
                <span className="ml-auto font-mono text-[9px] text-mist-600">{formatWhen(row.created_at)}</span>
              </div>
              {row.message && <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-mist-300">{row.message}</p>}
              {row.email && <p className="mt-2 font-mono text-[10px] text-mist-500">reply to: {row.email}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(["new", "reviewing", "resolved"] as FeedbackStatus[]).filter((status) => status !== row.status).map((status) => (
                  <Button key={status} variant="secondary" size="sm" onClick={() => void setStatus(row.id, status)} disabled={busy === row.id}>Mark {status}</Button>
                ))}
                <Button variant="ghost" size="sm" className="text-rose-300 hover:bg-rose-400/10" onClick={() => void remove(row.id)} disabled={busy === row.id}><Icon name="trash" size={12} /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeoSection({ session }: { session: Session }) {
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string | null>>({});
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { title: string; description: string; publicDescription: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const data = await adminFetch<{ seo: SeoRow[]; descriptions: { slug: string; description: string | null }[] }>(session, "seo");
      setRows(data.seo);
      setDescriptions(Object.fromEntries(data.descriptions.map((row) => [row.slug, row.description])));
      setDrafts(Object.fromEntries(tools.map((tool) => {
        const saved = data.seo.find((row) => row.slug === tool.slug);
        const publicDescription = data.descriptions.find((row) => row.slug === tool.slug)?.description;
        return [tool.slug, {
          title: saved?.title ?? tool.metaTitle,
          description: saved?.description ?? tool.metaDescription,
          publicDescription: publicDescription ?? tool.tagline,
        }];
      })));
      setState({ loading: false, error: "" });
    } catch (error) {
      const typed = error as Error & { code?: string };
      setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tools.filter((tool) => !normalized || `${tool.name} ${tool.slug} ${suiteForTool(tool.slug)?.name ?? ""}`.toLowerCase().includes(normalized));
  }, [query]);

  async function save(toolSlug: string) {
    const value = drafts[toolSlug];
    if (!value) return;
    if (value.title.trim().length < 10 || value.title.trim().length > 120) { setNotice("Titles must be 10–120 characters."); return; }
    if (value.description.trim().length < 40 || value.description.trim().length > 320) { setNotice("Meta descriptions must be 40–320 characters."); return; }
    if (value.publicDescription.trim().length > 0 && (value.publicDescription.trim().length < 10 || value.publicDescription.trim().length > 300)) { setNotice("Public descriptions must be 10–300 characters, or empty to use the default."); return; }
    setSaving(toolSlug); setNotice("");
    try {
      await adminFetch(session, "seo", { method: "PATCH", body: JSON.stringify({ slug: toolSlug, title: value.title.trim(), description: value.description.trim() }) });
      await adminFetch(session, "tools", { method: "PATCH", body: JSON.stringify({ slug: toolSlug, description: value.publicDescription.trim() }) });
      setNotice(`SEO and public description saved for ${toolName(toolSlug)}.`);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeading title="SEO manager" description="Manage pager titles, meta descriptions and the public tool description. Overrides are stored in Supabase; unedited tools keep the carefully written defaults. Tool pages are client-rendered, so social unfurlers may still read the static defaults." />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a tool…" aria-label="Find a tool for SEO editing" />
      {notice && <p className="rounded-lg border border-brand-400/20 bg-brand-400/[0.06] px-3 py-2 text-[11.5px] text-mist-200">{notice}</p>}
      <StatePanel state={state} onRetry={load} />
      {!state.loading && !state.error && (
        <div className="space-y-2">
          {filtered.map((tool) => {
            const saved = rows.find((row) => row.slug === tool.slug);
            const value = drafts[tool.slug] ?? { title: tool.metaTitle, description: tool.metaDescription, publicDescription: descriptions[tool.slug] ?? tool.tagline };
            return (
              <details key={tool.slug} className="rounded-xl border border-white/[0.07] bg-white/[0.015] px-3 py-2.5">
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-mist-100">{tool.name}</span>
                  {saved && <span className="rounded border border-brand-400/25 bg-brand-400/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-brand-200">override</span>}
                  <span className="font-mono text-[9px] text-mist-600">{value.title.length}/120</span>
                  <Icon name="chevronDown" size={12} className="text-mist-500" />
                </summary>
                <div className="mt-3 space-y-2">
                  <Field label="Page title" htmlFor={`seo-title-${tool.slug}`} hint={`${value.title.length}/120`}>
                    <Input id={`seo-title-${tool.slug}`} value={value.title} onChange={(event) => setDrafts((current) => ({ ...current, [tool.slug]: { ...value, title: event.target.value } }))} />
                  </Field>
                  <Field label="Meta description" htmlFor={`seo-description-${tool.slug}`} hint={`${value.description.length}/320`}>
                    <textarea id={`seo-description-${tool.slug}`} value={value.description} rows={2} onChange={(event) => setDrafts((current) => ({ ...current, [tool.slug]: { ...value, description: event.target.value } }))} className="field-input resize-y text-[12px] leading-relaxed" />
                  </Field>
                  <Field label="Public tool description" htmlFor={`seo-public-${tool.slug}`} hint={`${value.publicDescription.length}/300 · cards and header`}>
                    <textarea id={`seo-public-${tool.slug}`} value={value.publicDescription} rows={2} onChange={(event) => setDrafts((current) => ({ ...current, [tool.slug]: { ...value, publicDescription: event.target.value } }))} className="field-input resize-y text-[12px] leading-relaxed" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void save(tool.slug)} disabled={saving === tool.slug}>{saving === tool.slug ? "Saving…" : "Save changes"}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDrafts((current) => ({ ...current, [tool.slug]: { title: tool.metaTitle, description: tool.metaDescription, publicDescription: tool.tagline } }))}>Restore defaults</Button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnnouncementsSection({ session }: { session: Session }) {
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [rows, setRows] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const data = await adminFetch<{ announcements: Announcement[] }>(session, "announcements");
      setRows(data.announcements);
      setState({ loading: false, error: "" });
    } catch (error) {
      const typed = error as Error & { code?: string };
      setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (title.trim().length < 3 || body.trim().length < 3) { setNotice("Add a title and message of at least 3 characters."); return; }
    setBusy("new"); setNotice("");
    try {
      await adminFetch(session, "announcements", { method: "POST", body: JSON.stringify({ title: title.trim(), body: body.trim(), active }) });
      setTitle(""); setBody(""); setActive(true);
      setNotice("Announcement created.");
      await load();
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(null); }
  }

  async function update(id: string, patch: Record<string, unknown>, message: string) {
    setBusy(id); setNotice("");
    try {
      await adminFetch(session, `announcements/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setNotice(message);
      await load();
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(null); }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await adminFetch(session, `announcements/${id}`, { method: "DELETE" });
      setRows((current) => current.filter((row) => row.id !== id));
      setNotice("Announcement deleted.");
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <SectionHeading title="Announcements" description="The newest active announcement appears as a slim, dismissible banner under the public header. Edit or deactivate any announcement at any time." />
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
        <div className="grid gap-3">
          <Field label="Title" htmlFor="announcement-title" hint="3–160 characters">
            <Input id="announcement-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Scheduled maintenance on Sunday" />
          </Field>
          <Field label="Message" htmlFor="announcement-body" hint="3–1000 characters">
            <textarea id="announcement-body" value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Some tools may be briefly unavailable between 02:00 and 03:00 UTC." className="field-input resize-y text-[12px] leading-relaxed" />
          </Field>
          <label className="flex items-center gap-2 text-[12px] text-mist-300">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="size-4 accent-[#C7F05F]" /> Publish immediately
          </label>
          <Button size="sm" className="w-fit" onClick={() => void create()} disabled={busy === "new"}>{busy === "new" ? "Saving…" : "Create announcement"}</Button>
        </div>
      </div>
      {notice && <p className="rounded-lg border border-brand-400/20 bg-brand-400/[0.06] px-3 py-2 text-[11.5px] text-mist-200">{notice}</p>}
      <StatePanel state={state} onRetry={load} empty={!state.loading && !state.error && rows.length === 0} />
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
          {editing === row.id ? (
            <div className="space-y-2">
              <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} aria-label="Edit announcement title" />
              <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} rows={3} aria-label="Edit announcement message" className="field-input resize-y text-[12px]" />
              <div className="flex gap-2">
                <Button size="sm" onClick={async () => { await update(row.id, { title: editTitle.trim(), body: editBody.trim() }, "Announcement updated."); setEditing(null); }} disabled={busy === row.id}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-mist-100">{row.title}</p>
                <span className={row.active ? "rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-brand-200" : "rounded-full border border-white/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-mist-500"}>{row.active ? "active" : "inactive"}</span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{row.body}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => { setEditing(row.id); setEditTitle(row.title); setEditBody(row.body); }} disabled={busy === row.id}>Edit</Button>
                <Button variant="secondary" size="sm" onClick={() => void update(row.id, { active: !row.active }, row.active ? "Announcement deactivated." : "Announcement activated.")} disabled={busy === row.id}>{row.active ? "Deactivate" : "Activate"}</Button>
                <Button variant="ghost" size="sm" className="text-rose-300 hover:bg-rose-400/10" onClick={() => void remove(row.id)} disabled={busy === row.id}><Icon name="trash" size={12} /> Delete</Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsSection({ session }: { session: Session }) {
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [rows, setRows] = useState<Setting[]>([]);
  const [siteName, setSiteName] = useState("Toolora");
  const [indexing, setIndexing] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const data = await adminFetch<{ settings: Setting[] }>(session, "settings");
      setRows(data.settings);
      const name = data.settings.find((row) => row.key === "site_name")?.value;
      const allow = data.settings.find((row) => row.key === "allow_indexing")?.value;
      if (typeof name === "string") setSiteName(name);
      if (typeof allow === "boolean") setIndexing(allow);
      setState({ loading: false, error: "" });
    } catch (error) {
      const typed = error as Error & { code?: string };
      setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function save(key: string, value: unknown) {
    setBusy(true); setNotice("");
    try {
      await adminFetch(session, "settings", { method: "PATCH", body: JSON.stringify({ key, value }) });
      setNotice(`${key} updated.`);
      await load();
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <SectionHeading title="Settings" description="Simple site configuration stored in Supabase. Server credentials are environment variables and are deliberately not editable here." />
      {notice && <p className="rounded-lg border border-brand-400/20 bg-brand-400/[0.06] px-3 py-2 text-[11.5px] text-mist-200">{notice}</p>}
      <StatePanel state={state} onRetry={load} />
      {!state.loading && !state.error && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
            <Field label="Site name" htmlFor="setting-site-name" hint="stored preference; the public static build keeps its compiled name">
              <div className="flex gap-2">
                <Input id="setting-site-name" value={siteName} onChange={(event) => setSiteName(event.target.value)} maxLength={40} />
                <Button size="sm" className="shrink-0" onClick={() => void save("site_name", siteName.trim())} disabled={busy || siteName.trim().length < 2}>Save</Button>
              </div>
            </Field>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12.5px] font-medium text-mist-100">Allow search indexing</p>
                <p className="mt-0.5 text-[11px] text-mist-500">A stored preference flag. The static robots.txt and meta robots still govern hard blocking.</p>
              </div>
              <Button size="sm" variant={indexing ? "secondary" : "primary"} onClick={() => { const next = !indexing; setIndexing(next); void save("allow_indexing", next); }} disabled={busy}>{indexing ? "Currently enabled" : "Currently disabled"}</Button>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
            <p className="text-[12px] font-semibold text-mist-100">Stored settings</p>
            <div className="mt-2 space-y-1">
              {rows.length === 0 && <p className="text-[11px] text-mist-500">No settings found. Run the migration to seed defaults.</p>}
              {rows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 font-mono text-[10.5px]">
                  <span className="text-mist-500">{row.key}</span>
                  <span className="truncate text-mist-300">{JSON.stringify(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
            <p className="text-[12px] font-semibold text-mist-100">Security posture</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-500">
              <li>• Supabase Auth email/password; no credentials in this bundle.</li>
              <li>• Every admin API request re-checks active membership in admin_users.</li>
              <li>• Service-role key exists only in server environment variables.</li>
              <li>• RLS is enabled on all admin tables and anonymous access is revoked.</li>
              <li>• Sign out clears the local session; tokens expire and are refreshed by Supabase.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ session, onSignOut, supabase }: { session: Session; onSignOut: () => void; supabase: SupabaseClient }) {
  const [section, setSection] = useState<SectionId>("overview");
  const [data, setData] = useState<OverviewData | null>(null);
  const [state, setState] = useState<ApiState>({ loading: true, error: "" });
  const [navOpen, setNavOpen] = useState(false);
  const mounted = useRef(true);

  const loadOverview = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const result = await adminFetch<OverviewData>(session, "overview");
      if (mounted.current) { setData(result); setState({ loading: false, error: "" }); }
    } catch (error) {
      const typed = error as Error & { code?: string; status?: number };
      if (typed.status === 401) { onSignOut(); return; }
      if (mounted.current) setState({ loading: false, error: typed.message, code: typed.code });
    }
  }, [session, onSignOut]);

  useEffect(() => {
    mounted.current = true;
    void loadOverview();
    return () => { mounted.current = false; };
  }, [loadOverview]);

  async function signOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setNavOpen((value) => !value)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-mist-300 md:hidden" aria-label="Toggle admin navigation" aria-expanded={navOpen}>
            <Icon name={navOpen ? "close" : "menu"} size={16} />
          </button>
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoMark className="size-8" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-extrabold tracking-tight text-mist-50">Toolora <span className="text-brand-400">Admin</span></p>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist-600">{session.user.email}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[11px] font-medium text-mist-300 transition hover:bg-white/[0.05] sm:inline-flex">
              <Icon name="external" size={12} /> View site
            </a>
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              <Icon name="lock" size={12} /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1240px] gap-6 px-4 py-5 sm:px-6">
        <aside className={cn("w-[210px] shrink-0", navOpen ? "block" : "hidden md:block")}>
          <nav aria-label="Admin sections" className="sticky top-[80px] space-y-0.5">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setSection(item.id); setNavOpen(false); }}
                aria-current={section === item.id ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] transition",
                  section === item.id ? "bg-brand-400/10 font-semibold text-brand-200" : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-100"
                )}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
              </button>
            ))}
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist-600">Private area</p>
              <p className="mt-1 text-[10px] leading-relaxed text-mist-500">Not indexed by search engines. Requests without an authorized session are rejected by the server.</p>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-10">
          {section === "overview" && <OverviewSection data={data} state={state} retry={loadOverview} />}
          {section === "tools" && <ToolsSection session={session} />}
          {section === "analytics" && <AnalyticsSection session={session} />}
          {section === "feedback" && <FeedbackSection session={session} />}
          {section === "seo" && <SeoSection session={session} />}
          {section === "announcements" && <AnnouncementsSection session={session} />}
          {section === "settings" && <SettingsSection session={session} />}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------- shell --------------------------------- */

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(CONFIGURED);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!CONFIGURED) return;
    let active = true;
    void getClient()
      .then((client) => { if (active) setSupabase(client); })
      .catch(() => { if (active) { setLoadError("The authentication library could not be loaded. Check your connection and reload the page."); setChecking(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session ?? null); setChecking(false); }
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [supabase]);

  if (!CONFIGURED) return <SetupNotice />;
  if (checking) return <AdminLoading label={supabase ? "Checking your session…" : "Loading the secure sign-in…"} />;
  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink-950 px-5">
        <div className="max-w-md rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-5 text-center">
          <Icon name="alert" size={20} className="mx-auto text-rose-300" />
          <p className="mt-2 text-[14px] font-semibold text-rose-100">Sign-in unavailable</p>
          <p className="mt-1 text-[12px] leading-relaxed text-rose-100/70">{loadError}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </main>
    );
  }
  if (!supabase) return <AdminLoading label="Loading the secure sign-in…" />;
  if (!session) return <LoginScreen onSession={setSession} supabase={supabase} />;
  return <Dashboard session={session} onSignOut={() => setSession(null)} supabase={supabase} />;
}

export default AdminPage;

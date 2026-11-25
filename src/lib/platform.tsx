import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Announcement = { id: string; title: string; body: string; updated_at: string };

export type ToolSetting = {
  slug: string;
  enabled: boolean;
  hidden: boolean;
  name: string | null;
  description: string | null;
  category: string | null;
};

export type CategorySetting = { id: string; name: string; description: string | null; active: boolean };

export type PlatformConfig = {
  configured: boolean;
  enabledTools: string[] | null;
  disabledTools: string[];
  seo: Record<string, { title: string; description: string }>;
  announcements: Announcement[];
  settings: Record<string, unknown>;
  toolSettings: Record<string, ToolSetting>;
  categories: Record<string, CategorySetting>;
};

const DEFAULT_CONFIG: PlatformConfig = {
  configured: false,
  enabledTools: null,
  disabledTools: [],
  seo: {},
  announcements: [],
  settings: {},
  toolSettings: {},
  categories: {},
};

const CACHE_KEY = "toolora:platform-config:v1";

type PlatformValue = {
  config: PlatformConfig;
  ready: boolean;
  isToolEnabled: (slug: string) => boolean;
  isToolListed: (slug: string, fallbackCategory?: string) => boolean;
  toolName: (tool: { slug: string; name: string; shortName?: string }) => string;
  toolDescription: (tool: { slug: string; tagline: string }) => string;
  categoryLabel: (id: string, fallback: string) => string;
  seoFor: (slug: string, fallback: { title: string; description: string }) => { title: string; description: string };
  recordEvent: (slug: string, event?: "tool_open" | "tool_use") => void;
  submitFeedback: (input: { slug: string; helpful?: boolean; message?: string; email?: string }) => Promise<{ ok: boolean; error?: string }>;
};

const PlatformContext = createContext<PlatformValue | null>(null);

function readCache(): PlatformConfig | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlatformConfig;
  } catch {
    return null;
  }
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(() => (typeof window === "undefined" ? DEFAULT_CONFIG : readCache() ?? DEFAULT_CONFIG));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    // Opening dist/index.html directly from disk has no server: skip the
    // optional config request instead of logging a CORS/network error.
    if (typeof window !== "undefined" && window.location.protocol === "file:") {
      setReady(true);
      return () => { active = false; };
    }
    fetch(`${window.location.origin}/api/public/config`, { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const next: PlatformConfig = {
          configured: Boolean(data.configured),
          enabledTools: Array.isArray(data.enabledTools) ? data.enabledTools : null,
          disabledTools: Array.isArray(data.disabledTools) ? data.disabledTools : [],
          seo: data.seo && typeof data.seo === "object" ? data.seo : {},
          announcements: Array.isArray(data.announcements) ? data.announcements : [],
          settings: data.settings && typeof data.settings === "object" ? data.settings : {},
          toolSettings: data.toolSettings && typeof data.toolSettings === "object" ? data.toolSettings : {},
          categories: data.categories && typeof data.categories === "object" ? data.categories : {},
        };
        setConfig(next);
        try { window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore quota */ }
      })
      .catch(() => undefined)
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const isToolEnabled = useCallback((slug: string) => {
    const setting = config.toolSettings[slug];
    if (setting) return setting.enabled;
    if (config.disabledTools.includes(slug)) return false;
    if (config.enabledTools) return config.enabledTools.includes(slug);
    return true;
  }, [config]);

  const isToolListed = useCallback((slug: string, fallbackCategory?: string) => {
    const setting = config.toolSettings[slug];
    if (setting?.hidden) return false;
    const category = setting?.category ?? fallbackCategory;
    if (category && config.categories[category] && config.categories[category].active === false) return false;
    return isToolEnabled(slug);
  }, [config, isToolEnabled]);

  const toolName = useCallback((tool: { slug: string; name: string; shortName?: string }) => {
    return config.toolSettings[tool.slug]?.name?.trim() || tool.name;
  }, [config.toolSettings]);

  const toolDescription = useCallback((tool: { slug: string; tagline: string }) => {
    return config.toolSettings[tool.slug]?.description?.trim() || tool.tagline;
  }, [config.toolSettings]);

  const categoryLabel = useCallback((id: string, fallback: string) => {
    return config.categories[id]?.name?.trim() || fallback;
  }, [config.categories]);

  const seoFor = useCallback((slug: string, fallback: { title: string; description: string }) => {
    const override = config.seo[slug];
    return override?.title && override?.description ? override : fallback;
  }, [config.seo]);

  const recordEvent = useCallback((slug: string, event: "tool_open" | "tool_use" = "tool_open") => {
    if (!config.configured) return;
    try {
      void fetch("/api/public/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, event }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      /* analytics must never break a tool */
    }
  }, [config.configured]);

  const submitFeedback = useCallback(async (input: { slug: string; helpful?: boolean; message?: string; email?: string }) => {
    try {
      const response = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          error: body?.code === "NOT_CONFIGURED"
            ? "Feedback storage is not configured yet. Please use the contact page instead."
            : body?.error ?? "Feedback could not be saved. Please try again later.",
        };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the feedback service. Check your connection or use the contact page." };
    }
  }, []);

  const value = useMemo<PlatformValue>(
    () => ({ config, ready, isToolEnabled, isToolListed, toolName, toolDescription, categoryLabel, seoFor, recordEvent, submitFeedback }),
    [config, ready, isToolEnabled, isToolListed, toolName, toolDescription, categoryLabel, seoFor, recordEvent, submitFeedback]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformValue {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatform must be used inside PlatformProvider");
  return value;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBody, stringField } from "../_lib/http";
import { adminClient, requireAdmin, serverConfigured } from "../_lib/supabase";

const FEEDBACK_STATUSES = ["new", "reviewing", "resolved"] as const;
type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

function boolField(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
function categoryId(value: unknown): string | null {
  const parsed = stringField(value, 40);
  return parsed && /^[a-z0-9-]{2,40}$/.test(parsed) ? parsed : null;
}

/**
 * Protected admin API. requireAdmin() verifies the Supabase access token and
 * requires active membership in admin_users (or ADMIN_EMAILS) before any data
 * access. The service-role key never reaches the browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!serverConfigured) {
    return json(res, 503, { error: "Admin backend is not configured.", code: "SUPABASE_NOT_CONFIGURED" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const rawPath = req.query.path;
  const segments = (Array.isArray(rawPath) ? rawPath.join("/") : rawPath ?? "").split("/").filter(Boolean);
  const resource = segments[0] ?? "";
  const id = segments[1] ?? "";
  const supabase = adminClient();

  try {
    if (req.method === "GET") {
      switch (resource) {
        case "overview": {
          const [tools, events, feedback, announcements, categories] = await Promise.all([
            supabase.from("tool_settings").select("slug,enabled,hidden,category,name,description"),
            supabase.from("analytics_events").select("slug,event,created_at").order("created_at", { ascending: false }).limit(2000),
            supabase.from("feedback").select("id,slug,helpful,status,created_at").order("created_at", { ascending: false }).limit(1000),
            supabase.from("announcements").select("id,active"),
            supabase.from("tool_categories").select("id,name,active").order("position"),
          ]);
          const usage = new Map<string, { opens: number; uses: number }>();
          (events.data ?? []).forEach((row) => {
            const entry = usage.get(row.slug) ?? { opens: 0, uses: 0 };
            if (row.event === "tool_use") entry.uses += 1;
            else entry.opens += 1;
            usage.set(row.slug, entry);
          });
          const toolRows = tools.data ?? [];
          const categoryCounts = new Map<string, number>();
          toolRows.forEach((row) => categoryCounts.set(row.category ?? "uncategorised", (categoryCounts.get(row.category ?? "uncategorised") ?? 0) + 1));
          return json(res, 200, {
            admin: { email: admin.email },
            counts: {
              totalTools: toolRows.length,
              enabledTools: toolRows.filter((row) => row.enabled).length,
              disabledTools: toolRows.filter((row) => !row.enabled).length,
              hiddenTools: toolRows.filter((row) => row.hidden).length,
              events: events.data?.length ?? 0,
              feedback: feedback.data?.length ?? 0,
              newFeedback: feedback.data?.filter((row) => row.status === "new").length ?? 0,
              announcements: announcements.data?.length ?? 0,
              activeAnnouncements: announcements.data?.filter((row) => row.active).length ?? 0,
              categories: categories.data?.length ?? 0,
            },
            usage: Object.fromEntries(usage),
            categoryCounts: Object.fromEntries(categoryCounts),
            recentActivity: (events.data ?? []).slice(0, 10),
            recentFeedback: (feedback.data ?? []).slice(0, 5),
          });
        }
        case "analytics": {
          const days = Math.min(365, Math.max(1, Number(req.query.days ?? 30) || 30));
          const since = new Date(Date.now() - days * 86_400_000).toISOString();
          const [{ data: events, error }, { data: tools }] = await Promise.all([
            supabase.from("analytics_events").select("slug,event,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20000),
            supabase.from("tool_settings").select("slug,category"),
          ]);
          if (error) throw error;
          const categoryBySlug = new Map((tools ?? []).map((row) => [row.slug, row.category ?? "uncategorised"]));
          const totals = new Map<string, { opens: number; uses: number }>();
          const daily = new Map<string, number>();
          const categories = new Map<string, number>();
          (events ?? []).forEach((row) => {
            const entry = totals.get(row.slug) ?? { opens: 0, uses: 0 };
            if (row.event === "tool_use") entry.uses += 1;
            else entry.opens += 1;
            totals.set(row.slug, entry);
            const day = String(row.created_at).slice(0, 10);
            daily.set(day, (daily.get(day) ?? 0) + 1);
            const category = categoryBySlug.get(row.slug) ?? "uncategorised";
            categories.set(category, (categories.get(category) ?? 0) + 1);
          });
          return json(res, 200, {
            days,
            total: events?.length ?? 0,
            tools: [...totals.entries()].map(([slug, value]) => ({ slug, ...value })).sort((a, b) => b.opens - a.opens),
            daily: [...daily.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day)),
            categories: [...categories.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
          });
        }
        case "tools": {
          const [settings, categories] = await Promise.all([
            supabase.from("tool_settings").select("*").order("slug"),
            supabase.from("tool_categories").select("*").order("position"),
          ]);
          if (settings.error) throw settings.error;
          return json(res, 200, { tools: settings.data ?? [], categories: categories.data ?? [] });
        }
        case "categories": {
          const { data, error } = await supabase.from("tool_categories").select("*").order("position");
          if (error) throw error;
          return json(res, 200, { categories: data ?? [] });
        }
        case "feedback": {
          const { data, error } = await supabase.from("feedback").select("id,slug,helpful,message,email,status,created_at,updated_at").order("created_at", { ascending: false }).limit(500);
          if (error) throw error;
          return json(res, 200, { feedback: data ?? [] });
        }
        case "announcements": {
          const { data, error } = await supabase.from("announcements").select("*").order("updated_at", { ascending: false });
          if (error) throw error;
          return json(res, 200, { announcements: data ?? [] });
        }
        case "seo": {
          const [seo, tools] = await Promise.all([
            supabase.from("seo_overrides").select("*").order("slug"),
            supabase.from("tool_settings").select("slug,description"),
          ]);
          if (seo.error) throw seo.error;
          return json(res, 200, { seo: seo.data ?? [], descriptions: tools.data ?? [] });
        }
        case "settings": {
          const { data, error } = await supabase.from("site_settings").select("*").order("key");
          if (error) throw error;
          return json(res, 200, { settings: data ?? [] });
        }
        default:
          return json(res, 404, { error: "Unknown admin resource." });
      }
    }

    if (req.method === "PATCH" || req.method === "POST") {
      const body = readBody(req);
      switch (resource) {
        case "tools": {
          const slug = stringField(body.slug, 80);
          if (!slug) return json(res, 400, { error: "A tool slug is required." });
          const patch: Record<string, unknown> = { slug, updated_at: new Date().toISOString(), updated_by: admin.userId };
          const enabled = boolField(body.enabled);
          const hidden = boolField(body.hidden);
          if (enabled !== undefined) patch.enabled = enabled;
          if (hidden !== undefined) patch.hidden = hidden;
          if (body.name !== undefined) {
            if (body.name === null || body.name === "") patch.name = null;
            else {
              const name = stringField(body.name, 80);
              if (!name || name.length < 2) return json(res, 400, { error: "Tool names must be 2–80 characters." });
              patch.name = name;
            }
          }
          if (body.description !== undefined) {
            if (body.description === null || body.description === "") patch.description = null;
            else {
              const description = stringField(body.description, 300);
              if (!description || description.length < 10) return json(res, 400, { error: "Descriptions must be 10–300 characters." });
              patch.description = description;
            }
          }
          if (body.category !== undefined) {
            if (body.category === null || body.category === "") patch.category = null;
            else {
              const next = categoryId(body.category);
              if (!next) return json(res, 400, { error: "Choose a valid category." });
              const { data: found } = await supabase.from("tool_categories").select("id").eq("id", next).maybeSingle();
              if (!found) return json(res, 400, { error: "That category does not exist." });
              patch.category = next;
            }
          }
          if (Object.keys(patch).length <= 3) return json(res, 400, { error: "Nothing to update." });
          const { error } = await supabase.from("tool_settings").upsert(patch, { onConflict: "slug" });
          if (error) throw error;
          return json(res, 200, { ok: true });
        }
        case "categories": {
          const nextId = categoryId(body.id);
          const name = stringField(body.name, 60);
          if (!nextId || !name) return json(res, 400, { error: "A category id and name are required." });
          const description = body.description === undefined || body.description === null || body.description === "" ? null : stringField(body.description, 240);
          if (body.description && !description) return json(res, 400, { error: "Category descriptions must be 240 characters or fewer." });
          const position = Number.isFinite(Number(body.position)) ? Math.trunc(Number(body.position)) : 0;
          const { error } = await supabase.from("tool_categories").upsert({
            id: nextId,
            name,
            description,
            active: boolField(body.active) ?? true,
            position,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
          if (error) throw error;
          return json(res, 200, { ok: true });
        }
        case "feedback": {
          if (!id) return json(res, 400, { error: "A feedback id is required." });
          const status = stringField(body.status, 20) as FeedbackStatus | null;
          if (!status || !FEEDBACK_STATUSES.includes(status)) return json(res, 400, { error: "Status must be new, reviewing or resolved." });
          const { error } = await supabase.from("feedback").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
          if (error) throw error;
          return json(res, 200, { ok: true });
        }
        case "seo": {
          const slug = stringField(body.slug, 80);
          const title = stringField(body.title, 120);
          const description = stringField(body.description, 320);
          if (!slug || !title || !description) return json(res, 400, { error: "slug, title and description are required." });
          if (title.length < 10) return json(res, 400, { error: "Titles must be at least 10 characters." });
          if (description.length < 40) return json(res, 400, { error: "Meta descriptions should be at least 40 characters." });
          const { error } = await supabase.from("seo_overrides").upsert({ slug, title, description, updated_at: new Date().toISOString() }, { onConflict: "slug" });
          if (error) throw error;
          return json(res, 200, { ok: true });
        }
        case "announcements": {
          if (id) {
            const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: admin.userId };
            if (body.title !== undefined) {
              const title = stringField(body.title, 160);
              if (!title || title.length < 3) return json(res, 400, { error: "Titles need at least 3 characters." });
              patch.title = title;
            }
            if (body.body !== undefined) {
              const message = stringField(body.body, 1000);
              if (!message || message.length < 3) return json(res, 400, { error: "Messages need at least 3 characters." });
              patch.body = message;
            }
            const active = boolField(body.active);
            if (active !== undefined) patch.active = active;
            if (Object.keys(patch).length <= 3) return json(res, 400, { error: "Nothing to update." });
            const { error } = await supabase.from("announcements").update(patch).eq("id", id);
            if (error) throw error;
            return json(res, 200, { ok: true });
          }
          const title = stringField(body.title, 160);
          const message = stringField(body.body, 1000);
          if (!title || title.length < 3 || !message || message.length < 3) return json(res, 400, { error: "A title and message are required." });
          const { error } = await supabase.from("announcements").insert({ title, body: message, active: boolField(body.active) ?? true, updated_by: admin.userId });
          if (error) throw error;
          return json(res, 201, { ok: true });
        }
        case "settings": {
          const key = stringField(body.key, 60);
          if (!key || !/^[a-z_]+$/.test(key)) return json(res, 400, { error: "A valid setting key is required." });
          if (body.value === undefined) return json(res, 400, { error: "A value is required." });
          const { error } = await supabase.from("site_settings").upsert({ key, value: body.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
          if (error) throw error;
          return json(res, 200, { ok: true });
        }
        default:
          return json(res, 404, { error: "Unknown admin resource." });
      }
    }

    if (req.method === "DELETE") {
      if (resource === "announcements" && id) {
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (error) throw error;
        return json(res, 200, { ok: true });
      }
      if (resource === "feedback" && id) {
        const { error } = await supabase.from("feedback").delete().eq("id", id);
        if (error) throw error;
        return json(res, 200, { ok: true });
      }
      if (resource === "categories" && id) {
        const { count, error: usageError } = await supabase.from("tool_settings").select("slug", { count: "exact", head: true }).eq("category", id);
        if (usageError) throw usageError;
        if ((count ?? 0) > 0) return json(res, 409, { error: `This category is still assigned to ${count} tools. Reassign them first.` });
        const { error } = await supabase.from("tool_categories").delete().eq("id", id);
        if (error) throw error;
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: "Unknown delete route." });
    }

    return methodNotAllowed(res, ["GET", "PATCH", "POST", "DELETE"]);
  } catch (error) {
    console.error("admin api error", error instanceof Error ? error.message : error);
    return json(res, 500, { error: "The admin request failed. Check the server logs." });
  }
}

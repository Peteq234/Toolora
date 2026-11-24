import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "../_lib/http";
import { adminClient, serverConfigured } from "../_lib/supabase";

/**
 * Public, read-only site configuration. Returns defaults when Supabase is not
 * configured so the site works without any backend.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  if (!serverConfigured) {
    return json(res, 200, { configured: false, enabledTools: null, disabledTools: [], toolSettings: {}, categories: {}, seo: {}, announcements: [], settings: {} });
  }

  try {
    const supabase = adminClient();
    const [{ data: toolRows, error: toolsError }, { data: seo }, { data: announcements }, { data: settings }, { data: categoryRows }] =
      await Promise.all([
        supabase.from("tool_settings").select("slug,enabled,hidden,name,description,category"),
        supabase.from("seo_overrides").select("slug,title,description"),
        supabase.from("announcements").select("id,title,body,updated_at").eq("active", true).order("updated_at", { ascending: false }).limit(1),
        supabase.from("site_settings").select("key,value").in("key", ["site_name", "allow_indexing"]),
        supabase.from("tool_categories").select("id,name,description,active"),
      ]);

    if (toolsError) throw toolsError;

    return json(res, 200, {
      configured: true,
      enabledTools: (toolRows ?? []).filter((row) => row.enabled).map((row) => row.slug),
      disabledTools: (toolRows ?? []).filter((row) => !row.enabled).map((row) => row.slug),
      toolSettings: Object.fromEntries(
        (toolRows ?? []).map((row) => [
          row.slug,
          {
            slug: row.slug,
            enabled: Boolean(row.enabled),
            hidden: Boolean(row.hidden),
            name: row.name ?? null,
            description: row.description ?? null,
            category: row.category ?? null,
          },
        ])
      ),
      categories: Object.fromEntries(
        (categoryRows ?? []).map((row) => [row.id, { id: row.id, name: row.name, description: row.description ?? null, active: Boolean(row.active) }])
      ),
      seo: Object.fromEntries((seo ?? []).map((row) => [row.slug, { title: row.title, description: row.description }])),
      announcements: announcements ?? [],
      settings: Object.fromEntries((settings ?? []).map((row) => [row.key, row.value])),
    });
  } catch {
    return json(res, 200, { configured: false, enabledTools: null, disabledTools: [], toolSettings: {}, categories: {}, seo: {}, announcements: [], settings: {} });
  }
}

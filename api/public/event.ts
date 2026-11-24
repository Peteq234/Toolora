import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, rateLimit, readBody, stringField } from "../_lib/http";
import { adminClient, serverConfigured } from "../_lib/supabase";

/**
 * Records anonymous, aggregate tool usage. Privacy by design:
 * - no IP address, user agent, referrer or full URL is stored
 * - only a tool slug and event name are kept
 * - one row per event; no visitor identifiers or cookies
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!serverConfigured) return json(res, 202, { recorded: false, reason: "not_configured" });

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded ?? "").split(",")[0].trim() || "unknown";
  if (!rateLimit(`event:${ip}`, 60, 60_000)) return json(res, 429, { error: "Too many events." });

  const body = readBody(req);
  const slug = stringField(body.slug, 80);
  const event = body.event === "tool_use" ? "tool_use" : "tool_open";
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return json(res, 400, { error: "A valid tool slug is required." });

  try {
    const supabase = adminClient();
    const { error } = await supabase.from("analytics_events").insert({ event, slug });
    if (error) throw error;
    return json(res, 202, { recorded: true });
  } catch {
    return json(res, 202, { recorded: false });
  }
}

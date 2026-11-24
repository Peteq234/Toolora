import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isEmail, json, methodNotAllowed, rateLimit, readBody, stringField } from "../_lib/http";
import { adminClient, serverConfigured } from "../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!serverConfigured) return json(res, 503, { error: "Feedback storage is not configured.", code: "NOT_CONFIGURED" });

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded ?? "").split(",")[0].trim() || "unknown";
  if (!rateLimit(`feedback:${ip}`, 5, 10 * 60_000)) return json(res, 429, { error: "Too many feedback submissions. Try again later." });

  const body = readBody(req);
  const slug = stringField(body.slug, 80);
  const message = stringField(body.message, 2000);
  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  const helpful = typeof body.helpful === "boolean" ? body.helpful : null;

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return json(res, 400, { error: "A valid tool slug is required." });
  if (!message && helpful === null) return json(res, 400, { error: "Add a rating or a message." });
  if (emailRaw && !isEmail(emailRaw)) return json(res, 400, { error: "That email address is not valid." });

  try {
    const supabase = adminClient();
    const { error } = await supabase.from("feedback").insert({
      slug,
      helpful,
      message: message ?? null,
      email: emailRaw || null,
    });
    if (error) throw error;
    return json(res, 201, { received: true });
  } catch {
    return json(res, 500, { error: "The feedback could not be saved. Please try again later." });
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json } from "./_lib/http";
import { serverConfigured } from "./_lib/supabase";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });
  return json(res, 200, {
    ok: true,
    supabaseConfigured: serverConfigured,
    adminAllowlistConfigured: Boolean(process.env.ADMIN_EMAILS?.trim()),
    time: new Date().toISOString(),
  });
}

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json } from "./http";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

export const serverConfigured = Boolean(url && serviceKey && anonKey);

export function adminClient() {
  if (!serverConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Server runtimes (Node 20 on Vercel) do not have a native WebSocket.
    // Supabase initialises Realtime even though we never use it, so provide ws.
    realtime: { transport: WebSocket as never },
    global: { headers: { "X-Client-Info": "toolora-admin-api" } },
  });
}

export function authClient() {
  if (!serverConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { transport: WebSocket as never },
  });
}

export type AdminSession = { userId: string; email: string };

/**
 * Server-side authorization. A valid Supabase access token is only the first
 * step: the user must also be listed in admin_users (active) or in the
 * ADMIN_EMAILS allowlist. RLS independently enforces the same rule in Postgres.
 */
export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse
): Promise<AdminSession | null> {
  if (!serverConfigured) {
    json(res, 503, {
      error: "Admin backend is not configured.",
      code: "SUPABASE_NOT_CONFIGURED",
      hint: "Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in the hosting environment.",
    });
    return null;
  }

  const header = req.headers.authorization;
  const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    json(res, 401, { error: "Authentication required.", code: "NO_TOKEN" });
    return null;
  }

  const auth = authClient();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user?.email) {
    json(res, 401, { error: "Session is invalid or expired.", code: "INVALID_SESSION" });
    return null;
  }

  const email = data.user.email.toLowerCase();
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.includes(email)) {
    return { userId: data.user.id, email };
  }

  const admin = adminClient();
  const { data: row, error: lookupError } = await admin
    .from("admin_users")
    .select("user_id,active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (lookupError || !row || row.active !== true) {
    json(res, 403, { error: "This account is not an administrator.", code: "NOT_ADMIN" });
    return null;
  }

  return { userId: data.user.id, email };
}

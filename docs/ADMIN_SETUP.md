# Toolora private admin — secure setup

The admin dashboard is real authentication, not a hidden page. A browser can only *ask* to
use it: every `/api/admin/*` request is verified on the server, the server uses a service-role
key that never reaches the browser, and Postgres Row Level Security (RLS) independently
enforces the administrator allowlist.

> **The dashboard requires configuration before any login is possible.** Without
> `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, `/admin` shows an explicit "not configured"
> notice instead of a fake form. The server APIs return 503 rather than data.

> **Nothing is public until you deploy it.** This repository does not contain credentials,
> and the `/admin` page shows a setup notice (not a fake login) until Supabase is configured.

## Requirements

- A free [Supabase](https://supabase.com) project
- A host that runs the `api/` functions — Vercel is the documented option (`vercel.json` included)

## 1. Create the database schema

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/migrations/0001_admin_schema.sql` and run it.
3. This creates `admin_users`, `tool_settings`, `analytics_events`, `feedback`, `announcements`,
   `seo_overrides` and `site_settings`, enables RLS on all of them, revokes anonymous table
   access, and seeds all 55 tools as enabled.
4. Run `supabase/migrations/0002_admin_management.sql` as well. It adds editable tool names,
   descriptions, category overrides and visibility, the editable `tool_categories` table, and the
   feedback workflow status. Both migrations are additive and safe to run once, in order.

Verify RLS is active and anonymous access is denied:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('admin_users','tool_settings','analytics_events','feedback','announcements','seo_overrides','site_settings');
-- every row must show rowsecurity = true
```

## 2. Create your administrator account

1. Supabase → **Authentication** → **Users** → **Add user** (Create new user).
   Use an email you control and a strong, unique password. Confirm the email if your project
   requires confirmation.
2. Copy the new user's **UUID**.
3. Run this in the SQL editor, replacing both values:

```sql
insert into public.admin_users (user_id, email)
values ('00000000-0000-0000-0000-000000000000', 'you@example.com')
on conflict (user_id) do update set active = true;
```

Store one administrator only unless you genuinely need more. That row is the only thing that grants administrator access. Ordinary accounts cannot add
themselves: the `admin_users` table has RLS and no insert/update policy for authenticated users,
and the server checks active membership on every request.

## 3. Configure environment variables

In Vercel → Project → **Settings → Environment Variables**, add:

| Name | Value | Exposure |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL | public (needed by the sign-in page) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | public by design |
| `SUPABASE_URL` | Supabase Project URL | server only |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | **server only, secret** |
| `ADMIN_EMAILS` | optional, comma-separated allowlist | server only |

`.env.example` lists the same names. Keep a local `.env` out of git — `.gitignore` already
excludes it. Never prefix the service-role key with `VITE_`: that would expose it to every
visitor. Never commit `.env` files.

Redeploy after adding variables. `GET /api/health` should then report
`"supabaseConfigured": true`.

## 4. Sign in

1. Visit `/admin/login`.
2. Sign in with the account you added to `admin_users`.
3. If you see “This account is signed in but is not an authorized administrator”, the
   `admin_users` row is missing, inactive, or was created with a different user.

Sessions are handled by Supabase Auth (`persistSession`, automatic token refresh). **Sign out**
clears the local session. Closing the browser does not revoke the refresh token, so sign out on
shared devices; you can revoke all sessions in the Supabase dashboard.

## What is protected where

| Layer | Protection |
|---|---|
| React UI | Admin code is lazy-loaded only on `/admin`; no public navigation link; no data rendered without a valid session |
| Supabase Auth | Email + password verified by Supabase; access tokens expire and refresh |
| `/api/admin/*` | Requires `Authorization: Bearer <token>`; token verified with Supabase; user must be active in `admin_users` or `ADMIN_EMAILS`; service role used only after that check |
| Postgres | RLS enabled; anonymous/authenticated grants revoked; `is_admin()` guards every admin table |
| Secrets | Service-role key only in server environment variables; never bundled |
| Indexing | `robots.txt` disallows `/admin` and `/api`; Vercel sets `X-Robots-Tag: noindex` |

The dashboard intentionally has **no client-side-only shortcuts**. Removing UI controls would
not grant access; conversely, bypassing the UI still hits the server and RLS checks.

## Admin dashboard sections

- **Overview** — real counts from your database (tools, events, feedback, announcements)
- **Tools manager** — enable/disable any tool; disabled tools disappear from the public
  directory/search and their pages show an availability notice
- **Analytics** — first-party tool opens over 7/30/90 days, per-tool ranking and daily volume
- **Feedback** — ratings and messages submitted from tool pages; optional email for a reply; delete
- **SEO** — title/meta description overrides applied on the public tool page
- **Announcements** — create/delete the dismissible banner shown under the site header
- **Settings** — site name and indexing preference stored in the database

### Management capabilities (migration 0002)

- Rename tools, edit their public descriptions and reassign categories; the public cards and tool
  header use the overrides.
- Enable/disable tools and hide them from listings. Disabled tools show an availability notice;
  hidden tools remain available by direct URL but disappear from the directory, search palette and suites.
- Create, rename, describe, deactivate and delete categories (deletion is refused while tools still use one).
- Feedback status workflow: new → reviewing → resolved, plus delete.
- SEO overrides for title and meta description, plus a public description field.
- Edit existing announcements and toggle them active/inactive.
- Suite membership is displayed in the Tools Manager; suites are defined in
  `src/lib/suites.ts` so navigation cannot be broken by a bad database value.

## Honest limitations

- **No data before setup.** The dashboard displays only records that actually exist. It never
  generates sample statistics.
- **Analytics are aggregate events, not people.** No IP address, user agent, cookie or visitor
  identifier is stored. “Opens” are page events; they are not unique visitors.
- **SEO overrides are applied client-side** (document title/meta updated by the app). Google
  generally renders JavaScript, but social unfurlers read the static HTML, so an override may not
  appear in link previews. Edit `src/lib/tools.ts` for metadata that must exist in the initial HTML.
- **Analytics persistence depends on the API.** With Supabase configured, events are written by
  `/api/public/event`. If the backend is unavailable, events are silently dropped rather than
  queued in the browser.
- **The sign-in SDK is bundled but dynamically imported only on `/admin`**, so public tool
  routes do not download it. No third-party CDN is used for authentication.
- **URL shortener:** deliberately not included. It would require a persistent backend, abuse
  control and a domain; a client-only “shortener” would produce fake links.
- **IP geolocation** is an optional, consent-required request to ipapi.co. Only the address you
  type is sent. See the privacy policy.

## Rotating credentials and access

1. To revoke an administrator: `update public.admin_users set active = false where email = '...';`
   The next admin API request is rejected with 403.
2. To rotate the service-role key: Supabase → Settings → API → rotate, update Vercel, redeploy.
3. To reset a password: Supabase → Authentication → Users → the account → reset/update.
4. If the service-role key is ever exposed, rotate it immediately; treat all admin data as
   potentially public until rotated.

-- Toolsy admin schema, security policies and seed data.
-- Run this in the Supabase SQL editor for a new project, then follow docs/ADMIN_SETUP.md.
-- It contains no passwords, keys or personal data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Administrators
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Explicit administrator allowlist. Being signed in to Supabase Auth is NOT enough to be an admin.';

-- Server-side helper used by RLS policies. SECURITY DEFINER avoids recursive RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Tool settings (enable/disable + optional SEO overrides live in seo_overrides)
-- ---------------------------------------------------------------------------
create table if not exists public.tool_settings (
  slug text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- ---------------------------------------------------------------------------
-- 3. SEO overrides
-- ---------------------------------------------------------------------------
create table if not exists public.seo_overrides (
  slug text primary key,
  title text not null check (char_length(title) between 10 and 120),
  description text not null check (char_length(description) between 40 and 320),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Anonymous usage analytics (aggregate only)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event text not null check (event in ('tool_open', 'tool_use')),
  slug text not null check (slug ~ '^[a-z0-9-]+{1,80}$'),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_slug_idx on public.analytics_events (slug);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);

comment on table public.analytics_events is
  'No IP addresses, user agents, referrers, cookies or user identifiers are stored here.';

-- ---------------------------------------------------------------------------
-- 5. Feedback
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  slug text not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  helpful boolean,
  message text check (message is null or char_length(message) <= 2000),
  email text check (email is null or char_length(email) <= 254),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Announcements and site settings
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 3 and 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.tool_settings enable row level security;
alter table public.seo_overrides enable row level security;
alter table public.analytics_events enable row level security;
alter table public.feedback enable row level security;
alter table public.announcements enable row level security;
alter table public.site_settings enable row level security;

-- Default deny: revoke everything from anonymous and authenticated roles, then
-- grant only what the admin dashboard needs. The API uses the service role and
-- enforces requireAdmin() independently; these policies are defence in depth.
revoke all on public.admin_users from anon, authenticated;
revoke all on public.tool_settings from anon, authenticated;
revoke all on public.seo_overrides from anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;
revoke all on public.feedback from anon, authenticated;
revoke all on public.announcements from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;

-- Administrators can read and manage their own allowlist row (no self-promotion).
drop policy if exists admin_users_read_self on public.admin_users;
create policy admin_users_read_self on public.admin_users
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tool_settings_admin on public.tool_settings;
create policy tool_settings_admin on public.tool_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists seo_overrides_admin on public.seo_overrides;
create policy seo_overrides_admin on public.seo_overrides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists analytics_admin_read on public.analytics_events;
create policy analytics_admin_read on public.analytics_events
  for select to authenticated using (public.is_admin());

drop policy if exists feedback_admin on public.feedback;
create policy feedback_admin on public.feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists announcements_admin on public.announcements;
create policy announcements_admin on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists site_settings_admin on public.site_settings;
create policy site_settings_admin on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public reads are served by /api/public/config using the service role, so no
-- anonymous table grants are required. Nothing in the admin schema is readable
-- directly with the anon key.

-- ---------------------------------------------------------------------------
-- 8. Seed tool settings (all 55 tools enabled by default)
-- ---------------------------------------------------------------------------
insert into public.tool_settings (slug, enabled) values
  ('password-generator', true),
  ('username-generator', true),
  ('random-number-generator', true),
  ('random-choice-picker', true),
  ('word-counter', true),
  ('case-converter', true),
  ('percentage-calculator', true),
  ('unit-converter', true),
  ('bmi-calculator', true),
  ('stopwatch-timer', true),
  ('age-calculator', true),
  ('color-palette-generator', true),
  ('qr-code-generator', true),
  ('internet-speed-guide', true),
  ('pc-bottleneck-calculator', true),
  ('json-formatter-validator', true),
  ('base64-encoder-decoder', true),
  ('url-encoder-decoder', true),
  ('timestamp-converter', true),
  ('text-diff-checker', true),
  ('markdown-editor', true),
  ('image-compressor', true),
  ('color-contrast-checker', true),
  ('css-gradient-generator', true),
  ('regex-tester', true),
  ('parent-height-predictor', true),
  ('childrens-bmi-calculator', true),
  ('percentage-increase-calculator', true),
  ('discount-calculator', true),
  ('average-calculator', true),
  ('grade-calculator', true),
  ('cooking-measurement-converter', true),
  ('date-difference-calculator', true),
  ('time-duration-calculator', true),
  ('remove-duplicate-lines', true),
  ('sort-text-lines', true),
  ('text-cleaner', true),
  ('lorem-ipsum-generator', true),
  ('reading-time-calculator', true),
  ('text-reverser', true),
  ('image-resizer', true),
  ('image-cropper', true),
  ('image-format-converter', true),
  ('image-to-base64', true),
  ('pdf-merge', true),
  ('pdf-split', true),
  ('pdf-page-extractor', true),
  ('wifi-qr-code-generator', true),
  ('html-formatter', true),
  ('xml-formatter', true),
  ('sql-formatter', true),
  ('javascript-minifier', true),
  ('http-status-code-lookup', true),
  ('user-agent-parser', true),
  ('ip-address-lookup', true)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('site_name', '"Toolsy"'::jsonb),
  ('allow_indexing', 'true'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 9. Administrator bootstrap (MANUAL, one time)
-- ---------------------------------------------------------------------------
-- 1. Create your account in Supabase Dashboard > Authentication > Users.
--    Use a strong unique password and enable MFA on your Supabase account.
-- 2. Copy the user's UUID, then run (replace the values):
--
--    insert into public.admin_users (user_id, email)
--    values ('00000000-0000-0000-0000-000000000000', 'you@example.com')
--    on conflict (user_id) do update set active = true;
--
-- 3. Optionally set ADMIN_EMAILS in Vercel as a second allowlist.
-- No password is ever stored in this repository or in frontend code.

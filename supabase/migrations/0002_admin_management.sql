-- Toolsy admin management upgrade.
-- Run AFTER 0001_admin_schema.sql. Contains no credentials or personal data.

-- ---------------------------------------------------------------------------
-- 1. Tool metadata managed from the admin Tools Manager
-- ---------------------------------------------------------------------------
alter table public.tool_settings
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists hidden boolean not null default false,
  add column if not exists updated_by uuid references auth.users(id);

alter table public.tool_settings drop constraint if exists tool_settings_name_len;
alter table public.tool_settings add constraint tool_settings_name_len
  check (name is null or char_length(name) between 2 and 80);

alter table public.tool_settings drop constraint if exists tool_settings_description_len;
alter table public.tool_settings add constraint tool_settings_description_len
  check (description is null or char_length(description) between 10 and 300);

alter table public.tool_settings drop constraint if exists tool_settings_category_fmt;
alter table public.tool_settings add constraint tool_settings_category_fmt
  check (category is null or category ~ '^[a-z0-9-]{2,40}$');

comment on column public.tool_settings.hidden is
  'Hidden tools keep working on their direct page but are removed from the directory, suites and search.';

-- ---------------------------------------------------------------------------
-- 2. Editable categories
-- ---------------------------------------------------------------------------
create table if not exists public.tool_categories (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 240),
  active boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.tool_categories (id, name, description, position) values
  ('generators', 'Generators', 'Passwords, names and random picks created locally.', 1),
  ('text', 'Text & writing', 'Count, clean and reshape any piece of copy.', 2),
  ('developer', 'Developer tools', 'Format, encode, compare and debug data in the browser.', 3),
  ('files', 'Files & PDFs', 'Images and PDFs processed without uploading them.', 4),
  ('family', 'Family & growth', 'Careful, reference-based growth estimates.', 5),
  ('calculators', 'Calculators', 'Everyday maths, conversions and health estimates.', 6),
  ('time', 'Time & date', 'Timers, date arithmetic and durations.', 7),
  ('design', 'Design & web', 'Colours, QR codes and visual utilities.', 8),
  ('tech', 'Tech & internet', 'Understand connections, hardware and the web.', 9)
on conflict (id) do nothing;

alter table public.tool_categories enable row level security;
revoke all on public.tool_categories from anon, authenticated;
drop policy if exists tool_categories_admin on public.tool_categories;
create policy tool_categories_admin on public.tool_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Feedback workflow status
-- ---------------------------------------------------------------------------
alter table public.feedback
  add column if not exists status text not null default 'new',
  add column if not exists updated_at timestamptz not null default now();

alter table public.feedback drop constraint if exists feedback_status_values;
alter table public.feedback add constraint feedback_status_values
  check (status in ('new', 'reviewing', 'resolved'));

create index if not exists feedback_status_idx on public.feedback (status);

-- Public feedback inserts are server-side; no anonymous grants exist.
-- ---------------------------------------------------------------------------
-- 4. Announcement editing metadata
-- ---------------------------------------------------------------------------
alter table public.announcements
  add column if not exists updated_by uuid references auth.users(id);

-- RLS and administrator policies for existing tables already exist in 0001.
-- No anonymous policies are added here on purpose: public reads go through
-- /api/public/config, which uses the server role.

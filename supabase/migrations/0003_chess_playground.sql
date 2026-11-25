-- Optional admin seeds for the Chess Playground.
-- Run after 0001 and 0002. Guarded so it never fails on a fresh or partial setup.

do $$
begin
  if to_regclass('public.tool_categories') is not null then
    insert into public.tool_categories (id, name, description, active, position)
    values (
      'learning',
      'Learning & reference',
      'Explore and practise — from chess openings to study aids.',
      true,
      10
    )
    on conflict (id) do nothing;
  end if;

  if to_regclass('public.tool_settings') is not null then
    insert into public.tool_settings (slug, enabled)
    values ('chess-playground', true)
    on conflict (slug) do nothing;
  end if;
end
$$;

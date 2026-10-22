-- ====================================================================
-- 0015 - repair the XP aggregate write and the policies 0001 never
--        finished creating
--
-- Two defects survive in the applied migration set. Both are runtime
-- failures, not style problems, and both are fixed here without changing
-- what any role is allowed to do.
--
-- 1. public.pathway_xp has two shapes in the wild.
--
--    0001 originally declared it twice: a derived view over xp_events and
--    a table with the same name. The table statement therefore failed and
--    the deployed relation is the view. 0003's award_xp() still writes the
--    per-pathway total with an upsert, and an upsert cannot run against a
--    view, so every instructor XP award raised "cannot insert into view".
--    The committed 0001 declares it as a table, so a fresh install never
--    had the problem.
--
--    Rather than force a view into a table, the write is guarded by the
--    relation kind: when public.pathway_xp is a table the total is kept
--    alongside the ledger, and when it is the derived view the row written
--    to xp_events is already reflected in it. award_xp() is redefined here
--    with that guard; 0011 does the same for the Probe mentor award.
--
-- 2. 0001 ends with two policies named "read own notifications", one for
--    select and one for update. Postgres requires unique policy names per
--    table, so the second statement failed and the three policies after it
--    were never created on any database built from that file: developers
--    could read notifications but never mark them read, and the
--    achievements, unlocks and activity feeds stayed invisible.
--
--    0001 is not re-run and not rewritten, so the policies are re-asserted
--    here. The update policy gets its own name because the original could
--    never exist.
--
-- Nothing in this migration changes RLS scope, grants XP to anybody, or
-- touches the instructor checks that guard awarding and reviewing.
-- ====================================================================

begin;

-- ------------------------------------------------------------- policies

-- Notifications: read your own, and mark your own as read.
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications"
  on public.notifications for select using (auth.uid() = developer_id);

drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications"
  on public.notifications for update using (auth.uid() = developer_id);

-- Achievements: a developer sees the titles they earned.
drop policy if exists "read own achievements" on public.achievements;
create policy "read own achievements"
  on public.achievements for select using (auth.uid() = developer_id);

-- Unlocks: a developer sees the unlocks granted to them.
drop policy if exists "read own unlocks" on public.developer_unlocks;
create policy "read own unlocks"
  on public.developer_unlocks for select using (auth.uid() = developer_id);

-- Activity: the shared feed of XP events is readable by everybody.
drop policy if exists "activity is readable" on public.activity_events;
create policy "activity is readable"
  on public.activity_events for select using (true);

-- ------------------------------------------------------------- award_xp

-- Same contract as 0003: only an instructor may award XP, the event is
-- appended to the ledger, the profile totals move, and the developer is
-- notified. The only change is that the per-pathway aggregate is written
-- only when public.pathway_xp is a table.
create or replace function public.award_xp(
  p_developer_id uuid,
  p_pathway_id public.pathway_id,
  p_source public.xp_source,
  p_xp integer,
  p_label text,
  p_detail text default '',
  p_reference_id uuid default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if p_xp = 0 then
    return 0;
  end if;

  -- The boundary. auth.uid() is the caller even inside a definer
  -- function, and even when called from review_submission().
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may award xp';
  end if;

  insert into public.xp_events
    (developer_id, pathway_id, source, xp, label, detail, reference_id)
  values
    (p_developer_id, p_pathway_id, p_source, p_xp, p_label, p_detail, p_reference_id);

  -- The per-pathway total is materialised only when public.pathway_xp is a
  -- table. When it is the derived view over xp_events, the insert above is
  -- already reflected in it and this write is skipped.
  if exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'pathway_xp'
       and c.relkind = 'r'
  ) then
    insert into public.pathway_xp (developer_id, pathway_id, xp)
    values (p_developer_id, p_pathway_id, p_xp)
    on conflict (developer_id, pathway_id)
    do update set xp = public.pathway_xp.xp + excluded.xp;
  end if;

  update public.profiles
    set total_xp = greatest(0, total_xp + p_xp),
        weekly_xp = weekly_xp + p_xp,
        last_active_at = now()
  where id = p_developer_id
  returning total_xp into v_total;

  insert into public.activity_events (developer_id, kind, message, xp, reference_id)
  values (
    p_developer_id,
    p_source::text,
    p_detail,
    p_xp,
    p_reference_id
  );

  insert into public.notifications (developer_id, kind, headline, body, xp)
  values (
    p_developer_id,
    case when p_source = 'teaching' then 'teaching'
         when p_source = 'scout' then 'scout'
         else 'xp' end,
    '+' || p_xp || ' XP',
    p_detail,
    p_xp
  );

  return v_total;
end;
$$;

revoke execute on function public.award_xp(
  uuid, public.pathway_id, public.xp_source, integer, text, text, uuid
) from public, anon;
grant execute on function public.award_xp(
  uuid, public.pathway_id, public.xp_source, integer, text, text, uuid
) to authenticated;

commit;

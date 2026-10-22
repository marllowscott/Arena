-- ====================================================================
-- 0002 — real accounts, instructor role, Probe ownership
--
-- 0001 left three things unfinished that a real app cannot run without:
--   1. no instructor identity that is not a side effect of owning an unlock
--   2. no way to write a challenge, so nobody can author content
--   3. no Probe ownership, so "accept and help" has nothing to accept into
--
-- This migration adds a role, an explicit ownership column, the write
-- policies the instructor side needs, a trigger that provisions a profile
-- when somebody signs up, and the RPCs that own the Probe state machine.
-- ====================================================================

-- ------------------------------------------------------------ profiles

-- The role is an attribute, not a derived permission. The old definition
-- (0001 line 437) counted a reviews-scope developer_unlock, which meant the
-- instructor was whoever happened to be holding an unlock.
alter table public.profiles
  add column if not exists role text not null default 'developer'
    check (role in ('developer', 'instructor'));

-- Carry the old definition forward so nobody loses instructor access on deploy.
update public.profiles p
   set role = 'instructor'
 where p.role = 'developer'
   and exists (
     select 1
       from public.developer_unlocks du
       join public.unlocks u on u.id = du.unlock_id
      where du.developer_id = p.id
        and u.scope = 'reviews'
   );

create or replace function public.is_instructor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'instructor'
  );
$$;

grant execute on function public.is_instructor(uuid) to authenticated;

-- ------------------------------------------------------------ signup

-- Every signup provisions a profile. Doing it here rather than in a server
-- action means the row exists no matter which path created the auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_handle text;
begin
  v_base := lower(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'handle', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'developer'
    )
  );

  -- handle is unique; disambiguate on the new user's uuid rather than failing
  -- the signup, because losing an account to a name clash is far worse.
  v_handle := v_base;
  if exists (select 1 from public.profiles where handle = v_handle) then
    v_handle := v_base || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  insert into public.profiles (id, handle, full_name)
  values (
    new.id,
    v_handle,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Developer'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ probe

-- 0001's help_requests was behind the TypeScript type: tags, technologies,
-- urgency and flagging existed in the app but had nowhere to live.
alter table public.help_requests
  add column if not exists accepted_by uuid references public.profiles (id) on delete set null,
  add column if not exists accepted_at timestamptz,
  add column if not exists tags text[] not null default '{}',
  add column if not exists technologies text[] not null default '{}',
  add column if not exists urgency text not null default 'normal'
    check (urgency in ('normal', 'blocking')),
  add column if not exists flagged boolean not null default false,
  add column if not exists flag_reason text;

-- Accepting is a compare-and-set: the `accepted_by is null` predicate is what
-- makes it exclusive. Two developers tapping the button at the same moment
-- still produce exactly one winner, because the second update matches no rows.
create or replace function public.accept_probe(p_request_id uuid)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated public.help_requests;
begin
  if p_request_id is null then
    raise exception 'probe id is required';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid()
  ) then
    raise exception 'you need a profile to help';
  end if;

  if exists (
    select 1 from public.help_requests
    where id = p_request_id and developer_id = auth.uid()
  ) then
    raise exception 'you cannot accept your own probe';
  end if;

  update public.help_requests
     set accepted_by = auth.uid(),
         accepted_at = now()
   where id = p_request_id
     and accepted_by is null
     and status = 'open'
     and flagged is false
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'this probe is already being helped';
  end if;

  return v_updated;
end;
$$;

-- Dropping off puts the probe back on the board. Without this a developer who
-- accepts and then goes quiet locks the asker out permanently.
create or replace function public.release_probe(p_request_id uuid)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated public.help_requests;
begin
  update public.help_requests
     set accepted_by = null,
         accepted_at = null
   where id = p_request_id
     and accepted_by = auth.uid()
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'you are not helping this probe';
  end if;

  return v_updated;
end;
$$;

-- The asker marks the answer that actually solved it, which closes the probe
-- and is the input to the Mentor XP award.
create or replace function public.confirm_probe_answer(
  p_request_id uuid,
  p_answer_id uuid
)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated public.help_requests;
begin
  if not exists (
    select 1 from public.help_requests
    where id = p_request_id and developer_id = auth.uid()
  ) then
    raise exception 'only the person who asked can confirm an answer';
  end if;

  if not exists (
    select 1 from public.help_answers
    where id = p_answer_id and request_id = p_request_id
  ) then
    raise exception 'that answer is not on this probe';
  end if;

  update public.help_answers
     set confirmed = (id = p_answer_id)
   where request_id = p_request_id;

  update public.help_requests
     set confirmed_answer_id = p_answer_id,
         status = 'solved',
         accepted_by = null,
         accepted_at = null
   where id = p_request_id
  returning * into v_updated;

  return v_updated;
end;
$$;

-- Ownership has to hold even if someone posts an answer by other means, so it
-- is enforced here as well as in the UI.
create or replace function public.enforce_probe_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asker uuid;
  v_helper uuid;
begin
  select developer_id, accepted_by
    into v_asker, v_helper
    from public.help_requests
   where id = new.request_id;

  if v_helper is not null and new.author_id <> v_helper and new.author_id <> v_asker then
    raise exception 'this probe already has a helper';
  end if;

  return new;
end;
$$;

drop trigger if exists on_help_answer_ownership on public.help_answers;
create trigger on_help_answer_ownership
  before insert on public.help_answers
  for each row execute function public.enforce_probe_ownership();

grant execute on function public.accept_probe(uuid) to authenticated;
grant execute on function public.release_probe(uuid) to authenticated;
grant execute on function public.confirm_probe_answer(uuid, uuid) to authenticated;

-- ------------------------------------------------------------ policies

-- 0001 opened challenges read-only. This is the policy that makes the
-- instructor side real: authoring, editing and retiring problems.
drop policy if exists "instructors create challenges" on public.challenges;
create policy "instructors create challenges"
  on public.challenges for insert
  with check (is_instructor(auth.uid()));

drop policy if exists "instructors update challenges" on public.challenges;
create policy "instructors update challenges"
  on public.challenges for update
  using (is_instructor(auth.uid()))
  with check (is_instructor(auth.uid()));

drop policy if exists "instructors delete challenges" on public.challenges;
create policy "instructors delete challenges"
  on public.challenges for delete
  using (is_instructor(auth.uid()));

-- A developer may edit their own probe but may not claim it, and RLS has no way
-- to compare against the old row, so accepted_by is protected by the RPCs and
-- this policy simply refuses to let a claim be written directly.
drop policy if exists "asker edits own probe" on public.help_requests;
create policy "asker edits own probe"
  on public.help_requests for update
  using (auth.uid() = developer_id)
  with check (auth.uid() = developer_id and accepted_by is null);

drop policy if exists "instructors moderate probes" on public.help_requests;
create policy "instructors moderate probes"
  on public.help_requests for update
  using (is_instructor(auth.uid()))
  with check (is_instructor(auth.uid()));

-- Nobody creates their own profile. The signup trigger writes it as definer,
-- and this closes the alternative of a forged row with a chosen role.
drop policy if exists "own profile only" on public.profiles;
create policy "own profile only"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'developer');

-- Nobody promotes themselves. Role changes are an operator action.
drop policy if exists "no self promotion" on public.profiles;
create policy "no self promotion"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and total_xp = (select total_xp from public.profiles where id = auth.uid())
    and weekly_xp = (select weekly_xp from public.profiles where id = auth.uid())
    and streak_days = (select streak_days from public.profiles where id = auth.uid())
    and weekly_movement = (select weekly_movement from public.profiles where id = auth.uid())
  );

-- 0001's policy is superseded: it allowed the xp columns to be checked against
-- a subselect on the same table, which the new policy replaces cleanly.
drop policy if exists "update own profile, never xp" on public.profiles;

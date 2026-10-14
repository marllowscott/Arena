-- Assign instructor access to every account whose email domain is exactly
-- uncommon.org. All other accounts receive the developer role.
--
-- Apply after the existing profile provisioning migration (0003) in the
-- Supabase SQL Editor. Adds profiles.role if migration 0002 was not applied.

begin;

alter table public.profiles
  add column if not exists role text not null default 'developer'
    check (role in ('developer', 'instructor'));

create or replace function public.is_instructor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'instructor'
  );
$$;

grant execute on function public.is_instructor(uuid) to authenticated;

-- Allow only database-authorized instructors to publish challenges.
grant insert on public.challenges to authenticated;
drop policy if exists "instructors create challenges" on public.challenges;
create policy "instructors create challenges"
  on public.challenges for insert
  with check (public.is_instructor(auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_handle text;
  v_role text;
  v_instructor_email text;
begin
  v_base := lower(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'handle', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'developer'
    )
  );

  v_handle := v_base;
  if exists (
    select 1 from public.profiles
    where handle = v_handle and id <> new.id
  ) then
    v_handle := v_base || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  v_role := case
    when lower(split_part(coalesce(new.email, ''), '@', 2)) = 'uncommon.org'
      then 'instructor'
    else 'developer'
  end;

  insert into public.profiles (id, handle, full_name, role)
  values (
    new.id,
    v_handle,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Developer'
    ),
    v_role
  )
  on conflict (id) do update
    set role = excluded.role;

  -- Preserve the legacy panelist unlock behavior. This setting no longer
  -- controls instructor authorization; profiles.role is the authority.
  if to_regclass('public.app_config') is not null then
    execute
      'select value from public.app_config where key = $1'
      into v_instructor_email
      using 'instructor_email';

    if v_instructor_email is not null
       and v_instructor_email <> ''
       and lower(new.email) = lower(v_instructor_email) then
      insert into public.developer_unlocks (developer_id, unlock_id)
      values (new.id, 'unlock-panelist')
      on conflict (developer_id, unlock_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- Reclassify all existing profiles from their current Auth email.
update public.profiles p
   set role = case
     when lower(split_part(coalesce(u.email, ''), '@', 2)) = 'uncommon.org'
       then 'instructor'
     else 'developer'
   end
  from auth.users u
 where p.id = u.id
   and p.role is distinct from case
     when lower(split_part(coalesce(u.email, ''), '@', 2)) = 'uncommon.org'
       then 'instructor'
     else 'developer'
   end;

-- Replace the existing profile update policy with one that also prevents
-- clients from changing their role.
drop policy if exists "update own profile, never xp" on public.profiles;
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

commit;

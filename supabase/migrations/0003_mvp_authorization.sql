-- ====================================================================
-- 0003 — MVP authorization, signup provisioning, claims
--
-- The smallest changes the MVP needs on top of 0001. Apply with the
-- Supabase SQL editor (or `supabase db push`). Does NOT contain the
-- role redesign or Probe ownership from 0002 — those stay out of scope.
--
-- OPERATOR STEP (required once):
--   update public.app_config set value = 'the-authorized-instructor@email.com'
--     where key = 'instructor_email';
-- The address must match INSTRUCTOR_EMAIL in .env.local. It is the only
-- account that receives the reviews-scope unlock, and therefore the only
-- account is_instructor() returns true for.
-- ====================================================================

begin;

-- ============================================================
-- 1. AUTHORIZATION FIX (critical)
--
-- 0001 granted execute on award_xp and review_submission to
-- `authenticated`, so ANY signed-in developer could call the RPCs
-- directly and award themselves XP or approve their own submission.
-- The grant stays (the app calls these RPCs), but the function body
-- now refuses everyone except a profile holding the reviews-scope
-- unlock — the existing is_instructor() mechanism.
-- ============================================================

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
  if not is_instructor(auth.uid()) then
    raise exception 'only instructors may award xp';
  end if;

  insert into public.xp_events
    (developer_id, pathway_id, source, xp, label, detail, reference_id)
  values
    (p_developer_id, p_pathway_id, p_source, p_xp, p_label, p_detail, p_reference_id);

  insert into public.pathway_xp (developer_id, pathway_id, xp)
  values (p_developer_id, p_pathway_id, p_xp)
  on conflict (developer_id, pathway_id)
  do update set xp = public.pathway_xp.xp + excluded.xp;

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

create or replace function public.review_submission(
  p_submission_id uuid,
  p_reviewer_id uuid,
  p_status public.submission_status,
  p_awarded_xp integer,
  p_note text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_pathway public.pathway_id;
  v_source public.xp_source;
  v_label text;
begin
  -- Only the instructor may resolve a submission.
  if not is_instructor(auth.uid()) then
    raise exception 'only instructors may review submissions';
  end if;

  select * into v_submission from public.submissions where id = p_submission_id;
  if not found then
    raise exception 'submission % not found', p_submission_id;
  end if;
  if p_status = 'pending' then
    raise exception 'a review must resolve a submission';
  end if;

  update public.submissions
  set status = p_status,
      awarded_xp = case when p_status = 'returned' then null else p_awarded_xp end,
      reviewer_note = p_note,
      reviewer_id = p_reviewer_id,
      reviewed_at = now()
  where id = p_submission_id;

  insert into public.notifications (developer_id, kind, headline, body, xp)
  values (
    v_submission.developer_id,
    'review',
    case when p_status = 'returned' then 'Submission returned'
         else '+' || p_awarded_xp || ' XP' end,
    p_note,
    case when p_status = 'returned' then null else p_awarded_xp end
  );

  -- Award through the engine so XP, pathway XP, activity and the
  -- notification feed all stay in sync. Challenge submissions pay in
  -- the challenge's pathway; topic presentations pay in teacher.
  if p_status in ('approved', 'adjusted') and p_awarded_xp > 0 then
    if v_submission.challenge_id is not null then
      select c.pathway_id, c.title
        into v_pathway, v_label
        from public.challenges c
       where c.id = v_submission.challenge_id;
      v_source := 'challenge';
    else
      select tp.title into v_label
        from public.teaching_proposals tp
       where tp.id = v_submission.topic_id;
      v_pathway := 'teacher';
      v_source := 'teaching';
    end if;

    perform public.award_xp(
      v_submission.developer_id,
      v_pathway,
      v_source,
      p_awarded_xp,
      v_label,
      p_note,
      p_submission_id
    );
  end if;
end;
$$;

-- Grants unchanged from 0001: the RPCs stay callable, the body is
-- now the boundary.
revoke execute on function public.award_xp(uuid, public.pathway_id, public.xp_source, integer, text, text, uuid) from public, anon;
grant execute on function public.award_xp(uuid, public.pathway_id, public.xp_source, integer, text, text, uuid) to authenticated;

revoke execute on function public.review_submission(uuid, uuid, public.submission_status, integer, text) from public, anon;
grant execute on function public.review_submission(uuid, uuid, public.submission_status, integer, text) to authenticated;

-- ============================================================
-- 2. SIGNUP PROVISIONING
--
-- 0001 has no trigger and no insert policy on profiles, so a real
-- signup left the user with no profile and no way to get one. The
-- trigger below provisions the profile as the definer on every signup.
-- The authorized instructor email lives in app_config (set by the
-- operator, never in code); only that account receives the
-- reviews-scope unlock that is_instructor() checks.
-- ============================================================

create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- Tolerate a pre-existing app_config created without a
-- primary key: the seed insert below uses ON CONFLICT,
-- which requires a unique constraint on key.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.app_config'::regclass
      and contype = 'p'
  ) then
    alter table public.app_config add primary key (key);
  end if;
end $$;

insert into public.app_config (key, value)
values ('instructor_email', '')
on conflict (key) do nothing;

-- app_config is operator-only. The app never reads it
-- directly (the server action uses INSTRUCTOR_EMAIL; the
-- signup trigger reads it as the table owner), so lock it
-- down completely — otherwise anyone with the publishable
-- key could read it and, worse, point instructor_email at
-- their own address.
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_handle text;
  v_instructor_email text;
begin
  v_base := lower(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'handle', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'developer'
    )
  );

  -- handle is unique; disambiguate on the new user's uuid rather than
  -- failing the signup, because losing an account to a name clash is
  -- far worse.
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

  -- The reviews-scope unlock is the existing instructor mechanism.
  -- Only the email in app_config gets it. Nothing here is client
  -- controlled: raw_user_meta_data is never trusted.
  select value into v_instructor_email
    from public.app_config
   where key = 'instructor_email';

  if v_instructor_email is not null
     and v_instructor_email <> ''
     and lower(new.email) = lower(v_instructor_email) then
    insert into public.developer_unlocks (developer_id, unlock_id)
    values (new.id, 'unlock-panelist')
    on conflict (developer_id, unlock_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. CLAIMS — the smallest practical claim mechanism
--
-- 0001 has no way to record "I am taking responsibility for this
-- problem/topic". This table records the claim; submissions and
-- presentations still carry the evidence. Non-exclusive by design:
-- claiming marks responsibility, it does not lock others out.
-- ============================================================

create table if not exists public.activity_claims (
  kind text not null check (kind in ('challenge', 'topic')),
  activity_id uuid not null,
  developer_id uuid not null references public.profiles (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (kind, activity_id, developer_id)
);

create index if not exists activity_claims_lookup_idx
  on public.activity_claims (kind, activity_id);

alter table public.activity_claims enable row level security;

create policy "claims are readable"
  on public.activity_claims for select using (true);

create policy "claim your own activity"
  on public.activity_claims for insert
  with check (auth.uid() = developer_id);

create policy "unclaim your own activity"
  on public.activity_claims for delete
  using (auth.uid() = developer_id);

-- ============================================================
-- 4. TOPIC PRESENTATIONS
--
-- Developers present claimed topics. The review artifact is a
-- submission, so the existing review queue and review_submission()
-- handle it. submissions gains a nullable topic_id; every row must
-- point at exactly one target.
-- ============================================================

alter table public.submissions
  add column if not exists topic_id uuid
    references public.teaching_proposals (id) on delete cascade;

alter table public.submissions alter column challenge_id drop not null;

alter table public.submissions drop constraint if exists submissions_target_check;
alter table public.submissions add constraint submissions_target_check
  check (
    (challenge_id is not null and topic_id is null) or
    (challenge_id is null and topic_id is not null)
  );

-- ============================================================
-- 5. OPPORTUNITY SUBMISSIONS
--
-- Developers submit opportunities for the instructor to verify. The
-- table gains an author and a review state; the author is set by the
-- server action from the session, never from the form.
-- ============================================================

alter table public.opportunities
  add column if not exists submitted_by uuid
    references public.profiles (id) on delete set null;

alter table public.opportunities
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected'));

alter table public.opportunities
  add column if not exists review_note text;

alter table public.opportunities
  add column if not exists reviewed_by uuid
    references public.profiles (id) on delete set null;

alter table public.opportunities
  add column if not exists reviewed_at timestamptz;

create policy "developers submit opportunities"
  on public.opportunities for insert
  with check (auth.uid() = submitted_by and review_status = 'pending');

create policy "instructors verify opportunities"
  on public.opportunities for update
  using (is_instructor(auth.uid()))
  with check (is_instructor(auth.uid()));

-- ============================================================
-- 6. BACKFILL (idempotent — safe to re-run)
--
-- The trigger above only fires on NEW signups. Accounts that
-- already exist when this migration is applied (early test
-- accounts, or an instructor created in the dashboard before
-- this migration) would otherwise never receive a profile.
-- ============================================================

insert into public.profiles (id, handle, full_name)
with missing as (
  select u.id, u.email, u.raw_user_meta_data
  from auth.users u
  where not exists (select 1 from public.profiles p where p.id = u.id)
), numbered as (
  select
    id,
    email,
    raw_user_meta_data,
    row_number() over (
      partition by lower(coalesce(split_part(email, '@', 1), 'developer'))
    ) as rn
  from missing
)
select
  id,
  lower(coalesce(split_part(email, '@', 1), 'developer'))
    || case
         when rn > 1
           or exists (
             select 1 from public.profiles p
             where p.handle =
               lower(coalesce(split_part(email, '@', 1), 'developer'))
           )
           then '-' || substr(replace(id::text, '-', ''), 1, 6)
         else ''
       end,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(email, '@', 1), ''),
    'Developer'
  )
from numbered;

-- Instructor unlock backfill. No-op while app_config.instructor_email
-- is still empty. After the operator sets the email (deployment
-- step 2 below), run this statement once more to cover an
-- instructor account that was created BEFORE the migration:
--
-- insert into public.developer_unlocks (developer_id, unlock_id)
-- select u.id, 'unlock-panelist'
-- from auth.users u
-- where lower(u.email) = lower(
--   (select value from public.app_config where key = 'instructor_email')
-- )
-- on conflict (developer_id, unlock_id) do nothing;

commit;

-- Expected after apply:
--   award_xp / review_submission raise for non-instructors
--   profiles appear automatically on signup
--   activity_claims, submissions.topic_id, opportunities.review_status
select 'app_config' as table_name, count(*) from public.app_config
union all select 'activity_claims', count(*) from public.activity_claims;

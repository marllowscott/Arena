-- Dev Arena · initial schema
-- Apply with: supabase db push   (or paste into the SQL editor)
--
-- Design rule: the browser holds a public key, so RLS is the only boundary.
-- No authenticated role may UPDATE an xp column. XP is awarded exclusively by
-- the `award_xp` function below, which is `security definer` and revoked from anon.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enum types

create type public.pathway_id as enum (
  'builder',
  'problem-solver',
  'teacher',
  'mentor',
  'scout'
);

create type public.difficulty as enum (
  'starter',
  'builder',
  'advanced',
  'expert',
  'boss'
);

create type public.submission_status as enum (
  'pending',
  'approved',
  'adjusted',
  'returned'
);

create type public.xp_source as enum (
  'challenge',
  'help',
  'teaching',
  'scout'
);

-- ------------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  full_name text not null,
  headline text not null default '',
  primary_pathway public.pathway_id not null default 'builder',
  -- Read-only from the client. See the grants at the bottom of this file.
  total_xp integer not null default 0 check (total_xp >= 0),
  weekly_xp integer not null default 0 check (weekly_xp >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  focus text not null default '',
  skills text[] not null default '{}',
  avatar_from text not null default '#241B12',
  avatar_to text not null default '#97A87A',
  weekly_movement integer not null default 0,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

comment on column public.profiles.total_xp is
  'Server-owned. Awarded only through award_xp(). Never writable by anon or authenticated.';

-- ----------------------------------------------------------------- pathways

create table public.pathways (
  id public.pathway_id primary key,
  name text not null,
  short_name text not null,
  tagline text not null,
  description text not null,
  icon text not null,
  sort_order integer not null default 0,
  promise text not null
);

create table public.titles (
  id text primary key,
  pathway_id public.pathway_id not null references public.pathways (id) on delete cascade,
  name text not null,
  tier integer not null check (tier >= 1),
  xp_required integer not null check (xp_required >= 0),
  motto text not null,
  requires_confirmation boolean not null default false,
  unique (pathway_id, tier)
);

-- -------------------------------------------------------------- challenges

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  codename text not null,
  summary text not null,
  pathway_id public.pathway_id not null references public.pathways (id),
  difficulty public.difficulty not null,
  xp integer not null check (xp > 0),
  estimated_effort text not null,
  deadline timestamptz,
  status text not null default 'open'
    check (status in ('open', 'locked', 'closed', 'draft')),
  tags text[] not null default '{}',
  mission text not null,
  why_it_matters text not null default '',
  requirements text[] not null default '{}',
  evidence text[] not null default '{}',
  explain_prompt text not null default '',
  broke_prompt text not null default '',
  rubric jsonb not null default '[]',
  completions integer not null default 0,
  recommendation_reason text not null default '',
  recommended boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- submissions

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  developer_id uuid not null references public.profiles (id) on delete cascade,
  status public.submission_status not null default 'pending',
  solution text not null,
  evidence text[] not null default '{}',
  explain_it text not null,
  what_broke text not null default '',
  how_fixed text not null default '',
  suggested_xp integer not null default 0,
  awarded_xp integer,
  reviewer_note text,
  rubric jsonb not null default '[]',
  reviewer_id uuid references public.profiles (id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index submissions_developer_idx on public.submissions (developer_id, submitted_at desc);
create index submissions_pending_idx on public.submissions (submitted_at)
  where status = 'pending';

-- ---------------------------------------------------------------- xp_events

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  pathway_id public.pathway_id not null,
  source public.xp_source not null,
  xp integer not null check (xp <> 0),
  label text not null,
  detail text not null default '',
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index xp_events_developer_idx on public.xp_events (developer_id, created_at desc);

-- Pathway XP is derived, not stored, so it can never drift from xp_events.
create view public.pathway_xp as
  select developer_id, pathway_id, sum(xp)::integer as xp
  from public.xp_events
  group by developer_id, pathway_id;

-- -------------------------------------------------------- pathway_xp_awards
-- Server-owned audit trail. Updated by award_xp() only.

create table public.pathway_xp (
  developer_id uuid not null references public.profiles (id) on delete cascade,
  pathway_id public.pathway_id not null,
  xp integer not null default 0 check (xp >= 0),
  primary key (developer_id, pathway_id)
);

-- ------------------------------------------------------------- help_requests

create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'solved', 'flagged')),
  pathway_id public.pathway_id,
  confirmed_answer_id uuid,
  created_at timestamptz not null default now()
);

create table public.help_answers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.help_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  confirmed boolean not null default false,
  helpful_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------- teaching_proposals

create table public.teaching_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pathway_id public.pathway_id not null,
  proposed_by uuid not null references public.profiles (id) on delete cascade,
  summary text not null,
  outcomes text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'scheduled', 'delivered')),
  session_date timestamptz,
  xp_reward integer not null default 60,
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles (id)
);

create table public.proposal_votes (
  proposal_id uuid not null references public.teaching_proposals (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (proposal_id, voter_id)
);

-- ------------------------------------------------------------ opportunities

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  role text not null,
  summary text not null,
  type text not null,
  location text not null default '',
  skills text[] not null default '{}',
  technologies text[] not null default '{}',
  apply_url text not null default '',
  closes_at timestamptz,
  verification text not null default 'unverified'
    check (verification in ('unverified', 'verified', 'expired')),
  stage text not null default 'discover'
    check (stage in ('discover', 'verify', 'research', 'explain', 'share', 'act')),
  stage_progress real not null default 0 check (stage_progress between 0 and 1),
  xp_reward integer not null default 0,
  shares integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------- notifications/achievements

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  headline text not null,
  body text not null default '',
  xp integer,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_developer_idx on public.notifications (developer_id, created_at desc);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  detail text not null default '',
  xp integer not null default 0,
  icon text not null default 'trophy',
  reference_id text,
  earned_at timestamptz not null default now()
);

create table public.unlocks (
  id text primary key,
  title text not null,
  description text not null,
  scope text not null,
  requirements text[] not null default '{}'
);

create table public.developer_unlocks (
  developer_id uuid not null references public.profiles (id) on delete cascade,
  unlock_id text not null references public.unlocks (id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (developer_id, unlock_id)
);

-- ------------------------------------------------------------------ activity

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  message text not null,
  xp integer,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index activity_events_recent_idx on public.activity_events (created_at desc);

-- =========================================================== XP award engine
-- The only path that may change XP. `security definer` so it can write the
-- server-owned columns that RLS protects.

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

-- The anon role is what the browser holds. It must not be able to award XP.
revoke execute on function public.award_xp(uuid, public.pathway_id, public.xp_source, integer, text, text, uuid) from public, anon;
grant execute on function public.award_xp(uuid, public.pathway_id, public.xp_source, integer, text, text, uuid) to authenticated;

-- Award XP for an approved submission, and notify the developer.
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
  v_xp integer;
begin
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
    case when p_status = 'returned' then 'Problem returned'
         else '+' || p_awarded_xp || ' XP' end,
    p_note,
    case when p_status = 'returned' then null else p_awarded_xp end
  );

  if p_status in ('approved', 'adjusted') and p_awarded_xp > 0 then
    select pathway_id into v_pathway from public.challenges where id = v_submission.challenge_id;
    perform public.award_xp(
      v_submission.developer_id,
      v_pathway,
      'challenge',
      p_awarded_xp,
      (select title from public.challenges where id = v_submission.challenge_id),
      p_note,
      p_submission_id
    );
  end if;
end;
$$;

revoke execute on function public.review_submission(uuid, uuid, public.submission_status, integer, text) from public, anon;
grant execute on function public.review_submission(uuid, uuid, public.submission_status, integer, text) to authenticated;

-- ============================================================ instructor role
-- Defined before the policies that reference it. A profile row holding a
-- `reviews`-scoped unlock is an instructor. Reads no secret and grants nothing
-- by itself.

create or replace function public.is_instructor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.developer_unlocks du
    join public.unlocks u on u.id = du.unlock_id
    where du.developer_id = p_user_id
      and u.scope = 'reviews'
  );
$$;

grant execute on function public.is_instructor(uuid) to anon, authenticated;

-- ==================================================================== RLS
-- Enable everywhere first, then open the tables role by role. Anything not
-- explicitly granted below stays closed.

alter table public.profiles            enable row level security;
alter table public.pathways            enable row level security;
alter table public.titles              enable row level security;
alter table public.challenges          enable row level security;
alter table public.submissions         enable row level security;
alter table public.xp_events           enable row level security;
alter table public.pathway_xp          enable row level security;
alter table public.help_requests       enable row level security;
alter table public.help_answers        enable row level security;
alter table public.teaching_proposals  enable row level security;
alter table public.proposal_votes      enable row level security;
alter table public.opportunities       enable row level security;
alter table public.notifications       enable row level security;
alter table public.achievements        enable row level security;
alter table public.unlocks             enable row level security;
alter table public.developer_unlocks   enable row level security;
alter table public.activity_events     enable row level security;

-- Reference data: readable by everyone, writable by nobody.
create policy "reference data is public"
  on public.pathways for select using (true);
create policy "reference data is public"
  on public.titles for select using (true);
create policy "reference data is public"
  on public.challenges for select using (true);
create policy "reference data is public"
  on public.unlocks for select using (true);

-- Profiles: everyone can read the roster (the leaderboard needs it), but a
-- developer may only change their own row, and never their XP.
create policy "roster is readable"
  on public.profiles for select using (true);

create policy "update own profile, never xp"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and total_xp = (select total_xp from public.profiles where id = auth.uid())
    and weekly_xp = (select weekly_xp from public.profiles where id = auth.uid())
    and streak_days = (select streak_days from public.profiles where id = auth.uid())
    and weekly_movement = (select weekly_movement from public.profiles where id = auth.uid())
  );

-- XP is append-only and visible to everyone, writable by nobody.
create policy "xp history is readable"
  on public.xp_events for select using (true);

create policy "pathway xp is readable"
  on public.pathway_xp for select using (true);

-- Submissions: owners write their own, only instructors read the queue.
create policy "read own submissions"
  on public.submissions for select
  using (auth.uid() = developer_id or is_instructor(auth.uid()));

create policy "create own submission"
  on public.submissions for insert
  with check (auth.uid() = developer_id);

create policy "instructors read all submissions"
  on public.submissions for select
  using (is_instructor(auth.uid()));

-- Help: anyone may ask, anyone may answer, the asker confirms their own.
create policy "help is readable"
  on public.help_requests for select using (true);
create policy "ask for help"
  on public.help_requests for insert with check (auth.uid() = developer_id);

create policy "answers are readable"
  on public.help_answers for select using (true);
create policy "write own answer"
  on public.help_answers for insert with check (auth.uid() = author_id);

-- Topics: readable, anyone may propose, nobody may edit someone else's.
create policy "topics are readable"
  on public.teaching_proposals for select using (true);
create policy "propose own topic"
  on public.teaching_proposals for insert with check (auth.uid() = proposed_by);
create policy "instructors manage topics"
  on public.teaching_proposals for update using (is_instructor(auth.uid()));

create policy "votes are readable"
  on public.proposal_votes for select using (true);
create policy "vote once"
  on public.proposal_votes for insert with check (auth.uid() = voter_id);
create policy "retract own vote"
  on public.proposal_votes for delete using (auth.uid() = voter_id);

-- Opportunities: readable, and advanced through the server, not the browser.
create policy "opportunities are readable"
  on public.opportunities for select using (true);

-- Personal streams.
create policy "read own notifications"
  on public.notifications for select using (auth.uid() = developer_id);
create policy "read own notifications"
  on public.notifications for update using (auth.uid() = developer_id);

create policy "read own achievements"
  on public.achievements for select using (auth.uid() = developer_id);

create policy "read own unlocks"
  on public.developer_unlocks for select using (auth.uid() = developer_id);

create policy "activity is readable"
  on public.activity_events for select using (true);

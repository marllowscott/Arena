-- Dev Shop: lifetime XP milestones unlock spendable learning rewards.
-- Points are derived from total_xp (100 XP = 1 point); XP is never spent.

begin;

create table public.dev_shop_rewards (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  details text not null,
  points_cost integer not null check (points_cost > 0),
  active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.dev_shop_rewards
  (id, name, category, description, details, points_cost, sort_order)
values
  (
    'workflow-handout',
    'Workflow handout',
    'Learning resource',
    'Request a focused workflow guide or practical handout.',
    'Tell the instructor what workflow or topic you want help with. They will share a suitable resource.',
    1,
    1
  ),
  (
    'group-deep-dive',
    'Instructor group deep-dive',
    'Group session',
    'Request a place in a focused, instructor-led group session.',
    'Share the topic you want to explore. The instructor will coordinate a session and confirm its time.',
    4,
    2
  ),
  (
    'one-to-one-deep-dive',
    'One-to-one deep-dive',
    'Individual session',
    'Request a focused deep-dive session with the instructor.',
    'Share your topic and availability. The instructor will review the request and coordinate a time.',
    8,
    3
  )
on conflict (id) do nothing;

create table public.dev_shop_redemptions (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles (id) on delete cascade,
  reward_id text not null references public.dev_shop_rewards (id),
  reward_name text not null,
  points_cost integer not null check (points_cost > 0),
  request_note text not null default '',
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'fulfilled', 'declined')),
  instructor_note text not null default '',
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dev_shop_redemptions_developer_idx
  on public.dev_shop_redemptions (developer_id, created_at desc);
create index dev_shop_redemptions_status_idx
  on public.dev_shop_redemptions (status, created_at);

alter table public.dev_shop_rewards enable row level security;
alter table public.dev_shop_redemptions enable row level security;

revoke all on public.dev_shop_rewards from anon, authenticated;
grant select on public.dev_shop_rewards to authenticated;
create policy "developers view active shop rewards"
  on public.dev_shop_rewards for select to authenticated
  using (active or is_instructor(auth.uid()));

revoke all on public.dev_shop_redemptions from anon, authenticated;
grant select on public.dev_shop_redemptions to authenticated;
create policy "developers and instructors view shop requests"
  on public.dev_shop_redemptions for select to authenticated
  using (developer_id = auth.uid() or is_instructor(auth.uid()));

create or replace function public.request_dev_shop_reward(
  p_reward_id text,
  p_request_note text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_reward public.dev_shop_rewards%rowtype;
  v_earned_points integer;
  v_spent_points integer;
  v_redemption_id uuid;
  v_note text := trim(coalesce(p_request_note, ''));
begin
  if auth.uid() is null then
    raise exception 'sign in before requesting a reward';
  end if;
  if is_instructor(auth.uid()) then
    raise exception 'only developers can request shop rewards';
  end if;
  if length(v_note) > 1000 then
    raise exception 'request notes must be 1000 characters or fewer';
  end if;

  -- Serializes requests for this developer so simultaneous requests cannot
  -- spend the same points twice.
  select * into v_profile
    from public.profiles
   where id = auth.uid()
   for update;
  if not found then
    raise exception 'developer profile not found';
  end if;

  select * into v_reward
    from public.dev_shop_rewards
   where id = p_reward_id and active
   for share;
  if not found then
    raise exception 'this reward is not currently available';
  end if;

  v_earned_points := floor(v_profile.total_xp::numeric / 100)::integer;
  select coalesce(sum(points_cost), 0)::integer into v_spent_points
    from public.dev_shop_redemptions
   where developer_id = auth.uid()
     and status <> 'declined';

  if v_earned_points - v_spent_points < v_reward.points_cost then
    raise exception 'not enough Dev Points for this reward';
  end if;

  insert into public.dev_shop_redemptions
    (developer_id, reward_id, reward_name, points_cost, request_note)
  values
    (auth.uid(), v_reward.id, v_reward.name, v_reward.points_cost, v_note)
  returning id into v_redemption_id;

  return v_redemption_id;
end;
$$;

create or replace function public.review_dev_shop_redemption(
  p_redemption_id uuid,
  p_status text,
  p_instructor_note text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.dev_shop_redemptions%rowtype;
begin
  if not is_instructor(auth.uid()) then
    raise exception 'only instructors may review shop requests';
  end if;
  if p_status not in ('approved', 'fulfilled', 'declined') then
    raise exception 'invalid shop request status';
  end if;
  if length(trim(coalesce(p_instructor_note, ''))) > 1000 then
    raise exception 'instructor notes must be 1000 characters or fewer';
  end if;

  select * into v_redemption
    from public.dev_shop_redemptions
   where id = p_redemption_id
   for update;
  if not found then
    raise exception 'shop request not found';
  end if;

  if not (
    (v_redemption.status = 'requested' and p_status in ('approved', 'declined'))
    or (v_redemption.status = 'approved' and p_status in ('fulfilled', 'declined'))
  ) then
    raise exception 'this shop request has already been resolved';
  end if;

  update public.dev_shop_redemptions
     set status = p_status,
         instructor_note = trim(coalesce(p_instructor_note, '')),
         reviewed_by = auth.uid(),
         updated_at = now()
   where id = p_redemption_id;
end;
$$;

revoke execute on function public.request_dev_shop_reward(text, text) from public, anon;
grant execute on function public.request_dev_shop_reward(text, text) to authenticated;
revoke execute on function public.review_dev_shop_redemption(uuid, text, text) from public, anon;
grant execute on function public.review_dev_shop_redemption(uuid, text, text) to authenticated;

commit;

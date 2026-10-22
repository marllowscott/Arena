-- Add safe topic lifecycle controls and make review decisions atomic.

begin;

alter table public.teaching_proposals
  drop constraint if exists teaching_proposals_status_check;

alter table public.teaching_proposals
  add constraint teaching_proposals_status_check
  check (status in ('draft', 'open', 'scheduled', 'delivered', 'archived'));

update public.teaching_proposals t
   set status = 'draft'
  from public.profiles p
 where p.id = t.proposed_by
   and p.role = 'developer'
   and t.status = 'open'
   and t.reviewed_by is null;

drop policy if exists "reference data is public" on public.challenges;

-- 0012 owns the policy name "published challenges are readable" and ships the
-- stricter version that hides a challenge once another developer has claimed
-- it. Postgres OR-combines permissive select policies, so re-creating the
-- plain draft-only rule here would quietly widen visibility again on a
-- database that already ran 0012. The rule below is therefore only created
-- when it is missing: a fresh database still gets a working policy, and a
-- migrated one keeps 0012's stricter rule.
do $$
begin
  if not exists (
    select 1
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'challenges'
       and p.polname = 'published challenges are readable'
  ) then
    create policy "published challenges are readable"
      on public.challenges for select
      using (status <> 'draft' or public.is_instructor(auth.uid()));
  end if;
end;
$$;

drop policy if exists "help is readable" on public.help_requests;
drop policy if exists "visible probes are readable" on public.help_requests;
create policy "visible probes are readable"
  on public.help_requests for select
  using (
    not flagged
    or developer_id = auth.uid()
    or accepted_by = auth.uid()
    or public.is_instructor(auth.uid())
  );

drop policy if exists "answers are readable" on public.help_answers;
drop policy if exists "visible probe answers are readable" on public.help_answers;
create policy "visible probe answers are readable"
  on public.help_answers for select
  using (
    exists (
      select 1
        from public.help_requests h
       where h.id = request_id
         and (
           not h.flagged
           or h.developer_id = auth.uid()
           or h.accepted_by = auth.uid()
           or public.is_instructor(auth.uid())
         )
    )
  );

drop policy if exists "ask for help" on public.help_requests;
create policy "ask for help"
  on public.help_requests for insert
  with check (
    auth.uid() = developer_id
    and status = 'open'
    and accepted_by is null
    and confirmed_answer_id is null
    and flagged = false
    and flag_reason is null
  );

drop policy if exists "write own answer" on public.help_answers;
drop policy if exists "write own accepted probe answer" on public.help_answers;
create policy "write own accepted probe answer"
  on public.help_answers for insert
  with check (
    auth.uid() = author_id
    and confirmed = false
    and helpful_count = 0
    and exists (
      select 1
        from public.help_requests h
       where h.id = request_id
         and (h.developer_id = auth.uid() or h.accepted_by = auth.uid())
    )
  );

grant insert, update, delete on public.teaching_proposals to authenticated;

drop policy if exists "topics are readable" on public.teaching_proposals;
drop policy if exists "published topics are readable" on public.teaching_proposals;
create policy "published topics are readable"
  on public.teaching_proposals for select
  using (
    status not in ('draft', 'archived')
    or public.is_instructor(auth.uid())
  );

drop policy if exists "propose own topic" on public.teaching_proposals;
drop policy if exists "developers propose unpublished topics" on public.teaching_proposals;
create policy "developers propose unpublished topics"
  on public.teaching_proposals for insert
  with check (
    auth.uid() = proposed_by
    and (
      (public.is_instructor(auth.uid()))
      or (not public.is_instructor(auth.uid()) and status = 'draft')
    )
  );

drop policy if exists "instructors manage topics" on public.teaching_proposals;
create policy "instructors manage topics"
  on public.teaching_proposals for update
  using (public.is_instructor(auth.uid()))
  with check (public.is_instructor(auth.uid()));

drop policy if exists "claim your own activity" on public.activity_claims;
drop policy if exists "claim your own published activity" on public.activity_claims;
create policy "claim your own published activity"
  on public.activity_claims for insert
  with check (
    auth.uid() = developer_id
    and not public.is_instructor(auth.uid())
    and (
      (
        kind = 'challenge'
        and exists (
          select 1 from public.challenges c
           where c.id = activity_id
             and c.status = 'open'
        )
      )
      or (
        kind = 'topic'
        and exists (
          select 1 from public.teaching_proposals t
           where t.id = activity_id
             and t.status in ('open', 'scheduled', 'delivered')
        )
      )
    )
  );

drop policy if exists "create own submission" on public.submissions;
drop policy if exists "submit own claimed published work" on public.submissions;
create policy "submit own claimed published work"
  on public.submissions for insert
  with check (
    auth.uid() = developer_id
    and not public.is_instructor(auth.uid())
    and status = 'pending'
    and awarded_xp is null
    and reviewer_id is null
    and reviewed_at is null
    and (
      (
        challenge_id is not null
        and exists (
          select 1 from public.challenges c
           where c.id = challenge_id
             and c.status = 'open'
             and c.xp = suggested_xp
        )
        and exists (
          select 1 from public.activity_claims ac
           where ac.kind = 'challenge'
             and ac.activity_id = challenge_id
             and ac.developer_id = auth.uid()
        )
      )
      or (
        topic_id is not null
        and exists (
          select 1 from public.teaching_proposals t
           where t.id = topic_id
             and t.status in ('open', 'scheduled', 'delivered')
             and t.xp_reward = suggested_xp
        )
        and exists (
          select 1 from public.activity_claims ac
           where ac.kind = 'topic'
             and ac.activity_id = topic_id
             and ac.developer_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "instructors delete topics" on public.teaching_proposals;
create policy "instructors delete topics"
  on public.teaching_proposals for delete
  using (public.is_instructor(auth.uid()));

create or replace function public.prevent_topic_delete_with_submissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.submissions
    where topic_id = old.id
  ) then
    raise exception 'This topic has submissions and cannot be deleted. Archive it instead.';
  end if;

  delete from public.activity_claims
   where kind = 'topic'
     and activity_id = old.id;

  return old;
end;
$$;

revoke execute on function public.prevent_topic_delete_with_submissions()
  from public, anon, authenticated;

drop trigger if exists prevent_topic_delete_with_submissions
  on public.teaching_proposals;
create trigger prevent_topic_delete_with_submissions
  before delete on public.teaching_proposals
  for each row
  execute function public.prevent_topic_delete_with_submissions();

drop policy if exists "instructors verify opportunities" on public.opportunities;
revoke update on public.opportunities from public, anon, authenticated;

alter table public.opportunities
  add column if not exists listing_state text not null default 'published';
alter table public.opportunities
  drop constraint if exists opportunities_listing_state_check;
alter table public.opportunities
  add constraint opportunities_listing_state_check
  check (listing_state in ('draft', 'published', 'archived'));

grant insert, update, delete on public.opportunities to authenticated;

drop policy if exists "opportunities are readable" on public.opportunities;
drop policy if exists "visible opportunities are readable" on public.opportunities;
create policy "visible opportunities are readable"
  on public.opportunities for select
  using (
    (
      (
        (submitted_by is null and listing_state = 'published')
        or (submitted_by is not null and review_status = 'approved')
      )
      and verification <> 'expired'
      and (closes_at is null or closes_at > now())
    )
    or submitted_by = auth.uid()
    or public.is_instructor(auth.uid())
  );

drop policy if exists "developers submit opportunities" on public.opportunities;
create policy "developers submit opportunities"
  on public.opportunities for insert
  with check (
    auth.uid() = submitted_by
    and not public.is_instructor(auth.uid())
    and review_status = 'pending'
    and verification = 'unverified'
    and xp_reward = 0
    and reviewed_by is null
    and reviewed_at is null
  );

drop policy if exists "instructors manage curated opportunities" on public.opportunities;
create policy "instructors manage curated opportunities"
  on public.opportunities for all
  to authenticated
  using (
    public.is_instructor(auth.uid())
    and submitted_by is null
  )
  with check (
    public.is_instructor(auth.uid())
    and submitted_by is null
    and review_status = 'approved'
    and verification = 'verified'
    and xp_reward = 0
  );

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
  v_note text := trim(coalesce(p_note, ''));
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may review submissions';
  end if;
  if p_status is null or p_status = 'pending' then
    raise exception 'a review must resolve a submission';
  end if;
  if p_awarded_xp is null or p_awarded_xp < 0 or p_awarded_xp > 1000 then
    raise exception 'awarded XP must be between 0 and 1000';
  end if;
  if p_status in ('approved', 'adjusted') and p_awarded_xp = 0 then
    raise exception 'approval must award at least 1 XP';
  end if;
  if p_status = 'returned' and p_awarded_xp <> 0 then
    raise exception 'returned submissions cannot award XP';
  end if;
  if length(v_note) > 1000 then
    raise exception 'review notes must be 1000 characters or fewer';
  end if;

  select *
    into v_submission
    from public.submissions
   where id = p_submission_id
   for update;
  if not found then
    raise exception 'submission % not found', p_submission_id;
  end if;
  if v_submission.status <> 'pending' then
    raise exception 'this submission has already been reviewed';
  end if;

  update public.submissions
     set status = p_status,
         awarded_xp = case when p_status = 'returned' then null else p_awarded_xp end,
         reviewer_note = v_note,
         reviewer_id = auth.uid(),
         reviewed_at = now()
   where id = p_submission_id;

  insert into public.notifications (developer_id, kind, headline, body, xp)
  values (
    v_submission.developer_id,
    'review',
    case when p_status = 'returned' then 'Submission returned'
         else '+' || p_awarded_xp || ' XP' end,
    v_note,
    case when p_status = 'returned' then null else p_awarded_xp end
  );

  if p_status in ('approved', 'adjusted') then
    if v_submission.challenge_id is not null then
      select c.pathway_id, c.title
        into v_pathway, v_label
        from public.challenges c
       where c.id = v_submission.challenge_id;
      v_source := 'challenge';
    else
      select tp.title
        into v_label
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
      v_note,
      p_submission_id
    );
  end if;
end;
$$;

revoke execute on function public.review_submission(
  uuid, uuid, public.submission_status, integer, text
) from public, anon;
grant execute on function public.review_submission(
  uuid, uuid, public.submission_status, integer, text
) to authenticated;

create or replace function public.review_opportunity(
  p_opportunity_id uuid,
  p_decision text,
  p_awarded_xp integer,
  p_note text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opportunity public.opportunities%rowtype;
  v_note text := trim(coalesce(p_note, ''));
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may review opportunities';
  end if;
  if p_decision is null or p_decision not in ('approve', 'reject') then
    raise exception 'invalid opportunity decision';
  end if;
  if p_awarded_xp is null or p_awarded_xp < 0 or p_awarded_xp > 500 then
    raise exception 'opportunity XP must be between 0 and 500';
  end if;
  if p_decision = 'reject' and p_awarded_xp <> 0 then
    raise exception 'rejected opportunities cannot award XP';
  end if;
  if length(v_note) > 1000 then
    raise exception 'review notes must be 1000 characters or fewer';
  end if;

  select *
    into v_opportunity
    from public.opportunities
   where id = p_opportunity_id
   for update;
  if not found then
    raise exception 'submitted opportunity not found';
  end if;
  if v_opportunity.submitted_by is null
     or public.is_instructor(v_opportunity.submitted_by) then
    raise exception 'only developer-submitted opportunities can be reviewed';
  end if;
  if v_opportunity.review_status <> 'pending' then
    raise exception 'this opportunity has already been reviewed';
  end if;

  update public.opportunities
     set review_status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
         verification = case when p_decision = 'approve' then 'verified' else 'unverified' end,
         xp_reward = case when p_decision = 'approve' then p_awarded_xp else 0 end,
         review_note = v_note,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_opportunity_id;

  if p_decision = 'approve' and p_awarded_xp > 0 then
    perform public.award_xp(
      v_opportunity.submitted_by,
      'scout',
      'scout',
      p_awarded_xp,
      'Opportunity verified',
      coalesce(nullif(v_note, ''), 'Your opportunity submission was verified.'),
      p_opportunity_id
    );
  end if;
end;
$$;

revoke execute on function public.review_opportunity(uuid, text, integer, text)
  from public, anon;
grant execute on function public.review_opportunity(uuid, text, integer, text)
  to authenticated;

commit;

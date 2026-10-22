-- Allow instructors to manage student-submitted work without bypassing the
-- review RPC for XP awards. Removing a submission never reverses an award
-- already recorded in xp_events.

begin;

create or replace function public.cleanup_challenge_claims_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.activity_claims
   where kind = 'challenge'
     and activity_id = old.id;
  return old;
end;
$$;

revoke execute on function public.cleanup_challenge_claims_before_delete()
  from public, anon, authenticated;

drop trigger if exists prevent_challenge_delete_with_submissions
  on public.challenges;
create trigger cleanup_challenge_claims_before_delete
  before delete on public.challenges
  for each row
  execute function public.cleanup_challenge_claims_before_delete();

create or replace function public.cleanup_topic_claims_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.activity_claims
   where kind = 'topic'
     and activity_id = old.id;
  return old;
end;
$$;

revoke execute on function public.cleanup_topic_claims_before_delete()
  from public, anon, authenticated;

drop trigger if exists prevent_topic_delete_with_submissions
  on public.teaching_proposals;
create trigger cleanup_topic_claims_before_delete
  before delete on public.teaching_proposals
  for each row
  execute function public.cleanup_topic_claims_before_delete();

create or replace function public.instructor_update_submission(
  p_submission_id uuid,
  p_solution text,
  p_evidence text[],
  p_explain_it text,
  p_what_broke text,
  p_how_fixed text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may edit submissions';
  end if;
  if p_solution is null or length(p_solution) > 20000
     or p_explain_it is null or length(p_explain_it) > 10000
     or length(coalesce(p_what_broke, '')) > 10000
     or length(coalesce(p_how_fixed, '')) > 10000
     or coalesce(cardinality(p_evidence), 0) > 20 then
    raise exception 'submission content exceeds the allowed limits';
  end if;
  if exists (
    select 1
      from unnest(coalesce(p_evidence, '{}'::text[])) as evidence_item(value)
     where length(value) > 2000
  ) then
    raise exception 'each evidence item must be 2000 characters or fewer';
  end if;

  update public.submissions
     set solution = p_solution,
         evidence = coalesce(p_evidence, '{}'::text[]),
         explain_it = p_explain_it,
         what_broke = coalesce(p_what_broke, ''),
         how_fixed = coalesce(p_how_fixed, '')
   where id = p_submission_id;

  if not found then
    raise exception 'submission not found';
  end if;
end;
$$;

create or replace function public.instructor_delete_submission(
  p_submission_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may delete submissions';
  end if;

  delete from public.submissions
   where id = p_submission_id;

  if not found then
    raise exception 'submission not found';
  end if;
end;
$$;

create or replace function public.instructor_update_student_opportunity(
  p_opportunity_id uuid,
  p_organisation text,
  p_role text,
  p_summary text,
  p_type text,
  p_location text,
  p_apply_url text,
  p_closes_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may edit submitted opportunities';
  end if;
  if p_organisation is null or length(p_organisation) = 0 or length(p_organisation) > 160
     or p_role is null or length(p_role) = 0 or length(p_role) > 200
     or p_summary is null or length(p_summary) > 5000
     or p_type is null or length(p_type) = 0 or length(p_type) > 80
     or length(coalesce(p_location, '')) > 160
     or length(coalesce(p_apply_url, '')) > 2000 then
    raise exception 'opportunity fields exceed the allowed limits';
  end if;
  if coalesce(p_apply_url, '') <> ''
     and p_apply_url !~* '^https?://' then
    raise exception 'application link must use http or https';
  end if;

  update public.opportunities
     set organisation = p_organisation,
         role = p_role,
         summary = p_summary,
         type = p_type,
         location = coalesce(p_location, ''),
         apply_url = coalesce(p_apply_url, ''),
         closes_at = p_closes_at
   where id = p_opportunity_id
     and submitted_by is not null;

  if not found then
    raise exception 'student-submitted opportunity not found';
  end if;
end;
$$;

create or replace function public.instructor_delete_student_opportunity(
  p_opportunity_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may delete submitted opportunities';
  end if;

  delete from public.opportunities
   where id = p_opportunity_id
     and submitted_by is not null;

  if not found then
    raise exception 'student-submitted opportunity not found';
  end if;
end;
$$;

revoke execute on function public.instructor_update_submission(
  uuid, text, text[], text, text, text
) from public, anon;
grant execute on function public.instructor_update_submission(
  uuid, text, text[], text, text, text
) to authenticated;

revoke execute on function public.instructor_delete_submission(uuid)
  from public, anon;
grant execute on function public.instructor_delete_submission(uuid)
  to authenticated;

revoke execute on function public.instructor_update_student_opportunity(
  uuid, text, text, text, text, text, text, timestamptz
) from public, anon;
grant execute on function public.instructor_update_student_opportunity(
  uuid, text, text, text, text, text, text, timestamptz
) to authenticated;

revoke execute on function public.instructor_delete_student_opportunity(uuid)
  from public, anon;
grant execute on function public.instructor_delete_student_opportunity(uuid)
  to authenticated;

commit;

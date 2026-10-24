-- ====================================================================
-- 0016 - Problem reports no longer award XP
--
-- Probes are being repurposed as a developer-facing "report a problem"
-- inbox: a developer writes up an issue they hit, the instructor reads it
-- and decides whether to turn it into an assignment. They are no longer a
-- peer-help flow and must not pay XP.
--
-- confirm_probe_answer keeps its confirmation logic (marking the answer
-- confirmed and solving the report) but no longer writes xp_events,
-- pathway_xp, profiles totals, activity_events or XP notifications.
-- ====================================================================

begin;

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
  v_request public.help_requests;
  v_helper_id uuid;
begin
  if auth.uid() is null or public.is_instructor(auth.uid()) then
    raise exception 'only developers can confirm probe answers';
  end if;

  select *
    into v_request
    from public.help_requests
   where id = p_request_id
   for update;
  if not found then
    raise exception 'probe not found';
  end if;
  if v_request.developer_id <> auth.uid() then
    raise exception 'only the person who asked can confirm an answer';
  end if;
  if v_request.status <> 'open' or v_request.flagged then
    raise exception 'this probe is not available for confirmation';
  end if;
  if v_request.accepted_by is null then
    raise exception 'this probe has no accepted helper';
  end if;

  select author_id
    into v_helper_id
    from public.help_answers
   where id = p_answer_id
     and request_id = p_request_id
     and author_id = v_request.accepted_by
     and not confirmed;
  if not found then
    raise exception 'choose an unconfirmed answer from the accepted helper';
  end if;

  update public.help_answers
     set confirmed = (id = p_answer_id)
   where request_id = p_request_id;

  update public.help_requests
     set confirmed_answer_id = p_answer_id,
         status = 'solved'
   where id = p_request_id
   returning * into v_request;

  -- Problem reports do not award XP. A short notification is still sent so
  -- the helper knows their answer was accepted.
  insert into public.notifications (developer_id, kind, headline, body, href)
  values (
    v_helper_id,
    'help',
    'Answer accepted',
    'The person who reported the problem marked your answer as helpful.',
    '/probe/' || p_request_id::text
  );

  return v_request;
end;
$$;

revoke execute on function public.confirm_probe_answer(uuid, uuid) from public, anon;
grant execute on function public.confirm_probe_answer(uuid, uuid) to authenticated;

commit;

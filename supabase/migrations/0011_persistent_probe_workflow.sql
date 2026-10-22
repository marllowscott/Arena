-- Persist the existing Probe workflow and keep its XP award atomic.

begin;

revoke all on public.help_requests, public.help_answers
  from public, anon, authenticated;
grant select, insert on public.help_requests, public.help_answers to authenticated;
drop policy if exists "asker edits own probe" on public.help_requests;

drop policy if exists "ask for help" on public.help_requests;
drop policy if exists "developers create probes" on public.help_requests;
create policy "developers create probes"
  on public.help_requests for insert
  to authenticated
  with check (
    auth.uid() = developer_id
    and not public.is_instructor(auth.uid())
    and status = 'open'
    and accepted_by is null
    and confirmed_answer_id is null
    and flagged = false
    and flag_reason is null
  );

drop policy if exists "write own accepted probe answer" on public.help_answers;
create policy "write own accepted probe answer"
  on public.help_answers for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and not public.is_instructor(auth.uid())
    and confirmed = false
    and helpful_count = 0
    and exists (
      select 1
        from public.help_requests h
       where h.id = request_id
         and h.accepted_by = auth.uid()
         and h.developer_id <> auth.uid()
         and h.status = 'open'
         and not h.flagged
    )
  );

create or replace function public.enforce_probe_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asker uuid;
  v_helper uuid;
  v_status text;
  v_flagged boolean;
begin
  select developer_id, accepted_by, status, flagged
    into v_asker, v_helper, v_status, v_flagged
    from public.help_requests
   where id = new.request_id
   for update;

  if not found then
    raise exception 'probe not found';
  end if;
  if v_status <> 'open' or v_flagged then
    raise exception 'this probe is not accepting answers';
  end if;
  if v_helper is null or new.author_id <> v_helper or new.author_id = v_asker then
    raise exception 'only the accepted helper can answer this probe';
  end if;

  return new;
end;
$$;

create or replace function public.accept_probe(p_request_id uuid)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated public.help_requests;
begin
  if auth.uid() is null or public.is_instructor(auth.uid()) then
    raise exception 'only developers can accept probes';
  end if;
  if p_request_id is null then
    raise exception 'probe id is required';
  end if;

  update public.help_requests
     set accepted_by = auth.uid(),
         accepted_at = now()
   where id = p_request_id
     and developer_id <> auth.uid()
     and accepted_by is null
     and status = 'open'
     and not flagged
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'this probe is no longer available';
  end if;

  return v_updated;
end;
$$;

create or replace function public.release_probe(p_request_id uuid)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated public.help_requests;
begin
  if auth.uid() is null or public.is_instructor(auth.uid()) then
    raise exception 'only developers can release probes';
  end if;

  update public.help_requests
     set accepted_by = null,
         accepted_at = null
   where id = p_request_id
     and accepted_by = auth.uid()
     and status = 'open'
     and not flagged
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'you are not helping this open probe';
  end if;

  return v_updated;
end;
$$;

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

  insert into public.xp_events
    (developer_id, pathway_id, source, xp, label, detail, reference_id)
  values
    (v_helper_id, 'mentor', 'help', 8, 'Confirmed Probe answer',
     'The person who asked confirmed this answer helped.', p_request_id);

  -- The per-pathway total is materialised only when public.pathway_xp is a
  -- table. On a deployment where it is the derived view over xp_events the
  -- row inserted above is already reflected in it, so the write is skipped.
  if exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'pathway_xp'
       and c.relkind = 'r'
  ) then
    insert into public.pathway_xp (developer_id, pathway_id, xp)
    values (v_helper_id, 'mentor', 8)
    on conflict (developer_id, pathway_id)
    do update set xp = public.pathway_xp.xp + excluded.xp;
  end if;

  update public.profiles
     set total_xp = total_xp + 8,
         weekly_xp = weekly_xp + 8,
         last_active_at = now()
   where id = v_helper_id;
  if not found then
    raise exception 'helper profile not found';
  end if;

  insert into public.activity_events
    (developer_id, kind, message, xp, reference_id)
  values
    (v_helper_id, 'help', 'Answered a Probe confirmed by its author.', 8, p_request_id);

  insert into public.notifications
    (developer_id, kind, headline, body, xp, href)
  values
    (v_helper_id, 'help', '+8 Mentor XP',
     'The person who asked confirmed your Probe answer.', 8,
     '/probe/' || p_request_id::text);

  return v_request;
end;
$$;

create or replace function public.flag_probe(
  p_request_id uuid,
  p_reason text
)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.help_requests;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if auth.uid() is null or public.is_instructor(auth.uid()) then
    raise exception 'only developers can report their probes';
  end if;
  if length(v_reason) < 5 or length(v_reason) > 1000 then
    raise exception 'explain the privacy concern in 5 to 1000 characters';
  end if;

  update public.help_requests
     set flagged = true,
         status = case when status = 'open' then 'flagged' else status end,
         flag_reason = v_reason
   where id = p_request_id
     and (developer_id = auth.uid() or accepted_by = auth.uid())
     and not flagged
  returning * into v_request;

  if v_request.id is null then
    raise exception 'probe not found or already reported';
  end if;

  return v_request;
end;
$$;

create or replace function public.moderate_probe(
  p_request_id uuid,
  p_flagged boolean,
  p_reason text default null
)
returns public.help_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.help_requests;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may moderate probes';
  end if;
  if p_flagged is null then
    raise exception 'moderation state is required';
  end if;
  if p_flagged and (length(v_reason) < 5 or length(v_reason) > 1000) then
    raise exception 'a moderation reason must be 5 to 1000 characters';
  end if;

  update public.help_requests
     set flagged = p_flagged,
         status = case
           when p_flagged and status = 'open' then 'flagged'
           when status = 'flagged' then 'open'
           else status
         end,
         flag_reason = case when p_flagged then v_reason else null end
   where id = p_request_id
  returning * into v_request;

  if v_request.id is null then
    raise exception 'probe not found';
  end if;

  return v_request;
end;
$$;

revoke execute on function public.enforce_probe_ownership() from public, anon, authenticated;
revoke execute on function public.accept_probe(uuid) from public, anon;
revoke execute on function public.release_probe(uuid) from public, anon;
revoke execute on function public.confirm_probe_answer(uuid, uuid) from public, anon;
revoke execute on function public.flag_probe(uuid, text) from public, anon;
revoke execute on function public.moderate_probe(uuid, boolean, text) from public, anon;
grant execute on function public.accept_probe(uuid) to authenticated;
grant execute on function public.release_probe(uuid) to authenticated;
grant execute on function public.confirm_probe_answer(uuid, uuid) to authenticated;
grant execute on function public.flag_probe(uuid, text) to authenticated;
grant execute on function public.moderate_probe(uuid, boolean, text) to authenticated;

commit;

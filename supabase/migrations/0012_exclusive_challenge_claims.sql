begin;

create or replace function public.claim_activity(
  p_kind text,
  p_activity_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if auth.uid() is null or public.is_instructor(auth.uid()) then
    raise exception 'only developers can claim activities';
  end if;

  if p_kind = 'challenge' then
    select status
      into v_status
      from public.challenges
     where id = p_activity_id
     for update;

    if not found or v_status <> 'open' then
      raise exception 'this problem is not currently available to claim';
    end if;

    if exists (
      select 1
        from public.activity_claims
       where kind = p_kind
         and activity_id = p_activity_id
    ) then
      return false;
    end if;
  elsif p_kind = 'topic' then
    select status
      into v_status
      from public.teaching_proposals
     where id = p_activity_id
     for update;

    if not found or v_status not in ('open', 'scheduled', 'delivered') then
      raise exception 'this topic is not currently available to claim';
    end if;

    if exists (
      select 1
        from public.activity_claims
       where kind = p_kind
         and activity_id = p_activity_id
         and developer_id = auth.uid()
    ) then
      return false;
    end if;
  else
    raise exception 'invalid activity type';
  end if;

  insert into public.activity_claims (kind, activity_id, developer_id)
  values (p_kind, p_activity_id, auth.uid());

  return true;
end;
$$;

revoke all on function public.claim_activity(text, uuid)
  from public, anon;
grant execute on function public.claim_activity(text, uuid)
  to authenticated;

revoke insert on public.activity_claims from public, anon, authenticated;

drop policy if exists "published challenges are readable"
  on public.challenges;
create policy "published challenges are readable"
  on public.challenges for select
  using (
    (
      status <> 'draft'
      or public.is_instructor(auth.uid())
    )
    and (
      public.is_instructor(auth.uid())
      or not exists (
        select 1
          from public.activity_claims ac
         where ac.kind = 'challenge'
           and ac.activity_id = id
      )
      or exists (
        select 1
          from public.activity_claims mine
         where mine.kind = 'challenge'
           and mine.activity_id = id
           and mine.developer_id = auth.uid()
           and not exists (
             select 1
               from public.activity_claims earlier
              where earlier.kind = 'challenge'
                and earlier.activity_id = mine.activity_id
                and (
                  earlier.claimed_at < mine.claimed_at
                  or (
                    earlier.claimed_at = mine.claimed_at
                    and earlier.developer_id < mine.developer_id
                  )
                )
           )
      )
    )
  );

commit;

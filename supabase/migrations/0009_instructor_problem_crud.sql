-- Allow instructors to edit and delete problems. A problem with submissions
-- cannot be deleted so the submitted work and review history remain intact.

begin;

grant update, delete on public.challenges to authenticated;

drop policy if exists "instructors update challenges" on public.challenges;
create policy "instructors update challenges"
  on public.challenges for update
  using (public.is_instructor(auth.uid()))
  with check (public.is_instructor(auth.uid()));

drop policy if exists "instructors delete challenges" on public.challenges;
create policy "instructors delete challenges"
  on public.challenges for delete
  using (public.is_instructor(auth.uid()));

create or replace function public.prevent_challenge_delete_with_submissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.submissions
    where challenge_id = old.id
  ) then
    raise exception 'This problem has submissions and cannot be deleted. Close it instead.';
  end if;

  if to_regclass('public.activity_claims') is not null then
    execute
      'delete from public.activity_claims where kind = $1 and activity_id = $2'
      using 'challenge', old.id;
  end if;

  return old;
end;
$$;

revoke execute on function public.prevent_challenge_delete_with_submissions()
  from public, anon, authenticated;

drop trigger if exists prevent_challenge_delete_with_submissions
  on public.challenges;
create trigger prevent_challenge_delete_with_submissions
  before delete on public.challenges
  for each row
  execute function public.prevent_challenge_delete_with_submissions();

commit;

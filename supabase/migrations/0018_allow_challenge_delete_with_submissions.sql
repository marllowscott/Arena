-- ====================================================================
-- 0018 - Remove the submission guard from instructor problem deletion
--
-- Challenge deletion should cascade to submissions. Keep cleanup of the
-- challenge claim records, but do not prevent deletion when submissions exist.
-- ====================================================================

begin;

drop trigger if exists prevent_challenge_delete_with_submissions
  on public.challenges;

drop function if exists public.prevent_challenge_delete_with_submissions();

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

drop trigger if exists cleanup_challenge_claims_before_delete
  on public.challenges;
create trigger cleanup_challenge_claims_before_delete
  before delete on public.challenges
  for each row
  execute function public.cleanup_challenge_claims_before_delete();

commit;

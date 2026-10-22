-- Delete curated opportunity rows through an instructor-checked RPC so the
-- operation does not depend on PostgREST DELETE RETURNING/RLS row visibility.

create or replace function public.instructor_delete_curated_opportunity(
  p_opportunity_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_id uuid;
begin
  if not public.is_instructor(auth.uid()) then
    raise exception 'only instructors may delete curated opportunities';
  end if;

  delete from public.opportunities
   where id = p_opportunity_id
     and submitted_by is null
  returning id into v_deleted_id;

  if v_deleted_id is null then
    raise exception 'curated opportunity not found';
  end if;

  return v_deleted_id;
end;
$$;

revoke execute on function public.instructor_delete_curated_opportunity(uuid)
  from public, anon;
grant execute on function public.instructor_delete_curated_opportunity(uuid)
  to authenticated;

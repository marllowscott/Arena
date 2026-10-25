-- ====================================================================
-- 0017 - Let instructors delete problem reports
--
-- Problem reports (help_requests) accumulate on the instructor side. An
-- instructor can now delete a report once it has been read or acted on,
-- keeping the inbox clean. Deleting a report cascades to its answers.
-- ====================================================================

begin;

grant delete on public.help_requests to authenticated;

drop policy if exists "instructors delete problem reports" on public.help_requests;
create policy "instructors delete problem reports"
  on public.help_requests for delete
  using (public.is_instructor(auth.uid()));

commit;

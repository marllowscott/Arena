-- Let instructors manage Dev Shop rewards while preserving developer read-only
-- access and the redemption history.

begin;

grant insert, update on public.dev_shop_rewards to authenticated;

drop policy if exists "instructors manage shop rewards"
  on public.dev_shop_rewards;

create policy "instructors manage shop rewards"
  on public.dev_shop_rewards
  for all
  to authenticated
  using (public.is_instructor(auth.uid()))
  with check (public.is_instructor(auth.uid()));

commit;

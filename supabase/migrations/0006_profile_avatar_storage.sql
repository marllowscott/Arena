-- Allow developers to upload and manage only their own profile avatar
-- in the existing public PROFILES bucket.

drop policy if exists "Dev Arena users read their own profile avatars"
  on storage.objects;
drop policy if exists "Dev Arena users upload their own profile avatars"
  on storage.objects;
drop policy if exists "Dev Arena users update their own profile avatars"
  on storage.objects;
drop policy if exists "Dev Arena users delete their own profile avatars"
  on storage.objects;

create policy "Dev Arena users read their own profile avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'PROFILES'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "Dev Arena users upload their own profile avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'PROFILES'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "Dev Arena users update their own profile avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'PROFILES'
    and split_part(name, '.', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'PROFILES'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "Dev Arena users delete their own profile avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'PROFILES'
    and split_part(name, '.', 1) = auth.uid()::text
  );

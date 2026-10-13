-- Profile image URL used by the app's signed-in profile and avatar views.
alter table public.profiles
  add column if not exists avatar_url text;

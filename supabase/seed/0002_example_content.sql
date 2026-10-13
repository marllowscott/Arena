-- Dev Arena · optional example content
-- NOT part of the schema. The instructor normally creates problems and
-- topics through the app. Apply this only if you want starter content
-- for a demo, and set the instructor email in app_config first.
--
-- Safe to re-run: upserts on slug / natural key.

insert into public.challenges
  (slug, title, codename, summary, pathway_id, difficulty, xp, estimated_effort, mission, why_it_matters, requirements, evidence, tags)
values
  ('api-401-token-looks-correct',
   'My API request returns a 401 even though the authentication token appears correct',
   'The Silent 401',
   'A GET to /api/me fails with 401 Unauthorized despite a token that decodes fine on jwt.io.',
   'problem-solver', 'starter', 40, '45 minutes',
   'Reproduce the failure, find the real cause, fix it, and show evidence the request now returns 200.',
   'Authentication failures are the most common bug in every codebase. Learning to read them precisely saves hours.',
   array['A failing request you can reproduce', 'Access to the token and the request headers'],
   array['Link to the commit or PR that fixed it', 'Screenshot or log of the 200 response'],
   array['auth', 'debugging', 'api'])
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, mission = excluded.mission;

insert into public.challenges
  (slug, title, codename, summary, pathway_id, difficulty, xp, estimated_effort, mission, why_it_matters, requirements, evidence, tags)
values
  ('form-resubmits-on-refresh',
   'The contact form submits twice on refresh',
   'The Double Post',
   'Users report duplicate emails whenever they refresh after submitting the contact form.',
   'builder', 'builder', 60, '1 hour',
   'Diagnose why the browser resends the POST, fix it with a proper redirect, and prove a refresh no longer duplicates the submission.',
   'The POST-redirect-GET pattern is a fundamental habit. Duplicate submissions cause real data corruption.',
   array['A dev environment where the duplicate happens'],
   array['Link to the fix', 'Screen recording of submit → refresh → single entry'],
   array['forms', 'ux', 'web'])
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, mission = excluded.mission;

insert into public.teaching_proposals (title, pathway_id, proposed_by, summary, outcomes, xp_reward, status)
values
  ('Git Rebase Without Fear',
   'teacher',
   (select id from public.profiles where handle = (select value from public.app_config where key = 'instructor_email') limit 1),
   'A short presentation on when to rebase vs merge, how to recover from a bad rebase, and force-push etiquette.',
   array['The audience can rebase a feature branch safely', 'The audience can recover with reflog'],
   50, 'open')
on conflict do nothing;

insert into public.teaching_proposals (title, pathway_id, proposed_by, summary, outcomes, xp_reward, status)
values
  ('Reading a Stack Trace',
   'teacher',
   (select id from public.profiles where handle = (select value from public.app_config where key = 'instructor_email') limit 1),
   'How to read a stack trace top to bottom, spot the real frame, and map it back to your code.',
   array['The audience finds the failing frame unaided'],
   40, 'open')
on conflict do nothing;

select 'example challenges' as what, count(*) from public.challenges
union all select 'example topics', count(*) from public.teaching_proposals;

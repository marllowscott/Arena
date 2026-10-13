-- Dev Arena · reference data seed
-- Pathways, titles and unlocks. Catalogue data: identical for everyone, so it
-- is safe to seed with plain SQL.
--
-- Safe to re-run. Everything is upserted on its natural key, so running this
-- twice will not create duplicates or fail.
--
-- Developers, problems, help requests and opportunities are deliberately NOT
-- here — they belong to real people and get created through the app.

-- ------------------------------------------------------------------ pathways

insert into public.pathways (id, name, short_name, tagline, description, icon, sort_order, promise)
values
  ('builder', 'Builder', 'Builder',
   'Ship applications, features and deployments.',
   'Builder measures whether you can take a brief from idea to something that actually runs. Features, deployments, and the discipline to finish what you start.',
   'hammer', 0, 'Ship work that runs in production.'),

  ('problem-solver', 'Problem Solver', 'Solver',
   'Debugging, logic and difficult technical problems.',
   'Problem Solver is earned by finding causes rather than symptoms. The bugs nobody wanted, the logic nobody could follow, the ticket everyone avoided.',
   'bug', 1, 'Find the cause, not just the symptom.'),

  ('teacher', 'Teacher', 'Teacher',
   'Explaining and teaching technical concepts.',
   'Teacher rewards clarity. If you can explain a hard idea so a teammate can act on it, you have done the harder half of the work.',
   'presentation', 2, 'Make it clear enough for someone else.'),

  ('mentor', 'Mentor', 'Mentor',
   'Helping other developers and supporting their growth.',
   'Mentor is measured in unblocked developers. Someone completed a mission because you answered the question they were stuck on.',
   'lifebuoy', 3, 'Unblock a developer today.'),

  ('scout', 'Scout', 'Scout',
   'Finding and understanding career opportunities.',
   'Scout rewards research that turns into action. Verified opportunities, explained clearly, shared with the people who need them.',
   'compass', 4, 'Turn research into a next step.')
on conflict (id) do update set
  name        = excluded.name,
  short_name  = excluded.short_name,
  tagline     = excluded.tagline,
  description = excluded.description,
  icon        = excluded.icon,
  sort_order  = excluded.sort_order,
  promise     = excluded.promise;

-- -------------------------------------------------------------------- titles
-- Six rungs per pathway. Tiers 4 and above need instructor confirmation before
-- they become public.

insert into public.titles (id, pathway_id, name, tier, xp_required, motto, requires_confirmation)
values
  -- Builder
  ('builder-t1', 'builder', 'Novice Builder', 1, 0, 'Every project starts as a rough draft.', false),
  ('builder-t2', 'builder', 'Code Smith', 2, 600, 'Shape the idea. Ship the first version.', false),
  ('builder-t3', 'builder', 'Forge Master', 3, 2000, 'Heat, hammer, repeat. Features survive it.', false),
  ('builder-t4', 'builder', 'Architect', 4, 4500, 'Structure outlives the thing it holds.', true),
  ('builder-t5', 'builder', 'Master Architect', 5, 8000, 'Systems other developers can extend.', true),
  ('builder-t6', 'builder', 'Legendary Builder', 6, 14000, 'Shipped more than most teams planned.', true),

  -- Problem Solver
  ('problem-solver-t1', 'problem-solver', 'Bug Hunter', 1, 0, 'Something is wrong. Find it.', false),
  ('problem-solver-t2', 'problem-solver', 'Fixer', 2, 200, 'You found it. Now fix it properly.', false),
  ('problem-solver-t3', 'problem-solver', 'Debugger', 3, 900, 'Problems don''t disappear. You solve them.', false),
  ('problem-solver-t4', 'problem-solver', 'Problem Slayer', 4, 2200, 'The hard ones stop being hard.', true),
  ('problem-solver-t5', 'problem-solver', 'Logic Master', 5, 4500, 'The bug was never where you expected.', true),
  ('problem-solver-t6', 'problem-solver', 'Code Exorcist', 6, 8000, 'Nothing survives contact with your stack trace.', true),

  -- Teacher
  ('teacher-t1', 'teacher', 'Explainer', 1, 0, 'Clear is kinder than correct.', false),
  ('teacher-t2', 'teacher', 'Instructor', 2, 250, 'You can teach what you just learned.', false),
  ('teacher-t3', 'teacher', 'Knowledge Smith', 3, 800, 'Hammer knowledge into usable shape.', false),
  ('teacher-t4', 'teacher', 'Concept Master', 4, 1800, 'Complexity explained simply.', true),
  ('teacher-t5', 'teacher', 'Dev Sage', 5, 3500, 'Asked when the answer matters.', true),
  ('teacher-t6', 'teacher', 'Master Teacher', 6, 6000, 'Developers become teachers here.', true),

  -- Mentor
  ('mentor-t1', 'mentor', 'Helper', 1, 0, 'Answer the question you once asked.', false),
  ('mentor-t2', 'mentor', 'Guide', 2, 220, 'Point the way, then step back.', false),
  ('mentor-t3', 'mentor', 'Mentor', 3, 1000, 'Someone grew because you showed up.', false),
  ('mentor-t4', 'mentor', 'Trusted Mentor', 4, 2500, 'People bring you the hard problems.', true),
  ('mentor-t5', 'mentor', 'Dev Guardian', 5, 5000, 'The team''s safety net, by choice.', true),
  ('mentor-t6', 'mentor', 'Master Mentor', 6, 9000, 'Developers become mentors here.', true),

  -- Scout
  ('scout-t1', 'scout', 'Explorer', 1, 0, 'Look before you leap.', false),
  ('scout-t2', 'scout', 'Scout', 2, 250, 'You found the trail others missed.', false),
  ('scout-t3', 'scout', 'Opportunity Hunter', 3, 900, 'Verified leads, real doors.', false),
  ('scout-t4', 'scout', 'Pathfinder', 4, 2000, 'Mapped the route for others.', true),
  ('scout-t5', 'scout', 'Career Navigator', 5, 4000, 'Turns research into direction.', true),
  ('scout-t6', 'scout', 'Opportunity Master', 6, 7000, 'The room asks you where to apply.', true)
on conflict (id) do update set
  name                  = excluded.name,
  tier                  = excluded.tier,
  xp_required           = excluded.xp_required,
  motto                 = excluded.motto,
  requires_confirmation = excluded.requires_confirmation;

-- ------------------------------------------------------------------- unlocks
-- `scope = 'reviews'` is what is_instructor() checks, so granting this unlock
-- to a profile is what makes somebody an instructor.

insert into public.unlocks (id, title, description, scope, requirements)
values
  ('unlock-facilitator', 'Session Facilitator',
   'Run an official Dev Arena session. You set the agenda, you own the room, and the attendance counts.',
   'teaching',
   array['Instructor title in the Teacher pathway', 'One delivered session', 'Attendance recorded']),

  ('unlock-panelist', 'Review Panelist',
   'Review submissions alongside the instructor on fast-track Builder missions.',
   'reviews',
   array['Fixer title in the Problem Solver pathway', 'Ten approved reviews', 'Instructor nomination']),

  ('unlock-verifier', 'Scout Verifier',
   'Confirm that an opportunity is real and open before it reaches the hub board.',
   'scout',
   array['Scout title', 'Five verified opportunities', 'One rejected listing caught']),

  ('unlock-oncall', 'Mentor On-Call',
   'Be the named developer on the help channel for a week. Blocking requests come to you first.',
   'mentoring',
   array['Guide title in the Mentor pathway', 'Three confirmed help answers', 'Median response under four hours']),

  ('unlock-brief-author', 'Problem Brief Author',
   'Write problem briefings that other developers will complete. Your problems, your rubric.',
   'arena',
   array['Code Smith title in the Builder pathway', 'Two problems completed above Advanced', 'Instructor review'])
on conflict (id) do update set
  title        = excluded.title,
  description  = excluded.description,
  scope        = excluded.scope,
  requirements = excluded.requirements;

-- ------------------------------------------------------------------- verify
-- Expected: pathways 5, titles 30, unlocks 5.

select 'pathways' as table_name, count(*) from public.pathways
union all select 'titles', count(*) from public.titles
union all select 'unlocks', count(*) from public.unlocks
order by table_name;

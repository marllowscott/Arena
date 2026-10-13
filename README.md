# Dev Arena

Developer activity platform with simple gamification for Mufakose Innovation Hub.

**Core loop:** developer claims a problem → does the work → submits evidence → instructor reviews → instructor approves → XP is awarded → leaderboard updates.

XP is never awarded for claiming, clicking, viewing, or submitting alone. The instructor is the final authority for every XP award, enforced in the database (not just hidden in the UI).

## Stack

- Next.js 16 (App Router, server components, server actions)
- Supabase Auth + Postgres with RLS
- Tailwind CSS 4

## Manual deployment checklist

These are the only steps that cannot be done from the codebase. Everything else builds and runs as-is.

### 1. Supabase — apply the MVP migration

In the **Supabase SQL Editor**, run the contents of
`supabase/migrations/0003_mvp_authorization.sql` (select all → run).

What it does:

1. **Authorization fix** — `award_xp` and `review_submission` refuse every caller except an instructor (`is_instructor()`). Before this, any signed-in user could call these RPCs directly and award themselves XP.
2. **Signup provisioning** — a trigger creates a `profiles` row on every signup.
3. **Instructor mechanism** — the trigger grants the reviews-scope unlock to exactly one email, stored in `app_config`.
4. **Claims** — `activity_claims` table records "I am taking responsibility for this problem/topic".
5. **Topic presentations + opportunity submissions** — `submissions.topic_id`, `opportunities` review columns and policies.
6. **Backfill** — idempotent; gives pre-existing auth users a profile.

Then run `supabase/migrations/0004_dev_shop.sql`. It creates the Dev Shop
reward catalogue and redemption workflow. Dev Points are earned at **1 point
per 100 lifetime XP**; redeeming reserves points but never removes XP.
Instructor decisions are handled at `/instructor/dev-shop`; declining a request
refunds its points.

If the app reports an error loading a profile because `avatar_url` is missing,
run `supabase/migrations/0005_profile_avatar_url.sql`. This adds the optional
profile image URL column without changing existing profile data.

For profile photo uploads, run `supabase/migrations/0006_profile_avatar_storage.sql`.
It grants authenticated users access only to avatar objects named with their own
user ID in the existing `PROFILES` bucket. The bucket must be configured as
public for profile images to display through the app's public avatar URLs. The
migration can be rerun to recreate its policies if an upload fails with a
Storage row-level security error.

App icons currently render as violet numbered markers (`#B15EFF`). Their stable
number-to-icon-name assignments are defined in `components/ui/number-icon.tsx`;
all uses of the same icon type share its number.

### 2. Supabase — set the authorized instructor email

Pick the ONE authorized instructor email, then set it in the SQL Editor:

```sql
update public.app_config set value = 'the-authorized-instructor@example.com'
  where key = 'instructor_email';
```

And set the same address in the deployment environment (Vercel → project → Settings → Environment Variables):

```text
INSTRUCTOR_EMAIL=the-authorized-instructor@example.com
```

Both places must match. The email is never in source code: the server action restricts instructor signup to it, and the database trigger independently enforces the same rule. No password goes anywhere in the repository.

**If the instructor account already existed before step 1** (created in the Supabase dashboard or before this migration), run this once, after the `update` above:

```sql
insert into public.developer_unlocks (developer_id, unlock_id)
select u.id, 'unlock-panelist'
from auth.users u
where lower(u.email) = lower(
  (select value from public.app_config where key = 'instructor_email')
)
on conflict (developer_id, unlock_id) do nothing;
```

Otherwise (account created after the migration), the trigger handles it automatically on signup.

### 3. Supabase — email confirmation

Check **Authentication → Settings → Enable email confirmation**:

- **Off** (simplest for the MVP): developers can sign up and immediately log in.
- **On**: developers must click the confirmation email before their first login. The app handles this with a "check your email" message.

### 4. Deployment environment — set variables

Vercel → project → Settings → Environment Variables (production + preview):

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
INSTRUCTOR_EMAIL=the-authorized-instructor@example.com
```

`NEXT_PUBLIC_` variables are public to the browser by design. `INSTRUCTOR_EMAIL` is server-only (no `NEXT_PUBLIC_` prefix). Never add a service-role key to the frontend environment — it is not needed to run the app.

### 5. Deploy

```bash
npm run typecheck
npm run lint
npm run build
```

Then deploy the `UNO` directory to Vercel (Next.js framework preset). Open the deployed URL: create a developer account, or log in as the authorized instructor.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` | Browser key (public by design; RLS protects data) |
| `INSTRUCTOR_EMAIL` | Vercel + `.env.local` (server-only) | The single authorized instructor email; restricts instructor signup and must match `app_config.instructor_email` |

`.env.local` is git-ignored. No passwords, service-role keys, or tokens belong in the repository.

## Roles

- **Developer** — claims problems, submits solutions, claims topics and presents them, submits opportunities, sees XP and leaderboard position.
- **Instructor** — posts problems and topics, reviews submissions (approve / adjust / return), verifies opportunities (approve / reject + XP), sees developer progress. Every XP award happens through the instructor's review, via the instructor-gated `review_submission` / `award_xp` RPCs.

## Project layout

```
app/                    routes — (developer) and instructor areas, /login
components/             UI, arena (real-data) and instructor components
lib/arena/              server-side session, queries and actions (the real data layer)
lib/supabase/           browser + server Supabase clients
lib/services/           Phase-1 mock repositories (legacy screens only, not in nav)
supabase/migrations/    0001 schema · 0002 (not applied, out of scope) · 0003 MVP
supabase/seed/          0001 reference data (live) · 0002 optional example content
```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

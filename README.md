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

### 1. Supabase — apply migrations

In the **Supabase SQL Editor**, apply migrations `0001` through `0006` in
numeric order. Migration `0002` adds the `profiles.role` column used by the
current authorization function; `0003` provisions profiles and adds the
instructor-only RPC checks. `0004` creates the Dev Shop reward catalogue and
redemption workflow. Dev Points are earned at **1 point per 100 lifetime XP**;
redeeming reserves points but never removes XP. Instructor decisions are
handled at `/instructor/dev-shop`; declining a request refunds its points.
After `0004`, apply `0008_dev_shop_reward_management.sql` to enable instructor
creation, editing, pricing, and deactivation of catalog rewards. Deactivation
hides a reward from developers without removing its historical requests.

If the app reports an error loading a profile because `avatar_url` is missing,
apply `0005_profile_avatar_url.sql`. For profile photo uploads, apply
`0006_profile_avatar_storage.sql`; it grants authenticated users access only to
avatar objects named with their own user ID in the existing `PROFILES` bucket.
The bucket must be configured as public for profile images to display through
the app's public avatar URLs.

Finally, run `supabase/migrations/0007_domain_based_roles.sql`. It assigns
`instructor` to every account whose email domain is exactly `uncommon.org`,
assigns `developer` to all other accounts, synchronizes roles on Auth email
updates, backfills existing profiles, and preserves the RLS guard against
self-elevation. **The database role behavior is not updated until this SQL has
been run successfully.**

Run `supabase/migrations/0009_instructor_problem_crud.sql` to enable problem
editing and deletion. Deletion is rejected for problems with submissions to
preserve review history; close those problems instead.

App icons currently render as violet numbered markers (`#B15EFF`). Their stable
number-to-icon-name assignments are defined in `components/ui/number-icon.tsx`;
all uses of the same icon type share its number.

### 2. Supabase — email confirmation

Check **Authentication → Settings → Enable email confirmation**:

- **Off** (simplest for the MVP): developers can sign up and immediately log in.
- **On**: developers must click the confirmation email before their first login. The app handles this with a "check your email" message.

### 3. Deployment environment — set variables

Vercel → project → Settings → Environment Variables (production + preview):

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

`NEXT_PUBLIC_` variables are public to the browser by design. Never add a
service-role key to the frontend environment — it is not needed to run the app.

### 4. Deploy

```bash
npm run typecheck
npm run lint
npm run build
```

Then deploy the `UNO` directory to Vercel (Next.js framework preset). Open
the deployed URL and create an account or log in; the account email domain
determines the dashboard.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` | Browser key (public by design; RLS protects data) |
`.env.local` is git-ignored. No passwords, service-role keys, or tokens belong in the repository.

## Roles

- **Developer** — any account whose email domain is not exactly `uncommon.org`; claims problems, submits solutions, claims topics and presents them, submits opportunities, sees XP and leaderboard position.
- **Instructor** — any account whose email domain is exactly `uncommon.org`, case-insensitively; posts problems and topics, reviews submissions (approve / adjust / return), verifies opportunities (approve / reject + XP), sees developer progress. Every XP award happens through the instructor's review, via the instructor-gated `review_submission` / `award_xp` RPCs.

## Project layout

```
app/                    routes — (developer) and instructor areas, /login
components/             UI, arena (real-data) and instructor components
lib/arena/              server-side session, queries and actions (the real data layer)
lib/supabase/           browser + server Supabase clients
lib/services/           Phase-1 mock repositories (legacy screens only, not in nav)
supabase/migrations/    0001–0007 schema, authorization, features, and role sync
supabase/seed/          0001 reference data (live) · 0002 optional example content
```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

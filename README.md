# Dev Arena

Developer activity platform with simple gamification for Mufakose Innovation Hub.

**Core loop:** developer claims a problem → does the work → submits evidence → instructor reviews → instructor approves → XP is awarded → leaderboard updates.

XP is never awarded for claiming, clicking, viewing, or submitting alone. The instructor is the final authority for every XP award, enforced in the database (not just hidden in the UI).

## Stack

- Next.js 16 (App Router, server components, server actions)
- Supabase Auth + Postgres with RLS
- Tailwind CSS 4

## Manual deployment checklist

These are the only steps that cannot be done from the codebase. A migration file
in this repository does not mean it has been applied to Supabase. Check the
project's migration history before applying anything; do not reapply a version
that is already recorded as applied.

### 1. Supabase — apply migrations

Verify or apply the migrations below in numeric order. In particular,
`0002` relies on the base tables in `0001`, `0003` adds profile provisioning
and instructor-only RPC checks, and `0007` establishes the role check used by
subsequent instructor policies.

1. `0001_initial_schema.sql` — base schema and RLS.
2. `0002_real_auth_and_probe.sql` — real profile provisioning and Probe ownership.
3. `0003_mvp_authorization.sql` — claims, profile provisioning, instructor-only XP/review RPCs.
4. `0004_dev_shop.sql` — rewards and redemption requests.
5. `0005_profile_avatar_url.sql` — required by the current profile query.
6. `0006_profile_avatar_storage.sql` — required for profile photo uploads.
7. `0007_domain_based_roles.sql` — role column, role synchronization, instructor checks.
8. `0008_dev_shop_reward_management.sql` — instructor reward create/edit/deactivate.
9. `0009_instructor_problem_crud.sql` — problem editing and guarded deletion.
10. `0010_instructor_workflows.sql` — topic lifecycle, curated opportunities, and atomic reviews.
11. `0011_persistent_probe_workflow.sql` — persisted Probe actions, moderation, and once-only confirmed-answer XP.

After `0001`, also apply `supabase/seed/0001_reference_data.sql`; it populates
the pathways and titles required by the app. `0002_example_content.sql` is
optional demo content and is not required for production.

Migrations `0005` and `0006` are needed for the profile/photo functionality
currently exposed in Settings. `0008` depends on `0004`; apply it after `0007`
when following the complete ordered sequence. `0009` and `0010` depend on the
instructor authorization established by `0007`. `0011` depends on the help
tables and RPCs from `0001`/`0002`, the instructor roles from `0007`, and the
visibility policies from `0010`.

Migration `0001` creates `pathway_xp` as a table maintained with the XP ledger.
The earlier SQL also attempted to create a view with the same name; that
conflicting view declaration has been removed so a fresh database can apply
the base schema.

Migration `0007` assigns `instructor` to every account whose email domain is
exactly `uncommon.org`, assigns `developer` to all other accounts, synchronizes
roles on Auth email updates, backfills existing profiles, and preserves the RLS
guard against self-elevation. **The database role behavior is not updated until
this SQL has been run successfully.**

Migration `0009` rejects deleting problems with submissions. Migration `0010`
rejects deleting topics with submissions. Archive or close those records
instead. Migration `0010` also enables
topic drafts and archiving, guards topic deletion when submissions exist,
restricts student proposals to unpublished drafts, hides pending opportunity
submissions from other developers, adds instructor-managed curated opportunity
drafts/publishing/archiving/deletion, limits flagged probe visibility to the
asker, helper, and instructor, and makes submission/opportunity review and XP
awards atomic and one-time.

Migration `0011` connects the Probe UI to those persisted tables and RPCs. A
developer's explicit confirmation of the accepted helper's answer awards the
existing 8 Mentor XP once; merely asking for or accepting a Probe does not award
XP. Instructor moderation is available at `/instructor/probes`.

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

Set `SUPABASE_SERVICE_ROLE_KEY` from the Supabase API settings as a server-only
environment variable to enable instructor developer management. Do not prefix
it with `NEXT_PUBLIC_`, expose it to client code, or commit it. Configure
Supabase Auth email delivery/site URL so developer invitations can be sent.

The instructor **Developers** page can invite developers by email, edit their
name, handle, headline, and primary pathway, and permanently delete their
accounts. Deletion cascades through the profile's submissions, XP history, and
related activity. Email addresses under `uncommon.org` are reserved for
instructor accounts. Roles and XP are never editable from this page.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + `.env.local` | Server-only Supabase Admin API for instructor developer account management |
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
supabase/migrations/    0001–0011 schema, authorization, features, and workflows
supabase/seed/          0001 reference data (live) · 0002 optional example content
```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

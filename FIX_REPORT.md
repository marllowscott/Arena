# Fix Report: Incorrect User Roles in Instructor Dashboard

## STATUS
COMPLETED

## ROOT CAUSE
The instructor dashboard was displaying two developers when there was one instructor and one developer because the `leaderboard` function in `lib/arena/data.ts` returned all profiles (both developers and instructors) without filtering by role. The dashboard used this function to populate a StatCard labeled "Developers" with the count of profiles, causing the instructor to be incorrectly counted as a developer.

## FILES CHANGED
- `UNO/lib/arena/data.ts`: 
  - Updated `ProfileRow` interface to include a `role` field.
  - Modified the `leaderboard` function to select the `role` column and filter results to only include profiles where `role = 'developer'`.

## DATABASE FINDINGS
The `profiles` table includes a `role` column (added in migration `0007_domain_based_roles.sql`) that correctly stores either 'developer' or 'instructor' based on the email domain (accounts with email domain `uncommon.org` are assigned the 'instructor' role, all others 'developer'). The migration also includes a backfill to update existing profiles accordingly. No manual database action is required; the role data is already correct.

## VERIFICATION
- **Typecheck**: Passed with `npm run typecheck` (or `tsc --noEmit`).
- **Lint**: Passed with `npm run lint` (or `eslint .`).
- **Build**: Passed with `npm run build` (or `next build`).
- **Logic Verification**: 
  - The instructor dashboard now shows a developer count that excludes instructor accounts.
  - The instructors/developers page lists only developer profiles.
  - The developer leaderboard page shows only developer profiles.
  - Authentication and role-based navigation (via `requireInstructor` and `requireDeveloper`) remain unchanged and functional.

## ISSUES
None.

## READY
Yes, the fix is ready for browser testing. The changes are minimal and safe, preserving all existing functionality while correctly displaying role-based data in the instructor dashboard.
import type { Submission } from "@/lib/types";
import { hoursAgo, daysAgo } from "./clock";
import { challengesById } from "./challenges";

const rubricFor = (challengeId: string) => challengesById[challengeId].rubric;

export const submissions: Submission[] = [
  {
    id: "sub-addisa-migration",
    challengeId: "ch-migration-deadline",
    developerId: "dev-addisa",
    status: "pending",
    solution:
      "Moved the settings module in two deploys: an additive migration that writes to both schemas, then a read switch with a documented rollback. Ran it against a copy of production data first, which caught a null constraint the dev database never had.",
    evidence: [
      { id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/settings-schema (branch: additive-migration)" },
      { id: "e2", kind: "file", label: "Deploy notes", value: "docs/deploys/2026-10-03-settings-migration.md" },
    ],
    explainIt:
      "Step one is additive so the old code keeps working untouched. Step two only changes reads, and the rollback is a single flag flip. The window where both schemas are written is intentional and short.",
    whatBroke:
      "The dry run failed on two rows with a null organisation_id that production had but the sanitised dataset did not. The constraint needed to be added as deferrable.",
    howFixed:
      "Made the constraint deferrable, re-ran the dry run against a real production snapshot, and added a pre-flight check to the migration script so it fails loudly instead of partially applying.",
    suggestedXp: 120,
    awardedXp: null,
    reviewerNote: null,
    submittedAt: hoursAgo(5),
    reviewedAt: null,
    rubric: rubricFor("ch-migration-deadline"),
  },
  {
    id: "sub-keith-token",
    challengeId: "ch-token-pass",
    developerId: "dev-keith",
    status: "pending",
    solution:
      "Replaced 46 hard-coded colours in the settings area with semantic tokens and removed the two ad-hoc overrides that were causing the drift.",
    evidence: [
      { id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/app (branch: settings/tokens)" },
      { id: "e2", kind: "screenshot", label: "Visual diff", value: "docs/evidence/token-pass-diff.png" },
    ],
    explainIt:
      "I took a visual snapshot before and after using Playwright at three widths, then compared the images pixel by pixel. Zero differing pixels outside the two intended hover states.",
    whatBroke:
      "My first pass named tokens after their colour values, which meant the dark theme still had light-mode names. Renaming took longer than the refactor itself.",
    howFixed:
      "Renamed by role instead of appearance and put a lint rule in place so a raw hex value cannot reappear in the settings folder.",
    suggestedXp: 45,
    awardedXp: null,
    reviewerNote: null,
    submittedAt: hoursAgo(11),
    reviewedAt: null,
    rubric: rubricFor("ch-token-pass"),
  },
  {
    id: "sub-tafadzwa-asyncstorage",
    challengeId: "ch-explain-async-storage",
    developerId: "dev-tafadzwa",
    status: "pending",
    solution:
      "Ran a 35-minute session on AsyncStorage: the API surface, the limits, and a deliberate failure when data grows past what belongs in a key-value store.",
    evidence: [
      { id: "e1", kind: "file", label: "Session material", value: "docs/sessions/asyncstorage.md" },
      { id: "e2", kind: "screenshot", label: "Attendance", value: "14 attendees" },
    ],
    explainIt:
      "I started from the mental model people already have of localStorage, then showed where the analogy breaks: async, size limits, and no query support.",
    whatBroke:
      "My first run took 55 minutes and ran out of time before the exercise. I cut the API walkthrough and gave people something to do at minute 20 instead.",
    howFixed:
      "Rebuilt the outline around one worked example plus one exercise, and asked a colleague to time me before the second run.",
    suggestedXp: 50,
    awardedXp: null,
    reviewerNote: null,
    submittedAt: hoursAgo(9),
    reviewedAt: null,
    rubric: rubricFor("ch-explain-async-storage"),
  },
  {
    id: "sub-nigel-ledger",
    challengeId: "ch-ledger-race",
    developerId: "dev-nigel",
    status: "pending",
    solution:
      "Reproduced the double spend with a 40-request script, then closed the window with a conditional update on the balance row so the database decides who wins.",
    evidence: [
      { id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/ledger (branch: fix/double-spend)" },
      { id: "e2", kind: "demo", label: "Reproduction script", value: "scripts/repro-double-spend.sh" },
    ],
    explainIt:
      "The check and the write were two statements, so two transactions could both pass the check. Now it is one conditional update, and a losing request simply updates zero rows and is rejected.",
    whatBroke:
      "My first fix used a pessimistic row lock, which worked but serialised every write and made the test suite crawl.",
    howFixed:
      "Replaced the lock with a conditional update, then tuned the transaction isolation for the read path so the hot path stayed fast.",
    suggestedXp: 200,
    awardedXp: null,
    reviewerNote: null,
    submittedAt: hoursAgo(26),
    reviewedAt: null,
    rubric: rubricFor("ch-ledger-race"),
  },
  {
    id: "sub-william-nullref",
    challengeId: "ch-null-dereference",
    developerId: "dev-william",
    status: "pending",
    solution:
      "The profile screen was reading state after unmount. Added an abort on cleanup and guarded the render path so a late response cannot touch a dead component.",
    evidence: [{ id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/app (branch: fix/profile-unmount)" }],
    explainIt:
      "The fetch outlived the screen. Now the request is aborted when the screen unmounts and the state update checks that the component is still mounted before it runs.",
    whatBroke:
      "My first fix wrapped the render in an if-check, which hid the crash but left the request running and the warning in the log.",
    howFixed:
      "Replaced the guard with a proper cleanup so the request is cancelled rather than the symptom being hidden.",
    suggestedXp: 20,
    awardedXp: null,
    reviewerNote: null,
    submittedAt: daysAgo(1),
    reviewedAt: null,
    rubric: rubricFor("ch-null-dereference"),
  },
  {
    id: "sub-takura-checkout",
    challengeId: "ch-offline-field-form",
    developerId: "dev-takura",
    status: "pending",
    solution:
      "Full offline queue with retry backoff, conflict resolution that keeps both versions and lets the field user choose, and a sync indicator in the header.",
    evidence: [
      { id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/field-form" },
      { id: "e2", kind: "demo", label: "Demo", value: "recordings/offline-form-demo.mp4" },
      { id: "e3", kind: "file", label: "Architecture note", value: "docs/architecture/offline-sync.md" },
    ],
    explainIt:
      "Every write goes to a local table first and the queue drains when connectivity returns. Conflicts surface to the user instead of resolving silently, because a field observation is never disposable.",
    whatBroke:
      "Retrying on mount caused a retry storm when four devices came back online together. Added jitter and a shared backoff ceiling.",
    howFixed:
      "Exponential backoff with jitter and a per-queue ceiling, plus a visible pending count so the field team can tell the difference between slow and stuck.",
    suggestedXp: 320,
    awardedXp: null,
    reviewerNote: null,
    submittedAt: daysAgo(2),
    reviewedAt: null,
    rubric: rubricFor("ch-offline-field-form"),
  },

  /* ---- Approved work. This is the current developer's portfolio. ---- */
  {
    id: "sub-collins-gate",
    challengeId: "ch-broken-gate",
    developerId: "dev-collins",
    status: "approved",
    solution:
      "The refresh path replaced the session object but never re-ran the gate evaluation, so the app kept the signed-out branch from startup. Fixed by deriving the gate state from the refreshed session instead of caching it.",
    evidence: [
      { id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/app (branch: fix/session-refresh-gate)" },
      { id: "e2", kind: "demo", label: "Demo", value: "recordings/gate-session-survives.mp4" },
    ],
    explainIt:
      "The gate was evaluated once at mount and cached in state. Refresh replaced the session underneath it and nothing re-evaluated. Now the gate reads from the session, so there is a single source of truth.",
    whatBroke:
      "I spent the first hour on the clock skew, because nine minutes looked suspiciously like a token lifetime.",
    howFixed:
      "Logging the token claims showed the refresh was succeeding. I added a regression test that waits past the refresh window and fails on the old code.",
    suggestedXp: 80,
    awardedXp: 80,
    reviewerNote: "Clean diagnosis and a regression test that proves the window is closed. Full marks.",
    submittedAt: hoursAgo(7),
    reviewedAt: hoursAgo(3),
    rubric: rubricFor("ch-broken-gate"),
  },
  {
    id: "sub-collins-api",
    challengeId: "ch-api-error-hunt",
    developerId: "dev-collins",
    status: "approved",
    solution:
      "Fixed the create endpoint (unhandled unique-violation) and the health endpoint (it reported the cache, not the database). Documented the empty customer endpoint as a permissions filter issue.",
    evidence: [
      { id: "e1", kind: "repository", label: "Repository", value: "github.com/mufakose/api (branch: fix/triage-round-2)" },
      { id: "e2", kind: "screenshot", label: "Before and after", value: "docs/evidence/api-triage.png" },
    ],
    explainIt:
      "Two of the three failures shared a root cause class: errors that were swallowed and turned into a generic 500. Fixing the error path fixed both.",
    whatBroke:
      "I assumed the empty customer response was a data problem. It was a role filter.",
    howFixed:
      "Logged the row count at each layer, which showed the rows existed and the filter removed them.",
    suggestedXp: 60,
    awardedXp: 65,
    reviewerNote: "Bonus for the diagnosis write-up on the third failure.",
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(2),
    rubric: rubricFor("ch-api-error-hunt"),
  },
  {
    id: "sub-collins-unblock",
    challengeId: "ch-unblock-the-pair",
    developerId: "dev-collins",
    status: "approved",
    solution:
      "Worked through the orders API thread with the requesting developer, asked what they expected the response shape to be, and got them writing the query themselves.",
    evidence: [{ id: "e1", kind: "screenshot", label: "Thread", value: "help/thread/orders-api-undefined" }],
    explainIt:
      "They were mapping an array where the API returns a single object. Once they wrote the query themselves it stuck.",
    whatBroke:
      "I nearly pasted the working query. I asked them to print the raw response first instead.",
    howFixed: "Confirmed on their second attempt without help, then closed the thread.",
    suggestedXp: 55,
    awardedXp: 55,
    reviewerNote: "Exactly the behaviour we want from mentor work.",
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(4),
    rubric: rubricFor("ch-unblock-the-pair"),
  },
  {
    id: "sub-collins-rebase",
    challengeId: "ch-teach-git-rebase",
    developerId: "dev-collins",
    status: "approved",
    solution:
      "A 30-minute rebase session built around one deliberate conflict, resolved on screen, with a one-page reference left behind.",
    evidence: [{ id: "e1", kind: "file", label: "Reference", value: "docs/sessions/rebase-reference.md" }],
    explainIt: "I showed the conflict and the index state at each step instead of presenting the tidy history.",
    whatBroke: "My first outline explained rebase as 'moving commits', which confused everyone who had used cherry-pick.",
    howFixed: "Rebuilt it around a graph picture rather than a verb.",
    suggestedXp: 15,
    awardedXp: 15,
    reviewerNote: null,
    submittedAt: daysAgo(9),
    reviewedAt: daysAgo(9),
    rubric: rubricFor("ch-teach-git-rebase"),
  },
  {
    id: "sub-collins-audit",
    challengeId: "ch-opportunity-audit",
    developerId: "dev-collins",
    status: "approved",
    solution:
      "Verified five Scout listings at the source. Three were still open, one had closed silently and one was reposting the same role.",
    evidence: [{ id: "e1", kind: "file", label: "Audit sheet", value: "scout/audits/2026-10-board.md" }],
    explainIt: "I checked each listing at the employer's own careers page rather than the aggregator that surfaced it.",
    whatBroke: "Two listings only existed on aggregator sites, which is exactly the risk this mission is meant to catch.",
    howFixed: "Flagged both and left a note explaining what made them unverifiable.",
    suggestedXp: 20,
    awardedXp: 20,
    reviewerNote: null,
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(6),
    rubric: rubricFor("ch-opportunity-audit"),
  },
];
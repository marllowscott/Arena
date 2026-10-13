import type { Challenge } from "@/lib/types";
import { daysFromNow } from "./clock";

const RUBRIC_STANDARD = [
  {
    id: "rub-correct",
    label: "Works",
    description: "The solution runs as described, without manual repair.",
    weight: 40,
  },
  {
    id: "rub-explain",
    label: "Explained",
    description: "The explanation makes the reasoning followable by another developer.",
    weight: 35,
  },
  {
    id: "rub-broken",
    label: "Diagnosed",
    description: "The failure is described accurately, including the wrong turns.",
    weight: 25,
  },
];

const RUBRIC_TEACHING = [
  {
    id: "rub-clear",
    label: "Clear",
    description: "A developer with no prior context can follow the session.",
    weight: 35,
  },
  {
    id: "rub-example",
    label: "Worked example",
    description: "Real code is shown, run, and broken on purpose.",
    weight: 35,
  },
  {
    id: "rub-practice",
    label: "Practice",
    description: "Attendees leave with something they can try immediately.",
    weight: 30,
  },
];

const RUBRIC_TEAM = [
  {
    id: "rub-unblocked",
    label: "Unblocked",
    description: "The developer who asked can now continue their own work.",
    weight: 50,
  },
  {
    id: "rub-explanation",
    label: "Explained",
    description: "The reasoning is transferable, not a one-off patch.",
    weight: 30,
  },
  {
    id: "rub-record",
    label: "Recorded",
    description: "The answer is written down where the next developer can find it.",
    weight: 20,
  },
];

/**
 * The Arena catalogue. Missions are realistic briefs rather than exercises —
 * each one is written the way a real ticket is written.
 */
export const challenges: Challenge[] = [
  {
    id: "ch-broken-gate",
    slug: "the-broken-gate",
    title: "The Broken Gate",
    codename: "The Broken Gate",
    summary:
      "A release gate rejects valid sessions after the token refresh change. Find the defect before it reaches the field team.",
    pathwayId: "problem-solver",
    difficulty: "advanced",
    xp: 80,
    estimatedEffort: "1h 30m",
    deadline: daysFromNow(5),
    status: "open",
    tags: ["debugging", "authentication", "react-native"],
    mission:
      "The field app signs users out roughly nine minutes after launch. Session refresh succeeds and the user still lands on the gate screen. Reproduce it, find the actual cause, and fix it without disabling the refresh.",
    whyItMatters:
      "Authentication bugs are the ones users feel first and trust last. Reading a token lifecycle properly is the difference between a patch and a fix.",
    requirements: [
      "Reproduce the failure and capture the exact moment it happens.",
      "Identify the cause in the session refresh path, not the symptom.",
      "Fix the cause and keep the refresh enabled.",
      "Add a regression test that fails before your fix and passes after it.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "Branch or commit link with the fix and the test." },
      { id: "ev-demo", kind: "demo", label: "Demo", required: true, hint: "Short clip or live link showing a session surviving past nine minutes." },
      { id: "ev-file", kind: "file", label: "Trace log", required: false, hint: "The log that proves where the token went." },
    ],
    explainPrompt: "How does your solution work? Walk through the refresh path and say where you expected the failure to be.",
    brokePrompt: "What did you believe was wrong before you proved it was not?",
    rubric: RUBRIC_STANDARD,
    completions: 9,
    recommendationReason: "Matches your Debugger path and closes a live release blocker.",
    recommended: true,
  },
  {
    id: "ch-api-error-hunt",
    slug: "api-error-hunt",
    title: "API Error Hunt",
    codename: "API Error Hunt",
    summary:
      "Three endpoints fail for three different reasons. Triage them, fix the two that matter, and document the third.",
    pathwayId: "problem-solver",
    difficulty: "builder",
    xp: 60,
    estimatedEffort: "45 min",
    deadline: daysFromNow(3),
    status: "open",
    tags: ["api", "error-handling", "node"],
    mission:
      "The orders endpoint returns 500 on create, the customer endpoint returns empty data, and the health endpoint lies. Diagnose all three, fix two, and write up the third with the reasoning you would need to fix it later.",
    whyItMatters:
      "Triage is a real skill. Knowing which failure to spend the afternoon on is worth more than fixing all three badly.",
    requirements: [
      "Reproduce each failure and record the actual response.",
      "Fix two of the three at the root.",
      "Write a short diagnosis for the third, including your next step.",
      "Keep the error responses machine-readable.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "Commit range covering the two fixes." },
      { id: "ev-shot", kind: "screenshot", label: "Before and after", required: true, hint: "Terminal output showing the endpoint succeeding." },
    ],
    explainPrompt: "How did you decide which failure to fix first?",
    brokePrompt: "Which failure was a red herring, and how did you know?",
    rubric: RUBRIC_STANDARD,
    completions: 21,
    recommendationReason: "Short, high-signal, and closes a real triage gap.",
    recommended: true,
  },
  {
    id: "ch-explain-async-storage",
    slug: "explain-async-storage",
    title: "Explain AsyncStorage",
    codename: "Explain AsyncStorage",
    summary:
      "Teach AsyncStorage properly: what it is, where it belongs, and the three ways developers misuse it.",
    pathwayId: "teacher",
    difficulty: "builder",
    xp: 50,
    estimatedEffort: "40 min",
    deadline: daysFromNow(7),
    status: "open",
    tags: ["react-native", "state", "teaching"],
    mission:
      "Write and deliver a 30-minute session on AsyncStorage. Cover the API, the limits people hit, and what to use instead when data grows.",
    whyItMatters:
      "Almost everyone at the hub has lost an afternoon to this. Teaching it once saves a week of confused debugging.",
    requirements: [
      "A written outline approved before you present.",
      "A live demonstration, including one thing going wrong on purpose.",
      "A one-page takeaway the audience keeps.",
      "Answer at least three questions from the room.",
    ],
    evidence: [
      { id: "ev-file", kind: "file", label: "Slides or doc", required: true, hint: "The deck or document you presented from." },
      { id: "ev-video", kind: "video", label: "Recording", required: false, hint: "Recording if the session was captured." },
      { id: "ev-shot", kind: "screenshot", label: "Attendance", required: false, hint: "Attendance list from the session." },
    ],
    explainPrompt: "How would you explain this to someone who has never opened the file?",
    brokePrompt: "What part of this topic did you find hardest to explain clearly?",
    rubric: RUBRIC_TEACHING,
    completions: 14,
    recommendationReason: "Twelve developers already asked for this topic.",
    recommended: true,
  },
  {
    id: "ch-offline-field-form",
    slug: "field-form-that-survives-no-signal",
    title: "Field Form That Survives No Signal",
    codename: "Offline Duel",
    summary:
      "The field team completes forms in places with no data. Make the form queue, sync and recover without losing work.",
    pathwayId: "builder",
    difficulty: "boss",
    xp: 320,
    estimatedEffort: "1 day",
    deadline: daysFromNow(16),
    status: "open",
    tags: ["react-native", "sync", "architecture", "supabase"],
    mission:
      "Build an offline-first form: local queue, retry with backoff, conflict resolution, and a visible sync state the field team can trust.",
    whyItMatters:
      "This is the largest piece of real work on the hub roadmap. Finishing it well is the strongest Builder statement available.",
    requirements: [
      "Persist every submission locally before attempting the network.",
      "Retry with backoff and survive an app restart mid-queue.",
      "Resolve conflicts without silently discarding field data.",
      "Surface sync state in the UI so users know what is pending.",
      "Write a short architecture note for the next developer.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "Full implementation with history." },
      { id: "ev-demo", kind: "demo", label: "Demo", required: true, hint: "Recording the app working offline, then reconnecting." },
      { id: "ev-file", kind: "file", label: "Architecture note", required: true, hint: "One page on your sync design and why." },
    ],
    explainPrompt: "How does data move through your system, and where can it be lost?",
    brokePrompt: "Describe the worst failure you hit during the build and how you recovered.",
    rubric: [
      { id: "rub-works-offline", label: "Survives no signal", description: "The form completes and queues with the radio off.", weight: 35 },
      { id: "rub-integrity", label: "No lost work", description: "Nothing the field team typed is ever dropped.", weight: 35 },
      { id: "rub-explains", label: "Explained", description: "The architecture note makes the design reviewable.", weight: 30 },
    ],
    completions: 1,
    recommendationReason: "The flagship Builder mission this cycle.",
    recommended: false,
  },
  {
    id: "ch-ledger-race",
    slug: "race-condition-in-the-ledger",
    title: "Race Condition In The Ledger",
    codename: "Double Spend",
    summary:
      "Two concurrent requests can both pass a balance check. Find the window, close it, and prove it is closed.",
    pathwayId: "problem-solver",
    difficulty: "expert",
    xp: 200,
    estimatedEffort: "3h",
    deadline: daysFromNow(6),
    status: "open",
    tags: ["concurrency", "postgresql", "transactions"],
    mission:
      "The ledger service allows a balance to be spent twice under concurrency. Find the exact window, close it at the database level, and write a test that fails reliably under load.",
    whyItMatters:
      "Financial integrity problems are the hardest bugs to detect late and the easiest to prove early. This is the exercise that separates debugging from guessing.",
    requirements: [
      "Demonstrate the double spend with a repeatable script.",
      "Close the window with a database-level guarantee, not application timing.",
      "Write a concurrency test that fails on the old code.",
      "Keep throughput reasonable under the test harness.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "Fix plus the concurrency test." },
      { id: "ev-demo", kind: "demo", label: "Reproduction script", required: true, hint: "The script that shows the double spend." },
      { id: "ev-file", kind: "file", label: "Write-up", required: false, hint: "What the window was and why the fix holds." },
    ],
    explainPrompt: "Why does the database guarantee hold where application-level locking did not?",
    brokePrompt: "What did your first fix attempt break instead of fix?",
    rubric: RUBRIC_STANDARD,
    completions: 4,
    recommendationReason: "Deepens the Debugger title you just unlocked.",
    recommended: false,
  },
  {
    id: "ch-null-dereference",
    slug: "the-null-dereference-hunt",
    title: "The Null Dereference Hunt",
    codename: "Empty Room",
    summary:
      "A short crash on a slow connection. Find it, fix it, and explain why it only happens on bad networks.",
    pathwayId: "problem-solver",
    difficulty: "starter",
    xp: 20,
    estimatedEffort: "30 min",
    deadline: daysFromNow(2),
    status: "open",
    tags: ["debugging", "crash", "react-native"],
    mission:
      "The profile screen crashes when a slow response returns after the user navigates away. Fix the crash without hiding it behind a retry.",
    whyItMatters:
      "Timing bugs are the ones that get dismissed as noise. Ten minutes here teaches a habit that scales.",
    requirements: [
      "Reproduce with a throttled connection.",
      "Fix the lifecycle mistake at its source.",
      "Confirm the screen recovers gracefully when it does happen.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "The fix." },
      { id: "ev-shot", kind: "screenshot", label: "Crash log", required: false, hint: "The original stack trace." },
    ],
    explainPrompt: "What is the lifecycle rule you broke, stated in one sentence?",
    brokePrompt: "What did you assume about the network that turned out to be wrong?",
    rubric: RUBRIC_STANDARD,
    completions: 33,
    recommendationReason: "A fast win to rebuild momentum.",
    recommended: false,
  },
  {
    id: "ch-token-pass",
    slug: "token-pass",
    title: "The Token Pass",
    codename: "Token Pass",
    summary:
      "Refactor a colour system into tokens without breaking a single screen. Visual diffs are your evidence.",
    pathwayId: "builder",
    difficulty: "builder",
    xp: 45,
    estimatedEffort: "1h",
    deadline: daysFromNow(8),
    status: "open",
    tags: ["refactor", "design-system", "frontend"],
    mission:
      "Replace the hard-coded palette in the settings area with design tokens. Nothing may change visually, and you must prove it.",
    whyItMatters:
      "Refactoring is where developers learn to work safely inside code they did not write.",
    requirements: [
      "Introduce tokens without any visual change.",
      "Provide before and after visual evidence.",
      "Leave the codebase easier to change than you found it.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "The refactor." },
      { id: "ev-shot", kind: "screenshot", label: "Visual diff", required: true, hint: "Before and after captures." },
    ],
    explainPrompt: "How did you verify nothing changed visually?",
    brokePrompt: "Which token name did you get wrong first, and what did it cost?",
    rubric: RUBRIC_STANDARD,
    completions: 18,
    recommendationReason: "Directly supports the Forge Master push.",
    recommended: false,
  },
  {
    id: "ch-teach-sql-joins",
    slug: "teach-sql-joins-without-fear",
    title: "Teach SQL Joins Without Fear",
    codename: "Join The Room",
    summary:
      "Run a session on joins that leaves the room writing queries, not watching them.",
    pathwayId: "teacher",
    difficulty: "advanced",
    xp: 90,
    estimatedEffort: "1h",
    deadline: daysFromNow(11),
    status: "open",
    tags: ["sql", "postgresql", "teaching"],
    mission:
      "Teach inner, left and anti joins from first principles, then have every attendee write a query against real data.",
    whyItMatters:
      "Every reporting task in the hub depends on joins. A room that can write them saves the whole team hours a week.",
    requirements: [
      "Start from a diagram, not from syntax.",
      "Everyone writes at least one query during the session.",
      "Publish the exercise sheet afterwards.",
    ],
    evidence: [
      { id: "ev-file", kind: "file", label: "Session material", required: true, hint: "Slides and exercise sheet." },
      { id: "ev-shot", kind: "screenshot", label: "Attendance", required: true, hint: "Who attended." },
    ],
    explainPrompt: "What order did you teach it in, and why that order?",
    brokePrompt: "Where did the room get stuck, and how did you unstick them?",
    rubric: RUBRIC_TEACHING,
    completions: 11,
    recommendationReason: "Nine developers already asked for this session.",
    recommended: false,
  },
  {
    id: "ch-teach-git-rebase",
    slug: "rebase-explained",
    title: "Rebase, Explained",
    codename: "Clean History",
    summary:
      "Teach rebase with a real conflict so people leave able to use it, not afraid of it.",
    pathwayId: "teacher",
    difficulty: "starter",
    xp: 15,
    estimatedEffort: "30 min",
    deadline: daysFromNow(4),
    status: "open",
    tags: ["git", "teaching"],
    mission:
      "A 30-minute session where you deliberately create a conflict and resolve it on screen.",
    whyItMatters:
      "Rebase is avoided because it is never shown. One honest conflict fixes that for the whole hub.",
    requirements: [
      "Show the conflict, not just the result.",
      "Explain what the index is doing at each step.",
      "Leave a written reference people can use at 2am.",
    ],
    evidence: [
      { id: "ev-file", kind: "file", label: "Reference", required: true, hint: "The one-page reference." },
    ],
    explainPrompt: "How do you explain the index without making it worse?",
    brokePrompt: "What went wrong in your own first attempt to prepare this session?",
    rubric: RUBRIC_TEACHING,
    completions: 26,
    recommendationReason: "Low effort, high demand from the room.",
    recommended: false,
  },
  {
    id: "ch-unblock-the-pair",
    slug: "unblock-the-pair",
    title: "Unblock The Pair",
    codename: "Unblock The Pair",
    summary:
      "Two developers are stuck on the same integration problem. Solve it for them, then teach them to solve it.",
    pathwayId: "mentor",
    difficulty: "builder",
    xp: 55,
    estimatedEffort: "45 min",
    deadline: daysFromNow(5),
    status: "open",
    tags: ["mentoring", "api", "supabase"],
    mission:
      "Work through a live help request until the developer can continue unaided. The XP is for the unblocking, not the patch.",
    whyItMatters:
      "The habit this builds is the whole point of the platform: solve each other's problems before escalating them.",
    requirements: [
      "Respond in the Help channel rather than in a private message.",
      "Ask a question before answering.",
      "Confirm the developer can continue on their own.",
    ],
    evidence: [
      { id: "ev-shot", kind: "screenshot", label: "Thread", required: true, hint: "The help thread you resolved." },
    ],
    explainPrompt: "What did you ask them that made the answer stick?",
    brokePrompt: "Where were you tempted to just paste the fix?",
    rubric: RUBRIC_TEAM,
    completions: 12,
    recommendationReason: "You are 140 XP from Guide. This is the fastest path.",
    recommended: false,
  },
  {
    id: "ch-mentor-office-hours",
    slug: "mentor-office-hours",
    title: "Mentor Office Hours",
    codename: "Office Hours",
    summary:
      "Run an open mentoring session and record what developers actually needed.",
    pathwayId: "mentor",
    difficulty: "advanced",
    xp: 110,
    estimatedEffort: "2h",
    deadline: daysFromNow(10),
    status: "open",
    tags: ["mentoring", "facilitation"],
    mission:
      "Hold a 60-minute open session for anyone stuck on anything, then summarise the three themes you heard.",
    whyItMatters:
      "Mentor XP rewards showing up in public. The themes you collect also shape next month's missions.",
    requirements: [
      "Hold the session and keep it to 60 minutes.",
      "Write down the three recurring problems you heard.",
      "Send the summary to the hub.",
    ],
    evidence: [
      { id: "ev-file", kind: "file", label: "Session summary", required: true, hint: "Themes and who needed what." },
    ],
    explainPrompt: "What did the room actually need, versus what you expected?",
    brokePrompt: "Which question was hardest to answer well?",
    rubric: RUBRIC_TEAM,
    completions: 5,
    recommendationReason: "Moves you toward a confirmed Mentor title.",
    recommended: false,
  },
  {
    id: "ch-opportunity-audit",
    slug: "audit-the-opportunity-board",
    title: "Audit The Opportunity Board",
    codename: "Board Audit",
    summary:
      "Check whether the opportunities listed this month are still real, open and verified.",
    pathwayId: "scout",
    difficulty: "starter",
    xp: 20,
    estimatedEffort: "40 min",
    deadline: daysFromNow(6),
    status: "open",
    tags: ["research", "verification"],
    mission:
      "Verify five opportunities on the Scout board. Flag the closed ones and note the deadline for the rest.",
    whyItMatters:
      "A stale board costs more trust than an empty one. Verification is the least glamorous and most useful Scout work.",
    requirements: [
      "Verify five opportunities against the original source.",
      "Flag anything closed or mislisted.",
      "Add a Scout note to each one you checked.",
    ],
    evidence: [
      { id: "ev-file", kind: "file", label: "Audit sheet", required: true, hint: "What you checked and what you found." },
    ],
    explainPrompt: "How did you decide a listing was genuine?",
    brokePrompt: "Which listing looked real and was not?",
    rubric: [
      { id: "rub-verified", label: "Verified", description: "Each listing was checked at the source.", weight: 60 },
      { id: "rub-clear", label: "Recorded", description: "Findings are written where others can use them.", weight: 40 },
    ],
    completions: 19,
    recommendationReason: "Directly feeds your Scout progression.",
    recommended: false,
  },
  {
    id: "ch-internship-scout-report",
    slug: "internship-scout-report",
    title: "Internship Scout Report",
    codename: "Scout Report",
    summary:
      "Research the open engineering internships, verify them, and explain the three worth applying to.",
    pathwayId: "scout",
    difficulty: "advanced",
    xp: 85,
    estimatedEffort: "2h",
    deadline: daysFromNow(12),
    status: "open",
    tags: ["research", "careers", "verification"],
    mission:
      "Find current engineering internships, verify each against the employer's own listing, and write a recommendation for the hub.",
    whyItMatters:
      "Scout exists so that a developer spends an hour on research instead of a week guessing. This is that hour, documented.",
    requirements: [
      "Verify every listing at the employer's own source.",
      "Explain what each role actually involves day to day.",
      "Recommend three, with a reason a developer could argue with.",
    ],
    evidence: [
      { id: "ev-file", kind: "file", label: "Scout report", required: true, hint: "The report, shared with the hub." },
      { id: "ev-shot", kind: "screenshot", label: "Evidence", required: true, hint: "Proof each listing is open." },
    ],
    explainPrompt: "How would you defend your top three recommendations?",
    brokePrompt: "Which attractive listing turned out to be closed or unpaid?",
    rubric: [
      { id: "rub-verified", label: "Verified", description: "Every claim is checked at the source.", weight: 40 },
      { id: "rub-explain", label: "Explained", description: "Roles are described in real day-to-day terms.", weight: 35 },
      { id: "rub-useful", label: "Useful", description: "A developer could act on it today.", weight: 25 },
    ],
    completions: 6,
    recommendationReason: "Biggest XP gap in your Scout pathway.",
    recommended: false,
  },
  {
    id: "ch-migration-deadline",
    slug: "migration-under-deadline",
    title: "Migration Under Deadline",
    codename: "Hard Deadline",
    summary:
      "Move the settings module onto the new schema with live traffic in production and no downtime.",
    pathwayId: "builder",
    difficulty: "advanced",
    xp: 120,
    estimatedEffort: "3h",
    deadline: daysFromNow(3),
    status: "open",
    tags: ["migration", "postgresql", "deployment"],
    mission:
      "Move the settings module to the new schema in two deployable steps, with a rollback for each.",
    whyItMatters:
      "Deployments are where Builder titles are won or lost. This one has a real deadline and real traffic.",
    requirements: [
      "Ship in two steps that are each individually safe.",
      "Write the rollback for both steps before you start.",
      "No downtime and no data loss.",
    ],
    evidence: [
      { id: "ev-repo", kind: "repository", label: "Repository", required: true, hint: "Both steps and the rollbacks." },
      { id: "ev-file", kind: "file", label: "Deploy notes", required: true, hint: "What you ran, in order, with timings." },
    ],
    explainPrompt: "Why is each step safe on its own?",
    brokePrompt: "What went wrong in the dry run, and what did you change because of it?",
    rubric: RUBRIC_STANDARD,
    completions: 8,
    recommendationReason: "Deadline pressure builds deployment judgement.",
    recommended: false,
  },
];

export const challengesById = Object.fromEntries(
  challenges.map((challenge) => [challenge.id, challenge]),
);

export function challengeBySlug(slug: string) {
  return challenges.find((challenge) => challenge.slug === slug);
}
import type { TeachingProposal } from "@/lib/types";
import { daysAgo, daysFromNow, hoursAgo } from "./clock";

export const teachingProposals: TeachingProposal[] = [
  {
    id: "tp-rn-navigation",
    title: "React Native Navigation",
    pathwayId: "teacher",
    proposedById: "dev-tafadzwa",
    summary:
      "How navigation actually works in a React Native app, why the native stack behaves differently from the JS one, and when each one is the right choice.",
    outcomes: [
      "Explain the difference between native and JS navigation stacks.",
      "Choose the right navigator for a real screen flow.",
      "Debug the navigation errors the room will hit.",
    ],
    voterIds: [
      "dev-collins", "dev-william", "dev-simbarashe", "dev-farai", "dev-blessing",
      "dev-takura", "dev-rudo", "dev-tawananyasha", "dev-keith", "dev-rutendo",
      "dev-nigel", "dev-addisa",
    ],
    interestedCount: 12,
    status: "open",
    sessionDate: null,
    xpReward: 95,
    createdAt: daysAgo(6),
    reviewedBy: null,
  },
  {
    id: "tp-supabase-auth",
    title: "Supabase Authentication",
    pathwayId: "teacher",
    proposedById: "dev-blessing",
    summary:
      "Sessions, tokens and row-level security in one sitting, using the exact failures people hit at this hub.",
    outcomes: [
      "Set up auth without storing tokens by hand.",
      "Write a row-level security policy and know why it denies.",
      "Debug the three most common session failures.",
    ],
    voterIds: [
      "dev-collins", "dev-nigel", "dev-tafadzwa", "dev-farai", "dev-addisa",
      "dev-rutendo", "dev-keith", "dev-takura", "dev-rudo",
    ],
    interestedCount: 9,
    status: "shortlisted",
    sessionDate: null,
    xpReward: 105,
    createdAt: daysAgo(4),
    reviewedBy: null,
  },
  {
    id: "tp-api-errors",
    title: "API Error Handling",
    pathwayId: "teacher",
    proposedById: "dev-nigel",
    summary:
      "Stop turning every failure into a 500. Modelling errors your clients can actually handle.",
    outcomes: [
      "Separate transport, validation and domain errors.",
      "Return machine-readable error shapes.",
      "Stop swallowing exceptions at the boundary.",
    ],
    voterIds: ["dev-collins", "dev-farai", "dev-william", "dev-rutendo", "dev-rudo", "dev-simbarashe"],
    interestedCount: 6,
    status: "open",
    sessionDate: null,
    xpReward: 80,
    createdAt: daysAgo(3),
    reviewedBy: null,
  },
  {
    id: "tp-query-tuning",
    title: "Postgres Query Tuning",
    pathwayId: "teacher",
    proposedById: "dev-keith",
    summary:
      "Reading EXPLAIN ANALYZE output and fixing the three queries that slow every report down.",
    outcomes: [
      "Read a query plan without guessing.",
      "Fix a sequential scan with the right index.",
      "Know when an index is the wrong answer.",
    ],
    voterIds: ["dev-rudo", "dev-rutendo", "dev-nigel", "dev-addisa", "dev-collins"],
    interestedCount: 5,
    status: "open",
    sessionDate: null,
    xpReward: 85,
    createdAt: daysAgo(5),
    reviewedBy: null,
  },
  {
    id: "tp-react-query",
    title: "React Query Caching",
    pathwayId: "teacher",
    proposedById: "dev-rudo",
    summary:
      "Caching that behaves the way the UI expects, including invalidation after a mutation.",
    outcomes: [
      "Choose sensible stale times instead of guessing.",
      "Invalidate correctly after a mutation.",
      "Avoid refetch loops.",
    ],
    voterIds: ["dev-keith", "dev-takura", "dev-tawananyasha", "dev-blessing", "dev-farai", "dev-collins", "dev-william"],
    interestedCount: 7,
    status: "scheduled",
    sessionDate: daysFromNow(11),
    xpReward: 90,
    createdAt: daysAgo(9),
    reviewedBy: "Tapiwa Marange",
  },
  {
    id: "tp-rebase",
    title: "Git Rebase Without Fear",
    pathwayId: "teacher",
    proposedById: "dev-collins",
    summary:
      "A short session built around one deliberate conflict, so the room stops avoiding rebase.",
    outcomes: [
      "Rebase a branch with a real conflict.",
      "Read the index state at each step.",
      "Recover a rebase you wish you had not started.",
    ],
    voterIds: ["dev-simbarashe", "dev-william", "dev-farai", "dev-rudo", "dev-blessing", "dev-takura"],
    interestedCount: 6,
    status: "delivered",
    sessionDate: daysAgo(8),
    xpReward: 15,
    createdAt: daysAgo(16),
    reviewedBy: "Tapiwa Marange",
  },
  {
    id: "tp-docker-frontend",
    title: "Docker For Frontend Developers",
    pathwayId: "teacher",
    proposedById: "dev-rutendo",
    summary:
      "Reproducible local environments and a container you can hand to someone else without instructions.",
    outcomes: [
      "Write a Dockerfile for an existing app.",
      "Use a compose file for the app and its database.",
      "Debug the two build failures everyone hits.",
    ],
    voterIds: ["dev-keith", "dev-takura", "dev-addisa"],
    interestedCount: 3,
    status: "open",
    sessionDate: null,
    xpReward: 75,
    createdAt: daysAgo(2),
    reviewedBy: null,
  },
  {
    id: "tp-tests",
    title: "Writing Tests People Trust",
    pathwayId: "teacher",
    proposedById: "dev-tawananyasha",
    summary:
      "Tests that fail for real reasons. Fewer mocks, better assertions, less theatre.",
    outcomes: [
      "Test behaviour instead of implementation.",
      "Cut the mocks that are hiding your bugs.",
      "Write a test that fails usefully when it fails.",
    ],
    voterIds: ["dev-nigel", "dev-rudo", "dev-farai", "dev-collins", "dev-addisa", "dev-keith", "dev-blessing", "dev-takura"],
    interestedCount: 8,
    status: "open",
    sessionDate: null,
    xpReward: 95,
    createdAt: daysAgo(7),
    reviewedBy: null,
  },
];

export const teachingProposalsById = Object.fromEntries(
  teachingProposals.map((proposal) => [proposal.id, proposal]),
);

export const teachingActivity = [
  {
    id: "act-tawa-1",
    developerId: "dev-tawananyasha",
    kind: "teaching" as const,
    message: "proposed Writing Tests People Trust",
    xp: null,
    referenceId: "tp-tests",
    createdAt: hoursAgo(30),
  },
  {
    id: "act-rudo-1",
    developerId: "dev-rudo",
    kind: "teaching" as const,
    message: "scheduled React Query Caching",
    xp: null,
    referenceId: "tp-react-query",
    createdAt: daysAgo(1),
  },
];
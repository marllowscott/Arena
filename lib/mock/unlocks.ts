import type { DeveloperUnlock, Unlock } from "@/lib/types";
import { daysAgo } from "./clock";

/**
 * Unlocks are responsibilities, not trophies. They appear on the profile once a
 * developer has earned the right to carry them.
 */
export const unlockCatalogue: Unlock[] = [
  {
    id: "unlock-facilitator",
    title: "Session Facilitator",
    description:
      "Run an official Dev Arena session. You set the agenda, you own the room, and the attendance counts.",
    scope: "teaching",
    requirements: [
      "Instructor title in the Teacher pathway",
      "One delivered session",
      "Attendance recorded",
    ],
    icon: "presentation",
  },
  {
    id: "unlock-panelist",
    title: "Review Panelist",
    description:
      "Review submissions alongside the instructor on fast-track Builder missions.",
    scope: "reviews",
    requirements: [
      "Fixer title in the Problem Solver pathway",
      "Ten approved reviews",
      "Instructor nomination",
    ],
    icon: "clipboard-check",
  },
  {
    id: "unlock-verifier",
    title: "Scout Verifier",
    description:
      "Confirm that an opportunity is real and open before it reaches the hub board.",
    scope: "scout",
    requirements: [
      "Scout title",
      "Five verified opportunities",
      "One rejected listing caught",
    ],
    icon: "shield-check",
  },
  {
    id: "unlock-oncall",
    title: "Mentor On-Call",
    description:
      "Be the named developer on the help channel for a week. Blocking requests come to you first.",
    scope: "mentoring",
    requirements: [
      "Guide title in the Mentor pathway",
      "Three confirmed help answers",
      "Median response under four hours",
    ],
    icon: "lifebuoy",
  },
  {
    id: "unlock-brief-author",
    title: "Arena Brief Author",
    description:
      "Write mission briefings that other developers will complete. Your missions, your rubric.",
    scope: "arena",
    requirements: [
      "Code Smith title in the Builder pathway",
      "Two missions completed above Advanced",
      "Instructor review",
    ],
    icon: "scroll-text",
  },
];

export const developerUnlocks: DeveloperUnlock[] = [
  {
    ...unlockCatalogue[0],
    developerId: "dev-collins",
    earnedAt: daysAgo(7),
  },
  {
    ...unlockCatalogue[1],
    developerId: "dev-collins",
    earnedAt: daysAgo(21),
  },
  {
    ...unlockCatalogue[2],
    developerId: "dev-collins",
    earnedAt: daysAgo(12),
  },
  {
    ...unlockCatalogue[3],
    developerId: "dev-tafadzwa",
    earnedAt: daysAgo(5),
  },
  {
    ...unlockCatalogue[4],
    developerId: "dev-rutendo",
    earnedAt: daysAgo(30),
  },
];

export function unlocksFor(developerId: string) {
  return developerUnlocks.filter((unlock) => unlock.developerId === developerId);
}

export function lockedUnlocksFor(developerId: string) {
  return unlockCatalogue.filter(
    (unlock) => !developerUnlocks.some((earned) => earned.id === unlock.id && earned.developerId === developerId),
  );
}
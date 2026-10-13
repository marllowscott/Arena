import type { OpportunityStage, PathwayId, PathwayProgress, Title } from "@/lib/types";
import { DIFFICULTY_META } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/* Levels                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One ladder over total XP. Developers see exactly one number, so "how close am
 * I to the next level" is answerable without explaining a second currency.
 *
 * Pathway XP still exists underneath for the instructor's roster view and the
 * pathway leaderboards; it just isn't surfaced on the developer dashboard.
 */
export const XP_PER_LEVEL = 300;
export const XP_PER_DEV_POINT = 100;

export interface LevelProgress {
  /** 1-based. Level 1 starts at 0 XP. */
  level: number;
  /** XP at the start of this level. */
  floor: number;
  /** Where the next level starts. Always 300 XP ahead. */
  ceiling: number;
  /** 0 → 1 through the current level. */
  progress: number;
  xpToNext: number;
}

/** The ladder is open-ended: every level is followed by another. */
export function levelForXp(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const floor = (level - 1) * XP_PER_LEVEL;
  const ceiling = floor + XP_PER_LEVEL;

  return {
    level,
    floor,
    ceiling,
    progress: Math.min(1, (safeXp - floor) / XP_PER_LEVEL),
    xpToNext: Math.max(0, ceiling - safeXp),
  };
}

/* -------------------------------------------------------------------------- */
/* The Scout pipeline. A developer earns Scout XP by moving an opportunity     */
/* through it — research is worth more than a tap.                             */
/* -------------------------------------------------------------------------- */
export const OPPORTUNITY_PIPELINE: ReadonlyArray<{
  id: OpportunityStage;
  label: string;
  xp: number;
  blurb: string;
}> = [
  { id: "discover", label: "Discover", xp: 5, blurb: "Find the listing." },
  { id: "verify", label: "Verify", xp: 10, blurb: "Confirm it is real and open." },
  { id: "research", label: "Research", xp: 15, blurb: "Understand what the role really is." },
  { id: "explain", label: "Explain", xp: 20, blurb: "Write it so someone else can act." },
  { id: "share", label: "Share", xp: 20, blurb: "Put it in front of the right people." },
  { id: "act", label: "Act", xp: 30, blurb: "Apply, register or submit." },
];

/** Titles are ordered by tier. The catalogue is seeded data, not hard-coded UI. */
export function sortTitles(titles: Title[]) {
  return [...titles].sort((a, b) => a.tier - b.tier);
}

export function titleForXp(titles: Title[], xp: number): Title {
  const ladder = sortTitles(titles);
  let current = ladder[0];
  for (const title of ladder) {
    if (xp >= title.xpRequired) current = title;
  }
  return current;
}

export function nextTitleForXp(titles: Title[], xp: number): Title | null {
  const ladder = sortTitles(titles);
  return ladder.find((title) => title.xpRequired > xp) ?? null;
}

/**
 * Progression inside the current title band. Returns 0 at the top of a ladder
 * so an already-maxed pathway reads as complete rather than half-finished.
 */
export function titleBandProgress(titles: Title[], xp: number) {
  const ladder = sortTitles(titles);
  const current = titleForXp(ladder, xp);
  const next = nextTitleForXp(ladder, xp);
  if (!next) return { current, next: null, progress: 1, xpToNext: 0 };

  const floor = current.xpRequired;
  const span = Math.max(1, next.xpRequired - floor);
  const gained = Math.max(0, xp - floor);
  return {
    current,
    next,
    progress: Math.min(1, gained / span),
    xpToNext: Math.max(0, next.xpRequired - xp),
  };
}

export function buildPathwayProgress(input: {
  developerId: string;
  pathwayId: PathwayId;
  xp: number;
  titles: Title[];
  recentAchievement: string;
}): PathwayProgress {
  const band = titleBandProgress(input.titles, input.xp);
  return {
    developerId: input.developerId,
    pathwayId: input.pathwayId,
    xp: input.xp,
    currentTitle: band.current,
    nextTitle: band.next,
    progress: band.progress,
    xpToNextTitle: band.xpToNext,
    recentAchievement: input.recentAchievement,
  };
}

export function difficultyRank(difficulty: keyof typeof DIFFICULTY_META) {
  return DIFFICULTY_META[difficulty].order;
}

export function isTopOfLadder(titles: Title[], xp: number) {
  return nextTitleForXp(titles, xp) === null;
}
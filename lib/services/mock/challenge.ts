import type { Challenge } from "@/lib/types";
import { challenges } from "@/lib/mock/challenges";
import { CURRENT_DEVELOPER_ID } from "@/lib/mock/pathways";
import { developersById } from "@/lib/mock/developers";
import type { ChallengeFilter, ChallengeService } from "../contracts";

function matchesQuery(challenge: Challenge, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    challenge.title,
    challenge.codename,
    challenge.summary,
    challenge.pathwayId,
    challenge.difficulty,
    ...challenge.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export const challengeService: ChallengeService = {
  list: (filter: ChallengeFilter = {}): Challenge[] => {
    const current = developersById[CURRENT_DEVELOPER_ID];
    return challenges
      .filter((challenge) => {
        if (filter.pathwayId && challenge.pathwayId !== filter.pathwayId) return false;
        if (filter.difficulty && challenge.difficulty !== filter.difficulty) return false;
        if (filter.status && challenge.status !== filter.status) return false;
        if (filter.query && !matchesQuery(challenge, filter.query)) return false;
        return true;
      })
      .sort((a, b) => {
        // Recommended missions first, then the biggest XP still on the table.
        if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
        if (current) {
          const aMine = a.pathwayId === current.primaryPathway ? 1 : 0;
          const bMine = b.pathwayId === current.primaryPathway ? 1 : 0;
          if (aMine !== bMine) return bMine - aMine;
        }
        return b.xp - a.xp;
      });
  },

  byId: (id) => challenges.find((challenge) => challenge.id === id) ?? null,

  bySlug: (slug) => challenges.find((challenge) => challenge.slug === slug) ?? null,

  recommended: (limit = 3): Challenge[] =>
    challenges
      .filter((challenge) => challenge.recommended && challenge.status === "open")
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit),
};
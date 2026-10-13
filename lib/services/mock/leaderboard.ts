import type { LeaderboardEntry, LeaderboardTab, PathwayId } from "@/lib/types";
import { developers } from "@/lib/mock/developers";
import { CURRENT_DEVELOPER_ID } from "@/lib/mock/pathways";
import { pathwayProgressFor } from "./developer";
import type { LeaderboardService, LeaderboardSnapshot } from "../contracts";

function titleFor(developerId: string, pathwayId: PathwayId) {
  const developer = developers.find((item) => item.id === developerId);
  if (!developer) return "";
  const progress = pathwayProgressFor(developer).find((item) => item.pathwayId === pathwayId);
  return progress?.currentTitle.name ?? "";
}

function scoreFor(developerId: string, tab: LeaderboardTab) {
  const developer = developers.find((item) => item.id === developerId);
  if (!developer) return 0;
  if (tab === "movement") return developer.weeklyXp;
  if (tab === "overall") return developer.totalXp;
  return developer.pathwayXp[tab as PathwayId];
}

function movementFor(developerId: string, tab: LeaderboardTab) {
  const developer = developers.find((item) => item.id === developerId);
  if (!developer) return 0;
  if (tab === "movement") return developer.weeklyMovement;
  // Movement only exists on the weekly board. Elsewhere we hide it rather
  // than inventing a number.
  return 0;
}

export const leaderboardService: LeaderboardService = {
  snapshot: (tab, currentDeveloperId = CURRENT_DEVELOPER_ID): LeaderboardSnapshot => {
    const ordered = [...developers].sort((a, b) => scoreFor(b.id, tab) - scoreFor(a.id, tab));

    const entries: LeaderboardEntry[] = ordered.map((developer, index) => {
      const rank = index + 1;
      const movement = movementFor(developer.id, tab);
      return {
        developerId: developer.id,
        name: developer.name,
        handle: developer.handle,
        initials: developer.initials,
        avatarFrom: developer.avatarFrom,
        avatarTo: developer.avatarTo,
        pathwayId:
          tab === "movement" || tab === "overall" ? developer.primaryPathway : (tab as PathwayId),
        title: titleFor(developer.id, tab === "movement" || tab === "overall" ? developer.primaryPathway : (tab as PathwayId)),
        totalXp: developer.totalXp,
        weeklyXp: developer.weeklyXp,
        movement,
        rank,
        previousRank: Math.max(1, rank - movement),
        isCurrentDeveloper: developer.id === currentDeveloperId,
      };
    });

    return {
      tab,
      entries,
      currentEntry: entries.find((entry) => entry.isCurrentDeveloper) ?? null,
    };
  },
};
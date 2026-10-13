import type { ArenaServices } from "./contracts";
import { developerService } from "./mock/developer";
import { pathwayService } from "./mock/pathway";
import { challengeService } from "./mock/challenge";
import { submissionService } from "./mock/submission";
import { opportunityService } from "./mock/opportunity";
import { teachingService } from "./mock/teaching";
import { helpService } from "./mock/help";
import { progressService } from "./mock/progress";
import { insightService } from "./mock/insight";
import { unlockService } from "./mock/unlock";
import { leaderboardService } from "./mock/leaderboard";

/**
 * Single place the UI reaches for data.
 *
 * Phase 1 → these are the mock repositories.
 * Phase 2 → swap each entry for a Supabase repository:
 *
 *   import { supabaseDeveloperService } from "./supabase/developer";
 *   export const services: ArenaServices = {
 *     developers: supabaseDeveloperService,
 *     // ...
 *   };
 *
 * Nothing above this file imports from `@/lib/mock` directly.
 */
export const services: ArenaServices = {
  developers: developerService,
  pathways: pathwayService,
  challenges: challengeService,
  submissions: submissionService,
  opportunities: opportunityService,
  teaching: teachingService,
  help: helpService,
  progress: progressService,
  insights: insightService,
  unlocks: unlockService,
  leaderboard: leaderboardService,
};

export const mockServices = services;

export * from "./contracts";
export { NOW, NOW_MS } from "@/lib/mock/clock";
export { CURRENT_DEVELOPER_ID, INSTRUCTOR, pathways, titles } from "@/lib/mock/pathways";
export { currentDeveloperFor } from "./mock/developer";
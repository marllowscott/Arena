import type {
  DeveloperSummary,
  InstructorAttention,
  PathwayId,
  PathwayProgress,
} from "@/lib/types";
import { buildPathwayProgress } from "@/lib/progression";
import type {
  CurrentDeveloper,
  DeveloperRecord,
  DeveloperService,
} from "../contracts";
import { developers, developersById } from "@/lib/mock/developers";
import { CURRENT_DEVELOPER_ID, pathwayById, pathways, titlesForPathway } from "@/lib/mock/pathways";
import { submissions } from "@/lib/mock/submissions";
import { teachingProposals } from "@/lib/mock/teaching";
import { helpRequests } from "@/lib/mock/help";
import { opportunities } from "@/lib/mock/opportunities";
import { insights } from "@/lib/mock/insights";
import { unlocksFor } from "@/lib/mock/unlocks";

export function pathwayProgressFor(developer: DeveloperRecord): PathwayProgress[] {
  const highlights: Record<PathwayId, string> = {
    builder: "Shipped the settings migration with no downtime.",
    "problem-solver": "Found the session refresh defect nobody could reproduce.",
    teacher: "Ran Git Rebase Without Fear for six developers.",
    mentor: "Unblocked Tafadzwa on a TypeScript union.",
    scout: "Caught a closed listing on the Scout board.",
  };

  return pathways.map((pathway) =>
    buildPathwayProgress({
      developerId: developer.id,
      pathwayId: pathway.id,
      xp: developer.pathwayXp[pathway.id],
      titles: titlesForPathway(pathway.id),
      recentAchievement:
        developer.id === CURRENT_DEVELOPER_ID ? highlights[pathway.id] : "Progress recorded this cycle.",
    }),
  );
}

/**
 * Builds the signed-in view for any roster member. The login screen picks one,
 * and every screen reads from this — so switching identity is a state change
 * rather than a second hard-coded constant.
 */
export function currentDeveloperFor(developerId: string): CurrentDeveloper {
  const developer = developersById[developerId] ?? developersById[CURRENT_DEVELOPER_ID];
  const progress = pathwayProgressFor(developer);
  const primary = progress.find((item) => item.pathwayId === developer.primaryPathway)!;

  return {
    developer,
    pathways: progress,
    primaryPathway: pathwayById(developer.primaryPathway),
    currentTitle: primary.currentTitle,
    nextTitle: primary.nextTitle,
    xpToNextTitle: primary.xpToNextTitle,
    pathwayXpTotal: Object.values(developer.pathwayXp).reduce((sum, xp) => sum + xp, 0),
  };
}

export function currentDeveloper(): CurrentDeveloper {
  return currentDeveloperFor(CURRENT_DEVELOPER_ID);
}

export const developerService: DeveloperService = {
  list: () => developers,

  current: currentDeveloper,

  byId: (id) => developersById[id] ?? null,

  pathwayProgress: (developerId) => {
    const developer = developersById[developerId];
    return developer ? pathwayProgressFor(developer) : [];
  },

  summary: (developerId): DeveloperSummary => {
    const developer = developersById[developerId];
    const progress = pathwayProgressFor(developer);
    const approved = submissions.filter(
      (submission) => submission.developerId === developerId && submission.status === "approved",
    );
    const helped = helpRequests.filter((request) =>
      request.answers.some(
        (answer) => answer.authorId === developerId && answer.confirmed,
      ),
    ).length;
    const taught = teachingProposals.filter(
      (proposal) => proposal.proposedById === developerId,
    ).length;

    const next = progress
      .map((item) => item.nextTitle)
      .filter((title): title is NonNullable<typeof title> => title !== null)
      .sort((a, b) => a.xpRequired - b.xpRequired)[0];

    return {
      developer,
      pathways: progress,
      completedChallenges: approved.length,
      pendingSubmissions: submissions.filter(
        (submission) => submission.developerId === developerId && submission.status === "pending",
      ).length,
      peopleHelped: helped,
      topicsTaught: taught,
      opportunitiesDiscovered: opportunities.filter(
        (opportunity) => opportunity.discoveredByCount > 0,
      ).length,
      unlocks: unlocksFor(developerId),
      nextTitle: next?.name ?? "Top of the ladder",
      xpToNextTitle: next ? Math.max(0, next.xpRequired - developer.totalXp) : 0,
      lastActiveAt: developer.lastActiveAt,
      flags: insights
        .filter((insight) => insight.developerIds.includes(developerId))
        .map((insight) => insight.title),
    };
  },

  attention: (): InstructorAttention => {
    const submissions_ = submissions.filter((submission) => submission.status === "pending").length;
    // Shortlisted proposals need a scheduling decision, so they count too.
    const teaching = teachingProposals.filter(
      (proposal) => proposal.status === "open" || proposal.status === "shortlisted",
    ).length;
    const verify = opportunities.filter(
      (opportunity) => opportunity.verification !== "verified",
    ).length;
    const help = helpRequests.filter((request) => request.flagged).length;
    const titles = developers.filter((developer) =>
      insights.some(
        (insight) =>
          insight.kind === "ready-for-unlock" && insight.developerIds.includes(developer.id),
      ),
    ).length;

    return {
      submissions: submissions_,
      teaching,
      opportunities: verify,
      help,
      titles,
      total: submissions_ + teaching + verify + help + titles,
    };
  },
};
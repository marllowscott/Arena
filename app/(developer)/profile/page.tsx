import type { Metadata } from "next";
import { ProfileView } from "@/components/dev/profile-view";
import {
  confirmedHelpAnswersBy,
  helpAnswersBy,
  mySubmissions,
  profileFor,
  topicsProposedBy,
  xpEventsFor,
} from "@/lib/arena/data";
import {
  achievementsFor,
  listTitles,
  listUnlockCatalogue,
  ownUnlocks,
  pathwayXpFor,
  titlesFor,
} from "@/lib/arena/progression";
import { listPathways } from "@/lib/arena/data";
import { Card } from "@/components/ui/card";
import { ProfileEditForm } from "@/components/shared/profile-edit-form";
import { requireDeveloper } from "@/lib/arena/session";
import { buildPathwayProgress } from "@/lib/progression";
import type { Pathway, PathwayId } from "@/lib/types";

export const metadata: Metadata = {
  title: "Profile",
  description: "Pathways, achievements, unlocks and your completed work.",
};

export default async function ProfilePage() {
  const session = await requireDeveloper();
  const userId = session.userId;

  const [profile, pathways, titleRows, unlockCatalogue, pathwayXp, earned, achievements, xpEvents, submissions, helped, topicsProposed, answersWritten] =
    await Promise.all([
      profileFor(userId),
      listPathways(),
      listTitles(),
      listUnlockCatalogue(),
      pathwayXpFor(userId),
      ownUnlocks(userId),
      achievementsFor(userId),
      xpEventsFor(userId, 100),
      mySubmissions(userId, 100),
      confirmedHelpAnswersBy(userId),
      topicsProposedBy(userId),
      helpAnswersBy(userId),
    ]);

  if (!profile) throw new Error("Developer profile is missing.");

  const xpByPathway = new Map<PathwayId, number>(
    pathwayXp.map((row) => [row.pathway_id, row.xp]),
  );

  const progress = pathways.map((pathway) =>
    buildPathwayProgress({
      developerId: userId,
      pathwayId: pathway.id,
      xp: xpByPathway.get(pathway.id) ?? 0,
      titles: titlesFor(titleRows, pathway.id),
      recentAchievement: "Progress recorded this cycle.",
    }),
  );

  const typedPathways: Pathway[] = pathways.map((pathway) => ({
    id: pathway.id,
    name: pathway.name,
    tagline: pathway.tagline,
    description: pathway.description,
    icon: pathway.icon,
    shortName: pathway.short_name,
    order: pathway.sort_order,
    promise: pathway.promise,
  }));

  const completed = submissions.filter(
    (submission) => submission.status === "approved" || submission.status === "adjusted",
  ).length;
  const pending = submissions.filter((submission) => submission.status === "pending").length;

  return (
    <>
      <div className="px-4 py-8 sm:px-6">
        <Card className="mb-6 p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            Edit profile
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Update your name, handle, headline, and more.
          </p>
          <div className="mt-4">
            <ProfileEditForm profile={profile} pathways={typedPathways} />
          </div>
        </Card>
      </div>
      <ProfileView
      profile={profile}
      pathways={typedPathways}
      progress={progress}
      unlocks={unlockCatalogue}
      earned={earned}
      achievements={achievements}
      xpEvents={xpEvents.map((event) => ({
        id: event.id,
        xp: event.xp,
        label: event.label,
        detail: event.detail,
        source: event.source,
        pathwayId: event.pathway_id,
        createdAt: event.created_at,
      }))}
      submissions={submissions}
      counts={{
        completed,
        pending,
        helped: helped || answersWritten,
        topicsProposed,
        scoutXp: xpByPathway.get("scout") ?? 0,
      }}
      avatarUrl={profile.avatar_url ?? undefined}
    />
    </>
  );
}

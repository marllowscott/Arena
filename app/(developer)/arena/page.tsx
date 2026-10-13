import type { Metadata } from "next";
import { ListChecks, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ClaimButton } from "@/components/arena/claim-button";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { listOpenChallenges, myClaims, mySubmissions, listPathways } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Problems",
  description: "Claim a problem, submit evidence, earn XP on approval.",
};

export default async function ArenaPage() {
  const session = await requireDeveloper();
  const profile = session.profile!;

  const [challenges, claimIds, submissions, pathways] = await Promise.all([
    listOpenChallenges(),
    myClaims("challenge", profile.id),
    mySubmissions(profile.id),
    listPathways(),
  ]);

  const pathwayName = (id: string) =>
    pathways.find((pathway) => pathway.id === id)?.short_name ?? id;

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="The Arena"
        title="Problems"
        description="Instructor-posted problems. Claim one, do the work, submit evidence — XP is awarded when the instructor approves."
      />

      {challenges.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ListChecks}
            eyebrow="Arena"
            title="No problems posted yet"
            body="The instructor has not posted any open problems. Check back after the next session."
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {challenges.map((challenge) => {
            const claimed = claimIds.includes(challenge.id);
            const mine = submissions.find(
              (submission) => submission.challenge_id === challenge.id,
            );

            return (
              <li
                key={challenge.id}
                className="flex flex-col rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle transition-all duration-200 hover:border-ink-300 hover:shadow-raised"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge
                    difficulty={challenge.difficulty as never}
                    xp={challenge.xp}
                  />
                  <Badge tone="outline">{pathwayName(challenge.pathway_id)}</Badge>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    {challenge.estimated_effort}
                  </span>
                </div>

                <Link
                  href={`/arena/${challenge.slug}`}
                  className="mt-3 font-display text-base font-semibold leading-snug tracking-tight text-ink-900 hover:text-primary"
                >
                  {challenge.title}
                </Link>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">
                  {challenge.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-300 pt-3">
                  {mine ? (
                    <Link href={`/arena/${challenge.slug}`}>
                      <SubmissionStatusBadge status={mine.status} />
                    </Link>
                  ) : (
                    <ClaimButton
                      kind="challenge"
                      activityId={challenge.id}
                      claimed={claimed}
                    />
                  )}
                  <Link
                    href={`/arena/${challenge.slug}`}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                  >
                    {claimed || mine ? "View" : "Briefing"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-ink-400">
        <Search className="size-3.5" aria-hidden />
        Tip: claim a problem to mark it as yours, then submit your evidence
        from the problem page.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { ListChecks, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ClaimButton } from "@/components/arena/claim-button";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { FilterLinks } from "@/components/shared/filter-links";
import { SearchField } from "@/components/shared/search-field";
import { listOpenChallenges, myClaims, mySubmissions, listPathways } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Problems",
  description: "Claim a problem, submit evidence, earn XP on approval.",
};

const WORK_FILTERS = ["all", "unclaimed", "claimed", "submitted"] as const;

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireDeveloper();
  const profile = session.profile!;
  const params = await searchParams;

  const [challenges, claimIds, submissions, pathways] = await Promise.all([
    listOpenChallenges(),
    myClaims("challenge", profile.id),
    mySubmissions(profile.id),
    listPathways(),
  ]);

  const pathwayName = (id: string) =>
    pathways.find((pathway) => pathway.id === id)?.short_name ?? id;

  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().toLowerCase();
  const pathwayFilter = Array.isArray(params.pathway) ? params.pathway[0] : params.pathway ?? "all";
  const workFilter = Array.isArray(params.work) ? params.work[0] : params.work ?? "all";

  const visible = challenges.filter((challenge) => {
    if (pathwayFilter !== "all" && challenge.pathway_id !== pathwayFilter) return false;
    const claimed = claimIds.includes(challenge.id);
    const mine = submissions.some(
      (submission) => submission.challenge_id === challenge.id,
    );
    if (workFilter === "unclaimed" && (claimed || mine)) return false;
    if (workFilter === "claimed" && !claimed) return false;
    if (workFilter === "submitted" && !mine) return false;
    if (!query) return true;
    return `${challenge.title} ${challenge.summary} ${challenge.tags.join(" ")}`
      .toLowerCase()
      .includes(query);
  });

  const pathwayOptions = [
    { value: "all", label: "All pathways", count: challenges.length },
    ...pathways.map((pathway) => ({
      value: pathway.id as string,
      label: pathway.short_name,
      count: challenges.filter((challenge) => challenge.pathway_id === pathway.id).length,
    })),
  ];

  const workOptions = WORK_FILTERS.map((value) => ({
    value,
    label:
      value === "all"
        ? "All"
        : value === "unclaimed"
          ? "Not claimed"
          : value === "claimed"
            ? "Claimed"
            : "Submitted",
    count:
      value === "all"
        ? challenges.length
        : value === "unclaimed"
          ? challenges.filter(
              (challenge) =>
                !claimIds.includes(challenge.id) &&
                !submissions.some((submission) => submission.challenge_id === challenge.id),
            ).length
          : value === "claimed"
            ? challenges.filter(
                (challenge) =>
                  claimIds.includes(challenge.id) &&
                  !submissions.some((submission) => submission.challenge_id === challenge.id),
              ).length
            : challenges.filter((challenge) =>
                submissions.some((submission) => submission.challenge_id === challenge.id),
              ).length,
  }));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="The Arena"
        title="Problems"
        description="Instructor-posted problems. Claim one, do the work, submit evidence — XP is awarded when the instructor approves."
      />

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterLinks
            options={pathwayOptions}
            basePath="/arena"
            params={params}
            paramName="pathway"
            label="Filter problems by pathway"
            size="sm"
          />
          <SearchField
            name="q"
            defaultValue={query}
            placeholder="Search title, summary or tag"
            basePath="/arena"
            params={params}
            label="Search problems"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-sand-300 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
            Your work
          </span>
          <FilterLinks
            options={workOptions}
            basePath="/arena"
            params={params}
            paramName="work"
            label="Filter problems by your progress"
            size="sm"
          />
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
        {visible.length} of {challenges.length} problems
      </p>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ListChecks}
            eyebrow="Arena"
            title={challenges.length === 0 ? "No open problems available" : "Nothing matches that filter"}
            body={
              challenges.length === 0
                ? "There are no open problems available right now. New problems appear here when the instructor posts them."
                : "Clear the search or pick a different pathway to see the rest of the board."
            }
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {visible.map((challenge) => {
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

import type { Metadata } from "next";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { AssignmentForm } from "@/components/instructor/assignment-form";
import { AssignmentManager } from "@/components/instructor/assignment-manager";
import { AssignmentStatusControl } from "@/components/instructor/assignment-status-control";
import { FilterLinks } from "@/components/shared/filter-links";
import { SearchField } from "@/components/shared/search-field";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { claimsFor, listAllAssignments, listPathways, submissionsForChallenge } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";
import type { AssignmentRow } from "@/lib/arena/data";

export const metadata: Metadata = {
  title: "Assignments",
  description: "Post assignments and see who claimed them.",
};

const STATUS_FILTERS = ["all", "open", "locked", "closed", "draft"] as const;

export default async function InstructorChallengesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInstructor();
  const params = await searchParams;
  const [challenges, pathways] = await Promise.all([
    listAllAssignments(),
    listPathways(),
  ]);

  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().toLowerCase();
  const status = Array.isArray(params.status) ? params.status[0] : params.status ?? "all";

  const matches = (challenge: AssignmentRow) => {
    if (status !== "all" && challenge.status !== status) return false;
    if (!query) return true;
    return (
      challenge.title.toLowerCase().includes(query) ||
      challenge.summary.toLowerCase().includes(query) ||
      challenge.codename.toLowerCase().includes(query) ||
      challenge.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  };

  const submissionCounts = new Map<string, number>();
  await Promise.all(
    challenges.map(async (challenge) => {
      const submissions = await submissionsForChallenge(challenge.id);
      submissionCounts.set(challenge.id, submissions.length);
    }),
  );

  const visible = challenges
    .filter(matches)
    .filter((challenge) => (submissionCounts.get(challenge.id) ?? 0) === 0);

  const claimCounts = new Map<string, number>();
  await Promise.all(
    visible.map(async (challenge) => {
      const claims = await claimsFor("challenge", challenge.id);
      claimCounts.set(challenge.id, claims.length);
    }),
  );

  const statusOptions = STATUS_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : value,
    count:
      value === "all"
        ? challenges.length
        : challenges.filter((challenge) => challenge.status === value).length,
  }));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Content authority"
        title="Assignments"
        description="Create, edit, and manage assignments, deadlines, and XP. Developers claim assignments and submit evidence for your review."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Post an assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignmentForm pathwayOptions={pathways} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
            <FilterLinks
              options={statusOptions}
              basePath="/instructor/assignments"
              params={params}
              paramName="status"
              label="Filter assignments by status"
              size="sm"
            />
            <SearchField
              name="q"
              defaultValue={query}
              placeholder="Search title, summary or tag"
              basePath="/instructor/assignments"
              params={params}
              label="Search assignments"
            />
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
            {visible.length} of {challenges.length} problems
          </p>

          {visible.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Target}
                eyebrow="Catalogue"
                title={challenges.length === 0 ? "No assignments posted" : "Nothing matches that filter"}
                body={
                  challenges.length === 0
                    ? "Post the first assignment on the left. Developers will see it on their Arena board immediately."
                    : "Clear the search or pick a different status to see the rest of the catalogue."
                }
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {visible.map((challenge) => (
                <AssignmentRowCard
                  key={challenge.id}
                   challenge={challenge}
                   pathwayOptions={pathways}
                   claimCount={claimCounts.get(challenge.id) ?? 0}
                   hasSubmissions={(submissionCounts.get(challenge.id) ?? 0) > 0}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

async function AssignmentRowCard({
  challenge,
  pathwayOptions,
  claimCount,
  hasSubmissions = false,
}: {
  challenge: AssignmentRow;
  pathwayOptions: Awaited<ReturnType<typeof listPathways>>;
  claimCount: number;
  hasSubmissions?: boolean;
}) {
  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={challenge.difficulty as never} xp={challenge.xp} />
        <Badge tone={challenge.status === "open" ? "support" : "neutral"}>
          {challenge.status}
        </Badge>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          {relativeTime(challenge.created_at, nowMs())}
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
          {claimCount} {claimCount === 1 ? "claim" : "claims"}
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-400">
        Deadline: {challenge.deadline ? new Date(challenge.deadline).toLocaleString() : "None"}
      </p>
      <h2 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
        {challenge.title}
      </h2>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
        {challenge.summary}
      </p>
      <div className="mt-3">
        <AssignmentStatusControl assignmentId={challenge.id} status={challenge.status} />
      </div>
      <AssignmentManager challenge={challenge} pathwayOptions={pathwayOptions} hasSubmissions={hasSubmissions} />
    </li>
  );
}

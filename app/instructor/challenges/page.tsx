import type { Metadata } from "next";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { ProblemForm } from "@/components/instructor/problem-form";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { claimsFor, listAllChallenges, listPathways } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";
import type { ChallengeRow } from "@/lib/arena/data";

export const metadata: Metadata = {
  title: "Problems",
  description: "Post problems and see who claimed them.",
};

export default async function InstructorChallengesPage() {
  await requireInstructor();
  const [challenges, pathways] = await Promise.all([
    listAllChallenges(),
    listPathways(),
  ]);

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Content authority"
        title="Problems"
        description="Post a problem with an XP value. Developers claim it, submit evidence, and you approve — that approval is what pays the XP."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Post a problem</CardTitle>
            </CardHeader>
            <CardContent>
              <ProblemForm pathwayOptions={pathways} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {challenges.length === 0 ? (
            <EmptyState
              icon={Target}
              eyebrow="Catalogue"
              title="No problems posted"
              body="Post the first problem on the left. Developers will see it on their Arena board immediately."
            />
          ) : (
            <ul className="space-y-3">
              {challenges.map((challenge) => (
                <ChallengeRowCard key={challenge.id} challenge={challenge} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

async function ChallengeRowCard({ challenge }: { challenge: ChallengeRow }) {
  const claimRows = await claimsFor("challenge", challenge.id);
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
          {claimRows.length} {claimRows.length === 1 ? "claim" : "claims"}
        </span>
      </div>
      <h2 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
        {challenge.title}
      </h2>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
        {challenge.summary}
      </p>
    </li>
  );
}

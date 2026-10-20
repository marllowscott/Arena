import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ClaimButton } from "@/components/arena/claim-button";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { EvidenceForm } from "@/components/arena/evidence-form";
import { formatXp } from "@/lib/format";
import {
  claimsFor,
  findChallenge,
  myClaim,
  mySubmissions,
} from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}): Promise<Metadata> {
  const { challengeId } = await params;
  const challenge = await findChallenge(challengeId);
  return {
    title: challenge?.title ?? "Problem",
    description: challenge?.summary ?? "Dev Arena problem",
  };
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const session = await requireDeveloper();
  const profile = session.profile!;

  const challenge = await findChallenge(challengeId);

  if (!challenge) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <EmptyState
          icon={Target}
          title="Problem not found"
          body="This problem may have been closed or the link is wrong."
          action={
            <Link href="/arena">
              <Badge tone="primary">Back to problems</Badge>
            </Link>
          }
        />
      </div>
    );
  }

  const [myClaimRow, claimRows, mySubs] = await Promise.all([
    myClaim("challenge", challenge.id, profile.id),
    claimsFor("challenge", challenge.id),
    mySubmissions(profile.id),
  ]);

  const claimed = myClaimRow !== null;
  const mySubmission = mySubs.find(
    (submission) => submission.challenge_id === challenge.id,
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <Link
        href="/arena"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 hover:text-ink-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All problems
      </Link>

      <PageHeader
        eyebrow={`Problem · ${challenge.estimated_effort} effort`}
        title={challenge.title}
        description={challenge.summary}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={challenge.difficulty as never} xp={challenge.xp} />
            <Badge tone="outline">{challenge.pathway_id}</Badge>
            {challenge.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} tone="neutral" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
                {challenge.mission}
              </p>
            </CardContent>
          </Card>

          {challenge.why_it_matters ? (
            <Card>
              <CardHeader>
                <CardTitle>Why it matters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
                  {challenge.why_it_matters}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {challenge.requirements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-600">
                  {challenge.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {challenge.evidence.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Evidence that helps the review</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-600">
                  {challenge.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {claimed ? (
                <>
                  <p className="text-sm leading-relaxed text-ink-600">
                    You claimed this problem. Claiming does not award XP —
                    approval of your solution does.
                  </p>
                  <ClaimButton
                    kind="challenge"
                    activityId={challenge.id}
                    claimed
                  />
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-600">
                    Claiming means you are taking responsibility for solving
                    this problem.
                  </p>
                  <ClaimButton
                    kind="challenge"
                    activityId={challenge.id}
                    claimed={false}
                  />
                </>
              )}

              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                {claimRows.length}{" "}
                {claimRows.length === 1 ? "developer has" : "developers have"}{" "}
                claimed this
              </div>
            </CardContent>
          </Card>

          {claimed && !mySubmission ? (
            <Card>
              <CardHeader>
                <CardTitle>Submit your solution</CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenceForm
                  mode="challenge"
                  activityId={challenge.id}
                  xp={challenge.xp}
                />
              </CardContent>
            </Card>
          ) : null}

          {mySubmission ? (
            <Card>
              <CardHeader>
                <CardTitle>Your submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SubmissionStatusBadge status={mySubmission.status} />
                {mySubmission.awarded_xp ? (
                  <p className="font-display text-xl font-bold text-primary">
                    +{formatXp(mySubmission.awarded_xp)} XP awarded
                  </p>
                ) : (
                  <p className="text-sm text-ink-500">
                    {mySubmission.status === "returned"
                      ? "No XP on this pass. Fix what the reviewer asked for and resubmit."
                      : "Waiting for the instructor. XP is awarded only on approval."}
                  </p>
                )}
                {mySubmission.reviewer_note ? (
                  <blockquote className="rounded-md border-l-2 border-secondary bg-sand-100 px-3 py-2 text-sm italic text-ink-600">
                    {mySubmission.reviewer_note}
                  </blockquote>
                ) : null}
                {mySubmission.status === "returned" ? (
                  <EvidenceForm
                    mode="challenge"
                    activityId={challenge.id}
                    xp={challenge.xp}
                  />
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

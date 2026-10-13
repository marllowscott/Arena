import {
  ArrowRight,
  ListChecks,
  Presentation,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ClaimButton } from "@/components/arena/claim-button";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatXp, relativeTime } from "@/lib/format";
import { levelForXp } from "@/lib/progression";
import { nowMs } from "@/lib/arena/clock";
import {
  listOpenChallenges,
  myClaims,
  mySubmissions,
  notificationsFor,
  rankOf,
  xpEventsFor,
  listPathways,
} from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";
import type { ChallengeRow, SubmissionRow } from "@/lib/arena/data";

export default async function DeveloperDashboardPage() {
  const session = await requireDeveloper();
  const profile = session.profile!;

  const [
    openChallenges,
    claimIds,
    submissions,
    xpEvents,
    notifications,
    rank,
    pathways,
  ] = await Promise.all([
    listOpenChallenges(),
    myClaims("challenge", profile.id),
    mySubmissions(profile.id),
    xpEventsFor(profile.id, 8),
    notificationsFor(profile.id, 5),
    rankOf(profile.id),
    listPathways(),
  ]);

  const level = levelForXp(profile.total_xp);
  const pathwayName = (id: string) =>
    pathways.find((pathway) => pathway.id === id)?.short_name ?? id;

  const claimedChallenges = submissions
    .filter((submission) => submission.challenge_id)
    .map((submission) => submission.challenge_id) as string[];

  const waitingReview = submissions.filter(
    (submission) => submission.status === "pending",
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Developer dashboard"
        title={`Welcome back, ${profile.full_name.split(" ")[0]}`}
        description="Claim a problem, submit evidence, and the instructor awards XP on approval."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Current XP"
          value={formatXp(profile.total_xp)}
          hint={`${formatXp(profile.weekly_xp)} this week`}
          icon={Zap}
          tone="primary"
        />
        <StatCard
          label="Level"
          value={`${level.level}`}
          hint={`${formatXp(level.xpToNext)} XP to level ${level.level + 1}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Leaderboard"
          value={rank > 0 ? `#${rank}` : "—"}
          hint={`of ${rank > 0 ? "all developers" : "no rank yet"}`}
          icon={Trophy}
          tone="gold"
        />
        <StatCard
          label="Waiting for review"
          value={`${waitingReview.length}`}
          hint="XP lands on approval"
          icon={ListChecks}
          tone="support"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                Open problems
              </h2>
              <Link
                href="/arena"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {openChallenges.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Target}
                  eyebrow="Arena"
                  title="No problems posted yet"
                  body="The instructor posts problems here. Check back soon, or ask in your session."
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {openChallenges.slice(0, 3).map((challenge: ChallengeRow) => {
                  const claimed = claimIds.includes(challenge.id);
                  const mine = claimedChallenges.includes(challenge.id);
                  return (
                    <li
                      key={challenge.id}
                      className="flex flex-wrap items-center gap-4 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <DifficultyBadge difficulty={challenge.difficulty as never} xp={challenge.xp} />
                          <Badge tone="outline">{pathwayName(challenge.pathway_id)}</Badge>
                        </div>
                        <Link
                          href={`/arena/${challenge.slug}`}
                          className="mt-1.5 block font-display text-base font-semibold tracking-tight text-ink-900 hover:text-primary"
                        >
                          {challenge.title}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
                          {challenge.summary}
                        </p>
                      </div>
                      {mine ? (
                        <Link href={`/arena/${challenge.slug}`}>
                          <Badge tone="support">Work submitted</Badge>
                        </Link>
                      ) : (
                        <ClaimButton
                          kind="challenge"
                          activityId={challenge.id}
                          claimed={claimed}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Your activity
            </h2>
            {submissions.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">
                Nothing submitted yet. Claim a problem above and send in your first
                solution — XP is awarded when the instructor approves it.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {submissions.slice(0, 6).map((submission: SubmissionRow) => (
                  <li
                    key={submission.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-sand-300 bg-sand-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-800">
                        {submission.challenge_title ?? submission.topic_title}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        Submitted {relativeTime(submission.submitted_at, nowMs())}
                        {submission.awarded_xp
                          ? ` · +${formatXp(submission.awarded_xp)} XP awarded`
                          : ""}
                      </div>
                    </div>
                    <SubmissionStatusBadge status={submission.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Recently awarded XP
            </h2>
            {xpEvents.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">
                Your XP history starts here. Approved work pays out.
              </p>
            ) : (
              <ol className="mt-4 space-y-1">
                {xpEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sand-200/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink-700">{event.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        {pathwayName(event.pathway_id)} ·{" "}
                        {relativeTime(event.created_at, nowMs())}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-primary">
                      +{formatXp(event.xp)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Latest notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">No notifications yet.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="rounded-md border border-sand-300 bg-sand-50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-ink-800">
                      {notification.headline}
                    </p>
                    {notification.body ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                        {notification.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Link
            href="/topics"
            className="flex items-center gap-2 rounded-md border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-sand-100 transition-colors hover:bg-ink-700"
          >
            <Presentation className="size-4 text-secondary" aria-hidden />
            Present a topic and earn teacher XP
            <ArrowRight className="ml-auto size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

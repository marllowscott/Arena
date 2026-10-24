import type { Metadata } from "next";
import {
  ArrowRight,
  Bell,
  Compass,
  LifeBuoy,
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
import { Card } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ClaimButton } from "@/components/arena/claim-button";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PathwayCard } from "@/components/shared/pathway-card";
import { formatXp, relativeTime } from "@/lib/format";
import { levelForXp, buildPathwayProgress } from "@/lib/progression";
import { nowMs } from "@/lib/arena/clock";
import {
  listOpenChallenges,
  myClaims,
  mySubmissions,
  notificationsFor,
  rankOf,
  xpEventsFor,
  listPathways,
  listTopics,
} from "@/lib/arena/data";
import { listTitles, pathwayXpFor, titlesFor } from "@/lib/arena/progression";
import { readHubAnnouncements } from "@/lib/arena/hub";
import { requireDeveloper } from "@/lib/arena/session";
import { createClient } from "@/lib/supabase/server";
import type { AssignmentRow, SubmissionRow } from "@/lib/arena/data";
import type { Pathway } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Claim work, submit evidence, and track your progress.",
};

export default async function DeveloperDashboardPage() {
  const session = await requireDeveloper();
  const profile = session.profile!;
  const isFirstDashboardVisit =
    Date.parse(profile.created_at) === Date.parse(profile.last_active_at);

  if (isFirstDashboardVisit) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) {
      throw new Error(`Could not record the dashboard visit: ${error.message}`);
    }
  }

  const [
    openChallenges,
    claimIds,
    topicClaimIds,
    submissions,
    xpEvents,
    notifications,
    rank,
    pathways,
    titles,
    pathwayXp,
    topics,
    announcements,
  ] = await Promise.all([
    listOpenChallenges(),
    myClaims("challenge", profile.id),
    myClaims("topic", profile.id),
    mySubmissions(profile.id),
    xpEventsFor(profile.id, 8),
    notificationsFor(profile.id, 5),
    rankOf(profile.id),
    listPathways(),
    listTitles(),
    pathwayXpFor(profile.id),
    listTopics(),
    readHubAnnouncements(),
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

  /* Work the developer has taken responsibility for but has not sent in yet. */
  const inProgressChallenges = openChallenges.filter(
    (challenge) =>
      claimIds.includes(challenge.id) && !claimedChallenges.includes(challenge.id),
  );
  const inProgressTopics = topics.filter((topic) => topicClaimIds.includes(topic.id));

  const xpByPathway = new Map(pathwayXp.map((row) => [row.pathway_id, row.xp]));
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

  const progress = typedPathways.map((pathway) =>
    buildPathwayProgress({
      developerId: profile.id,
      pathwayId: pathway.id,
      xp: xpByPathway.get(pathway.id) ?? 0,
      titles: titlesFor(titles, pathway.id),
      recentAchievement: "Progress recorded this cycle.",
    }),
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Developer dashboard"
        title={
          isFirstDashboardVisit
            ? "Welcome"
            : `Welcome back, ${profile.full_name.split(" ")[0]}`
        }
        description="Claim a problem, submit evidence, and the instructor awards XP on approval."
      />

      {announcements.length > 0 ? (
        <section className="mt-6 space-y-2" aria-label="Hub announcements">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className="flex items-start gap-3 border-secondary-line bg-secondary-tint/40 p-4"
            >
              <Bell className="mt-0.5 size-4 shrink-0 text-secondary-muted" aria-hidden />
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-ink-900">
                  {announcement.headline}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{announcement.body}</p>
                {announcement.publishedAt ? (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    {relativeTime(announcement.publishedAt, nowMs())}
                  </p>
                ) : null}
              </div>
            </Card>
          ))}
        </section>
      ) : null}

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
          hint={rank > 0 ? "of all developers" : "no rank yet"}
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
                  title="No open problems available"
                  body="There are no open problems available right now. Check back when the instructor posts more."
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {openChallenges.slice(0, 3).map((challenge: AssignmentRow) => {
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
              Work you have claimed
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              You are responsible for these. Send the evidence in and the
              instructor decides the XP.
            </p>
            {inProgressChallenges.length === 0 && inProgressTopics.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">
                Nothing claimed right now. Claim a problem or a topic to start
                tracking progress here.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {inProgressChallenges.map((challenge) => (
                  <li
                    key={challenge.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-sand-300 bg-sand-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/arena/${challenge.slug}`}
                        className="truncate text-sm font-medium text-ink-800 hover:text-primary"
                      >
                        {challenge.title}
                      </Link>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        {pathwayName(challenge.pathway_id)} · {challenge.estimated_effort} · up to{" "}
                        {challenge.xp} XP
                      </div>
                    </div>
                    <Link
                      href={`/arena/${challenge.slug}`}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                    >
                      Submit evidence
                    </Link>
                  </li>
                ))}
                {inProgressTopics.map((topic) => (
                  <li
                    key={topic.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-sand-300 bg-sand-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-sm font-medium text-ink-800">
                        {topic.title}
                      </span>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        Topic presentation · up to {topic.xp_reward} XP
                      </div>
                    </div>
                    <Link
                      href="/topics"
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                    >
                      Present this topic
                    </Link>
                  </li>
                ))}
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
              Find work
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                {
                  href: "/arena",
                  icon: ListChecks,
                  label: "Problems to solve",
                  hint: "Instructor-posted briefs worth XP",
                },
                {
                  href: "/topics",
                  icon: Presentation,
                  label: "Topics to present",
                  hint: "Teacher pathway XP",
                },
                {
                  href: "/opportunities",
                  icon: Compass,
                  label: "Opportunities to scout",
                  hint: "Submit one and get it verified",
                },
                {
                  href: "/probe",
                  icon: LifeBuoy,
                  label: "Help and get helped",
                  hint: "Confirmed answers pay Mentor XP",
                },
              ].map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className="flex items-center gap-3 rounded-md border border-sand-300 bg-sand-50 px-4 py-3 transition-colors hover:border-ink-300 hover:shadow-subtle"
                  >
                    <entry.icon className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-800">
                        {entry.label}
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        {entry.hint}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-300" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Your pathways
            </h2>
            <div className="mt-4 space-y-3">
              {progress.slice(0, 3).map((item) => {
                const pathway = typedPathways.find((row) => row.id === item.pathwayId);
                if (!pathway) return null;
                return <PathwayCard key={pathway.id} pathway={pathway} progress={item} compact />;
              })}
            </div>
            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
            >
              See every pathway
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </section>

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

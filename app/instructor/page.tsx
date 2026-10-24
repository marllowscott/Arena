import {
  ClipboardCheck,
  Compass,
  ListChecks,
  LifeBuoy,
  Presentation,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { flaggedProbeCount, hubActivity, pendingOpportunities, pendingSubmissions } from "@/lib/arena/data";
import { listManagedDevelopers } from "@/lib/arena/developer-management";
import { requireInstructor } from "@/lib/arena/session";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";

export default async function InstructorDashboardPage() {
  await requireInstructor();

  const [submissions, opportunities, roster, activity, flaggedProbes] = await Promise.all([
    pendingSubmissions(),
    pendingOpportunities(),
    listManagedDevelopers(),
    hubActivity(10),
    flaggedProbeCount(),
  ]);

  const topicPresentations = submissions.filter(
    (submission) => submission.topic_id !== null,
  );
  const assignmentSubmissions = submissions.filter(
    (submission) => submission.challenge_id !== null,
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Instructor workspace"
        title="Dashboard"
        description="You are the review authority. XP is paid only when you approve — never on claims, taps or submissions."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Link href="/instructor/review-queue">
          <StatCard
            label="Assignments to review"
            value={`${assignmentSubmissions.length}`}
            hint="Solutions waiting for you"
            icon={ListChecks}
            tone="primary"
          />
        </Link>
        <Link href="/instructor/review-queue">
          <StatCard
            label="Presentations to review"
            value={`${topicPresentations.length}`}
            hint="Topic presentations"
            icon={Presentation}
            tone="support"
          />
        </Link>
        <Link href="/instructor/opportunities">
          <StatCard
            label="Opportunities to verify"
            value={`${opportunities.length}`}
            hint="Submitted by developers"
            icon={Compass}
            tone="gold"
          />
        </Link>
        <Link href="/instructor/developers">
          <StatCard
            label="Developers"
            value={`${roster.length}`}
            hint="On the roster"
            icon={Users}
          />
        </Link>
        <Link href="/instructor/probes">
          <StatCard
            label="Flagged problem reports"
            value={`${flaggedProbes}`}
            hint="Privacy reports"
            icon={LifeBuoy}
            tone="gold"
          />
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Review queue
            </h2>
            <Link
              href="/instructor/review-queue"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
            >
              Open queue
            </Link>
          </div>
          {submissions.length === 0 ? (
            <p className="mt-3 text-sm text-ink-400">
              Nothing waiting. Approved work pays out automatically through
              the review.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {submissions.slice(0, 6).map((submission) => (
                <li
                  key={submission.id}
                  className="flex items-start gap-3 rounded-md border border-sand-300 bg-sand-50 px-4 py-3"
                >
                  <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-800">
                      {submission.developer_name ?? "Unknown developer"}
                    </div>
                    <div className="truncate text-xs text-ink-500">
                      {submission.challenge_title ?? submission.topic_title}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {submission.challenge_id ? "Problem" : "Presentation"} ·{" "}
                      {relativeTime(submission.submitted_at, nowMs())}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-primary">
                    {submission.suggested_xp} XP
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            Latest activity
          </h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-ink-400">
              Activity appears here as developers claim, submit and earn.
            </p>
          ) : (
            <ol className="mt-4 space-y-1">
              {activity.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sand-200/70"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-ink-700">
                      <span className="font-medium text-ink-900">
                        {event.developer_name ?? "A developer"}
                      </span>{" "}
                      <span className="text-ink-500">{event.message}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {event.kind} · {relativeTime(event.created_at, nowMs())}
                    </p>
                  </div>
                  {event.xp ? (
                    <span className="font-mono text-xs font-semibold tabular-nums text-primary">
                      +{formatXp(event.xp)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

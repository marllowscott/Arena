import type { Metadata } from "next";
import { Activity, LifeBuoy, ListChecks, Presentation, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  allClaims,
  hubActivity,
  leaderboard,
  listHelpRequests,
  pendingSubmissions,
  reviewedSubmissions,
} from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";

export const metadata: Metadata = {
  title: "Insights",
  description: "Participation across the hub.",
};

export default async function InstructorInsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInstructor();
  const params = await searchParams;

  const [roster, claims, pending, reviewed, probes, activity] = await Promise.all([
    leaderboard(),
    allClaims(),
    pendingSubmissions(),
    reviewedSubmissions(),
    listHelpRequests(),
    hubActivity(25),
  ]);

  const window = Array.isArray(params.window) ? params.window[0] : params.window ?? "30";
  const days = window === "7" ? 7 : window === "90" ? 90 : 30;
  const cutoff = nowMs() - days * 86400000;

  const claimsInWindow = claims.filter(
    (claim) => new Date(claim.claimed_at).getTime() >= cutoff,
  );
  const submissionsInWindow = [...pending, ...reviewed].filter(
    (submission) => new Date(submission.submitted_at).getTime() >= cutoff,
  );
  const approvedInWindow = reviewed.filter(
    (submission) =>
      submission.reviewed_at &&
      new Date(submission.reviewed_at).getTime() >= cutoff &&
      (submission.status === "approved" || submission.status === "adjusted"),
  );
  const xpInWindow = approvedInWindow.reduce(
    (total, submission) => total + (submission.awarded_xp ?? 0),
    0,
  );
  const activeDevelopers = roster.filter(
    (profile) =>
      profile.last_active_at && new Date(profile.last_active_at).getTime() >= cutoff,
  ).length;
  const answeredProbes = probes.filter((probe) => probe.answers.length > 0).length;

  const perDeveloper = roster
    .map((profile) => {
      const developerClaims = claims.filter(
        (claim) => claim.developer_id === profile.id,
      );
      const developerSubmissions = [...pending, ...reviewed].filter(
        (submission) => submission.developer_id === profile.id,
      );
      const developerApproved = developerSubmissions.filter(
        (submission) => submission.status === "approved" || submission.status === "adjusted",
      );
      const developerProbes = probes.filter(
        (probe) => probe.acceptedBy === profile.id && probe.answers.length > 0,
      );

      return {
        profile,
        claims: developerClaims.length,
        submissions: developerSubmissions.length,
        approved: developerApproved.length,
        probes: developerProbes.length,
        xp: developerApproved.reduce(
          (total, submission) => total + (submission.awarded_xp ?? 0),
          0,
        ),
      };
    })
    .sort((a, b) => b.xp - a.xp || b.submissions - a.submissions);

  const windowOptions = [
    { value: "7", label: "7 days", current: window === "7" },
    { value: "30", label: "30 days", current: window === "30" },
    { value: "90", label: "90 days", current: window === "90" },
  ];

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Participation"
        title="Insights"
        description="Who is turning up, what they are claiming, and how much work has been approved. Everything here is read from the ledger — nothing is estimated."
      />

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
          Window
        </span>
        {windowOptions.map((option) => (
          <a
            key={option.value}
            href={`/instructor/insights?window=${option.value}`}
            aria-current={option.current ? "true" : undefined}
            className={
              option.current
                ? "inline-flex h-8 items-center rounded-md bg-primary px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-50"
                : "inline-flex h-8 items-center rounded-md border border-sand-400 bg-sand-50 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500 hover:border-ink-300 hover:text-ink-800"
            }
          >
            {option.label}
          </a>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Active developers"
          value={`${activeDevelopers}`}
          hint={`of ${roster.length} on the roster`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Claims taken"
          value={`${claimsInWindow.length}`}
          hint="in the window"
          icon={ListChecks}
        />
        <StatCard
          label="Submissions"
          value={`${submissionsInWindow.length}`}
          hint="sent in"
          icon={Presentation}
          tone="support"
        />
        <StatCard
          label="XP approved"
          value={formatXp(xpInWindow)}
          hint={`${approvedInWindow.length} approvals`}
          icon={TrendingUp}
          tone="gold"
        />
        <StatCard
          label="Probes answered"
          value={`${answeredProbes}`}
          hint={`of ${probes.length} threads`}
          icon={LifeBuoy}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Participation by developer
        </h2>
        {perDeveloper.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Users}
              eyebrow="Roster"
              title="No developers yet"
              body="Invite developers from the Developers page and their activity starts showing up here."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-sand-300 bg-sand-50 shadow-subtle">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="border-b border-sand-300 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                  <th className="px-4 py-2.5 font-normal">Developer</th>
                  <th className="px-4 py-2.5 font-normal">Claims</th>
                  <th className="px-4 py-2.5 font-normal">Submissions</th>
                  <th className="px-4 py-2.5 font-normal">Approved</th>
                  <th className="px-4 py-2.5 font-normal">Probes helped</th>
                  <th className="px-4 py-2.5 font-normal">XP earned</th>
                  <th className="px-4 py-2.5 font-normal">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {perDeveloper.map((row) => (
                  <tr key={row.profile.id} className="hover:bg-sand-100/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-800">{row.profile.full_name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        @{row.profile.handle} · {row.profile.primary_pathway}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-600">{row.claims}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-600">{row.submissions}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-600">{row.approved}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-600">{row.probes}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-primary">
                      {formatXp(row.xp)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                      {row.profile.last_active_at
                        ? relativeTime(row.profile.last_active_at, nowMs())
                        : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Hub activity
        </h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            Activity appears as developers claim, submit and earn.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-sand-200 rounded-lg border border-sand-300 bg-sand-50">
            {activity.map((event) => (
              <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                <Activity className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-700">
                    <span className="font-medium text-ink-900">
                      {event.developer_name ?? "A developer"}
                    </span>{" "}
                    {event.message}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    {event.kind} · {relativeTime(event.created_at, nowMs())}
                  </p>
                </div>
                {event.xp ? (
                  <Badge tone="primary">+{formatXp(event.xp)} XP</Badge>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-6 text-xs leading-relaxed text-ink-400">
        Participation is counted from claims, submissions, approvals and the XP
        ledger — the same records the review queue is built from.
      </p>
    </div>
  );
}

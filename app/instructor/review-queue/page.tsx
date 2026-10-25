import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import {
  ReviewControls,
  SubmissionManagementControls,
  SubmissionPanel,
} from "@/components/instructor/review-controls";
import { FilterLinks } from "@/components/shared/filter-links";
import { ReviewHistory } from "@/components/instructor/review-history";
import { XpLedger } from "@/components/instructor/xp-ledger";
import { SearchField } from "@/components/shared/search-field";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { pendingSubmissions, recentXpEvents, reviewedSubmissions } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Review queue",
  description: "Review developer submissions and award XP on approval.",
};

const QUEUE_FILTERS = ["all", "problems", "presentations"] as const;

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInstructor();
  const params = await searchParams;
  const [submissions, reviewed, xpEvents] = await Promise.all([
    pendingSubmissions(),
    reviewedSubmissions(),
    recentXpEvents(),
  ]);

  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().toLowerCase();
  const filter = Array.isArray(params.filter) ? params.filter[0] : params.filter ?? "all";

  const visible = submissions.filter((submission) => {
    if (filter === "problems" && !submission.challenge_id) return false;
    if (filter === "presentations" && submission.challenge_id) return false;
    if (!query) return true;
    const haystack = `${submission.developer_name ?? ""} ${
      submission.challenge_title ?? submission.topic_title ?? ""
    }`.toLowerCase();
    return haystack.includes(query);
  });

  const filterOptions = QUEUE_FILTERS.map((value) => ({
    value,
    label:
      value === "all"
        ? "Everything"
        : value === "problems"
          ? "Problem solutions"
          : "Topic presentations",
    count:
      value === "all"
        ? submissions.length
        : submissions.filter((submission) =>
            value === "problems" ? Boolean(submission.challenge_id) : !submission.challenge_id,
          ).length,
  }));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Review authority"
        title="Review queue"
        description="Every submission waits for your call. Approve to award XP, adjust the figure, or return it for another pass. Nothing pays out without your approval."
      />

      {submissions.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
          <FilterLinks
            options={filterOptions}
            basePath="/instructor/review-queue"
            params={params}
            paramName="filter"
            label="Filter the review queue"
            size="sm"
          />
          <SearchField
            name="q"
            defaultValue={query}
            placeholder="Search developer or brief"
            basePath="/instructor/review-queue"
            params={params}
            label="Search the review queue"
          />
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ClipboardCheck}
            eyebrow="Queue"
            title={
              submissions.length === 0
                ? "Queue is clear"
                : "Nothing matches that filter"
            }
            body={
              submissions.length === 0
                ? "When a developer submits a solution or presents a topic, it lands here. XP is awarded only through your review."
                : "Clear the search or pick a different filter to see the rest of the queue."
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-6">
          {visible.map((submission) => (
            <li
              key={submission.id}
              className="rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Avatar
                  initials={(submission.developer_name ?? "D")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("") || "D"}
                  name={submission.developer_name ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {submission.developer_name ?? "Unknown developer"}
                  </div>
                  <div className="truncate text-xs text-ink-500">
                    {submission.challenge_title ?? submission.topic_title}
                  </div>
                </div>
                <Badge tone={submission.challenge_id ? "primary" : "support"}>
                  {submission.challenge_id ? "Problem solution" : "Topic presentation"}
                </Badge>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                  {relativeTime(submission.submitted_at, nowMs())}
                </span>
              </div>

              <SubmissionPanel submission={submission} />

              <ReviewControls submission={submission} />
              <SubmissionManagementControls submission={submission} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Recent review history
        </h2>
        <ReviewHistory reviewed={reviewed as never} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Recent XP ledger
        </h2>
        <XpLedger events={xpEvents as never} />
      </section>

      <p className="mt-6 text-xs leading-relaxed text-ink-400">
        Approval pays the XP figure suggested by the problem or topic row —
        or an adjusted amount you set. Returning pays nothing and tells the
        developer what to fix.
      </p>
    </div>
  );
}

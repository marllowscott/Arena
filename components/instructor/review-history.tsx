"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { SubmissionManagementControls } from "@/components/instructor/review-controls";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";

type ReviewedSubmission = {
  id: string;
  developer_name: string | null;
  challenge_title: string | null;
  topic_title: string | null;
  status: string;
  awarded_xp: number | null;
  reviewed_at: string | null;
  reviewer_name: string | null;
  reviewer_note: string | null;
};

export function ReviewHistory({ reviewed }: { reviewed: ReviewedSubmission[] }) {
  const [limit, setLimit] = useState(3);
  const visible = reviewed.slice(0, limit);
  const hasMore = limit < reviewed.length;
  const canCollapse = limit > 3;

  if (reviewed.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-400">
        Completed decisions and XP awards will appear here.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-4 space-y-2">
        {visible.map((submission) => (
          <li
            key={submission.id}
            className="rounded-md border border-sand-300 bg-sand-50 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink-800">
                {submission.developer_name ?? "Unknown developer"}
              </span>
              <span className="text-sm text-ink-500">
                · {submission.challenge_title ?? submission.topic_title}
              </span>
              <SubmissionStatusBadge status={submission.status as "pending" | "approved" | "adjusted" | "returned"} />
              {submission.awarded_xp ? (
                <span className="font-mono text-xs font-semibold text-primary">
                  +{formatXp(submission.awarded_xp)} XP
                </span>
              ) : null}
              <time
                className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                dateTime={submission.reviewed_at ?? undefined}
              >
                {submission.reviewed_at
                  ? relativeTime(submission.reviewed_at, nowMs())
                  : "Review time unavailable"}
              </time>
            </div>
            <p className="mt-1 text-xs text-ink-400">
              Reviewed by {submission.reviewer_name ?? "unknown instructor"}
            </p>
            {submission.reviewer_note ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">
                {submission.reviewer_note}
              </p>
            ) : null}
            <SubmissionManagementControls submission={submission as never} />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => setLimit((n) => Math.min(n + 10, reviewed.length))}
            className="text-sm font-medium text-primary hover:underline"
          >
            Show more ({reviewed.length - limit} remaining)
          </button>
        ) : null}
        {canCollapse ? (
          <button
            type="button"
            onClick={() => setLimit(3)}
            className="text-sm font-medium text-ink-400 hover:underline"
          >
            Show less
          </button>
        ) : null}
      </div>
    </>
  );
}
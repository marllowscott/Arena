import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReviewControls, SubmissionPanel } from "@/components/instructor/review-controls";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { pendingSubmissions } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Review queue",
  description: "Review developer submissions and award XP on approval.",
};

export default async function ReviewQueuePage() {
  await requireInstructor();
  const submissions = await pendingSubmissions();

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Review authority"
        title="Review queue"
        description="Every submission waits for your call. Approve to award XP, adjust the figure, or return it for another pass. Nothing pays out without your approval."
      />

      {submissions.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ClipboardCheck}
            eyebrow="Queue"
            title="Queue is clear"
            body="When a developer submits a solution or presents a topic, it lands here. XP is awarded only through your review."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {submissions.map((submission) => (
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
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-400">
        Approval pays the XP figure suggested by the problem or topic row —
        or an adjusted amount you set. Returning pays nothing and tells the
        developer what to fix.
      </p>
    </div>
  );
}

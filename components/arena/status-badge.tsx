import { Badge } from "@/components/ui/badge";
import type { SubmissionRow } from "@/lib/arena/data";

const SUBMISSION_TONES: Record<SubmissionRow["status"], "neutral" | "support" | "gold" | "primary"> = {
  pending: "neutral",
  approved: "support",
  adjusted: "gold",
  returned: "primary",
};

const SUBMISSION_LABELS: Record<SubmissionRow["status"], string> = {
  pending: "Awaiting review",
  approved: "Approved",
  adjusted: "Approved · adjusted",
  returned: "Returned",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionRow["status"] }) {
  return <Badge tone={SUBMISSION_TONES[status]}>{SUBMISSION_LABELS[status]}</Badge>;
}

const OPPORTUNITY_TONES: Record<string, "neutral" | "support" | "primary" | "gold"> = {
  pending: "neutral",
  approved: "support",
  rejected: "primary",
};

const OPPORTUNITY_LABELS: Record<string, string> = {
  pending: "Awaiting verification",
  approved: "Verified",
  rejected: "Rejected",
};

export function OpportunityStatusBadge({ reviewStatus }: { reviewStatus: string }) {
  return (
    <Badge tone={OPPORTUNITY_TONES[reviewStatus] ?? "neutral"}>
      {OPPORTUNITY_LABELS[reviewStatus] ?? reviewStatus}
    </Badge>
  );
}

export function TopicStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    open: "Open for presentation",
    scheduled: "Scheduled",
    delivered: "Delivered",
  };
  return <Badge tone="outline">{labels[status] ?? status}</Badge>;
}

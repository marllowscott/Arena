"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { retractTopicVote, voteTopicProposal } from "@/lib/arena/actions";
import { cn } from "@/lib/utils";

/**
 * Interest in a topic proposal. The vote row itself lives in `proposal_votes`
 * with a "vote once" policy, so the browser can only ever write its own row.
 */
export function TopicVoteButton({
  proposalId,
  interestCount,
  hasVoted,
}: {
  proposalId: string;
  interestCount: number;
  hasVoted: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = hasVoted
        ? await retractTopicVote(proposalId)
        : await voteTopicProposal(proposalId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Saved.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant={hasVoted ? "secondary" : "outline"}
        tone="tech"
        disabled={pending}
        onClick={toggle}
        aria-pressed={hasVoted}
        className={cn(hasVoted && "border-secondary-line bg-secondary-tint text-secondary-muted")}
      >
        <ThumbsUp className="size-3.5" aria-hidden />
        {pending ? "Saving" : hasVoted ? "Interested" : "Interested"}
        <span className="tabular-nums">{interestCount}</span>
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
      {info ? <p className="text-xs text-support-deep">{info}</p> : null}
    </div>
  );
}

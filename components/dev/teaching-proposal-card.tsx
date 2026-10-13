"use client";

import * as React from "react";
import { ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { TeachingProposalWithAuthor } from "@/lib/services/contracts";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

const STATUS: Record<
  TeachingProposalWithAuthor["status"],
  { label: string; tone: "neutral" | "gold" | "support" | "outline" | "primary" }
> = {
  open: { label: "Open", tone: "outline" },
  shortlisted: { label: "Shortlisted", tone: "gold" },
  scheduled: { label: "Scheduled", tone: "support" },
  declined: { label: "Declined", tone: "neutral" },
  delivered: { label: "Delivered", tone: "neutral" },
};

export function TeachingProposalCard({
  proposal,
  className,
  compact = false,
}: {
  proposal: TeachingProposalWithAuthor;
  className?: string;
  compact?: boolean;
}) {
  const { voteProposal } = useDevArena();
  const pathway = services.pathways.byId(proposal.pathwayId)!;
  const accent = PATHWAY_ACCENT[pathway.icon];
  const status = STATUS[proposal.status];

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border bg-sand-50 p-5 shadow-subtle transition-shadow hover:shadow-raised",
        proposal.hasVoted ? "border-secondary-line" : "border-sand-300",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
            accent.bg,
            accent.border,
            accent.text,
          )}
        >
          <PathwayIcon name={pathway.icon} className="size-3" />
          {pathway.shortName}
        </span>
        <Badge tone={status.tone}>{status.label}</Badge>
        {proposal.sessionDate ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            Session {relativeTime(proposal.sessionDate, NOW_MS)}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3.5 font-display text-base font-semibold leading-snug tracking-tight text-ink-900">
        {proposal.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{proposal.summary}</p>

      {!compact ? (
        <ul className="mt-3 space-y-1.5">
          {proposal.outcomes.slice(0, 3).map((outcome) => (
            <li key={outcome} className="flex items-start gap-2 text-xs leading-relaxed text-ink-400">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-support" aria-hidden />
              {outcome}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-sand-300 pt-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar initials={proposal.authorInitials} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-ink-700">{proposal.authorName}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
              {relativeTime(proposal.createdAt, NOW_MS)}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] tabular-nums text-ink-400">
            {proposal.interestedCount} interested
          </span>
          <Button
            size="sm"
            tone="tech"
            variant={proposal.hasVoted ? "gold" : "secondary"}
            onClick={() => voteProposal(proposal.id)}
            aria-pressed={proposal.hasVoted}
          >
            <ThumbsUp className="size-3.5" aria-hidden />
            {proposal.hasVoted ? "Voted" : "Vote"}
          </Button>
        </div>
      </div>
    </article>
  );
}
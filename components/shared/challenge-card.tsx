import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DifficultyBadge } from "./difficulty-badge";
import { PathwayIcon, PATHWAY_ACCENT } from "./pathway-icon";
import { DIFFICULTY_META, deadlineLabel, formatXp } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { Challenge } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Full challenge card for the Arena grid. */
export function ChallengeCard({
  challenge,
  status,
  className,
}: {
  challenge: Challenge;
  status?: React.ReactNode;
  className?: string;
}) {
  const pathway = services.pathways.byId(challenge.pathwayId)!;
  const accent = PATHWAY_ACCENT[pathway.icon];
  const deadline = deadlineLabel(challenge.deadline, NOW_MS);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={challenge.difficulty} />
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
        </div>
        {challenge.recommended ? (
          <Badge tone="gold" size="sm">
            Recommended
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-4 font-display text-base font-semibold leading-snug tracking-tight text-ink-900">
        <Link href={`/arena/${challenge.slug}`} className="after:absolute after:inset-0">
          {challenge.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{challenge.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {challenge.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-xs bg-sand-200 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-sand-300 pt-3">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          <span
            className={cn(
              deadline.tone === "urgent" && "text-primary",
              deadline.tone === "soon" && "text-secondary-muted",
            )}
          >
            {deadline.label}
          </span>
          <span aria-hidden>·</span>
          <span>{challenge.estimatedEffort}</span>
          <span aria-hidden>·</span>
          <span>{challenge.completions} done</span>
        </div>
        <span className="font-mono text-xs font-semibold tabular-nums text-primary">
          +{formatXp(challenge.xp)} XP
        </span>
      </div>

      {status ? <div className="relative z-10 mt-3">{status}</div> : null}
    </article>
  );
}

/**
 * Compact mission card for the dashboard. Three at a time, no more — the point
 * is to pick one, not to browse.
 */
export function MissionCard({
  challenge,
  action,
}: {
  challenge: Challenge;
  action?: React.ReactNode;
}) {
  const pathway = services.pathways.byId(challenge.pathwayId)!;

  return (
    <article className="group relative flex items-stretch gap-4 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle transition-all duration-200 hover:border-ink-300 hover:shadow-raised">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
              PATHWAY_ACCENT[pathway.icon].bg,
              PATHWAY_ACCENT[pathway.icon].border,
              PATHWAY_ACCENT[pathway.icon].text,
            )}
          >
            <PathwayIcon name={pathway.icon} className="size-2.5" />
            {pathway.shortName}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            {DIFFICULTY_META[challenge.difficulty].label}
          </span>
        </div>

        <h3 className="mt-2 font-display text-sm font-semibold leading-snug tracking-tight text-ink-900">
          <Link href={`/arena/${challenge.slug}`} className="after:absolute after:inset-0">
            {challenge.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-400">
          {challenge.recommendationReason}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href={`/arena/${challenge.slug}`}
            className={cn(
              buttonVariants({ variant: "primary", size: "sm", tone: "tech" }),
              "relative z-10",
            )}
          >
            {challenge.status === "in-progress" ? "Resume mission" : "Start mission"}
          </Link>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-primary">
            +{formatXp(challenge.xp)} XP
          </span>
        </div>
      </div>
      {action ? <div className="relative z-10 flex shrink-0 items-center">{action}</div> : null}
    </article>
  );
}
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { XPProgressBar } from "@/components/ui/progress";
import { PathwayIcon, PATHWAY_ACCENT } from "./pathway-icon";
import { TitleBadge } from "./title-badge";
import { formatXp } from "@/lib/format";
import type { Pathway, PathwayProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PathwayCard({
  pathway,
  progress,
  compact = false,
  className,
}: {
  pathway: Pathway;
  progress: PathwayProgress;
  compact?: boolean;
  className?: string;
}) {
  const accent = PATHWAY_ACCENT[pathway.icon];

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle transition-shadow duration-200 hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md border",
              accent.bg,
              accent.border,
              accent.text,
            )}
          >
            <PathwayIcon name={pathway.icon} className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold tracking-tight text-ink-900">
              {pathway.name}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
              {compact ? pathway.promise : pathway.description}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-lg font-semibold tabular-nums text-ink-900">
            {formatXp(progress.xp)}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">XP</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <TitleBadge title={progress.currentTitle} tone="neutral" />
          {progress.nextTitle ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
              next
              <span className="text-ink-400">{progress.nextTitle.name}</span>
            </span>
          ) : (
            <Badge tone="gold" size="sm">
              Ladder complete
            </Badge>
          )}
        </div>
        <XPProgressBar
          value={progress.progress}
          tone={accent.bar}
          size="sm"
          label={`${pathway.name} progression`}
        />
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.1em]">
          <span className="text-ink-300">
            {progress.nextTitle
              ? `${formatXp(progress.xpToNextTitle)} XP to ${progress.nextTitle.name}`
              : "Top of the ladder"}
          </span>
          <span className="text-ink-300 tabular-nums">
            {formatXp(progress.currentTitle.xpRequired)} /{" "}
            {formatXp(progress.nextTitle?.xpRequired ?? progress.currentTitle.xpRequired)}
          </span>
        </div>
      </div>

      {!compact ? (
        <p className="mt-4 flex items-start gap-2 border-t border-sand-300 pt-3 text-xs leading-relaxed text-ink-400">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-secondary" aria-hidden />
          {progress.recentAchievement}
        </p>
      ) : null}
    </article>
  );
}
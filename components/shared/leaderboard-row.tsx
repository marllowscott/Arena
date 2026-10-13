import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatXp } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MovementPill({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-support-deep">
        <ArrowUp className="size-3" aria-hidden />
        {movement}
        <span className="sr-only">places climbed this week</span>
      </span>
    );
  }
  if (movement < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-ink-300">
        <ArrowDown className="size-3" aria-hidden />
        {Math.abs(movement)}
        <span className="sr-only">places dropped this week</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-300">
      <Minus className="size-3" aria-hidden />
      <span className="sr-only">no change</span>
    </span>
  );
}

export function LeaderboardRow({
  entry,
  metric = "weekly",
  showMovement = true,
  className,
}: {
  entry: LeaderboardEntry;
  metric?: "weekly" | "total";
  showMovement?: boolean;
  className?: string;
}) {
  const value = metric === "weekly" ? entry.weeklyXp : entry.totalXp;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors sm:px-4",
        entry.isCurrentDeveloper
          ? "border-primary-line bg-primary-tint/50"
          : "border-sand-300 bg-sand-50 hover:border-ink-300",
        className,
      )}
    >
      <span
        className={cn(
          "w-7 shrink-0 text-center font-display text-sm font-semibold tabular-nums",
          entry.rank <= 3 ? "text-primary" : "text-ink-300",
        )}
      >
        {entry.rank}
      </span>

      <Avatar
        initials={entry.initials}
        name={entry.name}
        from={entry.avatarFrom}
        to={entry.avatarTo}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink-800">{entry.name}</span>
          {entry.isCurrentDeveloper ? (
            <span className="shrink-0 rounded-xs bg-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-sand-50">
              You
            </span>
          ) : null}
        </div>
        <div className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          {entry.title}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-mono text-xs font-semibold tabular-nums text-ink-800">
          {metric === "weekly" ? "+" : ""}
          {formatXp(value)}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
          {metric === "weekly" ? "XP week" : "XP total"}
        </div>
      </div>

      {showMovement ? (
        <div className="w-10 shrink-0 text-right">
          <MovementPill movement={entry.movement} />
        </div>
      ) : null}
    </li>
  );
}
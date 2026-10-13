import * as React from "react";
import { XPProgressBar, SegmentedProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatXp } from "@/lib/format";

/**
 * The progression bar used everywhere a title is in sight. Deliberately shows
 * three things only: where you are, where you are going, and how far is left.
 */
export function TitleProgress({
  label,
  value,
  xpToNext,
  tone = "primary",
  track = "light",
  segmented = false,
  className,
}: {
  label?: string;
  value: number;
  xpToNext: number;
  tone?: "primary" | "secondary" | "support" | "hush";
  track?: "light" | "dark";
  segmented?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.12em]",
              track === "dark" ? "text-sand-300" : "text-ink-400",
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "font-mono text-[11px] tabular-nums",
              track === "dark" ? "text-sand-200" : "text-ink-500",
            )}
          >
            {formatXp(Math.round(value * 100))}%
          </span>
        </div>
      ) : null}

      {segmented ? (
        <SegmentedProgressBar
          value={value}
          tone={tone === "hush" ? "support" : tone === "secondary" ? "secondary" : tone === "support" ? "support" : "primary"}
          track={track}
        />
      ) : (
        <XPProgressBar value={value} tone={tone} track={track} size="md" />
      )}

      <div
        className={cn(
          "font-mono text-[11px] uppercase tracking-[0.12em]",
          track === "dark" ? "text-secondary-soft" : "text-secondary-muted",
        )}
      >
        {xpToNext > 0 ? `${formatXp(xpToNext)} XP to next title` : "Top of the ladder"}
      </div>
    </div>
  );
}

export function XPChip({
  value,
  size = "md",
  tone = "primary",
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "gold" | "dark" | "muted";
  className?: string;
}) {
  const tones = {
    primary: "text-primary",
    gold: "text-secondary-muted",
    dark: "text-secondary-soft",
    muted: "text-ink-400",
  }[tone];
  const sizes = {
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-sm",
  }[size];

  return (
    <span className={cn("font-mono font-semibold tabular-nums", tones, sizes, className)}>
      +{formatXp(value)} XP
    </span>
  );
}
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The XP bar. `tone` carries the pathway colour; `track` keeps it legible on
 * dark surfaces. Animation is width-only so it stays cheap.
 */
export function XPProgressBar({
  value,
  tone = "primary",
  track = "light",
  size = "md",
  className,
  delay = 0,
  label,
}: {
  value: number;
  tone?: "primary" | "secondary" | "support" | "hush";
  track?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
  label?: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const fill = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    support: "bg-support",
    hush: "bg-hush",
  }[tone];
  const trackColor =
    track === "dark" ? "bg-white/12" : "bg-sand-300";
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" }[size];

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full", trackColor, heights, className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progression"}
    >
      <div
        className={cn("h-full rounded-full animate-xp-fill", fill)}
        style={{ width: `${clamped * 100}%`, animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

/** Segmented XP bar — reads like a rank bar rather than a web progress bar. */
export function SegmentedProgressBar({
  value,
  segments = 16,
  tone = "primary",
  track = "light",
  className,
}: {
  value: number;
  segments?: number;
  tone?: "primary" | "secondary" | "support";
  track?: "light" | "dark";
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const filled = Math.round(clamped * segments);
  const active = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    support: "bg-support",
  }[tone];
  const empty = track === "dark" ? "bg-white/15" : "bg-sand-300";

  return (
    <div className={cn("flex w-full items-center gap-[3px]", className)} role="presentation">
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-3 flex-1 rounded-[1px] transition-colors duration-300",
            index < filled ? active : empty,
          )}
        />
      ))}
    </div>
  );
}
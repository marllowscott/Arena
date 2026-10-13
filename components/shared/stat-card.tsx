import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "primary" | "support" | "gold";
  className?: string;
}) {
  const tones = {
    neutral: "text-ink-800",
    primary: "text-primary",
    support: "text-support-deep",
    gold: "text-secondary-muted",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{label}</span>
        {Icon ? <Icon className={cn("size-4", tones)} aria-hidden /> : null}
      </div>
      <div className={cn("mt-2 font-display text-2xl font-semibold tabular-nums", tones)}>
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-ink-400">{hint}</p> : null}
    </div>
  );
}
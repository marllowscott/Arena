import * as React from "react";
import {
  Award,
  Bug,
  Compass,
  Flame,
  Hammer,
  LifeBuoy,
  Presentation,
  Rocket,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { XPChip } from "./xp-progress-bar";
import { relativeTime } from "@/lib/format";
import { NOW_MS } from "@/lib/services";
import type { Achievement } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  bug: Bug,
  hammer: Hammer,
  lifebuoy: LifeBuoy,
  presentation: Presentation,
  compass: Compass,
  rocket: Rocket,
  flame: Flame,
  trophy: Trophy,
  award: Award,
};

const KIND_TONE: Record<Achievement["kind"], string> = {
  title: "border-secondary-line bg-secondary-tint text-secondary-muted",
  challenge: "border-primary-line bg-primary-tint text-primary",
  help: "border-support/50 bg-support-tint text-support-deep",
  teaching: "border-support/50 bg-support-tint text-support-deep",
  scout: "border-hush-soft bg-hush-tint text-[#5c7a57]",
  project: "border-ink-600 bg-ink-800 text-secondary-soft",
  streak: "border-secondary-line bg-secondary-tint text-secondary-muted",
};

export function AchievementCard({
  achievement,
  className,
}: {
  achievement: Achievement;
  className?: string;
}) {
  const Icon = ICONS[achievement.icon] ?? Award;
  const tone = KIND_TONE[achievement.kind];

  return (
    <article
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-md border", tone)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-display text-sm font-semibold tracking-tight text-ink-900">
            {achievement.title}
          </h3>
          {achievement.xp > 0 ? <XPChip value={achievement.xp} size="sm" /> : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-400">{achievement.detail}</p>
        <time
          dateTime={achievement.earnedAt}
          className="mt-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
        >
          {relativeTime(achievement.earnedAt, NOW_MS)}
        </time>
      </div>
    </article>
  );
}
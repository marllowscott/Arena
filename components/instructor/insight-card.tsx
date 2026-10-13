import * as React from "react";
import {
  Activity,
  KeyRound,
  Lightbulb,
  PauseCircle,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PathwayIcon } from "@/components/shared/pathway-icon";
import { relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { Insight } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<Insight["kind"], React.ElementType> = {
  "strong-builder": TrendingUp,
  "consistent-helper": UserRoundCheck,
  stuck: PauseCircle,
  inactive: Activity,
  "ready-for-unlock": KeyRound,
  "teaching-demand": Lightbulb,
};

const TONE: Record<Insight["tone"], { badge: "support" | "gold" | "neutral"; accent: string }> = {
  positive: { badge: "support", accent: "border-support/50 bg-support-tint/40" },
  watch: { badge: "gold", accent: "border-secondary-line bg-secondary-tint/40" },
  info: { badge: "neutral", accent: "border-sand-300 bg-sand-50" },
};

/**
 * Insights describe a pattern, never a person. The copy and the layout are both
 * built to keep them that way.
 */
export function InsightCard({
  insight,
  compact = false,
  className,
}: {
  insight: Insight;
  compact?: boolean;
  className?: string;
}) {
  const Icon = KIND_ICON[insight.kind];
  const tone = TONE[insight.tone];
  const pathway = insight.pathwayId ? services.pathways.byId(insight.pathwayId) : null;
  const developers = insight.developerIds
    .map((id) => services.developers.byId(id))
    .filter(Boolean);

  return (
    <article
      className={cn(
        "rounded-lg border p-5 shadow-subtle transition-shadow hover:shadow-raised",
        tone.accent,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md border",
              insight.tone === "positive"
                ? "border-support/50 bg-sand-50 text-support-deep"
                : insight.tone === "watch"
                  ? "border-secondary-line bg-sand-50 text-secondary-muted"
                  : "border-sand-400 bg-sand-100 text-ink-500",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold tracking-tight text-ink-900">
              {insight.title}
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
              {insight.metric}
            </p>
          </div>
        </div>
        {pathway ? (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xs border border-sand-400 bg-sand-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500"
            title={pathway.name}
          >
            <PathwayIcon name={pathway.icon} className="size-2.5" />
            {pathway.shortName}
          </span>
        ) : null}
      </div>

      <p className={cn("text-sm leading-relaxed text-ink-600", compact ? "mt-3" : "mt-4")}>
        {insight.body}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand-300/70 pt-3">
        <div className="flex items-center gap-2">
          {developers.slice(0, 4).map((developer) =>
            developer ? (
              <Avatar
                key={developer.id}
                initials={developer.initials}
                name={developer.name}
                from={developer.avatarFrom}
                to={developer.avatarTo}
                size="sm"
                className="size-6 text-[9px]"
              />
            ) : null,
          )}
          {developers.length > 4 ? (
            <span className="font-mono text-[10px] text-ink-300">+{developers.length - 4}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={tone.badge} size="sm">
            {insight.tone === "positive" ? "Strength" : insight.tone === "watch" ? "Watch" : "Signal"}
          </Badge>
          <time
            dateTime={insight.raisedAt}
            className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300"
          >
            {relativeTime(insight.raisedAt, NOW_MS)}
          </time>
        </div>
      </div>
    </article>
  );
}

export function InsightGrid({ insights }: { insights: Insight[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

export function InsightEmptyState() {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm leading-relaxed text-ink-400">
        No patterns detected. Insights appear once there is enough activity to compare against.
      </p>
    </Card>
  );
}
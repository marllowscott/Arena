"use client";

import * as React from "react";
import {
  BadgeCheck,
  CalendarClock,
  MapPin,
  Monitor,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XPProgressBar } from "@/components/ui/progress";
import { OPPORTUNITY_PIPELINE } from "@/lib/progression";
import { deadlineLabel, formatXp } from "@/lib/format";
import { NOW_MS } from "@/lib/services";
import type { Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

const TYPE_LABEL: Record<Opportunity["type"], string> = {
  job: "Job",
  internship: "Internship",
  apprenticeship: "Apprenticeship",
  hackathon: "Hackathon",
  scholarship: "Scholarship",
  training: "Training",
  programme: "Programme",
};

const VERIFICATION: Record<
  Opportunity["verification"],
  { label: string; tone: "support" | "gold" | "neutral" }
> = {
  verified: { label: "Verified", tone: "support" },
  pending: { label: "Verifying", tone: "gold" },
  unverified: { label: "Unverified", tone: "neutral" },
};

export function OpportunityCard({
  opportunity,
  className,
}: {
  opportunity: Opportunity;
  className?: string;
}) {
  const { advanceOpportunity } = useDevArena();
  const stageIndex = OPPORTUNITY_PIPELINE.findIndex((stage) => stage.id === opportunity.stage);
  const nextStage = OPPORTUNITY_PIPELINE[stageIndex + 1];
  const verification = VERIFICATION[opportunity.verification];
  const stageXp = nextStage ? nextStage.xp - OPPORTUNITY_PIPELINE[stageIndex].xp : 0;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="outline">{TYPE_LABEL[opportunity.type]}</Badge>
        <Badge tone={verification.tone}>
          {opportunity.verification === "verified" ? <BadgeCheck className="size-3" /> : null}
          {verification.label}
        </Badge>
        {opportunity.verification === "verified" && opportunity.verifiedBy ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            by {opportunity.verifiedBy.split(" ")[0]}
          </span>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
        <Building2 className="size-3" aria-hidden />
        {opportunity.organisation}
      </div>
      <h3 className="mt-1 font-display text-base font-semibold leading-snug tracking-tight text-ink-900">
        {opportunity.role}
      </h3>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3" aria-hidden />
          {opportunity.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Monitor className="size-3" aria-hidden />
          {opportunity.mode}
        </span>
        <span className="inline-flex items-center gap-1.5 text-secondary-muted">
          <CalendarClock className="size-3" aria-hidden />
          {deadlineLabel(opportunity.deadline, NOW_MS).label}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{opportunity.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[...opportunity.technologies, ...opportunity.skills].slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="rounded-xs bg-sand-200 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 border-t border-sand-300 pt-3.5">
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          <span>
            {OPPORTUNITY_PIPELINE[stageIndex]?.label} → {nextStage?.label ?? "Acted"}
          </span>
          <span className="tabular-nums">{formatXp(opportunity.xpReward)} XP available</span>
        </div>
        <XPProgressBar value={opportunity.stageProgress} tone="support" size="sm" className="mt-2" />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            {opportunity.shares} shared · {opportunity.discoveredByCount} interested
          </span>
          {nextStage ? (
            <Button
              size="sm"
              tone="tech"
              variant="outline"
              onClick={() => advanceOpportunity(opportunity.id, nextStage.id)}
            >
              {nextStage.label} · +{stageXp}
            </Button>
          ) : (
            <Badge tone="support" size="sm">
              Fully actioned
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
}
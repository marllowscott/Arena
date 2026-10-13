"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  Check,
  CircleDot,
  Clock,
  Flag,
  Gauge,
  Lightbulb,
  ScrollText,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { TitleProgress } from "@/components/shared/xp-progress-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { MissionFact, SubmissionForm } from "./submission-form";
import { DIFFICULTY_META, deadlineLabel, formatXp, pluralise } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { Challenge } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

export function ChallengeBriefing({ challenge }: { challenge: Challenge }) {
  const { isAccepted, acceptMission, submissionFor, pathways } = useDevArena();
  const accepted = isAccepted(challenge.id);
  const submission = submissionFor(challenge.id);
  const pathway = services.pathways.byId(challenge.pathwayId)!;
  const accent = PATHWAY_ACCENT[pathway.icon];
  const progress = pathways.find((item) => item.pathwayId === challenge.pathwayId);
  const deadline = deadlineLabel(challenge.deadline, NOW_MS);

  const projectedXp = progress ? progress.xp + challenge.xp : challenge.xp;

  return (
    <PageContainer size="wide">
      <Link
        href="/arena"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 transition-colors hover:text-ink-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to the Arena
      </Link>

      <header className="mt-5 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">Mission briefing</Badge>
          <DifficultyBadge difficulty={challenge.difficulty} xp={challenge.xp} />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
              accent.bg,
              accent.border,
              accent.text,
            )}
          >
            <PathwayIcon name={pathway.icon} className="size-3" />
            {pathway.name}
          </span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {challenge.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-500">{challenge.summary}</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-md border border-primary-line bg-primary-tint text-primary">
                <Target className="size-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                Mission
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">{challenge.mission}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-md border border-secondary-line bg-secondary-tint text-secondary-muted">
                <Lightbulb className="size-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                Why it matters
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">{challenge.whyItMatters}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-md border border-sand-400 bg-sand-200 text-ink-500">
                <ScrollText className="size-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                Requirements
              </h2>
            </div>
            <ul className="mt-4 space-y-3">
              {challenge.requirements.map((requirement) => (
                <li key={requirement} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-sand-400 bg-sand-100">
                    <Check className="size-3 text-ink-400" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-ink-600">{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="eyebrow mb-3">Explain it</div>
              <p className="font-display text-sm font-medium leading-snug text-ink-800">
                {challenge.explainPrompt}
              </p>
            </Card>
            <Card className="p-5">
              <div className="eyebrow mb-3">What broke</div>
              <p className="font-display text-sm font-medium leading-snug text-ink-800">
                {challenge.brokePrompt}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-md border border-sand-400 bg-sand-200 text-ink-500">
                <Gauge className="size-4" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                How this is reviewed
              </h2>
            </div>
            <ul className="mt-4 divide-y divide-sand-200">
              {challenge.rubric.map((criterion) => (
                <li key={criterion.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{criterion.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                      {criterion.description}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-300">
                    {criterion.weight}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-sand-300 pt-3 text-xs leading-relaxed text-ink-400">
              Suggested XP is {formatXp(challenge.xp)}. The instructor may adjust it after review —
              the review note explains any change.
            </p>
          </Card>

          {accepted && !submission ? (
            <Card className="border-primary-line bg-primary-tint/30 p-6" id="submission">
              <div className="mb-6">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                  Submit your work
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  Mission accepted. Four sections, and none of them are long on purpose.
                </p>
              </div>
              <SubmissionForm challenge={challenge} />
            </Card>
          ) : null}

          {submission ? (
            <Card className="border-support/50 bg-support-tint/50 p-6">
              <div className="eyebrow mb-2">
                {submission.status === "pending" ? "Under review" : "Reviewed"}
              </div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                {challenge.title} is with the instructor
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
                {submission.status === "pending"
                  ? `${formatXp(submission.suggestedXp)} XP pending. You will be notified when it is approved.`
                  : submission.awardedXp !== null
                    ? `Approved for ${formatXp(submission.awardedXp)} XP.`
                    : "Returned for another pass."}
              </p>
              {submission.reviewerNote ? (
                <p className="mt-3 rounded-md border border-sand-300 bg-sand-50 px-3 py-2.5 text-sm leading-relaxed text-ink-600">
                  “{submission.reviewerNote}”
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>

        <aside className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-20">
            <Panel className="p-5">
              <div className="eyebrow text-secondary-soft">Mission facts</div>
              <div className="mt-3 divide-y divide-ink-700">
                <MissionFact label="Pathway" value={pathway.name} />
                <MissionFact
                  label="Difficulty"
                  value={DIFFICULTY_META[challenge.difficulty].label}
                />
                <MissionFact label="Reward" value={`+${formatXp(challenge.xp)} XP`} />
                <MissionFact label="Effort" value={challenge.estimatedEffort} />
                <MissionFact
                  label="Deadline"
                  value={deadline.label}
                />
                <MissionFact
                  label="Completed"
                  value={pluralise(challenge.completions, "developer")}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-ink-700 pt-4">
                {challenge.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xs bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Panel>

            {progress ? (
              <Panel className="p-5">
                <div className="flex items-center gap-2 text-secondary">
                  <CircleDot className="size-3.5" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                    What this moves
                  </span>
                </div>
                <div className="mt-3 font-display text-2xl font-bold tabular-nums text-sand-50">
                  {formatXp(progress.xp)} → {formatXp(projectedXp)}
                  <span className="ml-2 text-sm font-medium text-secondary">
                    +{formatXp(challenge.xp)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-sand-400">
                  {pathway.shortName} pathway XP
                </div>
                <div className="mt-4">
                  <TitleProgress
                    value={progress.progress}
                    xpToNext={Math.max(0, progress.xpToNextTitle - challenge.xp)}
                    tone="secondary"
                    track="dark"
                    segmented
                    label={`${progress.currentTitle.name} → ${progress.nextTitle?.name ?? "max"}`}
                  />
                </div>
              </Panel>
            ) : null}

            <Card className="p-5">
              {accepted ? (
                submission ? (
                  <div className="space-y-3">
                    <Badge tone="gold" size="lg">
                      {submission.status === "pending" ? "Awaiting review" : "Reviewed"}
                    </Badge>
                    <p className="text-sm leading-relaxed text-ink-500">
                      {submission.status === "pending"
                        ? "Nothing left to do here. Pick the next mission while you wait."
                        : "Read the review note before you move on."}
                    </p>
                    <Link
                      href="/arena"
                      className={cn(
                        buttonVariants({ variant: "primary", size: "md", tone: "tech" }),
                        "w-full",
                      )}
                    >
                      Find another mission
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge tone="support" size="lg">
                      Mission accepted
                    </Badge>
                    <p className="text-sm leading-relaxed text-ink-500">
                      Read the briefing, then submit your work. You can revise until you submit.
                    </p>
                    <a
                      href="#submission"
                      className={cn(
                        buttonVariants({ variant: "primary", size: "md", tone: "tech" }),
                        "w-full",
                      )}
                    >
                      <Flag className="size-4" aria-hidden />
                      Submit your work
                    </a>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-ink-500">
                    Accepting costs nothing. It marks the mission as yours so nobody else takes the
                    brief while you work on it.
                  </p>
                  <Button
                    size="lg"
                    tone="tech"
                    className="w-full"
                    onClick={() => acceptMission(challenge.id)}
                  >
                    Accept mission
                  </Button>
                  <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    <Clock className="size-3" aria-hidden />
                    {deadline.label}
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="eyebrow mb-3">Others who took this</div>
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <Users className="size-4 text-ink-300" aria-hidden />
                {pluralise(challenge.completions, "developer")} completed
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-400">
                Completion counts, not XP totals. Several strong developers failed this one first.
              </p>
            </Card>

            {challenge.status === "locked" ? (
              <EmptyState
                icon={Flag}
                title="Mission locked"
                body="This mission is not open to new submissions."
              />
            ) : null}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
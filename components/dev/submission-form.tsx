"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flag, Lightbulb, ListChecks, Wrench } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { EvidenceInput } from "./evidence-input";
import { formatXp } from "@/lib/format";
import type { Challenge, EvidenceItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

interface Errors {
  solution?: string;
  explainIt?: string;
  whatBroke?: string;
  howFixed?: string;
  evidence: Record<string, string>;
}

function SectionStep({
  index,
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  index: number;
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-4 sm:grid-cols-[2.5rem_1fr] sm:gap-5", className)}>
      <div className="flex items-center gap-2 sm:flex-col sm:items-center sm:gap-2">
        <span className="inline-flex size-10 items-center justify-center rounded-md border border-sand-400 bg-sand-100 text-ink-500">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300 sm:hidden">
          Step {index}
        </span>
        <span className="hidden h-full w-px bg-sand-300 sm:block" aria-hidden />
      </div>
      <div className="min-w-0 pb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            Step {index}
          </span>
          <h3 className="font-display text-base font-semibold tracking-tight text-ink-900">
            {title}
          </h3>
        </div>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

export function SubmissionForm({ challenge }: { challenge: Challenge }) {
  const { submitMission } = useDevArena();
  const [solution, setSolution] = React.useState("");
  const [evidence, setEvidence] = React.useState<EvidenceItem[]>([]);
  const [explainIt, setExplainIt] = React.useState("");
  const [whatBroke, setWhatBroke] = React.useState("");
  const [howFixed, setHowFixed] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({ evidence: {} });
  const [submitted, setSubmitted] = React.useState<{ xp: number } | null>(null);

  function validate(): boolean {
    const next: Errors = { evidence: {} };

    if (solution.trim().length < 40) {
      next.solution = "Describe what you built in a few sentences. Forty characters is the floor.";
    }
    if (explainIt.trim().length < 40) {
      next.explainIt = "Explain how it works. This is the part reviewers read first.";
    }
    if (whatBroke.trim().length < 15) {
      next.whatBroke = "Name the problem you hit, even if it was your own assumption.";
    }
    if (howFixed.trim().length < 15) {
      next.howFixed = "Say how you fixed it and why that fix holds.";
    }

    for (const requirement of challenge.evidence) {
      if (!requirement.required) continue;
      const item = evidence.find((candidate) => candidate.label === requirement.label);
      if (!item?.value) {
        next.evidence[requirement.id] = `${requirement.label} is required for this mission.`;
      }
    }

    setErrors(next);
    return (
      !next.solution &&
      !next.explainIt &&
      !next.whatBroke &&
      !next.howFixed &&
      Object.keys(next.evidence).length === 0
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const result = submitMission({
      challengeId: challenge.id,
      solution: solution.trim(),
      evidence,
      explainIt: explainIt.trim(),
      whatBroke: whatBroke.trim(),
      howFixed: howFixed.trim(),
    });
    setSubmitted({ xp: result.xpPending });
  }

  if (submitted) {
    return (
      <Card className="border-support/50 bg-support-tint/60 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-support-deep/40 bg-support-tint">
            <CheckCircle2 className="size-5 text-support-deep" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Mission submitted
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
              {formatXp(submitted.xp)} XP is pending review. Your evidence and explanation are with
              the instructor, and the XP lands the moment it is approved — you will see the
              notification and the progress change yourself.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/arena"
                className={cn(buttonVariants({ variant: "primary", size: "md", tone: "tech" }))}
              >
                Back to the Arena
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/leaderboard"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
              >
                See where you stand
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <SectionStep
        index={1}
        icon={ListChecks}
        title="Your solution"
        description="What you built and how far it got. Reviewers read this to understand scope before they look at evidence."
      >
        <Label htmlFor="solution">The work</Label>
        <Textarea
          id="solution"
          value={solution}
          onChange={(event) => setSolution(event.target.value)}
          aria-invalid={errors.solution ? true : undefined}
          placeholder="A settings module that syncs field data offline…"
          className={cn(errors.solution && "border-primary")}
        />
        {errors.solution ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
            {errors.solution}
          </p>
        ) : null}
      </SectionStep>

      <SectionStep
        index={2}
        icon={Flag}
        title="Evidence"
        description="Links only. Required items are marked."
      >
        <EvidenceInput
          requirements={challenge.evidence}
          value={evidence}
          onChange={setEvidence}
          errors={errors.evidence}
        />
      </SectionStep>

      <SectionStep
        index={3}
        icon={Lightbulb}
        title="Explain it"
        description={challenge.explainPrompt}
      >
        <Label htmlFor="explain">How does your solution work?</Label>
        <Textarea
          id="explain"
          value={explainIt}
          onChange={(event) => setExplainIt(event.target.value)}
          aria-invalid={errors.explainIt ? true : undefined}
          placeholder="The refresh replaced the session but the gate never re-evaluated, so…"
          className={cn(errors.explainIt && "border-primary")}
        />
        {errors.explainIt ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
            {errors.explainIt}
          </p>
        ) : null}
      </SectionStep>

      <SectionStep
        index={4}
        icon={Wrench}
        title="What broke"
        description={challenge.brokePrompt}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label htmlFor="broke">What went wrong</Label>
            <Textarea
              id="broke"
              value={whatBroke}
              onChange={(event) => setWhatBroke(event.target.value)}
              aria-invalid={errors.whatBroke ? true : undefined}
              placeholder="I assumed the token lifetime was the cause…"
              className={cn("min-h-24", errors.whatBroke && "border-primary")}
            />
            {errors.whatBroke ? (
              <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
                {errors.whatBroke}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="fixed">How you fixed it</Label>
            <Textarea
              id="fixed"
              value={howFixed}
              onChange={(event) => setHowFixed(event.target.value)}
              aria-invalid={errors.howFixed ? true : undefined}
              placeholder="Logging the token claims showed the refresh was succeeding…"
              className={cn("min-h-24", errors.howFixed && "border-primary")}
            />
            {errors.howFixed ? (
              <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
                {errors.howFixed}
              </p>
            ) : null}
          </div>
        </div>
      </SectionStep>

      <div className="rounded-lg border border-sand-400 bg-sand-100/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">Mission complete</div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
              Submitting locks your evidence in and queues it for review.{" "}
              <span className="font-mono text-xs text-primary">
                +{formatXp(challenge.xp)} XP on approval
              </span>
            </p>
          </div>
          <Button type="submit" size="lg" tone="tech" className="shrink-0">
            Submit mission
          </Button>
        </div>
      </div>
    </form>
  );
}

/** A compact field used by the briefing header. */
export function MissionFact({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="eyebrow">{label}</span>
      {value ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700">{value}</span>
      ) : (
        children
      )}
    </div>
  );
}
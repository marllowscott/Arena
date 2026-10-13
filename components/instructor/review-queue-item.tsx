"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  CornerUpLeft,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label, Textarea } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { formatXp, relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

const STATUS_TONE: Record<Submission["status"], "outline" | "support" | "gold" | "primary"> = {
  pending: "outline",
  approved: "support",
  adjusted: "gold",
  returned: "primary",
};

export function ReviewQueueItem({ submission }: { submission: Submission }) {
  const { reviewSubmission } = useDevArena();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"review" | "adjust" | "return">("review");
  const [awardedXp, setAwardedXp] = React.useState(String(submission.suggestedXp));
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const challenge = services.challenges.byId(submission.challengeId);
  const developer = services.developers.byId(submission.developerId);
  const decided = submission.status !== "pending";

  function decide(status: "approved" | "adjusted" | "returned") {
    const value = Number.parseInt(awardedXp, 10);
    if (status !== "returned") {
      if (Number.isNaN(value) || value < 0) {
        setError("Enter a whole number of XP.");
        return;
      }
      if (status === "adjusted" && value === submission.suggestedXp) {
        setError("The XP has not changed. Use approve if it is correct as it stands.");
        return;
      }
    }
    if (status !== "approved" && note.trim().length < 8) {
      setError("Write a note. The developer reads it and it is the only feedback they get.");
      return;
    }
    reviewSubmission({
      submissionId: submission.id,
      status,
      awardedXp: status === "returned" ? 0 : value,
      reviewerNote:
        note.trim() ||
        (status === "approved"
          ? "Reviewed against the rubric. Approved."
          : "Reviewed against the rubric."),
    });
    setError(null);
    setOpen(false);
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        decided && submission.status === "approved" && "border-support/50",
        decided && submission.status === "adjusted" && "border-secondary-line",
        decided && submission.status === "returned" && "border-primary-line",
      )}
    >
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar
            initials={developer?.initials ?? "??"}
            name={developer?.name}
            from={developer?.avatarFrom}
            to={developer?.avatarTo}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink-900">{developer?.name}</span>
              {challenge ? <DifficultyBadge difficulty={challenge.difficulty} showXp={false} /> : null}
              <Badge tone={STATUS_TONE[submission.status]}>{submission.status}</Badge>
            </div>
            <h3 className="mt-1.5 font-display text-sm font-semibold tracking-tight text-ink-800">
              {challenge?.title ?? "Mission"}
            </h3>
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-500">
              {submission.solution}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 lg:flex-col lg:items-end lg:gap-1">
          <div className="text-left lg:text-right">
            <div className="font-display text-xl font-bold tabular-nums text-primary">
              {formatXp(submission.awardedXp ?? submission.suggestedXp)} XP
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
              {submission.awardedXp !== null && submission.awardedXp !== submission.suggestedXp
                ? `suggested ${formatXp(submission.suggestedXp)}`
                : "suggested"}
            </div>
          </div>
          <time
            dateTime={submission.submittedAt}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300 lg:text-right"
          >
            {relativeTime(submission.submittedAt, NOW_MS)}
          </time>
        </div>
      </div>

      {decided && submission.reviewerNote ? (
        <p className="border-t border-sand-300 bg-sand-100/70 px-5 py-3 text-xs leading-relaxed text-ink-500">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
            Your note ·{" "}
          </span>
          {submission.reviewerNote}
        </p>
      ) : null}

      <div className="border-t border-sand-300 bg-sand-100/50 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen((value) => !value);
              setMode("review");
              setError(null);
            }}
            aria-expanded={open}
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
            {open ? "Hide evidence" : "Review evidence"}
          </Button>

          {!decided ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="success"
                size="sm"
                tone="tech"
                onClick={() => {
                  setAwardedXp(String(submission.suggestedXp));
                  decide("approved");
                }}
              >
                <CheckCircle2 className="size-3.5" aria-hidden />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                tone="tech"
                onClick={() => {
                  setMode("adjust");
                  setOpen(true);
                  setError(null);
                }}
              >
                <SlidersHorizontal className="size-3.5" aria-hidden />
                Adjust XP
              </Button>
              <Button
                variant="danger"
                size="sm"
                tone="tech"
                onClick={() => {
                  setMode("return");
                  setOpen(true);
                  setError(null);
                }}
              >
                <CornerUpLeft className="size-3.5" aria-hidden />
                Return
              </Button>
            </div>
          ) : (
            <Badge tone="neutral">Decided</Badge>
          )}
        </div>
      </div>

      {open ? (
        <div className="animate-fade-in space-y-5 border-t border-sand-300 p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="eyebrow mb-2">Explain it</div>
              <p className="text-sm leading-relaxed text-ink-600">{submission.explainIt}</p>
            </div>
            <div>
              <div className="eyebrow mb-2">What broke</div>
              <p className="text-sm leading-relaxed text-ink-600">{submission.whatBroke}</p>
              <div className="eyebrow mb-2 mt-4">How it was fixed</div>
              <p className="text-sm leading-relaxed text-ink-600">{submission.howFixed}</p>
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">Evidence</div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {submission.evidence.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-md border border-sand-300 bg-sand-50 px-3 py-2"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                    {item.kind}
                  </span>
                  <span className="truncate font-mono text-[11px] text-ink-600">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-2">Rubric</div>
            <ul className="divide-y divide-sand-200 rounded-md border border-sand-300">
              {submission.rubric.map((criterion) => (
                <li
                  key={criterion.id}
                  className="flex items-start justify-between gap-4 bg-sand-50 px-3 py-2.5"
                >
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
          </div>

          {!decided ? (
            <div
              className={cn(
                "rounded-lg border p-5",
                mode === "return" ? "border-primary-line bg-primary-tint/30" : "border-sand-300 bg-sand-100/70",
              )}
            >
              <div className="eyebrow mb-3">
                {mode === "return" ? "Return for another pass" : "Review decision"}
              </div>
              <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                <div>
                  <Label htmlFor={`xp-${submission.id}`}>XP to award</Label>
                  <Input
                    id={`xp-${submission.id}`}
                    type="number"
                    min={0}
                    value={awardedXp}
                    disabled={mode === "return"}
                    onChange={(event) => setAwardedXp(event.target.value)}
                    className="font-mono"
                  />
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    Suggested {formatXp(submission.suggestedXp)}
                  </p>
                </div>
                <div>
                  <Label htmlFor={`note-${submission.id}`}>Note to the developer</Label>
                  <Textarea
                    id={`note-${submission.id}`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="What was strong, and what to do differently next time."
                    className="min-h-24"
                  />
                </div>
              </div>

              {error ? (
                <p role="alert" className="mt-3 text-sm font-medium text-primary">
                  {error}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-300 pt-4">
                {mode === "return" ? (
                  <Button variant="danger" tone="tech" onClick={() => decide("returned")}>
                    <CornerUpLeft className="size-3.5" aria-hidden />
                    Return submission
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={mode === "adjust" ? "gold" : "success"}
                      tone="tech"
                      onClick={() => decide(mode === "adjust" ? "adjusted" : "approved")}
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      {mode === "adjust" ? "Approve at adjusted XP" : "Approve"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMode("review");
                        setError(null);
                      }}
                    >
                      Back
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {challenge ? (
            <Link
              href={`/arena/${challenge.slug}`}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
            >
              Open mission briefing
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}